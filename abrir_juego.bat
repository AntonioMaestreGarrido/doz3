@echo off
rem Arranca un servidor local para esta carpeta y abre el juego en el navegador.
rem Hace falta para que las letras (.txt) se puedan leer; los mp3 funcionan igual.
cd /d "%~dp0"
echo Juego en http://localhost:8000/  (cierra esta ventana para parar el servidor)
start "" cmd /c "timeout /t 2 >nul & start http://localhost:8000/"
python -m http.server 8000
