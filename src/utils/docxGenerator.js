const { Document, Packer, Paragraph, TextRun, ImageRun } = require('docx');
const fs = require('fs');
const path = require('path');

/**
 * Genera un documento DOCX desde texto simple
 * @param {string} text - Texto a incluir en el documento
 * @param {string} outputPath - Ruta donde guardar el DOCX
 * @returns {Promise<string>} - Ruta del archivo generado
 */
async function generateDocxFromText(text, outputPath) {
  try {
    // Dividir el texto en párrafos
    const paragraphs = text.split('\n').map(line => {
      return new Paragraph({
        children: [
          new TextRun({
            text: line.trim(),
            size: 24, // 12pt
          })
        ],
        spacing: {
          after: 200,
        }
      });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    
    return outputPath;
  } catch (error) {
    throw new Error(`Error generando DOCX: ${error.message}`);
  }
}

/**
 * Genera un documento DOCX desde texto con imágenes
 * @param {string} text - Texto a incluir
 * @param {Array<string>} imagePaths - Rutas de imágenes a incluir
 * @param {string} outputPath - Ruta donde guardar el DOCX
 * @returns {Promise<string>} - Ruta del archivo generado
 */
async function generateDocxFromTextAndImages(text, imagePaths, outputPath) {
  try {
    const children = [];

    // Agregar texto si existe
    if (text && text.trim()) {
      const textParagraphs = text.split('\n').map(line => {
        return new Paragraph({
          children: [
            new TextRun({
              text: line.trim(),
              size: 24,
            })
          ],
          spacing: {
            after: 200,
          }
        });
      });
      children.push(...textParagraphs);
    }

    // Agregar imágenes
    if (imagePaths && imagePaths.length > 0) {
      for (const imagePath of imagePaths) {
        try {
          if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            children.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageBuffer,
                    transformation: {
                      width: 600,
                      height: 800,
                    },
                  }),
                ],
                spacing: {
                  before: 200,
                  after: 200,
                }
              })
            );
          }
        } catch (imgError) {
          console.error(`Error agregando imagen ${imagePath}:`, imgError.message);
        }
      }
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: children.length > 0 ? children : [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Documento convertido desde PDF',
                size: 24,
              })
            ]
          })
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    
    return outputPath;
  } catch (error) {
    throw new Error(`Error generando DOCX con imágenes: ${error.message}`);
  }
}

/**
 * Genera un documento DOCX desde páginas OCR
 * @param {Array<Object>} ocrPages - Array de { pageNumber, text, imagePath }
 * @param {string} outputPath - Ruta donde guardar el DOCX
 * @returns {Promise<string>} - Ruta del archivo generado
 */
async function generateDocxFromOcrPages(ocrPages, outputPath) {
  try {
    const children = [];

    for (const page of ocrPages) {
      // Agregar número de página
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `--- Página ${page.pageNumber} ---`,
              bold: true,
              size: 28,
            })
          ],
          spacing: {
            before: 400,
            after: 200,
          }
        })
      );

      // Agregar texto OCR
      if (page.text && page.text.trim()) {
        const paragraphs = page.text.split('\n').map(line => {
          return new Paragraph({
            children: [
              new TextRun({
                text: line.trim(),
                size: 24,
              })
            ],
            spacing: {
              after: 100,
            }
          });
        });
        children.push(...paragraphs);
      }

      // Agregar imagen de la página si existe
      if (page.imagePath && fs.existsSync(page.imagePath)) {
        try {
          const imageBuffer = fs.readFileSync(page.imagePath);
          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: 550,
                    height: 750,
                  },
                }),
              ],
              spacing: {
                before: 200,
                after: 400,
              }
            })
          );
        } catch (imgError) {
          console.error(`Error agregando imagen de página ${page.pageNumber}:`, imgError.message);
        }
      }
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: children
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    
    return outputPath;
  } catch (error) {
    throw new Error(`Error generando DOCX desde OCR: ${error.message}`);
  }
}

module.exports = {
  generateDocxFromText,
  generateDocxFromTextAndImages,
  generateDocxFromOcrPages
};