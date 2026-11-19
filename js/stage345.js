'use strict';
// ================= STAGES 3-6 =================
// 3 黄昏の町 / 4 雪の古寺 / 5 荒海の船上 (the ship; its moving sea, oars and wake are drawn every frame in js/sea.js) / 6 墨の池 (STORY.md 1). Play area x ±21.6, z -25.6..21.6 (stage 4: x ±31.6, z -25.6..33.6, STG[].arena); the boss rises at the north end.
// Authored in Blender (blender/stage_*.blend -> assets/*.glb, loaded by js/glb.js). buildStageNCode() is the code-built original:
// fallback when the GLB can't be loaded, ?stageN=code for comparisons, and the reference for tools/check_stage_parity.js.
// "//#name" comments mark prop groups for tools/dump_stage.js (they become Blender collections).
Object.assign(C,{
 deck:hex(0xb98552),deckD:hex(0x6f4329),river:hex(0xf0a060),bank:hex(0xbdb3a2),twall:hex(0xf2dcc0),troof:hex(0x51496a),troofD:hex(0x372f4d),glow:hex(0xffc75a),road:hex(0xd2b98e),
 sun:hex(0xffe08a),cloudP:hex(0xffa88f),cloudV:hex(0xc98bb8),mountP:hex(0x9a6aa0),mountP2:hex(0xc58ea8),hillS:hex(0x9b7f7a),willow:hex(0x86b24c),willowD:hex(0x5f9440),bronze:hex(0xb08a3a),noren:hex(0x2f3f7a),bamboo:hex(0xc9b56a),
 snow:hex(0xf4f7ff),ice:hex(0xbfe9ff),iceP:hex(0x86c9ec),twood:hex(0x6b3f2c),troof4:hex(0x3f4a5e),ochre:hex(0xdcbc7e),bronze4:hex(0x5d6b5c),mountW:hex(0xdfe7f5),mountR:hex(0x8090ae),
 deckS:hex(0xc9a173),hullD:hex(0x3b2a22),hullR:hex(0x8c1d24),hullL:hex(0x56402f),sailS:hex(0xe0d0ad),shieldW:hex(0x7a5235),sail:hex(0xf1e6cc),sea:hex(0x1f7088),iron:hex(0x3a3c48),
 seaRock:hex(0x55606b),seaRockD:hex(0x3a434d),isle:hex(0x4d7d6a),isleD:hex(0x35584c),cloudS:hex(0xdde6e8),cloudG:hex(0xa3b1b8),roofT:hex(0x2f3a4e),
 paperS:hex(0xe9e5da),inkG:hex(0x56545e),inkM:hex(0x8d8c94),inkL:hex(0xb9b8bf),inkP:hex(0x141218),seal:hex(0xd9262c),ropeG:hex(0xbdb8aa)});
function buildStage3(){if(STAGE_GLB[2])emitGlbStage(STAGE_GLB[2]);else buildStage3Code()}
function buildStage4(){if(STAGE_GLB[3])emitGlbStage(STAGE_GLB[3]);else buildStage4Code()}
function buildStage5(){if(STAGE_GLB[4])emitGlbStage(STAGE_GLB[4]);else buildStage5Code()}// 荒海の船上 (the ship)
function buildStage6(){if(STAGE_GLB[5])emitGlbStage(STAGE_GLB[5]);else buildStage6Code()}// 墨の池
// a straight run along (x0,z0)-(x1,z1): f(len) is called in a local frame (x along the run, origin at its centre)
function along(x0,z0,x1,z1,f){const len=Math.hypot(x1-x0,z1-z0);mPush();mT((x0+x1)/2,0,(z0+z1)/2);mRY(Math.atan2(-(z1-z0),x1-x0));f(len);mPop()}

// ---------------- Stage 3: 黄昏の町 — a wide wooden bridge over the river at sunset, row houses on both banks ----------------
function buildStage3Code(){const R=mulberry(31),NF=F_UNLIT|F_NOCAST,G0=-2.2;
//#river
box(0,-5,0,1700,1,1700,C.river,0,1);
for(const s of[-1,1]){box(0,-3.4,s<0?-334:330,1700,2.4,600,C.bank,1);box(0,-3.3,s<0?-33.6:29.6,1700,2.6,0.8,C.stoneD,5)}
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
tower(-16,-40);tower(16,-40);tower(34,52);
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
// river-front rows run without gaps out to the fog (cheaper houses far away), leaving room only for the willows; the back row is always built
for(const[zf,face,x0,xb,wl]of[[-39.5,1,19,22,[31,62]],[35.5,-1,21.5,21.5,[33,70]]])for(const s of[-1,1]){const ry=face>0?0:PI;
 let x=x0;while(x<230){const far=x>=104,w=far?14+R()*8:8+R()*6,v=wl.find(v=>x<v+4.3&&x+w>v-3.8);if(v){x=v+4.3;continue}bldg(s*(x+w/2),zf,ry,w,7,3.4+R()*0.8,far?2:0);x+=w+0.3}
 x=xb;while(x<230){const w=x>=104?14+R()*8:8+R()*6;bldg(s*(x+w/2),zf-face*8.5,ry,w,7,5.2+R()*1.2,2);x+=w+0.3}
 if(face<0)bldg(s*16.8,34.5,PI,8,6,4,0)}
bldg(0,-124,0,14,7,6.2,2);bldg(0,102,PI,14,7,6.2,2);
//#main_road
box(0,0.03,-2,9,0.06,68,C.stoneL,1);for(const s of[-1,1])box(s*4.6,0.07,-2,0.3,0.14,68,C.deckD);
box(0,-2.15,-169,9.4,0.1,270,C.road,1);box(0,-2.15,166,9.4,0.1,272,C.road,1);put(CYL,0,-2.14,-62,0,0,0,15,0.1,15,C.road,1);
//#street_houses
for(const[z0,z1]of[[-44,-55],[-69,-118],[38,96]])for(const s of[-1,1]){let z=z0;const dir=z1>z0?1:-1;while(dir>0?z<z1:z>z1){const w=7+R()*3.5;bldg(s*8.6,z+dir*w/2,s>0?-PI/2:PI/2,w,7,R()<0.75?5.4+R()*1.2:3.8,1);
 bldg(s*17.4,z+dir*w/2,s>0?-PI/2:PI/2,w*0.95,7,4.6+R()*1.4,2);z+=dir*(w+0.4)}}
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
put(CONE,-420,26,-380,0,0,0,360,80,360,C.mountP);put(CONE,300,24,-460,0,0,0,330,72,330,C.mountP2);put(CONE,460,20,120,0,0,0,300,64,300,C.mountP2);put(CONE,-460,22,200,0,0,0,320,70,320,C.mountP);
put(CONE,190,40,-330,0,0,0,170,110,170,C.mountP);for(let i=0;i<4;i++){box(190,93+i*3.4,-330,4-i*0.6,2,4-i*0.6,C.troofD);put(PYR,190,94.6+i*3.4,-330,0,0,0,7-i*0.9,1.4,7-i*0.9,C.troofD)}put(CONE,190,109,-330,0,0,0,0.6,4,0.6,C.troofD);
for(let k=0;k<9;k++){const a=k/9*TAU+R()*0.4,d=260+R()*180,h=70+R()*70,cx=Math.cos(a)*d,cz=Math.sin(a)*d;for(let i=0;i<3;i++){const w=70+R()*60;sph(cx+(i-1)*48+R()*14,h+R()*6,cz+R()*16,w,w*0.12,w*0.34,i%2?C.cloudP:C.cloudV,0,0,NF|F_DRIFT)}}
}

// Main hall doors of stage 4 (観音開き), drawn every frame. templeDoor.target = 1 opens them (for a boss walking out of the hall), 0 closes.
const templeDoor={t:0,target:0};
function drawTempleDoor(dt){if(curStage!==3)return;const d=templeDoor;d.t+=Math.sign(d.target-d.t)*Math.min(Math.abs(d.target-d.t),dt*0.8);const e=d.t*d.t*(3-2*d.t),ang=e*1.75,w=1.6,h=4.25,y=1.56,z=-35.78;
 for(const s of[-1,1]){mPush();mT(s*1.6,0,z);mRY(s*ang);const c=-s*w/2;gId=nid();box(c,y+h/2,0.08,w,h,0.14,C.wood,2);for(const yy of[0.12,h*0.36,h*0.68,h-0.12])box(c,y+yy,0.17,w,0.16,0.05,C.twood);box(-s*0.1,y+h/2,0.17,0.16,h,0.05,C.twood);box(-s*(w-0.08),y+h/2,0.17,0.16,h,0.05,C.twood);
  for(const yy of[0.12,h*0.36,h*0.68,h-0.12])for(let k=0;k<4;k++)sph(c-w/2+0.25+k*(w-0.5)/3,y+yy,0.2,0.09,0.09,0.05,C.bronze4,0,.6);put(CYL,-s*(w-0.32),y+h*0.5,0.23,PI/2,0,0,0.3,0.05,0.3,C.bronze4,0,.6);gId=0;mPop()}}
// ---------------- Stage 4: 雪の古寺 — a wide snowy temple yard (play area x ±31.6, z -25.6..33.6); the belfry stands empty (the monk carries the seal bell) ----------------
function buildStage4Code(){const R=mulberry(41),NF=F_UNLIT|F_NOCAST,WX=33.4,WS=35.4;
const wallSnow=(x0,z0,x1,z1)=>along(x0,z0,x1,z1,len=>{box(0,0.35,0,len,0.7,1.0,C.stoneD,5);box(0,1.6,0,len,1.8,0.6,C.ochre);for(const y of[1.15,1.6,2.05])box(0,y,0,len+0.02,0.07,0.62,C.white);
 put(PRISM,0,2.85,0,0,PI/2,0,1.7,0.7,len+0.3,C.troof4,3);put(PRISM,0,3.02,0,0,PI/2,0,1.2,0.5,len+0.36,C.snow)});
const cedarSnow=(x,z,s,R)=>{const c=R()<.5?C.cedar:C.cedarD;cyl(x,1.5*s,z,0.8*s,3*s,0.8*s,C.trunk,9);for(const[yc,hh,wd]of[[5.5,7,6],[9,6,4.8],[12,5,3.4]]){put(CONE,x,yc*s,z,0,0,0,wd*s,hh*s,wd*s,c,8,0,F_SWAY);const ap=(yc+hh/2)*s,sh=hh*0.42*s;put(CONE,x,ap-sh/2+0.06*s,z,0,0,0,wd*0.47*s,sh,wd*0.47*s,C.snow,0,0,F_SWAY)}};
const IR=mulberry(9173);
const icicles=(x0,x1,y,z,n)=>{for(let i=0;i<n;i++)R();const m=Math.round(n*1.5);for(let i=0;i<m;i++){if(IR()<0.3)continue;const u=IR(),l=0.18+u*u*u*1.4,w=0.07+IR()*0.1+l*0.04,px=x0+(x1-x0)*IR();put(CONE,px,y-l/2,z+(IR()-0.5)*0.12,PI,0,0,w,l,w,C.ice,0,0,F_NOCAST);if(IR()<0.35){const l2=l*(0.3+IR()*0.4);put(CONE,px+(IR()<.5?-1:1)*(0.12+IR()*0.1),y-l2/2,z,PI,0,0,w*0.7,l2,w*0.7,C.ice,0,0,F_NOCAST)}}};
const burn=n=>{for(let i=0;i<n;i++)R()};
// one smooth snow bank (a half-buried flattened cylinder with rounded ends) from (x0,z0) to (x1,z1)
const bank=(x0,z0,x1,z1,w,h,fl)=>along(x0,z0,x1,z1,len=>{put(CYL,0,0,0,0,0,PI/2,h,len,w,C.snow,0,0,fl||0);for(const e of[-1,1])sph(e*len/2,0,0,w,h,w,C.snow,0,0,fl||0)});
const snowRoofPyr=(x,y,z,w,h)=>{put(PYR,x,y,z,0,0,0,w,h,w,C.troof4);put(PYR,x,y+h*0.21,z,0,0,0,w*0.7,h*0.62,w*0.7,C.snow)};
//#ground
box(0,-0.62,0,1700,1,1700,C.snow);box(0,0.02,2.45,5,0.1,65.1,C.stoneL,1);put(CYL,0,0,-4,0,0,0,15,0.06,15,C.stone,1);
burn(48);for(const sx of[-1,1]){bank(sx*2.95,-29.4,sx*2.95,-12.6,1.0,0.5,F_NOCAST);bank(sx*2.95,4.6,sx*2.95,34.4,1.0,0.5,F_NOCAST)}
for(let i=0;i<14;i++){const a=i/14*TAU,r=7.6;box(Math.cos(a)*r,0.05,-4+Math.sin(a)*r,0.9,0.1,0.5,C.stoneD)}
//#walls
wallSnow(-WX,-53,-3.0,-53);wallSnow(3.0,-53,WX,-53);wallSnow(-WX,WS,-5,WS);wallSnow(5,WS,WX,WS);wallSnow(-WX,-53,-WX,WS);wallSnow(WX,-53,WX,WS);
for(const[x,z]of[[-WX,-53],[WX,-53],[-WX,WS],[WX,WS]]){box(x,1.9,z,1.1,3.8,1.1,C.twood,2);snowRoofPyr(x,4.1,z,1.7,0.7)}
//#snow_drifts
burn(48);const DX=WX-0.9,DS=WS-0.9;
bank(DX,-36.6,DX,-3,2.4,1.6);bank(DX,18,DX,33.6,2.4,1.6);bank(-DX,-36.6,-DX,15,2.4,1.6);bank(-DX,25.4,-DX,33.6,2.4,1.6);
bank(-31.4,-52.1,-19,-52.1,2.4,1.6);bank(19,-52.1,31.4,-52.1,2.4,1.6);bank(-31.4,DS,-7.4,DS,2.4,1.6);bank(7.4,DS,31.4,DS,2.4,1.6);
//#sanmon
{const z=WS;for(const x of[-5,-2.4,2.4,5])cyl(x,2.7,z,0.7,5.4,0.7,C.twood);for(const s of[-1,1])box(s*1.2,2.4,z+0.1,2.3,4.8,0.25,C.wood,2);box(0,5.08,z+0.1,4.8,0.56,0.25,C.twood);
 for(const s of[-1,1]){const cx=s*3.7;box(cx,1.0,z,2.62,2.0,0.5,C.twood,2);box(cx,3.7,z,2.62,3.4,0.42,C.ochre);box(cx,3.5,z-0.24,1.7,1.9,0.06,C.ink);for(let i=0;i<5;i++)box(cx-0.68+i*0.34,3.5,z-0.3,0.08,1.9,0.08,C.twood);box(cx,3.5,z-0.3,1.8,0.1,0.1,C.twood)}
 box(0,5.6,z,11.4,0.5,3.4,C.twood);put(PRISM,0,6.4,z,0,PI/2,0,5.6,1.4,13.4,C.troof4,3);put(PRISM,0,6.62,z,0,PI/2,0,4.0,0.95,13.6,C.snow);
 box(0,8.2,z,9.2,2.4,3.2,C.redD);box(0,8.2,z-1.62,9.4,0.6,0.08,C.white);box(0,7.25,z,10.4,0.2,4.2,C.twood);for(let i=0;i<9;i++)box(-4.6+i*1.15,7.65,z-2.05,0.1,0.6,0.1,C.twood);box(0,7.95,z-2.05,10.4,0.1,0.1,C.twood);
 put(PRISM,0,10.6,z,0,PI/2,0,6.4,2.2,12.4,C.troof4,3);put(PRISM,0,10.95,z,0,PI/2,0,4.6,1.5,12.6,C.snow);box(0,11.8,z,10.8,0.36,0.5,C.troof4);
 icicles(-6.4,6.4,5.75,z-2.75,9);icicles(-5.8,5.8,9.5,z-3.15,8)}
//#main_hall
// 入母屋 roof: hipped lower roof (base y = eave height) with a gable on top, snow on both
const irimoya=(x,y,z,W,D,h,gw,gd,gh)=>{put(PYR,x,y+h/2,z,0,0,0,W,h,D,C.troof4,3);put(PYR,x,y+h*0.71,z,0,0,0,W*0.7,h*0.62,D*0.7,C.snow);const gy=y+h/2;
 put(PRISM,x,gy+gh/2,z,0,PI/2,0,gd,gh,gw,C.troof4,3);put(PRISM,x,gy+gh*0.6,z,0,PI/2,0,gd*0.72,gh*0.7,gw+0.2,C.snow);
 for(const s of[-1,1]){put(PRISM,x+s*(gw/2+0.03),gy+gh*0.42,z,0,PI/2,0,gd*0.76,gh*0.7,0.1,C.paper);box(x+s*(gw/2+0.1),gy+0.15,z,0.1,0.25,gd*0.8,C.twood);box(x+s*(gw/2+0.6),gy+gh+0.25,z,0.7,1.3,1.1,C.troof4)}
 box(x,gy+gh+0.1,z,gw+0.6,0.55,0.8,C.troof4)};
// a hall body: plaster walls, wainscot, pillars, beams and bracket blocks under the eaves (front at +z)
const hallBody=(x,y0,z,W,D,H,doors,gate)=>{const zf=z+D/2,n=Math.round(W/4);box(x,y0+H/2,z,W-0.2,H,D-0.2,C.paper);box(x,y0+1.0,z,W,2.0,D,C.twood,2);
 for(let i=0;i<=n;i++){const px=x-W/2+i*W/n;cyl(px,y0+H/2,zf,0.62,H,0.62,C.twood);cyl(px,y0+H/2,z-D/2,0.62,H,0.62,C.twood);box(px,y0+H+0.15,zf+0.3,1.1,0.45,1.1,C.twood);box(px,y0+H+0.55,zf+0.55,1.7,0.4,1.5,C.twood)}
 for(const s of[-1,1])for(let j=1;j<Math.round(D/4.5);j++){const pz=z-D/2+j*D/Math.round(D/4.5);cyl(x+s*W/2,y0+H/2,pz,0.62,H,0.62,C.twood);box(x+s*(W/2+0.3),y0+H+0.15,pz,1.1,0.45,1.1,C.twood)}
 box(x,y0+H-0.15,zf+0.05,W+0.4,0.35,0.3,C.twood);box(x,y0+H-1.7,zf+0.05,W+0.2,0.3,0.25,C.twood);
 if(doors)for(let i=0;i<n;i++){if(gate&&i===(n-1)/2)continue;const cx=x-W/2+(i+0.5)*W/n,dw=W/n-0.7,dh=H-2.0-1.0;box(cx,y0+1.0+dh/2,zf+0.06,dw,dh,0.12,C.wood);
  for(let k=1;k<5;k++)box(cx-dw/2+k*dw/5,y0+1.0+dh/2,zf+0.14,0.07,dh,0.06,C.twood);for(let k=1;k<4;k++)box(cx,y0+1.0+k*dh/4,zf+0.14,dw,0.07,0.06,C.twood)}};
{burn(16);const Z=-43,ZF=-36;
 // stone platform, apron and the steps (highest step against the platform, going down toward the yard)
 box(0,0.6,-42,36,1.2,20,C.stoneD,1);box(0,1.24,-42,36.3,0.08,20.3,C.stone);
 for(let k=0;k<4;k++){const top=1.2-0.3*k,d=0.6*(k+1);box(0,top/2,-32+d/2,9,top,d,C.stone,1);box(0,top-0.02,-32+d-0.12,9.02,0.05,0.24,C.snow,0,0,F_NOCAST)}
 for(const s of[-1,1]){put(BOX,s*4.75,0.85,-30.85,0.47,0,0,0.5,0.45,2.9,C.stoneD,1);box(s*4.75,0.68,-32.2,0.5,1.36,0.5,C.stoneD,1);sph(s*4.75,1.42,-32.2,0.5,0.14,0.5,C.snow)}
 for(const s of[-1,1])bank(s*11.2,-31.5,s*17.4,-31.5,1.0,0.6,F_NOCAST);
 // main hall
 hallBody(0,1.2,Z,26,14,6.6,true,true);
 // the main doors (the leaves themselves are drawn every frame by drawTempleDoor so they can open): dark inside, threshold, lintel and posts
 box(0,3.6,-35.93,3.3,4.3,0.06,C.inkD,0,0,F_UNLIT);box(0,1.5,-35.8,3.7,0.12,0.4,C.twood);box(0,5.85,-35.8,3.9,0.3,0.36,C.twood);for(const s of[-1,1])box(s*1.72,3.65,-35.8,0.22,4.3,0.32,C.twood);
 box(0,1.37,-35.0,28.4,0.16,2.0,C.twood,2);for(let i=0;i<=14;i++){const px=-14+i*2;if(Math.abs(px)<4.6)continue;cyl(px,1.85,-34.1,0.16,0.9,0.16,C.twood)}for(const s of[-1,1])box(s*9.3,2.3,-34.1,9.4,0.12,0.14,C.twood);
 box(0,6.95,-35.84,3.4,1.1,0.12,C.ink);box(0,6.95,-35.76,2.9,0.75,0.04,C.gold);
 irimoya(0,7.0,Z,32,20,7,18,11,4.6);
 // 向拝: the porch roof over the steps, on two pillars, with gong, rope and lanterns
 for(const s of[-1,1]){cyl(s*4.6,3.0,-29.0,0.5,6.0,0.5,C.twood);box(s*4.6,0.15,-29.0,0.9,0.3,0.9,C.stone);box(s*4.6,5.9,-29.0,1.0,0.4,1.0,C.twood)}box(0,5.55,-29.0,10,0.4,0.4,C.twood);box(0,6.0,-29.0,10.4,0.35,0.6,C.twood);
 put(BOX,0,6.7,-31.4,0.22,0,0,11.4,0.35,6.2,C.troof4,3);put(BOX,0,6.93,-31.6,0.22,0,0,10.0,0.22,5.4,C.snow);box(0,6.05,-28.3,11.6,0.3,0.35,C.troof4);
 icicles(-16.4,-6,6.95,-33.05,9);icicles(6,16.4,6.95,-33.05,9);icicles(-5.6,5.6,5.85,-28.15,6);
 colB.push({x0:-18,x1:18,z0:-52,z1:-32,h:1.3},{x0:-4.6,x1:4.6,z0:-32,z1:-29.6,h:1.2},{x0:-13,x1:13,z0:-50,z1:-35,h:15},{x0:-31,x1:-21,z0:-46,z1:-38,h:8},{x0:21,x1:31,z0:-46,z1:-38,h:8});
 for(const s of[-1,1])colC.push({x:s*4.6,z:-29.0,r:0.4,h:6.2});
 for(const x of[-9,9]){toro(x,-29.6);put(PYR,x,3.14,-29.6,0,0,0,1.25,0.32,1.25,C.snow);sph(x,0.05,-29.6,1.75,0.5,1.75,C.snow,0,0,F_NOCAST)}
 // the temple goes on behind: a climbing covered corridor, a first terrace with a lecture hall, a second terrace with a two-storey inner hall
 put(BOX,0,2.75,-56,0.23,0,0,4.4,0.3,12.4,C.twood,2);put(PRISM,0,7.1,-56,0.23,0,0,6.2,1.5,12.8,C.troof4,3);put(PRISM,0,7.32,-56,0.23,0,0,4.4,1.0,12.9,C.snow);
 for(let i=0;i<5;i++){const pz=-50.5-i*2.75,fy=1.2+(i*2.75)*0.234;for(const s of[-1,1])cyl(s*2.2,fy+2.45,pz,0.32,4.9,0.32,C.twood);box(0,fy+0.9,pz,4.4,0.1,0.1,C.twood)}
 box(0,2.0,-74,46,4.0,26,C.stoneD,1);box(0,4.04,-74,46.3,0.08,26.3,C.snow);for(let i=0;i<5;i++)box(0,0.4+i*0.8,-60.6-i*0.3,6,0.8,0.6,C.stone,1);
 hallBody(0,4,-74,26,14,5.6,true);irimoya(0,8.9,-74,31,19,4.8,16,10,3.3);
 for(const s of[-1,1]){box(s*18,4.3,-74,4,0.4,20,C.twood,2);for(let j=0;j<6;j++)cyl(s*19.6,6.2,-65-j*3.6,0.3,4.0,0.3,C.twood);put(PRISM,s*18,8.6,-74,0,0,0,5.6,1.4,21,C.troof4,3);put(PRISM,s*18,8.82,-74,0,0,0,4.0,0.9,21.2,C.snow)}
 box(0,4.5,-110,52,9,30,C.stoneD,1);box(0,9.04,-110,52.3,0.08,30.3,C.snow);for(let i=0;i<7;i++)box(0,4.6+i*0.7,-93.8-i*0.4,7,0.7,0.8,C.stone,1);
 hallBody(0,9,-110,30,18,6.2,true);irimoya(0,14.2,-110,36,24,5.6,19,12,3.8);hallBody(0,19.4,-110,14,9,3.6,false);irimoya(0,22.4,-110,20,14,3.4,11,7,2.6);
 {const Q=mulberry(5151);for(const[x,z,sc]of[[-27,-60,0.9],[27,-66,1.0],[-28.5,-80,1.1],[28.5,-86,1.0],[-31.5,-104,1.3],[31.5,-110,1.2],[-19,-131,1.4],[19,-130,1.3],[0,-136,1.5]])cedarSnow(x,z,sc,Q)}}
for(const s of[-1,1]){box(s*26,0.3,-42,11.2,0.6,9.2,C.stoneD,1);hallBody(s*26,0.6,-42,10,8,4.4,true);irimoya(s*26,4.9,-42,13.4,11.4,3.6,7.4,5.8,2.4);icicles(s*26-6.2,s*26+6.2,4.85,-36.35,6)}
//#belfry
{const x=-23,z=-14;box(x,0.7,z,6.8,1.4,6.8,C.stoneD,5);sph(x,1.45,z,6.2,0.3,6.2,C.snow);
 for(const[dx,dz]of[[-1,-1],[1,-1],[-1,1],[1,1]])put(BOX,x+dx*2.3,4.6,z+dz*2.3,-dz*0.04,0,dx*0.04,0.48,6.4,0.48,C.twood,2);
 for(const s of[-1,1]){box(x,7.4,z+s*2.25,5.0,0.36,0.36,C.twood);box(x+s*2.25,7.4,z,0.36,0.36,5.0,C.twood)}
 snowRoofPyr(x,9.2,z,8.8,3.0);put(CONE,x,10.9,z,0,0,0,0.5,0.8,0.5,C.bronze4,0,.6);
 box(x,7.15,z,4.8,0.3,0.36,C.twood);cyl(x,6.7,z,0.1,0.6,0.1,C.black);box(x,7.15,z+1.6,0.3,0.3,3.2,C.twood);put(CYL,x,4.2,z+1.9,PI/2,0,0,0.44,3.0,0.44,C.wood);for(const dz of[1.0,2.8])cyl(x,5.65,z+dz,0.06,2.9,0.06,C.rope);
 box(x,1.0,z+3.6,2.4,0.4,0.8,C.stone);box(x,0.4,z+4.2,2.4,0.4,0.8,C.stone);
 icicles(x-4.2,x+4.2,7.8,z+4.45,8);colB.push({x0:x-3.4,x1:x+3.4,z0:z-3.4,z1:z+3.4,h:8})}
//#pagoda
{const x=23,z=-15;box(x,0.5,z,7.4,1,7.4,C.stoneD,1);sph(x,1.05,z,7,0.24,7,C.snow);box(x,1.6,z,5.0,1.2,5.0,C.stone,1);box(x,2.3,z,4.4,0.2,4.4,C.stoneD,1);
 for(let i=0;i<3;i++){const b=3.8-0.6*i,y0=2.4+i*3.2,w=b+2.6;box(x,y0+1.1,z,b,2.2,b,C.stone,1);box(x,y0+1.3,z-b/2-0.01,b*0.5,0.9,0.04,C.stoneD);
  box(x,y0+2.42,z,w,0.44,w,C.stoneD,1);put(PYR,x,y0+3.24,z,0,0,0,w,1.2,w,C.stone,1);put(PYR,x,y0+3.5,z,0,0,0,w*0.72,0.78,w*0.72,C.snow);
  for(const[dx,dz]of[[-1,-1],[1,-1],[-1,1],[1,1]])put(CONE,x+dx*w*0.47,y0+2.78,z+dz*w*0.47,0,0,0,0.34,0.36,0.34,C.stoneD)}
 box(x,12.5,z,1.2,0.5,1.2,C.stone,1);cyl(x,14.0,z,0.24,3.0,0.24,C.stone);for(let i=0;i<5;i++)cyl(x,13.2+i*0.5,z,0.62-i*0.06,0.14,0.62-i*0.06,C.stoneD);sph(x,15.7,z,0.46,0.6,0.46,C.stone);
 colB.push({x0:x-2.6,x1:x+2.6,z0:z-2.6,z1:z+2.6,h:12})}
//#jizo
for(let i=0;i<6;i++){const x=31.2,z=1+i*2.6;box(x,0.2,z,1.0,0.4,1.0,C.stoneD,5);sph(x,1.0,z,0.72,1.25,0.62,C.stone);sph(x,1.9,z,0.52,0.54,0.52,C.stone);put(CONE,x-0.1,1.42,z,0,0,0,0.82,0.55,0.72,C.red);sph(x,2.14,z,0.42,0.16,0.42,C.snow);sph(x+0.05,0.42,z,1.1,0.3,1.1,C.snow)}
box(31.6,2.6,7.5,1.6,0.16,16.6,C.troof4);for(const z of[-0.6,15.6])box(31.6,1.3,z,0.16,2.6,0.16,C.twood);box(31.6,2.75,7.5,1.3,0.1,16.4,C.snow);
colB.push({x0:30.5,x1:32.4,z0:-0.8,z1:15.8,h:2.8});
//#lanterns
for(const[x,z]of[[-6,28],[6,28],[-6,12],[6,12],[-6,-14],[6,-14]]){toro(x,z);put(PYR,x,3.14,z,0,0,0,1.25,0.32,1.25,C.snow);sph(x,0.05,z,1.75,0.5,1.75,C.snow,0,0,F_NOCAST)}
//#incense_burner
{const x=0,z=-4;box(x,0.25,z,2.4,0.5,2.4,C.stoneD,5);for(let i=0;i<3;i++){const a=i/3*TAU;put(CYL,x+Math.cos(a)*0.7,0.85,z+Math.sin(a)*0.7,0,0,0,0.22,0.8,0.22,C.bronze4)}
 put(CYL,x,1.5,z,0,0,0,2.0,0.7,2.0,C.bronze4,0,.6);cyl(x,1.87,z,1.7,0.06,1.7,C.stoneL);cyl(x,1.9,z,1.0,0.04,1.0,C.orange,0,0,NF);for(let i=0;i<3;i++){const a=i/3*TAU+0.4,fx=x+Math.cos(a)*0.32,fz=z+Math.sin(a)*0.32;put(CONE,fx,2.12,fz,0,a,0,0.32,0.46,0.32,C.orange,0,0,NF|F_FLAME);put(CONE,fx,2.06,fz,0,a+1,0,0.18,0.3,0.18,C.yellow,0,0,NF|F_FLAME)}
 for(let k=0;k<5;k++){const a=k/5*TAU,bx=x+Math.cos(a)*0.66,bz=z+Math.sin(a)*0.66;for(let j=0;j<3;j++){const ox=bx+(j-1)*0.07,tl=0.06*(j-1);put(CYL,ox,2.2,bz,0,0,tl,0.035,0.62,0.035,C.willow,0,0,F_NOCAST|F_NOEDGE);sph(ox-Math.sin(tl)*0.31,2.52,bz,0.07,0.07,0.07,C.orange,0,0,NF|F_NOEDGE)}}for(const[dx,dz]of[[-0.6,-0.6],[0.6,-0.6],[-0.6,0.6],[0.6,0.6]])cyl(x+dx,2.5,z+dz,0.12,1.2,0.12,C.bronze4);
 put(PYR,x,3.45,z,0,0,0,2.4,0.8,2.4,C.bronze4,0,.6);put(PYR,x,3.62,z,0,0,0,1.6,0.46,1.6,C.snow);
 colC.push({x,z,r:1.4,h:4})}
//#seal_stone
{const x=-11,z=-19;box(x,0.3,z,2.4,0.6,1.4,C.stoneD,5);box(x,2.1,z,1.5,3.0,0.5,C.stone);box(x,3.64,z,1.6,0.1,0.6,C.snow);put(CYL,x,2.4,z+0.26,PI/2,0,0,0.9,0.02,0.9,C.ink);
 for(let k=0;k<3;k++){const a=k/3*TAU+0.5;sph(x+Math.cos(a)*0.2,2.4+Math.sin(a)*0.2,z+0.28,0.2,0.2,0.04,C.paper)}cyl(x,2.9,z,1.62,0.14,0.62,C.rope);box(x,2.55,z+0.33,0.24,0.5,0.03,C.white);colB.push({x0:x-1.2,x1:x+1.2,z0:z-0.7,z1:z+0.7,h:3.7})}
//#temizuya
{const x=-23,z=10;for(const[dx,dz]of[[-1.6,-1.2],[1.6,-1.2],[-1.6,1.2],[1.6,1.2]])box(x+dx,1.5,z+dz,0.28,3.0,0.28,C.twood,2);put(PRISM,x,3.5,z,0,0,0,3.4,1.1,4.6,C.troof4,3);put(PRISM,x,3.72,z,0,0,0,2.4,0.75,4.7,C.snow);
 box(x,0.45,z,2.2,0.9,1.4,C.stoneD,5);box(x,0.92,z,1.9,0.06,1.1,C.iceP,0,1,0,1);for(let i=0;i<3;i++)put(CYL,x-0.6+i*0.6,1.0,z+0.5,0.5,0,0,0.12,0.9,0.12,C.straw);
 icicles(x-1.9,x+1.9,2.95,z+2.3,5);icicles(x-1.9,x+1.9,2.95,z-2.3,5);colB.push({x0:x-1.9,x1:x+1.9,z0:z-1.4,z1:z+1.4,h:3.5})}
//#frozen_pond
{const x=19,z=15;put(CYL,x,0.03,z,0,0,0,12,0.06,8,C.iceP);for(let i=0;i<5;i++)put(BOX,x+(R()-0.5)*7,0.07,z+(R()-0.5)*4,0,R()*PI,0,2+R()*2,0.02,0.05,C.white,0,0,F_NOCAST);for(let i=0;i<14;i++){const a=i/14*TAU+R()*0.2;sph(x+Math.cos(a)*6.2,0.12,z+Math.sin(a)*4.2,1.2+R()*0.6,0.45,0.9+R()*0.4,i%3?C.stone:C.stoneD)}
 {const Q=mulberry(4242);for(let i=0;i<30;i++){const a=i/30*TAU+Q()*0.15,ca=Math.cos(a),sa=Math.sin(a);if(Math.abs(ca)<0.3)continue;const k=1.0+Q()*0.12,sz=0.7+Q()*0.9,H=0.35+sz*0.35,rx=x+ca*6.3*k,rz=z+sa*4.3*k;sph(rx,0.1,rz,sz*1.2,H,sz,Q()<.35?C.stoneD:C.stone);if(Q()<.4)sph(rx,0.06+H/2,rz,sz*0.78,0.2,sz*0.62,C.snow);colC.push({x:rx,z:rz,r:sz*0.5,h:0.1+H/2})}
  for(const[a,h,r]of[[0.5,2.0,0.9],[2.5,1.6,0.8],[3.6,2.4,1.0],[5.6,1.4,0.7]]){const px=x+Math.cos(a)*7.4,pz=z+Math.sin(a)*5.2;sph(px,h*0.42,pz,r*1.3,h,r,C.stoneD);sph(px,h*0.88,pz,r*0.9,0.3,r*0.75,C.snow);colC.push({x:px,z:pz,r:r*0.6,h})}
  for(const[dx,dz,r]of[[-3.6,-1.2,0.6],[3.2,1.4,0.5],[-2.2,2.2,0.4],[4.4,-1.8,0.45]])sph(x+dx,0.06,z+dz,r*1.3,0.3,r,C.stone)}
 burn(6);for(const[dx,r]of[[0,4.5],[-2.4,3.9],[2.4,3.9],[-4.3,2.3],[4.3,2.3]])colC.push({x:x+dx,z,r,h:0.12})}
//#yukitsuri_pines
for(const[x,z]of[[-15,25],[15,26]]){put(CYL,x,1.4,z,0,0,0.1,0.6,2.8,0.6,C.trunk,9);for(const[dy,w]of[[2.8,5.6],[3.9,4.2],[4.9,2.8]]){sph(x,dy,z,w,1.1,w,C.cedarD,8,0,F_SWAY);sph(x,dy+0.42,z,w*0.82,0.42,w*0.82,C.snow,0,0,F_SWAY)}
 cyl(x,4.4,z,0.1,6.6,0.1,C.wood);for(let i=0;i<10;i++){const a=i/10*TAU,ex=x+Math.cos(a)*2.9,ez=z+Math.sin(a)*2.9,top=7.6,bot=2.6,dx=ex-x,dz=ez-z,hl=2.9,l=Math.hypot(hl,top-bot);
  mPush();mT((x+ex)/2,(top+bot)/2,(z+ez)/2);mRY(Math.atan2(-dz,dx));mRZ(Math.atan2(bot-top,hl));put(CYL,0,0,0,0,0,PI/2,0.04,l,0.04,C.rope);mPop()}colC.push({x,z,r:1.0,h:6})}
//#snowman
{const x=-9,z=30;sph(x,0.75,z,1.6,1.5,1.6,C.snow);sph(x,1.85,z,1.1,1.05,1.1,C.snow);put(CYL,x,2.5,z,0.15,0,0,0.9,0.5,0.9,C.red);for(const s of[-1,1])sph(x+s*0.2,1.95,z+0.5,0.12,0.12,0.08,C.ink);put(CONE,x,1.82,z+0.6,PI/2,0,0,0.16,0.4,0.16,C.orange);colC.push({x,z,r:0.9,h:2.7})}
//#firewood
{const x=-31,z=22;for(let r=0;r<3;r++)for(let i=0;i<5-r;i++)put(CYL,x,0.3+r*0.52,z-1.8+r*0.3+i*0.6*1.02+r*0.0,0,0,PI/2,0.56,1.8,0.56,C.wood,9);box(x,1.75,z-0.6,1.9,0.16,2.4,C.snow);
 put(PRISM,x,2.5,z-0.6,0,0,0,2.4,0.6,4.0,C.troof4,3);for(const dz of[-2.4,1.2])box(x+0.9,1.2,z+dz,0.12,2.4,0.12,C.twood);colB.push({x0:x-1.2,x1:x+1.2,z0:z-2.6,z1:z+1.4,h:2.6})}
//#bamboo
for(const[cx,cz]of[[-29.5,-23],[29.5,-23],[29.5,30],[-28.5,30]]){for(let i=0;i<7;i++){const x=cx+(R()-0.5)*2.4,z=cz+(R()-0.5)*2.4,h=5+R()*3;put(CYL,x,h/2,z,(R()-0.5)*0.1,0,(R()-0.5)*0.1,0.16,h,0.16,C.willow,9,0,F_SWAY);put(CONE,x,h-0.4,z,PI,0,0,1.1,1.6,1.1,C.leafD,8,0,F_SWAY);sph(x,h+0.3,z,0.7,0.24,0.7,C.snow,0,0,F_SWAY)}colC.push({x:cx,z:cz,r:1.6,h:6})}
//#garden_rocks
for(const[x,z]of[[-17,-22],[-28,-6],[16,-23],[28,-6],[-27,4],[26,26]]){const w=1.6+R()*1.2;sph(x,0.4,z,w,1.3,w*0.8,C.stoneD);sph(x,0.95,z,w*0.8,0.35,w*0.6,C.snow);colC.push({x,z,r:w*0.45,h:1.2})}
//#cedars
for(const[x,z,s]of[[-23.5,30.5,0.7],[-28.5,-1,0.6],[-27.5,16,0.6],[29,22,0.6]]){cedarSnow(x,z,s,R);colC.push({x,z,r:0.7,h:6})}
//#outer_buildings
for(const[x,z,ry,w]of[[-50,-8,PI/2,18],[50,6,-PI/2,16]]){mPush();mT(x,0,z);mRY(ry);box(0,0.5,0,w+2,1,9,C.stoneD,5);box(0,3.0,0,w,4.2,8,C.paper);box(0,1.6,0,w+0.04,2.2,8.04,C.twood,2);box(0,3.6,4.02,w*0.6,1.0,0.08,C.glow,0,0,F_UNLIT);
 put(PRISM,0,6.6,0,0,PI/2,0,10.4,2.8,w+1.4,C.troof4,3);put(PRISM,0,7.2,0,0,PI/2,0,7.4,1.9,w+1.6,C.snow);mPop()}
//#forest
for(let i=0;i<46;i++){const a=i/46*TAU+R()*0.08,d=42+R()*24,x=Math.cos(a)*d,z=Math.sin(a)*d+2;if(Math.abs(x)<40&&z>-34&&z<42)continue;if(Math.abs(x)<36&&z<-28&&z>-56)continue;if(Math.abs(Math.abs(x)-50)<14&&Math.abs(z)<18)continue;const sc=0.8+R()*0.6;if(Math.abs(x)<40&&z<-50&&z>-142||Math.abs(Math.abs(x)-50)<14&&Math.abs(z)<26){R();continue}cedarSnow(x,z,sc,R)}
//#background
for(const[x,z,w,h]of[[-260,-330,300,190],[120,-420,340,230],[380,-160,280,170],[-400,60,300,160],[200,300,320,150]]){put(CONE,x,h/2-8,z,0,0,0,w,h,w,C.mountR);put(CONE,x,h-8-h*0.21,z,0,0,0,w*0.43,h*0.42,w*0.43,C.mountW)}
for(let k=0;k<7;k++){const a=k/7*TAU+R()*0.5,d=200+R()*160,h=40+R()*50,cx=Math.cos(a)*d,cz=Math.sin(a)*d;for(let i=0;i<3;i++){const w=60+R()*50;sph(cx+(i-1)*44,h+R()*8,cz+R()*20,w,w*0.22,w*0.6,C.white,0,0,F_NOCAST|F_DRIFT)}}
}

// ---------------- Stage 6: 墨の池 — a pale stone platform in a black ink pond; ink-wash greys, only the seal is red ----------------
function buildStage6Code(){const R=mulberry(53),NF=F_UNLIT|F_NOCAST;
//#ink_pond
box(0,-1.2,0,1700,1,1700,C.inkP,0,1);
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

// ---------------- Stage 5: 荒海の船上 — the deck of a great warship (安宅船) sailing north over a rough sea ----------------
// Deck at y 0, sea at y -4.6. Play area x ±17, z -31..25 (STG[4].arena; the bow beyond z -25.6 closes while the kraken is up).
// The bow points north (-z): the ship sails that way, so the sea pattern (mat 15), wake, oars and passing rocks stream south (js/sea.js).
function buildStage5Code(){const R=mulberry(67),NF=F_UNLIT|F_NOCAST,SY=-4.6;
const rope=(x0,y0,z0,x1,y1,z1,r,c)=>{const dx=x1-x0,dy=y1-y0,dz=z1-z0,L=Math.hypot(dx,dy,dz);mPush();mT((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);mRY(Math.atan2(dx,dz));mRX(-Math.asin(clamp(dy/L,-1,1)));mRX(PI/2);mS(r,L,r);emit(CYL,c||C.rope,6,0,0,0);mPop()};
//#sea
box(0,SY-0.1,0,1800,0.2,1800,C.sea,15,0,F_NOCAST|F_NOEDGE);
//#hull
box(0,-0.6,1.5,36,1.2,67,C.deckS,2,.1);
for(const s of[-1,1]){box(s*18.1,-4.9,1.6,1.2,2.6,67.8,C.inkD);
 for(let k=0;k<4;k++){const y=-3.15+k*0.86,x=s*(18.45+k*0.09);box(x,y,1.6,1.25,0.9,68.2,k%2?C.hullL:C.hullD);box(x+s*0.64,y-0.43,1.6,0.06,0.07,68.3,C.inkD)}
 box(s*19.42,-0.12,1.6,0.32,0.4,68.5,C.hullR);box(s*19.2,-3.55,1.6,0.3,0.3,68.4,C.inkD);
 for(const z of[-30,-24.8,-19.2,-13.6,-8,-2.4,3.2,8.8,14.4,20,25.6,31,34.6]){box(s*19.42,-1.75,z,0.09,3.1,0.3,C.iron);for(const y of[-0.6,-1.75,-2.9])sph(s*19.47,y,z,0.16,0.16,0.16,C.gold,0,.8)}
 for(let i=0;i<8;i++){const z=-22+i*5.6;put(CYL,s*19.28,-2.25,z,0,0,PI/2,1.0,0.08,1.0,C.gold,0,.8);box(s*19.33,-2.25,z,0.1,0.62,0.62,C.inkD)}
 put(CYL,s*19.46,-1.9,29,0,0,PI/2,2.9,0.08,2.9,C.inkD);put(CYL,s*19.5,-1.9,29,0,0,PI/2,2.6,0.08,2.6,C.white);for(const y of[-1.45,-2.35])box(s*19.56,y,29,0.05,0.42,2.0,C.inkD)}
{const a=-0.42,uy=Math.cos(a),uz=Math.sin(a);for(let k=0;k<4;k++){const t=-2.4+k*1.6;put(BOX,0,-2.7+uy*t,-33.0+uz*t,a,0,0,37.6+k*0.06,1.6,1.4+k*0.08,k%2?C.hullL:C.hullD);if(k)put(BOX,0,-2.7+uy*(t-0.8),-33.0+uz*(t-0.8),a,0,0,37.8,0.07,1.56,C.inkD)}}
put(BOX,0,-1.25,-33.6,-0.42,0,0,37.8,0.45,0.32,C.hullR);put(BOX,0,-3.6,-32.2,-0.42,0,0,37.8,0.4,0.32,C.hullR);
for(let k=0;k<4;k++){const y=-3.15+k*0.86;box(0,y,35.9+k*0.06,37.6,0.9,1.4,k%2?C.hullL:C.hullD);box(0,y-0.43,36.62+k*0.06,37.8,0.07,0.06,C.inkD)}box(0,-4.9,35.7,36.4,2.6,1.2,C.inkD);box(0,-0.12,36.8,38.4,0.4,0.32,C.hullR);
for(const x of[-12,-6,0,6,12]){box(x,-1.75,36.82,0.3,3.1,0.09,C.iron);for(const y of[-0.6,-1.75,-2.9])sph(x,y,36.87,0.16,0.16,0.16,C.gold,0,.8)}
//#bow
put(BOX,0,-0.9,-35.6,-0.8,0,0,1.7,9.2,1.7,C.hullD);put(BOX,0,2.6,-38.2,-0.8,0,0,1.9,1.2,1.9,C.gold,0,.8);for(const s of[-1,1])put(BOX,s*0.95,-1.4,-35.1,-0.8,0,0,0.12,7.4,0.9,C.hullR);
for(let i=0;i<4;i++)put(BOX,0,-3.4+i*1.6,-34.1-i*1.15,-0.8,0,0,1.86,0.18,1.86,C.iron);
for(const s of[-1,1]){mPush();mT(s*9.5,-1.6,-33.9);cyl(0,0,0,0.22,3.2,0.22,C.iron);put(CYL,0,1.65,0,0,0,PI/2,0.5,0.14,0.5,C.iron);put(CONE,s*0.7,-1.45,0,0,0,s*2.2,0.36,1.3,0.36,C.iron);put(CONE,-s*0.7,-1.45,0,0,0,-s*2.2,0.36,1.3,0.36,C.iron);put(CYL,0,-1.55,0,0,0,PI/2,0.26,1.6,0.26,C.iron);mPop();
 for(let i=0;i<5;i++)sph(s*9.5,1.9-i*0.42+0.2,-33.75+i*0.12,0.24,0.32,0.14,C.iron)}
{const yt=z=>0.15+2.6*Math.pow(Math.max(0,(-23-z)/11.4),2);for(const s of[-1,1]){for(let j=0;j<6;j++){const z0=-23-j*1.9,z1=z0-1.9,y0=yt(z0),y1=yt(z1),L=Math.hypot(1.9,y1-y0),a=Math.atan2(y1-y0,1.9);put(BOX,s*19.35,(y0+y1)/2-0.45,(z0+z1)/2,a,0,0,0.42,1.1,L+0.05,C.hullR);put(BOX,s*19.37,(y0+y1)/2+0.12,(z0+z1)/2,a,0,0,0.5,0.14,L+0.05,C.inkD)}sph(s*19.35,yt(-34.4)+0.2,-34.4,0.5,0.5,0.5,C.gold,0,.8);for(let i=0;i<22;i++){const z=-28.6+i*2.8;if(z>35)break;box(s*19.55,-0.72,z,0.5,0.32,0.34,C.woodD)}}}
for(const s of[-1,1]){cyl(s*13,3.6,-31.8,0.16,6.0,0.16,C.woodD);sph(s*13,6.7,-31.8,0.26,0.26,0.26,C.gold,0,.8);box(s*13,5.5,-30.2,0.05,0.7,3.0,C.hullR,0,0,F_CLOTH);box(s*13,4.85,-30.4,0.05,0.6,2.6,C.white,0,0,F_CLOTH)}
//#shield_walls
for(const s of[-1,1]){for(let i=0;i<19;i++){const z=-30.1+i*3;box(s*17.7,0.55,z,0.5,1.1,2.86,C.shieldW,3);
  const sq=i%2,h=sq?0.3:0.52,w=sq?0.3:0.14;for(const f of[-0.27,0.27])box(s*17.7+f,0.6,z,0.04,h,w,C.inkD)}
 for(let i=0;i<20;i++){const z=Math.min(25.3,-31.6+i*3);box(s*17.7,0.62,z,0.64,1.24,0.24,C.woodD);sph(s*17.7,1.3,z,0.2,0.16,0.2,C.gold,0,.8)}
 box(s*17.7,1.18,-3.1,0.74,0.14,57.4,C.hullR);box(s*17.35,0.08,-3.1,0.14,0.16,57.2,C.woodD);box(s*17.0,0.02,-3.1,0.7,0.04,57.2,C.woodD,2)}
for(let i=0;i<12;i++){const x=-16.45+i*2.99;box(x,0.55,-31.8,2.86,1.1,0.5,C.shieldW,2);const sq=i%2,h=sq?0.3:0.52,w=sq?0.3:0.14;for(const f of[-0.27,0.27])box(x,0.6,-31.8+f,w,h,0.04,C.inkD)}
for(let i=0;i<13;i++){const x=-17.95+i*2.99;box(x,0.62,-31.8,0.24,1.24,0.64,C.woodD);sph(x,1.3,-31.8,0.2,0.16,0.2,C.gold,0,.8)}
box(0,1.18,-31.8,36.1,0.14,0.74,C.hullR);box(0,0.08,-31.45,35.6,0.16,0.14,C.woodD);
//#stern_castle
box(0,2.0,30.3,35.2,4.0,9.4,C.plaster);for(let i=0;i<13;i++)box(-17.1+i*2.85,2.0,25.56,0.34,4.0,0.22,C.woodD);for(const y of[0.15,3.85])box(0,y,25.55,35.3,0.3,0.24,C.woodD);
for(let i=0;i<12;i++){if(i===5||i===6)continue;const x=-15.68+i*2.85;box(x,2.3,25.5,1.7,1.0,0.1,C.inkD);for(let k=0;k<4;k++)box(x-0.6+k*0.4,2.3,25.44,0.08,1.0,0.06,C.wood)}
box(0,1.6,25.5,4.2,3.2,0.12,C.inkD);for(const s of[-1,1])box(s*1.05,1.6,25.42,1.9,3.0,0.06,C.wood,2);
put(PRISM,0,5.15,30.3,0,PI/2,0,10.6,2.3,36.4,C.roofT,5);box(0,4.05,30.3,36.6,0.24,10.8,C.inkD);
box(0,7.1,31.2,18.6,3.6,6.4,C.plaster);for(let i=0;i<7;i++)box(-9.0+i*3,7.1,27.96,0.3,3.6,0.2,C.woodD);for(let i=0;i<6;i++){const x=-7.5+i*3;box(x,7.4,27.92,1.6,1.2,0.08,C.inkD);box(x,7.4,27.88,1.6,0.1,0.06,C.wood)}
put(PRISM,0,9.95,31.2,0,PI/2,0,8.2,2.3,20.2,C.roofT,5);box(0,8.9,31.2,20.4,0.22,8.4,C.inkD);box(0,11.1,31.2,20.6,0.3,0.5,C.gold,0,.8);
for(const s of[-1,1]){put(CONE,s*10.1,11.6,31.2,0,0,-s*0.5,0.7,1.6,0.7,C.gold,0,.8);put(CONE,s*18.1,6.6,30.3,0,0,-s*0.5,0.7,1.6,0.7,C.gold,0,.8)}
cyl(0,15.0,31.2,0.24,8.2,0.24,C.woodD);box(0,16.3,32.6,0.06,4.6,2.8,C.flag1,0,0,F_CLOTH);box(0,16.3,32.6,0.08,1.2,1.2,C.white,0,0,F_CLOTH);
//#mast
box(0,0.5,-6,2.8,1.0,2.8,C.woodD);box(0,1.04,-6,3.0,0.1,3.0,C.iron);cyl(0,13.2,-6,1.15,26.4,1.15,C.wood,9);for(let i=0;i<8;i++){const a=i*PI/4;put(BOX,Math.sin(a)*0.66,1.3,-6+Math.cos(a)*0.66,0,a,0,0.3,0.5,0.22,C.woodD)}
for(const s of[-1,1]){box(s*1.2,0.8,-3.9,0.42,1.6,0.42,C.woodD);sph(s*1.2,1.66,-3.9,0.3,0.2,0.3,C.woodD);for(const y of[0.6,1.1])put(CYL,s*1.2,y,-3.9,0,0,PI/2,0.1,0.8,0.1,C.wood)}box(0,1.25,-3.9,2.2,0.22,0.3,C.woodD);colB.push({x0:-1.6,x1:1.6,z0:-7.6,z1:-3.6,h:27});
for(const y of[2.4,5.4,8.4,11.4])cyl(0,y,-6,1.3,0.3,1.3,C.iron);cyl(0,26.6,-6,1.6,0.5,1.6,C.woodD);sph(0,27.1,-6,0.7,0.7,0.7,C.gold,0,.8);
put(CYL,0,24.8,-7.0,0,0,PI/2,0.55,27,0.55,C.woodD);put(CYL,0,12.6,-7.2,0,0,PI/2,0.45,25,0.45,C.woodD);
//#sail
{const N=12,pz=x=>-7.4-1.5*(1-(x/12.4)*(x/12.4));for(let i=0;i<N;i++){const x0=-12.4+i*24.8/N,x1=x0+24.8/N;along(x0,pz(x0),x1,pz(x1),len=>{box(0,18.7,0,len+0.06,11.6,0.22,i%2?C.sailS:C.sail,2);if(i)box(-len/2,18.7,0,0.06,11.6,0.3,C.ropeG);for(const y of[13.3,15.1,23.7])box(0,y,0,len+0.08,0.16,0.34,C.woodD)})}
 const ez=pz(0)+0.26;box(0,17.8,ez,5.0,4.2,0.1,C.red);put(PRISM,0,21.1,ez,0,0,0,5.0,2.4,0.1,C.red);box(0,18.1,ez+0.04,3.5,3.2,0.1,C.white);put(PRISM,0,20.6,ez+0.04,0,0,0,3.5,1.6,0.1,C.white);
 for(const[x,y]of[[-0.7,18.8],[0.7,18.8],[0,17.4],[0,19.9]])box(x,y,ez+0.08,0.5,0.5,0.1,C.inkD);
 for(const x of[-12.4,-6,6,12.4])rope(x,12.7,pz(x),x*0.4,0.1,-1.2,0.07)}
//#rigging
for(const s of[-1,1])for(const z of[-15,-11,-1,3]){rope(0,25.6,-6,s*17.6,1.19,z,0.1);sph(s*17.7,1.42,z,0.36,0.36,0.2,C.woodD);box(s*18.0,0.6,z,0.1,1.5,0.18,C.iron)}rope(0,25.6,-6,0,1.19,-31.6,0.12);rope(0,26,-6,0,11.2,30,0.1);
//#flags
for(const s of[-1,1])for(let i=0;i<4;i++){const z=-21+i*12;cyl(s*17.7,3.92,z,0.13,5.56,0.13,C.woodD);box(s*17.7,5.0,z+0.78,0.05,3.2,1.4,i%2?C.white:C.flag1,0,0,F_CLOTH);sph(s*17.7,6.8,z,0.24,0.24,0.24,C.gold,0,.8)}
//#cannons
for(const s of[-1,1])for(const z of[-17,9]){mPush();mT(s*15.6,0,z);box(0,0.45,0,1.7,0.6,1.5,C.woodD);for(const q of[-0.55,0.55])for(const w of[-0.62,0.62])put(CYL,w,0.32,q,0,0,PI/2,0.62,0.18,0.62,C.inkD);
 put(CYL,s*0.25,1.1,0,0,0,PI/2,0.62,2.9,0.62,C.iron,0,.5);put(CYL,s*1.6,1.1,0,0,0,PI/2,0.78,0.3,0.78,C.iron,0,.5);sph(-s*1.25,1.1,0,0.45,0.45,0.45,C.iron);put(CYL,s*0.2,1.1,0,0,0,PI/2,0.7,0.16,0.7,C.gold,0,.8);mPop();colB.push({x0:s>0?14.0:-17.4,x1:s>0?17.4:-14.0,z0:z-0.85,z1:z+0.85,h:1.8});
 for(const[dx,dz,y]of[[-0.26,-0.22,0.2],[0.26,-0.22,0.2],[0,0.24,0.2],[0,0,0.52]])sph(s*14.9+dx,y,z+1.75+dz,0.42,0.42,0.42,C.iron,0,.5);colC.push({x:s*14.9,z:z+1.75,r:0.55,h:0.8})}
//#cargo
for(const[x,z]of[[-12.2,17.6],[-10.7,18.6],[-11.6,16.0],[12.4,-20.4],[13.6,-18.9]]){cyl(x,0.8,z,1.25,1.6,1.25,C.wood,3);for(const y of[0.3,1.3])cyl(x,y,z,1.3,0.14,1.3,C.iron);cyl(x,1.62,z,1.0,0.05,1.0,C.woodD);colC.push({x,z,r:0.72,h:1.7})}
for(const[x,z,a]of[[11.6,15.4,0.1],[13.3,17.3,-0.2],[-13.4,-17.0,0.25]]){put(BOX,x,0.7,z,0,a,0,1.7,1.4,1.7,C.wood,2);put(BOX,x,0.7,z,0,a,0,1.74,0.14,1.74,C.rope);put(BOX,x,0.7,z,0,a+PI/2,0,0.14,1.44,1.74,C.rope);colC.push({x,z,r:1.2,h:1.4})}
put(BOX,12.4,1.95,16.3,0,0.4,0,1.3,1.1,1.3,C.wood,2);
for(const[x,z]of[[-6.5,-24.5],[7.2,20.6],[-14.6,6.5]]){put(CYL,x,0.1,z,0,0,0,1.7,0.2,1.7,C.rope,6);put(CYL,x,0.21,z,0,0,0,0.7,0.05,0.7,C.woodD)}
//#deck_fittings
box(0,0.07,9,6.2,0.14,4.2,C.woodD);for(let i=0;i<7;i++)box(-2.7+i*0.9,0.16,9,0.16,0.06,4.0,C.wood);for(let i=0;i<5;i++)box(0,0.17,7.4+i*0.8,6.0,0.06,0.16,C.wood);
{mPush();mT(0,0,-24.2);cyl(0,0.7,0,1.4,1.4,1.4,C.woodD);cyl(0,1.45,0,1.7,0.14,1.7,C.iron);for(let i=0;i<4;i++)put(CYL,0,1.2,0,0,i*PI/4,PI/2,0.18,3.6,0.18,C.wood);mPop();colC.push({x:0,z:-24.2,r:1.75,h:1.6})}
{mPush();mT(-9,0,21);box(0,0.5,0,2.4,1.0,1.2,C.woodD);put(CYL,0,1.8,0,PI/2,0,0,2.0,1.4,2.0,C.hullR);put(CYL,0,1.8,0,PI/2,0,0,1.7,1.46,1.7,C.paper);for(const s of[-1,1])put(CYL,0,1.8,s*0.72,PI/2,0,0,2.06,0.08,2.06,C.gold,0,.8);mPop();colB.push({x0:-10.25,x1:-7.75,z0:20.2,z1:21.8,h:2.8})}
box(0,0.07,-15,4.6,0.14,3.4,C.woodD);for(let i=0;i<5;i++)box(-1.8+i*0.9,0.16,-15,0.16,0.06,3.2,C.wood);for(let i=0;i<4;i++)box(0,0.17,-16.2+i*0.8,4.4,0.06,0.16,C.wood);
for(const s of[-1,1]){const z=-3;box(s*16.75,0.15,z,0.5,0.3,3.2,C.woodD);box(s*16.95,1.5,z,0.16,0.14,3.2,C.woodD);for(let j=0;j<6;j++){const zz=z-1.25+j*0.5;put(CYL,s*16.8,1.6,zz,0,0,-s*0.12,0.09,3.2,0.09,C.woodD);put(CONE,s*16.99,3.35,zz,0,0,-s*0.12,0.16,0.45,0.16,C.iron,0,.5)}colB.push({x0:s>0?16.3:-17.4,x1:s>0?17.4:-16.3,z0:z-1.7,z1:z+1.7,h:3.4})}
for(const[x,z]of[[3.0,-8.4],[3.7,-7.6]]){cyl(x,0.35,z,0.7,0.7,0.7,C.wood,3);cyl(x,0.5,z,0.74,0.08,0.74,C.iron);cyl(x,0.66,z,0.6,0.02,0.6,C.sea)}colC.push({x:3.35,z:-8.0,r:0.9,h:0.8});
for(const s of[-1,1])chochin(s*3.4,2.75,25.15,C.lant,F_UNLIT);
for(const[x,z]of[[-15.6,-27.6],[15.6,-27.6],[-15.6,22.2],[15.6,22.2]]){cyl(x,1.4,z,0.2,2.8,0.2,C.woodD);box(x,2.9,z,0.7,0.12,0.7,C.woodD);sph(x,3.5,z,0.8,1.0,0.8,C.lant,6,0,F_UNLIT);cyl(x,4.05,z,0.52,0.12,0.52,C.black);cyl(x,2.98,z,0.52,0.12,0.52,C.black);colC.push({x,z,r:0.42,h:3})}
//#background
for(const[x,z,w,h]of[[-420,-520,300,70],[300,-560,360,90],[560,-120,260,60],[-560,80,280,55],[120,520,300,50]]){put(CONE,x,h/2+SY-2,z,0,0,0,w,h,w,C.isle);put(CONE,x+w*0.12,h*0.7+SY-2,z-w*0.05,0,0,0,w*0.45,h*0.6,w*0.45,C.isleD)}
for(let k=0;k<9;k++){const a=k/9*TAU+R()*0.4,d=230+R()*200,h=70+R()*60,cx=Math.cos(a)*d,cz=Math.sin(a)*d;for(let i=0;i<3;i++){const w=70+R()*60;sph(cx+(i-1)*50+R()*14,h+R()*10,cz+R()*20,w,w*0.26,w*0.55,i%2?C.cloudS:C.cloudG,0,0,F_NOCAST|F_DRIFT)}}
}
