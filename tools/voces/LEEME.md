# Voces con Chatterbox (español de España)

Texto a voz local con [ResembleAI/Chatterbox-Multilingual-es-es](https://huggingface.co/ResembleAI/Chatterbox-Multilingual-es-es)
(licencia MIT), con clonación de voz a partir de un audio corto.

## Importante: `from_pretrained` no sirve

El ejemplo de la ficha del modelo (`pip install chatterbox-tts` y luego `ChatterboxTTS.from_pretrained(...)`) **no carga
este modelo**: descarga y usa el modelo base **inglés** (`ResembleAI/chatterbox`). Con él el español sale con acento
inglés o directamente mal. Tampoco vale el paquete `chatterbox-tts` de PyPI, porque su código no sabe leer los pesos
españoles (`t3_es_es.safetensors`, `s3gen_v3.pt` y el vocabulario `grapheme_mtl_merged_expanded_v1.json`).

El ajuste fino español solo funciona con el código del Space oficial
[`ResembleAI/Chatterbox-Multilingual-TTS-es-es`](https://huggingface.co/spaces/ResembleAI/Chatterbox-Multilingual-TTS-es-es).
Estos scripts lo hacen así:

1. `descargar.py` baja el código del Space a `chatterbox_es\` y los pesos españoles (más `ve.pt` y `conds.pt` del
   modelo base) a `modelos\es-es\`, con revisiones fijas para que código y pesos casen.
2. `generar.py` añade `chatterbox_es\chatterbox\src` al principio de `sys.path` (para que se use ese código y no un
   `chatterbox-tts` instalado) y carga el modelo con `from_local` desde esa carpeta:

```python
import sys
sys.path.insert(0, r'C:\IA\voces\chatterbox_es\chatterbox\src')
from chatterbox.tts import ChatterboxTTS

modelo = ChatterboxTTS.from_local(r'C:\IA\voces\modelos\es-es', 'cuda')  # o 'cpu'
modelo.prepare_conditionals(r'C:\IA\voces\voces\es_es_f1.wav')           # voz de referencia
wav = modelo.generate('Hola, esto es una prueba.', language_id='es')
```

Si quieres usarlo desde tu propio código, lo más sencillo es importar las funciones de `generar.py`
(`cargar_modelo`, `preparar_voz`, `sintetizar`, `guardar`), como hace `interfaz.py`. No instales `chatterbox-tts` en el
mismo entorno: no hace falta y puede confundirse con el código del Space.

## Instalación en `C:\IA\voces`

1. Instala [Python 3.11](https://www.python.org/downloads/release/python-3119/) (vale 3.10–3.12) marcando
   «Add python.exe to PATH».
2. Copia el contenido de esta carpeta (`tools/voces`) a `C:\IA\voces`.
3. Doble clic en `instalar.bat`. Crea `venv\`, instala PyTorch (con CUDA si hay tarjeta NVIDIA, si no la versión CPU)
   y las dependencias, y descarga el modelo (~3,2 GB) en `modelos\es-es\` y la voz de muestra en `voces\`.

Hace falta unos 10 GB libres. Con GPU NVIDIA (≥ 6 GB de VRAM) una frase tarda unos segundos; en CPU funciona, pero
es bastante más lento.

## Uso

Interfaz web: `interfaz.bat` (se abre en http://127.0.0.1:7860). Cada audio se guarda también en `salidas\`.

Línea de comandos (desde `C:\IA\voces`):

```bat
generar.bat "Hola, ¿cómo estás? Esto es una prueba."
generar.bat "Retirada, ¡todos a la base!" -o salidas\retirada.wav --voz voces\mi_voz.wav --exageracion 0.8
generar.bat --lista frases.txt --mp3
```

`frases.txt` lleva una pista por línea, `nombre|texto` (o solo el texto y se numeran 01, 02…); las líneas con `#` se
ignoran:

```
voz_lider_22|¡Aguantad, que ya vienen refuerzos!
voz_lider_23|Se nos acaba la munición.
```

Opciones: `--voz` (audio de referencia), `--exageracion` 0.25–2 (neutro 0.5), `--cfg` 0.2–1 (ritmo; más bajo, más
pausado), `--temperatura`, `--semilla` (para repetir un resultado), `--mp3` (necesita
[ffmpeg](https://www.gyan.dev/ffmpeg/builds/) en el PATH), `--dispositivo cpu|cuda`.

## Consejos

- Voz de referencia: 5–10 s de una sola persona, sin música ni ruido, en `.wav`. Se aprovechan como mucho 10 s.
- Para un tono más dramático: `--exageracion 0.7` o más y `--cfg 0.3`.
- Los textos largos se trocean por frases automáticamente.
- Los audios llevan una marca de agua inaudible (Perth) que pone el propio modelo.
