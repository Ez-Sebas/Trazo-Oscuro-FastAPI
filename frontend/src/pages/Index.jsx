import { Link } from 'react-router-dom'
import { Carousel } from '../components/Carousel.jsx'
import { TattooStyles } from '../components/TattooStyles.jsx'

const estadisticas = [
    { numero: '8+', texto: 'Años de experiencia' },
    { numero: '500+', texto: 'Tatuajes realizados' },
    { numero: '3', texto: 'Artistas residentes' },
    { numero: '100%', texto: 'Materiales esterilizados' },
]

export const Index = () => {
    return (
        <div className="bg-fondo">
            <Carousel />
            <section className="max-w-6xl mx-auto px-6 py-12 sm:py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
                    {estadisticas.map((stat, i) => (
                        <div key={i} className="text-center p-3 sm:p-4 rounded-lg bg-fondo shadow-[0_4px_10px] text-acento transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                            <p className="text-acento font-serif text-3xl sm:text-4xl mb-2">
                                {stat.numero}
                            </p>
                            <p className="text-texto-secundario text-xs sm:text-sm">
                                {stat.texto}
                            </p>
                        </div>
                    ))}
                </div>
            </section>
            <TattooStyles />
            <section className="bg-fondo">
                <div className="max-w-6xl mx-auto px-6 py-14 sm:py-20">
                    <div className="max-w-2xl mx-auto text-center md:text-left md:mx-0">
                        <h2 className="text-texto font-serif text-2xl sm:text-3xl md:text-4xl mb-4">
                            Más que un estudio, una comunidad del arte
                        </h2>
                        <p className="text-texto-secundario mb-6 leading-relaxed text-sm sm:text-base">
                            En Trazo Oscuro creemos que cada tatuaje cuenta una historia. Conoce quiénes somos, nuestra trayectoria y la filosofía que nos define como estudio.
                        </p>
                        <Link to="/quienes-somos" className="inline-block bg-acento text-texto px-6 py-3 rounded-md hover:bg-red-800 transition-colors text-sm sm:text-base">
                            Conócenos
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}