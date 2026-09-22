import { apiFetch, apiFetchBlob } from './api.js'

const construirQuery = (params) => {
    const limpio = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    )
    const query = new URLSearchParams(limpio).toString()
    return query ? `?${query}` : ''
}

export const generarFactura = (idVenta) => apiFetch(`/facturas/generar/${idVenta}`, { method: 'POST' })

export const obtenerFacturas = (filtros = {}) => apiFetch(`/facturas${construirQuery(filtros)}`)

export const obtenerMisFacturas = () => apiFetch('/facturas/mis-facturas')

export const obtenerFactura = (id) => apiFetch(`/facturas/${id}`)

export const descargarFacturaPdf = (id) => apiFetchBlob(`/facturas/${id}/pdf`)

export const anularFactura = (id) => apiFetch(`/facturas/${id}/anular`, { method: 'PATCH' })