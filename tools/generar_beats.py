# Genera el mapa de beats de una pista para la animación de la victoria.
# Uso: python generar_beats.py <entrada.mp3> <salida.beats.json>
# Además de los pulsos, guarda los "cortes" (tramos donde la batería para: huecos de más de 1.2 s entre golpes).
# Dentro de un corte no hay pulsos: la coreografía se queda quieta hasta el siguiente.
import json, sys
import numpy as np
import librosa

CORTE_MIN = 1.2  # segundos sin golpes de batería
# Entrada de la batería (segundos). El detector no distingue la batería del resto de percusión al inicio
# (hay percusión desde el segundo 0), así que se fija a oído. Ajustar si cambia la pista.
ENTRADA_BATERIA = 14.0

src = sys.argv[1]
dst = sys.argv[2]

y, sr = librosa.load(src, sr=22050, mono=True)
dur = librosa.get_duration(y=y, sr=sr)
onset_env = librosa.onset.onset_strength(y=y, sr=sr)
tempo, beat_frames = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr, units='frames')
beats = librosa.frames_to_time(beat_frames, sr=sr)
tempo_val = float(np.atleast_1d(tempo)[0])

golpes = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, units='time')
cortes = [[round(float(a), 3), round(float(b), 3)] for a, b in zip(golpes[:-1], golpes[1:]) if b - a > CORTE_MIN]
pulsos = [float(t) for t in beats if not any(a < t < b for a, b in cortes)]

out = {
    "file": "musica_victoria.mp3",
    "duration": round(float(dur), 3),
    "tempo": round(tempo_val, 2),
    "beats": [round(t, 3) for t in pulsos],
    "cortes": cortes,
    "entrada": ENTRADA_BATERIA,
}
with open(dst, 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False)

print('duration', round(dur, 2), 's')
print('tempo', round(tempo_val, 2), 'BPM')
print('pulsos', len(pulsos), 'de', len(beats), '(quitados dentro de cortes:', len(beats) - len(pulsos), ')')
print('cortes', cortes)
print('entrada de batería', ENTRADA_BATERIA, 's')
