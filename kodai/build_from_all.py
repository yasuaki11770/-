"""古代図書館 ― 三つのサイト（名作のなかへ・午後の書斎・川村さんへの贈り物）を、一つの図書館にまとめる
   使い方: python3 kodai/build_from_all.py
     （okurimono/build_from_gogo.py の最後でも自動で実行される。dokusho → gogo → okurimono → kodai の順に作りなおされる）
   ・仕組み（engine.js・index.html・art.js）は、贈り物のものをもとに作る。案内役は、作品ごとに ミネル先生 か マスター に切りかわる
   ・物語（ep_*.js）は複製せず、三つのフォルダのものを、そのまま読みこむ（あちらを直せば、こちらにも反映される）
   ・books.js は、三つの books.js から作る（名作のなかへ の行は、作品の種類・長さの記号を、こちらの形に直す）
   ・同じ題名の作品は一つだけ（『君たちはどう生きるか』は、大人向けに書いた贈り物の版を使う） """
import os, re, json, glob, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D, G, O, K = (os.path.join(ROOT, x) for x in ('dokusho', 'gogo', 'okurimono', 'kodai'))
def rd(d, p): return open(os.path.join(d, p), encoding='utf-8').read()
def wr(p, s): open(os.path.join(K, p), 'w', encoding='utf-8').write(s)
def sub(s, a, b, n=None, regex=False):
    cnt = len(re.findall(a, s, re.S)) if regex else s.count(a)
    assert cnt >= 1 and (n is None or cnt == n), (cnt, a[:90])
    return re.sub(a, lambda m: b, s, flags=re.S) if regex else s.replace(a, b)
def rows(d):
    return [json.loads(m) for m in re.findall(r'^(?:window\.BOOKS=\[)?(\[.*?\])[,\]];?$', rd(d, 'books.js'), re.M)]
def jsvar(d, name):
    m = re.search(r'window\.' + name + r'=(\[.*?\]|\{.*?\});', rd(d, 'books.js'), re.S)
    return json.loads(m.group(1).replace("'", '"')) if m else None
KAN = lambda n: ('' if n < 20 else '一二三四五六七八九'[n // 10 - 1]) + ('十' if n >= 10 else '') + ('' if n % 10 == 0 else '一二三四五六七八九'[n % 10 - 1])
def kanji(n): return (KAN(n // 100) if n // 100 > 1 else '') + ('百' if n >= 100 else '') + (KAN(n % 100) if n % 100 else '')

# ---------------- books.js ----------------
dr, gr, orr = rows(D), rows(G), rows(O)
otitles = {r[0] for r in orr}
# 名作のなかへ の長さの記号：こちらの記号とぶつかるもの（E・N・D）を付けかえる
DLEN = {'E': 'E2', 'N': 'NF', 'D': 'DR'}
LEN = {"K": "薄い一冊", "B": "本・1冊", "E": "エッセイ・1冊", "N": "長編・1冊", "C": "長いシリーズ", "F": "映画・約2時間", "D": "記録映画・約1時間半", "G": "映画・約3時間",
       "S": "短編・1時間以内", "M": "中編・1〜3時間", "L": "長編・文庫1冊", "L2": "長編・文庫2〜3冊", "XL": "大長編・文庫4冊以上", "P": "詩集・少しずつ読める",
       "E2": "随筆・論集・少しずつ読める", "NF": "ノンフィクション・1冊", "DR": "戯曲・2時間ほど"}
groups = []   # [棚の名前, 行のリスト]
dgrp = {'中日': 'ミネル先生の棚　一　日本の名作', '中海': 'ミネル先生の棚　二　世界の名作', '高': 'ミネル先生の棚　三　もっと深く'}
for key, name in dgrp.items():
    g = []
    for r in dr:
        if r[0] in otitles: continue                      # 同じ題名は、贈り物の版を使う
        if re.match(r'(中日|中海|高)', str(r[3])).group(1) != key: continue
        g.append([r[0], r[1], '詩集' if r[6] == 'P' else '本', '0', r[4], r[5], DLEN.get(r[6], r[6])] + r[7:])
    groups.append([name, g])
groups.append(['マスターの書斎　人生の午後に', [r[:3] + ['0'] + r[4:] for r in gr if r[0] not in otitles]])
oth = jsvar(O, 'THEMES')
starts = [t[0] for t in oth] + [len(orr) + 1]
for i, (s0, name) in enumerate(oth):
    groups.append(['贈り物の棚　' + name.replace('の棚　', '　', 1), orr[s0 - 1:starts[i + 1] - 1]])
out, themes = [], []
for name, g in groups:
    themes.append([len(out) + 1, name])
    for r in g:
        r = list(r); r[3] = str(len(out) + 1); out.append(r)
assert len({r[0] for r in out}) == len(out), 'title duplicate'
N = len(out)
chosen = sorted(set((jsvar(G, 'CHOSEN') or []) + (jsvar(O, 'CHOSEN') or [])))
wr('books.js', f'// 古代図書館 ― 三つのサイトの{N}作（名作のなかへ・午後の書斎・川村さんへの贈り物）。kodai/build_from_all.py で生成（直接は直さない）\n'
   '// [題名, 作者・監督, 種類, 番号, 年(並べ替え用), 年の表示, 長さ, おすすめ, 入りやすさ, 有名度, 学び度, 見終わったあとの感じ(1さわやか〜5ずっしり), よみ]\n'
   f'window.BOOK_LEN={json.dumps(LEN, ensure_ascii=False)};\n'
   f'window.THEMES={json.dumps(themes, ensure_ascii=False)};\n'
   f'window.CHOSEN={json.dumps(chosen, ensure_ascii=False)};\n'
   'window.BOOKS=[' + ',\n'.join(json.dumps(r, ensure_ascii=False, separators=(',', ':')) for r in out) + '];\n')

# ---------------- engine.js ----------------
e = rd(O, 'engine.js')
owl_m = re.search(r"const OWL = (`<svg.*?</svg>`);", rd(D, 'engine.js'), re.S).group(1)
span_m = re.search(r"const WHY_SPAN = (a => .*?);\n", rd(D, 'engine.js')).group(1)
e = sub(e, "/* 川村さんへの贈り物 ― 進行エンジン（午後の書斎 と同じ仕組み。okurimono/build_from_gogo.py で生成）",
        "/* 古代図書館 ― 進行エンジン（贈り物の仕組みに、案内役の切りかえを足したもの。kodai/build_from_all.py で生成）\n"
        "   案内役：名作のなかへ の作品は ミネル先生、午後の書斎・贈り物の作品は マスター（ep.guide。index.html で読みこむときに付ける）")
for a, b in [("'okuri_rec'", "'kodai_rec'"), ("'okuri_own'", "'kodai_own'"), ("'okuri_view'", "'kodai_view'"), ("'okuri_cover'", "'kodai_cover'"), ("'okuri_bk'", "'kodai_bk'"),
             ("indexedDB.open('okurimono', 1)", "indexedDB.open('kodai', 1)"), ("app: 'okurimono'", "app: 'kodai'"), ("data.app !== 'okurimono'", "data.app !== 'kodai'"),
             ("「川村さんへの贈り物」の記録ファイル", "「古代図書館」の記録ファイル"), ("artist: '川村さんへの贈り物'", "artist: '古代図書館'")]:
    e = sub(e, a, b)
# はじめて開いたときは、三つのサイトの記録（同じブラウザに残っているもの）を引きつぐ
e = sub(e, "try { REC = JSON.parse(localStorage.getItem('kodai_rec') || '{}') || {}; } catch (e) {}\n",
        "try { REC = JSON.parse(localStorage.getItem('kodai_rec') || '{}') || {}; } catch (e) {}\n"
        "/* 古代図書館：まだ記録がないうちは、同じブラウザに残っている三つのサイトの記録を引きつぐ（名作のなかへ の『君たちはどう生きるか』は別の版なので除く） */\n"
        "if (localStorage.getItem('kodai_rec') === null) for (const k of ['yrt_rec2', 'gogo_rec', 'okuri_rec']) {\n"
        "  try { const o = JSON.parse(localStorage.getItem(k) || '{}') || {}; for (const id in o) if (o[id] && !(k === 'yrt_rec2' && id === 'kimitachi') && (!REC[id] || (!REC[id].date && o[id].date))) REC[id] = o[id]; } catch (e) {}\n"
        "}\n")
e = sub(e, "try { OWN = JSON.parse(localStorage.getItem('kodai_own') || '{}') || {}; } catch (e) {}\n",
        "try { OWN = JSON.parse(localStorage.getItem('kodai_own') || '{}') || {}; } catch (e) {}\n"
        "if (localStorage.getItem('kodai_own') === null) for (const k of ['yrt_own', 'gogo_own', 'okuri_own']) { try { Object.assign(OWN, JSON.parse(localStorage.getItem(k) || '{}') || {}); } catch (e) {} }\n")
# 案内役：ミネル先生（名作のなかへ）とマスター（午後の書斎・贈り物）
e = sub(e, "const A = s => (window.adult ? window.adult(s) : s);",
        "let GD = '';   // いま開いている作品の案内役（startEp・openBook・cardText で切りかえる）\n"
        "const A = s => (window.adult && GD === 'ミネル' ? window.adult(s) : s);   // 大人向けの言いかえ（adult.js）は、ミネル先生の言葉にだけ")
e = sub(e, "const OWL = `", "const OWL_M = " + owl_m + ";   // ミネル先生（名作のなかへ）\nconst OWL = `", n=1)
e = sub(e, "\n/* ---------- 名作のわけ・問いかけのシーンを", "\nconst GUIDES = {'ミネル': {icon: OWL_M, name: 'ミネル先生'}, 'マスター': {icon: OWL, name: 'マスター'}};\n\n/* ---------- 名作のわけ・問いかけのシーンを")
e = sub(e, "  else if (who === TEACHER) d.className = 'ln teach', d.innerHTML = `${OWL}<span class=\"tx\"><span class=\"who\">マスター</span>${fmt(A(text))}</span>`;",
        "  else if (GUIDES[who]) d.className = 'ln teach', d.innerHTML = `${GUIDES[who].icon}<span class=\"tx\"><span class=\"who\">${GUIDES[who].name}</span>${fmt(who === 'ミネル' && window.adult ? window.adult(text) : text)}</span>`;")
e = sub(e, "  EP = ep; buildTalk(ep);", "  EP = ep; GD = ep.guide || 'マスター'; TEACHER = GD; buildTalk(ep);")
e = sub(e, "function openBook(ep, justDone) {\n", "function openBook(ep, justDone) {\n  GD = ep.guide || 'マスター';\n")
e = sub(e, "function cardText(ep, r) { return", "function cardText(ep, r) { GD = ep.guide || 'マスター'; return")
# 名作のわけ・問いかけの言葉も、案内役ごとに
e = sub(e, "const isChosen = ep =>", "const WHY_SPAN_M = " + span_m + ";   // ミネル先生の言い方\nconst isChosen = ep =>")
m = re.search(r"\[TEACHER, ep\.whyIntro \|\| \((isChosen\(ep\) \? 'おかえりなさい。.*?のか。`)\)\],", e)
e = e.replace(m.group(0), "[TEACHER, ep.whyIntro || (ep.guide === 'ミネル' ? (isChosen(ep) ? 'おかえり。……さて、本を閉じる前に、少しだけ話をさせておくれ。なぜ、今のあなたに、わしがこの本を選んだのか。' : `おかえり。……さて、本を閉じる前に、少しだけ話をさせておくれ。この本が、なぜ${WHY_SPAN_M(ageOf(ep))}のか。`) : (" + m.group(1) + "))],")
e = sub(e, "next:'resolve', nextLabel:'マスターの問いかけ ▶' };", "next:'resolve', nextLabel: ep.guide === 'ミネル' ? '先生の問いかけ ▶' : 'マスターの問いかけ ▶' };")
e = sub(e, "    ? 'では、ひとつだけ伺います。この作品から、あなたは何を持って帰りますか。'",
        "    ? (ep.guide === 'ミネル' ? 'では、わしから問いかけじゃ。本を閉じたあと、あなたは、この本から何を持って帰るかの。' : 'では、ひとつだけ伺います。この作品から、あなたは何を持って帰りますか。')")
e = sub(e, "['!', `『${ep.title}』から、\\nこれからの人生に持って帰りたいものは？`],",
        "['!', ep.guide === 'ミネル' ? `『${ep.title}』から学べることで、\\n改めたいことはないか？` : `『${ep.title}』から、\\nこれからの人生に持って帰りたいものは？`],")
e = sub(e, "[TEACHER, '栞に挟める言葉は、**ひとつだけ**にしましょう。",
        "[TEACHER, ep.guide === 'ミネル' ? 'ただし、栞にはさめる言葉は**ひとつだけ**じゃ。たくさんはさむと、どれも読み返さなくなるからの。いちばん胸に残ったものを、ひとつ選びなされ。' : '栞に挟める言葉は、**ひとつだけ**にしましょう。")
# 読むときの選択肢「なし」：導入の決まり文句を消す。ミネル先生の言い方（名作のなかへ）と、マスターの言い方の両方
ch_d = re.search(r"const CH_RE = \[\n(.*?)\n\];", rd(D, 'engine.js'), re.S).group(1)
e = sub(e, re.search(r"const CH_RE = \[\n.*?\n\];", e, re.S).group(0), "const CH_RE = [\n" + ch_d + "\n  [/もし[^。]*と違う道を選んだら、ページが波打ちます。そのときは、選び直してください。/, ''],\n];")
# 表紙：二人の案内役を並べる
e = sub(e, "$('titleOwl').innerHTML = OWL.replace('<svg', '<svg class=\"owl\"');",
        "$('titleOwl').innerHTML = OWL_M.replace('<svg', '<svg class=\"owl\"') + OWL.replace('<svg', '<svg class=\"owl\"');")
# 節目と、図書館のことば
e = sub(e, "  for (let x = 10; x < T; x += 10) a.push(x);", "  for (const x of [10, 30, 50, 100, 150, 200]) if (x < T) a.push(x);")
e = sub(e, r"function msMessage\(n\) \{.*?\n\}", """function msMessage(n) {
  const T = BOOKS.length;
  if (n >= T) return `……${T}の物語、すべてに栞が挟まりました。<br>この図書館の書庫を、端から端まで歩きとおしたことになります。最後の栞は、金の地に、図書館の紋を入れておきました。`;
  if (n === 10) return '十作目の栞です。……十の人生を通ってきた人の顔に、少しなってきました。<b>ここからの栞は、若葉の色になります。</b>';
  if (n === 30) return '三十作目。……作品と作品が、頭の中でつながりはじめるころです。<b>ここからの栞は、藍の色になります。</b>';
  if (n === 50) return '五十作目。……ミネル先生の棚とマスターの書斎を、行き来するのにも、慣れてきたころでしょう。<b>ここからの栞は、金の色になります。</b>';
  if (n === 100) return '百作目。……百の人生を通りぬけた人は、もう、立派な図書館の住人です。<b>ここからの栞は、星空の色になります。</b>';
  return `${n}作目の栞です。……よく、ここまで来ましたね。`;
}""", regex=True)
e = sub(e, r"\} else msg = 'いらっしゃいませ。夜更けの書斎へ、ようこそ。.*?';\n",
        f"}} else msg = 'ようこそ、古代図書館へ。<br>ここには、<b>{N}の物語</b>が眠っています。中高生のころに出会いたい名作は、フクロウの<b>ミネル先生</b>の棚に。人生の午後に味わいたい作品と、川村さんへの贈り物は、書斎の<b>マスター</b>の棚に。<b>読まなくても、観なくてもいい。中に入って、主人公になってみてください。</b>迷ったら、下の「次の一作」からどうぞ。';\n", regex=True)
e = sub(e, r"\$\('rackNote'\)\.innerHTML = '.*?';\n",
        f"$('rackNote').innerHTML = '{N}の物語を、八つの書庫に並べました。古い時代の作品ほど、使いこまれた姿で並んでいます。映画は、ケースの姿で。<br>背表紙をタップすると、その作品のページが開きます。「持っている」「読んだ・観た」の記録や、表紙の写真の設定も、そこでできます。';\n", regex=True)
e = sub(e, "収録：${EPS.length}作（本・映画・漫画／1作 15〜25分）", "収録：${EPS.length}作（本・映画・漫画・詩集／1作 15〜25分）")
e = sub(e, "    ['other', '漫画', b => /漫画/.test(b[2])],", "    ['other', '漫画・詩', b => /漫画|詩集/.test(b[2])],")
e = sub(e, "// はじめは、四つの棚の順で", "// はじめは、書庫の順で")
e = sub(e, "const LEN_RANK = {K: 1, P: 2, F: 2, D: 2, B: 3, E: 3, N: 4, C: 6};", "const LEN_RANK = {K: 1, S: 1, P: 2, F: 2, D: 2, M: 2, DR: 2, B: 3, E: 3, E2: 3, NF: 3, N: 4, L: 4, G: 4, L2: 5, C: 6, XL: 6};")
chk = e.split('\n', 3)[3]
assert not re.search(r"'okuri_(view|cover|bk)'|'okurimono'|八十二", chk), [l for l in chk.split('\n') if re.search(r"'okuri_(view|cover|bk)'|'okurimono'|八十二", l)][:3]
wr('engine.js', e)

# ---------------- index.html ----------------
h = rd(O, 'index.html')
h = sub(h, '<title>川村さんへの贈り物</title>', '<title>古代図書館</title>')
h = sub(h, "--night:#10191c;--night2:#1b282c;", "--night:#15131c;--night2:#221e2c;")
h = sub(h, "#27424a 0%,var(--nigh", "#3d3550 0%,var(--nigh")
h = sub(h, "body[data-world=lib] #play{background:radial-gradient(ellipse at 50% 0%,#2a454c 0%,var(--night) 75%);",
        "body[data-world=lib] #play{background:radial-gradient(ellipse at 50% 0%,#3d3550 0%,var(--night) 75%);")
h = sub(h, '#title .owl{width:132px;height:132px;filter:drop-shadow(0 0 28px #ffcf7a55)}',
        '#title .owl{width:116px;height:116px;filter:drop-shadow(0 0 28px #ffcf7a55)}\n#titleOwl{display:flex;justify-content:center;gap:10px}')
h = sub(h, r'<div class="kicker">.*?</div>\n  <h1>川村さんへの<br>贈り物</h1>\n  <div class="tag">.*?</div>',
        '<div class="kicker">ミ ネ ル 先 生 と マ ス タ ー の</div>\n  <h1>古代<br>図書館</h1>\n  <div class="tag">読む前に、観る前に、入ってみる。</div>', regex=True)
h = sub(h, r'<p class="lead">.*?</p>',
        f'<p class="lead">{kanji(N)}の物語を、八つの書庫に。<br>本や映画の主人公になって、名場面を生きてみる。<br>幕が下りたら、ミネル先生かマスターが<br>その作品のわけを語り、ひとつだけ問いかける。</p>', regex=True)
h = sub(h, '<button class="btn primary" id="enter">書斎に入る</button>', '<button class="btn primary" id="enter">図書館に入る</button>')
h = sub(h, '<div><h2>川村さんへの贈り物</h2>', '<div><h2>古代図書館</h2>')
h = sub(h, r'持っている <b id="ownc">0</b> / \d+</div>', f'持っている <b id="ownc">0</b> / {N}</div>', regex=True)
h = sub(h, r'<h3 class="shelfh">.*?</h3>', f'<h3 class="shelfh">{N}の物語、八つの書庫</h3>', regex=True)
h = sub(h, '<span><span class="bd bd-both">漫</span> 漫画</span>', '<span><span class="bd bd-both">漫</span> 漫画・詩集</span>')
# 物語：三つのフォルダから、そのまま読みこむ。読みこむ前後で案内役を決め、同じ作品（同じ id）は、あとから読んだもの（贈り物の版）だけを残す
v = time.strftime('%y%m%d%H%M')
h = re.sub(r'<script src="(\.\./gogo/)?ep_[^"]*"></script>\n', '', h)
def eps(d, rel): return ''.join(f'<script src="{rel}/{os.path.basename(f)}?v={v}"></script>\n' for f in sorted(glob.glob(os.path.join(d, 'ep_*.js'))))
tags = (f'<script src="../dokusho/adult.js?v={v}"></script>\n<script>TEACHER=\'ミネル\';</script>\n' + eps(D, '../dokusho')
        + "<script>EPS.forEach(e => { e.guide = e.guide || 'ミネル'; }); TEACHER='マスター';</script>\n" + eps(G, '../gogo') + eps(O, '../okurimono')
        + "<script>EPS.forEach(e => { e.guide = e.guide || 'マスター'; }); (() => { const seen = new Set(); for (let i = EPS.length - 1; i >= 0; i--) { if (seen.has(EPS[i].id)) EPS.splice(i, 1); else seen.add(EPS[i].id); } })();</script>\n")
h = re.sub(r'(<script src="books\.js)[^"]*("></script>\n)', lambda m: m.group(1) + '?v=' + v + m.group(2) + tags, h)
h = re.sub(r'\?v=\d+"', f'?v={v}"', h)
assert '川村さんへの贈り物' not in h
wr('index.html', h)

# ---------------- art.js：三つのサイトの絵を合わせる（同じ id は、贈り物 → 午後の書斎 → 名作のなかへ の順に優先） ----------------
a = rd(O, 'art.js')
body = lambda d: re.search(r"const ART = \{\n(.*?)\n\};", rd(d, 'art.js'), re.S).group(1)
a = sub(a, re.search(r"const ART = \{\n.*?\n\};", a, re.S).group(0), "const ART = {\n" + body(D) + "\n" + body(G) + "\n" + body(O) + "\n};")
a = sub(a, "/* 川村さんへの贈り物 ― 表紙の絵", "/* 古代図書館 ― 表紙の絵（三つのサイトの絵を合わせたもの。kodai/build_from_all.py で生成）")
wr('art.js', a)
print(f'kodai: books.js, engine.js, index.html, art.js を作りました（{N}作）')
