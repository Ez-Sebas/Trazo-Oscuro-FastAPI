import os
import uuid
from datetime import date, time as time_type

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Cita, Usuario, Servicio
from ..schemas import CitaEstadoUpdate, CitaAsignarEmpleado
from ..auth import obtener_usuario_actual, requerir_roles

router = APIRouter(prefix="/api/citas", tags=["Citas"])

CARPETA_UPLOADS = "static/uploads/citas"
TIPOS_PERMITIDOS = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
TAMANO_MAXIMO_MB = 5

os.makedirs(CARPETA_UPLOADS, exist_ok=True)


def _cita_a_dict(cita: Cita) -> dict:
    return {
        "id_cita": cita.id_cita,
        "cliente_nombre": f"{cita.cliente.nombres} {cita.cliente.apellidos}",
        "servicio_nombre": cita.servicio.nombre,
        "empleado_nombre": (
            f"{cita.empleado.nombres} {cita.empleado.apellidos}"
            if cita.empleado
            else None
        ),
        "fecha": cita.fecha.isoformat(),
        "hora": cita.hora.strftime("%H:%M"),
        "mensaje": cita.mensaje,
        "imagen_diseno": cita.imagen_diseno,
        "estado": cita.estado,
    }


# ============================
# CLIENTE: crear reserva
# ============================

@router.post("", status_code=201)
async def crear_cita(
    id_servicio: int = Form(...),
    id_empleado: int = Form(...),
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

    if len(mensaje) > 300:
        raise HTTPException(status_code=400, detail="El mensaje no puede superar 300 caracteres.")
    
    empleado = (
    db.query(Usuario)
    .join(Usuario.rol)
    .filter(
        Usuario.id_usuario == id_empleado,
        Usuario.rol.has(nombre="Empleado")
    )
    .first()
    )

    if not empleado:
        raise HTTPException(
            status_code=400,
            detail="El empleado seleccionado no es válido."
        )

    ruta_imagen = None

    if imagen is not None and imagen.filename:
        if imagen.content_type not in TIPOS_PERMITIDOS:
            raise HTTPException(
                status_code=400,
                detail="Formato de imagen no permitido. Usa JPG, PNG o WEBP.",
            )

        contenido = await imagen.read()
        if len(contenido) > TAMANO_MAXIMO_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"La imagen no puede superar {TAMANO_MAXIMO_MB}MB.",
            )

        extension = imagen.filename.split(".")[-1]
        nombre_unico = f"{uuid.uuid4().hex}.{extension}"
        ruta_completa = os.path.join(CARPETA_UPLOADS, nombre_unico)

        with open(ruta_completa, "wb") as archivo:
            archivo.write(contenido)

        ruta_imagen = f"/static/uploads/citas/{nombre_unico}"

    nueva_cita = Cita(
        id_cliente=usuario_actual.id_usuario,
        id_servicio=id_servicio,
        id_empleado=id_empleado,
        fecha=fecha,
        hora=hora,
        mensaje=mensaje.strip() if mensaje else None,
        imagen_diseno=ruta_imagen,
        estado="pendiente",
    )

    db.add(nueva_cita)
    db.commit()
    db.refresh(nueva_cita)

    return {
        "success": True,
        "message": "Tu reserva fue registrada correctamente.",
        "id_cita": nueva_cita.id_cita,
    }


# ============================
# CLIENTE: ver mis propias citas
# ============================

@router.get("/mis-citas")
def obtener_mis_citas_cliente(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    citas = (
        db.query(Cita)
        .options(joinedload(Cita.cliente), joinedload(Cita.empleado), joinedload(Cita.servicio))
        .filter(Cita.id_cliente == usuario_actual.id_usuario)
        .order_by(Cita.fecha.desc())
        .all()
    )
    return {"success": True, "citas": [_cita_a_dict(c) for c in citas]}


# ============================
# EMPLEADO: ver SOLO sus citas asignadas
# ============================

@router.get(
    "/empleado/mis-citas",
    dependencies=[Depends(requerir_roles("Administrador", "Empleado"))],
)
def obtener_mis_citas_empleado(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    # Clave de seguridad: el filtro usa el ID del token (usuario_actual),
    # nunca un valor que pudiera venir manipulado desde el frontend.
    citas = (
        db.query(Cita)
        .options(joinedload(Cita.cliente), joinedload(Cita.empleado), joinedload(Cita.servicio))
        .filter(Cita.id_empleado == usuario_actual.id_usuario)
        .order_by(Cita.fecha.desc())
        .all()
    )
    return {"success": True, "citas": [_cita_a_dict(c) for c in citas]}


# ============================
# ADMINISTRADOR: ver todas las citas
# ============================

@router.get("", dependencies=[Depends(requerir_roles("Administrador"))])
def listar_todas_las_citas(db: Session = Depends(get_db)):
    citas = (
        db.query(Cita)
        .options(joinedload(Cita.cliente), joinedload(Cita.empleado), joinedload(Cita.servicio))
        .order_by(Cita.fecha.desc())
        .all()
    )
    return {"success": True, "citas": [_cita_a_dict(c) for c in citas]}


# ============================
# ASIGNAR EMPLEADO (solo Administrador)
# ============================

@router.patch(
    "/{id_cita}/asignar-empleado",
    dependencies=[Depends(requerir_roles("Administrador"))],
)
def asignar_empleado(
    id_cita: int, datos: CitaAsignarEmpleado, db: Session = Depends(get_db)
):
    cita = db.query(Cita).filter(Cita.id_cita == id_cita).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada.")

    empleado = (
        db.query(Usuario)
        .join(Usuario.rol)
        .filter(Usuario.id_usuario == datos.id_empleado)
        .first()
    )
    if not empleado or empleado.rol.nombre not in ("Empleado", "Administrador"):
        raise HTTPException(status_code=400, detail="El usuario indicado no es un empleado válido.")

    cita.id_empleado = datos.id_empleado
    db.commit()

    return {"success": True, "message": "Empleado asignado correctamente."}


# ============================
# CAMBIAR ESTADO (Admin, o el Empleado asignado a esa cita)
# ============================

@router.patch("/{id_cita}/estado")
def cambiar_estado_cita(
    id_cita: int,
    datos: CitaEstadoUpdate,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    cita = db.query(Cita).filter(Cita.id_cita == id_cita).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada.")

    es_admin = usuario_actual.rol.nombre == "Administrador"
    es_empleado_asignado = (
        usuario_actual.rol.nombre == "Empleado"
        and cita.id_empleado == usuario_actual.id_usuario
    )

    if not (es_admin or es_empleado_asignado):
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para modificar esta cita.",
        )

    cita.estado = datos.estado
    db.commit()

    return {"success": True, "message": f"Cita marcada como {datos.estado}."}


# ============================
# ELIMINAR (solo Administrador)
# ============================

@router.delete("/{id_cita}", dependencies=[Depends(requerir_roles("Administrador"))])
def eliminar_cita(id_cita: int, db: Session = Depends(get_db)):
    cita = db.query(Cita).filter(Cita.id_cita == id_cita).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada.")

    if cita.imagen_diseno:
        ruta_archivo = cita.imagen_diseno.replace("/static/", "static/", 1)
        if os.path.exists(ruta_archivo):
            os.remove(ruta_archivo)

    db.delete(cita)
    db.commit()

    return {"success": True, "message": "Cita eliminada correctamente."}