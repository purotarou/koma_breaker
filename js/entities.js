'use strict';
// ================= ENTITIES =================
const pl={x:0,z:16,yaw:0,pitch:0,vx:0,vz:0,hp:100,gauge:0};
const inp={mx:0,mz:0,lx:0,ly:0,fire:false,dash:false,special:false,reload:false};
const enemies=[],shots=[];
const G={state:'title',demoOn:false,idle:0,t:0,wave:-1,waveT:0,grp:0,clearT:-1,kills:0,score:0,combo:0,comboT:0,time:0,dmg:0,resT:0,cine:0,mood:0,banner:null,bannerT:9,intro:9,endT:-1,comboPop:0};
let boss=null,hitMark=0,hitCrit=false,cutSp=0,cutBoss=0,touchMode=false,RDT=0;const muz=[0,0,0];
const aimDir=()=>{const cp=Math.cos(pl.pitch);return[-Math.sin(pl.yaw)*cp,Math.sin(pl.pitch),-Math.cos(pl.yaw)*cp]};
function raySph(ox,oy,oz,d,cx,cy,cz,r){const px=cx-ox,py=cy-oy,pz=cz-oz,t=px*d[0]+py*d[1]+pz*d[2];if(t<0)return-1;const d2=px*px+py*py+pz*pz-t*t;if(d2>r*r)return-1;return Math.max(0.01,t-Math.sqrt(r*r-d2))}
function startReload(){if(pl.reload>0||pl.ammo>=16)return;pl.reload=1.0;snd('reload');addText(pl.ammo===0?'カチッ':'ガシャッ',W*0.72,H*0.62,{size:50,st:'cyan',life:0.4})}
function spheres(e){const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw);
if(e.type==='imp')return[[e.x,e.y+0.62*e.sc,e.z,0.68*e.sc,1]];
if(e.type==='lan')return[[e.x,e.y,e.z,0.75,1],[e.x+fx*0.4,e.y+0.08,e.z+fz*0.4,0.3,2]];
if(e.type==='bru')return[[e.x,1.0,e.z,0.95,1],[e.x,2.0,e.z,1.1,1],[e.x+fx*0.2,3.0,e.z+fz*0.2,0.55,2]];
const yo=e.yo;return[[e.hx*2.7,28.2+yo,-19.4,2.2,2.5],[e.hx*2.7,26+yo,-25.3,5.6,1],[0,13+yo,-27,10,0.6],[e.hL.x,e.hL.y,e.hL.z,2.2,1],[e.hR.x,e.hR.y,e.hR.z,2.2,1]]}
function updateEnemies(dt){for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(e.dead){enemies.splice(i,1);if(e===boss)boss=null;continue}
T=pickT(e.x,e.z);e.t+=dt;e.stT+=dt;e.flash-=dt;if(e.type==='boss'){updBoss(e,dt);continue}
if(e.st==='spawn'){if(e.stT>0.7){e.st='chase';e.stT=0}continue}
e.x+=e.kx*dt;e.z+=e.kz*dt;const f=Math.exp(-8*dt);e.kx*=f;e.kz*=f;
const dx=T.x-e.x,dz=T.z-e.z,d=Math.hypot(dx,dz)||1,wy=Math.atan2(dx,dz);
if(e.type==='imp'){
 if(e.st==='chase'){e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*8);const wob=Math.sin(e.t*2.3+e.seed)*0.6;let mx=dx/d-dz/d*wob*0.5,mz=dz/d+dx/d*wob*0.5;const ml=Math.hypot(mx,mz);e.x+=mx/ml*e.spd*dt;e.z+=mz/ml*e.spd*dt;if(e.v){if(d<1.9)kill(e,-1)}else if(d<2.7){e.st='wind';e.stT=0}}
 else if(e.st==='wind'){e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*8);if(e.stT>0.4){e.st='lunge';e.stT=0;e.lx=dx/d;e.lz=dz/d;e.hd=false}}
 else if(e.st==='lunge'){e.x+=e.lx*13*dt;e.z+=e.lz*13*dt;if(!e.hd&&d<1.3&&T.y<1.1){e.hd=true;hurtT(T,8,e.x,e.z)}if(e.stT>0.22){e.st='rec';e.stT=0}}
 else if(e.stT>0.6)e.st='chase'}
else if(e.type==='lan'){e.oa+=dt*e.dir*0.5;if(Math.random()<dt*0.25)e.dir=-e.dir;const tx=clamp(T.x+Math.sin(e.oa)*e.oR,-20,20),tz=clamp(T.z+Math.cos(e.oa)*e.oR,-24,20),k=Math.min(1,dt*1.2);
 e.x+=(tx-e.x)*k;e.z+=(tz-e.z)*k;e.y=e.by+Math.sin(e.t*2)*0.4;e.yaw=wy;e.cd-=dt;if(e.st==='chase'&&e.cd<=0){e.st='charge';e.stT=0}
 if(e.st==='charge'&&e.stT>0.5){e.st='chase';e.cd=rnd(2.4,3.8);const ox=e.x+Math.sin(wy)*0.6,oz=e.z+Math.cos(wy)*0.6,tx2=T.x+T.vx*0.4-ox,ty=1.2-e.y,tz2=T.z+T.vz*0.4-oz,l=Math.hypot(tx2,ty,tz2)||1;
  shots.push({id:++eidN,k:0,x:ox,y:e.y,z:oz,vx:tx2/l*10,vy:ty/l*10,vz:tz2/l*10,r:0.28,dmg:9,g:0,life:5});if(lim('pe',0.4))sfxAt('ペッ',e.x,e.y+0.8,e.z,{size:44,st:'ink',life:0.35})}}
else{
 if(e.st==='chase'){e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*4);e.x+=Math.sin(e.yaw)*2.4*dt;e.z+=Math.cos(e.yaw)*2.4*dt;e.cd-=dt;if(d<3.8){e.st='swing';e.stT=0;e.hd=false}else if(e.cd<=0&&d<22){e.st='wind';e.stT=0;ev('txt','ゴゴゴ',r1(e.x),4.6,r1(e.z),56,'ink')}}
 else if(e.st==='wind'){e.yaw+=angDiff(wy,e.yaw)*Math.min(1,dt*6);if(e.stT>0.8){e.st='charge';e.stT=0;e.cx=Math.sin(e.yaw);e.cz=Math.cos(e.yaw);ev('txt','ドドドド',r1(e.x),4.6,r1(e.z),64,'boom')}}
 else if(e.st==='charge'){const px=e.x,pz=e.z;e.x+=e.cx*12*dt;e.z+=e.cz*12*dt;collide(e,e.r);if(lim('dust'+e.seed,0.07))fxSmoke(e.x,0.3,e.z,1,0.9,C.smoke,1);
  if(d<2.3){hurtT(T,24,e.x,e.z);e.st='rec';e.stT=0;e.cd=2.5}
  else if(Math.hypot(e.x-px,e.z-pz)<6*dt&&e.stT>0.15){e.st='stun';e.stT=0;e.cd=2;ev('stun',r1(e.x+e.cx),r1(e.z+e.cz))}
  else if(e.stT>1.7){e.st='rec';e.stT=0;e.cd=2.5}}
 else if(e.st==='swing'){if(e.stT>0.6&&!e.hd){e.hd=true;const sx=e.x+Math.sin(e.yaw)*2.4,sz=e.z+Math.cos(e.yaw)*2.4;ev('smash',r1(sx),r1(sz));areaHurt(sx,sz,3.3,18,1)}if(e.stT>1.2){e.st='chase';e.cd=Math.max(e.cd,1)}}
 else if(e.stT>(e.st==='stun'?1.5:0.5))e.st='chase'}
if(e.type!=='lan'){collide(e,e.r);if(boss){const bx=e.x,bz=e.z+21.5,bd=Math.hypot(bx,bz)||1;if(bd<8){e.x=bx/bd*8;e.z=bz/bd*8-21.5}}}}
for(let i=0;i<enemies.length;i++){const a=enemies[i];if(a.type==='lan'||a.type==='boss')continue;for(let j=i+1;j<enemies.length;j++){const b=enemies[j];if(b.type==='lan'||b.type==='boss')continue;const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||0.01,rr=a.r+b.r+0.25;if(d<rr){const p=(rr-d)/2/d;a.x-=dx*p;a.z-=dz*p;b.x+=dx*p;b.z+=dz*p}}}}
// ---- boss ----
const restH=(s,yo)=>({x:s*5.3,y:9.35+yo,z:-16.6});
function updBoss(b,dt){b.hx=Math.sin(b.t*0.9)*0.3;G.mood=Math.min(1,G.mood+dt*0.5);const hands=[b.hL,b.hR];T=bossT(b);
if(b.st==='rise'){b.yo=Math.min(0,-38+b.stT/2.6*38);trauma=Math.max(trauma,0.3);for(const s of[-1,1]){const h=s<0?b.hL:b.hR,r=restH(s,b.yo);h.x=r.x;h.y=r.y;h.z=r.z}
 if(lim('gogo',0.45))addText('ゴゴゴゴ',rnd(220,W-220),rnd(110,300),{size:84,st:'ink',life:0.9,grow:0.12});if(lim('risefx',0.12)){fxBlobs(rnd(-7,7),0.3,-18.5,3,9,C.ink,0.3);fxSmoke(rnd(-8,8),0.5,-18,1,1.6,C.smokeD,2)}
 if(b.stT>3.0){b.st='idle';b.stT=0;b.cdT=0.8}return}
if(b.st==='die'){b.mouth=1;trauma=Math.max(trauma,0.5);if(lim('bdie',0.14)){const a=rnd(0,TAU);explode(Math.cos(a)*rnd(0,10),rnd(4,28)+b.yo,-19.5+rnd(-1,2),rnd(1,2.2),{quiet:Math.random()<0.55,ink:1})}
 if(b.stT>0.9)b.yo-=dt*2.5;for(const s of[-1,1]){const h=s<0?b.hL:b.hR;h.y=Math.max(1,h.y-dt*4)}
 if(b.stT>1.7){ev('bossEnd');b.dead=true;G.endT=0;G.score+=5000;G.kills++}return}
if(b.phase===1&&b.hp<b.mhp*0.5){b.phase=2;b.st='stag';b.stT=0;b.ah=-1;ev('roar',1);ev('say','オノレ','ェェェ!!',1)}
for(let i=0;i<2;i++){if(b.ah===i)continue;const r=restH(i?1:-1,0),h=hands[i],k=Math.min(1,dt*4);h.x+=(r.x-h.x)*k;h.y+=(r.y-h.y)*k;h.z+=(r.z-h.z)*k}
const p2=b.phase>1;
if(b.st==='stag'){b.mouth=1;if(b.stT>1.8){b.st='idle';b.stT=0;b.cdT=0.5}}
else if(b.st==='idle'){b.mouth=lerp(b.mouth,0,Math.min(1,dt*5));if(b.stT>b.cdT*(G.stage?0.6:1)){b.atk++;b.ti=null;T=bossT(b);const m=b.atk%4;b.stT=0;if(m===1||m===3||(m===0&&p2)){b.st='up';b.ah=(T.x<0?0:1)^(b.atk%3===0?1:0);const h=hands[b.ah];b.s0={x:h.x,y:h.y,z:h.z}}else if(m===2){b.st='volley';b.vn=0}else b.st='summon'}}
else if(b.st==='up'){const h=hands[b.ah],u=Math.min(1,b.stT/(p2?0.6:0.85));if(u<0.7){b.tx=clamp(T.x,-20,20);b.tz=clamp(T.z,-11,20)}const e=easeOut(u);h.x=lerp(b.s0.x,b.tx,e);h.z=lerp(b.s0.z,b.tz,e);h.y=lerp(b.s0.y,10,e)+Math.sin(u*PI)*3;if(u>=1){b.st='down';b.stT=0}}
else if(b.st==='down'){const h=hands[b.ah];h.y=lerp(10,1.1,Math.min(1,b.stT/0.13));if(b.stT>=0.13){h.y=1.1;b.st='hold';b.stT=0;ev('slam',r1(h.x),r1(h.z));areaHurt(h.x,h.z,4.3,28)}}
else if(b.st==='hold'){if(b.stT>(p2?0.8:1.2)){b.ah=-1;b.st='idle';b.stT=0;b.cdT=p2?0.5:1.0}}
else if(b.st==='volley'){b.mouth=1;const n=p2?8:5,want=Math.floor((b.stT-0.4)/0.17);while(b.vn<=want&&b.vn<n){b.vn++;T=pickR();const ox=b.hx*2.7,oy=23.4,oz=-19.6,tx=clamp(T.x+rnd(-5,5),-20,20),tz=clamp(T.z+rnd(-5,5),-12,20),FT=1.5;
  shots.push({id:++eidN,k:1,x:ox,y:oy,z:oz,vx:(tx-ox)/FT,vy:-oy/FT+8*FT,vz:(tz-oz)/FT,r:0.55,dmg:16,g:16,life:9,tx,tz});fxStar(ox,oy,oz,3,C.white,0.08);if(lim('bo',0.3))sfxAt('ボッ',ox,oy+2,oz,{size:70,st:'ink',life:0.4});snd('spawn')}
 if(b.stT>0.4+n*0.17+0.4){b.st='idle';b.stT=0;b.cdT=p2?0.6:1.1}}
else if(b.st==='summon'){b.mouth=1;if(!b.sm&&b.stT>0.5){b.sm=true;ev('roar',0);for(let i=0;i<(p2?4:3)+G.np-1;i++)spawnNear(G.stage&&i%2?'bom':'imp');if(p2)spawnNear('lan')}if(b.stT>1.3){b.sm=false;b.st='idle';b.stT=0;b.cdT=1}}}
// ================= DRAW ENTITIES =================
function drawImp(e){const s=e.sc;let sq=1,hop=0,lean=0,arm=0.5;mPush();
if(e.st==='spawn'){const u=e.stT/0.7,k=0.3+0.7*easeBack(Math.min(1,u));mT(e.x,-1.2*(1-easeOut(Math.min(1,u))),e.z);mRY(e.yaw);mS(s*k,s*k,s*k)}
else{if(e.st==='chase'){hop=Math.abs(Math.sin(e.t*9))*0.22;sq=1+Math.sin(e.t*18)*0.06}else if(e.st==='wind'){sq=0.72;arm=1.6}else if(e.st==='lunge'){sq=1.2;lean=0.5;arm=2.2;hop=0.3}mT(e.x,hop,e.z);mRY(e.yaw);mRX(lean);mS(s,s*sq,s)}
gTint=e.flash>0?1:0;sph(0,0.62,0,1.02,0.98,0.94,e.v?C.red:C.ink,0,1,0,1);if(e.v){cyl(0,1.2,0,0.07,0.3,0.07,C.black);put(SPIKE,0,1.44,0,e.t*9,e.t*7,0,0.34,0.34,0.34,C.yellow,0,0,F_UNLIT)}
for(const d of[-1,1]){put(CONE,d*0.27,1.13,0.04,0,0,-d*0.4,0.2,0.46,0.2,e.v?C.gold:C.red,0,.6);put(SPH,d*0.2,0.72,0.4,0,0,d*0.25,0.28,0.3,0.14,C.white);sph(d*0.19,0.7,0.46,0.1,0.12,0.06,C.red,0,0,F_UNLIT);
put(BOX,d*0.21,0.88,0.43,0,0,d*0.45,0.34,0.08,0.1,C.inkD);put(SPH,d*0.56,0.6,0.05,0,0,d*(0.4+arm),0.17,0.5,0.17,C.ink,0,1);sph(d*0.22,0.08,0.06+Math.sin(e.t*9+d)*0.12*(e.st==='chase'?1:0),0.3,0.16,0.4,C.inkD)}
box(0,0.4,0.42,0.46,0.13,0.1,C.tongue);for(let i=0;i<4;i++)put(CONE,-0.165+i*0.11,0.44,0.47,PI,0,0,0.09,0.12,0.06,C.white);gTint=0;mPop()}
function drawLan(e){const ch=e.st==='charge'?e.stT/0.5:0,k=(e.st==='spawn'?easeBack(Math.min(1,e.stT/0.5)):1)*(1+ch*0.25);
mPush();mT(e.x,e.y,e.z);mRY(e.yaw);mRZ(Math.sin(e.t*1.7)*0.12);mS(k,k,k);gTint=e.flash>0?1:0;
sph(0,0,0,0.95,1.15,0.95,C.lant,6,.5);cyl(0,0.56,0,0.5,0.14,0.5,C.black);cyl(0,-0.56,0,0.5,0.14,0.5,C.black);
sph(0,0.08,0.36,0.56,0.56,0.3,C.white);sph(0,0.08,0.47,0.32,0.32,0.16,ch>0?C.red:C.yellow,0,0,F_UNLIT);sph(0,0.08,0.54,0.1,0.22,0.06,C.inkD);
box(0,-0.3,0.4,0.5,0.07,0.12,C.inkD);put(BOX,0.05,-0.47,0.44,Math.sin(e.t*5)*0.3,0,0,0.16,0.36,0.04,C.tongue);put(CONE,0,0.9+Math.sin(e.t*13)*0.04,0,0,e.t*3,0,0.34,0.6,0.34,C.cyan,0,0,F_UNLIT);
const fl=Math.sin(e.t*14)*0.5;for(const d of[-1,1]){mPush();mT(d*0.45,0.15,-0.05);mRZ(d*(0.3+fl));box(d*0.45,0,0,0.8,0.42,0.05,C.ink);put(BOX,d*0.75,-0.25,0,0,0,d*0.5,0.3,0.3,0.05,C.ink);mPop()}
cyl(0,-0.8,0,0.05,0.4,0.05,C.red);sph(0,-1.02,0,0.16,0.16,0.16,C.red);gTint=0;mPop()}
function drawBru(e){const wk=e.st==='chase'?Math.sin(e.t*6):e.st==='charge'?Math.sin(e.t*16):0;let k=1,lean=0,armR=0.2;
if(e.st==='spawn')k=0.3+0.7*easeBack(Math.min(1,e.stT/0.7));else if(e.st==='wind'){lean=-0.15;armR=-1.2}else if(e.st==='charge'){lean=0.45;armR=-0.6}else if(e.st==='swing'){const u=e.stT;armR=u<0.5?-2.6*(u/0.5):-2.6+3.6*Math.min(1,(u-0.5)/0.1)}else if(e.st==='stun')lean=-0.25;
const hot=e.st==='wind'||e.st==='charge';
mPush();mT(e.x,0,e.z);mRY(e.yaw);mS(k,k,k);mRX(lean);gTint=e.flash>0?1:0;
for(const d of[-1,1]){put(CYL,d*0.45,0.55,0,d*wk*0.5,0,0,0.55,1.1,0.55,C.skin);box(d*0.45,0.1,0.1+d*wk*0.2,0.6,0.2,0.85,C.skinD)}
box(0,1.15,0,1.5,0.55,1.0,C.yellow);box(-0.3,1.15,0.02,0.14,0.56,1.02,C.inkD);box(0.35,1.15,0.02,0.14,0.56,1.02,C.inkD);
sph(0,2.0,0,1.9,1.6,1.35,C.skin);box(0,2.05,0.55,1.25,0.8,0.35,C.navy);box(0,2.05,0.72,1.0,0.14,0.1,C.gold);
for(const d of[-1,1]){sph(d*1.05,2.6,0,0.95,0.8,0.95,C.redD,0,.5);put(CONE,d*1.15,3.15,0,0,0,-d*0.4,0.3,0.6,0.3,C.gold)}
put(SPH,-1.3,1.85,0.1,-wk*0.4,0,0.25,0.55,1.3,0.55,C.skin);sph(-1.45,1.2,0.15-wk*0.25,0.6,0.6,0.6,C.skinD);
mPush();mT(1.3,2.4,0);mRX(armR+wk*0.3);put(SPH,0.1,-0.55,0,0,0,-0.2,0.55,1.3,0.55,C.skin);sph(0.2,-1.2,0,0.62,0.62,0.62,C.skinD);mT(0.2,-1.2,0);mRX(-1.2);cyl(0,1.2,0,0.34,2.4,0.34,C.black,0,.5);cyl(0,0.1,0,0.2,0.5,0.2,C.woodD);
for(let i=0;i<6;i++){const a=i*2.1;put(CONE,Math.cos(a)*0.22,1.0+i*0.24,Math.sin(a)*0.22,0,-a,-PI/2,0.16,0.3,0.16,C.gold)}mPop();
mPush();mT(0,3.0,0.2);sph(0,0,0,0.95,0.9,0.9,C.skin);sph(0,0.25,-0.2,1.0,0.7,0.85,C.inkD);
for(const d of[-1,1]){put(CONE,d*0.3,0.62,0.1,0.2,0,-d*0.3,0.22,0.6,0.22,C.gold,0,.6);put(SPH,d*0.2,0.05,0.4,0,0,d*0.3,0.24,0.13,0.1,hot?C.red:C.yellow,0,0,F_UNLIT);put(CONE,d*0.2,-0.2,0.42,0,0,0,0.1,0.26,0.1,C.white)}
box(0,-0.3,0.4,0.5,0.08,0.1,C.inkD);mPop();gTint=0;mPop()}
function drawBossArm(b,s){const h=s<0?b.hL:b.hR,sx=s*9.2+b.hx*2,sy=20.6+b.yo,sz=-26.5,mx=(sx+h.x)/2+s*2,my=Math.max(sy,h.y)+3,mz=(sz+h.z)/2,len=Math.hypot(h.x-sx,h.y-sy,h.z-sz),n=clamp(Math.ceil(len/1.7),5,26);gId=nid();
for(let i=0;i<=n;i++){const u=i/n,a=(1-u)*(1-u),bb=2*u*(1-u),c=u*u,d=lerp(5.8,2.8,u);sph(a*sx+bb*mx+c*h.x,a*sy+bb*my+c*h.y,a*sz+bb*mz+c*h.z,d,d,d,BI,0,.6,0,1)}gId=0;
mPush();mT(h.x,h.y,h.z);mRY(Math.atan2(h.x-sx,h.z-sz));sph(0,0,0,3.6,2.3,3.8,BI,0,.8,0,1);for(let i=0;i<4;i++)put(CONE,-1.2+i*0.8,-0.3,1.9,1.9,0,0,0.7,1.8,0.7,C.paper);put(CONE,-s*1.9,-0.2,0.6,1.6,-s*1.2,0,0.7,1.5,0.7,C.paper);mPop()}
function drawBoss(b){const yo=b.yo,t=b.t,p2=b.phase>1,eye=p2?C.red:C.yellow;gTint=b.flash>0?0.45:0;
put(CYL,0,0.1,-21.5,0,0,0,27,0.1,13,C.inkD,0,0,F_NOCAST);for(let i=0;i<6;i++){const a=i*1.05+t*0.3;sph(Math.cos(a)*11.5,0.1,-21.5+Math.sin(a)*5.5,2.2+Math.sin(t*2+i)*0.6,0.9,2.2,C.inkD)}
mPush();mT(0,yo,-27);mS(2.1,2.1,2.1);gId=nid();sph(0,4.2,0,11,10,8,BI,0,.6,0,1);sph(b.hx,8.6,0.2,9.5,6.5,6.5,BI,0,.6,0,1);sph(-4.4+b.hx,9.8,0.3,4.2,3.6,4,BI,0,.6,0,1);sph(4.4+b.hx,9.8,0.3,4.2,3.6,4,BI,0,.6,0,1);gId=0;
for(let i=0;i<7;i++){const a=(i-3)*0.42;put(CONE,Math.sin(a)*3.4+b.hx,10.2-Math.abs(i-3)*0.12,Math.cos(a)*3.2,1.9,a,0,0.9,1.9,0.9,C.gold,0,.6)}
mPush();mT(b.hx*1.3,12.4+Math.sin(t*1.3)*0.15,0.8);mRX(0.12+(b.st==='stag'?-0.35:0));
sph(0,0,0,5.0,5.2,4.8,BI,0,.6,0,1);sph(0,-0.2,1.5,4.0,4.4,2.4,C.paper);
for(const d of[-1,1]){put(SPH,d*1.0,0.2,2.6,0,0,d*0.38,1.25,0.46,0.3,eye,0,0,F_UNLIT);put(BOX,d*1.05,0.82,2.5,0,0,d*0.5,1.6,0.26,0.3,C.red);put(BOX,d*1.55,-0.8,2.25,0,0,-d*0.3,0.3,1.2,0.3,C.red);
put(CONE,d*1.9,2.7,0.2,-0.2,0,-d*0.55,1.1,3.6,1.1,C.gold,0,.8);put(CONE,d*2.5,0.6,-0.6,-0.5,0,-d*1.1,0.9,2.2,0.9,C.inkD)}
sph(0,1.35,2.35,1.3,1.45,0.8,C.white);sph(0,1.35,2.66,0.8,0.9,0.4,eye,0,0,F_UNLIT);sph(0,1.35,2.84,0.25,0.6,0.16,C.inkD);
const mo=0.25+b.mouth*0.9;box(0,-1.25-mo*0.3,2.45,2.5,mo,0.5,C.inkD);for(let i=0;i<6;i++){put(CONE,-1.0+i*0.4,-1.05,2.72,PI,0,0,0.3,0.5,0.25,C.white);put(CONE,-0.8+i*0.32,-1.45-mo*0.6,2.72,0,0,0,0.26,0.44,0.22,C.white)}
if(p2){put(BOX,0.9,1.2,2.4,0,0,0.6,0.12,1.6,0.3,C.inkD);put(BOX,-0.5,-0.3,2.6,0,0,-0.5,0.12,1.3,0.3,C.inkD)}
for(let i=0;i<5;i++)put(CONE,(i-2)*0.9,2.3-Math.abs(i-2)*0.3,-1.2,-0.9,0,-(i-2)*0.25,1.0,2.4,1.0,C.inkD);
mPop();mPop();gTint=b.flash>0?0.45:0;drawBossArm(b,-1);drawBossArm(b,1);gTint=0;
if(b.st==='up'){const s=6+Math.sin(t*20)*0.8;put(RING,b.tx,0.12,b.tz,0,0,0,s,1,s,C.red,0,0,F_UNLIT|F_NOCAST);put(RING,b.tx,0.12,b.tz,0,0,0,s*0.5,1,s*0.5,C.red,0,0,F_UNLIT|F_NOCAST)}}
function drawEnemies(){BI=G.stage?C.crim:C.ink;for(const e of enemies){if(e.dead)continue;if(e.type==='imp')drawImp(e);else if(e.type==='lan')drawLan(e);else if(e.type==='bru')drawBru(e);else drawBoss(e)}
for(const s of shots){if(s.k===0){sph(s.x,s.y,s.z,s.r*2,s.r*2,s.r*2,C.ink,0,1,0,1);sph(s.x-s.vx*0.03,s.y-s.vy*0.03,s.z-s.vz*0.03,s.r*1.3,s.r*1.3,s.r*1.3,C.purple,0,0,F_UNLIT|F_NOCAST)}
else{sph(s.x,s.y,s.z,1.1,1.1,1.1,C.ink,0,1,0,1);bill(BURST,s.x,s.y+0.65,s.z,0.7,now*9,C.yellow,F_UNLIT|F_NOCAST);const r=3.4+Math.sin(now*18)*0.4;put(RING,s.tx,0.11,s.tz,0,0,0,r,1,r,C.red,0,0,F_UNLIT|F_NOCAST)}}}
function drawGun(){curLayer=2;mPush();M.set(CAMW);const bx=Math.sin(pl.bob)*0.012*pl.moving,by=Math.abs(Math.cos(pl.bob))*0.014*pl.moving,dip=pl.gunDip+(pl.dead?Math.min(1,pl.deadT*2):0);
mT(0.30+bx,-0.27-by-dip*0.3,-0.5+pl.rec*0.09);mRY(0.05);mRX(pl.rec*0.26-dip*0.8);mRZ(-dip*0.5);mS(0.86,0.86,0.86);
muz[0]=M[8]*-0.66+M[4]*0.045+M[12];muz[1]=M[9]*-0.66+M[5]*0.045+M[13];muz[2]=M[10]*-0.66+M[6]*0.045+M[14];
box(0,0.02,-0.1,0.075,0.11,0.34,C.gunM,0,.6);put(CYL,0,0.045,-0.36,PI/2,0,0,0.06,0.26,0.06,C.gunD,0,.8);box(0,0.085,-0.16,0.03,0.02,0.36,C.gunD);
put(CONE,0,0.045,-0.55,-PI/2,0,0,0.085,0.16,0.085,C.gold,0,1);put(CYL,0,0.045,-0.47,PI/2,0,0,0.09,0.03,0.09,C.gold);
put(CYL,0,0.02,-0.02,PI/2,0,pl.spin,0.13,0.1,0.13,C.gunD,0,.7);put(CYL,0,0.02,-0.02,PI/2,0,0,0.136,0.025,0.136,C.red);
sph(0,0.105,0.05,0.07,0.07,0.07,pl.gauge>=100?C.cyan:C.cyanD,0,1,pl.gauge>=100?F_UNLIT:0);box(0,0.105,-0.27,0.015,0.03,0.03,C.gold);box(0,0.1,0.1,0.02,0.05,0.04,C.gunD);
put(BOX,0,-0.1,0.07,0.35,0,0,0.06,0.18,0.085,C.wood);sph(0,-0.1,0.075,0.115,0.14,0.15,C.glove);for(let i=0;i<3;i++)box(0,-0.055-i*0.036,0.0,0.1,0.03,0.06,C.glove);
put(CYL,0.07,-0.25,0.36,1.05,0,-0.2,0.14,0.6,0.14,C.sleeve);put(CYL,0.025,-0.155,0.17,1.05,0,-0.2,0.16,0.06,0.16,C.white);
if(pl.flashT>0){bill(BURST,muz[0],muz[1],muz[2],0.55,pl.spin*3,C.yellow,F_UNLIT);bill(STAR,muz[0],muz[1],muz[2],0.3,pl.spin,C.white,F_UNLIT)}
if(pl.sp===1){const s=0.15+pl.spT*0.6;bill(BURST,muz[0],muz[1],muz[2],s,now*20,C.cyan,F_UNLIT);bill(STAR,muz[0],muz[1],muz[2],s*0.5,-now*20,C.white,F_UNLIT)}
mPop();curLayer=1;
if(pl.sp===2){const d=aimDir(),u=sat(pl.spT/0.1)*(pl.spT>0.6?sat((0.8-pl.spT)/0.2):1),ox=muz[0],oy=muz[1],oz=muz[2],NF=F_UNLIT|F_NOCAST;
mPush();mT(ox+d[0]*50,oy+d[1]*50,oz+d[2]*50);orient(d[0],d[1],d[2]);mRX(PI/2);mPush();mS(1.5*u,94,1.5*u);emit(CYL,C.white,0,0,NF,0);mPop();mPop();
for(let i=0;i<9;i++){const tt=((now*3+i/9)%1)*80+2;mPush();mT(ox+d[0]*tt,oy+d[1]*tt,oz+d[2]*tt);orient(d[0],d[1],d[2]);mRX(PI/2);const s=(3+i%3*1.2)*u;mS(s,1,s);emit(RING,i%2?C.cyan:C.white,0,0,NF,0);mPop()}
bill(BURST,ox+d[0]*2.6,oy+d[1]*2.6,oz+d[2]*2.6,2.6*u,now*25,C.cyan,NF);bill(STAR,ox+d[0]*2.4,oy+d[1]*2.4,oz+d[2]*2.4,1.3*u,-now*25,C.white,NF)}}
const petals=[];for(let i=0;i<70;i++)petals.push({x:rnd(-18,18),y:rnd(0,11),z:rnd(-18,18),p:rnd(0,TAU),s:rnd(0.07,0.13)});
function drawPetals(dt){for(const p of petals){p.y-=dt*(G.stage?-1.2:1)*(0.7+Math.sin(p.p)*0.2);p.p+=dt*2.2;p.x+=dt*(0.9+Math.sin(p.p*0.7)*0.8);if(p.y<0)p.y+=11;else if(p.y>11)p.y-=11;let dx=p.x-cam.x,dz=p.z-cam.z;if(dx>18)p.x-=36;else if(dx<-18)p.x+=36;if(dz>18)p.z-=36;else if(dz<-18)p.z+=36;
put(QUAD,p.x,p.y,p.z,p.p,p.p*1.3,p.p*0.7,p.s,p.s*0.7,1,G.stage?C.orange:C.sakura,0,0,F_UNLIT|F_NOEDGE|F_NOCAST)}}
