# 弓: navy recurve bow, gold bands/tips, gold riser cage around a cyan gem, cord-wrapped grip,
# cream cloud + wave decals on both limbs, glowing cyan string.
# Picture -> model with PX: picture left (the bow's back) = +Y (forward), up = +Z, string toward -Y. Origin = grip.
c, root = weapon_scene('Bow')
a = ref(REFDIR + 'weapon_bow.webp'); Mk = masks(a)
navy = M('wpn_bow_navy', (0.16, 0.24, 0.52), kb_mat=2, gloss=0.25)
wrapc = M('wpn_bow_wrap', (0.14, 0.18, 0.40), gloss=0.1)
cord = M('wpn_bow_cord', (0.24, 0.31, 0.60), gloss=0.1)
gold = M('wpn_gold', (0.90, 0.70, 0.32), gloss=0.7, rim=0.3)
cream = M('wpn_bow_cream', (0.96, 0.90, 0.74))
glow = M('wpn_string_glow', (0.45, 0.95, 1.0), flags=1)
gem = bpy.data.materials['wpn_gem']
s = 0.001; OX, OY = 405, 780
F = lambda x, y: ((OX - x) * s, (OY - y) * s)
H, W = a.shape[:2]
col = np.arange(W)[None, :].repeat(H, 0); rowi = np.arange(H)[:, None].repeat(W, 1)
h, sat, v = hsv(a[:, :, :3])

string = dilate(Mk['cyan'] & (col > 560), 2)
body = fill_holes(clean_mask(Mk['obj'] & ~string, 2))
goldm = erode(dilate(clean_mask(Mk['gold'] | ((h > 30) & (h < 66) & (sat > 0.3) & (v > 0.7)), 1), 2), 2) & body
gemm = fill_holes(dilate(clean_mask(Mk['cyan'] & (col < 500), 1), 2))
riser = (rowi > 495) & (rowi < 985)
gold_l = dilate(goldm & ~riser, 4) & dilate(body, 1)          # bands: grown to the limb edge so they wrap it
gold_r = dilate(goldm & riser, 1) & ~gemm
creamm = clean_mask(Mk['light'] & erode(body, 3) & ~dilate(goldm, 2) & ~gemm & ~riser, 1)

TH = 0.016
finish('Bow_Limb', ext(pix(trace(body, eps=0.9, sm=2), F), -TH, TH, bevel=0.0055, seg=2), [navy], c, smooth=40, parent=root)
finish('Bow_Bands', ext(pix(trace(gold_l, eps=0.9, minarea=40, sm=2), F), -TH - 0.0035, TH + 0.0035, bevel=0.003), [gold], c, smooth=40, parent=root)
finish('Bow_Riser', ext(pix(trace(gold_r, eps=0.9, minarea=40, sm=2), F), -TH - 0.009, TH + 0.009, bevel=0.0065, seg=2), [gold], c, smooth=40, parent=root)
finish('Bow_Decal', cap(pix(trace(creamm, eps=0.8, minarea=30, sm=2), F), TH + 0.0008, 1, both=True), [cream], c, smooth=0, parent=root)

# faceted gem on both faces of the riser
G = bmesh.new()
for lp in trace(gemm, eps=1.2, minarea=40, sm=0):
    P = pix([lp], F)[0]; cy = sum(p[0] for p in P) / len(P); cz = sum(p[1] for p in P) / len(P)
    for sg in (1, -1):
        ap = G.verts.new((sg * (TH + 0.018), cy, cz)); V = [G.verts.new((sg * (TH + 0.006), y, z)) for y, z in P]
        for i in range(len(V)): G.faces.new((V[i], V[(i + 1) % len(V)], ap))
        G.faces.new(list(reversed(V)))
bmesh.ops.recalc_face_normals(G, faces=G.faces)
finish('Bow_Gem', G, [gem], c, smooth=0, parent=root)

# grip wrap: rounded block over the grip + two crossing cord helices
gr = [int((goldm[r] & body[r]).sum()) for r in range(H)]
r_lo = 780
while r_lo > 650 and gr[r_lo - 1] < 3: r_lo -= 1
r_hi = 780
while r_hi < 920 and gr[r_hi + 1] < 3: r_hi += 1
r_lo += 4; r_hi -= 4                     # keep clear of the gold fittings
rows = [int(r) for r in np.linspace(r_lo, r_hi, 26)]
ext_ = []
for r in rows:
    xs = np.nonzero(body[r])[0]; xs = xs[xs < 520]
    ext_.append((r, xs.min(), xs.max()))
WR = bmesh.new()
prof = []
for r, x0, x1 in ext_:
    prof.append((F(x1 + 1, r)[0], F(x0 - 1, r)[0], F(0, r)[1]))
yl = [p[0] for p in prof]; yr = [p[1] for p in prof]; zz = [p[2] for p in prof]
wrap_loop = [(yl[i], zz[i]) for i in range(len(zz))] + [(yr[i], zz[i]) for i in reversed(range(len(zz)))]
finish('Bow_Wrap', ext([wrap_loop], -TH - 0.004, TH + 0.004, bevel=0.005, seg=2), [wrapc], c, smooth=40, parent=root)
CD = bmesh.new(); n = 220; turns = 7
for hand in (1, -1):
    pts = []
    for i in range(n + 1):
        t = i / n; k = t * (len(zz) - 1); i0 = min(int(k), len(zz) - 2); f = k - i0
        z = zz[i0] + (zz[i0 + 1] - zz[i0]) * f
        y0 = yl[i0] + (yl[i0 + 1] - yl[i0]) * f; y1 = yr[i0] + (yr[i0 + 1] - yr[i0]) * f
        cy, ry, rx = (y0 + y1) / 2, abs(y0 - y1) / 2 + 0.0012, TH + 0.0055
        ang = hand * 2 * math.pi * turns * t
        pts.append((rx * math.cos(ang), cy + ry * math.sin(ang), z))
    merge(CD, tube(pts, 0.0024, 6))
finish('Bow_Cord', CD, [cord], c, smooth=50, parent=root)

# glowing string between the nocks
sp = np.nonzero(Mk['cyan'] & (col > 560))
ys, xs = sp; top, bot = ys.min(), ys.max(); xm = float(np.median(xs))
p0 = F(xm, top - 4); p1 = F(xm, bot + 4)
finish('Bow_String', tube([(0, p0[0], p0[1]), (0, p1[0], p1[1])], 0.0026, 8), [glow], c, smooth=60, parent=root)
