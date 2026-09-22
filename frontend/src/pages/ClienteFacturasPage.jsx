import { useState, useEffect } from 'react'
import { obtenerMisFacturas, descargarFacturaPdf } from '../services/facturaService.js'
import { descargarBlob } from '../utils/descargarArchivo.js'
import { ClienteTabs } from '../components/ClienteTabs.jsx'
import { Icon } from '../components/ui/Icon.jsx'

export const ClienteFacturasPage = () => {
    const [facturas, setFacturas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const cargar = async () => {
            try {
                const data = await obtenerMisFacturas()
                setFacturas(data.facturas)
            } catch (err) {
                setError(err.message || 'No fue posible cargar tus facturas.')
            } finally {
                setCargando(false)
            }
        }
        const timer = setTimeout(cargar, 0)
        return () => clearTimeout(timer)
    }, [])

    const verPdf = async (id, numero) => {
        try {
            const blob = await descargarFacturaPdf(id)
            descargarBlob(blob, `factura_${numero}.pdf`, true)
        } catch (err) {
            alert(err.message)
        }
    }

    return (
        <div className="page-shell min-h-screen pt-28 pb-20 px-6">
            <div className="page-content max-w-3xl mx-auto">
                <p className="eyebrow mb-3">Área personal</p>
                <h1 className="editorial-title text-texto text-4xl sm:text-5xl mb-3">Mis facturas</h1>
                <p className="text-texto-secundario text-sm mb-8">Consulta y descarga tus documentos de compra.</p>
                <ClienteTabs />

                {cargando ? (
                    <p className="text-texto-secundario text-sm">Cargando facturas...</p>
                ) : error ? (
                    <p className="border border-borde bg-superficie p-5 text-texto-secundario text-sm">{error}</p>
                ) : facturas.length === 0 ? (
                    <div className="border border-borde bg-superficie p-8 text-center"><div className="w-14 h-14 mx-auto mb-4 rounded-full border border-borde text-texto-secundario flex items-center justify-center"><Icon nombre="buscar" size={24} /></div><h2 className="text-texto font-serif text-xl mb-2">Aún no tienes facturas</h2><p className="text-texto-secundario text-sm">Tus facturas aparecerán cuando el administrador las genere.</p></div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {facturas.map((f) => (
                            <div key={f.id_factura} className="border border-borde bg-superficie p-5 flex items-center justify-between gap-4 hover:border-acento/60 transition-colors">
                                <div>
                                    <p className="text-acento-suave text-[10px] font-bold tracking-[0.18em] uppercase mb-2">Documento de compra</p>
                                    <p className="text-texto font-serif text-xl">{f.numero_factura}</p>
                                    <p className="text-texto-secundario text-sm mt-1">${f.total.toLocaleString('es-CO')} · {new Date(f.fecha_generacion).toLocaleDateString('es-CO')}</p>
                                </div>
                                <button onClick={() => verPdf(f.id_factura, f.numero_factura)} className="inline-flex items-center gap-2 text-acento-suave text-sm hover:text-texto transition-colors cursor-pointer">
                                    <Icon nombre="buscar" size={16} /> Ver PDF
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}