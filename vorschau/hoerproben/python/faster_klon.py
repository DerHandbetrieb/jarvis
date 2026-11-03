# Geschwindigkeitstest (03.11.2026): Lokis feste Stimme (R2 = 0.6B-Base + stimme/loki-vorlage.wav) mit
# faster-qwen3-tts (MIT, CUDA-Graphen) statt dem offiziellen qwen-tts. Ergebnis als Proben S-… zum Vergleich mit R2-….
# Misst einmal am Stück und einmal als Strom (Ton in Stücken, Zeit bis zum ersten Ton).
# Aufruf: modelle\tts\faster\Scripts\python.exe -I faster_klon.py <Ordner hoerproben> <stimme\loki-vorlage.wav>
import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import soundfile as sf
from faster_qwen3_tts import FasterQwen3TTS
from texte import TEXTE

aus, vorlage = sys.argv[1], sys.argv[2]
NEU = {
    "morgen": TEXTE["morgen"],
    "befehl": TEXTE["befehl"],
    "lage": "Gestern kamen drei Bestellungen mit vier Artikeln, zusammen etwa hundertdreiundzwanzig Euro. Nicht schlecht, Sir. Ich hätte es Ihnen ehrlich gesagt nicht zugetraut.",
}

start = time.time()
modell = FasterQwen3TTS.from_pretrained("Qwen/Qwen3-TTS-12Hz-0.6B-Base")
print(f"Laden: {time.time() - start:.1f} s", flush=True)
ref = dict(language="German", ref_audio=vorlage, ref_text=TEXTE["frage"])

# Aufwärmen (CUDA-Graphen werden beim ersten Aufruf aufgezeichnet)
start = time.time()
modell.generate_voice_clone(text="Sehr wohl, Sir.", **ref)
print(f"Aufwärmen: {time.time() - start:.1f} s", flush=True)

for t, text in NEU.items():
    start = time.time()
    wavs, sr = modell.generate_voice_clone(text=text, **ref)
    sf.write(os.path.join(aus, f"S-{t}.wav"), wavs[0], sr)
    print("am Stück", t, f"{time.time() - start:.1f} s für {len(wavs[0]) / sr:.1f} s Ton", flush=True)

for t, text in NEU.items():
    start = time.time()
    erster, stuecke = None, []
    for stueck, sr, _ in modell.generate_voice_clone_streaming(text=text, chunk_size=8, **ref):
        if erster is None:
            erster = time.time() - start
        stuecke.append(stueck)
    ton = np.concatenate(stuecke)
    sf.write(os.path.join(aus, f"S-strom-{t}.wav"), ton, sr)
    print("Strom", t, f"erster Ton nach {erster:.2f} s, fertig {time.time() - start:.1f} s für {len(ton) / sr:.1f} s Ton", flush=True)
