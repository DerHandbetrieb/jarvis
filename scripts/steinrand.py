# Steinrand außen links/rechts (Entwürfe 05.11.2026, Wunsch Auftraggeber): hinter dem goldenen Bogen bleibt der dunkle
# Streifen mit leichtem Schein, erst danach beginnt Stein im Stil des Reaktors (Magnific-Texturen in grafik/magnific/),
# wahlweise mit einer gebogenen Flechtband-Leiste aus Stein. Ergebnis: hud5/ebenen/rand-<v>-links.webp / -rechts.webp
# (RGBA, so groß wie der jeweilige Bildschirm-Streifen) + hud5/ebenen/rand.json.
# Aufruf: modelle/upscale/.venv/Scripts/python.exe scripts/steinrand.py
import json, math
import numpy as np
from PIL import Image

B, H, BR = 5760, 1080, 760  # Breite des Streifens je Seite
grund = np.asarray(Image.open('hud5/ebenen/grund.webp').convert('RGB')).astype(np.float32)

def bogen_messen(rechts):
    """goldene Linie: je Zeile der äußerste Goldpunkt nahe der Seite → Kreis durch Ausgleichsrechnung"""
    pts = []
    for y in range(40, H - 40, 8):
        row = grund[y]
        xs = range(B - 1, B - 420, -1) if rechts else range(0, 420)
        gold = [x for x in xs if row[x][0] - row[x][2] > 60 and row[x][0] > 120]
        if not gold: continue
        # innerster Goldpunkt (zur Bildmitte hin) = Bogenlinie; Knoten liegen weiter außen
        x = min(gold) if rechts else max(gold)
        if abs(y - 540) < 380 or True: pts.append((x, y))
    p = np.array(pts, np.float64)
    A = np.c_[2 * p[:, 0], 2 * p[:, 1], np.ones(len(p))]
    bvec = (p ** 2).sum(1)
    cx, cy, c = np.linalg.lstsq(A, bvec, rcond=None)[0]
    r = math.sqrt(c + cx * cx + cy * cy)
    res = np.abs(np.hypot(p[:, 0] - cx, p[:, 1] - cy) - r)
    keep = res < np.percentile(res, 70)  # Ausreißer (Knoten) weg, zweiter Durchgang
    p = p[keep]; A = np.c_[2 * p[:, 0], 2 * p[:, 1], np.ones(len(p))]; bvec = (p ** 2).sum(1)
    cx, cy, c = np.linalg.lstsq(A, bvec, rcond=None)[0]
    return float(cx), float(cy), math.sqrt(c + cx * cx + cy * cy)

def kachel(name, skala):
    t = Image.open(f'grafik/magnific/{name}.png').convert('RGB')
    t = t.resize((round(t.width * skala), round(t.height * skala)), Image.LANCZOS)
    a = np.asarray(t).astype(np.float32)
    reps = (math.ceil(H / a.shape[0]) + 1, math.ceil(BR / a.shape[1]) + 1, 1)
    return np.tile(a, reps)[:H, :BR]

def leiste(name):
    """Flechtband-Leiste aus dem Magnific-Bild: hellen Steinblock finden, inneren Teil zuschneiden"""
    b = np.asarray(Image.open(f'grafik/magnific/{name}.png').convert('RGB')).astype(np.float32)
    hell = b.max(axis=2) > 25
    ys, xs = np.where(hell)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    rand_x, rand_y = int((x1 - x0) * 0.06), int((y1 - y0) * 0.03)
    return b[y0 + rand_y:y1 - rand_y, x0 + rand_x:x1 - rand_x]

def glatt(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

VARIANTEN = {
    'b': {'textur': 'stein-textur-1', 'skala': 0.55, 'leiste': None, 'moos': 1.0},
    'c': {'textur': 'stein-textur-2', 'skala': 0.55, 'leiste': 'stein-rand-1', 'moos': 1.0},
    'd': {'textur': 'stein-textur-1', 'skala': 0.5, 'leiste': 'stein-rand-2', 'moos': 1.6},
}
ABSTAND, LEISTE_B = 34, 64  # dunkler Streifen nach dem Goldbogen bleibt; Breite der Flechtband-Leiste
geo = {}
for seite in ('links', 'rechts'):
    rechts = seite == 'rechts'
    cx, cy, r = bogen_messen(rechts)
    geo[seite] = {'x': cx, 'y': cy, 'r': r}
    print(seite, 'Goldbogen', round(cx, 1), round(cy, 1), round(r, 1))
    ox = B - BR if rechts else 0  # Lage des Streifens in der Szene
    yy, xx = np.mgrid[0:H, 0:BR].astype(np.float32)
    d = np.hypot(xx + ox - cx, yy - cy)
    r0 = r + ABSTAND
    for v, cfg in VARIANTEN.items():
        stein = kachel(cfg['textur'], cfg['skala'])
        if rechts: stein = stein[:, ::-1]
        # Moos verstärken: grünliche Anteile anheben
        gruen = np.clip(stein[..., 1] - (stein[..., 0] + stein[..., 2]) / 2, 0, None)
        stein[..., 1] += gruen * (cfg['moos'] - 1) * 1.5
        stein *= 0.78  # dunkel halten
        # Kante: schmale helle Fase direkt an der Grenze, dahinter Schatten in den Stein hinein
        fase = glatt(r0, r0 + 2, d) * (1 - glatt(r0 + 3, r0 + 7, d))
        schatten = 1 - 0.55 * (1 - glatt(r0 + 4, r0 + 40, d))
        stein = stein * schatten[..., None] + fase[..., None] * np.array([70, 80, 78])
        if cfg['leiste']:
            l = leiste(cfg['leiste'])
            lh, lw = l.shape[:2]
            mitte_r = r0 + 14 + LEISTE_B / 2
            # Bogenlänge → Leistenzeile (Leiste wiederholt sich entlang des Bogens), Abstand zur Leistenmitte → Spalte
            w = np.arctan2(yy - cy, xx + ox - cx)
            bogenlaenge = (w if rechts else (math.pi - np.where(w < 0, w + 2 * math.pi, w))) * mitte_r
            zeile = (np.mod(bogenlaenge * (lh / (lw / LEISTE_B * lh / (lw / LEISTE_B))), lh)).astype(int)
            spalte_f = (d - (mitte_r - LEISTE_B / 2)) / LEISTE_B
            in_leiste = (spalte_f >= 0) & (spalte_f < 1)
            skala_l = LEISTE_B / lw
            zeile = (np.mod(bogenlaenge / skala_l, lh)).astype(int)
            spalte = np.clip((spalte_f * lw).astype(int), 0, lw - 1)
            if rechts: spalte = lw - 1 - spalte
            farbe = l[zeile, spalte] * 0.95
            # weicher Rand der Leiste + Schattenfuge daneben
            kante = glatt(0, 0.04, spalte_f) * (1 - glatt(0.96, 1, spalte_f))
            fuge = 1 - 0.6 * (glatt(-0.12, 0, spalte_f) * (1 - glatt(0, 0.02, spalte_f)) + glatt(0.98, 1, spalte_f) * (1 - glatt(1.0, 1.12, spalte_f)))
            stein = np.where(in_leiste[..., None], stein * (1 - kante[..., None]) + farbe * kante[..., None], stein * fuge[..., None])
        alpha = glatt(r0 - 1, r0 + 1, d) * 255
        rgba = np.dstack([np.clip(stein, 0, 255), alpha]).astype(np.uint8)
        Image.fromarray(rgba, 'RGBA').save(f'hud5/ebenen/rand-{v}-{seite}.webp', quality=90)
json.dump({'breite': BR, 'abstand': ABSTAND, **geo}, open('hud5/ebenen/rand.json', 'w'), indent=1)
print('fertig')
