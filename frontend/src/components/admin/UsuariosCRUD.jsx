import { useState, useEffect, useCallback } from 'react'
import {
    obtenerUsuarios,
    crearUsuarioAdmin,
    cambiarEstadoUsuario,
    cambiarRolUsuario,
    eliminarUsuario
} from '../../services/usuarioService.js'
import { Input } from '../ui/Input.jsx'
import { Select } from '../ui/Select.jsx'
import { Button } from '../ui/Button.jsx'
import { Modal } from '../ui/Modal.jsx'
import { Icon } from '../ui/Icon.jsx'

const roles = [
    { value: 1, label: 'Administrador' },
    { value: 2, label: 'Empleado' },
    { value: 3, label: 'Cliente' }
]

const nuevoInicial = {
    nombres: '', apellidos: '', tipo_documento: 'CC', numero_documento: '',
    direccion: '', telefono: '', email: '', password: '', id_rol: 3
}

export const UsuariosCRUD = () => {
    const [usuarios, setUsuarios] = useState([])
    const [cargando, setCargando] = useState(true)
    const [mostrarForm, setMostrarForm] = useState(false)
    const [nuevo, setNuevo] = useState(nuevoInicial)
    const [errores, setErrores] = useState({})
    const [editando, setEditando] = useState(null)
    const [formEdicion, setFormEdicion] = useState({ id_rol: 3 })

    const [busqueda, setBusqueda] = useState('')
    const [filtroRol, setFiltroRol] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')
    const [pagina, setPagina] = useState(1)
    const porPagina = 10

    const cargar = useCallback(async () => {
        setCargando(true)
        try {
            const data = await obtenerUsuarios()
            setUsuarios(data.usuarios)
        } catch (err) {
            alert(err.message)
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(cargar, 0)
        return () => clearTimeout(timer)
    }, [cargar])

    const validarCampo = (campo, valor) => {
        const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/
        const soloNumeros = /^\d+$/
        const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        if (campo === 'nombres' || campo === 'apellidos') {
            if (!valor.trim()) return `${campo === 'nombres' ? 'Los nombres son' : 'Los apellidos son'} obligatorios.`
            if (valor.trim().length < 2) return 'Debe tener al menos 2 caracteres.'
            if (valor.length > 50) return 'No puede superar 50 caracteres.'
            if (!soloLetras.test(valor.trim())) return 'Solo puede contener letras.'
        }
        if (campo === 'numero_documento') {
            if (!valor.trim()) return 'El número de documento es obligatorio.'
            if (!soloNumeros.test(valor)) return 'Solo puede contener números.'
            if (valor.length < 6) return 'Debe tener mínimo 6 dígitos.'
            if (valor.length > 15) return 'No puede superar 15 dígitos.'
        }
        if (campo === 'direccion') {
            if (!valor.trim()) return 'La dirección es obligatoria.'
            if (valor.trim().length < 5) return 'Debe tener al menos 5 caracteres.'
            if (valor.length > 100) return 'No puede superar 100 caracteres.'
        }
        if (campo === 'telefono') {
            if (!valor.trim()) return 'El teléfono es obligatorio.'
            if (!soloNumeros.test(valor)) return 'Solo puede contener números.'
            if (valor.length < 7 || valor.length > 10) return 'Debe tener entre 7 y 10 dígitos.'
        }
        if (campo === 'email') {
            if (!valor.trim()) return 'El correo electrónico es obligatorio.'
            if (valor.length > 80) return 'No puede superar 80 caracteres.'
            if (!formatoCorreo.test(valor.trim())) return 'Ingresa un correo electrónico válido.'
        }
        if (campo === 'password') {
            if (!valor) return 'La contraseña es obligatoria.'
            if (valor.length < 8) return 'Debe tener mínimo 8 caracteres.'
            if (valor.length > 72) return 'No puede superar 72 caracteres.'
        }
        return ''
    }

    const manejarCambio = (campo, valor) => {
        setNuevo((prev) => ({ ...prev, [campo]: valor }))
        setErrores((prev) => ({ ...prev, [campo]: validarCampo(campo, valor) }))
    }

    const validarFormulario = () => {
        const nuevosErrores = {}
        ;['nombres', 'apellidos', 'numero_documento', 'direccion', 'telefono', 'email', 'password'].forEach((campo) => {
            nuevosErrores[campo] = validarCampo(campo, nuevo[campo])
        })
        setErrores(nuevosErrores)
        return Object.values(nuevosErrores).every((e) => e === '')
    }

    const cerrarModal = () => {
        setMostrarForm(false)
        setNuevo(nuevoInicial)
        setErrores({})
    }

    const manejarCrear = async (e) => {
        e.preventDefault()
        if (!validarFormulario()) return
        try {
            await crearUsuarioAdmin({
                ...nuevo,
                nombres: nuevo.nombres.trim(),
                apellidos: nuevo.apellidos.trim(),
                numero_documento: nuevo.numero_documento.trim(),
                direccion: nuevo.direccion.trim(),
                telefono: nuevo.telefono.trim(),
                email: nuevo.email.trim(),
                id_rol: Number(nuevo.id_rol)
            })
            cerrarModal()
            await cargar()
        } catch (err) {
            alert(err.message)
        }
    }

    const iniciarEdicion = (u) => {
        setEditando(u.id_usuario)
        setFormEdicion({ id_rol: u.id_rol })
    }

    const guardarEdicion = async (id) => {
        try {
            await cambiarRolUsuario(id, Number(formEdicion.id_rol))
            setEditando(null)
            await cargar()
        } catch (err) {
            alert(err.message)
        }
    }

    const alternarEstado = async (u) => {
        try {
            await cambiarEstadoUsuario(u.id_usuario, u.estado === 'activo' ? 'inactivo' : 'activo')
            await cargar()
        } catch (err) {
            alert(err.message)
        }
    }

    const eliminar = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este usuario?')) return
        try {
            await eliminarUsuario(id)
            await cargar()
        } catch (err) {
            alert(err.message)
        }
    }

    const usuariosFiltrados = usuarios.filter((u) => {
        const texto = busqueda.trim().toLowerCase()
        const coincideTexto =
            !texto ||
            `${u.nombres} ${u.apellidos}`.toLowerCase().includes(texto) ||
            u.email.toLowerCase().includes(texto) ||
            String(u.id_usuario).includes(texto) ||
            u.numero_documento.includes(texto)
        const coincideRol = !filtroRol || String(u.id_rol) === filtroRol
        const coincideEstado = !filtroEstado || u.estado === filtroEstado
        return coincideTexto && coincideRol && coincideEstado
    })

    const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / porPagina))
    const usuariosPagina = usuariosFiltrados.slice((pagina - 1) * porPagina, pagina * porPagina)

    const badgeEstado = (estado) => (
        <span className={`px-2 py-1 rounded text-xs ${estado === 'activo' ? 'bg-acento/15 text-acento' : 'bg-borde/30 text-texto-secundario'}`}>
            {estado}
        </span>
    )

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5">
                <div><p className="text-acento-suave text-[10px] font-bold tracking-[0.18em] uppercase">Directorio</p><h2 className="text-texto font-serif text-2xl mt-1">Usuarios registrados</h2></div>
                <Button onClick={() => setMostrarForm(true)}><span className="inline-flex items-center gap-2"><Icon nombre="mas" size={16} /> Agregar usuario</span></Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_0.8fr_0.8fr] gap-3 mb-6 p-4 bg-superficie border border-borde rounded-2xl">
                <input
                    value={busqueda}
                    onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }}
                    placeholder="Buscar por nombre, correo, documento o ID..."
                    className="field"
                />
                <select
                    value={filtroRol}
                    onChange={(e) => { setFiltroRol(e.target.value); setPagina(1) }}
                    className="admin-select w-full px-3 py-2.5 text-texto text-sm"
                >
                    <option value="">Todos los roles</option>
                    {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <select
                    value={filtroEstado}
                    onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1) }}
                    className="admin-select w-full px-3 py-2.5 text-texto text-sm"
                >
                    <option value="">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                </select>
            </div>

            <Modal abierto={mostrarForm} onCerrar={cerrarModal} titulo="Agregar usuario" maxWidth="max-w-2xl">
                <form onSubmit={manejarCrear} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Nombres" name="nombres" value={nuevo.nombres} onChange={(e) => manejarCambio('nombres', e.target.value)} error={errores.nombres} maxLength={50} />
                        <Input label="Apellidos" name="apellidos" value={nuevo.apellidos} onChange={(e) => manejarCambio('apellidos', e.target.value)} error={errores.apellidos} maxLength={50} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select
                            label="Tipo de documento" name="tipo_documento" value={nuevo.tipo_documento}
                            onChange={(e) => setNuevo({ ...nuevo, tipo_documento: e.target.value })}
                            options={[
                                { value: 'CC', label: 'Cédula de Ciudadanía' },
                                { value: 'CE', label: 'Cédula de Extranjería' },
                                { value: 'TI', label: 'Tarjeta de Identidad' },
                                { value: 'PA', label: 'Pasaporte' }
                            ]}
                        />
                        <Input label="Número de documento" name="numero_documento" value={nuevo.numero_documento} onChange={(e) => manejarCambio('numero_documento', e.target.value)} error={errores.numero_documento} maxLength={15} />
                    </div>
                    <Input label="Dirección" name="direccion" value={nuevo.direccion} onChange={(e) => manejarCambio('direccion', e.target.value)} error={errores.direccion} maxLength={100} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Teléfono" name="telefono" value={nuevo.telefono} onChange={(e) => manejarCambio('telefono', e.target.value)} error={errores.telefono} maxLength={10} />
                        <Input label="Correo electrónico" name="email" type="email" value={nuevo.email} onChange={(e) => manejarCambio('email', e.target.value)} error={errores.email} maxLength={80} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Contraseña" name="password" type="password" value={nuevo.password} onChange={(e) => manejarCambio('password', e.target.value)} error={errores.password} maxLength={72} />
                        <Select label="Rol" name="id_rol" value={nuevo.id_rol} onChange={(e) => setNuevo({ ...nuevo, id_rol: e.target.value })} options={roles} />
                    </div>
                    <Button type="submit"><span className="inline-flex items-center gap-2"><Icon nombre="mas" size={16} /> Crear usuario</span></Button>
                </form>
            </Modal>

            {cargando ? (
                <p className="text-texto-secundario">Cargando usuarios...</p>
            ) : (
                <>
                    {/* Tabla en pantallas md+ */}
                    <div className="admin-table-shell hidden md:block overflow-x-auto">
                        <table className="admin-table w-full min-w-190 text-sm text-left">
                            <thead>
                                <tr>
                                    <th className="px-4 py-3">Nombre</th>
                                    <th className="px-4 py-3">Documento</th>
                                    <th className="px-4 py-3">Correo</th>
                                    <th className="px-4 py-3">Rol</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuariosPagina.map((u) => (
                                    <tr key={u.id_usuario} className="align-top">
                                        {editando === u.id_usuario ? (
                                            <>
                                                <td className="px-4 py-3 text-texto">{u.nombres} {u.apellidos}</td>
                                                <td className="px-4 py-3 text-texto-secundario">{u.tipo_documento} {u.numero_documento}</td>
                                                <td className="px-4 py-3 text-texto-secundario">{u.email}</td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        className="admin-select px-2 py-1 text-texto"
                                                        value={formEdicion.id_rol}
                                                        onChange={(e) => setFormEdicion({ ...formEdicion, id_rol: e.target.value })}
                                                    >
                                                        {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3 text-texto-secundario">{u.estado}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-3">
                                                        <button onClick={() => guardarEdicion(u.id_usuario)} className="inline-flex items-center gap-1.5 text-acento hover:underline cursor-pointer"><Icon nombre="check" size={14} /> Guardar</button>
                                                        <button onClick={() => setEditando(null)} className="inline-flex items-center gap-1.5 text-texto-secundario hover:underline cursor-pointer"><Icon nombre="cerrarMenu" size={14} /> Cancelar</button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-4 py-3 text-texto">{u.nombres} {u.apellidos}</td>
                                                <td className="px-4 py-3 text-texto-secundario">{u.tipo_documento} {u.numero_documento}</td>
                                                <td className="px-4 py-3 text-texto-secundario">{u.email}</td>
                                                <td className="px-4 py-3 text-texto-secundario">{u.rol}</td>
                                                <td className="px-4 py-3">{badgeEstado(u.estado)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-3">
                                                        <button onClick={() => iniciarEdicion(u)} className="inline-flex items-center gap-1.5 text-texto-secundario hover:text-acento cursor-pointer"><Icon nombre="editar" size={14} /> Editar rol</button>
                                                        <button onClick={() => alternarEstado(u)} className="text-texto-secundario hover:text-acento cursor-pointer">
                                                            <span className="inline-flex items-center gap-1.5"><Icon nombre={u.estado === 'activo' ? 'cerrar' : 'check'} size={14} /> {u.estado === 'activo' ? 'Desactivar' : 'Activar'}</span>
                                                        </button>
                                                        <button onClick={() => eliminar(u.id_usuario)} className="inline-flex items-center gap-1.5 text-red-500 hover:underline cursor-pointer"><Icon nombre="eliminar" size={14} /> Eliminar</button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {usuariosPagina.length === 0 && (
                                    <tr><td colSpan={6} className="px-4 py-6 text-center text-texto-secundario">Sin resultados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Tarjetas en pantallas pequeñas */}
                    <div className="md:hidden flex flex-col gap-3">
                        {usuariosPagina.length === 0 && (
                            <p className="text-center text-texto-secundario py-6">Sin resultados.</p>
                        )}
                        {usuariosPagina.map((u) => (
                            <div key={u.id_usuario} className="bg-superficie border border-borde rounded-2xl p-4 flex flex-col gap-3 hover:border-acento/60 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-texto font-medium">{u.nombres} {u.apellidos}</p>
                                        <p className="text-texto-secundario text-xs mt-0.5">{u.email}</p>
                                    </div>
                                    {badgeEstado(u.estado)}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-secundario">
                                    <span>{u.tipo_documento} {u.numero_documento}</span>
                                    <span>{u.rol}</span>
                                </div>

                                {editando === u.id_usuario ? (
                                    <div className="flex items-center gap-2 pt-2 border-t border-borde">
                                        <select
                                            className="admin-select px-2 py-1 text-texto text-sm flex-1"
                                            value={formEdicion.id_rol}
                                            onChange={(e) => setFormEdicion({ ...formEdicion, id_rol: e.target.value })}
                                        >
                                            {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                        </select>
                                        <button onClick={() => guardarEdicion(u.id_usuario)} className="inline-flex items-center gap-1.5 text-acento text-sm hover:underline cursor-pointer"><Icon nombre="check" size={14} /> Guardar</button>
                                        <button onClick={() => setEditando(null)} className="inline-flex items-center gap-1.5 text-texto-secundario text-sm hover:underline cursor-pointer"><Icon nombre="cerrarMenu" size={14} /> Cancelar</button>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-borde text-sm">
                                        <button onClick={() => iniciarEdicion(u)} className="inline-flex items-center gap-1.5 text-texto-secundario hover:text-acento cursor-pointer"><Icon nombre="editar" size={14} /> Editar rol</button>
                                        <button onClick={() => alternarEstado(u)} className="text-texto-secundario hover:text-acento cursor-pointer">
                                            <span className="inline-flex items-center gap-1.5"><Icon nombre={u.estado === 'activo' ? 'cerrar' : 'check'} size={14} /> {u.estado === 'activo' ? 'Desactivar' : 'Activar'}</span>
                                        </button>
                                        <button onClick={() => eliminar(u.id_usuario)} className="inline-flex items-center gap-1.5 text-red-500 hover:underline cursor-pointer"><Icon nombre="eliminar" size={14} /> Eliminar</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {totalPaginas > 1 && (
                        <div className="flex justify-center items-center gap-3 mt-4">
                            <button aria-label="Página anterior" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} className="text-texto-secundario disabled:opacity-30 cursor-pointer"><Icon nombre="atras" size={18} /></button>
                            <span className="text-texto-secundario text-sm">Página {pagina} de {totalPaginas}</span>
                            <button aria-label="Página siguiente" disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)} className="text-texto-secundario disabled:opacity-30 cursor-pointer"><Icon nombre="adelante" size={18} /></button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
