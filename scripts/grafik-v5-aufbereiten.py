# Grafikpaket „Mystic Aurora V5“ für das neue Dauer-HUD/Intro aufbereiten (05.11.2026, Wunsch Auftraggeber).
# Das Paket ist ein flaches Bild (2896×543), auf 4K hochgerechnet. Hier: auf die Originalgröße zurückrechnen,
# KI-hochskalieren (Real-ESRGAN x4plus, lokal) bzw. ein Magnific-Ergebnis übernehmen, auf 5760×1080 (3 × Full HD)
# bringen, die alten Runen (Bögen links/rechts, Ring um den Reaktor) entfernen – die zeichnet die Szene selbst als
# drehende Ringe mit echten Runen – und die beweglichen Leucht-Ebenen ausschneiden.
#
# Aufruf (Umgebung modelle/upscale, nicht in Git):
#   modelle/upscale/.venv/Scripts/python.exe scripts/grafik-v5-aufbereiten.py [magnific-bild.png]
# Ergebnis: hud5/ebenen/*.webp + geometrie.json
import sys, json, os, numpy as np, cv2, torch
from PIL import Image

Q = 'grafik/v5/LOKI_Mystic_Aurora_3x4K_V5/'
A = Q + '09_ANIMATION_READY_V5/01_ALIGNED_4K_ORIGINAL/'
FX = Q + '09_ANIMATION_READY_V5/04_MOTION_FX/'
ZIEL = 'hud5/ebenen/'
B, H = 5760, 1080
FAKTOR = 3.977900552486188
os.makedirs(ZIEL, exist_ok=True)

def monitore(namen):
    """drei 4K-Bildschirmdateien zu einem 11520×2160-Bild zusammensetzen"""
    p = Image.new('RGBA', (11520, 2160))
    for i, n in enumerate(namen):
        if n: p.paste(Image.open(n).convert('RGBA'), (i * 3840, 0))
    return p

def esrgan(bild):
    from spandrel import ModelLoader
    modell = ModelLoader().load_from_file('modelle/upscale/RealESRGAN_x4plus.pth').cuda().eval().half()
    a = torch.from_numpy(np.asarray(bild, dtype=np.float32) / 255).permute(2, 0, 1)[None].cuda().half()
    _, _, h, w = a.shape; k, r = 320, 16
    aus = torch.zeros((1, 3, h * 4, w * 4), device='cuda', dtype=torch.half)
    for y in range(0, h, k):
        for x in range(0, w, k):
            y0, x0, y1, x1 = max(y - r, 0), max(x - r, 0), min(y + k + r, h), min(x + k + r, w)
            with torch.no_grad(): t = modell(a[:, :, y0:y1, x0:x1])
            yh, xw = min(k, h - y) * 4, min(k, w - x) * 4
            aus[:, :, y * 4:y * 4 + yh, x * 4:x * 4 + xw] = t[:, :, (y - y0) * 4:(y - y0) * 4 + yh, (x - x0) * 4:(x - x0) * 4 + xw]
    return Image.fromarray((aus[0].float().clamp(0, 1).permute(1, 2, 0).cpu().numpy() * 255 + 0.5).astype(np.uint8))

# 1. Grundbild: Fenster leer („ohne Inhalte“), scharf hochskaliert
roh = monitore([Q + '00_MASTER/MONITOR_0%d_%s_OHNE_INHALTE.png' % (i + 1, n) for i, n in enumerate(['LINKS', 'MITTE', 'RECHTS'])]).convert('RGB')
if len(sys.argv) > 1:
    gross = Image.open(sys.argv[1]).convert('RGB'); quelle = 'magnific'
else:
    gross = esrgan(roh.resize((2896, 543), Image.LANCZOS)); quelle = 'esrgan'
grund = np.asarray(gross.resize((B, H), Image.LANCZOS)).copy()
print('Grundbild', quelle, gross.size)

# 2. alte Runen finden (Cyan-Leuchtflecken in den Runenbändern) und wegretuschieren
def runenMaske(bild, cx, cy, r0, r1, wmin=None, wmax=None):
    im = bild.astype(int)
    hh, ww = im.shape[:2]; yy, xx = np.mgrid[0:hh, 0:ww]
    r = np.hypot(xx - cx, yy - cy)
    m = ((im[..., 2] > 140) & (im[..., 1] > 120) & (im[..., 0] < 140) & (r > r0) & (r < r1)).astype(np.uint8)
    if wmin is not None:
        w = np.degrees(np.arctan2(yy - cy, xx - cx)); m &= ((w > wmin) & (w < wmax)).astype(np.uint8) if wmin < wmax else ((w > wmin) | (w < wmax)).astype(np.uint8)
    m = cv2.dilate(m, np.ones((5, 5), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    raus = np.zeros_like(m)
    for i in range(1, n):  # nur rune-große Flecken, keine langen Kreislinien
        if st[i][4] > 40 and max(st[i][2], st[i][3]) < 75: raus[lab == i] = 1
    return cv2.dilate(raus, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))  # samt Lichthof

# Kreise in 4K-Bildschirmkoordinaten vermessen (scripts/runen-vermessen.py) → hier auf 5760×1080 umgerechnet
GEO = {
    'reaktor': {'x': 1920 + 1922 / 2, 'y': 989 / 2},
    'ringMitte': {'x': 1920 + 1922 / 2, 'y': 989 / 2, 'r': 905 / 2, 'r0': 852 / 2, 'r1': 958 / 2},
    'ringLinks': {'x': 1475 / 2, 'y': 1114 / 2, 'r': 1240 / 2, 'von': 138, 'bis': -138},
    'ringRechts': {'x': 3840 + 2286 / 2, 'y': 1066 / 2, 'r': 1335 / 2, 'von': -42, 'bis': 42},
}
masken = np.zeros((H, B), np.uint8)
g = GEO['ringMitte']; m = runenMaske(grund, g['x'], g['y'], g['r0'], g['r1']); m[800:] = 0; masken |= m  # Spiegelungen im See (ab Zeile 800) bleiben
g = GEO['ringLinks']; masken |= runenMaske(grund, g['x'], g['y'], g['r'] - 55, g['r'] + 50, 130, -130)
g = GEO['ringRechts']; masken |= runenMaske(grund, g['x'], g['y'], g['r'] - 55, g['r'] + 55, -50, 50)
grund = cv2.inpaint(grund, masken, 12, cv2.INPAINT_TELEA)
Image.fromarray(grund).save(ZIEL + 'grund.webp', quality=93, method=6)
Image.fromarray(masken * 255).save('grafik/runen-maske-pruefen.png')  # zum Nachsehen, nicht im Programm
print('Runen entfernt:', int(masken.sum()), 'Pixel')

# 3. bewegliche Leucht-Ebenen (werden additiv darübergelegt, das Grundbild bleibt vollständig)
ebenen = {}
def ebene(name, bild):
    k = bild.resize((B, H), Image.LANCZOS); box = k.getbbox()
    if not box: return
    k.crop(box).save(ZIEL + name + '.webp', quality=90, method=6, lossless=False)
    ebenen[name] = {'x': box[0], 'y': box[1], 'b': box[2] - box[0], 'h': box[3] - box[1]}
aura = Image.open(Q + '01_BACKGROUND/AURORA_ORIGINAL_FARBANTEILE.png').convert('RGBA')
voll = Image.new('RGBA', (11520, 2160)); voll.alpha_composite(aura, (91, 0)); ebene('aurora', voll)
ebene('halo', monitore([None, FX + 'REACTOR_CORE_HALO_PULSE_RGBA_3840x2160.png', None]))
ebene('wasser', monitore([None, A + 'MITTE_WASSERWELLEN_MITTE_3840x2160.png', None]))
# Reaktor-Kern scharf aus dem Grundbild, Form aus der Kern-Maske (für das Pulsieren)
kern = monitore([None, A + 'MITTE_REAKTOR_RING_01_ORIGINAL_PIXELS_3840x2160.png', None]).resize((B, H), Image.LANCZOS)
kernScharf = Image.fromarray(grund).convert('RGBA'); kernScharf.putalpha(kern.getchannel('A')); ebene('kern', kernScharf)

json.dump({'quelle': quelle, 'breite': B, 'hoehe': H, 'ebenen': ebenen, **GEO}, open(ZIEL + 'geometrie.json', 'w'), indent=1)
print('fertig', list(ebenen))
