import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { UserMenu } from './UserMenu.jsx'
import { CartDrawer } from './CartDrawer.jsx'
import { Icon } from './ui/Icon.jsx'

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
            <header className={`fixed top-0 left-0 w-full z-50 border-b transition-all duration-300 ${scrolled ? 'bg-fondo/90 border-borde/70 backdrop-blur-md' : 'bg-fondo border-transparent'}`}>
                <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
                    <Link to="/" onClick={() => setMenuAbierto(false)} className="transition-opacity hover:opacity-75">
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

                    <nav className="hidden md:flex items-center gap-1 lg:gap-2">
                        {enlaces.map((enlace) => (
                            <Link key={enlace.to} to={enlace.to} className="group relative text-texto-secundario text-sm lg:text-base px-3 py-2 whitespace-nowrap hover:text-texto transition-colors duration-300">
                                {enlace.texto}
                                <span className="absolute bottom-0 left-3 right-3 h-px origin-left scale-x-0 bg-acento transition-transform duration-300 group-hover:scale-x-100" />
                            </Link>
                        ))}
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <button
                            onClick={() => setCarritoAbierto(true)}
                            className="relative text-texto hover:text-acento transition-colors cursor-pointer"
                            aria-label="Abrir carrito"
                        >
                            <Icon nombre="carrito" size={22} />
                            {cantidadTotal > 0 && (
                                <span className="absolute -top-2 -right-2 bg-acento text-texto text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                    {cantidadTotal}
                                </span>
                            )}
                        </button>

                        {usuario ? (
                            <UserMenu variant="desktop" />
                        ) : (
                            <Link to="/login" className="text-texto text-sm lg:text-base px-4 py-2 border border-borde rounded-full whitespace-nowrap hover:border-acento hover:text-acento transition-colors duration-300">
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
                            <Icon nombre="carrito" size={22} />
                            {cantidadTotal > 0 && (
                                <span className="absolute -top-2 -right-2 bg-acento text-texto text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                    {cantidadTotal}
                                </span>
                            )}
                        </button>

                        <button onClick={() => setMenuAbierto(!menuAbierto)} className="text-texto w-9 h-9 flex items-center justify-center cursor-pointer" aria-label="Abrir menú">
                            <Icon nombre={menuAbierto ? 'cerrarMenu' : 'menu'} size={24} />
                        </button>
                    </div>
                </div>

                <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuAbierto ? 'max-h-600px' : 'max-h-0'}`}>
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