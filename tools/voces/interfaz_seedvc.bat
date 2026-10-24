@echo off
rem Interfaz web de Seed-VC en http://127.0.0.1:7861 (cierra esta ventana para pararla).
setlocal
cd /d "%~dp0seed-vc"
set PYTHONUTF8=1
set HF_HOME=%~dp0seed-vc\checkpoints\hf
set GRADIO_SERVER_PORT=7861
if exist "%~dp0certificados.pem" set "REQUESTS_CA_BUNDLE=%~dp0certificados.pem"
if exist "%~dp0certificados.pem" set "SSL_CERT_FILE=%~dp0certificados.pem"
set FP16=False
for /f %%g in ('..\venv-seedvc\Scripts\python.exe -c "import torch; print(torch.cuda.is_available())"') do set FP16=%%g
start "" cmd /c "timeout /t 40 >nul & start http://127.0.0.1:7861/"
..\venv-seedvc\Scripts\python.exe app_vc.py --fp16 %FP16%
pause
