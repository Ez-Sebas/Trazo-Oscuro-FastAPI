import { apiFetch } from './api.js'

export const crearCita = (formData) => apiFetch('/citas', { method: 'POST', body: formData })

export const confirmarCita = (token) =>
    apiFetch('/citas/confirmar', { method: 'POST', body: JSON.stringify({ token }) })

export const obtenerMisCitasCliente = () => apiFetch('/citas/mis-citas')

export const cancelarMiCita = (id_cita) =>
    apiFetch(`/citas/${id_cita}/cancelar-mia`, { method: 'PATCH' })

export const obtenerMisCitasEmpleado = () => apiFetch('/citas/empleado/mis-citas')

export const obtenerTodasLasCitas = () => apiFetch('/citas')

export const asignarEmpleado = (id_cita, id_empleado) =>
    apiFetch(`/citas/${id_cita}/asignar-empleado`, { method: 'PATCH', body: JSON.stringify({ id_empleado }) })

export const actualizarEstadoCita = (id_cita, estado) =>
    apiFetch(`/citas/${id_cita}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) })

export const actualizarPagoCita = (id_cita, estado_pago) =>
    apiFetch(`/citas/${id_cita}/pago`, { method: 'PATCH', body: JSON.stringify({ estado_pago }) })
