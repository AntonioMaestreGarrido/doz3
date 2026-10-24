@echo off
rem Atajo de convertir.py con el Python de venv-seedvc. Ejemplos:
rem   convertir.bat salidas\hola.wav --voz voces\lider.wav
rem   convertir.bat salidas --voz voces\lider --mp3
setlocal
set PYTHONUTF8=1
"%~dp0venv-seedvc\Scripts\python.exe" "%~dp0convertir.py" %*
