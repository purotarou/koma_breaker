'use strict';
// ================= GACHA ガチャ (G.menu 'gacha') =================
// Currency: コマ札 (localStorage koma_gacha {f: count, paid: [times paid per stage], pick: pickup weapon id, n: total pulls}).
// A stage clear (solo / co-op) gives stage number × 1 (stage 1 = 1 … stage 5 = 5), only for the first two clears of each stage.
// Weapon gacha: the six weapons of weapons.js. 1 札 = 1 pull, 5 札 = 6 pulls. The pickup (one, chosen by the player) comes out
// at GA_PU, every other weapon has the same share of the rest. A duplicate adds a waiting 必殺 level-up (wsGive → WS.up), which the
// player applies by hand in 設定 →「武器の強化」(drawWpUp). A weapon at 必殺Lv3 (counting the waiting ones) leaves the pool.
// The screen: the weapon card (picture assets/gacha/cut_*.webp) on the left, and behind everything a live 3D highlight of the hero
// using that weapon (gaHi / gaDraw3d / gaCam, the menu camera is replaced while the gacha is open).
const GA_IDS=['rifle','shotgun','rail','katana','hammer','bomb'],GA_PIC={rail:'railgun'},GA_PU=0.4;
const GA={f:0,paid:[0,0,0,0,0],pick:'rifle',n:0};
try{const s=JSON.parse(localStorage.getItem('koma_gacha')||'null');if(s)Object.assign(GA,s)}catch(e){}
if(!GA_IDS.includes(GA.pick))GA.pick='rifle';if(!Array.isArray(GA.paid))GA.paid=[0,0,0,0,0];GA.f=Math.max(0,GA.f|0);
function gaSave(){try{localStorage.setItem('koma_gacha',JSON.stringify(GA))}catch(e){}}
// pictures load on first use (about 100 KB each)
const GA_IMG={};
function gaImg(id){let m=GA_IMG[id];if(!m){m=GA_IMG[id]=new Image();m.src='assets/gacha/cut_'+(GA_PIC[id]||id)+'.webp'}return m.complete&&m.naturalWidth>0?m:null}
function gaPreload(){for(const id of GA_IDS)gaImg(id)}
// ---- reward (called once per game from skReward) ----
function gaReward(cl){G.fuda=null;if(!cl)return;const i=G.stage;if(i<0||i>4)return;if((GA.paid[i]|0)>=2){G.fuda=0;return}
GA.paid[i]=(GA.paid[i]|0)+1;GA.f+=i+1;G.fuda=i+1;gaSave()}
// ---- draw logic ----
const gaPool=()=>GA_IDS.filter(id=>wpLvAll(id)<3);
function gaRoom(){let n=0;for(const id of GA_IDS)n+=3-wpLvAll(id);return n}// pulls that can still give something
function gaRates(){const P=gaPool(),r={};if(!P.length)return r;if(P.includes(GA.pick)&&P.length>1){r[GA.pick]=GA_PU;for(const id of P)if(id!==GA.pick)r[id]=(1-GA_PU)/(P.length-1)}else for(const id of P)r[id]=1/P.length;return r}
function gaRoll(){const r=gaRates();let u=Math.random(),last=null;for(const id in r){last=id;u-=r[id];if(u<0)return id}return last}
let gaMsg=null;
function gaPull(n,cost){if(gaA)return;if(GA.f<cost){gaMsg={s:'コマ札が足りません（ステージをクリアするともらえる）',t:now};snd('clank');return}
const room=gaRoom();if(room<n){gaMsg={s:room?'のこり'+room+'回分しか出ないため、6回ガチャは引けません':'すべての武器が必殺Lv3です！',t:now};snd('clank');return}
GA.f-=cost;const res=[];for(let i=0;i<n;i++){const id=gaRoll();if(!id)break;const was=WS.own[id]?wpLvAll(id):0,k=wsGive(id);res.push({id,k,pu:id===GA.pick,lv:wpLvAll(id),was})}
GA.n+=res.length;gaSave();gaA={res,i:0,ph:0,t:0,multi:n>1};gaCrack();snd('charge')}
// ---- screen state ----
let gaSel=0,gaDet=0,gaA=null;
function openGacha(){G.menu='gacha';gaSel=Math.max(0,GA_IDS.indexOf(GA.pick));gaDet=0;gaA=null;gaMsg=null;gaH.id=null;wpReset();texts.length=0;gaPreload()}
function closeGacha(){G.menu='main';gaA=null;wpReset();texts.length=0;parts.length=0;decals.length=0;trauma=0}
function gaGo(d){gaSel=(gaSel+d+GA_IDS.length)%GA_IDS.length;snd('ui')}
const gaCss=c=>'rgb('+(c[0]*255|0)+','+(c[1]*255|0)+','+(c[2]*255|0)+')';
// ---- icons ----
// コマ札: a small paper talisman
function gaFuda(x,y,s,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot==null?-0.12:rot);ctx.scale(s,s);
ctx.fillStyle=INK;ctx.fillRect(-12,-19,30,44);ctx.fillStyle='#fff8e0';ctx.fillRect(-15,-22,30,44);ctx.fillStyle='#e5402b';ctx.fillRect(-15,-22,30,10);
ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.strokeRect(-15,-22,30,44);ctx.beginPath();ctx.moveTo(-15,-12);ctx.lineTo(15,-12);ctx.stroke();
ctx.strokeStyle='#e5402b';ctx.lineWidth=1.5;ctx.strokeRect(-11,-8,22,26);txt('コ',0,-1,11,INK);txt('マ',0,10,11,INK);ctx.restore()}
// capsule machine (the menu button)
function gaMachine(cx,cy,s){ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);ctx.lineJoin='round';
ctx.fillStyle=INK;ctx.beginPath();ctx.arc(6,-34,52,0,TAU);ctx.fill();ctx.fillRect(-46,4,110,92);
ctx.fillStyle='#cfefff';ctx.beginPath();ctx.arc(0,-40,52,0,TAU);ctx.fill();
ctx.save();ctx.beginPath();ctx.arc(0,-40,49,0,TAU);ctx.clip();const cap=[[-24,-14,'#e5402b'],[6,-8,'#ffd91a'],[30,-22,'#59d8ff'],[-30,-44,'#ff7aa8'],[2,-40,'#35d06a'],[26,-54,'#ff8a2b'],[-8,-70,'#a04cff'],[-38,-14,'#2f6fd8']];
for(const[x,y,c]of cap){ctx.save();ctx.translate(x,y);ctx.rotate(x*0.05);ctx.beginPath();ctx.arc(0,0,14,PI,TAU);ctx.fillStyle=c;ctx.fill();ctx.beginPath();ctx.arc(0,0,14,0,PI);ctx.fillStyle='#fff';ctx.fill();ctx.beginPath();ctx.arc(0,0,14,0,TAU);ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(14,0);ctx.stroke();ctx.restore()}
ctx.restore();ctx.beginPath();ctx.arc(0,-40,52,0,TAU);ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.stroke();ctx.beginPath();ctx.arc(-6,-48,34,PI*1.08,PI*1.42);ctx.strokeStyle='#fff';ctx.lineWidth=7;ctx.lineCap='round';ctx.stroke();ctx.lineCap='butt';
ctx.fillStyle='#e5402b';ctx.fillRect(-52,-2,104,92);ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.strokeRect(-52,-2,104,92);ctx.fillStyle='#ffd91a';ctx.fillRect(-58,-8,116,16);ctx.strokeRect(-58,-8,116,16);
ctx.save();ctx.translate(0,36);ctx.rotate(now*1.5);ctx.beginPath();ctx.arc(0,0,20,0,TAU);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=5;ctx.stroke();ctx.fillStyle=INK;ctx.fillRect(-18,-5,36,10);ctx.restore();
ctx.fillStyle=INK;ctx.fillRect(-24,66,48,18);ctx.beginPath();ctx.arc(10,78,8,PI,TAU);ctx.fillStyle='#ffd91a';ctx.fill();ctx.fillStyle=INK;ctx.fillRect(28,10,14,4);ctx.restore()}
// level pips ◆◆◇ (filled = in use, half = waiting in the settings)
function gaPips(x,y,id,s){const lv=WS.own[id]?wpLv(id):0,all=wpLvAll(id);s=s||1;for(let i=0;i<3;i++){const cx=x+i*22*s;ctx.save();ctx.translate(cx,y);ctx.rotate(PI/4);ctx.fillStyle=i<lv?'#ffd91a':i<all?'#ffb3a8':'#d0d3e2';ctx.fillRect(-7*s,-7*s,14*s,14*s);ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.strokeRect(-7*s,-7*s,14*s,14*s);ctx.restore()}}
// picture contained in a box (centre cx,cy), with a float
function gaPic(id,cx,cy,bw,bh,k){const im=gaImg(id);if(!im){txt('…',cx,cy,40,INK);return}const s=Math.min(bw/im.naturalWidth,bh/im.naturalHeight)*(k==null?1:k),w=im.naturalWidth*s,h=im.naturalHeight*s;ctx.drawImage(im,cx-w/2,cy-h/2,w,h)}
function gaRays(cx,cy,R,n,c1,a,rot){ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);ctx.globalAlpha=a;ctx.fillStyle=c1;ctx.beginPath();for(let i=0;i<n;i++){const a0=i/n*TAU,a1=(i+0.5)/n*TAU;ctx.moveTo(0,0);ctx.lineTo(Math.cos(a0)*R,Math.sin(a0)*R);ctx.lineTo(Math.cos(a1)*R,Math.sin(a1)*R)}ctx.fill();ctx.restore()}
// ---- main menu button ----
function gaMenuBtn(x,y,w,h){B(x,y,w,h,null,openGacha,{col:'#fff3b0',sk:10});ctx.save();ctx.beginPath();para(x,y,w,h,10);ctx.clip();gaRays(x+w/2+5,y+h*0.42,w,14,'#ffd91a',0.6,now*0.3);ctx.restore();para(x,y,w,h,10);ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();
gaMachine(x+w/2+5,y+h*0.42,0.92);txt('ガチャ',x+w/2+5,y+h-30,34,'#fff',INK,8);
if(GA.f>0){ctx.save();ctx.translate(x+w-8,y+10);ctx.rotate(0.12);const s=1+0.06*Math.sin(now*8);ctx.scale(s,s);burstPath(3,4,50,26,10,1.25,5);ctx.fillStyle=INK;ctx.fill();burstPath(0,0,50,26,10,1.25,5);ctx.fillStyle='#e5402b';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();gaFuda(-22,0,0.62,-0.2);txt('×'+GA.f,14,1,22,'#fff',INK,5);ctx.restore()}}
// small ! on the gear while level-ups are waiting
function gaUpBadge(x,y){let n=0;for(const id of GA_IDS)if(WS.own[id]&&wpLv(id)<3)n+=WS.up[id]|0;if(!n)return;ctx.beginPath();ctx.arc(x,y,15,0,TAU);ctx.fillStyle='#e5402b';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();txt('!',x,y+1,20,'#fff')}
// ---- result screen: the コマ札 of this clear ----
function gaRewardCard(u){if(G.fuda==null)return;const k=easeBack(sat(u/0.25));ctx.save();ctx.translate(1158,62);ctx.rotate(0.06);ctx.scale(k,k);ctx.fillStyle=INK;ctx.fillRect(-86,-38,180,84);ctx.fillStyle='#fff';ctx.fillRect(-92,-44,180,84);ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.strokeRect(-92,-44,180,84);
gaFuda(-58,-2,1.05,-0.15);txt('コマ札',22,-20,20,INK);if(G.fuda>0)txt('＋'+G.fuda,22,14,40,'#e5402b',INK,4);else{txt('受取済み',22,8,20,'#555a70');txt('（各ステージ2回まで）',22,28,12,'#555a70')}ctx.restore()}
// ================= GACHA SCREEN =================
const GC={x:40,y:196,w:530,h:412};// the weapon card
function drawGacha(dt){const id=GA_IDS[gaSel],wi=wpIdx(id),w=WPN[wi],own=!!WS.own[id],all=wpLvAll(id),R=gaRates(),pu=GA.pick===id,X=GC.x,Y=GC.y,CW=GC.w,CH=GC.h;
if(gaA){drawGaAnim(dt);return}
// a veil on the left only: the highlight on the right stays clear
const gr=ctx.createLinearGradient(0,0,W*0.62,0);gr.addColorStop(0,'rgba(22,18,31,.62)');gr.addColorStop(0.75,'rgba(22,18,31,.18)');gr.addColorStop(1,'rgba(22,18,31,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
drawLogo(250,70,0.34);head('武器ガチャ');gearBtn(W-86,24);gaUpBadge(W-28,30);
// wallet + where the 札 come from
const wx=W-420,wy=28;para(wx+5,wy+6,300,58,14);ctx.fillStyle=INK;ctx.fill();para(wx,wy,300,58,14);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();gaFuda(wx+44,wy+29,1,-0.15);txt('コマ札',wx+74,wy+30,22,INK,null,0,'left');txt(String(GA.f),wx+272,wy+30,42,'#e5402b',INK,4,'right');
txt('ステージクリアでもらえる',wx+150,wy+82,15,'#fff',INK,5);for(let i=0;i<5;i++){const cx=wx+8+i*60,cy=wy+110,left=2-(GA.paid[i]|0);para(cx,cy-14,54,28,6);ctx.fillStyle=left>0?'#fff':'#9a9db4';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.stroke();txt((i+1)+'面',cx+18,cy+1,13,INK);txt('＋'+(i+1),cx+42,cy+1,13,left>0?'#e5402b':'#555a70')}
txt('各ステージ2回まで（のこり：白）',wx+150,wy+140,13,'#fff',INK,4);
// highlight caption (right side)
const hs=gaDet?9:gaH.spT;if(!gaDet){ctx.save();ctx.translate(W-26,206);ctx.rotate(-0.03);para(-300,-18,300,36,10);ctx.fillStyle=INK;ctx.fill();txt('ハイライト　'+w.name,-150,1,20,'#fff');ctx.restore()}
if(hs<1.7){const k=easeBack(sat(hs/0.2))*sat((1.7-hs)/0.25);ctx.save();ctx.translate(W-180,262);ctx.rotate(-0.07);ctx.scale(k,k);para(-170,-30,330,60,20);ctx.fillStyle=INK;ctx.fill();para(-164,-24,318,48,16);ctx.fillStyle=w.col;ctx.fill();txt('必殺',-118,1,22,'#fff',INK,5);txt(w.sp,30,1,w.sp.length>5?26:32,'#fff',INK,7);ctx.restore()}
// ---- card ----
ctx.fillStyle=INK;ctx.fillRect(X+9,Y+11,CW,CH);ctx.fillStyle='#fff';ctx.fillRect(X,Y,CW,CH);
const PX=X+12,PY=Y+12,PW=CW-24,PH=228;ctx.save();ctx.beginPath();ctx.rect(PX,PY,PW,PH);ctx.clip();ctx.fillStyle=gaCss(w.bg);ctx.fillRect(PX,PY,PW,PH);
gaRays(PX+PW/2,PY+PH/2,PW,18,'#fff',0.55,now*0.2);ctx.globalAlpha=0.16;ctx.fillStyle=dotPat;ctx.fillRect(PX,PY+PH*0.6,PW,PH);ctx.globalAlpha=1;
gaPic(id,PX+PW/2,PY+PH/2+Math.sin(now*2)*5,PW-90,PH-30);ctx.restore();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.strokeRect(PX,PY,PW,PH);
if(pu){ctx.save();ctx.translate(PX+8,PY+8);ctx.rotate(-0.08);para(0,0,150,36,10);ctx.fillStyle='#e5402b';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();txt('ピックアップ',80,19,20,'#fff');ctx.restore()}
txt((gaSel+1)+' / '+GA_IDS.length,PX+PW-14,PY+22,18,INK,'#fff',5,'right');
// ◀ ▶
const arr=(x,dir)=>{const y=PY+PH/2;btns.push({x:x-34,y:y-50,w:68,h:100,cb:()=>gaGo(dir)});ctx.beginPath();ctx.moveTo(x-dir*16+4,y-30+5);ctx.lineTo(x+dir*20+4,y+5);ctx.lineTo(x-dir*16+4,y+30+5);ctx.closePath();ctx.fillStyle=INK;ctx.fill();
 ctx.beginPath();ctx.moveTo(x-dir*16,y-30);ctx.lineTo(x+dir*20,y);ctx.lineTo(x-dir*16,y+30);ctx.closePath();ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke()};
arr(PX+4,-1);arr(PX+PW-4,1);
// name / status
const ny=PY+PH+12;para(X+14,ny,Math.min(CW-40,70+w.name.length*36),50,14);ctx.fillStyle=w.col;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();txt(w.name,X+44,ny+26,34,'#fff',INK,7,'left');txt(w.type,X+CW-20,ny+26,18,'#555a70',null,0,'right');
const sy=ny+76;if(own){txt('所持',X+20,sy,20,INK,null,0,'left');txt('必殺Lv',X+82,sy,18,'#e5402b',null,0,'left');gaPips(X+160,sy,id);if(WS.up[id]>0&&wpLv(id)<3)txt('強化待ち＋'+WS.up[id],X+232,sy,16,'#e5402b',null,0,'left')}
else txt('未入手',X+20,sy,22,'#555a70',null,0,'left');
txt(all>=3?'必殺Lv最大（もう出ません）':'出る確率 '+((R[id]||0)*100).toFixed(1)+'%',X+CW-20,sy,18,all>=3?'#555a70':INK,null,0,'right');
const by=Y+CH-58,canPick=all<3;B(X+14,by,262,46,pu?'ピックアップ中':'ピックアップにする',canPick&&!pu?()=>{GA.pick=id;gaSave();snd('item')}:null,{col:pu?'#ffd91a':canPick?'#ff4a3d':'#d8d8e0',tc:!pu&&canPick?'#fff':INK,size:pu?22:21,sk:10});
B(X+296,by,110,46,gaDet?'閉じる':'詳細',()=>{gaDet=gaDet?0:1},{col:gaDet?'#59d8ff':'#fff',size:24,sk:10});B(X+420,by,96,46,'装備',()=>openEquip('gacha'),{col:'#ffb35a',size:22,sk:10});
txt('ピックアップ '+(GA_PU*100)+'%・ほかの武器は同じ確率',420,656,16,'#fff',INK,5);
// ---- pull buttons ----
const c1=GA.f>=1,c6=GA.f>=5,pb=(x,w,n,cost,ok,col)=>{B(x,612,w,74,null,()=>gaPull(n,cost),{col:ok?col:'#c9c9d2',sk:14});txt(n+'回ひく',x+w*0.4,646,36,ok?'#fff':'#8a8a99',ok?INK:null,7);gaFuda(x+w-88,650,0.95,-0.15);txt('×'+cost,x+w-40,652,28,ok?INK:'#8a8a99')};
pb(620,280,1,1,c1,'#ff4a3d');pb(926,314,6,5,c6,'#e5402b');
ctx.save();ctx.translate(1188,606);ctx.rotate(0.14);const bs=1+0.05*Math.sin(now*7);ctx.scale(bs,bs);burstPath(3,4,72,24,10,1.25,8);ctx.fillStyle=INK;ctx.fill();burstPath(0,0,72,24,10,1.25,8);ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();txt('１回おまけ！',0,1,17,'#e5402b');ctx.restore();
B(60,628,200,56,'もどる',closeGacha,{size:26});
if(gaMsg&&now-gaMsg.t<2.6){const a=sat((2.6-(now-gaMsg.t))/0.3);ctx.globalAlpha=a;para(560,560,700,40,12);ctx.fillStyle=INK;ctx.fill();fitTxt(gaMsg.s,900,581,20,640,'#fff','center');ctx.globalAlpha=1}
if(gaDet)gaDetail(w,id)}
// details: what the weapon does + 必殺Lv table (right side, over the highlight)
function gaDetail(w,id){const X=600,Y=232,PW=640,PH=362;btns.push({x:X,y:Y,w:PW,h:PH,cb:()=>{}});panel(X,Y,PW,PH);para(X+16,Y-24,280,46,14);ctx.fillStyle=w.col;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();txt(w.name+'の詳細',X+40,Y,24,'#fff',INK,6,'left');
const tag=(x,y,s,col)=>{para(x,y-15,60,30,8);ctx.fillStyle=col;ctx.fill();txt(s,x+33,y+1,17,'#fff')};
tag(X+20,Y+48,'通常',INK);fitTxt(w.d[0],X+94,Y+48,21,PW-114,INK);fitTxt(w.d[1],X+94,Y+80,18,PW-114,'#3a3f55');
tag(X+20,Y+126,'必殺','#e5402b');txt(w.sp,X+94,Y+124,26,'#e5402b',null,0,'left');fitTxt(w.s,X+94,Y+156,18,PW-114,INK);
const lv=WS.own[id]?wpLv(id):0;ctx.fillStyle='rgba(22,18,31,.15)';ctx.fillRect(X+20,Y+184,PW-40,2);txt('必殺レベル',X+24,Y+210,20,INK,null,0,'left');txt('ガチャで同じ武器が出ると上げられる（設定の「武器の強化」で）',X+PW-20,Y+210,14,'#555a70',null,0,'right');
for(let l=1;l<=3;l++){const y=Y+214+l*36,on=l===lv;if(on){ctx.fillStyle='#fff3b0';ctx.fillRect(X+20,y-16,PW-40,32)}txt('Lv'+l,X+34,y,22,on?'#e5402b':INK,null,0,'left');txt(l===1?'標準':SPLV_T[l-1],X+110,y,19,INK,null,0,'left');if(on)txt('いまのレベル',X+PW-30,y,16,'#e5402b',null,0,'right')}
B(X+PW-176,Y+PH-58,150,44,'性能表',()=>{gaDet=gaDet===2?1:2},{size:20,sk:8,col:gaDet===2?'#59d8ff':'#fff'});
if(gaDet===2)drawEqDet(w,X,Y,PW,PH-70)}
// ================= DRAW ANIMATION =================
// one result at a time: a sealed manga panel (コマ) shakes and cracks (glow = gold for the pickup, rainbow for a new weapon), shatters,
// and the weapon is revealed; 6 pulls end on a summary page. Tap = speed up / next.
const GA_PNL={w:440,h:300,rot:-0.04};
function gaCrack(){const r=mulberry((Math.random()*1e9)|0),w=GA_PNL.w,h=GA_PNL.h,P=[],side=(x0,y0,x1,y1,k)=>{P.push([x0,y0]);for(let i=1;i<=k;i++){const u=(i-0.5+r()*0.8)/(k+0.2);P.push([x0+(x1-x0)*u,y0+(y1-y0)*u])}};
side(-w/2,-h/2,w/2,-h/2,4);side(w/2,-h/2,w/2,h/2,3);side(w/2,h/2,-w/2,h/2,4);side(-w/2,h/2,-w/2,-h/2,3);
gaA.c=[(r()-0.5)*w*0.3,(r()-0.5)*h*0.3];gaA.P=P;gaA.sh=null;gaA.cr=P.map(p=>{const pts=[gaA.c.slice()],n=4;for(let i=1;i<=n;i++){const u=i/n;pts.push([gaA.c[0]+(p[0]-gaA.c[0])*u+(i<n?(r()-0.5)*26:0),gaA.c[1]+(p[1]-gaA.c[1])*u+(i<n?(r()-0.5)*26:0)])}return pts})}
function gaBreak(){const A=gaA,c=A.c,P=A.P,S=[];for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],s1=[(c[0]+a[0])/2,(c[1]+a[1])/2],s2=[(c[0]+b[0])/2,(c[1]+b[1])/2];
 for(const poly of[[c,s1,s2],[s1,a,b,s2]]){const cx=poly.reduce((s,p)=>s+p[0],0)/poly.length,cy=poly.reduce((s,p)=>s+p[1],0)/poly.length,d=Math.hypot(cx-c[0],cy-c[1])||1;
  S.push({p:poly.map(q=>[q[0]-cx,q[1]-cy]),x:cx,y:cy,vx:(cx-c[0])/d*rnd(500,1000),vy:(cy-c[1])/d*rnd(400,900)-300,r:0,vr:rnd(-7,7),tone:Math.random()<0.4})}}A.sh=S}
const gaCur=()=>gaA&&gaA.res[Math.min(gaA.i,gaA.res.length-1)];
function gaGlow(r){return r.pu?'#ffd91a':r.k==='new'?'hsl('+((now*420)%360)+',100%,62%)':WPN[wpIdx(r.id)].col}
const gaChargeT=()=>gaA.multi&&gaA.i>0?1.0:1.6;
function gaAnimUpdate(dt){const A=gaA;if(!A)return;A.t+=dt;if(A.ph===0){const T=gaChargeT();if(A.t>T*0.45&&!A.k1){A.k1=1;snd('clank')}if(A.t>T*0.75&&!A.k2){A.k2=1;snd('clank')}
 if(A.t>=T){A.ph=1;A.t=0;A.k1=A.k2=0;gaBreak();const r=gaCur();snd('boom',1.3);snd('item');if(r.pu||r.k==='new')snd('charge');flash(0.35)}}
if(A.sh)for(const s of A.sh){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=1500*dt;s.r+=s.vr*dt}}
function gaTap(){const A=gaA;if(!A)return;if(A.ph===0){A.t=Math.max(A.t,gaChargeT()-0.15);return}
if(A.ph===1&&A.t>0.45){if(A.i<A.res.length-1){A.i++;A.ph=0;A.t=0;A.sh=null;gaCrack();snd('charge')}else if(A.multi){A.ph=2;A.t=0;snd('ui')}}}
function gaAnimClose(){gaA=null;snd('ui')}
function drawGaAnim(dt){const A=gaA,r=gaCur(),w=WPN[wpIdx(r.id)],t=A.t;btns.push({x:0,y:0,w:W,h:H,cb:gaTap});
if(A.ph===2){drawGaSum();return}
ctx.fillStyle=A.ph===0?'#16121f':gaCss(w.bg);ctx.fillRect(0,0,W,H);
if(A.ph===0){const T=gaChargeT(),u=sat(t/T),gc=gaGlow(r);ctx.globalAlpha=0.25;ctx.fillStyle=dotPat;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
 if(u>0.3)gaRays(W/2,H/2,900,20,gc,0.35*sat((u-0.3)/0.3),now*(0.5+u*2));focusLines(W/2,H/2,300-u*80,60,'rgba(255,255,255,.75)',((now*12)|0)+5);
 ctx.save();ctx.font='900 64px '+FONT;vtxt(['ゴゴゴゴ'],120,H/2,64+u*20,'#fff');vtxt(['ゴゴゴゴ'],W-120,H/2,64+u*20,'#fff');ctx.restore();
 const sh=u*u*10,P=GA_PNL;ctx.save();ctx.translate(W/2+rnd(-sh,sh),H/2-10+rnd(-sh,sh));ctx.rotate(P.rot);const sc=u>0.9?1+(u-0.9)*0.6:easeBack(sat(t/0.25));ctx.scale(sc,sc);
 ctx.shadowColor=gc;ctx.shadowBlur=20+u*40;ctx.fillStyle='#fff';ctx.fillRect(-P.w/2,-P.h/2,P.w,P.h);ctx.shadowBlur=0;ctx.save();ctx.beginPath();ctx.rect(-P.w/2,-P.h/2,P.w,P.h);ctx.clip();ctx.globalAlpha=0.2;ctx.fillStyle=dotPat;ctx.fillRect(-P.w/2,0,P.w,P.h);ctx.globalAlpha=1;
 focusLines(0,0,90,40,'rgba(22,18,31,.35)',7);ctx.restore();ctx.strokeStyle=INK;ctx.lineWidth=8;ctx.strokeRect(-P.w/2,-P.h/2,P.w,P.h);txt('？',0,6,190,INK,gc,10);
 const g=sat((u-0.35)/0.55);if(g>0)for(const[lw,col]of[[9,INK],[4,gc]]){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.lineJoin='miter';ctx.beginPath();for(const L of A.cr){const n=Math.ceil(g*(L.length-1));ctx.moveTo(L[0][0],L[0][1]);for(let i=1;i<=n;i++)ctx.lineTo(L[i][0],L[i][1])}ctx.stroke()}
 ctx.restore();if(r.pu&&u>0.6){const k=easeBack(sat((u-0.6)/0.15));ctx.save();ctx.translate(W/2,96);ctx.rotate(-0.06);ctx.scale(k,k);txt('激アツ！！',0,0,84,'#ffd91a',INK,14,'center','#fff',26);ctx.restore()}
 if(A.multi)txt((A.i+1)+' / '+A.res.length,W-120,60,30,'#fff',INK,6);}
else{// reveal
 gaRays(W/2,H/2-30,1100,22,'#fff',0.6,now*0.15);if(r.pu)gaRays(W/2,H/2-30,1100,22,'#ffd91a',0.35,-now*0.1);ctx.globalAlpha=0.15;ctx.fillStyle=dotPat;ctx.fillRect(0,H*0.62,W,H);ctx.globalAlpha=1;focusLines(W/2,H/2-30,330,56,'rgba(22,18,31,.5)',((now*6)|0)+3);
 const k=easeBack(sat(t/0.35));gaPic(r.id,W/2,H/2-40+Math.sin(now*2.2)*6,700,400,k);
 if(t>0.25){const k2=easeBack(sat((t-0.25)/0.2));ctx.save();ctx.translate(W/2,566);ctx.rotate(-0.03);ctx.scale(k2,k2);para(-300,-44,600,88,30);ctx.fillStyle=INK;ctx.fill();para(-290,-36,580,72,24);ctx.fillStyle=w.col;ctx.fill();txt(w.name,0,2,58,'#fff',INK,10);txt(w.type,240,30,16,'#fff',INK,4);ctx.restore()}
 if(t>0.4){const k3=easeBack(sat((t-0.4)/0.2)),nw=r.k==='new';ctx.save();ctx.translate(W/2+380,170);ctx.rotate(0.12);ctx.scale(k3,k3);burstPath(5,7,nw?130:170,nw?66:74,14,1.25,4);ctx.fillStyle=INK;ctx.fill();burstPath(0,0,nw?130:170,nw?66:74,14,1.25,4);ctx.fillStyle=nw?'#e5402b':'#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();
  if(nw)txt('NEW!',0,2,72,'#fff',INK,10);else{txt('必殺Lv UP!',0,-16,40,'#e5402b',INK,4,'center','#fff',10);txt('Lv'+r.was+' → Lv'+r.lv,0,26,28,INK)}ctx.restore();
  if(!nw&&t>0.6){ctx.globalAlpha=sat((t-0.6)/0.2);para(W/2-330,622,660,40,12);ctx.fillStyle=INK;ctx.fill();txt('設定の「武器の強化」で必殺レベルを上げよう',W/2+6,643,22,'#ffd91a');ctx.globalAlpha=1}}
 if(r.pu&&t>0.3){ctx.save();ctx.translate(170,120);ctx.rotate(-0.1);para(-120,-26,240,52,14);ctx.fillStyle='#e5402b';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();txt('ピックアップ！',4,1,26,'#fff');ctx.restore()}
 if(A.sh&&t<0.75){ctx.save();ctx.translate(W/2,H/2-10);ctx.rotate(GA_PNL.rot);ctx.globalAlpha=sat((0.75-t)/0.35);for(const s of A.sh){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.r);ctx.beginPath();s.p.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fillStyle='#fff';ctx.fill();if(s.tone){ctx.save();ctx.clip();ctx.globalAlpha*=0.3;ctx.fillStyle=dotPat;ctx.fillRect(-200,-200,400,400);ctx.restore()}ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();ctx.restore()}ctx.restore()}
 if(t<0.3){ctx.fillStyle='rgba(255,255,255,'+(1-t/0.3)+')';ctx.fillRect(0,0,W,H)}
 if(t<0.6){const k4=easeOut(sat(t/0.15));ctx.save();ctx.globalAlpha=sat((0.6-t)/0.2);ctx.translate(W/2-300,H/2-160);ctx.rotate(-0.15);ctx.scale(k4,k4);txt('ドン！',0,0,120,'#fff',INK,16,'center','#e5402b',30);ctx.restore()}
 if(A.multi){txt((A.i+1)+' / '+A.res.length,W-120,60,30,INK,'#fff',6);if(t>0.45&&Math.sin(now*6)>-0.4)txt(A.i<A.res.length-1?'タップで次へ':'タップで結果へ',W/2,690,22,'#fff',INK,6)}
 else if(t>0.5){const more=GA.f>=1&&gaRoom()>=1;B(W/2-(more?330:150),628,300,62,'とじる',gaAnimClose,{size:30});if(more)B(W/2+30,628,300,62,'もう１回ひく',()=>{gaA=null;gaPull(1,1)},{col:'#ff4a3d',tc:'#fff',size:28})}}
if(A.multi&&A.ph<2)B(W-230,628,170,52,'スキップ',()=>{A.ph=2;A.t=0;A.i=A.res.length-1},{size:24,sk:10})}
// the 6-pull summary
function drawGaSum(){const A=gaA,t=A.t;ctx.fillStyle='rgba(22,18,31,.88)';ctx.fillRect(0,0,W,H);focusLines(W/2,H/2,420,50,'rgba(255,255,255,.12)',9);
ctx.save();ctx.translate(W/2,70);ctx.rotate(-0.03);burstPath(4,6,240,44,16,1.2,3);ctx.fillStyle=INK;ctx.fill();burstPath(0,0,240,44,16,1.2,3);ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();txt('ガチャ結果',0,2,46,'#e5402b',INK,4);ctx.restore();
let ups=0;A.res.forEach((r,i)=>{const w=WPN[wpIdx(r.id)],c=i%3,rw=(i/3)|0,cw=360,ch=218,x=W/2-(3*cw+2*28)/2+c*(cw+28),y=122+rw*(ch+20),k=easeBack(sat((t-i*0.08)/0.25));if(r.k!=='new')ups++;if(k<=0)return;
 ctx.save();ctx.translate(x+cw/2,y+ch/2);ctx.scale(k,k);ctx.fillStyle=INK;ctx.fillRect(-cw/2+7,-ch/2+8,cw,ch);ctx.fillStyle=gaCss(w.bg);ctx.fillRect(-cw/2,-ch/2,cw,ch);ctx.save();ctx.beginPath();ctx.rect(-cw/2,-ch/2,cw,ch);ctx.clip();gaRays(0,-20,cw,14,'#fff',0.6,now*0.2+i);ctx.restore();
 gaPic(r.id,0,-22,cw-40,ch-80);ctx.strokeStyle=r.pu?'#ffd91a':INK;ctx.lineWidth=r.pu?8:5;ctx.strokeRect(-cw/2,-ch/2,cw,ch);if(r.pu){ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.strokeRect(-cw/2-4,-ch/2-4,cw+8,ch+8)}
 para(-cw/2+10,ch/2-50,cw-30,40,12);ctx.fillStyle=w.col;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();fitTxt(w.name,-cw/2+30,ch/2-29,26,170,'#fff');
 if(r.k==='new'){ctx.save();ctx.translate(cw/2-60,-ch/2+24);ctx.rotate(0.15);burstPath(0,0,58,26,10,1.25,4);ctx.fillStyle='#e5402b';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();txt('NEW!',0,1,28,'#fff',INK,4);ctx.restore()}
 else txt('必殺Lv'+r.was+'→'+r.lv,cw/2-24,ch/2-29,18,'#fff',INK,5,'right');
 if(r.pu){para(-cw/2-6,-ch/2-12,104,28,8);ctx.fillStyle='#e5402b';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.stroke();txt('PICK UP',-cw/2+50,-ch/2+3,15,'#fff')}ctx.restore()});
if(t>0.6){if(ups)txt('重なった武器は、設定の「武器の強化」で必殺レベルを上げられます',W/2,606,20,'#ffd91a',INK,6);B(W/2-150,642,300,58,'とじる',gaAnimClose,{col:'#ffd91a',size:30})}}
// ================= 3D HIGHLIGHT (behind the gacha screen) =================
// The hero stands on open ground (GH) and loops a short show with the browsed weapon: normal attacks, then the special.
// Bombs / sword waves / fire use the shared visual lists of weapons.js with own:0 (no damage); wpWorld ticks them.
const GH={x:0,z:14,yaw:0},GA_PER=6.4;
const gaH={id:null,t:0,acc:0,beam:0,spT:9,vy:0,o:{slot:0,x:0,y:0,z:0,yaw:0,pitch:0.04,wt:0,mv:0,dead:false,flash:0,fireT:0,sp:0,wp:0,ak:0,at:9,hc:null,bombs:3,gx:0,gy:1.4,gz:0}};
const gaOn=()=>G.state==='menu'&&G.menu==='gacha';
function gaCam(){if(!gaOn())return false;const Y=GH.yaw,fx=-Math.sin(Y),fz=-Math.cos(Y),rx=Math.cos(Y),rz=-Math.sin(Y),th=0.6,d=4.1,cth=Math.cos(th),sth=Math.sin(th);
const cx=GH.x+(rx*cth+fx*sth)*d,cz=GH.z+(rz*cth+fz*sth)*d,cy=1.45,dx=GH.x-cx,dy=1.05-cy,dz=GH.z-cz,s=trauma*trauma;
cam.x=cx;cam.y=cy;cam.z=cz;cam.yaw=Math.atan2(-dx,-dz)+0.36+Math.sin(now*0.35)*0.02+rnd(-1,1)*s*0.03;cam.pitch=Math.atan2(dy,Math.hypot(dx,dz))+0.02+rnd(-1,1)*s*0.03;cam.roll=0.035;cam.fov=52*PI/180;return true}
function gaUpdate(dt){if(!gaOn())return;if(gaA){gaAnimUpdate(RDT);return}if(setOpen)return;const v=sndVol;sndVol=v*0.35;try{gaHi(dt);wpWorld(dt)}finally{sndVol=v}}
function gaHi(dt){const id=GA_IDS[gaSel],wi=wpIdx(id),w=WPN[wi],o=gaH.o,Y=GH.yaw,F=[-Math.sin(Y),0,-Math.cos(Y)];
if(gaH.id!==id){gaH.id=id;gaH.t=0;gaH.acc=0;gaH.beam=0;gaH.spT=9;gaH.vy=0;wpReset();Object.assign(o,{wp:wi,ak:0,at:9,hc:null,bombs:3,y:0,fireT:0})}
o.x=GH.x;o.z=GH.z;o.yaw=Y;o.wt+=dt;o.at+=dt;o.fireT-=dt;gaH.spT+=dt;
let t0=gaH.t;gaH.t+=dt;let t=gaH.t;if(t>=GA_PER){gaH.t=t-=GA_PER;t0-=GA_PER}const at=a=>t0<a&&t>=a,sp=a=>{if(at(a)){gaH.spT=0;flash(0.25)}};
const mz=()=>[o.gx,o.gy,o.gz],end=(L,spr)=>{const d=v3n([F[0]+rnd(-spr,spr),rnd(-spr,spr)*0.6+0.02,F[2]+rnd(-spr,spr)]),m=mz(),T=rayWorld(m[0],m[1],m[2],d[0],d[1],d[2],L);return[m[0]+d[0]*T,m[1]+d[1]*T,m[2]+d[2]*T,T<L]};
const tracer=(spr,c,wd)=>{const m=mz(),e=end(26,spr);fxTracer(m[0],m[1],m[2],e[0],e[1],e[2],c,wd);if(e[3])fxSparks(e[0],e[1],e[2],2,4,c)};
gaH.beam=0;
if(w.kind==='gun'&&!w.pel){const spc=t>3.7&&t<5.6,fire=spc||(t>0.3&&t<1.5)||(t>2.0&&t<3.2);sp(3.7);if(at(3.7)){sfxAt('ダダダダダッ！',o.x+F[0]*3,1.56,o.z+F[2]*3,{size:70,st:'cyan',life:0.8});lines(0.3,'#fff')}
 if(fire){gaH.acc+=dt*(spc?14:7);while(gaH.acc>=1){gaH.acc--;o.fireT=0.05;tracer(spc?0.05:0.025,spc?C.cyan:C.white,spc?0.07:0.05);snd('rshot');fxStar(o.gx,o.gy,o.gz,0.5,spc?C.cyan:C.yellow,0.05)}}else gaH.acc=0;
 if(fire&&lim('gaTx',0.9)&&!spc)sfxAt(pick(['ダダダッ','バババッ']),o.x+F[0]*2,1.44,o.z+F[2]*2,{size:46,st:'fire',life:0.35})}
else if(w.kind==='gun'){for(const a of[0.4,1.3,2.2,3.1])if(at(a)){o.fireT=0.08;for(let i=0;i<w.pel;i++)tracer(0.09,i%2?C.sakura:C.white,0.06);fxSparks(o.gx,o.gy,o.gz,8,6,C.sakura);fxStar(o.gx+F[0]*0.8,o.gy,o.gz+F[2]*0.8,0.6,C.sakura,0.08);snd('sgun');sfxAt(pick(['ズドン！','ドゴン！']),o.x+F[0]*2.5,1.44,o.z+F[2]*2.5,{size:52,st:'fire',life:0.3})}
 sp(4.3);if(at(4.3)){o.fireT=0.1;for(let i=0;i<36;i++)tracer(0.36,i%3?C.sakura:C.white,0.08);fxSparks(o.gx,o.gy,o.gz,24,10,C.sakura);fxStar(o.gx+F[0]*1.5,o.gy,o.gz+F[2]*1.5,1.3,C.sakura,0.1);snd('sgun');snd('boom',1.4);shake(0.5);sfxAt('ズドドドン！',o.x+F[0]*3,1.68,o.z+F[2]*3,{size:80,st:'boom',life:0.8})}}
else if(w.kind==='rail'){if(t>0.3&&t<2.6)gaH.beam=1;if(t>3.6&&t<5.8)gaH.beam=2;sp(3.6);if(at(3.6)){snd('freeze');sfxAt('パキィィン！',o.x+F[0]*3,1.68,o.z+F[2]*3,{size:76,st:'cyan',life:0.8})}
 if(gaH.beam){if(lim('gaZap',0.09))snd('zap');const e=end(40,0);gaH.end=e;if(e[3]&&lim('gaRs',0.08))fxSparks(e[0],e[1],e[2],3,5,gaH.beam===2?C.white:C.cyan);if(gaH.beam===2)lines(0.2,'#bfefff')}}
else if(w.kind==='katana'){[0.2,0.85,1.5,2.15,2.8].forEach((a,i)=>{if(at(a)){o.ak=i%2?2:1;o.at=0;wslash.push({x:o.x,y:1.15,z:o.z,yaw:Y,dir:i%2?-1:1,t:0});snd('slash');if(i%2)sfxAt(pick(['ザンッ！','ズバッ！']),o.x+F[0]*2,1.44,o.z+F[2]*2,{size:50,st:'cyan',life:0.3})}});
 sp(3.8);if(at(3.8)){o.ak=7;o.at=0}if(at(4.05)){wwaves.push({x:o.x,y:1.3,z:o.z,dx:F[0],dz:F[2],d:0.5,t:0,own:0});snd('slash');snd('boom',1.2);flash(0.4);shake(0.5);sfxAt('ズバァァン！',o.x+F[0]*3,1.8,o.z+F[2]*3,{size:84,st:'cyan',life:0.9})}}
else if(w.kind==='hammer'){const ch=(a,b,c)=>{if(at(a)){o.ak=3;o.at=0}if(t>=a&&t<b)o.hc=c*sat((t-a)/(b-a));if(at(b)){o.ak=4;o.at=0;o.hc=null;snd('whoosh')}if(at(b+0.12))hammerFx(o.x+F[0]*2.1,o.z+F[2]*2.1,2.8+3.4*c,c)};
 ch(0.2,1.3,1);ch(2.0,2.5,0.35);sp(3.5);if(at(3.5)){o.ak=8;o.at=0;o.hc=null;gaH.vy=7;snd('jump');sfxAt('ハァァッ！',o.x,2.04,o.z,{size:64,st:'boom',life:0.5})}
 if(at(3.92)){gaH.vy=-26}if(gaH.vy||o.y>0){gaH.vy-=22*dt;o.y=Math.max(0,o.y+gaH.vy*dt);if(o.y<=0&&gaH.vy<0){gaH.vy=0;if(t>3.9&&t<4.6)komaFx(o.x,o.z,0)}}}
else if(w.kind==='bomb'){const toss=(a,big)=>{if(at(a)){o.ak=big?6:5;o.at=0;snd('whoosh')}if(at(a+0.18)){const s=big?7.5:9.5;wbombs.push({x:o.gx,y:o.gy,z:o.gz,vx:F[0]*s,vy:big?8:6.5,vz:F[2]*s,big:big?1:0,own:0,t:0,rot:0});if(!big)o.bombs=Math.max(0,o.bombs-1)}};
 toss(0.3,0);toss(1.15,0);toss(2.0,0);if(at(3.0))o.bombs=3;sp(3.6);toss(3.6,1);if(at(3.6))sfxAt('ヒュルル…',o.x+F[0]*2,1.8,o.z+F[2]*2,{size:60,st:'boom',life:0.5})}}
function gaDraw3d(){if(!gaOn())return;const o=gaH.o;drawHero(o);if(gaH.beam&&gaH.end&&!gaA)railBeam([o.gx,o.gy,o.gz],gaH.end,gaH.beam===2)}
// ================= SETTINGS:「武器の強化」tab (drawSettings, setTab 1) =================
let wpUpPop=null;
function drawWpUp(){const X=180,Y=150;txt('ガチャで同じ武器が出ると「強化待ち」が増えます。ここで必殺レベルを上げよう（最大Lv3）',640,Y+4,18,INK);
GA_IDS.forEach((id,i)=>{const w=WPN[wpIdx(id)],own=!!WS.own[id],lv=own?wpLv(id):0,up=WS.up[id]|0,y=Y+32+i*72,can=own&&up>0&&lv<3;
 ctx.fillStyle=own?'#fff':'#e4e5ee';ctx.fillRect(X,y,920,62);ctx.fillStyle=own?w.col:'#9a9db4';ctx.fillRect(X,y,14,62);ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.strokeRect(X,y,920,62);
 const im=own&&gaImg(id);if(im){ctx.save();ctx.beginPath();ctx.rect(X+16,y+2,96,58);ctx.clip();gaPic(id,X+64,y+31,92,56);ctx.restore()}
 fitTxt(own?w.name:'？？？',X+124,y+22,24,170,own?INK:'#8a8a99');txt(own?'必殺 '+w.sp:'未入手（武器ガチャで手に入る）',X+124,y+46,14,'#555a70',null,0,'left');
 if(own){txt('必殺Lv'+lv,X+330,y+21,18,'#e5402b',null,0,'left');gaPips(X+430,y+21,id);txt(lv>=3?'最大レベル':'次のLv：'+SPLV_T[lv],X+330,y+46,14,lv>=3?'#e5402b':'#3a3f55',null,0,'left');
  txt(up>0&&lv<3?'強化待ち ×'+up:'',X+700,y+31,18,'#e5402b',null,0,'right')}
 B(X+720,y+8,180,46,!own?'未入手':lv>=3?'最大':can?'強化する':'重ねると強化',can?()=>{if(wpLvUp(id)){snd('item');wpUpPop={id,t:now};skApply()}}:null,{col:can?'#ff4a3d':lv>=3?'#ffd91a':'#d8d8e0',tc:can?'#fff':INK,size:can?24:lv>=3?24:17,sk:8});
 if(wpUpPop&&wpUpPop.id===id&&now-wpUpPop.t<0.9){const u=now-wpUpPop.t,k=easeBack(sat(u/0.15));ctx.save();ctx.globalAlpha=sat((0.9-u)/0.25);ctx.translate(X+600,y+28);ctx.rotate(-0.08);ctx.scale(k,k);burstPath(3,4,130,34,12,1.25,7);ctx.fillStyle=INK;ctx.fill();burstPath(0,0,130,34,12,1.25,7);ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();txt('必殺Lv'+wpLv(id)+'！',0,2,30,'#e5402b',INK,4);ctx.restore()}});
txt('Lv2：'+SPLV_T[1]+'　　Lv3：'+SPLV_T[2]+'（必殺の威力と、時間のある必殺の長さ）',640,Y+484,16,'#555a70')}
function wpUpN(){let n=0;for(const id of GA_IDS)if(WS.own[id]&&wpLv(id)<3)n+=WS.up[id]|0;return n}
