const { chromium } = require('playwright');const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file:///home/user/-/kessen/index.html'); await p.waitForTimeout(1500);
  const out = await p.evaluate(() => {
    const ids=new Set();WARS.forEach(w=>{(w.me||[]).forEach(i=>ids.add(i));(w.foe||[]).forEach(f=>f[0]&&ids.add(f[0]));});
    const heroes=[...ids].map(byId).filter(Boolean);
    const cls={};const prof={};
    const OLDW=['huangz','yanyan','chengpu','huanggai','matengg','luboshe'],ELDER=['huangfu','zhangzhao','wangyun','liubiao','liuzhang','xiandi','yuanshao','yuans','kongrong'];
    const LORD=['caoc','sima','simazhao','simayan','sunq','simashi','caopi','caorui','sunhao','liushan'];
    const HASHV=['takehiro','ryusei','mesuo','maron'];
    heroes.forEach(h=>{const hs=bvHash(h.id),f1=(hs%1000)/1000,f2=((hs>>>10)%1000)/1000;const pers=persOf(h.id);let c;
      if(typeof FEMALE!=='undefined'&&FEMALE[h.id])c=h.id==='sunshangxiang'?'femS':'fem';
      else if(OLDW.indexOf(h.id)>=0)c='jii';else if(ELDER.indexOf(h.id)>=0)c='sorin';
      else if(h.id==='lubu')c='takehiroT';else if(typeof PRETTY!=='undefined'&&PRETTY[h.id]&&PRETTY[h.id]!=='fine')c='kotaro';
      else if(LORD.indexOf(h.id)>=0)c='mesuo';else if(h.id==='liub')c='ryusei';
      else if(h.i>=88&&h.p<82)c='shuji';else if(pers==='mou')c='ryuseiH';else if(pers==='doku')c='takehiroT';
      else c=HASHV[hs%HASHV.length];
      cls[h.id]=c;prof[h.id]={pitch:+((f1-.5)*.08).toFixed(3),speed:+(1+(f2-.5)*.12).toFixed(3),c:c};});
    const jobs={};const add=(c,t)=>{if(!t)return;t=t.trim();if(!t)return;jobs[c+'|'+t]={c:c,t:t};};
    const allD=[].concat(DLINE.crisis,DLINE.rally,DLINE.final,DLINE.foe,['いざ、参る！','この戦、必ず勝つ！','我らの力、見せてくれよう！','続けぇ！','敵将はどこだ！','一歩も退くな！']);
    heroes.forEach(h=>{const c=cls[h.id];const pers=persOf(h.id);
      Object.keys(LINES).forEach(ev=>{const L=LINES[ev];const a=L[pers]||L.yuu||[];a.forEach(t=>add(c,BVOICE.dial(t,h.id)));});
      allD.forEach(t=>add(c,BVOICE.dial(t,h.id)));});
    const sp=heroes.map(h=>({id:h.id,t:h.sp?BVOICE.dial(h.sp,h.id):'',p:prof[h.id].pitch,s:prof[h.id].speed,c:cls[h.id]})).filter(x=>x.t);
    // 技の名（名台詞のない武将）
    return {cls:cls,prof:prof,jobs:Object.values(jobs),sp:sp,nlines:Object.keys(LINES).length};
  });
  fs.writeFileSync('vvjobs.json',JSON.stringify(out));console.log(out.jobs.length,out.sp.length,out.nlines,JSON.stringify(Object.values(out.cls).reduce((a,c)=>(a[c]=(a[c]||0)+1,a),{})));
  await b.close();
})();
