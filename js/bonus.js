'use strict';
// ================= 番外編（ボーナスステージ） =================
// WAVESET の波に {bonus:1} と書くと、その波は制限時間つきのボーナスステージになる（今は6面「墨の池」の最終話シロヌキの直前）。
// 出てくるのは最初の雑魚「墨鬼」(imp) の金色版「金の墨鬼」(FOE.au、通信の型は 'a') だけ。体当たりはせず、プレイヤーから逃げ回る。
// 墨鬼より少し硬く、足が速く、次から次へと湧く。倒すと経験値が特大（G.gk＝倒した数。skExp が BON.xp ずつ足す）。
// 時間切れで残った金の墨鬼は逃げて消え（経験値なし）、次の波へ進む。ホストが進行を計算し、G.gk と G.bonT はスナップショットの g で送る。
// ---- 数値（目安。遊んで調整する） ----
// dur 制限時間(秒) / hp 体力（墨鬼は40。ここに人数・ステージの倍率が掛かる） / spd 逃げる速さ m/s（主人公は6.6。ステージの速さの倍率が掛かる）
// see この距離より近いプレイヤーから逃げる / cap 同時に出ている数（＋人数ごとに capN） / every 湧く間隔(秒) / first 始まりにまとめて出す数
// xp 1体の経験値（墨鬼は 10×ステージの倍率≒24。極・スキルの経験値倍率も掛かる） / sc 点数 / g 必殺ゲージ
const BON={dur:30,hp:62,spd:7.6,see:15,cap:10,capN:3,every:0.45,first:6,xp:250,sc:1000,g:6};
Object.assign(C,{goldB:hex(0xffc21f),goldD:hex(0xc98a10),goldL:hex(0xfff0a0)});
STY.gold={halo:'#fff',ink:'#16121f',f0:'#fffbd0',f1:'#f0a800'};
const bonusOn=()=>G.mode!=='pvp'&&G.wave>=0&&!!(WAVESET[G.stage]&&WAVESET[G.stage][G.wave]&&WAVESET[G.stage][G.wave].bonus);
const bonXp=()=>Math.round(BON.xp*(G.ex?EXK.xp:1)*(SK.xpk||1));
// ---- 金の墨鬼 ----
FOE.au={sc:BON.sc,g:BON.g,
 init(e){e.hp=BON.hp;e.r=0.55;e.sc=rnd(0.95,1.15);e.spd=BON.spd;e.wd=rnd(0,TAU);e.hx=0;e.hz=0;e.jt=rnd(0.8,1.6);e.bt=0},
 upd(e,dt,T,dx,dz,d,wy){
  if(e.st==='esc'){if(e.stT>0.6)e.dead=true;return}// 時間切れ: その場で逃げて消える（kill しない＝経験値なし）
  let fx=0,fz=0,near=0;
  for(const p of allP()){const ax=e.x-p.x,az=e.z-p.z,l=Math.hypot(ax,az)||0.01;if(l<BON.see){const w=Math.pow((BON.see-l)/BON.see,2)*2+0.2;fx+=ax/l*w;fz+=az/l*w;near=Math.max(near,1-l/BON.see)}}
  e.wd+=rnd(-2,2)*dt;fx+=Math.sin(e.wd)*0.45;fz+=Math.cos(e.wd)*0.45;// ふらふら
  const m=4.5,wl=(v,a)=>v>a?(v-a)/m*2.2:0;// 壁・船べりからは離れる（追い詰められたら壁沿いに抜ける）
  fx-=wl(e.x,BX-m);fx+=wl(-e.x,BX-m);fz-=wl(e.z,BZ1-m);fz+=wl(-e.z,-BZ0-m);
  const fl=Math.hypot(fx,fz)||1,k=Math.min(1,dt*6);e.hx+=(fx/fl-e.hx)*k;e.hz+=(fz/fl-e.hz)*k;
  // 近くにプレイヤーがいると全速力。ときどき横っ跳びで向きを変える
  e.jt-=dt;if(e.jt<=0&&near>0.2){e.jt=rnd(0.9,1.8);e.bt=0.3;const s=Math.random()<.5?-1:1;e.bx=e.hz*s;e.bz=-e.hx*s;if(lim('auj',0.5))ev('txt','サッ',r1(e.x),2.2,r1(e.z),40,'gold')}
  const sp=e.spd*(near>0?0.7+0.3*Math.min(1,near*3):0.4);let mx=e.hx,mz=e.hz,sk=1;if(e.bt>0){e.bt-=dt;mx=e.hx*0.4+e.bx;mz=e.hz*0.4+e.bz;sk=1.6}
  const ml=Math.hypot(mx,mz)||1;e.x+=mx/ml*sp*sk*dt;e.z+=mz/ml*sp*sk*dt;e.yaw+=angDiff(Math.atan2(mx,mz),e.yaw)*Math.min(1,dt*10)},
 sph(e){return[[e.x,e.y+0.62*e.sc,e.z,0.68*e.sc,1]]},
 ctr(e){return[e.x,0.62*e.sc,e.z,0.8]},
 die(e){const y=0.62*(e.sc||1);
  if(e.st==='esc'){fxSmoke(e.x,y,e.z,4,0.8,C.smoke,2);return}
  if(!isCli())G.gk=(G.gk|0)+1;
  fxStar(e.x,y,e.z,3.4,C.white,0.12);fxBall(e.x,y,e.z,2.1,C.gold,0.3);fxDebris(e.x,y,e.z,14,9,C.gold,0.26);fxRing(e.x,0.1,e.z,4,C.goldL,0.3);for(let i=0;i<6;i++)fxOrb(e.x,y,e.z);
  if(!pl.sp||lim('spx',0.5))sideText(pick(['キラーン！','ピカーン！','ジャラッ！']),e,{size:58,st:'gold',life:0.5});
  sfxAt('経験値＋'+bonXp(),e.x,y+1.6,e.z,{size:44,st:'gold',life:0.9});snd('kill');snd('item',0.6);stopT(0.05);shake(0.2)},
 draw(e){if(e.st==='esc'){const k=1-sat(e.stT/0.6),s0=e.sc;e.sc=s0*Math.max(0.01,k);drawImp(e);e.sc=s0;if(lim('aue'+e.id,0.1))fxSmoke(e.x,0.4,e.z,1,0.7,C.smoke,1);return}
  drawImp(e);if(lim('aus'+e.id,0.22))fxStar(e.x+rnd(-0.6,0.6),rnd(0.4,1.4)*e.sc,e.z+rnd(-0.6,0.6),0.55,C.white,0.12)}};
// ---- 進行（ホスト） ----
function bonusStart(){G.bonT=BON.dur;G.bonS=0;G.bonE=0;ev('bonS');for(let i=0;i<BON.first;i++)spawnNear('au')}
function bonusUpd(dt){const au=enemies.filter(e=>!e.dead&&e.type==='au');
 if(G.bonT>0){G.bonT=Math.max(0,G.bonT-dt);G.bonS-=dt;if(G.bonS<=0&&au.length<BON.cap+BON.capN*(G.np-1)){spawnNear('au');G.bonS=BON.every}
  if(G.bonT<=0){for(const e of au){e.st='esc';e.stT=0;e.hp=1e9}ev('bonE',G.gk|0)}return}
 if(enemies.length===0){G.clearT=2.8;ev('heal');ev('ban','番外編 終了！','体力回復 ＋30');ev('say','次で','最後だ…!',0)}}
Object.assign(FXE,{
 bonS(){addText('ボーナスステージ!!',W/2,H*0.3,{size:100,st:'gold',life:1.4});addText('金の墨鬼を狩りつくせ！',W/2,H*0.42,{size:48,st:'gold',life:1.4});snd('item');flash(0.15)},
 bonE(n){addText('そこまで!!',W/2,H*0.3,{size:110,st:'boom',life:1.3});addText('金の墨鬼 '+n+'体  経験値＋'+n*bonXp(),W/2,H*0.43,{size:46,st:'gold',life:1.6});snd('gong');shake(0.3)}});
// ---- HUD: 残り時間と倒した数（各端末） ----
let bonTick=-1;
function bonHUD(){if(!bonusOn())return;const t=Math.max(0,G.bonT||0),s=Math.ceil(t),hot=t>0&&t<=5;
 if(hot&&s!==bonTick){bonTick=s;snd('ui')}
 ctx.save();ctx.translate(W/2,52);ctx.rotate(-0.02);const p=hot?1+0.15*Math.max(0,1-(Math.ceil(t)-t)*3):1;
 para(-150,-36,300,72,14);ctx.fillStyle=INK;ctx.fill();para(-146,-32,292,64,12);ctx.fillStyle='#ffd91a';ctx.fill();
 txt('ボーナス',-82,-1,26,INK,null,0,'center');ctx.save();ctx.translate(62,0);ctx.scale(p,p);txt(t>0?String(s):'終了',0,0,t>0?44:34,hot?'#ff3b30':'#fff',INK,8,'center');ctx.restore();
 if(t>0)txt('秒',122,10,18,INK,null,0,'center');ctx.restore();
 txt('金の墨鬼 ×'+(G.gk|0),W/2,112,26,'#ffe27a',INK,7,'center')}
