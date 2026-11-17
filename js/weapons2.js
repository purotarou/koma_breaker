'use strict';
// ================= WEAPONS 2 (weapons.js の続き): 鬼棘の流星鎚 / 雷鳴の槍 / 波雲の長弓 / 城壁の大楯 / 護符の錫杖 =================
// STORY.md「武器と必殺技」の表の 8〜12。数値は W2 にまとめてある（仮の値。遊んで調整する）。
//  流星鎚 flail : 長押し = 頭上で振り回す（近くの敵に当たる）、離す = 前へ投げる（溜め3段階で 10 / 20 / 40 m、伸びきると戻る）。
//                 鎖は GLB の輪（Flail_Link_* の2つの形）をコードで並べて描く（flChain）。必殺 = まわりに4回 + 前方遠くへ1回の
//                 叩きつけ（鉄球の落ちた所だけに当たる）。最後の1回は溜め投げと同じく向いている方向（上下も）へまっすぐ飛ぶ。
//  雷鳴の槍 spear : 3連突き（右上・正面下・左中段）、突きごとに「突く斬撃」（光の槍。wspk）が中距離まで飛ぶ。当たった敵は雷でしびれる
//                 （wpEffect 4 → e.stn、ボスは短い）。必殺 = 一定時間、長い突き＋遠くまで飛んで何体でも貫く斬撃。
//  波雲の長弓 bow  : 長押しで溜め（1.5 秒で威力3倍・貫通5体）、離して射る（warrows）。必殺 = 前方の円に矢の雨（wrains）、
//                 地面に残った矢の中では溜めが速い。
//  城壁の大楯 shield: タップ = 盾で押す（ダッシュ中・直後は強い）、長押し = 防御（正面を防ぐ・移動が遅い）。押してから / 離してから
//                 0.25 秒以内に正面から来た弾ははね返す（ホストが wrefl で動かす）。必殺 = 前に水色のバリア（敵の弾を止める）。
//  護符の錫杖 staff: 緑の護符の玉（worbs）。味方を少し追い、味方に当たると回復（その人の最大体力の10%）、敵にはダメージ。
//                 玉に当たった味方は短い間（5 秒）ダメージ軽減＋攻撃力アップの加護も受ける。正面の近くに敵がいるときは杖で殴る。
//                 必殺 = ダウンした味方をすぐ復活 ＋ 自分と味方全員の回復 ＋ 長めの加護（ダメージ軽減・攻撃力アップ）。ダウンした味方がいなくても使える。
//                 加護は pl.bls（残り秒）/ pl.blsT / pl.blsA（与ダメ倍率、damage()）/ pl.blsD（被ダメ倍率、hurtPlayer()）。凸が上がるほど回復・時間・強さが伸びる。
// 通信: 自分の動作は pl.ak / pl.an、溜めは pl.hc（既存の 'p'）。見た目だけのイベントは net.q.wx（F f S A R O X hl rv）、
//       盾の状態は 'p' の旗（32 正面の防御・64 はね返し・128 バリア → o.gf / o.bar）。しびれ・怯みは net.q.ef（4 雷 / 6 押し）。
const W2={
 fl:{chg:2.4,R:[10,20,40],dm:[60,110,190],spinR:2.8,spinDm:14,spinT:0.3,orbR:1.5,slam:150,slamR:3.2,last:420,lastR:5.5,lastD:40},
 sp:{dm:[30,30,46],R:4.2,A:1.05,cool:[0.28,0.28,0.45],wv:14,wvDm:22,zap:10,stun:0.7,bstun:0.3,spR:8,spWv:60,spK:1.6},
 bw:{dm:40,chg:1.5,spd:85,rain:26,rainR:8,rainT:1.6,zoneK:2.5,zoneT:6},
 sh:{bash:14,dash:24,R:1.9,A:0.7,push:4,pushD:8,lunge:4,lungeD:9,jg:0.3,slow:0.5,barR:3.4,barA:1.08,refl:3},
 st:{heal:0.1,dm:45,cool:0.6,spd:13,turn:2.2,bonk:40,life:2.8,bT:5,bA:1.1,bD:0.9,sh:0.4,sT:12,sA:0.3,sD:0.5}};// bT/bA/bD = 玉の加護（秒・攻撃倍率・被ダメ倍率）、sh/sT/sA/sD = 必殺（回復割合・秒・攻撃の上乗せ・軽減の強さ。SK.spw / SK.beam で凸に応じて伸びる）
const W2K={flail:1,spear:1,bow:1,shield:1,staff:1};
const wflys=[],wspk=[],warrows=[],wrains=[],wrefl=[],worbs=[];
const W2I=m4();W2I[0]=W2I[5]=W2I[10]=W2I[15]=1;
const wpS=o=>o===pl||o.me?pl:o;// whose state: the local player (also the 3rd-person copy tpsHero) or another player
const w2pw=()=>pl.pow>0?2:1;
function w2Reset(){wflys.length=0;wspk.length=0;warrows.length=0;wrains.length=0;wrefl.length=0;worbs.length=0;pl.fb=null;pl.fsp=null;for(const o of others){o.fb=null}}
// first enemy sphere in front of (ox,oz) facing yaw: within R (horizontal), ±A, between heights y0..y1
function w2Arc(e,ox,oz,yaw,R,A,y0,y1){for(const s of spheres(e)){const dx=s[0]-ox,dz=s[2]-oz,dh=Math.hypot(dx,dz)-s[3];if(dh>R||s[1]-s[3]>y1||s[1]+s[3]<y0)continue;if(dh<0.5||Math.abs(angDiff(Math.atan2(-dx,-dz),yaw))<A)return s}return null}
// sphere s touches the segment a-b (radius r)
function w2Seg3(a,b,s,r){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],l2=dx*dx+dy*dy+dz*dz||1e-9,t=clamp(((s[0]-a[0])*dx+(s[1]-a[1])*dy+(s[2]-a[2])*dz)/l2,0,1);return Math.hypot(a[0]+dx*t-s[0],a[1]+dy*t-s[1],a[2]+dz*t-s[2])<s[3]+r}
function w2PopNear(x,y,z,r){for(const s of shots)if(!s.dead&&Math.hypot(s.x-x,s.y-y,s.z-z)<r+s.r){popShot(s);if(isCli())net.q.ps.push(s.id)}}
// a player by slot (local or other)
const w2P=slot=>slot===pl.slot?pl:others.find(o=>o.slot===slot);
// ---- update (from wpUpdate) ----
function w2Update(w,dt,f){
switch(w.kind){case'flail':flailUpdate(dt,f);break;case'spear':spearUpdate(dt,f);break;case'bow':bowUpdate(dt,f);break;case'shield':shieldUpdate(dt,f);break;case'staff':staffUpdate(dt,f);break}}
// ================= 鬼棘の流星鎚 =================
const flSt=c=>c>=1?3:c>=0.45?2:1;
const flOrigin=o=>[o.x,(o.y||0)+1.4,o.z];
function flailUpdate(dt,f){const S=W2.fl;if(pl.fsp){flSpTick(dt);return}if(pl.fb)return;
if(pl.hon){const c0=pl.hc;pl.hc=Math.min(1,pl.hc+dt/S.chg);const st=flSt(pl.hc);if(st>flSt(c0)){snd('item');addText(st>2?'ブォォン！':'ブンブン',W*0.68,H*0.6,{size:st>2?60:46,st:st>2?'boom':'cyan',life:0.4})}
 pl.fsT-=dt;if(pl.fsT<=0){pl.fsT=S.spinT;flSpin()}
 if(pl.sp)pl.hon=0;else if(!f){pl.hon=0;flThrow(flSt(pl.hc))}}
else if(f&&pl.cool<=0&&!pl.sp){pl.hon=1;pl.hc=0;pl.fsT=0.15;wpAct(9);snd('whoosh')}}
// the ball swinging over the head hits everything close around
function flSpin(){const S=W2.fl,pw=w2pw();let n=0;if(lim('flw',0.4))snd('whoosh');
for(const e of enemies){if(e.dead||e.st==='spawn')continue;for(const s of spheres(e))if(Math.hypot(s[0]-pl.x,s[2]-pl.z)-s[3]<S.spinR&&s[1]-s[3]<pl.y+3.4&&s[1]+s[3]>pl.y+0.3){wpDmg(e,S.spinDm*pw,s[0],s[1],s[2],{quiet:n>0});n++;break}}
for(const s of shots)if(!s.dead&&Math.hypot(s.x-pl.x,s.z-pl.z)<S.spinR&&Math.abs(s.y-pl.y-2.4)<1.4){popShot(s);if(isCli())net.q.ps.push(s.id)}
if(G.mode==='pvp')for(const o of others)if(!o.dead&&Math.hypot(o.x-pl.x,o.z-pl.z)<S.spinR)pvHit(o,6*pw,false,o.x,o.y+1.4,o.z)}
function flThrow(st){const S=W2.fl,as=touchMode||G.demoOn,d=aimAssist(aimDir(),as?0.08:0.04,as?0.7:0.4),O=flOrigin(pl);let R=S.R[st-1];const tw=rayWorld(O[0],O[1],O[2],d[0],d[1],d[2],R);R=Math.max(1.5,Math.min(R,tw-0.3));
const fb=flMake(pl,1,d,R,st);wflys.push(fb);pl.fb=fb;pl.cool=0.25;wpAct(10);snd('whoosh');if(st>2)snd('charge');
addText(st>2?'ドリャァッ！':st>1?'ソリャッ！':'ソイッ',W*0.66,H*0.58,{size:40+10*st,st:st>2?'boom':'cyan',life:0.35});wxPush(['F',r2(d[0]),r2(d[1]),r2(d[2]),r1(R),st])}
function flMake(o,own,d,R,st,big){return{o,own,m:'t',d,R,st,big:big?1:0,t:0,To:0.08+R/100,Tb:0.12+R/130,hit:new Set(),b:flOrigin(o),bang:0}}
function flSlam(o,own,tx,tz,big){return{o,own,m:'s',tx,tz,big,t:0,To:big?0.42:0.26,Tb:big?0.3:0.14,b:flOrigin(o),bang:0}}
// ball position of a flight (the origin follows its owner): throw = straight out and back, slam = high arc down onto the target
function flBall(f){const O=flOrigin(f.o),t=f.t;
if(f.m==='t'){const u=t<f.To?t/f.To:1,v=t<f.To?0:Math.min(1,(t-f.To)/f.Tb),e=f.R*(t<f.To?1-(1-u)*(1-u):1-v*v);return[O[0]+f.d[0]*e,O[1]+f.d[1]*e,O[2]+f.d[2]*e]}
const T=[f.tx,0.45,f.tz];if(t<f.To){const u=t/f.To,h=(f.big?7:3.5)*Math.sin(PI*u)*(1-u*0.3),k=u*u;return[O[0]+(T[0]-O[0])*k,O[1]+(T[1]-O[1])*k+h,O[2]+(T[2]-O[2])*k]}
const v=Math.min(1,(t-f.To)/f.Tb),k=v*v;return[T[0]+(O[0]-T[0])*k,T[1]+(O[1]-T[1])*k+Math.sin(PI*v),T[2]+(O[2]-T[2])*k]}
// a throw: the ball hits every enemy it passes once (out and back)
function flHitSeg(f,a,b){const S=W2.fl,pw=w2pw(),rb=f.big?1.6:0.6+0.25*f.st,dm=(f.big?S.last*SK.spw:S.dm[f.st-1])*pw;let n=0;
for(const e of enemies){if(e.dead||e.st==='spawn'||f.hit.has(e))continue;for(const s of spheres(e))if(w2Seg3(a,b,s,rb)){f.hit.add(e);wpDmg(e,dm,s[0],s[1],s[2],{quiet:n>1});n++;if(f.st>2&&e.type==='bru')wpEffect(e,2);if(f.st>1&&e.type==='imp'&&!isCli()){e.kx=f.d[0]*(f.big?14:10);e.kz=f.d[2]*(f.big?14:10)}break}}
for(const s of shots)if(!s.dead&&w2Seg3(a,b,[s.x,s.y,s.z,s.r],rb)){popShot(s);if(isCli())net.q.ps.push(s.id)}
if(G.mode==='pvp')for(const o of others)if(!o.dead&&!f.hit.has(o)&&w2Seg3(a,b,[o.x,o.y+1.1,o.z,0.6],rb)){f.hit.add(o);pvHit(o,(f.big?50:10+12*f.st)*pw,false,o.x,o.y+1.1,o.z)}
if(n){shake(0.1+0.08*f.st);stopT(0.03)}}
// the ball reaches the end (throw) or lands (slam)
function flBang(f,p){if(f.m==='t'){if(f.big){fxStar(p[0],p[1],p[2],3.2,C.white,0.14);fxSparks(p[0],p[1],p[2],18,9,C.yellow);if(p[1]<2)hammerFx(p[0],p[2],3,0.6);sfxAt('ドゴォォン！！',p[0],p[1]+1.8,p[2],{size:84,st:'boom',life:0.5});snd('boom');shake(0.4);return}fxStar(p[0],p[1],p[2],1+0.5*f.st,C.white,0.1);fxSparks(p[0],p[1],p[2],5+3*f.st,6,C.yellow);if(p[1]<1.4)fxRing(p[0],0.1,p[2],2+f.st,C.white,0.2);if(f.st>1)sfxAt(f.st>2?'ドゴォン！':'ガゴッ',p[0],p[1]+1.6,p[2],{size:44+12*f.st,st:'boom',life:0.4});snd(f.st>2?'boom':'clank',0.6);return}
const S=W2.fl,r=f.big?S.lastR:S.slamR;hammerFx(f.tx,f.tz,r,f.big?1:0.35);if(!f.own)return;
const pw=w2pw(),dm=(f.big?S.last:S.slam)*SK.spw*pw;let n=0;
for(const e of enemies){if(e.dead||e.st==='spawn')continue;let hs=null;for(const s of spheres(e))if(Math.hypot(s[0]-f.tx,s[2]-f.tz)-s[3]<r&&s[1]-s[3]<(f.big?6:3.2)){hs=s;break}
 if(hs){wpDmg(e,dm,hs[0],hs[1],hs[2],{quiet:n>0,fx:pl.x,fz:pl.z});n++;if(e.type==='bru')wpEffect(e,2);else if(e.type==='imp'&&!isCli()){const d=Math.hypot(e.x-f.tx,e.z-f.tz)||1;e.kx=(e.x-f.tx)/d*12;e.kz=(e.z-f.tz)/d*12}}}
for(const s of shots)if(!s.dead&&Math.hypot(s.x-f.tx,s.z-f.tz)<r&&s.y<4){popShot(s);if(isCli())net.q.ps.push(s.id)}
if(G.mode==='pvp')for(const o of others)if(!o.dead&&Math.hypot(o.x-f.tx,o.z-f.tz)<r&&o.y<2)pvHit(o,(f.big?50:24)*pw,false,o.x,o.y+1.1,o.z)}
// 必殺「流星乱れ打ち」: right-front, left-front, right, left, then a big straight throw where you're looking (like a charged throw)
const FL_SEQ=[[0.05,0.75],[0.4,-0.75],[0.75,1.5],[1.1,-1.5]],FL_LAST=1.5,FL_END=2.35;
function flSpStart(){pl.hon=0;pl.fsp={t:0};snd('charge');addText('オリャリャリャ！',W/2,H*0.16,{size:80,st:'boom',life:0.9,rot:-0.06})}
function flSpTick(dt){const F=pl.fsp,t0=F.t;F.t+=dt;
for(const[t,a]of FL_SEQ)if(t0<t&&F.t>=t)flSpLaunch(a,6.5,0);
if(t0<FL_LAST&&F.t>=FL_LAST)flSpLast();
if(F.t>=FL_END)pl.fsp=null}
function flSpLast(){const S=W2.fl,as=touchMode||G.demoOn,d=aimAssist(aimDir(),as?0.08:0.04,as?0.7:0.4),O=flOrigin(pl),tw=rayWorld(O[0],O[1],O[2],d[0],d[1],d[2],S.lastD),R=Math.max(1.5,Math.min(S.lastD,tw-0.3));
const f=flMake(pl,1,d,R,3,1);wflys.push(f);pl.fb=f;pl.fsA=0;wpAct(11);snd('whoosh');snd('charge');addText('ドッセェェイ！',W/2,H*0.2,{size:84,st:'boom',life:0.7,rot:0.05});
wxPush(['F',r2(d[0]),r2(d[1]),r2(d[2]),r1(R),3,1])}
function flSpLaunch(a,dist,big){const yaw=pl.yaw-a,dx=-Math.sin(yaw),dz=-Math.cos(yaw),t=rayWorld(pl.x,1,pl.z,dx,0,dz,dist),d=Math.max(2,Math.min(dist,t-0.4)),tx=pl.x+dx*d,tz=pl.z+dz*d;
const f=flSlam(pl,1,tx,tz,big);wflys.push(f);pl.fb=f;pl.fsA=a;wpAct(11);snd('whoosh');if(big){snd('charge');addText('ドッセェェイ！',W/2,H*0.2,{size:84,st:'boom',life:0.7,rot:0.05})}
wxPush(['f',r1(tx),r1(tz),big])}
// ================= 雷鳴の槍 =================
function spearUpdate(dt,f){if(f&&pl.cool<=0&&pl.sp!==1){const k=now-(pl.spkT==null?-9:pl.spkT)<0.8?((pl.spk|0)+1)%3:0;pl.spk=k;pl.spkT=now;spearThrust(k)}}
function spearThrust(k){const S=W2.sp,big=pl.sp===2,pw=w2pw(),R=big?S.spR:S.R,fx=-Math.sin(pl.yaw),fz=-Math.cos(pl.yaw);
pl.cool=S.cool[k]*(big?0.9:1);wpAct(12+k);pl.lgx=fx;pl.lgz=fz;pl.lgT=0.07;pl.lgV=pl.frz>0?0:5;pl.lgP=0;snd('slash');
let n=0;for(const e of enemies){if(e.dead||e.st==='spawn')continue;const s=w2Arc(e,pl.x,pl.z,pl.yaw,R,S.A,pl.y-0.6,pl.y+3.8);if(s){wpDmg(e,S.dm[k]*pw*(big?S.spK:1),s[0],s[1],s[2],{quiet:n>1});spZap(e,s);n++}}
for(const s of shots)if(!s.dead){const dx=s.x-pl.x,dz=s.z-pl.z,d=Math.hypot(dx,dz);if(d<R&&s.y<pl.y+3.8&&(d<0.8||Math.abs(angDiff(Math.atan2(-dx,-dz),pl.yaw))<S.A)){popShot(s);if(isCli())net.q.ps.push(s.id)}}
if(G.mode==='pvp')for(const o of others){if(o.dead)continue;const dx=o.x-pl.x,dz=o.z-pl.z,d=Math.hypot(dx,dz);if(d<R&&Math.abs(angDiff(Math.atan2(-dx,-dz),pl.yaw))<S.A)pvHit(o,(k===2?22:16)*pw*(big?S.spK:1),false,o.x,o.y+1.2,o.z)}
if(n){shake(0.1);stopT(0.03)}
const d=aimDir(),x=pl.x+fx*0.6,y=pl.y+[1.7,1.0,1.35][k],z=pl.z+fz*0.6,wl=big?S.spWv:Math.min(S.wv,rayWorld(x,y,z,d[0],d[1],d[2],S.wv));
wspk.push({own:1,x,y,z,dx:d[0],dy:d[1],dz:d[2],k,big,t:0,d:0,R:wl,hit:new Set(),n:big?999:2});wxPush(['S',r2(x),r2(y),r2(z),r2(d[0]),r2(d[1]),r2(d[2]),k,big?1:0,r1(wl)]);
addText(pick(big?['ズドドッ！','バリバリッ！']:['ズドッ','シュバッ','ザシュッ']),W*0.64+rnd(-60,80),H*0.58+rnd(-30,30),{size:big?62:50,st:big?'fire':'cyan',life:0.3})}
// 雷: stun (host: wpEffectHost 4) and a small shock (at most once in a while per enemy)
function spZap(e,s){const S=W2.sp,B=e.type==='boss';wpEffect(e,4,B?S.bstun:S.stun);e.zapT=now;
if(lim('zap'+e.id,0.7)){wpDmg(e,S.zap*w2pw(),s[0],s[1],s[2],{quiet:1});fxSparks(s[0],s[1],s[2],6,7,C.yellow);if(lim('zapT',0.25))sfxAt('ビリッ！',s[0],s[1]+s[3]+0.6,s[2],{size:46,st:'fire',life:0.35})}}
// ================= 波雲の長弓 =================
function bowUpdate(dt,f){const S=W2.bw;if(pl.hon){const c0=pl.hc;pl.hc=Math.min(1,pl.hc+dt*bwZoneK(pl)/S.chg);if(c0<1&&pl.hc>=1){snd('item');addText('キリリッ',W*0.66,H*0.6,{size:50,st:'cyan',life:0.4})}
 if(pl.sp===1)pl.hon=0;else if(!f){pl.hon=0;bowShoot(pl.hc)}}
else if(f&&pl.cool<=0&&pl.sp!==1){pl.hon=1;pl.hc=0;wpAct(16)}}
// inside a rain of arrows (ours or a friend's) the bow draws faster
function bwZoneK(o){for(const r of wrains)if(Math.hypot(o.x-r.x,o.z-r.z)<r.r)return W2.bw.zoneK;return 1}
function bowShoot(c){const S=W2.bw,pw=w2pw(),as=touchMode||G.demoOn,AO=aimOrigin(),d=aimAssist(aimDir(),as?0.08:0.03,as?0.7:0.4),sp=S.spd*(0.75+0.5*c);
const a={own:1,x:AO[0]+d[0]*0.6,y:AO[1]-0.05+d[1]*0.6,z:AO[2]+d[2]*0.6,dx:d[0],dy:d[1],dz:d[2],sp,t:0,c,dm:S.dm*(1+2*c)*pw,n:1+Math.floor(c*4+1e-6),hit:new Set(),stk:0};
warrows.push(a);wxPush(['A',r2(a.x),r2(a.y),r2(a.z),r2(d[0]),r2(d[1]),r2(d[2]),r2(c)]);pl.cool=0.22;wpAct(17);snd('whoosh');if(c>=1){snd('slash');shake(0.12)}
addText(c>=1?'ズバァッ！':'ヒュンッ',W*0.66+rnd(-30,30),H*0.58,{size:c>=1?64:44,st:c>=1?'boom':'cyan',life:0.3})}
// 必殺「波雲・矢時雨」: a circle ahead (where the aim meets the ground)
function bowRain(){const S=W2.bw,d=aimDir(),AO=aimOrigin(),l=Math.hypot(d[0],d[2])||1;let dist=16;if(d[1]<-0.05)dist=clamp(AO[1]/-d[1]*l,8,26);
const x=clamp(pl.x+d[0]/l*dist,-BX+1,BX-1),z=clamp(pl.z+d[2]/l*dist,BZ0+1,BZ1-1),life=S.rainT+S.zoneT*SK.beam/0.8;
wrains.push(bwRainMk(1,x,z,life));wxPush(['R',r1(x),r1(z),r1(life)]);wpAct(18);snd('whoosh');snd('charge');flash(0.3);addText('ヒュルルル…',W/2,H*0.16,{size:80,st:'cyan',life:0.8,rot:-0.06})}
function bwRainMk(own,x,z,life){const S=W2.bw,r=mulberry(((x*31+z*17)|0)+7),arr=[];for(let i=0;i<54;i++){const a=r()*TAU,q=Math.sqrt(r())*S.rainR*0.95;arr.push([x+Math.cos(a)*q,z+Math.sin(a)*q,0.15+r()*(S.rainT-0.25),r()*TAU,0.25+r()*0.3])}
return{own,x,z,r:S.rainR,t:0,life,tk:0,arr}}
// ================= 城壁の大楯 =================
function shieldUpdate(dt,f){const S=W2.sh;if(pl.jrT>0)pl.jrT-=dt;if(pl.dashT>0)pl.lastDash=now;
if(f&&pl.sp!==1){if(!pl.gp){pl.gp=1;pl.gdT=0;pl.grd=1;pl.jrT=0}else pl.gdT+=dt}
// 離した瞬間だけジャストガード（押した直後は対象外。ちょん押し＝攻撃は対象外）
else if(pl.gp){pl.gp=0;pl.grd=0;const tap=pl.gdT<0.2;pl.jrT=tap?0:S.jg;if(tap&&pl.cool<=0&&pl.sp!==1)shieldBash()}}
function shieldBash(){const S=W2.sh,pw=w2pw(),dash=now-(pl.lastDash||-9)<0.35,fx=-Math.sin(pl.yaw),fz=-Math.cos(pl.yaw),dm=(dash?S.dash:S.bash)*pw,R=S.R+(dash?0.5:0);
pl.cool=0.32;wpAct(20);pl.lgx=fx;pl.lgz=fz;pl.lgT=0.08;pl.lgV=pl.frz>0?0:dash?S.lungeD:S.lunge;pl.lgP=0;snd('whoosh');
let n=0;for(const e of enemies){if(e.dead||e.st==='spawn')continue;const s=w2Arc(e,pl.x,pl.z,pl.yaw,R,S.A,pl.y-0.5,pl.y+3);if(!s)continue;wpDmg(e,dm,s[0],s[1],s[2],{quiet:n>0});n++;
 if(e.type!=='boss'){if(dash){wpEffect(e,6,0.35);if(e.type==='bru')wpEffect(e,2)}if(!isCli()){const d=Math.hypot(e.x-pl.x,e.z-pl.z)||1,v=dash?S.pushD:S.push;e.kx=(e.x-pl.x)/d*v;e.kz=(e.z-pl.z)/d*v}}}
for(const s of shots)if(!s.dead){const dx=s.x-pl.x,dz=s.z-pl.z,d=Math.hypot(dx,dz);if(d<R+0.3&&s.y<pl.y+3&&Math.abs(angDiff(Math.atan2(-dx,-dz),pl.yaw))<S.A+0.2){popShot(s);if(isCli())net.q.ps.push(s.id)}}
if(G.mode==='pvp')for(const o of others){if(o.dead)continue;const dx=o.x-pl.x,dz=o.z-pl.z;if(Math.hypot(dx,dz)<R&&Math.abs(angDiff(Math.atan2(-dx,-dz),pl.yaw))<S.A)pvHit(o,(dash?12:5)*pw,false,o.x,o.y+1.1,o.z)}
if(n){shake(dash?0.3:0.15);stopT(dash?0.06:0.03)}addText(dash?'ドガァッ！':'ガツッ',W*0.6+rnd(-40,60),H*0.56,{size:dash?66:48,st:dash?'boom':'hit',life:0.3})}
// guard state of a player: 1 = guarding the front (holding, or the barrier is up), 2 = reflecting window
const shRefl=()=>pl.jrT>0&&!pl.grd;
function shGuardOf(p){if(p===pl){if(wpW().kind!=='shield'||pl.dead)return 0;return(pl.grd||pl.sp===2?1:0)|(shRefl()?2:0)}return p.gf|0}
function w2Flags(){const g=shGuardOf(pl);return(g&1?32:0)|(g&2?64:0)|(wpW().kind==='shield'&&pl.sp===2&&!pl.dead?128:0)}
// host: an enemy shot reached player p. Blocked (front, guarding) or sent back (front, reflecting window)? true = handled
function wpGuardShot(p,s){const g=shGuardOf(p);if(!g)return false;const fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw),l=Math.hypot(s.vx,s.vz)||1;if((-s.vx*fx-s.vz*fz)/l<0.34)return false;
if(g&2){s.dead=true;const v=Math.hypot(s.vx,s.vy,s.vz)||10,k=Math.max(18,v*1.8)/v,b={own:1,x:s.x,y:Math.max(0.8,s.y),z:s.z,vx:-s.vx*k,vy:-s.vy*k*0.3,vz:-s.vz*k,t:0,dm:W2.sh.refl*(s.dmg||10)+20,by:p.slot};
 wrefl.push(b);wxPush(['X',r2(b.x),r2(b.y),r2(b.z),r1(b.vx),r1(b.vy),r1(b.vz)]);ev('txt','カキィン！',r1(s.x),r1(s.y+1),r1(s.z),56,'cyan');fxStar(s.x,s.y,s.z,1.8,C.cyan,0.12);
 if(p===pl){addGauge(5);addText('ジャストガード！',W/2,H*0.36,{size:70,st:'cyan',life:0.6});snd('crit');flash(0.15)}}
else{popShot(s);ev('txt','ガキン！',r1(s.x),r1(s.y+0.8),r1(s.z),48,'cyan');if(p===pl){snd('clank');pl.shHit=now}}
return true}
// local: a hit from (x,z) on a guarding player (the shield's front); true = no damage
function wpGuardHit(d,x,z){const jg=pl.jrT>0&&!pl.grd;if(x==null||wpW().kind!=='shield'||!(pl.grd||pl.sp===2||jg))return false;const dx=x-pl.x,dz=z-pl.z;if(Math.hypot(dx,dz)<0.6||Math.abs(angDiff(Math.atan2(-dx,-dz),pl.yaw))>1.2)return false;
if(jg){addGauge(6);pl.inv=Math.max(pl.inv,0.3);shStagger(x,z);addText('ジャストガード！',W/2,H*0.36,{size:70,st:'cyan',life:0.6});snd('crit');flash(0.15)}
else{addText('ガキン！',W/2+rnd(-120,120),H*0.45,{size:60,st:'cyan',life:0.35});snd('clank')}
shake(0.15);pl.shHit=now;return true}
// ジャストガードで近接の雑魚敵をのけぞらせる（攻撃してきた位置 x,z にいちばん近い敵）
function shStagger(x,z){let b=null,bd=3.2;for(const e of enemies){if(e.dead||e.st==='spawn'||e.type==='boss')continue;const d=Math.hypot(e.x-x,e.z-z);if(d<bd){bd=d;b=e}}if(!b)return;wpEffect(b,6,1.2);if(!isCli()){const d=Math.hypot(b.x-pl.x,b.z-pl.z)||1;b.kx=(b.x-pl.x)/d*10;b.kz=(b.z-pl.z)/d*10}fxStar(b.x,(b.y||0)+1,b.z,1.8,C.cyan,0.12)}
// host: enemy shots stop at a barrier (必殺「城壁結界」) of any player
function wpBarShot(s){if(s.dead)return false;const S=W2.sh;for(const p of allP()){if(!(p===pl?wpW().kind==='shield'&&pl.sp===2:p.bar))continue;const dx=s.x-p.x,dz=s.z-p.z,d=Math.hypot(dx,dz);
 if(Math.abs(d-S.barR)>0.9||s.y>(p.y||0)+4.2||Math.abs(angDiff(Math.atan2(-dx,-dz),p.yaw))>S.barA)continue;popShot(s);if(lim('barT',0.15))ev('txt','キンッ',r1(s.x),r1(s.y+0.6),r1(s.z),44,'cyan');return true}return false}
// host: what a reflected shot hits (the reflecting player gets the kill)
function w2HostHit(e,dm,by,x,y,z){if(e.type==='boss'&&(e.st==='rise'||e.st==='die'||e.st==='drop'))return;if(by===pl.slot||!net.on){wpDmg(e,dm,x,y,z,{fx:x-1,fz:z});return}
e.hp-=dm;e.flash=0.07;fxStar(x,y,z,1.2,C.cyan,0.1);if(e.hp<=0)kill(e,by)}
// ================= 護符の錫杖 =================
function staffUpdate(dt,f){if(f&&pl.cool<=0&&pl.sp!==1){pl.cool=W2.st.cool;let near=false;for(const e of enemies){if(e.dead||e.st==='spawn'||e.type==='boss')continue;if(w2Arc(e,pl.x,pl.z,pl.yaw,1.9,0.9,pl.y-0.5,pl.y+3)){near=true;break}}
 if(near)staffBonk();else staffCast()}}
function staffBonk(){const S=W2.st,pw=w2pw();wpAct(23);pl.cool=0.45;snd('whoosh');let n=0;
for(const e of enemies){if(e.dead||e.st==='spawn')continue;const s=w2Arc(e,pl.x,pl.z,pl.yaw,2.3,0.95,pl.y-0.5,pl.y+3);if(!s)continue;wpDmg(e,S.bonk*pw,s[0],s[1],s[2],{quiet:n>0});n++;if(e.type==='imp'&&!isCli()){const d=Math.hypot(e.x-pl.x,e.z-pl.z)||1;e.kx=(e.x-pl.x)/d*9;e.kz=(e.z-pl.z)/d*9}}
if(G.mode==='pvp')for(const o of others){if(o.dead)continue;const dx=o.x-pl.x,dz=o.z-pl.z;if(Math.hypot(dx,dz)<2.3&&Math.abs(angDiff(Math.atan2(-dx,-dz),pl.yaw))<0.95)pvHit(o,14*pw,false,o.x,o.y+1.1,o.z)}
if(n)shake(0.1);addText('ポカッ！',W*0.62+rnd(-40,60),H*0.56,{size:52,st:'hit',life:0.3})}
function staffCast(){const S=W2.st,AO=aimOrigin(),d=aimDir(),near=Math.hypot(muz[0]-pl.x,muz[2]-pl.z)<2.5,x=near?muz[0]:AO[0]+d[0]*0.9,y=near?muz[1]:AO[1]-0.1+d[1]*0.9,z=near?muz[2]:AO[2]+d[2]*0.9;
worbs.push({own:1,x,y,z,vx:d[0]*S.spd,vy:d[1]*S.spd,vz:d[2]*S.spd,t:0,by:pl.slot});wxPush(['O',r2(x),r2(y),r2(z),r2(d[0]),r2(d[1]),r2(d[2])]);wpAct(22);snd('whoosh');
addText(pick(['シャラン','リン…','シャン！']),W*0.64+rnd(-40,50),H*0.6,{size:44,st:'cyan',life:0.3})}
// 加護: a blessing on the local player (the stronger one wins, the time is the longer one)
function w2Bless(dur,atk,def){if(!(dur>0))return;const on=pl.bls>0;pl.blsA=Math.max(on?pl.blsA:1,atk||1);pl.blsD=Math.min(on?pl.blsD:1,def||1);pl.bls=pl.blsT=Math.max(on?pl.bls:0,dur);addText('加護！',W/2,H*0.44,{size:64,st:'cyan',life:0.7})}
// the special's strength (grows with 凸 through SK.spw / SK.beam)
function w2SpBless(){const S=W2.st;return{heal:Math.min(1,S.sh*SK.spw),dur:S.sT*SK.beam/0.8,atk:Math.min(2.5,1+S.sA*SK.spw),def:Math.max(0.3,1/(1+S.sD*SK.spw))}}
// the staff's special can always be used (no downed friend needed)
function wpSpOk(){return true}
function staffRevive(){const b=w2SpBless();wpAct(24);wxPush(['rv',r2(b.heal),r1(b.dur),r2(b.atk),r2(b.def)]);snd('item');snd('charge');flash(0.4);fxRing(pl.x,0.1,pl.z,9,W2_GREEN,0.5);fxStar(pl.x,2,pl.z,3,C.white,0.15);
pl.hp=Math.min(SK.hp,pl.hp+SK.hp*b.heal);w2Bless(b.dur,b.atk,b.def);
for(const o of others){if(o.dead){fxRing(o.x,0.1,o.z,5,C.white,0.4);fxStar(o.x,1.2,o.z,3,C.cyan,0.15)}else if(G.mode!=='pvp')w2HealFx(o)}addText('反魂の祈り！',W/2,H*0.16,{size:84,st:'cyan',life:0.9,rot:-0.06})}
// ================= SPECIALS =================
function w2SpStart(w){switch(w.kind){
case'flail':flSpStart();break;
case'spear':snd('charge');snd('zap');flash(0.4);lines(0.6,'#ffe680');addText('バリバリバリッ！',W/2,H*0.15,{size:84,st:'fire',life:0.9,rot:-0.08});break;
case'bow':bowRain();break;
case'shield':pl.hon=0;snd('freeze');flash(0.4);addText('ガキィィン！',W/2,H*0.15,{size:86,st:'cyan',life:0.9,rot:-0.06});break;
case'staff':staffRevive();break}}
// ================= WORLD (everyone's; only the owner's deal damage) =================
function w2World(dt){
if(isCli())for(const e of enemies)if(e.stn>0)e.stn-=dt;
for(let i=wflys.length-1;i>=0;i--){const f=wflys[i];if(f.o!==pl&&!others.includes(f.o)){wflys.splice(i,1);continue}const a=f.b;f.t+=dt;const p=flBall(f);f.b=p;
 if(f.own&&f.m==='t')flHitSeg(f,a,p);
 if(!f.bang&&f.t>=f.To){f.bang=1;flBang(f,p)}
 if(f.t>=f.To+f.Tb){wflys.splice(i,1);if(f.o.fb===f)f.o.fb=null}}
for(let i=wspk.length-1;i>=0;i--){const s=wspk[i],d0=s.d;s.d+=(s.big?70:48)*dt;s.t+=dt;const a=[s.x+s.dx*d0,s.y+s.dy*d0,s.z+s.dz*d0],b=[s.x+s.dx*s.d,s.y+s.dy*s.d,s.z+s.dz*s.d],rr=s.big?1.6:0.9;
 if(s.own){const S=W2.sp,pw=w2pw();for(const e of enemies){if(e.dead||e.st==='spawn'||s.hit.has(e)||s.n<=0)continue;for(const q of spheres(e))if(w2Seg3(a,b,q,rr)){s.hit.add(e);s.n--;wpDmg(e,S.wvDm*pw*(s.big?2.4:1),q[0],q[1],q[2],{quiet:1});spZap(e,q);if(lim('wvh',0.08))fxSparks(q[0],q[1],q[2],4,6,C.yellow);break}}
  for(const q of shots)if(!q.dead&&w2Seg3(a,b,[q.x,q.y,q.z,q.r],rr)){popShot(q);if(isCli())net.q.ps.push(q.id)}
  if(G.mode==='pvp')for(const o of others)if(!o.dead&&!s.hit.has(o)&&s.n>0&&w2Seg3(a,b,[o.x,o.y+1.1,o.z,0.6],rr)){s.hit.add(o);s.n--;pvHit(o,(s.big?26:10)*pw,false,o.x,o.y+1.1,o.z)}}
 if(s.d>=s.R||s.n<=0){if(!s.big&&s.d>=s.R)fxSparks(b[0],b[1],b[2],3,4,C.yellow);wspk.splice(i,1)}}
for(let i=warrows.length-1;i>=0;i--){const a=warrows[i];a.t+=dt;if(a.stk){if(a.t>a.stk)warrows.splice(i,1);continue}
 const st=a.sp*dt,x0=a.x,y0=a.y,z0=a.z,tw=rayWorld(x0,y0,z0,a.dx,a.dy,a.dz,st);let end=Math.min(st,tw);
 const pw=w2pw(),hits=[];for(const e of enemies){if(e.dead||e.st==='spawn'||a.hit.has(e))continue;let tm=1e9,hs=null;for(const s of spheres(e)){const t=raySph(x0,y0,z0,[a.dx,a.dy,a.dz],s[0],s[1],s[2],s[3]+0.1);if(t>=0&&t<tm){tm=t;hs=s}}if(hs&&tm<end)hits.push([tm,e,hs])}
 hits.sort((p,q)=>p[0]-q[0]);for(const[t,e,s]of hits){if(a.n<=0)break;a.hit.add(e);a.n--;if(a.own){wpDmg(e,a.dm,x0+a.dx*t,y0+a.dy*t,z0+a.dz*t,{quiet:a.hit.size>2});if(a.c>=1)fxStar(x0+a.dx*t,y0+a.dy*t,z0+a.dz*t,1.4,C.cyan,0.1)}if(a.n<=0)end=t}
 if(a.own){for(const q of shots)if(!q.dead){const t=raySph(x0,y0,z0,[a.dx,a.dy,a.dz],q.x,q.y,q.z,q.r+0.2);if(t>=0&&t<end){popShot(q);if(isCli())net.q.ps.push(q.id)}}
  if(G.mode==='pvp')for(const o of others)if(!o.dead&&!a.hit.has(o)&&a.n>0){const t=raySph(x0,y0,z0,[a.dx,a.dy,a.dz],o.x,o.y+1.1,o.z,0.6);if(t>=0&&t<end){a.hit.add(o);a.n--;pvHit(o,a.dm*0.35,false,o.x,o.y+1.1,o.z)}}}
 a.x+=a.dx*end;a.y+=a.dy*end;a.z+=a.dz*end;
 if(a.n<=0){warrows.splice(i,1);continue}
 if(tw<st-1e-4||a.y<0.05){a.stk=a.t+1.2;if(lim('awl',0.1))fxSparks(a.x,a.y,a.z,3,4,C.white);continue}
 if(a.t>1.6)warrows.splice(i,1)}
for(let i=wrains.length-1;i>=0;i--){const r=wrains[i],S=W2.bw;r.t+=dt;
 if(r.t<S.rainT){if(lim('rnT',0.2)&&Math.hypot(r.x-cam.x,r.z-cam.z)<45){const v=sndVol;sndVol=v*0.5;snd('whoosh');sndVol=v}if(r.t>0.2&&lim('rnTx',0.5))sfxAt('ドドドドッ',r.x+rnd(-3,3),2.5,r.z+rnd(-3,3),{size:62,st:'cyan',life:0.4})
  if(r.own){r.tk-=dt;if(r.tk<=0){r.tk=0.12;const dm=S.rain*SK.spw*w2pw();let n=0;for(const e of enemies){if(e.dead||e.st==='spawn')continue;for(const s of spheres(e))if(Math.hypot(s[0]-r.x,s[2]-r.z)<r.r+s[3]*0.5){wpDmg(e,dm,s[0],s[1],s[2],{quiet:n>0||!lim('rnh'+e.id,0.3),fx:r.x,fz:r.z});n++;break}}
   for(const q of shots)if(!q.dead&&Math.hypot(q.x-r.x,q.z-r.z)<r.r&&q.y<14){popShot(q);if(isCli())net.q.ps.push(q.id)}
   if(G.mode==='pvp')for(const o of others)if(!o.dead&&Math.hypot(o.x-r.x,o.z-r.z)<r.r)pvHit(o,4,false,o.x,o.y+1.1,o.z)}}}
 if(r.t>=r.life)wrains.splice(i,1)}
for(let i=wrefl.length-1;i>=0;i--){const b=wrefl[i],x0=b.x,y0=b.y,z0=b.z;b.t+=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;let done=b.t>3||b.y<0.05;
 if(!done){const l=Math.hypot(b.x-x0,b.y-y0,b.z-z0);if(l>1e-4&&rayWorld(x0,y0,z0,(b.x-x0)/l,(b.y-y0)/l,(b.z-z0)/l,l)<l)done=true}
 if(!done)for(const e of enemies){if(e.dead||e.st==='spawn')continue;for(const s of spheres(e))if(w2Seg3([x0,y0,z0],[b.x,b.y,b.z],s,0.35)){if(b.own)w2HostHit(e,b.dm,b.by,b.x,b.y,b.z);done=true;break}if(done)break}
 if(done){fxStar(b.x,b.y,b.z,1.1,C.cyan,0.08);fxSparks(b.x,b.y,b.z,4,5,C.cyan);wrefl.splice(i,1)}}
for(let i=worbs.length-1;i>=0;i--){const b=worbs[i],S=W2.st,x0=b.x,y0=b.y,z0=b.z;b.t+=dt;
 // home a little on the nearest friend in front (not the caster); in versus there are no friends
 if(G.mode!=='pvp'){let tg=null,bd=14;const sp=Math.hypot(b.vx,b.vy,b.vz)||1;for(const p of[pl,...others]){if(p.dead||p.slot===b.by)continue;const dx=p.x-b.x,dy=(p.y||0)+1.1-b.y,dz=p.z-b.z,d=Math.hypot(dx,dy,dz);if(d<bd&&(dx*b.vx+dy*b.vy+dz*b.vz)/(d*sp)>0.2){bd=d;tg=[dx/d,dy/d,dz/d]}}
  if(tg){const k=S.turn*dt;let nx=b.vx/sp+tg[0]*k,ny=b.vy/sp+tg[1]*k,nz=b.vz/sp+tg[2]*k;const l=Math.hypot(nx,ny,nz)||1;b.vx=nx/l*sp;b.vy=ny/l*sp;b.vz=nz/l*sp}}
 b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;let done=b.t>S.life||b.y<0.1,heal=null,foe=null;
 if(!done){const l=Math.hypot(b.x-x0,b.y-y0,b.z-z0);if(l>1e-4&&rayWorld(x0,y0,z0,(b.x-x0)/l,(b.y-y0)/l,(b.z-z0)/l,l)<l)done=true}
 if(!done)for(const p of[pl,...others]){if(p.dead||p.slot===b.by)continue;if(Math.hypot(b.x-p.x,b.y-(p.y||0)-1.1,b.z-p.z)<0.95){done=true;heal=p;break}}
 if(!done)for(const e of enemies){if(e.dead||e.st==='spawn')continue;for(const s of spheres(e))if(Math.hypot(b.x-s[0],b.y-s[1],b.z-s[2])<s[3]+0.3){foe=[e,s];break}if(foe){done=true;break}}
 if(heal&&b.own){if(G.mode==='pvp')pvHit(heal,14*w2pw(),false,heal.x,heal.y+1.1,heal.z);else{wxPush(['hl',heal.slot,W2.st.heal,S.bT,S.bA,S.bD]);w2HealFx(heal)}}
 if(foe&&b.own)wpDmg(foe[0],S.dm*w2pw(),foe[1][0],foe[1][1],foe[1][2]);
 if(done){if(!heal){fxStar(b.x,b.y,b.z,0.9,C.cyan,0.08);fxSparks(b.x,b.y,b.z,4,4,W2_GREEN)}worbs.splice(i,1)}}}
const W2_GREEN=[0.35,0.95,0.55],W2_LGREEN=[0.75,1,0.8];
function w2HealFx(p){fxRing(p.x,0.1,p.z,3,W2_GREEN,0.35);fxStar(p.x,(p.y||0)+1.2,p.z,1.6,W2_LGREEN,0.12);fxSparks(p.x,(p.y||0)+1.2,p.z,8,4,W2_GREEN);sfxAt('ホワッ',p.x,(p.y||0)+2.6,p.z,{size:46,st:'cyan',life:0.45})}
// others' events (wfxPlay)
function w2Fx(o,a){switch(a[0]){
case'F':{const f=flMake(o,0,[a[1],a[2],a[3]],a[4],a[5],a[6]);wflys.push(f);o.fb=f;break}
case'f':{const f=flSlam(o,0,a[1],a[2],a[3]);wflys.push(f);o.fb=f;o.fsA=angDiff(o.yaw,Math.atan2(-(a[1]-o.x),-(a[2]-o.z)));break}
case'S':wspk.push({own:0,x:a[1],y:a[2],z:a[3],dx:a[4],dy:a[5],dz:a[6],k:a[7],big:a[8],t:0,d:0,R:a[9]||14,hit:new Set(),n:a[8]?999:2});break;
case'A':warrows.push({own:0,x:a[1],y:a[2],z:a[3],dx:a[4],dy:a[5],dz:a[6],sp:W2.bw.spd*(0.75+0.5*a[7]),t:0,c:a[7],dm:0,n:1+Math.floor(a[7]*4+1e-6),hit:new Set(),stk:0});break;
case'R':wrains.push(bwRainMk(0,a[1],a[2],a[3]));break;
case'O':worbs.push({own:0,x:a[1],y:a[2],z:a[3],vx:a[4]*W2.st.spd,vy:a[5]*W2.st.spd,vz:a[6]*W2.st.spd,t:0,by:o.slot});break;
case'X':wrefl.push({own:0,x:a[1],y:a[2],z:a[3],vx:a[4],vy:a[5],vz:a[6],t:0});break;
case'hl':{const p=w2P(a[1]);if(p)w2HealFx(p);if(a[1]===net.slot&&!pl.dead&&G.mode!=='pvp'){pl.hp=Math.min(SK.hp,pl.hp+SK.hp*a[2]);snd('item');addText('回復！',W/2,H*0.4,{size:70,st:'cyan',life:0.6});if(a[3])w2Bless(a[3],a[4],a[5])}break}
case'rv':for(const q of others)if(q.dead){fxRing(q.x,0.1,q.z,5,W2_GREEN,0.4);fxStar(q.x,1.2,q.z,3,C.white,0.15)}else if(G.mode!=='pvp')w2HealFx(q);fxRing(o.x,0.1,o.z,9,W2_GREEN,0.5);
 if(G.mode!=='pvp'){if(pl.dead){pl.dead=false;pl.hp=Math.round(SK.hp*Math.max(0.6,a[1]||0));pl.inv=2.5;pl.revT=0;snd('item');flash(0.4);addText('フッカツ！',W/2,H*0.4,{size:96,st:'cyan',life:0.9})}
  else{pl.hp=Math.min(SK.hp,pl.hp+SK.hp*(a[1]||0));snd('item');w2HealFx(pl);addText('回復！',W/2,H*0.4,{size:70,st:'cyan',life:0.6})}w2Bless(a[2],a[3],a[4])}break}}
function w2OtherAct(o,ak){if(ak>=12&&ak<=14||ak===20||ak===23||ak===10||ak===17){const v=sndVol;sndVol=v*clamp(1.2-Math.hypot(o.x-pl.x,o.z-pl.z)/30,0.15,0.7);snd(ak<=14?'slash':'whoosh');sndVol=v}}
// ================= DRAW: world =================
function w2SegW(a,b,w,col,fl){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];mPush();mT((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);const l=orient(dx,dy,dz);mS(w,w,l);emit(BOX,col,0,0,fl==null?F_UNLIT|F_NOCAST:fl,0);mPop()}
const W2_SHAFT=[0.93,0.88,0.76],W2_GLOW=[0.45,0.95,1],W2_BAR=[0.55,0.92,1],W2_BARL=[0.85,0.98,1];
// arrow along (dx,dy,dz) centred at x,y,z, length len (code-built)
function w2Arrow(x,y,z,dx,dy,dz,len,glow){mPush();mT(x,y,z);orient(dx,dy,dz);put(CYL,0,0,0,PI/2,0,0,0.016,len,0.016,W2_SHAFT);put(CONE,0,0,len/2+0.05,PI/2,0,0,0.045,0.11,0.045,glow?W2_GLOW:C.white,0,0.6,glow?F_UNLIT:0);
put(BOX,0,0.02,-len/2+0.06,0,0,0,0.008,0.05,0.12,C.red);put(BOX,0.02,0,-len/2+0.06,0,0,0,0.05,0.008,0.12,C.red);mPop()}
// the flail chain: link meshes along a curve from the eye E to the ball centre B (sags when slack, stretches when long), and the ball
function flChain(E,B,sc){const md=WMOD.flail;if(!md||!md.fl)return;const F=md.fl,NF=0;
const dx=B[0]-E[0],dy=B[1]-E[1],dz=B[2]-E[2],D=Math.hypot(dx,dy,dz)||1e-3,ux=dx/D,uy=dy/D,uz=dz/D,bc=F.bc*sc,Bc=[B[0]-ux*bc,B[1]-uy*bc,B[2]-uz*bc],L=Math.max(D-bc,0.02),ln=F.len*sc;
const sag=L<ln?Math.sqrt(ln*ln-L*L)*0.55:0,C2=[(E[0]+Bc[0])/2,(E[1]+Bc[1])/2-sag,(E[2]+Bc[2])/2],arc=Math.max(L,ln),p0=F.pitch*sc,n=clamp(Math.round(arc/p0),2,110),sp=arc/n,k=clamp(sp/p0,1,2.5),el=sp/(p0*k);
for(let i=0;i<n;i++){const t=(i+0.5)/n,a=1-t,P=[0,1,2].map(j=>a*a*E[j]+2*a*t*C2[j]+t*t*Bc[j]),T=[0,1,2].map(j=>2*a*(C2[j]-E[j])+2*t*(Bc[j]-C2[j])),tl=Math.hypot(T[0],T[1],T[2])||1;
 const it=F.lk[i&1];if(!it)continue;wpFrame(P,T,Math.abs(T[1])/tl>0.9?[1,0,0]:[0,1,0],sc*k);mPush();M.set(W2I);mApply(WF);mS(1,1,el);emit(it.pi,it.c,it.mat,it.gloss,it.fl,it.rim);mPop()}
wpFrame(B,[ux,uy,uz],Math.abs(uy)>0.9?[1,0,0]:[0,1,0],sc);mPush();M.set(W2I);mApply(WF);mRZ(now*(Math.hypot(dx,dz)>3?9:0));for(const it of F.ball){mPush();mApply(it.bm);emit(it.pi,it.c,it.mat,it.gloss,it.fl,it.rim);mPop()}mPop()}
// where the ball of player o is now (S = its state): in flight / swung overhead / hanging from the eye E
function flBallAt(o,S,E,sc){if(S.fb)return S.fb.b;const chg=S===pl?pl.hon:o.ak===9&&o.hc>0;
if(chg){const a=now*9+(o.slot|0),r=W2.fl.orbR;return[o.x+Math.cos(a)*r,(o.y||0)+2.45+0.15*Math.sin(2*a),o.z+Math.sin(a)*r]}
const F=WMOD.flail.fl;return[E[0]+0.05*Math.sin(now*2.1+(o.slot|0)),Math.max(0.2,E[1]-(F.len+F.bc)*sc*0.97),E[2]+0.05*Math.cos(now*1.7)]}
function drawW2World(){const NF=F_UNLIT|F_NOCAST;
// stunned enemies: lightning (雷) / stars (盾で押された)
for(const e of enemies){if(e.dead||!(e.stn>0))continue;const c=eCenter(e),r=Math.min(c[3],3);
 if(e.zapT>now-1||e.stnZ){for(let k=0;k<3;k++){let p=[c[0]+rnd(-r,r),c[1]+r*0.9,c[2]+rnd(-r,r)];for(let j=0;j<3;j++){const q=[p[0]+rnd(-0.5,0.5),p[1]-rnd(0.3,0.7)*r,p[2]+rnd(-0.5,0.5)];w2SegW(p,q,0.07,j%2?C.white:C.yellow);p=q}}bill(STAR,c[0]+rnd(-r,r)*0.6,c[1]+rnd(-r,r)*0.6,c[2],0.5*r,now*20,C.yellow,NF)}
 else for(let k=0;k<3;k++){const a=now*5+k*TAU/3;bill(STAR,c[0]+Math.cos(a)*r*0.6,c[1]+r*0.8,c[2]+Math.sin(a)*r*0.6,0.28,now*8,C.yellow,NF)}}
// spear thrust-slash: a lance of light with its tip leading (it grows out of the spear point), speed lines and shock rings
for(const s of wspk){const big=s.big,Ln=big?8:3.4*(s.k===2?1.25:1),L=Math.min(Ln,s.d+0.4),w=(big?2.2:1)*(0.4+0.6*L/Ln),dx=s.dx,dy=s.dy,dz=s.dz,
 P=[s.x+dx*s.d,s.y+dy*s.d,s.z+dz*s.d],h=Math.hypot(dx,dz),rt=h>0.01?[dz/h,0,-dx/h]:[1,0,0],up=[dy*rt[2]-dz*rt[1],dz*rt[0]-dx*rt[2],dx*rt[1]-dy*rt[0]],
 at=(f)=>[P[0]-dx*L*f,P[1]-dy*L*f,P[2]-dz*L*f];
 // the blade (a cone, base at the tail, tip at P)
 const M0=at(0.5);mPush();mT(M0[0],M0[1],M0[2]);orient(dx,dy,dz);mRX(PI/2);mS(w,L,w);emit(CONE,C.white,0,0,NF,0);mPop();
 // a bright core line running through it, and out behind it
 w2SegW(at(1.7),at(0.05),big?0.09:0.05,C.yellow);
 // shock rings around the blade
 for(const[f,m,c]of[[0.3,1.7,C.white]]){const Q=at(f);mPush();mT(Q[0],Q[1],Q[2]);orient(dx,dy,dz);mRX(PI/2);mS(w*m,0.05,w*m);emit(CYL,c,0,0,NF|F_NOEDGE,0);mPop()}
 // speed lines drawn in toward the tip
 for(let i=0;i<6;i++){const a=i*TAU/6+s.t*5,ca=Math.cos(a),sa=Math.sin(a),o1=w*1.5,o2=w*0.45,
  A=at(1.35),B=at(0.35);const q=(P0,o)=>[P0[0]+(rt[0]*ca+up[0]*sa)*o,P0[1]+(rt[1]*ca+up[1]*sa)*o,P0[2]+(rt[2]*ca+up[2]*sa)*o];
  w2SegW(q(A,o1),q(B,o2),big?0.06:0.035,C.white)}}
// arrows
for(const a of warrows)w2Arrow(a.x-a.dx*0.45,a.y-a.dy*0.45,a.z-a.dz*0.45,a.dx,a.dy,a.dz,0.9,a.c>=1);
for(const a of warrows)if(!a.stk&&a.c>=0.5)bill(STAR,a.x,a.y,a.z,0.25+0.2*a.c,now*30,W2_GLOW,NF);
// rain of arrows: falling, then stuck in the ground (a faint ring shows the area that draws faster)
for(const r of wrains){const S=W2.bw,fade=sat((r.life-r.t)/0.6);put(CYL,r.x,0.06,r.z,0,0,0,r.r*2*fade,0.02,r.r*2*fade,[0.75,0.92,1],0,0,F_NOCAST|F_NOEDGE);
 for(const[x,z,ti,ry,tl]of r.arr){if(r.t<ti-0.4)continue;if(r.t<ti){const y=(ti-r.t)*38;w2Arrow(x,y+0.4,z,0.08,-1,0.05,0.9,1);continue}const sink=1-fade;mPush();mT(x,0.28-sink*0.6,z);mRY(ry);mRX(tl);w2Arrow(0,0,0,0,1,0,0.7,0);mPop()}
 if(r.t<S.rainT)for(let k=0;k<4;k++)bill(STAR,r.x+rnd(-r.r,r.r)*0.7,0.3,r.z+rnd(-r.r,r.r)*0.7,0.6,now*20,C.white,NF)}
// reflected shots
for(const b of wrefl){sph(b.x,b.y,b.z,0.5,0.5,0.5,C.cyan,0,1,F_UNLIT);bill(STAR,b.x,b.y,b.z,0.7,now*25,C.white,NF)}
// talisman orbs
for(const b of worbs){const p=1+0.15*Math.sin(now*20+b.t*7);sph(b.x,b.y,b.z,0.42*p,0.42*p,0.42*p,W2_GREEN,0,1,F_UNLIT);bill(STAR,b.x,b.y,b.z,0.45*p,now*12,W2_LGREEN,NF);
 put(BOX,b.x,b.y+0.02,b.z,0,now*4,0.3,0.16,0.26,0.01,[0.97,0.94,0.86],0,0,F_UNLIT)}
// barriers
if(!pl.dead&&wpW().kind==='shield'&&pl.sp===2&&G.state==='play')shBarrier(pl);for(const o of others)if(o.bar&&!o.dead)shBarrier(o)}
function shBarrier(p){const S=W2.sh,R=S.barR,A=S.barA,Hh=3.6,n=10,y0=p.y||0,pul=0.5+0.5*Math.sin(now*6),col=[W2_BAR[0],W2_BAR[1]-0.08*pul,W2_BAR[2]];
const pt=(a,h)=>{const y=p.yaw+a;return[p.x-Math.sin(y)*R,y0+h,p.z-Math.cos(y)*R]};
for(let i=0;i<=n;i++){const a=-A+2*A*i/n;w2SegW(pt(a,0),pt(a,Hh),i%5?0.03:0.06,col)}
for(const h of[0.05,1.2,2.4,Hh])for(let i=0;i<n;i++)w2SegW(pt(-A+2*A*i/n,h),pt(-A+2*A*(i+1)/n,h),0.045,col);
for(let i=0;i<n;i++)for(let j=0;j<3;j++){const a0=-A+2*A*i/n,a1=-A+2*A*(i+1)/n,h0=j*1.2,h1=h0+1.2;w2SegW(pt(a0,h0),pt(a1,h1),0.02,W2_BARL);w2SegW(pt(a1,h0),pt(a0,h1),0.02,W2_BARL)}
const k=(now*1.4)%1;for(let i=0;i<n;i++)w2SegW(pt(-A+2*A*i/n,k*Hh),pt(-A+2*A*(i+1)/n,k*Hh),0.03,C.white)}
// ================= DRAW: first-person view (wpView) =================
const SPV_I=[0.28,-0.36,0.02,0.1,0.14,0],SPV_B=[0.29,-0.33,0.12,0.1,0.16,0],SPV_T=[[0.3,-0.12,-0.42,-0.06,0.3,0],[0.14,-0.42,-0.46,0.12,-0.12,0],[0.02,-0.26,-0.44,0.32,0.04,0]],
FLV_I=[0.24,-0.36,-0.45,0.15,0.7,0],FLV_C=[0.22,0.02,-0.4,0.1,1.35,0],FLV_T=[0.16,-0.18,-0.62,0.05,0.15,0],FLV_D=[0.16,-0.3,-0.6,0.05,-0.2,0],
BWV_I=[-0.17,-0.24,-0.56,0.04,-0.05,0.18],BWV_A=[-0.1,-0.13,-0.5,0,0.02,0.08],
SHV_I=[-0.34,-0.42,-0.52,0.35,0.05,0.1],SHV_G=[-0.14,-0.4,-0.46,0.05,0.12,0],SHV_P=[-0.1,-0.34,-0.74,0,0.05,0],SHV_S=[-0.1,-0.26,-0.5,0,0.25,0],
STV_I=[0.27,-0.36,-0.42,0.15,0.95,1.62],STV_C=[0.2,-0.2,-0.62,0.08,0.4,1.57],STV_U=[0.3,-0.05,-0.35,0.1,1.6,1.57],STV_D=[0.1,-0.4,-0.7,0,-0.3,1.57],STV_S=[0.12,-0.08,-0.5,0.05,1.3,1.57];
const w2Kfs=(I,T)=>[[0,I],[0.05,SPV_B],[0.11,T],[0.24,T],[0.42,I]];
// pose of the view model; returns {s, tip}
function w2View(w,ak,at){let v=null,s=0.62,tip=[0,0,-0.6];
switch(w.kind){
case'spear':v=ak>=12&&ak<=14?kf(w2Kfs(SPV_I,SPV_T[ak-12]),at):SPV_I;tip=[0,0,-1.45];break;
case'flail':{const ch=pl.hon,c0=sat(at/0.15);v=pl.fsp?kf([[0,FLV_I],[0.1,FLV_C],[0.22,FLV_D],[0.34,FLV_I]],at):ch?FLV_I.map((a,j)=>a+(FLV_C[j]-a)*c0):pl.fb?FLV_T:ak===10?kf([[0,FLV_T],[0.3,FLV_T],[0.6,FLV_I]],at):FLV_I;
 if(ch){v=v.slice();v[0]+=Math.sin(now*9)*0.02;v[1]+=Math.cos(now*9)*0.02}s=0.75;tip=[0,0,-WMOD.flail.fl.eye];break}
case'bow':{const rel=ak===17&&at<0.4;v=pl.hon||rel?BWV_A:BWV_I;if(rel){v=v.slice();v[2]+=0.03*Math.sin(at*40)*(1-at/0.4)}s=0.55;tip=[0,0,-0.15];break}
case'shield':{const g=pl.grd||pl.sp===2,hit=now-(pl.shHit||-9)<0.2;v=ak===20&&at<0.32?kf([[0,SHV_G],[0.06,SHV_P],[0.16,SHV_P],[0.32,g?SHV_G:SHV_I]],at):pl.sp===2?SHV_S:g?SHV_G:SHV_I;if(hit){v=v.slice();v[2]+=0.06*(1-(now-pl.shHit)/0.2)}s=0.6;tip=[0,0,-0.05];break}
case'staff':v=ak===22?kf([[0,STV_I],[0.08,STV_C],[0.3,STV_C],[0.5,STV_I]],at):ak===23?kf([[0,STV_I],[0.08,STV_U],[0.16,STV_D],[0.45,STV_I]],at):ak===24?kf([[0,STV_I],[0.25,STV_S],[1.2,STV_S],[1.5,STV_I]],at):STV_I;s=0.6;tip=[0,0,-1.02];break}
mT(v[0],v[1],v[2]);mRY(v[3]);mRX(v[4]);mRZ(v[5]);return{s,tip}}
// extras in the weapon's own (scaled) space: the bow string + arrow; the flail chain + ball (world, layer 1)
function w2ViewExtra(w,s){if(w.kind==='bow'){const ready=pl.hon||pl.cool<=0.05;bwStr(pl.hon?pl.hc:0,ready&&pl.sp!==1)}
else if(w.kind==='flail'){const F=WMOD.flail&&WMOD.flail.fl;if(!F)return;const e=[0,0,-F.eye],E=[M[0]*e[0]+M[4]*e[1]+M[8]*e[2]+M[12],M[1]*e[0]+M[5]*e[1]+M[9]*e[2]+M[13],M[2]*e[0]+M[6]*e[1]+M[10]*e[2]+M[14]],sc=Math.hypot(M[0],M[1],M[2]);
 const lay=curLayer;curLayer=1;mPush();M.set(W2I);flChain(E,flBallAt(pl,pl,E,sc),sc);mPop();curLayer=lay}}
// the bow string drawn back by c (0..1), and the arrow on it (weapon space)
function bwStr(c,arrow){const md=WMOD.bow;if(!md||!md.bw)return;const b=md.bw,pull=b.z+0.42*c,D=[0,0,pull];w2SegW([0,b.y1,b.z],D,0.007,W2_GLOW,F_UNLIT|F_NOCAST);w2SegW([0,b.y0,b.z],D,0.007,W2_GLOW,F_UNLIT|F_NOCAST);
if(arrow){w2Arrow(0,0.012,pull-0.42,0,0,-1,0.84,c>=1);if(c>=1)bill(STAR,0,0.012,pull-0.9,0.08+0.02*Math.sin(now*30),now*20,W2_GLOW,F_UNLIT|F_NOCAST)}}
// ================= DRAW: hero (model space: up +Y, faces +Z, the hero's right is -X) =================
const SPH_I=[-0.26,1.05,0.24,-0.08,0.15],SPH_B=[-0.22,1.12,-0.02,-0.06,0.15],SPH_T=[[-0.36,1.45,0.62,0.22,0.32],[-0.14,0.98,0.66,-0.02,-0.22],[0.02,1.22,0.64,-0.32,0.05]],
FLH_I=[-0.28,1.05,0.28,0.1,0.55],FLH_C=[-0.48,1.72,0.22,0,1.45],FLH_T=[-0.2,1.42,0.6,0,0.1],
SHH_I=[0.34,1.12,0.34,-0.25,0],SHH_G=[0.1,1.32,0.46,0,0.05],SHH_P=[0.1,1.3,0.78,0,0.05],SHH_S=[0.08,1.55,0.5,0,0.25],
STH_I=[-0.3,1.0,0.22,0,1.25],STH_C=[-0.24,1.38,0.55,0,0.35],STH_U=[-0.28,1.75,0.1,0,1.9],STH_D=[-0.12,1.05,0.55,0,-0.4],STH_S=[-0.12,1.85,0.28,0,1.5];
function w2HeroBody(o,k,at,ak){let tw=0,bd=0;
if(k==='spear'&&ak>=12&&ak<=14){const g=kf([[0,0],[0.05,-0.3],[0.11,1],[0.24,1],[0.42,0]],at);tw=[0.25,0,-0.3][ak-12]*g;bd=[0,0.18,0][ak-12]*g}
else if(k==='flail'&&ak===11)bd=kf([[0,0],[0.1,-0.15],[0.22,0.35],[0.34,0]],at);
else if(k==='shield'&&ak===20)bd=kf([[0,0],[0.06,0.2],[0.16,0.2],[0.32,0]],at);
else if(k==='staff'&&ak===23)bd=kf([[0,0],[0.08,-0.15],[0.16,0.35],[0.45,0]],at);
if(tw){hRot('spine',HY,tw*0.5);hRot('chest',HY,tw*0.5)}if(bd){hRot('spine',HX,bd*0.6);hRot('chest',HX,bd*0.4)}}
// arms + weapon frame; returns {show, tip} like wpHeroArms
function w2HeroArms(o,w,A,pit,at,ak){const k=w.kind,S=wpS(o),Hh=HERO;let P,f,u=[0,1,0],tip=[0,0,-0.6];
const PL=[0.3,1.0,0.12],pose=v=>{P=[v[0],v[1],v[2]];f=dirYE(v[3],v[4])};
if(k==='spear'){pose(ak>=12&&ak<=14?kf([[0,SPH_I],[0.05,SPH_B],[0.11,SPH_T[ak-12]],[0.24,SPH_T[ak-12]],[0.42,SPH_I]],at):SPH_I);tip=[0,0,-1.45];
 heroArm('R',P,[-1,-0.5,0],-1.2);P=Hh.GT[Hh.bi.hand_R].slice();heroArm('L',[P[0]+f[0]*0.38,P[1]+f[1]*0.38,P[2]+f[2]*0.38],[1,-0.6,0],1.3)}
else if(k==='flail'){const ch=S===pl?pl.hon:ak===9&&o.hc>0;if(S.fsp||ak===11&&at<0.34){const a=S.fsA||0;pose(kf([[0,FLH_I],[0.1,FLH_C],[0.22,[-0.22,1.15,0.55,a,-0.35]],[0.34,FLH_I]],at))}
 else pose(ch?FLH_I.map((x,j)=>x+(FLH_C[j]-x)*sat(at/0.15)):S.fb||ak===10&&at<0.3?FLH_T:FLH_I);if(f[1]>0.9)u=[0,0,1];tip=[0,0,-0.2];
 if(ch){P[0]+=Math.sin(now*9)*0.04;P[2]+=Math.cos(now*9)*0.04}heroArm('R',P,[-1,-0.35,-0.1],-1.2);P=Hh.GT[Hh.bi.hand_R].slice();heroArm('L',PL,[1,-0.8,0.2],1.3)}
else if(k==='bow'){const R=m3axis(HX,-pit),at3=p=>{const r=m3v(R,p);return[A[0]+r[0],A[1]+r[1],A[2]+r[2]]},ch=S===pl?pl.hon:ak===16&&o.hc>0,c=ch?(S===pl?pl.hc:o.hc):0,aim=ch||ak===17&&at<0.4;
 heroArm('L',at3(aim?[0.14,-0.02,0.5]:[0.2,-0.2,0.36]),[1,-0.6,0],1.3);P=Hh.GT[Hh.bi.hand_L].slice();f=m3v(R,aim?[0,0,1]:[0.1,-0.25,0.96]);u=m3v(R,[0,1,0]);
 const pull=0.2+0.42*c+(ak===17&&at<0.25?0.05:0);heroArm('R',[P[0]-f[0]*pull-0.02,P[1]-f[1]*pull+0.02,P[2]-f[2]*pull],[-1,-0.35,-0.1],-1.2);tip=[0,0,-0.4]}
else if(k==='shield'){const g=S===pl?pl.grd||pl.sp===2:o.gf&1,v=ak===20&&at<0.32?kf([[0,SHH_G],[0.06,SHH_P],[0.16,SHH_P],[0.32,g?SHH_G:SHH_I]],at):(S===pl?pl.sp===2:o.bar)?SHH_S:g?SHH_G:SHH_I;pose(v);
 heroArm('L',P,[1,-0.6,-0.2],0.4);P=Hh.GT[Hh.bi.hand_L].slice();heroArm('R',[-0.3,1.02,0.16],[-1,-0.5,0],-1.2);tip=[0,0,-0.1]}
else{pose(ak===22?kf([[0,STH_I],[0.08,STH_C],[0.3,STH_C],[0.5,STH_I]],at):ak===23?kf([[0,STH_I],[0.08,STH_U],[0.16,STH_D],[0.45,STH_I]],at):ak===24?kf([[0,STH_I],[0.25,STH_S],[1.2,STH_S],[1.5,STH_I]],at):STH_I);u=[-1,0,0];tip=[0,0,-1.02];
 heroArm('R',P,[-1,-0.35,-0.1],-1.2);P=Hh.GT[Hh.bi.hand_R].slice();heroArm('L',ak===24&&at<1.4?[P[0]+f[0]*0.25+0.06,P[1]+f[1]*0.25,P[2]+f[2]*0.25]:PL,[1,-0.8,0.2],1.3)}
wpFrame(P,f,u,1);return{show:1,tip}}
// in the hero's weapon frame (M = hero * WF): bow string / arrow, flail chain + ball (world)
function w2HeroExtra(o,w){const S=wpS(o);if(w.kind==='bow'){const ch=S===pl?pl.hon:o.ak===16&&o.hc>0,c=ch?(S===pl?pl.hc:o.hc):0;bwStr(c,ch)}
else if(w.kind==='flail'){const F=WMOD.flail&&WMOD.flail.fl;if(!F)return;const e=[0,0,-F.eye],E=[M[0]*e[0]+M[4]*e[1]+M[8]*e[2]+M[12],M[1]*e[0]+M[5]*e[1]+M[9]*e[2]+M[13],M[2]*e[0]+M[6]*e[1]+M[10]*e[2]+M[14]],sc=Math.hypot(M[0],M[1],M[2]);
 const g=gId;gId=0;mPush();M.set(W2I);flChain(E,flBallAt(o,S,E,sc),sc);mPop();gId=g}}
// ?hero=1&wp=N&act=1: a loop of each attack
function w2HeroTest(o,k,i){const c=(now+i*0.35)%1.6;o.hc=0;o.gf=0;o.bar=0;
if(k==='flail'){if(c<1.1){o.ak=9;o.at=c;o.hc=c/1.1}else{o.ak=10;o.at=c-1.1}}
else if(k==='spear'){o.ak=12+(((now+i*0.35)/0.45|0)%3);o.at=(now+i*0.35)%0.45}
else if(k==='bow'){if(c<1.1){o.ak=16;o.at=c;o.hc=c/1.1}else{o.ak=17;o.at=c-1.1}}
else if(k==='shield'){if(c<0.9){o.ak=19;o.gf=1;o.at=c}else{o.ak=20;o.at=c-0.9}}
else if(k==='staff'){o.ak=c<0.8?22:23;o.at=c%0.8}}
// ================= HUD =================
function w2HUD(w){if((w.kind==='flail'||w.kind==='bow')&&pl.hon){const c=pl.hc,full=c>=1,col=full?(Math.sin(now*16)>0?'#fff':'#ffc21a'):'#ffc21a';gauge(W/2-100,662,230,18,c,col,w.kind==='bow'?'引':'溜');
 if(w.kind==='flail'){const st=flSt(c);txt(['','１段','２段','３段'][st],W/2+150,672,22,st>2?'#e5402b':'#fff',INK,6,'left');ctx.fillStyle=INK;ctx.fillRect(W/2-100+230*0.45,660,3,22)}else if(bwZoneK(pl)>1)txt('矢の中：溜めが速い',W/2+15,634,20,'#59d8ff',INK,6)}
else if(w.kind==='shield'&&(pl.grd||pl.sp===2||pl.jrT>0))txt(pl.jrT>0&&!pl.grd?'ジャスト！':'防御中',W/2,650,26,pl.jrT>0&&!pl.grd?'#ffd91a':'#59d8ff',INK,6);
else if(w.kind==='spear'&&now-(pl.spkT||-9)<0.8)for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(W/2-30+i*30,668,9,0,TAU);ctx.fillStyle=i<=pl.spk?'#ffd91a':'rgba(255,255,255,.5)';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke()}}
// AI (title demo / gacha demo): hold to charge, let go; the shield taps
let w2aiT=0;
function w2Ai(dt){const k=wpW().kind;w2aiT+=dt;if(k==='flail'||k==='bow'){if(pl.hon)inp.fire=pl.hc<(k==='bow'?0.75:1)}else if(k==='shield'&&inp.fire)inp.fire=(w2aiT%0.5)<0.1}
