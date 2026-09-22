import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { verificarPago } from '../services/ventaService.js'
import { useCart } from '../context/CartContext.jsx'
import { Icon } from '../components/ui/Icon.jsx'

export const CheckoutExito = () => {
    const [searchParams] = useSearchParams()
    const sessionId = searchParams.get('session_id')
    const { vaciarCarrito } = useCart()

    const [estado, setEstado] = useState(sessionId ? 'verificando' : 'error')
    const [idVenta, setIdVenta] = useState(null)

    useEffect(() => {
        if (!sessionId) {
            return
        }

        verificarPago(sessionId)
            .then((data) => {
                if (data.estado_pago === 'pagado') {
                    setIdVenta(data.id_venta)
                    setEstado('pagado')
                    vaciarCarrito()
                } else {
                    setEstado('pendiente')
                }
            })
            .catch(() => setEstado('error'))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId])

    return (
        <div className="page-shell min-h-screen flex items-center justify-center px-6 py-24">
            <div className="page-content w-full max-w-lg border border-borde bg-superficie/90 p-8 sm:p-12 text-center shadow-2xl">
            {estado === 'verificando' && (
                <><div className="w-14 h-14 mx-auto mb-5 rounded-full border border-acento/40 text-acento-suave flex items-center justify-center"><Icon nombre="carrito" size={23} /></div><p className="text-texto font-serif text-2xl mb-2">Verificando tu pago</p><p className="text-texto-secundario text-sm">Un momento, estamos confirmando la operación.</p></>
            )}

            {estado === 'pagado' && (
                <>
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-400/10 text-emerald-300 flex items-center justify-center mb-5"><Icon nombre="check" size={29} /></div>
                    <h1 className="text-texto font-serif text-2xl mb-3">¡Pago confirmado!</h1>
                    <p className="text-texto-secundario text-sm mb-6">
                        Tu venta #{idVenta} fue registrada correctamente. Te enviamos un correo de confirmación.
                    </p>
                </>
            )}

            {estado === 'pendiente' && (
                <>
                    <div className="w-16 h-16 mx-auto rounded-full bg-amber-400/10 text-amber-300 flex items-center justify-center mb-5"><Icon nombre="filtro" size={27} /></div><h1 className="text-texto font-serif text-2xl mb-3">Estamos confirmando tu pago</h1>
                    <p className="text-texto-secundario text-sm mb-6">
                        Esto puede tardar unos segundos. Revisa tu cuenta en unos minutos.
                    </p>
                </>
            )}

            {estado === 'error' && (
                <>
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-400/10 text-red-300 flex items-center justify-center mb-5"><Icon nombre="cerrarMenu" size={27} /></div><h1 className="text-texto font-serif text-2xl mb-3">No pudimos verificar tu pago</h1>
                    <p className="text-texto-secundario text-sm mb-6">
                        Si el dinero fue descontado, contáctanos y con gusto te ayudamos.
                    </p>
                </>
            )}

            <Link to="/" className="inline-flex items-center gap-2 text-acento-suave text-sm hover:text-texto transition-colors">Volver al inicio <Icon nombre="adelante" size={15} /></Link>
            </div>
        </div>
    )
}