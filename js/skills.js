'use strict';
// ================= SKILL TREE =================
// Every skill only changes the local player's own numbers (damage dealt, own HP, jumps, gauge), which each client
// already computes for itself in co-op, so nothing extra goes over the network. Skills are off in versus and the demo.
// Unlocking: spend skill points (stage clear +2, first clear of a stage +3 more, defeat +1) on the next panel of a
// branch; tier t also needs SKT[t] different stages cleared. Respec is free (all points come back).
const SKN=[
 {id:'atk1',b:0,t:0,n:'攻撃力小アップ',d:['与えるダメージ','＋10％'],c:1},
 {id:'rel',b:0,t:1,n:'早業装填',d:['装填にかかる時間','－35％'],c:2},
 {id:'mag',b:0,t:2,n:'大容量弾倉',d:['装弾数','16発 → 24発'],c:2},
 {id:'atk2',b:0,t:3,n:'攻撃力アップ',d:['与えるダメージ','さらに＋15％'],c:4},
 {id:'hp',b:1,t:0,n:'体力アップ',d:['最大体力','100 → 120'],c:1},
 {id:'heal',b:1,t:1,n:'回復上手',d:['回復アイテムと','撃破後の回復＋50％'],c:2},
 {id:'def',b:1,t:2,n:'鉄の体',d:['受けるダメージ','－15％'],c:3},
 {id:'rev',b:1,t:3,n:'一回復活',d:['倒れても１度だけ','体力半分で立ち上がる'],c:5},
 {id:'dash',b:2,t:0,n:'俊足回避',d:['回避の待ち時間','－40％'],c:1},
 {id:'dj',b:2,t:1,n:'二段ジャンプ',d:['空中でもう一度','ジャンプできる'],c:2},
 {id:'gauge',b:2,t:2,n:'気合充填',d:['必殺ゲージの','たまり方＋30％'],c:3},
 {id:'spinv',b:2,t:3,n:'必殺中無敵',d:['必殺技の発動中は','ダメージを受けない'],c:4},
 {id:'spd',b:3,t:0,n:'韋駄天',d:['移動の速さ','＋12％'],c:1},
 {id:'pow',b:3,t:1,n:'長持ちパワー',d:['パワーアイテムの','効果時間 12秒→18秒'],c:2},
 {id:'crit',b:3,t:2,n:'弱点狙い',d:['弱点に当てたときの','ダメージ＋25％'],c:3},
 {id:'beam',b:3,t:3,n:'墨龍砲・極',d:['必殺技の','照射時間＋50％'],c:4}];
const SKB=[{n:'攻',col:'#ff4a3d'},{n:'守',col:'#35d06a'},{n:'技',col:'#3f8cff'},{n:'極',col:'#f4a51a'}],SKT=[0,1,2,3],SKTN=['第一段','第二段','第三段','奥義'];
const SKS={pt:0,own:{},clr:[0,0,0,0,0]};
try{const s=JSON.parse(localStorage.getItem('koma_skill')||'null');if(s)Object.assign(SKS,s);
 else for(let i=0;i<5;i++)if(+(localStorage.getItem('koma_hi'+i)||0)>0){SKS.clr[i]=1;SKS.pt+=5}}catch(e){} // first run: credit stages already cleared
function skSave(){try{localStorage.setItem('koma_skill',JSON.stringify(SKS))}catch(e){}}
const skHas=id=>!!SKS.own[id],skClr=()=>SKS.clr.filter(v=>v).length;
// own | prev (earlier panel of the branch missing) | tier (not enough stages cleared) | pt (not enough points) | ok
function skState(n){if(skHas(n.id))return'own';const p=SKN.find(q=>q.b===n.b&&q.t===n.t-1);if(p&&!skHas(p.id))return'prev';if(skClr()<SKT[n.t])return'tier';return SKS.pt<n.c?'pt':'ok'}
const skAny=()=>SKN.some(n=>skState(n)==='ok');
var DEV=0;// 開発者用の裏技（設定画面の「超強化」ボタン、または「設定」を10回タップ）。無敵ではなく体力が桁違いに多い
let SK={},skPop=null,skMsg=null;
// effective values for the current game (neutral in versus / demo); called from resetPlayer
function skApply(){const on=G.mode!=='pvp'&&!G.demoOn,h=id=>on&&skHas(id);
SK={atk:(h('atk1')?1.1:1)*(h('atk2')?1.15:1),rel:h('rel')?0.65:1,mag:h('mag')?24:16,hp:h('hp')?120:100,heal:h('heal')?1.5:1,def:h('def')?0.85:1,rev:h('rev'),dash:h('dash')?0.6:1,dj:h('dj'),gauge:h('gauge')?1.3:1,spinv:h('spinv'),spd:h('spd')?1.12:1,pow:h('pow')?18:12,crit:h('crit')?1.25:1,beam:h('beam')?1.2:0.8};if(DEV&&G.mode!=='pvp')Object.assign(SK,{atk:20,rel:0.15,mag:40,hp:99999,heal:3,def:1,rev:1,dash:0.2,dj:1,gauge:3,spinv:1,spd:1.3,pow:30,crit:2,beam:2})}
skApply();
function addGauge(v){pl.gauge=Math.min(100,pl.gauge+v*SK.gauge)}
function skBuy(n){const s=skState(n);if(s!=='ok'){skMsg={s:s==='own'?'習得済みです':s==='prev'?'左のスキルを先に習得しよう':s==='tier'?'ステージを'+SKT[n.t]+'つクリアすると解放':'ポイントが足りません（あと'+(n.c-SKS.pt)+'）',t:now};return}
SKS.pt-=n.c;SKS.own[n.id]=1;skSave();snd('item');skPop={id:n.id,t:now};skMsg=null}
function skReset(){let r=0;for(const n of SKN)if(skHas(n.id))r+=n.c;if(!r)return;SKS.pt+=r;SKS.own={};skSave();skMsg={s:'振り直し：'+r+'ポイント戻りました',t:now}}
// points at the end of a game (solo / co-op, once per game)
function skReward(cl){if(G.mode==='pvp'||G.demoOn||G.rew!=null)return;let p=cl?2:1;if(cl&&!SKS.clr[G.stage]){SKS.clr[G.stage]=1;p+=3}SKS.pt+=p;G.rew=p;skSave()}
// ---- skill tree screen (a manga page: one panel per skill) ----
function drawSkill(){head('スキルツリー');
const px=880,py=120;para(px+6,py+8,330,62,16);ctx.fillStyle=INK;ctx.fill();para(px,py,330,62,16);ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();txt('スキルポイント',px+110,py+31,24,INK);txt(String(SKS.pt),px+270,py+31,46,'#e5402b',INK,4);
const X0=196,DX=262,PW=238,Y0=226,DY=96,PH=86,nc=skClr();
for(let t=0;t<4;t++){const x=X0+t*DX,open=nc>=SKT[t];txt(SKTN[t],x+PW/2-(open?0:70),208,22,open?'#fff':'#b9c2d6',INK,6);if(!open)txt('ステージ'+SKT[t]+'つクリア',x+PW/2+44,208,17,'#ffd91a',INK,5)}
for(let b=0;b<SKB.length;b++){const y=Y0+b*DY,bc=SKB[b].col;para(56,y,112,PH,14);ctx.fillStyle=bc;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();txt(SKB[b].n,118,y+PH/2+2,54,'#fff',INK,10);
 for(let t=0;t<4;t++){const n=SKN.find(q=>q.b===b&&q.t===t),s=skState(n),x=X0+t*DX,own=s==='own',ok=s==='ok';btns.push({x,y,w:PW,h:PH,cb:()=>skBuy(n)});
  if(t>0){const ax=x-DX+PW+4,ay=y+PH/2,on=skHas(SKN.find(q=>q.b===b&&q.t===t-1).id);ctx.fillStyle=on?'#fff':'rgba(255,255,255,.35)';ctx.beginPath();ctx.moveTo(ax,ay-12);ctx.lineTo(ax+16,ay);ctx.lineTo(ax,ay+12);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke()}
  ctx.fillStyle=INK;ctx.fillRect(x+6,y+8,PW,PH);ctx.fillStyle=own?bc:ok?'#fff':'#d8d8e0';ctx.fillRect(x,y,PW,PH);
  if(!own){ctx.save();ctx.beginPath();ctx.rect(x,y,PW,PH);ctx.clip();ctx.fillStyle=dotPat;ctx.globalAlpha=ok?0.12:0.3;ctx.fillRect(x,y+PH*0.5,PW,PH);ctx.restore()}
  ctx.strokeStyle=ok?(Math.sin(now*8)>0?'#ffd91a':INK):INK;ctx.lineWidth=ok?7:5;ctx.strokeRect(x,y,PW,PH);
  const tc=own?'#fff':s==='ok'||s==='pt'?INK:'#7a7a88',ts=own?INK:null;txt(n.n,x+12,y+19,n.n.length>6?19:21,tc,ts,own?6:0,'left');txt(n.d[0],x+PW/2,y+47,15,tc,ts,own?4:0);txt(n.d[1],x+PW/2,y+68,15,tc,ts,own?4:0);
  if(own)txt('習得済',x+PW-36,y+18,16,'#ffd91a',INK,5);else{para(x+PW-62,y+7,54,23,7);ctx.fillStyle=s==='ok'?'#ff4a3d':s==='pt'?'#ff9a90':'#a8a8b4';ctx.fill();txt(s==='tier'?'未解放':n.c+'P',x+PW-33,y+19,s==='tier'?13:17,'#fff')}
  if(skPop&&skPop.id===n.id&&now-skPop.t<0.7){const u=now-skPop.t,k=easeBack(sat(u/0.18))*(1+0.25*(1-sat(u/0.18)));ctx.save();ctx.globalAlpha=sat((0.7-u)/0.2);ctx.translate(x+PW/2,y+PH/2);ctx.rotate(-0.12);ctx.scale(k,k);burstPath(4,5,104,40,14,1.25,7);ctx.fillStyle=INK;ctx.fill();burstPath(0,0,104,40,14,1.25,7);ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();txt('習得！',0,2,40,'#e5402b',INK,6,'center','#fff',12);ctx.restore()}}}
if(skMsg&&now-skMsg.t<2.2)txt(skMsg.s,W/2+130,656,24,'#ff5a4d',INK,6,'center','#fff',12);else txt('クリア＋2P（初回＋5P）／やられ＋1P　※対戦では無効',W/2+250,656,18,'#fff',INK,6);
B(60,628,220,56,'もどる',()=>{G.menu='main';skMsg=null},{size:26});B(300,628,220,56,'振り直し',()=>skReset(),{size:26,col:'#d8d8e0'})}
