import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { Input } from '../components/ui/Input.jsx'
import { Button } from '../components/ui/Button.jsx'
import { restablecerPassword } from '../services/authService.js'

export const RestablecerPassword = () => {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const navigate = useNavigate()

    const [password, setPassword] = useState('')
    const [confirmar, setConfirmar] = useState('')
    const [errores, setErrores] = useState({})
    const [errorGeneral, setErrorGeneral] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [exito, setExito] = useState(false)

    const regexContrasena = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/

    const validar = () => {
        const nuevosErrores = {}

        if (!password) {
            nuevosErrores.password = 'La contraseña es obligatoria.'
        } else if (!regexContrasena.test(password)) {
            nuevosErrores.password = 'Debe tener 8-20 caracteres, con letras y números.'
        }

        if (!confirmar) {
            nuevosErrores.confirmar = 'Confirma tu contraseña.'
        } else if (confirmar !== password) {
            nuevosErrores.confirmar = 'Las contraseñas no coinciden.'
        }

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const manejarEnvio = async (e) => {
        e.preventDefault()
        setErrorGeneral('')

        if (!token) {
            setErrorGeneral('El enlace no es válido o ya expiró. Solicita uno nuevo.')
            return
        }

        if (!validar()) return

        setEnviando(true)
        try {
            await restablecerPassword(token, password)
            setExito(true)
            setTimeout(() => navigate('/login'), 2500)
        } catch (err) {
            setErrorGeneral(err.message)
        } finally {
            setEnviando(false)
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-fondo flex flex-col items-center justify-center px-6 text-center">
                <h1 className="text-texto font-serif text-2xl mb-3">Enlace inválido</h1>
                <p className="text-texto-secundario text-sm mb-6 max-w-sm">
                    Este enlace de recuperación no es válido o ya fue utilizado. Solicita uno nuevo desde la
                    página de inicio de sesión.
                </p>
                <Link to="/login" className="text-acento text-sm hover:underline">
                    Volver al inicio de sesión →
                </Link>
            </div>
        )
    }

    if (exito) {
        return (
            <div className="min-h-screen bg-fondo flex flex-col items-center justify-center px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-acento/15 flex items-center justify-center mb-5">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path d="M 5 13 L 10 18 L 19 7" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h1 className="text-texto font-serif text-2xl mb-3">¡Contraseña actualizada!</h1>
                <p className="text-texto-secundario text-sm">
                    Ya puedes iniciar sesión con tu nueva contraseña. Redirigiendo...
                </p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-fondo flex flex-col items-center justify-center px-6">
            <Link to="/" className="flex items-center gap-2 mb-10">
                <svg width="30" height="30" viewBox="0 0 60 60">
                    <path d="M 10 15 L 50 15 M 30 15 L 30 45 L 15 55" fill="none" stroke="#F5F5F4" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="15" cy="55" r="3" fill="#B91C1C" />
                </svg>
                <span className="text-texto font-serif text-xl tracking-wide">TRAZO OSCURO</span>
            </Link>

            <div className="w-full max-w-sm bg-superficie rounded-lg p-6 sm:p-8">
                <h2 className="text-texto font-serif text-xl sm:text-2xl mb-2 text-center">
                    Nueva contraseña
                </h2>
                <p className="text-texto-secundario text-sm text-center mb-6">
                    Escribe tu nueva contraseña para tu cuenta.
                </p>

                <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
                    <Input
                        label="Nueva contraseña"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={errores.password}
                        maxLength={20}
                    />
                    <Input
                        label="Confirmar contraseña"
                        name="confirmar"
                        type="password"
                        value={confirmar}
                        onChange={(e) => setConfirmar(e.target.value)}
                        error={errores.confirmar}
                        maxLength={20}
                    />

                    {errorGeneral && <p className="text-red-500 text-sm text-center">{errorGeneral}</p>}

                    <Button type="submit" fullWidth disabled={enviando}>
                        {enviando ? 'Guardando...' : 'Restablecer contraseña'}
                    </Button>
                </form>
            </div>

            <Link to="/login" className="text-texto-secundario text-sm mt-6 hover:text-acento transition-colors">
                ← Volver al inicio de sesión
            </Link>
        </div>
    )
}