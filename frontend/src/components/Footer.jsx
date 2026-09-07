import { Link } from 'react-router-dom'

export const Footer = () => {
    return (
        <footer className="bg-fondo border-t border-borde">
            <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
                <div className="flex flex-col items-center md:items-start">
                    <div className="flex items-center gap-2 mb-3">
                        <svg width="24" height="24" viewBox="0 0 60 60">
                            <path
                                d="M 10 15 L 50 15 M 30 15 L 30 45 L 15 55"
                                fill="none"
                                stroke="#F5F5F4"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <circle cx="15" cy="55" r="3" fill="#B91C1C" />
                        </svg>
                        <Link to="/">
                            <span className="text-texto font-serif text-lg tracking-wide">
                                TRAZO OSCURO
                            </span>
                        </Link>
                    </div>
                    <p className="text-texto-secundario text-sm leading-relaxed max-w-xs">
                        Estudio de tatuaje dedicado al arte, la precisión y la piel como lienzo.
                    </p>
                </div>
                <div>
                    <h3 className="text-texto font-medium mb-4">Enlaces</h3>
                    <ul className="flex flex-col gap-2">
                        <li>
                            <Link to="/" className="text-texto-secundario hover:text-acento transition-colors text-sm">
                                Inicio
                            </Link>
                        </li>
                        <li>
                            <Link to="/productos" className="text-texto-secundario hover:text-acento transition-colors text-sm">
                                Productos
                            </Link>
                        </li>
                        <li>
                            <Link to="/servicios" className="text-texto-secundario hover:text-acento transition-colors text-sm">
                                Servicios
                            </Link>
                        </li>
                        <li>
                            <Link to="/quienes-somos" className="text-texto-secundario hover:text-acento transition-colors text-sm">
                                ¿Quiénes Somos?
                            </Link>
                        </li>
                        <li>
                            <Link to="/reservas" className="text-texto-secundario hover:text-acento transition-colors text-sm">
                                Reservas
                            </Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-texto font-medium mb-4">Síguenos</h3>
                    <ul className="flex flex-col gap-2">
                        <li>
                            <a href="#" className="text-texto-secundario hover:text-acento transition-colors text-sm">
                                Instagram
                            </a>
                        </li>
                        <li>
                            <a href="#" className="text-texto-secundario hover:text-acento transition-colors text-sm">
                                Facebook
                            </a>
                        </li>
                        <li>
                            <a href="#" className="text-texto-secundario hover:text-acento transition-colors text-sm">
                                TikTok
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-borde">
                <p className="text-texto-secundario text-xs text-center py-4">
                    © 2026 Trazo Oscuro. Todos los derechos reservados.
                </p>
            </div>
        </footer>
    )
}