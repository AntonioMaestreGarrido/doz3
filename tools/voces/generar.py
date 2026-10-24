# Texto a voz en español de España con Chatterbox (ResembleAI/Chatterbox-Multilingual-es-es).
# Uso:
#   python generar.py "Hola, ¿qué tal?"                       -> salidas\voz_<fecha>.wav con la voz de muestra
#   python generar.py "Hola" -o hola.wav --voz mi_voz.wav     -> clona la voz de mi_voz.wav (5-10 s limpios bastan)
#   python generar.py --lista frases.txt --mp3                -> una pista por línea ("nombre|texto" o solo el texto)
# Los textos largos se trocean por frases (el modelo rinde mejor por debajo de ~300 caracteres) y se unen.
import argparse
import random
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf
import torch

BASE = Path(__file__).resolve().parent
MODELOS = BASE / 'modelos' / 'es-es'
VOZ_MUESTRA = BASE / 'voces' / 'es_es_f1.wav'
SALIDAS = BASE / 'salidas'
MAX_TROZO = 250
PAUSA = 0.25  # segundos de silencio entre trozos

sys.path.insert(0, str(BASE / 'chatterbox_es' / 'chatterbox' / 'src'))


def cargar_modelo(dispositivo='auto'):
    if not (MODELOS / 't3_es_es.safetensors').exists():
        sys.exit('Falta el modelo. Ejecuta antes instalar.bat (o python descargar.py).')
    from chatterbox.tts import ChatterboxTTS
    if dispositivo == 'auto':
        dispositivo = 'cuda' if torch.cuda.is_available() else 'cpu'
    print('Cargando modelo en', dispositivo, '...')
    return ChatterboxTTS.from_local(MODELOS, dispositivo)


def trocear(texto):
    frases = re.split(r'(?<=[.!?…])\s+', ' '.join(texto.split()))
    trozos, actual = [], ''
    for f in frases:
        while len(f) > MAX_TROZO:  # frase sin puntos demasiado larga: se corta por la última coma o espacio
            corte = max(f.rfind(',', 0, MAX_TROZO), f.rfind(' ', 0, MAX_TROZO))
            corte = corte if corte > 0 else MAX_TROZO
            trozos.append(f[:corte + 1].strip()); f = f[corte + 1:].strip()
        if actual and len(actual) + 1 + len(f) > MAX_TROZO:
            trozos.append(actual); actual = f
        else:
            actual = (actual + ' ' + f).strip()
    if actual:
        trozos.append(actual)
    return trozos


def fijar_semilla(semilla):
    if semilla:
        random.seed(semilla); np.random.seed(semilla); torch.manual_seed(semilla)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(semilla)


def preparar_voz(modelo, voz, exageracion):
    voz = voz or (VOZ_MUESTRA if VOZ_MUESTRA.exists() else None)
    if voz:
        modelo.prepare_conditionals(str(voz), exaggeration=exageracion)


def sintetizar(modelo, texto, exageracion=0.5, cfg=0.5, temperatura=0.8, semilla=0):
    """Devuelve el audio (numpy float32, mono, a modelo.sr Hz). La voz se fija antes con preparar_voz."""
    fijar_semilla(semilla)
    silencio = np.zeros(int(modelo.sr * PAUSA), dtype=np.float32)
    partes = []
    for i, trozo in enumerate(trocear(texto)):
        wav = modelo.generate(trozo, exaggeration=exageracion, cfg_weight=cfg, temperature=temperatura, language_id='es')
        partes += ([silencio] if i else []) + [wav.squeeze(0).cpu().numpy().astype(np.float32)]
    return np.concatenate(partes) if partes else silencio


def guardar(audio, sr, ruta, mp3=False):
    ruta = Path(ruta)
    ruta.parent.mkdir(parents=True, exist_ok=True)
    sf.write(ruta.with_suffix('.wav'), audio, sr)
    if mp3:
        if not shutil.which('ffmpeg'):
            print('  (sin ffmpeg en el PATH: se queda en .wav)')
        else:
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(ruta.with_suffix('.wav')),
                            '-codec:a', 'libmp3lame', '-q:a', '2', str(ruta.with_suffix('.mp3'))], check=True)
            ruta.with_suffix('.wav').unlink()
            return ruta.with_suffix('.mp3')
    return ruta.with_suffix('.wav')


def leer_lista(archivo):
    pistas = []
    for linea in Path(archivo).read_text(encoding='utf-8-sig').splitlines():
        linea = linea.strip()
        if not linea or linea.startswith('#'):
            continue
        nombre, _, texto = linea.partition('|') if '|' in linea else (f'{len(pistas) + 1:02d}', '', linea)
        pistas.append((nombre.strip(), texto.strip()))
    return pistas


def main():
    p = argparse.ArgumentParser(description='Texto a voz en español (España) con Chatterbox.')
    p.add_argument('texto', nargs='?', help='texto a leer')
    p.add_argument('--lista', help='archivo .txt con una pista por línea: "nombre|texto" o solo el texto')
    p.add_argument('-o', '--salida', help='archivo de salida (modo texto)')
    p.add_argument('--carpeta', default=str(SALIDAS), help='carpeta de salida (modo lista)')
    p.add_argument('--voz', help='audio de referencia para clonar la voz (por defecto voces\\es_es_f1.wav)')
    p.add_argument('--exageracion', type=float, default=0.5, help='expresividad, 0.25-2 (neutro 0.5)')
    p.add_argument('--cfg', type=float, default=0.5, help='guía/ritmo, 0.2-1 (más bajo = más pausado)')
    p.add_argument('--temperatura', type=float, default=0.8, help='variación, 0.05-5')
    p.add_argument('--semilla', type=int, default=0, help='semilla para repetir un resultado (0 = al azar)')
    p.add_argument('--mp3', action='store_true', help='guardar en .mp3 (necesita ffmpeg en el PATH)')
    p.add_argument('--dispositivo', default='auto', choices=['auto', 'cuda', 'cpu'])
    a = p.parse_args()
    if not a.texto and not a.lista:
        p.error('indica un texto o --lista archivo.txt')

    modelo = cargar_modelo(a.dispositivo)
    preparar_voz(modelo, a.voz, a.exageracion)
    if a.lista:
        pistas = [(Path(a.carpeta) / n, t) for n, t in leer_lista(a.lista)]
    else:
        pistas = [(Path(a.salida) if a.salida else SALIDAS / time.strftime('voz_%Y%m%d_%H%M%S'), a.texto)]
    for ruta, texto in pistas:
        t0 = time.time()
        audio = sintetizar(modelo, texto, a.exageracion, a.cfg, a.temperatura, a.semilla)
        final = guardar(audio, modelo.sr, ruta, a.mp3)
        print(f'{final}  ({len(audio) / modelo.sr:.1f} s de audio en {time.time() - t0:.0f} s)')


if __name__ == '__main__':
    main()
