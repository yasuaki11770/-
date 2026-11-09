/* =====================================================================
   三国覇王伝 — 天下図（戦略）から 決戦・戦術・一騎打ち・物語 を呼び出す
   - 決戦 : kessen.html（三国決戦伝の合戦）
   - 戦術 : tactics.html（三国タクティクス）
   - 一騎打ち : duel.html（一騎打ち英雄伝）
   - 物語 : 三国英雄伝の物語画面（このファイルの下の方）
   ===================================================================== */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const R=()=>Math.random();
const pick=a=>a[Math.floor(R()*a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const man=n=>n>=10000?(Math.round(n/1000)/10)+'万':Math.round(n).toLocaleString();
const HB=id=>byId(id);

/* ================= 地域（三国英雄伝の勢力図を土台に） ================= */
const MAP_SEEDS=[['you',76,12],['you',90,8],['ji',65,25],['bing',51,20],['qing',81,31],['yan',68,37],['xu',80,43],['yu',67,46],['sili',57,40],['yong',44,38],
  ['liang',25,29],['liang',10,20],['hanzhong',41,47],['yi',31,57],['nanzhong',27,73],['xiangyang',56,50],['jiangling',52,57],['jingS',50,68],['changsha',61,65],
  ['huainan',76,51],['jiangdong',84,59],['kuaiji',80,71],['jiao',56,83]];
const MAP_OUT=[[8,12],[22,9],[36,10],[48,5],[60,2],[74,2],[88,3],[97,6],[97,13],[89,18],[86,23],[93,29],[90,34],[85,36],[87,44],[91,51],[93,60],[90,68],[86,76],[78,83],[68,87],[58,89],[46,88],[36,86],[26,88],[17,83],[14,72],[16,60],[12,48],[4,38],[2,25]];
const MAP_RIV=[[[16,31],[28,27],[38,22],[46,13],[52,15],[51,29],[56,37],[64,35],[72,31],[80,28],[86,27]],[[16,62],[26,59],[34,60],[42,59],[48,56],[54,56],[60,59],[67,58],[74,56],[82,55],[91,54]]];
// k=決戦の地形 t=戦術の地図 o=戦術の地図の仕掛け d=一騎打ちの舞台 cap=兵の上限
const REG={
 you:{n:'幽州',c:'北平',x:76,y:12,k:'plain',t:'plain',d:'snow',cap:15000},
 ji:{n:'冀州',c:'鄴',x:65,y:25,k:'plain',t:'castle',d:'plain',cap:22000},
 bing:{n:'并州',c:'晋陽',x:51,y:20,k:'mountain',t:'mountain',d:'mountain',cap:14000},
 qing:{n:'青州',c:'平原',x:81,y:31,k:'plain',t:'plain',o:{village:1},d:'plain',cap:15000},
 yan:{n:'兗州',c:'濮陽',x:68,y:37,k:'plain',t:'plain',o:{camp:1},d:'plain',cap:16000},
 xu:{n:'徐州',c:'下邳',x:80,y:43,k:'river',t:'castle',o:{river:1},d:'river',cap:17000},
 yu:{n:'豫州',c:'許昌',x:67,y:46,k:'plain',t:'castle',d:'plain',cap:20000},
 sili:{n:'司隷',c:'洛陽',x:57,y:40,k:'valley',t:'gate',o:{},d:'night',cap:20000},
 yong:{n:'雍州',c:'長安',x:44,y:38,k:'hills',t:'castle',d:'desert',cap:18000},
 liang:{n:'涼州',c:'武威',x:25,y:29,k:'hills',t:'hills',d:'desert',cap:15000},
 hanzhong:{n:'漢中',c:'南鄭',x:41,y:47,k:'mountain',t:'mountain',d:'mountain',cap:12000},
 yi:{n:'益州',c:'成都',x:31,y:57,k:'forest',t:'castle',d:'mountain',cap:20000},
 nanzhong:{n:'南中',c:'建寧',x:27,y:73,k:'forest',t:'forest',o:{swamp:1},d:'night',cap:13000},
 xiangyang:{n:'襄陽',c:'襄陽',x:56,y:50,k:'river',t:'river',d:'river',cap:16000},
 jiangling:{n:'江陵',c:'江陵',x:52,y:57,k:'river',t:'yangtze',d:'river',cap:15000},
 jingS:{n:'荊南',c:'零陵',x:50,y:68,k:'forest',t:'forest',d:'plain',cap:12000},
 changsha:{n:'長沙',c:'長沙',x:61,y:65,k:'hills',t:'hills',o:{plateau:1},d:'plain',cap:13000},
 huainan:{n:'淮南',c:'寿春',x:76,y:51,k:'river',t:'river',d:'plain',cap:16000},
 jiangdong:{n:'江東',c:'建業',x:84,y:59,k:'river',t:'yangtze',d:'river',cap:18000},
 kuaiji:{n:'会稽',c:'会稽',x:80,y:71,k:'forest',t:'forest',d:'plain',cap:13000},
 jiao:{n:'交州',c:'交趾',x:56,y:83,k:'forest',t:'forest',o:{swamp:1},d:'night',cap:12000}
};
const RIDS=Object.keys(REG);
const ADJ_L=["bing-you","ji-you","bing-ji","bing-liang","qing-you","ji-qing","bing-yong","liang-yong","ji-yan","bing-sili","ji-sili","sili-yong","sili-yan","qing-yan","qing-xu","xu-yan","hanzhong-liang","hanzhong-yong","sili-yu","yan-yu","xu-yu","hanzhong-yi","hanzhong-xiangyang","sili-xiangyang","liang-yi","huainan-xu","xiangyang-yu","huainan-yu","jiangling-xiangyang","hanzhong-jiangling","jiangdong-xu","huainan-jiangdong","changsha-xiangyang","changsha-jiangling","changsha-huainan","jiangling-jingS","jiangling-yi","nanzhong-yi","jiangdong-kuaiji","jingS-yi","changsha-kuaiji","changsha-jingS","jingS-nanzhong","changsha-jiao","jiao-kuaiji","jiao-jingS","jiao-nanzhong"];
const ADJ={};RIDS.forEach(r=>ADJ[r]=[]);ADJ_L.forEach(s=>{const[a,b]=s.split('-');ADJ[a].push(b);ADJ[b].push(a);});

/* ================= 勢力 ================= */
// sold=戦術戦の兵の見た目, dk=決戦伝の陣営名, ag=攻めっ気
const FAC={
 cao:{n:'曹操軍',k:'魏',ruler:'caoc',col:'#3462b8',ch:'曹',sold:'wei',dk:'魏',ag:.65,diff:['ふつう','#3462b8'],d:'中原の中心に二つの州。猛将と知将がそろう王道の勢力。'},
 liu:{n:'劉備軍',k:'蜀',ruler:'liub',col:'#2f8a46',ch:'劉',sold:'shu',dk:'蜀',ag:.45,diff:['むずかしい','#7a2a1a'],d:'平原の一州と義兄弟だけ。人望で人材を集め、天下に挑む。'},
 sun:{n:'孫堅軍',k:'呉',ruler:'sunj',col:'#b8302a',ch:'孫',sold:'wu',dk:'呉',ag:.55,diff:['ふつう','#a8322e'],d:'江東の虎とその一族。長江に守られ、背後は安全。'},
 lu:{n:'呂布軍',k:'呂',ruler:'lubu',col:'#8a2a5a',ch:'呂',sold:'lu',dk:'群',ag:.8,diff:['ふつう','#7a1c4c'],d:'天下無双の呂布が一人で戦場を壊す。徐州の一州のみ。'},
 yuan:{n:'袁紹軍',k:'袁',ruler:'yuans',col:'#c9a01c',ch:'袁',sold:'yuan',dk:'群',ag:.55,diff:['やさしい','#5a7a2a'],d:'河北の二州と大軍。顔良・文醜ら猛将もそろう名門。'},
 dong:{n:'董卓軍',k:'董',ruler:'dongz',col:'#6a6a72',ch:'董',sold:'dong',dk:'群',ag:.7,diff:['ふつう','#4a4a52'],d:'洛陽と長安を握る暴君。兵は多いが人材が少ない。'},
 ma:{n:'馬騰軍',k:'馬',ruler:'matengg',col:'#9a5ab8',ch:'馬',sold:'rengo',dk:'群',ag:.5,diff:['ふつう','#6a3a88'],d:'西涼の騎馬軍団。馬超・龐徳の武は天下に響く。'},
 gs:{n:'公孫瓚軍',k:'公',ruler:'gongsunz',col:'#e2822e',ch:'公',sold:'gongsun',dk:'群',ag:.5,diff:['むずかしい','#8a4a10'],d:'北の果ての白馬義従。若き趙雲がいる。南の袁紹が手ごわい。'},
 man:{n:'南蛮軍',k:'蛮',ruler:'menghuo',col:'#8a6a2a',ch:'蛮',sold:'nanban',dk:'群',ag:.45,diff:['むずかしい','#6a4a10'],d:'南の密林の王・孟獲と祝融。七度捕らえられても屈しない。'}
};
const FIDS=Object.keys(FAC);const BASE_FIDS=FIDS.slice();
// 国替＋で旗を揚げることがある勢力
const EXFAC={
 kin:{n:'張角軍',k:'黄',ruler:'zhangj',col:'#9cc23e',ch:'黄',sold:'kokin',dk:'群',ag:.7,diff:['ふつう','#6a8a1a'],d:'黄天の世を夢見る黄巾の残党。'},
 zx:{n:'張繍軍',k:'繍',ruler:'zhangx',col:'#2a9a9a',ch:'繍',sold:'dong',dk:'群',ag:.6,diff:['ふつう','#1a6a6a'],d:'宛城の槍の名手。'},
 hf:{n:'皇甫嵩軍',k:'皇',ruler:'huangfu',col:'#d86a8a',ch:'皇',sold:'rengo',dk:'漢',ag:.45,diff:['ふつう','#a83a5a'],d:'漢を支えた老将が自ら立つ。'},
 uh:{n:'烏桓軍',k:'烏',ruler:'tadun',col:'#4a5a7a',ch:'烏',sold:'uhan',dk:'群',ag:.65,diff:['ふつう','#2a3a5a'],d:'草原の騎馬の民。'},
 jl:{n:'紀霊軍',k:'紀',ruler:'jil',col:'#5ac8e0',ch:'紀',sold:'yuan',dk:'群',ag:.55,diff:['ふつう','#2a7a9a'],d:'袁術の大将が旗を奪って立つ。'}};
// 国数21のときだけ旗を揚げる勢力
const EXFAC2={
 ss:{n:'孫策軍',k:'策',ruler:'suns',col:'#e0702a',ch:'策',sold:'wu',dk:'呉',ag:.7,diff:['ふつう','#a84a10'],d:'江東の小覇王が父から独り立つ。'},
 zy:{n:'趙雲軍',k:'趙',ruler:'zhaoy',col:'#7ab8e8',ch:'趙',sold:'gongsun',dk:'群',ag:.5,diff:['ふつう','#3a78a8'],d:'常山の龍が自ら旗を掲げる。'},
 mc:{n:'馬超軍',k:'超',ruler:'mac',col:'#b8a0e0',ch:'超',sold:'rengo',dk:'群',ag:.75,diff:['ふつう','#6a50a0'],d:'錦馬超、西涼の騎兵を率いる。'},
 zl:{n:'張遼軍',k:'遼',ruler:'zhangl',col:'#5a6a90',ch:'遼',sold:'lu',dk:'群',ag:.6,diff:['ふつう','#2a3a60'],d:'遼来来。八百騎で天下を狙う。'},
 sy:{n:'司馬懿軍',k:'司',ruler:'sima',col:'#5a2a5a',ch:'司',sold:'wei',dk:'魏',ag:.45,diff:['ふつう','#3a0a3a'],d:'機をうかがう深謀の人。'},
 zg:{n:'諸葛亮軍',k:'亮',ruler:'zhugel',col:'#2ab890',ch:'亮',sold:'shu',dk:'蜀',ag:.4,diff:['ふつう','#0a7a5a'],d:'臥龍が草廬を出て自ら立つ。'},
 gn:{n:'甘寧軍',k:'寧',ruler:'gann',col:'#e890a8',ch:'寧',sold:'wu',dk:'呉',ag:.7,diff:['ふつう','#a85070'],d:'錦帆賊の頭領が江を荒らす。'}};
Object.assign(FAC,EXFAC,EXFAC2);
function setFactions(list){FIDS.length=0;(list&&list.length?list:BASE_FIDS).forEach(f=>{if(FAC[f])FIDS.push(f);});}
const NEUTRAL={n:'地方勢力',col:'#cdbf98',ch:'',sold:'kokin'};
const SEASON=['春','夏','秋','冬'];

/* ================= 初期配置（194年・群雄割拠） ================= */
const START={
 reg:{you:['gs',11000],ji:['yuan',16000],bing:['yuan',10000],qing:['liu',7000],yan:['cao',10000],xu:['lu',12000],yu:['cao',12000],sili:['dong',15000],yong:['dong',12000],
  liang:['ma',13000],hanzhong:[null,6000],yi:[null,9000],nanzhong:['man',10000],xiangyang:[null,6000],jiangling:[null,6000],jingS:[null,5000],changsha:[null,7000],
  huainan:[null,8000],jiangdong:['sun',12000],kuaiji:['sun',8000],jiao:[null,5000]},
 // [武将, 勢力(null=地方勢力の守将), 地域]
 hero:[
  ['caoc','cao','yu'],['xhd','cao','yu'],['dianw','cao','yu'],['xuc','cao','yu'],['caochun','cao','yu'],
  ['xhy','cao','yan'],['caor','cao','yan'],['yuej','cao','yan'],['lidian','cao','yan'],['yujin','cao','yan'],
  ['liub','liu','qing'],['guan','liu','qing'],['zhangf','liu','qing'],
  ['sunj','sun','jiangdong'],['suns','sun','jiangdong'],['huanggai','sun','jiangdong'],['chengpu','sun','jiangdong'],['jiangqin','sun','jiangdong'],
  ['zhouy','sun','kuaiji'],['sunq','sun','kuaiji'],['zhout','sun','kuaiji'],['lumeng','sun','kuaiji'],
  ['lubu','lu','xu'],['zhangl','lu','xu'],['gaos','lu','xu'],['chengong','lu','xu'],
  ['yuans','yuan','ji'],['yanl','yuan','ji'],['wenc','yuan','ji'],['quyi','yuan','ji'],['gaolan','yuan','bing'],['zhangh','yuan','bing'],
  ['dongz','dong','sili'],['huax','dong','sili'],['zhangx','dong','yong'],
  ['matengg','ma','liang'],['mac','ma','liang'],['pangd','ma','liang'],['madai','ma','liang'],
  ['gongsunz','gs','you'],['zhaoy','gs','you'],
  ['menghuo','man','nanzhong'],['zhurong','man','nanzhong'],
  ['zhangj',null,'hanzhong'],['zhangb',null,'hanzhong'],['zhangliang',null,'hanzhong'],
  ['huangquan',null,'yi'],['wangping',null,'yi'],['gann',null,'jiangling'],['liaohua',null,'jingS'],['zhoucang',null,'jingS'],
  ['huangz',null,'changsha'],['weiy',null,'changsha'],['jil',null,'huainan']
 ],
 // 在野（その地を治めれば登用を試せる）
 free:[['zhugel','xiangyang'],['pangt','xiangyang'],['guanp','xiangyang'],['sima','sili'],['xuh','sili'],['huangfu','sili'],['luxun','kuaiji'],['tsc','jiangdong'],
  ['lingt','jiangdong'],['xusheng','jiangdong'],['jiangw','yong'],['guohuai','bing'],['simashi','yu'],['guanxing','qing'],['zhangbao2','qing'],['tadun','you']]
};

/* ================= 天下の組み立て：地図・配下・都市数・空白地・国数・都市規模 ================= */
// 陸地（島の多角形の集まり − 湖）・山脈・森・道の種類
const LAND={blobs:[MAP_OUT],lakes:[],isles:[]};let CLIM_CUR=null;const MAP_MTN=[],MAP_FOR=[];let ET={};
const segX=(a,b,c,d)=>{const o=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);return o(a,b,c)*o(a,b,d)<0&&o(c,d,a)*o(c,d,b)<0;};
const pdist=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1,t=clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l,0,1);return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);};
const plDist=(p,pl)=>{let m=1e9;for(let i=0;i<pl.length-1;i++)m=Math.min(m,pdist(p,pl[i],pl[i+1]));return m;};
function edgeTypes(adj,pos,riv,mtn,sea){const o={};adj.forEach(k=>{const[a,b]=k.split('-');const A=pos[a],B=pos[b];
    o[k]=sea&&sea.includes(k)?'sea':riv.some(pl=>pl.some((p,i)=>i<pl.length-1&&segX(A,B,p,pl[i+1])))?'river':mtn.some(pl=>plDist([(A[0]+B[0])/2,(A[1]+B[1])/2],pl)<4.5||pl.some((p,i)=>i<pl.length-1&&segX(A,B,p,pl[i+1])))?'mount':'road';});return o;}
const DEF_REG=Object.fromEntries(RIDS.map(r=>[r,{cap:REG[r].cap,t:REG[r].t,k:REG[r].k,d:REG[r].d,o:REG[r].o,bio:null}]));
const DEF_MAP={seeds:MAP_SEEDS.map(s=>s.slice()),out:MAP_OUT.map(p=>p.slice()),riv:MAP_RIV.map(r=>r.map(p=>p.slice())),adj:ADJ_L.slice(),pos:Object.fromEntries(RIDS.map(r=>[r,[REG[r].x,REG[r].y]]))};
DEF_MAP.et=edgeTypes(DEF_MAP.adj,DEF_MAP.pos,DEF_MAP.riv,[],null);
DEF_MAP.adj.forEach(k=>{const[a,b]=k.split('-');if(DEF_MAP.et[k]==='road'&&(REG[a].t==='mountain'||REG[b].t==='mountain'||REG[a].t==='gate'||REG[b].t==='gate'))DEF_MAP.et[k]='mount';});
function applyMap(m){m=m||DEF_MAP;
  MAP_SEEDS.length=0;m.seeds.forEach(s=>MAP_SEEDS.push(s.slice()));MAP_OUT.length=0;m.out.forEach(p=>MAP_OUT.push(p.slice()));
  MAP_RIV.length=0;m.riv.forEach(r=>MAP_RIV.push(r.map(p=>p.slice())));ADJ_L.length=0;m.adj.forEach(a=>ADJ_L.push(a));
  LAND.blobs=m.land?m.land.blobs:[m.out];LAND.lakes=m.land?m.land.lakes:[];LAND.isles=m.land&&m.land.isles||[];CLIM_CUR=m.clim||null;MAP_MTN.length=0;(m.mtn||[]).forEach(p=>MAP_MTN.push(p));MAP_FOR.length=0;(m.forest||[]).forEach(p=>MAP_FOR.push(p));
  ET=m.et||edgeTypes(m.adj,m.pos,m.riv,m.mtn||[],null);
  RIDS.forEach(r=>{ADJ[r]=[];REG[r].x=m.pos[r][0];REG[r].y=m.pos[r][1];Object.assign(REG[r],DEF_REG[r],m.reg&&m.reg[r]||{});});ADJ_L.forEach(s=>{const[a,b]=s.split('-');ADJ[a].push(b);ADJ[b].push(a);});GRID=null;}
const edgeOf=(a,b)=>ET[a+'-'+b]||ET[b+'-'+a]||'road';
const rf=(a,b)=>a+R()*(b-a);
function inPoly(P,x,y){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
function landAt(L,x,y){return (L.blobs.some(P=>inPoly(P,x,y))&&!L.lakes.some(P=>inPoly(P,x,y)))||(L.isles||[]).some(P=>inPoly(P,x,y));}
function blob(cx,cy,rx,ry,rot,rough,n){n=n||48;const H=[...Array(6)].map((_,k)=>[rf(.02,rough)/(k*.5+1),rf(0,6.28)]);const out=[];
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2;let r=1;H.forEach(([amp,ph],k)=>r+=amp*Math.sin(a*(k+2)+ph));const X=Math.cos(a)*rx*r,Y=Math.sin(a)*ry*r;
    out.push([clamp(cx+X*Math.cos(rot)-Y*Math.sin(rot),2,98),clamp(cy+X*Math.sin(rot)+Y*Math.cos(rot),2,88)]);}return out;}
const SHAPES={big:'大陸',twin:'双子大陸',arch:'群島',ring:'内海の大陸',pen:'半島の国',long:'細長い国',crescent:'三日月の国',fjord:'入り江の国',tri:'三つの島',cross:'十字の大陸',ysh:'三叉の大陸',lsh:'L字の国',mainisle:'大陸と離島',many:'多島海',lakeisle:'湖に浮かぶ島',twinlake:'二つの湖',gulf:'大きな湾'};
function genLand(kind){const L={blobs:[],lakes:[],isles:[]};const B=(...a)=>L.blobs.push(blob(...a));
  if(kind==='big')B(50,45,rf(40,46),rf(34,40),rf(-.3,.3),.28);
  else if(kind==='twin'){const v=R()<.5;const gap=rf(4,10);if(v){B(27-gap/2,45,rf(20,24),rf(32,38),rf(-.3,.3),.3);B(73+gap/2,45,rf(20,24),rf(32,38),rf(-.3,.3),.3);}else{B(50,24-gap/2,rf(40,46),rf(16,20),rf(-.2,.2),.3);B(50,67+gap/2,rf(40,46),rf(16,20),rf(-.2,.2),.3);}}
  else if(kind==='arch'){const n=3+Math.floor(R()*3);const cs=[[28,26],[72,24],[30,66],[72,66],[50,45]];shuffle(cs).slice(0,n).forEach(c=>B(c[0]+rf(-5,5),c[1]+rf(-4,4),rf(13,19),rf(12,17),rf(0,3),.35));}
  else if(kind==='ring'){B(50,45,rf(43,47),rf(37,41),0,.2);L.lakes.push(blob(50+rf(-5,5),45+rf(-4,4),rf(14,19),rf(11,15),rf(0,3),.3));}
  else if(kind==='pen'){B(50,40,rf(32,38),rf(24,30),0,.25);const n=2+Math.floor(R()*2);for(let k=0;k<n;k++){const a=rf(.2,2.9)+k*1.9;B(50+Math.cos(a)*30,40+Math.sin(a)*28,rf(16,22),rf(6,9),a,.25);}}
  else if(kind==='long')B(50,45,rf(48,54),rf(17,22),(R()<.5?.5:-.5)+rf(-.15,.15),.3);
  else if(kind==='crescent'){B(50,45,rf(42,46),rf(36,40),0,.2);L.lakes.push(blob(50+rf(14,22)*(R()<.5?1:-1),45+rf(-8,8),rf(26,32),rf(24,30),0,.2));}
  else if(kind==='fjord'){L.blobs.push(blob(50,45,rf(42,46),rf(36,40),rf(-.3,.3),.5,90));for(let k=0;k<3+Math.floor(R()*3);k++){const a=rf(0,6.28);L.lakes.push(blob(50+Math.cos(a)*40,45+Math.sin(a)*35,rf(9,14),rf(2.5,4),a,.2));}}
  else if(kind==='tri'){const a0=rf(0,6.28);for(let k=0;k<3;k++){const a=a0+k*2.09;B(50+Math.cos(a)*25,45+Math.sin(a)*22,rf(17,21),rf(15,19),rf(0,3),.3);}}
  else if(kind==='cross'){const r=rf(-.3,.3);B(50,45,rf(46,50),rf(12,15),r,.25);B(50,45,rf(12,15),rf(40,44),r,.25);}
  else if(kind==='ysh'){const a0=rf(0,6.28);B(50,45,rf(13,16),rf(13,16),0,.2);for(let k=0;k<3;k++){const a=a0+k*2.09;B(50+Math.cos(a)*22,45+Math.sin(a)*20,rf(22,26),rf(9,12),a,.25);}}
  else if(kind==='lsh'){const sx=R()<.5?1:-1,sy=R()<.5?1:-1;B(50,45+sy*24,rf(44,48),rf(13,16),0,.25);B(50+sx*32,45,rf(13,16),rf(38,42),0,.25);}
  else if(kind==='mainisle'){B(44,45,rf(34,38),rf(32,37),rf(-.2,.2),.28);const n=1+Math.floor(R()*3);for(let k=0;k<n;k++)B(pick([86,88,84]),rf(12,78),rf(7,10),rf(7,11),rf(0,3),.3);}
  else if(kind==='many'){for(let k=0;k<7+Math.floor(R()*3);k++)B(rf(12,88),rf(10,80),rf(9,13),rf(8,12),rf(0,3),.35);}
  else if(kind==='lakeisle'){B(50,45,rf(44,47),rf(38,41),0,.2);L.lakes.push(blob(50,45,rf(26,30),rf(21,25),0,.15));L.isles.push(blob(50+rf(-3,3),45+rf(-3,3),rf(11,14),rf(9,12),rf(0,3),.25));}
  else if(kind==='twinlake'){B(50,45,rf(44,47),rf(37,41),rf(-.2,.2),.25);L.lakes.push(blob(rf(30,38),rf(30,40),rf(9,12),rf(7,10),rf(0,3),.3));L.lakes.push(blob(rf(62,70),rf(50,60),rf(9,12),rf(7,10),rf(0,3),.3));}
  else if(kind==='gulf'){B(50,45,rf(44,47),rf(38,41),0,.22);const a=rf(0,6.28);L.lakes.push(blob(50+Math.cos(a)*34,45+Math.sin(a)*30,rf(18,24),rf(14,18),a,.25));}
  // どの形にも小さな湖を足すことがある
  if(!['many','arch','tri'].includes(kind))for(let k=0;k<Math.floor(R()*3);k++)L.lakes.push(blob(rf(25,75),rf(20,70),rf(3,5),rf(2.5,4),rf(0,3),.3));
  return L;}
// 気候
const CLIM=[{n:'温暖な地'},{n:'北に雪原'},{n:'南に密林'},{n:'西に砂漠'},{n:'東に砂漠'},{n:'北は雪・南は密林'},{n:'乾いた大地'},{n:'寒冷の地'},{n:'砂漠と密林'},{n:'中央に砂漠'}];
function bioAt(cl,x,y){if(!cl)return null;const w=4*Math.sin(x*.13+cl.a)+3*Math.sin(y*.21+cl.b);switch(cl.i){
  case 1:return y<28+w?'snow':null;case 2:return y>60+w?'jungle':null;case 3:return x<32+w?'sand':null;case 4:return x>68+w?'sand':null;
  case 5:return y<26+w?'snow':y>64+w?'jungle':null;case 6:return Math.sin(x*.09+cl.a)*Math.cos(y*.11+cl.b)>-.2?'sand':null;case 7:return y<70+w?'snow':null;
  case 8:return x<38+w?'sand':x>64+w?'jungle':null;case 9:return Math.hypot(x-50,(y-45)*1.2)<20+w?'sand':null;}return null;}
function genContinent(){
  for(let tryN=0;tryN<60;tryN++){const kind=pick(Object.keys(SHAPES));const L=genLand(kind);
    const ok=(x,y)=>landAt(L,x,y)&&landAt(L,x+2.5,y)&&landAt(L,x-2.5,y)&&landAt(L,x,y+2.5)&&landAt(L,x,y-2.5);
    const hot=R()<.35?[...Array(2+Math.floor(R()*2))].map(()=>[rf(15,85),rf(12,78)]):null;
    const pts=[];let md=rf(11,15),g=0;while(pts.length<21&&g<12000){g++;const x=rf(4,96),y=rf(4,86);if(!ok(x,y))continue;
      if(hot&&g<8000&&R()>.25+.75*Math.exp(-Math.min(...hot.map(h=>Math.hypot(h[0]-x,h[1]-y)))/16))continue;
      if(pts.every(p=>Math.hypot(p[0]-x,p[1]-y)>=md))pts.push([x,y]);else if(g%500===0)md*=.93;}
    if(pts.length<21)continue;
    const W=200,Hh=180,gd=new Int8Array(W*Hh);
    for(let py=0;py<Hh;py++)for(let px=0;px<W;px++){const x=px/W*100,y=py/Hh*90;if(!landAt(L,x,y)){gd[py*W+px]=-1;continue;}
      const nx=x+2.2*Math.sin(y*.45)+1.3*Math.sin(y*1.3+x*.2),ny=y+2.2*Math.cos(x*.4)+1.2*Math.sin(x*1.1);let b=0,bd=1e9;for(let i=0;i<21;i++){const d=(nx-pts[i][0])**2+(ny-pts[i][1])**2;if(d<bd){bd=d;b=i;}}gd[py*W+px]=b;}
    const cnt={};for(let py=0;py<Hh;py++)for(let px=0;px<W;px++){const a=gd[py*W+px];if(a<0)continue;[[1,0],[0,1]].forEach(([dx,dy])=>{const q=px+dx,r=py+dy;if(q>=W||r>=Hh)return;const b=gd[r*W+q];if(b<0||b===a)return;const k=a<b?a+'-'+b:b+'-'+a;cnt[k]=(cnt[k]||0)+1;});}
    const edges=Object.keys(cnt).filter(k=>cnt[k]>=3).map(k=>k.split('-').map(Number));
    // 海で分かれた島どうしは海路でつなぐ
    const comp=()=>{const adj=pts.map(()=>[]);edges.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a);});const c=new Array(21).fill(-1);let n=0;for(let i=0;i<21;i++){if(c[i]>=0)continue;const q=[i];c[i]=n;while(q.length){const u=q.pop();adj[u].forEach(v=>{if(c[v]<0){c[v]=n;q.push(v);}});}n++;}return {c,n};};
    const seaE=[];let C=comp();let guard=0;
    while(C.n>1&&guard++<10){let best=null,bd=1e9;for(let i=0;i<21;i++)for(let j=0;j<21;j++){if(C.c[i]===C.c[j])continue;const d=Math.hypot(pts[i][0]-pts[j][0],pts[i][1]-pts[j][1]);if(d<bd){bd=d;best=[i,j];}}edges.push(best);seaE.push(best);C=comp();}
    if(C.n>1)continue;
    if(L.blobs.length+(L.isles||[]).length>1&&R()<.7){// もう一本、別の海路
      let best=null,bd=1e9;const has=new Set(edges.map(e=>e.slice().sort((a,b)=>a-b).join('-')));for(let i=0;i<21;i++)for(let j=i+1;j<21;j++){if(has.has(i+'-'+j))continue;const lid=q=>{const all=L.blobs.concat(L.isles||[]);return all.findIndex(P=>inPoly(P,q[0],q[1]));};const sameLand=lid(pts[i])===lid(pts[j]);if(sameLand)continue;const d=Math.hypot(pts[i][0]-pts[j][0],pts[i][1]-pts[j][1]);if(d<bd&&d<34){bd=d;best=[i,j];}}if(best){edges.push(best);seaE.push(best);}}
    // 山脈・川・森
    const mtn=[];for(let k=0;k<Math.floor(R()*5);k++){let p=pick(pts).slice(),a=rf(0,6.28);p=[p[0]+rf(-6,6),p[1]+rf(-6,6)];const pl=[p];for(let s=0;s<4+Math.floor(R()*3);s++){a+=rf(-.6,.6);const q=[p[0]+Math.cos(a)*rf(8,12),p[1]+Math.sin(a)*rf(7,10)];if(!landAt(L,q[0],q[1]))break;pl.push(q);p=q;}if(pl.length>=3)mtn.push(pl);}
    const riv=[];for(let k=0;k<1+Math.floor(R()*4);k++){const src=mtn.length&&R()<.75?pick(pick(mtn)):pick(pts);let x=src[0],y=src[1],a=rf(0,6.28);const pl=[[x,y]];for(let s=0;s<45&&landAt(L,x,y);s++){a+=rf(-.45,.45);x+=Math.cos(a)*4;y+=Math.sin(a)*4;pl.push([x,y]);}if(pl.length>4)riv.push(pl);}
    const clim={i:Math.floor(R()*CLIM.length),a:rf(0,6.28),b:rf(0,6.28)};
    const forest=[];for(let k=0;k<1+Math.floor(R()*5);k++){const p=pick(pts);forest.push([p[0]+rf(-5,5),p[1]+rf(-5,5),rf(5,10)]);}
    pts.forEach(p=>{if(bioAt(clim,p[0],p[1])==='jungle'&&R()<.6)forest.push([p[0]+rf(-3,3),p[1]+rf(-3,3),rf(6,9)]);});
    return {pts,edges,seaE,L,kind,mtn,riv,forest,clim};}
  return null;}
// 地形を地理から決める
function terrainOf(p,C,coast){const dM=C.mtn.length?Math.min(...C.mtn.map(pl=>plDist(p,pl))):99,dR=C.riv.length?Math.min(...C.riv.map(pl=>plDist(p,pl))):99;const inF=C.forest.some(f=>Math.hypot(p[0]-f[0],p[1]-f[1])<f[2]);
  const bio=bioAt(C.clim,p[0],p[1]);let T;
  if(dM<4)T={t:'mountain',k:'mountain',d:'mountain'};else if(dM<8)T={t:'hills',k:'hills',d:'desert'};
  else if(dR<4)T=coast?{t:'yangtze',k:'river',d:'river'}:{t:'river',k:'river',d:'river'};else if(inF||bio==='jungle')T={t:'forest',k:'forest',d:'night'};
  else T={t:bio==='sand'&&R()<.4?'hills':'plain',k:'plain',d:'plain'};
  if(bio==='sand')T.d='desert';if(bio==='snow')T.d='snow';if(bio)T.bio=bio;return T;}
function growClusters(adj,sizes,fill){const N=adj.length;
  for(let t=0;t<400;t++){const own=new Array(N).fill(-1);const order=shuffle(sizes.map((_,i)=>i));let ok=true;
    for(const f of order){let free=[...Array(N).keys()].filter(i=>own[i]<0&&adj[i].every(n=>own[n]<0));if(!free.length)free=[...Array(N).keys()].filter(i=>own[i]<0&&adj[i].some(n=>own[n]<0));if(!free.length)free=[...Array(N).keys()].filter(i=>own[i]<0);if(!free.length){ok=false;break;}own[pick(free)]=f;}
    if(!ok)continue;const quota=sizes.map(s=>s-1);let guard=0;
    while(quota.some(x=>x>0)&&guard++<600){const f=pick(quota.map((x,i)=>x>0?i:-1).filter(i=>i>=0));const fr=[];own.forEach((o,i)=>{if(o===f)adj[i].forEach(n=>{if(own[n]<0)fr.push(n);});});
      if(!fr.length){if(t<300){ok=false;break;}quota[f]=0;continue;}own[pick(fr)]=f;quota[f]--;}
    if(!ok)continue;
    if(fill){let g2=0;while(own.some(o=>o<0)&&g2++<50)own.forEach((o,i)=>{if(o<0){const n=adj[i].filter(j=>own[j]>=0);if(n.length)own[i]=own[pick(n)];}});}
    return own;}
  return null;}
// 選べる項目
const WOPT=[
 {k:'map',n:'マップ',v:[['def','デフォルト'],['new','新大陸']]},
 {k:'sub',n:'配下',v:[['def','デフォルト'],['rand','ランダム']]},
 {k:'subn',n:'配下数',v:[['def','デフォルト'],['rand','ランダム']],need:o=>o.sub==='rand'},
 {k:'size',n:'初期都市数',v:[['def','デフォルト'],['rand','ランダム']]},
 {k:'blank',n:'空白地',v:[['def','デフォルト'],['few','少ない'],['none','なし']]},
 {k:'nf',n:'国数',v:[['def','デフォルト'],['many','多い'],['max','14'],['all','21']]},
 {k:'scale',n:'都市規模',v:[['def','デフォルト'],['rand','ランダム']]}];
function makeWorld(opt){return makeStaff(makePlacement(opt),opt);}
// ① 勢力配置：マップ・初期都市数・空白地・国数・国替
function makePlacement(opt){opt=Object.assign({map:'def',size:'def',blank:'def',nf:'def',swap:false},opt||{});
  const ri=(a,b)=>a+Math.floor(R()*(b-a+1));
  const groups={};BASE_FIDS.forEach(f=>{const cap=START.hero.find(x=>x[0]===FAC[f].ruler)[2];groups[f]=[cap].concat(RIDS.filter(r=>START.reg[r][0]===f&&r!==cap));});
  // 国数
  const EX=Object.keys(EXFAC);let fids=BASE_FIDS.slice();
  if(opt.nf==='many')fids=fids.concat(shuffle(EX.slice()).slice(0,ri(2,3)));else if(opt.nf==='max')fids=fids.concat(EX);else if(opt.nf==='all')fids=fids.concat(EX,Object.keys(EXFAC2));
  // 初期都市数と空白地
  const assign={};fids.forEach(f=>assign[f]=f);
  if(opt.swap){const base=fids.filter(f=>groups[f]);const p=shuffle(base.slice());base.forEach((f,i)=>assign[f]=p[i]);}
  let sizes=fids.map(f=>opt.size==='rand'?ri(1,3):groups[assign[f]]?groups[assign[f]].length:1);
  const sum=()=>sizes.reduce((a,b)=>a+b,0);
  const blanks=opt.blank==='few'?3:opt.blank==='none'?0:Math.max(0,21-sum());const target=Math.max(fids.length,21-blanks);
  let g=0;while(sum()>target&&g++<200){const i=pick(sizes.map((s,i)=>s>1?i:-1).filter(i=>i>=0));if(i===undefined)break;sizes[i]--;}
  g=0;while(sum()<target&&g++<200){const i=Math.floor(R()*sizes.length);if(sizes[i]<6)sizes[i]++;}
  const historic=opt.size==='def'&&opt.blank==='def'&&opt.nf==='def';
  let map=DEF_MAP,own={};RIDS.forEach(r=>own[r]=null);const lands={};
  const byDeg=(pts,adj)=>pts.sort((a,b)=>adj[b].length-adj[a].length);
  let geo=null;
  if(opt.map==='new'){let C=null,cl=null,adj=null;
    for(let k=0;k<25&&!cl;k++){C=(k<3&&opt.geo)?opt.geo:genContinent();if(!C)continue;adj=C.pts.map(()=>[]);C.edges.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a);});cl=growClusters(adj,sizes,opt.blank==='none');}
    if(!cl)return makePlacement(Object.assign({},opt,{map:'def'}));
    geo=C;
    const ids=new Array(21);const used=new Set();
    if(historic&&!opt.swap)fids.forEach((f,fi)=>{const pts=byDeg(cl.map((o,i)=>o===fi?i:-1).filter(i=>i>=0),adj);pts.forEach((p,k)=>{ids[p]=groups[f][k];used.add(groups[f][k]);});});
    if(!(historic&&!opt.swap)&&C.ids)C.ids.forEach((r,i)=>ids[i]=r);
    const rest=shuffle(RIDS.filter(r=>!used.has(r)&&!ids.includes(r)));cl.forEach((o,i)=>{if(!ids[i])ids[i]=rest.pop();});C.ids=ids.slice();
    fids.forEach((f,fi)=>{lands[f]=byDeg(cl.map((o,i)=>o===fi?i:-1).filter(i=>i>=0),adj).map(p=>ids[p]);});
    const r1=v=>Math.round(v*10)/10,R1=p=>[r1(p[0]),r1(p[1])];
    const pos=Object.fromEntries(C.pts.map((p,i)=>[ids[i],R1(p)]));const adjL=C.edges.map(([a,b])=>ids[a]+'-'+ids[b]);const seaL=C.seaE.map(([a,b])=>ids[a]+'-'+ids[b]);
    const reg={};C.pts.forEach((p,i)=>{const coast=!landAt(C.L,p[0]+7,p[1])||!landAt(C.L,p[0]-7,p[1])||!landAt(C.L,p[0],p[1]+7)||!landAt(C.L,p[0],p[1]-7);reg[ids[i]]=Object.assign(terrainOf(p,C,coast),{o:{}});});
    // 大きな城と関所
    RIDS.slice().sort((a,b)=>DEF_REG[b].cap-DEF_REG[a].cap).slice(0,5).forEach(r=>{if(reg[r].t==='plain'||reg[r].t==='river')Object.assign(reg[r],{t:'castle',k:reg[r].k,d:reg[r].d});});
    map={seeds:C.pts.map((p,i)=>[ids[i]].concat(R1(p))),out:C.L.blobs[0].map(R1),land:{blobs:C.L.blobs.map(b=>b.map(R1)),lakes:C.L.lakes.map(b=>b.map(R1)),isles:(C.L.isles||[]).map(b=>b.map(R1))},riv:C.riv.map(pl=>pl.map(R1)),mtn:C.mtn.map(pl=>pl.map(R1)),forest:C.forest.map(f=>f.map(r1)),
      adj:adjL,pos,reg,shape:SHAPES[C.kind]+' ・ '+CLIM[C.clim.i].n,clim:C.clim};
    map.et=edgeTypes(adjL,pos,map.riv,map.mtn,seaL);
    adjL.forEach(k=>{const[a,b]=k.split('-');if(map.et[k]==='road'&&(reg[a].t==='mountain'&&reg[b].t==='mountain'))map.et[k]='mount';});}
  else if(!historic){const ix={};RIDS.forEach((r,i)=>ix[r]=i);const adj=RIDS.map(()=>[]);DEF_MAP.adj.forEach(s=>{const[a,b]=s.split('-');adj[ix[a]].push(ix[b]);adj[ix[b]].push(ix[a]);});
    const cl=growClusters(adj,sizes,opt.blank==='none');if(!cl)return makePlacement(opt);
    fids.forEach((f,fi)=>{lands[f]=byDeg(cl.map((o,i)=>o===fi?i:-1).filter(i=>i>=0),adj).map(i=>RIDS[i]);});}
  else fids.forEach(f=>lands[f]=groups[assign[f]].slice());
  fids.forEach(f=>lands[f].forEach(r=>own[r]=f));
  const o_=Object.assign({},opt);delete o_.geo;
  return {opt:o_,fids,map,own,lands,groups,historic,geo};}
// ② 配下・配下数・都市規模（①の配置はそのまま）
function makeStaff(P,opt){opt=Object.assign({sub:'def',subn:'def',scale:'def'},opt||{});if(opt.sub!=='rand')opt.subn='def';
  const ri=(a,b)=>a+Math.floor(R()*(b-a+1));const {fids,own,lands,groups,historic}=P;let map=P.map;
  // 都市規模
  if(opt.scale==='rand'){map=Object.assign({},map,{reg:Object.assign({},map.reg||{})});RIDS.forEach(r=>{map.reg[r]=Object.assign({},map.reg[r]||{},{cap:Math.round(DEF_REG[r].cap*rf(.55,1.6)/1000)*1000});});}
  // 武将
  const neu=()=>RIDS.filter(r=>!own[r]);const rulers=new Set(fids.map(f=>FAC[f].ruler));
  const place={};fids.forEach(f=>place[FAC[f].ruler]=[f,lands[f][0]]);
  START.hero.forEach(([id,f,loc])=>{if(rulers.has(id))return;
    if(f&&fids.includes(f)){const k=Math.max(0,groups[f].indexOf(loc));const L=lands[f];place[id]=[f,L[k%L.length]];}
    else if(f){const n=neu();place[id]=n.length&&R()<.5?['none',pick(n)]:[null,pick(RIDS)];}
    else{const n=neu();place[id]=own[loc]?(n.length?['none',pick(n)]:[null,pick(RIDS)]):['none',loc];}});
  START.free.forEach(([id,loc])=>{if(!rulers.has(id))place[id]=[null,loc];});
  fids.filter(f=>EXFAC[f]||EXFAC2[f]).forEach(f=>{const fr=shuffle(Object.keys(place).filter(id=>place[id][0]===null));fr.slice(0,ri(1,3)).forEach(id=>place[id]=[f,pick(lands[f])]);});
  if(opt.sub==='rand'&&opt.subn==='def'){const ids=Object.keys(place).filter(id=>!rulers.has(id));const slots=ids.map(id=>place[id]);const sh=shuffle(ids.slice());sh.forEach((id,i)=>place[id]=slots[i]);}
  else if(opt.sub==='rand'){const pool=shuffle(Object.keys(place).filter(id=>!rulers.has(id)));
    fids.forEach(f=>{const n=ri(0,6);for(let i=0;i<n&&pool.length;i++)place[pool.pop()]=[f,pick(lands[f])];});
    neu().forEach(r=>{const n=ri(0,2);for(let i=0;i<n&&pool.length;i++)place[pool.pop()]=['none',r];});
    while(pool.length)place[pool.pop()]=[null,pick(RIDS)];}
  // 物語の文言用
  const o=Object.assign({},P.opt,opt);o.newland=o.map==='new';o.swapped=!historic||!!P.opt.swap;o.mix=o.sub==='rand';
  return {opt:o,fids,map,own,place,P};}

/* ================= 状態 ================= */
const SKEY='sangoku-haou-v1';
let S=null;
function save(){if(!S)return;try{localStorage.setItem(SKEY,JSON.stringify(S));}catch(e){}}
function load(){try{const v=JSON.parse(localStorage.getItem(SKEY));if(v&&v.v===1){setFactions(v.fids);return migrate(v);}}catch(e){}return null;}
function newGame(me,W){W=W||makeWorld({});
  S={v:1,me,year:194,season:0,turn:0,ap:0,reg:{},hero:{},flags:{},visits:{},met:{},news:[],stats:{war:0,win:0,duel:0,dwon:0,recruit:0,capt:0},rulers:{},map:W.map,opt:W.opt,fids:W.fids};
  setFactions(W.fids);applyMap(S.map);
  RIDS.forEach(r=>{const o=W.own[r]||null,t=START.reg[r][1];S.reg[r]={o,tr:Math.min(REG[r].cap,o?Math.max(t,8000):Math.min(t,7000))};});
  Object.keys(W.place).forEach(id=>{const[f,loc]=W.place[id];S.hero[id]={f:f===null?null:f,loc,lv:f&&f!=='none'?1+Math.floor(R()*2):1,exp:0,tired:0};});
  FIDS.forEach(f=>S.rulers[f]=FAC[f].ruler);
  Object.keys(S.hero).forEach(id=>{if(S.hero[id].f===me)S.met[id]=1;});
  S.ap=apMax();migrate(S);save();
}
/* 城の守り・金・負傷兵（後から足した項目） */
function migrate(o){if(!o)return o;o.gold=o.gold==null?3000:o.gold;o.fgold=o.fgold||{};
  const caps={};FIDS.forEach(f=>{const h=o.hero&&o.hero[FAC[f].ruler];if(h&&h.f===f)caps[h.loc]=1;});
  RIDS.forEach(r=>{const g=o.reg[r];if(g.wall==null){g.wall=caps[r]?2:1;g.bld=caps[r]?[{t:'yumi',lv:1},{t:'yumi',lv:1}]:g.o?[{t:'yumi',lv:1}]:[];}g.inj=g.inj||0;});return o;}
const H=id=>S.hero[id];
const owner=r=>S.reg[r].o;
const regsOf=f=>RIDS.filter(r=>S.reg[r].o===f);
const alive=f=>regsOf(f).length>0;
const heroesAt=(r,f)=>Object.keys(S.hero).filter(id=>{const h=S.hero[id];return h.loc===r&&h.f!=null&&h.f===(f===undefined?S.reg[r].o||'none':f)&&!h.cap;});
const freeAt=r=>Object.keys(S.hero).filter(id=>{const h=S.hero[id];return h.loc===r&&h.f===null&&!h.cap;});
const heroesOf=f=>Object.keys(S.hero).filter(id=>S.hero[id].f===f&&!S.hero[id].cap);
const captivesOf=f=>Object.keys(S.hero).filter(id=>S.hero[id].cap===f);
const facCol=f=>f&&FAC[f]?FAC[f].col:NEUTRAL.col;
const facName=f=>f&&FAC[f]?FAC[f].n:NEUTRAL.n;
const rulerOf=f=>S.rulers[f];
function apMax(){const n=regsOf(S.me).length;return Math.min(6,3+Math.floor(n/4)+(S.flags.emperor===S.me?1:0));}
function lvMul(id){return 1+.02*((S.hero[id]?S.hero[id].lv:1)-1);}
function st(id){const h=HB(id),m=lvMul(id);return {p:Math.round(h.p*m),i:Math.round(h.i*m),cmd:Math.round((h.cmd||60)*m),cha:h.cha||60,pol:h.pol||50};}
const expNeed=lv=>80+lv*40;
function giveExp(id,x){const h=S.hero[id];if(!h)return false;h.exp+=x;let up=false;while(h.lv<20&&h.exp>=expNeed(h.lv)){h.exp-=expNeed(h.lv);h.lv++;up=true;}return up;}
function line(id,k){const h=HB(id);if(!h)return '';let t='';
  if(typeof HL!=='undefined'&&HL[id]&&HL[id][k]&&HL[id][k].length)t=pick(HL[id][k])[1];
  if(!t)t=k==='sp'?h.sp:k==='win'?h.win:k==='lose'?h.lose:'';
  if(!t&&typeof LN!=='undefined'&&LN[k])t=pick(LN[k])[1];
  try{return dial(t||'',id);}catch(e){return t||'';}}
function heroPower(id){const s=st(id);return s.p*.6+s.cmd*.8+s.i*.4;}

/* ================= 地図 ================= */
const BW=1000,BH=900;
let GRID=null,BASE=null,BCTX=null,RIDX={};
const view={s:1,ox:0,oy:0,fit:1};
const UIS={mode:'',sel:null,targets:[],arrows:[],pulse:0};
function mapInOut(x,y){return landAt(LAND,x,y);}
function buildGrid(){GRID=new Int8Array(BW*BH);RIDS.forEach((r,i)=>RIDX[r]=i);
  for(let py=0;py<BH;py++)for(let px=0;px<BW;px++){const x=px/BW*100,y=py/BH*90;if(!mapInOut(x,y)){GRID[py*BW+px]=-1;continue;}
    const nx=x+2.2*Math.sin(y*.45)+1.3*Math.sin(y*1.3+x*.2),ny=y+2.2*Math.cos(x*.4)+1.2*Math.sin(x*1.1);let b=0,bd=1e9;
    for(let i=0;i<MAP_SEEDS.length;i++){const s=MAP_SEEDS[i];const d=(nx-s[1])*(nx-s[1])+(ny-s[2])*(ny-s[2]);if(d<bd){bd=d;b=i;}}
    GRID[py*BW+px]=RIDX[MAP_SEEDS[b][0]];}
  BASE=document.createElement('canvas');BASE.width=BW;BASE.height=BH;BCTX=BASE.getContext('2d');}
function hexRgb(h){const n=parseInt(h.slice(1),16);return [n>>16,n>>8&255,n&255];}
const TGL={castle:'城',gate:'関',plain:'平',river:'川',yangtze:'江',hills:'丘',mountain:'山',forest:'森'};
function glyphMtn(x,cx,cy,s_){x.fillStyle='#8a7a62';x.strokeStyle='#4a3a28';x.lineWidth=1.6;x.beginPath();x.moveTo(cx-s_,cy+s_*.6);x.lineTo(cx,cy-s_);x.lineTo(cx+s_,cy+s_*.6);x.closePath();x.fill();x.stroke();
  x.fillStyle='#f0ece0';x.beginPath();x.moveTo(cx-s_*.32,cy-s_*.36);x.lineTo(cx,cy-s_);x.lineTo(cx+s_*.32,cy-s_*.36);x.closePath();x.fill();}
function glyphTree(x,cx,cy,s_){x.fillStyle='#4a3020';x.fillRect(cx-1.2,cy,2.4,s_*.7);x.fillStyle='#3f6a32';x.strokeStyle='#22401c';x.lineWidth=1.2;x.beginPath();x.arc(cx,cy-s_*.2,s_*.62,0,7);x.fill();x.stroke();}
function glyphHill(x,cx,cy,s_){x.fillStyle='#a89060';x.strokeStyle='#5a4a2a';x.lineWidth=1.4;x.beginPath();x.moveTo(cx-s_,cy+s_*.4);x.quadraticCurveTo(cx,cy-s_*.9,cx+s_,cy+s_*.4);x.closePath();x.fill();x.stroke();}
function paintBase(){const W=BW,Hh=BH,x=BCTX,g=GRID;const img=x.createImageData(W,Hh),a=img.data;
  const BIOC={sand:[236,206,140],snow:[244,246,250],jungle:[168,196,128]},PAR=[228,214,180];
  const fc=RIDS.map(r=>hexRgb(facCol(S.reg[r].o))),fk=RIDS.map(r=>S.reg[r].o?.58:0);
  const GW=W>>2,GH=Hh>>2,bg=new Array(GW*GH);for(let yy=0;yy<GH;yy++)for(let xx=0;xx<GW;xx++){const b=CLIM_CUR?bioAt(CLIM_CUR,xx*4/W*100,yy*4/Hh*90):null;bg[yy*GW+xx]=b?BIOC[b]:PAR;}
  for(let i=0;i<W*Hh;i++){const s_=g[i],o=i*4;const px=i%W,py=i/W|0;const n=((px*13+py*7)%11)/11*12+((px*7+py*3)%5)*1.5;
    if(s_<0){const near=(px>1&&g[i-2]>=0)||(px<W-2&&g[i+2]>=0)||(py>1&&g[i-2*W]>=0)||(py<Hh-2&&g[i+2*W]>=0);a[o]=(near?120:150)+n;a[o+1]=(near?160:176)+n;a[o+2]=(near?176:178)+n;a[o+3]=255;continue;}
    const pc=bg[Math.min(GH-1,py>>2)*GW+Math.min(GW-1,px>>2)],f=fc[s_],k_=fk[s_];const c=[f[0]*k_+pc[0]*(1-k_),f[1]*k_+pc[1]*(1-k_),f[2]*k_+pc[2]*(1-k_)];
    const l=px>0?g[i-1]:s_,u=py>0?g[i-W]:s_,rr=px<W-1?g[i+1]:s_,d=py<Hh-1?g[i+W]:s_;
    let k=1;if(l<0||u<0||rr<0||d<0)k=.3;else if(l!==s_||u!==s_){k=S.reg[RIDS[l!==s_?l:u]].o!==S.reg[RIDS[s_]].o?.4:.78;}
    a[o]=c[0]*k+n;a[o+1]=c[1]*k+n;a[o+2]=c[2]*k+n;a[o+3]=255;}
  x.putImageData(img,0,0);
  const sx=W/100,sy=Hh/90;x.lineCap='round';x.lineJoin='round';
  MAP_RIV.forEach(r=>{x.strokeStyle='rgba(30,80,140,.8)';x.lineWidth=6;x.beginPath();r.forEach((p,i)=>i?x.lineTo(p[0]*sx,p[1]*sy):x.moveTo(p[0]*sx,p[1]*sy));x.stroke();});
  // 地形の絵
  const R0=mulb(7);
  if(MAP_MTN.length||MAP_FOR.length){MAP_FOR.forEach(f=>{for(let k=0;k<Math.round(f[2]*1.6);k++){const a_=R0()*6.28,d=Math.sqrt(R0())*f[2];const X=f[0]+Math.cos(a_)*d,Y=f[1]+Math.sin(a_)*d;if(mapInOut(X,Y)&&RIDS.every(r=>Math.hypot(REG[r].x-X,REG[r].y-Y)>4.5))glyphTree(x,X*sx,Y*sy,9);}});
    MAP_MTN.forEach(pl=>{for(let i=0;i<pl.length-1;i++){const A=pl[i],B=pl[i+1],n=Math.max(2,Math.round(Math.hypot(B[0]-A[0],B[1]-A[1])/2.6));for(let j=0;j<=n;j++){const t=j/n,X=A[0]+(B[0]-A[0])*t+(R0()-.5)*2,Y=A[1]+(B[1]-A[1])*t+(R0()-.5)*2;if(mapInOut(X,Y)&&RIDS.every(r=>Math.hypot(REG[r].x-X,REG[r].y-Y)>4))glyphMtn(x,X*sx,Y*sy,13+R0()*5);}}});}
  RIDS.forEach(r=>{const t=REG[r].t,cx=REG[r].x,cy=REG[r].y;const spots=[[-5.5,-2.5],[5.5,-2.5],[-6,2],[6,2]];
    spots.forEach(([dx,dy],k)=>{const X=cx+dx,Y=cy+dy;if(!mapInOut(X,Y)||k>=(t==='plain'||t==='castle'?0:t==='river'||t==='yangtze'?0:4))return;
      if(t==='mountain'||t==='gate')glyphMtn(x,X*sx,Y*sy,12);else if(t==='hills')glyphHill(x,X*sx,Y*sy,11);else if(t==='forest')glyphTree(x,X*sx,Y*sy,9);});});
  if(CLIM_CUR){const R1=mulb(11);for(let yy=2;yy<90;yy+=2.6)for(let xx=2;xx<100;xx+=2.6){const X=xx+(R1()-.5)*1.6,Y=yy+(R1()-.5)*1.6;const b=bioAt(CLIM_CUR,X,Y);if(!b||!mapInOut(X,Y)||R1()>.32)continue;if(RIDS.some(r=>Math.hypot(REG[r].x-X,REG[r].y-Y)<4.5))continue;
      const cx=X*sx,cy=Y*sy;if(b==='snow'){x.fillStyle='rgba(255,255,255,.95)';x.strokeStyle='rgba(120,140,160,.6)';x.lineWidth=1;x.beginPath();x.arc(cx,cy,2.6,0,7);x.fill();x.stroke();}
      else if(b==='sand'){x.strokeStyle='rgba(150,110,50,.7)';x.lineWidth=2;x.beginPath();x.arc(cx,cy+4,7,Math.PI*1.15,Math.PI*1.85);x.stroke();}
      else glyphTree(x,cx,cy,7);}}
  x.textAlign='center';x.textBaseline='middle';x.font='700 22px "Yuji Syuku",serif';
  if(!(S.map&&S.map.land))RIDS.forEach(r=>{const R_=REG[r];x.fillStyle='rgba(40,24,10,.38)';x.fillText(R_.n,R_.x*sx,(R_.y-5.2)*sy);});}
function mulb(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function fitView(){const cv=$('#map');const w=cv.clientWidth,h=cv.clientHeight;view.fit=Math.min(w/BW,h/BH);if(!view.init){view.s=1;view.ox=(w-BW*view.fit)/2;view.oy=(h-BH*view.fit)/2;view.init=1;}}
function toScr(x,y){const k=view.fit*view.s;return [view.ox+x*k,view.oy+y*k];}
function toBase(X,Y){const k=view.fit*view.s;return [(X-view.ox)/k,(Y-view.oy)/k];}
let dirty=true;
function draw(){const cv=$('#map');const dpr=Math.min(2,devicePixelRatio||1);const w=cv.clientWidth,h=cv.clientHeight;
  if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}
  const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.fillStyle='#8fa6a6';x.fillRect(0,0,w,h);
  const k=view.fit*view.s;x.save();x.translate(view.ox,view.oy);x.scale(k,k);x.imageSmoothingEnabled=true;x.drawImage(BASE,0,0);
  const sx=BW/100,sy=BH/90;
  // roads
  const RS={road:['#5a3a1a',[12,7]],river:['#1f5f9e',[12,7]],mount:['#5a5a5a',[5,5]],sea:['#0f4a8a',[3,9]]};
  ADJ_L.forEach(s_=>{const[a,b]=s_.split('-');const tp=ET[s_]||'road';const hi=UIS.sel&&(a===UIS.sel||b===UIS.sel);const A=[REG[a].x*sx,REG[a].y*sy],B=[REG[b].x*sx,REG[b].y*sy];
    x.setLineDash([]);x.strokeStyle=hi?'rgba(255,240,180,.95)':'rgba(255,248,230,.55)';x.lineWidth=hi?12:8;x.beginPath();x.moveTo(A[0],A[1]);x.lineTo(B[0],B[1]);x.stroke();
    x.setLineDash(RS[tp][1]);x.strokeStyle=RS[tp][0];x.lineWidth=hi?6:4.2;x.beginPath();x.moveTo(A[0],A[1]);x.lineTo(B[0],B[1]);x.stroke();x.setLineDash([]);
    if(tp!=='road'){const mx=(A[0]+B[0])/2,my=(A[1]+B[1])/2;x.fillStyle='rgba(255,250,235,.92)';x.strokeStyle=RS[tp][0];x.lineWidth=2;x.beginPath();x.arc(mx,my,14,0,7);x.fill();x.stroke();
      x.fillStyle=RS[tp][0];x.font='700 17px "BIZ UDPGothic",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(tp==='sea'?'舟':tp==='river'?'渡':'峠',mx,my+.5);}});
  const t=performance.now()/1000;
  // targets
  UIS.targets.forEach(r=>{const p=[REG[r].x*sx,REG[r].y*sy];x.strokeStyle='rgba(220,40,20,'+(.6+.4*Math.sin(t*5))+')';x.lineWidth=5;x.beginPath();x.arc(p[0],p[1],34+3*Math.sin(t*5),0,7);x.stroke();});
  // arrows
  UIS.arrows.forEach(A=>{const a=[REG[A.a].x*sx,REG[A.a].y*sy],b=[REG[A.b].x*sx,REG[A.b].y*sy];const kk=clamp((t-A.t0)/.6,0,1);const ex=a[0]+(b[0]-a[0])*kk*.82,ey=a[1]+(b[1]-a[1])*kk*.82;
    x.strokeStyle=A.col;x.lineWidth=9;x.globalAlpha=.85;x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(ex,ey);x.stroke();const an=Math.atan2(b[1]-a[1],b[0]-a[0]);
    x.fillStyle=A.col;x.beginPath();x.moveTo(ex+Math.cos(an)*20,ey+Math.sin(an)*20);x.lineTo(ex+Math.cos(an+2.5)*18,ey+Math.sin(an+2.5)*18);x.lineTo(ex+Math.cos(an-2.5)*18,ey+Math.sin(an-2.5)*18);x.fill();x.globalAlpha=1;});
  // cities
  RIDS.forEach(r=>{const R_=REG[r],o=S.reg[r].o;const cx=R_.x*sx,cy=R_.y*sy;const sel=UIS.sel===r;
    if(sel){x.strokeStyle='rgba(255,236,160,'+(.7+.3*Math.sin(t*4))+')';x.lineWidth=6;x.beginPath();x.arc(cx,cy,30,0,7);x.stroke();}
    const mine=o===S.me;
    x.fillStyle='rgba(0,0,0,.35)';x.beginPath();x.ellipse(cx,cy+18,22,6,0,0,7);x.fill();
    x.fillStyle=o?facCol(o):'#9a8a68';x.strokeStyle=mine?'#ffe08a':'#20140a';x.lineWidth=mine?4:2.5;x.beginPath();x.arc(cx,cy,19,0,7);x.fill();x.stroke();
    x.fillStyle='#fff';x.font='400 24px "Yuji Syuku",serif';x.textAlign='center';x.textBaseline='middle';x.fillText(o?FAC[o].ch:'城',cx,cy+1);
    x.font='700 17px "BIZ UDPGothic",sans-serif';x.lineWidth=4;x.strokeStyle='rgba(255,250,235,.92)';x.strokeText(R_.c,cx,cy+33);x.fillStyle='#24160a';x.fillText(R_.c,cx,cy+33);
    {const tc=R_.bio&&R_.t!=='castle'?({sand:'#b08030',snow:'#7a90a8',jungle:'#1f6a2a'})[R_.bio]:({castle:'#7a1c12',gate:'#4a4a52',plain:'#6a5a2a',river:'#1f5f9e',yangtze:'#0f4a8a',hills:'#7a5a2a',mountain:'#4a4a4a',forest:'#2f5a2a'}[R_.t]||'#555');x.fillStyle=tc;x.strokeStyle='#fff';x.lineWidth=2;x.fillRect(cx-44,cy-27,24,24);x.strokeRect(cx-44,cy-27,24,24);x.fillStyle='#fff';x.font='700 17px "BIZ UDPGothic",sans-serif';x.fillText(R_.bio&&R_.t!=='castle'?({sand:'砂',snow:'雪',jungle:'密'})[R_.bio]:(TGL[R_.t]||''),cx-32,cy-14.5);}
    const nh=heroesAt(r).length;const lab=man(S.reg[r].tr)+(nh?' 将'+nh:'')+' 壁'+(S.reg[r].wall||0);x.font='700 14px "BIZ UDPGothic",sans-serif';const tw=x.measureText(lab).width+12;
    x.fillStyle='rgba(20,12,6,.78)';x.fillRect(cx-tw/2,cy+43,tw,19);x.fillStyle=mine?'#ffe08a':'#f2e6c8';x.fillText(lab,cx,cy+53);
    if(freeAt(r).length&&mine){x.fillStyle='#7fd08e';x.beginPath();x.arc(cx+20,cy-16,7,0,7);x.fill();x.fillStyle='#062';x.font='700 11px sans-serif';x.fillText('才',cx+20,cy-15.5);}});
  x.restore();
  dirty=false;}
function loop(){if(S&&(dirty||UIS.targets.length||UIS.arrows.length||UIS.sel))draw();requestAnimationFrame(loop);}
function regionAt(X,Y){const[bx,by]=toBase(X,Y);let best=null,bd=40*40;RIDS.forEach(r=>{const dx=REG[r].x*BW/100-bx,dy=REG[r].y*BH/90-by;const d=dx*dx+dy*dy;if(d<bd){bd=d;best=r;}});if(best)return best;
  const ix=Math.floor(bx),iy=Math.floor(by);if(ix<0||iy<0||ix>=BW||iy>=BH)return null;const g=GRID[iy*BW+ix];return g>=0?RIDS[g]:null;}
function bindMap(){const cv=$('#map');const P=new Map();let down=null,pinch=0;
  cv.addEventListener('pointerdown',e=>{try{SND.init();}catch(_){}P.set(e.pointerId,[e.clientX,e.clientY]);if(P.size===1)down={x:e.clientX,y:e.clientY,ox:view.ox,oy:view.oy,moved:false};else{const a=[...P.values()];pinch=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);if(down)down.moved=true;}});
  cv.addEventListener('pointermove',e=>{if(!P.has(e.pointerId))return;P.set(e.pointerId,[e.clientX,e.clientY]);
    if(P.size===2){const a=[...P.values()];const d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);const r=cv.getBoundingClientRect();const mx=(a[0][0]+a[1][0])/2-r.left,my=(a[0][1]+a[1][1])/2-r.top;if(pinch)zoomAt(d/pinch,mx,my);pinch=d;return;}
    if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.abs(dx)+Math.abs(dy)>8)down.moved=true;if(down.moved){view.ox=down.ox+dx;view.oy=down.oy+dy;clampView();dirty=true;}});
  const up=e=>{const was=P.has(e.pointerId);P.delete(e.pointerId);if(P.size<2)pinch=0;if(was&&down&&!down.moved&&e.type==='pointerup'&&P.size===0){const r=cv.getBoundingClientRect();tapRegion(regionAt(e.clientX-r.left,e.clientY-r.top));}if(!P.size)down=null;else if(P.size===1){const v=[...P.values()][0];down={x:v[0],y:v[1],ox:view.ox,oy:view.oy,moved:true};}};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect();zoomAt(e.deltaY<0?1.15:1/1.15,e.clientX-r.left,e.clientY-r.top);},{passive:false});
  $('#zIn').onclick=()=>{const cv2=$('#map');zoomAt(1.3,cv2.clientWidth/2,cv2.clientHeight/2);};
  $('#zOut').onclick=()=>{const cv2=$('#map');zoomAt(1/1.3,cv2.clientWidth/2,cv2.clientHeight/2);};
  addEventListener('resize',()=>{const s=view.s;view.init=0;fitView();if(s!==1){view.s=1;}clampView();dirty=true;});}
function zoomAt(f,mx,my){const ns=clamp(view.s*f,1,3.2);const k0=view.fit*view.s,k1=view.fit*ns;view.ox=mx-(mx-view.ox)*k1/k0;view.oy=my-(my-view.oy)*k1/k0;view.s=ns;clampView();dirty=true;}
function clampView(){const cv=$('#map');const w=cv.clientWidth,h=cv.clientHeight,k=view.fit*view.s;const mw=BW*k,mh=BH*k;
  view.ox=mw<=w?(w-mw)/2:clamp(view.ox,w-mw,0);view.oy=mh<=h?(h-mh)/2:clamp(view.oy,h-mh,0);}
function focusReg(r){const cv=$('#map');const k=view.fit*view.s;const w=cv.clientWidth,h=cv.clientHeight;if(view.s<1.05)return;view.ox=w/2-REG[r].x*BW/100*k;view.oy=h*.4-REG[r].y*BH/90*k;clampView();dirty=true;}
function repaint(){paintBase();dirty=true;topBar();}

/* ================= 画面の部品 ================= */
function topBar(){if(!S)return;const f=FAC[S.me];const rid=rulerOf(S.me);
  let ap='';for(let i=0;i<apMax();i++)ap+='<u class="'+(i<S.ap?'on':'')+'"></u>';
  $('#top').innerHTML='<span class="when">'+S.year+'年 '+SEASON[S.season]+'</span><span class="lord"><img alt="" src="'+portrait(HB(rid))+'"><b style="color:'+f.col+';filter:brightness(1.5)">'+f.n+'</b></span><span class="sp"></span>'+
    '<span class="pill"><i>金</i>'+man(S.gold)+'</span><span class="pill"><i>領</i>'+regsOf(S.me).length+'/21</span><span class="pill"><i>将</i>'+heroesOf(S.me).length+'</span><span class="pill"><i>令</i><span class="ap">'+ap+'</span></span>';
  $('#cEnd').classList.toggle('hot',S.ap<=0);$('#cWar').classList.toggle('hot',S.ap>0);}
function toast(s,ms){const d=el('div','',esc(s));$('#toast').appendChild(d);setTimeout(()=>d.remove(),ms||2600);}
function banner(t,s){const b=el('div','banner',(s?'<small>'+esc(s)+'</small>':'')+esc(t));$('#stage').appendChild(b);setTimeout(()=>b.remove(),2500);}
function hint(s){const h=$('#hint');if(!s){h.hidden=true;return;}h.hidden=false;h.textContent=s;}
function closeSheet(){document.querySelectorAll('#ui .sheet').forEach(e=>e.remove());}
function sheet(title,body,foot,cls){closeSheet();const d=el('div','sheet'+(cls?' '+cls:''));
  d.innerHTML='<div class="sh-h"><h2>'+title+'</h2><button class="x" type="button" aria-label="閉じる">×</button></div><div class="sh-b">'+body+'</div>'+(foot?'<div class="sh-f">'+foot+'</div>':'');
  $('#ui').appendChild(d);d.querySelector('.x').onclick=()=>{d.remove();UIS.sel=null;dirty=true;if(d.onclose)d.onclose();};return d;}
function heroCard(id,o){o=o||{};const h=HB(id),s=st(id),r=S.hero[id];
  const tag=o.tag?'<span class="tag'+(o.tagR?' r':'')+'">'+o.tag+'</span>':'';
  return '<'+(o.btn?'button type="button" data-h="'+id+'"':'div')+' class="hc'+(o.on?' on':'')+(o.off?' off':'')+'">'+tag+'<img alt="" src="'+portrait(h)+'"><div style="min-width:0"><b>'+h.n+' <span style="font-family:var(--f-body);font-size:11px;color:var(--gold)">Lv'+(r?r.lv:1)+'</span></b><small>武'+s.p+' 統'+s.cmd+' 知'+s.i+(o.sub?'<br>'+o.sub:'')+'</small></div></'+(o.btn?'button':'div')+'>';}
function choiceSheet(title,html,btns){return new Promise(res=>{const foot=btns.map((b,i)=>'<button class="btn'+(b.pri?' pri':'')+'" type="button" data-i="'+i+'">'+b.t+'</button>').join('');
  const d=sheet(title,html,foot);d.querySelector('.x').hidden=!btns.some(b=>b.cancel);d.querySelectorAll('[data-i]').forEach(e=>e.onclick=()=>{d.remove();res(btns[+e.dataset.i].v);});
  d.onclose=()=>res(null);});}
/* ---- 城の守り ---- */
const FB={yumi:{n:'弓楼',c:400,w:1,d:'矢で一部隊ずつ射る。射程が長い'},doki:{n:'連弩台',c:700,w:2,d:'近くの敵に矢を浴びせ続ける'},toseki:{n:'投石機',c:1200,w:3,d:'密集した敵をまとめて潰す。近くは狙えない'},kaen:{n:'火計台',c:1600,w:4,d:'周りの敵をまとめて焼く'},trap:{n:'地雷火',c:300,w:2,d:'城の外に埋める。踏んだ敵の周りを爆破'}};
const wallCost=lv=>Math.round(700*Math.pow(lv,1.5));
const bldSlots=r=>Math.min(6,S.reg[r].wall+1);
function fortMul(r){const g=S.reg[r];if(!g||g.wall==null)return 1;return 1+.1*g.wall+.05*g.bld.reduce((a,b)=>a+b.lv,0);}
function income(f){return regsOf(f).reduce((a,r)=>a+300+Math.round(REG[r].cap/40),0);}
const trCap=id=>Math.max(1000,Math.floor(st(id).cmd/10)*1000);
function alloc(ids,tr){const o={};const caps=ids.map(trCap),sum=caps.reduce((a,b)=>a+b,0);
  if(tr>=sum){ids.forEach((id,i)=>o[id]=caps[i]);return {per:o,reserve:tr-sum};}
  let left=tr;ids.forEach((id,i)=>{o[id]=Math.floor(caps[i]*tr/sum/1000)*1000;left-=o[id];});
  for(let k=0;left>=1000&&k<20;k++)ids.forEach((id,i)=>{if(left>=1000&&o[id]<caps[i]){o[id]+=1000;left-=1000;}});
  return {per:o,reserve:Math.max(0,left)};}
function strength(ids,tr,def,r){let top=0,sum=0;ids.forEach(id=>{const s=st(id);top=Math.max(top,s.cmd);sum+=s.p*.05+s.i*.035;});
  let v=(tr/1000)*(.55+top/180)+sum+(ids.length?0:-.5);if(def)v*=(REG[r]&&(REG[r].t==='castle'||REG[r].t==='gate')?1.15:1.05)*fortMul(r);return Math.max(.3,v);}
function winP(a,d){return a*a/(a*a+d*d);}

/* ================= 地域をタップ ================= */
function tapRegion(r){if(!r||!S)return;try{SND.click();}catch(_){}
  if(UIS.mode==='target'){if(UIS.targets.includes(r)){const cb=UIS.cb;endTargetMode();cb(r);}else if(r){toast('攻められるのは赤い輪の地域だけ');}return;}
  UIS.sel=r;dirty=true;regionSheet(r);}
function regionSheet(r){const R_=REG[r],o=S.reg[r].o,mine=o===S.me;
  const hs=heroesAt(r);const fr=freeAt(r);
  let b='<div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">'+R_.n+' ・ '+R_.c+'</h3><span class="pill" style="border-color:'+facCol(o)+'"><i>'+(o?FAC[o].ch:'')+'</i>'+facName(o)+'</span></div>'+
    '<dl class="kv" style="margin-top:6px"><dt>兵</dt><dd>'+man(S.reg[r].tr)+' / '+man(R_.cap)+(mine&&S.reg[r].inj?' <small class="muted">（負傷 '+man(S.reg[r].inj)+' が次の季節に戻る）</small>':'')+'</dd><dt>地形</dt><dd>'+({castle:'城',gate:'関所',plain:'平原',river:'川',yangtze:'長江',hills:'丘',mountain:'山',forest:'森'})[R_.t]+'</dd><dt>隣</dt><dd>'+ADJ[r].map(n=>{const tp=edgeOf(r,n);return '<span style="color:'+facCol(S.reg[n].o)+';filter:brightness(1.4)">'+REG[n].c+'</span>'+(tp!=='road'?'<small class="muted">（'+({river:'渡河',mount:'峠',sea:'海路'})[tp]+'）</small>':'');}).join('・')+'</dd></dl></div>';
  b+='<h3 class="sec">武将</h3>'+(hs.length?'<div class="grid">'+hs.map(id=>heroCard(id,{tag:id===rulerOf(o)?'君主':S.hero[id].tired?'疲労':'',tagR:id===rulerOf(o)})).join('')+'</div>':'<p class="muted" style="margin:0">'+(o?'武将はいない':'土地の兵が守っている')+'</p>');
  b+=fortHtml(r,mine);
  if(mine&&fr.length)b+='<h3 class="sec">在野の人材</h3><div class="grid">'+fr.map(id=>heroCard(id,{btn:true,sub:'登用を試せる'})).join('')+'</div>';
  let f='';
  if(mine){f+='<button class="btn" type="button" id="rDraft"'+(S.ap<1||S.reg[r].tr>=R_.cap?' disabled':'')+'>徴兵（令1）</button><button class="btn" type="button" id="rMove">移動</button>';
    if(ADJ[r].some(n=>S.reg[n].o!==S.me))f+='<button class="btn pri" type="button" id="rAtk"'+(S.ap<1?' disabled':'')+'>ここから出陣</button>';}
  else if(ADJ[r].some(n=>S.reg[n].o===S.me))f+='<button class="btn pri" type="button" id="rAtk2"'+(S.ap<1?' disabled':'')+'>攻める（令1）</button>';
  const d=sheet(R_.c,b,f);
  const q=s=>d.querySelector(s);
  if(q('#rDraft'))q('#rDraft').onclick=()=>{draft(r);regionSheet(r);};
  if(q('#rMove'))q('#rMove').onclick=()=>moveSheet(r);
  if(q('#rAtk'))q('#rAtk').onclick=()=>startTarget(ADJ[r].filter(n=>S.reg[n].o!==S.me));
  if(q('#rAtk2'))q('#rAtk2').onclick=()=>{closeSheet();muster(r);};
  d.querySelectorAll('[data-h]').forEach(e=>e.onclick=()=>recruitFree(e.dataset.h,r));
  d.querySelectorAll('[data-fw]').forEach(e=>e.onclick=()=>{const g=S.reg[r];const c=wallCost(g.wall);if(S.gold<c){toast('金が足りない');return;}S.gold-=c;g.wall++;toast('城壁をLv'+g.wall+'に強化した');try{SND.coin();}catch(_){}save();repaint();regionSheet(r);});
  d.querySelectorAll('[data-fu]').forEach(e=>e.onclick=()=>{const g=S.reg[r];const b=g.bld[+e.dataset.fu];const c=FB[b.t].c*b.lv;if(S.gold<c){toast('金が足りない');return;}S.gold-=c;b.lv++;toast(FB[b.t].n+'をLv'+b.lv+'にした');try{SND.coin();}catch(_){}save();repaint();regionSheet(r);});
  d.querySelectorAll('[data-fn]').forEach(e=>e.onclick=()=>{const g=S.reg[r];const t=e.dataset.fn;const c=FB[t].c;if(S.gold<c){toast('金が足りない');return;}S.gold-=c;g.bld.push({t,lv:1});toast(FB[t].n+'を建てた');try{SND.coin();}catch(_){}save();repaint();regionSheet(r);});}
function fortHtml(r,mine){const g=S.reg[r];let b='<h3 class="sec">城の守り</h3><div class="card"><div class="row" style="justify-content:space-between"><b style="font-family:var(--f-disp);font-size:17px">城壁 Lv'+g.wall+' <small class="muted" style="font-family:var(--f-body);font-size:11.5px">守り+'+Math.round((fortMul(r)-1)*100)+'%</small></b>'+
    (mine&&g.wall<5?'<button class="btn sm" type="button" data-fw="1"'+(S.gold<wallCost(g.wall)?' disabled':'')+'>強化 金'+wallCost(g.wall)+'</button>':'')+'</div>';
  b+='<div class="news" style="margin-top:6px">'+(g.bld.length?g.bld.map((x,i)=>'<div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span><b>'+FB[x.t].n+'</b> Lv'+x.lv+' <small class="muted">'+FB[x.t].d+'</small></span>'+(mine&&x.lv<5?'<button class="btn sm" type="button" data-fu="'+i+'"'+(S.gold<FB[x.t].c*x.lv?' disabled':'')+'>強化 金'+FB[x.t].c*x.lv+'</button>':'')+'</div>').join(''):'<div class="muted">防衛施設はない</div>')+'</div>';
  if(mine&&g.bld.length<bldSlots(r)){b+='<div class="row" style="margin-top:6px">'+Object.keys(FB).map(t=>{const ok=g.wall>=FB[t].w;return '<button class="btn sm" type="button" data-fn="'+t+'"'+(!ok||S.gold<FB[t].c?' disabled':'')+'>'+FB[t].n+(ok?' 金'+FB[t].c:'（壁Lv'+FB[t].w+'）')+'</button>';}).join('')+'</div>';}
  b+='<p class="dim" style="margin:4px 0 0;font-size:11.5px">施設 '+g.bld.length+'/'+bldSlots(r)+'（城壁Lv＋1まで）。籠城戦・攻城戦では城壁と施設がそのまま戦場に並ぶ。</p></div>';return b;}
function draft(r){if(S.ap<1)return;const R_=REG[r];const add=Math.min(R_.cap-S.reg[r].tr,2500+Math.round(R_.cap*.1));S.reg[r].tr+=add;S.ap--;toast(R_.c+'で兵を集めた（+'+man(add)+'）');SND.coin&&SND.coin();save();repaint();}
function moveSheet(r){const nb=ADJ[r].filter(n=>S.reg[n].o===S.me);if(!nb.length){toast('隣に自分の領地がない');return;}
  const hs=heroesAt(r).filter(id=>id);const sel={};let dest=nb[0],tr=0;
  const render=()=>{let b='<p class="muted" style="margin:0">移動は令を使わない。移った武将はこの季節もう出陣できる。</p><h3 class="sec">行き先</h3><div class="row">'+nb.map(n=>'<button class="btn sm'+(n===dest?' pri':'')+'" type="button" data-d="'+n+'">'+REG[n].c+'</button>').join('')+'</div>';
    b+='<h3 class="sec">連れて行く武将</h3>'+(hs.length?'<div class="grid">'+hs.map(id=>heroCard(id,{btn:true,on:sel[id]})).join('')+'</div>':'<p class="muted">武将がいない</p>');
    b+='<h3 class="sec">兵を送る <b style="color:var(--gold2)">'+man(tr)+'</b></h3><input type="range" id="mTr" min="0" max="'+Math.max(0,S.reg[r].tr-500)+'" step="500" value="'+tr+'">';
    const d=sheet(REG[r].c+'から移動',b,'<button class="btn pri" type="button" id="mGo">移動する</button>');
    d.querySelectorAll('[data-d]').forEach(e=>e.onclick=()=>{dest=e.dataset.d;render();});
    d.querySelectorAll('[data-h]').forEach(e=>e.onclick=()=>{sel[e.dataset.h]=!sel[e.dataset.h];render();});
    d.querySelector('#mTr').oninput=e=>{tr=+e.target.value;d.querySelector('.sec:last-of-type b').textContent=man(tr);};
    d.querySelector('#mGo').onclick=()=>{Object.keys(sel).filter(k=>sel[k]).forEach(id=>S.hero[id].loc=dest);tr=Math.min(tr,REG[dest].cap-S.reg[dest].tr);S.reg[r].tr-=tr;S.reg[dest].tr+=tr;save();repaint();toast(REG[dest].c+'へ移動した');regionSheet(dest);UIS.sel=dest;};};
  render();}

/* ================= 出陣 ================= */
function startTarget(list){closeSheet();if(S.ap<1){toast('令が足りない。季節を進めよう');return;}
  if(!list){const set={};regsOf(S.me).forEach(r=>ADJ[r].forEach(n=>{if(S.reg[n].o!==S.me)set[n]=1;}));list=Object.keys(set);}
  if(!list.length){toast('攻められる地域がない');return;}
  UIS.mode='target';UIS.targets=list;UIS.cb=r=>muster(r);hint('攻める地域をタップ（赤い輪）');
  const b=el('button','btn sm','やめる');b.style.cssText='position:absolute;left:10px;top:10px;z-index:5';b.id='tCancel';b.onclick=()=>endTargetMode();$('#stage').appendChild(b);}
function endTargetMode(){UIS.mode='';UIS.targets=[];hint('');const b=$('#tCancel');if(b)b.remove();dirty=true;}
function muster(target){const src=ADJ[target].filter(n=>S.reg[n].o===S.me);if(!src.length)return;
  const pool=[];src.forEach(r=>heroesAt(r).forEach(id=>pool.push(id)));
  const avail=pool.filter(id=>!S.hero[id].tired);
  const sel=avail.slice().sort((a,b)=>heroPower(b)-heroPower(a)).slice(0,Math.min(3,avail.length));
  const trMax=src.reduce((a,r)=>a+Math.max(0,S.reg[r].tr-1000),0);let tr=Math.min(trMax,Math.round(trMax*.8/500)*500);
  const render=()=>{const def=heroesAt(target);const ds=strength(def,S.reg[target].tr,true,target),as=strength(sel,tr,false);const p=winP(as,ds);
    let b='<div class="card"><h3>'+REG[target].c+'（'+facName(S.reg[target].o)+'）</h3><p>守り：兵 '+man(S.reg[target].tr)+(def.length?' ・ '+def.map(id=>HB(id).n).join('・'):' ・ 武将なし')+'</p></div>';
    b+='<h3 class="sec">出陣する武将 <small class="muted" style="font-family:var(--f-body);letter-spacing:0;font-size:12px">（最大5人・'+src.map(r=>REG[r].c).join('/')+'から）</small></h3>';
    b+=pool.length?'<div class="grid">'+pool.map(id=>heroCard(id,{btn:!S.hero[id].tired,on:sel.includes(id),off:S.hero[id].tired,tag:S.hero[id].tired?'疲労':id===rulerOf(S.me)?'君主':'',tagR:id===rulerOf(S.me),sub:REG[S.hero[id].loc].c})).join('')+'</div>':'<p class="muted">出陣できる武将がいない（兵だけで攻めることになる）</p>';
    b+='<h3 class="sec">兵 <b style="color:var(--gold2)" id="trv">'+man(tr)+'</b> / '+man(trMax)+'</h3><input type="range" id="mTr" min="0" max="'+trMax+'" step="500" value="'+tr+'">';
    b+='<div class="vsbar"><span style="color:var(--me)">味方 '+Math.round(p*100)+'%</span><u><i style="width:'+Math.round(p*100)+'%"></i></u><span style="color:var(--foe)">敵</span></div><p class="dim" style="margin:0;font-size:11.5px">見込み（委任した場合）。自分で戦えば、腕しだいでいくらでも覆せる。</p>';
    const d=sheet('出陣 ― '+REG[target].c,b,'<button class="btn pri" type="button" id="mGo"'+(tr<1000?' disabled':'')+'>戦い方を選ぶ ▶</button>');
    d.querySelectorAll('[data-h]').forEach(e=>e.onclick=()=>{const id=e.dataset.h;const i=sel.indexOf(id);if(i>=0)sel.splice(i,1);else if(sel.length<5)sel.push(id);else toast('最大5人まで');render();});
    d.querySelector('#mTr').oninput=e=>{tr=+e.target.value;d.querySelector('#trv').textContent=man(tr);};d.querySelector('#mTr').onchange=()=>render();
    d.querySelector('#mGo').onclick=()=>{if(tr<1000)return;
      // 兵は送り元から比率で引く
      let left=tr;src.forEach((r,i)=>{const can=Math.max(0,S.reg[r].tr-1000);const take=i===src.length-1?left:Math.min(left,Math.round(tr*can/Math.max(1,trMax)));S.reg[r].tr-=take;left-=take;});
      S.ap--;save();topBar();closeSheet();
      battle({atkF:S.me,defF:S.reg[target].o,target,atk:sel.slice(),def:heroesAt(target),atkTr:tr,defTr:S.reg[target].tr,player:'atk',home:sel.reduce((o,id)=>{o[id]=S.hero[id].loc;return o;},{}),src:src[0]});};};
  render();}

/* ================= 合戦の流れ ================= */
async function battle(B){
  // B: atkF defF target atk[] def[] atkTr defTr player('atk'|'def'|null) home{} src
  const mySide=B.player;const me=mySide==='atk'?B.atk:B.def,foe=mySide==='atk'?B.def:B.atk;
  if(!B.kind){if(mySide==='atk'){const fs=strength(B.def,B.defTr,false),as=strength(B.atk,B.atkTr,false);B.kind=B.def.length&&fs>=as*.8&&R()<.8?'field':'siege';}else B.kind='def';}
  let res=null;
  while(!res){const mode=await chooseMode(B,me,foe);if(!mode){if(mySide==='atk'){refundMuster(B);return;}continue;}
    res=await runMode(mode,B,me,foe);}
  await applyResult(B,res);
}
function refundMuster(B){S.reg[B.src].tr+=B.atkTr;S.ap++;save();repaint();toast('出陣を取りやめた');}
function allocLine(ids,tr){if(!ids.length)return '';const a=alloc(ids,tr);return ids.map(id=>HB(id).n+' '+man(a.per[id])).join('・')+(a.reserve?' ・ 控え '+man(a.reserve):'');}
function chooseMode(B,me,foe){return new Promise(res=>{
  const mySide=B.player;const myTr=mySide==='atk'?B.atkTr:B.defTr,foeTr=mySide==='atk'?B.defTr:B.atkTr;
  const as=strength(B.atk,B.atkTr,false),ds=strength(B.def,B.defTr,true,B.target);const p=mySide==='atk'?winP(as,ds):1-winP(as,ds);
  const fF=mySide==='atk'?B.defF:B.atkF;const g=S.reg[B.target];
  const fortTxt='城壁Lv'+g.wall+(g.bld.length?' ・ '+g.bld.map(x=>FB[x.t].n+x.lv).join('・'):' ・ 施設なし');
  const via=B.src?edgeOf(B.src,B.target):'road';const viaT={river:'川を挟んでの戦い。',mount:'峠道での戦い。',sea:'海を渡っての戦い。'}[via]||'';
  const sit={field:['野戦','敵は城を出て迎え撃ってきた。'+viaT],siege:['攻城戦','敵は城に籠もった。'+fortTxt],def:['敵襲','籠城して守るか、打って出るか。'+fortTxt]}[B.kind];
  let b='<div class="card"><h3>'+REG[B.target].c+' ― '+sit[0]+'</h3><p style="margin:0 0 6px">'+sit[1]+'</p><div class="row" style="justify-content:space-between;align-items:flex-start;gap:12px">'+
    '<div style="flex:1;min-width:130px"><b style="color:var(--me)">'+FAC[S.me].n+'</b><br><small class="muted">兵 '+man(myTr)+'<br>'+(me.map(id=>HB(id).n).join('・')||'武将なし')+'</small></div>'+
    '<div style="flex:1;min-width:130px;text-align:right"><b style="color:var(--foe)">'+facName(fF)+'</b><br><small class="muted">兵 '+man(foeTr)+'<br>'+(foe.map(id=>HB(id).n).join('・')||'武将なし')+'</small></div></div>'+
    '<div class="vsbar" style="margin-top:6px"><span style="color:var(--me)">'+Math.round(p*100)+'%</span><u><i style="width:'+Math.round(p*100)+'%"></i></u><span style="color:var(--foe)">'+Math.round(100-p*100)+'%</span></div></div>';
  const card=(m,k,t,sub,d,ok)=>'<button class="mode" type="button" data-m="'+m+'"'+(ok?'':' disabled')+'><span class="k">'+k+'</span><div><b>'+t+'<small>'+sub+'</small></b><span>'+d+'</span></div></button>';
  const hasMe=me.length>0,shield='兵は武将ごとに統率まで配り、1000につき体力+10%（先に減り、回復しない）。';
  b+='<h3 class="sec">戦い方を選ぶ</h3><div class="modes">';
  if(B.kind==='field'){
    b+=card('kessen','決','決戦','三国決戦伝','大軍と大軍がぶつかる野戦。兵を配分し陣形を組んで布陣、戦場で指揮をとる。',hasMe);
    b+=card('tac','戦','戦術','三国タクティクス','一手ずつ動かす野戦。'+shield+'隣の敵将には一騎打ちを挑める。',hasMe);
    b+=card('duel','騎','一騎打ち','一騎打ち英雄伝',foe.length?'代表の武将どうしの三番勝負。'+shield:'敵に武将がいないので選べない',hasMe&&foe.length);
  }else if(B.kind==='siege'){
    b+=card('siege','城','攻城','三国決戦伝','城壁を破り、本陣を落とすか敵総大将を討てば勝ち。弓楼や投石機が撃ってくる。衝車と衡軛の陣が城壁に強い。',hasMe);
  }else{
    b+=card('td','籠','籠城','三国決戦伝','城壁と防衛施設で迎え撃つ。'+'4分守り抜くか、敵総大将を討てば勝ち。本陣が落ちれば負け。',hasMe);
    b+=card('tac','出','出撃','三国タクティクス','城を出て迎え撃つ。'+shield,hasMe);
  }
  b+=card('auto','任','委任','すぐ終わる','部下に任せて結果だけを見る。勝率は上の見込みどおり。',true)+'</div>';
  if(hasMe)b+='<p class="dim" style="margin:0;font-size:12px">兵の配分（戦術・一騎打ち）：'+allocLine(me.slice().sort((a,c)=>(c===rulerOf(S.me))-(a===rulerOf(S.me))||heroPower(c)-heroPower(a)),myTr)+'</p>';
  else b+='<p class="muted" style="margin:0;font-size:12.5px">武将がいないので、委任しか選べない。</p>';
  const d=sheet(sit[0],b,'');
  if(mySide==='def')d.querySelector('.x').hidden=true;
  d.querySelectorAll('[data-m]').forEach(e=>e.onclick=()=>{d.remove();res(e.dataset.m);});
  d.onclose=()=>res(null);});}
async function runMode(mode,B,me,foe){
  if(mode==='auto')return autoBattle(B);
  if(mode==='kessen')return runKessen(B,me,foe,'field');
  if(mode==='siege')return runKessen(B,me,foe,'siege');
  if(mode==='td')return runKessen(B,me,foe,'td');
  if(mode==='tac')return runTac(B,me,foe);
  if(mode==='duel')return runDuel3(B,me,foe);
}
// 結果の形: {win(プレイヤー視点), myLeft, foeLeft, myDown:{id:1}, foeDown:{id:1}, duels:[]}
function autoBattle(B,quiet){const as=strength(B.atk,B.atkTr,false),ds=strength(B.def,B.defTr,true,B.target);const p=winP(as,ds);const aw=R()<p;
  const ratio=aw?ds/as:as/ds;const wl=clamp(.12+.35*ratio,.08,.6),ll=clamp(.55+.25*R(),.45,.85);
  const aLeft=Math.round(B.atkTr*(1-(aw?wl:ll))),dLeft=Math.round(B.defTr*(1-(aw?ll:wl)));
  const down={};(aw?B.def:B.atk).forEach(id=>{if(R()<.45)down[id]=1;});(aw?B.atk:B.def).forEach(id=>{if(R()<.1)down[id]=1;});
  const mine=B.player==='def'?'def':'atk';
  const r={awin:aw,aLeft,dLeft,down,duels:[]};
  if(B.player&&!quiet){return showAuto(B,r).then(()=>toPlayer(B,r));}
  return B.player?toPlayer(B,r):r;}
function toPlayer(B,r){const atk=B.player==='atk';return {win:atk?r.awin:!r.awin,myLeft:atk?r.aLeft:r.dLeft,foeLeft:atk?r.dLeft:r.aLeft,down:r.down,duels:r.duels||[]};}
function showAuto(B,r){return new Promise(res=>{const w=B.player==='atk'?r.awin:!r.awin;
  const b='<div style="text-align:center;font-family:var(--f-disp);font-size:clamp(48px,14vw,80px);line-height:1.1;color:'+(w?'var(--gold2)':'var(--foe)')+'">'+(w?'勝利':'敗北')+'</div>'+
   '<dl class="kv" style="justify-content:center"><dt>攻め手 '+facName(B.atkF)+'</dt><dd>兵 '+man(B.atkTr)+' → '+man(r.aLeft)+'</dd><dt>守り手 '+facName(B.defF)+'</dt><dd>兵 '+man(B.defTr)+' → '+man(r.dLeft)+'</dd></dl>';
  try{w?SND.win():SND.lose();}catch(_){}
  const d=sheet('委任の結果',b,'<button class="btn pri" type="button" id="aOk">続ける</button>');d.querySelector('.x').hidden=true;d.querySelector('#aOk').onclick=()=>{d.remove();res();};});}

/* ---------- 外部の戦場（iframe） ---------- */
let FRAME=null;
function loadingCard(title,me,foe){const d=el('div','');d.id='loading';
  d.innerHTML='<b>'+esc(title)+'</b>'+(me&&foe?'<div class="vs"><img alt="" src="'+portrait(HB(me))+'"><span>対</span><img alt="" src="'+portrait(HB(foe))+'"></div>':'')+'<small>戦場を整えている…</small>';document.body.appendChild(d);return d;}
function frameRun(src,readyT,msg,endT,title,me,foe){return new Promise(res=>{try{BGM.stop();SND.music&&SND.music.gain.setTargetAtTime(.0001,SND.ctx.currentTime,.3);}catch(_){}
  const ld=loadingCard(title,me,foe);
  const f=document.createElement('iframe');f.className='bframe';f.src=src+'#ext';f.setAttribute('allow','autoplay');f.title=title;document.body.appendChild(f);FRAME=f;
  const on=e=>{if(e.source!==f.contentWindow)return;const m=e.data||{};
    if(m.t===readyT){f.contentWindow.postMessage(msg,'*');setTimeout(()=>ld.remove(),600);}
    else if(endT.includes(m.t)){removeEventListener('message',on);f.remove();ld.remove();FRAME=null;
      try{SND.music&&SND.music.gain.setTargetAtTime(.42,SND.ctx.currentTime,.3);BGM.play('camp',true);}catch(_){}res(m);}};
  addEventListener('message',on);});}
let FID=0;
function ktype(id){const h=HB(id);return h.i>=85&&h.p<85?'kyuhei':h.p>=92||['mac','pangd','gongsunz','zhaoy','tadun','matengg','caochun','zhangl'].includes(id)?'kihei':'hohei';}
function kfm(t,id){return t==='kyuhei'?'gankou':t==='kihei'?'hoshi':HB(id).p>=95?'engetsu':'houen';}
async function runKessen(B,me,foe,kind){const myTr=B.player==='atk'?B.atkTr:B.defTr,foeTr=B.player==='atk'?B.defTr:B.atkTr;const fF=B.player==='atk'?B.defF:B.atkF;
  const caps=me.map(id=>(10+Math.round(st(id).cmd*.32)+S.hero[id].lv*2)*100);const total=Math.max(1000,Math.min(myTr,caps.reduce((a,b)=>a+b,0)));
  const fsorted=foe.slice().sort((a,b)=>(b===rulerOf(fF))-(a===rulerOf(fF))||st(b).cmd-st(a).cmd).slice(0,5);
  const fl=[];const slots=[[.5,.1,'gen'],[.3,.27,'charge'],[.72,.24,'flank'],[.5,.3,'hold'],[.18,.2,'archer']];
  const n=Math.max(2,fsorted.length);const wsum=fsorted.reduce((a,id)=>a+st(id).cmd,0)||1;
  for(let i=0;i<n;i++){const id=fsorted[i]||'';const t=id?ktype(id):i===1?'hohei':'kyuhei';const share=id?st(id).cmd/wsum:1/n;
    let men=Math.max(800,Math.round(foeTr*(fsorted.length?(id?share:.25):1/n)/100)*100);const sl=slots[i];
    const y=kind==='siege'?[.06,.16,.12,.19,.1][i]:sl[1];const ai=kind==='siege'?(t==='kyuhei'?'archer':i===0?'gen':'hold'):(t==='kyuhei'?'archer':sl[2]);
    fl.push([id,t,men,id?kfm(t,id):(t==='kyuhei'?'gankou':'gyorin'),sl[0],y,ai,i===0?1:0,id?S.hero[id].lv:Math.min(8,1+S.turn/3|0)]);}
  const lead=fsorted[0];const fg=lead?(HB(lead).i>=85?'kakei':HB(lead).p>=95?'toppa':B.player==='atk'?'kenshu':'shippu'):'kenshu';
  const g=S.reg[B.target];const fort=kind==='siege'||kind==='td'?{side:kind==='td'?0:1,wall:g.wall,hon:g.wall,blds:g.bld.map((x,i)=>({t:x.t,lv:x.lv,i}))}:null;
  const nm=REG[B.target].c+(kind==='siege'?'攻め':kind==='td'?'籠城戦':'の戦い');
  const desc=kind==='siege'?FAC[S.me].n+'は'+REG[B.target].c+'を囲んだ。城壁を破り、本陣を落とすか敵総大将を討て。':kind==='td'?facName(B.atkF)+'が'+REG[B.target].c+'に攻め寄せた。城壁と施設で4分守り抜くか、敵総大将を討て。本陣が落ちれば負け。':(B.player==='atk'?FAC[S.me].n+'が'+REG[B.target].c+'へ攻め込む。':facName(B.atkF)+'が'+REG[B.target].c+'へ攻め寄せてきた。')+'敵総大将を討てば勝ち。';
  const msg={t:'war',id:++FID,n:nm,p:REG[B.target].n,y:S.year,fac:FAC[S.me].dk,ter:fort?'plain':(({river:'river',mount:'mountain',sea:'river'})[B.src?edgeOf(B.src,B.target):'']||REG[B.target].k),d:desc,total,maxU:Math.min(5,me.length),limit:kind==='td'?240:kind==='siege'?420:390,cond:kind==='td'?'survive':'kill',fg,fort,
    me:me.slice().sort((a,b)=>(b===rulerOf(S.me))-(a===rulerOf(S.me))).map(id=>({id,lv:S.hero[id].lv})),foe:fl};
  const m=await frameRun('kessen.html','warReady',msg,['warEnd','warCancel'],(kind==='siege'?'攻城 ― ':kind==='td'?'籠城 ― ':'決戦 ― ')+REG[B.target].c,me[0],foe[0]);
  if(m.t==='warCancel')return null;
  const down={};(m.mine||[]).forEach(o=>{if(o.down)down[o.id]=1;});(m.foes||[]).forEach(o=>{if(o.id&&o.down)down[o.id]=1;});
  const mineLeft=(m.mine||[]).reduce((a,o)=>a+o.men,0)+Math.max(0,myTr-total);const foeSent=fl.reduce((a,f)=>a+f[2],0);
  const foeLeft=Math.round((m.foes||[]).reduce((a,o)=>a+o.men,0)*foeTr/Math.max(1,foeSent));
  return {win:!!m.win,myLeft:Math.round(mineLeft),foeLeft:clamp(foeLeft,0,foeTr),down,duels:(m.duels||[]).map(d=>({me:d.me,foe:d.foe,res:d.res})),fort:m.fort||null};}
function tjob(id){const h=HB(id);if(h.i>=88&&h.p<80)return 'kuro';if(h.w==='弓'||h.w==='弩')return 'yumi';if(['トンファー','拳','大鎚','爪','三節棍'].includes(h.w))return 'monk';if(h.p>=96)return 'samurai';if(['方天画戟','蛇矛','槍','戟','鉄脊蛇矛'].includes(h.w))return 'ryu';if(h.i>=80)return 'shiro';return 'knight';}
async function runTac(B,me,foe){const myTr=B.player==='atk'?B.atkTr:B.defTr,foeTr=B.player==='atk'?B.defTr:B.atkTr;const fF=B.player==='atk'?B.defF:B.atkF;
  const party=me.slice().sort((a,b)=>(b===rulerOf(S.me))-(a===rulerOf(S.me))||heroPower(b)-heroPower(a)).slice(0,5);
  const fs=foe.slice().sort((a,b)=>(b===rulerOf(fF))-(a===rulerOf(fF))||heroPower(b)-heroPower(a)).slice(0,6);
  const myA=alloc(party,myTr),foA=alloc(fs,foeTr);
  let fstr=fs.length?fs.map((id,i)=>(i===0?'*':'')+(HB(id).p>=98?'!':'')+id+':'+tjob(id)).join(' '):'*g:knight g:yumi g:senshi';
  const sold=fF&&FAC[fF]?FAC[fF].sold:NEUTRAL.sold;
  const msg={t:'tac',id:++FID,n:REG[B.target].c,y:S.year,p:REG[B.target].n,map:(({river:'river',mount:'mountain',sea:'yangtze'})[B.src?edgeOf(B.src,B.target):''])||({castle:REG[B.target].k==='river'?'river':'plain',gate:'hills'})[REG[B.target].t]||REG[B.target].t,opt:REG[B.target].t==='castle'||REG[B.target].t==='gate'?{}:(REG[B.target].o||{}),side:B.player==='atk'?'atk':'def',
    fname:FAC[S.me].n,fcol:FAC[S.me].col,fch:FAC[S.me].ch,ef:sold,ech:fF&&FAC[fF]?FAC[fF].ch:'郷',ecol:facCol(fF),
    party:party.map(id=>({id,lv:S.hero[id].lv,tr:myA.per[id]})),foeTr:foA.per,foe:fstr,s:(B.player==='atk'?FAC[S.me].n+'は'+REG[B.target].c+'へ攻め込んだ。':facName(fF)+'が'+REG[B.target].c+'に攻め寄せた。')+'敵の総大将を倒せば勝ち。'};
  const m=await frameRun('tactics.html','tacReady',msg,['tacEnd','tacCancel'],'戦術戦 ― '+REG[B.target].c,party[0],fs[0]);
  if(m.t==='tacCancel')return null;
  const down={};(m.mine||[]).forEach(o=>{if(o.down)down[o.id]=1;});(m.foes||[]).forEach(o=>{if(o.id&&o.down)down[o.id]=1;});
  const myLeft=(m.mine||[]).reduce((a,o)=>a+(o.tr||0),0)+Math.round(myA.reserve*(m.win?.95:.6)),foeLeft=(m.foes||[]).reduce((a,o)=>a+(o.tr||0),0)+Math.round(foA.reserve*(m.win?.6:.95));
  return {win:!!m.win,myLeft,foeLeft,down,duels:(m.duels||[]).map(d=>({me:d.me,foe:d.foe,res:d.res}))};}

/* ---------- 一騎打ち三番勝負 ---------- */
function duelSession(){let f=null,ready=false,pend=null,cb=null,id=0,onStart=null;
  const on=e=>{if(!f||e.source!==f.contentWindow)return;const m=e.data||{};
    if(m.t==='duelReady'){ready=true;if(pend){f.contentWindow.postMessage(pend,'*');pend=null;}}
    else if(m.t==='duelStarted'){setTimeout(()=>{f.classList.remove('hide');if(onStart)onStart();},300);}
    else if(m.t==='duelEnd'&&m.id===id&&cb){const c=cb;cb=null;f.classList.add('hide');c(m);}};
  addEventListener('message',on);
  return {fight(a,b,stage,os,msh,fsh){return new Promise(res=>{if(!f){f=document.createElement('iframe');f.className='bframe hide';f.src='duel.html';f.setAttribute('allow','autoplay');document.body.appendChild(f);}
      id++;cb=res;onStart=os;const msg={t:'duel',id,me:a,foe:b,strat:'bal',stage,mm:lvMul(a),fm:lvMul(b),msh:msh||0,fsh:fsh||0};if(ready)f.contentWindow.postMessage(msg,'*');else pend=msg;});},
    close(){removeEventListener('message',on);if(f)f.remove();}};}
function pickOrder(me,n){return new Promise(res=>{const order=me.slice().sort((a,b)=>st(b).p-st(a).p).slice(0,n);
  const render=()=>{let b='<p class="muted" style="margin:0">'+n+'人を選び、出る順に並べる（先に選んだ順）。先に'+Math.ceil((n+1)/2)+'勝した方が城を取る。</p><div class="grid">'+me.map(id=>{const k=order.indexOf(id);return heroCard(id,{btn:true,on:k>=0,tag:k>=0?(k+1)+'番手':''});}).join('')+'</div>';
    const d=sheet('三番勝負の顔ぶれ',b,'<button class="btn pri" type="button" id="oGo"'+(order.length===n?'':' disabled')+'>勝負!</button>');d.querySelector('.x').hidden=true;
    d.querySelectorAll('[data-h]').forEach(e=>e.onclick=()=>{const id=e.dataset.h,k=order.indexOf(id);if(k>=0)order.splice(k,1);else if(order.length<n)order.push(id);render();});
    d.querySelector('#oGo').onclick=()=>{d.remove();res(order);};};render();});}
async function runDuel3(B,me,foe){const n=Math.min(3,me.length,foe.length);const fF=B.player==='atk'?B.defF:B.atkF;
  const mine=n>1?await pickOrder(me,n):[me.slice().sort((a,b)=>st(b).p-st(a).p)[0]];
  const theirs=foe.slice().sort((a,b)=>st(b).p-st(a).p).slice(0,n);if(n>1){const t=theirs.shift();theirs.splice(n===3?1:0,0,t);} // 大将格は二番手に
  const myTr0=B.player==='atk'?B.atkTr:B.defTr,foeTr0=B.player==='atk'?B.defTr:B.atkTr;
  const myA=alloc(mine,myTr0),foA=alloc(theirs,foeTr0);const myT={},foT={};
  const need=Math.ceil((n+1)/2);let w=0,l=0;const duels=[],down={};const D=duelSession();try{BGM.stop();}catch(_){}
  for(let i=0;i<n&&w<need&&l<need;i++){const a=mine[i],b=theirs[i];
    await interBout(i,n,a,b,w,l,myA.per[a],foA.per[b]);
    const ld=loadingCard('第'+(i+1)+'番',a,b);
    const m=await D.fight(a,b,REG[B.target].d,()=>ld.remove(),Math.floor(myA.per[a]/1000)*.1,Math.floor(foA.per[b]/1000)*.1);ld.remove();
    const sh=m.sh||[0,0];myT[a]=Math.round(myA.per[a]*sh[0]);foT[b]=Math.round(foA.per[b]*sh[1]);
    const win=!!m.win;duels.push({me:a,foe:b,res:win?0:1});if(win){w++;down[b]=1;}else{l++;down[a]=1;}}
  D.close();try{BGM.play('camp',true);}catch(_){}
  const win=w>l;const myTr=B.player==='atk'?B.atkTr:B.defTr,foeTr=B.player==='atk'?B.defTr:B.atkTr;
  await new Promise(res=>{const b='<div style="text-align:center;font-family:var(--f-disp);font-size:clamp(46px,13vw,78px);line-height:1.1;color:'+(win?'var(--gold2)':'var(--foe)')+'">'+w+' 対 '+l+'</div><div class="news">'+duels.map(d=>'<div class="'+(d.res===0?'me':'bad')+'">'+HB(d.me).n+' 対 '+HB(d.foe).n+' ― '+(d.res===0?'勝ち':'負け')+'</div>').join('')+'</div><p class="muted" style="margin:0;text-align:center">'+(win?'一騎打ちを制した。敵兵は戦意を失い崩れた。':'一騎打ちに敗れ、兵の士気は地に落ちた。')+'</p>';
    const d=sheet('三番勝負 決着',b,'<button class="btn pri" type="button" id="dOk">続ける</button>');d.querySelector('.x').hidden=true;d.querySelector('#dOk').onclick=()=>{d.remove();res();};});
  const sumU=(A,T,f)=>Object.keys(A.per).reduce((a,id)=>a+(T[id]!==undefined?T[id]:Math.round(A.per[id]*f)),0)+Math.round(A.reserve*f);
  return {win,myLeft:sumU(myA,myT,win?.95:.6),foeLeft:sumU(foA,foT,win?.6:.95),down,duels};}
function interBout(i,n,a,b,w,l,ta,tb){return new Promise(res=>{const ha=HB(a),hb=HB(b);
  const bd='<div style="text-align:center"><small class="muted">第'+(i+1)+'番 ・ '+w+'勝'+l+'敗</small></div><div class="row" style="justify-content:center;gap:18px"><div style="text-align:center">'+heroCard(a,{sub:'兵 '+man(ta||0)+'（体力+'+Math.floor((ta||0)/1000)*10+'%）'})+'<p style="margin:4px 0 0;font-size:13px">「'+esc(line(a,'sp'))+'」</p></div><b style="font-family:var(--f-disp);font-size:30px;color:var(--gold)">対</b><div style="text-align:center">'+heroCard(b,{sub:'兵 '+man(tb||0)+'（体力+'+Math.floor((tb||0)/1000)*10+'%）'})+'<p style="margin:4px 0 0;font-size:13px">「'+esc(line(b,'sp'))+'」</p></div></div>';
  try{SND.horn();}catch(_){}
  const d=sheet('一騎打ち 第'+(i+1)+'番',bd,'<button class="btn pri" type="button" id="bGo">いざ、尋常に勝負</button>');d.querySelector('.x').hidden=true;d.querySelector('#bGo').onclick=()=>{d.remove();res();};});}

/* ---------- 結果を天下図に反映 ---------- */
async function applyResult(B,res){
  const T=B.target,R_=REG[T];const pAtk=B.player==='atk';const atkWin=pAtk?res.win:!res.win;
  const aLeft=pAtk?res.myLeft:res.foeLeft,dLeft=pAtk?res.foeLeft:res.myLeft;
  S.stats.war++;if(res.win)S.stats.win++;
  (res.duels||[]).forEach(d=>{S.stats.duel++;if(d.res===0)S.stats.dwon++;if(d.res===0)giveExp(d.me,40);});
  const mineIds=pAtk?B.atk:B.def;const ups=[];
  mineIds.forEach(id=>{if(S.hero[id]&&giveExp(id,res.win?45:20))ups.push(HB(id).n);});
  (pAtk?B.def:B.atk).forEach(id=>{if(S.hero[id])giveExp(id,res.win?15:35);});
  B.atk.forEach(id=>{if(S.hero[id])S.hero[id].tired=1;});
  const news=[];const caught=[];
  if(atkWin){
    const oldF=S.reg[T].o;
    S.reg[T].o=B.atkF;S.reg[T].tr=Math.max(500,aLeft);
    B.atk.forEach(id=>{const h=S.hero[id];if(h&&h.f===B.atkF)h.loc=T;});
    // 守っていた武将
    B.def.forEach(id=>{const h=S.hero[id];if(!h)return;const hit=res.down[id];
      const isR=id===rulerOf(oldF);let pc=hit?.6:.3;if(isR)pc*=.6;
      const escTo=oldF?ADJ[T].filter(n=>S.reg[n].o===oldF):[];
      if(!oldF)captureHero(id,B.atkF,caught);
      else if(escTo.length&&R()>=pc){h.loc=pick(escTo);S.reg[h.loc].tr=Math.min(REG[h.loc].cap,S.reg[h.loc].tr+Math.round(dLeft*.5/Math.max(1,B.def.length)));}
      else if(!escTo.length&&!isR&&R()<.35){h.f=null;h.loc=pick(ADJ[T]);news.push(HB(id).n+'は野に下った');}
      else captureHero(id,B.atkF,caught);});
    news.unshift(facName(B.atkF)+'が'+R_.c+'を攻め落とした');
    if(oldF&&FAC[oldF])checkFall(oldF,news);
  }else{
    S.reg[T].tr=Math.max(300,dLeft);
    // 攻め手は戻る（倒れた武将は捕まることがある）
    B.atk.forEach(id=>{const h=S.hero[id];if(!h)return;const isR=id===rulerOf(B.atkF);
      if(res.down[id]&&!isR&&R()<.3&&S.reg[T].o){captureHero(id,S.reg[T].o,caught);return;}
      const back=B.home&&B.home[id]&&S.reg[B.home[id]].o===B.atkF?B.home[id]:(regsOf(B.atkF)[0]);if(back)h.loc=back;});
    const back=B.src&&S.reg[B.src].o===B.atkF?B.src:regsOf(B.atkF).find(r=>ADJ[r].includes(T));if(back)S.reg[back].tr=Math.min(REG[back].cap,S.reg[back].tr+Math.round(aLeft*.7));
    news.unshift(facName(B.atkF)+'の'+R_.c+'攻めは退けられた');
  }
  // 城の傷み
  {const g=S.reg[T];const fr=res.fort;if(fr&&fr.dead&&fr.dead.length){const dead=new Set(fr.dead);g.bld=g.bld.filter((x,i)=>!dead.has(i));}
    if(atkWin){g.wall=Math.max(1,g.wall-1);if(!fr&&g.bld.length&&R()<.5)g.bld.splice(Math.floor(R()*g.bld.length),1);}else if(fr&&fr.wall<.5)g.wall=Math.max(1,g.wall-1);}
  // 負傷兵：勝てば失った兵の半分、負ければ2割が次の季節に戻る
  const lostA=Math.max(0,B.atkTr-aLeft),lostD=Math.max(0,B.defTr-dLeft);const injA=Math.round(lostA*(atkWin?.5:.2)),injD=Math.round(lostD*(atkWin?.2:.5));
  {const atkHome=atkWin?T:(B.src&&S.reg[B.src].o===B.atkF?B.src:regsOf(B.atkF).find(r=>ADJ[r].includes(T)));if(atkHome)S.reg[atkHome].inj+=injA;
   const defHome=atkWin?(B.defF?ADJ[T].find(n=>S.reg[n].o===B.defF):null):T;if(defHome)S.reg[defHome].inj+=injD;}
  const myInj=B.player==='atk'?injA:B.player==='def'?injD:0;
  save();repaint();
  if(B.player){
    const win=res.win;try{win?SND.win():SND.lose();}catch(_){}
    let b='<div style="text-align:center;font-family:var(--f-disp);font-size:clamp(50px,15vw,86px);line-height:1.1;color:'+(win?'var(--gold2)':'var(--foe)')+'">'+(win?'勝利':'敗北')+'</div><div class="news">'+news.map(s=>'<div class="'+(win?'me':'bad')+'">'+esc(s)+'</div>').join('')+'</div>';
    if(caught.length)b+='<h3 class="sec">捕らえた武将</h3><div class="grid">'+caught.filter(c=>c.by===S.me).map(c=>heroCard(c.id,{sub:'捕虜（人材の画面で登用を試せる）'})).join('')+'</div>';
    const lost=caught.filter(c=>c.by!==S.me);if(lost.length)b+='<h3 class="sec">敵に捕まった武将</h3><div class="grid">'+lost.map(c=>heroCard(c.id,{})).join('')+'</div>';
    if(myInj)b+='<p style="margin:0">負傷兵 <b style="color:var(--gold2)">'+man(myInj)+'</b> は次の季節に隊へ戻る。</p>';
    if(ups.length)b+='<p class="muted" style="margin:0">レベルが上がった：'+ups.join('・')+'</p>';
    const spk=(win?mineIds.find(id=>!res.down[id]):mineIds[0])||null;if(spk)b+='<div class="card row" style="flex-wrap:nowrap"><img alt="" src="'+portrait(HB(spk))+'" style="width:48px;height:54px;border:1px solid var(--gold)"><div><b style="font-family:var(--f-disp);color:var(--gold2)">'+HB(spk).n+'</b><p style="margin:0;color:var(--fg)">「'+esc(line(spk,win?'win':'lose'))+'」</p></div></div>';
    await new Promise(r=>{const d=sheet(R_.c+'の戦い',b,'<button class="btn pri" type="button" id="rOk">天下図へ</button>');d.querySelector('.x').hidden=true;d.querySelector('#rOk').onclick=()=>{d.remove();r();};});
    for(const c of caught.filter(c=>c.by===S.me))await storyHook('captured',c.id);
  }else S.news.push(...news);
  await storyHook('after',B,atkWin);
  checkEnd();}
function captureHero(id,by,list){const h=S.hero[id];h.cap=by;h.f=null;h.loc=regsOf(by)[0]||h.loc;h.tries=0;list.push({id,by});if(by===S.me)S.stats.capt++;
  // 君主が捕まったら跡継ぎ
  FIDS.forEach(f=>{if(S.rulers[f]===id)succeed(f);});}
function succeed(f){const c=heroesOf(f).sort((a,b)=>(st(b).cmd+(HB(b).cha||60))-(st(a).cmd+(HB(a).cha||60)));if(c.length){S.rulers[f]=c[0];if(f!==S.me)S.news.push(facName(f)+'は'+HB(c[0]).n+'が跡を継いだ');else toast(HB(c[0]).n+'が君主を継いだ');}
  else{regsOf(f).forEach(r=>S.reg[r].o=null);S.news.push(FAC[f].n+'は主を失い崩れた');}}
function checkFall(f,news){if(alive(f))return;news.push(FAC[f].n+'は滅亡した');heroesOf(f).forEach(id=>{const h=S.hero[id];h.f=null;});S.flags['fall_'+f]=1;}

/* ================= 人材 ================= */
function chanceFree(id){const h=HB(id);const rc=HB(rulerOf(S.me)).cha||60;let p=.45+(rc-60)/120-(h.p+h.i>170?.1:0);
  if(id==='zhugel')return -1;return clamp(p,.12,.85);}
function chanceCap(id){const h=HB(id),cap=S.hero[id];const rc=HB(rulerOf(S.me)).cha||60;let p=.3+(rc-60)/140+(cap.tries||0)*.12;
  if(FIDS.some(f=>S.rulers[f]===id))p-=.2;
  if(['guan','zhangf'].includes(id))p=S.me==='liu'?1:.04;
  if(id==='liub'||id==='caoc'||id==='sunj')p=.03;
  if(id==='lubu')p=.65;if(id==='menghuo')p=(cap.tries||0)>=6?1:0;
  return clamp(p,0,1);}
async function recruitFree(id,r){if(S.ap<1){toast('令が足りない');return;}
  const v=(S.visits[id]=(S.visits[id]||0)+1);S.ap--;
  if(id==='zhugel'){if(v<3){await playStory(v===1?'#'+REG[r].c+'の西、隆中の草廬を訪ねた。\n童子：先生はお出かけでございます。\n#諸葛亮は留守だった。':'#雪の中、ふたたび草廬を訪ねた。\n童子：先生はまだお戻りになりませぬ。\n#またも会えなかった。だが、あきらめるにはまだ早い。',{bg:v===1?'garden':'snow',place:'隆中'});save();topBar();return;}
    await playStory(SANKO(S.me),{bg:'room',place:'隆中・草廬'});joinHero(id,r);return;}
  const p=chanceFree(id);const ok=R()<p;
  if(ok){joinHero(id,r);await playStory(HB(rulerOf(S.me)).n+'：'+HB(id).n+'殿、我が軍に力を貸してはくれぬか。\n'+HB(id).n+'：'+line(id,'sp')+'　……この身、お預けいたしましょう。',{bg:'room',place:REG[r].c});}
  else{toast(HB(id).n+'は首を縦に振らなかった（もう一度訪ねてもよい）');}
  save();repaint();regionSheet(r);}
function joinHero(id,r){const h=S.hero[id];h.f=S.me;h.cap=null;h.loc=r||h.loc;h.tired=1;S.met[id]=1;S.stats.recruit++;banner(HB(id).n+'が仲間に','登用');try{SND.gong(.18);}catch(_){}save();repaint();}
function talentSheet(){const caps=captivesOf(S.me);const fr=[];regsOf(S.me).forEach(r=>freeAt(r).forEach(id=>fr.push([id,r])));
  let b='<p class="muted" style="margin:0">登用は令を1つ使う。君主の魅力が高いほど成功しやすい。捕虜は何度も説けば心が動くこともある。</p>';
  b+='<h3 class="sec">捕虜 '+caps.length+'人</h3>'+(caps.length?'<div class="grid">'+caps.map(id=>heroCard(id,{btn:true,sub:'説得 '+(S.hero[id].tries||0)+'回'})).join('')+'</div>':'<p class="muted" style="margin:0">いない</p>');
  b+='<h3 class="sec">領内の在野 '+fr.length+'人</h3>'+(fr.length?'<div class="grid">'+fr.map(([id,r])=>heroCard(id,{btn:true,sub:REG[r].c+(S.visits[id]?' ・ 訪問'+S.visits[id]+'回':'')})).join('')+'</div>':'<p class="muted" style="margin:0">いない。他の地を取れば会えるかもしれない</p>');
  const met=Object.keys(S.met).length;b+='<p class="dim" style="margin:0;font-size:12px">これまで仕えた武将 '+met+' / '+HEROES.length+'人</p>';
  const d=sheet('人材・捕虜',b,'');
  d.querySelectorAll('[data-h]').forEach(e=>e.onclick=()=>{const id=e.dataset.h;if(S.hero[id].cap===S.me)captiveSheet(id);else{const r=S.hero[id].loc;recruitFree(id,r);}});}
function captiveSheet(id){const p=chanceCap(id);const b=heroCard(id,{})+'<p style="margin:0">「'+esc(line(id,'lose'))+'」</p><p class="muted" style="margin:0">登用の見込み：'+(p>=.8?'高い':p>=.45?'五分':p>=.15?'低い':'ほぼ無理')+'</p>';
  const d=sheet(HB(id).n+'（捕虜）',b,'<button class="btn pri" type="button" id="cTry"'+(S.ap<1?' disabled':'')+'>説得する（令1）</button><button class="btn" type="button" id="cFree">解き放つ</button>');
  d.querySelector('#cTry').onclick=async()=>{S.ap--;const h=S.hero[id];h.tries=(h.tries||0)+1;
    if(id==='menghuo'&&h.tries<7){await playStory('孟獲：まだだ! まだ心は服さぬぞ!\n#孟獲は首を振った。（'+h.tries+'度目）七度でも説けば、あるいは……');save();topBar();talentSheet();return;}
    if(R()<p){joinHero(id,regsOf(S.me)[0]);await playStory(HB(rulerOf(S.me)).n+'：その武、わしのもとで振るってはくれぬか。\n'+HB(id).n+'：……負けた身。'+(id==='lubu'?'よかろう、この呂布の武、存分に使うがいい。':'この命、お預けいたす。'),{bg:'palace'});}
    else toast(HB(id).n+'は応じなかった');save();repaint();talentSheet();};
  d.querySelector('#cFree').onclick=()=>{const h=S.hero[id];h.cap=null;h.f=null;h.loc=pick(RIDS);toast(HB(id).n+'を解き放った');save();repaint();talentSheet();};}
function heroSheet(){const ids=heroesOf(S.me).sort((a,b)=>heroPower(b)-heroPower(a));
  let b='<div class="grid">'+ids.map(id=>heroCard(id,{tag:id===rulerOf(S.me)?'君主':S.hero[id].tired?'疲労':'',tagR:id===rulerOf(S.me),sub:REG[S.hero[id].loc].c+' ・ EXP '+S.hero[id].exp+'/'+expNeed(S.hero[id].lv)})).join('')+'</div>';
  sheet('武将 '+ids.length+'人',b,'');}
function infoSheet(){let b='';FIDS.filter(alive).sort((a,b)=>regsOf(b).length-regsOf(a).length).forEach(f=>{const r=rulerOf(f);
  b+='<div class="card row" style="flex-wrap:nowrap;border-left:4px solid '+FAC[f].col+'"><img alt="" src="'+portrait(HB(r))+'" style="width:44px;height:50px;border:1px solid var(--line2)"><div style="min-width:0"><b style="font-family:var(--f-disp);font-size:18px">'+FAC[f].n+(f===S.me?'（あなた）':'')+'</b><br><small class="muted">君主 '+HB(r).n+' ・ 領地 '+regsOf(f).length+' ・ 武将 '+heroesOf(f).length+' ・ 兵 '+man(regsOf(f).reduce((a,x)=>a+S.reg[x].tr,0))+'</small></div></div>';});
  const gone=FIDS.filter(f=>!alive(f));if(gone.length)b+='<p class="muted" style="margin:0">滅亡：'+gone.map(f=>FAC[f].n).join('・')+'</p>';
  if(S.news.length)b+='<h3 class="sec">最近の軍報</h3><div class="news">'+S.news.slice(-12).reverse().map(s=>'<div>'+esc(s)+'</div>').join('')+'</div>';
  sheet('諸侯の勢力',b,'');}
function menuSheet(){const s=S.stats;let b='<dl class="kv"><dt>合戦</dt><dd>'+s.war+'戦 '+s.win+'勝</dd><dt>一騎打ち</dt><dd>'+s.duel+'回 '+s.dwon+'勝</dd><dt>登用</dt><dd>'+s.recruit+'人</dd><dt>捕縛</dt><dd>'+s.capt+'人</dd><dt>仕えた武将</dt><dd>'+Object.keys(S.met).length+' / '+HEROES.length+'</dd></dl>';
  b+='<div class="card"><h3>遊び方</h3><p>・季節ごとに「令」がある。出陣・徴兵・登用で1つ使う。金は季節ごとに領地から入る。<br>・赤い輪の地域を攻める。<br>・勝てば城を取り、敵将を捕らえられる。捕虜や在野の人材を登用して軍を大きくしよう。<br>・季節を進めると諸侯が動く。攻められたら迎え撃つ。<br>・敵が城を出てくれば<b>野戦</b>（決戦か戦術）、城に籠もれば<b>攻城戦</b>（決戦）。攻められたら<b>籠城</b>（城壁と施設で守る）か<b>出撃</b>（戦術）。<br>・兵は武将ごとに統率まで配られ、戦術・一騎打ちでは1000につき体力+10%の上乗せになる（先に減り、回復しない）。<br>・失った兵の一部は負傷兵として次の季節に戻る（勝てば半分、負ければ2割）。<br>・金で城壁を強化し、弓楼・連弩台・投石機・火計台・地雷火を建てられる。<br>・洛陽を取ると帝を迎え、令が1つ増える。<br>・21の地域をすべて治めれば天下統一。</p></div>';
  b+='<p class="dim" style="font-size:12px;margin:0">素材：武将の顔・3Dモデル・合戦・戦術戦・一騎打ちは「三国決戦伝」「三国タクティクス」「一騎打ち英雄伝」、物語画面と勢力図は「三国英雄伝」から。武器の音の一部は Battle for Wesnoth（GPL-2.0以降）、術のエフェクトとボタン音は Kenney（CC0）。</p>';
  const d=sheet('記録',b,'<button class="btn" type="button" id="mBgm">BGM '+(SND.bgmOn?'オン':'オフ')+'</button><button class="btn" type="button" id="mTitle">タイトルへ</button><button class="btn" type="button" id="mNew">最初から</button>');
  d.querySelector('#mBgm').onclick=()=>{try{SND.init();BGM.setOn(!SND.bgmOn);}catch(_){}menuSheet();};
  d.querySelector('#mTitle').onclick=()=>{closeSheet();title();};
  let armed=false;d.querySelector('#mNew').onclick=e=>{if(!armed){armed=true;e.target.textContent='もう一度押すと消える';return;}localStorage.removeItem(SKEY);S=null;closeSheet();title();};}

/* ================= 季節を進める（諸侯の番） ================= */
let BUSY=false;
async function endTurn(){if(BUSY)return;BUSY=true;closeSheet();endTargetMode();const cmd=$('#cmd');cmd.querySelectorAll('button').forEach(b=>b.disabled=true);
  S.news=[];hint('諸侯が動いている…');
  try{
    for(const f of shuffle(FIDS.filter(f=>f!==S.me&&alive(f)))){if(!alive(S.me))break;await aiFaction(f);}
    // 季節が変わる
    S.season=(S.season+1)%4;if(S.season===0)S.year++;S.turn++;
    RIDS.forEach(r=>{const o=S.reg[r].o;const g=o?Math.round(REG[r].cap*.1):Math.round(REG[r].cap*.05);S.reg[r].tr=Math.min(REG[r].cap,S.reg[r].tr+g);});
    Object.keys(S.hero).forEach(id=>S.hero[id].tired=0);
    // 負傷兵が戻る・金が入る
    let back=0;RIDS.forEach(r=>{const g=S.reg[r];if(g.inj){const v=Math.min(g.inj,REG[r].cap-g.tr);if(g.o===S.me)back+=Math.max(0,v);g.tr+=Math.max(0,v);g.inj=0;}});
    if(back)S.news.push('負傷兵 '+man(back)+' が隊に戻った');
    const inc=income(S.me);S.gold+=inc;S.news.push('金 '+man(inc)+' が入った');
    FIDS.filter(f=>f!==S.me&&alive(f)).forEach(f=>{S.fgold[f]=(S.fgold[f]||0)+income(f);aiBuild(f);});
    // 在野の人材は時々旅をする
    Object.keys(S.hero).forEach(id=>{const h=S.hero[id];if(h.f===null&&!h.cap&&R()<.12)h.loc=pick(ADJ[h.loc]);});
    // AIの捕虜
    FIDS.filter(f=>f!==S.me).forEach(f=>captivesOf(f).forEach(id=>{const h=S.hero[id];if(R()<.3){h.f=f;h.cap=null;h.loc=regsOf(f)[0]||h.loc;S.news.push(HB(id).n+'は'+FAC[f].n+'に降った');}else if(R()<.15){h.cap=null;h.f=null;h.loc=pick(RIDS);}}));
    S.ap=apMax();save();repaint();
    hint('');banner(S.year+'年 '+SEASON[S.season],S.news.length?S.news.length+'件の軍報':'');
    if(S.news.length)await newsSheet();
    await storyHook('season');
  }finally{BUSY=false;cmd.querySelectorAll('button').forEach(b=>b.disabled=false);hint('');topBar();}
  checkEnd();}
function newsSheet(){return new Promise(r=>{const b='<div class="news">'+S.news.map(s=>'<div class="'+(s.indexOf(FAC[S.me].n)>=0?'me':'')+'">'+esc(s)+'</div>').join('')+'</div>';
  const d=sheet('軍報 ― '+S.year+'年'+SEASON[S.season],b,'<button class="btn pri" type="button" id="nOk">わかった</button>');d.querySelector('#nOk').onclick=()=>{d.remove();r();};d.onclose=r;});}
async function aiFaction(f){const F=FAC[f];
  // 在野を登用
  regsOf(f).forEach(r=>freeAt(r).forEach(id=>{if(id!=='zhugel'&&R()<.3){S.hero[id].f=f;S.news.push(HB(id).n+'が'+F.n+'に仕えた');}}));
  // 武将を前線へ
  regsOf(f).forEach(r=>{const front=ADJ[r].filter(n=>S.reg[n].o!==f);if(front.length)return;const fn=ADJ[r].filter(n=>S.reg[n].o===f&&ADJ[n].some(m=>S.reg[m].o!==f));if(!fn.length)return;
    heroesAt(r,f).forEach(id=>{if(R()<.7)S.hero[id].loc=pick(fn);});const mv=Math.round(S.reg[r].tr*.5);const d=pick(fn);const can=Math.min(mv,REG[d].cap-S.reg[d].tr);S.reg[r].tr-=can;S.reg[d].tr+=can;});
  // 攻める
  const n=regsOf(f).length;let tries=n>=6?2:1;
  const grace=S.turn<2;
  const cand=[];regsOf(f).forEach(r=>{const hs=heroesAt(r,f).filter(id=>!S.hero[id].tired);if(!hs.length||S.reg[r].tr<4000)return;
    ADJ[r].forEach(t=>{const o=S.reg[t].o;if(o===f)return;if(o===S.me&&grace)return;const as=strength(hs,S.reg[r].tr*.75,false),ds=strength(heroesAt(t),S.reg[t].tr,true,t);
      let sc=as/ds;if(!o)sc*=1.1;if(o===S.me)sc*=1.05;cand.push({r,t,hs,sc});});});
  cand.sort((a,b)=>b.sc-a.sc);
  for(const c of cand){if(tries<=0)break;if(S.reg[c.r].o!==f||S.reg[c.t].o===f)continue;if(c.sc<1.2||R()>F.ag+.15)continue;tries--;
    const hs=c.hs.filter(id=>S.hero[id].loc===c.r&&S.hero[id].f===f).sort((a,b)=>heroPower(b)-heroPower(a)).slice(0,4);if(!hs.length)continue;
    const tr=Math.round(S.reg[c.r].tr*.75);S.reg[c.r].tr-=tr;
    const B={atkF:f,defF:S.reg[c.t].o,target:c.t,atk:hs,def:heroesAt(c.t),atkTr:tr,defTr:S.reg[c.t].tr,player:S.reg[c.t].o===S.me?'def':null,home:hs.reduce((o,id)=>{o[id]=c.r;return o;},{}),src:c.r};
    UIS.arrows=[{a:c.r,b:c.t,col:F.col,t0:performance.now()/1000}];dirty=true;focusReg(c.t);await sleep(B.player?900:550);
    if(B.player){try{SND.horn();}catch(_){}banner('敵襲!',F.n+'が'+REG[c.t].c+'へ');await sleep(900);UIS.arrows=[];
      if(!B.def.length){const r0=autoBattle(B,false);await applyResult(B,await r0);}else await battle(B);}
    else{const r0=autoBattle(B,true);UIS.arrows=[];await applyResult(B,toPlayerless(r0));}
    if(!alive(S.me))return;}
  UIS.arrows=[];dirty=true;}
function aiBuild(f){let g=S.fgold[f];const fr=regsOf(f).filter(r=>ADJ[r].some(n=>S.reg[n].o!==f));const list=fr.length?fr:regsOf(f);
  for(let k=0;k<3&&list.length;k++){const r=pick(list),c=S.reg[r];
    if(c.wall<3&&g>=wallCost(c.wall)){g-=wallCost(c.wall);c.wall++;continue;}
    if(c.bld.length<bldSlots(r)){const ok=Object.keys(FB).filter(t=>c.wall>=FB[t].w&&g>=FB[t].c);if(ok.length){const t=pick(ok);g-=FB[t].c;c.bld.push({t,lv:1});continue;}}
    const up=c.bld.filter(x=>x.lv<4&&g>=FB[x.t].c*x.lv);if(up.length){const x=pick(up);g-=FB[x.t].c*x.lv;x.lv++;continue;}
    if(c.wall<5&&g>=wallCost(c.wall)){g-=wallCost(c.wall);c.wall++;}}
  S.fgold[f]=g;}
function toPlayerless(r){return {win:r.awin,myLeft:r.aLeft,foeLeft:r.dLeft,down:r.down,duels:[]};}

/* ================= 終わり ================= */
function checkEnd(){if(!S||S.over)return;
  if(!alive(S.me)){S.over=1;save();playStory(ENDING_LOSE(),{bg:'dark'}).then(()=>{localStorage.removeItem(SKEY);title();});return;}
  if(regsOf(S.me).length===21){S.over=1;save();playStory(ENDING_WIN(),{bg:'altar',place:'洛陽'}).then(()=>endingCard());}}
function endingCard(){const s=S.stats;const b='<div style="text-align:center;font-family:var(--f-disp);font-size:clamp(50px,15vw,90px);line-height:1.1;color:var(--gold2)">天下統一</div><p style="text-align:center;margin:0">'+FAC[S.me].n+' ・ '+S.year+'年'+SEASON[S.season]+'</p><dl class="kv" style="justify-content:center"><dt>合戦</dt><dd>'+s.war+'戦 '+s.win+'勝</dd><dt>一騎打ち</dt><dd>'+s.dwon+'勝 / '+s.duel+'回</dd><dt>登用</dt><dd>'+s.recruit+'人</dd><dt>仕えた武将</dt><dd>'+Object.keys(S.met).length+'人</dd></dl>';
  const d=sheet('覇王',b,'<button class="btn pri" type="button" id="eNew">別の君主で遊ぶ</button>');d.querySelector('#eNew').onclick=()=>{localStorage.removeItem(SKEY);S=null;closeSheet();title();};}

/* ================= 物語（三国英雄伝の物語画面） ================= */
const HN={};HEROES.forEach(h=>HN[h.n]=h);
function parseScript(text){const out=[];for(let raw of String(text||'').split('\n')){let ln=raw.trim();if(!ln)continue;let cond=0;const m=ln.match(/^([12])[>＞]/);if(m){cond=+m[1];ln=ln.slice(2).trim();}
  if(/^[＃#]/.test(ln)){out.push({k:'n',t:ln.slice(1).trim(),cond});continue;}
  if(/^[＠@]/.test(ln)){const[c,...rest]=ln.slice(1).trim().split(/\s+/);out.push({k:'cmd',c,a:rest.join(' '),cond});continue;}
  if(/^[？?]/.test(ln)){out.push({k:'q',opts:ln.slice(1).split(/[｜|]/).map(s=>s.trim()),cond});continue;}
  const i=ln.indexOf('：');if(i>0&&i<12){out.push({k:'s',who:ln.slice(0,i),t:ln.slice(i+1),cond});continue;}
  out.push({k:'n',t:ln,cond});}return out;}
function paintBg(cv,kind){const W=cv.width=Math.round(cv.clientWidth*1.5)||600,Hh=cv.height=Math.round(cv.clientHeight*1.5)||1000;const g=cv.getContext('2d');let seed=7;const Rn=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const sky=(a,b,c)=>{const s=g.createLinearGradient(0,0,0,Hh);s.addColorStop(0,a);s.addColorStop(.55,b);s.addColorStop(1,c);g.fillStyle=s;g.fillRect(0,0,W,Hh);};
  const ridge=(y,amp,col,n=5)=>{g.fillStyle=col;g.beginPath();g.moveTo(0,Hh);const ph=Rn()*6;for(let x=0;x<=W;x+=W/60)g.lineTo(x,y-Math.abs(Math.sin(x/W*n+ph))*amp-Math.sin(x/W*n*3.1+ph)*amp*.25);g.lineTo(W,Hh);g.fill();};
  const ground=(y,a,b)=>{const s=g.createLinearGradient(0,y,0,Hh);s.addColorStop(0,a);s.addColorStop(1,b);g.fillStyle=s;g.fillRect(0,y,W,Hh-y);};
  const tree=(x,y,s,leaf)=>{g.fillStyle='#3a2614';g.fillRect(x-s*.06,y-s*.6,s*.12,s*.6);g.fillStyle=leaf;for(let i=0;i<6;i++){g.beginPath();g.arc(x+(Rn()-.5)*s*.7,y-s*.6-Rn()*s*.4,s*(.18+Rn()*.12),0,7);g.fill();}};
  const stars=n=>{g.fillStyle='#fff';for(let i=0;i<n;i++){g.globalAlpha=.3+Rn()*.7;g.fillRect(Rn()*W,Rn()*Hh*.5,2,2);}g.globalAlpha=1;};
  const tent=(x,y,s,col)=>{g.fillStyle=col;g.beginPath();g.moveTo(x,y-s);g.lineTo(x+s*.8,y);g.lineTo(x-s*.8,y);g.fill();g.strokeStyle='#5a3a1a';g.lineWidth=3;g.beginPath();g.moveTo(x,y-s);g.lineTo(x,y-s*1.4);g.stroke();g.fillStyle='#c03030';g.fillRect(x,y-s*1.4,s*.35,s*.2);};
  const roof=(cx,y,w,col)=>{g.fillStyle=col;g.beginPath();g.moveTo(cx-w*.6,y);g.quadraticCurveTo(cx-w*.3,y-w*.12,cx,y-w*.22);g.quadraticCurveTo(cx+w*.3,y-w*.12,cx+w*.6,y);g.lineTo(cx+w*.5,y+w*.06);g.lineTo(cx-w*.5,y+w*.06);g.fill();};
  const vign=a=>{const v=g.createRadialGradient(W/2,Hh*.45,Hh*.2,W/2,Hh*.45,Hh*.8);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,'+a+')');g.fillStyle=v;g.fillRect(0,0,W,Hh);};
  switch(kind){
    case 'garden':sky('#f9dfe8','#fdf0f3','#b9cf8c');ridge(Hh*.5,Hh*.08,'#c9b8c8');ground(Hh*.55,'#a9c47c','#6f9548');for(let i=0;i<7;i++){const x=Rn()*W,y=Hh*(.55+Rn()*.2),s=Hh*(.18+Rn()*.12);g.fillStyle='#4a2a18';g.fillRect(x-s*.05,y-s*.7,s*.1,s*.7);for(let k=0;k<70;k++){g.globalAlpha=.35+Rn()*.45;g.fillStyle=['#f2b8c8','#e89cb0','#f8d8e0','#d88aa0'][k%4];const an=Rn()*6.28,rr=Math.pow(Rn(),.6)*s*.5;g.beginPath();g.arc(x+Math.cos(an)*rr*1.1,y-s*.7+Math.sin(an)*rr*.7,s*.05,0,7);g.fill();}}g.globalAlpha=1;break;
    case 'palace':sky('#2a0806','#5a1a10','#3a1a0a');g.fillStyle='#7a4a1e';g.fillRect(0,Hh*.62,W,Hh);for(let i=0;i<5;i++){const x=W*(.08+i*.21);g.fillStyle='#a8281a';g.fillRect(x,Hh*.12,W*.06,Hh*.52);g.fillStyle='#e8b040';g.fillRect(x-6,Hh*.12,W*.06+12,12);g.fillRect(x-6,Hh*.6,W*.06+12,14);}g.fillStyle='#c9a227';g.fillRect(W*.3,Hh*.44,W*.4,Hh*.06);roof(W/2,Hh*.12,W*1.1,'#2a1410');vign(.5);break;
    case 'room':sky('#3a2414','#4a2e18','#2a1a0c');g.fillStyle='#5a3a20';for(let x=0;x<W;x+=60)g.fillRect(x,0,6,Hh*.62);g.fillStyle='#8a6a3a';g.fillRect(0,Hh*.62,W,Hh);g.fillStyle='#e8d8a8';g.fillRect(W*.58,Hh*.12,W*.3,Hh*.24);{const lg=g.createRadialGradient(W*.2,Hh*.4,5,W*.2,Hh*.4,Hh*.4);lg.addColorStop(0,'rgba(255,200,100,.55)');lg.addColorStop(1,'rgba(255,200,100,0)');g.fillStyle=lg;g.fillRect(0,0,W,Hh);}vign(.5);break;
    case 'camp':case 'battle':sky(kind==='camp'?'#e8a868':'#c8905a','#f2d4a0','#8a7040');ridge(Hh*.5,Hh*.1,'#a88a62');ridge(Hh*.56,Hh*.06,'#8a7048');ground(Hh*.58,'#a89058','#5a4424');for(let i=0;i<6;i++)tent(W*(.1+Rn()*.8),Hh*(.62+Rn()*.14),Hh*(.06+Rn()*.05),['#f4ecd8','#e8dcc4','#d8c8a8'][i%3]);
      if(kind==='battle'){g.strokeStyle='#3a2a1a';g.lineWidth=3;for(let i=0;i<30;i++){const x=Rn()*W,y=Hh*(.6+Rn()*.3);g.beginPath();g.moveTo(x,y);g.lineTo(x+6,y-Hh*.12);g.stroke();g.fillStyle=['#c03030','#3050a0','#e0b030'][i%3];g.fillRect(x+6,y-Hh*.12,18,12);}}break;
    case 'castle':sky('#a8c8e0','#e0ecf2','#7a9a52');ridge(Hh*.42,Hh*.1,'#9aa8b0');g.fillStyle='#a49c8c';g.fillRect(0,Hh*.4,W,Hh*.24);g.fillStyle='#3a2a1a';g.fillRect(W*.42,Hh*.5,W*.16,Hh*.14);g.fillStyle='#7a5a3a';g.fillRect(W*.36,Hh*.3,W*.28,Hh*.1);roof(W/2,Hh*.3,W*.5,'#5a1a12');ground(Hh*.64,'#8aa85a','#4a6a32');break;
    case 'night':sky('#040818','#141e40','#0a140a');stars(160);g.fillStyle='#fff8d8';g.beginPath();g.arc(W*.78,Hh*.14,Hh*.05,0,7);g.fill();ridge(Hh*.5,Hh*.1,'#101a2a');ground(Hh*.56,'#0e1a12','#040804');for(let i=0;i<8;i++)tree(Rn()*W,Hh*(.6+Rn()*.2),Hh*.14,'#0a1a0e');break;
    case 'fire':sky('#1a0402','#8a1a06','#ff7a1a');for(let i=0;i<40;i++){const x=Rn()*W,y=Hh*(.45+Rn()*.25),s=20+Rn()*60;const f=g.createRadialGradient(x,y,2,x,y,s);f.addColorStop(0,'rgba(255,230,120,.9)');f.addColorStop(.5,'rgba(255,120,20,.5)');f.addColorStop(1,'rgba(255,60,0,0)');g.fillStyle=f;g.fillRect(x-s,y-s,s*2,s*2);}ground(Hh*.62,'#2a0802','#0a0200');break;
    case 'snow':sky('#b8c4ce','#e8eef2','#ffffff');ridge(Hh*.4,Hh*.15,'#dfe6ec',3);ridge(Hh*.5,Hh*.08,'#cfd8e0');ground(Hh*.56,'#f6f9fb','#d8e2ea');g.fillStyle='#6a4a2a';g.fillRect(W*.55,Hh*.5,W*.3,Hh*.12);g.fillStyle='#f4f4f0';g.beginPath();g.moveTo(W*.5,Hh*.51);g.lineTo(W*.7,Hh*.42);g.lineTo(W*.9,Hh*.51);g.fill();for(let i=0;i<6;i++)tree(W*(.05+Rn()*.4),Hh*(.58+Rn()*.1),Hh*.12,'#3a5a3a');g.fillStyle='#fff';for(let i=0;i<160;i++){g.globalAlpha=.8;g.beginPath();g.arc(Rn()*W,Rn()*Hh,1.5+Rn()*2.5,0,7);g.fill();}g.globalAlpha=1;break;
    case 'altar':sky('#03050f','#101836','#2a1e10');stars(200);for(let i=0;i<3;i++){g.fillStyle=['#6a4a2a','#7a5a34','#8a6a3e'][i];g.fillRect(W*(.2+i*.08),Hh*(.6-i*.05),W*(.6-i*.16),Hh*.05);}for(let i=0;i<12;i++){const x=W*(.1+i*.075);g.strokeStyle='#ccc';g.lineWidth=2;g.beginPath();g.moveTo(x,Hh*.7);g.lineTo(x,Hh*.55);g.stroke();g.fillStyle=['#c03030','#3050c0','#e0c030','#30a050'][i%4];g.fillRect(x,Hh*.55,16,22);}ground(Hh*.7,'#2a1e10','#100a04');break;
    case 'dawn':sky('#2a2a5a','#e0906a','#3a3424');g.fillStyle='rgba(255,220,150,.8)';g.beginPath();g.arc(W*.5,Hh*.5,Hh*.08,0,7);g.fill();ridge(Hh*.5,Hh*.1,'#5a4050');ridge(Hh*.56,Hh*.06,'#3a2a30');ground(Hh*.6,'#3a3424','#1a160e');break;
    case 'dark':sky('#05040a','#0a0814','#020204');vign(.6);break;
    default:sky('#8ec5e8','#d9ecf5','#5f8a3a');ridge(Hh*.48,Hh*.1,'#8aa0b0');ridge(Hh*.53,Hh*.06,'#6a8a6a');ground(Hh*.55,'#9fbf6a','#5f8a3a');for(let i=0;i<10;i++)tree(Rn()*W,Hh*(.58+Rn()*.2),Hh*.12,'#3a6a32');}
  try{const d=g.getImageData(0,0,W,Hh),a=d.data;const kk=['night','dark','altar','fire'].includes(kind)?.2:.42;for(let i=0;i<a.length;i+=4){const r=a[i],gg=a[i+1],b=a[i+2];const l=r*.3+gg*.59+b*.11;a[i]=r+(l*1.07+18-r)*kk;a[i+1]=gg+(l*.95+12-gg)*kk;a[i+2]=b+(l*.74+4-b)*kk;}g.putImageData(d,0,0);}catch(e){}}
function playStory(text,opt){opt=opt||{};const lines=parseScript(text);if(!lines.length)return Promise.resolve(0);
  return new Promise(done=>{const l=el('div','sv');document.body.appendChild(l);
    l.innerHTML='<canvas class="sv-sky"></canvas><div class="sv-place"'+(opt.place?'':' hidden')+'>'+esc(opt.place||'')+'</div><button class="btn sm sv-skip" type="button">スキップ ▶▶</button>'+
      '<div class="sv-stage"><div class="sv-fig sv-l" hidden><img alt=""><b class="sv-nm"></b></div><div class="sv-fig sv-r" hidden><img alt=""><b class="sv-nm"></b></div></div>'+
      '<div class="sv-box"><div class="sv-who"></div><div class="sv-said"></div><div class="sv-next">▼</div></div>';
    const sky=l.querySelector('.sv-sky'),box=l.querySelector('.sv-box'),who=l.querySelector('.sv-who'),said=l.querySelector('.sv-said'),nx=l.querySelector('.sv-next');
    const paint=k=>requestAnimationFrame(()=>paintBg(sky,k));paint(opt.bg||'field');
    const slot={l:null,r:null};let last='r';
    const stage=name=>{const im={l:l.querySelector('.sv-l'),r:l.querySelector('.sv-r')};if(!name){im.l.classList.add('off');im.r.classList.add('off');return;}
      let k=slot.l===name?'l':slot.r===name?'r':null;
      if(!k){k=last==='l'?'r':'l';slot[k]=name;im[k].querySelector('img').src=portrait(HN[name]);im[k].querySelector('.sv-nm').textContent=name;im[k].hidden=false;im[k].classList.remove('in');void im[k].offsetWidth;im[k].classList.add('in');}
      last=k;im[k].classList.remove('off');im[k==='l'?'r':'l'].classList.add('off');};
    let skip=false,adv=null,choice=0,i=0;
    l.querySelector('.sv-skip').onclick=e=>{e.stopPropagation();skip=true;if(adv){const a=adv;adv=null;a();}};
    l.addEventListener('pointerup',e=>{if(e.target.closest('.sv-skip,.sv-choice'))return;if(adv){const a=adv;adv=null;a();}});
    const wait=()=>new Promise(r=>{adv=r;});
    (async()=>{for(;i<lines.length;i++){const ln=lines[i];if(ln.cond&&ln.cond!==choice)continue;
        if(ln.k==='cmd'){if(ln.c==='bg')paint(ln.a);else if(ln.c==='se'){try{({gong:()=>SND.gong(.2),horn:()=>SND.horn(),fire:()=>SND.fire(),cry:()=>SND.warcry()})[ln.a]();}catch(_){}}
          else if(ln.c==='title'&&!skip){const c=el('div','sv-title','<b>'+esc(ln.a)+'</b>');l.appendChild(c);try{SND.gong(.2);}catch(_){}await sleep(1600);c.remove();}continue;}
        if(ln.k==='q'){box.hidden=true;choice=await new Promise(res=>{const c=el('div','sv-choice');ln.opts.forEach((o,k)=>{const b=el('button','btn',esc(o));b.type='button';b.onclick=e=>{e.stopPropagation();c.remove();res(k+1);};c.appendChild(b);});l.appendChild(c);});box.hidden=false;skip=false;continue;}
        if(skip)continue;
        const t=ln.t.replace(/／/g,'\n');
        if(ln.k==='n'){box.classList.add('nar');who.textContent='';stage(null);}else{box.classList.remove('nar');who.textContent=ln.who;if(HN[ln.who])stage(ln.who);else stage(null);}
        nx.hidden=true;said.textContent='';try{SND.tone(880,.03,'triangle',.02);}catch(_){}
        const ch=Array.from(t);let n=0,typing=true;
        await new Promise(res=>{adv=()=>{typing=false;};const tick=()=>{if(!typing||skip){said.textContent=t;res();return;}said.textContent=ch.slice(0,++n).join('');if(n>=ch.length){res();return;}setTimeout(tick,22);};tick();});
        nx.hidden=false;if(!skip)await wait();}
      l.remove();done(choice);})();});}
const NM=id=>HB(id).n;
function OPENING(f){const r=rulerOf(f),R0=NM(r);
  const O=S&&S.opt||{};const base='@title 三国覇王伝\n#西暦一九四年。董卓は都を握り、漢の天下は崩れかけていた。\n'+(O.newland?'#……ここは見知らぬ大陸。二十一の城が、まだ誰も見たことのない形に並んでいる。\n':'')+(O.swapped||O.swap?'#国替えの令が下り、群雄はそれぞれ見知らぬ土地に移された。\n':'')+(O.mix?'#家臣たちも散りぢりとなり、思いもよらぬ主のもとに集った。\n':'')+'#各地に群雄が割拠し、それぞれの旗を掲げる。\n';
  const T={
   cao:'@bg palace\n曹操：天下の英雄は、この曹孟徳ただ一人。\n夏侯惇：孟徳、兵はそろった。どこから攻める?\n曹操：中原を制する者が天下を制す。……まずは、隣の呂布を叩け。',
   liu:'@bg garden\n#桃園で義兄弟の契りを結んでから十年。三人はいまだ小さな平原の地にいた。\n劉備：我ら三人、生まれた日は違えども、死ぬときは同じ日を願う。\n関羽：兄者、この関羽、どこまでもお供いたす。\n張飛：へへっ、天下なんぞ俺たち三人で取ってやらあ!\n劉備：まずは人を集めよう。襄陽の隆中には「臥龍」と呼ばれる賢人がいると聞く。',
   sun:'@bg river\n孫堅：江東の虎の牙、まだ鈍ってはおらぬぞ。\n孫策：父上、長江を越えれば天下が見えます!\n周瑜：殿、急がず、まずは荊州を。長江を押さえた者が南を制します。',
   lu:'@bg night\n呂布：義父も董卓も、もう要らぬ。この方天画戟と赤兎があれば十分よ。\n陳宮：殿、武だけでは天下は取れませぬ。人を集め、地を固めねば。\n呂布：ふん。……ならば、立ちはだかる者すべてを斬るまでだ。',
   yuan:'@bg palace\n袁紹：四世三公の名門、袁本初が天下を正す。\n顔良：殿、河北の兵はどこよりも多い!\n文醜：南の曹操も北の公孫瓚も、ひと揉みにしてくれましょう!',
   dong:'@bg palace\n董卓：洛陽も長安も、帝もわしのものよ。\n華雄：相国、刃向かう諸侯どもはこの華雄が斬り捨てましょう。\n董卓：がははは! 天下はとうにわしの手の中じゃ!',
   ma:'@bg field\n馬騰：西涼の騎兵は天下一。漢室を乱す董卓を討つ。\n馬超：父上、この馬孟起が先陣を駆けます!\n龐徳：西涼の風、中原へ吹かせてみせましょう。',
   gs:'@bg snow\n公孫瓚：白馬義従の名、天下に知らしめてくれる。\n趙雲：常山の趙子龍、殿のために槍を振るいます。\n公孫瓚：まずは南の袁紹よ。あれを倒せば河北は我らのもの。',
   man:'@bg south\n孟獲：北の連中が争っている間に、南蛮の力を見せてやる!\n祝融：あんた、あたしも一緒に暴れるよ!\n孟獲：わははは! 七度でも八度でも戦ってやるわい!'};
  return base+(T[f]||'')+'\n#天下は二十一の地に分かれている。そのすべてを治めたとき、乱世は終わる。';}
function SANKO(f){const r=NM(rulerOf(f));return '@title 三顧の礼\n#三度目の訪問。'+r+'は草廬の前で、主が昼寝から覚めるのを待った。\n諸葛亮：お待たせいたしました。三度も足を運ばれるとは。\n'+r+'：先生の知恵をお借りしたい。乱れた天下を正すために。\n諸葛亮：……北に強大な者あり、東に長江の国あり。まず荊州と益州を取り、天下を三つに分ける。それが「天下三分の計」。\n?先生、どうか我が軍へ｜天下三分の先を聞かせてほしい\n2>諸葛亮：三つに分けた天下を、やがて一つにまとめる。その道筋は、殿の歩みしだいでございます。\n諸葛亮：この孔明、殿のために草廬を出ましょう。\n#諸葛亮が仲間に加わった。';}
function ENDING_WIN(){const r=NM(rulerOf(S.me));return '@title 天下統一\n#'+S.year+'年。二十一の地はすべて'+FAC[S.me].n+'の旗のもとに一つとなった。\n'+r+'：長かった……。だが、ようやく乱世は終わる。\n#'+r+'は洛陽の祭壇に立ち、天に勝利を告げた。\n'+r+'：'+line(rulerOf(S.me),'win')+'\n#こうして、百年続くはずだった乱世は、一人の覇王の手で幕を閉じた。';}
function ENDING_LOSE(){const r=NM(rulerOf(S.me)||FAC[S.me].ruler);return '@bg dark\n#最後の城が落ちた。\n'+r+'：'+line(rulerOf(S.me)||FAC[S.me].ruler,'lose')+'\n#'+FAC[S.me].n+'の旗は、乱世の風にちぎれて消えた。\n#……だが、天下を夢見る者は、また現れる。';}
async function storyHook(k,a,b){if(!S)return;
  if(k==='captured'){const id=a;
    if(id==='lubu'&&!S.flags.lubuCap){S.flags.lubuCap=1;await playStory('@title 白門楼\n呂布：縄がきつすぎる、少しゆるめてくれ。\n'+NM(rulerOf(S.me))+'：虎を縛るのだ、きつくせねばな。\n呂布：わしを使え。騎兵を任せれば、天下はたやすく取れるぞ。\n#天下無双の武か、裏切りの前歴か。登用は「人材」から試せる。',{bg:'castle',place:'白門楼'});}
    if(id==='guan'&&S.me!=='liu'&&!S.flags.guanCap){S.flags.guanCap=1;await playStory('関羽：殺すなら殺せ。わしは兄者以外には仕えぬ。\n#関羽の義は固い。劉備が生きているかぎり、心を動かすのは難しいだろう。',{bg:'room'});}
  }
  if(k==='after'&&a.target==='sili'&&b&&a.atkF===S.me&&!S.flags.emperor){S.flags.emperor=S.me;S.ap++;save();topBar();
    await playStory('@title 天子を奉ず\n#洛陽の焼け跡に、若き帝はひっそりと身を潜めていた。\n'+NM(rulerOf(S.me))+'：陛下、お迎えにあがりました。\n#帝を迎えた'+FAC[S.me].n+'の命令は、天下に重みを持つようになった。（令が1つ増える）',{bg:'palace',place:'洛陽'});}
  if(k==='after'&&a.player){for(const f of FIDS){if(f!==S.me&&S.flags['fall_'+f]&&!S.flags['fallSeen_'+f]){S.flags['fallSeen_'+f]=1;const r=FAC[f].ruler;
    await playStory('#'+FAC[f].n+'の旗が倒れた。\n'+NM(r)+'：'+line(r,'lose')+'\n#'+FAC[f].n+'は滅亡した。',{bg:'dark'});}}}
  if(k==='season'){
    if(S.me==='liu'&&!S.flags.sons&&S.turn>=3&&S.hero.guanxing&&S.hero.guanxing.f===null){S.flags.sons=1;
      await playStory('関興：父上! 私も戦います!\n張苞：俺もだ、親父! 蛇矛の使い方は覚えたぜ!\n張飛：はっはっは! わしの子なら当然だ!\n#関興と張苞が軍に加わった。',{bg:'camp'});['guanxing','zhangbao2'].forEach(id=>joinHero(id,regsOf(S.me)[0]));}
    if(S.me==='sun'&&!S.flags.tsc&&S.turn>=2&&S.hero.tsc&&S.hero.tsc.f===null){S.flags.tsc=1;
      await playStory('@title 神亭の一騎打ち\n太史慈：江東の小覇王とはおまえか! 勝負しろ!\n孫策：おもしれえ! かかってこい!\n#二人は百合を打ち合い、ついに決着はつかなかった。\n孫策：……気に入った。俺と来い、太史慈。\n太史慈：この太史子義、あなたの器に惚れた。\n#太史慈が軍に加わった。',{bg:'field'});joinHero('tsc',regsOf(S.me)[0]);}
    if(S.flags.guanCap===1&&S.hero.guan&&S.hero.guan.f===S.me&&alive('liu')&&!S.flags.guanGone&&R()<.25){S.flags.guanGone=1;const to=regsOf('liu')[0];
      await playStory('@title 千里行\n関羽：殿のご恩、決して忘れませぬ。されど、兄者の居場所がわかった以上……\n#関羽は封をした金銀をすべて残し、劉備のもとへ去っていった。',{bg:'field'});S.hero.guan.f='liu';S.hero.guan.loc=to;save();repaint();}}
}

/* ================= タイトル ================= */
function title(){closeSheet();const T=$('#title');T.hidden=false;try{BGM.play('camp');}catch(_){}
  const sv=load();
  T.innerHTML='<canvas></canvas><div class="in"><div class="eye">決戦 ・ 戦術 ・ 一騎打ち ・ 物語</div><h1>三国覇王伝</h1>'+
    '<p>二十一の地に分かれた天下を、ひとつにせよ。<br>城を攻めるたびに戦い方を選ぶ ― 大軍の<b>決戦</b>か、一手ずつの<b>戦術</b>か、武将どうしの<b>一騎打ち</b>か。<br>倒した敵将を捕らえ、在野の英雄を口説き、君主の物語を紡げ。</p>'+
    '<div class="four"><div><b>決</b>三国決戦伝</div><div><b>戦</b>三国タクティクス</div><div><b>騎</b>一騎打ち英雄伝</div><div><b>物</b>三国英雄伝</div></div>'+
    '<div class="row" style="justify-content:center">'+(sv&&!sv.over?'<button class="btn pri big" type="button" id="tCont">続きから<small style="display:block;font-family:var(--f-body);font-size:11px;letter-spacing:0">'+FAC[sv.me].n+' '+sv.year+'年'+SEASON[sv.season]+'</small></button>':'')+'<button class="btn big'+(sv&&!sv.over?'':' pri')+'" type="button" id="tNew">新しい天下</button></div></div>';
  requestAnimationFrame(()=>paintBg(T.querySelector('canvas'),'dawn'));
  const c=T.querySelector('#tCont');if(c)c.onclick=()=>{try{SND.init();}catch(_){}S=sv;T.hidden=true;enterMap();};
  T.querySelector('#tNew').onclick=()=>{try{SND.init();}catch(_){}lordSelect();};}
/* 引いた天下を見て、勢力ごとの難しさを判定する */
function rateWorld(W){const adj={};RIDS.forEach(r=>adj[r]=[]);W.map.adj.forEach(x=>{const[a,b]=x.split('-');adj[a].push(b);adj[b].push(a);});
  const cap=r=>(W.map.reg&&W.map.reg[r]?W.map.reg[r].cap:DEF_REG[r].cap);
  const tr=r=>{const o=W.own[r],t=START.reg[r][1];return Math.min(cap(r),o?Math.max(t,8000):Math.min(t,7000));};
  const heroes=f=>Object.keys(W.place).filter(id=>W.place[id][0]===f);
  const hp=id=>{const h=HB(id);return h.p*.6+(h.cmd||60)*.8+h.i*.4;};
  const pow={};W.fids.forEach(f=>{const lands=RIDS.filter(r=>W.own[r]===f);const hs=heroes(f).map(hp).sort((a,b)=>b-a);
    const troops=lands.reduce((a,r)=>a+tr(r),0);const top=Math.max(60,...heroes(f).map(id=>HB(id).cmd||60));
    pow[f]=troops/1000*(.55+top/180)+hs.slice(0,5).reduce((a,v)=>a+v,0)/40+lands.reduce((a,r)=>a+cap(r),0)/8000;});
  const out={};W.fids.forEach(f=>{const lands=RIDS.filter(r=>W.own[r]===f);const nb=new Set(),neu=new Set();let front=0;
    lands.forEach(r=>adj[r].forEach(n=>{const o=W.own[n];if(o===f)return;front++;if(o)nb.add(o);else neu.add(n);}));
    const ns=[...nb].map(o=>pow[o]);const mx=ns.length?Math.max(...ns):0,sum=ns.reduce((a,b)=>a+b,0);
    const avg=W.fids.reduce((a,o)=>a+pow[o],0)/W.fids.length;const own=pow[f]/avg;const threat=(.5*mx+.15*sum)/avg+.04*front;
    const score=own*(1+.06*Math.min(4,neu.size))/(threat+.55);
    const big=[...nb].sort((a,b)=>pow[b]-pow[a])[0];
    const why=[];if(big&&pow[big]>pow[f]*1.3)why.push('隣に強敵（'+FAC[big].n+'）');if(neu.size>=2)why.push('攻めやすい空き地が'+neu.size+'つ');if(!nb.size)why.push('敵と接していない');
    if(heroes(f).length<=2)why.push('人材が少ない');else if(heroes(f).length>=7)why.push('人材が豊富');if(front>=8)why.push('四方を囲まれている');
    out[f]={score,why};});
  const sc=W.fids.map(f=>out[f].score).sort((a,b)=>a-b);const med=sc[Math.floor(sc.length/2)]||1;
  W.fids.forEach(f=>{const k=out[f].score/med;const L=k>=1.4?['やさしい','#3a7a2a',1]:k>=.85?['ふつう','#2a5a8a',2]:k>=.6?['むずかしい','#8a3a12',3]:['至難','#5a0a0a',4];
    out[f].lab=L[0];out[f].col=L[1];out[f].lv=L[2];});
  return out;}
let DRAFT=null,DRAFTP=null;const DOPT={custom:false,swap:false,map:'def',sub:'def',subn:'def',size:'def',blank:'def',nf:'def',scale:'def'};
function drawPreview(cv,W){applyMap(W.map);const w=300,h=270;cv.width=w;cv.height=h;const x=cv.getContext('2d');const img=x.createImageData(w,h),a=img.data;const gd=new Int8Array(w*h);
  const RI={};RIDS.forEach((r,i)=>RI[r]=i);
  for(let py=0;py<h;py++)for(let px=0;px<w;px++){const X=px/w*100,Y=py/h*90;let g=-1;
    if(mapInOut(X,Y)){const nx=X+2.2*Math.sin(Y*.45)+1.3*Math.sin(Y*1.3+X*.2),ny=Y+2.2*Math.cos(X*.4)+1.2*Math.sin(X*1.1);let bd=1e9;for(const s_ of MAP_SEEDS){const d=(nx-s_[1])**2+(ny-s_[2])**2;if(d<bd){bd=d;g=RI[s_[0]];}}}
    gd[py*w+px]=g;}
  for(let i=0;i<w*h;i++){const g=gd[i],o=i*4;if(g<0){a[o]=150;a[o+1]=176;a[o+2]=178;a[o+3]=255;continue;}
    const f=W.own[RIDS[g]];const c=hexRgb(facCol(f));const k=f?.6:0;const bi=CLIM_CUR?bioAt(CLIM_CUR,(i%w)/w*100,(i/w|0)/h*90):null;const P_=bi?{sand:[236,206,140],snow:[244,246,250],jungle:[168,196,128]}[bi]:[228,214,180];const l=i%w?gd[i-1]:g,u=i>=w?gd[i-w]:g;const e=(l>=0&&l!==g)||(u>=0&&u!==g)?(W.own[RIDS[l>=0&&l!==g?l:u]]!==f?.45:.8):1;
    const cst=(i%w&&gd[i-1]<0)||(i>=w&&gd[i-w]<0)||(i%w<w-1&&gd[i+1]<0)||(i<w*(h-1)&&gd[i+w]<0)?.35:1;
    a[o]=(c[0]*k+P_[0]*(1-k))*e*cst;a[o+1]=(c[1]*k+P_[1]*(1-k))*e*cst;a[o+2]=(c[2]*k+P_[2]*(1-k))*e*cst;a[o+3]=255;}
  x.putImageData(img,0,0);const sx=w/100,sy=h/90;
  x.strokeStyle='rgba(40,90,140,.75)';x.lineWidth=2;MAP_RIV.forEach(r=>{x.beginPath();r.forEach((p,i)=>i?x.lineTo(p[0]*sx,p[1]*sy):x.moveTo(p[0]*sx,p[1]*sy));x.stroke();});
  x.textAlign='center';x.textBaseline='middle';
  MAP_MTN.forEach(pl=>{for(let i=0;i<pl.length-1;i++){const A=pl[i],B=pl[i+1];for(let t=0;t<=1;t+=.34){const X=(A[0]+(B[0]-A[0])*t)*sx,Y=(A[1]+(B[1]-A[1])*t)*sy;x.fillStyle='#7a6a52';x.beginPath();x.moveTo(X-5,Y+3);x.lineTo(X,Y-5);x.lineTo(X+5,Y+3);x.fill();}}});
  ADJ_L.forEach(k=>{const[a,b]=k.split('-');const tp=ET[k]||'road';x.strokeStyle={road:'rgba(70,40,15,.8)',river:'#1f5f9e',mount:'#555',sea:'#0f4a8a'}[tp];x.lineWidth=1.6;x.setLineDash(tp==='sea'?[2,4]:tp==='mount'?[3,3]:[5,3]);x.beginPath();x.moveTo(REG[a].x*sx,REG[a].y*sy);x.lineTo(REG[b].x*sx,REG[b].y*sy);x.stroke();});x.setLineDash([]);
  RIDS.forEach(r=>{const f=W.own[r];const cx=REG[r].x*sx,cy=REG[r].y*sy;x.fillStyle=f?FAC[f].col:'#9a8a68';x.strokeStyle='#20140a';x.lineWidth=1.5;x.beginPath();x.arc(cx,cy,f?8:5,0,7);x.fill();x.stroke();
    if(f){x.fillStyle='#fff';x.font='12px "Yuji Syuku",serif';x.fillText(FAC[f].ch,cx,cy+.5);}x.font='700 9px sans-serif';x.lineWidth=3;x.strokeStyle='rgba(255,250,235,.9)';x.strokeText(REG[r].c,cx,cy+13);x.fillStyle='#24160a';x.fillText(REG[r].c,cx,cy+13);});}
// カスタム：自分で決めた持ち主から勢力配置を作る
function placementFromOwn(baseP,own){const groups={};BASE_FIDS.forEach(f=>{const cap=START.hero.find(x=>x[0]===FAC[f].ruler)[2];groups[f]=[cap].concat(RIDS.filter(r=>START.reg[r][0]===f&&r!==cap));});
  const adj={};RIDS.forEach(r=>adj[r]=[]);baseP.map.adj.forEach(k=>{const[a,b]=k.split('-');adj[a].push(b);adj[b].push(a);});
  const fids=Object.keys(FAC).filter(f=>RIDS.some(r=>own[r]===f));const lands={};fids.forEach(f=>{lands[f]=RIDS.filter(r=>own[r]===f).sort((a,b)=>adj[b].length-adj[a].length);});
  return {opt:Object.assign({},baseP.opt,{custom:true}),fids,map:baseP.map,own:Object.assign({},own),lands,groups,historic:false};}
function permuteOwn(own){const fs=Object.keys(FAC).filter(f=>RIDS.some(r=>own[r]===f));const p=shuffle(fs.slice());const m={};fs.forEach((f,i)=>m[f]=p[i]);const o={};RIDS.forEach(r=>o[r]=own[r]?m[own[r]]:null);return o;}
let CUST=null;
function lordSelect(reroll){const T=$('#title');
  if(DOPT.custom){if(!DRAFTP||reroll==='all'){const base=makePlacement({map:DOPT.map});CUST=Object.assign({},base.own);DRAFTP=Object.assign(base,{});}
    if(reroll==='all'||reroll==='own'||!DRAFT||reroll==='staff'){DRAFTP=placementFromOwn(DRAFTP,CUST);DRAFT=makeStaff(DRAFTP,DOPT);}}
  else{if(!DRAFTP||reroll==='all')DRAFTP=makePlacement(DOPT);else if(reroll==='place')DRAFTP=makePlacement(Object.assign({},DOPT,{geo:DRAFTP.geo}));if(!DRAFT||reroll)DRAFT=makeStaff(DRAFTP,DOPT);}
  const W=DRAFT;
  const row=o=>{const dis=(o.need&&!o.need(DOPT))||(DOPT.custom&&['size','blank','nf'].includes(o.k));return '<div class="row" style="flex-wrap:nowrap;gap:6px;width:100%;opacity:'+(dis?'.4':'1')+'"><b style="flex:0 0 5.4em;font-family:var(--f-disp);font-weight:400;color:#f4e6c4;font-size:15px;text-shadow:0 1px 3px #000">'+o.n+'</b><div class="row" style="gap:4px;flex:1">'+
    o.v.map(([v,l])=>'<button type="button" class="btn sm'+((DOPT[o.k]===v&&!dis)||(dis&&v==='def'&&!DOPT.custom)?' pri':'')+'" data-k="'+o.k+'" data-v="'+v+'"'+(dis?' disabled':'')+' style="flex:1;min-width:0;font-size:12px;padding:3px 2px;white-space:nowrap;letter-spacing:0">'+l+'</button>').join('')+'</div></div>';};
  const sw=(k,n,d)=>'<div class="row" style="flex-wrap:nowrap;gap:6px;width:100%"><b style="flex:0 0 5.4em;font-family:var(--f-disp);font-weight:400;color:#f4e6c4;font-size:15px;text-shadow:0 1px 3px #000">'+n+'</b><div class="row" style="gap:4px;flex:1">'+
    [[false,'オフ'],[true,'オン']].map(([v,l])=>'<button type="button" class="btn sm'+(DOPT[k]===v?' pri':'')+'" data-sw="'+k+'" data-v="'+(v?1:0)+'" style="flex:1;min-width:0;font-size:12px;padding:3px 2px">'+l+'</button>').join('')+'</div></div><small class="muted" style="font-size:11px;margin:-2px 0 2px 6.2em">'+d+'</small>';
  const nb=RIDS.filter(r=>!W.own[r]).length,sizes=W.fids.map(f=>RIDS.filter(r=>W.own[r]===f).length);
  let h='<canvas></canvas><div class="in" style="justify-content:flex-start"><div class="eye">西暦一九四年 ・ 群雄割拠</div><h1 style="font-size:clamp(36px,10vw,64px)">天下を引く</h1>'+
    '<div class="card" style="width:min(560px,100%);display:flex;flex-direction:column;gap:6px;background:var(--tex-wood),rgba(30,18,9,.9)">'+WOPT.map(row).join('')+
    '<div style="border-top:1px solid var(--line);margin:2px 0"></div>'+sw('swap','国替','勢力どうしで領地を入れ替える')+sw('custom','カスタム','マップを選んだあと、城ごとに勢力を自分で配置する（初期都市数・空白地・国数は配置で決まる）')+'</div>'+
    '<div style="display:flex;flex-direction:column;align-items:center;gap:6px"><canvas id="pv" style="width:min(340px,88vw);height:auto;aspect-ratio:300/270;border:3px solid #6a4a22;box-shadow:0 0 0 1px #c9a23c,0 8px 24px rgba(0,0,0,.6)'+(DOPT.custom?';cursor:pointer':'')+'"></canvas>'+
    '<small style="color:#f4e6c4;text-shadow:0 1px 3px #000">'+(W.map.shape?W.map.shape+' ・ ':'')+'勢力 '+W.fids.length+(sizes.length?' ・ 都市数 '+Math.min(...sizes)+'〜'+Math.max(...sizes):'')+' ・ 空白地 '+nb+'</small>'+
    (DOPT.custom?'<small style="color:#ffe08a;text-shadow:0 1px 3px #000">地図の城をタップして持ち主を決める</small><div class="row" style="justify-content:center">'+(DOPT.map==='new'?'<button class="btn" type="button" id="gMap">地図を引き直す</button>':'')+'<button class="btn" type="button" id="gClr">全部空白にする</button><button class="btn pri" type="button" id="gS">配下を引く</button></div>':'<button class="btn pri big" type="button" id="gDraw">ガチャを引く</button>')+'</div>'+
    '<div class="eye" style="letter-spacing:.3em">君主を選ぶ</div><div class="lords">';
  const RT=W.fids.length>1?rateWorld(W):{};
  W.fids.forEach(f=>{const F=FAC[f];const rt=RT[f]||{lab:'ふつう',col:'#2a5a8a',why:[]};const regs=RIDS.filter(r=>W.own[r]===f);const cap=W.place[F.ruler][1];regs.sort((a,b)=>(b===cap)-(a===cap));const hs=Object.keys(W.place).filter(id=>W.place[id][0]===f);
    const top=hs.filter(id=>id!==F.ruler).sort((a,b)=>HB(b).p+HB(b).i-HB(a).p-HB(a).i).slice(0,3).map(id=>HB(id).n);
    h+='<button class="lordc" type="button" data-f="'+f+'" style="--c:'+F.col+';--d:'+rt.col+'"><img alt="" src="'+portrait(HB(F.ruler))+'"><div style="min-width:0"><b>'+F.n+'<em>'+rt.lab+'</em></b><small>'+regs.map(r=>REG[r].c).join('・')+' ・ 武将'+hs.length+'人</small><small>'+(W.opt.mix||W.opt.swapped||W.opt.newland||W.opt.custom?'配下：'+(top.join('・')||'なし')+(hs.length>4?' ほか':''):F.d)+'</small>'+(rt.why.length?'<small style="color:#e8c87a">'+rt.why.join('・')+'</small>':'')+'</div></button>';});
  if(!W.fids.length)h+='<p style="color:#f4e6c4">城をタップして、勢力を一つ以上置こう</p>';
  h+='</div><button class="btn" type="button" id="lBack">戻る</button></div>';T.innerHTML=h;requestAnimationFrame(()=>paintBg(T.querySelector('canvas'),'battle'));
  const pv=T.querySelector('#pv');drawPreview(pv,W);
  T.querySelector('#lBack').onclick=()=>{applyMap(S&&S.map||DEF_MAP);title();};
  const again=m=>{try{SND.gong(.14);}catch(_){}const y=T.scrollTop;lordSelect(m);T.scrollTop=y;};
  [['#gDraw','all'],['#gMap','all'],['#gS','staff']].forEach(([q,m])=>{const e=T.querySelector(q);if(e)e.onclick=()=>again(m);});
  const clr=T.querySelector('#gClr');if(clr)clr.onclick=()=>{RIDS.forEach(r=>CUST[r]=null);again('own');};
  T.querySelectorAll('[data-sw]').forEach(b=>b.onclick=()=>{const k=b.dataset.sw,v=b.dataset.v==='1';if(DOPT[k]===v)return;DOPT[k]=v;
    if(k==='custom'){if(v){CUST=Object.assign({},W.own);DRAFTP=Object.assign({},DRAFTP);again('own');}else again('all');}
    else if(k==='swap'){if(DOPT.custom){if(v)CUST=permuteOwn(CUST);again('own');}else again('all');}});
  T.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const k=b.dataset.k;DOPT[k]=b.dataset.v;if(DOPT.sub!=='rand')DOPT.subn='def';again(['sub','subn','scale'].includes(k)?'staff':['size','blank','nf'].includes(k)?'place':'all');});
  if(DOPT.custom)pv.onclick=e=>{const rc=pv.getBoundingClientRect();const X=(e.clientX-rc.left)/rc.width*100,Y=(e.clientY-rc.top)/rc.height*90;applyMap(W.map);
    let best=null,bd=8;RIDS.forEach(r=>{const d=Math.hypot(REG[r].x-X,REG[r].y-Y);if(d<bd){bd=d;best=r;}});if(best)ownerPicker(best,f=>{CUST[best]=f;again('own');});};
  T.querySelectorAll('[data-f]').forEach(b=>b.onclick=async()=>{const f=b.dataset.f;newGame(f,W);DRAFT=null;DRAFTP=null;CUST=null;T.hidden=true;enterMap();await playStory(OPENING(f),{bg:'dawn'});
    toast('自分の城（金の縁）をタップ、または「戦」で出陣');});}
function ownerPicker(r,cb){const d=el('div','');d.style.cssText='position:fixed;inset:0;z-index:120;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center';
  const cur=CUST[r];const fs=Object.keys(FAC);
  d.innerHTML='<div class="card" style="width:min(560px,100%);max-height:70vh;overflow:auto;background:var(--tex-wood),linear-gradient(#26180d,#140c06);border-top:3px double var(--gold)"><h3>'+REG[r].c+'の持ち主</h3><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(100px,1fr))">'+
    '<button class="btn sm'+(!cur?' pri':'')+'" type="button" data-o="">空白地</button>'+fs.map(f=>'<button class="btn sm'+(cur===f?' pri':'')+'" type="button" data-o="'+f+'" style="border-left:6px solid '+FAC[f].col+'">'+FAC[f].n+'</button>').join('')+'</div></div>';
  document.body.appendChild(d);d.onclick=e=>{const b=e.target.closest('[data-o]');if(b){d.remove();cb(b.dataset.o||null);}else if(e.target===d)d.remove();};}
function enterMap(){applyMap(S.map||DEF_MAP);buildGrid();view.init=0;fitView();repaint();UIS.sel=null;try{BGM.play('camp');}catch(_){}
  const mine=regsOf(S.me);if(mine.length){/* 自国が見えるように少し寄る */const cv=$('#map');if(cv.clientWidth<700){view.s=1.6;const k=view.fit*view.s;const r=mine[0];view.ox=cv.clientWidth/2-REG[r].x*BW/100*k;view.oy=cv.clientHeight/2-REG[r].y*BH/90*k;clampView();}}
  dirty=true;checkEnd();}

/* ================= 起動 ================= */
function boot(){buildGrid();bindMap();
  $('#cWar').onclick=()=>startTarget();
  $('#cHero').onclick=heroSheet;$('#cTal').onclick=talentSheet;$('#cInfo').onclick=infoSheet;$('#cMenu').onclick=menuSheet;
  $('#cEnd').onclick=()=>{if(S.ap>0&&!$('#cEnd').dataset.arm){$('#cEnd').dataset.arm=1;toast('令が'+S.ap+'つ残っている。もう一度押すと季節を進める');setTimeout(()=>delete $('#cEnd').dataset.arm,2500);return;}delete $('#cEnd').dataset.arm;endTurn();};
  document.addEventListener('pointerdown',()=>{try{SND.init();}catch(_){}},true);
  requestAnimationFrame(loop);title();
  window.__HAOU={get S(){return S;},makeWorld,rateWorld,FIDS,battle,autoBattle,endTurn,REG,ADJ,tap:r=>tapRegion(r),talent:()=>talentSheet()};}
boot();
})();
