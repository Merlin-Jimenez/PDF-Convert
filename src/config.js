require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Configurar UTF-8 para consola en Windows
if (process.platform === 'win32') {
  process.stdout.setEncoding('utf8');
  process.stderr.setEncoding('utf8');
}

const config = {
  port: process.env.PORT || 3000,
  conversionMode: process.env.CONVERSION_MODE || 'auto',
  
  directories: {
    upload: path.resolve(process.env.UPLOAD_DIR || './uploads'),
    output: path.resolve(process.env.OUTPUT_DIR || './output'),
    temp: path.resolve(process.env.TEMP_DIR || './temp')
  },
  
  libreoffice: {
    path: process.env.LIBREOFFICE_PATH || '/usr/bin/soffice',
    available: false
  },
  
  tesseract: {
    path: process.env.TESSERACT_PATH || '/usr/bin/tesseract',
    lang: process.env.OCR_LANG || 'spa+eng',
    available: false
  },
  
  detection: {
    textThreshold: parseInt(process.env.TEXT_THRESHOLD || '5', 10)
  }
};

// Crear directorios si no existen
Object.values(config.directories).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Verificar disponibilidad de LibreOffice
// Detectar LibreOffice en rutas comunes (Windows y Unix) o variable de entorno
try {
  const possibleLibrePaths = [
    process.env.LIBREOFFICE_PATH,
    config.libreoffice.path,
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    '/usr/bin/soffice',
    '/usr/bin/libreoffice'
  ].filter(Boolean);

  const foundLibre = possibleLibrePaths.find(p => fs.existsSync(p));
  if (foundLibre) {
    config.libreoffice.path = foundLibre;
    config.libreoffice.available = true;
    console.log('✅ LibreOffice detectado en:', foundLibre);
  } else {
    console.log('⚠️  LibreOffice no disponible - usando modo básico');
  }
} catch (error) {
  console.log('⚠️  Error comprobando LibreOffice:', error.message);
}

// Detectar Tesseract en rutas comunes (Windows y Unix) o variable de entorno
try {
  const possibleTessPaths = [
    process.env.TESSERACT_PATH,
    config.tesseract.path,
    'C:\\Program Files\\Tesseract-OCR\\tesseract.exe',
    'C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe',
    '/usr/bin/tesseract'
  ].filter(Boolean);

  const foundTess = possibleTessPaths.find(p => fs.existsSync(p));
  if (foundTess) {
    config.tesseract.path = foundTess;
    config.tesseract.available = true;
    console.log('✅ Tesseract OCR detectado en:', foundTess);
  } else {
    console.log('⚠️  Tesseract no disponible - OCR deshabilitado');
  }
} catch (error) {
  console.log('⚠️  Error comprobando Tesseract:', error.message);
}

// Fallback adicional: si la variable de entorno fue escrita recientemente (setx)
// la sesión actual puede no verla; comprobar ruta típica y forzar si existe
try {
  const forcedTessPath = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe';
  if (!config.tesseract.available && fs.existsSync(forcedTessPath)) {
    config.tesseract.path = forcedTessPath;
    config.tesseract.available = true;
    console.log('✅ Tesseract detectado (fallback) en:', forcedTessPath);
  }
} catch (e) {
  // silencio
}

// Fallback para LibreOffice (si fue instalado recientemente)
try {
  const forcedLibrePath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
  if (!config.libreoffice.available && fs.existsSync(forcedLibrePath)) {
    config.libreoffice.path = forcedLibrePath;
    config.libreoffice.available = true;
    console.log('✅ LibreOffice detectado (fallback) en:', forcedLibrePath);
  }
} catch (e) {
  // silencio
}

module.exports = config;