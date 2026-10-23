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
rem Certificados: los de certifi mas los raiz de Windows, para que pip y la descarga funcionen aunque un antivirus
rem (Avast, Kaspersky...) inspeccione el HTTPS con su propio certificado.
venv\Scripts\python -c "import ssl; from pip._vendor import certifi; open('certificados.pem', 'w').write(open(certifi.where()).read() + ''.join(ssl.DER_cert_to_PEM_cert(c) for c, e, t in ssl.enum_certificates('ROOT') if e == 'x509_asn'))" || goto :error
set "PIP_CERT=%CD%\certificados.pem"
set "REQUESTS_CA_BUNDLE=%CD%\certificados.pem"
set "SSL_CERT_FILE=%CD%\certificados.pem"
venv\Scripts\python -m pip install --upgrade pip || goto :error

rem PyTorch con CUDA si hay tarjeta NVIDIA: 12.8 para las modernas (sirve tambien para las RTX 50) y 12.6 para las
rem anteriores a la serie RTX 20 (GTX 10, compute capability < 7), que las versiones cu128 ya no admiten.
rem Sin tarjeta NVIDIA, version CPU (bastante mas lenta).
set TORCH=cpu
set CC=
for /f "tokens=1 delims=." %%c in ('nvidia-smi --query-gpu^=compute_cap --format^=csv^,noheader 2^>nul') do set CC=%%c
if defined CC set TORCH=cu128
if defined CC if %CC% LSS 7 set TORCH=cu126
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
