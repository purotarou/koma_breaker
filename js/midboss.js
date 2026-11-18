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
 twin:{hp:520,spd:5.4,keep:10,apart:9,range:28,cd:[1.4,2.3],w1:0.7,w2:0.85,w3:0.7,w4:1.0,sv:17,dmg:13,big:18,dash:15,dashT:0.55,dashDmg:16,blind:2.4,rage:1.6},
 dmon:{hp:1500,spd:3.2,keep:[6,12],range:30,cd:[1.3,2.0],w1:0.9,w2:1.0,w3:1.1,w4:0.6,w5:0.85,sv:15,dmg:22,ring:16,burstR:8,burstDmg:14,blind:3.2,pilN:5,
  charge:18,chargeT:1.0,chargeDmg:22,score:3000}};
const MB_NAME=['アカツキ','ヨイヤミ'],MB_SHOT={8:1,9:1,10:1.6,11:1.6,12:2.4};// slash shots: k -> size (8 fire / 9 dark / 10,11 big / 12 huge 焔墨)
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
for(const p of allP()){if(p.dead)continue;const dx=p.x-s.x,dz=p.z-s.z,al=dx*ux+dz*uz,pp=dx*uz-dz*ux;if(Math.abs(al)<0.9&&Math.abs(pp)<1.3*w&&Math.abs((p.y||0)+1.0-s.y)<0.8*w+0.5){
 if(!wpGuardShot(p,s)){hurtT(p,s.dmg,s.x,s.z,0,s.bl);if(s.k===8||s.k===10)ev('mbFire',r1(p.x),r1(p.z));popShot(s)}return true}}
return true}
function mbPop(s){const c=s.k===9||s.k===11?C.darkP:s.k===12?C.red:C.orange;fxStar(s.x,s.y,s.z,1.6*(MB_SHOT[s.k]||1),C.white,0.08);fxSparks(s.x,s.y,s.z,6,6,c);fxBlobs(s.x,s.y,s.z,3,5,s.k===9||s.k===11?C.inkD:C.orange,0.14)}
// a crescent standing across the flight direction
function mbDrawShot(s){const NF=F_UNLIT|F_NOCAST,w=MB_SHOT[s.k]||1,dark=s.k===9||s.k===11,dual=s.k===12,l=Math.hypot(s.vx,s.vz)||1;
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
  else if(st==='rec'){e.y=0;if(u>(rage?0.35:0.7)){e.st='chase';e.cd=rnd(K.cd[0],K.cd[1])}}},
 sph(e){const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw),y=e.y||0;return[[e.x,y+1.15,e.z,0.85,1],[e.x+fx*0.1,y+2.2,e.z+fz*0.1,0.4,2]]},
 ctr(e){return[e.x,(e.y||0)+1.4,e.z,1.4]},
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
  else if(st==='a4'){const n=K.pilN+(p2?2:0),want=Math.floor(u/0.42);while(e.vn<=want&&e.vn<n){e.vn++;for(const P of allP())if(!P.dead)ev('e1',r1(P.x+(P.vx||0)*0.3),r1(P.z+(P.vz||0)*0.3),1,0.75)}if(u>n*0.42+0.6){e.st='rec';e.stT=0}}
  else if(st==='w5'){mbFace(e,Math.atan2(e.tx-e.x,e.tz-e.z),dt,u>K.w5-0.3);if(u<K.w5-0.3){e.tx=T.x;e.tz=T.z}if(u>K.w5){e.st='a5';e.stT=0;e.hd=false;e.lx=Math.sin(e.yaw);e.lz=Math.cos(e.yaw);ev('txt','突進斬リ！',r1(e.x),4,r1(e.z),60,'boom')}}
  else if(st==='a5'){const px=e.x,pz=e.z;e.x+=e.lx*K.charge*dt;e.z+=e.lz*K.charge*dt;collide(e,e.r);if(lim('dm'+e.id,0.1))ev('mbFire',r1(e.x),r1(e.z));
   for(const p of allP())if(!p.dead&&!e.hd&&Math.hypot(p.x-e.x,p.z-e.z)<2.3&&(p.y||0)<1.6){e.hd=true;hurtT(p,K.chargeDmg,e.x,e.z)}
   if(u>K.chargeT||Math.hypot(e.x-px,e.z-pz)<K.charge*0.3*dt&&u>0.1){ev('mbBurst',r1(e.x),r1(e.z),4.5,12,K.blind*0.7);e.st='rec';e.stT=0}}
  else if(st==='rec'){e.y=0;if(u>(p2?0.55:0.9)){e.st='chase';e.cd=rnd(K.cd[0],K.cd[1])}}},
 sph(e){const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw),y=e.y||0;return[[e.x,y+1.0,e.z,1.15,1],[e.x,y+2.1,e.z,1.25,1],[e.x+fx*0.25,y+3.2,e.z+fz*0.25,0.55,2]]},
 ctr(e){return[e.x,(e.y||0)+2.0,e.z,2.0]},
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
// 双子剣鬼: mirrored twins (アカツキ: red skin, horn and sword on the right / ヨイヤミ: ink-purple skin, both on the left), white hakama, element blade
function drawTwin(e){const K=MBT.twin,dk=e.v===1,m=dk?-1:1,k=foeK(e),st=e.st,u=e.stT,NF=F_UNLIT|F_NOCAST,sk=dk?C.ink:C.red,skD=dk?C.inkD:C.fireD,el=dk?C.darkP:C.orange,el2=dk?C.purple:C.yellow,run=st==='chase'?Math.sin(e.t*12):st==='a3'?0.8:0,y=e.y||0;
let arm=0.3,lean=0;if(st==='w1'||st==='w2'){arm=-2.4*sat(u/0.4);lean=-0.1}else if(st==='w3'){arm=-1.2;lean=0.35}else if(st==='a3'){arm=1.4;lean=0.45}else if(st==='w4'){arm=-2.9}else if(st==='rec'){arm=1.6*(1-sat(u/0.5))}
mPush();mT(e.x,y,e.z);mRY(e.yaw);mS(k*1.18,k*1.18,k*1.18);mRX(lean);gTint=e.flash>0?1:0;
for(const s of[-1,1]){put(CYL,s*0.22,0.42,0,s*run*0.6,0,0,0.26,0.84,0.26,skD);box(s*0.22,0.06,0.08+s*run*0.15,0.24,0.12,0.4,C.inkD)}
put(CONE,0,0.75,0,0,0,0,1.15,1.0,0.95,C.paper,0,.3);put(CYL,0,1.22,0,0,0,0,0.78,0.14,0.62,el,0,0,NF);
sph(0,1.6,0,0.82,0.85,0.6,sk,0,.5,0,1);put(BOX,0,1.6,0.27,0,0,m*0.5,0.16,0.9,0.08,C.paper);sph(-m*0.36,1.92,0,0.38,0.32,0.36,C.paper);
mPush();mT(0,2.22,0.02);sph(0,0,0,0.56,0.6,0.54,sk,0,.6,0,1);sph(0,0.18,-0.06,0.6,0.38,0.56,dk?C.inkD:C.redD);
for(const s of[-1,1]){put(SPH,s*0.13,0.0,0.24,0,0,s*0.3,0.14,0.07,0.06,el2,0,0,NF);put(BOX,s*0.14,0.09,0.25,0,0,-s*0.4,0.18,0.04,0.04,C.inkD)}
put(CONE,m*0.2,0.36,0,0,0,-m*0.35,0.14,0.42,0.14,dk?C.purple:C.gold,0,.8);put(CONE,m*0.24,0.64,0,0,0,-m*0.1,0.1,0.22,0.1,el2,0,0,NF);box(0,-0.17,0.25,0.22,0.04,0.04,C.inkD);
for(let i=0;i<3;i++)put(CONE,(i-1)*0.16,0.38,-0.18,-0.6,0,(i-1)*0.4,0.12,0.36,0.12,dk?C.inkD:C.orange,0,0,dk?0:NF|F_FLAME);mPop();
// free arm, sword arm (mirrored)
put(SPH,-m*0.5,1.45,0.05,-0.2,0,-m*0.25,0.24,0.62,0.24,sk);
mPush();mT(m*0.48,1.85,0);mRX(arm);put(SPH,0,-0.3,0,0,0,0,0.24,0.66,0.24,sk);mT(0,-0.62,0.06);sph(0,0,0,0.22,0.22,0.22,skD);mRX(-PI/2);
box(0,0.08,0,0.08,0.3,0.08,C.inkD);put(CYL,0,0.25,0,0,0,0,0.22,0.04,0.22,C.gold);gId=nid();box(0,0.95,0,0.05,1.3,0.13,C.stoneL,0,1);gId=0;box(0,0.95,0.07,0.06,1.24,0.05,el,0,0,NF);mPop();
gTint=0;mPop();
// telegraphs
const lineT=(a,L,c)=>{mPush();mT(e.x+Math.sin(a)*L/2,0.12,e.z+Math.cos(a)*L/2);mRY(a);mS(0.5,0.02,L);emit(BOX,c,0,0,NF,0);mPop()};
if(st==='w1'&&Math.sin(e.t*(u>K.w1-0.2?40:16))>-0.3)lineT(e.yaw,22,C.red);
else if(st==='w2'&&Math.sin(e.t*(u>K.w2-0.2?40:16))>-0.3)for(const o of[-0.32,0,0.32])lineT(e.yaw+o,18,C.red);
else if(st==='w3'&&Math.sin(e.t*30)>-0.3){lineT(e.yaw,K.dash*K.dashT,C.red);const L=K.dash*K.dashT+0.8;put(PYR,e.x+Math.sin(e.yaw)*L,0.13,e.z+Math.cos(e.yaw)*L,PI/2,e.yaw,0,1.6,0.8,1.2,C.red,0,0,NF)}
else if(st==='w4'){if(Math.sin(e.t*24)>-0.3)lineT(e.yaw,26,C.red);bill(BURST,e.x,y+2.6,e.z,1.2+Math.sin(now*20)*0.2,now*6,el,NF)}}
// 墨焔鬼ゴウエン: left half ink black, right half crimson; one black horn and one red horn, a flame mane, a huge cleaver
function drawDmon(e){const K=MBT.dmon,k=foeK(e),st=e.st,u=e.stT,NF=F_UNLIT|F_NOCAST,y=e.y||0,run=st==='chase'?Math.sin(e.t*7):0,p2=e.p2;
let arm=0.4,lean=0;if(st==='w1'){arm=-2.6*sat(u/0.5)}else if(st==='w2'){arm=-1.5}else if(st==='w3'){arm=-0.5;lean=-0.15}else if(st==='w4'||st==='a4'){arm=-2.8}else if(st==='w5'){arm=-0.9;lean=0.2}else if(st==='a5'){arm=1.2;lean=0.5}else if(st==='rec'){arm=1.5*(1-sat(u/0.6))}
mPush();mT(e.x,y,e.z);mRY(e.yaw+(st==='a5'?e.t*14:0));mS(k*1.55,k*1.55,k*1.55);mRX(lean);gTint=e.flash>0?1:0;
for(const s of[-1,1]){const c=s<0?C.inkD:C.fireD;put(CYL,s*0.3,0.45,0,s*run*0.5,0,0,0.42,0.9,0.42,c);box(s*0.3,0.07,0.1,0.38,0.14,0.55,C.inkD)}
box(0,0.95,0,1.2,0.42,0.8,C.inkD,6);put(CYL,0,1.18,0,0,0,0,1.1,0.12,0.78,C.gold);
gId=nid();sph(-0.25,1.75,0,0.95,1.05,0.85,C.ink,0,.5,0,1);sph(0.25,1.75,0,0.95,1.05,0.85,C.red,0,.5,0,1);gId=0;
for(const s of[-1,1]){sph(s*0.7,2.2,0,0.7,0.6,0.7,s<0?C.ink:C.red,0,.5);put(CONE,s*0.85,2.55,0,0,0,-s*0.5,0.22,0.5,0.22,C.gold,0,.8)}
tomoe(0,1.85,0.44,0.38,p2?C.yellow:C.paper,-e.t*(p2?3:1),p2?NF:0);
mPush();mT(0,2.75,0.08);sph(0,0,0,0.75,0.78,0.7,C.ink,0,.6,0,1);sph(0.2,0.02,0.06,0.42,0.7,0.6,C.red,0,.6);
put(SPH,-0.17,0.06,0.3,0,0,-0.3,0.18,0.09,0.06,C.purple,0,0,NF);put(SPH,0.17,0.06,0.3,0,0,0.3,0.18,0.09,0.06,C.yellow,0,0,NF);box(0,-0.2,0.32,0.36,0.08+(st==='w2'||st==='w3'?0.12:0),0.06,C.inkD);
for(const s of[-1,1])put(CYL,s*0.06,-0.17,0.35,0,0,0,0.05,0.1,0.05,C.white);
put(CONE,-0.28,0.48,0,0,0,0.45,0.2,0.62,0.2,C.inkD,0,.8);put(CONE,0.28,0.48,0,0,0,-0.45,0.2,0.62,0.2,C.red,0,.8);
for(let i=0;i<5;i++){const o=i-2;put(CONE,o*0.2,0.42-Math.abs(o)*0.06,-0.32,-0.7,0,-o*0.3,0.22,p2?0.8:0.55,0.22,i%2?C.orange:C.inkD,0,0,i%2?NF|F_FLAME:0)}mPop();
put(SPH,-0.8,1.6,0.1,-0.2,0,0.3,0.36,0.95,0.36,C.ink);
mPush();mT(0.78,2.2,0);mRX(arm);put(SPH,0,-0.38,0,0,0,0,0.38,0.9,0.38,C.red);mT(0,-0.85,0.08);sph(0,0,0,0.34,0.34,0.34,C.fireD);mRX(-PI/2);
box(0,0.15,0,0.12,0.5,0.12,C.inkD);put(CYL,0,0.42,0,0,0,0,0.42,0.06,0.42,C.gold);gId=nid();box(0,1.55,0.04,0.09,2.2,0.42,C.stoneD,0,1);gId=0;box(0,1.55,0.24,0.1,2.1,0.06,C.red,0,0,NF);box(0,1.55,-0.17,0.1,2.1,0.06,C.darkP,0,0,NF);mPop();
gTint=0;mPop();
const lineT=(a,L,w,c)=>{mPush();mT(e.x+Math.sin(a)*L/2,0.12,e.z+Math.cos(a)*L/2);mRY(a);mS(w,0.02,L);emit(BOX,c,0,0,NF,0);mPop()},bl=f=>Math.sin(e.t*f)>-0.3;
if(st==='w1'&&bl(u>K.w1-0.25?40:16)){lineT(e.yaw,24,1.4,C.red);if(p2){lineT(e.yaw-0.4,20,0.6,C.red);lineT(e.yaw+0.4,20,0.6,C.red)}}
else if(st==='w2'&&bl(26)){const s=4+Math.sin(now*20)*0.6;put(RING,e.x,0.12,e.z,0,0,0,s,1,s,C.red,0,0,NF);put(RING,e.x,0.12,e.z,0,0,0,s*2,1,s*2,C.darkP,0,0,NF)}
else if(st==='w3'){const R=K.burstR,g=sat(u/K.w3);if(bl(u>K.w3-0.3?40:16))put(RING,e.x,0.12,e.z,0,0,0,R*2,1,R*2,C.red,0,0,NF);put(CYL,e.x,0.09,e.z,0,0,0,R*2*g,0.02,R*2*g,C.darkP,0,0,NF|F_NOEDGE);bill(BURST,e.x,y+2.2,e.z,2.2*g+0.5,-now*5,C.inkD,NF)}
else if(st==='w5'&&bl(30)){const L=K.charge*K.chargeT;lineT(e.yaw,L,2.6,C.red);put(PYR,e.x+Math.sin(e.yaw)*(L+1),0.13,e.z+Math.cos(e.yaw)*(L+1),PI/2,e.yaw,0,2.6,1.2,1.8,C.red,0,0,NF)}}
// HUD: the mid-bosses' HP (where the boss bar goes)
function mbHUD(){if(boss)return;const tw=mbAlive('twin'),dm=mbAlive('dmon');for(const e of[...tw,...dm])e.mhp=Math.max(e.mhp||0,e.hp);
if(dm.length){const e=dm[0];gauge(480,28,520,24,sat(e.hp/e.mhp),e.p2?'#ff3b30':'#a04cff','中ボス');txt('墨焔鬼ゴウエン',740,70,22,'#fff',INK,6);return}
if(!tw.length)return;for(const e of tw){const x=e.v?760:480;gauge(x,28,240,22,sat(e.hp/e.mhp),e.v?'#7a3fd0':'#ff6a2b',e.v?'闇':'炎');txt(MB_NAME[e.v],x+120,66,20,'#fff',INK,5)}
txt('双子剣鬼',740,92,18,'#ffd91a',INK,5)}
