"""ep_*.js の文字列リテラルを取り出す（位置つき）"""
import re
def literals(src):
    """(start, end, quote) を返す。end は閉じ引用符の位置。テンプレートの ${} の中は飛ばす"""
    out = []; i = 0; n = len(src)
    while i < n:
        c = src[i]
        if c == '/' and i + 1 < n and src[i+1] == '/':
            j = src.find('\n', i); i = n if j < 0 else j; continue
        if c == '/' and i + 1 < n and src[i+1] == '*':
            j = src.find('*/', i + 2); i = n if j < 0 else j + 2; continue
        if c in '\'"':
            j = i + 1
            while j < n and src[j] != c:
                if src[j] == '\\': j += 1
                j += 1
            out.append((i + 1, j, c)); i = j + 1; continue
        if c == '`':
            j = i + 1; seg = j
            while j < n and src[j] != '`':
                if src[j] == '\\': j += 2; continue
                if src[j] == '$' and j + 1 < n and src[j+1] == '{':
                    out.append((seg, j, '`'))
                    depth = 1; j += 2
                    while j < n and depth:
                        if src[j] == '{': depth += 1
                        elif src[j] == '}': depth -= 1
                        elif src[j] in '\'"':      # ${} の中の文字列も対象にする
                            q = src[j]; k = j + 1
                            while k < n and src[k] != q:
                                if src[k] == '\\': k += 1
                                k += 1
                            out.append((j + 1, k, q)); j = k
                        j += 1
                    seg = j; continue
                j += 1
            out.append((seg, j, '`')); i = j + 1; continue
        i += 1
    return out
