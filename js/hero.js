'use strict';
// ================= HERO MODEL (主人公 カケル) =================
// Model: blender/src/komabure_chara_kakeru.glb (Tripo, split into parts) -> blender/hero_kakeru.blend (parts joined to 6,
// decimated, texture colours turned into flat materials, pivots at the joints) -> assets/hero_kakeru.glb (tools/blender_export_stage.py).
// Nodes: Hero_Root > Body (hip) / Head (neck) / Arm_R・Arm_L (shoulders, T-pose: arms point -X / +X) / Leg_R・Leg_L (hips).
// The model faces +Z and its right side is -X. Material kbh_team (the coat) is swapped for the player colour PCOL[slot].
// drawHero() (players.js) uses this when it is loaded and falls back to the box-built hero otherwise.
// ?hero=1 lines up four test heroes in front of the camera (front / side / back / walking) to check the model.
const HERO={ready:false,parts:{}};
loadGlbBuf('assets/hero_kakeru.glb').then(heroLoad)
 .catch(e=>console.warn('[hero] assets/hero_kakeru.glb failed to load, drawing the box-built hero:',e));
function heroLoad(buf){const g=glbParse(buf),J=g.j,geo=new Map();
const primOf=p=>{const key=p.attributes.POSITION+'/'+p.attributes.NORMAL+'/'+p.indices;if(geo.has(key))return geo.get(key);
 const P=glbAcc(g,p.attributes.POSITION).v,N=glbAcc(g,p.attributes.NORMAL).v,I=glbAcc(g,p.indices).v,mb=new MB(),v=k=>[P[k*3],P[k*3+1],P[k*3+2]],n=k=>[N[k*3],N[k*3+1],N[k*3+2]];
 for(let t=0;t<I.length;t+=3)mb.tri(v(I[t]),v(I[t+1]),v(I[t+2]),n(I[t]),n(I[t+1]),n(I[t+2]));const pi=addPrim(mb);geo.set(key,pi);return pi};
const matOf=i=>{const m=(J.materials||[])[i]||{},x=m.extras||{},bc=(m.pbrMetallicRoughness||{}).baseColorFactor||[1,1,1,1];return{team:m.name==='kbh_team',c:[bc[0],bc[1],bc[2]],mat:x.kb_mat|0,gloss:+x.kb_gloss||0,fl:x.kb_flags|0,rim:+x.kb_rim||0}};
for(const n of J.nodes){if(n.mesh===undefined)continue;const nm=n.name.replace(/^Hero_/,'');
 HERO.parts[nm]={t:n.translation||[0,0,0],items:J.meshes[n.mesh].primitives.map(p=>({pi:primOf(p),...matOf(p.material)}))}}
HERO.ready=['Body','Head','Arm_R','Arm_L','Leg_R','Leg_L'].every(k=>HERO.parts[k])}
// one part: move to its joint, rotate (pose fn), draw every colour piece with one outline ID
function heroPart(nm,col,pose){const p=HERO.parts[nm];mPush();mT(p.t[0],p.t[1],p.t[2]);if(pose)pose();gId=nid();
for(const it of p.items)emit(it.pi,it.team?col:it.c,it.mat,it.gloss,it.fl,it.rim);gId=0;mPop()}
// Same contract as the box hero: o = {x,y,z,yaw,pitch,slot,wt,mv,dead,flash}; sets the muzzle point o.gx/gy/gz.
// Arms come forward from the T-pose to hold the gun in the right hand; legs swing with o.wt while moving.
function drawHeroGlb(o){const c=PCOL[o.slot],wk=Math.sin(o.wt*11)*o.mv,bob=Math.abs(Math.cos(o.wt*11))*o.mv*0.05,ap=0.14-o.pitch;
mPush();mT(o.x,o.y+bob,o.z);mRY(o.yaw+PI);if(o.dead){mT(0,0.3,0);mRX(-1.45)}gTint=o.flash>0?1:0;
heroPart('Leg_R',c,()=>mRX(-wk*0.7));heroPart('Leg_L',c,()=>mRX(wk*0.7));
heroPart('Body',c,()=>mRY(wk*0.08));
heroPart('Head',c,()=>mRX(-o.pitch*0.4));
heroPart('Arm_R',c,()=>{mRX(ap);mRY(PI/2+0.18)});
heroPart('Arm_L',c,()=>{mRX(ap-0.05);mRY(-(PI/2+0.62))});
// gun in the right hand (shoulder at x -0.3, y 1.46)
mPush();mT(-0.3,1.46,0);mRX(-o.pitch);mT(0,-0.1,0);
box(0.1,0,0.62,0.1,0.16,0.5,C.gunM);put(CYL,0.1,0.04,0.94,PI/2,0,0,0.08,0.3,0.08,C.gunD);put(CONE,0.1,0.04,1.14,PI/2,0,0,0.1,0.14,0.1,C.gold);
o.gx=M[0]*0.1+M[4]*0.04+M[8]*1.24+M[12];o.gy=M[1]*0.1+M[5]*0.04+M[9]*1.24+M[13];o.gz=M[2]*0.1+M[6]*0.04+M[10]*1.24+M[14];mPop();
gTint=0;mPop()}
// ---- ?hero=1: test line-up in front of the camera ----
const HERO_TEST=new URLSearchParams(location.search).get('hero')==='1'?[0,1,2,3].map(s=>({slot:s,x:0,y:0,z:0,yaw:0,pitch:0,wt:0,mv:0,dead:false,flash:0,fireT:0,sp:0})):null;
function drawHeroTest(){if(!HERO_TEST)return;const fx=-Math.sin(cam.yaw),fz=-Math.cos(cam.yaw),rx=Math.cos(cam.yaw),rz=-Math.sin(cam.yaw);
HERO_TEST.forEach((o,i)=>{const s=(i-1.5)*1.9;o.x=cam.x+fx*5.2+rx*s;o.z=cam.z+fz*5.2+rz*s;o.y=0;
 o.yaw=cam.yaw+PI+[0,PI/2,PI,0.5][i];if(i===3){o.wt+=GDT;o.mv=1}drawHero(o)})}
