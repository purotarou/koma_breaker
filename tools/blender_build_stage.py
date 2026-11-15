"""One-time migration: rebuild a code-generated stage (buildStage1Code / buildStage2Code) in Blender.

Input: JSON from `node tools/dump_stage.js <1-5> out.json` (instances, unit-primitive geometry, colliders).
Run inside Blender (in an empty file):
    exec(open('tools/blender_build_stage.py').read(), {'DUMP': '/path/stage1.json', 'SCENE': 'Stage_Shrine', 'ROOT': 'Shrine'})

Conventions (read by js/glb.js):
  * Game space is Y-up; Blender is Z-up.  game(x,y,z) -> blender(x,-z,y).  The glTF exporter (+Y up) converts back.
  * Material colour = Principled Base Color (raw game value, not colour-managed).
  * Material custom props: kb_mat (procedural pattern 0-9), kb_gloss, kb_flags (1 unlit, 2 no-edge, 4 no-cast, 8 sway, 16 cloth, 32 drift, 64 flame), kb_rim.
  * Colliders are Empties with custom prop kb_col: 'cyl' (CIRCLE empty, scale = r,r,h) or 'box' (CUBE empty, half extents, sits on the ground).
"""
import bpy, json, bmesh
from mathutils import Matrix, Vector

D = json.load(open(DUMP))
C = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))  # game -> blender
CI = C.inverted()

SCN_NAME = SCENE
scn = bpy.data.scenes.get(SCN_NAME) or bpy.data.scenes.new(SCN_NAME)
root = bpy.data.collections.new(ROOT)
scn.collection.children.link(root)

def coll(name, parent=root):
    c = bpy.data.collections.new(name)
    parent.children.link(c)
    return c

# ---- unit primitive meshes (identical triangles + normals to js/gfx.js) ----
meshes = {}
for name, a in D['geo'].items():
    vmap, verts, faces, lnorm = {}, [], [], []
    for t in range(0, len(a), 18):
        f = []
        for k in range(3):
            o = t + k * 6
            p = C.to_3x3() @ Vector(a[o:o + 3])
            key = tuple(round(v, 5) for v in p)
            if key not in vmap:
                vmap[key] = len(verts); verts.append(p)
            f.append(vmap[key])
            lnorm.append(C.to_3x3() @ Vector(a[o + 3:o + 6]))
        faces.append(f)
    me = bpy.data.meshes.new('KB_' + name)
    me.from_pydata(verts, [], faces)
    me.update()
    me.shade_smooth()
    me.normals_split_custom_set([n.normalized() for n in lnorm])
    me.materials.append(None)  # one slot; the material itself is linked per object
    meshes[name] = me

# ---- materials ----
cname = {}
for k, v in D['cnames']:
    cname.setdefault(tuple(round(x, 4) for x in v), k)
mats = {}
def material(i):
    key = (tuple(round(x, 4) for x in i['c']), i['mat'], i['gloss'], i['fl'], i['rim'])
    if key in mats:
        return mats[key]
    nm = 'kb_' + cname.get(key[0], 'c%02x%02x%02x' % tuple(int(round(x * 255)) for x in i['c']))
    if i['mat']: nm += '_t%d' % i['mat']
    if i['gloss']: nm += '_g%g' % i['gloss']
    if i['fl'] & 1: nm += '_unlit'
    if i['fl'] & 4: nm += '_nocast'
    if i['rim']: nm += '_rim'
    m = bpy.data.materials.new(nm)
    m.use_nodes = True
    nt = m.node_tree
    # look nodes up by type: their names are localised (e.g. a Japanese UI names it 'プリンシプルBSDF')
    bsdf = next((n for n in nt.nodes if n.bl_idname == 'ShaderNodeBsdfPrincipled'), None)
    if bsdf is None:  # Blender 5.x: new materials may start with an empty node tree
        bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
        out = next((n for n in nt.nodes if n.bl_idname == 'ShaderNodeOutputMaterial'), None) or nt.nodes.new('ShaderNodeOutputMaterial')
        out.location = (300, 0)
        nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value = (*i['c'], 1.0)
    bsdf.inputs['Roughness'].default_value = 1.0
    m.diffuse_color = (*i['c'], 1.0)
    m['kb_mat'] = int(i['mat']); m['kb_gloss'] = float(i['gloss']); m['kb_flags'] = int(i['fl']); m['kb_rim'] = float(i['rim'])
    mats[key] = m
    return m

# ---- instances ----
groups, counts = {}, {}
for i in D['inst']:
    g = i['g']
    if g not in groups: groups[g] = coll(g)
    counts[g] = counts.get(g, 0) + 1
    ob = bpy.data.objects.new('%s_%s_%03d' % (g, i['p'].lower(), counts[g]), meshes[i['p']])
    groups[g].objects.link(ob)
    m = i['m']
    M = Matrix(((m[0], m[4], m[8], m[12]), (m[1], m[5], m[9], m[13]), (m[2], m[6], m[10], m[14]), (0, 0, 0, 1)))
    ob.matrix_world = C @ M @ CI
    ob.material_slots[0].link = 'OBJECT'
    ob.material_slots[0].material = material(i)

# ---- colliders ----
cc = coll('Colliders')
for n, c in enumerate(D['colC']):
    e = bpy.data.objects.new('COL_cyl_%02d' % n, None)
    e.empty_display_type = 'CIRCLE'
    e.location = (c['x'], -c['z'], 0.0)
    e.scale = (c['r'], c['r'], c['h'])
    e['kb_col'] = 'cyl'
    cc.objects.link(e)
for n, b in enumerate(D['colB']):
    e = bpy.data.objects.new('COL_box_%02d' % n, None)
    e.empty_display_type = 'CUBE'
    hx, hz, hh = (b['x1'] - b['x0']) / 2, (b['z1'] - b['z0']) / 2, b['h'] / 2
    e.location = ((b['x0'] + b['x1']) / 2, -(b['z0'] + b['z1']) / 2, hh)
    e.scale = (hx, hz, hh)
    e['kb_col'] = 'box'
    cc.objects.link(e)

result = {'objects': sum(counts.values()), 'materials': len(mats), 'groups': counts, 'colliders': len(D['colC']) + len(D['colB'])}
