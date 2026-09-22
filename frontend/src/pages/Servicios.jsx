import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { obtenerServiciosActivos, obtenerCategoriasServicio } from '../services/servicioService.js'
import { ImageBox } from '../components/ui/ImageBox.jsx'
import { Icon } from '../components/ui/Icon.jsx'

export const Servicios = () => {
    const [servicios, setServicios] = useState([])
    const [categorias, setCategorias] = useState([])
    const [cargando, setCargando] = useState(true)

    const [busqueda, setBusqueda] = useState('')
    const [filtroCategoria, setFiltroCategoria] = useState('')
    const [precioMin, setPrecioMin] = useState('')
    const [precioMax, setPrecioMax] = useState('')

    useEffect(() => {
        obtenerCategoriasServicio().then((d) => setCategorias(d.categorias))
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            setCargando(true)
            obtenerServiciosActivos({
                busqueda,
                id_categoria_servicio: filtroCategoria,
                precio_min: precioMin,
                precio_max: precioMax,
            })
                .then((data) => setServicios(data.servicios))
                .finally(() => setCargando(false))
        }, 350)
        return () => clearTimeout(timer)
    }, [busqueda, filtroCategoria, precioMin, precioMax])

    const limpiarFiltros = () => {
        setBusqueda('')
        setFiltroCategoria('')
        setPrecioMin('')
        setPrecioMax('')
    }

    return (
        <div className="page-shell min-h-screen pt-28 pb-24 px-6">
            <div className="page-content max-w-6xl mx-auto">
                <div className="max-w-2xl mb-10 sm:mb-14">
                    <span className="eyebrow">El lenguaje de tu piel</span>
                    <h1 className="editorial-title text-texto text-5xl sm:text-6xl mt-5 mb-4">Diseños pensados para durar.</h1>
                    <p className="text-texto-secundario text-base sm:text-lg">Conoce nuestras técnicas y encuentra la forma adecuada de convertir tu idea en una pieza única.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_auto] gap-3 mb-10 p-4 bg-superficie border border-borde rounded-2xl">
                    <input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar servicio..."
                        className="field"
                    />
                    <select
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                        className="field"
                    >
                        <option value="">Todas las categorías</option>
                        {categorias.map((c) => (
                            <option key={c.id_categoria_servicio} value={c.id_categoria_servicio}>{c.nombre}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        value={precioMin}
                        onChange={(e) => setPrecioMin(e.target.value)}
                        placeholder="Precio mín."
                        className="field"
                    />
                    <input
                        type="number"
                        value={precioMax}
                        onChange={(e) => setPrecioMax(e.target.value)}
                        placeholder="Precio máx."
                        className="field"
                    />
                    {(busqueda || filtroCategoria || precioMin || precioMax) && (
                        <button
                            onClick={limpiarFiltros}
                            className="text-acento-suave text-sm hover:text-texto cursor-pointer self-center"
                        >
                            <span className="inline-flex items-center gap-2"><Icon nombre="filtro" size={15} /> Limpiar filtros</span>
                        </button>
                    )}
                </div>

                {cargando && <p className="text-texto-secundario text-center">Cargando servicios...</p>}

                {!cargando && servicios.length === 0 && (
                    <p className="text-texto-secundario text-center">No se encontraron servicios con esos filtros.</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {servicios.map((s) => (
                        <div key={s.id_servicio} className="group bg-superficie border border-borde rounded-2xl overflow-hidden flex flex-col hover:border-acento/60 transition-colors">
                            <ImageBox src={s.imagen_url} alt={s.nombre} />
                            <div className="p-5 flex flex-col flex-1">
                                <span className="text-texto-secundario text-xs uppercase tracking-wide mb-1">{s.categoria}</span>
                                <h3 className="text-texto font-serif text-lg mb-2">{s.nombre}</h3>
                                <p className="text-texto-secundario text-sm mb-3 flex-1">{s.descripcion}</p>
                                <p className="text-acento font-medium">${Number(s.precio).toLocaleString('es-CO')}</p>
                                <p className="text-texto-secundario text-xs mb-4">{s.duracion_estimada}</p>
                                <Link
                                    to={`/reservas?servicio=${s.id_servicio}`}
                                    className="bg-acento text-texto text-sm text-center px-4 py-2.5 rounded-lg hover:bg-red-800 transition-colors"
                                >
                                    <span className="inline-flex items-center justify-center gap-2">Reservar <Icon nombre="adelante" size={15} /></span>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}