import realismo from '../assets/images/estilo-realismo.jpg'
import blackwork from '../assets/images/estilo-blackwork.jpg'
import fineline from '../assets/images/estilo-fineline.jpg'
import japones from '../assets/images/estilo-japones.jpg'

const estilos = [
    { id: 1, img: realismo, nombre: 'Realismo', descripcion: 'Retratos y figuras con sombreado detallado, casi fotográfico.' },
    { id: 2, img: blackwork, nombre: 'Blackwork', descripcion: 'Diseños sólidos en negro, geometría y contraste fuerte.' },
    { id: 3, img: fineline, nombre: 'Fine Line', descripcion: 'Líneas delgadas y delicadas, ideal para diseños minimalistas.' },
    { id: 4, img: japones, nombre: 'Japonés', descripcion: 'Tradición irezumi: dragones, olas y flores con gran detalle.' },
]

export const TattooStyles = () => {
    return (
        <section className="max-w-6xl mx-auto px-6 py-14 sm:py-20">
            <div className="text-center mb-10 sm:mb-12">
                <h2 className="text-texto font-serif text-2xl sm:text-3xl md:text-4xl mb-3">
                    Nuestros Estilos
                </h2>
                <p className="text-texto-secundario text-sm sm:text-base max-w-xl mx-auto">
                    Cada artista domina una técnica distinta, para que encuentres el estilo que mejor cuenta tu historia.
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6">
                {estilos.map((estilo) => (
                    <div key={estilo.id} className="group relative rounded-lg overflow-hidden h-64 sm:h-72">
                        <img src={estilo.img} alt={estilo.nombre} className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-linear-to-t from-fondo via-fondo/40 to-transparent" />
                        <div className="absolute bottom-0 left-0 w-full p-5">
                            <h3 className="text-texto font-serif text-lg sm:text-xl mb-1">
                                {estilo.nombre}
                            </h3>
                            <p className="text-texto-secundario text-sm">
                                {estilo.descripcion}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}