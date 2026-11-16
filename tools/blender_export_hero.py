"""Export the skinned hero (blender/hero_kakeru.blend) to assets/hero_kakeru.glb (+ .glb.js) for js/hero.js.

Run from the Blender MCP with the .blend open (in a separate call from the one that opened it):
    exec(open('/Users/umeyamanaoki/koma_breaker/tools/blender_export_hero.py').read(), {'OUT': '/Users/umeyamanaoki/koma_breaker/assets/hero_kakeru.glb'})

What it writes (a small hand-built glTF, not Blender's exporter, so the game only has to read what it needs):
  * one mesh, two primitives sharing the vertex data:
      0 'head'  - faces whose strongest bone is 'head' (hair, face, headband).  material kbh_tex  (kb_mat 10: textured)
      1 'body'  - everything else.                                              material kbh_team (kb_mat 11: textured, the coat red becomes the player colour)
    attributes POSITION / NORMAL / TEXCOORD_0 / JOINTS_0 (u8 x4) / WEIGHTS_0 (f32 x4, normalised), indices u16.
  * the baked texture (kk_tex, saved as blender/hero_kakeru_tex.png) as images[0], JPEG via macOS sips (PNG if that fails).
  * the skeleton as extras.kb_bones = [{name, parent (index or -1), head: [x,y,z]}], heads in model space at rest.
    The game poses bones by rotating about their heads (no rest orientation needed), see js/hero.js.
Axes: Blender Z-up / front -Y  ->  glTF Y-up / front +Z  (x, y, z) -> (x, z, -y).  The character's right is -X.
"""
import bpy, struct, json, base64, os

OUT = globals().get('OUT', '/Users/umeyamanaoki/koma_breaker/assets/hero_kakeru.glb')
MESH, RIG, IMG = 'KK_Hero', 'KK_Rig', 'kk_tex'

ob = bpy.data.objects[MESH]; rig = bpy.data.objects[RIG]; me = ob.data
bones = list(rig.data.bones)
bidx = {b.name: i for i, b in enumerate(bones)}
g2b = {g.index: bidx[g.name] for g in ob.vertex_groups if g.name in bidx}
cv = lambda v: (v[0], v[2], -v[1])

me.calc_loop_triangles()
uvl = me.uv_layers.active.data
head_b = bidx['head']
verts, key2i = [], {}
idx = [[], []]
for tri in me.loop_triangles:
    out = []
    for li, vi in zip(tri.loops, tri.vertices):
        u, v = uvl[li].uv
        k = (vi, round(u, 6), round(v, 6))
        if k not in key2i:
            key2i[k] = len(verts); verts.append((vi, u, 1.0 - v))
        out.append(key2i[k])
    # strongest bone of the face (by summed weights) decides the primitive
    acc = {}
    for vi in tri.vertices:
        for g in me.vertices[vi].groups:
            b = g2b.get(g.group)
            if b is not None: acc[b] = acc.get(b, 0) + g.weight
    prim = 0 if acc and max(acc, key=acc.get) == head_b else 1
    idx[prim] += out
assert len(verts) < 65536

P, N, UV, JN, WT = bytearray(), bytearray(), bytearray(), bytearray(), bytearray()
mn, mx = [1e9] * 3, [-1e9] * 3
for vi, u, v in verts:
    mv = me.vertices[vi]
    p = cv(mv.co); n = cv(mv.normal)
    for a in range(3): mn[a] = min(mn[a], p[a]); mx[a] = max(mx[a], p[a])
    P += struct.pack('<3f', *p); N += struct.pack('<3f', *n); UV += struct.pack('<2f', u, v)
    gs = sorted(((g.weight, g2b[g.group]) for g in mv.groups if g.group in g2b and g.weight > 0.001), reverse=True)[:4]
    s = sum(w for w, _ in gs) or 1.0
    gs += [(0.0, 0)] * (4 - len(gs))
    JN += struct.pack('<4B', *[b for _, b in gs]); WT += struct.pack('<4f', *[w / s for w, _ in gs])
I0 = struct.pack('<%dH' % len(idx[0]), *idx[0]); I1 = struct.pack('<%dH' % len(idx[1]), *idx[1])

# The texture is read from blender/hero_kakeru_tex.png (kept next to the .blend; save kk_tex there after editing it).
TEX = globals().get('TEX', os.path.join(os.path.dirname(OUT), '..', 'blender', 'hero_kakeru_tex.png'))
tmp = bpy.app.tempdir + 'kk_tex_export.png'
open(tmp, 'wb').write(open(TEX, 'rb').read())
PNG, MIME = open(tmp, 'rb').read(), 'image/png'
# JPEG keeps the download small for iPad (~0.3 MB instead of ~1.5 MB). macOS sips; falls back to PNG elsewhere.
try:
    import subprocess
    jpg = tmp[:-4] + '.jpg'
    subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '88', tmp, '--out', jpg], check=True, capture_output=True)
    PNG, MIME = open(jpg, 'rb').read(), 'image/jpeg'
except Exception:
    pass

bin_, views = bytearray(), []
def view(data, target=None):
    while len(bin_) % 4: bin_.append(0)
    v = {'buffer': 0, 'byteOffset': len(bin_), 'byteLength': len(data)}
    if target: v['target'] = target
    bin_.extend(data); views.append(v); return len(views) - 1
nv = len(verts)
acc = [
    {'bufferView': view(P, 34962), 'componentType': 5126, 'count': nv, 'type': 'VEC3', 'min': mn, 'max': mx},
    {'bufferView': view(N, 34962), 'componentType': 5126, 'count': nv, 'type': 'VEC3'},
    {'bufferView': view(UV, 34962), 'componentType': 5126, 'count': nv, 'type': 'VEC2'},
    {'bufferView': view(JN, 34962), 'componentType': 5121, 'count': nv, 'type': 'VEC4'},
    {'bufferView': view(WT, 34962), 'componentType': 5126, 'count': nv, 'type': 'VEC4'},
    {'bufferView': view(I0, 34963), 'componentType': 5123, 'count': len(idx[0]), 'type': 'SCALAR'},
    {'bufferView': view(I1, 34963), 'componentType': 5123, 'count': len(idx[1]), 'type': 'SCALAR'},
]
imgv = view(PNG)
attrs = {'POSITION': 0, 'NORMAL': 1, 'TEXCOORD_0': 2, 'JOINTS_0': 3, 'WEIGHTS_0': 4}
kb_bones = [{'name': b.name, 'parent': bidx[b.parent.name] if b.parent else -1, 'head': [round(c, 5) for c in cv(b.head_local)]} for b in bones]
J = {
    'asset': {'version': '2.0', 'generator': 'koma_breaker tools/blender_export_hero.py'},
    'scene': 0, 'scenes': [{'nodes': [0]}],
    'nodes': [{'name': 'Hero', 'mesh': 0}],
    'meshes': [{'name': 'Hero', 'primitives': [
        {'attributes': attrs, 'indices': 5, 'material': 0},
        {'attributes': attrs, 'indices': 6, 'material': 1}]}],
    'materials': [
        {'name': 'kbh_tex', 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}}, 'extras': {'kb_mat': 10}},
        {'name': 'kbh_team', 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}}, 'extras': {'kb_mat': 11}}],
    'textures': [{'source': 0}], 'images': [{'bufferView': imgv, 'mimeType': MIME}],
    'buffers': [{'byteLength': 0}], 'bufferViews': views, 'accessors': acc,
    'extras': {'kb_bones': kb_bones},
}
while len(bin_) % 4: bin_.append(0)
J['buffers'][0]['byteLength'] = len(bin_)
js = json.dumps(J, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bin_)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(bin_), 0x004E4942) + bytes(bin_)
open(OUT, 'wb').write(glb)
key = 'assets/' + os.path.basename(OUT)
with open(OUT + '.js', 'w') as g:
    g.write("KB_GLB['%s']='%s';\n" % (key, base64.b64encode(glb).decode('ascii')))
result = {'verts': nv, 'tris_head': len(idx[0]) // 3, 'tris_body': len(idx[1]) // 3, 'bytes': len(glb), 'png': len(PNG), 'bones': len(bones)}
