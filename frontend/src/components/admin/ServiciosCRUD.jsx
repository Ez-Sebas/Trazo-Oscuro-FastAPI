import { useState, useEffect } from 'react'
import { obtenerServicios, crearServicio, editarServicio, cambiarEstadoServicio, eliminarServicio } from '../../services/servicioService.js'
import { Input } from '../ui/Input.jsx'
import { Button } from '../ui/Button.jsx'
import { Modal } from '../ui/Modal.jsx'

const valoresIniciales = {
    nombre: '',
    descripcion: '',
    precio: '',
    duracion_estimada: '',
    imagen_url: '',
}

export const ServiciosCRUD = () => {
    const [servicios, setServicios] = useState([])
    const [cargando, setCargando] = useState(true)
    const [modalAbierto, setModalAbierto] = useState(false)
    const [modoEdicion, setModoEdicion] = useState(null)
    const [form, setForm] = useState(valoresIniciales)
    const [errores, setErrores] = useState({})

    const cargar = async () => {
        setCargando(true)
        try {
            const data = await obtenerServicios()
            setServicios(data.servicios)
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => { cargar() }, [])

    const validarCampo = (nombre, valor) => {
        const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]+$/

        switch (nombre) {
            case 'nombre':
                if (!valor.trim()) return 'El nombre es obligatorio.'
                if (valor.trim().length < 2 || valor.trim().length > 60) return 'Debe tener entre 2 y 60 caracteres.'
                if (!regexNombre.test(valor)) return 'Solo se permiten letras, números y espacios.'
                return ''
            case 'descripcion':
                if (!valor.trim()) return 'La descripción es obligatoria.'
                if (valor.trim().length < 5 || valor.trim().length > 255) return 'Debe tener entre 5 y 255 caracteres.'
                return ''
            case 'precio':
                if (valor === '') return 'El precio es obligatorio.'
                if (Number(valor) <= 0) return 'El precio debe ser mayor a 0.'
                return ''
            case 'duracion_estimada':
                if (!valor.trim()) return 'La duración estimada es obligatoria.'
                if (valor.trim().length < 2 || valor.trim().length > 30) return 'Debe tener entre 2 y 30 caracteres.'
                return ''
            default:
                return ''
        }
    }

    const manejarCambio = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (name !== 'imagen_url') {
            setErrores((prev) => ({ ...prev, [name]: validarCampo(name, value) }))
        }
    }

    const abrirCrear = () => {
        setModoEdicion(null)
        setForm(valoresIniciales)
        setErrores({})
        setModalAbierto(true)
    }

    const abrirEditar = (s) => {
        setModoEdicion(s.id_servicio)
        setForm({
            nombre: s.nombre,
            descripcion: s.descripcion,
            precio: s.precio,
            duracion_estimada: s.duracion_estimada,
            imagen_url: s.imagen_url || '',
        })
        setErrores({})
        setModalAbierto(true)
    }

    const cerrarModal = () => {
        setModalAbierto(false)
        setModoEdicion(null)
        setForm(valoresIniciales)
        setErrores({})
    }

    const manejarGuardar = async (e) => {
        e.preventDefault()

        const camposAValidar = ['nombre', 'descripcion', 'precio', 'duracion_estimada']
        const nuevosErrores = {}
        camposAValidar.forEach((campo) => {
            nuevosErrores[campo] = validarCampo(campo, form[campo])
        })
        setErrores(nuevosErrores)

        const hayErrores = Object.values(nuevosErrores).some((msg) => msg !== '')
        if (hayErrores) return

        const payload = {
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim(),
            duracion_estimada: form.duracion_estimada.trim(),
            precio: Number(form.precio),
            imagen_url: form.imagen_url.trim(),
        }

        try {
            if (modoEdicion) {
                await editarServicio(modoEdicion, payload)
            } else {
                await crearServicio(payload)
            }
            cerrarModal()
            cargar()
        } catch (err) {
            alert(err.message)
        }
    }

    const alternarEstado = async (s) => {
        try {
            await cambiarEstadoServicio(s.id_servicio, s.estado === 'activo' ? 'inactivo' : 'activo')
            cargar()
        } catch (err) {
            alert(err.message)
        }
    }

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar este servicio?')) return
        try {
            await eliminarServicio(id)
            cargar()
        } catch (err) {
            alert(err.message)
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-texto font-serif text-lg">Servicios</h2>
                <Button onClick={abrirCrear}>Agregar servicio</Button>
            </div>

            <Modal abierto={modalAbierto} onCerrar={cerrarModal} titulo={modoEdicion ? 'Editar servicio' : 'Agregar servicio'}>
                <form onSubmit={manejarGuardar} className="flex flex-col gap-4">
                    <Input label="Nombre" name="nombre" value={form.nombre} onChange={manejarCambio} error={errores.nombre} maxLength={60} />
                    <Input label="Descripción" name="descripcion" value={form.descripcion} onChange={manejarCambio} error={errores.descripcion} maxLength={255} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Precio" name="precio" type="number" value={form.precio} onChange={manejarCambio} error={errores.precio} />
                        <Input label="Duración estimada" name="duracion_estimada" value={form.duracion_estimada} onChange={manejarCambio} error={errores.duracion_estimada} maxLength={30} />
                    </div>
                    <Input label="URL de imagen (opcional)" name="imagen_url" value={form.imagen_url} onChange={manejarCambio} placeholder="https://..." maxLength={255} />
                    <Button type="submit">{modoEdicion ? 'Guardar cambios' : 'Crear servicio'}</Button>
                </form>
            </Modal>

            {cargando ? (
                <p className="text-texto-secundario">Cargando servicios...</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {servicios.map((s) => (
                        <div key={s.id_servicio} className="bg-fondo rounded-lg overflow-hidden">
                            <div className="h-32 bg-superficie flex items-center justify-center">
                                {s.imagen_url ? (
                                    <img src={s.imagen_url} alt={s.nombre} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-texto-secundario text-xs">Sin imagen</span>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="text-texto font-medium">{s.nombre}</h3>
                                <p className="text-texto-secundario text-sm mb-2 line-clamp-2">{s.descripcion}</p>
                                <p className="text-texto-secundario text-sm">${Number(s.precio).toLocaleString('es-CO')} · {s.duracion_estimada}</p>
                                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${s.estado === 'activo' ? 'bg-acento/15 text-acento' : 'bg-borde/30 text-texto-secundario'}`}>
                                    {s.estado}
                                </span>
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
                </div>
            )}
        </div>
    )
}