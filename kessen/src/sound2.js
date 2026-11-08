/* ================= 音の改善：仕上げ（EQ・響き・左右の広がり）、物語の曲、合戦の環境音 ================= */
// ---- 仕上げ：低音と高音を少し持ち上げ、響きを本物の部屋に近づけ、最後に音割れを防ぐ
const _sndInit=SND.init;
SND.init=function(){const had=!!this.ctx;_sndInit.call(this);if(had||!this.ctx||this._v2)return;this._v2=1;const c=this.ctx;
  try{
    this.master.disconnect();
    const lo=c.createBiquadFilter();lo.type='lowshelf';lo.frequency.value=140;lo.gain.value=2.5;
    const mid=c.createBiquadFilter();mid.type='peaking';mid.frequency.value=380;mid.Q.value=.8;mid.gain.value=-1.5;
    const hi=c.createBiquadFilter();hi.type='highshelf';hi.frequency.value=6500;hi.gain.value=2;
    const comp=c.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=12;comp.ratio.value=3.5;comp.attack.value=.006;comp.release.value=.22;
    const lim=c.createDynamicsCompressor();lim.threshold.value=-2;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.001;lim.release.value=.08;
    this.master.connect(lo);lo.connect(mid);mid.connect(hi);hi.connect(comp);comp.connect(lim);lim.connect(c.destination);
    // 響き：初期反射＋なめらかに減衰する左右別の残響
    const sr=c.sampleRate,len=Math.floor(sr*2.8),ir=c.createBuffer(2,len,sr);
    for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);let lp=0;for(let i=0;i<len;i++){const t=i/sr;const n=Math.random()*2-1;lp+=(n-lp)*(.55-.4*Math.min(1,t/2.4));d[i]=lp*Math.pow(1-i/len,3.2)*(t<.012?0:1);}
      [.013,.021,.034,.047,.061].forEach(function(t,k){const i=Math.floor((t+(ch?.004:0))*sr);d[i]+= (k%2?-1:1)*.6/(k+1);});}
    this.rev.buffer=ir;this.revIn.gain.value=.28;
  }catch(e){}
  Ambient.start();
};
// ---- 効果音は少しずつ左右に散らして広がりを出す
SND.play=function(name,vol,rate,dest,pan){if(!this.ok())return;const b=this.buf[name];if(!b)return;const c=this.ctx;const s=c.createBufferSource();s.buffer=b;s.playbackRate.value=rate||1;
  const g=c.createGain();g.gain.value=vol===undefined?.7:vol;s.connect(g);let out=g;
  if(c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=pan!==undefined?pan:(Math.random()*2-1)*.45;g.connect(p);out=p;}
  out.connect(dest||this.sfx);if(Math.random()<.5)out.connect(this.revIn);s.start();};

// ---- 物語の曲（場面ごと）
function xiao(notes,t,vol){phrase('dizi',notes,t,vol);}
SONGS.story={bpm:52,step:function(s,t,sp){ // 古琴と簫：静かな語りの曲
  const mel=[[0,4],[2,2],[4,2],[5,6],[4,2],[2,4],[1,4],[0,8],[4,4],[5,2],[7,2],[8,6],[7,2],[5,4],[4,4],[2,8]];
  if(s%2===0&&Math.random()<.8){const d=[0,4,2,4,1,4,3,4][(s/2)%8|0];pluck('qin',YU[d],t,.26,0);}
  if(s%32===0){let tt=t;const st=(s/32|0)%2?8:0;for(let k=0;k<8;k++){const m=mel[st+k];pluck('qin',YU[m[0]+5],tt,.22,k===3?2:0);tt+=sp*m[1];}}
  if(s%64===40){const m=MOT[(s/64|0)%MOT.length];xiao(m.map(function(d,i){return [YU[d+7]||YU[7],sp*(i===m.length-1?10:4)];}),t,.055);}
  if(s%128===0)bell(GONG[5],t,.05);}};
SONGS.palace={bpm:66,step:function(s,t,sp){ // 編鐘と箏：宮廷
  if(s%16===0)bell(GONG[[5,7,4,6][(s/16)%4|0]],t,.09);if(s%16===8)bell(GONG[[9,8,7,9][(s/16)%4|0]],t,.05);
  if(s%2===0){const ost=[0,4,7,4,2,4,5,4];pluck('zheng',GONG[ost[(s/2)%8|0]+3],t,.12);}
  if(s%64===32){const m=MOT[(s/64|0)%MOT.length];phrase('dizi',m.map(function(d){return [GONG[d+8]||GONG[8],sp*3];}),t,.05);}
  if(s%8===4)drum('rim',t,.03);}};
SONGS.tense={bpm:88,step:function(s,t,sp){ // 低い太鼓と二胡の刻み：緊迫
  const bar=s%16;if(bar===0||bar===6||bar===10)drum('taiko',t,bar===0?.55:.32);if(s%4===2)drum('bang',t,.04);if(s%64===60)drum('roll',t,.3);
  if(s%8===0){const d=[0,0,1,-1][(s/8)%4|0];phrase('erhu',[[YU[d+4]||YU[4],sp*3],[YU[d+5]||YU[5],sp*3],[YU[d+4]||YU[4],sp*2]],t,.05);}
  if(s%32===16)tremolo(YU[2],t,sp*6,.1);if(s%128===0)drum('gong',t,.08);}};
SONGS.sad={bpm:48,step:function(s,t,sp){ // 二胡の長い旋律と古琴の泛音：悲しみ
  const mel=[[9,6],[8,2],[7,4],[5,4],[4,8],[5,4],[4,2],[2,2],[1,8],[2,4],[4,4],[2,4],[1,4],[0,12]];
  if(s%96===0){let tt=t;phrase('erhu',mel.map(function(m){return [YU[m[0]+2]||YU[2],sp*m[1]];}),tt,.06);}
  if(s%8===0)pluck('qin',YU[[0,3,1,2][(s/8)%4|0]],t,.24,s%32===24?-2:0);
  if(s%32===12)bell(GONG[4],t,.035);}};
SONGS.night={bpm:46,step:function(s,t,sp){ // 夜：間を空けた古琴と虫の声
  if(s%6===0&&Math.random()<.7)pluck('qin',YU[[2,4,5,7,5,4][(s/6)%6|0]+3],t,.2,0);
  if(s%3===0&&Math.random()<.5)drum('shaker',t,.012);
  if(s%48===24){const m=MOT[(s/48|0)%MOT.length];xiao(m.slice(0,5).map(function(d){return [YU[d+6]||YU[6],sp*5];}),t,.045);}}};
// 背景ごとの曲
function storySong(s){if(s.bgm==='sad')return 'sad';const b=s.bg||'';
  if(b==='palace'||b==='room')return 'palace';if(b==='fire'||b==='blood'||b==='battle'||b==='storm')return 'tense';if(b==='night'||b==='dark'||b==='altar')return 'night';if(b==='rain')return 'sad';return 'story';}

// ---- 物語の効果音
function storySE(k){if(!SND.ok())return;
  if(k==='gong')SND.gong(.2);else if(k==='fire')SND.fire();else if(k==='crit'){SND.play('sword-1',.55,.85,undefined,0);SND.play('human-hit-'+(1+(Math.random()*5|0)),.4,1,undefined,.2);}
  else if(k==='hit'){SND.play(['mace','club','fist'][Math.random()*3|0],.5,1);}else if(k==='duel'){SND.play('spear',.5,.9,undefined,-.3);SND.play('sword-1',.5,1.1,undefined,.3);SND.horn();}
  else if(k==='miss'){SND.play('dagger-swish',.4,1);}else if(k==='storm'){SND.play('lightning',.5,.8);SND.noise(2.4,.08,0,500);}else if(k==='horse')SND.play('horse',.5,1);}
function storyBlip(){if(!SND.ok())return;try{pluck('qin',YU[12]+Math.floor(Math.random()*3),SND.ctx.currentTime,.035,0);}catch(e){}}

// ---- 合戦の環境音：喚声（戦っている部隊が多いほど大きい）と風
const Ambient={on:false,start:function(){const c=SND.ctx;if(!c||this.on)return;this.on=true;
  const mk=function(sec,fn){const n=Math.floor(c.sampleRate*sec),b=c.createBuffer(2,n,c.sampleRate);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);fn(d,n,ch);}return b;};
  // 喚声：帯域を絞った雑音を、ゆっくりうねる声のかたまりに
  const crowd=mk(6,function(d,n,ch){let lp=0,env=.5;for(let i=0;i<n;i++){lp+=((Math.random()*2-1)-lp)*.08;if(i%2205===0)env=.35+Math.random()*.65;d[i]=lp*(env*(.7+.3*Math.sin(i/n*Math.PI*2*3+ch)));}});
  const wind=mk(8,function(d,n,ch){let lp=0;for(let i=0;i<n;i++){lp+=((Math.random()*2-1)-lp)*.015;d[i]=lp*(1.2+.8*Math.sin(i/n*Math.PI*2*2+ch*1.3))*2.2;}});
  const src=function(buf,f,q,type){const s=c.createBufferSource();s.buffer=buf;s.loop=true;const bp=c.createBiquadFilter();bp.type=type||'bandpass';bp.frequency.value=f;bp.Q.value=q;const g=c.createGain();g.gain.value=0;s.connect(bp);bp.connect(g);g.connect(SND.sfx);g.connect(SND.revIn);s.start();return g;};
  this.cg=src(crowd,620,.7);this.cg2=src(crowd,1500,1.2);this.wg=src(wind,380,.5,'lowpass');
  const self=this;setInterval(function(){self.tick();},250);},
 tick:function(){const c=SND.ctx;if(!c||!SND.on)return;const t=c.currentTime;
  let crowd=0,wind=0;
  if(typeof MODE!=='undefined'&&MODE==='battle'&&BT){wind=.05;if(BT.started&&!BT.over&&!BT.paused){const all=BT.sq.filter(function(q){return q.alive&&!q.routed;});const f=all.filter(function(q){return q.state==='fight';}).length;crowd=.03+.16*Math.min(1,f/Math.max(4,all.length*.6));
      if(f>0&&Math.random()<.025*Math.min(4,f))SND.play(['human-hit-1','human-hit-2','human-hit-3','human-hit-4','human-hit-5'][Math.random()*5|0],.07+Math.random()*.06,.8+Math.random()*.3);
      if(Math.random()<.012)SND.horse();}}
  else if(typeof MODE!=='undefined'&&(MODE==='home'||MODE==='result'))wind=.035;
  if(document.querySelector('.sv'))wind=0,crowd=0;
  this.cg.gain.setTargetAtTime(crowd,t,.6);this.cg2.gain.setTargetAtTime(crowd*.45,t,.6);this.wg.gain.setTargetAtTime(wind,t,1.2);}};
