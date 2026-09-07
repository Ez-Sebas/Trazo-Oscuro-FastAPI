import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Login as LoginForm } from '../components/Login.jsx'
import { RecoverPassword } from '../components/RecoverPassword.jsx'
import { RegisterModal } from '../components/RegisterModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import imagenLogin from '../assets/images/imagen1.jpg'

export const Login = () => {
    const [vista, setVista] = useState('login')
    const [modalAbierto, setModalAbierto] = useState(false)

    const { usuario, cargando } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!cargando && usuario) {
            navigate('/')
        }
    }, [usuario, cargando, navigate])

    if (cargando) {
        return <div className="min-h-screen bg-fondo" />
    }

    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row">

            <div className="hidden md:block md:w-1/2 relative">
                <img src={imagenLogin} alt="Trazo Oscuro" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-fondo/50" />
                <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-10">
                    <Link to="/" className="text-texto font-serif text-base mb-4 inline-block hover:text-acento transition-colors w-fit">
                        ← Volver al inicio
                    </Link>
                    <h1 className="text-texto font-serif text-2xl lg:text-4xl mb-2">
                        Bienvenido de nuevo
                    </h1>
                    <p className="text-texto-secundario text-sm max-w-sm">
                        Accede a tu cuenta para gestionar tus citas y conocer nuestras últimas piezas.
                    </p>
                </div>
            </div>

            <div className="w-full md:w-1/2 min-h-screen md:min-h-0 bg-fondo flex flex-col items-center justify-center px-6 py-10">
                <Link to="/" className="md:hidden flex items-center gap-2 mb-8">
                    <svg width="26" height="26" viewBox="0 0 60 60">
                        <path d="M 10 15 L 50 15 M 30 15 L 30 45 L 15 55" fill="none" stroke="#F5F5F4" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="15" cy="55" r="3" fill="#B91C1C" />
                    </svg>
                    <span className="text-texto font-serif text-lg tracking-wide">TRAZO OSCURO</span>
                </Link>

                <div className="w-full max-w-sm">
                    {vista === 'login' ? (
                        <LoginForm
                            onRecuperar={() => setVista('recuperar')}
                            onRegistro={() => setModalAbierto(true)}
                        />
                    ) : (
                        <RecoverPassword onVolver={() => setVista('login')} />
                    )}
                </div>

                <Link to="/" className="md:hidden text-texto-secundario text-sm mt-8 hover:text-acento transition-colors">
                    ← Volver al inicio
                </Link>
            </div>

            <RegisterModal
                abierto={modalAbierto}
                onCerrar={() => setModalAbierto(false)}
            />

        </div>
    )
}