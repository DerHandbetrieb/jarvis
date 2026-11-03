# Hörproben Thorsten-Voice/Kokoro (Apache-2.0, Thorsten-Voice CC0), 03.11.2026 – nach der Anleitung auf
# huggingface.co/Thorsten-Voice/Kokoro (inkl. Umgehung für das kurze ü „ʏ“). Epoche 5 (Standard) und 10.
# Aufruf: <venv>\Scripts\python.exe -I kokoro_proben.py <Ordner hoerproben>
import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import soundfile as sf
import torch
from huggingface_hub import hf_hub_download
from kokoro import KModel, KPipeline
from texte import TEXTE

aus = sys.argv[1]
REPO = "Thorsten-Voice/Kokoro"
config = hf_hub_download(repo_id=REPO, filename="config.json")
for k, (modelldatei, stimme) in {"K1": ("model.pth", "voices/thorsten.pt"), "K2": ("model_ep10.pth", "voices/thorsten_ep10.pt")}.items():
    km = KModel(repo_id="hexgrad/Kokoro-82M", config=config, model=hf_hub_download(repo_id=REPO, filename=modelldatei)).to("cuda").eval()
    pipe = KPipeline(lang_code="d", repo_id="hexgrad/Kokoro-82M", model=km)
    g2p = pipe.g2p
    pipe.g2p = lambda text, g2p=g2p: (lambda ps, tok: (ps.replace("ʏ", "y"), tok))(*g2p(text))
    voice = torch.load(hf_hub_download(repo_id=REPO, filename=stimme), map_location="cpu", weights_only=True)
    for t, text in TEXTE.items():
        start = time.time()
        ton = np.concatenate([a for _, _, a in pipe(text, voice=voice, speed=1.0)])
        sf.write(os.path.join(aus, f"{k}-{t}.wav"), ton, 24000)
        print(k, t, f"{time.time() - start:.1f} s für {len(ton) / 24000:.1f} s Ton", flush=True)
