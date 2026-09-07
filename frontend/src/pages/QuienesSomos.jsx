const valores = [
    { id: 1, titulo: 'Higiene', descripcion: 'Protocolos estrictos de bioseguridad en cada sesión, sin excepciones.' },
    { id: 2, titulo: 'Compromiso artístico', descripcion: 'Cada diseño se estudia y se adapta a la anatomía y la idea del cliente.' },
    { id: 3, titulo: 'Personalización', descripcion: 'No repetimos diseños. Cada tatuaje es único para quien lo lleva.' },
    { id: 4, titulo: 'Respeto por la piel', descripcion: 'Acompañamiento antes, durante y después de cada sesión.' },
]

export const QuienesSomos = () => {
    return (
        <div className="bg-fondo pt-28 pb-20">
            <div className="max-w-4xl mx-auto px-6">

                <div className="text-center mb-16">
                    <h1 className="text-texto font-serif text-4xl md:text-5xl mb-4">
                        ¿Quiénes Somos?
                    </h1>
                    <p className="text-texto-secundario text-lg">
                        La historia detrás de Trazo Oscuro
                    </p>
                </div>

                <section className="mb-14">
                    <p className="text-texto-secundario leading-relaxed text-base">
                        Trazo Oscuro es un estudio de tatuaje dedicado al arte de convertir ideas en piezas
                        permanentes. Creemos que cada tatuaje es una decisión importante, y por eso
                        acompañamos a cada cliente desde el primer boceto hasta la cicatrización final,
                        con la técnica, la higiene y el cuidado que ese proceso merece.
                    </p>
                </section>

                <section className="mb-14">
                    <h2 className="text-acento font-serif text-2xl mb-3">Nuestra Historia</h2>
                    <p className="text-texto-secundario leading-relaxed text-base">
                        Nacimos en 2018 como un pequeño espacio compartido entre tres tatuadores con
                        estilos muy distintos entre sí. Con el tiempo, ese espacio creció hasta convertirse
                        en un estudio propio, con equipo especializado y un ambiente pensado para que cada
                        cliente se sienta cómodo antes de marcar su piel para siempre.
                    </p>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    <div className="bg-superficie/50 shadow-[5px_5px_10px] text-borde rounded-lg p-6">
                        <h2 className="text-texto font-serif text-xl mb-3">Misión</h2>
                        <p className="text-texto-secundario text-sm leading-relaxed">
                            Ofrecer tatuajes de alta calidad artística y técnica, en un ambiente seguro,
                            higiénico y cercano, respetando la visión de cada cliente.
                        </p>
                    </div>
                    <div className="bg-superficie/50 shadow-[5px_5px_10px] text-borde rounded-lg p-6">
                        <h2 className="text-texto font-serif text-xl mb-3">Visión</h2>
                        <p className="text-texto-secundario text-sm leading-relaxed">
                            Ser reconocidos como uno de los estudios de referencia en la ciudad, por la
                        calidad de nuestro trabajo y el cuidado en cada detalle del proceso.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-texto font-serif text-2xl mb-8 text-center">
                        Nuestros Valores
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {valores.map((valor) => (
                        <div key={valor.id} className="p-4 rounded-lg bg-fondo shadow-[5px_5px_10px] text-acento transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                            <h3 className="text-acento font-medium mb-2">{valor.titulo}</h3>
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