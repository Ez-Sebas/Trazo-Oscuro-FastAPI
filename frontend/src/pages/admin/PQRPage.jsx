import { useState, useEffect, useCallback } from 'react'
import { obtenerPQR, marcarEnProceso, responderPQR } from '../../services/pqrService.js'
import { Modal } from '../../components/ui/Modal.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'

export const PQRPage = () => {
    const [pqrs, setPqrs] = useState([])
    const [cargando, setCargando] = useState(true)

    const [busqueda, setBusqueda] = useState('')
    const [filtroTipo, setFiltroTipo] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')
    const [pagina, setPagina] = useState(1)
    const [totalPaginas, setTotalPaginas] = useState(1)

    const [modalAbierto, setModalAbierto] = useState(false)
    const [pqrSeleccionada, setPqrSeleccionada] = useState(null)
    const [respuesta, setRespuesta] = useState('')
    const [errorRespuesta, setErrorRespuesta] = useState('')

    const cargar = useCallback(async () => {
        setCargando(true)
        try {
            const data = await obtenerPQR({ busqueda, tipo: filtroTipo, estado: filtroEstado, pagina, por_pagina: 12 })
            setPqrs(data.pqrs)
            setTotalPaginas(data.total_paginas)
        } finally {
            setCargando(false)
        }
    }, [busqueda, filtroTipo, filtroEstado, pagina])

    useEffect(() => {
        const timer = setTimeout(cargar, 350)
        return () => clearTimeout(timer)
    }, [cargar])

    const iniciarProceso = async (id) => {
        try { await marcarEnProceso(id); cargar() } catch (err) { alert(err.message) }
    }

    const abrirResponder = (pqr) => {
        setPqrSeleccionada(pqr)
        setRespuesta('')
        setErrorRespuesta('')
        setModalAbierto(true)
    }

    const enviarRespuesta = async (e) => {
        e.preventDefault()
        if (respuesta.trim().length < 5) {
            setErrorRespuesta('La respuesta debe tener al menos 5 caracteres.')
            return
        }
        try {
            await responderPQR(pqrSeleccionada.id_pqr, respuesta.trim())
            setModalAbierto(false)
            cargar()
        } catch (err) {
            alert(err.message)
        }
    }

    return (
        <div className="max-w-7xl">
            <p className="eyebrow mb-3">Atención al cliente</p>
            <h1 className="text-texto font-serif text-2xl mb-2">Peticiones, Quejas y Reclamos</h1>
            <p className="text-texto-secundario text-sm mb-6">Gestiona las solicitudes registradas por los clientes.</p>

            <div className="border border-borde bg-superficie p-4 flex flex-wrap gap-3 mb-6">
                <input
                    value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }}
                    placeholder="Buscar por cliente o asunto..."
                    className="field flex-1 min-w-[180px]"
                />
                <select value={filtroTipo} onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1) }} className="field">
                    <option value="">Todos los tipos</option>
                    <option value="peticion">Petición</option>
                    <option value="queja">Queja</option>
                    <option value="reclamo">Reclamo</option>
                    <option value="sugerencia">Sugerencia</option>
                </select>
                <select value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1) }} className="field">
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="respondida">Respondida</option>
                    <option value="cerrada">Cerrada</option>
                </select>
            </div>

            <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo="Responder solicitud">
                {pqrSeleccionada && (
                    <form onSubmit={enviarRespuesta} className="flex flex-col gap-4">
                        <div className="bg-fondo rounded-md p-3">
                            <p className="text-texto text-sm font-medium">{pqrSeleccionada.asunto}</p>
                            <p className="text-texto-secundario text-sm mt-1">{pqrSeleccionada.descripcion}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-texto-secundario text-xs sm:text-sm">Tu respuesta</label>
                            <textarea
                                value={respuesta} onChange={(e) => setRespuesta(e.target.value)}
                                maxLength={500} rows={4}
                                className="bg-fondo border border-borde rounded-md px-3 py-2 text-texto text-sm resize-none focus:outline-none focus:border-acento"
                            />
                            {errorRespuesta && <span className="text-red-500 text-xs">{errorRespuesta}</span>}
                        </div>
                        <Button type="submit">Enviar respuesta</Button>
                    </form>
                )}
            </Modal>

            {cargando ? (
                <p className="text-texto-secundario">Cargando solicitudes...</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {pqrs.map((p) => (
                            <article key={p.id_pqr} className="border border-borde bg-superficie p-5 hover:border-acento/60 transition-colors">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div><p className="text-acento-suave text-[10px] font-bold tracking-[0.16em] uppercase mb-2">{p.tipo}</p><h3 className="text-texto font-serif text-xl">{p.asunto}</h3></div>
                                    <Badge estado={p.estado} />
                                </div>
                                <p className="text-texto-secundario text-xs mb-1">{p.cliente_nombre} · {p.tipo}</p>
                                <p className="text-texto-secundario text-sm mb-3">{p.descripcion}</p>
                                {p.respuesta && (
                                    <div className="bg-fondo rounded-md p-3 mb-3">
                                        <p className="text-texto-secundario text-xs mb-1">Tu respuesta:</p>
                                        <p className="text-texto text-sm">{p.respuesta}</p>
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    {p.estado === 'pendiente' && (
                                        <button onClick={() => iniciarProceso(p.id_pqr)} className="text-texto-secundario text-sm hover:text-acento cursor-pointer">Marcar en proceso</button>
                                    )}
                                    {(p.estado === 'pendiente' || p.estado === 'en_proceso') && (
                                        <button onClick={() => abrirResponder(p)} className="text-acento text-sm hover:underline cursor-pointer">Responder</button>
                                    )}
                                </div>
                            </article>
                        ))}
                        {pqrs.length === 0 && <p className="text-texto-secundario col-span-full text-center py-8">Sin resultados.</p>}
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
