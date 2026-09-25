import re
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Conversacion, Mensaje, Servicio, Producto, Usuario
from ..schemas import MensajeChatCreate
from ..auth import obtener_usuario_actual
from ..ai_utils import ErrorIA, obtener_proveedores, obtener_respuesta_ia

router = APIRouter(prefix="/api/chat", tags=["Chatbot"])

LIMITE_HISTORIAL = 20

# El widget muestra texto plano. Si el modelo devuelve Markdown pese a la
# instrucción, estas marcas se verían como asteriscos y almohadillas sueltas.
PATRONES_MARKDOWN = [
    (re.compile(r"\*\*(.+?)\*\*", re.DOTALL), r"\1"),              # **negrita**
    (re.compile(r"__(.+?)__", re.DOTALL), r"\1"),                    # __negrita__
    (re.compile(r"(?<!\w)\*(?!\s)(.+?)(?<!\s)\*(?!\w)"), r"\1"),    # *cursiva*
    (re.compile(r"`{1,3}(.+?)`{1,3}", re.DOTALL), r"\1"),            # `código`
    (re.compile(r"(?m)^#{1,6}\s*"), ""),                            # ## títulos
    (re.compile(r"(?m)^\s*[-*]\s+"), "\u2022 "),                     # viñetas
    (re.compile(r"\[(.+?)\]\((.+?)\)"), r"\1 (\2)"),                # [texto](url)
]


def _a_texto_plano(texto: str) -> str:
    for patron, reemplazo in PATRONES_MARKDOWN:
        texto = patron.sub(reemplazo, texto)
    return texto.strip()


def _construir_contexto_negocio(db: Session) -> str:
    """
    El 'system prompt' se arma dinámicamente con los servicios y productos
    REALES y ACTIVOS en la base de datos en este momento — nunca texto
    quemado, así la IA nunca ofrece algo que ya no existe o está inactivo.
    """
    servicios = db.query(Servicio).filter(Servicio.estado == "activo").all()
    productos = db.query(Producto).filter(Producto.estado == "activo").all()

    lineas_servicios = "\n".join(
        f"- {s.nombre} (${float(s.precio):,.0f}, {s.duracion_estimada})" for s in servicios
    ) or "Sin servicios disponibles por el momento."

    lineas_productos = "\n".join(
        f"- {p.nombre} (${float(p.precio):,.0f})" for p in productos
    ) or "Sin productos disponibles por el momento."

    return f"""
Eres el asistente virtual de Trazo Oscuro, un estudio de tatuajes en Medellín, Colombia.

INFORMACIÓN DEL NEGOCIO:
- Dirección: Cra 45 #26-85, Medellín, Colombia.
- Horario: Martes a Sábado, 11:00 a.m. a 7:00 p.m.
- Correo: contacto@trazooscuro.com

SERVICIOS DISPONIBLES:
{lineas_servicios}

PRODUCTOS DISPONIBLES:
{lineas_productos}

INSTRUCCIONES:
- Responde siempre en español, de forma cálida, breve (máximo 4-5 líneas) y profesional.
- Escribe en texto plano: el chat no interpreta Markdown, así que no uses **negritas**,
    ##títulos ni [enlaces](url). Para listas usa viñetas simples con el carácter •.
- Orienta sobre servicios, productos, horarios y el proceso de reserva: el cliente reserva
    desde la sección "Reservas" del sitio, eligiendo servicio, fecha y hora; el pago de
    servicios se realiza físicamente en el estudio.
- Si el cliente menciona una queja, reclamo, petición o sugerencia, indícale amablemente
    que puede registrar una PQR desde su cuenta, en la pestaña "PQR".
- Nunca inventes precios, servicios ni políticas que no aparezcan en esta información.
- Si no sabes algo con certeza, sé honesto y sugiere contactar directamente al estudio.
""".strip()


@router.post("/mensaje")
async def enviar_mensaje(
    datos: MensajeChatCreate,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    conversacion = db.query(Conversacion).filter(Conversacion.session_id == datos.session_id).first()

    if not conversacion:
        conversacion = Conversacion(
            id_cliente=usuario_actual.id_usuario,
            session_id=datos.session_id,
        )
        db.add(conversacion)
        db.commit()
        db.refresh(conversacion)
    elif conversacion.id_cliente != usuario_actual.id_usuario:
        # Si el visitante inició sesión a mitad de una conversación anónima,
        # la conversación queda vinculada a su cuenta desde ese momento.
        raise HTTPException(status_code=404, detail="Conversación no encontrada.")

    db.add(Mensaje(
        id_conversacion=conversacion.id_conversacion, remitente="cliente", contenido=datos.mensaje.strip(),
    ))
    conversacion.fecha_ultima_actividad = datetime.utcnow()
    db.commit()

    historial = (
        db.query(Mensaje)
        .filter(Mensaje.id_conversacion == conversacion.id_conversacion)
        .order_by(Mensaje.fecha_creacion.desc())
        .limit(LIMITE_HISTORIAL)
        .all()
    )
    historial.reverse()

    contexto = _construir_contexto_negocio(db)
    mensajes_para_ia = [{"role": "system", "content": contexto}]
    for m in historial:
        rol = "user" if m.remitente == "cliente" else "assistant"
        mensajes_para_ia.append({"role": rol, "content": m.contenido})

    # El asistente responde SIEMPRE con IA. Si ningún proveedor está
    # disponible se devuelve un error explícito en lugar de simular una
    # respuesta: así el fallo es visible y se puede corregir.
    try:
        respuesta_cruda, proveedor = await obtener_respuesta_ia(mensajes_para_ia)
        respuesta_texto = _a_texto_plano(respuesta_cruda)
    except ErrorIA as error:
        print(f"[CHATBOT] Error consultando la IA: {error}")
        raise HTTPException(
            status_code=503,
            detail="El asistente no está disponible en este momento. Intenta de nuevo en unos segundos.",
        )

    db.add(Mensaje(
        id_conversacion=conversacion.id_conversacion, remitente="asistente", contenido=respuesta_texto,
    ))
    db.commit()

    return {
        "success": True,
        "respuesta": respuesta_texto,
        "origen": "ia",
        "proveedor": proveedor,
        "session_id": conversacion.session_id,
    }


@router.get("/historial/{session_id}")
def obtener_historial(
    session_id: str,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    conversacion = (
        db.query(Conversacion)
        .filter(
            Conversacion.session_id == session_id,
            Conversacion.id_cliente == usuario_actual.id_usuario,
        )
        .first()
    )
    if not conversacion:
        return {"success": True, "mensajes": []}

    mensajes = (
        db.query(Mensaje)
        .filter(Mensaje.id_conversacion == conversacion.id_conversacion)
        .order_by(Mensaje.fecha_creacion.asc())
        .all()
    )
    return {
        "success": True,
        "mensajes": [
            {"remitente": m.remitente, "contenido": m.contenido, "fecha_creacion": m.fecha_creacion.isoformat()}
            for m in mensajes
        ],
    }


@router.get("/estado")
async def estado_asistente():
    """
    Diagnóstico rápido: indica qué proveedores de IA están configurados y si
    responden. Útil para verificar la clave sin abrir el chat.
    """
    proveedores = obtener_proveedores()
    if not proveedores:
        return {
            "success": False,
            "configurado": False,
            "mensaje": "No hay proveedores de IA configurados. Define GROQ_API_KEY en backend/.env",
            "proveedores": [],
        }

    try:
        _, proveedor_activo = await obtener_respuesta_ia(
            [{"role": "user", "content": "Responde únicamente con la palabra: ok"}]
        )
        return {
            "success": True,
            "configurado": True,
            "proveedor_activo": proveedor_activo,
            "proveedores": [{"nombre": p["nombre"], "modelo": p["modelo"]} for p in proveedores],
        }
    except ErrorIA as error:
        return {
            "success": False,
            "configurado": True,
            "mensaje": str(error),
            "proveedores": [{"nombre": p["nombre"], "modelo": p["modelo"]} for p in proveedores],
        }
