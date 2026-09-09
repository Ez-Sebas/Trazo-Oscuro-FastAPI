from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Servicio
from ..schemas import (
    ServicioCreate,
    ServicioUpdate,
    ServicioEstadoUpdate,
    ServicioResponse,
)
from ..auth import requerir_roles

router = APIRouter(prefix="/api/servicios", tags=["Servicios"])


@router.get("/activos")
def listar_servicios_activos(db: Session = Depends(get_db)):
    servicios = db.query(Servicio).filter(Servicio.estado == "activo").order_by(
        Servicio.id_servicio.desc()
    ).all()
    return {
        "success": True,
        "servicios": [ServicioResponse.model_validate(s) for s in servicios],
    }


@router.get(
    "", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))]
)
def listar_servicios(db: Session = Depends(get_db)):
    servicios = db.query(Servicio).order_by(Servicio.id_servicio.desc()).all()
    return {
        "success": True,
        "servicios": [ServicioResponse.model_validate(s) for s in servicios],
    }


@router.get("/{id_servicio}")
def obtener_servicio(id_servicio: int, db: Session = Depends(get_db)):
    servicio = db.query(Servicio).filter(Servicio.id_servicio == id_servicio).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado.")
    return {"success": True, "servicio": ServicioResponse.model_validate(servicio)}


@router.post(
    "",
    status_code=201,
    dependencies=[Depends(requerir_roles("Administrador", "Empleado"))],
)
def crear_servicio(datos: ServicioCreate, db: Session = Depends(get_db)):
    nuevo = Servicio(
        nombre=datos.nombre.strip(),
        descripcion=datos.descripcion.strip(),
        precio=datos.precio,
        duracion_estimada=datos.duracion_estimada.strip(),
        imagen_url=datos.imagen_url,
        estado="activo",
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return {
        "success": True,
        "message": "Servicio creado correctamente.",
        "id_servicio": nuevo.id_servicio,
    }


@router.put(
    "/{id_servicio}",
    dependencies=[Depends(requerir_roles("Administrador", "Empleado"))],
)
def editar_servicio(
    id_servicio: int, datos: ServicioUpdate, db: Session = Depends(get_db)
):
    servicio = db.query(Servicio).filter(Servicio.id_servicio == id_servicio).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado.")

    servicio.nombre = datos.nombre.strip()
    servicio.descripcion = datos.descripcion.strip()
    servicio.precio = datos.precio
    servicio.duracion_estimada = datos.duracion_estimada.strip()
    servicio.imagen_url = datos.imagen_url

    db.commit()

    return {"success": True, "message": "Servicio actualizado correctamente."}


@router.patch(
    "/{id_servicio}/estado",
    dependencies=[Depends(requerir_roles("Administrador", "Empleado"))],
)
def cambiar_estado_servicio(
    id_servicio: int, datos: ServicioEstadoUpdate, db: Session = Depends(get_db)
):
    servicio = db.query(Servicio).filter(Servicio.id_servicio == id_servicio).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado.")

    servicio.estado = datos.estado
    db.commit()

    return {"success": True, "message": f"Servicio marcado como {datos.estado}."}


@router.delete(
    "/{id_servicio}",
    dependencies=[Depends(requerir_roles("Administrador"))],
)
def eliminar_servicio(id_servicio: int, db: Session = Depends(get_db)):
    servicio = db.query(Servicio).filter(Servicio.id_servicio == id_servicio).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado.")

    db.delete(servicio)
    db.commit()

    return {"success": True, "message": "Servicio eliminado correctamente."}
