"""名作のなかへ ― 図書館のオルゴール 3〜6曲目（保護期間の過ぎた名曲を、オルゴールに編曲）を合成して orgel3〜6.mp3 をつくる
   使い方: python3 tools/orgel_pd.py [作業フォルダ]  （numpy と ffmpeg が必要）
   orgel3 カノン（パッヘルベル）／orgel4 エリーゼのために（ベートーヴェン）／orgel5 グリーンスリーブス（イギリス民謡）／orgel6 歓喜の歌（ベートーヴェン）
   音色・残響は orgel2.py と同じ考え方（くし歯の音＋広めの部屋）。編曲は、このサイトのためのもの """
import numpy as np, wave, subprocess, os, sys

SR = 44100
NAMES = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def m(n):
    p = NAMES[n[0]] + n.count('#') - n[1:].count('b')
    return 12 * (int(n[-1]) + 1) + p
CH = {'M': (0, 4, 7), 'm': (0, 3, 7), '7': (0, 4, 7, 10)}
def chord(name):                   # 'D', 'Bm', 'F#m', 'E7' → (低音, ピッチクラス)
    root = name[:2] if len(name) > 1 and name[1] in '#b' else name[:1]
    kind = name[len(root):] or 'M'
    pc = NAMES[root[0]] + root.count('#') - root.count('b')
    bass = 12 * 3 + pc if pc <= 4 else 12 * 2 + pc     # 低音は、E3 より下に
    return bass, {(pc + i) % 12 for i in CH[kind]}

def arp(notes, bass, pcs, b0, beats, vel, step=0.5):
    """分散和音：低音 → 開いた和音を上って、下りる（beats 拍ぶん、step 拍ごと）"""
    tones = [p for p in range(bass + 7, bass + 30) if p % 12 in pcs][:4]
    while len(tones) < 4: tones.append(tones[-1] + 12)
    pat = [bass, tones[0], tones[1], tones[2], tones[3], tones[2], tones[1], tones[0]]
    k = 0
    while k * step < beats - 1e-9:
        notes.append((b0 + k * step, pat[k % 8], vel * (1.4 if k == 0 else (1.0 if k % 2 == 0 else 0.82)), 'acc')); k += 1

# ---------------- 1. カノン（ニ長調・4/4・♩=56） ----------------
def canon():
    N = []; prog = ['D', 'A', 'Bm', 'F#m', 'G', 'D', 'G', 'A']
    v1 = ['F#5', 'E5', 'D5', 'C#5', 'B4', 'A4', 'B4', 'C#5']                  # 2拍ずつ
    v2 = ['D5', 'C#5', 'B4', 'A4', 'G4', 'F#4', 'G4', 'E4']
    v3 = ['D5', 'F#5', 'A5', 'G5', 'F#5', 'D5', 'F#5', 'E5', 'D5', 'B4', 'D5', 'A5', 'G5', 'B5', 'A5', 'G5']   # 1拍ずつ
    beat = 0
    def cyc(mel, dur, vel, oct_=0, harm=None, accv=0.22):
        nonlocal beat
        for i, c in enumerate(prog):
            b, pcs = chord(c); arp(N, b, pcs, beat + i * 2, 2, accv)
        t = 0
        for n in mel:
            N.append((beat + t, m(n) + oct_, vel, 'mel')); t += dur
        if harm:
            t = 0
            for n in harm:
                N.append((beat + t + 0.02, m(n) + oct_, vel * 0.55, 'har')); t += 2
        beat += 16
    cyc([], 2, 0)                                   # 前奏：和音だけ
    cyc(v1, 2, 0.85); cyc(v2, 2, 0.8); cyc(v3, 1, 0.82)
    cyc(v1, 2, 0.9, 12, v2); cyc(v3, 1, 0.9, 12)
    for k, n in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4', 'D5', 'F#5', 'A5']):
        N.append((beat + k * 0.4, m(n), 0.42, 'end'))
    N.append((beat + 3.4, m('D6'), 0.55, 'end'))
    return N, 56, beat, beat + 10

# ---------------- 2. エリーゼのために（イ短調・3/8・♪=126） ----------------
def elise():
    N = []; beat = 0
    def bar(rh, lh=()):
        nonlocal beat
        for t, n in rh: N.append((beat + t, m(n), 0.85, 'mel'))
        for t, n in lh: N.append((beat + t, m(n), 0.42, 'acc'))
        beat += 3
    q = lambda *ns: [(i * 0.5, n) for i, n in enumerate(ns)]          # 16分音符を並べる
    run = q('E5', 'D#5', 'E5', 'B4', 'D5', 'C5')
    A_LH = q('A2', 'E3', 'A3'); E_LH = q('E2', 'E3', 'G#3')
    def sectionA(ending, pickup=True):
        if pickup: N.append((beat - 1.0, m('E5'), 0.8, 'mel')); N.append((beat - 0.5, m('D#5'), 0.8, 'mel'))    # 弱起
        bar(run)
        bar([(0, 'A4'), (1.5, 'C4'), (2.0, 'E4'), (2.5, 'A4')], A_LH)
        bar([(0, 'B4'), (1.5, 'E4'), (2.0, 'G#4'), (2.5, 'B4')], E_LH)
        bar([(0, 'C5'), (1.5, 'E4'), (2.0, 'E5'), (2.5, 'D#5')], A_LH)
        bar(run)
        bar([(0, 'A4'), (1.5, 'C4'), (2.0, 'E4'), (2.5, 'A4')], A_LH)
        bar([(0, 'B4'), (1.5, 'E4'), (2.0, 'C5'), (2.5, 'B4')], E_LH)
        bar([(0, 'A4')] + ([(1.5, 'B4'), (2.0, 'C5'), (2.5, 'D5')] if ending == 2 else []), A_LH)
    beat = 2
    sectionA(1); sectionA(2)
    bar([(0, 'E5'), (1.5, 'G4'), (2.0, 'F5'), (2.5, 'E5')], q('C3', 'G3', 'C4'))
    bar([(0, 'D5'), (1.5, 'F4'), (2.0, 'E5'), (2.5, 'D5')], q('G2', 'G3', 'B3'))
    bar([(0, 'C5'), (1.5, 'E4'), (2.0, 'D5'), (2.5, 'C5')], q('A2', 'E3', 'A3'))
    bar([(0, 'B4'), (1.5, 'E4'), (2.0, 'E5'), (2.5, 'E4')], q('E2', 'E3', 'E4'))
    bar(q('E5', 'D#5', 'E5', 'D#5', 'E5', 'D#5'))
    sectionA(1, pickup=False)
    end = beat
    for k, n in enumerate(['A2', 'E3', 'A3', 'C4', 'E4', 'A4']):
        N.append((end + k * 0.5, m(n), 0.45, 'end'))
    return N, 126, end, end + 12

# ---------------- 3. グリーンスリーブス（イ短調・3/4・♩=88） ----------------
def greensleeves():
    N = []
    VERSE = [  # (旋律 [(音, 拍)], 和音)
        ([('C5', 2), ('D5', 1)], 'C'), ([('E5', 1.5), ('F5', .5), ('E5', 1)], 'C'), ([('D5', 2), ('B4', 1)], 'G'), ([('G4', 1.5), ('A4', .5), ('B4', 1)], 'Em'),
        ([('C5', 2), ('A4', 1)], 'Am'), ([('A4', 1.5), ('G#4', .5), ('A4', 1)], 'Am'), ([('B4', 2), ('G#4', 1)], 'E'), ([('E4', 2), ('A4', 1)], 'E'),
        ([('C5', 2), ('D5', 1)], 'C'), ([('E5', 1.5), ('F5', .5), ('E5', 1)], 'C'), ([('D5', 2), ('B4', 1)], 'G'), ([('G4', 1.5), ('A4', .5), ('B4', 1)], 'Em'),
        ([('C5', 1.5), ('B4', .5), ('A4', 1)], 'Am'), ([('G#4', 1.5), ('F#4', .5), ('G#4', 1)], 'E'), ([('A4', 3)], 'Am'),
    ]
    CHORUS = [
        ([('G5', 3)], 'C'), ([('G5', 1.5), ('F#5', .5), ('E5', 1)], 'C'), ([('D5', 2), ('B4', 1)], 'G'), ([('G4', 1.5), ('A4', .5), ('B4', 1)], 'Em'),
        ([('C5', 2), ('A4', 1)], 'Am'), ([('A4', 1.5), ('G#4', .5), ('A4', 1)], 'Am'), ([('B4', 2), ('G#4', 1)], 'E'), ([('E4', 3)], 'E'),
        ([('G5', 3)], 'C'), ([('G5', 1.5), ('F#5', .5), ('E5', 1)], 'C'), ([('D5', 2), ('B4', 1)], 'G'), ([('G4', 1.5), ('A4', .5), ('B4', 1)], 'Em'),
        ([('C5', 1.5), ('B4', .5), ('A4', 1)], 'Am'), ([('G#4', 1.5), ('F#4', .5), ('G#4', 1)], 'E'), ([('A4', 3)], 'Am'),
    ]
    beat = 3
    for c in ['Am', 'Am']:
        b, pcs = chord(c); arp(N, b, pcs, beat, 3, 0.25); beat += 3
    for rep, (sec, oct_, v) in enumerate([(VERSE, 0, 0.82), (CHORUS, 0, 0.86), (VERSE, 12, 0.88), (CHORUS, 12, 0.92)]):
        N.append((beat - 1, m('A4') + oct_, v, 'mel')) if sec is VERSE else None      # 弱起
        for mel, c in sec:
            t = 0
            for n, d in mel:
                N.append((beat + t, m(n) + oct_, v, 'mel'))
                if oct_ and d >= 1.5: N.append((beat + t + 0.02, m(n), v * 0.4, 'har'))
                t += d
            b, pcs = chord(c); arp(N, b, pcs, beat, 3, 0.22)
            beat += 3
    end = beat
    for k, n in enumerate(['A2', 'E3', 'A3', 'C4', 'E4', 'A4', 'C5']):
        N.append((end + k * 0.45, m(n), 0.42, 'end'))
    return N, 88, end, end + 10

# ---------------- 4. 歓喜の歌（ニ長調・4/4・♩=96） ----------------
def joy():
    N = []
    L = [  # 4分音符＝1拍。'F#4.' は付点（1.5拍）、そのあとの音は 0.5拍
        (['F#4', 'F#4', 'G4', 'A4'], 'D', 'D'), (['A4', 'G4', 'F#4', 'E4'], 'D', 'A'), (['D4', 'D4', 'E4', 'F#4'], 'D', 'D'), ([('F#4', 1.5), ('E4', .5), ('E4', 2)], 'A', 'A'),
        (['F#4', 'F#4', 'G4', 'A4'], 'D', 'D'), (['A4', 'G4', 'F#4', 'E4'], 'D', 'A'), (['D4', 'D4', 'E4', 'F#4'], 'D', 'D'), ([('E4', 1.5), ('D4', .5), ('D4', 2)], 'A', 'D'),
        (['E4', 'E4', 'F#4', 'D4'], 'A', 'D'), ([('E4', 1), ('F#4', .5), ('G4', .5), ('F#4', 1), ('D4', 1)], 'A', 'D'), ([('E4', 1), ('F#4', .5), ('G4', .5), ('F#4', 1), ('E4', 1)], 'A', 'D'), ([('D4', 1), ('E4', 1), ('A3', 2)], 'G', 'A'),
        (['F#4', 'F#4', 'G4', 'A4'], 'D', 'D'), (['A4', 'G4', 'F#4', 'E4'], 'D', 'A'), (['D4', 'D4', 'E4', 'F#4'], 'D', 'D'), ([('E4', 1.5), ('D4', .5), ('D4', 2)], 'A', 'D'),
    ]
    beat = 4
    for c in ['D', 'A']:
        b, pcs = chord(c); arp(N, b, pcs, beat, 4, 0.24); beat += 4
    for rep, (oct_, v) in enumerate([(12, 0.84), (24, 0.9)]):
        for mel, c1, c2 in L:
            t = 0
            for x in mel:
                n, d = (x, 1) if isinstance(x, str) else x
                N.append((beat + t, m(n) + oct_, v, 'mel'))
                if rep == 1 and d >= 1: N.append((beat + t + 0.02, m(n) + 12, v * 0.38, 'har'))
                t += d
            for i, c in enumerate([c1, c2]):
                b, pcs = chord(c); arp(N, b, pcs, beat + i * 2, 2, 0.21)
            beat += 4
    end = beat
    for k, n in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4', 'D5']):
        N.append((end + k * 0.4, m(n) + 12, 0.42, 'end'))
    N.append((end + 3.0, m('D6'), 0.55, 'end'))
    return N, 96, end, end + 10

# ---------------- 音（くし歯）と残響：orgel2.py と同じ考え方 ----------------
RNG = np.random.default_rng(7)
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

def render(notes, bpm, end, total_beats):
    def mult(b):                       # 終わりに向けて、だんだんゆっくり。余韻はさらにゆっくり
        if b >= end: return 1.5
        x = b / max(end, 1)
        return 1.0 + (0.25 * (x - 0.9) / 0.1 if x > 0.9 else 0)
    def sec(beat):
        base = 60 / bpm; i = int(beat)
        return base * (sum(mult(k) for k in range(i)) + (beat - i) * mult(i))
    total = sec(total_beats) + 1.0
    dry = np.zeros(int(total * SR) + SR * 9)
    for b, mi, vel, role in notes:
        f = 440 * 2 ** ((mi - 69) / 12)
        s = max(int((sec(b) + RNG.normal(0, 0.005)) * SR), 0)
        y = tine(f, vel * RNG.uniform(0.93, 1.04), {'acc': 0.5, 'mel': 1.1, 'har': 0.9, 'end': 1.3}[role])
        dry[s:s + len(y)] += y[:len(dry) - s]
    dry = dry[:int(total * SR) + SR * 3]
    RT = 2.4
    def ir(seed):
        r = np.random.default_rng(seed); L = int(RT * 1.15 * SR); t = np.arange(L) / SR
        F = np.fft.rfft(r.standard_normal(L)); fr = np.fft.rfftfreq(L, 1 / SR)
        F *= 1 / (1 + (fr / 3800) ** 2); F[fr < 150] *= 0.25
        y = np.fft.irfft(F, L) * np.exp(-t * 6.9 / RT); y[:int(0.018 * SR)] = 0
        return y / np.sqrt((y ** 2).sum())
    Nn = 1 << int(np.ceil(np.log2(len(dry) + int(RT * 1.15 * SR))))
    X = np.fft.rfft(dry, Nn)
    wet = [np.fft.irfft(X * np.fft.rfft(ir(s), Nn), Nn)[:len(dry)] for s in (41, 42)]
    out = np.stack([dry * 0.8 + wet[0] * 0.42, dry * 0.8 + wet[1] * 0.42], 1)
    out *= 0.42 / np.percentile(np.abs(out), 99.95)
    out = np.tanh(out * 1.6) / 1.6 * 1.1
    return (out * 32767).astype('<i2')

here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
work = sys.argv[1] if len(sys.argv) > 1 else '/tmp'
for fn, title, make in [('orgel3', 'カノン', canon), ('orgel4', 'エリーゼのために', elise), ('orgel5', 'グリーンスリーブス', greensleeves), ('orgel6', '歓喜の歌', joy)]:
    notes, bpm, end, tot = make()
    pcm = render(notes, bpm, end, tot)
    wav = os.path.join(work, fn + '.wav')
    with wave.open(wav, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    mp3 = os.path.join(root, fn + '.mp3')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '96k',
                    '-metadata', f'title={title}', '-metadata', 'artist=名作のなかへ（オルゴール編曲）', mp3], check=True)
    print(fn, title, 'notes', len(notes), 'length %.1fs' % (len(pcm) / SR), os.path.getsize(mp3))
