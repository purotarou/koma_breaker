'use strict';
// ================= 武器のスキルツリー（凸でひらく。weapons.js / weapons2.js / gacha.js の後に読む） =================
// ガチャで同じ武器が出るたびに凸+1（WS.tp、最大 WT_MAX=12）= その武器のツリーのポイント1つ。
// ツリーは起点から十字に4本（上=攻・右=速・下=必殺・左=技）、各3個。1・2個目は武器のステータスアップ、3個目は大技（WT の b）。
// 取った深さは WS.tr[id] = [上,右,下,左]（0-3）。手前から順に取り、外すのは先端から（ポイントは戻る）。
// 効果: wtApply（wpApply の最後）が SK に数値を掛け、大技は WTB に立てる（wb(key) で読む。デモでは無効）。
// 大技の中身は各武器の関数の中（wb('...') を探す）と、このファイルの後半の小さな関数。
// 画面: 装備画面の「強化」（wtBtn）で右側にツリー（wtDraw）を出す・同じボタンで閉じる。武器の一覧・ガチャには3個目を取った数の◆4つ（wtPips / gaPips）。
const WT_ARM=['攻','速','必殺','技'],WT_DIR=[[0,-1],[1,0],[0,1],[-1,0]];
const WT_SN={atk:'威力',aspd:'攻撃の速さ',chg:'溜めの速さ',heat:'熱のたまり',spw:'必殺の威力',beam:'必殺の時間',gauge:'ゲージのたまり',mag:'弾数',rel:'装填時間'};
const WT_NM={atk:'威力アップ',aspd:'攻撃の速さアップ',chg:'溜めの速さアップ',heat:'冷却強化',spw:'必殺強化',beam:'必殺強化',gauge:'ゲージ効率アップ',mag:'弾数アップ',rel:'早装填'};
// 腕ごとの1・2個目の既定（武器で差し替える）
const WT_S0=[[{atk:1.06},{atk:1.1}],[{aspd:1.06},{aspd:1.1}],[{spw:1.08},{spw:1.08,beam:1.06}],[{gauge:1.08},{gauge:1.12}]];
const WT_CHG=[{chg:1.12},{chg:1.18}];
// 大技: [上, 右, 下, 左] = {b: key, n: 名前, d: 説明, s: 一緒に付く数値}
const WT_B={
rifle:[{b:'rf_pierce',n:'貫く珠',d:'弾が敵を１体つらぬき、後ろの敵にも当たる（ボスを除く）。威力＋10%',s:{atk:1.1}},
 {b:'rf_ramp',n:'加速連射',d:'撃ち続けるほど連射が速くなる（最大 1.7 倍）'},
 {b:'rf_sp',n:'珠時雨・極',d:'必殺中に敵を倒すたび、必殺の時間が 0.4 秒のびる'},
 {b:'rf_ammo',n:'珠戻し',d:'敵を倒すと弾が４発もどる'}],
shotgun:[{b:'sg_close',n:'零距離',d:'4 m 以内の敵への威力が 1.5 倍。近くの鎧鬼は必ずのけぞる'},
 {b:'sg_double',n:'二連射',d:'１回撃つと、すぐにもう１回散弾が出る（弾は１発ぶん）'},
 {b:'sg_sp',n:'大散華・二輪',d:'必殺の大散華が２回放たれる'},
 {b:'sg_boom',n:'爆ぜ散華',d:'倒した敵が爆発して、まわりの敵にもダメージ'}],
rail:[{b:'rl_chill',n:'凍てつく光',d:'光線を１秒当て続けた敵が凍る（ボスは鈍る）'},
 {b:'rl_cool',n:'永久冷却',d:'熱がとてもたまりにくく、オーバーヒートからの冷却が２倍速い',s:{heat:0.6}},
 {b:'rl_sp',n:'氷牢・砕',d:'必殺が終わる瞬間、凍った敵がすべて砕けて大ダメージ'},
 {b:'rl_wide',n:'太い光線',d:'光線が太くなって当てやすく、威力も 1.3 倍'}],
katana:[{b:'kt_crit',n:'三の太刀',d:'３回に１回の斬りが会心（威力２倍・範囲が広い）'},
 {b:'kt_wave',n:'飛ぶ斬撃',d:'斬るたびに小さな斬撃が前へ飛ぶ（22 m）'},
 {b:'kt_sp',n:'天断ち・三連',d:'必殺の巨大な斬撃が扇の形に３本飛ぶ'},
 {b:'kt_parry',n:'見切り',d:'墨弾を斬るたびに体力とゲージが回復する'}],
hammer:[{b:'hm_quake',n:'余震',d:'振り下ろした所に 0.4 秒後もう一度衝撃（威力 60%）'},
 {b:'hm_fast',n:'剛力',d:'溜めがとても速く、溜めきりの衝撃の範囲が 1.3 倍',s:{chg:1.6}},
 {b:'hm_sp',n:'駒砕き・連',d:'駒砕きの後、着地点のまわりに衝撃が３回広がる'},
 {b:'hm_stun',n:'脳天割り',d:'溜めきりで叩いた敵（ボス以外）が 1.5 秒動けなくなる'}],
bomb:[{b:'bm_cluster',n:'子花火',d:'爆発すると小さな玉が３つ飛び散り、それぞれ爆発する'},
 {b:'bm_more',n:'玉袋',d:'持てる玉が５個になる'},
 {b:'bm_sp',n:'大玉・三連',d:'必殺の大玉花火を３発投げる'},
 {b:'bm_fire',n:'残り火',d:'ふつうの爆発の跡にも炎が 2.5 秒燃え残る'}],
flail:[{b:'fl_spike',n:'棘の嵐',d:'頭上の振り回しの威力が２倍・範囲が広がる'},
 {b:'fl_quick',n:'怪力',d:'溜めが 1.8 倍速い',s:{chg:1.8}},
 {b:'fl_sp',n:'流星・八連',d:'必殺の叩きつけが８回になる'},
 {b:'fl_burst',n:'爆砕球',d:'２段目以上の溜め投げの先で、鉄球が爆発する'}],
spear:[{b:'sp_chain',n:'連雷',d:'突いた敵から、近くの敵２体に雷が飛ぶ'},
 {b:'sp_hold',n:'乱れ突き',d:'長押しを続けると、とても速い突きを出し続ける'},
 {b:'sp_sp',n:'雷槍・極',d:'必殺中の突きで、前方に落雷が落ちる'},
 {b:'sp_far',n:'遠雷',d:'突きの斬撃が２倍遠くまで飛び、５体まで貫く'}],
bow:[{b:'bw_split',n:'三つ矢',d:'溜めきりで３本同時に射る'},
 {b:'bw_quick',n:'早引き',d:'溜めが 1.8 倍速い',s:{chg:1.8}},
 {b:'bw_sp',n:'矢時雨・二重',d:'矢の雨が、さらに先にもう１か所降る'},
 {b:'bw_bomb',n:'爆ぜ矢',d:'溜めきりの矢が当たると爆発する'}],
shield:[{b:'sh_spike',n:'棘の盾',d:'防御中、正面の近くの敵にダメージを与えて押し返す'},
 {b:'sh_move',n:'軽い大楯',d:'防御中もふつうの速さで動ける'},
 {b:'sh_sp',n:'結界の衝撃',d:'バリアを張る瞬間、前方に衝撃波（大ダメージ・押し返し）'},
 {b:'sh_jg',n:'完全防御',d:'ジャストガードの受付が２倍。成功すると体力とゲージが回復'}],
staff:[{b:'st_twin',n:'双玉',d:'護符の玉が２つ同時に出る'},
 {b:'st_rapid',n:'速詠唱',d:'玉を撃つ間隔が半分になる'},
 {b:'st_sp',n:'祈りの波動',d:'必殺のとき、まわりの敵に大ダメージを与えて押し返す'},
 {b:'st_long',n:'長き加護',d:'加護が長く強くなる（玉の加護は２倍・必殺は 1.5 倍の時間）'}]};
// 武器ごとの1・2個目（WT_S0 との違いだけ）
const WT_SX={rifle:{3:[{mag:1.15},{rel:0.85}]},shotgun:{3:[{mag:1.2},{rel:0.85}]},rail:{1:[{heat:0.9},{heat:0.85}]},hammer:{1:WT_CHG},flail:{1:WT_CHG},bow:{1:WT_CHG}};
const WTREE={};
for(const id in WT_B){WTREE[id]=[0,1,2,3].map(a=>{const S=(WT_SX[id]||{})[a]||WT_S0[a];return[0,1].map(i=>{const s=S[i],k=Object.keys(s)[0];return{s,n:WT_NM[k]+(i?' II':' I')}}).concat([WT_B[id][a]])})}
const wtPct=(k,v)=>WT_SN[k]+' '+(v>=1?'＋':'－')+Math.round(Math.abs(v-1)*100)+'%';
const wtDesc=n=>n.b?n.d:Object.keys(n.s).map(k=>wtPct(k,n.s[k])).join('・');
// ---- effects ----
let WTB={};
const wb=k=>!!WTB[k];
function wtApply(s,w){WTB={};if(G.demoOn||!w||!WTREE[w.id]||!WS.own[w.id])return;const T=wtTr(w.id);
for(let a=0;a<4;a++)for(let i=0;i<Math.min(3,T[a]);i++){const n=WTREE[w.id][a][i];if(n.b)WTB[n.b]=1;
 for(const k in n.s||{}){const v=n.s[k];if(k==='mag')s.mag=Math.max(2,Math.round(s.mag*v));else s[k]*=v}}
if(WTB.rf_pierce)s.pierce=1;if(WTB.rf_ammo)s.aKill+=4;if(WTB.sg_boom)s.boom=1}
function wtReset(){pl.sgD=0;pl.sgS=0;pl.hq=null;pl.kq=null;pl.bmS=null;pl.rfR=0}
const wtBombMax=()=>wb('bm_more')?5:3,shSlow=()=>wb('sh_move')?1:W2.sh.slow,WT_KTW=50,WT_KTR=22;
// timers of the delayed big moves (from wpUpdate)
function wtTimers(dt,w){
if(pl.sgD>0){pl.sgD-=dt;if(pl.sgD<=0&&w.pel){shotgunFire(w,0);snd(w.snd);pl.flashT=0.05;pl.kick+=w.kick}}
if(pl.sgS>0){pl.sgS-=dt;if(pl.sgS<=0&&w.pel){shotgunFire(w,1);snd('sgun');snd('boom',1.4);shake(0.8);flash(0.4)}}
if(pl.hq){pl.hq.t-=dt;if(pl.hq.t<=0){const q=pl.hq;pl.hq=null;hammerAt(q.x,q.z,q.r,q.c,0.6)}}
if(pl.kq){const q=pl.kq;q.t-=dt;if(q.t<=0){q.t=0.3;hammerAt(q.x,q.z,7+q.n*3,1,1.6*SK.spw);if(++q.n>=3)pl.kq=null}}
if(pl.bmS){const q=pl.bmS;q.t-=dt;if(q.t<=0){q.t=0.45;throwBomb(1);if(--q.n<=0)pl.bmS=null}}}
// a shot of a gun (shoot, players.js)
function wtShoot(w){if(w.id==='rifle'&&wb('rf_ramp')){pl.rfR=Math.min(1,(now-(pl.rfL||-9)<0.35?pl.rfR||0:0)+0.05);pl.rfL=now;pl.cool/=1+0.7*pl.rfR}
if(w.pel&&wb('sg_double'))pl.sgD=0.14}
// an enemy this player killed (killFx)
function wtKill(e){if(wb('rf_sp')&&pl.sp===2)pl.spT=Math.max(0,pl.spT-0.4)}
// the special just ended
function wtSpEnd(){if(wb('rl_sp')){const pw=pl.pow>0?2:1;let n=0;for(const e of enemies){if(e.dead||e.st==='spawn')continue;const B=e.type==='boss';if(!(B?e.slw>0:e.frz>0))continue;const s=spheres(e)[0]||[e.x,1,e.z];
  wpDmg(e,(B?260:200)*SK.spw*pw,s[0],s[1],s[2],{quiet:n>0});fxStar(s[0],s[1],s[2],2.6,C.white,0.14);fxSparks(s[0],s[1],s[2],12,9,C.cyan);n++}
 if(n){snd('freeze');snd('boom',0.8);shake(0.4);addText('パリィィン！',W/2,H*0.22,{size:80,st:'cyan',life:0.7})}}}
// 凍てつく光: 1 s of the normal beam on the same enemy freezes it
function wtChill(e){e.rlC=(now-(e.rlL||-9)<0.2?e.rlC||0:0)+0.06;e.rlL=now;if(e.rlC>=1){e.rlC=0;const B=e.type==='boss';wpEffect(e,B?3:1,B?0.6:2)}}
// 飛ぶ斬撃: a small sword wave (wwaves with sm, weapons.js)
function wtKtWave(){const fx=-Math.sin(pl.yaw),fz=-Math.cos(pl.yaw),y=pl.y+1.15;wwaves.push({x:pl.x,y,z:pl.z,dx:fx,dz:fz,d:0.5,t:0,own:1,hit:new Set(),sm:1});wxPush(['k',r2(pl.x),r2(y),r2(pl.z),r2(fx),r2(fz),1])}
// 子花火 / 残り火 (bombBoom of a normal bomb of this player)
function wtBombHit(b,x,y,z){if(wb('bm_cluster'))for(let k=0;k<3;k++){const a=k/3*TAU+rnd(0,1);wbombs.push({x,y:y+0.3,z,vx:Math.cos(a)*5,vy:7,vz:Math.sin(a)*5,big:0,mini:1,own:1,t:0,rot:0})}
if(wb('bm_fire'))wfires.push({x,y:0.1,z,r:2.6,t:2.5,own:1,tk:0})}
// a blast around (x,y,z): every enemy within R takes dm (爆砕球・爆ぜ矢)
function w2Blast(x,y,z,R,dm,tx){explode(x,y,z,R*0.4,{text:tx});let n=0;
for(const e of enemies){if(e.dead||e.st==='spawn')continue;for(const s of spheres(e))if(Math.hypot(s[0]-x,s[1]-y,s[2]-z)-s[3]<R){wpDmg(e,dm,s[0],s[1],s[2],{quiet:n>0,fx:x,fz:z});n++;break}}
for(const s of shots)if(!s.dead&&Math.hypot(s.x-x,s.y-y,s.z-z)<R){popShot(s);if(isCli())net.q.ps.push(s.id)}if(n)shake(0.2)}
// 雷槍・極: a bolt from the sky at (x,z)
function wtBolt(x,z){const pw=w2pw();fxTracer(x+rnd(-1,1),24,z,x,0.2,z,C.yellow,0.18);fxTracer(x,24,z+rnd(-1,1),x,0.2,z,C.white,0.14);fxRing(x,0.1,z,7,C.yellow,0.3);fxSparks(x,0.5,z,14,10,C.yellow);sfxAt('ドシャーン！',x,3,z,{size:70,st:'fire',life:0.45});snd('zap');shake(0.25);
let n=0;for(const e of enemies){if(e.dead||e.st==='spawn')continue;for(const s of spheres(e))if(Math.hypot(s[0]-x,s[2]-z)-s[3]<3.4){wpDmg(e,70*SK.spw*pw,s[0],s[1],s[2],{quiet:n>0});spZap(e,s,1);n++;break}}}
// 連雷: from e (sphere s) to the two nearest other enemies within 6 m
function wtChain(e,s){const L=[];for(const q of enemies){if(q===e||q.dead||q.st==='spawn')continue;const d=Math.hypot(q.x-e.x,q.z-e.z);if(d<6)L.push([d,q])}L.sort((p,q)=>p[0]-q[0]);
for(const[,q]of L.slice(0,2)){const t=spheres(q)[0];if(!t)continue;fxTracer(s[0],s[1],s[2],t[0],t[1],t[2],C.yellow,0.14);wpDmg(q,25*w2pw(),t[0],t[1],t[2],{quiet:1});spZap(q,t,1)}}
// 棘の盾: while guarding, the front hurts (every 0.5 s)
function wtSpike(dt){pl.spkT=(pl.spkT||0)-dt;if(pl.spkT>0)return;pl.spkT=0.5;let n=0;
for(const e of enemies){if(e.dead||e.st==='spawn')continue;const s=w2Arc(e,pl.x,pl.z,pl.yaw,2.4,0.9,pl.y-0.5,pl.y+3);if(!s)continue;wpDmg(e,30*w2pw(),s[0],s[1],s[2],{quiet:n>0});n++;
 if(e.type!=='boss'&&!isCli()){const d=Math.hypot(e.x-pl.x,e.z-pl.z)||1;e.kx=(e.x-pl.x)/d*6;e.kz=(e.z-pl.z)/d*6}}if(n)addText('ザクッ',W*0.6+rnd(-40,40),H*0.56,{size:44,st:'hit',life:0.3})}
// 完全防御: a just guard heals
function wtJG(){if(!wb('sh_jg'))return;pl.hp=Math.min(SK.hp,pl.hp+5);pl.gauge=Math.min(100,pl.gauge+10)}
// a push-away wave: front (A = half angle) or all around (A = 0), radius R, damage dm
function wtWave(R,A,dm,col){const pw=w2pw();let n=0;for(const e of enemies){if(e.dead||e.st==='spawn')continue;const s=A?w2Arc(e,pl.x,pl.z,pl.yaw,R,A,pl.y-1,pl.y+5):spheres(e).find(q=>Math.hypot(q[0]-pl.x,q[2]-pl.z)-q[3]<R);if(!s)continue;
 wpDmg(e,dm*pw,s[0],s[1],s[2],{quiet:n>0,fx:pl.x,fz:pl.z});n++;if(e.type!=='boss'){wpEffect(e,6,1.2);if(!isCli()){const d=Math.hypot(e.x-pl.x,e.z-pl.z)||1;e.kx=(e.x-pl.x)/d*12;e.kz=(e.z-pl.z)/d*12}}}
const fx=A?-Math.sin(pl.yaw)*R*0.5:0,fz=A?-Math.cos(pl.yaw)*R*0.5:0;fxRing(pl.x+fx,0.12,pl.z+fz,R*2,col,0.4);fxRing(pl.x+fx,0.14,pl.z+fz,R*1.2,C.white,0.3);shake(0.5);snd('boom',1)}
function wtShWave(){wtWave(8,1.1,150*SK.spw,C.cyan);addText('ドォン！',W/2,H*0.3,{size:80,st:'cyan',life:0.6})}
function wtStWave(){wtWave(9,0,160*SK.spw,W2_GREEN);addText('ハァッ！',W/2,H*0.3,{size:80,st:'cyan',life:0.6})}
// ================= 画面 =================
// gem (diamond), coloured by arm (0 攻 red / 1 速 blue / 2 必殺 purple / 3 技 orange). st: 2 = taken, 1 = can be taken now (pale), 0 = not yet (plain black)
const WT_AC=[['#ffd0c8','#ff6a55','#e5402b','#9c1f12'],['#d2e6ff','#5fa0ff','#2f6fd8','#173f8f'],['#ead6ff','#b77bff','#8a3fe0','#561f9a'],['#fff0c0','#ffc24a','#f4a51a','#a8650a']];
function wtGemPath(cx,cy,r){ctx.beginPath();ctx.moveTo(cx,cy-r*1.22);ctx.lineTo(cx+r,cy);ctx.lineTo(cx,cy+r*1.22);ctx.lineTo(cx-r,cy);ctx.closePath()}
function wtGem(cx,cy,r,st,big,arm){if(!st){wtGemPath(cx,cy,r);ctx.fillStyle=INK;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=big?3.5:3;ctx.stroke();return}
const c=WT_AC[arm|0];ctx.save();if(st===1)ctx.globalAlpha=0.45;
wtGemPath(cx+2,cy+3,r);ctx.fillStyle='rgba(22,18,31,.35)';ctx.fill();
const g=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r);g.addColorStop(0,c[0]);g.addColorStop(0.45,c[1]);g.addColorStop(0.75,c[2]);g.addColorStop(1,c[3]);wtGemPath(cx,cy,r);ctx.fillStyle=g;ctx.fill();
// facets: a table in the middle, light top-left, dark bottom-right
const q=0.48;ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.moveTo(cx,cy-r*1.22);ctx.lineTo(cx-r,cy);ctx.lineTo(cx-r*q,cy);ctx.lineTo(cx,cy-r*1.22*q);ctx.closePath();ctx.fill();
ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.moveTo(cx,cy+r*1.22);ctx.lineTo(cx+r,cy);ctx.lineTo(cx+r*q,cy);ctx.lineTo(cx,cy+r*1.22*q);ctx.closePath();ctx.fill();
wtGemPath(cx,cy,r*q);ctx.fillStyle=st===2?c[0]:c[1];ctx.fill();ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=1.2;ctx.stroke();
ctx.beginPath();for(const[a,b]of[[0,-1.22],[1,0],[0,1.22],[-1,0]]){ctx.moveTo(cx+a*r*q,cy+b*r*q);ctx.lineTo(cx+a*r,cy+b*r)}ctx.stroke();
wtGemPath(cx,cy,r);ctx.strokeStyle=INK;ctx.lineWidth=big?3.5:3;ctx.stroke();
if(st===2){const tw=0.5+0.5*Math.sin(now*3+cx*0.07+cy*0.05),s=r*(0.25+0.2*tw);ctx.fillStyle='#fff';ctx.beginPath();const x=cx-r*0.35,y=cy-r*0.5;ctx.moveTo(x,y-s);ctx.lineTo(x+s*0.25,y-s*0.25);ctx.lineTo(x+s,y);ctx.lineTo(x+s*0.25,y+s*0.25);ctx.lineTo(x,y+s);ctx.lineTo(x-s*0.25,y+s*0.25);ctx.lineTo(x-s,y);ctx.lineTo(x-s*0.25,y-s*0.25);ctx.closePath();ctx.fill()}
ctx.restore()}
// the start: a diamond with inward-curved sides
function wtOriginPath(cx,cy,R){const k=0.2;ctx.beginPath();ctx.moveTo(cx,cy-R);ctx.quadraticCurveTo(cx+R*k,cy-R*k,cx+R,cy);ctx.quadraticCurveTo(cx+R*k,cy+R*k,cx,cy+R);ctx.quadraticCurveTo(cx-R*k,cy+R*k,cx-R,cy);ctx.quadraticCurveTo(cx-R*k,cy-R*k,cx,cy-R);ctx.closePath()}
function wtOrigin(cx,cy,R){ctx.save();wtOriginPath(cx+3,cy+4,R);ctx.fillStyle='rgba(22,18,31,.35)';ctx.fill();
const g=ctx.createLinearGradient(cx-R,cy-R,cx+R,cy+R);g.addColorStop(0,'#fff8c8');g.addColorStop(0.5,'#ffd73d');g.addColorStop(1,'#b97a00');wtOriginPath(cx,cy,R);ctx.fillStyle=g;ctx.fill();
wtOriginPath(cx,cy,R*0.5);ctx.fillStyle='#fff3b0';ctx.fill();ctx.strokeStyle='rgba(140,90,0,.5)';ctx.lineWidth=1.5;ctx.stroke();
wtOriginPath(cx,cy,R);ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();ctx.restore()}
// ◆×4 under a weapon's name (equip list): the 3rd node of each arm
function wtPips(x,y,id,s){const T=WS.own[id]?wtTr(id):[0,0,0,0];s=s||1;for(let i=0;i<4;i++)wtGem(x+i*22*s,y,6.5*s,T[i]>=3?2:0,0,i)}
// wrap s into lines of maxw (by character)
function wtWrap(s,x,y,size,maxw,lh,col){ctx.font='900 '+size+'px '+FONT;let line='',n=0;const out=l=>{txt(l,x,y+n*lh,size,col,null,0,'left');n++};
for(const ch of s){if(ctx.measureText(line+ch).width>maxw&&line){out(line);line=ch}else line+=ch}if(line)out(line);return n}
let wtSel=null,wtPop=null;
// the tree panel (right side of the equip screen)
function wtDraw(w,X,Y,PW,PH){const id=w.id,T=wtTr(id),tp=wtTp(id),fr=wtFree(id);btns.push({x:X,y:Y,w:PW,h:PH,cb:()=>{}});
if(!wtSel||wtSel.id!==id)wtSel={id,a:-1,i:-1};
ctx.fillStyle=INK;ctx.fillRect(X+8,Y+10,PW,PH);ctx.fillStyle='#f2f6fd';ctx.fillRect(X,Y,PW,PH);ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.strokeRect(X,Y,PW,PH);
const cx=X+200,cy=Y+PH/2+12,D=50,pos=(a,i)=>[cx+WT_DIR[a][0]*D*(i+1),cy+WT_DIR[a][1]*D*(i+1)];
// lines (yellow, no flow)
for(let a=0;a<4;a++)for(let i=0;i<3;i++){const p0=i?pos(a,i-1):[cx,cy],p1=pos(a,i),on=i<T[a];ctx.lineCap='round';
 ctx.strokeStyle=INK;ctx.lineWidth=on?12:6;ctx.beginPath();ctx.moveTo(p0[0],p0[1]);ctx.lineTo(p1[0],p1[1]);ctx.stroke();
 if(on){ctx.strokeStyle='#ffd91a';ctx.lineWidth=7;ctx.stroke()}ctx.lineCap='butt'}
wtOrigin(cx,cy,30);
for(let a=0;a<4;a++)for(let i=0;i<3;i++){const[x,y]=pos(a,i),big=i===2,st=i<T[a]?2:i===T[a]&&fr>0?1:0,sel=wtSel.a===a&&wtSel.i===i;let r=big?21:12;
 const P=wtPop;if(P&&P.id===id&&P.a===a&&P.i===i&&now-P.t<0.5){const u=(now-P.t)/0.5;r*=1+0.5*Math.sin(u*PI)*(1-u);if(u<0.6){ctx.save();ctx.globalAlpha=1-u/0.6;ctx.strokeStyle='#ffd91a';ctx.lineWidth=4;wtGemPath(x,y,r*(1+u*1.6));ctx.stroke();ctx.restore()}}
 if(sel){ctx.save();ctx.strokeStyle=w.col;ctx.lineWidth=4;ctx.setLineDash([6,4]);ctx.lineDashOffset=-now*20;wtGemPath(x,y,r+7);ctx.stroke();ctx.restore()}
 if(st===1){ctx.save();ctx.globalAlpha=0.45+0.35*Math.sin(now*5);ctx.strokeStyle='#fff';ctx.lineWidth=5;wtGemPath(x,y,r+3);ctx.stroke();ctx.restore()}
 wtGem(x,y,r,st,big,a);btns.push({x:x-r-8,y:y-r*1.22-8,w:r*2+16,h:r*2.44+16,cb:()=>{wtSel={id,a,i}}})}
// info (right)
const ix=X+404,iw=PW-ix+X-20;
txt('凸',ix,Y+40,22,INK,null,0,'left');txt(tp+' / '+WT_MAX,ix+30,Y+40,28,'#e5402b',null,0,'left');txt('のこり',ix,Y+76,18,'#555a70',null,0,'left');txt(String(fr),ix+62,Y+76,30,fr?'#e5402b':'#555a70',null,0,'left');txt('強化',ix+70+String(fr).length*18,Y+78,18,'#555a70',null,0,'left');
ctx.fillStyle='rgba(22,18,31,.15)';ctx.fillRect(ix,Y+100,iw,2);
if(wtSel.a<0){wtWrap('ひし形をタップすると効果が見られる。凸１つで１個とれる（手前から順に）。十字の先の大きいひし形は大技',ix,Y+132,17,iw,26,'#3a3f55')}
else{const a=wtSel.a,i=wtSel.i,n=WTREE[id][a][i],d=T[a];
 para(ix,Y+112,i===2?96:70,30,8);ctx.fillStyle=i===2?'#e5402b':INK;ctx.fill();txt(WT_ARM[a]+(i===2?'・大技':' '+(i+1)),ix+(i===2?48:35),Y+128,16,'#fff');
 fitTxt(n.n||'',ix,Y+168,26,iw,i===2?'#e5402b':INK);wtWrap(wtDesc(n),ix,Y+204,17,iw,25,'#3a3f55');
 const can=i===d&&fr>0,rm=i===d-1,lab=i<d-1?'習得済み':rm?'外す':i===d?(fr?'習得する':'凸が足りない'):'手前から取る';
 B(ix,Y+PH-74,iw,54,lab,can?()=>{T[a]++;wsSave();snd('item');wtPop={id,a,i,t:now};if(i===2)addText('大技 開放！',X+200,Y+60,{size:52,st:'boom',life:0.8});skApply()}:rm?()=>{T[a]--;wsSave();snd('clank');skApply()}:null,{col:can?'#ff4a3d':rm?'#fff':'#d8d8e0',tc:can?'#fff':INK,size:i===d-1||can?26:20,sk:10})}
para(X+16,Y-22,Math.min(PW-40,170+w.name.length*26),44,12);ctx.fillStyle=w.col;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();txt(w.name+'の強化',X+40,Y+1,24,'#fff',INK,6,'left')}
// 「強化」 button of the equip screen: opens / closes the tree on the right
function wtBtn(w,x,y,bw,bh,ok){const id=w.id,own=ok&&id!=='gun'&&!!WS.own[id],fr=own?wtFree(id):0,on=own&&eqTree;
B(x,y,bw,bh,on?'閉じる':'強化',own?()=>{eqTree=eqTree?0:1;eqDet=0;wtSel=null}:null,{col:!own?'#d8d8e0':on?'#59d8ff':fr?'#ff4a3d':'#fff',tc:own&&!on&&fr?'#fff':INK,size:28});
if(fr&&!on){ctx.beginPath();ctx.arc(x+bw+8,y+4,16,0,TAU);ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();txt('+'+fr,x+bw+8,y+5,16,INK)}}
