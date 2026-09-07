import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export const UserMenu = ({ variant = 'desktop', onNavigate }) => {
    const [abierto, setAbierto] = useState(false)
    const { usuario, cerrarSesion } = useAuth()
    const navigate = useNavigate()
    const contenedorRef = useRef(null)

    useEffect(() => {
        const cerrarSiEsAfuera = (e) => {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
                setAbierto(false)
            }
        }
        document.addEventListener('mousedown', cerrarSiEsAfuera)
        return () => document.removeEventListener('mousedown', cerrarSiEsAfuera)
    }, [])

    const rutaPanel = () => {
        if (usuario.rol === 'Administrador') return '/admin'
        if (usuario.rol === 'Empleado') return '/empleado'
        return '/cliente'
    }

    const irAlPanel = () => {
        setAbierto(false)
        onNavigate?.()
        navigate(rutaPanel())
    }

    const salir = () => {
        setAbierto(false)
        onNavigate?.()
        cerrarSesion()
        navigate('/')
    }

    if (!usuario) return null

    if (variant === 'mobile') {
        return (
            <div>
                <button
                    onClick={() => setAbierto(!abierto)}
                    className="w-full flex items-center justify-between text-texto text-sm px-2 py-3 rounded-lg hover:text-acento transition-colors cursor-pointer"
                >
                    {usuario.nombres}
                    <span className={`transition-transform ${abierto ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {abierto && (
                    <div className="flex flex-col pl-4 gap-1 mb-1">
                        <button onClick={irAlPanel} className="text-texto-secundario text-sm px-2 py-2 text-left hover:text-acento cursor-pointer">
                            Mi panel
                        </button>
                        <button onClick={salir} className="text-acento text-sm px-2 py-2 text-left font-medium cursor-pointer">
                            Cerrar sesión
                        </button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="relative" ref={contenedorRef}>
            <button
                onClick={() => setAbierto(!abierto)}
                className="text-texto text-sm px-3 py-2 rounded-lg hover:text-acento transition-colors cursor-pointer flex items-center gap-1"
            >
                {usuario.nombres}
                <span className={`text-xs transition-transform ${abierto ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {abierto && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-superficie border border-borde rounded-lg shadow-lg overflow-hidden z-50">
                    <button
                        onClick={irAlPanel}
                        className="w-full text-left text-texto text-sm px-4 py-3 hover:bg-fondo hover:text-acento transition-colors cursor-pointer"
                    >
                        Mi panel
                    </button>
                    <button
                        onClick={salir}
                        className="w-full text-left text-acento text-sm px-4 py-3 hover:bg-fondo transition-colors cursor-pointer border-t border-borde"
                    >
                        Cerrar sesión
                    </button>
                </div>
            )}
        </div>
    )
}