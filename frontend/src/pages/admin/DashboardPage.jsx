import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { obtenerResumenAdmin, obtenerDashboardVentas } from '../../services/dashboardService.js'
import { obtenerProductosActivos } from '../../services/productoService.js'
import { obtenerClientes } from '../../services/usuarioService.js'
import { CitasDashboard } from '../../components/dashboard/CitasDashboard.jsx'
import { Icon } from '../../components/ui/Icon.jsx'

const pesos = (valor) => `$${Number(valor || 0).toLocaleString('es-CO')}`

const ejeRecharts = { fill: '#A8A29E', fontSize: 11 }
const tooltipRecharts = {
    background: '#151515',
    border: '1px solid #3F3F3F',
    borderRadius: '0.5rem',
    color: '#F5F5F4',
}

const CardIndicador = ({ titulo, valor, detalle }) => (
    <div className="kpi-card">
        <p className="text-texto-secundario text-[10px] font-bold tracking-[0.16em] uppercase mb-2">{titulo}</p>
        <p className="text-texto text-2xl font-serif leading-none">{valor}</p>
        {detalle && <p className="text-texto-secundario text-xs mt-2">{detalle}</p>}
    </div>
)

export const DashboardPage = () => {
    const [resumen, setResumen] = useState(null)
    const [ventas, setVentas] = useState(null)
    const [productos, setProductos] = useState([])
    const [clientes, setClientes] = useState([])
    const [cargando, setCargando] = useState(true)

    const [filtros, setFiltros] = useState({
        fecha_inicio: '', fecha_fin: '', id_producto: '',
        estado: '', id_cliente: '', agrupacion: 'day',
    })

    const actualizarFiltro = (campo) => (e) =>
        setFiltros((prev) => ({ ...prev, [campo]: e.target.value }))

    const limpiarFiltros = () => setFiltros({
        fecha_inicio: '', fecha_fin: '', id_producto: '',
        estado: '', id_cliente: '', agrupacion: filtros.agrupacion,
    })

    // Se expone aparte porque el bloque de citas la vuelve a llamar cuando
    // cambia un estado o un cobro, y así las tarjetas de arriba no se quedan
    // con cifras viejas.
    const cargarResumen = useCallback(() => {
        obtenerResumenAdmin().then((d) => setResumen(d.cards)).catch(() => setResumen(null))
    }, [])

    useEffect(() => {
        cargarResumen()
        obtenerProductosActivos().then((d) => setProductos(d.productos)).catch(() => setProductos([]))
        obtenerClientes().then((d) => setClientes(d.clientes)).catch(() => setClientes([]))
    }, [cargarResumen])

    useEffect(() => {
        const timer = setTimeout(() => {
            setCargando(true)
            obtenerDashboardVentas(filtros)
                .then(setVentas)
                .catch(() => setVentas(null))
                .finally(() => setCargando(false))
        }, 350)
        return () => clearTimeout(timer)
    }, [filtros])

    const datosLinea = (ventas?.serie_tiempo.labels || []).map((label, i) => ({
        periodo: label, total: ventas.serie_tiempo.totales[i],
    }))

    const datosBarras = (ventas?.top_productos.labels || []).map((label, i) => ({
        producto: label, cantidad: ventas.top_productos.cantidades[i],
    }))

    return (
        <div className="max-w-7xl">
            <div className="mb-8">
                <p className="eyebrow mb-3">Panel de control</p>
                <h1 className="editorial-title text-texto text-3xl sm:text-4xl mb-3">Dashboard administrativo</h1>
                <p className="text-texto-secundario text-sm">Consulta el estado general y el rendimiento de la operación.</p>
            </div>

            {resumen && (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
                    <CardIndicador titulo="Usuarios activos" valor={resumen.total_usuarios} />
                    <CardIndicador titulo="Productos activos" valor={resumen.total_productos} />
                    <CardIndicador titulo="Servicios activos" valor={resumen.total_servicios} />
                    <CardIndicador titulo="Citas registradas" valor={resumen.total_citas} detalle={`${resumen.citas_vigentes} en agenda activa`} />
                    <CardIndicador titulo="Ventas totales" valor={resumen.total_ventas} />
                    <CardIndicador titulo="Facturado en ventas" valor={pesos(resumen.total_facturado)} detalle="Productos vendidos en línea y en mostrador" />
                    <CardIndicador titulo="Cobrado en citas" valor={pesos(resumen.cobrado_en_citas)} detalle="Servicios pagados en el estudio" />
                    <CardIndicador titulo="PQR" valor={resumen.pqr_recibidas} detalle={`${resumen.pqr_pendientes} sin resolver`} />
                </div>
            )}

            {/* ============ VENTAS (solo productos) ============ */}
            <section>
                <div className="mb-5">
                    <p className="eyebrow mb-3">Comercio</p>
                    <h2 className="editorial-title text-texto text-2xl sm:text-3xl">Análisis de ventas</h2>
                    <p className="text-texto-secundario text-sm mt-2 max-w-2xl">
                        Productos vendidos por la tienda en línea y en mostrador.
                        El seguimiento de servicios está en la sección de citas, más abajo.
                    </p>
                </div>

                <div className="panel p-4 sm:p-5 mb-6">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <span className="flex items-center gap-2 text-texto-secundario text-xs uppercase tracking-[0.14em]">
                            <Icon nombre="filtro" size={16} /> Filtrar ventas
                        </span>
                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="text-texto-secundario text-xs hover:text-acento-suave transition-colors cursor-pointer"
                        >
                            Limpiar filtros
                        </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <div>
                            <label htmlFor="ventas-desde" className="field-label">Desde</label>
                            <input id="ventas-desde" type="date" value={filtros.fecha_inicio} onChange={actualizarFiltro('fecha_inicio')} className="field" />
                        </div>
                        <div>
                            <label htmlFor="ventas-hasta" className="field-label">Hasta</label>
                            <input id="ventas-hasta" type="date" value={filtros.fecha_fin} onChange={actualizarFiltro('fecha_fin')} className="field" />
                        </div>
                        <div>
                            <label htmlFor="ventas-producto" className="field-label">Producto</label>
                            <select id="ventas-producto" value={filtros.id_producto} onChange={actualizarFiltro('id_producto')} className="field field-select">
                                <option value="">Todos los productos</option>
                                {productos.map((p) => <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="ventas-estado" className="field-label">Estado</label>
                            <select id="ventas-estado" value={filtros.estado} onChange={actualizarFiltro('estado')} className="field field-select">
                                <option value="">Todos los estados</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="pagada">Pagada</option>
                                <option value="entregada">Entregada</option>
                                <option value="cancelada">Cancelada</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="ventas-cliente" className="field-label">Cliente</label>
                            <select id="ventas-cliente" value={filtros.id_cliente} onChange={actualizarFiltro('id_cliente')} className="field field-select">
                                <option value="">Todos los clientes</option>
                                {clientes.map((c) => <option key={c.id_usuario} value={c.id_usuario}>{c.nombre_completo}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="ventas-agrupacion" className="field-label">Agrupar por</label>
                            <select id="ventas-agrupacion" value={filtros.agrupacion} onChange={actualizarFiltro('agrupacion')} className="field field-select">
                                <option value="day">Por día</option>
                                <option value="week">Por semana</option>
                                <option value="month">Por mes</option>
                            </select>
                        </div>
                    </div>
                </div>

                {ventas && (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <CardIndicador titulo="Ventas en el rango" valor={ventas.resumen.total_ventas} />
                        <CardIndicador titulo="Total facturado" valor={pesos(ventas.resumen.total_facturado)} />
                        <CardIndicador titulo="Ticket promedio" valor={pesos(ventas.resumen.ticket_promedio)} />
                    </div>
                )}

                {cargando ? (
                    <p className="text-texto-secundario text-sm">Cargando gráficos...</p>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="panel p-5">
                            <h3 className="text-texto text-sm mb-1">Ventas en el tiempo</h3>
                            <p className="text-texto-secundario text-xs mb-4">Total facturado por periodo.</p>
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={datosLinea}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#3F3F3F" />
                                    <XAxis dataKey="periodo" tick={ejeRecharts} />
                                    <YAxis tick={ejeRecharts} />
                                    <Tooltip contentStyle={tooltipRecharts} formatter={(valor) => pesos(valor)} />
                                    <Line type="monotone" dataKey="total" name="Total" stroke="#B91C1C" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="panel p-5">
                            <h3 className="text-texto text-sm mb-1">Productos más vendidos</h3>
                            <p className="text-texto-secundario text-xs mb-4">Top 5 dentro del filtro aplicado.</p>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={datosBarras}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#3F3F3F" />
                                    <XAxis dataKey="producto" tick={{ fill: '#A8A29E', fontSize: 10 }} />
                                    <YAxis tick={ejeRecharts} allowDecimals={false} />
                                    <Tooltip contentStyle={tooltipRecharts} cursor={{ fill: 'rgba(185,28,28,0.08)' }} />
                                    <Bar dataKey="cantidad" name="Unidades" fill="#B91C1C" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </section>

            {/* ============ CITAS ============ */}
            <CitasDashboard esAdmin onCambio={cargarResumen} />
        </div>
    )
}
