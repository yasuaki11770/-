// 自動の通しプレイ。使い方: node tools/playtest.js <スクショの出力先の接頭辞> '["best","bad",...]' '画面を撮る言葉,…'
const { chromium } = require('playwright');
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.goto('file:///home/user/-/tsunami/index.html'); await p.waitForTimeout(400);
  const out=process.argv[2];
  await p.screenshot({path:out+'title.png'});
  await p.click('#toMenu'); await p.waitForTimeout(300); await p.screenshot({path:out+'menu.png',fullPage:true});
  await p.evaluate(()=>{ window.__fast=true; window.__miss=new Set(); });
  await p.click('.case:not([disabled])'); await p.waitForTimeout(300);
  const strat=JSON.parse(process.argv[3]||'[]'); let k=0, shots=0, taps=0; const seen=new Set();
  for(let n=0;n<600;n++){
    const st=await p.evaluate(()=>({sheet:document.getElementById('sheet').classList.contains('on'),scr:[...document.querySelectorAll('.screen.on')].map(s=>s.id)[0]}));
    if(st.scr!=='play') break;
    if(st.sheet){
      await p.waitForTimeout(400);
      if(shots<2){ await p.screenshot({path:out+`choice${shots}.png`}); shots++; }
      const want=strat[k++]||'best';
      const ok=await p.evaluate(w=>{ const n=C.nodes[S.node]; const list=n.choices.filter(c=>!c.need||c.need(S)); const c=list.find(c=>c.g===w)||list.find(c=>c.g==='best'); choose(n,c); return n.q+' -> '+c.g; },want);
      console.log(ok);
      await p.waitForTimeout(60);
    } else {
      const tx=await p.evaluate(()=>{ const c=document.getElementById('txt').cloneNode(true); c.querySelectorAll('rt').forEach(r=>r.remove()); return c.textContent; });
      for(const kw of (process.argv[4]||'').split(',').filter(Boolean)){ if(tx.replace(/\s/g,'').includes(kw)&&!seen.has(kw)){ seen.add(kw); await p.waitForTimeout(1300); await p.screenshot({path:out+'kw_'+kw.slice(0,6)+'.png'}); } }
      taps++; await p.evaluate(()=>tapBox()); await p.waitForTimeout(5); }
  }
  await p.waitForTimeout(900);
  const res=await p.evaluate(()=>({scr:[...document.querySelectorAll('.screen.on')].map(s=>s.id)[0],grade:document.getElementById('outGrade').innerText,title:document.getElementById('outTitle').innerText,score:S.score,max:C.max,el:S.clock-S.q0,miss:[...window.__miss].join(''),x:XREC.teacher}));
  console.log(JSON.stringify(res)); await p.screenshot({path:out+'out.png',fullPage:true});
  await p.click('#toDeb'); await p.waitForTimeout(300); await p.screenshot({path:out+'deb.png',fullPage:true});
  console.log('ERR',errs.join('\n'));
  await b.close();
})();
