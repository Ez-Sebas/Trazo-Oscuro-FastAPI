import { useState } from 'react'

export const Input = ({ label, type = 'text', value, onChange, error, name, placeholder, maxLength }) => {
    const [mostrarClave, setMostrarClave] = useState(false)
    const esContrasena = type === 'password'
    const tipoFinal = esContrasena && mostrarClave ? 'text' : type

    return (
        <div className="flex flex-col gap-1 w-full">
            <label htmlFor={name} className="text-texto-secundario text-xs sm:text-sm">
                {label}
            </label>

            <div className="relative w-full">
                <input
                    id={name}
                    name={name}
                    type={tipoFinal}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className={`bg-fondo border rounded-md px-3 py-2 text-texto text-sm w-full focus:outline-none transition-colors ${
                        esContrasena ? 'pr-10' : ''
                    } ${error ? 'border-red-500' : 'border-borde focus:border-acento'}`}
                />

                {esContrasena && (
                    <button
                        type="button"
                        onClick={() => setMostrarClave(!mostrarClave)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-texto-secundario hover:text-acento transition-colors cursor-pointer"
                        aria-label={mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                        {mostrarClave ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M3 3L21 21M10.5 10.7a2 2 0 002.8 2.8M7 7.3C4.7 8.9 3 12 3 12s3.5 7 9 7c1.6 0 3-.4 4.2-1.1M17.3 16.3C19.7 14.6 21 12 21 12s-3.5-7-9-7c-.6 0-1.2.05-1.8.16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M3 12S6.5 5 12 5s9 7 9 7-3.5 7-9 7-9-7-9-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.8" />
                            </svg>
                        )}
                    </button>
                )}
            </div>

            {error && (
                <span className="text-red-500 text-xs">{error}</span>
            )}
        </div>
    )
}