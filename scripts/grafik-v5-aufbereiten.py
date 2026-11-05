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
# Reaktor: „L.O.K.I.“ und Drachen kleiner (Wunsch Auftraggeber 05.11.2026). Magnific hat die Stelle im Ausschnitt
# sauber zu Stein nachgemalt (grafik/magnific/reaktor_ohne_schrift.png, Ausschnitt laut reaktor_ausschnitt.json).
# Die Leuchtschrift selbst = Unterschied alt − neu (additives Licht); sie wird verkleinert als eigene Ebene „schrift“
# wieder aufgelegt, darunter schreibt die Szene die volle Bedeutung.
schrift = None
SCHRIFT_FAKTOR = 0.62
if quelle == 'magnific' and os.path.exists('grafik/magnific/reaktor_ohne_schrift.png'):
    box = json.load(open('grafik/magnific/reaktor_ausschnitt.json'))['box']
    alt = np.asarray(gross.crop(box)).astype(np.int16)
    neu = Image.open('grafik/magnific/reaktor_ohne_schrift.png').convert('RGB').resize((box[2] - box[0], box[3] - box[1]))
    maske = np.asarray(Image.open('grafik/magnific/reaktor_maske.png').convert('L').resize(neu.size)) > 127
    licht = np.clip((alt - np.asarray(neu).astype(np.int16)) * 1.5, 0, 255) * maske[..., None]  # etwas heller: kleiner wirkt sonst blass
    gross = gross.copy(); gross.paste(neu, box[:2])
    # Licht um die eigene Mitte verkleinern (bleibt mittig im Steinband, darunter Platz für die Bedeutung)
    ys, xs = np.nonzero(licht.max(axis=2) > 20)
    mx, my = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    l = Image.fromarray(licht.astype(np.uint8)); kb = (round(l.width * SCHRIFT_FAKTOR), round(l.height * SCHRIFT_FAKTOR))
    klein = l.resize(kb, Image.LANCZOS)
    schrift = Image.new('RGB', l.size)
    schrift.paste(klein, (round(mx - mx * SCHRIFT_FAKTOR), round(my - my * SCHRIFT_FAKTOR + 24)))  # etwas tiefer: weg von den Spulen
    gs = Image.new('RGB', gross.size); gs.paste(schrift, box[:2]); schrift = gs
    print('Schrift im Reaktor: verkleinert auf', SCHRIFT_FAKTOR)
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
# Rechter Bildschirm = gespiegelter linker (Vorschlag Auftraggeber 05.11.2026): Runenband und Fensterrahmen rechts waren
# im Paket verzogen, links sauber. Gespiegelt wird der äußere Teil; zum mittleren Bildschirm hin (lokal x < 380) bleibt
# der eigene Hintergrund, dazwischen weicher Übergang, damit Aurora und Berge an der Bildschirmgrenze anschließen.
SPIEGEL_AB, SPIEGEL_VOLL = 250, 380
spiegel = grund[:, 0:1920][:, ::-1].astype(np.float32)
anteil = np.clip((np.arange(1920) - SPIEGEL_AB) / (SPIEGEL_VOLL - SPIEGEL_AB), 0, 1)[None, :, None]
grund[:, 3840:] = (grund[:, 3840:].astype(np.float32) * (1 - anteil) + spiegel * anteil).astype(np.uint8)
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
def ausGrund(name, maske):
    """Ebene aus dem (hochskalierten) Grundbild selbst – passt so immer genau, auch nach Magnific"""
    a = cv2.GaussianBlur(np.clip(maske, 0, 1).astype(np.float32), (0, 0), 1)
    bild = Image.fromarray(grund).convert('RGBA'); bild.putalpha(Image.fromarray((a * 255).astype(np.uint8))); ebene(name, bild)
gf = grund.astype(np.float32)
gruen = gf[..., 1] - np.maximum(gf[..., 0], gf[..., 2] * 0.85)  # Aurora: deutlich grüner als rot/blau
ausGrund('aurora', (gruen - 12) / 50)
yy = np.mgrid[0:H, 0:B][0]
hell = (gf.max(axis=2) - 90) / 90  # Wasser: helle Glanzpunkte im See (unterhalb des Horizonts, mittlerer Bildschirm)
ausGrund('wasser', hell * (yy > 845))
# Reaktor (Wunsch Auftraggeber 05.11.2026: lebendiger, Rauch dahinter, Spiegelung im See) – Kreise vermessen am
# Grundbild: Steinring außen r ≈ 330, Spulenring r ≈ 120–215, Kernscheibe mit Lichtpunkten r < 98
xx = np.mgrid[0:H, 0:B][1]
rr = np.hypot(xx - GEO['reaktor']['x'], yy - GEO['reaktor']['y'])
def kreis(r0, r1, rand):
    return np.clip((rr - r0) / rand + 1, 0, 1) * np.clip((r1 - rr) / rand + 1, 0, 1)
# Umriss des Reaktors aus der freigestellten Vorlage (1254 px im 4K-Bildschirm, Mitte bei 1922/989) – genauer als ein
# Kreis, sonst bliebe ein Streifen Himmel ohne Rauch rund um den Stein sichtbar
vorlage = Image.open(Q + '03_CENTER/REACTOR/REACTOR_ORIGINAL_TRANSPARENT_1254x1254.png').convert('RGBA')
umriss = Image.new('L', (B, H)); s2 = 1254 / 2
umriss.paste(vorlage.getchannel('A').resize((round(s2), round(s2)), Image.LANCZOS), (round(GEO['reaktor']['x'] - s2 / 2), round(GEO['reaktor']['y'] - s2 / 2)))
ausGrund('reaktor', cv2.erode(np.asarray(umriss, np.float32) / 255, np.ones((3, 3), np.uint8)))
ausGrund('kernscheibe', kreis(-10, 98, 6))
blau = (gf[..., 2] - gf[..., 0] - 60) / 80  # leuchtende blaue Zellen zwischen den Spulen
ausGrund('zellen', np.clip(blau, 0, 1) * kreis(118, 215, 6))
ebene('halo', monitore([None, FX + 'REACTOR_CORE_HALO_PULSE_RGBA_3840x2160.png', None]))
if schrift is not None:  # additiv: Farbe = Licht, Deckkraft voll (die Szene legt sie mit „lighter“ auf)
    a = np.asarray(schrift).astype(np.float32); al = a.max(axis=2)
    farbe = np.clip(a * 255 / np.maximum(al, 1)[..., None], 0, 255)
    s4 = Image.fromarray(np.dstack([farbe, al]).astype(np.uint8), 'RGBA'); ebene('schrift', s4)
# Reaktor-Kern scharf aus dem Grundbild, Form aus der Kern-Maske (für das Pulsieren)
kern = monitore([None, A + 'MITTE_REAKTOR_RING_01_ORIGINAL_PIXELS_3840x2160.png', None]).resize((B, H), Image.LANCZOS)
kernScharf = Image.fromarray(grund).convert('RGBA'); kernScharf.putalpha(kern.getchannel('A')); ebene('kern', kernScharf)

# 4. Bahn der Runen links/rechts (Rückmeldung Auftraggeber 05.11.2026: das Band ist kein genauer Kreis – in der Mitte
# hatten die Runen Abstand zur Linie, oben/unten liefen sie darüber). Darum Zeile für Zeile die Mitte zwischen der
# goldenen Außenlinie und der inneren Cyan-Linie messen; oben/unten, wo Ecken die Linien verdecken, mit einem Kreis
# durch die Messpunkte fortsetzen. Die Szene lässt die Runen entlang dieser Bahn laufen.
gi = grund.astype(int)
gold = (gi[..., 0] > 150) & (gi[..., 1] > 90) & (gi[..., 2] < 110) & (gi[..., 0] > gi[..., 2] + 60)
cyan = (gi[..., 2] > 120) & (gi[..., 1] > 110) & (gi[..., 0] < 110)
def bahn(links):
    punkte = []
    for y in range(200, 820, 4):  # Ecken-Ornamente oben/unten stören die Messung
        xs = range(0, 560) if links else range(B - 1, B - 560, -1)
        xg = next((x for x in xs if gold[y, x]), None)
        if xg is None: continue
        xs2 = range(xg + 12, xg + 260) if links else range(xg - 12, xg - 260, -1)
        xc = next((x for x in xs2 if cyan[y, x]), None)
        if xc is not None: punkte.append(((xg + xc) / 2, y))
    p = np.array(punkte, float)
    # Ausreißer (Ecken, Lichtpunkte) weg: gleitender Median
    p[:, 0] = np.array([np.median(p[max(0, i - 4):i + 5, 0]) for i in range(len(p))])
    A = np.c_[2 * p[:, 0], 2 * p[:, 1], np.ones(len(p))]; cx, cy, c = np.linalg.lstsq(A, (p ** 2).sum(1), rcond=None)[0]
    r = np.sqrt(c + cx * cx + cy * cy)
    rest = np.abs(np.hypot(p[:, 0] - cx, p[:, 1] - cy) - r)
    print('Runenbahn', 'links' if links else 'rechts', len(p), 'Punkte, Kreis', round(cx), round(cy), round(r), 'Abweichung max', round(rest.max(), 1))
    aussen = lambda y: cx + (-1 if links else 1) * np.sqrt(max(r * r - (y - cy) ** 2, 0))
    glatt = np.polyfit(p[:, 1], p[:, 0], 4)  # Messpunkte zittern um 1–2 px; ein glatter Verlauf hält die Runen ruhig
    for _ in range(4):  # Ausreißer (Lichtpunkte auf den Linien) schrittweise weglassen
        gut = np.abs(np.polyval(glatt, p[:, 1]) - p[:, 0]) < 4
        glatt = np.polyfit(p[gut, 1], p[gut, 0], 4)
    print('  Glaettung: Punkte', int(gut.sum()), 'von', len(p), 'max', round(float(np.abs(np.polyval(glatt, p[gut, 1]) - p[gut, 0]).max()), 1), 'px')
    y0, y1 = p[0, 1], p[-1, 1]
    weg = []
    for y in range(-120, H + 121, 6):
        if y0 <= y <= y1: x = float(np.polyval(glatt, y))  # geglättet – sonst kippeln die Runen
        else:  # weich vom letzten Messpunkt in den Kreis übergehen
            rand = p[0] if y < y0 else p[-1]
            x = aussen(y) + (np.polyval(glatt, rand[1]) - aussen(rand[1]))
        weg.append([round(x, 1), y])
    return weg
GEO['bahnLinks'] = bahn(True)
GEO['bahnRechts'] = [[round(B - x, 1), y] for x, y in GEO['bahnLinks']]  # rechts = gespiegelt (siehe oben)

json.dump({'quelle': quelle, 'breite': B, 'hoehe': H, 'ebenen': ebenen, **GEO}, open(ZIEL + 'geometrie.json', 'w'), indent=1)
print('fertig', list(ebenen))
