"""名作のなかへ ― 図書館のオルゴール曲「栞のワルツ」（オリジナル曲）を合成して orgel.mp3 をつくる
   使い方: python3 tools/orgel.py  （numpy と ffmpeg が必要）
   変ホ長調・3/4拍子。1回目は「ズン・チャッ・チャッ」の伴奏、2回目は8分音符の分散和音と3度の重ね。"""
import numpy as np, wave, subprocess, os, sys

SR = 44100
BPM = 92
RNG = np.random.default_rng(7)
NAMES = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def m(n):                       # 'Bb5' -> MIDI
    p = NAMES[n[0]] + (n.count('#') - n.count('b'))
    return 12 * (int(n[-1]) + 1) + p

# ---- 旋律（小節ごと：[音, 拍の長さ]）。和音は小節単位、[a,a,b] は拍ごと ----
MEL = [
  # A
  [('Bb5',2),('G5',1)], [('C6',1),('Bb5',1),('G5',1)], [('Ab5',2),('C6',1)], [('Bb5',3)],
  [('G5',1),('Ab5',1),('Bb5',1)], [('Eb6',2),('D6',1)], [('C6',1.5),('Bb5',.5),('Ab5',1)], [('F5',3)],
  # A'
  [('Bb5',2),('G5',1)], [('C6',1),('Bb5',1),('G5',1)], [('Ab5',1),('C6',1),('F6',1)], [('Eb6',2),('D6',1)],
  [('D6',1),('Eb6',1),('Bb5',1)], [('G5',2),('C6',1)], [('Ab5',1.5),('G5',.5),('F5',1)], [('Eb5',3)],
  # B
  [('C6',1),('Eb6',1),('C6',1)], [('D6',2),('Bb5',1)], [('Bb5',1),('D6',1),('G6',1)], [('G6',2),('Eb6',1)],
  [('Ab5',1),('C6',1),('F6',1)], [('F6',1.5),('Eb6',.5),('D6',1)], [('Eb6',1),('C6',1),('Ab5',1)], [('D6',2),('C6',1)],
  # A''
  [('Bb5',2),('G5',1)], [('C6',1),('Bb5',1),('G5',1)], [('Ab5',1),('C6',1),('Eb6',1)], [('F6',2),('D6',1)],
  [('G6',2),('F6',1)], [('Eb6',1),('C6',1),('Ab5',1)], [('Bb5',1),('C6',1),('D6',1)], [('Eb6',3)],
]
CH = ['Eb','Cm','Ab','Bb','Eb','Cm','Fm','Bb',
      'Eb','Cm','Ab','Bb','Gm','Cm',['Fm','Fm','Bb7'],'Eb',
      'Ab','Bb','Gm','Cm','Fm','Bb','Ab','Bb',
      'Eb','Cm','Ab','Bb','EbG','Ab','Bb7','Eb']
# 和音：低音、伴奏の2音、構成音（ピッチクラス）
CHORD = {
  'Eb':  (51, [67, 70], {3, 7, 10}),  'Cm': (48, [63, 67], {0, 3, 7}),  'Ab': (56, [68, 72], {8, 0, 3}),
  'Bb':  (58, [70, 74], {10, 2, 5}),  'Bb7': (58, [68, 74], {10, 2, 5, 8}), 'Gm': (55, [70, 74], {7, 10, 2}),
  'Fm':  (53, [68, 72], {5, 8, 0}),   'EbG': (55, [63, 70], {3, 7, 10}),
}
SCALE = [3, 5, 7, 8, 10, 0, 2]   # 変ホ長調

notes = []   # (拍位置, MIDI, 強さ, 役割)
def add(beat, midi, vel, role='acc'): notes.append((beat, midi, vel, role))

def chord_at(bar, b):
    c = CH[bar]; return c[int(b)] if isinstance(c, list) else c

def third_below(midi, chord):
    pcs = CHORD[chord][2]
    for steps in (2, 5):                         # 3度下、だめなら6度下
        pc = midi % 12
        if pc not in SCALE: return None
        i = SCALE.index(pc); octv = 0
        j = i - steps
        while j < 0: j += 7; octv += 1
        cand = midi - ((SCALE[i] - SCALE[j]) % 12 or 12) if steps == 2 else None
        if steps == 5: cand = midi - ((SCALE[i] - SCALE[j]) % 12) - (12 if (SCALE[i] - SCALE[j]) % 12 == 0 else 0)
        if cand is not None and cand % 12 in pcs and midi - cand <= 9: return cand
    return None

def pass_(start, second):
    for bar in range(32):
        b0 = start + bar * 3
        # 旋律
        t = 0
        for (n, d) in MEL[bar]:
            mi = m(n); acc = 0.95 if t == 0 else 0.8
            add(b0 + t, mi, acc, 'mel')
            if second and d >= 1.5:
                h = third_below(mi, chord_at(bar, t))
                if h: add(b0 + t + 0.02, h, 0.42, 'har')
            t += d
        # 伴奏
        for b in range(3):
            c = chord_at(bar, b); bass, dy, _ = CHORD[c]
            if not second:
                if b == 0: add(b0, bass, 0.62)
                else:
                    for k, x in enumerate(dy): add(b0 + b + k * 0.012, x, 0.33)
            else:
                r = bass; third = 4 if c in ('Eb', 'Ab', 'Bb', 'Bb7', 'EbG') else 3
                if c == 'EbG': r = 51
                pat = [r, r + 7, r + 12, r + 12 + third, r + 12, r + 7]
                if c == 'EbG': pat[0] = 55
                for k in (0, 1):
                    idx = b * 2 + k
                    add(b0 + b + k * 0.5, pat[idx], 0.58 if idx == 0 else 0.3)

# 前奏1小節（伴奏だけ）→ 1回目 → 2回目 → 終わりの和音
for b in range(3):
    if b == 0: add(0, 51, 0.6)
    else: [add(b + k * 0.012, x, 0.33) for k, x in enumerate([67, 70])]
pass_(3, False)
pass_(3 + 96, True)
END = 3 + 192
for k, x in enumerate([51, 58, 63, 67, 70, 75, 79, 87]): add(END + k * 0.09, x, 0.5 if x < 80 else 0.75, 'end')
TOTAL_BEATS = END + 9          # 余韻3小節

# ---- 拍 → 秒（最後の4小節でゆっくり） ----
def sec(beat):
    base = 60 / BPM; rit0 = END - 12
    if beat <= rit0: return beat * base
    x = beat - rit0                               # 終盤：1拍ごとに少しずつ遅く
    return rit0 * base + sum(base * (1 + 0.025 * i) for i in range(int(x))) + (x % 1) * base * (1 + 0.025 * int(x))

# ---- オルゴールの音（くし歯の音）----
def tine(f, vel, ring=1.0):
    T = float(np.clip(1.7 * (600 / f) ** 0.5, 0.7, 3.6)) * ring
    dur = min(6 * T, 7.0); n = int(dur * SR); t = np.arange(n) / SR
    low = f < 330
    parts = [(1.0, 1.0, T), (1.0028, 0.32, T * 0.85), (2.0, 0.45 if low else 0.16, T * 0.35),
             (3.0, 0.18 if low else 0.04, T * 0.22), (5.4, 0.07, 0.07), (8.9, 0.025, 0.035)]
    y = np.zeros(n)
    for r, a, d in parts:
        fr = f * r
        if fr > SR * 0.45: continue
        y += a * np.sin(2 * np.pi * fr * t + RNG.uniform(0, 6.28)) * np.exp(-t / d)
    att = int(0.0025 * SR); y[:att] *= np.linspace(0, 1, att)
    fade = int(0.03 * SR); y[-fade:] *= np.linspace(1, 0, fade)
    clk = int(0.006 * SR); nz = np.diff(RNG.standard_normal(clk + 1)) * np.exp(-np.arange(clk) / (clk / 4))
    y[:clk] += 0.03 * nz
    return y * vel

total = sec(TOTAL_BEATS) + 1.0
dry = np.zeros(int(total * SR) + SR * 8)
for beat, mi, vel, role in notes:
    f = 440 * 2 ** ((mi - 69) / 12)
    v = vel * (1.0 if role in ('mel',) else 0.85) * RNG.uniform(0.92, 1.05)
    s = int((sec(beat) + RNG.normal(0, 0.004)) * SR); s = max(s, 0)
    y = tine(f, v, 1.0 if role != 'acc' else 0.6)        # 伴奏は短めに響かせて、にごらせない
    dry[s:s + len(y)] += y[:len(dry) - s]
dry = dry[:int(total * SR) + SR * 3]

# ---- 残響（合成インパルス応答） ----
def ir(seed):
    r = np.random.default_rng(seed); L = int(1.9 * SR); t = np.arange(L) / SR
    nz = r.standard_normal(L); F = np.fft.rfft(nz); fr = np.fft.rfftfreq(L, 1 / SR)
    F *= 1 / (1 + (fr / 4500) ** 2); F[fr < 120] *= 0.3
    y = np.fft.irfft(F, L) * np.exp(-t * 6.9 / 1.7)
    y[:int(0.012 * SR)] = 0
    return y / np.sqrt((y ** 2).sum())
N = 1 << int(np.ceil(np.log2(len(dry) + int(1.9 * SR))))
X = np.fft.rfft(dry, N)
wet = [np.fft.irfft(X * np.fft.rfft(ir(s), N), N)[:len(dry)] for s in (11, 12)]
out = np.stack([dry * 0.85 + wet[0] * 0.33, dry * 0.85 + wet[1] * 0.33], 1)
out *= 0.42 / np.percentile(np.abs(out), 99.95)   # たまに重なる強い音は、やわらかく頭をおさえる
out = np.tanh(out * 1.6) / 1.6 * 1.1
pcm = (out * 32767).astype('<i2')

here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
wav = os.path.join(sys.argv[1] if len(sys.argv) > 1 else '/tmp', 'orgel.wav')
with wave.open(wav, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
mp3 = os.path.join(root, 'orgel.mp3')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '96k',
                '-metadata', 'title=栞のワルツ', '-metadata', 'artist=名作のなかへ', mp3], check=True)
print('notes', len(notes), 'length %.1fs' % (len(pcm) / SR), mp3, os.path.getsize(mp3))
