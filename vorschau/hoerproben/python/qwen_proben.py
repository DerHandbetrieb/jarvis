# Hörproben Qwen3-TTS VoiceDesign (Alibaba Qwen, Apache-2.0), 03.11.2026: Stimme per Beschreibung, keine Referenz.
# Aufruf: <venv>\Scripts\python.exe -I qwen_proben.py <Ordner hoerproben>
import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import torch
import soundfile as sf
from qwen_tts import Qwen3TTSModel
from texte import TEXTE

aus = sys.argv[1]
modell = Qwen3TTSModel.from_pretrained("Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign", device_map="cuda:0", dtype=torch.bfloat16, attn_implementation="sdpa")
BESCHREIBUNG = {
    "Q1": "A mature British butler with a deep, calm, warm baritone voice. He speaks fluent German with a slight, elegant British accent. Dry, understated, subtly sarcastic delivery, measured pace, natural pauses.",
    "Q2": "A mature male butler with a deep, calm, warm baritone voice. Native German speaker, standard German pronunciation without accent. Dry, understated, subtly sarcastic delivery, measured pace, natural pauses.",
}
for k, beschreibung in BESCHREIBUNG.items():
    for t, text in TEXTE.items():
        start = time.time()
        wavs, sr = modell.generate_voice_design(text=text, language="German", instruct=beschreibung)
        sf.write(os.path.join(aus, f"{k}-{t}.wav"), wavs[0], sr)
        print(k, t, f"{time.time() - start:.1f} s für {len(wavs[0]) / sr:.1f} s Ton", flush=True)
