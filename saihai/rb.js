/* 逆転の采配から流用：リアルタイムの合戦（rb.js）と3D表示（rb3d.js） */
/* ===== 決戦：リアルタイムの合戦（三国決戦伝の合戦にならって） =====
 部隊＝兵の集まり。部隊をタップして選び（時がゆっくりになる）、地面をタップで移動、敵をタップで攻撃。
 世界の大きさ：横100 × 縦150（上が敵陣、下が自陣） */
const RB_T={
 yari:{n:'槍',atk:1,def:1,spd:5,rng:0,vs:{kiba:1.5}},
 yumi:{n:'弓',atk:.55,def:.75,spd:5,rng:24,vs:{}},
 kiba:{n:'騎',atk:1.25,def:.9,spd:10,rng:0,vs:{yumi:1.8,yari:.7}},
 gen:{n:'将',atk:1.1,def:1.3,spd:5.5,rng:0,vs:{}},
 ship:{n:'船',atk:.9,def:1.2,spd:4,rng:20,vs:{}},
 gun:{n:'銃',atk:.8,def:.9,spd:4,rng:30,vs:{}}
};
let BT=null;const RB_DT=1/30;let rbRnd=Math.random;
function rbStart(opt){return new Promise(done=>{
 const root=el('div','rb');root.innerHTML='<div class="rb-top"><div class="rb-t"><b></b><span></span></div><div class="rb-bar"><i class="me"></i><i class="foe"></i></div><div class="rb-sub"></div></div><div class="rb-view"><canvas class="rb-gl"></canvas><canvas class="rb-cv"></canvas></div><div class="rb-msg"></div><div class="rb-cmd"></div>';
 document.body.appendChild(root);
 const cv=root.querySelector('.rb-cv'),g=cv.getContext('2d');
 rbRnd=mrand(opt.seed||20260512);BT={opt,time:0,sq:[],proj:[],fx:[],txt:[],sel:null,over:false,slow:1,flags:{},root,cv,done,log:[]};
 opt.squads.forEach(o=>BT.sq.push(rbSquad(o)));
 const L={s:1,ox:0,oy:0,dpr:1};BT.L=L;const gl=root.querySelector('.rb-gl');
 if(rb3Ok()&&!opt.flat&&!window.RB_FLAT){try{requestAnimationFrame(()=>{try{rb3Init(BT,gl);}catch(e){console.warn('3D off',e);BT.g3=null;gl.hidden=true;}});}catch(e){gl.hidden=true;}}else gl.hidden=true;
 const lay=()=>{const r=cv.getBoundingClientRect();L.dpr=Math.min(2,window.devicePixelRatio||1);cv.width=r.width*L.dpr;cv.height=r.height*L.dpr;L.W=r.width;L.H=r.height;L.s=Math.min(r.width/100,r.height/150);L.ox=(r.width-100*L.s)/2;L.oy=(r.height-150*L.s)/2;BT.bg=null;if(BT.g3)BT.g3.resize();};
 requestAnimationFrame(lay);window.addEventListener('resize',lay);BT.unlay=()=>window.removeEventListener('resize',lay);
 cv.addEventListener('click',e=>rbTap(e));
 rbCmd();rbMsg(opt.intro||'兵は自動で戦う。要所の選択肢を選べ',3.5);
 if(opt.bgm)BGM.play(opt.bgm);SND.horn();
 try{if(SND.ok()&&!window.RB_FLAT){const c=SND.ctx,n=c.sampleRate*2,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=c.createBufferSource();s.buffer=b;s.loop=true;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=750;f.Q.value=.6;const gn=c.createGain();gn.gain.value=0;s.connect(f);f.connect(gn);gn.connect(SND.sfx);s.start();BT.amb={s,g:gn};}}catch(e){}
 let last=performance.now();
 const frame=now=>{if(!BT||BT.root!==root)return;const raw=Math.min(.05,(now-last)/1000);last=now;const B=BT,slow=(B.slowUntil&&now<B.slowUntil?.22:1)*(B.sel&&B.opt.auto===false?.35:1);let adv=0;
  if(!B.over&&!B.ask){const sp=(B.speed||1)*(window.RB_SPEED||1)*slow;B.acc=(B.acc||0)+raw*sp;let k=0;const cap=Math.ceil(8*sp)+1;while(B.acc>=RB_DT&&k<cap&&!B.over&&!B.ask){B.acc-=RB_DT;B.time+=RB_DT;rbStep(RB_DT);k++;adv+=RB_DT;}if(k>=cap)B.acc=0;}
  else if(B.over)adv=raw*slow;
  B.vdt=adv;rbDraw(g);requestAnimationFrame(frame);};
 requestAnimationFrame(frame);});}
function rbSquad(o){const T=RB_T[o.type]||RB_T.yari;return Object.assign({id:o.id||('q'+Math.random().toString(36).slice(2,7)),side:o.side||'me',type:o.type||'yari',name:o.name||T.n,n:o.n,n0:o.n,x:o.x,y:o.y,
  tx:null,ty:null,tgt:null,mode:o.mode||(o.side==='foe'?'hold':'attack'),morale:o.morale==null?100:o.morale,dis:o.dis||0,hidden:!!o.hidden,gen:!!o.gen,mon:o.mon,face:o.side==='foe'?Math.PI/2:-Math.PI/2,
  kit:o.kit,fm:o.fm,alive:true,routed:false,fight:0,charge:0,atkMul:o.atk||1,defMul:o.def||1,spdMul:o.spd||1,floor:o.floor!=null?o.floor:(o.gen?5:null),aggro:o.aggro==null?16:o.aggro,home:o.home,per:o.per||null,ai:o.ai,label:o.label,wp:o.wp?o.wp.slice():null},o.extra||{});}
const rbFoes=q=>BT.sq.filter(e=>e.alive&&!e.routed&&e.side!==q.side&&!(e.hidden&&q.side==='foe'));
const rbSide=s=>BT.sq.filter(q=>q.side===s);
const rbAlive=q=>q.alive&&!q.routed;
function rbRad(q){const per=q.per||BT.opt.per||100;const k=clamp(Math.ceil(q.n/per),q.n>0?1:0,48);return 2.2+Math.sqrt(k)*1.05;}
function rbFigs(q){const per=q.per||BT.opt.per||100;return q.n>0?clamp(Math.ceil(q.n/per),5,48):0;}
function rbNearest(q,list,maxd){let b=null,bd=maxd==null?1e9:maxd;(list||rbFoes(q)).forEach(e=>{const d=Math.hypot(e.x-q.x,e.y-q.y);if(d<bd){bd=d;b=e;}});return b;}
function rbTer(x,y){const f=BT.opt.ter;return f?f(x,y):'plain';}
const TERM={plain:{spd:1,def:1},forest:{spd:.6,def:1.25},hill:{spd:.85,def:1.2},river:{spd:.35,def:.75},marsh:{spd:.45,def:.8},road:{spd:1.15,def:1},bridge:{spd:.6,def:.9},sea:{spd:1,def:1},wall:{spd:.3,def:1.8},rock:{spd:.25,def:1}};
function rbAfter(fn,ms){if(!BT)return;(BT.later=BT.later||[]).push({t:BT.time+(ms||0)/1000,fn});}
function rbStep(dt){const B=BT,O=B.opt;if(B.later&&B.later.length){const due=B.later.filter(x=>x.t<=B.time);B.later=B.later.filter(x=>x.t>B.time);due.forEach(x=>{try{x.fn();}catch(e){console.warn(e);}});if(B.over)return;}
 if(O.tick)O.tick(B,dt);
 for(const ev of (O.events||[])){if(B.ask)return;if(B.triumph===2)break;if(!ev.done&&(ev.t!=null?B.time>=ev.t:ev.when(B))){ev.done=true;if(ev.ask){rbAsk(ev);return;}ev.fn(B);}}
 for(const q of B.sq){if(!q.alive)continue;
  if(q.routed){const hy=q.home!=null?q.home:(q.side==='me'?170:-20);const dy=hy-q.y;q.y+=Math.sign(dy)*7*dt;q.x+=Math.sin(B.time*3+q.x)*.6*dt;rbAvoid(q,7,dt);if(Math.abs(dy)<2||q.y<-15||q.y>165){q.alive=false;}continue;}
  if(q.dis>0)q.dis=Math.max(0,q.dis-(O.disDecay==null?.012:O.disDecay)*dt);
  // 行動を決める
  if(q.side==='foe'||O.auto!==false)rbAI(q,dt);else rbPlayerAI(q,dt);
  const T=RB_T[q.type];let tgt=q.tgt&&rbAlive(q.tgt)?q.tgt:null;if(!tgt)q.tgt=null;
  let mx=q.tx,my=q.ty;
  if(tgt){const d=Math.hypot(tgt.x-q.x,tgt.y-q.y),reach=rbRad(q)+rbRad(tgt)+.5;
   if(T.rng&&d<=T.rng&&!q.melee){mx=null;q.face=Math.atan2(tgt.y-q.y,tgt.x-q.x);q.shootT=(q.shootT||0)-dt;if(q.shootT<=0){q.shootT=1.1+rbRnd()*.4;rbShoot(q,tgt);} }
   else if(d>reach){mx=tgt.x;my=tgt.y;}else{mx=null;}}
  if(mx!=null){const dx=mx-q.x,dy=my-q.y,d=Math.hypot(dx,dy);if(d>.6){let blk=1;if(q.melee&&q.melee.length&&!q.ghost&&!q.push){const m0=q.melee[0];if((m0.x-q.x)*dx+(m0.y-q.y)*dy>0)blk=(q.charge>0||q.type==='kiba')?.5:.25;}const sp=blk*T.spd*q.spdMul*(TERM[rbTer(q.x,q.y)]||TERM.plain).spd*(q.charge>0?1.35:1)*(O.spdMul?O.spdMul(q,B):1);const st=Math.min(d,sp*dt);q.x+=dx/d*st;q.y+=dy/d*st;q.face=Math.atan2(dy,dx);q.moving=true;if(q.ghost)rbAvoid(q,sp,dt);}else{q.moving=false;if(!tgt){q.tx=q.ty=null;if(q.mode==='move')q.mode='idle';}}}else q.moving=false;
  if(q.charge>0)q.charge-=dt;if(q.ambushT>0)q.ambushT-=dt;
 }
 // 近接戦闘
 const live=B.sq.filter(rbAlive);for(const q of live)q.melee=null;
 for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){const a=live[i],b=live[j];if(a.ghost||b.ghost)continue;if(a.side===b.side){if(a.side!=='foe'||a.roman||b.roman)continue;const d0=Math.hypot(a.x-b.x,a.y-b.y),m0=(rbRad(a)+rbRad(b))*.85;if(d0<m0&&d0>.01){const ux=(a.x-b.x)/d0,uy=(a.y-b.y)/d0,o=(m0-d0)*.08;a.x+=ux*o;a.y+=uy*o;b.x-=ux*o;b.y-=uy*o;}continue;}const d=Math.hypot(a.x-b.x,a.y-b.y);if(d<rbRad(a)+rbRad(b)+.8){
   if(b.hidden&&a.side==='foe'){b.hidden=false;rbText(b.x,b.y-6,'伏兵！','#ffd36a',1);}if(a.hidden&&b.side==='foe'){a.hidden=false;rbText(a.x,a.y-6,'伏兵！','#ffd36a',1);}
   [[a,b],[b,a]].forEach(([p,v])=>{if(p.ambushT>0&&!(p._amb||{})[v.id]){(p._amb=p._amb||{})[v.id]=1;v.dis=Math.max(v.dis,.6);v.morale-=22;rbText(v.x,v.y-6,'不意をつかれた！','#ffb06a');}});
   (a.melee=a.melee||[]).push(b);(b.melee=b.melee||[]).push(a);
   // めりこまないように押し返す
   const ov=(rbRad(a)+rbRad(b)+.8-d)/2;if(d>.01){const ux=(a.x-b.x)/d,uy=(a.y-b.y)/d;if(!a.anchor){a.x+=ux*ov*.5;a.y+=uy*ov*.5;}if(!b.anchor){b.x-=ux*ov*.5;b.y-=uy*ov*.5;}}}}
 for(const q of live){q.x=clamp(q.x,1,99);q.y=clamp(q.y,1,149);}
 for(const q of live){if(!q.melee)continue;const n=q.melee.length;if(n>1&&q.floor==null)q.morale-=2.5*(n-1)*dt;q.melee.forEach(t=>{let f=n>1?1/n:1;rbHurt(t,rbPow(q,t,true)*f*dt,q,t.melee?t.melee.length:1);});if(rbRnd()<dt*2)SND.clash();}
 // 飛び道具
 B.proj=B.proj.filter(p=>{p.t+=dt;return p.t<p.d;});
 B.fx=B.fx.filter(f=>{f.t+=dt;return f.t<f.d;});B.txt=B.txt.filter(t=>{t.t+=dt;return t.t<t.d;});
 // 勝ち負け
 if(B.triumph===2)return;
 let res=O.check?O.check(B):rbDefaultCheck(B);if(!res&&O.limit&&B.time>=O.limit)res=O.onLimit?O.onLimit(B):'lose';
 // 選択をすべて正しく選んでいれば負けない。最後の選択の前に崩れそうなら、その場で逆転が始まる
 if(res==='lose'&&!B.doom&&(B.flags.ans||[]).length&&!B.flags.escaped){rbTriumph(B);return;}
 if(res==='win'&&!B.doom&&(B.flags.ans||[]).length){rbTriumph(B);return;}
 if(res)rbEnd(res);}
/* 敵の中をすり抜けない：重なったら外へ押し出し、横へまわりこむ */
function rbAvoid(q,sp,dt){for(const e of BT.sq){if(e.side===q.side||!rbAlive(e)||e.hidden||e.ghost)continue;const R=rbRad(q)+rbRad(e)*.9,dx=q.x-e.x,dy=q.y-e.y,d=Math.hypot(dx,dy);if(d>=R)continue;const nx=d>.01?dx/d:1,ny=d>.01?dy/d:0;q.x=e.x+nx*R;q.y=e.y+ny*R;const sg=dx>=0?1:-1;q.x+=sg*Math.abs(ny)*sp*dt*.8;}}
/* 運命：選択肢の正誤で勝ち負けが決まる */
function rbFate(B){const asks=(B.opt.events||[]).filter(e=>e.ask),an=B.flags.ans||[];if(an.some(a=>!a.ok)){B.doom=1;return;}if(an.length>=asks.length&&!B.triumph){B.triumph=1;rbAfter(()=>rbTriumph(B),2600);}}
/* 鮮やかな逆転：敵が端から総崩れになり、最後に大将を討つ */
function rbTriumph(B){if(!BT||BT!==B||B.over||B.triumph===2)return;B.triumph=2;B.flags.perfect=1;const O=B.opt,F=O.finale||{},now=performance.now();
 const me=rbMe(),foes=rbSide('foe').filter(q=>rbAlive(q)&&!q.gen),fg=rbSide('foe').find(q=>q.gen&&rbAlive(q));
 const cx=me.length?me.reduce((s,q)=>s+q.x,0)/me.length:50,cy=me.length?me.reduce((s,q)=>s+q.y,0)/me.length:110;
 const fl=el('div','rb-flash','');B.root.appendChild(fl);setTimeout(()=>fl.remove(),800);
 const bn=el('div','rb-rev','<b>逆転</b><small>'+esc(F.line||'勝機は今ぞ！ 全軍かかれ！')+'</small>');B.root.appendChild(bn);setTimeout(()=>bn.remove(),3000);
 B.slowUntil=now+1600;B.focus={x:cx,y:cy-12,until:now+2600,w:46};try{SND.gong(.28);SND.horn();SND.warcry();}catch(e){}
 me.forEach(q=>{q.ghost=0;q.hidden=false;q.morale=Math.max(q.morale,150);q.atkMul=(q.atkMul||1)*2.2;q.spdMul=Math.max(1,q.spdMul||1);rbSet(q,'charge',fg||rbNearest(q,foes));q.charge=9;});
 foes.sort((a,b)=>Math.hypot(a.x-cx,a.y-cy)-Math.hypot(b.x-cx,b.y-cy));const step=foes.length>6?480:650;
 foes.forEach((f,i)=>rbAfter(()=>{if(!BT||BT.over||!rbAlive(f))return;try{if(typeof rb3Blast==='function')rb3Blast(B,f,.4,cx,cy);}catch(e){}f.morale=0;f.routed=true;f.tgt=null;f.n*=.6;rbText(f.x,f.y-6,i===0?'崩れた！':'総崩れ！','#ffd36a',1);try{if(SND.limit('rev',300))SND.clash();}catch(e){}},900+i*step));
 const tEnd=900+foes.length*step+700;
 rbAfter(()=>{if(!BT||BT.over)return;const g=rbSide('foe').find(q=>q.gen&&q.alive&&!q.routed);
  if(g){if(F.kill!==false){try{if(typeof rb3Blast==='function')rb3Blast(B,g,.95,cx,cy);}catch(e){}rbHurt(g,g.n+1,null,1);}else{g.routed=true;g.tgt=null;rbFell(g,null);rbText(g.x,g.y-14,F.cap||(g.name+'を退けた！'),'#ffd36a',1);B.slowUntil=performance.now()+2000;B.focus={x:g.x,y:g.y,until:performance.now()+3000};}}
  rbSide('foe').forEach(q=>{if(rbAlive(q)){q.routed=true;q.tgt=null;}});
  rbAfter(()=>{if(BT===B&&!B.over)rbEnd('win');},g?2600:1400);},tEnd);}
function rbDefaultCheck(B){const fg=rbSide('foe').find(q=>q.gen),mg=rbSide('me').find(q=>q.gen);
 if(fg&&!rbAlive(fg))return 'win';if(mg&&!rbAlive(mg))return 'lose';
 if(!rbSide('foe').some(rbAlive))return 'win';if(!rbSide('me').some(rbAlive))return 'lose';return null;}
function rbPow(a,t,melee){const T=RB_T[a.type],U=RB_T[t.type];let p=a.n*T.atk*a.atkMul*(T.vs[t.type]||1)*clamp(a.morale,15,130)/100*(1-a.dis*.6);
 if(melee&&T.rng&&a.type!=='gun')p*=.5;if(a.charge>0&&!T.rng)p*=1.6;if(a.ambushT>0)p*=2.2;
 const td=U.def*t.defMul*(TERM[rbTer(t.x,t.y)]||TERM.plain).def*(1-t.dis*.45);
 if(BT.opt.powMul)p*=BT.opt.powMul(a,t,BT);
 return p/td*(BT.opt.K||.03);}
function rbHurt(t,dmg,src,attackers){if(!t.alive||t.routed||dmg<=0)return;if(t.floor!=null&&t.morale<=t.floor+1&&t.n<t.n0*.3)dmg*=2.5;const before=t.n;t.n=Math.max(0,t.n-dmg);const lost=before-t.n;
 let ml=lost/t.n0*85;if(attackers>1){if(!t._fl||BT.time-t._fl>6){t._fl=BT.time;rbText(t.x,t.y-6,'挟撃！','#ffb06a');t.morale-=4;}}
 t.morale-=ml;if(t.floor!=null)t.morale=Math.max(t.floor,t.morale);
 if(rbRnd()<lost*.02)BT.fx.push({x:t.x+(rbRnd()-.5)*rbRad(t)*1.6,y:t.y+(rbRnd()-.5)*rbRad(t),t:0,d:2.5,k:'dead',side:t.side});
 if(t.n<1){t.alive=false;rbFell(t,src);return;}
 if(t.morale<=0){t.routed=true;t.tgt=null;rbText(t.x,t.y-6,'潰走！','#ffb0a0');rbFell(t,src);BT.sq.forEach(o=>{if(o!==t&&rbAlive(o)&&o.side===t.side&&Math.hypot(o.x-t.x,o.y-t.y)<25)o.morale-=10;});}}
function rbFell(t,src){if(t.gen){BT.slowUntil=performance.now()+2400;BT.focus={x:t.x,y:t.y,until:performance.now()+3400};try{SND.gong(.2);}catch(e){}rbText(t.x,t.y-8,t.side==='foe'?t.name+'を討ち取った！':t.name+'が討たれた！','#ffd36a',1);SND.warcry();BT.sq.forEach(o=>{if(o.side===t.side&&rbAlive(o))o.morale-=40;});}if(BT.opt.onFall)BT.opt.onFall(t,BT);}
function rbShoot(q,t){(BT.vfx=BT.vfx||[]).push({q,t});if(BT.vfx.length>60)BT.vfx.shift();const dmg=rbPow(q,t,false)*1.2;BT.proj.push({x:q.x,y:q.y,tx:t.x,ty:t.y,t:0,d:.55,k:q.type});rbAfter(()=>{if(BT&&!BT.over)rbHurt(t,dmg,q,1);},300);if(q.type==='gun'||q.type==='ship')SND.boom();else SND.arrow();}
function rbText(x,y,s,col,big){BT.txt.push({x,y,s,col:col||'#fff',t:0,d:big?2.6:1.5,big});}
function rbMsg(s,sec){const m=BT.root.querySelector('.rb-msg');m.textContent=s;m.classList.add('on');clearTimeout(BT._mt);BT._mt=setTimeout(()=>m.classList.remove('on'),(sec||3)*1000);}
function rbAI(q,dt){const O=BT.opt;if(q.ai&&q.ai(q,BT,dt))return;
 if(q.mode==='flee'){q.tgt=null;if(!q.gen&&!q.keep){q.routed=true;return;}q.tx=q.x;q.ty=q.side==='me'?170:-20;return;}
 if(q.mode==='wait'){q.tgt=q.melee?q.melee[0]:null;if(!q.tgt){q.tx=q.ty=null;}return;}
 if(q.mode==='target'){if(q.tgt&&rbAlive(q.tgt))return;q.mode='attack';}
 if(q.mode==='move'){if(q.melee&&!q.push){q.tgt=q.melee[0];return;}q.tgt=null;if(q.tx==null||Math.hypot(q.tx-q.x,q.ty-q.y)<1.5){q.mode=q.after||'hold';q.hx=null;}return;}
 if(q.wp&&q.wp.length){const p=q.wp[0];q.tgt=null;q.tx=p[0];q.ty=p[1];if(Math.hypot(p[0]-q.x,p[1]-q.y)<2)q.wp.shift();if(!q.push){const near=rbNearest(q,null,q.aggro*.6);if(near&&!q.dis)q.tgt=near;}else if(q.melee)q.tgt=null;return;}
 if(q.mode==='attack'){if(!q.tgt||!rbAlive(q.tgt))q.tgt=rbNearest(q);return;}
 if(q.mode==='hold'||q.mode==='guard'){const near=rbNearest(q,null,q.aggro*(q.dis>.5?.4:1));if(near)q.tgt=near;else{q.tgt=null;if(q.hx!=null){q.tx=q.hx;q.ty=q.hy;}}if(q.hx==null){q.hx=q.x;q.hy=q.y;}}}
function rbPlayerAI(q,dt){if(q.mode==='hold'){q.tx=q.ty=null;const near=rbNearest(q,null,RB_T[q.type].rng||rbRad(q)+6);q.tgt=near||null;return;}
 if(q.mode==='move'){if(!q.melee)q.tgt=null;return;}
 if(q.mode==='attack'&&(!q.tgt||!rbAlive(q.tgt))){q.tgt=rbNearest(q,null,90);if(!q.tgt)q.mode='idle';}
 if(q.mode==='idle'&&!q.hidden){const near=rbNearest(q,null,(RB_T[q.type].rng||0)+rbRad(q)+7);q.tgt=near||null;}}
function rbOrder(q,k,arg){if(!q||!rbAlive(q)||q.side!=='me')return;if(q.lock){rbMsg(q.lockMsg||q.name+'は命令を聞かない',2);return;}
 if(k==='move'){q.mode='move';q.tgt=null;q.tx=arg[0];q.ty=arg[1];}
 if(k==='attack'){q.mode='attack';q.tgt=arg;q.tx=q.ty=null;if(q.hidden){q.hidden=false;q.ambushT=6;rbText(q.x,q.y-6,'伏兵、かかれ！','#ffd36a',1);}}
 if(k==='charge'){q.charge=3.5;q.mode='attack';q.tgt=arg||rbNearest(q,null,80);if(q.hidden){q.hidden=false;q.ambushT=6;rbText(q.x,q.y-6,'伏兵、かかれ！','#ffd36a',1);}SND.horse();}
 if(k==='hold'){q.mode='hold';q.tgt=null;q.tx=q.ty=null;}
 if(k==='back'){q.mode='move';q.tgt=null;q.tx=q.x;q.ty=Math.min(146,q.y+22);}}
/* ---- 操作 ---- */
function rbW2S(x,y,h){if(BT.g3&&!BT.paintTex)return rb3Proj(x,y,h==null?null:rb3H(x,y)+h);const L=BT.L;return [L.ox+x*L.s,L.oy+y*L.s];}
function rbS2W(px,py){if(BT.g3)return rb3Pick(px,py);const L=BT.L;return [(px-L.ox)/L.s,(py-L.oy)/L.s];}
function rbTap(e){if(!BT||BT.over||BT.ask)return;if(BT.opt.auto!==false){const r0=BT.cv.getBoundingClientRect();const [x0,y0]=rbS2W(e.clientX-r0.left,e.clientY-r0.top);const h0=BT.sq.filter(q=>rbAlive(q)&&!(q.side==='foe'&&q.hidden)).sort((a,b)=>Math.hypot(a.x-x0,a.y-y0)-Math.hypot(b.x-x0,b.y-y0))[0];if(h0&&Math.hypot(h0.x-x0,h0.y-y0)<rbRad(h0)+5)rbMsg(h0.name+'（約'+fmtN(h0.n)+'・士気'+Math.round(clamp(h0.morale,0,100))+'）',2);return;}const r=BT.cv.getBoundingClientRect();const [x,y]=rbS2W(e.clientX-r.left,e.clientY-r.top);
 let hit=null,hd=1e9;BT.sq.forEach(q=>{if(!rbAlive(q))return;if(q.side==='foe'&&q.hidden)return;const d=Math.hypot(q.x-x,q.y-y);const rr=rbRad(q)+5;if(d<rr&&d<hd){hd=d;hit=q;}});
 if(hit&&hit.side==='me'){BT.sel=BT.sel===hit?null:hit;SND.click();rbCmd();return;}
 if(BT.sel){if(hit&&hit.side==='foe'){rbOrder(BT.sel,'attack',hit);rbText(hit.x,hit.y-7,'攻撃！','#ffe0a0');}else{rbOrder(BT.sel,'move',[clamp(x,2,98),clamp(y,2,148)]);BT.fx.push({x,y,t:0,d:.8,k:'ping'});}SND.click();BT.sel=null;rbCmd();return;}
 if(hit&&hit.side==='foe'){rbMsg(hit.name+'（約'+fmtN(hit.n)+'）'+(hit.gen?' ・総大将':''),2);return;}
 rbMsg('まず味方の部隊をタップ',1.5);}
function rbCmd(){const c=BT.root.querySelector('.rb-cmd');c.innerHTML='';const q=BT.sel;
 if(BT.ask){const ev=BT.ask;const h=ev.who&&HB(ev.who);c.classList.add('ask');c.appendChild(el('div','rb-ask',(h?'<img alt="" src="'+face(ev.who)+'">':'')+'<div><b>'+esc(h?h.n:'')+'</b><p>'+esc(ev.text)+'</p></div>'));
  ev.opts.forEach((o,i)=>{const x=el('button','btn rb-opt',esc(o.l));x.type='button';x.onclick=e=>{e.stopPropagation();SND.click();rbAnswer(i);};c.appendChild(x);});return;}
 c.classList.remove('ask');
 if(BT.opt.auto!==false){const x=el('button','btn',BT.speed===2?'速さ ×2':'速さ ×1');x.type='button';x.onclick=e=>{e.stopPropagation();BT.speed=BT.speed===2?1:2;rbCmd();};c.appendChild(el('div','rb-info','<small>兵は自動で戦う。要所で選択肢が出る</small>'));c.appendChild(x);return;}
 const b=(label,fn,cls,dis)=>{const x=el('button','btn '+(cls||''),label);x.type='button';x.disabled=!!dis;x.onclick=ev=>{ev.stopPropagation();SND.click();fn();rbCmd();};c.appendChild(x);return x;};
 if(q){c.appendChild(el('div','rb-info','<b>'+esc(q.name)+'</b><small>約'+fmtN(q.n)+' ・ 士気'+Math.round(clamp(q.morale,0,100))+(q.hidden?' ・ 伏せている':'')+'</small><small>地面をタップで移動、敵をタップで攻撃</small>'));
  b('突撃',()=>{rbOrder(q,'charge');BT.sel=null;},'pri');b('止まれ',()=>{rbOrder(q,'hold');BT.sel=null;});b('退け',()=>{rbOrder(q,'back');BT.sel=null;});b('✕',()=>{BT.sel=null;});}
 else{b('全軍突撃',()=>{rbSide('me').filter(rbAlive).forEach(s=>{if(!s.lock)rbOrder(s,'charge');});rbText(50,120,'全軍、かかれぇっ！','#ffd36a',1);SND.warcry();if(BT.opt.onAll)BT.opt.onAll(BT);},'pri');
  (BT.opt.buttons||[]).forEach(o=>{if(o.show&&!o.show(BT))return;b(o.label,()=>o.fn(BT),o.cls,o.on&&!o.on(BT));});
  b(BT.speed===2?'速さ×2':'速さ×1',()=>{BT.speed=BT.speed===2?1:2;});}}
/* ---- 描画 ---- */
function rbDraw(g){const B=BT,L=B.L,O=B.opt;if(!L.W)return;g.setTransform(L.dpr,0,0,L.dpr,0,0);
 if(B.g3){g.clearRect(0,0,L.W,L.H);rb3Render(B);}
 else{if(!B.bg){B.bg=document.createElement('canvas');B.bg.width=B.cv.width;B.bg.height=B.cv.height;const h=B.bg.getContext('2d');h.setTransform(L.dpr,0,0,L.dpr,0,0);rbBg(h);}
 g.drawImage(B.bg,0,0,L.W,L.H);}
 if(O.overlay){const ov=O.overlay(B);if(ov){g.fillStyle=ov;g.fillRect(0,0,L.W,L.H);}}
 if(O.drawUnder)O.drawUnder(g,B);
 B.fx.forEach(f=>{const [x,y]=rbW2S(f.x,f.y);if(f.k==='dead'){g.fillStyle=f.side==='me'?'rgba(30,30,40,'+(.5*(1-f.t/f.d))+')':'rgba(110,20,14,'+(.5*(1-f.t/f.d))+')';g.fillRect(x-2,y-1,4,2);}if(f.k==='ping'){g.strokeStyle='rgba(255,230,120,'+(1-f.t/f.d)+')';g.lineWidth=2;g.beginPath();g.arc(x,y,4+f.t*14,0,7);g.stroke();}});
 // 命令の矢印
 if(O.auto===false)B.sq.forEach(q=>{if(!rbAlive(q)||q.side!=='me')return;let tx=q.tx,ty=q.ty;if(q.tgt){tx=q.tgt.x;ty=q.tgt.y;}if(tx==null)return;const [a,b]=rbW2S(q.x,q.y),[c,d]=rbW2S(tx,ty);g.strokeStyle=q.tgt?'rgba(255,120,80,.55)':'rgba(255,230,140,.5)';g.lineWidth=2;g.setLineDash([5,5]);g.beginPath();g.moveTo(a,b);g.lineTo(c,d);g.stroke();g.setLineDash([]);});
 const order=B.sq.filter(q=>q.alive).sort((a,b)=>a.y-b.y);order.forEach(q=>rbDrawSq(g,q));
 if(!B.g3)B.proj.forEach(p=>{const k=p.t/p.d;const x=p.x+(p.tx-p.x)*k,y=p.y+(p.ty-p.y)*k-(B.g3?0:Math.sin(k*Math.PI)*(p.k==='yumi'?8:2));const [sx,sy]=B.g3?rbW2S(x,y,1.5+Math.sin(k*Math.PI)*(p.k==='yumi'?9:3)):rbW2S(x,y);
  if(p.k==='yumi'){g.strokeStyle='rgba(40,30,20,.85)';g.lineWidth=1;for(let i=0;i<4;i++){g.beginPath();g.moveTo(sx+i*3-4,sy+i*2-3);g.lineTo(sx+i*3-1,sy+i*2-6);g.stroke();}}else{g.fillStyle='rgba(30,30,30,.9)';g.beginPath();g.arc(sx,sy,2.4,0,7);g.fill();}});
 if(O.drawOver)O.drawOver(g,B);
 B.txt.forEach(t=>{const [x,y]=B.g3?rbW2S(t.x,t.y,6+t.t*3):rbW2S(t.x,t.y-t.t*3);g.save();g.globalAlpha=Math.min(1,(t.d-t.t)*1.5);g.font=(t.big?'bold 20px ':'bold 14px ')+FD();g.textAlign='center';g.lineWidth=4;g.strokeStyle='rgba(20,8,4,.9)';g.strokeText(t.s,x,y);g.fillStyle=t.col;g.fillText(t.s,x,y);g.restore();});
 // 上の表示
 const me=rbSide('me').filter(rbAlive).reduce((s,q)=>s+q.n*clamp(q.morale,0,100)/100,0),fo=rbSide('foe').filter(rbAlive).reduce((s,q)=>s+q.n*clamp(q.morale,0,100)/100,0);
 const tot=me+fo||1;const top=B.root.querySelector('.rb-top');top.querySelector('.rb-t b').textContent=O.title||'決戦';
 top.querySelector('.rb-t span').textContent=O.limit?'残り '+Math.max(0,Math.ceil(O.limit-B.time))+'秒':'';
 top.querySelector('.me').style.width=(me/tot*100)+'%';top.querySelector('.foe').style.width=(fo/tot*100)+'%';
 top.querySelector('.rb-sub').textContent=O.goal?O.goal(B):'';
 if(B.sel)rbInfoRefresh();}
let _rbi=0;function rbInfoRefresh(){if(performance.now()-_rbi<300)return;_rbi=performance.now();const i=BT.root.querySelector('.rb-info small');if(i&&BT.sel)i.textContent='約'+fmtN(BT.sel.n)+' ・ 士気'+Math.round(clamp(BT.sel.morale,0,100))+(BT.sel.hidden?' ・ 伏せている':'');}
function rbBg(g){const B=BT,L=B.L,O=B.opt;const W=L.W,H=L.H;
 const base=O.base||'#b8a874';g.fillStyle=O.outside||'#2a2418';g.fillRect(0,0,W,H);
 const [x0,y0]=rbW2S(0,0),[x1,y1]=rbW2S(100,150);const gr=g.createLinearGradient(0,y0,0,y1);gr.addColorStop(0,O.baseTop||base);gr.addColorStop(1,base);g.fillStyle=gr;g.fillRect(x0,y0,x1-x0,y1-y0);
 const R=mrand(7);for(let i=0;i<900;i++){const x=x0+R()*(x1-x0),y=y0+R()*(y1-y0);g.fillStyle='rgba(60,50,20,'+(R()*.12)+')';g.fillRect(x,y,2,2);}
 (O.zones||[]).forEach(z=>{g.beginPath();z.pts.forEach((p,i)=>{const [x,y]=rbW2S(p[0],p[1]);i?g.lineTo(x,y):g.moveTo(x,y);});g.closePath();
  const c={forest:'rgba(50,80,40,.55)',hill:'rgba(140,120,70,.45)',river:'rgba(70,110,150,.85)',marsh:'rgba(90,110,80,.5)',road:'rgba(160,130,80,.5)',sea:'rgba(60,100,130,.9)',land:'rgba(150,130,90,1)',wall:'rgba(120,90,50,.95)',bridge:'rgba(110,80,40,1)',rock:'rgba(90,80,70,.9)',camp:'rgba(220,200,160,.5)'}[z.k]||z.col;
  g.fillStyle=z.col||c;g.fill();
  if(z.k==='hill'){g.strokeStyle='rgba(80,60,30,.5)';g.lineWidth=1.5;g.stroke();}
  if(z.label){const cx=z.pts.reduce((s,p)=>s+p[0],0)/z.pts.length,cy=z.pts.reduce((s,p)=>s+p[1],0)/z.pts.length;const [x,y]=rbW2S(z.lx!=null?z.lx:cx,z.ly!=null?z.ly:cy);g.font='13px '+FD();g.textAlign='center';g.fillStyle=z.lc||'rgba(30,20,10,.7)';g.fillText(z.label,x,y);}});
 (O.trees||[]).forEach(([cx,cy,rr,n])=>{for(let i=0;i<n;i++){const a=R()*7,d=Math.sqrt(R())*rr;const [x,y]=rbW2S(cx+Math.cos(a)*d,cy+Math.sin(a)*d*.8);g.fillStyle='rgba(30,60,30,'+(.5+R()*.4)+')';g.beginPath();g.arc(x,y,3+R()*3,0,7);g.fill();}});
 if(O.drawBg)O.drawBg(g,B);}
function rbDrawSq(g,q){const B=BT,L=B.L,k=rbFigs(q);if(!k)return;const vis=q.side==='me'||!q.hidden;if(!vis)return;
 const T=q.type,cols=Math.max(1,Math.round(Math.sqrt(k*1.7))),sp=1.9;const ca=Math.cos(q.face),sa=Math.sin(q.face);
 const bodyCol=q.side==='me'?(BT.opt.meCol||'#1e2a44'):(BT.opt.foeCol||'#8a1e14'),trim=q.side==='me'?(BT.opt.meTrim||'#e8c060'):(BT.opt.foeTrim||'#f0e0c0');
 g.save();if(q.hidden)g.globalAlpha=.45;if(q.routed)g.globalAlpha=.55;
 const fight=q.melee&&q.melee.length,t=B.time;
 for(let i=0;i<(B.g3?0:k);i++){const r=Math.floor(i/cols),c=i%cols;let lx=(r-(Math.ceil(k/cols)-1)/2)*sp*-1,ly=(c-(cols-1)/2)*sp;
  if(q.routed){lx+=Math.sin(i*7.1)*3;ly+=Math.cos(i*3.3)*3;}
  let jx=0,jy=0;if(fight){jx=Math.sin(t*9+i*1.7)*.5;jy=Math.cos(t*8+i*2.3)*.5;}else if(q.moving){jy=Math.sin(t*10+i)*.25;}
  const wx=q.x+lx*ca-ly*sa+jx,wy=q.y+lx*sa+ly*ca+jy;const [x,y]=rbW2S(wx,wy);const s=Math.max(1.8,L.s*.72);
  if(T==='kiba'||(T==='gen'&&i===0)){g.fillStyle='#5a3a1e';g.beginPath();g.ellipse(x,y+s*.4,s*1.25,s*.65,q.face,0,7);g.fill();}
  if(T==='ship'){g.fillStyle='#5a3a1e';g.beginPath();g.ellipse(x,y,s*2.2,s*.9,q.face,0,7);g.fill();g.fillStyle=trim;g.fillRect(x-s*.2,y-s*2.4,s*.4,s*2);continue;}
  g.fillStyle=bodyCol;g.beginPath();g.arc(x,y,s,0,7);g.fill();g.fillStyle=trim;g.beginPath();g.arc(x,y-s*.2,s*.42,0,7);g.fill();
  if(T==='yari'||T==='gen'){g.strokeStyle='rgba(40,30,20,.85)';g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x+ca*s*2.4,y+sa*s*2.4-s);g.stroke();}
  if(T==='yumi'||T==='gun'){g.strokeStyle='rgba(60,40,20,.85)';g.lineWidth=1;g.beginPath();g.arc(x+ca*s,y+sa*s,s*.8,q.face-1,q.face+1);g.stroke();}}
 g.restore();
 // 旗と名札
 const [fx,fy]=B.g3?rbW2S(q.x,q.y,(q.type==='ship'?5.5:3.4)):rbW2S(q.x,q.y-rbRad(q)-.5);g.save();if(q.hidden)g.globalAlpha=.6;if(q.routed)g.globalAlpha=.5;
 if(B.g3)g.globalAlpha*=.82;
 const M=MONS[q.mon||(q.side==='me'?S.meMon:S.foeMon)]||MONS.oda;if(!B.g3){g.strokeStyle='#2a1a0c';g.lineWidth=1.5;g.beginPath();g.moveTo(fx,fy+4);g.lineTo(fx,fy-16);g.stroke();g.fillStyle=M.bg;g.strokeStyle=M.bd;g.lineWidth=1.2;g.fillRect(fx+1,fy-16,11,13);g.strokeRect(fx+1,fy-16,11,13);
 g.save();g.translate(fx+6.5,fy-9.5);if(M.draw)M.draw(g,4);else{g.fillStyle=M.fg;g.font='bold 9px '+FD();g.textAlign='center';g.textBaseline='middle';g.fillText(M.small?'':M.glyph,0,1);}g.restore();}
 const label=(q.label||q.name)+(q.gen?'★':'');g.font='bold 10px '+FB();const w=g.measureText(label).width+6;g.fillStyle=q.side==='me'?'rgba(20,16,12,.8)':'rgba(120,24,16,.82)';g.fillRect(fx-w/2,fy+5,w,13);g.fillStyle='#fbe9c0';g.textAlign='center';g.fillText(label,fx,fy+15);
 // 兵の数の帯
 const pw=w,pr=clamp(q.n/q.n0,0,1),mr=clamp(q.morale/100,0,1);g.fillStyle='rgba(0,0,0,.6)';g.fillRect(fx-pw/2,fy+18,pw,4);g.fillStyle=q.side==='me'?'#7fb0ff':'#ff8a70';g.fillRect(fx-pw/2,fy+18,pw*pr,2);g.fillStyle='#f1cf72';g.fillRect(fx-pw/2,fy+20,pw*mr,2);
 if(B.sel===q){g.strokeStyle='rgba(255,230,120,.95)';g.lineWidth=2.5;const [cx,cy]=rbW2S(q.x,q.y);g.beginPath();g.arc(cx,cy,(rbRad(q)+2)*L.s,0,7);g.stroke();}
 g.restore();}
function rbEnd(res){if(BT.over)return;BT.over=true;const B=BT;if(res==='escaped'){B.flags.escaped=1;res='lose';}const win=res==='win';B.won=win;
 const m=el('div','rb-end',(win?'勝利':'敗北')+'<small>'+(B.opt.endText?esc(B.opt.endText(win,B)):'')+'</small>');B.root.appendChild(m);if(win)SND.warcry();
 setTimeout(()=>{const st={win,time:B.time,me:rbSide('me').filter(rbAlive).reduce((s,q)=>s+q.n,0),foe:rbSide('foe').filter(rbAlive).reduce((s,q)=>s+q.n,0),flags:B.flags};try{if(B.amb)B.amb.s.stop();}catch(e){}B.unlay();B.root.remove();BT=null;B.done(st);},window.RB_SPEED?600:3800);}

/* 決戦を始めて、結果を G に書きこむ */
async function rbBattle(G,cfg){E.gaugeOff();const me0=cfg.squads.filter(q=>q.side!=='foe').reduce((a,q)=>a+q.n,0)||1;
 const st=await rbStart(cfg);G.bt=st;G.R=st.win?(st.flags.perfect?3.2:Math.min(2.45,2+clamp(st.me/me0,0,1)*.9)):1.4;return st.win;}
function rbAdd(o){const q=rbSquad(o);BT.sq.push(q);return q;}

/* ---- 選択肢（時を止めて、武将にたずねる） ---- */
function rbAsk(ev){const B=BT;B.ask=ev;B.sel=null;if(ev.onShow)ev.onShow(B);SND.gong(.14);rbCmd();}
function rbAnswer(i){const B=BT,ev=B.ask;if(!ev)return;const o=ev.opts[i];(B.flags.ans=B.flags.ans||[]).push({k:ev.key||ev.text,i,ok:o.ok});B.ask=null;if(o.fn)o.fn(B);rbFate(B);if(o.say)rbMsg(o.say,3);rbCmd();rbCut(B.opt.cmd||ev.who,o.l);}
function rbCut(who,line){const h=who&&HB(who);if(!h||!BT)return;const c=el('div','rb-cut','<img alt="" src="'+face(who)+'"><div><small>'+esc(h.n)+'</small><b>'+esc(String(line).replace(/[「」]/g,''))+'</b></div>');BT.root.appendChild(c);setTimeout(()=>c.remove(),2300);BT.slowUntil=performance.now()+1200;try{SND.gong(.14);SND.warcry();}catch(e){}}
/* 部隊に役目を与える（自動で戦う） */
function rbSet(q,mode,arg){if(!q||!rbAlive(q))return;q.mode=mode;q.hidden=mode==='wait'?q.hidden:false;if(mode==='target'){q.tgt=arg;}else if(mode==='move'){q.tgt=null;q.tx=arg[0];q.ty=arg[1];q.after=arg[2]||'hold';}else q.tgt=null;if(mode==='charge'){try{if(SND.limit('chg',1500)){SND.warcry();if(q.type==='kiba')SND.horse();}}catch(e){}q.mode='attack';q.charge=3.5;if(arg){q.mode='target';q.tgt=arg;}}}
const rbQ=id=>BT.sq.find(q=>q.id===id);

const rbAns=(B,k)=>{const a=(B.flags.ans||[]).find(x=>x.k===k);return a?a.ok:null;};
const rbMe=()=>rbSide('me').filter(rbAlive);
/* ===== 決戦の3D表示（three.js）：合戦の計算は rb.js のまま、見た目だけ3Dにする ===== */
const RB3={};
function rb3Ok(){return typeof THREE!=='undefined';}
function rb3H(x,y){const B=BT;if(!B||!B.hm)return 0;const W=B.hmW,H=B.hmH,gx=clamp(x/2,0,W-1.001),gy=clamp(y/2,0,H-1.001),ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy,h=B.hm;
 const a=h[iy*W+ix],b=h[iy*W+ix+1],c=h[(iy+1)*W+ix],d=h[(iy+1)*W+ix+1];return (a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy;}
const _v3=typeof THREE!=='undefined'?new THREE.Vector3():null;
function rb3Proj(x,y,h){const B=BT,R=B.g3;_v3.set(x-50,h==null?rb3H(x,y):h,y-75);_v3.project(R.cam);return [(_v3.x+1)/2*R.W,(1-_v3.y)/2*R.H,_v3.z];}
function rb3Pick(px,py){const R=BT.g3;const v=new THREE.Vector3(px/R.W*2-1,-(py/R.H*2-1),.5).unproject(R.cam);const o=R.cam.position;const d=v.sub(o).normalize();if(Math.abs(d.y)<1e-4)return [50,75];const t=-o.y/d.y;return [o.x+d.x*t+50,o.z+d.z*t+75];}
function rb3Init(B,glCanvas){const O=B.opt;const R={};B.g3=R;
 const ren=new THREE.WebGLRenderer({canvas:glCanvas,antialias:true});ren.setPixelRatio(Math.min(2,window.devicePixelRatio||1));R.ren=ren;
 const sc=new THREE.Scene();R.sc=sc;const night=!!O.night,sea=O.base&&/^#[23][0-9a-f]6/i.test(O.base)||!!O.sea;
 const MOOD={day:{top:'#4f86c6',hor:'#cfe2ee',sun:'#fff2d8',si:.72,hi:.95},dawn:{top:'#5a78b0',hor:'#f2cfa8',sun:'#ffd2a0',si:.72,hi:.85},dusk:{top:'#46507a',hor:'#f0a878',sun:'#ffb080',si:.7,hi:.8},rain:{top:'#3e4852',hor:'#87929a',sun:'#c8d0d8',si:.3,hi:.8},night:{top:'#050916',hor:'#161e34',sun:'#ffb070',si:.5,hi:.55},haze:{top:'#86a8c8',hor:'#ead9b0',sun:'#fff0d0',si:.78,hi:.95}};
 const MD=MOOD[O.mood||(night?'night':'day')]||MOOD.day;R.MD=MD;R.MDay=MOOD.day;
 const sky=new THREE.Color(MD.hor);sc.background=sky;sc.fog=new THREE.Fog(sky,110,300);
 R.skyU={top:{value:new THREE.Color(MD.top)},hor:{value:new THREE.Color(MD.hor)}};
 const dome=new THREE.Mesh(new THREE.SphereGeometry(420,20,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:R.skyU,vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 hor;varying vec3 vP;void main(){float h=normalize(vP).y;gl_FragColor=vec4(mix(hor,top,smoothstep(0.,.55,h)),1.);}'}));dome.frustumCulled=false;sc.add(dome);
 R.hemi=new THREE.HemisphereLight(night?0x8090c0:0xfff4e0,night?0x101018:0x5a4a30,MD.hi);sc.add(R.hemi);
 const sun=new THREE.DirectionalLight(new THREE.Color(MD.sun),MD.si);sun.position.set(-40,70,50);sc.add(sun);R.sun=sun;
 if(O.fires&&O.fires.length){const f0=O.fires[0];R.fireL=new THREE.PointLight(0xff8a30,1.6,110);R.fireL.position.set(f0[0]-50,7,f0[1]-75);sc.add(R.fireL);}
 const cam=new THREE.PerspectiveCamera(48,1,.5,600);R.cam=cam;R.dist=30;R.orb=0;R.oa=0;{const g0=B.sq.find(q=>q.side==='me'&&q.gen)||B.sq.find(q=>q.side==='me')||{x:50,y:110};R.tx=g0.x-50;R.tz=g0.y-75;B.focus={x:g0.x,y:g0.y,until:performance.now()+2000,w:30};}
 // ---- 高さ：丘は盛り上げ、川は少し低く、海戦では陸を上げる
 const W=51,H=76,hm=new Float32Array(W*H);B.hmW=W;B.hmH=H;
 const zones=O.zones||[];for(let j=0;j<H;j++)for(let i=0;i<W;i++){const x=i*2,y=j*2;let h=0;zones.forEach(z=>{if(!inPoly(x,y,z.pts))return;if(z.k==='hill')h=Math.max(h,4.2);if(z.k==='land')h=Math.max(h,2.6);if(z.k==='rock')h=Math.max(h,2);if(z.k==='river')h=Math.min(h,-.7);});hm[j*W+i]=h;}
 for(let p=0;p<3;p++){const c=hm.slice();for(let j=1;j<H-1;j++)for(let i=1;i<W-1;i++){const k=j*W+i;hm[k]=(c[k]*2+c[k-1]+c[k+1]+c[k-W]+c[k+W])/6;}}
 B.hm=hm;
 // ---- 地面の絵：2Dの背景を絵にして貼る
 const tc=document.createElement('canvas');tc.width=1024;tc.height=1536;const tg=tc.getContext('2d');const L0=B.L;B.L={W:1024,H:1536,ox:0,oy:0,s:10.24,dpr:1};B.paintTex=true;rbBg(tg);B.paintTex=false;B.L=L0;rb3Detail(tg,O,sea,1024,1536);
 const tex=new THREE.CanvasTexture(tc);tex.anisotropy=4;
 const gg=new THREE.PlaneGeometry(100,150,W-1,H-1);gg.rotateX(-Math.PI/2);const pos=gg.attributes.position;
 for(let k=0;k<pos.count;k++){const x=pos.getX(k)+50,y=pos.getZ(k)+75;pos.setY(k,rb3H(x,y));}gg.computeVertexNormals();
 const ground=new THREE.Mesh(gg,new THREE.MeshLambertMaterial({map:tex}));sc.add(ground);
 // 戦場の外側
 const out=new THREE.Mesh(new THREE.PlaneGeometry(600,600),new THREE.MeshLambertMaterial({color:new THREE.Color(O.outside3d||(sea?'#2a4e66':night?'#141008':'#6a6a44'))}));out.rotation.x=-Math.PI/2;out.position.y=-.9;sc.add(out);
 // ---- 水面（川と海）
 R.waterU={t:{value:0}};const water=new THREE.Mesh(new THREE.PlaneGeometry(100,150),new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:R.waterU,vertexShader:'varying vec2 vW;void main(){vW=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float t;varying vec2 vW;void main(){float w=sin(vW.x*.38+t*1.3)*sin(vW.y*.33-t)+sin((vW.x+vW.y)*.7+t*2.1)*.5;vec3 c=mix(vec3(.13,.33,.48),vec3(.62,.8,.88),smoothstep(.25,1.35,w));gl_FragColor=vec4(c,.6);}'}));water.rotation.x=-Math.PI/2;water.position.y=sea?.07:-.28;sc.add(water);
 // ---- 草
 const RG=mrand(31);if(!sea){const zk=(x,y)=>{let k='';for(const z of zones)if(inPoly(x,y,z.pts))k=z.k;return k;};const gp=[];for(let i=0;i<2400&&gp.length<650;i++){const x=RG()*100,y=RG()*150,k=zk(x,y);if(k==='river'||k==='road'||k==='wall'||k==='camp'||k==='bridge'||k==='sea')continue;gp.push([x,y]);}
  const gm=new THREE.InstancedMesh(new THREE.ConeGeometry(.2,.28,5).translate(0,.14,0),new THREE.MeshLambertMaterial({color:new THREE.Color(O.grass||(night?'#1e2a18':O.mood==='haze'?'#a8985a':'#5f8038'))}),gp.length);const d2=new THREE.Object3D();gp.forEach((p,i)=>{d2.position.set(p[0]-50,rb3H(p[0],p[1]),p[1]-75);const s=.7+RG()*1.1;d2.scale.set(s,s,s);d2.rotation.y=RG()*6;d2.updateMatrix();gm.setMatrixAt(i,d2.matrix);});sc.add(gm);}
 // ---- 雨
 {const RN=420,rp=new Float32Array(RN*6);for(let i=0;i<RN;i++){rp[i*6]=(Math.random()-.5)*130;rp[i*6+1]=Math.random()*40;rp[i*6+2]=(Math.random()-.5)*130;}const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(rp,3));R.rain=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:0xd0dcea,transparent:true,opacity:.5}));R.rain.frustumCulled=false;R.rain.visible=false;R.rp=rp;R.RN=RN;sc.add(R.rain);}
 // ---- 木
 const treePts=[];const R0=mrand(13);(O.trees||[]).forEach(([cx,cy,rr,n])=>{for(let i=0;i<Math.min(n,60);i++){const a=R0()*7,d=Math.sqrt(R0())*rr;treePts.push([cx+Math.cos(a)*d,cy+Math.sin(a)*d*.8]);}});
 zones.filter(z=>z.k==='forest').forEach(z=>{const xs=z.pts.map(p=>p[0]),ys=z.pts.map(p=>p[1]);const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);const n=Math.min(90,Math.round((x1-x0)*(y1-y0)/16));for(let i=0;i<n*3&&treePts.length<420;i++){const x=x0+R0()*(x1-x0),y=y0+R0()*(y1-y0);if(inPoly(x,y,z.pts))treePts.push([x,y]);}});
 if(treePts.length){const tm=new THREE.InstancedMesh(new THREE.ConeGeometry(1.1,3.4,6).translate(0,1.7,0),new THREE.MeshLambertMaterial({color:night?0x1a2a1a:0x2f5a2a}),treePts.length);const dm=new THREE.Object3D();
  treePts.forEach((p,i)=>{dm.position.set(p[0]-50,rb3H(p[0],p[1]),p[1]-75);const s=.8+R0()*.6;dm.scale.set(s,s*(.9+R0()*.4),s);dm.rotation.y=R0()*6;dm.updateMatrix();tm.setMatrixAt(i,dm.matrix);});sc.add(tm);}
 // ---- 壁・柵
 const wallSegs=[];zones.filter(z=>z.k==='wall'||z.k==='camp').forEach(z=>{for(let i=0;i<z.pts.length;i++){const a=z.pts[i],b=z.pts[(i+1)%z.pts.length];const L=Math.hypot(b[0]-a[0],b[1]-a[1]);const n=Math.max(1,Math.round(L/2));for(let k=0;k<n;k++){const t=(k+.5)/n;wallSegs.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,Math.atan2(b[0]-a[0],b[1]-a[1]),z.k]);}}});
 if(wallSegs.length){const wm=new THREE.InstancedMesh(new THREE.BoxGeometry(.7,1.3,2.1).translate(0,.65,0),new THREE.MeshLambertMaterial({color:0x8a6a3a}),wallSegs.length);const dm=new THREE.Object3D();wallSegs.forEach((w,i)=>{dm.position.set(w[0]-50,rb3H(w[0],w[1]),w[1]-75);dm.rotation.set(0,w[2],0);dm.scale.set(1,w[3]==='camp'?1.6:1,1);dm.updateMatrix();wm.setMatrixAt(i,dm.matrix);});sc.add(wm);}
 // ---- 兵の部品（形は共通、色ごとにまとめて描く）
 const T=THREE;const SPH=(r,x,y,z,sx,sy,sz)=>new T.SphereGeometry(r,8,6).scale(sx||1,sy||1,sz||1).translate(x,y,z);
 R.G={leg:rb3Merge([new T.BoxGeometry(.17,.42,.19).translate(0,-.21,0),new T.BoxGeometry(.2,.1,.3).translate(0,-.42,.06)]),body:new T.SphereGeometry(.36,10,8).scale(1,1.18,.88),belt:new T.CylinderGeometry(.358,.358,.09,12).scale(1,1,.88),head:new T.SphereGeometry(.27,10,8),
  eyeW:rb3Merge([SPH(.085,-.1,0,.22),SPH(.085,.1,0,.22)]),eyeP:rb3Merge([SPH(.046,-.1,0,.295,1,1,.6),SPH(.046,.1,0,.295,1,1,.6)]),
  hatCone:new T.ConeGeometry(.42,.26,10),hatDome:new T.SphereGeometry(.29,10,5,0,6.3,0,1.6),crest:new T.BoxGeometry(.06,.24,.44),
  spear:new T.BoxGeometry(.05,1,.05).translate(0,.5,0),sword:new T.BoxGeometry(.05,.72,.1).translate(0,.36,0),bow:new T.TorusGeometry(.42,.025,4,8,Math.PI).rotateZ(Math.PI/2).rotateY(Math.PI/2),gun:new T.BoxGeometry(.06,.06,1.1).translate(0,0,.35),
  shRect:new T.BoxGeometry(.5,.82,.07),shRound:new T.CylinderGeometry(.34,.34,.06,10).rotateX(Math.PI/2),shOval:new T.SphereGeometry(.3,8,6).scale(1,1.7,.25),
  hbody:new T.BoxGeometry(.46,.55,1.5).translate(0,.95,0),hneck:new T.BoxGeometry(.2,.66,.26).translate(0,.3,0),hleg:new T.BoxGeometry(.12,.7,.12).translate(0,-.35,0),
  fpole:new T.BoxGeometry(.04,1.3,.04).translate(0,.65,0),fcloth:new T.BoxGeometry(.03,.55,.36).translate(0,0,-.18),bpole:new T.BoxGeometry(.07,3.6,.07).translate(0,1.8,0),bcloth:new T.BoxGeometry(.04,1.15,.85).translate(0,0,-.43),
  arm:rb3Merge([new T.BoxGeometry(.12,.38,.12).translate(0,-.19,0),new T.SphereGeometry(.095,6,5).translate(0,-.42,0)]),hhead:new T.BoxGeometry(.17,.2,.46).translate(0,0,.2),htail:new T.BoxGeometry(.08,.5,.08).translate(0,-.25,0),litter:new T.BoxGeometry(.9,.75,1.5).translate(0,.9,0),hull:new T.BoxGeometry(1.5,.9,3.8).translate(0,.25,0),mast:new T.BoxGeometry(.14,3.6,.14).translate(0,2.2,0),sail:new T.BoxGeometry(1.8,1.6,.06).translate(0,2.6,0),arrow:new T.BoxGeometry(.04,.04,.9)};
 R.M={};{const sm=new T.InstancedMesh(new T.CircleGeometry(.5,10).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:night?.4:.26,depthWrite:false}),2300);sm.instanceMatrix.setUsage(T.DynamicDrawUsage);sm.frustumCulled=false;sm._n=0;sm._cap=2300;sm.count=0;sc.add(sm);R.M['shadow']=sm;}R.dm=new T.Object3D();R.m1=new T.Matrix4();R.m2=new T.Matrix4();R.m3=new T.Matrix4();R.m4=new T.Matrix4();R.aid=1;R.shake=0;B.corpses=[];B.arrows=[];R.P=[];
 // ---- 土ぼこり・煙・火花
 const PN=900,pg=new T.BufferGeometry();R.pp=new Float32Array(PN*3);R.pc=new Float32Array(PN*3);R.ps=new Float32Array(PN);R.pa=new Float32Array(PN);
 pg.setAttribute('position',new T.BufferAttribute(R.pp,3));pg.setAttribute('aCol',new T.BufferAttribute(R.pc,3));pg.setAttribute('aSize',new T.BufferAttribute(R.ps,1));pg.setAttribute('aAlpha',new T.BufferAttribute(R.pa,1));
 R.pmat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uS:{value:800}},vertexShader:'attribute float aSize;attribute float aAlpha;attribute vec3 aCol;varying float vA;varying vec3 vC;uniform float uS;void main(){vA=aAlpha;vC=aCol;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*uS/-mv.z;gl_Position=projectionMatrix*mv;}',fragmentShader:'varying float vA;varying vec3 vC;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vC,vA*(1.-d*2.));}'});
 R.pts=new T.Points(pg,R.pmat);R.pts.frustumCulled=false;pg.setDrawRange(0,0);sc.add(R.pts);R.PN=PN;R.sea=sea;R.dust=new T.Color(O.dust||(sea?'#e8f4fa':'#cdbd92'));
 R.resize=()=>{const r=glCanvas.getBoundingClientRect();R.W=r.width;R.H=r.height;ren.setSize(r.width,r.height,false);cam.aspect=r.width/Math.max(1,r.height);cam.updateProjectionMatrix();R.pmat.uniforms.uS.value=r.height*ren.getPixelRatio()*1.1;};R.resize();
 return R;}
function rb3Detail(g,O,sea,W,H){const R=mrand(77),zs=O.zones||[];const wet=(x,y)=>{let w=sea;for(const z of zs){if(!inPoly(x,y,z.pts))continue;if(z.k==='river'||z.k==='sea')w=true;else if(z.k==='land')w=false;}return w;};
 for(let i=0;i<2600;i++){const x=R()*100,y=R()*150,w=wet(x,y),r=(2+R()*9)*W/100;g.fillStyle=w?'rgba(255,255,255,'+(R()*.05)+')':(R()<.5?'rgba(40,50,10,'+(.03+R()*.06)+')':'rgba(255,240,180,'+(.03+R()*.05)+')');g.beginPath();g.ellipse(x*W/100,y*H/150,r,r*.6,R()*3,0,7);g.fill();}
 g.lineWidth=1;for(let i=0;i<7000;i++){const x=R()*100,y=R()*150;if(wet(x,y))continue;const px=x*W/100,py=y*H/150;g.strokeStyle=R()<.6?'rgba(50,70,20,.22)':'rgba(120,100,50,.2)';g.beginPath();g.moveTo(px,py);g.lineTo(px+(R()-.5)*3,py-2-R()*4);g.stroke();}}
function rb3Merge(gs){const T=THREE,P=[],N=[];for(const g0 of gs){const g=g0.index?g0.toNonIndexed():g0;P.push(...g.attributes.position.array);N.push(...g.attributes.normal.array);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('normal',new T.Float32BufferAttribute(N,3));return g;}
function rb3Mesh(R,geo,col,cap){const key=geo+col;let m=R.M[key];if(!m){cap=cap||(geo==='leg'||geo==='hleg'||geo==='arm'?4400:2400);const cc=new THREE.Color(col);if(geo!=='eyeW'&&geo!=='eyeP'){const h={};cc.getHSL(h);cc.setHSL(h.h,Math.min(1,h.s*1.3+.05),Math.min(.8,h.l*1.12+.03));}m=new THREE.InstancedMesh(R.G[geo],new THREE.MeshLambertMaterial({color:cc}),cap);m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;m._n=0;m._cap=cap;m.count=0;R.sc.add(m);R.M[key]=m;}return m;}
function rb3Part(R,x,y,z,life,size,col,alpha,vx,vy,vz,grow){if(R.P.length>=R.PN)R.P.shift();R.P.push({x,y,z,l:0,d:life,s:size,c:col,a:alpha,vx:vx||0,vy:vy||0,vz:vz||0,g:grow||0});}
/* 部隊ごとの装備と陣形 */
function rb3Kit(q){if(q._kit)return q._kit;const O=BT.opt,me=q.side==='me';const base={body:me?(O.meCol||'#1e2a44'):(O.foeCol||'#8a1e14'),trim:me?(O.meTrim||'#e8c060'):(O.foeTrim||'#f0e0c0')};
 const byT={yari:{w:'spear',len:2.8,fm:'line'},yumi:{w:'bow',fm:'loose'},kiba:{w:'spear',len:3.1,fm:'wedge',mount:1},gen:{w:'spear',len:2.6,fm:'square'},gun:{w:'gun',fm:'loose'},ship:{ship:1,fm:'ship'}}[q.type]||{w:'spear',len:2.8,fm:'line'};
 const sk=(O.kits&&O.kits[q.side])||{};const M=MONS[q.mon||(me?S.meMon:S.foeMon)]||{};
 const K=Object.assign({hat:'cone',skin:'#dcae88',horse:'#6a4424',leash:3.5},base,byT,sk.all||{},sk[q.type]||{},q.kit||{});if(q.boat){K.ship=1;K.fm='ship';}
 if(!K.hatCol)K.hatCol=K.trim;if(!K.shieldCol)K.shieldCol=K.trim;if(!K.banner)K.banner=M.bg||K.trim;q._kit=K;return K;}
function rb3Slot(q,K,i,k,a,o){const fm=q.fm||K.fm;let f=0,l=0;
 if(fm==='square'){const c=Math.ceil(Math.sqrt(k)),r=Math.floor(i/c),rows=Math.ceil(k/c);l=(i%c-(c-1)/2)*.98;f=((rows-1)/2-r)*.98;}
 else if(fm==='loose'){const c=Math.max(3,Math.ceil(Math.sqrt(k*3.5))),r=Math.floor(i/c),rows=Math.ceil(k/c);l=(i%c-(c-1)/2)*1.5+(r%2?.75:0);f=((rows-1)/2-r)*1.6;}
 else if(fm==='wedge'){const r=Math.floor(Math.sqrt(i)),j=i-r*r,Rr=Math.floor(Math.sqrt(Math.max(0,k-1)));l=(j-r)*1.5;f=(Rr/2-r)*1.7;}
 else if(fm==='mob'){const c=Math.ceil(Math.sqrt(k*1.4)),r=Math.floor(i/c),rows=Math.ceil(k/c);l=(i%c-(c-1)/2)*1.35+a.jx*.9;f=((rows-1)/2-r)*1.35+a.jy*.9;}
 else if(fm==='circle'){let m=1,left=k,rings=[];while(left>0){const n=Math.min(left,Math.round(6.28*(m*.95+.5)/.95));rings.push(n);left-=n;m++;}let idx=i,ri=rings.length-1;while(ri>0&&idx>=rings[ri]){idx-=rings[ri];ri--;}const rad=(ri+1)*.95+.5,an=idx/rings[ri]*6.283;l=Math.sin(an)*rad;f=Math.cos(an)*rad;a.of=an;}
 else if(fm==='column'){const c=5,r=Math.floor(i/c),rows=Math.ceil(k/c);l=(i%c-(c-1)/2)*1.05;f=((rows-1)/2-r)*1.2;}
 else if(fm==='ship'){const c=Math.max(1,Math.round(Math.sqrt(k*1.7))),r=Math.floor(i/c),rows=Math.ceil(k/c);l=(i%c-(c-1)/2)*4.4;f=((rows-1)/2-r)*4.6;}
 else{const c=Math.max(3,Math.ceil(Math.sqrt(k*3))),r=Math.floor(i/c),rows=Math.ceil(k/c);l=(i%c-(c-1)/2)*1.05;f=((rows-1)/2-r)*1.15;const half=(c-1)/2*1.05||1,u=l/half;if(fm==='crescent')f+=u*u*4.5;if(fm==='bulge')f+=(1-u*u)*4.5;}
 if(fm!=='circle')a.of=null;const cf=Math.cos(q.vf),sf=Math.sin(q.vf);o[0]=q.x+f*cf-l*sf;o[1]=q.y+f*sf+l*cf;}
function rb3Kill(B,q,a){a.dead=true;const K=rb3Kit(q);const c={x:a.x,y:a.y,f:a.f,h:a.h||0,vh:a.vh||0,kvx:a.kvx||0,kvy:a.kvy||0,K,mt:a.mt,dr:Math.random()<.5?1:-1,dt:0,sc:a.sc,big:a.big,v:a.v,ph:a.ph,ship:K.ship,lit:a.lit,r:a.r,dp:a.mt||Math.random()<.45?0:(Math.random()<.5?1:-1)};
 if(!a.mt&&!a.lit&&!K.ship){// 人形のように吹っ飛ぶ
  let ux=0,uy=0,hard=a.kb>0;if(a.kb>0){ux=a.kvx;uy=a.kvy;}else if(a.e&&!a.e.dead){ux=a.x-a.e.x;uy=a.y-a.e.y;hard=hard||a.e.mt||(a.e.q&&a.e.q.charge>0);}else if(q.melee&&q.melee.length){ux=a.x-q.melee[0].x;uy=a.y-q.melee[0].y;}else{const t=Math.random()*6.283;ux=Math.cos(t);uy=Math.sin(t);}
  const d=Math.hypot(ux,uy)||1;ux/=d;uy/=d;const big=a.gen||a.boom||Math.random()<(hard?.65:.2),hp=a.boom?8+Math.random()*9:big?6+Math.random()*7:1.8+Math.random()*3,sp=(big?1.8:1)*14;
  c.rag=1;c.rx=0;c.rz=0;c.bn=0;c.kvx=ux*hp+(Math.random()-.5)*2;c.kvy=uy*hp+(Math.random()-.5)*2;c.vh=a.boom?9+Math.random()*7:big?7+Math.random()*5:2.5+Math.random()*3;c.h=Math.max(c.h,.02);c.avx=(Math.random()-.5)*sp;c.avz=(Math.random()-.5)*sp;
  if(big&&B.g3){B.g3.shake=Math.min(.7,(B.g3.shake||0)+.05);}}
 B.corpses.push(c);try{if(Math.random()<.3)SND.die();}catch(e){}if(B.corpses.length>520)B.corpses.shift();}
/* 逆転の時：部隊の兵をまとめて吹き飛ばす */
function rb3Blast(B,q,frac,cx,cy){if(!B.g3||!q.ag||!q.ag.length)return;const R=B.g3,ag=q.ag;let n=Math.ceil(ag.length*frac);
 while(n-->0&&ag.length){const i=Math.floor(Math.random()*ag.length),a=ag[i];let ux=a.x-cx,uy=a.y-cy;const d=Math.hypot(ux,uy)||1;a.boom=1;a.kb=1;a.kvx=ux/d;a.kvy=uy/d;a.e=null;rb3Kill(B,q,a);ag[i]=ag[ag.length-1];ag.pop();}
 R.shake=Math.min(1,(R.shake||0)+.3);const d=R.dust;for(let i=0;i<6;i++)rb3Part(R,q.x-50+(Math.random()-.5)*8,rb3H(q.x,q.y)+.5,q.y-75+(Math.random()-.5)*8,1.2,4,[d.r,d.g,d.b],.5,(Math.random()-.5)*3,2,(Math.random()-.5)*3,3);
 rb3Part(R,q.x-50,rb3H(q.x,q.y)+2,q.y-75,.25,10,[1,.9,.55],.9,0,0,0,1);}
function rb3Ang(a,b,k){let d=b-a;while(d>Math.PI)d-=6.2832;while(d<-Math.PI)d+=6.2832;return a+d*Math.min(1,k);}
/* 兵ひとりずつの動き：持ち場へ歩く、敵に当たれば押し合う、突撃されれば吹き飛ぶ */
function rb3Agents(B,dt){const R=B.g3,O=B.opt;R.fr=(R.fr||0)+1;R.engN=0;const per0=O.per||100,act=[];let tot=0;
 for(const q of B.sq){if(!q.alive||(q.side==='foe'&&q.hidden)){if(q.ag){if(!q.alive&&!q.routed)q.ag.forEach(a=>rb3Kill(B,q,a));q.ag=null;}continue;}
  const K=rb3Kit(q);if(!B.u0){const t0=B.sq.filter(o=>!rb3Kit(o).ship).reduce((s,o)=>s+o.n0,0);B.u0=Math.max(1,t0/950);}q._w=K.ship?clamp(Math.ceil(q.n/(q.per||per0)*.6),1,12):clamp(Math.ceil(q.n/B.u0),q.side==='me'?4:5,240);tot+=q._w;act.push(q);}
 const scl=tot>1500?1500/tot:1,o=[0,0];
 for(const q of act){const K=q._kit,want=Math.max(K.ship?1:4,Math.round(q._w*scl));if(q.vf==null)q.vf=q.face;
  let tf=q.face;if(q.melee&&q.melee.length&&!q.routed)tf=Math.atan2(q.melee[0].y-q.y,q.melee[0].x-q.x);q.vf=rb3Ang(q.vf,tf,dt*3.5);
  if(q._px!=null&&dt>0)q._sp=Math.hypot(q.x-q._px,q.y-q._py)/dt;q._px=q.x;q._py=q.y;
  if(!q.ag)q.ag=[];const ag=q.ag;
  while(ag.length<want){const a={q,id:R.aid++,f:q.vf,ph:Math.random()*6,sp:0,h:0,vh:0,kb:0,kvx:0,kvy:0,lu:0,at:Math.random(),r:Math.random(),sc:.9+Math.random()*.2,v:Math.random()<.45,jx:Math.random()-.5,jy:Math.random()-.5,e:null,cr:0};
   rb3Slot(q,K,ag.length,want,a,o);a.x=o[0];a.y=o[1];a.mt=!!K.mount||(q.gen&&ag.length===0&&!K.litter&&!K.ship);if(q.gen&&ag.length===0){a.big=1.25;a.lit=!!K.litter;a.gen=1;}ag.push(a);}
  if(ag.length>want&&!q.routed){let nk=Math.min(ag.length-want,Math.max(1,Math.ceil((ag.length-want)*.25)));while(nk-->0&&ag.length>1){let bi=-1,bs=-1;for(let i=q.gen?1:0;i<ag.length;i++){const a=ag[i];let s=Math.random()*.5;if(a.kb>0)s+=3;if(a.en)s+=2;else if(i<ag.length*.4)s+=.6;if(s>bs){bs=s;bi=i;}}
    if(bi<0)break;rb3Kill(B,q,ag[bi]);ag[bi]=ag[ag.length-1];ag.pop();}}}
 // 場所の表（近くの兵をすばやく探す）
 const grid=new Map(),CS=1.7,key=(cx,cy)=>cx*4096+cy;
 for(const q of act)for(const a of q.ag){a.cx=Math.floor(a.x/CS);a.cy=Math.floor(a.y/CS);const k=key(a.cx,a.cy);let c=grid.get(k);if(!c){c=[];grid.set(k,c);}c.push(a);}
 const won=B.over&&B.won!=null;
 for(const q of act){const K=q._kit,ag=q.ag,k=ag.length,fighting=!!(q.melee&&q.melee.length)||q.charge>0,rest=q.dis>.45&&!fighting&&!q.moving;
  const baseSp=(K.mount?13:K.ship?6:7.5),maxSp=Math.max(baseSp,(q._sp||0)*1.35),leash=K.leash*(q.charge>0?1.6:1);
  for(let i=0;i<k;i++){const a=ag[i];rb3Slot(q,K,i,k,a,o);let gx=o[0],gy=o[1];
   if(q.routed){gx=q.x+a.jx*14;gy=q.y+a.jy*10+(q.side==='me'?6:-6);a.e=null;}
   else{if(fighting&&(R.fr+a.id)%7===0){let best=null,bd=5.2;for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){const c=grid.get(key(a.cx+dx,a.cy+dy));if(!c)continue;for(const b of c){if(b.q.side===q.side||b.q.routed)continue;const d=Math.hypot(b.x-a.x,b.y-a.y);if(d<bd){bd=d;best=b;}}}a.e=best;}
    if(a.e&&(a.e.dead||!fighting))a.e=null;
    if(a.e&&K.w!=='bow'&&K.w!=='gun'||a.e&&q.melee){const ex=a.e.x-a.x,ey=a.e.y-a.y,ed=Math.hypot(ex,ey)||1,rr=K.ship?3.4:(K.w==='spear'&&K.len>3.5?1.5:1.0);let tx=a.e.x-ex/ed*rr,ty=a.e.y-ey/ed*rr;const lx=tx-gx,ly=ty-gy,ld=Math.hypot(lx,ly);if(ld>leash){tx=gx+lx/ld*leash;ty=gy+ly/ld*leash;}gx=tx;gy=ty;a.en=ed<rr+.7;}else a.en=false;}
   let vx=(gx-a.x)*5,vy=(gy-a.y)*5;const vd=Math.hypot(vx,vy),ms=q.routed?9.5:maxSp*(vd>30?1.5:1);if(vd>ms){vx*=ms/vd;vy*=ms/vd;}
   if(a.kb>0){a.kb-=dt;a.x+=a.kvx*dt;a.y+=a.kvy*dt;a.kvx*=.92;a.kvy*=.92;vx*=.15;vy*=.15;}
   if(a.h>0||a.vh>0){a.h+=a.vh*dt;a.vh-=24*dt;if(a.h<=0){a.h=0;a.vh=0;}}
   a.x+=vx*dt;a.y+=vy*dt;const sp=Math.hypot(vx,vy);a.sp+=(sp-a.sp)*.2;a.ph+=dt*(K.mount?1.1:1.9)*Math.min(sp,9);
   let tf=q.vf;if(a.en&&a.e)tf=Math.atan2(a.e.y-a.y,a.e.x-a.x);else if(sp>1.2)tf=Math.atan2(vy,vx);else if(a.of!=null)tf=q.vf+a.of;a.f=rb3Ang(a.f,tf,dt*8);
   if(a.en){R.engN++;const p=a.lu;a.at+=dt*(1.6+a.r*1.4);const sn=Math.sin(a.at*6.283);a.lu=sn>0?sn*sn:0;if(p<.85&&a.lu>=.85&&a.e)a.e.rc=1;if(p<.85&&a.lu>=.85&&a.e&&Math.random()<.35){const mx=(a.x+a.e.x)/2-50,mz=(a.y+a.e.y)/2-75;rb3Part(R,mx,rb3H(a.x,a.y)+1.3,mz,.16,.9,[1,.92,.6],.9,0,1,0);}}else a.lu*=.85;
   if(a.rc)a.rc*=.86;a.cr+=((rest||(q.hidden&&q.side==='me')?1:0)-a.cr)*.1;
   if(won&&((q.side==='me')===B.won)&&!q.routed){a.h=Math.max(0,Math.sin(performance.now()*.011+a.r*9))*.55;a.lu=.0;a.cheer=1;}
   if(sp>3.5&&dt>0&&Math.random()<dt*(K.mount?4:K.ship?3:.8)){const d=R.dust;rb3Part(R,a.x-50,rb3H(a.x,a.y)+.2,a.y-75,K.ship?1.1:.9,K.mount?2.6:1.8,[d.r,d.g,d.b],K.ship?.5:.32,0,.6,0,2);}}}
 // ぶつかり：兵は重ならない。突撃を受けた兵は吹き飛ぶ
 for(const q of act)for(const a of q.ag){const Ka=q._kit,ra=Ka.ship?1.7:a.mt?.62:.42;for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const c=grid.get(key(a.cx+dx,a.cy+dy));if(!c)continue;for(const b of c){if(b.id<=a.id||b.dead)continue;
    const Kb=b.q._kit,rb=Kb.ship?1.7:b.mt?.62:.42,foe=b.q.side!==q.side,md=ra+rb+(foe?.12:0);let ux=b.x-a.x,uy=b.y-a.y,d=Math.hypot(ux,uy);if(d>=md)continue;if(d<.001){ux=Math.random()-.5;uy=Math.random()-.5;d=Math.hypot(ux,uy);}ux/=d;uy/=d;const ov=(md-d)*.5;
    const wa=a.kb>0?.2:1,wb=b.kb>0?.2:1,cf=foe?1.05:.9;a.x-=ux*ov*wb/(wa+wb)*2*cf;a.y-=uy*ov*wb/(wa+wb)*2*cf;b.x+=ux*ov*wa/(wa+wb)*2*cf;b.y+=uy*ov*wa/(wa+wb)*2*cf;
    if(foe&&!q.routed&&!b.q.routed){const ca=(q.charge>0&&a.sp>3)||(a.mt&&a.sp>6.5),cb=(b.q.charge>0&&b.sp>3)||(b.mt&&b.sp>6.5);
     if(ca&&!cb&&b.kb<=0&&!Kb.ship)rb3Knock(R,a,b,ux,uy);else if(cb&&!ca&&a.kb<=0&&!Ka.ship)rb3Knock(R,b,a,-ux,-uy);}}}}
 // 倒れた兵・矢・煙
 const wr=v=>((v+Math.PI)%6.2832+6.2832)%6.2832-Math.PI,nr=(v,k)=>Math.round((v-k)/Math.PI)*Math.PI+k;
 for(const c of B.corpses){if(!c.rag||dt<=0)continue;c.dt+=dt;
  if(c.h>0||c.vh>0){c.h+=c.vh*dt;c.vh-=22*dt;c.x+=c.kvx*dt;c.y+=c.kvy*dt;c.rx+=c.avx*dt;c.rz+=c.avz*dt;
   if(c.h<=0){c.h=0;if(c.vh<-3.5&&c.bn<2){c.vh=-c.vh*.36;c.bn++;c.avx*=.55;c.avz*=.55;c.kvx*=.6;c.kvy*=.6;const d=R.dust;rb3Part(R,c.x-50,rb3H(c.x,c.y)+.3,c.y-75,.6,1.6,[d.r,d.g,d.b],.4,0,1,0,2);}else{c.vh=0;}}}
  else{const fr=Math.exp(-dt*5);c.x+=c.kvx*dt;c.y+=c.kvy*dt;c.kvx*=fr;c.kvy*=fr;
   if(!c.tg){c.rx=wr(c.rx);c.rz=wr(c.rz);c.tg=Math.abs(Math.sin(c.rx))>Math.abs(Math.sin(c.rz))?[nr(c.rx,Math.PI/2),nr(c.rz,0)]:[nr(c.rx,0),nr(c.rz,Math.PI/2)];}
   const k=Math.min(1,dt*7);c.rx+=(c.tg[0]-c.rx)*k;c.rz+=(c.tg[1]-c.rz)*k;}}
 for(const c of B.corpses){if(c.rag)continue;c.dt+=dt;if(c.h>0||c.vh>0){c.h+=c.vh*dt;c.vh-=24*dt;c.x+=c.kvx*dt;c.y+=c.kvy*dt;if(c.h<=0){c.h=0;c.vh=0;c.kvx=c.kvy=0;}}}
 for(const e of (B.vfx||[])){const q=e.q,t=e.t;if(!q.ag||!q.ag.length)continue;const K=q._kit;const n=K.w==='bow'?Math.min(9,q.ag.length):Math.min(5,q.ag.length);
  for(let i=0;i<n;i++){const a=q.ag[Math.floor(Math.random()*q.ag.length)];const h0=rb3H(a.x,a.y)+1.4;
   if(K.w==='bow'){const tx=t.x+(Math.random()-.5)*rbRad(t)*1.6,ty=t.y+(Math.random()-.5)*rbRad(t)*1.6;B.arrows.push({x0:a.x,y0:a.y,h0,x1:tx,y1:ty,h1:rb3H(tx,ty)+.2,t:-Math.random()*.2,d:.75+Math.random()*.25});}
   else{const fx=Math.cos(a.f),fy=Math.sin(a.f);rb3Part(R,a.x-50+fx*.9,h0,a.y-75+fy*.9,K.ship?1.6:1.0,K.ship?5:2.4,[.92,.92,.9],.6,fx*1.5,.8,fy*1.5,3);rb3Part(R,a.x-50+fx*.8,h0,a.y-75+fy*.8,.09,K.ship?3:1.5,[1,.85,.4],1,0,0,0);
    if(K.ship&&i<2){const tx=t.x+(Math.random()-.5)*6,ty=t.y+(Math.random()-.5)*6;rb3Part(R,tx-50,.3,ty-75,.7,3.2,[1,1,1],.7,0,3,0,2);}}}}
 if(dt>0&&O.fires)for(const f of O.fires){for(let i=0;i<2;i++)rb3Part(R,f[0]-50+(Math.random()-.5)*5,rb3H(f[0],f[1])+1+Math.random()*2,f[1]-75+(Math.random()-.5)*5,.7+Math.random()*.5,4+Math.random()*3,[1,.5+Math.random()*.35,.15],.75,(Math.random()-.5),4,(Math.random()-.5),1.5);if(Math.random()<.3)rb3Part(R,f[0]-50,rb3H(f[0],f[1])+5,f[1]-75,2.5,7,[.2,.2,.2],.35,1,3,0,2);}
 if(dt>0&&R.engN&&Math.random()<R.engN*dt*.03)SND.clash();
 if(B.amb){try{B.amb.g.gain.setTargetAtTime(Math.min(.22,R.engN/260*.22)*(B.ask?.4:1)*(B.over?.3:1),SND.ctx.currentTime,.35);}catch(e){}}
 if(B.vfx)B.vfx.length=0;if(B.arrows.length>420)B.arrows.splice(0,B.arrows.length-420);
 for(const a of B.arrows)a.t+=dt;B.arrows=B.arrows.filter(a=>a.t<a.d+7);
 for(const p of R.P){p.l+=dt>0?dt:0.016;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;}R.P=R.P.filter(p=>p.l<p.d);}
function rb3Knock(R,a,b,ux,uy){const big=a.mt,f=big?9:4.2;b.kb=big?.75:.45;b.kvx=ux*f+(Math.random()-.5)*3;b.kvy=uy*f+(Math.random()-.5)*3;b.vh=big?5.5+Math.random()*2:2.4;b.h=Math.max(b.h,.05);R.shake=Math.min(.7,R.shake+(big?.07:.02));
 const d=R.dust;rb3Part(R,b.x-50,rb3H(b.x,b.y)+.4,b.y-75,.7,big?3.2:2,[d.r,d.g,d.b],.45,ux*2,1.5,uy*2,3);if(big){SND.horse();}SND.clash();}
function rb3Render(B){const R=B.g3,O=B.opt,t=B.time,now=performance.now();if(!R.W)R.resize();rb3Agents(B,B.vdt||0);
 // カメラ：戦っている所を追う。総大将が討たれた時は寄る
 const act=B.sq.filter(q=>q.alive&&!q.routed&&!(q.side==='foe'&&q.hidden));const fight=act.filter(q=>q.melee&&q.melee.length);const use=fight.length?fight:act;
 let cx=50,cy=75,rate=.03;if(use.length){cx=use.reduce((s,q)=>s+q.x,0)/use.length;cy=use.reduce((s,q)=>s+q.y,0)/use.length;}
 let spread=0;use.forEach(q=>{spread=Math.max(spread,Math.hypot(q.x-cx,(q.y-cy)*.8));});let want=clamp(spread*1.05+28,36,105);
 const dtR=Math.min(.1,(now-(R.lt||now))/1000);R.lt=now;
 const chg=B.sq.find(q=>q.side==='me'&&rbAlive(q)&&q.charge>3.2);if(chg&&!(B.focus&&now<B.focus.until)&&now-(R.lastCh||0)>7000){R.lastCh=now;B.focus={x:chg.x,y:chg.y,until:now+1500,w:36,q:chg};}
 if(B.ask){const g0=B.sq.find(q=>q.side==='me'&&q.gen&&q.alive);if(g0){cx=(cx+g0.x)/2;cy=(cy+g0.y)/2;}want=Math.min(want,58);rate=.05;}
 if(B.focus&&now<B.focus.until){const f=B.focus;cx=f.q&&f.q.alive?f.q.x:f.x;cy=f.q&&f.q.alive?f.q.y:f.y;want=f.w||24;rate=.09;}
 R.tx+=(cx-50-R.tx)*rate;R.tz+=(cy-75-R.tz)*rate;R.dist+=(want-R.dist)*(rate*.8);R.oa+=dtR*(B.ask?.28:.06);R.orb=Math.sin(R.oa)*.6;R.shake*=.88;
 const cam=R.cam,sh=R.shake;cam.position.set(R.tx+Math.sin(R.orb)*R.dist*.66+(Math.random()-.5)*sh*2.5,R.dist*.36+2.5+(Math.random()-.5)*sh*2.5,R.tz+Math.cos(R.orb)*R.dist*.82);cam.lookAt(R.tx,1.6,R.tz-3);
 // 天気
 const ri=O.rain?clamp(O.rain(B),0,1):0;R.rain.visible=ri>.02;if(R.rain.visible){const rp=R.rp;for(let i=0;i<R.RN;i++){let x=rp[i*6],y=rp[i*6+1]-dtR*60,z=rp[i*6+2];x-=dtR*10;if(y<0){y=34+Math.random()*10;x=R.tx+(Math.random()-.5)*130;z=R.tz+(Math.random()-.5)*130;}rp[i*6]=x;rp[i*6+1]=y;rp[i*6+2]=z;rp[i*6+3]=x+.5;rp[i*6+4]=y+3;rp[i*6+5]=z;}R.rain.geometry.attributes.position.needsUpdate=true;R.rain.material.opacity=.55*ri;}
 if(O.rain){const a=R.MD,b=R.MDay,k=1-ri,c1=new THREE.Color(a.top).lerp(new THREE.Color(b.top),k),c2=new THREE.Color(a.hor).lerp(new THREE.Color(b.hor),k);R.skyU.top.value.copy(c1);R.skyU.hor.value.copy(c2);R.sc.fog.color.copy(c2);R.sc.background.copy(c2);R.sun.intensity=a.si+(b.si-a.si)*k;}
 if(R.fireL)R.fireL.intensity=1.3+Math.sin(now*.02)*.3+Math.random()*.3;R.waterU.t.value=now/1000;
 for(const k in R.M)R.M[k]._n=0;
 const dm=R.dm,root=R.m1,loc=R.m2,out=R.m3,rid=R.m4;
 const put=(geo,col,M)=>{const m=rb3Mesh(R,geo,col);if(m._n<m._cap)m.setMatrixAt(m._n++,M);};
 const part=(base,geo,col,x,y,z,rx,sy)=>{loc.makeRotationX(rx||0);if(sy){const e=loc.elements;e[4]*=sy;e[5]*=sy;e[6]*=sy;}loc.setPosition(x,y,z);out.multiplyMatrices(base,loc);put(geo,col,out);};
 const man=(a,q,K,dead)=>{const fall=dead?Math.min(1,a.dt/.3):0,S0=1.15*(a.sc||1)*(a.big||1),cr=1-(a.cr||0)*.3;
  const yaw=Math.atan2(Math.cos(a.f),Math.sin(a.f)),mv=dead?0:Math.min(1,a.sp/3),sw=Math.sin(a.ph)*mv*.85,lu=dead?0:a.lu,Y=rb3H(a.x,a.y)+(a.h||0);
  if(K.ship){dm.position.set(a.x-50,Math.max(Y,0)+.1+Math.sin(t*1.5+a.x)*.1-fall*Math.min(2.6,a.dt*.5),a.y-75);dm.rotation.set(fall*.25,yaw,fall*.9*a.dr,'YXZ');dm.scale.set(1,1,1);dm.updateMatrix();root.copy(dm.matrix);
   put('hull','#5a3a1e',root);put('mast','#3a2a18',root);put('sail',K.banner,root);return;}
  if(!dead||a.dt<22){dm.position.set(a.x-50,rb3H(a.x,a.y)+.06,a.y-75);dm.rotation.set(0,0,0);const ss=(a.mt?1.75:1.1)*(dead?1.3:1)/(1+(a.h||0)*.25);dm.scale.set(ss,1,ss);dm.updateMatrix();put('shadow','',dm.matrix);}
  const eng=!dead&&(a.en||(q.charge>0&&a.sp>3)||(a.of!=null&&!q.moving)),dp=dead?(a.dp||0):0,air=(a.h||0)>.05;
  if(dead&&a.rag){// 人形：体の真ん中を軸に回る
   const tilt=1-Math.abs(Math.cos(a.rx)*Math.cos(a.rz)),hc=S0*(.9-.52*Math.min(1,tilt));dm.position.set(a.x-50,Y+hc,a.y-75);dm.rotation.set(a.rx,yaw,a.rz,'YXZ');dm.scale.set(S0,S0,S0);dm.updateMatrix();loc.makeTranslation(0,-.9,0);root.multiplyMatrices(dm.matrix,loc);}
  else{const wob=dead?0:Math.sin(a.ph)*.16*mv+Math.sin(t*1.9+a.r*9)*.05+(air?Math.sin(t*9+a.r*5)*.35:0);
   dm.position.set(a.x-50,Y+(dead?0:Math.abs(Math.sin(a.ph))*mv*(a.mt?.16:.09)),a.y-75);dm.rotation.set(dead?fall*1.45*dp:(a.mt?Math.sin(a.ph)*mv*.08:lu*.32+mv*.18-(a.rc||0)*.75-(air?.45:0)),yaw,dp?0:dead?fall*1.5*(a.dr||1):wob,'YXZ');dm.scale.set(S0,S0*(a.mt?1:cr),S0);dm.updateMatrix();root.copy(dm.matrix);}
  let base=root;
  if(a.lit){part(root,'litter','#8a1a14',0,0,0);loc.makeTranslation(0,.55,0);rid.multiplyMatrices(root,loc);base=rid;}
  else if(a.mt){part(root,'hbody',K.horse,0,0,0);part(root,'hneck',K.horse,0,1.12,.68,.55);part(root,'hhead',K.horse,0,1.62,.94,.5);part(root,'htail','#2a1a10',0,1.2,-.74,-.45);const g=Math.sin(a.ph)*mv*.9;part(root,'hleg','#3a2414',-.16,.72,.56,g);part(root,'hleg','#3a2414',.16,.72,.56,g*.8);part(root,'hleg','#3a2414',-.16,.72,-.56,-g);part(root,'hleg','#3a2414',.16,.72,-.56,-g*.8);
   loc.makeTranslation(0,.72,0);rid.multiplyMatrices(root,loc);base=rid;}
  else{const fl=dead&&a.rag&&(a.h||0)>0?Math.sin(a.dt*19+a.r*7)*.9:0;part(base,'leg','#2a2420',-.15,.5,0,sw+fl);part(base,'leg','#2a2420',.15,.5,0,-sw-fl);}
  const bc=a.v&&K.body2?K.body2:K.body,hb=dead?0:Math.abs(Math.cos(a.ph))*mv*.05,ht=dead?0:-(a.rc||0)*.35+Math.sin(t*2.3+a.r*7)*.06;
  part(base,'body',bc,0,.9,0);part(base,'belt',K.trim,0,.76,0);part(base,'head',K.skin,0,1.56+hb,0,ht);part(base,'eyeW','#ffffff',0,1.6+hb,0,ht);part(base,'eyeP','#111111',0,1.6+hb,0,ht);
  if(!K.ship){const flail=dead?(a.rag&&(a.h||0)>0?Math.sin(a.dt*17+a.r*9)*2.2-1.2:-.25):null;
   part(base,'arm',bc,.42,1.18,0,dead?flail:a.cheer?-2.9+Math.sin(t*14+a.r*9)*.4:eng?-(1.1+lu*.9):K.w==='gun'&&q&&q.tgt?-1.4:-sw*.9);
   part(base,'arm',bc,-.42,1.18,0,dead?-flail:K.shield?-.9-(a.rc||0)*.8:K.w==='bow'||(K.w==='gun'&&q&&q.tgt)?-1.4:a.cheer?-2.9+Math.cos(t*14+a.r*9)*.4:sw*.9);}
  const hc=a.gen?'#f1cf72':K.hatCol;if(K.hat==='cone')part(base,'hatCone',hc,0,1.86+hb,0,ht);else if(K.hat==='dome'||K.hat==='crest'){part(base,'hatDome',hc,0,1.62+hb,0,ht);if(K.hat==='crest'||a.gen)part(base,'crest',a.gen?'#b8281c':K.trim,0,1.96+hb,0,ht);}
  if(K.shield)part(base,K.shield==='rect'?'shRect':K.shield==='oval'?'shOval':'shRound',K.shieldCol,-.48,.98,.26);
  if(K.w==='spear'){const th=dead?1.5:a.cheer?-.1:eng?1.3:.14,len=K.len||2.8,hz=.16+lu*.65,py=1.0-Math.cos(th)*len*.3,pz=hz-Math.sin(th)*len*.3;part(base,'spear','#3a2a18',.42,py,pz,th,len);}
  else if(K.w==='sword')part(base,'sword','#c8c8d0',.44,.92,.18,dead?1.5:a.cheer?-.2:eng?-.7+lu*2.3:.25);
  else if(K.w==='bow')part(base,'bow','#4a3218',-.42,1.0,.3);
  else if(K.w==='gun')part(base,'gun','#3a2a18',.26,1.18,.14,q&&q.tgt&&!dead?0:-.9);
  if(K.backFlag&&!a.mt&&a.id%2===0&&!dead){part(base,'fpole','#2a1a0c',0,1.05,-.34);part(base,'fcloth',K.backFlag,0,2.05,-.34);}
  if(a.std&&!dead){part(base,'bpole','#2a1a0c',-.42,0,-.1);loc.makeRotationY(Math.sin(t*3+a.r*6)*.35);loc.setPosition(-.42,3.0,-.1);out.multiplyMatrices(base,loc);put('bcloth',K.banner,out);}};
 for(const q of B.sq){if(!q.ag)continue;const K=q._kit,ag=q.ag,si=q.gen?0:Math.min(ag.length-1,2);for(let i=0;i<ag.length;i++){const a=ag[i];a.std=i===si&&!K.ship;man(a,q,K,false);}}
 for(const c of B.corpses){if(c.dt>26)continue;man(c,null,c.K,true);}
 // 矢
 for(const a of B.arrows){const k=clamp(a.t/a.d,0,1);if(a.t<0)continue;const x=a.x0+(a.x1-a.x0)*k,y=a.y0+(a.y1-a.y0)*k,arc=Math.sin(k*Math.PI)*7,h=a.h0+(a.h1-a.h0)*k+arc;
  const dxx=a.x1-a.x0,dyy=a.y1-a.y0,hd=Math.hypot(dxx,dyy)||1,vy=k>=1?-.9*hd:(a.h1-a.h0)+Math.cos(k*Math.PI)*7*Math.PI;dm.position.set(x-50,h,y-75);dm.rotation.set(-Math.atan2(vy,hd),Math.atan2(dxx,dyy),0,'YXZ');dm.scale.set(1,1,1);dm.updateMatrix();put('arrow','#2a2018',dm.matrix);}
 for(const k in R.M){const m=R.M[k];m.count=m._n;m.instanceMatrix.updateRange.count=m._n*16;m.instanceMatrix.needsUpdate=true;}
 // 煙
 const n=R.P.length,pp=R.pp,pc=R.pc,ps=R.ps,pa=R.pa;for(let i=0;i<n;i++){const p=R.P[i],u=p.l/p.d;pp[i*3]=p.x;pp[i*3+1]=p.y;pp[i*3+2]=p.z;pc[i*3]=p.c[0];pc[i*3+1]=p.c[1];pc[i*3+2]=p.c[2];ps[i]=p.s*(1+u*p.g);pa[i]=p.a*(1-u);}
 const g=R.pts.geometry;g.setDrawRange(0,n);g.attributes.position.needsUpdate=true;g.attributes.aCol.needsUpdate=true;g.attributes.aSize.needsUpdate=true;g.attributes.aAlpha.needsUpdate=true;
 R.ren.render(R.sc,cam);}
