@echo off
rem Abre la interfaz web local en http://127.0.0.1:7860 (cierra esta ventana para pararla).
setlocal
cd /d "%~dp0"
set PYTHONUTF8=1
venv\Scripts\python.exe interfaz.py
pause
