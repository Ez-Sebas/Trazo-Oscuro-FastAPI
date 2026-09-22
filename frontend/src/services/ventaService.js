import { apiFetch } from './api.js'

const construirQuery = (params) => {
    const limpio = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    )
    const query = new URLSearchParams(limpio).toString()
    return query ? `?${query}` : ''
}

export const crearCheckout = (items, descuento = 0) =>
    apiFetch('/ventas/checkout', { method: 'POST', body: JSON.stringify({ items, descuento }) })

export const verificarPago = (sessionId) => apiFetch(`/ventas/verificar-pago/${sessionId}`)

export const crearVentaMostrador = (datos) =>
    apiFetch('/ventas/mostrador', { method: 'POST', body: JSON.stringify(datos) })

export const obtenerVentas = (filtros = {}) => apiFetch(`/ventas${construirQuery(filtros)}`)

export const obtenerMisVentas = () => apiFetch('/ventas/mis-ventas')

export const obtenerVenta = (id) => apiFetch(`/ventas/${id}`)

export const entregarVenta = (id) => apiFetch(`/ventas/${id}/entregar`, { method: 'PATCH' })

export const cancelarVenta = (id) => apiFetch(`/ventas/${id}/cancelar`, { method: 'PATCH' })