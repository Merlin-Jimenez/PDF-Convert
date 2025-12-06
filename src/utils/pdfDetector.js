const pdfParse = require('pdf-parse');
const fs = require('fs');
const config = require('../config');

/**
 * Detecta si un PDF es escaneado (imagen) o digital (con texto)
 * @param {string} pdfPath - Ruta al archivo PDF
 * @returns {Promise<Object>} - { isScanned: boolean, textLength: number, pageCount: number }
 */
async function detectPdfType(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    
    const textLength = data.text.trim().length;
    const pageCount = data.numpages;
    
    // Calcular densidad de texto por página
    const textDensityPerPage = textLength / pageCount;
    
    // Si hay menos de X caracteres por página, probablemente es escaneado
    const minTextPerPage = 50;
    const isScanned = textDensityPerPage < minTextPerPage;
    
    // También verificar porcentaje de texto
    const estimatedCharsPerPage = 2000; // Promedio de caracteres en una página típica
    const expectedText = pageCount * estimatedCharsPerPage;
    const textPercentage = (textLength / expectedText) * 100;
    
    const isScannedByPercentage = textPercentage < config.detection.textThreshold;
    
    return {
      isScanned: isScanned || isScannedByPercentage,
      textLength,
      pageCount,
      textDensityPerPage: Math.round(textDensityPerPage),
      textPercentage: Math.round(textPercentage),
      hasText: textLength > 0
    };
  } catch (error) {
    console.error('Error detectando tipo de PDF:', error.message);
    // En caso de error, asumir que es escaneado para usar OCR
    return {
      isScanned: true,
      textLength: 0,
      pageCount: 0,
      error: error.message
    };
  }
}

/**
 * Extrae el texto de un PDF
 * @param {string} pdfPath - Ruta al archivo PDF
 * @returns {Promise<string>} - Texto extraído
 */
async function extractTextFromPdf(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extrayendo texto del PDF:', error.message);
    return '';
  }
}

module.exports = {
  detectPdfType,
  extractTextFromPdf
};