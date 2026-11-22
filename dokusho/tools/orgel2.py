"""名作のなかへ ― 図書館のオルゴール 2曲目「遠い日の図書館」（オリジナル曲）を合成して orgel2.mp3 をつくる
   使い方: python3 tools/orgel2.py [作業フォルダ]  （numpy と ffmpeg が必要）
   映画音楽のような、なつかしくて切ない曲。ヘ長調・4/4拍子・ゆったり（♩=64前後で揺れる）。
   ・6度上へ跳ぶ歌い出し、4→3の掛留（サスペンション）、属七の第7音、同主短調から借りた四の和音（B♭m）で胸がしめつけられる響きに
   ・中間部で高まり、A7→D7 を通って、最後の一節は全音上のト長調へ転調して、いちばん明るく歌う
   ・テンポは句の頭でゆっくり、なかほどで少し前へ、句の終わりでためる（ルバート） """
import numpy as np, wave, subprocess, os, sys

SR = 44100
BPM = 64
RNG = np.random.default_rng(21)
NAMES = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def m(n):                       # 'Bb5' -> MIDI, 'C#6' も可
    p = NAMES[n[0]] + n.count('#') - n[1:].count('b')
    return 12 * (int(n[-1]) + 1) + p

# ---- 和音：低音の高さ と 構成音（ピッチクラス） ----
def ch(bass, root, kind):
    iv = {'M': (0, 4, 7), 'm': (0, 3, 7), '7': (0, 4, 7, 10), 'm7': (0, 3, 7, 10), 'sus': (0, 5, 7, 10)}[kind]
    return (m(bass), {(NAMES[root[0]] - root[1:].count('b') + root[1:].count('#') + i) % 12 for i in iv})
C = {
  'F': ch('F3', 'F', 'M'), 'C/E': ch('E3', 'C', 'M'), 'Dm': ch('D3', 'D', 'm'), 'Am/C': ch('C3', 'A', 'm'),
  'Bb': ch('Bb2', 'Bb', 'M'), 'F/A': ch('A2', 'F', 'M'), 'Gm7': ch('G2', 'G', 'm7'), 'C7sus': ch('C3', 'C', 'sus'),
  'C7': ch('C3', 'C', '7'), 'F7/Eb': ch('Eb3', 'F', '7'), 'Bbm': ch('Bb2', 'Bb', 'm'), 'F/C': ch('C3', 'F', 'M'),
  'Am': ch('A2', 'A', 'm'), 'Gm': ch('G2', 'G', 'm'), 'A7': ch('A2', 'A', '7'), 'D7': ch('D3', 'D', '7'),
  # ト長調（最後の一節）
  'G': ch('G2', 'G', 'M'), 'D/F#': ch('F#2', 'D', 'M'), 'Em': ch('E3', 'E', 'm'), 'G7/F': ch('F3', 'G', '7'),
  'C': ch('C3', 'C', 'M'), 'Cm': ch('C3', 'C', 'm'), 'G/D': ch('D3', 'G', 'M'), 'D7b': ch('D3', 'D', '7'),
}
F_MAJ = [5, 7, 9, 10, 0, 2, 4]; G_MAJ = [7, 9, 11, 0, 2, 4, 6]

# ---- 旋律（小節ごと：[音, 拍]）と和音（小節ごと、[前半, 後半] は2拍ずつ） ----
A1 = [  # 歌い出し
  ([('C5',1),('A5',2),('G5',1)], 'F'), ([('G5',2),('F5',1),('E5',1)], 'C/E'),
  ([('F5',1),('D6',2),('C6',1)], 'Dm'), ([('C6',2),('A5',1),('Bb5',1)], 'Am/C'),
  ([('D6',3),('C6',1)], 'Bb'), ([('C6',1),('A5',2),('F5',1)], 'F/A'),
  ([('G5',1),('Bb5',1),('A5',1),('G5',1)], 'Gm7'), ([('F5',2),('E5',2)], ['C7sus', 'C7']),
]
A2 = [  # くり返し：属七の第7音と、借りてきた短調の四の和音で胸がしめつけられる
  ([('C5',1),('A5',2),('G5',1)], 'F'), ([('G5',2),('F5',1),('E5',1)], 'C/E'),
  ([('F5',1),('D6',2),('C6',1)], 'Dm'), ([('C6',2),('Eb6',2)], 'F7/Eb'),
  ([('D6',3),('C6',1)], 'Bb'), ([('Db6',3),('C6',1)], 'Bbm'),
  ([('A5',1.5),('Bb5',.5),('G5',2)], ['F/C', 'C7']), ([('F5',4)], 'F'),
]
B = [   # 中間部：高みへ。A7→D7 で、ト長調への扉をひらく
  ([('A5',1),('D6',1),('F6',2)], 'Dm'), ([('E6',3),('C6',1)], 'Am'),
  ([('F5',1),('Bb5',1),('D6',2)], 'Bb'), ([('C6',3),('A5',1)], 'F'),
  ([('Bb5',1),('D6',1),('G6',2)], 'Gm'), ([('F6',3),('D6',1)], 'Bb'),
  ([('E6',2),('C#6',1),('A5',1)], 'A7'), ([('C6',2),('A5',1),('F#5',1)], 'D7'),
]
TR = {'F': 'G', 'C/E': 'D/F#', 'Dm': 'Em', 'F7/Eb': 'G7/F', 'Bb': 'C', 'Bbm': 'Cm', 'F/C': 'G/D', 'C7': 'D7b'}
def up2(n):   # 全音上へ
    x = m(n) + 2; return x
A3 = [([(up2(n), d) for n, d in mel], [TR[c] for c in chs] if isinstance(chs, list) else TR[chs]) for mel, chs in A2]

SECTIONS = [('A1', A1, F_MAJ, 0.80, 0), ('A2', A2, F_MAJ, 0.86, 1), ('B', B, F_MAJ, 0.95, 2), ('A3', A3, G_MAJ, 1.04, 3)]

notes = []   # (拍位置, MIDI, 強さ, 役割)
def add(beat, midi, vel, role='acc'): notes.append((beat, midi, vel, role))

def harm_below(midi, pcs, scale):
    """旋律の3度下（だめなら6度下）で、和音の音になるものを返す"""
    if midi % 12 not in scale: return None
    i = scale.index(midi % 12)
    for steps in (2, 5):
        j = (i - steps) % 7
        iv = (scale[i] - scale[j]) % 12
        cand = midi - iv
        if cand % 12 in pcs: return cand
    return None

def arp(bass, pcs, b0, vel, beats=(0, 1, 2, 3)):
    """8分音符の分散和音：低音 → 開いた和音を上って、下りる"""
    tones = [p for p in range(bass + 7, bass + 30) if p % 12 in pcs][:4]
    while len(tones) < 4: tones.append(tones[-1] + 12)
    pat = [bass, tones[0], tones[1], tones[2], tones[3], tones[2], tones[1], tones[0]]
    for k in range(8):
        if k // 2 in beats:
            add(b0 + k * 0.5, pat[k], vel * (1.45 if k == 0 else (1.0 if k % 2 == 0 else 0.82)))

beat = 0
# 前奏：ヘ長調の分散和音を2小節（そっと）
for k in range(2):
    arp(*C['F'], beat, 0.24 if k == 0 else 0.27); beat += 4
BAR0 = beat
for name, sec_, scale, dyn, si in SECTIONS:
    for bi, (mel, chs) in enumerate(sec_):
        b0 = beat
        halves = chs if isinstance(chs, list) else [chs, chs]
        # 強弱：中間部のいちばん高いところ（5〜6小節目）へ向けてふくらませる
        swell = 1 + (0.12 * np.sin(np.pi * (bi + 0.5) / 8) if name in ('B', 'A3') else 0.05 * np.sin(np.pi * (bi + 0.5) / 8))
        v = dyn * swell
        t = 0
        for n, d in mel:
            mi = m(n) if isinstance(n, str) else n
            add(b0 + t, mi, (0.95 if t == 0 else 0.84) * v, 'mel')
            pcs = C[halves[0 if t < 2 else 1]][1]
            need = {'A1': 99, 'A2': 3, 'B': 2, 'A3': 1.5}[name]
            if d >= need:
                h = harm_below(mi, pcs, scale)
                if h: add(b0 + t + 0.03, h, 0.40 * v, 'har')
            if name == 'A3' and d >= 2:            # 最後の一節は、旋律を1オクターブ下でもそっと重ねる
                add(b0 + t + 0.015, mi - 12, 0.30 * v, 'har')
            t += d
        accv = 0.21 * v                         # 伴奏はひかえめに、旋律が歌うように
        if halves[0] == halves[1]: arp(*C[halves[0]], b0, accv)
        else:
            arp(*C[halves[0]], b0, accv, (0, 1)); arp(*C[halves[1]], b0, accv, (2, 3))
        beat += 4
END = beat
# 終わり：ト長調の和音（9の音をそえて）をゆっくり広げ、最後に高いソをひとつ
for k, n in enumerate(['G2', 'D3', 'G3', 'A3', 'B3', 'D4', 'G4', 'B4']):
    add(END + k * 0.33, m(n) + 12, 0.42, 'end')
add(END + 3.0, m('D6'), 0.5, 'end'); add(END + 3.6, m('G6'), 0.62, 'end')
TOTAL_BEATS = END + 12

# ---- テンポの揺れ（拍ごとの長さの倍率） ----
def mult(b):
    if b < BAR0: return 1.08 - 0.03 * (b / BAR0)              # 前奏はゆっくり
    if b >= END: return 1.5 + 0.05 * (b - END)                # 余韻
    q = (b - BAR0) % 32; sec_i = int((b - BAR0) // 32)
    x = 1.0 + 0.045 * np.cos(2 * np.pi * q / 32)              # 句の頭と終わりはゆっくり、なかほどは前へ
    if q >= 28: x += 0.06 * (q - 27)                          # 句の終わりでためる
    if sec_i == 2 and q >= 28: x += 0.07 * (q - 27)           # 転調の前は、さらに大きく息をのむ
    if sec_i == 3 and q >= 20: x += 0.035 * (q - 19)          # 最後の一節の後半から、だんだんゆっくり
    return x
def sec(beat):
    base = 60 / BPM; i = int(beat)
    return base * (sum(mult(k) for k in range(i)) + (beat - i) * mult(i))

# ---- オルゴールの音（くし歯の音）。この曲は余韻を少し長く、やわらかく ----
def tine(f, vel, ring=1.0):
    T = float(np.clip(1.85 * (600 / f) ** 0.5, 0.8, 3.8)) * ring
    dur = min(6 * T, 8.0); n = int(dur * SR); t = np.arange(n) / SR
    low = f < 330
    parts = [(1.0, 1.0, T), (1.0024, 0.30, T * 0.9), (2.0, 0.42 if low else 0.13, T * 0.35),
             (3.0, 0.16 if low else 0.03, T * 0.2), (5.4, 0.055, 0.07), (8.9, 0.018, 0.035)]
    y = np.zeros(n)
    for r, a, d in parts:
        fr = f * r
        if fr > SR * 0.45: continue
        y += a * np.sin(2 * np.pi * fr * t + RNG.uniform(0, 6.28)) * np.exp(-t / d)
    att = int(0.003 * SR); y[:att] *= np.linspace(0, 1, att)
    fade = int(0.04 * SR); y[-fade:] *= np.linspace(1, 0, fade)
    clk = int(0.006 * SR); nz = np.diff(RNG.standard_normal(clk + 1)) * np.exp(-np.arange(clk) / (clk / 4))
    y[:clk] += 0.022 * nz
    return y * vel

total = sec(TOTAL_BEATS) + 1.0
dry = np.zeros(int(total * SR) + SR * 9)
for b, mi, vel, role in notes:
    f = 440 * 2 ** ((mi - 69) / 12)
    v = vel * RNG.uniform(0.93, 1.04)
    s = max(int((sec(b) + RNG.normal(0, 0.005)) * SR), 0)
    y = tine(f, v, {'acc': 0.5, 'mel': 1.1, 'har': 0.9, 'end': 1.3}[role])
    dry[s:s + len(y)] += y[:len(dry) - s]
dry = dry[:int(total * SR) + SR * 3]

# ---- 残響：広めの部屋（2.6秒） ----
RT = 2.6
def ir(seed):
    r = np.random.default_rng(seed); L = int(RT * 1.15 * SR); t = np.arange(L) / SR
    nz = r.standard_normal(L); F = np.fft.rfft(nz); fr = np.fft.rfftfreq(L, 1 / SR)
    F *= 1 / (1 + (fr / 3800) ** 2); F[fr < 150] *= 0.25
    y = np.fft.irfft(F, L) * np.exp(-t * 6.9 / RT)
    y[:int(0.018 * SR)] = 0
    return y / np.sqrt((y ** 2).sum())
N = 1 << int(np.ceil(np.log2(len(dry) + int(RT * 1.15 * SR))))
X = np.fft.rfft(dry, N)
wet = [np.fft.irfft(X * np.fft.rfft(ir(s), N), N)[:len(dry)] for s in (31, 32)]
out = np.stack([dry * 0.8 + wet[0] * 0.42, dry * 0.8 + wet[1] * 0.42], 1)
out *= 0.42 / np.percentile(np.abs(out), 99.95)
out = np.tanh(out * 1.6) / 1.6 * 1.1
pcm = (out * 32767).astype('<i2')

here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
wav = os.path.join(sys.argv[1] if len(sys.argv) > 1 else '/tmp', 'orgel2.wav')
with wave.open(wav, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
mp3 = os.path.join(root, 'orgel2.mp3')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '96k',
                '-metadata', 'title=遠い日の図書館', '-metadata', 'artist=名作のなかへ', mp3], check=True)
print('notes', len(notes), 'bars', (END - BAR0) // 4, 'length %.1fs' % (len(pcm) / SR), mp3, os.path.getsize(mp3))
