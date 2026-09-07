import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from './ui/Input.jsx'
import { Button } from './ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { iniciarSesionBackend } from '../services/authService.js'

export const Login = ({ onRecuperar, onRegistro }) => {
    const [correo, setCorreo] = useState('')
    const [contrasena, setContrasena] = useState('')
    const [recordarme, setRecordarme] = useState(false)
    const [errores, setErrores] = useState({ correo: '', contrasena: '' })
    const [errorGeneral, setErrorGeneral] = useState('')
    const [cargandoLogin, setCargandoLogin] = useState(false)
    const [exito, setExito] = useState(false)

    const { iniciarSesion } = useAuth()
    const navigate = useNavigate()

    const validarFormatoCorreo = (valor) => {
        const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!valor) return 'El correo es obligatorio.'
        if (!regexCorreo.test(valor)) return 'Ingresa un correo electrónico válido.'
        return ''
    }

    const validarFormatoContrasena = (valor) => {
        if (!valor) return 'La contraseña es obligatoria.'
        if (valor.length < 6) return 'Debe tener al menos 6 caracteres.'
        return ''
    }

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

    const manejarEnvio = async (e) => {
        e.preventDefault()
        setErrorGeneral('')

        const errorCorreo = validarFormatoCorreo(correo)
        const errorContrasena = validarFormatoContrasena(contrasena)

        if (errorCorreo || errorContrasena) {
            setErrores({ correo: errorCorreo, contrasena: errorContrasena })
            return
        }

        setCargandoLogin(true)
        try {
            const data = await iniciarSesionBackend(correo, contrasena)
            iniciarSesion(data.usuario, data.token, recordarme)
            setExito(true)
        } catch (error) {
            setErrorGeneral(error.message)
        } finally {
            setCargandoLogin(false)
        }
    }

    useEffect(() => {
        if (exito) {
            const timer = setTimeout(() => navigate('/'), 1500)
            return () => clearTimeout(timer)
        }
    }, [exito, navigate])

    if (exito) {
        return (
            <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-acento/15 flex items-center justify-center mx-auto mb-5">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
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
            <h2 className="text-texto font-serif text-xl sm:text-2xl mb-2 text-center">Iniciar sesión</h2>
            <p className="text-texto-secundario text-sm text-center mb-6">Ingresa tus datos para acceder a tu cuenta</p>

            <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
                <Input label="Correo electrónico" name="correo" type="email" value={correo} onChange={manejarCorreo} error={errores.correo} placeholder="tucorreo@ejemplo.com" maxLength={50} />
                <Input label="Contraseña" name="contrasena" type="password" value={contrasena} onChange={manejarContrasena} error={errores.contrasena} placeholder="••••••••" maxLength={30} />

                {errorGeneral && <p className="text-red-500 text-sm text-center">{errorGeneral}</p>}

                <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="flex items-center gap-2 text-texto-secundario text-xs sm:text-sm cursor-pointer">
                        <input type="checkbox" checked={recordarme} onChange={(e) => setRecordarme(e.target.checked)} className="accent-acento w-4 h-4 cursor-pointer" />
                        Recordarme
                    </label>
                    <button type="button" onClick={onRecuperar} className="text-acento text-xs sm:text-sm hover:underline cursor-pointer">
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>

                <Button type="submit" fullWidth disabled={cargandoLogin}>
                    {cargandoLogin ? 'Ingresando...' : 'Iniciar sesión'}
                </Button>
            </form>

            <p className="text-texto-secundario text-sm text-center mt-6">
                ¿No tienes cuenta?{' '}
                <button onClick={onRegistro} className="text-acento hover:underline cursor-pointer">Crear cuenta</button>
            </p>
        </div>
    )
}