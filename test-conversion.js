const fs = require('fs');
const path = require('path');
const http = require('http');

// Usar el PDF de prueba disponible
const pdfPath = 'C:\\Users\\mjimenez\\Documents\\ConversorPDF\\src\\uploads\\pdf-1764960597006-779182461.pdf';

if (!fs.existsSync(pdfPath)) {
  console.error('❌ PDF no encontrado:', pdfPath);
  process.exit(1);
}

const fileStream = fs.createReadStream(pdfPath);
const fileStats = fs.statSync(pdfPath);
const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 9);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/convert',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': fileStats.size + 500 // Aproximado
  }
};

const req = http.request(options, (res) => {
  let data = '';
  console.log(`📡 Status: ${res.statusCode}`);
  
  res.on('data', chunk => {
    data += chunk.toString();
  });
  
  res.on('end', () => {
    console.log('\n✅ Respuesta recibida:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Error en solicitud: ${e.message}`);
});

// Construir el form data
const startBoundary = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${path.basename(pdfPath)}"\r\nContent-Type: application/pdf\r\n\r\n`;
const endBoundary = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="mode"\r\n\r\nadvanced\r\n--${boundary}--`;

req.write(startBoundary);

fileStream.on('data', chunk => {
  req.write(chunk);
});

fileStream.on('end', () => {
  req.write(endBoundary);
  req.end();
});

console.log('🧪 Enviando PDF para conversión...');
