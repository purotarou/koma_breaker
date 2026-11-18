'use strict';
// ================= 5面ボス 白抜魔王シロヌキ (STORY.md 5「5面の3段階」) =================
// For now he is drawn in code (no 3D model yet: blender/src/komabure_chara_last_boss3*.glb is for later). Like the bosses of stages 1-3 he stands
// at the north end (hands, net sync through m.b, BT / updBoss2 in boss123.js), with STG[4].bk='shiro'. Three stages, one HP bar split in three:
//   第1段階  胸の黒い印 (viewer's left) is the weak point. ベタグロ's moves: fists, lobbed ink, both fists, 墨の波, summons.
//   第2段階  the black seal is broken; 胸の赤い印 (right) is the weak point. アカベタ's moves: palms (fire cross), fire balls, fire breath, 火の線の回転.
//   第3段階  the forehead plate shatters: the red 三つ巴 on his forehead is the weak point, he draws two swords. 吸い込み (suck), 白抜き (コマ割り),
//            sword cuts along marked lines, the sword sweep (jump), both fists.
// The HP of a stage cannot go below its line (SH_TH) until the seal breaks; then 'brk' (no damage, ~2.6 s, the seal shatters, he speaks).
// Hits on the active seal / the exposed tomoe take ×SH_WEAK (crits); anywhere else on him ×SH_BODY.
// New hazards (local list shz, started by FXE events, every peer checks its own player): suck / koma (panels) / cut (sword lines).
// ---- tuning (目安) ----
const SH_TH=[2/3,1/3],SH_WEAK=2.5,SH_BODY=0.5,SH_BRK=2.6,
 SH_SAY=[['黒ガ…','紅ク燃エロ!!'],['全テヲ','白紙ニ還ス!!']];
BT.shiro={hp:7200,cd:0.72,up:[0.85,0.65],hold:[1.1,0.8],slamDmg:28,up2:0.95,volN:[6,8],ballN:[5,6],ballDmg:14,sumN:[2,3],waveTel:0.9,waveN:[1,2],
 brTel:0.9,brN:[2,3],spinTel:1.1,spinW:0.62,spinGap:0.85,swTel:[0.95,0.8],swDur:[1.0,0.85],swR:30,swReach:14,swDmg:22,
 suTel:1.0,suDur:3.4,suV:3.8,suR:9,suDmg:[14,5],suZ:-14,          // 吸い込み: telegraph, pull time, pull speed (m/s), hurt radius, damage near / far, centre z
 koTel:[2.3,1.6],koDmg:34,koN:[2,3],                               // 白抜き: warning (first / later waves), damage, waves [普通, 極]
 cuTel:1.0,cuN:[2,3],cuW:1.8,cuDmg:24,cuZ:-16,                     // sword cuts: warning, cuts [普通, 極], half width, damage, origin z
 pats:[['fist','volley','double','fist','wave','summon'],
  ['palm','fireball','palm','breath','spin','fist','summon'],
  ['slash','koma','sweep2','suck','double','slash','koma','summon'],
  ['fist','volley','pillar','double','wave','fist','summon'],         // 極 (pillar / chase / rows: js/extreme.js)
  ['palm','fireball','chase','palm','breath','spin','chase','summon'],
  ['slash','koma','rows','sweep2','suck','slash','koma','double','summon']]};
const shz=[];
// ---- host: phase lines, the break, the new attacks. true = this frame is handled here (updBoss2 returns) ----
function shRest(b,dt,hands){for(let i=0;i<2;i++){if(b.ah===i||b.ah===2)continue;const r=restH(i?1:-1,0),h=hands[i],k=Math.min(1,dt*4);h.x+=(r.x-h.x)*k;h.y+=(r.y-h.y)*k;h.z+=(r.z-h.z)*k}}
function shIdle(b,cd){b.st='idle';b.stT=0;b.cdT=cd;b.ah=-1}
function shPre(b,dt,hands){const K=BT.shiro,u=b.stT,ex=G.ex?1:0;
if(b.phase<3){const f=b.mhp*SH_TH[b.phase-1];if(b.hp<=f){b.hp=Math.ceil(f);if(b.st!=='brk'){b.phase++;b.st='brk';b.stT=0;b.ah=-1;b.k=0;ev('shBrk',b.phase);const L=SH_SAY[b.phase-2];ev('say',L[0],L[1],1);return true}}}
const st=b.st;
if(st==='brk'){b.mouth=u<1.4?1:lerp(b.mouth,0.3,Math.min(1,dt*3));shRest(b,dt,hands);if(!b.k&&u>1.3){b.k=1;ev('roar',1)}if(u>SH_BRK)shIdle(b,0.5);return true}
if(st==='suck'){b.mouth=1;shRest(b,dt,hands);if(!b.k){b.k=1;ev('shSuck')}if(u>K.suTel+K.suDur+0.6)shIdle(b,0.7);return true}
if(st==='koma'){const n=K.koN[ex],T0=K.koTel[0],T1=K.koTel[1],end=T0+(n-1)*(T1+0.45)+0.9;b.mouth=0.5;
 if(!b.k){b.k=1;b.ah=2;ev('shKoma',(Math.random()*1e9)|0,n)}
 // both hands up while the panels warn, slapped down at each 白抜き
 let q=u,tl=T0;for(let i=0;i<n;i++){if(q<tl+0.45)break;q-=tl+0.45;tl=T1}const dn=q>=tl-0.1&&q<tl+0.3;
 for(let i=0;i<2;i++){const h=hands[i],k=Math.min(1,dt*(dn?30:5));h.x+=((i?8:-8)-h.x)*k;h.y+=((dn?1.1:17)-h.y)*k;h.z+=(-13.5-h.z)*k}
 if(u>end)shIdle(b,0.6);return true}
if(st==='slash'){const n=K.cuN[ex],per=K.cuTel+0.5,i=Math.min(n-1,Math.floor(u/per)),q=u-i*per;b.mouth=0.4;
 if(b.vn<=i){b.vn=i+1;const P=pickR(),a=clamp(Math.atan2(P.x+(P.vx||0)*0.25,P.z+(P.vz||0)*0.25-K.cuZ),-1.35,1.35);b.p0=r2(a);b.ah=i%2?1:0;ev('shCut',b.p0,K.cuTel)}
 const h=hands[b.ah],a=b.p0,dn=q>=K.cuTel,d=dn?13:9,k=Math.min(1,dt*(dn?32:6));h.x+=(Math.sin(a)*d-h.x)*k;h.y+=((dn?1.6:17)-h.y)*k;h.z+=(K.cuZ+Math.cos(a)*d-h.z)*k;
 for(let j=0;j<2;j++)if(j!==b.ah){const r=restH(j?1:-1,0),g=hands[j],kk=Math.min(1,dt*4);g.x+=(r.x-g.x)*kk;g.y+=(r.y-g.y)*kk;g.z+=(r.z-g.z)*kk}
 if(u>n*per+0.5)shIdle(b,0.6);return true}
if(st==='rows'){b.ah=2;if(exRows(b,dt,hands))shIdle(b,0.8);return true}
return false}
// ---- hazards (every peer, own player) ----
function shKomaLay(seed,n){const R=mulberry(seed),z0=-12.6,z1=BZ1-0.4,x0=-BX+0.4,x1=BX-0.4,waves=[],P=[];const hs=[];let tot=0;for(let i=0;i<3;i++){hs.push(0.8+R()*0.5);tot+=hs[i]}
let z=z0;for(let i=0;i<3;i++){const h=(z1-z0)*hs[i]/tot,m=2+(R()*2|0),ws=[];let tw=0;for(let j=0;j<m;j++){ws.push(0.7+R()*0.7);tw+=ws[j]}let x=x0;
 // slanted gutters like a manga page: each vertical cut leans a little (k = x shift per metre of z)
 for(let j=0;j<m;j++){const w=(x1-x0)*ws[j]/tw;P.push({x0:x,x1:x+w,z0:z,z1:z+h,row:i,k0:0,k1:0});x+=w}z+=h}
for(let j=1;j<P.length;j++)if(P[j].row===P[j-1].row){const k=(R()-0.5)*0.36;P[j-1].k1=k;P[j].k0=k}
for(let w=0;w<n;w++){let on;if(w%2===1)on=waves[w-1].map(v=>!v);else{on=P.map(()=>R()<0.5);for(let r=0;r<3;r++){const ix=P.map((p,j)=>p.row===r?j:-1).filter(j=>j>=0);if(ix.every(j=>on[j]))on[ix[(R()*ix.length)|0]]=false;if(ix.every(j=>!on[j])&&R()<0.6)on[ix[(R()*ix.length)|0]]=true}}waves.push(on)}
return{P,waves}}
// x edges of a panel at depth z (the side cuts lean)
const shPx=(p,z)=>{const m=(p.z0+p.z1)/2;return[p.x0+p.k0*(z-m),p.x1+p.k1*(z-m)]};
function shInPanel(p,x,z,pad){if(z<p.z0+pad||z>p.z1-pad)return false;const e=shPx(p,z);return x>e[0]+pad&&x<e[1]-pad}
function shTick(dt,live){const K=BT.shiro;
for(let i=shz.length-1;i>=0;i--){const h=shz[i],t0=h.t;h.t+=dt;
 if(h.k==='suck'){if(h.t>K.suDur){shz.splice(i,1);continue}if(h.t<0||!live)continue;
  const dx=-pl.x,dz=K.suZ-pl.z,d=Math.hypot(dx,dz)||1,v=K.suV*(pl.dashT>0?0.2:pl.y>0.05?0.55:1)*Math.min(1,h.t*3);pl.x+=dx/d*v*dt;pl.z+=dz/d*v*dt;collide(pl,0.5);
  if(boss){const ex=pl.x,ez=pl.z+21.5,ed=Math.hypot(ex,ez)||1;if(ed<7.5){pl.x=ex/ed*7.5;pl.z=-21.5+ez/ed*7.5}}
  if(d<K.suR&&pl.y<0.6&&lim('shsu',0.45)){const hp=pl.hp;hurtPlayer(lerp(K.suDmg[0],K.suDmg[1],sat((d-6.5)/(K.suR-6.5))),pl.x+dx/d,pl.z+dz/d);if(pl.hp<hp)addText('吸ワレル…！',W/2,H*0.62,{size:60,st:'ink',life:0.45})}}
 else if(h.k==='koma'){const L=h.L,n=L.waves.length;if(h.w>=n){h.ct+=dt;if(h.t>0.7)shz.splice(i,1);continue}const tl=h.w?K.koTel[1]:K.koTel[0];
  if(h.t>=tl){const on=L.waves[h.w];FXE_shNuki(L.P,on);if(live&&pl.y<3)for(let j=0;j<L.P.length;j++)if(on[j]&&shInPanel(L.P[j],pl.x,pl.z,0.1)){hurtPlayer(K.koDmg,pl.x,pl.z+1);break}
   h.cut=on;h.ct=0;h.w++;h.t=h.w<n?-0.45:0}
  if(h.cut)h.ct+=dt}
 else if(h.k==='cut'){if(t0<0&&h.t>=0){const a=h.a,s=Math.sin(a),c=Math.cos(a);fxRing(s*14,0.2,K.cuZ+c*14,6,C.white,0.25);for(let j=0;j<6;j++){const d=6+j*6.5;fxDebris(s*d,0.4,K.cuZ+c*d,3,6,C.paper,0.35)}shake(0.5);snd('slash');snd('boom',0.6);stopT(0.05);
   sfxAt('ズバァッ！',s*16,4,K.cuZ+c*16,{size:90,st:'boom',life:0.6});
   if(live&&pl.y<2.4){const px=pl.x,pz=pl.z-K.cuZ,al=px*s+pz*c,pp=px*c-pz*s;if(al>3&&al<50&&Math.abs(pp)<K.cuW+0.4)hurtPlayer(K.cuDmg,pl.x-c*Math.sign(pp||1),pl.z+s*Math.sign(pp||1))}}
  if(h.t>1.4)shz.splice(i,1)}}}
// one 白抜き: white light bursts out of the marked panels
function FXE_shNuki(P,on){flash(0.35);shake(0.6);snd('boom',1);snd('slash');stopT(0.06);addText('白抜キ！！',W/2,H*0.3,{size:130,st:'ink',life:0.8,rot:-0.05});
for(let j=0;j<P.length;j++)if(on[j]){const p=P[j],cx=(p.x0+p.x1)/2,cz=(p.z0+p.z1)/2;fxStar(cx,1,cz,6,C.white,0.14);fxDebris(cx,0.5,cz,6,8,C.paper,0.5)}}
Object.assign(FXE,{
shBrk(ph){const b=boss;flash(0.8);shake(1);stopT(0.2);snd('clank');snd('boom',1);lines(1,'#16121f');invA=1;
 const yo=b?b.yo:0,hx=b?b.hx:0;if(ph<=3){const s=ph===2?-1:1,x=ph===3?2.7*hx:s*4.6+2.1*hx,y=ph===3?29.2+yo:17.6+yo,z=-20.2,c=ph===2?C.inkD:C.red;
  if(ph===3){fxDebris(x,y,z,22,12,C.inkD,0.6);fxDebris(x,y,z,10,10,C.paper,0.5)}else fxDebris(x,y,z,20,12,c,0.6);fxStar(x,y,z,9,C.white,0.16);fxRing(x,y,z,12,ph===2?C.white:C.red,0.4);for(let i=0;i<3;i++)explode(x+rnd(-2,2),y+rnd(-2,2),z+1,2.2,{quiet:1,ink:ph===2})}
 addText('バキィッ！！',W/2,H*0.3,{size:140,st:'boom',life:1,rot:-0.06});
 addText(ph===2?'黒の印、破壊！':'赤の印、破壊！',W/2,H*0.46,{size:64,st:ph===2?'ink':'hurt',life:1.4});if(ph===3)addText('額の巴が出た！',W/2,H*0.58,{size:58,st:'fire',life:1.6})},
shSuck(){shz.push({k:'suck',t:-BT.shiro.suTel});snd('charge');snd('roar',0.5);lines(0.9,'#16121f',W/2,H*0.35);addText('スゥゥゥゥ…',W/2,H*0.28,{size:100,st:'ink',life:1.2,grow:0.2});addText('吸い込みだ！離れろ！',W/2,H*0.74,{size:46,st:'cyan',life:1.2})},
shKoma(seed,n){const L=shKomaLay(seed,n);for(let i=shz.length-1;i>=0;i--)if(shz[i].k==='koma')shz.splice(i,1);shz.push({k:'koma',t:0,w:0,L,cut:null,ct:0});snd('clank');shake(0.4);addText('コマ割リ！',W/2,H*0.28,{size:110,st:'ink',life:1.1,rot:0.05});addText('光るコマから出ろ！',W/2,H*0.74,{size:46,st:'cyan',life:1.2})},
shCut(a,tel){shz.push({k:'cut',a,t:-tel});snd('whoosh');if(lim('shct',0.8))addText('チャキッ',W/2,H*0.3,{size:80,st:'ink',life:0.5})}});
// ---- drawing ----
function magatama(x,y,z,R,c,rot,fl){const ca=Math.cos(rot),sa=Math.sin(rot),P=(u,v)=>[x+u*ca-v*sa,y+u*sa+v*ca];let p=P(0,R*0.25);sph(p[0],p[1],z,R*1.15,R*1.15,R*0.32,c,0,0,fl);
p=P(R*0.36,-R*0.3);sph(p[0],p[1],z,R*0.66,R*0.66,R*0.28,c,0,0,fl);p=P(R*0.48,-R*0.74);sph(p[0],p[1],z,R*0.34,R*0.34,R*0.24,c,0,0,fl)}
// crack lines (dark) on the white body: [x, y, z, angle, length]
const SH_CRK=[[[-3.6,9.6,3.0,0.7,2.4],[-1.2,7.2,3.25,-0.5,2.0],[-3.0,6.8,3.0,-1.2,1.8],[-4.6,8.0,2.6,0.2,1.6]],
 [[3.6,9.6,3.0,-0.7,2.4],[1.2,7.2,3.25,0.5,2.0],[3.0,6.8,3.0,1.2,1.8],[4.6,8.0,2.6,-0.2,1.6],[0.2,10.2,3.2,0.1,2.2],[-0.4,5.6,3.6,-0.3,2.6],[2.6,4.2,3.9,0.8,2.0],[-2.8,3.6,3.9,-0.9,2.2]]];
function shSeal(b,s,ph){const t=b.t,x=s*2.2+b.hx,y=8.4,z=3.02,dead=s<0?ph>1:ph>2,live=s<0?ph===1:ph===2,c=s<0?C.inkD:C.red;
if(!dead){magatama(x,y,z+0.12,1.5,c,s<0?0.4:PI-0.4,live&&s>0?F_UNLIT:0);if(live){const k=2.9+Math.sin(t*6)*0.35;put(RING,x,y+0.1,z+0.3,PI/2,0,0,k,1,k,s<0?C.purple:C.yellow,0,0,F_UNLIT|F_NOCAST);put(RING,x,y+0.1,z+0.32,PI/2,0,0,k*1.25,1,k*1.25,C.red,0,0,F_UNLIT|F_NOCAST)}}
else{sph(x,y,z-0.3,2.4,2.2,0.9,C.inkD);for(let i=0;i<5;i++){const a=i*1.26+s;put(BOX,x+Math.cos(a)*1.6,y+Math.sin(a)*1.6,z+0.05,0,0,a+PI/2,0.16,1.6,0.3,C.inkD)}if(s>0&&ph===3)sph(x,y,z-0.1,1.3,1.2,0.5,C.redD,0,0,F_UNLIT)}}
// hand (inside the hand matrix, +z = away from the shoulder): white fist / open palm (第2段階の palm), black wrist band, a sword in each hand in 第3段階
function shHand(b,s){const st=b.st,palm=b.n===1&&(st==='up'||st==='down'||st==='hold'),WH=C.paper;
if(palm){sph(0,0,0,4.6,1.5,4.4,WH,0,.8,0,1);sph(0,-0.5,0.1,3.4,0.6,3.2,C.red,0,0,F_UNLIT);for(let i=0;i<4;i++){const a=(i-1.5)*0.24;put(CYL,Math.sin(a)*2.9,0,1.4+Math.cos(a)*1.9,PI/2,a,0,1.0,2.6,1.0,WH,0,.6)}put(CYL,-s*2.5,0,0.6,PI/2,-s*1.0,0,1.0,2.0,1.0,WH,0,.6)}
else{sph(0,0,0,3.9,3.1,3.9,WH,0,.8,0,1);for(let i=0;i<4;i++)sph(-1.2+i*0.8,0.9,1.5,1.0,1.0,1.1,C.stoneL,0,.6);sph(-s*1.7,-0.2,0.9,1.3,1.2,1.6,C.stoneL,0,.6)}
put(CYL,0,0.1,-2.5,PI/2,0,0,4.6,1.4,4.6,C.inkD,0,.6);
if(b.phase>2&&!palm){const fw=st==='sweep'||st==='slash';mPush();mT(0,0.2,0.6);if(!fw)mRX(-PI/2+0.25);else if(st==='slash'&&b.stT%(BT.shiro.cuTel+0.5)<BT.shiro.cuTel)mRX(-0.5);
 put(CYL,0,0,1.6,PI/2,0,0,0.9,3.2,0.9,C.red);for(let i=0;i<4;i++)put(BOX,0,0,0.6+i*0.7,0,0,PI/4,0.75,0.75,0.12,C.inkD);put(CYL,0,0,3.4,PI/2,0,0,2.4,0.3,2.4,C.gold,0,.8);
 const L=13;gId=nid();put(BOX,0,0,3.6+L/2,0,0,0,0.32,1.25,L,C.stoneL,0,1);put(PYR,0,-0.15,3.6+L+0.9,PI/2,0,0,0.32,1.8,1.1,C.stoneL,0,1);gId=0;box(0,0.45,3.6+L/2,0.36,0.3,L*0.98,C.gunD);mPop()}}
function drawShiro(b){const yo=b.yo,t=b.t,ph=b.phase,WH=C.paper,brk=b.st==='brk'?b.stT:9,fl=b.flash>0||brk<0.25&&Math.sin(brk*60)>0?0.45:0,NF=F_UNLIT|F_NOCAST;gTint=fl;
put(CYL,0,0.1,-21.5,0,0,0,27,0.1,13,C.inkD,0,0,F_NOCAST);for(let i=0;i<6;i++){const a=i*1.05+t*0.3;sph(Math.cos(a)*11.5,0.1,-21.5+Math.sin(a)*5.5,2.2+Math.sin(t*2+i)*0.6,0.9,2.2,C.inkD)}
mPush();mT(0,yo,-27);mS(2.1,2.1,2.1);gId=nid();sph(0,4.2,0,11,10,8,WH,0,.6,0,1);sph(b.hx,8.6,0.2,9.5,6.5,6.5,WH,0,.6,0,1);sph(-4.4+b.hx,9.8,0.3,4.4,3.8,4.2,WH,0,.6,0,1);sph(4.4+b.hx,9.8,0.3,4.4,3.8,4.2,WH,0,.6,0,1);gId=0;
for(const d of[-1,1]){put(SPH,d*1.7+b.hx,6.6,3.0,0,0,d*0.3,2.6,1.4,0.5,C.stoneL);put(BOX,d*2.4+b.hx,8.3,3.2,0,0,d*0.15,0.12,3.0,0.3,C.stoneD)}
put(CYL,0,5.4,0,0,0,0,11.2,1.1,8.4,C.inkD,6);sph(0,5.4,4.2,1.8,1.4,1.1,C.inkD,6);box(0,2.4,3.9,3.4,4.4,0.3,C.inkD);put(CYL,0,2.4,4.1,PI/2,0,0,2.4,0.1,2.4,WH);tomoe(0,2.4,4.2,1.0,C.inkD,t*0.6);
shSeal(b,-1,ph);shSeal(b,1,ph);
for(let k=0;k<(ph>1?1:0)+(ph>2?1:0);k++)for(const c of SH_CRK[k])put(BOX,c[0]+b.hx,c[1],c[2],0,0,c[3],0.14,c[4],0.3,C.inkD);
mPush();mT(b.hx*1.3,12.4+Math.sin(t*1.3)*0.15,0.8);mRX(0.12+(brk<SH_BRK?-0.35*Math.sin(Math.min(1,brk/SH_BRK)*PI):0)+(b.st==='suck'?-0.2:0));
sph(0,0,0,5.0,5.2,4.8,WH,0,.6,0,1);sph(0,-1.0,0.9,4.6,3.4,3.6,WH,0,.6,0,1);
for(const d of[-1,1]){put(SPH,d*1.1,0.35,2.3,0,0,d*0.32,1.5,0.85,0.4,C.inkD);if(ph>2)sph(d*1.1,0.35,2.48,0.32,0.32,0.12,C.red,0,0,F_UNLIT);put(BOX,d*1.2,1.0,2.25,0,0,d*0.42,1.9,0.36,0.5,C.stoneL);
 put(CONE,d*2.3,2.3,-0.2,0,0,-d*0.95,1.3,2.6,1.3,C.stoneL,0,.8);put(CONE,d*3.75,3.75,-0.2,0,0,-d*0.25,0.9,2.6,0.9,C.stoneL,0,.8)}
const mo=0.25+b.mouth*0.95;sph(0,-1.45-mo*0.4,2.2,2.7,0.7+mo*1.4,0.7,C.inkD);
for(let i=0;i<4;i++)put(CONE,-0.75+i*0.5,-1.2-mo*0.1,2.5,PI,0,0,0.3,0.55,0.25,C.white);for(const d of[-1,1])put(CONE,d*0.85,-1.75-mo*0.7,2.45,0,0,0,0.34,0.7,0.26,C.white);
if(ph<3){box(0,1.75,2.3,2.0,1.6,0.4,C.inkD,0,.6);box(0,1.75,2.52,0.75,1.4,0.1,C.paper);for(let i=0;i<3;i++)box(0,2.2-i*0.42,2.58,0.45,0.08,0.06,C.red)}
else{put(CYL,0,1.75,2.25,PI/2-0.15,0,0,2.2,0.4,2.2,WH);tomoe(0,1.75,2.5,1.0,C.red,-t*3,F_UNLIT);const k=2.5+Math.sin(t*7)*0.3;put(RING,0,1.75,2.62,PI/2-0.15,0,0,k,1,k,C.red,0,0,NF);
 for(const c of[[-1.8,2.6,0.6,1.4],[1.9,2.2,-0.5,1.2],[1.4,-0.4,0.3,1.0]])put(BOX,c[0],c[1],2.2,0,0,c[2],0.1,c[3],0.3,C.inkD)}
mPop();mPop();
const bi=BI;BI=WH;gTint=fl;drawBossArm(b,-1);drawBossArm(b,1);BI=bi;gTint=0;bkTele(b);shTele(b)}
// telegraphs of the boss's own state (world space) that bkTele does not cover
function shTele(b){const t=b.t,NF=F_UNLIT|F_NOCAST;if(b.st==='up'){const s=6+Math.sin(t*20)*0.8;put(RING,b.tx,0.12,b.tz,0,0,0,s,1,s,C.red,0,0,NF);put(RING,b.tx,0.12,b.tz,0,0,0,s*0.5,1,s*0.5,C.red,0,0,NF)}}
function shDraw(){if(!shz.length)return;const K=BT.shiro,NF=F_UNLIT|F_NOCAST;
for(const h of shz){
 if(h.k==='suck'){const z0=K.suZ;if(h.t<0){if(Math.sin(now*24)>-0.2){put(RING,0,0.13,z0,0,0,0,K.suR*2,1,K.suR*2,C.red,0,0,NF);put(RING,0,0.13,z0,0,0,0,K.suR*1.2,1,K.suR*1.2,C.red,0,0,NF)}continue}
  put(CYL,0,0.09,z0,0,0,0,K.suR*2,0.02,K.suR*2,C.inkD,0,0,NF|F_NOEDGE);put(RING,0,0.13,z0,0,0,0,K.suR*2,1,K.suR*2,C.red,0,0,NF);
  for(let i=0;i<26;i++){const a=(i/26-0.5)*2.9+Math.sin(i*7.3)*0.05,r=4+((-now*20+i*9.7)%30+30)%30,y=0.6+(i%4)*1.3+r*0.05;mPush();mT(Math.sin(a)*r,y,z0+Math.cos(a)*r);mRY(a);mS(0.14,0.14,2.6+r*0.06);emit(BOX,C.white,0,0,NF,0);mPop()}
  bill(BURST,0,3,z0-2,4+Math.sin(now*20)*0.5,-now*8,C.inkD,NF)}
 else if(h.k==='koma'){const P=h.L.P,n=h.L.waves.length,on=h.w<n?h.L.waves[h.w]:null,tl=h.w?K.koTel[1]:K.koTel[0],warn=on&&h.t>-0.2,blink=warn&&Math.sin(now*(h.t>tl-0.5?40:16))>-0.3;
  for(let j=0;j<P.length;j++){const p=P[j],zm=(p.z0+p.z1)/2,dz=p.z1-p.z0,e0=shPx(p,p.z0),e1=shPx(p,p.z1),xm0=(e0[0]+e1[0])/2,xm1=(e0[1]+e1[1])/2;
   // panel frame: thick ink lines (the gutters)
   box((xm0+xm1)/2,0.13,p.z0+0.15,xm1-xm0,0.04,0.42,C.inkD,0,0,NF);box((xm0+xm1)/2,0.13,p.z1-0.15,xm1-xm0,0.04,0.42,C.inkD,0,0,NF);
   for(const[xa,xb]of[[e0[0],e1[0]],[e0[1],e1[1]]]){mPush();mT((xa+xb)/2,0.13,zm);mRY(Math.atan2(xb-xa,dz));mS(0.42,0.04,Math.hypot(xb-xa,dz));emit(BOX,C.inkD,0,0,NF,0);mPop()}
   const inn=(c,y,pad)=>{mPush();mT((xm0+xm1)/2,y,zm);mS(xm1-xm0-pad*2,0.02,dz-pad*2);emit(BOX,c,0,0,NF|F_NOEDGE,0);mPop()};
   if(warn&&on[j]&&blink)inn(h.t>tl-0.5?C.white:C.red,0.11,0.5);
   if(h.cut&&h.cut[j]&&h.ct<0.6){const u=h.ct,k=u<0.1?easeOut(u/0.1):1-sat((u-0.18)/0.25),y=7*k;if(y>0.05){inn(C.white,0.12,0.4);mPush();mT((xm0+xm1)/2,y/2,zm);mS(xm1-xm0-1,y,dz-1);emit(BOX,C.white,0,0,NF,0);mPop()}}}}
 else if(h.k==='cut'){const a=h.a,s=Math.sin(a),c=Math.cos(a);mPush();mT(s*27,0.12,K.cuZ+c*27);mRY(a);
  if(h.t<0){if(Math.sin(now*(h.t>-0.3?40:16))>-0.3){mS(K.cuW*2,0.02,46);emit(BOX,C.red,0,0,NF,0)}}else{const k=1-sat((h.t-0.7)/0.7);if(k>0){mS(K.cuW*1.4*k,0.03,46);emit(BOX,C.white,0,0,NF,0)}}mPop()}}}
// HUD under the boss bar: where the stage lines are, and which part to shoot
function shHUD(b){ctx.save();ctx.strokeStyle=INK;ctx.lineWidth=4;for(const v of SH_TH){const x=480+520*v;ctx.beginPath();ctx.moveTo(x+6,28);ctx.lineTo(x-6,52);ctx.stroke()}ctx.restore();
if(b.st==='brk'||b.st==='rise')return;const k=(now*3|0)%2;txt(['胸の黒い印を撃て！','胸の赤い印を撃て！','額の巴を撃て！'][b.phase-1],740,100,22,k?'#ffd91a':'#fff',INK,6);txt('第'+'一二三'[b.phase-1]+'段階',440,70,20,'#fff',INK,5)}
// hit spheres [x,y,z,r,×damage]: the live weak point first (aim assist and the demo AI aim at the first one)
function shSph(e){const yo=e.yo,ph=e.phase,hx=e.hx,W=SH_WEAK,B=SH_BODY,seal=s=>[s*4.62+2.1*hx,17.6+yo,-20.4,2.3],top=[2.73*hx,29.6+yo,-20.1,2.2],
 L=[[2.7*hx,26+yo,-25.3,5.6,B],[0,13+yo,-27,10,B],[e.hL.x,e.hL.y,e.hL.z,2.2,B],[e.hR.x,e.hR.y,e.hR.z,2.2,B]];
if(ph===1)return[[...seal(-1),W],[...seal(1),B],[...top,B],...L];if(ph===2)return[[...seal(1),W],[...seal(-1),B],[...top,B],...L];return[[...top,W],[...seal(-1),B],[...seal(1),B],...L]}
