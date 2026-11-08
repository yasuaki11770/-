/* ================= 三國志決戦伝：物語モード（会話シーン → 合戦 → 会話シーン） =================
   ST は src/data.js と src/story1〜4.js（全113シーン）。合戦は三国決戦伝の合戦をそのまま使う。 */
(function addStoryHeroes(){
  const FK={shu:'蜀',wei:'魏',wu:'呉',qun:'群',han:'漢',nan:'南蛮',jin:'晋'};
  const hexi=function(s){if(typeof s==='number')return s;let h=String(s||'#000').slice(1);if(h.length===3)h=h.replace(/./g,function(c){return c+c;});return parseInt(h,16);};
  const HM={crown:'crown',kerchief:'band',helm:'cap',feather:'horns',scholar:'hat',topknot:'none',cap:'hat',bald:'none',turban:'band',woman:'none'};
  const BM={none:0,short:1,mustache:1,goatee:1,long:2,bushy:2};
  const names={};HEROES.forEach(function(h){names[h.n]=1;});
  Object.keys(ST.CH).forEach(function(id){const c=ST.CH[id];if(names[c.n]||byId(id))return;const p=c.p;
    const lk={c:hexi(p.r),t:p.h==='turban'?0xe0c020:0xc9a23c,h:HM[p.h]||'cap',hc:hexi(p.h==='turban'?'#e0c020':p.hc),b:BM[p.b]||0,bc:hexi(p.bc||'#1a1410'),sk:hexi(p.sk)};
    if(p.h==='bald')lk.hair=hexi(p.sk);if(p.h==='woman')lk.hair=hexi(p.hc);if(p.e==='eyepatch')lk.patch=1;if(p.e==='old'&&!lk.b)lk.b=1;
    HEROES.push({id:id,n:c.n,az:'',f:FK[c.f]||'群',s:c.n.charAt(0),w:'剣',p:Math.round(c.b*1.04),hp:Math.round(70+c.t*.45),df:Math.round(45+c.t*.45),cmd:c.t,i:c.i,lk:lk,npc:1,added:1});
    names[c.n]=1;});
  EXTRA_NPC.forEach(function(h){if(!byId(h.id)){h.npc=1;h.added=1;HEROES.push(h);}});
})();
Object.assign(EVENTS,EVENTS2);Object.assign(GOALS,GOALS2);
FACC['晋']='#8a2a3a';
const HN={};HEROES.forEach(function(h){HN[h.n]=h;});
ST.SC.forEach(function(s){if(s.type==='bt')s.wi=WARS.findIndex(function(w){return w.st===s.title;});});

/* ---- 物語の進み具合（この端末に保存） ---- */
const SVK='sangoku-kessenden-story-v1';
let SV=(function(){try{const v=JSON.parse(localStorage.getItem(SVK));if(v&&typeof v.idx==='number')return v;}catch(e){}return {idx:0,seen:{}};})();
function svSave(){try{localStorage.setItem(SVK,JSON.stringify(SV));}catch(e){}}
let STORY_RUN=null;

/* ---- 会話の背景に仕上げ（光のにじみ・かすみ・粒子・周辺減光） ---- */
let GRAIN=null;
const _paintBg=paintBg;
paintBg=function(cv,kind){_paintBg(cv,kind);const g=cv.getContext('2d'),W=cv.width,H=cv.height;
  try{g.save();g.globalAlpha=.4;g.filter='blur('+Math.round(W/90)+'px)';g.globalCompositeOperation='screen';g.drawImage(cv,0,0);g.restore();}catch(e){}
  const dark=['night','dark','blood','altar','fire'].indexOf(kind)>=0;
  if(!dark){const hz=g.createLinearGradient(0,H*.35,0,H*.62);hz.addColorStop(0,'rgba(255,250,235,0)');hz.addColorStop(.6,'rgba(255,248,230,.22)');hz.addColorStop(1,'rgba(255,248,230,0)');g.fillStyle=hz;g.fillRect(0,0,W,H);
    g.save();g.globalCompositeOperation='screen';g.globalAlpha=.12;g.fillStyle='#fff4d8';for(let i=0;i<4;i++){g.beginPath();g.moveTo(W*(.1+i*.12),0);g.lineTo(W*(.3+i*.2),H);g.lineTo(W*(.36+i*.2),H);g.lineTo(W*(.14+i*.12),0);g.fill();}g.restore();}
  if(!GRAIN){GRAIN=document.createElement('canvas');GRAIN.width=GRAIN.height=128;const x=GRAIN.getContext('2d'),d=x.createImageData(128,128);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}x.putImageData(d,0,0);}
  g.save();g.globalCompositeOperation='overlay';g.globalAlpha=.07;g.fillStyle=g.createPattern(GRAIN,'repeat');g.fillRect(0,0,W,H);g.restore();
  const vg=g.createRadialGradient(W/2,H*.45,Math.min(W,H)*.3,W/2,H*.45,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,'+(dark?.6:.38)+')');g.fillStyle=vg;g.fillRect(0,0,W,H);};

/* ---- 会話の再生 ---- */
function storyPortrait(name){const h=HN[name];return h?portrait(h):'';}
function playStory(text,opt){opt=opt||{};
  const lines=parseScript(text);if(!lines.length)return Promise.resolve(0);
  return new Promise(function(done){
    const l=document.createElement('div');l.className='sv';document.getElementById('app').appendChild(l);
    l.innerHTML='<canvas class="sv-sky"></canvas><div class="sv-place"'+(opt.place?'':' hidden')+'>'+esc(opt.place||'')+'</div><button class="btn sm sv-skip" type="button">スキップ ▶▶</button>'+
      '<div class="sv-stage"><img class="sv-l" alt="" hidden><img class="sv-r" alt="" hidden></div>'+
      '<div class="sv-box"><div class="sv-who"></div><div class="sv-said"></div><div class="sv-next">▼</div></div>';
    const sky=l.querySelector('.sv-sky'),box=l.querySelector('.sv-box'),who=l.querySelector('.sv-who'),said=l.querySelector('.sv-said'),nx=l.querySelector('.sv-next');
    const paint=function(k){requestAnimationFrame(function(){paintBg(sky,k);});};paint(opt.bg||'field');
    const slot={l:null,r:null};let last='r';
    const stage=function(name){const im={l:l.querySelector('.sv-l'),r:l.querySelector('.sv-r')};
      if(!name){im.l.classList.add('off');im.r.classList.add('off');return;}
      let k=slot.l===name?'l':slot.r===name?'r':null;
      if(!k){k=last==='l'?'r':'l';slot[k]=name;im[k].src=storyPortrait(name);im[k].hidden=false;im[k].classList.remove('in');void im[k].offsetWidth;im[k].classList.add('in');}
      last=k;im[k].classList.remove('off');im[k==='l'?'r':'l'].classList.add('off');};
    let skip=false,adv=null,choice=opt.choice||0,i=0;
    l.querySelector('.sv-skip').onclick=function(e){e.stopPropagation();skip=true;if(adv){const a=adv;adv=null;a();}};
    l.addEventListener('pointerup',function(e){if(e.target.closest('.sv-skip,.sv-choice'))return;if(adv){const a=adv;adv=null;a();}});
    const wait=function(){return new Promise(function(r){adv=r;});};
    const finish=function(){l.remove();done(choice);};
    const step=async function(){
      for(;i<lines.length;i++){const ln=lines[i];
        if(ln.cond&&ln.cond!==choice)continue;
        if(ln.k==='cmd'){
          if(ln.c==='bg')paint(ln.a);
          else if(ln.c==='se'){try{storySE(ln.a);}catch(_){}}
          else if(ln.c==='bgm'){BGM.play(ln.a==='sad'?'sad':ln.a);}
          else if(ln.c==='title'&&!skip){const c=document.createElement('div');c.className='sv-title';c.innerHTML='<b>'+esc(ln.a)+'</b>';l.appendChild(c);try{SND.gong(.2);}catch(_){}await new Promise(function(r){setTimeout(r,1600);});c.remove();}
          continue;}
        if(ln.k==='q'){box.hidden=true;choice=await new Promise(function(res){const c=document.createElement('div');c.className='sv-choice';
            ln.opts.forEach(function(o,k){const b=document.createElement('button');b.className='btn';b.type='button';b.textContent=o;b.onclick=function(e){e.stopPropagation();c.remove();res(k+1);};c.appendChild(b);});l.appendChild(c);});
          box.hidden=false;skip=false;if(opt.onChoice)opt.onChoice(choice);continue;}
        if(skip)continue;
        const t=ln.t.replace(/／/g,'\n');
        if(ln.k==='n'){box.classList.add('nar');who.textContent='';stage(null);}
        else{box.classList.remove('nar');who.textContent=ln.who;if(HN[ln.who])stage(ln.who);else stage(null);}
        nx.hidden=true;said.textContent='';storyBlip();
        const ch=Array.from(t);let n=0,typing=true;
        await new Promise(function(res){adv=function(){typing=false;};
          const tick=function(){if(!typing||skip){said.textContent=t;res();return;}said.textContent=ch.slice(0,++n).join('');if(n>=ch.length){res();return;}setTimeout(tick,22);};tick();});
        nx.hidden=false;if(!skip)await wait();}
      finish();};
    step();
  });
}
function chapterCard(ch){return new Promise(function(r){const [a,b]=ST.CHAPTERS[ch].split('　');const d=document.createElement('div');d.className='sv sv-ch';d.innerHTML='<div><small>'+a+'</small><b>'+b+'</b></div>';document.getElementById('app').appendChild(d);try{SND.gong(.2);}catch(_){}
  let t=setTimeout(go,2400);function go(){clearTimeout(t);d.remove();r();}d.onclick=go;});}

/* ---- 物語を進める ---- */
async function runStory(i){
  if(MODE==='battle')return;
  closeSheet();
  while(i<ST.SC.length){
    const s=ST.SC[i];SV.idx=i;svSave();
    if(i===0||ST.SC[i-1].ch!==s.ch)await chapterCard(s.ch);
    BGM.play(storySong(s));
    if(s.type==='ev'){await playStory(s.text,{bg:s.bg,place:s.place});SV.seen[i]=1;i++;continue;}
    // 合戦：前の会話 → 三国決戦伝の軍議へ
    await playStory(s.pre,{bg:s.bg||'battle',place:s.place});
    if(s.wi<0){SV.seen[i]=1;i++;continue;}
    STORY_RUN={i:i,wi:s.wi};S.cleared=Math.max(S.cleared,s.wi);save();PREP=null;updBar();
    const how=await askHow(s);if(!how){STORY_RUN=null;return;}
    if(how==='watch')watchWar(s.wi);else prepSheet(s.wi);return;
  }
  SV.idx=ST.SC.length;svSave();ending();
}
async function afterStoryWar(){
  const r=STORY_RUN;STORY_RUN=null;if(!r)return;
  const s=ST.SC[r.i];RUN=null;BT=null;PREP=null;goHome();
  BGM.play('victory');
  await playStory(s.post,{bg:s.postBg||'camp',place:s.place});
  SV.seen[r.i]=1;SV.idx=r.i+1;svSave();runStory(r.i+1);
}
function ending(){const d=document.createElement('div');d.className='sv sv-ch';
  d.innerHTML='<div><small>完</small><b>三國志決戦伝</b><p>滾滾たる長江は東に逝き、<br>浪花は英雄を淘い尽くす。<br>是非成敗、頭を転ずれば空し。</p><p class="muted">名場面録からいつでも見返せる。</p></div>';
  document.getElementById('app').appendChild(d);BGM.play('camp');d.onclick=function(){d.remove();goHome();};}

/* ---- 結果画面：物語の合戦なら「物語を進める」 ---- */
const _finishWar=finishWar;
finishWar=function(win,why){
  const watched=!!(BT&&BT.watch);
  _finishWar(win,why);endWatch();
  if(!STORY_RUN)return;
  const sh=$('.sheet');if(!sh)return;const row=sh.querySelector('#rHome')&&sh.querySelector('#rHome').parentNode;if(!row)return;
  row.innerHTML=win?'<button class="btn pri" id="sNext" type="button" style="flex:1">物語を進める</button>':'<button class="btn pri" id="sAgain" type="button" style="flex:1">再戦する</button><button class="btn" id="sWatch" type="button">鑑賞して進む</button><button class="btn" id="sHome" type="button">本陣へ</button>';
  if(win&&watched){const v=sh.querySelector('.verdict');if(v)v.insertAdjacentHTML('afterend','<p style="text-align:center;margin:0" class="muted">鑑賞：史実どおりの結末</p>');}
  const wt=row.querySelector('#sWatch');if(wt)wt.onclick=function(){const wi=STORY_RUN.wi;closeSheet();RUN=null;BT=null;goHome();watchWar(wi);};
  const n=row.querySelector('#sNext');if(n)n.onclick=function(){closeSheet();afterStoryWar();};
  const a=row.querySelector('#sAgain');if(a)a.onclick=function(){const wi=STORY_RUN.wi;RUN=null;BT=null;goHome();PREP=null;prepSheet(wi);};
  const h=row.querySelector('#sHome');if(h)h.onclick=function(){RUN=null;BT=null;PREP=null;goHome();};
  const x=sh.querySelector('.x');if(x)x.onclick=win?n.onclick:h.onclick;
};
// 物語以外から選んだ戦も開けるように（名場面録の「戦う」）
openStage=function(i){if(i<0||i>=WARS.length)return;prepSheet(i);};
// 物語にいない将（added）は、英雄伝の一騎打ちでは「おまかせ」で戦う
const _startDuel=startDuel;
startDuel=function(me,foe,cb){const a=byId(me.hero),b=byId(foe.hero);if((a&&a.added)||(b&&b.added)){quickDuel(me,foe,cb);return;}_startDuel(me,foe,cb);};

/* ---- 名場面録 ---- */
function storyGallery(){
  let total=0,got=0;let h='<p class="muted" style="margin:0 0 8px">見た場面はもう一度見られる。合戦は「戦う」で何度でも挑める。</p>';
  ST.CHAPTERS.forEach(function(cn,ci){h+='<div class="sec">'+cn+'</div><div class="list">';
    ST.SC.forEach(function(s,i){if(s.ch!==ci)return;const seen=SV.seen[i]||i<SV.idx;total+=s.tags.length;if(seen)got+=s.tags.length;
      const tags=s.tags.filter(function(t){return t!==s.title;}).map(function(t){return '<span class="tag fld">'+esc(t)+'</span>';}).join('');
      h+='<div class="sv-gl'+(seen?'':' lock')+'"><span style="min-width:0;flex:1">'+(s.type==='bt'?'<span class="seal">戦</span>':'')+(seen?esc(s.title)+tags:'？？？')+'</span>'+(seen?'<span class="row" style="flex:none;gap:4px"><button class="btn sm" data-v="'+i+'" type="button">観る</button>'+(s.type==='bt'&&s.wi>=0?'<button class="btn sm" data-w="'+i+'" type="button">鑑賞</button><button class="btn sm red" data-b="'+i+'" type="button">戦う</button>':'')+'</span>':'')+'</div>';});
    h+='</div>';});
  const sh=sheet('名場面録 '+got+'/'+total,h,'full');
  $$('[data-v]',sh).forEach(function(b){b.onclick=async function(){const s=ST.SC[+b.dataset.v];closeSheet();
    BGM.play(storySong(s));if(s.type==='ev')await playStory(s.text,{bg:s.bg,place:s.place});else{await playStory(s.pre,{bg:s.bg||'battle',place:s.place});await playStory(s.post,{bg:s.postBg||'camp',place:s.place});}storyGallery();};});
  $$('[data-w]',sh).forEach(function(b){b.onclick=function(){const s=ST.SC[+b.dataset.w];STORY_RUN=null;closeSheet();watchWar(s.wi);};});
  $$('[data-b]',sh).forEach(function(b){b.onclick=function(){const s=ST.SC[+b.dataset.b];STORY_RUN=null;closeSheet();PREP=null;prepSheet(s.wi);};});
}

/* ---- タイトル ---- */
function storyTitle(){
  $('#cmdbar').hidden=true;$('#topbar').hidden=true;$('#camctl').hidden=true;resize();R3.resize();previewTitle();
  const d=document.createElement('div');d.className='intro';
  const has=!!S&&(SV.idx>0||Object.keys(SV.seen).length>0);
  const cur=ST.SC[Math.min(SV.idx,ST.SC.length-1)];
  let h='<div class="lb2"></div><div class="ttlwrap"><small class="eyeb">桃園の誓い ― 天下統一</small><h1>三國志決戦伝</h1><p>三国志の名場面116を、物語と合戦でたどる。全7章・113場面・34の合戦。会話のあとは軍議で兵を配分し、陣形を組んで布陣、3Dの戦場で武将たちを率いて戦う。因縁の武将がぶつかれば一騎打ち。合戦は「鑑賞する」を選べば、史実どおりに進むのを見て先へ進める。</p></div>';
  h+='<div class="facs" style="display:flex;flex-direction:column;align-items:center;gap:8px">';
  if(has)h+='<button class="facb" type="button" id="stCont" style="min-width:240px;border-color:var(--gold)"><b style="color:var(--gold);font-size:24px">つづきから</b><span>'+esc(ST.CHAPTERS[cur.ch].split('　')[0]+'・'+cur.title)+'</span></button>';
  h+='<button class="facb" type="button" id="stNew" style="min-width:240px'+(has?'':';border-color:var(--gold)')+'"><b style="'+(has?'font-size:20px':'color:var(--gold);font-size:24px')+'">はじめから</b><span>184年、幽州涿郡の桃園から</span></button>';
  if(has)h+='<button class="btn" type="button" id="stGal" style="min-width:240px">名場面録</button>';
  h+='</div><div id="stCf"></div>';
  d.innerHTML=h;UI.appendChild(d);
  const start=function(i){SND.init();if(!S){newState('蜀');save();}d.remove();goHome();runStory(i);};
  const c=d.querySelector('#stCont');if(c)c.onclick=function(){start(SV.idx);};
  const g=d.querySelector('#stGal');if(g)g.onclick=function(){SND.init();d.remove();goHome();storyGallery();};
  d.querySelector('#stNew').onclick=function(){
    if(!has){SV={idx:0,seen:{}};svSave();start(0);return;}
    d.querySelector('#stCf').innerHTML='<p style="color:var(--bad);text-align:center">物語の進み具合と武将の育成を消して、はじめから遊びますか？</p><div class="row" style="justify-content:center"><button class="btn red" id="stY" type="button">はじめから</button><button class="btn" id="stN" type="button">やめる</button></div>';
    d.querySelector('#stY').onclick=function(){try{localStorage.removeItem(SKEY);}catch(e){}S=null;SV={idx:0,seen:{}};svSave();start(0);};
    d.querySelector('#stN').onclick=function(){d.querySelector('#stCf').innerHTML='';};};
}
showIntro=storyTitle;
const _updBar=updBar;updBar=function(){_updBar();const b=$('#cAtk');if(b){b.querySelector('b').textContent='話';b.querySelector('span').textContent='物語';}const l=$('#cList');if(l){l.querySelector('b').textContent='録';l.querySelector('span').textContent='名場面録';}};
$('#cAtk').onclick=function(){if(MODE!=='battle')runStory(Math.min(SV.idx,ST.SC.length));};
$('#cList').onclick=function(){if(MODE!=='battle')storyGallery();};

/* ================= 鑑賞：史実どおりの結果になるよう、自動で戦が進むのを見る ================= */
let WATCH=null;
const _hurtSq=hurtSq;
hurtSq=function(q,dmg,src){
  if(BT&&BT.watch&&dmg>0){
    dmg*=q.side===0?.45:1.7;
    if(q.side===0&&q.gen){const floor=q.n0*q.hpPer*.35;dmg=Math.min(dmg,Math.max(0,q.hp-floor));}
  }
  _hurtSq(q,dmg,src);
  if(BT&&BT.watch&&q.side===0&&q.gen){q.morale=Math.max(q.morale,30);q.routed=false;if(q.hp>0)q.alive=true;}
};
const _duelPlan=duelPlan;
duelPlan=function(a,b,sa,sb){let p=_duelPlan(a,b,sa,sb);
  if(BT&&BT.watch){const mine=BT.sq.some(function(q){return q.side===0&&q.hs===a;});const want=mine?0:1;for(let k=0;k<30&&p.w!==want;k++)p=_duelPlan(a,b,sa,sb);}
  return p;};
function bestGun(wi){const c=counterOf(FOE_GUN[wi])||[];return c.find(function(k){return GUNORDER.indexOf(k)>=0;})||'rinki';}
function watchWar(wi){
  PREP=null;prepSheet(wi);PREP.gun=bestGun(wi);closeSheet();councilFull(false);
  WATCH={dm:S.duelMode};S.duelMode='quick';
  startWar(wi);BT.watch=true;$('#hGo').onclick();
  BT.tap=function(X,Y){const q=unitAt(X,Y);if(q)focusUnit(q);};
  UI.classList.add('watching');CAMD.auto=true;
  const sp=UI.querySelector('.hud .sp');
  if(sp){const pill=document.createElement('span');pill.className='hpill';pill.innerHTML='<b>鑑賞中</b>';sp.insertBefore(pill,sp.firstChild);
    const sk=document.createElement('button');sk.className='btn sm red';sk.type='button';sk.textContent='最後まで飛ばす';sk.onclick=function(){if(!BT||BT.over)return;
      if(BT.cond==='survive')BT.time=BT.limit;else{const fg=BT.sq.find(function(q){return q.side===1&&q.gen;});const mg=BT.sq.find(function(q){return q.side===0&&q.gen;});if(fg)_hurtSq(fg,fg.hp+1,mg);}};
    sp.appendChild(sk);}
  const chk=BT.check;BT.check=function(){
    if(BT.watch&&!BT.over&&BT.time>=BT.limit-.5&&BT.cond!=='survive'){const fg=BT.sq.find(function(q){return q.side===1&&q.gen;});const mg=BT.sq.find(function(q){return q.side===0&&q.gen;});if(fg&&fg.alive)_hurtSq(fg,fg.hp+1,mg);}
    chk();};
  setTimeout(function(){toast('鑑賞中。カメラは自動で名場面を追う。「速度」で早送りできる');},4500);
}
function endWatch(){UI.classList.remove('watching');if(WATCH){S.duelMode=WATCH.dm;WATCH=null;save();}}
const _goHome=goHome;goHome=function(){endWatch();_goHome();};

/* 合戦の前に「戦う」か「鑑賞する」かを選ぶ */
function askHow(s){return new Promise(function(res){const w=WARS[s.wi];
  let h='<div class="sq"><div class="hd"><b>'+esc(w.n)+'</b><span class="muted" style="font-size:12px">'+w.p+' ・ '+w.y+'年 ・ '+TER_NAME[w.ter]+'</span></div><p style="margin:0;font-size:13px" class="muted">'+esc(w.d)+'</p></div>';
  h+='<div class="list" style="margin-top:10px"><button class="btn pri" id="hwFight" type="button" style="min-height:58px;font-size:18px">戦う<small style="display:block;font-size:12px;font-weight:400">軍議で兵を配分し、自分で布陣して指揮する</small></button>';
  h+='<button class="btn" id="hwWatch" type="button" style="min-height:58px;font-size:18px">鑑賞する<small style="display:block;font-size:12px;font-weight:400;color:var(--mute)">史実どおりに戦が進むのを見て、物語の続きへ</small></button></div>';
  const sh=sheet('合戦',h,'glass');
  sh.querySelector('#hwFight').onclick=function(){closeSheet();res('fight');};
  sh.querySelector('#hwWatch').onclick=function(){closeSheet();res('watch');};
  sh.querySelector('.x').onclick=function(){closeSheet();res(null);};});}
