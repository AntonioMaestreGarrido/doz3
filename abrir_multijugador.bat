@echo off
rem Arranca un servidor local para la copia multijugador y abre el juego en el navegador.
rem Usa el puerto 8001 para poder tener abierta a la vez la copia principal (8000).
cd /d "%~dp0"
echo Juego multijugador en http://localhost:8001/  (cierra esta ventana para parar el servidor)
start "" cmd /c "timeout /t 2 >nul & start http://localhost:8001/"
python -m http.server 8001
