import { useState, useEffect, useCallback } from 'react'
import { obtenerResumenEmpleado } from '../../services/dashboardService.js'
import { CitasDashboard } from '../../components/dashboard/CitasDashboard.jsx'

const pesos = (valor) => `$${Number(valor || 0).toLocaleString('es-CO')}`

const CardIndicador = ({ titulo, valor, detalle }) => (
    <div className="kpi-card">
        <p className="text-texto-secundario text-[10px] font-bold tracking-[0.16em] uppercase mb-2">{titulo}</p>
        <p className="text-texto text-2xl font-serif leading-none">{valor}</p>
        {detalle && <p className="text-texto-secundario text-xs mt-2">{detalle}</p>}
    </div>
)

export const DashboardPage = () => {
    const [resumen, setResumen] = useState(null)
    const [error, setError] = useState('')

    // El bloque de citas la reutiliza tras cada cambio para que las tarjetas
    // de arriba reflejen al instante el nuevo estado o cobro.
    const cargarResumen = useCallback(() => {
        obtenerResumenEmpleado()
            .then((d) => setResumen(d.cards))
            .catch((err) => setError(err.message))
    }, [])

    useEffect(() => { cargarResumen() }, [cargarResumen])

    return (
        <div className="max-w-7xl">
            <div className="mb-8">
                <p className="eyebrow mb-3">Área de trabajo</p>
                <h1 className="editorial-title text-texto text-3xl sm:text-4xl mb-3">Mi jornada</h1>
                <p className="text-texto-secundario text-sm">Resumen de tu actividad y compromisos del estudio.</p>
            </div>

            {error && (
                <p role="alert" className="panel border-acento/50 bg-acento/10 text-acento-suave text-sm p-4 mb-6">{error}</p>
            )}

            {resumen ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <CardIndicador titulo="Citas pendientes" valor={resumen.citas_pendientes} detalle="Esperan confirmación del cliente" />
                    <CardIndicador titulo="Citas confirmadas" valor={resumen.citas_confirmadas} detalle="Listas para atender" />
                    <CardIndicador titulo="Citas realizadas" valor={resumen.citas_realizadas} />
                    <CardIndicador titulo="Citas por cobrar" valor={resumen.citas_por_cobrar} detalle="Pago pendiente en el estudio" />
                    <CardIndicador titulo="Cobrado en citas" valor={pesos(resumen.cobrado_en_citas)} />
                </div>
            ) : (
                !error && <p className="text-texto-secundario text-sm">Cargando...</p>
            )}

            {/* Gestión de las citas asignadas: el backend limita el alcance
                a las citas de este empleado. */}
            <CitasDashboard onCambio={cargarResumen} />
        </div>
    )
}
