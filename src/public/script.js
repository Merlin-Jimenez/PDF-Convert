// Estado de la aplicación
let currentFile = null;
let isConverting = false;

// Elementos del DOM
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const fileInfoSection = document.getElementById('fileInfoSection');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFileBtn');
const optionsSection = document.getElementById('optionsSection');
const actionSection = document.getElementById('actionSection');
const convertBtn = document.getElementById('convertBtn');
const progressSection = document.getElementById('progressSection');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const resultSection = document.getElementById('resultSection');
const resultMessage = document.getElementById('resultMessage');
const resultDetails = document.getElementById('resultDetails');
const downloadBtn = document.getElementById('downloadBtn');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');

// Event Listeners para Upload
selectFileBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileSelected(file);
    }
});

// Drag and Drop
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf') {
            handleFileSelected(file);
        } else {
            showError('Por favor, sube un archivo PDF válido');
        }
    }
});

// Remove File
removeFileBtn.addEventListener('click', () => {
    resetUI();
});

// Convert Button
convertBtn.addEventListener('click', () => {
    if (currentFile && !isConverting) {
        convertFile();
    }
});

// Retry Button
retryBtn.addEventListener('click', () => {
    resetUI();
});

/**
 * Maneja la selección de archivo
 */
function handleFileSelected(file) {
    if (file.type !== 'application/pdf') {
        showError('Por favor, selecciona un archivo PDF válido');
        return;
    }

    currentFile = file;

    // Mostrar información del archivo
    fileName.textContent = file.name;
    fileSize.textContent = `Tamaño: ${formatFileSize(file.size)}`;

    // Actualizar UI
    uploadArea.style.display = 'none';
    selectFileBtn.style.display = 'none';
    fileInfoSection.style.display = 'block';
    optionsSection.style.display = 'block';
    actionSection.style.display = 'block';
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';
    progressSection.style.display = 'none';
}

/**
 * Convierte el archivo PDF a DOCX
 */
async function convertFile() {
    if (!currentFile) return;

    isConverting = true;
    convertBtn.disabled = true;

    // Mostrar sección de progreso
    progressSection.style.display = 'block';
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';
    actionSection.style.display = 'none';

    try {
        // Obtener modo de conversión seleccionado
        const mode = document.querySelector('input[name="mode"]:checked').value;

        // Crear FormData
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('mode', mode);

        // Simular progreso
        simulateProgress();

        // Hacer petición al servidor
        const response = await fetch('/convert', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en la conversión');
        }

        const result = await response.json();

        if (result.success) {
            showSuccess(result);
        } else {
            throw new Error(result.message || 'Error desconocido');
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage(error.message);
    } finally {
        isConverting = false;
        convertBtn.disabled = false;
        progressSection.style.display = 'none';
    }
}

/**
 * Simula barra de progreso
 */
function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress > 90) progress = 90;

        progressFill.style.width = progress + '%';
        progressPercent.textContent = Math.round(progress) + '%';

        if (progress >= 90) {
            clearInterval(interval);
        }
    }, 300);

    // Completar al 100% cuando termine
    setTimeout(() => {
        clearInterval(interval);
        progressFill.style.width = '100%';
        progressPercent.textContent = '100%';
    }, 3000);
}

/**
 * Muestra éxito en la conversión
 */
function showSuccess(result) {
    progressSection.style.display = 'none';
    resultSection.style.display = 'block';
    actionSection.style.display = 'none';

    // Actualizar mensaje
    resultMessage.textContent = `Tu archivo "${currentFile.name}" se ha convertido exitosamente a DOCX`;

    // Mostrar detalles
    let detailsHTML = '<strong>Detalles de la conversión:</strong><br>';
    detailsHTML += `<p>📊 Método: ${getMethodName(result.method)}</p>`;
    detailsHTML += `<p>⏱️ Tiempo: ${result.duration}s</p>`;
    if (result.pageCount) {
        detailsHTML += `<p>📄 Páginas: ${result.pageCount}</p>`;
    }
    if (result.textLength) {
        detailsHTML += `<p>📝 Caracteres: ${result.textLength.toLocaleString()}</p>`;
    }

    resultDetails.innerHTML = detailsHTML;

    // Configurar botón de descarga
    downloadBtn.onclick = () => downloadFile(result);
}

/**
 * Descarga el archivo convertido
 */
async function downloadFile(result) {
    try {
        const response = await fetch('/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                outputPath: result.outputPath
            })
        });

        if (!response.ok) {
            throw new Error('Error descargando archivo');
        }

        // Obtener filename del header o usar uno por defecto
        const filename = currentFile.name.replace('.pdf', '.docx');
        
        // Descargar
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        showErrorMessage('Error al descargar el archivo: ' + error.message);
    }
}

/**
 * Muestra mensaje de error
 */
function showErrorMessage(message) {
    progressSection.style.display = 'none';
    errorSection.style.display = 'block';
    resultSection.style.display = 'none';
    errorMessage.textContent = message;
}

/**
 * Muestra error
 */
function showError(message) {
    showErrorMessage(message);
    fileInfoSection.style.display = 'none';
    optionsSection.style.display = 'none';
    actionSection.style.display = 'none';
}

/**
 * Reset UI
 */
function resetUI() {
    currentFile = null;
    fileInput.value = '';
    uploadArea.style.display = 'block';
    selectFileBtn.style.display = 'block';
    fileInfoSection.style.display = 'none';
    optionsSection.style.display = 'none';
    actionSection.style.display = 'none';
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';
    progressSection.style.display = 'none';
    progressFill.style.width = '0%';
    progressPercent.textContent = '0%';
    convertBtn.disabled = false;
}

/**
 * Formatea el tamaño del archivo
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Obtiene el nombre del método de conversión
 */
function getMethodName(method) {
    const methods = {
        'basic-text-extraction': 'Extracción básica de texto',
        'basic-with-images': 'Básico con imágenes',
        'advanced-ocr': 'OCR Avanzado',
        'advanced-libreoffice': 'LibreOffice (Avanzado)',
        'libreoffice': 'LibreOffice'
    };
    return methods[method] || method;
}

// Inicializar
console.log('PDF to DOCX Converter - Frontend Cargado');
