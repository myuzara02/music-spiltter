import sys
import torch
import demucs.api

model = "htdemucs_6s"
print(f"Loading {model} with default segment...")
separator = demucs.api.Separator(model=model, progress=False)

audio = torch.randn(2, 44100 * 60) # 60 seconds stereo
try:
    print("Separating...")
    origin, separated = separator.separate_tensor(audio, sr=44100)
    print("Success. Stems:", list(separated.keys()))
except Exception as e:
    import traceback
    traceback.print_exc()
