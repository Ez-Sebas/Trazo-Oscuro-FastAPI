import { useState } from 'react'
import { Input } from './ui/Input.jsx'
import { Button } from './ui/Button.jsx'

export const RecoverPassword = ({ onVolver }) => {
    const [correo, setCorreo] = useState('')
    const [error, setError] = useState('')
    const [enviado, setEnviado] = useState(false)

    const validarCorreo = (valor) => {
        const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        if (!valor) {
            return 'El correo es obligatorio.'
        }
        if (!regexCorreo.test(valor)) {
            return 'Ingresa un correo electrónico válido.'
        }
        return ''
    }

    const manejarCambio = (e) => {
        const valor = e.target.value
        setCorreo(valor)
        setError(validarCorreo(valor))
    }

    const manejarEnvio = (e) => {
        e.preventDefault()
        const mensajeError = validarCorreo(correo)
        setError(mensajeError)

        if (!mensajeError) {
            setEnviado(true)
        }
    }

    return (
        <div className="w-full max-w-sm mx-auto">
            <h2 className="text-texto font-serif text-xl sm:text-2xl mb-2 text-center">
                Recuperar contraseña
            </h2>

            {!enviado ? (
                <>
                    <p className="text-texto-secundario text-sm text-center mb-6">
                        Ingresa tu correo y te enviaremos las instrucciones para restablecer tu contraseña.
                    </p>

                    <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
                        <Input
                            label="Correo electrónico"
                            name="correoRecuperar"
                            type="email"
                            value={correo}
                            onChange={manejarCambio}
                            error={error}
                            placeholder="tucorreo@ejemplo.com"
                            maxLength={50}
                        />

                        <Button type="submit" fullWidth>
                            Recuperar contraseña
                        </Button>
                    </form>
                </>
            ) : (
                <p className="text-texto-secundario text-sm text-center mb-6">
                    Si el correo <span className="text-texto">{correo}</span> está registrado, recibirás
                    un enlace para restablecer tu contraseña en unos minutos.
                </p>
            )}

            <button
                onClick={onVolver}
                className="text-acento text-sm mt-4 mx-auto block hover:underline cursor-pointer"
            >
                ← Volver al inicio de sesión
            </button>
        </div>
    )
}