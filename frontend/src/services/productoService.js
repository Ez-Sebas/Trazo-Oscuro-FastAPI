import { apiFetch } from './api.js'

export const obtenerProductosActivos = () => apiFetch('/productos/activos')
export const obtenerProductos = () => apiFetch('/productos')
export const crearProducto = (datos) => apiFetch('/productos', { method: 'POST', body: JSON.stringify(datos) })
export const editarProducto = (id, datos) => apiFetch(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(datos) })
export const cambiarEstadoProducto = (id, estado) => apiFetch(`/productos/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) })
export const eliminarProducto = (id) => apiFetch(`/productos/${id}`, { method: 'DELETE' })