import { useEffect, useState } from 'react'
import { PerfilForm } from '../components/PerfilForm.jsx'
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
        <div className="max-w-3xl">
            <div className="reveal-up">
                <p className="eyebrow mb-3">Área personal</p>
                <h1 className="editorial-title text-texto text-4xl sm:text-5xl mb-3">Mi cuenta</h1>
                <p className="text-texto-secundario text-sm mb-8">Actualiza tu información personal cuando lo necesites.</p>
            </div>
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
    )
}
