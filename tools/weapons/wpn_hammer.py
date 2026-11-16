c,root=weapon_scene('Hammer')
steel=M('wpn_steel',(0.72,0.74,0.78),gloss=0.85,rim=0.3)
dsteel=M('wpn_steel_dark',(0.30,0.32,0.36),gloss=0.4)
red=M('wpn_red',(0.86,0.14,0.12),gloss=0.4)
wood=M('wpn_wood_handle',(0.74,0.43,0.23),kb_mat=2,gloss=0.1)
gem=bpy.data.materials['wpn_gem']
yh=0.84; zh=0.024   # head centre (handle axis = Y, z=0)
prof=[(0,-0.165,2),(0.104,-0.165,2),(0.106,-0.18,0),(0.118,-0.18,0),(0.127,-0.172,0),(0.128,-0.125,0),
      (0.132,-0.121,1),(0.132,-0.094,1),(0.128,-0.091,0),(0.128,0.105,1),(0.132,0.108,1),(0.132,0.131,0),
      (0.137,0.137,0),(0.149,0.149,0),(0.151,0.163,0),(0.143,0.176,0),(0.13,0.18,0),(0,0.18,0)]
h=lathe(prof,48); xf(h,T(0,yh,zh))
# rivets on the rim chamfer
for i in range(14):
    a=2*math.pi*(i+0.5)/14; n=Vector((math.cos(a),math.sin(a),0.9)).normalized()
    s=uvsphere(0.0105,12,6); xf(s,T(0,yh,zh)@T(0.147*math.cos(a),0.147*math.sin(a),0.170)@n.to_track_quat('Z','X').to_matrix().to_4x4()@Matrix.Diagonal((1,1,0.75,1)))
    merge(h,s)
bzh=bmesh.new(); gm=bmesh.new()
for sgn in (1,-1):
    gem_on(T(0,yh,zh+0.014)@RY(sgn*math.pi/2),0.044,0.45,0.108,0.044,0.058,0.034,bzh,gm)
merge(h,setmat(bzh,0))
finish('Hammer_Head',h,[steel,red,dsteel],c,parent=root)
finish('Hammer_Gem',gm,[gem],c,parent=root)
# octagonal wooden handle + peg through the head + red end cap
oct8=lambda L,r:lathe([(0,0,0),(r,0,0),(r,L,0),(0,L,0)],8)
hd=oct8(yh+0.11,0.040); xf(hd,T(0,-0.11,0)@RX(-math.pi/2)@RZ(math.pi/8))
pg=lathe([(0,0,0),(0.042,0,0),(0.042,0.152,0),(0.039,0.158,0),(0,0.158,0)],8); xf(pg,T(0,yh,0)@RX(-math.pi/2)@RZ(math.pi/8))
merge(hd,pg)
finish('Hammer_Handle',hd,[wood],c,smooth=30,parent=root)
cp=lathe([(0,0,0),(0.042,0,0),(0.046,0.004,0),(0.046,0.058,0),(0.043,0.064,0),(0,0.064,0)],24); xf(cp,T(0,-0.17,0)@RX(-math.pi/2))
finish('Hammer_Cap',cp,[red],c,parent=root)
