'use strict';
// ================= STAGE 5: 荒海の船上 — sea enemies + the sailing ship (STORY.md 1, 3) =================
// The deck itself is static (buildStage5Code in stage345.js). Everything that shows the ship moving is drawn here every frame:
// the sea pattern (gfx.js mat 15) streams south at SEA_V, and so do the hull foam, the bow wave, the stern wake, the passing rocks;
// the oars row, gulls circle the mast and the camera rolls with the swell (seaCam). In the kraken's second form lightning strikes far out.
// Small enemies of the stage (FOE / FT entries, same shape as js/foes.js):
//   hishaku 船幽霊 — floats over the deck keeping its distance, scoops sea water with its ladle and lobs it (red ring: step out)
//   octo    墨蛸   — crawls closer, swells up and sprays a burst of ink (each drop blinds a moment: strafe sideways)
//   wani    鰐鮫鬼 — a shark-headed oni: from far it leaps onto you (red ring, jump the landing), up close two quick bites (red arrow)
// Enemy shots: 7 = the ghost's lobbed water, 15 = the octopus' ink drop (16+ = the kraken, js/kraken.js).
Object.assign(C,{ghostW:hex(0xe6f2f6),ghostB:hex(0x9ccfe0),ghostS:hex(0xd2e2ea),octo:hex(0x7b2e63),octoL:hex(0xd38aa8),octoS:hex(0xf3d6c6),
 sharkB:hex(0x56789a),sharkD:hex(0x3a5878),sharkW:hex(0xeef2f4),fundo:hex(0xc0262d),seaFoam:hex(0xf4fbff)});
const SEA_V=9,SEA_Y=-4.6;// ship speed (m/s; the shader's sea uses the same) / sea level
Object.assign(FT,{
 hishaku:{hp:85,spd:3.0,keep:[9,14],cd:[2.3,3.3],range:22,wind:0.75,lead:0.5,lobT:1.15,dmg:14,splR:2.7,rec:0.6,fly:1.0},
 octo:{hp:110,spd:2.4,keep:[6,11],range:15,cd:[2.4,3.4],charge:0.8,n:5,gap:0.1,spread:0.07,shotSpd:19,dmg:7,blind:1.8,rec:0.7},
 wani:{hp:190,spd:4.4,cd:[1.6,2.6],range:18,leapMin:7,leapTel:0.7,leapT:0.85,leapH:5.5,landR:3.0,landDmg:17,dashTel:0.42,dash:16,dashT:0.3,dashDmg:14,rec:0.9}});
Object.assign(FOE,{
// ---- 船幽霊 ----
hishaku:{sc:240,g:11,
 init(e){const K=FT.hishaku;e.hp=K.hp;e.r=0.6;e.cd=rnd(1.4,2.4);e.y=K.fly;e.oa=Math.atan2(e.x-T.x,e.z-T.z);e.dir=Math.random()<.5?-1:1;e.tx=e.x;e.tz=e.z},
 upd(e,dt,T,dx,dz,d,wy){const K=FT.hishaku;e.y=K.fly+Math.sin(e.t*2.1+e.seed)*0.3;
  if(e.st==='chase'){e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*4);e.oa+=dt*e.dir*0.4;if(Math.random()<dt*0.2)e.dir=-e.dir;
   const R=(K.keep[0]+K.keep[1])/2,ox=T.x+Math.sin(e.oa)*R-e.x,oz=T.z+Math.cos(e.oa)*R-e.z,ol=Math.hypot(ox,oz)||1,sp=Math.min(K.spd,ol*1.5);e.x+=ox/ol*sp*dt;e.z+=oz/ol*sp*dt;e.cd-=dt;
   if(e.cd<=0&&d<K.range){e.st='wind';e.stT=0;const o={x:T.x+(T.vx||0)*K.lead,z:T.z+(T.vz||0)*K.lead};collide(o,0.8);e.tx=o.x;e.tz=o.z}}
  else if(e.st==='wind'){e.yaw+=angDiff(Math.atan2(e.tx-e.x,e.tz-e.z),e.yaw)*Math.min(1,dt*8);
   if(e.stT>K.wind){e.st='rec';e.stT=0;e.cd=rnd(K.cd[0],K.cd[1]);const n=G.ex?2:1,fx=Math.sin(e.yaw),fz=Math.cos(e.yaw);
    for(let i=0;i<n;i++){const tx=i?clamp(e.tx+rnd(-3.5,3.5),-BX+1,BX-1):e.tx,tz=i?clamp(e.tz+rnd(-3.5,3.5),BZ0+1,BZ1-1):e.tz,ox=e.x+fx*0.6,oy=e.y+2.4,oz=e.z+fz*0.6,ft=K.lobT;
     shots.push({id:++eidN,k:7,x:ox,y:oy,z:oz,vx:(tx-ox)/ft,vy:-oy/ft+8*ft,vz:(tz-oz)/ft,r:0.6,dmg:K.dmg,g:16,life:9,tx,tz})}
    ev('txt','ザバッ',r1(e.x),3.6,r1(e.z),50,'cyan');snd('whoosh')}}
  else if(e.stT>K.rec){e.st='chase';e.stT=0}},
 sph(e){const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw);return[[e.x,e.y+0.75,e.z,0.75,1],[e.x+fx*0.1,e.y+1.65,e.z+fz*0.1,0.42,2]]},
 ctr(e){return[e.x,e.y+1.1,e.z,1.2]},
 die(e){const y=e.y+1;fxStar(e.x,y,e.z,2.8,C.white,0.1);fxSmoke(e.x,y,e.z,9,1.3,C.ghostW,2.6);fxRing(e.x,0.1,e.z,4,C.cyan,0.3);fxSparks(e.x,y,e.z,8,5,C.cyan);
  if(!pl.sp||lim('spx',0.5))sideText('スゥ…',e,{size:56,st:'cyan',life:0.6});snd('kill');stopT(0.05);shake(0.15)},
 draw(e){const K=FT.hishaku,st=e.st,k=foeK(e),t=e.t,NF=F_UNLIT|F_NOCAST,w=st==='wind'?sat(e.stT/K.wind):0,thr=st==='rec'&&e.stT<0.3?1-e.stT/0.3:0;
  put(CYL,e.x,0.06,e.z,0,0,0,1.5,0.03,1.5,C.cyanD,0,0,F_NOCAST|F_NOEDGE);
  mPush();mT(e.x,e.y,e.z);mRY(e.yaw);mRZ(Math.sin(t*1.3)*0.06);mS(k,k,k);gTint=e.flash>0?1:0;
  gId=nid();put(CONE,Math.sin(t*2.5)*0.12,-0.3,-0.1,PI+0.3,0,Math.sin(t*2)*0.15,0.95,1.6,0.85,C.ghostW,0,.3);sph(0,0.75,0,1.05,1.25,0.85,C.ghostW,0,.3);gId=0;
  put(BOX,-0.11,1.06,0.37,0.2,0,-0.55,0.1,0.72,0.06,C.ghostB);put(BOX,0.11,0.98,0.39,0.2,0,0.55,0.1,0.56,0.06,C.ghostB);box(0,0.6,0.4,0.84,0.14,0.08,C.ghostB);
  sph(0,1.64,0.08,0.56,0.64,0.56,C.ghostS);sph(0,1.72,-0.1,0.66,0.74,0.62,C.inkD);put(BOX,0,1.15,-0.28,0.25,0,0,0.6,1.15,0.16,C.inkD);put(BOX,0.15,1.66,0.33,0,0,0.12,0.22,0.56,0.08,C.inkD);
  for(const s of[-1,1])sph(s*0.15,1.64,0.35,0.13,0.07,0.04,C.cyan,0,0,F_UNLIT);box(0,1.43,0.35,0.16,0.05,0.03,C.inkD);put(PRISM,0,2.0,0.27,-0.3,0,0,0.3,0.24,0.04,C.white);
  put(SPH,-0.42,1.05,0.4,-1.15,0,0.22,0.26,0.78,0.26,C.ghostW);sph(-0.44,0.9,0.82,0.15,0.14,0.18,C.ghostS);
  const a=st==='wind'?lerp(-1.0,-3.5,easeOut(w)):thr>0?lerp(-0.7,-3.5,thr*thr):-1.0;
  mPush();mT(0.45,1.32,0.08);mRX(a);put(SPH,0,-0.36,0,0,0,0,0.28,0.82,0.28,C.ghostW);sph(0,-0.76,0,0.16,0.16,0.16,C.ghostS);
   put(CYL,0,-1.5,0.05,0,0,0,0.07,1.5,0.07,C.wood);put(CYL,0,-2.28,0.2,PI/2,0,0,0.52,0.42,0.52,C.woodD);put(CYL,0,-2.28,0.36,PI/2,0,0,0.42,0.1,0.42,C.inkD);
   if(st==='wind')sph(0,-2.28,0.42,0.42,0.42,0.3,C.water,0,1);mPop();
  for(let i=0;i<2;i++){const q=t*2+i*PI;put(CONE,Math.cos(q)*1.1,1.3+Math.sin(t*3+i)*0.2,Math.sin(q)*1.1,0,0,0,0.3,0.55,0.3,C.cyan,0,0,F_UNLIT|F_FLAME)}
  gTint=0;mPop();
  if(st==='wind'){const s=K.splR*2+Math.sin(t*20)*0.3;put(RING,e.tx,0.12,e.tz,0,0,0,s,1,s,C.red,0,0,NF)}}},
// ---- 墨蛸 ----
octo:{sc:260,g:12,
 init(e){const K=FT.octo;e.hp=K.hp;e.r=0.75;e.cd=rnd(1.2,2.2);e.dir=Math.random()<.5?-1:1},
 upd(e,dt,T,dx,dz,d,wy){const K=FT.octo;
  if(e.st==='chase'){e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*5);const dir=d>K.keep[1]?1:d<K.keep[0]?-0.8:0,side=Math.sin(e.t*0.6+e.seed)*0.7*e.dir;
   e.x+=(dx/d*dir-dz/d*side)*K.spd*dt;e.z+=(dz/d*dir+dx/d*side)*K.spd*dt;e.cd-=dt;if(e.cd<=0&&d<K.range){e.st='charge';e.stT=0}}
  else if(e.st==='charge'){e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*7);if(e.stT>K.charge){e.st='spray';e.stT=0;e.vn=0;ev('txt','ブシュッ',r1(e.x),2.8,r1(e.z),50,'ink');snd('whoosh')}}
  else if(e.st==='spray'){e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*3);const want=Math.floor(e.stT/K.gap);
   while(e.vn<=want&&e.vn<K.n){e.vn++;const a=e.yaw+(e.vn-(K.n+1)/2)*K.spread,fx=Math.sin(a),fz=Math.cos(a),ox=e.x+fx*0.9,oz=e.z+fz*0.9,hd=Math.max(1,d);
    shots.push({id:++eidN,k:15,x:ox,y:1.0,z:oz,vx:fx*K.shotSpd,vy:clamp(((T.y||0)+0.3)/(hd/K.shotSpd),-2,3),vz:fz*K.shotSpd,r:0.32,dmg:K.dmg,g:0,life:2.2,bl:K.blind})}
   if(e.vn>=K.n&&e.stT>K.n*K.gap+0.2){e.st='rec';e.stT=0;e.cd=rnd(K.cd[0],K.cd[1])}}
  else if(e.stT>K.rec){e.st='chase';e.stT=0}},
 sph(e){const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw);return[[e.x,0.6,e.z,0.95,1],[e.x-fx*0.3,1.75,e.z-fz*0.3,0.75,1],[e.x+fx*0.5,1.0,e.z+fz*0.5,0.36,2]]},
 ctr(e){return[e.x,1.0,e.z,1.3]},
 die(e){foeDie(e,C.octo,'ブチュッ',10);decals.push({x:e.x,z:e.z,r:2.6,life:5})},
 draw(e){const K=FT.octo,st=e.st,k=foeK(e),t=e.t,ch=st==='charge'?sat(e.stT/K.charge):0,sp=st==='spray',wk=st==='chase'?1:0.45,inf=1+ch*0.25+(sp?0.08*Math.sin(t*40):0);
  mPush();mT(e.x,0,e.z);mRY(e.yaw);mS(k,k,k);gTint=e.flash>0?1:0;
  gId=nid();for(let i=0;i<8;i++){const a=(i+0.5)/8*TAU,ca=Math.cos(a),sa=Math.sin(a);for(let j=0;j<4;j++){const u=(j+1)/4,r=0.45+u*1.1,w=Math.sin(t*6*wk+i*1.3-u*3)*0.2*u,s=0.44-u*0.27;
   sph(sa*r+ca*w,0.38-u*0.26+Math.max(0,Math.sin(t*5+i*2-u*2))*0.14*u+(j===3?0.1:0),ca*r-sa*w,s,s*0.8,s,C.octo,0,.5)}}
  sph(0,0.72,0,1.3,0.95,1.3,C.octo,0,.6);mPush();mT(0,1.2,-0.25);mRX(-0.55+ch*0.25);sph(0,0.5,0,1.25*inf,1.65*inf,1.2*inf,C.octo,0,.6);mPop();gId=0;
  for(let i=0;i<8;i++){const a=(i+0.5)/8*TAU,r=0.95;sph(Math.sin(a)*r,0.2,Math.cos(a)*r,0.2,0.08,0.2,C.octoS)}
  for(const[x,y,z,s]of[[0.38,1.95,-0.62,0.34],[-0.44,1.62,-0.45,0.28],[0.05,2.3,-0.95,0.24],[-0.2,2.05,-0.25,0.2]])sph(x,y,z,s,s,s*0.6,C.inkD);
  sph(0,0.95,0.55,0.9,0.5,0.4,C.octoL);
  for(const s of[-1,1]){sph(s*0.44,1.08,0.5,0.38,0.42,0.3,C.paper);sph(s*0.46,1.08,0.62,0.25,0.27,0.14,ch>0||sp?C.red:C.gold,0,0,F_UNLIT);box(s*0.46,1.08,0.7,0.2,0.06,0.04,C.inkD);put(BOX,s*0.44,1.33,0.55,0,0,s*0.42,0.46,0.1,0.12,C.inkD)}
  put(CYL,0,0.78,0.75+ch*0.1,PI/2-0.15,0,0,0.3+ch*0.12,0.55,0.3+ch*0.12,C.octoL);put(CYL,0,0.76,1.03+ch*0.1,PI/2-0.15,0,0,0.2,0.05,0.2,C.inkD);
  gTint=0;mPop();
  if(ch>0||sp){const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw);bill(BURST,e.x+fx*1.0,0.8,e.z+fz*1.0,0.3+ch*0.5+(sp?0.4:0),t*9,sp?C.inkD:C.purple,F_UNLIT|F_NOCAST)}}},
// ---- 鰐鮫鬼 ----
wani:{sc:320,g:15,
 init(e){const K=FT.wani;e.hp=K.hp;e.r=0.8;e.cd=rnd(1.0,2.0);e.n=0},
 upd(e,dt,T,dx,dz,d,wy){const K=FT.wani;
  if(e.st==='chase'){e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*6);if(d>2.2){e.x+=dx/d*K.spd*dt;e.z+=dz/d*K.spd*dt}e.cd-=dt;
   if(e.cd<=0){if(d>K.leapMin&&d<K.range){e.st='crouch';e.stT=0;const o={x:T.x+(T.vx||0)*0.45,z:T.z+(T.vz||0)*0.45};collide(o,0.8);e.tx=o.x;e.tz=o.z}
    else if(d<=K.leapMin){e.st='dwind';e.stT=0;e.n=0}}}
  else if(e.st==='crouch'){e.yaw+=angDiff(Math.atan2(e.tx-e.x,e.tz-e.z),e.yaw)*Math.min(1,dt*10);if(e.stT>K.leapTel){e.st='leap';e.stT=0;e.ax=e.x;e.az=e.z;ev('txt','ザバァッ',r1(e.x),3.4,r1(e.z),54,'cyan');snd('jump')}}
  else if(e.st==='leap'){const u=Math.min(1,e.stT/K.leapT);e.x=lerp(e.ax,e.tx,u);e.z=lerp(e.az,e.tz,u);e.y=Math.sin(u*PI)*K.leapH;
   if(u>=1){e.y=0;e.st='rec';e.stT=0;e.cd=rnd(K.cd[0],K.cd[1]);ev('wland',r1(e.x),r1(e.z));areaHurt(e.x,e.z,K.landR,K.landDmg,1)}}
  else if(e.st==='dwind'){e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*12);if(e.stT>K.dashTel){e.st='dash';e.stT=0;e.lx=Math.sin(e.yaw);e.lz=Math.cos(e.yaw);e.hd=false;snd('whoosh')}}
  else if(e.st==='dash'){e.x+=e.lx*K.dash*dt;e.z+=e.lz*K.dash*dt;if(!e.hd&&d<1.6&&T.y<1.4){e.hd=true;hurtT(T,K.dashDmg,e.x,e.z);ev('rbite',r1(T.x),r1(T.z))}
   if(e.stT>K.dashT){e.n++;if(e.n<2){e.st='dwind';e.stT=K.dashTel*0.35}else{e.st='rec';e.stT=0;e.cd=rnd(K.cd[0],K.cd[1])}}}
  else if(e.stT>K.rec){e.st='chase';e.stT=0}},
 sph(e){const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw);return[[e.x,e.y+1.0,e.z,0.8,1],[e.x,e.y+1.75,e.z,0.85,1],[e.x+fx*0.45,e.y+2.45,e.z+fz*0.45,0.55,2]]},
 ctr(e){return[e.x,e.y+1.5,e.z,1.5]},
 die(e){foeDie(e,C.sharkB,'ズシャァ！',12)},
 draw(e){const K=FT.wani,st=e.st,k=foeK(e),t=e.t,NF=F_UNLIT|F_NOCAST,run=st==='chase'?Math.sin(t*11):st==='dash'?Math.sin(t*24):0,cr=st==='crouch'?sat(e.stT/K.leapTel):st==='dwind'?0.5:0,
   air=st==='leap',dash=st==='dash',hot=st==='crouch'||st==='dwind'||air||dash,mo=hot?1:0.25+0.1*Math.sin(t*3),fx=Math.sin(e.yaw),fz=Math.cos(e.yaw);
  mPush();mT(e.x,e.y-cr*0.35,e.z);mRY(e.yaw);mS(k,k,k);mRX(dash?0.5:air?0.25:cr*0.3);gTint=e.flash>0?1:0;
  for(const s of[-1,1]){put(CYL,s*0.32,0.45,0,s*run*0.6-(air?0.6:0),0,0,0.38,0.92,0.38,C.sharkB);box(s*0.32,0.06,0.15+s*run*0.25,0.38,0.12,0.62,C.sharkD);for(let i=0;i<3;i++)put(CONE,s*0.32-0.1+i*0.1,0.06,0.5+s*run*0.25,PI/2,0,0,0.07,0.16,0.07,C.white)}
  box(0,0.98,0,0.98,0.4,0.64,C.fundo);box(0,0.78,0.34,0.42,0.58,0.06,C.fundo);box(0,1.16,0,1.02,0.12,0.68,C.rope);
  gId=nid();sph(0,1.7,0,1.3,1.25,0.98,C.sharkB,0,.5);put(CONE,0,2.3,-0.55,-0.75,0,0,0.12,1.2,0.9,C.sharkD,0,.4);gId=0;sph(0,1.62,0.2,0.92,1.02,0.7,C.sharkW);
  put(CONE,0,1.0,-0.62,-2.0+Math.sin(t*6)*0.2,0,0,0.2,1.0,0.5,C.sharkD);
  mPush();mT(0,2.42,0.18);mRX(air?-0.2:-0.08);gId=nid();sph(0,0,0.25,0.98,0.82,1.45,C.sharkB,0,.5);sph(0,0.05,0.86,0.58,0.46,0.62,C.sharkB,0,.5);gId=0;sph(0,-0.24,0.38,0.82,0.38,1.12,C.sharkW);
   for(const s of[-1,1]){for(let i=0;i<3;i++)box(s*0.46,-0.05,-0.12-i*0.14,0.04,0.32,0.05,C.sharkD);sph(s*0.37,0.13,0.56,0.17,0.17,0.12,C.inkD);sph(s*0.38,0.16,0.62,0.06,0.06,0.04,hot?C.red:C.white,0,0,F_UNLIT);put(BOX,s*0.34,0.28,0.56,0,0,s*0.38,0.32,0.08,0.12,C.sharkD)}
   box(0,-0.2-mo*0.12,0.74,0.64,0.1+mo*0.24,0.3,C.crim);for(let i=0;i<6;i++){put(CONE,-0.26+i*0.104,-0.1,0.84,PI,0,0,0.075,0.15,0.06,C.white);put(CONE,-0.26+i*0.104,-0.3-mo*0.24,0.82,0,0,0,0.075,0.15,0.06,C.white)}mPop();
  for(const s of[-1,1]){mPush();mT(s*0.72,2.05,0);mRX(hot?-1.4:-0.3+run*0.4*s);mRZ(s*0.2);put(SPH,0,-0.45,0,0,0,0,0.4,1.0,0.4,C.sharkB);put(CONE,s*0.2,-0.5,-0.18,0.6,0,s*0.6,0.1,0.6,0.35,C.sharkD);sph(0,-0.98,0,0.38,0.38,0.38,C.sharkD);
   for(let i=0;i<3;i++)put(CONE,-0.1+i*0.1,-1.2,0.08,PI,0,0,0.07,0.24,0.07,C.white);mPop()}
  gTint=0;mPop();
  if(st==='crouch'||air){const s=K.landR*2+Math.sin(t*20)*0.3;put(RING,e.tx,0.12,e.tz,0,0,0,s,1,s,C.red,0,0,NF)}
  if(st==='dwind'&&Math.sin(t*30)>-0.3){const L=K.dash*K.dashT;mPush();mT(e.x+fx*L/2,0.12,e.z+fz*L/2);mRY(e.yaw);mS(1.2,0.02,L);emit(BOX,C.red,0,0,NF,0);mPop();put(PYR,e.x+fx*(L+0.4),0.14,e.z+fz*(L+0.4),PI/2,e.yaw,0,1.6,0.8,1.0,C.red,0,0,NF)}}}});
// ---- shots (host hits; foes.js routes kinds 7 and 15+ here) ----
function seaShot(s){if(s.k>=16)return krShot(s);
if(s.k===7){if(s.y<0.35){s.dead=true;ev('splash',r1(s.x),r1(s.z));areaHurt(s.x,s.z,FT.hishaku.splR,s.dmg)}return true}
let hit=null;for(const p of allP())if(!p.dead&&Math.hypot(s.x-p.x,s.y-p.y-1.1,s.z-p.z)<s.r+0.55)hit=p;
if(hit){if(!wpGuardShot(hit,s)){hurtT(hit,s.dmg,s.x,s.z,0,s.bl||FT.octo.blind);popShot(s)}return true}
if(s.y<0.1||s.life<=0||Math.abs(s.x)>BX+0.4||s.z>BZ1+0.4||s.z<BZ0-0.4){popShot(s);return true}
for(const c of colC)if(s.y<c.h&&Math.hypot(s.x-c.x,s.z-c.z)<c.r){popShot(s);return true}
return true}
function seaPop(s){if(s.k>=16)return krPop(s);if(s.k===7){fxSparks(s.x,s.y,s.z,6,5,C.water);fxSmoke(s.x,s.y,s.z,3,0.7,C.white,2)}else{fxBlobs(s.x,s.y,s.z,5,4,C.inkD,0.12);fxStar(s.x,s.y,s.z,0.9,C.white,0.06)}}
function seaDrawShot(s){const NF=F_UNLIT|F_NOCAST;if(s.k>=16)return krDrawShot(s);
if(s.k===7){sph(s.x,s.y,s.z,1.05,0.95,1.05,C.water,0,1);sph(s.x,s.y+0.35,s.z,0.6,0.35,0.6,C.white,0,0,NF);for(let i=0;i<3;i++){const a=now*7+i*2.1;sph(s.x+Math.cos(a)*0.55,s.y-0.1,s.z+Math.sin(a)*0.55,0.22,0.22,0.22,C.white,0,0,NF)}
 const r=FT.hishaku.splR*2+Math.sin(now*18)*0.3;put(RING,s.tx,0.11,s.tz,0,0,0,r,1,r,C.red,0,0,NF);return}
mPush();mT(s.x,s.y,s.z);orient(s.vx,s.vy,s.vz);mS(0.46,0.46,1.15);emit(SPH,C.inkD,0,1,0,0);mPop();sph(s.x-s.vx*0.03,s.y,s.z-s.vz*0.03,0.3,0.3,0.3,C.purple,0,0,NF)}
Object.assign(FXE,{
splash(x,z){fxRing(x,0.1,z,FT.hishaku.splR*2.2,C.cyan,0.3);fxSparks(x,0.4,z,12,8,C.water);fxSmoke(x,0.4,z,6,1.1,C.white,3);snd('land');sfxAt('バシャァッ',x,2.4,z,{size:56,st:'cyan',life:0.45})},
wland(x,z){fxRing(x,0.1,z,FT.wani.landR*2.4,C.white,0.3);fxSmoke(x,0.3,z,6,1,C.smoke,3.5);fxSparks(x,0.4,z,8,7,C.water);shake(0.25);snd('land');sfxAt('ドバァン！',x,2.6,z,{size:58,st:'boom',life:0.45})}});
// ---------------- the sailing ship: drawn every frame on the sea stage ----------------
const seaOn=()=>!!(STG[curStage]&&STG[curStage].sea);
// sea stacks that pass by (x, start z, size, kind: 0 plain / 1 夫婦岩 with a shimenawa / 2 with a little torii)
const SEA_ROCKS=[[-74,0,1,1],[96,260,1.3,0],[-140,470,1.6,2],[62,690,0.8,0],[-58,820,1.1,0]];
const seaBolt={t:9,x:0,z:0,seed:0};
function seaRock(x,z,s,kind){const NF=F_UNLIT|F_NOCAST,Y=SEA_Y;
 for(const[dx,dz,w,h]of kind===1?[[-7,0,9,24],[7,1,8,18]]:[[0,0,11,30],[6,-4,6,14],[-5,3,7,11]]){put(CONE,x+dx*s,Y+h*s*0.45,z+dz*s,0,dx*0.1,0,w*s,h*s,w*s*0.9,C.seaRock,0,.2);put(CONE,x+dx*s+w*s*0.12,Y+h*s*0.7,z+dz*s-w*s*0.1,0,0,0,w*s*0.42,h*s*0.5,w*s*0.42,C.seaRockD)
  for(let i=0;i<5;i++){const a=i*1.26+now*0.8;sph(x+dx*s+Math.cos(a)*w*s*0.48,Y+0.1,z+dz*s+Math.sin(a)*w*s*0.42,w*s*0.36,0.5,w*s*0.2,C.seaFoam,0,0,NF)}}
 if(kind===1){const y=Y+15*s;mPush();mT(x,y,z+0.5*s);put(CYL,0,0,0,0,0,PI/2,1.0*s,14*s,1.0*s,C.rope,6);for(let i=0;i<5;i++)box((-4+i*2)*s,-1.1*s,0.4*s,0.7*s,1.4*s,0.1*s,C.white);mPop()}
 if(kind===2){const y=Y+30*s;for(const q of[-1,1])cyl(x+q*1.6*s,y+1.6*s,z,0.35*s,3.2*s,0.35*s,C.red);box(x,y+3.3*s,z,4.6*s,0.4*s,0.5*s,C.inkD);box(x,y+2.6*s,z,4*s,0.3*s,0.4*s,C.red)}}
function drawSeaFx(dt){if(!seaOn())return;const NF=F_UNLIT|F_NOCAST,Y=SEA_Y,S=now*SEA_V;
// foam hugging the hull (it streams aft and spreads a little towards the stern)
for(const s of[-1,1])for(let i=0;i<18;i++){const z=-34+((i*3.6+S)%64.8),k=sat((z+34)/64),x=s*(19.9+k*1.6+Math.sin(i*1.7+now*2.2)*0.35),w=2.2+Math.sin(i*2.3)*0.6;
 sph(x,Y+0.08,z,w+k*1.5,0.3,3.6+k*2,C.seaFoam,0,0,NF)}
// the bow cutting the waves
for(const s of[-1,1])for(let k=0;k<6;k++){const p=Math.sin(now*5+k*1.3),x=s*(1.5+k*3.4),z=-37.5+k*1.0+k*k*0.12;sph(x,Y+0.35+p*0.25+(5-k)*0.1,z,3.2-k*0.25,1.0+p*0.2,2.2,C.seaFoam,0,0,NF)}
put(CONE,0,Y+1.2+Math.sin(now*4)*0.3,-38.5,0,0,0,3.6,2.4,2.6,C.seaFoam,0,0,NF);
if(lim('bowsp',0.09)){const s=Math.random()<.5?-1:1;fxSmoke(s*rnd(1,8),Y+1.4,-37,1,1.4,C.white,2.4)}
// stern wake: a V of foam lines and the churned trail between them
for(let i=0;i<22;i++){const d=(i*6.6+S)%145,z=37+d,f=1-d/145,w=3.2+d*0.05;
 for(const s of[-1,1])sph(s*(17+d*0.34),Y+0.06,z,w*f+1,0.3,4.5*f+1.5,C.seaFoam,0,0,NF);
 sph(Math.sin(d*0.21+now)*2.5,Y+0.07,z+2,8+d*0.08,0.3,4*f+2,C.seaFoam,0,0,NF)}
// oars (櫓): the crew below rows in time; the blade dips aft, lifts and swings forward
for(const s of[-1,1])for(let i=0;i<8;i++){const z=-22+i*5.6,ph=now*2.4+i*0.18,sw=Math.sin(ph),up=Math.max(0,Math.cos(ph)),
 ax=s*19.25,ay=-2.25,az=z,bx=s*25.5,by=Y-0.25+up*1.5,bz=z+sw*2.6;
 mPush();mT((ax+bx)/2,(ay+by)/2,(az+bz)/2);const L=orient(bx-ax,by-ay,bz-az);mPush();mRX(PI/2);mS(0.2,L,0.2);emit(CYL,C.wood,0,0,0,0);mPop();mT(0,0,L/2);mS(0.12,0.9,1.6);emit(BOX,C.woodD,0,0,0,0);mPop();
 if(up<0.15)sph(bx,Y+0.1,bz,1.6,0.3,1.6,C.seaFoam,0,0,NF)}
// passing sea stacks
for(const[x,z0,s,kind]of SEA_ROCKS){const z=((z0+S)%1000)-520;seaRock(x,z,s,kind)}
// gulls circling the mast
for(let i=0;i<5;i++){const a=now*(0.35+i*0.04)+i*1.3,r=26+i*5,x=Math.sin(a)*r,z=-6+Math.cos(a)*r*0.7,y=24+i*2.5+Math.sin(now*0.7+i)*2,f=Math.sin(now*9+i*2)*0.5;
 mPush();mT(x,y,z);mRY(a+PI/2);sph(0,0,0,0.35,0.3,0.9,C.white,0,0,F_NOCAST);for(const q of[-1,1]){mPush();mRZ(q*f);put(BOX,q*0.75,0,0,0,0,0,1.5,0.06,0.42,C.white,0,0,F_NOCAST);put(BOX,q*1.45,0,-0.05,0,0,0,0.3,0.07,0.36,C.inkD,0,0,F_NOCAST);mPop()}mPop()}
// the second form brings the storm: lightning far out at sea
if(boss&&boss.bk==='kraken'&&boss.phase>1&&boss.st!=='die'){seaBolt.t+=dt;if(seaBolt.t>(seaBolt.seed%3)+2.6){seaBolt.t=0;seaBolt.seed=(Math.random()*1e6)|0;const a=rnd(-1.4,1.4);seaBolt.x=Math.sin(a)*rnd(140,260);seaBolt.z=-Math.cos(a)*rnd(140,260);flash(0.22);snd('boom',0.3);snd('zap')}
 if(seaBolt.t<0.2){let x=seaBolt.x,y=110,z=seaBolt.z,q=seaBolt.seed;const R=()=>((q=(q*1103515245+12345)&0x7fffffff)/0x7fffffff)-0.5;
  for(let i=0;i<7;i++){const nx=x+R()*24,ny=y-(110-Y)/7,nz=z+R()*10;mPush();mT((x+nx)/2,(y+ny)/2,(z+nz)/2);const L=orient(nx-x,ny-y,nz-z);mRX(PI/2);mS(1.4,L,1.4);emit(CYL,C.white,0,0,NF,0);mPop();x=nx;y=ny;z=nz}}}}
// the deck rolls with the swell (and harder in the kraken's second form)
function seaCam(){if(!seaOn())return;const k=boss&&boss.bk==='kraken'&&boss.phase>1?1.7:1;cam.roll+=(Math.sin(now*0.55)*0.016+Math.sin(now*1.31)*0.004)*k;cam.pitch+=Math.sin(now*0.43+1)*0.006*k;cam.y+=Math.sin(now*0.55+0.8)*0.07*k}
