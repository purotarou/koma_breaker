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
// ---- skill tree screen: a cross of panels (manga page) ----
const SKC=[380,394],SKST=40,SKSW=34,SKO=[[0,-1],[1,0],[0,1],[-1,0]],SKSD=[[1,0],[0,1],[-1,0],[0,-1]];
function skPos(b,d,sv){const o=SKO[b],s=SKSD[b];return[SKC[0]+o[0]*SKST*d+s[0]*SKSW*sv,SKC[1]+o[1]*SKST*d+s[1]*SKSW*sv]}
function skLine(a,b,on,col){ctx.lineCap='round';ctx.strokeStyle=INK;ctx.lineWidth=on?11:5;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();if(on){ctx.strokeStyle=col;ctx.lineWidth=6;ctx.stroke()}ctx.lineCap='butt'}
function drawSkill(){const nc=skClr();
// paper page behind the cross (also covers the logo on this screen)
ctx.fillStyle=INK;ctx.fillRect(38,30,700,676);ctx.fillStyle='#f6f0df';ctx.fillRect(30,22,700,676);ctx.save();ctx.globalAlpha=0.12;ctx.fillStyle=dotPat;ctx.fillRect(30,22,700,676);ctx.restore();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.strokeRect(30,22,700,676);
// edges first
for(const n of SKN){const p=skPos(n.b,n.d,n.sv),q=n.par.length?skPos(SKI[n.par[0]].b,SKI[n.par[0]].d,SKI[n.par[0]].sv):SKC;skLine(q,p,skHas(n.id),SKB[n.b].col)}
for(let b=0;b<4;b++){const bc=SKB[b].col,t=skPos(b,7.05,0);ctx.beginPath();ctx.arc(t[0]+3,t[1]+4,21,0,TAU);ctx.fillStyle=INK;ctx.fill();ctx.beginPath();ctx.arc(t[0],t[1],21,0,TAU);ctx.fillStyle=bc;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();txt(SKB[b].n,t[0],t[1]+1,26,'#fff',INK,6);
 for(const[k,sv]of[['la',-1],['lb',1]]){const q=skPos(b,6.9,sv);txt(SKB[b][k],q[0],q[1],15,'#fff',INK,5)}}
// start node
ctx.beginPath();ctx.arc(SKC[0],SKC[1],24,0,TAU);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();txt('起点',SKC[0],SKC[1]+1,17,INK);
for(const n of SKN){const p=skPos(n.b,n.d,n.sv),s=skState(n),own=s==='own',ok=s==='ok',bc=SKB[n.b].col,r=n.cap?19:15,sel=skSel===n.id;
 btns.push({x:p[0]-21,y:p[1]-21,w:42,h:42,cb:()=>{skSel=n.id;skMsg=null}});
 ctx.beginPath();ctx.arc(p[0]+3,p[1]+4,r,0,TAU);ctx.fillStyle=INK;ctx.fill();
 ctx.beginPath();ctx.arc(p[0],p[1],r,0,TAU);ctx.fillStyle=own?bc:ok?'#fff':'#c9c9d3';ctx.fill();
 ctx.strokeStyle=ok?(Math.sin(now*8)>0?'#ffd91a':INK):INK;ctx.lineWidth=ok?6:4;ctx.stroke();
 if(sel){ctx.beginPath();ctx.arc(p[0],p[1],r+7,0,TAU);ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke()}
 txt(n.cap?'極':String(n.c0),p[0],p[1]+1,n.cap?20:17,own?'#fff':s==='ok'||s==='pt'?INK:'#7a7a88',own?INK:null,own?5:0);
 if(skPop&&skPop.id===n.id&&now-skPop.t<0.7){const u=now-skPop.t,k=easeBack(sat(u/0.18))*(1+0.25*(1-sat(u/0.18)));ctx.save();ctx.globalAlpha=sat((0.7-u)/0.2);ctx.translate(p[0],p[1]-34);ctx.rotate(-0.12);ctx.scale(k*0.6,k*0.6);burstPath(4,5,104,40,14,1.25,7);ctx.fillStyle=INK;ctx.fill();burstPath(0,0,104,40,14,1.25,7);ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();txt('習得！',0,2,40,'#e5402b',INK,6,'center','#fff',12);ctx.restore()}}
// right column: title, points, the chosen panel
const X=742;para(X,108,300,52,18);ctx.fillStyle=INK;ctx.fill();txt('スキルツリー',X+160,135,30,'#fff');
para(X+6,180,480,62,16);ctx.fillStyle=INK;ctx.fill();para(X,174,480,62,16);ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();
txt('スキルポイント',X+120,205,24,INK);txt(String(SKS.pt),X+320,205,46,'#e5402b',INK,4);txt('クリア済み '+nc+'/5',X+420,205,17,INK);
ctx.fillStyle=INK;ctx.fillRect(X+6,268,480,250);ctx.fillStyle='#fff';ctx.fillRect(X,262,480,250);ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.strokeRect(X,262,480,250);
const n=skSel&&SKI[skSel];
if(n){const s=skState(n),bc=SKB[n.b].col;para(X+16,278,96,34,10);ctx.fillStyle=bc;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();txt(SKB[n.b].n+'・'+(n.ln==='A'?SKB[n.b].la:n.ln==='B'?SKB[n.b].lb:n.ln==='C'?'枝':'幹'),X+68,296,18,'#fff',INK,4);
 txt(n.n,X+130,296,n.n.length>8?24:28,INK,null,0,'left');txt(n.e,X+240,356,n.e.length>20?17:20,INK);
 txt(n.c0+'ポイント',X+90,410,22,'#e5402b');txt(s==='own'?'習得済み':s==='ok'?'習得できる':skMsgOf(s,n),X+300,410,s==='own'||s==='ok'?22:16,s==='own'?'#1f9a4a':s==='ok'?INK:'#7a7a88');
 if(s==='own')B(X+130,438,220,58,'外す',()=>skUndo(n),{size:26,col:'#d8d8e0'});else B(X+130,438,220,58,'習得する',()=>skBuy(n),{size:26,col:s==='ok'?'#ff4a3d':'#d8d8e0',tc:s==='ok'?'#fff':INK})}
else{txt('丸をタップしてスキルを選ぼう',X+240,320,22,INK);txt('同じ系統では、３本の道から１本だけ',X+240,366,18,INK);txt('道の先の「極」は、その道を極めた証',X+240,398,18,INK);txt('ポイントは全部で'+SKMAX+'。全部は取れない',X+240,446,18,'#e5402b')}
if(skMsg&&now-skMsg.t<2.2)txt(skMsg.s,X+240,548,20,'#ff5a4d',INK,6,'center','#fff',10);else txt('初クリア＋3／2回目＋1／ボスを無傷で＋1／全面クリア＋4',X+240,548,16,'#fff',INK,5);
B(X,620,220,56,'もどる',()=>{G.menu='main';skMsg=null;skSel=null},{size:26});B(X+250,620,230,56,'全部振り直し',()=>skReset(),{size:24,col:'#d8d8e0'})}
