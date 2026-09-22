import { useEffect, useState } from 'react'
import { PerfilForm } from '../components/PerfilForm.jsx'
import { ClienteTabs } from '../components/ClienteTabs.jsx'
import { obtenerResumenCliente } from '../services/dashboardService.js'

const CardIndicador = ({ titulo, valor, prefijo = '' }) => (
    <div className="kpi-card">
        <p className="text-texto-secundario text-[10px] font-bold tracking-[0.16em] uppercase mb-2">{titulo}</p>
        <p className="text-texto text-2xl font-serif leading-none">{prefijo}{valor}</p>
    </div>
)

export const ClientePanel = () => {
    const [resumen, setResumen] = useState(null)

    useEffect(() => {
        obtenerResumenCliente().then((datos) => setResumen(datos.cards))
    }, [])

    return (
        <div className="bg-fondo min-h-screen pt-28 pb-20 px-6">
            <div className="max-w-xl mx-auto">
                <h1 className="text-texto font-serif text-3xl mb-2">Mi Cuenta</h1>
                <p className="text-texto-secundario text-sm mb-6">Actualiza tu información personal cuando lo necesites.</p>
                <ClienteTabs />
                {resumen && (
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <CardIndicador titulo="Compras realizadas" valor={resumen.total_compras} />
                        <CardIndicador titulo="Total gastado" valor={resumen.total_gastado.toLocaleString('es-CO')} prefijo="$" />
                        <CardIndicador titulo="Citas próximas" valor={resumen.citas_proximas} />
                        <CardIndicador titulo="PQR activas" valor={resumen.pqr_activas} />
                    </div>
                )}
                <PerfilForm />
            </div>
        </div>
    )
}
