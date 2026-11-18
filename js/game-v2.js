'use strict';
// ================= GAME FLOW (v2) =================
function resetWorld(){enemies.length=0;ices.length=0;templeDoor.t=templeDoor.target=0;G.kcP=null;shots.length=0;parts.length=0;decals.length=0;texts.length=0;balloons.length=0;items.length=0;shocks.length=0;boss=null;G.mood=0;G.bHurt=0;G.cine=0;G.kcT=-1;G.endT=-1;G.banner=null;G.paused=false;cutSp=cutBoss=0;hitStop=0;slowT=0;trauma=0;hurtA=0;musOn=0;net.picked={};net.hq=[];net.evq=[];wpReset();hazReset();G.ex=0}
function beginGame(){setStage(G.stage);resetWorld();pl.slot=net.on?net.slot:0;const pvp=G.mode==='pvp',sp=pvp?PSPAWN[pl.slot]:SPAWN[pl.slot];resetPlayer(sp[0],sp[1],pvp?Math.atan2(sp[0],sp[1]+2):0);
for(const o of others){const s=pvp?PSPAWN[o.slot]:SPAWN[o.slot];o.x=o.nx=s[0];o.z=o.nz=s[1];o.dead=false;o.hp=100;o.y=o.ny=0}
Object.assign(G,{state:'play',demoOn:false,wave:-1,kills:0,score:0,combo:0,time:0,dmg:0,intro:0,clearT:pvp?-1:1.4,resT:0,np:net.on?net.roster.length:1,pk:[0,0,0,0],pd:[0,0,0,0],tm:pvp?180:0,itemT:pvp?3:7,allT:0,maxc:0,prevHi:getHi(G.stage),rs:0,rew:null,fuda:null,ex:pvp?0:net.on?(net.ex?1:0):(exSel&&exOpen()?1:0)});
net.evseq=0;net.evDone=0;net.dacc={};net.pvAcc={};net.q={f:[],pk:[],kb:[],ps:[],wx:[],ef:[]};sndVol=1;musOn=1;snd('ui');eidN=0;
if(pvp){G.banner={ch:'対戦',name:'10撃破で勝利！'};G.bannerT=0;pl.inv=2}else if(G.ex){G.banner={ch:'難易度：極',name:'強化された妖怪たち'};G.bannerT=0}else if(!net.on)say(['ここが…','漫画の中!?'],0);else{G.banner={ch:'協力',name:'力を合わせて倒せ！'};G.bannerT=0}}
function startGame(){G.mode='solo';beginGame()}
function spawnGroup(g){for(const k in g){if(MBS[k]){MBS[k]();continue}/* 中ボス (midboss.js) */const n=Math.round(g[k]*(1+0.5*(G.np-1))*(G.ex?EXK.more:1));for(let i=0;i<n;i++)spawnNear(k)}if(G.ex)exGroup()}
function startWave(i){G.wave=i;G.grp=1;G.waveT=0;G.clearT=-1;const w=WAVESET[G.stage][i];ev('ban',w.ch,w.name);if(w.boss){spawnBoss();if(!STG[G.stage].monk)ev('say','全テヲ',STG[G.stage].line,1)}else{spawnGroup(w.g[0]);if(w.say)ev('say',w.say[0],w.say[1],0)}}
function updateWaves(dt){G.time+=dt;if(G.clearT>=0){G.clearT-=dt;if(G.clearT<0)startWave(G.wave+1);return}if(G.wave<0)return;const w=WAVESET[G.stage][G.wave];G.waveT+=dt;
if(w.boss){if(G.endT>=0){G.endT+=RDT;if(G.endT>2.3){G.state='clear';G.resT=0;snd('ui');saveHi();skReward(1)}}return}
if(G.grp<w.g.length){if(enemies.length<=1||G.waveT>G.grp*12){spawnGroup(w.g[G.grp]);G.grp++}}
else if(enemies.length===0){G.clearT=2.8;ev('heal');ev('ban','撃破！','体力回復 ＋30');if(G.wave===WAVESET[G.stage].length-2)ev('say','次で','最後だ…!',0);else ev('say','よし、','次！',0)}}
function gameOver(){G.state='over';G.resT=0;musOn=0;skReward(0);if(!net.on){slowT=2;slowK=0.3}}
function rank(){const v=100-G.dmg*0.2-Math.max(0,G.time-200)*0.08+Math.min(6,G.score/5000);return v>=98?'S+':v>=90?'S':v>=76?'A':v>=60?'B':'C'}
function getHi(s){try{return+(localStorage.getItem('koma_hi'+s)||0)}catch(e){return 0}}
function saveHi(){if(G.mode==='pvp')return;try{if(G.score>getHi(G.stage))localStorage.setItem('koma_hi'+G.stage,G.score)}catch(e){}}
function toMenu(){if(net.on)netLeave();resetWorld();bgRandom();G.state='menu';G.menu='main';G.mode='solo'}
// ================= INPUT (v2) =================
const keys={},touch={sid:null,ox:150,oy:560,dx:0,dy:0,lid:null,lx:0,ly:0,fid:null,flx:0,fly:0,hold:{}};let mouseFire=false,hasTouch=('ontouchstart'in window)||navigator.maxTouchPoints>0;
const BTN={fire:{x:1140,y:570,r:88,l:'撃'},special:{x:1092,y:404,r:54,l:'必殺'},jump:{x:1212,y:420,r:50,l:'跳'},reload:{x:1002,y:498,r:46,l:'装填'},dash:{x:978,y:632,r:56,l:'回避'}};


function hitBtn(p){for(let i=btns.length-1;i>=0;i--){const b=btns[i];if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h){snd('ui');b.cb(p);return true}}return false}
function tap(p){audioInit();if(wipe.on)return;if(p&&hitBtn(p))return;if(G.state==='title')startWipe(()=>{resetWorld();G.demoOn=false;G.state='menu';G.menu='main';G.mode='solo';sndVol=1})}
function tStart(e){e.preventDefault();touchMode=hasTouch=true;for(const t of e.changedTouches){const p=evPos(t),id=t.identifier;if(layEdit){audioInit();layDown(p,id);continue}if(skTouch('d',p,id)||ssTouch('d',p,id)||eqTouch('d',p,id)){audioInit();continue}if(G.state!=='play'||G.paused){tap(p);continue}audioInit();if(hitBtn(p))continue;
let hit=null,bd=1e9;for(const k in BTN){const b=BTN[k],d=Math.hypot(p.x-b.x,p.y-b.y);if(d<b.r*1.2&&d<bd){bd=d;hit=k}}
if(hit){touch.hold[id]=hit;if(hit==='fire'){touch.fid=id;touch.flx=p.x;touch.fly=p.y}else inp[hit]=true}
else if((SET.lh?p.x>W*0.58:p.x<W*0.42)&&touch.sid===null){touch.sid=id;touch.ox=SET.lh?clamp(p.x,W-400,W-90):clamp(p.x,90,400);touch.oy=clamp(p.y,300,630);touch.dx=touch.dy=0}
else if(touch.lid===null){touch.lid=id;touch.lx=p.x;touch.ly=p.y}}}
function tMove(e){e.preventDefault();for(const t of e.changedTouches){const p=evPos(t),id=t.identifier;if(layEdit){layMove(p,id);continue}if(skTouch('m',p,id)||ssTouch('m',p,id)||eqTouch('m',p,id))continue;if(id===touch.sid){let dx=p.x-touch.ox,dy=p.y-touch.oy;const l=Math.hypot(dx,dy);if(l>70){dx*=70/l;dy*=70/l}touch.dx=dx/70;touch.dy=dy/70}
else if(id===touch.lid){inp.lx+=(p.x-touch.lx)*0.0052*SET.sens;inp.ly+=(p.y-touch.ly)*0.0042*SET.sens*SET.inv;touch.lx=p.x;touch.ly=p.y}
else if(id===touch.fid){inp.lx+=(p.x-touch.flx)*0.0052*SET.sens;inp.ly+=(p.y-touch.fly)*0.0042*SET.sens*SET.inv;touch.flx=p.x;touch.fly=p.y}}}
function tEnd(e){e.preventDefault();for(const t of e.changedTouches){const id=t.identifier;if(layEdit)layUp(id);skTouch('u',null,id);ssTouch('u',null,id);eqTouch('u',null,id);if(id===touch.sid){touch.sid=null;touch.dx=touch.dy=0;touch.ox=touch.hx;touch.oy=touch.hy}if(id===touch.lid)touch.lid=null;if(id===touch.fid)touch.fid=null;delete touch.hold[id]}if(e.touches.length===0){if(touch.sid!==null){touch.ox=touch.hx;touch.oy=touch.hy}touch.sid=touch.lid=touch.fid=null;touch.dx=touch.dy=0;touch.hold={}}}
for(const el of[stageEl]){el.addEventListener('touchstart',tStart,{passive:false});el.addEventListener('touchmove',tMove,{passive:false});el.addEventListener('touchend',tEnd,{passive:false});el.addEventListener('touchcancel',tEnd,{passive:false})}
document.addEventListener('gesturestart',e=>e.preventDefault());
uic.addEventListener('mousedown',e=>{if(touchMode)return;const p=evPos(e);if(layEdit){layDown(p,'m');return}if(skTouch('d',p,'m')||ssTouch('d',p,'m')||eqTouch('d',p,'m')){audioInit();return}if(G.state!=='play'||G.paused){tap(p);return}audioInit();if(hitBtn(p))return;if(document.pointerLockElement!==uic){try{uic.requestPointerLock()}catch(er){}}if(e.button===0)mouseFire=true;else if(e.button===2)inp.special=true});
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Escape'&&setOpen){if(layEdit){layEdit=false;layDrag=null;applySet()}else setOpen=false;return}if(G.state==='title'){if(e.code==='Enter'||e.code==='Space')tap(null)}else if(G.state==='play'){if(e.code==='Space')inp.jump=true;if(e.code==='ShiftLeft'||e.code==='ShiftRight')inp.dash=true;if(e.code==='KeyE'||e.code==='KeyQ')inp.special=true;if(e.code==='KeyR')inp.reload=true;if(e.code==='KeyV')tpsToggle();if(e.code==='KeyP'||e.code==='Escape')G.paused=!G.paused}
else if(G.state==='menu'&&G.menu==='join'){if(/^Digit\d$/.test(e.code)&&net.input.length<5)net.input+=e.code[5];if(e.code==='Backspace')net.input=net.input.slice(0,-1)}if(e.code==='Space'||e.code.startsWith('Arrow'))e.preventDefault()});
function readInput(){let mx=touch.dx,mz=-touch.dy;if(keys.KeyW||keys.ArrowUp)mz+=1;if(keys.KeyS||keys.ArrowDown)mz-=1;if(keys.KeyD||keys.ArrowRight)mx+=1;if(keys.KeyA||keys.ArrowLeft)mx-=1;inp.mx=clamp(mx,-1,1);inp.mz=clamp(mz,-1,1);inp.fire=mouseFire||touch.fid!==null}
// ================= UI (v2) =================
function B(x,y,w,h,label,cb,o){o=o||{};if(cb)btns.push({x,y,w,h,cb});const sk=o.sk==null?14:o.sk;para(x+5,y+7,w,h,sk);ctx.fillStyle=INK;ctx.fill();para(x,y,w,h,sk);ctx.fillStyle=o.col||'#fff';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.lineJoin='miter';ctx.stroke();if(label)txt(label,x+w/2+sk/2,y+h/2+2,o.size||Math.min(h*0.48,40),o.tc||INK)}
function panel(x,y,w,h,bg){ctx.fillStyle=INK;ctx.fillRect(x+8,y+10,w,h);ctx.fillStyle=bg||'#fff';ctx.fillRect(x,y,w,h);ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.fillStyle=dotPat;ctx.globalAlpha=0.16;ctx.fillRect(x,y+h*0.55,w,h);ctx.restore();ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.strokeRect(x,y,w,h)}
function head(s){para(60,128,420,54,22);ctx.fillStyle=INK;ctx.fill();txt(s,280,157,32,'#fff')}
// Stage card art. Drawn in a 460x190 design box, scaled to cover the card (centre-cropped).
function stageArt(n,X,Y,W2,H2){ctx.save();ctx.beginPath();ctx.rect(X,Y,W2,H2);ctx.clip();const k=Math.max(W2/460,H2/190);ctx.translate(X+(W2-460*k)/2,Y+(H2-190*k)/2);ctx.scale(k,k);const x=0,y=0,w=460,h=190;
if(n===0){ctx.fillStyle='#4aa8ff';ctx.fillRect(x,y,w,h);ctx.fillStyle=dotPat;ctx.globalAlpha=0.2;ctx.fillRect(x,y,w,h*0.5);ctx.globalAlpha=1;ctx.fillStyle='#ffb9d2';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(x+40+i*22,y+h-34-(i%2)*14,26,0,TAU);ctx.fill();ctx.beginPath();ctx.arc(x+w-40-i*22,y+h-34-(i%2)*14,26,0,TAU);ctx.fill()}
ctx.fillStyle='#ead9ad';ctx.fillRect(x,y+h-26,w,26);ctx.fillStyle='#e5402b';ctx.strokeStyle=INK;ctx.lineWidth=4;const cx=x+w/2;for(const r of[[cx-74,y+52,18,h],[cx+56,y+52,18,h],[cx-104,y+40,208,18],[cx-84,y+76,168,12]]){ctx.fillRect(r[0],r[1],r[2],r[3]);ctx.strokeRect(r[0],r[1],r[2],r[3])}ctx.fillStyle=INK;ctx.fillRect(cx-114,y+28,228,14)}
else if(n===1){ctx.fillStyle='#1b2470';ctx.fillRect(x,y,w,h);ctx.fillStyle='#fff3b0';ctx.beginPath();ctx.arc(x+w*0.3,y+h*0.42,54,0,TAU);ctx.fill();ctx.fillStyle=dotPat;ctx.globalAlpha=0.25;ctx.fillRect(x,y,w,h);ctx.globalAlpha=1;const cx=x+w*0.66;ctx.strokeStyle=INK;ctx.lineWidth=4;for(let i=0;i<3;i++){const ww=150-i*40,yy=y+h-34-i*40;ctx.fillStyle='#f5f0e4';ctx.fillRect(cx-ww/2+12,yy-26,ww-24,30);ctx.strokeRect(cx-ww/2+12,yy-26,ww-24,30);ctx.fillStyle=INK;ctx.beginPath();ctx.moveTo(cx-ww/2-8,yy-24);ctx.lineTo(cx,yy-50);ctx.lineTo(cx+ww/2+8,yy-24);ctx.fill();ctx.fillStyle='#ffd91a';ctx.fillRect(cx-8,yy-18,16,14)}ctx.fillStyle='#6d4630';ctx.fillRect(x,y+h-26,w,26)}
else if(n===2){const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#4a2a70');g.addColorStop(0.5,'#ff7e4a');g.addColorStop(1,'#ffd98a');ctx.fillStyle=g;ctx.fillRect(x,y,w,h);ctx.fillStyle='#ffe58a';ctx.beginPath();ctx.arc(x+w*0.28,y+h*0.6,46,0,TAU);ctx.fill();ctx.fillStyle=dotPat;ctx.globalAlpha=0.22;ctx.fillRect(x,y,w,h*0.6);ctx.globalAlpha=1;
 ctx.strokeStyle=INK;ctx.lineWidth=4;for(let i=0;i<6;i++){const rx=x-20+i*86,ry=y+h-74-(i%2)*14;ctx.fillStyle='#51496a';ctx.beginPath();ctx.moveTo(rx,ry+22);ctx.lineTo(rx+20,ry);ctx.lineTo(rx+76,ry);ctx.lineTo(rx+96,ry+22);ctx.fill();ctx.stroke();ctx.fillStyle='#f2dcc0';ctx.fillRect(rx+8,ry+22,80,30);ctx.strokeRect(rx+8,ry+22,80,30);ctx.fillStyle='#ffc75a';ctx.fillRect(rx+30,ry+30,22,14)}
 ctx.fillStyle='#b98552';ctx.fillRect(x,y+h-30,w,30);ctx.fillStyle='#6f4329';ctx.fillRect(x,y+h-44,w,7);for(let i=0;i<9;i++){ctx.fillRect(x+10+i*56,y+h-58,8,30);ctx.fillStyle='#b08a3a';ctx.beginPath();ctx.arc(x+14+i*56,y+h-60,7,0,TAU);ctx.fill();ctx.fillStyle='#6f4329'}
 for(const lx of[x+w*0.62,x+w*0.86]){ctx.fillStyle='#6f4329';ctx.fillRect(lx+22,y+22,10,h-52);ctx.strokeRect(lx+22,y+22,10,h-52);ctx.fillRect(lx-2,y+22,34,8);ctx.strokeRect(lx-2,y+22,34,8);ctx.beginPath();ctx.moveTo(lx,y+30);ctx.lineTo(lx,y+40);ctx.stroke();ctx.fillStyle='#ff8a2b';ctx.beginPath();ctx.ellipse(lx,y+62,16,21,0,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle=INK;ctx.fillRect(lx-9,y+38,18,5);ctx.fillRect(lx-9,y+81,18,5)}}
else if(n===3){ctx.fillStyle='#c8daf0';ctx.fillRect(x,y,w,h);ctx.fillStyle=dotPat;ctx.globalAlpha=0.18;ctx.fillRect(x,y,w,h*0.6);ctx.globalAlpha=1;ctx.strokeStyle=INK;ctx.lineWidth=4;
 for(const[mx,mw,mh]of[[60,200,140],[300,240,120],[440,180,150]]){ctx.fillStyle='#8090ae';ctx.beginPath();ctx.moveTo(x+mx-mw/2,y+h);ctx.lineTo(x+mx,y+h-mh);ctx.lineTo(x+mx+mw/2,y+h);ctx.fill();ctx.fillStyle='#f4f7ff';ctx.beginPath();ctx.moveTo(x+mx-mw*0.2,y+h-mh*0.6);ctx.lineTo(x+mx,y+h-mh);ctx.lineTo(x+mx+mw*0.2,y+h-mh*0.6);ctx.fill()}
 const cx=x+w*0.5,by=y+h-30;ctx.fillStyle='#6b3f2c';for(const dx of[-46,38])ctx.fillRect(cx+dx,by-86,10,86);ctx.fillStyle='#3f4a5e';ctx.beginPath();ctx.moveTo(cx-80,by-80);ctx.lineTo(cx-30,by-120);ctx.lineTo(cx+30,by-120);ctx.lineTo(cx+80,by-80);ctx.fill();ctx.stroke();ctx.fillStyle='#f4f7ff';ctx.beginPath();ctx.moveTo(cx-56,by-98);ctx.lineTo(cx-30,by-122);ctx.lineTo(cx+30,by-122);ctx.lineTo(cx+56,by-98);ctx.fill();ctx.stroke();
 ctx.fillStyle='#f4f7ff';ctx.fillRect(x,y+h-30,w,30);for(let i=0;i<34;i++){ctx.beginPath();ctx.arc(x+(i*97)%w,y+(i*53)%(h-30),2.5+(i%3),0,TAU);ctx.fill()}}
else if(n===4){const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#1f4d5c');g.addColorStop(0.6,'#6fa9a8');g.addColorStop(1,'#cfe5df');ctx.fillStyle=g;ctx.fillRect(x,y,w,h);ctx.fillStyle=dotPat;ctx.globalAlpha=0.22;ctx.fillRect(x,y,w,h*0.55);ctx.globalAlpha=1;
 ctx.fillStyle='#9fb0b8';for(const[cx,cy,r]of[[60,30,44],[120,22,38],[330,34,50],[400,24,40]]){ctx.beginPath();ctx.ellipse(x+cx,y+cy,r,r*0.4,0,0,TAU);ctx.fill()}
 ctx.strokeStyle=INK;ctx.lineWidth=4;
 for(const[tx,s]of[[w*0.84,1],[w*0.62,-1]]){ctx.fillStyle='#a3283f';ctx.beginPath();ctx.moveTo(x+tx-14,y+h-40);ctx.quadraticCurveTo(x+tx+s*40,y+h-120,x+tx+s*10,y+40);ctx.quadraticCurveTo(x+tx+s*58,y+h-118,x+tx+20,y+h-40);ctx.fill();ctx.stroke();
  ctx.fillStyle='#f5dccb';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(x+tx+s*(22-i*4)+3,y+h-62-i*22,4.5-i*0.5,0,TAU);ctx.fill()}}
 ctx.fillStyle='#1f7088';ctx.fillRect(x,y+h-46,w,46);ctx.strokeStyle='#fff';ctx.lineWidth=3;for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(x+i*56-10,y+h-30+(i%2)*10);ctx.quadraticCurveTo(x+i*56+10,y+h-42+(i%2)*10,x+i*56+30,y+h-30+(i%2)*10);ctx.stroke()}
 const sx=x+w*0.3,sy=y+h-40;ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.fillStyle='#3b2a22';ctx.beginPath();ctx.moveTo(sx-110,sy-30);ctx.lineTo(sx+110,sy-30);ctx.lineTo(sx+92,sy+4);ctx.lineTo(sx-96,sy+4);ctx.fill();ctx.stroke();ctx.fillStyle='#8c1d24';ctx.fillRect(sx-104,sy-22,208,6);
 ctx.fillStyle='#f5f0e4';ctx.fillRect(sx+52,sy-62,56,32);ctx.strokeRect(sx+52,sy-62,56,32);ctx.fillStyle='#2f3a4e';ctx.beginPath();ctx.moveTo(sx+44,sy-60);ctx.lineTo(sx+80,sy-80);ctx.lineTo(sx+116,sy-60);ctx.fill();ctx.stroke();
 ctx.fillStyle='#6d4630';ctx.fillRect(sx-6,y+18,9,h-88);ctx.fillStyle='#f1e6cc';ctx.beginPath();ctx.moveTo(sx-62,y+30);ctx.quadraticCurveTo(sx-2,y+22,sx+58,y+30);ctx.lineTo(sx+56,y+112);ctx.quadraticCurveTo(sx-2,y+104,sx-60,y+112);ctx.fill();ctx.stroke();
 ctx.fillStyle='#e5402b';ctx.beginPath();ctx.moveTo(sx-1,y+44);ctx.lineTo(sx+19,y+56);ctx.lineTo(sx+16,y+94);ctx.lineTo(sx-18,y+94);ctx.lineTo(sx-21,y+56);ctx.closePath();ctx.fill();ctx.stroke()}
else{ctx.fillStyle='#ecebe6';ctx.fillRect(x,y,w,h);ctx.strokeStyle=INK;ctx.lineWidth=4;for(const[mx,mw,mh,c]of[[70,160,150,'#b9b8bf'],[380,200,160,'#b9b8bf'],[150,110,110,'#8d8c94'],[320,120,96,'#8d8c94']]){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x+mx-mw/2,y+h-30);ctx.quadraticCurveTo(x+mx-mw*0.12,y+h-mh,x+mx,y+h-30-mh);ctx.quadraticCurveTo(x+mx+mw*0.12,y+h-mh,x+mx+mw/2,y+h-30);ctx.fill()}
 ctx.fillStyle='#141218';ctx.fillRect(x,y+h-34,w,34);const cx=x+w/2;ctx.fillStyle='#d9262c';for(const r of[[cx-60,y+50,15,h-80],[cx+45,y+50,15,h-80],[cx-84,y+40,168,14],[cx-70,y+70,140,10]]){ctx.fillRect(r[0],r[1],r[2],r[3]);ctx.strokeRect(r[0],r[1],r[2],r[3])}ctx.fillStyle=INK;ctx.fillRect(cx-94,y+28,188,12);
 ctx.strokeStyle='#d9262c';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(cx,y+h-17,110,9,0,0,TAU);ctx.stroke()}
ctx.restore();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.strokeRect(X,Y,W2,H2)}
function drawMenu(dt){if(G.menu==='equip'){drawEquip(dt);return}if(G.menu==='gacha'){drawGacha(dt);return}ctx.fillStyle='rgba(22,18,31,.5)';ctx.fillRect(0,0,W,H);focusLines(W/2,H/2,520,44,'rgba(255,255,255,.16)',7);drawLogo(250,70,0.34);gearBtn(W-86,24);const mn=G.menu;
if(mn==='main'){head('モードを選ぼう');B(330,200,620,96,'ストーリー',()=>{G.menu='stage'},{col:'#ffd91a',size:46});txt('ひとりでじっくり　全５ステージ',640,316,21,'#fff',INK,6);
 B(330,346,620,96,'対戦モード',()=>{G.menu='vs';net.err=''},{col:'#ff8a6b',size:46});txt('みんなで撃ち合い',640,462,21,'#fff',INK,6);
 B(330,492,620,96,'協力プレイ',()=>{net.mode='coop';G.menu='online';net.err=''},{col:'#59d8ff',size:46});txt('最大４人でステージに挑む（オンライン）',640,608,21,'#fff',INK,6);B(60,628,220,56,'タイトルへ',()=>{G.state='title';G.idle=0},{size:26});
 B(960,618,260,66,'スキルツリー',()=>{G.menu='skill';skMsg=null;skFocus()},{col:'#ff9ad0',size:30});txt('Lv'+SKS.lv+'・ポイント '+SKS.pt,1090,600,20,'#fff',INK,6);
 B(680,624,250,64,null,()=>openEquip('main'),{col:'#ffb35a'});txt('装備',812,646,28,INK);txt(WPN[wpCur()].name,812,672,16,'#5a3010');
 gaMenuBtn(1000,232,226,262);gaPreload();gaUpBadge(926,628);
}
else if(mn==='skill')drawSkill();
else if(mn==='stage')drawStageSel(dt);// js/stagesel.js
else if(mn==='vs'){head('対戦モード');B(330,236,620,116,'オフライン',()=>{},{col:'#c9c9d2',size:50});txt('じゅんび中',640,372,22,'#fff',INK,6);B(330,392,620,116,'オンライン',()=>{net.mode='pvp';G.menu='online';net.err=''},{col:'#59d8ff',size:50});txt('最大４人　３分間の撃ち合い',640,528,22,'#fff',INK,6);B(60,628,220,56,'もどる',()=>{G.menu='main'},{size:26})}
else if(mn==='online'){head(net.mode==='pvp'?'対戦モード（オンライン）':'協力プレイ（オンライン）');B(330,236,620,116,'部屋を作る',()=>netHost(),{col:'#ffd91a',size:50});B(330,392,620,116,'部屋に入る',()=>{G.menu='join';net.input='';net.err=''},{col:'#59d8ff',size:50});txt('友だちにルームコードを伝えて、いっしょに遊ぼう（インターネット接続が必要）',640,548,21,'#fff',INK,6);if(net.err)txt(net.err,640,596,net.err.length>30?21:28,'#ff5a4d',INK,8);B(60,628,220,56,'もどる',()=>{G.menu=net.mode==='pvp'?'vs':'main'},{size:26})}
else if(mn==='join'){head('ルームコード入力');for(let i=0;i<5;i++){ctx.fillStyle='#fff';ctx.fillRect(150+i*88,250,76,100);ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.strokeRect(150+i*88,250,76,100);if(net.input[i])txt(net.input[i],188+i*88,302,64,INK)}
 txt('ホストの画面に出ている５けたの数字',368,392,22,'#fff',INK,6);if(net.err)txt(net.err,368,440,26,'#ff5a4d',INK,8);
 ['1','2','3','4','5','6','7','8','9','←','0','OK'].forEach((k,i)=>{const x=690+(i%3)*150,y=200+((i/3)|0)*104;B(x,y,134,90,k,()=>{if(k==='←')net.input=net.input.slice(0,-1);else if(k==='OK'){if(net.input.length===5)netJoin(net.input);else net.err='５けた入力してください'}else if(net.input.length<5)net.input+=k},{sk:0,size:k==='OK'?40:50,col:k==='OK'?'#ffd91a':'#fff'})});B(60,628,220,56,'もどる',()=>{G.menu='online'},{size:26})}
else if(mn==='lobby'){head(net.host?'ロビー（ホスト）':'ロビー');panel(70,206,520,400);txt('ルームコード',330,238,22,INK);txt(net.code?net.code.split('').join(' '):'・・・',330,290,74,'#e5402b',INK,6);
 for(let s=0;s<4;s++){const r=net.roster.find(q=>q.slot===s),y=340+s*62;para(100,y,460,50,10);ctx.fillStyle=r?PCSS[s]:'#d8d8e0';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();txt('P'+(s+1),150,y+26,30,'#fff',INK,6);txt(r?(r.id===net.id?'あなた':'参加中')+(s===0?'（ホスト）':''):'― 空き ―',350,y+26,24,r?'#fff':'#8a8a99',r?INK:null,5)}
 panel(640,206,570,400);if(net.st){txt(net.st,925,400,30,INK)}
 else if(net.host){txt('あそびかた',925,238,22,INK);txt(net.mode==='coop'?'協力プレイ':'対人対戦',925,297,44,'#e5402b',INK,6);
  txt('ステージ',925,366,22,INK);for(let n=0;n<STG.length;n++)B(668+n*106,388,100,70,STG[n].name,()=>{if(!stOpen(n)){snd('clank');return}net.stage=n;net.lobT=0;setStage(n)},{col:net.stage===n?'#ffd91a':stOpen(n)?'#fff':'#8a8a99',size:STG[n].name.length>4?17:20});
  if(net.mode==='coop'&&exOpen()){txt('難易度',700,484,20,INK);B(744,464,150,40,'普通',()=>{net.ex=0;net.lobT=0},{sk:0,size:20,col:net.ex?'#fff':'#ffd91a'});B(904,464,150,40,'極',()=>{net.ex=1;net.lobT=0},{sk:0,size:22,col:net.ex?'#ff4a3d':'#fff',tc:net.ex?'#fff':INK})}
  else txt(net.mode==='coop'?'人数に合わせて敵が強くなる。倒れた仲間のそばで復活！':'３分間の撃ち合い。先に１０撃破で勝ち！',925,484,19,INK);B(700,512,460,76,net.roster.length>1?'スタート！（'+net.roster.length+'人）':'ひとりでスタート',()=>hostStart(),{col:'#ff4a3d',tc:'#fff',size:36})}
 else{txt(net.mode==='coop'?'協力プレイ':'対人対戦',925,300,50,INK);txt(STG[net.stage].name+(net.ex&&net.mode==='coop'?'（極）':''),925,372,36,'#e5402b');if(curStage!==net.stage)setStage(net.stage);if(Math.sin(now*5)>-0.5)txt('ホストの開始を待っています…',925,470,26,INK)}
 B(60,628,220,56,'退出する',()=>netLeave(),{size:26});B(300,628,300,56,'装備：'+WPN[wpCur()].name,()=>openEquip('lobby'),{size:20,col:'#ffb35a'})}}
function drawTags(){for(const o of others){const p=project(o.x,o.y+(o.dead?1.2:2.35),o.z);if(!p||p.w>80)continue;const s=clamp(16/p.w,0.55,1.1);ctx.save();ctx.translate(p.x,p.y);ctx.scale(s,s);para(-36,-16,64,30,8);ctx.fillStyle=PCSS[o.slot];ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();txt('P'+(o.slot+1),0,0,22,'#fff',INK,5);
if(G.mode!=='pvp'){ctx.fillStyle=INK;ctx.fillRect(-34,18,68,10);ctx.fillStyle=o.hp>40?'#35d06a':'#ff3b30';ctx.fillRect(-32,20,64*sat(o.hp/100),6);if(o.dead&&Math.sin(now*8)>-0.3)txt('ダウン！',0,-40,26,'#ff3b30',INK,6,'center','#fff',10)}ctx.restore()}}
function drawHUD2(){B(30,108,46,40,'II',()=>{G.paused=!G.paused},{sk:0,size:22});B(84,108,62,40,['1人称','3人称','2人称'][SET.view|0],tpsToggle,{sk:0,size:17,col:SET.view?'#ffd91a':'#fff'});if(DEV&&G.mode!=='pvp'&&!isCli()&&G.wave<WAVESET[G.stage].length-1)B(30,158,130,40,'ボスへ',devSkipBoss,{sk:0,size:22,col:'#ff8a2b'});if(G.ex){para(156,110,52,36,8);ctx.fillStyle='#ff4a3d';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();txt('極',182,128,24,'#fff',INK,5)}
if(pl.bls>0){const r=sat(pl.bls/(pl.blsT||1));ctx.save();ctx.translate(160,200);const s=1+0.04*Math.sin(now*9);ctx.scale(s,s);burstPath(0,0,66,24,10,1.3,6);ctx.fillStyle='#35d08a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();txt('加護',0,1,24,'#fff',INK,5);ctx.restore();ctx.fillStyle=INK;ctx.fillRect(236,184,150,40);ctx.fillStyle='#e8fff3';ctx.fillRect(238,186,146,36);txt('軽減 -'+Math.round((1-pl.blsD)*100)+'%',312,196,15,INK);txt('攻撃 ×'+pl.blsA.toFixed(2),312,214,15,INK);ctx.fillStyle=INK;ctx.fillRect(236,228,104,14);ctx.fillStyle='#35d08a';ctx.fillRect(238,230,100*r,10)}
if(pl.pow>0){ctx.save();ctx.translate(160,128);const s=1+0.06*Math.sin(now*12);ctx.scale(s,s);burstPath(0,0,66,24,10,1.3,2);ctx.fillStyle='#ff8a2b';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();txt('攻撃×2',0,1,22,'#fff',INK,5);ctx.restore();ctx.fillStyle=INK;ctx.fillRect(236,120,104,14);ctx.fillStyle='#ffd91a';ctx.fillRect(238,122,100*sat(pl.pow/SK.pow),10)}
if(G.mode==='pvp'){const t=Math.max(0,G.tm)|0;txt(((t/60)|0)+':'+String(t%60).padStart(2,'0'),W/2,44,40,t<20?'#ff3b30':'#fff',INK,8);const rs=net.roster.slice().sort((a,b)=>a.slot-b.slot);rs.forEach((r,i)=>{const x=W/2-rs.length*62+i*124+12;para(x,70,104,36,10);ctx.fillStyle=PCSS[r.slot];ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=r.id===net.id?6:3;ctx.stroke();txt('P'+(r.slot+1)+'  '+G.pk[r.slot],x+56,89,22,'#fff',INK,5)})}
if(pl.dead&&net.on){ctx.fillStyle='rgba(22,18,31,.45)';ctx.fillRect(0,250,W,150);if(G.mode==='pvp'){txt('やられた！',W/2,300,64,'#ff3b30',INK,12,'center','#fff',20);txt('復活まで '+Math.max(0,Math.ceil(pl.respT)),W/2,364,30,'#fff',INK,6)}
else{txt('ダウン！',W/2,296,64,'#ff3b30',INK,12,'center','#fff',20);txt('仲間が近くに来ると復活（自動復活まで '+Math.max(0,Math.ceil(pl.respT))+'）',W/2,356,26,'#fff',INK,6);ctx.fillStyle=INK;ctx.fillRect(W/2-152,378,304,16);ctx.fillStyle='#35e0ff';ctx.fillRect(W/2-150,380,300*sat(pl.revT/2.5),12)}}
else if(net.on&&G.mode==='coop')for(const o of others)if(o.dead&&Math.hypot(o.x-pl.x,o.z-pl.z)<2.8)txt('仲間を復活中…',W/2,470,30,'#35e0ff',INK,8)}
function drawResultPvp(){const t=G.resT,cl=G.state==='clear',pvp=G.mode==='pvp';if(t<0.3)return;const u=easeBack(sat((t-0.3)/0.3));focusLines(W/2,H/2,380,70,cl?'rgba(255,255,255,.85)':'rgba(22,18,31,.8)',((now*8)|0)+11);
ctx.save();ctx.translate(W/2,150);ctx.rotate(-0.05);ctx.scale(u,u);burstPath(6,8,450,104,22,1.2,6);ctx.fillStyle=INK;ctx.fill();burstPath(0,0,450,104,22,1.2,6);ctx.fillStyle=cl?'#ffd91a':'#fff';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.stroke();
txt(pvp?'決着！！':cl?'完全勝利！！':'無念…！',0,4,100,cl?'#ff2e2e':INK,cl?INK:null,16,'center',cl?'#fff':null,28);ctx.restore();
if(t>0.8){if(pvp){const rs=net.roster.slice().sort((a,b)=>G.pk[b.slot]-G.pk[a.slot]||G.pd[a.slot]-G.pd[b.slot]);panel(340,280,600,60+rs.length*58);txt('順位',400,312,22,INK);txt('撃破',760,312,22,INK);txt('やられ',860,312,22,INK);
 rs.forEach((r,i)=>{const y=350+i*58;para(370,y-22,540,46,10);ctx.fillStyle=PCSS[r.slot];ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=i===0?6:3;ctx.stroke();txt((i+1)+'位',420,y+2,28,'#fff',INK,6);txt('P'+(r.slot+1)+(r.id===net.id?'（あなた）':''),560,y+2,28,'#fff',INK,6);txt(String(G.pk[r.slot]),760,y+2,32,'#fff',INK,6);txt(String(G.pd[r.slot]),860,y+2,28,'#fff',INK,6);if(i===0)txt('勝者！',960,y,30,'#ffd91a',INK,8)})}
else{panel(340,270,430,cl?250:150);txt('撃破数',375,312,28,INK,null,0,'left');txt(String(G.kills),735,312,34,INK,null,0,'right');txt('スコア',375,362,28,INK,null,0,'left');txt(String(G.score),735,362,34,INK,null,0,'right');
 if(cl){const tm=G.time|0;txt('タイム',375,412,28,INK,null,0,'left');txt(((tm/60)|0)+':'+String(tm%60).padStart(2,'0'),735,412,34,INK,null,0,'right');txt('被ダメージ',375,462,28,INK,null,0,'left');txt(String(G.dmg|0),735,462,34,INK,null,0,'right');
  const rk=rank(),k2=easeBack(sat((t-1.1)/0.3));if(t>1.1){ctx.save();ctx.translate(900,390);ctx.rotate(0.08);ctx.scale(k2,k2);burstPath(5,7,150,130,14,1.25,8);ctx.fillStyle=INK;ctx.fill();burstPath(0,0,150,130,14,1.25,8);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.stroke();txt('ランク',0,-78,24,INK);txt(rk,0,12,rk.length>1?120:140,rk[0]==='S'?'#ff2e2e':rk==='A'?'#ff8a2b':rk==='B'?'#2f6fd8':'#6a6a7a',INK,12,'center','#ffd91a',rk[0]==='S'?24:0);ctx.restore()}}}}
if(t>1.5){if(net.on){if(net.host)B(440,620,400,66,'ロビーへもどる',()=>hostLobby(),{col:'#ffd91a',size:32});else{txt('ホストの操作を待っています…',W/2,640,26,'#fff',INK,6)}B(60,628,200,56,'退出する',()=>netLeave(),{size:24})}
else{B(330,620,300,66,'もう一度',()=>startWipe(startGame),{col:'#ffd91a',size:34});B(660,620,300,66,'メニューへ',()=>startWipe(toMenu),{size:34})}}}
function drawUI(dt){ctx.clearRect(0,0,W,H);btns=[];const play=G.state==='play',demo=G.state==='title'&&G.demoOn;const gc=gaDemo();if(gc){ctx.save();ctx.beginPath();ctx.rect(GA_VPR.x,GA_VPR.y,GA_VPR.w,GA_VPR.h);ctx.clip()}// the gacha highlight: effects / sound-effect text stay inside its frame
if(lineA>0.03){ctx.globalAlpha=Math.min(1,lineA*1.3);focusLines(lineCx,lineCy,300+(1-lineA)*200,64,lineCol,((now*24)|0));ctx.globalAlpha=1}
if(boss&&boss.st==='rise'){ctx.globalAlpha=0.8;focusLines(W/2,H*0.4,380,56,INK,((now*20)|0)+50);ctx.globalAlpha=1}
if(pl.dashT>0){ctx.globalAlpha=0.7;focusLines(W/2,H/2,330,50,INK,((now*30)|0)+90);ctx.globalAlpha=1}
const kc=play&&(G.kcT>=0||monkCine());if(play&&!kc)drawTags();drawTexts();wpOverlay();if(cutSp>0)drawCutSp();if(cutBoss>0)drawCutBoss();if(play||demo)drawBanner();
if(kc){const k=G.kcT>=0?easeOut(sat(G.kcT/0.25))*58:monkBars();ctx.fillStyle=INK;ctx.fillRect(0,0,W,k);ctx.fillRect(0,H-k,W,k)}
if(play&&pl.frz>0&&!pl.dead){const a=sat(pl.frz/0.25);ctx.fillStyle='rgba(150,215,255,'+(0.32*a)+')';ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(225,245,255,'+(0.9*a)+')';ctx.lineWidth=26;ctx.strokeRect(13,13,W-26,H-26)}
if(play&&!kc){drawFoeArrows();drawHUD();drawHUD2();drawTouch();if(!hasTouch&&G.time<8&&G.mode!=='pvp')txt('WASD：移動　マウス：視点／射撃　SPACE：ジャンプ　SHIFT：回避　E：必殺　R：装填',W/2,610,20,'#fff',INK,6)}
for(let i=balloons.length-1;i>=0;i--){const b=balloons[i];b.t+=dt;if(b.t>b.life)balloons.splice(i,1);else if(play)drawBalloon(b)}
if(demo&&G.endT>1.2){const u=easeBack(sat((G.endT-1.2)/0.3));ctx.save();ctx.translate(W/2,H*0.42);ctx.rotate(-0.06);ctx.scale(u,u);txt('撃破！！',0,0,150,'#ffd91a',INK,20,'center','#fff',36);ctx.restore()}
if(gc)ctx.restore();
if(G.state==='title')drawTitle(dt);else if(G.state==='menu')drawMenu(dt);else if(G.state==='clear'||G.state==='over')drawResult();
if(play&&G.intro<0.9){const u=easeOut(G.intro/0.9),hw=lerp(170,W/2+20,u),hh=lerp(96,H/2+20,u);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H/2-hh);ctx.fillRect(0,H/2+hh,W,H);ctx.fillRect(0,0,W/2-hw,H);ctx.fillRect(W/2+hw,0,W,H);ctx.strokeStyle=INK;ctx.lineWidth=8;ctx.strokeRect(W/2-hw,H/2-hh,hw*2,hh*2);
ctx.globalAlpha=1-u;ctx.lineWidth=5;ctx.strokeRect(40,40,430,250);ctx.strokeRect(40,310,430,370);ctx.strokeRect(W-470,40,430,150);ctx.strokeRect(W-470,210,430,470);ctx.globalAlpha=1}
if(play&&G.paused){ctx.fillStyle='rgba(22,18,31,.6)';ctx.fillRect(0,0,W,H);txt('ポーズ',W/2,210,90,'#fff',INK,14);if(net.on)txt('（オンライン中はゲームは止まりません）',W/2,280,22,'#fff',INK,6);B(390,310,500,86,'つづける',()=>{G.paused=false},{col:'#ffd91a',size:42});B(390,418,500,86,'設定',()=>openSet(),{col:'#59d8ff',size:40});B(390,526,500,86,net.on?'退出してメニューへ':'メニューへもどる',()=>startWipe(toMenu),{size:38})}
if(setOpen)drawSettings();else drawMenuPop();if(wipe.on)drawWipe();ctx.strokeStyle='#fff';ctx.lineWidth=14;ctx.strokeRect(0,0,W,H);ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.strokeRect(9.5,9.5,W-19,H-19)}
// ================= MAIN (v2) =================
let GDT=0;
// boss defeat camera: cut away from the player, start a little above the boss and drift in while circling
function killCam(dt){if(boss&&(boss.monk||boss.mob))G.kcP=[boss.x,boss.y,boss.z,boss.yaw];/* moving bosses (鐘の僧, シロヌキ第3形態): follow him */const K=G.kcP,t=G.kcT,u0=sat(t/3.4),u=u0*u0*(3-2*u0),tx=K?K[0]:0,ty=K?K[1]+3.6:17,tz=K?K[2]:boss&&boss.bk==='kraken'?-34:-21.5,a=(K?K[3]:0)+lerp(-0.62,-0.18,u)+t*0.015,d=K?lerp(17,10,u):lerp(38,22,u),h=K?lerp(7,1.2,u):lerp(17,4,u),s=trauma*trauma;
cam.x=tx+Math.sin(a)*d;cam.z=tz+Math.cos(a)*d;cam.y=ty+h;const dx=tx-cam.x,dy=ty-cam.y,dz=tz-cam.z;cam.yaw=Math.atan2(-dx,-dz)+rnd(-1,1)*s*0.03;cam.pitch=Math.atan2(dy,Math.hypot(dx,dz))+rnd(-1,1)*s*0.03;cam.roll=lerp(-0.06,0.02,u)+rnd(-1,1)*s*0.03;cam.fov=lerp(64,54,u)*PI/180}
// ---- third / second-person camera (SET.view 1 / 2, toggled in the settings / the small HUD button / V key) ----
// Over the right shoulder. Walls pull the camera in at once and it eases back out; looking up from below,
// the ground stops it and it slides along the boom towards the hero; too close and the hero is not drawn.
const TPS_D=3.4,TPS_SH=0.62,TPS_UP=0.3,TPS_PAD=0.3;let tpsD=TPS_D,tpsS=TPS_SH,tpsSide=1;const tpsEye=[0,0,0];// tpsSide: shoulder scale, negative = left shoulder (gacha demo)
const tpsHero={slot:0,x:0,y:0,z:0,yaw:0,pitch:0,wt:0,mv:0,dead:false,flash:0,fireT:0,sp:0,gx:0,gy:0,gz:0};
function tpsOn(){return SET.view>=1&&(G.state!=='menu'||gaDemo())&&!(G.state==='title'&&!G.demoOn)&&!(G.kcT>=0)&&!monkCine()}
function tpsSet(v){SET.view=v;tpsD=0.2;tpsS=0;applySet();snd('ui')}
function tpsToggle(){SET.view=((SET.view|0)+1)%3;tpsD=0.2;tpsS=0;applySet();snd('ui')}
function tpsCam(dt){const ex=cam.x,ey=cam.y,ez=cam.z,cp=Math.cos(cam.pitch),fx=-Math.sin(cam.yaw)*cp,fy=Math.sin(cam.pitch),fz=-Math.cos(cam.yaw)*cp,rx=Math.cos(cam.yaw),rz=-Math.sin(cam.yaw);
tpsEye[0]=ex;tpsEye[1]=ey;tpsEye[2]=ez;
// second person (SET.view=2): the camera stands in front of the hero and looks back at them; aiming is still by pl.yaw / pl.pitch.
// The orbit uses pl.yaw / a damped pl.pitch (not cam.*, which carries recoil and shake: those would swing the camera 3 m away),
// so looking down does not drop the camera under the hero and looking up does not put it overhead. Shake is added to the view angles.
// During the boss intro (G.cine) it falls back to the over-the-shoulder camera so the boss stays in shot.
if(SET.view===2&&!(G.cine>0)){const D2=3.2,s=trauma*trauma,op=clamp(pl.pitch*0.45,-0.35,0.55),oc=Math.cos(op),gx=-Math.sin(pl.yaw)*oc,gy=Math.sin(op),gz=-Math.cos(pl.yaw)*oc;
 let d=rayWorld(ex,ey,ez,gx,gy,gz,D2+TPS_PAD)-TPS_PAD;if(gy<-0.01)d=Math.min(d,(ey-0.4)/-gy);d=clamp(d,0.12,D2);tpsD=d<tpsD?d:lerp(tpsD,d,Math.min(1,dt*2.5));
 const cx=ex+gx*tpsD,cy=Math.max(0.3,ey+gy*tpsD),cz=ez+gz*tpsD,dx=ex-cx,dy=ey-0.15-cy,dz=ez-cz;cam.x=cx;cam.y=cy;cam.z=cz;
 cam.yaw=Math.atan2(-dx,-dz)+rnd(-1,1)*s*0.04;cam.pitch=Math.atan2(dy,Math.hypot(dx,dz))+rnd(-1,1)*s*0.04;cam.roll=rnd(-1,1)*s*0.05;return}
// shoulder offset: shrinks when a wall is right beside the hero
// (and moves further out to the side while the boom is pulled in, so the hero blocks less of the view)
const sd=tpsSide<0?-1:1,sw=Math.abs(tpsSide)*TPS_SH+0.35*sat(1-tpsD/TPS_D),sh=clamp(rayWorld(ex,ey,ez,rx*sd,0,rz*sd,sw+TPS_PAD)-TPS_PAD,0,sw);tpsS=sh<tpsS?sh:lerp(tpsS,sh,Math.min(1,dt*3));
const sx=ex+rx*tpsS*sd,sy=ey+TPS_UP,sz=ez+rz*tpsS*sd;
// boom: walls / props / the ground between the shoulder and the camera pull it in
let d=rayWorld(sx,sy,sz,-fx,-fy,-fz,TPS_D+TPS_PAD)-TPS_PAD;if(fy>0.01)d=Math.min(d,(sy-0.22)/fy);d=clamp(d,0.12,TPS_D);
tpsD=d<tpsD?d:lerp(tpsD,d,Math.min(1,dt*2.5));
cam.x=sx-fx*tpsD;cam.y=sy-fy*tpsD;cam.z=sz-fz*tpsD;cam.roll*=0.5}
// ray origin for shooting: on the camera ray, level with the hero (so it goes through the crosshair but never hits what is behind the hero)
function aimOrigin(){if(!tpsOn())return[cam.x,cam.y,cam.z];if(SET.view===2)return[tpsEye[0],tpsEye[1],tpsEye[2]];const d=aimDir(),t=Math.max(0,(tpsEye[0]-cam.x)*d[0]+(tpsEye[1]-cam.y)*d[1]+(tpsEye[2]-cam.z)*d[2]);return[cam.x+d[0]*t,cam.y+d[1]*t,cam.z+d[2]*t]}
function drawTpsHero(){if(!tpsOn())return;const o=tpsHero;o.me=1;o.slot=pl.slot||0;o.x=pl.x;o.y=pl.y||0;o.z=pl.z;o.yaw=pl.yaw;o.pitch=pl.pitch;o.dead=pl.dead;o.mv=pl.moving;o.wt+=GDT;o.fireT=pl.flashT;o.sp=pl.sp===2&&!pl.wp?1:0;o.wp=pl.wp|0;o.ak=pl.ak;o.at=pl.at;o.hc=pl.hon?pl.hc:null;o.bombs=pl.bombs;o.flash=hurtA>0.5?1:0;
if(tpsD<0.9){const cp=Math.cos(pl.pitch);muz[0]=pl.x+Math.cos(pl.yaw)*0.3-Math.sin(pl.yaw)*cp;muz[1]=tpsEye[1]-0.2+Math.sin(pl.pitch);muz[2]=pl.z-Math.sin(pl.yaw)*0.3-Math.cos(pl.yaw)*cp;return}
drawHero(o);muz[0]=o.gx;muz[1]=o.gy;muz[2]=o.gz;
if(pl.sp===1){const s=0.3+pl.spT*1.2;bill(BURST,o.gx,o.gy,o.gz,s,now*20,C.cyan,F_UNLIT|F_NOCAST);bill(STAR,o.gx,o.gy,o.gz,s*0.5,-now*20,C.white,F_UNLIT|F_NOCAST)}}
// the slowly orbiting camera behind the menus (also the background around the gacha highlight frame)
function orbitCam(){const a=now*0.12;cam.x=Math.sin(a)*19;cam.z=3+Math.cos(a)*17;cam.y=5+Math.sin(now*0.2)*1.5;const dx=-cam.x,dy=4.5-cam.y,dz=-9-cam.z;cam.yaw=Math.atan2(-dx,-dz);cam.pitch=Math.atan2(dy,Math.hypot(dx,dz));cam.roll=0;cam.fov=70*PI/180}
function setCamera(dt){vpR=gaFrame()||VPR_FULL;if((G.state==='menu'&&!gaDemo())||(G.state==='title'&&!G.demoOn)){orbitCam()}
else if(G.kcT>=0)killCam(dt);
else{const s=trauma*trauma;cam.x=pl.x;cam.z=pl.z;cam.y=1.62+pl.y-pl.land*0.14+Math.abs(Math.sin(pl.bob))*0.05*pl.moving-(pl.dead?Math.min(1.1,pl.deadT*1.2):0);cam.yaw=pl.yaw+rnd(-1,1)*s*0.04;cam.pitch=pl.pitch+pl.kick+rnd(-1,1)*s*0.04;cam.roll=pl.tilt+rnd(-1,1)*s*0.05+(pl.dead?Math.min(0.5,pl.deadT*0.5):0);
cam.fov=lerp(cam.fov,((tpsOn()?72:80)+(pl.dashT>0?14:0)+(pl.sp===2&&spLock()?10:0)-(pl.sp===1?8:0))*PI/180,Math.min(1,dt*10));if(tpsOn())tpsCam(dt);monkCam()}seaCam();camUpdate()}
function update(dt){RDT=dt;now+=dt;G.t+=dt;let g=dt;if(net.on){hitStop=0;slowT=0}if(hitStop>0){hitStop-=dt;g=0}else if(slowT>0){slowT-=dt;g=dt*slowK}
const paused=G.paused&&!net.on&&G.state==='play';if(paused)g=0;GDT=g;
if(wipe.on){wipe.t+=dt/0.6;if(wipe.t>=0.5&&!wipe.done){wipe.done=true;wipe.cb()}if(wipe.t>=1)wipe.on=false}
const gd=gaDemoRun(),demo=(G.state==='title'&&G.demoOn)||gd,sv0=sndVol;
if((G.state==='menu'&&!gd)||(G.state==='title'&&!G.demoOn)){if(G.state==='title'){G.idle+=dt;if(G.idle>5)startWipe(demoStart)}gaUpdate(g);updateParts(g)}
else if(!paused){const cli=isCli(),over=G.state==='over';if(gd)sndVol=sv0*0.35;
 if(demo){aiControl(Math.max(g,0.001));if(gd)gaDemoUpdate(g);else demoUpdate(g);updateItems(g)}
 else if(G.state==='play'){if(G.paused){inp.fire=false;inp.mx=inp.mz=0}else readInput();
  if(!cli){if(G.mode==='pvp'){G.tm-=dt;if(G.tm<=0||Math.max.apply(null,G.pk)>=10){G.state='clear';G.resT=0;musOn=0;snd('ui')}}else updateWaves(g);updateItems(g)}
  if(net.on&&net.host&&G.mode==='coop'&&pl.dead&&others.every(o=>o.dead)){G.allT+=dt;if(G.allT>1.5)gameOver()}else G.allT=0}
 else{inp.fire=false;inp.mx=inp.mz=0}
 if(boss&&boss.st==='die'&&!(G.kcT>=0))G.kcT=0;if(G.kcT>=0)G.kcT+=dt;if(G.kcT>=0||monkCine()){inp.fire=false;inp.mx=inp.mz=0;inp.lx=inp.ly=0;inp.special=inp.jump=inp.dash=false}
 if(G.cine>0){G.cine-=dt;const k=Math.min(1,dt*5),mk=boss&&boss.monk,drop=mk&&boss.st==='drop'&&boss.stT<1.9,tx=mk&&!drop?boss.x:0,tz=mk?(drop?-26:boss.z):-21,ty=mk?(drop?7:boss.y+4.5):20.6,dh=Math.hypot(pl.x-tx,pl.z-(mk?tz:-26));pl.yaw+=angDiff(Math.atan2(pl.x-tx,pl.z-tz),pl.yaw)*k;pl.pitch+=(Math.atan2(ty-1.6,dh)-pl.pitch)*k}
 updatePlayer(g);wpWorld(g);if(cli)clientInterp(g);else if(!over){updateEnemies(g);updateShots(g)}
 updateOthers(dt);if(!over){updateShocks(g);hazTick(g);pickItems(g)}updateParts(g);G.comboT-=dt;if(G.comboT<=0)G.combo=0;sndVol=sv0}
netTick(dt);if(G.mode==='pvp'&&G.state==='play')G.kills=G.pk[pl.slot]||0;
if(!boss)G.mood=Math.max(0,G.mood-dt*0.4);
trauma=Math.max(0,trauma-dt*1.8);flashA=Math.max(0,flashA-dt*5);invA=Math.max(0,invA-dt*9);hurtA=Math.max(pl.hp<30&&G.state==='play'&&!pl.dead?0.3+0.12*Math.sin(now*7):0,hurtA-dt*2.2);lineA=Math.max(0,lineA-dt*3.5);
ageTexts(dt);hitMark-=dt;cutSp-=dt;cutBoss-=dt;G.bannerT+=dt;G.intro+=dt;G.comboPop-=dt;monoA=lerp(monoA,(G.state==='over'||(G.state==='clear'&&G.resT>0.2))?0.85:0,Math.min(1,dt*3));
if(G.state==='clear'||G.state==='over')G.resT+=dt;music();setCamera(dt)}
bgRandom();
