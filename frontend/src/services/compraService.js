import { apiFetch } from './api.js'

// Cliente: confirma la compra del carrito actual
export const registrarCompra = (items, total) =>
    apiFetch('/compras', { method: 'POST', body: JSON.stringify({ items, total }) })

// Cliente: historial propio
export const obtenerMisCompras = () => apiFetch('/compras/mis-compras')

// Administrador: todas las compras del sistema
export const obtenerTodasLasCompras = () => apiFetch('/compras')

export const cambiarEstadoCompra = (id_compra, estado) =>
    apiFetch(`/compras/${id_compra}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) })

export const eliminarCompra = (id_compra) => apiFetch(`/compras/${id_compra}`, { method: 'DELETE' })