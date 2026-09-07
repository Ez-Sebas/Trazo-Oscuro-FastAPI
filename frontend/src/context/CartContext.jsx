import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState(() => {
        const guardado = localStorage.getItem('trazo_carrito')
        return guardado ? JSON.parse(guardado) : []
    })

    useEffect(() => {
        localStorage.setItem('trazo_carrito', JSON.stringify(items))
    }, [items])

    const agregarProducto = (producto, cantidad = 1) => {
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

    const vaciarCarrito = () => setItems([])

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