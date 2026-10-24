@echo off
rem Atajo de generar.py con el Python del entorno de esta carpeta. Ejemplos:
rem   generar.bat "Hola, que tal" -o hola.wav
rem   generar.bat --lista frases.txt --mp3 --voz voces\mi_voz.wav
setlocal
set PYTHONUTF8=1
"%~dp0venv\Scripts\python.exe" "%~dp0generar.py" %*
