# 🔄 PDF to DOCX Converter - 100% Local

Sistema profesional de conversión de archivos PDF a DOCX completamente local, sin servicios externos, con dos niveles de funcionamiento.

## 🎯 Características Principales

### ⚡ Nivel BÁSICO (Rápido - Sin Instalaciones Extra)
- ✅ Funciona desde el día 1
- ✅ Extracción de texto de PDFs digitales
- ✅ Conversión de PDFs a imágenes cuando no hay texto
- ✅ Generación de DOCX con contenido básico
- ✅ **No requiere LibreOffice ni Tesseract**

### 🚀 Nivel AVANZADO (Calidad iLovePDF)
- ✅ Integración con LibreOffice para PDFs digitales
- ✅ OCR con Tesseract para PDFs escaneados
- ✅ Detección automática de tipo de PDF
- ✅ Conversión de alta calidad
- ✅ Preservación de formato cuando es posible

### 🤖 Modo Automático
El sistema detecta automáticamente:
- Si el PDF es digital (con texto) → Usa LibreOffice
- Si el PDF es escaneado (imagen) → Usa OCR con Tesseract
- Si no están disponibles componentes avanzados → Usa modo básico

---

## 📁 Estructura del Proyecto

```
pdf-to-docx-converter/
├── src/
│   ├── converters/
│   │   ├── basicConverter.js      # Conversor básico (siempre disponible)
│   │   ├── advancedConverter.js   # Conversor avanzado (LibreOffice + OCR)
│   │   └── index.js               # Orquestador inteligente
│   ├── utils/
│   │   ├── pdfDetector.js         # Detecta tipo de PDF
│   │   ├── ocrProcessor.js        # Procesamiento OCR
│   │   └── docxGenerator.js       # Genera archivos DOCX
│   ├── server.js                  # Servidor Express
│   └── config.js                  # Configuración
├── uploads/                        # PDFs subidos (temporal)
├── output/                         # DOCXs generados
├── temp/                          # Archivos temporales
├── package.json
├── .env
└── README.md
```

---

## 🚀 Instalación Rápida

### Windows
```cmd
npm install
copy .env.example .env
npm start
```

### Ubuntu/Linux
```bash
npm install
cp .env.example .env
npm start
```

**El servidor estará disponible en http://localhost:3000**

Ver guías detalladas:
- [Instalación en Windows](INSTALL-WINDOWS.md)
- [Instalación en Ubuntu](INSTALL-UBUNTU.md)

---

## 📡 API Endpoints

### `GET /`
Información del sistema
```bash
curl http://localhost:3000/
```

### `GET /status`
Estado de conversores disponibles
```bash
curl http://localhost:3000/status
```

### `POST /convert`
Convierte PDF a DOCX y descarga el archivo
```bash
curl -X POST http://localhost:3000/convert \
  -F "file=@documento.pdf" \
  -F "mode=auto" \
  -o resultado.docx
```

**Parámetros:**
- `file`: Archivo PDF (requerido)
- `mode`: Modo de conversión (opcional)
  - `basic`: Fuerza modo básico
  - `advanced`: Fuerza modo avanzado
  - `auto`: Selección automática (default)

### `POST /convert-response`
Convierte y retorna información JSON
```bash
curl -X POST http://localhost:3000/convert-response \
  -F "file=@documento.pdf"
```

**Respuesta:**
```json
{
  "success": true,
  "method": "libreoffice",
  "filename": "resultado_123456.docx",
  "downloadUrl": "/download/resultado_123456.docx",
  "duration": "2.35"
}
```

### `GET /download/:filename`
Descarga un archivo DOCX generado
```bash
curl http://localhost:3000/download/resultado_123456.docx -o resultado.docx
```

---

## ⚙️ Configuración (.env)

```bash
# Puerto del servidor
PORT=3000

# Modo de conversión: basic | advanced | auto
CONVERSION_MODE=auto

# Directorios
UPLOAD_DIR=./uploads
OUTPUT_DIR=./output
TEMP_DIR=./temp

# LibreOffice (modo avanzado)
# Windows: C:\\Program Files\\LibreOffice\\program\\soffice.exe
# Linux: /usr/bin/soffice
LIBREOFFICE_PATH=/usr/bin/soffice

# Tesseract OCR (modo avanzado)
# Windows: C:\\Program Files\\Tesseract-OCR\\tesseract.exe
# Linux: /usr/bin/tesseract
TESSERACT_PATH=/usr/bin/tesseract

# Idiomas OCR (separados por +)
OCR_LANG=spa+eng

# Umbral de detección (%)
TEXT_THRESHOLD=5
```

---

## 🧪 Pruebas

### Prueba básica
```bash
# Crear archivo de prueba test.pdf
# Luego ejecutar:

curl -X POST http://localhost:3000/convert \
  -F "file=@test.pdf" \
  -F "mode=basic" \
  -o test_resultado.docx

echo "✅ Conversión completada: test_resultado.docx"
```

### Prueba avanzada
```bash
curl -X POST http://localhost:3000/convert \
  -F "file=@test.pdf" \
  -F "mode=advanced" \
  -o test_resultado.docx
```

### Prueba automática
```bash
curl -X POST http://localhost:3000/convert \
  -F "file=@test.pdf" \
  -o test_resultado.docx
```

---

## 🔧 Modos de Conversión

### 1. Modo BÁSICO (`mode=basic`)
```javascript
// Siempre disponible, no requiere instalaciones extra
// - Extrae texto del PDF si está disponible
// - Si no hay texto, convierte páginas a imágenes
// - Genera DOCX simple pero funcional
```

**Ventajas:**
- ✅ Funciona inmediatamente
- ✅ Sin dependencias externas
- ✅ Rápido (1-3 segundos)

**Limitaciones:**
- ⚠️ Formato básico
- ⚠️ PDFs escaneados generan imágenes (sin OCR)

### 2. Modo AVANZADO (`mode=advanced`)
```javascript
// Requiere LibreOffice y/o Tesseract instalados
// - PDFs digitales → LibreOffice (alta calidad)
// - PDFs escaneados → Tesseract OCR (texto extraído)
```

**Ventajas:**
- ✅ Calidad similar a iLovePDF
- ✅ Preserva formato de PDFs digitales
- ✅ OCR para PDFs escaneados
- ✅ Resultados profesionales

**Requisitos:**
- 📦 LibreOffice instalado
- 📦 Tesseract OCR instalado

### 3. Modo AUTO (`mode=auto`) **[RECOMENDADO]**
```javascript
// Detección inteligente
// 1. Verifica componentes disponibles
// 2. Analiza el PDF (¿tiene texto?)
// 3. Selecciona el mejor método:
//    - LibreOffice para PDFs digitales
//    - OCR para PDFs escaneados
//    - Básico como fallback
```

**Ventajas:**
- ✅ Siempre funciona
- ✅ Usa el mejor método disponible
- ✅ Sin configuración manual
- ✅ Degrada gracefully

---

## 📊 Flujo de Decisión (Modo AUTO)

```
┌─────────────────┐
│   PDF Subido    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ ¿LibreOffice/Tesseract OK?  │
└────────┬──────────┬─────────┘
         │ NO       │ SÍ
         ▼          ▼
    ┌────────┐  ┌──────────────┐
    │ BÁSICO │  │ Analizar PDF │
    └────────┘  └──────┬───────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
  ┌─────────────┐            ┌─────────────┐
  │ ¿Tiene      │            │ ¿Tiene      │
  │  texto?     │            │  texto?     │
  └─────┬───────┘            └─────┬───────┘
        │ SÍ                       │ NO
        ▼                          ▼
  ┌──────────┐              ┌──────────┐
  │LibreOffice│             │Tesseract │
  │   +PDF   │             │   OCR    │
  └──────────┘              └──────────┘
```

---

## 🎨 Ejemplos de Uso

### JavaScript (Node.js)
```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function convertPdf() {
  const form = new FormData();
  form.append('file', fs.createReadStream('documento.pdf'));
  form.append('mode', 'auto');

  const response = await axios.post('http://localhost:3000/convert', form, {
    headers: form.getHeaders(),
    responseType: 'stream'
  });

  response.data.pipe(fs.createWriteStream('resultado.docx'));
}

convertPdf();
```

### Python
```python
import requests

url = 'http://localhost:3000/convert'
files = {'file': open('documento.pdf', 'rb')}
data = {'mode': 'auto'}

response = requests.post(url, files=files, data=data)

with open('resultado.docx', 'wb') as f:
    f.write(response.content)

print('✅ Conversión completada')
```

### PHP
```php
<?php
$url = 'http://localhost:3000/convert';

$ch = curl_init();
$file = new CURLFile('documento.pdf', 'application/pdf');

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, [
    'file' => $file,
    'mode' => 'auto'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

$result = curl_exec($ch);
file_put_contents('resultado.docx', $result);

echo '✅ Conversión completada';
?>
```

---

## 🔍 Detección de PDF Escaneado

El sistema analiza automáticamente cada PDF:

```javascript
// Métricas analizadas:
- Cantidad de caracteres extraíbles
- Densidad de texto por página
- Porcentaje de contenido de texto

// Un PDF se considera "escaneado" si:
- Tiene < 50 caracteres por página
- O tiene < 5% del texto esperado
```

---

## 🛠️ Desarrollo

### Instalar en modo desarrollo
```bash
npm install
npm run dev  # Usa nodemon para auto-reload
```

### Estructura de módulos
```javascript
// Conversor básico (siempre disponible)
const BasicConverter = require('./converters/basicConverter');

// Conversor avanzado (requiere componentes)
const AdvancedConverter = require('./converters/advancedConverter');

// Orquestador inteligente
const ConverterOrchestrator = require('./converters');
```

### Agregar nuevo conversor
```javascript
// 1. Crear clase en src/converters/
class MiConversor {
  async convert(pdfPath, outputPath) {
    // Implementación
  }
  
  isAvailable() {
    return true;
  }
}

// 2. Registrar en orquestador
// 3. Actualizar lógica de selección
```

---

## ⚠️ Limitaciones Conocidas

### Modo Básico
- No preserva formato complejo de PDFs
- PDFs escaneados se convierten a imágenes (sin OCR)
- Tablas y elementos complejos pueden perder estructura

### Modo Avanzado
- Requiere instalación de componentes externos
- LibreOffice puede tardar 5-10s en PDFs grandes
- OCR puede tardar 2-5s por página
- Calidad de OCR depende de calidad de imagen

### General
- Límite de 50MB por archivo
- PDFs con protección/encriptación no soportados
- Algunos PDFs especiales pueden no convertirse correctamente

---

## 🤝 Contribuir

¿Mejoras sugeridas?
1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/mejora`)
3. Commit cambios (`git commit -am 'Agrega mejora'`)
4. Push a la rama (`git push origin feature/mejora`)
5. Crea un Pull Request

---

## 📄 Licencia

MIT License - Uso libre para proyectos personales y comerciales

---

## 🆘 Soporte

### Problemas comunes
- Ver [INSTALL-WINDOWS.md](INSTALL-WINDOWS.md) para Windows
- Ver [INSTALL-UBUNTU.md](INSTALL-UBUNTU.md) para Linux

### Issues
- Reportar bugs abriendo un issue en GitHub
- Incluir: logs, versión de Node.js, sistema operativo

---

## 🎯 Roadmap

- [ ] Soporte para conversión batch (múltiples archivos)
- [ ] API key para autenticación
- [ ] Rate limiting
- [ ] Caché de conversiones
- [ ] Soporte para más idiomas OCR
- [ ] Interface web UI
- [ ] Conversión inversa DOCX → PDF
- [ ] Soporte para otros formatos (ODT, RTF)

---

## ✨ Créditos

Construido con:
- Express.js - Framework web
- pdf-parse - Extracción de texto
- docx - Generación de archivos DOCX
- Tesseract OCR - Reconocimiento óptico de caracteres
- LibreOffice - Conversión de alta calidad
- Sharp - Procesamiento de imágenes

---

**⭐ Si este proyecto te fue útil, dale una estrella en GitHub**