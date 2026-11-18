'use strict';
// ================= 撃砕の紅拳（グローブ。weapons2.js の後、gacha.js の前に読む） =================
// STORY.md「武器と必殺技」の表。数値は W2.gl（仮の値。遊んで調整する）。モデルは assets/weapon_glove.glb の左右一組
// （wpLoad が右 = md.hand、左 = md.gl に分ける。どちらも原点はこぶしの中、指の付け根の向きが -Z、手の甲が +Y）。
//  タップ = ジャブ（左）→ ジャブ（右）→ ストレート（左。重い・雑魚をのけぞらせて押し出す）。正面の近い敵へ少し踏み込んでから当たる
//           （pl.lgP=2 → wpLunge の最後に glHit）。敵の墨弾も殴って消せる。
//  長押し = ガード（pl.grd）。受けるダメージ ×0.75・移動 ×0.65（hurtPlayer → glGuard、players.js の移動）。
//           0.2 秒以上ガードして離すと、1 秒以内の次の一撃が ×1.5（pl.glB）。
//  必殺「百裂ラッシュ」（spMode 'mode'）= 長押しの間、左右の高速連打（移動 ×0.65、pl.glRH）。１発ごとに拳の斬撃（wfist、貫通しない）が遠くまで飛ぶ。
//           時間切れの瞬間に押していたら、アッパーカットで縦の大きな斬撃（貫通・壁を越える。glSpEnd ← wtSpEnd）。
//  大技（wtree.js）: gl_hook フック（通常攻撃の４段目にフックが加わる。吹き飛んだ敵が後ろの敵を巻き込む）/ gl_combo コンボゲージ
//           （当て続けると威力が最大 ×1.5、被弾か 1.6 秒当てないと途切れる）/ gl_sp ラッシュ延長（wtKill）/ gl_counter カウンター
//           （ガードを押してから 0.25 秒以内の被弾は受けずに反撃）。
// 動作 pl.ak: 25 左ジャブ・26 右ジャブ・27 左ストレート（カウンターも）・28/29 ラッシュの左/右・30 アッパー・31 フック（右）・32 ガード（0.2 秒以上の長押し）。
// 通信: 拳の斬撃は net.q.wx の 'P'（x,y,z,dx,dy,dz,大,傾き）。ガードは ak=32 で他の人に見える。ダメージ軽減は各自の hurtPlayer なので通信は増やしていない。
W2.gl={jab:24,str:52,R:2.7,A:0.95,cool:[0.2,0.2,0.42],combo:0.7,lungeR:4.5,stun:0.6,push:7,guard:0.75,slow:0.65,brk:1.5,brkT:1.0,
 rush:0.085,rushDm:14,fist:30,fistR:30,fistSp:55,upper:420,upperR:40,upperSp:45,
 hook:120,hookPush:14,hookCool:0.5,cnt:0.25,cntDm:80,hitT:1.6,hitStep:0.05,hitMax:0.5,ext:0.4};
const wfist=[],GL_LF=new Float32Array(16);
function glReset(){wfist.length=0;pl.glN=0;pl.glB=0;pl.glQ=0;pl.glHN=0;pl.glRH=0;pl.glRN=0;pl.glRT=0;pl.glP=null}
const glCK=()=>wb('gl_combo')?1+Math.min(W2.gl.hitMax,(pl.glHN|0)*W2.gl.hitStep):1;
const glGrd=()=>!!pl.grd;
// ---- update (w2Update) ----
function gloveUpdate(dt,f){const S=W2.gl;
if(pl.glHN&&now-pl.glHL>S.hitT)glBreak();
if(pl.sp===2){pl.grd=0;pl.gp=0;glRush(dt,f);return}
pl.glRH=0;if(pl.sp===1){pl.grd=0;pl.gp=0;return}
if(f){if(!pl.gp){pl.gp=1;pl.gdT=0;pl.grd=1}
 else{const t0=pl.gdT;pl.gdT+=dt;if(t0<0.2&&pl.gdT>=0.2)wpAct(32)}}
else if(pl.gp){pl.gp=0;pl.grd=0;
 if(pl.gdT<0.2){if(pl.cool<=0)glPunch();else pl.glQ=0.25}// ちょん押し = 殴る（間に合わなければ少しだけ先行入力）
 else{pl.glB=now+S.brkT;wpAct(0)}}
if(pl.glQ>0){pl.glQ-=dt;if(pl.cool<=0&&!pl.gp){pl.glQ=0;glPunch()}}}
// one punch of the jab-jab-straight(-hook with gl_hook) combo: step in towards the nearest enemy in front, the hit lands at the end of the step (glHit)
function glPunch(){const S=W2.gl;if(now-(pl.glL||-9)>S.combo+S.cool[2])pl.glN=0;const k=(pl.glN|0)%(wb('gl_hook')?4:3);pl.glN=(k+1)%(wb('gl_hook')?4:3);pl.glL=now;
pl.cool=k===3?S.hookCool:S.cool[k];wpAct(k===3?31:25+k);snd('whoosh');
const fx=-Math.sin(pl.yaw),fz=-Math.cos(pl.yaw);let best=null,bd=S.lungeR;
for(const e of enemies){if(e.dead||e.st==='spawn'||(e.type==='boss'&&!e.monk))continue;const dx=e.x-pl.x,dz=e.z-pl.z,d=Math.hypot(dx,dz);if(d<bd&&d>0.01&&(dx*fx+dz*fz)/d>0.8){bd=d;best=e}}
let lx=fx,lz=fz,dist=0.5;if(best){const dx=best.x-pl.x,dz=best.z-pl.z,d=Math.hypot(dx,dz);lx=dx/d;lz=dz/d;dist=clamp(d-1.2-(best.r||0.5),0,3)}
const brk=now<pl.glB;pl.glB=0;pl.glP={k,m:brk?S.brk:1};pl.lgx=lx;pl.lgz=lz;pl.lgT=0.06;pl.lgV=pl.frz>0?0:dist/0.06;pl.lgP=2;
if(brk)addText('ガード明け！',W/2,H*0.36,{size:52,st:'fire',life:0.45})}
function glHit(){const S=W2.gl,P=pl.glP||{k:0,m:1};pl.glP=null;if(P.k===3){glHook(P.m);return}const big=P.k===2,pw=w2pw()*P.m*glCK(),dm=(big?S.str:S.jab)*pw;let n=0;
for(const e of enemies){if(e.dead||e.st==='spawn')continue;const s=w2Arc(e,pl.x,pl.z,pl.yaw,S.R,S.A,pl.y-0.6,pl.y+3.4);if(!s)continue;wpDmg(e,dm,s[0],s[1],s[2],{quiet:n>0});n++;
 if(big&&e.type!=='boss'){wpEffect(e,6,S.stun);if(e.type==='bru')wpEffect(e,2);glPush(e,S.push)}}
for(const s of shots)if(!s.dead){const dx=s.x-pl.x,dz=s.z-pl.z,d=Math.hypot(dx,dz);if(d<S.R&&s.y<pl.y+3.4&&(d<0.8||Math.abs(angDiff(Math.atan2(-dx,-dz),pl.yaw))<S.A)){popShot(s);if(isCli())net.q.ps.push(s.id)}}
if(G.mode==='pvp')for(const o of others){if(o.dead)continue;const dx=o.x-pl.x,dz=o.z-pl.z;if(Math.hypot(dx,dz)<S.R&&Math.abs(angDiff(Math.atan2(-dx,-dz),pl.yaw))<S.A)pvHit(o,(big?18:8)*pw,false,o.x,o.y+1.2,o.z)}
if(n){glAddHit();shake(big?0.22:0.1);stopT(big?0.05:0.025)}
addText(pick(big?['ドゴッ！','バゴォッ！']:['バシッ','ビシッ','シュッ']),W*0.6+rnd(-60,80),H*0.58+rnd(-30,30),{size:big?62:46,st:big?'boom':'hit',life:0.3})}
// push an enemy (not a boss) away from the player (the host moves the enemies)
function glPush(e,v){if(isCli()||e.type==='boss')return;const d=Math.hypot(e.x-pl.x,e.z-pl.z)||1;e.kx=(e.x-pl.x)/d*v;e.kz=(e.z-pl.z)/d*v}
// コンボゲージ (gl_combo): one step per punch that hit something
function glAddHit(){if(!wb('gl_combo'))return;const a=pl.glHN|0;pl.glHN=a+1;pl.glHL=now;if(Math.floor(pl.glHN/5)>Math.floor(a/5))addText(pl.glHN+'HIT！',W*0.3+rnd(-30,30),H*0.42,{size:64,st:'fire',life:0.6,rot:-0.08})}
function glBreak(){if(pl.glHN>=5&&wb('gl_combo'))addText('途切れた…',W*0.3,H*0.46,{size:40,st:'hit',life:0.5});pl.glHN=0}
// フック (gl_hook): the 4th hit of the combo; the enemies it sends flying knock down the ones behind them
function glHook(m){const S=W2.gl,lv=2,pw=w2pw()*glCK()*m,dm=S.hook*pw,v=S.hookPush,fx=-Math.sin(pl.yaw),fz=-Math.cos(pl.yaw);
const hit=[];for(const e of enemies){if(e.dead||e.st==='spawn')continue;const s=w2Arc(e,pl.x,pl.z,pl.yaw,S.R+0.4,S.A+0.2,pl.y-0.6,pl.y+3.4);if(!s)continue;wpDmg(e,dm,s[0],s[1],s[2],{quiet:hit.length>0});hit.push(e);
 if(e.type!=='boss'){wpEffect(e,6,0.5+0.3*lv);if(e.type==='bru')wpEffect(e,2);glPush(e,v)}}
const done=new Set(hit);for(const h of hit){if(h.type==='boss')continue;for(const e of enemies){if(e.dead||e.st==='spawn'||done.has(e)||e.type==='boss')continue;const dx=e.x-h.x,dz=e.z-h.z,al=dx*fx+dz*fz;
 if(al>0&&al<2.5+lv&&Math.abs(-dx*fz+dz*fx)<1.6){done.add(e);const s=spheres(e)[0]||[e.x,1,e.z];wpDmg(e,dm*0.5,s[0],s[1],s[2],{quiet:1});wpEffect(e,6,0.6);glPush(e,v*0.7);fxStar(s[0],s[1],s[2],1.4,C.orange,0.1)}}}
if(G.mode==='pvp')for(const o of others){if(o.dead)continue;const dx=o.x-pl.x,dz=o.z-pl.z;if(Math.hypot(dx,dz)<S.R+0.4&&Math.abs(angDiff(Math.atan2(-dx,-dz),pl.yaw))<S.A+0.2)pvHit(o,(12+10*lv)*pw,false,o.x,o.y+1.2,o.z)}
if(hit.length){glAddHit();shake(0.15+0.1*lv);stopT(0.04+0.02*lv)}
addText('ドゴォッ！',W*0.62,H*0.5,{size:76,st:'boom',life:0.45})}
// ---- guard / counter (hurtPlayer): returns the damage that is left (0 = none) ----
function glGuard(d,x,z){if(wpW().kind!=='glove'||pl.dead)return d;const S=W2.gl;
if(pl.grd&&wb('gl_counter')&&pl.gdT<=S.cnt){glCounter(x,z);return 0}
if(pl.glHN)glBreak();
if(pl.grd){if(lim('glg',0.25))addText('ガード',W/2+rnd(-120,120),H*0.45,{size:50,st:'cyan',life:0.3});snd('clank');return d*S.guard}return d}
function glCounter(x,z){const S=W2.gl,pw=w2pw()*glCK();pl.inv=Math.max(pl.inv,0.35);addGauge(6);let yaw=pl.yaw;
if(x!=null){const dx=x-pl.x,dz=z-pl.z;if(Math.hypot(dx,dz)>0.3)yaw=Math.atan2(-dx,-dz)}
wpAct(27);pl.cool=0.3;let n=0;
for(const e of enemies){if(e.dead||e.st==='spawn')continue;const s=w2Arc(e,pl.x,pl.z,yaw,S.R+1,S.A+0.3,pl.y-0.6,pl.y+3.4);if(!s)continue;wpDmg(e,S.cntDm*pw,s[0],s[1],s[2],{quiet:n>0});n++;if(e.type!=='boss'){wpEffect(e,6,S.stun*1.5);glPush(e,S.push*1.4)}}
if(n)glAddHit();fxStar(pl.x-Math.sin(yaw)*1.5,pl.y+1.3,pl.z-Math.cos(yaw)*1.5,2,C.yellow,0.12);
addText('カウンター！',W/2,H*0.34,{size:72,st:'fire',life:0.6,rot:-0.06});snd('crit');flash(0.12);shake(0.25);stopT(0.06)}
// ---- 必殺「百裂ラッシュ」 ----
function glSpStart(){pl.glRN=0;pl.glRT=0;snd('charge');flash(0.35);lines(0.5,'#ffd91a');addText('百裂ラッシュ！',W/2,H*0.15,{size:84,st:'boom',life:0.9,rot:-0.06})}
function glRush(dt,f){pl.glRH=f?1:0;if(!f){pl.glRT=0;return}pl.glRT-=dt*SK.aspd;if(pl.glRT<=0){pl.glRT=Math.max(pl.glRT+W2.gl.rush,0.02);glRushPunch()}if(lim('glx',0.4))lines(0.25,'#ffd91a')}
function glRushPunch(){const S=W2.gl,pw=w2pw()*glCK(),side=(pl.glRN=(pl.glRN|0)+1)&1;wpAct(28+side);
let n=0;for(const e of enemies){if(e.dead||e.st==='spawn')continue;const s=w2Arc(e,pl.x,pl.z,pl.yaw,2.4,S.A,pl.y-0.6,pl.y+3.4);if(!s)continue;wpDmg(e,S.rushDm*SK.spw*pw,s[0],s[1],s[2],{quiet:1});n++}
if(n)glAddHit();
const d=aimDir(),AO=aimOrigin(),rx=Math.cos(pl.yaw),rz=-Math.sin(pl.yaw),o=side?0.3:-0.3,x=AO[0]+d[0]*0.6+rx*o,y=AO[1]-0.15+d[1]*0.6+rnd(-0.12,0.12),z=AO[2]+d[2]*0.6+rz*o,tl=rnd(-0.6,0.6);
wfist.push({own:1,x,y,z,dx:d[0],dy:d[1],dz:d[2],t:0,d:0,R:S.fistR,big:0,tl,hit:null});wxPush(['P',r2(x),r2(y),r2(z),r2(d[0]),r2(d[1]),r2(d[2]),0,r1(tl)]);
if(lim('rushT',0.25))addText(pick(['オラオラ','ドドドド','ババババ']),W*0.6+rnd(-120,120),H*0.5+rnd(-80,60),{size:54,st:'boom',life:0.3});if(lim('rushS',0.07))snd('whoosh')}
// the rush ran out (wtSpEnd): still punching → the uppercut, a tall slash flying ahead through everything
function glSpEnd(){if(wpW().kind!=='glove'||pl.dead)return;pl.glRH=0;if(!inp.fire)return;
const S=W2.gl,fx=-Math.sin(pl.yaw),fz=-Math.cos(pl.yaw),x=pl.x+fx*0.8,y=pl.y+0.2,z=pl.z+fz*0.8;wpAct(30);pl.cool=0.6;
wfist.push({own:1,x,y,z,dx:fx,dy:0,dz:fz,t:0,d:0,R:S.upperR,big:1,tl:0,hit:new Set()});wxPush(['P',r2(x),r2(y),r2(z),r2(fx),0,r2(fz),1,0]);
snd('slash');snd('boom',1.4);flash(0.5);shake(0.7);stopT(0.1);invA=1;addText('ドゴォォォッ！',W/2,H*0.2,{size:100,st:'boom',life:0.9,rot:-0.1})}
// ---- fist slashes (everyone's; only the owner's deal damage) ----
const glCross=(f,d0,x,z,r,wd)=>{const rx=x-f.x,rz=z-f.z,h=Math.hypot(f.dx,f.dz)||1,ux=f.dx/h,uz=f.dz/h,al=rx*ux+rz*uz;return al>d0*h-r&&al<f.d*h+r&&Math.abs(-rx*uz+rz*ux)<wd+r};
function glWorld(dt){const S=W2.gl;
for(let i=wfist.length-1;i>=0;i--){const f=wfist[i],d0=f.d;f.d+=(f.big?S.upperSp:S.fistSp)*dt;f.t+=dt;
 const a=[f.x+f.dx*d0,f.y+f.dy*d0,f.z+f.dz*d0],b=[f.x+f.dx*f.d,f.y+f.dy*f.d,f.z+f.dz*f.d];let end=f.d>=f.R;
 if(!f.big&&!end){const l=f.d-d0;if(rayWorld(a[0],a[1],a[2],f.dx,f.dy,f.dz,l)<l)end=true}
 if(f.own){const pw=w2pw();
  if(f.big){for(const e of enemies){if(e.dead||e.st==='spawn'||f.hit.has(e))continue;for(const s of spheres(e))if(s[1]-s[3]<f.y+6&&glCross(f,d0,s[0],s[2],s[3],1.6)){f.hit.add(e);wpDmg(e,S.upper*SK.spw*pw,s[0],s[1],s[2],{fx:f.x,fz:f.z});if(e.type!=='boss'){wpEffect(e,6,1);if(e.type==='bru')wpEffect(e,2)}break}}
   for(const q of shots)if(!q.dead&&glCross(f,d0,q.x,q.z,q.r,2)){popShot(q);if(isCli())net.q.ps.push(q.id)}
   if(G.mode==='pvp')for(const o of others)if(!o.dead&&!f.hit.has(o)&&glCross(f,d0,o.x,o.z,0.6,1.6)){f.hit.add(o);pvHit(o,60*pw,false,o.x,o.y+1.1,o.z)}}
  else{for(const e of enemies){if(e.dead||e.st==='spawn')continue;let hs=null;for(const s of spheres(e))if(w2Seg3(a,b,s,0.6)){hs=s;break}
    if(hs){wpDmg(e,S.fist*SK.spw*pw*glCK(),hs[0],hs[1],hs[2],{quiet:!lim('glfh',0.1),fx:f.x,fz:f.z});fxStar(hs[0],hs[1],hs[2],1.2,C.orange,0.08);end=true;break}}
   if(!end)for(const q of shots)if(!q.dead&&w2Seg3(a,b,[q.x,q.y,q.z,q.r],0.6)){popShot(q);if(isCli())net.q.ps.push(q.id);end=true;break}
   if(!end&&G.mode==='pvp')for(const o of others)if(!o.dead&&w2Seg3(a,b,[o.x,o.y+1.1,o.z,0.6],0.5)){pvHit(o,5*pw,false,o.x,o.y+1.1,o.z);end=true;break}}}
 else if(!f.big)for(const e of enemies){if(e.dead||e.st==='spawn')continue;for(const s of spheres(e))if(w2Seg3(a,b,s,0.6)){end=true;break}if(end)break}// others' fists stop on the first enemy too (look only)
 if(end){if(!f.big)fxSparks(b[0],b[1],b[2],3,4,C.orange);wfist.splice(i,1)}}}
// another player's fist slash ('P')
function glFistFx(a){const S=W2.gl;wfist.push({own:0,x:a[1],y:a[2],z:a[3],dx:a[4],dy:a[5],dz:a[6],big:a[7]|0,tl:a[8]||0,t:0,d:0,R:a[7]?S.upperR:S.fistR,hit:new Set()});if(a[7]){snd('slash');snd('boom',1)}}
function glOtherAct(o,ak){const v=sndVol;sndVol=v*clamp(1.2-Math.hypot(o.x-pl.x,o.z-pl.z)/30,0.15,0.7);if(ak!==32&&(ak<28||ak>29||lim('glo'+o.slot,0.15)))snd(ak===30?'slash':'whoosh');sndVol=v}
// ---- draw ----
// a fist slash: a small red crescent with a white edge facing its flight (tilted a little each punch); the uppercut is a tall standing one
function glDraw(){const NF=F_UNLIT|F_NOCAST;
for(const f of wfist){const P=[f.x+f.dx*f.d,f.y+f.dy*f.d,f.z+f.dz*f.d],yaw=Math.atan2(-f.dx,-f.dz);
 if(f.big){const sc=8*Math.min(1,0.35+f.t*5);mPush();mT(P[0]-f.dx*sc*0.5,f.y+2.8,P[2]-f.dz*sc*0.5);mRY(yaw);mRZ(PI/2);mS(sc*0.8,1,sc);emit(SLASH,C.white,0,0,NF,0);mT(0,0.012,0.03);mS(0.9,1,0.9);emit(SLASH,C.red,0,0,NF,0);mPop();
  bill(STAR,P[0],f.y+2.8,P[2],1.8,now*20,C.white,NF);bill(BURST,P[0],f.y+1,P[2],1.4,now*25,C.orange,NF);continue}
 const g=Math.min(1,0.35+f.d/6),sc=1.7*g,pit=Math.asin(clamp(f.dy,-1,1));
 mPush();mT(P[0]-f.dx*sc*0.5,P[1]-f.dy*sc*0.5,P[2]-f.dz*sc*0.5);mRY(yaw);mRX(pit);mRZ(f.tl);mS(sc,1,sc);emit(SLASH,C.white,0,0,NF,0);mT(0,0.012,0.03);mS(0.85,1,0.85);emit(SLASH,C.red,0,0,NF,0);mPop();
 bill(BURST,P[0],P[1],P[2],0.42*g,now*30+f.tl*9,C.orange,NF)}}
// the left glove under the current matrix (the right one is the weapon's hand set, wpModel)
function glModelL(){const md=WMOD.glove;if(!md||!md.gl)return;for(const it of md.gl){mPush();mApply(it.m);emit(it.pi,it.c,it.mat,it.gloss,it.fl,it.rim);mPop()}}
// poses of one glove (side 1 = right, 0 = left) for the action ak at time at; base = idle or guard (also during the rush).
// first person: [x,y,z, ry,rx,rz] in camera space; hero: the hand target in the aim frame (hero space, right = -X)
const GLV={RI:[0.21,-0.22,-0.45,0.22,0.05,-0.25],LI:[-0.21,-0.2,-0.48,-0.22,0.05,0.25],RG:[0.1,-0.15,-0.36,0.15,0.95,-0.15],LG:[-0.1,-0.14,-0.36,-0.15,0.95,0.15],
 RJ:[0.06,-0.14,-0.62,0.05,0.05,-0.5],LJ:[-0.06,-0.13,-0.62,-0.05,0.05,0.5],LS:[-0.03,-0.11,-0.7,0,0.05,1.1],
 RU0:[0.12,-0.42,-0.42,0,-0.4,0],RU1:[0.06,0.05,-0.55,0,1.2,0],RH0:[0.46,-0.16,-0.3,-0.9,0,-1.2],RH1:[-0.12,-0.1,-0.58,0.7,0,-1.4]},
GLH={RI:[-0.2,-0.12,0.38],LI:[0.2,-0.1,0.42],RG:[-0.14,0.05,0.3],LG:[0.14,0.06,0.3],RJ:[-0.06,-0.05,0.62],LJ:[0.06,-0.05,0.62],LS:[0.03,-0.03,0.7],
 RU0:[-0.16,-0.4,0.34],RU1:[-0.06,0.25,0.42],RH0:[-0.5,-0.05,0.18],RH1:[0.08,-0.05,0.5]};
function glPose(T,side,ak,at,grd){const base=side?(grd?T.RG:T.RI):grd?T.LG:T.LI,pu=(E,t1,t2,t3)=>kf([[0,base],[t1,E],[t2,E],[t3,base]],at);
if(!side){if(ak===25)return pu(T.LJ,0.05,0.1,0.22);if(ak===27)return pu(T.LS,0.07,0.15,0.36);if(ak===28)return pu(T.LJ,0.03,0.05,0.17)}
else{if(ak===26)return pu(T.RJ,0.05,0.1,0.22);if(ak===29)return pu(T.RJ,0.03,0.05,0.17);if(ak===30)return kf([[0,T.RU0],[0.12,T.RU1],[0.4,T.RU1],[0.7,base]],at);if(ak===31)return kf([[0,T.RH0],[0.1,T.RH1],[0.25,T.RH1],[0.5,base]],at)}
return base}
const GL_VS=0.55;
function glView(ak,at){const v=glPose(GLV,1,ak,at,glGrd());mT(v[0],v[1],v[2]);mRY(v[3]);mRX(v[4]);mRZ(v[5]);return{s:GL_VS,tip:[0,0,-0.18]}}
function glViewL(s){const bx=Math.sin(pl.bob)*0.012*pl.moving,by=Math.abs(Math.cos(pl.bob))*0.014*pl.moving,dip=pl.gunDip+(pl.dead?Math.min(1,pl.deadT*2):0);
M.set(CAMW);mT(bx,-by-dip*0.3+Math.sin(now*2)*0.006,0);const v=glPose(GLV,0,pl.ak|0,pl.at,glGrd());mT(v[0],v[1],v[2]);mRY(v[3]);mRX(v[4]);mRZ(v[5]);mS(s,s,s);glModelL()}
function glHeroBody(o,at,ak){let tw=0;
if(ak===25||ak===28)tw=kf([[0,0],[0.05,0.22],[0.1,0.22],[0.22,0]],at);else if(ak===26||ak===29)tw=kf([[0,0],[0.05,-0.22],[0.1,-0.22],[0.22,0]],at);
else if(ak===27)tw=kf([[0,0],[0.07,0.38],[0.15,0.38],[0.36,0]],at);else if(ak===31)tw=kf([[0,-0.45],[0.1,0.4],[0.25,0.4],[0.5,0]],at);
else if(ak===30){const b=kf([[0,0.2],[0.12,-0.15],[0.4,-0.15],[0.7,0]],at);hRot('spine',HX,b*0.6);hRot('chest',HX,b*0.4)}
if(tw){hRot('spine',HY,tw*0.5);hRot('chest',HY,tw*0.5)}}
const GL_HS=1.0;
// both arms (IK) and both glove frames: the right one in WF, the left one in GL_LF (drawn by wpHeroDraw → glModelL)
function glHeroArms(o,A,pit,at,ak){const S=wpS(o),grd=S===pl?glGrd():ak===32,R=m3axis(HX,-pit),at3=p=>{const r=m3v(R,p);return[A[0]+r[0],A[1]+r[1],A[2]+r[2]]},Hh=HERO;
heroArm('R',at3(glPose(GLH,1,ak,at,grd)),[-1,-0.6,-0.2],-1.2);heroArm('L',at3(glPose(GLH,0,ak,at,grd)),[1,-0.6,-0.2],1.3);
const F=m3v(R,[0,0,1]),frame=sd=>{const h=Hh.GT[Hh.bi['hand_'+sd]],e=Hh.GT[Hh.bi['forearm_'+sd]],a=v3n([h[0]-e[0],h[1]-e[1],h[2]-e[2]]),f=v3n([a[0]+F[0]*0.9,a[1]+F[1]*0.9,a[2]+F[2]*0.9]),k=sat((f[1]-0.3)/0.5);// the forearm, turned towards the front (knuckles ahead)
 
 wpFrame([h[0]+f[0]*0.07*GL_HS,h[1]+f[1]*0.07*GL_HS,h[2]+f[2]*0.07*GL_HS],f,[0,1-k,k],GL_HS)};
frame('L');GL_LF.set(WF);frame('R');return{show:1,tip:[0,0,-0.18],L:GL_LF}}
// ---- HUD ----
function glHUD(){const S=W2.gl;
if(pl.sp===2)txt(pl.glRH?'離さずに！ 最後にアッパー':'長押しで連打！',W/2,650,pl.glRH?22:26,pl.glRH?'#fff':'#ffd91a',INK,6);
else if(pl.grd)txt('ガード',W/2,650,26,'#59d8ff',INK,6);
else if(now<pl.glB)txt('ガード明け ×'+S.brk,W/2,650,24,'#ffd91a',INK,6);
if(wb('gl_combo')&&pl.glHN>0){txt(pl.glHN+' HIT',W/2+190,600,34,'#ffd91a',INK,7,'left');txt('×'+glCK().toFixed(2),W/2+196,632,20,'#fff',INK,5,'left')}}
// 詳細 (equip screen)
function glStats(w,gp){const S=W2.gl;return[['ジャブ',S.jab+'（２発）・前方 '+S.R+' m'],['ストレート',S.str+'・雑魚はのけぞって押し出される'],['踏み込み',S.lungeR+' m 以内の正面の敵へ'],['墨弾','殴って消せる'],
['ガード','受けるダメージ ×'+S.guard+'・移動 ×'+S.slow],['ガード明け','離して '+S.brkT+' 秒以内の一撃 ×'+S.brk],gp,['','必殺 '+w.sp],['時間',w.spd+' 秒間・長押しで連打（毎秒 約 '+Math.round(1/S.rush)+' 発）'],
['拳の斬撃',S.fist+'・'+S.fistR+' m 先まで・貫通しない'],['アッパー','時間切れの瞬間に押していると '+S.upper+'（貫通）']]}
