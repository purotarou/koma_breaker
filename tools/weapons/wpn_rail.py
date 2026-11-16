c,root=weapon_scene('Railgun')
s=0.0006; P=lambda pts:PX(pts,1450,400,s); Y=lambda px:(1450-px)*s; Z=lambda py:(400-py)*s
rdark=M('wpn_rail_dark',(0.20,0.27,0.35),gloss=0.5,rim=0.2)
rpanel=M('wpn_rail_panel',(0.42,0.60,0.76),gloss=0.7,rim=0.2)
ice=M('wpn_ice_core',(0.60,0.84,0.97),gloss=0.9,rim=0.4)
stripe=M('wpn_ice_stripe',(0.82,0.94,1.0),gloss=0.6)
icew=M('wpn_ice_white',(0.90,0.94,0.98),gloss=0.5,rim=0.2)
crys=M('wpn_ice_crystal',(0.60,0.84,0.99),gloss=0.8)
cyan=M('wpn_ice_cyan',(0.32,0.76,0.98),gloss=0.9,rim=0.3)
snow=M('wpn_snow_white',(0.98,0.99,1.0),flags=1)
gem=bpy.data.materials['wpn_gem']
D=bmesh.new()   # dark steel + raised lighter panels (mat 0 / 1)
for poly,hw in (([(110,213),(1030,213),(1030,289),(110,289)],0.030),([(110,341),(1030,341),(1030,417),(110,417)],0.030)):
    b=slab(P(poly),-hw,hw,bevel=0.004); side_panels(b,0.0055,0.0015,1,minarea=0.01); merge(D,b)
blocks=[[(25,215),(45,200),(140,200),(152,215),(152,287),(140,298),(45,298),(25,287)],
        [(25,341),(45,330),(140,330),(152,341),(152,416),(140,430),(45,430),(25,416)],
        [(1015,210),(1030,198),(1108,198),(1118,210),(1118,292),(1108,302),(1030,302),(1015,292)],
        [(1015,340),(1030,330),(1108,330),(1118,342),(1118,420),(1108,432),(1030,432),(1015,420)]]
for poly in blocks: merge(D,slab(P(poly),-0.036,0.036,bevel=0.003))
merge(D,slab(P([(28,290),(70,290),(70,340),(28,340)]),-0.026,0.026,bevel=0.002))
merge(D,slab(P([(1018,296),(1115,296),(1115,336),(1018,336)]),-0.03,0.03,bevel=0.002))
rec=slab(P([(1110,212),(1172,182),(1262,182),(1280,200),(1505,200),(1545,245),(1545,330),(1482,398),(1300,400),(1205,440),(1110,440)]),-0.040,0.040,bevel=0.004)
side_panels(rec,0.007,0.0015,1,minarea=0.02); merge(D,rec)
# angled armour plate on the receiver sides + lever
merge(D,decal([P([(1114,262),(1172,203),(1256,203),(1256,238),(1206,292),(1206,428),(1114,428)])],0.0415,0.004))
merge(D,slab(P([(1505,226),(1550,226),(1575,254),(1562,264),(1540,244),(1505,244)]),-0.012,0.012,bevel=0.002))
# trigger guard + trigger
merge(D,slab(P(ribbon([(1338,396),(1346,436),(1366,452),(1440,452),(1462,430)],13)),-0.008,0.008))
merge(D,slab(P(ribbon([(1418,400),(1430,418),(1426,438),(1412,448)],11,6)),-0.006,0.006))
# rivets
riv=[(62,247),(118,247),(62,382),(118,382),(1050,250),(1050,382),(1140,300),(1140,405),(1234,218),(1480,230),(1480,365)]
for (px,py) in riv:
    xo=0.036 if px<1120 and px not in (1140,) else 0.0455
    if px in (1480,): xo=0.0415
    for sg in (1,-1):
        r=uvsphere(0.0058,12,6,0.55,1,1); xf(r,T(sg*xo,Y(px),Z(py))); merge(D,r)
finish('Rail_Body',D,[rdark,rpanel],c,smooth=30,parent=root)
# ice core between the rails
finish('Rail_Core',slab(P([(45,287),(1030,287),(1030,343),(45,343)]),-0.019,0.019,bevel=0.003),[ice],c,parent=root)
# ice stripes on the rails
st=[]
for x0,top in ((232,True),(276,True),(752,True),(796,True),(222,False),(266,False),(700,False),(744,False)):
    y0,y1=(221,281) if top else (349,409); w=(34 if x0 in (232,752,222,700) else 14); sl=(y1-y0)*0.75
    st.append(P([(x0,y1),(x0+w,y1),(x0+w+sl,y0),(x0+sl,y0)]))
finish('Rail_Stripes',decal(st,0.0315,0.0012),[stripe],c,parent=root)
# top crystal sight
finish('Rail_Crystal',slab(P([(1345,180),(1362,164),(1488,164),(1505,180),(1505,202),(1345,202)]),-0.028,0.028,bevel=0.004),[cyan],c,parent=root)
# white-ice stock and grip, crystal shards on the stock
W=bmesh.new()
merge(W,slab(P([(1530,240),(1640,262),(1765,262),(1950,222),(1985,240),(1977,520),(1910,542),(1700,447),(1600,418),(1530,412)]),-0.032,0.032,bevel=0.005))
merge(W,slab(P([(1432,394),(1545,410),(1625,550),(1612,580),(1505,584),(1462,472)]),-0.026,0.026,bevel=0.006))
finish('Rail_Stock',W,[icew],c,smooth=30,parent=root)
sh=[]; B=(1925,525)
for ang,ln,w in ((118,215,26),(105,250,30),(92,215,24),(80,170,20),(132,170,22),(145,120,18),(70,110,16)):
    a=math.radians(ang); d=(math.cos(a),-math.sin(a)); n=(-d[1],d[0])
    bx,by=B[0]-8*math.cos(a)*0,B[1]
    tipx,tipy=bx-d[0]*ln*-1,by+d[1]*ln
    pts=[(bx,by),(bx+ (tipx-bx)*0.45+n[0]*w/2,by+(tipy-by)*0.45+n[1]*w/2),(tipx,tipy),(bx+(tipx-bx)*0.45-n[0]*w/2,by+(tipy-by)*0.45-n[1]*w/2)]
    sh.append(P(pts))
finish('Rail_Shards',decal(sh,0.032,0.0012),[crys],c,parent=root)
# snowflake
SF=[]; cx,cy,R=1232,336,40
for k in range(6):
    a=math.pi/2+k*math.pi/3; ex,ey=cx+R*math.cos(a),cy-R*math.sin(a)
    SF.append(ribbon([(cx,cy),(ex,ey)],6.5,4.5))
    for f,l in ((0.55,13),(0.8,9)):
        bx,by=cx+R*f*math.cos(a),cy-R*f*math.sin(a)
        for sgn in (1,-1):
            b2=a+sgn*math.radians(50); SF.append(ribbon([(bx,by),(bx+l*math.cos(b2),by-l*math.sin(b2))],4.5,3.5))
finish('Rail_Snow',decal([P(p) for p in SF],0.0415,0.0012),[snow],c,parent=root)
gm=bmesh.new(); bz=bmesh.new()
for sg in (1,-1): gem_on(T(0,Y(1340),Z(288))@RY(sg*math.pi/2),0.019,0.5,0.0405,0.019,0.0285,0.009,bz,gm)
finish('Rail_Bezel',bz,[rdark],c,parent=root)
finish('Rail_Gem',gm,[gem],c,parent=root)
