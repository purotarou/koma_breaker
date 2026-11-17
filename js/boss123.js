'use strict';
// ================= BOSSES OF STAGES 1-3 (STORY.md 5, 9) =================
// All three stand at the north end like the old demon king (same hands, weak point on the forehead, net sync through m.b),
// but each asks for a different move (STG[n].bk):
//   beta  大墨魔王ベタグロ (1 朱の神社) — 横に避ける: shackled fists, lobbed ink, summons. Phase 2: the shackles break; both fists at once and
//          墨の波 (a wall of ink rolling down the whole yard: jump it).
//   aka   紅蓮魔王アカベタ (2 月下の天守) — 位置取り: open palms (the slam spreads a cross of fire), fire balls that leave fires, a fire breath
//          along a marked line. Phase 2: three breath lines and 火の線が回転 (two fire lines turn across the yard: walk with the gap or dash through).
//   nyudo 大入道 (3 黄昏の町) — ジャンプ: a bald giant in an orange kimono. Arm sweep along the ground (jump), fist pound (shock ring), throws
//          lanterns that turn into 化け提灯 (shoot them down in the air). Phase 2: the sweep comes back, and he smashes the roofs so rubble rains on marked spots.
// updBoss (entities.js) runs rise / die and hands the rest to updBoss2. Attack-specific numbers ride in b.p0 / b.p1 / b.n (synced).
// ---- tuning (目安。遊んで調整する) ---- [phase 1, phase 2] where two values are given
// hp: solo HP (×(1+0.8×(人数-1))) / cd: scale of the pauses between attacks (smaller = busier) / up: fist telegraph (s) / hold: how long the fist stays down (the opening)
const BT={
 beta:{hp:3600,cd:1,up:[0.85,0.6],hold:[1.2,0.8],slamDmg:28,up2:1.0,volN:[5,8],sumN:[3,4],waveTel:0.9,waveV:12,waveDmg:16,waveN:[1,2],say2:['オノレ','ェェェ!!'],
  p1:['fist','volley','fist','summon'],p2:['fist','double','volley','fist','summon'],
  x1:['fist','volley','pillar','fist','summon'],x2:['fist','wave','double','pillar','volley','fist','summon','wave','pillar']},
 aka:{hp:4400,cd:0.75,up:[0.95,0.7],hold:[1.1,0.8],slamDmg:26,ballN:[4,6],ballDmg:14,sumN:[2,3],fireLife:8,fireMax:6,burn:7,burnT:0.45,crossN:3,crossLife:3.2,
  brTel:0.9,brN:[1,3],brLife:2.6,spinTel:1.1,spinW:0.62,spinGap:0.85,spinDmg:14,say2:['燃エ','尽キロ!!'],
  p1:['palm','fireball','palm','breath','summon'],p2:['palm','spin','fireball','palm','breath','spin','summon'],
  x1:['palm','fireball','chase','palm','breath','summon'],x2:['palm','spin','chase','fireball','palm','breath','spin','chase','summon']},
 nyudo:{hp:4800,cd:0.7,up:[0.85,0.62],hold:[1.1,0.8],slamDmg:28,swTel:[1.0,0.75],swDur:[1.1,0.9],swDmg:20,swR:38,lanN:[3,4],rubTel:0.7,rubN:8,rubDmg:14,say2:['潰レロ','ォォォ!!'],
  p1:['sweep','pound','lantern','sweep','pound'],p2:['sweep2','rubble','pound','lantern','sweep2','rubble'],
  x1:['sweep','pound','ripple','lantern','sweep','pound'],x2:['sweep2','rubble','ripple','pound','lantern','sweep2','rubble','ripple']}};
// p1/p2 = story (普通): no shock wave on stage 1-2 (no 墨の波, no fire cross from the palm). x1/x2 = 難易度：極 (new attacks pillar / chase / ripple: js/extreme.js)
function updBoss2(b,dt,hands){const K=BT[b.bk],p2=b.phase>1,pi=p2?1:0;let P=bossT(b);
if(b.phase===1&&b.hp<b.mhp*0.5&&(b.st==='idle'||b.st==='hold')){b.phase=2;b.st='stag';b.stT=0;b.ah=-1;ev('roar',1);ev('say',K.say2[0],K.say2[1],1);ev('bphase',b.bk)}
for(let i=0;i<2;i++){if(b.ah===i||b.ah===2)continue;const r=restH(i?1:-1,0),h=hands[i],k=Math.min(1,dt*4);h.x+=(r.x-h.x)*k;h.y+=(r.y-h.y)*k;h.z+=(r.z-h.z)*k}
const idle=cd=>{b.st='idle';b.stT=0;b.cdT=cd;b.ah=-1},st=b.st;
if(st==='stag'){b.mouth=1;if(b.stT>1.8)idle(0.5)}
else if(st==='idle'){b.mouth=lerp(b.mouth,0,Math.min(1,dt*5));if(b.stT>b.cdT*K.cd*(G.ex?EXK.cd:1)){const pat=G.ex?(p2?K.x2:K.x1):(p2?K.p2:K.p1),m=pat[b.atk++%pat.length];b.ti=null;P=bossT(b);b.stT=0;b.k=0;b.vn=0;b.sm=false;
  if(m==='fist'||m==='palm'||m==='pound'){b.st='up';b.ah=(P.x<0?0:1)^(b.atk%3===0?1:0);const h=hands[b.ah];b.s0={x:h.x,y:h.y,z:h.z}}
  else if(m==='double'){b.st='up2';b.ah=2;b.s0=[{...b.hL},{...b.hR}];const q=allP().find(o=>o!==P),ax=clamp(P.x,-20,20),az=clamp(P.z,-11,20),bx=q?clamp(q.x,-20,20):clamp(ax+(ax<0?10:-10),-20,20),bz=q?clamp(q.z,-11,20):clamp(az+rnd(-4,4),-11,20);
   if(ax<bx){b.tx=ax;b.tz=az;b.p0=bx;b.p1=bz}else{b.tx=bx;b.tz=bz;b.p0=ax;b.p1=az}}
  else if(m==='volley'||m==='fireball')b.st='volley';else if(m==='summon')b.st='summon';
  else if(m==='wave'){b.st='wave';b.ah=2}
  else if(m==='breath'){b.st='breath';b.p0=Math.atan2(P.x,P.z+17)}
  else if(m==='spin'){b.st='spin';b.sd=-(b.sd||1);b.p0=b.sd}
  else if(m==='sweep'||m==='sweep2'){b.st='sweep';b.n=m==='sweep2'?2:1;b.p0=Math.random()<0.5?1:-1;b.ah=b.p0>0?0:1}
  else if(m==='lantern')b.st='lantern';
  else if(m==='pillar'||m==='chase'||m==='ripple'){b.st=m;b.ah=2}
  else{b.st='rubble';b.ah=P.x<0?0:1;const h=hands[b.ah];b.s0={x:h.x,y:h.y,z:h.z}}}}
else if(st==='pillar'||st==='chase'||st==='ripple'){if(exBoss(b,dt,hands,p2))idle(0.6)}
else if(st==='up'){const h=hands[b.ah],u=Math.min(1,b.stT/K.up[pi]);if(u<0.7){b.tx=clamp(P.x,-20,20);b.tz=clamp(P.z,-11,20)}const e=easeOut(u);h.x=lerp(b.s0.x,b.tx,e);h.z=lerp(b.s0.z,b.tz,e);h.y=lerp(b.s0.y,10,e)+Math.sin(u*PI)*3;if(u>=1){b.st='down';b.stT=0}}
else if(st==='down'){const h=hands[b.ah];h.y=lerp(10,1.1,Math.min(1,b.stT/0.13));if(b.stT>=0.13){h.y=1.1;b.st='hold';b.stT=0;if(b.bk==='aka')ev('pslam',r1(h.x),r1(h.z),b.atk%2);else ev('slam',r1(h.x),r1(h.z));areaHurt(h.x,h.z,4.3,K.slamDmg)}}
else if(st==='hold'){if(b.stT>K.hold[pi])idle(p2?0.5:1.0)}
else if(st==='up2'){const u=Math.min(1,b.stT/K.up2),e=easeOut(u),tg=[[b.tx,b.tz],[b.p0,b.p1]];for(let i=0;i<2;i++){const h=hands[i],s=b.s0[i];h.x=lerp(s.x,tg[i][0],e);h.z=lerp(s.z,tg[i][1],e);h.y=lerp(s.y,11,e)+Math.sin(u*PI)*3}if(u>=1){b.st='down2';b.stT=0}}
else if(st==='down2'){b.hL.y=b.hR.y=lerp(11,1.1,Math.min(1,b.stT/0.13));if(b.stT>=0.13){b.st='hold';b.stT=0;for(const h of hands){ev('slam',r1(h.x),r1(h.z));areaHurt(h.x,h.z,4.3,K.slamDmg)}}}
else if(st==='volley'){b.mouth=1;const fb=b.bk==='aka',n=(fb?K.ballN:K.volN)[pi],want=Math.floor((b.stT-0.4)/0.17);
 while(b.vn<=want&&b.vn<n){b.vn++;P=pickR();const ox=b.hx*2.7,oy=23.4,oz=-19.6,tx=clamp(P.x+rnd(-5,5),-20,20),tz=clamp(P.z+rnd(-5,5),-12,20),ft=1.5;
  shots.push({id:++eidN,k:fb?4:1,x:ox,y:oy,z:oz,vx:(tx-ox)/ft,vy:-oy/ft+8*ft,vz:(tz-oz)/ft,r:0.55,dmg:fb?K.ballDmg:16,g:16,life:9,tx,tz});fxStar(ox,oy,oz,3,fb?C.orange:C.white,0.08);if(lim('bo',0.3))sfxAt('ボッ',ox,oy+2,oz,{size:70,st:fb?'boom':'ink',life:0.4});snd('spawn')}
 if(b.stT>0.4+n*0.17+0.4)idle(p2?0.6:1.1)}
else if(st==='summon'){b.mouth=1;if(!b.sm&&b.stT>0.5){b.sm=true;ev('roar',0);const n=K.sumN[pi]+G.np-1;for(let i=0;i<n;i++)spawnNear(b.bk==='aka'?(i%2?'gun':'bom'):'imp');if(p2&&b.bk==='beta')spawnNear('lan');if(G.ex)spawnNear('crow')}if(b.stT>1.3)idle(1)}
else if(st==='wave'){const tel=K.waveTel,u=b.stT,n=K.waveN[pi];b.mouth=u<tel?0.6:1;for(let i=0;i<2;i++){const h=hands[i],k=Math.min(1,dt*(u<tel?5:30));h.x+=((i?6.5:-6.5)-h.x)*k;h.y+=((u<tel?15:1.1)-h.y)*k;h.z+=(-14.5-h.z)*k}
 if(!b.k&&u>=tel+0.1){b.k=1;ev('smash',-6.5,-14.5);ev('smash',6.5,-14.5);for(let i=0;i<n;i++)ev('lwave',r2(i*0.95))}if(u>tel+0.1+n*0.95+0.3)idle(0.6)}
else if(st==='breath'){b.mouth=1;if(!b.k&&b.stT>=K.brTel){b.k=1;ev('breath',r2(b.p0),K.brN[pi])}if(b.stT>K.brTel+1.3)idle(p2?0.5:0.9)}
else if(st==='spin'){b.mouth=1;if(!b.k){b.k=1;ev('spin',b.p0)}if(b.stT>K.spinTel+(3.2+K.spinGap)/K.spinW+0.2)idle(0.6)}
else if(st==='sweep'){const tel=K.swTel[pi],dur=K.swDur[pi],per=tel+dur+0.35,i=Math.min(b.n-1,Math.floor(b.stT/per)),q=b.stT-i*per,dir=b.p0*(i%2?-1:1),h=hands[b.ah],a0=-dir*1.3;let a=a0,y=3.2+Math.sin(b.t*30)*0.15;
 if(q>=tel){if(b.k<=i){b.k=i+1;ev('sweep',dir,dur)}a=lerp(a0,-a0,sat((q-tel)/dur));y=1.5}
 const k=Math.min(1,dt*(q<tel?4:40));h.x+=(Math.sin(a)*K.swR-h.x)*k;h.y+=(y-h.y)*k;h.z+=(-26+Math.cos(a)*K.swR-h.z)*k;if(b.stT>b.n*per+0.3)idle(p2?0.5:0.9)}
else if(st==='lantern'){b.mouth=0.5;const n=K.lanN[pi]+(G.np>2?1:0),want=Math.floor((b.stT-0.5)/0.3);
 while(b.vn<=want&&b.vn<n){b.vn++;P=pickR();const ox=9.6,oy=4.5,oz=-18.5,a=rnd(0,TAU),tx=clamp(P.x+Math.sin(a)*rnd(6,10),-19,19),tz=clamp(P.z+Math.cos(a)*rnd(6,10),-10,19),ft=1.4;
  shots.push({id:++eidN,k:6,x:ox,y:oy,z:oz,vx:(tx-ox)/ft,vy:(3.4-oy)/ft+8*ft,vz:(tz-oz)/ft,r:0.6,dmg:0,g:16,life:9,tx,tz});if(lim('bo',0.3))sfxAt('ブンッ',ox,oy+2,oz,{size:60,st:'fire',life:0.4});snd('whoosh')}
 if(b.stT>0.5+n*0.3+0.5)idle(0.8)}
else if(st==='rubble'){const h=hands[b.ah],s=b.ah?1:-1,tel=K.rubTel,u=b.stT;
 if(u<tel){const e=easeOut(u/tel);h.x=lerp(b.s0.x,s*20,e);h.z=lerp(b.s0.z,-23,e);h.y=lerp(b.s0.y,13,e)+Math.sin(u/tel*PI)*3}
 else{h.y=Math.max(7,h.y-dt*60);if(!b.k){b.k=1;ev('rslam',s*20,-23)}const want=Math.floor((u-tel-0.2)/0.22);
  while(b.vn<=want&&b.vn<K.rubN){const aim=b.vn%2===0;b.vn++;P=pickR();const tx=aim?clamp(P.x+rnd(-2.5,2.5),-20,20):rnd(-19,19),tz=aim?clamp(P.z+rnd(-2.5,2.5),-12,20):rnd(-10,19);
   shots.push({id:++eidN,k:5,x:tx,y:rnd(24,30),z:tz,vx:0,vy:-2,vz:0,r:0.9,dmg:K.rubDmg,g:16,life:9,tx,tz})}
  if(u>tel+0.2+K.rubN*0.22+0.6)idle(0.6)}}}
// ---------------- FX events (host runs + broadcasts, clients replay; the hazards they start are checked by every peer for its own player) ----------------
Object.assign(FXE,{
bphase(bk){const b=boss;flash(0.5);if(bk==='beta'){if(b)for(const h of[b.hL,b.hR]){fxDebris(h.x,h.y+1,h.z-4,12,9,C.gold,0.5);fxStar(h.x,h.y+1,h.z-4,5,C.white,0.12)}snd('clank');addText('バキィッ！',W/2,H*0.3,{size:120,st:'boom',life:0.9})}
 else if(bk==='aka'){for(let i=0;i<4;i++)explode(rnd(-5,5),rnd(27,33),-22,2.2,{quiet:1});addText('ゴォォォ！',W/2,H*0.3,{size:120,st:'boom',life:0.9})}
 else{fxStar(0,29,-19,9,C.red,0.2);fxRing(0,0.2,-14,30,C.red,0.6);snd('heart');addText('ドクン…',W/2,H*0.3,{size:110,st:'hurt',life:0.9})}},
pslam(x,z,rot){explode(x,0.8,z,2.2,{text:'バァァン！'});fxRing(x,0.1,z,11,C.orange,0.4);decals.push({x,z,r:5,life:7});if(!G.ex)return;// 普通: no fire cross (the stage-2 boss makes no wave)
const K=BT.aka,a0=rot?PI/4:0;
 for(let j=0;j<4;j++){const a=a0+j*PI/2;for(let i=1;i<=K.crossN;i++)addFire(x+Math.sin(a)*(1.8+i*3.4),z+Math.cos(a)*(1.8+i*3.4),1.9,K.crossLife,0.25+i*0.14)}},
breath(a0,n){snd('roar',0.6);sfxAt('ゴォォォ',0,22,-19,{size:90,st:'boom',life:0.9});shake(0.4);for(let j=0;j<n;j++){const a=a0+(j-(n-1)/2)*0.42;for(let i=0;i<10;i++){const d=6+i*3.6;addFire(Math.sin(a)*d,-17+Math.cos(a)*d,2.0,BT.aka.brLife,i*0.06)}}},
spin(dir){spins.push({dir,t:-BT.aka.spinTel});snd('charge');addText('メラメラ',W/2,H*0.26,{size:90,st:'boom',life:0.9})},
lwave(dl){lwaves.push({z:-13,dl,hit:false});if(!dl){snd('roar',0.5);addText('ザザァ…',W/2,H*0.28,{size:100,st:'ink',life:0.9})}},
sweep(dir,dur){sweeps.push({dir,t:0,dur,hit:false});snd('whoosh');snd('boom',0.5);lines(0.6,'#c20020');shake(0.4);addText('ブォン！',W/2,H*0.3,{size:110,st:'boom',life:0.5})},
rslam(x,z){explode(x,8,z,2.6,{text:'ガラガラ'});fxDebris(x,9,z,16,10,C.troof,0.5);shake(0.8);snd('boom',1)},
rubble(x,z){explode(x,0.6,z,1.3,{quiet:1});fxDebris(x,0.5,z,8,7,C.troof,0.4);decals.push({x,z,r:2.4,life:5});sfxAt('ガシャ！',x,2.4,z,{size:54,st:'boom',life:0.4})},
lanpop(x,y,z){fxStar(x,y,z,2.4,C.yellow,0.12);fxSmoke(x,y,z,4,0.8,C.smoke,2);snd('spawn');sfxAt('ボワッ',x,y+1,z,{size:48,st:'fire',life:0.4})}});
// ---------------- drawing ----------------
// hand (inside the hand's matrix: +z = away from the shoulder). beta: fist + shackle (gone in phase 2) / aka: open palm / nyudo: big copper hand
function bkHand(b,s){const p2=b.phase>1,bk=b.bk;
if(bk==='beta'){sph(0,0,0,4.0,3.3,4.0,BI,0,.8,0,1);for(let i=0;i<4;i++)sph(-1.2+i*0.8,0.9,1.5,1.0,1.0,1.1,C.ink,0,.6);sph(-s*1.7,-0.2,0.9,1.3,1.2,1.6,C.ink,0,.6);
 if(!p2){put(CYL,0,0.2,-2.6,PI/2,0,0,5.0,1.5,5.0,C.stoneD,0,.8);put(CYL,0,0.2,-2.6,PI/2,0,0,5.3,0.5,5.3,C.gold,0,.8);for(let i=0;i<3;i++)put(BOX,0,-2.4-i*0.9,-2.6,0,i*0.8,0,0.9,0.7,0.5,C.stoneD)}
 else{put(BOX,0.6,1.6,0.4,0,0.5,0,0.16,0.16,2.4,C.white,0,0,F_UNLIT);put(BOX,-0.8,1.5,-0.3,0,-0.7,0,0.16,0.16,1.8,C.white,0,0,F_UNLIT)}}
else if(bk==='aka'){sph(0,0,0,4.6,1.5,4.4,BI,0,.8,0,1);sph(0,-0.5,0.1,3.6,0.7,3.4,p2?C.yellow:C.crim,0,0,p2?F_UNLIT:0);
 for(let i=0;i<4;i++){const a=(i-1.5)*0.24;put(CYL,Math.sin(a)*2.9,0,1.4+Math.cos(a)*1.9,PI/2,a,0,1.0,2.6,1.0,BI,0,.6)}put(CYL,-s*2.5,0,0.6,PI/2,-s*1.0,0,1.0,2.0,1.0,BI,0,.6)}
else{const fist=b.st==='up'||b.st==='down'||b.st==='hold'||b.st==='rubble';sph(0,0,0,fist?4.2:4.6,fist?3.2:2.2,4.2,C.copper,0,.6,0,1);
 if(fist)for(let i=0;i<4;i++)sph(-1.3+i*0.87,0.8,1.6,1.1,1.1,1.2,C.copperD,0,.5);else for(let i=0;i<4;i++){const a=(i-1.5)*0.22;put(CYL,Math.sin(a)*3.0,0,1.6+Math.cos(a)*2.0,PI/2,a,0,1.1,2.8,1.1,C.copper,0,.5)}
 put(CYL,-s*2.4,0,0.7,PI/2,-s*0.9,0,1.1,2.0,1.1,C.copper,0,.5);put(CYL,0,0.1,-2.4,PI/2,0,0,4.6,1.2,4.6,C.kimD)}}
// 三つ巴 (three commas chasing each other), facing +z in the current matrix
function tomoe(x,y,z,R,c,rot,fl){for(let i=0;i<3;i++){const a=rot+i*TAU/3;sph(x+Math.cos(a)*R*0.5,y+Math.sin(a)*R*0.5,z,R*0.5,R*0.5,R*0.16,c,0,0,fl);sph(x+Math.cos(a-0.62)*R*0.66,y+Math.sin(a-0.62)*R*0.66,z,R*0.3,R*0.3,R*0.13,c,0,0,fl);sph(x+Math.cos(a-1.1)*R*0.74,y+Math.sin(a-1.1)*R*0.74,z,R*0.17,R*0.17,R*0.1,c,0,0,fl)}}
// extras on the old demon-king head (inside the head matrix)
function bkHead(b,p2){if(b.bk==='aka'){const n=p2?7:5;for(let i=0;i<n;i++){const o=i-(n-1)/2;put(CONE,o*0.85,2.7-Math.abs(o)*0.3+(p2?0.6:0),-0.9,-0.6,0,-o*0.22,p2?1.5:1.2,p2?4.4:3.0,p2?1.5:1.2,i%2?C.orange:C.yellow,0,0,F_UNLIT|F_FLAME)}}
else if(p2){put(BOX,-1.7,0.9,2.2,0,0,0.5,0.12,1.9,0.3,C.white,0,0,F_UNLIT);put(BOX,1.9,-0.4,2.0,0,0,-0.4,0.12,1.5,0.3,C.white,0,0,F_UNLIT)}}
// extras on the body (inside the body matrix): beta = the seal's 三つ巴 on his chest, cracks in phase 2 / aka = flames on the shoulders, glowing cracks in phase 2
function bkBody(b,p2){const t=b.t;
if(b.bk==='beta'){put(CYL,b.hx,7.1,3.2,PI/2,0,0,3.9,0.3,3.9,C.gold,0,.8);put(CYL,b.hx,7.1,3.32,PI/2,0,0,3.3,0.3,3.3,C.paper);tomoe(b.hx,7.1,3.5,1.5,p2?C.red:C.inkD,-t*(p2?2.4:0.8),p2?F_UNLIT:0);
 if(p2)for(const[x,y,r,l]of[[-2.6,8.6,0.6,2.2],[2.4,5.6,-0.5,2.6],[-2.2,5.0,-0.9,1.8],[2.8,8.8,1.0,1.6]])put(BOX,x+b.hx,y,3.25,0,0,r,0.14,l,0.3,C.white,0,0,F_UNLIT)}
else{for(const d of[-1,1])for(let i=0;i<2;i++)put(CONE,d*(4.4+i*1.1)+b.hx,12.2-i*0.5,0.2,0,i,-d*0.25,1.6,p2?3.6:2.4,1.6,i?C.yellow:C.orange,0,0,F_UNLIT|F_FLAME);
 if(p2)for(const[x,y,r,l]of[[-2.6,8.2,0.6,2.2],[2.4,5.6,-0.5,2.6],[-2.0,4.8,-0.9,1.8],[0.4,7.0,0.2,2.0]])put(BOX,x+b.hx,y,3.3,0,0,r,0.16,l,0.3,C.orange,0,0,F_UNLIT)}}
// ground telegraphs of the new attacks (world space)
function bkTele(b){const NF=F_UNLIT|F_NOCAST,K=BT[b.bk],pi=b.phase>1?1:0,t=b.t,st=b.st;
const ring=(x,z)=>{const s=6+Math.sin(t*20)*0.8;put(RING,x,0.12,z,0,0,0,s,1,s,C.red,0,0,NF);put(RING,x,0.12,z,0,0,0,s*0.5,1,s*0.5,C.red,0,0,NF)};
if(st==='up'&&b.bk==='nyudo')ring(b.tx,b.tz);
else if(st==='up2'){ring(b.tx,b.tz);ring(b.p0,b.p1)}
else if(st==='wave'&&b.stT<K.waveTel+0.1){if(Math.sin(t*22)>-0.2){box(0,0.11,-11,BX*2,0.02,2.2,C.red,0,0,NF);for(let i=0;i<5;i++)put(PYR,(i-2)*8,0.14,-6.5,PI/2,0,0,2.4,0.8,1.5,C.red,0,0,NF)}}
else if(st==='breath'){const n=K.brN[pi];
 if(b.stT<K.brTel){if(Math.sin(t*(b.stT>K.brTel-0.3?40:16))>-0.3)for(let j=0;j<n;j++){const a=b.p0+(j-(n-1)/2)*0.42;mPush();mT(Math.sin(a)*24,0.12,-17+Math.cos(a)*24);mRY(a);mS(3.4,0.02,38);emit(BOX,C.red,0,0,NF,0);mPop()}}
 else if(b.stT<K.brTel+0.8){const mx=b.hx*2.7,my=23.4+b.yo,mz=-19.6;for(let j=0;j<n;j++){const a=b.p0+(j-(n-1)/2)*0.42,gx=Math.sin(a)*7,gz=-17+Math.cos(a)*7;for(let i=1;i<7;i++){const u=i/7;bill(BURST,lerp(mx,gx,u),lerp(my,0.8,u),lerp(mz,gz,u),2.2+u*2.4,t*9+i,i%2?C.orange:C.yellow,NF)}}}}
else if(st==='sweep'){const tel=K.swTel[pi],per=tel+K.swDur[pi]+0.35,i=Math.min((b.n||1)-1,Math.floor(b.stT/per)),q=b.stT-i*per,dir=b.p0*(i%2?-1:1);
 if(q<tel&&Math.sin(t*(q>tel-0.3?40:14))>-0.3)for(let j=0;j<9;j++){const a=-1.2+j*0.3;for(const R of[18,28,38]){const x=Math.sin(a)*R,z=-26+Math.cos(a)*R;if(Math.abs(x)>BX||z>BZ1||z<BZ0)continue;put(PYR,x,0.14,z,PI/2,a+dir*PI/2,0,1.8,0.8,1.2,C.red,0,0,NF)}}}}
// 大入道: a bald giant, copper skin, orange kimono, a big lantern at his waist, the ink 三つ巴 on his forehead (= the weak point, where the old boss has its third eye)
function drawNyudo(b){const yo=b.yo,t=b.t,p2=b.phase>1,eye=p2?C.red:C.yellow,sk=C.copper,skD=C.copperD,fl=b.flash>0?0.45:0;gTint=fl;
put(CYL,0,0.1,-21.5,0,0,0,27,0.1,13,C.inkD,0,0,F_NOCAST);for(let i=0;i<6;i++){const a=i*1.05+t*0.3;sph(Math.cos(a)*11.5,0.1,-21.5+Math.sin(a)*5.5,2.2+Math.sin(t*2+i)*0.6,0.9,2.2,C.inkD)}
mPush();mT(0,yo,-27);mS(2.1,2.1,2.1);gId=nid();sph(0,4.2,0,11,10,8,C.kim,0,.3,0,1);sph(b.hx,8.6,0.2,9.5,6.5,6.5,C.kim,0,.3,0,1);sph(-4.4+b.hx,9.8,0.3,4.4,3.8,4.2,C.kim,0,.3,0,1);sph(4.4+b.hx,9.8,0.3,4.4,3.8,4.2,C.kim,0,.3,0,1);gId=0;
sph(b.hx,8.9,1.5,4.4,4.6,4.4,sk,0,.5);for(const d of[-1,1])put(BOX,d*1.9+b.hx,8.6,3.0,0,0,d*0.42,1.0,5.6,1.2,C.inkD);
put(CYL,0,5.0,0,0,0,0,11.4,1.5,8.4,C.inkD);sph(0,5.0,3.9,2.0,1.6,1.0,C.gold);
mPush();mT(4.6,4.6,3.6);mRZ(Math.sin(t*1.6)*0.12);cyl(0,-0.2,0,0.2,1.4,0.2,C.black);cyl(0,-1.0,0,1.5,0.3,1.5,C.black);sph(0,-2.5,0,2.9,3.0,2.9,C.lant,6,0,F_UNLIT);cyl(0,-4.0,0,1.5,0.3,1.5,C.black);mPop();
cyl(b.hx,11.0,0.4,3.2,1.6,3.2,skD);
mPush();mT(b.hx*1.3,12.4+Math.sin(t*1.3)*0.15,0.8);mRX(0.12+(b.st==='stag'?-0.35:0));
gId=nid();sph(0,0,0,5.2,5.4,5.0,sk,0,.9,0,1);sph(0,-1.4,0.5,4.4,3.0,4.2,sk,0,.6,0,1);gId=0;
for(const d of[-1,1]){sph(d*2.6,-0.1,-0.1,1.0,1.9,1.1,skD);sph(d*2.65,-0.95,0,0.5,0.9,0.5,C.gold);put(SPH,d*1.05,0.0,2.35,0,0,d*0.25,1.2,0.5,0.4,C.white);sph(d*1.05,0.0,2.52,0.42,0.42,0.2,eye,0,0,F_UNLIT);put(BOX,d*1.1,0.62,2.3,0,0,d*0.45,1.9,0.42,0.5,C.inkD);put(BOX,d*1.3,2.0,1.6,0,0,d*0.2,1.6,0.12,0.4,skD)}
sph(0,-0.75,2.5,1.2,1.0,1.0,skD);const mo=0.3+b.mouth*0.9;box(0,-1.95-mo*0.3,2.2,2.6,mo,0.6,C.inkD);for(let i=0;i<5;i++){box(-0.9+i*0.45,-1.72,2.48,0.36,0.34,0.2,C.white);if(mo>0.6)box(-0.9+i*0.45,-2.05-mo*0.55,2.44,0.36,0.3,0.2,C.white)}
put(CYL,0,1.35,2.2,PI/2-0.25,0,0,2.3,0.5,2.3,C.paper);tomoe(0,1.35,2.5,1.05,p2?C.red:C.inkD,-t*(p2?3:1.2),p2?F_UNLIT:0);
mPop();mPop();
const bi=BI;BI=C.copper;gTint=fl;drawBossArm(b,-1);drawBossArm(b,1);BI=bi;gTint=0;bkTele(b)}
