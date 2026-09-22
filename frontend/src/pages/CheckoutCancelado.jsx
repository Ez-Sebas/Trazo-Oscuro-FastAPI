import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon.jsx'

export const CheckoutCancelado = () => (
    <div className="page-shell min-h-screen flex items-center justify-center px-6 py-24">
        <div className="page-content w-full max-w-lg border border-borde bg-superficie/90 p-8 sm:p-12 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-400/10 text-amber-300 flex items-center justify-center mb-5"><Icon nombre="cerrarMenu" size={27} /></div>
            <p className="eyebrow justify-center mb-3">Pago no completado</p>
            <h1 className="text-texto font-serif text-3xl mb-3">Pago cancelado</h1>
            <p className="text-texto-secundario text-sm leading-6 mb-7">No se realizó ningún cargo. Tus productos siguen guardados en el carrito.</p>
            <Link to="/productos" className="inline-flex items-center gap-2 bg-acento text-texto text-sm px-5 py-3 rounded-md hover:bg-red-800 transition-colors">Volver a productos <Icon nombre="adelante" size={15} /></Link>
        </div>
    </div>
)