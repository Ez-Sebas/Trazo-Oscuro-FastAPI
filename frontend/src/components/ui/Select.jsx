export const Select = ({ label, value, onChange, error, name, options }) => {
    return (
        <div className="flex flex-col gap-1 w-full">
            <label htmlFor={name} className="text-texto-secundario text-xs sm:text-sm">
                {label}
            </label>
            <select id={name} name={name} value={value} onChange={onChange} className={`bg-fondo border rounded-md px-3 py-2 text-texto text-sm w-full focus:outline-none transition-colors cursor-pointer ${ error ? 'border-red-500' : 'border-borde focus:border-acento'}`}>
                <option value="" disabled>
                    Selecciona una opción
                </option>
                {options.map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>
                        {opcion.label}
                    </option>
                ))}
            </select>
            {error && (
                <span className="text-red-500 text-xs">{error}</span>
            )}
        </div>
    )
}