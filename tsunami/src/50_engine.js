/* =========================================================
   エンジン（「その瞬間、あなたは」のエンジンを津波編用に拡張）
   ・時計：地震発生からの経過時間
   ・長い揺れ、緊迫モード・夜モード
   ・ふりがな（自動＋{漢字|よみ}）、文字の大きさ
   ・聞き取れない言葉：[[表示|本当の言葉|標準語訳]]、⟪伏せ字⟫
   ・物語どうしの記録（交差）
   ========================================================= */
let C=null, S=null;
const LS=(k,v)=>{ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } };
let REC={}; try{ REC=JSON.parse(LS('tsu_rec')||'{}')||{}; }catch(e){}
let XREC={}; try{ XREC=JSON.parse(LS('tsu_x')||'{}')||{}; }catch(e){}
let SET={fz:1,furi:true}; try{ Object.assign(SET,JSON.parse(LS('tsu_set')||'{}')||{}); }catch(e){}
const saveRec=()=>LS('tsu_rec',JSON.stringify(REC));
const saveX=()=>LS('tsu_x',JSON.stringify(XREC));
const saveSet=()=>LS('tsu_set',JSON.stringify(SET));
/** 他の物語の記録を読む：X('fire','school') */
const X=(story,key)=>XREC[story]?XREC[story][key]:undefined;
const hm=m=>{ m=((m%1440)+1440)%1440; return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); };
const el=m=>{ m=Math.max(0,Math.round(m)); return m<60?m+'分':Math.floor(m/60)+'時間'+(m%60?(m%60)+'分':''); };
const toMin=s=>{ const [h,m]=s.split(':').map(Number); return h*60+m; };
const shuffle=a=>{ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function show(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id)); window.scrollTo(0,0); }
const FXK=['red','smoke','dust','dim','night','dusk','siren','black'];

/* ---------- 文字の整形（ふりがな・聞き取れない言葉） ---------- */
let RUBY_KEYS=null;
function rubyKeys(){ if(!RUBY_KEYS) RUBY_KEYS=Object.keys(RUBY).sort((a,b)=>b.length-a.length); return RUBY_KEYS; }
const rb=(k,y)=>`<ruby>${esc(k)}<rt>${esc(y)}</rt></ruby>`;
const KANJI=/[一-鿿々]/;
/** 平文を、ふりがな付きのトークン列にする */
function plainTokens(s,out){
  const keys=rubyKeys(); let i=0;
  while(i<s.length){
    const ch=s[i];
    if(KANJI.test(ch)){
      let hit=null; for(const k of keys){ if(s.startsWith(k,i)){ hit=k; break; } }
      if(hit){ const mm=hit.match(/^([\u4e00-\u9fff々]+)([^\u4e00-\u9fff々]+)$/); out.push(mm?rb(mm[1],RUBY[hit])+esc(mm[2]):rb(hit,RUBY[hit])); i+=hit.length; continue; }
      if(window.__miss) window.__miss.add(ch);
    }
    out.push(esc(ch)); i++;
  }
}
/** 整形してトークン列（1トークン＝文字送りの1単位）を返す。heardに聞き取れなかった言葉を集める */
function tokens(src,heard){
  const out=[]; const re=/\{([^|{}]+)\|([^{}]+)\}|\[\[([^|\]]*)\|([^|\]]*)(?:\|([^\]]*))?\]\]|⟪([^⟫]*)⟫|《([^》]*)》/g;
  let last=0,m;
  while((m=re.exec(src))){
    plainTokens(src.slice(last,m.index),out);
    if(m[1]!==undefined) out.push(rb(m[1],m[2]));
    else if(m[3]!==undefined){ out.push(`<span class="gb">${esc(m[3])}</span>`); if(heard) heard.push({s:m[3],r:m[4],t:m[5]||''}); }
    else if(m[6]!==undefined){ out.push(`<span class="hid">${'〇'.repeat([...m[6]].length)}</span>`); if(heard) heard.push({s:'〇'.repeat([...m[6]].length),r:m[6],t:''}); }
    else if(m[7]!==undefined){ const t=[]; plainTokens(m[7],t); out.push(`<span class="echo">${t.join('')}</span>`); }
    last=re.lastIndex;
  }
  plainTokens(src.slice(last),out);
  return out;
}
const fmt=s=>tokens(String(s)).join('');

/* ---------- 描画 ---------- */
function sceneSvg(view,cast,thumb){
  const sc=SCENES[view.scene]||SCENES.yard;
  let s=sc.bg;
  if(sc.dyn) s+=sc.dyn(view);
  const split=sc.split||0; let back='',front='';
  for(const [id,a] of Object.entries(view.actors)){
    const c=cast[id]; if(!c||!c.look||!a.show) continue;
    const L=LOOK[c.look]; if(!L) continue;
    const g=`<g class="actor ${a.p==='stand'||!a.p?'idle':''}" ${thumb?'':`id="ac_${id}"`} data-p="${a.p||'stand'}" data-f="${a.f||'normal'}" data-t="${a.t||''}" data-arm="${a.arm||''}" style="transform:translate(${a.x}px,${a.y||215}px) scale(${a.sc||c.sc||1});transition:transform .9s ease">${fig(L)}${a.e?emoteSvg(a.e,-(DIM[L.k].leg+DIM[L.k].body)-DIM[L.k].head*2-4):''}</g>`;
    if(split && (a.y||215)>=split) front+=g; else back+=g;
  }
  s+=back;
  if(sc.fg) s+=sc.fg;
  if(sc.fgdyn) s+=sc.fgdyn(view);
  s+=front;
  return s;
}
function render(){
  $('sc').innerHTML=sceneSvg(S.view,C.cast);
  FXK.forEach(k=>$('fx'+k[0].toUpperCase()+k.slice(1)).classList.toggle('on',!!S.view.fx[k]));
}
function updActor(id,ch){
  const a=S.view.actors[id]||(S.view.actors[id]={x:200,show:false});
  Object.assign(a,ch);
  const elx=document.getElementById('ac_'+id);
  if(!elx || ch.show!==undefined || ch.e!==undefined){ render(); if(ch.e) setTimeout(()=>{ if(S&&S.view.actors[id]&&S.view.actors[id].e===ch.e){ S.view.actors[id].e=null; const g=document.querySelector('#ac_'+id+' .emote'); if(g) g.remove(); } },1800); return; }
  if(ch.p!==undefined){ elx.dataset.p=ch.p; elx.classList.toggle('idle',ch.p==='stand'); }
  if(ch.f!==undefined) elx.dataset.f=ch.f;
  if(ch.t!==undefined) elx.dataset.t=ch.t;
  if(ch.arm!==undefined) elx.dataset.arm=ch.arm;
  if(ch.x!==undefined||ch.y!==undefined||ch.sc!==undefined) elx.style.transform=`translate(${a.x}px,${a.y||215}px) scale(${a.sc||C.cast[id].sc||1})`;
}
function setClock(){
  const c=$('clock');
  if(S.q0!=null){ $('hm').textContent=el(S.clock-S.q0); $('day').textContent=(S.day?S.day+'・':'')+'地震発生から'; c.classList.add('el'); }
  else { $('hm').textContent=hm(S.clock); $('day').textContent=S.day||''; c.classList.remove('el'); }
  c.classList.remove('tick'); void c.offsetWidth; c.classList.add('tick');
}
const elapsed=()=>S.q0==null?0:S.clock-S.q0;
function stageFx(k){ const st=$('stage'); st.classList.remove('shake','quake'); void st.offsetWidth; st.classList.add(k); setTimeout(()=>st.classList.remove(k),k==='quake'?1900:500); }
let rumbleT=null;
function bigQuake(on){
  const st=$('stage'); st.classList.toggle('bigquake',on); clearInterval(rumbleT);
  if(on){ sfx('quake'); rumbleT=setInterval(()=>sfx('rumble'),650); if(navigator.vibrate) try{navigator.vibrate([400,100,300,100,500])}catch(e){} }
}
function setMode(m){ const p=$('play'); p.classList.remove('m-tense','m-night'); if(m) p.classList.add('m-'+m); S.mode=m||''; }

/* ---------- 行の処理 ---------- */
let queue=[], onDone=null, typing=null, waiting=false;
function play(lines,cb){ queue=lines.filter(x=>x!==''&&x!=null&&x!==false); onDone=cb; step(); }
function step(){
  while(queue.length){
    const it=queue.shift();
    if(typeof it==='string'){ say(it); return; }
    if(it.sys){ say('@sys|'+it.sys); return; }
    if(it.radio){ sfx('chime'); say('@radio|'+it.radio); return; }
    doAction(it);
    if(it.wait){ waiting=true; setTimeout(()=>{ waiting=false; step(); },window.__fast?0:it.wait); return; }
  }
  const f=onDone; onDone=null; f&&f();
}
function doAction(it){
  if(it.a){ const ch={...it}; delete ch.a; delete ch.wait; updActor(it.a,ch); return; }
  if(it.d!==undefined){ S.day=it.d; setClock(); }
  if(it.t){ S.clock=toMin(it.t); setClock(); }
  if(it.q0){ S.q0=S.clock; setClock(); }
  if(it.at!==undefined){ S.clock=(S.q0||0)+it.at; setClock(); }
  if(it.adv){ S.clock+=it.adv; setClock(); }
  if(it.bg){ S.view.scene=it.bg; render(); }
  if(it.v){ Object.assign(S.view,it.v); render(); }
  if(it.mode!==undefined) setMode(it.mode);
  if(it.set){ Object.assign(S.flags,it.set); }
  if(it.fx){
    const k=it.fx;
    if(k==='shake'||k==='quake'){ stageFx(k); if(k==='quake') sfx('quake'); }
    else if(k==='bigquake') bigQuake(true);
    else if(k==='noquake') bigQuake(false);
    else if(k==='flash'){ const f=$('fxFlash'); f.classList.add('on'); setTimeout(()=>f.classList.remove('on'),180); }
    else if(k==='calm'){ FXK.forEach(x=>S.view.fx[x]=false); bigQuake(false); render(); }
    else if(k.startsWith('no')){ S.view.fx[k.slice(2)]=false; render(); }
    else { S.view.fx[k]=true; render(); if(k==='siren') sfx('siren'); }
  }
  if(it.se) sfx(it.se);
  if(it.bgm!==undefined) music(it.bgm);
}
let typedFull='';
function say(line){
  let who=null, txt=line;
  const m=line.match(/^(@?\w+)\|(.*)$/s); if(m){ who=m[1]; txt=m[2]; }
  const nm=$('name'), tx=$('txt');
  nm.className='name'; tx.className='txt';
  if(who==='@sys'){ nm.textContent='おしらせ'; nm.classList.add('sys'); nm.style.display='block'; tx.classList.add('sys'); }
  else if(who==='@radio'){ nm.textContent='防災行政無線'; nm.classList.add('radio'); nm.style.display='block'; tx.classList.add('radio'); sfx('crackle'); }
  else if(who==='@me'){ nm.textContent=(C.me||'')+'（心の声）'; nm.classList.add('me'); nm.style.display='block'; tx.classList.add('narr'); }
  else if(who){ const c=C.cast[who]; nm.textContent=(c&&c.name)||who; if(c&&!c.look) nm.classList.add('voice'); if(c&&c.me) nm.classList.add('me'); nm.style.display='block'; sfx('blip'); }
  else { nm.style.display='none'; tx.classList.add('narr'); }
  $('nextI').style.visibility='hidden';
  const tk=tokens(txt,S.heard); typedFull=tk.join('');
  let i=0; clearInterval(typing); tx.innerHTML='';
  typing=setInterval(()=>{ i+=2; tx.innerHTML=tk.slice(0,i).join(''); if(i>=tk.length){ clearInterval(typing); typing=null; $('nextI').style.visibility='visible'; } },30);
  if(window.__fast){ clearInterval(typing); typing=null; tx.innerHTML=typedFull; }
}
function tapBox(){
  if($('sheet').classList.contains('on')||waiting) return;
  if(typing){ clearInterval(typing); typing=null; $('txt').innerHTML=typedFull; $('nextI').style.visibility='visible'; return; }
  if(onDone||queue.length) step();
}
$('box').addEventListener('click',tapBox);
$('stage').addEventListener('click',e=>{ if(e.target.closest('.topbtns')) return; tapBox(); });

/* ---------- 物語の開始・ノード ---------- */
function computeMax(c){
  const memo={};
  const dfs=id=>{ if(!id||id==='END') return 0; if(memo[id]!==undefined) return memo[id]; memo[id]=0; const n=c.nodes[id];
    let v; if(n.mini) v=2+dfs(n.next); else if(!n.choices) v=n.go?(typeof n.go==='string'?dfs(n.go):Math.max(0,...(n.goAll||[]).map(dfs))):(n.next?dfs(n.next):0); else v=Math.max(...n.choices.filter(x=>x.g!=='fatal').map(x=>(x.sc||0)+dfs(x.next)));
    return memo[id]=v; };
  return Math.max(1,dfs(c.start));
}
function gradeOf(sc,max){ const r=sc/max; return r>=.85?'S':r>=.6?'A':r>=.3?'B':'C'; }
function startCase(i){
  C=STORIES[i]; C.max=C.max||computeMax(C);
  const actors={}; for(const [id,c] of Object.entries(C.cast)) if(c.look) actors[id]={x:c.x||200,y:c.y,p:c.p||'stand',f:c.f||'normal',show:c.show!==false};
  S={flags:{},x:{},heard:[],score:0,clock:0,q0:null,day:'',mode:'',log:[],node:null,snap:null,view:{scene:C.scene,actors,fx:{}}};
  $('hudNo').textContent=C.who; $('hudTitle').textContent=C.title;
  $('hm').textContent='--:--'; $('day').textContent=''; $('clock').classList.remove('el'); $('txt').textContent=''; $('name').style.display='none';
  setMode(''); bigQuake(false);
  closeSheet(); show('play'); render(); sfx('start'); music(C.bgm||'town');
  enterNode(C.start);
}
function enterNode(id){
  if(id==='END') return ending();
  const n=C.nodes[id]; S.node=id;
  if(n.mini==='cpr') return runCPR(()=>enterNode(n.next));
  const lines=typeof n.lines==='function'?n.lines(S):n.lines;
  play(lines||[],()=>{
    if(n.fatal) return fail('fatal',typeof n.fatal==='function'?n.fatal(S):n.fatal);
    if(n.go) return enterNode(typeof n.go==='function'?n.go(S):n.go);
    if(!n.choices) return ending();
    S.snap=JSON.stringify({...S,snap:null});
    openChoices(n);
  });
}
let tmr=null;
function openChoices(n){
  $('cpr').style.display='none'; $('choices').style.display='flex';
  const obs=typeof n.obs==='function'?n.obs(S):(n.obs||[]);
  $('chips').innerHTML=obs.map(([a,b])=>`<span class="chip"><b>${fmt(a)}</b>${fmt(b)}</span>`).join('');
  $('q').innerHTML=fmt(n.q||'どうする？');
  const box=$('choices'); box.innerHTML='';
  const list=n.choices.filter(c=>!c.need||c.need(S));
  (n.fixed?list:shuffle(list)).forEach(c=>{ const b=document.createElement('button'); b.className='btn'; b.innerHTML=fmt(c.t); b.onclick=()=>choose(n,c); box.appendChild(b); });
  $('sheet').classList.add('on'); $('sheet').scrollTop=0; sfx('msg');
  clearInterval(tmr); $('timer').classList.remove('on');
}
function closeSheet(){ $('sheet').classList.remove('on'); clearInterval(tmr); }
function choose(n,c,timedOut){
  closeSheet(); sfx(timedOut?'back':'ok');
  const best=n.choices.find(x=>x.g==='best'&&(!x.need||x.need(S)));
  S.log.push({q:n.q||'どうする？',you:c.t,g:c.g,why:c.why||'',best:best&&best!==c?best.t:null,bestWhy:best&&best!==c?best.why:null});
  S.score+=(c.sc||0); if(c.flag) S.flags[c.flag]=true; if(c.x) Object.assign(S.x,c.x);
  if(c.dt){ S.clock+=c.dt; setClock(); }
  const res=typeof c.res==='function'?c.res(S):(c.res||[]);
  play(res,()=>{
    if(c.g==='fatal') return fail('fatal',c);
    enterNode(typeof c.next==='function'?c.next(S):c.next);
  });
}
function commitX(){ XREC[C.id]=Object.assign(XREC[C.id]||{},S.x,{done:1}); saveX(); }
function retry(){
  const st=JSON.parse(S.snap); const snap=S.snap; S=Object.assign(st,{snap});
  show('play'); setMode(S.mode); bigQuake(false); render(); setClock(); music(C.bgm2||'tense');
  $('txt').textContent=''; $('name').style.display='none';
  openChoices(C.nodes[S.node]);
}
function lessonHtml(list){
  return (list||[]).map(l=>`<div class="lesson"><h4>${fmt(l.h)}</h4>${l.p?`<div>${fmt(l.p)}</div>`:''}${l.ul?`<ul>${l.ul.map(x=>`<li>${fmt(x)}</li>`).join('')}</ul>`:''}${l.src?`<div class="src">${esc(l.src)}</div>`:''}</div>`).join('');
}
function ending(){
  const o=C.outcome(S);
  music(o.mood==='good'?'hope':o.mood==='mid'?'talk':'night');
  play(o.lines||[],()=>{
    bigQuake(false);
    const g=gradeOf(S.score,C.max);
    const order='SABC'; if(!REC[C.id]||REC[C.id]==='X'||order.indexOf(g)<order.indexOf(REC[C.id])){ REC[C.id]=g; saveRec(); }
    S.x.alive=o.dead?0:1; commitX();
    $('outCase').textContent=`${C.who}　${C.title}`;
    $('outGrade').className='grade '+g; $('outGrade').textContent=g; $('outGradeLbl').textContent=o.dead?'生き延びることはできなかった':'生き延びた';
    $('outTitle').innerHTML=fmt(o.title); $('outText').innerHTML=fmt(o.sum||'');
    $('outLesson').innerHTML=lessonHtml((o.lessons||[]).concat(C.lessons||[]));
    $('retryNode').style.display='none'; sfx(o.mood==='good'?'jingle':'lvl');
    setTimeout(()=>show('out'),400);
  });
}
function fail(kind,c){
  music(null); sfx('drop'); bigQuake(false);
  if(!REC[C.id]){ REC[C.id]='X'; saveRec(); }
  S.x.alive=0; commitX();
  setTimeout(()=>{
    $('outCase').textContent=`${C.who}　${C.title}`;
    $('outGrade').className='grade X'; $('outGrade').textContent='終';
    $('outGradeLbl').textContent='この判断で、物語は終わる';
    $('outTitle').innerHTML=fmt(c.title||'取り返しのつかない判断'); $('outText').innerHTML=fmt(c.why||'');
    $('outLesson').innerHTML=lessonHtml((c.lessons||[]).concat(C.lessons||[]));
    $('retryNode').style.display='block'; show('out');
  },600);
}
$('retryNode').onclick=retry;
$('outMenu').onclick=()=>{ renderMenu(); music('title'); show('menu'); };
$('debMenu').onclick=$('outMenu').onclick;
$('quit').onclick=e=>{ e.stopPropagation(); queue=[]; onDone=null; clearInterval(typing); closeSheet(); bigQuake(false); renderMenu(); music('title'); show('menu'); };
$('toDeb').onclick=()=>{ renderDebrief(); show('deb'); };
$('debRetry').onclick=()=>startCase(STORIES.indexOf(C));
$('snd').onclick=e=>{ e.stopPropagation(); setSound(!SOUND); };
function renderDebrief(){
  $('debCase').textContent=`${C.who}　${C.title}`;
  const mk={best:'◎',ok:'○',bad:'×',fatal:'✕'};
  $('debLog').innerHTML=S.log.map(l=>`<div class="rv"><div class="h"><span class="mk ${l.g}">${mk[l.g]}</span><span>${fmt(l.q)}</span></div><div class="you">あなた：${fmt(l.you)}</div><div style="margin-top:6px">${fmt(l.why)}</div>${l.best?`<div class="bt"><b>より良い判断：</b>${fmt(l.best)}<br>${fmt(l.bestWhy||'')}</div>`:''}</div>`).join('')||'<div class="rv">（まだ判断していません）</div>';
  let h=C.debrief.map(s=>`<div class="sec"><h3>${fmt(s.h)}</h3>${s.p?`<p>${fmt(s.p)}</p>`:''}${s.ul?`<ul>${s.ul.map(x=>`<li>${fmt(x)}</li>`).join('')}</ul>`:''}</div>`).join('');
  const seen=new Set(), heard=S.heard.filter(x=>{ const k=x.s+'|'+x.r; if(seen.has(k)) return false; seen.add(k); return true; });
  if(heard.length) h+=`<div class="sec"><h3>聞き取れなかった言葉</h3><div class="heard">${heard.map(x=>`<div><div class="s">聞こえた言葉：${esc(x.s)}</div><div><b>本当は：</b>${fmt(x.r)}</div>${x.t?`<div class="s">意味：${fmt(x.t)}</div>`:''}</div>`).join('')}</div></div>`;
  if(C.talk) h+=`<div class="sec"><h3>話し合ってみよう</h3><ul>${C.talk.map(x=>`<li>${fmt(x)}</li>`).join('')}</ul></div>`;
  $('debSecs').innerHTML=h;
  $('debDeepBody').innerHTML=C.deep||''; $('debDeep').open=false; $('debDeep').style.display=C.deep?'block':'none';
  $('debDisc').innerHTML=fmt(DISC_DEB);
}

/* ---------- 一覧 ---------- */
function renderMenu(){
  $('menuLead').innerHTML=fmt('自分と近い年れいの人や、住んでいる場所に近い物語から始めてみてください。★が多いほど、津波までの時間が短く、判断がむずかしい物語です。');
  $('menuDisc').innerHTML=fmt(DISC_MENU);
  let h='';
  for(const ar of AREAS){
    h+=`<div class="stagehead"><h3>${fmt(ar.name)}</h3><span>${fmt(ar.sub)}</span></div><div class="cases">`;
    STORIES.forEach((c,i)=>{ if(c.area!==ar.id) return;
      const r=REC[c.id];
      const actors={};
      for(const [id,a] of Object.entries(c.cast)){ if(!a.look||a.thumb===false) continue; if(a.show===false&&!a.thumb) continue; actors[id]={x:a.tx||a.x||200,y:a.ty||a.y,p:a.tp||a.p||'stand',f:a.tf||'normal',show:true}; }
      const svg=sceneSvg({scene:c.scene,actors,fx:{}},c.cast,true);
      const xs=(c.xs||[]).length;
      h+=`<button class="case" data-i="${i}" ${c.ready?'':'disabled'}><svg class="thumb" viewBox="0 30 400 200" preserveAspectRatio="xMidYMid slice">${svg}</svg><div class="body">${r?`<span class="badge ${r}">${r==='X'?'挑戦中':r}</span>`:''}<div class="no">${esc(c.who)}</div><h3>${fmt(c.title)}</h3><div class="stars">${'★'.repeat(c.stars)}${'☆'.repeat(5-c.stars)}</div><p>${fmt(c.blurb)}</p><div class="tags"><span class="tag">${fmt(c.place)}</span>${xs?`<span class="tag x">交わる物語 ${xs}</span>`:''}${c.ready?'':'<span class="tag wip">準備中</span>'}</div></div></button>`;
    });
    h+='</div>';
  }
  $('stories').innerHTML=h;
  document.querySelectorAll('#stories .case').forEach(b=>{ if(!b.disabled) b.onclick=()=>startCase(+b.dataset.i); });
}

/* ---------- 設定・タイトル ---------- */
function applySet(){
  document.documentElement.style.setProperty('--fz',SET.fz);
  document.body.classList.toggle('nofuri',!SET.furi);
}
function renderSettings(){
  const seg=(key,opts)=>`<div class="seg">${opts.map(([v,l])=>`<button data-k="${key}" data-v="${v}" class="${String(SET[key])===String(v)?'on':''}">${l}</button>`).join('')}</div>`;
  $('settings').innerHTML=`<div class="set-row"><span class="lbl">文字の大きさ</span>${seg('fz',[[0.9,'小'],[1,'中'],[1.18,'大']])}</div>
  <div class="set-row"><span class="lbl">ふりがな</span>${seg('furi',[[true,'あり'],[false,'なし']])}</div>
  <div class="set-row"><span class="lbl">音</span><div class="seg"><button id="sndA" class="${SOUND?'on':''}">あり</button><button id="sndB" class="${SOUND?'':'on'}">なし</button></div></div>`;
  $('settings').querySelectorAll('button[data-k]').forEach(b=>b.onclick=()=>{ const k=b.dataset.k; SET[k]=k==='fz'?+b.dataset.v:b.dataset.v==='true'; saveSet(); applySet(); renderSettings(); });
  $('sndA').onclick=()=>{ setSound(true); renderSettings(); }; $('sndB').onclick=()=>{ setSound(false); renderSettings(); };
}
function renderSources(){
  $('srcBody').innerHTML=SOURCES.map(g=>`<div class="sec"><h3>${fmt(g.h)}</h3><ul>${g.items.map(([t,u])=>`<li>${fmt(t)}${u?`<br><a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a>`:''}</li>`).join('')}</ul></div>`).join('')+`<div class="note">${fmt(SRC_NOTE)}</div>`;
}
$('toMenu').onclick=()=>{ audioInit(); renderMenu(); music('title'); show('menu'); };
$('menuBack').onclick=()=>{ renderSettings(); show('title'); };
$('toSrc').onclick=()=>{ renderSources(); show('src'); };
$('srcBack').onclick=()=>show('title');
$('toMsg').onclick=()=>{ $('msgBody').innerHTML=fmt(AUTHOR_MSG); show('msg'); };
$('msgBack').onclick=()=>show('title');
