import { apiFetch } from './api.js'

const construirQuery = (params) => {
    const limpio = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    )
    const query = new URLSearchParams(limpio).toString()
    return query ? `?${query}` : ''
}

export const obtenerResumenAdmin = () => apiFetch('/dashboard/admin/resumen')
export const obtenerDashboardVentas = (filtros = {}) => apiFetch(`/dashboard/ventas${construirQuery(filtros)}`)
export const obtenerDashboardCitas = (filtros = {}) => apiFetch(`/dashboard/citas${construirQuery(filtros)}`)
export const obtenerResumenEmpleado = () => apiFetch('/dashboard/empleado/resumen')
export const obtenerResumenCliente = () => apiFetch('/dashboard/cliente/resumen')