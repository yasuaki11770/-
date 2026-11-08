/* ================= 合戦の動き：全軍が横一列で連動して前進し、総大将も前に出て戦う。兵数も多めに ================= */
// 兵数を1.5倍に（戦の兵力・敵部隊・武将が率いる上限）
const ARMY_K=1.5;
WARS.forEach(function(w){if(w._k)return;w._k=1;w.total=Math.round(w.total*ARMY_K/100)*100;(w.foe||[]).forEach(function(f){f[2]=Math.round(f[2]*ARMY_K/100)*100;});});
const _heroCap=heroCap;heroCap=function(id){return Math.round(_heroCap(id)*ARMY_K);};

// 行軍：開戦から両軍がぶつかるまで、各軍は隊列を保ったまま同じ速さで進む
function marchState(){if(BT.mc)return BT.mc;
  const mc={done:[0,0],line:[0,0],t:BT.time};
  [0,1].forEach(function(s){const L=BT.sq.filter(function(q){return q.side===s&&q.alive&&!q.gen&&!q.hidden;});let y=0;L.forEach(function(q){y+=q.y;});y=L.length?y/L.length:(s?BT.H*.2:BT.H*.8);mc.line[s]=y;
    L.forEach(function(q){q.mx0=q.x;q.mdy=q.y-y;});});
  // 守る戦（耐久）では味方は動かない
  if(BT.cond==='survive')mc.done[0]=1;
  BT.mc=mc;return mc;}
function marchTick(mc){const dt=BT.time-mc.t;if(dt<=0)return;mc.t=BT.time;
  const gap=Math.abs(mc.line[0]-mc.line[1]);
  if(!mc.done[0]&&gap>3)mc.line[0]-=dt*1.05;if(!mc.done[1]&&gap>3)mc.line[1]+=dt*1.05;
  // どこかで両軍が触れたら、行軍をやめて各自で戦う
  let touch=BT.time>45||gap<=3;
  if(!touch)for(const a of BT.sq){if(!a.alive||a.routed||a.hidden||a.side!==0)continue;for(const b of BT.sq){if(!b.alive||b.routed||b.hidden||b.side!==1)continue;if(Math.hypot(a.x-b.x,a.y-b.y)<6){touch=true;break;}}if(touch)break;}
  if(touch&&!(mc.done[0]&&mc.done[1])){mc.done=[1,1];BT.sq.forEach(function(q){if(q.side===1)q.release=Math.min(q.release||0,BT.time);});}}
const _decide=decide;decide=function(q){
  if(!BT||!BT.started)return _decide(q);
  const mc=marchState();marchTick(mc);
  const near=nearestFoe(q,99);const nd=near?Math.hypot(near.x-q.x,near.y-q.y):99;
  // 総大将：味方の本隊のすぐ後ろに付いて進み、敵が近ければ自ら斬り込む
  if(q.gen){
    if(BT.cond==='survive'&&q.side===0)return _decide(q);
    if(near&&BT.time>5&&nd<7.5){setAttack(q,near);return;}
    const A=BT.sq.filter(function(o){return o.side===q.side&&o.alive&&!o.routed&&!o.gen&&!o.hidden;});if(!A.length)return _decide(q);
    let cx=0,cy=0;A.forEach(function(o){cx+=o.x;cy+=o.y;});cx/=A.length;cy/=A.length;const back=q.side===0?1:-1;
    const tx=clamp(cx,1,BT.W-1),ty=clamp(cy+back*2,1,BT.H-1);q.post=[tx,ty];
    if(q.order.k!=='hold'||Math.hypot(q.order.x-tx,q.order.y-ty)>1)q.order={k:'hold',x:tx,y:ty};return;}
  if(q.hidden||(q.side===1&&q.ai==='flank'))return _decide(q);
  if(!mc.done[q.side]&&q.state!=='fight'&&q.mx0!==undefined){
    const tx=clamp(q.mx0,1,BT.W-1),ty=clamp(mc.line[q.side]+q.mdy,1,BT.H-1);
    if(q.order.k!=='move'||Math.hypot(q.order.x-tx,q.order.y-ty)>.4)q.order={k:'move',x:tx,y:ty};return;}
  // ぶつかった後：待機したままの隊も遅れず加わる
  if(mc.done[q.side]&&near&&q.state!=='fight'&&(q.order.k==='hold'||q.order.k==='move')&&!(q.type==='kyuhei'&&nd<attRange(q)+1)){
    if(!(BT.cond==='survive'&&q.side===0)){setAttack(q,near);return;}}
  return _decide(q);};
// 全軍の方針（突撃など）より先に行軍をそろえる。陣形を使う方針（守る・誘う・包囲・背後）はそのまま
const MARCH_ST={shippu:1,haisui:1,toppa:1,kakko:1,rinki:1};
function marchCtl(q){if(!BT||!BT.started||q.gen||q.hidden||q.cmd)return false;if(q.side===1&&q.ai==='flank')return false;
  if(q.st&&!MARCH_ST[q.st])return false;const mc=marchState();marchTick(mc);
  if(mc.done[q.side]||q.state==='fight'||q.mx0===undefined)return false;
  const tx=clamp(q.mx0,1,BT.W-1),ty=clamp(mc.line[q.side]+q.mdy,1,BT.H-1);
  if(q.order.k!=='move'||Math.hypot(q.order.x-tx,q.order.y-ty)>.4)q.order={k:'move',x:tx,y:ty};return true;}
const _stanceAct=stanceAct;stanceAct=function(q){if(marchCtl(q))return true;return _stanceAct(q);};
// 行軍中は、隊列より前に出た隊がその場で待つ（速い騎馬だけが突出しない）
const _stepSquad=stepSquad;stepSquad=function(q,dt){const mc=BT&&BT.mc;
  if(mc&&!mc.done[q.side]&&q.alive&&!q.routed&&!q.gen&&!q.hidden&&q.mdy!==undefined&&q.state==='move'&&!(q.side===1&&q.ai==='flank')&&q.order.k!=='retreat'){
    const ahead=q.side===0?q.y<mc.line[0]+q.mdy-.6:q.y>mc.line[1]+q.mdy+.6;
    if(ahead){q.face=q.side===0?-Math.PI/2:Math.PI/2;return;}}
  return _stepSquad(q,dt);};
// 総大将：その勢力の君主がいれば君主が率いる（曹操がいるのに関羽が総大将、にならない）
const LORDS={'魏':['caoc','caopi','caorui','sima','simazhao','simayan'],'蜀':['liub','liushan','zhugel'],'呉':['sunj','suns','sunq','sunhao'],'漢':['caoc','sunj','yuans','liub'],'晋':['simayan','simazhao','sima']};
function leadFirst(w,ids){const L=LORDS[w.side]||[];const lord=L.find(function(id){return ids.indexOf(id)>=0;});if(!lord||ids[0]===lord)return ids;return [lord].concat(ids.filter(function(id){return id!==lord;}));}
