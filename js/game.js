'use strict';
// ================= GAME FLOW =================
const balloons=[],wipe={on:false,t:0,cb:null,done:false};
function say(lines,who){balloons.push({lines,who,t:0,life:2.6});if(balloons.length>2)balloons.shift()}
function startWipe(cb){if(wipe.on)return;wipe.on=true;wipe.t=0;wipe.cb=cb;wipe.done=false}
// ---- demo (attract mode) ----
const D={seg:-1,t:0,q:[]},ai={st:1,stT:0};
const DEMO=[
{cap:'墨鬼、襲来！',dur:8.5,init(){resetPlayer(0,13,0);for(let i=0;i<6;i++)mkEnemy('imp',rnd(-9,9),rnd(-8,2));D.q=[{t:3,f(){for(let i=0;i<5;i++)spawnNear('imp')}}]}},
{cap:'化け提灯、乱舞！',dur:9,init(){resetPlayer(-11,11,-0.7);pl.pitch=0.2;for(let i=0;i<5;i++)mkEnemy('lan',rnd(-4,12),rnd(-8,6));for(let i=0;i<3;i++)mkEnemy('imp',rnd(-4,6),rnd(-2,6));D.q=[{t:2.5,f(){inp.dash=true}},{t:4,f(){for(let i=0;i<3;i++)spawnNear('lan')}},{t:6,f(){inp.dash=true}}]}},
{cap:'鎧鬼、突撃！',dur:10.5,init(){resetPlayer(9,8,0.6);mkEnemy('bru',-4,-9);for(let i=0;i<4;i++)mkEnemy('imp',rnd(-10,4),rnd(-10,0));D.q=[{t:5,f(){pl.gauge=100}}]}},
{cap:'最終決戦！大墨魔王',dur:42,init(){resetPlayer(0,11,0);spawnBoss();D.q=[{t:9,f(){pl.gauge=100}},{t:19,f(){pl.gauge=100}},{t:27,f(){pl.gauge=100;if(boss)boss.hp=Math.min(boss.hp,600)}}]}}];
function demoNext(){D.seg++;D.t=0;enemies.length=0;shots.length=0;boss=null;G.mood=0;G.endT=-1;const s=DEMO[D.seg];s.init();G.banner={ch:'HIGHLIGHT '+(D.seg+1),name:s.cap};G.bannerT=0}
function demoStart(){G.stage=(G.demoN++)%2;setStage(G.stage);G.mode='solo';G.np=1;pl.slot=0;resetWorld();G.demoOn=true;D.seg=-1;sndVol=0.3;demoNext()}
function demoStop(){resetWorld();G.demoOn=false;G.idle=0;sndVol=1}
function demoUpdate(dt){D.t+=dt;while(D.q.length&&D.t>=D.q[0].t)D.q.shift().f();const s=DEMO[D.seg];
if(D.seg<3){if(D.t>s.dur)startWipe(demoNext)}else if(G.endT>=0){G.endT+=RDT;if(G.endT>3.6)startWipe(demoStop)}else if(D.t>s.dur)startWipe(demoStop)}
function aiControl(dt){let tgt=null,best=1e9,tp=null;const ox=pl.x,oy=1.62,oz=pl.z;
for(const e of enemies){if(e.dead||e.st==='spawn'||(e.type==='boss'&&(e.st==='rise'||e.st==='die')))continue;const s=spheres(e),p=e.type==='boss'?s[(e.t%6<4.2)?0:1]:s[s.length-1],dx=p[0]-ox,dy=p[1]-oy,dz=p[2]-oz,d=Math.hypot(dx,dz),a=Math.abs(angDiff(Math.atan2(-dx,-dz),pl.yaw)),sc=d+a*5-(e.type==='bru'?4:0)+(e.type==='boss'?6:0);if(sc<best){best=sc;tgt=e;tp=[dx,dy,dz,d]}}
for(const s of shots)if(s.k===1){const dx=s.x-ox,dy=s.y-oy,dz=s.z-oz,d=Math.hypot(dx,dz);if(d<14&&d-3<best){best=d-3;tgt=s;tp=[dx,dy,dz,d]}}
let wy=boss?0:pl.yaw,wp=0.05;if(tp){wy=Math.atan2(-tp[0],-tp[2]);wp=Math.atan2(tp[1],tp[3])}
const dyaw=angDiff(wy,pl.yaw),dp=wp-pl.pitch,k=1-Math.exp(-dt*10);if(G.cine<=0){pl.yaw+=clamp(dyaw*k,-4.5*dt,4.5*dt);pl.pitch+=clamp(dp*k,-3.5*dt,3.5*dt)}
inp.fire=!!tgt&&Math.abs(dyaw)<0.09&&Math.abs(dp)<0.09;
ai.stT-=dt;if(ai.stT<=0){ai.st=-ai.st;ai.stT=rnd(0.8,1.9)}let mx=ai.st*0.85,mz=0;const nd=tp?tp[3]:20;
if(tgt&&tgt.type==='imp'||tgt&&tgt.type==='bru'){if(nd<7)mz=-1;else if(nd>13)mz=0.7}
let cd=99;for(const e of enemies)if(e.type==='imp'||e.type==='bru')cd=Math.min(cd,Math.hypot(e.x-ox,e.z-oz));if(cd<5.5)mz=-1;
const sy=Math.sin(pl.yaw),cy=Math.cos(pl.yaw),wx=-sy*mz+cy*mx,wz=-cy*mz-sy*mx,nx=pl.x+wx*3,nz=pl.z+wz*3,lz0=boss?-7:-21;
if(Math.abs(nx)>17||nz>18||nz<lz0){const cxv=-pl.x,czv=(boss?5:0)-pl.z,l=Math.hypot(cxv,czv)||1,tx=cxv/l,tz=czv/l;mx=tx*cy-tz*sy;mz=-tx*sy-tz*cy;ai.st=mx>0?1:-1;ai.stT=1}
inp.mx=mx;inp.mz=mz;let dz_=false;
for(const e of enemies){if(e.type==='bru'&&e.st==='charge'&&Math.hypot(e.x-ox,e.z-oz)<8)dz_=true;if(e.type==='imp'&&e.st==='wind'&&Math.random()<dt*3)dz_=true}
if(boss&&boss.st==='up'&&boss.stT>0.4&&Math.hypot(boss.tx-ox,boss.tz-oz)<5.5)dz_=true;for(const s of shots)if(s.k===1&&Math.hypot(s.tx-ox,s.tz-oz)<3.8&&s.y<6&&s.vy<0)dz_=true;
if(dz_&&pl.dashCd<=0){inp.dash=true;if(Math.abs(inp.mx)<0.3)inp.mx=ai.st}
if(pl.gauge>=100&&tgt&&Math.abs(dyaw)<0.12&&(tgt.type==='bru'||tgt.type==='boss'||enemies.length>=3))inp.special=true;if(pl.ammo<=0)inp.reload=true;for(const s of shocks){const dd=Math.hypot(pl.x-s.x,pl.z-s.z)-s.r;if(dd>0&&dd<2.8)inp.jump=true}}
// ================= INPUT =================
function evPos(t){const r=uic.getBoundingClientRect();return{x:(t.clientX-r.left)/r.width*W,y:(t.clientY-r.top)/r.height*H}}
addEventListener('mouseup',()=>{mouseFire=false;if(layEdit)layUp('m')});addEventListener('mousemove',e=>{if(layEdit&&!touchMode)layMove(evPos(e),'m')});uic.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousemove',e=>{if(touchMode||G.state!=='play')return;if(document.pointerLockElement===uic||mouseFire){inp.lx+=(e.movementX||0)*0.0024*SET.sens;inp.ly+=(e.movementY||0)*0.0024*SET.sens*SET.inv}});
addEventListener('keyup',e=>{keys[e.code]=false});
// ================= UI =================
const FONT='"Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic","YuGothic","Meiryo","Noto Sans JP","Noto Sans CJK JP","IPAGothic",sans-serif',INK='#16121f';
function txt(s,x,y,size,fill,st,lw,al,st2,lw2){ctx.font='900 '+size+'px '+FONT;ctx.textAlign=al||'center';ctx.textBaseline='middle';ctx.lineJoin='round';if(st2){ctx.strokeStyle=st2;ctx.lineWidth=lw2;ctx.strokeText(s,x,y)}if(st){ctx.strokeStyle=st;ctx.lineWidth=lw;ctx.strokeText(s,x,y)}ctx.fillStyle=fill;ctx.fillText(s,x,y)}
function vtxt(lines,cx,cy,size,fill){ctx.font='900 '+size+'px '+FONT;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=fill;const n=lines.length;lines.forEach((ln,li)=>{const x=cx+((n-1)/2-li)*size*1.2,ch=[...ln],y0=cy-(ch.length-1)*size/2;ch.forEach((c,i)=>{const y=y0+i*size;if('ー…〜'.includes(c)){ctx.save();ctx.translate(x,y);ctx.rotate(PI/2);ctx.fillText(c,0,0);ctx.restore()}else if('ッャュョァィゥェォ、。'.includes(c))ctx.fillText(c,x+size*0.1,y-size*0.1);else ctx.fillText(c,x,y)})})}
const dotC=document.createElement('canvas');dotC.width=dotC.height=8;{const c=dotC.getContext('2d');c.fillStyle=INK;c.beginPath();c.arc(2,2,1.4,0,TAU);c.fill();c.beginPath();c.arc(6,6,1.4,0,TAU);c.fill()}const dotPat=ctx.createPattern(dotC,'repeat');
function para(x,y,w,h,sk){ctx.beginPath();ctx.moveTo(x+sk,y);ctx.lineTo(x+w+sk,y);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath()}
function gauge(x,y,w,h,v,col,label){const sk=h*0.5;para(x+4,y+5,w,h,sk);ctx.fillStyle=INK;ctx.fill();para(x,y,w,h,sk);ctx.fillStyle='#fff';ctx.fill();ctx.fillStyle=dotPat;ctx.fill();
if(v>0.005){para(x,y,w*v,h,sk);ctx.fillStyle=col;ctx.fill();para(x+2,y+2,w*v-2,h*0.36,sk*0.36);ctx.fillStyle='rgba(255,255,255,.45)';ctx.fill()}para(x,y,w,h,sk);ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.lineJoin='miter';ctx.stroke();
para(x-62,y-3,64,h+6,sk);ctx.fillStyle=INK;ctx.fill();txt(label,x-26,y+h/2+1,h*0.72,'#fff')}
function burstPath(cx,cy,rx,ry,n,k,seed){const r=mulberry(seed);ctx.beginPath();for(let i=0;i<n*2;i++){const a=i/(n*2)*TAU,q=i%2?1:k+r()*0.12;const x=cx+Math.cos(a)*rx*q,y=cy+Math.sin(a)*ry*q;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath()}
function drawBalloon(b){const a=sat(b.t/0.12)*sat((b.life-b.t)/0.15);if(a<=0)return;const bs=b.who===1,size=bs?34:30,n=b.lines.length,ml=Math.max.apply(null,b.lines.map(l=>[...l].length)),w=n*size*1.2+60,h=ml*size+66,cx=bs?W-170:160,cy=bs?230:330;
ctx.save();ctx.translate(cx,cy);ctx.scale(0.6+0.4*easeBack(a),0.6+0.4*easeBack(a));ctx.globalAlpha=a;ctx.lineJoin='miter';ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.fillStyle='#fff';
if(bs){burstPath(0,0,w/2,h/2,18,1.25,5);ctx.fill();ctx.stroke()}else{ctx.beginPath();ctx.moveTo(-14,h/2-8);ctx.lineTo(-34,h/2+36);ctx.lineTo(18,h/2-8);ctx.stroke();ctx.beginPath();ctx.ellipse(0,0,w/2,h/2,0,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-12,h/2-10);ctx.lineTo(-31,h/2+30);ctx.lineTo(15,h/2-10);ctx.fill()}
vtxt(b.lines,0,0,size,bs?'#c20020':INK);ctx.restore()}
function drawBanner(){const b=G.banner,t=G.bannerT;if(!b||t>2.6)return;const u=t<0.25?easeOut(t/0.25):t>2.3?1-(t-2.3)/0.3:1;ctx.save();ctx.translate(W/2,G.demoOn?545:250);ctx.rotate(-0.04);ctx.translate((1-u)*(t<1?900:-900),0);
const sc=G.demoOn?0.7:1;ctx.scale(sc,sc);para(-470,-52,900,104,40);ctx.fillStyle=INK;ctx.fill();para(-462,-44,884,88,34);ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();
para(-440,-34,190,68,26);ctx.fillStyle='#ffd91a';ctx.fill();txt(b.ch,-332,2,b.ch.length>5?26:40,INK);txt(b.name,-225,2,b.name.length>9?46:56,'#fff',null,0,'left');ctx.restore()}
function drawCross(){const g=6+pl.rec*10,cx=W/2,cy=H/2;ctx.lineCap='butt';for(const[col,lw]of[[INK,7],['#fff',3]]){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){ctx.moveTo(cx+dx*g,cy+dy*g);ctx.lineTo(cx+dx*(g+13),cy+dy*(g+13))}ctx.stroke()}
ctx.fillStyle=INK;ctx.fillRect(cx-3,cy-3,6,6);ctx.fillStyle='#fff';ctx.fillRect(cx-1.5,cy-1.5,3,3);
if(hitMark>0){ctx.strokeStyle=hitCrit?'#ffd91a':'#fff';ctx.lineWidth=5;ctx.beginPath();for(const[dx,dy]of[[1,1],[-1,1],[1,-1],[-1,-1]]){ctx.moveTo(cx+dx*12,cy+dy*12);ctx.lineTo(cx+dx*26,cy+dy*26)}ctx.strokeStyle=INK;ctx.lineWidth=9;ctx.stroke();ctx.strokeStyle=hitCrit?'#ffd91a':'#fff';ctx.lineWidth=4;ctx.stroke()}}
function drawHUD(){if(SK.rev&&!pl.revU){para(392,662,86,26,8);ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();txt('復活×1',438,676,17,INK)}
gauge(100,30,300,30,pl.hp/SK.hp,pl.hp>50?'#35d06a':pl.hp>25?'#ffc21a':'#ff3b30','HP');const full=pl.gauge>=100;gauge(100,74,210,20,pl.gauge/100,full?(Math.sin(now*14)>0?'#fff':'#35e0ff'):'#35b8ff','必殺');
if(full){ctx.save();ctx.translate(372,84);ctx.rotate(-0.1);const s=1+0.12*Math.sin(now*10);ctx.scale(s,s);burstPath(0,0,56,26,10,1.3,3);ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();txt('OK!!',0,1,24,INK);ctx.restore()}
txt('撃破',W-150,40,22,'#fff',INK,6,'right');txt(String(G.kills),W-40,40,44,'#ffd91a',INK,8,'right');txt(String(G.score).padStart(6,'0'),W-40,82,26,'#fff',INK,6,'right');
if(G.combo>=2){const s=1+Math.max(0,G.comboPop)*1.2;ctx.save();ctx.translate(W-110,128);ctx.rotate(-0.1);ctx.scale(s,s);txt(G.combo+'連撃!',0,0,38,'#ff3b30',INK,8,'center','#fff',14);ctx.restore()}
if(boss&&boss.st!=='rise'&&!(boss.monk&&boss.st==='drop')){const v=sat(boss.hp/boss.mhp);gauge(480,28,520,24,v,boss.phase>1?'#ff3b30':'#a04cff',boss.monk?'ボス':'魔王');txt(STG[G.stage].boss,740,70,22,'#fff',INK,6);
 if(boss.monk&&boss.phase<2){gauge(560,92,300,16,sat(boss.bhp/boss.bmax),boss.bflash>0?'#fff':'#ffc21a','鐘');txt('背中の鐘を撃て！',W/2,132,20,'#fff',INK,5)}}
// ammo
const na=SK.mag,st=Math.min(18,288/na),iw=st*0.67,bx=W/2-na*st/2;for(let i=0;i<na;i++){const x=bx+i*st,y=676,on=i<pl.ammo;ctx.beginPath();ctx.moveTo(x+iw/2,y-14);ctx.lineTo(x+iw,y-2);ctx.lineTo(x+iw,y+12);ctx.lineTo(x,y+12);ctx.lineTo(x,y-2);ctx.closePath();ctx.fillStyle=on?'#ffd91a':'rgba(22,18,31,.35)';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke()}
if(pl.reload>0&&Math.sin(now*20)>-0.3)txt('装填中…',W/2,640,26,'#fff',INK,6);
drawCross()}
function drawTouch(){if(!hasTouch)return;ctx.save();ctx.globalAlpha=0.8;const sx=touch.ox,sy=touch.oy;ctx.beginPath();ctx.arc(sx,sy,78,0,TAU);ctx.fillStyle='rgba(255,255,255,.28)';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();
ctx.beginPath();ctx.arc(sx+touch.dx*70,sy+touch.dy*70,36,0,TAU);ctx.fillStyle='#fff';ctx.fill();ctx.stroke();ctx.fillStyle=dotPat;ctx.fill();
for(const k in BTN){const b=BTN[k];let held=false;for(const id in touch.hold)if(touch.hold[id]===k)held=true;const r=b.r*(held?0.9:1);ctx.beginPath();ctx.arc(b.x+4,b.y+6,r,0,TAU);ctx.fillStyle=INK;ctx.fill();ctx.beginPath();ctx.arc(b.x,b.y,r,0,TAU);
let col='#fff';if(k==='fire')col='#ff4a3d';else if(k==='special')col=pl.gauge>=100?(Math.sin(now*14)>0?'#ffd91a':'#35e0ff'):'#b9c2d6';else if(k==='dash')col=pl.dashCd>0?'#b9c2d6':'#7fd6ff';ctx.fillStyle=col;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();
if(k==='special'&&pl.gauge<100){ctx.beginPath();ctx.arc(b.x,b.y,r-8,-PI/2,-PI/2+TAU*pl.gauge/100);ctx.strokeStyle='#35b8ff';ctx.lineWidth=8;ctx.stroke()}
txt(b.l,b.x,b.y+2,k==='fire'?70:b.l.length>1?b.r*0.62:40,k==='fire'?'#fff':INK,k==='fire'?INK:null,8)}ctx.restore()}
const logoL=layout('コマブレイカー',128,0.0,false);logoL.forEach((l,i)=>{l.y=Math.sin(i*1.3)*8;l.r=(i%2?0.05:-0.05)});
function drawLogo(cx,cy,sc){ctx.save();ctx.translate(cx,cy);ctx.scale(sc,sc);ctx.rotate(-0.05);
burstPath(0,10,520,165,22,1.22,9);ctx.fillStyle=INK;ctx.fill();burstPath(-8,0,520,165,22,1.22,9);ctx.fillStyle='#fff';ctx.fill();ctx.save();ctx.clip();ctx.fillStyle=dotPat;ctx.globalAlpha=0.35;ctx.fillRect(-700,40,1400,300);ctx.restore();ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.lineJoin='miter';ctx.stroke();
ctx.save();ctx.translate(0,26);ctx.transform(1,0,-0.18,1,0,0);drawGlyphs(logoL,128,STY.logo,true);ctx.restore();
ctx.save();ctx.translate(-330,-84);ctx.rotate(-0.1);txt('激弾！',0,0,84,'#ff2e2e',INK,16,'center','#fff',28);ctx.restore();
para(40,112,430,40,16);ctx.fillStyle=INK;ctx.fill();txt('漫画世界ガンアクションＦＰＳ',262,133,24,'#fff');ctx.restore()}
let titleK=1;
function drawTitle(dt){titleK=lerp(titleK,G.demoOn?0:1,Math.min(1,dt*4));const k=titleK;
if(k>0.5){ctx.globalAlpha=(k-0.5)*2;focusLines(W/2,H*0.4,430,60,'rgba(255,255,255,.9)',((now*8)|0)+3);ctx.globalAlpha=1}
drawLogo(lerp(250,W/2,k),lerp(92,250,k),lerp(0.36,0.95,k));
if(G.demoOn){ctx.fillStyle=INK;ctx.fillRect(W-250,26,214,44);txt('DEMO PLAY',W-143,49,28,Math.sin(now*6)>0?'#ffd91a':'#fff')}
const p=1+0.05*Math.sin(now*6);ctx.save();ctx.translate(W/2,lerp(662,560,k));ctx.scale(p*lerp(0.8,1,k),p*lerp(0.8,1,k));burstPath(4,6,330,50,20,1.2,4);ctx.fillStyle=INK;ctx.fill();burstPath(0,0,330,50,20,1.2,4);ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();txt('画面をタップでスタート！',0,2,38,INK);ctx.restore();
if(k>0.6){ctx.globalAlpha=(k-0.6)*2.5;txt(hasTouch?'左スティック：移動　　右側ドラッグ：視点　　撃・必殺・跳・回避・装填ボタン':'WASD：移動　マウス：視点／射撃　SPACE：ジャンプ　SHIFT：回避　E：必殺　R：装填',W/2,668,20,'#fff',INK,6);
ctx.globalAlpha=1;gearBtn(W-86,24)}}
function drawCutSp(){const t=0.6-cutSp,u=t<0.1?t/0.1:cutSp<0.1?cutSp/0.1:1;ctx.save();ctx.translate(W/2,330);ctx.rotate(-0.07);const h=150*u;ctx.beginPath();ctx.rect(-800,-h,1600,h*2);ctx.fillStyle='#2f6fd8';ctx.fill();ctx.save();ctx.clip();
const r=mulberry(((now*14)|0)+5);ctx.fillStyle='#fff';for(let i=0;i<34;i++){const y=(r()*2-1)*150,x=(r()*2-1)*800,w=200+r()*600;ctx.fillRect(x,y,w,1.5+r()*4)}
ctx.translate(-250+t*60,10);ctx.fillStyle='#ffe2c6';ctx.beginPath();ctx.ellipse(0,10,330,210,0,0,TAU);ctx.fill();
ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-150,10);ctx.quadraticCurveTo(-10,-70,150,-20);ctx.quadraticCurveTo(40,70,-120,50);ctx.fill();
ctx.save();ctx.beginPath();ctx.moveTo(-150,10);ctx.quadraticCurveTo(-10,-70,150,-20);ctx.quadraticCurveTo(40,70,-120,50);ctx.clip();ctx.fillStyle='#ff9d00';ctx.beginPath();ctx.ellipse(12,-2,60,64,0,0,TAU);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.stroke();ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(12,0,24,32,0,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-12,-26,15,0,TAU);ctx.arc(34,18,7,0,TAU);ctx.fill();ctx.restore();
ctx.fillStyle=INK;ctx.beginPath();ctx.moveTo(-165,4);ctx.quadraticCurveTo(-20,-98,165,-34);ctx.quadraticCurveTo(-10,-62,-150,18);ctx.fill();ctx.beginPath();ctx.moveTo(-200,-66);ctx.lineTo(130,-128);ctx.lineTo(160,-100);ctx.lineTo(-185,-36);ctx.fill();
ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-110,54);ctx.quadraticCurveTo(10,76,130,40);ctx.stroke();ctx.restore();
ctx.strokeStyle=INK;ctx.lineWidth=8;ctx.strokeRect(-800,-h,1600,h*2);if(u>0.9){txt('必殺！',260,-38,96,'#ffd91a',INK,16,'center','#fff',28);txt('墨龍砲',300,62,84,'#fff',INK,16)}ctx.restore()}
function drawCutBoss(){const t=3.2-cutBoss,u=sat(t/0.25)*sat(cutBoss/0.3);ctx.fillStyle=INK;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W,0);ctx.lineTo(W,70*u);ctx.lineTo(0,130*u);ctx.fill();ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(W,H);ctx.lineTo(W,H-150*u);ctx.lineTo(0,H-90*u);ctx.fill();
if(t>0.5){const k=easeBack(sat((t-0.5)/0.25));ctx.save();ctx.translate(60,H-74);ctx.rotate(-0.045);ctx.scale(k,k);const bc=STG[G.stage].cut;if(bc[0])txt(bc[0],0,-10,54,'#fff',null,0,'left');txt(bc[1],bc[0]?250:0,-4,92,'#ff2e2e','#fff',10,'left');ctx.restore()}}
function drawWipe(){const t=wipe.t,c=easeOut(t<0.5?t*2:(1-t)*2);ctx.fillStyle=INK;const n=7,bw=W/n+60;for(let i=0;i<n;i++){const x=i*(W/n)-30,w=bw*c*1.02;ctx.beginPath();const o=t<0.5?0:bw-w;ctx.moveTo(x+o+70,-10);ctx.lineTo(x+o+w+70,-10);ctx.lineTo(x+o+w-70,H+10);ctx.lineTo(x+o-70,H+10);ctx.fill()}}
// ================= MAIN =================
function render3d(){beginDynamic();drawPetals(GDT);drawEnemies();drawExtra();drawTempleDoor(GDT);drawParts();if(!(G.state==='title'&&!G.demoOn)&&!(G.kcT>=0))drawGun();
gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.depthRange(0,1);
gl.bindFramebuffer(gl.FRAMEBUFFER,shFbo);gl.viewport(0,0,SHN,SHN);gl.clear(gl.DEPTH_BUFFER_BIT);gl.useProgram(pS.p);gl.uniformMatrix4fv(pS.u.uLVP,false,LVP);gl.uniform1f(pS.u.uT,now);flushLayer(0);flushLayer(1);
gl.bindFramebuffer(gl.FRAMEBUFFER,gFbo);gl.viewport(0,0,W,H);gl.clearBufferfv(gl.COLOR,0,[0,0,0,1]);gl.clearBufferfv(gl.COLOR,1,[0.5,0.5,0,0]);gl.clearBufferfv(gl.DEPTH,0,[1]);
gl.useProgram(pG.p);gl.uniformMatrix4fv(pG.u.uVP,false,VP);gl.uniform1f(pG.u.uT,now);gl.uniformMatrix4fv(pG.u.uLVP,false,LVP);gl.uniformMatrix4fv(pG.u.uV,false,VIEW);gl.uniform3f(pG.u.uLD,LD[0],LD[1],LD[2]);gl.uniform3f(pG.u.uCam,cam.x,cam.y,cam.z);
gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shTex);gl.uniform1i(pG.u.uSh,0);flushLayer(0);flushLayer(1);gl.depthRange(0,0.08);flushLayer(2);gl.depthRange(0,1);
gl.disable(gl.DEPTH_TEST);gl.bindVertexArray(quadVao);gl.bindFramebuffer(gl.FRAMEBUFFER,pFbo);gl.useProgram(pP.p);const u=pP.u;
gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,gCol);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,gNrm);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,gDep);
gl.uniform1i(u.uC,0);gl.uniform1i(u.uN,1);gl.uniform1i(u.uD,2);gl.uniform2f(u.uPx,1/W,1/H);const tn=Math.tan(cam.fov/2);gl.uniform2f(u.uTan,tn*W/H,tn);
let fx=0.5,fy=0.62;if(boss){const p=boss.monk?project(boss.x,boss.y+4.5,boss.z):project(0,26+boss.yo,-26);if(p){fx=p.x/W;fy=1-p.y/H}}gl.uniform2f(u.uFocus,fx,fy);
gl.uniform1f(u.uNear,NEAR);gl.uniform1f(u.uFar,FAR);gl.uniform1f(u.uTime,now);gl.uniform1f(u.uMood,G.mood);gl.uniform1f(u.uFlash,Math.min(1,flashA));gl.uniform1f(u.uInv,invA>0.3?1:0);gl.uniform1f(u.uMono,monoA);gl.uniform1f(u.uHurt,hurtA);const sg=STG[curStage];gl.uniform3fv(u.uS0,sg.s0);gl.uniform3fv(u.uS1,sg.s1);gl.uniform3fv(u.uS2,sg.s2);gl.uniform3fv(u.uFogC,sg.fog);gl.uniform3fv(u.uGrade,sg.grade);gl.uniform1f(u.uNight,sg.night);gl.uniform3fv(u.uShade,sg.shade||[0.50,0.46,0.74]);gl.uniform3fv(u.uFogR,sg.fogR||[45,420,0.8]);
gl.uniform3f(u.uCR,cR[0],cR[1],cR[2]);gl.uniform3f(u.uCU,cU[0],cU[1],cU[2]);gl.uniform3f(u.uCF,cF[0],cF[1],cF[2]);gl.drawArrays(gl.TRIANGLES,0,3);
gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.useProgram(pF.p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,pTex);gl.uniform1i(pF.u.uT,0);gl.uniform2f(pF.u.uPx,1/W,1/H);gl.drawArrays(gl.TRIANGLES,0,3);gl.bindVertexArray(null)}
let last=performance.now();
function frame(t){requestAnimationFrame(frame);const dt=Math.min(0.05,Math.max(0.001,(t-last)/1000));last=t;update(dt);render3d();drawUI(dt)}
window.__koma={net,others,items,shots,inp,netHost,netJoin,hostStart,beginGame,setStage,G,pl,startGame,startWave,demoStart,enemies,update,get boss(){return boss}};
ctx.fillStyle='#f6f1e4';ctx.fillRect(0,0,W,H);ctx.fillStyle='#241f40';ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.fillText('読み込み中…',W/2,H/2);
// start once the Blender-made stages have loaded (falls back to the code-built stage on failure)
stageReady.then(()=>{if(curStage>=0&&STAGE_GLB[curStage]){const n=curStage;curStage=-1;setStage(n)}requestAnimationFrame(frame)});
