import sys, re, glob, json, collections
sys.path.insert(0, sys.argv[1])
from scan import literals
from sudachipy import Dictionary, SplitMode
TK = Dictionary(dict='core').create(SplitMode.C)
POETRY = {'bansui','byron','chuya','gitanjali','ichiaku','kusanoha','misuzu','sora','taiyou','tanikawa','chieko'}
HIRA = re.compile(r'^[ぁ-ゖー]+$'); KAN = re.compile(r'[一-龥々]')
names = set()
for f in glob.glob('ep_*.js'):
    s = open(f).read()
    m = re.search(r'chars\s*:\s*\{([^}]*)\}', s)
    if m: names |= set(re.findall(r"['\"]?([^'\":,{}\s]+)['\"]?\s*:", m.group(1)))
def protected_spans(text, poetry):
    spans = [(m.start(), m.end()) for m in re.finditer(r'「[^」]*」|『[^』]*』', text)]
    if poetry: spans += [(m.start(), m.end()) for m in re.finditer(r'\*\*.+?\*\*', text)]
    return spans
def targets(f, s):
    ep = f[3:-3]; poetry = ep in POETRY
    for a, b, q in literals(s):
        text = s[a:b]
        if not re.search(r'[ぁ-ゖ]', text): continue
        if text in names: continue
        pre = s[max(0, a - 40):a - 1]
        if re.search(r'(title|author|id|start|to|world|quote|yomi)\s*:\s*$', pre): continue
        if re.search(r"\[\s*'!'\s*,\s*$", pre): continue
        if 'けいかほうこく' in text: continue                      # わざとひらがなで書いた経過報告
        if poetry and re.search(r"\[\s*'[^']*'\s*,\s*$", pre): continue   # 詩の本：物語の行（地の文・台詞）は、詩の言葉を含むので変えない
        if re.search(r"\[\s*$", pre) and re.match(r"\s*,", s[b + 1:b + 4]) and len(text) < 16 and not re.search('[。、]', text): continue   # 話者名
        yield a, b, text, poetry
def tokens(text):
    out = []; pos = 0
    for mo in TK.tokenize(text):
        sfc = mo.surface(); st = text.find(sfc, pos); pos = st + len(sfc)
        out.append((st, sfc, mo.normalized_form(), mo.dictionary_form(), mo.part_of_speech()))
    return out
if __name__ == '__main__':
    cnt = collections.Counter(); ex = {}
    for f in sorted(glob.glob('ep_*.js')):
        s = open(f).read()
        for a, b, text, poetry in targets(f, s):
            spans = protected_spans(text, poetry); toks = tokens(text.replace('\\n', '\n'))
            for i, (st, sfc, nf, df, pos) in enumerate(toks):
                if not HIRA.match(sfc) or not KAN.search(nf): continue
                if any(x <= st < y for x, y in spans): continue
                key = (nf, pos[0], pos[1]); cnt[key] += 1
                ex.setdefault(key, set()).add(sfc)
    rows = [(c, k[0], k[1], k[2], '/'.join(sorted(ex[k])[:4])) for k, c in cnt.most_common()]
    json.dump(rows, open(sys.argv[1] + '/cands.json', 'w'), ensure_ascii=False)
    print(len(rows), 'distinct;', sum(r[0] for r in rows), 'tokens')
