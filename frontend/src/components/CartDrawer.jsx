import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { registrarCompra } from '../services/compraService.js'

export const CartDrawer = ({ abierto, onCerrar }) => {
    const { items, actualizarCantidad, eliminarProducto, vaciarCarrito, total } = useCart()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [procesando, setProcesando] = useState(false)
    const [error, setError] = useState('')

    const irALogin = () => {
        onCerrar()
        navigate('/login')
    }

    const finalizarCompra = async () => {
        if (!usuario) {
            irALogin()
            return
        }

        setError('')
        setProcesando(true)
        try {
            await registrarCompra(items, total)
            vaciarCarrito()
            onCerrar()
            alert('¡Compra registrada correctamente!')
        } catch (err) {
            setError(err.message || 'No fue posible procesar la compra en este momento.')
        } finally {
            setProcesando(false)
        }
    }

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/60 z-90 transition-opacity ${abierto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onCerrar}
            />
            <aside
                className={`fixed top-0 right-0 h-full w-full max-w-sm bg-superficie z-100 flex flex-col transition-transform duration-300 ${abierto ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex items-center justify-between px-6 py-5 border-b border-borde">
                    <h2 className="text-texto font-serif text-xl">Tu carrito</h2>
                    <button onClick={onCerrar} className="text-texto-secundario hover:text-acento text-xl cursor-pointer">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {!usuario ? (
                        <div className="text-center mt-10">
                            <p className="text-texto-secundario text-sm mb-4">
                                Inicia sesión para ver y gestionar tu carrito.
                            </p>
                            <button
                                onClick={irALogin}
                                className="bg-acento text-texto text-sm px-4 py-2 rounded-md hover:bg-red-800 transition-colors cursor-pointer"
                            >
                                Iniciar sesión
                            </button>
                        </div>
                    ) : items.length === 0 ? (
                        <p className="text-texto-secundario text-sm text-center mt-10">Tu carrito está vacío.</p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {items.map((item) => (
                                <div key={item.id_producto} className="flex gap-3 items-start border-b border-borde/50 pb-4">
                                    <div className="w-16 h-16 bg-fondo rounded-md overflow-hidden shrink-0">
                                        {item.imagen_url ? (
                                            <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-texto-secundario text-xs">Sin img</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-texto text-sm font-medium">{item.nombre}</p>
                                        <p className="text-texto-secundario text-xs mb-2">${Number(item.precio).toLocaleString('es-CO')}</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => actualizarCantidad(item.id_producto, item.cantidad - 1)}
                                                className="w-6 h-6 rounded bg-fondo text-texto text-sm cursor-pointer"
                                            >−</button>
                                            <span className="text-texto text-sm w-6 text-center">{item.cantidad}</span>
                                            <button
                                                onClick={() => actualizarCantidad(item.id_producto, item.cantidad + 1)}
                                                className="w-6 h-6 rounded bg-fondo text-texto text-sm cursor-pointer"
                                            >+</button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => eliminarProducto(item.id_producto)}
                                        className="text-red-500 text-xs hover:underline cursor-pointer"
                                    >
                                        Quitar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {usuario && items.length > 0 && (
                    <div className="px-6 py-5 border-t border-borde">
                        <div className="flex justify-between mb-4">
                            <span className="text-texto-secundario text-sm">Total</span>
                            <span className="text-texto font-medium">${total.toLocaleString('es-CO')}</span>
                        </div>

                        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

                        <button
                            onClick={finalizarCompra}
                            disabled={procesando}
                            className="w-full bg-acento text-texto py-3 rounded-md hover:bg-red-800 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {procesando ? 'Procesando...' : 'Finalizar compra'}
                        </button>
                    </div>
                )}
            </aside>
        </>
    )
}