# Make the small gacha pictures: assets/gacha/weapon_*.webp (the full-size art, already transparent)
# -> assets/gacha/cut_*.webp (cropped to the visible part, max 640 px, for the iPad).
# Needs Pillow:  python3 tools/gacha/cutout.py
import sys, os
from PIL import Image
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'gacha')
NAMES = ['rifle', 'shotgun', 'railgun', 'katana', 'hammer', 'bomb']
MAXW = 640
for name in (sys.argv[1:] or NAMES):
    img = Image.open(os.path.join(ROOT, 'weapon_%s.webp' % name)).convert('RGBA')
    bb = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    if bb: img = img.crop(bb)
    s = min(1.0, MAXW / max(img.width, img.height))
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    p = os.path.join(ROOT, 'cut_%s.webp' % name); img.save(p, 'WEBP', quality=80, method=6)
    print(os.path.normpath(p), img.size, os.path.getsize(p))
