/* ===== 覇王の采配：三国覇王伝の武将で、逆転の采配の合戦だけを連戦する =====
 武将を一人選ぶと、兵は統率に応じて自動で与えられる。副将は同じ勢力から自動で付く。
 合戦は逆転の采配の rb.js（兵の動き・士気・挟撃・潰走・3D表示）をそのまま使い、部隊は自分で動かす。 */
const $=s=>document.querySelector(s);
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const fmtN=n=>Math.round(n).toLocaleString('ja-JP');
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function mrand(seed){let s=seed;return()=>(s=(s*16807)%2147483647)/2147483647;}
function inPoly(x,y,pts){let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
let _fd,_fb;const FD=()=>_fd||(_fd=getComputedStyle(document.body).getPropertyValue('--f-disp'));const FB=()=>_fb||(_fb=getComputedStyle(document.body).getPropertyValue('--f-body'));
const store={get(k){try{return JSON.parse(localStorage.getItem('haou-saihai:'+k));}catch(e){return null;}},set(k,v){try{localStorage.setItem('haou-saihai:'+k,JSON.stringify(v));}catch(e){}}};
const HB=id=>byId(id);
const FACE={};const face=id=>FACE[id]||(FACE[id]=(typeof portrait2==='function'?portrait2(HB(id)):portrait(HB(id))));
const E={gaugeOff(){}};
const S={meMon:'me',foeMon:'foe'};
const MONS={};
const G={};

/* ---- 勢力の色（兵の服・旗） ---- */
const FC={
 '魏':{c:'#24407e',t:'#c8d2e6',hat:'dome',hc:'#5a6478',sh:'rect'},
 '蜀':{c:'#24693f',t:'#e6c460',hat:'cone',hc:'#2a4a2a',sh:'round'},
 '呉':{c:'#a52c22',t:'#f2d272',hat:'cone',hc:'#6a1a14',sh:'round'},
 '群':{c:'#5a4422',t:'#e2c27e',hat:'dome',hc:'#3a2a18',sh:'rect'},
 '南蛮':{c:'#7a4416',t:'#f0b060',hat:'cone',hc:'#4a2a10',sh:'oval'},
 '烏桓':{c:'#5e5440',t:'#dccaa0',hat:'dome',hc:'#3a3428',sh:'round'},
 '漢':{c:'#8a2018',t:'#e8c450',hat:'dome',hc:'#5a1a10',sh:'rect'}};
const fcOf=f=>FC[f]||FC['群'];
const FORD=['魏','蜀','呉','群','南蛮','烏桓','漢'];
const TYN={gen:'本隊',yari:'槍兵',yumi:'弓兵',kiba:'騎兵'};
const power=h=>h.p+h.cmd+h.i*.6;
const ALL=()=>HEROES.slice();
const STAGES=10;

/* ---- 戦場 ---- */
const FIELDS=[
 {k:'plain',n:'平原',mood:'day',base:'#a8a46a',baseTop:'#9a9a62',zones:[{k:'road',pts:[[46,0],[54,0],[54,150],[46,150]]}],trees:[[8,40,7,12],[92,108,7,12]],d:'見通しのよい平原。正面からぶつかる'},
 {k:'forest',n:'森の街道',mood:'haze',base:'#9a9a62',baseTop:'#8e9058',zones:[{k:'forest',pts:[[0,44],[26,40],[30,106],[0,110]],label:'森'},{k:'forest',pts:[[100,44],[74,40],[70,106],[100,110]],label:'森'},{k:'road',pts:[[44,0],[56,0],[56,150],[44,150]]}],d:'両脇は森。森の中は動きが遅いが守りに強い'},
 {k:'river',n:'渡河',mood:'dawn',base:'#9c9e66',baseTop:'#92945e',zones:[{k:'river',pts:[[0,68],[100,64],[100,80],[0,84]],label:'川',lx:50,ly:70},{k:'bridge',pts:[[18,62],[30,62],[30,86],[18,86]]},{k:'bridge',pts:[[70,60],[82,60],[82,84],[70,84]]}],d:'川を挟んで向き合う。浅瀬（橋）以外は足が止まる'},
 {k:'hill',n:'丘の陣',mood:'dusk',base:'#a29a64',baseTop:'#988f5c',zones:[{k:'hill',pts:[[26,10],[74,10],[80,46],[20,46]],label:'丘'},{k:'hill',pts:[[0,96],[18,92],[22,124],[0,128]]}],trees:[[90,70,8,14]],d:'敵は丘の上。丘の上は守りに強い'},
 {k:'rain',n:'雨の野',mood:'rain',base:'#8e9460',baseTop:'#84895a',zones:[{k:'marsh',pts:[[30,62],[70,60],[74,90],[26,92]],label:'ぬかるみ'}],trees:[[10,20,8,14],[90,130,8,14]],rain:1,d:'雨。中央はぬかるみで足を取られる'},
 {k:'night',n:'夜戦',mood:'night',base:'#6a6a4a',baseTop:'#5e5e42',zones:[{k:'forest',pts:[[0,70],[20,66],[22,96],[0,100]],label:'林'},{k:'forest',pts:[[100,50],[80,54],[78,84],[100,80]],label:'林'}],night:1,fires:[[50,18],[50,134]],d:'夜。かがり火のほかは闇'}];
function terOf(F){return (x,y)=>{let t='plain';for(const z of F.zones||[])if(inPoly(x,y,z.pts))t=z.k==='road'?'road':z.k;return t;};}

/* ---- 連戦の状態 ---- */
let RUN=null;
function newRun(id){const me=HB(id);RUN={me:id,stage:1,wins:0,score:0,faced:[],log:[]};store.set('run',RUN);return RUN;}
function foeFor(run){const me=HB(run.me);const cand=ALL().filter(h=>h.f!==me.f&&h.id!==run.me&&!run.faced.includes(h.id)).sort((a,b)=>power(a)-power(b));
 if(run.stage>=STAGES)return cand.slice().sort((a,b)=>(b.p+b.cmd)-(a.p+a.cmd))[0].id;
 const n=cand.length,lo=Math.floor(n*(run.stage-1)/(STAGES-1)*.85),hi=Math.max(lo+1,Math.floor(n*run.stage/(STAGES-1)*.85)+2);
 return pick(cand.slice(lo,Math.min(n-1,hi))).id;}
function deputies(gid,n,avoid,weak){const g=HB(gid);let same=ALL().filter(h=>h.f===g.f&&h.id!==gid&&!(avoid||[]).includes(h.id));
 if(same.length<n)same=same.concat(ALL().filter(h=>h.f==='群'&&h.id!==gid&&!same.includes(h)&&!(avoid||[]).includes(h.id)));
 // 強い副将ほど付きやすい（ただし毎回すこし変わる）
 const pg=power(g);return same.map(h=>({h,k:weak?-Math.abs(power(h)-pg*.86)-(power(h)>pg?60:0)+Math.random()*50:power(h)+Math.random()*90})).sort((a,b)=>b.k-a.k).slice(0,n).map(o=>o.h.id);}
function typeFor(h,taken){const s={kiba:h.p*1.1+h.cmd*.5-(h.i>85?20:0),yumi:h.i*.9+h.cmd*.5-(h.p>95?25:0),yari:h.cmd*.8+h.p*.5};
 Object.keys(taken).forEach(k=>s[k]-=taken[k]*30);return Object.keys(s).sort((a,b)=>s[b]-s[a])[0];}
/* 兵は自動で与えられる：統率で総兵力、武力・知力で兵科が決まる */
function makeArmy(gid,side,total,avoid,weak){const g=HB(gid);const nd=g.cmd>=90?4:3;const deps=deputies(gid,nd,avoid,weak);
 const genN=Math.round(total*.22/100)*100,rest=total-genN;const sq=[{lead:gid,type:'gen',n:genN}];const taken={};
 deps.forEach((d,i)=>{const t=typeFor(HB(d),taken);taken[t]=(taken[t]||0)+1;sq.push({lead:d,type:t,n:0});});
 if(!sq.some(q=>q.type==='yari')&&sq.length>2)sq[1].type='yari';
 const w=sq.slice(1).map(q=>{const h=HB(q.lead);return .8+h.cmd/250;}),ws=w.reduce((a,b)=>a+b,0);
 sq.slice(1).forEach((q,i)=>q.n=Math.round(rest*w[i]/ws/100)*100);
 return {gid,side,total,sq};}
function totalFor(h,mult){return Math.round((5200+h.cmd*62)*mult/100)*100;}
function makeBattle(run){const me=HB(run.me),foe=HB(foeFor(run));const F=run.stage>=STAGES?FIELDS[3]:pick(FIELDS.filter(f=>f.k!==(run.lastField||'')));
 const mine=makeArmy(me.id,'me',totalFor(me,1+.05*run.wins));
 const theirs=makeArmy(foe.id,'foe',totalFor(foe,.8+.09*run.stage),mine.sq.map(q=>q.lead),run.stage<STAGES);
 return {me:me.id,foe:foe.id,F,mine,theirs,stage:run.stage};}

/* ---- 部隊の配置と強さ ---- */
const SLOT={front:[[50,113],[22,115],[78,115]],back:[[34,125],[66,125]],gen:[50,134]};
function toSquads(A,lv){lv=lv||1;const out=[];const fr=SLOT.front.slice(),bk=SLOT.back.slice();const foe=A.side==='foe';
 A.sq.forEach((q,i)=>{const h=HB(q.lead);let p;if(q.type==='gen')p=SLOT.gen;else if(q.type==='yumi')p=bk.shift()||fr.shift();else p=fr.shift()||bk.shift();if(!p)p=[50,120];
  const x=foe?100-p[0]:p[0],y=foe?150-p[1]:p[1];MONS['m_'+h.id]={bg:fcOf(HB(A.gid).f).c,bd:fcOf(HB(A.gid).f).t,glyph:h.s||h.n[0],fg:'#fbe9c0'};
  const melee=q.type!=='yumi';const atk=q.type==='gen'?.6+h.p/130:melee?.72+h.p/220+h.cmd/900:.78+h.cmd/300+h.i/900;
  out.push({id:(foe?'f':'m')+i,side:A.side,type:q.type,n:q.n,x,y,gen:q.type==='gen',name:q.type==='gen'?h.n:h.n+'隊',label:q.type==='gen'?h.n+'本隊':h.n+'隊・'+TYN[q.type][0],lead:h.id,mon:'m_'+h.id,
   atk:atk*lv,def:(.82+h.cmd/320)*lv,morale:clamp(78+h.cmd*.24,80,104),aggro:q.type==='gen'?20:18,
   mode:foe?(q.type==='gen'?'hold':'attack'):(q.type==='gen'?'hold':'idle')});});
 return out;}

/* ---- 采配（ゲージを使う命令） ---- */
const SPMAX=5;
function tacName(h){return h.i>=90?'火計':h.i>=72?'混乱':'鬨の声';}
function artName(h){return h.p>=h.cmd?'一騎当千':'突撃号令';}
function tacChance(a,b){return clamp(.58+(a.i-b.i)/110,.2,.95);}
function strength(side){return rbSide(side).filter(rbAlive).reduce((s,q)=>s+q.n*clamp(q.morale,0,110)/100,0);}
function buff(q,k,m,sec){if(!rbAlive(q))return;q[k]*=m;rbAfter(()=>{q[k]/=m;},sec*1000);}
function useTac(B,side){const me=side==='me',ah=HB(me?B.opt.meId:B.opt.foeId),dh=HB(me?B.opt.foeId:B.opt.meId);const nm=tacName(ah);
 const foes=rbSide(me?'foe':'me').filter(q=>rbAlive(q)&&!q.hidden);if(!foes.length)return;
 const cen=rbSide(side).filter(rbAlive);const cx=cen.reduce((s,q)=>s+q.x,0)/Math.max(1,cen.length),cy=cen.reduce((s,q)=>s+q.y,0)/Math.max(1,cen.length);
 const ok=Math.random()<tacChance(ah,dh);
 if(!ok){const t=foes[0];rbText(t.x,t.y-6,nm+'は見破られた！','#c8d8ff',1);if(me)rbMsg(dh.n+'に'+nm+'を見破られた……',2.5);else rbMsg(ah.n+'の'+nm+'を見破った！',2.5);return;}
 if(nm==='火計'){const t=foes.filter(q=>!q.gen).sort((a,b)=>b.n-a.n)[0]||foes[0];try{SND.fire();}catch(e){}try{if(typeof rb3Blast==='function')rb3Blast(B,t,.12,cx,cy);}catch(e){}
  rbHurt(t,t.n*(.1+ah.i/1200),null,1);t.dis=Math.max(t.dis,.7);t.morale-=18;rbText(t.x,t.y-6,'火計！','#ff8a40',1);for(let i=0;i<10;i++)B.fx.push({x:t.x+(Math.random()-.5)*8,y:t.y+(Math.random()-.5)*6,t:0,d:2,k:'dead',side:t.side});}
 else if(nm==='混乱'){shuffle(foes).slice(0,2).forEach(t=>{t.dis=Math.max(t.dis,.8);t.morale-=12;t.tgt=null;rbText(t.x,t.y-6,'混乱！','#d8a0ff',1);});try{SND.tone(900,1,'sine',.06,.3);}catch(e){}}
 else{foes.forEach(t=>{t.morale-=12;});rbText(foes[0].x,foes[0].y-8,'鬨の声に怯んだ！','#ffd36a',1);try{SND.warcry();}catch(e){}}
 if(!me)rbMsg(ah.n+'の'+nm+'！',2.5);}
function useCheer(B,side){rbSide(side).filter(rbAlive).forEach(q=>{q.morale=Math.min(130,q.morale+25);q.dis=0;});const g=rbSide(side).find(q=>q.gen&&rbAlive(q));if(g)rbText(g.x,g.y-8,side==='me'?'奮い立て！':'敵が士気を取り戻した','#ffd36a',1);try{SND.horn();}catch(e){}}
function useArt(B){const h=HB(B.opt.meId),nm=artName(h);const g=rbSide('me').find(q=>q.gen&&rbAlive(q));
 const line=speak(h.id,'sp')||h.sp||'いざ、参る！';rbCut(h.id,line);
 if(nm==='一騎当千'&&g){g.morale=Math.max(g.morale,140);buff(g,'atkMul',2.4,11);buff(g,'defMul',1.5,11);const t=rbSide('foe').find(q=>q.gen&&rbAlive(q));rbOrder(g,'charge',null);g.charge=6;g.tgt=rbNearest(g,null,60)||t;rbText(g.x,g.y-8,'一騎当千！','#ffd36a',1);}
 else{rbMe().forEach(q=>{buff(q,'atkMul',1.45,9);q.morale=Math.max(q.morale,115);if(!q.gen)rbOrder(q,'charge');});rbText(50,110,'突撃号令！','#ffd36a',1);}
 try{SND.boom();SND.warcry();}catch(e){}}
function useRev(B){B.flags.rev=1;const h=HB(B.opt.meId);const fg=rbSide('foe').find(q=>q.gen&&rbAlive(q));
 const fl=el('div','rb-flash','');B.root.appendChild(fl);setTimeout(()=>fl.remove(),800);
 const line=speak(h.id,'charge')||'勝機は今ぞ！ 全軍かかれ！';
 const bn=el('div','rb-rev','<b>逆転</b><small>'+esc(line)+'</small>');B.root.appendChild(bn);setTimeout(()=>bn.remove(),3000);
 B.slowUntil=performance.now()+1600;try{SND.gong(.28);SND.horn();SND.warcry();}catch(e){}BGM.play('crisis');
 rbMe().forEach(q=>{q.morale=150;q.dis=0;buff(q,'atkMul',1.9,15);buff(q,'defMul',1.3,15);rbSet(q,'charge',q.gen?null:(fg||rbNearest(q)));q.charge=6;});
 rbSide('foe').filter(rbAlive).forEach(q=>{q.morale-=22;q.dis=Math.max(q.dis,.45);});}
function canRev(B){if(B.flags.rev)return false;const m=strength('me'),f=strength('foe');const g=rbSide('me').find(q=>q.gen);return m<f*.7||(g&&g.n<g.n0*.45);}

/* ---- 合戦 ---- */
async function fight(bt){const me=HB(bt.me),foe=HB(bt.foe),F=bt.F,mc=fcOf(me.f),fc=fcOf(foe.f);
 const squads=toSquads(bt.mine).concat(toSquads(bt.theirs,.92+.024*bt.stage));
 const final=bt.stage>=STAGES;
 const cfg={title:'第'+bt.stage+'戦　'+F.n,auto:false,per:200,K:.034,limit:240,seed:(Date.now()%100000)+7,meId:me.id,foeId:foe.id,
  bgm:final?'crisis':'battle',mood:F.mood,night:!!F.night,fires:F.fires,base:F.base,baseTop:F.baseTop,zones:F.zones,trees:F.trees,ter:terOf(F),
  rain:F.rain?()=>.85:null,
  meCol:mc.c,meTrim:mc.t,foeCol:fc.c,foeTrim:fc.t,
  kits:{me:{all:{hat:mc.hat,hatCol:mc.hc,shield:mc.sh,shieldCol:mc.t}},foe:{all:{hat:fc.hat,hatCol:fc.hc,shield:fc.sh,shieldCol:fc.t},kiba:{fm:'wedge'}}},
  intro:'部隊をタップ→地面で移動・敵で攻撃。敵将'+foe.n+'（★）を討て',
  squads,
  tick:(B,dt)=>{const f=B.flags;f.sp=Math.min(SPMAX,(f.sp==null?1.5:f.sp)+dt*(.045+me.i/1600));f.esp=Math.min(SPMAX,(f.esp==null?.5:f.esp)+dt*(.03+foe.i/2000)*(.6+bt.stage*.08));
   const k=Math.min(3,Math.floor(f.sp))+(canRev(B)?10:0);if(k!==f._k){f._k=k;if(!B.sel&&!B.ask)rbCmd();}
   // 敵将の采配
   if(B.time>8&&f.esp>=2&&(f._eT||0)<B.time){f._eT=B.time+6+Math.random()*8;const fm=rbSide('foe').filter(rbAlive);const avg=fm.reduce((s,q)=>s+q.morale,0)/Math.max(1,fm.length);
    if(avg<60&&Math.random()<.6){f.esp-=1;useCheer(B,'foe');}else if(bt.stage>=2&&Math.random()<.35+bt.stage*.04){f.esp-=2;useTac(B,'foe');}}
   if(!f.said&&B.time>1.2){f.said=1;const t=speak(me.id,'charge');if(t)rbText(50,128,t,'#fbe9c0');}},
  buttons:[
   {label:'鼓舞①',on:B=>B.flags.sp>=1,fn:B=>{B.flags.sp-=1;useCheer(B,'me');const t=speak(me.id,'defend');if(t)rbMsg(me.n+'「'+t+'」',2.5);}},
   {label:tacName(me)+'②',on:B=>B.flags.sp>=2,fn:B=>{B.flags.sp-=2;useTac(B,'me');}},
   {label:artName(me)+'③',on:B=>B.flags.sp>=3,fn:B=>{B.flags.sp-=3;useArt(B);}},
   {label:'逆転の采配',cls:'pri',show:B=>canRev(B),fn:B=>useRev(B)}],
  onAll:B=>{const t=speak(me.id,'charge');if(t)rbMsg(me.n+'「'+t+'」',2.5);},
  goal:B=>{const n=Math.floor(B.flags.sp||0);return '采配 '+'●'.repeat(n)+'○'.repeat(SPMAX-n)+'　敵将 '+foe.n+'（★）を討て'+(canRev(B)?'　― 逆転の采配が使える！':'');},
  onLimit:B=>{const m=strength('me'),f=strength('foe');B.flags.judge=1;return m>f?'win':'lose';},
  onFall:(t,B)=>{if(t.gen&&t.side==='foe'){const v=speak(me.id,'win');if(v)rbMsg(me.n+'「'+v+'」',3);}},
  endText:(w,B)=>B.flags.judge?(w?'時間切れ。戦場を制した':'時間切れ。押し切れなかった'):(w?foe.n+'を討ち取った！':me.n+'は退いた……')};
 SND.init();
 const st=await rbStart(cfg);return st;}

/* ---- 画面 ---- */
function scr(html){const s=$('#scr');s.hidden=false;s.scrollTop=0;s.innerHTML='<div class="in">'+html+'</div>';return s;}
function statLine(h){return '武力'+h.p+'・統率'+h.cmd+'・知力'+h.i;}
function showTitle(){BGM.play('camp');const best=store.get('best')||{},clr=store.get('clear')||{};const run=store.get('run');
 const s=scr('<div class="eye">三国覇王伝 × 逆転の采配</div><h1>覇王の采配</h1>'+
  '<p class="lead">三国覇王伝の武将をひとり選び、合戦だけを十番勝負で戦う。<br>兵は統率に応じて自動で与えられ、副将も同じ勢力から付く。<br>部隊をタップして動かし、采配で戦の流れを変え、敵将を討て。</p>'+
  '<div class="row2">'+(run&&HB(run.me)?'<button class="btn big pri" id="tCont">続きから（'+esc(HB(run.me).n)+'・第'+run.stage+'戦）</button>':'')+
  '<button class="btn big'+(run?'':' pri')+'" id="tNew">武将を選ぶ</button></div>'+
  '<div class="box"><div class="sec">遊び方</div>'+
  '<dl class="kv"><dt>動かす</dt><dd>味方の部隊をタップ（時がゆっくりになる）→地面をタップで移動、敵をタップで攻撃</dd>'+
  '<dt>兵科</dt><dd>槍は騎兵に強い。騎兵は弓に強く速い。弓は離れて射る。挟み撃ちにすると敵の士気が大きく落ちる</dd>'+
  '<dt>采配</dt><dd>時間でたまる（知力が高いほど早い）。鼓舞①・計略②・戦法③。劣勢になると一度だけ「逆転の采配」</dd>'+
  '<dt>勝ち負け</dt><dd>敵将（★）を討てば勝ち。自分の本隊が崩れたら負け。四分で決着がつかなければ残った兵の多い方の勝ち</dd>'+
  '<dt>連戦</dt><dd>勝つほど与えられる兵が増え、敵将も強くなる。十戦目は最強の敵将</dd></dl></div>'+
  (Object.keys(clr).length?'<div class="box"><div class="sec">十番勝負を制した武将</div><div class="chips">'+Object.keys(clr).filter(HB).map(id=>'<span>'+esc(HB(id).n)+'</span>').join('')+'</div></div>':''));
 const c=s.querySelector('#tCont');if(c)c.onclick=()=>{SND.init();SND.click();RUN=run;showPre();};
 s.querySelector('#tNew').onclick=()=>{SND.init();SND.click();showPick();};}
function showPick(){const best=store.get('best')||{},clr=store.get('clear')||{};let f0=store.get('pf')||'蜀';
 const draw=()=>{const list=ALL().filter(h=>h.f===f0).sort((a,b)=>power(b)-power(a));
  const s=scr('<h2 class="ttl">武将を選ぶ</h2><div class="tabs">'+FORD.filter(f=>ALL().some(h=>h.f===f)).map(f=>'<button class="tab'+(f===f0?' on':'')+'" data-f="'+f+'" style="--c:'+fcOf(f).c+'">'+f+'</button>').join('')+'</div>'+
   '<div class="hg">'+list.map(h=>'<button class="hcard" data-id="'+h.id+'" style="--c:'+fcOf(h.f).c+'"><img alt="" src="'+face(h.id)+'"><div><b>'+esc(h.n)+(clr[h.id]?' <i>覇</i>':'')+'</b><small>武'+h.p+' 統'+h.cmd+' 知'+h.i+'</small><small>'+(h.p>=h.cmd?'一騎当千':'突撃号令')+'・'+tacName(h)+'</small><small class="bs">'+(best[h.id]?'最高 '+best[h.id]+'勝':'')+'</small></div></button>').join('')+'</div>'+
   '<button class="btn" id="pBack">もどる</button>');
  s.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{SND.click();f0=b.dataset.f;store.set('pf',f0);draw();});
  s.querySelectorAll('.hcard').forEach(b=>b.onclick=()=>{SND.click();confirmPick(b.dataset.id);});
  s.querySelector('#pBack').onclick=()=>{SND.click();showTitle();};};
 draw();}
function confirmPick(id){const h=HB(id);const tot=totalFor(h,1);const nd=h.cmd>=90?4:3;
 const s=scr('<div class="duo"><img alt="" src="'+face(id)+'" style="--c:'+fcOf(h.f).c+'"></div><h2 class="ttl">'+esc(h.n)+(h.az?'<small>字 '+esc(h.az)+'・'+esc(h.f)+'</small>':'<small>'+esc(h.f)+'</small>')+'</h2>'+
  '<p class="lead">「'+esc(h.sp)+'」</p>'+
  '<div class="box"><dl class="kv"><dt>能力</dt><dd>'+statLine(h)+'</dd><dt>兵</dt><dd>はじめは約'+fmtN(tot)+'（統率から自動）。副将'+nd+'人</dd>'+
  '<dt>戦法③</dt><dd>'+(h.p>=h.cmd?'一騎当千：本隊の攻撃が大きく上がり、敵に斬りこむ':'突撃号令：全部隊の攻撃が上がり、いっせいに突撃')+'</dd>'+
  '<dt>計略②</dt><dd>'+({火計:'火計：敵の大部隊を焼き、混乱させる',混乱:'混乱：敵の二部隊を混乱させる',鬨の声:'鬨の声：敵全体の士気を下げる'}[tacName(h)])+'（知力の差で成否が決まる）</dd>'+
  '<dt>采配のたまり</dt><dd>'+(h.i>=85?'速い':h.i>=60?'ふつう':'遅い')+'</dd></dl></div>'+
  '<div class="row2"><button class="btn" id="cNo">選びなおす</button><button class="btn big pri" id="cGo">この武将で戦う</button></div>');
 s.querySelector('#cNo').onclick=()=>{SND.click();showPick();};
 s.querySelector('#cGo').onclick=()=>{SND.click();newRun(id);try{speak(id,'accept');}catch(e){}showPre();};}
function armyHtml(A){return '<div class="army">'+A.sq.map(q=>{const h=HB(q.lead);return '<div class="aq'+(q.type==='gen'?' g':'')+'"><img alt="" src="'+face(h.id)+'"><div><b>'+esc(h.n)+'</b><small>'+TYN[q.type]+' 約'+fmtN(q.n)+'</small><small class="st">武'+h.p+' 統'+h.cmd+' 知'+h.i+'</small></div></div>';}).join('')+'</div>';}
function showPre(){BGM.play('council');const run=RUN;if(!run.bt){run.bt=makeBattle(run);store.set('run',run);}const bt=run.bt;const me=HB(bt.me),foe=HB(bt.foe);
 const s=scr('<div class="eye">'+(bt.stage>=STAGES?'最後の一戦':'十番勝負')+'</div><h2 class="ttl big">第'+bt.stage+'戦<small>'+esc(bt.F.n)+'　―　'+esc(bt.F.d)+'</small></h2>'+
  '<div class="vs"><div class="side" style="--c:'+fcOf(me.f).c+'"><img alt="" src="'+face(me.id)+'"><b>'+esc(me.n)+'</b><small>'+esc(me.f)+'・約'+fmtN(bt.mine.total)+'</small></div><i>対</i><div class="side" style="--c:'+fcOf(foe.f).c+'"><img alt="" src="'+face(foe.id)+'"><b>'+esc(foe.n)+'</b><small>'+esc(foe.f)+'・約'+fmtN(bt.theirs.total)+'</small></div></div>'+
  '<p class="lead">'+esc(foe.n)+'「'+esc(foe.sp)+'」</p>'+
  '<div class="two"><div class="box"><div class="sec">自軍（自動で編成）</div>'+armyHtml(bt.mine)+'</div><div class="box"><div class="sec">敵軍</div>'+armyHtml(bt.theirs)+'</div></div>'+
  '<div class="row2"><button class="btn" id="pTop">題名へ</button><button class="btn big pri" id="pGo">出陣</button></div>'+
  '<small class="dim">これまで '+run.wins+'勝 ・ 戦功 '+fmtN(run.score)+'</small>');
 s.querySelector('#pTop').onclick=()=>{SND.click();showTitle();};
 s.querySelector('#pGo').onclick=async()=>{SND.init();SND.click();$('#scr').hidden=true;const st=await fight(bt);showResult(bt,st);};}
function showResult(bt,st){const run=RUN,me=HB(bt.me),foe=HB(bt.foe);const lost=bt.mine.total-st.me,kill=bt.theirs.total-st.foe;
 const keep=clamp(st.me/bt.mine.total,0,1);const pts=st.win?Math.round(bt.stage*120+keep*300+Math.max(0,240-st.time)*2+(st.flags.rev?0:80)):0;
 const best=store.get('best')||{};
 run.faced.push(bt.foe);run.lastField=bt.F.k;run.log.push({s:bt.stage,foe:bt.foe,win:st.win});
 if(st.win){run.wins++;run.score+=pts;best[me.id]=Math.max(best[me.id]||0,run.wins);store.set('best',best);}
 const rank=!st.win?'':keep>.7?'S':keep>.5?'A':keep>.3?'B':'C';
 const done=st.win&&bt.stage>=STAGES;
 if(st.win)BGM.play('victory');else BGM.play('defeat');
 const s=scr('<div class="verdict '+(st.win?'win':'lose')+'">'+(st.win?'勝利':'敗北')+'</div>'+
  (st.win?'<div class="rank">評価<b>'+rank+'</b>戦功 +'+fmtN(pts)+'</div>':'')+
  '<div class="vs sm"><div class="side" style="--c:'+fcOf(me.f).c+'"><img alt="" src="'+face(me.id)+'"><b>'+esc(me.n)+'</b><small>'+esc(st.win?(me.win||''):(me.lose||''))+'</small></div><i>対</i><div class="side'+(st.win?' down':'')+'" style="--c:'+fcOf(foe.f).c+'"><img alt="" src="'+face(foe.id)+'"><b>'+esc(foe.n)+'</b><small>'+esc(st.win?(foe.lose||''):(foe.win||''))+'</small></div></div>'+
  '<div class="box"><dl class="kv"><dt>討った敵兵</dt><dd>約'+fmtN(kill)+'</dd><dt>失った兵</dt><dd>約'+fmtN(lost)+'（残り'+Math.round(keep*100)+'%）</dd><dt>かかった時間</dt><dd>'+Math.round(st.time)+'秒</dd>'+(st.flags.rev?'<dt>采配</dt><dd>逆転の采配を使った</dd>':'')+'</dl></div>'+
  (done?'<div class="box good"><div class="sec">十番勝負、制覇</div><p>'+esc(me.n)+'は十人の敵将をすべて退けた。総戦功 '+fmtN(run.score)+'</p></div>':'')+
  (!st.win?'<div class="box"><div class="sec">戦歴</div><p>'+esc(me.n)+'の連戦は第'+bt.stage+'戦で終わった。'+run.wins+'勝・総戦功 '+fmtN(run.score)+'</p></div>':'')+
  '<div class="row2">'+(st.win&&!done?'<button class="btn big pri" id="rNext">次の戦へ（第'+(bt.stage+1)+'戦）</button>':'')+
  (!st.win?'<button class="btn big pri" id="rRetry">'+esc(me.n)+'でもう一度</button>':'')+'<button class="btn" id="rTop">武将を選びなおす</button></div>');
 if(done){const c=store.get('clear')||{};c[me.id]=run.score;store.set('clear',c);store.set('run',null);}
 else if(st.win){run.stage++;run.bt=null;store.set('run',run);}else store.set('run',null);
 const nx=s.querySelector('#rNext');if(nx)nx.onclick=()=>{SND.click();showPre();};
 const rt=s.querySelector('#rRetry');if(rt)rt.onclick=()=>{SND.click();newRun(me.id);showPre();};
 s.querySelector('#rTop').onclick=()=>{SND.click();store.set('run',done||!st.win?null:run);showPick();};}

window.addEventListener('pointerdown',()=>{try{SND.init();}catch(e){}},{once:true});
showTitle();
