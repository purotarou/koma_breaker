# グローブ (right hand) from assets/gacha/weapon_glove.webp. The left hand is the same model mirrored in X.
# Fist toward +Y (punch), back of the hand up (+Z), thumb on the inner side (-X), cuff opening toward -Y.
# Body and thumb are deformed cube-spheres (separate meshes, so the crease between them draws an outline);
# the gold knuckle plate, studs and gem are laid onto the body surface by ray casts.
from mathutils.bvhtree import BVHTree
c, root = weapon_scene('Glove')
red = M('wpn_glove_red', (0.88, 0.10, 0.10), gloss=0.6, rim=0.3)
redd = M('wpn_glove_strap', (0.74, 0.08, 0.09), gloss=0.45, rim=0.2)
white = M('wpn_glove_white', (0.97, 0.96, 0.94), gloss=0.3, rim=0.2)
inner = M('wpn_glove_inner', (0.34, 0.05, 0.06))
gold = M('wpn_gold_warm', (0.97, 0.74, 0.22), gloss=0.7, rim=0.3)
gem = M('wpn_gem_cyan', (0.36, 0.88, 0.96), gloss=1.0, rim=0.5)
hole = bpy.data.materials['wpn_bore']

def cubesphere(n):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=2)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges, cuts=n - 1, use_grid_fill=True)
    for v in bm.verts: v.co = v.co.normalized()
    return bm

# ---- fist ----
BC = Vector((0, 0.205, 0.008))
def body_bm():
    bm = cubesphere(20)
    for v in bm.verts:
        d = v.co.copy(); dx, dy, dz = d; back = max(0.0, -dy)
        a = 0.100 * (1 - 0.36 * back ** 1.5); b = 0.118 if dy > 0 else 0.132; cc = 0.098 * (1 - 0.34 * back ** 1.5)
        if dz < 0: cc *= 0.94
        p = 2.25; q = d / (abs(dx / a) ** p + abs(dy / b) ** p + abs(dz / cc) ** p) ** (1 / p)
        q.z += 0.012 * max(0, dy) * (1 if dz > 0 else 0.2)          # knuckles rise toward the front
        ang = math.atan2(dz, dy)
        for a0, dep, wd in ((-0.95, 0.0075, 0.11), (-0.25, 0.0035, 0.09)):   # finger folds across the front
            q -= d * dep * math.exp(-((ang - a0) / wd) ** 2) * max(0, 1 - abs(dx) * 1.6) ** 0.5
        v.co = BC + q
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
def thumb_bm():
    bm = cubesphere(14)
    for v in bm.verts:
        d = v.co.copy(); p = 2.2; a, b, cc = 0.042, 0.088, 0.044
        q = d / (abs(d.x / a) ** p + abs(d.y / b) ** p + abs(d.z / cc) ** p) ** (1 / p)
        t = q.y / 0.088
        q.x += 0.034 * t * t - 0.010
        r = 1 - 0.14 * max(0, t); q.x *= r; q.z *= r
        v.co = q
    xf(bm, T(-0.034, 0.226, -0.072) @ RX(math.radians(16)) @ RZ(math.radians(-12)) @ RY(math.radians(-38)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
bb = body_bm(); bvh = BVHTree.FromBMesh(bb)
finish('Glove_Body', bb, [red], c, smooth=0, parent=root).data.shade_smooth()
finish('Glove_Thumb', thumb_bm(), [red], c, smooth=0, parent=root).data.shade_smooth()

# ---- cuff: turned along Y, elliptical; 0 white, 1 gold, 2 red, 3 dark inside ----
CZ, SXc, SZc = 0.006, 1.0, 0.93
CUFF = T(0, 0, CZ) @ Matrix.Diagonal((SXc, 1, SZc, 1)) @ RX(-math.pi / 2)    # lathe Z -> +Y
prof = [(0, 0.030, 3), (0.047, 0.030, 3), (0.047, -0.020, 0), (0.049, -0.029, 0), (0.054, -0.034, 0), (0.060, -0.034, 0),
        (0.0645, -0.030, 0), (0.066, -0.024, 1), (0.066, -0.019, 0), (0.066, -0.006, 1), (0.066, -0.001, 2), (0.064, 0.004, 2),
        (0.064, 0.078, 0), (0.066, 0.082, 0), (0.066, 0.094, 1), (0.067, 0.096, 1), (0.067, 0.101, 1), (0.060, 0.106, 0), (0.030, 0.112, 0)]
cuff = lathe(prof, 48, cap=False)
finish('Glove_Cuff', xf(cuff, CUFF), [white, gold, red, inner], c, smooth=40, parent=root)
# strap round the cuff
st = ring([(0.0635, 0.017), (0.0685, 0.018), (0.0705, 0.022), (0.0705, 0.058), (0.0685, 0.062), (0.0635, 0.063)], 48)
finish('Glove_Strap', xf(st, CUFF), [redd], c, smooth=40, parent=root)
# stitching: thin raised lines just inside the strap edges
SW = bmesh.new()
for y0 in (0.0235, 0.0565):
    merge(SW, xf(ring([(0.0703, y0 - 0.0008), (0.0712, y0 - 0.0008), (0.0712, y0 + 0.0008), (0.0703, y0 + 0.0008)], 48), CUFF))
finish('Glove_Stitch', SW, [inner], c, smooth=40, parent=root)

# buckle on the outer side (+X): rounded frame bent round the cuff, prong across the middle
RB = 0.0725
def bend_x(bm):
    for v in bm.verts:
        z = v.co.z - CZ
        v.co.x -= RB - math.sqrt(max(1e-6, RB * RB - (z / SZc) ** 2))
    return bm
def rrect(y0, y1, z0, z1, r, n=4):
    pts = []
    for cy, cz, a0 in ((y1 - r, z1 - r, 0), (y0 + r, z1 - r, 90), (y0 + r, z0 + r, 180), (y1 - r, z0 + r, 270)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n); pts.append((cy + r * math.cos(a), cz + r * math.sin(a)))
    return pts
bo = rrect(0.010, 0.070, CZ - 0.034, CZ + 0.034, 0.008); bi = rrect(0.019, 0.061, CZ - 0.025, CZ + 0.025, 0.004)
bk = ext([bo, bi], RB - 0.002, RB + 0.0045, bevel=0.0018, seg=2)
pr = ext([rrect(0.036, 0.044, CZ - 0.002, CZ + 0.031, 0.003)], RB, RB + 0.006, bevel=0.0015)
pr2 = ext([rrect(0.034, 0.046, CZ - 0.030, CZ + 0.030, 0.004)], RB - 0.003, RB + 0.0025, bevel=0.0012)   # bar under the prong
for b in (bk, pr, pr2):
    drape(b, lambda y, z: 0.0, 0, zs=[CZ + k * 0.006 for k in range(-6, 7)])
    bend_x(b)
B = bmesh.new(); merge(B, bk); merge(B, pr); merge(B, pr2)
finish('Glove_Buckle', B, [gold], c, smooth=35, parent=root)
# strap tongue coming out of the buckle (raised piece with a punched hole)
tg = ext([rrect(-0.006, 0.030, CZ - 0.020, CZ + 0.020, 0.010)], RB - 0.004, RB + 0.002, bevel=0.0015)
drape(tg, lambda y, z: 0.0, 0, zs=[CZ + k * 0.005 for k in range(-5, 6)]); bend_x(tg)
finish('Glove_Tongue', tg, [redd], c, smooth=35, parent=root)
hb = lathe([(0, 0, 0), (0.0032, 0, 0), (0.0032, 0.0015, 0), (0, 0.0015, 0)], 12); xf(hb, T(RB + 0.0012, 0.006, CZ) @ RY(math.pi / 2))
finish('Glove_Hole', hb, [hole], c, smooth=40, parent=root)

# ---- knuckle plate wrapped round the fist ----
RP = 0.10   # arc-length scale for the outline (u = angle * RP)
def hit(u, z):
    ph = u / RP; dr = Vector((math.cos(ph), math.sin(ph), 0))
    o = Vector((BC.x, BC.y, z)) + dr * 0.4
    loc, nrm, _, _ = bvh.ray_cast(o, -dr)
    return loc, nrm
deg = lambda a: math.radians(a) * RP
outline = [(-38, 0.004), (-27, 0.036), (2, 0.036), (20, 0.040), (40, 0.046), (60, 0.050), (80, 0.049), (96, 0.044), (106, 0.034), (109, 0.022),
           (109, -0.010), (104, -0.020), (90, -0.026), (70, -0.030), (50, -0.032), (32, -0.036), (20, -0.044), (5, -0.058), (-27, -0.040)]
OL = [(deg(a), z) for a, z in outline]
pts, tris = tess([OL])
pm = bmesh.new(); V = [pm.verts.new((u, z, 0)) for u, z in pts]
for t in tris:
    try: pm.faces.new([V[i] for i in t])
    except ValueError: pass
for _ in range(4):
    bmesh.ops.subdivide_edges(pm, edges=list(pm.edges), cuts=1, use_grid_fill=True)
    bmesh.ops.triangulate(pm, faces=list(pm.faces))
bmesh.ops.beautify_fill(pm, faces=list(pm.faces), edges=list(pm.edges))
TOP, BOT = 0.0075, -0.002
plate = bmesh.new(); top = {}; bot = {}
for v in pm.verts:
    p, n = hit(v.co.x, v.co.y)
    top[v.index] = plate.verts.new(p + n * TOP); bot[v.index] = plate.verts.new(p + n * BOT)
pm.verts.index_update()
tf = []
for f in pm.faces:
    tf.append(plate.faces.new([top[v.index] for v in f.verts])); plate.faces.new([bot[v.index] for v in reversed(f.verts)])
for e in pm.edges:
    if len(e.link_faces) == 1:
        a, b = e.verts
        plate.faces.new((top[a.index], top[b.index], bot[b.index], bot[a.index]))
bmesh.ops.recalc_face_normals(plate, faces=plate.faces)
pm.free()
# raised border: inset the top and sink the middle a little
plate.faces.ensure_lookup_table()
tops = [f for f in plate.faces if f in set(tf)]
bmesh.ops.inset_region(plate, faces=tops, thickness=0.0032, depth=-0.0014, use_even_offset=True)
finish('Glove_Plate', plate, [gold], c, smooth=40, parent=root)
# studs and the gem
def frame_at(u, z, lift):
    p, n = hit(u, z)
    return T(*(p + n * lift)) @ n.to_track_quat('Z', 'Y').to_matrix().to_4x4()
S = bmesh.new()
for a, z in ((-24, 0.020), (-22, -0.026), (2, -0.044), (28, -0.028), (32, 0.034), (56, 0.038), (56, -0.022), (80, 0.038), (80, -0.018),
             (101, 0.026), (101, -0.010)):
    s_ = uvsphere(0.0062, 16, 8, 1, 1, 0.62); xf(s_, frame_at(deg(a), z, TOP - 0.0005)); merge(S, s_)
finish('Glove_Studs', S, [gold], c, smooth=50, parent=root)
BZ_, GM_ = bmesh.new(), bmesh.new()
gem_on(frame_at(deg(9), -0.004, TOP - 0.003), 0.0165, 0.62, 0.0, 0.0165, 0.0235, 0.0062, BZ_, GM_)
finish('Glove_Bezel', BZ_, [gold], c, smooth=40, parent=root)
finish('Glove_Gem', GM_, [gem], c, smooth=60, parent=root)
# origin: the hand inside the glove (middle of the fist)
for o in c.objects:
    if o.type == 'MESH': o.data.transform(T(0, -0.17, 0))
result = {'objs': len(c.objects)}
