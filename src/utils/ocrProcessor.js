const tesseract = require('node-tesseract-ocr');
const { pdfToImages } = require('./pdfConverter');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const config = require('../config');


/**
 * Ejecuta OCR en una imagen
 * @param {string} imagePath - Ruta a la imagen
 * @returns {Promise<string>} - Texto extraído
 */
async function performOcr(imagePath) {
  try {
    const ocrConfig = {
      lang: config.tesseract.lang,
      oem: 1,
      psm: 3,
      tessedit_char_whitelist: '',
    };

    const text = await tesseract.recognize(imagePath, ocrConfig);
    return text;
  } catch (error) {
    console.error(`Error en OCR de ${imagePath}:`, error.message);
    return '';
  }
}

/**
 * Procesa un PDF completo con OCR
 * @param {string} pdfPath - Ruta al archivo PDF
 * @param {string} tempDir - Directorio temporal para imágenes
 * @returns {Promise<Array<Object>>} - Array de { pageNumber, text, imagePath }
 */
async function processPdfWithOcr(pdfPath, tempDir) {
  try {
    console.log('Iniciando proceso OCR...');
    
    // Crear directorio temporal para este PDF
    const pdfTempDir = path.join(tempDir, `ocr_${Date.now()}`);
    if (!fs.existsSync(pdfTempDir)) {
      fs.mkdirSync(pdfTempDir, { recursive: true });
    }

    // Convertir PDF a imágenes
    const imagePaths = await pdfToImages(pdfPath, pdfTempDir, {
      width: 2000,
      height: 2000,
      forOcr: true
    });
    
    // Procesar cada imagen con OCR
    const results = [];
    for (let i = 0; i < imagePaths.length; i++) {
      console.log(`Ejecutando OCR en página ${i + 1}/${imagePaths.length}...`);
      
      const text = await performOcr(imagePaths[i]);
      
      results.push({
        pageNumber: i + 1,
        text: text.trim(),
        imagePath: imagePaths[i]
      });
      
      console.log(`✓ Página ${i + 1} procesada (${text.trim().length} caracteres)`);
    }

    console.log(`✅ OCR completado: ${results.length} páginas procesadas`);
    return results;
  } catch (error) {
    throw new Error(`Error en proceso OCR: ${error.message}`);
  }
}

/**
 * Limpia archivos temporales de OCR
 * @param {string} tempDir - Directorio temporal a limpiar
 */
function cleanupOcrTemp(tempDir) {
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('✓ Archivos temporales de OCR eliminados');
    }
  } catch (error) {
    console.error('Error limpiando archivos temporales:', error.message);
  }
}

module.exports = {
  pdfToImages,
  performOcr,
  processPdfWithOcr,
  cleanupOcrTemp
};