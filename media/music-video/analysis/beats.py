import librosa, numpy as np, json, sys
y, sr = librosa.load(sys.argv[1], sr=22050, mono=True)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
onset_env = librosa.onset.onset_strength(y=y, sr=sr)
rms = librosa.feature.rms(y=y)[0]
times = librosa.times_like(rms, sr=sr)
# per-second energy
sec = [float(np.mean(rms[(times>=s)&(times<s+1)])) for s in range(int(times[-1])+1)]
# downbeat guess: strongest phase of 4
bt = np.array(beats)
oe_t = librosa.times_like(onset_env, sr=sr)
strength = np.interp(bt, oe_t, onset_env)
phase = max(range(4), key=lambda p: strength[p::4].mean())
json.dump({"tempo": float(np.atleast_1d(tempo)[0]), "beats": [round(float(b),3) for b in beats],
           "downbeat_phase": int(phase), "energy_per_sec": [round(e,4) for e in sec]}, open('analysis/beats.json','w'))
print("tempo", tempo, "n beats", len(beats), "first", beats[:8], "phase", phase)
print("intervals median", np.median(np.diff(beats)))
e=np.array(sec); e=e/e.max()
print(" ".join(f"{i}:{v:.2f}" for i,v in enumerate(e) if i%3==0))
