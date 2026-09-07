import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export const ProtectedRoute = ({ children, rolesPermitidos }) => {
    const { usuario, cargando } = useAuth()

    if (cargando) return <div className="min-h-screen bg-fondo" />
    if (!usuario) return <Navigate to="/login" replace />
    if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
        return <Navigate to="/" replace />
    }

    return children
}