// 物語の文章から、ふりがな辞書（src/46_ruby_auto.js）を自動で作る。
// 使い方: NODE_PATH=<kuromojiのnode_modules> node tools/make_ruby.js
// 手で作った辞書（src/45_ruby.js）にある言葉は、そちらが優先される。
const fs=require('fs'), path=require('path');
const kuromoji=require('kuromoji');
const SRC=path.resolve(__dirname,'../src');
const files=fs.readdirSync(SRC).filter(f=>/^(40|6\d).*\.js$/.test(f));
const text=files.map(f=>fs.readFileSync(path.join(SRC,f),'utf8')).join('\n');
// 文字列リテラルだけを取り出す
const lits=[]; text.replace(/'((?:[^'\\\n]|\\.)*)'|`([^`]*)`/g,(m,a,b)=>{ lits.push((a||b||'').replace(/\{[^|{}]+\|[^{}]+\}/g,'')); return m; });
const manual=fs.readFileSync(path.join(SRC,'45_ruby.js'),'utf8');
const M=new Set([...manual.matchAll(/'([^']+)':'([^']*)'/g)].map(m=>m[1]));
const K=/[一-鿿々]/;
const kata2hira=s=>s.replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
kuromoji.builder({dicPath:path.join(path.dirname(require.resolve('kuromoji')),'..','dict')}).build((err,tk)=>{
  if(err) throw err;
  const cnt={};
  for(const s of lits){ if(!K.test(s)) continue;
    for(const t of tk.tokenize(s)){
      const sf=t.surface_form; if(!K.test(sf)||!t.reading||t.reading==='*') continue;
      let rd=kata2hira(t.reading);
      // 後ろの送りがなを取り除く（漢字の部分のふりがなにする）
      let i=sf.length, j=rd.length; while(i>0&&!K.test(sf[i-1])&&sf[i-1]===rd[j-1]){ i--; j--; }
      let a=0,b=0; while(a<i&&!K.test(sf[a])&&sf[a]===rd[b]){ a++; b++; }
      const key=sf.slice(a), val=rd.slice(b,j);
      if(!val||/[^ぁ-んー]/.test(val)) continue;
      if(!K.test(key[0])) continue;
      (cnt[key]=cnt[key]||{})[val]=(cnt[key][val]||0)+1;
    }
  }
  const out={};
  for(const [k,v] of Object.entries(cnt)){ if(M.has(k)) continue; out[k]=Object.entries(v).sort((x,y)=>y[1]-x[1])[0][0]; }
  const body=Object.entries(out).sort().map(([k,v])=>`'${k}':'${v}'`).join(',\n');
  fs.writeFileSync(path.join(SRC,'46_ruby_auto.js'),`/* 自動で作ったふりがな（tools/make_ruby.js）。手で直す時は 45_ruby.js に書く（そちらが優先） */\nconst RUBY_AUTO={\n${body}\n};\nfor(const k in RUBY_AUTO) if(!(k in RUBY)) RUBY[k]=RUBY_AUTO[k];\n`);
  console.log('auto entries',Object.keys(out).length);
});
