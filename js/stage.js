'use strict';
// ================= STAGE =================
const hex=h=>[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];
const C={ink:hex(0x241f40),inkD:hex(0x15112a),white:hex(0xffffff),paper:hex(0xf6f1e4),red:hex(0xe5402b),redD:hex(0xb3262a),gold:hex(0xf4b82e),yellow:hex(0xffe14d),orange:hex(0xff8a2b),
sand:hex(0xead9ad),stone:hex(0xc6cad6),stoneL:hex(0xdcdfe8),stoneD:hex(0x9aa0b4),wood:hex(0xa56c41),woodD:hex(0x6d4630),plaster:hex(0xf5f0e4),roof:hex(0x47597e),roofD:hex(0x2f3c5c),black:hex(0x2a2836),
leaf:hex(0x52b85c),leafD:hex(0x2f8f55),cedar:hex(0x2c7a56),cedarD:hex(0x23664d),sakura:hex(0xffb9d2),sakuraD:hex(0xff8fb8),trunk:hex(0x6e4b3a),grass:hex(0x93d36a),mount:hex(0x7494d8),mount2:hex(0x93aee6),hill:hex(0x6fbf8e),hill2:hex(0x8fd0b0),
water:hex(0x59c7f0),cyan:hex(0x6fe6ff),cyanD:hex(0x2a7fa8),smoke:hex(0xf2f0f5),smokeD:hex(0x9a94ad),skin:hex(0x3f86c4),skinD:hex(0x2c6aa3),navy:hex(0x2a2a4a),lant:hex(0xff8a2b),purple:hex(0x7a3fd0),pink:hex(0xff5fa2),
gunM:hex(0x4a5378),gunD:hex(0x272b44),glove:hex(0x2b2b3a),sleeve:hex(0xd8342c),flag1:hex(0xe5402b),flag2:hex(0x2f6fd8),flag3:hex(0x7a3fd0),tongue:hex(0xf0355a),
rope:hex(0xe8cf8a),ema:hex(0xf0d6a0),tuft:hex(0x5fae55),steel:hex(0xdfe3ee)};
const colC=[],colB=[];
// play-area bounds (player/enemy clamp, shot walls). Per stage via STG[n].arena=[half width, north z, south z]; the boss always rises at z -21.5.
let BX=21.6,BZ0=-25.6,BZ1=21.6;
function setArena(a){a=a||[21.6,-25.6,21.6];BX=a[0];BZ0=a[1];BZ1=a[2]}
let WT=null;
function wall(x0,z0,x1,z1){const cx=(x0+x1)/2,cz=(z0+z1)/2,len=Math.hypot(x1-x0,z1-z0),a=Math.atan2(-(z1-z0),x1-x0);mPush();mT(cx,0,cz);mRY(a);
box(0,0.35,0,len,0.7,1.0,WT.base,5);box(0,1.6,0,len,1.8,0.6,WT.pl);put(PRISM,0,2.85,0,0,PI/2,0,1.7,0.7,len+0.3,WT.roof,3);box(0,3.22,0,len+0.3,0.14,0.26,WT.roofD);mPop()}
function torii(z){const P=C.red;for(const s of[-1,1]){put(CYL,s*4.6,3.9,z,0,0,-s*0.03,1.05,7.8,1.05,P,0,.5);cyl(s*4.6,0.45,z,1.5,0.9,1.5,C.black);colC.push({x:s*4.6,z,r:0.8,h:8});put(BOX,s*7.25,8.66,z,0,0,s*0.22,1.4,0.46,1.27,C.black)}
box(0,6.25,z,12.6,0.6,0.55,P);box(0,7.95,z,13.2,0.62,0.95,P);box(0,8.48,z,14.2,0.46,1.25,C.black);box(0,7.1,z,0.95,1.15,0.3,C.gold);box(0,7.1,z,0.7,0.9,0.36,C.black)}
function toro(x,z){mPush();mT(x,0,z);box(0,0.2,0,1.3,0.4,1.3,C.stoneD,5);cyl(0,1.05,0,0.42,1.4,0.42,C.stone);box(0,1.85,0,1.1,0.22,1.1,C.stone);box(0,2.3,0,0.78,0.7,0.78,C.stone);
box(0,2.3,0,0.82,0.42,0.5,C.yellow,0,0,F_UNLIT);box(0,2.3,0,0.5,0.42,0.82,C.yellow,0,0,F_UNLIT);put(PYR,0,2.95,0,0,0,0,1.6,0.6,1.6,C.stoneD);sph(0,3.32,0,0.28,0.32,0.28,C.stone);mPop();colC.push({x,z,r:0.85,h:3.4})}
function cedar(x,z,s,R){const c=R()<.5?C.cedar:C.cedarD;cyl(x,1.5*s,z,0.8*s,3*s,0.8*s,C.trunk,9);put(CONE,x,5.5*s,z,0,0,0,6*s,7*s,6*s,c,8,0,F_SWAY);put(CONE,x,9*s,z,0,0,0,4.8*s,6*s,4.8*s,c,8,0,F_SWAY);put(CONE,x,12*s,z,0,0,0,3.4*s,5*s,3.4*s,c,8,0,F_SWAY)}
// The trunk runs up into the middle sphere of the crown (its top sits 40% up that sphere), so no sky shows between trunk and leaves even while the crown sways.
function leafy(x,z,s,R,ca,cb,col){const L=[];for(let i=0;i<7;i++){const a=i/7*TAU+R(),d=(2.4+R()*1.3)*s,rr=i<6?1.7*s:0;L.push([x+Math.cos(a)*rr,(4.4+R()*1.5+(i===6?1.4:0))*s,z+Math.sin(a)*rr,d,d*0.82,d,i%2?ca:cb])}
const m=L[6],th=m[1]-m[4]/2+0.4*m[4];put(CYL,x,th/2-0.1*s,z,0,0,0.06,0.75*s,th,0.75*s,C.trunk,9);put(CYL,x+0.7*s,3.4*s,z,0,0,-0.8,0.3*s,1.8*s,0.3*s,C.trunk,9);put(CYL,x-0.7*s,3.6*s,z,0,0,0.8,0.3*s,1.8*s,0.3*s,C.trunk,9);
for(const q of L)sph(q[0],q[1],q[2],q[3],q[4],q[5],q[6],8,0,F_SWAY);if(col)colC.push({x,z,r:0.6*s,h:5})}
function nobori(x,z,c){cyl(x,2.3,z,0.08,4.6,0.08,C.black);box(x,4.5,z+0.3,0.06,0.06,0.75,C.black);box(x,2.75,z+0.42,0.04,3.3,0.72,c,0,0,F_CLOTH);box(x,4.15,z+0.42,0.06,0.4,0.74,C.white,0,0,F_CLOTH);for(let i=0;i<4;i++)box(x,3.55-i*0.6,z+0.42,0.07,0.36,0.4,C.white,0,0,F_CLOTH)}
function chochin(x,y,z,c,fl){box(x,y+0.9,z,0.05,0.3,0.05,C.black,0,0,F_SWAY);cyl(x,y+0.7,z,0.56,0.16,0.56,C.black,0,0,F_SWAY);sph(x,y,z,1.0,1.3,1.0,c,6,0,(fl||0)|F_SWAY);cyl(x,y-0.68,z,0.56,0.14,0.56,C.black,0,0,F_SWAY)}
function fox(x,z,s){mPush();mT(x,0,z);box(0,0.7,0,1.4,1.4,1.4,C.stoneD,5);box(0,1.48,0,1.6,0.16,1.6,C.stone);sph(0,2.2,-0.1,0.8,1.3,0.9,C.paper);sph(0,3.0,0.15,0.62,0.6,0.7,C.paper);put(CONE,0,2.95,0.6,PI/2,0,0,0.3,0.4,0.3,C.paper);
put(CONE,-0.2,3.42,0.05,0,0,0.15,0.22,0.45,0.22,C.paper);put(CONE,0.2,3.42,0.05,0,0,-0.15,0.22,0.45,0.22,C.paper);box(0,2.55,0.3,0.6,0.3,0.25,C.red);put(CONE,-s*0.3,2.3,-0.7,-0.9,0,0,0.4,1.1,0.4,C.paper);mPop();colB.push({x0:x-0.8,x1:x+0.8,z0:z-0.8,z1:z+0.8,h:3.4})}
// Stage 1 (shrine) is authored in Blender: blender/stage_shrine.blend -> assets/stage_shrine.glb (loaded by js/glb.js).
// buildStage1Code() is the original code-built version, kept as a fallback when the GLB can't be loaded and for ?stage1=code comparisons.
function buildStage1(){if(STAGE_GLB[0])emitGlbStage(STAGE_GLB[0]);else buildStage1Code()}
function buildStage1Code(){const R=mulberry(11);WT={base:C.stoneD,pl:C.plaster,roof:C.roof,roofD:C.roofD};
box(0,-0.62,0,1700,1,1700,C.grass,4);box(0,-0.1,-2,46.6,0.2,50.6,C.sand,4);put(CYL,0,0,2,0,0,0,17,0.06,17,C.stone,1);box(0,0.02,-2,5,0.1,49,C.stoneL,1);
wall(-23,-27,23,-27);wall(-23,23,-4.4,23);wall(4.4,23,23,23);wall(-23,-27,-23,23);wall(23,-27,23,23);
for(const[x,z]of[[-23,-27],[23,-27],[-23,23],[23,23]]){box(x,1.9,z,1.1,3.8,1.1,C.woodD,2);put(PYR,x,4.1,z,0,0,0,1.7,0.7,1.7,C.roofD)}
// south gate
for(const s of[-1,1]){cyl(s*3.9,2.6,23,0.8,5.2,0.8,C.red,0,.4);box(s*1.95,2.3,23.1,3.7,4.6,0.25,C.wood,2)}
box(0,5.2,23,9.6,0.6,0.9,C.red);put(PRISM,0,6.2,23,0,PI/2,0,3.6,1.5,11.5,C.roofD,3);
// hall behind gate
box(0,0.6,37,24,1.2,13,C.stoneD,5);box(0,3.6,38,19,5,8,C.plaster);for(let i=0;i<6;i++)cyl(-9+i*3.6,3.6,33.6,0.6,5,0.6,C.red);put(PRISM,0,9.2,37.5,0,PI/2,0,15,6.2,27,C.roof,3);box(0,12.3,37.5,27.6,0.5,0.7,C.gold);
torii(-17);
toro(-7.5,-9);toro(7.5,-9);toro(-7.5,6);toro(7.5,6);
fox(-6.6,-14.4,1);fox(6.6,-14.4,-1);
// sacred tree (the trunk runs up into the middle sphere of the crown, like leafy())
const stL=[];for(let i=0;i<7;i++){const a=i/6*TAU,rr=i<6?3.2:0;const d=5+R()*1.6;stL.push([-15+Math.cos(a)*rr,8.6+R()*1.5+(i===6?2:0),-5+Math.sin(a)*rr,d,d*0.8,d,i%2?C.leaf:C.leafD])}
{const m=stL[6],th=m[1]-m[4]/2+0.4*m[4];cyl(-15,th/2,-5,2.3,th,2.3,C.trunk,9)}cyl(-15,1.7,-5,2.6,0.3,2.6,C.paper);for(let i=0;i<5;i++){const a=i/5*TAU;box(-15+Math.cos(a)*1.32,1.35,-5+Math.sin(a)*1.32,0.22,0.5,0.22,C.white)}
for(const q of stL)sph(q[0],q[1],q[2],q[3],q[4],q[5],q[6],8,0,F_SWAY);colC.push({x:-15,z:-5,r:1.5,h:7});
leafy(-18.5,-22,1,R,C.sakura,C.sakuraD,1);leafy(18.5,-22,1.1,R,C.sakura,C.sakuraD,1);leafy(18.5,17.5,1,R,C.sakura,C.sakuraD,1);leafy(-18.5,18,0.9,R,C.sakura,C.sakuraD,1);
// chozuya
for(const[x,z]of[[-1.5,-1.1],[1.5,-1.1],[-1.5,1.1],[1.5,1.1]])box(15+x,1.4,9+z,0.28,2.8,0.28,C.woodD,2);put(PRISM,15,3.35,9,0,PI/2,0,3.6,1.1,4.8,C.roof,3);box(15,0.45,9,2.2,0.9,1.1,C.stoneD,5);box(15,0.92,9,1.9,0.06,0.8,C.water,7,1);colB.push({x0:13.7,x1:16.3,z0:8.2,z1:9.8,h:1});
// sake barrels
for(const[bx,by]of[[-1.3,0.6],[0,0.6],[1.3,0.6],[-0.65,1.72],[0.65,1.72],[0,2.84]]){put(CYL,-17.5,by,10+bx,0,0,PI/2,1.2,1.1,1.2,C.paper,6);put(CYL,-17.5,by,10+bx,0,0,PI/2,1.24,0.3,1.24,C.red)}colB.push({x0:-18.2,x1:-16.8,z0:8,z1:12,h:3.4});
[C.flag1,C.flag2,C.flag3,C.flag1].forEach((c,i)=>{nobori(-3.5,-12+i*7,c);nobori(3.5,-12+i*7,i%2?C.flag1:C.flag2)});
// forest
for(let i=0;i<64;i++){const a=i/64*TAU+R()*0.08,d=34+R()*26,x=Math.cos(a)*d,z=Math.sin(a)*d-2;if(Math.abs(x)<26&&z>-31&&z<27)continue;if(Math.abs(x)<20&&z>24&&z<50)continue;if(R()<0.72)cedar(x,z,0.8+R()*0.7,R);else leafy(x,z,1.3+R()*0.6,R,C.leaf,C.leafD,0)}
// hills / mountains / clouds
for(let i=0;i<10;i++){const a=i/10*TAU+R()*0.3,d=140+R()*120;sph(Math.cos(a)*d,-6,Math.sin(a)*d,150+R()*90,50+R()*40,130+R()*60,i%2?C.hill:C.hill2)}
put(CONE,-150,48,-540,0,0,0,420,120,420,C.mount);put(CONE,-150,91,-540,0,0,0,123,34.6,123,C.white);put(CONE,230,24,-470,0,0,0,330,74,330,C.mount2);put(CONE,420,20,-150,0,0,0,300,66,300,C.mount2);put(CONE,-430,22,120,0,0,0,320,70,320,C.mount);
for(let k=0;k<11;k++){const a=k/11*TAU+R()*0.4,d=230+R()*200,h=75+R()*90,cx=Math.cos(a)*d,cz=Math.sin(a)*d;const n=4+((R()*3)|0);for(let i=0;i<n;i++){const w=45+R()*40;sph(cx+(i-n/2)*30+R()*10,h+R()*8-(i%2)*4,cz+R()*20,w,w*0.38,w*0.7,C.white,0,0,F_NOCAST|F_DRIFT)}}
// ---- extra props (own RNG so the layout above is unchanged) ----
const R2=mulberry(71);
// shimenawa
put(CYL,0,5.55,-17,0,0,PI/2,0.46,8.4,0.46,C.rope,6);put(CYL,0,5.45,-17,0,0,PI/2,0.6,2.4,0.6,C.rope,6);
for(const x of[-2.8,0,2.8])for(let k=0;k<3;k++)box(x+(k%2?0.1:-0.1),5.12-k*0.3,-17,0.3,0.3,0.04,C.white);
for(const x of[-1.4,1.4]){cyl(x,4.95,-17,0.14,0.9,0.14,C.rope,6);put(CONE,x,4.35,-17,0,0,0,0.3,0.5,0.3,C.rope,6)}
// ema rack
for(const z of[-8.6,-5.4])box(20.2,1.1,z,0.18,2.2,0.18,C.woodD,2);put(PRISM,20.2,2.4,-7,0,0,0,1.1,0.45,3.8,C.roof,3);
for(const y of[1.35,1.95]){box(20.2,y,-7,0.1,0.08,3.3,C.woodD);for(let i=0;i<7;i++){const z=-8.4+i*0.47+(R2()-0.5)*0.08,ry=(R2()-0.5)*0.3;put(BOX,20.08,y-0.26,z,0,ry,0,0.03,0.26,0.4,C.ema);put(PRISM,20.08,y-0.07,z,0,PI/2+ry,0,0.4,0.12,0.03,C.ema);put(BOX,20.06,y-0.27,z,0,ry,0,0.03,0.1,0.16,[C.red,C.ink,C.flag2,C.gold][(R2()*4)|0])}}
colB.push({x0:19.6,x1:21.6,z0:-8.8,z1:-5.2,h:2.6});
// fallen petals
for(const[tx,tz]of[[-18.5,-22],[18.5,-22],[18.5,17.5],[-18.5,18]])for(let i=0;i<26;i++){const a=R2()*TAU,d=0.6+R2()*4,x=clamp(tx+Math.cos(a)*d,-21.8,21.8),z=clamp(tz+Math.sin(a)*d,-25.8,21.8);
 put(BOX,x,0.015,z,0,R2()*PI,0,0.2,0.02,0.13,R2()<0.6?C.sakura:C.sakuraD,0,0,F_NOEDGE|F_NOCAST)}
// wall grass
for(let i=0;i<24;i++){const side=i%4,t=R2();let x,z;if(side===0){x=-21.9;z=-25+t*46}else if(side===1){x=21.9;z=-25+t*46}else if(side===2){x=-21+t*42;z=-26}else{x=(t<0.5?-21+t*30:5+(t-0.5)*32);z=22}
 put(CONE,x,0.3,z,0,0,0,0.2,0.6,0.2,C.tuft);for(let k=0;k<5;k++){const a=k/5*TAU+R2();put(CONE,x+Math.cos(a)*0.13,0.22,z+Math.sin(a)*0.13,Math.sin(a)*0.5,0,-Math.cos(a)*0.5,0.18,0.48,0.18,k%2?C.tuft:C.leafD)}}
// gate lanterns
for(const x of[-2.2,2.2])chochin(x,3.85,22.2,C.red);
}
// while a boss is up, the yard north of z -25.6 is its body: close it whatever the stage's arena says
// (the stage 4 monk moves around, so the whole yard stays open; his fallen bell is a round obstacle)
function collide(o,r){o.x=clamp(o.x,-BX+r,BX-r);o.z=clamp(o.z,(boss&&!boss.monk?Math.max(BZ0,-25.6):BZ0)+r,BZ1-r);
if(boss&&boss.bell2&&boss.bell2.y<0.3){const c=boss.bell2,dx=o.x-c.x,dz=o.z-c.z,rr=r+MK_BELL_R,d2=dx*dx+dz*dz;if(d2<rr*rr&&d2>1e-6){const d=Math.sqrt(d2);o.x=c.x+dx/d*rr;o.z=c.z+dz/d*rr}}
for(const c of colC){const dx=o.x-c.x,dz=o.z-c.z,rr=r+c.r,d2=dx*dx+dz*dz;if(d2<rr*rr&&d2>1e-6){const d=Math.sqrt(d2);o.x=c.x+dx/d*rr;o.z=c.z+dz/d*rr}}
for(const b of colB){const nx=clamp(o.x,b.x0,b.x1),nz=clamp(o.z,b.z0,b.z1),dx=o.x-nx,dz=o.z-nz,d2=dx*dx+dz*dz;if(d2<r*r){if(d2>1e-8){const d=Math.sqrt(d2);o.x=nx+dx/d*r;o.z=nz+dz/d*r}else{o.z=b.z1+r}}}}
function rayWorld(ox,oy,oz,dx,dy,dz,maxT){let t=maxT;if(dy<0){const tg=-oy/dy;if(tg<t)t=tg}
const pl4=[[dx,ox,BX+1],[-dx,-ox,BX+1],[dz,oz,BZ1+1],[-dz,-oz,1-BZ0]];for(const[d,o,lim]of pl4){if(d>1e-5){const tt=(lim-o)/d;if(tt>0&&tt<t&&oy+dy*tt<3.3)t=tt}}
const slab=(x0,x1,z0,z1,h)=>{let t0=0,t1=t;const ax=[[ox,dx,x0,x1],[oy,dy,0,h],[oz,dz,z0,z1]];for(const[o,d,a,b]of ax){if(Math.abs(d)<1e-6){if(o<a||o>b)return}else{let u=(a-o)/d,v=(b-o)/d;if(u>v){const w=u;u=v;v=w}if(u>t0)t0=u;if(v<t1)t1=v;if(t0>t1)return}}if(t0>0&&t0<t)t=t0};
for(const c of colC)slab(c.x-c.r*.8,c.x+c.r*.8,c.z-c.r*.8,c.z+c.r*.8,c.h);for(const b of colB)slab(b.x0,b.x1,b.z0,b.z1,b.h);return t}
