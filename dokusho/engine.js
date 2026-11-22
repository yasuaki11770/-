'use strict';
/* 名作のなかへ ― 進行エンジン
   流れ：図書館（本の紹介）→ 本の世界（名場面を主人公として体験）→ 名作のわけ（先生の講義）
        → 問いかけ「いまのあなたは、こんな自分になっていないか」→ 問いかけ「この名作から、改めたいことは」→ 自分の栞
   エピソードは ep_*.js で window.EPS に登録する。
   シーン: {world:'lib'|'book', place, lines:[[話者,本文],...], choices:[...], next, nextLabel, set}
   話者: '' 地の文 / '心' 心の声 / '!' 強調 / TEACHER 先生 / それ以外は登場人物（ep.chars で色指定）
   選択肢: {t, to} または {t, miss:'先生の一言'}（原作の主人公とちがう選択。ページが波打ち、選び直す） */

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
const val = (v, ...a) => typeof v === 'function' ? v(...a) : v;
const NUM = ['一','二','三','四','五','六'];
/* ミネル先生の言葉・問いかけの項目を、大人の読者向けに整える（adult.js） */
const A = s => (window.adult ? window.adult(s) : s);
/* TEACHER（先生の話者名）は index.html で定義 */

const OWL = `<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="60" rx="34" ry="36" fill="#8a6a4a"/><ellipse cx="50" cy="68" rx="22" ry="24" fill="#e9d7b5"/><path d="M38 70q12 6 24 0M40 79q10 5 20 0" stroke="#b89a70" stroke-width="2" fill="none"/><path d="M18 32l14 12M82 32l-14 12" stroke="#6b4f33" stroke-width="7" stroke-linecap="round"/><circle cx="36" cy="46" r="13" fill="#fff"/><circle cx="64" cy="46" r="13" fill="#fff"/><circle cx="36" cy="47" r="6" fill="#2b1d10"/><circle cx="64" cy="47" r="6" fill="#2b1d10"/><circle cx="38" cy="45" r="2" fill="#fff"/><circle cx="66" cy="45" r="2" fill="#fff"/><circle cx="36" cy="46" r="15" fill="none" stroke="#d9a441" stroke-width="2.5"/><circle cx="64" cy="46" r="15" fill="none" stroke="#d9a441" stroke-width="2.5"/><path d="M51 46h-2" stroke="#d9a441" stroke-width="2.5"/><path d="M50 52l-5 7h10z" fill="#e0a03a"/><path d="M30 95l6-8 6 8M58 95l6-8 6 8" stroke="#e0a03a" stroke-width="3" fill="none"/></svg>`;

/* 本棚の並びを、読書百選の一覧（books.js）の順にそろえる */
EPS.sort((a, b) => BOOKS.findIndex(x => x[0] === a.title) - BOOKS.findIndex(x => x[0] === b.title));

let REC = {};
try { REC = JSON.parse(localStorage.getItem('yrt_rec2') || '{}') || {}; } catch (e) {}
const save = () => { try { localStorage.setItem('yrt_rec2', JSON.stringify(REC)); } catch (e) {} };
const rec = id => REC[id] || (REC[id] = {date:null, mirror:[], resolve:[], note:'', reads:0});

let EP = null, S = null, SC = null, LINES = [], LI = 0, PREV = '';

function show(id) {
  document.querySelectorAll('.screen').forEach(e => e.classList.toggle('on', e.id === id));
  if (id !== 'play') document.body.dataset.world = 'menu';
  window.scrollTo(0, 0);
}
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2400);
}

/* ---------- 名作のわけ・問いかけのシーンを、エピソードのデータから組み立てる ---------- */
function buildTalk(ep) {
  const sc = ep.scenes;
  sc.why = { world:'lib', place:`名作のわけ　『${ep.title}』`, lines: [
    [TEACHER, ep.whyIntro || 'おかえり。……さて、本を閉じる前に、少しだけ話をさせておくれ。この本が、なぜ何十年、何百年と読み継がれてきたのか。'],
    ...ep.why.flatMap((w, i) => [['!', `名作のわけ　その${NUM[i]}\n${w.h}`], ...w.lines.map(l => Array.isArray(l) ? l : [TEACHER, l])]),
  ], next:'mirror', nextLabel:'先生の問いかけ ▶' };
  sc.mirror = { world:'lib', place:'問いかけ　その一', ask:'mirror', lines: [
    [TEACHER, ep.mirror.intro],
    ['!', 'いまのあなたは、\nこんな自分になっていないか？'],
    ['', '当てはまるものを、**いくつでも**選んでください。選ぶと光ります。'],
  ]};
  sc.mirrorReply = { world:'lib', place:'問いかけ　その一', lines: S => S.mirror.length
      ? [...S.mirror.flatMap(i => [['<', A(ep.mirror.items[i].t)], [TEACHER, ep.mirror.items[i].r]]), ...(ep.mirror.after ? [[TEACHER, ep.mirror.after]] : [])]
      : [['<', 'どれも当てはまらない'], [TEACHER, ep.mirror.none]],
    next:'resolve', nextLabel:'次の問いかけ ▶' };
  sc.resolve = { world:'lib', place:'問いかけ　その二', ask:'resolve', lines: [
    [TEACHER, ep.resolve.intro],
    ['!', `『${ep.title}』から学べることで、\n改めたいことはないか？`],
    [TEACHER, 'ただし、栞にはさめる言葉は**ひとつだけ**じゃ。たくさんはさむと、どれも読み返さなくなるからの。いちばん胸に残ったものを、ひとつ選びなされ。'],
    ['', '下から**ひとつだけ**選ぶか、「自分の言葉で書く」を選んで書いてください。'],
  ]};
}

/* ---------- play ---------- */
function startEp(ep, from) {
  EP = ep; buildTalk(ep);
  S = Object.assign({mirror:[], resolve:[]}, ep.init ? ep.init() : {});
  PREV = '';
  show('play');
  go(from || ep.start);
}

function go(id) {
  const sc = EP.scenes[id];
  if (!sc) throw new Error('scene not found: ' + id);
  SC = sc; SC.id = id; SC._missed = new Set();
  if (sc.set) Object.assign(S, val(sc.set, S));
  document.body.dataset.world = sc.world || 'lib';
  $('play').classList.toggle('asking', !!sc.ask);
  $('place').textContent = val(sc.place, S) || '';
  $('log').innerHTML = ''; $('choices').innerHTML = '';
  if (PREV) addLine(['>', PREV]);
  PREV = '';
  $('hud').innerHTML = EP.hud ? (EP.hud(S, SC) || '') : '';
  LINES = val(sc.lines, S) || []; LI = 0;
  if (noChoice()) LINES = cleanLines(LINES);
  $('log').scrollTop = 0;
  step();
}

function step() {
  if (LI < LINES.length) addLine(LINES[LI++]);
  const more = LI < LINES.length;
  $('tap').style.display = more ? '' : 'none';
  if (!more) after();
}
function flush() { while (LI < LINES.length) addLine(LINES[LI++]); step(); }

function addLine([who, text]) {
  const d = document.createElement('div');
  if (who === '') d.className = 'ln nar', d.innerHTML = fmt(text);
  else if (who === '心') d.className = 'ln inner', d.innerHTML = fmt(text);
  else if (who === '!') d.className = 'ln big', d.innerHTML = fmt(text);
  else if (who === '>') d.className = 'ln prev', d.innerHTML = '▷ ' + fmt(text);
  else if (who === '<') d.className = 'ln me', d.innerHTML = `<span class="tx">${fmt(text)}</span>`;
  else if (who === TEACHER) d.className = 'ln teach', d.innerHTML = `${OWL}<span class="tx"><span class="who">ミネル先生</span>${fmt(A(text))}</span>`;
  else {
    const c = (EP.chars && EP.chars[who]) || '#777';
    d.className = 'ln say';
    d.innerHTML = `<span class="who" style="background:${c}">${esc(who)}</span><span class="tx">${fmt(text)}</span>`;
  }
  $('log').appendChild(d);
  requestAnimationFrame(() => d.scrollIntoView({block:'end', behavior:'smooth'}));
  return d;
}

function after() {
  if (SC.ask === 'mirror') return askMirror();
  if (SC.ask === 'resolve') return askResolve();
  if (SC.choices) return noChoice() ? autoChoose() : renderChoices();
  if (SC.next) nextButton(val(SC.nextLabel, S) || '次へ ▶', () => go(val(SC.next, S)));
}
function nextButton(label, fn) {
  const box = $('choices'); box.innerHTML = '';
  const b = document.createElement('button');
  b.className = 'btn primary ch'; b.textContent = label; b.onclick = fn;
  box.appendChild(b);
  return b;
}

/* 読むときの選択肢「なし」（初期値）：原作の主人公の行動を、そのまま見せて先へ進む */
const noChoice = () => !VIEW.choices;
const CH_RE = [
  [/そして時々、\*\*詩の言葉\*\*を選んでもらう。/, ''],
  [/時々選択を迫られる。/, ''],
  [/今夜は、思いきり間違えてよいぞ。むしろ、間違えるのが原作どおりじゃ。/, ''],
  [/今夜は、ちょっとかっこ悪い選択が、原作どおりになることが多いぞ。/, ''],
  [/[^。]*違う(?:道|言葉|もの)を選ぶと、ページが波打つから、(?:そのときは)?選び直しなされ。/, ''],
  [/さっき野原で「立ち上がる」を選んだら、ページが波打ったじゃろう。/, 'さっき野原で、メロスは、立ち上がらずに、ねころんでしまったじゃろう。'],
];
function cleanLines(lines) {
  return lines.map(l => {
    if (!Array.isArray(l) || l[0] !== TEACHER || typeof l[1] !== 'string') return l;
    let t = l[1]; CH_RE.forEach(([r, w]) => { t = t.replace(r, w); });
    return [l[0], t.trim()];
  }).filter(l => !Array.isArray(l) || l[1] !== '');
}
function autoChoose() {
  const ch = val(SC.choices, S) || [];
  if (ch.length <= 1) return renderChoices();   // 「本の中へ入る」のようなボタンは、そのまま
  const c = ch.find(x => x.to) || ch[0];
  addLine(['<', c.t]);
  nextButton('次へ ▶', () => go(val(c.to, S)));
}

function renderChoices() {
  const box = $('choices'); box.innerHTML = '';
  const list = val(SC.choices, S) || [];
  list.forEach((c, i) => {
    const b = document.createElement('button');
    // 道が一つだけ（「本の中へ入る」など）のときは、明るい「進む」ボタンにする
    b.className = 'btn ch' + (list.length === 1 && !c.miss ? ' primary' : '') + (SC._missed.has(i) ? ' crossed' : '');
    b.disabled = SC._missed.has(i);
    b.style.animationDelay = (i * 60) + 'ms';
    b.innerHTML = fmt(c.t);
    b.onclick = () => choose(c, i);
    box.appendChild(b);
  });
}

function choose(c, i) {
  if (c.miss) {               // 原作の主人公と違う選択をした
    SC._missed.add(i);
    $('choices').innerHTML = '';
    addLine(['<', c.t]);
    addLine(['!', 'ページが、ざわりと波打った。']);
    $('log').classList.remove('tear'); void $('log').offsetWidth; $('log').classList.add('tear');
    [].concat(c.miss).forEach(m => addLine(Array.isArray(m) ? m : [TEACHER, m]));
    setTimeout(renderChoices, 350);
    return;
  }
  PREV = c.t.replace(/\*\*/g, '');
  go(val(c.to, S));
}

/* ---------- 問いかけ ---------- */
/* 選択リスト。multi=true で複数選択、false で一つだけ。選んだ項目は光る */
function checkList(items, picked, multi, onChange) {
  const box = $('choices'); box.innerHTML = '';
  const btns = items.map((it, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ch pick' + (multi ? '' : ' radio');
    b.style.animationDelay = (i * 50) + 'ms';
    b.innerHTML = `<span class="pt">${fmt(A(it.t))}${it.who ? `<span class="whom">${esc(it.who)}</span>` : ''}</span>`;
    b.onclick = () => {
      const on = !b.classList.contains('on');
      if (!multi) btns.forEach(x => mark(x, false));
      mark(b, multi ? on : true);
      if (onChange) onChange(get());
    };
    box.appendChild(b);
    return b;
  });
  function mark(b, on) {
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  function get() { return btns.map((b, i) => b.classList.contains('on') ? i : -1).filter(i => i >= 0); }
  btns.forEach((b, i) => mark(b, picked.includes(i)));
  return get;
}

function askMirror() {
  const M = EP.mirror;
  const go2 = document.createElement('button');
  const label = sel => { go2.textContent = sel.length ? `これが、いまのわたし（${sel.length}つ）` : 'どれも当てはまらない'; };
  const get = checkList(M.items, rec(EP.id).mirror || [], true, label);
  go2.className = 'btn primary ch';
  label(get());
  go2.onclick = () => {
    S.mirror = get();
    go('mirrorReply');
  };
  $('choices').appendChild(go2);
}

function askResolve() {
  const R = EP.resolve, r = rec(EP.id);
  const OWN = R.items.length;                       // 最後の項目＝「自分の言葉で書く」
  const items = R.items.concat([{t: '自分の言葉で書く'}]);
  const ta = document.createElement('textarea');
  ta.id = 'note'; ta.maxLength = 48; ta.rows = 2;
  ta.placeholder = '栞にはさむ言葉を、ひとつだけ';
  ta.value = r.note || '';
  const go2 = document.createElement('button');
  go2.className = 'btn primary ch';
  const update = sel => {
    const own = sel[0] === OWN;
    ta.style.display = own ? '' : 'none';
    go2.textContent = sel.length ? 'この言葉を、栞に書く' : 'ひとつ選んでください';
    go2.disabled = !sel.length;
    if (own) setTimeout(() => ta.focus(), 50);
  };
  const prev = r.note ? [OWN] : (r.resolve || []).slice(0, 1);
  const get = checkList(items, prev, false, update);
  update(get());
  go2.onclick = () => {
    const sel = get();
    if (!sel.length) return;
    if (sel[0] === OWN) {
      const note = ta.value.split('\n').map(x => x.trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 4).join('\n');
      if (!note) { toast('栞にはさむ言葉を、書いてみてください'); ta.focus(); return; }
      S.resolve = []; S.note = note;
    } else { S.resolve = sel; S.note = ''; }
    finish();
  };
  // 書く欄は「自分の言葉で書く」のすぐ下に出す
  $('choices').lastChild.after(ta);
  $('choices').append(go2);
}

function today() { const d = new Date(); return [d.getFullYear(), d.getMonth() + 1, d.getDate()]; }
function cardText(ep, r) { return r.note || (r.resolve.length ? A(ep.resolve.items[r.resolve[0]].card) : ep.resolve.quote); }

function finish() {
  const r = rec(EP.id), first = !r.date;
  if (first) r.n = doneCount() + 1;        // 何冊目の栞か（栞のデザインと、節目のごほうびに使う）
  r.date = r.date || today();
  r.mirror = S.mirror; r.resolve = S.resolve; r.note = S.note || '';
  r.reads = (r.reads || 0) + 1;
  save();
  const ms = first && milestones().includes(r.n);
  $('lessonBox').innerHTML = `
    ${ms ? `<div class="msbox">${OWL}<p><span class="mst">${r.n >= BOOKS.length ? '全刊読破' : r.n + '冊目の節目'}</span>${A(msMessage(r.n))}</p></div>` : ''}
    <div class="head">あなたの栞${r.n ? `<small>（${r.n}枚目）</small>` : ''}</div>
    ${cardHTML(EP, r)}
    ${r.resolve.length ? `<ul>${r.resolve.map(i => `<li>${fmt(A(EP.resolve.items[i].t))}</li>`).join('')}</ul>` : ''}
    <p class="quote">${fmt(EP.resolve.quote)}<span>――『${esc(EP.title)}』より</span></p>
    <div class="ovrec">
      <div class="lk"><span>この本、好き？</span>${likeHTML(EP.id)}</div>
      <textarea id="ovMemo" rows="3" placeholder="感想を、自由に（あとから本のページでも書けます）">${esc(r.memo || '')}</textarea>
    </div>
    <button class="btn primary" id="lessonOk">この栞を、本に挟む</button>`;
  $('lessonOv').classList.add('on');
  wireLike($('lessonBox'), EP.id);
  $('ovMemo').oninput = () => { rec(EP.id).memo = $('ovMemo').value; save(); };
  $('lessonOk').onclick = () => { $('lessonOv').classList.remove('on'); openBook(EP, true); };
}
function cardHTML(ep, r, small) {
  const lines = cardText(ep, r).split('\n'), t = tierOf(r.n);
  return `<div class="card t${t}${small ? ' sm' : ''}"><div class="v">${lines.map(x => `<span>${esc(x)}</span>`).join('')}</div><div class="src">『${esc(ep.title)}』を読んで</div>${t === 'all' ? `<span class="crest">${OWL}</span>` : ''}</div>`;
}

/* ---------- 節目のごほうび（10・50・100・150冊、その先は50冊ごと、そして全刊） ---------- */
function milestones() {
  const T = BOOKS.length, a = [10, 50, 100, 150].filter(x => x < T);
  for (let x = 200; x < T; x += 50) a.push(x);
  a.push(T);
  return a;
}
const doneCount = () => EPS.filter(e => REC[e.id] && REC[e.id].date).length;
function tierOf(n) {
  if (!n) return 0;
  if (n >= BOOKS.length) return 'all';
  return Math.min(4, milestones().filter(x => x < BOOKS.length && n >= x).length);
}
const TIER_NAME = ['', '若葉', '藍', '金', '星空'];
function msMessage(n) {
  const T = BOOKS.length;
  if (n >= T) return `……${T}冊、すべての本に、栞が挟まった。ここまで来た人は、そう多くはおらん。<br>お前さんの栞帳は、もう、お前さんだけの一冊の本じゃ。<b>最後の栞は、金の地に、ふくろうの紋じゃ。</b>`;
  if (n === 10) return '十冊目の栞じゃ。……十冊読んだ人は、もう「本を読む人」じゃよ。<b>ここからの栞は、若葉の色になる。</b>';
  if (n === 50) return '五十冊。……このあたりから、本と本が、頭の中でつながりはじめる。ある本の言葉が、別の本の場面を思い出させる。<b>ここからの栞は、藍の色になる。</b>';
  if (n === 100) return '百冊！……「百選」の百を、ひとつ読みきったのと同じじゃ。胸をはりなされ。<b>ここからの栞は、金の色になる。</b>';
  if (n === 150) return '百五十冊。……ゴールは、もう見えておる。あわてず、一冊ずつじゃ。<b>ここからの栞は、星空の色になる。</b>';
  return `${n}冊目の栞じゃ。……よくぞ、ここまで来た。`;
}
function nextMilestone() { const d = doneCount(); return milestones().find(x => x > d); }

/* 古い記録に「何枚目の栞か」をつける（読了日の順） */
(() => {
  const key = r => r.date ? r.date[0] * 10000 + r.date[1] * 100 + r.date[2] : 0;
  const need = Object.entries(REC).filter(([, r]) => r && r.date && !r.n);
  if (!need.length) return;
  let max = Math.max(0, ...Object.values(REC).map(r => (r && r.n) || 0));
  need.sort((a, b) => key(a[1]) - key(b[1])).forEach(([, r]) => { r.n = ++max; });
  save();
})();

/* ---------- 好き度（5段階）・感想・本で読んだ日 ---------- */
const likeOf = t => { const e = EPT(t); return (e && REC[e.id] && REC[e.id].like) || 0; };
const likeHTML = id => { const v = (REC[id] && REC[id].like) || 0; return `<span class="like" role="group" aria-label="好き度">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-v="${i}" class="${i <= v ? 'on' : ''}" aria-label="${i}">♥</button>`).join('')}</span>`; };
function wireLike(root, id) {
  root.querySelectorAll('.like button').forEach(b => b.onclick = () => {
    const r = rec(id), v = +b.dataset.v;
    r.like = r.like === v ? 0 : v; save();
    root.querySelectorAll('.like button').forEach(x => x.classList.toggle('on', +x.dataset.v <= r.like));
  });
}
const ymd = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? `${+m[1]}年${+m[2]}月${+m[3]}日` : ''; };
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/* ---------- 本棚 ---------- */
/* ---------- 掲載（中等部・高等部）と、持っている本 ---------- */
let OWN = {};
try { OWN = JSON.parse(localStorage.getItem('yrt_own') || '{}') || {}; } catch (e) {}
const saveOwn = () => { try { localStorage.setItem('yrt_own', JSON.stringify(OWN)); } catch (e) {} };
let VIEW = {mode: 'rack', filter: 'all', sort: 'aiu', choices: false, fsz: 'm'};
try { Object.assign(VIEW, JSON.parse(localStorage.getItem('yrt_view') || '{}')); } catch (e) {}
if ((VIEW.v || 0) < 2) { VIEW.sort = 'aiu'; VIEW.v = 2; }   // 並びの初期値を「あいうえお順」に切りかえた
if (VIEW.v < 3) { VIEW.choices = false; VIEW.v = 3; }        // 読むときの選択肢は、初期値「なし」
const saveView = () => { try { localStorage.setItem('yrt_view', JSON.stringify(VIEW)); } catch (e) {} };
/* 本文の文字の大きさ（小・中・大） */
const FSZ = {s: ['小', .9], m: ['中', 1], l: ['大', 1.15], xl: ['特大', 1.3]};
const applyFsz = () => document.documentElement.style.setProperty('--rs', (FSZ[VIEW.fsz] || FSZ.m)[1]);
applyFsz();
let QUERY = '';

/* ---------- 図書館のオルゴール（オリジナル曲。tools/orgel.py・orgel2.py で楽譜から合成） ----------
   初期値は「なし」。オンにすると、本棚でも本の中でも流れ続ける。ほかのアプリに切りかえると止まる。
   曲は「遠い日の図書館」「栞のワルツ」「交互に」から選べる。 */
const SONGS = {
  tooi:   {src: 'orgel2.mp3?v=1', title: '遠い日の図書館', note: '映画音楽のような、なつかしくて切ない曲'},
  shiori: {src: 'orgel.mp3?v=1',  title: '栞のワルツ',     note: '3拍子の、やさしいワルツ'},
};
const BGM = $('bgm');
let bgmFade = 0, bgmWait = false, bgmAlt = 'tooi';
if (!VIEW.song || (VIEW.song !== 'alt' && !SONGS[VIEW.song])) VIEW.song = 'tooi';
const otherSong = k => k === 'tooi' ? 'shiori' : 'tooi';
const bgmKey = () => VIEW.song === 'alt' ? bgmAlt : VIEW.song;
function bgmFadeTo(v, done) {
  clearInterval(bgmFade);
  bgmFade = setInterval(() => {
    const d = v - BGM.volume, s = Math.sign(d) * Math.min(Math.abs(d), .06);
    try { BGM.volume = Math.max(0, Math.min(1, BGM.volume + s)); } catch (e) {}
    if (Math.abs(v - BGM.volume) < .01) { clearInterval(bgmFade); if (done) done(); }
  }, 60);
}
/* 選んでいる曲を、オーディオに入れる（入れかえたときは true） */
function bgmLoad() {
  const k = bgmKey();
  BGM.loop = VIEW.song !== 'alt';
  if (BGM.dataset.k === k) return false;
  BGM.dataset.k = k; BGM.src = SONGS[k].src;
  if ('mediaSession' in navigator && window.MediaMetadata) {
    try { navigator.mediaSession.metadata = new MediaMetadata({title: SONGS[k].title, artist: '名作のなかへ', album: '図書館のオルゴール'}); } catch (e) {}
  }
  bgmUI();
  return true;
}
function bgmPlay() {
  if (!VIEW.bgm || !BGM) return;
  bgmLoad();
  if (!BGM.paused) return bgmFadeTo(.8);
  try { BGM.volume = 0; } catch (e) {}
  const p = BGM.play();
  if (p && p.then) p.then(() => bgmFadeTo(.8), bgmTap); else bgmFadeTo(.8);
}
/* 音は、画面にふれたあとでないと鳴らせない（ブラウザの決まり）。次にふれたときに始める */
function bgmTap() {
  if (bgmWait) return; bgmWait = true;
  const go = () => { bgmWait = false; ['pointerdown', 'keydown'].forEach(t => document.removeEventListener(t, go, true)); bgmPlay(); };
  ['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, go, true));
}
function bgmStop() { if (BGM && !BGM.paused) bgmFadeTo(0, () => BGM.pause()); }
/* 曲を変えたとき：鳴っていれば、そっと消してから次の曲へ */
function bgmSwitch() {
  if (!VIEW.bgm || BGM.paused || BGM.dataset.k === bgmKey()) { bgmLoad(); return bgmPlay(); }
  bgmFadeTo(0, () => { BGM.pause(); bgmPlay(); });
}
function bgmUI() {
  const b = $('bgmBtn'); if (!b) return;
  b.setAttribute('aria-pressed', VIEW.bgm ? 'true' : 'false');
  $('bgmTx').textContent = VIEW.bgm ? SONGS[bgmKey()].title : 'オルゴール　オフ';
  $('bgmSw').hidden = !VIEW.bgm;
}
function setBgm(on) {
  VIEW.bgm = on; saveView(); bgmUI();
  if (on) bgmPlay(); else bgmStop();
  if ($('settings').innerHTML) renderSettings();
}
function setSong(k) {
  if (k === 'alt') bgmAlt = VIEW.song === 'alt' ? bgmAlt : (VIEW.song === 'shiori' ? 'shiori' : 'tooi');
  VIEW.song = k; saveView(); bgmSwitch(); bgmUI();
  if ($('settings').innerHTML) renderSettings();
}
if (BGM) {
  $('bgmBtn').onclick = e => { e.stopPropagation(); setBgm(!VIEW.bgm); toast(VIEW.bgm ? `♪ ${SONGS[bgmKey()].title}（音量は、端末の音量ボタンで）` : 'オルゴールを止めました'); };
  /* 本棚の「曲を変える」：2曲を入れかえる（交互のときは、次の曲へ） */
  $('bgmSw').onclick = e => {
    e.stopPropagation();
    if (VIEW.song === 'alt') { bgmAlt = otherSong(bgmAlt); bgmSwitch(); bgmUI(); } else setSong(otherSong(VIEW.song));
    toast(`♪ ${SONGS[bgmKey()].title}`);
  };
  BGM.addEventListener('ended', () => { if (VIEW.song === 'alt') { bgmAlt = otherSong(bgmAlt); bgmPlay(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (!BGM.paused) BGM.pause(); } else bgmPlay(); });
  bgmLoad(); bgmUI();
  if (VIEW.bgm) bgmPlay();
}

const BOOK = t => BOOKS.find(b => b[0] === t);
const memb = l => /中/.test(l) && /高/.test(l) ? 'both' : /中/.test(l) ? 'j' : 'h';
const MEMB = {both: ['両', '中等部・高等部の両方'], j: ['中', '中等部のみ'], h: ['高', '高等部のみ']};
const badge = (l, long) => `<span class="bd bd-${memb(l)}">${MEMB[memb(l)][long ? 1 : 0]}</span>`;
const fmtLists = l => l.split('・').map(x => x.replace(/^中日(\d+)/, '中等部（日本）$1番').replace(/^中海(\d+)/, '中等部（海外）$1番').replace(/^高(\d+)/, '高等部 $1番')).join('／');
const liveMap = () => Object.fromEntries(EPS.map(e => [e.title, e.id]));
const EPT = t => EPS.find(e => e.title === t);
const recT = t => { const e = EPT(t); return (e && REC[e.id]) || {}; };
const appDone = t => !!recT(t).date;      // アプリで読了（栞を挟んだ）
const paperRead = t => !!recT(t).paper;   // 紙の本で読んだ
function toggleOwn(t) { if (OWN[t]) delete OWN[t]; else OWN[t] = 1; saveOwn(); return !!OWN[t]; }
const ownLabel = on => on ? '✓　持っている' : '□　この本を持っている';
/* しおり：持っている本は外枠だけ、本で読んだ本は塗りつぶし。アプリで読了した本は、本そのものを金の外枠で囲む */
const bmState = t => paperRead(t) ? 'read' : OWN[t] ? 'own' : '';
const ribbon = st => st ? `<svg class="rb ${st}" viewBox="0 0 12 22" aria-label="${st === 'read' ? '本で読んだ' : '持っている'}"><path d="M1.5 1H10.5V20L6 15.5L1.5 20Z"/></svg>` : '';
/* 本棚でだけ、古い本ほど使い古した感じを出す（書かれた年で5段階） */
/* 本の素材：1950年以降は紙の本、1900年代前半は布張り、それより古い本は革装（背に「バンド」と金箔の題） */
const matOf = b => { const y = b ? b[4] : 2000; return y >= 1950 ? 'pb' : y >= 1900 ? 'cl' : 'lt'; };
const hashN = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 1000003; return h; };
const hexes = ep => (ep && ep.cover[0].match(/#[0-9a-fA-F]{6}/g)) || ['#3a3f55'];
const lum = hex => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (r * 299 + g * 587 + b * 114) / 255000; };
/* 背表紙の色・文字色・高さ・厚み */
function spineVars(b, e) {
  const m = matOf(b), hx = hexes(e), c = hx[1] || hx[0], h = hashN(b[0]);
  const light = lum(c) > .58;
  const tc = m === 'pb' ? (e ? e.cover[1] : '#fff') : light ? '#3a2412' : '#e9c869';
  const base = {pb: 154, cl: 162, lt: 168}[m] + (h % 13);
  const thick = .78 + ((LEN_RANK[b[6]] || 4) - 1) * .09 + (h % 7) * .012;
  const lbl = ['#5a1a14', '#1e1a16', '#2a3a24', '#3a1a2a'][h % 4];
  /* 題名の文字：1列で11px以上にできなければ、2列に分けて大きく見せる */
  const n = [...b[0]].length, avail = base - (m === 'lt' ? 64 : 52);
  let r = n, fs = Math.min(14, avail / (n * 1.06)), c2 = null;
  if (fs < 11) { c2 = twoCols(b[0]); r = c2.r; fs = Math.min(12.5, avail / (r * 1.06)); }
  const tk = c2 ? Math.max(thick, 1.22) : thick;
  return {m, c2, style: `--c:${c};--tc:${tc};--lbl:${lbl};--fs:${fs.toFixed(1)}px;--r:${r};height:${base}px;flex-grow:${tk.toFixed(3)}`};
}
const wearOf = b => { const y = b ? b[4] : 2000; return y >= 1950 ? 0 : y >= 1900 ? 1 : y >= 1800 ? 2 : y >= 1600 ? 3 : 4; };

/* 評価：[4]年 [5]年の表示 [6]長さ [7]おすすめ [8]読みやすさ [9]有名度 [10]学び度 [11]読後感(1さわやか〜5ずっしり) [12]よみ */
const MOOD = ['', 'さわやか', 'あたたかい', 'しみじみ', 'ほろ苦い', 'ずっしり'];
const LEN_RANK = {S: 1, D: 2, M: 2, N: 3, P: 3, E: 3, L: 4, L2: 5, XL: 6};
const stars = n => `<span class="stars" aria-label="5段階中${n}">${'★'.repeat(n)}<span class="off">${'★'.repeat(5 - n)}</span></span>`;
const moodMeter = m => `<span class="mood"><small>明るい</small>${[1, 2, 3, 4, 5].map(i => `<i class="${i === m ? 'on' : ''}"></i>`).join('')}<small>重い</small><b>${MOOD[m]}</b></span>`;
function ratesHTML(b) {
  if (!b || b.length < 12) return '';
  return `<div class="rates">
    <div class="rt"><span>おすすめ度</span>${stars(b[7])}</div>
    <div class="rt"><span>読みやすさ</span>${stars(b[8])}</div>
    <div class="rt"><span>有名度</span>${stars(b[9])}</div>
    <div class="rt"><span>学び度</span>${stars(b[10])}</div>
    <div class="rt"><span>読後感</span>${moodMeter(b[11])}</div>
    <div class="rt"><span>書かれた年</span><span>${esc(b[5])}</span></div>
    <div class="rt"><span>長さ</span><span>${esc(BOOK_LEN[b[6]] || '')}</span></div>
    <p class="rnote">評価は、ミネル先生のめやすです。</p>
  </div>`;
}
const ratesMini = b => b.length < 12 ? '' : `<small class="rmini">おすすめ★${b[7]}・読みやすさ★${b[8]}・有名★${b[9]}・学び★${b[10]}・${MOOD[b[11]]}・${esc(b[5].replace(/（.*$/, ''))}・${esc((BOOK_LEN[b[6]] || '').split('・')[0])}</small>`;
const yomi = b => b[12] || b[0];
const SORTS = [
  ['aiu', 'あいうえお順', (a, b) => yomi(a).localeCompare(yomi(b), 'ja')],
  ['no', '番号順', null],
  ['like', '好きな順', (a, b) => likeOf(b[0]) - likeOf(a[0])],
  ['rec', 'おすすめ順', (a, b) => b[7] - a[7]],
  ['easy', '読みやすい順', (a, b) => b[8] - a[8]],
  ['fame', '有名な順', (a, b) => b[9] - a[9]],
  ['learn', '学び度の高い順', (a, b) => b[10] - a[10]],
  ['light', '読後感が明るい順', (a, b) => a[11] - b[11]],
  ['heavy', '読後感が重い順', (a, b) => b[11] - a[11]],
  ['new', '新しい順', (a, b) => b[4] - a[4]],
  ['old', '古い順', (a, b) => a[4] - b[4]],
  ['short', '短い順', (a, b) => (LEN_RANK[a[6]] || 9) - (LEN_RANK[b[6]] || 9)],
];
/* あいうえお順のときは「あ行・か行…」、番号順のときは「日本・海外」に分けて並べる */
const GYO = ['あいうえおゔぁぃぅぇぉ', 'かきくけこがぎぐげご', 'さしすせそざじずぜぞ', 'たちつてとだぢづでどっ', 'なにぬねの', 'はひふへほばびぶべぼぱぴぷぺぽ', 'まみむめも', 'やゆよゃゅょ', 'らりるれろ', 'わをん'];
const gyoOf = b => { const c = yomi(b)[0], k = GYO.findIndex(g => g.includes(c)); return k < 0 ? 'その他' : GYO[k][0] + '行'; };
function groupsOf(list) {
  const key = VIEW.sort === 'aiu' ? gyoOf : VIEW.sort === 'no' ? (b => b[2]) : null;
  if (!key) return [[null, list]];
  const g = new Map();
  list.forEach(b => { const k = key(b); if (!g.has(k)) g.set(k, []); g.get(k).push(b); });
  return [...g.entries()];
}
const hira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
const matchQ = (b, q) => { if (!q) return true; const n = x => hira(String(x || '')).replace(/[\s・　]/g, '').toLowerCase(); const k = n(q); return n(b[0]).includes(k) || n(b[1]).includes(k) || n(yomi(b)).includes(k); };

/* ---------- 表紙：絵、または、自分の本の写真 ---------- */
const PH = {};   // 書名 → 写真のURL（IndexedDB にしまった写真）
let CPREF = {};  // 書名 → 'art'（絵）／'photo'（写真）
try { CPREF = JSON.parse(localStorage.getItem('yrt_cover') || '{}') || {}; } catch (e) {}
const saveCpref = () => { try { localStorage.setItem('yrt_cover', JSON.stringify(CPREF)); } catch (e) {} };
const usePhoto = t => !!(OWN[t] && PH[t] && CPREF[t] !== 'art');
function idb() {
  return new Promise((res, rej) => {
    if (!window.indexedDB) return rej(new Error('no idb'));
    const r = indexedDB.open('meisaku', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('photos');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function phLoadAll() {
  try {
    const db = await idb();
    await new Promise(res => {
      const c = db.transaction('photos').objectStore('photos').openCursor();
      c.onsuccess = () => { const cur = c.result; if (!cur) return res(); PH[cur.key] = URL.createObjectURL(cur.value); cur.continue(); };
      c.onerror = () => res();
    });
  } catch (e) {}
}
async function phPut(t, blob) {
  const db = await idb();
  await new Promise((res, rej) => { const tx = db.transaction('photos', 'readwrite'); tx.objectStore('photos').put(blob, t); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
  if (PH[t]) URL.revokeObjectURL(PH[t]);
  PH[t] = URL.createObjectURL(blob);
}
async function phDel(t) {
  const db = await idb();
  await new Promise(res => { const tx = db.transaction('photos', 'readwrite'); tx.objectStore('photos').delete(t); tx.oncomplete = res; tx.onerror = res; });
  if (PH[t]) URL.revokeObjectURL(PH[t]);
  delete PH[t];
}
/* 写真を、表紙の形（たて2：よこ3）に切りぬいて小さくする */
function toCoverBlob(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const W = 480, H = 720, c = document.createElement('canvas'); c.width = W; c.height = H;
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s;
      c.getContext('2d').drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      URL.revokeObjectURL(url);
      c.toBlob(b => b ? res(b) : rej(new Error('blob')), 'image/jpeg', .85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); };
    img.src = url;
  });
}
function pickPhoto(t, done) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    try { await phPut(t, await toCoverBlob(f)); CPREF[t] = 'photo'; saveCpref(); toast('表紙を、あなたの本の写真にしました'); }
    catch (e) { toast('写真を読みこめませんでした'); }
    if (done) done();
  };
  inp.click();
}

/* 長い題を2列に分けるときは、「の」「・」などの切れ目で、なるべく半分ずつに分ける */
const BRK = 'のにとをはがへ・　 ）」';
function split2(t) {
  const ch = [...t], n = ch.length, mid = Math.ceil(n / 2);
  let best = mid, score = 1e9;
  const kata = c => /[ァ-ヴー]/.test(c), kanji = c => /[一-龥]/.test(c);
  for (let i = 2; i <= n - 2; i++) {
    const x = ch[i - 1], y = ch[i];
    const sc = Math.max(i, n - i) + (BRK.includes(x) ? 0 : 1.6) + (/[ー・、）」ァィゥェォャュョッ]/.test(y) ? 3 : 0)
      + (kata(x) && kata(y) ? 5 : 0) + (kanji(x) && kanji(y) ? 1.2 : 0) + (y === '（' ? -1 : 0);
    if (sc < score) { score = sc; best = i; }
  }
  return [ch.slice(0, best).join('').trim(), ch.slice(best).join('').trim()];
}
const twoCols = t => { const [a, b] = split2(t); return {html: `${esc(a)}<br>${esc(b)}`, r: Math.max([...a].length, [...b].length)}; };
/* 表紙の題簽：長い題は2列に分けて、読みやすい大きさにする */
function titleSlip(t) {
  const n = [...t].length;
  if (n <= 8) return `<span class="ct${n <= 6 ? '' : ' m'}" style="--r:${n}">${esc(t)}</span>`;
  const c = twoCols(t);
  return `<span class="ct l" style="--r:${c.r}">${c.html}</span>`;
}
function coverHTML(ep, tag, onShelf) {
  const bk = BOOK(ep.title), t = ep.title;
  const photo = usePhoto(t), w = onShelf && !photo ? wearOf(bk) : 0;
  return `<${tag} class="cover m-${matOf(bk)}${photo ? ' photo' : ''}${appDone(t) ? ' done' : ''}${w ? ' w' + w : ''}" data-ep="${ep.id}" style="background:${ep.cover[0]};color:${ep.cover[1]}">
    ${photo ? `<img class="ph" src="${PH[t]}" alt="">` : (window.coverArt ? coverArt(ep) : '')}
    <span class="tex"></span>
    ${w ? '<span class="wear"></span>' : ''}
    ${photo ? '' : titleSlip(t)}
    ${ribbon(bmState(t))}
    <span class="cfoot"><span class="ca">${photo ? '' : esc(ep.author)}</span>${bk ? badge(bk[3]) : ''}</span></${tag}>`;
}

/* ---------- ミネル先生のおすすめ：次の一冊（やさしい順）と、今日の一冊（日がわり） ---------- */
let NEXTI = 0;
function nextList() {
  const L = BOOKS.filter(b => !appDone(b[0]) && EPT(b[0]));
  const score = b => [(LEN_RANK[b[6]] || 9), -b[8], -b[7]];
  return L.map((b, i) => [b, i]).sort((x, y) => { const a = score(x[0]), c = score(y[0]); for (let k = 0; k < 3; k++) if (a[k] !== c[k]) return a[k] - c[k]; return x[1] - y[1]; }).map(x => x[0]);
}
function todayPick() {
  const L = BOOKS.filter(b => !appDone(b[0]) && EPT(b[0]));
  const pool = L.length ? L : BOOKS.filter(b => EPT(b[0]));
  const d = todayISO().replace(/-/g, ''); let h = 0;
  for (const c of d) h = (h * 31 + c.charCodeAt(0)) % 100003;
  return pool[h % pool.length];
}
function picksHTML() {
  const nl = nextList(); if (NEXTI >= nl.length) NEXTI = 0;
  const nx = nl[NEXTI], td = todayPick();
  const one = (b, label, why, id) => b ? `<div class="pick" data-t="${esc(b[0])}" id="${id}">
      ${coverHTML(EPT(b[0]), 'div')}<div class="pi"><small>${label}</small><b>${esc(b[0])}</b><span>${why}</span></div></div>` : '';
  const len = b => (BOOK_LEN[b[6]] || '').split('・')[0];
  return `<div class="picks">
      ${one(nx, '次の一冊', nx ? `${esc(len(nx))}・読みやすさ★${nx[8]}<br><button type="button" class="more" id="pkMore">ほかの本</button>` : '', 'pkNext')}
      ${one(td, '今日の一冊', '日がわりで、ミネル先生が選んだ本', 'pkToday')}
    </div>
    <button class="btn shbtn" id="toCho">栞帳を開く<small>（${doneCount()}枚）</small></button>`;
}
function wirePicks() {
  document.querySelectorAll('#picksBox .pick').forEach(p => p.onclick = e => {
    if (e.target.closest('#pkMore')) { NEXTI++; $('picksBox').innerHTML = picksHTML(); wirePicks(); return; }
    openBook(EPT(p.dataset.t));
  });
  $('toCho').onclick = openCho;
}

function openShelf() {
  show('shelf');
  const done = doneCount();
  $('cnt').textContent = done;
  $('papc').textContent = BOOKS.filter(b => paperRead(b[0])).length;
  let msg;
  const all = EPS.length >= BOOKS.length;   // 158冊すべてに入れるようになったか
  if (done >= EPS.length) msg = 'ミネルヴァのふくろうは、黄昏に飛び立つ――という言葉がある。知恵はいつも、事が終わったあとにやってくる、という意味じゃ。<br>だから人は本を読む。<b>他人の人生で、先に一度、学んでおくために。</b><br>' + (all
    ? '……これで、すべての本に栞が挟まった。じゃが、本当の読書は、ここからじゃ。<b>栞を挟んだ本を、今度は、紙の本で開いてごらん。</b>'
    : '……残りの本は、まだ書架の奥で眠っておる。また来なさい。');
  else if (done) {
    const nm = nextMilestone();
    msg = 'おかえり。本に挟んだ栞は、<b>栞帳</b>で、いつでも読み返せる。' + (nm ? `<br>次の節目（${nm}冊）まで、あと<b>${nm - done}冊</b>じゃ。` : '');
    const last = localStorage.getItem('yrt_bk');
    if (done >= 5 && (!last || Date.now() - new Date(last).getTime() > 30 * 864e5)) msg += '<br>そうそう、<b>記録のバックアップ</b>も、時々、取っておきなされ（一番下の「記録と設定」から）。';
  } else msg = 'ようこそ、夜の図書館へ。わしは司書のミネル。<br>本が読めなくても、かまわん。<b>本の中に入って、主人公になってみればいい。</b>迷ったら、下の「次の一冊」から初めてごらん。';
  $('shelfMsg').innerHTML = OWL + `<p>${msg}</p>`;
  $('picksBox').innerHTML = picksHTML(); wirePicks();
  $('rackNote').innerHTML = '中等部・高等部「読書100選」を合わせた158冊。古い時代の本ほど、使いこまれた姿で並んでいます。<br>背表紙をタップすると、本の紹介、「持っている」「本で読んだ」の記録ができます。';
  renderSettings();
  renderRacks();
}

const MODES = [['rack', '背表紙'], ['cover', '表紙'], ['list', 'リスト'], ['mine', 'わたしの本']];
function setMode(m, dir) {
  if (m === VIEW.mode) return;
  const i = MODES.findIndex(x => x[0] === VIEW.mode), j = MODES.findIndex(x => x[0] === m);
  VIEW.mode = m; saveView(); renderRacks();
  const el = $('racks'); el.classList.remove('sw-l', 'sw-r'); void el.offsetWidth;
  el.classList.add((dir || (j > i ? 'l' : 'r')) === 'l' ? 'sw-l' : 'sw-r');
}
// 本棚の上を左右にスワイプすると、背表紙・表紙・リストを切り替える
(() => {
  let x0 = 0, y0 = 0, t0 = 0, on = false;
  const el = $('racks');
  el.addEventListener('animationend', () => el.classList.remove('sw-l', 'sw-r'));
  el.addEventListener('touchstart', e => { if (e.touches.length !== 1) { on = false; return; } on = true; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); }, {passive: true});
  el.addEventListener('touchend', e => {
    if (!on) return; on = false;
    const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.8 || Date.now() - t0 > 800) return;
    const i = MODES.findIndex(x => x[0] === VIEW.mode), j = i + (dx < 0 ? 1 : -1);
    if (j < 0 || j >= MODES.length) return;
    setMode(MODES[j][0], dx < 0 ? 'l' : 'r');
  }, {passive: true});
})();

function renderRacks() {
  const live = liveMap();
  $('ownc').textContent = BOOKS.filter(b => OWN[b[0]]).length;
  const FILTERS = [
    ['all', 'すべて', () => true],
    ['j', '中等部', b => /中/.test(b[3])],
    ['h', '高等部', b => /高/.test(b[3])],
    ['both', '両方', b => memb(b[3]) === 'both'],
    ['done', 'アプリで読了', b => appDone(b[0])],
    ['own', '持っている', b => OWN[b[0]]],
    ['notown', '持っていない', b => !OWN[b[0]]],
    ['paper', '本で読んだ', b => paperRead(b[0])],
  ];
  if (!FILTERS.some(f => f[0] === VIEW.filter)) VIEW.filter = 'all';
  if (!MODES.some(m => m[0] === VIEW.mode)) VIEW.mode = 'rack';
  $('tabs').innerHTML = MODES.map(([k, t]) => `<button data-v="${k}" class="${VIEW.mode === k ? 'on' : ''}">${t}</button>`).join('');
  $('chips').innerHTML = FILTERS.map(([k, t, f]) => `<button data-f="${k}" class="${VIEW.filter === k ? 'on' : ''}">${t} ${BOOKS.filter(f).length}</button>`).join('');
  $('tabs').querySelectorAll('button').forEach(b => b.onclick = () => setMode(b.dataset.v));
  $('chips').querySelectorAll('button').forEach(b => b.onclick = () => { VIEW.filter = b.dataset.f; saveView(); renderRacks(); });
  if (!SORTS.some(x => x[0] === VIEW.sort)) VIEW.sort = 'aiu';
  $('sort').innerHTML = SORTS.map(([k, t]) => `<option value="${k}"${VIEW.sort === k ? ' selected' : ''}>${t}</option>`).join('');
  $('sort').onchange = () => { VIEW.sort = $('sort').value; saveView(); renderRacks(); };
  const mine = VIEW.mode === 'mine';
  const list = BOOKS.filter(FILTERS.find(f => f[0] === VIEW.filter)[2]).filter(b => matchQ(b, QUERY)).filter(b => !mine || OWN[b[0]]);
  const cmp = SORTS.find(x => x[0] === VIEW.sort)[2];
  if (cmp) list.sort(cmp);   // 同じ評価のときは、もとの番号順のまま
  if (!list.length) {
    $('racks').innerHTML = `<p class="small" style="opacity:.6;text-align:center;padding:20px 0">${QUERY ? 'その言葉にあてはまる本は、見つかりませんでした。' : mine ? '「持っている」にした本が、ここに並びます。<br>背表紙をタップして、持っている本にチェックしてください。' : 'あてはまる本は、まだありません。'}</p>`;
    return;
  }
  const head = (g, l) => g ? `<h3>${esc(g)}<small>（${l.length}冊）</small></h3>` : '';
  const groups = groupsOf(list);
  if (VIEW.mode === 'cover' || mine) {
    const nph = list.filter(b => PH[b[0]]).length;
    $('racks').innerHTML = (mine ? `<p class="mineh">わたしの本　${list.length}冊<small>（写真の表紙 ${nph}冊）</small>${list.length > nph ? '<br><span>表紙をタップして、本のページから、自分の本の写真を撮れます。</span>' : ''}</p>` : '')
      + groups.map(([g, l]) => head(g, l) + `<div class="feat">${l.map(b => live[b[0]] ? coverHTML(EPS.find(e => e.id === live[b[0]]), 'button', true) : '').join('')}</div>`).join('');
    $('racks').querySelectorAll('.cover').forEach(b => b.onclick = () => openBook(EPS.find(e => e.id === b.dataset.ep)));
  } else if (VIEW.mode === 'rack') {
    const spine = b => {
      const e = EPT(b[0]), w = wearOf(b), v = spineVars(b, e);
      return `<button class="spine m-${v.m}${v.c2 ? ' c2' : ''}${appDone(b[0]) ? ' done' : ''}${w ? ' w' + w : ''}" data-t="${esc(b[0])}" title="${esc(b[0])}／${esc(b[1] || '')}" style="${v.style}"><span class="tex"></span>${w ? '<span class="wear"></span>' : ''}${ribbon(bmState(b[0]))}<span class="st">${v.c2 ? v.c2.html : esc(b[0])}</span>${badge(b[3])}</button>`;
    };
    const rows = l => { const out = []; for (let k = 0; k < l.length; k += 10) out.push(l.slice(k, k + 10)); return out; };
    $('racks').innerHTML = groups.map(([g, l]) => head(g, l) + rows(l).map(r => `<div class="shelfrow">${r.map(spine).join('')}${r.length < 10 ? '<span class="bookend"></span>' : ''}</div>`).join('')).join('');
    $('racks').querySelectorAll('.spine').forEach(s => s.onclick = () => openSheet(s.dataset.t));
  } else {
    $('racks').innerHTML = groups.map(([g, l]) => head(g, l) + `<div class="llist">${l.map(b => `
      <div class="lrow${OWN[b[0]] ? ' own' : ''}" data-t="${esc(b[0])}" role="button" aria-pressed="${OWN[b[0]] ? 'true' : 'false'}">
        <span class="ck">${OWN[b[0]] ? '✓' : ''}</span>
        <span class="lt"><b>${esc(b[0])}${paperRead(b[0]) ? ribbon('read') : ''}${appDone(b[0]) ? '<i class="appd">アプリ読了</i>' : ''}${likeOf(b[0]) ? `<i class="lkm">${'♥'.repeat(likeOf(b[0]))}</i>` : ''}</b><small>${esc(b[1] || '―')}　${esc(fmtLists(b[3]))}</small>${ratesMini(b)}</span>
        ${badge(b[3])}${live[b[0]] ? `<button class="go" data-ep="${live[b[0]]}">ひらく</button>` : ''}
      </div>`).join('')}</div>`).join('');
    $('racks').querySelectorAll('.lrow').forEach(r => r.onclick = e => {
      if (e.target.closest('.go')) { openBook(EPS.find(x => x.id === e.target.closest('.go').dataset.ep)); return; }
      const on = toggleOwn(r.dataset.t);
      r.classList.toggle('own', on); r.setAttribute('aria-pressed', on);
      r.querySelector('.ck').textContent = on ? '✓' : '';
      $('ownc').textContent = BOOKS.filter(b => OWN[b[0]]).length;
    });
  }
}

/* 本で読んだ日の記録（本のページと、背表紙のカードで使う） */
function paperHTML(id) {
  const v = (REC[id] && REC[id].paper) || '';
  return `<div class="paper"><span class="pl">📖 本で読んだ日</span>
    <input type="date" value="${v}" max="${todayISO()}" aria-label="本で読んだ日">
    <button type="button" class="pt">${v ? '消す' : '今日読んだ'}</button></div>`;
}
function wirePaper(root, id, onChange) {
  const box = root.querySelector('.paper'); if (!box) return;
  const inp = box.querySelector('input'), bt = box.querySelector('.pt');
  const set = v => { const r = rec(id); if (v) r.paper = v; else delete r.paper; save(); inp.value = v || ''; bt.textContent = v ? '消す' : '今日読んだ'; if (onChange) onChange(); };
  inp.onchange = () => set(inp.value);
  bt.onclick = () => set(inp.value ? '' : todayISO());
}

/* 背表紙をタップしたときの小さなカード */
function openSheet(title) {
  const b = BOOK(title), id = liveMap()[title], ep = EPT(title);
  const draw = () => {
    $('sheet').innerHTML = `
      <div class="shtop">${ep ? coverHTML(ep, 'div') : ''}<div>
        <span class="small mute">${esc(b[2])}</span>
        <h3>${esc(b[0])}</h3>
        <p>${esc(b[1] || '著者不詳')}</p>
        <p>${badge(b[3], true)}${appDone(title) ? ' <i class="appd">アプリで読了</i>' : ''}</p>
        <p class="small">${esc(fmtLists(b[3]))}</p></div></div>
      ${ratesHTML(b)}
      <button class="btn owntg${OWN[title] ? ' on' : ''}" id="shOwn">${ownLabel(OWN[title])}</button>
      ${id ? paperHTML(id) : ''}
      ${OWN[title] ? `<button class="btn" id="shPh" style="text-align:center">📷　${PH[title] ? '表紙の写真を撮りなおす' : '表紙を、自分の本の写真にする'}</button>` : ''}
      ${id ? '<button class="btn primary" id="shGo">この本の扉を開く</button>' : '<p class="small mute">この本の物語は、まだ書架の奥で準備中です。</p>'}
      <button class="btn ghost" id="shClose">とじる</button>`;
    $('shOwn').onclick = () => { toggleOwn(title); draw(); };
    if (id) wirePaper($('sheet'), id, draw);
    if ($('shPh')) $('shPh').onclick = () => pickPhoto(title, draw);
    $('shClose').onclick = closeSheet;
    if (id) $('shGo').onclick = () => { closeSheet(); openBook(EPS.find(e => e.id === id)); };
  };
  draw();
  $('sheetOv').classList.add('on');
}
function closeSheet() { $('sheetOv').classList.remove('on'); if ($('shelf').classList.contains('on')) openShelfKeep(); }
/* 本棚の表示を、スクロール位置を保ったまま描きなおす */
function openShelfKeep() { const y = window.scrollY; openShelf(); window.scrollTo(0, y); }

/* 本のページの「表紙」：絵か、自分の本の写真か */
function covSelHTML(ep) {
  const t = ep.title;
  if (!OWN[t]) return `<p class="small mute" style="margin:0">この本を「持っている」にすると、表紙を、あなたの本の写真にできます。</p>`;
  const ph = !!PH[t], cur = usePhoto(t) ? 'photo' : 'art';
  return `<div class="seg"><button data-c="art" class="${cur === 'art' ? 'on' : ''}">絵の表紙</button><button data-c="photo" class="${cur === 'photo' ? 'on' : ''}"${ph ? '' : ' disabled'}>写真の表紙</button></div>
    <button class="btn" id="phTake" style="text-align:center">📷　${ph ? '写真を撮りなおす・選びなおす' : '自分の本の写真を撮る・選ぶ'}</button>
    ${ph ? '<button class="btn ghost" id="phDel">写真を消す</button>' : ''}
    <p class="small mute" style="margin:0">写真は、この端末の中だけにしまわれます（「記録と設定」で書き出せます）。</p>`;
}
function wireCovSel(ep) {
  const t = ep.title, box = $('covsel'); if (!box) return;
  const redraw = () => { box.innerHTML = covSelHTML(ep); $('bkCover').innerHTML = coverHTML(ep, 'div'); wireCovSel(ep); };
  box.querySelectorAll('.seg button').forEach(b => b.onclick = () => { CPREF[t] = b.dataset.c; saveCpref(); redraw(); });
  if ($('phTake')) $('phTake').onclick = () => pickPhoto(t, redraw);
  if ($('phDel')) $('phDel').onclick = async () => { if (!confirm('この本の表紙の写真を消しますか？')) return; await phDel(t); delete CPREF[t]; saveCpref(); redraw(); };
}

function openBook(ep, justDone) {
  const r = rec(ep.id), d = r.date, bk = BOOK(ep.title);
  const el = $('book');
  el.innerHTML = `
    <div class="bk-top">
      <div id="bkCover">${coverHTML(ep, 'div')}</div>
      <div class="bk-meta">
        <span>${bk ? badge(bk[3], true) : ''}</span>
        <span class="small mute">${bk ? esc(fmtLists(bk[3])) : esc(ep.lists)}</span>
        <h2>${esc(ep.title)}</h2>
        <span>${esc(ep.author)}（${esc(ep.year)}）</span>
        <span class="small">${esc(ep.blurb)}</span>
        <div class="done">アプリで読了　${d ? `<b>${d[0]}</b> 年 <b>${d[1]}</b> 月 <b>${d[2]}</b> 日${r.n ? `<small>（${r.n}枚目の栞）</small>` : ''}` : '<span class="mute">まだ</span>'}</div>
      </div>
    </div>
    <div class="sec myrec"><h3>わたしの記録</h3>
      ${paperHTML(ep.id)}
      <div class="lk"><span>この本、好き？</span>${likeHTML(ep.id)}</div>
      <textarea id="bkMemo" rows="4" placeholder="感想を、自由に。読書感想文の下書きにもなります。">${esc(r.memo || '')}</textarea>
      <button class="btn" id="bkDraft" style="text-align:center">📝　感想文の下書きを作る</button>
      <div id="draftBox"></div>
    </div>
    <div class="sec"><h3>表紙</h3><div id="covsel" class="covsel">${covSelHTML(ep)}</div></div>
    ${bk ? `<div class="sec">${ratesHTML(bk)}</div>` : ''}
    ${d ? `
    <div class="sec mine"><h3>あなたの栞</h3>${cardHTML(ep, r, true)}
      ${r.resolve.length ? `<p class="small">改めたいこと</p><ul>${r.resolve.map(i => `<li>${fmt(A(ep.resolve.items[i].t))}</li>`).join('')}</ul>` : ''}
      <p class="small">読んだときの自分</p>${r.mirror.length ? `<ul>${r.mirror.map(i => `<li>${fmt(A(ep.mirror.items[i].t))}</li>`).join('')}</ul>` : '<p class="small mute">どれも当てはまらない、と答えた</p>'}
    </div>
    <div class="sec"><h3>名作のわけ</h3>${ep.why.map((w, i) => `<p><b>その${NUM[i]}　${esc(w.h)}</b><br>${fmt(A(w.short))}</p>`).join('')}</div>
    <div class="sec"><h3>3分でわかる『${esc(ep.title)}』</h3>${ep.summary.map(p => `<p>${fmt(p)}</p>`).join('')}</div>
    <div class="sec"><h3>本物を読んでみるなら</h3><p>${fmt(A(ep.read))}</p></div>`
    : `<div class="sec"><h3>この本でできること</h3><p>主人公になって名場面を体験し、ミネル先生から「なぜ名作なのか」を聞く。最後に、ふたつの問いかけに答えて、自分の栞を書く。</p><p class="small mute">所要時間　約${ep.minutes}分</p></div>`}
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
      <button class="btn owntg${OWN[ep.title] ? ' on' : ''}" id="bkOwn">${ownLabel(OWN[ep.title])}</button>
      <button class="btn primary" id="bkStart">${d ? 'もう一度、本の中へ' : 'この本の扉を開く'}</button>
      ${d ? `<button class="btn" id="bkAsk" style="text-align:center">問いかけに、もう一度答える</button>` : ''}
      <button class="btn ghost" id="bkBack">本棚へ戻る</button>
    </div>`;
  show('book');
  wireCovSel(ep);
  wirePaper(el, ep.id, () => { $('bkCover').innerHTML = coverHTML(ep, 'div'); });
  wireLike(el.querySelector('.myrec'), ep.id);
  $('bkMemo').oninput = () => { rec(ep.id).memo = $('bkMemo').value; save(); };
  $('bkDraft').onclick = () => {
    $('draftBox').innerHTML = `<p class="small mute" style="margin:0 0 6px">栞の言葉・読んだときの自分・感想を、一つの文章にまとめました。<b>下書き</b>なので、（　）のところを書きたして、自分の言葉で仕上げてください。</p>
      <textarea id="draft" rows="14">${esc(draftText(ep))}</textarea>
      <button class="btn primary" id="draftCopy" style="margin-top:8px">コピーする</button>`;
    $('draftCopy').onclick = () => copyText($('draft').value);
    $('draft').scrollIntoView({block: 'center', behavior: 'smooth'});
  };
  $('bkStart').onclick = () => startEp(ep);
  if ($('bkAsk')) $('bkAsk').onclick = () => startEp(ep, 'mirror');
  $('bkBack').onclick = openShelf;
  $('bkOwn').onclick = () => {
    const on = toggleOwn(ep.title); $('bkOwn').classList.toggle('on', on); $('bkOwn').textContent = ownLabel(on);
    $('covsel').innerHTML = covSelHTML(ep); $('bkCover').innerHTML = coverHTML(ep, 'div'); wireCovSel(ep);
  };
}

/* ---------- 栞帳：これまでにはさんだ栞の一覧 ---------- */
function openCho() {
  const list = EPS.filter(e => REC[e.id] && REC[e.id].date).sort((a, b) => (REC[a.id].n || 0) - (REC[b.id].n || 0));
  const nm = nextMilestone();
  const el = $('cho');
  el.innerHTML = `
    <div class="shead"><h2>栞帳</h2><div class="count">栞 <b>${list.length}</b> 枚<br><small>${nm ? `次の節目 ${nm}冊まで あと${nm - list.length}冊` : '全刊読破'}</small></div></div>
    <p class="small" style="opacity:.75;margin:0;line-height:1.8">これまでに本に挟んだ栞です。読んだときの自分と、感想を見返せます。10冊・50冊・100冊・150冊…と節目をこえるごとに、栞の色が変わります。</p>
    <button class="btn shbtn" id="choPrint">🖨　学校の読書記録用に、一覧を印刷する</button>
    ${list.length ? list.map(ep => {
      const r = REC[ep.id], d = r.date;
      return `<div class="choRow" data-ep="${ep.id}">${cardHTML(ep, r, true)}
        <div class="choI"><small>${r.n || ''}枚目${r.n && tierOf(r.n) ? `・${tierOf(r.n) === 'all' ? '全刊' : TIER_NAME[tierOf(r.n)]}の栞` : ''}</small>
          <b>${esc(ep.title)}</b><span>${esc(ep.author)}</span>
          <span>アプリ　${d[0]}年${d[1]}月${d[2]}日${r.paper ? `<br>本で読んだ　${ymd(r.paper)}` : ''}</span>
          ${r.like ? `<span class="lkm">${'♥'.repeat(r.like)}</span>` : ''}
          ${r.memo ? `<p class="memo">${esc(r.memo).replace(/\n/g, '<br>')}</p>` : ''}
        </div></div>`;
    }).join('') : '<p class="small" style="opacity:.6;text-align:center;padding:30px 0">まだ、栞はありません。<br>本を一冊読みおえると、ここに栞がたまっていきます。</p>'}
    <button class="btn ghost" id="choBack">本棚へ戻る</button>`;
  show('cho');
  el.querySelectorAll('.choRow').forEach(x => x.onclick = () => openBook(EPS.find(e => e.id === x.dataset.ep)));
  $('choBack').onclick = openShelf;
  $('choPrint').onclick = () => openPrint();
}

/* ---------- 記録と設定：読むときの選択肢、バックアップ ---------- */
function renderSettings() {
  const last = localStorage.getItem('yrt_bk');
  $('settings').innerHTML = `
    <h3>記録と設定</h3>
    <div class="setrow"><span>読むときの選択肢</span><div class="seg dark"><button data-ch="0" class="${VIEW.choices ? '' : 'on'}">なし</button><button data-ch="1" class="${VIEW.choices ? 'on' : ''}">あり</button></div></div>
    <p class="small">なし：原作の流れのまま読み進め、選ぶのは、読みおえたあとのミネル先生との対話だけ。<br>あり：本の中でも、主人公の行動を自分で選ぶ（原作と違うと、ページが波打つ）。</p>
    <div class="setrow"><span>本文の文字の大きさ</span><div class="seg dark">${Object.entries(FSZ).map(([k, [t]]) => `<button data-fz="${k}" class="${(VIEW.fsz || 'm') === k ? 'on' : ''}">${t}</button>`).join('')}</div></div>
    <p class="small fzs" style="font-family:var(--udm);font-size:calc(17.5px * var(--rs));line-height:2;opacity:.9">あなたは、本の中に入った。――この大きさで、物語が表示されます。</p>
    <div class="setrow"><span>オルゴールの音楽</span><div class="seg dark"><button data-bgm="0" class="${VIEW.bgm ? '' : 'on'}">なし</button><button data-bgm="1" class="${VIEW.bgm ? 'on' : ''}">あり</button></div></div>
    <div class="songs">${[...Object.entries(SONGS), ['alt', {title: '交互に', note: '2曲を、かわるがわる'}]].map(([k, x]) => `<button data-song="${k}" class="${VIEW.song === k ? 'on' : ''}"><b>♪ ${x.title}</b><small>${x.note}</small></button>`).join('')}</div>
    <p class="small">図書館に、オリジナルのオルゴール曲が静かに流れます。本の中でも流れ続け、ほかのアプリに切りかえると止まります。音量は端末の音量ボタンで。</p>
    <div class="setrow"><button class="btn" id="bkExport">記録を書き出す</button><button class="btn" id="bkImport">記録を読みこむ</button></div>
    <p class="small">読了・栞・感想・好き度・本で読んだ日・持っている本・表紙の写真を、一つのファイルにまとめて書き出します。機種変更のときや、別の端末で続けるときは、そのファイルを読みこんでください。<br>最後に書き出した日：${last ? ymd(last.slice(0, 10)) : 'まだ書き出していません'}</p>
    <button class="btn" id="toPrint" style="text-align:center">🖨　学校の読書記録用に、一覧を印刷する</button>`;
  $('settings').querySelectorAll('[data-ch]').forEach(b => b.onclick = () => { VIEW.choices = b.dataset.ch === '1'; saveView(); renderSettings(); toast(VIEW.choices ? '本の中でも、選びながら読みます' : '原作の流れのまま、読み進めます'); });
  $('settings').querySelectorAll('[data-fz]').forEach(b => b.onclick = () => { VIEW.fsz = b.dataset.fz; saveView(); applyFsz(); renderSettings(); });
  $('settings').querySelectorAll('[data-bgm]').forEach(b => b.onclick = () => setBgm(b.dataset.bgm === '1'));
  $('settings').querySelectorAll('[data-song]').forEach(b => b.onclick = () => { setSong(b.dataset.song); if (VIEW.bgm) toast(`♪ ${SONGS[bgmKey()].title}`); });
  $('bkExport').onclick = exportData;
  $('bkImport').onclick = importData;
  $('toPrint').onclick = () => openPrint();
}
const blobToURL = b => new Promise((res, rej) => { const f = new FileReader(); f.onload = () => res(f.result); f.onerror = rej; f.readAsDataURL(b); });
async function exportData() {
  const photos = {};
  try {
    const db = await idb();
    const all = await new Promise(res => { const out = []; const c = db.transaction('photos').objectStore('photos').openCursor(); c.onsuccess = () => { const cur = c.result; if (!cur) return res(out); out.push([cur.key, cur.value]); cur.continue(); }; c.onerror = () => res(out); });
    for (const [k, v] of all) photos[k] = await blobToURL(v);
  } catch (e) {}
  const data = {app: 'meisaku-no-nakae', v: 1, at: new Date().toISOString(), rec: REC, own: OWN, cover: CPREF, view: VIEW, photos};
  const d = todayISO().replace(/-/g, ''), name = `meisaku-kiroku-${d}.json`;
  const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
  const mark = () => { try { localStorage.setItem('yrt_bk', new Date().toISOString().slice(0, 10)); } catch (e) {} renderSettings(); };
  try {
    const file = new File([blob], name, {type: 'application/json'});
    if (navigator.canShare && navigator.canShare({files: [file]})) {
      await navigator.share({files: [file], title: '名作のなかへ　記録'});
      mark(); toast('記録を書き出しました'); return;
    }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  mark(); toast('記録を書き出しました（' + name + '）');
}
function importData() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    let data;
    try { data = JSON.parse(await f.text()); } catch (e) { toast('ファイルを読み込めませんでした'); return; }
    if (!data || data.app !== 'meisaku-no-nakae' || typeof data.rec !== 'object') { toast('「名作のなかへ」の記録ファイルではないようです'); return; }
    const nd = Object.values(data.rec).filter(r => r && r.date).length, no = Object.keys(data.own || {}).length, np = Object.keys(data.photos || {}).length;
    if (!confirm(`${ymd(String(data.at || '').slice(0, 10)) || '日付不明'}に書き出した記録です。\nアプリで読了 ${nd}冊・持っている ${no}冊・写真 ${np}枚\n\nこの端末のいまの記録は、この記録に置きかわります。よろしいですか？`)) return;
    REC = data.rec || {}; save();
    OWN = data.own || {}; saveOwn();
    CPREF = data.cover || {}; saveCpref();
    if (data.view) { Object.assign(VIEW, data.view); saveView(); }
    try {
      const db = await idb();
      await new Promise(res => { const tx = db.transaction('photos', 'readwrite'); tx.objectStore('photos').clear(); tx.oncomplete = res; tx.onerror = res; });
      Object.keys(PH).forEach(k => { URL.revokeObjectURL(PH[k]); delete PH[k]; });
      for (const [k, u] of Object.entries(data.photos || {})) { const b = await (await fetch(u)).blob(); await phPut(k, b); }
    } catch (e) {}
    toast('記録を読みこみました'); openShelf();
  };
  inp.click();
}

/* ---------- 感想文の下書き：自分の記録（栞・読んだときの自分・感想）を、ひとつの文章にまとめる ---------- */
const plain = s => String(s || '').replace(/\*\*/g, '');
function draftText(ep) {
  const r = REC[ep.id] || {}, P = [];
  P.push(`『${ep.title}』（${ep.author}）を読んで`, '');
  const when = r.paper ? `${ymd(r.paper)}に、この本を読みました。` : r.date ? `${r.date[0]}年${r.date[1]}月${r.date[2]}日に、この本の世界に入りました。` : 'この本を読みました。';
  const like = r.like >= 4 ? 'この本は、わたしにとって、大切な一冊になりました。' : r.like && r.like <= 2 ? '正直に言うと、すぐに好きになれる本ではありませんでした。けれど、考えさせられることがありました。' : '';
  P.push('　わたしは、' + when + like);
  if (r.mirror && r.mirror.length) P.push('　読みながら、今の自分に重なるところがありました。' + r.mirror.map(i => `「${plain(A(ep.mirror.items[i].t)).replace(/。$/, '')}」`).join('、') + 'というところです。（そう思った出来事を、一つ書こう）');
  else if (r.date) P.push('　読みながら、登場人物と自分を比べてみました。（比べて気づいたことを書こう）');
  if (r.date) P.push(`　この本から、わたしが心にとめておきたいと思ったのは、「${plain(cardText(ep, r)).replace(/\n/g, '').replace(/。$/, '')}」ということです。（なぜそう思ったのかを書こう）`);
  const memo = String(r.memo || '').split(/\n+/).map(x => x.trim()).filter(Boolean);
  if (memo.length) memo.forEach(m => P.push('　' + m));
  else P.push('　（一番心に残った場面と、そのとき感じたことを書こう）');
  P.push('　（これから、この本から学んだことを、どんなふうに生かしていきたいかを書こう）');
  return P.join('\n');
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); toast('コピーしました'); return; } catch (e) {}
  const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); toast('コピーしました'); } catch (e) { toast('コピーできませんでした。文章を長押しして、コピーしてください'); }
  ta.remove();
}

/* ---------- 学校の読書記録用の一覧（印刷） ---------- */
let PRINT = {list: 'j', only: true};
function openPrint() {
  const rowsOf = (key, n) => Array.from({length: n}, (_, k) => {
    const no = k + 1, b = BOOKS.find(x => x[3].split('・').includes(key + no));
    return {no, b};
  });
  const secs = PRINT.list === 'j' ? [['中等部　日本の本', rowsOf('中日', 50)], ['中等部　海外の本', rowsOf('中海', 50)]] : [['高等部', rowsOf('高', 100)]];
  const dt = b => { const r = recT(b[0]); return r.paper ? ymd(r.paper) : ''; };
  const total = secs.reduce((a, [, rs]) => a + rs.length, 0), read = secs.reduce((a, [, rs]) => a + rs.filter(x => x.b && recT(x.b[0]).paper).length, 0);
  const t = new Date();
  $('print').innerHTML = `
    <div class="noprint pctl">
      <div class="seg"><button data-l="j" class="${PRINT.list === 'j' ? 'on' : ''}">中等部</button><button data-l="h" class="${PRINT.list === 'h' ? 'on' : ''}">高等部</button></div>
      <div class="seg"><button data-o="1" class="${PRINT.only ? 'on' : ''}">読んだ本だけ</button><button data-o="0" class="${PRINT.only ? '' : 'on'}">${total}冊すべて</button></div>
      <button class="btn primary" id="prGo">印刷する</button>
      <p class="small mute" style="margin:0">「本で読んだ日」を記録した本が、番号順に並びます。iPhoneでは、印刷の画面から、PDFとして保存することもできます。</p>
    </div>
    <div class="ptitle"><h2>読書百選　読書記録（${PRINT.list === 'j' ? '中等部' : '高等部'}）</h2>
      <p>読んだ本　${read}冊 ／ ${total}冊　　${t.getFullYear()}年${t.getMonth() + 1}月${t.getDate()}日 現在</p>
      <p class="pname">名前　＿＿＿＿＿＿＿＿＿＿＿＿</p></div>
    ${secs.map(([h, rs]) => {
      const list = PRINT.only ? rs.filter(x => x.b && recT(x.b[0]).paper) : rs;
      return `<h3>${h}</h3>${list.length ? `<table class="ptab"><thead><tr><th>番号</th><th>書名</th><th>作者</th><th>読んだ日</th></tr></thead><tbody>${list.map(({no, b}) => `<tr class="${b && recT(b[0]).paper ? 'rd' : ''}"><td>${no}</td><td>${b ? esc(b[0]) : ''}</td><td>${b ? esc(b[1] || '') : ''}</td><td>${b ? dt(b) : ''}</td></tr>`).join('')}</tbody></table>` : '<p class="small mute">まだ、本で読んだ日を記録した本はありません。</p>'}`;
    }).join('')}
    <button class="btn ghost noprint" id="prBack">戻る</button>`;
  show('print');
  $('print').querySelectorAll('[data-l]').forEach(b => b.onclick = () => { PRINT.list = b.dataset.l; openPrint(); });
  $('print').querySelectorAll('[data-o]').forEach(b => b.onclick = () => { PRINT.only = b.dataset.o === '1'; openPrint(); });
  $('prGo').onclick = () => window.print();
  $('prBack').onclick = openShelf;
}

/* ---------- wiring ---------- */
$('titleOwl').innerHTML = OWL.replace('<svg', '<svg class="owl"');
$('enter').onclick = openShelf;
$('titleNote').textContent = EPS.length >= BOOKS.length
  ? `収録：読書百選の158冊すべて（1冊 10〜20分）`
  : `収録：${EPS.length}冊（読書百選158冊のうち・1冊 10〜20分）`;
$('sheetOv').onclick = e => { if (e.target.id === 'sheetOv') closeSheet(); };
$('q').oninput = () => { QUERY = $('q').value.trim(); renderRacks(); };
phLoadAll().then(() => { if (Object.keys(PH).length && $('shelf').classList.contains('on')) renderRacks(); });
$('log').onclick = () => { if (LI < LINES.length) step(); };
$('tap').onclick = e => { if (e.target.id !== 'skip' && LI < LINES.length) step(); };
$('skip').onclick = flush;
$('quit').onclick = () => { if (confirm('本棚へ戻りますか？（この本は最初からになります）')) openShelf(); };
