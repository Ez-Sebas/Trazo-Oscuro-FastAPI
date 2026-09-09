const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

const extraerMensajeError = (data) => {
    if (typeof data.detail === 'string') return data.detail

    if (Array.isArray(data.detail)) {
        return data.detail.map((error) => error.msg).join(' ')
    }

    return data.message || 'Error en la solicitud.'
}

export const apiFetch = async (endpoint, options = {}) => {

    const token =
        localStorage.getItem('trazo_token') ||
        sessionStorage.getItem('trazo_token')

    const esFormData = options.body instanceof FormData

    const headers = {
        ...(esFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    }

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers,
        }
    )

    const data = await response.json()

    if (!response.ok) {
        throw new Error(extraerMensajeError(data))
    }

    return data
}