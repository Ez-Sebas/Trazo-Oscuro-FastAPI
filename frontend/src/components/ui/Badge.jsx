/**
 * Etiqueta de estado unificada.
 *
 * Antes cada página inventaba sus propios colores para "pendiente",
 * "confirmada", etc. Aquí vive el mapa único, para que una cita se vea igual
 * en el panel del cliente, en el del empleado y en el del administrador.
 */

const tonoPorEstado = {
    // Citas
    pendiente: 'badge-alerta',
    confirmada: 'badge-info',
    realizada: 'badge-exito',
    cancelada: 'badge-neutro',
    // Pago de citas
    pagada: 'badge-exito',
    // Ventas y su estado de pago
    entregada: 'badge-exito',
    pagado: 'badge-exito',
    fallido: 'badge-peligro',
    reembolsado: 'badge-info',
    no_aplica: 'badge-neutro',
    // PQR
    en_proceso: 'badge-info',
    respondida: 'badge-exito',
    cerrada: 'badge-neutro',
    // Genéricos
    activo: 'badge-exito',
    inactivo: 'badge-neutro',
}

const etiquetaPorEstado = {
    en_proceso: 'En proceso',
    no_aplica: 'No aplica',
}

/** "cancelada" -> "Cancelada", sin tocar el resto de la frase. */
const capitalizar = (texto) => (texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto)

export const Badge = ({ estado, texto, tono, className = '' }) => {
    const clave = String(estado ?? '').toLowerCase()
    const variante = tono ? `badge-${tono}` : (tonoPorEstado[clave] || 'badge-neutro')
    const contenido = texto ?? etiquetaPorEstado[clave] ?? clave.replace(/_/g, ' ')

    return <span className={`badge ${variante} ${className}`}>{capitalizar(contenido)}</span>
}

/** Etiqueta específica del cobro de una cita: "Pagada" / "Por cobrar". */
export const BadgePago = ({ estadoPago, className = '' }) => (
    <Badge
        tono={estadoPago === 'pagada' ? 'exito' : 'alerta'}
        texto={estadoPago === 'pagada' ? 'Pagada' : 'Por cobrar'}
        className={className}
    />
)
