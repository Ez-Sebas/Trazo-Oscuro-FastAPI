import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Icon } from './ui/Icon.jsx'

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
            <div className="border-t border-borde mt-1 pt-2">
                <button
                    onClick={() => setAbierto(!abierto)}
                    className="w-full flex items-center justify-between text-texto text-sm px-3 py-2.5 rounded-lg hover:bg-fondo hover:text-acento transition-colors cursor-pointer"
                >
                    <span className="flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-acento/15 text-acento-suave flex items-center justify-center"><Icon nombre="perfil" size={15} /></span>{usuario.nombres}</span>
                    <Icon nombre="adelante" size={15} className={`transition-transform ${abierto ? 'rotate-90' : ''}`} />
                </button>
                {abierto && (
                    <div className="flex flex-col gap-1 mt-1 mb-2 ml-3 pl-3 border-l border-borde">
                        <button onClick={irAlPanel} className="flex items-center gap-2 text-texto-secundario text-sm px-3 py-2.5 text-left rounded-md hover:bg-fondo hover:text-acento cursor-pointer">
                            <Icon nombre="perfil" size={15} /> Mi panel
                        </button>
                        <button onClick={salir} className="flex items-center gap-2 text-acento-suave text-sm px-3 py-2.5 text-left rounded-md hover:bg-acento/10 cursor-pointer">
                            <Icon nombre="cerrar" size={15} /> Cerrar sesión
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
                <Icon nombre="adelante" size={15} className={`transition-transform ${abierto ? 'rotate-90' : ''}`} />
            </button>

            {abierto && (
                <div className="absolute right-0 top-full mt-2 min-w-44 bg-superficie border border-borde rounded-lg shadow-lg z-50">
                    <button
                        onClick={irAlPanel}
                        className="w-full text-left text-texto text-sm px-4 py-3 hover:bg-fondo hover:text-acento transition-colors cursor-pointer whitespace-nowrap"
                    >
                        Mi panel
                    </button>
                    <button
                        onClick={salir}
                        className="w-full text-left text-acento text-sm px-4 py-3 hover:bg-fondo transition-colors cursor-pointer border-t border-borde whitespace-nowrap"
                    >
                        Cerrar sesión
                    </button>
                </div>
            )}
        </div>
    )
}
