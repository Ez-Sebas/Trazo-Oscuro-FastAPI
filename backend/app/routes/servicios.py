from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Servicio, CategoriaServicio
from ..schemas import ServicioCreate, ServicioUpdate, ServicioEstadoUpdate, ServicioResponse
from ..auth import requerir_roles

router = APIRouter(prefix="/api/servicios", tags=["Servicios"])


def _servicio_a_response(servicio: Servicio) -> dict:
    data = ServicioResponse(
        id_servicio=servicio.id_servicio,
        id_categoria_servicio=servicio.id_categoria_servicio,
        categoria=servicio.categoria.nombre if servicio.categoria else None,
        nombre=servicio.nombre,
        descripcion=servicio.descripcion,
        precio=servicio.precio,
        duracion_estimada=servicio.duracion_estimada,
        imagen_url=servicio.imagen_url,
        estado=servicio.estado,
        fecha_creacion=servicio.fecha_creacion,
    ).model_dump()
    return data

def _aplicar_filtros(query, busqueda, id_categoria_servicio, precio_min, precio_max, estado):
    if busqueda:
        texto = f"%{busqueda}%"
        query = query.filter(
            or_(Servicio.nombre.ilike(texto), Servicio.descripcion.ilike(texto))
        )
    if id_categoria_servicio:
        query = query.filter(Servicio.id_categoria_servicio == id_categoria_servicio)
    if precio_min is not None:
        query = query.filter(Servicio.precio >= precio_min)
    if precio_max is not None:
        query = query.filter(Servicio.precio <= precio_max)
    if estado:
        query = query.filter(Servicio.estado == estado)
    return query


@router.get("/categorias")
def listar_categorias_servicio(db: Session = Depends(get_db)):
    categorias = db.query(CategoriaServicio).order_by(CategoriaServicio.nombre).all()
    return {
        "success": True,
        "categorias": [
            {"id_categoria_servicio": c.id_categoria_servicio, "nombre": c.nombre}
            for c in categorias
        ],
    }


@router.get("/activos")
def listar_servicios_activos(
    busqueda: Optional[str] = Query(None),
    id_categoria_servicio: Optional[int] = Query(None),
    precio_min: Optional[float] = Query(None),
    precio_max: Optional[float] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Servicio).options(joinedload(Servicio.categoria)).filter(Servicio.estado == "activo")
    query = _aplicar_filtros(query, busqueda, id_categoria_servicio, precio_min, precio_max, None)
    servicios = query.order_by(Servicio.id_servicio.desc()).all()
    return {"success": True, "servicios": [_servicio_a_response(s) for s in servicios]}


@router.get("", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def listar_servicios(
    busqueda: Optional[str] = Query(None),
    id_categoria_servicio: Optional[int] = Query(None),
    precio_min: Optional[float] = Query(None),
    precio_max: Optional[float] = Query(None),
    estado: Optional[str] = Query(None),
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Servicio).options(joinedload(Servicio.categoria))
    query = _aplicar_filtros(query, busqueda, id_categoria_servicio, precio_min, precio_max, estado)

    total = query.count()
    servicios = (
        query.order_by(Servicio.id_servicio.desc())
        .offset((pagina - 1) * por_pagina)
        .limit(por_pagina)
        .all()
    )

    return {
        "success": True,
        "servicios": [_servicio_a_response(s) for s in servicios],
        "total": total,
        "pagina": pagina,
        "total_paginas": max(1, (total + por_pagina - 1) // por_pagina),
    }


@router.get("/{id_servicio}")
def obtener_servicio(id_servicio: int, db: Session = Depends(get_db)):
    servicio = (
        db.query(Servicio)
        .options(joinedload(Servicio.categoria))
        .filter(Servicio.id_servicio == id_servicio)
        .first()
    )
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado.")
    return {"success": True, "servicio": _servicio_a_response(servicio)}


@router.post("", status_code=201, dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def crear_servicio(datos: ServicioCreate, db: Session = Depends(get_db)):
    categoria = db.query(CategoriaServicio).filter(
        CategoriaServicio.id_categoria_servicio == datos.id_categoria_servicio
    ).first()
    if not categoria:
        raise HTTPException(status_code=400, detail="La categoría seleccionada no existe.")

    nuevo = Servicio(
        id_categoria_servicio=datos.id_categoria_servicio,
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
    return {"success": True, "message": "Servicio creado correctamente.", "id_servicio": nuevo.id_servicio}


@router.put("/{id_servicio}", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def editar_servicio(id_servicio: int, datos: ServicioUpdate, db: Session = Depends(get_db)):
    servicio = db.query(Servicio).filter(Servicio.id_servicio == id_servicio).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado.")

    categoria = db.query(CategoriaServicio).filter(
        CategoriaServicio.id_categoria_servicio == datos.id_categoria_servicio
    ).first()
    if not categoria:
        raise HTTPException(status_code=400, detail="La categoría seleccionada no existe.")

    servicio.id_categoria_servicio = datos.id_categoria_servicio
    servicio.nombre = datos.nombre.strip()
    servicio.descripcion = datos.descripcion.strip()
    servicio.precio = datos.precio
    servicio.duracion_estimada = datos.duracion_estimada.strip()
    servicio.imagen_url = datos.imagen_url
    db.commit()
    return {"success": True, "message": "Servicio actualizado correctamente."}


@router.patch("/{id_servicio}/estado", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def cambiar_estado_servicio(id_servicio: int, datos: ServicioEstadoUpdate, db: Session = Depends(get_db)):
    servicio = db.query(Servicio).filter(Servicio.id_servicio == id_servicio).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado.")
    servicio.estado = datos.estado
    db.commit()
    return {"success": True, "message": f"Servicio marcado como {datos.estado}."}


@router.delete("/{id_servicio}", dependencies=[Depends(requerir_roles("Administrador"))])
def eliminar_servicio(id_servicio: int, db: Session = Depends(get_db)):
    servicio = db.query(Servicio).filter(Servicio.id_servicio == id_servicio).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado.")
    db.delete(servicio)
    db.commit()
    return {"success": True, "message": "Servicio eliminado correctamente."}