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
    ['', '当てはまるものを、**いくつでも**選んでください。選ぶと「✓」がつきます。'],
  ]};
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
/* 選択リスト。multi=true で複数選択、false でひとつだけ。選んだ項目は色と「✓」の文字の両方で示す */
function checkList(items, picked, multi, onChange) {
  const box = $('choices'); box.innerHTML = '';
  const btns = items.map((it, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ch pick' + (multi ? '' : ' radio');
    b.style.animationDelay = (i * 50) + 'ms';
    b.innerHTML = `<span class="box"></span><span class="pt">${fmt(it.t)}${it.who ? `<span class="whom">${esc(it.who)}</span>` : ''}</span>`;
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
    b.querySelector('.box').textContent = on ? '✓' : '';
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
    const sel = get();
    S.mirror = sel;
    $('choices').innerHTML = '';
    if (sel.length) {
      sel.forEach(i => { addLine(['<', M.items[i].t]); addLine([TEACHER, M.items[i].r]); });
      if (M.after) addLine([TEACHER, M.after]);
    } else {
      addLine(['<', 'どれも当てはまらない']);
      addLine([TEACHER, M.none]);
    }
    nextButton('次の問いかけ ▶', () => go('resolve'));
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
function coverHTML(ep, tag) {
  const r = rec(ep.id);
  return `<${tag} class="cover" data-ep="${ep.id}" style="background:${ep.cover[0]};color:${ep.cover[1]}">
    ${r.date ? `<span class="stamp">読了</span>` : ''}
    <span class="ct">${esc(ep.title)}</span>
    <span><span class="ca">${esc(ep.author)}</span><br><span class="cs">${r.date ? '栞あり' : '未読'}</span></span></${tag}>`;
}

function openShelf() {
  show('shelf');
  const done = EPS.filter(e => rec(e.id).date).length;
  $('cnt').textContent = done;
  let msg;
  if (done === EPS.length) msg = 'ミネルヴァのふくろうは、黄昏に飛び立つ――という言葉がある。知恵はいつも、事が終わったあとにやってくる、という意味じゃ。<br>だから人は本を読む。<b>他人の人生で、先に一度、学んでおくために。</b><br>……残りの155冊は、まだ書架の奥で眠っておる。また来なさい。';
  else if (done) msg = 'おかえり。本にはさんだ栞は、いつでも読み返せる。<b>しばらくたってから、同じ問いかけにもう一度答えてみる</b>のもいいものじゃよ。';
  else msg = 'ようこそ、夜の図書館へ。わしは司書のミネル。<br>本が読めなくても、かまわん。<b>本の中に入って、主人公になってみればいい。</b>まずは光っている本を一冊、選んでごらん。';
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
  const r = rec(ep.id), d = r.date;
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
      <button class="btn primary" id="bkStart">${d ? 'もう一度、本の中へ' : 'この本の扉をひらく'}</button>
      ${d ? `<button class="btn" id="bkAsk" style="text-align:center">問いかけに、もう一度答える</button>` : ''}
      <button class="btn ghost" id="bkBack">本棚へもどる</button>
    </div>`;
  show('book');
  $('bkStart').onclick = () => startEp(ep);
  if ($('bkAsk')) $('bkAsk').onclick = () => startEp(ep, 'mirror');
  $('bkBack').onclick = openShelf;
}

/* ---------- wiring ---------- */
$('titleOwl').innerHTML = OWL.replace('<svg', '<svg class="owl"');
$('enter').onclick = openShelf;
$('log').onclick = () => { if (LI < LINES.length) step(); };
$('tap').onclick = e => { if (e.target.id !== 'skip' && LI < LINES.length) step(); };
$('skip').onclick = flush;
$('quit').onclick = () => { if (confirm('本棚へもどりますか？（この本は最初からになります）')) openShelf(); };
