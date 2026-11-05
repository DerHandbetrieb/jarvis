# Runen in den Bögen/im Mittelring des Grafikpakets V5 finden (05.11.2026): Leuchtflecken (Cyan) als Bausteine,
# Mittelpunkte → Kreis durch die Runen. Nur zum Vermessen, Ergebnis landet in hud5/ebenen/geometrie.json.
import sys, json, numpy as np, cv2
from PIL import Image
M = 'grafik/v5/LOKI_Mystic_Aurora_3x4K_V5/00_MASTER/'
def kreis(p):
    p = np.array(p, float); A = np.c_[2 * p[:, 0], 2 * p[:, 1], np.ones(len(p))]; b = (p ** 2).sum(1)
    cx, cy, c = np.linalg.lstsq(A, b, rcond=None)[0]; return [cx, cy, float(np.sqrt(c + cx * cx + cy * cy))]
def flecken(datei, x0, x1, y0=0, y1=2160, minf=250, maxf=20000):
    im = np.asarray(Image.open(M + datei).convert('RGB')).astype(int)
    m = ((im[..., 2] > 150) & (im[..., 1] > 130) & (im[..., 0] < 130)).astype(np.uint8)
    m[:, :x0] = 0; m[:, x1:] = 0; m[:y0] = 0; m[y1:] = 0
    m = cv2.dilate(m, np.ones((9, 9), np.uint8))
    n, lab, st, cen = cv2.connectedComponentsWithStats(m)
    return [(float(cen[i][0]), float(cen[i][1]), int(st[i][4]), int(st[i][2]), int(st[i][3])) for i in range(1, n) if minf < st[i][4] < maxf and max(st[i][2], st[i][3]) < 260]
for name, datei, x0, x1 in [('links', 'MONITOR_01_LINKS_OHNE_INHALTE.png', 150, 760), ('rechts', 'MONITOR_03_RECHTS_OHNE_INHALTE.png', 3080, 3700)]:
    f = flecken(datei, x0, x1); print(name, len(f)); [print('  ', [round(v) for v in x]) for x in f]
    print('  Kreis', kreis([(x[0], x[1]) for x in f]))
