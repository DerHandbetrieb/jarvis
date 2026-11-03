# Lokis Begrüßung für die Entwurfs-Vorschau der Start-Sequenz (03.11.2026) – gleiche Stimme wie im Programm (Probe S).
# Aufruf: modelle\tts\faster\Scripts\python.exe -I vorschau\start-sequenz\gruss.py
import os, sys
import soundfile as sf
from faster_qwen3_tts import FasterQwen3TTS
hier = os.path.dirname(os.path.abspath(__file__))
vorlage = os.path.join(hier, "..", "..", "stimme", "loki-vorlage.wav")
ref_text = "Selbstverständlich kann ich Ihnen sagen, wie viele Tassen gestern verkauft wurden, Sir. Es waren vier. Ob das ein Grund zum Feiern ist, überlasse ich Ihrem bemerkenswerten Optimismus."
m = FasterQwen3TTS.from_pretrained("Qwen/Qwen3-TTS-12Hz-0.6B-Base")
wavs, sr = m.generate_voice_clone(text="Ah, Sir. Sie leben noch. Wie schön. Ich hatte mich gerade an die Ruhe gewöhnt.", language="German", ref_audio=vorlage, ref_text=ref_text)
sf.write(os.path.join(hier, "loki-gruss.wav"), wavs[0], sr)
print("ok", len(wavs[0]) / sr, "s")
