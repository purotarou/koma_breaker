c,root=weapon_scene('Katana')
silver=M('wpn_blade',(0.92,0.94,0.97),gloss=0.9,rim=0.3)
hamon=M('wpn_hamon',(0.42,0.88,0.97),gloss=0.6,flags=1)
gold=M('wpn_gold',(0.90,0.70,0.32),gloss=0.7,rim=0.3)
navy=M('wpn_navy',(0.13,0.16,0.34),gloss=0.15)
white=M('wpn_wrap_white',(0.96,0.96,0.95))
gem=bpy.data.materials['wpn_gem']
s=0.000513; Y=lambda px:(1500-px)*s; Z=lambda py:(366.5-py)*s
# ---- blade: stations along the length, hamon band built into the geometry ----
NS=170; uk=0.84
bm=bmesh.new(); st=[]
for i in range(NS+1):
    u=i/NS; px=1310-1285*u
    sp=305-8*u-25*u**6
    e0=428-15*uk
    if u<=uk: ed=428-15*u
    else:
        t=(u-uk)/(1-uk); ed=e0-(e0-272)*(1-math.sqrt(max(0,1-t*t)))
    y=Y(px); zs=Z(sp); ze=Z(ed)
    if i==NS:
        st.append([bm.verts.new((0,y,zs))]); break
    hf=0.36+0.075*math.sin(2*math.pi*u*11.5)
    if u>uk: hf=hf*(1-(u-uk)/(1-uk))+0.5*((u-uk)/(1-uk))
    zh=ze+hf*(zs-ze); zr=zs-0.3*(zs-ze)
    k=1-0.55*u  # thinner toward the tip
    ts,tr=0.0036*k,0.0047*k; f=(zr-zh)/max(zr-ze,1e-6); th=tr*(1-f)+0.0004*f
    pts=[(-ts,zs),(-tr,zr),(-th,zh),(0,ze),(th,zh),(tr,zr),(ts,zs)]
    st.append([bm.verts.new((x,y,z)) for x,z in pts])
mi=[0,0,1,1,0,0,0]   # band k->k+1 (closed loop, last = spine top)
for i in range(NS):
    a=st[i]; b=st[i+1]
    for k in range(7):
        k2=(k+1)%7
        if len(b)==1: f=bm.faces.new((a[k],a[k2],b[0]))
        else: f=bm.faces.new((a[k],a[k2],b[k2],b[k]))
        f.material_index=mi[k]
bm.faces.new(list(reversed(st[0])))
bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
finish('Katana_Blade',bm,[silver,hamon],c,smooth=40,parent=root)
# ---- habaki + tsuba (gold rim, navy face, gold clouds) + fuchi/kashira ----
G=bmesh.new()
merge(G,slab(PX([(1298,296),(1346,288),(1346,441),(1298,436)],1500,366.5,s),-0.0078,0.0078,bevel=0.0018))
yt=Y(1362); zt=0.0
rim=ring([(0.085,-0.0115),(0.0995,-0.0115),(0.1045,-0.007),(0.1045,0.007),(0.0995,0.0115),(0.085,0.0115)],56)
xf(rim,T(0,yt,zt)@RX(-math.pi/2)); merge(G,rim)
N=bmesh.new()
d=lathe([(0,-0.0085,0),(0.0875,-0.0085,0),(0.0875,0.0085,0),(0,0.0085,0)],56); xf(d,T(0,yt,zt)@RX(-math.pi/2)); merge(N,d)
# clouds on both faces (plane y = yt +- 0.0085). slab pts (p,q) -> world x=-p, z=q after RZ(90)
for face,sg in ((yt+0.0085,1),(yt-0.0085-0.0016,-1)):
    polys=cloud(-0.038,0.03+zt,0.046,1,0.26)+cloud(0.034,-0.032+zt,0.05,-1,0.26)
    for p in polys:
        sl=bmesh.new(); flatpoly(sl,[(sg*x,z) for x,z in p],0.0016 if sg>0 else 0,sg); xf(sl,T(0,face,0)@RZ(math.pi/2)); merge(G,sl)
# fuchi collar + kashira band
fu=lathe([(0,0,0),(0.032,0,0),(0.0338,0.003,0),(0.0338,0.013,0),(0.032,0.016,0),(0,0.016,0)],32); xf(fu,T(0,yt-0.0065,0)@RX(math.pi/2)@Matrix.Diagonal((0.82,1.08,1,1))); merge(G,fu)
kb=lathe([(0,0,0),(0.032,0,0),(0.0338,0.003,0),(0.0338,0.014,0),(0.032,0.017,0),(0,0.017,0)],32); xf(kb,T(0,Y(1885),0)@RX(-math.pi/2)@Matrix.Diagonal((0.82,1.08,1,1))); merge(G,kb)
kn=uvsphere(0.036,32,16,0.82,0.72,1.0); xf(kn,T(0,Y(1928),0)); merge(G,kn)
gm=bmesh.new(); bz=bmesh.new()
for sg in (1,-1): gem_on(T(0,Y(1932),0)@RY(sg*math.pi/2),0.0165,0.55,0.021,0.016,0.022,0.012,bz,gm)
merge(G,bz)
finish('Katana_Gold',G,[gold],c,parent=root)
finish('Katana_Tsuba',N,[navy],c,parent=root)
finish('Katana_Gem',gm,[gem],c,parent=root)
# ---- tsuka (handle): superellipse section, navy, white diamonds on the sides ----
ax,az,ne=0.0255,0.0345,3.0
def se(t):
    ct,stt=math.cos(t),math.sin(t)
    return ax*math.copysign(abs(ct)**(2/ne),ct), az*math.copysign(abs(stt)**(2/ne),stt)
y0,y1=yt-0.010,Y(1888); H=bmesh.new(); rings=[]; NR=24; SEG=32
for i in range(NR+1):
    y=y0+(y1-y0)*i/NR; bul=1+0.04*math.sin(math.pi*i/NR)
    rings.append([H.verts.new((se(2*math.pi*k/SEG)[0]*bul,y,se(2*math.pi*k/SEG)[1]*bul)) for k in range(SEG)])
for i in range(NR):
    for k in range(SEG): H.faces.new((rings[i][k],rings[i][(k+1)%SEG],rings[i+1][(k+1)%SEG],rings[i+1][k]))
H.faces.new(rings[0]); H.faces.new(list(reversed(rings[-1])))
bmesh.ops.recalc_face_normals(H,faces=H.faces)
finish('Katana_Handle',H,[navy],c,parent=root)
def xs(z,y):   # handle surface x at height z (positive side)
    bul=1+0.04*math.sin(math.pi*(y-y0)/(y1-y0)); zz=min(abs(z)/(az*bul),0.999)
    return ax*bul*(1-zz**ne)**(1/ne)
W=bmesh.new(); n=5; L=(y0-y1); hl=L/n/2*0.86; hz=az*0.86
for j in range(n):
    yc=y0-(j+0.5)*L/n
    for sg in (1,-1):
        def fn(a,b,yc=yc,sg=sg):
            dy=hl*(a-b)/2*2/2*2; dz=hz*(a+b)/2
            y=yc+hl*(a-b)/2; return Vector((sg*(xs(dz,y)+0.0007),y,dz))
        p=surf_patch(fn,5,5)
        if sg<0: bmesh.ops.reverse_faces(p,faces=p.faces)
        merge(W,p)
finish('Katana_Wrap',W,[white],c,smooth=60,parent=root)
