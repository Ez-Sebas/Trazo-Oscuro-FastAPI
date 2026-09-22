import { PerfilForm } from '../../components/PerfilForm.jsx'

export const MiPerfilPage = () => (
    <div className="max-w-3xl">
        <span className="eyebrow">Configuración de cuenta</span>
        <h1 className="editorial-title text-texto text-4xl sm:text-5xl mt-4 mb-3">Mi perfil</h1>
        <p className="text-texto-secundario text-sm sm:text-base mb-8">Administra tu información personal y los datos con los que el estudio se comunica contigo.</p>
        <PerfilForm />
    </div>
)