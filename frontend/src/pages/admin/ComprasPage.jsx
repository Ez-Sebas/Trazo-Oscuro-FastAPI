import { useState, useEffect } from 'react'
import { obtenerTodasLasCompras, cambiarEstadoCompra, eliminarCompra } from '../../services/compraService.js'

const estadosCompra = ['pendiente', 'pagada', 'entregada', 'cancelada']

export const ComprasPage = () => {
    const [compras, setCompras] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')

    const cargar = async () => {
        setCargando(true)
        setError('')
        try {
            const data = await obtenerTodasLasCompras()
            setCompras(data.compras)
        } catch (err) {
            setError(err.message)
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => { cargar() }, [])

    const cambiarEstado = async (id, estado) => {
        try {
            await cambiarEstadoCompra(id, estado)
            cargar()
        } catch (err) {
            alert(err.message)
        }
    }

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar esta compra?')) return
        try {
            await eliminarCompra(id)
            cargar()
        } catch (err) {
            alert(err.message)
        }
    }

    return (
        <div>
            <h1 className="text-texto font-serif text-2xl mb-2">Todas las Compras</h1>
            <p className="text-texto-secundario text-sm mb-6">Historial de compras realizadas por los clientes.</p>

            {cargando && <p className="text-texto-secundario">Cargando compras...</p>}

            {error && (
                <div className="bg-superficie border border-borde rounded-lg p-6 text-center">
                    <p className="text-texto-secundario text-sm">
                        Aún no hay conexión con el módulo de compras en el backend. Esta pantalla ya está lista para
                        funcionar apenas se implemente el endpoint <code className="text-acento">/compras</code>.
                    </p>
                </div>
            )}

            {!cargando && !error && compras.length === 0 && (
                <p className="text-texto-secundario">No hay compras registradas.</p>
            )}

            {!cargando && !error && compras.length > 0 && (
                <div className="overflow-x-auto bg-superficie rounded-lg p-4">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="text-texto-secundario border-b border-borde">
                                <th className="p-2">Cliente</th>
                                <th className="p-2">Total</th>
                                <th className="p-2">Fecha</th>
                                <th className="p-2">Estado</th>
                                <th className="p-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {compras.map((c) => (
                                <tr key={c.id_compra} className="border-b border-borde/50">
                                    <td className="p-2 text-texto">{c.cliente_nombre}</td>
                                    <td className="p-2 text-texto-secundario">${Number(c.total).toLocaleString('es-CO')}</td>
                                    <td className="p-2 text-texto-secundario">{c.fecha}</td>
                                    <td className="p-2">
                                        <select
                                            value={c.estado}
                                            onChange={(e) => cambiarEstado(c.id_compra, e.target.value)}
                                            className="bg-fondo border border-borde rounded px-2 py-1 text-texto text-xs"
                                        >
                                            {estadosCompra.map((estado) => (
                                                <option key={estado} value={estado}>{estado}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <button onClick={() => eliminar(c.id_compra)} className="text-red-500 hover:underline cursor-pointer">Eliminar</button>
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