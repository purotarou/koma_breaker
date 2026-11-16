'use strict';
// ================= STAGE 4 BOSS: 鐘の僧 (STORY.md 3, 5) =================
// Model: blender/boss_monk.blend -> assets/boss_monk.glb (tools/blender_export_stage.py). Parts are separate nodes and are
// posed here every frame: Monk_Body / Monk_Head / Monk_Head2 (phase 2 face) / Monk_Jaw・Monk_Jaw2 (open mouth, scaled by b.open)
// / Monk_Arm_L / Monk_Arm_R / Monk_Leg_L / Monk_Leg_R, Bell (on the back), Striker (right hand), Striker_L (left hand, phase 2).
// He never speaks: only drawn sound effects.
// Damage depends on where the shooter stands: front 3% (ガキン！), side 30%, back 100%. The bell on his back stops shots
//   (no HP damage) but wears down (double while he is out of breath). The bell's durability at 0 or HP at half -> transformation (cutscene, both sides invincible).
// Phase 1 (bell on the back): run -> stop, stomp x2 (ice; no shock wave in either phase), a single bell sound wave (jump it) then a short stop.
//   Half of the time stomp x2 is followed by waves x3. Every multi-wave volley (x3 / x4) ends in tired: he stands still and pants (7 s / 5.8 s in phase 2).
// Transformation (st 'trans', 3 s): own camera (monkCam), skin turns black, eyes red, body x1.15, roar with camera shake.
//   If the bell was broken it falls off in the middle; if HP triggered it he keeps the bell.
// Striker slams freeze the player hit (MK_FRZ s) and the second slam re-aims at them (b.sl2), so it always lands.
// Every charge ends in a 1.2 s stop and then the striker slams (phase 2). Phase 2 with bell: waves x4, stomp x3, charge, run -> striker slams (right, left).
// Phase 2 without bell: no sound waves, faster. A charge into the fallen bell -> long tired (9 s) (a wall only ends the charge).
// The fallen bell stays on the ground as cover: it blocks the shock waves and bodies.
// Host runs updMonk; clients get the state through snapMsg (m.k) and only animate (monkCos).
const MK_FRZ=1.0,MK_SC=1.3,MK_R=2.2,MK_BELL_R=1.5,MK_BIG=1.15,MK_TF=3.0;
const ices=[];
const MONK={ready:false,root:null,navy:[0.14,0.16,0.33]},MK_RED=[1,0.12,0.08];
loadGlbBuf('assets/boss_monk.glb').then(monkLoad)
 .catch(e=>console.warn('[boss4] assets/boss_monk.glb failed to load, drawing a stand-in shape:',e));
function monkLoad(buf){const g=glbParse(buf),J=g.j,geo=new Map();
const primOf=p=>{const key=p.attributes.POSITION+'/'+p.attributes.NORMAL+'/'+p.indices;if(geo.has(key))return geo.get(key);
 const P=glbAcc(g,p.attributes.POSITION).v,N=glbAcc(g,p.attributes.NORMAL).v,I=glbAcc(g,p.indices).v,mb=new MB(),v=k=>[P[k*3],P[k*3+1],P[k*3+2]],n=k=>[N[k*3],N[k*3+1],N[k*3+2]];
 for(let t=0;t<I.length;t+=3)mb.tri(v(I[t]),v(I[t+1]),v(I[t+2]),n(I[t]),n(I[t+1]),n(I[t+2]));const pi=addPrim(mb);geo.set(key,pi);return pi};
const matOf=i=>{const m=(J.materials||[])[i]||{},x=m.extras||{},bc=(m.pbrMetallicRoughness||{}).baseColorFactor||[1,1,1,1];return{nm:m.name||'',c:[bc[0],bc[1],bc[2]],mat:x.kb_mat|0,gloss:+x.kb_gloss||0,fl:x.kb_flags|0,rim:+x.kb_rim||0}};
const mk=ni=>{const n=J.nodes[ni],o={name:n.name,m:glbNodeMat(n),items:[],ch:(n.children||[]).map(mk)};
 if(n.mesh!==undefined)for(const p of J.meshes[n.mesh].primitives){const it={pi:primOf(p),...matOf(p.material)};if(it.nm==='boss4_oni')MONK.navy=it.c;o.items.push(it)}MONK[n.name]=o;return o};
for(const ni of J.scenes[J.scene||0].nodes){const o=mk(ni);if(o.name==='Boss4_Root')MONK.root=o}
MONK.ready=!!(MONK.root&&MONK.Bell)}

// ---------------- state ----------------
function mkMonk(id){const k=1+0.8*(G.np-1),hp=(G.demoOn?2600:3400)*k,bh=760*(1+0.6*(G.np-1));
return{id,type:'boss',monk:1,x:0,y:0,z:-42,yaw:0,t:0,st:'drop',stT:0,flash:0,bflash:0,dead:false,seed:1,mine:-9,hp,mhp:hp,phase:1,bhp:bh,bmax:bh,bell:1,tfB:0,
 atk:0,cdT:0.6,tx:0,tz:-18,ax:0,az:-42,chain:0,n:0,k:0,cmb:0,sw:0,dx:0,dz:1,dur:0,wp:0,wa:0,px:0,pz:-42,ti:null,r:MK_R,bell2:null,
 sc:MK_SC,open:0,cue:0,lst:'',yo:0,hx:0,hL:{x:0,y:0,z:0},hR:{x:0,y:0,z:0},ah:-1,mouth:0}}
function spawnMonk(){const b=mkMonk(++eidN);enemies.push(b);boss=b;bossIntro();templeDoor.target=1;return b}
const mkFace=(b,x,z)=>Math.atan2(x-b.x,z-b.z);
const mkFront=(b,x,z)=>(x-b.x)*Math.sin(b.yaw)+(z-b.z)*Math.cos(b.yaw)>0;
const mkSS=x=>x*x*(3-2*x);
// the transformation cutscene is running (camera, input lock, invincibility)
function monkCine(){return !!(boss&&boss.monk&&boss.st==='trans')}
// phase-2 look (black skin, two horns, red eyes): from the white flash of the transformation on
const mkLook2=b=>b.st==='trans'?b.stT>=1.1:b.phase>1;
// model-space point (unscaled, model faces +Z) -> world
function mkW(b,lx,ly,lz){const c=Math.cos(b.yaw),s=Math.sin(b.yaw),k=b.sc;return[b.x+(lx*c+lz*s)*k,b.y+ly*k,b.z+(-lx*s+lz*c)*k]}
// damage multiplier for a shooter at (x,z): front 3%, side 30%, back 100% (0 while invincible)
function monkK(b,x,z){if(b.st==='trans'||b.st==='drop'||b.st==='boff')return 0;const dx=x-b.x,dz=z-b.z,d=Math.hypot(dx,dz)||1,c=(dx*Math.sin(b.yaw)+dz*Math.cos(b.yaw))/d;return c>0.5?0.03:c>-0.5?0.3:1}
// hit spheres [x,y,z,r,multiplier,tag]. Tag 'front' = clank (tiny damage), 'bell' = the bell on his back.
function monkSph(b){if(b.st==='drop'&&b.stT<1.6)return[];const k=monkK(b,pl.x,pl.z),tg=k<0.1?'front':0,S=(lx,ly,lz,r,m,t)=>{const w=mkW(b,lx,ly,lz);w.push(r*b.sc,m,t||0);return w};
const a=[S(0,5.15,0.08,0.56,2*k,tg),S(0,3.75,0,1.15,k,tg),S(0,2.1,0,1.4,k,tg)];if(b.bell&&k>0)a.push(S(0,3.6,-1.83,1.1,1,'bell'),S(0,4.9,-1.6,0.85,1,'bell'));return a}
function monkCenter(b){return[b.x,b.y+3.6*b.sc,b.z,2.6*b.sc]}
// a point inside the fallen bell's shadow (seen from x0,z0) is covered
function monkCover(x0,z0,x1,z1){const b=boss;if(!b||!b.monk||!b.bell2||b.bell2.y>0.3)return false;const c=b.bell2,dx=x1-x0,dz=z1-z0,l2=dx*dx+dz*dz||1,
 t=clamp(((c.x-x0)*dx+(c.z-z0)*dz)/l2,0,1),px=x0+dx*t-c.x,pz=z0+dz*t-c.z;return px*px+pz*pz<MK_BELL_R*MK_BELL_R&&t<0.98}
function onIce(x,z){for(const i of ices)if(Math.hypot(x-i.x,z-i.z)<i.r*Math.min(1,i.life))return true;return false}

// ---------------- damage ----------------
// a shot / beam hit the bell (local player): the bell stops it (no HP damage) but wears down. Clients send it to the host as damage to -id.
function monkBellHit(b,dmg,hx,hy,hz,quiet){dmg*=SK.atk;if(!b.bell||b.st==='drop'||b.st==='die'||b.st==='trans'||b.st==='boff')return;b.bflash=0.07;hitMark=0.1;hitCrit=false;
if(!quiet){fxSparks(hx,hy,hz,6,7,C.gold);fxStar(hx,hy,hz,1.2,C.yellow,0.08);snd('clank');addGauge(1);if(lim('bellT',0.3))sfxAt(pick(['カァン！','ガィン！','キィン！']),hx,hy+1,hz,{size:46,st:'fire',life:0.3})}
if(isCli()){net.dacc[-b.id]=(net.dacc[-b.id]||0)+dmg;return}monkBell(b,dmg)}
function monkClank(b,hx,hy,hz){fxSparks(hx,hy,hz,4,6,C.white);snd('clank');if(lim('clankT',0.5))sfxAt('ガキン！',hx,hy+1,hz,{size:40,st:'ink',life:0.3})}
// host: the bell wears down (double while he is out of breath). At 0 updMonk breaks it when he is on the ground.
function monkBell(b,dmg){if(!b.bell||b.dead||b.st==='die'||b.st==='drop'||b.st==='trans'||b.st==='boff')return;b.bhp=Math.max(0,b.bhp-dmg*(b.st==='tired'?2:1));b.bflash=0.07}
// the bell comes off his back and drops behind him (quiet: no big text, the cutscene shows its own)
function monkDrop(b,quiet){b.bell=0;b.bhp=0;const fx=Math.sin(b.yaw),fz=Math.cos(b.yaw),x=clamp(b.x-fx*3.4,-BX+2,BX-2),z=clamp(b.z-fz*3.4,BZ0+2,BZ1-2);
b.bell2=mkBell2(b,x,z,b.yaw);ev('mbreak',r1(x),r1(z),quiet?1:0)}
function mkBell2(b,x,z,yaw){const w=mkW(b,0,2.85,-1.95);return{x,z,yaw,t:0,x0:w[0],z0:w[2],y0:w[1],y:w[1],tilt:0.15,landed:false}}
function monkTrans(b,fall){b.st='trans';b.stT=0;b.y=0;b.tfB=fall?1:0;b.hp=Math.max(b.hp,b.mhp*0.45);b.cmb=0;b.sw=0;b.nx=0;b.ti=null;shocks.length=0}

// ---------------- host update ----------------
const MK_P1=['run','stomp','run','ring'],MK_P2=['run','aim','stomp','ring','swing','run','aim','stomp','swing','aim'];
// phase 1 telegraphs (stomp ring, bell wind-up) last 1 s longer than phase 2's
const mkW0=b=>b.phase>1?0.72:1.72;
function updMonk(b,dt){monkAnim(b,dt);G.mood=Math.min(1,G.mood+dt*0.5);const p2=b.phase>1,fast=p2&&!b.bell,T=bossT(b);
const turn=(x,z,k)=>{b.yaw+=angDiff(mkFace(b,x,z),b.yaw)*Math.min(1,dt*k)};
const toStop=d=>{b.st='stop';b.stT=0;b.dur=d};
const tired=d=>{b.st='tired';b.stT=0;b.dur=d;b.cmb=0};
const crouch=()=>{b.st='crouch';b.stT=0;let tx=T.x+(T.vx||0)*0.35,tz=T.z+(T.vz||0)*0.35;const o={x:tx,z:tz};collide(o,MK_R);b.tx=o.x;b.tz=o.z};
const ring=n=>{b.st='ring';b.stT=0;b.n=n;b.k=0};
const swing=()=>{b.st='swing';b.stT=0;b.k=0;b.sl2=1.35};
const contact=d=>{for(const p of allP())if(Math.hypot(p.x-b.x,p.z-b.z)<MK_R+0.7&&p.y<2.6&&lim('mkc'+p.slot,0.7))hurtT(p,d,b.x,b.z)};
if(b.st==='drop'){const u=(b.stT-1.0)/0.9;if(u<0)return;const k=Math.min(1,u);b.x=0;b.z=lerp(-42,-18,k);b.y=lerp(16,0,k)+Math.sin(k*PI)*8;b.yaw=0;
 if(u>=1){b.y=0;b.st='roar';b.stT=0;ev('mland',0,-18,0,1)}return}
if(b.st==='die'){b.y=Math.max(0,b.y-dt*14);monkDieFx(b);if(b.stT>BDIE_END){ev('mend',r1(b.x),r1(b.z));b.dead=true;G.endT=0;G.score+=5000;G.kills++}return}
if(b.st==='trans'){if(b.stT>=1.1&&b.phase<2){b.phase=2;if(b.tfB)monkDrop(b,1)}if(b.stT>MK_TF){b.st='idle';b.stT=0;b.cdT=0.3;b.atk=0}return}
if(b.st==='boff'){if(b.stT>1.3){b.st='idle';b.stT=0;b.cdT=0.2;b.atk=0}return}
const free=b.st!=='air'&&b.st!=='crouch';
if(free&&b.bell&&b.bhp<=0){if(b.phase<2)monkTrans(b,1);else{b.st='boff';b.stT=0;b.y=0;monkDrop(b,0)}return}
if(free&&b.phase<2&&b.hp<b.mhp*0.5){monkTrans(b,0);return}
if(b.st==='roar'){if(b.stT>1.5){b.st='idle';b.stT=0;b.cdT=0.4}return}
if(b.st==='idle'){turn(T.x,T.z,6);if(b.stT>b.cdT){b.ti=null;const pat=p2?MK_P2:MK_P1;let m=pat[b.atk++%pat.length];if(m==='ring'&&!b.bell)m=pat[b.atk++%pat.length];
  b.stT=0;b.chain=0;b.sw=0;
  if(m==='run'||m==='swing'){b.st='run';b.sw=m==='swing'?1:0;b.dur=(fast?rnd(0.9,1.2):p2?rnd(1.1,1.5):rnd(1.6,2.2))*(b.sw?1.8:1)}else if(m==='stomp')crouch();else if(m==='ring')ring(p2?4:1);else b.st='aim'}}
else if(b.st==='run'){turn(T.x,T.z,fast?6:p2?5:3);const sp=fast?12.5:p2?10.5:7.2,fx=Math.sin(b.yaw),fz=Math.cos(b.yaw);b.x+=fx*sp*dt;b.z+=fz*sp*dt;collide(b,MK_R);contact(14);
 const d=Math.hypot(T.x-b.x,T.z-b.z);
 if(b.sw&&(d<6||(b.stT>b.dur&&d<10))){swing();b.yaw=mkFace(b,T.x,T.z)}else if(!b.sw&&d<3.4)crouch();else if(b.stT>b.dur)toStop(fast?0.45:p2?0.55:1.0)}
else if(b.st==='crouch'){turn(b.tx,b.tz,8);if(b.stT>(fast?0.26:p2?0.32:1.55)){b.st='air';b.stT=0;b.ax=b.x;b.az=b.z}}
else if(b.st==='air'){const D=fast?0.52:p2?0.6:0.85,u=Math.min(1,b.stT/D);b.x=lerp(b.ax,b.tx,u);b.z=lerp(b.az,b.tz,u);b.y=Math.sin(u*PI)*(p2?6:7.5);
 if(u>=1){b.y=0;b.st='land';b.stT=0;ev('mland',r1(b.x),r1(b.z),p2?1:0,0);areaHurt(b.x,b.z,3.6,20)}}
else if(b.st==='land'){if(b.stT>(p2?0.18:0.3)){if(b.chain<(p2?2:1)){b.chain++;crouch()}
  else if(!p2&&b.bell&&Math.random()<0.5){b.cmb=1;ring(3)}else toStop(p2?0.5:0.9)}}
else if(b.st==='ring'){turn(T.x,T.z,2);const w0=mkW0(b);if(b.k<b.n&&b.stT>=w0+b.k*0.9){b.k++;ev('mring',r1(b.x),r1(b.z))}
 if(b.stT>w0+(b.n-1)*0.9+0.75){{if(b.n===1)toStop(1.2);else tired(p2?5.8:7)}}}
else if(b.st==='swing'){const sl=(i,t)=>{if(b.k===i&&b.stT>=t){b.k++;const s=i?b.sl2:-1.35,a=mkW(b,s,0,1.6),c=mkW(b,s,0,6.2),w=mkW(b,s,0,4.6),co=Math.cos(b.yaw),si=Math.sin(b.yaw);
   for(const p of allP()){const ex=c[0]-a[0],ez=c[2]-a[2],l2=ex*ex+ez*ez,q=clamp(((p.x-a[0])*ex+(p.z-a[2])*ez)/l2,0,1);if(Math.hypot(p.x-a[0]-ex*q,p.z-a[2]-ez*q)<1.5&&p.y<2.2){hurtT(p,22,w[0],w[2],MK_FRZ);
    if(!i)b.sl2=clamp(((p.x-b.x)*co-(p.z-b.z)*si)/b.sc,-2.4,2.4)}}
   ev('mslam',r1(w[0]),r1(w[2]))}};sl(0,0.6);sl(1,1.15);if(b.stT>1.75)toStop(0.5)}
else if(b.st==='aim'){turn(T.x,T.z,7);if(b.stT>0.5){b.st='charge';b.stT=0;b.dx=Math.sin(b.yaw);b.dz=Math.cos(b.yaw)}}
else if(b.st==='charge'){const ox=b.x,oz=b.z,sp=fast?23:21;b.x+=b.dx*sp*dt;b.z+=b.dz*sp*dt;collide(b,MK_R);contact(20);
 if(lim('mkdust',0.06))fxSmoke(b.x,0.3,b.z,1,1.2,C.snow,2);
 const moved=Math.hypot(b.x-ox,b.z-oz);const end=()=>{toStop(1.2);b.nx=1},c=b.bell2;
 if(moved<sp*dt*0.5&&b.stT>0.1){ev('smash',r1(b.x+b.dx*2),r1(b.z+b.dz*2));if(c&&Math.hypot(c.x-b.x,c.z-b.z)<MK_R+MK_BELL_R+0.8)tired(9);else end()}else if(b.stT>1.05)end()}
else if(b.st==='tired'){if(b.stT>b.dur){b.st='idle';b.stT=0;b.cdT=0.2}}
else if(b.st==='stop'){if(b.nx&&b.stT>b.dur-0.35)turn(T.x,T.z,8);if(b.stT>b.dur){if(b.nx){b.nx=0;swing()}else{b.st='idle';b.stT=0;b.cdT=fast?0.1:p2?0.15:0.35}}}}

// ---------------- shared animation / cosmetics (host and clients) ----------------
function monkAnim(b,dt){b.t+=dt;b.stT+=dt;b.flash-=dt;b.bflash-=dt;if(b.st!==b.lst){b.lst=b.st;b.cue=0}
const cue=(i,t)=>{if(b.stT>=t&&!(b.cue&(1<<i))){b.cue|=1<<i;return true}return false};
const big=b.st==='trans'?mkSS(sat((b.stT-1.5)/0.5)):b.phase>1?1:0;b.sc=MK_SC*(1+(MK_BIG-1)*big);
b.open=lerp(b.open,monkMouth(b),Math.min(1,dt*14));
const sp=b.y<0.2?Math.hypot(b.x-b.px,b.z-b.pz)/Math.max(dt,1e-3):0;b.px=b.x;b.pz=b.z;b.wa=lerp(b.wa,Math.min(1.2,sp/7),Math.min(1,dt*8));b.wp+=Math.min(sp,24)*dt*0.9;
if(b.wa>0.5&&Math.sin(b.wp)*Math.sin(b.wp-Math.min(sp,24)*dt*0.9)<0){fxSmoke(b.x,0.2,b.z,2,0.9,C.snow,1.5);if(b.st==='charge'||lim('mkstep',0.25))shake(0.05)}
for(let i=ices.length-1;i>=0;i--){ices[i].life-=dt/7;if(ices[i].life<=0)ices.splice(i,1)}
const c=b.bell2;if(c){c.t+=dt;const u=Math.min(1,c.t/0.6);c.x0+=(c.x-c.x0)*Math.min(1,dt*8);c.z0+=(c.z-c.z0)*Math.min(1,dt*8);c.y=Math.max(0,lerp(c.y0,0,u*u));c.tilt=lerp(0.15,-0.08,u);
 if(u>=1&&!c.landed){c.landed=true;c.x0=c.x;c.z0=c.z;fxSmoke(c.x,0.4,c.z,8,2.2,C.snow,4);fxRing(c.x,0.1,c.z,6,C.white,0.3);snd('gong');snd('boom',0.6);shake(0.5);sfxAt('ドゴォン！',c.x,3.4,c.z,{size:70,st:'boom',life:0.6})}}
const st=b.st;
if(st==='tired'){if(lim('mkbr'+b.id,0.32)){const m=mkW(b,0,4.75,0.75);fxSmoke(m[0],m[1],m[2],1,0.45,C.white,1.2)}
 if(b.stT>0.25&&lim('mkhaa'+b.id,0.9)){const h=mkW(b,0,5.6,0.6);sfxAt('ハァ…ハァ…',h[0],h[1]+0.8,h[2],{size:46,st:'ink',life:0.8})}}
else if(st==='trans')monkTfFx(b,cue);
else if(st==='roar'&&cue(0,0.15)){const h=mkW(b,0,5.4,0.5);sfxAt('グオオオ！！',h[0],h[1]+1,h[2],{size:80,st:'boom',life:1.0})}
else if(st==='swing'&&b.stT<1.15&&lim('mksw',0.1))lines(0.35,'#c20020');
if(st==='aim'&&lim('mkaim',0.1))lines(0.5,'#c20020')}
// mouth opening per state (0 closed .. 1 wide)
function monkMouth(b){const st=b.st,u=b.stT;
if(st==='trans')return u<0.4?0:u<1.1?0.18+0.08*Math.sin(b.t*40):u<1.5?0.4:u<2.4?1:0.3;
if(st==='tired')return 0.45+0.12*Math.sin(b.t*6);if(st==='roar')return u<1.3?1:0;if(st==='boff'||st==='die')return 0.7;
if(st==='charge'||st==='aim')return 0.55;if(st==='swing')return 0.35;if(st==='land')return 0.3;return 0}
// transformation cues (sound, drawn text, flash, roar); the camera is monkCam
function monkTfFx(b,cue){const u=b.stT;
if(cue(0,0)){shocks.length=0;snd('boom',0.3);musOn=0}
if(cue(1,0.4)){snd('heart');addText('ド…',W*0.66,H*0.3,{size:84,st:'ink',life:0.9,fixed:1})}
if(cue(2,0.6))addText('ク…',W*0.74,H*0.42,{size:84,st:'ink',life:0.75,fixed:1});
if(cue(3,0.8)){addText('ン…',W*0.82,H*0.54,{size:84,st:'ink',life:0.6,fixed:1})}
if(u>0.4&&u<1.1)lines(0.85,'#16121f');
if(cue(4,1.1)){flash(1);snd('boom',1);snd('clank');invA=1;addText('バキィッ！',W*0.25,H*0.24,{size:130,st:'boom',life:0.9,rot:-0.1,grow:0.12,fixed:1})}
if(cue(5,1.5)){snd('roar',1.5);snd('boom',1.2);musOn=2;flash(0.4);fxRing(b.x,0.1,b.z,18,C.white,0.5);fxRing(b.x,0.2,b.z,11,C.red,0.4);fxSmoke(b.x,0.3,b.z,6,2.2,C.snow,8);fxDebris(b.x,0.4,b.z,12,9,C.snow,0.5);
 decals.push({x:b.x,z:b.z,r:6.5,life:9});for(let i=0;i<6;i++){const a=i*TAU/6+rnd(-0.3,0.3);decals.push({x:b.x+Math.sin(a)*rnd(4,7),z:b.z+Math.cos(a)*rnd(4,7),r:rnd(1.4,2.4),life:9})}
 addText('グオオオオオ！！',W/2,H*0.24,{size:130,st:'boom',life:1.1,rot:-0.05,grow:0.12,fixed:1})}
if(u>1.5&&u<2.4)lines(0.6,'#16121f')}
function monkCos(b,dt){monkAnim(b,dt);G.mood=Math.min(1,G.mood+dt*0.5);if(b.st==='die')monkDieFx(b)}
const MK_DIE=[[0.3,-1.2,5.6,1.6],[0.7,1.3,3.8,1.5],[1.05,-0.8,6.4,1.8],[1.35,1.0,4.4,1.9]];
function monkDieFx(b){b.pops=b.pops||0;const fx=Math.sin(b.yaw),fz=Math.cos(b.yaw);for(let i=0;i<MK_DIE.length;i++){const q=MK_DIE[i];if(b.stT>=q[0]&&!(b.pops&(1<<i))){b.pops|=1<<i;
 const x=b.x+fz*q[1]+fx*1.2+rnd(-0.5,0.5),y=q[2]+rnd(-0.5,0.5),z=b.z-fx*q[1]+fz*1.2;explode(x,y,z,q[3],{ink:1,quiet:1});sfxAt(i%2?'ボンッ':'バンッ',x,y+2,z,{size:84,st:'boom',life:0.45});snd('boom',0.8);flash(0.3);shake(0.45);b.flash=0.08}}
 if(b.stT>1.4)b.flash=Math.sin(b.stT*48)>0?0.03:0;trauma=Math.max(trauma,b.stT>1.4?0.4:0.12)}

// ---------------- transformation camera (called after the player camera; blends back at the end) ----------------
// keys: [time, angle from his facing, distance, camera height, look-at height, fov]; distances/heights in model units
const MK_CAM=[[0,0.7,11.5,2.6,3.2,60],[0.4,0.7,11.5,2.6,3.2,60],[1.1,0.28,3.5,4.95,4.85,48],[1.5,0.28,3.5,4.95,4.85,48],[1.95,-0.4,8.6,2.6,4.5,66],[3.0,-0.4,9.2,2.7,4.5,66]];
function monkCam(){if(!monkCine())return;const b=boss,t=b.stT;let i=0;while(i<MK_CAM.length-2&&t>MK_CAM[i+1][0])i++;
const A=MK_CAM[i],B=MK_CAM[i+1],u=mkSS(sat((t-A[0])/(B[0]-A[0]))),q=j=>lerp(A[j],B[j],u),s=b.sc,a=b.yaw+q(1),d=q(2)*s,
 sh=t>1.5&&t<2.4?Math.pow(1-(t-1.5)/0.9,2):0,w=t<2.4?1:1-mkSS(sat((t-2.4)/0.6)),r=()=>rnd(-1,1)*sh;
const tx=b.x,ty=b.y+q(4)*s,tz=b.z,cx=tx+Math.sin(a)*d+r()*0.45,cy=b.y+q(3)*s+r()*0.45,cz=tz+Math.cos(a)*d+r()*0.45,dx=tx-cx,dy=ty-cy,dz=tz-cz;
cam.x=lerp(cam.x,cx,w);cam.y=lerp(cam.y,cy,w);cam.z=lerp(cam.z,cz,w);cam.yaw+=angDiff(Math.atan2(-dx,-dz)+r()*0.05,cam.yaw)*w;
cam.pitch=lerp(cam.pitch,Math.atan2(dy,Math.hypot(dx,dz))+r()*0.05,w);cam.roll=lerp(cam.roll,r()*0.07,w);cam.fov=lerp(cam.fov,q(5)*PI/180,w)}
// black bars height (0..58) during the cutscene
function monkBars(){if(!monkCine())return 0;const t=boss.stT;return 58*(t<2.4?easeOut(sat(t/0.15)):1-sat((t-2.4)/0.45))}

// ---------------- FX events (host runs + broadcasts, clients replay) ----------------
Object.assign(FXE,{
mland(x,z,p2,intro){explode(x,0.6,z,intro?2.6:1.8,{ink:1,text:intro?'ズドォォン！！':'ドスン！'});fxRing(x,0.1,z,intro?16:11,C.white,0.4);fxSmoke(x,0.3,z,10,2.5,C.snow,6);fxDebris(x,0.4,z,8,8,C.snow,0.5);
 decals.push({x,z,r:intro?5:4,life:6});shake(intro?1:0.6);snd('boom',intro?1:0.7);
 if(!intro){ices.push({x,z,r:p2?3.4:4.2,life:1})}},
mring(x,z){snd('gong');fxRing(x,4,z,10,C.yellow,0.5);fxRing(x,0.2,z,14,C.gold,0.6);shake(0.5);sfxAt('ゴォォォン！',x,8,z,{size:96,st:'boom',life:0.8,grow:0.14});
 shocks.push({x,z,r:1.4,v:15,max:24,d:14,hit:false,mk:1},{x,z,r:-3.6,v:15,max:24,d:14,hit:false,mk:1})},
mslam(x,z){explode(x,0.5,z,1.3,{ink:1,quiet:1});fxRing(x,0.1,z,6,C.white,0.3);fxDebris(x,0.4,z,6,7,C.snow,0.4);decals.push({x,z,r:2.6,life:5});shake(0.45);snd('boom',0.6);
 sfxAt('ドガァン！',x,2.5,z,{size:66,st:'boom',life:0.45});shocks.push({x,z,r:0.6,v:11,max:8,d:10,hit:false,mk:1})},
mbreak(x,z,quiet){snd('gong');snd('boom',1);shake(1);const b=boss;if(!quiet){flash(0.7);stopT(0.18);invA=1;addText('バキィッ！',W/2,H*0.3,{size:150,st:'boom',life:1.1,rot:-0.08,grow:0.12})}
 if(b){const w=mkW(b,0,4.3,-1.8);fxDebris(w[0],w[1],w[2],18,9,C.gold,0.55);fxStar(w[0],w[1],w[2],5,C.white,0.12);explode(w[0],w[1],w[2],1.6,{quiet:1})}},
mend(x,z){for(let i=0;i<4;i++)explode(x+rnd(-2,2),rnd(1.5,7),z+rnd(-2,2),rnd(1.6,2.4),{quiet:1,ink:1});explode(x,4,z,4.5,{text:'ドォォォォン！'});invA=1;flash(1);stopT(0.25);for(let i=0;i<18;i++)fxOrb(x+rnd(-2,2),rnd(2,7),z+rnd(-2,2))}});

// ---------------- drawing ----------------
const _mkT=m4();function mMul(m){m4mul(_mkT,M,m);M.set(_mkT)}
const MK_POSE={};
function mkNode(n,b,l2){const nm=n.name;
if(l2?nm==='Monk_Head':(nm==='Monk_Head2'||nm==='Striker_L'))return;if(nm==='Bell'&&!b.bell)return;
const jaw=nm==='Monk_Jaw'||nm==='Monk_Jaw2';if(jaw&&b.open<0.04)return;
mPush();mMul(n.m);const p=MK_POSE[nm];if(p){if(p[1])mRY(p[1]);if(p[0])mRX(p[0]);if(p[2])mRZ(p[2])}if(jaw)mS(1,b.open,1);
if(n.items.length){const g0=gTint;if(nm==='Bell')gTint=b.bflash>0?0.6:b.st==='tired'?0.3+0.2*Math.sin(b.t*12):g0;gId=nid();
 for(const it of n.items)emit(it.pi,l2&&it.nm==='boss4_skin'?MONK.navy:l2&&it.nm==='boss4_eye'?MK_RED:it.c,it.mat,it.gloss,it.fl,it.rim);gId=0;gTint=g0}
for(const c of n.ch)mkNode(c,b,l2);mPop()}
// pose: [rx, ry, rz] per part (rotation about the part's pivot). Model faces +Z; arm rx < 0 swings forward/up.
function monkPose(b){const P=MK_POSE,t=b.t,u=b.stT,p2=b.phase>1,s=Math.sin(b.wp)*Math.min(1,b.wa);
let lL=s*0.55,lR=-s*0.55,aL=[-s*0.45,0,0.06],aR=[s*0.45,0,-0.06],bd=[0,0,0],hd=[0,0,0],bob=Math.abs(Math.sin(b.wp))*0.12*b.wa,lean=0.14*Math.min(1,b.wa),sy=1;
if(p2){aL=[-0.45-s*0.3,0,0.3];aR=[-0.45+s*0.3,0,-0.3]}
const st=b.st;
if(st==='crouch'){const k=sat(u/0.22),sh=u>0.3?Math.sin(t*38)*0.03:0;sy=1-0.2*k;bob=-0.5*k;lean=0.3*k;aL=[0.8*k,0,0.3*k];aR=[0.8*k,0,-0.3*k];hd=[0.1*k,0,sh];bd=[0,0,sh]}
else if(st==='air'||st==='drop'){sy=1.05;lL=-0.7;lR=0.3;aL=[-2.6,0,0.25];aR=[-2.6,0,-0.25];lean=-0.05;bob=0}
else if(st==='land'){const k=1-sat(u/0.3);sy=1-0.18*k;bob=-0.35*k;aL=[-0.6,0,0.9*k+0.2];aR=[-0.6,0,-0.9*k-0.2]}
else if(st==='stop'){bob=Math.sin(t*9)*0.06-0.05;lean=0.22;hd=[0.2,0,0];aL=[0.1,0,0.14];aR=[0.1,0,-0.14];if(p2){aL=[-0.2,0,0.3];aR=[-0.2,0,-0.3]}}
else if(st==='ring'){const w=mkW0(b)-0.12,k=easeOut(sat(u/w)),l=Math.max(0,u-w)%0.9,h=u<w?0:l<0.12?l/0.12:1-sat((l-0.12)/0.5);aR=[lerp(-0.2,-2.9,k)-h*1.1,0,-0.2];lean=-0.12*h;hd=[-0.25*h,0,0]}
else if(st==='tired'){const br=Math.sin(t*6);hd=[0.5+br*0.06,0,0];lean=0.34+br*0.03;bob=-0.18+br*0.05;sy=0.97;aL=[0.2,0,0.1];aR=[0.2,0,-0.1]}
else if(st==='swing'){const sw=(t0)=>{const k=u-t0;return k<0?lerp(-0.45,-2.8,sat((u-(t0-0.55))/0.4)):k<0.1?lerp(-2.8,-0.75,k/0.1):lerp(-0.75,-0.45,sat((k-0.25)/0.4))};
 aR=[sw(0.6),0,-0.25];aL=[sw(1.15),0,0.25];lean=0.12;bd=[0,u<0.85?-0.18:0.18*(b.sl2||1.35)/1.35,0]}
else if(st==='boff'){const sh=Math.sin(t*34)*0.08;hd=[-0.45,0,sh];aL=[-0.3,0,1.0+sh];aR=[-0.3,0,-1.0-sh];lean=-0.1}
else if(st==='trans'){if(u<1.1){const sh=u>0.4?Math.sin(t*44)*0.03:0;hd=[0.1,0,sh];aL=[0.1,0,0.25];aR=[0.1,0,-0.25];bd=[0,0,sh]}
 else if(u<1.5){const sh=Math.sin(t*50)*0.05;hd=[0.02,0,sh];aL=[0.15,0,0.3];aR=[0.15,0,-0.3];bd=[0,0,sh*0.5]}
 else if(u<2.4){const sh=Math.sin(t*55)*0.04;hd=[-0.22,0,sh];bd=[0,0,sh];aL=[-0.5,0,1.25];aR=[-0.5,0,-1.25];lean=-0.1;sy=1.03}
 else{aL=[-0.45,0,0.3];aR=[-0.45,0,-0.3]}}
else if(st==='roar'){hd=[-0.35,0,0];aL=[-0.2,0,0.8];aR=[-0.2,0,-0.8];bd=[0,0,Math.sin(t*30)*0.02]}
else if(st==='aim'){const k=sat(u/0.3);lean=0.4*k;sy=1-0.08*k;aL=[0.9*k,0,0.35];aR=[0.9*k,0,-0.35];bob=-0.2*k}
else if(st==='charge'){lean=0.45;const w=Math.sin(t*26);aL=[-1.3+w*0.6,0,0.35];aR=[-1.3-w*0.6,0,-0.35]}
else if(st==='die'){const sh=Math.sin(t*40)*0.05;hd=[-0.4,0,sh];bd=[0,0,sh];aL=[-0.4,0,0.7];aR=[-0.4,0,-0.7]}
P.Monk_Leg_L=[lL,0,0];P.Monk_Leg_R=[lR,0,0];P.Monk_Arm_L=aL;P.Monk_Arm_R=aR;P.Monk_Body=bd;P.Monk_Head=P.Monk_Head2=hd;b.lean=lean;b.bob=bob;b.sy=sy}
function drawMonk(b){if(b.st==='drop'&&b.stT<1.0){drawIces();return}monkPose(b);const l2=mkLook2(b),S=b.sc;
const tf=b.st==='trans'&&b.stT>=1.1&&b.stT<1.4?0.95*(1-(b.stT-1.1)/0.3):0;
mPush();mT(b.x,b.y+b.bob*S,b.z);mRY(b.yaw);mRX(b.lean);mS(S*(2-b.sy),S*b.sy,S*(2-b.sy));gTint=tf||(b.flash>0?0.45:0);
if(MONK.ready)mkNode(MONK.root,b,l2);else{cyl(0,2,0,1.6,2,1.6,C.white);cyl(0,3.7,0,1.1,1.4,1.1,C.white);sph(0,5.15,0,1.1,1.2,1.1,l2?C.inkD:C.paper);if(b.bell)sph(0,3.9,-1.8,1.8,2.4,1.8,C.gold)}
gTint=0;mPop();
const NF=F_UNLIT|F_NOCAST;
if(b.st==='crouch'||b.st==='air'||(b.st==='drop'&&b.stT<1.9)){const s=7.4+Math.sin(b.t*20)*0.5,tx=b.st==='drop'?0:b.tx,tz=b.st==='drop'?-18:b.tz;put(RING,tx,0.13,tz,0,0,0,s,1,s,C.red,0,0,NF);put(RING,tx,0.13,tz,0,0,0,s*0.5,1,s*0.5,C.red,0,0,NF)}
if(b.st==='ring'&&b.stT<mkW0(b)&&Math.sin(b.t*(b.stT>mkW0(b)-0.4?40:14))>-0.3){put(RING,b.x,0.13,b.z,0,0,0,10,1,10,C.red,0,0,NF);put(RING,b.x,0.13,b.z,0,0,0,5.5,1,5.5,C.red,0,0,NF)}
if(b.st==='aim'){const fx=Math.sin(b.yaw),fz=Math.cos(b.yaw),a=sat(b.stT/0.25);for(let i=1;i<8;i++){const d=MK_R+i*2.2;put(PYR,b.x+fx*d,0.14,b.z+fz*d,PI/2,b.yaw,0,1.6*a,0.8,1.0,C.red,0,0,NF)}}
// striker slam bands: right (hits at 0.6 s), then left (1.15 s); they blink faster just before the hit
if(b.st==='swing')for(let i=0;i<2;i++){const th=i?1.15:0.6,k=th-b.stT;if(k<0||k>0.75||(k<0.3&&Math.sin(b.t*40)<0))continue;const c=mkW(b,i?(b.sl2||1.35):-1.35,0,3.9);
 put(BOX,c[0],0.14,c[2],0,b.yaw,0,2.6,0.02,4.6*S,C.red,0,0,NF)}
if(b.bell2)drawFallenBell(b.bell2);drawIces()}
function drawFallenBell(c){mPush();mT(c.x0,c.y,c.z0);mRY(c.yaw);mRX(c.tilt);mS(MK_SC,MK_SC,MK_SC);gId=nid();
if(MONK.ready)for(const it of MONK.Bell.items)emit(it.pi,it.c,it.mat,it.gloss,it.fl,it.rim);else sph(0,1.3,0,1.8,2.6,1.8,C.gold);gId=0;
// cracks
for(const[a,y,r,l]of[[0.3,1.5,0.4,1.0],[0.5,1.1,-0.6,0.8],[2.4,1.7,0.3,0.9],[3.6,1.0,-0.5,1.1],[4.9,1.4,0.6,0.7]])put(BOX,Math.sin(a)*0.97,y,Math.cos(a)*0.97,0,a,r,0.06,l,0.05,C.inkD,0,0,F_NOCAST);mPop()}
function drawIces(){for(const i of ices){const r=i.r*Math.min(1,i.life*3);put(CYL,i.x,0.03,i.z,0,0,0,r*2,0.03,r*2,C.ice,0,.9,F_NOCAST,0.4);put(CYL,i.x,0.045,i.z,0,0,0,r*1.2,0.02,r*1.2,C.iceP,0,.9,F_NOCAST)}}
