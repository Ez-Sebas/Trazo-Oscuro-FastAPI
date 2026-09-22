import { useState } from 'react'
import { Input } from './ui/Input.jsx'
import { Select } from './ui/Select.jsx'
import { Button } from './ui/Button.jsx'
import { Icon } from './ui/Icon.jsx'
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

// Campos que se validan en cada paso del formulario.
const CAMPOS_PASO_1 = ['nombre', 'apellido', 'tipoDocumento', 'numeroDocumento', 'direccion', 'telefono', 'correo']
const CAMPOS_PASO_2 = ['contrasena', 'confirmarContrasena']

const validarCampo = (nombre, valor, datosActuales) => {
    const regexSoloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/
    const regexSoloNumeros = /^[0-9]+$/
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const regexContrasena = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/

    switch (nombre) {
        case 'nombre':
        case 'apellido':
            if (!valor) return 'Este campo es obligatorio.'
            if (valor.length < 2 || valor.length > 50) return 'Debe tener entre 2 y 50 caracteres.'
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
            if (valor.length < 5 || valor.length > 100) return 'Debe tener entre 5 y 60 caracteres.'
            return ''
        case 'telefono':
            if (!valor) return 'El teléfono es obligatorio.'
            if (!/^[0-9]{7,15}$/.test(valor)) return 'Debe tener entre 7 y 15 dígitos numéricos.'
            return ''
        case 'correo':
            if (!valor) return 'El correo es obligatorio.'
            if (!regexCorreo.test(valor)) return 'Ingresa un correo electrónico válido.'
            return ''
        case 'contrasena':
            if (!valor) return 'La contraseña es obligatoria.'
            if (!regexContrasena.test(valor)) return 'Debe tener 8-72 caracteres, con letras y números.'
            return ''
        case 'confirmarContrasena':
            if (!valor) return 'Confirma tu contraseña.'
            if (valor !== datosActuales.contrasena) return 'Las contraseñas no coinciden.'
            return ''
        default:
            return ''
    }
}

/** Indicador visual de la fuerza de la contraseña. */
const medirFuerza = (valor) => {
    if (!valor) return { nivel: 0, texto: '', tono: '', barra: '' }
    let puntos = 0
    if (valor.length >= 8) puntos += 1
    if (valor.length >= 12) puntos += 1
    if (/[A-Z]/.test(valor) && /[a-z]/.test(valor)) puntos += 1
    if (/\d/.test(valor)) puntos += 1
    if (/[^A-Za-z0-9]/.test(valor)) puntos += 1

    if (puntos <= 2) return { nivel: 1, texto: 'Débil', tono: 'text-red-500', barra: 'step-dot-debil' }
    if (puntos === 3) return { nivel: 2, texto: 'Aceptable', tono: 'text-amber-400', barra: 'step-dot-medio' }
    if (puntos === 4) return { nivel: 3, texto: 'Buena', tono: 'text-emerald-400', barra: 'step-dot-fuerte' }
    return { nivel: 4, texto: 'Excelente', tono: 'text-emerald-400', barra: 'step-dot-fuerte' }
}

/**
 * Registro en dos pasos:
 *   paso 1 → datos personales   ·   paso 2 → contraseña y confirmación
 *
 * Separar la contraseña del resto evita el formulario largo de antes y deja
 * espacio para mostrar los requisitos de seguridad mientras se escribe.
 */
export const RegisterModal = ({ abierto, onCerrar }) => {
    const [paso, setPaso] = useState(1)
    const [datos, setDatos] = useState(valoresIniciales)
    const [errores, setErrores] = useState({})
    const [registrado, setRegistrado] = useState(false)
    const [errorGeneral, setErrorGeneral] = useState('')
    const [enviando, setEnviando] = useState(false)

    if (!abierto) return null

    const manejarCambio = (e) => {
        const { name, value } = e.target
        const nuevosDatos = { ...datos, [name]: value }
        setDatos(nuevosDatos)

        const nuevosErrores = { ...errores, [name]: validarCampo(name, value, nuevosDatos) }

        if (name === 'contrasena' && nuevosDatos.confirmarContrasena) {
            nuevosErrores.confirmarContrasena =
                nuevosDatos.confirmarContrasena !== value ? 'Las contraseñas no coinciden.' : ''
        }
        setErrores(nuevosErrores)
    }

    const validarPaso = (campos) => {
        const nuevosErrores = { ...errores }
        campos.forEach((campo) => {
            nuevosErrores[campo] = validarCampo(campo, datos[campo], datos)
        })
        setErrores(nuevosErrores)
        return campos.every((campo) => !nuevosErrores[campo])
    }

    const irAlPaso2 = (e) => {
        e.preventDefault()
        setErrorGeneral('')
        if (validarPaso(CAMPOS_PASO_1)) setPaso(2)
    }

    const volverAlPaso1 = () => {
        setPaso(1)
        setErrorGeneral('')
    }

    const manejarEnvio = async (e) => {
        e.preventDefault()
        setErrorGeneral('')

        if (!validarPaso(CAMPOS_PASO_2)) return

        // Red de seguridad: si algo del primer paso quedó inválido, se vuelve.
        if (!validarPaso(CAMPOS_PASO_1)) {
            setPaso(1)
            return
        }

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
            // Los conflictos de correo o documento se resuelven en el paso 1.
            if (/correo|documento/i.test(error.message)) setPaso(1)
        } finally {
            setEnviando(false)
        }
    }

    const cerrarYReiniciar = () => {
        setPaso(1)
        setDatos(valoresIniciales)
        setErrores({})
        setRegistrado(false)
        setErrorGeneral('')
        onCerrar()
    }

    const fuerza = medirFuerza(datos.contrasena)

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 px-4 py-6">
            <div className="bg-superficie rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto panel-scrollbar p-6 sm:p-8 relative">
                <button
                    onClick={cerrarYReiniciar}
                    className="absolute top-4 right-4 text-texto-secundario hover:text-acento cursor-pointer"
                    aria-label="Cerrar"
                >
                    <Icon nombre="cerrarMenu" size={18} />
                </button>

                {registrado ? (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 rounded-full bg-acento/15 flex items-center justify-center mx-auto mb-5">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M 5 13 L 10 18 L 19 7" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h2 className="text-texto font-serif text-xl sm:text-2xl mb-3">¡Registro exitoso!</h2>
                        <p className="text-texto-secundario text-sm mb-6">Tu cuenta fue creada correctamente. Ya puedes iniciar sesión.</p>
                        <Button onClick={cerrarYReiniciar}>Ir a iniciar sesión</Button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-6 pr-8" aria-hidden="true">
                            <span className="step-dot step-dot-activo" />
                            <span className={`step-dot ${paso === 2 ? 'step-dot-activo' : ''}`} />
                        </div>

                        <h2 className="text-texto font-serif text-xl sm:text-2xl mb-1 text-center">Crear cuenta</h2>
                        <p className="text-texto-secundario text-sm text-center mb-6">
                            {paso === 1
                                ? 'Paso 1 de 2 · Cuéntanos quién eres'
                                : 'Paso 2 de 2 · Protege tu cuenta'}
                        </p>

                        {paso === 1 ? (
                            <form onSubmit={irAlPaso2} className="flex flex-col gap-4" noValidate>
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

                                {errorGeneral && (
                                    <p role="alert" className="text-red-500 text-sm text-center">{errorGeneral}</p>
                                )}

                                <Button type="submit" fullWidth>Siguiente</Button>
                            </form>
                        ) : (
                            <form onSubmit={manejarEnvio} className="flex flex-col gap-4" noValidate>
                                {/* Resumen de la identidad capturada en el paso 1 */}
                                <div className="flex items-center justify-between gap-3 border border-borde rounded-lg px-3 py-2.5">
                                    <span className="min-w-0">
                                        <span className="block text-texto text-sm truncate">{datos.nombre} {datos.apellido}</span>
                                        <span className="block text-texto-secundario text-xs truncate">{datos.correo}</span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={volverAlPaso1}
                                        className="shrink-0 text-texto-secundario text-xs hover:text-acento transition-colors cursor-pointer"
                                    >
                                        Editar
                                    </button>
                                </div>

                                <Input label="Contraseña" name="contrasena" type="password" value={datos.contrasena} onChange={manejarCambio} error={errores.contrasena} maxLength={20} />

                                {datos.contrasena && (
                                    <div>
                                        <div className="flex gap-1.5 mb-1.5" aria-hidden="true">
                                            {[1, 2, 3, 4].map((nivel) => (
                                                <span
                                                    key={nivel}
                                                    className={`step-dot ${nivel <= fuerza.nivel ? fuerza.barra : ''}`}
                                                />
                                            ))}
                                        </div>
                                        <p className={`text-xs ${fuerza.tono}`}>Seguridad de la contraseña: {fuerza.texto}</p>
                                    </div>
                                )}

                                <Input label="Confirmar contraseña" name="confirmarContrasena" type="password" value={datos.confirmarContrasena} onChange={manejarCambio} error={errores.confirmarContrasena} maxLength={20} />

                                <ul className="text-texto-secundario text-xs space-y-1 border-l-2 border-borde pl-3">
                                    <li>Entre 8 y 72 caracteres.</li>
                                    <li>Debe combinar letras y números.</li>
                                    <li>Evita datos fáciles de adivinar, como tu documento.</li>
                                </ul>

                                {errorGeneral && (
                                    <p role="alert" className="text-red-500 text-sm text-center">{errorGeneral}</p>
                                )}

                                <Button type="submit" fullWidth disabled={enviando}>
                                    {enviando ? 'Registrando...' : 'Crear mi cuenta'}
                                </Button>

                                <button
                                    type="button"
                                    onClick={volverAlPaso1}
                                    className="inline-flex items-center justify-center gap-2 text-texto-secundario text-sm hover:text-acento transition-colors cursor-pointer"
                                >
                                    <Icon nombre="atras" size={14} /> Volver a mis datos
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
