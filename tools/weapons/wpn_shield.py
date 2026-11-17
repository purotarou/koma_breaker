# 城の盾: kite shield with battlements, gold rim, navy band, white face, castle + swoosh emblem.
# Built in the slab convention (picture plane = model (y,z), thickness along X), bent, then turned so the
# face looks to +Y (forward) and the picture's right is -X. Origin = grip on the back.
c, root = weapon_scene('Shield')
a = ref(REFDIR + 'weapon_shield.webp'); Mk = masks(a)
gold = M('wpn_gold', (0.90, 0.70, 0.32), gloss=0.7, rim=0.3)
navy = M('wpn_navy', (0.13, 0.16, 0.34), gloss=0.15)
white = M('wpn_shield_white', (0.94, 0.95, 0.97), gloss=0.5, rim=0.2)
deep = M('wpn_shield_navy', (0.07, 0.11, 0.30), gloss=0.3)
leather = M('wpn_leather', (0.36, 0.22, 0.16), gloss=0.1)
gem = bpy.data.materials['wpn_gem']
s = 0.00062; OX, OY = 508, 700
F = lambda x, y: ((OX - x) * s, (OY - y) * s)

sh = fill_holes(clean_mask(Mk['obj']))
d = erode(Mk['dark'], 2); row = np.nonzero(d[560])[0]
band = dilate(flood(d, (560, int(row[row > 110][0] + 2))), 2) & Mk['dark']
inner = fill_holes(band)
h, sat, v = hsv(a[:, :, :3])
goldE = clean_mask((Mk['gold'] | ((h > 35) & (h < 66) & (sat > 0.12) & (v > 0.72))) & erode(inner, 3) & ~band, 2)
cyan = fill_holes(dilate(clean_mask(Mk['cyan'] & inner, 1), 3))
white_m = clean_mask(inner & ~Mk['dark'] & ~goldE & ~cyan & ~band, 1)

# bend: the face curves back toward the edges
K = 0.42
bend = lambda y, z: -K * y * y - 0.06 * max(0.0, -z - 0.25) ** 2
CUT = [i * 0.055 for i in range(-5, 6)]
def part(bm, name, mats):
    drape(bm, bend, 0, ys=CUT)
    xf(bm, Matrix(((0, 1, 0, 0), (1, 0, 0, 0), (0, 0, 1, 0), (0, 0, 0, 1))))
    bmesh.ops.reverse_faces(bm, faces=bm.faces)
    return finish(name, bm, mats, c, smooth=35, parent=root)

outer = trace(sh, eps=1.1, sm=2); inn = trace(inner, eps=1.1, sm=2)
part(ext(pix(outer + inn, F), -0.016, 0.019, bevel=0.0125), 'Shield_Rim', [gold])
part(ext(pix(inn, F), -0.012, 0.003), 'Shield_Base', [deep])
part(ext(pix(trace(white_m, eps=1.2, minarea=60, sm=2), F), -0.002, 0.008), 'Shield_Face', [white])
part(ext(pix(trace(goldE, eps=1.1, minarea=40, sm=2), F), 0.002, 0.0125), 'Shield_Emblem', [gold])
# faceted gem on the gable: fan from the traced outline to a raised apex
G = bmesh.new()
for lp in trace(cyan, eps=1.2, minarea=40, sm=0):
    P = pix([lp], F)[0]; cy = sum(p[0] for p in P) / len(P); cz = sum(p[1] for p in P) / len(P)
    ap = G.verts.new((0.024, cy, cz)); V = [G.verts.new((0.008, y, z)) for y, z in P]
    for i in range(len(V)): G.faces.new((V[i], V[(i + 1) % len(V)], ap))
    G.faces.new(list(reversed(V)))
bmesh.ops.recalc_face_normals(G, faces=G.faces)
part(G, 'Shield_Gem', [gem]).data.shade_flat()

# grip on the back (world -Y): wrapped bar along Z + gold brackets; then move so the grip is the origin
GZ, GY = 0.0, -0.062
gb = lathe([(0, -0.075, 0), (0.017, -0.075, 0), (0.017, 0.075, 0), (0, 0.075, 0)], 16); xf(gb, T(0, GY, GZ))
finish('Shield_Grip', gb, [leather], c, smooth=40, parent=root)
B = bmesh.new()
for zz in (-0.085, 0.085):
    merge(B, slab([(-0.012, zz - 0.012), (GY - 0.02, zz - 0.012), (GY - 0.02, zz + 0.012), (-0.012, zz + 0.012)], -0.022, 0.022, bevel=0.003))
finish('Shield_Bracket', B, [gold], c, parent=root)
L = bmesh.new(); RV = bmesh.new()   # leather arm straps (shallow loops) riveted to the back
for zz in (-0.20, 0.17):
    xs = [i * 0.012 - 0.12 for i in range(21)]
    yb = lambda xx: -0.012 - 0.42 * xx * xx - 0.024 * math.cos(xx / 0.12 * math.pi / 2)
    for i in range(20):
        a0, a1 = xs[i], xs[i + 1]; ym = (yb(a0) + yb(a1)) / 2
        merge(L, slab([(ym + 0.003, zz - 0.018), (ym - 0.003, zz - 0.018), (ym - 0.003, zz + 0.018), (ym + 0.003, zz + 0.018)], a0, a1))
    for xx in (-0.112, 0.112):
        r = uvsphere(0.008, 12, 6, 1, 0.6, 1); xf(r, T(xx, yb(xx) - 0.003, zz)); merge(RV, r)
finish('Shield_Strap', L, [leather], c, smooth=40, parent=root)
finish('Shield_Rivet', RV, [gold], c, parent=root)
for o in c.objects:
    if o.type == 'MESH':
        o.data.transform(T(0, -GY, -GZ))
