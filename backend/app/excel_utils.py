from io import BytesIO
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Border, Side, Alignment
from openpyxl.utils import get_column_letter


def generar_excel_reporte_diario(fecha: str, ventas: list, total_general: float) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "Reporte de ventas"

    ws.merge_cells("A1:I1")
    ws["A1"] = f"Trazo Oscuro - Reporte diario de ventas - {fecha}"
    ws["A1"].font = Font(size=14, bold=True, color="B91C1C")
    ws["A1"].alignment = Alignment(horizontal="center")

    ws.append([])
    encabezados = ["Fecha", "N.º Venta", "Cliente", "Producto/Servicio", "Cantidad", "Precio unitario", "Subtotal ítem", "Total venta", "Estado"]
    ws.append(encabezados)
    borde = Border(bottom=Side(style="thin", color="D6D3D1"))
    for cell in ws[3]:
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill(start_color="1A1A1A", end_color="1A1A1A", fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = borde

    for v in ventas:
        for d in v["detalles"]:
            ws.append([
                fecha, f"#{v['id_venta']}", v["cliente_nombre"], d["nombre_item"],
                d["cantidad"], d["precio_unitario"], d["subtotal_item"], v["total"], v["estado"],
            ])

    for row in ws.iter_rows(min_row=4, max_row=ws.max_row, min_col=1, max_col=9):
        for cell in row:
            cell.border = borde
            cell.alignment = Alignment(vertical="top", wrap_text=True)
        for index in (6, 7, 8):
            row[index - 1].number_format = '$#,##0'

    ws.append([])
    fila_total = ws.max_row + 1
    ws.append(["", "", "", "", "", "", "TOTAL DEL DÍA", total_general, ""])
    ws[f"G{fila_total}"].font = Font(bold=True)
    ws[f"H{fila_total}"].font = Font(bold=True, color="B91C1C")
    ws[f"H{fila_total}"].number_format = '$#,##0'

    for col, ancho in zip("ABCDEFGHI", [14, 12, 24, 30, 12, 16, 16, 16, 14]):
        ws.column_dimensions[col].width = ancho

    ws.freeze_panes = "A4"
    ws.auto_filter.ref = f"A3:I{3 + sum(len(v['detalles']) for v in ventas)}"
    ws.sheet_view.showGridLines = False

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()