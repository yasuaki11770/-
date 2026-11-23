"""午後の書斎 ― 名作のなかへ（dokusho/）の仕組みを複製して、大人向けの別サイトに作りかえる
   使い方: python3 gogo/build_from_dokusho.py   （dokusho の engine.js・index.html・art.js から gogo の3つを作る）
   books.js と ep_*.js は gogo 独自（このスクリプトでは触らない） """
import os, re, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D, G = os.path.join(ROOT, 'dokusho'), os.path.join(ROOT, 'gogo')
def rd(p): return open(os.path.join(D, p), encoding='utf-8').read()
def wr(p, s): open(os.path.join(G, p), 'w', encoding='utf-8').write(s)
def sub(s, a, b, n=None, regex=False):
    cnt = len(re.findall(a, s, re.S)) if regex else s.count(a)
    assert cnt >= 1 and (n is None or cnt == n), (cnt, a[:90])
    return re.sub(a, lambda m: b, s, flags=re.S) if regex else s.replace(a, b)

MASTER = ('<svg viewBox="0 0 100 100" aria-hidden="true">'
  '<path d="M16 100Q18 74 50 71Q82 74 84 100Z" fill="#3b2a21"/><path d="M41 72L50 94L59 72Z" fill="#f4efe6"/>'
  '<path d="M39 76L50 81L39 86ZM61 76L50 81L61 86Z" fill="#b0362c"/><circle cx="50" cy="81" r="2.6" fill="#8a2a22"/>'
  '<rect x="44" y="62" width="12" height="10" fill="#d9b08a"/>'
  '<ellipse cx="29.5" cy="47" rx="3.5" ry="5.5" fill="#dcb48e"/><ellipse cx="70.5" cy="47" rx="3.5" ry="5.5" fill="#dcb48e"/>'
  '<ellipse cx="50" cy="45" rx="20" ry="23" fill="#e8c4a0"/>'
  '<path d="M29 46Q26 20 50 19Q74 20 71 46Q68 30 58 28Q50 34 42 28Q32 30 29 46Z" fill="#dcd6cc"/>'
  '<circle cx="42" cy="47" r="6.2" fill="none" stroke="#3b2a21" stroke-width="2"/><circle cx="58" cy="47" r="6.2" fill="none" stroke="#3b2a21" stroke-width="2"/>'
  '<path d="M48.2 46.5H51.8" stroke="#3b2a21" stroke-width="2"/><circle cx="42" cy="47.5" r="1.7" fill="#2b1d10"/><circle cx="58" cy="47.5" r="1.7" fill="#2b1d10"/>'
  '<path d="M39 58Q44.5 54 50 57Q55.5 54 61 58Q55.5 62.5 50 59.5Q44.5 62.5 39 58Z" fill="#cfc8bd"/>'
  '<path d="M44 63.5Q50 66.5 56 63.5" stroke="#a8745a" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>')

# ---------------- engine.js ----------------
e = rd('engine.js')
e = sub(e, "/* 名作のなかへ ― 進行エンジン", "/* 午後の書斎 ― 進行エンジン（名作のなかへ の仕組みを、大人向けの別サイトに作りかえたもの。gogo/build_from_dokusho.py で生成）")
e = sub(e, r"const OWL = `<svg viewBox=\"0 0 100 100\" aria-hidden=\"true\">.*?</svg>`;", "const OWL = `" + MASTER + "`;   // 案内役：書斎のマスター", regex=True)
for a, b in [("'yrt_rec2'", "'gogo_rec'"), ("'yrt_own'", "'gogo_own'"), ("'yrt_view'", "'gogo_view'"), ("'yrt_cover'", "'gogo_cover'"), ("'yrt_bk'", "'gogo_bk'"),
             ("indexedDB.open('meisaku', 1)", "indexedDB.open('gogo', 1)")]:
    e = sub(e, a, b)
e = sub(e, '<span class="who">ミネル先生</span>', '<span class="who">マスター</span>')
# 名作のわけ・問いかけ
e = sub(e, "ep.whyIntro || `おかえり。……さて、本を閉じる前に、少しだけ話をさせておくれ。この本が、なぜ${WHY_SPAN(ageOf(ep))}のか。`",
        "ep.whyIntro || `おかえりなさい。……幕を下ろす前に、少しだけ話をさせてください。この作品が、なぜ${WHY_SPAN(ageOf(ep))}のか。`")
e = sub(e, "const WHY_SPAN = a => a >= 1000 ? '何百年、何千年と読み継がれてきた' : a >= 200 ? '何百年と読み継がれてきた' : a >= 100 ? '百年以上も読み継がれてきた' : a >= 30 ? '何十年と読み継がれてきた' : 'これほど多くの人に読まれている';",
        "const WHY_SPAN = a => a >= 1000 ? '千年以上も、人の心に残ってきた' : a >= 200 ? '何百年も、人の心に残ってきた' : a >= 100 ? '百年以上も、人の心に残ってきた' : a >= 30 ? '何十年も、人の心に残ってきた' : 'これほど多くの人の心に届いた';")
e = sub(e, "next:'resolve', nextLabel:'先生の問いかけ ▶'", "next:'resolve', nextLabel:'マスターの問いかけ ▶'")
e = sub(e, "'では、わしから問いかけじゃ。本を閉じたあと、あなたは、この本から何を持って帰るかの。'", "'では、ひとつだけ伺います。この作品から、あなたは何を持って帰りますか。'")
e = sub(e, "['!', `『${ep.title}』から学べることで、\\n改めたいことはないか？`]", "['!', `『${ep.title}』から、\\nこれからの人生に持って帰りたいものは？`]")
e = sub(e, "[TEACHER, 'ただし、栞にはさめる言葉は**ひとつだけ**じゃ。たくさんはさむと、どれも読み返さなくなるからの。いちばん胸に残ったものを、ひとつ選びなされ。']",
        "[TEACHER, '栞に挟める言葉は、**ひとつだけ**にしましょう。たくさん挟むと、どれも読み返さなくなりますから。一番胸に残ったものを、ひとつ。']")
e = sub(e, "nextButton('次へ ▶', () => go(val(c.to, S)));", "nextButton('次へ ▶', () => go(val(c.to, S)));")
# 読むときの選択肢「なし」：導入の決まり文句を消す
e = sub(e, r"const CH_RE = \[\n.*?\n\];", "const CH_RE = [\n  [/もし[^。]*と違う道を選んだら、ページが波打ちます。そのときは、選び直してください。/, ''],\n];", regex=True)
# 節目：15作なので、5作ごと
e = sub(e, "  const T = BOOKS.length, a = [10, 50, 100, 150].filter(x => x < T);\n  for (let x = 200; x < T; x += 50) a.push(x);",
        "  const T = BOOKS.length, a = [];\n  for (let x = 5; x < T; x += 5) a.push(x);")
e = sub(e, r"function msMessage\(n\) \{.*?\n\}", """function msMessage(n) {
  const T = BOOKS.length;
  if (n >= T) return `……${T}作、すべてに栞が挟まりました。<br>ここにあるのは、誰かが選んだ名作ではなく、<b>あなたが人生の午後のために選んだ${T}作</b>です。最後の栞は、金の地に、書斎の紋を入れておきました。`;
  if (n === 5) return '五作目の栞ですね。……五つの人生を通ってきた人の顔に、少しなってきました。<b>ここからの栞は、若葉の色になります。</b>';
  if (n === 10) return '十作目。……作品と作品が、頭の中でつながりはじめるころです。ある映画の場面が、別の本の一行を思い出させる。<b>ここからの栞は、藍の色になります。</b>';
  return `${n}作目の栞です。……よく、ここまで来ましたね。`;
}""", regex=True)
e = sub(e, "r.n >= BOOKS.length ? '全刊読破' : r.n + '冊目の節目'", "r.n >= BOOKS.length ? '全作読了' : r.n + '作目の節目'")
# 作品の種類（本・小説・古典・映画・記録映画・漫画・詩集）
e = sub(e, """const memb = l => /中/.test(l) && /高/.test(l) ? 'both' : /中/.test(l) ? 'j' : 'h';
const MEMB = {both: ['両', '中等部・高等部の両方'], j: ['中', '中等部のみ'], h: ['高', '高等部のみ']};
const badge = (l, long) => `<span class="bd bd-${memb(l)}">${MEMB[memb(l)][long ? 1 : 0]}</span>`;""",
"""/* 作品の種類：books.js の [2]。バッジの色は 本＝青・映画＝赤・そのほか＝金 */
const KIND = {'本': ['本', 'j'], '小説': ['小', 'j'], '古典': ['古', 'j'], '映画': ['映', 'h'], '記録映画': ['記', 'h'], '漫画': ['漫', 'both'], '詩集': ['詩', 'both']};
const kindOf = b => KIND[b[2]] ? b[2] : '本';
const badge = (b, long) => { const k = kindOf(b); return `<span class="bd bd-${KIND[k][1]}">${long ? k : KIND[k][0]}</span>`; };
const isFilm = b => /映画/.test(b[2]);
const seen = b => isFilm(b) ? '観た' : '読んだ';""")
e = sub(e, r"const fmtLists = l => .*?\n", "const fmtLists = l => `No.${l}`;\n", regex=True)
e = sub(e, "badge(b[3], true)", "badge(b, true)"); e = sub(e, "badge(bk[3], true)", "badge(bk, true)"); e = sub(e, "${badge(b[3])}", "${badge(b)}")
e = sub(e, "badge(bk[3])", "badge(bk)")
e = sub(e, r"badge\(b\[3\]\)", "badge(b)", regex=True) if "badge(b[3])" in e else e
e = sub(e, "const matOf = b => { const y = b ? b[4] : 2000; return y >= 1950 ? 'pb' : y >= 1900 ? 'cl' : 'lt'; };",
        "const matOf = b => { if (b && /映画/.test(b[2])) return 'film'; const y = b ? b[4] : 2000; return y >= 1950 ? 'pb' : y >= 1900 ? 'cl' : 'lt'; };")
e = sub(e, "const tc0 = m === 'pb' ?", "const tc0 = m === 'pb' || m === 'film' ?")
e = sub(e, "const base = {pb: 154, cl: 162, lt: 168}[m]", "const base = {pb: 154, cl: 162, lt: 168, film: 150}[m]")
e = sub(e, "const LEN_RANK = {S: 1, D: 2, M: 2, N: 3, P: 3, E: 3, L: 4, L2: 5, XL: 6};", "const LEN_RANK = {K: 1, P: 2, F: 2, D: 2, B: 3, E: 3, N: 4, C: 6};")
e = sub(e, "<div class=\"rt\"><span>読みやすさ</span>", "<div class=\"rt\"><span>入りやすさ</span>")
e = sub(e, "<div class=\"rt\"><span>書かれた年</span>", "<div class=\"rt\"><span>発表された年</span>")
e = sub(e, "・読みやすさ★${b[8]}", "・入りやすさ★${b[8]}")
e = sub(e, "['no', '番号順', null],", "['no', 'リスト順', null],")
e = sub(e, "['easy', '読みやすい順', (a, b) => b[8] - a[8]],", "['easy', '入りやすい順', (a, b) => b[8] - a[8]],")
e = sub(e, "const key = VIEW.sort === 'aiu' ? gyoOf : VIEW.sort === 'no' ? (b => b[2]) : null;", "const key = VIEW.sort === 'aiu' ? gyoOf : null;")
e = sub(e, """    ['j', '中等部', b => /中/.test(b[3])],
    ['h', '高等部', b => /高/.test(b[3])],
    ['both', '両方', b => memb(b[3]) === 'both'],""", """    ['book', '本', b => /本|小説|古典/.test(b[2])],
    ['film', '映画', b => /映画/.test(b[2])],
    ['other', '漫画・詩', b => /漫画|詩集/.test(b[2])],""")
e = sub(e, "['paper', '本で読んだ', b => paperRead(b[0])],", "['paper', '読んだ・観た', b => paperRead(b[0])],")
# 本で読んだ日 → 実物で読んだ・観た日
e = sub(e, """  return `<div class="paper"><span class="pl">📖 本で読んだ日</span>
    <input type="date" value="${v}" max="${todayISO()}" aria-label="本で読んだ日">
    <button type="button" class="pt">${v ? '消す' : '今日読んだ'}</button></div>`;""", """  return `<div class="paper"><span class="pl">📖 実物で読んだ・観た日</span>
    <input type="date" value="${v}" max="${todayISO()}" aria-label="実物で読んだ・観た日">
    <button type="button" class="pt">${v ? '消す' : '今日'}</button></div>`;""")
e = sub(e, "bt.textContent = v ? '消す' : '今日読んだ';", "bt.textContent = v ? '消す' : '今日';")
e = sub(e, "aria-label=\"${st === 'read' ? '本で読んだ' : '持っている'}\"", "aria-label=\"${st === 'read' ? '読んだ・観た' : '持っている'}\"")
# おすすめ
e = sub(e, "${one(nx, '次の一冊',", "${one(nx, '次の一作',")
e = sub(e, "${one(td, '今日の一冊', '日がわりで、ミネル先生が選んだ本', 'pkToday')}", "${one(td, '今夜の一作', '日がわりで、マスターが選んだ一作', 'pkToday')}")
e = sub(e, "`${esc(len(nx))}・読みやすさ★${nx[8]}<br><button type=\"button\" class=\"more\" id=\"pkMore\">ほかの本</button>`",
        "`${esc(len(nx))}・入りやすさ★${nx[8]}<br><button type=\"button\" class=\"more\" id=\"pkMore\">ほかの作品</button>`")
# 本棚のことば
e = sub(e, r"  if \(done >= EPS\.length\) msg = .*?\n  else if \(done\) \{", """  if (done >= EPS.length) msg = '……すべての作品に、栞が挟まりました。<br>ここからは、栞を挟んだ作品を、<b>今度は実物で</b>読んで、観てください。同じ作品が、きっと違う顔を見せます。';
  else if (done) {""", regex=True)
e = sub(e, "msg = 'おかえり。本に挟んだ栞は、<b>栞帳</b>で、いつでも読み返せる。' + (nm ? `<br>次の節目（${nm}冊）まで、あと<b>${nm - done}冊</b>じゃ。` : '');",
        "msg = 'おかえりなさい。挟んだ栞は、<b>栞帳</b>で、いつでも読み返せます。' + (nm ? `<br>次の節目（${nm}作）まで、あと<b>${nm - done}作</b>です。` : '');")
e = sub(e, r"msg \+= '<br>そうそう、<b>記録のバックアップ</b>も.*?';", "msg += '<br>そうそう、<b>記録のバックアップ</b>も、ときどき取っておいてください（一番下の「記録と設定」から）。';", regex=True)
e = sub(e, r"\} else msg = 'ようこそ、夜の図書館へ。.*?';\n", "} else msg = 'いらっしゃいませ。夜更けの書斎へ、ようこそ。マスターです。<br>ここには、<b>人生の午後に効く15の作品</b>を置いています。本も、映画も、漫画も、詩も。<b>読まなくても、観なくてもいい。中に入って、主人公になってみてください。</b>迷ったら、下の「次の一作」からどうぞ。';\n", regex=True)
e = sub(e, r"\$\('rackNote'\)\.innerHTML = '中等部.*?';\n", "$('rackNote').innerHTML = '人生の午後に読みたい、観たい15作。古い時代の作品ほど、使いこまれた姿で並んでいます。映画は、ケースの姿で。<br>背表紙をタップすると、作品の紹介、「持っている」「読んだ・観た」の記録、表紙の写真の設定ができます。';\n", regex=True)
# 本棚の空のとき
e = sub(e, "<small>（${l.length}冊）</small>", "<small>（${l.length}作）</small>")
e = sub(e, "その言葉にあてはまる本は、見つかりませんでした。", "その言葉にあてはまる作品は、見つかりませんでした。")
# シート・本のページ
e = sub(e, "<p>${esc(b[1] || '著者不詳')}</p>", "<p>${esc(b[1] || '作者不詳')}</p>")
e = sub(e, "'<button class=\"btn primary\" id=\"shGo\">この本の扉を開く</button>' : '<p class=\"small mute\">この本の物語は、まだ書架の奥で準備中です。</p>'",
        "'<button class=\"btn primary\" id=\"shGo\">この作品の扉を開く</button>' : '<p class=\"small mute\">この作品の物語は、まだ準備中です。</p>'")
e = sub(e, "${OWN[title] ? `<button class=\"btn\" id=\"shPh\" style=\"text-align:center\">📷　${PH[title] ? '表紙の写真を撮りなおす' : '表紙を、自分の本の写真にする'}</button>` : ''}",
        "${OWN[title] ? `<button class=\"btn\" id=\"shPh\" style=\"text-align:center\">📷　${PH[title] ? '表紙の写真を撮りなおす' : '表紙を、自分の持っている本・ディスクの写真にする'}</button>` : ''}")
e = sub(e, "<span>${esc(ep.author)}（${esc(ep.year)}）</span>", "<span>${esc(ep.author)}（${esc(ep.year)}）</span>")
e = sub(e, "<div class=\"lk\"><span>この本、好き？</span>${likeHTML(ep.id)}</div>\n      <textarea id=\"bkMemo\" rows=\"4\" placeholder=\"感想を、自由に。\">",
        "<div class=\"lk\"><span>この作品、好き？</span>${likeHTML(ep.id)}</div>\n      <textarea id=\"bkMemo\" rows=\"4\" placeholder=\"感想を、自由に。\">")
e = sub(e, "<p class=\"small\">改めたいこと</p>", "<p class=\"small\">持って帰りたいもの</p>")
e = sub(e, "fold('fRead', '本物を読んでみるなら', ''", "fold('fRead', '本物にふれるなら', ''")
e = sub(e, "<div class=\"sec\"><h3>この本のめやす</h3>${ratesHTML(bk)}</div>", "<div class=\"sec\"><h3>この作品のめやす</h3>${ratesHTML(bk)}</div>")
e = sub(e, "fold('fCov', '表紙', '絵か、自分の本の写真か'", "fold('fCov', '表紙', '絵か、持っている本・ディスクの写真か'")
e = sub(e, "r.paper ? `本で読んだ ${ymd(r.paper)}` : ''", "r.paper ? `読んだ・観た ${ymd(r.paper)}` : ''")
e = sub(e, "|| '持っている・読んだ日・好き度・感想';", "|| '持っている・読んだ／観た日・好き度・感想';")
e = sub(e, "const ownLabel = on => on ? '✓　持っている' : '□　この本を持っている';", "const ownLabel = on => on ? '✓　持っている' : '□　この作品を持っている';")
e = sub(e, "both: ['#c62a1f', 'アプリ・本', 'アプリと本の両方で読了'], paper: ['#23804a', '本', '本で読了']", "both: ['#c62a1f', 'アプリ・実物', 'アプリと実物の両方で読了'], paper: ['#23804a', '実物', '実物で読んだ・観た']")
e = sub(e, "${d ? 'もう一度、本の中へ' : 'この本の扉を開く'}", "${d ? 'もう一度、作品の中へ' : 'この作品の扉を開く'}")
e = sub(e, "<button class=\"btn primary\" id=\"lessonOk\">この栞を、本に挟む</button>", "<button class=\"btn primary\" id=\"lessonOk\">この栞を、作品に挟む</button>")
e = sub(e, "<div class=\"src\">『${esc(ep.title)}』を読んで</div>", "<div class=\"src\">『${esc(ep.title)}』から</div>")
# 栞帳
e = sub(e, "${nm ? `次の節目 ${nm}冊まで あと${nm - list.length}冊` : '全刊読破'}", "${nm ? `次の節目 ${nm}作まで あと${nm - list.length}作` : '全作読了'}")
e = sub(e, r"<p class=\"small\" style=\"opacity:\.75;margin:0;line-height:1\.8\">これまでに本に挟んだ栞です。.*?</p>",
        "<p class=\"small\" style=\"opacity:.75;margin:0;line-height:1.8\">これまでに挟んだ栞です。栞の言葉と、感想を見返せます。5作・10作…と節目をこえるごとに、栞の色が変わります。</p>", regex=True)
e = sub(e, "${tierOf(r.n) === 'all' ? '全刊' : TIER_NAME[tierOf(r.n)]}の栞", "${tierOf(r.n) === 'all' ? '全作' : TIER_NAME[tierOf(r.n)]}の栞")
e = sub(e, "${r.paper ? `<br>本で読んだ　${ymd(r.paper)}` : ''}", "${r.paper ? `<br>読んだ・観た　${ymd(r.paper)}` : ''}")
e = sub(e, "'<p class=\"small\" style=\"opacity:.6;text-align:center;padding:30px 0\">まだ、栞はありません。<br>本を一冊読みおえると、ここに栞がたまっていきます。</p>'",
        "'<p class=\"small\" style=\"opacity:.6;text-align:center;padding:30px 0\">まだ、栞はありません。<br>作品を一つ終えると、ここに栞がたまっていきます。</p>'")
# 設定
e = sub(e, "なし：原作の流れのまま読み進め、選ぶのは、読みおえたあとのミネル先生との対話だけ。", "なし：原作の流れのまま進み、選ぶのは、終わったあとのマスターとの対話だけ。")
e = sub(e, "あり：本の中でも、主人公の行動を自分で選ぶ（原作と違うと、ページが波打つ）。", "あり：作品の中でも、主人公の行動を自分で選ぶ（原作と違うと、ページが波打つ）。")
e = sub(e, "図書館に、オリジナルのオルゴール曲が静かに流れます。本の中でも流れ続け、", "書斎に、オリジナルのオルゴール曲が静かに流れます。作品の中でも流れ続け、")
e = sub(e, "読了・栞・感想・好き度・本で読んだ日・持っている本・表紙の写真を、", "読了・栞・感想・好き度・読んだ／観た日・持っている作品・表紙の写真を、")
e = sub(e, "{app: 'meisaku-no-nakae',", "{app: 'gogo-no-shosai',")
e = sub(e, "name = `meisaku-kiroku-${d}.json`", "name = `gogo-kiroku-${d}.json`")
e = sub(e, "data.app !== 'meisaku-no-nakae'", "data.app !== 'gogo-no-shosai'")
e = sub(e, "「名作のなかへ」の記録ファイル", "「午後の書斎」の記録ファイル")
# オルゴール
e = sub(e, "artist: '名作のなかへ', album: '図書館のオルゴール'", "artist: '午後の書斎', album: '書斎のオルゴール'")
# 起動
e = sub(e, r"\$\('titleNote'\)\.textContent = EPS\.length >= BOOKS\.length\n  \? `.*?`\n  : `.*?`;", "$('titleNote').textContent = `収録：${EPS.length}作（本・映画・漫画・詩集／1作 15〜25分）`;", regex=True)
e = sub(e, "confirm('本棚へ戻りますか？（この本は最初からになります）')", "confirm('本棚へ戻りますか？（この作品は最初からになります）')")
e = sub(e, "/* 本棚の並びを、読書百選の一覧（books.js）の順にそろえる */", "/* 本棚の並びを、一覧（books.js）の順にそろえる */")
e = sub(e, "   流れ：図書館（本の紹介）→ 本の世界（名場面を主人公として体験）→ 名作のわけ（先生の講義）", "   流れ：書斎（作品の紹介）→ 作品の世界（名場面を主人公として体験）→ 名作のわけ（マスターの話）")
e = sub(e, "/* ミネル先生の言葉・問いかけの項目を、大人の読者向けに整える（adult.js） */", "/* 名作のなかへ では adult.js で大人向けに整えていた。午後の書斎は、はじめから大人向けに書いているので使わない */")
e = sub(e, "/* ---------- 掲載（中等部・高等部）と、持っている本 ---------- */", "/* ---------- 作品の種類と、持っている作品 ---------- */")
e = sub(e, "/* ---------- ミネル先生のおすすめ：次の一冊（やさしい順）と、今日の一冊（日がわり） ---------- */", "/* ---------- マスターのおすすめ：次の一作（入りやすい順）と、今夜の一作（日がわり） ---------- */")
e = sub(e, "   // 158冊すべてに入れるようになったか", "")
e = sub(e, "/* ---------- 図書館のオルゴール（オリジナル曲。tools/orgel.py・orgel2.py で楽譜から合成） ----------", "/* ---------- 書斎のオルゴール（オリジナル曲。dokusho/tools/orgel.py・orgel2.py で楽譜から合成） ----------")
wr('engine.js', e)

# ---------------- index.html ----------------
h = rd('index.html')
h = sub(h, re.search(r'<title>.*?</title>', h).group(0), '<title>午後の書斎</title>')
h = sub(h, "--night:#151c33;--night2:#222c4d;", "--night:#1c1511;--night2:#2c2119;")
h = sub(h, "#2b3762 0%,var(--nigh", "#4a3424 0%,var(--nigh")
h = sub(h, "body[data-world=lib] #play{background:radial-gradient(ellipse at 50% 0%,#33406c 0%,var(--night) 75%);", "body[data-world=lib] #play{background:radial-gradient(ellipse at 50% 0%,#4d3727 0%,var(--night) 75%);")
h = sub(h, '<div class="kicker">読 書 百 選</div>\n  <h1>名作の<br>なかへ</h1>\n  <div class="tag">読めなくても、入ればいい。</div>',
        '<div class="kicker">人 生 の 午 後 に</div>\n  <h1>午後の<br>書斎</h1>\n  <div class="tag">読む前に、観る前に、入ってみる。</div>')
h = sub(h, r'<p class="lead">名作の主人公になって.*?</p>', '<p class="lead">本や映画の主人公になって、名場面を生きてみる。<br>幕が下りたら、夜更けの書斎のマスターが<br>「なぜ名作なのか」を語り、ひとつだけ問いかける。<br>――人生の午後を、あなたはどう生きますか。</p>', regex=True)
h = sub(h, '<button class="btn primary" id="enter">図書館に入る</button>', '<button class="btn primary" id="enter">書斎に入る</button>')
h = sub(h, '<div><h2>名作のなかへ</h2>', '<div><h2>午後の書斎</h2>')
h = sub(h, '<div class="count">アプリで読了 <b id="cnt">0</b><br>本で読んだ <b id="papc">0</b><br>持っている <b id="ownc">0</b> / 158</div>',
        '<div class="count">アプリで読了 <b id="cnt">0</b><br>読んだ・観た <b id="papc">0</b><br>持っている <b id="ownc">0</b> / 15</div>')
h = sub(h, '<h3 class="shelfh">読書百選　158冊</h3>', '<h3 class="shelfh">人生の午後の15作</h3>')
h = sub(h, 'placeholder="書名・作者で探す（ひらがなでも）"', 'placeholder="題名・作者で探す（ひらがなでも）"')
h = sub(h, r'<div class="legend"><span><span class="bd bd-j">中</span> 中等部のみ</span><span><span class="bd bd-h">高</span> 高等部のみ</span><span><span class="bd bd-both">両</span> 両方</span>',
        '<div class="legend"><span><span class="bd bd-j">本</span> 本・小説・古典</span><span><span class="bd bd-h">映</span> 映画</span><span><span class="bd bd-both">漫</span> 漫画・詩集</span>', regex=True)
h = sub(h, '<svg class="rb read" viewBox="0 0 12 22"><path d="M1.5 1H10.5V20L6 15.5L1.5 20Z"/></svg>本で読んだ</span>', '<svg class="rb read" viewBox="0 0 12 22"><path d="M1.5 1H10.5V20L6 15.5L1.5 20Z"/></svg>読んだ・観た</span>')
h = sub(h, "var TEACHER='ミネル';", "var TEACHER='マスター';")
h = sub(h, '<i class="lgst st-both"></i>アプリと本</span><span><i class="lgst st-paper"></i>本だけ</span>', '<i class="lgst st-both"></i>アプリと実物</span><span><i class="lgst st-paper"></i>実物だけ</span>')
h = sub(h, r'<script src="ep_[^"]*"></script>\n', '', regex=True)     # 作品の script は regtags で入れる
h = sub(h, r'<script src="adult\.js\?v=\d+"></script>\n', '', regex=True)
# 映画のケース（背表紙の素材 m-film）
h = sub(h, "</style>", """/* 午後の書斎：映画は、ディスクのケースの姿で */
.spine.m-film{background:linear-gradient(90deg,#0c0c0e 0,#2a2a30 8%,#141418 20%,#1c1c22 50%,#141418 80%,#2a2a30 92%,#0c0c0e 100%);border-radius:3px 3px 2px 2px;color:var(--tc)}
.spine.m-film::before{content:'';position:absolute;left:0;right:0;top:12px;height:5px;background:var(--c);opacity:.9}
.spine.m-film::after{content:'';position:absolute;left:0;right:0;bottom:14px;height:3px;background:var(--c);opacity:.6}
</style>""", n=1)
# 作品の script を、gogo の ep_*.js から入れる（版番号は、作るたびに変えてキャッシュを避ける）
import glob, time
v = time.strftime('%y%m%d%H%M')
eps = sorted(os.path.basename(f) for f in glob.glob(os.path.join(G, 'ep_*.js')))
h = re.sub(r'(<script src="books\.js)[^"]*("></script>\n)', lambda m: m.group(1) + '?v=' + v + m.group(2) + ''.join(f'<script src="{x}?v={v}"></script>\n' for x in eps), h)
h = re.sub(r'\?v=\d+"', f'?v={v}"', h)
wr('index.html', h)

# ---------------- art.js（表紙の絵）：モチーフを足して、15作の絵を描く ----------------
a = rd('art.js')
a = sub(a, "/* 名作のなかへ ― 表紙の絵", "/* 午後の書斎 ― 表紙の絵（名作のなかへ の絵の仕組みに、モチーフを足したもの）")
a = sub(a, "  shadow: () =>", """  /* 午後の書斎で足したモチーフ */
  rocket: i => `<path d="M50 6Q66 22 64 58H36Q34 22 50 6Z" fill="${C.W}"/><circle cx="50" cy="34" r="7" fill="${C.B}"/><path d="M36 46L22 66H36ZM64 46L78 66H64Z" fill="${C.R}"/><path d="M40 58H60L56 66H44Z" fill="${i}"/><path d="M44 68Q50 92 56 68Z" fill="${C.F}"/><path d="M47 68Q50 82 53 68Z" fill="${C.A}"/>`,
  van: i => `<path d="M6 74V44Q6 36 14 36H66Q76 36 82 46L92 58V74Z" fill="${C.W}"/><path d="M68 40H74Q80 44 84 54H68Z" fill="${C.B}" opacity=".7"/><rect x="14" y="42" width="44" height="12" rx="2" fill="${C.B}" opacity=".55"/><path d="M6 62H92" stroke="${i}" stroke-width="3"/><circle cx="24" cy="76" r="9" fill="${C.K}"/><circle cx="72" cy="76" r="9" fill="${C.K}"/><circle cx="24" cy="76" r="3.5" fill="${C.W}"/><circle cx="72" cy="76" r="3.5" fill="${C.W}"/>`,
  car: i => `<path d="M4 70V58Q6 50 18 48L30 36Q36 32 48 32H62Q70 32 76 38L86 48Q96 50 96 60V70Z" fill="${C.B}"/><path d="M34 40Q38 36 46 36H50V48H26Z" fill="${C.W}" opacity=".75"/><path d="M54 36H62Q68 36 72 40L78 48H54Z" fill="${C.W}" opacity=".75"/><rect x="4" y="60" width="92" height="4" fill="${C.W}" opacity=".6"/><circle cx="24" cy="72" r="10" fill="${C.K}"/><circle cx="76" cy="72" r="10" fill="${C.K}"/><circle cx="24" cy="72" r="4" fill="${C.W}"/><circle cx="76" cy="72" r="4" fill="${C.W}"/>`,
  camera: i => `<rect x="12" y="34" width="76" height="46" rx="5" fill="${i}"/><rect x="20" y="28" width="16" height="8" rx="2" fill="${i}"/><circle cx="54" cy="57" r="16" fill="${C.K}"/><circle cx="54" cy="57" r="11" fill="#556" /><circle cx="50" cy="53" r="3.5" fill="${C.W}" opacity=".7"/><rect x="72" y="38" width="10" height="6" rx="1" fill="${C.W}" opacity=".8"/>`,
  chair: i => `<path d="M30 10H70V52H30Z" fill="none" stroke="${i}" stroke-width="5"/><path d="M38 18V46M50 18V46M62 18V46" stroke="${i}" stroke-width="3"/><path d="M24 52H76V60H24Z" fill="${i}"/><path d="M28 60L24 96M72 60L76 96M34 60L36 90M66 60L64 90" stroke="${i}" stroke-width="4" stroke-linecap="round"/>`,
  coin: () => `<circle cx="50" cy="50" r="30" fill="${C.A}"/><circle cx="50" cy="50" r="23" fill="none" stroke="#c9952e" stroke-width="3"/><path d="M42 40L50 52L58 40M50 52V64M42 54H58M42 60H58" stroke="#a87a22" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  komorebi: () => `<rect x="0" y="0" width="100" height="100" fill="${C.G}" opacity=".35"/>` + rng(14, k => `<circle cx="${(k * 37) % 100}" cy="${(k * 53) % 100}" r="${3 + (k % 4) * 2.2}" fill="${C.A}" opacity="${.35 + (k % 3) * .2}"/>`),
  shoes: i => `<path d="M8 74Q10 58 20 56L34 54Q40 62 50 62Q58 62 58 70V78H8Z" fill="${i}"/><path d="M48 52Q50 40 60 40L74 38Q80 46 90 46Q98 48 96 56V62H48Z" fill="${i}" opacity=".65"/>`,
  shadow: () =>""")
a = sub(a, re.search(r"const ART = \{.*?\n\};", a, re.S).group(0), """const ART = {
  tooitaiko: 'sun 74 28 30; sea; taiko 44 96 56', kouhan: 'sunset 46 84 72; road; hills', perfectdays: 'komorebi; gtree 50 74 72; camera 46 118 36',
  greenbook: 'road; hills; car 48 100 66; notes 74 40 30', uchuukyoudai: 'stars; moon 24 26 28; rocket 50 90 70', diewithzero: 'sunset 50 52 60; hourglass 46 106 52',
  seneca: 'columns 50 70 72; hourglass 50 120 32', ibunka: 'globe 50 72 60; plane 48 118 42', jinseifruits: 'greenhills; gtree 36 86 56; cabin 72 104 34; apple 62 64 18',
  tsukito6: 'moon 26 28 32; sea; palm 66 96 58', kibou: 'sunset 50 70 60; candle 46 112 40', nomadland: 'stars; dunes; van 48 100 64',
  kirawareru: 'hills; bird 44 64 54; cloud 70 36 40', stoner: 'snow; book 46 100 58', yorikakarazu: 'moon 26 28 30; chair 50 98 60',
};""")
wr('art.js', a)

for f in ('orgel.mp3', 'orgel2.mp3'):
    shutil.copyfile(os.path.join(D, f), os.path.join(G, f))
print('gogo: engine.js, index.html, art.js, orgel*.mp3 を作りました')

# 川村さんへの贈り物（okurimono/）も、gogo と同じ仕組みなので、続けて作りなおす
OK = os.path.join(ROOT, 'okurimono', 'build_from_gogo.py')
if os.path.exists(OK):
    import subprocess, sys
    subprocess.run([sys.executable, OK], check=True)
