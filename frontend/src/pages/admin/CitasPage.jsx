import { useState, useEffect } from 'react'
import { obtenerTodasLasCitas, actualizarEstadoCita, eliminarCita } from '../../services/citaService.js'

const estadosCita = ['pendiente', 'confirmada', 'realizada', 'cancelada']

export const CitasPage = () => {
    const [citas, setCitas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')

    const cargar = async () => {
        setCargando(true)
        setError('')
        try {
            const data = await obtenerTodasLasCitas()
            setCitas(data.citas)
        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => { cargar() }, [])

    const cambiarEstado = async (id, estado) => {
        try {
            await actualizarEstadoCita(id, estado)
            cargar()
        } catch (err) {
            alert(err.message)
        }
    }

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar esta cita?')) return
        try {
            await eliminarCita(id)
            cargar()
        } catch (err) {
            alert(err.message)
        }
    }

    return (
        <div>
            <h1 className="text-texto font-serif text-2xl mb-2">Todas las Citas</h1>
            <p className="text-texto-secundario text-sm mb-6">Vista general de las reservas de todos los empleados.</p>

            {cargando && <p className="text-texto-secundario">Cargando citas...</p>}

            {error && (
                <div className="bg-superficie border border-borde rounded-lg p-6 text-center">
                    <p className="text-texto-secundario text-sm">
                        Aún no hay conexión con el módulo de citas en el backend. Esta pantalla ya está lista para
                        funcionar apenas se implemente el endpoint <code className="text-acento">/citas</code>.
                    </p>
                </div>
            )}

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
                                <th className="p-2">Empleado</th>
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
                                    <td className="p-2 text-texto-secundario">{c.empleado_nombre || 'Sin asignar'}</td>
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