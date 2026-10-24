@echo off
rem Instala Chatterbox es-ES en esta carpeta (p. ej. C:\IA\voces): entorno de Python, dependencias y modelo (~3,2 GB).
rem Se puede volver a ejecutar sin problema: solo instala/descarga lo que falte.
setlocal
cd /d "%~dp0"
set PYTHONUTF8=1
set HF_HUB_DISABLE_SYMLINKS_WARNING=1

rem Python 3.10, 3.11 o 3.12 (las versiones que admiten las dependencias fijadas).
set PY=
for %%v in (3.11 3.10 3.12) do if not defined PY (py -%%v -c "" >nul 2>&1 && set "PY=py -%%v")
if not defined PY (python -c "import sys; sys.exit(0 if (3,10)<=sys.version_info[:2]<=(3,12) else 1)" >nul 2>&1 && set "PY=python")
if not defined PY (
  echo No encuentro Python 3.10, 3.11 o 3.12. Instala Python 3.11 desde https://www.python.org/downloads/
  echo y marca "Add python.exe to PATH" durante la instalacion.
  goto :error
)
echo Usando: %PY%

if not exist venv\Scripts\python.exe (
  echo Creando entorno virtual en venv\ ...
  %PY% -m venv venv || goto :error
)
venv\Scripts\python -m pip install --upgrade pip || goto :error

rem PyTorch: CUDA 12.8 para NVIDIA RTX 20 o posteriores (incluidas las RTX 50), CUDA 12.6 para GTX 9xx/10xx,
rem y version CPU (bastante mas lenta) si no hay tarjeta NVIDIA.
set TORCH=cpu
set CAP=
nvidia-smi >nul 2>&1 && set TORCH=cu126
for /f "tokens=1 delims=." %%c in ('nvidia-smi --query-gpu^=compute_cap --format^=csv^,noheader 2^>nul') do set CAP=%%c
if defined CAP if %CAP% GEQ 7 set TORCH=cu128
echo Instalando PyTorch (%TORCH%) ...
venv\Scripts\python -m pip install torch==2.8.0 torchaudio==2.8.0 --index-url https://download.pytorch.org/whl/%TORCH% || goto :error

echo Instalando dependencias ...
venv\Scripts\python -m pip install -r requirements.txt || goto :error

echo Descargando codigo, modelo y voz de muestra ...
venv\Scripts\python descargar.py || goto :error

echo.
echo Listo. Prueba:
echo   generar.bat "Hola, esto es una prueba de voz."
echo   interfaz.bat
pause
exit /b 0

:error
echo.
echo La instalacion se ha detenido por un error (mira los mensajes de arriba).
pause
exit /b 1
