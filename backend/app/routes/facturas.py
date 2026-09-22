from datetime import date, datetime
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Factura, DetalleFactura, Venta, Usuario
from ..auth import obtener_usuario_actual, requerir_roles
from ..pdf_utils import generar_pdf_factura

router = APIRouter(prefix="/api/facturas", tags=["Facturas"])


def _factura_a_dict(factura: Factura) -> dict:
    return {
        "id_factura": factura.id_factura,
        "id_venta": factura.id_venta,
        "numero_factura": factura.numero_factura,
        "cliente_nombre": f"{factura.venta.cliente.nombres} {factura.venta.cliente.apellidos}",
        "subtotal": float(factura.subtotal),
        "descuento": float(factura.descuento),
        "iva": float(factura.iva),
        "total": float(factura.total),
        "estado": factura.estado,
        "fecha_generacion": factura.fecha_generacion.isoformat() if factura.fecha_generacion else None,
        "detalles": [
            {
                "id_detalle_factura": d.id_detalle_factura,
                "nombre_item": d.nombre_item,
                "cantidad": d.cantidad,
                "precio_unitario": float(d.precio_unitario),
                "subtotal_item": float(d.subtotal_item),
            }
            for d in factura.detalles
        ],
    }


def _generar_numero_factura(db: Session) -> str:
    anio = datetime.utcnow().year
    conteo = db.query(Factura).filter(Factura.numero_factura.like(f"FAC-{anio}-%")).count()
    return f"FAC-{anio}-{conteo + 1:05d}"


@router.post("/generar/{id_venta}", status_code=201, dependencies=[Depends(requerir_roles("Administrador"))])
def generar_factura(id_venta: Annotated[int, Path(ge=1, description="Identificador de la venta")], db: Session = Depends(get_db)):
    venta = (
        db.query(Venta)
        .options(joinedload(Venta.cliente), joinedload(Venta.detalles))
        .filter(Venta.id_venta == id_venta)
        .first()
    )
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada.")

    if venta.estado not in ("pagada", "entregada"):
        raise HTTPException(status_code=400, detail="Solo se pueden facturar ventas pagadas o entregadas.")

    if db.query(Factura).filter(Factura.id_venta == id_venta).first():
        raise HTTPException(status_code=409, detail="Esta venta ya tiene una factura generada.")

    nueva_factura = Factura(
        id_venta=venta.id_venta,
        numero_factura=_generar_numero_factura(db),
        subtotal=venta.subtotal,
        descuento=venta.descuento,
        iva=venta.iva,
        total=venta.total,
        estado="emitida",
    )
    db.add(nueva_factura)
    db.flush()

    for d in venta.detalles:
        db.add(DetalleFactura(
            id_factura=nueva_factura.id_factura, nombre_item=d.nombre_item,
            cantidad=d.cantidad, precio_unitario=d.precio_unitario, subtotal_item=d.subtotal_item,
        ))

    db.commit()
    db.refresh(nueva_factura)

    return {
        "success": True, "message": "Factura generada correctamente.",
        "id_factura": nueva_factura.id_factura, "numero_factura": nueva_factura.numero_factura,
    }


@router.get("", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def listar_facturas(
    numero_factura: Optional[str] = Query(None),
    cliente: Optional[str] = Query(None),
    id_cliente: Optional[int] = Query(None),
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Factura).join(Factura.venta).options(
        joinedload(Factura.venta).joinedload(Venta.cliente), joinedload(Factura.detalles)
    )

    if numero_factura:
        query = query.filter(Factura.numero_factura.ilike(f"%{numero_factura}%"))
    if cliente:
        texto_cliente = f"%{cliente}%"
        query = query.join(Venta.cliente).filter(
            (Usuario.nombres.ilike(texto_cliente))
            | (Usuario.apellidos.ilike(texto_cliente))
            | (Usuario.email.ilike(texto_cliente))
        )
    if id_cliente:
        query = query.filter(Venta.id_cliente == id_cliente)
    if fecha_inicio:
        query = query.filter(Factura.fecha_generacion >= datetime.combine(fecha_inicio, datetime.min.time()))
    if fecha_fin:
        query = query.filter(Factura.fecha_generacion <= datetime.combine(fecha_fin, datetime.max.time()))

    total = query.count()
    facturas = query.order_by(Factura.fecha_generacion.desc()).offset((pagina - 1) * por_pagina).limit(por_pagina).all()

    return {
        "success": True, "facturas": [_factura_a_dict(f) for f in facturas],
        "total": total, "pagina": pagina,
        "total_paginas": max(1, (total + por_pagina - 1) // por_pagina),
    }


@router.get("/mis-facturas")
def obtener_mis_facturas(usuario_actual: Usuario = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    facturas = (
        db.query(Factura)
        .join(Factura.venta)
        .options(joinedload(Factura.venta).joinedload(Venta.cliente), joinedload(Factura.detalles))
        .filter(Venta.id_cliente == usuario_actual.id_usuario)
        .order_by(Factura.fecha_generacion.desc())
        .all()
    )
    return {"success": True, "facturas": [_factura_a_dict(f) for f in facturas]}


def _cargar_factura_con_permiso(id_factura: Annotated[int, Path(ge=1, description="Identificador de la factura")], usuario_actual: Usuario, db: Session) -> Factura:
    factura = (
        db.query(Factura)
        .options(joinedload(Factura.venta).joinedload(Venta.cliente), joinedload(Factura.detalles))
        .filter(Factura.id_factura == id_factura)
        .first()
    )
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada.")

    es_propietario = factura.venta.id_cliente == usuario_actual.id_usuario
    es_staff = usuario_actual.rol.nombre in ("Administrador", "Empleado")
    if not (es_propietario or es_staff):
        raise HTTPException(status_code=403, detail="No tienes permiso para ver esta factura.")

    return factura


@router.get("/{id_factura}")
def obtener_factura(id_factura: Annotated[int, Path(ge=1, description="Identificador de la factura")], usuario_actual: Usuario = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    factura = _cargar_factura_con_permiso(id_factura, usuario_actual, db)
    return {"success": True, "factura": _factura_a_dict(factura)}


@router.get("/{id_factura}/pdf")
def descargar_factura_pdf(id_factura: Annotated[int, Path(ge=1, description="Identificador de la factura")], usuario_actual: Usuario = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    factura = _cargar_factura_con_permiso(id_factura, usuario_actual, db)
    pdf_bytes = generar_pdf_factura(_factura_a_dict(factura))
    return Response(
        content=pdf_bytes, media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=factura_{factura.numero_factura}.pdf"},
    )


@router.patch("/{id_factura}/anular", dependencies=[Depends(requerir_roles("Administrador"))])
def anular_factura(id_factura: Annotated[int, Path(ge=1, description="Identificador de la factura")], db: Session = Depends(get_db)):
    factura = db.query(Factura).filter(Factura.id_factura == id_factura).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada.")
    if factura.estado == "anulada":
        raise HTTPException(status_code=400, detail="Esta factura ya está anulada.")
    factura.estado = "anulada"
    db.commit()
    return {"success": True, "message": "Factura anulada correctamente."}