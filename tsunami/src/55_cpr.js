function runCPR(cb){
  $('chips').innerHTML=''; $('q').textContent='胸骨圧迫'; $('choices').style.display='none'; $('timer').classList.remove('on');
  const P=$('cpr'); P.style.display='flex'; $('sheet').classList.add('on');
  $('cprDone').style.display='none'; $('pad').style.pointerEvents='auto';
  $('cprMsg').innerHTML='胸の真ん中を押すつもりで、円をテンポよくタップ。<br>最初のタップから10秒間。目標は1分間に100〜120回。';
  const lo=60,hi=160, pct=v=>Math.max(0,Math.min(100,(v-lo)/(hi-lo)*100));
  $('band').style.left=pct(100)+'%'; $('band').style.width=(pct(120)-pct(100))+'%'; $('needle').style.left='0%'; $('bpm').textContent='--'; $('bpm').className='bpm';
  let taps=[],t0=0,timer=null,done=false; const pad=$('pad');
  const end=()=>{
    done=true; clearInterval(timer); pad.style.pointerEvents='none';
    const iv=[]; for(let i=1;i<taps.length;i++) iv.push(taps[i]-taps[i-1]);
    let g,sc,msg,bpm=0;
    if(iv.length<5){ g='bad'; sc=-1; msg='圧迫がほとんどできなかった。'; }
    else{ const mean=iv.reduce((a,b)=>a+b,0)/iv.length; bpm=Math.round(60000/mean); const sd=Math.sqrt(iv.reduce((a,b)=>a+(b-mean)**2,0)/iv.length); const steady=sd/mean<.2;
      if(bpm>=100&&bpm<=120){ g=steady?'best':'ok'; sc=steady?2:1; msg=`平均 ${bpm}回/分。${steady?'テンポも安定していて、理想的です。':'テンポは良いが、少しばらつきがある。'}`; }
      else if(bpm>=90&&bpm<=130){ g='ok'; sc=1; msg=`平均 ${bpm}回/分。${bpm<100?'少し遅い。':'少し速すぎる。'}目標は100〜120回/分。`; }
      else { g='bad'; sc=-1; msg=`平均 ${bpm}回/分。${bpm<100?'遅すぎて、十分な血流が作れない。':'速すぎて、胸が戻りきらず血液が心臓に戻らない。'}`; } }
    if(S.flags.soft){ msg+=' ただ、押す力が弱く、胸はほとんど沈んでいなかった。'; if(g==='best'){g='ok';sc=1;} }
    S.score+=sc;
    S.log.push({q:'胸骨圧迫のテンポ',you:bpm?`平均 ${bpm}回/分`:'ほとんど押せなかった',g,why:msg+' 胸骨圧迫は、約5cmの深さで、1分間に100〜120回。押したら胸が元に戻るまで力を抜き、できるだけ中断しないこと。',best:null,bestWhy:null});
    $('cprMsg').textContent=msg; $('cprDone').style.display='block'; $('guide').classList.remove('go'); sfx(g==='best'?'lvl':'ok');
  };
  pad.onpointerdown=e=>{ e.preventDefault(); e.stopPropagation(); if(done) return; const now=performance.now();
    if(!t0){ t0=now; timer=setInterval(()=>{ const left=Math.max(0,10-(performance.now()-t0)/1000); $('cprLeft').textContent='あと '+left.toFixed(1)+' 秒'; if(left<=0) end(); },100); }
    taps.push(now); sfx('hit'); pad.classList.add('hit'); setTimeout(()=>pad.classList.remove('hit'),90); stageFx('shake');
    if(taps.length>=3){ const r=taps.slice(-5); const m=(r[r.length-1]-r[0])/(r.length-1); const b=Math.round(60000/m); $('bpm').textContent=b; $('bpm').className='bpm '+(b>=100&&b<=120?'in':'out'); $('needle').style.left=pct(b)+'%'; } };
  $('cprLeft').textContent='あと 10.0 秒';
  $('guideOn').onchange=()=>$('guide').classList.toggle('go',$('guideOn').checked); $('guide').classList.toggle('go',$('guideOn').checked);
  $('cprDone').onclick=e=>{ e.stopPropagation(); P.style.display='none'; $('choices').style.display='flex'; closeSheet(); play([`あなたは押し続けた。${S.log[S.log.length-1].you}。`],cb); };
  window.__cprEnd=fake=>{ taps=fake; end(); };
}

