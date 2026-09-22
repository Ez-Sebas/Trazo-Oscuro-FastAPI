export const descargarBlob = (blob, nombreArchivo, abrirEnPestana = false) => {
    const url = window.URL.createObjectURL(blob)

    if (abrirEnPestana) {
        window.open(url, '_blank')
    } else {
        const enlace = document.createElement('a')
        enlace.href = url
        enlace.download = nombreArchivo
        document.body.appendChild(enlace)
        enlace.click()
        enlace.remove()
    }

    setTimeout(() => window.URL.revokeObjectURL(url), 5000)
}