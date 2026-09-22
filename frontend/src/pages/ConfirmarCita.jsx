import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { confirmarCita } from '../services/citaService.js'
import { Icon } from '../components/ui/Icon.jsx'

export const ConfirmarCita = () => {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const [estado, setEstado] = useState(token ? 'verificando' : 'error')
    const [mensaje, setMensaje] = useState('')

    useEffect(() => {
        if (!token) {
            return
        }
        confirmarCita(token)
            .then((data) => { setMensaje(data.message); setEstado('ok') })
            .catch((err) => { setMensaje(err.message); setEstado('error') })
    }, [token])

    return (
        <div className="page-shell min-h-screen flex items-center justify-center px-6 py-24">
            <div className="page-content w-full max-w-lg border border-borde bg-superficie/90 p-8 sm:p-12 text-center shadow-2xl reveal-up">
            {estado === 'verificando' && <><div className="w-16 h-16 mx-auto mb-5 rounded-full border border-borde text-acento-suave flex items-center justify-center"><Icon nombre="citas" size={27} /></div><h1 className="text-texto font-serif text-2xl mb-2">Confirmando tu cita</h1><p className="text-texto-secundario text-sm">Estamos validando tu enlace.</p></>}

            {estado === 'ok' && (
                <>
                    <div className="w-16 h-16 mx-auto rounded-full bg-acento/10 text-acento-suave flex items-center justify-center mb-5"><Icon nombre="check" size={28} /></div>
                    <h1 className="text-texto font-serif text-2xl mb-3">Cita confirmada</h1>
                    <p className="text-texto-secundario text-sm mb-6">{mensaje}</p>
                </>
            )}

            {estado === 'error' && (
                <>
                    <div className="w-16 h-16 mx-auto rounded-full border border-borde text-texto-secundario flex items-center justify-center mb-5"><Icon nombre="cerrarMenu" size={27} /></div><h1 className="text-texto font-serif text-2xl mb-3">No pudimos confirmar tu cita</h1>
                    <p className="text-texto-secundario text-sm mb-6">{mensaje || 'El enlace no es válido o ya expiró.'}</p>
                </>
            )}

            <Link to="/" className="inline-flex items-center gap-2 text-acento-suave text-sm hover:text-texto transition-colors">Volver al inicio <Icon nombre="adelante" size={15} /></Link>
            </div>
        </div>
    )
}