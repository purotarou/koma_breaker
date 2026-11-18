'use strict';
// ================= 5面の中ボス (第三話・第四話) =================
// 第三話 双子剣鬼 アカツキ (炎, v=0) と ヨイヤミ (闇, v=1): a little taller than the hero. They never bunch up: each keeps to the opposite side of
//   the target from its twin (挟み撃ち) and circles while it attacks. Four attacks each, the same moves in their own element:
//   飛燕斬 (one flying slash) / 三日月 (a fan of three) / 踏み込み斬り (a dash through you: 炎 leaves fire, 闇 bursts into darkness at the end) /
//   双刃・十字 (both twins at once from both sides: the two big slashes cross on you). When one falls the other is enraged (faster).
// 第四話 墨焔鬼ゴウエン (闇と炎, v=0): one size bigger than the hero, lots of HP. Five attacks:
//   焔墨大斬 (a huge slash; three in the second half) / 波動 (jumps and slams: a fire ring then a dark ring, jump them) /
//   闇の帳 (a burst of darkness around him: step out of the ring) / 業火柱 (fire pillars under you, one after another) /
//   突進斬り (charges along a marked line with his blade, fire on the trail, darkness where he stops).
// 闇 hits blind you (盲目, pl.blind): the screen goes dark except a small hole in the middle.
// Enemies of the FOE table (foes.js): types 'twin' (net letter t) and 'dmon' (d). Slashes are enemy shots k 8-12 (host checks the hits, they can't be shot down).
// Wave entries: g:[{twin:1}] / g:[{dmon:1}] (spawnGroup -> MBS).
// ---- tuning (目安) ----
const MBT={
 twin:{hp:3000,spd:6.4,keep:10,apart:9,range:30,cd:[0.75,1.3],w1:0.5,w2:0.6,w3:0.5,w4:0.8,rec:0.42,recR:0.25,sv:21,dmg:13,big:18,dash:17,dashT:0.5,dashDmg:16,blind:4.4,rage:1.45},
 dmon:{hp:6500,spd:4.0,keep:[6,12],range:32,cd:[0.75,1.25],w1:0.65,w2:0.8,w3:0.85,w4:0.45,w5:0.65,rec:0.55,rec2:0.35,pilT:0.34,sv:19,dmg:22,ring:16,burstR:8,burstDmg:14,blind:5.2,pilN:5,
  charge:21,chargeT:0.9,chargeDmg:22,score:3000}};
const MB_NAME=['アカツキ','ヨイヤミ'],MB_SHOT={8:1,9:1,10:1.6,11:1.6,12:2.4,13:2.6,14:1.4};// slash shots: k -> size (8 fire / 9 dark / 10,11 big / 12 huge 焔墨 / 13 シロヌキ第3形態の白い斬撃: wide and low, jump over it)
Object.assign(C,{fireD:hex(0xb3262a),darkP:hex(0x5a2a8a)});
// ---- blindness (local, every peer for its own player) ----
function plBlind(t){if(pl.dead)return;t*=SK.steady?0.5:1;if(!(pl.blind>0))addText('目ガ…！',W/2,H*0.6,{size:70,st:'ink',life:0.7});pl.blind=Math.max(pl.blind||0,t);pl.blindM=Math.max(pl.blind,pl.blindM||0)}
function mbTick(dt,live){if(pl.blind>0){pl.blind-=dt;if(pl.blind<=0||pl.dead)pl.blind=pl.blindM=0}}
function mbBlindUI(){if(!(pl.blind>0))return;const k=Math.min(1,pl.blind/0.6,(pl.blindM-pl.blind)/0.2+0.3),cx=W/2,cy=H/2,r0=H*(0.13+0.03*Math.sin(now*3)),g=ctx.createRadialGradient(cx,cy,r0,cx,cy,H*0.62);
g.addColorStop(0,'rgba(21,17,42,0)');g.addColorStop(0.25,'rgba(21,17,42,'+(0.85*k)+')');g.addColorStop(1,'rgba(10,6,20,'+(0.98*k)+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
ctx.save();ctx.globalAlpha=0.8*k;ctx.fillStyle='#15112a';const R=mulberry(7);for(let i=0;i<9;i++){const a=R()*TAU,d=H*(0.3+R()*0.25),s=40+R()*60;ctx.beginPath();ctx.arc(cx+Math.cos(a)*d*1.5,cy+Math.sin(a)*d,s*(0.9+0.1*Math.sin(now*2+i)),0,TAU);ctx.fill()}ctx.restore()}
// ---- helpers ----
const mbAlive=t=>enemies.filter(e=>!e.dead&&e.type===t);
function mbSib(e){for(const o of enemies)if(o!==e&&!o.dead&&o.type==='twin')return o;return null}
function mbSlash(e,a,k,dmg,bl,y,sp){const fx=Math.sin(a),fz=Math.cos(a);shots.push({id:++eidN,k,x:e.x+fx*1.2,y:y||1.15,z:e.z+fz*1.2,vx:fx*sp,vy:0,vz:fz*sp,r:0.6,dmg,g:0,life:2.6,bl:bl||0})}
const mbFace=(e,wy,dt,lock)=>{if(!lock)e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*10)};
// host: hits of the slash shots (from shotUpd2). true = handled
function mbShot(s){if(s.life<=0||Math.abs(s.x)>BX+2||s.z>BZ1+2||s.z<BZ0-2){popShot(s);return true}if(wpBarShot(s))return true;
const w=MB_SHOT[s.k]||1,l=Math.hypot(s.vx,s.vz)||1,ux=s.vx/l,uz=s.vz/l;
for(const p of allP()){if(p.dead)continue;const dx=p.x-s.x,dz=p.z-s.z,al=dx*ux+dz*uz,pp=dx*uz-dz*ux;if(Math.abs(al)<0.9&&Math.abs(pp)<1.3*w&&(s.k===13?(p.y||0)<0.9:s.k===14?(p.y||0)>0.5&&Math.abs((p.y||0)+1.0-s.y)<1.6:Math.abs((p.y||0)+1.0-s.y)<0.8*w+0.5)){
 if(!wpGuardShot(p,s)){hurtT(p,s.dmg,s.x,s.z,0,s.bl);if(s.k===8||s.k===10)ev('mbFire',r1(p.x),r1(p.z));popShot(s)}return true}}
return true}
function mbPop(s){const c=s.k===9||s.k===11?C.darkP:s.k===12?C.red:s.k>=13?C.white:C.orange;fxStar(s.x,s.y,s.z,1.6*(MB_SHOT[s.k]||1),C.white,0.08);fxSparks(s.x,s.y,s.z,6,6,c);fxBlobs(s.x,s.y,s.z,3,5,s.k===9||s.k===11?C.inkD:C.orange,0.14)}
// a crescent standing across the flight direction
function mbDrawShot(s){const NF=F_UNLIT|F_NOCAST,w=MB_SHOT[s.k]||1,dark=s.k===9||s.k===11,dual=s.k===12,l=Math.hypot(s.vx,s.vz)||1;if(s.k===13||s.k===14)return snDrawShot(s,w,l);
mPush();mT(s.x,s.y,s.z);mRY(Math.atan2(s.vx,s.vz));mRZ(dark?-0.45:0.45);mS(w,w,w);
for(let i=-6;i<=6;i++){const a=i*0.19,x=Math.sin(a)*1.35,z=Math.cos(a)*0.55-0.55,th=1-Math.abs(i)/7,c=dual?(i<0?C.inkD:C.red):dark?C.inkD:C.red,c2=dual?(i<0?C.darkP:C.yellow):dark?C.darkP:C.yellow;
 put(BOX,x,0,z,0,a,0,0.27,0.1+0.6*th,0.12,c,0,0,dark||dual&&i<0?0:NF);put(BOX,x,0,z+0.08,0,a,0,0.24,0.05+0.32*th,0.06,c2,0,0,NF|F_NOEDGE);put(BOX,x,0,z+0.12,0,a,0,0.22,0.02+0.1*th,0.04,C.white,0,0,NF|F_NOEDGE)}
mPop();if(lim('mbsh'+s.id,0.05))fxBlobs(s.x-s.vx/l*0.8,s.y,s.z-s.vz/l*0.8,1,2,dark?C.inkD:C.orange,0.12*w)}
// ---- spawning (wave entries) ----
const MBS={
twin(){const a=mkEnemy('twin',-9,-7,0),b=mkEnemy('twin',9,-7,1);a.oa=-PI/2;b.oa=PI/2;ev('mbIn',-9,-7,0);ev('mbIn',9,-7,1);ev('say','我ラ','双ツデ一ツ!!',1)},
dmon(){mkEnemy('dmon',0,-10,0);ev('mbIn',0,-10,2);ev('say','焔ト墨ニ','焼カレロ!!',1)}};
// ---- the twins ----
FOE.twin={sc:1500,g:30,
 init(e){e.hp=MBT.twin.hp;e.r=0.75;e.cd=rnd(1.0,1.8);e.ai=e.v;e.dir=e.v?1:-1;e.oa=e.v?PI/2:-PI/2;e.tx=e.x;e.tz=e.z},
 upd(e,dt,T,dx,dz,d,wy){const K=MBT.twin,sib=mbSib(e),rage=!sib&&e.rg,st=e.st,u=e.stT,sp=rage?K.rage:1,dk=e.v===1;
  if(!sib&&!e.rg){e.rg=1;ev('mbRage',r1(e.x),r1(e.z),e.v)}
  if(st==='chase'){const base=sib?Math.atan2(sib.x-T.x,sib.z-T.z)+PI:e.oa;e.oa+=angDiff(base,e.oa)*Math.min(1,dt*0.9)+dt*e.dir*0.32;if(Math.random()<dt*0.15)e.dir=-e.dir;
   let mx=T.x+Math.sin(e.oa)*K.keep-e.x,mz=T.z+Math.cos(e.oa)*K.keep-e.z;if(sib){const sx=e.x-sib.x,sz=e.z-sib.z,sd=Math.hypot(sx,sz)||1;if(sd<K.apart){mx+=sx/sd*(K.apart-sd)*2;mz+=sz/sd*(K.apart-sd)*2}}
   const ml=Math.hypot(mx,mz);if(ml>0.3){const v=Math.min(K.spd*sp,ml*2);e.x+=mx/ml*v*dt;e.z+=mz/ml*v*dt}mbFace(e,wy,dt);
   e.cd-=dt*sp;if(e.cd<=0&&d<K.range){const m=['w1','w2','w3','w4'][e.ai++%4];
    if(m==='w4'){if(sib&&sib.st==='chase'){e.st=sib.st='w4';e.stT=sib.stT=0;sib.ai=(sib.ai|0)+1;ev('mbCross')}else if(!sib){e.st='w4';e.stT=0}else{e.st='w1';e.stT=0}}else{e.st=m;e.stT=0}}}
  else if(st==='w1'){mbFace(e,wy,dt,u>K.w1-0.2);if(u>K.w1){mbSlash(e,e.yaw,8+e.v,K.dmg,dk?K.blind:0,1.15,K.sv*sp);ev('txt',dk?'ザンッ':'ズバッ',r1(e.x),2.8,r1(e.z),48,dk?'ink':'boom');e.st='rec';e.stT=0}}
  else if(st==='w2'){mbFace(e,wy,dt,u>K.w2-0.2);if(u>K.w2){for(const o of[-0.32,0,0.32])mbSlash(e,e.yaw+o,8+e.v,K.dmg,dk?K.blind:0,1.15,K.sv*sp);ev('txt','三日月！',r1(e.x),2.9,r1(e.z),52,dk?'ink':'boom');e.st='rec';e.stT=0}}
  else if(st==='w3'){mbFace(e,wy,dt,u>K.w3-0.25);if(u>K.w3){e.st='a3';e.stT=0;e.hd=false;e.lx=Math.sin(e.yaw);e.lz=Math.cos(e.yaw);ev('txt','踏ミ込ミ！',r1(e.x),2.9,r1(e.z),50,dk?'ink':'boom')}}
  else if(st==='a3'){const px=e.x,pz=e.z;e.x+=e.lx*K.dash*sp*dt;e.z+=e.lz*K.dash*sp*dt;collide(e,e.r);if(!dk&&lim('tw'+e.id,0.11))ev('mbFire',r1(e.x),r1(e.z));
   for(const p of allP())if(!p.dead&&!e.hd&&Math.hypot(p.x-e.x,p.z-e.z)<1.5&&(p.y||0)<1.3){e.hd=true;hurtT(p,K.dashDmg,e.x,e.z,0,dk?K.blind:0)}
   if(u>K.dashT||Math.hypot(e.x-px,e.z-pz)<K.dash*0.3*dt){if(dk)ev('mbBurst',r1(e.x),r1(e.z),3.2,10,K.blind);e.st='rec';e.stT=0}}
  else if(st==='w4'){mbFace(e,wy,dt,u>K.w4-0.2);e.y=Math.sin(sat(u/K.w4)*PI)*1.6;if(u>K.w4){e.y=0;mbSlash(e,e.yaw,10+e.v,K.big,dk?K.blind:0,1.25,K.sv*0.85*sp);e.st='rec';e.stT=0}}
  else if(st==='rec'){e.y=0;if(u>(rage?K.recR:K.rec)){e.st='chase';e.cd=rnd(K.cd[0],K.cd[1])}}},
 sph(e){const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw),y=e.y||0;return[[e.x,y+1.2,e.z,0.75,1],[e.x,y+1.95,e.z,0.72,1],[e.x+fx*0.1,y+2.68,e.z+fz*0.1,0.42,2]]},
 ctr(e){return[e.x,(e.y||0)+1.7,e.z,1.6]},
 die(e){foeDie(e,e.v?C.darkP:C.red,e.v?'グアァ…':'ガハッ…',16);explode(e.x,1.4,e.z,1.6,{quiet:1,ink:e.v===1});addText(MB_NAME[e.v]+' 撃破！',W/2,H*0.32,{size:80,st:e.v?'ink':'boom',life:1})},
 draw(e){drawTwin(e)}};
// ---- 墨焔鬼ゴウエン ----
FOE.dmon={sc:MBT.dmon.score,g:50,
 init(e){e.hp=MBT.dmon.hp;e.r=1.15;e.cd=1.5;e.ai=0;e.tx=e.x;e.tz=e.z},
 upd(e,dt,T,dx,dz,d,wy){const K=MBT.dmon,st=e.st,u=e.stT,p2=e.mhp0&&e.hp<e.mhp0*0.5;if(!e.mhp0)e.mhp0=e.hp;
  if(p2&&!e.p2){e.p2=1;ev('mbRage',r1(e.x),r1(e.z),2)}const sp=p2?1.25:1;
  if(st==='chase'){const want=d>K.keep[1]?1:d<K.keep[0]?-0.6:0,side=Math.sin(e.t*0.5+e.seed)*0.5;e.x+=(dx/d*want-dz/d*side)*K.spd*dt;e.z+=(dz/d*want+dx/d*side)*K.spd*dt;mbFace(e,wy,dt);
   e.cd-=dt*sp;if(e.cd<=0&&d<K.range){e.st=['w1','w2','w5','w3','w1','w4','w2','w5','w3','w4'][e.ai++%10];e.stT=0;e.vn=0;if(e.st==='w5'){e.tx=T.x;e.tz=T.z}}}
  else if(st==='w1'){mbFace(e,wy,dt,u>K.w1-0.25);if(u>K.w1){mbSlash(e,e.yaw,12,K.dmg,K.blind*0.7,1.3,K.sv*sp);if(p2){mbSlash(e,e.yaw-0.4,10,K.dmg*0.7,0,1.2,K.sv*sp);mbSlash(e,e.yaw+0.4,11,K.dmg*0.7,K.blind*0.6,1.2,K.sv*sp)}
   ev('txt','焔墨大斬！',r1(e.x),4.2,r1(e.z),66,'boom');e.st='rec';e.stT=0}}
  else if(st==='w2'){e.y=u<K.w2-0.25?Math.sin(sat(u/(K.w2-0.25))*PI*0.5)*3:3*(1-sat((u-K.w2+0.25)/0.25));if(u>K.w2){e.y=0;ev('mbWave',r1(e.x),r1(e.z),p2?1:0);e.st='rec';e.stT=0}}
  else if(st==='w3'){if(u>K.w3){ev('mbBurst',r1(e.x),r1(e.z),K.burstR,K.burstDmg,K.blind);e.st='rec';e.stT=0}}
  else if(st==='w4'){mbFace(e,wy,dt);if(u>K.w4){e.st='a4';e.stT=0;e.vn=0}}
  else if(st==='a4'){const n=K.pilN+(p2?2:0),want=Math.floor(u/K.pilT);while(e.vn<=want&&e.vn<n){e.vn++;for(const P of allP())if(!P.dead)ev('e1',r1(P.x+(P.vx||0)*0.3),r1(P.z+(P.vz||0)*0.3),1,0.75)}if(u>n*K.pilT+0.5){e.st='rec';e.stT=0}}
  else if(st==='w5'){mbFace(e,Math.atan2(e.tx-e.x,e.tz-e.z),dt,u>K.w5-0.3);if(u<K.w5-0.3){e.tx=T.x;e.tz=T.z}if(u>K.w5){e.st='a5';e.stT=0;e.hd=false;e.lx=Math.sin(e.yaw);e.lz=Math.cos(e.yaw);ev('txt','突進斬リ！',r1(e.x),4,r1(e.z),60,'boom')}}
  else if(st==='a5'){const px=e.x,pz=e.z;e.x+=e.lx*K.charge*dt;e.z+=e.lz*K.charge*dt;collide(e,e.r);if(lim('dm'+e.id,0.1))ev('mbFire',r1(e.x),r1(e.z));
   for(const p of allP())if(!p.dead&&!e.hd&&Math.hypot(p.x-e.x,p.z-e.z)<2.3&&(p.y||0)<1.6){e.hd=true;hurtT(p,K.chargeDmg,e.x,e.z)}
   if(u>K.chargeT||Math.hypot(e.x-px,e.z-pz)<K.charge*0.3*dt&&u>0.1){ev('mbBurst',r1(e.x),r1(e.z),4.5,12,K.blind*0.7);e.st='rec';e.stT=0}}
  else if(st==='rec'){e.y=0;if(u>(p2?K.rec2:K.rec)){e.st='chase';e.cd=rnd(K.cd[0],K.cd[1])}}},
 sph(e){const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw),y=e.y||0;return[[e.x,y+1.0,e.z,0.95,1],[e.x,y+2.15,e.z,1.25,1],[e.x,y+3.0,e.z,1.2,1],[e.x+fx*0.3,y+4.2,e.z+fz*0.3,0.6,2]]},
 ctr(e){return[e.x,(e.y||0)+2.6,e.z,2.3]},
 die(e){foeDie(e,C.red,'グォォ…',24);for(let i=0;i<3;i++)explode(e.x+rnd(-1,1),rnd(1,3),e.z+rnd(-1,1),2,{quiet:1,ink:i===1});addText('墨焔鬼 撃破！！',W/2,H*0.32,{size:96,st:'boom',life:1.2});stopT(0.12);shake(0.8)},
 draw(e){drawDmon(e)}};
// ---- FX events (host runs + broadcasts) ----
Object.assign(FXE,{
mbIn(x,z,k){explode(x,1,z,1.6,{quiet:1,ink:k!==0});fxRing(x,0.1,z,8,k===1?C.darkP:C.orange,0.4);shake(0.5);snd('boom',0.8);sfxAt(k===2?'ズシャァァッ！':'シュタッ！',x,4,z,{size:k===2?90:70,st:k===1?'ink':'boom',life:0.8});if(k<2)sfxAt(MB_NAME[k],x,3,z,{size:54,st:k?'ink':'fire',life:1.2})},
mbCross(){snd('charge');lines(0.8,'#c20020');addText('双刃・十字！',W/2,H*0.28,{size:100,st:'boom',life:1});addText('挟まれるな！',W/2,H*0.72,{size:48,st:'cyan',life:1})},
mbRage(x,z,k){snd('roar');shake(0.6);fxRing(x,0.2,z,10,C.red,0.5);if(k<2){addText('片割レヲ…ヨクモ!!',W/2,H*0.3,{size:80,st:'hurt',life:1.2})}else addText('グオオオ！ 焔ガ増シタ！',W/2,H*0.3,{size:76,st:'hurt',life:1.1})},
mbFire(x,z){addFire(x,z,1.5,3,0.15)},
mbWave(x,z,p2){const K=MBT.dmon;fxRing(x,0.1,z,12,C.white,0.4);explode(x,0.6,z,2.2,{ink:1,text:'ドゴォォン！'});decals.push({x,z,r:5,life:6});shake(0.7);
 shocks.push({x,z,r:1.5,v:13,max:30,d:K.ring,hit:false});shocks.push({x,z,r:-6,v:13,max:30,d:K.ring*0.8,hit:false,bl:K.blind});if(p2)shocks.push({x,z,r:-13,v:15,max:30,d:K.ring*0.8,hit:false})},
mbBurst(x,z,R,dmg,bl){fxRing(x,0.2,z,R*2,C.darkP,0.4);fxBall(x,1.2,z,R*0.9,C.inkD,0.4,0);fxBlobs(x,1,z,16,R*1.5,C.inkD,0.3);fxSmoke(x,1,z,6,R*0.4,C.smokeD,3);snd('boom',0.7);sfxAt('ドプンッ',x,3,z,{size:70,st:'ink',life:0.6});
 if(!pl.dead&&(G.state==='play'||G.demoOn)&&Math.hypot(pl.x-x,pl.z-z)<R+0.4){const h=pl.hp;hurtPlayer(dmg,x,z);if(pl.hp<h)plBlind(bl)}}});
// ---- drawing ----
// Both are built from jointed parts: legs and arms are two segments each, bent by a small IK (mbIK) toward foot and hand targets.
// A pose is {h: weapon hand, s: blade direction, f: free hand (all in the torso frame: origin at the hips, +Z front, x for the weapon side),
//   ln: lean forward, cr: crouch, tw: upper-body twist}. Each state blends between two poses (mbPoseT / mbPoseD).
const vN3=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l]},vMix3=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],vAt=(a,d,k)=>[a[0]+d[0]*k,a[1]+d[1]*k,a[2]+d[2]*k];
function mbAx(a,b){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];return[Math.hypot(dx,dy,dz)||1e-4,Math.atan2(Math.hypot(dx,dz),dy),Math.atan2(dx,dz)]}
// a limb from a to b: a stretched sphere (muscle) or, with pi, a cylinder / cone
function mbLimb(a,b,w,c,pi,g,fl,wz){const[L,rx,ry]=mbAx(a,b);put(pi||SPH,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,rx,ry,0,w,L+(pi?0:w*0.5),wz||w,c,0,g==null?0.3:g,fl||0)}
// two-bone IK: joint and end for root a reaching t (bones l1, l2), the joint bends toward pole
function mbIK(a,t,l1,l2,pole){const dx=t[0]-a[0],dy=t[1]-a[1],dz=t[2]-a[2],d=Math.hypot(dx,dy,dz)||1e-4,u=[dx/d,dy/d,dz/d],dd=Math.min(d,(l1+l2)*0.995),x=(l1*l1-l2*l2+dd*dd)/(2*dd),h=Math.sqrt(Math.max(0,l1*l1-x*x)),
 pd=pole[0]*u[0]+pole[1]*u[1]+pole[2]*u[2],p=vN3([pole[0]-u[0]*pd,pole[1]-u[1]*pd,pole[2]-u[2]*pd]);return[[a[0]+u[0]*x+p[0]*h,a[1]+u[1]*x+p[1]*h,a[2]+u[2]*x+p[2]*h],vAt(a,u,dd)]}
function mbMix(A,B,t,m){const o={};for(const k of['h','s','f'])o[k]=vMix3(A[k],B[k],t).map((v,i)=>i===0?v*m:v);for(const k of['ln','cr','tw'])o[k]=lerp(A[k],B[k],t);o.tw*=m;return o}
// a blade from the hand along d: grip, guard, blade (outlined), glowing edge. W width, L length. Returns the tip.
function mbBlade(h,d,L,W,T,c,edge,guard,fl2){d=vN3(d);const[,rx,ry]=mbAx([0,0,0],d),za=[Math.cos(rx)*Math.sin(ry),-Math.sin(rx),Math.cos(rx)*Math.cos(ry)];
 mbLimb(vAt(h,d,-0.2),vAt(h,d,0.13),0.075,C.inkD,CYL,0.1);put(CYL,...vAt(h,d,0.15),rx,ry,0,W*1.7+0.06,0.035,W*1.7+0.06,guard,0,.8);
 const b0=vAt(h,d,0.17),mid=vAt(b0,d,L/2);gId=nid();put(BOX,...mid,rx,ry,0,T,L,W,c,0,.7);gId=0;
 put(BOX,...vAt(vAt(b0,d,L*0.48),za,W*0.42),rx,ry,0,T*1.25,L*0.94,W*0.22,edge,0,0,F_UNLIT|F_NOCAST|(fl2||0));
 const tip=vAt(b0,d,L);put(PYR,...vAt(tip,d,W*0.25),rx,ry,0,T*1.2,W*0.55,W*0.9,c,0,.7);return tip}
// the arc a fast swing leaves (white, then thins out)
function mbSwoosh(h0,d0,h1,d1,L,k,c){if(k<=0)return;let pa=null,pb=null;for(let i=0;i<=6;i++){const t=i/6,h=vMix3(h0,h1,t),d=vN3(vMix3(d0,d1,t)),a=vAt(h,d,L*0.55),b=vAt(h,d,L*1.05);
 if(pa){mbLimb(pa,a,0.12*k,c,0,0,F_UNLIT|F_NOCAST);mbLimb(pb,b,0.3*k,C.white,0,0,F_UNLIT|F_NOCAST)}pa=a;pb=b}}
// legs on the model frame: hip height hy, hips at ±hx; feet from the walk cycle / stance / tuck
function mbLegs(o){const{hy,hx,l1,l2,ph,mv,st,m,tuck,w1,w2,cT,cS,cF,trous}=o;const r=[];
 for(const s of[-1,1]){const lead=s===-m?1:-1,cyc=ph+(s>0?0:PI),fz=Math.sin(cyc)*0.5*mv+st*lead*0.38,fy=0.09+Math.max(0,Math.cos(cyc))*0.3*mv,
  hip=[s*hx,hy,0],tg=tuck>0?vMix3([s*(hx+0.06),fy,fz],[s*(hx+0.08),hy-0.45,0.25],tuck):[s*(hx+0.04+st*0.08),fy,fz],[kn,an]=mbIK(hip,tg,l1,l2,[s*0.15,0,1]);
  const ct=typeof cT==='function'?cT(s):cT,cs=typeof cS==='function'?cS(s):cS;
  if(trous){// hakama: a full thigh and a cone that flares toward the ankle, with a pleat line
   const sd=vN3([kn[0]-an[0],kn[1]-an[1],kn[2]-an[2]]),a0=[an[0],an[1]+0.1,an[2]];mbLimb(hip,kn,trous.w*0.82,trous.c,0,.2);mbLimb(a0,vAt(kn,sd,0.55),trous.w*1.25,trous.c,CONE,.2);
   mbLimb(vAt(a0,[0,0,1],trous.w*0.5),vAt(vAt(kn,sd,0.1),[0,0,1],trous.w*0.36),0.03,C.inkD,CYL,0)}
  else{mbLimb(hip,kn,w1,ct,0,.4);mbLimb(kn,an,w2,cs,0,.4);put(SPH,kn[0],kn[1],kn[2]+0.03,0,0,0,w2*1.05,w2*1.05,w2*1.05,cs,0,.3)}
  box(an[0],Math.max(0.05,an[1]-0.04),an[2]+0.07,w2*0.95,0.12,w2*1.9,cF);r.push(an)}return r}
const MB_TP={// 双子: torso frame, x = the sword side
 run:{h:[.55,.3,-.05],s:[.55,-.3,-.8],f:[-.45,.42,.32],ln:.38,cr:.08,tw:0},
 up:{h:[.3,1.42,-.18],s:[-.15,.6,-1],f:[-.25,.8,.62],ln:-.08,cr:.06,tw:-.5},
 cut:{h:[-.35,.3,.62],s:[-.75,-.4,.55],f:[-.55,.35,-.3],ln:.32,cr:.2,tw:.55},
 iai:{h:[.12,.22,-.02],s:[.25,.05,-1],f:[-.08,.36,.42],ln:.48,cr:.32,tw:-.35},
 dash:{h:[.3,.55,.78],s:[.08,0,1],f:[-.5,.32,-.5],ln:.58,cr:.22,tw:.25},
 jump:{h:[.08,1.85,.12],s:[0,1,-.35],f:[-.05,1.8,.14],ln:-.15,cr:0,tw:0}};
function mbPoseT(e,K){const P=MB_TP,st=e.st,u=e.stT,E=easeInOut;
 if(st==='w1'||st==='w2')return[P.run,P.up,E(sat(u/(K.w1*0.45)))];if(st==='w3')return[P.run,P.iai,E(sat(u/0.25))];if(st==='a3')return[P.iai,P.dash,sat(u/0.08)];
 if(st==='w4')return[P.run,P.jump,E(sat(u/0.3))];if(st==='rec')return[P.cut,P.run,E(sat((u-0.12)/0.4))];return[P.run,P.run,0]}
// 双子剣鬼: mirrored twins (アカツキ: red skin, horn and sword on one side / ヨイヤミ: ink skin, on the other), white hakama, an armoured sword shoulder,
//   a headband whose tails stream behind, elemental blade
function drawTwin(e){const K=MBT.twin,dk=e.v===1,m=dk?-1:1,k=foeK(e),st=e.st,u=e.stT,NF=F_UNLIT|F_NOCAST,sk=dk?C.ink:C.red,skD=dk?C.inkD:C.fireD,el=dk?C.darkP:C.orange,el2=dk?C.purple:C.yellow,y=e.y||0;
if(e.pst!==st){e.sw=st==='rec'&&(e.pst==='w1'||e.pst==='w2'||e.pst==='w4'||e.pst==='a3')?1:0;e.pst=st}
const mv=st==='chase'?1:st==='a3'?1.3:0,[A,B,t]=mbPoseT(e,K),P=mbMix(A,B,t,m),ph=e.t*(st==='a3'?18:12),tuck=st==='w4'?Math.sin(sat(u/K.w4)*PI):0,stance=st==='chase'||st==='a3'?0:0.8,
 bob=Math.abs(Math.cos(ph))*0.06*mv,hy=1.02-P.cr+bob;
mPush();mT(e.x,y,e.z);mRY(e.yaw);mS(k*1.18,k*1.18,k*1.18);gTint=e.flash>0?1:0;
mbLegs({hy,hx:0.17,l1:0.54,l2:0.52,ph,mv,st:stance,m,tuck,w1:0.24,w2:0.2,cT:skD,cS:skD,cF:C.inkD,trous:{w:0.5,c:C.paper}});
// --- upper body (torso frame) ---
mPush();mT(0,hy,0);mRX(P.ln);mRY(P.tw);
sph(0,0.24,0,0.6,0.55,0.44,sk,0,.4);put(CYL,0,0.12,0,0,0,0,0.66,0.17,0.5,el,0,0,NF);put(CYL,0,0.12,0,0,0,0,0.7,0.05,0.54,C.gold,0,.8);
const sw=Math.sin(e.t*7)*0.25+mv*0.5;for(const o of[-1,1])put(BOX,m*0.12+o*0.06,-0.02,-0.3-mv*0.08,-0.25-sw*(0.8+o*0.2),0,o*0.15,0.1,0.42,0.03,el,0,0,NF);
gId=nid();sph(0,0.62,0,0.88,0.62,0.54,sk,0,.5,0,1);gId=0;for(const s of[-1,1])sph(s*0.19,0.7,0.17,0.38,0.3,0.22,sk,0,.6);for(const s of[-1,1])box(s*0.09,0.38,0.23,0.12,0.03,0.04,skD);
put(BOX,0,0.62,0.285,0,0,m*0.6,0.1,0.92,0.05,C.paper);// sash across the chest
// armoured shoulder on the sword side: three lames + gold rims
for(let i=0;i<3;i++){const x=m*(0.44+i*0.06),yy=0.98-i*0.11,r=-m*(0.45+i*0.15);put(BOX,x,yy,0,0,0,r,0.28,0.06,0.36,i%2?el:skD,0,.5);put(BOX,x+m*0.01,yy-0.035,0,0,0,r,0.29,0.02,0.37,C.gold,0,.8)}
sph(-m*0.43,0.9,0,0.36,0.32,0.36,sk,0,.5);
// head
put(CYL,0,1.0,0.02,0,0,0,0.26,0.2,0.26,skD);
mPush();mT(0,1.26,0.03);sph(0,0,0,0.52,0.56,0.5,sk,0,.6,0,1);sph(0,0.17,-0.06,0.56,0.36,0.52,dk?C.inkD:C.redD);box(0,0.08,0.2,0.4,0.07,0.1,skD);
for(const s of[-1,1]){put(SPH,s*0.12,0.0,0.23,0,0,s*0.3,0.13,0.07,0.06,el2,0,0,NF);put(BOX,s*0.13,0.08,0.24,0,0,-s*0.4,0.17,0.04,0.04,C.inkD)}
box(0,-0.16,0.22,0.22,0.05,0.05,C.inkD);for(const s of[-1,1])put(CONE,s*0.08,-0.13,0.24,PI,0,0,0.05,0.09,0.05,C.white);
put(CONE,m*0.19,0.34,0,0,0,-m*0.35,0.13,0.42,0.13,dk?C.purple:C.gold,0,.8);put(CONE,m*0.23,0.62,0,0,0,-m*0.1,0.09,0.2,0.09,el2,0,0,NF);
put(CYL,0,0.14,0,0,0,0,0.58,0.07,0.55,C.paper,0,.2);// headband + tails streaming behind
for(const o of[-1,1]){const fl=Math.sin(e.t*9+o)*0.35,lf=0.5+mv*0.5;put(BOX,o*0.08,0.12+fl*0.08,-0.28-lf*0.25,0.9+fl*0.4-mv*0.3,o*0.25,0,0.08,0.03,0.18+lf*0.5,C.paper,0,.2)}
for(let i=0;i<3;i++)put(CONE,(i-1)*0.15,0.36,-0.18,-0.6,0,(i-1)*0.4,0.12,0.34,0.12,dk?C.inkD:C.orange,0,0,dk?0:NF|F_FLAME);mPop();
// arms: sword arm (x = m) and free arm, two bones each
const sh=[m*0.44,0.86,0],[el1,h1]=mbIK(sh,P.h,0.5,0.48,[m,-0.6,-0.5]),fs=[-m*0.44,0.86,0],[el3,h3]=mbIK(fs,P.f,0.48,0.46,[-m,-0.6,-0.5]);
for(const[a,b,c]of[[sh,el1,h1],[fs,el3,h3]]){mbLimb(a,b,0.25,sk,0,.5);mbLimb(b,c,0.22,sk,0,.5);mbLimb(vMix3(b,c,0.62),vMix3(b,c,0.9),0.24,C.steel,CYL,.8);sph(...c,0.22,0.22,0.22,skD,0,.4)}
const tip=mbBlade(h1,P.s,1.45,0.15,0.05,C.steel,el,C.gold);
if(e.sw&&st==='rec'&&u<0.2){const U=MB_TP.up,Cc=MB_TP.cut,mx=a=>[a[0]*m,a[1],a[2]];mbSwoosh(mx(U.h),mx(U.s),mx(Cc.h),mx(Cc.s),1.62,1-u/0.2,el)}
if(st==='w4'||st==='w1'&&u>K.w1-0.2)bill(BURST,...tip,0.5+Math.sin(now*30)*0.1,now*8,el2,NF);
mPop();
// scabbard on the free side
put(BOX,-m*0.3,hy-0.05,-0.15,0.9,0,-m*0.2,0.08,0.9,0.12,C.inkD,0,.4);
gTint=0;mPop();
// telegraphs
const lineT=(a,L,c)=>{mPush();mT(e.x+Math.sin(a)*L/2,0.12,e.z+Math.cos(a)*L/2);mRY(a);mS(0.5,0.02,L);emit(BOX,c,0,0,NF,0);mPop()};
if(st==='w1'&&Math.sin(e.t*(u>K.w1-0.2?40:16))>-0.3)lineT(e.yaw,22,C.red);
else if(st==='w2'&&Math.sin(e.t*(u>K.w2-0.2?40:16))>-0.3)for(const o of[-0.32,0,0.32])lineT(e.yaw+o,18,C.red);
else if(st==='w3'&&Math.sin(e.t*30)>-0.3){lineT(e.yaw,K.dash*K.dashT,C.red);const L=K.dash*K.dashT+0.8;put(PYR,e.x+Math.sin(e.yaw)*L,0.13,e.z+Math.cos(e.yaw)*L,PI/2,e.yaw,0,1.6,0.8,1.2,C.red,0,0,NF)}
else if(st==='w4'){if(Math.sin(e.t*24)>-0.3)lineT(e.yaw,26,C.red);bill(BURST,e.x,y+3.1,e.z,1.2+Math.sin(now*20)*0.2,now*6,el,NF)}
else if(st==='a3'){for(let i=1;i<=3;i++){const bx=e.x-Math.sin(e.yaw)*i*0.9,bz=e.z-Math.cos(e.yaw)*i*0.9;put(SPH,bx,1.4,bz,0,e.yaw,0,0.9-i*0.18,2.0-i*0.35,0.5,el,0,0,NF|F_NOEDGE)}}}// afterimages of the dash
const MB_DP={// ゴウエン: torso frame, x = the cleaver side (his red side)
 walk:{h:[.72,.55,.25],s:[.2,.75,-.55],f:[-.78,.15,.15],ln:.12,cr:.05,tw:0},
 up:{h:[.45,1.75,-.12],s:[0,.45,-1],f:[-.62,.95,.6],ln:-.12,cr:.06,tw:-.3},
 slam:{h:[.18,.3,1.0],s:[0,-.6,1],f:[-.7,.3,.32],ln:.42,cr:.32,tw:.2},
 jump:{h:[.32,1.95,.12],s:[0,1,-.2],f:[-.32,1.95,.12],ln:-.12,cr:0,tw:0},
 roar:{h:[1.1,.9,.25],s:[.6,-.6,.3],f:[-1.1,.9,.25],ln:-.22,cr:.28,tw:0},
 call:{h:[.55,.0,.55],s:[0,-1,.15],f:[-.35,2.0,.28],ln:-.05,cr:.1,tw:.15},
 brace:{h:[.88,.55,-.48],s:[.4,.1,-1],f:[-.5,.6,.62],ln:.38,cr:.32,tw:-.4},
 spin:{h:[1.05,.72,.22],s:[1,0,.1],f:[-.95,.72,0],ln:.1,cr:.22,tw:0}};
function mbPoseD(e,K){const P=MB_DP,st=e.st,u=e.stT,E=easeInOut;
 if(st==='w1')return[P.walk,P.up,E(sat(u/(K.w1*0.6)))];if(st==='w2')return[P.walk,P.jump,E(sat(u/0.25))];if(st==='w3')return[P.walk,P.roar,E(sat(u/0.3))];
 if(st==='w4'||st==='a4')return[P.walk,P.call,st==='a4'?1:E(sat(u/0.3))];if(st==='w5')return[P.walk,P.brace,E(sat(u/0.3))];if(st==='a5')return[P.brace,P.spin,sat(u/0.12)];
 if(st==='rec')return[e.sw===1?P.slam:P.call,P.walk,E(sat((u-0.15)/0.5))];return[P.walk,P.walk,0]}
// 墨焔鬼ゴウエン: left half ink black, right half crimson; a straw-rope belt with paper streamers over a striped loincloth, a spiked
//   pauldron on the ink side, tusks, one black and one red horn, a flame mane, a huge cleaver in the red hand
function drawDmon(e){const K=MBT.dmon,k=foeK(e),st=e.st,u=e.stT,NF=F_UNLIT|F_NOCAST,y=e.y||0,p2=e.p2;
if(e.pst!==st){e.sw=st==='rec'?(e.pst==='w1'?1:e.pst==='a5'?2:0):0;e.pst=st}
const mv=st==='chase'?1:0,[A,B,t]=mbPoseD(e,K),P=mbMix(A,B,t,1),ph=e.t*7,tuck=st==='w2'?Math.sin(sat(u/K.w2)*PI):0,stance=st==='chase'?0:0.7,hy=0.98-P.cr+Math.abs(Math.cos(ph))*0.05*mv,
 side=s=>s<0?C.ink:C.red,sideD=s=>s<0?C.inkD:C.fireD;
mPush();mT(e.x,y,e.z);mRY(e.yaw+(st==='a5'?e.t*14:0));mS(k*1.55,k*1.55,k*1.55);gTint=e.flash>0?1:0;
mbLegs({hy,hx:0.3,l1:0.52,l2:0.48,ph,mv,st:stance,m:1,tuck,w1:0.4,w2:0.34,cT:side,cS:sideD,cF:C.inkD});
mPush();mT(0,hy,0);mRX(P.ln);mRY(P.tw);
// loincloth (yellow with ink stripes) under a straw-rope belt with paper streamers
box(0,-0.08,0.27,0.62,0.5,0.06,C.gold);for(let i=0;i<3;i++)box((i-1)*0.18,-0.06-i%2*0.08,0.305,0.07,0.32,0.02,C.inkD);box(0,-0.02,-0.3,0.7,0.36,0.06,C.gold);
gId=nid();sph(-0.24,0.4,0,0.95,0.8,0.82,C.ink,0,.5,0,1);sph(0.24,0.4,0,0.95,0.8,0.82,C.red,0,.5,0,1);gId=0;
for(let i=0;i<14;i++){const a=i/14*TAU;put(SPH,Math.sin(a)*0.56,0.16+(i%2)*0.02,Math.cos(a)*0.46,0,a,0.5,0.2,0.13,0.15,C.rope,0,.2)}
for(const s of[-1,1])for(let j=0;j<3;j++)box(s*0.2+(j%2)*0.04*s,0.02-j*0.09,0.48,0.1,0.09,0.02,C.paper);
// chest + pecs + tomoe
for(const s of[-1,1]){sph(s*0.26,0.92,0.05,0.62,0.55,0.6,side(s),0,.55);sph(s*0.23,0.95,0.3,0.42,0.32,0.18,side(s),0,.6)}
tomoe(0,0.58,0.42,0.3,p2?C.yellow:C.paper,-e.t*(p2?3:1),p2?NF:0);
// shoulders: spiked pauldron on the ink side, gold band on the red side
put(SPIKE,-0.78,1.18,0,0,0,0.3,0.62,0.5,0.62,C.inkD,0,.6);put(CYL,-0.78,1.05,0,0,0,0.3,0.66,0.08,0.66,C.gold,0,.8);sph(0.78,1.15,0,0.55,0.5,0.55,C.red,0,.5);
// head
mPush();mT(0,1.72,0.1);sph(0,0,0,0.72,0.74,0.68,C.ink,0,.6,0,1);sph(0.19,0.02,0.06,0.4,0.66,0.58,C.red,0,.6);box(0,0.13,0.27,0.56,0.1,0.12,C.inkD);
put(SPH,-0.16,0.05,0.29,0,0,-0.3,0.17,0.09,0.06,C.purple,0,0,NF);put(SPH,0.16,0.05,0.29,0,0,0.3,0.17,0.09,0.06,C.yellow,0,0,NF);
const op=st==='w2'||st==='w3'||st==='a4'?0.14:0;box(0,-0.21-op/2,0.3,0.36,0.08+op,0.06,C.inkD);for(const s of[-1,1]){put(CONE,s*0.13,-0.12,0.31,0,0,s*0.25,0.07,0.2,0.07,C.white,0,.4);put(CYL,s*0.05,-0.18,0.33,0,0,0,0.04,0.08,0.04,C.white)}
put(CONE,-0.27,0.46,0,0,0,0.45,0.19,0.6,0.19,C.inkD,0,.8);put(CONE,0.27,0.46,0,0,0,-0.45,0.19,0.6,0.19,C.red,0,.8);
for(let i=0;i<7;i++){const o=i-3;put(CONE,o*0.15,0.4-Math.abs(o)*0.05,-0.3,-0.75,0,-o*0.25,0.2,(p2?0.85:0.58)+Math.sin(e.t*9+i)*0.06,0.2,i%2?C.orange:C.inkD,0,0,i%2?NF|F_FLAME:0)}mPop();
// arms
const sh=[0.8,1.05,0],[el1,h1]=mbIK(sh,P.h,0.56,0.52,[0.8,-0.6,-0.5]),fs=[-0.8,1.05,0],[el3,h3]=mbIK(fs,P.f,0.56,0.52,[-0.8,-0.6,-0.5]);
mbLimb(sh,el1,0.42,C.red,0,.5);mbLimb(el1,h1,0.38,C.red,0,.5);mbLimb(vMix3(el1,h1,0.55),vMix3(el1,h1,0.85),0.41,C.gold,CYL,.8);sph(...h1,0.36,0.36,0.36,C.fireD,0,.4);
mbLimb(fs,el3,0.42,C.ink,0,.5);mbLimb(el3,h3,0.38,C.ink,0,.5);mbLimb(vMix3(el3,h3,0.55),vMix3(el3,h3,0.85),0.41,C.steel,CYL,.8);sph(...h3,0.36,0.36,0.36,C.inkD,0,.4);
const dN=vN3(vMix3(el3,h3,1.2).map((v,i)=>v-el3[i]));for(let i=-1;i<=1;i++)put(CONE,...vAt(h3,dN,0.2),PI/2,Math.atan2(dN[0],dN[2])+i*0.4,0,0.07,0.18,0.07,C.white,0,.4);// claws
const tip=mbBlade(h1,P.s,2.1,0.42,0.09,C.stoneD,C.red,C.gold,p2?F_FLAME:0);
const d2=vN3(P.s),[,rx,ry]=mbAx([0,0,0],d2),za=[Math.cos(rx)*Math.sin(ry),-Math.sin(rx),Math.cos(rx)*Math.cos(ry)];
put(BOX,...vAt(vAt(h1,d2,1.22),za,-0.19),rx,ry,0,0.1,2.0,0.06,C.darkP,0,0,NF);// dark back edge
if(p2)for(let i=0;i<3;i++)bill(STAR,...vAt(h1,d2,0.6+i*0.6+Math.sin(e.t*5+i)*0.1),0.22,e.t*3+i,C.orange,NF);
if(e.sw===1&&st==='rec'&&u<0.22){const U=MB_DP.up,S=MB_DP.slam;mbSwoosh(U.h,U.s,S.h,S.s,2.3,1-u/0.22,C.red)}
mPop();gTint=0;mPop();
const lineT=(a,L,w,c)=>{mPush();mT(e.x+Math.sin(a)*L/2,0.12,e.z+Math.cos(a)*L/2);mRY(a);mS(w,0.02,L);emit(BOX,c,0,0,NF,0);mPop()},bl=f=>Math.sin(e.t*f)>-0.3;
if(st==='w1'&&bl(u>K.w1-0.25?40:16)){lineT(e.yaw,24,1.4,C.red);if(p2){lineT(e.yaw-0.4,20,0.6,C.red);lineT(e.yaw+0.4,20,0.6,C.red)}}
else if(st==='w2'&&bl(26)){const s=4+Math.sin(now*20)*0.6;put(RING,e.x,0.12,e.z,0,0,0,s,1,s,C.red,0,0,NF);put(RING,e.x,0.12,e.z,0,0,0,s*2,1,s*2,C.darkP,0,0,NF)}
else if(st==='w3'){const R=K.burstR,g=sat(u/K.w3);if(bl(u>K.w3-0.3?40:16))put(RING,e.x,0.12,e.z,0,0,0,R*2,1,R*2,C.red,0,0,NF);put(CYL,e.x,0.09,e.z,0,0,0,R*2*g,0.02,R*2*g,C.darkP,0,0,NF|F_NOEDGE);bill(BURST,e.x,y+3.4,e.z,2.2*g+0.5,-now*5,C.inkD,NF)}
else if(st==='w5'&&bl(30)){const L=K.charge*K.chargeT;lineT(e.yaw,L,2.6,C.red);put(PYR,e.x+Math.sin(e.yaw)*(L+1),0.13,e.z+Math.cos(e.yaw)*(L+1),PI/2,e.yaw,0,2.6,1.2,1.8,C.red,0,0,NF)}}
// HUD: the mid-bosses' HP (where the boss bar goes)
function mbHUD(){if(boss)return;const tw=mbAlive('twin'),dm=mbAlive('dmon');for(const e of[...tw,...dm])e.mhp=Math.max(e.mhp||0,e.hp);
if(dm.length){const e=dm[0];gauge(480,28,520,24,sat(e.hp/e.mhp),e.p2?'#ff3b30':'#a04cff','中ボス');txt('墨焔鬼ゴウエン',740,70,22,'#fff',INK,6);return}
if(!tw.length)return;for(const e of tw){const x=e.v?760:480;gauge(x,28,240,22,sat(e.hp/e.mhp),e.v?'#7a3fd0':'#ff6a2b',e.v?'闇':'炎');txt(MB_NAME[e.v],x+120,66,20,'#fff',INK,5)}
txt('双子剣鬼',740,92,18,'#ffd91a',INK,5)}
