'use strict';
// ================= SETTINGS / RESULT (v3) =================
const SET={sens:1,se:0.8,bgm:0.8,size:1,lh:0,inv:1,view:0};try{Object.assign(SET,JSON.parse(localStorage.getItem('koma_set')||'{}'))}catch(e){}
const BTN0=JSON.parse(JSON.stringify(BTN));let setOpen=false;
// SET.lay: custom button layout {key:{x,y,s}} in right-handed screen coords (mirrored when SET.lh); null = default layout
function applySet(){const sc=SET.size,L=SET.lay;for(const k in BTN){const b0=BTN0[k],b=BTN[k],c=L&&L[k];if(c){b.x=SET.lh?W-c.x:c.x;b.y=c.y;b.r=b0.r*sc*(c.s||1)}else{const x=W-(W-b0.x)*sc;b.y=H-(H-b0.y)*sc;b.r=b0.r*sc;b.x=SET.lh?W-x:x}}touch.hx=SET.lh?W-150:150;touch.hy=560;if(touch.sid===null){touch.ox=touch.hx;touch.oy=touch.hy}if(musG)musG.gain.value=0.3*SET.bgm;try{localStorage.setItem('koma_set',JSON.stringify(SET))}catch(e){}}
applySet();
function openSet(){setOpen=true;layEdit=false}
// dev cheat: tap the 「設定」 title 10 times -> super strong, invincible
let devTap=0,devT=0;
function devToggle(){DEV=DEV?0:1;skApply();if(typeof pl!=='undefined'&&!pl.dead&&G.state!=='menu')pl.hp=Math.min(pl.hp,SK.hp);if(DEV&&G.state!=='menu')pl.hp=SK.hp;snd('item');addText(DEV?'超強化 ON':'超強化 OFF',W/2,H*0.4,{size:90,st:'boom',life:1.2})}
let devOpen=false;// the dev menu in the settings appears only after the 10 taps
function devTapTitle(){if(now-devT>3)devTap=0;devT=now;devTap++;if(devTap<10)return;devTap=0;devOpen=!devOpen;if(!devOpen&&DEV)devToggle();snd('item');addText(devOpen?'開発者メニュー 表示':'開発者メニュー 非表示',W/2,H*0.4,{size:70,st:'boom',life:1.2})}
// dev: jump straight to the boss wave (solo / host only)
function devSkipBoss(){if(isCli()||G.mode==='pvp'||G.state!=='play')return;const last=WAVESET[G.stage].length-1;if(G.wave>=last)return;for(const e of enemies)e.dead=true;G.paused=false;startWave(last)}
// ---- button layout editor ----
let layEdit=false,laySel='fire',layDrag=null,layB0=0;
const LAYN={fire:'撃つ',special:'必殺',jump:'ジャンプ',reload:'装填',dash:'回避'};
function layEnsure(){if(!SET.lay){SET.lay={};for(const k in BTN){const b=BTN[k];SET.lay[k]={x:SET.lh?W-b.x:b.x,y:b.y,s:1}}}return SET.lay}
function layDown(p,id){for(let i=btns.length-1;i>=layB0;i--){const b=btns[i];if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h){snd('ui');b.cb(p);return}}let hit=null,bd=1e9;for(const k in BTN){const b=BTN[k],d=Math.hypot(p.x-b.x,p.y-b.y);if(d<Math.max(b.r*1.15,40)&&d<bd){bd=d;hit=k}}
 if(hit){laySel=hit;layDrag={id,k:hit,ox:BTN[hit].x-p.x,oy:BTN[hit].y-p.y};snd('ui')}}
function layMove(p,id){if(!layDrag||layDrag.id!==id)return;const b=BTN[layDrag.k],L=layEnsure()[layDrag.k];b.x=clamp(p.x+layDrag.ox,b.r*0.6+16,W-b.r*0.6-16);b.y=clamp(p.y+layDrag.oy,b.r*0.6+16,H-b.r*0.6-16);L.x=SET.lh?W-b.x:b.x;L.y=b.y}
function layUp(id){if(layDrag&&layDrag.id===id){layDrag=null;applySet()}}
function laySize(d){const L=layEnsure()[laySel];L.s=clamp(Math.round(((L.s||1)+d)*10)/10,0.6,1.6);applySet()}
function drawLayEdit(){btns.push({x:0,y:0,w:W,h:H,cb:()=>{}});layB0=btns.length;ctx.fillStyle='rgba(22,18,31,.72)';ctx.fillRect(0,0,W,H);ctx.save();ctx.globalAlpha=0.35;ctx.fillStyle='#fff';ctx.fillRect(W*0.42-2,0,4,H);ctx.restore();
txt('ボタンをドラッグして動かせます',W/2,H-40,24,'#fff',INK,6);
for(const k in BTN){const b=BTN[k],sel=k===laySel;if(sel){ctx.beginPath();ctx.arc(b.x,b.y,b.r+12+2*Math.sin(now*8),0,TAU);ctx.strokeStyle='#ffd91a';ctx.lineWidth=8;ctx.stroke()}
 ctx.beginPath();ctx.arc(b.x+4,b.y+6,b.r,0,TAU);ctx.fillStyle=INK;ctx.fill();ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fillStyle=k==='fire'?'#ff4a3d':k==='special'?'#35e0ff':k==='dash'?'#7fd6ff':'#fff';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();
 txt(b.l,b.x,b.y+2,Math.min(b.r*0.62,44)/(b.l.length>1?1.25:1),k==='fire'?'#fff':INK,k==='fire'?INK:null,6)}
const st=touch.hx||150;ctx.beginPath();ctx.arc(st,touch.hy||560,78,0,TAU);ctx.setLineDash([10,8]);ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke();ctx.setLineDash([]);txt('移動スティック',st,(touch.hy||560)-100,20,'#fff',INK,5);
// toolbar
const tx=W/2-330,ty=26;panel(tx,ty,660,128);txt('ボタン配置の編集',tx+20,ty+30,24,INK,null,0,'left');B(tx+222,ty+8,86,46,'戻る',()=>{layEdit=false;layDrag=null;applySet()},{size:22});
txt('選択中：'+LAYN[laySel],tx+20,ty+92,26,'#e5402b',null,0,'left');const sz=SET.lay&&SET.lay[laySel]?SET.lay[laySel].s||1:1;
B(tx+230,ty+64,56,52,'－',()=>laySize(-0.1),{sk:0,size:32});txt('大きさ ×'+sz.toFixed(1),tx+364,ty+92,22,INK);B(tx+440,ty+64,56,52,'＋',()=>laySize(0.1),{sk:0,size:32});
B(tx+316,ty+8,140,46,'初期配置',()=>{SET.lay=null;applySet()},{size:22});B(tx+466,ty+8,172,46,'完了',()=>{layEdit=false;layDrag=null;applySet()},{col:'#ffd91a',size:26});
B(tx+516,ty+68,122,46,'左右反転',()=>{SET.lh=SET.lh?0:1;applySet()},{size:20})}
function toggleFS(){const d=document,el=d.documentElement;try{if(d.fullscreenElement||d.webkitFullscreenElement){(d.exitFullscreen||d.webkitExitFullscreen).call(d)}else{(el.requestFullscreen||el.webkitRequestFullscreen).call(el)}}catch(e){}}
function gearBtn(x,y){btns.push({x,y,w:62,h:62,cb:openSet});ctx.fillStyle=INK;ctx.fillRect(x+5,y+6,62,62);ctx.fillStyle='#fff';ctx.fillRect(x,y,62,62);ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.strokeRect(x,y,62,62);
ctx.save();ctx.translate(x+31,y+31);ctx.rotate(now*0.4);ctx.fillStyle=INK;ctx.beginPath();for(let i=0;i<32;i++){const a=(i+0.5)/32*TAU,r=(i>>1)%2?15:22;i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,7,0,TAU);ctx.fill();ctx.restore()}
function drawSettings(){if(layEdit){drawLayEdit();return}btns.push({x:0,y:0,w:W,h:H,cb:()=>{}});ctx.fillStyle='rgba(22,18,31,.75)';ctx.fillRect(0,0,W,H);panel(150,70,980,600);para(180,46,300,60,22);ctx.fillStyle=INK;ctx.fill();txt('設定',342,77,38,'#fff');btns.push({x:160,y:36,w:360,h:90,cb:devTapTitle});
B(950,90,150,54,'とじる',()=>{setOpen=false},{col:'#ffd91a',size:28});if(devOpen)B(640,90,280,54,G.mode==='pvp'?'超強化（対戦は不可）':DEV?'超強化 ON':'超強化 OFF',()=>{if(G.mode!=='pvp')devToggle()},{sk:8,size:24,col:DEV?'#ff8a2b':'#fff'});
const rows=[['視点感度','sens',0.3,2.5,v=>'×'+v.toFixed(1)],['効果音','se',0,1,v=>String(Math.round(v*10))],['BGM','bgm',0,1,v=>String(Math.round(v*10))]];
rows.forEach((r,i)=>{const y=156+i*72,k=r[1],v=SET[k],u=(v-r[2])/(r[3]-r[2]),set=nv=>{SET[k]=clamp(Math.round(nv*10)/10,r[2],r[3]);applySet();if(k==='se')snd('hit')};txt(r[0],200,y+28,30,INK,null,0,'left');
 B(440,y+2,66,54,'－',()=>set(SET[k]-0.1),{sk:0,size:36});btns.push({x:526,y,w:330,h:58,cb:p=>set(r[2]+sat((p.x-532)/318)*(r[3]-r[2]))});
 ctx.fillStyle=INK;ctx.fillRect(526,y+16,330,26);ctx.fillStyle='#fff';ctx.fillRect(530,y+20,322,18);ctx.fillStyle='#ffd91a';ctx.fillRect(530,y+20,322*u,18);ctx.fillStyle=INK;ctx.beginPath();ctx.arc(530+322*u,y+29,15,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(530+322*u,y+29,9,0,TAU);ctx.fill();
 B(876,y+2,66,54,'＋',()=>set(SET[k]+0.1),{sk:0,size:36});txt(r[4](v),1040,y+30,32,INK)});
const tog=(y,label,opts,cur,cb)=>{txt(label,200,y+28,30,INK,null,0,'left');opts.forEach((o,i)=>B(440+i*170,y+2,156,54,o,()=>cb(i),{sk:8,size:24,col:cur===i?'#ffd91a':'#fff'}))};
tog(372,'ボタンの大きさ',['小','中','大'],[0.85,1,1.15].indexOf(SET.size),i=>{SET.size=[0.85,1,1.15][i];applySet()});
tog(442,'ボタン配置',['右手で撃つ','左手で撃つ'],SET.lh,i=>{SET.lh=i;applySet()});
tog(512,'視点の上下',['通常','反転'],SET.inv>0?0:1,i=>{SET.inv=i?-1:1;applySet()});
tog(582,'視点',['1人称','2人称','3人称'],[0,2,1].indexOf(SET.view|0),i=>{const v=[0,2,1][i];if((SET.view|0)!==v)tpsSet(v)});
B(960,592,150,50,'全画面',()=>toggleFS(),{size:24});
B(960,386,150,50,'自由に配置',()=>{layEdit=true;layDrag=null},{sk:8,size:22,col:'#59d8ff'});const px=960,py=478,pw=150,ph=84;ctx.fillStyle='#cfe6ff';ctx.fillRect(px,py,pw,ph);ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.strokeRect(px,py,pw,ph);
for(const k in BTN){const b=BTN[k];ctx.beginPath();ctx.arc(px+b.x/W*pw,py+b.y/H*ph,Math.max(3,b.r/W*pw),0,TAU);ctx.fillStyle=k==='fire'?'#ff4a3d':'#fff';ctx.fill();ctx.lineWidth=1.5;ctx.stroke()}
btns.push({x:px,y:py,w:pw,h:ph,cb:()=>{layEdit=true;layDrag=null}});if(SET.lay)txt('カスタム',px+pw/2,py+ph+14,16,'#e5402b');ctx.beginPath();ctx.arc(px+(touch.hx||150)/W*pw,py+(touch.hy||560)/H*ph,10,0,TAU);ctx.fillStyle='rgba(255,255,255,.8)';ctx.fill();ctx.stroke();txt('配置プレビュー',px+pw/2,py-14,16,INK)}
const RKC={'S+':'#ff2e2e','S':'#ff2e2e','A':'#ff8a2b','B':'#2f6fd8','C':'#6a6a7a'},RKM={'S+':'伝説の一コマ！','S':'見事な腕前！','A':'やるじゃん！','B':'まだまだ伸びる！','C':'修行が足りん…'};
const fmtT=s=>((s/60)|0)+':'+String((s%60)|0).padStart(2,'0');
function drawResult(){const t=G.resT,cl=G.state==='clear';if(t<0.3){G.rs=0;return}if(G.mode==='pvp'){drawResultPvp();return}
ctx.fillStyle='rgba(22,18,31,.3)';ctx.fillRect(0,0,W,H);focusLines(W/2,H/2,380,70,cl?'rgba(255,255,255,.7)':'rgba(22,18,31,.8)',((now*8)|0)+11);
const P0=0.8,rk=cl?rank():'',RS=P0+0.25+5*0.18+0.35;
// rank rays (behind everything)
if(cl&&t>RS){ctx.save();ctx.translate(985,410);ctx.rotate(now*0.25);ctx.fillStyle=RKC[rk];ctx.globalAlpha=0.32*sat((t-RS)/0.3);for(let i=0;i<18;i++){ctx.rotate(TAU/18);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(360,-44);ctx.lineTo(360,44);ctx.fill()}ctx.restore()}
// title
const u=easeBack(sat((t-0.3)/0.3));ctx.save();ctx.translate(W/2,108);ctx.rotate(-0.04);ctx.scale(u*0.82,u*0.82);burstPath(6,8,470,104,22,1.2,6);ctx.fillStyle=INK;ctx.fill();burstPath(0,0,470,104,22,1.2,6);ctx.fillStyle=cl?'#ffd91a':'#fff';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.stroke();
txt(cl?'完全勝利！！':'無念…！',0,4,100,cl?'#ff2e2e':INK,cl?INK:null,16,'center',cl?'#fff':null,28);ctx.restore();
// stats panel
if(t>P0){const k=easeOut(sat((t-P0)/0.3)),pw=600,rows=[['撃破数',G.kills],['最大連撃',G.maxc||0],['スコア',G.score]];
 if(cl){rows.push(['タイム',G.time,'t']);rows.push(['被ダメージ',G.dmg|0])}else rows.push(['到達',WAVESET[G.stage][Math.max(0,G.wave)].ch,'s']);
 const ph=rows.length*58+44;ctx.save();ctx.translate(lerp(-760,0,k)+390,420);ctx.rotate(-0.025);
 ctx.fillStyle=INK;ctx.fillRect(-pw/2+12,-ph/2+14,pw,ph);ctx.fillStyle='#fff';ctx.fillRect(-pw/2,-ph/2,pw,ph);ctx.save();ctx.beginPath();ctx.rect(-pw/2,-ph/2,pw,ph);ctx.clip();ctx.fillStyle=dotPat;ctx.globalAlpha=0.2;ctx.beginPath();ctx.moveTo(-pw/2,ph/2);ctx.lineTo(pw/2,-ph/2+40);ctx.lineTo(pw/2,ph/2);ctx.fill();ctx.restore();
 ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.strokeRect(-pw/2,-ph/2,pw,ph);ctx.lineWidth=2;ctx.strokeRect(-pw/2+9,-ph/2+9,pw-18,ph-18);
 para(-pw/2-16,-ph/2-34,360,54,18);ctx.fillStyle=cl?'#e5402b':INK;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();txt(STG[G.stage].sub+'　'+STG[G.stage].name,-pw/2+172,-ph/2-6,26,'#fff');
 rows.forEach((r,i)=>{const st=P0+0.3+i*0.18,a=sat((t-st)/0.12);if(a<=0)return;if(!(G.rs&(1<<i))){G.rs|=1<<i;snd('hit')}const y=-ph/2+52+i*58,cu=easeOut(sat((t-st)/0.6));ctx.globalAlpha=a;
  txt(r[0],-pw/2+40+(1-a)*-30,y,30,INK,null,0,'left');
  const v=r[2]==='t'?fmtT(r[1]*cu):r[2]==='s'?r[1]:String(Math.floor(r[1]*cu));ctx.save();ctx.translate(pw/2-38,y+2);ctx.transform(1,0,-0.18,1,0,0);txt(v,0,0,i===2?46:40,i===2?'#e5402b':INK,i===2?'#fff':null,i===2?10:0,'right');ctx.restore();ctx.globalAlpha=1});
 if(cl&&G.score>(G.prevHi||0)&&t>P0+1.2){const s=1+0.08*Math.sin(now*10);ctx.save();ctx.translate(pw/2-70,ph/2+8);ctx.rotate(-0.08);ctx.scale(s,s);burstPath(3,4,98,32,12,1.3,4);ctx.fillStyle=INK;ctx.fill();burstPath(0,0,98,32,12,1.3,4);ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();txt('自己ベスト！',0,1,22,'#e5402b');ctx.restore()}
 ctx.restore()}
// rank stamp
if(cl&&t>RS){const u2=t-RS,s=u2<0.16?lerp(2.6,1,easeOut(u2/0.16)):1+0.03*Math.sin(now*4);if(!(G.rs&64)){G.rs|=64;snd('boom',1);shake(0.45);flash(0.25)}
 ctx.save();ctx.translate(985,400);ctx.rotate(0.08);ctx.scale(s,s);burstPath(7,9,175,160,16,1.22,8);ctx.fillStyle=INK;ctx.fill();burstPath(0,0,175,160,16,1.22,8);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.stroke();
 txt('RANK',0,-100,28,INK);txt(rk,0,14,rk.length>1?132:168,RKC[rk],INK,14,'center','#ffd91a',rk[0]==='S'?28:0);ctx.restore();
 if(u2>0.35){const a=easeBack(sat((u2-0.35)/0.25));ctx.save();ctx.translate(985,580);ctx.rotate(-0.04);ctx.scale(a,a);para(-150,-24,300,48,14);ctx.fillStyle=INK;ctx.fill();txt(RKM[rk],8,1,26,'#fff');ctx.restore()}}
if(G.rew&&t>1.5){const s=easeBack(sat((t-1.5)/0.25));ctx.save();ctx.translate(1110,652);ctx.rotate(-0.06);ctx.scale(s,s);burstPath(3,4,118,34,12,1.25,6);ctx.fillStyle=INK;ctx.fill();burstPath(0,0,118,34,12,1.25,6);ctx.fillStyle='#ff9ad0';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();txt('スキルＰ ＋'+G.rew,0,1,26,INK);ctx.restore()}
if(t>1.5){if(net.on){if(net.host)B(440,628,400,62,'ロビーへもどる',()=>hostLobby(),{col:'#ffd91a',size:32});else txt('ホストの操作を待っています…',W/2,652,26,'#fff',INK,6);B(60,632,200,54,'退出する',()=>netLeave(),{size:24})}
else{B(330,628,300,62,'もう一度',()=>startWipe(startGame),{col:'#ffd91a',size:34});B(660,628,300,62,'メニューへ',()=>startWipe(toMenu),{size:34})}}}
