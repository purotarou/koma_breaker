'use strict';
// ================= 難易度：極 (extreme) =================
// Opens once all five stages are cleared (SKS.clr, or the developer 超強化). Chosen on the stage select (solo) or by the host in the
// co-op lobby (net.ex, sent in the lobby / go messages); G.ex is set for one game in beginGame. Never in versus or the demo.
// What changes (numbers in EXK, players.js): enemy and boss HP, damage to the player, speed, shorter pauses between attacks,
// more small enemies, a new enemy 墨鴉 (crow) in every group and in boss summons, the stage 1-2 shock waves come back,
// and every boss gets a new attack:
//   1 ベタグロ   墨柱   (pillar) both fists hit the ground and three lines of ink pillars run out toward you: step out of the line
//   2 アカベタ   追い火柱 (chase) fire pillars burst under each target one after another: keep moving
//   3 大入道     岩の波紋 (ripple) rings of rock spikes spread from his fists, each ring with gaps: stand in a gap or dash through
//   4 鐘の僧     鐘の残響 (exMonk) every few seconds ice spikes burst under every player and around them
//   5 (代役魔王) 墨の段波 (rows) rows of ink pillars sweep down the yard; each row has a gap that drifts
// The pillars are one hazard list (erupts): a red ring warns, then the pillar bursts once (no jumping over it).
// The host sends one event per pattern (ev), every peer builds the same pillars and checks only its own player.
let exSel=0;try{exSel=(+localStorage.getItem('koma_ex'))?1:0}catch(e){}
const exOpen=()=>!!DEV||skClr()>=5;
function exSet(v){exSel=v?1:0;try{localStorage.setItem('koma_ex',String(exSel))}catch(e){}}
// ---- tuning ----
// erupt kinds: 0 ink / 1 fire / 2 rock / 3 ice. r = radius, dmg = damage (×difOf dmg in hurtPlayer)
const EXE=[{r:1.5,dmg:18},{r:2.1,dmg:16},{r:1.5,dmg:20},{r:1.7,dmg:15}];
FT.crow={hp:55,spd:7,orbit:9,high:5.5,range:16,cd:[2.2,3.6],wind:0.75,dive:19,dmg:11};
const erupts=[];
function addErupt(x,z,c,dl){if(Math.abs(x)>BX+0.5||z>BZ1+0.5||z<BZ0-0.5)return;if(erupts.length>220)erupts.shift();erupts.push({x,z,c,t:-dl,hit:false,s:rnd(0,9)})}
// more enemies in every group: crows (2 from stage 3 on)
function exGroup(){const n=G.stage>=2?2:1;for(let i=0;i<n;i++)spawnNear('crow')}
function exTick(dt,live){for(let i=erupts.length-1;i>=0;i--){const e=erupts[i],t0=e.t;e.t+=dt;
 if(t0<0&&e.t>=0){const K=EXE[e.c],col=[C.ink,C.orange,C.stone,C.ice][e.c];fxBlobs(e.x,1,e.z,4,7,e.c===1?C.orange:col,0.2);if(e.c===2||e.c===3)fxDebris(e.x,1,e.z,4,7,col,0.3);if(lim('erS',0.09))snd('boom',0.35);
  if(live&&!e.hit&&pl.y<2.4&&Math.hypot(pl.x-e.x,pl.z-e.z)<K.r+0.35){e.hit=true;hurtPlayer(K.dmg,e.x,e.z)}}
 if(e.t>0.6)erupts.splice(i,1)}}
function exDraw(){const NF=F_UNLIT|F_NOCAST;for(const e of erupts){const K=EXE[e.c],r=K.r;
 if(e.t<0){const u=sat(1+e.t/0.9);if(Math.sin(now*26+e.s)>-0.2)put(RING,e.x,0.12,e.z,0,0,0,r*2,1,r*2,C.red,0,0,NF);put(CYL,e.x,0.09,e.z,0,0,0,r*2*u,0.02,r*2*u,C.redD,0,0,NF|F_NOEDGE);continue}
 const k=e.t<0.12?easeOut(e.t/0.12):1-sat((e.t-0.4)/0.2),h=4.2*k;if(h<0.05)continue;
 if(e.c===1){for(let i=0;i<4;i++){const a=e.s+i*1.57,q=i?0.45:0;put(CONE,e.x+Math.cos(a)*r*q,h*0.5,e.z+Math.sin(a)*r*q,0,a,0,r*(i?0.7:1),h*(i?0.7:1),r*(i?0.7:1),i%2?C.orange:C.yellow,0,0,NF|F_FLAME)}continue}
 const col=e.c===0?BI:e.c===2?C.stone:C.ice;put(CONE,e.x,h*0.5,e.z,0,e.s,0,r*1.3,h,r*1.3,col,0,e.c===3?1:.6);
 for(let i=0;i<3;i++){const a=e.s+i*2.1;put(CONE,e.x+Math.cos(a)*r*0.8,h*0.25,e.z+Math.sin(a)*r*0.8,Math.sin(a)*0.4,0,-Math.cos(a)*0.4,r*0.6,h*0.5,r*0.6,col,0,.6)}
 if(e.c===0)sph(e.x,h,e.z,0.5,0.5,0.5,C.white,0,0,NF)}}
// ---- boss attacks (host; return true when finished) ----
function exBoss(b,dt,hands,p2){const u=b.stT,st=b.st;
 if(st==='pillar'){const tel=0.8;b.mouth=u<tel?0.6:1;for(let i=0;i<2;i++){const h=hands[i],k=Math.min(1,dt*(u<tel?5:30));h.x+=((i?5.5:-5.5)-h.x)*k;h.y+=((u<tel?14:1.1)-h.y)*k;h.z+=(-14-h.z)*k}
  if(!b.k&&u>=tel){b.k=1;const P=pickR();ev('smash',-5.5,-14);ev('smash',5.5,-14);ev('epil',r2(Math.atan2(P.x,P.z+12)),p2?5:3)}return u>tel+2.4}
 if(st==='chase'){b.mouth=1;const n=p2?9:6,want=Math.floor((u-0.5)/0.42);while(b.vn<=want&&b.vn<n){b.vn++;for(const P of allP())if(!P.dead)ev('e1',r1(P.x+(P.vx||0)*0.3),r1(P.z+(P.vz||0)*0.3),1,0.8)}return u>0.5+n*0.42+1.0}
 if(st==='ripple'){const tel=0.9;b.mouth=u<tel?0.5:1;for(let i=0;i<2;i++){const h=hands[i],k=Math.min(1,dt*(u<tel?5:30));h.x+=((i?3.5:-3.5)-h.x)*k;h.y+=((u<tel?15:1.1)-h.y)*k;h.z+=(-12-h.z)*k}
  if(!b.k&&u>=tel){b.k=1;ev('slam',0,-12);ev('erip',p2?4:3,r2(rnd(0,1)))}return u>tel+3}
 return true}
// stage 5 stand-in demon king (entities.js updBoss)
function exRows(b,dt,hands){const u=b.stT,tel=1.0;b.mouth=1;for(let i=0;i<2;i++){const h=hands[i],k=Math.min(1,dt*(u<tel?4:30));h.x+=((i?9:-9)-h.x)*k;h.y+=((u<tel?16:1.1)-h.y)*k;h.z+=(-13-h.z)*k}
 if(!b.k&&u>=tel){b.k=1;ev('smash',-9,-13);ev('smash',9,-13);let g=rnd(-12,12);const gaps=[];for(let i=0;i<9;i++){gaps.push(r1(g));g=clamp(g+rnd(-6,6),-15,15)}ev('erow',gaps)}
 return u>tel+5.4}
// stage 4 鐘の僧: an extra attack on a timer, on top of his own moves
function exMonk(b,dt){if(b.st==='drop'||b.st==='trans'||b.st==='die'||(typeof monkCine==='function'&&monkCine()))return;b.exT=(b.exT==null?6:b.exT)-dt;if(b.exT>0)return;b.exT=rnd(6.5,8.5)-(b.phase>1?1.5:0);
 ev('exring',r1(b.x),r1(b.z));for(const P of allP())if(!P.dead){ev('e1',r1(P.x),r1(P.z),3,0.9);for(let i=0;i<3;i++){const a=rnd(0,TAU),d=rnd(3,5.5);ev('e1',r1(P.x+Math.sin(a)*d),r1(P.z+Math.cos(a)*d),3,1.1+i*0.15)}}}
Object.assign(FXE,{
e1(x,z,c,dl){addErupt(x,z,c,dl)},
epil(a0,nl){snd('roar',0.5);addText('ズズズ…',W/2,H*0.28,{size:96,st:'ink',life:0.8});for(let j=0;j<nl;j++){const a=a0+(j-(nl-1)/2)*0.32;for(let i=0;i<14;i++){const d=4+i*2.7;addErupt(Math.sin(a)*d,-12+Math.cos(a)*d,0,0.75+i*0.09)}}},
erip(n,o){addText('ゴゴゴッ',W/2,H*0.28,{size:96,st:'boom',life:0.8});for(let k=0;k<n;k++){const R=6+k*6,m=Math.max(8,Math.round(PI*R/3.2));for(let i=0;i<=m;i++){if((i+k*2+Math.round(o*4))%4===0)continue;const a=-PI/2+PI*i/m;addErupt(Math.sin(a)*R,-12+Math.cos(a)*R,2,0.6+k*0.5)}}},
erow(gaps){snd('roar',0.7);addText('墨ノ段波！',W/2,H*0.26,{size:96,st:'ink',life:1});gaps.forEach((g,r)=>{const z=-11+r*3.9;for(let x=-BX+1.5;x<=BX-1.5;x+=3.1)if(Math.abs(x-g)>3.3)addErupt(x,z,0,0.9+r*0.42)})},
exring(x,z){snd('gong');fxRing(x,0.2,z,16,C.cyan,0.5);sfxAt('リィィン…',x,6,z,{size:80,st:'cyan',life:0.8})}});
// ---- 墨鴉 (crow): circles high over you, warns with a red ring, then dives through it: step aside ----
FOE.crow={sc:220,g:9,
 init(e){e.hp=FT.crow.hp;e.r=0.6;e.y=FT.crow.high;e.cd=rnd(1.5,3);e.oa=Math.atan2(e.x-T.x,e.z-T.z);e.dir=Math.random()<.5?-1:1;e.tx=e.x;e.tz=e.z},
 upd(e,dt,T,dx,dz,d,wy){const K=FT.crow;
  if(e.st==='chase'){e.oa+=dt*e.dir*K.spd/K.orbit;if(Math.random()<dt*0.2)e.dir=-e.dir;const ox=T.x+Math.sin(e.oa)*K.orbit-e.x,oz=T.z+Math.cos(e.oa)*K.orbit-e.z,ol=Math.hypot(ox,oz)||1,sp=Math.min(K.spd,ol*2);
   e.x+=ox/ol*sp*dt;e.z+=oz/ol*sp*dt;e.y+=(K.high+Math.sin(e.t*2+e.seed)*0.5-e.y)*Math.min(1,dt*2);e.yaw+=angDiff(Math.atan2(ox,oz),e.yaw)*Math.min(1,dt*6);
   e.cd-=dt;if(e.cd<=0&&d<K.range){e.st='wind';e.stT=0;e.tx=T.x+(T.vx||0)*0.3;e.tz=T.z+(T.vz||0)*0.3;ev('txt','カァッ',r1(e.x),r1(e.y+1.4),r1(e.z),50,'ink')}}
  else if(e.st==='wind'){e.yaw+=angDiff(Math.atan2(e.tx-e.x,e.tz-e.z),e.yaw)*Math.min(1,dt*10);e.y+=(K.high+1-e.y)*Math.min(1,dt*3);
   if(e.stT>K.wind){e.st='dive';e.stT=0;const vx=e.tx-e.x,vy=1.0-e.y,vz=e.tz-e.z,l=Math.hypot(vx,vy,vz)||1;e.lx=vx/l;e.ly=vy/l;e.lz=vz/l;e.dT=l/K.dive+0.3;e.hd=false}}
  else if(e.st==='dive'){e.x+=e.lx*K.dive*dt;e.z+=e.lz*K.dive*dt;e.y=Math.max(0.9,e.y+e.ly*K.dive*dt);
   if(!e.hd&&Math.hypot(T.x-e.x,T.z-e.z)<1.35&&Math.abs((T.y||0)+1-e.y)<1.5){e.hd=true;hurtT(T,K.dmg,e.x,e.z)}if(e.stT>e.dT){e.st='rise';e.stT=0}}
  else if(e.st==='rise'){e.y+=(K.high-e.y)*Math.min(1,dt*2.5);if(e.stT>1.0){e.st='chase';e.cd=rnd(K.cd[0],K.cd[1])}}
  else if(e.stT>0.6)e.st='chase'},
 sph(e){const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw);return[[e.x,e.y,e.z,0.8,1],[e.x+fx*0.6,e.y+0.2,e.z+fz*0.6,0.38,2]]},
 ctr(e){return[e.x,e.y,e.z,1.0]},
 die(e){foeDie(e,C.ink,'ギャアッ',8)},
 draw(e){const k=foeK(e),st=e.st,hot=st==='wind'||st==='dive',fl=st==='dive'?0:Math.sin(e.t*(st==='wind'?24:11));
  mPush();mT(e.x,e.y,e.z);mRY(e.yaw);mRX(st==='dive'?0.45:st==='wind'?-0.25:0);mS(k,k,k);gTint=e.flash>0?1:0;
  sph(0,0,0,0.72,0.62,1.2,C.ink,0,1,0,1);sph(0,0.2,0.62,0.46,0.44,0.48,C.ink,0,1,0,1);put(CONE,0,0.12,1.04,PI/2,0,0,0.16,0.44,0.12,C.gold);
  sph(0,0.42,0.88,0.09,0.12,0.06,hot?C.red:C.yellow,0,0,F_UNLIT);
  for(const s of[-1,1]){sph(s*0.2,0.28,0.86,0.11,0.1,0.07,hot?C.red:C.yellow,0,0,F_UNLIT);
   mPush();mT(s*0.42,0.12,0);mRZ(s*(st==='dive'?-1.0:fl*0.8));box(s*0.72,0,0,1.45,0.07,0.78,C.inkD);put(BOX,s*1.42,-0.02,-0.15,0,s*0.35,0,0.55,0.06,0.6,C.inkD);mPop();
   put(CONE,s*0.18,-0.45,0.1,PI,0,0,0.08,0.3,0.08,C.gold)}
  put(BOX,0,0.02,-0.98,-0.2,0,0,0.55,0.07,0.65,C.inkD);gTint=0;mPop();
  if(st==='wind'&&Math.sin(e.t*30)>-0.3){put(RING,e.tx,0.12,e.tz,0,0,0,2.7,1,2.7,C.red,0,0,F_UNLIT|F_NOCAST);const dx=e.tx-e.x,dz=e.tz-e.z,L=Math.hypot(dx,dz);if(L>1){mPush();mT((e.x+e.tx)/2,0.12,(e.z+e.tz)/2);mRY(Math.atan2(dx,dz));mS(0.5,0.02,L);emit(BOX,C.red,0,0,F_UNLIT|F_NOCAST,0);mPop()}}}};
