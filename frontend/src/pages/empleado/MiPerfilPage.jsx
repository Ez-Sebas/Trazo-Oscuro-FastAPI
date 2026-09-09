import { PerfilForm } from '../../components/PerfilForm.jsx'

export const MiPerfilPage = () => (
    <div className="max-w-xl">
        <h1 className="text-texto font-serif text-2xl mb-2">Mi Perfil</h1>
        <p className="text-texto-secundario text-sm mb-6">Actualiza tu información personal.</p>
        <PerfilForm />
    </div>
)