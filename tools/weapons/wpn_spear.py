# 槍 (spear): white faceted blade with a navy lightning groove edged in gold, gold guard with hooked wings
# (right wing navy-inlaid) and a teal gem, cream shaft wound with a navy/gold spiral, gold butt.
# Picture up = +Y (tip), picture right = +Z, blade faces +-X. Origin = grip (picture row GY).
c, root = weapon_scene('Spear')
a = ref(REFDIR + 'weapon_spear.webp'); Mk = masks(a)
gold = M('wpn_gold', (0.90, 0.70, 0.32), gloss=0.7, rim=0.3)
navy = M('wpn_navy', (0.13, 0.16, 0.34), gloss=0.15)
cream = M('wpn_staff_cream', (0.95, 0.92, 0.84), gloss=0.35)
steel = M('wpn_blade_white', (0.93, 0.95, 0.99), gloss=0.9, rim=0.4)
gem = M('wpn_gem_teal', (0.25, 0.88, 0.78), gloss=0.9, rim=0.4)
s = 0.00145; OX, GY = 514, 1050
F = lambda x, y: ((GY - y) * s, (x - OX) * s)
Hh, Ww = a.shape[:2]
col = np.arange(Ww)[None, :].repeat(Hh, 0); rowi = np.arange(Hh)[:, None].repeat(Ww, 1)
h, sat, v = hsv(a[:, :, :3])
obj = erode(dilate(clean_mask(Mk['obj'], 1), 2), 2)
goldm = Mk['gold'] | ((h > 30) & (h < 66) & (sat > 0.3) & (v > 0.7))
navm = Mk['navy'] | Mk['blue']

# ---- blade ----
BROW = 292
bl = fill_holes(obj) & (rowi < BROW)
outline = pix(trace(bl, eps=1.3, sm=3), F)
finish('Spear_Blade', blade_surf(outline, outline, 0.0095, 0.030, 0.0105), [steel], c, smooth=25, parent=root)
bolt = erode(dilate(clean_mask((goldm | navm) & erode(bl, 4), 1), 3), 3)
boltn = clean_mask(navm & erode(bl, 4), 1)
finish('Spear_Bolt_Gold', blade_surf(pix(trace(bolt, eps=1.0, minarea=20, sm=3), F), outline, 0.0095, 0.030, 0.0105, lift=0.0007), [gold], c, smooth=25, parent=root)
finish('Spear_Bolt', blade_surf(pix(trace(boltn, eps=1.0, minarea=20, sm=3), F), outline, 0.0095, 0.030, 0.0105, lift=0.0013), [navy], c, smooth=25, parent=root)

# ---- guard ----
gz = (rowi > 255) & (rowi < 404)
guard = clean_mask(obj & gz & ~(bl & ~dilate(goldm | navm, 2)), 2)
TG = 0.013
finish('Spear_Guard', ext(pix(trace(guard, eps=1.2, minarea=40, sm=3), F), -TG, TG, bevel=0.0045, seg=2), [gold], c, smooth=35, parent=root)
gn = erode(dilate(clean_mask(navm & erode(guard, 3), 1), 1), 1)
finish('Spear_Guard_Inlay', ext(pix(trace(gn, eps=0.8, minarea=20, sm=2), F), -TG - 0.0012, TG + 0.0012), [navy], c, smooth=35, parent=root)
gm = fill_holes(dilate(clean_mask(Mk['cyan'] & gz, 1), 2))
gy, gx = np.nonzero(gm); gc = F((gx.min() + gx.max()) / 2, (gy.min() + gy.max()) / 2)
hh, hw = (gy.max() - gy.min()) / 2 * s, (gx.max() - gx.min()) / 2 * s
G = bmesh.new()
for sg in (1, -1):
    merge(G, gem_rhomb(T(0, gc[0], gc[1]) @ RY(sg * math.pi / 2), hh, hw, 0.011, base=TG - 0.002))
finish('Spear_Gem', G, [gem], c, smooth=0, parent=root)

# ---- shaft / collars / butt (turned) ----
cls = lambda r, xa, xb: major(Mk, ['gold', 'light', 'navy'], r, xa, xb)
pr = lathe_prof(obj, cls, 398, 1515, 470, 560, step=3)
SH = [(0, pr[-1][1] + 2, 0)]
for rp, row, k, cx in reversed(pr):
    if 436 < row < 1395: k = 1
    SH.append((rp, row, k))
SH.append((0, pr[0][1] - 1, 0))
SH = SH[:1] + prof_simplify(SH[1:-1], 0.8) + SH[-1:]
prof = [(r * s, (GY - row) * s, k) for r, row, k in SH]
L = lathe(prof, 24); xf(L, RX(-math.pi / 2))
finish('Spear_Shaft', L, [gold, cream, navy], c, smooth=40, parent=root)
rr = [((GY - row) * s, r * s) for r, row, k in SH]
def rz(z):
    for (z0, r0), (z1, r1) in zip(rr, rr[1:]):
        if min(z0, z1) <= z <= max(z0, z1) and z0 != z1: return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
    return 0.0
z0, z1 = (GY - 1392) * s, (GY - 440) * s
RB = helix_band(rz, z0, z1, 9.5, 0.013, 0.0018, phase=0.3, n=200); xf(RB, RX(-math.pi / 2))
finish('Spear_Spiral', RB, [navy], c, smooth=50, parent=root)
GB = bmesh.new()
for dz in (-0.0078, 0.0078):
    merge(GB, helix_band(lambda z: rz(z) + 0.0003, z0 + dz, z1 + dz, 9.5, 0.0028, 0.0022, phase=0.3, n=200))
xf(GB, RX(-math.pi / 2)); finish('Spear_Spiral_Gold', GB, [gold], c, smooth=50, parent=root)
