import { useState, useEffect } from 'react'
import { obtenerTodasLasCitas, actualizarEstadoCita, asignarEmpleado, eliminarCita } from '../../services/citaService.js'
import { obtenerEmpleadosActivos } from '../../services/usuarioService.js'

const estadosCita = ['pendiente', 'confirmada', 'realizada', 'cancelada']

export const CitasPage = () => {
    const [citas, setCitas] = useState([])
    const [empleados, setEmpleados] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')

        const cargar = async () => {
        setCargando(true)
        setError('')
        try {
            const [dataCitas, dataEmpleados] = await Promise.all([
                obtenerTodasLasCitas(),
                obtenerEmpleadosActivos(),
            ])
            const emp = dataEmpleados.empleados
            const citasConId = dataCitas.citas.map(c => {
                const empleado = emp.find(e => e.nombre_completo === c.empleado_nombre)
                return {
                    ...c,
                    id_empleado: empleado ? String(empleado.id_usuario) : null,
                }
            })
            setCitas(citasConId)
            setEmpleados(emp)
        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => { cargar() }, [])

    const cambiarEstado = async (id, estado) => {
        try { await actualizarEstadoCita(id, estado); cargar() } catch (err) { alert(err.message) }
    }

    const cambiarEmpleado = async (id, id_empleado) => {
        if (!id_empleado) return
        setCitas(prev =>
            prev.map(c => c.id_cita === id ? { ...c, id_empleado: String(id_empleado) } : c)
        )
        try {
            await asignarEmpleado(id, id_empleado)
            cargar()
        } catch (err) {
            alert(err.message)
            cargar()
        }
    }

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar esta cita?')) return
        try { await eliminarCita(id); cargar() } catch (err) { alert(err.message) }
    }

    return (
        <div>
            <h1 className="text-texto font-serif text-2xl mb-2">Todas las Citas</h1>
            <p className="text-texto-secundario text-sm mb-6">
                Asigna o reasigna el empleado responsable de cada cita. Solo se muestran empleados activos.
            </p>

            {cargando && <p className="text-texto-secundario">Cargando citas...</p>}
            {error && <p className="text-texto-secundario">{error}</p>}

            {!cargando && !error && citas.length === 0 && (
                <p className="text-texto-secundario">No hay citas registradas.</p>
            )}

            {!cargando && !error && citas.length > 0 && (
                <div className="overflow-x-auto bg-superficie rounded-lg p-4">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="text-texto-secundario border-b border-borde">
                                <th className="p-2">Cliente</th>
                                <th className="p-2">Servicio</th>
                                <th className="p-2">Empleado asignado</th>
                                <th className="p-2">Fecha</th>
                                <th className="p-2">Estado</th>
                                <th className="p-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {citas.map((c) => (
                                <tr key={c.id_cita} className="border-b border-borde/50">
                                    <td className="p-2 text-texto">{c.cliente_nombre}</td>
                                    <td className="p-2 text-texto-secundario">{c.servicio_nombre}</td>
                                    <td className="p-2">
                                        <select
                                            value={c.id_empleado ?? ''}
                                            onChange={(e) => cambiarEmpleado(c.id_cita, e.target.value)}
                                            className="bg-fondo border border-borde rounded px-2 py-1 text-texto text-xs"
                                        >
                                            <option value="">Sin Asignar</option>
                                            {empleados.map((emp) => (
                                                <option key={emp.id_usuario} value={String(emp.id_usuario)}>
                                                    {emp.nombre_completo}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2 text-texto-secundario">{c.fecha}</td>
                                    <td className="p-2">
                                        <select
                                            value={c.estado}
                                            onChange={(e) => cambiarEstado(c.id_cita, e.target.value)}
                                            className="bg-fondo border border-borde rounded px-2 py-1 text-texto text-xs"
                                        >
                                            {estadosCita.map((estado) => (
                                                <option key={estado} value={estado}>{estado}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <button onClick={() => eliminar(c.id_cita)} className="text-red-500 hover:underline cursor-pointer">Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
