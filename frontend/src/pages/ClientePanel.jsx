import { useState, useEffect } from 'react'
import { obtenerMiPerfil, actualizarMiPerfil } from '../services/usuarioService.js'
import { Input } from '../components/ui/Input.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Button } from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const tiposDocumento = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'PA', label: 'Pasaporte' },
]

export const ClientePanel = () => {
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
            await actualizarMiPerfil({
                nombres: datos.nombres,
                apellidos: datos.apellidos,
                direccion: datos.direccion,
                telefono: datos.telefono,
                tipo_documento: datos.tipo_documento,
                numero_documento: datos.numero_documento,
                email: datos.email,
            })
            actualizarUsuario({
                nombres: datos.nombres,
                apellidos: datos.apellidos,
                direccion: datos.direccion,
                telefono: datos.telefono,
                tipo_documento: datos.tipo_documento,
                numero_documento: datos.numero_documento,
                email: datos.email,
            })
            setMensaje('Tu información fue actualizada correctamente.')
        } catch (err) {
            setError(err.message)
        } finally {
            setGuardando(false)
        }
    }

    if (cargando) return <div className="min-h-screen bg-fondo" />

    return (
        <div className="bg-fondo min-h-screen pt-28 pb-20 px-6">
            <div className="max-w-xl mx-auto">
                <h1 className="text-texto font-serif text-3xl mb-2">Mi Cuenta</h1>
                <p className="text-texto-secundario text-sm mb-8">Actualiza tu información personal cuando lo necesites.</p>

                {datos && (
                    <form onSubmit={manejarGuardar} className="bg-superficie rounded-lg p-6 flex flex-col gap-4">
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
                    </form>
                )}
            </div>
        </div>
    )
}