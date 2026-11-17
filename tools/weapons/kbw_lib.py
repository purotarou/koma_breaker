# Helpers for building the weapon models (run inside Blender: exec(open(path).read(), g)).
import bpy, bmesh, math
from mathutils import Vector, Matrix

def _lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def M(name, col, kb_mat=0, gloss=0.0, flags=0, rim=0.0):
    """Material: Base Color = game value (sRGB, like the stage files); viewport color linearised so previews match."""
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    if m.node_tree is None:
        try: m.use_nodes = True
        except Exception: pass
    b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if b:
        b.inputs['Base Color'].default_value = (col[0], col[1], col[2], 1)
        b.inputs['Roughness'].default_value = 0.6 - 0.4 * gloss
    m.diffuse_color = (_lin(col[0]), _lin(col[1]), _lin(col[2]), 1)
    m.roughness = 0.6 - 0.4 * gloss
    m['kb_mat'] = kb_mat; m['kb_gloss'] = gloss; m['kb_flags'] = flags; m['kb_rim'] = rim
    return m

def coll(name):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
    return c

def finish(name, bm, mats, col, smooth=32, parent=None):
    me = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    if smooth:
        me.shade_smooth(); me.set_sharp_from_angle(angle=math.radians(smooth))
    else:
        me.shade_flat()
    ob = bpy.data.objects.new(name, me)
    col.objects.link(ob)
    if parent: ob.parent = parent
    return ob

def xf(bm, mat):
    bmesh.ops.transform(bm, matrix=mat, verts=bm.verts)
    return bm

def merge(dst, src):
    """Append bmesh src into dst (keeps material indices)."""
    me = bpy.data.meshes.new('_tmp'); src.to_mesh(me); src.free()
    dst.from_mesh(me); bpy.data.meshes.remove(me)
    return dst

def setmat(bm, i):
    for f in bm.faces: f.material_index = i
    return bm

# ---------- primitives ----------
def lathe(prof, segs=32, cap=True):
    """prof: [(r, z, matIndex)] bottom->top; matIndex is used for the band from this point to the next. Axis = Z."""
    bm = bmesh.new(); rings = []
    for p in prof:
        r, z = p[0], p[1]
        if r < 1e-7: rings.append([bm.verts.new((0, 0, z))])
        else: rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / segs), r * math.sin(2 * math.pi * i / segs), z)) for i in range(segs)])
    for k in range(len(rings) - 1):
        a, b = rings[k], rings[k + 1]; mi = prof[k][2] if len(prof[k]) > 2 else 0
        fs = []
        if len(a) == 1 and len(b) == 1: continue
        if len(a) == 1:
            for i in range(segs): fs.append(bm.faces.new((a[0], b[(i + 1) % segs], b[i])))
        elif len(b) == 1:
            for i in range(segs): fs.append(bm.faces.new((a[i], a[(i + 1) % segs], b[0])))
        else:
            for i in range(segs): fs.append(bm.faces.new((a[i], a[(i + 1) % segs], b[(i + 1) % segs], b[i])))
        for f in fs: f.material_index = mi
    if cap:
        if len(rings[0]) > 1:
            f = bm.faces.new(list(reversed(rings[0]))); f.material_index = prof[0][2] if len(prof[0]) > 2 else 0
        if len(rings[-1]) > 1:
            f = bm.faces.new(rings[-1]); f.material_index = prof[-2][2] if len(prof[-2]) > 2 else 0
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def uvsphere(r, segs=24, rings=12, sx=1, sy=1, sz=1):
    prof = [(r * math.sin(math.pi * i / rings), -r * math.cos(math.pi * i / rings), 0) for i in range(rings + 1)]
    bm = lathe(prof, segs, cap=False)
    xf(bm, Matrix.Diagonal((sx, sy, sz, 1)))
    return bm

def tube(path, radius, sides=8, closed=False, cap=True, normals=None, rfun=None):
    path = [Vector(p) for p in path]; n = len(path)
    bm = bmesh.new(); T = []
    for i in range(n):
        if closed: a, b = path[(i - 1) % n], path[(i + 1) % n]
        else: a, b = path[max(i - 1, 0)], path[min(i + 1, n - 1)]
        T.append((b - a).normalized())
    up = Vector((0, 0, 1)) if abs(T[0].z) < 0.9 else Vector((1, 0, 0))
    N = T[0].cross(up).normalized(); rings = []
    for i in range(n):
        if normals is not None: N = Vector(normals[i])
        N = (N - T[i] * N.dot(T[i])).normalized()
        B = T[i].cross(N)
        r = rfun(i / (n - 1)) if rfun else radius
        rings.append([bm.verts.new(path[i] + r * (math.cos(2 * math.pi * k / sides) * N + math.sin(2 * math.pi * k / sides) * B)) for k in range(sides)])
    for i in (range(n) if closed else range(n - 1)):
        a, b = rings[i], rings[(i + 1) % n]
        for k in range(sides): bm.faces.new((a[k], a[(k + 1) % sides], b[(k + 1) % sides], b[k]))
    if cap and not closed:
        bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def slab(pts, x0, x1, bevel=0.0, seg=1):
    """Polygon pts [(y,z)] extruded along X from x0 to x1."""
    bm = bmesh.new()
    a = [bm.verts.new((x0, y, z)) for y, z in pts]
    b = [bm.verts.new((x1, y, z)) for y, z in pts]
    n = len(pts)
    bm.faces.new(a); bm.faces.new(list(reversed(b)))
    for i in range(n):
        j = (i + 1) % n; bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=seg, profile=0.5, affect='EDGES', clamp_overlap=True)
    return bm

def frame(outer, inner, x0, x1):
    """Ring-shaped slab between two loops with the same point count (both [(y,z)])."""
    bm = bmesh.new(); n = len(outer)
    oa = [bm.verts.new((x0, y, z)) for y, z in outer]; ob = [bm.verts.new((x1, y, z)) for y, z in outer]
    ia = [bm.verts.new((x0, y, z)) for y, z in inner]; ib = [bm.verts.new((x1, y, z)) for y, z in inner]
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((oa[i], oa[j], ia[j], ia[i])); bm.faces.new((ob[j], ob[i], ib[i], ib[j]))
        bm.faces.new((oa[j], oa[i], ob[i], ob[j])); bm.faces.new((ia[i], ia[j], ib[j], ib[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def side_panels(bm, inset, depth, mi=1, minarea=0.0):
    """Inset the big +X / -X faces of a slab and push the inner face out by depth (raised panel, material mi)."""
    bm.faces.ensure_lookup_table()
    caps = [f for f in bm.faces if abs(f.normal.x) > 0.99 and f.calc_area() > minarea]
    for f in caps:
        bmesh.ops.inset_region(bm, faces=[f], thickness=inset, depth=depth, use_even_offset=True)
        f.material_index = mi
    return bm

# ---------- 2D shape helpers (y,z) ----------
def PX(pts, ox, oy, s):
    """Image pixels -> model (y forward = left in the picture, z up)."""
    return [((ox - x) * s, (oy - y) * s) for x, y in pts]

def circ(cx, cy, r, n=24, a0=0.0):
    return [(cx + r * math.cos(a0 + 2 * math.pi * i / n), cy + r * math.sin(a0 + 2 * math.pi * i / n)) for i in range(n)]

def ribbon(path, w0, w1=None):
    """Thick stroke along path -> polygon. Width tapers w0 -> w1."""
    if w1 is None: w1 = w0
    n = len(path); L, R = [], []
    for i in range(n):
        a = path[max(i - 1, 0)]; b = path[min(i + 1, n - 1)]
        tx, ty = b[0] - a[0], b[1] - a[1]; l = math.hypot(tx, ty) or 1
        nx, ny = -ty / l, tx / l
        w = (w0 + (w1 - w0) * i / (n - 1)) / 2
        L.append((path[i][0] + nx * w, path[i][1] + ny * w)); R.append((path[i][0] - nx * w, path[i][1] - ny * w))
    return L + R[::-1]

def spiral(cx, cy, r0, r1, a0, a1, n=24):
    return [(cx + (r0 + (r1 - r0) * i / (n - 1)) * math.cos(a0 + (a1 - a0) * i / (n - 1)),
             cy + (r0 + (r1 - r0) * i / (n - 1)) * math.sin(a0 + (a1 - a0) * i / (n - 1))) for i in range(n)]

def bez(p0, p1, p2, p3, n=16):
    out = []
    for i in range(n):
        t = i / (n - 1); u = 1 - t
        out.append((u**3*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t**3*p3[0], u**3*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t**3*p3[1]))
    return out

PETAL = [(0.10, 0.0), (0.30, 0.20), (0.55, 0.36), (0.80, 0.38), (0.97, 0.24), (1.0, 0.10), (0.84, 0.0),
         (1.0, -0.10), (0.97, -0.24), (0.80, -0.38), (0.55, -0.36), (0.30, -0.20)]

def petal(cx, cy, R, ang):
    c, s = math.cos(ang), math.sin(ang)
    return [(cx + R * (x * c - y * s), cy + R * (x * s + y * c)) for x, y in PETAL]

def sakura(cx, cy, R, rot=0.0):
    return [petal(cx, cy, R, rot + i * 2 * math.pi / 5) for i in range(5)]

def flatpoly(bm, pts, x, sgn, mi=0):
    """single outward-facing ngon in the plane X=x (sgn=+1 faces +X)."""
    a = sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))
    q = pts if (a > 0) == (sgn > 0) else pts[::-1]
    f = bm.faces.new([bm.verts.new((x, y, z)) for y, z in q]); f.material_index = mi
    return f

def decal(polys, x, th=0.0015, both=True, mi=0):
    """Thin pattern on the side faces (x = outer face of the part), one-sided ngons just off the surface."""
    bm = bmesh.new()
    for p in polys:
        flatpoly(bm, p, x + th, 1, mi)
        if both: flatpoly(bm, p, -x - th, -1, mi)
    return bm

def cloud(cx, cy, S, flip=1, w=0.17):
    """Auspicious cloud motif as stroke polygons (list). flip=-1 mirrors horizontally."""
    out = []
    def P(pts): return [(cx + flip * x * S, cy + y * S) for x, y in pts]
    out.append(ribbon(P(spiral(0, 0, 0.12, 0.5, 0.5, 0.5 + 2 * math.pi * 1.25, 30)), w * 0.6 * S, w * S))
    out.append(ribbon(P(spiral(0.72, 0.22, 0.08, 0.3, 0.3, 0.3 + 2 * math.pi * 1.05, 22)), w * 0.5 * S, w * 0.85 * S))
    out.append(ribbon(P(bez((0.5, -0.05), (0.8, -0.25), (1.2, -0.05), (1.6, -0.12), 14)), w * S, w * 0.25 * S))
    out.append(ribbon(P(bez((0.98, 0.25), (1.1, 0.0), (0.7, -0.05), (0.5, -0.05), 10)), w * 0.75 * S, w * 0.9 * S))
    return out

def surf_patch(fn, nu, nv):
    """grid surface patch: fn(a,b) -> Vector for a,b in [-1,1]."""
    bm = bmesh.new(); V = [[bm.verts.new(fn(-1 + 2 * i / nu, -1 + 2 * j / nv)) for j in range(nv + 1)] for i in range(nu + 1)]
    for i in range(nu):
        for j in range(nv): bm.faces.new((V[i][j], V[i + 1][j], V[i + 1][j + 1], V[i][j + 1]))
    return bm

# ---------- added for bow / shield / flail / staff / spear ----------
def helix_band(rz, z0, z1, turns, w, t, phase=0.0, n=240, inset=0.0006):
    """flat band wound round the Z axis on a lathe surface of radius rz(z): axial width w, standing out by t."""
    bm = bmesh.new(); S = []
    for i in range(n + 1):
        f = i / n; z = z0 + (z1 - z0) * f; a = phase + 2 * math.pi * turns * f
        ca, sa = math.cos(a), math.sin(a)
        prof = [(rz(z - w / 2) - inset, z - w / 2), (rz(z - w / 2) + t * 0.6, z - w / 2), (rz(z) + t, z - w * 0.3),
                (rz(z) + t, z + w * 0.3), (rz(z + w / 2) + t * 0.6, z + w / 2), (rz(z + w / 2) - inset, z + w / 2)]
        S.append([bm.verts.new((r * ca, r * sa, zz)) for r, zz in prof])
    k = len(S[0])
    for i in range(n):
        for j in range(k):
            bm.faces.new((S[i][j], S[i][(j + 1) % k], S[i + 1][(j + 1) % k], S[i + 1][j]))
    bm.faces.new(S[0]); bm.faces.new(list(reversed(S[-1])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def gem_rhomb(mat, hh, hw, d, base=0.0):
    """rhombus gem (height 2hh along local Y, width 2hw along local X) raised d along local Z, then mat."""
    bm = bmesh.new()
    C = [bm.verts.new(p) for p in ((0, hh, base), (-hw, 0, base), (0, -hh, base), (hw, 0, base))]
    E = [bm.verts.new(p) for p in ((0, hh * 0.45, base + d * 0.75), (-hw * 0.45, 0, base + d * 0.75), (0, -hh * 0.45, base + d * 0.75), (hw * 0.45, 0, base + d * 0.75))]
    top = bm.verts.new((0, 0, base + d))
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new((C[i], C[j], E[j], E[i])); bm.faces.new((E[i], E[j], top))
    bm.faces.new(list(reversed(C)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return xf(bm, mat)

def star4(R, r, n=10, curve=0.55):
    """4-point star outline (points on +-Y and +-Z of the (y,z) plane): concave sides sampled as quadratic curves."""
    pts = []
    for k in range(4):
        a0 = k * math.pi / 2; a1 = a0 + math.pi / 2
        p0 = (R[k % 2] * math.cos(a0), R[k % 2] * math.sin(a0)); p1 = (R[(k + 1) % 2] * math.cos(a1), R[(k + 1) % 2] * math.sin(a1))
        m = (r * math.cos(a0 + math.pi / 4), r * math.sin(a0 + math.pi / 4))
        for i in range(n):
            t = i / n; u = 1 - t
            pts.append((u * u * p0[0] + 2 * u * t * m[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * m[1] + t * t * p1[1]))
    return pts

def raise_poly(pts, x0, x1, both=True):
    """flat polygon pts (y,z) at x0 with a fan up to an apex at x1 (pyramid-faceted gem / stud); both = mirrored too."""
    bm = bmesh.new()
    cy = sum(p[0] for p in pts) / len(pts); cz = sum(p[1] for p in pts) / len(pts)
    for s in ((1,) + ((-1,) if both else ())):
        V = [bm.verts.new((s * x0, y, z)) for y, z in pts]; ap = bm.verts.new((s * x1, cy, cz))
        for i in range(len(V)): bm.faces.new((V[i], V[(i + 1) % len(V)], ap))
        bm.faces.new(list(reversed(V)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
