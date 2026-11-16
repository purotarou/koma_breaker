'use strict';
// ================= SKILL TREE =================
// Every skill only changes the local player's own numbers (damage dealt, own HP, jumps, gauge), which each client
// already computes for itself in co-op, so nothing extra goes over the network. Skills are off in versus and the demo.
// Shape: a cross. The centre is the start; four arms go out (up=攻, right=速, down=守, left=技). Each arm:
//   一段 → 二段 → (A line | B line | short middle branch). A/B lines have 三段・四段・五段・極み; the middle branch has 2 panels.
//   Inside one arm only one of A / B / middle can be taken. Tier gate = stages cleared (三段1, 四段2, 五段3, 極み5).
// Points are scarce and capped: first clear of a stage +3, second clear +1, boss beaten without damage +1 (each stage once),
// all five stages cleared +4 → 29 in all. A full line to its 極み costs 23.
const SKB=[{n:'攻',col:'#ff4a3d',la:'連射',lb:'一撃'},{n:'速',col:'#3f8cff',la:'疾走',lb:'跳躍'},{n:'守',col:'#35d06a',la:'不動',lb:'治癒'},{n:'技',col:'#f4a51a',la:'気合',lb:'乱舞'}];
// per arm: t1 t2 A3 A4 A5 A6 B3 B4 B5 B6 C3 C4  [name, effect]
const SKD=[
[['攻撃力小アップ','与えるダメージ＋5％'],['攻撃力アップ','与えるダメージ さらに＋8％'],
 ['早業装填','装填にかかる時間－20％'],['大容量弾倉','装弾数＋4発'],['弾幕強化','連射の速さ＋12％'],['極み：千発雷','装弾数1.5倍・連射＋30％・装填－30％'],
 ['弱点狙い','弱点に当てたときのダメージ＋15％'],['貫通弾','弾が敵を1体つらぬく'],['破砕','かたい所へのダメージが上がる'],['極み：鬼神の一撃','与ダメージ＋35％・弱点ダメージ＋30％'],
 ['狂戦士','与ダメージ＋18％（受けるダメージ＋20％）'],['修羅の構え','体力が減るほど与ダメージ最大＋25％（回復－30％）']],
[['韋駄天','移動の速さ＋6％'],['俊足回避','回避の待ち時間－25％'],
 ['加速','移動の速さ さらに＋5％'],['見切り','回避の無敵時間が長くなる'],['駆け抜け','回避で進む距離＋20％'],['極み：韋駄天の化身','回避を2連続でできる'],
 ['ジャンプ力アップ','ジャンプの高さ＋15％'],['浮遊時間アップ','空中にいられる時間＋20％'],['空中射撃','空中にいる間の与ダメージ＋10％'],['極み：天狗','二段ジャンプ・空中の与ダメージ＋20％'],
 ['軽装','移動の速さ＋12％（最大体力－20）'],['身軽','空中で向きを変えやすい（受けるダメージ＋10％）']],
[['体力アップ','最大体力 100 → 110'],['自動回復','少しずつ体力が戻る（止まっているとよく戻る）'],
 ['鉄の体','受けるダメージ－8％'],['受け流し','凍りつき・のけぞりが半分'],['不屈','体力が半分以下のとき受けるダメージ－10％'],['極み：不動明王','受けるダメージ－25％・体力＋30・復活1回'],
 ['回復上手','回復アイテム＋25％'],['救急の心得','敵の群れを倒した後の回復＋20％'],['一回復活','倒れても1度、体力30％で立ち上がる'],['極み：不死身','自動回復が2倍・復活が体力50％'],
 ['鉄壁','受けるダメージ－18％（移動－10％）'],['重装','最大体力＋20（回避の待ち時間＋30％）']],
[['気合充填','必殺ゲージのたまり方＋15％'],['必殺の心得','必殺技の威力＋5％'],
 ['自然回復','必殺ゲージが少しずつたまる'],['連発の構え','必殺技を撃ってもゲージが10％残る'],['気迫','敵を倒すとゲージが多くたまる'],['極み：気魄','最初から必殺ゲージが満タン'],
 ['必殺持続','必殺技の時間＋15％'],['必殺中無敵','必殺技の前半はダメージを受けない'],['余韻','必殺技の後にゲージが25％戻る'],['極み：必殺乱舞','必殺技の後、5秒以内ならもう一度撃てる'],
 ['捨て身','必殺ゲージ＋30％（回復－50％）'],['無茶','必殺技の威力＋20％（撃った後に体力－10）']]];
const SKCOST=[1,2,3,4,5,8,3,4,5,8,2,3],SKCODE=['t1','t2','A3','A4','A5','A6','B3','B4','B5','B6','C3','C4'],SKMAX=29;
const SKN=[];
for(let b=0;b<4;b++)SKCODE.forEach((c,i)=>{const ln=c[0]==='t'?'':c[0],d=+c[1],sv=ln==='A'?-1:ln==='B'?1:0;
 const par=c==='t1'?[]:c==='t2'?[b+'t1']:[b+(d===3?'t2':ln+(d-1))];
 SKN.push({id:b+c,b,c,ln,d,sv,cap:d===6,c0:SKCOST[i],n:SKD[b][i][0],e:SKD[b][i][1],par,tier:d===6?5:Math.max(0,d-2)})});
const SKI={};for(const n of SKN)SKI[n.id]=n;
const SKS={v:2,pt:0,own:{},clr:[0,0,0,0,0],c2:[0,0,0,0,0],nd:[0,0,0,0,0]};
try{const s=JSON.parse(localStorage.getItem('koma_skill')||'null');
 if(s&&s.v===2)Object.assign(SKS,s);
 else{// first run or the old 4×4 tree: keep the record of cleared stages, rebuild points under the new rules (old skills are cleared)
  for(let i=0;i<5;i++)SKS.clr[i]=s&&s.clr?(s.clr[i]?1:0):(+(localStorage.getItem('koma_hi'+i)||0)>0?1:0);
  const n=SKS.clr.filter(v=>v).length;SKS.pt=n*3+(n===5?4:0);skSave()}}catch(e){}
function skSave(){try{localStorage.setItem('koma_skill',JSON.stringify(SKS))}catch(e){}}
const skHas=id=>!!SKS.own[id],skClr=()=>SKS.clr.filter(v=>v).length;
// own | prev (earlier panel missing) | line (another line of this arm is taken) | tier (not enough stages cleared) | pt | ok
function skState(n){if(skHas(n.id))return'own';if(n.par.some(p=>!skHas(p)))return'prev';
 if(n.ln)for(const id in SKS.own){const m=SKI[id];if(m&&m.b===n.b&&m.ln&&m.ln!==n.ln)return'line'}
 if(skClr()<n.tier)return'tier';return SKS.pt<n.c0?'pt':'ok'}
const skAny=()=>SKN.some(n=>skState(n)==='ok');
var DEV=0;// 開発者用の裏技（設定画面の「設定」を10回タップすると開発者メニューが出て、そこの「超強化」ボタンで切り替え。ONだとプレイ中に「ボスへ」ボタンも出る）。無敵ではなく体力が桁違いに多い
let SK={},skPop=null,skMsg=null,skSel=null;
// effective values for the current game (neutral in versus / demo); called from resetPlayer
function skApply(){const on=G.mode!=='pvp'&&!G.demoOn,h=c=>on&&skHas(c);
const s={atk:1,rel:1,mag:16,cool:1,crit:1.25,pierce:0,crush:0,low:0,def:1,spd:1,dash:1,dinv:0.34,ddist:1,dash2:0,jump:1,grav:1,air:0,dj:0,airc:0,
 hp:100,regen:0,heal:1,heal2:1,steady:0,fud:0,rev:0,revH:0.3,gauge:1,spw:1,gReg:0,gKeep:0,gKill:0,g0:0,beam:0.8,spinv:0,gAfter:0,again:0,spCost:0,pow:12};
// 攻
if(h('0t1'))s.atk*=1.05;if(h('0t2'))s.atk*=1.08;
if(h('0A3'))s.rel*=0.8;if(h('0A4'))s.mag+=4;if(h('0A5'))s.cool/=1.12;if(h('0A6')){s.mag=Math.round(s.mag*1.5);s.cool/=1.3;s.rel*=0.7}
if(h('0B3'))s.crit*=1.15;if(h('0B4'))s.pierce=1;if(h('0B5'))s.crush=1;if(h('0B6')){s.atk*=1.35;s.crit*=1.3}
if(h('0C3')){s.atk*=1.18;s.def*=1.2}if(h('0C4')){s.low=0.25;s.heal*=0.7}
// 速
if(h('1t1'))s.spd*=1.06;if(h('1t2'))s.dash*=0.75;
if(h('1A3'))s.spd*=1.05;if(h('1A4'))s.dinv=0.5;if(h('1A5'))s.ddist=1.2;if(h('1A6'))s.dash2=1;
if(h('1B3'))s.jump=1.15;if(h('1B4'))s.grav=1/1.2;if(h('1B5'))s.air=0.1;if(h('1B6')){s.dj=1;s.air=0.2}
if(h('1C3')){s.spd*=1.12;s.hp-=20}if(h('1C4')){s.airc=1;s.def*=1.1}
// 守
if(h('2t1'))s.hp+=10;if(h('2t2'))s.regen=1;
if(h('2A3'))s.def*=0.92;if(h('2A4'))s.steady=1;if(h('2A5'))s.fud=1;if(h('2A6')){s.def*=0.75;s.hp+=30;s.rev=1}
if(h('2B3'))s.heal*=1.25;if(h('2B4'))s.heal2=1.2;if(h('2B5'))s.rev=1;if(h('2B6')){s.regen=2;s.revH=0.5}
if(h('2C3')){s.def*=0.82;s.spd*=0.9}if(h('2C4')){s.hp+=20;s.dash*=1.3}
// 技
if(h('3t1'))s.gauge*=1.15;if(h('3t2'))s.spw*=1.05;
if(h('3A3'))s.gReg=0.3;if(h('3A4'))s.gKeep=10;if(h('3A5'))s.gKill=2;if(h('3A6'))s.g0=100;
if(h('3B3'))s.beam*=1.15;if(h('3B4'))s.spinv=1;if(h('3B5'))s.gAfter=25;if(h('3B6'))s.again=1;
if(h('3C3')){s.gauge*=1.3;s.heal*=0.5}if(h('3C4')){s.spw*=1.2;s.spCost=10}
SK=s;if(DEV&&G.mode!=='pvp')Object.assign(SK,{atk:20,rel:0.15,mag:40,cool:0.7,hp:99999,heal:3,def:1,rev:1,dash:0.2,dj:1,gauge:3,spinv:1,spd:1.3,crit:2,beam:2,regen:2})}
skApply();
function addGauge(v){pl.gauge=Math.min(100,pl.gauge+v*SK.gauge)}
// damage multiplier from skills that depend on the moment (air time, low HP); crits are separate
function skAtk(){let m=SK.atk;if(SK.air&&pl.y>0.05)m*=1+SK.air;if(SK.low)m*=1+SK.low*(1-sat(pl.hp/SK.hp));return m}
const spReady=()=>pl.gauge>=100||pl.spX>0;
function skMsgOf(s,n){return s==='own'?'習得済みです':s==='prev'?'手前のスキルを先に習得しよう':s==='line'?'同じ系統では、1本の道しか選べません':s==='tier'?(n.cap?'５つのステージをすべてクリアすると解放':'ステージを'+n.tier+'つクリアすると解放'):'ポイントが足りません（あと'+(n.c0-SKS.pt)+'）'}
function skBuy(n){const s=skState(n);if(s!=='ok'){skMsg={s:skMsgOf(s,n),t:now};return}
SKS.pt-=n.c0;SKS.own[n.id]=1;skSave();snd('item');skPop={id:n.id,t:now};skMsg=null}
// take back one panel (only the end of a path); all its points come back
function skUndo(n){if(!skHas(n.id))return;if(SKN.some(m=>skHas(m.id)&&m.par.includes(n.id))){skMsg={s:'先のスキルを外してから',t:now};return}
delete SKS.own[n.id];SKS.pt+=n.c0;skSave();snd('ui');skMsg={s:n.n+'を外しました（'+n.c0+'ポイント戻りました）',t:now}}
function skReset(){let r=0;for(const n of SKN)if(skHas(n.id))r+=n.c0;if(!r)return;SKS.pt+=r;SKS.own={};skSave();skMsg={s:'振り直し：'+r+'ポイント戻りました',t:now}}
// points at the end of a game (solo / co-op, once per game)
function skReward(cl){if(G.mode==='pvp'||G.demoOn||G.rew!=null)return;let p=0;const i=G.stage;
if(cl){if(!SKS.clr[i]){SKS.clr[i]=1;p+=3;if(skClr()===5)p+=4}else if(!SKS.c2[i]){SKS.c2[i]=1;p+=1}if(!G.bHurt&&!SKS.nd[i]){SKS.nd[i]=1;p+=1}}
SKS.pt+=p;G.rew=p;skSave()}
// ---- skill tree screen: a yokai-magic seal (pan / zoom) ----
// The cross is drawn in "world" coords around SKC and shown through a view (SKVR) that can be dragged, pinched and wheel-zoomed.
const SKC=[380,394],SKST=40,SKSW=34,SKO=[[0,-1],[1,0],[0,1],[-1,0]],SKSD=[[1,0],[0,1],[-1,0],[0,-1]];
const SKVR={x:30,y:22,w:700,h:676},SKVC=[380,368],SKS0=0.94,skV={x:0,y:0,s:SKS0},skP={};let skPinch=null;
const SK9='臨兵闘者皆陣列在前';
function skPos(b,d,sv){const o=SKO[b],s=SKSD[b];return[SKC[0]+o[0]*SKST*d+s[0]*SKSW*sv,SKC[1]+o[1]*SKST*d+s[1]*SKSW*sv]}
function skScr(p){return[SKVC[0]+skV.x+(p[0]-SKC[0])*skV.s,SKVC[1]+skV.y+(p[1]-SKC[1])*skV.s]}
const skIn=p=>p.x>=SKVR.x&&p.x<=SKVR.x+SKVR.w&&p.y>=SKVR.y&&p.y<=SKVR.y+SKVR.h;
function skClampV(){const m=330*skV.s;skV.x=clamp(skV.x,-m,m);skV.y=clamp(skV.y,-m,m)}
function skZoom(f,px,py){const s1=clamp(skV.s*f,0.7,2.6),k=s1/skV.s;skV.x=(px-SKVC[0])-(px-SKVC[0]-skV.x)*k;skV.y=(py-SKVC[1])-(py-SKVC[1]-skV.y)*k;skV.s=s1;skClampV()}
function skHit(x,y){let best=null,bd=1e9;for(const n of SKN){const q=skScr(skPos(n.b,n.d,n.sv)),d=Math.hypot(q[0]-x,q[1]-y);if(d<(n.cap?22:17)*skV.s+10&&d<bd){bd=d;best=n}}return best}
// pointer hooks from the input code: ph 'd' down / 'm' move / 'u' up. Returns true when the tree used the event.
function skTouch(ph,p,id){if(G.state!=='menu'||G.menu!=='skill'||setOpen||wipe.on){for(const k in skP)delete skP[k];skPinch=null;return false}
 if(ph==='d'){if(!skIn(p))return false;for(const b of btns)if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h)return false;
  skP[id]={x:p.x,y:p.y,x0:p.x,y0:p.y,mv:0};const ks=Object.keys(skP);if(ks.length===2){const a=skP[ks[0]],b=skP[ks[1]];skPinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1};a.mv=b.mv=1}return true}
 const q=skP[id];if(!q)return false;
 if(ph==='m'){const ks=Object.keys(skP);
  if(ks.length>=2&&skPinch){const a=skP[ks[0]],b=skP[ks[1]],mx0=(a.x+b.x)/2,my0=(a.y+b.y)/2;q.x=p.x;q.y=p.y;const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,d=Math.hypot(a.x-b.x,a.y-b.y)||1;skV.x+=mx-mx0;skV.y+=my-my0;skZoom(d/skPinch.d,mx,my);skPinch.d=d}
  else{skV.x+=p.x-q.x;skV.y+=p.y-q.y;q.x=p.x;q.y=p.y;if(Math.hypot(p.x-q.x0,p.y-q.y0)>10)q.mv=1;skClampV()}return true}
 delete skP[id];if(Object.keys(skP).length<2)skPinch=null;if(!q.mv){const n=skHit(q.x,q.y);if(n){skSel=n.id;skMsg=null;snd('ui')}}return true}
function skWheel(p,dy){if(G.state!=='menu'||G.menu!=='skill'||setOpen||!skIn(p))return false;skZoom(Math.exp(-dy*0.0015),p.x,p.y);return true}
function skCircle(t){ctx.save();ctx.translate(SKC[0],SKC[1]);ctx.lineWidth=2;
 ctx.strokeStyle='rgba(190,150,255,.32)';for(const r of[326,292,206,148]){ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke()}
 ctx.save();ctx.rotate(t*0.04);for(let i=0;i<18;i++){ctx.save();ctx.rotate(i/18*TAU);txt(SK9[i%9],0,-309,20,'rgba(215,185,255,.42)');ctx.restore()}ctx.restore();
 ctx.save();ctx.rotate(-t*0.06);ctx.strokeStyle='rgba(190,150,255,.28)';for(let i=0;i<72;i++){ctx.rotate(TAU/72);ctx.beginPath();ctx.moveTo(0,-292);ctx.lineTo(0,i%6?-286:-278);ctx.stroke()}ctx.restore();
 ctx.save();ctx.rotate(t*0.08);ctx.strokeStyle='rgba(255,110,190,.22)';ctx.lineWidth=2.5;for(let k=0;k<2;k++){ctx.rotate(PI/4);ctx.strokeRect(-146,-146,292,292)}ctx.restore();
 ctx.save();ctx.rotate(-t*0.12);ctx.setLineDash([10,12]);ctx.strokeStyle='rgba(120,220,255,.25)';ctx.beginPath();ctx.arc(0,0,176,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.restore();ctx.restore()}
function skEdge(a,b,on,col,t){ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);
 if(!on){ctx.strokeStyle='rgba(200,180,255,.2)';ctx.lineWidth=3;ctx.stroke();ctx.lineCap='butt';return}
 ctx.strokeStyle=col;ctx.globalAlpha=0.28;ctx.lineWidth=16;ctx.stroke();ctx.globalAlpha=1;ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
 ctx.setLineDash([3,15]);ctx.lineDashOffset=-t*45;ctx.lineWidth=4;ctx.stroke();ctx.setLineDash([]);ctx.lineDashOffset=0;ctx.lineCap='butt'}
function skShape(x,y,r,cap){ctx.beginPath();if(!cap){ctx.arc(x,y,r,0,TAU);return}for(let i=0;i<16;i++){const a=i/16*TAU-PI/2,q=i%2?r*0.78:r;i?ctx.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q):ctx.moveTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}ctx.closePath()}
function skNode(n,t){const p=skPos(n.b,n.d,n.sv),x=p[0],y=p[1],s=skState(n),own=s==='own',ok=s==='ok',col=SKB[n.b].col,r=n.cap?21:14,sel=skSel===n.id;
 if(own){ctx.globalAlpha=0.22+0.08*Math.sin(t*3+n.d);ctx.fillStyle=col;skShape(x,y,r+10,n.cap);ctx.fill();ctx.globalAlpha=1;const g=ctx.createRadialGradient(x-r*0.3,y-r*0.3,1,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(0.45,col);g.addColorStop(1,col);ctx.fillStyle=g}
 else ctx.fillStyle=ok?'#22163a':'#110b1d';
 skShape(x,y,r,n.cap);ctx.fill();ctx.strokeStyle=own?'#fff':ok?col:'rgba(255,255,255,.22)';ctx.lineWidth=own?2:ok?3:2;ctx.stroke();
 if(ok){const k=(t*1.4+n.d*0.2)%1;ctx.globalAlpha=1-k;ctx.strokeStyle=col;ctx.lineWidth=2;skShape(x,y,r+3+k*12,n.cap);ctx.stroke();ctx.globalAlpha=1}
 if(n.cap&&(own||ok)){ctx.fillStyle=own?'#fff':col;for(let i=0;i<8;i++){const a=t*(own?1.2:0.6)+i/8*TAU;ctx.beginPath();ctx.arc(x+Math.cos(a)*(r+13),y+Math.sin(a)*(r+13),own?2.6:1.8,0,TAU);ctx.fill()}}
 if(sel){ctx.save();ctx.setLineDash([5,5]);ctx.lineDashOffset=t*18;ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y,r+(n.cap?20:10),0,TAU);ctx.stroke();ctx.restore()}
 const lab=n.cap?'極':own?n.n.replace('極み：','')[0]:String(n.c0);
 txt(lab,x,y+1,n.cap?22:own?17:15,own?'#fff':ok?'#fff':'rgba(255,255,255,.4)',own?INK:null,own?5:0);
 if(skPop&&skPop.id===n.id&&now-skPop.t<0.9){const u=now-skPop.t;ctx.globalAlpha=sat((0.9-u)/0.3);ctx.strokeStyle=col;ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,r+u*70,0,TAU);ctx.stroke();ctx.globalAlpha=1;
  const k=easeBack(sat(u/0.18));ctx.save();ctx.globalAlpha=sat((0.9-u)/0.25);ctx.translate(x,y-r-26);ctx.scale(k*0.55,k*0.55);txt('会得！',0,0,44,'#fff',col,10,'center',INK,16);ctx.restore()}}
function skBadge(b,t){const p=skPos(b,7.05,0),col=SKB[b].col;ctx.save();ctx.translate(p[0],p[1]);
 ctx.globalAlpha=0.3;ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,36,0,TAU);ctx.fill();ctx.globalAlpha=1;
 const g=ctx.createRadialGradient(0,-8,2,0,0,26);g.addColorStop(0,'#fff');g.addColorStop(0.35,col);g.addColorStop(1,'#1a0f2c');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,26,0,TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
 ctx.save();ctx.rotate(t*(b%2?-0.7:0.7));ctx.strokeStyle=col;ctx.lineWidth=2;for(let i=0;i<12;i++){ctx.rotate(TAU/12);ctx.beginPath();ctx.moveTo(0,-31);ctx.lineTo(0,i%3?-34:-38);ctx.stroke()}ctx.restore();
 txt(SKB[b].n,0,1,30,'#fff',INK,7);ctx.restore();
 for(const[k,sv]of[['la',-1],['lb',1]]){const q=skPos(b,6.95,sv);txt(SKB[b][k],q[0],q[1],15,'#efe4ff','#07050d',5)}}
function skCore(t){const x=SKC[0],y=SKC[1];ctx.globalAlpha=0.25+0.1*Math.sin(t*2);ctx.fillStyle='#c79bff';ctx.beginPath();ctx.arc(x,y,44,0,TAU);ctx.fill();ctx.globalAlpha=1;
 const g=ctx.createRadialGradient(x-8,y-8,2,x,y,30);g.addColorStop(0,'#fff');g.addColorStop(0.5,'#d9b8ff');g.addColorStop(1,'#5b2a9c');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,30,0,TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
 ctx.save();ctx.translate(x,y);ctx.rotate(-t*0.9);ctx.fillStyle='#f3e6ff';for(let i=0;i<6;i++){ctx.rotate(TAU/6);ctx.beginPath();ctx.moveTo(0,-36);ctx.lineTo(4,-42);ctx.lineTo(-4,-42);ctx.fill()}ctx.restore();txt('妖',x,y+1,32,'#2a0f45')}
function skRoundBtn(x,y,label,cb){btns.push({x:x-24,y:y-24,w:48,h:48,cb});ctx.fillStyle='rgba(20,12,36,.85)';ctx.beginPath();ctx.arc(x,y,22,0,TAU);ctx.fill();ctx.strokeStyle='#c9a2ff';ctx.lineWidth=2.5;ctx.stroke();txt(label,x,y+1,label.length>1?14:26,'#f3e6ff')}
function drawSkill(){const nc=skClr(),t=now,R=SKVR;
// ---- left: the seal ----
ctx.fillStyle='#000';ctx.fillRect(R.x+8,R.y+8,R.w,R.h);ctx.save();
const bg=ctx.createRadialGradient(SKVC[0],SKVC[1],30,SKVC[0],SKVC[1],560);bg.addColorStop(0,'#2d1a4c');bg.addColorStop(0.55,'#150d29');bg.addColorStop(1,'#06040c');ctx.fillStyle=bg;ctx.fillRect(R.x,R.y,R.w,R.h);
ctx.beginPath();ctx.rect(R.x,R.y,R.w,R.h);ctx.clip();
for(let i=0;i<8;i++){const L=R.w+360,x=R.x-180+(((i*173+t*(10+i*2)*(i%2?1:-1))%L)+L)%L,y=R.y+50+i*82;ctx.globalAlpha=0.05;ctx.fillStyle='#b9a0ff';ctx.beginPath();ctx.ellipse(x,y,170,24,0,0,TAU);ctx.fill()}
for(let i=0;i<26;i++){const k=(t*0.05+i*0.137)%1,x=R.x+((i*263)%R.w),y=R.y+R.h-k*R.h;ctx.globalAlpha=0.5*Math.sin(k*PI);ctx.fillStyle=i%3?'#ffcf7a':'#c9a2ff';ctx.beginPath();ctx.arc(x+Math.sin(t+i)*10,y,1.6+(i%3),0,TAU);ctx.fill()}ctx.globalAlpha=1;
ctx.translate(SKVC[0]+skV.x,SKVC[1]+skV.y);ctx.scale(skV.s,skV.s);ctx.translate(-SKC[0],-SKC[1]);
skCircle(t);
for(const n of SKN){const p=skPos(n.b,n.d,n.sv),q=n.par.length?skPos(SKI[n.par[0]].b,SKI[n.par[0]].d,SKI[n.par[0]].sv):SKC;skEdge(q,p,skHas(n.id),SKB[n.b].col,t)}
for(let b=0;b<4;b++)skBadge(b,t);skCore(t);for(const n of SKN)skNode(n,t);
ctx.restore();
ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.strokeRect(R.x,R.y,R.w,R.h);ctx.strokeStyle='#c9a24a';ctx.lineWidth=2;ctx.strokeRect(R.x+9,R.y+9,R.w-18,R.h-18);
skRoundBtn(R.x+46,R.y+R.h-46,'＋',()=>skZoom(1.25,SKVC[0],SKVC[1]));skRoundBtn(R.x+104,R.y+R.h-46,'－',()=>skZoom(0.8,SKVC[0],SKVC[1]));skRoundBtn(R.x+162,R.y+R.h-46,'元へ',()=>{skV.x=skV.y=0;skV.s=SKS0});
txt(touchMode?'指で動かす・２本指で拡大':'ドラッグで移動・ホイールで拡大',R.x+R.w-24,R.y+R.h-30,15,'rgba(230,215,255,.7)',null,0,'right');
// ---- right: scroll of secrets ----
const X=746;ctx.fillStyle='rgba(6,4,12,.72)';ctx.fillRect(X-10,96,510,602);ctx.strokeStyle='#c9a24a';ctx.lineWidth=2;ctx.strokeRect(X-4,102,498,590);
txt('妖術秘伝',X+245,140,46,'#ffe7a8',INK,10,'center','#7a3cff',16);txt('― スキルツリー ―',X+245,184,17,'#d9c8ff');
txt('スキルポイント',X+120,232,22,'#efe4ff');txt(String(SKS.pt),X+280,230,48,'#ffd34d',INK,6);txt('/'+SKMAX,X+340,240,20,'#bda9e8',null,0,'left');txt('クリア '+nc+'/5',X+440,232,17,'#bda9e8');
// ofuda card
const cy=264,ch=264;ctx.fillStyle='#000';ctx.fillRect(X+6,cy+6,478,ch);ctx.fillStyle='#f2e6c4';ctx.fillRect(X,cy,478,ch);ctx.strokeStyle='#b8322a';ctx.lineWidth=4;ctx.strokeRect(X+8,cy+8,462,ch-16);ctx.lineWidth=1.5;ctx.strokeRect(X+14,cy+14,450,ch-28);
const n=skSel&&SKI[skSel];
if(n){const s=skState(n),col=SKB[n.b].col,path=n.ln==='A'?SKB[n.b].la:n.ln==='B'?SKB[n.b].lb:n.ln==='C'?'外れ道':'幹';
 ctx.fillStyle=col;ctx.beginPath();ctx.arc(X+52,cy+56,26,0,TAU);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();txt(SKB[n.b].n,X+52,cy+57,28,'#fff',INK,6);
 txt(SKB[n.b].n+'の術・'+path+(n.cap?'・極み':' '+'一二三四五'[n.d-1]+'段'),X+92,cy+40,15,'#7a2a22',null,0,'left');
 txt(n.n,X+92,cy+72,n.n.length>8?25:30,INK,null,0,'left');
 txt(n.e,X+239,cy+128,n.e.length>21?16:19,INK);
 ctx.fillStyle='#c0392b';ctx.beginPath();ctx.arc(X+70,cy+188,30,0,TAU);ctx.fill();ctx.strokeStyle='#7a1d16';ctx.lineWidth=2;ctx.stroke();txt(n.c0+'P',X+70,cy+189,24,'#fff');
 txt(s==='own'?'会得済み':s==='ok'?'会得できる':skMsgOf(s,n),X+270,cy+168,s==='own'||s==='ok'?22:15,s==='own'?'#1e7a3c':s==='ok'?INK:'#8a6d5a');
 if(s==='own')B(X+160,cy+190,220,52,'封じる（外す）',()=>skUndo(n),{size:22,col:'#d8d8e0'});else B(X+160,cy+190,220,52,'会得する',()=>skBuy(n),{size:26,col:s==='ok'?'#ff4a3d':'#cfc6b4',tc:s==='ok'?'#fff':'#6a5a4a'})}
else{txt('光る印をタップして術を選べ',X+239,cy+60,22,INK);txt('ひとつの系統で、選べる道は１本だけ',X+239,cy+108,17,INK);txt('道の果ての「極」は、その道を極めた証',X+239,cy+140,17,INK);txt('ポイントは全部で'+SKMAX+'。すべては会得できぬ',X+239,cy+190,18,'#b8322a')}
if(skMsg&&now-skMsg.t<2.2)txt(skMsg.s,X+245,560,19,'#ff7a6a',INK,6);else txt('初クリア＋3／2回目＋1／ボス無傷＋1／全面クリア＋4',X+245,560,15,'#d9c8ff');
B(X,616,220,56,'もどる',()=>{G.menu='main';skMsg=null;skSel=null},{size:26});B(X+250,616,230,56,'すべて封じる',()=>skReset(),{size:22,col:'#d8d8e0'})}
