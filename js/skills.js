'use strict';
// ================= SKILL TREE =================
// Every skill only changes the local player's own numbers (damage dealt, own HP, jumps, gauge), which each client
// already computes for itself in co-op, so nothing extra goes over the network. Skills are off in versus and the demo.
// Shape: a cross. The centre is the start; four arms go out (up=攻, right=速, down=守, left=技). Each arm:
//   一段 → 二段 → (A line | B line | short middle branch). A/B lines have 三段・四段・五段・極み; the middle branch has 2 panels.
//   Past 極み each A/B line goes on: 七段・八段(覇). The middle branch has a third panel (五段).
//   複合: between two neighbouring arms (攻×速, 速×守, 守×技, 技×攻) runs a diagonal ladder of 6 compound panels (三段〜八段).
//   Each rung needs BOTH neighbouring panels of the same depth (the B line of one arm and the A line of the next) plus the rung before it.
//   Every panel can be taken (no limit on lines or points). Tier gate = stages cleared (三段1, 四段2, 五段3, 極み以降5).
// Points come only from levels: +1 point per level up. EXP comes from beating enemies (more on harder stages) and clearing a stage.
// The EXP for the next level grows each level (skNeed), so points stay scarce: it grows faster the higher the level (150+6L+0.15L²)
// All 92 panels = 644 points (the original 48 panels were 192), only with a great deal of play.
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
const SKD_X=[// per arm: A7 A8 B7 B8 C5 (past 極み: the 覇 road, and the middle branch's third panel)
[['弾幕の達人','連射の速さ さらに＋15％・装弾数＋6発'],['覇：無限弾幕','装填－25％・弾を使わない確率10％'],['一撃の達人','弱点ダメージ さらに＋20％・与ダメージ＋10％'],['覇：滅殺','与ダメージ＋25％・ボスへの与ダメージ＋20％'],['闘気','敵を倒すと弾が2発戻る']],
[['風の達人','移動の速さ さらに＋8％・回避の待ち時間－15％'],['覇：神速','移動の速さ＋10％・回避の無敵が さらに長く'],['空の達人','空中の与ダメージ さらに＋15％・空中で受けるダメージ－15％'],['覇：飛龍','空中の与ダメージ＋25％・空中にいられる時間＋15％'],['ひらり','敵の攻撃を10％の確率で無効化']],
[['不動の達人','受けるダメージ さらに－8％・やられた後の無敵時間＋50％'],['覇：金剛','受けるダメージ－15％・体力＋40・1回で受ける上限は最大体力の30％'],['治癒の達人','回復アイテム＋30％・自動回復 さらに強く'],['覇：蘇生','復活が2回できる・敵を倒すと体力＋1'],['吸収','敵を倒すと体力＋2']],
[['気合の達人','必殺ゲージのたまり方＋20％・敵を倒すとゲージ＋2'],['覇：満願','必殺技の後にゲージが50％残る'],['乱舞の達人','必殺技の威力＋15％・時間＋15％'],['覇：乱舞神','必殺技の威力＋25％・時間＋20％'],['ひらめき','手に入る経験値＋15％']]];
SKD.forEach((a,b)=>a.push(...SKD_X[b]));
const SKC0=['t1','t2','A3','A4','A5','A6','B3','B4','B5','B6','C3','C4','A7','A8','B7','B8','C5'];
const SKDK=SKD.map(a=>{const o={};SKC0.forEach((c,i)=>o[c]=a[i]);return o});
// new panels of the wide tree: Am An Bm Bn (the two middle steps before 極み), C6 C7 (middle line), Cl1 Cl2 Cr1 Cr2 (twigs of the middle line)
const SKD_N=[
{Am:['連射の呼吸','連射の速さ＋8％'],An:['装填の呼吸','装填にかかる時間－12％'],Bm:['急所の目','弱点ダメージ＋10％'],Bn:['一点集中','与ダメージ＋6％'],C6:['怒り','体力が減るほど与ダメージ最大＋10％'],C7:['修羅の目覚め','与ダメージ＋10％（受けるダメージ＋8％）'],Cl1:['速射の型','連射の速さ＋6％・装填時間－6％'],Cl2:['残弾の心得','装弾数＋3発'],Cr1:['狙撃の型','弱点ダメージ＋8％・与ダメージ＋3％'],Cr2:['一撃必殺','ボスへの与ダメージ＋8％']},
{Am:['韋駄天の脚','移動の速さ＋4％'],An:['疾風の脚','回避の待ち時間－10％'],Bm:['軽い足取り','空中の与ダメージ＋5％'],Bn:['宙返り','空中で受けるダメージ－8％'],C6:['足さばき','回避で進む距離＋10％'],C7:['見切りの極意','敵の攻撃を5％の確率で無効化'],Cl1:['走り込み','移動の速さ＋3％・移動中の与ダメージ＋4％'],Cl2:['足跡','回避のあと2秒間、与ダメージ＋10％'],Cr1:['跳ね足','空中の与ダメージ＋5％・空中にいられる時間＋5％'],Cr2:['舞い','空中で受けるダメージ－8％']},
{Am:['頑丈','最大体力＋10'],An:['堅牢','受けるダメージ－4％'],Bm:['治療','回復アイテム＋10％'],Bn:['再生','自動回復が さらに強く'],C6:['気骨','1回で受けるダメージの上限が最大体力の50％'],C7:['不撓','受けるダメージ－5％・最大体力＋10'],Cl1:['厚着','最大体力＋10'],Cl2:['受け身','やられた後の無敵時間＋20％'],Cr1:['薬草','回復アイテム＋10％'],Cr2:['根性','敵を倒すと体力＋1']},
{Am:['気の巡り','必殺ゲージのたまり方＋6％'],An:['気の高まり','敵を倒すとゲージ＋1'],Bm:['威力の練り','必殺技の威力＋5％'],Bn:['持続の練り','必殺技の時間＋8％'],C6:['悟り','手に入る経験値＋10％'],C7:['無我','必殺ゲージが さらに自然にたまる'],Cl1:['呼吸法','必殺ゲージのたまり方＋5％'],Cl2:['残り香','必殺技の後にゲージ＋10％'],Cr1:['集気','必殺技を撃ってもゲージが15％残る'],Cr2:['全霊','必殺技の威力＋8％・時間＋5％']}];
SKD_N.forEach((o,b)=>Object.assign(SKDK[b],o));
// the outer rows use the texts of the old far panels; each arm also gets a twig on each side
const SKALI={Ao3:'Cl1',Ao4:'Cl2',Ao5:'A7',Ao6:'A8',Bo3:'Cr1',Bo4:'Cr2',Bo5:'B7',Bo6:'B8'};
const SKTW=[{At:['弾込めの勘','装填時間－6％・装弾数＋2発'],Bt:['急所の勘','弱点ダメージ＋6％・ボスへの与ダメージ＋5％']},{At:['軽業','回避の待ち時間－6％・移動の速さ＋2％'],Bt:['空歩','空中の与ダメージ＋4％・空中で受けるダメージ－4％']},{At:['丈夫な体','最大体力＋8・受けるダメージ－2％'],Bt:['良薬','回復アイテム＋8％・自動回復 少し強く']},{At:['気の芽','必殺ゲージのたまり方＋4％・敵を倒すとゲージ＋1'],Bt:['力の芽','必殺技の威力＋4％・時間＋4％']}];
SKDK.forEach((o,b)=>{for(const k in SKALI)o[k]=o[SKALI[k]];Object.assign(o,SKTW[b])});
const SKRESPEC=1;// 振り直し（外す）1個につき1ポイント。戻るのは取ったときのポイントから引いた分
// ---- layout (shape after the hand-drawn sketch) ----
// Each arm is drawn in its own frame in px: a = outwards along the arm, l = sideways (+ = B side, - = A side).
// A trunk (the middle row) with a fork at its first panel; two rows on each side (inner = 極み row, outer = 奥義 row) that are tied to the
// middle row by diagonal links, like a honeycomb; a small twig on each outer row. The ends are big: 極み (diamond) at the end of the inner rows,
// 奥義 (circle) at the end of the outer rows, 覇 (hexagon) at the end of the middle row.
const SKCOL=[78,152,226,300,374,448,542],SKRW=96;
const SKROWS=[// code, column, row (-2..2), parent, cost, tier, label, flags
 ['t1',0,0,'',1,0,'一段'],['t2',1,0,'t1',2,0,'二段'],['C3',2,0,'t2',2,1,'三段'],['C4',3,0,'C3',3,2,'四段'],['C5',4,0,'C4',5,3,'五段'],['C6',5,0,'C5',7,4,'六段'],['C7',6,0,'C6',18,5,'覇の極み','fin'],
 ['A3',1,-1,'t1',3,1,'三段'],['A4',2,-1,'A3',4,2,'四段'],['A5',3,-1,'A4',5,3,'五段'],['Am',4,-1,'A5',6,3,'中間'],['An',5,-1,'Am',7,4,'中間'],['A6',6,-1,'An',8,5,'極み','cap'],
 ['B3',1,1,'t1',3,1,'三段'],['B4',2,1,'B3',4,2,'四段'],['B5',3,1,'B4',5,3,'五段'],['Bm',4,1,'B5',6,3,'中間'],['Bn',5,1,'Bm',7,4,'中間'],['B6',6,1,'Bn',8,5,'極み','cap'],
 ['Ao3',3,-2,'A4',4,3,'外・三段'],['Ao4',4,-2,'Ao3',5,3,'外・四段'],['Ao5',5,-2,'Ao4',10,4,'外・五段'],['Ao6',6,-2,'Ao5',16,5,'外・奥義','orb'],
 ['Bo3',3,2,'B4',4,3,'外・三段'],['Bo4',4,2,'Bo3',5,3,'外・四段'],['Bo5',5,2,'Bo4',10,4,'外・五段'],['Bo6',6,2,'Bo5',16,5,'外・奥義','orb']];
const SKTWIG=[['At',-1,'Ao4'],['Bt',1,'Bo4']];// twig: a leaf one column further and half a row further out than its parent's row; cost 5, tier 4
const SKLINK=[['A4','C4'],['B4','C4'],['Am','C6'],['Bm','C6'],['Ao4','An'],['Bo4','Bn']];// diagonal links: either end opens the other
const SKN=[];
for(let b=0;b<4;b++){const mk=(c,a,l,par,c0,tier,lb,fl)=>SKN.push({id:b+c,b,c,ln:l<0?'A':l>0?'B':'M',out:/^[AB][ot]/.test(c),a,l,d:a,sv:l<0?-1:l>0?1:0,cap:fl==='cap',fin:fl==='fin',orb:fl==='orb',big:!!fl,c0,n:SKDK[b][c][0],e:SKDK[b][c][1],par:par?[b+par]:[],x:[],tier,lb});
 for(const r of SKROWS)mk(r[0],SKCOL[r[1]],r[2]*SKRW,r[3],r[4],r[5],r[6],r[7]);
 for(const t of SKTWIG){const par=SKROWS.find(r=>r[0]===t[2]);mk(t[0],SKCOL[5],par[2]*SKRW+t[1]*90,t[2],5,4,'枝')}
}
// 複合: between neighbouring arms q and q+1 (攻×速, 速×守, 守×技, 技×攻) sits ONE compound panel in the corner (only the 複合極み entry of SKXD is used).
const SKXD=[
[['疾風撃ち','動いている間の与ダメージ＋10％',6],['残像撃ち','回避のあと2秒間、与ダメージ＋20％',8],['怒濤','連続で倒すほど与ダメージ最大＋12％',10],['複合極み：神風','与ダメージ＋25％・弱点ダメージ＋20％・移動中さらに＋10％',18],['追い風','移動の速さ＋8％・回避の待ち時間－15％',12],['覇：疾風迅雷','与ダメージ＋30％・移動中さらに＋15％・ボスへ＋10％',22]],
[['空の盾','空中にいる間、受けるダメージ－12％',6],['空蝉','敵の攻撃を8％の確率で無効化',8],['天駆け','空中の与ダメージ＋15％・受けるダメージ－5％',10],['複合極み：天衣無縫','受けるダメージ－20％・空中で受けるダメージ さらに－15％',18],['残心','やられた後の無敵時間＋50％・空中にいられる時間＋10％',12],['覇：羽衣','敵の攻撃を さらに7％無効化・受けるダメージ－10％',22]],
[['養生','回復アイテムを取るとゲージ＋20％',6],['気力の泉','ゲージのたまり方＋10％・必殺ゲージが さらに自然にたまる',8],['傷は浅い','受けたダメージの半分がゲージになる',10],['複合極み：命燃ゆ','敵を倒すと体力＋3・最大体力＋30',18],['血の気','敵を倒すとゲージ＋2・回復アイテム＋20％',12],['覇：不滅の灯','最大体力＋40・受けるダメージ－10％・自動回復 さらに強く',22]],
[['乱れ撃ち','必殺技の威力＋8％・装填時間－10％',6],['弾幕の気迫','敵を倒すと弾が1発戻る・連射＋8％',8],['連弾','必殺技の時間＋10％・連射＋8％',10],['複合極み：万雷','必殺技の威力＋30％・時間＋25％',18],['無尽','弾を使わない確率10％・必殺技の後ゲージ＋10％',12],['覇：天雷乱舞','必殺技の威力＋30％・弾を使わない確率＋10％・装弾数＋8発',22]]];
for(let q=0;q<4;q++){const a=(q+1)%4,x=SKXD[q][3];// one 複合 panel per corner, tied to the 四段 of the outer rows of both arms (it needs both)
 SKN.push({id:q+'X',b:q,b2:a,cmp:true,q,u:374,v:374,k:'X',c:'X',ln:'X',d:374,sv:0,cap:false,fin:false,orb:false,big:true,c0:x[2],n:x[0],e:x[1],par:[q+'Bo4',a+'Ao4'],x:[],tier:0,lb:'極み'})}
const SKI={};for(const n of SKN)SKI[n.id]=n;
for(const n of SKN)if(n.cmp)n.tier=Math.max(...n.par.map(p=>SKI[p].tier));
for(let b=0;b<4;b++)for(const[x,y]of SKLINK){SKI[b+x].x.push(b+y);SKI[b+y].x.push(b+x)}
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
// the tree changed shape: panels that no longer exist, or that are cut off from the start, are given back (their points are refunded)
(function(){let ch=0;const OLD={A7:10,A8:16,B7:10,B8:16,Cl1:4,Cl2:5,Cr1:4,Cr2:5,Xm:11,Xn:12,X3:6,X4:8,X5:10,X6:18,X7:12,X8:22};
 for(const id of Object.keys(SKS.own))if(!SKI[id]){SKS.pt+=OLD[id.slice(1)]||0;delete SKS.own[id];ch=1}
 const R=skReach();for(const n of SKN)if(SKS.own[n.id]&&!R[n.id]){SKS.pt+=n.c0;delete SKS.own[n.id];ch=1}
 if(ch)try{localStorage.setItem('koma_skill',JSON.stringify(SKS))}catch(e){}})();
function skSave(){try{localStorage.setItem('koma_skill',JSON.stringify(SKS))}catch(e){}}
const skHas=id=>!!DEV||!!SKS.own[id],skOwn=id=>!!SKS.own[id],skClr=()=>SKS.clr.filter(v=>v).length;
// own | prev (earlier panel missing) | tier (not enough stages cleared) | pt | ok
const skAvail=n=>n.par.every(skHas)||n.x.some(skHas);// the panels before it are owned, or a panel linked to it is
function skState(n){if(skHas(n.id))return'own';if(!skAvail(n))return'prev';
 if(skClr()<n.tier)return'tier';return SKS.pt<n.c0?'pt':'ok'}
const skAny=()=>SKN.some(n=>skState(n)==='ok');
var DEV=0;try{DEV=localStorage.getItem('koma_dev')==='1'?1:0}catch(e){}// 超強化の ON/OFF は localStorage の koma_dev に保存（リロードしても残る）。 開発者用の裏技（設定画面の「設定」を10回タップすると開発者メニューが出て、そこの「超強化」ボタンで切り替え。ONだとプレイ中に「ボスへ」ボタンも出る）。無敵ではなく体力が桁違いに多い
let SK={},skPop=null,skMsg=null,skSel=null;
// effective values for the current game (neutral in versus / demo); called from resetPlayer
function skApply(){const on=G.mode!=='pvp'&&!G.demoOn,h=c=>on&&skHas(c);
const s={atk:1,rel:1,mag:16,cool:1,crit:1.25,pierce:0,crush:0,low:0,def:1,spd:1,dash:1,dinv:0.34,ddist:1,dash2:0,jump:1,sj:0,grav:1,air:0,dj:0,airc:0,
 hp:100,regen:0,heal:1,heal2:1,steady:0,fud:0,rev:0,revH:0.3,gauge:1,spw:1,gReg:0,gKeep:0,gKill:0,g0:0,beam:0.8,spinv:0,gAfter:0,again:0,spCost:0,pow:12,
 run:0,dB:0,combo:0,boss:1,vamp:0,aKill:0,save:0,airDef:1,dodge:0,hinv:1,cap:0,gHit:0,gItem:0,xpk:1};
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
// 覇の道・中央枝の先
if(h('0Ao5')){s.cool/=1.15;s.mag+=6}if(h('0Ao6')){s.rel*=0.75;s.save+=0.1}if(h('0Bo5')){s.crit*=1.2;s.atk*=1.1}if(h('0Bo6')){s.atk*=1.25;s.boss*=1.2}if(h('0C5'))s.aKill+=2;
if(h('1Ao5')){s.spd*=1.08;s.dash*=0.85}if(h('1Ao6')){s.spd*=1.1;s.dinv=0.75}if(h('1Bo5')){s.air+=0.15;s.airDef*=0.85}if(h('1Bo6')){s.air+=0.25;s.grav/=1.15}if(h('1C5'))s.dodge+=0.1;
if(h('2Ao5')){s.def*=0.92;s.hinv*=1.5}if(h('2Ao6')){s.def*=0.85;s.hp+=40;s.cap=s.cap?Math.min(s.cap,0.3):0.3}if(h('2Bo5')){s.heal*=1.3;s.regen+=1}if(h('2Bo6')){s.rev=2;s.vamp+=1}if(h('2C5'))s.vamp+=2;
if(h('3Ao5')){s.gauge*=1.2;s.gKill+=2}if(h('3Ao6'))s.gKeep=Math.max(s.gKeep,50);if(h('3Bo5')){s.spw*=1.15;s.beam*=1.15}if(h('3Bo6')){s.spw*=1.25;s.beam*=1.2}if(h('3C5'))s.xpk*=1.15;
// 複合（攻×速 / 速×守 / 守×技 / 技×攻）
if(h('0X')){s.atk*=1.25;s.crit*=1.2;s.run+=0.1}if(h('1X')){s.def*=0.8;s.airDef*=0.85}if(h('2X')){s.vamp+=3;s.hp+=30}if(h('3X')){s.spw*=1.3;s.beam*=1.25}
if(h('0At')){s.rel*=0.94;s.mag+=2}if(h('0Bt')){s.crit*=1.06;s.boss*=1.05}if(h('1At')){s.dash*=0.94;s.spd*=1.02}if(h('1Bt')){s.air+=0.04;s.airDef*=0.96}if(h('2At')){s.hp+=8;s.def*=0.98}if(h('2Bt')){s.heal*=1.08;s.regen+=0.2}if(h('3At')){s.gauge*=1.04;s.gKill+=1}if(h('3Bt')){s.spw*=1.04;s.beam*=1.04}
s.dodge=Math.min(s.dodge,0.3);s.save=Math.min(s.save,0.4);
SK=s;if(DEV&&G.mode!=='pvp')Object.assign(SK,{atk:20,rel:0.15,mag:40,cool:0.7,hp:99999,heal:3,def:1,rev:1,dash:0.2,dj:1,gauge:3,spinv:1,spd:1.3,crit:2,beam:2,regen:2});if(typeof wpApply==='function')wpApply(SK)}// weapon numbers (weapons.js)
skApply();
function addGauge(v){if(pl.sp)return;pl.gauge=Math.min(100,pl.gauge+v*SK.gauge)}
// damage multiplier from skills that depend on the moment (air time, low HP); crits are separate
function skAtk(){let m=SK.atk;if(SK.run&&pl.moving>0.3)m*=1+SK.run;if(SK.dB&&pl.dbt>0)m*=1+SK.dB;if(SK.combo)m*=1+SK.combo*Math.min(G.combo|0,30);if(SK.air&&pl.y>0.05)m*=1+SK.air;if(SK.low)m*=1+SK.low*(1-sat(pl.hp/SK.hp));return m}
const spReady=()=>pl.gauge>=100||pl.spX>0;
function skMsgOf(s,n){return s==='own'?'習得済みです':s==='prev'?(n.cmp?'となり合う2つの系統の同じ段を、どちらも習得しよう':'手前のスキルを先に習得しよう'):s==='tier'?(n.cap?'５つのステージをすべてクリアすると解放':'ステージを'+n.tier+'つクリアすると解放'):'ポイントが足りません（あと'+(n.c0-SKS.pt)+'）'}
function skBuy(n){const s=skState(n);if(s!=='ok'){skMsg={s:skMsgOf(s,n),t:now};return}
SKS.pt-=n.c0;SKS.own[n.id]=1;SKS.last=n.id;skSave();snd('item');skPop={id:n.id,t:now};skMsg=null}
// take back one panel (only the end of a path); all its points come back
// panels owned and still connected to the start (through their parents or a linked panel)
function skReach(){const R={};let ch=1;while(ch){ch=0;for(const n of SKN)if(SKS.own[n.id]&&!R[n.id]&&(n.par.every(p=>R[p])||n.x.some(e=>R[e]))){R[n.id]=1;ch=1}}return R}
function skUndo(n){if(!skOwn(n.id))return;delete SKS.own[n.id];{const R=skReach();if(SKN.some(m=>SKS.own[m.id]&&!R[m.id])){SKS.own[n.id]=1;skMsg={s:'先につながるスキルを外してから',t:now};return}}
const r=n.c0-SKRESPEC;SKS.pt+=r;if(SKS.last===n.id)SKS.last=n.par[0]||null;skSave();snd('ui');skMsg={s:n.n+'を外しました（振り直し代'+SKRESPEC+'ポイント・'+r+'ポイント戻りました）',t:now}}
let skConf=false;// 全て振り直すの確認ポップアップ
function skRespecInfo(){let sp=0,k=0;for(const n of SKN)if(skOwn(n.id)){sp+=n.c0;k++}return{k,sp,loss:k*SKRESPEC,back:sp-k*SKRESPEC}}
function skAskReset(){if(!skRespecInfo().k){skMsg={s:'習得したスキルがありません',t:now};return}skConf=true}
function skReset(){let r=0,k=0;for(const n of SKN)if(skOwn(n.id)){r+=n.c0-SKRESPEC;k++}if(!k)return;SKS.pt+=r;SKS.own={};SKS.last=null;skSave();skMsg={s:'振り直し：'+k+'個外して'+r+'ポイント戻りました（1個につき'+SKRESPEC+'ポイント）',t:now}}
// EXP at the end of a game (solo / co-op, once per game). Enemies beaten (by anyone in co-op) × stage enemy strength,
// and on a clear the boss and a clear bonus that grow with the stage. Game over keeps the EXP of the enemies beaten.
// own table (enemy strength per stage, kept apart from DIF so easing story mode does not cut the EXP); 難易度：極 ×EXK.xp
const XPK=[[1.25,1.2],[1.5,1.4],[1.8,1.6],[2.15,1.85],[2.6,2.15]];
function skExp(cl){const i=G.stage,d=XPK[Math.min(i,XPK.length-1)],k=Math.max(0,(G.kills|0)-(cl?1:0));return Math.round((k*10*d[0]+(cl?150*d[1]+60*(i+1):0))*(G.ex?EXK.xp:1)*(SK.xpk||1))}
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
const SKC=[380,394],SKO=[[0,-1],[1,0],[0,1],[-1,0]],SKSD=[[1,0],[0,1],[-1,0],[0,-1]];
const SKVR={x:30,y:22,w:700,h:676},SKVC=[380,368],SKS0=0.94,skV={x:0,y:0,s:SKS0},skP={};let skPinch=null;
function skLoc(b,a,l){const o=SKO[b],t=SKSD[b];return[SKC[0]+o[0]*a+t[0]*l,SKC[1]+o[1]*a+t[1]*l]}
function skPosN(n){if(n.cmp){const o=SKO[n.q],t=SKO[(n.q+1)%4];return[SKC[0]+o[0]*n.u+t[0]*n.v,SKC[1]+o[1]*n.u+t[1]*n.v]}return skLoc(n.b,n.a,n.l)}
function skScr(p){return[SKVC[0]+skV.x+(p[0]-SKC[0])*skV.s,SKVC[1]+skV.y+(p[1]-SKC[1])*skV.s]}
const skIn=p=>p.x>=SKVR.x&&p.x<=SKVR.x+SKVR.w&&p.y>=SKVR.y&&p.y<=SKVR.y+SKVR.h;
function skClampV(){const m=700*skV.s;skV.x=clamp(skV.x,-m,m);skV.y=clamp(skV.y,-m,m)}
function skZoom(f,px,py){const s1=clamp(skV.s*f,0.5,2.2),k=s1/skV.s;skV.x=(px-SKVC[0])-(px-SKVC[0]-skV.x)*k;skV.y=(py-SKVC[1])-(py-SKVC[1]-skV.y)*k;skV.s=s1;skClampV()}
function skHit(x,y){let best=null,bd=1e9;for(const n of SKN){if(skVis(n)<2)continue;const q=skScr(skPosN(n)),d=Math.hypot(q[0]-x,q[1]-y);if(d<(n.big?30:17)*skV.s+10&&d<bd){bd=d;best=n}}return best}
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
function skVis(n){if(skHas(n.id)||skAvail(n))return 2;return n.par.every(p=>skAvail(SKI[p]))||n.x.some(e=>skAvail(SKI[e]))?1:0}
// open the tree zoomed in: on the start the first time, then on the last panel taken
function skFocus(){const id=SKS.last&&skHas(SKS.last)?SKS.last:null,n=id&&SKI[id],p=n?skPosN(n):SKC;skV.s=1.3;skV.x=-(p[0]-SKC[0])*skV.s;skV.y=-(p[1]-SKC[1])*skV.s;skClampV()}
function skDia(x,y,r){ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r,y);ctx.closePath()}
function skHex(x,y,r){ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU-PI/2;i?ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}ctx.closePath()}
function skSpark(x,y,r){ctx.beginPath();ctx.moveTo(x,y-r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.quadraticCurveTo(x,y,x,y+r);ctx.quadraticCurveTo(x,y,x-r,y);ctx.quadraticCurveTo(x,y,x,y-r);ctx.fill()}
function skOrb(n,x,y,own,ok,t){const r=25,col=SKB[n.b].col;
 if(own){ctx.fillStyle='#fff6b0';for(let i=0;i<3;i++){const a=t*1.4+i/3*TAU;skSpark(x+Math.cos(a)*(r+11),y+Math.sin(a)*(r+11),4.5+2*Math.sin(t*6+i))}}
 skDisc(x,y,r,own?col:ok?'#fff':'#3a4170',5);if(ok){ctx.strokeStyle=Math.sin(t*8)>0?'#ffd91a':INK;ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke()}
 ctx.beginPath();ctx.arc(x,y,r-7,0,TAU);ctx.strokeStyle=own?'#ffd91a':ok?col:'#5d6799';ctx.lineWidth=2.5;ctx.stroke();if(own)skGlint(x,y,r);
 txt('奥',x,y+1,24,own?'#fff':ok?INK:'#8b93c0',own?INK:null,own?6:0)}
function skFin(n,x,y,own,ok,t){const r=30,col=SKB[n.b].col;
 if(own){ctx.fillStyle='#fff6b0';for(let i=0;i<4;i++){const a=-t*1.2+i/4*TAU;skSpark(x+Math.cos(a)*(r+12),y+Math.sin(a)*(r+12),5+2*Math.sin(t*6+i))}}
 skHex(x+3,y+4,r);ctx.fillStyle=INK;ctx.fill();skHex(x,y,r);ctx.fillStyle=own?col:ok?'#fff':'#3a4170';ctx.fill();ctx.strokeStyle=ok?(Math.sin(t*8)>0?'#ffd91a':INK):INK;ctx.lineWidth=5;ctx.stroke();
 skHex(x,y,r-8);ctx.strokeStyle=own?'#ffd91a':ok?col:'#5d6799';ctx.lineWidth=2.5;ctx.stroke();
 txt('覇',x,y+1,26,own?'#fff':ok?INK:'#8b93c0',own?INK:null,own?6:0)}
// 複合: a hexagon in the two arms' colours
function skCmp(n,x,y,own,ok,t){const r=n.big?28:19,c1=SKB[n.b].col,c2=SKB[n.b2].col;
 if(own&&n.big){ctx.fillStyle='#fff6b0';for(let i=0;i<4;i++){const a=t*1.2+i/4*TAU;skSpark(x+Math.cos(a)*(r+12),y+Math.sin(a)*(r+12),5+2*Math.sin(t*6+i))}}
 skHex(x+3,y+4,r);ctx.fillStyle=INK;ctx.fill();skHex(x,y,r);ctx.fillStyle=own?c1:ok?'#fff':'#3a4170';ctx.fill();
 if(own||ok){ctx.save();skHex(x,y,r);ctx.clip();ctx.globalAlpha=own?1:0.6;ctx.fillStyle=c2;ctx.beginPath();ctx.moveTo(x+r*0.2,y-r*1.3);ctx.lineTo(x+r*1.3,y-r*1.3);ctx.lineTo(x+r*1.3,y+r*1.3);ctx.lineTo(x-r*0.6,y+r*1.3);ctx.closePath();ctx.fill();ctx.restore()}
 skHex(x,y,r);ctx.strokeStyle=ok?(Math.sin(t*8)>0?'#ffd91a':INK):INK;ctx.lineWidth=n.big?5:4;ctx.stroke();
 if(n.big){skHex(x,y,r-8);ctx.strokeStyle=own?'#ffd91a':ok?'#fff':'#5d6799';ctx.lineWidth=2.5;ctx.stroke()}
 if(own)skGlint(x,y,r);
 const big=n.big,lab=big?(n.k==='8'?'覇':'合'):own?n.n[0]:String(n.c0);
 txt(lab,x,y+1,big?26:own?17:16,own||ok&&big?(own?'#fff':INK):ok?INK:'#8b93c0',own?INK:null,own?5:0)}
// split a long effect text in two lines at a ・ near the middle
function skLines(e){if(e.length<=22)return[e];const p=e.split('・');let best=null,bd=1e9;for(let j=1;j<p.length;j++){const a=p.slice(0,j).join('・'),b=p.slice(j).join('・'),d=Math.abs(a.length-b.length);if(d<bd){bd=d;best=[a,b]}}return best||[e]}
function skNode(n,t){const v=skVis(n);if(!v)return;
 if(v===1){const p=skPosN(n);ctx.save();ctx.globalAlpha=0.75;if(n.cmp)skHex(p[0],p[1],n.big?24:16);else if(n.big)skDia(p[0],p[1],22);else{ctx.beginPath();ctx.arc(p[0],p[1],13,0,TAU)}ctx.fillStyle='#232a58';ctx.fill();ctx.setLineDash([4,4]);ctx.strokeStyle='#7c86c4';ctx.lineWidth=2;ctx.stroke();ctx.restore();txt('？',p[0],p[1]+1,n.big?20:15,'#8b93c0');return}
const p=skPosN(n),x=p[0],y=p[1],s=skState(n),own=s==='own',ok=s==='ok',col=SKB[n.b].col,sel=skSel===n.id;
 const bob=ok?Math.abs(Math.sin(t*5+n.d))*2.5:0,yy=y-bob;
 if(n.cmp)skCmp(n,x,yy,own,ok,t);
 else if(n.fin)skFin(n,x,yy,own,ok,t);
 else if(n.orb)skOrb(n,x,yy,own,ok,t);
 else if(n.cap){const r=30;if(own){ctx.fillStyle='#fff6b0';for(let i=0;i<4;i++){const a=t*1.2+i/4*TAU;skSpark(x+Math.cos(a)*(r+12),yy+Math.sin(a)*(r+12),5+2*Math.sin(t*6+i))}}
  skDia(x+3,yy+4,r);ctx.fillStyle=INK;ctx.fill();skDia(x,yy,r);ctx.fillStyle=own?col:ok?'#fff':'#3a4170';ctx.fill();ctx.strokeStyle=ok?(Math.sin(t*8)>0?'#ffd91a':INK):INK;ctx.lineWidth=5;ctx.stroke();
  skDia(x,yy,r-8);ctx.strokeStyle=own?'#ffd91a':ok?col:'#5d6799';ctx.lineWidth=2.5;ctx.stroke();
  if(own){ctx.save();skDia(x,yy,r);ctx.clip();ctx.globalAlpha=0.35;ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x-r,yy-r*0.15);ctx.lineTo(x+r*0.15,yy-r);ctx.lineTo(x+r*0.4,yy-r);ctx.lineTo(x-r,yy+r*0.1);ctx.fill();ctx.restore()}
  txt('極',x,yy+1,26,own?'#fff':ok?INK:'#8b93c0',own?INK:null,own?6:0)}
 else{const r=15;skDisc(x,yy,r,own?col:ok?'#fff':'#3a4170',4);
  if(ok){ctx.strokeStyle=Math.sin(t*8)>0?'#ffd91a':col;ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,yy,r-3,0,TAU);ctx.stroke()}
  if(own)skGlint(x,yy,r);
  txt(own?n.n[0]:String(n.c0),x,yy+1,own?17:16,own?'#fff':ok?INK:'#8b93c0',own?INK:null,own?5:0)}
 if(sel){ctx.save();ctx.setLineDash([7,6]);ctx.lineDashOffset=t*20;ctx.strokeStyle='#ffd91a';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,yy,n.big?40:23,0,TAU);ctx.stroke();ctx.restore()}
 if(skPop&&skPop.id===n.id&&now-skPop.t<0.8){const u=now-skPop.t,k=easeBack(sat(u/0.18))*(1+0.25*(1-sat(u/0.18)));ctx.save();ctx.globalAlpha=sat((0.8-u)/0.2);ctx.translate(x,yy-40);ctx.rotate(-0.12);ctx.scale(k*0.55,k*0.55);
  burstPath(4,5,104,40,14,1.25,7);ctx.fillStyle=INK;ctx.fill();burstPath(0,0,104,40,14,1.25,7);ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();txt('習得！',0,2,40,'#e5402b',INK,6,'center','#fff',12);ctx.restore()}}
// names of the two side lines, next to their first panels
function skLabels(){for(let b=0;b<4;b++)for(const[k,sv]of[['la',-1],['lb',1]]){if(skVis(SKI[b+(sv<0?'A':'B')+'3'])<2)continue;const q=skLoc(b,196,sv*160);txt(SKB[b][k],q[0],q[1],17,'#fff',INK,6)}}
// triangles at the edge of the view that always point to the four arms, wherever the view is dragged to
function skArrows(t){const R=SKVR,cx=R.x+R.w/2,cy=R.y+R.h/2,x0=R.x+30,x1=R.x+R.w-30,y0=R.y+30,y1=R.y+R.h-84;
 for(let b=0;b<4;b++){const col=SKB[b].col,T=skScr(skLoc(b,300,0));let dx=T[0]-cx,dy=T[1]-cy;const l=Math.hypot(dx,dy);if(l<2){dx=SKO[b][0];dy=SKO[b][1]}else{dx/=l;dy/=l}
  const tx=dx>1e-4?(x1-cx)/dx:dx<-1e-4?(x0-cx)/dx:1e9,ty=dy>1e-4?(y1-cy)/dy:dy<-1e-4?(y0-cy)/dy:1e9,k=Math.min(tx,ty),px=cx+dx*k,py=cy+dy*k,pu=1+0.1*Math.sin(t*5+b*1.6);
  ctx.save();ctx.translate(px,py);ctx.rotate(Math.atan2(dy,dx));ctx.scale(pu,pu);
  ctx.beginPath();ctx.moveTo(19,0);ctx.lineTo(-11,-17);ctx.lineTo(-11,17);ctx.closePath();ctx.save();ctx.translate(3,3);ctx.fillStyle=INK;ctx.fill();ctx.restore();
  ctx.fillStyle=col;ctx.fill();ctx.lineJoin='round';ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();ctx.lineJoin='miter';
  ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-5,-8);ctx.lineTo(-5,-2);ctx.closePath();ctx.fillStyle='rgba(255,255,255,.55)';ctx.fill();ctx.restore();
  const lx=px-dx*36,ly=py-dy*36;skDisc(lx,ly,16,col,3.5);txt(SKB[b].n,lx,ly+1,21,'#fff',INK,5)}}
function skCore(t){const x=SKC[0],y=SKC[1],R=46,P=Math.sin(t*2.4);
 const gl=ctx.createRadialGradient(x,y,R*0.4,x,y,R*2.7);gl.addColorStop(0,'rgba(255,226,130,'+(0.5+0.12*P)+')');gl.addColorStop(0.45,'rgba(255,170,90,.12)');gl.addColorStop(1,'rgba(255,200,100,0)');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(x,y,R*2.7,0,TAU);ctx.fill();
 // spikes: four long ones toward the arms (in their colours), four short white ones between
 ctx.lineJoin='round';
 for(let i=0;i<8;i++){const a=-PI/2+i*PI/4,long=i%2===0,col=long?SKB[[0,1,2,3][i/2]].col:'#fff',L=long?R*1.42:R*1.1,W=long?R*0.3:R*0.16;
  ctx.save();ctx.translate(x,y);ctx.rotate(a);const path=()=>{ctx.beginPath();ctx.moveTo(L,0);ctx.lineTo(R*0.6,-W);ctx.lineTo(R*0.3,0);ctx.lineTo(R*0.6,W);ctx.closePath()};
  ctx.save();ctx.translate(3,4);path();ctx.fillStyle=INK;ctx.fill();ctx.restore();path();ctx.fillStyle=col;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();
  if(long){ctx.beginPath();ctx.moveTo(L-8,0);ctx.lineTo(R*0.62,-W*0.45);ctx.lineTo(R*0.62,0);ctx.closePath();ctx.fillStyle='rgba(255,255,255,.45)';ctx.fill()}ctx.restore()}
 ctx.lineJoin='miter';
 // two rings turning against each other, with notches
 ctx.save();ctx.translate(x,y);ctx.rotate(t*0.5);ctx.strokeStyle='rgba(255,226,130,.75)';ctx.lineWidth=2.5;ctx.setLineDash([10,7]);ctx.beginPath();ctx.arc(0,0,R+12,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.restore();
 ctx.save();ctx.translate(x,y);ctx.rotate(-t*0.8);ctx.fillStyle='#ffd91a';for(let i=0;i<8;i++){ctx.rotate(PI/4);ctx.beginPath();ctx.moveTo(R+22,0);ctx.lineTo(R+13,-4);ctx.lineTo(R+13,4);ctx.closePath();ctx.fill()}ctx.restore();
 // body: a four-coloured medal
 ctx.beginPath();ctx.arc(x+4,y+5,R,0,TAU);ctx.fillStyle=INK;ctx.fill();
 for(let b=0;b<4;b++){const a=[-PI/2,0,PI/2,PI][b];ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,R,a-PI/4,a+PI/4);ctx.closePath();ctx.fillStyle=SKB[b].col;ctx.fill()}
 ctx.save();ctx.beginPath();ctx.arc(x,y,R,0,TAU);ctx.clip();ctx.globalAlpha=0.3;ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x-R,y-R*0.1);ctx.lineTo(x+R*0.1,y-R);ctx.lineTo(x+R*0.5,y-R);ctx.lineTo(x-R,y+R*0.4);ctx.fill();ctx.restore();
 ctx.strokeStyle=INK;ctx.lineWidth=4;for(let i=0;i<4;i++){const a=i/4*TAU+PI/4;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*26,y+Math.sin(a)*26);ctx.lineTo(x+Math.cos(a)*R,y+Math.sin(a)*R);ctx.stroke()}
 ctx.beginPath();ctx.arc(x,y,R,0,TAU);ctx.lineWidth=6;ctx.stroke();ctx.beginPath();ctx.arc(x,y,R-5,0,TAU);ctx.strokeStyle='#ffd91a';ctx.lineWidth=2;ctx.stroke();
 // dark core with a four-point star
 ctx.beginPath();ctx.arc(x,y,28,0,TAU);ctx.fillStyle='#0b0e24';ctx.fill();ctx.strokeStyle='#ffd91a';ctx.lineWidth=3;ctx.stroke();ctx.beginPath();ctx.arc(x,y,28,0,TAU);ctx.strokeStyle=INK;ctx.lineWidth=1;ctx.stroke();
 ctx.save();ctx.translate(x,y);ctx.rotate(t*0.3);ctx.fillStyle='rgba(255,226,130,'+(0.35+0.15*P)+')';skSpark(0,0,25);ctx.restore();
 txt('起点',x,y+1,19,'#fff',INK,4)}
function skRoundBtn(x,y,label,cb){btns.push({x:x-24,y:y-24,w:48,h:48,cb});skDisc(x,y,21,'#fff',4);txt(label,x,y+1,label.length>1?15:28,INK)}
function drawSkill(){const t=now,R=SKVR;
// ---- left: a manga panel with focus lines ----
ctx.fillStyle=INK;ctx.fillRect(R.x+9,R.y+10,R.w,R.h);ctx.save();
const bg=ctx.createRadialGradient(SKVC[0],SKVC[1],40,SKVC[0],SKVC[1],520);bg.addColorStop(0,'#1b2352');bg.addColorStop(0.55,'#0d1130');bg.addColorStop(1,'#04050f');ctx.fillStyle=bg;ctx.fillRect(R.x,R.y,R.w,R.h);
ctx.beginPath();ctx.rect(R.x,R.y,R.w,R.h);ctx.clip();
ctx.globalAlpha=0.09;ctx.fillStyle=skTone();ctx.fillRect(R.x,R.y,R.w,R.h);ctx.globalAlpha=1;
ctx.translate(SKVC[0]+skV.x,SKVC[1]+skV.y);ctx.scale(skV.s,skV.s);ctx.translate(-SKC[0],-SKC[1]);
for(const n of SKN){const v=skVis(n);if(!v)continue;const p=skPosN(n);for(const pid of n.par.length?n.par:[null]){const m=pid&&SKI[pid],q=m?skPosN(m):SKC;if(v===1){ctx.save();ctx.setLineDash([4,7]);ctx.strokeStyle='rgba(140,150,210,.5)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(p[0],p[1]);ctx.stroke();ctx.restore()}else skEdge(q,p,skHas(n.id),SKB[(m||n).b].col,t)}
 for(const eid of n.x){if(eid<n.id)continue;const m=SKI[eid],vm=skVis(m);if(!vm)continue;const q=skPosN(m);if(v===1||vm===1){ctx.save();ctx.setLineDash([4,7]);ctx.strokeStyle='rgba(140,150,210,.5)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(p[0],p[1]);ctx.stroke();ctx.restore()}else skEdge(q,p,skHas(n.id)&&skHas(m.id),SKB[n.b].col,t)}}
skCore(t);skLabels();for(const n of SKN)skNode(n,t);
ctx.restore();skArrows(t);ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.strokeRect(R.x,R.y,R.w,R.h);
skRoundBtn(R.x+46,R.y+R.h-46,'＋',()=>skZoom(1.25,SKVC[0],SKVC[1]));skRoundBtn(R.x+104,R.y+R.h-46,'－',()=>skZoom(0.8,SKVC[0],SKVC[1]));skRoundBtn(R.x+162,R.y+R.h-46,'元へ',skFocus);
txt(touchMode?'指で動かす・２本指で拡大':'ドラッグで移動・ホイールで拡大',R.x+R.w-22,R.y+R.h-28,15,'#fff',INK,5,'right');
// ---- right: info panel ----
const X=750;para(X,104,330,56,20);ctx.fillStyle=INK;ctx.fill();txt('スキルツリー',X+175,133,32,'#fff');
para(X+6,182,480,62,16);ctx.fillStyle=INK;ctx.fill();para(X,176,480,62,16);ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();
txt('Lv',X+36,210,22,INK);txt(String(SKS.lv),X+86,206,40,'#e5402b',INK,4);txt('スキルＰ',X+176,207,21,INK);txt(String(SKS.pt),X+248,206,40,'#e5402b',INK,4);
{const nd=skNeed(SKS.lv),bx=X+296,bw=158;ctx.fillStyle=INK;ctx.fillRect(bx-2,198,bw+4,14);ctx.fillStyle='#fff';ctx.fillRect(bx,200,bw,10);ctx.fillStyle='#35b8ff';ctx.fillRect(bx,200,bw*sat(SKS.xp/nd),10);txt('次のLvまで '+(nd-SKS.xp),bx+bw/2,224,13,INK)}
const cy=262,ch=270;panel(X,cy,478,ch);
const n=skSel&&SKI[skSel];
if(n){const s=skState(n),col=SKB[n.b].col,path=n.cmp?'複合・'+SKB[n.b].n+'×'+SKB[n.b2].n:n.ln==='A'?SKB[n.b].la:n.ln==='B'?SKB[n.b].lb:n.ln==='M'?'中央':'基本';
 skHex(X+53,cy+56,30);ctx.fillStyle=INK;ctx.fill();skHex(X+50,cy+52,30);if(n.cmp){const g=ctx.createLinearGradient(X+28,cy+30,X+72,cy+74);g.addColorStop(0,col);g.addColorStop(0.5,col);g.addColorStop(0.5,SKB[n.b2].col);g.addColorStop(1,SKB[n.b2].col);ctx.fillStyle=g}else ctx.fillStyle=col;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();skHex(X+50,cy+52,24);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();txt(n.cmp?SKB[n.b].n+SKB[n.b2].n:SKB[n.b].n,X+50,cy+54,n.cmp?22:28,'#fff',INK,n.cmp?6:7);
 txt(path+'・'+n.lb,X+96,cy+34,16,'#555a70',null,0,'left');
 txt(n.n,X+96,cy+66,n.n.length>8?26:30,INK,null,0,'left');
 {const ls=skLines(n.e),fs=ls.some(l=>l.length>24)?15:ls.length>1?18:n.e.length>21?17:20;if(ls.length>1){txt(ls[0],X+239,cy+110,fs,INK);txt(ls[1],X+239,cy+138,fs,INK)}else txt(n.e,X+239,cy+124,fs,INK)}
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
