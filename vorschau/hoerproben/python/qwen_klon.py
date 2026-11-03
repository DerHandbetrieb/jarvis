# Feste Loki-Stimme (03.11.2026, Auftraggeber wählte Q1): offizieller Weg „Voice Design then Clone“ aus der
# Qwen3-TTS-Anleitung – die entworfene Probe Q1 dient als Vorlage, das Grundmodell (Base) spricht damit jeden neuen
# Text in derselben Stimme. Vergleich großes (1.7B) und kleines (0.6B) Grundmodell, mit Zeitmessung.
# Aufruf: <venv>\Scripts\python.exe -I qwen_klon.py <Ordner hoerproben>
import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import torch
import soundfile as sf
from qwen_tts import Qwen3TTSModel
from texte import TEXTE

aus = sys.argv[1]
NEU = {
    "morgen": TEXTE["morgen"],
    "befehl": TEXTE["befehl"],
    "lage": "Gestern kamen drei Bestellungen mit vier Artikeln, zusammen etwa hundertdreiundzwanzig Euro. Nicht schlecht, Sir. Ich hätte es Ihnen ehrlich gesagt nicht zugetraut.",
}
for k, name in {"R1": "Qwen/Qwen3-TTS-12Hz-1.7B-Base", "R2": "Qwen/Qwen3-TTS-12Hz-0.6B-Base"}.items():
    modell = Qwen3TTSModel.from_pretrained(name, device_map="cuda:0", dtype=torch.bfloat16, attn_implementation="sdpa")
    vorlage = modell.create_voice_clone_prompt(ref_audio=os.path.join(aus, "Q1-frage.wav"), ref_text=TEXTE["frage"], x_vector_only_mode=False)
    for t, text in NEU.items():
        start = time.time()
        wavs, sr = modell.generate_voice_clone(text=text, language="German", voice_clone_prompt=vorlage)
        sf.write(os.path.join(aus, f"{k}-{t}.wav"), wavs[0], sr)
        print(k, t, f"{time.time() - start:.1f} s für {len(wavs[0]) / sr:.1f} s Ton", flush=True)
    del modell
    torch.cuda.empty_cache()
