import { useEffect, useState } from 'react'
import { obtenerMisVentas } from '../services/ventaService.js'
import { Icon } from '../components/ui/Icon.jsx'
import { Badge } from '../components/ui/Badge.jsx'

export const ClienteComprasPage = () => {
    const [ventas, setVentas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const cargar = async () => {
            try {
                const data = await obtenerMisVentas()
                setVentas(data.ventas)
            } catch (err) {
                setError(err.message || 'No fue posible cargar tus compras.')
            } finally {
                setCargando(false)
            }
        }

        const timer = setTimeout(cargar, 0)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="max-w-3xl">
                <div className="mb-8 reveal-up">
                    <p className="eyebrow mb-3">Área personal</p>
                    <h1 className="editorial-title text-texto text-4xl sm:text-5xl mb-3">Mis compras</h1>
                    <p className="text-texto-secundario text-sm">Consulta el historial de tus pedidos y sus estados.</p>
                </div>
                {cargando && <p className="text-texto-secundario text-sm">Cargando compras...</p>}
                {error && <p className="border border-borde bg-superficie p-5 text-texto-secundario text-sm">{error}</p>}
                {!cargando && !error && ventas.length === 0 && (
                    <div className="border border-borde bg-superficie p-8 text-center">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-borde text-texto-secundario flex items-center justify-center"><Icon nombre="carrito" size={24} /></div>
                        <h2 className="text-texto font-serif text-xl mb-2">Aún no tienes compras</h2>
                        <p className="text-texto-secundario text-sm">Tus pedidos aparecerán aquí después de completar una compra.</p>
                    </div>
                )}
                {!cargando && !error && ventas.length > 0 && (
                    <div className="flex flex-col gap-4">
                        {ventas.map((venta) => (
                            <article key={venta.id_venta} className="border border-borde bg-superficie p-5 sm:p-6">
                                <div className="flex items-start justify-between gap-4 border-b border-borde/70 pb-4 mb-4">
                                    <div>
                                        <p className="text-acento-suave text-[10px] font-bold tracking-[0.18em] uppercase mb-2">Pedido #{venta.id_venta}</p>
                                        <p className="text-texto text-sm">{new Date(venta.fecha_creacion).toLocaleDateString('es-CO')}</p>
                                    </div>
                                    <Badge estado={venta.estado} />
                                </div>
                                <div className="flex items-end justify-between gap-4">
                                    <div>
                                        <p className="text-texto-secundario text-[10px] uppercase tracking-wider mb-1">Artículos</p>
                                        <p className="text-texto-secundario text-sm">{venta.detalles?.length || 0} producto(s)</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-texto-secundario text-[10px] uppercase tracking-wider mb-1">Total</p>
                                        <p className="text-texto font-serif text-xl">${Number(venta.total).toLocaleString('es-CO')}</p>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
        </div>
    )
}
