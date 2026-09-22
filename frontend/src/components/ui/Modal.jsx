import { Icon } from './Icon.jsx'

export const Modal = ({ abierto, onCerrar, titulo, children, maxWidth = 'max-w-lg' }) => {
    if (!abierto) return null

    return (
        <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 px-4 py-6"
            onClick={onCerrar}
        >
            <div
                className={`bg-superficie rounded-lg w-full ${maxWidth} max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative`}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onCerrar}
                    className="absolute top-4 right-4 text-texto-secundario hover:text-acento text-xl cursor-pointer"
                    aria-label="Cerrar"
                >
                    <Icon nombre="cerrarMenu" size={18} />
                </button>
                {titulo && (
                    <h2 className="text-texto font-serif text-xl sm:text-2xl mb-6 text-center">
                        {titulo}
                    </h2>
                )}
                {children}
            </div>
        </div>
    )
}