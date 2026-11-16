// 全物語の自動通しプレイ。使い方: node tools/playall.js [best|worst|random] [出力先]
// 同じブラウザで順に遊ぶので、物語どうしの記録（交差）とエピローグも確かめられる。
const { chromium } = require('playwright');
const mode=process.argv[2]||'best', out=process.argv[3]||'';
const order=['teacher','fire','luis','luis2','surfer','nanami','keiko','sumiko','genichi','epi'];
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.goto('file:///'+require('path').resolve(__dirname,'../index.html'));
  await p.evaluate(()=>{ localStorage.clear(); });
  await p.reload(); await p.click('#toMenu');
  await p.evaluate(()=>{ window.__fast=true; window.__miss=new Set(); });
  for(const id of order){
    const ok=await p.evaluate(id=>{ renderMenu(); const i=STORIES.findIndex(s=>s.id===id); if(!STORIES[i].ready) return false; startCase(i); return true; },id);
    if(!ok){ console.log(id,'NOT READY'); continue; }
    const picks=[];
    for(let n=0;n<900;n++){
      const st=await p.evaluate(()=>({sheet:document.getElementById('sheet').classList.contains('on'),scr:[...document.querySelectorAll('.screen.on')].map(s=>s.id)[0],cpr:document.getElementById('cpr').style.display==='flex'}));
      if(st.scr!=='play') break;
      if(st.cpr){ await p.evaluate(()=>{ const t=[];let x=0;for(let i=0;i<20;i++){x+=545;t.push(x);} window.__cprEnd(t); document.getElementById('cprDone').click(); }); continue; }
      if(st.sheet){
        const r=await p.evaluate(mode=>{ const n=C.nodes[S.node]; const list=n.choices.filter(c=>!c.need||c.need(S));
          let c; if(mode==='best') c=list.find(c=>c.g==='best')||list[0];
          else if(mode==='worst') c=list.find(c=>c.g==='bad')||list.find(c=>c.g==='ok')||list[0];
          else { const nf=list.filter(c=>c.g!=='fatal'); c=nf[Math.floor(Math.random()*nf.length)]||list[0]; }
          choose(n,c); return S.node+':'+c.g; },mode);
        picks.push(r);
      } else await p.evaluate(()=>tapBox());
    }
    await p.waitForTimeout(700);
    const res=await p.evaluate(()=>({scr:[...document.querySelectorAll('.screen.on')].map(s=>s.id)[0],grade:document.getElementById('outGrade').innerText,title:document.getElementById('outTitle').innerText.replace(/\s/g,''),score:S.score,max:C.max,x:XREC[C.id]}));
    console.log(id.padEnd(8),res.grade,res.title.slice(0,30),res.score+'/'+res.max,JSON.stringify(res.x));
    if(out) await p.screenshot({path:out+id+'_out.png',fullPage:true});
    await p.click('#toDeb'); await p.waitForTimeout(100);
  }
  const miss=await p.evaluate(()=>[...window.__miss].join(''));
  console.log('MISSING RUBY:',miss);
  console.log('ERRORS:',errs.join('\n')||'none');
  await b.close();
})();
