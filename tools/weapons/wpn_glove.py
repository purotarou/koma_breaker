# グローブ（左右一組） from assets/gacha/weapon_glove.webp (the picture shows the right glove from its thumb side,
# front to the left). Shape after real boxing gloves: a long padded mitt whose back rises from the cuff to the
# knuckles, fingers curled round the front into the palm, a fat thumb on the inner lower side next to the cuff.
# Right glove: fist toward +Y, back of the hand up (+Z), thumb side = -X, cuff opening toward -Y.
# The left glove is the right one mirrored in X. Each hand's meshes are local to the hand (origin inside the fist)
# and parented to an empty (Glove_R / Glove_L) that only places them side by side in the scene.
import numpy as np
from mathutils.bvhtree import BVHTree
c, root = weapon_scene('Glove')
for o in list(bpy.data.objects):
    if o.name.startswith('Glove') and o.users_collection and any(cc.name.startswith('Wpn_Glove') for cc in o.users_collection):
        bpy.data.objects.remove(o)
for sub in ('Wpn_Glove_R', 'Wpn_Glove_L'):
    cs = coll(sub)
    if cs.name not in c.children: c.children.link(cs)
cR, cL = bpy.data.collections['Wpn_Glove_R'], bpy.data.collections['Wpn_Glove_L']
red = M('wpn_glove_red', (0.88, 0.10, 0.10), gloss=0.6, rim=0.3)
redd = M('wpn_glove_strap', (0.78, 0.09, 0.10), gloss=0.45, rim=0.2)
white = M('wpn_glove_white', (0.97, 0.96, 0.94), gloss=0.3, rim=0.2)
inner = M('wpn_glove_inner', (0.34, 0.05, 0.06))
gold = M('wpn_gold_warm', (0.97, 0.74, 0.22), gloss=0.7, rim=0.3)
gem = M('wpn_gem_cyan', (0.36, 0.88, 0.96), gloss=1.0, rim=0.5)
hole = bpy.data.materials['wpn_bore']
PART = []   # (name, bmesh, mats, smooth angle or 0 = all smooth)
def add(name, bm, mats, smooth=40): PART.append((name, bm, mats, smooth))

def cubesphere(n):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=2)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges, cuts=n - 1, use_grid_fill=True)
    for v in bm.verts: v.co = v.co.normalized()
    return bm
sstep = lambda e0, e1, x: (lambda t: t * t * (3 - 2 * t))(max(0.0, min(1.0, (x - e0) / (e1 - e0))))

# picture (1024px) -> model, for the thumb-side view: front of the fist x=95 -> y=0.33, fist middle row 535 -> z=0
PY = lambda x: 0.33 - (x - 95) * 0.000404
PZ = lambda y: (535 - y) * 0.000375

# ---- the mitt ----
C = Vector((0, 0.215, 0.0))
def body_bm():
    bm = cubesphere(26)
    for v in bm.verts:
        d = v.co.copy(); dx, dy, dz = d
        bk = max(0.0, -dy)
        a = 0.088 * (1 - 0.32 * bk ** 1.7)
        b = 0.115 if dy > 0 else 0.150
        cc = 0.101 * (1 - 0.32 * bk ** 1.7)
        if dz < 0: cc *= 1.0 - 0.06 * bk                      # palm side a little flatter toward the wrist
        p = 2.35
        q = d / (abs(dx / a) ** p + abs(dy / b) ** p + abs(dz / cc) ** p) ** (1 / p)
        if dz > 0: q.z += dz * (0.010 * max(0, dy) - 0.010 * bk)   # back of the hand rises toward the knuckles
        # curled fingers: the front-bottom rolls out a little, the palm behind the fingertips is pulled in
        ang = math.atan2(dz, dy)                               # 0 = front, -pi/2 = palm, pi/2 = back of hand
        side = max(0.0, 1 - abs(dx) * 1.35) ** 0.6
        q.y += 0.010 * math.exp(-((ang + 0.55) / 0.45) ** 2)
        q -= d * 0.010 * math.exp(-((ang + 1.30) / 0.13) ** 2) * side        # fingertip seam on the palm
        q -= d * 0.004 * math.exp(-((ang + 0.20) / 0.10) ** 2) * side        # soft knuckle fold on the front
        v.co = C + q
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
bb = body_bm(); bvh = BVHTree.FromBMesh(bb)
add('Body', bb, [red], 0)

# ---- thumb: bent padded tube with a fat round end, on the inner lower side next to the cuff ----
def sausage(P0, P1, P2, rf, n=14, flat=0.86, pe=2.8):
    """bent padded tube along the quadratic curve P0-P1-P2, radius rf(t), blunt rounded ends."""
    bm = cubesphere(n)
    Bz = lambda t: P0 * (1 - t) ** 2 + P1 * 2 * t * (1 - t) + P2 * t * t
    for v in bm.verts:
        d = v.co.copy(); rxz = math.hypot(d.x, d.z)
        q = d / (rxz ** pe + abs(d.y) ** pe) ** (1 / pe)
        t = (q.y + 1) / 2
        p = Bz(t); tg = (Bz(min(1, t + 0.01)) - Bz(max(0, t - 0.01))).normalized()
        nx = tg.cross(Vector((0, 0, 1))).normalized(); nz = nx.cross(tg).normalized()
        v.co = p + (nx * q.x + nz * q.z * flat) * rf(t)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
TH0, TH1, TH2 = Vector((-0.030, 0.098, -0.032)), Vector((-0.064, 0.116, -0.070)), Vector((-0.056, 0.185, -0.072))
add('Thumb', sausage(TH0, TH1, TH2, lambda t: 0.038 + 0.016 * sstep(0.15, 0.7, t)), [red], 0)

# ---- cuff (turned along Y; 0 white, 1 gold, 2 red, 3 dark inside) ----
CZ = 0.012
CUFF = T(0, 0, CZ) @ Matrix.Diagonal((1.0, 1, 0.94, 1)) @ RX(-math.pi / 2)
prof = [(0, 0.040, 3), (0.054, 0.040, 3), (0.054, -0.020, 0), (0.057, -0.029, 0), (0.063, -0.034, 0), (0.069, -0.033, 0),
        (0.0725, -0.028, 0), (0.0735, -0.020, 1), (0.0735, -0.014, 0), (0.0725, -0.002, 1), (0.0725, 0.004, 2), (0.0695, 0.008, 2),
        (0.0695, 0.074, 1), (0.0715, 0.076, 1), (0.0715, 0.081, 0), (0.0725, 0.084, 0), (0.0725, 0.103, 1), (0.0735, 0.105, 1),
        (0.0735, 0.111, 1), (0.066, 0.118, 0), (0.030, 0.124, 0)]
add('Cuff', xf(lathe(prof, 56, cap=False), CUFF), [white, gold, red, inner])
SY0, SY1 = 0.020, 0.064                                       # strap edges along the cuff
add('Strap', xf(ring([(0.069, SY0), (0.0735, SY0 + 0.001), (0.0755, SY0 + 0.005), (0.0755, SY1 - 0.005), (0.0735, SY1 - 0.001), (0.069, SY1)], 56), CUFF), [redd])
SW = bmesh.new()
for y0 in (SY0 + 0.0055, SY1 - 0.0055):
    merge(SW, xf(ring([(0.0753, y0 - 0.0007), (0.0761, y0 - 0.0007), (0.0761, y0 + 0.0007), (0.0753, y0 + 0.0007)], 56), CUFF))
add('Stitch', SW, [inner])

# parts laid on the cuff are built flat with x = height above radius R, y = along the cuff, z = arc length,
# then wrapped: angle th = th0 + z/R measured from the thumb side (-X) toward the back of the hand (+Z)
TH_B = math.radians(22)        # the buckle sits on the thumb side, up toward the back of the hand
def wrap(bm, R, th0):
    for v in bm.verts:
        h, y, u = v.co.x, v.co.y, v.co.z
        th = th0 + u / R; r = R + h
        v.co = Vector((-r * math.cos(th), y, CZ + r * math.sin(th) * 0.94))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
def rrect(y0, y1, z0, z1, r, n=4):
    pts = []
    for cy, cz, a0 in ((y1 - r, z1 - r, 0), (y0 + r, z1 - r, 90), (y0 + r, z0 + r, 180), (y1 - r, z0 + r, 270)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n); pts.append((cy + r * math.cos(a), cz + r * math.sin(a)))
    return pts
def cutz(bm, z0, z1, n=14):
    return drape(bm, lambda y, z: 0.0, 0, zs=[z0 + (z1 - z0) * i / n for i in range(1, n)])
RB = 0.0755
YM = (SY0 + SY1) / 2; TW = 0.040
# strap tongue: from under the buckle down the thumb side, rounded end, two punched holes, stitched edge
tg = ext([rrect(YM - TW / 2, YM + TW / 2, -0.085, 0.006, 0.016, 6)], 0.0, 0.0036, bevel=0.0012)
add('Tongue', wrap(cutz(tg, -0.085, 0.006, 18), RB, TH_B), [redd])
HB = bmesh.new()
for u in (-0.040, -0.062):
    hb = lathe([(0, 0, 0), (0.0034, 0, 0), (0.0034, 0.0012, 0), (0, 0.0012, 0)], 12); xf(hb, T(0.0030, YM, u) @ RY(math.pi / 2)); merge(HB, hb)
add('Holes', wrap(HB, RB, TH_B), [hole])
lp = rrect(YM - TW / 2 + 0.004, YM + TW / 2 - 0.004, -0.081, -0.002, 0.012, 6)
TS = ext([ribbon(lp[:-1] + lp[:1], 0.0012)], 0.0036, 0.0042)
add('TongueStitch', wrap(cutz(TS, -0.081, -0.002, 16), RB, TH_B), [inner])
# buckle: rounded frame across the strap, middle bar and prong
bo = rrect(SY0 - 0.006, SY1 + 0.006, -0.010, 0.046, 0.007); bi = rrect(SY0 + 0.0015, SY1 - 0.0015, -0.002, 0.038, 0.004)
B = ext([bo, bi], 0.0035, 0.0095, bevel=0.0018, seg=2)
merge(B, ext([rrect(SY0 - 0.003, SY1 + 0.003, 0.016, 0.024, 0.003)], 0.003, 0.0085, bevel=0.0012))
merge(B, ext([rrect(YM - 0.003, YM + 0.003, -0.004, 0.022, 0.0025)], 0.0065, 0.0115, bevel=0.0012))
add('Buckle', wrap(cutz(B, -0.010, 0.046, 16), RB, TH_B), [gold], 35)

# ---- knuckle plate wrapped round the front of the fist ----
# horizontal arc length s round the mitt at each height: s=0 at the front, + toward the thumb side
LV = np.linspace(-0.10, 0.10, 41); PH = np.radians(np.arange(-40.0, 270.5, 0.5))
def ray(ph, z):
    d = Vector((math.cos(ph), math.sin(ph), 0.0)); o = Vector((C.x, C.y, z)) + d * 0.5
    loc, nrm, _, _ = bvh.ray_cast(o, -d, 1.0)
    return loc, nrm
SS, YY = [], []
i90 = int(np.argmin(abs(PH - math.pi / 2)))
for z in LV:
    P = [ray(float(ph), float(z))[0] for ph in PH]
    P = [p if p is not None else Vector((C.x, C.y, float(z))) for p in P]
    seg = np.array([0.0] + [(P[i] - P[i - 1]).length for i in range(1, len(P))]).cumsum()
    SS.append(seg - seg[i90]); YY.append(np.array([p.y for p in P]))
def _lv(z):
    f = (z - LV[0]) / (LV[1] - LV[0]); i = int(max(0, min(len(LV) - 2, math.floor(f)))); return i, f - i
def s2phi(s, z):
    i, t = _lv(z)
    return float(np.interp(s, SS[i], PH)) * (1 - t) + float(np.interp(s, SS[i + 1], PH)) * t
def side2s(y, z):   # a point on the thumb side, by its y as seen in the side view
    i, t = _lv(z); k = PH >= math.pi / 2
    f = lambda j: float(np.interp(y, YY[j][k][::-1], SS[j][k][::-1]))
    return f(i) * (1 - t) + f(i + 1) * t
def hit(s, z): return ray(s2phi(s, z), z)
SP = lambda x, y: (side2s(PY(x), PZ(y)), PZ(y))
outline = [SP(472, 555), SP(418, 476), SP(300, 463), SP(190, 446), SP(126, 410), (0.0, 0.056), (-0.030, 0.054),
           (-0.044, 0.046), (-0.050, 0.030), (-0.050, 0.000), (-0.044, -0.012), (-0.030, -0.018), (0.0, -0.018),
           SP(118, 574), SP(165, 606), SP(280, 660), SP(425, 642)]
pts, tris = tess([outline])
pm = bmesh.new(); V = [pm.verts.new((u, z, 0)) for u, z in pts]
for t in tris:
    try: pm.faces.new([V[i] for i in t])
    except ValueError: pass
for _ in range(4):
    bmesh.ops.subdivide_edges(pm, edges=list(pm.edges), cuts=1, use_grid_fill=True)
    bmesh.ops.triangulate(pm, faces=list(pm.faces))
bmesh.ops.beautify_fill(pm, faces=list(pm.faces), edges=list(pm.edges))
TOP, BOT = 0.0075, -0.002
plate = bmesh.new(); top = {}; bot = {}; pm.verts.index_update()
for v in pm.verts:
    p, n = hit(v.co.x, v.co.y)
    top[v.index] = plate.verts.new(p + n * TOP); bot[v.index] = plate.verts.new(p + n * BOT)
tf = []
for f in pm.faces:
    tf.append(plate.faces.new([top[v.index] for v in f.verts])); plate.faces.new([bot[v.index] for v in reversed(f.verts)])
for e in pm.edges:
    if len(e.link_faces) == 1:
        a, b = e.verts; plate.faces.new((top[a.index], top[b.index], bot[b.index], bot[a.index]))
bmesh.ops.recalc_face_normals(plate, faces=plate.faces); pm.free()
bmesh.ops.inset_region(plate, faces=tf, thickness=0.0034, depth=-0.0015, use_even_offset=False, use_relative_offset=False)
add('Plate', plate, [gold])
def frame_at(s, z, lift):
    p, n = hit(s, z)
    return T(*(p + n * lift)) @ n.to_track_quat('Z', 'Y').to_matrix().to_4x4()
S = bmesh.new()
for s, z in [SP(372, 522), SP(372, 605), SP(268, 622), SP(167, 597), SP(130, 452), (0.0, 0.040), (0.0, -0.004),
             (-0.032, 0.040), (-0.032, -0.004)]:
    s_ = uvsphere(0.0066, 16, 8, 1, 1, 0.62); xf(s_, frame_at(s, z, TOP - 0.0005)); merge(S, s_)
add('Studs', S, [gold], 50)
BZ_, GM_ = bmesh.new(), bmesh.new()
gs, gz = SP(212, 545)
gem_on(frame_at(gs, gz, TOP - 0.003), 0.0160, 0.62, 0.0, 0.0160, 0.0215, 0.0062, BZ_, GM_)
add('Bezel', BZ_, [gold]); add('Gem', GM_, [gem], 60)

# ---- objects: right hand, then the mirrored left hand ----
HAND = T(0, -0.17, 0)          # origin = the hand inside the fist
def build(side, col, sx, px):
    par = bpy.data.objects.new('Glove_' + side, None); par.empty_display_size = 0.04; col.objects.link(par)
    par.parent = root; par.location = (px, 0, 0)
    for name, bm, mats, sm in PART:
        b2 = bm.copy(); xf(b2, Matrix.Diagonal((sx, 1, 1, 1)) @ HAND)
        if sx < 0: bmesh.ops.reverse_faces(b2, faces=b2.faces)
        o = finish('Glove%s_%s' % (side, name), b2, mats, col, smooth=sm, parent=par)
        if not sm: o.data.shade_smooth()
build('R', cR, 1, 0.16)
build('L', cL, -1, -0.16)
for _, bm, _, _ in PART: bm.free()
result = {'R': len(cR.objects), 'L': len(cL.objects)}
