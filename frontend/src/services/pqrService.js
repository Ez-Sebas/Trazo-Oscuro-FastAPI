import { apiFetch } from './api.js'

const construirQuery = (params) => {
    const limpio = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    )
    const query = new URLSearchParams(limpio).toString()
    return query ? `?${query}` : ''
}

export const crearPQR = (datos) => apiFetch('/pqr', { method: 'POST', body: JSON.stringify(datos) })
export const obtenerMisPQR = () => apiFetch('/pqr/mis-pqr')
export const cerrarMiPQR = (id) => apiFetch(`/pqr/${id}/cerrar`, { method: 'PATCH' })
export const obtenerPQR = (filtros = {}) => apiFetch(`/pqr${construirQuery(filtros)}`)
export const marcarEnProceso = (id) => apiFetch(`/pqr/${id}/en-proceso`, { method: 'PATCH' })
export const responderPQR = (id, respuesta) =>
    apiFetch(`/pqr/${id}/responder`, { method: 'PATCH', body: JSON.stringify({ respuesta }) })