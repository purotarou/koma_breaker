"""Make the skin mask of the final boss (blender/boss_shiro_mask.png) for tools/blender_export_boss.py.

White = skin whose colour the game changes per form (kb_mat 13/14 in js/gfx.js); black = keep the texture
(sash, loincloth, cuffs, horns, eyes, mouth, the red marks).
Inputs (both 2048 px, in the UV layout of SN_Boss in blender/boss_shiro.blend):
  blender/boss_shiro_tex.png     the baked colour
  blender/boss_shiro_region.png  a bake of hand-painted regions: R = body skin, G = horns (the near-white part of the horns stays)
Run from the repository root (needs Pillow + numpy):
  python3 tools/boss_shiro_mask.py [preview_dir]
With preview_dir it also writes prev_red.png / prev_black.png there (the texture recoloured like the second form) to check the mask.
"""
import sys
from PIL import Image
import numpy as np
t = np.asarray(Image.open('blender/boss_shiro_tex.png').convert('RGB')).astype(np.float32) / 255
r = np.asarray(Image.open('blender/boss_shiro_region.png').convert('RGB')).astype(np.float32) / 255
lum = t.mean(2); mx = t.max(2); mn = t.min(2); sat = (mx - mn) / np.maximum(mx, 1e-3)
def ss(a, b, x):
    u = np.clip((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u)
# skin = inside the skin region, not too dark (outlines, mouth) and not saturated (the red marks)
m = r[..., 0] * ss(0.10, 0.26, lum) * (1 - ss(0.15, 0.32, sat))
m = np.where(r[..., 1] > 0.5, m * (1 - ss(0.86, 0.92, lum)), m)
Image.fromarray((m * 255).astype(np.uint8)).save('blender/boss_shiro_mask.png')
if len(sys.argv) > 1:
    for n, c in [('red', (0.86, 0.1, 0.1)), ('black', (0.2, 0.2, 0.22))]:
        L = np.clip(lum * 1.15, 0.3, 1.15)[..., None]
        o = t * (1 - m[..., None]) + np.array(c)[None, None, :] * L * m[..., None]
        Image.fromarray((np.clip(o, 0, 1) * 255).astype(np.uint8)).save(sys.argv[1] + '/prev_%s.png' % n)
