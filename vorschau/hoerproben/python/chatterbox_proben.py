# Hörproben Chatterbox Multilingual (V2 aus dem PyPI-Paket) (Resemble AI, MIT), 03.11.2026.
# Stimme kommt aus einer Referenzaufnahme: nur Aufnahmen mit klaren Rechten –
#   M: Thorsten (unsere Piper-Probe A, Thorsten-Voice CC0)
#   N: britischer Sprecher (Piper northern_english_male, Daten CC BY-SA 4.0) – laut Anleitung erbt die Ausgabe dann
#      den Akzent der Referenz (README „language transfer outputs may inherit the accent of the reference clip“).
# Aufruf: <venv>\Scripts\python.exe -I chatterbox_proben.py <Ordner hoerproben>
import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from texte import TEXTE

aus = sys.argv[1]
modell = ChatterboxMultilingualTTS.from_pretrained(device="cuda")  # PyPI-Paket kennt nur V2 (Stand 03.11.2026)
VARIANTEN = {
    "M1": dict(ref="A-frage.wav", exaggeration=0.5, cfg_weight=0.5),
    "M2": dict(ref="A-frage.wav", exaggeration=0.7, cfg_weight=0.3),
    "N1": dict(ref="referenz-britisch.wav", exaggeration=0.5, cfg_weight=0.5),
}
for k, v in VARIANTEN.items():
    for t, text in TEXTE.items():
        start = time.time()
        wav = modell.generate(text, language_id="de", audio_prompt_path=os.path.join(aus, v["ref"]), exaggeration=v["exaggeration"], cfg_weight=v["cfg_weight"])
        ta.save(os.path.join(aus, f"{k}-{t}.wav"), wav, modell.sr)
        print(k, t, f"{time.time() - start:.1f} s für {wav.shape[-1] / modell.sr:.1f} s Ton", flush=True)
