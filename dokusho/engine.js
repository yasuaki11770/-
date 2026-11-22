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
      ? [...S.mirror.flatMap(i => [['<', ep.mirror.items[i].t], [TEACHER, ep.mirror.items[i].r]]), ...(ep.mirror.after ? [[TEACHER, ep.mirror.after]] : [])]
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
  else if (who === TEACHER) d.className = 'ln teach', d.innerHTML = `${OWL}<span class="tx"><span class="who">ミネル先生</span>${fmt(text)}</span>`;
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
  if (SC.choices) return renderChoices();
  if (SC.next) nextButton(val(SC.nextLabel, S) || '次へ ▶', () => go(val(SC.next, S)));
}
function nextButton(label, fn) {
  const box = $('choices'); box.innerHTML = '';
  const b = document.createElement('button');
  b.className = 'btn primary ch'; b.textContent = label; b.onclick = fn;
  box.appendChild(b);
  return b;
}

function renderChoices() {
  const box = $('choices'); box.innerHTML = '';
  (val(SC.choices, S) || []).forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'btn ch' + (SC._missed.has(i) ? ' crossed' : '');
    b.disabled = SC._missed.has(i);
    b.style.animationDelay = (i * 60) + 'ms';
    b.innerHTML = fmt(c.t);
    b.onclick = () => choose(c, i);
    box.appendChild(b);
  });
}

function choose(c, i) {
  if (c.miss) {               // 原作の主人公とちがう選択をした
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
/* 選択リスト。multi=true で複数選択、false でひとつだけ。選んだ項目は光る */
function checkList(items, picked, multi, onChange) {
  const box = $('choices'); box.innerHTML = '';
  const btns = items.map((it, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ch pick' + (multi ? '' : ' radio');
    b.style.animationDelay = (i * 50) + 'ms';
    b.innerHTML = `<span class="pt">${fmt(it.t)}${it.who ? `<span class="whom">${esc(it.who)}</span>` : ''}</span>`;
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
function cardText(ep, r) { return r.note || (r.resolve.length ? ep.resolve.items[r.resolve[0]].card : ep.resolve.quote); }

function finish() {
  const r = rec(EP.id);
  r.date = r.date || today();
  r.mirror = S.mirror; r.resolve = S.resolve; r.note = S.note || '';
  r.reads = (r.reads || 0) + 1;
  save();
  const lines = cardText(EP, r).split('\n');
  $('lessonBox').innerHTML = `
    <div class="head">あなたの栞</div>
    <div class="card"><div class="v">${lines.map(x => `<span>${esc(x)}</span>`).join('')}</div><div class="src">『${esc(EP.title)}』を読んで</div></div>
    ${r.resolve.length ? `<ul>${r.resolve.map(i => `<li>${fmt(EP.resolve.items[i].t)}</li>`).join('')}</ul>` : ''}
    <p class="quote">${fmt(EP.resolve.quote)}<span>――『${esc(EP.title)}』より</span></p>
    <button class="btn primary" id="lessonOk">この栞を、本にはさむ</button>`;
  $('lessonOv').classList.add('on');
  $('lessonOk').onclick = () => { $('lessonOv').classList.remove('on'); openBook(EP, true); };
}

/* ---------- 本棚 ---------- */
/* ---------- 掲載（中等部・高等部）と、持っている本 ---------- */
let OWN = {};
try { OWN = JSON.parse(localStorage.getItem('yrt_own') || '{}') || {}; } catch (e) {}
const saveOwn = () => { try { localStorage.setItem('yrt_own', JSON.stringify(OWN)); } catch (e) {} };
let VIEW = {mode: 'rack', filter: 'all'};
try { Object.assign(VIEW, JSON.parse(localStorage.getItem('yrt_view') || '{}')); } catch (e) {}
const saveView = () => { try { localStorage.setItem('yrt_view', JSON.stringify(VIEW)); } catch (e) {} };

const BOOK = t => BOOKS.find(b => b[0] === t);
const memb = l => /中/.test(l) && /高/.test(l) ? 'both' : /中/.test(l) ? 'j' : 'h';
const MEMB = {both: ['両', '中等部・高等部の両方'], j: ['中', '中等部のみ'], h: ['高', '高等部のみ']};
const badge = (l, long) => `<span class="bd bd-${memb(l)}">${MEMB[memb(l)][long ? 1 : 0]}</span>`;
const fmtLists = l => l.split('・').map(x => x.replace(/^中日(\d+)/, '中等部（日本）$1番').replace(/^中海(\d+)/, '中等部（海外）$1番').replace(/^高(\d+)/, '高等部 $1番')).join('／');
const liveMap = () => Object.fromEntries(EPS.map(e => [e.title, e.id]));
function toggleOwn(t) { if (OWN[t]) delete OWN[t]; else OWN[t] = 1; saveOwn(); return !!OWN[t]; }
const ownLabel = on => on ? '✓　持っている' : '□　この本を持っている';

/* 評価：[4]年 [5]年の表示 [6]長さ [7]おすすめ [8]読みやすさ [9]有名度 [10]学び度 [11]読後感(1さわやか〜5ずっしり) */
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
const SORTS = [
  ['no', '番号順', null],
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

function coverHTML(ep, tag) {
  const r = rec(ep.id), bk = BOOK(ep.title);
  return `<${tag} class="cover" data-ep="${ep.id}" style="background:${ep.cover[0]};color:${ep.cover[1]}">
    ${r.date ? `<span class="stamp">読了</span>` : ''}
    <span class="ct">${esc(ep.title)}</span>
    <span><span class="ca">${esc(ep.author)}</span><br><span class="cs">${r.date ? '栞あり' : '未読'}</span>${bk ? badge(bk[3]) : ''}${bk && OWN[bk[0]] ? '<span class="cs">所持</span>' : ''}</span></${tag}>`;
}

function openShelf() {
  show('shelf');
  const done = EPS.filter(e => rec(e.id).date).length;
  $('cnt').textContent = done;
  let msg;
  if (done === EPS.length) msg = 'ミネルヴァのふくろうは、黄昏に飛び立つ――という言葉がある。知恵はいつも、事が終わったあとにやってくる、という意味じゃ。<br>だから人は本を読む。<b>他人の人生で、先に一度、学んでおくために。</b><br>……残りの本は、まだ書架の奥で眠っておる。また来なさい。';
  else if (done) msg = 'おかえり。本にはさんだ栞は、いつでも読み返せる。<b>しばらくたってから、同じ問いかけにもう一度答えてみる</b>のもいいものじゃよ。';
  else msg = 'ようこそ、夜の図書館へ。わしは司書のミネル。<br>本が読めなくても、かまわん。<b>本の中に入って、主人公になってみればいい。</b>まずは光っている本を一冊、選んでごらん。';
  $('shelfMsg').innerHTML = OWL + `<p>${msg}</p>`;
  $('featn').textContent = EPS.length + '冊';
  $('feat').innerHTML = EPS.map(e => coverHTML(e, 'button')).join('');
  $('feat').querySelectorAll('.cover').forEach(b => b.onclick = () => openBook(EPS.find(e => e.id === b.dataset.ep)));
  renderRacks();
}

function renderRacks() {
  const live = liveMap();
  $('ownc').textContent = BOOKS.filter(b => OWN[b[0]]).length;
  const FILTERS = [
    ['all', 'すべて', () => true],
    ['j', '中等部', b => /中/.test(b[3])],
    ['h', '高等部', b => /高/.test(b[3])],
    ['both', '両方', b => memb(b[3]) === 'both'],
    ['own', '持っている', b => OWN[b[0]]],
    ['notown', '持っていない', b => !OWN[b[0]]],
    ['live', '遊べる', b => live[b[0]]],
  ];
  if (!FILTERS.some(f => f[0] === VIEW.filter)) VIEW.filter = 'all';
  $('tabs').innerHTML = [['rack', '背表紙で見る'], ['list', 'リストでチェック']].map(([k, t]) => `<button data-v="${k}" class="${VIEW.mode === k ? 'on' : ''}">${t}</button>`).join('');
  $('chips').innerHTML = FILTERS.map(([k, t, f]) => `<button data-f="${k}" class="${VIEW.filter === k ? 'on' : ''}">${t} ${BOOKS.filter(f).length}</button>`).join('');
  $('tabs').querySelectorAll('button').forEach(b => b.onclick = () => { VIEW.mode = b.dataset.v; saveView(); renderRacks(); });
  $('chips').querySelectorAll('button').forEach(b => b.onclick = () => { VIEW.filter = b.dataset.f; saveView(); renderRacks(); });
  if (!SORTS.some(x => x[0] === VIEW.sort)) VIEW.sort = 'no';
  $('sort').innerHTML = SORTS.map(([k, t]) => `<option value="${k}"${VIEW.sort === k ? ' selected' : ''}>${t}</option>`).join('');
  $('sort').onchange = () => { VIEW.sort = $('sort').value; saveView(); renderRacks(); };
  const list = BOOKS.filter(FILTERS.find(f => f[0] === VIEW.filter)[2]);
  const cmp = SORTS.find(x => x[0] === VIEW.sort)[2];
  if (cmp) list.sort(cmp);   // 同じ評価のときは、もとの番号順のまま
  if (!list.length) { $('racks').innerHTML = '<p class="small" style="opacity:.6;text-align:center;padding:20px 0">あてはまる本は、まだありません。</p>'; return; }
  if (VIEW.mode === 'rack') {
    const groups = {};
    list.forEach(b => (groups[b[2]] = groups[b[2]] || []).push(b));
    $('racks').innerHTML = Object.entries(groups).map(([g, l]) =>
      `<h3>${g}（${l.length}冊）</h3><div class="rack">${l.map(b =>
        `<button class="spine${live[b[0]] ? ' live' : ''}${OWN[b[0]] ? ' own' : ''}" data-t="${esc(b[0])}" title="${esc(b[0])}／${esc(b[1] || '')}"><span class="st">${esc(b[0])}</span>${badge(b[3])}</button>`).join('')}</div>`).join('');
    $('racks').querySelectorAll('.spine').forEach(s => s.onclick = () => openSheet(s.dataset.t));
  } else {
    $('racks').innerHTML = `<div class="llist">${list.map(b => `
      <div class="lrow${OWN[b[0]] ? ' own' : ''}" data-t="${esc(b[0])}" role="button" aria-pressed="${OWN[b[0]] ? 'true' : 'false'}">
        <span class="ck">${OWN[b[0]] ? '✓' : ''}</span>
        <span class="lt"><b>${esc(b[0])}</b><small>${esc(b[1] || '―')}　${esc(fmtLists(b[3]))}</small>${ratesMini(b)}</span>
        ${badge(b[3])}${live[b[0]] ? `<button class="go" data-ep="${live[b[0]]}">ひらく</button>` : ''}
      </div>`).join('')}</div>`;
    $('racks').querySelectorAll('.lrow').forEach(r => r.onclick = e => {
      if (e.target.closest('.go')) { openBook(EPS.find(x => x.id === e.target.closest('.go').dataset.ep)); return; }
      const on = toggleOwn(r.dataset.t);
      r.classList.toggle('own', on); r.setAttribute('aria-pressed', on);
      r.querySelector('.ck').textContent = on ? '✓' : '';
      $('ownc').textContent = BOOKS.filter(b => OWN[b[0]]).length;
    });
  }
}

/* 背表紙をタップしたときの小さなカード */
function openSheet(title) {
  const b = BOOK(title), id = liveMap()[title];
  $('sheet').innerHTML = `
    <span class="small mute">${esc(b[2])}</span>
    <h3>${esc(b[0])}</h3>
    <p>${esc(b[1] || '著者不詳')}</p>
    <p>${badge(b[3], true)}</p>
    <p class="small">${esc(fmtLists(b[3]))}</p>
    ${ratesHTML(b)}
    <button class="btn owntg${OWN[title] ? ' on' : ''}" id="shOwn">${ownLabel(OWN[title])}</button>
    ${id ? '<button class="btn primary" id="shGo">この本の扉をひらく</button>' : '<p class="small mute">この本の物語は、まだ書架の奥で準備中です。</p>'}
    <button class="btn ghost" id="shClose">とじる</button>`;
  $('sheetOv').classList.add('on');
  $('shOwn').onclick = () => { const on = toggleOwn(title); $('shOwn').classList.toggle('on', on); $('shOwn').textContent = ownLabel(on); };
  $('shClose').onclick = closeSheet;
  if (id) $('shGo').onclick = () => { closeSheet(); openBook(EPS.find(e => e.id === id)); };
}
function closeSheet() { $('sheetOv').classList.remove('on'); if ($('shelf').classList.contains('on')) { renderRacks(); $('feat').innerHTML = EPS.map(e => coverHTML(e, 'button')).join(''); $('feat').querySelectorAll('.cover').forEach(b => b.onclick = () => openBook(EPS.find(e => e.id === b.dataset.ep))); } }

function openBook(ep, justDone) {
  const r = rec(ep.id), d = r.date, bk = BOOK(ep.title);
  const el = $('book');
  el.innerHTML = `
    <div class="bk-top">
      ${coverHTML(ep, 'div')}
      <div class="bk-meta">
        <span>${bk ? badge(bk[3], true) : ''}</span>
        <span class="small mute">${bk ? esc(fmtLists(bk[3])) : esc(ep.lists)}</span>
        <h2>${esc(ep.title)}</h2>
        <span>${esc(ep.author)}（${esc(ep.year)}）</span>
        <span class="small">${esc(ep.blurb)}</span>
        <div class="done">読了日　${d ? `<b>${d[0]}</b> 年 <b>${d[1]}</b> 月 <b>${d[2]}</b> 日` : '　　 年　　 月　　 日'}</div>
      </div>
    </div>
    ${bk ? `<div class="sec">${ratesHTML(bk)}</div>` : ''}
    ${d ? `
    <div class="sec mine"><h3>あなたの栞</h3><p class="note">${fmt(cardText(ep, r))}</p>
      ${r.resolve.length ? `<p class="small">改めたいこと</p><ul>${r.resolve.map(i => `<li>${fmt(ep.resolve.items[i].t)}</li>`).join('')}</ul>` : ''}
      <p class="small">読んだときの自分</p>${r.mirror.length ? `<ul>${r.mirror.map(i => `<li>${fmt(ep.mirror.items[i].t)}</li>`).join('')}</ul>` : '<p class="small mute">どれも当てはまらない、と答えた</p>'}
    </div>
    <div class="sec"><h3>名作のわけ</h3>${ep.why.map((w, i) => `<p><b>その${NUM[i]}　${esc(w.h)}</b><br>${fmt(w.short)}</p>`).join('')}</div>
    <div class="sec"><h3>3分でわかる『${esc(ep.title)}』</h3>${ep.summary.map(p => `<p>${fmt(p)}</p>`).join('')}</div>
    <div class="sec"><h3>本物を読んでみるなら</h3><p>${fmt(ep.read)}</p></div>`
    : `<div class="sec"><h3>この本でできること</h3><p>主人公になって名場面を体験し、ミネル先生から「なぜ名作なのか」を聞く。最後に、ふたつの問いかけに答えて、自分の栞を書く。</p><p class="small mute">所要時間　約${ep.minutes}分</p></div>`}
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
      <button class="btn owntg${OWN[ep.title] ? ' on' : ''}" id="bkOwn">${ownLabel(OWN[ep.title])}</button>
      <button class="btn primary" id="bkStart">${d ? 'もう一度、本の中へ' : 'この本の扉をひらく'}</button>
      ${d ? `<button class="btn" id="bkAsk" style="text-align:center">問いかけに、もう一度答える</button>` : ''}
      <button class="btn ghost" id="bkBack">本棚へもどる</button>
    </div>`;
  show('book');
  $('bkStart').onclick = () => startEp(ep);
  if ($('bkAsk')) $('bkAsk').onclick = () => startEp(ep, 'mirror');
  $('bkBack').onclick = openShelf;
  $('bkOwn').onclick = () => { const on = toggleOwn(ep.title); $('bkOwn').classList.toggle('on', on); $('bkOwn').textContent = ownLabel(on); };
}

/* ---------- wiring ---------- */
$('titleOwl').innerHTML = OWL.replace('<svg', '<svg class="owl"');
$('enter').onclick = openShelf;
$('sheetOv').onclick = e => { if (e.target.id === 'sheetOv') closeSheet(); };
$('log').onclick = () => { if (LI < LINES.length) step(); };
$('tap').onclick = e => { if (e.target.id !== 'skip' && LI < LINES.length) step(); };
$('skip').onclick = flush;
$('quit').onclick = () => { if (confirm('本棚へもどりますか？（この本は最初からになります）')) openShelf(); };
