'use strict';
// ================= STAGES 3-5 =================
// 3 黄昏の町 / 4 雪の古寺 / 5 墨の池 (STORY.md 1). Same play area as stages 1-2 (x ±21.6, z -25.6..21.6, boss rising at the north end).
// Authored in Blender (blender/stage_*.blend -> assets/*.glb, loaded by js/glb.js). buildStageNCode() is the code-built original:
// fallback when the GLB can't be loaded, ?stageN=code for comparisons, and the reference for tools/check_stage_parity.js.
// "//#name" comments mark prop groups for tools/dump_stage.js (they become Blender collections).
Object.assign(C,{
 deck:hex(0xb98552),deckD:hex(0x6f4329),river:hex(0xf0a060),bank:hex(0xa3825c),twall:hex(0xf2dcc0),troof:hex(0x51496a),troofD:hex(0x372f4d),glow:hex(0xffc75a),road:hex(0xd2b98e),
 sun:hex(0xffe08a),cloudP:hex(0xffa88f),cloudV:hex(0xc98bb8),mountP:hex(0x9a6aa0),mountP2:hex(0xc58ea8),hillS:hex(0x9b7f7a),willow:hex(0x86b24c),willowD:hex(0x5f9440),bronze:hex(0xb08a3a),noren:hex(0x2f3f7a),bamboo:hex(0xc9b56a),
 snow:hex(0xf4f7ff),ice:hex(0xbfe9ff),twood:hex(0x6b3f2c),troof4:hex(0x3f4a5e),ochre:hex(0xdcbc7e),bronze4:hex(0x5d6b5c),mountW:hex(0xdfe7f5),mountR:hex(0x8090ae),
 paperS:hex(0xe9e5da),inkG:hex(0x56545e),inkM:hex(0x8d8c94),inkL:hex(0xb9b8bf),inkP:hex(0x141218),seal:hex(0xd9262c),ropeG:hex(0xbdb8aa)});
function buildStage3(){if(STAGE_GLB[2])emitGlbStage(STAGE_GLB[2]);else buildStage3Code()}
function buildStage4(){if(STAGE_GLB[3])emitGlbStage(STAGE_GLB[3]);else buildStage4Code()}
function buildStage5(){if(STAGE_GLB[4])emitGlbStage(STAGE_GLB[4]);else buildStage5Code()}
// a straight run along (x0,z0)-(x1,z1): f(len) is called in a local frame (x along the run, origin at its centre)
function along(x0,z0,x1,z1,f){const len=Math.hypot(x1-x0,z1-z0);mPush();mT((x0+x1)/2,0,(z0+z1)/2);mRY(Math.atan2(-(z1-z0),x1-x0));f(len);mPop()}

// ---------------- Stage 3: 黄昏の町 — a wide wooden bridge over the river at sunset, row houses on both banks ----------------
function buildStage3Code(){const R=mulberry(31),NF=F_UNLIT|F_NOCAST,G0=-2.2;
//#river
box(0,-5,0,1700,1,1700,C.river,7,1);
for(const s of[-1,1]){box(0,-3.4,s<0?-334:330,1700,2.4,600,C.bank,4);box(0,-3.3,s<0?-33.6:29.6,1700,2.6,0.8,C.stoneD,5)}
//#bridge
box(0,-0.35,-2,46.6,0.7,68,C.deck,3);
for(const s of[-1,1]){box(s*23.6,-0.95,-2,0.9,1.3,68,C.deckD);for(let z=-30;z<=26;z+=8)cyl(s*22.6,-2.6,z,1.1,4.4,1.1,C.deckD)}
//#railings
const rail=(x0,z0,x1,z1)=>along(x0,z0,x1,z1,len=>{box(0,1.12,0,len,0.16,0.24,C.deck);box(0,0.62,0,len,0.12,0.16,C.deck);const n=Math.max(1,Math.round(len/4.4));
 for(let i=0;i<=n;i++){const x=-len/2+len*i/n;box(x,0.6,0,0.34,1.2,0.34,C.deckD,2);if(i===0||i===n||i%2===0){sph(x,1.34,0,0.44,0.4,0.44,C.bronze,0,.7);put(CONE,x,1.68,0,0,0,0,0.2,0.4,0.2,C.bronze,0,.7)}}});
rail(-23,-36,-23,32);rail(23,-36,23,32);rail(-23,23,-4.4,23);rail(4.4,23,23,23);
//#barricade
along(-23,-27.6,23,-27.6,len=>{box(0,0.7,0,len,0.12,0.12,C.bamboo);box(0,1.9,0,len,0.12,0.12,C.bamboo);for(let i=0;i<16;i++){const x=-len/2+(i+0.5)*len/16;for(const s of[-1,1])put(CYL,x,1.25,0,0,0,s*0.55,0.12,2.9,0.12,C.bamboo)}});
//#gates
for(const s of[-1,1]){cyl(s*3.9,2.6,23,0.8,5.2,0.8,C.deckD);box(s*1.95,2.3,23.1,3.7,4.6,0.25,C.wood,2)}
box(0,5.2,23,9.6,0.6,0.9,C.deckD);put(PRISM,0,6.2,23,0,PI/2,0,3.6,1.5,11.5,C.troofD,3);
for(const s of[-1,1])box(s*4.2,0.8,-35,0.7,6,0.7,C.deckD);box(0,3.6,-35,10.4,0.6,0.8,C.deckD);put(PRISM,0,4.5,-35,0,PI/2,0,2.6,1.2,11.6,C.troofD,3);for(const s of[-1,1])chochin(s*2.4,2.0,-34.4,C.lant,F_UNLIT);
//#fire_towers
const tower=(x,z)=>{const h=15;for(const[dx,dz]of[[-1,-1],[1,-1],[-1,1],[1,1]])put(CYL,x+dx*1.25,G0+h/2,z+dz*1.25,-dz*0.06,0,dx*0.06,0.3,h,0.3,C.deckD);
 for(const y of[G0+4,G0+9]){box(x,y,z-1.1,2.5,0.14,0.14,C.deckD);box(x,y,z+1.1,2.5,0.14,0.14,C.deckD);box(x-1.1,y,z,0.14,0.14,2.5,C.deckD);box(x+1.1,y,z,0.14,0.14,2.5,C.deckD)}
 box(x,G0+h-0.5,z,2.8,0.2,2.8,C.deck,3);for(const[dx,dz]of[[-1,-1],[1,-1],[-1,1],[1,1]])cyl(x+dx*1.2,G0+h+0.5,z+dz*1.2,0.14,1.9,0.14,C.deckD);
 put(PYR,x,G0+h+2.0,z,0,0,0,3.8,1.6,3.8,C.troofD);put(CONE,x,G0+h+0.6,z,0,0,0,0.6,0.8,0.6,C.bronze,0,.8);
 for(const s of[-1,1])put(CYL,x+s*0.45,G0+h/2-0.6,z+1.9,-0.12,0,0,0.12,h-1,0.12,C.deck);for(let i=1;i<7;i++)box(x,G0+i*2,z+1.98-i*0.24,0.9,0.1,0.14,C.deck)};
tower(-20,-40);tower(20,-40);tower(34,52);
//#houses
// a row house / shop in its own frame: width along local x, front (the street side) at local +z.
// kind 0 = river-front house, 1 = shop on the main street (sign, lantern), 2 = plain house in the back row
const bldg=(x,z,ry,w,d,h,kind)=>{mPush();mT(x,G0,z);mRY(ry);box(0,h/2,0,w,h,d,C.twall);box(0,0.6,0,w+0.04,1.2,d+0.04,C.wood,2);
 put(PRISM,0,h+1.0,0,0,PI/2,0,d+1.4,2.0,w+0.6,R()<.5?C.troof:C.troofD,3);
 if(kind<2){box(0,1.35,d/2+0.03,w*0.72,1.7,0.06,C.deckD,2);put(BOX,0,2.75,d/2+0.6,0.32,0,0,w+0.3,0.12,1.3,C.troofD,3);
  box((R()-0.5)*w*0.3,1.95,d/2+0.1,1.8,0.9,0.04,[C.noren,C.red,C.white,C.orange][(R()*4)|0]);
  if(h>4.5)box(0,h-1.3,d/2+0.03,w*0.5,0.7,0.07,C.glow,0,0,F_UNLIT)
  else box(w*0.28,2.1,d/2+0.04,w*0.18,0.5,0.06,C.glow,0,0,F_UNLIT);
  if(kind===1){box(-w/2+0.6,1.6,d/2+1.0,0.1,2.4,0.55,C.paper);if(R()<0.5)chochin(w/2-0.8,1.7,d/2+0.7,R()<.5?C.red:C.lant,F_UNLIT)}}
 else box(0,h*0.6,d/2+0.02,w*0.32,0.9,0.08,C.glow,0,0,F_UNLIT);
 if(R()<0.2)sph((R()-0.5)*w*0.5,h+1.5,0,w*0.32,0.8,d*0.5,C.ink);mPop()};
for(const[zf,face]of[[-39.5,1],[35.5,-1]])for(const s of[-1,1]){let x=27;while(x<104){const w=8+R()*6,cx=s*(x+w/2);bldg(cx,zf,face>0?0:PI,w,7,3.4+R()*0.8,0);if(R()<0.8)bldg(cx+(R()-0.5)*3,zf-face*8.5,face>0?0:PI,w*0.9,7,5.2+R()*1.2,2);x+=w+0.6+R()*1.5}}
//#main_road
box(0,0.03,-2,9,0.06,68,C.stoneL,1);for(const s of[-1,1])box(s*4.6,0.07,-2,0.3,0.14,68,C.deckD);
box(0,-2.15,-169,9.4,0.1,270,C.road,1);box(0,-2.15,166,9.4,0.1,272,C.road,1);put(CYL,0,-2.14,-62,0,0,0,15,0.1,15,C.road,1);
//#street_houses
for(const[z0,z1]of[[-44,-55],[-69,-118],[38,96]])for(const s of[-1,1]){let z=z0;const dir=z1>z0?1:-1;while(dir>0?z<z1:z>z1){const w=7+R()*3.5;bldg(s*8.6,z+dir*w/2,s>0?-PI/2:PI/2,w,7,R()<0.75?5.4+R()*1.2:3.8,1);
 if(R()<0.4)bldg(s*17.4,z+dir*w/2,s>0?-PI/2:PI/2,w*0.95,7,4.6+R()*1.4,2);z+=dir*(w+0.4)}}
//#street_lanterns
for(const[z0,z1]of[[-40,-112],[34,90]])for(let z=z0;Math.abs(z)<=Math.abs(z1);z+=(z1>z0?1:-1)*14)for(const s of[-1,1]){if(Math.abs(z+62)<9)continue;cyl(s*5.3,-1.4,z,0.14,1.6,0.14,C.deckD);box(s*5.3,-0.35,z,0.55,0.6,0.55,C.glow,0,0,F_UNLIT);put(PYR,s*5.3,0.05,z,0,0,0,0.8,0.25,0.8,C.troofD)}
//#festival_yagura
{const x=0,z=-62,b=G0,top=[x,b+10.4,z];for(const[dx,dz]of[[-1,-1],[1,-1],[-1,1],[1,1]])box(x+dx*3.6,b+4.5,z+dz*3.6,0.5,9,0.5,C.deckD);
 box(x,b+5,z,8.4,0.4,8.4,C.deck,3);for(let k=0;k<4;k++)for(let i=0;i<8;i++){const u=-3.5+i,c=i%2?C.white:C.red;if(k<2)box(x+u,b+2.55,z+(k?3.85:-3.85),1.0,4.5,0.06,c);else box(x+(k>2?3.85:-3.85),b+2.55,z+u,0.06,4.5,1.0,c)}
 for(const s of[-1,1]){box(x,b+5.8,z+s*4.1,8.4,0.14,0.14,C.deckD);box(x+s*4.1,b+5.8,z,0.14,0.14,8.4,C.deckD)}
 for(const[dx,dz]of[[-1,-1],[1,-1],[-1,1],[1,1]])cyl(x+dx*2.2,b+7.0,z+dz*2.2,0.18,3.6,0.18,C.deckD);put(PYR,x,b+9.6,z,0,0,0,6.6,2.0,6.6,C.troofD);put(CONE,x,b+10.9,z,0,0,0,0.4,0.8,0.4,C.bronze,0,.8);
 put(CYL,x,b+6.0,z,0,0,PI/2,1.8,1.6,1.8,C.red);put(CYL,x,b+6.0,z,0,0,PI/2,1.4,1.64,1.4,C.paper);
 for(const[ex,ez]of[[-6.4,-55.5],[6.4,-55.5],[-6.4,-68.5],[6.4,-68.5],[0,-50],[0,-74]]){const e=[ex,b+4.2,ez],dx=e[0]-top[0],dy=e[1]-top[1],dz=e[2]-top[2],hl=Math.hypot(dx,dz),l=Math.hypot(hl,dy);
  mPush();mT((top[0]+e[0])/2,(top[1]+e[1])/2,(top[2]+e[2])/2);mRY(Math.atan2(-dz,dx));mRZ(Math.atan2(dy,hl));put(CYL,0,0,0,0,0,PI/2,0.05,l,0.05,C.black);mPop();
  for(let i=1;i<=5;i++){const t=i/6;sph(top[0]+dx*t,top[1]+dy*t-0.35,top[2]+dz*t,0.48,0.6,0.48,i%2?C.red:C.glow,6,0,F_UNLIT)}}}
//#willows
const willow=(x,z,s)=>{put(CYL,x,G0+2.2*s,z,0,0,0.12,0.5*s,4.4*s,0.5*s,C.trunk,9);for(let i=0;i<6;i++){const a=i/6*TAU+R(),r=1.3*s;put(CONE,x+0.5*s+Math.cos(a)*r,G0+3.4*s,z+Math.sin(a)*r,PI,0,0,1.5*s,3.6*s,1.5*s,i%2?C.willow:C.willowD,8,0,F_SWAY)}sph(x+0.5*s,G0+4.9*s,z,2.6*s,1.2*s,2.6*s,C.willowD,8,0,F_SWAY)};
for(const s of[-1,1]){willow(s*31,-35.4,1.1);willow(s*62,-35.4,1);willow(s*33,31.4,1);willow(s*70,31.4,1.1)}
//#boats
const boat=(x,z,a)=>{mPush();mT(x,-4.15,z);mRY(a);put(PRISM,0,0,0,PI,0,0,1.6,0.7,6,C.deckD);box(0,0.38,0,1.5,0.08,5.6,C.deck,3);box(0,0.66,-1.8,0.6,0.5,0.6,C.glow,0,0,F_UNLIT);mPop()};
boat(-36,4,0.3);boat(44,-10,-0.2);boat(74,14,0.1);
//#lantern_poles
for(const s of[-1,1])for(const z of[-19,-7,5,15]){const x=s*20.2;cyl(x,1.7,z,0.18,3.4,0.18,C.deckD);box(x-s*0.45,3.3,z,1.0,0.12,0.12,C.deckD);chochin(x-s*0.85,2.25,z,C.lant,F_UNLIT);colC.push({x:x-s*0.4,z,r:0.75,h:3.4})}
//#food_stall
{const x=-15.5,z=8;box(x,0.5,z,1.6,1.0,3.2,C.wood,2);box(x,1.05,z,1.8,0.1,3.4,C.deckD);for(const[dx,dz]of[[-0.8,-1.6],[0.8,-1.6],[-0.8,1.6],[0.8,1.6]])box(x+dx,1.6,z+dz,0.14,3.2,0.14,C.deckD);
 put(PRISM,x,3.5,z,0,0,0,2.6,0.9,4.0,C.troofD,3);for(let i=0;i<3;i++)box(x+0.95,2.62,z+(i-1)*1.05,0.04,0.7,0.95,C.noren);chochin(x+1.1,2.2,z-1.9,C.red);
 for(let i=0;i<3;i++)cyl(x+0.3,1.2,z-0.9+i*0.9,0.4,0.18,0.4,C.white);box(x+2.2,0.45,z,0.7,0.12,2.6,C.wood);for(const dz of[-1,1])box(x+2.2,0.2,z+dz*1.1,0.5,0.4,0.12,C.deckD);
 colB.push({x0:x-1,x1:x+1.3,z0:z-1.9,z1:z+1.9,h:3.4});colB.push({x0:x+1.85,x1:x+2.55,z0:z-1.3,z1:z+1.3,h:0.5})}
//#tea_bench
{const x=15.5,z=-3;for(const dz of[-1.4,1.4]){box(x,0.45,z+dz,1.0,0.12,2.2,C.wood);box(x,0.53,z+dz,1.04,0.04,2.24,C.red);for(const lz of[-0.9,0.9])box(x,0.2,z+dz+lz,0.8,0.4,0.12,C.deckD)}
 cyl(x,1.9,z,0.1,3.8,0.1,C.deckD);put(CONE,x,3.6,z,0,0,0,4.6,1.1,4.6,C.red,6);sph(x,4.18,z,0.2,0.2,0.2,C.red);colC.push({x,z,r:1.6,h:3.9})}
//#handcart
mPush();mT(13.5,0,12);mRY(0.35);box(0,1.0,0,1.8,0.14,3.0,C.wood,3);for(const s of[-1,1]){put(CYL,s*1.0,0.9,0.2,0,0,PI/2,1.8,0.14,1.8,C.deckD);put(CYL,s*1.0,0.9,0.2,0,0,PI/2,0.5,0.24,0.5,C.wood)}
for(const s of[-1,1])box(s*0.6,0.95,-2.4,0.12,0.12,2.2,C.deckD);for(const[bx,bz]of[[-0.45,-0.7],[0.45,-0.7],[0,0.6]])put(CYL,bx,1.55,bz,0,0,0,0.8,1.0,0.8,C.straw,6);put(CYL,0,1.5,1.1,PI/2,0,0,0.7,1.2,0.7,C.straw,6);mPop();
colB.push({x0:12,x1:15,z0:9.6,z1:14.4,h:2.1});
//#fire_buckets
{const x=-14.5,z=-12;cyl(x,0.75,z,1.6,1.5,1.6,C.wood,6);cyl(x,1.53,z,1.66,0.06,1.66,C.deckD);for(const[bx,by]of[[-0.55,0],[0,0],[0.55,0],[-0.28,0.46],[0.28,0.46],[0,0.92]])cyl(x+bx,1.79+by,z,0.5,0.46,0.5,C.red);colC.push({x,z,r:0.95,h:3})}
//#crates
box(16.5,0.55,-17,1.1,1.1,1.1,C.wood,2);box(17.6,0.55,-16.4,1.1,1.1,1.1,C.wood,3);box(16.9,1.6,-16.7,1.0,1.0,1.0,C.wood,2);colB.push({x0:15.9,x1:18.2,z0:-17.6,z1:-15.8,h:2.1});
//#nobori
nobori(-7,-12,C.orange);nobori(7,-12,C.noren);nobori(-7,2,C.noren);nobori(7,2,C.orange);
//#ink_stains
for(const[x,z,r]of[[-19,-21,1.6],[18,-9,1.2],[-20,13,1.4],[10,-24,1.0]]){put(CYL,x,0.012,z,0,R()*PI,0,r*1.6,0.02,r,C.ink,0,0,F_NOCAST);sph(x+r*0.9,0.02,z+r*0.3,r*0.5,0.03,r*0.4,C.ink,0,0,F_NOCAST)}
//#background
put(SPH,-640,190,-230,0,0,0,24,230,230,C.sun,0,0,NF);
for(let i=0;i<8;i++){const a=i/8*TAU+R()*0.3,d=170+R()*90;sph(Math.cos(a)*d,-6,Math.sin(a)*d,150+R()*90,40+R()*30,130+R()*60,C.hillS)}
put(CONE,-420,26,-380,0,0,0,360,80,360,C.mountP);put(CONE,300,24,-460,0,0,0,330,72,330,C.mountP2);put(CONE,460,20,120,0,0,0,300,64,300,C.mountP2);put(CONE,-460,22,200,0,0,0,320,70,320,C.mountP);
put(CONE,190,40,-330,0,0,0,170,110,170,C.mountP);for(let i=0;i<4;i++){box(190,93+i*3.4,-330,4-i*0.6,2,4-i*0.6,C.troofD);put(PYR,190,94.6+i*3.4,-330,0,0,0,7-i*0.9,1.4,7-i*0.9,C.troofD)}put(CONE,190,109,-330,0,0,0,0.6,4,0.6,C.troofD);
for(let k=0;k<9;k++){const a=k/9*TAU+R()*0.4,d=260+R()*180,h=70+R()*70,cx=Math.cos(a)*d,cz=Math.sin(a)*d;for(let i=0;i<3;i++){const w=70+R()*60;sph(cx+(i-1)*48+R()*14,h+R()*6,cz+R()*16,w,w*0.12,w*0.34,i%2?C.cloudP:C.cloudV,0,0,NF|F_DRIFT)}}
}

// ---------------- Stage 4: 雪の古寺 — snowy mountain temple; the belfry stands empty (the monk carries the seal bell) ----------------
function buildStage4Code(){const R=mulberry(41),NF=F_UNLIT|F_NOCAST;
const wallSnow=(x0,z0,x1,z1)=>along(x0,z0,x1,z1,len=>{box(0,0.35,0,len,0.7,1.0,C.stoneD,5);box(0,1.6,0,len,1.8,0.6,C.ochre);for(const y of[1.15,1.6,2.05])box(0,y,0,len+0.02,0.07,0.62,C.white);
 put(PRISM,0,2.85,0,0,PI/2,0,1.7,0.7,len+0.3,C.troof4,3);put(PRISM,0,3.02,0,0,PI/2,0,1.2,0.5,len+0.36,C.snow)});
const cedarSnow=(x,z,s,R)=>{const c=R()<.5?C.cedar:C.cedarD;cyl(x,1.5*s,z,0.8*s,3*s,0.8*s,C.trunk,9);for(const[yc,hh,wd]of[[5.5,7,6],[9,6,4.8],[12,5,3.4]]){put(CONE,x,yc*s,z,0,0,0,wd*s,hh*s,wd*s,c,8,0,F_SWAY);const ap=(yc+hh/2)*s,sh=hh*0.42*s;put(CONE,x,ap-sh/2+0.06*s,z,0,0,0,wd*0.47*s,sh,wd*0.47*s,C.snow,0,0,F_SWAY)}};
//#ground
box(0,-0.62,0,1700,1,1700,C.snow);box(0,0.02,-2,4.6,0.1,49,C.stoneL,1);put(CYL,0,0,-4,0,0,0,13,0.06,13,C.stone,1);
for(let i=0;i<9;i++)sph((R()-0.5)*4,0.06,-24+i*5.4+R()*2,1.6+R(),0.1,1.1+R()*0.6,C.snow,0,0,F_NOCAST);
//#walls
wallSnow(-23,-27,23,-27);wallSnow(-23,23,-4.4,23);wallSnow(4.4,23,23,23);wallSnow(-23,-27,-23,23);wallSnow(23,-27,23,23);
for(const[x,z]of[[-23,-27],[23,-27],[-23,23],[23,23]]){box(x,1.9,z,1.1,3.8,1.1,C.twood,2);put(PYR,x,4.1,z,0,0,0,1.7,0.7,1.7,C.troof4);put(PYR,x,4.32,z,0,0,0,1.2,0.45,1.2,C.snow)}
//#snow_drifts
for(const[x,z]of[[-21,-24],[-21.5,-10],[-21.3,3],[21.2,-22],[21.4,14],[-14,-25.6],[6,-25.8],[15,21.6],[-12,21.4],[-21.2,17]])sph(x,0,z,3.6+R()*1.6,1.1,1.6+R()*0.6,C.snow);
//#gate
for(const s of[-1,1]){cyl(s*3.9,2.6,23,0.8,5.2,0.8,C.twood);box(s*1.95,2.3,23.1,3.7,4.6,0.25,C.wood,2)}
box(0,5.2,23,9.6,0.6,0.9,C.twood);put(PRISM,0,6.2,23,0,PI/2,0,3.6,1.5,11.5,C.troof4,3);put(PRISM,0,6.55,23,0,PI/2,0,2.6,0.9,11.7,C.snow);
//#main_hall
box(0,0.6,-41,30,1.2,16,C.stoneD,5);box(0,4.0,-41,24,5.6,11,C.twood,2);box(0,3.6,-35.45,12,3.4,0.1,C.paper);for(let i=0;i<7;i++)cyl(-11+i*3.667,4.0,-35.2,0.5,5.6,0.5,C.twood);
put(PRISM,0,9.6,-41,0,PI/2,0,17,5.6,31,C.troof4,3);put(PRISM,0,10.8,-41,0,PI/2,0,12.4,4.0,31.4,C.snow);box(0,12.9,-41,26,0.45,0.6,C.troof4);
//#belfry
{const x=-15.5,z=-17.5;box(x,0.6,z,5.6,1.2,5.6,C.stoneD,5);sph(x,1.25,z,5.2,0.3,5.2,C.snow);
 for(const[dx,dz]of[[-1,-1],[1,-1],[-1,1],[1,1]])put(BOX,x+dx*1.9,4.0,z+dz*1.9,-dz*0.04,0,dx*0.04,0.4,5.6,0.4,C.twood,2);
 for(const s of[-1,1]){box(x,6.4,z+s*1.85,4.2,0.3,0.3,C.twood);box(x+s*1.85,6.4,z,0.3,0.3,4.2,C.twood)}
 put(PYR,x,8.0,z,0,0,0,7.4,2.6,7.4,C.troof4);put(PYR,x,8.55,z,0,0,0,5.2,1.6,5.2,C.snow);
 box(x,6.15,z,4.0,0.26,0.3,C.twood);cyl(x,5.75,z,0.08,0.6,0.08,C.black);put(CYL,x,3.6,z+1.2,0,0,PI/2,0.36,2.6,0.36,C.wood);for(const s of[-1,1])cyl(x+s*0.9,4.95,z+1.2,0.05,2.5,0.05,C.rope);
 colB.push({x0:x-2.8,x1:x+2.8,z0:z-2.8,z1:z+2.8,h:7})}
//#jizo
for(let i=0;i<6;i++){const x=19.6,z=-6+i*2.6;box(x,0.2,z,1.0,0.4,1.0,C.stoneD,5);sph(x,1.0,z,0.72,1.25,0.62,C.stone);sph(x,1.9,z,0.52,0.54,0.52,C.stone);put(CONE,x-0.1,1.42,z,0,0,0,0.82,0.55,0.72,C.red);sph(x,2.14,z,0.42,0.16,0.42,C.snow);sph(x+0.05,0.42,z,1.1,0.3,1.1,C.snow)}
colB.push({x0:18.9,x1:20.3,z0:-6.7,z1:7.7,h:2.3});
//#lanterns
for(const[x,z]of[[-7,-6],[7,-6],[-7,9],[7,9]]){toro(x,z);put(PYR,x,3.14,z,0,0,0,1.25,0.32,1.25,C.snow);sph(x,0.4,z,1.6,0.2,1.6,C.snow)}
//#incense_burner
{const x=0,z=-8;box(x,0.25,z,2.4,0.5,2.4,C.stoneD,5);for(let i=0;i<3;i++){const a=i/3*TAU;put(CYL,x+Math.cos(a)*0.7,0.85,z+Math.sin(a)*0.7,0,0,0,0.22,0.8,0.22,C.bronze4)}
 put(CYL,x,1.5,z,0,0,0,2.0,0.7,2.0,C.bronze4,0,.6);cyl(x,1.87,z,1.7,0.06,1.7,C.ink);for(const[dx,dz]of[[-0.6,-0.6],[0.6,-0.6],[-0.6,0.6],[0.6,0.6]])cyl(x+dx,2.5,z+dz,0.12,1.2,0.12,C.bronze4);
 put(PYR,x,3.45,z,0,0,0,2.4,0.8,2.4,C.bronze4,0,.6);put(PYR,x,3.62,z,0,0,0,1.6,0.46,1.6,C.snow);sph(x,4.1,z,0.3,0.3,0.3,C.bronze4,0,.6);
 for(let i=0;i<3;i++)sph(x+0.25*i,4.6+i*0.9,z,0.7+i*0.25,0.5+i*0.15,0.7+i*0.25,C.smoke,0,0,F_NOCAST|F_SWAY);colC.push({x,z,r:1.4,h:4})}
//#seal_stone
{const x=11,z=-14;box(x,0.3,z,2.4,0.6,1.4,C.stoneD,5);box(x,2.1,z,1.5,3.0,0.5,C.stone);box(x,3.64,z,1.6,0.1,0.6,C.snow);put(CYL,x,2.4,z+0.26,PI/2,0,0,0.9,0.02,0.9,C.ink);
 for(let k=0;k<3;k++){const a=k/3*TAU+0.5;sph(x+Math.cos(a)*0.2,2.4+Math.sin(a)*0.2,z+0.28,0.2,0.2,0.04,C.paper)}colB.push({x0:x-1.2,x1:x+1.2,z0:z-0.7,z1:z+0.7,h:3.7})}
//#frozen_pond
{const x=-12.5,z=8;put(CYL,x,0.03,z,0,0,0,7.4,0.06,5.6,C.ice,0,1,0,1);for(let i=0;i<11;i++){const a=i/11*TAU+R()*0.2;sph(x+Math.cos(a)*3.9,0.12,z+Math.sin(a)*3.0,1.0+R()*0.5,0.4,0.8+R()*0.4,i%3?C.stone:C.stoneD)}
 for(let i=0;i<5;i++){const a=R()*TAU;sph(x+Math.cos(a)*3.9,0.32,z+Math.sin(a)*3.0,0.8,0.2,0.6,C.snow)}}
//#cedars
for(const[x,z,s]of[[18.5,-22,0.75],[18.5,18,0.7],[-18.5,18,0.75]]){cedarSnow(x,z,s,R);colC.push({x,z,r:0.7,h:6})}
//#forest
for(let i=0;i<40;i++){const a=i/40*TAU+R()*0.08,d=32+R()*22,x=Math.cos(a)*d,z=Math.sin(a)*d-2;if(Math.abs(x)<26&&z>-31&&z<27)continue;if(Math.abs(x)<17&&z<-30&&z>-50)continue;cedarSnow(x,z,0.8+R()*0.6,R)}
//#background
for(const[x,z,w,h]of[[-260,-330,300,190],[120,-420,340,230],[380,-160,280,170],[-400,60,300,160],[200,300,320,150]]){put(CONE,x,h/2-8,z,0,0,0,w,h,w,C.mountR);put(CONE,x,h-8-h*0.21,z,0,0,0,w*0.43,h*0.42,w*0.43,C.mountW)}
for(let k=0;k<7;k++){const a=k/7*TAU+R()*0.5,d=200+R()*160,h=40+R()*50,cx=Math.cos(a)*d,cz=Math.sin(a)*d;for(let i=0;i<3;i++){const w=60+R()*50;sph(cx+(i-1)*44,h+R()*8,cz+R()*20,w,w*0.22,w*0.6,C.white,0,0,F_NOCAST|F_DRIFT)}}
}

// ---------------- Stage 5: 墨の池 — a pale stone platform in a black ink pond; ink-wash greys, only the seal is red ----------------
function buildStage5Code(){const R=mulberry(53),NF=F_UNLIT|F_NOCAST;
//#ink_pond
box(0,-1.2,0,1700,1,1700,C.inkP,7,1);
//#platform
box(0,-0.4,-2,46.6,0.8,50.6,C.paperS,1);for(const s of[-1,1]){box(s*23.7,0.1,-2,0.8,0.5,51.4,C.inkG,5);box(0,0.1,s<0?-27.7:23.7,48.2,0.5,0.8,C.inkG,5)}
//#barrier
const barrier=(x0,z0,x1,z1,n)=>{for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,z=z0+(z1-z0)*i/n;box(x,1.4,z,0.36,2.8,0.36,C.ink);put(PYR,x,2.95,z,0,0,0,0.5,0.3,0.5,C.ink);box(x,1.9,z,0.42,0.8,0.42,C.paper);box(x,2.05,z,0.44,0.18,0.44,C.seal)}
 for(let i=0;i<n;i++)along(x0+(x1-x0)*i/n,z0+(z1-z0)*i/n,x0+(x1-x0)*(i+1)/n,z0+(z1-z0)*(i+1)/n,len=>{put(CYL,0,2.45,0,0,0,PI/2,0.16,len,0.16,C.ropeG,6);for(const s of[-1,1])box(s*len/4,2.05,0,0.26,0.5,0.03,C.white)})};
barrier(-23.7,-27.7,23.7,-27.7,7);barrier(-23.7,23.7,23.7,23.7,7);barrier(-23.7,-27.7,-23.7,23.7,8);barrier(23.7,-27.7,23.7,23.7,8);
//#great_torii
{const z=-40,P=C.seal;for(const s of[-1,1]){put(CYL,s*13,9,z,0,0,-s*0.03,2.2,19.4,2.2,P,0,.5);cyl(s*13,-0.3,z,3.0,1.6,3.0,C.inkG)}
 box(0,14.5,z,29,1.3,1.2,P);box(0,18.4,z,31,1.4,2.0,P);box(0,19.6,z,33,1.1,2.8,C.inkP);for(const s of[-1,1])put(BOX,s*16.5,19.9,z,0,0,s*0.22,3.2,1.0,2.8,C.inkP);box(0,16.5,z,2.0,2.6,0.6,C.inkP)}
//#seal_circle
{const z=-2;put(CYL,0,0.01,z,0,0,0,19,0.02,19,C.seal,0,0,F_NOCAST);put(CYL,0,0.016,z,0,0,0,17.6,0.02,17.6,C.paperS,1,0,F_NOCAST);put(CYL,0,0.022,z,0,0,0,9.4,0.02,9.4,C.seal,0,0,F_NOCAST);put(CYL,0,0.028,z,0,0,0,8.4,0.02,8.4,C.paperS,1,0,F_NOCAST);
 for(let k=0;k<3;k++){const a=k/3*TAU;put(CYL,Math.cos(a)*1.8,0.034,z+Math.sin(a)*1.8,0,0,0,2.6,0.02,2.6,C.seal,0,0,F_NOCAST|F_NOEDGE);
  for(let j=1;j<=3;j++){const b=a+j*0.42,r=1.8+j*0.25,d=2.6-j*0.62;put(CYL,Math.cos(b)*r,0.034,z+Math.sin(b)*r,0,0,0,d,0.02,d,C.seal,0,0,F_NOCAST|F_NOEDGE)}}}
//#stone_lanterns
for(const[x,z]of[[-8.5,-12],[8.5,-12],[-8.5,8],[8.5,8]]){mPush();mT(x,0,z);box(0,0.2,0,1.3,0.4,1.3,C.inkG,5);cyl(0,1.05,0,0.42,1.4,0.42,C.inkM);box(0,1.85,0,1.1,0.22,1.1,C.inkM);box(0,2.3,0,0.78,0.7,0.78,C.inkM);
 box(0,2.3,0,0.82,0.42,0.5,C.seal,0,0,F_UNLIT);box(0,2.3,0,0.5,0.42,0.82,C.seal,0,0,F_UNLIT);put(PYR,0,2.95,0,0,0,0,1.6,0.6,1.6,C.inkG);sph(0,3.32,0,0.28,0.32,0.28,C.inkM);mPop();colC.push({x,z,r:0.85,h:3.4})}
//#standing_stones
for(const[x,z,a]of[[-16,-6,0.3],[16,2,-0.4],[-13,15,0.9]]){put(BOX,x,1.6,z,0,a,0.06,1.4,3.2,1.0,C.inkM);put(BOX,x,3.0,z,0,a,0.06,1.46,0.5,1.06,C.inkG);colC.push({x,z,r:0.9,h:3.3})}
//#spider_lilies
const lily=(x,z,h)=>{cyl(x,h/2,z,0.05,h,0.05,C.ink);for(let i=0;i<5;i++){const a=i/5*TAU;put(CONE,x+Math.cos(a)*0.16,h+0.1,z+Math.sin(a)*0.16,Math.sin(a)*1.1,0,-Math.cos(a)*1.1,0.18,0.6,0.18,C.seal,0,0,F_UNLIT|F_NOCAST)}};
for(const[cx,cz]of[[-20.5,-20],[20.5,-22],[-21,4],[21,10],[-12,20.5],[13,20.5],[20.8,-8]])for(let i=0;i<3;i++)lily(cx+(R()-0.5)*1.4,cz+(R()-0.5)*1.4,0.6+R()*0.3);
//#rocks
for(let i=0;i<14;i++){const a=i/14*TAU+R()*0.3,d=34+R()*50,x=Math.cos(a)*d,z=Math.sin(a)*d-2;if(z<-30&&Math.abs(x)<22)continue;sph(x,-0.7,z,4+R()*6,2+R()*4,3+R()*5,i%2?C.inkG:C.inkM)}
//#dead_trees
for(const[x,z,s]of[[-34,-14,1],[38,-26,1.2],[-42,22,0.9],[30,30,1],[-28,-40,1.1]]){sph(x,-0.7,z,6*s,2.4*s,5*s,C.inkG);put(CYL,x,2.6*s,z,0,0,0.1,0.5*s,5.6*s,0.5*s,C.ink);put(CYL,x+0.9*s,4.6*s,z,0,0,-0.9,0.24*s,2.6*s,0.24*s,C.ink);put(CYL,x-0.8*s,4.0*s,z,0,0,0.8,0.22*s,2.2*s,0.22*s,C.ink);put(CYL,x+0.2*s,5.6*s,z+0.5*s,0.7,0,0,0.16*s,1.8*s,0.16*s,C.ink)}
//#floating_lanterns
for(let i=0;i<14;i++){const a=i/14*TAU+R()*0.3,d=29+R()*16,x=Math.cos(a)*d,z=Math.sin(a)*d-2;box(x,-0.45,z,0.7,0.5,0.7,C.white,0,0,F_UNLIT);put(PYR,x,-0.05,z,0,R(),0,0.9,0.3,0.9,C.ink)}
//#background
for(let i=0;i<10;i++){const a=i/10*TAU+R()*0.3,d=80+R()*110,h=40+R()*70,w=16+R()*18;put(CONE,Math.cos(a)*d,h/2-0.7,Math.sin(a)*d-2,0,0,0,w,h,w,i%2?C.inkM:C.inkL)}
for(const[x,z,w,h]of[[-300,-420,380,170],[260,-460,420,210],[460,40,320,140],[-460,120,340,150]])put(CONE,x,h/2-1,z,0,0,0,w,h,w,C.inkL);
for(let k=0;k<7;k++){const a=k/7*TAU+R()*0.5,d=90+R()*120,h=10+R()*22,cx=Math.cos(a)*d,cz=Math.sin(a)*d;for(let i=0;i<2;i++){const w=50+R()*40;sph(cx+(i-0.5)*40,h+R()*4,cz+R()*14,w,w*0.08,w*0.3,C.paperS,0,0,NF|F_DRIFT)}}
}
