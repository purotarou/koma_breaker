# 杖 (staff): gold ring head with a 4-point star + teal gem, crescent moon (navy inlay), gold rings and a
# paper charm (ofuda) hanging on a navy cord; cream shaft wound with a navy/gold ribbon; gold ferrule.
# Picture up = +Y (tip), picture right = +Z, plates face +-X. Origin = grip (picture row GY).
c, root = weapon_scene('Staff')
a = ref(REFDIR + 'weapon_staff.webp'); Mk = masks(a)
gold = M('wpn_gold', (0.90, 0.70, 0.32), gloss=0.7, rim=0.3)
navy = M('wpn_navy', (0.13, 0.16, 0.34), gloss=0.15)
cream = M('wpn_staff_cream', (0.95, 0.92, 0.84), gloss=0.35)
paper = M('wpn_ofuda', (0.97, 0.94, 0.86), flags=0)
gem = M('wpn_gem_teal', (0.25, 0.88, 0.78), gloss=0.9, rim=0.4)
s = 0.0011; OX, GY = 511, 1000
F = lambda x, y: ((GY - y) * s, (x - OX) * s)
Hh, Ww = a.shape[:2]
col = np.arange(Ww)[None, :].repeat(Hh, 0); rowi = np.arange(Hh)[:, None].repeat(Ww, 1)
h, sat, v = hsv(a[:, :, :3])
obj = erode(dilate(clean_mask(Mk['obj'], 1), 2), 2)
goldm = Mk['gold'] | ((h > 30) & (h < 66) & (sat > 0.3) & (v > 0.7))

# ---- head plates ----
ring_px = ((680, 282, 34), (652, 362, 32))
excl = ((col > 560) & (rowi > 372))
for (px, py, rp) in ring_px: excl |= ((col - px) ** 2 + (rowi - py) ** 2 < rp * rp) & (rowi > 250)
RC, RI, RO = (510, 226), 139, 170          # the big ring of the head (picture px)
dd = (col - RC[0]) ** 2 + (rowi - RC[1]) ** 2
arcfix = excl & (dd >= RI * RI) & (dd <= RO * RO) & (rowi < 372)
head = ((obj & ~excl) | arcfix) & (rowi < 548)
neck = head & (rowi > 292) & (col > 440) & (col < 585)
plate = head & ~neck
TH, TN = 0.011, 0.016
finish('Staff_Head', ext(pix(trace(plate, eps=0.8, minarea=30, sm=2), F), -TH, TH, bevel=0.0035, seg=2), [gold], c, smooth=35, parent=root)
finish('Staff_Neck', ext(pix(trace(neck, eps=0.8, minarea=30, sm=2), F), -TN, TN, bevel=0.005, seg=2), [gold], c, smooth=35, parent=root)
nav = erode(dilate(clean_mask((Mk['navy'] | Mk['blue']) & ~goldm & erode(head, 2), 1), 2), 2) & erode(head, 2)
navP = nav & ~neck; navN = nav & neck
NB = bmesh.new()
if navP.any(): merge(NB, ext(pix(trace(navP, eps=0.8, minarea=20, sm=2), F), -TH - 0.0012, TH + 0.0012))
if navN.any(): merge(NB, ext(pix(trace(navN, eps=0.8, minarea=20, sm=2), F), -TN - 0.0012, TN + 0.0012))
finish('Staff_Inlay', NB, [navy], c, smooth=35, parent=root)
gm = fill_holes(dilate(clean_mask(Mk['cyan'] & head, 1), 2))
G = bmesh.new()
for lp in trace(gm, eps=1.0, minarea=60, sm=1):
    merge(G, raise_poly(pix([lp], F)[0], TH + 0.0005, TH + 0.016))
finish('Staff_Gem', G, [gem], c, smooth=0, parent=root)

# ---- shaft, collars, ferrule (turned, read from the picture) ----
cls = lambda r, xa, xb: major(Mk, ['gold', 'light', 'navy'], r, xa, xb)
pr = lathe_prof(obj, cls, 532, 1517, 450, 566, step=3)
SH = [(0, pr[-1][1] + 2, 0)]
for rp, row, k, cx in reversed(pr):
    if 562 < row < 1272: k = 1          # the shaft itself is cream (the ribbon is modelled separately)
    if row >= 1325: k = 0 if k != 2 else 2
    SH.append((rp, row, k))
SH.append((0, pr[0][1] - 1, 0))
SH = SH[:1] + prof_simplify(SH[1:-1], 0.8) + SH[-1:]
prof = [(r * s, (GY - row) * s, k) for r, row, k in SH]
L = lathe(prof, 24); xf(L, RX(-math.pi / 2))
finish('Staff_Shaft', L, [gold, cream, navy], c, smooth=40, parent=root)
rr = [((GY - row) * s, r * s) for r, row, k in SH]
def rz(z):
    for (z0, r0), (z1, r1) in zip(rr, rr[1:]):
        if min(z0, z1) <= z <= max(z0, z1) and z0 != z1: return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
    return 0.0
z0, z1 = (GY - 1268) * s, (GY - 566) * s
RB = helix_band(rz, z0, z1, 3.4, 0.021, 0.0022, phase=0.6, n=150); xf(RB, RX(-math.pi / 2))
finish('Staff_Ribbon', RB, [navy], c, smooth=50, parent=root)
GB = bmesh.new()
for dz in (-0.0125, 0.0125):
    merge(GB, helix_band(lambda z: rz(z) + 0.0004, z0 + dz, z1 + dz, 3.4, 0.0042, 0.0026, phase=0.6, n=150))
xf(GB, RX(-math.pi / 2)); finish('Staff_Ribbon_Gold', GB, [gold], c, smooth=50, parent=root)

# ---- gold rings hooked through the big ring: edge-on from the front (X), round from the side (Z) ----
RG = bmesh.new(); Rr = 0.027
for (px, py) in ((680, 282), (652, 362)):
    dx, dy = px - RC[0], py - RC[1]; l = math.hypot(dx, dy); rm = (RI + RO) / 2
    ax, ay = RC[0] + dx / l * rm, RC[1] + dy / l * rm      # point on the middle of the arc
    y, z = F(ax, ay); y -= Rr * 0.62                          # hang below it so the top of the ring passes through the arc
    rg = tube([(Rr * math.cos(2 * math.pi * i / 24), y + Rr * math.sin(2 * math.pi * i / 24), z) for i in range(24)], 0.0045, 8, closed=True)
    merge(RG, rg)
finish('Staff_Rings', RG, [gold], c, smooth=60, parent=root)

# ---- cord + ofuda ----
pts = [(0.0,) + F(x, y) for x, y in bez((566, 338), (584, 372), (600, 420), (605, 452), 12)]
paperm = Mk['light'] & (col > 560) & (rowi > 440)
ys_, xs_ = np.nonzero(paperm)
x0p, x1p, y0p, y1p = xs_.min(), xs_.max(), ys_.min(), ys_.max()
pts.append((0.0,) + F((x0p + x1p) / 2 + 2, y0p + 10))
finish('Staff_Cord', tube(pts, 0.003, 6), [navy], c, smooth=60, parent=root)
q = [F(x0p, y0p), F(x1p, y0p), F(x1p, y1p), F(x0p, y1p)]
finish('Staff_Ofuda', slab(q, -0.0016, 0.0016, bevel=0.0005), [paper], c, smooth=30, parent=root)
glyph = clean_mask(Mk['dark'] & (col > x0p + 14) & (col < x1p - 14) & (rowi > y0p + 8) & (rowi < y1p - 8), 1)
gmark = clean_mask(goldm & (col > x0p + 3) & (col < x1p - 3) & (rowi > y0p + 3) & (rowi < y1p - 3), 1)
finish('Staff_Ofuda_Ink', cap(pix(trace(glyph, eps=0.7, minarea=8, sm=1), F), 0.0017, 1, both=True), [navy], c, smooth=0, parent=root)
finish('Staff_Ofuda_Gold', cap(pix(trace(gmark, eps=0.7, minarea=8, sm=1), F), 0.0017, 1, both=True), [gold], c, smooth=0, parent=root)
