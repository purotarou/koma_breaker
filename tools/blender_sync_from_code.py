"""Bring an existing Blender stage in line with its code-built version (buildStage1Code / buildStage2Code),
without rebuilding the file: objects keep their names and collections.

Input: JSON from `node tools/dump_stage.js <1|2> out.json`.
Run inside Blender with the stage .blend open:
    exec(open('tools/blender_sync_from_code.py').read(), {'DUMP': '/path/stage1.json', 'ROOT': 'Shrine'})
Optional globals: DELETE_UNMATCHED=True removes mesh objects / colliders that no longer exist in the code version.

What it does:
  * Matches every code instance to the Blender object with the same unit mesh (KB_BOX, ...) and the same world matrix
    (max element difference < 1e-3) and gives it the code's material (colour, kb_mat, kb_gloss, kb_flags, kb_rim).
  * Code instances with no matching object are created (linked duplicates of the unit mesh) in a collection named after
    the dump group (ROOT/<group>), so new props land in their own collection.
  * Missing colliders are added to the 'Colliders' collection.
Conventions are the same as tools/blender_build_stage.py.
"""
import bpy, json
import numpy as np
from mathutils import Matrix

D = json.load(open(DUMP))
DEL = globals().get('DELETE_UNMATCHED', False)
C = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))  # game -> blender
CI = C.inverted()
root = bpy.data.collections[ROOT]

def flat(M):  # column-major, like the game's Float32Array
    return [M[r][c] for c in range(4) for r in range(4)]

# ---- existing objects ----
meshes, objs = {}, {}
for ob in bpy.data.objects:
    if ob.type != 'MESH' or not ob.data.name.startswith('KB_'):
        continue
    p = ob.data.name[3:].split('.')[0]
    meshes.setdefault(p, ob.data)
    objs.setdefault(p, []).append(ob)
arr = {p: np.array([flat(CI @ ob.matrix_world @ C) for ob in l]) for p, l in objs.items()}
used = {p: np.zeros(len(l), bool) for p, l in objs.items()}

# ---- materials ----
cname = {}
for k, v in D['cnames']:
    cname.setdefault(tuple(round(x, 4) for x in v), k)
def mkey(c, mat, gloss, fl, rim):
    return (tuple(round(x, 4) for x in c), int(mat), round(float(gloss), 4), int(fl), round(float(rim), 4))
def bsdf_of(m):  # look the node up by type: its name is not always 'Principled BSDF'
    return next((n for n in m.node_tree.nodes if n.bl_idname == 'ShaderNodeBsdfPrincipled'), None) if m.node_tree else None
mats = {}
for m in bpy.data.materials:
    if 'kb_mat' not in m:
        continue
    # viewport colour holds the game colour (some materials also carry an unused default BSDF, and node names are localised)
    mats.setdefault(mkey(m.diffuse_color[:3], m['kb_mat'], m['kb_gloss'], m['kb_flags'], m['kb_rim']), m)
created_mats = []
def material(i):
    key = mkey(i['c'], i['mat'], i['gloss'], i['fl'], i['rim'])
    if key in mats:
        return mats[key]
    nm = 'kb_' + cname.get(key[0], 'c%02x%02x%02x' % tuple(int(round(x * 255)) for x in i['c']))
    if i['mat']: nm += '_t%d' % i['mat']
    if i['gloss']: nm += '_g%g' % i['gloss']
    if i['fl'] & 1: nm += '_unlit'
    if i['fl'] & 2: nm += '_noedge'
    if i['fl'] & 4: nm += '_nocast'
    if i['fl'] & 8: nm += '_sway'
    if i['fl'] & 16: nm += '_cloth'
    if i['fl'] & 32: nm += '_drift'
    if i['fl'] & 64: nm += '_flame'
    if i['rim']: nm += '_rim'
    m = bpy.data.materials.new(nm)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = bsdf_of(m)
    if bsdf is None:  # Blender 5.x: new materials may start with an empty node tree
        bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
        out = nt.nodes.get('Material Output') or nt.nodes.new('ShaderNodeOutputMaterial')
        out.location = (300, 0)
        nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value = (*i['c'], 1.0)
    bsdf.inputs['Roughness'].default_value = 1.0
    m.diffuse_color = (*i['c'], 1.0)
    m['kb_mat'] = int(i['mat']); m['kb_gloss'] = float(i['gloss']); m['kb_flags'] = int(i['fl']); m['kb_rim'] = float(i['rim'])
    mats[key] = m
    created_mats.append(nm)
    return m

def coll(name):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
        root.children.link(c)
    return c

# ---- instances ----
changed, added = 0, {}
for i in D['inst']:
    p, m = i['p'], np.array(i['m'])
    hit = -1
    if p in arr:
        d = np.abs(arr[p] - m).max(axis=1)
        d[used[p]] = np.inf
        k = int(np.argmin(d))
        if d[k] < 1e-3:
            hit = k
    if hit >= 0:
        used[p][hit] = True
        ob = objs[p][hit]
        mt = material(i)
        if ob.material_slots[0].material != mt:
            ob.material_slots[0].link = 'OBJECT'
            ob.material_slots[0].material = mt
            changed += 1
        continue
    g = i['g']
    added[g] = added.get(g, 0) + 1
    ob = bpy.data.objects.new('%s_%s_%03d' % (g, p.lower(), added[g]), meshes[p])
    coll(g).objects.link(ob)
    M = Matrix(((m[0], m[4], m[8], m[12]), (m[1], m[5], m[9], m[13]), (m[2], m[6], m[10], m[14]), (0, 0, 0, 1)))
    ob.matrix_world = C @ M @ CI
    ob.material_slots[0].link = 'OBJECT'
    ob.material_slots[0].material = material(i)

stale = [ob.name for p, l in objs.items() for k, ob in enumerate(l) if not used[p][k]]
if DEL:
    for n in stale:
        bpy.data.objects.remove(bpy.data.objects[n])

# ---- colliders ----
def ckey_c(c): return ('cyl', round(c['x'], 3), round(c['z'], 3), round(c['r'], 3), round(c['h'], 3))
def ckey_b(b): return ('box', round(b['x0'], 3), round(b['x1'], 3), round(b['z0'], 3), round(b['z1'], 3), round(b['h'], 3))
have = {}
for e in bpy.data.objects:
    if e.type != 'EMPTY' or 'kb_col' not in e:
        continue
    w = e.matrix_world; sx, sy, sz = w.to_scale(); t = w.translation  # blender space: (x, -z, y)
    if e['kb_col'] == 'cyl':
        have[ckey_c({'x': t.x, 'z': -t.y, 'r': sx, 'h': sz})] = e
    else:
        have[ckey_b({'x0': t.x - sx, 'x1': t.x + sx, 'z0': -t.y - sy, 'z1': -t.y + sy, 'h': t.z + sz})] = e
cc = bpy.data.collections.get('Colliders') or coll('Colliders')
want, col_added = set(), 0
for c in D['colC']:
    k = ckey_c(c); want.add(k)
    if k in have: continue
    e = bpy.data.objects.new('COL_cyl_new', None); e.empty_display_type = 'CIRCLE'
    e.location = (c['x'], -c['z'], 0.0); e.scale = (c['r'], c['r'], c['h']); e['kb_col'] = 'cyl'; cc.objects.link(e); col_added += 1
for b in D['colB']:
    k = ckey_b(b); want.add(k)
    if k in have: continue
    e = bpy.data.objects.new('COL_box_new', None); e.empty_display_type = 'CUBE'
    hx, hz, hh = (b['x1'] - b['x0']) / 2, (b['z1'] - b['z0']) / 2, b['h'] / 2
    e.location = ((b['x0'] + b['x1']) / 2, -(b['z0'] + b['z1']) / 2, hh); e.scale = (hx, hz, hh); e['kb_col'] = 'box'
    cc.objects.link(e); col_added += 1
col_stale = [e.name for k, e in have.items() if k not in want]
if DEL:
    for n in col_stale:
        bpy.data.objects.remove(bpy.data.objects[n])

result = {'material_changed': changed, 'added': added, 'new_materials': created_mats,
          'stale_objects' + ('_deleted' if DEL else ''): stale[:50], 'stale_count': len(stale),
          'colliders_added': col_added, 'stale_colliders': col_stale}
