import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { crearCheckout } from '../services/ventaService.js'
import { Icon } from './ui/Icon.jsx'

export const CartDrawer = ({ abierto, onCerrar }) => {
    const { items, actualizarCantidad, eliminarProducto, total } = useCart()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [procesando, setProcesando] = useState(false)
    const [error, setError] = useState('')

    const irALogin = () => {
        onCerrar()
        navigate('/login')
    }

    const irAPagar = async () => {
        if (!usuario) {
            irALogin()
            return
        }

        setError('')
        setProcesando(true)
        try {
            const itemsVenta = items.map((item) => ({
                tipo_item: 'producto',
                id_producto: item.id_producto,
                cantidad: item.cantidad,
            }))

            const data = await crearCheckout(itemsVenta)
            // El carrito NO se vacía aquí — se vacía solo cuando el pago
            // se confirma de verdad, en la página de éxito.
            window.location.href = data.checkout_url
        } catch (err) {
            setError(err.message || 'No fue posible iniciar el pago en este momento.')
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
                role="dialog"
                aria-modal="true"
                aria-labelledby="cart-title"
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-superficie z-100 flex flex-col shadow-2xl transition-transform duration-300 ${abierto ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex items-center justify-between px-6 py-5 border-b border-borde bg-fondo/30">
                    <div>
                        <p className="eyebrow mb-2">Selección de estudio</p>
                        <h2 id="cart-title" className="text-texto font-serif text-2xl">Tu carrito</h2>
                    </div>
                    <button onClick={onCerrar} aria-label="Cerrar carrito" className="w-10 h-10 rounded-full border border-borde text-texto-secundario hover:border-acento hover:text-acento flex items-center justify-center transition-colors cursor-pointer">
                        <Icon nombre="cerrarMenu" size={19} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {!usuario ? (
                        <div className="mt-10 border border-borde bg-fondo/50 p-6 text-center">
                            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-acento/15 text-acento-suave flex items-center justify-center"><Icon nombre="carrito" size={24} /></div>
                            <h3 className="text-texto font-serif text-xl mb-2">Tu selección te espera</h3>
                            <p className="text-texto-secundario text-sm leading-6 mb-5">
                                Inicia sesión para ver y gestionar tu carrito.
                            </p>
                            <button
                                onClick={irALogin}
                                className="bg-acento text-texto text-sm px-5 py-3 rounded-md hover:bg-red-800 transition-colors cursor-pointer"
                            >
                                Iniciar sesión
                            </button>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="mt-10 text-center">
                            <div className="w-14 h-14 mx-auto mb-5 rounded-full border border-borde text-texto-secundario flex items-center justify-center"><Icon nombre="carrito" size={24} /></div>
                            <h3 className="text-texto font-serif text-xl mb-2">Tu carrito está vacío</h3>
                            <p className="text-texto-secundario text-sm">Descubre piezas para llevar el estudio contigo.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {items.map((item) => (
                                <div key={item.id_producto} className="flex gap-4 items-start border border-borde/70 bg-fondo/35 p-3">
                                    <div className="w-20 h-20 bg-fondo rounded-md overflow-hidden shrink-0">
                                        {item.imagen_url ? (
                                            <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-texto-secundario text-xs">Sin img</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-texto text-sm font-medium leading-5">{item.nombre}</p>
                                        <p className="text-acento-suave text-sm mt-1 mb-3">${Number(item.precio).toLocaleString('es-CO')}</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => actualizarCantidad(item.id_producto, item.cantidad - 1)}
                                                aria-label={`Reducir cantidad de ${item.nombre}`}
                                                className="w-7 h-7 rounded border border-borde bg-fondo text-texto text-sm inline-flex items-center justify-center hover:border-acento cursor-pointer"
                                            ><Icon nombre="menos" size={13} /></button>
                                            <span className="text-texto text-sm w-6 text-center">{item.cantidad}</span>
                                            <button
                                                onClick={() => actualizarCantidad(item.id_producto, item.cantidad + 1)}
                                                aria-label={`Aumentar cantidad de ${item.nombre}`}
                                                className="w-7 h-7 rounded border border-borde bg-fondo text-texto text-sm inline-flex items-center justify-center hover:border-acento cursor-pointer"
                                            ><Icon nombre="mas" size={13} /></button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => eliminarProducto(item.id_producto)}
                                        aria-label={`Quitar ${item.nombre}`}
                                        className="text-texto-secundario hover:text-acento p-1 cursor-pointer"
                                    >
                                        <Icon nombre="eliminar" size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {usuario && items.length > 0 && (
                    <div className="px-6 py-5 border-t border-borde bg-fondo/30">
                        <div className="flex justify-between mb-1">
                            <span className="text-texto-secundario text-sm">Subtotal</span>
                            <span className="text-texto font-medium">${total.toLocaleString('es-CO')}</span>
                        </div>
                        <p className="text-texto-secundario text-xs mb-4">El IVA (19%) se calcula en el pago.</p>

                        {error && <p role="alert" className="text-red-400 text-xs leading-5 mb-3">{error}</p>}

                        <button
                            onClick={irAPagar}
                            disabled={procesando}
                            className="w-full bg-acento text-texto py-3 rounded-md hover:bg-red-800 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {procesando ? 'Redirigiendo a pago seguro...' : 'Pagar con tarjeta'}
                        </button>
                    </div>
                )}
            </aside>
        </>
    )
}