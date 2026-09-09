import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerProductosActivos } from '../services/productoService.js'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export const Productos = () => {
    const [productos, setProductos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [agregado, setAgregado] = useState(null)
    const { agregarProducto } = useCart()
    const { usuario } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        obtenerProductosActivos()
            .then((data) => setProductos(data.productos))
            .finally(() => setCargando(false))
    }, [])

    const manejarAgregar = (producto) => {
        if (!usuario) {
            navigate('/login')
            return
        }
        agregarProducto(producto, 1)
        setAgregado(producto.id_producto)
        setTimeout(() => setAgregado(null), 1200)
    }

    return (
        <div className="bg-fondo min-h-screen pt-28 pb-20 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-texto font-serif text-4xl mb-3">Productos</h1>
                    <p className="text-texto-secundario">Cuidado profesional para tu tatuaje y mercancía del estudio</p>
                </div>

                {!usuario && (
                    <div className="bg-superficie border border-borde rounded-lg p-4 mb-8 text-center">
                        <p className="text-texto-secundario text-sm">
                            Inicia sesión para agregar productos a tu carrito y realizar una compra.
                        </p>
                    </div>
                )}

                {cargando && <p className="text-texto-secundario text-center">Cargando productos...</p>}

                {!cargando && productos.length === 0 && (
                    <p className="text-texto-secundario text-center">No hay productos disponibles por el momento.</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {productos.map((p) => (
                        <div key={p.id_producto} className="bg-superficie rounded-lg overflow-hidden flex flex-col">
                            <div className="h-48 bg-fondo">
                                {p.imagen_url ? (
                                    <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-texto-secundario text-sm">Sin imagen</div>
                                )}
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                                <h3 className="text-texto font-serif text-lg mb-2">{p.nombre}</h3>
                                <p className="text-texto-secundario text-sm mb-4 flex-1">{p.descripcion}</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-acento font-medium text-lg">${Number(p.precio).toLocaleString('es-CO')}</p>
                                    <button
                                        onClick={() => manejarAgregar(p)}
                                        className="bg-acento text-texto text-sm px-4 py-2 rounded-md hover:bg-red-800 transition-colors cursor-pointer"
                                    >
                                        {!usuario
                                            ? 'Inicia sesión para comprar'
                                            : agregado === p.id_producto
                                                ? 'Agregado ✓'
                                                : 'Agregar al carrito'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}