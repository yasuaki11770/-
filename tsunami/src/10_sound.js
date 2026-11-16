const $ = id => document.getElementById(id);
/* =========================================================
   サウンド（The Magic City のBGM・効果音シンセを移植）
   ========================================================= */
let SOUND = true;
try{ SOUND = localStorage.getItem('tsu_snd')!=='0'; }catch(e){}
const AU = { ctx:null, master:null, bgm:null, sfx:null, song:null, timer:null, step:0, next:0, want:null };
function audioInit(){
  if(AU.ctx){ if(AU.ctx.state==='suspended') AU.ctx.resume(); return; }
  try{
    const C = new (window.AudioContext||window.webkitAudioContext)();
    AU.ctx=C; AU.master=C.createGain(); AU.master.connect(C.destination);
    AU.bgm=C.createGain(); AU.bgm.connect(AU.master); AU.sfx=C.createGain(); AU.sfx.connect(AU.master);
    AU.lp=C.createBiquadFilter(); AU.lp.type='lowpass'; AU.lp.frequency.value=2400; AU.lp.connect(AU.bgm);
    const n=C.createBuffer(1,C.sampleRate*.5,C.sampleRate); const d=n.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; AU.noise=n;
    vol();
    if(AU.want!==null){ const w=AU.want; AU.want=null; music(w); }
  }catch(e){ AU.ctx=null; }
}
function vol(){ if(!AU.ctx) return; AU.master.gain.value = SOUND?1:0; AU.bgm.gain.value=.16; AU.sfx.gain.value=.3; }
const mtof = m => 440*Math.pow(2,(m-69)/12);
function tone(t,f,dur,type='square',v=.2,dest,a=.005,r=.06){
  const C=AU.ctx; const o=C.createOscillator(), g=C.createGain();
  o.type=type; o.frequency.setValueAtTime(f,t);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+a); g.gain.setValueAtTime(v,t+Math.max(a,dur-r)); g.gain.linearRampToValueAtTime(0,t+dur);
  o.connect(g); g.connect(dest||AU.sfx); o.start(t); o.stop(t+dur+.02); return o;
}
function noise(t,dur,v,freq=6000,dest){ const C=AU.ctx; const s=C.createBufferSource(); s.buffer=AU.noise; const f=C.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq; const g=C.createGain(); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.001,t+dur); s.connect(f); f.connect(g); g.connect(dest||AU.sfx); s.start(t); s.stop(t+dur); }
function sfx(k){
  if(!AU.ctx||!SOUND) return; const t=AU.ctx.currentTime;
  switch(k){
    case 'cur': tone(t,1320,.04,'square',.06); break;
    case 'ok': tone(t,784,.06,'square',.1); tone(t+.06,1175,.09,'square',.1); break;
    case 'back': tone(t,523,.06,'square',.09); tone(t+.06,392,.08,'square',.08); break;
    case 'blip': tone(t,880+Math.random()*120,.025,'square',.03); break;
    case 'lvl': [0,4,7,12,16].forEach((s,i)=>tone(t+i*.08,mtof(72+s),.14,'square',.1)); break;
    case 'start': [0,7,12,19].forEach((s,i)=>tone(t+i*.11,mtof(60+s),.5,'triangle',.14,null,.01,.3)); break;
    case 'jingle': [[67,0],[72,.14],[76,.28],[79,.42],[84,.62]].forEach(([n,d])=>tone(t+d,mtof(n),.22,'square',.07)); break;
    case 'msg': tone(t,1568,.07,'sine',.1); tone(t+.09,2093,.1,'sine',.09); break;
    case 'ring': for(let k2=0;k2<2;k2++){ tone(t+k2*.5,440,.38,'sine',.12); tone(t+k2*.5,480,.38,'sine',.12);} break;
    case 'thud': noise(t,.25,.5,300); tone(t,110,.18,'sine',.3); break;
    case 'hit': noise(t,.06,.3,1200); tone(t,180,.07,'sine',.2); break;
    case 'quake': for(let i=0;i<10;i++) noise(t+i*.12,.3,.5,120+Math.random()*80); break;
    case 'beep': tone(t,1000,.12,'sine',.12); tone(t+.35,1000,.12,'sine',.12); break;
    case 'shock': noise(t,.35,.5,2500); tone(t,90,.3,'sawtooth',.2); break;
    case 'alarm': for(let i=0;i<8;i++) tone(t+i*.25,i%2?880:1100,.2,'square',.06); break;
    case 'wave': noise(t,1.6,.25,500); break;
    case 'rumble': noise(t,.7,.35,90+Math.random()*60); noise(t+.2,.5,.2,220); break;
    case 'roar': for(let i=0;i<6;i++) noise(t+i*.4,1.2,.3-i*.03,300+i*40); break;
    case 'crackle': for(let i=0;i<5;i++) noise(t+i*.07+Math.random()*.05,.05,.12,3000+Math.random()*2000); break;
    case 'chime': [[79,0],[76,.42],[72,.84],[67,1.26]].forEach(([n,d])=>{ tone(t+d,mtof(n),.9,'sine',.12,null,.01,.7); tone(t+d+.12,mtof(n),.7,'sine',.04,null,.01,.6); }); break;
    case 'mail': for(let i=0;i<6;i++){ tone(t+i*.36,1046,.16,'square',.07); tone(t+i*.36+.18,1318,.16,'square',.07);} break;
    case 'crash': noise(t,.5,.6,800); noise(t+.1,.4,.4,3000); tone(t,70,.3,'sine',.3); break;
    case 'glass': for(let i=0;i<7;i++) tone(t+i*.03,3000+Math.random()*2500,.08,'sine',.05); noise(t,.25,.25,5000); break;
    case 'drop': [76,72,67,60].forEach((n,i)=>tone(t+i*.16,mtof(n),.3,'triangle',.12)); break;
    case 'siren': { const o=AU.ctx.createOscillator(), g=AU.ctx.createGain(); o.type='sawtooth'; o.frequency.setValueAtTime(500,t); for(let i=0;i<4;i++){ o.frequency.linearRampToValueAtTime(900,t+i*1.6+.8); o.frequency.linearRampToValueAtTime(500,t+i*1.6+1.6);} g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.05,t+.8); g.gain.linearRampToValueAtTime(0,t+6.4); o.connect(g); g.connect(AU.sfx); o.start(t); o.stop(t+6.5); break; }
  }
}
const SONGS = {
  title:{bpm:76,ch:[[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]],bass:[41,40,38,36],arp:1,hat:0},
  town:{bpm:100,ch:[[53,57,60,64],[57,60,64,67],[58,62,65,69],[55,60,64,70]],bass:[41,45,46,48],arp:1,hat:1},
  talk:{bpm:88,ch:[[48,52,55,59],[45,48,52,55],[50,53,57,60],[43,47,50,53]],bass:[36,33,38,31],arp:0,hat:0},
  night:{bpm:72,ch:[[57,60,64,67],[53,57,60,64],[50,53,57,60],[52,56,59,62]],bass:[45,41,38,40],arp:1,hat:0},
  tense:{bpm:118,ch:[[50,53,57,62],[46,50,53,58],[43,46,50,55],[45,49,52,57]],bass:[38,34,31,33],arp:1,hat:1,pulse:1},
  hope:{bpm:84,ch:[[48,52,55,60],[53,57,60,65],[55,59,62,67],[52,55,60,64]],bass:[36,41,43,40],arp:1,hat:0}
};
function music(name){
  if(!AU.ctx){ AU.want=name; return; }
  if(AU.song===name) return;
  AU.song=name; AU.step=0; AU.next=AU.ctx.currentTime+.1;
  clearInterval(AU.timer); if(!name) return;
  AU.timer=setInterval(schedule,60);
}
function schedule(){
  const C=AU.ctx, sg=SONGS[AU.song]; if(!sg||!C) return;
  const st=60/sg.bpm/2;
  while(AU.next<C.currentTime+.25){
    const t=AU.next, s=AU.step, bar=(s>>3)%4, ch=sg.ch[bar], b=s%8;
    if(b===0) ch.forEach(n=>tone(t,mtof(n),st*7.6,'sawtooth',.022,AU.lp,.25,.6));
    if(b===0||b===4||(sg.pulse&&b%2===0)) tone(t,mtof(sg.bass[bar]-(b===4&&!sg.pulse?-12:0)),st*(sg.pulse?1.6:3.4),'triangle',.16,AU.lp,.01,.1);
    if(sg.arp&&(b%2===1||sg.bpm>95)) tone(t,mtof(ch[(s*3)%4]+12),st*.9,'square',.022,AU.lp,.005,.05);
    if(sg.hat&&b%2===1) noise(t,.04,.05,8000,AU.lp);
    AU.next+=st*(b%2===0?1.08:.92); AU.step++;
  }
}
function setSound(on){ SOUND=on; try{localStorage.setItem('tsu_snd',on?'1':'0')}catch(e){} vol(); ['snd'].forEach(i=>{ if($(i)) $(i).textContent=on?'🔊':'🔇'; }); }
document.addEventListener('pointerdown',audioInit,{passive:true});
