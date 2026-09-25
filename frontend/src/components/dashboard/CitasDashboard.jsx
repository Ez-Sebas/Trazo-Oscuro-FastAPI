import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { obtenerDashboardCitas } from '../../services/dashboardService.js'
import { obtenerServiciosActivos } from '../../services/servicioService.js'
import { obtenerEmpleadosActivos } from '../../services/usuarioService.js'
import { actualizarEstadoCita, actualizarPagoCita } from '../../services/citaService.js'
import { Badge, BadgePago } from '../ui/Badge.jsx'
import { Icon } from '../ui/Icon.jsx'

const ESTADOS_CITA = ['pendiente', 'confirmada', 'realizada', 'cancelada']

/**
 * Estados que este usuario puede elegir para una cita.
 *
 * 'pendiente' nunca se ofrece: se sale de ahí cuando el cliente confirma
 * desde el correo. Y 'confirmada' solo la puede asignar un administrador,
 * así que a un empleado únicamente se le muestra si ya es el estado actual
 * (si no, el <select> no podría representarlo).
 */
const estadosDisponibles = (estadoActual, esAdmin) => ({
    pendiente: esAdmin ? ['pendiente', 'cancelada'] : [],
    confirmada: ['confirmada', 'realizada', 'cancelada'],
    realizada: ['realizada'],
    cancelada: ['cancelada'],
}[estadoActual] || [])
const puedeGestionarPago = (cita) =>
    ['confirmada', 'realizada'].includes(cita.estado) && cita.estado_pago !== 'pagada'

const pesos = (valor) => `$${Number(valor || 0).toLocaleString('es-CO')}`

/** Concuerda el sustantivo con el número: 1 cita · 3 citas. */
const plural = (cantidad, singular, plural_) => `${cantidad} ${cantidad === 1 ? singular : plural_}`

const ejeRecharts = { fill: '#A8A29E', fontSize: 11 }
const tooltipRecharts = {
    background: '#151515',
    border: '1px solid #3F3F3F',
    borderRadius: '0.5rem',
    color: '#F5F5F4',
}

const Kpi = ({ titulo, valor, detalle }) => (
    <div className="kpi-card">
        <p className="text-texto-secundario text-[10px] font-bold tracking-[0.16em] uppercase mb-2">{titulo}</p>
        <p className="text-texto text-2xl font-serif leading-none">{valor}</p>
        {detalle && <p className="text-texto-secundario text-xs mt-2">{detalle}</p>}
    </div>
)

/**
 * Bloque de gestión y analítica de citas, compartido por el panel del
 * administrador y el del empleado.
 *
 * El alcance lo impone el backend: un empleado solo recibe las citas que
 * tiene asignadas, así que aquí no hay lógica de permisos que se pueda
 * saltar desde el navegador. La única diferencia visual es que el
 * administrador ve —y puede filtrar por— el empleado responsable.
 */
export const CitasDashboard = ({ esAdmin = false, onCambio }) => {
    const [datos, setDatos] = useState(null)
    const [servicios, setServicios] = useState([])
    const [empleados, setEmpleados] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')
    const [guardandoId, setGuardandoId] = useState(null)

    const [filtros, setFiltros] = useState({
        fecha_inicio: '', fecha_fin: '', id_servicio: '',
        estado: '', estado_pago: '', id_empleado: '', agrupacion: 'day',
    })

    const actualizarFiltro = (campo) => (e) =>
        setFiltros((prev) => ({ ...prev, [campo]: e.target.value }))

    const limpiarFiltros = () => setFiltros({
        fecha_inicio: '', fecha_fin: '', id_servicio: '',
        estado: '', estado_pago: '', id_empleado: '', agrupacion: filtros.agrupacion,
    })

    const cargar = useCallback(async (filtrosActuales) => {
        setError('')
        try {
            setDatos(await obtenerDashboardCitas(filtrosActuales))
        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }, [])

    // Catálogos de los selectores (una sola vez).
    useEffect(() => {
        obtenerServiciosActivos()
            .then((d) => setServicios(d.servicios))
            .catch(() => setServicios([]))

        if (esAdmin) {
            obtenerEmpleadosActivos()
                .then((d) => setEmpleados(d.empleados))
                .catch(() => setEmpleados([]))
        }
    }, [esAdmin])

    // Recarga con rebote para no disparar una petición por cada tecla.
    useEffect(() => {
        const timer = setTimeout(() => {
            setCargando(true)
            cargar(filtros)
        }, 350)
        return () => clearTimeout(timer)
    }, [filtros, cargar])

    const cambiarEstado = async (idCita, estado) => {
        setGuardandoId(idCita)
        try {
            await actualizarEstadoCita(idCita, estado)
            await cargar(filtros)
            onCambio?.()
        } catch (err) {
            setError(err.message)
        } finally {
            setGuardandoId(null)
        }
    }

    const alternarPago = async (cita) => {
        setGuardandoId(cita.id_cita)
        try {
            await actualizarPagoCita(cita.id_cita, 'pagada')
            await cargar(filtros)
            onCambio?.()
        } catch (err) {
            setError(err.message)
        } finally {
            setGuardandoId(null)
        }
    }

    const resumen = datos?.resumen
    const citas = datos?.citas || []

    const datosLinea = (datos?.serie_tiempo.labels || []).map((label, i) => ({
        periodo: label,
        citas: datos.serie_tiempo.cantidades[i],
        ingresos: datos.serie_tiempo.ingresos[i],
    }))

    const datosBarras = (datos?.top_servicios.labels || []).map((label, i) => ({
        servicio: label,
        cantidad: datos.top_servicios.cantidades[i],
    }))

    return (
        <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
                <div>
                    <p className="eyebrow mb-3">Agenda</p>
                    <h2 className="editorial-title text-texto text-2xl sm:text-3xl">Gestión de citas</h2>
                    <p className="text-texto-secundario text-sm mt-2 max-w-2xl">
                        Los servicios se cobran en el estudio durante la cita, no como venta en línea.
                        Por eso su seguimiento —estado y cobro— vive aquí.
                    </p>
                </div>
            </div>

            {/* ---------------- Filtros ---------------- */}
            <div className="panel p-4 sm:p-5 mb-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="flex items-center gap-2 text-texto-secundario text-xs uppercase tracking-[0.14em]">
                        <Icon nombre="filtro" size={16} /> Filtrar citas
                    </span>
                    <button
                        type="button"
                        onClick={limpiarFiltros}
                        className="text-texto-secundario text-xs hover:text-acento-suave transition-colors cursor-pointer"
                    >
                        Limpiar filtros
                    </button>
                </div>

                <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${esAdmin ? 'xl:grid-cols-4' : ''}`}>
                    <div>
                        <label htmlFor="citas-desde" className="field-label">Desde</label>
                        <input id="citas-desde" type="date" value={filtros.fecha_inicio} onChange={actualizarFiltro('fecha_inicio')} className="field" />
                    </div>
                    <div>
                        <label htmlFor="citas-hasta" className="field-label">Hasta</label>
                        <input id="citas-hasta" type="date" value={filtros.fecha_fin} onChange={actualizarFiltro('fecha_fin')} className="field" />
                    </div>
                    <div>
                        <label htmlFor="citas-servicio" className="field-label">Servicio</label>
                        <select id="citas-servicio" value={filtros.id_servicio} onChange={actualizarFiltro('id_servicio')} className="field field-select">
                            <option value="">Todos los servicios</option>
                            {servicios.map((s) => (
                                <option key={s.id_servicio} value={s.id_servicio}>{s.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="citas-estado" className="field-label">Estado de la cita</label>
                        <select id="citas-estado" value={filtros.estado} onChange={actualizarFiltro('estado')} className="field field-select">
                            <option value="">Todos los estados</option>
                            {ESTADOS_CITA.map((estado) => (
                                <option key={estado} value={estado}>{estado}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="citas-pago" className="field-label">Estado de pago</label>
                        <select id="citas-pago" value={filtros.estado_pago} onChange={actualizarFiltro('estado_pago')} className="field field-select">
                            <option value="">Pagadas y por cobrar</option>
                            <option value="pagada">Solo pagadas</option>
                            <option value="pendiente">Solo por cobrar</option>
                        </select>
                    </div>
                    {esAdmin && (
                        <div>
                            <label htmlFor="citas-empleado" className="field-label">Empleado</label>
                            <select id="citas-empleado" value={filtros.id_empleado} onChange={actualizarFiltro('id_empleado')} className="field field-select">
                                <option value="">Todos los empleados</option>
                                {empleados.map((e) => (
                                    <option key={e.id_usuario} value={e.id_usuario}>{e.nombre_completo}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <label htmlFor="citas-agrupacion" className="field-label">Agrupar por</label>
                        <select id="citas-agrupacion" value={filtros.agrupacion} onChange={actualizarFiltro('agrupacion')} className="field field-select">
                            <option value="day">Por día</option>
                            <option value="week">Por semana</option>
                            <option value="month">Por mes</option>
                        </select>
                    </div>
                </div>
            </div>

            {error && (
                <p role="alert" className="panel border-acento/50 bg-acento/10 text-acento-suave text-sm p-4 mb-6">
                    {error}
                </p>
            )}

            {/* ---------------- Indicadores ---------------- */}
            {resumen && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Kpi
                        titulo="Citas en el rango"
                        valor={resumen.total_citas}
                        detalle={`${plural(resumen.por_estado.realizada, 'realizada', 'realizadas')} · ${plural(resumen.por_estado.cancelada, 'cancelada', 'canceladas')}`}
                    />
                    <Kpi
                        titulo="Agenda activa"
                        valor={resumen.por_estado.pendiente + resumen.por_estado.confirmada}
                        detalle={`${plural(resumen.por_estado.pendiente, 'cita sin confirmar', 'citas sin confirmar')}`}
                    />
                    <Kpi
                        titulo="Cobrado en citas"
                        valor={pesos(resumen.ingresos_cobrados)}
                        detalle={plural(resumen.citas_pagadas, 'cita pagada', 'citas pagadas')}
                    />
                    <Kpi
                        titulo="Pendiente por cobrar"
                        valor={pesos(resumen.ingresos_por_cobrar)}
                        detalle={plural(resumen.citas_por_cobrar, 'cita sin pagar', 'citas sin pagar')}
                    />
                </div>
            )}

            {/* ---------------- Gráficos ---------------- */}
            {cargando ? (
                <p className="text-texto-secundario text-sm">Cargando información de citas...</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="panel p-5">
                        <h3 className="text-texto text-sm mb-1">Citas e ingresos cobrados</h3>
                        <p className="text-texto-secundario text-xs mb-4">Agrupado por la fecha de la cita.</p>
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={datosLinea}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#3F3F3F" />
                                <XAxis dataKey="periodo" tick={ejeRecharts} />
                                <YAxis yAxisId="izq" tick={ejeRecharts} allowDecimals={false} />
                                <YAxis yAxisId="der" orientation="right" tick={ejeRecharts} />
                                <Tooltip
                                    contentStyle={tooltipRecharts}
                                    formatter={(valor, nombre) => (nombre === 'Ingresos' ? pesos(valor) : valor)}
                                />
                                <Line yAxisId="izq" type="monotone" dataKey="citas" name="Citas" stroke="#E45A5A" strokeWidth={2} dot={false} />
                                <Line yAxisId="der" type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10B981" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="panel p-5">
                        <h3 className="text-texto text-sm mb-1">Servicios más reservados</h3>
                        <p className="text-texto-secundario text-xs mb-4">Top 5 dentro del filtro aplicado.</p>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={datosBarras}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#3F3F3F" />
                                <XAxis dataKey="servicio" tick={{ fill: '#A8A29E', fontSize: 10 }} />
                                <YAxis tick={ejeRecharts} allowDecimals={false} />
                                <Tooltip contentStyle={tooltipRecharts} cursor={{ fill: 'rgba(185,28,28,0.08)' }} />
                                <Bar dataKey="cantidad" name="Citas" fill="#B91C1C" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ---------------- Tabla de gestión ---------------- */}
            <div className="flex items-baseline justify-between gap-3 mb-3">
                <h3 className="text-texto font-serif text-lg">Detalle de citas</h3>
                <span className="text-texto-secundario text-xs">{plural(citas.length, 'resultado', 'resultados')}</span>
            </div>

            {!cargando && citas.length === 0 && (
                <p className="panel p-8 text-center text-texto-secundario text-sm">
                    No hay citas que coincidan con los filtros seleccionados.
                </p>
            )}

            {citas.length > 0 && (
                <>
                    {/* Escritorio */}
                    <div className="admin-table-shell hidden lg:block overflow-x-auto">
                        <table className="admin-table w-full text-sm text-left">
                            <thead>
                                <tr>
                                    <th>Cita</th>
                                    <th>Cliente</th>
                                    <th>Servicio</th>
                                    {esAdmin && <th>Empleado</th>}
                                    <th>Fecha y hora</th>
                                    <th>Valor</th>
                                    <th>Estado</th>
                                    <th>Cobro</th>
                                </tr>
                            </thead>
                            <tbody>
                                {citas.map((cita) => (
                                    <tr key={cita.id_cita} className={guardandoId === cita.id_cita ? 'opacity-50' : ''}>
                                        <td className="text-texto-secundario">#{cita.id_cita}</td>
                                        <td className="text-texto">{cita.cliente_nombre}</td>
                                        <td className="text-texto-secundario">{cita.servicio_nombre}</td>
                                        {esAdmin && (
                                            <td className="text-texto-secundario">{cita.empleado_nombre || 'Sin asignar'}</td>
                                        )}
                                        <td className="text-texto-secundario whitespace-nowrap">{cita.fecha} · {cita.hora}</td>
                                        <td className="text-texto whitespace-nowrap">{pesos(cita.servicio_precio)}</td>
                                        <td>
                                            {estadosDisponibles(cita.estado, esAdmin).length < 2 ? (
                                                <Badge estado={cita.estado} texto={cita.estado === 'pendiente' ? 'Espera al cliente' : undefined} />
                                            ) : (
                                                <select
                                                    value={cita.estado}
                                                    disabled={guardandoId === cita.id_cita}
                                                    onChange={(e) => cambiarEstado(cita.id_cita, e.target.value)}
                                                    aria-label={`Estado de la cita ${cita.id_cita}`}
                                                    className="admin-select px-2 py-1 text-texto text-xs"
                                                >
                                                    {estadosDisponibles(cita.estado, esAdmin).map((estado) => (
                                                        <option key={estado} value={estado}>{estado}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                        <td>
                                            {puedeGestionarPago(cita) ? <button
                                                type="button"
                                                onClick={() => alternarPago(cita)}
                                                disabled={guardandoId === cita.id_cita}
                                                aria-label={`Marcar la cita ${cita.id_cita} como pagada`}
                                                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <BadgePago estadoPago={cita.estado_pago} />
                                            </button> : cita.estado !== 'cancelada' && <BadgePago estadoPago={cita.estado_pago} />}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Móvil y tablet */}
                    <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {citas.map((cita) => (
                            <article key={cita.id_cita} className={`panel p-4 space-y-4 ${guardandoId === cita.id_cita ? 'opacity-50' : ''}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-acento-suave text-[10px] font-bold tracking-[0.18em] uppercase">Cita #{cita.id_cita}</p>
                                        <h4 className="text-texto font-serif text-lg mt-1">{cita.servicio_nombre}</h4>
                                    </div>
                                    <Badge estado={cita.estado} />
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm border-t border-borde/70 pt-3">
                                    <div>
                                        <p className="text-texto-secundario text-[10px] uppercase tracking-wider">Cliente</p>
                                        <p className="text-texto mt-1">{cita.cliente_nombre}</p>
                                    </div>
                                    <div>
                                        <p className="text-texto-secundario text-[10px] uppercase tracking-wider">Fecha y hora</p>
                                        <p className="text-texto mt-1">{cita.fecha} · {cita.hora}</p>
                                    </div>
                                    {esAdmin && (
                                        <div>
                                            <p className="text-texto-secundario text-[10px] uppercase tracking-wider">Empleado</p>
                                            <p className="text-texto mt-1">{cita.empleado_nombre || 'Sin asignar'}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-texto-secundario text-[10px] uppercase tracking-wider">Valor</p>
                                        <p className="text-texto mt-1">{pesos(cita.servicio_precio)}</p>
                                    </div>
                                </div>

                                {estadosDisponibles(cita.estado, esAdmin).length < 2 ? (
                                    <p className="text-texto-secundario text-xs border-l-2 border-acento pl-3">
                                        {cita.estado === 'pendiente' ? 'Esperando que el cliente confirme desde el correo.' : 'Esta cita ya está cerrada.'}
                                    </p>
                                ) : (
                                    <label className="block">
                                        <span className="field-label">Estado de la cita</span>
                                        <select
                                            value={cita.estado}
                                            disabled={guardandoId === cita.id_cita}
                                            onChange={(e) => cambiarEstado(cita.id_cita, e.target.value)}
                                            className="field field-select"
                                        >
                                            {estadosDisponibles(cita.estado, esAdmin).map((estado) => (
                                                <option key={estado} value={estado}>{estado}</option>
                                            ))}
                                        </select>
                                    </label>
                                )}

                                {puedeGestionarPago(cita) ? <button
                                    type="button"
                                    onClick={() => alternarPago(cita)}
                                    disabled={guardandoId === cita.id_cita}
                                    className="w-full flex items-center justify-center gap-2 border border-borde rounded-lg py-2.5 text-xs text-texto-secundario hover:border-acento hover:text-acento transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Icon nombre="check" size={14} />
                                    Marcar como pagada
                                </button> : cita.estado !== 'cancelada' && <BadgePago estadoPago={cita.estado_pago} />}
                            </article>
                        ))}
                    </div>
                </>
            )}
        </section>
    )
}
