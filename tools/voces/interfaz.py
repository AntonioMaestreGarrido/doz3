# Interfaz web local (se abre en el navegador, http://127.0.0.1:7860) para probar voces y textos.
import time

import gradio as gr

from generar import SALIDAS, VOZ_MUESTRA, cargar_modelo, guardar, preparar_voz, sintetizar

MODELO = cargar_modelo()


def generar(texto, voz, exageracion, cfg, temperatura, semilla):
    if not texto.strip():
        raise gr.Error('Escribe algún texto.')
    preparar_voz(MODELO, voz, exageracion)
    audio = sintetizar(MODELO, texto, exageracion, cfg, temperatura, int(semilla))
    ruta = guardar(audio, MODELO.sr, SALIDAS / time.strftime('voz_%Y%m%d_%H%M%S'))
    return (MODELO.sr, audio), str(ruta)


with gr.Blocks(title='Voces es-ES') as demo:
    gr.Markdown('# Chatterbox — español (España)\nCada audio generado se guarda también en la carpeta `salidas`.')
    with gr.Row():
        with gr.Column():
            texto = gr.Textbox(label='Texto', lines=5,
                               value='Hola, ¿cómo estás? Hoy es un día perfecto para dar un paseo por la Plaza Mayor.')
            voz = gr.Audio(sources=['upload', 'microphone'], type='filepath', label='Voz de referencia (opcional)',
                           value=str(VOZ_MUESTRA) if VOZ_MUESTRA.exists() else None)
            exageracion = gr.Slider(0.25, 2, step=.05, value=.5, label='Exageración (neutro = 0.5)')
            cfg = gr.Slider(0.2, 1, step=.05, value=.5, label='CFG / ritmo')
            with gr.Accordion('Más opciones', open=False):
                temperatura = gr.Slider(0.05, 5, step=.05, value=.8, label='Temperatura')
                semilla = gr.Number(value=0, label='Semilla (0 = al azar)')
            boton = gr.Button('Generar', variant='primary')
        with gr.Column():
            salida = gr.Audio(label='Resultado')
            archivo = gr.Textbox(label='Guardado en', interactive=False)
    boton.click(generar, [texto, voz, exageracion, cfg, temperatura, semilla], [salida, archivo])

demo.launch(server_name='127.0.0.1', inbrowser=True)
