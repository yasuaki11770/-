/* ================= 戦場の個性：戦ごとに史実に合わせた地形と建物（関・城・河と船団・橋・柵・兵糧庫…） ================= */
const STAGE={cur:null};
// 地形の種類 0平原 1森 2川 3丘 4街道
function stTiles(t,W,H){return {
  set:function(x,y,v){x=Math.floor(x);y=Math.floor(y);if(x>=0&&y>=0&&x<W&&y<H)t[y*W+x]=v;},
  rect:function(x0,y0,x1,y1,v){for(let y=Math.floor(y0);y<=Math.floor(y1);y++)for(let x=Math.floor(x0);x<=Math.floor(x1);x++)this.set(x,y,v);},
  fill:function(v,f){for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(f(x,y))t[y*W+x]=v;},
  get:function(x,y){return t[Math.floor(y)*W+Math.floor(x)];}};}
const STAGE_KIND={'汜水関':'pass','虎牢関':'pass','五関':'pass','葭萌関':'pass','剣閣':'pass',
  '樊城':'castle','古城':'castle','桂陽':'castle','巴郡':'castle','成都':'castle','建業':'castle','濮陽':'castle','西城':'castle','麦城':'castle',
  '赤壁':'fleet','長坂':'bridge','白馬':'ford','潼関':'ford','劉郎浦':'ford','洮西':'ford',
  '博望坡':'woods','落鳳坡':'woods','南中':'jungle','盤蛇谷':'gorge','夷陵':'camps','烏巣':'depot',
  '定軍山':'peak','鳳鳴山':'peak','街亭':'hilltop','上方谷':'gorge','五丈原':'plateau','黄巾討伐':'yellow','神亭':'hills2','猇亭':'woods2'};
function stageBuild(w,t,W,H){const T=stTiles(t,W,H);const k=STAGE_KIND[w.n];if(!k)return null;const P=[];const r=srand((w.y||1)*13+W);
  let fy=0;(w.foe||[]).forEach(function(f){fy=Math.max(fy,f[5]*H);});const wy=Math.round(clamp(fy+2.6,9,19));const sv=w.cond==='survive';
  const clearDeploy=function(){T.rect(0,H-7,W-1,H-1,0);};
  if(['pass','castle','fleet','bridge','ford','gorge','plateau','peak','hilltop','depot','camps'].indexOf(k)>=0){T.fill(0,function(){return true;});for(let i=0;i<7;i++){const cx=r()<.5?r()*W*.22:W-r()*W*.22,cy=4+r()*(H-10),rad=1.5+r()*2;T.fill(1,function(x,y){return Math.hypot(x-cx,y-cy)<rad;});}}
  if(k==='pass'){ // 谷間を塞ぐ関：城壁と門
    T.fill(3,function(x,y){return Math.min(x,W-1-x)<4+Math.sin(y*.5)*1.2;});T.fill(1,function(x,y){const e=Math.min(x,W-1-x);return e>=4&&e<6&&r()<.4;});
    T.rect(4,wy,W-5,wy,2);T.rect(W/2-2,wy,W/2+1,wy,4);T.rect(W/2-1,0,W/2,H-1,4);
    P.push({k:'wall',x0:3.5,x1:W-3.5,y:wy+.5,gate:[W/2-2,W/2+2],tower:1});}
  else if(k==='castle'){ // 城：守る戦なら味方側、攻める戦なら敵側
    const y0=sv?H-11:1,y1=sv?H-2:wy,x0=6,x1=W-6;
    T.rect(x0,y0,x1,y1,4);T.rect(x0-1,y0,x0-1,y1,2);T.rect(x1+1,y0,x1+1,y1,2);T.rect(x0-1,sv?y0-1:y1+1,x1+1,sv?y0-1:y1+1,2);
    const gy=sv?y0-1:y1+1;T.rect(W/2-2,gy,W/2+1,gy,4);
    P.push({k:'castle',x0:x0-.5,x1:x1+1.5,y0:y0-(sv?.5:0)+(sv?0:.5),y1:y1+.5+(sv?0:.5),gateSide:sv?'n':'s'});
    for(let i=0;i<5;i++)P.push({k:'house',x:x0+2+r()*(x1-x0-4),y:y0+1.5+r()*(y1-y0-3)});
    if(!sv)for(let i=0;i<4;i++){const L=r()<.5;T.rect(L?1:W-3,y1+4+i*4,L?2:W-2,y1+5+i*4,1);}}
  else if(k==='fleet'){ // 赤壁：大河と鎖でつないだ曹操の船団
    T.fill(2,function(x,y){const c=15+Math.sin(x*.25)*1.2;return y>c-2.4&&y<c+2.4;});[6,W-7].forEach(function(fx){T.rect(fx,12,fx+1,18,4);});
    for(let i=0;i<7;i++)P.push({k:'ship',x:3+i*4,y:13.6+Math.sin(i)*.4,big:i%3===1,chain:i<6});
    for(let i=0;i<3;i++)P.push({k:'ship',x:6+i*9,y:18.2,small:1,wu:1});
    T.fill(3,function(x,y){return y<4&&(x<5||x>W-6);});}
  else if(k==='bridge'){ // 長坂橋
    T.fill(2,function(x,y){const c=H*.55+Math.sin(x*.3)*1;return y>c-1.6&&y<c+1.6;});T.rect(W/2-1,H*.55-3,W/2,H*.55+3,4);
    P.push({k:'bridge',x:W/2,y:H*.55,len:5});for(let i=0;i<8;i++)T.rect(r()*W,r()*H*.4+4,0,0,1);
    T.fill(1,function(x,y){return y>H*.6&&y<H*.75&&(x<6||x>W-7)&&r()<.7;});}
  else if(k==='ford'){ // 浅瀬のある河
    T.fill(2,function(x,y){const c=H*.42+Math.sin(x*.28+(w.y||0))*1.6;return y>c-1.5&&y<c+1.5;});
    [W*.2,W*.5,W*.8].forEach(function(fx){T.rect(fx-1,H*.42-4,fx+1,H*.42+4,4);});
    for(let i=0;i<3;i++)P.push({k:'ship',x:4+i*11+r()*3,y:H*.42+(r()-.5),small:1});
    T.fill(1,function(x,y){return y<H*.3&&r()<.12;});}
  else if(k==='woods'||k==='jungle'||k==='woods2'){ // 林の中の細い道（火計・伏兵の舞台）
    const d=k==='woods2'?.3:k==='jungle'?.75:.6;T.fill(1,function(x,y){return r()<d&&Math.abs(x-W/2-Math.sin(y*.3)*3)>2.5;});
    T.fill(4,function(x,y){return Math.abs(x-W/2-Math.sin(y*.3)*3)<1.2;});if(k==='jungle'){T.fill(2,function(x,y){return Math.abs(y-H*.35-Math.sin(x*.4)*2)<.9;});T.rect(W/2-1,H*.35-3,W/2+1,H*.35+3,4);}
    if(w.n==='博望坡')for(let i=0;i<6;i++)P.push({k:'grain',x:W/2+(r()-.5)*8,y:6+r()*6});}
  else if(k==='camps'){ // 夷陵：森に連なる蜀の陣営（連営七百里）
    T.fill(1,function(x,y){return r()<.5;});T.rect(0,H-13,W-1,H-9,0);
    for(let i=0;i<5;i++){P.push({k:'palisade',x0:1+i*6,x1:5+i*6,y:H-12.5});P.push({k:'tent',x:3+i*6,y:H-11});}}
  else if(k==='depot'){ // 烏巣：袁紹軍の兵糧庫
    T.rect(7,2,W-8,wy-1,0);P.push({k:'ring',x0:6.5,x1:W-7.5,y0:1.5,y1:wy-.5});for(let i=0;i<10;i++)P.push({k:'grain',x:9+(i%5)*3,y:3.5+Math.floor(i/5)*3});
    T.fill(1,function(x,y){return y>wy+2&&y<H-8&&(x<4||x>W-5)&&r()<.7;});}
  else if(k==='peak'){ // 山上の陣（定軍山など）
    T.fill(3,function(x,y){const d=Math.hypot((x-W/2)/9,(y-6)/7);return d<1;});T.fill(1,function(x,y){const d=Math.hypot((x-W/2)/12,(y-7)/9);return d>.9&&d<1.2&&r()<.5;});
    P.push({k:'tent',x:W/2,y:4});P.push({k:'tent',x:W/2-3,y:6});}
  else if(k==='hilltop'){ // 街亭：道を外れた孤山
    T.fill(3,function(x,y){return Math.hypot((x-W*.35)/6,(y-H*.45)/6)<1;});T.fill(4,function(x,y){return Math.abs(x-W*.7)<1.2;});
    P.push({k:'tent',x:W*.35,y:H*.45});P.push({k:'palisade',x0:W*.35-4,x1:W*.35+4,y:H*.45+5});}
  else if(k==='gorge'){ // 両側が切り立った谷
    T.fill(3,function(x,y){return Math.min(x,W-1-x)<8+Math.sin(y*.35)*1.5;});T.fill(4,function(x,y){return Math.abs(x-W/2)<1;});
    if(w.n==='上方谷')for(let i=0;i<6;i++)P.push({k:'grain',x:W/2+(r()-.5)*6,y:6+r()*8});}
  else if(k==='plateau'){ // 五丈原：台地で向き合う両軍の陣
    T.fill(3,function(x,y){return y<9||y>H-11&&y<H-7;});T.fill(2,function(x,y){return Math.abs(y-H*.45-Math.sin(x*.3))<1.1;});[W*.3,W*.7].forEach(function(fx){T.rect(fx-1,H*.45-3,fx+1,H*.45+3,4);});
    for(let i=0;i<4;i++){P.push({k:'tent',x:5+i*6.5,y:3});}P.push({k:'palisade',x0:3,x1:W-3,y:7.5});}
  else if(k==='yellow'){ // 黄巾賊の野営：黄色い旗
    for(let i=0;i<9;i++)P.push({k:'flag',x:4+r()*(W-8),y:2+r()*(wy-2),c:0xd8b020});for(let i=0;i<4;i++)P.push({k:'tent',x:5+i*6.5,y:3+r()*3,c:0xc8a040});}
  else if(k==='hills2'){T.fill(3,function(x,y){return Math.hypot((x-W*.25)/6,(y-H*.45)/7)<1||Math.hypot((x-W*.75)/6,(y-H*.4)/7)<1;});P.push({k:'shrine',x:W*.25,y:H*.45});}
  clearDeploy();
  // 自陣の脇の伏兵用の林は残す
  {const L=r()<.5;for(let y=H-5;y<H-2;y++)for(let x=0;x<3;x++)T.set(L?x:W-1-x,y,1);}
  return P;}
const _genTerrain=genTerrain;genTerrain=function(kind,W,H,seed){const t=_genTerrain(kind,W,H,seed);const i=(seed-3)/7;const w=Number.isInteger(i)?WARS[i]:null;
  STAGE.cur=null;if(w){try{STAGE.cur=stageBuild(w,t,W,H);}catch(e){STAGE.cur=null;}}return t;};
// ---- 建物の3Dモデル
function stageProps(P){const R=R3,T=R.T;if(!T||!R.world||!P)return;const g=new T.Group();
  const M=function(c){return new T.MeshLambertMaterial({color:c});};const stone=M(0x8c8270),stoneD=M(0x6a6254),roof=M(0x3a2a24),red=M(0x9a2a20),wood=M(0x6a4a2a),woodD=M(0x4a3218),sail=M(0xe8dcc0),straw=M(0xc8a858);
  const box=function(w,h,d,m,x,y,z){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;};
  const cyl=function(r0,r1,h,m,x,y,z,n){const o=new T.Mesh(new T.CylinderGeometry(r0,r1,h,n||8),m);o.position.set(x,y,z);o.castShadow=true;g.add(o);return o;};
  const cone=function(r0,h,m,x,y,z,n){const o=new T.Mesh(new T.ConeGeometry(r0,h,n||4),m);o.position.set(x,y,z);o.rotation.y=Math.PI/4;o.castShadow=true;g.add(o);return o;};
  const H=function(x,z){return R.hAt(x,z);};
  const wallLine=function(x0,z0,x1,z1,gate){const L=Math.hypot(x1-x0,z1-z0),n=Math.ceil(L/1.2),ang=Math.atan2(z1-z0,x1-x0);
    for(let i=0;i<n;i++){const u=(i+.5)/n,x=x0+(x1-x0)*u,z=z0+(z1-z0)*u;if(gate&&x>gate[0]-.2&&x<gate[1]+.2&&Math.abs(z1-z0)<.01)continue;const h=Math.max(0,H(x,z));
      const s=box(L/n+.02,1.7,.9,i%2?stone:stoneD,x,h+.85,z);s.rotation.y=-ang;for(let k=-1;k<=1;k+=2){const c=box(.3,.35,.92,stone,x+Math.cos(ang)*k*.3,h+1.85,z+Math.sin(ang)*k*.3);c.rotation.y=-ang;}}};
  const tower=function(x,z,s){const h=Math.max(0,H(x,z));box(1.8*s,2.6*s,1.8*s,stoneD,x,h+1.3*s,z);box(2*s,.2,2*s,wood,x,h+2.7*s,z);cone(1.7*s,1.2*s,roof,x,h+3.4*s,z);};
  const gateHouse=function(x0,x1,z){const cx=(x0+x1)/2,h=Math.max(0,H(cx,z));tower(x0-.6,z,1);tower(x1+.6,z,1);box(x1-x0+1.4,.5,1.2,stoneD,cx,h+2.4,z);
    box(x1-x0+2.4,1,1.6,red,cx,h+3.1,z);const rf=new T.Mesh(new T.ConeGeometry((x1-x0)*.55+1.3,1.1,4),roof);rf.scale.z=.32;rf.rotation.y=Math.PI/4;rf.position.set(cx,h+4.2,z);g.add(rf);};
  P.forEach(function(p){
    if(p.k==='wall'){wallLine(p.x0,p.y,p.x1,p.y,p.gate);gateHouse(p.gate[0],p.gate[1],p.y);tower(p.x0+.8,p.y,.9);tower(p.x1-.8,p.y,.9);}
    else if(p.k==='castle'){const x0=p.x0,x1=p.x1,z0=p.y0,z1=p.y1,gz=p.gateSide==='s'?z1:z0,oz=p.gateSide==='s'?z0:z1;const gx=[(x0+x1)/2-2,(x0+x1)/2+2];
      wallLine(x0,gz,x1,gz,gx);wallLine(x0,oz,x1,oz);wallLine(x0,z0,x0,z1);wallLine(x1,z0,x1,z1);gateHouse(gx[0],gx[1],gz);[[x0,z0],[x1,z0],[x0,z1],[x1,z1]].forEach(function(c){tower(c[0],c[1],1);});}
    else if(p.k==='house'){const h=Math.max(0,H(p.x,p.y));box(1.6,1,1.2,M(0xb8a888),p.x,h+.5,p.y);const rf=new T.Mesh(new T.ConeGeometry(1.3,.8,4),roof);rf.scale.z=.7;rf.rotation.y=Math.PI/4;rf.position.set(p.x,h+1.4,p.y);g.add(rf);}
    else if(p.k==='ship'){const s=p.big?1.4:p.small?.7:1,h=-.1;const hull=box(3.2*s,.6*s,1.2*s,p.wu?M(0x5a3020):wood,p.x,h+.3*s,p.y);box(2.6*s,.12,1*s,woodD,p.x,h+.66*s,p.y);
      if(p.big)box(1.2*s,.8*s,.9*s,red,p.x-.6*s,h+1.1*s,p.y);cyl(.06,.08,2.6*s,woodD,p.x,h+1.9*s,p.y,6);const sl=box(.05,1.6*s,1.7*s,sail,p.x+.1,h+2.1*s,p.y);
      if(p.chain){for(let k=0;k<4;k++)box(.18,.06,.06,M(0x303030),p.x+1.8+k*.5,h+.5,p.y+.1);}}
    else if(p.k==='bridge'){const h=.15;box(3,.18,p.len,wood,p.x,h+.2,p.y);for(let k=-1;k<=1;k+=2){box(.12,.5,p.len,woodD,p.x+k*1.4,h+.5,p.y);for(let j=0;j<5;j++)cyl(.08,.08,1.2,woodD,p.x+k*1.4,-.2,p.y-p.len/2+j*p.len/4,6);}}
    else if(p.k==='palisade'||p.k==='ring'){const seg=p.k==='ring'?[[p.x0,p.y0,p.x1,p.y0],[p.x0,p.y1,(p.x0+p.x1)/2-2,p.y1],[(p.x0+p.x1)/2+2,p.y1,p.x1,p.y1],[p.x0,p.y0,p.x0,p.y1],[p.x1,p.y0,p.x1,p.y1]]:[[p.x0,p.y,p.x1,p.y]];
      seg.forEach(function(sg){const L=Math.hypot(sg[2]-sg[0],sg[3]-sg[1]),n=Math.ceil(L/.45);for(let i=0;i<=n;i++){const x=sg[0]+(sg[2]-sg[0])*i/n,z=sg[1]+(sg[3]-sg[1])*i/n,h=Math.max(0,H(x,z));const st=cyl(.07,.09,1.1,i%2?wood:woodD,x,h+.55,z,5);st.rotation.z=(i%3-1)*.06;}});}
    else if(p.k==='grain'){const h=Math.max(0,H(p.x,p.y));cyl(.7,.75,1,straw,p.x,h+.5,p.y,10);const c=new T.Mesh(new T.ConeGeometry(.85,.7,10),M(0xb89848));c.position.set(p.x,h+1.35,p.y);g.add(c);}
    else if(p.k==='tent'){const h=Math.max(0,H(p.x,p.y));const c=new T.Mesh(new T.ConeGeometry(1.2,1.4,6),M(p.c||0xd8d0b8));c.position.set(p.x,h+.7,p.y);c.castShadow=true;g.add(c);}
    else if(p.k==='flag'){const h=Math.max(0,H(p.x,p.y));cyl(.04,.05,2.4,woodD,p.x,h+1.2,p.y,5);box(.04,.7,1,M(p.c),p.x,h+2,p.y+.5);}
    else if(p.k==='shrine'){const h=Math.max(0,H(p.x,p.y));box(2,1.2,1.4,red,p.x,h+.6,p.y);const rf=new T.Mesh(new T.ConeGeometry(1.8,1,4),roof);rf.scale.z=.6;rf.rotation.y=Math.PI/4;rf.position.set(p.x,h+1.7,p.y);g.add(rf);}
  });
  R.world.add(g);}
// 遠景で戦場の外（空の背景）が見えないよう、周りに広い大地を敷く
function stageGround(W,H){const T=R3.T;if(!T||!R3.world)return;const m=new T.Mesh(new T.PlaneGeometry(900,900),new T.MeshLambertMaterial({color:0x6c7a44}));m.rotation.x=-Math.PI/2;m.position.set(W/2,-.45,H/2);m.receiveShadow=false;R3.world.add(m);}
const _setWorld=R3.setWorld;R3.setWorld=function(kind,W,H,opt){_setWorld.apply(R3,arguments);if(kind==='war'){try{stageGround(W,H);}catch(e){}if(STAGE.cur)try{stageProps(STAGE.cur);}catch(e){}}};
// 遠景で地面と水面がちらついて青く見えるのを防ぐ（カメラの手前の切り取り距離を距離に合わせる）
const _r3render=R3.render;R3.render=function(){try{const c=R3.camera,d=R3.cam&&R3.cam.dist||20;const nr=Math.max(.1,Math.min(12,d*.18));if(c&&Math.abs(c.near-nr)>.05){c.near=nr;c.far=Math.max(400,d*8);c.updateProjectionMatrix();}}catch(e){}return _r3render.apply(R3,arguments);};
