from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Compra, CompraDetalle, Producto, Usuario
from ..schemas import CompraCreate, CompraEstadoUpdate
from ..auth import obtener_usuario_actual, requerir_roles

router = APIRouter(prefix="/api/compras", tags=["Compras"])


def _compra_a_dict(compra: Compra) -> dict:
    return {
        "id_compra": compra.id_compra,
        "cliente_nombre": f"{compra.cliente.nombres} {compra.cliente.apellidos}",
        "total": float(compra.total),
        "estado": compra.estado,
        "fecha": compra.fecha_creacion.isoformat() if compra.fecha_creacion else None,
        "detalles": [
            {
                "id_producto": d.id_producto,
                "nombre": d.producto.nombre if d.producto else None,
                "cantidad": d.cantidad,
                "precio_unitario": float(d.precio_unitario),
            }
            for d in compra.detalles
        ],
    }


# ============================
# CLIENTE: registrar una compra
# ============================

@router.post("", status_code=201)
def registrar_compra(
    datos: CompraCreate,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    if not datos.items:
        raise HTTPException(status_code=400, detail="El carrito no puede estar vacío.")

    total_calculado = 0.0

    for item in datos.items:
        producto = (
            db.query(Producto).filter(Producto.id_producto == item.id_producto).first()
        )
        if not producto:
            raise HTTPException(
                status_code=404, detail=f"El producto '{item.nombre}' ya no existe."
            )
        if producto.estado != "activo":
            raise HTTPException(
                status_code=400, detail=f"El producto '{producto.nombre}' no está disponible."
            )
        if producto.stock < item.cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"No hay suficiente stock de '{producto.nombre}'. Disponible: {producto.stock}.",
            )
        total_calculado += float(producto.precio) * item.cantidad

    # El total se recalcula en el backend a partir de los precios reales en BD,
    # nunca se confía en el total que hubiera podido enviar el frontend.
    nueva_compra = Compra(
        id_cliente=usuario_actual.id_usuario,
        total=total_calculado,
        estado="pendiente",
    )
    db.add(nueva_compra)
    db.flush()  # genera nueva_compra.id_compra sin cerrar la transacción todavía

    for item in datos.items:
        producto = (
            db.query(Producto).filter(Producto.id_producto == item.id_producto).first()
        )
        detalle = CompraDetalle(
            id_compra=nueva_compra.id_compra,
            id_producto=item.id_producto,
            cantidad=item.cantidad,
            precio_unitario=producto.precio,
        )
        db.add(detalle)
        producto.stock -= item.cantidad

    db.commit()
    db.refresh(nueva_compra)

    return {
        "success": True,
        "message": "Compra registrada correctamente.",
        "id_compra": nueva_compra.id_compra,
        "total": total_calculado,
    }


# ============================
# CLIENTE: ver mis propias compras
# ============================

@router.get("/mis-compras")
def obtener_mis_compras(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    compras = (
        db.query(Compra)
        .options(
            joinedload(Compra.cliente),
            joinedload(Compra.detalles).joinedload(CompraDetalle.producto),
        )
        .filter(Compra.id_cliente == usuario_actual.id_usuario)
        .order_by(Compra.fecha_creacion.desc())
        .all()
    )
    return {"success": True, "compras": [_compra_a_dict(c) for c in compras]}


# ============================
# ADMINISTRADOR: ver todas las compras
# ============================

@router.get("", dependencies=[Depends(requerir_roles("Administrador"))])
def listar_todas_las_compras(db: Session = Depends(get_db)):
    compras = (
        db.query(Compra)
        .options(
            joinedload(Compra.cliente),
            joinedload(Compra.detalles).joinedload(CompraDetalle.producto),
        )
        .order_by(Compra.fecha_creacion.desc())
        .all()
    )
    return {"success": True, "compras": [_compra_a_dict(c) for c in compras]}


@router.patch(
    "/{id_compra}/estado", dependencies=[Depends(requerir_roles("Administrador"))]
)
def cambiar_estado_compra(
    id_compra: int, datos: CompraEstadoUpdate, db: Session = Depends(get_db)
):
    compra = db.query(Compra).filter(Compra.id_compra == id_compra).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada.")

    compra.estado = datos.estado
    db.commit()

    return {"success": True, "message": f"Compra marcada como {datos.estado}."}


@router.delete("/{id_compra}", dependencies=[Depends(requerir_roles("Administrador"))])
def eliminar_compra(id_compra: int, db: Session = Depends(get_db)):
    compra = db.query(Compra).filter(Compra.id_compra == id_compra).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada.")

    db.delete(compra)
    db.commit()

    return {"success": True, "message": "Compra eliminada correctamente."}