from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Venta
from ..auth import requerir_roles
from ..pdf_utils import generar_pdf_reporte_diario
from ..excel_utils import generar_excel_reporte_diario

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])


def _obtener_ventas_del_dia(fecha: date, db: Session):
    inicio = datetime.combine(fecha, datetime.min.time())
    fin = datetime.combine(fecha, datetime.max.time())

    ventas = (
        db.query(Venta)
        .options(joinedload(Venta.cliente), joinedload(Venta.detalles))
        .filter(Venta.fecha_creacion >= inicio, Venta.fecha_creacion <= fin)
        .filter(Venta.estado != "cancelada")
        .order_by(Venta.fecha_creacion.asc())
        .all()
    )

    resultado, total_general = [], 0.0
    for v in ventas:
        total_general += float(v.total)
        resultado.append({
            "id_venta": v.id_venta,
            "cliente_nombre": f"{v.cliente.nombres} {v.cliente.apellidos}",
            "total": float(v.total),
            "estado": v.estado,
            "detalles": [
                {
                    "nombre_item": d.nombre_item, "cantidad": d.cantidad,
                    "precio_unitario": float(d.precio_unitario), "subtotal_item": float(d.subtotal_item),
                }
                for d in v.detalles
            ],
        })
    return resultado, total_general


@router.get("/ventas-diarias", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def reporte_ventas_diarias(fecha: Optional[date] = Query(None), db: Session = Depends(get_db)):
    fecha_consulta = fecha or date.today()
    ventas, total_general = _obtener_ventas_del_dia(fecha_consulta, db)
    return {
        "success": True, "fecha": fecha_consulta.isoformat(),
        "ventas": ventas, "total_general": total_general, "cantidad_ventas": len(ventas),
    }


@router.get("/ventas-diarias/pdf", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def reporte_ventas_diarias_pdf(fecha: Optional[date] = Query(None), db: Session = Depends(get_db)):
    fecha_consulta = fecha or date.today()
    ventas, total_general = _obtener_ventas_del_dia(fecha_consulta, db)
    pdf_bytes = generar_pdf_reporte_diario(fecha_consulta.isoformat(), ventas, total_general)
    return Response(
        content=pdf_bytes, media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=reporte_ventas_{fecha_consulta.isoformat()}.pdf"},
    )


@router.get("/ventas-diarias/excel", dependencies=[Depends(requerir_roles("Administrador", "Empleado"))])
def reporte_ventas_diarias_excel(fecha: Optional[date] = Query(None), db: Session = Depends(get_db)):
    fecha_consulta = fecha or date.today()
    ventas, total_general = _obtener_ventas_del_dia(fecha_consulta, db)
    excel_bytes = generar_excel_reporte_diario(fecha_consulta.isoformat(), ventas, total_general)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=reporte_ventas_{fecha_consulta.isoformat()}.xlsx"},
    )