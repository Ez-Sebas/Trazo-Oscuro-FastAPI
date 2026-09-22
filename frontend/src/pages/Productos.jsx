import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerProductosActivos, obtenerCategoriasProducto } from '../services/productoService.js'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { ImageBox } from '../components/ui/ImageBox.jsx'
import { Icon } from '../components/ui/Icon.jsx'

export const Productos = () => {
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [cargando, setCargando] = useState(true)
    const [agregado, setAgregado] = useState(null)

    const [busqueda, setBusqueda] = useState('')
    const [filtroCategoria, setFiltroCategoria] = useState('')
    const [precioMin, setPrecioMin] = useState('')
    const [precioMax, setPrecioMax] = useState('')

    const { agregarProducto } = useCart()
    const { usuario } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        obtenerCategoriasProducto().then((d) => setCategorias(d.categorias))
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            setCargando(true)
            obtenerProductosActivos({
                busqueda,
                id_categoria_producto: filtroCategoria,
                precio_min: precioMin,
                precio_max: precioMax,
            })
                .then((data) => setProductos(data.productos))
                .finally(() => setCargando(false))
        }, 350)
        return () => clearTimeout(timer)
    }, [busqueda, filtroCategoria, precioMin, precioMax])

    const manejarAgregar = (producto) => {
        if (!usuario) {
            navigate('/login')
            return
        }
        agregarProducto(producto, 1)
        setAgregado(producto.id_producto)
        setTimeout(() => setAgregado(null), 1200)
    }

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
                    <span className="eyebrow">Selección del estudio</span>
                    <h1 className="editorial-title text-texto text-5xl sm:text-6xl mt-5 mb-4">Productos para cuidar tu tinta.</h1>
                    <p className="text-texto-secundario text-base sm:text-lg">Cuidado profesional para tu tatuaje y piezas seleccionadas de Trazo Oscuro.</p>
                </div>

                {!usuario && (
                    <div className="bg-superficie border-l-2 border-acento rounded-r-xl p-4 mb-8">
                        <p className="text-texto-secundario text-sm">
                            Inicia sesión para agregar productos a tu carrito y realizar una compra.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_auto] gap-3 mb-10 p-4 bg-superficie border border-borde rounded-2xl">
                    <input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar producto..."
                        className="field"
                    />
                    <select
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                        className="field"
                    >
                        <option value="">Todas las categorías</option>
                        {categorias.map((c) => (
                            <option key={c.id_categoria_producto} value={c.id_categoria_producto}>{c.nombre}</option>
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

                {cargando && <p className="text-texto-secundario text-center">Cargando productos...</p>}

                {!cargando && productos.length === 0 && (
                    <p className="text-texto-secundario text-center">No se encontraron productos con esos filtros.</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {productos.map((p) => (
                        <div key={p.id_producto} className="group bg-superficie border border-borde rounded-2xl overflow-hidden flex flex-col hover:border-acento/60 transition-colors">
                            <ImageBox src={p.imagen_url} alt={p.nombre} />
                            <div className="p-5 flex flex-col flex-1">
                                <span className="text-texto-secundario text-xs uppercase tracking-wide mb-1">{p.categoria}</span>
                                <h3 className="text-texto font-serif text-lg mb-2">{p.nombre}</h3>
                                <p className="text-texto-secundario text-sm mb-4 flex-1">{p.descripcion}</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-acento font-medium text-lg">${Number(p.precio).toLocaleString('es-CO')}</p>
                                    <button
                                        onClick={() => manejarAgregar(p)}
                                        className="bg-acento text-texto text-xs sm:text-sm px-3 sm:px-4 py-2.5 rounded-lg hover:bg-red-800 transition-colors cursor-pointer"
                                    >
                                        {!usuario
                                            ? 'Inicia sesión para comprar'
                                            : agregado === p.id_producto
                                                ? <span className="inline-flex items-center gap-1.5"><Icon nombre="check" size={15} /> Agregado</span>
                                                : 'Agregar al carrito'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}