import { apiFetch } from './api.js'

export const enviarMensajeChat = (sessionId, mensaje) =>
    apiFetch('/chat/mensaje', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, mensaje }),
    })

export const obtenerHistorialChat = (sessionId) => apiFetch(`/chat/historial/${sessionId}`)

export const obtenerEstadoAsistente = () => apiFetch('/chat/estado')
