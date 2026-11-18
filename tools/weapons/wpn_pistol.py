# 妖弾銃: revolver from the concept art blender/src/concept_pistol.webp (pixel coordinates below are in that picture) (side view, muzzle to the right of the picture).
# Picture plane = model (y,z) with the muzzle toward +Y, thickness along X. Origin = top of the grip (hand).
c, root = weapon_scene('Pistol')
s = 0.0003; OX, OY = 360, 500
F = lambda x, y: ((x - OX) * s, (OY - y) * s)
Yp = lambda px: (px - OX) * s; Zp = lambda py: (OY - py) * s
P = lambda pts: [F(x, y) for x, y in pts]

grey = M('wpn_pistol_grey', (0.42, 0.42, 0.44), gloss=0.45, rim=0.25)
greyd = M('wpn_pistol_dark', (0.30, 0.30, 0.32), gloss=0.5, rim=0.2)
cylm = M('wpn_pistol_cyl', (0.56, 0.56, 0.58), gloss=0.55, rim=0.25)
gold = M('wpn_gold_warm', (0.97, 0.74, 0.22), gloss=0.7, rim=0.3)
wood = M('wpn_pistol_wood', (0.56, 0.26, 0.17), kb_mat=2, gloss=0.25)
bore = bpy.data.materials['wpn_bore']
gem = M('wpn_gem_cyan', (0.36, 0.88, 0.96), gloss=1.0, rim=0.5)

ZC = Zp(361)          # cylinder axis height
HW = 0.020            # frame half thickness

# ---- frame (grey) with a window for the cylinder ----
frame_o = [(405, 252), (598, 248), (632, 192), (946, 192), (976, 246), (1056, 246), (1062, 256), (1062, 388), (1052, 397),
           (996, 398), (952, 524), (700, 528), (474, 494), (412, 442), (292, 440), (282, 410), (334, 360), (398, 356)]
win = [(642, 236), (916, 236), (928, 250), (928, 474), (916, 488), (642, 488), (630, 474), (630, 250)]
finish('Pistol_Frame', ext([P(frame_o), P(win)], -HW, HW, bevel=0.0045, seg=2), [grey], c, smooth=35, parent=root)
# rear sight notch block on the top strap
finish('Pistol_Sight', ext([P([(612, 240), (640, 196), (660, 196), (640, 240)])], -0.007, 0.007, bevel=0.0015), [greyd], c, smooth=30, parent=root)

# ---- barrel: turned along +Y, front sight, dark bore ----
BZ = Zp(318); BR = 0.0150; b0 = Yp(1050); b1 = Yp(1590)
br = lathe([(0, 0, 0), (BR + 0.0025, 0, 0), (BR + 0.0025, 0.012, 0), (BR, 0.016, 0), (BR, b1 - b0 - 0.004, 0),
            (BR - 0.0025, b1 - b0, 0), (0.0062, b1 - b0, 0), (0.0062, b1 - b0 - 0.002, 1), (0, b1 - b0 - 0.002, 1)], 32)
xf(br, T(0, b0, BZ) @ RX(-math.pi / 2))
finish('Pistol_Barrel', br, [grey, bore], c, smooth=40, parent=root)
finish('Pistol_FrontSight', ext([P([(1496, 276), (1514, 252), (1562, 252), (1586, 274), (1586, 290), (1496, 290)])], -0.008, 0.008, bevel=0.002), [grey], c, smooth=30, parent=root)

# ---- cylinder: fluted grey core between two gold bands, chambers on the front face ----
cy0 = Yp(632); cy1 = Yp(926); L = cy1 - cy0
RC = 0.0362; RG = 0.0388; FL = 6; FD = 0.0062; FW = 0.30   # flute count, depth, half width (rad)
g0 = Yp(694) - cy0; g1 = Yp(852) - cy0
def core():
    bm = bmesh.new(); NA, NH = 120, 14; R = []
    for j in range(NH + 1):
        h = g0 - 0.003 + (g1 - g0 + 0.006) * j / NH
        e = min(1.0, (h - g0) / 0.009, (g1 - h) / 0.009); e = max(0.0, e); e = e * e * (3 - 2 * e)
        row = []
        for i in range(NA):
            a = 2 * math.pi * i / NA
            d = min(abs(((a - (k + 0.5) * 2 * math.pi / FL) + math.pi) % (2 * math.pi) - math.pi) for k in range(FL))
            r = RC - (FD * e * math.sqrt(1 - (d / FW) ** 2) if d < FW else 0)
            row.append(bm.verts.new((r * math.cos(a), r * math.sin(a), h)))
        R.append(row)
    for j in range(NH):
        for i in range(NA):
            k = (i + 1) % NA; bm.faces.new((R[j][i], R[j][k], R[j + 1][k], R[j + 1][i]))
    bm.faces.new(list(reversed(R[0]))); bm.faces.new(R[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
CYL = T(0, cy0, ZC) @ RX(-math.pi / 2)
finish('Pistol_Cylinder', xf(core(), CYL), [cylm], c, smooth=40, parent=root)
G = bmesh.new()
merge(G, xf(lathe([(0, 0.0, 0), (RG - 0.006, 0.0, 0), (RG - 0.0015, 0.002, 0), (RG, 0.0065, 0), (RG, g0 - 0.002, 0), (RG - 0.002, g0, 0), (0, g0, 0)], 48), CYL))
merge(G, xf(lathe([(0, g1, 0), (RG - 0.002, g1, 0), (RG, g1 + 0.002, 0), (RG, L - 0.0075, 0), (RG - 0.0035, L - 0.002, 0), (RG - 0.008, L, 0), (0, L, 0)], 48), CYL))
finish('Pistol_CylBand', G, [gold], c, smooth=40, parent=root)
CH = bmesh.new()
for k in range(6):
    a = (k + 0.5) * 2 * math.pi / 6; rr = 0.0215
    hole = lathe([(0, L - 0.0035, 0), (0.0068, L - 0.0035, 0), (0.0068, L + 0.0004, 0), (0, L + 0.0004, 0)], 16)
    xf(hole, CYL @ T(rr * math.cos(a), rr * math.sin(a), 0)); merge(CH, hole)
pin = lathe([(0, L - 0.001, 0), (0.0045, L - 0.001, 0), (0.0045, L + 0.002, 0), (0, L + 0.002, 0)], 16); xf(pin, CYL)
finish('Pistol_Chambers', CH, [bore], c, smooth=40, parent=root)
finish('Pistol_CylPin', pin, [gold], c, smooth=40, parent=root)

# ---- gold parts: hammer, side plate + screw, trigger, gem mount, butt cap, grip screw ----
finish('Pistol_Hammer', ext([P([(318, 280), (316, 266), (332, 248), (380, 248), (398, 262), (396, 350), (352, 350), (356, 300), (346, 286)])],
                            -0.0085, 0.0085, bevel=0.0025, seg=2), [gold], c, smooth=35, parent=root)
# serrations on the hammer spur
SR = bmesh.new()
for i in range(3):
    x = 336 + i * 13
    merge(SR, ext([P([(x, 247), (x + 6, 247), (x + 6, 243), (x, 243)])], -0.0075, 0.0075, bevel=0.0008))
finish('Pistol_HammerGrip', SR, [gold], c, smooth=30, parent=root)
plate = P([(418, 438), (462, 388), (598, 422), (614, 466), (472, 478), (450, 470)])
PL = ext([plate], HW - 0.001, HW + 0.0032, bevel=0.0016); merge(PL, ext([plate], -HW - 0.0032, -HW + 0.001, bevel=0.0016))
finish('Pistol_Plate', PL, [gold], c, smooth=30, parent=root)
SC = bmesh.new()
for sg in (1, -1):
    for (px, py, r) in ((473, 437, 17), (262, 692, 23)):
        x0 = (HW + 0.0032) if px > 400 else 0.026
        b = uvsphere(r * s, 20, 10, 1, 1, 1); xf(b, T(sg * x0, Yp(px), Zp(py)) @ Matrix.Diagonal((0.45, 1, 1, 1))); merge(SC, b)
finish('Pistol_Screws', SC, [gold], c, smooth=40, parent=root)
TR = ribbon(bez((548, 506), (530, 552), (548, 586), (582, 598), 14), 30, 10)
finish('Pistol_Trigger', ext([P(TR)], -0.0055, 0.0055, bevel=0.002), [gold], c, smooth=35, parent=root)
gm = lathe([(0, 0, 0), (0.0205, 0, 0), (0.0198, 0.0025, 0), (0.0148, Zp(205) - Zp(244), 0), (0.0135, Zp(205) - Zp(244) + 0.0015, 0), (0, Zp(205) - Zp(244) + 0.0015, 0)], 32)
xf(gm, T(0, Yp(523), Zp(246)))
finish('Pistol_GemMount', gm, [gold], c, smooth=40, parent=root)
gs = uvsphere(62 * s, 32, 16); xf(gs, T(0, Yp(523), Zp(162)))
finish('Pistol_Gem', gs, [gem], c, smooth=60, parent=root)
butt = P([(126, 738), (368, 766), (356, 806), (116, 778)])
finish('Pistol_Butt', ext([butt], -0.0275, 0.0275, bevel=0.005, seg=2), [gold], c, smooth=35, parent=root)

# ---- trigger guard (grey ring) ----
g_o = [(478, 494), (452, 566), (470, 628), (502, 650), (640, 650), (676, 620), (704, 556), (712, 528)]
g_i = [(502, 518), (484, 568), (504, 620), (632, 620), (656, 598), (668, 548), (650, 520)]
finish('Pistol_Guard', ext([P(g_o), P(g_i)], -0.009, 0.009, bevel=0.003, seg=2), [grey], c, smooth=35, parent=root)

# ---- wooden grip: rounded slab, slightly tapered toward the butt ----
grip = [(296, 436), (414, 436), (476, 490), (446, 566), (414, 650), (372, 762), (130, 740), (162, 668), (214, 578), (260, 500)]
GB = ext([P(grip)], -0.025, 0.025, bevel=0.011, seg=3)
for v in GB.verts:   # palm swell: wider in the middle, a little thinner at the butt
    t = max(0.0, min(1.0, (Zp(436) - v.co.z) / (Zp(436) - Zp(762))))
    v.co.x *= 1.0 + 0.10 * math.sin(math.pi * t) - 0.06 * t
finish('Pistol_Grip', GB, [wood], c, smooth=35, parent=root)
result = {'objs': len(c.objects)}
