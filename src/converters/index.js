const BasicConverter = require('./basicConverter');
const AdvancedConverter = require('./advancedConverter');
const config = require('../config');

/**
 * ORQUESTADOR DE CONVERSIÓN
 * Decide automáticamente qué método usar según disponibilidad y configuración
 */
class ConverterOrchestrator {
  constructor() {
    this.basicConverter = new BasicConverter();
    this.advancedConverter = new AdvancedConverter();
  }

  /**
   * Convierte un PDF a DOCX usando el mejor método disponible
   * @param {string} pdfPath - Ruta al archivo PDF
   * @param {string} outputPath - Ruta donde guardar el DOCX
   * @param {string} mode - Modo de conversión: 'basic', 'advanced', 'auto'
   * @returns {Promise<Object>} - Resultado de la conversión
   */
  async convert(pdfPath, outputPath, mode = null) {
    const conversionMode = mode || config.conversionMode;
    
    console.log(`\n📋 Modo de conversión: ${conversionMode.toUpperCase()}`);
    console.log(`📁 Archivo de entrada: ${pdfPath}`);
    console.log(`📁 Archivo de salida: ${outputPath}`);

    try {
      switch (conversionMode) {
        case 'basic':
          return await this.convertBasic(pdfPath, outputPath);
        
        case 'advanced':
          return await this.convertAdvanced(pdfPath, outputPath);
        
        case 'auto':
        default:
          return await this.convertAuto(pdfPath, outputPath);
      }
    } catch (error) {
      console.error('❌ Error en orquestador:', error.message);
      throw error;
    }
  }

  /**
   * Conversión forzada en modo básico
   */
  async convertBasic(pdfPath, outputPath) {
    console.log('🔧 Usando conversor BÁSICO');
    return await this.basicConverter.convert(pdfPath, outputPath);
  }

  /**
   * Conversión forzada en modo avanzado
   */
  async convertAdvanced(pdfPath, outputPath) {
    if (!this.advancedConverter.isAvailable()) {
      console.log('⚠️  Modo avanzado no disponible, usando modo básico como fallback');
      return await this.basicConverter.convert(pdfPath, outputPath);
    }
    
    console.log('🚀 Usando conversor AVANZADO');
    return await this.advancedConverter.convert(pdfPath, outputPath);
  }

  /**
   * Conversión automática (elige el mejor método disponible)
   */
  async convertAuto(pdfPath, outputPath) {
    console.log('🤖 Modo automático: seleccionando el mejor conversor...');
    
    if (this.advancedConverter.isAvailable()) {
      const capabilities = this.advancedConverter.getCapabilities();
      console.log(`✓ Capacidades avanzadas disponibles:
  - LibreOffice: ${capabilities.libreoffice ? '✅' : '❌'}
  - Tesseract OCR: ${capabilities.ocr ? '✅' : '❌'}`);
      
      try {
        return await this.advancedConverter.convert(pdfPath, outputPath);
      } catch (error) {
        console.log('⚠️  Error en modo avanzado, intentando con modo básico...');
        return await this.basicConverter.convert(pdfPath, outputPath);
      }
    } else {
      console.log('ℹ️  Componentes avanzados no disponibles, usando modo básico');
      return await this.basicConverter.convert(pdfPath, outputPath);
    }
  }

  /**
   * Obtiene información sobre los conversores disponibles
   */
  getStatus() {
    return {
      basic: {
        available: this.basicConverter.isAvailable(),
        name: this.basicConverter.name
      },
      advanced: {
        available: this.advancedConverter.isAvailable(),
        name: this.advancedConverter.name,
        capabilities: this.advancedConverter.isAvailable() 
          ? this.advancedConverter.getCapabilities() 
          : null
      },
      currentMode: config.conversionMode
    };
  }
}

module.exports = ConverterOrchestrator;