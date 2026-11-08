#!/usr/bin/env python3
"""三国英雄伝を組み立てる。

三国決戦伝（src/base.html）の合戦・3D・一騎打ち・音楽はそのまま使い、
物語モード（src/ の台本・合戦表・物語の仕組み）を足して index.html を作る。
  python3 build.py            -> index.html（そのまま開ける完全なページ）
  python3 build.py OUT.html   -> Artifact 用（ページの外枠なし）も書き出す
"""
import re, sys, os

D = os.path.dirname(os.path.abspath(__file__))
src = lambda f: open(os.path.join(D, 'src', f), encoding='utf-8').read()
base = src('base.html')

def sub(old, new, count=1):
    global base
    assert base.count(old) >= 1, old[:80]
    base = base.replace(old, new, count)

# 名前
sub('<title>三国決戦伝</title>', '<title>三国英雄伝</title>')
sub('<span class="ttl">三国決戦伝</span>', '<span class="ttl">三国英雄伝</span>')
sub("const SKEY='sangoku-kessen-v4';", "const SKEY='sangoku-kessenden-v1';")

# 合戦表を物語の34戦に差し替え
a = base.index('const WARS=[')
b = base.index('const TER_NAME=')
base = base[:a] + src('wars.js') + '\n' + base[b:]

# 史実イベント・史実目標は ek（なければ戦の名前）で引く
sub('EVENTS[RUN.w.n]', 'EVENTS[RUN.w.ek||RUN.w.n]')
base = base.replace('GOALS[RUN.w.n]', 'GOALS[RUN.w.ek||RUN.w.n]')
sub('GOALS[WARS[i].n]', 'GOALS[WARS[i].ek||WARS[i].n]')
sub('const G_=GOALS[w.n];', 'const G_=GOALS[w.ek||w.n];')

# 34戦に合わせて敵の強さ・経験値の伸びをならす（元は17戦）
sub('const lv=Math.max(1,Math.round(3+i*1.5));', 'const lv=Math.max(1,Math.round(3+i*.75));')
sub('const ex=Math.round(50+i*35);', 'const ex=Math.round(50+i*18);')
sub('let r=1.15+.012*i;', 'let r=1.15+.006*i;')

# 物語の台本（data.js と story1〜4.js）は他と名前がぶつからないよう関数の中に閉じ込める
data = src('data.js').replace("if (typeof module !== 'undefined') module.exports = { CLS, TER, CH, SC, CHAPTERS, TRI, MT, chap, ev, bt, GEN };", '')
stories = '\n'.join(src('story%d.js' % i) for i in range(1, 5))
st = 'const ST=(function(){\n' + data + '\n' + stories + '\nreturn {SC:SC,CHAPTERS:CHAPTERS,CH:CH};\n})();\n'
extra = [src('vendor_post.js'), src('assets_grass.js'), src('story_parts.js'), src('story_mode.js'), src('portrait2.js'), src('visual2.js'), src('sound2.js'), src('cine.js')]
for s in [st] + extra:
    assert '</script' not in s
boot = '/* ================= BOOT ================= */'
sub(boot, st + '\n'.join(extra) + '\n' + boot)

# 起動したらタイトル（つづきから／はじめから）
sub('  if(S){goHome();}\n  else{VIEW=null;showIntro();}', '  VIEW=null;storyTitle();')

# 3D：中身を外から触れるように出し、後処理（ブルーム等）を通して描く
sub("    R.world=new T.Group();scene.add(R.world);", "    R.renderer=renderer;R.scene=scene;R.camera=camera;R.hemi=hemi;R.sun=sun;R.TX=TX;\n    R.world=new T.Group();scene.add(R.world);")
sub("R.render=function(){placeCam();renderer.render(scene,camera);};", "R.render=function(){placeCam();if(R.comp){R.postResize&&R.postResize();R.comp.render();}else renderer.render(scene,camera);};")
sub("  resize();R3.init();", "  resize();R3.init();R3.upgrade&&R3.upgrade();")

# 一騎打ち：物語の武将も英雄伝で戦えるように送り、鑑賞中は自動で進む映画のような見せ方にする
sub("const msg={t:'duel',id:DUEL.id,me:me.hero,foe:foe.hero,strat:me.strat||'bal',stage:stg,mm:1+.02*((me.hs.lv||1)-1),fm:1+.015*((foe.hs.lv||1)-1)};",
    "const msg={t:'duel',id:DUEL.id,me:me.hero,foe:foe.hero,strat:me.strat||'bal',stage:stg,mm:(BT&&BT.watch?1.5:1)*(1+.02*((me.hs.lv||1)-1)),fm:(BT&&BT.watch?.85:1)*(1+.015*((foe.hs.lv||1)-1)),add:duelAdd([me.hero,foe.hero]),demo:!!(BT&&BT.watch)};")
sub("window.addEventListener('message',function(e){const m=e.data||{};if(m.t!=='duel')return;",
    "window.addEventListener('message',function(e){const m=e.data||{};if(m.t!=='duel')return;if(m.add)m.add.forEach(function(a){if(byId(a.id))return;HEROES.push(a.h);INT[a.id]=a.i;STAT[a.id]=a.s;try{if(typeof G3!=='undefined'&&G3.LOOK)G3.LOOK[a.id]=a.lk;}catch(_){}const h=byId(a.id);h.i=a.i;h.hp=Math.round(a.s[0]/2);h.df=a.s[1];h.mu=a.s[2];h.cmd=a.s[3];h.pol=a.s[4];h.cha=a.s[5];h.p=a.s[6];});")
sub("startDuel();parent.postMessage({t:'duelStarted',id:m.id},'*');",
    "startDuel();parent.postMessage({t:'duelStarted',id:m.id},'*');if(m.demo){document.body.classList.add('autoW');clearInterval(window.__dmT);window.__dmT=setInterval(function(){if(!BR){clearInterval(window.__dmT);return;}const sp=document.getElementById('stratP'),o=document.getElementById('stOk');if(S.paused&&sp&&!sp.hidden&&o)o.click();},700);if(!document.getElementById('autoSt')){const st=document.createElement('style');st.id='autoSt';st.textContent='body.autoW #pad,body.autoW #stratP,body.autoW #stNow{display:none!important}#skipW{position:fixed;z-index:99;bottom:calc(18px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);padding:8px 14px;border-radius:8px;border:1px solid #c9a23c;background:rgba(20,12,6,.85);color:#f2dc9a;font:700 15px serif;letter-spacing:.1em}body:not(.autoW) #skipW{display:none}';document.head.appendChild(st);}let sk=document.getElementById('skipW');if(!sk){sk=document.createElement('button');sk.id='skipW';sk.type='button';sk.textContent='結果へ ▶▶';document.body.appendChild(sk);sk.addEventListener('click',function(e){e.stopPropagation();if(!BR)return;S.tok++;if(S.iv){clearInterval(S.iv);S.iv=null;}if(B)B.over=true;try{if(G3.ok){G3.mood('');G3.danger(false);G3.heat(0);}}catch(_){}if(D){D.hp[1]=0;}showResult(true);});}}else{document.body.classList.remove('autoW');clearInterval(window.__dmT);}")
sub("const _brSR=showResult;showResult=function(win){if(BR){", "const _brSR=showResult;showResult=function(win){if(BR){document.body.classList.remove('autoW');")

sub("G3.look=function(id){return Object.assign({},DEFL,LOOK[id]||{});};", "G3.LOOK=LOOK;G3.look=function(id){return Object.assign({},DEFL,LOOK[id]||{});};")
sub("UI.appendChild(d);setTimeout(function(){d.remove();},3000);", "UI.appendChild(d);setTimeout(function(){d.remove();},5000);", 2)
sub("UI.appendChild(e);setTimeout(function(){e.remove();},1700);}", "UI.appendChild(e);setTimeout(function(){e.remove();},2800);}")
sub('  if(BT.started)MM.draw(x);', '  if(BT.started&&!BT.watch)MM.draw(x);')
# 物語の見た目
sub('<div id="app">', '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=BIZ+UDPMincho:wght@400;700&family=Yuji+Syuku&display=swap">\n<style>\n' + src('story.css') + src('theme.css') + '</style>\n<div id="app">')

open(os.path.join(D, 'index.html'), 'w', encoding='utf-8').write(base)
print('index.html', len(base))

if len(sys.argv) > 1:
    # Artifact は外枠（doctype/head/body）を自分で付けるので取り除く
    body = base
    m = re.match(r'<!doctype html><html><head>.*?</head><body>\n?', body, re.S)
    if m: body = body[m.end():]
    body = re.sub(r'</body></html>\s*$', '', body)
    open(sys.argv[1], 'w', encoding='utf-8').write(body)
    print(sys.argv[1], len(body))
