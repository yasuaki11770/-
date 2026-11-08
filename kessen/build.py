#!/usr/bin/env python3
"""三國志決戦伝を組み立てる。

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
sub('<title>三国決戦伝</title>', '<title>三國志決戦伝</title>')
sub('<span class="ttl">三国決戦伝</span>', '<span class="ttl">三國志決戦伝</span>')
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
extra = [src('vendor_post.js'), src('assets_grass.js'), src('story_parts.js'), src('story_mode.js'), src('portrait2.js'), src('visual2.js'), src('sound2.js')]
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
