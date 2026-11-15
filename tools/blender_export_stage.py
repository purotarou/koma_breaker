"""Export the open stage .blend to GLB for the game (js/glb.js reads it).

Run inside Blender (via Blender MCP or the Python console):
    exec(open('/path/to/koma_breaker/tools/blender_export_stage.py').read(), {'OUT': '/path/to/koma_breaker/assets/stage_shrine.glb'})
Also writes <out>.js (the GLB as base64, used when the game is opened as a file://).
Keeps custom properties (material kb_* props, collider kb_col) as glTF extras; no UVs/textures/cameras/lights.
"""
import bpy, os
out = globals().get('OUT')
bpy.ops.export_scene.gltf(
    filepath=out, export_format='GLB', use_selection=False, use_visible=False, use_active_scene=True,
    export_yup=True, export_apply=False, export_extras=True,
    export_texcoords=False, export_normals=True, export_tangents=False,
    export_materials='EXPORT', export_image_format='NONE',
    export_cameras=False, export_lights=False, export_animations=False, export_skins=False, export_morph=False,
)
# Same file as base64 in a script, for when index.html is opened straight from disk (file://) and fetch() is refused (js/glb.js loadGlbBuf).
import base64
key = 'assets/' + os.path.basename(out)
with open(out, 'rb') as f, open(out + '.js', 'w') as g:
    g.write("KB_GLB['%s']='%s';\n" % (key, base64.b64encode(f.read()).decode('ascii')))
result = {'out': out, 'bytes': os.path.getsize(out), 'js': out + '.js'}
