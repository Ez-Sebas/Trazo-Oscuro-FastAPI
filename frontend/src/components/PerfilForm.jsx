import { useState, useEffect } from 'react'
import { obtenerMiPerfil, actualizarMiPerfil } from '../services/usuarioService.js'
import { Input } from './ui/Input.jsx'
import { Select } from './ui/Select.jsx'
import { Button } from './ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { Icon } from './ui/Icon.jsx'

const tiposDocumento = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'PA', label: 'Pasaporte' },
]

export const PerfilForm = () => {
    const { actualizarUsuario } = useAuth()

    const [datos, setDatos] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [mensaje, setMensaje] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        obtenerMiPerfil()
            .then((data) => setDatos(data.usuario))
            .catch((err) => setError(err.message))
            .finally(() => setCargando(false))
    }, [])

    const manejarCambio = (campo, valor) => {
        setDatos((prev) => ({ ...prev, [campo]: valor }))
    }

    const manejarGuardar = async (e) => {
        e.preventDefault()
        setMensaje('')
        setError('')
        setGuardando(true)
        try {
            const payload = {
                nombres: datos.nombres,
                apellidos: datos.apellidos,
                direccion: datos.direccion,
                telefono: datos.telefono,
                tipo_documento: datos.tipo_documento,
                numero_documento: datos.numero_documento,
                email: datos.email,
            }
            const respuesta = await actualizarMiPerfil(payload)
            actualizarUsuario({ nombres: respuesta.usuario.nombres, apellidos: respuesta.usuario.apellidos })
            setMensaje('Tu información fue actualizada correctamente.')
        } catch (err) {
            setError(err.message)
        } finally {
            setGuardando(false)
        }
    }

    if (cargando) return <p className="text-texto-secundario text-sm">Cargando tu información...</p>

    if (!datos) return <p className="text-red-500 text-sm">{error || 'No fue posible cargar tu perfil.'}</p>

    return (
        <form onSubmit={manejarGuardar} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px overflow-hidden rounded-xl border border-borde bg-borde">
                <div className="bg-fondo p-4"><Icon nombre="perfil" size={17} className="text-acento-suave" /><p className="text-texto-secundario text-[10px] uppercase tracking-wider mt-3">Perfil</p><p className="text-texto text-sm mt-1">Información personal</p></div>
                <div className="bg-fondo p-4"><Icon nombre="citas" size={17} className="text-acento-suave" /><p className="text-texto-secundario text-[10px] uppercase tracking-wider mt-3">Acceso</p><p className="text-texto text-sm mt-1">Cuenta activa</p></div>
                <div className="bg-fondo p-4"><Icon nombre="cerrar" size={17} className="text-acento-suave" /><p className="text-texto-secundario text-[10px] uppercase tracking-wider mt-3">Privacidad</p><p className="text-texto text-sm mt-1">Datos protegidos</p></div>
            </div>
            <div className="bg-superficie border border-borde rounded-2xl p-5 sm:p-7 flex flex-col gap-4">
            <div className="border-b border-borde pb-4 mb-1"><p className="text-acento-suave text-[10px] font-bold tracking-[0.18em] uppercase">Datos de contacto</p><p className="text-texto-secundario text-xs mt-2">Mantén esta información actualizada para facilitar tus reservas.</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nombres" name="nombres" value={datos.nombres} onChange={(e) => manejarCambio('nombres', e.target.value)} maxLength={30} />
                <Input label="Apellidos" name="apellidos" value={datos.apellidos} onChange={(e) => manejarCambio('apellidos', e.target.value)} maxLength={30} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Tipo de documento" name="tipo_documento" value={datos.tipo_documento} onChange={(e) => manejarCambio('tipo_documento', e.target.value)} options={tiposDocumento} />
                <Input label="Número de documento" name="numero_documento" value={datos.numero_documento} onChange={(e) => manejarCambio('numero_documento', e.target.value)} maxLength={15} />
            </div>
            <Input label="Dirección" name="direccion" value={datos.direccion} onChange={(e) => manejarCambio('direccion', e.target.value)} maxLength={60} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Teléfono" name="telefono" value={datos.telefono} onChange={(e) => manejarCambio('telefono', e.target.value)} maxLength={10} />
                <Input label="Correo electrónico" name="email" type="email" value={datos.email} onChange={(e) => manejarCambio('email', e.target.value)} maxLength={50} />
            </div>

            {mensaje && <p className="text-acento text-sm text-center">{mensaje}</p>}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <Button type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
            </Button>
            </div>
        </form>
    )
}