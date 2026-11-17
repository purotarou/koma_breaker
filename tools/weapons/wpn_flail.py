# 鎖鉄球 (flail): blue-wrapped handle with silver/gold head, star guard + cyan gem, red-gem pommel,
# silver/gold chain, navy spiked ball. Handle along +Y (origin = middle of the grip), chain + ball straight
# out along +Y. Links are Flail_Link_NN (two shared meshes, spacing kb_pitch from kb_link0); the ball hangs from
# Flail_BallRoot, so the game can lengthen / bend the chain and move the ball in attacks.
c, root = weapon_scene('Flail')
gold = M('wpn_gold', (0.90, 0.70, 0.32), gloss=0.7, rim=0.3)
silver = M('wpn_silver', (0.84, 0.86, 0.90), gloss=0.85, rim=0.3)
blue = M('wpn_flail_blue', (0.16, 0.30, 0.72), gloss=0.35)
groove = M('wpn_flail_groove', (0.08, 0.14, 0.40), gloss=0.2)
ballc = M('wpn_flail_ball', (0.10, 0.12, 0.36), gloss=0.85, rim=0.3)
red = M('wpn_gem_red', (0.98, 0.36, 0.12), gloss=0.9, rim=0.3)
gem = bpy.data.materials['wpn_gem']
s = 0.0006; GY = 1230
Y = lambda py: (GY - py) * s
ZtoY = RX(-math.pi / 2)            # lathe axis Z -> model +Y

# ---- handle (lathe: r in px, picture y; 0 gold / 1 silver / 2 blue) ----
P = [(0, 1494, 0), (6, 1478, 0), (16, 1452, 0), (30, 1428, 0), (30, 1420, 0), (17, 1398, 0), (20, 1390, 0), (31, 1382, 0),
     (33, 1376, 0), (33, 1360, 0), (27, 1354, 2), (26, 1340, 2), (26, 1120, 1), (30, 1085, 1), (37, 1050, 1), (44, 1012, 1),
     (47, 990, 0), (47, 982, 0), (36, 972, 0), (24, 962, 0), (15, 950, 0), (19, 938, 0), (19, 930, 0), (9, 912, 0), (0, 905, 0)]
rz_px = {}
prof = [(r * s, Y(py), m) for r, py, m in P]
H = lathe(prof, 32)
# make the pommel four-sided (diamond) like the picture: squash its ring toward a square
for v in H.verts:
    if v.co.z < Y(1386):
        a = math.atan2(v.co.y, v.co.x); r = math.hypot(v.co.x, v.co.y)
        k = 1 / (abs(math.cos(a - math.pi / 4)) + abs(math.sin(a - math.pi / 4))) * 1.0
        v.co.x = r * k * math.cos(a); v.co.y = r * k * math.sin(a)
xf(H, ZtoY)
finish('Flail_Handle', H, [gold, silver, blue], c, smooth=40, parent=root)
def rz(z):   # handle radius at height z (model units, along the axis)
    pts = [(Y(py), r * s) for r, py, m in P]
    for (z0, r0), (z1, r1) in zip(pts, pts[1:]):
        if min(z0, z1) <= z <= max(z0, z1) and z0 != z1:
            return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
    return 0.0
B = bmesh.new()   # gold spiral straps over the silver head and down the grip, dark grooves in the wrap
merge(B, helix_band(rz, Y(1335), Y(1000), 1.35, 0.011, 0.0028, phase=0.4, n=120))
merge(B, helix_band(rz, Y(1335), Y(1015), 1.35, 0.011, 0.0028, phase=0.4 + math.pi, n=120))
xf(B, ZtoY); finish('Flail_Strap', B, [gold], c, smooth=50, parent=root)
Gr = bmesh.new()
for k in range(2):
    merge(Gr, helix_band(rz, Y(1338), Y(1125), 2.2, 0.0035, 0.0008, phase=k * math.pi + 1.2 + math.pi / 2, n=110))
xf(Gr, ZtoY); finish('Flail_Groove', Gr, [groove], c, smooth=50, parent=root)
# star guard (front/back faces = +-X) with a cyan sparkle on each face
yc = Y(985)
st = star4((0.050, 0.046), 0.021)
SG = ext([[(z, y) for y, z in st]], -0.031, 0.031, bevel=0.004)
xf(SG, T(0, yc, 0)); finish('Flail_Guard', SG, [gold], c, smooth=30, parent=root)
gm = raise_poly([(z, y) for y, z in star4((0.027, 0.025), 0.0075, 6)], 0.0312, 0.041)
xf(gm, T(0, yc, 0)); finish('Flail_Gem', gm, [gem], c, smooth=0, parent=root)
# red rhombus gems on the pommel faces
RG = bmesh.new()
for sg in (1, -1):
    merge(RG, gem_rhomb(T(0, Y(1424), 0) @ RY(sg * math.pi / 2), 0.0105, 0.0085, 0.006, base=0.0122))
finish('Flail_Gem_Red', RG, [red], c, smooth=0, parent=root)
# eye on top of the handle
EYE_Y = Y(890)
ey = tube([(0, EYE_Y + 0.014 * math.sin(2 * math.pi * i / 16) - 0.0, 0.014 * math.cos(2 * math.pi * i / 16)) for i in range(16)], 0.004, 8, closed=True)
xf(ey, T(0, 0.0, 0)); finish('Flail_Eye', ey, [gold], c, smooth=60, parent=root)

# ---- chain: octagonal links, silver (flat to X) / gold (turned 90deg) alternately ----
L, Wd, t = 0.050, 0.030, 0.0042
oc = [(Wd / 2 - t, L / 2 - t - 0.008), (Wd / 2 - t, -(L / 2 - t - 0.008)), (Wd / 2 - t - 0.006, -(L / 2 - t)), (-(Wd / 2 - t - 0.006), -(L / 2 - t)),
      (-(Wd / 2 - t), -(L / 2 - t - 0.008)), (-(Wd / 2 - t), L / 2 - t - 0.008), (-(Wd / 2 - t - 0.006), L / 2 - t), (Wd / 2 - t - 0.006, L / 2 - t)]
pitch = L - 2 * t - 0.004; NL = 28
y0 = EYE_Y + 0.014 + L / 2 - 2 * t
# one silver link (flat to X) and one gold link (turned 90deg); every link object shares one of the two meshes,
# so the game can draw any number of links along any path (chain stretching in attacks): root kb_pitch / kb_links.
lkS = tube([(0, y, z) for z, y in oc], t, 6, closed=True)
lkG = tube([(0, y, z) for z, y in oc], t, 6, closed=True); xf(lkG, RY(math.pi / 2))
mS = finish('Flail_LinkS', lkS, [silver], c, smooth=50, parent=root).data
mG = finish('Flail_LinkG', lkG, [gold], c, smooth=50, parent=root).data
for o in [o for o in c.objects if o.name in ('Flail_LinkS', 'Flail_LinkG')]: bpy.data.objects.remove(o)
for i in range(NL):
    o = bpy.data.objects.new('Flail_Link_%02d' % i, mG if i % 2 == 0 else mS); c.objects.link(o)
    o.parent = root; o.location = (0, y0 + i * pitch, 0)
top = y0 + (NL - 1) * pitch + L / 2 - t

# ---- ball: navy sphere, 20 square spikes (silver) with gold collars, gold eye ----
BR = 0.084; EC = top + 0.004; BC = EC + 0.006 + BR
be = tube([(0.011 * math.sin(2 * math.pi * i / 16), EC + 0.011 * math.cos(2 * math.pi * i / 16), 0) for i in range(16)], 0.0045, 8, closed=True)
bl = uvsphere(BR, 40, 20); xf(bl, T(0, BC, 0))
cap_ = lathe([(0, 0, 0), (0.022, 0, 0), (0.019, 0.010, 0), (0, 0.012, 0)], 16); xf(cap_, T(0, BC - BR + 0.004, 0) @ RX(math.pi / 2))
finish('Flail_Ball', bl, [ballc], c, smooth=60, parent=root)
phi = (1 + 5 ** 0.5) / 2
dirs = [(x, y, z) for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)] + \
       [(0, a / phi, b * phi) for a in (-1, 1) for b in (-1, 1)] + [(a / phi, b * phi, 0) for a in (-1, 1) for b in (-1, 1)] + \
       [(a * phi, 0, b / phi) for a in (-1, 1) for b in (-1, 1)]
SP = bmesh.new(); CO = bmesh.new()
rot = Matrix.Rotation(0.35, 4, 'X') @ Matrix.Rotation(0.2, 4, 'Z')
for d in dirs:
    n = (rot.to_3x3() @ Vector(d)).normalized()
    if n.dot(Vector((0, -1, 0))) > 0.9: continue          # keep the chain side clear
    m = T(0, BC, 0) @ n.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    hb = 0.026; hgt = 0.072
    sp = bmesh.new(); base = [sp.verts.new((hb * x, hb * y, BR - 0.008)) for x, y in ((1, 0), (0, 1), (-1, 0), (0, -1))]
    mid = [sp.verts.new((hb * 0.82 * x, hb * 0.82 * y, BR + 0.012)) for x, y in ((1, 0), (0, 1), (-1, 0), (0, -1))]
    tip = sp.verts.new((0, 0, BR + hgt))
    for i in range(4):
        j = (i + 1) % 4; sp.faces.new((base[i], base[j], mid[j], mid[i])); sp.faces.new((mid[i], mid[j], tip))
    sp.faces.new(list(reversed(base)))
    bmesh.ops.recalc_face_normals(sp, faces=sp.faces)
    merge(SP, xf(sp, m))
    co = ring([(hb * 1.0, -0.007), (hb * 1.32, -0.007), (hb * 1.2, 0.004), (hb * 0.97, 0.0065)], 4)
    xf(co, m @ T(0, 0, BR - 0.002) @ RZ(0)); merge(CO, co)
merge(CO, be); merge(CO, cap_)
finish('Flail_Spikes', SP, [silver], c, smooth=0, parent=root)
finish('Flail_Ball_Gold', CO, [gold], c, smooth=30, parent=root)
root['kb_eye'] = EYE_Y; root['kb_link0'] = y0; root['kb_pitch'] = pitch; root['kb_links'] = NL
# ball parts under one empty at the ball centre (move it to the chain end in the game)
br = bpy.data.objects.new('Flail_BallRoot', None); br.empty_display_size = 0.05; c.objects.link(br)
br.parent = root; br.location = (0, BC, 0)
for nm in ('Flail_Ball', 'Flail_Spikes', 'Flail_Ball_Gold'):
    o = c.objects[nm]; o.data.transform(T(0, -BC, 0)); o.parent = br
