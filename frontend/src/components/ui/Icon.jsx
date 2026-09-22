const trazos = {
    inicio: 'M3 10.5 12 3l9 7.5V21H14v-6H10v6H3v-10.5Z',
    usuarios: 'M4 20v-1.5A3.5 3.5 0 0 1 7.5 15h3A3.5 3.5 0 0 1 14 18.5V20M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 8a2.5 2.5 0 1 1 0 5M17 15h.5A3.5 3.5 0 0 1 21 18.5V20',
    productos: 'M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9ZM4.5 7.5 12 12l7.5-4.5M12 12v9',
    servicios: 'M6 4h12M5 8h14M7 12h10M9 16h6M11 20h2',
    citas: 'M6 3v3M18 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM8 13h3M8 16h5',
    ventas: 'M3 4h2l2.2 10.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 2-1.5L21 8H6M10 20h.01M17 20h.01',
    facturas: 'M6 3h9l3 3v15H6V3ZM15 3v4h4M9 12h6M9 16h6',
    reportes: 'M5 20V10M12 20V4M19 20v-7',
    pqr: 'M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H11l-4 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM8 9h8M8 13h5',
    chat: 'M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5h-7L6 20v-4.5A2.5 2.5 0 0 1 4 13V5.5ZM8 9h.01M12 9h.01M16 9h.01',
    enviar: 'm4 4 16 8-16 8 3-8-3-8ZM7 12h8',
    perfil: 'M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5 21a7 7 0 0 1 14 0',
    cerrar: 'M9 5 16 12l-7 7M16 12H3',
    flecha: 'M5 12h14M13 6l6 6-6 6',
    mas: 'M12 5v14M5 12h14',
    menos: 'M5 12h14',
    cerrarMenu: 'M6 6l12 12M18 6 6 18',
    carrito: 'M3 4h2l2.2 10.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 2-1.5L21 8H6M10 20h.01M17 20h.01',
    buscar: 'm21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z',
    editar: 'M4 20h4l11-11a2.12 2.12 0 0 0-3-3L5 17l-1 3ZM14.5 7.5l2 2',
    eliminar: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    check: 'm5 12 4 4L19 6',
    filtro: 'M4 6h16M7 12h10M10 18h4',
    menu: 'M4 6h16M4 12h16M4 18h16',
    atras: 'M19 12H5M11 6l-6 6 6 6',
    adelante: 'M5 12h14M13 6l6 6-6 6',
}

export const Icon = ({ nombre, size = 20, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
    >
        <path d={trazos[nombre] || trazos.perfil} />
    </svg>
)
