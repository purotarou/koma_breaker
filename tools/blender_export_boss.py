"""Export the final boss 白抜魔王シロヌキ (blender/boss_shiro.blend) to assets/boss_shiro.glb (+ .glb.js) for js/boss5.js.

Run from the Blender MCP with the .blend open (in a separate call from the one that opened it):
    exec(open('/Users/umeyamanaoki/koma_breaker/tools/blender_export_boss.py').read(), {'OUT': '/Users/umeyamanaoki/koma_breaker/assets/boss_shiro.glb'})

Same hand-built glTF as tools/blender_export_hero.py (read that first), with these differences:
  * three primitives sharing the vertex data, chosen by the face attribute 'grp':
      0 'body'    - the oni (skin recoloured per form in the shader: kb_mat 12-14, see js/gfx.js)
      1 'swordR'  - the sword in his right hand (weights: hand_R only)
      2 'swordL'  - the sword in his left hand  (weights: hand_L only)
  * the body was cut at x=0 (no triangle crosses the middle), and every corner of a triangle on the character's right
    (x < 0, his right = -X) gets u + 1.0. The shader uses that to paint the two halves differently in the first form
    (red / black) and samples the texture at fract(u).
  * images[0] = colour (blender/boss_shiro_tex.png, 2048 px, JPEG), images[1] = skin mask (blender/boss_shiro_mask.png,
    white = skin that changes colour, made by tools/boss_shiro_mask.py; 1024 px JPEG).
Axes: Blender Z-up / front -Y  ->  glTF Y-up / front +Z  (x, y, z) -> (x, z, -y).
"""
import bpy, struct, json, base64, os, subprocess

OUT = globals().get('OUT', '/Users/umeyamanaoki/koma_breaker/assets/boss_shiro.glb')
MESH, RIG = 'SN_Boss', 'SN_Rig'
BL = os.path.join(os.path.dirname(OUT), '..', 'blender')

ob = bpy.data.objects[MESH]; rig = bpy.data.objects[RIG]; me = ob.data
bones = list(rig.data.bones)
bidx = {b.name: i for i, b in enumerate(bones)}
g2b = {g.index: bidx[g.name] for g in ob.vertex_groups if g.name in bidx}
cv = lambda v: (v[0], v[2], -v[1])

me.calc_loop_triangles()
uvl = me.uv_layers.active.data
grp = me.attributes['grp'].data
verts, key2i = [], {}
idx = [[], [], []]
for tri in me.loop_triangles:
    g = grp[tri.polygon_index].value
    cx = sum(me.vertices[v].co.x for v in tri.vertices) / 3
    side = 1.0 if (g == 0 and cx < 0) else 0.0
    out = []
    for li, vi in zip(tri.loops, tri.vertices):
        u, v = uvl[li].uv
        k = (vi, round(u, 6), round(v, 6), side)
        if k not in key2i:
            key2i[k] = len(verts); verts.append((vi, u + side, 1.0 - v))
        out.append(key2i[k])
    idx[g] += out
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
IX = [struct.pack('<%dH' % len(i), *i) for i in idx]

def jpeg(src, size, q):
    tmp = bpy.app.tempdir + 'sn_' + os.path.basename(src)
    open(tmp, 'wb').write(open(src, 'rb').read())
    jpg = tmp[:-4] + '.jpg'
    subprocess.run(['sips', '-Z', str(size), '-s', 'format', 'jpeg', '-s', 'formatOptions', str(q), tmp, '--out', jpg], check=True, capture_output=True)
    return open(jpg, 'rb').read()
COL = jpeg(os.path.join(BL, 'boss_shiro_tex.png'), 2048, 82)
MSK = jpeg(os.path.join(BL, 'boss_shiro_mask.png'), 1024, 85)

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
] + [{'bufferView': view(I, 34963), 'componentType': 5123, 'count': len(i), 'type': 'SCALAR'} for I, i in zip(IX, idx)]
iv0, iv1 = view(COL), view(MSK)
attrs = {'POSITION': 0, 'NORMAL': 1, 'TEXCOORD_0': 2, 'JOINTS_0': 3, 'WEIGHTS_0': 4}
kb_bones = [{'name': b.name, 'parent': bidx[b.parent.name] if b.parent else -1, 'head': [round(c, 5) for c in cv(b.head_local)]} for b in bones]
J = {
    'asset': {'version': '2.0', 'generator': 'koma_breaker tools/blender_export_boss.py'},
    'scene': 0, 'scenes': [{'nodes': [0]}],
    'nodes': [{'name': 'Shironuki', 'mesh': 0}],
    'meshes': [{'name': 'Shironuki', 'primitives': [
        {'attributes': attrs, 'indices': 5 + i, 'material': 0, 'extras': {'name': n}} for i, n in enumerate(['body', 'swordR', 'swordL'])]}],
    'materials': [{'name': 'sn_tex', 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}}, 'extras': {'kb_mat': 12}}],
    'textures': [{'source': 0}, {'source': 1}],
    'images': [{'bufferView': iv0, 'mimeType': 'image/jpeg', 'name': 'color'}, {'bufferView': iv1, 'mimeType': 'image/jpeg', 'name': 'skin_mask'}],
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
result = {'verts': nv, 'tris': [len(i) // 3 for i in idx], 'bytes': len(glb), 'col': len(COL), 'mask': len(MSK), 'bones': len(bones)}
