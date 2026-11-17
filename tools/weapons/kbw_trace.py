# Reference-art helpers (run inside Blender after kbw_lib.py): read the concept picture,
# classify colours and trace region outlines into polygons in picture pixels (x right, y down).
import bpy, numpy as np, math
from mathutils import geometry

REF = {}
def ref(path):
    """picture as float array [row(top->bottom), col, rgba] (sRGB 0..1)."""
    if path in REF: return REF[path]
    im = bpy.data.images.load(path, check_existing=True)
    w, h = im.size
    a = np.empty(w * h * 4, dtype=np.float32); im.pixels.foreach_get(a)
    a = a.reshape(h, w, 4)[::-1].copy()
    REF[path] = a
    return a

def save_crop(a, x0, y0, x1, y1, out, scale=1):
    c = a[y0:y1, x0:x1]
    if scale != 1: c = c.repeat(scale, 0).repeat(scale, 1)
    h, w = c.shape[:2]
    im = bpy.data.images.new('_crop', w, h, alpha=True)
    im.pixels.foreach_set(c[::-1].reshape(-1).astype(np.float32))
    im.filepath_raw = out; im.file_format = 'PNG'; im.save(); bpy.data.images.remove(im)

def classify(a, pal):
    """pal: {name:(r,g,b)} -> label image (index into list(pal)) by nearest colour."""
    names = list(pal); P = np.array([pal[n] for n in names], dtype=np.float32)
    d = ((a[:, :, None, :3] - P[None, None]) ** 2).sum(-1)
    return names, d.argmin(-1)

def _ms_segments(m):
    m = np.pad(m.astype(np.uint8), 1)
    a = m[:-1, :-1]; b = m[:-1, 1:]; c = m[1:, 1:]; d = m[1:, :-1]
    case = a | (b << 1) | (c << 2) | (d << 3)
    I, J = np.nonzero((case > 0) & (case < 15))
    T = {1: ('L', 'T'), 2: ('T', 'R'), 3: ('L', 'R'), 4: ('R', 'B'), 6: ('T', 'B'), 7: ('L', 'B'), 8: ('L', 'B'),
         9: ('T', 'B'), 11: ('R', 'B'), 12: ('L', 'R'), 13: ('T', 'R'), 14: ('L', 'T')}
    segs = []
    for i, j in zip(I.tolist(), J.tolist()):
        k = int(case[i, j])
        E = {'T': ('h', i, j), 'R': ('v', i, j + 1), 'B': ('h', i + 1, j), 'L': ('v', i, j)}
        if k == 5: segs += [(E['L'], E['T']), (E['R'], E['B'])]
        elif k == 10: segs += [(E['T'], E['R']), (E['B'], E['L'])]
        else: segs.append((E[T[k][0]], E[T[k][1]]))
    return segs

def _pt(e):
    t, i, j = e   # padded coords -> picture pixel centres
    return (j + 0.5 - 1, i - 1) if t == 'h' else (j - 1, i + 0.5 - 1)

def _dp(pts, eps):
    if len(pts) < 3: return pts
    a, b = np.array(pts[0]), np.array(pts[-1]); P = np.array(pts)
    ab = b - a; L = np.hypot(*ab)
    if L < 1e-9: d = np.hypot(*(P - a).T)
    else: d = np.abs(ab[0] * (P[:, 1] - a[1]) - ab[1] * (P[:, 0] - a[0])) / L
    k = int(d.argmax())
    if d[k] > eps: return _dp(pts[:k + 1], eps)[:-1] + _dp(pts[k:], eps)
    return [pts[0], pts[-1]]

def area(p):
    return 0.5 * sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p)))

def smooth(p, it=1):
    for _ in range(it):
        n = len(p); q = []
        for i in range(n):
            a, b = p[i], p[(i + 1) % n]
            q += [(0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]), (0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1])]
        p = q
    return p

def trace(m, eps=0.9, minarea=20, sm=1):
    """boolean mask -> list of closed loops [(x,y)] in picture pixels. Outer loops and holes both returned."""
    segs = _ms_segments(m)
    adj = {}
    for a, b in segs:
        adj.setdefault(a, []).append(b); adj.setdefault(b, []).append(a)
    seen = set(); loops = []
    for s in list(adj):
        if s in seen: continue
        loop = [s]; seen.add(s); prev = None; cur = s
        while True:
            nx = [n for n in adj[cur] if n != prev and n not in seen]
            if not nx:
                break
            prev, cur = cur, nx[0]; seen.add(cur); loop.append(cur)
        if len(loop) < 4: continue
        P = [_pt(e) for e in loop]
        if sm: P = smooth(P, sm)
        k = len(P) // 2
        Q = _dp(P[:k + 1], eps)[:-1] + _dp(P[k:] + [P[0]], eps)[:-1]
        if len(Q) < 3 or abs(area(Q)) < minarea: continue
        loops.append(Q)
    return loops

def inside(pt, lp):
    P = np.asarray(lp); x, y = pt; x0, y0 = P[:, 0], P[:, 1]; x1, y1 = np.roll(x0, -1), np.roll(y0, -1)
    c = ((y0 > y) != (y1 > y)) & (x < (x1 - x0) * (y - y0) / np.where(y1 - y0 == 0, 1e-12, y1 - y0) + x0)
    return bool(c.sum() % 2)

def groups(loops):
    """split loops into islands [outer, holes...] by nesting depth."""
    n = len(loops); A = [abs(area(l)) for l in loops]
    cont = [[j for j in range(n) if j != i and A[j] > A[i] and inside(loops[i][0], loops[j])] for i in range(n)]
    out = []
    for i in range(n):
        if len(cont[i]) % 2 == 0:
            holes = [k for k in range(n) if len(cont[k]) == len(cont[i]) + 1 and min(cont[k], key=lambda j: A[j]) == i]
            out.append([loops[i]] + [loops[k] for k in holes])
    return out

def tess(loops):
    """loops (outer + holes, any orientation) -> (points, triangles) via scanfill, one island at a time."""
    flat, tris = [], []
    for g in groups(loops):
        L = [[(x, y, 0.0) for x, y in lp] for lp in g]
        T = geometry.tessellate_polygon(L); o = len(flat)
        tris += [tuple(i + o for i in t) for t in T]
        flat += [p for lp in g for p in lp]
    return flat, tris

def clean_mask(m, it=1):
    """remove 1px speckle: majority filter."""
    m = m.astype(np.uint8)
    for _ in range(it):
        p = np.pad(m, 1); s = sum(p[1 + di:p.shape[0] - 1 + di, 1 + dj:p.shape[1] - 1 + dj] for di in (-1, 0, 1) for dj in (-1, 0, 1))
        m = (s >= 5).astype(np.uint8)
    return m.astype(bool)

# ---------- masks ----------
def dilate(m, r=1):
    m = m.copy()
    for _ in range(r):
        p = np.pad(m, 1); m = p[1:-1, 1:-1] | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
    return m

def erode(m, r=1):
    return ~dilate(~m, r)

def flood(m, seed):
    """connected component of mask m containing seed (row, col). Works on 4x downsampled steps, then refines."""
    r = np.zeros_like(m); r[seed] = True
    while True:
        p = np.pad(r, 1); n = (p[1:-1, 1:-1] | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]) & m
        for _ in range(8):
            p = np.pad(n, 1); n = (p[1:-1, 1:-1] | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]) & m
        if (n == r).all(): return r
        r = n

def fill_holes(m):
    """pixels not reachable from the border through ~m become True."""
    out = ~m; p = np.zeros_like(m); p[0, :] = out[0, :]; p[-1, :] = out[-1, :]; p[:, 0] = out[:, 0]; p[:, -1] = out[:, -1]
    r = p
    while True:
        q = np.pad(r, 1); n = (q[1:-1, 1:-1] | q[:-2, 1:-1] | q[2:, 1:-1] | q[1:-1, :-2] | q[1:-1, 2:]) & out
        for _ in range(16):
            q = np.pad(n, 1); n = (q[1:-1, 1:-1] | q[:-2, 1:-1] | q[2:, 1:-1] | q[1:-1, :-2] | q[1:-1, 2:]) & out
        if (n == r).all(): return ~r
        r = n

def offset(p, d):
    """move every vertex of a closed loop along its averaged normal by d (outward for CCW in y-up coords is +)."""
    n = len(p); q = []
    for i in range(n):
        a, b, c = p[i - 1], p[i], p[(i + 1) % n]
        t = (c[0] - a[0], c[1] - a[1]); l = math.hypot(*t) or 1
        q.append((b[0] + d * t[1] / l, b[1] - d * t[0] / l))
    return q

# ---------- geometry from loops (model plane (y,z), thickness along X like slab()) ----------
def _caps(bm, loops, x, up, mi):
    pts, tris = tess(loops)
    V = [bm.verts.new((x, a, b)) for a, b in pts]
    for t in tris:
        try:
            f = bm.faces.new([V[i] for i in t]); f.material_index = mi
        except ValueError: pass
    return V

def ext(loops, x0, x1, bevel=0.0, mi=0, seg=1):
    """solid: loops (outer + holes) extruded from x0 to x1."""
    bm = bmesh.new()
    pts, tris = tess(loops)
    A = [bm.verts.new((x0, a, b)) for a, b in pts]; B = [bm.verts.new((x1, a, b)) for a, b in pts]
    for t in tris:
        bm.faces.new([A[i] for i in t]); bm.faces.new([B[i] for i in t])
    k = 0
    for lp in [l for g in groups(loops) for l in g]:
        n = len(lp)
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((A[k + i], A[k + j], B[k + j], B[k + i]))
        k += n
    for f in bm.faces: f.material_index = mi
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if bevel > 0:
        ed = [e for e in bm.edges if len(e.link_faces) == 2 and abs(e.link_faces[0].normal.x - e.link_faces[1].normal.x) > 0.7]
        bmesh.ops.bevel(bm, geom=ed, offset=bevel, segments=seg, profile=0.5, affect='EDGES', clamp_overlap=True)
    return bm

def cap(loops, x, sgn=1, both=False, mi=0):
    """one-sided flat face(s) with holes in the plane X=x facing sgn*X (both: also the mirrored -x side)."""
    bm = bmesh.new()
    for s in ((sgn, 1),) + (((-sgn, -1),) if both else ()):
        pts, tris = tess(loops)
        V = [bm.verts.new((x * s[1], a, b)) for a, b in pts]
        for t in tris:
            try: f = bm.faces.new([V[i] for i in t])
            except ValueError: continue
            f.material_index = mi
            f.normal_update()
            if f.normal.x * s[0] < 0: f.normal_flip()
    return bm

def drape(bm, fn, axis=0, ys=None, zs=None):
    """bend flat geometry: cut along the given y / z planes, then move every vertex along `axis` by fn(y,z)."""
    for v in (ys or []):
        bmesh.ops.bisect_plane(bm, geom=list(bm.verts) + list(bm.edges) + list(bm.faces), dist=1e-7, plane_co=(0, v, 0), plane_no=(0, 1, 0))
    for v in (zs or []):
        bmesh.ops.bisect_plane(bm, geom=list(bm.verts) + list(bm.edges) + list(bm.faces), dist=1e-7, plane_co=(0, 0, v), plane_no=(0, 0, 1))
    for v in bm.verts:
        co = v.co.copy(); co[axis] += fn(co.y, co.z); v.co = co
    return bm

def pix(loops, f):
    """map picture-pixel loops with f(x,y)->(a,b)."""
    return [[f(x, y) for x, y in lp] for lp in loops]

def hsv(a):
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 1e-6, (mx - mn) / np.maximum(mx, 1e-6), 0)
    return h, s, mx

def masks(a):
    """rough colour classes of the concept art."""
    h, s, v = hsv(a[:, :, :3])
    M = {}
    M['bg'] = (v > 0.96) & (s < 0.05)
    M['obj'] = ~M['bg']
    M['gold'] = (h > 22) & (h < 62) & (s > 0.32) & (v > 0.42)
    M['dark'] = (v < 0.40) & ~M['gold']
    M['navy'] = M['dark'] & (a[:, :, 2] > a[:, :, 0] + 0.04)
    M['cyan'] = (h > 160) & (h < 205) & (s > 0.25) & (v > 0.45)
    M['red'] = ((h < 22) | (h > 340)) & (s > 0.45) & (v > 0.4)
    M['light'] = (v > 0.62) & (s < 0.32) & ~M['bg']
    M['blue'] = (h > 205) & (h < 250) & (s > 0.35) & (v >= 0.25)
    return M

def lathe_prof(m, cls, r0, r1, x0, x1, step=3, shrink=1.5):
    """turned part read from the picture: for picture rows r0..r1 (top->bottom) the half width of mask m
    inside columns x0..x1 -> [(radius_px, row, class)] where class = cls(row, xa, xb) (material index)."""
    out = []
    for r in range(r0, r1 + 1, step):
        xs = np.nonzero(m[r, x0:x1])[0]
        if len(xs) == 0: continue
        xa, xb = xs.min() + x0, xs.max() + x0
        out.append((max((xb - xa) / 2 - shrink, 0.5), r, cls(r, xa, xb), (xa + xb) / 2))
    return out

def major(Mk, names, r, xa, xb):
    """index (into names) of the most common colour class on a row segment."""
    cnt = [int(Mk[n][r, xa:xb + 1].sum()) for n in names]
    return int(np.argmax(cnt))

def prof_simplify(P, tol=0.7):
    """drop lathe profile points [(r,row,k)] that lie on the line between their neighbours (same material)."""
    out = [P[0]]
    for i in range(1, len(P) - 1):
        a, b, c = out[-1], P[i], P[i + 1]
        if b[2] != a[2] or b[2] != c[2]:
            out.append(b); continue
        t = (b[1] - a[1]) / ((c[1] - a[1]) or 1e-9); rl = a[0] + (c[0] - a[0]) * t
        if abs(rl - b[0]) > tol: out.append(b)
    out.append(P[-1])
    return out

def seg_dist(P, loops):
    """distance from points P (N,2) to the nearest edge of the loops."""
    A = np.concatenate([np.asarray(l) for l in loops]); B = np.concatenate([np.roll(np.asarray(l), -1, 0) for l in loops])
    P = np.asarray(P)[:, None, :]; AB = (B - A)[None]; AP = P - A[None]
    t = np.clip((AP * AB).sum(-1) / np.maximum((AB * AB).sum(-1), 1e-12), 0, 1)
    D = AP - t[..., None] * AB
    return np.sqrt((D * D).sum(-1)).min(1)

def blade_surf(loops, outline, t, w, step, lift=0.0, sides=(1, -1)):
    """thin blade: flat caps of `loops` cut on a grid, then pushed out to x = t*min(1, d/w) (+lift) where d is
    the distance to `outline` -> sharp edges, faceted bevel of width w, flat middle. Returns one bmesh."""
    out = bmesh.new()
    allp = [p for l in loops for p in l]
    y0, y1 = min(p[0] for p in allp), max(p[0] for p in allp); z0, z1 = min(p[1] for p in allp), max(p[1] for p in allp)
    for sg in sides:
        bm = cap(loops, 0.0, sg)
        k = math.floor(y0 / step)
        while k * step < y1:
            bmesh.ops.bisect_plane(bm, geom=list(bm.verts) + list(bm.edges) + list(bm.faces), dist=1e-7, plane_co=(0, k * step, 0), plane_no=(0, 1, 0)); k += 1
        k = math.floor(z0 / step)
        while k * step < z1:
            bmesh.ops.bisect_plane(bm, geom=list(bm.verts) + list(bm.edges) + list(bm.faces), dist=1e-7, plane_co=(0, 0, k * step), plane_no=(0, 0, 1)); k += 1
        V = list(bm.verts)
        d = seg_dist([(v.co.y, v.co.z) for v in V], outline)
        for v, dd in zip(V, d):
            v.co.x = sg * (t * min(1.0, dd / w) + lift)
        merge(out, bm)
    bmesh.ops.remove_doubles(out, verts=out.verts, dist=1e-6)
    return out
