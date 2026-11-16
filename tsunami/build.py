#!/usr/bin/env python3
"""tsunami/src/ の部品をつないで tsunami/index.html を作る。"""
import pathlib
d=pathlib.Path(__file__).parent; s=d/'src'
js=['10_sound.js','20_figure.js','25_sky.js','30_scenes.js','40_data.js','45_ruby.js','46_ruby_auto.js','50_engine.js','55_cpr.js','60_teacher.js','61_irino.js','62_shimoda.js','63_nakamura.js','64_hospital.js','69_epilogue.js','99_init.js']
out=(s/'00_head.html').read_text()+'<script>\n\'use strict\';\n'+'\n'.join((s/f).read_text() for f in js)+'\n</script>\n</body>\n</html>\n'
(d/'index.html').write_text(out)
print('index.html', len(out.encode()),'bytes')
