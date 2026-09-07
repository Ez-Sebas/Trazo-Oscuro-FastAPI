import { apiFetch } from './api.js'

export const registrarUsuario = (datos) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(datos) })

export const iniciarSesionBackend = (correo, contrasena) =>
    apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: correo, password: contrasena }),
    })