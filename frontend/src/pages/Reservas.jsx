import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { obtenerServiciosActivos } from '../services/servicioService.js'
import { crearCita } from '../services/citaService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Icon } from '../components/ui/Icon.jsx'
import imagenReserva from '../assets/images/imagen5.jpg'

const fechaHoy = () => new Date().toISOString().split('T')[0]

export const Reservas = () => {
    const [searchParams] = useSearchParams()
    const { usuario } = useAuth()

    const [servicios, setServicios] = useState([])
    const [cargandoServicios, setCargandoServicios] = useState(true)

    const [datos, setDatos] = useState({
        id_servicio: searchParams.get('servicio') || '',
        fecha: '',
        hora: '',
        mensaje: '',
    })
    const [imagen, setImagen] = useState(null)
    const [errores, setErrores] = useState({})
    const [enviando, setEnviando] = useState(false)
    const [enviado, setEnviado] = useState(false)
    const [errorGeneral, setErrorGeneral] = useState('')

    useEffect(() => {
        obtenerServiciosActivos()
            .then((data) => setServicios(data.servicios))
            .finally(() => setCargandoServicios(false))
    }, [])

    const opcionesServicio = servicios.map((s) => ({ value: s.id_servicio, label: s.nombre }))

    const validar = () => {
        const nuevosErrores = {}
        if (!datos.id_servicio) nuevosErrores.id_servicio = 'Selecciona un servicio.'
        if (!datos.fecha) nuevosErrores.fecha = 'Selecciona una fecha.'
        else if (datos.fecha < fechaHoy()) nuevosErrores.fecha = 'La fecha debe ser hoy o una fecha futura.'
        if (!datos.hora) nuevosErrores.hora = 'Selecciona una hora.'
        if (datos.mensaje.length > 300) nuevosErrores.mensaje = 'Máximo 300 caracteres.'
        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const manejarCambio = (campo, valor) => {
        setDatos((prev) => ({ ...prev, [campo]: valor }))
    }

    const manejarImagen = (e) => {
        const archivo = e.target.files[0]
        if (archivo && archivo.size > 5 * 1024 * 1024) {
            setErrores((prev) => ({ ...prev, imagen: 'La imagen no debe superar 5MB.' }))
            return
        }
        setErrores((prev) => ({ ...prev, imagen: '' }))
        setImagen(archivo || null)
    }

    const manejarEnvio = async (e) => {
        e.preventDefault()
        setErrorGeneral('')

        if (!validar()) return

        if (!usuario) {
            setErrorGeneral('Debes iniciar sesión para confirmar tu reserva.')
            return
        }

        const formData = new FormData()
        formData.append('id_servicio', datos.id_servicio)
        formData.append('fecha', datos.fecha)
        formData.append('hora', datos.hora)
        formData.append('mensaje', datos.mensaje)
        if (imagen) formData.append('imagen', imagen)

        setEnviando(true)
        try {
            await crearCita(formData)
            setEnviado(true)
        } catch (err) {
            setErrorGeneral(err.message || 'No fue posible registrar la reserva en este momento.')
        } finally {
            setEnviando(false)
        }
    }

    if (enviado) {
        return (
            <div className="page-shell min-h-screen pt-28 pb-20 px-6 flex items-center justify-center">
                <div className="page-content text-center max-w-md reveal-up">
                    <div className="w-20 h-20 rounded-full border border-acento/50 bg-acento/10 flex items-center justify-center mx-auto mb-6">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M 5 13 L 10 18 L 19 7" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1 className="text-texto font-serif text-2xl mb-3">¡Reserva enviada!</h1>
                    <p className="text-texto-secundario text-sm">
                        Nos pondremos en contacto contigo para confirmar tu cita.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="page-shell pt-28 pb-24">
            <div className="page-content max-w-6xl mx-auto px-6">
                <div className="max-w-3xl mb-12 sm:mb-16 reveal-up">
                    <span className="eyebrow">Agenda tu sesión</span>
                    <h1 className="editorial-title text-texto text-5xl sm:text-6xl md:text-7xl mt-5 mb-5">Tu idea merece un espacio en la piel.</h1>
                    <p className="text-texto-secundario text-base sm:text-lg max-w-xl leading-relaxed">
                        Cuéntanos qué tienes en mente. Revisaremos tu solicitud y nos pondremos en contacto para definir cada detalle de la sesión.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8 lg:gap-12 items-start">
                    <div className="space-y-6 reveal-up reveal-delay-1">
                        <div className="relative min-h-72 overflow-hidden rounded-2xl border border-borde">
                            <img src={imagenReserva} alt="Interior del estudio Trazo Oscuro" className="absolute inset-0 w-full h-full object-cover opacity-65" />
                            <div className="absolute inset-0 bg-linear-to-t from-fondo via-fondo/35 to-transparent" />
                            <div className="relative flex min-h-72 flex-col justify-end p-6">
                                <span className="text-acento-suave text-xs font-bold tracking-[0.2em] uppercase">Trazo Oscuro / Medellín</span>
                                <p className="text-texto font-serif text-2xl mt-2">Un estudio pensado para crear con calma.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-borde bg-borde">
                            <div className="bg-superficie p-5"><p className="text-texto-secundario text-xs uppercase tracking-wider mb-2">Horario</p><p className="text-texto text-sm leading-relaxed">Mar - Sáb<br />11:00 a.m. - 7:00 p.m.</p></div>
                            <div className="bg-superficie p-5"><p className="text-texto-secundario text-xs uppercase tracking-wider mb-2">Contacto</p><p className="text-texto text-sm leading-relaxed">+57 300 123 4567<br />contacto@trazooscuro.com</p></div>
                        </div>
                        {!usuario && (
                            <div className="border-l-2 border-acento pl-4">
                                <p className="text-texto-secundario text-sm leading-relaxed mb-2">Puedes preparar tu solicitud, pero necesitas una cuenta para confirmarla.</p>
                                <Link to="/login" className="inline-flex items-center gap-2 text-acento-suave text-sm hover:text-texto transition-colors">Iniciar sesión o crear cuenta <Icon nombre="adelante" size={15} /></Link>
                            </div>
                        )}
                    </div>

                    <form onSubmit={manejarEnvio} className="bg-superficie border border-borde rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-2xl reveal-up reveal-delay-2">
                        <div className="flex items-start justify-between gap-4 border-b border-borde pb-5">
                            <div><p className="text-acento-suave text-xs font-bold tracking-[0.18em] uppercase mb-2">Paso 01</p><h2 className="text-texto font-serif text-2xl">Cuéntanos tu idea</h2></div>
                            <span className="text-texto-secundario text-xs">Campos con * obligatorios</span>
                        </div>
                        {cargandoServicios ? (
                            <p className="text-texto-secundario text-sm">Cargando servicios...</p>
                        ) : (
                            <Select
                                label="Servicio deseado"
                                name="id_servicio"
                                value={datos.id_servicio}
                                onChange={(e) => manejarCambio('id_servicio', e.target.value)}
                                error={errores.id_servicio}
                                options={opcionesServicio}
                            />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Fecha"
                                name="fecha"
                                type="date"
                                min={fechaHoy()}
                                value={datos.fecha}
                                onChange={(e) => manejarCambio('fecha', e.target.value)}
                                error={errores.fecha}
                            />
                            <Input
                                label="Hora"
                                name="hora"
                                type="time"
                                value={datos.hora}
                                onChange={(e) => manejarCambio('hora', e.target.value)}
                                error={errores.hora}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label htmlFor="mensaje" className="text-texto-secundario text-sm">
                                Cuéntanos tu idea (opcional)
                            </label>
                            <textarea
                                id="mensaje"
                                rows="3"
                                maxLength={300}
                                value={datos.mensaje}
                                onChange={(e) => manejarCambio('mensaje', e.target.value)}
                                className="bg-fondo border border-borde rounded-md px-3 py-2 text-texto text-sm resize-none focus:outline-none focus:border-acento transition-colors"
                            />
                            {errores.mensaje && <span className="text-red-500 text-xs">{errores.mensaje}</span>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label htmlFor="imagen" className="text-texto-secundario text-sm">
                                Imagen de referencia del diseño (opcional)
                            </label>
                            <input
                                id="imagen"
                                type="file"
                                accept="image/*"
                                onChange={manejarImagen}
                                className="text-texto-secundario text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-acento file:text-texto file:cursor-pointer cursor-pointer"
                            />
                            {errores.imagen && <span className="text-red-500 text-xs">{errores.imagen}</span>}
                        </div>

                        {errorGeneral && <p className="text-red-500 text-sm text-center">{errorGeneral}</p>}

                        <Button type="submit" disabled={enviando}>
                            {enviando ? 'Enviando...' : 'Confirmar reserva'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
