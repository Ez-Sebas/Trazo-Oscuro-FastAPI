import { useState, useEffect } from 'react'
import {
    obtenerServicios, obtenerCategoriasServicio, crearServicio,
    editarServicio, cambiarEstadoServicio, eliminarServicio
} from '../../services/servicioService.js'
import { Input } from '../ui/Input.jsx'
import { Select } from '../ui/Select.jsx'
import { Button } from '../ui/Button.jsx'
import { Modal } from '../ui/Modal.jsx'
import { ImageBox } from '../ui/ImageBox.jsx'

const valoresIniciales = { id_categoria_servicio: '', nombre: '', descripcion: '', precio: '', duracion_estimada: '', imagen_url: '' }

export const ServiciosCRUD = () => {
    const [servicios, setServicios] = useState([])
    const [categorias, setCategorias] = useState([])
    const [cargando, setCargando] = useState(true)
    const [modalAbierto, setModalAbierto] = useState(false)
    const [modoEdicion, setModoEdicion] = useState(null)
    const [form, setForm] = useState(valoresIniciales)
    const [errores, setErrores] = useState({})

    const [busqueda, setBusqueda] = useState('')
    const [filtroCategoria, setFiltroCategoria] = useState('')
    const [precioMin, setPrecioMin] = useState('')
    const [precioMax, setPrecioMax] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)

    const cargar = async () => {
        setCargando(true)
        try {
            const data = await obtenerServicios({
                busqueda, id_categoria_servicio: filtroCategoria, precio_min: precioMin,
                precio_max: precioMax, estado: filtroEstado, pagina, por_pagina: 9,
            })
            setServicios(data.servicios)
            setTotalPaginas(data.total_paginas)
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        obtenerCategoriasServicio().then((d) => setCategorias(d.categorias))
    }, [])

    useEffect(() => {
        const timer = setTimeout(cargar, 350)
        return () => clearTimeout(timer)
    }, [busqueda, filtroCategoria, precioMin, precioMax, filtroEstado, pagina])

    const validarCampo = (nombre, valor) => {
        const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]+$/
        switch (nombre) {
            case 'nombre':
                if (!valor.trim()) return 'El nombre es obligatorio.'
                if (valor.trim().length < 2 || valor.length > 60) return 'Debe tener entre 2 y 60 caracteres.'
                if (!regexNombre.test(valor)) return 'Solo letras, números y espacios.'
                return ''
            case 'id_categoria_servicio':
                if (!valor) return 'Selecciona una categoría.'
                return ''
            case 'descripcion':
                if (!valor.trim()) return 'La descripción es obligatoria.'
                if (valor.trim().length < 5 || valor.length > 255) return 'Debe tener entre 5 y 255 caracteres.'
                return ''
            case 'precio':
                if (valor === '') return 'El precio es obligatorio.'
                if (Number(valor) <= 0) return 'El precio debe ser mayor a 0.'
                return ''
            case 'duracion_estimada':
                if (!valor.trim()) return 'La duración estimada es obligatoria.'
                if (valor.trim().length < 2 || valor.length > 30) return 'Debe tener entre 2 y 30 caracteres.'
                return ''
            default:
                return ''
        }
    }

    const manejarCambio = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (name !== 'imagen_url') setErrores((prev) => ({ ...prev, [name]: validarCampo(name, value) }))
    }

    const abrirCrear = () => { setModoEdicion(null); setForm(valoresIniciales); setErrores({}); setModalAbierto(true) }
    const abrirEditar = (s) => {
        setModoEdicion(s.id_servicio)
        setForm({
            id_categoria_servicio: s.id_categoria_servicio,
            nombre: s.nombre, descripcion: s.descripcion,
            precio: s.precio, duracion_estimada: s.duracion_estimada, imagen_url: s.imagen_url || '',
        })
        setErrores({})
        setModalAbierto(true)
    }
    const cerrarModal = () => { setModalAbierto(false); setModoEdicion(null); setForm(valoresIniciales); setErrores({}) }

    const manejarGuardar = async (e) => {
        e.preventDefault()
        const campos = ['nombre', 'id_categoria_servicio', 'descripcion', 'precio', 'duracion_estimada']
        const nuevosErrores = {}
        campos.forEach((c) => { nuevosErrores[c] = validarCampo(c, form[c]) })
        setErrores(nuevosErrores)
        if (Object.values(nuevosErrores).some((m) => m !== '')) return

        const payload = {
            id_categoria_servicio: Number(form.id_categoria_servicio),
            nombre: form.nombre.trim(), descripcion: form.descripcion.trim(),
            duracion_estimada: form.duracion_estimada.trim(), precio: Number(form.precio),
            imagen_url: form.imagen_url.trim(),
        }
        try {
            if (modoEdicion) await editarServicio(modoEdicion, payload)
            else await crearServicio(payload)
            cerrarModal()
            cargar()
        } catch (err) { alert(err.message) }
    }

    const alternarEstado = async (s) => {
        await cambiarEstadoServicio(s.id_servicio, s.estado === 'activo' ? 'inactivo' : 'activo')
        cargar()
    }

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar este servicio?')) return
        await eliminarServicio(id)
        cargar()
    }

    const opcionesCategoria = categorias.map((c) => ({ value: c.id_categoria_servicio, label: c.nombre }))

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-texto font-serif text-lg">Servicios</h2>
                <Button onClick={abrirCrear}>Agregar servicio</Button>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
                <input
                    value={busqueda}
                    onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }}
                    placeholder="Buscar servicio..."
                    className="flex-1 min-w-180px bg-fondo border border-borde rounded-md px-3 py-2 text-texto text-sm focus:outline-none focus:border-acento"
                />
                <select value={filtroCategoria} onChange={(e) => { setFiltroCategoria(e.target.value); setPagina(1) }} className="bg-fondo border border-borde rounded-md px-3 py-2 text-texto text-sm">
                    <option value="">Todas las categorías</option>
                    {categorias.map((c) => <option key={c.id_categoria_servicio} value={c.id_categoria_servicio}>{c.nombre}</option>)}
                </select>
                <input type="number" value={precioMin} onChange={(e) => { setPrecioMin(e.target.value); setPagina(1) }} placeholder="Precio mín." className="w-28 bg-fondo border border-borde rounded-md px-3 py-2 text-texto text-sm" />
                <input type="number" value={precioMax} onChange={(e) => { setPrecioMax(e.target.value); setPagina(1) }} placeholder="Precio máx." className="w-28 bg-fondo border border-borde rounded-md px-3 py-2 text-texto text-sm" />
                <select value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1) }} className="bg-fondo border border-borde rounded-md px-3 py-2 text-texto text-sm">
                    <option value="">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                </select>
            </div>

            <Modal abierto={modalAbierto} onCerrar={cerrarModal} titulo={modoEdicion ? 'Editar servicio' : 'Agregar servicio'}>
                <form onSubmit={manejarGuardar} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Nombre" name="nombre" value={form.nombre} onChange={manejarCambio} error={errores.nombre} maxLength={60} />
                        <Select label="Categoría" name="id_categoria_servicio" value={form.id_categoria_servicio} onChange={manejarCambio} error={errores.id_categoria_servicio} options={opcionesCategoria} />
                    </div>
                    <Input label="Descripción" name="descripcion" value={form.descripcion} onChange={manejarCambio} error={errores.descripcion} maxLength={255} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Precio" name="precio" type="number" value={form.precio} onChange={manejarCambio} error={errores.precio} />
                        <Input label="Duración estimada" name="duracion_estimada" value={form.duracion_estimada} onChange={manejarCambio} error={errores.duracion_estimada} maxLength={30} />
                    </div>
                    <Input label="URL de imagen (recomendado 4:3, ej. 800x600px)" name="imagen_url" value={form.imagen_url} onChange={manejarCambio} placeholder="https://..." maxLength={255} />
                    <Button type="submit">{modoEdicion ? 'Guardar cambios' : 'Crear servicio'}</Button>
                </form>
            </Modal>

            {cargando ? (
                <p className="text-texto-secundario">Cargando servicios...</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {servicios.map((s) => (
                            <div key={s.id_servicio} className="bg-fondo rounded-lg overflow-hidden">
                                <ImageBox src={s.imagen_url} alt={s.nombre} />
                                <div className="p-4">
                                    <span className="text-texto-secundario text-xs uppercase tracking-wide">{s.categoria}</span>
                                    <h3 className="text-texto font-medium">{s.nombre}</h3>
                                    <p className="text-texto-secundario text-sm mb-2 line-clamp-2">{s.descripcion}</p>
                                    <p className="text-texto-secundario text-sm">${Number(s.precio).toLocaleString('es-CO')} · {s.duracion_estimada}</p>
                                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${s.estado === 'activo' ? 'bg-acento/15 text-acento' : 'bg-borde/30 text-texto-secundario'}`}>{s.estado}</span>
                                    <div className="flex gap-3 mt-3">
                                        <button onClick={() => abrirEditar(s)} className="text-texto-secundario text-sm hover:text-acento cursor-pointer">Editar</button>
                                        <button onClick={() => alternarEstado(s)} className="text-texto-secundario text-sm hover:text-acento cursor-pointer">
                                            {s.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                        </button>
                                        <button onClick={() => eliminar(s.id_servicio)} className="text-red-500 text-sm hover:underline cursor-pointer">Eliminar</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {servicios.length === 0 && <p className="text-texto-secundario col-span-full text-center py-8">Sin resultados.</p>}
                    </div>

                    {totalPaginas > 1 && (
                        <div className="flex justify-center items-center gap-3 mt-6">
                            <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} className="text-texto-secundario disabled:opacity-30 cursor-pointer">←</button>
                            <span className="text-texto-secundario text-sm">Página {pagina} de {totalPaginas}</span>
                            <button disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)} className="text-texto-secundario disabled:opacity-30 cursor-pointer">→</button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}