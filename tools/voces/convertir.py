# Cambia la voz de uno o varios audios por la de una voz de referencia con Seed-VC (sin entrenar nada).
# Uso:
#   python convertir.py salidas\hola.wav --voz voces\lider.wav            -> convertidos\hola.wav
#   python convertir.py salidas --voz voces\lider --mp3                   -> todos los audios de la carpeta salidas
# --voz puede ser un archivo o una carpeta: de una carpeta se unen clips hasta 25 s (lo máximo que usa el modelo).
# Encaja tras generar.py: Chatterbox pone el texto y la entonación, Seed-VC el timbre exacto de la referencia.
import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from types import SimpleNamespace

BASE = Path(__file__).resolve().parent
SEEDVC = BASE / 'seed-vc'
CONVERTIDOS = BASE / 'convertidos'
AUDIO = {'.wav', '.mp3', '.flac', '.ogg', '.m4a', '.opus'}
MAX_REF = 25  # segundos de referencia que aprovecha el modelo
os.environ.setdefault('HF_HOME', str(SEEDVC / 'checkpoints' / 'hf'))


def audios(ruta):
    ruta = Path(ruta)
    return sorted(p for p in ruta.iterdir() if p.suffix.lower() in AUDIO) if ruta.is_dir() else [ruta]


def unir_referencia(carpeta, destino):
    """Junta los clips de la carpeta (con 0,3 s de silencio entre ellos) hasta MAX_REF segundos."""
    import librosa
    import numpy as np
    import soundfile as sf
    sr, partes, total = 22050, [], 0
    for f in audios(carpeta):
        y = librosa.load(f, sr=sr)[0]
        partes += [y, np.zeros(int(sr * .3), dtype=np.float32)]
        total += len(y) / sr + .3
        if total >= MAX_REF:
            break
    if not partes:
        sys.exit(f'No hay audios en {carpeta}')
    sf.write(destino, np.concatenate(partes)[:sr * MAX_REF], sr)
    print(f'Referencia: {min(total, MAX_REF):.1f} s unidos de {carpeta}')
    return destino


def a_mp3(wav):
    if not shutil.which('ffmpeg'):
        print('  (sin ffmpeg en el PATH: se queda en .wav)')
        return wav
    mp3 = wav.with_suffix('.mp3')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-codec:a', 'libmp3lame', '-q:a', '2',
                    str(mp3)], check=True)
    wav.unlink()
    return mp3


def main():
    p = argparse.ArgumentParser(description='Conversión de voz con Seed-VC.')
    p.add_argument('entrada', help='audio o carpeta de audios a convertir')
    p.add_argument('--voz', required=True, help='voz de referencia: un audio (1-30 s) o una carpeta de clips')
    p.add_argument('--carpeta', default=str(CONVERTIDOS), help='carpeta de salida')
    p.add_argument('--pasos', type=int, default=30, help='pasos de difusión: 10 rápido, 30-50 mejor calidad')
    p.add_argument('--cfg', type=float, default=0.7, help='fuerza de la guía (0-1)')
    p.add_argument('--velocidad', type=float, default=1.0, help='duración: <1 más rápido, >1 más lento')
    p.add_argument('--canto', action='store_true', help='modelo de canto (44 kHz, sigue la melodía)')
    p.add_argument('--semitonos', type=int, default=0, help='subir/bajar el tono (solo con --canto)')
    p.add_argument('--mp3', action='store_true', help='guardar en .mp3 (necesita ffmpeg en el PATH)')
    a = p.parse_args()
    if not (SEEDVC / 'inference.py').exists():
        sys.exit('Falta Seed-VC. Ejecuta antes instalar_seedvc.bat.')

    entradas = [f.resolve() for f in audios(a.entrada)]
    if not entradas:
        sys.exit(f'No hay audios en {a.entrada}')
    salida = Path(a.carpeta).resolve()
    salida.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix='seedvc_'))
    voz = Path(a.voz).resolve()
    if voz.is_dir():
        voz = unir_referencia(voz, tmp / 'referencia.wav')

    # Seed-VC busca sus configuraciones y modelos con rutas relativas a su carpeta.
    os.chdir(SEEDVC)
    sys.path.insert(0, str(SEEDVC))
    import torch
    import inference

    # inference.main carga los modelos en cada llamada: se cargan una vez y se reutilizan.
    cargar, cache = inference.load_models, []
    inference.load_models = lambda args: cache[0] if cache else (cache.append(cargar(args)) or cache[0])
    fp16 = torch.cuda.is_available()
    print('Dispositivo:', inference.device)

    for f in entradas:
        trabajo = tmp / 'salida'
        shutil.rmtree(trabajo, ignore_errors=True)
        inference.main(SimpleNamespace(
            source=str(f), target=str(voz), output=str(trabajo), diffusion_steps=a.pasos,
            inference_cfg_rate=a.cfg, length_adjust=a.velocidad, f0_condition=a.canto, auto_f0_adjust=False,
            semi_tone_shift=a.semitonos, checkpoint=None, config=None, fp16=fp16))
        final = salida / (f.stem + '.wav')
        shutil.move(str(next(trabajo.glob('*.wav'))), final)
        print(a_mp3(final) if a.mp3 else final)
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    main()
