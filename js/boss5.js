'use strict';
// ================= 5面ボス 白抜魔王シロヌキ (STORY.md 5「5面の3形態」) =================
// Model: blender/src/komabure_chara_last_boss3*.glb (the white oni + two swords) -> blender/boss_shiro.blend (made solid and closed, ~11,700
// triangles, one baked 2048 px texture, a skin mask, the 16-bone rig of the hero, the swords weighted to the hands)
// -> assets/boss_shiro.glb (tools/blender_export_boss.py). Posed and skinned on the CPU with the hero's helpers (js/hero.js, H = SN).
// The shader recolours his skin per form (kb_mat 12 white / 13 one colour / 14 his right half red, left half black: js/gfx.js).
// Every form has its own HP bar (BT.shiro.hp x hpF[form]). When a bar runs out the next form comes ('brk', ~2.6 s, no damage, he speaks,
// the bar fills up again); only the third form can die (kill() in players.js keeps him at 1 HP before that).
//   第1形態  a red-and-black giant at the north end (like the bosses of stages 1-3: hands hL / hR, updBoss2 in boss123.js). His red arm
//            (hL, world -x) hits with the open palm (fire cross), his black arm (hR) with the fist (shock rings). Weak point: 胸の黒い印.
//   第2形態  the black seal breaks and he splits in two giants, red (x<0, hand hL: palms, fire balls, fire breath, 火の線の回転) and black
//            (x>0, hand hR: fists, ink, 墨の波). One HP bar. Weak point: the 額の巴 of both.
//   第3形態  the two melt into ink and the original white oni drops in, a little bigger than the hero, with a sword in each hand. He runs
//            around the yard (b.mob = mobile boss like the bell monk; b.x / b.z / b.yaw are synced in m.b) and throws fast, wide sword
//            slashes (enemy shot k 13: jump over it or dash aside), dashes through you, leaps into a ring shock, cuts lines on the ground,
//            and does 白抜き (コマ割り: the lit panels burst white). No weak point.
// Hazards started by FXE events are checked by every peer for its own player (local list shz: suck / koma / cut).
// ---- tuning (目安) ----
const SH_WEAK=2.5,SH_BODY=0.5,SH_BRK=2.6,
 SH_SAY=[['黒ト紅…','二ツニ分カレヨ!!'],['全テヲ','白紙ニ還ス!!']],
 SN_S=15,SN_Z=-30,SN_X2=11,SN_S3=1.15;// giant scale (height 28), giant feet z, the two giants' x in 第2形態, the white oni's scale (height 2.3)
BT.shiro={hp:9000,hpF:[1,1,0.8],cd:0.5,up:[0.7,0.55],hold:[0.85,0.65],slamDmg:34,up2:0.85,volN:[7,9],ballN:[6,7],ballDmg:17,sumN:[2,3],waveTel:0.9,waveN:[1,2],
 brTel:0.9,brN:[2,3],spinTel:1.1,spinW:0.62,spinGap:0.85,
 suTel:1.0,suDur:3.0,suV:3.8,suR:9,suDmg:[17,6],suZ:-14,          // 吸い込み (第1形態): telegraph, pull time, pull speed (m/s), hurt radius, damage near / far, centre z
 koTel:[2.0,1.4],koDmg:36,koN:[2,3],                               // 白抜き (第3形態): warning (first / later waves), damage, waves [普通, 極]
 cuTel:0.55,cuN:[3,4],cuW:1.8,cuDmg:27,                            // 地を裂く斬撃 (第3形態): warning, cuts [普通, 極], half width, damage
 reach:15,                                                         // how far from his feet a giant's fist can land (the arms stretch like ink)
 m3:{spd:7.6,keep:[5,9],cd:[0.25,0.5],m1:0.3,m2:0.45,m3:0.32,m4:0.42,m5:0.26,sv:30,dmg:20,dashV:24,dashT:0.4,dashDmg:22,spinR:3.4,spinDmg:20,ring:14,m5N:6},
 pats:[['fist','volley','palm','suck','double','fireball','fist','wave','summon','breath'],
  ['palm','fist','fireball','double','volley','spin','palm','breath','wave','summon'],
  ['m1','m2','m3','mcut','m1','koma','m4','m5','m1','summon'],
  ['fist','volley','pillar','palm','suck','double','fireball','rows','wave','summon','breath'],   // 極 (pillar / chase / rows: js/extreme.js)
  ['palm','fist','chase','fireball','double','volley','spin','rows','breath','wave','summon'],
  ['m1','m2','m3','mcut','m5','koma','m4','chase','m1','m5','summon']]};
const shz=[];
// ---- the model (loaded now, unpacked on first use: js/hero.js, which has the maths, loads after this file) ----
const SN={ready:false,buf:null};
loadGlbBuf('assets/boss_shiro.glb').then(b=>SN.buf=b).catch(e=>console.warn('[boss5] assets/boss_shiro.glb failed to load:',e));
function snInit(){const buf=SN.buf;SN.buf=null;try{const g=glbParse(buf),J=g.j,pr=J.meshes[0].primitives,a=pr[0].attributes,H=SN;
H.P=glbAcc(g,a.POSITION).v;H.N=glbAcc(g,a.NORMAL).v;H.J=glbAcc(g,a.JOINTS_0).v;H.W=glbAcc(g,a.WEIGHTS_0).v;H.nv=H.P.length/3;H.idx=pr.map(p=>glbAcc(g,p.indices).v);
H.uvb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,H.uvb);gl.bufferData(gl.ARRAY_BUFFER,glbAcc(g,a.TEXCOORD_0).v,gl.STATIC_DRAW);
const B=J.extras.kb_bones;H.nb=B.length;H.par=B.map(b=>b.parent);H.head=B.map(b=>b.head);H.bi={};B.forEach((b,i)=>H.bi[b.name]=i);
H.L=B.map(()=>new Float32Array(9));H.GR=B.map(()=>new Float32Array(9));H.GT=B.map(()=>[0,0,0]);H.S=new Float32Array(H.nb*12);
const hd=n=>H.head[H.bi[n]],sub=(p,q)=>[p[0]-q[0],p[1]-q[1],p[2]-q[2]];
H.arm={};for(const s of['L','R']){const u=sub(hd('forearm_'+s),hd('upperarm_'+s)),f=sub(hd('hand_'+s),hd('forearm_'+s));H.arm[s]={l1:Math.hypot(...u),l2:Math.hypot(...f),d1:v3n(u),d2:v3n(f)}}
H.pool=[];H.used=0;H.at=-1;let n=0;
J.images.forEach((im,i)=>{const bv=J.bufferViews[im.bufferView],o=bv.byteOffset||0,blob=new Blob([g.bin.subarray(o,o+bv.byteLength)],{type:im.mimeType});
 const done=img=>{setBossTex(i,img);if(++n===J.images.length)H.ready=true};
 (self.createImageBitmap?createImageBitmap(blob):Promise.reject()).then(done).catch(()=>{const img=new Image();img.onload=()=>done(img);img.src=URL.createObjectURL(blob)})})}
catch(e){console.warn('[boss5] bad boss model:',e)}}
// spots on the model (rest pose, model space: height 2, faces +z, his right is -x): the chest marks, the forehead tomoe, the mouth
const SN_PT={markB:[-0.131,1.427,0.181],markR:[0.131,1.427,0.18],tomoe:[0,1.872,0.113],mouth:[0,1.7,0.2]};
// rotation that stretches by k along unit d (an ink arm getting longer)
function m3str(d,k){const m=new Float32Array(9);for(let c=0;c<3;c++)for(let r=0;r<3;r++)m[c*3+r]=(r===c?1:0)+(k-1)*d[r]*d[c];return m}
// arm IK with stretch (up to maxK times its length); blade B (model space) turns the hand so the sword points that way across the forearm
function snArm(s,t,pole,maxK,B){const H=SN,A=H.arm[s],iu=H.bi['upperarm_'+s],ifo=H.bi['forearm_'+s],ih=H.bi['hand_'+s],sh=H.GT[iu];
const dl=Math.hypot(t[0]-sh[0],t[1]-sh[1],t[2]-sh[2]),k=clamp(dl/((A.l1+A.l2)*0.97),1,maxK),q=ik2(sh,t,A.l1*k,A.l2*k,pole);
const Ru=m3from(A.d1,v3n([q.e[0]-sh[0],q.e[1]-sh[1],q.e[2]-sh[2]])),fd=v3n([q.w[0]-q.e[0],q.w[1]-q.e[1],q.w[2]-q.e[2]]),Rf=m3mul(m3from(m3v(Ru,A.d2),fd),Ru,new Float32Array(9));
H.GR[iu]=m3mul(Ru,m3str(A.d1,k),new Float32Array(9));H.GR[ifo]=m3mul(Rf,m3str(A.d2,k),new Float32Array(9));H.GT[ifo]=q.e;H.GT[ih]=q.w;
if(B){// rest frame of the hand: along the arm (±x), blade +z. Target frame: along the forearm, blade = B without its part along the forearm
 const a1=[s==='R'?-1:1,0,0],b1=[0,0,1],c1=[a1[1]*b1[2]-a1[2]*b1[1],a1[2]*b1[0]-a1[0]*b1[2],a1[0]*b1[1]-a1[1]*b1[0]],bp=B[0]*fd[0]+B[1]*fd[1]+B[2]*fd[2];
 let b2=v3n([B[0]-fd[0]*bp,B[1]-fd[1]*bp,B[2]-fd[2]*bp]);const c2=[fd[1]*b2[2]-fd[2]*b2[1],fd[2]*b2[0]-fd[0]*b2[2],fd[0]*b2[1]-fd[1]*b2[0]];
 const T=new Float32Array([...fd,...b2,...c2]),Rr=new Float32Array([...a1,...b1,...c1]);H.GR[ih]=m3mul(T,m3T(Rr),new Float32Array(9))}
else H.GR[ih]=m3mul(m3axis(fd,s==='R'?-0.6:0.6),Rf,new Float32Array(9))}
// model -> world for one body (o: x,y,z,yaw,S)
const snW=(o,p)=>{const c=Math.cos(o.yaw),s=Math.sin(o.yaw);return[o.x+o.S*(p[0]*c+p[2]*s),o.y+o.S*p[1],o.z+o.S*(-p[0]*s+p[2]*c)]};
const snM=(o,w)=>{const c=Math.cos(o.yaw),s=Math.sin(o.yaw),x=(w[0]-o.x)/o.S,y=(w[1]-o.y)/o.S,z=(w[2]-o.z)/o.S;return[x*c-z*s,y,x*s+z*c]};
// a point fixed to bone n at rest p -> world (after posing)
function snBoneW(o,n,p){const H=SN,i=H.bi[n],h=H.head[i],r=m3v(H.GR[i],[p[0]-h[0],p[1]-h[1],p[2]-h[2]]),t=H.GT[i];return snW(o,[t[0]+r[0],t[1]+r[1],t[2]+r[2]])}
// pose + skin + draw one body. o: {x,y,z,yaw,S,mat,col, crouch,lean,twist,mouth,look, walk,mv, arms:{R,L}: {w:[world fist] | m:[model wrist], pole, B, k}, swords, die}
// Returns the world points the hit spheres use (cached on the boss: shSph reads them).
function snDraw(o){const H=SN;for(const L of H.L)m3id(L);
const a=o.crouch||0,mv=o.mv||0,ph=(o.walk||0)*9,s=Math.sin(ph),c=Math.cos(ph),air=o.air||0,sw=0.55*mv*(1-air);
const tR=-s*sw-a*0.55,tL=s*sw-a*0.55,kR=a*1.1+mv*(1-air)*(0.1+0.9*Math.max(0,c))+air*0.9,kL=a*1.1+mv*(1-air)*(0.1+0.9*Math.max(0,-c))+air*0.5;
hRot('thigh_R',HX,tR-air*0.5,H);hRot('shin_R',HX,kR,H);hRot('foot_R',HX,-(tR+kR)*0.6,H);hRot('thigh_L',HX,tL-air*0.2,H);hRot('shin_L',HX,kL,H);hRot('foot_L',HX,-(tL+kL)*0.6,H);
hRot('thigh_R',HZ,-a*0.25,H);hRot('thigh_L',HZ,a*0.25,H);
const br=Math.sin(now*1.7+o.x)*0.025;hRot('hips',HY,(o.twist||0)*0.4+0.14*s*mv,H);hRot('spine',HX,(o.lean||0)*0.55+0.06*mv,H);hRot('chest',HX,(o.lean||0)*0.45+br,H);hRot('chest',HY,(o.twist||0)*0.6-0.1*s*mv,H);
hRot('head',HX,-(o.mouth||0)*0.4-(o.lean||0)*0.5+(o.look||0),H);
heroGlobals(-a*0.3+0.03*mv*Math.abs(c),H);
for(const sd of['R','L']){const q=o.arms&&o.arms[sd],sg=sd==='R'?-1:1,sh=H.GT[H.bi['upperarm_'+sd]];let t;
 if(q&&q.w){const f=snM(o,q.w),u=v3n([f[0]-sh[0],f[1]-sh[1],f[2]-sh[2]]);t=[f[0]-u[0]*0.12,f[1]-u[1]*0.12,f[2]-u[2]*0.12]}
 else if(q&&q.m)t=[sh[0]+q.m[0],sh[1]+q.m[1],sh[2]+q.m[2]];
 else t=[sh[0]+sg*0.16,sh[1]-0.56,sh[2]+0.12+(o.lean||0)*0.3];
 snArm(sd,t,q&&q.pole||[sg*0.7,-0.4,-0.5],q&&q.k||2.6,q&&q.B)}
const pi=heroSkin(H);
mPush();mT(o.x,o.y,o.z);mRY(o.yaw);if(o.die){mT(0,0.25,0);mRX(-1.4*o.die)}mS(o.S,o.S,o.S);gId=nid();emit(pi[0],o.col||C.white,o.mat,0,0,0);
if(o.swords){emit(pi[1],C.white,12,0,0,0);emit(pi[2],C.white,12,0,0,0)}gId=0;mPop();
return{head:snBoneW(o,'head',[0,1.75,0.02]),chest:snBoneW(o,'chest',[0,1.38,0]),hips:snBoneW(o,'hips',[0,0.9,0]),
 markB:snBoneW(o,'chest',SN_PT.markB),markR:snBoneW(o,'chest',SN_PT.markR),tomoe:snBoneW(o,'head',SN_PT.tomoe),mouth:snBoneW(o,'head',SN_PT.mouth),
 fR:snBoneW(o,'hand_R',[-1.06,1.52,-0.14]),fL:snBoneW(o,'hand_L',[1.06,1.52,-0.14])}}
// ---- where things are (host and clients) ----
const shMob=b=>b.phase>2&&!(b.st==='brk'&&b.stT<1.0);
// the giants' feet: [x] per body in this form (第2形態: red then black; while splitting they slide apart)
function shBodies(b){const u=b.st==='brk'?b.stT:9;if(b.phase===1)return[0];if(b.phase===2){const k=b.st==='brk'?easeInOut(sat((u-0.4)/1.6)):1;return[-SN_X2*k,SN_X2*k]}return u<1.3?[-SN_X2,SN_X2]:[]}
const easeInOut=u=>u<0.5?2*u*u:1-2*(1-u)*(1-u);
// rest place of a giant hand (restH in entities.js asks here for the final boss): beside the thigh, a little forward
function shRestH(s,yo){const b=boss,x0=b&&b.phase===2?s*SN_X2:0;return{x:x0+s*6.8,y:11.5+yo,z:SN_Z+4}}
// a fist target the arms can reach (the ink arms stretch, but not across the yard): pulled in towards the giant
function shReach(b,i,x,z){const bx=b.phase===2?(i?SN_X2:-SN_X2):0,R=BT.shiro.reach,dz=z-(SN_Z+4);z=Math.min(z,-6);let dx=x-bx,dd=Math.hypot(dx,z-(SN_Z+4));if(dd>R){x=bx+dx/dd*R;z=SN_Z+4+(z-(SN_Z+4))/dd*R}return[clamp(x,-20,20),Math.max(-24,z)]}
// the mouth that spits (volley / fire balls / breath): 第2形態 = the red giant for fire, the black one for ink
function shMouth(b,fire){const bd=b.bd||[],i=b.phase===2?(fire?0:1):0,p=bd[i]&&bd[i].mouth;if(p)return p;const xs=shBodies(b);return[xs[i]||0,24+b.yo,SN_Z+3]}
// ---- host: form lines, the break, the white oni. true = this frame is handled here (updBoss2 returns) ----
function shRest(b,dt,hands){for(let i=0;i<2;i++){if(b.ah===i||b.ah===2)continue;const r=restH(i?1:-1,0),h=hands[i],k=Math.min(1,dt*4);h.x+=(r.x-h.x)*k;h.y+=(r.y-h.y)*k;h.z+=(r.z-h.z)*k}}
function shIdle(b,cd){b.st='idle';b.stT=0;b.cdT=cd;b.ah=-1}
function shPre(b,dt,hands){const K=BT.shiro,u=b.stT;b.mob=shMob(b);
if(!b.hp0)b.hp0=b.mhp;// the first form's full HP (players and difficulty included): the base of every form's bar
if(b.phase<3&&b.hp<=1&&b.st!=='brk'){b.phase++;b.mhp=Math.round(b.hp0*K.hpF[b.phase-1]);b.hp=1;b.st='brk';b.stT=0;b.ah=-1;b.k=0;shz.length=0;
 if(b.phase===3){b.x=0;b.z=-11;b.y=0;b.yaw=0;b.r=0.9}ev('shBrk',b.phase);const L=SH_SAY[b.phase-2];ev('say',L[0],L[1],1);return true}
const st=b.st;
if(st==='brk'){b.hp=Math.max(1,Math.round(b.mhp*sat((u-0.4)/1.8)));b.mouth=u<1.4?1:lerp(b.mouth,0.3,Math.min(1,dt*3));shRest(b,dt,hands);if(!b.k&&u>1.3){b.k=1;if(b.phase===3)ev('shLand',0,-11);else ev('roar',1)}if(u>SH_BRK){shIdle(b,0.5);if(b.phase===3)b.st='mrun'}return true}
if(b.phase===3)return shWhite(b,dt);
if(st==='suck'){b.mouth=1;shRest(b,dt,hands);if(!b.k){b.k=1;ev('shSuck')}if(u>K.suTel+K.suDur+0.6)shIdle(b,0.7);return true}
if(st==='rows'){b.ah=2;if(exRows(b,dt,hands))shIdle(b,0.8);return true}
return false}
// ---- 第3形態: the white oni with two swords (host) ----
function shWhite(b,dt){const K=BT.shiro.m3,u=b.stT,st=b.st,ex=G.ex?1:0;let P=bossT(b);const dx=P.x-b.x,dz=P.z-b.z,d=Math.hypot(dx,dz)||1,wy=Math.atan2(dx,dz),
 face=(lock,k)=>{if(!lock)b.yaw+=angDiff(wy,b.yaw)*Math.min(1,dt*(k||12))},end=cd=>{b.st='mrec';b.stT=0;b.cdT=cd==null?rnd(K.cd[0],K.cd[1])*(G.ex?EXK.cd:1):cd;b.y=0;b.ti=null},
 slash=(a,big)=>{mbSlash(b,a,13,K.dmg*(big||1),0,1.0,K.sv)};
b.y=Math.max(0,b.y||0);b.mouth=lerp(b.mouth||0,0,Math.min(1,dt*4));
if(st==='mrun'||st==='idle'){b.st='mrun';const want=d>K.keep[1]?1:d<K.keep[0]?-0.8:0;b.sd=b.sd||1;if(Math.random()<dt*0.4)b.sd=-b.sd;
 const vx=(dx/d*want-dz/d*b.sd*0.7)*K.spd,vz=(dz/d*want+dx/d*b.sd*0.7)*K.spd;b.x+=vx*dt;b.z+=vz*dt;b.mv=Math.min(1,Math.hypot(vx,vz)/K.spd);collide(b,0.8);face(false,10);
 b.cdT-=dt;if(b.cdT<=0){const pat=BT.shiro.pats[ex?5:2],m=pat[b.atk++%pat.length];b.st=m;b.stT=0;b.k=0;b.vn=0;b.mv=0;b.ti=null;
  if(m==='m3'){b.lx=Math.sin(wy);b.lz=Math.cos(wy)}if(m==='koma'){ev('shKoma',(Math.random()*1e9)|0,BT.shiro.koN[ex])}if(m==='summon'){ev('roar',0);for(let i=0;i<1+G.np;i++)spawnNear(i%2?'shadeR':'shade');if(G.ex)spawnNear('crow')}}
 return true}
b.mv=0;
if(st==='mrec'){if(u>0.25){b.st='mrun';b.stT=0}return true}
if(st==='m1'){face(u>K.m1-0.08);const lead=a=>Math.atan2(P.x+(P.vx||0)*0.3-b.x,P.z+(P.vz||0)*0.3-b.z);
 if(b.vn===0&&u>=K.m1){b.vn=1;slash(lead());ev('txt','ズバッ',r1(b.x),3.4,r1(b.z),56,'ink')}if(b.vn===1&&u>=K.m1+0.2){b.vn=2;P=bossT(b);slash(lead())}if(u>K.m1+0.45)end();return true}
if(st==='m2'){face(u>K.m2-0.1);if(!b.vn&&u>=K.m2){b.vn=1;const n=5+ex*2;for(let i=0;i<n;i++)slash(b.yaw+(i-(n-1)/2)*0.24);ev('txt','白扇！',r1(b.x),3.6,r1(b.z),62,'ink')}if(u>K.m2+0.4)end();return true}
if(st==='m3'){if(u<K.m3){face(false,6);b.lx=Math.sin(b.yaw);b.lz=Math.cos(b.yaw);return true}const q=u-K.m3;
 if(q<K.dashT){if(!b.k){b.k=1;b.hd={};ev('txt','踏ミ込ミ！',r1(b.x),3.4,r1(b.z),56,'ink')}b.x+=b.lx*K.dashV*dt;b.z+=b.lz*K.dashV*dt;collide(b,0.8);
  for(const p of allP())if(!p.dead&&!b.hd[p.slot]&&Math.hypot(p.x-b.x,p.z-b.z)<1.6&&(p.y||0)<1.4){b.hd[p.slot]=1;hurtT(p,K.dashDmg,b.x,b.z)}return true}
 if(b.k===1){b.k=2;ev('snSpin',r1(b.x),r1(b.z));areaHurt(b.x,b.z,K.spinR,K.spinDmg,1)}if(b.k===2&&q>K.dashT+0.3){b.k=3;slash(wy,1.2)}if(q>K.dashT+0.75)end();return true}
if(st==='m4'){face(u>0.2);b.y=u<K.m4?Math.sin(sat(u/K.m4)*PI*0.5)*3.2:3.2*(1-sat((u-K.m4)/0.16));if(!b.k&&u>=K.m4+0.16){b.k=1;b.y=0;ev('snRing',r1(b.x),r1(b.z),ex)}if(u>K.m4+0.7)end();return true}
if(st==='m5'){const n=K.m5N+ex*2,want=Math.floor((u-K.m5)/0.16);face(false,14);while(b.vn<=want&&b.vn<n){b.vn++;const Q=pickR();slash(Math.atan2(Q.x+(Q.vx||0)*0.25-b.x,Q.z+(Q.vz||0)*0.25-b.z))}if(b.vn===1&&!b.k){b.k=1;ev('txt','乱レ飛刃！',r1(b.x),3.6,r1(b.z),62,'ink')}if(u>K.m5+n*0.16+0.3)end();return true}
if(st==='mcut'){const KK=BT.shiro,n=KK.cuN[ex],per=0.38,i=Math.min(n-1,Math.floor(u/per));face(false,8);
 if(b.vn<=i&&u>=0){b.vn=i+1;const Q=pickR(),a=Math.atan2(Q.x+(Q.vx||0)*0.3-b.x,Q.z+(Q.vz||0)*0.3-b.z);ev('shCut',r2(a),KK.cuTel,r1(b.x),r1(b.z))}if(u>n*per+KK.cuTel+0.3)end();return true}
if(st==='koma'){const KK=BT.shiro,n=KK.koN[ex],T0=KK.koTel[0],T1=KK.koTel[1],tot=T0+(n-1)*(T1+0.45)+0.9;b.mouth=0.6;
 let q=u,tl=T0;for(let i=0;i<n;i++){if(q<tl+0.45)break;q-=tl+0.45;tl=T1}b.y=q>tl-0.45&&q<tl?Math.sin(sat((q-tl+0.45)/0.45)*PI)*2.6:0;if(u>tot)end(0.4);return true}
if(st==='summon'){b.mouth=1;if(u>0.9)end();return true}
if(st==='chase'){if(exBoss(b,dt,[b.hL,b.hR],true))end();return true}
end();return true}
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
  if(d<K.suR&&pl.y<0.6&&lim('shsu',0.45)){const hp=pl.hp;hurtPlayer(lerp(K.suDmg[0],K.suDmg[1],sat((d-6.5)/(K.suR-6.5))),pl.x+dx/d,pl.z+dz/d);if(pl.hp<hp)addText('吸ワレル…！',W/2,H*0.62,{size:60,st:'ink',life:0.45})}}
 else if(h.k==='koma'){const L=h.L,n=L.waves.length;if(h.w>=n){h.ct+=dt;if(h.t>0.7)shz.splice(i,1);continue}const tl=h.w?K.koTel[1]:K.koTel[0];
  if(h.t>=tl){const on=L.waves[h.w];FXE_shNuki(L.P,on);if(live&&pl.y<3)for(let j=0;j<L.P.length;j++)if(on[j]&&shInPanel(L.P[j],pl.x,pl.z,0.1)){hurtPlayer(K.koDmg,pl.x,pl.z+1);break}
   h.cut=on;h.ct=0;h.w++;h.t=h.w<n?-0.45:0}
  if(h.cut)h.ct+=dt}
 else if(h.k==='cut'){if(t0<0&&h.t>=0){const a=h.a,s=Math.sin(a),c=Math.cos(a);fxRing(h.ox+s*10,0.2,h.oz+c*10,6,C.white,0.25);for(let j=0;j<6;j++){const d=4+j*6;fxDebris(h.ox+s*d,0.4,h.oz+c*d,3,6,C.paper,0.35)}shake(0.4);snd('slash');snd('boom',0.5);stopT(0.04);
   sfxAt('ズバァッ！',h.ox+s*10,3,h.oz+c*10,{size:80,st:'boom',life:0.5});
   if(live&&pl.y<2.4){const px=pl.x-h.ox,pz=pl.z-h.oz,al=px*s+pz*c,pp=px*c-pz*s;if(al>0.8&&al<50&&Math.abs(pp)<K.cuW+0.4)hurtPlayer(K.cuDmg,pl.x-c*Math.sign(pp||1),pl.z+s*Math.sign(pp||1))}}
  if(h.t>1.2)shz.splice(i,1)}}}
// one 白抜き: white light bursts out of the marked panels
function FXE_shNuki(P,on){flash(0.35);shake(0.6);snd('boom',1);snd('slash');stopT(0.06);addText('白抜キ！！',W/2,H*0.3,{size:130,st:'ink',life:0.8,rot:-0.05});
for(let j=0;j<P.length;j++)if(on[j]){const p=P[j],cx=(p.x0+p.x1)/2,cz=(p.z0+p.z1)/2;fxStar(cx,1,cz,6,C.white,0.14);fxDebris(cx,0.5,cz,6,8,C.paper,0.5)}}
Object.assign(FXE,{
shBrk(ph){const b=boss;flash(0.8);shake(1);stopT(0.2);snd('clank');snd('boom',1);lines(1,'#16121f');invA=1;const yo=b?b.yo:0;
 if(ph===2){const p=b&&b.bd&&b.bd[0]?b.bd[0].markB:[-1.8,20+yo,SN_Z+2.6];fxDebris(p[0],p[1],p[2],20,12,C.inkD,0.6);fxStar(p[0],p[1],p[2],9,C.white,0.16);fxRing(p[0],p[1],p[2],12,C.red,0.4);
  for(let i=0;i<3;i++)explode(p[0]+rnd(-2,2),p[1]+rnd(-2,2),p[2]+1,2.2,{quiet:1,ink:1});addText('バキィッ！！',W/2,H*0.3,{size:140,st:'boom',life:1,rot:-0.06});addText('黒の印、破壊！',W/2,H*0.46,{size:64,st:'ink',life:1.4});addText('分裂シタ！？',W/2,H*0.58,{size:58,st:'hurt',life:1.8})}
 else{for(const x of[-SN_X2,SN_X2]){explode(x,22+yo,SN_Z+3,4,{quiet:1,ink:1});fxDebris(x,20,SN_Z+3,16,12,x<0?C.red:C.inkD,0.6)}fxBlobs(0,8,SN_Z+4,24,14,C.inkD,0.5);
  addText('ドロォ…',W/2,H*0.3,{size:130,st:'ink',life:1.2,rot:-0.06});addText('巴の印、破壊！',W/2,H*0.46,{size:64,st:'hurt',life:1.4})}},
shLand(x,z){explode(x,0.8,z,2.6,{ink:1,text:'ズドンッ！！'});fxRing(x,0.1,z,14,C.white,0.5);fxStar(x,1.5,z,8,C.white,0.2);flash(0.6);shake(0.9);stopT(0.12);snd('boom',1);snd('clank');
 addText('白抜魔王、真ノ姿！',W/2,H*0.46,{size:66,st:'ink',life:1.8});addText('弱点ナシ！ 斬撃ハ跳ンデカワセ！',W/2,H*0.72,{size:42,st:'cyan',life:2})},
shSuck(){shz.push({k:'suck',t:-BT.shiro.suTel});snd('charge');snd('roar',0.5);lines(0.9,'#16121f',W/2,H*0.35);addText('スゥゥゥゥ…',W/2,H*0.28,{size:100,st:'ink',life:1.2,grow:0.2});addText('吸い込みだ！離れろ！',W/2,H*0.74,{size:46,st:'cyan',life:1.2})},
shKoma(seed,n){const L=shKomaLay(seed,n);for(let i=shz.length-1;i>=0;i--)if(shz[i].k==='koma')shz.splice(i,1);shz.push({k:'koma',t:0,w:0,L,cut:null,ct:0});snd('clank');shake(0.4);addText('コマ割リ！',W/2,H*0.28,{size:110,st:'ink',life:1.1,rot:0.05});addText('光るコマから出ろ！',W/2,H*0.74,{size:46,st:'cyan',life:1.2})},
shCut(a,tel,ox,oz){shz.push({k:'cut',a,t:-tel,ox:ox||0,oz:oz==null?-16:oz});snd('whoosh');if(lim('shct',0.8))addText('チャキッ',W/2,H*0.3,{size:80,st:'ink',life:0.5})},
snSpin(x,z){fxRing(x,1,z,BT.shiro.m3.spinR*2,C.white,0.3);fxSparks(x,1.2,z,14,8,C.white);snd('slash');snd('whoosh');shake(0.3);sfxAt('ザシュッ！',x,3.2,z,{size:70,st:'ink',life:0.5})},
snRing(x,z,ex){const K=BT.shiro.m3;explode(x,0.6,z,2.2,{ink:1,text:'円月！'});fxRing(x,0.1,z,12,C.white,0.4);decals.push({x,z,r:4,life:6});shake(0.7);snd('boom',0.8);
 shocks.push({x,z,r:1.2,v:15,max:30,d:K.ring,hit:false});shocks.push({x,z,r:-5,v:15,max:30,d:K.ring,hit:false});if(ex)shocks.push({x,z,r:-11,v:16,max:30,d:K.ring,hit:false})}});
// ---- drawing ----
// the arms of one giant: a world fist target for the attacking hand(s), the other hangs. P1: both hands. P2: red = hL (his right arm), black = hR (his left)
function shGiant(b,i,x,col,mat,sink){const yo=b.yo+(sink||0),hs=[b.hL,b.hR],act=b.phase===2&&b.st!=='brk'?[i]:b.phase===1?[0,1]:[],h=act.length===1?hs[act[0]]:null;
const arms={};if(b.phase===1||b.st==='brk'&&b.phase===2&&b.stT<0.4){arms.R={w:[hs[0].x,hs[0].y,hs[0].z]};arms.L={w:[hs[1].x,hs[1].y,hs[1].z]}}
else if(h){arms[i?'L':'R']={w:[h.x,h.y,h.z]}}
// lean / crouch / turn towards the busiest hand
let far=0,tw=0;for(const k of act){const q=hs[k],d=Math.hypot(q.x-x,q.z-SN_Z);far=Math.max(far,sat((d-7)/12)*sat((14-q.y)/10));if(act.length===1||b.ah===k)tw=clamp(Math.atan2(q.x-x,q.z-SN_Z)*0.7,-0.7,0.7)}
const g=b.gk||(b.gk=[{l:0,t:0},{l:0,t:0}]),G0=g[i],k=Math.min(1,RDT*6);G0.l+=(far-G0.l)*k;G0.t+=(tw-G0.t)*k;
const shk=b.st==='brk'&&b.stT<1.4||b.st==='die'?Math.sin(now*50)*0.25:0;
return snDraw({x:x+shk,y:yo,z:SN_Z,yaw:G0.t*0.6,S:SN_S,mat,col,crouch:0.15+G0.l*0.85,lean:G0.l*1.1,twist:G0.t*0.4,mouth:b.mouth||0,arms})}
const SN_RED=[0.86,0.1,0.1],SN_BLK=[0.2,0.2,0.22];
function drawShiro(b){if(SN.buf)snInit();const t=b.t,ph=b.phase,st=b.st,u=b.stT,fl=b.flash>0||st==='brk'&&u<0.25&&Math.sin(u*60)>0?0.45:0;gTint=fl;b.mob=shMob(b);
if(!SN.ready){gTint=0;shDrawFallback(b);return}
const xs=shBodies(b);if(xs.length){put(CYL,0,0.1,SN_Z+3,0,0,0,ph===1?24:44,0.1,13,C.inkD,0,0,F_NOCAST);for(let i=0;i<6;i++){const a=i*1.05+t*0.3;sph(Math.cos(a)*(ph===1?11:20),0.1,SN_Z+3+Math.sin(a)*5.5,2.2+Math.sin(t*2+i)*0.6,0.9,2.2,C.inkD)}}
const bd=[];
if(ph===1)bd[0]=shGiant(b,0,0,C.white,14);
else if(ph===2){const sp=st==='brk'&&u<0.4;if(sp)bd[0]=shGiant(b,0,0,C.white,14);else{bd[0]=shGiant(b,0,xs[0],SN_RED,13);bd[1]=shGiant(b,1,xs[1],SN_BLK,13)}}
else{if(st==='brk'&&u<1.3){const s=-easeOut(sat(u/1.3))*(SN_S*2.2);bd[0]=shGiant(b,0,-SN_X2,SN_RED,13,s);bd[1]=shGiant(b,1,SN_X2,SN_BLK,13,s);
  if(lim('shmelt',0.08)){fxBlobs(rnd(-16,16),rnd(0,8),SN_Z+rnd(1,6),3,6,C.inkD,0.4)}}
 if(!(st==='brk'&&u<1.0)){const drop=st==='brk'?Math.max(0,(1.3-u)/0.3)*22:0;bd[0]=shDrawWhite(b,drop)}}
b.bd=bd;gTint=0;bkTele(b);shTele(b)}
// 第3形態: run / attack poses from b.st + b.stT (clients see the same moves). Sword poses: arm direction + blade direction (model space)
const dirAE=(az,el)=>[Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)];
function shDrawWhite(b,drop){const K=BT.shiro.m3,st=b.st,u=b.stT,arms={},L=0.5;let crouch=0.12,lean=0,spin=0,look=0;
const pose=(sd,az,el,baz,bel,r)=>{arms[sd]={m:dirAE(az,el).map(v=>v*(r||L)),B:dirAE(baz,bel),pole:[sd==='R'?-0.6:0.6,-0.6,-0.3],k:1}};
// guard: both blades forward and out, a little down
pose('R',-0.55,-0.55,-0.25,0.1);pose('L',0.55,-0.55,0.25,0.1);
const sw=(sd,q,a0,a1,el)=>{const s=sd==='R'?-1:1,a=lerp(a0,a1,easeOut(sat(q)));pose(sd,s*a,el,s*(a+0.9),el)};
if(st==='m1'){const t1=K.m1;if(u<t1){pose('R',-0.9,1.0,-0.6,1.5);crouch=0.3;lean=-0.1}else{sw('R',(u-t1)/0.12,1.4,-0.9,0.05);if(u<t1+0.2)pose('L',0.9,1.0,0.6,1.5);else sw('L',(u-t1-0.2)/0.12,1.4,-0.9,0.05);lean=0.25}}
else if(st==='m2'){const t1=K.m2;if(u<t1){pose('R',0.5,0.3,1.4,0.6);pose('L',-0.5,0.3,-1.4,0.6);crouch=0.35}else{sw('R',(u-t1)/0.1,-0.4,1.6,0.1);sw('L',(u-t1)/0.1,-0.4,1.6,0.1);lean=0.2}}
else if(st==='m3'){if(u<K.m3){pose('R',-2.2,-0.3,-2.6,0.2);pose('L',2.2,-0.3,2.6,0.2);crouch=0.55;lean=0.45}else if(u<K.m3+K.dashT){pose('R',-2.5,-0.2,-2.8,0);pose('L',2.5,-0.2,2.8,0);lean=0.6;crouch=0.3}
 else{const q=u-K.m3-K.dashT;spin=q<0.3?easeOut(q/0.3)*TAU:0;pose('R',-1.6,0,-2.4,0);pose('L',1.6,0,2.4,0);crouch=0.3}}
else if(st==='m4'){spin=u<K.m4+0.16?u*16:0;pose('R',-1.5,0.1,-2.3,0);pose('L',1.5,0.1,2.3,0);crouch=b.y>0.1?0.0:0.4}
else if(st==='m5'){const i=Math.max(0,Math.floor((u-K.m5)/0.16)),q=((u-K.m5)%0.16)/0.16,sd=i%2?'L':'R';if(u<K.m5){pose('R',-0.9,1.0,-0.6,1.5);pose('L',0.9,1.0,0.6,1.5)}else{sw(sd,q,1.3,-1.0,0.1);lean=0.2}}
else if(st==='mcut'){const q=(u%0.38)/0.38;pose('R',-0.2,lerp(1.3,-0.7,easeOut(q)),-0.2,lerp(1.6,-0.4,easeOut(q)));pose('L',0.2,lerp(1.3,-0.7,easeOut(q)),0.2,lerp(1.6,-0.4,easeOut(q)));lean=q*0.35;crouch=0.2+q*0.3}
else if(st==='koma'){const up=b.y>0.2;pose('R',-0.3,up?1.3:-0.6,-0.2,up?1.5:-1.2);pose('L',0.3,up?1.3:-0.6,0.2,up?1.5:-1.2);crouch=up?0:0.5;lean=up?-0.1:0.4}
else if(st==='summon'||st==='brk'){pose('R',-0.8,0.9,-0.6,1.4);pose('L',0.8,0.9,0.6,1.4);look=-0.3}
else if(st==='die'){pose('R',-0.4,-1.2,-0.3,-1.4);pose('L',0.4,-1.2,0.3,-1.4)}
const air=b.y>0.1?1:0,die=st==='die'?sat(u/0.8):0;
return snDraw({x:b.x,y:b.y+(drop||0),z:b.z,yaw:b.yaw+spin,S:SN_S3,mat:12,col:C.white,crouch,lean,mouth:b.mouth||0,look,walk:b.t,mv:st==='mrun'?(b.mv==null?1:b.mv):0,air,arms,swords:1,die})}
// 第3形態の斬撃 (enemy shot k 13): a wide white crescent with an ink rim, low over the ground (jump over it)
function snDrawShot(s,w,l){const NF=F_UNLIT|F_NOCAST;mPush();mT(s.x,s.y,s.z);mRY(Math.atan2(s.vx,s.vz));mS(w,w*0.7,w);
for(let i=-8;i<=8;i++){const a=i*0.16,x=Math.sin(a)*1.4,z=Math.cos(a)*0.6-0.6,th=1-Math.abs(i)/9;
 put(BOX,x,0,z,0,a,0,0.24,0.12+0.5*th,0.16,C.inkD,0,0,0);put(BOX,x,0,z+0.1,0,a,0,0.22,0.08+0.38*th,0.08,C.white,0,0,NF|F_NOEDGE)}
mPop();if(lim('snsh'+s.id,0.04))fxBlobs(s.x-s.vx/l*1.2,0.6,s.z-s.vz/l*1.2,1,2,C.inkD,0.14)}
// when the model is not loaded yet: a white blob where he is (the game still works)
function shDrawFallback(b){const xs=shBodies(b);for(const x of xs){sph(x,14+b.yo,SN_Z,12,26,8,C.paper,0,.6,0,1)}if(b.phase>2)sph(b.x,1.2+b.y,b.z,1.2,2.4,1,C.paper,0,.6,0,1)}
// telegraphs of the boss's own state (world space) that bkTele does not cover
function shTele(b){const t=b.t,NF=F_UNLIT|F_NOCAST,st=b.st,u=b.stT,K=BT.shiro.m3;
if(st==='up'){const s=6+Math.sin(t*20)*0.8;put(RING,b.tx,0.12,b.tz,0,0,0,s,1,s,C.red,0,0,NF);put(RING,b.tx,0.12,b.tz,0,0,0,s*0.5,1,s*0.5,C.red,0,0,NF)}
if(b.phase<3)return;const lineT=(a,L,w)=>{mPush();mT(b.x+Math.sin(a)*L/2,0.12,b.z+Math.cos(a)*L/2);mRY(a);mS(w,0.02,L);emit(BOX,C.red,0,0,NF,0);mPop()},bl=f=>Math.sin(now*f)>-0.3;
if(st==='m1'&&u<K.m1&&bl(30))lineT(b.yaw,20,4.6);
else if(st==='m2'&&u<K.m2&&bl(24)){const n=5+(G.ex?2:0);for(let i=0;i<n;i++)lineT(b.yaw+(i-(n-1)/2)*0.24,16,1.2)}
else if(st==='m3'&&u<K.m3&&bl(30)){const L=K.dashV*K.dashT;lineT(b.yaw,L,1.6);put(RING,b.x+Math.sin(b.yaw)*L,0.13,b.z+Math.cos(b.yaw)*L,0,0,0,K.spinR*2,1,K.spinR*2,C.red,0,0,NF)}
else if(st==='m4'&&u<K.m4+0.16&&bl(26)){const s=3+Math.sin(now*20)*0.4;put(RING,b.x,0.12,b.z,0,0,0,s,1,s,C.red,0,0,NF);put(RING,b.x,0.12,b.z,0,0,0,s*3,1,s*3,C.red,0,0,NF)}}
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
 else if(h.k==='cut'){const a=h.a;mPush();mT(h.ox+Math.sin(a)*24,0.12,h.oz+Math.cos(a)*24);mRY(a);
  if(h.t<0){if(Math.sin(now*(h.t>-0.25?40:16))>-0.3){mS(K.cuW*2,0.02,46);emit(BOX,C.red,0,0,NF,0)}}else{const k=1-sat((h.t-0.6)/0.6);if(k>0){mS(K.cuW*1.4*k,0.03,46);emit(BOX,C.white,0,0,NF,0)}}mPop()}}}
// HUD under the boss bar: where the form lines are, and which part to shoot
function shHUD(b){ctx.save();ctx.lineWidth=3;ctx.strokeStyle=INK;for(let i=0;i<3;i++){const x=505+i*22,y=70,live=i>=b.phase-1;// the forms left
 ctx.fillStyle=live?['#a04cff','#ff3b30','#ffd91a'][i]:'#fff';ctx.beginPath();ctx.moveTo(x,y-9);ctx.lineTo(x+8,y);ctx.lineTo(x,y+9);ctx.lineTo(x-8,y);ctx.closePath();ctx.fill();ctx.stroke()}ctx.restore();
txt('第'+'一二三'[b.phase-1]+'形態',440,70,20,'#fff',INK,5);if(b.st==='brk'||b.st==='rise')return;const k=(now*3|0)%2;
txt(['胸の黒い印を撃て！','額の巴を撃て！','弱点なし！ 斬撃は跳んでかわせ！'][b.phase-1],740,100,22,k?'#ffd91a':'#fff',INK,6)}
// hit spheres [x,y,z,r,×damage]: the live weak point first (aim assist and the demo AI aim at the first one)
function shSph(e){const W=SH_WEAK,B=SH_BODY,ph=e.phase,bd=e.bd||[];
if(ph>2&&!(e.st==='brk'&&e.stT<1.3)){const y=e.y||0;return[[e.x,y+1.25,e.z,0.75,1],[e.x,y+2.05,e.z,0.45,1],[e.x,y+0.5,e.z,0.5,1]]}
const xs=shBodies(e),out=[],rest=[];
xs.forEach((x,i)=>{const d=bd[i]||{head:[x,25+e.yo,SN_Z+1],chest:[x,19+e.yo,SN_Z+1],hips:[x,12+e.yo,SN_Z],markB:[x-1.8,20+e.yo,SN_Z+2.6],tomoe:[x,26+e.yo,SN_Z+1.6]},
 wk=ph===1?d.markB:d.tomoe;out.push([wk[0],wk[1],wk[2],ph===1?2.2:1.9,W]);rest.push([d.head[0],d.head[1],d.head[2],3.2,B],[d.chest[0],d.chest[1],d.chest[2],5.2,B],[d.hips[0],d.hips[1],d.hips[2],4.4,B])});
if(xs.length)rest.push([e.hL.x,e.hL.y,e.hL.z,2.2,B],[e.hR.x,e.hR.y,e.hR.z,2.2,B]);return out.concat(rest)}
function shCenter(e){if(e.phase>2&&!(e.st==='brk'&&e.stT<1.3))return[e.x,(e.y||0)+1.2,e.z,1.3];return[0,18+e.yo,SN_Z+2,e.phase===1?8:14]}
// ---- ?boss5=1: line the three forms up in front of the camera (to check the model) ----
const SN_TEST=new URLSearchParams(location.search).get('boss5');
function drawShiroTest(){if(!SN_TEST)return;if(SN.buf)snInit();if(!SN.ready)return;const fx=-Math.sin(cam.yaw),fz=-Math.cos(cam.yaw),rx=Math.cos(cam.yaw),rz=-Math.sin(cam.yaw),k=+SN_TEST||1;
const o=(i,S,mat,col)=>({x:cam.x+fx*(4+S*1.2)+rx*(i-1)*S*1.5,y:0,z:cam.z+fz*(4+S*1.2)+rz*(i-1)*S*1.5,yaw:cam.yaw+PI+(k===2?now*0.6:0),S,mat,col});
if(k<=2){snDraw(o(0,1.15,14,C.white));snDraw(o(1,1.15,13,SN_RED));snDraw(Object.assign(o(2,1.15,12,C.white),{swords:1,arms:{R:{m:dirAE(-0.55,-0.55).map(v=>v*0.5),B:dirAE(-0.25,0.1),k:1},L:{m:dirAE(0.55,-0.55).map(v=>v*0.5),B:dirAE(0.25,0.1),k:1}}}))}
else{const w=Object.assign(o(1,1.15,12,C.white),{swords:1,walk:now,mv:1,arms:{R:{m:dirAE(-0.55,-0.55).map(v=>v*0.5),B:dirAE(-0.25,0.1),k:1},L:{m:dirAE(0.55,-0.55).map(v=>v*0.5),B:dirAE(0.25,0.1),k:1}}});snDraw(w)}}
