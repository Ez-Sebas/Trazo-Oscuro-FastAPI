import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout.jsx'
import { AdminLayout } from './components/admin/AdminLayout.jsx'
import { EmpleadoLayout } from './components/empleado/EmpleadoLayout.jsx'
import { Index } from './pages/Index.jsx'
import { QuienesSomos } from './pages/QuienesSomos.jsx'
import { Reservas } from './pages/Reservas.jsx'
import { Productos } from './pages/Productos.jsx'
import { Servicios } from './pages/Servicios.jsx'
import { Login } from './pages/Login.jsx'
import { ClientePanel } from './pages/ClientePanel.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'

import { UsuariosPage } from './pages/admin/UsuariosPage.jsx'
import { ProductosPage as AdminProductosPage } from './pages/admin/ProductosPage.jsx'
import { ServiciosPage as AdminServiciosPage } from './pages/admin/ServiciosPage.jsx'
import { CitasPage } from './pages/admin/CitasPage.jsx'
import { ComprasPage } from './pages/admin/ComprasPage.jsx'

import { MisCitasPage } from './pages/empleado/MisCitasPage.jsx'
import { ServiciosPage as EmpleadoServiciosPage } from './pages/empleado/ServiciosPage.jsx'
import { ProductosPage as EmpleadoProductosPage } from './pages/empleado/ProductosPage.jsx'

function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/productos" element={<Productos />} />
                <Route path="/servicios" element={<Servicios />} />
                <Route path="/quienes-somos" element={<QuienesSomos />} />
                <Route path="/reservas" element={<Reservas />} />
                <Route
                    path="/cliente"
                    element={
                        <ProtectedRoute rolesPermitidos={['Administrador', 'Empleado', 'Cliente']}>
                            <ClientePanel />
                        </ProtectedRoute>
                    }
                />
            </Route>

            <Route
                element={
                    <ProtectedRoute rolesPermitidos={['Administrador']}>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/admin" element={<UsuariosPage />} />
                <Route path="/admin/productos" element={<AdminProductosPage />} />
                <Route path="/admin/servicios" element={<AdminServiciosPage />} />
                <Route path="/admin/citas" element={<CitasPage />} />
                <Route path="/admin/compras" element={<ComprasPage />} />
            </Route>

            <Route
                element={
                    <ProtectedRoute rolesPermitidos={['Administrador', 'Empleado']}>
                        <EmpleadoLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/empleado" element={<MisCitasPage />} />
                <Route path="/empleado/servicios" element={<EmpleadoServiciosPage />} />
                <Route path="/empleado/productos" element={<EmpleadoProductosPage />} />
            </Route>

            <Route path="/login" element={<Login />} />
        </Routes>
    )
}

export default App