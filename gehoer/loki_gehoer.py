# Lokis Gehör als kleiner Hintergrund-Dienst (04.11.2026, Wunsch Auftraggeber: „versteht mich oft schlecht“ –
# „Neuigkeiten“ wurde zu „Teneriffa“). Jarvis (electron/gehoer.cjs über loki.cjs) startet dieses Skript selbst und
# spricht mit ihm nur über die Standard-Ein- und -Ausgabe – kein Netzwerk-Anschluss, es endet mit Jarvis.
# Technik: faster-whisper 1.2.1 (MIT) mit Whisper large-v3-turbo (MIT, CTranslate2-Fassung
# mobiuslabsgmbh/faster-whisper-large-v3-turbo) auf der Grafikkarte, int8_float16.
# Gemessen 04.11.2026 (80 Testsätze, modelle/stt): 5,9 % Wortfehler sauber / 9,5 % mit Lärm (heute small: 20,9 / 30,5 %),
# 0,11 s je Satz, ca. 1,2 GB Grafikspeicher. Die Wortliste (initial_prompt) halbiert die Fehler bei Namen wie Etsy, Emma.
#
# Ablauf: Eine Zeile JSON je Auftrag rein:  {"id": 1, "ton": "<Base64 aus float32-Werten, 16 kHz>", "worte": "Loki, Lage, …"}
#         Eine Zeile JSON je Antwort raus:  {"id": 1, "text": "…"} oder {"id": 1, "fehler": "…"}
#         Nach dem Laden einmal:            {"bereit": true, "sekunden": 4.2}  (oder {"fehlt"/"fehler": "…"} und Ende)
# Aufruf: <Python der Umgebung> -I loki_gehoer.py <Modell-Ordner>
import os, sys, glob

# Die Bibliotheken schreiben Meldungen auf die Standardausgabe – die gehört aber nur den Antworten an Jarvis.
_antwort = os.fdopen(os.dup(sys.stdout.fileno()), "w", encoding="utf-8", newline="\n")
os.dup2(sys.stderr.fileno(), sys.stdout.fileno())
sys.stdout = sys.stderr
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Nichts aus dem Internet nachladen – das Modell liegt nach der Einrichtung im Modell-Ordner
os.environ["HF_HUB_OFFLINE"] = "1"

# Windows: CUDA-Bibliotheken aus den Paketen nvidia-cublas-cu12 / nvidia-cudnn-cu12 der Umgebung bekannt machen
for d in glob.glob(os.path.join(sys.prefix, "Lib", "site-packages", "nvidia", "*", "bin")):
    os.add_dll_directory(d)
    os.environ["PATH"] = d + os.pathsep + os.environ.get("PATH", "")

import base64, json, re, time

MODELL = "large-v3-turbo"


def senden(d):
    _antwort.write(json.dumps(d, ensure_ascii=False) + "\n")
    _antwort.flush()


def woerter(s):
    s = s.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    return re.sub(r"[^a-z0-9 ]+", " ", s).split()


# Typische Einbildungen von Whisper bei Lärm (gemessen 04.11.2026 mit Rauschen/Brummen: 30 von 30 Stücken ergaben
# Text, z. B. „Untertitelung des ZDF, 2020“, „www.youtube.com“) – stammen aus Untertiteln im Trainingsmaterial
# Eng gefasst, damit echte Sätze („Tamara“, „Untertitel einschalten“) nicht wegfallen (Prüf-Agent)
EINBILDUNG = re.compile(r"untertitel(ung)?\s+(im auftrag|des|der|von|durch)|\bamara\b|\bzdf\b|\bswr\b|copyright|kanal abonnier|abonniert|(fürs|fuers) zuschauen|danke.{0,30}zuschauen|www\.|https?://|\w\.(com|tv|org|net)\b", re.I)


def ist_wortliste(text, worte):
    """Whisper „erfindet“ bei Lärm/Stille manchmal genau die vorgegebene Wortliste – das darf nie als Befehl gelten
    (sonst löst „Loki, Lage, …“ von selbst aus). Erkannt: drei Wörter der Liste direkt hintereinander, in Listenreihenfolge."""
    liste, t = woerter(worte), woerter(text)
    if len(liste) < 3 or len(t) < 3:
        return False
    folgen = {tuple(liste[i:i + 3]) for i in range(len(liste) - 2)}
    return any(tuple(t[i:i + 3]) in folgen for i in range(len(t) - 2))


def main():
    start = time.time()
    ordner = sys.argv[1] if len(sys.argv) > 1 else ""
    try:
        import numpy as np
        from faster_whisper import WhisperModel
        modell = WhisperModel(MODELL, device="cuda", compute_type="int8_float16", download_root=ordner, local_files_only=True)
        # Aufwärmen: eine Sekunde Stille (lädt die Rechenkerne auf die Grafikkarte)
        list(modell.transcribe(np.zeros(16000, dtype=np.float32), language="de", beam_size=5)[0])
    except Exception as e:
        # Modell nicht da bzw. Paket fehlt = nicht eingerichtet (keine Störung)
        fehlt = isinstance(e, ImportError) or type(e).__name__ in ("LocalEntryNotFoundError", "OfflineModeIsEnabled") \
            or (isinstance(e, OSError) and ("cached" in str(e) or "not found" in str(e).lower()))
        if fehlt:
            senden({"fehlt": f"Das Hörmodell fehlt – bitte gehoer/einrichten.ps1 ausführen ({type(e).__name__})."})
        else:
            senden({"fehler": f"{type(e).__name__}: {e}"})
        return
    senden({"bereit": True, "sekunden": round(time.time() - start, 1)})

    for roh in sys.stdin.buffer:
        try:
            auftrag = json.loads(roh.decode("utf-8-sig", errors="replace"))
            nr = auftrag.get("id")
        except Exception:
            print("Unlesbarer Auftrag", file=sys.stderr, flush=True)
            continue
        try:
            b = base64.b64decode(str(auftrag.get("ton", "")))
            ton = np.frombuffer(b[: len(b) - len(b) % 4], dtype=np.float32)
            if not len(ton) or len(ton) > 16000 * 40:
                raise ValueError("Ton fehlt oder ist zu lang")
            worte = str(auftrag.get("worte", ""))[:400] or None
            # gleiche Einstellungen wie in der Messung (modelle/stt/messen-gpu.py)
            seg, _ = modell.transcribe(ton, language="de", beam_size=5, vad_filter=False, condition_on_previous_text=False, initial_prompt=worte)
            # Abschnitte, die laut Whisper selbst wohl keine Sprache sind, weglassen (übliche Whisper-Grenzwerte)
            # Abschnitte mit sehr geringer Sicherheit weglassen (no_speech_prob hilft hier nicht – mit Wortliste immer ≈ 0)
            text = " ".join(s.text for s in seg if s.avg_logprob >= -1.0 and not EINBILDUNG.search(s.text)).strip()
            if worte and ist_wortliste(text, worte):
                text = ""
            senden({"id": nr, "text": text})
        except Exception as e:
            senden({"id": nr, "fehler": f"{type(e).__name__}: {e}"})


if __name__ == "__main__":
    main()
