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
import { RestablecerPassword } from './pages/RestablecerPassword.jsx'
import { ClientePanel } from './pages/ClientePanel.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'

import { UsuariosPage } from './pages/admin/UsuariosPage.jsx'
import { ProductosPage as AdminProductosPage } from './pages/admin/ProductosPage.jsx'
import { ServiciosPage as AdminServiciosPage } from './pages/admin/ServiciosPage.jsx'
import { CitasPage } from './pages/admin/CitasPage.jsx'
import { VentasPage } from './pages/admin/VentasPage.jsx'
import { FacturasPage } from './pages/admin/FacturasPage.jsx'
import { ReportesPage } from './pages/admin/ReportesPage.jsx'
import { MiPerfilAdmin } from './pages/admin/MiPerfilAdmin.jsx'
import { DashboardPage as AdminDashboardPage } from './pages/admin/DashboardPage.jsx'
import { PQRPage as AdminPQRPage } from './pages/admin/PQRPage.jsx'

import { MisCitasPage } from './pages/empleado/MisCitasPage.jsx'
import { ServiciosPage as EmpleadoServiciosPage } from './pages/empleado/ServiciosPage.jsx'
import { ProductosPage as EmpleadoProductosPage } from './pages/empleado/ProductosPage.jsx'
import { MiPerfilPage } from './pages/empleado/MiPerfilPage.jsx'
import { DashboardPage as EmpleadoDashboardPage } from './pages/empleado/DashboardPage.jsx'

import { CheckoutExito } from './pages/CheckoutExito.jsx'
import { CheckoutCancelado } from './pages/CheckoutCancelado.jsx'

import { ConfirmarCita } from './pages/ConfirmarCita.jsx'
import { ClienteCitasPage } from './pages/ClienteCitasPage.jsx'
import { ClienteComprasPage } from './pages/ClienteComprasPage.jsx'
import { ClienteFacturasPage } from './pages/ClienteFacturasPage.jsx'
import { ClientePQRPage } from './pages/ClientePQRPage.jsx'

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
                <Route path="/citas/confirmar" element={<ConfirmarCita />} />
                <Route
                    path="/cliente/citas"
                    element={
                        <ProtectedRoute rolesPermitidos={['Administrador', 'Empleado', 'Cliente']}>
                            <ClienteCitasPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/cliente/compras"
                    element={
                        <ProtectedRoute rolesPermitidos={['Administrador', 'Empleado', 'Cliente']}>
                            <ClienteComprasPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/cliente/facturas"
                    element={
                        <ProtectedRoute rolesPermitidos={['Administrador', 'Empleado', 'Cliente']}>
                            <ClienteFacturasPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/cliente/pqr"
                    element={
                        <ProtectedRoute rolesPermitidos={['Administrador', 'Empleado', 'Cliente']}>
                            <ClientePQRPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="/checkout/exito" element={<CheckoutExito />} />
                <Route path="/checkout/cancelado" element={<CheckoutCancelado />} />
            </Route>

            <Route
                element={
                    <ProtectedRoute rolesPermitidos={['Administrador']}>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/usuarios" element={<UsuariosPage />} />
                <Route path="/admin/productos" element={<AdminProductosPage />} />
                <Route path="/admin/servicios" element={<AdminServiciosPage />} />
                <Route path="/admin/citas" element={<CitasPage />} />
                <Route path="/admin/ventas" element={<VentasPage />} />
                <Route path="/admin/facturas" element={<FacturasPage />} />
                <Route path="/admin/reportes" element={<ReportesPage />} />
                <Route path="/admin/pqr" element={<AdminPQRPage />} />
                <Route path="/admin/perfil" element={<MiPerfilAdmin />} />
            </Route>

            <Route
                element={
                    <ProtectedRoute rolesPermitidos={['Administrador', 'Empleado']}>
                        <EmpleadoLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/empleado" element={<EmpleadoDashboardPage />} />
                <Route path="/empleado/citas" element={<MisCitasPage />} />
                <Route path="/empleado/servicios" element={<EmpleadoServiciosPage />} />
                <Route path="/empleado/productos" element={<EmpleadoProductosPage />} />
                <Route path="/empleado/perfil" element={<MiPerfilPage />} />
            </Route>

            <Route path="/login" element={<Login />} />
            <Route path="/restablecer-password" element={<RestablecerPassword />} />
        </Routes>
    )
}

export default App
