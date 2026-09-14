export const ImageBox = ({ src, alt, aspecto = 'aspect-[4/3]' }) => (
    <div className={`w-full ${aspecto} bg-fondo overflow-hidden rounded-md`}>
        {src ? (
            <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-texto-secundario text-xs">Sin imagen</div>
        )}
    </div>
)