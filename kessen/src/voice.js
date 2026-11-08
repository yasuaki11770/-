/* ================= 戦場の声：一騎打ち英雄伝と同じ声（声の選び方・高さ・速さ）と方言で、日本語の台詞を読み上げる ================= */
const BVOICE=(function(){
/*DIAL*/
  const rdg=function(t){let r=t;RDG.forEach(function(p){if(r.indexOf(p[0])>=0)r=r.split(p[0]).join(p[1]);});return r;};
  return {dial:dial,rdg:rdg};})();
const BV2={last:0,pri:0,cache:{},bad:new Set()};
function bvHash(id){let x=0;for(let i=0;i<id.length;i++)x=(x*31+id.charCodeAt(i))>>>0;return x;}
function bvList(){try{const L=speechSynthesis.getVoices().filter(function(v){return v.lang&&v.lang.toLowerCase().replace('_','-').indexOf('ja')===0&&!BV2.bad.has(v.name);});
  L.sort(function(a,b){const ka=a.localService?0:2,kb=b.localService?0:2;return ka-kb||(a.name<b.name?-1:a.name>b.name?1:0);});return L;}catch(e){return [];}}
// 一騎打ち英雄伝の voiceProf と同じ計算（武将ごとに声・高さ・速さが決まる）
function bvProf(h){if(BV2.cache[h.id])return BV2.cache[h.id];const L=bvList(),idx=Math.max(0,HEROES.findIndex(function(x){return x.id===h.id;})),hs=bvHash(h.id);
  const f1=(hs%1000)/1000,f2=((hs>>>10)%1000)/1000;const o={v:L.length?L[idx%L.length]:null,pitch:Math.max(.45,Math.min(1.35,.5+f1*.8)),rate:.95+f2*.2};
  if(L.length)BV2.cache[h.id]=o;return o;}
try{if('speechSynthesis' in window){speechSynthesis.getVoices();speechSynthesis.onvoiceschanged=function(){BV2.cache={};};}}catch(e){}
// pri: 0=普段の掛け声, 1=武将の叫び, 2=戦法・名台詞
function bvSpeak(h,text,pri){
  try{if(!h||!h.id||!text||!('speechSynthesis' in window)||!SND.on||!SND.ctx)return;
    if(document.querySelector('#duelwrap.on')||document.querySelector('.sv'))return;
    const now=performance.now();const busy=speechSynthesis.speaking&&now-BV2.last<4000;
    if(busy&&pri<=BV2.pri)return;if(!busy&&pri===0&&now-BV2.last<2600)return;
    const t=BVOICE.rdg(BVOICE.dial(text,h.id)).replace(/[「」]/g,'');
    const pr=bvProf(h);const u=new SpeechSynthesisUtterance(t);u.lang='ja-JP';if(pr.v){u.voice=pr.v;u.lang=pr.v.lang;}
    u.pitch=Math.min(1.8,pr.pitch+(pri>=2?.1:0));u.rate=Math.min(1.7,pr.rate*(pri>=2?1.05:1.1));u.volume=1;
    u.onerror=function(e){if(e&&e.error&&e.error!=='canceled'&&e.error!=='interrupted'&&pr.v){BV2.bad.add(pr.v.name);delete BV2.cache[h.id];}};
    speechSynthesis.cancel();BV2.last=now;BV2.pri=pri;speechSynthesis.speak(u);}catch(e){}}
function bvHero(q){return q&&q.hero&&q.hs&&(q.hs.h||byId(q.hero));}
// 戦場の吹き出し（命令への返事・突撃の掛け声など）
const _bvSay=say;say=function(q,ev,force){const L=BT&&BT.says,last=L&&L[L.length-1];_bvSay(q,ev,force);
  const M=BT&&BT.says;if(M&&M.length){const e=M[M.length-1];if(e!==last&&e.q===q){e.s=BVOICE.dial(e.s,q.hero);bvSpeak(bvHero(q),e.s,0);}}};
// 戦法のカットイン：武将の名台詞（なければ技の名）を叫ぶ
const _bvCut=cutin;cutin=function(q,tk){_bvCut(q,tk);const h=bvHero(q);if(h)bvSpeak(h,(h.sp?h.sp:tk.n+'！'),2);};
// 鑑賞の武将の叫び
if(typeof dSay==='function'){const _bvD=dSay;dSay=function(q,line){_bvD(q,line);bvSpeak(bvHero(q),line,1);};}
