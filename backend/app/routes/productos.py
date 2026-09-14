from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Producto, CategoriaProducto
from ..schemas import ProductoCreate, ProductoUpdate, ProductoEstadoUpdate, ProductoResponse
from ..auth import requerir_roles

router = APIRouter(prefix="/api/productos", tags=["Productos"])


def _producto_a_response(producto: Producto) -> dict:
    data = ProductoResponse(
        id_producto=producto.id_producto,
        id_categoria_producto=producto.id_categoria_producto,
        categoria=producto.categoria.nombre if producto.categoria else None,
        nombre=producto.nombre,
        descripcion=producto.descripcion,
        precio=producto.precio,
        stock=producto.stock,
        imagen_url=producto.imagen_url,
        estado=producto.estado,
        fecha_creacion=producto.fecha_creacion,
    ).model_dump()
    return data



def _aplicar_filtros(query, busqueda, id_categoria_producto, precio_min, precio_max, estado):
    if busqueda:
        texto = f"%{busqueda}%"
        query = query.filter(
            or_(Producto.nombre.ilike(texto), Producto.descripcion.ilike(texto))
        )
    if id_categoria_producto:
        query = query.filter(Producto.id_categoria_producto == id_categoria_producto)
    if precio_min is not None:
        query = query.filter(Producto.precio >= precio_min)
    if precio_max is not None:
        query = query.filter(Producto.precio <= precio_max)
    if estado:
        query = query.filter(Producto.estado == estado)
    return query


@router.get("/categorias")
def listar_categorias_producto(db: Session = Depends(get_db)):
    categorias = db.query(CategoriaProducto).order_by(CategoriaProducto.nombre).all()
    return {
        "success": True,
        "categorias": [
            {"id_categoria_producto": c.id_categoria_producto, "nombre": c.nombre}
            for c in categorias
        ],
    }


@router.get("/activos")
def listar_productos_activos(
    busqueda: Optional[str] = Query(None),
    id_categoria_producto: Optional[int] = Query(None),
    precio_min: Optional[float] = Query(None),
    precio_max: Optional[float] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Producto).options(joinedload(Producto.categoria)).filter(Producto.estado == "activo")
    query = _aplicar_filtros(query, busqueda, id_categoria_producto, precio_min, precio_max, None)
    productos = query.order_by(Producto.id_producto.desc()).all()
    return {"success": True, "productos": [_producto_a_response(p) for p in productos]}


@router.get("", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def listar_productos(
    busqueda: Optional[str] = Query(None),
    id_categoria_producto: Optional[int] = Query(None),
    precio_min: Optional[float] = Query(None),
    precio_max: Optional[float] = Query(None),
    estado: Optional[str] = Query(None),
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Producto).options(joinedload(Producto.categoria))
    query = _aplicar_filtros(query, busqueda, id_categoria_producto, precio_min, precio_max, estado)

    total = query.count()
    productos = (
        query.order_by(Producto.id_producto.desc())
        .offset((pagina - 1) * por_pagina)
        .limit(por_pagina)
        .all()
    )

    return {
        "success": True,
        "productos": [_producto_a_response(p) for p in productos],
        "total": total,
        "pagina": pagina,
        "total_paginas": max(1, (total + por_pagina - 1) // por_pagina),
    }


@router.get("/{id_producto}")
def obtener_producto(id_producto: int, db: Session = Depends(get_db)):
    producto = (
        db.query(Producto)
        .options(joinedload(Producto.categoria))
        .filter(Producto.id_producto == id_producto)
        .first()
    )
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    return {"success": True, "producto": _producto_a_response(producto)}


@router.post("", status_code=201, dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def crear_producto(datos: ProductoCreate, db: Session = Depends(get_db)):
    categoria = db.query(CategoriaProducto).filter(
        CategoriaProducto.id_categoria_producto == datos.id_categoria_producto
    ).first()
    if not categoria:
        raise HTTPException(status_code=400, detail="La categoría seleccionada no existe.")

    nuevo = Producto(
        id_categoria_producto=datos.id_categoria_producto,
        nombre=datos.nombre.strip(),
        descripcion=datos.descripcion.strip(),
        precio=datos.precio,
        stock=datos.stock,
        imagen_url=datos.imagen_url,
        estado="activo",
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"success": True, "message": "Producto creado correctamente.", "id_producto": nuevo.id_producto}


@router.put("/{id_producto}", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def editar_producto(id_producto: int, datos: ProductoUpdate, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id_producto == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")

    categoria = db.query(CategoriaProducto).filter(
        CategoriaProducto.id_categoria_producto == datos.id_categoria_producto
    ).first()
    if not categoria:
        raise HTTPException(status_code=400, detail="La categoría seleccionada no existe.")

    producto.id_categoria_producto = datos.id_categoria_producto
    producto.nombre = datos.nombre.strip()
    producto.descripcion = datos.descripcion.strip()
    producto.precio = datos.precio
    producto.stock = datos.stock
    producto.imagen_url = datos.imagen_url
    db.commit()
    return {"success": True, "message": "Producto actualizado correctamente."}


@router.patch("/{id_producto}/estado", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def cambiar_estado_producto(id_producto: int, datos: ProductoEstadoUpdate, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id_producto == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    producto.estado = datos.estado
    db.commit()
    return {"success": True, "message": f"Producto marcado como {datos.estado}."}


@router.delete("/{id_producto}", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def eliminar_producto(id_producto: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id_producto == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    db.delete(producto)
    db.commit()
    return {"success": True, "message": "Producto eliminado correctamente."}