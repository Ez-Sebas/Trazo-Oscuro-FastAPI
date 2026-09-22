import { Link } from 'react-router-dom'
import { Carousel } from '../components/Carousel.jsx'
import { TattooStyles } from '../components/TattooStyles.jsx'
import { Icon } from '../components/ui/Icon.jsx'

const estadisticas = [
    { numero: '8+', texto: 'Años de experiencia' },
    { numero: '500+', texto: 'Tatuajes realizados' },
    { numero: '3', texto: 'Artistas residentes' },
    { numero: '100%', texto: 'Materiales esterilizados' },
]

export const Index = () => {
    return (
        <div className="page-shell">
            <Carousel />
            <section className="page-content max-w-6xl mx-auto px-6 py-10 sm:py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-borde bg-borde">
                    {estadisticas.map((stat, i) => (
                        <div key={i} className="text-center p-4 sm:p-6 bg-superficie hover:bg-superficie-clara transition-colors">
                            <p className="text-acento-suave font-serif text-3xl sm:text-4xl mb-2">
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
            <section className="page-content border-t border-borde">
                <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24 grid md:grid-cols-[1fr_auto] gap-8 items-end">
                    <div className="max-w-2xl">
                        <span className="eyebrow">La filosofía del estudio</span>
                        <h2 className="editorial-title text-texto text-4xl sm:text-5xl mt-5 mb-4">Más que un estudio, una comunidad del arte.</h2>
                        <p className="text-texto-secundario mb-6 leading-relaxed text-sm sm:text-base">
                            En Trazo Oscuro creemos que cada tatuaje cuenta una historia. Conoce quiénes somos, nuestra trayectoria y la filosofía que nos define como estudio.
                        </p>
                        <Link to="/quienes-somos" className="inline-flex items-center gap-3 bg-acento text-texto px-6 py-3 rounded-lg hover:bg-red-800 transition-colors text-sm sm:text-base">
                            Conócenos
                            <Icon nombre="adelante" size={16} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}