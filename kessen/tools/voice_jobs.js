const { chromium } = require('playwright');const fs=require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file:///home/user/-/kessen/index.html'); await p.waitForTimeout(1500);
  const out = await p.evaluate(() => {
    const ids=new Set();WARS.forEach(w=>{(w.me||[]).forEach(i=>ids.add(i));(w.foe||[]).forEach(f=>f[0]&&ids.add(f[0]));});
    const heroes=[...ids].map(byId).filter(Boolean);
    const cls={};const prof={};
    heroes.forEach(h=>{const hs=bvHash(h.id),f1=(hs%1000)/1000,f2=((hs>>>10)%1000)/1000;const pitch=Math.max(.45,Math.min(1.35,.5+f1*.8)),rate=.95+f2*.2;
      let ht=Math.round((pitch-.9)*8);const fem=!!(typeof FEMALE!=='undefined'&&FEMALE[h.id]);const old=['huangz','matengg','yanyan','huangfu','chengpu','huanggai','zhangzhao','wangyun','xumu','wuguotai','luboshe'].indexOf(h.id)>=0;
      const c=fem?'fem':old?'old':ht<=-2?'low':ht>=2?'high':'mid';cls[h.id]=c;prof[h.id]={ht:Math.max(-4,Math.min(4,ht)),sp:+rate.toFixed(2),c:c};});
    const jobs={};const add=(c,t)=>{if(!t)return;t=t.trim();if(!t)return;jobs[c+'|'+t]={c:c,t:t};};
    const allD=[].concat(DLINE.crisis,DLINE.rally,DLINE.final,DLINE.foe,['いざ、参る！','この戦、必ず勝つ！','我らの力、見せてくれよう！','続けぇ！','敵将はどこだ！','一歩も退くな！']);
    heroes.forEach(h=>{const c=cls[h.id];const pers=persOf(h.id);
      Object.keys(LINES).forEach(ev=>{const L=LINES[ev];const a=L[pers]||L.yuu||[];a.forEach(t=>add(c,BVOICE.dial(t,h.id)));});
      allD.forEach(t=>add(c,BVOICE.dial(t,h.id)));});
    const sp=heroes.map(h=>({id:h.id,t:h.sp?BVOICE.dial(h.sp,h.id):((TECH.bigBy&&TECH.bigBy[h.id])?TECH.bigBy[h.id]+'！':''),ht:prof[h.id].ht,s:prof[h.id].sp,c:cls[h.id]})).filter(x=>x.t);
    // 技の名（名台詞のない武将）
    return {cls:cls,prof:prof,jobs:Object.values(jobs),sp:sp,nlines:Object.keys(LINES).length};
  });
  fs.writeFileSync('vjobs.json',JSON.stringify(out));console.log(out.jobs.length,out.sp.length,out.nlines,JSON.stringify(Object.values(out.cls).reduce((a,c)=>(a[c]=(a[c]||0)+1,a),{})));
  await b.close();
})();
