import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { Icon } from '../ui/Icon.jsx'

const enlacesCliente = [
    { to: '/cliente', texto: 'Mi cuenta', icono: 'perfil' },
    { to: '/cliente/citas', texto: 'Mis citas', icono: 'citas' },
    { to: '/cliente/compras', texto: 'Mis compras', icono: 'carrito' },
    { to: '/cliente/facturas', texto: 'Mis facturas', icono: 'facturas' },
    { to: '/cliente/pqr', texto: 'PQR', icono: 'pqr' },
]

const Marca = ({ compacta = false }) => (
    <>
        <svg width={compacta ? '20' : '28'} height={compacta ? '20' : '28'} viewBox="0 0 60 60" aria-hidden="true">
            <path d="M 10 15 L 50 15 M 30 15 L 30 45 L 15 55" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="15" cy="55" r="3" fill="#B91C1C" />
        </svg>
        <span className={`text-texto font-serif tracking-wide ${compacta ? 'text-sm' : 'text-lg'}`}>TRAZO OSCURO</span>
    </>
)

const NavegacionCliente = ({ rutaActual, movil = false, onClose }) => (
    <nav className={`flex-1 py-3 flex flex-col gap-1 px-4 ${movil ? 'overflow-y-auto' : ''}`}>
        {enlacesCliente.map((enlace) => (
            <Link
                key={enlace.to}
                to={enlace.to}
                onClick={movil ? onClose : undefined}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
                    rutaActual === enlace.to
                        ? 'bg-acento/15 text-acento'
                        : 'text-texto-secundario hover:bg-fondo hover:text-texto'
                }`}
            >
                <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-fondo/70"><Icon nombre={enlace.icono} size={17} /></span>
                {enlace.texto}
            </Link>
        ))}
    </nav>
)

const DatosUsuarioCliente = ({ usuario, onSalir }) => (
    <div className="px-5 py-5 border-t border-borde">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-acento/15 text-acento-suave flex items-center justify-center"><Icon nombre="perfil" size={18} /></div>
            <div>
                <p className="text-texto text-sm">{usuario?.nombres} {usuario?.apellidos}</p>
                <p className="text-texto-secundario text-xs mt-0.5">Cliente</p>
            </div>
        </div>
        <button onClick={onSalir} className="w-full flex items-center justify-center gap-2 border border-borde rounded-lg text-texto-secundario text-xs py-2.5 hover:border-acento hover:text-acento transition-colors cursor-pointer">
            <Icon nombre="cerrar" size={15} /> Cerrar sesión
        </button>
    </div>
)

export const ClienteLayout = () => {
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
            <aside className="panel-scrollbar hidden lg:flex w-72 bg-superficie border-r border-borde flex-col fixed inset-y-0 overflow-y-auto z-40">
                <Link to="/" className="flex items-center gap-2 px-7 py-6 border-b border-borde hover:bg-fondo transition-colors"><Marca /></Link>
                <div className="px-7 pt-7 pb-3">
                    <p className="text-acento-suave text-[10px] font-bold tracking-[0.2em] uppercase">Área personal</p>
                    <p className="text-texto-secundario text-xs mt-2">Gestiona tu cuenta y reservas</p>
                </div>
                <NavegacionCliente rutaActual={location.pathname} />
                <DatosUsuarioCliente usuario={usuario} onSalir={salir} />
            </aside>

            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-superficie/95 border-b border-borde backdrop-blur-md px-4 py-3">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2"><Marca compacta /></Link>
                    <button onClick={() => setMenuAbierto(!menuAbierto)} className="text-texto w-9 h-9 flex items-center justify-center cursor-pointer" aria-label="Abrir menú">
                        <Icon nombre={menuAbierto ? 'cerrarMenu' : 'menu'} size={24} />
                    </button>
                </div>
            </div>

            {menuAbierto && <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={cerrarMenu} />}

            <aside className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-superficie border-r border-borde z-50 flex flex-col transition-transform duration-300 ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between px-5 py-5 border-b border-borde">
                    <Link to="/" onClick={cerrarMenu} className="flex items-center gap-2"><Marca compacta /></Link>
                    <button onClick={cerrarMenu} className="text-texto-secundario w-8 h-8 flex items-center justify-center cursor-pointer" aria-label="Cerrar menú"><Icon nombre="cerrarMenu" size={20} /></button>
                </div>
                <div className="px-5 pt-5 pb-3">
                    <p className="text-acento-suave text-[10px] font-bold tracking-[0.2em] uppercase">Área personal</p>
                    <p className="text-texto-secundario text-xs mt-2">Gestiona tu cuenta y reservas</p>
                </div>
                <NavegacionCliente rutaActual={location.pathname} movil onClose={cerrarMenu} />
                <DatosUsuarioCliente usuario={usuario} onSalir={salir} />
            </aside>

            <main className="flex-1 ml-0 lg:ml-72 pt-24 lg:pt-14 px-4 pb-8 sm:px-8 sm:pb-10 lg:px-10 lg:pb-12">
                <Outlet />
            </main>
        </div>
    )
}
