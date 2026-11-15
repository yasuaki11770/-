/* 三国覇王伝から流用：収録した台詞を鳴らす（voices.mp3） */
const VREC={buf:null,loading:false,cache:{},cur:null,curEnd:0};
function vrecLoad(){if(VREC.buf||VREC.loading||typeof VOICE_IDX==='undefined')return;VREC.loading=true;try{fetch('voices.mp3').then(r=>r.arrayBuffer()).then(b=>{VREC.buf=b;}).catch(()=>{VREC.loading=false;});}catch(e){VREC.loading=false;}}
const vhash=id=>{let x=0;for(let i=0;i<id.length;i++)x=(x*31+id.charCodeAt(i))>>>0;return x;};
function vcls(id){return VOICE_CLS[id]||(typeof FEMALE!=='undefined'&&FEMALE[id]?'fem':['takehiro','ryusei','mesuo','maron'][vhash(id)%4]);}
const PERS_OF={zhangf:'mou',xuc:'mou',dianw:'mou',huax:'mou',wenc:'mou',yanl:'mou',gann:'mou',suns:'mou',mac:'mou',xhd:'mou',pangd:'mou',menghuo:'mou',zhurong:'mou',tadun:'mou',xhy:'mou',zhangliang:'mou',zhout:'mou',
 lubu:'doku',weiy:'doku',dongz:'doku',guan:'yuu',zhaoy:'yuu',zhangl:'yuu',xuh:'yuu',huangz:'yuu',tsc:'yuu',lingt:'yuu',guanp:'yuu',jil:'yuu',yuej:'yuu',gongsunz:'yuu',zhangx:'yuu',matengg:'yuu',sunj:'yuu',huanggai:'yuu',zhangb:'yuu',
 zhugel:'rei',sima:'rei',zhouy:'rei',luxun:'rei',caoc:'rei',pangt:'rei',jiangw:'rei',lumeng:'rei',zhangj:'rei',sunq:'rei',zhangh:'rei',caor:'ken',gaos:'ken',liub:'ken',yuans:'yuu2'};
function persOf(id){if(PERS_OF[id])return PERS_OF[id];const h=HB(id);if(!h)return 'yuu';if(h.p>=95&&h.i<50)return 'mou';if(h.i>=85)return 'rei';if((h.cmd||60)>=90)return 'ken';return 'yuu';}
// 性格ごとの台詞（三国決戦伝の掛け声）と、誰でも言う鼓舞
const VL={
 accept:{mou:['おう、任せろ!','よっしゃ、暴れてくるぜ!'],doku:['…まあいいだろう。'],yuu:['承知!','御意!'],rei:['心得ました。','策の通りに。'],ken:['承知つかまつった。'],yuu2:['…わかった、そうしよう。']},
 charge:{mou:['邪魔だ、どけい!','突っ込むぞ! 遅れるな!','敵将はどこだ!'],doku:['獲物は俺がもらう!','雑魚に用はない!'],yuu:['続け! 押し出せ!','味方を救え!'],rei:['あの隊なら崩せる。かかれ。','相性は我らに分がある。'],ken:['来たか。迎え撃て!','一歩も通すな!'],yuu2:['よし…行くぞ!'],all:['いざ、参る！','この戦、必ず勝つ！','我らの力、見せてくれよう！','我に続けぇ！','この一戦に天下が懸かっておる！']},
 defend:{ken:['来たか。迎え撃て!','一歩も通すな!','陣を下げよ。'],all:['一歩も退くな！','ここが踏ん張りどころぞ！','怯むな！ 持ちこたえよ！','退くな！ 退けば国が滅ぶぞ！']},
 win:{mou:['ははは、口ほどにもない！'],doku:['ははは、口ほどにもない！'],all:['敵は崩れた！ 追い討てぇ！','一兵たりとも逃すな！','この戦、必ず勝つ！']},
 lose:{rei:['一旦引いて立て直す。','深追いは禁物。下がれ。'],ken:['陣を下げよ。'],yuu2:['ひ、引け! 引けい!'],yuu:['無念…一旦引く!'],doku:['ここは退いてやる。'],mou:['…ちっ!'],all:['まだだ……まだ終わらぬ！']},
 duel:{mou:['そこの大将! 俺と勝負しろ!','逃げるなよ、一騎打ちだ!'],doku:['俺の相手が務まるか?'],yuu:['我と尋常に勝負せよ!'],rei:['…受けて立とう。'],ken:['挑まれたなら仕方あるまい。'],yuu2:['な、なぜ私が…']}};
function voiceLine(id,cat){if(typeof VOICE_IDX==='undefined'||!HB(id))return null;
  if(cat==='sp')return VOICE_IDX['h:'+id]?{text:HB(id).sp,key:'h:'+id}:null;
  const T=VL[cat];if(!T)return null;const cls=vcls(id),p=persOf(id);const base=(T[p]||[]).concat(T.all||[]);const c=[];
  base.forEach(t=>{const d=BVOICE.dial(t,id);[d,t].forEach(x=>{const k=cls+'|'+x;if(VOICE_IDX[k]&&!c.some(o=>o.key===k))c.push({text:x,key:k});});});
  return c.length?pick(c):null;}
function playVoice(id,key,delay){try{SND.init();if(!SND.ctx||!SND.on)return;vrecLoad();const ix=VOICE_IDX[key];if(!ix)return;let n=0;
  const go=()=>{if(!VREC.buf){if(n++<25)setTimeout(go,300);return;}const run=ab=>{const c=SND.ctx;try{if(VREC.cur&&c.currentTime<VREC.curEnd)VREC.cur.stop();}catch(e){}
      const s=c.createBufferSource();s.buffer=ab;if(key.indexOf('h:')!==0)s.playbackRate.value=.96+((vhash(id)>>>4)%9)*.01;const g=c.createGain();g.gain.value=1.2;s.connect(g);g.connect(SND.master||c.destination);if(SND.revIn)g.connect(SND.revIn);
      s.start();VREC.cur=s;VREC.curEnd=c.currentTime+ab.duration/s.playbackRate.value;
      try{if(SND.music){SND.music.gain.setTargetAtTime(.18,c.currentTime,.08);clearTimeout(VREC.dk);VREC.dk=setTimeout(()=>SND.music.gain.setTargetAtTime(.42,SND.ctx.currentTime,.3),ab.duration*1000+250);}}catch(e){}};
    if(VREC.cache[key]){run(VREC.cache[key]);return;}try{SND.ctx.decodeAudioData(VREC.buf.slice(ix[0],ix[0]+ix[1]),ab=>{VREC.cache[key]=ab;run(ab);},()=>{});}catch(e){}};
  setTimeout(go,delay||0);}catch(e){}}
// しゃべらせて、表示する台詞を返す（収録がなければ null）
function speak(id,cat,delay){const v=voiceLine(id,cat);if(!v)return null;playVoice(id,v.key,delay);return v.text;}
