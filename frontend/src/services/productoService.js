import { apiFetch } from './api.js'

const construirQuery = (params) => {
    const limpio = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    )
    const query = new URLSearchParams(limpio).toString()
    return query ? `?${query}` : ''
}

export const obtenerProductosActivos = (filtros = {}) =>
    apiFetch(`/productos/activos${construirQuery(filtros)}`)

export const obtenerProductos = (filtros = {}) =>
    apiFetch(`/productos${construirQuery(filtros)}`)

export const obtenerCategoriasProducto = () => apiFetch('/productos/categorias')
export const crearProducto = (datos) => apiFetch('/productos', { method: 'POST', body: JSON.stringify(datos) })
export const editarProducto = (id, datos) => apiFetch(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(datos) })
export const cambiarEstadoProducto = (id, estado) => apiFetch(`/productos/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) })
export const eliminarProducto = (id) => apiFetch(`/productos/${id}`, { method: 'DELETE' })