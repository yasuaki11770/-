"""川村さんへの贈り物 ― 午後の書斎（gogo/）と同じ仕組みで作る、贈り物の書斎
   使い方: python3 okurimono/build_from_gogo.py
     gogo の engine.js・index.html・art.js（dokusho から gogo/build_from_dokusho.py で作ったもの）から、okurimono の3つを作る。
     gogo/build_from_dokusho.py を実行すると、最後にこのスクリプトも自動で実行される。
   books.js と ep_*.js は okurimono 独自。午後の書斎と同じ作品（REUSE）は、gogo の ep_*.js をそのまま読みこむ（中身は一つだけ） """
import os, re, glob, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G, O = os.path.join(ROOT, 'gogo'), os.path.join(ROOT, 'okurimono')
def rd(p): return open(os.path.join(G, p), encoding='utf-8').read()
def wr(p, s): open(os.path.join(O, p), 'w', encoding='utf-8').write(s)
def sub(s, a, b, n=None, regex=False):
    cnt = len(re.findall(a, s, re.S)) if regex else s.count(a)
    assert cnt >= 1 and (n is None or cnt == n), (cnt, a[:90])
    return re.sub(a, lambda m: b, s, flags=re.S) if regex else s.replace(a, b)

# 午後の書斎と同じ作品（gogo の ep を読みこむ）
REUSE = ['diewithzero', 'jinseifruits', 'kirawareru', 'perfectdays', 'kouhan', 'seneca', 'tooitaiko', 'greenbook', 'uchuukyoudai', 'nomadland']
TITLE = '川村さんへの贈り物'
N = len(re.findall(r'^(?:window\.BOOKS=\[)?\["', open(os.path.join(O, 'books.js'), encoding='utf-8').read(), re.M))   # 作品の数（books.js の行）

# ---------------- engine.js ----------------
e = rd('engine.js')
e = sub(e, "/* 午後の書斎 ― 進行エンジン（名作のなかへ の仕組みを、大人向けの別サイトに作りかえたもの。gogo/build_from_dokusho.py で生成）",
        "/* 川村さんへの贈り物 ― 進行エンジン（午後の書斎 と同じ仕組み。okurimono/build_from_gogo.py で生成）")
for a, b in [("'gogo_rec'", "'okuri_rec'"), ("'gogo_own'", "'okuri_own'"), ("'gogo_view'", "'okuri_view'"), ("'gogo_cover'", "'okuri_cover'"), ("'gogo_bk'", "'okuri_bk'"),
             ("indexedDB.open('gogo', 1)", "indexedDB.open('okurimono', 1)"),
             ("{app: 'gogo-no-shosai',", "{app: 'okurimono',"), ("name = `gogo-kiroku-${d}.json`", "name = `okurimono-kiroku-${d}.json`"),
             ("data.app !== 'gogo-no-shosai'", "data.app !== 'okurimono'"), ("「午後の書斎」の記録ファイル", f"「{TITLE}」の記録ファイル"),
             ("artist: '午後の書斎', album: '書斎のオルゴール'", f"artist: '{TITLE}', album: '書斎のオルゴール'"),
             ("src: 'orgel2.mp3?v=1'", "src: '../dokusho/orgel2.mp3?v=1'"), ("src: 'orgel.mp3?v=1'", "src: '../dokusho/orgel.mp3?v=1'"),
             ("/* 名作のなかへ では adult.js で大人向けに整えていた。午後の書斎は、はじめから大人向けに書いているので使わない */", "/* 大人向けに書いているので、adult.js は使わない */")]:
    e = sub(e, a, b)
# 節目：10作ごと
e = sub(e, "  for (let x = 5; x < T; x += 5) a.push(x);", "  for (let x = 10; x < T; x += 10) a.push(x);")
e = sub(e, r"function msMessage\(n\) \{.*?\n\}", """function msMessage(n) {
  const T = BOOKS.length;
  if (n >= T) return `……${T}作、すべてに栞が挟まりました。<br>五十七歳の一年に、五十七の人生を通りぬけてきたことになります。ここに並んでいるのは、もう、誰かからの贈り物ではありません。<b>あなたが自分の手で選び、走りぬけてきた${T}作</b>です。最後の栞は、金の地に、書斎の紋を入れておきました。`;
  if (n === 10) return '十作目の栞ですね。……十の人生を通ってきた人の顔に、少しなってきました。<b>ここからの栞は、若葉の色になります。</b>';
  if (n === 20) return '二十作目。……作品と作品が、頭の中でつながりはじめるころです。ある映画の場面が、別の本の一行を思い出させる。<b>ここからの栞は、藍の色になります。</b>';
  if (n === 30) return '三十作目。……ここまで来ると、栞の言葉が、そのまま、あなたの言葉になってきます。<b>ここからの栞は、金の色になります。</b>';
  if (n === 40) return '四十作目。……どの棚にも、あなたの栞が光っています。<b>ここからの栞は、星空の色になります。</b>';
  if (n === 50) return '五十作目。……ここまで来た人は、そう多くありません。最後の棚まで、あと少しです。';
  return `${n}作目の栞です。……よく、ここまで来ましたね。`;
}""", regex=True)
# 本棚：四つの棚に分けて並べる（リスト順のとき）。詩集はないので、絞りこみは「漫画」だけにする
e = sub(e, "  const key = VIEW.sort === 'aiu' ? gyoOf : null;",
        "  const themeOf = b => { let t = null; (window.THEMES || []).forEach(x => { if (+b[3] >= x[0]) t = x[1]; }); return t; };\n"
        "  const key = VIEW.sort === 'aiu' ? gyoOf : VIEW.sort === 'no' ? themeOf : null;")
e = sub(e, "    ['other', '漫画・詩', b => /漫画|詩集/.test(b[2])],", "    ['other', '漫画', b => /漫画/.test(b[2])],")
e = sub(e, "if ((VIEW.v || 0) < 2) { VIEW.sort = 'aiu'; VIEW.v = 2; }   // 並びの初期値を「あいうえお順」に切りかえた",
        "if ((VIEW.v || 0) < 2) { VIEW.sort = 'no'; VIEW.v = 2; }   // はじめは、四つの棚の順で")
e = sub(e, "['no', 'リスト順', null],", "['no', '棚の順', null],")
# 本棚のことば
e = sub(e, r"\} else msg = 'いらっしゃいませ。夜更けの書斎へ、ようこそ。.*?';\n",
        f"}} else msg = 'いらっしゃいませ。夜更けの書斎へ、ようこそ。マスターです。<br>ここには、<b>五十七歳を迎えるあなたに贈りたい、{N}の作品</b>を、四つの棚に置いています。週に一作あまりのペースで、ちょうど一年。五十七歳の一年に、五十七の物語を。時間とお金のこと、心の持ち方、自分の店をひらくこと、そして、オートバイと旅。<b>読まなくても、観なくてもいい。中に入って、主人公になってみてください。</b>迷ったら、下の「次の一作」からどうぞ。';\n", regex=True)
e = sub(e, r"\$\('rackNote'\)\.innerHTML = '人生の午後に.*?';\n",
        f"$('rackNote').innerHTML = '五十七歳の一年に贈る{N}作を、四つの棚に並べました。古い時代の作品ほど、使いこまれた姿で並んでいます。映画は、ケースの姿で。<br>背表紙をタップすると、その作品のページが開きます。「持っている」「読んだ・観た」の記録や、表紙の写真の設定も、そこでできます。';\n", regex=True)
e = sub(e, "$('titleNote').textContent = `収録：${EPS.length}作（本・映画・漫画・詩集／1作 15〜25分）`;",
        "$('titleNote').textContent = `収録：${EPS.length}作（本・映画・漫画／1作 15〜25分）`;")
chk = e.split('\n', 2)[2]
assert '午後' not in chk and 'gogo' not in chk, [l for l in chk.split('\n') if '午後' in l or 'gogo' in l][:3]
wr('engine.js', e)

# ---------------- index.html ----------------
h = rd('index.html')
h = sub(h, '<title>午後の書斎</title>', f'<title>{TITLE}</title>')
h = sub(h, "--night:#1c1511;--night2:#2c2119;", "--night:#10191c;--night2:#1b282c;")
h = sub(h, "#4a3424 0%,var(--nigh", "#27424a 0%,var(--nigh")
h = sub(h, "body[data-world=lib] #play{background:radial-gradient(ellipse at 50% 0%,#4d3727 0%,var(--night) 75%);",
        "body[data-world=lib] #play{background:radial-gradient(ellipse at 50% 0%,#2a454c 0%,var(--night) 75%);")
h = sub(h, '<div class="kicker">人 生 の 午 後 に</div>\n  <h1>午後の<br>書斎</h1>\n  <div class="tag">読む前に、観る前に、入ってみる。</div>',
        '<div class="kicker">五 十 七 歳 の 一 年 に</div>\n  <h1>川村さんへの<br>贈り物</h1>\n  <div class="tag">走る人へ。つくる人へ。迎える人へ。</div>')
h = sub(h, r'<p class="lead">本や映画の主人公になって.*?</p>',
        '<p class="lead">五十七の物語を、四つの棚に。<br>本や映画の主人公になって、名場面を生きてみる。<br>幕が下りたら、夜更けの書斎のマスターが<br>その作品を選んだわけを語り、ひとつだけ問いかける。<br>――次の章を、あなたはどう走りますか。</p>', regex=True)
h = sub(h, '<div><h2>午後の書斎</h2>', f'<div><h2>{TITLE}</h2>')
h = sub(h, '持っている <b id="ownc">0</b> / 15</div>', f'持っている <b id="ownc">0</b> / {N}</div>')
h = sub(h, '<h3 class="shelfh">人生の午後の15作</h3>', f'<h3 class="shelfh">五十七歳に贈る、{N}作</h3>')
h = sub(h, '<span><span class="bd bd-j">本</span> 本・小説・古典</span><span><span class="bd bd-h">映</span> 映画</span><span><span class="bd bd-both">漫</span> 漫画・詩集</span>',
        '<span><span class="bd bd-j">本</span> 本・小説・古典</span><span><span class="bd bd-h">映</span> 映画</span><span><span class="bd bd-both">漫</span> 漫画</span>')
h = sub(h, "/* 午後の書斎：映画は、ディスクのケースの姿で */", "/* 映画は、ディスクのケースの姿で */")
h = sub(h, ".shead h2{font-family:var(--mincho);font-size:26px;letter-spacing:.06em}",
        ".shead h2{font-family:var(--mincho);font-size:min(22px,5.6vw);letter-spacing:.02em;white-space:nowrap}\n.count{white-space:nowrap}")   # 題が長いので1行に
# 作品の script：books.js のあとに、gogo と共通の作品（../gogo/）と、okurimono の作品
v = time.strftime('%y%m%d%H%M')
h = sub(h, r'<script src="ep_[^"]*"></script>\n', '', regex=True)
own = sorted(os.path.basename(f) for f in glob.glob(os.path.join(O, 'ep_*.js')))
tags = ''.join(f'<script src="../gogo/ep_{x}.js?v={v}"></script>\n' for x in REUSE) + ''.join(f'<script src="{x}?v={v}"></script>\n' for x in own)
h = re.sub(r'(<script src="books\.js)[^"]*("></script>\n)', lambda m: m.group(1) + '?v=' + v + m.group(2) + tags, h)
h = re.sub(r'\?v=\d+"', f'?v={v}"', h)
assert '午後' not in h, [l for l in h.split('\n') if '午後' in l][:3]
wr('index.html', h)

# ---------------- art.js（表紙の絵）：モチーフを足して、作品の絵を描く ----------------
a = rd('art.js')
a = sub(a, "/* 午後の書斎 ― 表紙の絵（名作のなかへ の絵の仕組みに、モチーフを足したもの）", f"/* {TITLE} ― 表紙の絵（名作のなかへ・午後の書斎 の絵の仕組みに、モチーフを足したもの）")
a = sub(a, "  /* 午後の書斎で足したモチーフ */", "  /* 午後の書斎・贈り物の書斎で足したモチーフ */")
a = sub(a, "  shadow: () =>", """  swing: i => `<path d="M14 96L26 14H74L86 96" stroke="${i}" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M20 14H80" stroke="${i}" stroke-width="5"/><path d="M42 16V70M58 16V70" stroke="${i}" stroke-width="1.6"/><rect x="38" y="70" width="24" height="5" rx="1.5" fill="${i}"/>`,
  ramen: i => `<path d="M10 50H90Q88 86 50 88Q12 86 10 50Z" fill="${C.R}"/><path d="M14 58H86" stroke="${C.W}" stroke-width="2.5" opacity=".7"/><ellipse cx="50" cy="50" rx="40" ry="8" fill="#e8c070"/><path d="M24 50Q34 44 44 50T64 50T80 48" stroke="#f8e8b0" stroke-width="3" fill="none"/><circle cx="40" cy="48" r="6" fill="#f4f0e0"/><circle cx="40" cy="48" r="2.6" fill="${C.Y}"/><rect x="58" y="44" width="12" height="7" rx="2" fill="#a0502a"/><path d="M64 14L44 46M72 16L52 46" stroke="${C.N}" stroke-width="3" stroke-linecap="round"/><path d="M36 30Q32 22 36 14M50 32Q46 22 50 12" stroke="${C.W}" stroke-width="2" fill="none" opacity=".6"/>`,
  baseball: () => `<circle cx="50" cy="50" r="30" fill="${C.W}"/><path d="M30 28Q42 50 30 72M70 28Q58 50 70 72" stroke="${C.R}" stroke-width="2.5" fill="none"/><path d="M33 34L38 33M35 42L40 42M35 50L40 50M35 58L40 58M33 66L38 67M67 34L62 33M65 42L60 42M65 50L60 50M65 58L60 58M67 66L62 67" stroke="${C.R}" stroke-width="1.6"/>`,
  palace: i => `<rect x="10" y="50" width="80" height="44" fill="${i}"/><path d="M24 50Q24 37 32 31Q40 37 40 50Z" fill="${i}"/><path d="M60 50Q60 37 68 31Q76 37 76 50Z" fill="${i}"/><path d="M37 50Q37 27 50 18Q63 27 63 50Z" fill="${i}"/><circle cx="50" cy="15" r="2.2" fill="${C.A}"/><circle cx="32" cy="28" r="1.6" fill="${C.A}"/><circle cx="68" cy="28" r="1.6" fill="${C.A}"/><path d="M20 94V75Q20 65 28 63Q36 65 36 75V94Z" fill="${C.A}" opacity=".85"/><path d="M42 94V71Q42 61 50 59Q58 61 58 71V94Z" fill="${C.A}" opacity=".85"/><path d="M64 94V75Q64 65 72 63Q80 65 80 75V94Z" fill="${C.A}" opacity=".85"/>`,
  pagoda: i => `<path d="M50 4V20" stroke="${i}" stroke-width="2.5"/><circle cx="50" cy="8" r="2.5" fill="${C.A}"/><path d="M26 26H74L84 33H16Z" fill="${i}"/><rect x="38" y="33" width="24" height="13" fill="${i}" opacity=".75"/><path d="M22 50H78L88 57H12Z" fill="${i}"/><rect x="35" y="57" width="30" height="14" fill="${i}" opacity=".75"/><path d="M18 75H82L92 82H8Z" fill="${i}"/><rect x="32" y="82" width="36" height="16" fill="${i}" opacity=".75"/><rect x="46" y="86" width="8" height="12" fill="${C.A}" opacity=".8"/>`,
  moto: i => `<circle cx="20" cy="70" r="15" fill="none" stroke="${C.K}" stroke-width="6"/><circle cx="80" cy="70" r="15" fill="none" stroke="${C.K}" stroke-width="6"/><circle cx="20" cy="70" r="3" fill="${C.W}"/><circle cx="80" cy="70" r="3" fill="${C.W}"/><path d="M20 70L30 50H64L80 70M68 32L80 70" stroke="${i}" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M40 50Q42 38 56 38Q64 40 64 50Z" fill="${i}"/><path d="M22 46H42L40 51H24Z" fill="${C.K}"/><rect x="40" y="52" width="18" height="13" rx="3" fill="#9a9a9a"/><path d="M44 65Q30 72 12 66" stroke="#c0c0c0" stroke-width="3.5" fill="none"/><path d="M62 32H74" stroke="${C.K}" stroke-width="3.5" stroke-linecap="round"/><circle cx="72" cy="42" r="3.5" fill="${C.A}"/>`,
  truck: i => `<path d="M4 76V34Q4 28 10 28H64V76Z" fill="${C.W}"/><path d="M64 42H80Q86 44 90 54L96 60V76H64Z" fill="${i}"/><path d="M68 46H80Q84 48 86 56H68Z" fill="${C.B}" opacity=".7"/><rect x="12" y="40" width="40" height="18" rx="2" fill="${C.K}" opacity=".75"/><path d="M8 34H58L54 40H12Z" fill="${C.R}"/><path d="M12 58H52V62H12Z" fill="${i}"/><circle cx="22" cy="78" r="9" fill="${C.K}"/><circle cx="78" cy="78" r="9" fill="${C.K}"/><circle cx="22" cy="78" r="3.5" fill="${C.W}"/><circle cx="78" cy="78" r="3.5" fill="${C.W}"/>`,
  bread: () => `<path d="M10 66Q8 40 34 36Q50 30 66 36Q92 40 90 66Q90 76 80 76H20Q10 76 10 66Z" fill="#d89a52"/><path d="M10 62Q10 46 30 42Q50 36 70 42Q90 46 90 62" fill="none" stroke="#b9772f" stroke-width="2"/><path d="M30 46L38 58M46 42L54 56M62 44L70 58" stroke="#f3d29a" stroke-width="4" stroke-linecap="round"/>`,
  bento: i => `<rect x="10" y="30" width="80" height="50" rx="6" fill="${i}"/><rect x="15" y="35" width="70" height="40" rx="3" fill="${C.W}"/><path d="M50 35V75M50 55H85" stroke="${i}" stroke-width="3"/><circle cx="26" cy="50" r="5" fill="${C.R}"/><circle cx="38" cy="58" r="6" fill="${C.Y}"/><circle cx="28" cy="66" r="5" fill="${C.G}"/><path d="M56 42H80M56 48H76" stroke="${C.N}" stroke-width="3"/><rect x="56" y="60" width="24" height="10" rx="3" fill="${C.F}"/><path d="M6 84H94" stroke="${C.K}" stroke-width="3" opacity=".4"/>`,
  mower: i => `<rect x="44" y="50" width="34" height="18" rx="4" fill="${C.G}"/><path d="M50 50V36H60" stroke="${C.K}" stroke-width="4" fill="none"/><rect x="56" y="40" width="14" height="10" fill="${C.Y}"/><circle cx="50" cy="72" r="8" fill="${C.K}"/><circle cx="76" cy="72" r="6" fill="${C.K}"/><path d="M44 62H32" stroke="${C.K}" stroke-width="3"/><rect x="6" y="52" width="26" height="16" rx="2" fill="${i}"/><circle cx="19" cy="72" r="6" fill="${C.K}"/>`,
  cheese: () => `<path d="M8 70L60 30L92 54V76H8Z" fill="${C.Y}"/><path d="M8 70H92V76H8Z" fill="#e0b53a"/><path d="M60 30L92 54H8Z" fill="#f7e07a"/><circle cx="34" cy="64" r="5" fill="#e0b53a"/><circle cx="62" cy="62" r="7" fill="#e0b53a"/><circle cx="80" cy="68" r="3.5" fill="#e0b53a"/><circle cx="50" cy="48" r="3" fill="#e0b53a"/>`,
  elephant: i => `<ellipse cx="54" cy="56" rx="30" ry="22" fill="${i}"/><circle cx="26" cy="46" r="16" fill="${i}"/><path d="M14 52Q8 70 16 82" stroke="${i}" stroke-width="8" fill="none" stroke-linecap="round"/><ellipse cx="34" cy="44" rx="10" ry="14" fill="${i}" opacity=".7"/><circle cx="22" cy="42" r="2.5" fill="${C.K}"/><rect x="32" y="70" width="10" height="18" fill="${i}"/><rect x="66" y="70" width="10" height="18" fill="${i}"/><path d="M18 32Q26 22 34 32" stroke="${C.A}" stroke-width="3" fill="none"/>`,
  balloons: () => rng(9, k => { const x = 26 + (k % 5) * 12 + (k > 4 ? 6 : 0), y = 20 + (k > 4 ? 14 : 0) + (k % 2) * 4, c = [C.R, C.Y, C.B, C.G, C.P, C.F, C.V, C.A, C.R][k]; return `<path d="M${x} ${y + 8}L50 80" stroke="${C.W}" stroke-width=".8" opacity=".8"/><ellipse cx="${x}" cy="${y}" rx="7" ry="8.5" fill="${c}"/>`; }),
  mug: i => `<path d="M24 44H70V80Q70 88 62 88H32Q24 88 24 80Z" fill="${i}"/><path d="M70 52Q86 52 84 64Q82 74 70 72" stroke="${i}" stroke-width="6" fill="none"/><ellipse cx="47" cy="44" rx="23" ry="5" fill="#5a3418"/><path d="M38 34Q32 26 38 18M50 34Q44 24 50 14M62 34Q56 26 62 18" stroke="${C.W}" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>`,
  onigiri: () => `<path d="M50 18Q62 18 76 50Q86 72 72 78H28Q14 72 24 50Q38 18 50 18Z" fill="${C.W}"/><rect x="34" y="56" width="32" height="22" fill="#1e2a20"/>`,
  bus: i => `<rect x="6" y="30" width="88" height="44" rx="8" fill="${i}"/><rect x="12" y="36" width="16" height="14" rx="2" fill="${C.W}" opacity=".8"/><rect x="32" y="36" width="16" height="14" rx="2" fill="${C.W}" opacity=".8"/><rect x="52" y="36" width="16" height="14" rx="2" fill="${C.W}" opacity=".8"/><rect x="72" y="36" width="16" height="22" rx="2" fill="${C.W}" opacity=".8"/><path d="M6 60H70" stroke="${C.W}" stroke-width="3" opacity=".6"/><path d="M20 22H70L74 30H16Z" fill="${C.N}"/><circle cx="24" cy="76" r="8" fill="${C.K}"/><circle cx="74" cy="76" r="8" fill="${C.K}"/>`,
  wrench: i => `<path d="M30 80L64 40" stroke="${i}" stroke-width="9" stroke-linecap="round"/><path d="M60 26Q70 16 82 22L72 32L76 38L86 30Q90 42 80 50Q72 54 64 48Z" fill="${i}"/><circle cx="30" cy="80" r="3" fill="${C.K}"/>`,
  chopper: i => `<circle cx="16" cy="72" r="14" fill="none" stroke="${C.K}" stroke-width="5"/><circle cx="88" cy="74" r="12" fill="none" stroke="${C.K}" stroke-width="3"/><path d="M16 72L28 56H56L64 36M16 72H40L56 56" stroke="#c8c8c8" stroke-width="3" fill="none"/><path d="M62 32L88 74" stroke="#e0e0e0" stroke-width="3"/><path d="M60 16L58 34M56 16H68" stroke="#e0e0e0" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M36 48Q40 39 54 41Q61 45 57 54H37Z" fill="${C.B}"/><path d="M37 50H57M37 53H57" stroke="${C.R}" stroke-width="1.8"/><path d="M38 51.5H57" stroke="${C.W}" stroke-width="1.2"/><circle cx="44" cy="45" r="1.4" fill="${C.W}"/><circle cx="49" cy="44" r="1.4" fill="${C.W}"/><circle cx="54" cy="45" r="1.4" fill="${C.W}"/><path d="M22 54L18 28" stroke="#e0e0e0" stroke-width="3"/><path d="M24 54H34" stroke="${C.K}" stroke-width="4"/><rect x="30" y="58" width="16" height="10" rx="2" fill="#9a9a9a"/>`,
  aurora: () => `<path d="M0 30Q25 10 50 26T100 22V44Q75 30 50 46T0 48Z" fill="${C.G}" opacity=".45"/><path d="M0 46Q30 30 55 44T100 40V54Q70 46 50 58T0 60Z" fill="#7be0b0" opacity=".3"/>`,
  shadow: () =>""")
a = sub(a, re.search(r"const ART = \{.*?\n\};", a, re.S).group(0), """const ART = {
  ikiru: 'snow; swing 50 104 60', tokyo: 'sun 74 30 24; sea; boat 40 104 40; house 72 98 28', akahige: 'jroofs 50 90 72; lantern 26 120 26',
  rongo: 'bamboo 18 92 44; scroll 54 100 62', intouchables: 'cloud 72 34 34; city; wheel 46 110 50', cinemaparadiso: 'stars; wheel 32 96 42; wheel 68 96 42; star 50 40 16',
  tampopo: 'sun 74 30 24; ramen 50 104 60', babette: 'sea; candles 28 108 30; cup 66 106 42', casablanca: 'stars; palm 22 92 50; plane 66 48 36; lamp 70 116 30',
  hinonagori: 'sunset 50 66 70; greenhills; car 50 116 50', fordferrari: 'road; flag 74 40 30; car 50 112 60', ichigo: 'greenhills; clock 72 36 28; redflower 30 118 22; redflower 52 124 20',
  onanysunday: 'sunset 50 60 66; dunes; moto 34 110 40; moto 70 118 36', fieldofdreams: 'sunset 50 56 60; wheat 16 104 40; wheat 84 104 40; baseball 50 108 36',
  kouhan: 'sunset 46 84 72; road; hills', seneca: 'columns 50 70 72; hourglass 50 120 32', tooitaiko: 'sun 74 28 30; sea; taiko 44 96 56',
  greenbook: 'road; hills; car 48 100 66; notes 74 40 30', uchuukyoudai: 'stars; moon 24 26 28; rocket 50 90 70', nomadland: 'stars; dunes; van 48 100 64',
  ikigai: 'sun 72 30 26; sea; seedling 50 104 46', care: 'hands 50 100 60; seedling 50 64 30', alchemist: 'dunes; sun 72 30 26; camel 46 104 52; star 24 30 14',
  nariwai: 'greenhills; house 46 96 54; seedling 78 120 24', kinoinochi: 'mount 50 70 90; pagoda 50 102 64', shokugyou: 'moon 74 28 24; notes 30 46 30; mug 44 112 40; book 70 116 30',
  coffeeya: 'lamp 74 44 34; mug 46 106 58', charley: 'road; hills; van 48 102 60; dog 80 122 24',
  diewithzero: 'sunset 50 52 60; hourglass 46 106 52', teinengo: 'sunset 50 60 66; road; chair 50 112 40', lifeshift: 'stars; hourglass 30 96 34; road; seedling 70 110 34',
  myintern: 'city; tower 50 92 60', schmidt: 'road; hills; van 48 100 64', lunchbox: 'city; bento 50 98 58; letter 70 54 26',
  bucketlist: 'mount 50 90 90; star 30 30 16; plane 64 40 32', jinseifruits: 'greenhills; gtree 36 86 56; cabin 72 104 34; apple 62 64 18',
  kirawareru: 'hills; bird 44 64 54; cloud 70 36 40', shiawaseyuuki: 'sun 70 30 26; greenhills; hands 50 98 52', yumezou: 'stars; elephant 50 96 64',
  cheese: 'ground; cheese 50 100 60', kimitachi: 'city; stars; star 72 30 18; book 46 106 44', morrie: 'window; flower 50 104 46',
  wonderfullife: 'snow; house 50 96 66; bell 76 38 22', perfectdays: 'komorebi; gtree 50 74 72; camera 46 118 36', grantorino: 'house 34 86 44; car 56 112 62',
  marigold: 'sun 50 40 30; palace 50 94 70; redflower 22 120 22; redflower 80 120 22', jibunnoshigoto: 'ground; hands 50 96 60; seedling 50 64 30',
  sukinakoto: 'sun 76 28 26; rocket 46 96 60', chef: 'sun 24 30 22; road; truck 50 118 60', shiawasepan: 'sea; greenhills; cabin 36 90 38; bread 62 116 44',
  kamome: 'sea; bird 72 36 26; onigiri 46 104 54', mallory: 'hills; house 50 86 54; flower 24 120 20; flower 78 120 20', bagdadcafe: 'sunset 50 60 66; dunes; mug 50 108 44',
  kazenouta: 'sea; moon 74 28 24; bottle 46 104 54', stationagent: 'gtree 22 76 48; train 50 106 60', localhero: 'stars; aurora; sea; boat 50 112 40',
  zenmoto: 'mount 50 76 90; road; wrench 50 114 38', indian: 'dunes; sun 72 30 30; moto 50 106 64', jupiter: 'globe 50 60 56; road; moto 50 120 40',
  longway: 'globe 50 52 52; moto 34 112 38; moto 68 118 38', motodiaries: 'mount 50 72 90; road; moto 50 114 48', easyrider: 'sunset 50 64 70; road; chopper 50 112 60',
  kanojonoshima: 'sea; sun 70 34 26; moto 46 108 52', oneweek: 'fir 20 84 42; fir 82 84 42; road; moto 50 116 42', greatescape: 'fence; mount 50 60 70; moto 50 112 46',
  shinyatokkyu: 'dunes; sunset 50 56 60; bus 50 106 58', tabiwosuruki: 'stars; aurora; snow; fir 50 100 56', straightstory: 'greenhills; road; mower 50 112 56',
  wildhogs: 'dunes; sun 70 30 26; moto 30 108 36; moto 70 116 36', lastvegas: 'stars; city; star 50 40 26', up: 'cloud 24 40 30; balloons 50 50 80; house 50 108 44',
};""")
wr('art.js', a)
print(f'okurimono: engine.js, index.html, art.js を作りました（{N}作・gogo と共通 {len(REUSE)}作・独自 {len(own)}作）')
