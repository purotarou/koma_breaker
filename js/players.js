'use strict';
// ================= V2: STAGES / PLAYERS / ITEMS / NET / MENUS =================
const r1=v=>Math.round(v*10)/10,r2=v=>Math.round(v*100)/100;
let curStage=-1,T=pl,eidN=0,sideFlip=1,BI=C.ink,btns=[];
const others=[],items=[],shocks=[];
Object.assign(C,{crim:hex(0x9a1626),skinH:hex(0xffd9b8),moon:hex(0xfff3b0),nGrass:hex(0x4f8f6a),nHill:hex(0x3d5f8f),nMount:hex(0x4a5aa0),nCloud:hex(0x8f93d0),straw:hex(0xe0c070),heart:hex(0xff4d7a)});
const PCOL=[hex(0xe5402b),hex(0x2f6fd8),hex(0x35b85a),hex(0xf4b82e)],PCSS=['#ff4a3d','#3f8cff','#35d06a','#ffc21a'];
const RING2=addPrim(mkRing(40,0.47));
Object.assign(G,{menu:'main',mode:'solo',stage:0,np:1,paused:false,pk:[0,0,0,0],pd:[0,0,0,0],tm:0,itemT:6,demoN:0,allT:0});
// Stage table. hard: tougher boss (faster attacks, more HP, wider shock waves) / bom: boss summons bomb oni / ink: enemy ink colour /
// line: second half of the boss's opening line / cut: boss name split for the cut-in (small, big) / pfx: ambient particles /
// sun: light direction (default = high noon) / shade: shadow-tone tint / fogR: fog start, end, strength.
// Stages 3-5 have no boss of their own yet: the existing demon king stands in (STORY.md 5).
const STG=[{name:'朱の神社',sub:'ステージ１',desc:['桜舞う境内で','墨の妖怪を迎え撃て'],col:'#e5402b',s0:[.14,.45,.95],s1:[.5,.8,1],s2:[.93,.97,1],fog:[.93,.97,1],grade:[1,1,1],night:0,boss:'大墨魔王ベタグロ',cut:['大墨魔王','ベタグロ'],hard:0,bom:0,ink:C.ink,line:'黒ク塗ル!!',pfx:0},
{name:'月下の天守',sub:'ステージ２',desc:['爆弾鬼が走る夜の城','強敵・紅蓮魔王'],col:'#7a3fd0',s0:[.04,.05,.22],s1:[.12,.16,.46],s2:[.42,.36,.66],fog:[.26,.26,.5],grade:[.74,.8,1],night:1,boss:'紅蓮魔王アカベタ',cut:['紅蓮魔王','アカベタ'],hard:1,bom:1,ink:C.crim,line:'紅ク染メル!!',pfx:1},
{name:'黄昏の町',sub:'ステージ３',desc:['墨が降る夕暮れの町','橋の上で灯りを守れ'],col:'#ff8a2b',s0:[.26,.15,.44],s1:[.96,.5,.32],s2:[1,.84,.55],fog:[1,.8,.6],grade:[1.04,.94,.86],night:0,boss:'大入道',cut:['','大入道'],hard:1,bom:0,ink:C.ink,line:'叩キ壊ス!!',pfx:2,sun:[-0.8,0.48,-0.32],shade:[.64,.42,.6],fogR:[50,430,0.75]},
{name:'雪の古寺',sub:'ステージ４',desc:['吹雪の山寺で','封印の秘密に迫れ'],col:'#3f9fe0',s0:[.52,.64,.82],s1:[.78,.85,.94],s2:[.95,.97,1],fog:[.9,.93,.98],grade:[.94,.98,1.06],night:0,boss:'鐘の僧',cut:['','鐘の僧'],hard:1,bom:0,ink:C.ink,line:'封ジル!!',pfx:3,arena:[31.6,-37,33.6],sun:[0.42,0.72,0.55],shade:[.6,.68,.9],fogR:[22,240,0.85]},
{name:'墨の池',sub:'ステージ５',desc:['色が溶けて消える','封印の最奥'],col:'#16121f',s0:[.78,.78,.8],s1:[.9,.9,.9],s2:[.97,.96,.93],fog:[.94,.93,.9],grade:[1,1,1],night:0,boss:'白抜魔王シロヌキ',cut:['白抜魔王','シロヌキ'],hard:1,bom:1,ink:C.ink,line:'白ク抜ク!!',pfx:4,shade:[.56,.56,.6],fogR:[30,300,0.85]}];
const WAVESET=[[{ch:'第一話',name:'墨鬼、襲来！',g:[{imp:4},{imp:5}]},{ch:'第二話',name:'化け提灯の群れ',g:[{lan:3,imp:2},{lan:3,imp:3}],say:['上か！']},{ch:'第三話',name:'鎧鬼、突撃！',g:[{bru:1,imp:3},{lan:3,imp:3},{bru:1,lan:2}],say:['デカい','のが来た!']},{ch:'最終話',name:'大墨魔王ベタグロ',boss:1}],
[{ch:'第一話',name:'爆弾鬼、乱入！',g:[{imp:3,bom:3},{imp:4,bom:3}],say:['赤いのは','爆発する!']},{ch:'第二話',name:'提灯地獄',g:[{lan:5},{lan:4,bom:3}]},{ch:'第三話',name:'双鬼の門番',g:[{bru:2,imp:3},{lan:4,bom:4},{bru:1,lan:3}],say:['二体も','いるのか!']},{ch:'最終話',name:'紅蓮魔王アカベタ',boss:1}],
[{ch:'第一話',name:'墨降る町',g:[{imp:4},{imp:4,lan:2}],say:['町にまで','墨が!']},{ch:'第二話',name:'提灯行列',g:[{lan:5},{lan:4,imp:3}],say:['提灯が','歩いてる!']},{ch:'第三話',name:'橋の上の鎧鬼',g:[{bru:1,lan:3},{imp:4,lan:3},{bru:2,imp:2}]},{ch:'最終話',name:'大入道',boss:1}],
[{ch:'第一話',name:'吹雪の参道',g:[{imp:5},{imp:4,lan:2}],say:['さ、寒い…!']},{ch:'第二話',name:'凍える鎧鬼',g:[{bru:1,imp:3},{bru:1,lan:3}]},{ch:'第三話',name:'鐘の消えた鐘楼',g:[{lan:4,imp:3},{bru:2,lan:2},{imp:5,lan:2}],say:['鐘が','ない…?']},{ch:'最終話',name:'鐘の僧',boss:1}],
[{ch:'第一話',name:'墨に溶ける色',g:[{imp:5,bom:2},{imp:4,lan:3}]},{ch:'第二話',name:'過去の影',g:[{bru:1,bom:3},{lan:4,bom:3}],say:['見覚えが','あるぞ…']},{ch:'第三話',name:'最後の門番',g:[{bru:2,imp:3},{lan:4,bom:4},{bru:2,lan:3}]},{ch:'最終話',name:'白抜魔王シロヌキ',boss:1}]];
const SPAWN=[[0,16,0],[-4,18,0],[4,18,0],[0,20,0]],PSPAWN=[[-17,17],[17,-20],[17,17],[-17,-20],[0,17],[0,-13]];
function setStage(n){if(curStage===n)return;curStage=n;templeDoor.t=templeDoor.target=0;for(const p of prims){p.b[0].n=0;p.b[0].dirty=true}colC.length=0;colB.length=0;idS=0;curLayer=0;mReset();[buildStage1,buildStage2,buildStage3,buildStage4,buildStage5][n]();mReset();curLayer=1;setSun(STG[n].sun);setArena(STG[n].arena)}
// Stage 2 (castle) is authored in Blender: blender/stage_castle.blend -> assets/stage_castle.glb (loaded by js/glb.js).
// buildStage2Code() is the original code-built version (fallback, and ?stage2=code for comparisons).
function buildStage2(){if(STAGE_GLB[1])emitGlbStage(STAGE_GLB[1]);else buildStage2Code()}
function buildStage2Code(){const R=mulberry(23),NF=F_UNLIT|F_NOCAST;WT={base:C.stoneD,pl:C.plaster,roof:C.black,roofD:C.inkD};
box(0,-0.62,0,1700,1,1700,C.nGrass,4);box(0,-0.1,-2,46.6,0.2,50.6,C.wood,2);put(CYL,0,0,2,0,0,0,17,0.06,17,C.stoneD,1);box(0,0.02,-2,5,0.1,49,C.stone,1);
wall(-23,-27,23,-27);wall(-23,23,-4.4,23);wall(4.4,23,23,23);wall(-23,-27,-23,23);wall(23,-27,23,23);
for(const[x,z]of[[-24,-28],[24,-28],[-24,24],[24,24]]){box(x,3,z,5.4,6,5.4,C.stoneD,5);box(x,7.6,z,4.4,3.2,4.4,C.plaster);box(x,7.8,z,4.5,0.9,1.2,C.yellow,0,0,F_UNLIT);box(x,7.8,z,1.2,0.9,4.5,C.yellow,0,0,F_UNLIT);put(PYR,x,10.3,z,0,0,0,6.6,2.2,6.6,C.black);put(CONE,x,11.8,z,0,0,0,0.5,1.2,0.5,C.gold)}
for(const s of[-1,1]){box(s*4.6,4,-17,1.3,8,1.3,C.woodD,2);box(s*4.6,0.5,-17,1.7,1,1.7,C.black);colC.push({x:s*4.6,z:-17,r:0.95,h:8});put(CONE,s*7.3,10.6,-17,0,0,-s*0.5,0.6,1.5,0.6,C.gold,0,.8);cyl(s*3.9,2.6,23,0.8,5.2,0.8,C.woodD);box(s*1.95,2.3,23.1,3.7,4.6,0.25,C.wood,2)}
box(0,7.5,-17,13,1,1.4,C.woodD,2);box(0,8.25,-17,13.8,0.5,2,C.plaster);put(PRISM,0,9.45,-17,0,PI/2,0,3.6,1.9,15.6,C.black,3);box(0,6.3,-17,2.4,1.1,0.3,C.gold);box(0,6.3,-17,2,0.75,0.36,C.black);
box(0,5.2,23,9.6,0.6,0.9,C.woodD);put(PRISM,0,6.2,23,0,PI/2,0,3.6,1.5,11.5,C.black,3);
const fire=(x,z)=>{for(let i=0;i<3;i++){const a=i*2.094;put(CYL,x+Math.cos(a)*0.42,0.9,z+Math.sin(a)*0.42,0,-a,0.42,0.1,2,0.1,C.black)}cyl(x,1.85,z,0.95,0.32,0.95,C.black);put(CONE,x,2.65,z,0,0,0,0.85,1.5,0.85,C.orange,0,0,NF|F_FLAME);put(CONE,x,2.45,z,0,1,0,0.5,1,0.5,C.yellow,0,0,NF|F_FLAME);colC.push({x,z,r:0.75,h:2.6})};
fire(-7.5,-9);fire(7.5,-9);fire(-7.5,6);fire(7.5,6);
const cannon=(x,z,a)=>{mPush();mT(x,0,z);mRY(a);box(0,0.5,0,1.3,0.5,2.3,C.woodD,2);for(const s of[-1,1])put(CYL,s*0.75,0.55,0.3,0,0,PI/2,1.1,0.2,1.1,C.wood);put(CYL,0,1.05,0.5,1.35,0,0,0.6,2.8,0.6,C.black,0,.8);put(CYL,0,1.35,1.75,1.35,0,0,0.72,0.2,0.72,C.gold);mPop();colB.push({x0:x-1.2,x1:x+1.2,z0:z-1.2,z1:z+1.2,h:1.5})};
cannon(-15,-6,0.5);cannon(15,10,-2.2);
for(const[bx,by]of[[-1.3,0.6],[0,0.6],[1.3,0.6],[-0.65,1.72],[0.65,1.72]]){put(CYL,-17.5,by,10+bx,0,0,PI/2,1.2,1.5,1.2,C.straw,6);put(CYL,-17.5,by,10+bx,0,0,PI/2,1.24,0.2,1.24,C.woodD)}colB.push({x0:-18.4,x1:-16.6,z0:8,z1:12,h:2.4});
for(const[bx,by]of[[-0.65,0.6],[0.65,0.6],[0,1.72]]){put(CYL,16,by,-12+bx,0,0,PI/2,1.2,1.5,1.2,C.straw,6);put(CYL,16,by,-12+bx,0,0,PI/2,1.24,0.2,1.24,C.woodD)}colB.push({x0:15.1,x1:16.9,z0:-13.4,z1:-10.6,h:2.4});
leafy(-18.5,-22,1,R,C.cedar,C.cedarD,1);leafy(18.5,-22,1.1,R,C.cedar,C.cedarD,1);leafy(18.5,17.5,1,R,C.cedar,C.cedarD,1);leafy(-18.5,18,0.9,R,C.cedar,C.cedarD,1);
[C.flag3,C.flag2,C.flag1,C.flag3].forEach((c,i)=>{nobori(-3.5,-12+i*7,c);nobori(3.5,-12+i*7,i%2?C.flag2:C.flag3)});
for(let i=0;i<56;i++){const a=i/56*TAU+R()*0.08,d=34+R()*22,x=Math.cos(a)*d,z=Math.sin(a)*d-2;if(Math.abs(x)<28&&z>-33&&z<29)continue;if([[-24,-28],[24,-28],[-24,24],[24,24]].some(([tx,tz])=>Math.hypot(x-tx,z-tz)<9.5))continue;cedar(x,z,0.8+R()*0.7,R)}
for(let i=0;i<44;i++){const a=i/44*TAU+R()*0.1,d=66+R()*90,x=Math.cos(a)*d,z=Math.sin(a)*d;if(x>30&&z<-70)continue;R();R()}
box(72,6,-125,62,12,52,C.stoneD,5);for(let i=0;i<4;i++){const w=48-10*i,d=40-9*i,y=12+i*11;box(72,y+4,-125,w,8,d,C.plaster);put(PRISM,72,y+10,-125,0,PI/2,0,d+10,4.4,w+12,C.black,3);for(let j=0;j<4-i;j++){box(72-w/2+w*(j+0.5)/(4-i),y+4,-125+d/2,2.4,3.4,0.6,C.yellow,0,0,NF);box(72-w/2,y+4,-125-d/2+d*(j+0.5)/(4-i),0.6,3.4,2.4,C.yellow,0,0,NF)}}
for(const s of[-1,1])put(CONE,72+s*7,59.4,-125,0,0,-s*0.4,2,5,2,C.gold,0,.8);
put(SPH,-70,200,-700,0,0,0,240,240,20,C.moon,0,0,NF);
for(let i=0;i<10;i++){const a=i/10*TAU+R()*0.3,d=190+R()*110;sph(Math.cos(a)*d,-6,Math.sin(a)*d,150+R()*90,46+R()*36,130+R()*60,C.nHill)}
put(CONE,260,24,-420,0,0,0,330,74,330,C.nMount);put(CONE,430,20,-120,0,0,0,300,66,300,C.nMount);put(CONE,-430,22,120,0,0,0,320,70,320,C.nMount);
for(let k=0;k<7;k++){const a=k/7*TAU+R()*0.5,d=260+R()*180,h=90+R()*80,cx=Math.cos(a)*d,cz=Math.sin(a)*d,n=3+((R()*3)|0);for(let i=0;i<n;i++){const w=50+R()*40;sph(cx+(i-n/2)*32,h+R()*8,cz+R()*20,w,w*0.3,w*0.7,C.nCloud,0,0,F_NOCAST|F_DRIFT)}}
// ---- extra props (own RNG so the layout above is unchanged) ----
const R2=mulberry(37);
// gate lanterns
for(const x of[-2.6,2.6])chochin(x,5.95,-16.1,C.lant,F_UNLIT);for(const x of[-2.2,2.2])chochin(x,3.85,22.2,C.lant,F_UNLIT);
// jinmaku
for(const s of[-1,1])for(const[z0,n]of[[-17,5],[3.4,4]])for(let i=0;i<n;i++){const z=z0+i*2.8+1.4,x=s*22.12;
 box(x,1.85,z,0.04,1.5,2.7,C.white);box(x-s*0.01,2.45,z,0.04,0.3,2.7,C.black);box(x-s*0.01,1.25,z,0.04,0.3,2.7,C.black);
 put(CYL,x-s*0.03,1.85,z,0,0,PI/2,0.62,0.04,0.62,C.crim);put(CYL,x-s*0.04,1.85,z,0,0,PI/2,0.3,0.04,0.3,C.gold);
 cyl(x,1.4,z0+i*2.8,0.1,2.8,0.1,C.woodD)}
// spear racks
for(const s of[-1,1]){const x=s*21.1;for(const z of[-1.2,1.2])box(x,1.1,z,0.15,2.2,0.15,C.woodD,2);box(x,1.9,0,0.12,0.1,2.6,C.woodD);box(x,0.5,0,0.12,0.1,2.6,C.woodD);
 for(let i=0;i<5;i++){const z=-0.9+i*0.45,rz=s*(0.06+R2()*0.05);put(CYL,x,1.55,z,0,0,rz,0.06,3.1,0.06,C.black);put(CONE,x-Math.sin(rz)*1.72,3.32,z,0,0,rz,0.12,0.42,0.12,C.steel,0,.8)}
 colB.push({x0:s>0?20.6:-21.6,x1:s>0?21.6:-20.6,z0:-1.5,z1:1.5,h:3.4})}
// cannonballs
for(const[cx,cz]of[[-12.9,-7.9],[13.4,12.2]]){for(const[dx,dz]of[[-0.33,-0.33],[0.33,-0.33],[-0.33,0.33],[0.33,0.33]])sph(cx+dx,0.32,cz+dz,0.64,0.64,0.64,C.black,0,.6);sph(cx,0.83,cz,0.64,0.64,0.64,C.black,0,.6);colC.push({x:cx,z:cz,r:0.75,h:1.2})}
}
// ---- players ----
const isCli=()=>net.on&&!net.host;
function allP(){const a=[];if(!pl.dead)a.push(pl);for(const o of others)if(!o.dead)a.push(o);return a}
function pickT(x,z){let b=pl,bd=1e9;for(const p of allP()){const d=Math.hypot(p.x-x,p.z-z);if(d<bd){bd=d;b=p}}return b}
function pickR(){const a=allP();return a.length?a[(Math.random()*a.length)|0]:pl}
function bossT(b){let p=null;if(b.ti!=null)p=allP().find(q=>q.slot===b.ti);if(!p){p=pickR();b.ti=p.slot}return p}
function hurtT(p,d,x,z){if(p===pl)hurtPlayer(d,x,z);else net.hq.push([p.slot,d,r1(x),r1(z)])}
function areaHurt(x,z,r,d,jump){for(const p of allP())if(Math.hypot(p.x-x,p.z-z)<r&&!(jump&&p.y>0.7))hurtT(p,d,x,z)}
function eCenter(e){if(e.type==='imp')return[e.x,e.y+0.62*e.sc,e.z,0.8*e.sc];if(e.type==='lan')return[e.x,e.y,e.z,1];if(e.type==='bru')return[e.x,1.9,e.z,2];if(e.type==='boss')return[e.hx*2.7,25+e.yo,-24,6.5];return[e.x,e.y+1,e.z,1.1]}
function sideText(str,e,o){const c=eCenter(e),p=project(c[0],c[1],c[2]);if(!p)return;const f=H/2/Math.tan(cam.fov/2),er=Math.min(280,c[3]*f/p.w),size=o.size||44,w=size*0.9*str.length;sideFlip=-sideFlip;let x=p.x+sideFlip*(er+w/2+20);if(x<w/2+50||x>W-w/2-50)x=p.x-sideFlip*(er+w/2+20);addText(str,x,p.y-er*0.5-rnd(0,24),o)}
function resetPlayer(x,z,yaw){skApply();Object.assign(pl,{x,z,yaw,pitch:0,vx:0,vz:0,y:0,vy:0,hp:SK.hp,ammo:SK.mag,aj:0,revU:0,reload:0,cool:0,gauge:0,dashT:0,dashCd:0,ddx:0,ddz:0,inv:0,bob:0,kick:0,rec:0,sp:0,spT:0,dead:false,deadT:0,gunDip:0,spin:0,flashT:0,moving:0,tilt:0,pow:0,respT:0,revT:0,lastBy:-1,land:0,slot:pl.slot||0})}
resetPlayer(0,16,0);
function shoot(){pl.ammo--;pl.cool=0.125;pl.kick+=0.03;pl.rec=1;pl.flashT=0.05;pl.spin+=PI/3;shake(0.07);snd('shot');const pw=pl.pow>0?2:1,pvp=G.mode==='pvp';
let d=aimDir();const ox=cam.x,oy=cam.y,oz=cam.z,as=touchMode||G.demoOn;let best=as?0.1:0.035,bp=null;
const chk=(x,y,z,bias)=>{const px=x-ox,py=y-oy,pz=z-oz,l=Math.hypot(px,py,pz)||1,a=Math.acos(clamp((px*d[0]+py*d[1]+pz*d[2])/l,-1,1))-bias;if(a<best){best=a;bp=[px/l,py/l,pz/l]}};
for(const e of enemies){if(e.dead||e.st==='spawn')continue;for(const s of spheres(e))chk(s[0],s[1],s[2],s[4]>1.5?0.02:0)}for(const s of shots)chk(s.x,s.y,s.z,0);if(pvp)for(const o of others)if(!o.dead)chk(o.x,o.y+1.2,o.z,0);
if(bp){const k=as?0.85:0.5;d=[lerp(d[0],bp[0],k),lerp(d[1],bp[1],k),lerp(d[2],bp[2],k)];const l=Math.hypot(d[0],d[1],d[2]);d=[d[0]/l,d[1]/l,d[2]/l]}
let tw=rayWorld(ox,oy,oz,d[0],d[1],d[2],140),he=null,hm=1,hs=null,ho=null;const wallT=tw;
for(const e of enemies){if(e.dead||e.st==='spawn')continue;let tm=1e9,mm=0;for(const s of spheres(e)){const t=raySph(ox,oy,oz,d,s[0],s[1],s[2],s[3]);if(t>0){if(t<tm)tm=t;if(s[4]>mm)mm=s[4]}}if(tm<tw){tw=tm;he=e;hm=mm}}
for(const s of shots){const t=raySph(ox,oy,oz,d,s.x,s.y,s.z,s.r+0.35);if(t>0&&t<tw){tw=t;he=null;hs=s}}
if(pvp)for(const o of others){if(o.dead)continue;const t1=raySph(ox,oy,oz,d,o.x,o.y+0.85,o.z,0.6),t2=raySph(ox,oy,oz,d,o.x,o.y+1.62,o.z,0.34),t=t1>0&&t2>0?Math.min(t1,t2):Math.max(t1,t2);if(t>0&&t<tw){tw=t;he=null;hs=null;ho=o;hm=t2>0?2:1}}
const hx=ox+d[0]*tw,hy=oy+d[1]*tw,hz=oz+d[2]*tw;fxTracer(muz[0],muz[1],muz[2],hx,hy,hz,pw>1?C.orange:C.white,pw>1?0.11:0.07);if(net.on)net.q.f.push([r1(hx),r1(hy),r1(hz)]);
addText(pick(['ドン！','ダン！','バン！']),W*0.73+rnd(-40,60),H*0.62+rnd(-40,30),{size:pw>1?52:40,st:pw>1?'boom':'fire',life:0.2,grow:0.12});
if(he)damage(he,20*hm*pw,hm>1.5,hx,hy,hz);else if(ho)pvHit(ho,(hm>1.5?32:16)*pw,hm>1.5,hx,hy,hz);else if(hs){popShot(hs);if(isCli())net.q.ps.push(hs.id)}
else if(tw<140&&tw===wallT){fxStar(hx,hy,hz,0.7,C.white,0.08);fxSparks(hx,hy,hz,4,5,C.yellow)}}
function pvHit(o,dmg,crit,hx,hy,hz){o.flash=0.08;hitMark=0.12;hitCrit=crit;fxStar(hx,hy,hz,crit?1.5:1,crit?C.yellow:C.white,0.1);fxBlobs(hx,hy,hz,3,5,PCOL[o.slot],0.1);snd(crit?'crit':'hit');pl.gauge=Math.min(100,pl.gauge+4);
if(lim('hitT',0.22))sideText(crit?'キィン！':pick(['バキッ！','ガッ！','ドカッ！']),o,{size:crit?48:42,st:crit?'fire':'hit',life:0.3});net.pvAcc[o.slot]=(net.pvAcc[o.slot]||0)+dmg}
function beamDamage(dt){const d=aimDir(),ox=cam.x,oy=cam.y-0.2,oz=cam.z,pw=pl.pow>0?1.6:1;
const near=(x,y,z,r)=>{const px=x-ox,py=y-oy,pz=z-oz,t=px*d[0]+py*d[1]+pz*d[2];return t>0&&Math.sqrt(Math.max(0,px*px+py*py+pz*pz-t*t))<r};
for(const e of enemies){if(e.dead||e.st==='spawn')continue;for(const s of spheres(e))if(near(s[0],s[1],s[2],s[3]+2)){damage(e,1400*dt*pw*(e.type==='boss'?0.8:1),false,s[0],s[1],s[2],true);break}}
for(const s of shots)if(near(s.x,s.y,s.z,2.5)){popShot(s);if(isCli())net.q.ps.push(s.id)}
if(G.mode==='pvp')for(const o of others)if(!o.dead&&near(o.x,o.y+1,o.z,1.9)){o.flash=0.08;hitMark=0.1;net.pvAcc[o.slot]=(net.pvAcc[o.slot]||0)+170*dt*pw}}
function respawn(){let b=PSPAWN[0],bs=-1;for(const s of PSPAWN){let m=99;for(const o of others)if(!o.dead)m=Math.min(m,Math.hypot(o.x-s[0],o.z-s[1]));m+=Math.random()*4;if(m>bs){bs=m;b=s}}resetPlayer(b[0],b[1],Math.atan2(b[0],b[1]+2));pl.inv=2.5;snd('ui')}
function updatePlayer(dt){if(pl.pow>0)pl.pow-=dt;pl.land*=Math.exp(-9*dt);
if(pl.dead){pl.deadT+=RDT;inp.lx=inp.ly=0;inp.jump=inp.dash=inp.special=inp.reload=false;pl.y=Math.max(0,pl.y-dt*6);
 if(net.on&&G.state==='play'){pl.respT-=RDT;if(G.mode==='pvp'){if(pl.respT<=0)respawn()}else{let near=false,any=false;for(const o of others)if(!o.dead){any=true;if(Math.hypot(o.x-pl.x,o.z-pl.z)<2.8)near=true}pl.revT=near?pl.revT+RDT:Math.max(0,pl.revT-RDT);
  if(pl.revT>2.5||(pl.respT<=0&&any)){pl.dead=false;pl.hp=50;pl.inv=2.5;pl.revT=0;snd('item');addText('カイフク！',W/2,H*0.4,{size:90,st:'cyan',life:0.8})}}}return}
const cine=G.cine>0;if(!cine){pl.yaw-=inp.lx*(pl.sp?0.4:1);pl.pitch=clamp(pl.pitch-inp.ly*(pl.sp?0.4:1),-1.25,1.25)}inp.lx=inp.ly=0;
const sy=Math.sin(pl.yaw),cy=Math.cos(pl.yaw);let wx=-sy*inp.mz+cy*inp.mx,wz=-cy*inp.mz-sy*inp.mx;const wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl}
const spd=pl.sp?2.5:6.6*SK.spd,k=1-Math.exp(-(pl.y>0?5:12)*dt);pl.vx+=(wx*spd-pl.vx)*k;pl.vz+=(wz*spd-pl.vz)*k;
if(inp.dash&&pl.dashCd<=0&&!cine){let dx=wx,dz=wz;if(wl<0.2){dx=sy;dz=cy}const l=Math.hypot(dx,dz)||1;pl.ddx=dx/l;pl.ddz=dz/l;pl.dashT=0.18;pl.dashCd=0.7*SK.dash;pl.inv=Math.max(pl.inv,0.34);lines(0.85,'#fff');snd('dash');addText(pick(['シュバッ','ザッ！','シュッ']),W/2+rnd(-220,220),H*0.74,{size:62,st:'cyan',life:0.4})}
inp.dash=false;if(pl.dashT>0){pl.dashT-=dt;pl.x+=pl.ddx*24*dt;pl.z+=pl.ddz*24*dt}
if(inp.jump&&!cine){if(pl.y<=0.001){pl.vy=8.4;pl.aj=0;snd('jump');addText('タンッ',W*0.3+rnd(-60,60),H*0.78,{size:54,st:'cyan',life:0.35})}
 else if(SK.dj&&!pl.aj){pl.aj=1;pl.vy=7.8;snd('jump');fxRing(pl.x,pl.y,pl.z,1.8,C.white,0.2);fxStar(pl.x,pl.y+0.2,pl.z,1.2,C.white,0.1);addText('タタンッ',W*0.3+rnd(-60,60),H*0.74,{size:60,st:'cyan',life:0.4})}}inp.jump=false;
if(pl.y>0||pl.vy>0){pl.vy-=22*dt;pl.y+=pl.vy*dt;if(pl.y<=0){pl.y=0;pl.aj=0;if(pl.vy<-4){pl.land=1;fxSmoke(pl.x,0.2,pl.z,4,0.5,C.smoke,2.5);fxRing(pl.x,0.1,pl.z,2.6,C.white,0.2);snd('land');shake(0.12)}pl.vy=0}}
pl.x+=pl.vx*dt;pl.z+=pl.vz*dt;collide(pl,0.5);if(boss){const dx=pl.x,dz=pl.z+21.5,d=Math.hypot(dx,dz);if(d<7.5){pl.x=dx/d*7.5;pl.z=dz/d*7.5-21.5}}
pl.moving=lerp(pl.moving,pl.y>0?0:Math.min(1,Math.hypot(pl.vx,pl.vz)/5),k);pl.bob+=dt*9*pl.moving;
pl.dashCd-=dt;pl.inv-=dt;pl.cool-=dt;pl.flashT-=dt;pl.kick*=Math.exp(-10*dt);pl.rec*=Math.exp(-14*dt);pl.tilt*=Math.exp(-6*dt);
if(pl.reload>0){pl.reload-=dt;if(pl.reload<=0)pl.ammo=SK.mag}if(inp.reload&&!pl.sp)startReload();inp.reload=false;
if(inp.special&&pl.gauge>=100&&!pl.sp&&!cine){pl.sp=1;pl.spT=0;pl.gauge=0;cutSp=0.6;snd('charge');if(!net.on){slowT=0.55;slowK=0.3}}inp.special=false;
if(pl.sp===1){pl.spT+=RDT;lines(0.7,'#16121f');if(pl.spT>0.55){pl.sp=2;pl.spT=0;snd('beam');addText('ズドォォォン！',W/2,H*0.13,{size:84,st:'cyan',life:1.0,grow:0.1,rot:-0.08});flash(0.6);invA=1}}
else if(pl.sp===2){pl.spT+=dt;trauma=Math.max(trauma,0.6);pl.rec=1;lines(0.6,'#fff');beamDamage(dt);if(pl.spT>SK.beam)pl.sp=0}
if(inp.fire&&pl.cool<=0&&pl.reload<=0&&!pl.sp&&!cine){if(pl.ammo>0)shoot();else startReload()}
pl.gunDip=lerp(pl.gunDip,pl.reload>0?1:0,1-Math.exp(-14*dt))}
function hurtPlayer(d,x,z,by){if(pl.inv>0||pl.dead||G.cine>0||G.state==='clear'||G.state==='menu')return;if(pl.sp&&SK.spinv)return;if(G.demoOn){d*=0.3;if(pl.hp-d<40)d=0}
d*=SK.def;pl.hp-=d;G.dmg+=d;pl.inv=by==null?0.45:0.1;hurtA=1;shake(0.5);snd('hurt');stopT(0.04);lines(0.6,'#c20020');pl.tilt=(Math.random()<.5?-1:1)*0.09;pl.lastBy=by==null?-1:by;
addText(pick(['ガッ！','ドカッ！','グハッ']),W/2+(Math.random()<.5?-1:1)*rnd(260,420),H*0.5+rnd(-60,120),{size:80,st:'hurt',life:0.5});
if(pl.hp<=0&&SK.rev&&!pl.revU){pl.revU=1;pl.hp=Math.round(SK.hp*0.5);pl.inv=2.5;flash(0.5);snd('item');lines(0.9,'#ffd91a');addText('不屈！！',W/2,H*0.38,{size:110,st:'boom',life:1.1,rot:-0.06})}
else if(pl.hp<=0){pl.hp=0;pl.dead=true;pl.deadT=0;pl.revT=0;pl.sp=0;if(!net.on)gameOver();else if(G.mode==='pvp'){pl.respT=3;if(net.host)pvTally(pl.lastBy,net.slot);else net.q.kb.push(pl.lastBy)}else pl.respT=15}}
function damage(e,dmg,crit,hx,hy,hz,quiet){if(e.dead)return;dmg*=SK.atk*(crit?SK.crit:1);if(e.type==='boss'&&(e.st==='rise'||e.st==='die'))return;e.flash=0.07;hitMark=0.12;hitCrit=crit;e.mine=now;
if(!quiet){fxStar(hx,hy,hz,crit?1.6:1.1,crit?C.yellow:C.white,0.1);fxBlobs(hx,hy,hz,4,5,C.ink,0.13);addGauge(crit?3:2);snd(crit?'crit':'hit');stopT(0.012);
if(lim('hitT',0.24))sideText(crit?pick(['キィン！','ズキュン！']):pick(['バキッ！','ガッ！','ドカッ！','ズガッ！']),e,{size:crit?48:42,st:crit?'fire':'hit',life:0.3});
if(e.type==='imp'&&!isCli()){const d=Math.hypot(e.x-pl.x,e.z-pl.z)||1;e.kx=(e.x-pl.x)/d*7;e.kz=(e.z-pl.z)/d*7}}
else if(lim('bh'+e.seed,0.07)){fxStar(hx+rnd(-1,1),hy+rnd(-1,1),hz,1.8,C.cyan,0.1);fxBlobs(hx,hy,hz,3,7,C.ink,0.16)}
if(isCli()){net.dacc[e.id]=(net.dacc[e.id]||0)+dmg;return}e.hp-=dmg;if(e.hp<=0)kill(e,pl.slot)}
function killFx(e){const mine=!net.on||e.mine>now-0.7,y=e.type==='lan'?e.y:e.type==='bru'?1.6:0.6;
if(mine){G.combo++;G.maxc=Math.max(G.maxc||0,G.combo);G.comboT=2.6;G.comboPop=0.3;addGauge(({imp:6,lan:8,bru:25})[e.type])}
if(e.type==='imp'){if(e.v)explode(e.x,0.8,e.z,1.6);else{fxStar(e.x,y,e.z,2.8,C.white,0.1);fxBall(e.x,y,e.z,1.9,C.ink,0.3);fxBlobs(e.x,y,e.z,14,7,C.ink,0.2);fxSmoke(e.x,y,e.z,4,0.8,C.smoke,2);fxRing(e.x,0.1,e.z,3.2,C.white,0.25);if(!pl.sp||lim('spx',0.5))sideText(pick(['ドシャッ','グシャ！','バシュッ']),e,{size:58,st:'ink',life:0.5});snd('kill');stopT(0.05);shake(0.2)}}
else if(e.type==='lan')explode(e.x,y,e.z,1.1);else{explode(e.x,1.8,e.z,2.3,{text:'ズドォォン！'});fxBlobs(e.x,1.5,e.z,20,10,C.ink,0.25);stopT(0.12);invA=1}
for(let i=0;i<(e.type==='bru'?8:3);i++)fxOrb(e.x,y,e.z)}
function kill(e,by){if(e.type==='boss'){if(e.st!=='die'){e.st='die';e.stT=0;e.hp=0;e.ah=-1;stopT(0.25);G.kcT=0;musOn=0;invA=1;for(const o of enemies)if(o!==e&&!o.dead)kill(o,by);shots.length=0}return}
if(e.dead)return;e.dead=true;G.kills++;if(by>=0)G.pk[by]++;G.score+=({imp:100,lan:150,bru:500})[e.type]*(10+Math.min(G.combo,10))/10|0;killFx(e);
if(boss===null&&Math.random()<(e.type==='bru'?1:0.12))spawnItem((Math.random()*3)|0,e.x,e.z);
if(e.v){areaHurt(e.x,e.z,2.8,14);for(const o of enemies)if(!o.dead&&o.type!=='boss'&&Math.hypot(o.x-e.x,o.z-e.z)<3.8){o.hp-=70;o.flash=0.1;if(o.hp<=0)kill(o,by)}}}
function spawnFx(e){if(e.type==='lan'){fxSmoke(e.x,e.y,e.z,5,0.9,C.smoke,2);fxStar(e.x,e.y,e.z,2,C.white,0.1)}else{decals.push({x:e.x,z:e.z,r:e.type==='bru'?4.5:2.4,life:2.5});fxBlobs(e.x,0.2,e.z,8,6,C.ink,0.16);fxRing(e.x,0.1,e.z,e.type==='bru'?6:3.5,C.purple,0.4)}
if(lim('spawnT',0.5)){sfxAt(pick(['ヌッ','ボコッ','ズズ…']),e.x,3,e.z,{size:46,st:'ink',life:0.5});snd('spawn')}}
function mkEnemy(type,x,z,v){T=pickT(x,z);const e={id:++eidN,type,v:v||0,x,y:0,z,yaw:Math.atan2(T.x-x,T.z-z),t:rnd(0,9),st:'spawn',stT:0,flash:0,dead:false,seed:rnd(0,100),kx:0,kz:0,sc:1,cd:2,mine:-9};
if(type==='imp'){e.hp=v?30:40;e.sc=rnd(0.9,1.2);e.spd=v?rnd(5.4,6):rnd(3.6,4.8);e.r=0.55}else if(type==='lan'){e.hp=40;e.y=e.by=rnd(2.6,4.6);e.oa=Math.atan2(x-T.x,z-T.z);e.dir=Math.random()<.5?-1:1;e.oR=rnd(8,13);e.cd=rnd(1.2,2.8);e.r=0.6}else{e.hp=340;e.r=1.1;e.cd=1.5}
e.hp*=1+0.55*(G.np-1);enemies.push(e);spawnFx(e);return e}
function spawnNear(type,tries){T=pickR();let bx=0,bz=0,bs=-1e9;for(let i=0;i<(tries||10);i++){const a=T.yaw+PI+rnd(-1.5,1.5),d=rnd(9,17),x=clamp(T.x+Math.sin(a)*d,-BX+2.6,BX-2.6),z=clamp(T.z+Math.cos(a)*d,boss?-9:BZ0+2.6,BZ1-2.6);let s=0;for(const p of allP())s+=Math.min(12,Math.hypot(x-p.x,z-p.z));for(const e of enemies)s+=Math.min(3,Math.hypot(e.x-x,e.z-z));for(const c of colC)if(Math.hypot(c.x-x,c.z-z)<c.r+1.2)s-=50;if(s>bs){bs=s;bx=x;bz=z}}return type==='bom'?mkEnemy('imp',bx,bz,1):mkEnemy(type,bx,bz)}
function popShot(s){if(s.dead)return;s.dead=true;if(s.k===1)explode(s.x,s.y,s.z,1.2,{ink:1});else{fxStar(s.x,s.y,s.z,1.3,C.white,0.08);fxBlobs(s.x,s.y,s.z,6,5,C.ink,0.14)}}
function updateShots(dt){for(let i=shots.length-1;i>=0;i--){const s=shots[i];if(s.dead){shots.splice(i,1);continue}s.life-=dt;s.vy-=s.g*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;
if(s.k===0){let hit=null;for(const p of allP())if(Math.hypot(s.x-p.x,s.y-p.y-1.1,s.z-p.z)<s.r+0.55)hit=p;if(hit){hurtT(hit,s.dmg,s.x,s.z);popShot(s)}else if(s.y<0.1||s.life<=0||Math.abs(s.x)>22||s.z>22||s.z<-26)popShot(s)}
else if(s.y<0.35){s.dead=true;ev('bomb',r1(s.x),r1(s.z));areaHurt(s.x,s.z,3.4,s.dmg)}}}
function bossIntro(){G.cine=3.2;cutBoss=3.2;musOn=2;snd('roar')}
function spawnBoss(){const b={id:++eidN,type:'boss',x:0,y:0,z:-21.5,yaw:0,t:0,st:'rise',stT:0,flash:0,dead:false,seed:1,mine:-9,hp:(G.demoOn?3000:STG[G.stage].hard?4400:3600)*(1+0.8*(G.np-1)),yo:-38,hx:0,phase:1,atk:0,r:6,hL:restH(-1,-38),hR:restH(1,-38),mouth:0,cdT:1,ah:-1,tx:0,tz:0,vn:0,sm:false,s0:null,ti:null};
b.mhp=b.hp;enemies.push(b);boss=b;bossIntro();return b}
function bossCos(b,dt){b.t+=dt;b.stT+=dt;b.flash-=dt;b.hx=Math.sin(b.t*0.9)*0.3;G.mood=Math.min(1,G.mood+dt*0.5);
if(b.st==='rise'){trauma=Math.max(trauma,0.3);if(lim('gogo',0.45))addText('ゴゴゴゴ',rnd(220,W-220),rnd(110,300),{size:84,st:'ink',life:0.9,grow:0.12});if(lim('risefx',0.12))fxBlobs(rnd(-7,7),0.3,-18.5,3,9,C.ink,0.3)}
else if(b.st==='die')bossDieFx(b)}
// boss defeat: a few spaced pops while the boss trembles, then one big burst (bossEnd) at BDIE_END
const BDIE_POPS=[[0.3,-5,24,3.2],[0.7,5,15,3],[1.05,-3,25,3.4],[1.35,3,20,3.6]],BDIE_END=1.85;
function bossDieFx(b){b.pops=b.pops||0;for(let i=0;i<BDIE_POPS.length;i++){const q=BDIE_POPS[i];if(b.stT>=q[0]&&!(b.pops&(1<<i))){b.pops|=1<<i;const x=q[1]+rnd(-1.5,1.5),y=q[2]+b.yo+rnd(-2,2),z=-15.5;explode(x,y,z,q[3],{ink:1,quiet:1});sfxAt(i%2?'ボンッ':'バンッ',x,y+3,z,{size:90,st:'boom',life:0.45});snd('boom',0.8);flash(0.35);shake(0.5);b.flash=0.08}}
 if(b.stT>1.4)b.flash=Math.sin(b.stT*48)>0?0.03:0;trauma=Math.max(trauma,b.stT>1.4?0.45:0.12)}
// ---- shared FX events (host runs + broadcasts, clients replay) ----
const FXE={
bomb(x,z){explode(x,0.6,z,1.6,{ink:1,text:'ドォン！'});decals.push({x,z,r:3,life:6})},
slam(x,z){explode(x,0.8,z,2.4,{ink:1,text:'ドゴォォン！'});fxRing(x,0.1,z,14,C.white,0.4);decals.push({x,z,r:5,life:7});shocks.push({x,z,r:1.5,v:12,max:STG[G.stage].hard?30:24,d:12,hit:false});if(STG[G.stage].hard)shocks.push({x,z,r:-4,v:12,max:30,d:12,hit:false})},
smash(x,z){fxRing(x,0.1,z,8,C.white,0.3);fxSmoke(x,0.3,z,5,1,C.smoke,4);fxStar(x,0.6,z,3.5,C.yellow,0.1);shake(0.4);stopT(0.05);snd('boom',0.7);sfxAt('ドゴォ！',x,3.4,z,{size:66,st:'boom',life:0.6})},
stun(x,z){fxStar(x,2,z,4,C.white,0.12);shake(0.45);stopT(0.06);sfxAt('ガァン！',x,4.4,z,{size:70,st:'boom',life:0.6});snd('boom',0.6)},
roar(k){snd('roar');addText(k?'グオオオオ！':'グオオオ！',W/2,150,{size:k?100:86,st:'hurt',life:1.1});shake(0.6);if(k)invA=1},
ban(ch,name){G.banner={ch,name};G.bannerT=0;snd('ui')},
say(a,b,who){say(b?[a,b]:[a],who)},
txt(s,x,y,z,size,st){sfxAt(s,x,y,z,{size,st,life:0.7})},
heal(){if(!pl.dead)pl.hp=Math.min(SK.hp,pl.hp+30*SK.heal)},
bossEnd(){for(let i=0;i<5;i++)explode(rnd(-9,9),rnd(8,30),-19+rnd(-2,2),rnd(2.5,4),{quiet:1,ink:1});explode(0,22,-18.5,8,{text:'ドォォォォン！'});invA=1;flash(1);stopT(0.25);for(let i=0;i<24;i++)fxOrb(rnd(-6,6),rnd(10,26),-18)}};
function ev(n,...a){FXE[n](...a);if(net.on&&net.host)net.evq.push([++net.evseq,n,a,now])}
function updateShocks(dt){for(let i=shocks.length-1;i>=0;i--){const s=shocks[i];s.r+=s.v*dt;if(s.r>0&&!s.hit&&!pl.dead&&Math.abs(Math.hypot(pl.x-s.x,pl.z-s.z)-s.r*0.97)<0.8&&pl.y<0.55){s.hit=true;hurtPlayer(s.d,s.x,s.z)}if(s.r>s.max)shocks.splice(i,1)}}
// ---- items ----
function spawnItem(k,x,z){items.push({id:++eidN,k,x,z,t:0});fxStar(x,1,z,2,C.white,0.12)}
function updateItems(dt){G.itemT-=dt;if(G.itemT>0)return;G.itemT=rnd(9,14)/(G.mode==='pvp'?1.5:1);if(items.length>=3+(G.np>2?1:0))return;let x=0,z=0;for(let i=0;i<14;i++){x=rnd(-BX+3.6,BX-3.6);z=rnd(boss?-8:BZ0+5.6,BZ1-3.6);let ok=true;for(const c of colC)if(Math.hypot(c.x-x,c.z-z)<c.r+1.5)ok=false;for(const b of colB)if(x>b.x0-1.5&&x<b.x1+1.5&&z>b.z0-1.5&&z<b.z1+1.5)ok=false;if(ok)break}
let low=false;for(const p of allP())if(p.hp<55)low=true;spawnItem(low&&Math.random()<0.6?0:(Math.random()*3)|0,x,z)}
function pickItems(dt){for(let i=items.length-1;i>=0;i--){const it=items[i];it.t+=dt;if(pl.dead||G.state!=='play'&&!G.demoOn||Math.hypot(pl.x-it.x,pl.z-it.z)>1.6||pl.y>2.2)continue;items.splice(i,1);if(isCli()){net.q.pk.push(it.id);net.picked[it.id]=1}
fxStar(it.x,1.2,it.z,3,C.white,0.12);fxRing(it.x,0.1,it.z,4,C.yellow,0.3);snd('item');flash(0.15);
if(it.k===0){pl.hp=Math.min(SK.hp,pl.hp+40*SK.heal);addText('カイフク！',W/2,H*0.36,{size:76,st:'cyan',life:0.8,rot:-0.06})}else if(it.k===1){pl.pow=SK.pow;addText('パワー！',W/2,H*0.36,{size:84,st:'boom',life:0.8,rot:-0.06})}else{pl.gauge=Math.min(100,pl.gauge+50);addText('キラッ',W/2,H*0.36,{size:76,st:'fire',life:0.8,rot:-0.06})}}}
// ---- draw: heroes, items, shockwaves ----
function drawHero(o){const c=PCOL[o.slot],wk=Math.sin(o.wt*11)*o.mv;mPush();mT(o.x,o.y,o.z);mRY(o.yaw+PI);if(o.dead){mT(0,0.3,0);mRX(-1.45)}gTint=o.flash>0?1:0;
for(const d of[-1,1]){put(CYL,d*0.17,0.44,0,d*wk*0.7,0,0,0.25,0.88,0.25,C.navy);box(d*0.17,0.06,0.06+d*wk*0.15,0.26,0.12,0.42,C.inkD)}
box(0,1.14,0,0.64,0.68,0.38,c);box(0,0.84,0,0.66,0.1,0.4,C.inkD);box(0,1.2,0.2,0.2,0.5,0.04,C.white);box(0,1.45,0,0.52,0.13,0.44,C.white);put(BOX,0.12,1.42,-0.38,0.5+wk*0.3,0,0,0.16,0.08,0.6,C.white);
sph(0,1.72,0,0.46,0.48,0.46,C.skinH);sph(0,1.82,-0.06,0.52,0.4,0.5,C.inkD);for(let i=0;i<3;i++)put(CONE,(i-1)*0.16,2.0,0.1,0.9,0,-(i-1)*0.4,0.18,0.34,0.18,C.inkD);
for(const d of[-1,1])box(d*0.1,1.72,0.21,0.07,0.1,0.05,C.inkD);box(0,1.9,0.16,0.5,0.07,0.2,c);
mPush();mT(0,1.3,0.12);mRX(-o.pitch);put(BOX,0.3,0,0.3,0,0,0,0.17,0.17,0.62,c);put(BOX,-0.24,0,0.3,0,0.5,0,0.17,0.17,0.56,c);box(0.22,0.06,0.78,0.1,0.16,0.5,C.gunM);put(CYL,0.22,0.1,1.1,PI/2,0,0,0.08,0.3,0.08,C.gunD);put(CONE,0.22,0.1,1.3,PI/2,0,0,0.1,0.14,0.1,C.gold);
o.gx=M[0]*0.22+M[4]*0.1+M[8]*1.4+M[12];o.gy=M[1]*0.22+M[5]*0.1+M[9]*1.4+M[13];o.gz=M[2]*0.22+M[6]*0.1+M[10]*1.4+M[14];mPop();gTint=0;mPop();
if(o.fireT>0){bill(BURST,o.gx,o.gy,o.gz,0.7,now*30,C.yellow,F_UNLIT|F_NOCAST);bill(STAR,o.gx,o.gy,o.gz,0.36,0,C.white,F_UNLIT|F_NOCAST)}
if(o.sp){const cp=Math.cos(o.pitch),dx=-Math.sin(o.yaw)*cp,dy=Math.sin(o.pitch),dz=-Math.cos(o.yaw)*cp;mPush();mT(o.gx+dx*45,o.gy+dy*45,o.gz+dz*45);orient(dx,dy,dz);mRX(PI/2);mS(1.3,90,1.3);emit(CYL,C.white,0,0,F_UNLIT|F_NOCAST,0);mPop();bill(BURST,o.gx,o.gy,o.gz,2.4,now*25,C.cyan,F_UNLIT|F_NOCAST)}}
function drawExtra(){const NF=F_UNLIT|F_NOCAST;for(const o of others)drawHero(o);
for(const it of items){const y=1.05+Math.sin(it.t*3)*0.15,col=[C.heart,C.orange,C.cyan][it.k],rs=1.7+Math.sin(it.t*5)*0.15,sc=Math.min(1,it.t*4);put(RING,it.x,0.12,it.z,0,0,0,rs,1,rs,col,0,0,NF);
mPush();mT(it.x,y,it.z);mRY(it.t*2.2);mS(sc,sc,sc);if(it.k===0){sph(-0.19,0.1,0,0.46,0.46,0.34,C.heart,0,1);sph(0.19,0.1,0,0.46,0.46,0.34,C.heart,0,1);put(CONE,0,-0.2,0,PI,0,0,0.7,0.56,0.34,C.heart,0,1)}
else if(it.k===1){put(SPIKE,0,0,0,it.t*3,0,0,0.9,0.9,0.9,C.orange,0,0,F_UNLIT);put(SPIKE,0,0,0,0,it.t*4,0.6,0.55,0.55,0.55,C.yellow,0,0,F_UNLIT)}
else{cyl(0,-0.06,0,0.46,0.5,0.46,C.cyan,0,1);cyl(0,0.26,0,0.22,0.18,0.22,C.white);sph(0,0.4,0,0.2,0.16,0.2,C.woodD)}mPop();
bill(STAR,it.x+Math.sin(it.t*4)*0.5,y+0.5,it.z+Math.cos(it.t*4)*0.5,0.22,it.t*5,C.white,NF)}
for(const s of shocks)if(s.r>0.5){put(RING2,s.x,0.16,s.z,0,0,0,s.r*2,1,s.r*2,C.red,0,0,NF);put(RING2,s.x,0.18,s.z,0,0,0,s.r*2-1.4,1,s.r*2-1.4,C.white,0,0,NF)}}
