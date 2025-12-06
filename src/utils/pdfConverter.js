const pdftoppm = require('pdf-poppler');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Convierte un PDF a imágenes usando pdf-poppler
 * @param {string} pdfPath - Ruta al archivo PDF
 * @param {string} outputDir - Directorio donde guardar las imágenes
 * @param {Object} options - Opciones de conversión {width, height}
 * @returns {Promise<Array<string>>} - Array de rutas de imágenes
 */
async function pdfToImages(pdfPath, outputDir, options = {}) {
  try {
    console.log('Convirtiendo PDF a imágenes con pdf-poppler...');
    
    // Crear directorio si no existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const opts = {
      format: 'png',
      out_dir: outputDir,
      out_prefix: 'page',
      page: null, // todas las páginas
      singleFile: false
    };

    // Convertir PDF a imágenes
    await pdftoppm.convert(pdfPath, opts);

    // Obtener archivos generados
    const files = fs.readdirSync(outputDir)
      .filter(f => f.startsWith('page') && f.endsWith('.png'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0]);
        const numB = parseInt(b.match(/\d+/)[0]);
        return numA - numB;
      });

    const imagePaths = files.map(f => path.join(outputDir, f));

    // Optimizar imágenes si se especifica ancho/alto
    if (options.width || options.height) {
      console.log('Optimizando imágenes...');
      
      for (let i = 0; i < imagePaths.length; i++) {
        const imagePath = imagePaths[i];
        const tempPath = imagePath + '.tmp.png';
        
        try {
          let sharpTransform = sharp(imagePath);
          
          // Redimensionar si se especifica AMBOS ancho y alto
          if (options.width && options.height) {
            sharpTransform = sharpTransform.resize(options.width, options.height, {
              fit: 'inside',
              withoutEnlargement: true
            });
          }
          
          // Para OCR, convertir a escala de grises y normalizar
          if (options.forOcr) {
            sharpTransform = sharpTransform
              .greyscale()
              .normalize();
          }
          
          // Optimizar PNG (reducir tamaño sin perder calidad)
          sharpTransform = sharpTransform.png({ 
            compressionLevel: 9,
            adaptiveFiltering: true
          });
          
          // Guardar en archivo temporal primero
          await sharpTransform.toFile(tempPath);
          
          // Reemplazar original con optimizado
          fs.renameSync(tempPath, imagePath);
          console.log(`✓ Página ${i + 1} optimizada`);
        } catch (error) {
          // Si falla la optimización, mantener original
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
          console.log(`⚠️  No se pudo optimizar página ${i + 1}, usando original`);
        }
      }
    }

    console.log(`✓ ${imagePaths.length} páginas convertidas a imágenes`);
    return imagePaths;
  } catch (error) {
    throw new Error(`Error convirtiendo PDF a imágenes: ${error.message}`);
  }
}

module.exports = {
  pdfToImages
};
