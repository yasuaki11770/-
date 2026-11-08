/* ================= 勢力図：節目ごとに中国大陸の勢力を色分けした地図を出す ================= */
// 地域の中心（0〜100 × 0〜90 の座標）。近い中心に属する場所がその地域になる
const MAP_SEEDS=[['you',76,12],['you',90,8],['ji',65,25],['bing',51,20],['qing',81,31],['yan',68,37],['xu',80,43],['yu',67,46],['sili',57,40],['yong',44,38],
  ['liang',25,29],['liang',10,20],['hanzhong',41,47],['yi',31,57],['nanzhong',27,73],['xiangyang',56,50],['jiangling',52,57],['jingS',50,68],['changsha',61,65],
  ['huainan',76,51],['jiangdong',84,59],['kuaiji',80,71],['jiao',56,83]];
const MAP_NAME={you:'幽州',ji:'冀州',bing:'并州',qing:'青州',yan:'兗州',xu:'徐州',yu:'豫州',sili:'司隷',yong:'雍州',liang:'涼州',hanzhong:'漢中',yi:'益州',nanzhong:'南中',
  xiangyang:'襄陽',jiangling:'江陵',jingS:'荊南',changsha:'長沙',huainan:'淮南',jiangdong:'江東',kuaiji:'会稽',jiao:'交州'};
const MAP_OUT=[[8,12],[22,9],[36,10],[48,5],[60,2],[74,2],[88,3],[97,6],[97,13],[89,18],[86,23],[93,29],[90,34],[85,36],[87,44],[91,51],[93,60],[90,68],[86,76],[78,83],[68,87],[58,89],[46,88],[36,86],[26,88],[17,83],[14,72],[16,60],[12,48],[4,38],[2,25]];
const MAP_RIV=[[[16,31],[28,27],[38,22],[46,13],[52,15],[51,29],[56,37],[64,35],[72,31],[80,28],[86,27]],[[16,62],[26,59],[34,60],[42,59],[48,56],[54,56],[60,59],[67,58],[74,56],[82,55],[91,54]]];
const MAP_CITY=[['洛陽',57,40],['長安',44,40],['許昌',66,45],['鄴',64,29],['成都',30,58],['建業',85,56],['寿春',74,50],['下邳',80,42]];
// 勢力の色（指定：曹操青・劉備緑・孫堅赤・董卓灰・袁紹黄・劉表水色・劉璋紫・馬騰茶・張魯黄緑・公孫瓚橙）
const MAP_FAC={cao:['#3462b8','曹操'],shu:['#2f8a46','劉備'],sun:['#b8302a','孫堅'],dong:['#7c7c7c','董卓'],yuan:['#d8b020','袁紹'],biao:['#5cbcdc','劉表'],zhang:['#7a4aa6','劉璋'],
  ma:['#8a5a30','馬騰'],lu:['#9cc23e','張魯'],gs:['#e2822e','公孫瓚'],yshu:['#de7aae','袁術'],tao:['#a8a46a','陶謙'],han:['#cdbf98','後漢'],shi:['#c4ac84','士燮'],other:['#b4ab94','諸侯'],man:['#a8683c','南蛮'],jin:['#3c8088','晋']};
const MAP_ALL=['you','ji','bing','qing','yan','xu','yu','sili','yong','liang','hanzhong','yi','nanzhong','xiangyang','jiangling','jingS','changsha','huainan','jiangdong','kuaiji','jiao'];
function mapOf(base,over){const o={};MAP_ALL.forEach(function(k){o[k]=base;});Object.assign(o,over||{});return o;}
const NORTH={you:'cao',ji:'cao',bing:'cao',qing:'cao',yan:'cao',xu:'cao',yu:'cao',sili:'cao',yong:'cao',huainan:'cao'};
// 物語の場面番号 → その場面の前に出す勢力図
const MAPS={
  0:{y:'184年',t:'後漢の天下と黄巾の乱',d:'天下は十三の州に分かれていた。張角の黄巾賊が各地で蜂起し、漢の世は揺らぎ始める。',m:mapOf('han'),lab:{han:'後漢'}},
  6:{y:'190年',t:'董卓の専横と群雄の台頭',d:'董卓が洛陽を握り、帝をほしいままにする。各地の群雄が反董卓の兵を挙げた。',
     m:mapOf('other',{sili:'dong',yong:'dong',bing:'dong',ji:'yuan',you:'gs',yan:'cao',yu:'yshu',xu:'tao',xiangyang:'biao',jiangling:'biao',jingS:'biao',changsha:'sun',yi:'zhang',nanzhong:'zhang',hanzhong:'lu',liang:'ma',jiao:'shi'}),lab:{zhang:'劉焉・劉璋'}},
  15:{y:'195年',t:'群雄割拠',d:'董卓は死に、長安は李傕・郭汜が乱す。袁紹は河北を、曹操は兗州を固め、孫策は江東へ渡った。',
     m:mapOf('other',{sili:'dong',yong:'dong',bing:'yuan',ji:'yuan',qing:'yuan',you:'gs',yan:'cao',yu:'cao',xu:'shu',huainan:'yshu',jiangdong:'sun',xiangyang:'biao',jiangling:'biao',jingS:'biao',changsha:'biao',yi:'zhang',nanzhong:'zhang',hanzhong:'lu',liang:'ma',jiao:'shi'}),lab:{dong:'李傕・郭汜',sun:'孫策'}},
  32:{y:'201年',t:'官渡の戦いのあと',d:'官渡で袁紹を破った曹操が、天下一の勢力となる。劉備は荊州の劉表を頼り、新野に身を寄せた。',
     m:mapOf('other',{you:'yuan',ji:'yuan',bing:'yuan',qing:'yuan',yan:'cao',xu:'cao',yu:'cao',sili:'cao',yong:'cao',huainan:'cao',xiangyang:'biao',jiangling:'biao',jingS:'biao',changsha:'biao',jiangdong:'sun',kuaiji:'sun',yi:'zhang',nanzhong:'zhang',hanzhong:'lu',liang:'ma',jiao:'shi'}),lab:{yuan:'袁氏',sun:'孫権'},pin:[['劉備（新野）',57,47,'shu']]},
  36:{y:'208年',t:'曹操、華北を統一し南下',d:'河北を平らげた曹操が、大軍で荊州へ攻め下る。劉表は病に倒れ、荊州は曹操に降った。',
     m:mapOf('other',Object.assign({},NORTH,{xiangyang:'cao',jiangling:'biao',jingS:'biao',changsha:'biao',jiangdong:'sun',kuaiji:'sun',yi:'zhang',nanzhong:'zhang',hanzhong:'lu',liang:'ma',jiao:'shi'})),lab:{sun:'孫権',biao:'劉表（劉琮）'},pin:[['劉備',55,54,'shu']]},
  52:{y:'209年',t:'赤壁の戦いのあと',d:'赤壁で曹操は大敗し北へ退いた。周瑜は江陵を、劉備は荊南の四郡を手に入れる。',
     m:mapOf('other',Object.assign({},NORTH,{xiangyang:'cao',jiangling:'sun',jingS:'shu',changsha:'shu',jiangdong:'sun',kuaiji:'sun',yi:'zhang',nanzhong:'zhang',hanzhong:'lu',liang:'ma',jiao:'shi'})),lab:{sun:'孫権'}},
  66:{y:'219年',t:'劉備、漢中王となる',d:'劉備は益州と漢中を得て漢中王に。荊州は関羽が守り、天下は三つに分かれつつあった。',
     m:mapOf('other',Object.assign({},NORTH,{liang:'cao',xiangyang:'cao',jiangling:'shu',jingS:'shu',changsha:'sun',jiangdong:'sun',kuaiji:'sun',jiao:'sun',yi:'shu',nanzhong:'shu',hanzhong:'shu'})),lab:{sun:'孫権'}},
  71:{y:'221年',t:'三国鼎立',d:'曹丕が魏の皇帝となり、劉備も蜀の皇帝に。関羽を失った荊州は呉のものとなった。',
     m:mapOf('other',Object.assign({},NORTH,{liang:'cao',xiangyang:'cao',jiangling:'sun',jingS:'sun',changsha:'sun',jiangdong:'sun',kuaiji:'sun',jiao:'sun',yi:'shu',nanzhong:'shu',hanzhong:'shu'})),lab:{cao:'魏（曹丕）',shu:'蜀（劉備）',sun:'呉（孫権）'}},
  82:{y:'225年',t:'南中の反乱',d:'劉備亡きあと、南中の孟獲が背いた。諸葛亮は北伐の前に、まず南を平らげる。',
     m:mapOf('other',Object.assign({},NORTH,{liang:'cao',xiangyang:'cao',jiangling:'sun',jingS:'sun',changsha:'sun',jiangdong:'sun',kuaiji:'sun',jiao:'sun',yi:'shu',nanzhong:'man',hanzhong:'shu'})),lab:{cao:'魏（曹丕）',shu:'蜀（劉禅）',sun:'呉（孫権）',man:'南蛮（孟獲）'}},
  99:{y:'234年',t:'諸葛亮亡きあとの三国',d:'五丈原で諸葛亮が没し、北伐は姜維に託された。魏では司馬氏が力を伸ばしていく。',
     m:mapOf('other',Object.assign({},NORTH,{liang:'cao',xiangyang:'cao',jiangling:'sun',jingS:'sun',changsha:'sun',jiangdong:'sun',kuaiji:'sun',jiao:'sun',yi:'shu',nanzhong:'shu',hanzhong:'shu'})),lab:{cao:'魏（曹叡）',shu:'蜀（劉禅）',sun:'呉（孫権）'}},
  110:{y:'265年',t:'蜀の滅亡と晋の成立',d:'263年、蜀は魏に降った。司馬炎は魏から帝位を譲り受け、晋を建てる。残るは呉ただ一国。',
     m:mapOf('jin',{jiangling:'sun',jingS:'sun',changsha:'sun',jiangdong:'sun',kuaiji:'sun',jiao:'sun'}),lab:{jin:'晋（司馬炎）',sun:'呉（孫晧）'}},
  112:{y:'280年',t:'晋による天下統一',d:'呉は降り、百年近く続いた乱世は終わった。天下は再びひとつになる。',m:mapOf('jin'),lab:{jin:'晋（司馬炎）'}}};
function mapInOut(x,y){let c=false;const P=MAP_OUT;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
let MAP_GRID=null;
function mapGrid(W,H){if(MAP_GRID&&MAP_GRID.W===W)return MAP_GRID;const g=new Int16Array(W*H);
  for(let py=0;py<H;py++)for(let px=0;px<W;px++){const x=px/W*100,y=py/H*90;if(!mapInOut(x,y)){g[py*W+px]=-1;continue;}
    const nx=x+2.2*Math.sin(y*.45)+1.3*Math.sin(y*1.3+x*.2),ny=y+2.2*Math.cos(x*.4)+1.2*Math.sin(x*1.1);let b=0,bd=1e9;
    MAP_SEEDS.forEach(function(s,i){const d=(nx-s[1])*(nx-s[1])+(ny-s[2])*(ny-s[2]);if(d<bd){bd=d;b=i;}});g[py*W+px]=b;}
  MAP_GRID={W:W,H:H,g:g};return MAP_GRID;}
function hexRgb(h){const n=parseInt(h.slice(1),16);return [n>>16,n>>8&255,n&255];}
function drawMap(cv,M){const W=cv.width,H=cv.height,x=cv.getContext('2d');const G=mapGrid(W,H),g=G.g;const img=x.createImageData(W,H),a=img.data;
  for(let i=0;i<W*H;i++){const s=g[i],o=i*4;const px=i%W,py=i/W|0;const n=((px*13+py*7)%11)/11*10;
    if(s<0){const sea=py>H*.5||px>W*.88;a[o]=sea?178+n:196+n;a[o+1]=sea?192+n:182+n;a[o+2]=sea?188+n:150+n;a[o+3]=255;continue;}
    const f=MAP_FAC[M.m[MAP_SEEDS[s][0]]]||MAP_FAC.other,c=hexRgb(f[0]);const id=MAP_SEEDS[s][0];
    const edge=(px>0&&g[i-1]>=0&&MAP_SEEDS[g[i-1]][0]!==id)||(py>0&&g[i-W]>=0&&MAP_SEEDS[g[i-W]][0]!==id);
    const fe=(px>0&&g[i-1]>=0&&M.m[MAP_SEEDS[g[i-1]][0]]!==M.m[id])||(py>0&&g[i-W]>=0&&M.m[MAP_SEEDS[g[i-W]][0]]!==M.m[id]);
    const k=fe?.35:edge?.72:1;a[o]=c[0]*k*.92+n;a[o+1]=c[1]*k*.92+n;a[o+2]=c[2]*k*.92+n;a[o+3]=255;}
  x.putImageData(img,0,0);
  const sx=W/100,sy=H/90;x.lineCap='round';x.lineJoin='round';
  MAP_RIV.forEach(function(r){x.strokeStyle='rgba(40,90,140,.75)';x.lineWidth=Math.max(2,W/170);x.beginPath();r.forEach(function(p,i){i?x.lineTo(p[0]*sx,p[1]*sy):x.moveTo(p[0]*sx,p[1]*sy);});x.stroke();});
  x.strokeStyle='#3a2410';x.lineWidth=Math.max(1.5,W/260);x.beginPath();MAP_OUT.forEach(function(p,i){i?x.lineTo(p[0]*sx,p[1]*sy):x.moveTo(p[0]*sx,p[1]*sy);});x.closePath();x.stroke();
  x.textAlign='center';x.textBaseline='middle';const fs=Math.round(W/38);
  const done={};MAP_SEEDS.forEach(function(s){if(done[s[0]])return;done[s[0]]=1;x.font='700 '+fs+'px "BIZ UDPGothic",sans-serif';x.fillStyle='rgba(255,255,255,.88)';x.strokeStyle='rgba(30,20,10,.65)';x.lineWidth=3;x.strokeText(MAP_NAME[s[0]],s[1]*sx,s[2]*sy);x.fillText(MAP_NAME[s[0]],s[1]*sx,s[2]*sy);});
  MAP_CITY.forEach(function(c){x.fillStyle='#1a1008';x.beginPath();x.arc(c[1]*sx,(c[2]+2.6)*sy,Math.max(2.5,W/180),0,7);x.fill();x.font=Math.round(fs*.78)+'px "BIZ UDPGothic",sans-serif';x.fillStyle='#1a1008';x.fillText(c[0],c[1]*sx,(c[2]+5)*sy);});
  (M.pin||[]).forEach(function(p){const c=MAP_FAC[p[3]][0];x.fillStyle=c;x.strokeStyle='#fff';x.lineWidth=2;x.beginPath();x.arc(p[1]*sx,p[2]*sy,W/90,0,7);x.fill();x.stroke();x.font='700 '+Math.round(fs*.9)+'px "BIZ UDPGothic",sans-serif';x.lineWidth=3;x.strokeStyle='rgba(255,255,255,.9)';x.strokeText(p[0],p[1]*sx,(p[2]-3.6)*sy);x.fillStyle=c;x.fillText(p[0],p[1]*sx,(p[2]-3.6)*sy);});}
function showMap(M){return new Promise(function(res){const d=document.createElement('div');d.className='sv sv-map';
  const facs=[];MAP_ALL.forEach(function(k){const f=M.m[k];if(facs.indexOf(f)<0)facs.push(f);});
  const leg=facs.filter(function(f){return f!=='other'||facs.length<3;}).map(function(f){const c=MAP_FAC[f];return '<span><i style="background:'+c[0]+'"></i>'+esc((M.lab&&M.lab[f])||c[1])+'</span>';}).join('');
  d.innerHTML='<div class="mp-hd"><small>'+esc(M.y)+'</small><b>'+esc(M.t)+'</b></div><canvas class="mp-cv"></canvas><div class="mp-leg">'+leg+'</div><p class="mp-d">'+esc(M.d)+'</p><div class="mp-tap">▼ 画面をタップ</div>';
  document.getElementById('app').appendChild(d);
  const cv=d.querySelector('canvas');const w=Math.min(560,innerWidth-24);cv.style.width=w+'px';cv.style.height=Math.round(w*.9)+'px';const k=Math.min(2,devicePixelRatio||1);cv.width=Math.round(w*k);cv.height=Math.round(w*.9*k);
  MAP_GRID=null;try{drawMap(cv,M);}catch(e){}
  try{SND.gong&&SND.gong(.12);}catch(e){}
  let ok=false;setTimeout(function(){ok=true;},600);d.onclick=function(){if(!ok)return;d.remove();res();};});}
