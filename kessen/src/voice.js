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
// ---- 録音済みの声（Open JTalk で作った音声。端末の読み上げは使わない）
const VREC={buf:null,loading:false,cache:{},cur:null,curPri:-1};
function vrecLoad(){if(VREC.buf||VREC.loading)return;VREC.loading=true;try{fetch('voices.mp3').then(function(r){return r.arrayBuffer();}).then(function(b){VREC.buf=b;}).catch(function(){VREC.loading=false;});}catch(e){VREC.loading=false;}}
function vrecCls(h){if(VOICE_CLS[h.id])return VOICE_CLS[h.id];if(typeof FEMALE!=='undefined'&&FEMALE[h.id])return 'fem';const p=bvProf(h).pitch;return p<.72?'low':p>1.08?'high':'mid';}
function vrecGet(key,cb){const c=VREC.cache[key];if(c){cb(c);return;}const ix=VOICE_IDX[key];if(!ix||!VREC.buf||!SND.ctx)return;
  try{SND.ctx.decodeAudioData(VREC.buf.slice(ix[0],ix[0]+ix[1]),function(ab){VREC.cache[key]=ab;cb(ab);},function(){});}catch(e){}}
// pri: 0=普段の掛け声, 1=武将の叫び, 2=戦法・名台詞。text は方言に直した後の台詞
function bvSpeak(h,text,pri,key){
  try{if(!h||!h.id||!SND.on||!SND.ctx)return;vrecLoad();
    if(document.querySelector('#duelwrap.on')||document.querySelector('.sv'))return;
    const now=SND.ctx.currentTime;const busy=VREC.cur&&now<VREC.curEnd;
    if(busy&&pri<=VREC.curPri)return;if(!busy&&pri===0&&now-(VREC.lastEnd||0)<1.2)return;
    key=key||(vrecCls(h)+'|'+String(text||'').trim());if(!VOICE_IDX[key])return;
    const t0=performance.now();
    vrecGet(key,function(ab){if(performance.now()-t0>1500)return;const c=SND.ctx;
      if(VREC.cur&&c.currentTime<VREC.curEnd){if(pri<=VREC.curPri)return;try{VREC.cur.stop();}catch(e){}}
      const s=c.createBufferSource();s.buffer=ab;
      // 同じ声の種類でも武将ごとに少しだけ高さを変える（名台詞は本人の声で録音済み）
      if(key.indexOf('h:')!==0){const hs=bvHash(h.id);s.playbackRate.value=.96+((hs>>>4)%9)*.01;}
      const g=c.createGain();g.gain.value=1.15;s.connect(g);let out=g;
      if(c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=(h.f&&BT&&BT.sq&&BT.sq.some(function(q){return q.side===1&&q.hero===h.id;}))?.25:-.25;g.connect(p);out=p;}
      out.connect(SND.master||c.destination);out.connect(SND.revIn);
      s.start();VREC.cur=s;VREC.curPri=pri;VREC.curEnd=c.currentTime+ab.duration/s.playbackRate.value;VREC.lastEnd=VREC.curEnd;
      try{const m=SND.music;if(m&&!document.querySelector('#duelwrap.on')){m.gain.setTargetAtTime(.22,c.currentTime,.08);clearTimeout(VREC.dk);VREC.dk=setTimeout(function(){if(!document.querySelector('#duelwrap.on'))m.gain.setTargetAtTime(.42,SND.ctx.currentTime,.3);},ab.duration*1000+250);}}catch(e){}});}catch(e){}}
function bvHero(q){return q&&q.hero&&q.hs&&(q.hs.h||byId(q.hero));}
// 戦場の吹き出し（命令への返事・突撃の掛け声など）
const _bvSay=say;say=function(q,ev,force){const L=BT&&BT.says,last=L&&L[L.length-1];_bvSay(q,ev,force);
  const M=BT&&BT.says;if(M&&M.length){const e=M[M.length-1];if(e!==last&&e.q===q){e.s=BVOICE.dial(e.s,q.hero);bvSpeak(bvHero(q),e.s,0);}}};
// 戦法のカットイン：武将の名台詞（なければ技の名）を叫ぶ
const _bvCut=cutin;cutin=function(q,tk){_bvCut(q,tk);const h=bvHero(q);if(h)bvSpeak(h,'',2,'h:'+h.id);};
// 鑑賞の武将の叫び
if(typeof dSay==='function'){const _bvD=dSay;dSay=function(q,line){_bvD(q,line);const h=bvHero(q);if(h)bvSpeak(h,BVOICE.dial(line,h.id),1);};}
