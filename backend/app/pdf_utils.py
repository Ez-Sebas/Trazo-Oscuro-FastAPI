from datetime import datetime
from io import BytesIO
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

NOMBRE_PROYECTO = "Trazo Oscuro - Estudio de Tatuajes"


def _estilos():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="TituloRojo", fontSize=18, textColor=colors.HexColor("#B91C1C"), spaceAfter=6))
    styles.add(ParagraphStyle(name="Normal9", fontSize=9, textColor=colors.HexColor("#334155")))
    styles.add(ParagraphStyle(name="Celda8", fontSize=8, leading=10, textColor=colors.HexColor("#334155")))
    styles.add(ParagraphStyle(name="Pie", fontSize=8, textColor=colors.HexColor("#78716C"), leading=11))
    return styles


def generar_pdf_factura(factura: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=2 * cm, bottomMargin=2 * cm)
    styles = _estilos()
    elementos = []

    encabezado = Table([
        [Paragraph(NOMBRE_PROYECTO, styles["TituloRojo"]), Paragraph(f"FACTURA<br/><b>{factura['numero_factura']}</b>", styles["Heading2"])],
        [Paragraph("Estudio de tatuajes · Medellín, Colombia", styles["Normal9"]), Paragraph(f"Fecha: {factura['fecha_generacion']}<br/>Estado: {factura['estado']}", styles["Normal9"])],
    ], colWidths=[10.5 * cm, 7 * cm])
    encabezado.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LINEBELOW", (0, 1), (-1, 1), 0.8, colors.HexColor("#D6D3D1")),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 10),
    ]))
    elementos.append(encabezado)
    elementos.append(Spacer(1, 14))
    elementos.append(Paragraph(f"Cliente: <b>{factura['cliente_nombre']}</b>", styles["Normal9"]))
    elementos.append(Spacer(1, 14))

    data = [["Producto/Servicio", "Cant.", "Precio unit.", "Subtotal"]]
    for d in factura["detalles"]:
        data.append([
            d["nombre_item"], str(d["cantidad"]),
            f"${d['precio_unitario']:,.0f}", f"${d['subtotal_item']:,.0f}",
        ])

    tabla = Table(data, colWidths=[8 * cm, 2 * cm, 3.5 * cm, 3.5 * cm])
    tabla.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A1A1A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
    ]))
    elementos.append(tabla)
    elementos.append(Spacer(1, 16))

    totales = [
        ["Subtotal", f"${factura['subtotal']:,.0f}"],
        ["Descuento", f"${factura['descuento']:,.0f}"],
        ["IVA", f"${factura['iva']:,.0f}"],
        ["Total", f"${factura['total']:,.0f}"],
    ]
    tabla_totales = Table(totales, colWidths=[4 * cm, 4 * cm])
    tabla_totales.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -2), colors.HexColor("#FAFAF9")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, -1), (-1, -1), colors.HexColor("#B91C1C")),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.HexColor("#B91C1C")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elementos.append(tabla_totales)
    elementos.append(Spacer(1, 24))
    elementos.append(Paragraph(
        f"Documento generado automáticamente el {datetime.now().strftime('%Y-%m-%d %H:%M')}.",
        styles["Pie"],
    ))

    doc.build(elementos)
    buffer.seek(0)
    return buffer.getvalue()


def generar_pdf_reporte_diario(fecha: str, ventas: list, total_general: float) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter), topMargin=1.5 * cm, bottomMargin=1.5 * cm)
    styles = _estilos()
    elementos = []

    elementos.append(Paragraph(NOMBRE_PROYECTO, styles["TituloRojo"]))
    elementos.append(Paragraph("Reporte diario de ventas", styles["Heading2"]))
    elementos.append(Paragraph(f"Fecha consultada: {fecha}", styles["Normal9"]))
    elementos.append(Paragraph(f"Ventas incluidas: {len(ventas)}", styles["Normal9"]))
    elementos.append(Spacer(1, 12))

    data = [["Fecha", "N.º Venta", "Cliente", "Producto/Servicio", "Cant.", "Precio unit.", "Subtotal", "Total venta", "Estado"]]
    for v in ventas:
        detalles = v["detalles"] or [{"nombre_item": "Sin detalle", "cantidad": 0, "precio_unitario": 0, "subtotal_item": 0}]
        for detalle in detalles:
            data.append([
                fecha,
                f"#{v['id_venta']}",
                Paragraph(v["cliente_nombre"], styles["Celda8"]),
                Paragraph(detalle["nombre_item"], styles["Celda8"]),
                str(detalle["cantidad"]),
                f"${detalle['precio_unitario']:,.0f}",
                f"${detalle['subtotal_item']:,.0f}",
                f"${v['total']:,.0f}",
                v["estado"],
            ])

    tabla = Table(data, colWidths=[1.7 * cm, 1.8 * cm, 3.1 * cm, 4.2 * cm, 1.2 * cm, 2.2 * cm, 2.2 * cm, 2.3 * cm, 2.2 * cm], repeatRows=1)
    tabla.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A1A1A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 7),
        ("LEADING", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (4, 1), (-1, -1), "RIGHT"),
    ]))
    elementos.append(tabla)
    elementos.append(Spacer(1, 16))
    elementos.append(Paragraph(f"Total del día: ${total_general:,.0f}", styles["Heading3"]))
    elementos.append(Spacer(1, 10))
    elementos.append(Paragraph(
        f"Reporte generado el {datetime.now().strftime('%Y-%m-%d %H:%M')}.", styles["Normal9"]
    ))

    doc.build(elementos)
    buffer.seek(0)
    return buffer.getvalue()