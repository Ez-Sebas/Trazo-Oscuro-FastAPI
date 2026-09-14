import { apiFetch } from './api.js'

const construirQuery = (params) => {
    const limpio = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    )
    const query = new URLSearchParams(limpio).toString()
    return query ? `?${query}` : ''
}

export const obtenerServiciosActivos = (filtros = {}) =>
    apiFetch(`/servicios/activos${construirQuery(filtros)}`)

export const obtenerServicios = (filtros = {}) =>
    apiFetch(`/servicios${construirQuery(filtros)}`)

export const obtenerCategoriasServicio = () => apiFetch('/servicios/categorias')
export const crearServicio = (datos) => apiFetch('/servicios', { method: 'POST', body: JSON.stringify(datos) })
export const editarServicio = (id, datos) => apiFetch(`/servicios/${id}`, { method: 'PUT', body: JSON.stringify(datos) })
export const cambiarEstadoServicio = (id, estado) => apiFetch(`/servicios/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) })
export const eliminarServicio = (id) => apiFetch(`/servicios/${id}`, { method: 'DELETE' })