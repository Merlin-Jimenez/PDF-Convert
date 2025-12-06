# PDF to DOCX Converter

Una aplicación web completa para convertir archivos PDF a documentos Word (.docx) con soporte para múltiples modos de conversión.

## 🎯 Características

- **Conversión PDF → DOCX** con interfaz web intuitiva
- **3 Modos de conversión:**
  - ✅ **Auto**: Selecciona automáticamente el mejor método
  - ✅ **Básico**: Extracción de texto rápida
  - ✅ **Avanzado**: Usa LibreOffice para alta calidad o Tesseract OCR para PDFs escaneados
- **Detección automática** de PDFs digitales vs escaneados
- **Interfaz web moderna** con drag-and-drop
- **Indicador de progreso** en tiempo real
- **Descarga directa** del archivo generado
- **Soporte para OCR** con Tesseract para documentos escaneados

## 🛠️ Requisitos Previos

- Node.js v14+ 
- npm v6+
- LibreOffice (para conversión avanzada)
- Tesseract-OCR (opcional, para OCR)

## 📦 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/coopmaimon/ConversorPDF.git
cd ConversorPDF/src
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno (opcional)
```bash
cp .env.example .env
```

### 4. Instalar herramientas externas (Windows/Linux/Mac)

**LibreOffice:**
- **Windows**: `winget install libreoffice` o descarga desde https://www.libreoffice.org
- **Linux**: `sudo apt-get install libreoffice`
- **Mac**: `brew install libreoffice`

**Tesseract-OCR (opcional):**
- **Windows**: `winget install UB-Mannheim.TesseractOCR`
- **Linux**: `sudo apt-get install tesseract-ocr`
- **Mac**: `brew install tesseract`

## 🚀 Uso

### Iniciar el servidor
```bash
npm start
```

El servidor estará disponible en: `http://localhost:3000`

### Uso de la interfaz web
1. Abre `http://localhost:3000` en tu navegador
2. Arrastra un PDF o haz clic para seleccionar
3. Elige el modo de conversión (Auto/Básico/Avanzado)
4. Espera a que se complete la conversión
5. Descarga el archivo DOCX

## 📁 Estructura del Proyecto

```
ConversorPDF/
├── src/
│   ├── public/              # Archivos frontend (HTML/CSS/JS)
│   ├── converters/          # Lógica de conversión
│   │   ├── advancedConverter.js
│   │   ├── basicConverter.js
│   │   └── index.js
│   ├── utils/               # Utilidades
│   │   ├── pdfConverter.js
│   │   ├── pdfDetector.js
│   │   ├── ocrProcessor.js
│   │   └── docxGenerator.js
│   ├── server.js            # Servidor Express
│   ├── config.js            # Configuración
│   └── package.json
├── .gitignore
└── README.md
```

## 🔧 Configuración

Las configuraciones automáticas se detectan en:
- **LibreOffice**: `C:\Program Files\LibreOffice` (Windows) o `/usr/bin/soffice` (Linux)
- **Tesseract**: `C:\Program Files\Tesseract-OCR` (Windows) o `/usr/bin/tesseract` (Linux)

Para rutas personalizadas, configura las variables de entorno:
```bash
LIBREOFFICE_PATH=/custom/path/soffice
TESSERACT_PATH=/custom/path/tesseract
```

## 📊 API Endpoints

- `GET /` - Interfaz web principal
- `GET /status` - Estado de los conversores disponibles
- `POST /convert` - Endpoint de conversión (multipart/form-data)
- `POST /download` - Descarga del archivo generado

## 🔄 Flujo de Conversión

```
PDF Subido
    ↓
Análisis del PDF (páginas, texto, densidad)
    ↓
¿Es escaneado? → SÍ → OCR (Tesseract)
    ↓ NO
LibreOffice disponible? → SÍ → Conversión LibreOffice
    ↓ NO
Conversor Básico (extracción de texto)
    ↓
DOCX Generado ✅
```

## 🧪 Pruebas

```bash
# Probar estado de componentes
curl http://localhost:3000/status

# Probar conversión
curl -F "file=@prueba.pdf" -F "mode=auto" http://localhost:3000/convert
```

## 🐛 Troubleshooting

### LibreOffice no se detecta
1. Verifica que está instalado: `soffice --version`
2. Configura la variable de entorno `LIBREOFFICE_PATH`

### Tesseract no se detecta
1. Verifica que está instalado: `tesseract --version`
2. Configura la variable de entorno `TESSERACT_PATH`

### Archivo DOCX corrupto
- Intenta con modo "Basic" en lugar de "Advanced"
- Verifica que el PDF es válido

## 📝 Logs y Debugging

El servidor muestra logs detallados de cada conversión:
```
🚀 Iniciando conversión avanzada
🔍 Analizando tipo de PDF
📊 Análisis: Páginas: X, Caracteres: Y
✅ Conversión exitosa en Z.XXs
```

## 📦 Dependencias Principales

- **express** - Framework web
- **multer** - Manejo de uploads
- **docx** - Generación de documentos Word
- **pdf-parse** - Análisis de PDFs
- **pdf-poppler** - Conversión PDF a imágenes
- **node-tesseract-ocr** - OCR
- **sharp** - Procesamiento de imágenes

## 👨‍💻 Autor

Proyecto desarrollado como aplicación reutilizable por coopmaimon

## 📄 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el repositorio
2. Crea una rama con tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Soporte

Para reportar bugs o solicitar features, abre un issue en GitHub.

---

**Estado**: ✅ Funcional y estable
**Última actualización**: Diciembre 2025
