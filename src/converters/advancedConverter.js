const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const { detectPdfType } = require('../utils/pdfDetector');
const { processPdfWithOcr, cleanupOcrTemp } = require('../utils/ocrProcessor');
const { generateDocxFromOcrPages } = require('../utils/docxGenerator');
const config = require('../config');

const execAsync = promisify(exec);

/**
 * CONVERSOR AVANZADO
 * Usa LibreOffice para PDFs digitales y Tesseract OCR para PDFs escaneados
 * Similar a la calidad de iLovePDF
 */
class AdvancedConverter {
  constructor() {
    this.name = 'AdvancedConverter';
  }

  /**
   * Convierte un PDF a DOCX usando el método avanzado
   * @param {string} pdfPath - Ruta al archivo PDF
   * @param {string} outputPath - Ruta donde guardar el DOCX
   * @returns {Promise<Object>} - Resultado de la conversión
   */
  async convert(pdfPath, outputPath) {
    const startTime = Date.now();
    console.log(`\n🚀 Iniciando conversión avanzada: ${path.basename(pdfPath)}`);

    try {
      // Paso 1: Detectar tipo de PDF
      console.log('🔍 Analizando tipo de PDF...');
      const pdfInfo = await detectPdfType(pdfPath);
      
      console.log(`📊 Análisis:
  - Páginas: ${pdfInfo.pageCount}
  - Caracteres: ${pdfInfo.textLength}
  - Densidad de texto: ${pdfInfo.textDensityPerPage} chars/página
  - Porcentaje de texto: ${pdfInfo.textPercentage}%
  - ¿Es escaneado?: ${pdfInfo.isScanned ? 'SÍ' : 'NO'}`);

      let result;

      if (pdfInfo.isScanned) {
        // PDF escaneado → usar OCR
        console.log('📸 PDF escaneado detectado, usando OCR...');
        result = await this.convertWithOcr(pdfPath, outputPath, startTime);
      } else if (config.libreoffice.available) {
        // PDF digital → usar LibreOffice
        console.log('📄 PDF digital detectado, usando LibreOffice...');
        try {
          result = await this.convertWithLibreOffice(pdfPath, outputPath, startTime);
        } catch (libreError) {
          // Si LibreOffice falla, usar conversor básico como fallback
          console.log('⚠️  LibreOffice falló, usando conversor básico...');
          const BasicConverter = require('./basicConverter');
          const basicConverter = new BasicConverter();
          result = await basicConverter.convert(pdfPath, outputPath);
        }
      } else {
        // Fallback a básico
        console.log('📄 Usando conversor básico...');
        const BasicConverter = require('./basicConverter');
        const basicConverter = new BasicConverter();
        result = await basicConverter.convert(pdfPath, outputPath);
      }

      return result;
    } catch (error) {
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.error('❌ Error en conversión avanzada:', error.message);
      
      return {
        success: false,
        method: 'advanced-converter',
        error: error.message,
        duration
      };
    }
  }

  /**
   * Convierte PDF preservando estructura visual con imágenes (desactivado por ahora)
   * @deprecated - Usar LibreOffice directamente
   */
  async convertWithImagePreservation(pdfPath, outputPath, startTime) {
    throw new Error('Método de preservación con imágenes desactivado. Usar LibreOffice directamente.');
  }

  /**
   * Convierte PDF digital usando LibreOffice
   * @param {string} pdfPath - Ruta al archivo PDF
   * @param {string} outputPath - Ruta donde guardar el DOCX
   * @param {number} startTime - Timestamp de inicio
   * @returns {Promise<Object>} - Resultado de la conversión
   */
  async convertWithLibreOffice(pdfPath, outputPath, startTime) {
    if (!config.libreoffice.available) {
      throw new Error('LibreOffice no está disponible. Instálalo o usa el modo básico.');
    }

    try {
      console.log('⚙️  Ejecutando LibreOffice en modo headless...');
      
      const outputDir = path.dirname(outputPath);
      const pdfBaseName = path.basename(pdfPath, '.pdf');
      const expectedOutput = path.join(outputDir, `${pdfBaseName}.docx`);

      // Comando mejorado para LibreOffice (compatible con Windows)
      // Usa --norestore y --invisible para mejor compatibilidad
      const command = `"${config.libreoffice.path}" --headless --convert-to docx:"MS Word 2007 XML" --outdir "${outputDir}" --norestore --invisible "${pdfPath}"`;
      
      console.log(`Ejecutando LibreOffice...`);
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 180000, // 3 minutos de timeout (LibreOffice puede ser lento)
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        shell: 'cmd.exe' // Usar cmd.exe en Windows para mejor compatibilidad
      });

      if (stderr && stderr.trim()) {
        console.log('LibreOffice stderr:', stderr.substring(0, 500));
      }
      if (stdout && stdout.trim()) {
        console.log('LibreOffice stdout:', stdout.substring(0, 500));
      }

      // Esperar un poco a que el archivo sea escrito
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verificar si el archivo fue creado
      let generatedFile = null;
      
      if (fs.existsSync(expectedOutput)) {
        generatedFile = expectedOutput;
        console.log('✓ Archivo generado por LibreOffice encontrado:', generatedFile);
      } else {
        // Buscar archivos .docx recientes en el directorio de salida
        const files = fs.readdirSync(outputDir)
          .filter(f => f.endsWith('.docx'))
          .map(f => ({
            name: f,
            path: path.join(outputDir, f),
            time: fs.statSync(path.join(outputDir, f)).mtimeMs
          }))
          .sort((a, b) => b.time - a.time);
        
        if (files.length > 0) {
          generatedFile = files[0].path;
          console.log('✓ Archivo DOCX encontrado en directorio:', generatedFile);
        }
      }

      if (!generatedFile || !fs.existsSync(generatedFile)) {
        throw new Error('LibreOffice no generó el archivo DOCX. Verifica que el PDF sea válido.');
      }

      // Renombrar a la ubicación esperada si es diferente
      if (generatedFile !== outputPath) {
        fs.renameSync(generatedFile, outputPath);
      }

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`✅ Conversión con LibreOffice completada en ${duration}s`);
      
      return {
        success: true,
        method: 'libreoffice',
        outputPath,
        duration,
        message: 'PDF convertido usando LibreOffice (alta calidad)'
      };
    } catch (error) {
      throw new Error(`Error en conversión con LibreOffice: ${error.message}`);
    }
  }

  /**
   * Convierte PDF escaneado usando OCR
   * @param {string} pdfPath - Ruta al archivo PDF
   * @param {string} outputPath - Ruta donde guardar el DOCX
   * @param {number} startTime - Timestamp de inicio
   * @returns {Promise<Object>} - Resultado de la conversión
   */
  async convertWithOcr(pdfPath, outputPath, startTime) {
    if (!config.tesseract.available) {
      throw new Error('Tesseract OCR no está disponible. Instálalo o usa el modo básico.');
    }

    const tempDir = path.join(config.directories.temp, `ocr_${Date.now()}`);

    try {
      // Procesar PDF con OCR
      const ocrResults = await processPdfWithOcr(pdfPath, tempDir);
      
      // Generar DOCX desde resultados OCR
      console.log('📝 Generando DOCX desde resultados OCR...');
      await generateDocxFromOcrPages(ocrResults, outputPath);
      
      // Limpiar archivos temporales
      cleanupOcrTemp(tempDir);
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      // Calcular estadísticas
      const totalChars = ocrResults.reduce((sum, page) => sum + page.text.length, 0);
      
      console.log(`✅ Conversión con OCR completada en ${duration}s`);
      console.log(`   Total de caracteres extraídos: ${totalChars}`);
      
      return {
        success: true,
        method: 'tesseract-ocr',
        outputPath,
        duration,
        pageCount: ocrResults.length,
        totalCharacters: totalChars,
        message: 'PDF escaneado convertido usando Tesseract OCR'
      };
    } catch (error) {
      // Limpiar en caso de error
      if (fs.existsSync(tempDir)) {
        cleanupOcrTemp(tempDir);
      }
      
      throw error;
    }
  }

  /**
   * Verifica si el conversor avanzado está disponible
   * @returns {boolean}
   */
  isAvailable() {
    return config.libreoffice.available || config.tesseract.available;
  }

  /**
   * Retorna las capacidades disponibles
   * @returns {Object}
   */
  getCapabilities() {
    return {
      libreoffice: config.libreoffice.available,
      ocr: config.tesseract.available
    };
  }
}

module.exports = AdvancedConverter;