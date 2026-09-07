import { apiFetch } from './api.js'

export const obtenerServiciosActivos = () => apiFetch('/servicios/activos')
export const obtenerServicios = () => apiFetch('/servicios')
export const crearServicio = (datos) => apiFetch('/servicios', { method: 'POST', body: JSON.stringify(datos) })
export const editarServicio = (id, datos) => apiFetch(`/servicios/${id}`, { method: 'PUT', body: JSON.stringify(datos) })
export const cambiarEstadoServicio = (id, estado) => apiFetch(`/servicios/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) })
export const eliminarServicio = (id) => apiFetch(`/servicios/${id}`, { method: 'DELETE' })