import { useState, useEffect } from 'react'
import imagen1 from '../assets/images/imagen1.jpg'
import imagen2 from '../assets/images/imagen2.jpg'
import imagen3 from '../assets/images/imagen3.jpg'
import imagen4 from '../assets/images/imagen4.jpg'
import imagen5 from '../assets/images/imagen5.jpg'
import imagen6 from '../assets/images/imagen6.jpg'
import imagen7 from '../assets/images/imagen7.jpg'
import imagen8 from '../assets/images/imagen8.jpg'
import imagen9 from '../assets/images/imagen9.jpg'
import imagen10 from '../assets/images/imagen10.jpg'
import arrowR from '../assets/icons/arrow_right.svg'
import arrowL from '../assets/icons/arrow_left.svg'

const galeria = [
    { id: 1, img: imagen1, titulo: 'El arte en la piel', descripcion: 'Cada tatuaje es una obra única, pensada y trazada con precisión.' },
    { id: 2, img: imagen2, titulo: 'Precisión en cada trazo', descripcion: 'Líneas limpias y firmes, resultado de años de experiencia.' },
    { id: 3, img: imagen3, titulo: 'Tinta que perdura', descripcion: 'Materiales de calidad para un tatuaje que se mantiene en el tiempo.' },
    { id: 4, img: imagen4, titulo: 'Manos que crean', descripcion: 'Nuestros artistas convierten ideas en piezas permanentes.' },
    { id: 5, img: imagen5, titulo: 'Un espacio para el arte', descripcion: 'Un estudio pensado para que vivas la experiencia con tranquilidad.' },
    { id: 6, img: imagen6, titulo: 'Detalle y dedicación', descripcion: 'Nada se deja al azar, cada sombra y línea tiene su propósito.' },
    { id: 7, img: imagen7, titulo: 'Historias en la piel', descripcion: 'Cada cliente llega con una idea, se va con una historia.' },
    { id: 8, img: imagen8, titulo: 'Compromiso con la técnica', descripcion: 'Formación constante para ofrecer siempre el mejor resultado.' },
    { id: 9, img: imagen9, titulo: 'Ambiente y confianza', descripcion: 'Higiene, comodidad y buena energía en cada sesión.' },
    { id: 10, img: imagen10, titulo: 'Más que un tatuaje', descripcion: 'Una experiencia que dejamos marcada, dentro y fuera de la piel.' },
]

export const Carousel = () => {
    const [indice, setIndice] = useState(0)
    const [enPausa, setEnPausa] = useState(false)

    const anterior = () => {
        setIndice(indice === 0 ? galeria.length - 1 : indice - 1)
    }

    const siguiente = () => {
        setIndice((prev) => (prev === galeria.length - 1 ? 0 : prev + 1))
    }

    useEffect(() => {
        if (enPausa) return

        const intervalo = setInterval(() => {
            siguiente()
        }, 4500)

        return () => clearInterval(intervalo)
    }, [indice, enPausa])

    return (
        <div
            className="relative w-full h-[70vh] sm:h-[80vh] md:h-screen overflow-hidden"
            onMouseEnter={() => setEnPausa(true)}
            onMouseLeave={() => setEnPausa(false)}
        >

            {galeria.map((item, i) => (
                <div key={item.id} className={`absolute inset-0 transition-opacity duration-700 ${i === indice ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <img src={item.img} alt={item.titulo} className="w-full h-full object-cover" />

                    <div className="absolute inset-0 bg-linear-to-t from-fondo via-fondo/50 to-transparent" />

                    <div className="absolute bottom-20 sm:bottom-16 left-0 w-full px-6">
                        <div className="max-w-6xl mx-auto">
                            <h2 className="text-texto font-serif text-xl sm:text-3xl md:text-5xl mb-2 sm:mb-3">
                                {item.titulo}
                            </h2>
                            <p className="text-texto-secundario text-sm sm:text-base md:text-lg max-w-xs sm:max-w-xl">
                                {item.descripcion}
                            </p>
                        </div>
                    </div>
                </div>
            ))}

            <button
                onClick={anterior}
                className="absolute top-1/2 left-2 sm:left-4 -translate-y-1/2 bg-fondo/60 hover:bg-acento/60 text-texto w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-2xl transition-colors z-10 cursor-pointer"
            >
                <img src={arrowL} alt="Anterior" className='h-3 w-3 sm:h-4 sm:w-4' />
            </button>

            <button
                onClick={siguiente}
                className="absolute top-1/2 right-2 sm:right-4 -translate-y-1/2 bg-fondo/60 hover:bg-acento/60 text-texto w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-2xl transition-colors z-10 cursor-pointer"
            >
                <img src={arrowR} alt="Siguiente" className='h-3 w-3 sm:h-4 sm:w-4' />
            </button>

            <div className="absolute bottom-6 left-0 w-full flex justify-center gap-2 z-10">
                {galeria.map((item, i) => (
                    <button key={item.id} onClick={() => setIndice(i)} className={`h-2 rounded-full transition-all duration-500 hover:-translate-y-1 ${i === indice ? 'w-8 bg-acento' : 'w-2 bg-texto-secundario cursor-pointer'}`} />
                ))}
            </div>

        </div>
    )
}