@echo off
rem Instala Seed-VC (conversion de voz sin entrenamiento) en esta carpeta, con su propio entorno venv-seedvc\
rem (no puede compartir el de Chatterbox: necesita otras versiones de algunas librerias).
rem Se puede volver a ejecutar sin problema: solo instala/descarga lo que falte.
setlocal
cd /d "%~dp0"
set PYTHONUTF8=1
set HF_HUB_DISABLE_SYMLINKS_WARNING=1

set PY=
for %%v in (3.10 3.11) do if not defined PY (py -%%v -c "" >nul 2>&1 && set "PY=py -%%v")
if not defined PY (python -c "import sys; sys.exit(0 if (3,10)<=sys.version_info[:2]<=(3,11) else 1)" >nul 2>&1 && set "PY=python")
if not defined PY (
  echo No encuentro Python 3.10 o 3.11. Instala Python 3.11 desde https://www.python.org/downloads/
  echo y marca "Add python.exe to PATH" durante la instalacion.
  goto :error
)
echo Usando: %PY%

if not exist venv-seedvc\Scripts\python.exe (
  echo Creando entorno virtual en venv-seedvc\ ...
  %PY% -m venv venv-seedvc || goto :error
)
rem Certificados: los de certifi mas los raiz de Windows (igual que instalar.bat), por si un antivirus inspecciona el HTTPS.
venv-seedvc\Scripts\python -c "import ssl; from pip._vendor import certifi; open('certificados.pem', 'w').write(open(certifi.where()).read() + ''.join(ssl.DER_cert_to_PEM_cert(c) for c, e, t in ssl.enum_certificates('ROOT') if e == 'x509_asn'))" || goto :error
set "PIP_CERT=%CD%\certificados.pem"
set "REQUESTS_CA_BUNDLE=%CD%\certificados.pem"
set "SSL_CERT_FILE=%CD%\certificados.pem"
venv-seedvc\Scripts\python -m pip install --upgrade pip || goto :error

rem PyTorch: CUDA 12.8 para NVIDIA RTX 20 o posteriores (incluidas las RTX 50), CUDA 12.6 para GTX 9xx/10xx, CPU si no hay NVIDIA.
set TORCH=cpu
set CAP=
nvidia-smi >nul 2>&1 && set TORCH=cu126
for /f "tokens=1 delims=." %%c in ('nvidia-smi --query-gpu^=compute_cap --format^=csv^,noheader 2^>nul') do set CAP=%%c
if defined CAP if %CAP% GEQ 7 set TORCH=cu128
echo Instalando PyTorch (%TORCH%) ...
venv-seedvc\Scripts\python -m pip install torch==2.8.0 torchaudio==2.8.0 --index-url https://download.pytorch.org/whl/%TORCH% || goto :error

echo Instalando dependencias ...
venv-seedvc\Scripts\python -m pip install -r requirements_seedvc.txt || goto :error

venv-seedvc\Scripts\python descargar_seedvc.py || goto :error

echo Primera conversion de prueba (descarga los modelos, ~1,5 GB) ...
venv-seedvc\Scripts\python convertir.py seed-vc\examples\source\source_s1.wav --voz seed-vc\examples\reference\s1p1.wav --pasos 10 --carpeta convertidos\prueba || goto :error

echo.
echo Listo. Prueba:
echo   convertir.bat salidas --voz voces\mi_voz.wav
echo   interfaz_seedvc.bat
pause
exit /b 0

:error
echo.
echo La instalacion se ha detenido por un error (mira los mensajes de arriba).
pause
exit /b 1
