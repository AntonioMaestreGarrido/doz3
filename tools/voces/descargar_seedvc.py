# Descarga el código de Seed-VC (https://github.com/Plachtaa/seed-vc, licencia GPL-3.0) en la carpeta seed-vc\.
# Los modelos (~1,5 GB) los baja el propio Seed-VC la primera vez que convierte; instalar_seedvc.bat hace esa
# primera conversión de prueba para que queden descargados en seed-vc\checkpoints\.
import io
import shutil
import urllib.request
import zipfile
from pathlib import Path

BASE = Path(__file__).resolve().parent
DESTINO = BASE / 'seed-vc'
COMMIT = '51383efd921027683c89e5348211d93ff12ac2a8'  # versión probada (abril de 2025)
URL = f'https://github.com/Plachtaa/seed-vc/archive/{COMMIT}.zip'

if (DESTINO / 'inference.py').exists():
    print('Seed-VC ya está en', DESTINO)
else:
    print('Descargando Seed-VC ...')
    with urllib.request.urlopen(URL) as r:
        datos = r.read()
    tmp = BASE / '_seedvc_tmp'
    shutil.rmtree(tmp, ignore_errors=True)
    zipfile.ZipFile(io.BytesIO(datos)).extractall(tmp)
    shutil.move(str(next(tmp.iterdir())), DESTINO)
    tmp.rmdir()
    print('Seed-VC descargado en', DESTINO)
