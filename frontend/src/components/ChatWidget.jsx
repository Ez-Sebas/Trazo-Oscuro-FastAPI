import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { enviarMensajeChat, obtenerHistorialChat } from '../services/chatService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Icon } from './ui/Icon.jsx'

const obtenerSessionId = (idUsuario) => {
    const clave = `trazo_chat_session_${idUsuario}`
    let id = localStorage.getItem(clave)
    if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem(clave, id)
    }
    return id
}

export const ChatWidget = () => {
    const [abierto, setAbierto] = useState(false)
    const [mensajes, setMensajes] = useState([])
    const [texto, setTexto] = useState('')
    const [enviando, setEnviando] = useState(false)
    const { usuario } = useAuth()
    const idUsuario = usuario?.id
    const navigate = useNavigate()
    const finRef = useRef(null)
    const sessionId = useRef(null)

    useEffect(() => {
        sessionId.current = idUsuario ? obtenerSessionId(idUsuario) : null
        setAbierto(false)
        setMensajes([])
        setTexto('')
    }, [idUsuario])

    useEffect(() => {
        if (usuario && abierto && mensajes.length === 0 && sessionId.current) {
            obtenerHistorialChat(sessionId.current)
                .then((data) => {
                    if (data.mensajes.length > 0) {
                        setMensajes(data.mensajes)
                    } else {
                        setMensajes([{
                            remitente: 'asistente',
                            contenido: '¡Hola! Soy el asistente de Trazo Oscuro. ¿En qué puedo ayudarte hoy? Puedo contarte sobre nuestros servicios, productos, horarios o el proceso de reserva.',
                        }])
                    }
                })
                .catch(() => {
                    setMensajes([{ remitente: 'asistente', contenido: '¡Hola! ¿En qué puedo ayudarte?' }])
                })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abierto, usuario])

    useEffect(() => {
        finRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [mensajes])

    const enviar = async (e) => {
        e.preventDefault()
        const mensaje = texto.trim()
        if (!mensaje || enviando) return

        setMensajes((prev) => [...prev, { remitente: 'cliente', contenido: mensaje }])
        setTexto('')
        setEnviando(true)

        try {
            const data = await enviarMensajeChat(sessionId.current, mensaje)
            setMensajes((prev) => [...prev, {
                remitente: 'asistente',
                contenido: data.respuesta,
                origen: data.origen,
            }])
        } catch (err) {
            setMensajes((prev) => [...prev, {
                remitente: 'asistente',
                contenido: err.message || 'Tuvimos un problema para responder. Intenta de nuevo en un momento.',
                esError: true,
            }])
        } finally {
            setEnviando(false)
        }
    }

    const irAPQR = () => {
        setAbierto(false)
        navigate(usuario ? '/cliente/pqr' : '/login')
    }

    if (!usuario) return null

    return (
        <>
            <button
                onClick={() => setAbierto(!abierto)}
                className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full border border-acento-suave/40 bg-acento text-texto flex items-center justify-center shadow-[0_12px_35px_rgba(185,28,28,0.35)] transition-all hover:-translate-y-1 hover:bg-red-800 cursor-pointer"
                aria-label="Abrir asistente virtual"
            >
                {abierto ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M 5 5 L 19 19 M 19 5 L 5 19" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                ) : (
                    <Icon nombre="chat" size={25} />
                )}
            </button>

            {abierto && (
                <div className="fixed bottom-24 left-6 z-50 w-[calc(100vw-3rem)] max-w-sm h-[70vh] max-h-540px bg-superficie border border-borde rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="bg-fondo px-5 py-4 border-b border-borde flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-acento/15 text-acento-suave flex items-center justify-center"><Icon nombre="chat" size={18} /></span>
                            <div><p className="text-texto font-serif text-base">Asistente Trazo Oscuro</p><p className="text-texto-secundario text-[10px] uppercase tracking-[0.14em] mt-0.5">Catálogo y reservas · IA</p></div>
                        </div>
                        <button onClick={irAPQR} className="text-acento text-xs hover:underline cursor-pointer">
                            Registrar PQR
                        </button>
                    </div>

                    <div className="panel-scrollbar flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-[radial-gradient(circle_at_top_right,rgba(185,28,28,0.1),transparent_13rem)]">
                        {mensajes.map((m, i) => (
                            <div
                                key={i}
                                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-5 ${
                                    m.remitente === 'cliente'
                                        ? 'self-end rounded-br-sm bg-acento text-texto'
                                        : m.esError
                                            ? 'self-start rounded-bl-sm border border-acento/50 bg-acento/10 text-acento-suave'
                                            : 'self-start rounded-bl-sm border border-borde bg-fondo text-texto'
                                }`}
                            >
                                <span className="whitespace-pre-line">{m.contenido}</span>
                                {m.remitente === 'asistente' && m.origen === 'ia' && (
                                    <p className="mt-2 pt-2 border-t border-borde/70 text-[10px] uppercase tracking-[0.12em] text-texto-secundario">
                                        Respuesta generada por IA
                                    </p>
                                )}
                            </div>
                        ))}
                        {enviando && (
                            <div className="self-start border border-borde bg-fondo text-texto-secundario text-sm px-3 py-2 rounded-2xl rounded-bl-sm">
                                El asistente está escribiendo...
                            </div>
                        )}
                        <div ref={finRef} />
                    </div>

                    <form onSubmit={enviar} className="p-3 border-t border-borde bg-fondo flex gap-2">
                        <input
                            value={texto}
                            onChange={(e) => setTexto(e.target.value)}
                            placeholder="Escribe tu mensaje..."
                            maxLength={1000}
                            className="flex-1 min-w-0 bg-superficie border border-borde rounded-xl px-3 py-2.5 text-texto text-sm focus:outline-none focus:border-acento"
                        />
                        <button
                            type="submit"
                            disabled={enviando}
                            className="w-10 h-10 shrink-0 bg-acento text-texto rounded-xl flex items-center justify-center hover:bg-red-800 transition-colors disabled:opacity-50 cursor-pointer"
                            aria-label="Enviar mensaje"
                        >
                            <Icon nombre="enviar" size={17} />
                        </button>
                    </form>
                </div>
            )}
        </>
    )
}
