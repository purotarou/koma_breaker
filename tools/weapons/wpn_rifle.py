c,root=weapon_scene('Rifle')
s=0.000467; P=lambda pts:PX(pts,1270,330,s); Y=lambda px:(1270-px)*s; Z=lambda py:(330-py)*s
navy=M('wpn_rifle_navy',(0.15,0.20,0.40),gloss=0.35,rim=0.2)
gold=M('wpn_gold_bright',(0.96,0.77,0.28),gloss=0.7,rim=0.3)
cream=M('wpn_rifle_cream',(0.96,0.93,0.84),gloss=0.3)
wood=M('wpn_wood_light',(0.93,0.80,0.60),kb_mat=2,gloss=0.2)
grain=M('wpn_wood_grain',(0.80,0.63,0.43))
cloudm=M('wpn_cloud_cream',(0.97,0.94,0.86),flags=1)
slot=M('wpn_slot_dark',(0.10,0.10,0.18))
gem=bpy.data.materials['wpn_gem']
zc=Z(230)
# ---- gold parts ----
G=bmesh.new()
he=(215-20)*s; cl=(215-175)*s
mb=lathe([(0,0,0),(0.0234,0,0),(0.0234,cl,0),(0.0188,cl,0),(0.0188,he-0.004,0),(0.0172,he,0),(0.0085,he,1),(0.0085,he-0.02,1),(0,he-0.02,1)],28)
xf(mb,T(0,Y(215),zc)@RX(-math.pi/2)); merge(G,mb)
rg=lathe([(0,0,0),(0.0205,0,0),(0.0215,0.003,0),(0.0215,(390-355)*s-0.003,0),(0.0205,(390-355)*s,0),(0,(390-355)*s,0)],28)
xf(rg,T(0,Y(390),zc)@RX(-math.pi/2)); merge(G,rg)
merge(G,slab(P([(412,150),(462,150),(462,278),(412,278)]),-0.032,0.032,bevel=0.004))
merge(G,slab(P([(1195,150),(1212,108),(1295,100),(1320,118),(1405,118),(1448,138),(1455,152)]),-0.024,0.024,bevel=0.004))
cu=ring([(0.025,0),(0.0335,0),(0.0335,0.012),(0.031,0.016),(0.026,0.016)],32); xf(cu,T(0,Y(1362),Z(108))); merge(G,cu)
merge(G,decal([P(ribbon([(770,262),(922,262),(972,196),(1110,196),(1150,250),(1222,252),(1242,298)],24)),P(ribbon([(905,140),(968,196)],20))],0.032,0.0016))
merge(G,slab(P(ribbon([(1192,300),(1210,382),(1340,384),(1366,350)],16)),-0.009,0.009))
merge(G,slab(P(ribbon([(1290,320),(1302,346),(1296,368),(1280,378)],13,7)),-0.006,0.006))
merge(G,slab(P([(1552,156),(1598,160),(1600,330),(1556,306)]),-0.034,0.034,bevel=0.003))
merge(G,slab(P([(1878,170),(1903,170),(1903,490),(1878,480)]),-0.034,0.034,bevel=0.003))
finish('AR_Gold',G,[gold,slot],c,smooth=30,parent=root)
# muzzle slots
SL=bmesh.new()
for py in (210,250):
    for sg in (1,-1):
        b=slab(P(ribbon([(55,py),(140,py)],13)),0.012*sg,0.0186*sg if py==210 else 0.0186*sg); merge(SL,b)
finish('AR_Slots',SL,[slot],c,parent=root)
# ---- navy parts (+ gold-framed mag & grip: mat0 gold rim, mat1 navy panel) ----
N=bmesh.new()
br=lathe([(0,0,0),(0.014,0,0),(0.014,(415-215)*s,0),(0,(415-215)*s,0)],24); xf(br,T(0,Y(415),zc)@RX(-math.pi/2)); merge(N,br)
merge(N,slab(P([(460,150),(905,140),(905,272),(460,272)]),-0.030,0.030,bevel=0.004))
merge(N,slab(P([(900,138),(1490,146),(1550,172),(1562,300),(1300,302),(1240,322),(1190,302),(900,300)]),-0.032,0.032,bevel=0.005))
merge(N,slab(P([(1900,166),(1960,166),(1986,190),(1990,470),(1966,496),(1900,492)]),-0.035,0.035,bevel=0.006))
finish('AR_Body',N,[navy],c,smooth=30,parent=root)
F=bmesh.new()
for poly,hw in (([(965,262),(1110,262),(1095,342),(1000,566),(816,534)],0.026),
                ([(1225,318),(1362,318),(1552,505),(1548,552),(1472,590),(1420,580),(1268,410)],0.027)):
    b=slab(P(poly),-hw,hw,bevel=0.003); side_panels(b,0.0075,0.0015,1,minarea=0.003); merge(F,b)
finish('AR_MagGrip',F,[gold,navy],c,smooth=30,parent=root)
finish('AR_Guard',slab(P([(403,272),(895,272),(906,300),(862,356),(420,348),(403,332)]),-0.031,0.031,bevel=0.005),[cream],c,smooth=30,parent=root)
finish('AR_Stock',slab(P([(1560,166),(1880,176),(1880,480),(1600,328),(1562,306)]),-0.030,0.030,bevel=0.005),[wood],c,smooth=30,parent=root)
gl=[bez((1620,200),(1700,205),(1780,215),(1860,212),10),bez((1640,240),(1720,250),(1790,262),(1865,268),10),bez((1700,300),(1760,320),(1810,340),(1868,350),10),bez((1760,380),(1800,400),(1835,420),(1868,430),8)]
finish('AR_Grain',decal([P(ribbon(p,5,3)) for p in gl],0.030,0.0008),[grain],c,parent=root)
# cream clouds
def flat(polys,cy,k): return [[(x,cy+(y-cy)*k) for x,y in p] for p in polys]
CL=[P(p) for p in flat(cloud(545,222,145,1,0.27),222,0.6)]
CR=[P(p) for p in flat(cloud(1415,228,120,-1,0.27),228,0.6)]
merge_bm=decal(CL,0.030,0.0012); merge(merge_bm,decal(CR,0.0336,0.0012))
finish('AR_Clouds',merge_bm,[cloudm],c,parent=root)
o=uvsphere(0.031,32,16); xf(o,T(0,Y(1362),Z(70)))
finish('AR_Orb',o,[gem],c,parent=root)
