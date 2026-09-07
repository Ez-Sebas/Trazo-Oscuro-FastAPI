import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { obtenerServiciosActivos } from '../services/servicioService.js'

export const Servicios = () => {
    const [servicios, setServicios] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        obtenerServiciosActivos()
            .then((data) => setServicios(data.servicios))
            .finally(() => setCargando(false))
    }, [])

    return (
        <div className="bg-fondo min-h-screen pt-28 pb-20 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-texto font-serif text-4xl mb-3">Servicios</h1>
                    <p className="text-texto-secundario">Estilos de tatuaje disponibles en Trazo Oscuro</p>
                </div>

                {cargando && <p className="text-texto-secundario text-center">Cargando servicios...</p>}

                {!cargando && servicios.length === 0 && (
                    <p className="text-texto-secundario text-center">No hay servicios disponibles por el momento.</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {servicios.map((s) => (
                        <div key={s.id_servicio} className="bg-superficie rounded-lg overflow-hidden flex flex-col">
                            <div className="h-48 bg-fondo">
                                {s.imagen_url ? (
                                    <img src={s.imagen_url} alt={s.nombre} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-texto-secundario text-sm">Sin imagen</div>
                                )}
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                                <h3 className="text-texto font-serif text-lg mb-2">{s.nombre}</h3>
                                <p className="text-texto-secundario text-sm mb-3 flex-1">{s.descripcion}</p>
                                <p className="text-acento font-medium">${Number(s.precio).toLocaleString('es-CO')}</p>
                                <p className="text-texto-secundario text-xs mb-4">{s.duracion_estimada}</p>
                                <Link
                                    to={`/reservas?servicio=${s.id_servicio}`}
                                    className="bg-acento text-texto text-sm text-center px-4 py-2 rounded-md hover:bg-red-800 transition-colors"
                                >
                                    Reservar
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}