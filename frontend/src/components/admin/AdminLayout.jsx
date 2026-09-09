import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const enlacesAdmin = [
    { to: '/admin', texto: 'Usuarios', icono: '👤' },
    { to: '/admin/productos', texto: 'Productos', icono: '📦' },
    { to: '/admin/servicios', texto: 'Servicios', icono: '💈' },
    { to: '/admin/citas', texto: 'Citas', icono: '📅' },
    { to: '/admin/compras', texto: 'Compras', icono: '🛒' },
    { to: '/admin/perfil', texto: 'Mi Perfil', icono: '👤' },
]

export const AdminLayout = () => {
    const { usuario, cerrarSesion } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const salir = () => {
        cerrarSesion()
        navigate('/')
    }

    return (
        <div className="min-h-screen bg-fondo flex">
            <aside className="w-64 bg-superficie border-r border-borde flex flex-col fixed h-screen">
                <Link to="/" className="flex items-center gap-2 px-6 py-6 border-b border-borde">
                    <svg width="28" height="28" viewBox="0 0 60 60">
                        <path d="M 10 15 L 50 15 M 30 15 L 30 45 L 15 55" fill="none" stroke="#F5F5F4" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="15" cy="55" r="3" fill="#B91C1C" />
                    </svg>
                    <span className="text-texto font-serif text-lg tracking-wide">TRAZO OSCURO</span>
                </Link>

                <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
                    {enlacesAdmin.map((enlace) => (
                        <Link
                            key={enlace.to}
                            to={enlace.to}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                location.pathname === enlace.to
                                    ? 'bg-acento/15 text-acento'
                                    : 'text-texto-secundario hover:bg-fondo hover:text-texto'
                            }`}
                        >
                            <span>{enlace.icono}</span>
                            {enlace.texto}
                        </Link>
                    ))}
                </nav>

                <div className="px-6 py-4 border-t border-borde">
                    <p className="text-texto text-sm mb-2">{usuario?.nombres} {usuario?.apellidos}</p>
                    <p className="text-texto-secundario text-xs mb-3">Administrador</p>
                    <button onClick={salir} className="text-acento text-sm hover:underline cursor-pointer">
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            <main className="flex-1 ml-64 p-8">
                <Outlet />
            </main>
        </div>
    )
}