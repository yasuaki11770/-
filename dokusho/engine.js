'use strict';
/* やりなおし図書館 ― シーン進行エンジン
   エピソードは ep_*.js で window.EPS に登録する。
   シーン: {world:'now'|'lib'|'book', place, lines:[[話者,本文],...], choices:[...], next, end:{type,title,text}, gain, set, add}
   話者: '' 地の文 / '心' 心の声 / '!' 強調 / 'ミネル' 先生 / それ以外は登場人物（ep.chars で色指定）
   選択肢: {t, to, need(栞が必要), miss(本の世界で原作と違う選択→先生の一言), time(分), set, add, if(S)} */

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
const val = (v, ...a) => typeof v === 'function' ? v(...a) : v;
/* TEACHER（先生の話者名）は index.html で定義 */
const KIND = {bad:['BAD END','k-bad'], miss:['誤読エンド','k-miss'], good:['NORMAL END','k-good'], true:['TRUE END','k-true']};

const OWL = `<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="60" rx="34" ry="36" fill="#8a6a4a"/><ellipse cx="50" cy="68" rx="22" ry="24" fill="#e9d7b5"/><path d="M38 70q12 6 24 0M40 79q10 5 20 0" stroke="#b89a70" stroke-width="2" fill="none"/><path d="M18 32l14 12M82 32l-14 12" stroke="#6b4f33" stroke-width="7" stroke-linecap="round"/><circle cx="36" cy="46" r="13" fill="#fff"/><circle cx="64" cy="46" r="13" fill="#fff"/><circle cx="36" cy="47" r="6" fill="#2b1d10"/><circle cx="64" cy="47" r="6" fill="#2b1d10"/><circle cx="38" cy="45" r="2" fill="#fff"/><circle cx="66" cy="45" r="2" fill="#fff"/><circle cx="36" cy="46" r="15" fill="none" stroke="#d9a441" stroke-width="2.5"/><circle cx="64" cy="46" r="15" fill="none" stroke="#d9a441" stroke-width="2.5"/><path d="M51 46h-2" stroke="#d9a441" stroke-width="2.5"/><path d="M50 52l-5 7h10z" fill="#e0a03a"/><path d="M30 95l6-8 6 8M58 95l6-8 6 8" stroke="#e0a03a" stroke-width="3" fill="none"/></svg>`;

let REC = {};
try { REC = JSON.parse(localStorage.getItem('yrt_rec') || '{}') || {}; } catch (e) {}
const save = () => { try { localStorage.setItem('yrt_rec', JSON.stringify(REC)); } catch (e) {} };
const rec = id => REC[id] || (REC[id] = {ends:{}, learned:false, date:null});

let EP = null, S = null, SC = null, LINES = [], LI = 0, PREV = '';

function show(id) {
  document.querySelectorAll('.screen').forEach(e => e.classList.toggle('on', e.id === id));
  if (id !== 'play') document.body.dataset.world = 'now';
  window.scrollTo(0, 0);
}
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2400);
}

/* ---------- play ---------- */
function startEp(ep, rewind) {
  EP = ep;
  S = Object.assign({learned: !!rewind}, ep.init ? ep.init() : {});
  PREV = '';
  show('play');
  go(rewind ? ep.rewind : ep.start);
}

function go(id) {
  const sc = EP.scenes[id];
  if (!sc) throw new Error('scene not found: ' + id);
  SC = sc; SC.id = id; SC._missed = new Set();
  if (sc.set) Object.assign(S, val(sc.set, S));
  if (sc.add) for (const k in sc.add) S[k] = (S[k] || 0) + sc.add[k];
  document.body.dataset.world = sc.world || 'now';
  $('place').textContent = val(sc.place, S) || '';
  $('log').innerHTML = ''; $('choices').innerHTML = '';
  if (PREV) addLine(['>', PREV]);
  PREV = '';
  hud();
  LINES = val(sc.lines, S) || []; LI = 0;
  $('log').scrollTop = 0;
  step();
}

function hud() { $('hud').innerHTML = EP.hud ? (EP.hud(S, SC) || '') : ''; }

function step() {
  if (LI < LINES.length) addLine(LINES[LI++]);
  const more = LI < LINES.length;
  $('tap').style.display = more ? '' : 'none';
  if (!more) after();
}
function flush() { while (LI < LINES.length) addLine(LINES[LI++]); step(); }

function addLine([who, text], extra) {
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
  if (extra) d.classList.add(extra);
  $('log').appendChild(d);
  requestAnimationFrame(() => d.scrollIntoView({block:'end', behavior:'smooth'}));
}

function after() {
  if (SC.gain && !S.learned) { showLesson(); return; }
  cont();
}
function cont() {
  if (SC.end) {               // 最後の一文を読み終えてから、結末カードを出す
    const box = $('choices'); box.innerHTML = '';
    const b = document.createElement('button');
    b.className = 'btn primary ch'; b.textContent = '結末へ ▶';
    b.onclick = () => showEnd(SC.end);
    box.appendChild(b);
    return;
  }
  if (SC.choices) { renderChoices(); return; }
  if (SC.next) {
    const box = $('choices'); box.innerHTML = '';
    const b = document.createElement('button');
    b.className = 'btn primary ch'; b.textContent = val(SC.nextLabel, S) || '次へ ▶';
    b.onclick = () => go(val(SC.next, S));
    box.appendChild(b);
  }
}

function renderChoices() {
  const box = $('choices'); box.innerHTML = '';
  (val(SC.choices, S) || []).forEach((c, i) => {
    if (c.if && !c.if(S)) return;
    const b = document.createElement('button');
    b.className = 'btn ch';
    b.style.animationDelay = (i * 60) + 'ms';
    if (c.need && !S.learned) {
      b.className += ' locked'; b.disabled = true;
      b.innerHTML = '<span class="q">？？？</span><span class="small">いまのあなたには、思いつかない</span>';
    } else {
      if (c.need) b.className += ' bm';
      if (SC._missed.has(i)) { b.className += ' crossed'; b.disabled = true; }
      b.innerHTML = (c.need ? '<span class="bmk"></span>' : '') + fmt(c.t) + (c.time ? `<span class="cost">${c.time}分</span>` : '');
      b.onclick = () => choose(c, i);
    }
    box.appendChild(b);
  });
}

function choose(c, i) {
  if (c.miss) {               // 本の世界で、原作の主人公とちがう選択をした
    SC._missed.add(i);
    $('choices').innerHTML = '';
    addLine(['<', c.t]);
    addLine(['!', 'ページが、ざわりと波打った。']);
    $('log').classList.remove('tear'); void $('log').offsetWidth; $('log').classList.add('tear');
    [].concat(c.miss).forEach(m => addLine(Array.isArray(m) ? m : [TEACHER, m]));
    setTimeout(renderChoices, 350);
    return;
  }
  if (c.time) S.t = (S.t || 0) + c.time;
  if (c.set) Object.assign(S, val(c.set, S));
  if (c.add) for (const k in c.add) S[k] = (S[k] || 0) + c.add[k];
  PREV = c.t.replace(/\*\*/g, '');
  go(val(c.to, S));
}

/* ---------- 栞 ---------- */
function showLesson() {
  const L = EP.lesson;
  $('lessonBox').innerHTML = `
    <div class="head">栞を手に入れた</div>
    <div class="card"><div class="v">${L.card.split('\n').map(x => `<span>${esc(x)}</span>`).join('')}</div><div class="src">『${esc(EP.title)}』より</div></div>
    <ul>${L.points.map(p => `<li>${fmt(p)}</li>`).join('')}</ul>
    <button class="btn primary" id="lessonOk">栞をはさんで、あの日へ戻る</button>`;
  $('lessonOv').classList.add('on');
  $('lessonOk').onclick = () => {
    $('lessonOv').classList.remove('on');
    S.learned = true;
    const r = rec(EP.id); r.learned = true; save();
    cont();
  };
}

/* ---------- 結末 ---------- */
function today() { const d = new Date(); return [d.getFullYear(), d.getMonth() + 1, d.getDate()]; }

function showEnd(end) {
  const r = rec(EP.id);
  r.ends[SC.id] = 1;
  if (end.type === 'true' && !r.date) r.date = today();
  save();
  const [label, cls] = KIND[end.type];
  let btns;
  if (!S.learned) btns = `<button class="btn primary" id="eA">――そのとき、時計の針が止まった</button>`;
  else if (end.type !== 'true') btns = `<button class="btn primary" id="eA">栞の場面から、やりなおす</button><button class="btn ghost" id="eB">本棚へもどる</button>`;
  else btns = `<button class="btn primary" id="eA">この本を、本棚にしまう</button>`;
  $('endCard').innerHTML = `<div class="kind ${cls}">${label}</div><h2>${esc(end.title)}</h2>${end.text ? `<p>${fmt(end.text)}</p>` : ''}${btns}`;
  $('endOv').classList.add('on');
  $('eA').onclick = () => {
    $('endOv').classList.remove('on');
    if (!S.learned) go(EP.lib);
    else if (end.type !== 'true') { PREV = ''; go(EP.rewind); }
    else openBook(EP, true);
  };
  if ($('eB')) $('eB').onclick = () => { $('endOv').classList.remove('on'); openShelf(); };
}

/* ---------- 本棚 ---------- */
function coverHTML(ep, tag) {
  const r = rec(ep.id);
  const st = r.date ? '読了' : r.learned ? '栞あり' : '未読';
  return `<${tag} class="cover" data-ep="${ep.id}" style="background:${ep.cover[0]};color:${ep.cover[1]}">
    ${r.date ? `<span class="stamp">読了</span>` : ''}
    <span class="ct">${esc(ep.title)}</span>
    <span><span class="ca">${esc(ep.author)}</span><br><span class="cs">${st}</span></span></${tag}>`;
}

function openShelf() {
  show('shelf');
  const done = EPS.filter(e => rec(e.id).date).length;
  $('cnt').textContent = done;
  let msg;
  if (done === EPS.length) msg = 'ミネルヴァのふくろうは、黄昏に飛び立つ――という言葉がある。知恵はいつも、事が終わったあとにやってくる、という意味じゃ。<br>だから人は本を読む。<b>他人の人生で、先に一度、失敗しておくために。</b><br>……残りの155冊は、まだ書架の奥で眠っておる。また来なさい。';
  else if (done) msg = 'おかえり。本棚に一冊ずつ本が増えていく。主人公たちは毎回すべてを忘れてしまうが――<b>読んだあなたは、忘れない。</b>';
  else msg = 'ようこそ、やりなおし図書館へ。わしは司書のミネル。<br>ここには、<b>知らなかったせいで後悔した人</b>がやってくる。まずは光っている本を一冊、選んでごらん。';
  $('shelfMsg').innerHTML = OWL + `<p>${msg}</p>`;
  $('feat').innerHTML = EPS.map(e => coverHTML(e, 'button')).join('');
  $('feat').querySelectorAll('.cover').forEach(b => b.onclick = () => openBook(EPS.find(e => e.id === b.dataset.ep)));
  const live = Object.fromEntries(EPS.map(e => [e.title, e.id]));
  const groups = {};
  BOOKS.forEach(b => (groups[b[2]] = groups[b[2]] || []).push(b));
  $('racks').innerHTML = Object.entries(groups).map(([g, list]) =>
    `<h3>${g}（${list.length}冊）</h3><div class="rack">${list.map(b =>
      `<button class="spine${live[b[0]] ? ' live' : ''}" data-t="${esc(b[0])}" title="${esc(b[0])}／${esc(b[1] || '')}">${esc(b[0])}</button>`).join('')}</div>`).join('');
  $('racks').querySelectorAll('.spine').forEach(s => s.onclick = () => {
    const id = live[s.dataset.t];
    if (id) openBook(EPS.find(e => e.id === id));
    else { const b = BOOKS.find(x => x[0] === s.dataset.t); toast(`『${b[0]}』${b[1] ? '（' + b[1] + '）' : ''}…まだ書架の奥。準備中です`); }
  });
}

function openBook(ep, justDone) {
  const r = rec(ep.id);
  const ends = Object.entries(ep.scenes).filter(([, s]) => s.end);
  const order = {bad:0, miss:1, good:2, true:3};
  ends.sort((a, b) => order[a[1].end.type] - order[b[1].end.type]);
  const d = r.date;
  const el = $('book');
  el.innerHTML = `
    <div class="bk-top">
      ${coverHTML(ep, 'div')}
      <div class="bk-meta">
        <span class="small mute">${esc(ep.lists)}</span>
        <h2>${esc(ep.title)}</h2>
        <span>${esc(ep.author)}（${esc(ep.year)}）</span>
        <span class="small">${esc(ep.blurb)}</span>
        <div class="done">読了日　${d ? `<b>${d[0]}</b> 年 <b>${d[1]}</b> 月 <b>${d[2]}</b> 日` : '　　 年　　 月　　 日'}</div>
      </div>
    </div>
    ${justDone ? `<div class="minel" style="background:#fffaf0;border-color:#e2d3b0">${OWL}<p>${fmt(ep.after)}</p></div>` : ''}
    <div class="sec"><h3>この物語の主人公</h3><p>${fmt(ep.hero)}</p></div>
    <div class="sec"><h3>結末（${ends.filter(([id]) => r.ends[id]).length} / ${ends.length}）</h3><div class="ends">${ends.map(([id, s]) => {
      const seen = r.ends[id], [lb, cls] = KIND[s.end.type];
      return `<div class="end-slot${seen ? '' : ' no'}"><span class="kind ${cls}">${lb}</span>${seen ? esc(s.end.title) : '？？？'}</div>`; }).join('')}</div></div>
    ${r.learned ? `
    <div class="sec"><h3>栞</h3><p style="font-family:var(--mincho);font-weight:700">${fmt(ep.lesson.card)}</p></div>
    <div class="sec"><h3>3分でわかる『${esc(ep.title)}』</h3>${ep.summary.map(p => `<p>${fmt(p)}</p>`).join('')}</div>
    <div class="sec"><h3>本物を読んでみるなら</h3><p>${fmt(ep.read)}</p></div>`
    : `<div class="sec"><h3>あらすじ</h3><p class="mute">本の中に入ると、ここに書き込まれる。</p></div>`}
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
      <button class="btn primary" id="bkStart">${r.learned ? 'はじめから（知識はリセット）' : 'この本の扉をひらく'}</button>
      ${r.learned ? `<button class="btn" id="bkRe" style="text-align:center"><span class="bmk"></span>栞を持って、やりなおしの場面から</button>` : ''}
      <button class="btn ghost" id="bkBack">本棚へもどる</button>
    </div>`;
  show('book');
  $('bkStart').onclick = () => startEp(ep, false);
  if ($('bkRe')) $('bkRe').onclick = () => startEp(ep, true);
  $('bkBack').onclick = openShelf;
}

/* ---------- wiring ---------- */
$('titleOwl').innerHTML = OWL.replace('<svg', '<svg class="owl"');
$('enter').onclick = openShelf;
$('log').onclick = () => { if (LI < LINES.length) step(); };
$('tap').onclick = e => { if (e.target.id !== 'skip' && LI < LINES.length) step(); };
$('skip').onclick = flush;
$('quit').onclick = () => { if (confirm('本棚へもどりますか？（この話は最初からになります）')) openShelf(); };
