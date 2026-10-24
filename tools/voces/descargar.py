# Descarga el código de Chatterbox del Space oficial español, los pesos del modelo y una voz de muestra.
# Todo queda dentro de esta carpeta: chatterbox_es\ (código), modelos\es-es\ (unos 3,2 GB) y voces\es_es_f1.wav.
# Uso: python descargar.py   (lo llama instalar.bat; se puede repetir, solo baja lo que falte)
import urllib.request
from pathlib import Path

from huggingface_hub import hf_hub_download, snapshot_download

BASE = Path(__file__).resolve().parent
CODIGO = BASE / 'chatterbox_es'
MODELOS = BASE / 'modelos' / 'es-es'
VOCES = BASE / 'voces'

# Revisiones fijas: el código del Space y los pesos van emparejados (s3gen_v3, vocabulario de 2454 tokens).
SPACE = ('ResembleAI/Chatterbox-Multilingual-TTS-es-es', 'f7991c03de6130583b1f103477d139de96329994')
MODELO_ES = ('ResembleAI/Chatterbox-Multilingual-es-es', '7262b364e3222ba9446c9289e7485eadc47ed902')
MODELO_BASE = ('ResembleAI/chatterbox', '5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18')
ARCHIVOS_ES = ['t3_es_es.safetensors', 's3gen_v3.pt', 'grapheme_mtl_merged_expanded_v1.json']
ARCHIVOS_BASE = ['ve.pt', 'conds.pt']
VOZ_MUESTRA = 'https://storage.googleapis.com/chatterbox-demo-samples/mtl-v3-single-language-prompts/es-es/es_es_f1.wav'

print('Código de Chatterbox (Space es-es)...')
snapshot_download(repo_id=SPACE[0], revision=SPACE[1], repo_type='space',
                  allow_patterns=['chatterbox/*'], local_dir=CODIGO)

for (repo, rev), archivos in ((MODELO_ES, ARCHIVOS_ES), (MODELO_BASE, ARCHIVOS_BASE)):
    for f in archivos:
        print('Modelo:', repo, f)
        hf_hub_download(repo_id=repo, revision=rev, filename=f, local_dir=MODELOS)

VOCES.mkdir(exist_ok=True)
muestra = VOCES / 'es_es_f1.wav'
if not muestra.exists():
    print('Voz de muestra:', muestra.name)
    urllib.request.urlretrieve(VOZ_MUESTRA, muestra)

print('Descarga completa.')
