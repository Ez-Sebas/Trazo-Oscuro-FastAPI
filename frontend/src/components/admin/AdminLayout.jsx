import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { Icon } from '../ui/Icon.jsx'

const enlacesAdmin = [
    { to: '/admin', texto: 'Inicio', icono: 'inicio' },
    { to: '/admin/usuarios', texto: 'Usuarios', icono: 'usuarios' },
    { to: '/admin/productos', texto: 'Productos', icono: 'productos' },
    { to: '/admin/servicios', texto: 'Servicios', icono: 'servicios' },
    { to: '/admin/citas', texto: 'Citas', icono: 'citas' },
    { to: '/admin/ventas', texto: 'Ventas', icono: 'ventas' },
    { to: '/admin/facturas', texto: 'Facturas', icono: 'facturas' },
    { to: '/admin/reportes', texto: 'Reportes', icono: 'reportes' },
    { to: '/admin/pqr', texto: 'PQR', icono: 'pqr' },
    { to: '/admin/perfil', texto: 'Mi Perfil', icono: 'perfil' },
]

export const AdminLayout = () => {
    const { usuario, cerrarSesion } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [menuAbierto, setMenuAbierto] = useState(false)

    const salir = () => {
        setMenuAbierto(false)
        cerrarSesion()
        navigate('/')
    }

    const cerrarMenu = () => setMenuAbierto(false)

    return (
        <div className="min-h-screen bg-fondo flex">
            {/* Sidebar fijo en lg+ */}
            <aside className="panel-scrollbar hidden lg:flex w-72 bg-superficie border-r border-borde flex-col fixed inset-y-0 overflow-y-auto z-40">
                <Link to="/" className="flex items-center gap-2 px-7 py-6 border-b border-borde hover:bg-fondo transition-colors">
                    <svg width="28" height="28" viewBox="0 0 60 60">
                        <path d="M 10 15 L 50 15 M 30 15 L 30 45 L 15 55" fill="none" stroke="#F5F5F4" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="15" cy="55" r="3" fill="#B91C1C" />
                    </svg>
                    <span className="text-texto font-serif text-lg tracking-wide">TRAZO OSCURO</span>
                </Link>

                <div className="px-7 pt-7 pb-3"><p className="text-acento-suave text-[10px] font-bold tracking-[0.2em] uppercase">Panel de control</p><p className="text-texto-secundario text-xs mt-2">Administración del estudio</p></div>
                <nav className="flex-1 py-3 flex flex-col gap-1 px-4">
                    {enlacesAdmin.map((enlace) => (
                        <Link
                            key={enlace.to}
                            to={enlace.to}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
                                location.pathname === enlace.to
                                    ? 'bg-acento/15 text-acento'
                                    : 'text-texto-secundario hover:bg-fondo hover:text-texto'
                            }`}
                        >
                            <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-fondo/70"><Icon nombre={enlace.icono} size={17} /></span>
                            {enlace.texto}
                        </Link>
                    ))}
                </nav>

                <div className="px-5 py-5 border-t border-borde">
                    <div className="flex items-center gap-3 mb-4"><div className="w-9 h-9 rounded-full bg-acento/15 text-acento-suave flex items-center justify-center"><Icon nombre="perfil" size={18} /></div><div><p className="text-texto text-sm">{usuario?.nombres} {usuario?.apellidos}</p><p className="text-texto-secundario text-xs mt-0.5">Administrador</p></div></div>
                    <button onClick={salir} className="w-full flex items-center justify-center gap-2 border border-borde rounded-lg text-texto-secundario text-xs py-2.5 hover:border-acento hover:text-acento transition-colors cursor-pointer">
                        <Icon nombre="cerrar" size={15} /> Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Header móvil con hamburguesa (menos de lg) */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-superficie/95 border-b border-borde backdrop-blur-md px-4 py-3">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-texto font-serif tracking-wide text-sm"><svg width="20" height="20" viewBox="0 0 60 60" aria-hidden="true"><path d="M 10 15 L 50 15 M 30 15 L 30 45 L 15 55" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /><circle cx="15" cy="55" r="3" fill="#B91C1C" /></svg>TRAZO OSCURO</Link>
                    <button
                        onClick={() => setMenuAbierto(!menuAbierto)}
                        className="text-texto w-9 h-9 flex items-center justify-center cursor-pointer"
                        aria-label="Abrir menú"
                    >
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

            {/* Overlay oscuro cuando el menú está abierto */}
            {menuAbierto && (
                <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={cerrarMenu} />
            )}

            {/* Panel lateral deslizante en móvil */}
            <aside className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-superficie border-r border-borde z-50 flex flex-col transition-transform duration-300 ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between px-5 py-5 border-b border-borde">
                    <Link to="/" onClick={cerrarMenu} className="flex items-center gap-2">
                        <svg width="24" height="24" viewBox="0 0 60 60">
                            <path d="M 10 15 L 50 15 M 30 15 L 30 45 L 15 55" fill="none" stroke="#F5F5F4" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="15" cy="55" r="3" fill="#B91C1C" />
                        </svg>
                        <span className="text-texto font-serif text-sm tracking-wide">TRAZO OSCURO</span>
                    </Link>
                    <button onClick={cerrarMenu} className="text-texto-secundario w-8 h-8 flex items-center justify-center cursor-pointer" aria-label="Cerrar menú">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M 6 6 L 18 18 M 18 6 L 6 18" stroke="#F5F5F4" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="px-5 pt-5 pb-3"><p className="text-acento-suave text-[10px] font-bold tracking-[0.2em] uppercase">Panel de control</p><p className="text-texto-secundario text-xs mt-2">Administración del estudio</p></div>
                <nav className="flex-1 py-3 flex flex-col gap-1 px-4 overflow-y-auto">
                    {enlacesAdmin.map((enlace) => (
                        <Link
                            key={enlace.to}
                            to={enlace.to}
                            onClick={cerrarMenu}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
                                location.pathname === enlace.to
                                    ? 'bg-acento/15 text-acento'
                                    : 'text-texto-secundario hover:bg-fondo hover:text-texto'
                            }`}
                        >
                            <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-fondo/70"><Icon nombre={enlace.icono} size={17} /></span>
                            {enlace.texto}
                        </Link>
                    ))}
                </nav>

                <div className="px-5 py-5 border-t border-borde">
                    <div className="flex items-center gap-3 mb-4"><div className="w-9 h-9 rounded-full bg-acento/15 text-acento-suave flex items-center justify-center"><Icon nombre="perfil" size={18} /></div><div><p className="text-texto text-sm">{usuario?.nombres} {usuario?.apellidos}</p><p className="text-texto-secundario text-xs mt-0.5">Administrador</p></div></div>
                    <button onClick={salir} className="w-full flex items-center justify-center gap-2 border border-borde rounded-lg text-texto-secundario text-xs py-2.5 hover:border-acento hover:text-acento transition-colors cursor-pointer">
                        <Icon nombre="cerrar" size={15} /> Cerrar sesión
                    </button>
                </div>
            </aside>

            <main className="flex-1 ml-0 lg:ml-72 pt-24 lg:pt-14 px-4 pb-8 sm:px-8 sm:pb-10 lg:px-10 lg:pb-12">
                <Outlet />
            </main>
        </div>
    )
}
