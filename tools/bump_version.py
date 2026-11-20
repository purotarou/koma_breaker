#!/usr/bin/env python3
"""index.html の js/css に付けた ?v=... を今の日時に更新する（公開前に毎回実行）。
GitHub Pages / iPad Safari は js を古いまま使い続けることがあるので、URL を変えて必ず読み直させる。
使い方: python3 tools/bump_version.py"""
import re, time, pathlib
p = pathlib.Path(__file__).resolve().parent.parent / 'index.html'
s = p.read_text(encoding='utf-8')
v = time.strftime('%Y%m%d%H%M%S', time.gmtime())
s2 = re.sub(r'((?:src|href)="(?:js|css)/[^"?]+\.(?:js|css))(?:\?v=\w+)?"', lambda m: m.group(1) + '?v=' + v + '"', s)
p.write_text(s2, encoding='utf-8')
print('version', v, '(', len(re.findall(r'\?v=' + v, s2)), 'files )')
