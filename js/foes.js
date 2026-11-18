'use strict';
// ================= NEW SMALL ENEMIES + GROUND HAZARDS (STORY.md 3, 9) =================
// Stage-specific small enemies, built from primitives like 墨鬼 / 化け提灯 / 鎧鬼 (entities.js):
//   1 朱の神社:   墨狐 fox (the shrine's stone fox, stained with ink: runs rings round you, then pounces in a straight line: step aside)
//   2 月下の天守: 鉄砲鬼 gun (aims with a red line, then one fast shot; props block it) + 爆弾鬼 (now stops and swells before it blows)
//   3 黄昏の町:   唐傘お化け kasa (hops, then opens and drops on you: jump or step out of the ring) / ろくろ首 roku (the head bites from far away; the head is the weak point)
//   4 雪の古寺:   雪坊主 yuki (circles and spits a fan of ice shards; leaves an ice patch when it bursts) / 氷の鎧鬼 (bru v=2: an ice shell = extra HP, no stagger until it breaks, ice trail)
//   5 墨の池:     影法師 shade (a puddle nobody can hit; it rises next to you to slam (v=0, ベタグロの影) or to lob fire (v=1, アカベタの影))
// FOE[type] = {sc score, g gauge, init, upd (host), sph (hit spheres), ctr, draw, die}. entities.js / players.js look types up here first.
// Hazards (fires, ink waves, arm sweeps, rotating fire lines) are local lists started by FXE events: every peer checks its own player.
Object.assign(C,{copper:hex(0xc0623a),copperD:hex(0x8f4526),kim:hex(0xff8a2b),kimD:hex(0xd9641a),oil:hex(0x8e2f3f)});
// ---- tuning (目安。遊んで調整する) ----
// hp / spd(m/s) / cd [min,max] seconds between attacks / the rest are per-enemy timings (s), ranges (m) and damage
const FT={
 fox:{hp:45,spd:6.5,orbit:8,range:12,cd:[1.6,2.6],wind:0.45,leap:16,air:0.55,dmg:9,rec:0.8},
 kasa:{hp:70,spd:3.4,cd:[2.2,3.4],range:13,wind:0.55,air:1.0,high:5,landR:2.6,landDmg:12,rec:1.0},
 roku:{hp:110,spd:1.6,cd:[2.4,3.4],keep:[7,12],reach:15,wind:0.8,lock:0.3,bite:0.25,hold:0.6,biteR:1.7,dmg:13},
 yuki:{hp:60,spd:3.0,cd:[2.6,3.8],orbit:10,range:17,charge:0.65,n:3,spread:0.24,shotSpd:12,dmg:8,iceR:2.6},
 gun:{hp:60,spd:2.6,cd:[1.4,2.4],keep:[8,15],range:19,aim:1.3,lock:0.3,shotSpd:26,dmg:14,rec:1.0},
 shade:{hp:130,spd:5.5,riseB:4.2,riseR:10,rise:0.65,up:2.2,slamR:3.2,slamDmg:16,fireN:3,fireDmg:12},
 bom:{trig:2.6,fuse:0.55},
 ibru:{armor:220}};
const FVAR={bom:['imp',1],ibru:['bru',2],shadeR:['shade',1]};// wave-table names that are variants of a type
const fires=[],lwaves=[],sweeps=[],spins=[];
function hazReset(){fires.length=0;lwaves.length=0;sweeps.length=0;spins.length=0;if(typeof erupts!=='undefined')erupts.length=0;if(typeof shz!=='undefined')shz.length=0;if(typeof krz!=='undefined')krz.length=0}
// shared death burst in the enemy's own colour
function foeDie(e,c,str,deb){const y=FOE[e.type].ctr(e)[1];fxStar(e.x,y,e.z,2.8,C.white,0.1);fxBall(e.x,y,e.z,1.9,c,0.3);fxBlobs(e.x,y,e.z,12,7,C.ink,0.2);fxDebris(e.x,y,e.z,deb||6,8,c,0.28);fxSmoke(e.x,y,e.z,4,0.8,C.smoke,2);fxRing(e.x,0.1,e.z,3.4,C.white,0.25);
if(!pl.sp||lim('spx',0.5))sideText(str,e,{size:58,st:'ink',life:0.5});snd('kill');stopT(0.05);shake(0.2)}
const foeK=e=>e.st==='spawn'?0.3+0.7*easeBack(Math.min(1,e.stT/0.7)):1;
function shadeK(e){const st=e.st,u=e.stT;return st==='rise'?easeBack(sat(u/FT.shade.rise)):st==='slam'?1:st==='sink'?1-sat(u/0.5):0}
function rokuHead(e){const K=FT.roku,fx=Math.sin(e.yaw),fz=Math.cos(e.yaw),sw=Math.sin(e.t*1.6+e.seed),R=[e.x+fx*0.7-fz*sw*0.5,3.3+Math.sin(e.t*2.3)*0.25,e.z+fz*0.7+fx*sw*0.5],Wd=[e.x-fx*1.0,4.5,e.z-fz*1.0],B=[e.tx,1.15,e.tz],st=e.st,u=e.stT,
 L=(a,b,k)=>[lerp(a[0],b[0],k),lerp(a[1],b[1],k),lerp(a[2],b[2],k)];
if(st==='wind')return L(R,Wd,easeOut(sat(u/(K.wind*0.6))));if(st==='bite')return L(Wd,B,easeOut(sat(u/K.bite)));if(st==='back')return L(B,R,sat(u/0.5));if(st==='spawn')return L([e.x,1.9,e.z],R,sat(u/0.7));return R}
const FOE={
// ---- 墨狐 ----
fox:{sc:160,g:8,
 init(e){e.hp=FT.fox.hp;e.r=0.55;e.cd=rnd(1.5,2.5);e.oa=Math.atan2(e.x-T.x,e.z-T.z);e.dir=Math.random()<.5?-1:1},
 upd(e,dt,T,dx,dz,d,wy){const K=FT.fox;
  if(e.st==='chase'){e.oa+=dt*e.dir*K.spd/K.orbit;if(Math.random()<dt*0.3)e.dir=-e.dir;const ox=T.x+Math.sin(e.oa)*K.orbit-e.x,oz=T.z+Math.cos(e.oa)*K.orbit-e.z,ol=Math.hypot(ox,oz)||1,sp=Math.min(K.spd,ol*3);e.x+=ox/ol*sp*dt;e.z+=oz/ol*sp*dt;
   e.yaw+=angDiff(Math.atan2(ox,oz),e.yaw)*Math.min(1,dt*10);e.cd-=dt;if(e.cd<=0&&d<K.range){e.st='wind';e.stT=0}}
  else if(e.st==='wind'){e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*12);if(e.stT>K.wind){e.st='lunge';e.stT=0;e.lx=Math.sin(e.yaw);e.lz=Math.cos(e.yaw);e.hd=false;ev('txt','シュバッ',r1(e.x),2.2,r1(e.z),46,'ink')}}
  else if(e.st==='lunge'){e.x+=e.lx*K.leap*dt;e.z+=e.lz*K.leap*dt;e.y=Math.sin(sat(e.stT/K.air)*PI)*1.1;if(!e.hd&&d<1.4&&T.y<1.6){e.hd=true;hurtT(T,K.dmg,e.x,e.z)}if(e.stT>K.air){e.y=0;e.st='rec';e.stT=0;e.cd=rnd(K.cd[0],K.cd[1])}}
  else if(e.stT>K.rec)e.st='chase'},
 sph(e){const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw);return[[e.x,e.y+0.7,e.z,0.72,1],[e.x+fx*0.62,e.y+0.98,e.z+fz*0.62,0.36,2]]},
 ctr(e){return[e.x,e.y+0.8,e.z,1.1]},
 die(e){foeDie(e,C.stone,'ガラッ',12)},
 draw(e){const K=FT.fox,st=e.st,k=foeK(e),run=st==='chase'?Math.sin(e.t*18):0,hot=st==='wind'||st==='lunge',cr=st==='wind'?sat(e.stT/K.wind):st==='rec'?0.4:0,lp=st==='lunge'?1:0;
  mPush();mT(e.x,e.y+Math.abs(run)*0.08,e.z);mRY(e.yaw);mRX(lp?-0.25:cr*0.22);mS(k,k*(1-cr*0.25),k);gTint=e.flash>0?1:0;
  sph(0,0.62,0,0.7,0.62,1.3,C.stone,5,.2);sph(0,0.95,0.62,0.56,0.56,0.6,C.stoneL);put(CONE,0,0.88,1.0,PI/2,0,0,0.26,0.36,0.26,C.stoneL);sph(0,0.9,1.17,0.09,0.08,0.08,C.inkD);
  for(const s of[-1,1]){put(CONE,s*0.18,1.34,0.56,0,0,-s*0.15,0.2,0.42,0.2,C.stoneL);sph(s*0.15,1.02,0.86,0.13,0.1,0.07,hot?C.red:C.yellow,0,0,F_UNLIT);
   put(CYL,s*0.22,0.26,0.42,run*s*0.7-lp*0.9,0,0,0.16,0.52,0.16,C.stoneD);put(CYL,s*0.22,0.26,-0.42,-run*s*0.7+lp*0.9,0,0,0.16,0.52,0.16,C.stoneD)}
  box(0,0.62,0.56,0.5,0.34,0.08,C.red);put(CONE,0,0.98,-0.85,-0.9+run*0.15,0,0,0.42,1.0,0.42,C.stoneL);sph(0.2,0.82,-0.2,0.42,0.3,0.5,C.inkD);sph(-0.25,0.6,0.25,0.3,0.3,0.3,C.inkD);gTint=0;mPop();
  if(st==='wind'&&Math.sin(e.t*(e.stT>K.wind-0.15?50:18))>-0.3){const L=K.leap*K.air,fx=Math.sin(e.yaw),fz=Math.cos(e.yaw);mPush();mT(e.x+fx*L/2,0.12,e.z+fz*L/2);mRY(e.yaw);mS(1.1,0.02,L);emit(BOX,C.red,0,0,F_UNLIT|F_NOCAST,0);mPop()}}},
// ---- 唐傘お化け ----
kasa:{sc:200,g:9,
 init(e){e.hp=FT.kasa.hp;e.r=0.6;e.cd=rnd(1.2,2.4);e.tx=e.x;e.tz=e.z},
 upd(e,dt,T,dx,dz,d,wy){const K=FT.kasa;
  if(e.st==='chase'){e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*6);e.cd-=dt;const hop=Math.max(0,Math.sin(e.t*7)),dir=d>6?1:d<4?-0.7:0,side=Math.sin(e.t*0.7+e.seed)*0.6;
   e.x+=(dx/d*dir-dz/d*side)*K.spd*hop*dt;e.z+=(dz/d*dir+dx/d*side)*K.spd*hop*dt;
   if(e.cd<=0&&d<K.range){e.st='wind';e.stT=0;const o={x:T.x+(T.vx||0)*0.5,z:T.z+(T.vz||0)*0.5};collide(o,0.8);e.tx=o.x;e.tz=o.z}}
  else if(e.st==='wind'){e.yaw+=angDiff(Math.atan2(e.tx-e.x,e.tz-e.z),e.yaw)*Math.min(1,dt*10);if(e.stT>K.wind){e.st='air';e.stT=0;e.ax=e.x;e.az=e.z;ev('txt','バサッ',r1(e.x),3,r1(e.z),50,'ink')}}
  else if(e.st==='air'){const u=Math.min(1,e.stT/K.air);e.x=lerp(e.ax,e.tx,u);e.z=lerp(e.az,e.tz,u);e.y=Math.sin(u*PI)*K.high;
   if(u>=1){e.y=0;e.st='rec';e.stT=0;e.cd=rnd(K.cd[0],K.cd[1]);ev('kland',r1(e.x),r1(e.z));areaHurt(e.x,e.z,K.landR,K.landDmg,1)}}
  else if(e.st==='rec'){if(e.stT>K.rec){e.st='chase';e.stT=0}}},
 sph(e){const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw);return[[e.x,e.y+1.75,e.z,0.85,1],[e.x+fx*0.45,e.y+1.5,e.z+fz*0.45,0.36,2]]},
 ctr(e){return[e.x,e.y+1.4,e.z,1.3]},
 die(e){foeDie(e,C.oil,'バサァ！',10)},
 draw(e){const K=FT.kasa,st=e.st,u=e.stT,k=foeK(e);let open=0.12,sq=1,hop=0,spin=0,lean=0;
  if(st==='chase'){hop=Math.max(0,Math.sin(e.t*7))*0.45;sq=1+Math.sin(e.t*14)*0.05}else if(st==='wind'){const q=sat(u/K.wind);sq=1-0.3*q;open=0.12+0.5*q}
  else if(st==='air'){open=1;spin=e.t*16;lean=0.2}else if(st==='rec'){open=Math.max(0.12,1-u*3);lean=Math.sin(e.t*9)*0.15;sq=0.9}
  const hot=st==='wind'||st==='air',w=lerp(1.0,3.3,open),h=lerp(2.2,1.0,open),er=Math.max(0.2,(w/2)*(1-0.55/h));
  mPush();mT(e.x,e.y+hop,e.z);mRY(e.yaw);mRZ(lean);mS(k,k*sq,k);gTint=e.flash>0?1:0;
  cyl(0,0.5,0,0.2,1.0,0.2,C.skinH);box(0,0.09,0.08,0.5,0.1,0.72,C.woodD);for(const z of[-0.12,0.26])box(0,0.03,z,0.4,0.08,0.1,C.woodD);
  mPush();mT(0,1.0,0);mRY(spin);put(CONE,0,h/2,0,0,0,0,w,h,w,C.oil,6,.4);put(CONE,0,h*0.78,0,0,0,0,w*0.46,h*0.46,w*0.46,C.paper,6);cyl(0,h+0.08,0,0.14,0.3,0.14,C.black);mPop();
  sph(0,1.55,er*0.9,0.62,0.62,0.3,C.white);sph(0,1.55,er*0.9+0.13,0.35,0.35,0.16,hot?C.red:C.yellow,0,0,F_UNLIT);sph(0,1.55,er*0.9+0.2,0.1,0.22,0.06,C.inkD);
  put(BOX,0,1.02,er*0.8+0.1,0.4+Math.sin(e.t*6)*0.3,0,0,0.26,0.7,0.06,C.tongue);
  for(const s of[-1,1])put(SPH,s*0.5,1.12,0.1,0,0,s*(0.5+open),0.14,0.6,0.14,C.skinH);gTint=0;mPop();
  if(st==='wind'||st==='air'){const s=K.landR*2+Math.sin(e.t*20)*0.3;put(RING,e.tx,0.12,e.tz,0,0,0,s,1,s,C.red,0,0,F_UNLIT|F_NOCAST)}}},
// ---- ろくろ首 ----
roku:{sc:250,g:12,
 init(e){e.hp=FT.roku.hp;e.r=0.7;e.cd=rnd(1.5,2.5);e.tx=e.x;e.tz=e.z},
 upd(e,dt,T,dx,dz,d,wy){const K=FT.roku;
  if(e.st==='chase'){e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*3);const dir=d>K.keep[1]?1:d<K.keep[0]?-1:0;e.x+=dx/d*dir*K.spd*dt;e.z+=dz/d*dir*K.spd*dt;e.cd-=dt;if(e.cd<=0&&d<K.reach){e.st='wind';e.stT=0}}
  else if(e.st==='wind'){e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*6);if(e.stT<K.wind-K.lock){const l=Math.min(d,K.reach);e.tx=e.x+dx/d*l+(T.vx||0)*0.15;e.tz=e.z+dz/d*l+(T.vz||0)*0.15}if(e.stT>K.wind){e.st='bite';e.stT=0;e.hd=false}}
  else if(e.st==='bite'){if(e.stT>=K.bite&&!e.hd){e.hd=true;for(const p of allP())if(Math.hypot(p.x-e.tx,p.z-e.tz)<K.biteR&&p.y<1.8)hurtT(p,K.dmg,e.x,e.z);ev('rbite',r1(e.tx),r1(e.tz))}if(e.stT>K.bite+K.hold){e.st='back';e.stT=0}}
  else if(e.st==='back'){if(e.stT>0.5){e.st='chase';e.stT=0;e.cd=rnd(K.cd[0],K.cd[1])}}},
 sph(e){const h=rokuHead(e);return[[e.x,1.15,e.z,0.85,1],[h[0],h[1],h[2],0.62,2]]},
 ctr(e){return[e.x,1.6,e.z,1.6]},
 die(e){foeDie(e,C.noren,'ヒィィ…',8)},
 draw(e){const h=rokuHead(e),st=e.st,hot=st==='wind'||st==='bite',k=foeK(e),wk=st==='chase'?Math.sin(e.t*5)*0.06:0,NF=F_UNLIT|F_NOCAST;
  gTint=e.flash>0?1:0;mPush();mT(e.x,0,e.z);mRY(e.yaw);mS(k,k,k);
  put(CONE,0,0.95,0,0,0,wk,1.7,1.9,1.5,C.noren,0,.3);sph(0,1.65,0,1.05,0.95,0.8,C.noren);box(0,1.25,0,1.12,0.3,0.86,C.crim);box(0,1.25,-0.5,0.7,0.5,0.3,C.gold);
  for(const s of[-1,1]){put(SPH,s*0.6,1.45,0.12,0.5,0,s*0.35,0.3,0.9,0.3,C.noren);sph(s*0.5,1.05,0.42,0.2,0.2,0.2,C.paper)}box(0,1.95,0.28,0.5,0.24,0.12,C.paper);mPop();
  const sw=Math.sin(e.t*2+e.seed)*0.8,nx=e.x,ny=2.0*k,nz=e.z,mx=(nx+h[0])/2+Math.cos(e.yaw)*sw,my=Math.max(ny,h[1])+1.4,mz=(nz+h[2])/2-Math.sin(e.yaw)*sw,n=clamp(Math.ceil(Math.hypot(h[0]-nx,h[1]-ny,h[2]-nz)/0.4),6,34);gId=nid();
  for(let i=1;i<n;i++){const u=i/n,a=(1-u)*(1-u),b=2*u*(1-u),c=u*u;sph(a*nx+b*mx+c*h[0],a*ny+b*my+c*h[1],a*nz+b*mz+c*h[2],0.36,0.36,0.36,C.paper,0,.3)}gId=0;
  mPush();mT(h[0],h[1],h[2]);mRY(st==='bite'||st==='back'?Math.atan2(e.tx-e.x,e.tz-e.z):e.yaw);if(st==='bite')mRX(0.45);mS(k,k,k);
  sph(0,0,0,0.95,1.05,0.95,C.paper,0,.3);sph(0,0.2,-0.2,1.08,1.0,1.0,C.inkD);sph(0,0.66,-0.22,0.5,0.42,0.5,C.inkD);put(CYL,0,0.68,-0.22,0,0,PI/2,0.06,1.1,0.06,C.gold);
  for(const s of[-1,1]){put(SPH,s*0.22,0.05,0.42,0,0,s*0.3,0.24,0.1,0.08,hot?C.red:C.inkD,0,0,hot?F_UNLIT:0);sph(s*0.3,-0.14,0.36,0.16,0.1,0.08,C.sakuraD)}
  const mo=st==='bite'?0.36:hot?0.2:0.05;box(0,-0.3-mo*0.3,0.42,0.42,mo,0.12,C.crim);if(mo>0.15)for(let i=0;i<3;i++)put(CONE,-0.12+i*0.12,-0.24,0.47,PI,0,0,0.09,0.14,0.06,C.white);
  mPop();gTint=0;
  if(st==='wind'&&(e.stT<FT.roku.wind-FT.roku.lock||Math.sin(e.t*40)>0)){const s=FT.roku.biteR*2;put(RING,e.tx,0.12,e.tz,0,0,0,s,1,s,C.red,0,0,NF)}}},
// ---- 雪坊主 ----
yuki:{sc:180,g:9,
 init(e){e.hp=FT.yuki.hp;e.r=0.7;e.cd=rnd(1.4,2.6);e.oa=Math.atan2(e.x-T.x,e.z-T.z);e.dir=Math.random()<.5?-1:1},
 upd(e,dt,T,dx,dz,d,wy){const K=FT.yuki;e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*5);
  if(e.st==='chase'){e.oa+=dt*e.dir*0.35;if(Math.random()<dt*0.2)e.dir=-e.dir;const ox=T.x+Math.sin(e.oa)*K.orbit-e.x,oz=T.z+Math.cos(e.oa)*K.orbit-e.z,ol=Math.hypot(ox,oz)||1,sp=Math.min(K.spd,ol*2);e.x+=ox/ol*sp*dt;e.z+=oz/ol*sp*dt;e.cd-=dt;if(e.cd<=0&&d<K.range){e.st='charge';e.stT=0}}
  else if(e.st==='charge'){if(e.stT>K.charge){e.st='rec';e.stT=0;e.cd=rnd(K.cd[0],K.cd[1]);const ox=e.x+Math.sin(e.yaw)*0.7,oz=e.z+Math.cos(e.yaw)*0.7,ax=T.x+(T.vx||0)*0.35-ox,az=T.z+(T.vz||0)*0.35-oz,a0=Math.atan2(ax,az),hd=Math.hypot(ax,az)||1;
    for(let i=0;i<K.n;i++){const a=a0+(i-(K.n-1)/2)*K.spread;shots.push({id:++eidN,k:2,x:ox,y:1.3,z:oz,vx:Math.sin(a)*K.shotSpd,vy:clamp(((T.y||0)-0.2)/(hd/K.shotSpd),-3,3),vz:Math.cos(a)*K.shotSpd,r:0.26,dmg:K.dmg,g:0,life:4})}
    ev('txt','ヒュッ',r1(e.x),2.8,r1(e.z),44,'cyan');snd('whoosh')}}
  else if(e.stT>0.5)e.st='chase'},
 sph(e){return[[e.x,0.75,e.z,0.8,1],[e.x,1.7,e.z,0.55,2]]},
 ctr(e){return[e.x,1.2,e.z,1.3]},
 die(e){fxStar(e.x,1,e.z,2.6,C.white,0.1);fxSmoke(e.x,0.8,e.z,8,1.2,C.snow,3);fxDebris(e.x,1,e.z,8,7,C.ice,0.3);fxRing(e.x,0.1,e.z,4.5,C.cyan,0.3);ices.push({x:e.x,z:e.z,r:FT.yuki.iceR,life:0.7});snd('freeze');snd('kill');stopT(0.05);shake(0.2);sideText('バフッ',e,{size:54,st:'cyan',life:0.5})},
 draw(e){const st=e.st,ch=st==='charge'?sat(e.stT/FT.yuki.charge):0,k=foeK(e)*(1+ch*0.12);
  mPush();mT(e.x,Math.sin(e.t*3)*0.06,e.z);mRY(e.yaw);mS(k,k,k);gTint=e.flash>0?1:0;
  sph(0,0.7,0,1.55,1.4,1.5,C.snow,0,.3);sph(0,1.65,0.02,1.05,1.0,1.0,C.snow,0,.3);put(CONE,0,2.25,0,0,0,0,1.9,0.7,1.9,C.straw,6);
  for(const s of[-1,1]){sph(s*0.24,1.72,0.42,0.2,0.24,0.12,ch>0?C.white:C.cyanD,0,0,F_UNLIT);put(BOX,s*0.26,1.94,0.42,0,0,s*0.5,0.3,0.07,0.08,C.inkD);put(SPH,s*0.8,0.95,0.1,0,0,s*(0.9-ch*0.6),0.3,0.75,0.3,C.snow)}
  sph(0,1.42,0.46,0.3+ch*0.1,0.08+ch*0.3,0.14,C.navy);for(let i=0;i<3;i++)put(CONE,-0.2+i*0.2,1.2-(i===1?0.06:0),0.44,PI,0,0,0.12,0.3+(i===1?0.12:0),0.1,C.ice,0,1);
  for(let i=0;i<5;i++)sph(-0.4+i*0.2,1.08,0.5-Math.abs(i-2)*0.05,0.16,0.16,0.16,C.navy);gTint=0;mPop();
  if(ch>0)bill(BURST,e.x+Math.sin(e.yaw)*0.75,1.45,e.z+Math.cos(e.yaw)*0.75,0.4+ch*0.7,e.t*9,C.cyan,F_UNLIT|F_NOCAST)}},
// ---- 鉄砲鬼 ----
gun:{sc:220,g:10,
 init(e){e.hp=FT.gun.hp;e.r=0.6;e.cd=rnd(0.8,1.8)},
 upd(e,dt,T,dx,dz,d,wy){const K=FT.gun;
  if(e.st==='chase'){e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*5);const dir=d>K.keep[1]?1:d<K.keep[0]?-1:0,side=Math.sin(e.t*0.5+e.seed)*0.5;e.x+=(dx/d*dir-dz/d*side)*K.spd*dt;e.z+=(dz/d*dir+dx/d*side)*K.spd*dt;e.cd-=dt;if(e.cd<=0&&d<K.range){e.st='aim';e.stT=0}}
  else if(e.st==='aim'){if(e.stT<K.aim-K.lock)e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*7);
   if(e.stT>K.aim){e.st='rec';e.stT=0;e.cd=rnd(K.cd[0],K.cd[1]);const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw),ox=e.x+fx*1.3,oz=e.z+fz*1.3;
    shots.push({id:++eidN,k:3,x:ox,y:1.35,z:oz,vx:fx*K.shotSpd,vy:0,vz:fz*K.shotSpd,r:0.2,dmg:K.dmg,g:0,life:2.5});ev('gshot',r1(ox),r1(oz))}}
  else if(e.stT>K.rec)e.st='chase'},
 sph(e){return[[e.x,1.0,e.z,0.72,1],[e.x,1.85,e.z,0.42,2]]},
 ctr(e){return[e.x,1.2,e.z,1.3]},
 die(e){foeDie(e,C.navy,'ガシャン！',10)},
 draw(e){const K=FT.gun,st=e.st,k=foeK(e),wk=st==='chase'?Math.sin(e.t*8):0,aim=st==='aim',rec=st==='rec'?1-sat(e.stT/0.3):0,NF=F_UNLIT|F_NOCAST;
  mPush();mT(e.x,0,e.z);mRY(e.yaw);mS(k,k,k);gTint=e.flash>0?1:0;
  for(const s of[-1,1]){put(CYL,s*0.24,0.36,0,s*wk*0.5,0,0,0.3,0.72,0.3,C.ink);box(s*0.24,0.06,0.08+s*wk*0.12,0.32,0.12,0.5,C.inkD)}
  box(0,1.05,0,0.95,0.75,0.6,C.navy,0,.4);box(0,0.72,0,1.0,0.16,0.64,C.gold);for(let i=0;i<3;i++)box(0,0.92+i*0.2,0.31,0.8,0.05,0.04,C.crim);for(const s of[-1,1])box(s*0.56,1.3,0,0.3,0.3,0.6,C.crim);
  sph(0,1.75,0,0.62,0.6,0.6,C.ink,0,1,0,1);put(CONE,0,2.08,0,0,0,0,1.5,0.42,1.5,C.black,0,.6);sph(0,2.06,0.52,0.22,0.22,0.08,C.gold);
  for(const s of[-1,1]){sph(s*0.17,1.78,0.26,0.16,0.12,0.08,aim?C.red:C.yellow,0,0,F_UNLIT);put(CONE,s*0.16,1.56,0.28,0,0,0,0.08,0.18,0.08,C.white)}
  mPush();mT(0,1.3,0.25-rec*0.15);mRX(aim?0:st==='rec'?0.5:0.35);box(0.12,0,0.55,0.1,0.12,1.5,C.woodD);put(CYL,0.12,0.04,0.95,PI/2,0,0,0.09,1.1,0.09,C.gunD,0,.8);box(0.12,-0.08,-0.1,0.12,0.26,0.4,C.wood);box(0.12,0.1,0.3,0.05,0.08,0.12,C.gold);
  for(const s of[-1,1])put(BOX,s*0.36,-0.02,0.22,0,-s*0.5,0,0.18,0.18,0.7,C.ink);mPop();gTint=0;mPop();
  if(aim){const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw),ox=e.x+fx*1.3,oz=e.z+fz*1.3,t=rayWorld(ox,1.35,oz,fx,0,fz,60),lock=e.stT>K.aim-K.lock;
   if(!lock||Math.sin(e.t*50)>0){mPush();mT(ox+fx*t/2,1.35,oz+fz*t/2);mRY(e.yaw);mS(lock?0.1:0.05,lock?0.1:0.05,t);emit(BOX,lock?C.white:C.red,0,0,NF,0);mPop()}
   bill(STAR,ox,1.35,oz,0.25+sat(e.stT/K.aim)*0.4,e.t*6,C.red,NF)}}},
// ---- 影法師 ----
shade:{sc:300,g:14,
 init(e){e.hp=FT.shade.hp;e.r=0.8;e.cd=rnd(3,5)},
 upd(e,dt,T,dx,dz,d,wy){const K=FT.shade,red=e.v===1;
  if(e.st==='chase'){e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*6);const wob=Math.sin(e.t*1.9+e.seed)*0.7,mx=dx/d-dz/d*wob,mz=dz/d+dx/d*wob,ml=Math.hypot(mx,mz)||1,near=d<(red?K.riseR:K.riseB);if(!near){e.x+=mx/ml*K.spd*dt;e.z+=mz/ml*K.spd*dt}e.cd-=dt;
   if((near&&e.stT>0.8)||(e.cd<=0&&d<K.riseR+4)){e.st='rise';e.stT=0}}
  else if(e.st==='rise'){e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*(red?6:3));if(e.stT>K.rise){e.st='slam';e.stT=0;
    if(red){for(let i=0;i<K.fireN;i++){const p=i?pickR():T,j=i?3:0.8,tx=clamp(p.x+rnd(-j,j),-BX+2,BX-2),tz=clamp(p.z+rnd(-j,j),BZ0+2,BZ1-2),ft=1.25;shots.push({id:++eidN,k:4,x:e.x,y:2.6,z:e.z,vx:(tx-e.x)/ft,vy:-2.6/ft+8*ft,vz:(tz-e.z)/ft,r:0.5,dmg:K.fireDmg,g:16,life:9,tx,tz,sm:1})}ev('txt','ボッ',r1(e.x),3.6,r1(e.z),56,'boom')}
    else{const sx=e.x+Math.sin(e.yaw)*1.8,sz=e.z+Math.cos(e.yaw)*1.8;ev('smash',r1(sx),r1(sz));areaHurt(sx,sz,K.slamR,K.slamDmg,1)}}}
  else if(e.st==='slam'){if(e.stT>K.up){e.st='sink';e.stT=0}}
  else if(e.st==='sink'){if(e.stT>0.5){e.st='chase';e.stT=0;e.cd=rnd(4,6)}}},
 sph(e){const k=shadeK(e);return k<0.5?[]:[[e.x,1.3*k,e.z,0.95,1],[e.x,2.55*k,e.z,0.58,2]]},
 ctr(e){return[e.x,1.4,e.z,1.4]},
 die(e){foeDie(e,e.v?C.crim:C.inkD,'ジュワァ…',8)},
 draw(e){const k=shadeK(e),red=e.v===1,c=red?C.crim:C.ink,t=e.t,NF=F_UNLIT|F_NOCAST,pr=e.st==='spawn'?sat(e.stT/0.7):1,fx=Math.sin(e.yaw),fz=Math.cos(e.yaw);
  put(CYL,e.x,0.09,e.z,0,0,0,(2.6-k*0.6)*pr,0.05,(2.2-k*0.5)*pr,C.inkD,0,.8,F_NOCAST);for(let i=0;i<3;i++){const a=t*1.3+i*2.1;sph(e.x+Math.cos(a)*0.9*pr,0.1,e.z+Math.sin(a)*0.75*pr,0.7,0.22,0.7,c,0,.6)}
  if(k<0.3&&pr>0.9)for(const s of[-1,1])sph(e.x+fx*0.5+fz*s*0.3,0.2,e.z+fz*0.5-fx*s*0.3,0.24,0.12,0.24,red?C.orange:C.yellow,0,0,NF);
  if(e.st==='rise'&&!red){const s=FT.shade.slamR*2+Math.sin(t*20)*0.3;put(RING,e.x+fx*1.8,0.13,e.z+fz*1.8,0,0,0,s,1,s,C.red,0,0,NF)}
  if(k<=0.02)return;
  mPush();mT(e.x,0,e.z);mRY(e.yaw);mRZ(Math.sin(t*3)*0.05);mS(1,k,1);gTint=e.flash>0?1:0;gId=nid();
  sph(0,0.9,0,2.0,2.0,1.7,c,0,.6,0,1);sph(0,1.9,0,1.5,1.4,1.3,c,0,.6,0,1);sph(0,2.6,0.05,1.15,1.1,1.05,c,0,.6,0,1);gId=0;
  const ar=e.st==='rise'?-2.5*sat(e.stT/FT.shade.rise):e.st==='slam'&&e.stT<0.2?0.5:0.15;
  for(const s of[-1,1]){put(CONE,s*0.42,3.2,0,0,0,-s*0.5,0.3,0.8,0.3,red?C.orange:C.gold,0,.6);put(SPH,s*0.22,2.68,0.48,0,0,s*0.35,0.3,0.13,0.1,red?C.orange:C.yellow,0,0,F_UNLIT);
   mPush();mT(s*1.0,2.0,0);mRX(ar);put(SPH,s*0.15,-0.7,0,0,0,-s*0.15,0.5,1.5,0.5,c,0,.6);sph(s*0.2,-1.45,0,0.72,0.72,0.72,C.inkD);mPop()}
  box(0,2.32,0.52,0.62,0.14,0.1,C.white);
  if(red)for(let i=0;i<3;i++)put(CONE,(i-1)*0.4,3.35-Math.abs(i-1)*0.15,-0.2,-0.3,0,-(i-1)*0.3,0.5,1.0,0.5,i===1?C.yellow:C.orange,0,0,F_UNLIT|F_FLAME);
  else for(let i=0;i<3;i++){const a=t*1.5+i*TAU/3;sph(Math.cos(a)*0.24,1.5+Math.sin(a)*0.24,0.86,0.3,0.3,0.1,C.red,0,0,F_UNLIT)}
  gTint=0;mPop()}}};
// ---- enemy shots of the new kinds: 2 ice shard / 3 bullet (both straight) / 4 fire ball / 5 falling rubble / 6 thrown lantern (lobbed) ----
function shotUpd2(s){if(s.k>=15||s.k===7)return seaShot(s);// 5面 (sea.js / kraken.js)
if(s.k>=8)return mbShot(s);// 中ボスの斬撃 (midboss.js)
if(s.k===3){for(const c of colC)if(s.y<c.h&&Math.hypot(s.x-c.x,s.z-c.z)<c.r){popShot(s);return true}for(const b of colB)if(s.y<b.h&&s.x>b.x0&&s.x<b.x1&&s.z>b.z0&&s.z<b.z1){popShot(s);return true}}
if(s.k<4)return false;
if(s.k===6){if(s.vy<0&&s.y<3.5){s.dead=true;ev('lanpop',r1(s.x),r1(s.y),r1(s.z));if(enemies.length<14){const e=mkEnemy('lan',s.x,s.z);e.y=e.by=Math.max(2.6,s.y)}}}
else if(s.y<0.35){s.dead=true;if(s.k===4){ev('fball',r1(s.x),r1(s.z),s.sm?1:0);areaHurt(s.x,s.z,s.sm?2.4:3.0,s.dmg)}else{ev('rubble',r1(s.x),r1(s.z));areaHurt(s.x,s.z,2.8,s.dmg)}}return true}
function popShot2(s){if(s.k>=15||s.k===7)return seaPop(s);if(s.k>=8)return mbPop(s);if(s.k===2){fxStar(s.x,s.y,s.z,1.2,C.white,0.08);fxSparks(s.x,s.y,s.z,5,5,C.ice)}else if(s.k===3){fxStar(s.x,s.y,s.z,0.9,C.yellow,0.07);fxSparks(s.x,s.y,s.z,4,5,C.yellow)}
else if(s.k===6){fxStar(s.x,s.y,s.z,2,C.yellow,0.1);fxSmoke(s.x,s.y,s.z,4,0.8,C.smoke,2)}else explode(s.x,s.y,s.z,1.1,{quiet:1})}
function drawShot2(s){const NF=F_UNLIT|F_NOCAST;if(s.k>=15||s.k===7)return seaDrawShot(s);if(s.k>=8)return mbDrawShot(s);
if(s.k===2){mPush();mT(s.x,s.y,s.z);orient(s.vx,s.vy,s.vz);mRX(PI/2);mS(0.3,0.9,0.3);emit(CONE,C.ice,0,1,0,0);mPop();bill(STAR,s.x,s.y,s.z,0.4,now*9,C.white,NF);return}
if(s.k===3){sph(s.x,s.y,s.z,0.3,0.3,0.3,C.yellow,0,0,NF);mPush();mT(s.x-s.vx*0.025,s.y,s.z-s.vz*0.025);orient(s.vx,s.vy,s.vz);mS(0.07,0.07,1.4);emit(BOX,C.white,0,0,NF,0);mPop();return}
const r=(s.k===5?5.6:s.k===6?2.4:s.sm?4.8:6)+Math.sin(now*18)*0.4;
if(s.k===4){sph(s.x,s.y,s.z,1.0,1.0,1.0,C.orange,0,0,NF);bill(BURST,s.x,s.y,s.z,1.5,now*12,C.yellow,NF)}
else if(s.k===5){put(BOX,s.x,s.y,s.z,s.id+now*3,s.id*2+now*2,0,1.5,0.9,1.3,C.troof,5);put(BOX,s.x+0.5,s.y+0.6,s.z-0.3,now*4,s.id,0,0.8,0.5,0.7,C.troofD)}
else{sph(s.x,s.y,s.z,0.95,1.15,0.95,C.lant,6,0,F_UNLIT);cyl(s.x,s.y+0.56,s.z,0.5,0.14,0.5,C.black);cyl(s.x,s.y-0.56,s.z,0.5,0.14,0.5,C.black)}
put(RING,s.tx,0.11,s.tz,0,0,0,r,1,r,s.k===6?C.orange:C.red,0,0,NF)}
// ---- ground hazards ----
// a burning patch: dl = warning time before it lights; long = a fire ball's fire (at most BT.aka.fireMax of those at once, STORY.md 炎の制限)
function addFire(x,z,r,life,dl,long){if(Math.abs(x)>BX+1||z>BZ1+1||z<BZ0-1)return;if(long){let n=0,first=-1;for(let i=0;i<fires.length;i++)if(fires[i].long){n++;if(first<0)first=i}if(n>=BT.aka.fireMax)fires.splice(first,1)}
if(fires.length>70)fires.shift();fires.push({x,z,r,life,max:life,dl:dl||0,long:long?1:0,s:rnd(0,9)})}
const spinA=(s,k)=>s.dir*(-1.6-k*BT.aka.spinGap+BT.aka.spinW*Math.max(0,s.t));
function hazTick(dt){if(boss&&boss.st==='die')hazReset();const live=!pl.dead&&(G.state==='play'||G.demoOn);exTick(dt,live);shTick(dt,live);mbTick(dt,live);krTick(dt,live);
if(ices.length&&!(boss&&boss.monk))for(let i=ices.length-1;i>=0;i--){ices[i].life-=dt/7;if(ices[i].life<=0)ices.splice(i,1)}
for(let i=fires.length-1;i>=0;i--){const f=fires[i];if(f.dl>0){f.dl-=dt;if(f.dl<=0){fxStar(f.x,0.6,f.z,f.r*1.6,C.orange,0.12);if(lim('fwh',0.15))snd('whoosh')}continue}f.life-=dt;if(f.life<=0){fires.splice(i,1);continue}
 if(live&&pl.y<1.5&&Math.hypot(pl.x-f.x,pl.z-f.z)<f.r*0.9&&lim('burn',BT.aka.burnT)){const h=pl.hp;hurtPlayer(BT.aka.burn,f.x,f.z);if(pl.hp<h)addText('アチチ！',W/2,H*0.62,{size:64,st:'boom',life:0.45})}}
for(let i=lwaves.length-1;i>=0;i--){const w=lwaves[i];if(w.dl>0){w.dl-=dt;continue}const z0=w.z;w.z+=BT.beta.waveV*dt;if(live&&!w.hit&&pl.z>=z0-0.6&&pl.z<=w.z+0.6&&pl.y<0.6){w.hit=true;hurtPlayer(BT.beta.waveDmg,pl.x,w.z-3)}
 if(lim('lwfx',0.08))fxBlobs(rnd(-BX,BX),0.8,w.z,2,5,C.ink,0.14);if(w.z>BZ1+3)lwaves.splice(i,1)}
for(let i=sweeps.length-1;i>=0;i--){const s=sweeps[i],a0=s.dir*lerp(-1.3,1.3,sat(s.t/s.dur));s.t+=dt;const a1=s.dir*lerp(-1.3,1.3,sat(s.t/s.dur)),pa=Math.atan2(pl.x,pl.z+26);
 if(live&&!s.hit&&pa>=Math.min(a0,a1)-0.04&&pa<=Math.max(a0,a1)+0.04&&Math.hypot(pl.x,pl.z+26)<s.R+6&&pl.y<0.75){s.hit=true;hurtPlayer(s.d,pl.x-s.dir*5,pl.z)}
 if(lim('swfx',0.03)){const d=rnd(14,s.R+4);fxSmoke(Math.sin(a1)*d,0.4,-26+Math.cos(a1)*d,1,1.4,C.smoke,3)}if(s.t>s.dur)sweeps.splice(i,1)}
for(let i=spins.length-1;i>=0;i--){const s=spins[i],K=BT.aka;s.t+=dt;if(s.t>(3.2+K.spinGap)/K.spinW){spins.splice(i,1);continue}if(s.t<0||!live)continue;
 for(let k=0;k<2;k++){const a=spinA(s,k),px=pl.x,pz=pl.z+17,al=px*Math.sin(a)+pz*Math.cos(a),pp=px*Math.cos(a)-pz*Math.sin(a);if(al>5&&Math.abs(pp)<0.95&&Math.abs(a)<1.75&&lim('spinh',0.5))hurtPlayer(K.spinDmg,pl.x-Math.cos(a)*s.dir,pl.z+Math.sin(a)*s.dir)}}}
function drawHaz(){const NF=F_UNLIT|F_NOCAST,FF=NF|F_FLAME;exDraw();shDraw();krDraw();
for(const f of fires){if(f.dl>0){if(Math.sin(now*30)>0)put(RING,f.x,0.12,f.z,0,0,0,f.r*2,1,f.r*2,C.red,0,0,NF);continue}const k=Math.min(1,f.life*2,(f.max-f.life)*5+0.3),r=f.r*k;
 put(CYL,f.x,0.08,f.z,0,0,0,r*2,0.03,r*2,C.redD,0,0,NF|F_NOEDGE);for(let i=0;i<5;i++){const a=f.s+i*1.57,q=i?0.55:0,h=(i?0.85:1.2)*r*(0.75+0.25*Math.sin(now*9+f.s+i*2)),w=r*(i?0.6:0.78);put(CONE,f.x+Math.cos(a)*r*q,h*0.5,f.z+Math.sin(a)*r*q,0,a,0,w,h,w,i%2?C.orange:C.yellow,0,0,FF)}}
for(const w of lwaves){if(w.dl>0)continue;const wd=BX*2+6;gId=nid();box(0,0.6,w.z,wd,1.2,1.5,BI,0,.6);for(let i=0;i<14;i++)sph(-BX+(i+0.5)*(BX*2/14),1.25+Math.sin(now*9+i*1.7)*0.3,w.z-0.2,3.6,2.0,2.2,BI,0,.6,0,1);gId=0;
 for(let i=0;i<14;i++)sph(-BX+(i+0.5)*(BX*2/14),1.7+Math.sin(now*9+i*1.7)*0.3,w.z+0.7,1.6,0.5,0.6,C.white,0,0,NF);box(0,0.11,w.z+2.8,wd,0.02,1.2,C.red,0,0,NF)}
for(const s of spins){const tele=s.t<0;for(let k=0;k<2;k++){const a=spinA(s,k);if(Math.abs(a)>1.75)continue;const sx=Math.sin(a),cz=Math.cos(a);
 if(tele){if(Math.sin(now*24)>0){mPush();mT(sx*29,0.12,-17+cz*29);mRY(a);mS(1.2,0.02,46);emit(BOX,C.red,0,0,NF,0);mPop()}continue}
 mPush();mT(sx*29,0.1,-17+cz*29);mRY(a);mS(1.5,0.02,46);emit(BOX,C.redD,0,0,NF|F_NOEDGE,0);mPop();
 for(let d=6;d<52;d+=1.7){const j=Math.round(d/1.7),h=2.0+Math.sin(now*11+j*1.3)*0.7;put(CONE,sx*d,h*0.5,-17+cz*d,0,j,0,1.2,h,1.2,j%2?C.orange:C.yellow,0,0,FF)}}}}
Object.assign(FXE,{
kland(x,z){fxRing(x,0.1,z,5.5,C.white,0.3);fxSmoke(x,0.3,z,5,0.9,C.smoke,3.5);shake(0.2);snd('land');sfxAt('ドスッ',x,2.4,z,{size:54,st:'boom',life:0.45})},
rbite(x,z){fxStar(x,1.1,z,2.4,C.white,0.1);fxSparks(x,1,z,5,6,C.white);snd('slash');sfxAt('ガブッ',x,2.6,z,{size:54,st:'hurt',life:0.45})},
gshot(x,z){fxStar(x,1.35,z,1.8,C.yellow,0.08);fxSmoke(x,1.4,z,3,0.5,C.smoke,1.5);snd('sgun');sfxAt('パァン！',x,2.8,z,{size:50,st:'fire',life:0.35})},
ice(x,z,r){ices.push({x,z,r,life:0.6})},
icebrk(x,z){fxDebris(x,2,z,14,9,C.ice,0.35);fxStar(x,2,z,4,C.white,0.12);fxRing(x,0.1,z,6,C.cyan,0.3);snd('clank');snd('freeze');shake(0.35);stopT(0.06);sfxAt('バキィッ！',x,4.4,z,{size:70,st:'cyan',life:0.6})},
fball(x,z,sm){explode(x,0.6,z,sm?1.0:1.5,{text:'ボォン！'});addFire(x,z,sm?2.0:2.6,sm?4:BT.aka.fireLife,0,sm?0:1)}});
