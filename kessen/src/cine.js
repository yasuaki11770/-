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
    camEvent('skill',a,3);cineSub('<small>一騎打ち</small><b>'+esc(a.hs.n)+'　対　'+esc(b.hs.n)+'</b>',3.5);
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
