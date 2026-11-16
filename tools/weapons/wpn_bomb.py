
c,root=weapon_scene('Bomb')
red=M('wpn_bomb_red',(0.87,0.24,0.13),gloss=0.55,rim=0.25)
dark=M('wpn_bomb_inner',(0.36,0.07,0.05))
rope=M('wpn_rope_gold',(0.97,0.76,0.30),kb_mat=6,gloss=0.2)
fuse=M('wpn_fuse',(0.97,0.89,0.68),kb_mat=6)
gem=M('wpn_gem',(0.10,0.80,0.80),gloss=1.0,rim=0.5)

R=0.098
prof=[(0,-0.108,0),(0.050,-0.108,0),(0.054,-0.104,0),(0.055,-0.094,0),(0.053,-0.090,0)]
a0=math.asin(-0.0895/R); a1=math.asin(0.0855/R)
for i in range(27):
    a=a0+(a1-a0)*i/26; prof.append((R*math.cos(a),R*math.sin(a),0))
prof+=[(0.046,0.088,0),(0.046,0.106,0),(0.049,0.108,0),(0.049,0.114,0),(0.046,0.116,0),(0.036,0.116,1),(0.034,0.102,1),(0,0.102,1)]
finish('Bomb_Body',lathe(prof,40),[red,dark],c,parent=root)

g=uvsphere(0.03,24,12); xf(g,Matrix.Translation((0,0,0.106)))
finish('Bomb_Gem',g,[gem],c,parent=root)

bm=bmesh.new(); Rc=0.1005; b=0.0105; tw=13; N=tw*12
for k in range(3):
    pts=[];nrm=[]
    for i in range(N):
        t=2*math.pi*i/N; ph=tw*t+k*2*math.pi/3
        rad=Vector((math.cos(t),math.sin(t),0)); d=math.cos(ph)*rad+math.sin(ph)*Vector((0,0,1))
        pts.append(Vector((Rc*math.cos(t),Rc*math.sin(t),-0.002))+b*d); nrm.append(d)
    merge(bm,tube(pts,0.0112,7,closed=True,normals=nrm))
finish('Bomb_Rope',bm,[rope],c,smooth=60,parent=root)

P=[Vector((x,0,z)) for x,z in bez((0.0,0.115),(0.002,0.16),(0.02,0.185),(0.056,0.18),28)]
bm=bmesh.new()
for k in range(2):
    pts=[];nrm=[]
    for i,p in enumerate(P):
        Tg=(P[min(i+1,27)]-P[max(i-1,0)]).normalized(); N0=Vector((0,1,0)); B0=Tg.cross(N0)
        ph=2*math.pi*4*i/27+k*math.pi; d=math.cos(ph)*N0+math.sin(ph)*B0
        pts.append(p+0.0042*d); nrm.append(d)
    merge(bm,tube(pts,0.0058,8,normals=nrm))
finish('Bomb_Fuse',bm,[fuse],c,smooth=60,parent=root)
