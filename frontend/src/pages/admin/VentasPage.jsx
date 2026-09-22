import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { obtenerVentas, entregarVenta, cancelarVenta } from '../../services/ventaService.js'
import { generarFactura } from '../../services/facturaService.js'
import { Icon } from '../../components/ui/Icon.jsx'
import { Badge } from '../../components/ui/Badge.jsx'

export const VentasPage = () => {
    const [ventas, setVentas] = useState([])
    const [cargando, setCargando] = useState(true)

    const [busqueda, setBusqueda] = useState('')
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')
    const [item, setItem] = useState('')
    const [valorMin, setValorMin] = useState('')
    const [valorMax, setValorMax] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)

    const cargar = useCallback(async () => {
        setCargando(true)
        try {
            const data = await obtenerVentas({
                busqueda, fecha_inicio: fechaInicio, fecha_fin: fechaFin, item,
                valor_min: valorMin, valor_max: valorMax,
                estado: filtroEstado, pagina, por_pagina: 12,
            })
            setVentas(data.ventas)
            setTotalPaginas(data.total_paginas)
        } finally {
            setCargando(false)
        }
    }, [busqueda, fechaInicio, fechaFin, item, valorMin, valorMax, filtroEstado, pagina])

    useEffect(() => {
        const timer = setTimeout(cargar, 350)
        return () => clearTimeout(timer)
    }, [cargar])

    const entregar = async (id) => {
        try { await entregarVenta(id); cargar() } catch (err) { alert(err.message) }
    }

    const cancelar = async (id) => {
        if (!confirm('¿Cancelar esta venta? Si ya estaba pagada, se reembolsará automáticamente en Stripe.')) return
        try {
            const resultado = await cancelarVenta(id)
            alert(resultado.message)
            cargar()
        } catch (err) {
            alert(err.message)
        }
    }

    const generarFacturaDeVenta = async (id) => {
        try {
            const resultado = await generarFactura(id)
            alert(`Factura ${resultado.numero_factura} generada correctamente.`)
            cargar()
        } catch (err) {
            alert(err.message)
        }
    }

    return (
        <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
                <h1 className="text-texto font-serif text-2xl">Historial de Ventas</h1>
                <Link to="/admin/facturas" className="inline-flex items-center gap-2 text-acento-suave text-sm hover:text-texto transition-colors">
                    <Icon nombre="adelante" size={15} /> Ver facturas
                </Link>
            </div>
            <p className="text-texto-secundario text-sm mb-6">Ventas web y de mostrador, con su estado de pago.</p>

            <div className="flex flex-wrap gap-3 mb-6">
                <input
                    value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }}
                    placeholder="Cliente o correo..."
                    className="field flex-1 min-w-45"
                />
                <input value={item} onChange={(e) => { setItem(e.target.value); setPagina(1) }} placeholder="Producto o servicio..." className="field flex-1 min-w-45" />
                <input type="date" value={fechaInicio} onChange={(e) => { setFechaInicio(e.target.value); setPagina(1) }} className="field" />
                <input type="date" value={fechaFin} onChange={(e) => { setFechaFin(e.target.value); setPagina(1) }} className="field" />
                <input type="number" min="0" value={valorMin} onChange={(e) => { setValorMin(e.target.value); setPagina(1) }} placeholder="Valor mínimo" className="field w-36" />
                <input type="number" min="0" value={valorMax} onChange={(e) => { setValorMax(e.target.value); setPagina(1) }} placeholder="Valor máximo" className="field w-36" />
                <select value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1) }} className="field">
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="pagada">Pagada</option>
                    <option value="entregada">Entregada</option>
                    <option value="cancelada">Cancelada</option>
                </select>
            </div>

            {cargando ? (
                <p className="text-texto-secundario">Cargando ventas...</p>
            ) : (
                <>
                    <div className="overflow-x-auto bg-superficie rounded-lg p-4">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-texto-secundario border-b border-borde">
                                    <th className="p-2">#</th>
                                    <th className="p-2">Cliente</th>
                                    <th className="p-2">Artículos</th>
                                    <th className="p-2">Origen</th>
                                    <th className="p-2">Total</th>
                                    <th className="p-2">Pago</th>
                                    <th className="p-2">Estado</th>
                                    <th className="p-2">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ventas.map((v) => (
                                    <tr key={v.id_venta} className="border-b border-borde/50">
                                        <td className="p-2 text-texto">#{v.id_venta}</td>
                                        <td className="p-2 text-texto-secundario">{v.cliente_nombre}</td>
                                        <td className="p-2 text-texto-secundario text-xs max-w-56">
                                            {v.detalles?.length ? v.detalles.map((detalle) => `${detalle.nombre_item} x${detalle.cantidad}`).join(', ') : 'Sin detalle'}
                                        </td>
                                        <td className="p-2 text-texto-secundario">{v.origen === 'web_cliente' ? 'Web' : 'Mostrador'}</td>
                                        <td className="p-2 text-texto-secundario">${v.total.toLocaleString('es-CO')}</td>
                                        <td className="p-2">
                                            <Badge estado={v.estado_pago} />
                                        </td>
                                        <td className="p-2">
                                            <Badge estado={v.estado} />
                                        </td>
                                        <td className="p-2">
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                            {v.estado === 'pagada' && (
                                                <button onClick={() => entregar(v.id_venta)} className="inline-flex items-center gap-1.5 text-texto-secundario hover:text-acento cursor-pointer"><Icon nombre="check" size={14} /> Entregar</button>
                                            )}
                                            {(v.estado === 'pagada' || v.estado === 'entregada') && !v.tiene_factura && (
                                                <button onClick={() => generarFacturaDeVenta(v.id_venta)} className="inline-flex items-center gap-1.5 text-texto-secundario hover:text-acento cursor-pointer"><Icon nombre="mas" size={14} /> Generar factura</button>
                                            )}
                                            {v.tiene_factura && (
                                                <span className="inline-flex items-center gap-1.5 border border-acento/30 bg-acento/10 text-acento-suave px-2.5 py-1 rounded-full text-[11px]"><Icon nombre="check" size={13} /> Facturada</span>
                                            )}
                                            {(v.estado === 'pendiente' || v.estado === 'pagada') && (
                                                <button onClick={() => cancelar(v.id_venta)} className="inline-flex items-center gap-1.5 text-texto-secundario hover:text-acento cursor-pointer"><Icon nombre="cerrarMenu" size={14} /> Cancelar</button>
                                            )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {ventas.length === 0 && (
                                    <tr><td colSpan={8} className="p-4 text-center text-texto-secundario">Sin resultados.</td></tr>
                                )}
                            </tbody>
                        </table>
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