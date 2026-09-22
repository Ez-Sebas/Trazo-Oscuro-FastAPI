const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export const construirUrlArchivo = (ruta) => {
    if (!ruta) return ''
    if (ruta.startsWith('http')) return ruta
    return `${API_URL.replace(/\/api\/?$/, '')}${ruta}`
}

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

export const apiFetchBlob = async (endpoint) => {
    const token = localStorage.getItem('trazo_token') || sessionStorage.getItem('trazo_token')

    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    })

    if (!response.ok) {
        let mensaje = 'No fue posible descargar el archivo.'
        try {
            const data = await response.json()
            mensaje = extraerMensajeError(data)
        } catch {
            // sin cuerpo JSON, se usa el mensaje genérico
        }
        throw new Error(mensaje)
    }

    return response.blob()
}