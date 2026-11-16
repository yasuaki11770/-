#!/usr/bin/env python3
"""全物語の幡多弁の台詞を一覧にして HATABEN.md を作る（地元の方の確認用）。"""
import re, pathlib
d=pathlib.Path(__file__).resolve().parent.parent
NOTE={'けん':'「〜けん」','よる':'「〜よる」（進行）','ちょ':'「〜ちょる」（〜ている）','がです':'「〜がです」','がよ':'「〜がよ」（土佐弁寄り？）','じゃ':'「〜じゃ」','えい':'「えい」（土佐弁寄り？）','がな':'「〜がな」','いかん':'「いかん」','ほうか':'「ほうか」','けんど':'「けんど」','うて':'ウ音便','れん':'「〜れん」（可能）','るが':'「〜が」（〜の）','おまさん':'「おまさん」','ちゃって':'「〜ちゃって」（〜してあげて）','ろうか':'「〜ろうか」','なんぼ':'「なんぼ」','ほんま':'「ほんま」（関西寄り？）'}
rows=[]
for f in sorted((d/'src').glob('6*.js')):
    t=f.read_text()
    for blk in re.split(r'\nSTORIES\.push\(\{',t)[1:]:
        sid=re.search(r"id:'(\w+)'",blk).group(1); title=re.search(r"title:'([^']+)'",blk).group(1)
        hata=set(re.findall(r"(\w+):\{name:'[^']+',look:'[^']+'[^}]*hata:true",blk))
        names=dict(re.findall(r"(\w+):\{name:'([^']+)'",blk))
        node=''
        for ln in blk.split('\n'):
            m=re.match(r"\s{4}(\w+):\{",ln)
            if m: node=m.group(1)
            for who,txt in re.findall(r"'(\w+)\|(「[^']*」)'",ln):
                if who in hata:
                    x=re.sub(r'\{([^|]+)\|[^}]+\}',r'\1',txt); x=re.sub(r'\[\[[^|\]]*\|([^|\]]*)(?:\|[^\]]*)?\]\]',r'\1',x); x=re.sub(r'⟦([^⟧]*)⟧',r'\1',x)
                    rows.append((title,node,names.get(who,who),x,'、'.join([v for k,v in NOTE.items() if k in x][:3])))
out=['# 幡多弁の確認リスト（全物語）','','地元の方に確認していただくための一覧です。直したい所は右の欄に書いてください。','すべて **要確認** です（作者AIの幡多弁は確かではありません）。土佐弁（高知市周辺）や関西の言い方が混ざっていないかを特に見てください。','','| # | 物語 | 場面 | 話す人 | 台詞 | 気になる点 | 直した方がよい言い方 |','|---|---|---|---|---|---|---|']
seen=set()
for i,(a,b,c,x,n) in enumerate([r for r in rows if not (r[3] in seen or seen.add(r[3]))],1):
    out.append(f'| {i} | {a} | {b} | {c} | {x} | {n} | |')
(d/'HATABEN.md').write_text('\n'.join(out)+'\n'); print(len(out)-7,'lines')
