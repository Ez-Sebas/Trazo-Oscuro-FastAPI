from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Venta, DetalleVenta, Usuario, Producto, Servicio, PQR, Cita
from ..auth import obtener_usuario_actual, requerir_roles

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

AGRUPACIONES_VALIDAS = {"day", "week", "month"}


def _rango_fechas(fecha_inicio: Optional[date], fecha_fin: Optional[date]):
    inicio = datetime.combine(fecha_inicio, datetime.min.time()) if fecha_inicio else None
    fin = datetime.combine(fecha_fin, datetime.max.time()) if fecha_fin else None
    return inicio, fin


# ============================
# ADMINISTRADOR
# ============================

@router.get("/admin/resumen", dependencies=[Depends(requerir_roles("Administrador"))])
def resumen_administrador(db: Session = Depends(get_db)):
    return {
        "success": True,
        "cards": {
            "total_usuarios": db.query(func.count(Usuario.id_usuario)).filter(Usuario.estado == "activo").scalar(),
            "total_productos": db.query(func.count(Producto.id_producto)).filter(Producto.estado == "activo").scalar(),
            "total_servicios": db.query(func.count(Servicio.id_servicio)).filter(Servicio.estado == "activo").scalar(),
            "total_ventas": db.query(func.count(Venta.id_venta)).filter(Venta.estado != "cancelada").scalar(),
            "total_facturado": float(
                db.query(func.coalesce(func.sum(Venta.total), 0))
                .filter(Venta.estado.in_(["pagada", "entregada"])).scalar()
            ),
            "total_citas": db.query(func.count(Cita.id_cita)).scalar(),
            "citas_vigentes": db.query(func.count(Cita.id_cita))
                .filter(Cita.estado.in_(["pendiente", "confirmada"])).scalar(),
            "cobrado_en_citas": float(
                db.query(func.coalesce(func.sum(Servicio.precio), 0))
                .join(Cita, Cita.id_servicio == Servicio.id_servicio)
                .filter(Cita.estado_pago == "pagada").scalar()
            ),
            "pqr_recibidas": db.query(func.count(PQR.id_pqr)).scalar(),
            "pqr_pendientes": db.query(func.count(PQR.id_pqr))
                .filter(PQR.estado.in_(["pendiente", "en_proceso"])).scalar(),
        },
    }


@router.get("/ventas", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def dashboard_ventas(
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    id_producto: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
    id_cliente: Optional[int] = Query(None),
    agrupacion: str = Query("day"),
    db: Session = Depends(get_db),
):
    if agrupacion not in AGRUPACIONES_VALIDAS:
        agrupacion = "day"

    inicio, fin = _rango_fechas(fecha_inicio, fecha_fin)
    query = db.query(Venta)

    if id_producto:
        query = (
            query.join(DetalleVenta, DetalleVenta.id_venta == Venta.id_venta)
            .filter(DetalleVenta.id_producto == id_producto)
            .distinct()
        )

    if inicio:
        query = query.filter(Venta.fecha_creacion >= inicio)
    if fin:
        query = query.filter(Venta.fecha_creacion <= fin)
    if estado:
        query = query.filter(Venta.estado == estado)
    else:
        query = query.filter(Venta.estado != "cancelada")
    if id_cliente:
        query = query.filter(Venta.id_cliente == id_cliente)

    ventas_filtradas = query.all()
    ids_ventas = [v.id_venta for v in ventas_filtradas]

    # Serie de tiempo agrupada (para el gráfico lineal)
    serie = {}
    for v in ventas_filtradas:
        if agrupacion == "day":
            clave = v.fecha_creacion.date().isoformat()
        elif agrupacion == "week":
            inicio_semana = v.fecha_creacion.date() - timedelta(days=v.fecha_creacion.weekday())
            clave = inicio_semana.isoformat()
        else:
            clave = v.fecha_creacion.strftime("%Y-%m")
        if clave not in serie:
            serie[clave] = {"total": 0.0, "cantidad": 0}
        serie[clave]["total"] += float(v.total)
        serie[clave]["cantidad"] += 1

    claves_ordenadas = sorted(serie.keys())
    serie_tiempo = {
        "labels": claves_ordenadas,
        "totales": [serie[c]["total"] for c in claves_ordenadas],
        "cantidades": [serie[c]["cantidad"] for c in claves_ordenadas],
    }

    # Top 5 productos más vendidos dentro del filtro (para el gráfico de barras)
    top_query = db.query(
        DetalleVenta.nombre_item, func.sum(DetalleVenta.cantidad).label("total_cantidad")
    ).filter(DetalleVenta.tipo_item == "producto")

    if ids_ventas:
        top_query = top_query.filter(DetalleVenta.id_venta.in_(ids_ventas))
    else:
        top_query = top_query.filter(DetalleVenta.id_venta.in_([-1]))

    top_productos = (
        top_query.group_by(DetalleVenta.nombre_item)
        .order_by(func.sum(DetalleVenta.cantidad).desc())
        .limit(5)
        .all()
    )

    total_ventas = len(ventas_filtradas)
    total_facturado = sum(float(v.total) for v in ventas_filtradas)
    ticket_promedio = round(total_facturado / total_ventas, 2) if total_ventas else 0

    return {
        "success": True,
        "serie_tiempo": serie_tiempo,
        "top_productos": {
            "labels": [p[0] for p in top_productos],
            "cantidades": [int(p[1]) for p in top_productos],
        },
        "resumen": {
            "total_ventas": total_ventas,
            "total_facturado": total_facturado,
            "ticket_promedio": ticket_promedio,
        },
    }


# ============================
# CITAS (reemplaza al filtro de servicios del dashboard de ventas:
# los servicios se cobran en la cita, no se registran como venta)
# ============================

ESTADOS_CITA = ("pendiente", "confirmada", "realizada", "cancelada")


@router.get("/citas", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def dashboard_citas(
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    id_servicio: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
    estado_pago: Optional[str] = Query(None),
    id_empleado: Optional[int] = Query(None),
    id_cliente: Optional[int] = Query(None),
    agrupacion: str = Query("day"),
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    """
    Indicadores de la agenda. Un empleado solo ve las citas asignadas a él;
    el administrador ve todas y puede filtrar por empleado.
    """
    if agrupacion not in AGRUPACIONES_VALIDAS:
        agrupacion = "day"

    query = (
        db.query(Cita)
        .options(joinedload(Cita.cliente), joinedload(Cita.empleado), joinedload(Cita.servicio))
    )

    # El alcance lo decide el servidor, nunca el parámetro que llegue.
    if usuario_actual.rol.nombre == "Empleado":
        query = query.filter(Cita.id_empleado == usuario_actual.id_usuario)
    elif id_empleado:
        query = query.filter(Cita.id_empleado == id_empleado)

    if fecha_inicio:
        query = query.filter(Cita.fecha >= fecha_inicio)
    if fecha_fin:
        query = query.filter(Cita.fecha <= fecha_fin)
    if id_servicio:
        query = query.filter(Cita.id_servicio == id_servicio)
    if estado in ESTADOS_CITA:
        query = query.filter(Cita.estado == estado)
    if estado_pago in ("pendiente", "pagada"):
        query = query.filter(Cita.estado_pago == estado_pago)
    if id_cliente:
        query = query.filter(Cita.id_cliente == id_cliente)

    citas = query.order_by(Cita.fecha.desc(), Cita.hora.desc()).all()

    # --- Serie de tiempo: se agrupa por la FECHA DE LA CITA, no por la de
    # creación, porque lo que interesa es la carga de la agenda.
    serie = {}
    for cita in citas:
        if agrupacion == "day":
            clave = cita.fecha.isoformat()
        elif agrupacion == "week":
            clave = (cita.fecha - timedelta(days=cita.fecha.weekday())).isoformat()
        else:
            clave = cita.fecha.strftime("%Y-%m")

        registro = serie.setdefault(clave, {"cantidad": 0, "ingresos": 0.0})
        registro["cantidad"] += 1
        if cita.estado_pago == "pagada":
            registro["ingresos"] += float(cita.servicio.precio) if cita.servicio else 0.0

    claves = sorted(serie)

    # --- Top servicios más reservados dentro del filtro
    por_servicio = {}
    for cita in citas:
        nombre = cita.servicio.nombre if cita.servicio else "Sin servicio"
        por_servicio[nombre] = por_servicio.get(nombre, 0) + 1
    top_servicios = sorted(por_servicio.items(), key=lambda par: par[1], reverse=True)[:5]

    # --- Resumen
    conteo_estados = {nombre: 0 for nombre in ESTADOS_CITA}
    ingresos_cobrados = 0.0
    ingresos_por_cobrar = 0.0

    for cita in citas:
        if cita.estado in conteo_estados:
            conteo_estados[cita.estado] += 1

        precio = float(cita.servicio.precio) if cita.servicio else 0.0
        if cita.estado_pago == "pagada":
            ingresos_cobrados += precio
        elif cita.estado != "cancelada":
            ingresos_por_cobrar += precio

    total_citas = len(citas)
    citas_pagadas = sum(1 for cita in citas if cita.estado_pago == "pagada")

    return {
        "success": True,
        "serie_tiempo": {
            "labels": claves,
            "cantidades": [serie[c]["cantidad"] for c in claves],
            "ingresos": [round(serie[c]["ingresos"], 2) for c in claves],
        },
        "top_servicios": {
            "labels": [nombre for nombre, _ in top_servicios],
            "cantidades": [cantidad for _, cantidad in top_servicios],
        },
        "resumen": {
            "total_citas": total_citas,
            "citas_pagadas": citas_pagadas,
            "citas_por_cobrar": total_citas - citas_pagadas,
            "ingresos_cobrados": round(ingresos_cobrados, 2),
            "ingresos_por_cobrar": round(ingresos_por_cobrar, 2),
            "por_estado": conteo_estados,
        },
        "citas": [
            {
                "id_cita": cita.id_cita,
                "cliente_nombre": f"{cita.cliente.nombres} {cita.cliente.apellidos}",
                "servicio_nombre": cita.servicio.nombre if cita.servicio else "Sin servicio",
                "servicio_precio": float(cita.servicio.precio) if cita.servicio else 0.0,
                "id_empleado": cita.id_empleado,
                "empleado_nombre": (
                    f"{cita.empleado.nombres} {cita.empleado.apellidos}" if cita.empleado else None
                ),
                "fecha": cita.fecha.isoformat(),
                "hora": cita.hora.strftime("%H:%M"),
                "estado": cita.estado,
                "estado_pago": cita.estado_pago,
            }
            for cita in citas
        ],
    }

# ============================
# EMPLEADO (solo su propia actividad)
# ============================

@router.get("/empleado/resumen", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def resumen_empleado(usuario_actual: Usuario = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    citas_query = db.query(Cita).filter(Cita.id_empleado == usuario_actual.id_usuario)

    # Cobro de los servicios atendidos por este empleado (el precio vive en
    # el servicio; la cita solo registra si ya se pagó o no).
    cobrado = (
        db.query(func.coalesce(func.sum(Servicio.precio), 0))
        .join(Cita, Cita.id_servicio == Servicio.id_servicio)
        .filter(Cita.id_empleado == usuario_actual.id_usuario, Cita.estado_pago == "pagada")
        .scalar()
    )

    return {
        "success": True,
        "cards": {
            "citas_pendientes": citas_query.filter(Cita.estado == "pendiente").count(),
            "citas_confirmadas": citas_query.filter(Cita.estado == "confirmada").count(),
            "citas_realizadas": citas_query.filter(Cita.estado == "realizada").count(),
            "citas_por_cobrar": citas_query.filter(
                Cita.estado_pago == "pendiente", Cita.estado != "cancelada"
            ).count(),
            "cobrado_en_citas": float(cobrado),
            "ventas_registradas": db.query(func.count(Venta.id_venta))
                .filter(Venta.id_usuario_registra == usuario_actual.id_usuario).scalar(),
            "total_vendido": float(
                db.query(func.coalesce(func.sum(Venta.total), 0))
                .filter(Venta.id_usuario_registra == usuario_actual.id_usuario, Venta.estado != "cancelada")
                .scalar()
            ),
        },
    }


# ============================
# CLIENTE (solo su propia información)
# ============================

@router.get("/cliente/resumen")
def resumen_cliente(usuario_actual: Usuario = Depends(obtener_usuario_actual), db: Session = Depends(get_db)):
    return {
        "success": True,
        "cards": {
            "total_compras": db.query(func.count(Venta.id_venta))
                .filter(Venta.id_cliente == usuario_actual.id_usuario, Venta.estado != "cancelada").scalar(),
            "total_gastado": float(
                db.query(func.coalesce(func.sum(Venta.total), 0))
                .filter(Venta.id_cliente == usuario_actual.id_usuario, Venta.estado.in_(["pagada", "entregada"]))
                .scalar()
            ),
            "citas_proximas": db.query(func.count(Cita.id_cita)).filter(
                Cita.id_cliente == usuario_actual.id_usuario,
                Cita.estado.in_(["pendiente", "confirmada"]),
                Cita.fecha >= date.today(),
            ).scalar(),
            "pqr_activas": db.query(func.count(PQR.id_pqr))
                .filter(PQR.id_cliente == usuario_actual.id_usuario, PQR.estado != "cerrada").scalar(),
        },
    }