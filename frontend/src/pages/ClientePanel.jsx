import { PerfilForm } from '../components/PerfilForm.jsx'

export const ClientePanel = () => {
    return (
        <div className="bg-fondo min-h-screen pt-28 pb-20 px-6">
            <div className="max-w-xl mx-auto">
                <h1 className="text-texto font-serif text-3xl mb-2">Mi Cuenta</h1>
                <p className="text-texto-secundario text-sm mb-8">Actualiza tu información personal cuando lo necesites.</p>
                <PerfilForm />
            </div>
        </div>
    )
}