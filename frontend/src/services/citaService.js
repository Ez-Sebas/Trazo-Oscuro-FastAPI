import { apiFetch } from './api.js'

// Cliente: crear una reserva (incluye imagen del diseño → FormData)
export const crearCita = (formData) =>
    apiFetch('/citas', { method: 'POST', body: formData })

// Cliente: ver sus propias citas
export const obtenerMisCitasCliente = () => apiFetch('/citas/mis-citas')

// Empleado: ver SOLO las citas asignadas a él (el backend filtra por el JWT, no por un id que mande el frontend)
export const obtenerMisCitasEmpleado = () => apiFetch('/citas/empleado/mis-citas')

// Administrador: ver todas las citas del sistema
export const obtenerTodasLasCitas = () => apiFetch('/citas')

export const actualizarEstadoCita = (id_cita, estado) =>
    apiFetch(`/citas/${id_cita}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) })

export const eliminarCita = (id_cita) => apiFetch(`/citas/${id_cita}`, { method: 'DELETE' })

export const asignarEmpleado = (id_cita, id_empleado) =>
    apiFetch(`/citas/${id_cita}/asignar-empleado`, {
        method: 'PATCH',
        body: JSON.stringify({ id_empleado }),
    })