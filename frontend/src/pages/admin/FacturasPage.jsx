import { useState, useEffect, useCallback } from 'react'
import { obtenerFacturas, descargarFacturaPdf, anularFactura } from '../../services/facturaService.js'
import { descargarBlob } from '../../utils/descargarArchivo.js'
import { Icon } from '../../components/ui/Icon.jsx'

export const FacturasPage = () => {
    const [facturas, setFacturas] = useState([])
    const [cargando, setCargando] = useState(true)

    const [busqueda, setBusqueda] = useState('')
    const [cliente, setCliente] = useState('')
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)

    const cargar = useCallback(async () => {
        setCargando(true)
        try {
            const data = await obtenerFacturas({
                numero_factura: busqueda, cliente, fecha_inicio: fechaInicio, fecha_fin: fechaFin,
                pagina, por_pagina: 12,
            })
            setFacturas(data.facturas)
            setTotalPaginas(data.total_paginas)
        } finally {
            setCargando(false)
        }
    }, [busqueda, cliente, fechaInicio, fechaFin, pagina])

    useEffect(() => {
        const timer = setTimeout(cargar, 350)
        return () => clearTimeout(timer)
    }, [cargar])

    const verPdf = async (id, numero) => {
        try {
            const blob = await descargarFacturaPdf(id)
            descargarBlob(blob, `factura_${numero}.pdf`, true)
        } catch (err) {
            alert(err.message)
        }
    }

    const anular = async (id) => {
        if (!confirm('¿Anular esta factura?')) return
        try { await anularFactura(id); cargar() } catch (err) { alert(err.message) }
    }

    return (
        <div>
            <p className="eyebrow mb-3">Documentos de venta</p>
            <h1 className="editorial-title text-texto text-3xl sm:text-4xl mb-3">Facturas</h1>
            <p className="text-texto-secundario text-sm mb-6">Consulta, descarga y administra las facturas generadas.</p>

            <div className="border border-borde bg-superficie p-4 mb-6">
                <div className="flex items-center gap-2 mb-4 text-texto-secundario text-xs uppercase tracking-[0.14em]"><Icon nombre="buscar" size={16} /> Buscar factura</div>
                <div className="grid gap-3 md:grid-cols-[1.2fr_1.2fr_1fr_1fr]">
                <input
                    value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }}
                    placeholder="Buscar por número de factura..."
                    className="field"
                />
                <input value={cliente} onChange={(e) => { setCliente(e.target.value); setPagina(1) }} placeholder="Cliente o correo..." aria-label="Buscar por cliente" className="field" />
                <input type="date" value={fechaInicio} onChange={(e) => { setFechaInicio(e.target.value); setPagina(1) }} aria-label="Fecha inicial" className="field" />
                <input type="date" value={fechaFin} onChange={(e) => { setFechaFin(e.target.value); setPagina(1) }} aria-label="Fecha final" className="field" />
                </div>
            </div>

            {cargando ? (
                <p className="text-texto-secundario">Cargando facturas...</p>
            ) : (
                <>
                    <div className="admin-table-shell hidden md:block overflow-x-auto">
                        <table className="admin-table w-full min-w-190 text-sm text-left">
                            <thead>
                                <tr>
                                    <th className="p-2">N.º Factura</th>
                                    <th className="p-2">Cliente</th>
                                    <th className="p-2">Total</th>
                                    <th className="p-2">Estado</th>
                                    <th className="p-2">Fecha</th>
                                    <th className="p-2">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {facturas.map((f) => (
                                    <tr key={f.id_factura}>
                                        <td className="text-texto font-medium">{f.numero_factura}</td>
                                        <td className="text-texto-secundario">{f.cliente_nombre}</td>
                                        <td className="text-texto font-medium">${f.total.toLocaleString('es-CO')}</td>
                                        <td className="p-2">
                                            <span className={`inline-flex border px-2.5 py-1 rounded-full text-[11px] ${f.estado === 'emitida' ? 'border-acento/30 bg-acento/10 text-acento-suave' : 'border-borde bg-superficie-clara text-texto-secundario'}`}>
                                                {f.estado}
                                            </span>
                                        </td>
                                        <td className="text-texto-secundario text-xs">{new Date(f.fecha_generacion).toLocaleDateString('es-CO')}</td>
                                        <td className="p-2"><div className="flex flex-wrap gap-3">
                                            <button onClick={() => verPdf(f.id_factura, f.numero_factura)} className="inline-flex items-center gap-1.5 text-texto-secundario hover:text-acento cursor-pointer"><Icon nombre="buscar" size={14} /> Ver PDF</button>
                                            {f.estado === 'emitida' && (
                                                <button onClick={() => anular(f.id_factura)} className="inline-flex items-center gap-1.5 text-texto-secundario hover:text-acento cursor-pointer"><Icon nombre="cerrarMenu" size={14} /> Anular</button>
                                            )}
                                        </div></td>
                                    </tr>
                                ))}
                                {facturas.length === 0 && (
                                    <tr><td colSpan={6} className="p-4 text-center text-texto-secundario">Sin resultados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="md:hidden flex flex-col gap-3">
                        {facturas.map((factura) => (
                            <article key={factura.id_factura} className="border border-borde bg-superficie p-4">
                                <div className="flex items-start justify-between gap-3 border-b border-borde/70 pb-3 mb-3">
                                    <div><p className="text-texto font-medium">{factura.numero_factura}</p><p className="text-texto-secundario text-xs mt-1">{factura.cliente_nombre}</p></div>
                                    <span className={`inline-flex border px-2.5 py-1 rounded-full text-[11px] ${factura.estado === 'emitida' ? 'border-acento/30 bg-acento/10 text-acento-suave' : 'border-borde bg-superficie-clara text-texto-secundario'}`}>{factura.estado}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs mb-4"><div><p className="text-texto-secundario mb-1">Total</p><p className="text-texto font-medium">${factura.total.toLocaleString('es-CO')}</p></div><div><p className="text-texto-secundario mb-1">Fecha</p><p className="text-texto-secundario">{new Date(factura.fecha_generacion).toLocaleDateString('es-CO')}</p></div></div>
                                <div className="flex flex-wrap gap-3"><button onClick={() => verPdf(factura.id_factura, factura.numero_factura)} className="inline-flex items-center gap-1.5 text-texto-secundario hover:text-acento text-sm cursor-pointer"><Icon nombre="buscar" size={14} /> Ver PDF</button>{factura.estado === 'emitida' && <button onClick={() => anular(factura.id_factura)} className="inline-flex items-center gap-1.5 text-texto-secundario hover:text-acento text-sm cursor-pointer"><Icon nombre="cerrarMenu" size={14} /> Anular</button>}</div>
                            </article>
                        ))}
                        {facturas.length === 0 && <p className="border border-borde bg-superficie p-6 text-center text-texto-secundario">Sin resultados.</p>}
                    </div>

                    {totalPaginas > 1 && (
                        <div className="flex justify-center items-center gap-3 mt-4">
                            <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} className="text-texto-secundario disabled:opacity-30 cursor-pointer">←</button>
                            <span className="text-texto-secundario text-sm">Página {pagina} de {totalPaginas}</span>
                            <button disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)} className="text-texto-secundario disabled:opacity-30 cursor-pointer">→</button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}