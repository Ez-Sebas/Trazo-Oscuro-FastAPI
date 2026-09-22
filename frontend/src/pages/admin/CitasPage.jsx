import { useState, useEffect, useCallback } from 'react'
import {
    obtenerTodasLasCitas, actualizarEstadoCita, actualizarPagoCita, asignarEmpleado,
} from '../../services/citaService.js'
import { obtenerEmpleadosActivos } from '../../services/usuarioService.js'
import { construirUrlArchivo } from '../../services/api.js'
import { Badge, BadgePago } from '../../components/ui/Badge.jsx'
import { Icon } from '../../components/ui/Icon.jsx'

const ESTADOS_CITA = ['pendiente', 'confirmada', 'realizada', 'cancelada']

const pesos = (valor) => `$${Number(valor || 0).toLocaleString('es-CO')}`

export const CitasPage = () => {
    const [citas, setCitas] = useState([])
    const [empleados, setEmpleados] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')
    const [guardandoId, setGuardandoId] = useState(null)

    const [busqueda, setBusqueda] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')
    const [filtroPago, setFiltroPago] = useState('')
    const [filtroEmpleado, setFiltroEmpleado] = useState('')

    const cargar = useCallback(async () => {
        setError('')
        try {
            const [dataCitas, dataEmpleados] = await Promise.all([
                obtenerTodasLasCitas(),
                obtenerEmpleadosActivos(),
            ])
            // El backend ya envía id_empleado, así que no hace falta deducirlo
            // comparando nombres (dos empleados homónimos rompían la asignación).
            setCitas(dataCitas.citas)
            setEmpleados(dataEmpleados.empleados)
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

    const ejecutar = async (idCita, accion) => {
        setGuardandoId(idCita)
        setError('')
        try {
            await accion()
            await cargar()
        } catch (err) {
            setError(err.message)
            await cargar()
        } finally {
            setGuardandoId(null)
        }
    }

    const cambiarEstado = (idCita, estado) =>
        ejecutar(idCita, () => actualizarEstadoCita(idCita, estado))

    const alternarPago = (cita) =>
        ejecutar(cita.id_cita, () =>
            actualizarPagoCita(cita.id_cita, cita.estado_pago === 'pagada' ? 'pendiente' : 'pagada'))

    const cambiarEmpleado = (idCita, idEmpleado) => {
        if (!idEmpleado) return
        ejecutar(idCita, () => asignarEmpleado(idCita, Number(idEmpleado)))
    }

    const termino = busqueda.trim().toLowerCase()
    const citasFiltradas = citas.filter((cita) => {
        const coincideBusqueda = !termino ||
            [cita.cliente_nombre, cita.servicio_nombre, cita.id_cita, cita.fecha]
                .some((valor) => String(valor ?? '').toLowerCase().includes(termino))
        const coincideEstado = !filtroEstado || cita.estado === filtroEstado
        const coincidePago = !filtroPago || cita.estado_pago === filtroPago
        const coincideEmpleado = !filtroEmpleado || String(cita.id_empleado ?? '') === filtroEmpleado
        return coincideBusqueda && coincideEstado && coincidePago && coincideEmpleado
    })

    return (
        <div className="max-w-7xl">
            <div className="mb-8">
                <p className="eyebrow mb-3">Agenda del estudio</p>
                <h1 className="editorial-title text-texto text-3xl sm:text-4xl mb-3">Todas las citas</h1>
                <p className="text-texto-secundario text-sm max-w-2xl">
                    Asigna el empleado responsable, avanza el estado de cada cita y registra el cobro del
                    servicio. Solo se ofrecen empleados activos.
                </p>
            </div>

            <div className="panel p-4 sm:p-5 mb-6">
                <div className="flex items-center gap-2 mb-4 text-texto-secundario text-xs uppercase tracking-[0.14em]">
                    <Icon nombre="filtro" size={16} /> Filtrar citas
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                        <label htmlFor="citas-buscar" className="field-label">Buscar</label>
                        <input
                            id="citas-buscar"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Cliente, servicio, fecha o ID..."
                            className="field"
                        />
                    </div>
                    <div>
                        <label htmlFor="citas-f-estado" className="field-label">Estado</label>
                        <select id="citas-f-estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="field field-select">
                            <option value="">Todos los estados</option>
                            {ESTADOS_CITA.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="citas-f-pago" className="field-label">Pago</label>
                        <select id="citas-f-pago" value={filtroPago} onChange={(e) => setFiltroPago(e.target.value)} className="field field-select">
                            <option value="">Pagadas y por cobrar</option>
                            <option value="pagada">Solo pagadas</option>
                            <option value="pendiente">Solo por cobrar</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="citas-f-empleado" className="field-label">Empleado</label>
                        <select id="citas-f-empleado" value={filtroEmpleado} onChange={(e) => setFiltroEmpleado(e.target.value)} className="field field-select">
                            <option value="">Todos los empleados</option>
                            {empleados.map((empleado) => (
                                <option key={empleado.id_usuario} value={String(empleado.id_usuario)}>{empleado.nombre_completo}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {error && (
                <p role="alert" className="panel border-acento/50 bg-acento/10 text-acento-suave text-sm p-4 mb-6">{error}</p>
            )}

            {cargando && <p className="text-texto-secundario text-sm">Cargando citas...</p>}

            {!cargando && citas.length === 0 && (
                <p className="panel p-8 text-center text-texto-secundario text-sm">No hay citas registradas.</p>
            )}

            {!cargando && citas.length > 0 && citasFiltradas.length === 0 && (
                <p className="panel p-8 text-center text-texto-secundario text-sm">
                    No hay citas que coincidan con los filtros.
                </p>
            )}

            {citasFiltradas.length > 0 && (
                <>
                    <div className="admin-table-shell hidden xl:block overflow-x-auto">
                        <table className="admin-table w-full text-sm text-left">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Servicio</th>
                                    <th>Referencia</th>
                                    <th>Empleado asignado</th>
                                    <th>Fecha</th>
                                    <th>Valor</th>
                                    <th>Estado</th>
                                    <th>Cobro</th>
                                </tr>
                            </thead>
                            <tbody>
                                {citasFiltradas.map((cita) => (
                                    <tr key={cita.id_cita} className={guardandoId === cita.id_cita ? 'opacity-50' : ''}>
                                        <td className="text-texto">{cita.cliente_nombre}</td>
                                        <td className="text-texto-secundario">{cita.servicio_nombre}</td>
                                        <td>
                                            {cita.imagen_diseno ? (
                                                <img
                                                    src={construirUrlArchivo(cita.imagen_diseno)}
                                                    alt={`Referencia enviada por ${cita.cliente_nombre}`}
                                                    className="w-14 h-14 rounded-md border border-borde object-cover"
                                                />
                                            ) : (
                                                <span className="text-texto-secundario text-xs">Sin imagen</span>
                                            )}
                                        </td>
                                        <td>
                                            <select
                                                value={cita.id_empleado ?? ''}
                                                disabled={guardandoId === cita.id_cita}
                                                onChange={(e) => cambiarEmpleado(cita.id_cita, e.target.value)}
                                                aria-label={`Empleado asignado a la cita ${cita.id_cita}`}
                                                className="admin-select px-2 py-1 text-texto text-xs"
                                            >
                                                <option value="">Sin asignar</option>
                                                {empleados.map((emp) => (
                                                    <option key={emp.id_usuario} value={emp.id_usuario}>{emp.nombre_completo}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="text-texto-secundario whitespace-nowrap">{cita.fecha} · {cita.hora}</td>
                                        <td className="text-texto whitespace-nowrap">{pesos(cita.servicio_precio)}</td>
                                        <td>
                                            <select
                                                value={cita.estado}
                                                disabled={guardandoId === cita.id_cita}
                                                onChange={(e) => cambiarEstado(cita.id_cita, e.target.value)}
                                                aria-label={`Estado de la cita ${cita.id_cita}`}
                                                className="admin-select px-2 py-1 text-texto text-xs"
                                            >
                                                {ESTADOS_CITA.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                                            </select>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                onClick={() => alternarPago(cita)}
                                                disabled={guardandoId === cita.id_cita || cita.estado === 'cancelada'}
                                                aria-label={`Marcar la cita ${cita.id_cita} como ${cita.estado_pago === 'pagada' ? 'por cobrar' : 'pagada'}`}
                                                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <BadgePago estadoPago={cita.estado_pago} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="xl:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {citasFiltradas.map((cita) => (
                            <article
                                key={cita.id_cita}
                                className={`panel p-4 space-y-4 ${guardandoId === cita.id_cita ? 'opacity-50' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-acento-suave text-[10px] font-bold tracking-[0.18em] uppercase">Cita #{cita.id_cita}</p>
                                        <h2 className="text-texto font-serif text-xl mt-1">{cita.servicio_nombre}</h2>
                                        <p className="text-texto-secundario text-sm mt-1">{pesos(cita.servicio_precio)}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge estado={cita.estado} />
                                        <BadgePago estadoPago={cita.estado_pago} />
                                    </div>
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
                                </div>

                                <div className="border-t border-borde/70 pt-3">
                                    <p className="text-texto-secundario text-[10px] uppercase tracking-wider mb-1">Descripción</p>
                                    <p className="text-texto-secundario text-sm">{cita.mensaje || 'Sin descripción'}</p>
                                </div>

                                {cita.imagen_diseno && (
                                    <img
                                        src={construirUrlArchivo(cita.imagen_diseno)}
                                        alt={`Referencia enviada por ${cita.cliente_nombre}`}
                                        className="w-24 h-20 rounded-lg border border-borde object-cover"
                                    />
                                )}

                                <label className="block">
                                    <span className="field-label">Empleado asignado</span>
                                    <select
                                        value={cita.id_empleado ?? ''}
                                        disabled={guardandoId === cita.id_cita}
                                        onChange={(e) => cambiarEmpleado(cita.id_cita, e.target.value)}
                                        className="field field-select"
                                    >
                                        <option value="">Sin asignar</option>
                                        {empleados.map((empleado) => (
                                            <option key={empleado.id_usuario} value={empleado.id_usuario}>{empleado.nombre_completo}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="field-label">Estado</span>
                                    <select
                                        value={cita.estado}
                                        disabled={guardandoId === cita.id_cita}
                                        onChange={(e) => cambiarEstado(cita.id_cita, e.target.value)}
                                        className="field field-select"
                                    >
                                        {ESTADOS_CITA.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                                    </select>
                                </label>

                                <button
                                    type="button"
                                    onClick={() => alternarPago(cita)}
                                    disabled={guardandoId === cita.id_cita || cita.estado === 'cancelada'}
                                    className="w-full flex items-center justify-center gap-2 border border-borde rounded-lg py-2.5 text-xs text-texto-secundario hover:border-acento hover:text-acento transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Icon nombre="check" size={14} />
                                    {cita.estado_pago === 'pagada' ? 'Marcar como por cobrar' : 'Marcar como pagada'}
                                </button>
                            </article>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
