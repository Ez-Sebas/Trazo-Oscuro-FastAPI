import { useState, useEffect } from 'react'
import { obtenerMisCitasCliente, cancelarMiCita } from '../services/citaService.js'
import { Icon } from '../components/ui/Icon.jsx'
import { Badge, BadgePago } from '../components/ui/Badge.jsx'

const pesos = (valor) => `$${Number(valor || 0).toLocaleString('es-CO')}`

export const ClienteCitasPage = () => {
    const [citas, setCitas] = useState([])
    const [cargando, setCargando] = useState(true)

    const cargar = async () => {
        setCargando(true)
        try {
            const data = await obtenerMisCitasCliente()
            setCitas(data.citas)
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        const timer = setTimeout(cargar, 0)
        return () => clearTimeout(timer)
    }, [])

    const cancelar = async (id) => {
        if (!confirm('¿Seguro que deseas cancelar esta cita?')) return
        try {
            await cancelarMiCita(id)
            cargar()
        } catch (err) {
            alert(err.message)
        }
    }

    return (
        <div className="max-w-3xl">
                <div className="mb-8 reveal-up">
                    <p className="eyebrow mb-3">Área personal</p>
                    <h1 className="editorial-title text-texto text-4xl sm:text-5xl mb-3">Mis citas</h1>
                    <p className="text-texto-secundario text-sm">Consulta el estado y los próximos pasos de tus citas.</p>
                </div>
                {cargando ? (
                    <p className="text-texto-secundario text-sm">Cargando citas...</p>
                ) : citas.length === 0 ? (
                    <div className="border border-borde bg-superficie p-8 text-center">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-borde text-texto-secundario flex items-center justify-center"><Icon nombre="citas" size={24} /></div>
                        <h2 className="text-texto font-serif text-xl mb-2">Aún no tienes citas</h2>
                        <p className="text-texto-secundario text-sm">Cuando reserves una sesión, aparecerá aquí.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {citas.map((c) => (
                            <div key={c.id_cita} className="border border-borde bg-superficie p-5 sm:p-6 hover:border-acento/60 transition-colors">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div><p className="text-acento-suave text-[10px] font-bold tracking-[0.18em] uppercase mb-2">Cita #{c.id_cita}</p><h3 className="text-texto font-serif text-xl">{c.servicio_nombre}</h3></div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge estado={c.estado} />
                                        {c.estado !== 'cancelada' && <BadgePago estadoPago={c.estado_pago} />}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-borde/70 pt-4">
                                    <div><p className="text-texto-secundario text-[10px] uppercase tracking-wider">Fecha y hora</p><p className="text-texto text-sm mt-1">{c.fecha} · {c.hora}</p></div>
                                    <div><p className="text-texto-secundario text-[10px] uppercase tracking-wider">Atención</p><p className="text-texto text-sm mt-1">{c.empleado_nombre || 'Por asignar'}</p></div>
                                    <div><p className="text-texto-secundario text-[10px] uppercase tracking-wider">Valor</p><p className="text-texto text-sm mt-1">{pesos(c.servicio_precio)}</p></div>
                                </div>
                                {c.estado === 'pendiente' && (
                                    <p className="text-texto-secundario text-xs mt-4 border-l-2 border-acento pl-3">Revisa tu correo para confirmar esta cita.</p>
                                )}
                                {c.estado !== 'pendiente' && c.estado !== 'cancelada' && c.estado_pago !== 'pagada' && (
                                    <p className="text-texto-secundario text-xs mt-4 border-l-2 border-borde pl-3">El pago del servicio se realiza en el estudio el día de tu cita.</p>
                                )}
                                {c.estado === 'pendiente' && c.estado_pago !== 'pagada' && (
                                    <button
                                        onClick={() => cancelar(c.id_cita)}
                                        className="inline-flex items-center gap-2 text-texto-secundario text-sm mt-4 hover:text-acento-suave transition-colors cursor-pointer"
                                    >
                                        <Icon nombre="cerrarMenu" size={14} /> Cancelar cita
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
        </div>
    )
}
