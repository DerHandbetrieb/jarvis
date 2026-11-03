# Lokis Begrüßungen für die Entwurfs-Vorschau der Start-Sequenz (03.11.2026) – gleiche Stimme wie im Programm (Probe S).
# Vorgabe Auftraggeber: beginnt immer mit „Willkommen zurück, Sir.“, danach ein wechselnder Spruch.
# Aufruf: modelle\tts\faster\Scripts\python.exe -I vorschau\start-sequenz\gruss.py
import os
import soundfile as sf
from faster_qwen3_tts import FasterQwen3TTS
hier = os.path.dirname(os.path.abspath(__file__))
vorlage = os.path.join(hier, "..", "..", "stimme", "loki-vorlage.wav")
ref_text = "Selbstverständlich kann ich Ihnen sagen, wie viele Tassen gestern verkauft wurden, Sir. Es waren vier. Ob das ein Grund zum Feiern ist, überlasse ich Ihrem bemerkenswerten Optimismus."
SAETZE = [
    "Willkommen zurück, Sir. Ich hatte gehofft, Sie hätten sich verlaufen. Dauerhaft.",
    "Willkommen zurück, Sir. Ihr Stuhl hat Ihre Abwesenheit sehr genossen. Er war nicht der Einzige.",
    "Willkommen zurück, Sir. Alle Systeme laufen einwandfrei. Bei Ihnen bin ich mir noch nicht ganz sicher.",
    "Willkommen zurück, Sir. Ich habe die Nacht über Ihr Lebenswerk nachgedacht. Es war ein kurzer Gedanke.",
]
m = FasterQwen3TTS.from_pretrained("Qwen/Qwen3-TTS-12Hz-0.6B-Base")
for i, satz in enumerate(SAETZE, 1):
    wavs, sr = m.generate_voice_clone(text=satz, language="German", ref_audio=vorlage, ref_text=ref_text)
    sf.write(os.path.join(hier, f"gruss-{i}.wav"), wavs[0], sr)
    print(i, round(len(wavs[0]) / sr, 1), "s")
