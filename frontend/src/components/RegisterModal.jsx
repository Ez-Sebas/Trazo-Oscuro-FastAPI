import { useState } from 'react'
import { Input } from './ui/Input.jsx'
import { Select } from './ui/Select.jsx'
import { Button } from './ui/Button.jsx'
import { registrarUsuario } from '../services/authService.js'

const tiposDocumento = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'PA', label: 'Pasaporte' },
]

const valoresIniciales = {
    nombre: '', apellido: '', tipoDocumento: '', numeroDocumento: '',
    direccion: '', telefono: '', correo: '', contrasena: '', confirmarContrasena: '',
}

export const RegisterModal = ({ abierto, onCerrar }) => {
    const [datos, setDatos] = useState(valoresIniciales)
    const [errores, setErrores] = useState({})
    const [registrado, setRegistrado] = useState(false)
    const [errorGeneral, setErrorGeneral] = useState('')
    const [enviando, setEnviando] = useState(false)

    if (!abierto) return null

    const validarCampo = (nombre, valor, datosActuales) => {
        const regexSoloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/
        const regexSoloNumeros = /^[0-9]+$/
        const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const regexContrasena = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/

        switch (nombre) {
            case 'nombre':
            case 'apellido':
                if (!valor) return 'Este campo es obligatorio.'
                if (valor.length < 2 || valor.length > 30) return 'Debe tener entre 2 y 30 caracteres.'
                if (!regexSoloLetras.test(valor)) return 'Solo se permiten letras.'
                return ''
            case 'tipoDocumento':
                if (!valor) return 'Selecciona un tipo de documento.'
                return ''
            case 'numeroDocumento':
                if (!valor) return 'El número de documento es obligatorio.'
                if (!regexSoloNumeros.test(valor)) return 'Solo se permiten números.'
                if (valor.length < 6 || valor.length > 15) return 'Debe tener entre 6 y 15 dígitos.'
                return ''
            case 'direccion':
                if (!valor) return 'La dirección es obligatoria.'
                if (valor.length < 5 || valor.length > 60) return 'Debe tener entre 5 y 60 caracteres.'
                return ''
            case 'telefono':
                if (!valor) return 'El teléfono es obligatorio.'
                if (!/^[0-9]{7,10}$/.test(valor)) return 'Debe tener entre 7 y 10 dígitos numéricos.'
                return ''
            case 'correo':
                if (!valor) return 'El correo es obligatorio.'
                if (!regexCorreo.test(valor)) return 'Ingresa un correo electrónico válido.'
                return ''
            case 'contrasena':
                if (!valor) return 'La contraseña es obligatoria.'
                if (!regexContrasena.test(valor)) return 'Debe tener 8-20 caracteres, con letras y números.'
                return ''
            case 'confirmarContrasena':
                if (!valor) return 'Confirma tu contraseña.'
                if (valor !== datosActuales.contrasena) return 'Las contraseñas no coinciden.'
                return ''
            default:
                return ''
        }
    }

    const manejarCambio = (e) => {
        const { name, value } = e.target
        const nuevosDatos = { ...datos, [name]: value }
        setDatos(nuevosDatos)

        const nuevoError = validarCampo(name, value, nuevosDatos)
        const nuevosErrores = { ...errores, [name]: nuevoError }

        if (name === 'contrasena' && nuevosDatos.confirmarContrasena) {
            nuevosErrores.confirmarContrasena =
                nuevosDatos.confirmarContrasena !== value ? 'Las contraseñas no coinciden.' : ''
        }
        setErrores(nuevosErrores)
    }

    const manejarEnvio = async (e) => {
        e.preventDefault()
        setErrorGeneral('')

        const nuevosErrores = {}
        Object.keys(datos).forEach((campo) => {
            nuevosErrores[campo] = validarCampo(campo, datos[campo], datos)
        })
        setErrores(nuevosErrores)

        const hayErrores = Object.values(nuevosErrores).some((msg) => msg !== '')
        if (hayErrores) return

        setEnviando(true)
        try {
            await registrarUsuario({
                nombres: datos.nombre,
                apellidos: datos.apellido,
                tipo_documento: datos.tipoDocumento,
                numero_documento: datos.numeroDocumento,
                direccion: datos.direccion,
                telefono: datos.telefono,
                email: datos.correo,
                password: datos.contrasena,
            })
            setRegistrado(true)
        } catch (error) {
            setErrorGeneral(error.message)
        } finally {
            setEnviando(false)
        }
    }

    const cerrarYReiniciar = () => {
        setDatos(valoresIniciales)
        setErrores({})
        setRegistrado(false)
        setErrorGeneral('')
        onCerrar()
    }

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 px-4 py-6">
            <div className="bg-superficie rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative">
                <button onClick={cerrarYReiniciar} className="absolute top-4 right-4 text-texto-secundario hover:text-acento text-xl cursor-pointer" aria-label="Cerrar">✕</button>

                {registrado ? (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 rounded-full bg-acento/15 flex items-center justify-center mx-auto mb-5">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <path d="M 5 13 L 10 18 L 19 7" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h2 className="text-texto font-serif text-xl sm:text-2xl mb-3">¡Registro exitoso!</h2>
                        <p className="text-texto-secundario text-sm mb-6">Tu cuenta fue creada correctamente. Ya puedes iniciar sesión.</p>
                        <Button onClick={cerrarYReiniciar}>Ir a iniciar sesión</Button>
                    </div>
                ) : (
                    <>
                        <h2 className="text-texto font-serif text-xl sm:text-2xl mb-1 text-center">Crear cuenta</h2>
                        <p className="text-texto-secundario text-sm text-center mb-6">Completa tus datos para registrarte</p>

                        <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="Nombre" name="nombre" value={datos.nombre} onChange={manejarCambio} error={errores.nombre} maxLength={30} />
                                <Input label="Apellido" name="apellido" value={datos.apellido} onChange={manejarCambio} error={errores.apellido} maxLength={30} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Select label="Tipo de documento" name="tipoDocumento" value={datos.tipoDocumento} onChange={manejarCambio} error={errores.tipoDocumento} options={tiposDocumento} />
                                <Input label="Número de documento" name="numeroDocumento" value={datos.numeroDocumento} onChange={manejarCambio} error={errores.numeroDocumento} maxLength={15} />
                            </div>
                            <Input label="Dirección" name="direccion" value={datos.direccion} onChange={manejarCambio} error={errores.direccion} maxLength={60} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="Teléfono" name="telefono" type="tel" value={datos.telefono} onChange={manejarCambio} error={errores.telefono} maxLength={10} />
                                <Input label="Correo electrónico" name="correo" type="email" value={datos.correo} onChange={manejarCambio} error={errores.correo} maxLength={50} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="Contraseña" name="contrasena" type="password" value={datos.contrasena} onChange={manejarCambio} error={errores.contrasena} maxLength={20} />
                                <Input label="Confirmar contraseña" name="confirmarContrasena" type="password" value={datos.confirmarContrasena} onChange={manejarCambio} error={errores.confirmarContrasena} maxLength={20} />
                            </div>

                            {errorGeneral && <p className="text-red-500 text-sm text-center">{errorGeneral}</p>}

                            <Button type="submit" fullWidth disabled={enviando}>
                                {enviando ? 'Registrando...' : 'Registrarme'}
                            </Button>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}