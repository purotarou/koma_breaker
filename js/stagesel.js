'use strict';
// ================= STAGE SELECT (story menu) =================
// The cards sit on one long strip that scrolls sideways: drag / swipe (with inertia), mouse wheel, the ＜ ＞ buttons,
// or tap a tab of the overview strip at the bottom (one tab per stage; the yellow frame shows which part is on screen).
// A card starts its stage on release, and only when the finger did not move (so a swipe never starts a stage).
// Adding a stage to STG is enough: the strip and the overview grow with it.
const SS={x:0,v:0,id:null,px:0,mv:0,lp:null,CW:300,CH:408,GAP:24,Y:196,X0:44};
const ssP=()=>SS.CW+SS.GAP,ssTot=()=>STG.length*ssP()-SS.GAP+SS.X0*2,ssMax=()=>Math.max(0,ssTot()-W);
// stages open in order: one is playable once the one before it has been cleared (the developer 超強化 switch opens all)
const stOpen=n=>n===0||!!DEV||!!SKS.clr[n-1];
function ssOn(){return G.state==='menu'&&G.menu==='stage'&&!setOpen&&!wipe.on}
function ssTouch(ph,p,id){if(!ssOn()){SS.id=null;return false}
if(ph==='d'){if(p.y<SS.Y-8||p.y>SS.Y+SS.CH+12)return false;SS.id=id;SS.px=p.x;SS.mv=0;SS.v=0;SS.lp=p;return true}
if(SS.id!==id)return false;
if(ph==='m'){const dx=p.x-SS.px;SS.px=p.x;SS.mv+=Math.abs(dx);SS.x=clamp(SS.x-dx,-90,ssMax()+90);SS.v=lerp(SS.v,-dx*60,0.5);SS.lp=p;return true}
SS.id=null;if(SS.mv<14&&SS.lp){SS.v=0;const q=SS.lp.x-SS.X0+SS.x,n=Math.floor(q/ssP());if(n>=0&&n<STG.length&&q-n*ssP()<SS.CW){if(!stOpen(n)){return true}snd('ui');G.stage=n;startWipe(startGame)}}return true}
function ssWheel(e){if(!ssOn())return false;SS.v+=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)*6;return true}
function ssGo(n){SS.v=(clamp(SS.X0+n*ssP()+SS.CW/2-W/2,0,ssMax())-SS.x)*5}// v/5 = the distance the inertia carries
function drawStageSel(dt){head('ステージ選択');const fit=STG.length<=5;SS.CW=fit?226:300;SS.GAP=fit?16:24;SS.X0=fit?43:44;// up to five stages all fit on one screen: nothing scrolls
const m=ssMax(),w=SS.CW,y=SS.Y;
if(SS.id===null){SS.x+=SS.v*dt;SS.v*=Math.exp(-5*dt);const c=clamp(SS.x,0,m);if(c!==SS.x){SS.x=lerp(SS.x,c,Math.min(1,dt*12));SS.v=0}}
for(let n=0;n<STG.length;n++){const x=SS.X0+n*ssP()-SS.x,s=STG[n];if(x>W||x+w<0)continue;panel(x,y,w,SS.CH);stageArt(n,x+12,y+12,w-24,176);
 para(x+12,y+198,132,36,10);ctx.fillStyle=s.col;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();txt(s.sub,x+80,y+217,21,'#fff');
 if(SKS.clr[n]){// 制覇 seal stamped on the corner of the picture (clear of the stage number below it)
  ctx.save();ctx.translate(x+w-58,y+62);ctx.rotate(-0.22);ctx.beginPath();ctx.arc(3,4,41,0,TAU);ctx.fillStyle=INK;ctx.fill();ctx.beginPath();ctx.arc(0,0,41,0,TAU);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#d9262c';ctx.lineWidth=5;ctx.stroke();ctx.beginPath();ctx.arc(0,0,33,0,TAU);ctx.lineWidth=2;ctx.stroke();
  txt('制覇',0,2,34,'#d9262c');ctx.restore()}
 if(!stOpen(n)){ctx.fillStyle='rgba(22,18,31,.8)';ctx.fillRect(x,y,w,SS.CH);
  txt('ステージ'+n+'を',x+w/2,y+292,fit?22:24,'#fff');txt('制覇すると解放',x+w/2,y+324,fit?22:24,'#fff');continue}
 txt(s.name,x+w/2,y+268,(s.name.length>4?38:42)*(fit?0.82:1),INK);txt(s.desc[0],x+w/2,y+308,fit?16:18,INK);txt(s.desc[1],x+w/2,y+332,fit?16:18,INK);
 para(x+(fit?10:22),y+350,w-(fit?28:52),28,8);ctx.fillStyle=INK;ctx.fill();txt(fit?s.boss:'ボス　'+s.boss,x+w/2,y+365,fit?15:16,'#fff');if(exSel&&exOpen()){ctx.save();ctx.translate(x+36,y+38);ctx.rotate(-0.15);para(-30,-20,60,40,8);ctx.fillStyle='#ff4a3d';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();txt('極',0,1,28,'#fff',INK,5);ctx.restore()}txt('ハイスコア '+getHi(n),x+w/2,y+393,16,INK)}
B(60,628,220,56,'もどる',()=>{G.menu='main'},{size:26});
// 難易度 (極 opens once all five stages are cleared)
if(exOpen()){txt('難易度',800,150,22,'#fff',INK,6);B(850,124,170,52,'普通',()=>{exSet(0);snd('ui')},{sk:0,size:24,col:exSel?'#fff':'#ffd91a'});B(1032,124,190,52,'極',()=>{exSet(1);snd('ui')},{sk:0,size:30,col:exSel?'#ff4a3d':'#a35cff',tc:'#fff'});
 if(exSel)txt('敵が大幅に強化・新たな敵・ボスの新技',800,656,20,'#fff',INK,6)}
else txt('全ステージ制覇で　難易度：極　解放',1010,150,19,'#fff',INK,5);
if(m<=0)return;
// more to the side: blinking arrows over the edge of the strip
if(Math.sin(now*6)>-0.3){if(SS.x<m-8)txt('▶',W-34,y+SS.CH/2,44,'#ffd91a',INK,8);if(SS.x>8)txt('◀',34,y+SS.CH/2,44,'#ffd91a',INK,8)}
B(1000,128,74,54,'＜',()=>{SS.v=-ssP()*5},{sk:0,size:30,col:'#ffd91a'});B(1086,128,74,54,'＞',()=>{SS.v=ssP()*5},{sk:0,size:30,col:'#ffd91a'});
txt('全'+STG.length+'ステージ　ヨコにスワイプで全体を見る',740,157,20,'#fff',INK,6);
// overview strip
const tw=Math.min(176,(W-340)/STG.length),tx0=312,tot=ssTot();
for(let n=0;n<STG.length;n++){const x=tx0+n*tw,s=STG[n];B(x,638,tw-12,42,null,()=>ssGo(n),{sk:6,col:s.col});txt((n+1)+' '+s.name,x+tw/2-3,660,tw>150?17:14,'#fff',INK,4)}
ctx.strokeStyle='#ffd91a';ctx.lineWidth=5;ctx.strokeRect(tx0+clamp(SS.x/tot,0,1)*tw*STG.length-6,630,Math.min(1,W/tot)*tw*STG.length,58)}
