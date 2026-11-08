/* ================= 鑑賞を映画のように：字幕・黒帯・カット割り・名場面の一騎打ち ================= */
// その戦の名場面の一騎打ち（こちら, 敵）
const CINE_DUEL={'黄巾討伐':['guan','chengyuanzhi'],'汜水関':['guan','huax'],'虎牢関':['zhangf','lubu'],'神亭':['suns','tsc'],'濮陽':['dianw','lubu'],'白馬':['guan','yanl'],
 '五関':['guan','kongxiu'],'古城':['guan','caiyang'],'烏巣':['xuc','chunyuqiong'],'博望坡':['zhaoy','xhd'],'長坂':['zhaoy','zhangh'],'赤壁':['gann','zhangl'],'桂陽':['zhaoy','zhaofan'],
 '劉郎浦':['zhaoy','xusheng'],'潼関':['xuc','mac'],'落鳳坡':['weiy','zhangren'],'巴郡':['zhangf','yanyan'],'葭萌関':['zhangf','mac'],'定軍山':['huangz','xhy'],'樊城':['guan','pangd'],
 '麦城':['guan','panzhang'],'猇亭':['guanxing','panzhang'],'夷陵':['zhaoy','zhout'],'南中':['zhaoy','menghuo'],'盤蛇谷':['weiy','wutugu'],'鳳鳴山':['zhaoy','hande'],'街亭':['wangping','zhangh'],
 '上方谷':['weiy','simashi'],'五丈原':['jiangw','guohuai'],'洮西':['jiangw','wangjing'],'剣閣':['jiangw','zhonghui'],'建業':['wenyang','sunhao']};
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
    if(!a||!b){const me=sideOf(0).filter(function(q){return q.hero&&q.alive&&!q.routed&&!q.heroDown;}).sort(function(x,y){return y.hs.p-x.hs.p;})[0];const fo=sideOf(1).filter(function(q){return q.hero&&q.alive&&!q.routed&&!q.heroDown;}).sort(function(x,y){return (y.gen?50:0)+y.hs.p-(x.gen?50:0)-x.hs.p;})[0];a=me;b=fo;}
    if(!a||!b)return;if((BT.duels||[]).length){return;}
    camEvent('skill',a,3);if(!tries)cineSub('<small>一騎打ち</small><b>'+esc(a.hs.n)+'　対　'+esc(b.hs.n)+'</b>',3.5);
    setTimeout(function(){if(!BT||BT.over)return;if(!maybeDuel(a,b,true)&&++tries<4)setTimeout(tryDuel,3000);},1600);};
  setTimeout(tryDuel,17000);
}
// 史実の出来事は字幕にも出す
const _evBanner=evBanner;evBanner=function(e,side){_evBanner(e,side);if(BT&&BT.watch)cineSub('<b>'+esc(e.n)+'</b><small>'+esc(e.d)+'</small>',5);};
// 武将が倒れたらスローモーション
const _camEvent=camEvent;camEvent=function(k,q,pri){_camEvent(k,q,pri);if(BT&&BT.watch&&k==='down'&&q){BT.slowT=1.5;cineSub('<b>'+esc(q.hs.n)+'</b><small>'+(q.side?'敵将、ここに退く':'無念の退却')+'</small>',3);}};
// カット割り：低いアングルの寄り、騎馬の追走、激突、俯瞰へのクレーン
const _pickShot=pickShot;pickShot=function(){if(!BT||!BT.watch)return _pickShot();
  const s=_pickShot();if(s.k==='skill'||s.k==='down'){cineCut();return s;}
  const heroes=alive().filter(function(q){return q.hero&&!q.heroDown;});const fight=alive().filter(function(q){return q.state==='fight'&&q.foe;});const mov=alive().filter(function(q){return q.state==='move'&&q.order.k!=='retreat';});
  const r=rnd();let out;
  if(fight.length&&r<.35){const q=fight.filter(function(o){return o.hero;})[0]||pick(fight);out={k:'clash2',q:q,dur:4.6,yaw0:R3.cam.yaw+(rnd()-.5)*1.6};}
  else if(heroes.length&&r<.6){out={k:'hero',q:pick(heroes),dur:4.2,yaw0:rnd()*6.28};}
  else if(mov.length&&r<.8){out={k:'track',q:pick(mov),dur:4.4};}
  else out={k:'crane',dur:6,yaw0:R3.cam.yaw};
  cineCut();return out;};
const _shotCam=shotCam;shotCam=function(s,t){const q=s.q;
  if(s.k==='hero')return {tx:q.x,tz:q.y,yaw:s.yaw0+t*.22,pitch:.3,dist:7.5+t*.3};
  if(s.k==='track'){const yaw=Math.atan2(-Math.cos(q.face),-Math.sin(q.face));return {tx:q.x+Math.cos(q.face)*2,tz:q.y+Math.sin(q.face)*2,yaw:yaw+.35,pitch:.36,dist:9.5};}
  if(s.k==='clash2'){const f=q.foe&&q.foe.alive?q.foe:q;return {tx:(q.x+f.x)/2,tz:(q.y+f.y)/2,yaw:s.yaw0+t*.12,pitch:.44,dist:11.5};}
  if(s.k==='crane'){const w=_shotCam({k:'wide',yaw0:s.yaw0},t);const u=Math.min(1,t/s.dur);w.pitch=.42+.5*u;w.dist=w.dist*(.55+.45*u);return w;}
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
