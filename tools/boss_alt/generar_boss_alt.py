# Genera las 5 cartas de compensación de la Exp. 5 con el formato del arte alternativo (oscuro, 620x870 webp).
# Toma de assets/arte_alt/eventos/e_renqueantes.webp (marco, cabecera bronce, fondo) y e_brote_local/e_no_escapatoria (iconos de ruta),
# y de assets/cartas/e_boss_*.jpg la ilustración. Uso:  python tools/boss_alt/generar_boss_alt.py   (desde juego/)
import re, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
A = 'assets/arte_alt/eventos/e_%s.webp'
F = 'C:/Windows/Fonts/'
base = Image.open(A % 'renqueantes').convert('RGB')
W, H = base.size
CARDS = [  # id, título, acto, ruta, texto (**negrita**)
 ('heroe', 'Refuerzos: llega un Héroe', 2, 'T', 'Al inicio: elige un nuevo **Héroe** disponible y colócalo en el Centro de la Ciudad o en cualquier espacio Inicial.'),
 ('cargamento', 'Cargamento aéreo', 2, 'B', 'Al inicio: **+5 de Munición** y **+5 de Suministros**.'),
 ('brigada', 'Brigada civil', 3, 'M', 'Al inicio: elige una nueva unidad de **Civiles Heroicos** disponible y colócala en el Centro de la Ciudad.'),
 ('medico', 'Puesto médico de campaña', 3, 'F', 'Al inicio: retira todas las fichas de Impacto a todas las unidades de jugador en juego (en cualquier espacio) y recuperan su cara de Fuerza completa. **−2 de Infección.**'),
 ('adrenalina', 'Adrenalina colectiva', 4, 'A', 'Al inicio: cada **Héroe** y cada **Civil Heroico** en juego recibe **1 Acción gratis** este turno.'),
]
# iconos de ruta (con su fondo rojo del recuadro resaltado) recortados de cartas ya hechas: (carta, cx, cy)
SRC = {'B': ('renqueantes', 347, 522), 'A': ('renqueantes', 391, 522), 'T': ('renqueantes', 479, 522),
       'F': ('brote_local', 373, 518), 'M': ('brote_local', 417, 518)}
def icon(k):
    n, cx, cy = SRC[k]; im = Image.open(A % n).convert('RGB'); return im.crop((cx - 19, cy - 22, cx + 19, cy + 22))
def font(n, s): return ImageFont.truetype(F + n, s)
def grad_col(img, x, y0, y1): return [img.getpixel((x, y)) for y in range(y0, y1)]
BG = base.getpixel((300, 858)); BOX = (16, 9, 7)

def star(d, cx, cy, r, fill):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5; rr = r if i % 2 == 0 else r * .45
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=fill)

def wrap(d, text, w, fr, fb):
    # **negrita** -> tokens (palabra, bold); devuelve líneas de listas de (palabra, bold)
    toks = []; bold = False
    for part in re.split(r'(\*\*)', text):
        if part == '**': bold = not bold; continue
        for w_ in part.split(' '):
            if w_: toks.append((w_, bold))
    lines, cur, cw = [], [], 0
    for t, b in toks:
        f = fb if b else fr; tw = d.textlength(t + ' ', font=f)
        if cur and cw + tw > w: lines.append(cur); cur, cw = [], 0
        cur.append((t, b)); cw += tw
    lines.append(cur); return lines

def build(id_, title, act, route, text):
    im = base.copy(); d = ImageDraw.Draw(im)
    # --- cabecera: se repite la columna de degradado vertical x=100 (sin estrellas ni título)
    col = grad_col(base, 100, 4, 90)
    for y, c in enumerate(col):
        d.line([(10, 4 + y), (528 if 4 + y < 26 else 611, 4 + y)], fill=c)
    gold, dim = (255, 214, 120), (150, 100, 40)
    for i, (cx, cy) in enumerate([(33, 34), (60, 34), (33, 58), (60, 58)]): star(d, cx, cy, 11, gold if i < act else dim)
    f = font('georgiab.ttf', 33); tw = d.textlength(title, font=f)
    while tw > 400: f = font('georgiab.ttf', f.size - 2); tw = d.textlength(title, font=f)
    d.text((310 - tw / 2, 47), title, font=f, fill=(45, 24, 8), anchor='lm')
    # --- ilustración: ventana del jpg clásico, recorte centrado y degradado a negro abajo
    src = Image.open('assets/cartas/e_boss_%s.jpg' % id_).convert('RGB').crop((20, 108, 456, 296))
    tw_, th_ = 604, 346; sc = th_ / src.height; cw = round(tw_ / sc); x0 = (src.width - cw) // 2
    art = src.crop((x0, 0, x0 + cw, src.height)).resize((tw_, th_), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2, 60, 2))
    for y in range(th_ - 70, th_):
        t = (y - (th_ - 70)) / 70; t = t * t
        for x in range(tw_):
            p = art.getpixel((x, y)); art.putpixel((x, y), tuple(round(p[i] * (1 - t) + BG[i] * t) for i in range(3)))
    d.rectangle([9, 92, 611, 462], fill=BG); im.paste(art, (8, 92))
    # --- fila de datos
    d.rectangle([9, 464, 611, 566], fill=BG)
    def box(x0, x1, label, hi=False):
        d.rounded_rectangle([x0, 475, x1, 555], 14, fill=(96, 22, 18) if hi else BOX, outline=(255, 205, 120) if hi else (112, 84, 48), width=2 if hi else 1)
        fl = font('segoeuib.ttf', 12); d.text(((x0 + x1) / 2, 489), ' '.join(label), font=fl, fill=(245, 225, 190) if hi else (225, 200, 150), anchor='mm')
    fv = font('georgiab.ttf', 38)
    for (x0, x1, lb, v) in [(16, 111, '4R', '2'), (119, 214, 'INFECCIÓN', '0'), (222, 317, 'ALIM.', '0'), (508, 603, 'ACC.', '3')]:
        box(x0, x1, lb); d.text(((x0 + x1) / 2, 524), v, font=fv, fill=(245, 232, 205), anchor='mm')
    box(326, 500, 'ZEDS', True)
    ic = icon(route).convert('RGBA'); bgc = ic.getpixel((2, 2)); m = Image.new('L', ic.size, 0); md = ImageDraw.Draw(m)
    for y in range(ic.height):
        for x in range(ic.width):
            p = ic.getpixel((x, y)); dist = sum(abs(p[i] - bgc[i]) for i in range(3)); m.putpixel((x, y), min(255, max(0, (dist - 30) * 4)))
    im.paste(ic.convert("RGB"), (413 - 19, 522 - 24), m)
    # --- texto
    area_y = 590; d.rectangle([10, 575, 610, 858], fill=BG)
    fr, fb = font('segoeui.ttf', 25), font('segoeuib.ttf', 25); y = area_y
    for line in wrap(d, text, 560, fr, fb):
        x = 30
        for i, (t, b) in enumerate(line):
            ff = fb if b else fr; d.text((x, y), t, font=ff, fill=(255, 220, 140) if b else (240, 230, 214))
            nxt = line[i + 1][0] if i + 1 < len(line) else ''; x += d.textlength(t if nxt[:1] in '.,;:' and nxt else t + ' ', font=ff)
        y += 34
    im.save('assets/arte_alt/eventos/e_boss_%s.webp' % id_, 'WEBP', quality=90)
    return im

for c in CARDS: build(*c)
print('ok')
