# Lokis Stimme (Entscheidung Auftraggeber 03.11.2026: Probe R2 – „genial, so bleibt es“)

- **Technik:** Qwen3-TTS (Alibaba Qwen, Apache-2.0), Grundmodell **`Qwen/Qwen3-TTS-12Hz-0.6B-Base`**, Sprache `German`.
- **Vorlage:** `loki-vorlage.wav` – entstanden mit `Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign` und der Beschreibung:
  „A mature British butler with a deep, calm, warm baritone voice. He speaks fluent German with a slight, elegant British accent. Dry, understated, subtly sarcastic delivery, measured pace, natural pauses.“
- **Gesprochener Text der Vorlage** (wird als `ref_text` gebraucht):
  „Selbstverständlich kann ich Ihnen sagen, wie viele Tassen gestern verkauft wurden, Sir. Es waren vier. Ob das ein Grund zum Feiern ist, überlasse ich Ihrem bemerkenswerten Optimismus.“
- **So entsteht jeder Satz** (offizieller Weg „Voice Design then Clone“, siehe github.com/QwenLM/Qwen3-TTS):
  `create_voice_clone_prompt(ref_audio=loki-vorlage.wav, ref_text=…, x_vector_only_mode=False)` einmal beim Start, danach `generate_voice_clone(text=…, language="German", voice_clone_prompt=…)`. Beispiel: `vorschau/hoerproben/python/qwen_klon.py` (Variante R2).
- Diese Datei und die Vorlage nicht ändern oder löschen – sonst klingt Loki anders.
