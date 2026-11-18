# Make the small gacha pictures: assets/gacha/weapon_*.webp (the full-size art, already transparent)
# -> assets/gacha/cut_*.webp (cropped to the visible part, max 640 px, for the iPad).
# Art with no transparency (white background) gets the background removed: near-white areas that touch the edge,
# or small enclosed ones (chain links, gaps), become transparent; big white faces (the shield) stay.
# Needs Pillow + numpy:  python3 tools/gacha/cutout.py
import sys, os
from PIL import Image, ImageFilter
import numpy as np
from collections import deque

def drop_white(img, hole=1500, thr=252):
    # img: RGBA, already resized. Returns img with the white background made transparent (soft edge).
    a = np.array(img); h, w = a.shape[:2]
    white = a[:, :, :3].min(axis=2) >= thr
    seen = np.zeros((h, w), bool); clear = np.zeros((h, w), bool)
    for sy in range(h):
        for sx in range(w):
            if not white[sy, sx] or seen[sy, sx]: continue
            comp = []; q = deque([(sy, sx)]); seen[sy, sx] = True; edge = False
            while q:
                y, x = q.popleft(); comp.append((y, x))
                if y == 0 or x == 0 or y == h - 1 or x == w - 1: edge = True
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and white[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True; q.append((ny, nx))
            if edge or len(comp) < hole:
                for y, x in comp: clear[y, x] = True
    m = Image.fromarray((~clear * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    img = img.copy(); img.putalpha(m); return img
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'gacha')
NAMES = ['rifle', 'shotgun', 'railgun', 'katana', 'hammer', 'bomb', 'flail', 'spear', 'bow', 'shield', 'staff', 'pistol', 'glove']
MAXW = 640
for name in (sys.argv[1:] or NAMES):
    img = Image.open(os.path.join(ROOT, 'weapon_%s.webp' % name)).convert('RGBA')
    if img.getchannel('A').getextrema()[0] == 255:  # opaque art: shrink first (the cleanup is slow), then drop the white
        s = min(1.0, 900 / max(img.width, img.height))
        img = drop_white(img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS), {'bow': 10**9, 'shield': 0}.get(name, 1500))
    bb = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    if bb: img = img.crop(bb)
    s = min(1.0, MAXW / max(img.width, img.height))
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    p = os.path.join(ROOT, 'cut_%s.webp' % name); img.save(p, 'WEBP', quality=80, method=6)
    print(os.path.normpath(p), img.size, os.path.getsize(p))
