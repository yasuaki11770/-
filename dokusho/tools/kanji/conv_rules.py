"""adult.js の P（置きかえ規則）と engine.js の CH_RE の中の文を、物語と同じ規則で漢字に"""
import sys, re
sys.path.insert(0, sys.argv[1])
from convert import convert_literal
from scan import literals
def region(path, start, end):
    s = open(path).read(); a = s.index(start); b = s.index(end, a)
    reg = s[a:b]; log = []
    edits = []
    for m in re.finditer(r"\[/((?:\\/|[^/\n])+)/([gimsuy]*)\s*,", reg):
        new = convert_literal(m.group(1), False, log)
        if new != m.group(1): edits.append((m.start(1), m.end(1), new))
    for x, y, q in literals(reg):
        t = reg[x:y]
        if re.search('[ぁ-ゖ]', t):
            new = convert_literal(t, False, log)
            if new != t: edits.append((x, y, new))
    for x, y, new in sorted(edits, reverse=True): reg = reg[:x] + new + reg[y:]
    open(path, 'w').write(s[:a] + reg + s[b:])
    print(path, len(edits), 'literals changed,', len(log), 'words')
region('adult.js', 'const P = [', '/* ひらがなで開いていた語')
region('engine.js', 'const CH_RE = [', '];')
