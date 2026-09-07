import { apiFetch } from './api.js'

export const obtenerUsuarios = () => apiFetch('/usuarios')
export const obtenerUsuario = (id) => apiFetch(`/usuarios/${id}`)
export const crearUsuarioAdmin = (datos) => apiFetch('/usuarios', { method: 'POST', body: JSON.stringify(datos) })
export const actualizarUsuario = (id, datos) => apiFetch(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(datos) })
export const cambiarEstadoUsuario = (id, estado) => apiFetch(`/usuarios/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) })
export const cambiarRolUsuario = (id, id_rol) => apiFetch(`/usuarios/${id}/rol`, { method: 'PATCH', body: JSON.stringify({ id_rol }) })
export const eliminarUsuario = (id) => apiFetch(`/usuarios/${id}`, { method: 'DELETE' })

export const obtenerMiPerfil = () => apiFetch('/usuarios/perfil/me')
export const actualizarMiPerfil = (datos) => apiFetch('/usuarios/perfil/me', { method: 'PUT', body: JSON.stringify(datos) })