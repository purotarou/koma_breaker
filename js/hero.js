'use strict';
// ================= HERO MODEL (主人公 カケル) =================
// Model: blender/src/komabure_chara_kakeru.glb (Tripo) -> blender/hero_kakeru.blend: the parts joined, made solid and closed
// (solidify + voxel remesh, so no open sleeve / neck edges to see through), ~8,000 triangles, one new UV map, the Tripo textures baked
// into one image (kk_tex, the face gets extra texels), and a 16-bone rig (KK_Rig) with automatic weights
// -> assets/hero_kakeru.glb (tools/blender_export_hero.py).
// The GLB carries: one vertex set (POSITION/NORMAL/TEXCOORD_0/JOINTS_0/WEIGHTS_0) with two index lists, 'head' (kb_mat 10, textured)
// and 'body' (kb_mat 11, textured, the coat red is swapped for the player colour PCOL[slot] in the shader), the texture,
// and extras.kb_bones = [{name, parent, head}] (rest-pose joint positions, model space: up +Y, faces +Z, the character's right is -X).
// Every frame each drawn hero is posed in code (walk cycle, aim, two-bone IK for the arms holding the gun), skinned on the CPU
// and written into one of a small pool of vertex buffers (addIdxPrim in gfx.js), then drawn with the usual outline / tone pipeline.
// drawHero() (players.js) uses this once the model and texture are loaded and falls back to the box-built hero otherwise.
// ?hero=1 lines up four test heroes in front of the camera (front / side / back / walking) to check the model.
const HERO={ready:false};
loadGlbBuf('assets/hero_kakeru.glb').then(heroLoad)
 .catch(e=>console.warn('[hero] assets/hero_kakeru.glb failed to load, drawing the box-built hero:',e));
function heroLoad(buf){const g=glbParse(buf),J=g.j,pr=J.meshes[0].primitives,a=pr[0].attributes,H=HERO;
H.P=glbAcc(g,a.POSITION).v;H.N=glbAcc(g,a.NORMAL).v;H.J=glbAcc(g,a.JOINTS_0).v;H.W=glbAcc(g,a.WEIGHTS_0).v;H.nv=H.P.length/3;
H.idx=pr.map(p=>glbAcc(g,p.indices).v);
H.uvb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,H.uvb);gl.bufferData(gl.ARRAY_BUFFER,glbAcc(g,a.TEXCOORD_0).v,gl.STATIC_DRAW);
const B=J.extras.kb_bones;H.nb=B.length;H.par=B.map(b=>b.parent);H.head=B.map(b=>b.head);H.bi={};B.forEach((b,i)=>H.bi[b.name]=i);
H.L=B.map(()=>new Float32Array(9));H.GR=B.map(()=>new Float32Array(9));H.GT=B.map(()=>[0,0,0]);H.S=new Float32Array(H.nb*12);
const hd=n=>H.head[H.bi[n]],sub=(p,q)=>[p[0]-q[0],p[1]-q[1],p[2]-q[2]];
H.arm={};for(const s of['L','R']){const u=sub(hd('forearm_'+s),hd('upperarm_'+s)),f=sub(hd('hand_'+s),hd('forearm_'+s));
 H.arm[s]={l1:Math.hypot(...u),l2:Math.hypot(...f),d1:v3n(u),d2:v3n(f)}}
H.pool=[];H.used=0;H.at=-1;
const im=J.images[0],bv=J.bufferViews[im.bufferView],o=bv.byteOffset||0,blob=new Blob([g.bin.subarray(o,o+bv.byteLength)],{type:im.mimeType});
const done=img=>{setModelTex(img);H.ready=true};
(self.createImageBitmap?createImageBitmap(blob):Promise.reject()).then(done).catch(()=>{const img=new Image();img.onload=()=>done(img);img.src=URL.createObjectURL(blob)})}
// ---- tiny 3x3 maths (column-major, like M) ----
function v3n(v){const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l]}
function m3id(m){m.fill(0);m[0]=m[4]=m[8]=1;return m}
function m3mul(a,b,o){const r=new Float32Array(9);for(let c=0;c<3;c++)for(let k=0;k<3;k++)r[c*3+k]=a[k]*b[c*3]+a[3+k]*b[c*3+1]+a[6+k]*b[c*3+2];o.set(r);return o}
function m3v(m,v){return[m[0]*v[0]+m[3]*v[1]+m[6]*v[2],m[1]*v[0]+m[4]*v[1]+m[7]*v[2],m[2]*v[0]+m[5]*v[1]+m[8]*v[2]]}
function m3T(m){return new Float32Array([m[0],m[3],m[6],m[1],m[4],m[7],m[2],m[5],m[8]])}
function m3axis(ax,a){const c=Math.cos(a),s=Math.sin(a),[x,y,z]=ax,t=1-c;return new Float32Array([t*x*x+c,t*x*y+s*z,t*x*z-s*y,t*x*y-s*z,t*y*y+c,t*y*z+s*x,t*x*z+s*y,t*y*z-s*x,t*z*z+c])}
// rotation taking unit vector a onto unit vector b (shortest arc)
function m3from(a,b){const ax=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],s=Math.hypot(...ax),c=a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
if(s<1e-6)return c>0?m3id(new Float32Array(9)):m3axis(Math.abs(a[0])<0.9?v3n([0,-a[2],a[1]]):v3n([-a[2],0,a[0]]),PI);return m3axis([ax[0]/s,ax[1]/s,ax[2]/s],Math.atan2(s,c))}
const HX=[1,0,0],HY=[0,1,0],HZ=[0,0,1];
function hRot(n,ax,a){if(!a)return;const L=HERO.L[HERO.bi[n]];m3mul(L,m3axis(ax,a),L)}
// two-bone IK: shoulder s, target t, lengths l1/l2, pole p (direction the elbow bends towards) -> elbow, wrist
function ik2(s,t,l1,l2,p){let d=[t[0]-s[0],t[1]-s[1],t[2]-s[2]],dl=Math.hypot(...d);const u=v3n(d);dl=clamp(dl,Math.abs(l1-l2)+1e-3,l1+l2-1e-3);
const a=(l1*l1+dl*dl-l2*l2)/(2*dl),h=Math.sqrt(Math.max(0,l1*l1-a*a)),pu=p[0]*u[0]+p[1]*u[1]+p[2]*u[2],v=v3n([p[0]-u[0]*pu,p[1]-u[1]*pu,p[2]-u[2]*pu]);
const e=[s[0]+u[0]*a+v[0]*h,s[1]+u[1]*a+v[1]*h,s[2]+u[2]*a+v[2]*h];return{e,w:[s[0]+u[0]*dl,s[1]+u[1]*dl,s[2]+u[2]*dl]}}
// ---- pose + skin one hero into a pool buffer; returns its two prim indices ----
function heroGlobals(rootY){const H=HERO;for(let b=0;b<H.nb;b++){const p=H.par[b],h=H.head[b];
 if(p<0){H.GR[b].set(H.L[b]);H.GT[b]=[h[0],h[1]+rootY,h[2]];continue}
 const hp=H.head[p],r=m3v(H.GR[p],[h[0]-hp[0],h[1]-hp[1],h[2]-hp[2]]),tp=H.GT[p];m3mul(H.GR[p],H.L[b],H.GR[b]);H.GT[b]=[tp[0]+r[0],tp[1]+r[1],tp[2]+r[2]]}}
// put an arm on the IK solution: upper arm / forearm world rotations follow the solved directions (forearm twist carried on from the upper arm)
function heroArm(s,tgt,pole,handTw){const H=HERO,A=H.arm[s],iu=H.bi['upperarm_'+s],ifo=H.bi['forearm_'+s],ih=H.bi['hand_'+s],sh=H.GT[iu];
const k=ik2(sh,tgt,A.l1,A.l2,pole),Ru=m3from(A.d1,v3n([k.e[0]-sh[0],k.e[1]-sh[1],k.e[2]-sh[2]]));
const cur=m3v(Ru,A.d2),Rf=m3mul(m3from(cur,v3n([k.w[0]-k.e[0],k.w[1]-k.e[1],k.w[2]-k.e[2]])),Ru,new Float32Array(9));
H.GR[iu]=Ru;H.GR[ifo]=Rf;H.GT[ifo]=k.e;const fd=v3n([k.w[0]-k.e[0],k.w[1]-k.e[1],k.w[2]-k.e[2]]);
H.GR[ih]=m3mul(m3axis(fd,handTw),Rf,new Float32Array(9));H.GT[ih]=k.w}
function heroSkin(){const H=HERO,S=H.S;for(let b=0;b<H.nb;b++){const R=H.GR[b],h=H.head[b],t=H.GT[b],o=b*12,rh=m3v(R,h);S.set(R,o);S[o+9]=t[0]-rh[0];S[o+10]=t[1]-rh[1];S[o+11]=t[2]-rh[2]}
if(H.at!==now){H.at=now;H.used=0}
let e=H.pool[H.used];if(!e){const vbo=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,H.nv*24,gl.DYNAMIC_DRAW);
 e=H.pool[H.used]={vbo,out:new Float32Array(H.nv*6),pi:H.idx.map(ix=>addIdxPrim(vbo,H.uvb,ix))}}H.used++;
const P=H.P,N=H.N,J=H.J,W=H.W,O=e.out;
for(let v=0,n=H.nv;v<n;v++){const v3=v*3,v4=v*4,px=P[v3],py=P[v3+1],pz=P[v3+2],nx=N[v3],ny=N[v3+1],nz=N[v3+2];let ax=0,ay=0,az=0,bx=0,by=0,bz=0;
 for(let k=0;k<4;k++){const w=W[v4+k];if(w===0)continue;const o=J[v4+k]*12;
  ax+=w*(S[o]*px+S[o+3]*py+S[o+6]*pz+S[o+9]);ay+=w*(S[o+1]*px+S[o+4]*py+S[o+7]*pz+S[o+10]);az+=w*(S[o+2]*px+S[o+5]*py+S[o+8]*pz+S[o+11]);
  bx+=w*(S[o]*nx+S[o+3]*ny+S[o+6]*nz);by+=w*(S[o+1]*nx+S[o+4]*ny+S[o+7]*nz);bz+=w*(S[o+2]*nx+S[o+5]*ny+S[o+8]*nz)}
 const q=v*6;O[q]=ax;O[q+1]=ay;O[q+2]=az;O[q+3]=bx;O[q+4]=by;O[q+5]=bz}
gl.bindBuffer(gl.ARRAY_BUFFER,e.vbo);gl.bufferSubData(gl.ARRAY_BUFFER,0,O);return e.pi}
// Aim frame: pivot in front of the chest, pitched with the view. The gun and both hand targets live in it.
const HERO_AIM=[-0.04,1.45,0.02],HERO_GUN_X=-0.29;// gun on the right-shoulder side so the over-the-shoulder camera sees it
// Same contract as the box hero: o = {x,y,z,yaw,pitch,slot,wt,mv,dead,flash}; sets the muzzle point o.gx/gy/gz.
function drawHeroGlb(o){const H=HERO,mv=clamp(o.mv||0,0,1),ph=o.wt*10,s=Math.sin(ph),c=Math.cos(ph),air=o.y>0.05&&!o.dead?1:0,pit=clamp(o.pitch,-1.1,1.1);
for(const L of H.L)m3id(L);
// legs: thigh forward = -X rotation; the knee bends the shin backwards (+X), most in the middle of the swing; the foot stays near level
const sw=0.62*mv*(1-air),tR=-s*sw,tL=s*sw,kR=mv*(1-air)*(0.12+0.95*Math.max(0,c)),kL=mv*(1-air)*(0.12+0.95*Math.max(0,-c));
hRot('thigh_R',HX,tR-air*0.55);hRot('shin_R',HX,kR+air*1.0);hRot('foot_R',HX,-(tR+kR)*0.55-air*0.3);
hRot('thigh_L',HX,tL-air*0.2);hRot('shin_L',HX,kL+air*0.6);hRot('foot_L',HX,-(tL+kL)*0.55-air*0.2);
// hips sway with the stride, body leans in a little when running, chest turns back against the hips and follows part of the aim pitch
hRot('hips',HY,0.16*s*mv);hRot('hips',HX,0.07*mv);hRot('spine',HY,-0.1*s*mv);hRot('chest',HY,-0.08*s*mv);
hRot('chest',HX,-pit*0.3+0.018*Math.sin(now*2.3));hRot('head',HX,-pit*0.45);
const bob=-0.035*mv+0.06*mv*Math.abs(c)*(1-air),wp=typeof wpReady==='function'&&wpReady(o.wp|0)?o.wp|0:-1;if(wp>=0)wpHeroBody(o,wp);// weapon swings twist / bend the body (weapons.js)
heroGlobals(bob);
// arms: both hands on the gun, solved in the aim frame (pitch about the pivot); elbows drop down and out
const R=m3axis(HX,-pit),A=[HERO_AIM[0],HERO_AIM[1]+bob,HERO_AIM[2]],at=p=>{const r=m3v(R,p);return[A[0]+r[0],A[1]+r[1],A[2]+r[2]]};
let wfr=null;if(wp>=0)wfr=wpHeroArms(o,wp,A,pit);// equipped weapon: its own arm pose (weapons.js)
else{heroArm('R',at([HERO_GUN_X+0.02,-0.14,0.06]),[-1,-0.35,-0.1],-1.2);
heroArm('L',at([HERO_GUN_X+0.08,-0.11,0.24]),[0.6,-0.8,0.0],1.3)}
const pi=heroSkin();
mPush();mT(o.x,o.y,o.z);mRY(o.yaw+PI);if(o.dead){mT(0,0.3,0);mRX(-1.45)}gTint=o.flash>0?1:0;
gId=nid();emit(pi[0],C.white,10,0,0,0);emit(pi[1],PCOL[o.slot],11,0,0,0);
// gun (aim frame): body, grip under the right hand, barrel and a gold muzzle
if(wfr)wpHeroDraw(o,wp,wfr);else{mPush();mT(A[0],A[1],A[2]);mRX(-pit);const gx=HERO_GUN_X,gy=-0.06;
box(gx,gy,0.3,0.09,0.13,0.5,C.gunM);box(gx,gy-0.1,0.15,0.07,0.16,0.08,C.gunD);put(BOX,gx,gy-0.085,0.22,0.3,0,0,0.02,0.06,0.02,C.gunD);box(gx,gy-0.13,0.23,0.035,0.014,0.11,C.gold);box(gx,gy-0.095,0.285,0.035,0.08,0.014,C.gold);box(gx,gy-0.09,0.36,0.07,0.12,0.06,C.gunD);
put(CYL,gx,gy+0.01,0.66,PI/2,0,0,0.07,0.26,0.07,C.gunD);put(CONE,gx,gy+0.01,0.84,PI/2,0,0,0.09,0.12,0.09,C.gold);
const mz=[gx,gy+0.01,0.92];o.gx=M[0]*mz[0]+M[4]*mz[1]+M[8]*mz[2]+M[12];o.gy=M[1]*mz[0]+M[5]*mz[1]+M[9]*mz[2]+M[13];o.gz=M[2]*mz[0]+M[6]*mz[1]+M[10]*mz[2]+M[14];mPop()}
gId=0;gTint=0;mPop()}
// ---- ?hero=1: test line-up in front of the camera ----
// &wp=N holds weapon N (WPN index, weapons.js), &act=1 loops its attack
const HERO_Q=new URLSearchParams(location.search),HERO_TEST=HERO_Q.get('hero')==='1'?[0,1,2,3].map(s=>({slot:s,x:0,y:0,z:0,yaw:0,pitch:0,wt:0,mv:0,dead:false,flash:0,fireT:0,sp:0,wp:+(HERO_Q.get('wp')||0),ak:0,at:9})):null;
function drawHeroTest(){if(!HERO_TEST)return;const fx=-Math.sin(cam.yaw),fz=-Math.cos(cam.yaw),rx=Math.cos(cam.yaw),rz=-Math.sin(cam.yaw);
HERO_TEST.forEach((o,i)=>{const s=(i-1.5)*1.9;o.x=cam.x+fx*5.2+rx*s;o.z=cam.z+fz*5.2+rz*s;o.y=0;
 o.yaw=cam.yaw+PI+[0,PI/2,PI,0.5][i];if(i===3){o.wt+=GDT;o.mv=1}
 if(HERO_Q.get('act')==='1'&&WPN[o.wp]){const k=WPN[o.wp].kind,c=(now+i*0.35)%1.6;o.ak=k==='katana'?(((now+i*0.35)/1.6|0)%2?2:1):k==='hammer'?(c<0.7?3:4):k==='bomb'?5:0;o.at=k==='hammer'&&c>=0.7?c-0.7:c;o.hc=1;if(W2K[k])w2HeroTest(o,k,i);o.fireT=(k==='gun'||k==='rail')&&c%0.2<0.05?0.05:0}
 drawHero(o)})}
