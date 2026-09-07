import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {

    const [estadoAuth, setEstadoAuth] = useState({
        usuario: null,
        token: null,
        cargando: true
    })

    useEffect(() => {

        const token =
            localStorage.getItem('trazo_token') ||
            sessionStorage.getItem('trazo_token')

        const usuarioGuardado =
            localStorage.getItem('trazo_usuario') ||
            sessionStorage.getItem('trazo_usuario')

        setEstadoAuth({
            usuario: usuarioGuardado ? JSON.parse(usuarioGuardado) : null,
            token: token || null,
            cargando: false,
        })

    }, [])

    const iniciarSesion = (usuario, token, recordarme) => {

        const almacenamiento = recordarme ? localStorage : sessionStorage

        almacenamiento.setItem(
            'trazo_usuario',
            JSON.stringify(usuario)
        )

        almacenamiento.setItem(
            'trazo_token',
            token
        )

        setEstadoAuth({
            usuario,
            token,
            cargando: false
        })
    }

    const cerrarSesion = () => {

        setEstadoAuth({
            usuario: null,
            token: null,
            cargando: false
        })

        localStorage.removeItem('trazo_usuario')
        localStorage.removeItem('trazo_token')

        sessionStorage.removeItem('trazo_usuario')
        sessionStorage.removeItem('trazo_token')
    }

    const actualizarUsuario = (datosActualizados) => {

        setEstadoAuth((prev) => {

            const nuevoUsuario = {
                ...prev.usuario,
                ...datosActualizados
            }

            const almacenamiento = localStorage.getItem('trazo_token')
                ? localStorage
                : sessionStorage

            almacenamiento.setItem(
                'trazo_usuario',
                JSON.stringify(nuevoUsuario)
            )

            return {
                ...prev,
                usuario: nuevoUsuario
            }
        })
    }

    return (
        <AuthContext.Provider
            value={{
                usuario: estadoAuth.usuario,
                token: estadoAuth.token,
                cargando: estadoAuth.cargando,
                iniciarSesion,
                cerrarSesion,
                actualizarUsuario,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)