import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { UserMenu } from './UserMenu.jsx'
import { CartDrawer } from './CartDrawer.jsx'

export const Header = () => {
    const [scrolled, setScrolled] = useState(false)
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [carritoAbierto, setCarritoAbierto] = useState(false)
    const { usuario } = useAuth()
    const { cantidadTotal } = useCart()

    useEffect(() => {
        const manejarScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', manejarScroll)
        return () => window.removeEventListener('scroll', manejarScroll)
    }, [])

    const enlaces = [
        { to: '/', texto: 'Inicio' },
        { to: '/productos', texto: 'Productos' },
        { to: '/servicios', texto: 'Servicios' },
        { to: '/quienes-somos', texto: '¿Quiénes Somos?' },
        { to: '/reservas', texto: 'Reservas' },
    ]

    return (
        <>
            <header className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 ${scrolled ? 'bg-fondo/80 backdrop-blur-sm' : 'bg-fondo'}`}>
                <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
                    <Link to="/" onClick={() => setMenuAbierto(false)}>
                        <div className="flex items-center">
                            <svg className="w-36 h-auto sm:w-44 md:w-52 lg:w-220px" viewBox="0 0 220 60" xmlns="http://www.w3.org/2000/svg" aria-label="Trazo Oscuro">
                                <g transform="translate(22, -4)">
                                    <path d="M 8 12 H 55" stroke="#1A1A1A" strokeWidth="10" strokeLinecap="round"/>
                                    <path d="M 8 12 H 55 M 31 12 V 38 L 20 50" fill="none" className="stroke-texto" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <circle cx="20" cy="50" r="4" className="fill-acento"/>
                                </g>
                                <text x="62" y="29" className="fill-texto" fontFamily="Georgia, serif" fontSize="20" fontWeight="600" letterSpacing="2">RAZO</text>
                                <text x="62" y="49" className="fill-texto-secundario" fontFamily="Georgia, serif" fontSize="15" letterSpacing="3">OSCURO</text>
                            </svg>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-4 lg:gap-8">
                        {enlaces.map((enlace) => (
                            <Link key={enlace.to} to={enlace.to} className="text-texto text-sm lg:text-base px-2 py-2 rounded-lg whitespace-nowrap hover:bg-fondo hover:shadow-[0_4px_8px] hover:text-acento transition-all duration-300">
                                {enlace.texto}
                            </Link>
                        ))}
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <button
                            onClick={() => setCarritoAbierto(true)}
                            className="relative text-texto hover:text-acento transition-colors cursor-pointer"
                            aria-label="Abrir carrito"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <path d="M3 3h2l2.4 12.4a2 2 0 002 1.6h8.4a2 2 0 002-1.6L21 8H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="9" cy="20" r="1.4" fill="currentColor" />
                                <circle cx="17" cy="20" r="1.4" fill="currentColor" />
                            </svg>
                            {cantidadTotal > 0 && (
                                <span className="absolute -top-2 -right-2 bg-acento text-texto text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                    {cantidadTotal}
                                </span>
                            )}
                        </button>

                        {usuario ? (
                            <UserMenu variant="desktop" />
                        ) : (
                            <Link to="/login" className="text-texto text-sm lg:text-base px-2 py-2 rounded-lg whitespace-nowrap hover:bg-fondo hover:shadow-[0_4px_8px] hover:text-acento transition-all duration-300">
                                Iniciar sesión
                            </Link>
                        )}
                    </div>

                    <div className="md:hidden flex items-center gap-4">
                        <button
                            onClick={() => setCarritoAbierto(true)}
                            className="relative text-texto"
                            aria-label="Abrir carrito"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <path d="M3 3h2l2.4 12.4a2 2 0 002 1.6h8.4a2 2 0 002-1.6L21 8H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="9" cy="20" r="1.4" fill="currentColor" />
                                <circle cx="17" cy="20" r="1.4" fill="currentColor" />
                            </svg>
                            {cantidadTotal > 0 && (
                                <span className="absolute -top-2 -right-2 bg-acento text-texto text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                    {cantidadTotal}
                                </span>
                            )}
                        </button>

                        <button onClick={() => setMenuAbierto(!menuAbierto)} className="text-texto w-9 h-9 flex items-center justify-center cursor-pointer" aria-label="Abrir menú">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                {menuAbierto ? (
                                    <path d="M 5 5 L 19 19 M 19 5 L 5 19" stroke="#F5F5F4" strokeWidth="2" strokeLinecap="round" />
                                ) : (
                                    <path d="M 4 6 L 20 6 M 4 12 L 20 12 M 4 18 L 20 18" stroke="#F5F5F4" strokeWidth="2" strokeLinecap="round" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuAbierto ? 'max-h-96' : 'max-h-0'}`}>
                    <nav className="flex flex-col px-6 pb-4 gap-1 bg-fondo border-t border-borde">
                        {enlaces.map((enlace) => (
                            <Link key={enlace.to} to={enlace.to} onClick={() => setMenuAbierto(false)} className="text-texto text-sm px-2 py-3 rounded-lg hover:text-acento transition-colors">
                                {enlace.texto}
                            </Link>
                        ))}
                        {usuario ? (
                            <UserMenu variant="mobile" onNavigate={() => setMenuAbierto(false)} />
                        ) : (
                            <Link to="/login" onClick={() => setMenuAbierto(false)} className="text-acento text-sm px-2 py-3 rounded-lg font-medium">
                                Iniciar sesión
                            </Link>
                        )}
                    </nav>
                </div>
            </header>

            <CartDrawer abierto={carritoAbierto} onCerrar={() => setCarritoAbierto(false)} />
        </>
    )
}