export const Button = ({ children, type = 'button', onClick, variant = 'primario', fullWidth = false, disabled = false }) => {
    const variantes = {
        primario: 'bg-acento text-texto hover:bg-red-800',
        secundario: 'bg-transparent border border-borde text-texto hover:border-acento hover:text-acento',
        texto: 'bg-transparent text-acento hover:underline p-0',
    }
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${variantes[variant]} ${fullWidth ? 'w-full' : ''} px-5 py-2.5 rounded-md text-sm sm:text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}>
            {children}
        </button>
    )
}