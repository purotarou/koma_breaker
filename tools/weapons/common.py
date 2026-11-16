def weapon_scene(nm):
    c=coll('Wpn_'+nm)
    sc=bpy.data.scenes.get(nm) or bpy.data.scenes.new(nm)
    if c.name not in sc.collection.children: sc.collection.children.link(c)
    for o in list(c.objects): bpy.data.objects.remove(o)
    root=bpy.data.objects.new('Wpn_'+nm,None); root.empty_display_size=0.05; c.objects.link(root)
    return c,root
RX=lambda a:Matrix.Rotation(a,4,'X'); RY=lambda a:Matrix.Rotation(a,4,'Y'); RZ=lambda a:Matrix.Rotation(a,4,'Z'); T=lambda *v:Matrix.Translation(v)
def ring(prof,segs=32):
    """closed profile loop [(r,h)] spun around Z (ring/bezel)."""
    bm=lathe([(r,h,0) for r,h in prof]+[(prof[0][0],prof[0][1],0)],segs,cap=False)
    bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=1e-6); bmesh.ops.recalc_face_normals(bm,faces=bm.faces); return bm
def gem_on(axis_m, r, flat, base, bez_in, bez_out, bez_h, bm_bez, bm_gem, gm_segs=24):
    """bezel ring + flattened gem on local Z axis, then transformed by axis_m."""
    b=ring([(bez_in,0),(bez_out,0),(bez_out,bez_h*0.8),(bez_out-0.15*(bez_out-bez_in),bez_h),(bez_in+0.2*(bez_out-bez_in),bez_h),(bez_in,bez_h*0.75)],gm_segs+8)
    xf(b,axis_m@T(0,0,base)); merge(bm_bez,b)
    g=uvsphere(r,gm_segs,12,1,1,flat); xf(g,axis_m@T(0,0,base+bez_h*0.55)); merge(bm_gem,g)
