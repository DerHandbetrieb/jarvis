# Lokis Stimme als kleiner Hintergrund-Dienst (03.11.2026, Entscheidung Auftraggeber: Probe S).
# Jarvis (electron/jarvis.cjs) startet dieses Skript selbst und spricht mit ihm nur über die Standard-Ein- und -Ausgabe –
# kein Netzwerk-Anschluss, kein anderes Programm kann es benutzen, es endet mit Jarvis.
# Technik: Qwen3-TTS-12Hz-0.6B-Base (Apache-2.0) mit der festen Vorlage loki-vorlage.wav (siehe LIESMICH.md),
# beschleunigt mit faster-qwen3-tts (MIT, CUDA-Graphen) – ca. 3,7-mal schneller als Echtzeit auf der RTX 4080.
#
# Ablauf: Eine Zeile JSON je Auftrag rein:  {"id": 1, "text": "Sehr wohl, Sir."}
#         Eine Zeile JSON je Antwort raus:  {"id": 1, "sr": 24000, "ton": "<Base64 aus float32-Werten>"} oder {"id": 1, "fehler": "…"}
#         Nach dem Laden einmal:            {"bereit": true, "sekunden": 12.3}  (oder {"fehlt"/"fehler": "…"} und Ende)
# Aufruf: <Python der Umgebung> -I loki_stimme.py
import os, sys

# Die Bibliotheken schreiben Meldungen auf die Standardausgabe – die gehört aber nur den Antworten an Jarvis.
# Darum bekommen wir eine eigene Kopie davon, und alles andere landet bei den Fehlermeldungen.
_antwort = os.fdopen(os.dup(sys.stdout.fileno()), "w", encoding="utf-8", newline="\n")
os.dup2(sys.stderr.fileno(), sys.stdout.fileno())
sys.stdout = sys.stderr
sys.stderr.reconfigure(encoding="utf-8", errors="replace")  # Meldungen mit Umlauten kommen in Jarvis lesbar an

# Nichts aus dem Internet nachladen – das Modell liegt nach der Einrichtung im Zwischenspeicher von Hugging Face
os.environ["HF_HUB_OFFLINE"] = "1"

import base64, json, time

ORDNER = os.path.dirname(os.path.abspath(__file__))
MODELL = "Qwen/Qwen3-TTS-12Hz-0.6B-Base"
VORLAGE = os.path.join(ORDNER, "loki-vorlage.wav")
# gesprochener Text der Vorlage (LIESMICH.md) – nicht ändern, sonst klingt Loki anders
VORLAGE_TEXT = "Selbstverständlich kann ich Ihnen sagen, wie viele Tassen gestern verkauft wurden, Sir. Es waren vier. Ob das ein Grund zum Feiern ist, überlasse ich Ihrem bemerkenswerten Optimismus."


def senden(d):
    _antwort.write(json.dumps(d, ensure_ascii=False) + "\n")
    _antwort.flush()


def main():
    start = time.time()
    try:
        import numpy as np
        from faster_qwen3_tts import FasterQwen3TTS
        modell = FasterQwen3TTS.from_pretrained(MODELL)
        ref = dict(language="German", ref_audio=VORLAGE, ref_text=VORLAGE_TEXT)
        # Aufwärmen: zeichnet die CUDA-Graphen auf und merkt sich die Vorlage
        modell.generate_voice_clone(text="Sehr wohl, Sir.", **ref)
    except Exception as e:
        # Modell nicht im Zwischenspeicher = Einrichtung fehlt/abgebrochen (keine Störung, sondern „nicht eingerichtet“)
        # bzw. kaputte/unvollständige Python-Umgebung (Paket fehlt). transformers meldet ein fehlendes Modell als OSError
        # „…couldn't find them in the cached files“ (ausprobiert mit leerem Zwischenspeicher, 03.11.2026)
        fehlt = isinstance(e, ImportError) or type(e).__name__ in ("LocalEntryNotFoundError", "OfflineModeIsEnabled") \
            or (isinstance(e, OSError) and "cached files" in str(e))
        if fehlt:
            senden({"fehlt": f"Das Sprachmodell fehlt – bitte stimme/einrichten.ps1 ausführen ({type(e).__name__})."})
        else:
            senden({"fehler": f"{type(e).__name__}: {e}"})
        return
    senden({"bereit": True, "sekunden": round(time.time() - start, 1)})

    # Reserve aufräumen (04.11.2026, Wunsch Auftraggeber: Speicher sparen ohne Qualitätsverlust): PyTorch hält nach dem
    # Sprechen bis zu ~1,4 GB Grafikspeicher „auf Vorrat“ (gemessen: belegt 2,4 GB, reserviert bis 3,8 GB). 20 s nach dem
    # letzten Satz wird diese Reserve freigegeben – der nächste Satz braucht dann ca. 0,25 s länger (gemessen).
    import threading, torch
    sperre = threading.Lock()
    zuletzt = [time.time(), False]  # [Zeit des letzten Satzes, schon aufgeräumt]

    def aufraeumen():
        while True:
            time.sleep(5)
            if not zuletzt[1] and time.time() - zuletzt[0] > 20 and sperre.acquire(blocking=False):
                try:
                    torch.cuda.empty_cache()
                    zuletzt[1] = True
                finally:
                    sperre.release()
    threading.Thread(target=aufraeumen, daemon=True).start()

    # ausdrücklich UTF-8 lesen (Windows nimmt sonst die alte Codepage – Umlaute kämen kaputt an); „utf-8-sig“ entfernt ein
    # Byte-Order-Mark, das Windows PowerShell 5.1 beim Weiterleiten voranstellt (Probelauf in einrichten.ps1)
    for roh in sys.stdin.buffer:
        zeile = roh.decode("utf-8-sig", errors="replace")
        try:
            auftrag = json.loads(zeile)
            nr = auftrag.get("id")
        except Exception:
            print("Unlesbarer Auftrag:", repr(zeile[:200]), file=sys.stderr, flush=True)
            continue
        try:
            text = str(auftrag.get("text", "")).strip()[:2000]
            if not text:
                raise ValueError("kein Text")
            with sperre:  # nie während des Aufräumens sprechen
                wavs, sr = modell.generate_voice_clone(text=text, **ref)
                zuletzt[0], zuletzt[1] = time.time(), False
            ton = np.asarray(wavs[0], dtype=np.float32)
            senden({"id": nr, "sr": int(sr), "ton": base64.b64encode(ton.tobytes()).decode("ascii")})
        except Exception as e:
            senden({"id": nr, "fehler": f"{type(e).__name__}: {e}"})


if __name__ == "__main__":
    main()
