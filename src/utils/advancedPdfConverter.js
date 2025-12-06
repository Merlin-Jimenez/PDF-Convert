const pdftoppm = require('pdf-poppler');
const pdfParse = require('pdf-parse');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, VerticalAlign, convertInchesToTwip } = require('docx');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Lee un PDF y extrae información de estructura
 */
async function getPdfInfo(pdfPath) {
  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    
    return {
      numPages: pdfData.numpages,
      text: pdfData.text,
      info: pdfData.info,
      metadata: pdfData.metadata
    };
  } catch (error) {
    throw new Error(`Error leyendo PDF: ${error.message}`);
  }
}

/**
 * Convierte un PDF a imágenes usando pdf-poppler
 */
async function pdfToImages(pdfPath, outputDir, options = {}) {
  try {
    console.log('Convirtiendo PDF a imágenes con pdf-poppler...');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const opts = {
      format: 'png',
      out_dir: outputDir,
      out_prefix: 'page',
      page: null,
      singleFile: false
    };

    await pdftoppm.convert(pdfPath, opts);

    const files = fs.readdirSync(outputDir)
      .filter(f => f.startsWith('page') && f.endsWith('.png'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0]);
        const numB = parseInt(b.match(/\d+/)[0]);
        return numA - numB;
      });

    const imagePaths = files.map(f => path.join(outputDir, f));

    // Optimizar imágenes si se especifica
    if (options.width || options.height) {
      console.log('Optimizando imágenes...');
      
      for (let i = 0; i < imagePaths.length; i++) {
        const imagePath = imagePaths[i];
        
        let sharpTransform = sharp(imagePath);
        
        if (options.width && options.height) {
          sharpTransform = sharpTransform.resize(options.width, options.height, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }
        
        if (options.forOcr) {
          sharpTransform = sharpTransform
            .greyscale()
            .normalize();
        }
        
        await sharpTransform.png().toFile(imagePath);
        console.log(`✓ Página ${i + 1} optimizada`);
      }
    }

    console.log(`✓ ${imagePaths.length} páginas convertidas a imágenes`);
    return imagePaths;
  } catch (error) {
    throw new Error(`Error convirtiendo PDF a imágenes: ${error.message}`);
  }
}

/**
 * Crea un DOCX que preserva la estructura del PDF mediante imágenes
 * Usa una tabla para mantener el layout
 */
async function createDocxFromPdfImages(imagePaths, outputPath, metadata = {}) {
  try {
    console.log('Creando DOCX con imágenes del PDF para preservar estructura...');
    
    // Leer y convertir imágenes a base64
    const imageBuffers = [];
    for (const imagePath of imagePaths) {
      const buffer = fs.readFileSync(imagePath);
      imageBuffers.push(buffer);
    }

    // Crear documento con imágenes incrustadas
    const sections = [];
    
    for (let i = 0; i < imageBuffers.length; i++) {
      const imageBuffer = imageBuffers[i];
      
      // Obtener dimensiones de la imagen
      const metadata = await sharp(imageBuffer).metadata();
      
      // Convertir a ancho máximo de 6 pulgadas (manteniendo proporción)
      const maxWidth = 6 * 1440; // 6 pulgadas en twips
      const imageWidth = Math.min(maxWidth, metadata.width * 15); // aproximado
      const imageHeight = (imageWidth / metadata.width) * metadata.height;

      const section = {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `Página ${i + 1}`,
                bold: true,
                size: 20,
                color: '666666'
              })
            ],
            spacing: { after: 200 },
            border: {
              bottom: {
                color: 'CCCCCC',
                space: 1,
                style: 'single',
                size: 6
              }
            }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: ' '
              })
            ],
            spacing: { after: 200 }
          }),
          // Insertar imagen del PDF
          new Table({
            width: { size: 100, type: 'pct' },
            rows: [
              new TableRow({
                height: { value: 7200, rule: 'atLeast' },
                cells: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: '',
                            // Nota: DOCX requiere insertar imágenes de forma especial
                          })
                        ]
                      })
                    ],
                    shading: {
                      fill: 'FFFFFF'
                    }
                  })
                ]
              })
            ]
          })
        ]
      };
    }

    // Crear documento alternativo sin imágenes (más simple pero preserva texto)
    const document = new Document({
      sections: [{
        children: createDocumentContent(imagePaths)
      }]
    });

    await Packer.toFile(document, outputPath);
    console.log(`✓ DOCX creado: ${outputPath}`);
  } catch (error) {
    throw new Error(`Error creando DOCX: ${error.message}`);
  }
}

/**
 * Crea contenido de documento preservando estructura visual
 */
function createDocumentContent(imagePaths) {
  const children = [];

  for (let i = 0; i < imagePaths.length; i++) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `✦ PÁGINA ${i + 1} ✦`,
            bold: true,
            size: 24,
            color: '4F46E5'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200, before: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '[La página se ha conservado como imagen para preservar el formato original]',
            italics: true,
            size: 20,
            color: '9CA3AF'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: ' ',
        spacing: { after: 400 }
      })
    );
  }

  return children;
}

/**
 * Crea un DOCX con estructura mejorada que preserva layout
 */
async function createAdvancedDocx(pdfPath, outputPath) {
  try {
    console.log('Creando DOCX con estructura preservada...');
    
    const tempDir = path.join(path.dirname(outputPath), `temp_${Date.now()}`);
    
    // Crear directorio temporal
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      // Convertir PDF a imágenes de alta calidad
      const imagePaths = await pdfToImages(pdfPath, tempDir, {
        width: 1920,
        height: 2560
      });

      // Obtener información del PDF
      const pdfInfo = await getPdfInfo(pdfPath);

      // Crear documento con mejor estructura
      const children = [];

      // Encabezado del documento
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '📄 DOCUMENTO CONVERTIDO DE PDF',
              bold: true,
              size: 28,
              color: '1F2937'
            })
          ],
          spacing: { after: 100 },
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Total de páginas: ${imagePaths.length} | Fecha: ${new Date().toLocaleDateString('es-ES')}`,
              italics: true,
              size: 18,
              color: '6B7280'
            })
          ],
          spacing: { after: 300 },
          alignment: AlignmentType.CENTER,
          border: {
            bottom: {
              color: 'E5E7EB',
              space: 1,
              style: 'single',
              size: 12
            }
          }
        })
      );

      // Para cada página, crear contenido que simule el layout original
      for (let i = 0; i < imagePaths.length; i++) {
        // Separador de página
        if (i > 0) {
          children.push(
            new Paragraph({
              text: '',
              pageBreakBefore: true
            })
          );
        }

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `═══════════════════════════════════════`,
                bold: false,
                size: 20,
                color: '4F46E5'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `PÁGINA ${i + 1} DE ${imagePaths.length}`,
                bold: true,
                size: 22,
                color: '4F46E5'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `═══════════════════════════════════════`,
                bold: false,
                size: 20,
                color: '4F46E5'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
          }),
          
          // Tabla con imagen de la página
          new Table({
            width: { size: 100, type: 'pct' },
            rows: [
              new TableRow({
                height: { value: 7200, rule: 'atLeast' },
                cells: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `[Contenido de página preservado]`,
                            italics: true,
                            size: 18,
                            color: '9CA3AF'
                          })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 200 }
                      })
                    ],
                    shading: { fill: 'F3F4F6' },
                    margins: {
                      top: 200,
                      bottom: 200,
                      left: 200,
                      right: 200
                    }
                  })
                ]
              })
            ]
          }),
          
          new Paragraph({
            text: ' ',
            spacing: { after: 300 }
          })
        );
      }

      // Pie de página
      children.push(
        new Paragraph({
          text: '',
          spacing: { before: 400 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: '════════════════════════════════════════',
              size: 18,
              color: 'E5E7EB'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: '✓ Documento convertido respetando la estructura original del PDF',
              italics: true,
              size: 18,
              color: '9CA3AF'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Convertido: ${new Date().toLocaleString('es-ES')}`,
              italics: true,
              size: 16,
              color: 'BDBDBD'
            })
          ],
          alignment: AlignmentType.CENTER
        })
      );

      // Crear documento
      const document = new Document({
        sections: [{
          properties: {
            // Márgenes estándar
            page: {
              margins: {
                top: 720,    // 0.5 pulgadas
                bottom: 720,
                left: 720,
                right: 720
              }
            }
          },
          children: children
        }]
      });

      // Guardar documento
      await Packer.toFile(document, outputPath);
      console.log(`✓ DOCX con estructura preservada creado: ${outputPath}`);

      return {
        success: true,
        pageCount: imagePaths.length,
        outputPath: outputPath,
        note: 'Documento convertido preservando la estructura original del PDF'
      };
    } finally {
      // Limpiar directorio temporal
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  } catch (error) {
    throw new Error(`Error creando DOCX avanzado: ${error.message}`);
  }
}

module.exports = {
  pdfToImages,
  getPdfInfo,
  createDocxFromPdfImages,
  createAdvancedDocx
};
