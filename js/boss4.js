'use strict';
// ================= STAGE 4 BOSS: 鐘の僧 (STORY.md 3, 5) =================
// Model: blender/boss_monk.blend -> assets/boss_monk.glb (tools/blender_export_stage.py). Parts are separate nodes and are
// posed here every frame: Monk_Body / Monk_Head / Monk_Head2 (phase 2 face) / Monk_Arm_L / Monk_Arm_R / Monk_Leg_L / Monk_Leg_R,
// Bell (on the back), Striker (right hand), Striker_L (left hand, phase 2).
// Phase 1: the bell on his back is armour. Shots from behind hit the bell (no HP damage); the face takes damage only from the
//          front and the robe only a little. Every few bell hits it rings (ゴォォン) and the monk is stunned. Break the bell -> phase 2.
// Phase 2: the oni mask covers the face, a second horn, a striker in each hand; faster, chained stomps, straight charges.
//          The fallen bell stays on the ground as cover: it blocks the stomp shock waves and bodies.
// Attacks: run (then a stop = opening), leap stomp with a landing ring (shock wave + ice patch), strike his own bell (sound-wave
//          rings, phase 1), charge (phase 2). He is the only boss that moves around (STORY.md 5).
// Host runs updMonk; clients get the state through snapMsg (m.k) and only animate (monkCos).
const MK_SC=1.3,MK_R=2.2,MK_BELL_R=1.5,MK_RING=100;
const ices=[];
const MONK={ready:false,root:null};
loadGlbBuf('assets/boss_monk.glb').then(monkLoad)
 .catch(e=>console.warn('[boss4] assets/boss_monk.glb failed to load, drawing a stand-in shape:',e));
function monkLoad(buf){const g=glbParse(buf),J=g.j,geo=new Map();
const primOf=p=>{const key=p.attributes.POSITION+'/'+p.attributes.NORMAL+'/'+p.indices;if(geo.has(key))return geo.get(key);
 const P=glbAcc(g,p.attributes.POSITION).v,N=glbAcc(g,p.attributes.NORMAL).v,I=glbAcc(g,p.indices).v,mb=new MB(),v=k=>[P[k*3],P[k*3+1],P[k*3+2]],n=k=>[N[k*3],N[k*3+1],N[k*3+2]];
 for(let t=0;t<I.length;t+=3)mb.tri(v(I[t]),v(I[t+1]),v(I[t+2]),n(I[t]),n(I[t+1]),n(I[t+2]));const pi=addPrim(mb);geo.set(key,pi);return pi};
const matOf=i=>{const m=(J.materials||[])[i]||{},x=m.extras||{},bc=(m.pbrMetallicRoughness||{}).baseColorFactor||[1,1,1,1];return{c:[bc[0],bc[1],bc[2]],mat:x.kb_mat|0,gloss:+x.kb_gloss||0,fl:x.kb_flags|0,rim:+x.kb_rim||0}};
const mk=ni=>{const n=J.nodes[ni],o={name:n.name,m:glbNodeMat(n),items:[],ch:(n.children||[]).map(mk)};
 if(n.mesh!==undefined)for(const p of J.meshes[n.mesh].primitives)o.items.push({pi:primOf(p),...matOf(p.material)});MONK[n.name]=o;return o};
for(const ni of J.scenes[J.scene||0].nodes){const o=mk(ni);if(o.name==='Boss4_Root')MONK.root=o}
MONK.ready=!!(MONK.root&&MONK.Bell)}

// ---------------- state ----------------
function mkMonk(id){const k=1+0.8*(G.np-1),hp=(G.demoOn?2600:3400)*k,bh=760*(1+0.6*(G.np-1));
return{id,type:'boss',monk:1,x:0,y:0,z:-42,yaw:0,t:0,st:'drop',stT:0,flash:0,bflash:0,dead:false,seed:1,mine:-9,hp,mhp:hp,phase:1,bhp:bh,bmax:bh,ring:0,rcd:0,
 atk:0,cdT:0.6,tx:0,tz:-18,ax:0,az:-42,chain:0,dx:0,dz:1,dur:0,wp:0,wa:0,px:0,pz:-42,ti:null,r:MK_R,bell2:null,
 yo:0,hx:0,hL:{x:0,y:0,z:0},hR:{x:0,y:0,z:0},ah:-1,mouth:0}}
function spawnMonk(){const b=mkMonk(++eidN);enemies.push(b);boss=b;bossIntro();templeDoor.target=1;return b}
const mkFace=(b,x,z)=>Math.atan2(x-b.x,z-b.z);
const mkFront=(b,x,z)=>(x-b.x)*Math.sin(b.yaw)+(z-b.z)*Math.cos(b.yaw)>0;
// model-space point (unscaled, model faces +Z) -> world
function mkW(b,lx,ly,lz){const c=Math.cos(b.yaw),s=Math.sin(b.yaw);return[b.x+(lx*c+lz*s)*MK_SC,b.y+ly*MK_SC,b.z+(-lx*s+lz*c)*MK_SC]}
// hit spheres [x,y,z,r,multiplier,tag]. Multiplier 0 = no damage (back of the head in phase 1). Tag 'bell' = bell armour.
function monkSph(b){if(b.st==='drop'&&b.stT<1.6)return[];const p1=b.phase<2,front=mkFront(b,pl.x,pl.z),hm=p1&&!front?0:2,bm=p1?0.2:1,S=(lx,ly,lz,r,m,tg)=>{const w=mkW(b,lx,ly,lz);w.push(r*MK_SC,m,tg||0);return w};
const a=[S(0,5.15,0.08,0.56,hm),S(0,3.75,0,1.15,bm),S(0,2.1,0,1.4,bm)];if(p1)a.push(S(0,3.6,-1.83,1.1,1,'bell'),S(0,4.9,-1.6,0.85,1,'bell'));return a}
function monkCenter(b){return[b.x,b.y+3.6*MK_SC,b.z,2.6*MK_SC]}
// a point inside the fallen bell's shadow (seen from x0,z0) is covered
function monkCover(x0,z0,x1,z1){const b=boss;if(!b||!b.monk||!b.bell2||b.bell2.y>0.3)return false;const c=b.bell2,dx=x1-x0,dz=z1-z0,l2=dx*dx+dz*dz||1,
 t=clamp(((c.x-x0)*dx+(c.z-z0)*dz)/l2,0,1),px=x0+dx*t-c.x,pz=z0+dz*t-c.z;return px*px+pz*pz<MK_BELL_R*MK_BELL_R&&t<0.98}
function onIce(x,z){for(const i of ices)if(Math.hypot(x-i.x,z-i.z)<i.r*Math.min(1,i.life))return true;return false}

// ---------------- damage ----------------
// a shot / beam hit the bell (local player). Clients send it to the host as damage to -id.
function monkBellHit(b,dmg,hx,hy,hz,quiet){if(b.phase>1||b.st==='drop'||b.st==='die')return;b.bflash=0.07;hitMark=0.1;hitCrit=false;
if(!quiet){fxSparks(hx,hy,hz,6,7,C.gold);fxStar(hx,hy,hz,1.2,C.yellow,0.08);snd('clank');addGauge(1);if(lim('bellT',0.3))sfxAt(pick(['カァン！','ガィン！','キィン！']),hx,hy+1,hz,{size:46,st:'fire',life:0.3})}
if(isCli()){net.dacc[-b.id]=(net.dacc[-b.id]||0)+dmg;return}monkBell(b,dmg)}
function monkClank(b,hx,hy,hz){fxSparks(hx,hy,hz,4,6,C.white);snd('clank');if(lim('clankT',0.5))sfxAt('ガキン！',hx,hy+1,hz,{size:40,st:'ink',life:0.3})}
// host: bell takes damage; enough hits in a row ring it and stun the monk; zero durability breaks it (phase 2)
function monkBell(b,dmg){if(b.phase>1||b.dead||b.st==='die'||b.st==='drop')return;b.bhp-=dmg;b.ring+=dmg;b.bflash=0.07;
if(b.bhp<=0){b.bhp=0;monkBreak(b);return}
if(b.ring>=MK_RING&&b.rcd<=0&&b.st!=='air'&&b.st!=='stun'&&b.st!=='roar'){b.ring=0;b.st='stun';b.stT=0;b.y=0;ev('mgong',r1(b.x),r1(b.z))}}
function monkBreak(b){b.phase=2;b.st='break';b.stT=0;b.y=0;const fx=Math.sin(b.yaw),fz=Math.cos(b.yaw);
const x=clamp(b.x-fx*3.4,-BX+2,BX-2),z=clamp(b.z-fz*3.4,BZ0+2,BZ1-2);b.bell2=mkBell2(b,x,z,b.yaw);
ev('mbreak',r1(x),r1(z));ev('say','オノレ','ェェェ!!',1)}
function mkBell2(b,x,z,yaw){const w=mkW(b,0,2.85,-1.95);return{x,z,yaw,t:0,x0:w[0],z0:w[2],y0:w[1],y:w[1],tilt:0.15,landed:false}}

// ---------------- host update ----------------
const MK_P1=['run','leap','run','ring'],MK_P2=['run','leap','aim','leap','run','aim'];
function updMonk(b,dt){monkAnim(b,dt);G.mood=Math.min(1,G.mood+dt*0.5);const p2=b.phase>1,T=bossT(b);
const turn=(x,z,k)=>{b.yaw+=angDiff(mkFace(b,x,z),b.yaw)*Math.min(1,dt*k)};
const toStop=d=>{b.st='stop';b.stT=0;b.dur=d};
const crouch=()=>{b.st='crouch';b.stT=0;let tx=T.x+(T.vx||0)*0.35,tz=T.z+(T.vz||0)*0.35;const o={x:tx,z:tz};collide(o,MK_R);b.tx=o.x;b.tz=o.z};
const contact=d=>{for(const p of allP())if(Math.hypot(p.x-b.x,p.z-b.z)<MK_R+0.7&&p.y<2.6&&lim('mkc'+p.slot,0.7))hurtT(p,d,b.x,b.z)};
if(b.st==='drop'){const u=(b.stT-1.0)/0.9;if(u<0)return;const k=Math.min(1,u);b.x=0;b.z=lerp(-42,-18,k);b.y=lerp(16,0,k)+Math.sin(k*PI)*8;b.yaw=0;
 if(u>=1){b.y=0;b.st='roar';b.stT=0;ev('mland',0,-18,0,1)}return}
if(b.st==='die'){b.y=Math.max(0,b.y-dt*14);monkDieFx(b);if(b.stT>BDIE_END){ev('mend',r1(b.x),r1(b.z));b.dead=true;G.endT=0;G.score+=5000;G.kills++}return}
if(b.st==='roar'){if(b.stT>1.5){b.st='idle';b.stT=0;b.cdT=0.4}return}
if(b.st==='break'){if(b.stT>1.8){b.st='idle';b.stT=0;b.cdT=0.2}return}
if(b.st==='stun'){if(b.stT>1.9){b.st='idle';b.stT=0;b.cdT=0.25;b.rcd=1.2}return}
if(b.st==='idle'){turn(T.x,T.z,6);if(b.stT>b.cdT){b.ti=null;const pat=p2?MK_P2:MK_P1,m=pat[b.atk++%pat.length];b.stT=0;b.chain=0;
  if(m==='run'){b.st='run';b.dur=p2?rnd(1.1,1.5):rnd(1.6,2.2)}else if(m==='leap')crouch();else if(m==='ring'){b.st='ring';b.rang=0}else{b.st='aim'}}}
else if(b.st==='run'){turn(T.x,T.z,p2?5:3);const sp=p2?10.5:7.2,fx=Math.sin(b.yaw),fz=Math.cos(b.yaw);b.x+=fx*sp*dt;b.z+=fz*sp*dt;collide(b,MK_R);contact(14);
 if(Math.hypot(T.x-b.x,T.z-b.z)<3.4)crouch();else if(b.stT>b.dur)toStop(p2?0.55:1.0)}
else if(b.st==='crouch'){turn(b.tx,b.tz,8);if(b.stT>(p2?0.32:0.55)){b.st='air';b.stT=0;b.ax=b.x;b.az=b.z}}
else if(b.st==='air'){const D=p2?0.6:0.85,u=Math.min(1,b.stT/D);b.x=lerp(b.ax,b.tx,u);b.z=lerp(b.az,b.tz,u);b.y=Math.sin(u*PI)*(p2?6:7.5);
 if(u>=1){b.y=0;b.st='land';b.stT=0;ev('mland',r1(b.x),r1(b.z),p2?1:0,0);areaHurt(b.x,b.z,3.6,20)}}
else if(b.st==='land'){if(b.stT>(p2?0.18:0.3)){if(p2&&b.chain<2){b.chain++;crouch()}else toStop(p2?0.5:0.9)}}
else if(b.st==='ring'){if(b.stT<0.7)turn(T.x,T.z,4);if(!b.rang&&b.stT>0.82){b.rang=1;ev('mring',r1(b.x),r1(b.z))}if(b.stT>1.5)toStop(0.7)}
else if(b.st==='aim'){turn(T.x,T.z,7);if(b.stT>0.5){b.st='charge';b.stT=0;b.dx=Math.sin(b.yaw);b.dz=Math.cos(b.yaw)}}
else if(b.st==='charge'){const ox=b.x,oz=b.z,sp=21;b.x+=b.dx*sp*dt;b.z+=b.dz*sp*dt;collide(b,MK_R);contact(20);
 if(lim('mkdust',0.06))fxSmoke(b.x,0.3,b.z,1,1.2,C.snow,2);
 const moved=Math.hypot(b.x-ox,b.z-oz);if(moved<sp*dt*0.5&&b.stT>0.1){ev('smash',r1(b.x+b.dx*2),r1(b.z+b.dz*2));toStop(0.9)}else if(b.stT>1.05)toStop(0.6)}
else if(b.st==='stop'){if(b.stT>b.dur){b.st='idle';b.stT=0;b.cdT=p2?0.15:0.35}}}

// ---------------- shared animation / cosmetics (host and clients) ----------------
function monkAnim(b,dt){b.t+=dt;b.stT+=dt;b.flash-=dt;b.bflash-=dt;b.rcd-=dt;
const sp=b.y<0.2?Math.hypot(b.x-b.px,b.z-b.pz)/Math.max(dt,1e-3):0;b.px=b.x;b.pz=b.z;b.wa=lerp(b.wa,Math.min(1.2,sp/7),Math.min(1,dt*8));b.wp+=Math.min(sp,24)*dt*0.9;
if(b.wa>0.5&&Math.sin(b.wp)*Math.sin(b.wp-Math.min(sp,24)*dt*0.9)<0){fxSmoke(b.x,0.2,b.z,2,0.9,C.snow,1.5);if(b.st==='charge'||lim('mkstep',0.25))shake(0.05)}
for(let i=ices.length-1;i>=0;i--){ices[i].life-=dt/7;if(ices[i].life<=0)ices.splice(i,1)}
const c=b.bell2;if(c){c.t+=dt;const u=Math.min(1,c.t/0.6);c.x0+=(c.x-c.x0)*Math.min(1,dt*8);c.z0+=(c.z-c.z0)*Math.min(1,dt*8);c.y=Math.max(0,lerp(c.y0,0,u*u));c.tilt=lerp(0.15,-0.08,u);
 if(u>=1&&!c.landed){c.landed=true;c.x0=c.x;c.z0=c.z;fxSmoke(c.x,0.4,c.z,8,2.2,C.snow,4);fxRing(c.x,0.1,c.z,6,C.white,0.3);snd('gong');snd('boom',0.6);shake(0.5);sfxAt('ドゴォン！',c.x,3.4,c.z,{size:70,st:'boom',life:0.6})}}
if(b.st==='stun'&&lim('mkstar',0.18)){const h=mkW(b,0,5.9,0);fxStar(h[0]+rnd(-1,1),h[1]+rnd(-0.3,0.4),h[2]+rnd(-1,1),0.8,C.yellow,0.25)}
if(b.st==='aim'&&lim('mkaim',0.1))lines(0.5,'#c20020')}
function monkCos(b,dt){monkAnim(b,dt);G.mood=Math.min(1,G.mood+dt*0.5);if(b.st==='die')monkDieFx(b)}
const MK_DIE=[[0.3,-1.2,5.6,1.6],[0.7,1.3,3.8,1.5],[1.05,-0.8,6.4,1.8],[1.35,1.0,4.4,1.9]];
function monkDieFx(b){b.pops=b.pops||0;const fx=Math.sin(b.yaw),fz=Math.cos(b.yaw);for(let i=0;i<MK_DIE.length;i++){const q=MK_DIE[i];if(b.stT>=q[0]&&!(b.pops&(1<<i))){b.pops|=1<<i;
 const x=b.x+fz*q[1]+fx*1.2+rnd(-0.5,0.5),y=q[2]+rnd(-0.5,0.5),z=b.z-fx*q[1]+fz*1.2;explode(x,y,z,q[3],{ink:1,quiet:1});sfxAt(i%2?'ボンッ':'バンッ',x,y+2,z,{size:84,st:'boom',life:0.45});snd('boom',0.8);flash(0.3);shake(0.45);b.flash=0.08}}
 if(b.stT>1.4)b.flash=Math.sin(b.stT*48)>0?0.03:0;trauma=Math.max(trauma,b.stT>1.4?0.4:0.12)}

// ---------------- FX events (host runs + broadcasts, clients replay) ----------------
Object.assign(FXE,{
mland(x,z,p2,intro){explode(x,0.6,z,intro?2.6:1.8,{ink:1,text:intro?'ズドォォン！！':'ドスン！'});fxRing(x,0.1,z,intro?16:11,C.white,0.4);fxSmoke(x,0.3,z,10,2.5,C.snow,6);fxDebris(x,0.4,z,8,8,C.snow,0.5);
 decals.push({x,z,r:intro?5:4,life:6});shake(intro?1:0.6);snd('boom',intro?1:0.7);
 if(!intro){shocks.push({x,z,r:3.6,v:13,max:p2?17:20,d:12,hit:false,mk:1});ices.push({x,z,r:p2?3.4:4.2,life:1})}},
mring(x,z){snd('gong');fxRing(x,4,z,10,C.yellow,0.5);fxRing(x,0.2,z,14,C.gold,0.6);shake(0.5);sfxAt('ゴォォォン！',x,8,z,{size:96,st:'boom',life:0.9,grow:0.14});
 shocks.push({x,z,r:1.4,v:15,max:24,d:14,hit:false,mk:1},{x,z,r:-3.6,v:15,max:24,d:14,hit:false,mk:1})},
mgong(x,z){snd('gong');flash(0.3);shake(0.6);stopT(0.08);fxRing(x,5,z,9,C.yellow,0.45);fxStar(x,6,z,4,C.white,0.12);addText('ゴォォォン！！',W/2,H*0.24,{size:104,st:'boom',life:1.0,rot:-0.06});
 if(lim('gongSay',3))say(['鐘を鳴らすと','動きが止まる!'],0)},
mbreak(x,z){snd('gong');snd('boom',1);flash(0.7);shake(1);stopT(0.18);invA=1;addText('バキィッ！',W/2,H*0.3,{size:150,st:'boom',life:1.1,rot:-0.08,grow:0.12});
 const b=boss;if(b){const w=mkW(b,0,4.3,-1.8);fxDebris(w[0],w[1],w[2],18,9,C.gold,0.55);fxStar(w[0],w[1],w[2],5,C.white,0.12);explode(w[0],w[1],w[2],1.6,{quiet:1})}},
mend(x,z){for(let i=0;i<4;i++)explode(x+rnd(-2,2),rnd(1.5,7),z+rnd(-2,2),rnd(1.6,2.4),{quiet:1,ink:1});explode(x,4,z,4.5,{text:'ドォォォォン！'});invA=1;flash(1);stopT(0.25);for(let i=0;i<18;i++)fxOrb(x+rnd(-2,2),rnd(2,7),z+rnd(-2,2))}});

// ---------------- drawing ----------------
const _mkT=m4();function mMul(m){m4mul(_mkT,M,m);M.set(_mkT)}
const MK_POSE={};
function mkNode(n,b){const nm=n.name;if(b.phase>1?(nm==='Monk_Head'||nm==='Bell'):(nm==='Monk_Head2'||nm==='Striker_L'))return;
mPush();mMul(n.m);const p=MK_POSE[nm];if(p){if(p[1])mRY(p[1]);if(p[0])mRX(p[0]);if(p[2])mRZ(p[2])}
if(n.items.length){const bt=nm==='Bell'&&b.bflash>0,g0=gTint;if(bt)gTint=0.6;gId=nid();for(const it of n.items)emit(it.pi,it.c,it.mat,it.gloss,it.fl,it.rim);gId=0;gTint=g0}
for(const c of n.ch)mkNode(c,b);mPop()}
// pose: [rx, ry, rz] per part (rotation about the part's pivot). Model faces +Z; arm rx < 0 swings forward/up.
function monkPose(b){const P=MK_POSE,t=b.t,u=b.stT,p2=b.phase>1,s=Math.sin(b.wp)*Math.min(1,b.wa);
let lL=s*0.55,lR=-s*0.55,aL=[-s*0.45,0,0.06],aR=[s*0.45,0,-0.06],bd=[0,0,0],hd=[0,0,0],bob=Math.abs(Math.sin(b.wp))*0.12*b.wa,lean=0.14*Math.min(1,b.wa),sy=1;
if(p2){aL=[-0.45-s*0.3,0,0.3];aR=[-0.45+s*0.3,0,-0.3]}
const st=b.st;
if(st==='crouch'){const k=sat(u/0.22);sy=1-0.2*k;bob=-0.5*k;lean=0.3*k;aL=[0.8*k,0,0.3*k];aR=[0.8*k,0,-0.3*k]}
else if(st==='air'||st==='drop'){sy=1.05;lL=-0.7;lR=0.3;aL=[-2.6,0,0.25];aR=[-2.6,0,-0.25];lean=-0.05;bob=0}
else if(st==='land'){const k=1-sat(u/0.3);sy=1-0.18*k;bob=-0.35*k;aL=[-0.6,0,0.9*k+0.2];aR=[-0.6,0,-0.9*k-0.2]}
else if(st==='stop'){bob=Math.sin(t*9)*0.06-0.05;lean=0.22;hd=[0.2,0,0];aL=[0.1,0,0.14];aR=[0.1,0,-0.14];if(p2){aL=[-0.2,0,0.3];aR=[-0.2,0,-0.3]}}
else if(st==='ring'){const k=easeOut(sat(u/0.75)),h=sat((u-0.72)/0.12);aR=[lerp(-0.2,-2.9,k)-h*1.1,0,-0.2];lean=-0.12*h;hd=[-0.25*h,0,0]}
else if(st==='stun'){const w=Math.sin(t*5);hd=[0.35,0,w*0.35];bd=[0,0,w*0.07];aL=[0.15,0,0.35];aR=[0.15,0,-0.35];bob=-0.15;lean=-0.05}
else if(st==='break'){const sh=Math.sin(t*34)*0.08;hd=[-0.45,0,sh];aL=[-0.3,0,1.0+sh];aR=[-0.3,0,-1.0-sh];lean=-0.1}
else if(st==='roar'){hd=[-0.35,0,0];aL=[-0.2,0,0.8];aR=[-0.2,0,-0.8];bd=[0,0,Math.sin(t*30)*0.02]}
else if(st==='aim'){const k=sat(u/0.3);lean=0.4*k;sy=1-0.08*k;aL=[0.9*k,0,0.35];aR=[0.9*k,0,-0.35];bob=-0.2*k}
else if(st==='charge'){lean=0.45;const w=Math.sin(t*26);aL=[-1.3+w*0.6,0,0.35];aR=[-1.3-w*0.6,0,-0.35]}
else if(st==='die'){const sh=Math.sin(t*40)*0.05;hd=[-0.4,0,sh];bd=[0,0,sh];aL=[-0.4,0,0.7];aR=[-0.4,0,-0.7]}
P.Monk_Leg_L=[lL,0,0];P.Monk_Leg_R=[lR,0,0];P.Monk_Arm_L=aL;P.Monk_Arm_R=aR;P.Monk_Body=bd;P.Monk_Head=P.Monk_Head2=hd;b.lean=lean;b.bob=bob;b.sy=sy}
function drawMonk(b){if(b.st==='drop'&&b.stT<1.0){drawIces();return}monkPose(b);
mPush();mT(b.x,b.y+b.bob*MK_SC,b.z);mRY(b.yaw);mRX(b.lean);mS(MK_SC*(2-b.sy),MK_SC*b.sy,MK_SC*(2-b.sy));gTint=b.flash>0?0.45:0;
if(MONK.ready)mkNode(MONK.root,b);else{cyl(0,2,0,1.6,2,1.6,C.white);cyl(0,3.7,0,1.1,1.4,1.1,C.white);sph(0,5.15,0,1.1,1.2,1.1,C.paper);if(b.phase<2)sph(0,3.9,-1.8,1.8,2.4,1.8,C.gold)}
gTint=0;mPop();
const NF=F_UNLIT|F_NOCAST;
if(b.st==='crouch'||b.st==='air'||(b.st==='drop'&&b.stT<1.9)){const s=7.4+Math.sin(b.t*20)*0.5,tx=b.st==='drop'?0:b.tx,tz=b.st==='drop'?-18:b.tz;put(RING,tx,0.13,tz,0,0,0,s,1,s,C.red,0,0,NF);put(RING,tx,0.13,tz,0,0,0,s*0.5,1,s*0.5,C.red,0,0,NF)}
if(b.st==='aim'){const fx=Math.sin(b.yaw),fz=Math.cos(b.yaw),a=sat(b.stT/0.25);for(let i=1;i<8;i++){const d=MK_R+i*2.2;put(PYR,b.x+fx*d,0.14,b.z+fz*d,PI/2,b.yaw,0,1.6*a,0.8,1.0,C.red,0,0,NF)}}
if(b.bell2)drawFallenBell(b.bell2);drawIces()}
function drawFallenBell(c){mPush();mT(c.x0,c.y,c.z0);mRY(c.yaw);mRX(c.tilt);mS(MK_SC,MK_SC,MK_SC);gId=nid();
if(MONK.ready)for(const it of MONK.Bell.items)emit(it.pi,it.c,it.mat,it.gloss,it.fl,it.rim);else sph(0,1.3,0,1.8,2.6,1.8,C.gold);gId=0;
// cracks
for(const[a,y,r,l]of[[0.3,1.5,0.4,1.0],[0.5,1.1,-0.6,0.8],[2.4,1.7,0.3,0.9],[3.6,1.0,-0.5,1.1],[4.9,1.4,0.6,0.7]])put(BOX,Math.sin(a)*0.97,y,Math.cos(a)*0.97,0,a,r,0.06,l,0.05,C.inkD,0,0,F_NOCAST);mPop()}
function drawIces(){for(const i of ices){const r=i.r*Math.min(1,i.life*3);put(CYL,i.x,0.03,i.z,0,0,0,r*2,0.03,r*2,C.ice,0,.9,F_NOCAST,0.4);put(CYL,i.x,0.045,i.z,0,0,0,r*1.2,0.02,r*1.2,C.iceP,0,.9,F_NOCAST)}}
