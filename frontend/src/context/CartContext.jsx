import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext()

const claveCarrito = (idUsuario) => `trazo_carrito_${idUsuario}`

export const CartProvider = ({ children }) => {
    const { usuario, cargando: cargandoAuth } = useAuth()
    const [items, setItems] = useState([])
    const [carritoCargadoPara, setCarritoCargadoPara] = useState(null)

    // Limpieza de una versión antigua del carrito (compartida entre usuarios)
    useEffect(() => {
        localStorage.removeItem('trazo_carrito')
    }, [])

    // Espera a que la sesión persistida se restaure antes de resolver el carrito.
    useEffect(() => {
        if (cargandoAuth) return

        const timer = setTimeout(() => {
            if (!usuario) {
                setItems([])
                setCarritoCargadoPara(null)
                return
            }

            const guardado = localStorage.getItem(claveCarrito(usuario.id))
            setItems(guardado ? JSON.parse(guardado) : [])
            setCarritoCargadoPara(usuario.id)
        }, 0)

        return () => clearTimeout(timer)
    }, [usuario, cargandoAuth])

    // Guarda el carrito, pero solo si hay una sesión activa
    useEffect(() => {
        if (!usuario || carritoCargadoPara !== usuario.id) return
        localStorage.setItem(claveCarrito(usuario.id), JSON.stringify(items))
    }, [items, usuario, carritoCargadoPara])

    const agregarProducto = (producto, cantidad = 1) => {
        if (!usuario) return

        setItems((prev) => {
            const existente = prev.find((item) => item.id_producto === producto.id_producto)
            if (existente) {
                return prev.map((item) =>
                    item.id_producto === producto.id_producto
                        ? { ...item, cantidad: item.cantidad + cantidad }
                        : item
                )
            }
            return [...prev, { ...producto, cantidad }]
        })
    }

    const actualizarCantidad = (id_producto, cantidad) => {
        if (cantidad < 1) return
        setItems((prev) =>
            prev.map((item) => (item.id_producto === id_producto ? { ...item, cantidad } : item))
        )
    }

    const eliminarProducto = (id_producto) => {
        setItems((prev) => prev.filter((item) => item.id_producto !== id_producto))
    }

    const vaciarCarrito = () => {
        setItems([])
        if (usuario) {
            localStorage.removeItem(claveCarrito(usuario.id))
        }
    }

    const total = items.reduce((suma, item) => suma + Number(item.precio) * item.cantidad, 0)
    const cantidadTotal = items.reduce((suma, item) => suma + item.cantidad, 0)

    return (
        <CartContext.Provider
            value={{ items, agregarProducto, actualizarCantidad, eliminarProducto, vaciarCarrito, total, cantidadTotal }}
        >
            {children}
        </CartContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext)