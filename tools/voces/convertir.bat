@echo off
rem Atajo de convertir.py con el Python de venv-seedvc. Ejemplos:
rem   convertir.bat salidas\hola.wav --voz voces\lider.wav
rem   convertir.bat salidas --voz voces\lider --mp3
setlocal
set PYTHONUTF8=1
rem --canto descarga otros modelos la primera vez: mismos certificados que en la instalacion.
if exist "%~dp0certificados.pem" set "REQUESTS_CA_BUNDLE=%~dp0certificados.pem"
if exist "%~dp0certificados.pem" set "SSL_CERT_FILE=%~dp0certificados.pem"
"%~dp0venv-seedvc\Scripts\python.exe" "%~dp0convertir.py" %*
