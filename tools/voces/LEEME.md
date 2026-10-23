# Voces con Chatterbox (español de España)

Texto a voz local con [ResembleAI/Chatterbox-Multilingual-es-es](https://huggingface.co/ResembleAI/Chatterbox-Multilingual-es-es)
(licencia MIT), con clonación de voz a partir de un audio corto.

Ojo: el ejemplo de la ficha del modelo (`pip install chatterbox-tts` + `ChatterboxTTS.from_pretrained`) carga el modelo
**inglés**, no este. Para usar el ajuste fino español hace falta el código del Space oficial
(`ResembleAI/Chatterbox-Multilingual-TTS-es-es`), que es lo que descargan estos scripts.

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
