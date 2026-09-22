import { useState, useEffect, useCallback } from 'react'
import { obtenerReporteDiario, descargarReportePdf, descargarReporteExcel } from '../../services/reporteService.js'
import { descargarBlob } from '../../utils/descargarArchivo.js'
import { Icon } from '../../components/ui/Icon.jsx'

const hoy = () => new Date().toISOString().split('T')[0]

export const ReportesPage = () => {
    const [fecha, setFecha] = useState(hoy())
    const [reporte, setReporte] = useState(null)
    const [cargando, setCargando] = useState(true)

    const cargar = useCallback(async () => {
        setCargando(true)
        try {
            const data = await obtenerReporteDiario(fecha)
            setReporte(data)
        } finally {
            setCargando(false)
        }
    }, [fecha])

    useEffect(() => {
        const timer = setTimeout(cargar, 0)
        return () => clearTimeout(timer)
    }, [cargar])

    const descargarPdf = async () => {
        try {
            const blob = await descargarReportePdf(fecha)
            descargarBlob(blob, `reporte_ventas_${fecha}.pdf`, true)
        } catch (err) { alert(err.message) }
    }

    const descargarExcel = async () => {
        try {
            const blob = await descargarReporteExcel(fecha)
            descargarBlob(blob, `reporte_ventas_${fecha}.xlsx`)
        } catch (err) { alert(err.message) }
    }

    return (
        <div>
            <p className="eyebrow mb-3">Análisis operativo</p>
            <h1 className="editorial-title text-texto text-3xl sm:text-4xl mb-3">Reporte diario</h1>
            <p className="text-texto-secundario text-sm mb-6">Consulta y exporta el detalle de ventas de un día específico.</p>

            <div className="border border-borde bg-superficie p-4 mb-6 flex flex-wrap items-end gap-3">
                <div>
                    <label className="text-texto-secundario text-xs block mb-1">Fecha</label>
                    <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="field" />
                </div>
                <button onClick={descargarPdf} className="inline-flex items-center gap-2 bg-acento text-texto text-sm px-4 py-2.5 rounded-md hover:bg-red-800 transition-colors cursor-pointer"><Icon nombre="buscar" size={15} /> Exportar PDF</button>
                <button onClick={descargarExcel} className="inline-flex items-center gap-2 bg-fondo border border-borde text-texto text-sm px-4 py-2.5 rounded-md hover:border-acento transition-colors cursor-pointer"><Icon nombre="adelante" size={15} /> Exportar Excel</button>
            </div>

            {cargando ? (
                <p className="text-texto-secundario">Cargando reporte...</p>
            ) : reporte && reporte.ventas.length === 0 ? (
                <p className="text-texto-secundario">No hay ventas registradas para esta fecha.</p>
            ) : reporte && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                        <div className="border border-borde bg-superficie p-5">
                            <p className="text-texto-secundario text-xs">Ventas del día</p>
                            <p className="text-texto text-2xl font-serif">{reporte.cantidad_ventas}</p>
                        </div>
                        <div className="border border-borde bg-superficie p-5">
                            <p className="text-texto-secundario text-xs">Total facturado</p>
                            <p className="text-acento text-2xl font-serif">${reporte.total_general.toLocaleString('es-CO')}</p>
                        </div>
                    </div>

                    <div className="admin-table-shell hidden md:block overflow-x-auto">
                        <table className="admin-table w-full min-w-190 text-sm text-left">
                            <thead>
                                <tr>
                                    <th className="p-2">#</th>
                                    <th className="p-2">Cliente</th>
                                    <th className="p-2">Ítems</th>
                                    <th className="p-2">Total</th>
                                    <th className="p-2">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reporte.ventas.map((v) => (
                                    <tr key={v.id_venta}>
                                        <td className="text-texto font-medium">#{v.id_venta}</td>
                                        <td className="text-texto-secundario">{v.cliente_nombre}</td>
                                        <td className="text-texto-secundario text-xs max-w-80">
                                            {v.detalles.map((d) => `${d.nombre_item} x${d.cantidad}`).join(', ')}
                                        </td>
                                        <td className="text-texto font-medium">${v.total.toLocaleString('es-CO')}</td>
                                        <td><span className="inline-flex border border-borde bg-superficie-clara text-texto-secundario px-2.5 py-1 rounded-full text-[11px]">{v.estado}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="md:hidden flex flex-col gap-3">
                        {reporte.ventas.map((venta) => (
                            <article key={venta.id_venta} className="border border-borde bg-superficie p-4">
                                <div className="flex items-start justify-between gap-3 border-b border-borde/70 pb-3 mb-3"><div><p className="text-acento-suave text-[10px] uppercase tracking-[0.16em]">Venta #{venta.id_venta}</p><p className="text-texto font-medium mt-1">{venta.cliente_nombre}</p></div><span className="border border-borde bg-superficie-clara text-texto-secundario px-2.5 py-1 rounded-full text-[11px]">{venta.estado}</span></div>
                                <div className="mb-4"><p className="text-texto-secundario text-[10px] uppercase tracking-wider mb-1">Artículos</p><p className="text-texto-secundario text-sm">{venta.detalles.map((detalle) => `${detalle.nombre_item} x${detalle.cantidad}`).join(', ')}</p></div>
                                <div className="flex justify-between border-t border-borde/70 pt-3"><span className="text-texto-secundario text-sm">Total</span><strong className="text-texto">${venta.total.toLocaleString('es-CO')}</strong></div>
                            </article>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}