import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { obtenerServiciosActivos } from '../services/servicioService.js'
import { obtenerEmpleado } from '../services/usuarioService.js'
import { crearCita } from '../services/citaService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Button } from '../components/ui/Button.jsx'

export const Reservas = () => {
    const [searchParams] = useSearchParams()
    const { usuario } = useAuth()

    const [servicios, setServicios] = useState([])
    const [cargandoServicios, setCargandoServicios] = useState(true)

    const [empleados, setEmpleados] = useState([])
    const [cargandoEmpleados, setCargandoEmpleados] = useState(true)

    const [datos, setDatos] = useState({
        id_servicio: searchParams.get('servicio') || '',
        id_empleado: '',
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

        obtenerEmpleado()
            .then((data) => setEmpleados(data.empleados))
            .finally(() => setCargandoEmpleados(false))
    }, [])

    const opcionesServicio = servicios.map((s) => ({ value: s.id_servicio, label: s.nombre }))
    const opcionesEmpleado = empleados.map((e) => ({ value: e.id_usuario, label: e.nombres + " " + e.apellidos}))

    const validar = () => {
        const nuevosErrores = {}
        if (!datos.id_servicio) nuevosErrores.id_servicio = 'Selecciona un servicio.'
        if (!datos.id_empleado) nuevosErrores.id_empleado = 'Selecciona un empleado.'
        if (!datos.fecha) nuevosErrores.fecha = 'Selecciona una fecha.'
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
        formData.append('id_empleado', datos.id_empleado)
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
            <div className="bg-fondo min-h-screen pt-28 pb-20 px-6 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-acento/15 flex items-center justify-center mx-auto mb-5">
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
        <div className="bg-fondo pt-28 pb-20">
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-12">
                    <h1 className="text-texto font-serif text-4xl md:text-5xl mb-4">Reserva tu Cita</h1>
                    <p className="text-texto-secundario text-lg">
                        Cuéntanos qué tienes en mente y agenda tu sesión con nosotros.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <h2 className="text-texto font-serif text-xl mb-6">Información del Estudio</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-texto-secundario text-xs uppercase tracking-wide mb-1">Dirección</p>
                                <p className="text-texto text-sm">Cra 45 #26-85, Medellín, Colombia</p>
                            </div>
                            <div>
                                <p className="text-texto-secundario text-xs uppercase tracking-wide mb-1">Teléfono</p>
                                <p className="text-texto text-sm">+57 300 123 4567</p>
                            </div>
                            <div>
                                <p className="text-texto-secundario text-xs uppercase tracking-wide mb-1">Correo</p>
                                <p className="text-texto text-sm">contacto@trazooscuro.com</p>
                            </div>
                            <div>
                                <p className="text-texto-secundario text-xs uppercase tracking-wide mb-1">Horario</p>
                                <p className="text-texto text-sm">Martes a Sábado, 11:00 a.m. – 7:00 p.m.</p>
                            </div>
                        </div>

                        {!usuario && (
                            <div className="bg-superficie border border-borde rounded-lg p-4 mt-8">
                                <p className="text-texto-secundario text-sm mb-2">
                                    Puedes explorar el formulario libremente, pero necesitas una cuenta para confirmar tu reserva.
                                </p>
                                <Link to="/login" className="text-acento text-sm hover:underline">
                                    Iniciar sesión o crear cuenta →
                                </Link>
                            </div>
                        )}
                    </div>

                    <form onSubmit={manejarEnvio} className="bg-superficie rounded-lg p-6 flex flex-col gap-4">
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
                        {cargandoEmpleados ? (
                            <p className="text-texto-secundario text-sm">Cargando empleado...</p>
                        ) : (
                            <Select
                                label="Empleado deseado"
                                name="id_empleado"
                                value={datos.id_empleado}
                                onChange={(e) => manejarCambio('id_empleado', e.target.value)}
                                error={errores.id_empleado}
                                options={opcionesEmpleado}
                            />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Fecha"
                                name="fecha"
                                type="date"
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