import { useState, useEffect, useCallback } from 'react'
import { obtenerMisCitasEmpleado, actualizarEstadoCita, actualizarPagoCita } from '../../services/citaService.js'
import { construirUrlArchivo } from '../../services/api.js'
import { Badge, BadgePago } from '../../components/ui/Badge.jsx'
import { Icon } from '../../components/ui/Icon.jsx'

const ESTADOS_EDITABLES = ['confirmada', 'realizada', 'cancelada']
const estadosDisponibles = (estadoActual) => ({
    confirmada: ['confirmada', 'realizada', 'cancelada'],
    realizada: ['realizada'],
    cancelada: ['cancelada'],
}[estadoActual] || [])
const puedeGestionarPago = (cita) =>
    ['confirmada', 'realizada'].includes(cita.estado) && cita.estado_pago !== 'pagada'

const pesos = (valor) => `$${Number(valor || 0).toLocaleString('es-CO')}`

/** Concuerda el sustantivo con el número: 1 cita · 3 citas. */
const plural = (cantidad, singular, plural_) => `${cantidad} ${cantidad === 1 ? singular : plural_}`

export const MisCitasPage = () => {
    const [citas, setCitas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')
    const [guardandoId, setGuardandoId] = useState(null)
    const [filtroEstado, setFiltroEstado] = useState('')
    const [filtroPago, setFiltroPago] = useState('')

    const cargar = useCallback(async () => {
        setError('')
        try {
            const data = await obtenerMisCitasEmpleado()
            setCitas(data.citas)
        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(cargar, 0)
        return () => clearTimeout(timer)
    }, [cargar])

    const cambiarEstado = async (idCita, estado) => {
        setGuardandoId(idCita)
        setError('')
        try {
            await actualizarEstadoCita(idCita, estado)
            await cargar()
        } catch (err) {
            setError(err.message)
        } finally {
            setGuardandoId(null)
        }
    }

    const alternarPago = async (cita) => {
        setGuardandoId(cita.id_cita)
        setError('')
        try {
            await actualizarPagoCita(cita.id_cita, cita.estado_pago === 'pagada' ? 'pendiente' : 'pagada')
            await cargar()
        } catch (err) {
            setError(err.message)
        } finally {
            setGuardandoId(null)
        }
    }

    const citasFiltradas = citas.filter((cita) =>
        (!filtroEstado || cita.estado === filtroEstado) &&
        (!filtroPago || cita.estado_pago === filtroPago)
    )

    const porCobrar = citas.filter((c) => c.estado_pago === 'pendiente' && c.estado !== 'cancelada').length

    return (
        <div className="max-w-6xl">
            <div className="mb-8">
                <p className="eyebrow mb-3">Agenda personal</p>
                <h1 className="editorial-title text-texto text-3xl sm:text-4xl mb-3">Mis citas</h1>
                <p className="text-texto-secundario text-sm max-w-2xl">
                    Solo ves las citas asignadas a ti. Una cita <strong className="text-texto">pendiente</strong> espera
                    a que el cliente la confirme desde su correo; a partir de ahí puedes avanzar su estado y registrar
                    el cobro del servicio, que se recibe en el estudio.
                </p>
            </div>

            <div className="panel p-4 sm:p-5 mb-6">
                <div className="flex items-center gap-2 mb-4 text-texto-secundario text-xs uppercase tracking-[0.14em]">
                    <Icon nombre="filtro" size={16} /> Filtrar mis citas
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <label htmlFor="mis-citas-estado" className="field-label">Estado de la cita</label>
                        <select id="mis-citas-estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="field field-select">
                            <option value="">Todos los estados</option>
                            <option value="pendiente">pendiente</option>
                            {ESTADOS_EDITABLES.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="mis-citas-pago" className="field-label">Estado de pago</label>
                        <select id="mis-citas-pago" value={filtroPago} onChange={(e) => setFiltroPago(e.target.value)} className="field field-select">
                            <option value="">Pagadas y por cobrar</option>
                            <option value="pagada">Solo pagadas</option>
                            <option value="pendiente">Solo por cobrar</option>
                        </select>
                    </div>
                    <div className="kpi-card flex flex-col justify-center">
                        <p className="text-texto-secundario text-[10px] font-bold tracking-[0.16em] uppercase">Por cobrar</p>
                        <p className="text-texto text-xl font-serif mt-1">{plural(porCobrar, 'cita', 'citas')}</p>
                    </div>
                </div>
            </div>

            {error && (
                <p role="alert" className="panel border-acento/50 bg-acento/10 text-acento-suave text-sm p-4 mb-6">{error}</p>
            )}

            {cargando && <p className="text-texto-secundario text-sm">Cargando citas...</p>}

            {!cargando && citas.length === 0 && (
                <div className="panel p-8 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-borde text-texto-secundario flex items-center justify-center">
                        <Icon nombre="citas" size={24} />
                    </div>
                    <h2 className="text-texto font-serif text-xl mb-2">No tienes citas asignadas</h2>
                    <p className="text-texto-secundario text-sm">Cuando el administrador te asigne una cita, aparecerá aquí.</p>
                </div>
            )}

            {!cargando && citas.length > 0 && citasFiltradas.length === 0 && (
                <p className="panel p-8 text-center text-texto-secundario text-sm">
                    No hay citas que coincidan con los filtros seleccionados.
                </p>
            )}

            {citasFiltradas.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {citasFiltradas.map((cita) => (
                        <article
                            key={cita.id_cita}
                            className={`panel p-5 space-y-4 transition-opacity ${guardandoId === cita.id_cita ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-acento-suave text-[10px] font-bold tracking-[0.18em] uppercase">Cita #{cita.id_cita}</p>
                                    <h2 className="text-texto font-serif text-xl mt-1">{cita.servicio_nombre}</h2>
                                    <p className="text-texto-secundario text-sm mt-1">{pesos(cita.servicio_precio)}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Badge estado={cita.estado} />
                                    {cita.estado !== 'cancelada' && <BadgePago estadoPago={cita.estado_pago} />}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-borde/70 pt-4">
                                <div>
                                    <p className="text-texto-secundario text-[10px] uppercase tracking-wider">Cliente</p>
                                    <p className="text-texto text-sm mt-1">{cita.cliente_nombre}</p>
                                </div>
                                <div>
                                    <p className="text-texto-secundario text-[10px] uppercase tracking-wider">Fecha y hora</p>
                                    <p className="text-texto text-sm mt-1">{cita.fecha} · {cita.hora}</p>
                                </div>
                            </div>

                            <div className="border-t border-borde/70 pt-4">
                                <p className="text-texto-secundario text-[10px] uppercase tracking-wider mb-1">Descripción del cliente</p>
                                <p className="text-texto-secundario text-sm leading-6">{cita.mensaje || 'Sin descripción'}</p>
                            </div>

                            {cita.imagen_diseno && (
                                <img
                                    src={construirUrlArchivo(cita.imagen_diseno)}
                                    alt={`Referencia de diseño enviada por ${cita.cliente_nombre}`}
                                    className="w-full max-h-64 rounded-lg border border-borde object-cover"
                                />
                            )}

                            {cita.estado === 'pendiente' ? (
                                <p className="text-texto-secundario text-xs border-l-2 border-acento pl-3">
                                    Esperando que el cliente confirme la cita desde su correo.
                                </p>
                            ) : cita.estado === 'confirmada' ? (
                                <div className="grid gap-3 sm:grid-cols-2 border-t border-borde/70 pt-4">
                                    <label className="block">
                                        <span className="field-label">Estado de la cita</span>
                                        <select
                                            value={cita.estado}
                                            disabled={guardandoId === cita.id_cita}
                                            onChange={(e) => cambiarEstado(cita.id_cita, e.target.value)}
                                            className="field field-select"
                                        >
                                            {estadosDisponibles(cita.estado).map((estado) => (
                                                <option key={estado} value={estado}>{estado}</option>
                                            ))}
                                        </select>
                                    </label>

                                    {puedeGestionarPago(cita) && <div>
                                        <span className="field-label">Cobro del servicio</span>
                                        <button
                                            type="button"
                                            onClick={() => alternarPago(cita)}
                                            disabled={guardandoId === cita.id_cita}
                                            className="w-full flex items-center justify-center gap-2 border border-borde rounded-lg py-2.5 text-xs text-texto-secundario hover:border-acento hover:text-acento transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Icon nombre="check" size={14} />
                                            Marcar como pagada
                                        </button>
                                    </div>}
                                </div>
                            ) : cita.estado === 'realizada' && puedeGestionarPago(cita) ? (
                                <div className="border-t border-borde/70 pt-4">
                                    <span className="field-label">Cobro del servicio</span>
                                    <button type="button" onClick={() => alternarPago(cita)} disabled={guardandoId === cita.id_cita} className="w-full flex items-center justify-center gap-2 border border-borde rounded-lg py-2.5 text-xs text-texto-secundario hover:border-acento hover:text-acento transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
                                        <Icon nombre="check" size={14} /> Marcar como pagada
                                    </button>
                                </div>
                            ) : null}
                        </article>
                    ))}
                </div>
            )}
        </div>
    )
}
