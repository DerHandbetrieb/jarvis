# Kupferband unter dem Reaktor vorbereiten (05.11.2026): freigestellte Magnific-Bilder (grafik/magnific/kupfer-N-frei.png)
# zuschneiden, in doppelter Szenen-Auflösung als WebP speichern und die Wölbung der Kupferfläche vermessen (Mittellinie als
# Parabel), damit die Inschrift der Biegung folgt. Ergebnis: hud5/ebenen/kupfer-N.webp + Maße in hud5/ebenen/kupfer.json
# Aufruf: modelle/upscale/.venv/Scripts/python.exe scripts/kupferband.py
import json
import numpy as np
from PIL import Image

BREITE = 760 * 2  # Breite in der Szene 760 px (Wunsch Auftraggeber: breiter, damit die Inschrift lesbar ist), doppelt gespeichert
STAUCHEN = 0.5  # flacher
masse = {}
for n in range(1, 5):
    bild = Image.open(f'grafik/magnific/kupfer-{n}-frei.png').convert('RGBA')
    bild = bild.crop(bild.getchannel('A').getbbox())
    bild = bild.resize((BREITE, round(bild.height * BREITE / bild.width * STAUCHEN)), Image.LANCZOS)
    a = np.asarray(bild).astype(np.float32)
    kupfer = (a[..., 3] > 200) & (a[..., 0] - a[..., 2] > 22) & (a[..., 0] > 45) & (a[..., 0] > a[..., 1] * 1.15)
    spalten = np.where(kupfer.sum(axis=0) > 20)[0]
    x0, x1 = int(spalten.min()), int(spalten.max())
    xs, ys, hs = [], [], []
    for x in range(x0, x1, 4):
        z = np.where(kupfer[:, x])[0]
        if len(z) > 20: xs.append(x); ys.append((z.min() + z.max()) / 2); hs.append(z.max() - z.min())
    k = np.polyfit(xs, ys, 2)
    masse[n] = {'b': bild.width, 'h': bild.height, 'x0': x0, 'x1': x1, 'parabel': [float(v) for v in k], 'hoehe': float(np.median(hs))}
    bild.save(f'hud5/ebenen/kupfer-{n}.webp', quality=92)
    print(n, bild.size, 'Kupfer', x0, x1, 'Höhe', round(float(np.median(hs))))
json.dump(masse, open('hud5/ebenen/kupfer.json', 'w'), indent=1)
