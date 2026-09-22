import { Link, useLocation } from 'react-router-dom'

export const ClienteTabs = () => {
    const location = useLocation()
    const tabs = [
        { to: '/cliente', texto: 'Mi Cuenta' },
        { to: '/cliente/citas', texto: 'Mis Citas' },
        { to: '/cliente/compras', texto: 'Mis Compras' },
        { to: '/cliente/facturas', texto: 'Mis Facturas' },
        { to: '/cliente/pqr', texto: 'PQR' },
    ]

    return (
        <div className="flex flex-wrap gap-x-1 mb-8 border-b border-borde">
            {tabs.map((t) => (
                <Link
                    key={t.to}
                    to={t.to}
                    className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                        location.pathname === t.to
                            ? 'text-acento-suave border-acento'
                            : 'text-texto-secundario border-transparent hover:text-texto hover:border-borde'
                    }`}
                >
                    {t.texto}
                </Link>
            ))}
        </div>
    )
}