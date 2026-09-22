import os
import uuid
from datetime import date, time as time_type

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Path
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Cita, Usuario, Servicio
from ..schemas import CitaEstadoUpdate, CitaPagoUpdate, CitaAsignarEmpleado, ConfirmarCitaRequest
from ..auth import (
    obtener_usuario_actual, requerir_roles,
    crear_token_confirmacion_cita, verificar_token_confirmacion_cita,
)
from ..email_utils import enviar_correo_confirmacion_cita

router = APIRouter(prefix="/api/citas", tags=["Citas"])

CARPETA_UPLOADS = "static/uploads/citas"
TIPOS_PERMITIDOS = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
TAMANO_MAXIMO_MB = 5

os.makedirs(CARPETA_UPLOADS, exist_ok=True)


def _cita_a_dict(cita: Cita) -> dict:
    return {
        "id_cita": cita.id_cita,
        "id_cliente": cita.id_cliente,
        "cliente_nombre": f"{cita.cliente.nombres} {cita.cliente.apellidos}",
        "id_servicio": cita.id_servicio,
        "servicio_nombre": cita.servicio.nombre,
        "servicio_precio": float(cita.servicio.precio) if cita.servicio else 0.0,
        "id_empleado": cita.id_empleado,
        "empleado_nombre": (
            f"{cita.empleado.nombres} {cita.empleado.apellidos}" if cita.empleado else None
        ),
        "fecha": cita.fecha.isoformat(),
        "hora": cita.hora.strftime("%H:%M"),
        "mensaje": cita.mensaje,
        "imagen_diseno": cita.imagen_diseno,
        "estado": cita.estado,
        "estado_pago": cita.estado_pago,
    }


# ============================
# CLIENTE: crear reserva (envía correo de confirmación en segundo plano)
# ============================

@router.post("", status_code=201)
async def crear_cita(
    background_tasks: BackgroundTasks,
    id_servicio: int = Form(...),
    fecha: date = Form(...),
    hora: time_type = Form(...),
    mensaje: str = Form(""),
    imagen: UploadFile = File(None),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    servicio = db.query(Servicio).filter(Servicio.id_servicio == id_servicio).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="El servicio seleccionado no existe.")

    if fecha < date.today():
        raise HTTPException(status_code=400, detail="La fecha de la cita no puede ser anterior a hoy.")

    if len(mensaje) > 300:
        raise HTTPException(status_code=400, detail="El mensaje no puede superar 300 caracteres.")

    ruta_imagen = None
    if imagen is not None and imagen.filename:
        if imagen.content_type not in TIPOS_PERMITIDOS:
            raise HTTPException(status_code=400, detail="Formato de imagen no permitido. Usa JPG, PNG o WEBP.")
        contenido = await imagen.read()
        if len(contenido) > TAMANO_MAXIMO_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"La imagen no puede superar {TAMANO_MAXIMO_MB}MB.")
        extension = imagen.filename.split(".")[-1]
        nombre_unico = f"{uuid.uuid4().hex}.{extension}"
        with open(os.path.join(CARPETA_UPLOADS, nombre_unico), "wb") as archivo:
            archivo.write(contenido)
        ruta_imagen = f"/static/uploads/citas/{nombre_unico}"

    nueva_cita = Cita(
        id_cliente=usuario_actual.id_usuario, id_servicio=id_servicio, fecha=fecha, hora=hora,
        mensaje=mensaje.strip() if mensaje else None, imagen_diseno=ruta_imagen, estado="pendiente",
    )
    db.add(nueva_cita)
    db.commit()
    db.refresh(nueva_cita)

    token = crear_token_confirmacion_cita(nueva_cita.id_cita)
    background_tasks.add_task(
        enviar_correo_confirmacion_cita,
        usuario_actual.email, nueva_cita.id_cita, token,
        servicio.nombre, fecha.isoformat(), hora.strftime("%H:%M"),
    )

    return {
        "success": True,
        "message": "Tu reserva fue registrada. Revisa tu correo para confirmarla.",
        "id_cita": nueva_cita.id_cita,
    }


# ============================
# PÚBLICO: confirmar cita mediante el enlace del correo
# ============================

@router.post("/confirmar")
def confirmar_cita(datos: ConfirmarCitaRequest, db: Session = Depends(get_db)):
    id_cita = verificar_token_confirmacion_cita(datos.token)

    cita = db.query(Cita).filter(Cita.id_cita == id_cita).first()
    if not cita:
        raise HTTPException(status_code=404, detail="La cita no existe.")

    if cita.estado != "pendiente":
        return {
            "success": True,
            "message": f"Esta cita ya se encuentra en estado '{cita.estado}'.",
            "estado": cita.estado,
        }

    cita.estado = "confirmada"
    db.commit()
    return {"success": True, "message": "¡Tu cita fue confirmada correctamente!", "estado": "confirmada"}


# ============================
# CLIENTE: ver y cancelar sus propias citas
# ============================

@router.get("/mis-citas")
def obtener_mis_citas_cliente(usuario_actual: Usuario = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    citas = (
        db.query(Cita)
        .options(joinedload(Cita.cliente), joinedload(Cita.empleado), joinedload(Cita.servicio))
        .filter(Cita.id_cliente == usuario_actual.id_usuario)
        .order_by(Cita.fecha.desc()).all()
    )
    return {"success": True, "citas": [_cita_a_dict(c) for c in citas]}


@router.patch("/{id_cita}/cancelar-mia")
def cancelar_mi_cita(id_cita: Annotated[int, Path(ge=1, description="Identificador de la cita")], usuario_actual: Usuario = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    cita = db.query(Cita).filter(Cita.id_cita == id_cita).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada.")
    if cita.id_cliente != usuario_actual.id_usuario:
        raise HTTPException(status_code=403, detail="Esta cita no te pertenece.")
    if cita.estado not in ("pendiente", "confirmada"):
        raise HTTPException(status_code=400, detail=f"No es posible cancelar una cita en estado '{cita.estado}'.")
    if cita.fecha < date.today():
        raise HTTPException(status_code=400, detail="No es posible cancelar una cita que ya pasó.")

    cita.estado = "cancelada"
    db.commit()
    return {"success": True, "message": "Tu cita fue cancelada correctamente."}


# ============================
# EMPLEADO: ver SOLO sus citas asignadas
# ============================

@router.get("/empleado/mis-citas", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def obtener_mis_citas_empleado(usuario_actual: Usuario = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    citas = (
        db.query(Cita)
        .options(joinedload(Cita.cliente), joinedload(Cita.empleado), joinedload(Cita.servicio))
        .filter(Cita.id_empleado == usuario_actual.id_usuario)
        .order_by(Cita.fecha.desc()).all()
    )
    return {"success": True, "citas": [_cita_a_dict(c) for c in citas]}


# ============================
# ADMINISTRADOR: ver todas, asignar empleado, eliminar
# ============================

@router.get("", dependencies=[Depends(requerir_roles("Administrador"))])
def listar_todas_las_citas(db: Session = Depends(get_db)):
    citas = (
        db.query(Cita)
        .options(joinedload(Cita.cliente), joinedload(Cita.empleado), joinedload(Cita.servicio))
        .order_by(Cita.fecha.desc()).all()
    )
    return {"success": True, "citas": [_cita_a_dict(c) for c in citas]}


@router.patch("/{id_cita}/asignar-empleado", dependencies=[Depends(requerir_roles("Administrador"))])
def asignar_empleado(id_cita: Annotated[int, Path(ge=1, description="Identificador de la cita")], datos: CitaAsignarEmpleado, db: Session = Depends(get_db)):
    cita = db.query(Cita).filter(Cita.id_cita == id_cita).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada.")

    empleado = db.query(Usuario).join(Usuario.rol).filter(Usuario.id_usuario == datos.id_empleado).first()
    if not empleado or empleado.rol.nombre not in ("Empleado", "Administrador"):
        raise HTTPException(status_code=400, detail="El usuario indicado no es un empleado válido.")

    cita.id_empleado = datos.id_empleado
    db.commit()
    return {"success": True, "message": "Empleado asignado correctamente."}


# ============================
# CAMBIAR ESTADO Y PAGO
# (Admin siempre; Empleado solo sobre las citas asignadas a él)
# ============================

def _obtener_cita_gestionable(id_cita: Annotated[int, Path(ge=1, description="Identificador de la cita")], usuario_actual: Usuario, db: Session) -> Cita:
    """Devuelve la cita si el usuario puede gestionarla; si no, corta con 403/404."""
    cita = db.query(Cita).filter(Cita.id_cita == id_cita).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada.")

    es_admin = usuario_actual.rol.nombre == "Administrador"
    es_empleado_asignado = (
        usuario_actual.rol.nombre == "Empleado" and cita.id_empleado == usuario_actual.id_usuario
    )
    if not (es_admin or es_empleado_asignado):
        raise HTTPException(status_code=403, detail="No tienes permisos para modificar esta cita.")

    return cita

@router.patch("/{id_cita}/estado")
def cambiar_estado_cita(
    id_cita: Annotated[int, Path(ge=1, description="Identificador de la cita")], datos: CitaEstadoUpdate,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    cita = _obtener_cita_gestionable(id_cita, usuario_actual, db)

    if datos.estado == "confirmada" and usuario_actual.rol.nombre != "Administrador":
        raise HTTPException(
            status_code=403,
            detail="Solo el cliente puede confirmar su cita mediante el enlace enviado por correo.",
        )

    cita.estado = datos.estado

    # Una cita cancelada no puede quedar marcada como cobrada.
    if datos.estado == "cancelada":
        cita.estado_pago = "pendiente"

    db.commit()
    return {
        "success": True,
        "message": f"Cita marcada como {datos.estado}.",
        "estado": cita.estado,
        "estado_pago": cita.estado_pago,
    }


@router.patch("/{id_cita}/pago")
def cambiar_estado_pago_cita(
    id_cita: Annotated[int, Path(ge=1, description="Identificador de la cita")], datos: CitaPagoUpdate,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    """
    Marca el cobro del servicio como pagado o pendiente. El pago de servicios
    se recibe físicamente en el estudio, así que lo registra quien atiende:
    el empleado asignado a la cita o un administrador.
    """
    cita = _obtener_cita_gestionable(id_cita, usuario_actual, db)

    if cita.estado == "cancelada" and datos.estado_pago == "pagada":
        raise HTTPException(
            status_code=400,
            detail="No puedes registrar el pago de una cita cancelada.",
        )

    cita.estado_pago = datos.estado_pago
    db.commit()

    texto = "pagada" if datos.estado_pago == "pagada" else "pendiente de pago"
    return {"success": True, "message": f"Cita marcada como {texto}.", "estado_pago": cita.estado_pago}


