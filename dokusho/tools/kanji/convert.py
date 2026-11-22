"""ひらがな → 漢字（大人の読者向け）。使い方: python3 convert.py <kjdir> dry|apply <files...>"""
import sys, re, json, collections
sys.path.insert(0, sys.argv[1])
from scan import literals
from analyze import TK, POETRY, names, protected_spans, HIRA
from words import W, SPECIAL, NONAUX, SKIP_AFTER
WS = set(W)
def k2h(s): return ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in s)
_rd = {}
def reading(form):
    if form not in _rd:
        _rd[form] = k2h(''.join(m.reading_form() for m in TK.tokenize(form)))
    return _rd[form]
def stem(form):
    tail = re.search(r'[ぁ-ゖ]*$', form).group(0)
    st = form[:len(form) - len(tail)] if tail else form
    r = reading(form)
    if tail and not r.endswith(tail): return None
    return st, r[:len(r) - len(tail)] if tail else r
def convert_piece(text, base, spans, toks_out):
    toks = []; pos = 0
    for mo in TK.tokenize(text):
        sfc = mo.surface(); st = text.find(sfc, pos); pos = st + len(sfc)
        toks.append((st, sfc, mo.normalized_form(), mo.part_of_speech()))
    rep = []
    for i, (st, sfc, nf, ps) in enumerate(toks):
        if not HIRA.match(sfc) or len(sfc) < 2: continue
        if any(x <= base + st < y for x, y in spans): continue
        prev = toks[i - 1][1] if i else ''; nxt = toks[i + 1][1] if i + 1 < len(toks) else ''
        new = None
        if sfc == 'なに' and nf == '何': new = '何'
        elif sfc in ('かた', 'がた') and nf == '方' and prev and not HIRA.match(prev[-1:] or 'あ') is None: new = '方'
        elif sfc == 'かれ' and nf == '彼': new = '彼'
        elif sfc == 'さま' and nf == '様' and ps[0] == '接尾辞':
            if not HIRA.match(prev or 'x'): new = '様'
        elif sfc in ('ひと', 'ふた') and ps[1] == '数詞' and nxt == 'つ': new = {'ひと': '一', 'ふた': '二'}[sfc]
        elif sfc == 'いい' or sfc == 'いう' and prev in ('と', 'って', 'そう', 'こう', 'どう', 'ああ', 'とか', 'も'): new = None
        elif nf == '言う' and ps[0] == '動詞':
            if prev not in ('と', 'って', 'そう', 'こう', 'どう', 'ああ', 'とか', 'も', 'に') and sfc[:2] in ('いっ', 'いえ', 'いわ', 'いい', 'いう', 'いお'):
                new = '言' + sfc[1:]
        elif nf in WS or nf in SPECIAL:
            if nf in NONAUX and prev in ('て', 'で'): continue
            before = text[max(0, st - 15):st]; after = text[st + len(sfc):st + len(sfc) + 4]
            if nf == '取る' and prev == 'に' and sfc == 'とっ' and text[max(0, st - 2):st - 1] not in ('手', '当'): continue
            if nf == '聞く' and text[max(0, st - 2):st] in ('口が', '口を', '口も'): continue
            if nf == '回る' and prev == 'し': continue
            if nf == '当たる' and prev == 'に' and nxt == 'て': continue
            if nf == '持つ' and text[max(0, st - 2):st] == '身を': continue
            if nf == '詰まる' and sfc.startswith('つまら'): continue
            if nf == '待つ' and sfc == 'まっ' and nxt[:1] not in ('て', 'た'): continue
            if nf == '人' and nxt not in ('', 'は', 'が', 'を', 'に', 'の', 'と', 'も', 'へ', 'で', 'や', 'だ', 'じゃ', 'たち', '、', '。', '……', 'か', 'よ', 'ね'): continue
            if nf == '悩み' and after.startswith('言おう'): continue
            if nf == '様' and HIRA.match(prev or 'x'): continue
            if nf == '乗る' and ('新聞' in before or '記事' in before):
                rep.append((st, st + 1, '載')); toks_out.append((nf, before[-8:] + '[' + sfc + '→載' + sfc[1:] + ']')); continue
            if nf in SKIP_AFTER and prev in SKIP_AFTER[nf]: continue
            if nf == '不思議' and text[st + len(sfc):st + len(sfc) + 2] == 'の国': continue
            target = SPECIAL.get(nf, nf)
            sr = stem(target)
            if not sr or not sr[1] or not sfc.startswith(sr[1]): continue
            new = sr[0] + sfc[len(sr[1]):]
        if new and new != sfc:
            rep.append((st, st + len(sfc), new))
            toks_out.append((nf, text[max(0, st - 8):st] + '[' + sfc + '→' + new + ']' + text[st + len(sfc):st + len(sfc) + 6]))
    out = text
    for a, b, new in reversed(rep): out = out[:a] + new + out[b:]
    return out
def convert_literal(text, poetry, log):
    spans = protected_spans(text, poetry)
    parts = text.split('\\n'); out = []; base = 0
    for p in parts:
        out.append(convert_piece(p, base, spans, log)); base += len(p) + 2
    return '\\n'.join(out)
if __name__ == '__main__':
    mode = sys.argv[2]; files = sys.argv[3:]
    from analyze import targets
    log = []; changed = 0
    for f in files:
        s = open(f).read(); edits = []
        for a, b, text, poetry in targets(f, s):
            new = convert_literal(text, poetry, log)
            if new != text: edits.append((a, b, new))
        for a, b, new in reversed(edits): s = s[:a] + new + s[b:]
        if edits and mode == 'apply': open(f, 'w').write(s); changed += 1
    by = collections.defaultdict(list)
    for nf, ctx in log: by[nf].append(ctx)
    json.dump({k: v for k, v in by.items()}, open(sys.argv[1] + '/conc.json', 'w'), ensure_ascii=False)
    print('conversions', len(log), 'forms', len(by), 'files changed', changed)
