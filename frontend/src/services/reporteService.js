import { apiFetch, apiFetchBlob } from './api.js'

export const obtenerReporteDiario = (fecha) => apiFetch(`/reportes/ventas-diarias?fecha=${fecha}`)

export const descargarReportePdf = (fecha) => apiFetchBlob(`/reportes/ventas-diarias/pdf?fecha=${fecha}`)

export const descargarReporteExcel = (fecha) => apiFetchBlob(`/reportes/ventas-diarias/excel?fecha=${fecha}`)