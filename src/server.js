const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar UTF-8 para consola en Windows
if (process.platform === 'win32') {
  process.stdout.setEncoding('utf8');
  process.stderr.setEncoding('utf8');
}

const config = require('./config');
const ConverterOrchestrator = require('./converters');

const app = express();
const orchestrator = new ConverterOrchestrator();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.directories.upload);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pdf-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB límite
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ==================== RUTAS ====================

/**
 * GET /
 * Sirve la página principal
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * GET /status
 * Estado del sistema y conversores disponibles
 */
app.get('/status', (req, res) => {
  const status = orchestrator.getStatus();
  
  res.json({
    status: 'ok',
    config: {
      mode: config.conversionMode,
      libreoffice: config.libreoffice.available,
      tesseract: config.tesseract.available
    },
    converters: status
  });
});

/**
 * GET /health
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /convert
 * Convierte un PDF a DOCX
 * 
 * Body:
 * - file: archivo PDF (multipart/form-data)
 * - mode (opcional): 'basic', 'advanced', 'auto'
 */
app.post('/convert', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No se proporcionó ningún archivo PDF'
    });
  }

  const pdfPath = req.file.path;
  const outputFilename = `${path.basename(req.file.originalname, '.pdf')}_${Date.now()}.docx`;
  const outputPath = path.join(config.directories.output, outputFilename);
  
  const mode = req.body.mode || null;

  console.log('\n' + '='.repeat(70));
  console.log('🔄 NUEVA SOLICITUD DE CONVERSIÓN');
  console.log('='.repeat(70));
  console.log(`📄 Archivo original: ${req.file.originalname}`);
  console.log(`📊 Tamaño: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
  
  try {
    // Ejecutar conversión
    const result = await orchestrator.convert(pdfPath, outputPath, mode);
    
    if (result.success) {
      const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log('\n' + '='.repeat(70));
      console.log('✅ CONVERSIÓN EXITOSA');
      console.log('='.repeat(70));
      console.log(`⏱️  Tiempo total: ${totalDuration}s`);
      console.log(`📁 Archivo generado: ${outputFilename}`);
      console.log('='.repeat(70) + '\n');
      
      // Retornar información en JSON
      res.json({
        success: true,
        message: 'Conversión exitosa',
        filename: outputFilename,
        outputPath: outputPath,
        ...result
      });
    } else {
      // Error en la conversión
      console.log('\n' + '='.repeat(70));
      console.log('❌ CONVERSIÓN FALLIDA');
      console.log('='.repeat(70));
      console.log(`Error: ${result.error}`);
      console.log('='.repeat(70) + '\n');
      
      // Limpiar archivo temporal
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      
      res.status(500).json({
        success: false,
        message: 'Error en la conversión',
        error: result.error,
        method: result.method
      });
    }
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:', error.message);
    
    // Limpiar archivo temporal
    if (fs.existsSync(pdfPath)) {
      try {
        fs.unlinkSync(pdfPath);
      } catch (e) {
        console.error('Error eliminando archivo temporal:', e.message);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error procesando el archivo',
      error: error.message
    });
  }
});

/**
 * POST /convert-response
 * Alternativa que retorna JSON con información del archivo
 */
app.post('/convert-response', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No se proporcionó ningún archivo PDF'
    });
  }

  const pdfPath = req.file.path;
  const outputFilename = `${path.basename(req.file.originalname, '.pdf')}_${Date.now()}.docx`;
  const outputPath = path.join(config.directories.output, outputFilename);
  const mode = req.body.mode || null;

  try {
    const result = await orchestrator.convert(pdfPath, outputPath, mode);
    
    // Limpiar PDF temporal
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Conversión exitosa',
        filename: outputFilename,
        downloadUrl: `/download/${outputFilename}`,
        ...result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        method: result.method
      });
    }
  } catch (error) {
    // Limpiar archivo temporal
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /download
 * Descarga un archivo DOCX generado
 */
app.post('/download', (req, res) => {
  const { outputPath } = req.body;
  
  if (!outputPath) {
    return res.status(400).json({
      error: 'No se proporcionó la ruta del archivo'
    });
  }
  
  if (!fs.existsSync(outputPath)) {
    return res.status(404).json({
      error: 'Archivo no encontrado'
    });
  }
  
  const filename = path.basename(outputPath);
  
  res.download(outputPath, filename, (err) => {
    if (err) {
      console.error('Error enviando archivo:', err);
    }
    
    // Limpiar archivos después de enviar
    setTimeout(() => {
      try {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (e) {
        console.error('Error eliminando archivo:', e.message);
      }
    }, 2000);
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en servidor:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'El archivo es demasiado grande (máximo 50MB)'
      });
    }
  }
  
  res.status(500).json({
    error: 'Error interno del servidor',
    details: err.message
  });
});

// Iniciar servidor
const PORT = config.port;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 SERVIDOR PDF TO DOCX CONVERTER');
  console.log('='.repeat(70));
  console.log(`📡 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📋 Modo de conversión: ${config.conversionMode.toUpperCase()}`);
  console.log('\n📊 Estado de componentes:');
  console.log(`   - Conversor básico: ✅ DISPONIBLE`);
  console.log(`   - LibreOffice: ${config.libreoffice.available ? '✅ DISPONIBLE' : '❌ NO DISPONIBLE'}`);
  console.log(`   - Tesseract OCR: ${config.tesseract.available ? '✅ DISPONIBLE' : '❌ NO DISPONIBLE'}`);
  console.log('\n📍 Endpoints disponibles:');
  console.log(`   - GET  /          → Información del sistema`);
  console.log(`   - GET  /status    → Estado de conversores`);
  console.log(`   - POST /convert   → Convertir PDF a DOCX`);
  console.log('='.repeat(70) + '\n');
});