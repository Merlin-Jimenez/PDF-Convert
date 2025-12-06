const path = require('path');
const fs = require('fs');
const { extractTextFromPdf } = require('../utils/pdfDetector');
const { generateDocxFromText, generateDocxFromTextAndImages } = require('../utils/docxGenerator');
const { pdfToImages } = require('../utils/pdfConverter');
const { createAdvancedDocx } = require('../utils/advancedPdfConverter');
const config = require('../config');

/**
 * CONVERSOR BÁSICO
 * Método rápido y simple que funciona sin LibreOffice ni Tesseract
 * Extrae texto del PDF y genera un DOCX básico
 * Si el PDF no tiene texto, incluye imágenes de las páginas
 */
class BasicConverter {
  constructor() {
    this.name = 'BasicConverter';
  }

  /**
   * Convierte un PDF a DOCX usando el método básico
   * @param {string} pdfPath - Ruta al archivo PDF
   * @param {string} outputPath - Ruta donde guardar el DOCX
   * @returns {Promise<Object>} - Resultado de la conversión
   */
  async convert(pdfPath, outputPath) {
    const startTime = Date.now();
    console.log(`\n🔧 Iniciando conversión básica: ${path.basename(pdfPath)}`);

    try {
      // NUEVA ESTRATEGIA: Preservar estructura usando imágenes de las páginas
      console.log('🎨 Creando conversión que preserva la estructura del PDF...');
      
      const result = await createAdvancedDocx(pdfPath, outputPath);
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`✅ Conversión básica completada en ${duration}s`);
      
      return {
        success: true,
        method: 'basic-structure-preserving',
        outputPath,
        duration,
        pageCount: result.pageCount,
        message: 'PDF convertido preservando la estructura visual original'
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.error('❌ Error en conversión básica:', error.message);
      
      // Fallback a método antiguo si falla el nuevo
      try {
        console.log('⚠️  Intentando con método de extracción de texto...');
        return await this.convertWithTextExtraction(pdfPath, outputPath, startTime);
      } catch (fallbackError) {
        return {
          success: false,
          method: 'basic-converter',
          error: error.message,
          duration
        };
      }
    }
  }

  /**
   * Método antiguo de extracción de texto (fallback)
   */
  async convertWithTextExtraction(pdfPath, outputPath, startTime) {
    try {
      // Paso 1: Extraer texto del PDF
      console.log('📄 Extrayendo texto del PDF...');
      const extractedText = await extractTextFromPdf(pdfPath);
      
      if (extractedText && extractedText.trim().length > 100) {
        // El PDF tiene texto suficiente, generar DOCX simple
        console.log(`✓ Texto extraído: ${extractedText.length} caracteres`);
        console.log('📝 Generando DOCX desde texto...');
        
        await generateDocxFromText(extractedText, outputPath);
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`✅ Conversión básica completada en ${duration}s`);
        
        return {
          success: true,
          method: 'basic-text-extraction',
          outputPath,
          duration,
          textLength: extractedText.length,
          message: 'PDF convertido usando extracción de texto básica'
        };
      } else {
        // El PDF tiene poco o ningún texto, incluir imágenes
        console.log('⚠️  Poco texto detectado, incluyendo imágenes de las páginas...');
        
        return await this.convertWithImages(pdfPath, outputPath, extractedText, startTime);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Convierte PDF a DOCX incluyendo imágenes de las páginas
   * @param {string} pdfPath - Ruta al archivo PDF
   * @param {string} outputPath - Ruta donde guardar el DOCX
   * @param {string} extractedText - Texto ya extraído
   * @param {number} startTime - Timestamp de inicio
   * @returns {Promise<Object>} - Resultado de la conversión
   */
  async convertWithImages(pdfPath, outputPath, extractedText, startTime) {
    const tempImagesDir = path.join(config.directories.temp, `basic_${Date.now()}`);
    
    try {
      // Crear directorio temporal
      if (!fs.existsSync(tempImagesDir)) {
        fs.mkdirSync(tempImagesDir, { recursive: true });
      }

      console.log('🖼️  Convirtiendo páginas a imágenes...');
      
      // Convertir PDF a imágenes
      const imagePaths = await pdfToImages(pdfPath, tempImagesDir, {
        width: 1200,
        height: 1600
      });
      
      console.log(`✓ ${imagePaths.length} páginas convertidas a imágenes`);
      console.log('📝 Generando DOCX con texto e imágenes...');
      
      // Generar DOCX con texto (si hay) e imágenes
      await generateDocxFromTextAndImages(extractedText || '', imagePaths, outputPath);
      
      // Limpiar archivos temporales
      fs.rmSync(tempImagesDir, { recursive: true, force: true });
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`✅ Conversión básica con imágenes completada en ${duration}s`);
      
      return {
        success: true,
        method: 'basic-with-images',
        outputPath,
        duration,
        pageCount: imagePaths.length,
        textLength: extractedText ? extractedText.length : 0,
        message: 'PDF convertido incluyendo imágenes de las páginas'
      };
    } catch (error) {
      // Limpiar en caso de error
      if (fs.existsSync(tempImagesDir)) {
        fs.rmSync(tempImagesDir, { recursive: true, force: true });
      }
      
      throw error;
    }
  }

  /**
   * Verifica si el conversor básico está disponible
   * @returns {boolean}
   */
  isAvailable() {
    return true; // El conversor básico siempre está disponible
  }
}

module.exports = BasicConverter;