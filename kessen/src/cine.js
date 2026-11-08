/* ================= 鑑賞を映画のように：字幕・黒帯・カット割り・名場面の一騎打ち ================= */
// その戦の名場面の一騎打ち（こちら, 敵）
const CINE_DUEL={'黄巾討伐':['guan','chengyuanzhi'],'汜水関':['guan','huax'],'虎牢関':['zhangf','lubu'],'神亭':['suns','tsc'],'濮陽':['dianw','lubu'],'白馬':['guan','yanl'],
 '五関':['guan','kongxiu'],'古城':['guan','caiyang'],'博望坡':['zhaoy','xhd'],'長坂':['zhaoy','zhangh'],'潼関':['xuc','mac'],'巴郡':['zhangf','yanyan'],'葭萌関':['zhangf','mac'],
 '定軍山':['huangz','xhy'],'樊城':['guan','pangd'],'猇亭':['guanxing','panzhang'],'盤蛇谷':['weiy','wutugu'],'鳳鳴山':['zhaoy','hande']};
// 鑑賞では、史実（演義）で実際にあった一騎打ちだけが起こる
function histPair(a,b){const w=RUN&&RUN.w;const pr=w&&CINE_DUEL[w.n];if(!pr||!a||!b)return false;const ids=[a.hero,b.hero];return ids.indexOf(pr[0])>=0&&ids.indexOf(pr[1])>=0;}
const _maybeDuelH=maybeDuel;maybeDuel=function(a,b,forced){if(BT&&BT.watch){if(BT.histDuel||!histPair(a,b))return false;const r=_maybeDuelH(a,b,forced);if(r)BT.histDuel=1;return r;}return _maybeDuelH(a,b,forced);};
const CINE={sub:null,cut:null,subT:null};
function cineSub(txt,sec){if(!BT||!BT.watch)return;let e=CINE.sub;if(!e||!e.isConnected){e=document.createElement('div');e.className='cine-sub';document.getElementById('stage').appendChild(e);CINE.sub=e;}
  e.innerHTML=txt;e.classList.remove('go');void e.offsetWidth;e.classList.add('go');clearTimeout(CINE.subT);CINE.subT=setTimeout(function(){e.classList.remove('go');},(sec||4.5)*1000);}
function cineCut(){let e=CINE.cut;if(!e||!e.isConnected){e=document.createElement('div');e.className='cine-cut';document.getElementById('stage').appendChild(e);CINE.cut=e;}e.classList.remove('go');void e.offsetWidth;e.classList.add('go');}
function cineStart(){
  document.body.classList.add('cine');const w=RUN.w;
  cineSub('<small>'+w.y+'年　'+esc(w.p)+'</small><b>'+esc(w.n)+'</b>',5.5);
  setTimeout(function(){if(BT&&BT.watch&&!BT.over)cineSub(esc(w.d),5);},6000);
  // 名場面の一騎打ちを確かに起こす
  const pair=CINE_DUEL[w.n];let tries=0;
  const tryDuel=function(){if(!BT||!BT.watch||BT.over)return;if(BT.paused||document.getElementById('duelIntro')){setTimeout(tryDuel,1500);return;}
    let a=pair&&heroUnit(0,pair[0]),b=pair&&heroUnit(1,pair[1]);
    if(!a||!b)return;if((BT.duels||[]).length){return;}
    camEvent('skill',a,3);if(!tries)cineSub('<small>一騎打ち</small><b>'+esc(a.hs.n)+'　対　'+esc(b.hs.n)+'</b>',3.5);
    setTimeout(function(){if(!BT||BT.over)return;if(!maybeDuel(a,b,true)&&++tries<4)setTimeout(tryDuel,3000);},1600);};
  setTimeout(tryDuel,17000);
}
// 史実の出来事は字幕にも出す
const _evBanner=evBanner;evBanner=function(e,side){_evBanner(e,side);if(BT&&BT.watch)cineSub('<b>'+esc(e.n)+'</b><small>'+esc(e.d)+'</small>',5);};
// 武将が倒れたらスローモーション
const _camEvent=camEvent;camEvent=function(k,q,pri){_camEvent(k,q,pri);if(BT&&BT.watch&&k==='down'&&q){BT.slowT=1.5;cineSub('<b>'+esc(q.hs.n)+'</b><small>'+(q.side?'敵将、ここに退く':'無念の退却')+'</small>',3);}};
// カメラ：基本は全軍を収める高い遠景（決戦風）。技や武将が倒れた時だけ一瞬寄る
const _pickShot=pickShot;pickShot=function(){
  const ev=(BT.ev||[]).filter(function(e){return BT.time-e.t<2.5&&e.q&&(e.q.alive||e.k==='down');}).sort(function(a,b){return b.pri-a.pri;});
  if(ev.length){const e=ev[0];BT.ev=[];const gap=BT.time-(CAMD.lastClose||-99);if((e.k==='skill'&&gap>7)||(e.k==='down'&&gap>3)){CAMD.lastClose=BT.time;if(BT.watch)cineCut();return {k:e.k,q:e.q,dur:e.k==='skill'?2.2:2.6,yaw0:R3.cam.yaw};}}
  if(CAMD.shot&&CAMD.shot.k==='kessen'&&CAMD.t<CAMD.shot.dur)return CAMD.shot;
  const was=CAMD.shot&&(CAMD.shot.k==='skill'||CAMD.shot.k==='down');if(was&&BT.watch)cineCut();
  return {k:'kessen',dur:7,yaw0:0};};
const _shotCam=shotCam;shotCam=function(s,t){
  if(s.k==='kessen'){const A=BT.sq.filter(function(q){return q.alive&&!q.routed&&!q.hidden;});if(!A.length)return _shotCam({k:'wide',yaw0:0},t);
    let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;A.forEach(function(o){x0=Math.min(x0,o.x);x1=Math.max(x1,o.x);z0=Math.min(z0,o.y);z1=Math.max(z1,o.y);});
    const ext=Math.max(x1-x0,(z1-z0)*1.25,10);const tt=BT.time||0;
    return {tx:(x0+x1)/2,tz:(z0+z1)/2+2,yaw:s.yaw0+Math.sin(tt*.05)*.07,pitch:1.0,dist:clamp(ext*(innerWidth<innerHeight?1.55:1.2)+18,34,86)};}
  if(s.k==='skill'){const q=s.q;return {tx:q.x,tz:q.y,yaw:s.yaw0+t*.3,pitch:.42,dist:9};}
  return _shotCam(s,t);};

// ================= 戦の見せ場：互角の激突 → 窮地 → 反撃 → 総攻撃 の流れを作る =================
const DRAMA={ph:'open',t:0,iv:null,s0:[1,1],flags:{}};
const DLINE={crisis:['ここが踏ん張りどころぞ！','怯むな！ 持ちこたえよ！','まだだ……まだ終わらぬ！','退くな！ 退けば国が滅ぶぞ！'],
  rally:['今だ！ 押し返せ！','我に続けぇ！','この一戦に天下が懸かっておる！','好機は今ぞ！ 討って出よ！'],
  final:['勝機は今ぞ！ 全軍、かかれぇ！','一兵たりとも逃すな！','敵は崩れた！ 追い討てぇ！'],
  foe:['小賢しい！ 蹴散らせ！','その首、もらい受ける！','押し潰せ！ 一気に揉み潰せ！','ははは、口ほどにもない！']};
// 受けるダメージの倍率（0=味方, 1=敵）
function cineBias(side){const p=DRAMA.ph;
  if(p==='open')return side===0?.8:1.1;if(p==='crisis')return side===0?1.25:.55;if(p==='rally')return side===0?.35:2.1;if(p==='final')return side===0?.3:2.6;return side===0?.45:1.7;}
function dStr(side){let n=0;sideOf(side).forEach(function(q){if(q.alive&&!q.routed)n+=Math.max(0,q.hp);});return n;}
function dHero(side){return sideOf(side).filter(function(q){return q.hero&&q.alive&&!q.routed&&!q.heroDown;}).sort(function(a,b){return (b.gen?40:0)+b.hs.p-(a.gen?40:0)-a.hs.p;})[0];}
function dSay(q,line){if(!q||!BT||!BT.watch)return;let e=document.getElementById('cineSay');if(!e){e=document.createElement('div');e.id='cineSay';e.className='cine-say';document.getElementById('stage').appendChild(e);}
  e.className='cine-say '+(q.side?'foe':'me');e.innerHTML='<img src="'+portrait(q.hs.h||GENERIC)+'" alt=""><div><small>'+esc(q.hs.n)+'</small><b>「'+esc(line)+'」</b></div>';
  e.classList.remove('go');void e.offsetWidth;e.classList.add('go');clearTimeout(DRAMA.sayT);DRAMA.sayT=setTimeout(function(){e.classList.remove('go');},4200);}
function dPick(a){return a[Math.random()*a.length|0];}
function dSE(k){if(!SND.ok())return;try{const t=SND.ctx.currentTime;if(k==='horn')SND.horn();else if(k==='gong')SND.gong(.22);else if(k==='roll'){drum('roll',t,.35);drum('taiko',t+.9,.6);}}catch(e){}}
function dPhase(ph,title,sub,q,line){DRAMA.ph=ph;DRAMA.t=BT.time;cineCut();cineSub('<b>'+title+'</b>'+(sub?'<small>'+sub+'</small>':''),4.5);if(q){camEvent('skill',q,3);setTimeout(function(){dSay(q,line);},900);}BT.slowT=Math.max(BT.slowT||0,1.4);}
function dramaTick(){if(!BT||!BT.watch||BT.over){clearInterval(DRAMA.iv);DRAMA.iv=null;return;}if(!BT.started||BT.paused||document.getElementById('duelIntro')||document.querySelector('#duelwrap.on'))return;
  const r0=dStr(0)/DRAMA.s0[0],r1=dStr(1)/DRAMA.s0[1],t=BT.time,F=DRAMA.flags;
  if(!F.go&&t>1){F.go=1;dSE('horn');setTimeout(function(){dSE('roll');},700);const q=dHero(0);dPhase('open','全軍、突撃せよ！','両軍の旗が風に鳴る',q,dPick(['いざ、参る！','この戦、必ず勝つ！','我らの力、見せてくれよう！']));}
  if(!F.clash&&BT.sq.some(function(q){return q.state==='fight';})){F.clash=1;const f=BT.sq.find(function(q){return q.state==='fight'&&q.hero;})||BT.sq.find(function(q){return q.state==='fight';});
    cineCut();cineSub('<b>激　突</b>',2.6);BT.slowT=1.6;camEvent('skill',f,3);dSE('gong');}
  if(DRAMA.ph==='open'&&t>Math.min(34,BT.limit*.2)&&t>(F.duelEnd||0)+6){const q=dHero(0);dPhase('crisis','我が軍、押される……！','敵の猛攻が始まった',q,dPick(DLINE.crisis));const e=dHero(1);if(e)setTimeout(function(){dSay(e,dPick(DLINE.foe));},5200);}
  if(DRAMA.ph==='crisis'&&(r0<r1-.16||t-DRAMA.t>24||r0<.55)){const q=dHero(0);dSE('horn');dPhase('rally','反　撃','窮地の中、名将が声を上げる',q,dPick(DLINE.rally));sideOf(0).forEach(function(o){if(o.alive)o.morale=Math.min(100,(o.morale||50)+20);});}
  if(DRAMA.ph==='rally'&&(r1<.42||t-DRAMA.t>40)){const q=dHero(0);dSE('roll');setTimeout(function(){dSE('gong');},900);dPhase('final','勝機！ 総攻撃','全軍、敵本陣へ',q,dPick(DLINE.final));sideOf(1).forEach(function(o){if(o.alive)o.morale-=15;});}
  // 時々、武将が叫ぶ
  if(t-(DRAMA.lastSay||0)>16&&t-DRAMA.t>7){DRAMA.lastSay=t;const fight=BT.sq.filter(function(q){return q.hero&&q.alive&&!q.routed&&q.state==='fight';});const q=fight.length?dPick(fight):null;
    if(q){const ln=q.hs.h&&q.hs.h.sp&&Math.random()<.4?q.hs.h.sp:q.side?dPick(DLINE.foe):dPick(DRAMA.ph==='crisis'?DLINE.crisis:DRAMA.ph==='open'?['続けぇ！','敵将はどこだ！','一歩も退くな！']:DLINE.rally);dSay(q,ln);}}}
const _cineStart=cineStart;cineStart=function(){_cineStart();DRAMA.ph='open';DRAMA.t=0;DRAMA.flags={};DRAMA.lastSay=0;DRAMA.s0=[Math.max(1,dStr(0)),Math.max(1,dStr(1))];clearInterval(DRAMA.iv);DRAMA.iv=setInterval(dramaTick,400);};
// 一騎打ちが終わった時刻を覚える（直後に窮地を始めない）
window.addEventListener('message',function(e){const m=e.data||{};if(m.t==='duelEnd'&&BT&&BT.watch)DRAMA.flags.duelEnd=BT.time;});
// 戦法の表示は一つずつ（重ねない）、出ている間は叫びを隠す
const _cutin=cutin;cutin=function(q,tk){UI.querySelectorAll('.cutin').forEach(function(e){e.remove();});const s=document.getElementById('cineSay');if(s)s.classList.remove('go');_cutin(q,tk);};
const _dSay=dSay;dSay=function(q,line){if(UI.querySelector('.cutin'))return;_dSay(q,line);};
