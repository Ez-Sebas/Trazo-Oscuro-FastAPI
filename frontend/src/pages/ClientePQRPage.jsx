import { useState, useEffect, useCallback } from 'react'
import { crearPQR, obtenerMisPQR, cerrarMiPQR } from '../services/pqrService.js'
import { ClienteTabs } from '../components/ClienteTabs.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'

const tiposPQR = [
    { value: 'peticion', label: 'Petición' },
    { value: 'queja', label: 'Queja' },
    { value: 'reclamo', label: 'Reclamo' },
    { value: 'sugerencia', label: 'Sugerencia' },
]

export const ClientePQRPage = () => {
    const [pqrs, setPqrs] = useState([])
    const [cargando, setCargando] = useState(true)
    const [mostrarForm, setMostrarForm] = useState(false)
    const [form, setForm] = useState({ tipo: '', asunto: '', descripcion: '' })
    const [errores, setErrores] = useState({})
    const [enviando, setEnviando] = useState(false)

    const cargar = useCallback(async () => {
        setCargando(true)
        try {
            const data = await obtenerMisPQR()
            setPqrs(data.pqrs)
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(cargar, 0)
        return () => clearTimeout(timer)
    }, [cargar])

    const validar = () => {
        const nuevosErrores = {}
        if (!form.tipo) nuevosErrores.tipo = 'Selecciona un tipo.'
        if (!form.asunto.trim() || form.asunto.trim().length < 5) nuevosErrores.asunto = 'Debe tener al menos 5 caracteres.'
        if (!form.descripcion.trim() || form.descripcion.trim().length < 10) nuevosErrores.descripcion = 'Debe tener al menos 10 caracteres.'
        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const manejarEnvio = async (e) => {
        e.preventDefault()
        if (!validar()) return
        setEnviando(true)
        try {
            await crearPQR(form)
            setForm({ tipo: '', asunto: '', descripcion: '' })
            setErrores({})
            setMostrarForm(false)
            cargar()
        } catch (err) {
            alert(err.message)
        } finally {
            setEnviando(false)
        }
    }

    const cerrar = async (id) => {
        if (!confirm('¿Confirmas que tu solicitud fue resuelta y deseas cerrarla?')) return
        try {
            await cerrarMiPQR(id)
            cargar()
        } catch (err) {
            alert(err.message)
        }
    }

    return (
        <div className="page-shell min-h-screen pt-28 pb-20 px-6">
            <div className="page-content max-w-3xl mx-auto">
                <div className="mb-8 reveal-up">
                    <p className="eyebrow mb-3">Área personal</p>
                    <h1 className="editorial-title text-texto text-4xl sm:text-5xl mb-3">Mis solicitudes</h1>
                <p className="text-texto-secundario text-sm mb-6">Registra y consulta tus peticiones, quejas y reclamos.</p>
                </div>
                <ClienteTabs />

                <div className="flex justify-end mb-4">
                    <Button onClick={() => setMostrarForm(!mostrarForm)}>
                        {mostrarForm ? 'Cancelar' : 'Nueva solicitud'}
                    </Button>
                </div>

                {mostrarForm && (
                    <form onSubmit={manejarEnvio} className="border border-borde bg-superficie p-5 sm:p-6 flex flex-col gap-4 mb-6">
                        <Select label="Tipo de solicitud" name="tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} error={errores.tipo} options={tiposPQR} />
                        <div className="flex flex-col gap-1">
                            <label className="text-texto-secundario text-xs sm:text-sm">Asunto</label>
                            <input
                                value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })}
                                maxLength={100}
                                className="bg-fondo border border-borde rounded-md px-3 py-2 text-texto text-sm focus:outline-none focus:border-acento"
                            />
                            {errores.asunto && <span className="text-red-500 text-xs">{errores.asunto}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-texto-secundario text-xs sm:text-sm">Descripción</label>
                            <textarea
                                value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                maxLength={500} rows={4}
                                className="bg-fondo border border-borde rounded-md px-3 py-2 text-texto text-sm resize-none focus:outline-none focus:border-acento"
                            />
                            {errores.descripcion && <span className="text-red-500 text-xs">{errores.descripcion}</span>}
                        </div>
                        <Button type="submit" disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar solicitud'}</Button>
                    </form>
                )}

                {cargando ? (
                    <p className="text-texto-secundario text-sm">Cargando...</p>
                ) : pqrs.length === 0 ? (
                    <div className="border border-borde bg-superficie p-8 text-center"><p className="text-texto font-serif text-xl mb-2">Aún no tienes solicitudes</p><p className="text-texto-secundario text-sm">Cuando registres una, aparecerá aquí.</p></div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {pqrs.map((p) => (
                            <article key={p.id_pqr} className="border border-borde bg-superficie p-5 hover:border-acento/60 transition-colors">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div><p className="text-acento-suave text-[10px] font-bold tracking-[0.18em] uppercase mb-2">{p.tipo}</p><h3 className="text-texto font-serif text-xl">{p.asunto}</h3></div>
                                    <Badge estado={p.estado} />
                                </div>
                                <p className="text-texto-secundario text-sm mb-3">{p.descripcion}</p>
                                {p.respuesta && (
                                    <div className="bg-fondo border-l-2 border-acento p-3 mt-2">
                                        <p className="text-texto-secundario text-xs mb-1">Respuesta del estudio:</p>
                                        <p className="text-texto text-sm">{p.respuesta}</p>
                                    </div>
                                )}
                                {p.estado === 'respondida' && (
                                    <button onClick={() => cerrar(p.id_pqr)} className="text-acento text-sm mt-3 hover:underline cursor-pointer">
                                        Marcar como resuelta
                                    </button>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
