# LOKI in Bronze-Flechtwerk (Magnific, 05.11.2026) auf den Originalreaktor setzen: nur die Bronze-Pixel (Buchstaben +
# zwei Knoten) aus grafik/magnific/loki-bronze-3.png ausschneiden, entlang der Steinrundung biegen, mit Schlagschatten
# einsetzen → hud5/ebenen/lokiBronze.webp (RGBA, Lage = Reaktor-Ebene) + Maße in geometrie.json (ebenen.lokiBronze)
# Aufruf: modelle/upscale/.venv/Scripts/python.exe scripts/loki-bronze.py
import json, math
import numpy as np
from PIL import Image, ImageFilter
g = json.load(open('hud5/ebenen/geometrie.json')); e = g['ebenen']['reaktor']; k = g['kern']
q = np.asarray(Image.open('grafik/magnific/loki-bronze-3.png').convert('RGB')).astype(np.float32)
# Bronze = warm, nicht zu dunkel; nur im Tafelbereich
r, gr, b = q[..., 0], q[..., 1], q[..., 2]
bronze = np.clip((r - b - 18) / 40, 0, 1) * np.clip((r - 55) / 50, 0, 1)
bronze[:420] = 0; bronze[560:] = 0; bronze[:, :70] = 0; bronze[:, 528:] = 0
# ganze Form (auch dunkle Rillen zwischen den Strängen): Bronze-Maske schließen und Kante weich
roh = Image.fromarray((bronze * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3))
alpha = roh.filter(ImageFilter.GaussianBlur(1.2)).point(lambda v: 0 if v < 60 else min(255, (v - 60) * 3))
ys, xs = np.where(np.asarray(alpha) > 40); x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
teil = Image.fromarray(q.astype(np.uint8)).crop((x0, y0, x1, y1)).convert('RGBA'); teil.putalpha(alpha.crop((x0, y0, x1, y1)))
# Zielgröße: Breite 300 Szenenpixel, Mitte auf der Steinrundung unten (Radius R um den Kern)
ZIELB, R, F = 262, 240, 2
tb = ZIELB * F; th = round(teil.height * tb / teil.width)
teil = teil.resize((tb, th), Image.LANCZOS); t = np.asarray(teil).astype(np.float32)
W, H = e['b'] * F, e['h'] * F
aus = np.zeros((H, W, 4), np.float32)
cx, cy = (k['x'] - e['x']) * F, (k['y'] - e['y']) * F
# Polar-Abbildung: jede Zielstelle unten am Kreis -> Stelle im flachen Schriftbild (Buchstaben drehen sich mit der Rundung)
py, px = np.mgrid[0:H, 0:W].astype(np.float32)
ang = np.arctan2(px - cx, py - cy); rad = np.hypot(px - cx, py - cy)
u = (tb / 2 + ang * R * F).astype(np.int32); v = (th / 2 + (rad - R * F)).astype(np.int32)
ok = (u >= 0) & (u < tb) & (v >= 0) & (v < th) & (py > cy)
aus[ok] = t[v[ok], u[ok]]
bild = Image.fromarray(np.clip(aus, 0, 255).astype(np.uint8), 'RGBA')
# Schlagschatten nach unten rechts
sch = bild.getchannel('A').filter(ImageFilter.GaussianBlur(3 * F))
schatten = Image.new('RGBA', bild.size, (0, 0, 0, 0)); schatten.putalpha(sch.point(lambda v: int(v * 0.75)))
ges = Image.new('RGBA', bild.size, (0, 0, 0, 0)); ges.alpha_composite(schatten, (3 * F, 4 * F)); ges.alpha_composite(bild)
ges.save('hud5/ebenen/lokiBronze.webp', quality=92)
g['ebenen']['lokiBronze'] = {'x': e['x'], 'y': e['y'], 'b': e['b'], 'h': e['h']}
json.dump(g, open('hud5/ebenen/geometrie.json', 'w'), indent=1, ensure_ascii=False)
print('fertig', bild.size)
