import { apiFetch } from './api.js'

export const registrarUsuario = (datos) =>
    apiFetch('/usuarios/registro', { method: 'POST', body: JSON.stringify(datos) })

export const iniciarSesionBackend = (correo, contrasena) =>
    apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: correo, password: contrasena }),
    })

export const solicitarRecuperacion = (correo) =>
    apiFetch('/auth/recuperar-password', {
        method: 'POST',
        body: JSON.stringify({ email: correo }),
    })

export const restablecerPassword = (token, password) =>
    apiFetch('/auth/restablecer-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
    })