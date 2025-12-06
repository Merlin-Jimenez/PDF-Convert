# Instrucciones para subir a GitHub

## Pasos para subir el proyecto a tu repositorio coopmaimon en GitHub

### 1. Instalar Git (si no lo tienes)
- Descarga desde: https://git-scm.com/download/win
- O usa: `winget install Git.Git`

### 2. Configurar Git (primera vez)
```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "tu.email@example.com"
```

### 3. Inicializar el repositorio local
```powershell
cd C:\Users\mjimenez\Documents\ConversorPDF
git init
```

### 4. Agregar todos los archivos
```powershell
git add .
```

### 5. Hacer el primer commit
```powershell
git commit -m "Initial commit: PDF to DOCX converter with LibreOffice and OCR support"
```

### 6. Agregar el remote (repositorio en GitHub)
Reemplaza `TU_USUARIO` con tu usuario de GitHub:
```powershell
git remote add origin https://github.com/coopmaimon/ConversorPDF.git
```

O si ya tienes el repositorio en GitHub con SSH:
```powershell
git remote add origin git@github.com:coopmaimon/ConversorPDF.git
```

### 7. Hacer push al repositorio
```powershell
git branch -M main
git push -u origin main
```

## Notas importantes

- El archivo `.gitignore` creado automáticamente evitará que se suban:
  - `node_modules/` (las dependencias se instalan con `npm install`)
  - Archivos de configuración sensibles (`.env`)
  - Archivos generados (uploads/, output/, temp/)
  - Logs

- Si el repositorio no existe aún en GitHub, primero crea uno en:
  https://github.com/new
  - Nombre: `ConversorPDF`
  - Descripción: "PDF to DOCX Converter - Aplicación web para conversión de PDFs"
  - Privado o Público (como prefieras)
  - NO inicialices con README (usaremos el que creamos)

## Para futuros cambios

Después del primer push, en cada cambio que hagas:

```powershell
# Ver cambios
git status

# Agregar cambios
git add .

# Commit con mensaje descriptivo
git commit -m "Descripción del cambio"

# Push al repositorio
git push origin main
```

## Comandos útiles

```powershell
# Ver estado
git status

# Ver el historial de commits
git log --oneline

# Ver remotes configurados
git remote -v

# Actualizar el código desde GitHub
git pull origin main
```

---

Una vez hayas completado estos pasos, tu proyecto estará en GitHub y podrás descargarlo desde cualquier lugar con:
```powershell
git clone https://github.com/coopmaimon/ConversorPDF.git
```
