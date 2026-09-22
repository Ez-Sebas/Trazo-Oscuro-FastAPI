import os
from typing import Annotated, Optional, List
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query, Request, BackgroundTasks, Path
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Venta, DetalleVenta, Producto, Servicio, Usuario
from ..schemas import VentaCreate, ItemVenta
from ..auth import obtener_usuario_actual, requerir_roles
from ..stripe_utils import crear_checkout_session, obtener_sesion, construir_evento_webhook, crear_reembolso
from ..email_utils import enviar_correo_confirmacion_venta
from ..models import Venta, DetalleVenta, Producto, Servicio, Usuario, Factura

router = APIRouter(prefix="/api/ventas", tags=["Ventas"])

IVA_PORCENTAJE = float(os.getenv("IVA_PORCENTAJE", "19"))


# ============================
# HELPERS
# ============================

def _venta_a_dict(venta: Venta) -> dict:
    return {
        "id_venta": venta.id_venta,
        "cliente_nombre": f"{venta.cliente.nombres} {venta.cliente.apellidos}",
        "cliente_email": venta.cliente.email,
        "usuario_registra_nombre": (
            f"{venta.usuario_registra.nombres} {venta.usuario_registra.apellidos}"
            if venta.usuario_registra else None
        ),
        "origen": venta.origen,
        "subtotal": float(venta.subtotal),
        "descuento": float(venta.descuento),
        "iva": float(venta.iva),
        "total": float(venta.total),
        "estado": venta.estado,
        "estado_pago": venta.estado_pago,
        "tiene_factura": venta.factura is not None,
        "fecha_creacion": venta.fecha_creacion.isoformat() if venta.fecha_creacion else None,
        "detalles": [
            {
                "id_detalle": d.id_detalle, "tipo_item": d.tipo_item, "nombre_item": d.nombre_item,
                "cantidad": d.cantidad, "precio_unitario": float(d.precio_unitario),
                "subtotal_item": float(d.subtotal_item),
            }
            for d in venta.detalles
        ],
    }


def _calcular_detalle(items: List[ItemVenta], descuento: float, db: Session, permitir_servicios: bool):
    detalles = []
    subtotal = 0.0

    for item in items:
        if item.tipo_item == "producto":
            producto = db.query(Producto).filter(Producto.id_producto == item.id_producto).first()
            if not producto:
                raise HTTPException(status_code=404, detail=f"Producto {item.id_producto} no existe.")
            if producto.estado != "activo":
                raise HTTPException(status_code=400, detail=f"'{producto.nombre}' no está disponible.")
            if producto.stock < item.cantidad:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock insuficiente de '{producto.nombre}'. Disponible: {producto.stock}.",
                )
            precio = float(producto.precio)
            detalles.append({
                "tipo_item": "producto", "id_producto": producto.id_producto, "id_servicio": None,
                "nombre_item": producto.nombre, "cantidad": item.cantidad,
                "precio_unitario": precio, "subtotal_item": precio * item.cantidad,
            })
        else:
            if not permitir_servicios:
                raise HTTPException(
                    status_code=400,
                    detail="Los servicios no se pagan en línea; agenda y paga tu cita físicamente.",
                )
            servicio = db.query(Servicio).filter(Servicio.id_servicio == item.id_servicio).first()
            if not servicio:
                raise HTTPException(status_code=404, detail=f"Servicio {item.id_servicio} no existe.")
            if servicio.estado != "activo":
                raise HTTPException(status_code=400, detail=f"'{servicio.nombre}' no está disponible.")
            precio = float(servicio.precio)
            detalles.append({
                "tipo_item": "servicio", "id_producto": None, "id_servicio": servicio.id_servicio,
                "nombre_item": servicio.nombre, "cantidad": item.cantidad,
                "precio_unitario": precio, "subtotal_item": precio * item.cantidad,
            })

        subtotal += detalles[-1]["subtotal_item"]

    if descuento > subtotal:
        raise HTTPException(status_code=400, detail="El descuento no puede ser mayor al subtotal.")

    base_gravable = subtotal - descuento
    iva_valor = round(base_gravable * IVA_PORCENTAJE / 100, 2)
    total = base_gravable + iva_valor

    return subtotal, iva_valor, total, detalles


def _persistir_venta(id_cliente, id_usuario_registra, origen, descuento, subtotal, iva, total,
    detalles, estado, estado_pago, db: Session, descontar_stock: bool) -> Venta:
    """
    'descontar_stock' controla si el inventario se afecta AHORA (venta de
    mostrador, pagada de inmediato) o se difiere hasta que el pago se
    confirme (checkout web, ver _aplicar_pago_confirmado).
    """
    nueva_venta = Venta(
        id_cliente=id_cliente, id_usuario_registra=id_usuario_registra, origen=origen,
        subtotal=subtotal, descuento=descuento, iva=iva, total=total,
        estado=estado, estado_pago=estado_pago,
    )
    db.add(nueva_venta)
    db.flush()

    for d in detalles:
        db.add(DetalleVenta(
            id_venta=nueva_venta.id_venta, tipo_item=d["tipo_item"],
            id_producto=d["id_producto"], id_servicio=d["id_servicio"],
            nombre_item=d["nombre_item"], cantidad=d["cantidad"],
            precio_unitario=d["precio_unitario"], subtotal_item=d["subtotal_item"],
        ))
        if descontar_stock and d["id_producto"] is not None:
            producto = db.query(Producto).filter(Producto.id_producto == d["id_producto"]).first()
            if producto:
                producto.stock -= d["cantidad"]

    db.commit()
    db.refresh(nueva_venta)
    return nueva_venta


def _aplicar_pago_confirmado(venta: Venta, db: Session):
    """Descuenta stock (primera vez que se confirma el pago) y actualiza estados."""
    detalles = db.query(DetalleVenta).filter(
        DetalleVenta.id_venta == venta.id_venta, DetalleVenta.tipo_item == "producto"
    ).all()
    for d in detalles:
        producto = db.query(Producto).filter(Producto.id_producto == d.id_producto).first()
        if producto:
            producto.stock -= d.cantidad

    venta.estado_pago = "pagado"
    venta.estado = "pagada"


def _restaurar_stock_de_venta(venta: Venta, db: Session):
    detalles = db.query(DetalleVenta).filter(
        DetalleVenta.id_venta == venta.id_venta, DetalleVenta.tipo_item == "producto"
    ).all()
    for d in detalles:
        producto = db.query(Producto).filter(Producto.id_producto == d.id_producto).first()
        if producto:
            producto.stock += d.cantidad


def _cargar_venta(id_venta: Annotated[int, Path(ge=1, description="Identificador de la venta")], db: Session) -> Venta:
    venta = (
        db.query(Venta)
        .options(joinedload(Venta.cliente), joinedload(Venta.usuario_registra), joinedload(Venta.detalles))
        .filter(Venta.id_venta == id_venta)
        .first()
    )
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada.")
    return venta


# ============================
# CLIENTE: checkout desde el carrito (solo productos, con Stripe)
# ============================

@router.post("/checkout")
def crear_checkout(
    datos: VentaCreate,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    subtotal, iva, total, detalles = _calcular_detalle(datos.items, datos.descuento, db, permitir_servicios=False)

    venta = _persistir_venta(
        id_cliente=usuario_actual.id_usuario, id_usuario_registra=None, origen="web_cliente",
        descuento=datos.descuento, subtotal=subtotal, iva=iva, total=total, detalles=detalles,
        estado="pendiente", estado_pago="pendiente", db=db, descontar_stock=False,
    )

    try:
        sesion_stripe = crear_checkout_session(venta.id_venta, detalles)
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"No fue posible iniciar el pago: {error}")

    venta.stripe_checkout_session_id = sesion_stripe.id
    db.commit()

    return {"success": True, "checkout_url": sesion_stripe.url, "id_venta": venta.id_venta}


@router.get("/verificar-pago/{session_id}")
def verificar_pago(
    session_id: str,
    background_tasks: BackgroundTasks,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    venta = (
        db.query(Venta).options(joinedload(Venta.cliente))
        .filter(Venta.stripe_checkout_session_id == session_id).first()
    )
    if not venta:
        raise HTTPException(status_code=404, detail="No se encontró la venta asociada a esta sesión.")

    if venta.estado_pago == "pagado":
        return {"success": True, "estado_pago": "pagado", "id_venta": venta.id_venta}

    try:
        sesion_stripe = obtener_sesion(session_id)
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"No fue posible verificar el pago: {error}")

    if sesion_stripe.payment_status == "paid":
        _aplicar_pago_confirmado(venta, db)
        venta.stripe_payment_intent_id = sesion_stripe.payment_intent
        db.commit()
        background_tasks.add_task(
            enviar_correo_confirmacion_venta, venta.cliente.email, venta.id_venta, float(venta.total)
        )
        return {"success": True, "estado_pago": "pagado", "id_venta": venta.id_venta}

    return {"success": True, "estado_pago": venta.estado_pago, "id_venta": venta.id_venta}


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    payload = await request.body()
    firma = request.headers.get("stripe-signature")

    try:
        evento = construir_evento_webhook(payload, firma)
    except Exception:
        raise HTTPException(status_code=400, detail="Firma de webhook inválida.")

    if evento["type"] == "checkout.session.completed":
        sesion = evento["data"]["object"]
        id_venta = int(sesion["metadata"]["id_venta"])

        venta = db.query(Venta).options(joinedload(Venta.cliente)).filter(Venta.id_venta == id_venta).first()
        if venta and venta.estado_pago != "pagado":
            _aplicar_pago_confirmado(venta, db)
            venta.stripe_payment_intent_id = sesion.get("payment_intent")
            db.commit()
            background_tasks.add_task(
                enviar_correo_confirmacion_venta, venta.cliente.email, venta.id_venta, float(venta.total)
            )

    return {"success": True}


# ============================
# EMPLEADO/ADMIN: venta de mostrador (pago físico, sin Stripe)
# ============================

@router.post("/mostrador", status_code=201, dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def crear_venta_mostrador(
    datos: VentaCreate,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    if not datos.id_cliente:
        raise HTTPException(status_code=400, detail="Debes indicar el cliente de la venta.")

    cliente = db.query(Usuario).filter(Usuario.id_usuario == datos.id_cliente).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="El cliente indicado no existe.")

    subtotal, iva, total, detalles = _calcular_detalle(datos.items, datos.descuento, db, permitir_servicios=True)

    venta = _persistir_venta(
        id_cliente=datos.id_cliente, id_usuario_registra=usuario_actual.id_usuario, origen="mostrador",
        descuento=datos.descuento, subtotal=subtotal, iva=iva, total=total, detalles=detalles,
        estado="pagada", estado_pago="no_aplica", db=db, descontar_stock=True,
    )

    return {"success": True, "message": "Venta de mostrador registrada.", "id_venta": venta.id_venta}


# ============================
# CONSULTAS
# ============================

@router.get("", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def listar_ventas(
    busqueda: Optional[str] = Query(None),
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    id_cliente: Optional[int] = Query(None),
    item: Optional[str] = Query(None),
    valor_min: Optional[float] = Query(None, ge=0),
    valor_max: Optional[float] = Query(None, ge=0),
    estado: Optional[str] = Query(None),
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Venta).options(
        joinedload(Venta.cliente), joinedload(Venta.usuario_registra), joinedload(Venta.detalles)
    )

    if busqueda:
        texto = f"%{busqueda}%"
        query = query.join(Venta.cliente).filter(
            or_(Usuario.nombres.ilike(texto), Usuario.apellidos.ilike(texto), Usuario.email.ilike(texto))
        )
    if fecha_inicio:
        query = query.filter(Venta.fecha_creacion >= datetime.combine(fecha_inicio, datetime.min.time()))
    if fecha_fin:
        query = query.filter(Venta.fecha_creacion <= datetime.combine(fecha_fin, datetime.max.time()))
    if id_cliente:
        query = query.filter(Venta.id_cliente == id_cliente)
    if item:
        query = query.filter(Venta.detalles.any(DetalleVenta.nombre_item.ilike(f"%{item}%")))
    if valor_min is not None:
        query = query.filter(Venta.total >= valor_min)
    if valor_max is not None:
        query = query.filter(Venta.total <= valor_max)
    if estado:
        query = query.filter(Venta.estado == estado)

    total = query.count()
    ventas = query.order_by(Venta.fecha_creacion.desc()).offset((pagina - 1) * por_pagina).limit(por_pagina).all()

    return {
        "success": True, "ventas": [_venta_a_dict(v) for v in ventas],
        "total": total, "pagina": pagina,
        "total_paginas": max(1, (total + por_pagina - 1) // por_pagina),
    }


@router.get("/mis-ventas")
def obtener_mis_ventas(usuario_actual: Usuario = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    ventas = (
        db.query(Venta)
        .options(joinedload(Venta.cliente), joinedload(Venta.usuario_registra), joinedload(Venta.detalles))
        .filter(Venta.id_cliente == usuario_actual.id_usuario)
        .order_by(Venta.fecha_creacion.desc()).all()
    )
    return {"success": True, "ventas": [_venta_a_dict(v) for v in ventas]}


@router.get("/{id_venta}")
def obtener_venta(id_venta: Annotated[int, Path(ge=1, description="Identificador de la venta")], usuario_actual: Usuario = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    venta = _cargar_venta(id_venta, db)
    es_propietario = venta.id_cliente == usuario_actual.id_usuario
    es_staff = usuario_actual.rol.nombre in ("Administrador", "Empleado")
    if not (es_propietario or es_staff):
        raise HTTPException(status_code=403, detail="No tienes permiso para ver esta venta.")
    return {"success": True, "venta": _venta_a_dict(venta)}


# ============================
# TRANSICIONES DE ESTADO (con reglas reales de negocio)
# ============================

@router.patch("/{id_venta}/entregar", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def entregar_venta(id_venta: Annotated[int, Path(ge=1, description="Identificador de la venta")], db: Session = Depends(get_db)):
    venta = db.query(Venta).filter(Venta.id_venta == id_venta).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada.")
    if venta.estado == "entregada":
        raise HTTPException(status_code=400, detail="Esta venta ya fue marcada como entregada.")
    if venta.estado == "cancelada":
        raise HTTPException(status_code=400, detail="No se puede entregar una venta cancelada.")
    if venta.estado_pago != "pagado" and venta.origen != "mostrador":
        raise HTTPException(status_code=400, detail="La venta debe estar pagada antes de marcarla como entregada.")

    venta.estado = "entregada"
    db.commit()
    return {"success": True, "message": "Venta marcada como entregada."}


@router.patch("/{id_venta}/cancelar", dependencies=[Depends(requerir_roles("Administrador"))])
def cancelar_venta(id_venta: Annotated[int, Path(ge=1, description="Identificador de la venta")], db: Session = Depends(get_db)):
    venta = db.query(Venta).filter(Venta.id_venta == id_venta).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada.")
    if venta.estado == "entregada":
        raise HTTPException(status_code=400, detail="No se puede cancelar una venta ya entregada.")
    factura_asociada = db.query(Factura).filter(Factura.id_venta == id_venta).first()
    if factura_asociada and factura_asociada.estado == "emitida":
        factura_asociada.estado = "anulada"
    if venta.estado == "cancelada":
        raise HTTPException(status_code=400, detail="Esta venta ya está cancelada.")

    reembolsado = False
    if venta.estado_pago == "pagado" and venta.stripe_payment_intent_id:
        try:
            crear_reembolso(venta.stripe_payment_intent_id)
            venta.estado_pago = "reembolsado"
            reembolsado = True
        except Exception as error:
            raise HTTPException(status_code=502, detail=f"No fue posible procesar el reembolso: {error}")

    if venta.estado_pago in ("pagado", "reembolsado") or venta.origen == "mostrador":
        _restaurar_stock_de_venta(venta, db)

    venta.estado = "cancelada"
    db.commit()

    return {
        "success": True,
        "message": "Venta cancelada" + (" y reembolsada correctamente." if reembolsado else "."),
        "reembolsado": reembolsado,
    }

