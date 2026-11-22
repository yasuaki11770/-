# ひらがな → 漢字（大人の読者向け）

物語の文章のうち、漢字のほうが読みやすい語を漢字にする道具です（形態素解析 Sudachi を使用）。

```
pip install sudachipy sudachidict_core
cd dokusho
python3 tools/kanji/convert.py tools/kanji dry ep_*.js      # 変換の一覧だけ作る（conc.json）
python3 tools/kanji/convert.py tools/kanji apply ep_*.js    # 書きかえる
python3 tools/kanji/conv_rules.py tools/kanji               # adult.js と engine.js の規則の文も合わせる
```

- 漢字にする語は `words.py` の一覧だけ（する・いる・こと・わかる・つらい など、大人の文章でもひらがなで書く語は入れない）
- 「」『』の中（原作の引用・書名）、`quote`、題名・作者名、話者名、`'!'` の行は変えない
- 詩の本（詩集・歌集）では、物語の行と太字も変えない（詩の言葉を含むため）
- 「〜てみる」「〜てほしい」などの補助のことば、「にとって」「身をもって」「口がきけない」「まっぷたつ」などは変えない
