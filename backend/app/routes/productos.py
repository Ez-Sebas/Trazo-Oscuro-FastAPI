from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Producto
from ..schemas import (
    ProductoCreate,
    ProductoUpdate,
    ProductoEstadoUpdate,
    ProductoResponse,
)
from ..auth import requerir_roles

router = APIRouter(prefix="/api/productos", tags=["Productos"])


@router.get("/activos")
def listar_productos_activos(db: Session = Depends(get_db)):
    productos = db.query(Producto).filter(Producto.estado == "activo").order_by(
        Producto.id_producto.desc()
    ).all()
    return {
        "success": True,
        "productos": [ProductoResponse.model_validate(p) for p in productos],
    }


@router.get(
    "", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))]
)
def listar_productos(db: Session = Depends(get_db)):
    productos = db.query(Producto).order_by(Producto.id_producto.desc()).all()
    return {
        "success": True,
        "productos": [ProductoResponse.model_validate(p) for p in productos],
    }


@router.get("/{id_producto}")
def obtener_producto(id_producto: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id_producto == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    return {"success": True, "producto": ProductoResponse.model_validate(producto)}


@router.post(
    "",
    status_code=201,
    dependencies=[Depends(requerir_roles("Administrador", "Empleado"))],
)
def crear_producto(datos: ProductoCreate, db: Session = Depends(get_db)):
    nuevo = Producto(
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

    return {
        "success": True,
        "message": "Producto creado correctamente.",
        "id_producto": nuevo.id_producto,
    }


@router.put(
    "/{id_producto}",
    dependencies=[Depends(requerir_roles("Administrador", "Empleado"))],
)
def editar_producto(
    id_producto: int, datos: ProductoUpdate, db: Session = Depends(get_db)
):
    producto = db.query(Producto).filter(Producto.id_producto == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")

    producto.nombre = datos.nombre.strip()
    producto.descripcion = datos.descripcion.strip()
    producto.precio = datos.precio
    producto.stock = datos.stock
    producto.imagen_url = datos.imagen_url

    db.commit()

    return {"success": True, "message": "Producto actualizado correctamente."}


@router.patch(
    "/{id_producto}/estado",
    dependencies=[Depends(requerir_roles("Administrador", "Empleado"))],
)
def cambiar_estado_producto(
    id_producto: int, datos: ProductoEstadoUpdate, db: Session = Depends(get_db)
):
    producto = db.query(Producto).filter(Producto.id_producto == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")

    producto.estado = datos.estado
    db.commit()

    return {"success": True, "message": f"Producto marcado como {datos.estado}."}


@router.delete(
    "/{id_producto}",
    dependencies=[Depends(requerir_roles("Administrador", "Empleado"))],
)
def eliminar_producto(id_producto: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id_producto == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")

    db.delete(producto)
    db.commit()

    return {"success": True, "message": "Producto eliminado correctamente."}