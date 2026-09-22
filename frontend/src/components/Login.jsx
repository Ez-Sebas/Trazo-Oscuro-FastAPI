import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from './ui/Input.jsx'
import { Button } from './ui/Button.jsx'
import { Icon } from './ui/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { iniciarSesionBackend } from '../services/authService.js'

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validarFormatoCorreo = (valor) => {
    if (!valor) return 'El correo es obligatorio.'
    if (!REGEX_CORREO.test(valor)) return 'Ingresa un correo electrónico válido.'
    return ''
}

const validarFormatoContrasena = (valor) => {
    if (!valor) return 'La contraseña es obligatoria.'
    if (valor.length < 6) return 'Debe tener al menos 6 caracteres.'
    return ''
}

/**
 * Inicio de sesión en dos pasos, al estilo de Gmail:
 *   paso 1 → correo   ·   paso 2 → contraseña
 *
 * El correo NO se consulta contra el servidor entre un paso y otro: eso
 * revelaría qué cuentas existen (enumeración de usuarios). Las credenciales
 * viajan juntas en una sola petición al final, igual que antes; lo que
 * cambia es la experiencia, que queda más limpia y enfocada.
 */
export const Login = ({ onRecuperar, onRegistro }) => {
    const [paso, setPaso] = useState(1)
    const [correo, setCorreo] = useState('')
    const [contrasena, setContrasena] = useState('')
    const [recordarme, setRecordarme] = useState(false)
    const [errores, setErrores] = useState({ correo: '', contrasena: '' })
    const [errorGeneral, setErrorGeneral] = useState('')
    const [cargandoLogin, setCargandoLogin] = useState(false)
    const [exito, setExito] = useState(false)

    const { iniciarSesion } = useAuth()
    const navigate = useNavigate()
    const campoContrasena = useRef(null)

    // Al pasar al segundo paso el foco va directo a la contraseña.
    useEffect(() => {
        if (paso === 2) campoContrasena.current?.querySelector('input')?.focus()
    }, [paso])

    useEffect(() => {
        if (!exito) return
        const timer = setTimeout(() => navigate('/'), 1500)
        return () => clearTimeout(timer)
    }, [exito, navigate])

    const manejarCorreo = (e) => {
        const valor = e.target.value
        setCorreo(valor)
        setErrores((prev) => ({ ...prev, correo: validarFormatoCorreo(valor) }))
    }

    const manejarContrasena = (e) => {
        const valor = e.target.value
        setContrasena(valor)
        setErrores((prev) => ({ ...prev, contrasena: validarFormatoContrasena(valor) }))
    }

    const irAlPaso2 = (e) => {
        e.preventDefault()
        const errorCorreo = validarFormatoCorreo(correo.trim())
        if (errorCorreo) {
            setErrores((prev) => ({ ...prev, correo: errorCorreo }))
            return
        }
        setErrorGeneral('')
        setPaso(2)
    }

    const volverAlPaso1 = () => {
        setPaso(1)
        setContrasena('')
        setErrores({ correo: '', contrasena: '' })
        setErrorGeneral('')
    }

    const manejarEnvio = async (e) => {
        e.preventDefault()
        setErrorGeneral('')

        const errorContrasena = validarFormatoContrasena(contrasena)
        if (errorContrasena) {
            setErrores((prev) => ({ ...prev, contrasena: errorContrasena }))
            return
        }

        setCargandoLogin(true)
        try {
            const data = await iniciarSesionBackend(correo.trim(), contrasena)
            iniciarSesion(data.usuario, data.token, recordarme)
            setExito(true)
        } catch (error) {
            setErrorGeneral(error.message)
        } finally {
            setCargandoLogin(false)
        }
    }

    if (exito) {
        return (
            <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-acento/15 flex items-center justify-center mx-auto mb-5">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M 5 13 L 10 18 L 19 7" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h2 className="text-texto font-serif text-xl sm:text-2xl mb-2">¡Bienvenido de nuevo!</h2>
                <p className="text-texto-secundario text-sm">Sesión iniciada correctamente. Redirigiendo...</p>
            </div>
        )
    }

    return (
        <div className="w-full">
            {/* Indicador de progreso de los dos pasos */}
            <div className="flex items-center gap-2 mb-6" aria-hidden="true">
                <span className="step-dot step-dot-activo" />
                <span className={`step-dot ${paso === 2 ? 'step-dot-activo' : ''}`} />
            </div>

            <h2 className="text-texto font-serif text-xl sm:text-2xl mb-2 text-center">Iniciar sesión</h2>
            <p className="text-texto-secundario text-sm text-center mb-6">
                {paso === 1 ? 'Ingresa tu correo para continuar' : 'Ahora escribe tu contraseña'}
            </p>

            {paso === 1 ? (
                <form onSubmit={irAlPaso2} className="flex flex-col gap-4" noValidate>
                    <Input
                        label="Correo electrónico"
                        name="correo"
                        type="email"
                        value={correo}
                        onChange={manejarCorreo}
                        error={errores.correo}
                        placeholder="tucorreo@ejemplo.com"
                        maxLength={50}
                    />

                    <Button type="submit" fullWidth>
                        Siguiente
                    </Button>
                </form>
            ) : (
                <form onSubmit={manejarEnvio} className="flex flex-col gap-4" noValidate>
                    {/* Ficha del correo elegido, con opción de corregirlo */}
                    <div className="flex items-center justify-between gap-3 border border-borde rounded-full pl-3 pr-1.5 py-1.5">
                        <span className="flex items-center gap-2 min-w-0">
                            <span className="w-7 h-7 shrink-0 rounded-full bg-acento/15 text-acento-suave flex items-center justify-center">
                                <Icon nombre="perfil" size={14} />
                            </span>
                            <span className="text-texto text-sm truncate">{correo.trim()}</span>
                        </span>
                        <button
                            type="button"
                            onClick={volverAlPaso1}
                            className="shrink-0 text-texto-secundario text-xs px-3 py-1.5 rounded-full hover:text-acento transition-colors cursor-pointer"
                        >
                            Cambiar
                        </button>
                    </div>

                    <div ref={campoContrasena}>
                        <Input
                            label="Contraseña"
                            name="contrasena"
                            type="password"
                            value={contrasena}
                            onChange={manejarContrasena}
                            error={errores.contrasena}
                            placeholder="••••••••"
                            maxLength={30}
                        />
                    </div>

                    {errorGeneral && (
                        <p role="alert" className="text-red-500 text-sm text-center">{errorGeneral}</p>
                    )}

                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="flex items-center gap-2 text-texto-secundario text-xs sm:text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={recordarme}
                                onChange={(e) => setRecordarme(e.target.checked)}
                                className="accent-acento w-4 h-4 cursor-pointer"
                            />
                            Recordarme
                        </label>
                        <button
                            type="button"
                            onClick={onRecuperar}
                            className="text-acento text-xs sm:text-sm hover:underline cursor-pointer"
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>

                    <Button type="submit" fullWidth disabled={cargandoLogin}>
                        {cargandoLogin ? 'Ingresando...' : 'Iniciar sesión'}
                    </Button>

                    <button
                        type="button"
                        onClick={volverAlPaso1}
                        className="inline-flex items-center justify-center gap-2 text-texto-secundario text-sm hover:text-acento transition-colors cursor-pointer"
                    >
                        <Icon nombre="atras" size={14} /> Volver
                    </button>
                </form>
            )}

            <p className="text-texto-secundario text-sm text-center mt-6">
                ¿No tienes cuenta?{' '}
                <button onClick={onRegistro} className="text-acento hover:underline cursor-pointer">Crear cuenta</button>
            </p>
        </div>
    )
}
