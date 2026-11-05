# Steinrand außen links/rechts (05.11.2026, Wunsch Auftraggeber): hinter dem goldenen Bogen bleibt der dunkle Streifen mit
# leichtem Schein, erst danach beginnt Stein im Stil des Reaktors (Magnific-Texturen in grafik/magnific/), mit gebogener
# Flechtband-Leiste. Der Stein folgt GENAU dem Verlauf der Goldlinie (Rückmeldung: „gleicher Schwung wie die gelbe Linie,
# nur mit Versatz“) – die Linie wird Zeile für Zeile verfolgt, Abstand und Leiste werden entlang dieser Kurve gemessen.
# Ergebnis: hud5/ebenen/rand-<v>-links.webp / -rechts.webp (RGBA) + hud5/ebenen/rand.json.
# Aufruf: modelle/upscale/.venv/Scripts/python.exe scripts/steinrand.py
import json, math
import numpy as np
from PIL import Image

B, H, BR = 5760, 1080, 760  # Breite des Streifens je Seite
grund = np.asarray(Image.open('hud5/ebenen/grund.webp').convert('RGB')).astype(np.float32)

def kreis(pts):
    p = np.array(pts, np.float64)
    A = np.c_[2 * p[:, 0], 2 * p[:, 1], np.ones(len(p))]
    cx, cy, c = np.linalg.lstsq(A, (p ** 2).sum(1), rcond=None)[0]
    return cx, cy, math.sqrt(c + cx * cx + cy * cy)

def goldlinie(rechts):
    """Goldlinie je Zeile (x zur Bildmitte hin am innersten Goldpunkt), Ausreißer per Kreis entfernt, geglättet;
    außerhalb des Bildes mit dem Kreis fortgesetzt → Punktliste (x, y) von oben nach unten"""
    roh = {}
    for y in range(0, H):
        row = grund[y]
        xs = range(B - 1, B - 460, -1) if rechts else range(0, 460)
        gold = [x for x in xs if row[x][0] - row[x][2] > 55 and row[x][0] > 110]
        if gold: roh[y] = min(gold) if rechts else max(gold)
    cx, cy, r = kreis([(x, y) for y, x in roh.items()])
    for _ in range(2):  # Knoten und Fremdpunkte weg: nur Punkte nahe am Kreis
        roh = {y: x for y, x in roh.items() if abs(math.hypot(x - cx, y - cy) - r) < 14}
        cx, cy, r = kreis([(x, y) for y, x in roh.items()])
    def kreis_x(y):
        dy = y - cy; dx = math.sqrt(max(0, r * r - dy * dy)); return cx + dx if rechts else cx - dx
    ys = np.arange(-300, H + 300, 2)
    xs = np.array([roh.get(int(y), np.nan) if 0 <= y < H else kreis_x(y) for y in ys], np.float64)
    luecke = np.isnan(xs); xs[luecke] = [kreis_x(y) for y in ys[luecke]]
    k = 15; xs = np.convolve(np.pad(xs, k, mode='edge'), np.ones(2 * k + 1) / (2 * k + 1), mode='valid')  # glätten
    return np.c_[xs, ys], (cx, cy, r)

def kachel(name, skala):
    t = Image.open(f'grafik/magnific/{name}.png').convert('RGB')
    t = t.resize((round(t.width * skala), round(t.height * skala)), Image.LANCZOS)
    a = np.asarray(t).astype(np.float32)
    return np.tile(a, (math.ceil(H / a.shape[0]) + 1, math.ceil(BR / a.shape[1]) + 1, 1))[:H, :BR]

def leiste(name):
    b = np.asarray(Image.open(f'grafik/magnific/{name}.png').convert('RGB')).astype(np.float32)
    ys, xs = np.where(b.max(axis=2) > 25)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    rx, ry = int((x1 - x0) * 0.06), int((y1 - y0) * 0.03)
    return b[y0 + ry:y1 - ry, x0 + rx:x1 - rx]

def glatt(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

VARIANTEN = {
    'c': {'textur': 'stein-textur-2', 'skala': 0.55, 'leiste': 'stein-rand-1', 'moos': 1.0},
    'd': {'textur': 'stein-textur-1', 'skala': 0.5, 'leiste': 'stein-rand-2', 'moos': 1.6},
}
ABSTAND, LEISTE_B = 34, 64
geo = {}
for seite in ('links', 'rechts'):
    rechts = seite == 'rechts'
    kurve, (cx, cy, r) = goldlinie(rechts)
    geo[seite] = {'x': cx, 'y': cy, 'r': r}
    ox = B - BR if rechts else 0
    # Abstand jedes Pixels zur Goldlinie und Bogenlänge am nächsten Kurvenpunkt (in Blöcken gerechnet)
    seg = np.diff(kurve, axis=0); laenge = np.r_[0, np.cumsum(np.hypot(seg[:, 0], seg[:, 1]))]
    yy, xx = np.mgrid[0:H, 0:BR].astype(np.float64); px = (xx + ox).ravel(); py = yy.ravel()
    d = np.empty(px.size); s = np.empty(px.size)
    for i in range(0, px.size, 20000):
        dx = px[i:i + 20000, None] - kurve[None, :, 0]; dy = py[i:i + 20000, None] - kurve[None, :, 1]
        dd = dx * dx + dy * dy; j = dd.argmin(axis=1)
        d[i:i + 20000] = np.sqrt(dd[np.arange(j.size), j]); s[i:i + 20000] = laenge[j]
    d = d.reshape(H, BR); s = s.reshape(H, BR)
    # nur außen (zur Bildschirmkante hin) zählt
    x_kurve = np.interp(yy, kurve[:, 1], kurve[:, 0])
    aussen = (xx + ox > x_kurve) if rechts else (xx + ox < x_kurve)
    d = np.where(aussen, d, -d)
    r0 = ABSTAND
    print(seite, 'Goldlinie verfolgt, Ersatzkreis', round(cx), round(cy), round(r))
    for v, cfg in VARIANTEN.items():
        stein = kachel(cfg['textur'], cfg['skala'])
        if rechts: stein = stein[:, ::-1]
        gruen = np.clip(stein[..., 1] - (stein[..., 0] + stein[..., 2]) / 2, 0, None)
        stein[..., 1] += gruen * (cfg['moos'] - 1) * 1.5
        stein *= 0.78
        fase = glatt(r0, r0 + 2, d) * (1 - glatt(r0 + 3, r0 + 7, d))
        schatten = 1 - 0.55 * (1 - glatt(r0 + 4, r0 + 40, d))
        stein = stein * schatten[..., None] + fase[..., None] * np.array([70, 80, 78])
        l = leiste(cfg['leiste']); lh, lw = l.shape[:2]
        innen = r0 + 14
        spalte_f = (d - innen) / LEISTE_B
        in_leiste = (spalte_f >= 0) & (spalte_f < 1)
        zeile = np.mod(s / (LEISTE_B / lw), lh).astype(int)
        spalte = np.clip((spalte_f * lw).astype(int), 0, lw - 1)
        if rechts: spalte = lw - 1 - spalte
        farbe = l[zeile, spalte] * 0.95
        kante = glatt(0, 0.04, spalte_f) * (1 - glatt(0.96, 1, spalte_f))
        fuge = 1 - 0.6 * (glatt(-0.12, 0, spalte_f) * (1 - glatt(0, 0.02, spalte_f)) + glatt(0.98, 1, spalte_f) * (1 - glatt(1.0, 1.12, spalte_f)))
        stein = np.where(in_leiste[..., None], stein * (1 - kante[..., None]) + farbe * kante[..., None], stein * fuge[..., None])
        alpha = glatt(r0 - 1, r0 + 1, d) * 255
        Image.fromarray(np.dstack([np.clip(stein, 0, 255), alpha]).astype(np.uint8), 'RGBA').save(f'hud5/ebenen/rand-{v}-{seite}.webp', quality=90)
json.dump({'breite': BR, 'abstand': ABSTAND, **geo}, open('hud5/ebenen/rand.json', 'w'), indent=1)
print('fertig')

# Runenbahn links/rechts parallel zur Goldlinie (Wunsch Auftraggeber 05.11.2026: Runen sollen denselben Schwung haben wie
# die Goldlinie und der Steinrand). Fester Abstand nach innen; schreibt bahnLinks/bahnRechts in hud5/ebenen/geometrie.json
RUNEN_ABSTAND = 58
g = json.load(open('hud5/ebenen/geometrie.json'))
for seite, key in (('links', 'bahnLinks'), ('rechts', 'bahnRechts')):
    kurve, _ = goldlinie(seite == 'rechts')
    t = np.gradient(kurve, axis=0); t /= np.hypot(t[:, 0], t[:, 1])[:, None]
    n = np.c_[-t[:, 1], t[:, 0]]  # Normale
    innen = np.sign(n[:, 0]) * (1 if seite == 'links' else -1)  # zur Bildschirmmitte zeigen lassen
    n *= innen[:, None]
    bahn = kurve + n * RUNEN_ABSTAND
    bahn = bahn[(bahn[:, 1] >= -160) & (bahn[:, 1] <= H + 160)][::3]
    g[key] = [[round(float(x), 1), round(float(y), 1)] for x, y in bahn]
    print(seite, 'Runenbahn', len(g[key]), 'Punkte')
json.dump(g, open('hud5/ebenen/geometrie.json', 'w'), indent=1, ensure_ascii=False)
