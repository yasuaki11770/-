/* 三国決戦伝から流用: 効果音の鳴らし方と、その場で作曲するBGM（五音音階） */
const SND={ctx:null,on:true,bgmOn:true,buf:{},last:{},
  init:function(){
    if(this.ctx){if(this.ctx.state==='suspended')this.ctx.resume();return;}
    try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){this.on=false;return;}
    const c=this.ctx;
    this.master=c.createGain();this.master.gain.value=.9;
    const comp=c.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=4;this.master.connect(comp);comp.connect(c.destination);
    this.sfx=c.createGain();this.sfx.gain.value=.8;this.sfx.connect(this.master);
    this.music=c.createGain();this.music.gain.value=.42;this.music.connect(this.master);
    // simple hall reverb
    const len=c.sampleRate*2.4,ir=c.createBuffer(2,len,c.sampleRate);for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}
    this.rev=c.createConvolver();this.rev.buffer=ir;this.revIn=c.createGain();this.revIn.gain.value=.35;this.revIn.connect(this.rev);this.rev.connect(this.master);
    const self=this;
    Object.keys(SMP).forEach(function(k){try{const b=atob(SMP[k]);const a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);
      c.decodeAudioData(a.buffer,function(d){self.buf[k]=d;},function(){});}catch(e){}});
    if(BGM.want)BGM.play(BGM.want,true);
  },
  ok:function(){return this.on&&this.ctx;},
  limit:function(k,ms){const t=performance.now();if(this.last[k]&&t-this.last[k]<ms)return false;this.last[k]=t;return true;},
  play:function(name,vol,rate,dest){if(!this.ok())return;const b=this.buf[name];if(!b)return;const c=this.ctx;const s=c.createBufferSource();s.buffer=b;s.playbackRate.value=rate||1;
    const g=c.createGain();g.gain.value=vol===undefined?.7:vol;s.connect(g);g.connect(dest||this.sfx);if(Math.random()<.5)g.connect(this.revIn);s.start();},
  env:function(node,t,a,peak,d){node.gain.setValueAtTime(.0001,t);node.gain.exponentialRampToValueAtTime(peak,t+a);node.gain.exponentialRampToValueAtTime(.0001,t+a+d);},
  tone:function(f,d,type,vol,slide){if(!this.ok())return;const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=type||'square';o.frequency.value=f;if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),c.currentTime+d);g.gain.value=vol||.05;g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+d);o.connect(g);g.connect(this.sfx);o.start();o.stop(c.currentTime+d);},
  noise:function(d,vol,hp,bp,dest,when){if(!this.ok())return;const c=this.ctx,t=when||c.currentTime,n=Math.floor(c.sampleRate*d),b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type=bp?'bandpass':hp?'highpass':'lowpass';f.frequency.value=bp||hp||900;if(bp)f.Q.value=1.2;const g=c.createGain();g.gain.value=vol||.08;s.connect(f);f.connect(g);g.connect(dest||this.sfx);s.start(t);},
  // ---- 効果音
  clash:function(){if(!this.limit('clash',70))return;const k=['sword-1','spear','axe','mace','hatchet','staff','flail'];this.play(k[Math.floor(Math.random()*k.length)],.38,.9+Math.random()*.25);if(Math.random()<.3&&this.limit('hit',200))this.play('human-hit-'+(1+Math.floor(Math.random()*5)),.25,.95+Math.random()*.1);},
  arrow:function(){if(!this.limit('arrow',120))return;this.play('bow',.25,.9+Math.random()*.3);},
  volley:function(){if(!this.ok())return;for(let i=0;i<7;i++)setTimeout(function(){SND.play('bow',.3,.8+Math.random()*.5);},i*55);this.noise(.9,.08,2000);},
  die:function(){if(!this.limit('die',350))return;this.play('human-die-'+(1+Math.floor(Math.random()*3)),.35,.9+Math.random()*.2);},
  boom:function(){if(!this.limit('boom',150))return;this.play('explosion',.6,.9+Math.random()*.15);this.tone(70,.6,'sine',.16,.5);},
  fire:function(){this.play('fire',.6,1);this.noise(1.6,.06,0,600);},
  rock:function(){this.play('cave-in',.7,1);},
  horse:function(){if(!this.limit('horse',2500))return;this.play('horse',.45,1);},
  click:function(){this.tone(700,.05,'triangle',.04);},
  coin:function(){this.play('gold',.4,1);},
  gong:function(vol,when){if(!this.ok())return;const c=this.ctx,t=when||c.currentTime;[1,1.48,2.06,2.9,3.6].forEach(function(r,i){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=110*r;o.frequency.exponentialRampToValueAtTime(104*r,t+3);SND.env(g,t,.005,(vol||.18)/(i+1),3.2-i*.4);o.connect(g);g.connect(SND.sfx);g.connect(SND.revIn);o.start(t);o.stop(t+3.5);});this.noise(.25,.1,0,2500,null,t);},
  horn:function(){if(!this.ok())return;const c=this.ctx,t=c.currentTime;[[146.8,1],[220,.7],[73.4,.8]].forEach(function(p){const o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';o.frequency.setValueAtTime(p[0]*.94,t);o.frequency.linearRampToValueAtTime(p[0],t+.25);f.type='lowpass';f.frequency.value=900;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.07*p[1],t+.3);g.gain.linearRampToValueAtTime(.06*p[1],t+1.1);g.gain.exponentialRampToValueAtTime(.0001,t+1.8);o.connect(f);f.connect(g);g.connect(SND.sfx);g.connect(SND.revIn);o.start(t);o.stop(t+1.9);});},
  warcry:function(){if(!this.ok())return;const c=this.ctx,t=c.currentTime;[500,800,1150].forEach(function(f,i){const n=c.sampleRate*1.6,b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);for(let k=0;k<n;k++)a[k]=Math.random()*2-1;const s=c.createBufferSource();s.buffer=b;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f;bp.Q.value=3;const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.12/(i+1),t+.35);g.gain.exponentialRampToValueAtTime(.0001,t+1.5);s.connect(bp);bp.connect(g);g.connect(SND.sfx);g.connect(SND.revIn);s.start(t);});},
  skill:function(kind){this.gong(.16);setTimeout(function(){SND.noise(.5,.12,1500);},60);
    if(kind==='kakei')setTimeout(function(){SND.fire();},250);else if(kind==='seisha')setTimeout(function(){SND.volley();},250);else if(kind==='rakuseki')setTimeout(function(){SND.rock();},250);
    else if(kind==='musou'||kind==='totsu')setTimeout(function(){SND.boom();SND.warcry();},250);else if(kind==='daikatsu'){this.tone(110,.8,'sawtooth',.12,.6);this.warcry();}else if(kind==='kobu'){this.warcry();this.horn();}else if(kind==='konran')this.tone(900,1,'sine',.06,.3);else this.tone(330,.6,'triangle',.08,1.5);},
  win:function(){BGM.play('victory');},
  lose:function(){BGM.play('defeat');}
};

/* ---- BGM：五音音階で場面ごとに作曲して鳴らす ---- */
const BGM={cur:null,want:null,step:0,next:0,timer:null,duckV:1,
  play:function(name,force){this.want=name;if(!SND.ctx||!SND.bgmOn){return;}if(this.cur===name&&!force)return;this.cur=name;this.step=0;this.next=SND.ctx.currentTime+.08;const self=this;
    if(!this.timer)this.timer=setInterval(function(){self.pump();},50);
    if(name==='victory'||name==='defeat')this.once=name;},
  stop:function(){this.cur=null;},
  duck:function(on){if(!SND.music)return;SND.music.gain.setTargetAtTime(on?0.0001:.42,SND.ctx.currentTime,.4);},
  setOn:function(on){SND.bgmOn=on;if(!on){this.cur=null;}else if(this.want)this.play(this.want,true);},
  pump:function(){const c=SND.ctx;if(!c||!this.cur)return;const S_=SONGS[this.cur];if(!S_)return;const sp=60/S_.bpm/4;
    while(this.next<c.currentTime+.25){S_.step(this.step,this.next,sp);this.step++;this.next+=sp;if(S_.len&&this.step>=S_.len){if(S_.then){this.cur=S_.then;this.step=0;return;}this.cur=null;return;}}}
};
const NOTE=function(n){return 440*Math.pow(2,(n-69)/12);};
/* 五音音階：宮(C D E G A) と 羽(A C D E G) */
const GONG=[48,50,52,55,57,60,62,64,67,69,72,74,76,79,81,84];
const YU=[45,48,50,52,55,57,60,62,64,67,69,72,74,76,79,81];
/* 弦を弾く音（Karplus-Strong で物理的に合成） */
const KSC={};
function ksBuf(midi,dur,damp){const c=SND.ctx;const key=midi+'_'+dur+'_'+damp;if(KSC[key])return KSC[key];const sr=c.sampleRate,f=NOTE(midi),N=Math.max(2,Math.round(sr/f)),len=Math.floor(sr*dur);
  const b=c.createBuffer(1,len,sr),d=b.getChannelData(0),r=new Float32Array(N);for(let i=0;i<N;i++)r[i]=(Math.random()*2-1)*(i<N*.5?1:.6);
  let k=0;const g=damp||.996;for(let i=0;i<len;i++){const v=r[k],n=r[(k+1)%N];r[k]=(v+n)*.5*g;d[i]=v;k=(k+1)%N;}KSC[key]=b;return b;}
function pluck(kind,midi,t,vol,slide){const c=SND.ctx;if(!c)return;
  const cfg={zheng:[2.2,.997,4200],qin:[3,.9985,1300],pipa:[.9,.993,3200]}[kind]||[2,.996,3000];
  const s=c.createBufferSource();s.buffer=ksBuf(midi,cfg[0],cfg[1]);const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=cfg[2];const g=c.createGain();g.gain.value=vol||.3;
  if(slide){s.playbackRate.setValueAtTime(1,t+.25);s.playbackRate.linearRampToValueAtTime(Math.pow(2,slide/12),t+.6);}
  s.connect(lp);lp.connect(g);g.connect(SND.music);g.connect(SND.revIn);s.start(t);}
function tremolo(midi,t,dur,vol){for(let x=0;x<dur;x+=.065)pluck('pipa',midi,t+x,(vol||.18)*(x===0?1.3:.7));}
/* 息の音のある笛子・音程が滑る二胡・甲高い哨吶 ：一本の音で旋律をつなげて滑らせる */
function phrase(kind,notes,t,vol){const c=SND.ctx;if(!c||!notes.length)return;
  const o=c.createOscillator(),g=c.createGain(),lfo=c.createOscillator(),lg=c.createGain();let total=0;notes.forEach(function(n){total+=n[1];});
  let chain=g;const f0=NOTE(notes[0][0]);
  if(kind==='suona'){o.type='sawtooth';const b1=c.createBiquadFilter(),b2=c.createBiquadFilter(),mix=c.createGain();b1.type='bandpass';b1.frequency.value=1300;b1.Q.value=1.4;b2.type='bandpass';b2.frequency.value=2700;b2.Q.value=2;o.connect(b1);o.connect(b2);b1.connect(mix);b2.connect(mix);mix.connect(g);lfo.frequency.value=6.2;lg.gain.value=f0*.018;}
  else if(kind==='erhu'){o.type='sawtooth';const lp=c.createBiquadFilter(),pk=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;pk.type='peaking';pk.frequency.value=1000;pk.gain.value=8;o.connect(pk);pk.connect(lp);lp.connect(g);lfo.frequency.value=5.4;lg.gain.value=f0*.014;}
  else{o.type='triangle';const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;o.connect(lp);lp.connect(g);lfo.frequency.value=5;lg.gain.value=f0*.01;
    const n=c.sampleRate*total,b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;const ns=c.createBufferSource();ns.buffer=b;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f0*2;bp.Q.value=4;const ng=c.createGain();ng.gain.value=.05;ns.connect(bp);bp.connect(ng);ng.connect(g);ns.start(t);ns.stop(t+total);}
  lfo.connect(lg);lg.connect(o.frequency);g.connect(SND.music);g.connect(SND.revIn);
  const V=vol||.08;let tt=t,pf=f0;g.gain.setValueAtTime(.0001,t);
  notes.forEach(function(n,i){const f=NOTE(n[0]);if(i===0){o.frequency.setValueAtTime(f*.96,tt);o.frequency.exponentialRampToValueAtTime(f,tt+.08);}else{o.frequency.setValueAtTime(pf,tt);o.frequency.exponentialRampToValueAtTime(f,tt+(kind==='erhu'?.12:.05));}pf=f;
    g.gain.linearRampToValueAtTime(V*(i===0?1:.85),tt+.06);g.gain.linearRampToValueAtTime(V*.7,tt+n[1]*.85);tt+=n[1];});
  g.gain.exponentialRampToValueAtTime(.0001,tt+.25);o.start(t);lfo.start(t);o.stop(tt+.3);lfo.stop(tt+.3);}
function bell(midi,t,vol){const c=SND.ctx;if(!c)return;const f=NOTE(midi);[1,2.76,5.4,8.93].forEach(function(r,i){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f*r;SND.env(g,t,.004,(vol||.1)/(i*1.6+1),2.6-i*.5);o.connect(g);g.connect(SND.music);g.connect(SND.revIn);o.start(t);o.stop(t+2.8);});}
function drum(kind,t,vol){const c=SND.ctx;if(!c)return;
  if(kind==='taiko'||kind==='zhangu'){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(52,t+.3);SND.env(g,t,.003,vol||.55,.6);o.connect(g);g.connect(SND.music);g.connect(SND.revIn);o.start(t);o.stop(t+.7);SND.noise(.12,(vol||.5)*.35,0,0,SND.music,t);}
  else if(kind==='roll'){for(let i=0;i<10;i++)drum('zhangu',t+i*.045,(vol||.3)*(.4+i*.07));}
  else if(kind==='bang'||kind==='rim'){if(!SND.ok())return;const n=Math.floor(c.sampleRate*.04),b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);const s=c.createBufferSource();s.buffer=b;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2300;bp.Q.value=9;const g=c.createGain();g.gain.value=(vol||.1)*4;s.connect(bp);bp.connect(g);g.connect(SND.music);s.start(t);}
  else if(kind==='bo'||kind==='shaker'){SND.noise(kind==='bo'?1.3:.05,(vol||.06),kind==='bo'?4500:7000,0,SND.music,t);}
  else if(kind==='gong'){SND.gong(vol||.12,t);}
}
const MOT=[[0,1,2,4,3,2,1,0],[4,3,4,5,4,2,1,2],[2,4,5,7,5,4,2,1],[5,4,2,1,2,4,2,0],[0,2,1,0,-1,0,1,2],[4,5,7,5,4,2,4,5]];
const SONGS={
  camp:{bpm:58,step:function(s,t,sp){
    if(s%4===0&&Math.random()<.7){const d=[0,2,4,3,1,4,5,2][(s/4)%8|0];pluck('qin',YU[d+2],t,.32,(s%32===12)?2:0);}
    if(s%8===2&&Math.random()<.5)pluck('zheng',YU[[7,8,9,8][(s/8)%4|0]],t,.14);
    if(s%64===16){const m=MOT[(s/64|0)%MOT.length];phrase('dizi',m.map(function(d,i){return [YU[d+7]||YU[7],sp*(i===m.length-1?8:4)];}),t,.07);}
    if(s%64===0)bell(GONG[7],t,.06);}},
  council:{bpm:76,step:function(s,t,sp){
    if(s%16===0)drum('zhangu',t,.3);if(s%16===10)drum('zhangu',t,.16);if(s%4===2)drum('bang',t,.06);
    const ost=[0,2,1,2,0,3,2,1];if(s%2===0)pluck('zheng',YU[ost[(s/2)%8|0]+5],t,.14);
    if(s%32===8){const m=MOT[(s/32|0)%MOT.length];phrase('erhu',m.map(function(d){return [YU[d+6]||YU[6],sp*2];}),t,.06);}}},
  battle:{bpm:120,step:function(s,t,sp){const bar=s%16;
    if(bar===0||bar===3||bar===8||bar===11)drum('zhangu',t,bar===0?.7:.45);if(s%64===60)drum('roll',t,.4);
    if(s%2===1)drum('bang',t,.05);if(s%128===0)drum('bo',t,.09);
    if(s%32<16&&s%4===0){const ch=[0,4,2,3][(s/8)%4|0];tremolo(YU[ch+4],t,sp*3.6,.14);}
    if(s%32===16){const m=MOT[(s/32|0)%MOT.length];phrase('suona',m.map(function(d,i){return [YU[d+8]||YU[8],sp*(i%2?1:2)*1.0];}),t,.055);}
    if(s%64===0)drum('gong',t,.09);}},
  crisis:{bpm:144,step:function(s,t,sp){const bar=s%16;
    if(bar%4===0||bar===14)drum('zhangu',t,.7);if(bar%2===1)drum('zhangu',t,.25);drum('bang',t,.04);if(s%32===28)drum('roll',t,.45);if(s%64===0)drum('bo',t,.1);
    if(s%4===0)tremolo(YU[[4,5,4,6][(s/4)%4|0]+3],t,sp*3.6,.15);
    if(s%16===0){const m=MOT[(s/16|0)%MOT.length];phrase('suona',m.map(function(d){return [(YU[d+9]||YU[9]),sp*2];}),t,.06);}}},
  victory:{bpm:92,len:48,then:'camp',step:function(s,t,sp){
    if(s===0){drum('roll',t,.5);drum('bo',t+.5,.1);}
    if(s===4){phrase('suona',[[GONG[9],sp*2],[GONG[10],sp*2],[GONG[11],sp*4],[GONG[12],sp*2],[GONG[11],sp*2],[GONG[12],sp*8]],t,.07);}
    if(s>=4&&s<28&&s%4===0)drum('zhangu',t,.4);
    if(s===28||s===30||s===32||s===34)bell(GONG[[7,9,11,12][(s-28)/2]],t,.12);if(s===36){drum('gong',t,.2);bell(GONG[12],t,.12);bell(GONG[9],t,.1);}}},
  defeat:{bpm:56,len:32,then:'camp',step:function(s,t,sp){
    if(s===0){drum('gong',t,.14);phrase('erhu',[[YU[9],sp*6],[YU[8],sp*4],[YU[7],sp*6],[YU[5],sp*12]],t,.06);}
    if(s%8===4)pluck('qin',YU[[3,2,1,0][(s/8)|0]],t,.3,s===28?-2:0);}}
};
