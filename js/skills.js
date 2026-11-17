'use strict';
// ================= SKILL TREE =================
// Every skill only changes the local player's own numbers (damage dealt, own HP, jumps, gauge), which each client
// already computes for itself in co-op, so nothing extra goes over the network. Skills are off in versus and the demo.
// Shape: a cross. The centre is the start; four arms go out (up=攻, right=速, down=守, left=技). Each arm:
//   一段 → 二段 → (A line | B line | short middle branch). A/B lines have 三段・四段・五段・極み; the middle branch has 2 panels.
//   Every panel can be taken (no limit on lines or points). Tier gate = stages cleared (三段1, 四段2, 五段3, 極み5).
// Points come only from levels: +1 point per level up. EXP comes from beating enemies (more on harder stages) and clearing a stage.
// The EXP for the next level grows each level (skNeed), so points stay scarce: it grows faster the higher the level (150+6L+0.15L²)
// (one arm without its 極み = 32). All 48 panels = 192 points ≈ Lv193, only with a great deal of play.
// Each level also raises the base numbers a little (max HP +1, damage +0.3%), see skApply.
const SKB=[{n:'攻',col:'#ff4a3d',la:'連射',lb:'一撃'},{n:'速',col:'#3f8cff',la:'疾走',lb:'跳躍'},{n:'守',col:'#35d06a',la:'不動',lb:'治癒'},{n:'技',col:'#f4a51a',la:'気合',lb:'乱舞'}];
// per arm: t1 t2 A3 A4 A5 A6 B3 B4 B5 B6 C3 C4  [name, effect]
const SKD=[
[['攻撃力小アップ','与えるダメージ＋5％'],['攻撃力アップ','与えるダメージ さらに＋8％'],
 ['早業装填','装填にかかる時間－20％'],['大容量弾倉','装弾数＋4発'],['弾幕強化','連射の速さ＋12％'],['極み：千発雷','装弾数1.5倍・連射＋30％・装填－30％'],
 ['弱点狙い','弱点に当てたときのダメージ＋15％'],['貫通弾','弾が敵を1体つらぬく'],['破砕','かたい所へのダメージが上がる'],['極み：鬼神の一撃','与ダメージ＋35％・弱点ダメージ＋30％'],
 ['狂戦士','与ダメージ＋18％（受けるダメージ＋20％）'],['修羅の構え','体力が減るほど与ダメージ最大＋25％（回復－30％）']],
[['韋駄天','移動の速さ＋6％'],['俊足回避','回避の待ち時間－25％'],
 ['加速','移動の速さ さらに＋5％'],['見切り','回避の無敵時間が長くなる'],['駆け抜け','回避で進む距離＋20％'],['極み：韋駄天の化身','回避を2連続でできる'],
 ['小ジャンプ','ジャンプボタンを短く押すと小ジャンプが出せる'],['浮遊時間アップ','空中にいられる時間＋20％'],['空中射撃','空中にいる間の与ダメージ＋10％'],['極み：天狗','二段ジャンプ・空中の与ダメージ＋20％'],
 ['軽装','移動の速さ＋12％（最大体力－20）'],['身軽','空中で向きを変えやすい（受けるダメージ＋10％）']],
[['体力アップ','最大体力 100 → 110'],['自動回復','少しずつ体力が戻る（止まっているとよく戻る）'],
 ['鉄の体','受けるダメージ－8％'],['受け流し','凍りつき・のけぞりが半分'],['不屈','体力が半分以下のとき受けるダメージ－10％'],['極み：不動明王','受けるダメージ－25％・体力＋30・復活1回'],
 ['回復上手','回復アイテム＋25％'],['救急の心得','敵の群れを倒した後の回復＋20％'],['一回復活','倒れても1度、体力30％で立ち上がる'],['極み：不死身','自動回復が2倍・復活が体力50％'],
 ['鉄壁','受けるダメージ－18％（移動－10％）'],['重装','最大体力＋20（回避の待ち時間＋30％）']],
[['気合充填','必殺ゲージのたまり方＋15％'],['必殺の心得','必殺技の威力＋5％'],
 ['自然回復','必殺ゲージが少しずつたまる'],['連発の構え','必殺技を撃ってもゲージが10％残る'],['気迫','敵を倒すとゲージが多くたまる'],['極み：気魄','最初から必殺ゲージが満タン'],
 ['必殺持続','必殺技の時間＋15％'],['必殺中無敵','必殺技の前半はダメージを受けない'],['余韻','必殺技の後にゲージが25％戻る'],['極み：必殺乱舞','必殺技の後、5秒以内ならもう一度撃てる'],
 ['捨て身','必殺ゲージ＋30％（回復－50％）'],['無茶','必殺技の威力＋20％（撃った後に体力－10）']]];
const SKCOST=[1,2,3,4,5,8,3,4,5,8,2,3],SKCODE=['t1','t2','A3','A4','A5','A6','B3','B4','B5','B6','C3','C4'],SKRESPEC=1;// 振り直し（外す）1個につき1ポイント。戻るのは取ったときのポイントから引いた分
const SKN=[];
for(let b=0;b<4;b++)SKCODE.forEach((c,i)=>{const ln=c[0]==='t'?'':c[0],d=+c[1],sv=ln==='A'?-1:ln==='B'?1:0;
 const par=c==='t1'?[]:c==='t2'?[b+'t1']:[b+(d===3?'t2':ln+(d-1))];
 SKN.push({id:b+c,b,c,ln,d,sv,cap:d===6,c0:SKCOST[i],n:SKD[b][i][0],e:SKD[b][i][1],par,tier:d===6?5:Math.max(0,d-2)})});
const SKI={};for(const n of SKN)SKI[n.id]=n;
const SKS={v:3,pt:0,lv:1,xp:0,own:{},clr:[0,0,0,0,0]};
// EXP needed to go from level L to L+1 (grows a little every level)
const skNeed=L=>Math.round(150+6*L+0.15*L*L),SKLV_HP=1,SKLV_ATK=0.003;
try{const s=JSON.parse(localStorage.getItem('koma_skill')||'null');
 if(s&&s.v===3)Object.assign(SKS,s);
 else if(s&&s.v===2){// old point rules: keep skills and points, and turn every point earned so far into one level
  Object.assign(SKS,s);delete SKS.c2;delete SKS.nd;let e=SKS.pt|0;for(const id in SKS.own)if(SKI[id])e+=SKI[id].c0;
  SKS.v=3;SKS.lv=1+e;SKS.xp=0;skSave()}
 else{// first run or the old 4×4 tree: keep the record of cleared stages (old skills are cleared), 3 levels per cleared stage
  for(let i=0;i<5;i++)SKS.clr[i]=s&&s.clr?(s.clr[i]?1:0):(+(localStorage.getItem('koma_hi'+i)||0)>0?1:0);
  const n=SKS.clr.filter(v=>v).length;SKS.pt=n*3;SKS.lv=1+n*3;skSave()}}catch(e){}
function skSave(){try{localStorage.setItem('koma_skill',JSON.stringify(SKS))}catch(e){}}
const skHas=id=>!!DEV||!!SKS.own[id],skOwn=id=>!!SKS.own[id],skClr=()=>SKS.clr.filter(v=>v).length;
// own | prev (earlier panel missing) | tier (not enough stages cleared) | pt | ok
function skState(n){if(skHas(n.id))return'own';if(n.par.some(p=>!skHas(p)))return'prev';
 if(skClr()<n.tier)return'tier';return SKS.pt<n.c0?'pt':'ok'}
const skAny=()=>SKN.some(n=>skState(n)==='ok');
var DEV=0;try{DEV=localStorage.getItem('koma_dev')==='1'?1:0}catch(e){}// 超強化の ON/OFF は localStorage の koma_dev に保存（リロードしても残る）。 開発者用の裏技（設定画面の「設定」を10回タップすると開発者メニューが出て、そこの「超強化」ボタンで切り替え。ONだとプレイ中に「ボスへ」ボタンも出る）。無敵ではなく体力が桁違いに多い
let SK={},skPop=null,skMsg=null,skSel=null;
// effective values for the current game (neutral in versus / demo); called from resetPlayer
function skApply(){const on=G.mode!=='pvp'&&!G.demoOn,h=c=>on&&skHas(c);
const s={atk:1,rel:1,mag:16,cool:1,crit:1.25,pierce:0,crush:0,low:0,def:1,spd:1,dash:1,dinv:0.34,ddist:1,dash2:0,jump:1,sj:0,grav:1,air:0,dj:0,airc:0,
 hp:100,regen:0,heal:1,heal2:1,steady:0,fud:0,rev:0,revH:0.3,gauge:1,spw:1,gReg:0,gKeep:0,gKill:0,g0:0,beam:0.8,spinv:0,gAfter:0,again:0,spCost:0,pow:12};
// level: a small rise of the base numbers
if(on){const k=Math.max(0,(SKS.lv|0)-1);s.hp+=k*SKLV_HP;s.atk*=1+k*SKLV_ATK}
// 攻
if(h('0t1'))s.atk*=1.05;if(h('0t2'))s.atk*=1.08;
if(h('0A3'))s.rel*=0.8;if(h('0A4'))s.mag+=4;if(h('0A5'))s.cool/=1.12;if(h('0A6')){s.mag=Math.round(s.mag*1.5);s.cool/=1.3;s.rel*=0.7}
if(h('0B3'))s.crit*=1.15;if(h('0B4'))s.pierce=1;if(h('0B5'))s.crush=1;if(h('0B6')){s.atk*=1.35;s.crit*=1.3}
if(h('0C3')){s.atk*=1.18;s.def*=1.2}if(h('0C4')){s.low=0.25;s.heal*=0.7}
// 速
if(h('1t1'))s.spd*=1.06;if(h('1t2'))s.dash*=0.75;
if(h('1A3'))s.spd*=1.05;if(h('1A4'))s.dinv=0.5;if(h('1A5'))s.ddist=1.2;if(h('1A6'))s.dash2=1;
if(h('1B3'))s.sj=1;if(h('1B4'))s.grav=1/1.2;if(h('1B5'))s.air=0.1;if(h('1B6')){s.dj=1;s.air=0.2}
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
SK=s;if(DEV&&G.mode!=='pvp')Object.assign(SK,{atk:20,rel:0.15,mag:40,cool:0.7,hp:99999,heal:3,def:1,rev:1,dash:0.2,dj:1,gauge:3,spinv:1,spd:1.3,crit:2,beam:2,regen:2});if(typeof wpApply==='function')wpApply(SK)}// weapon numbers (weapons.js)
skApply();
function addGauge(v){if(pl.sp)return;pl.gauge=Math.min(100,pl.gauge+v*SK.gauge)}
// damage multiplier from skills that depend on the moment (air time, low HP); crits are separate
function skAtk(){let m=SK.atk;if(SK.air&&pl.y>0.05)m*=1+SK.air;if(SK.low)m*=1+SK.low*(1-sat(pl.hp/SK.hp));return m}
const spReady=()=>pl.gauge>=100||pl.spX>0;
function skMsgOf(s,n){return s==='own'?'習得済みです':s==='prev'?'手前のスキルを先に習得しよう':s==='tier'?(n.cap?'５つのステージをすべてクリアすると解放':'ステージを'+n.tier+'つクリアすると解放'):'ポイントが足りません（あと'+(n.c0-SKS.pt)+'）'}
function skBuy(n){const s=skState(n);if(s!=='ok'){skMsg={s:skMsgOf(s,n),t:now};return}
SKS.pt-=n.c0;SKS.own[n.id]=1;SKS.last=n.id;skSave();snd('item');skPop={id:n.id,t:now};skMsg=null}
// take back one panel (only the end of a path); all its points come back
function skUndo(n){if(!skOwn(n.id))return;if(SKN.some(m=>skOwn(m.id)&&m.par.includes(n.id))){skMsg={s:'先のスキルを外してから',t:now};return}
delete SKS.own[n.id];const r=n.c0-SKRESPEC;SKS.pt+=r;if(SKS.last===n.id)SKS.last=n.par[0]||null;skSave();snd('ui');skMsg={s:n.n+'を外しました（振り直し代'+SKRESPEC+'ポイント・'+r+'ポイント戻りました）',t:now}}
let skConf=false;// 全て振り直すの確認ポップアップ
function skRespecInfo(){let sp=0,k=0;for(const n of SKN)if(skOwn(n.id)){sp+=n.c0;k++}return{k,sp,loss:k*SKRESPEC,back:sp-k*SKRESPEC}}
function skAskReset(){if(!skRespecInfo().k){skMsg={s:'習得したスキルがありません',t:now};return}skConf=true}
function skReset(){let r=0,k=0;for(const n of SKN)if(skOwn(n.id)){r+=n.c0-SKRESPEC;k++}if(!k)return;SKS.pt+=r;SKS.own={};SKS.last=null;skSave();skMsg={s:'振り直し：'+k+'個外して'+r+'ポイント戻りました（1個につき'+SKRESPEC+'ポイント）',t:now}}
// EXP at the end of a game (solo / co-op, once per game). Enemies beaten (by anyone in co-op) × stage enemy strength,
// and on a clear the boss and a clear bonus that grow with the stage. Game over keeps the EXP of the enemies beaten.
// own table (enemy strength per stage, kept apart from DIF so easing story mode does not cut the EXP); 難易度：極 ×EXK.xp
const XPK=[[1.25,1.2],[1.5,1.4],[1.8,1.6],[2.15,1.85],[2.6,2.15]];
function skExp(cl){const i=G.stage,d=XPK[Math.min(i,XPK.length-1)],k=Math.max(0,(G.kills|0)-(cl?1:0));return Math.round((k*10*d[0]+(cl?150*d[1]+60*(i+1):0))*(G.ex?EXK.xp:1))}
function skGain(x){SKS.xp+=x;let up=0;while(SKS.xp>=skNeed(SKS.lv)){SKS.xp-=skNeed(SKS.lv);SKS.lv++;SKS.pt++;up++}return up}
// result screen level bar: the gauge fills from the old EXP, and wraps round at each level-up (one segment per level passed)
function skSegs(l,x,rem){const g=[];for(let n=0;n<200;n++){const need=skNeed(l),room=need-x;if(rem>=room){g.push({lv:l,a:x/need,b:1});rem-=room;l++;x=0}else{g.push({lv:l,a:x/need,b:(x+rem)/need});break}}return g}
function drawLvBar(t){const r=G.rew;if(!r||!r.xp||!r.segs||t<0)return;const sg=r.segs,L=sg.reduce((a,q)=>a+q.b-q.a,0),D=Math.min(4.2,1.0+0.6*(sg.length-1)+0.8*Math.min(1,L)),k=sat((t-0.45)/D),pos=(k<=0?0:1-Math.pow(1-k,1.8))*L;
let acc=0,ci=0,fill=sg[0].a;for(let i=0;i<sg.length;i++){const w=sg[i].b-sg[i].a;if(pos<=acc+w||i===sg.length-1){ci=i;fill=sg[i].a+Math.max(0,Math.min(w,pos-acc));break}acc+=w}
if(k<=0){ci=0;fill=sg[0].a}
if(ci>r.lu){while(r.lu<ci){r.lu++;snd('item');shake(0.25);flash(0.12)}r.lt=t}
const lvT=r.lt!=null?t-r.lt:9,pop=lvT<0.5?1+0.7*Math.sin(Math.min(1,lvT/0.5)*PI)*(1-lvT/0.5):1,s0=easeBack(sat(t/0.25)),done=k>=1,lv=sg[ci].lv;
ctx.save();ctx.translate(1118,654);ctx.rotate(-0.03);ctx.scale(s0,s0);const pw=268,ph=76;
ctx.fillStyle=INK;ctx.fillRect(-pw/2+7,-ph/2+8,pw,ph);ctx.fillStyle='#ffd91a';ctx.fillRect(-pw/2,-ph/2,pw,ph);ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.strokeRect(-pw/2,-ph/2,pw,ph);
txt('経験値 ＋'+r.xp,-pw/2+14,-ph/2+17,18,INK,null,0,'left');
if(r.up&&r.lu>0){const a=easeBack(sat(lvT<9?lvT/0.25:1));ctx.save();ctx.translate(pw/2-12,-ph/2+17);ctx.scale(Math.max(0.01,a),Math.max(0.01,a));txt('スキルＰ＋'+r.lu,0,0,20,'#e5402b','#fff',4,'right');ctx.restore()}
ctx.save();ctx.translate(-pw/2+46,ph/2-26);ctx.scale(pop,pop);txt('Lv',-24,8,20,INK,null,0,'center');txt(String(lv),12,0,38,'#e5402b','#fff',7,'center');ctx.restore();
const bx=-pw/2+88,by=ph/2-36,bw=pw-104,bh=20;ctx.fillStyle=INK;ctx.fillRect(bx-3,by-3,bw+6,bh+6);ctx.fillStyle='#fff';ctx.fillRect(bx,by,bw,bh);
ctx.save();ctx.beginPath();ctx.rect(bx,by,bw,bh);ctx.clip();ctx.fillStyle=lvT<0.4?'#fff27a':'#2ea8e8';ctx.fillRect(bx,by,bw*fill,bh);ctx.fillStyle='rgba(255,255,255,.4)';ctx.fillRect(bx,by,bw*fill,bh*0.35);
if(lvT<0.5){ctx.fillStyle='rgba(255,255,255,'+(0.8*(1-lvT/0.5))+')';ctx.fillRect(bx,by,bw,bh)}ctx.restore();
ctx.restore()}
function skReward(cl){if(G.mode==='pvp'||G.demoOn||G.rew!=null)return;const i=G.stage;
if(cl&&!SKS.clr[i])SKS.clr[i]=1;const xp=skExp(cl),lv0=SKS.lv,xp0=SKS.xp,up=skGain(xp);
G.rew={xp,up,lv:SKS.lv,lv0,xp0,segs:skSegs(lv0,xp0,xp),lu:0};skSave();gaReward(cl)}// コマ札 (gacha.js)
// ---- skill tree screen: a manga panel with the cross (pan / zoom) ----
// The cross is drawn in "world" coords around SKC and shown through a view (SKVR) that can be dragged, pinched and wheel-zoomed.
const SKC=[380,394],SKST=62,SKSW=48,SKO=[[0,-1],[1,0],[0,1],[-1,0]],SKSD=[[1,0],[0,1],[-1,0],[0,-1]];
const SKVR={x:30,y:22,w:700,h:676},SKVC=[380,368],SKS0=0.94,skV={x:0,y:0,s:SKS0},skP={};let skPinch=null;
function skPos(b,d,sv){const o=SKO[b],s=SKSD[b];return[SKC[0]+o[0]*SKST*d+s[0]*SKSW*sv,SKC[1]+o[1]*SKST*d+s[1]*SKSW*sv]}
function skScr(p){return[SKVC[0]+skV.x+(p[0]-SKC[0])*skV.s,SKVC[1]+skV.y+(p[1]-SKC[1])*skV.s]}
const skIn=p=>p.x>=SKVR.x&&p.x<=SKVR.x+SKVR.w&&p.y>=SKVR.y&&p.y<=SKVR.y+SKVR.h;
function skClampV(){const m=500*skV.s;skV.x=clamp(skV.x,-m,m);skV.y=clamp(skV.y,-m,m)}
function skZoom(f,px,py){const s1=clamp(skV.s*f,0.5,2.2),k=s1/skV.s;skV.x=(px-SKVC[0])-(px-SKVC[0]-skV.x)*k;skV.y=(py-SKVC[1])-(py-SKVC[1]-skV.y)*k;skV.s=s1;skClampV()}
function skHit(x,y){let best=null,bd=1e9;for(const n of SKN){if(skVis(n)<2)continue;const q=skScr(skPos(n.b,n.d,n.sv)),d=Math.hypot(q[0]-x,q[1]-y);if(d<(n.cap?30:17)*skV.s+10&&d<bd){bd=d;best=n}}return best}
// pointer hooks from the input code: ph 'd' down / 'm' move / 'u' up. Returns true when the tree used the event.
function skTouch(ph,p,id){if(G.state!=='menu'||G.menu!=='skill'||setOpen||wipe.on||skConf){for(const k in skP)delete skP[k];skPinch=null;return false}
 if(ph==='d'){if(!skIn(p))return false;for(const b of btns)if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h)return false;
  skP[id]={x:p.x,y:p.y,x0:p.x,y0:p.y,mv:0};const ks=Object.keys(skP);if(ks.length===2){const a=skP[ks[0]],b=skP[ks[1]];skPinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1};a.mv=b.mv=1}return true}
 const q=skP[id];if(!q)return false;
 if(ph==='m'){const ks=Object.keys(skP);
  if(ks.length>=2&&skPinch){const a=skP[ks[0]],b=skP[ks[1]],mx0=(a.x+b.x)/2,my0=(a.y+b.y)/2;q.x=p.x;q.y=p.y;const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,d=Math.hypot(a.x-b.x,a.y-b.y)||1;skV.x+=mx-mx0;skV.y+=my-my0;skZoom(d/skPinch.d,mx,my);skPinch.d=d}
  else{skV.x+=p.x-q.x;skV.y+=p.y-q.y;q.x=p.x;q.y=p.y;if(Math.hypot(p.x-q.x0,p.y-q.y0)>10)q.mv=1;skClampV()}return true}
 delete skP[id];if(Object.keys(skP).length<2)skPinch=null;if(!q.mv){const n=skHit(q.x,q.y);if(n){skSel=n.id;skMsg=null;snd('ui')}}return true}
function skWheel(p,dy){if(G.state!=='menu'||G.menu!=='skill'||setOpen||skConf||!skIn(p))return false;skZoom(Math.exp(-dy*0.0015),p.x,p.y);return true}
let skDotW=null;// white halftone for the dark panel
function skTone(){if(!skDotW){const c=document.createElement('canvas');c.width=c.height=8;const g=c.getContext('2d');g.fillStyle='#fff';g.beginPath();g.arc(2,2,1.3,0,TAU);g.fill();g.beginPath();g.arc(6,6,1.3,0,TAU);g.fill();skDotW=ctx.createPattern(c,'repeat')}return skDotW}
function skDisc(x,y,r,fill,lw){ctx.beginPath();ctx.arc(x+3,y+4,r,0,TAU);ctx.fillStyle=INK;ctx.fill();ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=lw||4;ctx.stroke()}
function skGlint(x,y,r){ctx.save();ctx.globalAlpha=0.75;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(x-r*0.35,y-r*0.42,r*0.32,r*0.17,-0.6,0,TAU);ctx.fill();ctx.restore()}
function skEdge(a,b,on,col,t){ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);
 if(!on){ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#5d6799';ctx.lineWidth=3;ctx.stroke();ctx.lineCap='butt';return}
 ctx.strokeStyle=INK;ctx.lineWidth=13;ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=8;ctx.stroke();
 ctx.setLineDash([6,14]);ctx.lineDashOffset=-t*50;ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([]);ctx.lineDashOffset=0;ctx.lineCap='butt'}
// 2 = shown, 1 = a dark "？" teaser one step beyond what can be taken now, 0 = hidden
function skVis(n){if(skHas(n.id)||n.par.every(skHas))return 2;return n.par.every(p=>{const m=SKI[p];return m.par.every(skHas)})?1:0}
// open the tree zoomed in: on the start the first time, then on the last panel taken
function skFocus(){const id=SKS.last&&skHas(SKS.last)?SKS.last:null,n=id&&SKI[id],p=n?skPos(n.b,n.d,n.sv):SKC;skV.s=1.3;skV.x=-(p[0]-SKC[0])*skV.s;skV.y=-(p[1]-SKC[1])*skV.s;skClampV()}
function skDia(x,y,r){ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath()}
function skHex(x,y,r){ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU-PI/2;i?ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}ctx.closePath()}
function skSpark(x,y,r){ctx.beginPath();ctx.moveTo(x,y-r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.quadraticCurveTo(x,y,x,y+r);ctx.quadraticCurveTo(x,y,x-r,y);ctx.quadraticCurveTo(x,y,x,y-r);ctx.fill()}
function skNode(n,t){const v=skVis(n);if(!v)return;
 if(v===1){const p=skPos(n.b,n.d,n.sv);ctx.save();ctx.globalAlpha=0.75;if(n.cap)skDia(p[0],p[1],22);else{ctx.beginPath();ctx.arc(p[0],p[1],13,0,TAU)}ctx.fillStyle='#232a58';ctx.fill();ctx.setLineDash([4,4]);ctx.strokeStyle='#7c86c4';ctx.lineWidth=2;ctx.stroke();ctx.restore();txt('？',p[0],p[1]+1,n.cap?20:15,'#8b93c0');return}
const p=skPos(n.b,n.d,n.sv),x=p[0],y=p[1],s=skState(n),own=s==='own',ok=s==='ok',col=SKB[n.b].col,sel=skSel===n.id;
 const bob=ok?Math.abs(Math.sin(t*5+n.d))*2.5:0,yy=y-bob;
 if(n.cap){const r=30;if(own){ctx.fillStyle='#fff6b0';for(let i=0;i<4;i++){const a=t*1.2+i/4*TAU;skSpark(x+Math.cos(a)*(r+12),yy+Math.sin(a)*(r+12),5+2*Math.sin(t*6+i))}}
  skDia(x+3,yy+4,r);ctx.fillStyle=INK;ctx.fill();skDia(x,yy,r);ctx.fillStyle=own?col:ok?'#fff':'#3a4170';ctx.fill();ctx.strokeStyle=ok?(Math.sin(t*8)>0?'#ffd91a':INK):INK;ctx.lineWidth=5;ctx.stroke();
  skDia(x,yy,r-8);ctx.strokeStyle=own?'#ffd91a':ok?col:'#5d6799';ctx.lineWidth=2.5;ctx.stroke();
  if(own){ctx.save();skDia(x,yy,r);ctx.clip();ctx.globalAlpha=0.35;ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x-r,yy-r*0.15);ctx.lineTo(x+r*0.15,yy-r);ctx.lineTo(x+r*0.4,yy-r);ctx.lineTo(x-r,yy+r*0.1);ctx.fill();ctx.restore()}
  txt('極',x,yy+1,26,own?'#fff':ok?INK:'#8b93c0',own?INK:null,own?6:0)}
 else{const r=15;skDisc(x,yy,r,own?col:ok?'#fff':'#3a4170',4);
  if(ok){ctx.strokeStyle=Math.sin(t*8)>0?'#ffd91a':col;ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,yy,r-3,0,TAU);ctx.stroke()}
  if(own)skGlint(x,yy,r);
  txt(own?n.n[0]:String(n.c0),x,yy+1,own?17:16,own?'#fff':ok?INK:'#8b93c0',own?INK:null,own?5:0)}
 if(sel){ctx.save();ctx.setLineDash([7,6]);ctx.lineDashOffset=t*20;ctx.strokeStyle='#ffd91a';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,yy,n.cap?40:23,0,TAU);ctx.stroke();ctx.restore()}
 if(skPop&&skPop.id===n.id&&now-skPop.t<0.8){const u=now-skPop.t,k=easeBack(sat(u/0.18))*(1+0.25*(1-sat(u/0.18)));ctx.save();ctx.globalAlpha=sat((0.8-u)/0.2);ctx.translate(x,yy-40);ctx.rotate(-0.12);ctx.scale(k*0.55,k*0.55);
  burstPath(4,5,104,40,14,1.25,7);ctx.fillStyle=INK;ctx.fill();burstPath(0,0,104,40,14,1.25,7);ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();txt('習得！',0,2,40,'#e5402b',INK,6,'center','#fff',12);ctx.restore()}}
function skBadge(b,t){const p=skPos(b,7.4,0),col=SKB[b].col,x=p[0],y=p[1],r=42;
 const c=skPos(b,1,0);ctx.save();ctx.setLineDash([3,10]);ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(c[0],c[1]);ctx.lineTo(x,y);ctx.stroke();ctx.restore();
 skHex(x+4,y+5,r);ctx.fillStyle=INK;ctx.fill();skHex(x,y,r);ctx.fillStyle=col;ctx.fill();
 ctx.save();skHex(x,y,r);ctx.clip();ctx.globalAlpha=0.28;ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x-r,y-r*0.2);ctx.lineTo(x+r*0.2,y-r);ctx.lineTo(x+r*0.55,y-r);ctx.lineTo(x-r,y+r*0.35);ctx.fill();ctx.globalAlpha=0.18;ctx.fillStyle=INK;ctx.fillRect(x-r,y+r*0.45,r*2,r);ctx.restore();
 skHex(x,y,r);ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.stroke();skHex(x,y,r-8);ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.stroke();
 txt(SKB[b].n,x,y+2,40,'#fff',INK,10);
 for(const[k,sv,c3]of[['la',-1,'A3'],['lb',1,'B3']]){if(skVis(SKI[b+c3])<2)continue;const q=skPos(b,3,sv*2.3);txt(SKB[b][k],q[0],q[1],17,'#fff',INK,6)}}
function skCore(t){const x=SKC[0],y=SKC[1],R=44;
 ctx.save();ctx.translate(x,y);ctx.rotate(t*0.4);ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=3;ctx.setLineDash([6,8]);ctx.beginPath();ctx.arc(0,0,R+10,0,TAU);ctx.stroke();ctx.restore();
 ctx.beginPath();ctx.arc(x+4,y+5,R,0,TAU);ctx.fillStyle=INK;ctx.fill();
 for(let b=0;b<4;b++){const a=[-PI/2,0,PI/2,PI][b];ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,R,a-PI/4,a+PI/4);ctx.closePath();ctx.fillStyle=SKB[b].col;ctx.fill()}
 ctx.strokeStyle=INK;ctx.lineWidth=4;for(let i=0;i<4;i++){const a=i/4*TAU+PI/4;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*24,y+Math.sin(a)*24);ctx.lineTo(x+Math.cos(a)*R,y+Math.sin(a)*R);ctx.stroke()}
 ctx.beginPath();ctx.arc(x,y,R,0,TAU);ctx.lineWidth=6;ctx.stroke();
 ctx.beginPath();ctx.arc(x,y,27,0,TAU);ctx.fillStyle='#1a2050';ctx.fill();ctx.strokeStyle='#ffd91a';ctx.lineWidth=3;ctx.stroke();ctx.beginPath();ctx.arc(x,y,27,0,TAU);ctx.strokeStyle=INK;ctx.lineWidth=1;ctx.stroke();
 txt('起点',x,y+1,19,'#fff',INK,4)}
function skRoundBtn(x,y,label,cb){btns.push({x:x-24,y:y-24,w:48,h:48,cb});skDisc(x,y,21,'#fff',4);txt(label,x,y+1,label.length>1?15:28,INK)}
function drawSkill(){const nc=skClr(),t=now,R=SKVR;
// ---- left: a manga panel with focus lines ----
ctx.fillStyle=INK;ctx.fillRect(R.x+9,R.y+10,R.w,R.h);ctx.save();
const bg=ctx.createRadialGradient(SKVC[0],SKVC[1],40,SKVC[0],SKVC[1],520);bg.addColorStop(0,'#3d55c4');bg.addColorStop(1,'#151b44');ctx.fillStyle=bg;ctx.fillRect(R.x,R.y,R.w,R.h);
ctx.beginPath();ctx.rect(R.x,R.y,R.w,R.h);ctx.clip();
ctx.globalAlpha=0.09;ctx.fillStyle=skTone();ctx.fillRect(R.x,R.y,R.w,R.h);ctx.globalAlpha=1;
ctx.translate(SKVC[0]+skV.x,SKVC[1]+skV.y);ctx.scale(skV.s,skV.s);ctx.translate(-SKC[0],-SKC[1]);
for(const n of SKN){const v=skVis(n);if(!v)continue;const p=skPos(n.b,n.d,n.sv),q=n.par.length?skPos(SKI[n.par[0]].b,SKI[n.par[0]].d,SKI[n.par[0]].sv):SKC;if(v===1){ctx.save();ctx.setLineDash([4,7]);ctx.strokeStyle='rgba(140,150,210,.5)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(p[0],p[1]);ctx.stroke();ctx.restore()}else skEdge(q,p,skHas(n.id),SKB[n.b].col,t)}
for(let b=0;b<4;b++)skBadge(b,t);skCore(t);for(const n of SKN)skNode(n,t);
ctx.restore();ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.strokeRect(R.x,R.y,R.w,R.h);
skRoundBtn(R.x+46,R.y+R.h-46,'＋',()=>skZoom(1.25,SKVC[0],SKVC[1]));skRoundBtn(R.x+104,R.y+R.h-46,'－',()=>skZoom(0.8,SKVC[0],SKVC[1]));skRoundBtn(R.x+162,R.y+R.h-46,'元へ',skFocus);
txt(touchMode?'指で動かす・２本指で拡大':'ドラッグで移動・ホイールで拡大',R.x+R.w-22,R.y+R.h-28,15,'#fff',INK,5,'right');
// ---- right: info panel ----
const X=750;para(X,104,330,56,20);ctx.fillStyle=INK;ctx.fill();txt('スキルツリー',X+175,133,32,'#fff');
para(X+6,182,480,62,16);ctx.fillStyle=INK;ctx.fill();para(X,176,480,62,16);ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();
txt('Lv',X+36,210,22,INK);txt(String(SKS.lv),X+86,206,40,'#e5402b',INK,4);txt('スキルＰ',X+176,207,21,INK);txt(String(SKS.pt),X+248,206,40,'#e5402b',INK,4);
{const nd=skNeed(SKS.lv),bx=X+296,bw=158;txt('クリア '+nc+'/5',bx+bw/2,190,13,INK);ctx.fillStyle=INK;ctx.fillRect(bx-2,198,bw+4,14);ctx.fillStyle='#fff';ctx.fillRect(bx,200,bw,10);ctx.fillStyle='#35b8ff';ctx.fillRect(bx,200,bw*sat(SKS.xp/nd),10);txt('次のLvまで '+(nd-SKS.xp),bx+bw/2,224,13,INK)}
const cy=262,ch=270;panel(X,cy,478,ch);
const n=skSel&&SKI[skSel];
if(n){const s=skState(n),col=SKB[n.b].col,path=n.ln==='A'?SKB[n.b].la:n.ln==='B'?SKB[n.b].lb:n.ln==='C'?'寄り道':'基本';
 skHex(X+53,cy+56,30);ctx.fillStyle=INK;ctx.fill();skHex(X+50,cy+52,30);ctx.fillStyle=col;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();skHex(X+50,cy+52,24);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();txt(SKB[n.b].n,X+50,cy+54,28,'#fff',INK,7);
 txt(path+(n.cap?'・極み':'・'+'一二三四五'[n.d-1]+'段'),X+96,cy+34,16,'#555a70',null,0,'left');
 txt(n.n,X+96,cy+66,n.n.length>8?26:30,INK,null,0,'left');
 txt(n.e,X+239,cy+124,n.e.length>21?17:20,INK);
 para(X+22,cy+160,116,40,10);ctx.fillStyle=col;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();txt(n.c0+'ポイント',X+86,cy+181,20,'#fff',INK,5);
 txt(s==='own'?'習得済み！':s==='ok'?'習得できる！':skMsgOf(s,n),X+320,cy+180,s==='own'||s==='ok'?24:15,s==='own'?'#1f9a4a':s==='ok'?'#e5402b':'#6a6f88',s==='own'||s==='ok'?'#fff':null,s==='own'||s==='ok'?6:0);
 if(s==='own')B(X+130,cy+204,220,52,'外す（-'+SKRESPEC+'）',()=>skUndo(n),{size:26,col:'#d8d8e0'});else B(X+130,cy+204,220,52,'習得する',()=>skBuy(n),{size:26,col:s==='ok'?'#ff4a3d':'#d8d8e0',tc:s==='ok'?'#fff':'#6a6f88'})}
else{txt('光っている丸をタップして選ぼう',X+239,cy+58,23,INK);txt('習得すると、その先が見えてくる',X+239,cy+106,18,INK);txt('レベルが上がるとポイント＋1',X+239,cy+138,18,INK);txt('やりこめば、いつか全部取れる！',X+239,cy+194,20,'#e5402b','#fff',6)}
if(skMsg&&now-skMsg.t<2.2)txt(skMsg.s,X+245,562,20,'#ff5a4d',INK,6,'center','#fff',10);else txt('Lvアップ：ポイント＋1・体力＋1・攻撃＋0.3％／外すと1個-1',X+245,562,15,'#fff',INK,5);
B(X,616,220,56,'もどる',()=>{G.menu='main';skMsg=null;skSel=null},{size:26});B(X+250,616,230,56,'全て振り直す',()=>skAskReset(),{size:24,col:'#ff4a3d',tc:'#fff'});
if(skConf){const f=skRespecInfo();btns.length=0;ctx.fillStyle='rgba(10,12,40,.72)';ctx.fillRect(0,0,W,H);
 const x=340,y=170,w=600,h=380;panel(x,y,w,h);ctx.fillStyle='#e5402b';ctx.fillRect(x,y,w,64);ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.strokeRect(x,y,w,64);txt('全て振り直しますか？',x+w/2,y+34,32,'#fff',INK,6);
 txt('習得したスキル '+f.k+'個を、すべて外します',x+w/2,y+98,22,INK);
 txt('使ったポイント　'+f.sp,x+w/2,y+142,24,INK);
 txt('振り直し代　-'+f.loss+'（1個につき'+SKRESPEC+'）',x+w/2,y+182,24,'#e5402b');
 txt('戻るポイント　'+f.back,x+w/2,y+222,26,INK);
 txt('現在 '+SKS.pt+' → 変更後 '+(SKS.pt+f.back),x+w/2,y+274,34,'#e5402b','#fff',7);
 B(x+40,y+306,240,58,'やめる',()=>{skConf=false},{size:26});B(x+w-280,y+306,240,58,'振り直す',()=>{skConf=false;skReset()},{size:26,col:'#ff4a3d',tc:'#fff'})}}
