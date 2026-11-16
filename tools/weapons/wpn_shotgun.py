c,root=weapon_scene('Shotgun')
s=0.000494; P=lambda pts:PX(pts,1150,330,s); Y=lambda px:(1150-px)*s; Z=lambda py:(330-py)*s
pink=M('wpn_sakura_pink',(0.94,0.55,0.62),gloss=0.4,rim=0.2)
pale=M('wpn_sakura_pale',(0.99,0.93,0.91),gloss=0.4,rim=0.2)
brown=M('wpn_sakura_brown',(0.48,0.24,0.18),kb_mat=2,gloss=0.3)
groove=M('wpn_sakura_groove',(0.30,0.13,0.10))
barrel=M('wpn_barrel_dark',(0.28,0.19,0.17),gloss=0.6,rim=0.2)
bore=M('wpn_bore',(0.09,0.06,0.06))
fpink=M('wpn_flower_pink',(0.91,0.38,0.47),flags=1)
fwhite=M('wpn_flower_white',(1.0,0.97,0.97),flags=1)
fcore=M('wpn_flower_core',(0.86,0.30,0.40),flags=1)
gold=bpy.data.materials['wpn_gold']; gem=bpy.data.materials['wpn_gem']
# barrels (stacked double)
B=bmesh.new(); L=(160-35)*s
for py in (150,290):
    prof=[(0,0,0),(0.033,0,0),(0.033,L-0.007,0),(0.0348,L-0.005,0),(0.0348,L,0),(0.021,L,1),(0.021,L-0.035,1),(0,L-0.035,1)]
    b=lathe(prof,32); xf(b,T(0,Y(160),Z(py))@RX(-math.pi/2)); merge(B,b)
finish('SG_Barrels',B,[barrel,bore],c,parent=root)
# pink body parts (mat0 pink, mat1 pale panel)
K=bmesh.new()
merge(K,slab(P([(145,62),(165,44),(232,44),(232,358),(165,358),(145,340)]),-0.044,0.044,bevel=0.006))
sh=slab(P([(232,52),(768,52),(768,236),(232,236)]),-0.040,0.040,bevel=0.006); side_panels(sh,0.008,0.001,1,minarea=0.01); merge(K,sh)
merge(K,slab(P([(232,236),(768,236),(768,300),(345,300),(345,352),(232,352)]),-0.039,0.039,bevel=0.005))
rc=slab(P([(792,40),(1075,52),(1120,92),(1255,188),(1262,335),(1150,345),(990,345),(905,302),(792,302)]),-0.038,0.038,bevel=0.006); merge(K,rc)
merge(K,slab(P([(805,30),(1055,30),(1072,48),(795,48)]),-0.022,0.022,bevel=0.004))
merge(K,slab(P([(1240,190),(1330,252),(1400,214),(1925,125),(1945,138),(1950,556),(1700,572),(1460,590),(1330,600),(1255,335)]),-0.032,0.032,bevel=0.006))
# pale decals: diagonal sashes on receiver
merge(K,decal([P([(800,48),(1068,58),(1098,86),(985,150),(880,226),(800,248)]),P([(1005,196),(1128,112),(1170,140),(1048,236)])],0.038,0.0015,mi=1))
finish('SG_Body',K,[pink,pale],c,smooth=30,parent=root)
# pink torn patch on the pale shroud panel
patch=P([(240,62),(430,62),(470,92),(425,118),(560,138),(515,172),(605,198),(565,228),(240,228)])
# brown parts
Bw=bmesh.new()
merge(Bw,slab(P([(345,318),(372,292),(905,292),(910,322),(882,442),(372,442),(345,420)]),-0.046,0.046,bevel=0.006))
merge(Bw,slab(P([(760,36),(793,36),(793,304),(760,304)]),-0.043,0.043,bevel=0.004))
merge(Bw,slab(P([(1255,300),(1335,300),(1420,420),(1480,555),(1440,594),(1305,606),(1225,600),(1205,500),(1180,420),(1200,350)]),-0.034,0.034,bevel=0.007))
merge(Bw,slab(P([(1936,120),(1972,128),(1982,562),(1945,570)]),-0.035,0.035,bevel=0.005))
outer=[(985,345),(1150,345),(1172,388),(1142,442),(1012,442),(985,412)]; inner=[(1013,368),(1128,368),(1140,390),(1118,420),(1030,420),(1013,400)]
merge(Bw,frame(P(outer),P(inner),-0.014,0.014))
finish('SG_Wood',Bw,[brown],c,smooth=30,parent=root)
Gv=bmesh.new()
for x in (585,690,795): merge(Gv,decal([P(ribbon([(x+28,322),(x,428)],11))],0.046,0.0012))
merge(Gv,slab(P(ribbon([(1082,348),(1094,376),(1088,402),(1070,412)],13,7)),-0.007,0.007))
finish('SG_Groove',Gv,[groove],c,parent=root)
# flowers & petals: (cx,cy,R,rot,colour,x-face)
FL=[(680,150,62,0.2,'p',0.0425),(1150,215,40,0.5,'w',0.0395),(965,262,24,0.9,'w',0.0395),
    (1800,245,74,0.1,'w',0.0335),(1665,318,40,0.7,'w',0.0335),(1520,300,26,0.3,'p',0.0335)]
PET=[(300,118,24,2.2,'w',0.0425),(395,185,18,0.8,'w',0.0425),(520,265,17,3.5,'p',0.0405),(860,90,16,1.0,'p',0.0395),
     (1100,300,15,2.6,'w',0.0395),(1880,190,18,2.0,'w',0.0335),(1730,420,16,4.0,'w',0.0335),(1450,260,15,1.4,'w',0.0335),(640,265,15,5.0,'w',0.0405)]
FP=bmesh.new(); FW=bmesh.new(); FC=bmesh.new()
finish('SG_Patch',decal([patch],0.041,0.0015),[pink],c,parent=root)
for cx,cy,R,rot,col,x in FL:
    merge(FP if col=='p' else FW,decal([P(p) for p in sakura(cx,cy,R,rot)],x,0.0012))
    merge(FC,decal([P(circ(cx,cy,R*0.16,12))],x+0.0012,0.0008))
    for k in range(5):
        a=rot+math.pi/5+k*2*math.pi/5
        merge(FC,decal([P(circ(cx+R*0.3*math.cos(a),cy+R*0.3*math.sin(a),R*0.05,6))],x+0.0012,0.0008))
for cx,cy,R,rot,col,x in PET:
    merge(FP if col=='p' else FW,decal([P(petal(cx,cy,R,rot))],x,0.0012))
finish('SG_FlowerPink',FP,[fpink],c,parent=root)
finish('SG_FlowerWhite',FW,[fwhite],c,parent=root)
finish('SG_FlowerCore',FC,[fcore],c,parent=root)
# white wave on the stock
cxw,cyw=1600,415; a0=math.atan2(430-cyw,1555-cxw)
path=bez((1945,515),(1760,515),(1650,475),(1555,430),14)[:-1]+spiral(cxw,cyw,45,16,a0,a0+2*math.pi*0.9,22)
WV=decal([P(ribbon(path,44,14))],0.032,0.0013)
merge(WV,decal([P(ribbon(bez((1945,545),(1780,548),(1600,560),(1480,585),12),18,5))],0.032,0.0013))
finish('SG_Wave',WV,[pale],c,parent=root)
gm=bmesh.new(); bz=bmesh.new()
for sg in (1,-1): gem_on(T(0,Y(1268),Z(365))@RY(sg*math.pi/2),0.0165,0.5,0.031,0.017,0.0245,0.008,bz,gm)
finish('SG_Bezel',bz,[gold],c,parent=root)
finish('SG_Gem',gm,[gem],c,parent=root)
