import { useState, useEffect } from 'react'
import { obtenerMisCitasEmpleado, actualizarEstadoCita } from '../../services/citaService.js'

const estadosCita = ['pendiente', 'confirmada', 'realizada', 'cancelada']

export const MisCitasPage = () => {
    const [citas, setCitas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')

    const cargar = async () => {
        setCargando(true)
        setError('')
        try {
            const data = await obtenerMisCitasEmpleado()
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

    return (
        <div>
            <h1 className="text-texto font-serif text-2xl mb-2">Mis Citas</h1>
            <p className="text-texto-secundario text-sm mb-6">
                Aquí solo ves las citas asignadas a ti. El backend decide esto según tu sesión (JWT), nunca según un dato enviado desde el navegador — así ningún empleado puede ver ni tocar citas de otro.
            </p>

            {cargando && <p className="text-texto-secundario">Cargando citas...</p>}

            {error && (
                <div className="bg-superficie border border-borde rounded-lg p-6 text-center">
                    <p className="text-texto-secundario text-sm">
                        Aún no hay conexión con el módulo de citas en el backend. Esta pantalla ya está lista para
                        funcionar apenas se implemente el endpoint <code className="text-acento">/citas/empleado/mis-citas</code>.
                    </p>
                </div>
            )}

            {!cargando && !error && citas.length === 0 && (
                <p className="text-texto-secundario">No tienes citas asignadas por ahora.</p>
            )}

            {!cargando && !error && citas.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {citas.map((c) => (
                        <div key={c.id_cita} className="bg-superficie rounded-lg p-4">
                            <h3 className="text-texto font-medium">{c.servicio_nombre}</h3>
                            <p className="text-texto-secundario text-sm">Cliente: {c.cliente_nombre}</p>
                            <p className="text-texto-secundario text-sm mb-2">{c.fecha}</p>
                            <p className="text-texto-secundario text-sm mb-2">{c.hora}</p>
                            <select
                                value={c.estado}
                                onChange={(e) => cambiarEstado(c.id_cita, e.target.value)}
                                className="bg-fondo border border-borde rounded px-2 py-1 text-texto text-xs"
                            >
                                {estadosCita.map((estado) => (
                                    <option key={estado} value={estado}>{estado}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}