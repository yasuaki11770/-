// 三国志決戦伝 — 本体（会話・戦闘・AI・セーブ）
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rnd = (a, b) => a + Math.random() * (b - a);
const K = (x, y) => x + ',' + y;
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// ---------- セーブ ----------
const SAVE_KEY = 'kessenden_v1';
let SV = null;
function newSave() { return { idx: 0, lv: {}, seen: {}, choice: {}, opt: (SV && SV.opt) || { spd: 1, snd: 1 } }; }
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && typeof s.idx === 'number') return s; } catch (e) {} return null; }
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SV)); } catch (e) {} }
SV = loadSave() || newSave();
const TEST = typeof window !== 'undefined' && !!window.KESSEN_TEST;
const spd = () => TEST ? 0.01 : (SV.opt.spd || 1);
const sleep = ms => new Promise(r => setTimeout(r, ms * spd()));

// ---------- 音 ----------
const AU = { ctx: null, bgm: null, bgmName: '' };
function actx() {
  if (!AU.ctx) { try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (AU.ctx.state === 'suspended') AU.ctx.resume();
  return AU.ctx;
}
function tone(f, d, type = 'square', v = 0.06, t0 = 0, slide = 0) {
  if (!SV.opt.snd) return; const c = actx(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.02);
}
function noise(d, v = 0.08, t0 = 0, hp = 800) {
  if (!SV.opt.snd) return; const c = actx(); if (!c) return;
  const b = c.createBuffer(1, c.sampleRate * d, c.sampleRate), a = b.getChannelData(0);
  for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / a.length);
  const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
  f.type = 'highpass'; f.frequency.value = hp; s.buffer = b; g.gain.value = v;
  s.connect(f); f.connect(g); g.connect(c.destination); s.start(c.currentTime + t0);
}
const SE = {
  tap: () => tone(880, 0.05, 'square', 0.03),
  move: () => tone(440, 0.04, 'triangle', 0.04),
  hit: () => { noise(0.12, 0.12, 0, 600); tone(160, 0.12, 'sawtooth', 0.05, 0, -80); },
  crit: () => { noise(0.25, 0.16, 0, 300); tone(90, 0.3, 'sawtooth', 0.07, 0, -40); },
  miss: () => tone(1200, 0.08, 'sine', 0.03, 0, 600),
  fire: () => { noise(0.5, 0.12, 0, 200); tone(120, 0.5, 'sawtooth', 0.04, 0, 200); },
  heal: () => { [660, 880, 1320].forEach((f, i) => tone(f, 0.15, 'sine', 0.05, i * 0.07)); },
  lvup: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, 'square', 0.04, i * 0.08)); },
  duel: () => { noise(0.08, 0.1); tone(1400, 0.4, 'square', 0.03, 0.05, -900); },
  win: () => { [523, 659, 784, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'square', 0.05, i * 0.13)); },
  lose: () => { [392, 349, 311, 262].forEach((f, i) => tone(f, 0.35, 'triangle', 0.06, i * 0.25)); },
  gong: () => { tone(110, 1.4, 'sine', 0.12); tone(164, 1.2, 'sine', 0.05); noise(0.4, 0.04, 0, 2000); },
};
// BGM: 五音音階の簡単なループ
const BGMS = {
  story: { tempo: 0.42, mel: [0, 2, 4, 7, 4, 2, 0, -1, 0, 4, 7, 9, 7, 4, 2, -1], bass: [0, 0, 5, 5, 3, 3, 4, 4], w: 'triangle', root: 293 },
  battle: { tempo: 0.18, mel: [0, 0, 7, 4, 5, 4, 2, 0, 7, 9, 7, 5, 4, 2, 4, -1], bass: [0, 0, 0, 0, 5, 5, 3, 4], w: 'square', root: 220 },
  boss: { tempo: 0.16, mel: [0, 3, 5, 7, 8, 7, 5, 3, 0, 3, 8, 7, 5, 3, 2, 3], bass: [0, 0, 8, 8, 5, 5, 7, 7], w: 'sawtooth', root: 196 },
  sad: { tempo: 0.6, mel: [7, 5, 3, 2, 0, -1, 3, 2, 0, -1, -2, 0, -1, -1, -1, -1], bass: [0, 0, 8, 8, 5, 5, 7, 7], w: 'sine', root: 262 },
};
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]; // 度数→半音
function semi(n, minor) { if (n < 0) return null; if (minor) return [0, 2, 3, 5, 7, 8, 10, 12, 14, 15][n % 10] + 0; return n; }
function playBgm(name) {
  if (AU.bgmName === name) return; stopBgm(); AU.bgmName = name;
  if (!name || !SV.opt.snd) return; const b = BGMS[name]; if (!b) return;
  let i = 0; const minor = name === 'boss' || name === 'sad';
  AU.bgm = setInterval(() => {
    if (!SV.opt.snd || document.hidden) return;
    const m = b.mel[i % b.mel.length];
    if (m >= 0) { const s = minor ? semi(m, true) : m; tone(b.root * Math.pow(2, s / 12), b.tempo * 0.9, b.w, 0.022); }
    if (i % 2 === 0) { const bs = b.bass[(i / 2) % b.bass.length]; tone(b.root / 2 * Math.pow(2, bs / 12), b.tempo * 1.8, 'triangle', 0.035); }
    i++;
  }, b.tempo * 1000);
}
function stopBgm() { if (AU.bgm) clearInterval(AU.bgm); AU.bgm = null; AU.bgmName = ''; }

// ---------- 顔グラ（三国決戦伝と同じ描き方） ----------
const FACE = {};
const hexi = s => { if (typeof s === 'number') return s; let h = String(s || '#000').slice(1); if (h.length === 3) h = h.replace(/./g, c => c + c); return parseInt(h, 16); };
// 三国決戦伝にいない武将は、こちらの顔設定を同じ形式に直す
function lookOf(id) {
  if (typeof LK !== 'undefined' && LK[id]) return Object.assign({}, LK[id].lk, { f: LK[id].f });
  const c = CH[id]; if (!c) return { c: 0x6a5a4a, h: 'cap' };
  const p = c.p, H = { crown: 'crown', kerchief: 'band', helm: 'cap', feather: 'horns', scholar: 'hat', topknot: 'none', cap: 'hat', bald: 'none', turban: 'band', woman: 'none' };
  const B = { none: 0, short: 1, mustache: 1, goatee: 1, long: 2, bushy: 2 };
  const L = { c: hexi(p.r), t: p.h === 'turban' ? 0xe0c020 : 0xc9a23c, h: H[p.h] || 'cap', hc: hexi(p.hc), b: B[p.b] || 0, bc: hexi(p.bc || '#1a1410'), sk: hexi(p.sk) };
  if (p.h === 'bald') L.hair = hexi(p.sk);
  if (p.h === 'woman') { L.fem = 1; L.hair = hexi(p.hc); }
  if (p.e === 'eyepatch') L.patch = 1;
  if (p.e === 'old') { L.old = 1; if (!L.b) L.b = 1; }
  if (p.e === 'fan') L.fan = 1;
  if (p.e === 'fat') L.fat = 1;
  if (p.h === 'turban') L.hc = 0xe0c020;
  return L;
}
const FACC = { shu: '蜀', wei: '魏', wu: '呉', qun: '群', han: '群', nan: '南蛮', jin: '魏' };
function face(id) {
  if (FACE[id]) return FACE[id];
  const ch = CH[id];
  const L = Object.assign({ c: 0x556070, t: 0xc9a23c, h: 'cap', hc: 0x444c58, pl: 0, b: 0, bc: 0x1a1410, cape: 0, sk: 0xe0b090, hair: 0x18110d }, lookOf(id));
  const f = ch ? FACC[ch.f] : '群';
  const hx = n => '#' + ('000000' + (n | 0).toString(16)).slice(-6);
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 144; const x = cv.getContext('2d');
  const bgc = { '魏': ['#27406e', '#0f1a30'], '蜀': ['#25573a', '#0e2016'], '呉': ['#6e2a2a', '#2b0f0f'], '群': ['#5a4a2a', '#1f1a0e'], '南蛮': ['#5a3a1a', '#1f120a'] }[f] || ['#444', '#111'];
  const g = x.createLinearGradient(0, 0, 0, 144); g.addColorStop(0, bgc[0]); g.addColorStop(1, bgc[1]); x.fillStyle = g; x.fillRect(0, 0, 128, 144);
  if (!ch) { x.fillStyle = '#1a120c'; x.beginPath(); x.arc(64, 64, 28, 0, 7); x.fill(); x.beginPath(); x.ellipse(64, 140, 52, 40, 0, 0, 7); x.fill(); return (FACE[id] = cv.toDataURL()); }
  x.lineJoin = 'round'; x.lineWidth = 2; x.strokeStyle = '#0a0f12';
  const F = (col, fn) => { x.fillStyle = col; x.beginPath(); fn(); x.fill(); x.stroke(); };
  const E = (cx, cy, rx, ry, col) => F(col, () => x.ellipse(cx, cy, rx, ry, 0, 0, 7));
  const c = hx(L.c), t = hx(L.t), sk = hx(L.sk), hc = hx(L.hc || L.c), hair = hx(L.hair || 0x18110d), bc = hx(L.bc || 0x1a1410);
  if (L.fem) { F(hair, () => { x.moveTo(30, 60); x.quadraticCurveTo(22, 110, 36, 128); x.lineTo(92, 128); x.quadraticCurveTo(106, 110, 98, 60); }); }
  if (L.cape) F(hx(L.cape), () => { x.moveTo(14, 144); x.lineTo(24, 92); x.quadraticCurveTo(64, 70, 104, 92); x.lineTo(114, 144); });
  F(c, () => { x.moveTo(6, 144); x.quadraticCurveTo(10, 112, 40, 104); x.lineTo(88, 104); x.quadraticCurveTo(118, 112, 122, 144); });
  if (!L.fem) { E(24, 116, 20, 13, c); E(104, 116, 20, 13, c); x.strokeStyle = t; x.lineWidth = 3; x.beginPath(); x.ellipse(24, 116, 20, 13, 0, .2, 3); x.stroke(); x.beginPath(); x.ellipse(104, 116, 20, 13, 0, .2, 3); x.stroke(); x.strokeStyle = '#0a0f12'; x.lineWidth = 2; }
  F(t, () => { x.moveTo(44, 106); x.lineTo(64, 124); x.lineTo(84, 106); x.lineTo(76, 102); x.lineTo(64, 112); x.lineTo(52, 102); });
  F(sk, () => x.rect(54, 88, 20, 22));
  if (L.h === 'none' || L.h === 'band' || L.h === 'hat') E(64, 56, L.fem ? 33 : 31, 34, hair);
  E(32, 70, 5, 9, sk); E(96, 70, 5, 9, sk);
  E(64, 66, L.fat ? 31 : L.fem ? 25 : 27, L.fem ? 29 : 31, sk);
  if (L.b === 2) F(bc, () => { x.moveTo(40, 76); x.quadraticCurveTo(38, 112, 64, 138); x.quadraticCurveTo(90, 112, 88, 76); x.quadraticCurveTo(84, 96, 64, 98); x.quadraticCurveTo(44, 96, 40, 76); });
  else if (L.b === 1) { x.save(); x.globalAlpha = .75; F(bc, () => { x.moveTo(40, 78); x.quadraticCurveTo(64, 110, 88, 78); x.quadraticCurveTo(64, 92, 40, 78); }); x.restore(); }
  x.fillStyle = '#fff'; [50, 78].forEach(ex => { x.beginPath(); x.ellipse(ex, 68, 7, L.fem ? 5 : 4.2, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#161012'; x.beginPath(); x.arc(ex, 68, 2.6, 0, 7); x.fill(); x.fillStyle = '#fff'; });
  if (L.patch) { x.fillStyle = '#111'; x.beginPath(); x.ellipse(50, 68, 9, 7, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(36, 58); x.lineTo(92, 62); x.stroke(); }
  x.strokeStyle = L.old ? '#dcdcd8' : (L.b ? bc : hair); x.lineWidth = L.fem ? 2 : 3.2; x.beginPath(); x.moveTo(41, 60); x.lineTo(58, L.fem ? 58 : 56); x.moveTo(70, L.fem ? 58 : 56); x.lineTo(87, 60); x.stroke();
  x.strokeStyle = '#0a0f12'; x.lineWidth = 2; x.beginPath(); x.moveTo(64, 70); x.lineTo(62, 80); x.lineTo(66, 81); x.stroke();
  x.strokeStyle = L.fem ? '#c0303a' : '#6a2a22'; x.beginPath(); x.moveTo(56, 90); x.quadraticCurveTo(64, 93, 72, 90); x.stroke(); x.strokeStyle = '#0a0f12';
  if (L.old) { x.strokeStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.moveTo(42, 80); x.lineTo(46, 86); x.moveTo(86, 80); x.lineTo(82, 86); x.stroke(); x.strokeStyle = '#0a0f12'; }
  const hh = L.h;
  if (hh === 'cap' || hh === 'horns' || hh === 'plume') {
    if (hh === 'horns') [-1, 1].forEach(s => F(t, () => { x.moveTo(64 + s * 22, 44); x.quadraticCurveTo(64 + s * 44, 40, 64 + s * 40, 10); x.quadraticCurveTo(64 + s * 30, 28, 64 + s * 14, 36); }));
    F(hc, () => { x.moveTo(35, 62); x.quadraticCurveTo(34, 26, 64, 24); x.quadraticCurveTo(94, 26, 93, 62); x.lineTo(86, 54); x.lineTo(42, 54); });
    F(t, () => x.rect(38, 50, 52, 7));
    if (hh === 'plume') F(hx(L.pl || 0xffffff), () => { x.moveTo(64, 26); x.quadraticCurveTo(52, 2, 70, 0); x.quadraticCurveTo(82, 12, 66, 28); });
    else if (hh === 'cap') E(64, 22, 5, 5, t);
  } else if (hh === 'band') {
    F(hc, () => x.rect(36, 48, 56, 8)); F(hc, () => { x.moveTo(92, 50); x.lineTo(112, 60); x.lineTo(106, 66); x.lineTo(90, 56); });
  } else if (hh === 'crown') {
    F(t, () => x.rect(40, 34, 48, 16)); F(t, () => { x.moveTo(36, 34); x.lineTo(92, 34); x.lineTo(88, 28); x.lineTo(40, 28); });
    [44, 84].forEach(bx => E(bx, 56, 2.5, 6, t));
  } else if (hh === 'hat') {
    F(hc, () => { x.moveTo(42, 48); x.lineTo(46, 16); x.lineTo(82, 16); x.lineTo(86, 48); }); F(t, () => x.ellipse(64, 48, 38, 6, 0, 0, 7));
  }
  if (L.fem) { F(hair, () => x.arc(64, 26, 14, 0, 7)); F('#e8c040', () => x.rect(74, 20, 18, 4)); E(92, 22, 4, 4, '#d04060'); }
  if (L.fan) { F('#f4f4ee', () => { x.moveTo(104, 144); x.lineTo(84, 100); x.quadraticCurveTo(108, 84, 126, 98); x.closePath(); }); }
  return (FACE[id] = cv.toDataURL());
}
function cry(id, k) { return (typeof LK !== 'undefined' && LK[id] && LK[id][k]) || ''; }
function nameOf(id) { return CH[id] ? CH[id].n : id; }
const NAME2ID = {}; for (const id in CH) NAME2ID[CH[id].n] = id;

// ---------- 画面 ----------
const ROOT = () => $('#app');
function layer(cls) { const l = el('div', 'layer ' + (cls || '')); ROOT().appendChild(l); return l; }
function clearLayers() { ROOT().innerHTML = ''; }
function toast(msg, ms = 1400) {
  const t = el('div', 'toast', msg); document.body.appendChild(t);
  setTimeout(() => t.classList.add('out'), ms * spd()); setTimeout(() => t.remove(), ms * spd() + 400);
}
function waitTap(node) {
  return new Promise(res => {
    const f = e => { e.preventDefault(); node.removeEventListener('pointerup', f); res(); };
    node.addEventListener('pointerup', f);
  });
}
function confirmBox(msg, yes = 'はい', no = 'いいえ') {
  return new Promise(res => {
    const l = el('div', 'modal'); const w = el('div', 'win box', `<p>${msg}</p>`);
    const r = el('div', 'row');
    const b1 = el('button', 'pb pri', yes), b2 = el('button', 'pb', no);
    b1.onclick = () => { l.remove(); res(true); }; b2.onclick = () => { l.remove(); res(false); };
    r.append(b1, b2); w.append(r); l.append(w); document.body.append(l);
  });
}

// ---------- 会話シーン ----------
// 書式: ＃語り / 名前：台詞 / ＠bg 背景 / ＠se 効果音 / ＠bgm 曲 / ＠title 見出し / ？選択A｜選択B / 1＞(選択1のときだけ)
function parseScript(text) {
  const out = [];
  for (let raw of String(text || '').split('\n')) {
    let line = raw.trim(); if (!line) continue;
    let cond = 0; const m = line.match(/^([12])[>＞]/); if (m) { cond = +m[1]; line = line.slice(2).trim(); }
    if (/^[＃#]/.test(line)) { out.push({ k: 'n', t: line.slice(1).trim(), cond }); continue; }
    if (/^[＠@]/.test(line)) { const [c, ...rest] = line.slice(1).trim().split(/\s+/); out.push({ k: 'cmd', c, a: rest.join(' '), cond }); continue; }
    if (/^[？?]/.test(line)) { out.push({ k: 'q', opts: line.slice(1).split(/[｜|]/).map(s => s.trim()), cond }); continue; }
    const i = line.indexOf('：');
    if (i > 0 && i < 12) { out.push({ k: 's', who: line.slice(0, i), t: line.slice(i + 1), cond }); continue; }
    out.push({ k: 'n', t: line, cond });
  }
  return out;
}
const BG_LIST = ['field', 'garden', 'palace', 'camp', 'castle', 'night', 'fire', 'river', 'mountain', 'snow', 'room', 'battle', 'altar', 'storm', 'dark', 'gate', 'rain', 'blood', 'dawn', 'south'];

// ---------- 会話の背景（手描き風の風景） ----------
function paintBg(cv, kind) {
  const W = cv.width = Math.round(cv.clientWidth * 1.5) || 600, H = cv.height = Math.round(cv.clientHeight * 1.5) || 1000;
  const g = cv.getContext('2d'); let seed = 7;
  const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const sky = (a, b, c) => { const s = g.createLinearGradient(0, 0, 0, H); s.addColorStop(0, a); s.addColorStop(0.55, b); s.addColorStop(1, c); g.fillStyle = s; g.fillRect(0, 0, W, H); };
  const ridge = (y, amp, col, n = 5) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, H); const ph = R() * 6; for (let x = 0; x <= W; x += W / 60) g.lineTo(x, y - Math.abs(Math.sin(x / W * n + ph)) * amp - Math.sin(x / W * n * 3.1 + ph) * amp * 0.25); g.lineTo(W, H); g.fill(); };
  const ground = (y, a, b) => { const s = g.createLinearGradient(0, y, 0, H); s.addColorStop(0, a); s.addColorStop(1, b); g.fillStyle = s; g.fillRect(0, y, W, H - y); };
  const tree = (x, y, s, leaf) => { g.fillStyle = '#3a2614'; g.fillRect(x - s * 0.06, y - s * 0.6, s * 0.12, s * 0.6); g.fillStyle = leaf; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(x + (R() - 0.5) * s * 0.7, y - s * 0.6 - R() * s * 0.4, s * (0.18 + R() * 0.12), 0, 7); g.fill(); } };
  const stars = n => { g.fillStyle = '#fff'; for (let i = 0; i < n; i++) { g.globalAlpha = 0.3 + R() * 0.7; g.fillRect(R() * W, R() * H * 0.5, 2, 2); } g.globalAlpha = 1; };
  const tent = (x, y, s, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.8, y); g.lineTo(x - s * 0.8, y); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.15, y); g.lineTo(x - s * 0.15, y); g.fill(); g.strokeStyle = '#5a3a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x, y - s * 1.4); g.stroke(); g.fillStyle = '#c03030'; g.fillRect(x, y - s * 1.4, s * 0.35, s * 0.2); };
  const wall = (y, h, col) => { g.fillStyle = col; g.fillRect(0, y, W, h); g.fillStyle = 'rgba(0,0,0,.18)'; for (let x = 0; x < W; x += 40) g.fillRect(x, y - 16, 24, 16); g.fillStyle = col; for (let x = 0; x < W; x += 40) g.fillRect(x, y - 16, 22, 16); g.strokeStyle = 'rgba(0,0,0,.15)'; for (let yy = y + 20; yy < y + h; yy += 20) { g.beginPath(); g.moveTo(0, yy); g.lineTo(W, yy); g.stroke(); } };
  const roof = (cx, y, w, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(cx - w * 0.6, y); g.quadraticCurveTo(cx - w * 0.3, y - w * 0.12, cx, y - w * 0.22); g.quadraticCurveTo(cx + w * 0.3, y - w * 0.12, cx + w * 0.6, y); g.lineTo(cx + w * 0.5, y + w * 0.06); g.lineTo(cx - w * 0.5, y + w * 0.06); g.fill(); };
  const vign = a => { const v = g.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H * 0.45, H * 0.8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = v; g.fillRect(0, 0, W, H); };
  switch (kind) {
    case 'garden': sky('#f9dfe8', '#fdf0f3', '#b9cf8c'); ridge(H * 0.5, H * 0.08, '#c9b8c8'); ground(H * 0.55, '#a9c47c', '#6f9548');
      for (let i = 0; i < 7; i++) { const x = R() * W, y = H * (0.55 + R() * 0.2), s = H * (0.18 + R() * 0.12); g.fillStyle = '#4a2a18'; g.save(); g.translate(x, y); g.rotate((R() - 0.5) * 0.3); g.fillRect(-s * 0.05, -s * 0.7, s * 0.1, s * 0.7); g.restore(); for (let k = 0; k < 14; k++) { g.fillStyle = ['#ffb3cc', '#ff9ec0', '#ffd0df', '#f78fb3'][k % 4]; g.beginPath(); g.arc(x + (R() - 0.5) * s * 0.9, y - s * 0.7 - R() * s * 0.4, s * (0.08 + R() * 0.08), 0, 7); g.fill(); } }
      g.fillStyle = '#ffc7da'; for (let i = 0; i < 60; i++) { g.globalAlpha = 0.6; g.beginPath(); g.ellipse(R() * W, R() * H, 4, 2.5, R() * 3, 0, 7); g.fill(); } g.globalAlpha = 1; break;
    case 'palace': sky('#2a0806', '#5a1a10', '#3a1a0a'); g.fillStyle = '#7a4a1e'; g.fillRect(0, H * 0.62, W, H); for (let i = 0; i < 5; i++) { const x = W * (0.08 + i * 0.21); g.fillStyle = '#a8281a'; g.fillRect(x, H * 0.12, W * 0.06, H * 0.52); g.fillStyle = '#e8b040'; g.fillRect(x - 6, H * 0.12, W * 0.06 + 12, 12); g.fillRect(x - 6, H * 0.6, W * 0.06 + 12, 14); }
      g.fillStyle = '#c9a227'; g.fillRect(W * 0.3, H * 0.44, W * 0.4, H * 0.06); g.fillStyle = '#5a1010'; g.fillRect(W * 0.38, H * 0.3, W * 0.24, H * 0.14); roof(W / 2, H * 0.12, W * 1.1, '#2a1410'); for (let i = 0; i < 4; i++) { g.fillStyle = '#ffb040'; g.globalAlpha = 0.7; g.beginPath(); g.ellipse(W * (0.18 + i * 0.21), H * 0.24, 14, 20, 0, 0, 7); g.fill(); } g.globalAlpha = 1; vign(0.5); break;
    case 'room': sky('#3a2414', '#4a2e18', '#2a1a0c'); g.fillStyle = '#5a3a20'; for (let x = 0; x < W; x += 60) g.fillRect(x, 0, 6, H * 0.62); g.fillStyle = '#8a6a3a'; g.fillRect(0, H * 0.62, W, H); g.fillStyle = '#e8d8a8'; g.fillRect(W * 0.58, H * 0.12, W * 0.3, H * 0.24); g.strokeStyle = '#5a3a20'; g.lineWidth = 4; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(W * 0.58 + i * W * 0.075, H * 0.12); g.lineTo(W * 0.58 + i * W * 0.075, H * 0.36); g.stroke(); g.beginPath(); g.moveTo(W * 0.58, H * 0.12 + i * H * 0.06); g.lineTo(W * 0.88, H * 0.12 + i * H * 0.06); g.stroke(); }
      const lg = g.createRadialGradient(W * 0.2, H * 0.4, 5, W * 0.2, H * 0.4, H * 0.4); lg.addColorStop(0, 'rgba(255,200,100,.55)'); lg.addColorStop(1, 'rgba(255,200,100,0)'); g.fillStyle = lg; g.fillRect(0, 0, W, H); g.fillStyle = '#ffcc66'; g.fillRect(W * 0.19, H * 0.38, 10, 18); vign(0.5); break;
    case 'camp': case 'battle': sky(kind === 'camp' ? '#e8a868' : '#c8905a', '#f2d4a0', '#8a7040'); ridge(H * 0.5, H * 0.1, '#a88a62'); ridge(H * 0.56, H * 0.06, '#8a7048'); ground(H * 0.58, '#a89058', '#5a4424');
      for (let i = 0; i < 6; i++) tent(W * (0.1 + R() * 0.8), H * (0.62 + R() * 0.14), H * (0.06 + R() * 0.05), ['#f4ecd8', '#e8dcc4', '#d8c8a8'][i % 3]);
      if (kind === 'battle') { g.strokeStyle = '#3a2a1a'; g.lineWidth = 3; for (let i = 0; i < 30; i++) { const x = R() * W, y = H * (0.6 + R() * 0.3); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6, y - H * 0.12); g.stroke(); g.fillStyle = ['#c03030', '#3050a0', '#e0b030'][i % 3]; g.fillRect(x + 6, y - H * 0.12, 18, 12); } } break;
    case 'castle': case 'gate': sky('#a8c8e0', '#e0ecf2', '#7a9a52'); ridge(H * 0.42, H * 0.1, '#9aa8b0'); wall(H * 0.4, H * 0.24, kind === 'gate' ? '#8a7a64' : '#a49c8c'); g.fillStyle = '#3a2a1a'; g.fillRect(W * 0.42, H * 0.5, W * 0.16, H * 0.14); g.beginPath(); g.arc(W / 2, H * 0.5, W * 0.08, Math.PI, 0); g.fill();
      g.fillStyle = '#7a5a3a'; g.fillRect(W * 0.36, H * 0.3, W * 0.28, H * 0.1); roof(W / 2, H * 0.3, W * 0.5, '#5a1a12'); ground(H * 0.64, '#8aa85a', '#4a6a32'); break;
    case 'night': sky('#040818', '#141e40', '#0a140a'); stars(160); g.fillStyle = '#fff8d8'; g.beginPath(); g.arc(W * 0.78, H * 0.14, H * 0.05, 0, 7); g.fill(); g.fillStyle = 'rgba(255,248,216,.15)'; g.beginPath(); g.arc(W * 0.78, H * 0.14, H * 0.1, 0, 7); g.fill();
      ridge(H * 0.5, H * 0.1, '#101a2a'); ground(H * 0.56, '#0e1a12', '#040804'); for (let i = 0; i < 8; i++) tree(R() * W, H * (0.6 + R() * 0.2), H * 0.14, '#0a1a0e'); break;
    case 'fire': sky('#1a0402', '#8a1a06', '#ff7a1a'); for (let i = 0; i < 14; i++) { const x = R() * W, w = W * (0.06 + R() * 0.1), h = H * (0.1 + R() * 0.15); g.fillStyle = '#1a0804'; g.fillRect(x, H * 0.62 - h, w, h); roof(x + w / 2, H * 0.62 - h, w * 1.2, '#100402'); }
      for (let i = 0; i < 40; i++) { const x = R() * W, y = H * (0.45 + R() * 0.25), s = 20 + R() * 60; const f = g.createRadialGradient(x, y, 2, x, y, s); f.addColorStop(0, 'rgba(255,230,120,.9)'); f.addColorStop(0.5, 'rgba(255,120,20,.5)'); f.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = f; g.fillRect(x - s, y - s, s * 2, s * 2); } ground(H * 0.62, '#2a0802', '#0a0200'); break;
    case 'river': sky('#9ac0e0', '#dde9f2', '#2a5a90'); ridge(H * 0.4, H * 0.12, '#7a90a0'); ridge(H * 0.45, H * 0.06, '#5a7080'); const wg = g.createLinearGradient(0, H * 0.48, 0, H); wg.addColorStop(0, '#4a7ab0'); wg.addColorStop(1, '#14305a'); g.fillStyle = wg; g.fillRect(0, H * 0.48, W, H);
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; for (let i = 0; i < 40; i++) { const x = R() * W, y = H * (0.5 + R() * 0.5); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30 + R() * 40, y); g.stroke(); }
      for (let i = 0; i < 3; i++) { const x = W * (0.15 + i * 0.3), y = H * (0.56 + i * 0.05); g.fillStyle = '#3a2210'; g.beginPath(); g.moveTo(x - 50, y); g.lineTo(x + 50, y); g.lineTo(x + 36, y + 14); g.lineTo(x - 36, y + 14); g.fill(); g.fillStyle = '#e8dcc0'; g.fillRect(x - 2, y - 60, 4, 60); g.fillRect(x - 24, y - 56, 46, 34); } break;
    case 'mountain': sky('#9aaabc', '#dfe6ea', '#4a3a28'); ridge(H * 0.35, H * 0.18, '#8a8a90', 3); ridge(H * 0.45, H * 0.15, '#6a5a48', 4); ridge(H * 0.56, H * 0.1, '#4a3c2c', 6); ground(H * 0.62, '#4a3c2a', '#2a2014'); for (let i = 0; i < 10; i++) tree(R() * W, H * (0.62 + R() * 0.2), H * 0.1, '#2a4a28'); break;
    case 'snow': sky('#b8c4ce', '#e8eef2', '#ffffff'); ridge(H * 0.4, H * 0.15, '#dfe6ec', 3); ridge(H * 0.5, H * 0.08, '#cfd8e0'); ground(H * 0.56, '#f6f9fb', '#d8e2ea');
      g.fillStyle = '#6a4a2a'; g.fillRect(W * 0.55, H * 0.5, W * 0.3, H * 0.12); g.fillStyle = '#f4f4f0'; g.beginPath(); g.moveTo(W * 0.5, H * 0.51); g.lineTo(W * 0.7, H * 0.42); g.lineTo(W * 0.9, H * 0.51); g.fill(); g.fillStyle = '#3a2410'; g.fillRect(W * 0.66, H * 0.54, W * 0.06, H * 0.08);
      for (let i = 0; i < 6; i++) tree(W * (0.05 + R() * 0.4), H * (0.58 + R() * 0.1), H * 0.12, '#3a5a3a'); g.fillStyle = '#fff'; for (let i = 0; i < 160; i++) { g.globalAlpha = 0.8; g.beginPath(); g.arc(R() * W, R() * H, 1.5 + R() * 2.5, 0, 7); g.fill(); } g.globalAlpha = 1; break;
    case 'altar': sky('#03050f', '#101836', '#2a1e10'); stars(200); [[.2, .15], [.3, .1], [.4, .13], [.5, .19], [.58, .26], [.64, .34], [.74, .37]].forEach(([x, y]) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(W * x, H * y, 4, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.arc(W * x, H * y, 12, 0, 7); g.fill(); });
      for (let i = 0; i < 3; i++) { g.fillStyle = ['#6a4a2a', '#7a5a34', '#8a6a3e'][i]; g.fillRect(W * (0.2 + i * 0.08), H * (0.6 - i * 0.05), W * (0.6 - i * 0.16), H * 0.05); } for (let i = 0; i < 12; i++) { const x = W * (0.1 + i * 0.075); g.strokeStyle = '#ccc'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, H * 0.7); g.lineTo(x, H * 0.55); g.stroke(); g.fillStyle = ['#c03030', '#3050c0', '#e0c030', '#30a050'][i % 4]; g.fillRect(x, H * 0.55, 16, 22); } ground(H * 0.7, '#2a1e10', '#100a04'); break;
    case 'storm': case 'rain': sky('#3a424a', '#6a747e', '#2a3a2a'); ridge(H * 0.5, H * 0.1, '#4a5452'); ground(H * 0.56, '#3a4a3a', '#1a2418'); g.strokeStyle = 'rgba(220,230,240,.35)'; g.lineWidth = 1.5; for (let i = 0; i < 300; i++) { const x = R() * W, y = R() * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y + 26); g.stroke(); } break;
    case 'dawn': sky('#2a2a5a', '#e0906a', '#3a3424'); g.fillStyle = 'rgba(255,220,150,.8)'; g.beginPath(); g.arc(W * 0.5, H * 0.5, H * 0.08, 0, 7); g.fill(); ridge(H * 0.5, H * 0.1, '#5a4050'); ridge(H * 0.56, H * 0.06, '#3a2a30'); ground(H * 0.6, '#3a3424', '#1a160e'); break;
    case 'south': sky('#e8d870', '#f4eaa8', '#2a5a1a'); ridge(H * 0.48, H * 0.1, '#5a8a4a'); ground(H * 0.54, '#3a7a2a', '#1a4a10'); for (let i = 0; i < 9; i++) { const x = R() * W, y = H * (0.56 + R() * 0.3), s = H * 0.16; g.strokeStyle = '#5a3a1a'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y - s / 2, x + 4, y - s); g.stroke(); g.fillStyle = '#1e5a1a'; for (let k = 0; k < 6; k++) { g.save(); g.translate(x + 4, y - s); g.rotate(k * 1.05); g.beginPath(); g.ellipse(s * 0.2, 0, s * 0.22, s * 0.05, 0, 0, 7); g.fill(); g.restore(); } } break;
    case 'blood': sky('#1a0202', '#4a0606', '#120202'); vign(0.8); break;
    case 'dark': sky('#05040a', '#0a0814', '#020204'); vign(0.6); break;
    default: sky('#8ec5e8', '#d9ecf5', '#5f8a3a'); ridge(H * 0.48, H * 0.1, '#8aa0b0'); ridge(H * 0.53, H * 0.06, '#6a8a6a'); ground(H * 0.55, '#9fbf6a', '#5f8a3a'); for (let i = 0; i < 10; i++) tree(R() * W, H * (0.58 + R() * 0.2), H * 0.12, '#3a6a32');
  }
}
let STORY = null;
async function playScript(text, opt = {}) {
  const lines = parseScript(text); if (!lines.length) return;
  if (TEST) { if (opt.onChoice && lines.some(l => l.k === 'q')) opt.onChoice(2); return 2; }
  const l = layer('story bg-' + (opt.bg || 'field'));
  STORY = { l, skip: false };
  l.innerHTML = `<canvas class="sky"></canvas><div class="deco"></div>
    <div class="place" ${opt.place ? '' : 'hidden'}>${esc(opt.place || '')}</div>
    <button class="pb skipb">スキップ ▶▶</button>
    <div class="stage"><img class="sl" alt="" hidden><img class="sr" alt="" hidden></div>
    <div class="tbox win"><div class="portrait"></div><div class="tx"><div class="who"></div><div class="said"></div></div><div class="next">▼</div></div>`;
  const paint = k => { const c = $('.sky', l); if (k !== 'clear') requestAnimationFrame(() => paintBg(c, k)); };
  paint(opt.bg || 'field');
  const tbox = $('.tbox', l), who = $('.who', l), said = $('.said', l), por = $('.portrait', l), next = $('.next', l);
  const slot = { sl: null, sr: null }; let lastSlot = 'sr';
  const showStage = id => {
    const imgs = { sl: $('.sl', l), sr: $('.sr', l) };
    if (!id) { imgs.sl.classList.add('off'); imgs.sr.classList.add('off'); return; }
    let k = slot.sl === id ? 'sl' : slot.sr === id ? 'sr' : null;
    if (!k) { k = lastSlot === 'sl' ? 'sr' : 'sl'; slot[k] = id; imgs[k].src = face(id); imgs[k].hidden = false; imgs[k].classList.remove('in'); void imgs[k].offsetWidth; imgs[k].classList.add('in'); }
    lastSlot = k; imgs[k].classList.remove('off'); const o = k === 'sl' ? 'sr' : 'sl'; imgs[o].classList.add('off');
  };
  $('.skipb', l).onclick = e => { e.stopPropagation(); STORY.skip = true; if (STORY.adv) STORY.adv(); };
  let choice = opt.choice || 0;
  const tapP = () => new Promise(res => { STORY.adv = res; });
  l.addEventListener('pointerup', e => { if (e.target.closest('.skipb,.choice')) return; if (STORY && STORY.adv) { const a = STORY.adv; STORY.adv = null; a(); } });
  for (const ln of lines) {
    if (ln.cond && ln.cond !== choice) continue;
    if (ln.k === 'cmd') {
      if (ln.c === 'bg') { l.className = 'layer story bg-' + ln.a; paint(ln.a); }
      else if (ln.c === 'se') { (SE[ln.a] || (() => {}))(); }
      else if (ln.c === 'bgm') { playBgm(ln.a); }
      else if (ln.c === 'title' && !STORY.skip) {
        const c = el('div', 'titlecard', `<b>${esc(ln.a)}</b>`); l.append(c); SE.gong(); await sleep(1700); c.remove();
      }
      continue;
    }
    if (ln.k === 'q') {
      // 選択肢はスキップ中でも必ず選ばせる
      tbox.hidden = true;
      choice = await new Promise(res => {
        const box = el('div', 'choice');
        ln.opts.forEach((o, i) => { const b = el('button', 'pb', esc(o)); b.onclick = e => { e.stopPropagation(); SE.tap(); box.remove(); res(i + 1); }; box.append(b); });
        l.append(box);
      });
      tbox.hidden = false; if (opt.onChoice) opt.onChoice(choice); STORY.skip = false; continue;
    }
    if (STORY.skip) continue;
    tbox.hidden = false;
    const t = ln.t.replace(/／/g, '\n');
    if (ln.k === 'n') { tbox.classList.add('nar'); who.textContent = ''; por.hidden = true; showStage(null); }
    else {
      tbox.classList.remove('nar'); who.textContent = ln.who; const id = NAME2ID[ln.who];
      por.hidden = !!id || opt.bg === 'clear'; por.style.backgroundImage = 'none'; por.classList.add('anon'); if (id) showStage(id); else showStage(null);
      if (opt.bg === 'clear' && id) { por.hidden = false; por.classList.remove('anon'); por.style.backgroundImage = `url(${face(id)})`; }
    }
    next.hidden = true; said.textContent = '';
    let typing = true; const p = tapP();
    const chars = [...t]; let i = 0;
    await new Promise(res => {
      const step = () => {
        if (!typing || STORY.skip) { said.textContent = t; res(); return; }
        said.textContent = chars.slice(0, ++i).join('');
        if (i >= chars.length) { res(); return; } setTimeout(step, 24 * spd());
      };
      STORY.adv = () => { typing = false; }; step();
    });
    typing = false; next.hidden = false;
    if (!STORY.skip) await tapP();
  }
  l.remove(); STORY = null;
  return choice;
}

// ---------- タイトル ----------
function titleScreen() {
  clearLayers(); stopBgm();
  const l = layer('title');
  const has = !!loadSave() && (SV.idx > 0 || Object.keys(SV.seen).length);
  l.innerHTML = `<div class="tbg"></div><div class="tlogo"><small>三國志</small><h1>決戦伝</h1><p>桃園の誓いから天下統一まで</p></div>
    <div class="tmenu"></div><div class="tfoot dim">タップで操作／セーブは自動</div>`;
  const m = $('.tmenu', l);
  const add = (t, f, cls) => { const b = el('button', 'pb ' + (cls || ''), t); b.onclick = () => { SE.tap(); actx(); f(); }; m.append(b); };
  if (has) add(`つづきから <small>${esc(sceneLabel(SV.idx))}</small>`, () => runFrom(SV.idx), 'pri');
  add('はじめから', async () => {
    if (has && !(await confirmBox('今までの記録を消して、はじめから遊びますか？'))) return;
    SV = newSave(); save(); runFrom(0);
  }, has ? '' : 'pri');
  add('名場面録', gallery);
  add('武将一覧', roster);
  add('遊び方', howto);
  add('設定', settings);
}
function sceneLabel(i) { const s = SC[i]; return s ? `${CHAPTERS[s.ch].split('　')[0]}・${s.title}` : '完'; }
function howto() {
  const l = layer('modal');
  l.innerHTML = `<div class="win box scroll"><h2>遊び方</h2>
  <p>物語は会話シーンと合戦で進む。会話は画面をタップで進む。</p>
  <p><b>合戦</b>　青＝自軍、緑＝友軍、赤＝敵軍。自軍の部隊をタップ→青いマスで移動先→行動を選ぶ。全員が行動すると敵の番になる。</p>
  <p><b>三すくみ</b>　騎兵は歩兵に、歩兵は弓兵に、弓兵は騎兵に強い。</p>
  <p><b>地形</b>　森・山・城・関所にいると受けるダメージが減る。城・村・陣にいると毎ターン回復。</p>
  <p><b>計略</b>　軍師は策略ポイントを使って火計・落石・混乱・援助（回復）などを使える。君主は援助と鼓舞。</p>
  <p><b>一騎打ち</b>　因縁のある武将同士が戦うと、名場面の一騎打ちが起こる。</p>
  <p><b>撤退</b>　自軍の武将はやられても死なず撤退するだけ。ただし敗北条件の武将が撤退すると負け。</p>
  <p>敵をタップすると、その部隊が届く範囲が赤く出る。地図はドラッグで動かせる。</p>
  <button class="pb pri">閉じる</button></div>`;
  $('button', l).onclick = () => l.remove();
}
function settings() {
  const l = layer('modal');
  const draw = () => {
    l.innerHTML = `<div class="win box"><h2>設定</h2>
    <div class="row"><span>速さ</span><button class="pb ${SV.opt.spd === 1 ? 'on' : ''}" data-s="1">ふつう</button><button class="pb ${SV.opt.spd === 0.5 ? 'on' : ''}" data-s="0.5">はやい</button><button class="pb ${SV.opt.spd === 0.25 ? 'on' : ''}" data-s="0.25">最速</button></div>
    <div class="row"><span>難易度</span><button class="pb ${SV.opt.easy ? 'on' : ''}" data-e="1">やさしい</button><button class="pb ${!SV.opt.easy ? 'on' : ''}" data-e="0">ふつう</button></div>
    <div class="row"><span>音</span><button class="pb ${SV.opt.snd ? 'on' : ''}" data-a="1">あり</button><button class="pb ${!SV.opt.snd ? 'on' : ''}" data-a="0">なし</button></div>
    <button class="pb pri close">閉じる</button></div>`;
    l.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { SV.opt.spd = +b.dataset.s; save(); draw(); });
    l.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { SV.opt.easy = +b.dataset.e; save(); draw(); });
    l.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { SV.opt.snd = +b.dataset.a; if (!SV.opt.snd) stopBgm(); save(); draw(); });
    $('.close', l).onclick = () => l.remove();
  };
  draw();
}
function roster() {
  const l = layer('modal');
  const seenIds = new Set(); SC.forEach((s, i) => { if (SV.seen[i] || i < SV.idx) (s.cast || []).forEach(id => seenIds.add(id)); });
  const ids = Object.keys(CH).filter(id => seenIds.has(id) || SV.lv[id]);
  const facs = { shu: '蜀', wei: '魏', wu: '呉', qun: '群雄', han: '漢', nan: '南蛮', jin: '晋' };
  l.innerHTML = `<div class="win box scroll"><h2>武将一覧 <small>${ids.length}/${Object.keys(CH).length}</small></h2><div class="grid"></div><button class="pb pri">閉じる</button></div>`;
  const g = $('.grid', l);
  ids.forEach(id => {
    const c = CH[id], lv = SV.lv[id] ? SV.lv[id][0] : '-';
    const d = el('div', 'rcard', `<img src="${face(id)}" alt=""><div><b>${c.n}</b><small>${facs[c.f] || ''}・${CLS[c.c].n}</small><small>武${c.b} 知${c.i} 統${c.t}　Lv${lv}</small></div>`);
    g.append(d);
  });
  if (!ids.length) g.append(el('p', 'dim', '物語を進めると武将が増える。'));
  $('.pb.pri', l).onclick = () => l.remove();
}
function gallery() {
  const l = layer('modal');
  let total = 0, got = 0;
  let html = '<div class="win box scroll"><h2>名場面録</h2><p class="dim small">見た場面はもう一度見られる。合戦は「戦う」で再戦できる。</p>';
  CHAPTERS.forEach((cn, ci) => {
    html += `<h3>${cn}</h3><ol class="glist">`;
    SC.forEach((s, i) => {
      if (s.ch !== ci) return;
      const seen = SV.seen[i] || i < SV.idx; total += s.tags.length; if (seen) got += s.tags.length;
      const tagHtml = s.tags.filter(t => t !== s.title).map(t => `<span class="tag">${esc(t)}</span>`).join('');
      html += `<li class="${seen ? '' : 'lock'}"><span class="gt">${s.type === 'bt' ? '<i class="bt">戦</i>' : ''}${seen ? esc(s.title) : '？？？'}${seen ? tagHtml : ''}</span>${seen ? `<span class="ga"><button class="pb mini" data-v="${i}">観る</button>${s.type === 'bt' ? `<button class="pb mini" data-b="${i}">戦う</button>` : ''}</span>` : ''}</li>`;
    });
    html += '</ol>';
  });
  html += `<button class="pb pri close">閉じる</button></div>`;
  l.innerHTML = html;
  $('h2', l).insertAdjacentHTML('beforeend', ` <small>${got}/${total}</small>`);
  $('.close', l).onclick = () => l.remove();
  l.querySelectorAll('[data-v]').forEach(b => b.onclick = async () => {
    const s = SC[+b.dataset.v]; l.remove();
    playBgm(s.bgm || 'story');
    if (s.type === 'ev') await playScript(s.text, { bg: s.bg, place: s.place });
    else { await playScript(s.pre, { bg: s.bg || 'battle', place: s.place }); await playScript(s.post, { bg: s.postBg || s.bg || 'camp', place: s.place }); }
    titleScreen(); gallery();
  });
  l.querySelectorAll('[data-b]').forEach(b => b.onclick = async () => {
    const s = SC[+b.dataset.b]; l.remove(); clearLayers();
    const r = await runBattle(s, true); titleScreen();
  });
}

// ---------- 進行 ----------
async function runFrom(i) {
  clearLayers();
  while (i < SC.length) {
    SV.idx = i; save();
    const s = SC[i];
    if (i === 0 || SC[i - 1].ch !== s.ch) await chapterCard(s.ch);
    if (s.type === 'ev') {
      playBgm(s.bgm || 'story');
      await playScript(s.text, { bg: s.bg, place: s.place, onChoice: c => { SV.choice[i] = c; save(); } });
    } else {
      const r = await runBattle(s, false);
      if (r === 'quit') { titleScreen(); return; }
    }
    SV.seen[i] = true; i++; SV.idx = i; save();
  }
  ending();
}
async function chapterCard(ch) {
  if (TEST) return;
  const l = layer('chcard'); const [a, b] = CHAPTERS[ch].split('　');
  l.innerHTML = `<div><small>${a}</small><b>${b}</b></div>`; SE.gong(); playBgm('story');
  await Promise.race([sleep(2200), waitTap(l)]); l.remove();
}
async function ending() {
  playBgm('sad');
  const l = layer('chcard end');
  l.innerHTML = `<div><small>完</small><b>三國志決戦伝</b><p>滾滾たる長江は東に逝き、<br>浪花は英雄を淘い尽くす。<br>是非成敗、頭を転ずれば空し。</p><p class="dim">遊んでくれてありがとう。名場面録からいつでも見返せる。</p></div>`;
  await waitTap(l); titleScreen();
}

// ---------- 合戦 ----------
const STRAT = {
  '火計': { mp: 6, rg: 3, tg: 'foe', pow: 1.0, fire: 1, desc: '火を放つ。森で威力増。水上・雪では使えない' },
  '落石': { mp: 8, rg: 3, tg: 'foe', pow: 1.25, rock: 1, desc: '岩を落とす。自分か相手が山・丘にいるとき' },
  '混乱': { mp: 6, rg: 3, tg: 'foe', conf: 2, desc: '敵を混乱させ、1ターン動けなくする' },
  '妖術': { mp: 7, rg: 4, tg: 'foe', pow: 1.1, desc: '妖しい術で打ち倒す' },
  '援助': { mp: 5, rg: 2, tg: 'ally', heal: 1, desc: '味方1部隊を回復' },
  '大援助': { mp: 12, rg: 0, area: 2, tg: 'ally', heal: 1.2, desc: '周囲2マスの味方を回復' },
  '鼓舞': { mp: 4, rg: 2, tg: 'ally', buff: 2, desc: '味方の攻撃力を上げる(2ターン)' },
};
const CLSKEY = { 歩: 'inf', 騎: 'cav', 弓: 'arc', 賊: 'bandit', 策: 'strat', 藤: 'rattan', 象: 'beast', 猛: 'brute', 民: 'civ', 道: 'taoist', 君: 'lord' };
let B = null; // 合戦の状態

function lvOf(id) { return SV.lv[id] ? SV.lv[id][0] : 1; }
function mkUnit(spec, side, sc) {
  let [id, x, y, o] = spec; o = o || {};
  let base, cls, name, gen = false;
  if (CH[id]) { base = CH[id]; cls = base.c; name = base.n; }
  else {
    const [ck, nm] = id.split(':'); cls = CLSKEY[ck] || 'inf'; name = nm || CLS[cls].n; gen = true;
    base = { b: GEN.b, i: GEN.i, t: GEN.t }; id = 'g' + Math.random().toString(36).slice(2, 8);
  }
  if (o.cls) cls = o.cls;
  const c = CLS[cls];
  let lv;
  const easy = side === 'e' && SV.opt.easy ? 2 : 0;
  if (side === 'p' && !gen) lv = Math.max(lvOf(id), o.lv || sc.plv || 1);
  else if (side === 'p') lv = o.lv || sc.plv || 1;
  else lv = Math.max(1, (o.lv || (side === 'a' ? (sc.alv || sc.elv || 1) : (sc.elv || 1)) + (gen ? 0 : 1)) - easy);
  const u = { id, name, side, cls, lv, gen, x, y, px: x, py: y, b: base.b, i: base.i, t: base.t, done: false, conf: 0, buff: 0, ai: o.ai || (side === 'p' ? null : 'aggr'), boss: !!o.boss, key: !!o.key, exp: (!gen && SV.lv[id]) ? SV.lv[id][1] : 0, tag: o.tag, tgt: o.tgt, alpha: 1 };
  if (o.mv) u.mvBonus = o.mv;
  for (const k of ['goto', 'fleeTo', 'ign', 'tough', 'leash', 'fleeOut', 'hidden']) if (o[k] != null) u[k] = o[k];
  calcStats(u, true);
  if (o.hp) u.hp = Math.max(1, Math.round(u.mhp * o.hp));
  return u;
}
function calcStats(u, full) {
  const c = CLS[u.cls];
  const mhp = Math.round((48 + u.t * 0.9 + u.lv * 10) * c.hp * (u.gen ? 0.8 : 1));
  const mmp = c.st ? Math.round(u.i * 0.22 + u.lv * 1.6) : 0;
  if (full) { u.hp = mhp; u.mp = mmp; } else { u.hp += mhp - (u.mhp || mhp); u.mp += mmp - (u.mmp || mmp); }
  u.mhp = mhp; u.mmp = mmp;
  u.at = Math.round(u.b * 0.7 + u.lv * 2.6 + c.at);
  u.df = Math.round(u.t * 0.36 + u.lv * 1.9 + c.df);
  u.mv = c.mv + (u.mvBonus || 0);
}
function short(u) {
  if (u.gen) return CLS[u.cls].ic;
  const n = u.name; return n.length >= 3 ? n.slice(-2) : n;
}
const ter = (x, y) => (B.map[y] && B.map[y][x]) || '#';
const unitAt = (x, y) => B.units.find(u => u.x === x && u.y === y && u.hp > 0);
const foes = (a, b) => (a.side === 'e') !== (b.side === 'e');
const alive = () => B.units.filter(u => u.hp > 0);
const dist = (a, b, c, d) => Math.abs(a - c) + Math.abs(b - d);

function moveCost(u, ch) {
  const t = TER[ch] || TER['#']; let c = t.c[MT[CLS[u.cls].mt]];
  if (B && B.def.naval && ch === 'W') c = 2;
  return c;
}
// 移動範囲(ダイクストラ)。敵は通れない、味方は通れるが止まれない
function reach(u, mvOverride) {
  const mv = mvOverride != null ? mvOverride : u.mv;
  const best = { [K(u.x, u.y)]: 0 }, par = {}; const q = [[0, u.x, u.y]];
  while (q.length) {
    q.sort((a, b) => a[0] - b[0]); const [d, x, y] = q.shift();
    if (d > best[K(x, y)]) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= B.W || ny >= B.H) continue;
      const o = unitAt(nx, ny); if (o && foes(o, u)) continue;
      const nd = d + moveCost(u, ter(nx, ny)); if (nd > mv) continue;
      const k = K(nx, ny); if (best[k] == null || nd < best[k]) { best[k] = nd; par[k] = K(x, y); q.push([nd, nx, ny]); }
    }
  }
  const tiles = new Set();
  for (const k in best) { const [x, y] = k.split(',').map(Number); const o = unitAt(x, y); if (!o || o === u) tiles.add(k); }
  return { tiles, par };
}
function pathTo(r, u, k) { const p = []; let c = k; while (c && c !== K(u.x, u.y)) { p.unshift(c); c = r.par[c]; } return p.map(s => s.split(',').map(Number)); }
// 地図全体の距離（目標へ向かうため）
function distMap(u, targets) {
  const D = {}; const q = [];
  for (const [x, y] of targets) { D[K(x, y)] = 0; q.push([0, x, y]); }
  while (q.length) {
    q.sort((a, b) => a[0] - b[0]); const [d, x, y] = q.shift(); if (d > D[K(x, y)]) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= B.W || ny >= B.H) continue;
      const c = moveCost(u, ter(x, y)); if (c >= X) continue;
      const cc = moveCost(u, ter(nx, ny)); if (cc >= X) continue;
      const nd = d + cc; const k = K(nx, ny); if (D[k] == null || nd < D[k]) { D[k] = nd; q.push([nd, nx, ny]); }
    }
  }
  return D;
}
function inRange(u, x, y, tx, ty) { const d = dist(x, y, tx, ty); const rg = CLS[u.cls].rg; return d >= rg[0] && d <= rg[1]; }
function triMul(a, d) { if ((TRI[a.cls] || []).includes(d.cls)) return 1.25; if ((TRI[d.cls] || []).includes(a.cls)) return 0.85; return 1; }
function dmgCalc(a, d, avg) {
  const td = (TER[ter(d.x, d.y)] || {}).d || 0;
  let base = a.at * triMul(a, d) * (a.buff > 0 ? 1.2 : 1) - d.df * 0.5;
  let v = base * (1 - td / 100); v = Math.max(4, v);
  return avg ? Math.round(v) : Math.round(v * rnd(0.9, 1.1));
}
function stratDmg(a, d, s, avg) {
  const S = STRAT[s];
  let v = (a.i * 0.85 + a.lv * 3.2) * S.pow - d.i * 0.22;
  if (S.fire) { const t = ter(d.x, d.y); if (t === 'f' || t === 'S' || t === 'k') v *= 1.3; if (CLS[d.cls].fireWeak) v *= 2.2; }
  v = Math.max(10, v); return avg ? Math.round(v) : Math.round(v * rnd(0.9, 1.1));
}
function stratHit(a, d, s) { if (STRAT[s].tg === 'ally') return 100; return clamp(Math.round(72 + (a.i - d.i) * 0.6), 25, 98); }
function stratUsable(u, s, x, y, t) {
  const S = STRAT[s]; if (u.mp < S.mp) return false;
  if (S.fire) { const c = ter(t.x, t.y); if (['w', 'W', 'n'].includes(c) || B.def.rain || B.rain) return false; }
  if (S.rock) { const c1 = ter(x, y), c2 = ter(t.x, t.y); if (!['m', 'h', 'M'].includes(c1) && !['m', 'h', 'M'].includes(c2)) return false; }
  return true;
}
function unitStrats(u) { return (CLS[u.cls].st || []).concat(u.extraSt || []); }
function stratTargets(u, s, x, y) {
  const S = STRAT[s];
  if (S.area) return alive().filter(o => !foes(o, u) && dist(x, y, o.x, o.y) <= S.area && o.hp < o.mhp && CLS[o.cls].rg[1] >= 0);
  return alive().filter(o => (S.tg === 'foe' ? foes(o, u) : !foes(o, u)) && dist(x, y, o.x, o.y) <= S.rg && (S.tg === 'foe' || o !== u || S.heal) && stratUsable(u, s, x, y, o) && (!S.heal || o.hp < o.mhp));
}

// --- 描画 ---
function buildTerrain() {
  const T = B.T, c = document.createElement('canvas'); c.width = B.W * T; c.height = B.H * T; const g = c.getContext('2d');
  for (let y = 0; y < B.H; y++) for (let x = 0; x < B.W; x++) drawTile(g, ter(x, y), x * T, y * T, T, x, y);
  g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 1;
  for (let x = 0; x <= B.W; x++) { g.beginPath(); g.moveTo(x * T + .5, 0); g.lineTo(x * T + .5, B.H * T); g.stroke(); }
  for (let y = 0; y <= B.H; y++) { g.beginPath(); g.moveTo(0, y * T + .5); g.lineTo(B.W * T, y * T + .5); g.stroke(); }
  B.terr = c;
}
function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; }
function drawTile(g, ch, X0, Y0, T, x, y) {
  const t = TER[ch] || TER['#']; const r = hash(x, y);
  const water = ['w', 'W', 'b', 'S', 'z'].includes(ch);
  g.fillStyle = water ? (ch === 'w' ? TER.w.col : TER.W.col) : t.col; g.fillRect(X0, Y0, T, T);
  if (!water && ch !== '#' && ch !== 'p') { g.fillStyle = `rgba(255,255,255,${0.04 + r * 0.05})`; g.fillRect(X0 + r * T * 0.6, Y0 + (1 - r) * T * 0.6, T * 0.25, T * 0.12); }
  const u = T / 32;
  const tri = (cx, cy, w, h, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(cx, cy - h); g.lineTo(cx + w, cy); g.lineTo(cx - w, cy); g.fill(); };
  switch (ch) {
    case 'f': for (let i = 0; i < 3; i++) { const cx = X0 + T * (0.25 + 0.27 * i) + r * 3, cy = Y0 + T * (i === 1 ? 0.55 : 0.8); g.fillStyle = '#5a3a20'; g.fillRect(cx - u, cy, 2 * u, 4 * u); tri(cx, cy, 6 * u, 16 * u, i === 1 ? '#2f5f2a' : '#3a6e32'); } break;
    case 'm': tri(X0 + T / 2, Y0 + T * 0.92, T * 0.48, T * 0.8, '#6e5a44'); tri(X0 + T / 2, Y0 + T * 0.36, T * 0.14, T * 0.24, '#e8e0d0'); break;
    case 'M': tri(X0 + T * 0.35, Y0 + T, T * 0.4, T * 0.95, '#4a3c30'); tri(X0 + T * 0.7, Y0 + T, T * 0.35, T * 0.7, '#3e3228'); tri(X0 + T * 0.35, Y0 + T * 0.25, T * 0.1, T * 0.2, '#ddd'); break;
    case 'h': g.fillStyle = '#8f8448'; g.beginPath(); g.ellipse(X0 + T / 2, Y0 + T * 0.8, T * 0.45, T * 0.35, 0, Math.PI, 0); g.fill(); break;
    case 'w': case 'W': g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = u * 1.5; for (let i = 0; i < 2; i++) { const yy = Y0 + T * (0.3 + 0.4 * i) + r * 3; g.beginPath(); g.moveTo(X0 + 4 * u, yy); g.quadraticCurveTo(X0 + T / 2, yy - 4 * u, X0 + T - 4 * u, yy); g.stroke(); } break;
    case 'b': g.fillStyle = '#9a6a3a'; g.fillRect(X0, Y0 + T * 0.15, T, T * 0.7); g.strokeStyle = '#5a3a1a'; g.lineWidth = 1; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(X0 + i * T / 5, Y0 + T * 0.15); g.lineTo(X0 + i * T / 5, Y0 + T * 0.85); g.stroke(); } break;
    case 'S': g.fillStyle = '#6a4424'; g.beginPath(); g.moveTo(X0 + 2 * u, Y0 + T * 0.45); g.lineTo(X0 + T - 2 * u, Y0 + T * 0.45); g.lineTo(X0 + T * 0.8, Y0 + T * 0.85); g.lineTo(X0 + T * 0.2, Y0 + T * 0.85); g.fill(); g.fillStyle = '#ddd2b8'; g.fillRect(X0 + T * 0.45, Y0 + T * 0.08, u * 2, T * 0.4); g.fillRect(X0 + T * 0.25, Y0 + T * 0.12, T * 0.5, T * 0.22); g.strokeStyle = '#3a2410'; g.lineWidth = u * 1.5; g.beginPath(); g.moveTo(X0, Y0 + T * 0.65); g.lineTo(X0 + T, Y0 + T * 0.65); g.stroke(); break;
    case 'c': g.fillStyle = '#9a9488'; g.fillRect(X0 + 3 * u, Y0 + T * 0.45, T - 6 * u, T * 0.5); g.fillStyle = '#a03a2a'; g.beginPath(); g.moveTo(X0 + u, Y0 + T * 0.48); g.lineTo(X0 + T / 2, Y0 + T * 0.12); g.lineTo(X0 + T - u, Y0 + T * 0.48); g.fill(); g.fillStyle = '#3a2a1a'; g.fillRect(X0 + T * 0.4, Y0 + T * 0.7, T * 0.2, T * 0.25); break;
    case 'g': g.fillStyle = '#8a8070'; g.fillRect(X0, Y0 + T * 0.3, T, T * 0.7); g.fillStyle = '#4a3a2a'; g.fillRect(X0 + T * 0.3, Y0 + T * 0.5, T * 0.4, T * 0.5); g.fillStyle = '#7a2a1a'; g.fillRect(X0, Y0 + T * 0.2, T, T * 0.12); break;
    case 'v': for (let i = 0; i < 2; i++) { const cx = X0 + T * (0.3 + 0.4 * i), cy = Y0 + T * (0.45 + 0.3 * i); g.fillStyle = '#e8dcc0'; g.fillRect(cx - 6 * u, cy, 12 * u, 8 * u); tri(cx, cy + u, 8 * u, 7 * u, '#6a4a2a'); } break;
    case 'k': tri(X0 + T * 0.35, Y0 + T * 0.85, T * 0.28, T * 0.5, '#f2ead8'); tri(X0 + T * 0.7, Y0 + T * 0.75, T * 0.22, T * 0.4, '#e8dcc8'); g.fillStyle = '#c03030'; g.fillRect(X0 + T * 0.34, Y0 + T * 0.18, T * 0.16, T * 0.1); break;
    case 'x': g.fillStyle = '#5a3a1a'; for (let i = 0; i < 4; i++) g.fillRect(X0 + T * (0.1 + 0.25 * i), Y0 + T * 0.3, 3 * u, T * 0.6); g.fillRect(X0, Y0 + T * 0.45, T, 2 * u); break;
    case '#': g.fillStyle = '#5a5650'; for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) g.fillRect(X0 + i * T / 2 + (j % 2) * T / 4 + 1, Y0 + j * T / 4 + 1, T / 2 - 2, T / 4 - 2); break;
    case 'p': g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 1; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(X0, Y0 + i * T / 4); g.lineTo(X0 + T, Y0 + i * T / 4); g.stroke(); } break;
    case 'a': g.fillStyle = '#b8902a'; g.fillRect(X0 + T * 0.15, Y0 + T * 0.15, T * 0.7, T * 0.7); g.fillStyle = '#f8f0c0'; for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; g.fillRect(X0 + T / 2 + Math.cos(a) * T * 0.25 - u, Y0 + T / 2 + Math.sin(a) * T * 0.25 - u, 2 * u, 2 * u); } break;
    case 'n': g.fillStyle = '#fff'; for (let i = 0; i < 4; i++) g.fillRect(X0 + hash(x + i, y) * T, Y0 + hash(x, y + i) * T, 2 * u, 2 * u); break;
    case 's': g.fillStyle = 'rgba(90,60,30,.35)'; for (let i = 0; i < 5; i++) g.fillRect(X0 + hash(x + i, y * 3) * T, Y0 + hash(x * 3, y + i) * T, 2 * u, u); break;
    case 'z': g.strokeStyle = '#2a2a2a'; g.lineWidth = 3 * u; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(X0 + T / 2, Y0 + T * (0.18 + i * 0.32), 4 * u, 6 * u, 0, 0, 7); g.stroke(); } g.strokeStyle = '#aaa'; g.lineWidth = u; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(X0 + T / 2, Y0 + T * (0.18 + i * 0.32), 4 * u, 6 * u, 0, 0, 7); g.stroke(); } break;
    case 'r': g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(X0, Y0 + T * 0.3, T, T * 0.4); break;
  }
}
let RAF = 0;
function render() {
  if (!B || !B.cv) return;
  const g = B.g, T = B.T, cw = B.cv.width / B.dpr, chh = B.cv.height / B.dpr;
  g.setTransform(B.dpr, 0, 0, B.dpr, 0, 0);
  g.fillStyle = '#0a0d14'; g.fillRect(0, 0, cw, chh);
  g.save(); g.translate(-Math.round(B.cam.x), -Math.round(B.cam.y));
  g.drawImage(B.terr, 0, 0);
  const now = performance.now();
  // 炎
  for (const k in B.fire) { const [x, y] = k.split(',').map(Number); const f = 0.5 + 0.3 * Math.sin(now / 120 + x * 3 + y); g.fillStyle = `rgba(255,${80 + 60 * f | 0},20,${0.35 + 0.25 * f})`; g.fillRect(x * T, y * T, T, T); g.fillStyle = `rgba(255,220,80,${0.5 * f})`; g.beginPath(); g.moveTo(x * T + T * 0.2, y * T + T); g.quadraticCurveTo(x * T + T / 2, y * T - T * 0.2 * f, x * T + T * 0.8, y * T + T); g.fill(); }
  // 目標地点
  if (B.goal) for (const [x, y] of B.goal) { g.strokeStyle = `rgba(255,230,90,${0.5 + 0.4 * Math.sin(now / 250)})`; g.lineWidth = 2; g.strokeRect(x * T + 3, y * T + 3, T - 6, T - 6); }
  const hl = (set, col) => { if (!set) return; g.fillStyle = col; for (const k of set) { const [x, y] = k.split(',').map(Number); g.fillRect(x * T + 1, y * T + 1, T - 2, T - 2); } };
  hl(B.hl.threat, 'rgba(255,60,60,.28)'); hl(B.hl.move, 'rgba(70,140,255,.42)'); hl(B.hl.atk, 'rgba(255,80,60,.45)'); hl(B.hl.ally, 'rgba(80,255,140,.4)');
  if (B.cursor) { const [x, y] = B.cursor; g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(x * T + 1.5, y * T + 1.5, T - 3, T - 3); }
  // 部隊
  const us = B.units.filter(u => u.hp > 0 || u.alpha > 0.02).sort((a, b) => a.py - b.py);
  for (const u of us) drawUnit(g, u, T, now);
  // 浮き文字
  B.fx = B.fx.filter(f => now - f.t0 < f.d);
  for (const f of B.fx) {
    const k = (now - f.t0) / f.d;
    if (f.kind === 'txt') { g.font = `bold ${Math.round(T * 0.5)}px DotGothic16, sans-serif`; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = '#000'; g.fillStyle = f.col; const yy = f.y * T + T * 0.3 - k * T * 0.6; g.strokeText(f.s, f.x * T + T / 2, yy); g.fillText(f.s, f.x * T + T / 2, yy); }
    if (f.kind === 'slash') { g.strokeStyle = `rgba(255,255,255,${1 - k})`; g.lineWidth = 3; g.beginPath(); g.moveTo(f.x * T + T * (0.1 + k * 0.2), f.y * T + T * 0.1); g.lineTo(f.x * T + T * (0.9 - k * 0.2), f.y * T + T * 0.9); g.stroke(); }
    if (f.kind === 'boom') { g.fillStyle = `rgba(255,${150 - 100 * k | 0},40,${1 - k})`; g.beginPath(); g.arc(f.x * T + T / 2, f.y * T + T / 2, T * (0.2 + k * 0.6), 0, 7); g.fill(); }
    if (f.kind === 'heal') { g.fillStyle = `rgba(120,255,170,${1 - k})`; for (let i = 0; i < 5; i++) g.fillRect(f.x * T + T * (0.15 + i * 0.17), f.y * T + T * (0.9 - k * 0.8) - (i % 2) * 6, 3, 6); }
  }
  g.restore();
  RAF = requestAnimationFrame(render);
}
const SIDECOL = { p: ['#2e64d8', '#a8c4ff'], a: ['#2a9a54', '#a8ffc8'], e: ['#c43030', '#ffb4a8'] };
function drawUnit(g, u, T, now) {
  const x = u.px * T, y = u.py * T, [c1, c2] = SIDECOL[u.side];
  g.save(); g.globalAlpha = u.alpha;
  if (u.shake) { g.translate(Math.sin(now / 20) * 3, 0); }
  const r = T * 0.42, cx = x + T / 2, cy = y + T / 2;
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(cx, y + T * 0.9, r * 0.9, r * 0.3, 0, 0, 7); g.fill();
  // 旗
  if (!u.gen) { g.fillStyle = '#ddd'; g.fillRect(x + T * 0.78, y + T * 0.02, 1.5, T * 0.4); g.fillStyle = c1; g.fillRect(x + T * 0.8, y + T * 0.03, T * 0.17, T * 0.16); }
  g.fillStyle = u.done && u.side === 'p' ? '#555' : c1; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
  g.lineWidth = u.boss ? 3 : 2; g.strokeStyle = u.boss ? '#ffd84a' : c2; g.stroke();
  if (u.gen) { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(cx, cy, r * 0.65, 0, 7); g.fill(); }
  const s = short(u); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${Math.round(T * (s.length > 1 ? 0.34 : 0.44))}px DotGothic16, sans-serif`;
  g.fillText(s, cx, cy + 1);
  if (!u.gen) { g.font = `${Math.round(T * 0.22)}px DotGothic16, sans-serif`; g.fillStyle = '#000'; g.fillRect(x, y + T * 0.02, T * 0.28, T * 0.26); g.fillStyle = c2; g.fillText(CLS[u.cls].ic, x + T * 0.14, y + T * 0.16); }
  // HPバー
  const w = T * 0.8, hpk = clamp(u.hp / u.mhp, 0, 1);
  g.fillStyle = '#000'; g.fillRect(x + T * 0.1, y + T * 0.86, w, 4);
  g.fillStyle = hpk > 0.5 ? '#5fe07a' : hpk > 0.25 ? '#ffd24a' : '#ff5a4a'; g.fillRect(x + T * 0.1, y + T * 0.86, w * hpk, 4);
  if (u.conf > 0) { g.fillStyle = '#ffe04a'; g.font = `${Math.round(T * 0.3)}px sans-serif`; g.fillText('?', x + T * 0.85, y + T * 0.2 + Math.sin(now / 150) * 2); }
  if (u.buff > 0) { g.fillStyle = '#ff9a3a'; g.font = `${Math.round(T * 0.28)}px sans-serif`; g.fillText('↑', x + T * 0.1, y + T * 0.75); }
  g.restore();
}
function fx(kind, x, y, s, col, d = 900) { B.fx.push({ kind, x, y, s, col, t0: performance.now(), d: d * spd() }); }

// --- 合戦の開始 ---
async function runBattle(sc, replay) {
  clearLayers(); playBgm('story');
  if (sc.pre) await playScript(sc.pre, { bg: sc.bg || 'battle', place: sc.place });
  while (true) {
    const r = await battle(sc, replay);
    if (r === 'win') {
      if (sc.post) { playBgm(sc.postBgm || 'story'); await playScript(sc.post, { bg: sc.postBg || 'camp', place: sc.place }); }
      return 'win';
    }
    if (r === 'quit') return 'quit';
    // 敗北
    const again = await defeatScreen(sc);
    if (!again) return 'quit';
  }
}
function defeatScreen(sc) {
  if (TEST) return Promise.resolve(false);
  return new Promise(res => {
    playBgm('sad');
    const l = layer('modal');
    l.innerHTML = `<div class="win box"><h2>敗北……</h2><p>${esc(B && B.loseMsg || '我が軍は敗れた。')}</p><p class="dim small">経験値はそのまま残っている。もう一度挑めば有利になる。</p><div class="row"><button class="pb pri">もう一度</button><button class="pb">タイトルへ</button></div></div>`;
    const [a, b] = l.querySelectorAll('button'); a.onclick = () => { l.remove(); res(true); }; b.onclick = () => { l.remove(); res(false); };
  });
}
function parseMap(m) { return m.trim().split('\n').map(r => r.trim()); }
function battle(sc, replay) {
  return new Promise(resolve => {
    clearLayers();
    const map = parseMap(sc.map);
    B = { sc, def: sc, map: map.map(r => r.split('')), W: map[0].length, H: map.length, units: [], turn: 1, side: 'p', hl: {}, fx: [], fire: {}, flags: {}, used: {}, resolve, busy: false, cam: { x: 0, y: 0 }, replay, maxTurn: sc.turns || 30 };
    for (const s of sc.p || []) B.units.push(mkUnit(s, 'p', sc));
    for (const s of sc.a || []) B.units.push(mkUnit(s, 'a', sc));
    for (const s of sc.e || []) B.units.push(mkUnit(s, 'e', sc));
    if (sc.win && sc.win.t === 'reach' && sc.win.area) { const [x0, y0, x1, y1] = sc.win.area; B.goal = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) B.goal.push([x, y]); }
    if (sc.setup) sc.setup(B, API);
    const l = layer('battle');
    l.innerHTML = `<div class="bhud"><span class="turn"></span><span class="cond"></span><button class="pb mini menub">≡</button></div>
      <canvas id="map"></canvas>
      <div class="binfo win"></div>
      <div class="bbar"><button class="pb endb">ターン終了</button><button class="pb nextb">未行動へ</button><button class="pb condb">目的</button></div>
      <div class="amenu" hidden></div><div class="banner" hidden></div>`;
    B.l = l; B.cv = $('#map', l); B.g = B.cv.getContext('2d');
    resize(); window.addEventListener('resize', resize); B.onResize = resize;
    buildTerrain(); setupInput();
    $('.endb', l).onclick = () => { if (B.side === 'p' && !B.busy) { SE.tap(); endPlayerTurn(); } };
    $('.nextb', l).onclick = () => { if (B.busy || B.side !== 'p') return; const u = B.units.find(u => u.side === 'p' && u.hp > 0 && !u.done); if (u) { centerOn(u.x, u.y); selectUnit(u); } };
    $('.condb', l).onclick = () => showCond();
    $('.menub', l).onclick = () => battleMenu();
    updHud(); cancelAnimationFrame(RAF); RAF = requestAnimationFrame(render);
    $('.binfo', l).innerHTML = '<div class="dim small">青の部隊をタップ→青いマスへ移動→行動。敵をタップで攻撃範囲を表示。</div>';
    const lead = B.units.find(u => u.side === 'p' && !u.gen); if (lead) centerOn(lead.x, lead.y, true);
    (async () => {
      playBgm(sc.bgm || 'battle');
      await showCond(true);
      battleLoop();
    })();
  });
}
function resize() {
  if (!B || !B.cv) return;
  const l = B.l; const hud = $('.bhud', l).offsetHeight, bar = $('.bbar', l).offsetHeight, info = $('.binfo', l).offsetHeight || 0;
  const w = window.innerWidth, h = window.innerHeight - hud - bar - Math.max(info, 64);
  B.dpr = Math.min(2, window.devicePixelRatio || 1);
  const T = Math.max(30, Math.min(64, Math.floor(Math.min(w / B.W, h / B.H))));
  const changed = B.T !== T; B.T = T;
  B.vw = w; B.vh = h; B.cv.style.width = w + 'px'; B.cv.style.height = h + 'px'; B.cv.width = w * B.dpr; B.cv.height = h * B.dpr;
  if (changed && B.map) buildTerrain();
  clampCam();
}
function clampCam() {
  const mw = B.W * B.T, mh = B.H * B.T;
  B.cam.x = mw <= B.vw ? -(B.vw - mw) / 2 : clamp(B.cam.x, 0, mw - B.vw);
  B.cam.y = mh <= B.vh ? -(B.vh - mh) / 2 : clamp(B.cam.y, 0, mh - B.vh);
}
function centerOn(x, y, instant) {
  const tx = x * B.T + B.T / 2 - B.vw / 2, ty = y * B.T + B.T / 2 - B.vh / 2;
  if (instant) { B.cam.x = tx; B.cam.y = ty; clampCam(); return; }
  const sx = B.cam.x, sy = B.cam.y; const want = { x: tx, y: ty }; const c = { ...B.cam }; B.cam.x = tx; B.cam.y = ty; clampCam(); const ex = B.cam.x, ey = B.cam.y; B.cam.x = sx; B.cam.y = sy;
  if (Math.abs(ex - sx) + Math.abs(ey - sy) < 4) return;
  const t0 = performance.now(), d = 220 * spd();
  const step = () => { const k = clamp((performance.now() - t0) / d, 0, 1); B.cam.x = sx + (ex - sx) * k; B.cam.y = sy + (ey - sy) * k; if (k < 1) requestAnimationFrame(step); };
  step();
}
function onScreen(x, y) { const px = x * B.T - B.cam.x, py = y * B.T - B.cam.y; return px > -2 && py > -2 && px < B.vw - B.T + 2 && py < B.vh - B.T + 2; }
function updHud() {
  if (!B || !B.l) return;
  $('.turn', B.l).textContent = `第${B.turn}ターン／${B.maxTurn}`;
  $('.cond', B.l).textContent = B.def.wtxt || '';
  const ps = B.units.filter(u => u.side === 'p' && u.hp > 0);
  $('.endb', B.l).disabled = B.side !== 'p';
  $('.nextb', B.l).disabled = B.side !== 'p' || !ps.some(u => !u.done);
}
async function showCond(first) {
  if (TEST && first) return;
  const l = layer('modal');
  const sc = B.def;
  l.innerHTML = `<div class="win box"><h2>${esc(sc.title)}</h2><p class="dim">${esc(sc.place || '')}</p>
    <p><b class="gold">勝利条件</b>　${esc(sc.wtxt || '敵の全滅')}</p><p><b class="red">敗北条件</b>　${esc(sc.ltxt || '劉備の撤退')}／${B.maxTurn}ターン経過</p>
    ${sc.hint ? `<p class="dim small">${esc(sc.hint)}</p>` : ''}<button class="pb pri">${first ? '出陣！' : '閉じる'}</button></div>`;
  await waitTap($('button', l)); l.remove(); if (first) SE.gong();
}
async function battleMenu() {
  if (B.busy) return;
  const l = layer('modal');
  l.innerHTML = `<div class="win box"><h2>軍議</h2><div class="col">
  <button class="pb" data-a="cond">勝利条件を見る</button><button class="pb" data-a="list">部隊一覧</button><button class="pb" data-a="set">設定</button><button class="pb" data-a="retry">はじめからやり直す</button><button class="pb" data-a="quit">タイトルへ戻る</button><button class="pb pri" data-a="close">閉じる</button></div></div>`;
  l.querySelectorAll('[data-a]').forEach(b => b.onclick = async () => {
    const a = b.dataset.a; l.remove();
    if (a === 'cond') showCond();
    if (a === 'set') settings();
    if (a === 'list') unitList();
    if (a === 'retry' && await confirmBox('この合戦をはじめからやり直しますか？')) endBattle('retry');
    if (a === 'quit' && await confirmBox('タイトルに戻りますか？（合戦の途中経過は消える）')) endBattle('quit');
  });
}
function unitList() {
  const l = layer('modal'); const us = alive().sort((a, b) => 'pae'.indexOf(a.side) - 'pae'.indexOf(b.side));
  l.innerHTML = `<div class="win box scroll"><h2>部隊一覧</h2><table class="ut">${us.map(u => `<tr class="s${u.side}"><td>${esc(u.name)}</td><td>${CLS[u.cls].n}</td><td>Lv${u.lv}</td><td>${u.hp}/${u.mhp}</td></tr>`).join('')}</table><button class="pb pri">閉じる</button></div>`;
  $('button', l).onclick = () => l.remove();
}
function endBattle(r) {
  if (!B) return; B.ended = true;
  window.removeEventListener('resize', B.onResize); cancelAnimationFrame(RAF);
  const res = B.resolve; const keep = B; if (r !== 'retry') { /* 結果画面に使う */ }
  setTimeout(() => { if (r === 'retry') { res(battleRestart(keep.sc, keep.replay)); } else res(r); }, 0);
}
function battleRestart(sc, replay) { return battle(sc, replay); }

// --- 入力 ---
function setupInput() {
  const cv = B.cv; let down = null;
  cv.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, cx: B.cam.x, cy: B.cam.y, moved: false }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => {
    if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (Math.abs(dx) + Math.abs(dy) > 10) down.moved = true;
    if (down.moved) { B.cam.x = down.cx - dx; B.cam.y = down.cy - dy; clampCam(); }
  });
  cv.addEventListener('pointerup', e => {
    if (!down) return; const d = down; down = null; if (d.moved) return;
    const r = cv.getBoundingClientRect(); const tx = Math.floor((e.clientX - r.left + B.cam.x) / B.T), ty = Math.floor((e.clientY - r.top + B.cam.y) / B.T);
    if (tx < 0 || ty < 0 || tx >= B.W || ty >= B.H) return; onTap(tx, ty);
  });
}
const UI = { mode: 'idle', sel: null, r: null, from: null, strat: null };
function resetUI() { UI.mode = 'idle'; UI.sel = null; UI.r = null; UI.strat = null; B.hl = {}; B.cursor = null; $('.amenu', B.l).hidden = true; }
function info(u, x, y) {
  const bi = $('.binfo', B.l);
  if (!u) { const t = TER[ter(x, y)]; bi.innerHTML = `<div class="ti"><b>${t.n}</b><span class="dim">防御${t.d > 0 ? '+' : ''}${t.d}%${t.h ? '　回復' + t.h + '%' : ''}</span></div>`; return; }
  const t = TER[ter(u.x, u.y)];
  const side = { p: '自軍', a: '友軍', e: '敵軍' }[u.side];
  bi.innerHTML = `${u.gen ? `<div class="fc gen s${u.side}">${CLS[u.cls].ic}</div>` : `<img class="fc" src="${face(u.id)}" alt="">`}
   <div class="ui"><div><b>${esc(u.name)}</b> <small class="s${u.side}">${side}</small> <small>${CLS[u.cls].n} Lv${u.lv}</small>${u.boss ? ' <small class="gold">大将</small>' : ''}</div>
   <div class="bar"><i style="width:${u.hp / u.mhp * 100}%"></i><span>兵 ${u.hp}/${u.mhp}</span></div>
   ${u.mmp ? `<div class="bar mp"><i style="width:${u.mp / u.mmp * 100}%"></i><span>策 ${u.mp}/${u.mmp}</span></div>` : ''}
   <div class="st">攻${u.at} 防${u.df} 知${u.i} 移${u.mv}　${t.n}${t.d ? (t.d > 0 ? '+' : '') + t.d + '%' : ''}${u.side === 'p' && !u.gen ? `　経験${u.exp}/100` : ''}${u.conf ? '　<span class="gold">混乱</span>' : ''}</div></div>`;
}
function threat(u) {
  const r = reach(u); const s = new Set();
  for (const k of r.tiles) { const [x, y] = k.split(',').map(Number); const rg = CLS[u.cls].rg; for (let dy = -rg[1]; dy <= rg[1]; dy++) for (let dx = -rg[1]; dx <= rg[1]; dx++) { const d = Math.abs(dx) + Math.abs(dy); if (d >= rg[0] && d <= rg[1]) s.add(K(x + dx, y + dy)); } }
  return s;
}
function selectUnit(u) {
  resetUI(); UI.sel = u; B.cursor = [u.x, u.y]; info(u);
  if (u.side === 'p' && !u.done && B.side === 'p') {
    if (u.conf > 0) { toast(`${u.name}は混乱している`); return; }
    UI.mode = 'move'; UI.r = reach(u); B.hl.move = UI.r.tiles;
  } else { B.hl.threat = threat(u); }
}
async function onTap(x, y) {
  if (B.busy || B.ended) return;
  const u = unitAt(x, y);
  if (B.side !== 'p') { if (u) info(u); return; }
  if (UI.mode === 'move') {
    const s = UI.sel;
    if (u === s) { SE.tap(); await moveDone(s, s.x, s.y); return; }
    if (UI.r.tiles.has(K(x, y))) { SE.move(); B.busy = true; const path = pathTo(UI.r, s, K(x, y)); UI.from = [s.x, s.y]; await animMove(s, path); B.busy = false; await moveDone(s, x, y); return; }
    if (u) { SE.tap(); selectUnit(u); return; }
    resetUI(); info(null, x, y); return;
  }
  if (UI.mode === 'atk' || UI.mode === 'strat') {
    const s = UI.sel; const set = UI.mode === 'atk' ? B.hl.atk : (B.hl.atk || B.hl.ally);
    if (u && set && set.has(K(x, y))) { await forecast(s, u); return; }
    // 範囲外タップで行動メニューに戻る
    actMenu(s); return;
  }
  if (UI.mode === 'menu') { actMenu(UI.sel); return; }
  if (u) { SE.tap(); selectUnit(u); } else { resetUI(); info(null, x, y); }
}
function animMove(u, path) {
  return new Promise(res => {
    if (!path.length) { res(); return; }
    let i = 0; const stepD = 70 * spd();
    const go = () => {
      if (i >= path.length) { const [x, y] = path[path.length - 1]; u.x = x; u.y = y; u.px = x; u.py = y; res(); return; }
      const [nx, ny] = path[i]; const sx = u.px, sy = u.py; const t0 = performance.now();
      const st = () => { const k = clamp((performance.now() - t0) / stepD, 0, 1); u.px = sx + (nx - sx) * k; u.py = sy + (ny - sy) * k; if (k < 1) requestAnimationFrame(st); else { i++; go(); } };
      st();
    };
    u.x = path[path.length - 1][0]; u.y = path[path.length - 1][1]; // 位置は先に確定（描画は補間）
    go();
  });
}
async function moveDone(u, x, y) {
  B.hl = {}; B.cursor = [u.x, u.y];
  // 到達イベント
  if (await checkReach(u)) return;
  actMenu(u);
}
function actMenu(u) {
  UI.mode = 'menu'; UI.sel = u; B.hl = {}; B.cursor = [u.x, u.y]; info(u);
  const m = $('.amenu', B.l); m.innerHTML = ''; m.hidden = false;
  m.classList.toggle('left', u.x * B.T - B.cam.x > B.vw / 2);
  const tg = alive().filter(o => foes(o, u) && inRange(u, u.x, u.y, o.x, o.y));
  const add = (t, f, dis) => { const b = el('button', 'pb', t); b.disabled = !!dis; b.onclick = e => { e.stopPropagation(); SE.tap(); f(); }; m.append(b); };
  add('攻撃', () => { UI.mode = 'atk'; m.hidden = true; B.hl = { atk: new Set(tg.map(o => K(o.x, o.y))) }; }, !tg.length || CLS[u.cls].rg[1] === 0);
  const sts = unitStrats(u);
  if (sts.length) add('計略', () => stratMenu(u), !sts.some(s => stratTargets(u, s, u.x, u.y).length || (STRAT[s].area && u.mp >= STRAT[s].mp)));
  add('待機', () => { m.hidden = true; finishAct(u); });
  add('戻る', () => {
    m.hidden = true;
    if (UI.from) { u.x = u.px = UI.from[0]; u.y = u.py = UI.from[1]; UI.from = null; }
    selectUnit(u);
  });
}
function stratMenu(u) {
  const m = $('.amenu', B.l); m.innerHTML = '';
  for (const s of unitStrats(u)) {
    const S = STRAT[s]; const tg = stratTargets(u, s, u.x, u.y);
    const ok = u.mp >= S.mp && (S.area ? tg.length > 0 : tg.length > 0);
    const b = el('button', 'pb', `${s}<small>${S.mp}</small>`); b.disabled = !ok; b.title = S.desc;
    b.onclick = async e => {
      e.stopPropagation(); SE.tap(); UI.strat = s;
      if (S.area) { m.hidden = true; B.busy = true; await doStrat(u, s, tg); B.busy = false; finishAct(u); return; }
      UI.mode = 'strat'; m.hidden = true; const set = new Set(tg.map(o => K(o.x, o.y)));
      B.hl = S.tg === 'foe' ? { atk: set } : { ally: set }; toast(`${s}：${S.desc}`, 1200);
    };
    m.append(b);
  }
  const bk = el('button', 'pb', '戻る'); bk.onclick = e => { e.stopPropagation(); actMenu(u); }; m.append(bk);
}
function forecast(a, d) {
  return new Promise(res => {
    const l = layer('modal fc-modal'); let html;
    if (UI.mode === 'atk') {
      const dm = dmgCalc(a, d, true); const kill = dm >= d.hp; const cnt = !kill && inRange(d, d.x, d.y, a.x, a.y) && d.conf <= 0 && CLS[d.cls].rg[1] > 0 ? dmgCalc(d, a, true) : 0;
      const tri = triMul(a, d);
      html = `<p><b>${esc(a.name)}</b> → <b>${esc(d.name)}</b>${tri > 1 ? ' <span class="gold">有利</span>' : tri < 1 ? ' <span class="red">不利</span>' : ''}</p><p>与える損害 約${dm}（残り${Math.max(0, d.hp - dm)}）${kill ? '　<span class="gold">撃破！</span>' : ''}</p><p class="dim">${cnt ? `反撃 約${cnt}` : '反撃なし'}</p>`;
    } else {
      const S = STRAT[UI.strat];
      html = `<p><b>${esc(a.name)}</b>の${UI.strat} → <b>${esc(d.name)}</b></p>` + (S.tg === 'foe' ? (S.conf ? `<p>成功率 ${stratHit(a, d, UI.strat)}%</p>` : `<p>損害 約${stratDmg(a, d, UI.strat, true)}　成功率 ${stratHit(a, d, UI.strat)}%</p>`) : '<p>味方に使う</p>');
    }
    l.innerHTML = `<div class="win box">${html}<div class="row"><button class="pb pri">決定</button><button class="pb">やめる</button></div></div>`;
    const [y, n] = l.querySelectorAll('button');
    y.onclick = async () => { l.remove(); B.busy = true; if (UI.mode === 'atk') await doAttack(a, d); else await doStrat(a, UI.strat, [d]); B.busy = false; if (!B.ended) finishAct(a); res(); };
    n.onclick = () => { l.remove(); res(); };
  });
}
function finishAct(u) {
  u.done = true; UI.from = null; resetUI(); info(u); updHud();
  if (B.ended) return;
  if (checkEnd()) return;
  if (B.side === 'p' && !B.units.some(o => o.side === 'p' && o.hp > 0 && !o.done)) setTimeout(() => { if (!B.ended && B.side === 'p' && !B.busy) endPlayerTurn(); }, 350 * spd());
}

// --- 戦闘処理 ---
async function lunge(a, d) {
  const sx = a.px, sy = a.py, dx = (d.x - a.x), dy = (d.y - a.y), L = Math.hypot(dx, dy) || 1;
  const t0 = performance.now(), D = 200 * spd();
  await new Promise(r => { const st = () => { const k = clamp((performance.now() - t0) / D, 0, 1); const o = Math.sin(k * Math.PI) * 0.35; a.px = sx + dx / L * o; a.py = sy + dy / L * o; if (k < 1) requestAnimationFrame(st); else { a.px = sx; a.py = sy; r(); } }; st(); });
}
async function hit(a, d, dmg, crit) {
  if (d.tough && !B.inDuel) { dmg = Math.min(dmg, d.hp - 1); if (dmg <= 0) { fx('txt', d.x, d.y, 'びくともしない', '#ffd84a'); SE.miss(); await sleep(400); if (!B.used['tough' + d.id]) { B.used['tough' + d.id] = 1; toast(d.toughMsg || `${d.name}は並の兵では倒せない。因縁の武将で挑め！`, 2200); } return; } }
  d.hp = Math.max(0, d.hp - dmg); fx('slash', d.x, d.y); fx('txt', d.x, d.y, (crit ? '会心 ' : '') + dmg, crit ? '#ffe04a' : '#fff');
  (crit ? SE.crit : SE.hit)(); d.shake = true; await sleep(260); d.shake = false;
}
async function doAttack(a, d) {
  if (!onScreen(d.x, d.y)) { centerOn(d.x, d.y); await sleep(200); }
  B.cursor = [d.x, d.y];
  // 一騎打ち
  const duel = findDuel(a, d);
  if (duel) { await runDuel(duel, a, d); return; }
  if (B.def.noAttack && a.side === 'p') { B.flags.lose = true; B.loseMsg = B.def.noAttackMsg || '計が見破られた！'; }
  await lunge(a, d);
  const crit = Math.random() < clamp((a.b - 50) / 260, 0, 0.2);
  let dm = dmgCalc(a, d) * (crit ? 1.5 : 1) | 0;
  await hit(a, d, dm, crit);
  gainExp(a, d, d.hp <= 0);
  if (d.hp <= 0) { await defeat(d, a); return; }
  // 反撃
  if (inRange(d, d.x, d.y, a.x, a.y) && d.conf <= 0 && CLS[d.cls].rg[1] > 0) {
    await sleep(120); await lunge(d, a);
    const c2 = Math.random() < clamp((d.b - 50) / 260, 0, 0.2);
    const dm2 = Math.round(dmgCalc(d, a) * (c2 ? 1.5 : 1));
    await hit(d, a, dm2, c2); gainExp(d, a, a.hp <= 0, 0.5);
    if (a.hp <= 0) await defeat(a, d);
  }
}
async function doStrat(a, s, targets) {
  const S = STRAT[s]; a.mp -= S.mp;
  if (B.def.noAttack && a.side === 'p' && S.tg === 'foe') { B.flags.lose = true; B.loseMsg = B.def.noAttackMsg || '計が見破られた！'; }
  const t0 = targets[0]; if (t0 && !onScreen(t0.x, t0.y)) { centerOn(t0.x, t0.y); await sleep(200); }
  await banner(`${a.name}の${s}！`, 700);
  for (const d of targets) {
    if (S.heal) { const v = Math.round((30 + a.i * 0.55 + a.lv * 2.5) * S.heal); const got = Math.min(v, d.mhp - d.hp); d.hp += got; fx('heal', d.x, d.y); fx('txt', d.x, d.y, '+' + got, '#7affaa'); SE.heal(); gainExp(a, d, false, 0.8); await sleep(300); continue; }
    if (S.buff) { d.buff = S.buff; fx('txt', d.x, d.y, '攻撃UP', '#ff9a3a'); SE.heal(); gainExp(a, d, false, 0.6); await sleep(300); continue; }
    if (Math.random() * 100 >= stratHit(a, d, s)) { fx('txt', d.x, d.y, '失敗', '#aaa'); SE.miss(); gainExp(a, d, false, 0.3); await sleep(400); continue; }
    if (S.conf) { d.conf = S.conf; fx('txt', d.x, d.y, '混乱', '#ffe04a'); SE.miss(); gainExp(a, d, false, 0.8); await sleep(400); continue; }
    fx('boom', d.x, d.y); if (S.fire) { SE.fire(); B.fire[K(d.x, d.y)] = 2; } else SE.crit();
    const dm = stratDmg(a, d, s); await hit(a, d, dm, false);
    gainExp(a, d, d.hp <= 0);
    if (d.hp <= 0) await defeat(d, a);
  }
}
function gainExp(a, d, kill, mul = 1) {
  if (a.side !== 'p' || a.gen) return;
  let e = (10 + (d.lv - a.lv) * 3) * mul; if (kill) e += d.gen ? 25 : 45; if (d.boss && kill) e += 30;
  e = Math.max(2, Math.round(e)); a.exp += e;
  while (a.exp >= 100) {
    a.exp -= 100; a.lv++; calcStats(a, false); a.hp = Math.min(a.mhp, a.hp + 10); fx('txt', a.x, a.y, 'Lv UP!', '#7ad7ff', 1300); SE.lvup();
  }
  SV.lv[a.id] = [a.lv, a.exp]; save();
}
async function defeat(d, by) {
  const t0 = performance.now(); const D = 450 * spd();
  await new Promise(r => { const st = () => { const k = clamp((performance.now() - t0) / D, 0, 1); d.alpha = 1 - k; if (k < 1) requestAnimationFrame(st); else r(); }; st(); });
  d.alpha = 0;
  const ev = (B.def.onDefeat || {})[d.id] || (B.def.onDefeat || {})[d.tag];
  if (ev && !B.used['def' + (d.id)]) {
    B.used['def' + d.id] = 1;
    if (ev.text) await say(ev.text);
    if (ev.do) await ev.do(B, API, by);
  } else if (!d.gen) {
    const m = d.side === 'p' ? `${d.name}は撤退した` : `${d.name}を撃破！`; await banner(m, 800);
  }
  if (d.side === 'p' && (B.def.lose || ['liubei']).includes(d.id)) { B.flags.lose = true; B.loseMsg = B.loseMsg || `${d.name}が撤退した。`; }
  checkEnd();
}
function banner(t, ms = 1000) {
  const b = $('.banner', B.l); b.textContent = t; b.hidden = false; b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
  return sleep(ms).then(() => { b.hidden = true; });
}
async function say(text) {
  if (!text) return; const prev = B.busy; B.busy = true;
  if (B.l) $('.amenu', B.l).hidden = true;
  await playScript(text, { bg: 'clear', place: '' });
  B.busy = prev;
}
// 一騎打ち
function findDuel(a, d) {
  for (const [i, du] of (B.def.duels || []).entries()) {
    if (B.used['duel' + i]) continue;
    const ok = (du.a.includes(a.id) && (du.d === d.id || du.d === d.tag)) || (du.both && du.a.includes(d.id) && (du.d === a.id || du.d === a.tag));
    if (ok) return Object.assign({ i }, du);
  }
  return null;
}
async function runDuel(du, a, d) {
  B.used['duel' + du.i] = 1;
  const [me, foe] = du.a.includes(a.id) ? [a, d] : [d, a];
  const l = layer('duel'); SE.duel(); playBgm('boss');
  l.innerHTML = `<div class="dv"><img src="${face(me.id)}" alt=""><b>VS</b><img src="${face(foe.id)}" alt=""></div><div class="dt">一騎打ち<br><small>${esc(me.name)} 対 ${esc(foe.name)}</small></div>${cry(me.id, 'sp') ? `<div class="dcry">${esc(me.name)}「${esc(cry(me.id, 'sp'))}」</div>` : ''}${cry(foe.id, 'sp') ? `<div class="dcry foe">${esc(foe.name)}「${esc(cry(foe.id, 'sp'))}」</div>` : ''}`;
  await Promise.race([sleep(2600), waitTap(l)]); l.remove();
  await say(du.text);
  const res = du.res || 'kill';
  if (res === 'kill') { fx('slash', foe.x, foe.y); SE.crit(); foe.hp = 0; gainExp(me, foe, true); await defeat(foe, me); }
  else if (res === 'flee') { foe.hp = Math.max(1, Math.round(foe.hp * 0.3)); fx('txt', foe.x, foe.y, '敗走', '#fff'); gainExp(me, foe, false, 2); await removeUnit(foe); }
  else if (res === 'hurt') { foe.hp = Math.max(1, Math.round(foe.hp * 0.35)); fx('txt', foe.x, foe.y, '痛手', '#fff'); gainExp(me, foe, false, 2); }
  else if (res === 'draw') { gainExp(me, foe, false, 1.5); fx('txt', foe.x, foe.y, '引き分け', '#ccc'); }
  if (du.do) await du.do(B, API, me, foe);
  playBgm(B.def.bgm || 'battle');
  checkEnd();
}
async function removeUnit(u) {
  const t0 = performance.now(); const D = 400 * spd();
  await new Promise(r => { const st = () => { const k = clamp((performance.now() - t0) / D, 0, 1); u.alpha = 1 - k; if (k < 1) requestAnimationFrame(st); else r(); }; st(); });
  u.hp = 0; u.alpha = 0; u.gone = true;
}

// --- 勝敗とイベント ---
function winMet() {
  const w = B.def.win || { t: 'rout' }; const ws = Array.isArray(w) ? w : [w];
  return ws.some(w => {
    if (w.t === 'rout') return !B.units.some(u => u.side === 'e' && u.hp > 0 && !u.ign);
    if (w.t === 'boss') return w.ids.every(id => B.units.some(u => u.id === id || u.tag === id) && !B.units.some(u => (u.id === id || u.tag === id) && u.hp > 0));
    if (w.t === 'survive') return B.turn > w.n;
    if (w.t === 'flag') return !!B.flags.win;
    return false;
  }) || !!B.flags.win;
}
function checkEnd() {
  if (B.ended) return true;
  if (B.flags.lose) { finishBattle('lose'); return true; }
  if (winMet()) { finishBattle('win'); return true; }
  return false;
}
async function finishBattle(r) {
  if (B.ended || B.finishing) return; B.finishing = true;
  // 進行中のアニメを待つ
  await sleep(400);
  if (r === 'win') {
    SE.win(); stopBgm(); await banner('勝利！', 1400);
    // 勝利ボーナス
    const ps = B.units.filter(u => u.side === 'p' && !u.gen);
    const bonus = Math.max(10, 40 - Math.max(0, B.turn - 5) * 2);
    for (const u of ps) { u.exp += bonus; while (u.exp >= 100) { u.exp -= 100; u.lv++; calcStats(u, false); } SV.lv[u.id] = [u.lv, u.exp]; }
    save();
    const l = layer('modal');
    l.innerHTML = `<div class="win box"><h2>勝利！</h2><p class="dim">${esc(B.def.title)}　${B.turn}ターン</p><p>出陣した武将に経験値 +${bonus}</p><table class="ut">${ps.map(u => `<tr><td>${esc(u.name)}</td><td>Lv${u.lv}</td><td>経験${u.exp}</td></tr>`).join('')}</table><button class="pb pri">つづく</button></div>`;
    if (!TEST) await waitTap($('button', l)); l.remove();
  } else { SE.lose(); stopBgm(); await banner('敗北……', 1200); }
  endBattle(r);
}
async function checkReach(u) {
  const w = B.def.win; const ws = Array.isArray(w) ? w : [w];
  for (const wv of ws) {
    if (wv && wv.t === 'reach' && (wv.who ? wv.who.includes(u.id) : u.side === 'p')) {
      const [x0, y0, x1, y1] = wv.area;
      if (u.x >= x0 && u.x <= x1 && u.y >= y0 && u.y <= y1) {
        if (wv.need && !wv.need(B)) continue;
        u.done = true; resetUI(); B.flags.win = true; checkEnd(); return true;
      }
    }
  }
  for (const [i, e] of (B.def.events || []).entries()) {
    if (e.when !== 'reach' || B.used['ev' + i]) continue;
    if (e.who && !e.who.includes(u.id)) continue; if (!e.who && u.side !== 'p') continue;
    const [x0, y0, x1, y1] = e.area;
    if (u.x >= x0 && u.x <= x1 && u.y >= y0 && u.y <= y1) { B.used['ev' + i] = 1; B.busy = true; await runEv(e, u); B.busy = false; if (checkEnd()) return true; }
  }
  return false;
}
async function runEv(e, u) {
  if (e.text) await say(e.text);
  if (e.spawn) for (const [side, specs] of e.spawn) API.spawn(side, specs);
  if (e.do) await e.do(B, API, u);
  updHud();
}
async function turnEvents(side) {
  for (const [i, e] of (B.def.events || []).entries()) {
    if (B.used['ev' + i] || B.ended) continue;
    let fire = false;
    if (e.turn != null && e.turn === B.turn && (e.side || 'p') === side) fire = true;
    if (e.when === 'count' && side === 'p' && B.units.filter(u => u.side === 'e' && u.hp > 0).length <= e.n) fire = true;
    if (e.when === 'near' && side === 'p') { const a = B.units.find(u => u.id === e.a && u.hp > 0), b = B.units.find(u => (u.id === e.b || u.tag === e.b) && u.hp > 0); if (a && b && dist(a.x, a.y, b.x, b.y) <= (e.d || 3)) fire = true; }
    if (e.when === 'hp' && side === 'p') { const a = B.units.find(u => u.id === e.id && u.hp > 0); if (a && a.hp / a.mhp <= e.below) fire = true; }
    if (fire) { B.used['ev' + i] = 1; B.busy = true; await runEv(e); B.busy = false; if (checkEnd()) return; }
  }
}
// シナリオから使う道具
const API = {
  spawn(side, specs) { for (const s of specs) { let [id, x, y, o] = s; let p = [x, y]; if (unitAt(x, y)) p = freeNear(x, y); const u = mkUnit([id, p[0], p[1], o], side, B.def); B.units.push(u); fx('txt', u.x, u.y, '出現', '#fff'); } },
  remove(id) { for (const u of B.units) if ((u.id === id || u.tag === id) && u.hp > 0) { u.hp = 0; u.alpha = 0; u.gone = true; } },
  get(id) { return B.units.find(u => (u.id === id || u.tag === id) && u.hp > 0); },
  all(f) { return B.units.filter(u => u.hp > 0 && f(u)); },
  setTer(x, y, ch) { B.map[y][x] = ch; },
  rebuild() { buildTerrain(); },
  fire(x, y, t = 2) { B.fire[K(x, y)] = t; },
  win() { B.flags.win = true; },
  lose(msg) { B.flags.lose = true; B.loseMsg = msg; },
  ai(f, mode) { for (const u of B.units) if (u.hp > 0 && f(u)) u.ai = mode; },
  side(id, s) { const u = API.get(id); if (u) { u.side = s; u.done = true; if (s === 'p') u.ai = null; } },
  move(id, x, y) { const u = API.get(id); if (u) { const p = unitAt(x, y) ? freeNear(x, y) : [x, y]; u.x = u.px = p[0]; u.y = u.py = p[1]; } },
  hurt(u, n) { u.hp = Math.max(0, u.hp - n); fx('txt', u.x, u.y, '' + n, '#ff8'); },
  flag(k, v = true) { B.flags[k] = v; }, has(k) { return !!B.flags[k]; },
  rain(on) { B.rain = on; if (on) B.fire = {}; },
  burn(f, t = 3) { for (let y = 0; y < B.H; y++) for (let x = 0; x < B.W; x++) if (f(ter(x, y), x, y)) B.fire[K(x, y)] = t; },
  flood(from, to, dmg) { const hurt = []; for (let y = 0; y < B.H; y++) for (let x = 0; x < B.W; x++) if (ter(x, y) === from) { B.map[y][x] = to; const u = unitAt(x, y); if (u) hurt.push(u); } buildTerrain(); return hurt; },
  turn() { return B.turn; },
  banner, say, sleep, centerOn,
};
function freeNear(x, y) {
  for (let r = 1; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= B.W || ny >= B.H) continue; if (!unitAt(nx, ny) && (TER[ter(nx, ny)] || {}).c && TER[ter(nx, ny)].c[0] < X) return [nx, ny]; }
  return [x, y];
}

// --- ターン進行 ---
async function startPhase(side) {
  B.side = side; resetUI(); updHud();
  const label = { p: '自軍', a: '友軍', e: '敵軍' }[side];
  const us = B.units.filter(u => u.side === side && u.hp > 0);
  if (!us.length && side !== 'p') { await turnEvents(side); return; }
  await banner(`第${B.turn}ターン　${label}の番`, 800);
  // 炎と回復
  for (const u of us) {
    u.done = false;
    if (u.buff > 0) u.buff--;
    const f = B.fire[K(u.x, u.y)];
    if (f) { const v = Math.min(u.hp - 1, Math.round(u.mhp * (CLS[u.cls].fireWeak ? 0.35 : 0.14))); if (v > 0) API.hurt(u, v); }
    const h = (TER[ter(u.x, u.y)] || {}).h;
    if (h && u.hp < u.mhp) { const v = Math.round(u.mhp * h / 100); u.hp = Math.min(u.mhp, u.hp + v); fx('txt', u.x, u.y, '+' + v, '#7affaa'); }
    if (u.mmp && u.mp < u.mmp) u.mp = Math.min(u.mmp, u.mp + 1);
  }
  await turnEvents(side);
  if (B.ended) return;
  // 混乱の解除は自分の番の終わりに
}
function endPhase(side) {
  for (const u of B.units) if (u.side === side && u.conf > 0) u.conf--;
  if (side === 'e') { for (const k in B.fire) { B.fire[k]--; if (B.fire[k] <= 0) delete B.fire[k]; } }
}
let playerEndRes = null;
function endPlayerTurn() { if (playerEndRes) { const r = playerEndRes; playerEndRes = null; r(); } }
async function battleLoop() {
  const me = B;
  while (!me.ended) {
    if (winMet()) { checkEnd(); break; }
    await startPhase('p'); if (me.ended || me.finishing) break;
    if (![].concat(B.def.win || { t: 'rout' }).some(w => w.t === 'survive') && B.turn > B.maxTurn) { B.loseMsg = '時間切れ。'; B.flags.lose = true; checkEnd(); break; }
    if (B.units.some(u => u.side === 'p' && u.hp > 0 && u.conf <= 0)) {
      const auto = B.units.filter(u => u.side === 'p' && u.hp > 0 && u.conf > 0); auto.forEach(u => u.done = true);
      if (TEST) await autoPlayer(); else
      await new Promise(r => { playerEndRes = r; updHud(); if (!B.units.some(u => u.side === 'p' && u.hp > 0 && !u.done)) r(); });
    }
    endPhase('p'); if (me.ended || me.finishing) break;
    resetUI(); B.side = 'a'; updHud();
    await startPhase('a'); if (me.ended || me.finishing) break; await aiPhase('a'); endPhase('a'); if (me.ended || me.finishing) break;
    await startPhase('e'); if (me.ended || me.finishing) break; await aiPhase('e'); endPhase('e'); if (me.ended || me.finishing) break;
    B.turn++; updHud();
  }
}
// --- 思考 ---
async function aiPhase(side) {
  const us = B.units.filter(u => u.side === side && u.hp > 0);
  // 近い順に動かす
  for (const u of us) {
    if (B.ended || B.finishing) return;
    if (u.hp <= 0 || u.done) continue;
    if (u.conf > 0) { u.done = true; continue; }
    await aiAct(u); u.done = true;
    if (checkEnd()) return;
  }
}
function aiTargets(u) {
  let f = alive().filter(o => foes(o, u) && !o.hidden);
  if (u.tgt) { const pri = f.filter(o => u.tgt.includes(o.id) || u.tgt.includes(o.tag)); if (pri.length) return { all: f, pri }; }
  return { all: f, pri: null };
}
async function aiAct(u) {
  const mode = u.ai || 'aggr';
  if (mode === 'still' || mode === 'none') {
    if (mode === 'none') return;
    const t = alive().filter(o => foes(o, u) && inRange(u, u.x, u.y, o.x, o.y));
    if (t.length) { t.sort((a, b) => a.hp - b.hp); await doAttack(u, t[0]); }
    return;
  }
  const { all, pri } = aiTargets(u); if (!all.length) return;
  if (mode === 'flee' || mode === 'goto' || mode === 'march') {
    const goal = mode === 'flee' ? edges(u) : [u.goto];
    const D = distMap(u, goal); const r = reach(u);
    let best = K(u.x, u.y), bv = D[best] ?? 999;
    for (const k of r.tiles) { const v = D[k] ?? 999; if (v < bv) { bv = v; best = k; } }
    await aiMove(u, r, best);
    if (mode === 'flee' && bv === 0 && u.fleeOut !== false) { await removeUnit(u); if (u.fleeMsg) await banner(u.fleeMsg, 900); }
    else if (mode === 'goto') { const t = alive().filter(o => foes(o, u) && inRange(u, u.x, u.y, o.x, o.y)); if (t.length) await doAttack(u, t[0]); }
    return;
  }
  const r = reach(u);
  // 守備は射程に入ったときだけ動く
  let cand = [];
  const pool = pri || all;
  for (const k of r.tiles) {
    const [x, y] = k.split(',').map(Number);
    const tdef = (TER[ter(x, y)] || {}).d || 0;
    for (const o of all) {
      if (!inRange(u, x, y, o.x, o.y) || CLS[u.cls].rg[1] === 0) continue;
      const save = [u.x, u.y]; u.x = x; u.y = y; const dm = dmgCalc(u, o, true); u.x = save[0]; u.y = save[1];
      let sc = dm + (dm >= o.hp ? 80 : 0) + tdef * 0.6 + (o.key || o.cls === 'lord' ? 25 : 0) + (pri && pri.includes(o) ? 60 : 0) - dist(u.x, u.y, x, y) * 0.5;
      if (o.side === 'p' && !o.gen && dm >= o.hp) sc += 20;
      cand.push({ k, o, sc, type: 'atk' });
    }
  }
  // 計略
  if (u.mmp) {
    for (const s of unitStrats(u)) {
      const S = STRAT[s]; if (u.mp < S.mp) continue;
      if (S.area) { const t = stratTargets(u, s, u.x, u.y); const lost = t.reduce((a, o) => a + (o.mhp - o.hp), 0); if (lost > 120) cand.push({ k: K(u.x, u.y), sc: lost * 0.5, type: 'st', s, tg: t }); continue; }
      for (const o of stratTargets(u, s, u.x, u.y)) {
        let sc;
        if (S.heal) sc = (o.hp / o.mhp < 0.5 ? (o.mhp - o.hp) * 0.7 : -1) + (o.boss ? 30 : 0);
        else if (S.buff) sc = -1;
        else if (S.conf) sc = o.gen ? 10 : 35;
        else { const dm = stratDmg(u, o, s, true) * stratHit(u, o, s) / 100; sc = dm + (dm >= o.hp ? 70 : 0) + 8; }
        if (sc > 0) cand.push({ k: K(u.x, u.y), o, sc, type: 'st', s, tg: [o] });
      }
    }
  }
  if (mode === 'guard' || mode === 'hold') {
    // 自分が攻撃されるほど近づかれるまでは動かない
    cand = cand.filter(c => c.type === 'st' || dist(u.x, u.y, c.o.x, c.o.y) <= (mode === 'hold' ? CLS[u.cls].rg[1] + 1 : u.mv + 1));
    if (!cand.length) return;
  }
  if (cand.length) {
    cand.sort((a, b) => b.sc - a.sc); const c = cand[0];
    await aiMove(u, r, c.k);
    if (c.type === 'atk') { if (c.o.hp > 0) await doAttack(u, c.o); }
    else await doStrat(u, c.s, c.tg.filter(o => o.hp > 0));
    return;
  }
  // 近づく
  const D = distMap(u, (pool).map(o => [o.x, o.y]));
  let best = K(u.x, u.y), bv = D[best] ?? 999;
  for (const k of r.tiles) { const v = (D[k] ?? 999) - ((TER[ter(...k.split(',').map(Number))] || {}).d || 0) * 0.01; if (v < bv) { bv = v; best = k; } }
  if (u.leash) { const [lx, ly, ld] = u.leash; const [bx, by] = best.split(',').map(Number); if (dist(bx, by, lx, ly) > ld) return; }
  await aiMove(u, r, best);
}
function edges(u) { const e = []; for (let x = 0; x < B.W; x++) { e.push([x, 0]); e.push([x, B.H - 1]); } for (let y = 0; y < B.H; y++) { e.push([0, y]); e.push([B.W - 1, y]); } if (u.fleeTo) return u.fleeTo; return e; }
async function aiMove(u, r, k) {
  if (k === K(u.x, u.y)) return;
  const [x, y] = k.split(',').map(Number);
  if (!onScreen(x, y) && !onScreen(u.x, u.y)) { centerOn(x, y); await sleep(180); } else if (!onScreen(x, y)) { centerOn(x, y); await sleep(150); }
  B.cursor = [u.x, u.y];
  await animMove(u, pathTo(r, u, k)); B.cursor = null;
  await sleep(60);
}

// テスト用：自軍も自動で動かす
async function autoPlayer() {
  const w = [].concat(B.def.win || { t: 'rout' });
  const reachW = w.find(x => x.t === 'reach');
  for (const u of B.units.filter(u => u.side === 'p' && u.hp > 0 && !u.done)) {
    if (B.ended || B.finishing) return;
    if (B.def.noAttack) { u.done = true; continue; }
    const duel = (B.def.duels || []).find((d, i) => !B.used['duel' + i] && d.a.includes(u.id) && API.get(d.d));
    if (reachW && (reachW.who || []).includes(u.id) && (!reachW.need || reachW.need(B))) { const [x0, y0, x1, y1] = reachW.area; u.ai = 'goto'; let best = null; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const o = unitAt(x, y); if ((!o || o === u) && moveCost(u, ter(x, y)) < X) { const d = dist(u.x, u.y, x, y); if (!best || d < best[2]) best = [x, y, d]; } } u.goto = best ? [best[0], best[1]] : [x0, y0]; }
    else if (B.def.events && B.def.events.some((e, i) => e.when === 'reach' && !B.used['ev' + i] && (!e.who || e.who.includes(u.id)))) { const e = B.def.events.find((e, i) => e.when === 'reach' && !B.used['ev' + i] && (!e.who || e.who.includes(u.id))); u.ai = 'goto'; u.goto = [e.area[0], e.area[1]]; }
    else if (duel) { u.ai = 'aggr'; u.tgt = [duel.d]; }
    else { u.ai = ['strat', 'sage', 'lord', 'civ'].includes(u.cls) ? 'hold' : w.some(x => x.t === 'survive') ? 'still' : 'aggr'; u.tgt = null; }
    if (CLS[u.cls].rg[1] === 0 && !(reachW && (reachW.who || []).includes(u.id))) { u.ai = 'none'; }
    const bx = u.x, by = u.y;
    await aiAct(u);
    if (u.hp > 0 && (u.x !== bx || u.y !== by)) await checkReach(u);
    u.done = true; u.ai = null; if (checkEnd()) return;
  }
}
if (TEST) window.KT = { SC, runBattle, B: () => B, SV: () => SV };
// 各シーンの登場武将（武将一覧に使う）
function computeCast() {
  for (const s of SC) {
    const set = new Set(); const txt = [s.text, s.pre, s.post].concat((s.duels || []).map(d => d.text), (s.events || []).map(e => e.text || '')).join('\n');
    for (const l of txt.split('\n')) { const i = l.indexOf('：'); if (i > 0 && i < 12) { const id = NAME2ID[l.trim().slice(0, l.trim().indexOf('：')).replace(/^[12][>＞]/, '')]; if (id) set.add(id); } }
    for (const u of [].concat(s.p || [], s.a || [], s.e || [])) if (CH[u[0]]) set.add(u[0]);
    s.cast = [...set];
  }
}
computeCast();
// 起動
window.addEventListener('load', () => { if (!TEST) titleScreen(); });
document.addEventListener('visibilitychange', () => { if (AU.ctx) { if (document.hidden) AU.ctx.suspend(); else AU.ctx.resume(); } });
