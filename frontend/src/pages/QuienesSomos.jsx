import imagenEstudio from '../assets/images/imagen4.jpg'

const valores = [
    { id: 1, titulo: 'Higiene', descripcion: 'Protocolos estrictos de bioseguridad en cada sesión, sin excepciones.' },
    { id: 2, titulo: 'Compromiso artístico', descripcion: 'Cada diseño se estudia y se adapta a la anatomía y la idea del cliente.' },
    { id: 3, titulo: 'Personalización', descripcion: 'No repetimos diseños. Cada tatuaje es único para quien lo lleva.' },
    { id: 4, titulo: 'Respeto por la piel', descripcion: 'Acompañamiento antes, durante y después de cada sesión.' },
]

export const QuienesSomos = () => {
    return (
        <div className="page-shell pt-28 pb-24">
            <div className="page-content max-w-6xl mx-auto px-6">
                <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center mb-24">
                    <div className="reveal-up">
                        <span className="eyebrow">Desde 2018</span>
                        <h1 className="editorial-title text-texto text-5xl sm:text-6xl md:text-7xl mt-5 mb-6">El arte de dejar una marca con sentido.</h1>
                        <p className="text-texto-secundario leading-relaxed text-base sm:text-lg max-w-xl">
                            Trazo Oscuro es un estudio de tatuaje dedicado al arte de convertir ideas en piezas permanentes.
                        </p>
                    </div>
                    <div className="relative h-96 sm:h-120 rounded-2xl overflow-hidden border border-borde reveal-up reveal-delay-1">
                        <img src={imagenEstudio} alt="Trabajo artístico en Trazo Oscuro" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-linear-to-t from-fondo/85 via-transparent to-transparent" />
                        <p className="absolute bottom-5 left-5 text-texto text-sm tracking-wide">Ideas, técnica y piel.</p>
                    </div>
                </section>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-xl border border-borde bg-borde mb-24 reveal-up reveal-delay-2">
                    {[['08+', 'Años creando'], ['500+', 'Historias marcadas'], ['03', 'Artistas residentes'], ['100%', 'Cuidado e higiene']].map(([numero, texto]) => (
                        <div key={texto} className="bg-superficie p-5 sm:p-7"><p className="text-acento-suave font-serif text-3xl sm:text-4xl">{numero}</p><p className="text-texto-secundario text-xs sm:text-sm mt-2">{texto}</p></div>
                    ))}
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 mb-24">
                    <div>
                        <span className="eyebrow">Nuestra historia</span>
                        <h2 className="editorial-title text-texto text-4xl mt-5 mb-5">Un espacio pequeño que aprendió a pensar en grande.</h2>
                    </div>
                    <p className="text-texto-secundario leading-relaxed text-base sm:text-lg pt-1">
                        Nacimos en 2018 como un pequeño espacio compartido entre tres tatuadores con
                        estilos muy distintos entre sí. Con el tiempo, ese espacio creció hasta convertirse
                        en un estudio propio, con equipo especializado y un ambiente pensado para que cada
                        cliente se sienta cómodo antes de marcar su piel para siempre.
                    </p>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-px overflow-hidden rounded-2xl border border-borde bg-borde mb-24">
                    <div className="bg-superficie p-8 sm:p-10">
                        <span className="text-acento-suave text-xs font-bold tracking-[0.18em] uppercase">01 / Misión</span>
                        <h2 className="text-texto font-serif text-3xl mt-5 mb-4">Crear con intención.</h2>
                        <p className="text-texto-secundario text-sm leading-relaxed">
                            Ofrecer tatuajes de alta calidad artística y técnica, en un ambiente seguro,
                            higiénico y cercano, respetando la visión de cada cliente.
                        </p>
                    </div>
                    <div className="bg-superficie-clara p-8 sm:p-10">
                        <span className="text-acento-suave text-xs font-bold tracking-[0.18em] uppercase">02 / Visión</span>
                        <h2 className="text-texto font-serif text-3xl mt-5 mb-4">Ser parte de tu historia.</h2>
                        <p className="text-texto-secundario text-sm leading-relaxed">
                            Ser reconocidos como uno de los estudios de referencia en la ciudad, por la
                        calidad de nuestro trabajo y el cuidado en cada detalle del proceso.
                        </p>
                    </div>
                </section>

                <section>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
                        <div><span className="eyebrow">Lo que nos guía</span><h2 className="editorial-title text-texto text-4xl mt-4">Nuestros valores</h2></div>
                        <p className="text-texto-secundario text-sm max-w-sm">La técnica importa. También importa cómo hacemos sentir a quien confía su piel en nosotros.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {valores.map((valor) => (
                        <div key={valor.id} className="group p-6 rounded-xl bg-superficie border border-borde hover:border-acento/70 transition-colors duration-300">
                            <div className="flex items-center justify-between mb-5"><span className="text-acento-suave font-serif text-2xl">0{valor.id}</span><span className="w-8 h-px bg-borde group-hover:bg-acento transition-colors" /></div>
                            <h3 className="text-texto font-medium text-lg mb-2">{valor.titulo}</h3>
                            <p className="text-texto-secundario text-sm leading-relaxed">
                            {valor.descripcion}
                            </p>
                        </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    )
}