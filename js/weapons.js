'use strict';
// ================= WEAPONS 武器 (STORY.md「武器と必殺技」) =================
// Seven weapons: 妖弾銃 (the standard, box-built gun of old) + six models (blender/weapons.blend -> assets/weapon_*.glb).
// One weapon is equipped (装備画面: main menu / lobby →「装備」, saved in localStorage koma_wpn) and used for the whole stage, versus too.
// The six come only from the weapon gacha (gacha.js → wsGive(id), WS.own = {weaponId:1}), or all at once while the developer 超強化 switch (DEV) is on.
// Gacha duplicates raise the 必殺 level (1-10, WS.lv / WS.up, applied with 「強化」 on the equip screen): special power and length ×SPLV (wpApply).
// Each weapon has its own normal attack and its own special (必殺); the gauge (妖珠) is shared. Skills: damage / special power /
// gauge work for every weapon; magazine / reload / fire rate only for the ones with ammo (wpApply scales SK after skApply).
//  連珠銃 32発・威力24・毎秒7発・装填0.8秒・反動なし / 珠時雨: 5 s of free ammo, double rate, homing aim.
//  散華砲 8 pellets in a fan (closer = stronger), staggers 鎧鬼, gauge x1.5 / 大散華: 36 pellets through walls and enemies.
//  氷魄砲 hold = piercing beam, heat gauge, overheat → forced cooling / 妖光・氷牢: 8 s ice beam, frozen 3 s (x1.5 damage), bosses slowed.
//  祓い刀 no ammo, lunge slash, cuts enemy ink shots / 一閃・天断ち: a huge flying slash (reaches the boss).
//  火消しの大槌 hold to charge, release = slam + shock ring in front (wider when charged), staggers 鎧鬼 / 駒砕き: leap + slam, the screen
//    cracks into manga panels, everything within 16 m is hit.
//  焙烙火矢 throw (3 held, each one comes back 4 s after it was thrown), explodes on enemies / bosses / ground, gauge x1.5 / 大玉花火: giant bomb, the fire burns 6 s
//    (on the boss if it hit the boss). Never hurts the thrower or friends.
// Network: damage is still self-reported (damage() → net.dacc). The player message also carries the weapon index, an action counter
// + kind (others replay the swing / throw pose and slash trails), the hammer charge and rail-beam bits. Small visual-only events
// (net.q.wx: bombs, the sword wave, hammer slams) are replayed by the others; freeze / stun / slow go to the host (net.q.ef), which runs the enemies.
const WPN=[
{id:'gun',name:'妖弾銃',type:'標準',kind:'gun',btn:'撃',file:null,col:'#59d8ff',bg:[.86,.95,1],ammo:1,mag:16,dmg:20,cool:0.15,rel:1,kick:0.03,shk:0.07,snd:'shot',g:1,sp:'墨龍砲',spd:0.8,spMode:'beam',muz:[0,0.045,-0.63],
 d:['16発の連射銃。撃ち切ったら装填','いちばん扱いやすい標準の武器'],s:'正面に太い光線を一直線に放つ'},
{id:'rifle',name:'連珠銃',type:'アサルト',kind:'gun',btn:'撃',file:'weapon_rifle',col:'#3f6fd8',bg:[.84,.88,1],ammo:1,mag:32,dmg:24,cool:1/7,rel:0.8,kick:0.006,shk:0.03,snd:'rshot',g:1,sp:'珠時雨',spd:5,spMode:'buff',muz:[0,0.03,-0.6],fore:0.27,
 d:['32発・威力24の速射銃','妖弾銃の上位版。反動がなく装填も速い'],s:'数秒間、弾が減らずに連射２倍。弾が敵を追う'},
{id:'shotgun',name:'散華砲',type:'ショットガン',kind:'gun',btn:'撃',file:'weapon_shotgun',col:'#ff7aa8',bg:[1,.9,.93],ammo:1,mag:6,dmg:15,pel:8,cool:0.72,rel:1.5,kick:0.09,shk:0.22,snd:'sgun',g:1.5,sp:'大散華',spd:0.5,spMode:'once',muz:[0,0.055,-0.56],fore:0.3,
 d:['扇状に散弾を撃つ。近いほど強い','鎧鬼をのけぞらせる。必殺ゲージが早くたまる'],s:'超広範囲の散弾。全弾が壁も敵も貫通する'},
{id:'rail',name:'氷魄砲',type:'レールガン',kind:'rail',btn:'撃',file:'weapon_railgun',col:'#5fd0ff',bg:[.85,.96,1],ammo:0,g:1,sp:'妖光・氷牢',spd:4,spMode:'mode',muz:[0,0.05,-0.87],fore:0.33,
 d:['長押しで、敵をつらぬく光線を連射','熱がたまりきると、しばらく冷却'],s:'４秒間、凍結光線を出しっぱなし。凍った敵は被ダメ1.5倍'},
{id:'katana',name:'祓い刀',type:'刀',kind:'katana',btn:'斬',file:'weapon_katana',col:'#2f6fd8',bg:[.88,.92,1],ammo:0,g:1,sp:'一閃・天断ち',spd:0.6,spMode:'once',
 d:['弾切れなし。踏み込んで斬る','敵の墨弾も斬って消せる'],s:'画面を横切る巨大な斬撃。ボスにも届く'},
{id:'hammer',name:'火消しの大槌',type:'大槌',kind:'hammer',btn:'叩',file:'weapon_hammer',col:'#f4b82e',bg:[1,.95,.82],ammo:0,g:1,sp:'駒砕き',spd:1.0,spMode:'once',
 d:['振り下ろして正面に衝撃波','長押しで溜めると範囲が広がる。鎧鬼を怯ませる'],s:'画面がコマ割りに割れ、広い範囲の敵を打ち砕く'},
{id:'bomb',name:'焙烙火矢',type:'焙烙玉',kind:'bomb',btn:'投',file:'weapon_bomb',col:'#ff6a3d',bg:[1,.9,.84],ammo:0,g:1.5,sp:'大玉花火',spd:0.6,spMode:'once',
 d:['投げて爆発。３個まで持ち、投げた玉は1個ずつ4秒で戻る','ボスにも当たる。必殺ゲージが早くたまる'],s:'特大の爆発のあと、炎が約６秒燃え残る'},
// 8-12: weapons2.js (W2 = numbers)
{id:'flail',name:'鬼棘の流星鎚',type:'鎖鉄球',kind:'flail',btn:'投',file:'weapon_flail',col:'#3b4fc4',bg:[.86,.88,1],ammo:0,g:1,sp:'流星乱れ打ち',spd:0.3,spMode:'once',
 d:['長押しで頭上で振り回し、離すと前へ投げる','溜めるほど強く遠くへ（３段階・最大 40 m）'],s:'まわりに４回叩きつけ、最後に前方遠くへ。そのあと攻撃力アップ'},
{id:'spear',name:'雷鳴の槍',type:'槍',kind:'spear',btn:'突',file:'weapon_spear',col:'#e0a21a',bg:[1,.97,.84],ammo:0,g:1,sp:'雷槍・千鳥',spd:6,spMode:'mode',
 d:['３連続の突き。突きごとに小さな斬撃が飛ぶ','当たった敵は雷でしびれて止まる（ボスは短く）'],s:'しばらく長い突きに。斬撃が遠くまで飛び、何体でも貫く'},
{id:'bow',name:'波雲の長弓',type:'弓',kind:'bow',btn:'射',file:'weapon_bow',col:'#2a3f8f',bg:[.86,.92,1],ammo:0,g:1,sp:'波雲・矢時雨',spd:0.5,spMode:'once',
 d:['長押しで溜めて、離して射る（1.5 秒で威力３倍）','溜めるほど貫通する敵が増える（最大５体）'],s:'前方の広い範囲に矢の雨。残った矢の中では溜めが速い'},
{id:'shield',name:'城壁の大楯',type:'大楯',kind:'shield',btn:'盾',file:'weapon_shield',col:'#c9a227',bg:[.93,.95,1],ammo:0,g:1,sp:'城壁結界',spd:8,spMode:'mode',
 d:['タップで盾で押す。長押しで正面を防御（移動は遅い）','当たる直前に防御すると弾をはね返す'],s:'前に水色のバリアを張り、敵の弾を防ぐ（約８秒）'},
{id:'staff',name:'護符の錫杖',type:'杖',kind:'staff',btn:'祈',file:'weapon_staff',col:'#2fb38a',bg:[.88,1,.93],ammo:0,g:1,sp:'反魂の祈り',spd:0.3,spMode:'once',
 d:['護符の玉を飛ばす。味方に当たると回復＋短い加護、敵にはダメージ','玉は味方を少し追う。近くの敵は杖で殴る'],s:'味方全員を回復し、ダウンした味方を復活。しばらくダメージ軽減＋攻撃力アップ'}];
const WB_RF=4,RAIL_DM=9,RAIL_ICE=20;// bomb: seconds from its own throw until that bomb is back / 氷魄砲 damage per 0.06 s tick (normal, 氷牢)
// ---- ownership / equip (localStorage koma_wpn: {eq: weapon id, got: 1 once the six were obtained}) ----
const WS={eq:'gun',own:{}};
try{const s=JSON.parse(localStorage.getItem('koma_wpn')||'null');if(s)Object.assign(WS,s)}catch(e){}
function wsSave(){try{localStorage.setItem('koma_wpn',JSON.stringify(WS))}catch(e){}}
// 凸（必殺レベル）1-10（WLV）: WS.lv[id] = level in use, WS.up[id] = level-ups waiting (gacha duplicates, applied by hand with 「強化」 on the equip screen)
if(!WS.lv||typeof WS.lv!=='object')WS.lv={};if(!WS.up||typeof WS.up!=='object')WS.up={};
const WLV=10;// 凸の最大。Lv5 と Lv10 で大きく強くなる（SPLV の差が大きい所）
// [必殺の威力, 必殺の時間, 通常攻撃の威力] per level。Lv5・Lv10 が大幅強化
const SPLV=[[1,1,1],[1.1,1.04,1.03],[1.2,1.08,1.06],[1.3,1.12,1.09],[1.7,1.3,1.2],[1.8,1.34,1.23],[1.9,1.38,1.26],[2,1.42,1.29],[2.1,1.46,1.32],[2.8,1.7,1.5]],
SPLV_T=SPLV.map((L,i)=>i?'威力×'+L[0]+'・時間×'+L[1]+'・通常×'+L[2]:'標準'),SPLV_BIG=l=>l===5||l===10;
const wpLv=id=>WS.own[id]?clamp(WS.lv[id]|0||1,1,WLV):1,wpLvAll=id=>WS.own[id]?Math.min(WLV,wpLv(id)+(WS.up[id]|0)):0;
// the gacha (gacha.js) hands out a weapon with wsGive(id): 'new' (first one), 'up' (duplicate → one more waiting level-up), 'max' (already Lv10 → the gacha gives skill points instead)
function wsGive(id){if(id==='gun')return'';if(!WS.own[id]){WS.own[id]=1;WS.lv[id]=1;wsSave();return'new'}if(wpLvAll(id)>=WLV)return'max';WS.up[id]=(WS.up[id]|0)+1;wsSave();return'up'}
function wpLvUp(id){if(!WS.own[id]||!((WS.up[id]|0)>0)||wpLv(id)>=WLV)return false;WS.lv[id]=wpLv(id)+1;WS.up[id]--;wsSave();return true}
const wpIdx=id=>Math.max(0,WPN.findIndex(w=>w.id===id)),wpOwn=i=>i===0||!!DEV||!!WS.own[WPN[i].id],wpW=()=>WPN[pl.wp|0]||WPN[0];
function wpCur(){if(G.demoOn)return gaDemoWp!=null?gaDemoWp:0;const i=wpIdx(WS.eq);return wpOwn(i)?i:0}
// weapon numbers on top of the skills (called at the end of skApply, pl.wp is set first in resetPlayer)
function wpApply(s){const w=WPN[pl.wp|0];if(!w)return;if(w.ammo){s.mag=Math.max(2,Math.round(s.mag*w.mag/16));s.rel*=w.rel;s.cool*=w.cool/0.125}s.gauge*=w.g;const L=SPLV[(w.id==='gun'?1:wpLv(w.id))-1];s.spw*=L[0];s.beam*=L[1];s.atk*=L[2]}
const spDur=()=>wpW().spd*SK.beam/0.8;// 必殺持続 / 極み stretch every timed special the same way
const spLock=()=>pl.sp===1||(pl.sp===2&&wpW().spMode==='beam');// slow turning / walking while charging or firing the dragon beam
function wpAct(k){pl.ak=k;pl.at=0;pl.an=((pl.an|0)+1)%250}
function wxPush(a){if(net.on)(net.q.wx||(net.q.wx=[])).push(a)}
// ---- models ----
const WMOD={},WTMP=m4(),WF=m4();
for(const w of WPN)if(w.file)loadGlbBuf('assets/'+w.file+'.glb').then(b=>wpLoad(w,b)).catch(e=>console.warn('[weapon] assets/'+w.file+'.glb failed to load:',e));
function wpLoad(w,buf){const g=glbParse(buf),J=g.j,geo=new Map(),items=[],mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
const primOf=p=>{const key=p.attributes.POSITION+'/'+p.attributes.NORMAL+'/'+p.indices;if(geo.has(key))return geo.get(key);
 const P=glbAcc(g,p.attributes.POSITION).v,N=glbAcc(g,p.attributes.NORMAL).v,I=glbAcc(g,p.indices).v,mb=new MB(),v=k=>[P[k*3],P[k*3+1],P[k*3+2]],n=k=>[N[k*3],N[k*3+1],N[k*3+2]];
 for(let t=0;t<I.length;t+=3)mb.tri(v(I[t]),v(I[t+1]),v(I[t+2]),n(I[t]),n(I[t+1]),n(I[t+2]));const pi=addPrim(mb);geo.set(key,pi);return pi};
const walk=(ni,par,pn)=>{const n=J.nodes[ni],m=m4mul(m4(),par,glbNodeMat(n));
 if(n.mesh!==undefined)for(const p of J.meshes[n.mesh].primitives){const ma=(J.materials||[])[p.material]||{},x=ma.extras||{},bc=(ma.pbrMetallicRoughness||{}).baseColorFactor||[1,1,1,1],a=J.accessors[p.attributes.POSITION];
  items.push({pi:primOf(p),m,c:[bc[0],bc[1],bc[2]],mat:x.kb_mat|0,gloss:+x.kb_gloss||0,fl:x.kb_flags|0,rim:+x.kb_rim||0,nm:n.name||'',pn:pn||'',amn:a.min,amx:a.max});
  if(a.min&&a.max)for(let k=0;k<8;k++){const q=[k&1?a.max[0]:a.min[0],k&2?a.max[1]:a.min[1],k&4?a.max[2]:a.min[2]];for(let c=0;c<3;c++){const v=m[c]*q[0]+m[4+c]*q[1]+m[8+c]*q[2]+m[12+c];if(v<mn[c])mn[c]=v;if(v>mx[c])mx[c]=v}}}
 for(const c of n.children||[])walk(c,m,n.name)};
const I4=m4();I4[0]=I4[5]=I4[10]=I4[15]=1;for(const ni of J.scenes[J.scene||0].nodes)walk(ni,I4);
const md=WMOD[w.id]={items,mn,mx};
// 流星鎚: handle only in the hand; the links / ball are drawn along the chain by code (flChain, weapons2.js)
if(w.id==='flail'){const ex=(J.nodes.find(q=>q.extras&&q.extras.kb_pitch)||{}).extras||{},br=J.nodes.find(q=>q.name==='Flail_BallRoot'),bz=br&&br.translation?-br.translation[2]:1.3646,eye=+ex.kb_eye||0.204,
 loc=(it,dz)=>{const q=Float32Array.from(it.m);q[12]=0;q[13]=0;q[14]+=dz;return q},lk=['Flail_Link_00','Flail_Link_01'].map(nm=>{const it=items.find(q=>q.nm===nm);return it&&Object.assign({},it,{m:loc(it,-it.m[14])})});
 md.fl={eye,pitch:+ex.kb_pitch||0.0376,bc:0.1,len:bz-eye-0.1,lk,ball:items.filter(it=>it.pn==='Flail_BallRoot').map(it=>Object.assign({},it,{bm:loc(it,bz)}))};
 md.hand=items.filter(it=>!/^Flail_Link/.test(it.nm)&&it.pn!=='Flail_BallRoot')}
// 長弓: the string is drawn by code (pulled back); its ends come from the string's bounds
if(w.id==='bow'){const st=items.find(it=>it.nm==='Bow_String');md.hand=items.filter(it=>it!==st);if(st)md.bw={y0:st.amn[1],y1:st.amx[1],z:(st.amn[2]+st.amx[2])/2}}}
const wpReady=i=>!!(WPN[i]&&WPN[i].file&&WMOD[WPN[i].id]);
function mApply(A){M.set(m4mul(WTMP,M,A))}
// emit weapon i under the current matrix (each part its own outline ID); col = flat silhouette colour (locked weapons)
function wpModel(i,col,hand){const md=WMOD[WPN[i].id];if(!md)return;for(const it of hand&&md.hand||md.items){mPush();mApply(it.m);if(col)emit(it.pi,col,0,0,F_UNLIT,0);else emit(it.pi,it.c,it.mat,it.gloss,it.fl,it.rim);mPop()}}
// the standard gun (box-built), muzzle at -Z
function drawYoGun(spin,lit){box(0,0.02,-0.1,0.075,0.11,0.34,C.gunM,0,.6);put(CYL,0,0.045,-0.36,PI/2,0,0,0.06,0.26,0.06,C.gunD,0,.8);box(0,0.085,-0.16,0.03,0.02,0.36,C.gunD);
put(CONE,0,0.045,-0.55,-PI/2,0,0,0.085,0.16,0.085,C.gold,0,1);put(CYL,0,0.045,-0.47,PI/2,0,0,0.09,0.03,0.09,C.gold);
put(CYL,0,0.02,-0.02,PI/2,0,spin,0.13,0.1,0.13,C.gunD,0,.7);put(CYL,0,0.02,-0.02,PI/2,0,0,0.136,0.025,0.136,C.red);
sph(0,0.105,0.05,0.07,0.07,0.07,lit?C.cyan:C.cyanD,0,1,lit?F_UNLIT:0);box(0,0.105,-0.27,0.015,0.03,0.03,C.gold);box(0,0.1,0.1,0.02,0.05,0.04,C.gunD);put(BOX,0,-0.1,0.07,0.35,0,0,0.06,0.18,0.085,C.wood);put(BOX,0,-0.062,-0.025,-0.3,0,0,0.016,0.05,0.016,C.gunD);box(0,-0.105,-0.03,0.03,0.012,0.1,C.gold);box(0,-0.072,-0.075,0.03,0.07,0.012,C.gold);}
// weapon frame: grip P, tip direction f, up hint u, scale s -> WF (local -Z = f, local +Y ≈ u)
function wpFrame(P,f,u,s){f=v3n(f);const d=u[0]*f[0]+u[1]*f[1]+u[2]*f[2],y=v3n([u[0]-f[0]*d,u[1]-f[1]*d,u[2]-f[2]*d]),z=[-f[0],-f[1],-f[2]],x=[y[1]*z[2]-y[2]*z[1],y[2]*z[0]-y[0]*z[2],y[0]*z[1]-y[1]*z[0]];
WF.set([x[0]*s,x[1]*s,x[2]*s,0,y[0]*s,y[1]*s,y[2]*s,0,z[0]*s,z[1]*s,z[2]*s,0,P[0],P[1],P[2],1])}
// keyframes [[t, value | [values]], ...] with smoothstep easing
function kf(K,t){const n=K.length;if(t<=K[0][0])return K[0][1];for(let i=1;i<n;i++)if(t<K[i][0]){const a=K[i-1],b=K[i],u=(t-a[0])/(b[0]-a[0]),s=u*u*(3-2*u);
 return typeof a[1]==='number'?a[1]+(b[1]-a[1])*s:a[1].map((v,j)=>v+(b[1][j]-v)*s)}return K[n-1][1]}
// direction from yaw θ (0 = the hero's front +Z, + = towards the hero's right -X) and elevation e
const dirYE=(th,e)=>[-Math.sin(th)*Math.cos(e),Math.sin(e),Math.cos(th)*Math.cos(e)];
// slash crescent (flat, around -Z, ends taper): sword trails and the 一閃 wave
function mkArc(A,n){const m=new MB(),U=[0,1,0],D=[0,-1,0],p=(a,r)=>[Math.sin(a)*r,0,-Math.cos(a)*r];
for(let i=0;i<n;i++){const a0=-A+2*A*i/n,a1=-A+2*A*(i+1)/n,w0=Math.sin(PI*i/n),w1=Math.sin(PI*(i+1)/n),o0=p(a0,0.5),o1=p(a1,0.5),i0=p(a0,0.5-0.2*w0),i1=p(a1,0.5-0.2*w1);m.quad(o0,o1,i1,i0,U,U,U,U);m.quad(o0,i0,i1,o1,D,D,D,D)}return m}
const SLASH=addPrim(mkArc(1.15,24)),WF_EMB=[0.42,0.12,0.1];
// ---- world objects (bombs, sword waves, fire zones, slash trails); own = thrown by this player (deals the damage) ----
const wbombs=[],wwaves=[],wfires=[],wslash=[];
function wpReset(){wbombs.length=0;wwaves.length=0;wfires.length=0;wslash.length=0;w2Reset()}
// damage to an enemy from a weapon; the bell monk keeps his rule (front 3% / side 30% / back = bell) seen from (fx,fz)
function wpDmg(e,dm,x,y,z,o){o=o||{};const q=!!o.quiet;
if(e.monk){const k=monkK(e,o.fx==null?pl.x:o.fx,o.fz==null?pl.z:o.fz);if(k>=1&&e.bell)monkBellHit(e,dm*0.5,x,y,z,q);else{if(k<0.1&&!q)monkClank(e,x,y,z);if(k>0)damage(e,dm*k,false,x,y,z,q||k<0.1)}}
else damage(e,dm,!!o.crit,x,y,z,q)}
// enemy effects: 1 freeze (s), 2 stagger (鎧鬼), 3 slow (boss, s), 4 雷 stun (s, bosses short), 6 shield-bash flinch (s, not bosses). The host runs the enemies, guests send a small message.
function wpEffect(e,c,v){if(!e||e.dead)return;if(isCli()){if(c===1&&e.type!=='boss')e.frz=Math.max(e.frz||0,1);if((c===4||c===6)&&e.type!=='boss'&&!(e.stn>0)){e.stn=Math.min(v,0.3);e.stnZ=c===4?1:0}if(lim('ef'+e.id+'_'+c,0.4))(net.q.ef||(net.q.ef=[])).push([e.id,c,r1(v||0)]);return}wpEffectHost(e,c,v)}
function wpEffectHost(e,c,v){if(c===1){if(e.type==='boss')return;if(!(e.frz>0)){fxStar(e.x,(e.y||0)+1,e.z,2.2,C.cyan,0.12);if(lim('frzT',0.3))sfxAt('ピキーン',e.x,(e.y||0)+2.6,e.z,{size:48,st:'cyan',life:0.4})}e.frz=Math.max(e.frz||0,v)}
else if(c===2){if(e.type==='bru'&&!e.ap&&e.st!=='stun'&&e.st!=='spawn'&&now-(e.stunAt||-9)>3.2){e.st='stun';e.stT=0;e.stunAt=now;e.cd=Math.max(e.cd||0,2);ev('txt','グラッ',r1(e.x),4.4,r1(e.z),58,'hit')}}
else if(c===3){if(e.type==='boss')e.slw=Math.max(e.slw||0,v)}
else if(c===4||c===6){const B=e.type==='boss';if(B&&c===6)return;if(now-(e.stnAt||-9)<(B?2.5:v+0.45))return;e.stnAt=now;e.stnZ=c===4?1:0;e.stn=Math.max(e.stn||0,B?Math.min(v,W2.sp.bstun):v);
 if(c===4&&lim('stnT',0.3))ev('txt','ビリビリッ',r1(e.x),r1((e.y||0)+3.2),r1(e.z),50,'fire')}}
// ================= ATTACKS =================
function wpUpdate(dt,cine){const w=wpW(),f=inp.fire&&!cine;pl.at+=dt;
if(w.kind==='bomb'&&pl.bq&&pl.bq.length){for(let i=0;i<pl.bq.length;i++)pl.bq[i]-=dt;while(pl.bq.length&&pl.bq[0]<=0){pl.bq.shift();pl.bombs=Math.min(3,pl.bombs+1);snd('reload')}}
if(pl.slamT>0){pl.slamT-=dt;if(pl.slamT<=0)hammerHit(pl.slamC)}
if(pl.kkT>0){pl.kkT-=dt;if(pl.kkT<=0)komaCrush()}
if(w.kind==='rail'){railUpdate(dt,f);return}
if(w.kind==='gun'){const buff=pl.sp===2&&w.spMode==='buff';if(f&&pl.cool<=0&&(pl.reload<=0||buff)&&(!pl.sp||buff)){if(pl.ammo>0||buff){if(buff&&pl.reload>0){pl.reload=0;pl.ammo=SK.mag}shoot()}else startReload()}return}
if(w.kind==='katana'){if(f&&pl.cool<=0&&!pl.sp&&pl.lgT<=0)katanaSlash();return}
if(w.kind==='hammer'){if(pl.hon){const c0=pl.hc;pl.hc=Math.min(1,pl.hc+dt/1.1);if(c0<1&&pl.hc>=1){snd('item');addText('ズオオッ',W*0.68,H*0.6,{size:52,st:'boom',life:0.4})}
  if(pl.sp)pl.hon=0;else if(!f){pl.hon=0;pl.slamT=0.12;pl.slamC=pl.hc;pl.cool=0.5;wpAct(4);snd('whoosh')}}
 else if(f&&pl.cool<=0&&!pl.sp){pl.hon=1;pl.hc=0;wpAct(3)}return}
if(w.kind==='bomb'&&f&&pl.cool<=0&&!pl.sp&&pl.bombs>0)throwBomb(0);
if(W2K[w.kind])w2Update(w,dt,f)}
// ---- 散華砲: golden-angle fan of pellets; damage falls off with distance. big = 大散華 (through walls and enemies) ----
function shotgunFire(w,big){const pw=pl.pow>0?2:1,as=touchMode||G.demoOn,AO=aimOrigin(),ox=AO[0],oy=AO[1],oz=AO[2];
const d0=big?aimDir():aimAssist(aimDir(),as?0.1:0.04,as?0.7:0.4),r=v3n([d0[2],0,-d0[0]]),u=[r[1]*d0[2]-r[2]*d0[1],r[2]*d0[0]-r[0]*d0[2],r[0]*d0[1]-r[1]*d0[0]];
const n=big?36:w.pel,spr=big?0.36:0.085,seen=new Set(),bru=new Map(),R=big?45:60;
for(let i=0;i<n;i++){const a=i*2.39996+rnd(0,0.3),q=spr*Math.sqrt((i+0.5)/n),d=v3n([d0[0]+(r[0]*Math.cos(a)+u[0]*Math.sin(a))*q,d0[1]+(r[1]*Math.cos(a)+u[1]*Math.sin(a))*q,d0[2]+(r[2]*Math.cos(a)+u[2]*Math.sin(a))*q]);
 if(big){for(const e of enemies){if(e.dead||e.st==='spawn')continue;let tm=1e9;for(const s of spheres(e)){const t=raySph(ox,oy,oz,d,s[0],s[1],s[2],s[3]);if(t>0&&t<tm)tm=t}
   if(tm<R){wpDmg(e,34*SK.spw*pw,ox+d[0]*tm,oy+d[1]*tm,oz+d[2]*tm,{quiet:seen.has(e)});seen.add(e);if(e.type==='bru')wpEffect(e,2)}}
  for(const s of shots)if(!s.dead){const t=raySph(ox,oy,oz,d,s.x,s.y,s.z,s.r+0.4);if(t>0&&t<R){popShot(s);if(isCli())net.q.ps.push(s.id)}}
  if(G.mode==='pvp')for(const o of others){if(o.dead||seen.has(o))continue;const t=raySph(ox,oy,oz,d,o.x,o.y+1.1,o.z,0.8);if(t>0&&t<R){seen.add(o);pvHit(o,9*pw,false,ox+d[0]*t,oy+d[1]*t,oz+d[2]*t)}}
  fxTracer(muz[0],muz[1],muz[2],ox+d[0]*R,oy+d[1]*R,oz+d[2]*R,i%3?C.sakura:C.white,0.12);if(net.on&&i%4===0)net.q.f.push([r1(ox+d[0]*30),r1(oy+d[1]*30),r1(oz+d[2]*30)])}
 else{const h=rayHit(ox,oy,oz,d,R),t=h.t,hx=ox+d[0]*t,hy=oy+d[1]*t,hz=oz+d[2]*t,fall=clamp(1.55-t/12,0.3,1.55),again=!!(h.e&&seen.has(h.e));
  if(h.e){seen.add(h.e);if(h.e.type==='bru'&&t<11)bru.set(h.e,(bru.get(h.e)||0)+1)}
  rayApply(h,w.dmg*fall*pw,hx,hy,hz,again||(!h.e&&i>2),0.4*fall*pw,R);
  if(i%2===0)fxTracer(muz[0],muz[1],muz[2],hx,hy,hz,pw>1?C.orange:C.white,0.06);if(net.on&&i<5)net.q.f.push([r1(hx),r1(hy),r1(hz)])}}
for(const[e,k]of bru)if(k>=3)wpEffect(e,2);
{const ad=aimDir(),sx=muz[0]+ad[0]*1.6,sy=muz[1]+ad[1]*1.6,sz=muz[2]+ad[2]*1.6;fxSparks(sx,sy,sz,big?24:8,big?10:6,C.sakura);fxStar(sx,sy,sz,big?2.6:1.1,C.sakura,0.1)}
if(!big)addText(pick(['ズドン！','ドゴン！','バン！']),W*0.72+rnd(-40,60),H*0.62+rnd(-40,30),{size:pw>1?62:54,st:pw>1?'boom':'fire',life:0.25,grow:0.12})}
// ---- 氷魄砲: held beam, ticks every 0.06 s through every enemy up to the first wall; heat ----
function railUpdate(dt,f){let on=0;
if(pl.sp===2)on=2;else if(f&&!pl.ovh&&!pl.sp){on=1;pl.heat+=dt/4.7;if(pl.heat>=1){pl.heat=1;pl.ovh=1;on=0;snd('reload');addText('シューッ',W*0.7,H*0.62,{size:54,st:'cyan',life:0.5})}}
if(on!==1){pl.heat=Math.max(0,pl.heat-dt*(pl.ovh?0.5:0.75));if(pl.ovh&&pl.heat<=0){pl.ovh=0;snd('reload')}}
pl.rOn=on;if(on){pl.rt-=dt;let n=0;while(pl.rt<=0&&n<3){pl.rt+=0.06;n++;railTick(on===2)}pl.flashT=0.03;pl.rec=Math.max(pl.rec,0.25)}else pl.rt=0}
function railTick(ice){const pw=pl.pow>0?2:1,as=touchMode||G.demoOn,AO=aimOrigin(),ox=AO[0],oy=AO[1],oz=AO[2],d=aimAssist(aimDir(),as?0.06:0.02,as?0.6:0.3),wallT=rayWorld(ox,oy,oz,d[0],d[1],d[2],120),dm=(ice?RAIL_ICE*SK.spw:RAIL_DM)*pw,rr=ice?0.45:0.15;let hit=0;
for(const e of enemies){if(e.dead||e.st==='spawn')continue;let tm=1e9,tb=1e9;for(const s of spheres(e)){const t=raySph(ox,oy,oz,d,s[0],s[1],s[2],s[3]+rr);if(t>0){if(t<tm)tm=t;if(e.monk&&s[5]==='bell'&&t<tb)tb=t}}
 // the bell monk: a beam that touches the bell wears the bell down whatever side it comes from (like rayHit), the pierce goes on to the body
 if(tb<wallT&&e.monk&&e.bell){monkBellHit(e,dm*0.5,ox+d[0]*tb,oy+d[1]*tb,oz+d[2]*tb,true);hit++;if(lim('rs'+e.id,0.1))fxSparks(ox+d[0]*tb,oy+d[1]*tb,oz+d[2]*tb,3,5,ice?C.white:C.cyan);if(tb<=tm+1.6)continue}
 if(tm<wallT){const hx=ox+d[0]*tm,hy=oy+d[1]*tm,hz=oz+d[2]*tm;wpDmg(e,dm,hx,hy,hz,{quiet:1});if(ice)wpEffect(e,e.type==='boss'?3:1,e.type==='boss'?0.35:3);hit++;if(lim('rs'+e.id,0.1))fxSparks(hx,hy,hz,3,5,ice?C.white:C.cyan)}}
for(const s of shots)if(!s.dead){const t=raySph(ox,oy,oz,d,s.x,s.y,s.z,s.r+0.3);if(t>0&&t<wallT){popShot(s);if(isCli())net.q.ps.push(s.id)}}
if(G.mode==='pvp')for(const o of others){if(o.dead)continue;const t=raySph(ox,oy,oz,d,o.x,o.y+1.1,o.z,0.7);if(t>0&&t<wallT&&lim('rpv'+o.slot,0.12))pvHit(o,(ice?18:12)*pw,false,ox+d[0]*t,oy+d[1]*t,oz+d[2]*t)}
pl.rEnd=wallT;if(hit){addGauge(0.5);hitMark=0.08;if(lim('rlh',0.12))snd('hit')}
if(lim('zap',0.09))snd('zap');if(wallT<120&&lim('rwl',0.08))fxSparks(ox+d[0]*wallT,oy+d[1]*wallT,oz+d[2]*wallT,3,5,ice?C.white:C.cyan)}
// ---- 祓い刀: a short lunge towards the nearest enemy in front, then the cut (in front, ±70°, 3.5 m) ----
function katanaSlash(){const fx=-Math.sin(pl.yaw),fz=-Math.cos(pl.yaw);let best=null,bd=7.5;
for(const e of enemies){if(e.dead||e.st==='spawn'||(e.type==='boss'&&!e.monk))continue;const dx=e.x-pl.x,dz=e.z-pl.z,d=Math.hypot(dx,dz);if(d<bd&&d>0.01&&(dx*fx+dz*fz)/d>0.82){bd=d;best=e}}
let lx=fx,lz=fz,dist=1.3;if(best){const dx=best.x-pl.x,dz=best.z-pl.z,d=Math.hypot(dx,dz);lx=dx/d;lz=dz/d;dist=clamp(d-1.5-(best.r||0.5),0,5.5)}
pl.cool=0.42;pl.slN=pl.slN?0:1;wpAct(1+pl.slN);pl.lgx=lx;pl.lgz=lz;pl.lgT=0.12;pl.lgV=pl.frz>0?0:dist/0.12;pl.lgP=1;snd('slash');
addText(pick(['ザンッ！','ズバッ！','シュバッ']),W*0.62+rnd(-60,80),H*0.58+rnd(-30,30),{size:56,st:'cyan',life:0.3})}
function wpLunge(dt){if(pl.lgT<=0)return;const s=Math.min(dt,pl.lgT);pl.x+=pl.lgx*pl.lgV*s;pl.z+=pl.lgz*pl.lgV*s;pl.lgT-=dt;if(pl.lgT<=0&&pl.lgP){pl.lgP=0;katanaHit()}}
function katanaHit(){const R=3.5,A=1.22,pw=pl.pow>0?2:1;let n=0,cut=0;wslash.push({x:pl.x,y:pl.y+1.15,z:pl.z,yaw:pl.yaw,dir:pl.slN?-1:1,t:0});
const inArc=(x,y,z,r)=>{const dx=x-pl.x,dz=z-pl.z,dh=Math.hypot(dx,dz)-r;if(dh>R||y-r>pl.y+3.4||y+r<pl.y-0.4)return false;return dh<0.6||Math.abs(angDiff(Math.atan2(-dx,-dz),pl.yaw))<A};
for(const e of enemies){if(e.dead||e.st==='spawn')continue;for(const s of spheres(e))if(inArc(s[0],s[1],s[2],s[3])){wpDmg(e,62*pw,s[0],s[1],s[2],{quiet:n>1});n++;break}}
for(const s of shots)if(!s.dead&&inArc(s.x,s.y,s.z,s.r+0.6)){popShot(s);if(isCli())net.q.ps.push(s.id);fxStar(s.x,s.y,s.z,1.6,C.cyan,0.1);cut++}
if(G.mode==='pvp')for(const o of others)if(!o.dead&&inArc(o.x,o.y+1.1,o.z,0.6))pvHit(o,34*pw,false,o.x,o.y+1.1,o.z);
if(cut&&lim('cutT',0.3))addText('カキン！',W/2+rnd(-120,120),H*0.4,{size:56,st:'cyan',life:0.4});if(n){shake(0.12);stopT(0.035)}}
// 一閃・天断ち: a wall-crossing crescent flying 80 m, 15 m wide, every enemy (and the boss) it passes is cut once
function katanaWave(){const fx=-Math.sin(pl.yaw),fz=-Math.cos(pl.yaw),y=pl.y+1.3;wwaves.push({x:pl.x,y,z:pl.z,dx:fx,dz:fz,d:0.5,t:0,own:1,hit:new Set()});wxPush(['k',r2(pl.x),r2(y),r2(pl.z),r2(fx),r2(fz)]);
wpAct(7);pl.cutT=0.55;snd('slash');snd('boom',1.2);flash(0.5);invA=1;shake(0.6);stopT(0.08);addText('ズバァァン！',W/2,H*0.2,{size:96,st:'cyan',life:0.9,rot:-0.12})}
// ---- 火消しの大槌: slam 2.1 m ahead, radius 2.8 → 6.2 with the charge ----
function hammerHit(c){const fx=-Math.sin(pl.yaw),fz=-Math.cos(pl.yaw),x=pl.x+fx*2.1,z=pl.z+fz*2.1,r=2.8+3.4*c,pw=pl.pow>0?2:1,dm=(55+105*c)*pw;let n=0;
for(const e of enemies){if(e.dead||e.st==='spawn')continue;let hs=null;for(const s of spheres(e))if(Math.hypot(s[0]-x,s[2]-z)-s[3]<r&&s[1]-s[3]<pl.y+2.6){hs=s;break}
 if(hs){wpDmg(e,dm,hs[0],hs[1],hs[2],{quiet:n>0});n++;if(e.type==='bru')wpEffect(e,2);else if(e.type==='imp'&&!isCli()){const d=Math.hypot(e.x-x,e.z-z)||1;e.kx=(e.x-x)/d*(8+6*c);e.kz=(e.z-z)/d*(8+6*c)}}}
for(const s of shots)if(!s.dead&&Math.hypot(s.x-x,s.z-z)<r&&s.y<pl.y+3){popShot(s);if(isCli())net.q.ps.push(s.id)}
if(G.mode==='pvp')for(const o of others)if(!o.dead&&Math.hypot(o.x-x,o.z-z)<r&&o.y<pl.y+2)pvHit(o,(28+40*c)*pw,false,o.x,o.y+1.1,o.z);
hammerFx(x,z,r,c);wxPush(['h',r1(x),r1(z),r1(r),r1(c)])}
function hammerFx(x,z,r,c){fxRing(x,0.1,z,r*2,C.white,0.3);fxRing(x,0.12,z,r*1.2,C.yellow,0.22);fxSmoke(x,0.3,z,5+((c*5)|0),1+c,C.smoke,3+3*c);fxDebris(x,0.3,z,6,6+4*c,C.stoneD,0.18);fxStar(x,0.6,z,2.5+2*c,C.white,0.1);
decals.push({x,z,r:r*0.7,life:4});const k=sat(1.3-Math.hypot(x-cam.x,z-cam.z)/30);shake((0.2+0.35*c)*k);stopT(0.04*k);snd('boom',0.5+0.7*c);sfxAt(c>0.8?'ドゴォォン！':'ドゴッ！',x,2.6,z,{size:60+30*c,st:'boom',life:0.5})}
// 駒砕き: leap, then slam everything within 16 m; the screen cracks into manga panels (pl.crackT)
function komaCrush(){const pw=pl.pow>0?2:1,R=16,dm=380*SK.spw*pw;pl.vy=Math.min(pl.vy,-26);
for(const e of enemies){if(e.dead||e.st==='spawn')continue;let hs=null;for(const s of spheres(e))if(Math.hypot(s[0]-pl.x,s[2]-pl.z)-s[3]<R){hs=s;break}
 if(hs){wpDmg(e,dm,hs[0],hs[1],hs[2],{quiet:1});if(e.type==='bru')wpEffect(e,2);else if(e.type==='imp'&&!isCli()){const d=Math.hypot(e.x-pl.x,e.z-pl.z)||1;e.kx=(e.x-pl.x)/d*14;e.kz=(e.z-pl.z)/d*14}}}
for(const s of shots)if(!s.dead&&Math.hypot(s.x-pl.x,s.z-pl.z)<R){popShot(s);if(isCli())net.q.ps.push(s.id)}
if(G.mode==='pvp')for(const o of others)if(!o.dead&&Math.hypot(o.x-pl.x,o.z-pl.z)<R)pvHit(o,55*pw,false,o.x,o.y+1.1,o.z);
komaFx(pl.x,pl.z,1);wxPush(['H',r1(pl.x),r1(pl.z)]);const q=Math.random;pl.crackT=1.1;
pl.crk=[[W*(0.24+q()*0.14),-30,W*(0.3+q()*0.14),H+30],[W*(0.6+q()*0.14),-30,W*(0.55+q()*0.14),H+30],[-30,H*(0.28+q()*0.12),W+30,H*(0.36+q()*0.1)],[-30,H*(0.66+q()*0.1),W+30,H*(0.6+q()*0.1)]]}
function komaFx(x,z,own){fxRing(x,0.1,z,32,C.white,0.5);fxRing(x,0.14,z,20,C.yellow,0.4);fxRing(x,0.16,z,10,C.orange,0.3);for(let i=0;i<8;i++){const a=i/8*TAU;fxSmoke(x+Math.cos(a)*6,0.4,z+Math.sin(a)*6,2,1.6,C.smoke,4)}
fxDebris(x,0.3,z,14,12,C.stoneD,0.25);decals.push({x,z,r:9,life:8});shake(own?1:0.5);flash(0.4);stopT(own?0.14:0.05);snd('boom',2);sfxAt('バキィィン！',x,4,z,{size:110,st:'boom',life:0.9})}
// ---- 焙烙火矢 ----
function throwBomb(big){const d=aimDir(),AO=aimOrigin(),rx=Math.cos(pl.yaw),rz=-Math.sin(pl.yaw),sp=big?17:21,x=AO[0]+d[0]*0.8+rx*0.22,y=AO[1]-0.1+d[1]*0.8,z=AO[2]+d[2]*0.8+rz*0.22;
const b={x,y,z,vx:d[0]*sp+pl.vx*0.3,vy:d[1]*sp+(big?6:4.5),vz:d[2]*sp+pl.vz*0.3,big:big?1:0,own:1,t:0,rot:0};wbombs.push(b);wxPush(['b',r2(x),r2(y),r2(z),r2(b.vx),r2(b.vy),r2(b.vz),b.big]);
if(!big){pl.bombs--;(pl.bq||(pl.bq=[])).push(WB_RF);pl.cool=0.5}wpAct(big?6:5);snd('whoosh');addText(big?'ヒュルル…':'シュッ',W*0.66+rnd(-40,40),H*0.6,{size:big?70:46,st:big?'boom':'cyan',life:0.35})}
function bombBoom(b,he){const big=b.big,R=big?9:4.3,x=b.x,y=Math.max(0.4,b.y),z=b.z;explode(x,y,z,big?3.6:1.5,{text:big?'ドォォォン！':'ドカァン！'});decals.push({x,z,r:big?6:2.6,life:big?8:5});
if(big)for(let k=0;k<7;k++){const c=[C.red,C.yellow,C.cyan,C.pink,C.white,C.orange,C.sakura][k],px=x+rnd(-6,6),py=y+rnd(5,11),pz=z+rnd(-6,6);fxStar(px,py,pz,rnd(2.5,4.5),c,0.5);fxSparks(px,py,pz,8,9,c)}
if(b.own){const pw=pl.pow>0?2:1,base=(big?520*SK.spw:130)*pw,fx=x-b.vx*0.12,fz=z-b.vz*0.12;let n=0;
 for(const e of enemies){if(e.dead||e.st==='spawn')continue;let m=1e9,hs=null;for(const s of spheres(e)){const d=Math.hypot(s[0]-x,s[1]-y,s[2]-z)-s[3];if(d<m){m=d;hs=s}}if(e===he)m=0;
  if(hs&&m<R){wpDmg(e,base*(1-0.5*sat(m/R)),hs[0],hs[1],hs[2],{quiet:n>0,fx,fz});n++}}
 for(const s of shots)if(!s.dead&&Math.hypot(s.x-x,s.y-y,s.z-z)<R){popShot(s);if(isCli())net.q.ps.push(s.id)}
 if(G.mode==='pvp')for(const o of others)if(!o.dead&&Math.hypot(o.x-x,o.z-z)<R&&Math.abs(o.y+1-y)<R)pvHit(o,(big?60:38)*pw,false,o.x,o.y+1.1,o.z);
 if(big){const onB=he&&he.type==='boss'?he:null,fixed=onB&&!onB.monk;// the fixed demon king burns on his chest (not on a hand slammed next to the player)
  wfires.push({x:fixed?0:x,y:fixed?17:onB?y:0.1,z:fixed?-17.5:z,r:5.5,t:6,own:1,tk:0,e:onB,ox:onB?x-onB.x:0,oz:onB?z-onB.z:0,big:fixed?1:0})}}
else if(big)wfires.push({x,y:0.1,z,r:5.5,t:6,own:0})}
// ---- per frame: bombs, waves, fire zones, trails (everyone's, only the owner's deal damage) ----
function wpWorld(dt){if(pl.cutT>0)pl.cutT-=RDT;if(pl.crackT>0)pl.crackT-=RDT;w2World(dt);
for(let i=wslash.length-1;i>=0;i--){wslash[i].t+=dt;if(wslash[i].t>0.17)wslash.splice(i,1)}
for(let i=wbombs.length-1;i>=0;i--){const b=wbombs[i],px=b.x,py=b.y,pz=b.z;b.t+=dt;b.vy-=22*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.rot+=dt*9;
 const R=b.big?0.75:0.3;let hit=b.y<R||b.t>5,he=null;
 if(!hit){const dx=b.x-px,dy=b.y-py,dz=b.z-pz,l=Math.hypot(dx,dy,dz);if(l>1e-4){const t=rayWorld(px,py,pz,dx/l,dy/l,dz/l,l);if(t<l-1e-3){b.x=px+dx/l*t;b.y=py+dy/l*t;b.z=pz+dz/l*t;hit=true}}}
 if(!hit)for(const e of enemies){if(e.dead||e.st==='spawn')continue;for(const s of spheres(e))if(Math.hypot(b.x-s[0],b.y-s[1],b.z-s[2])<s[3]+R){hit=true;he=e;break}if(hit)break}
 if(!hit&&b.own&&G.mode==='pvp')for(const o of others)if(!o.dead&&Math.hypot(b.x-o.x,b.y-o.y-1,b.z-o.z)<1){hit=true;break}
 if(!hit&&lim('bsm'+i,0.06))fxSmoke(b.x,b.y+0.2,b.z,1,b.big?0.8:0.3,C.smokeD,0.5);
 if(hit){wbombs.splice(i,1);bombBoom(b,he)}}
for(let i=wwaves.length-1;i>=0;i--){const w=wwaves[i],d0=w.d;w.d+=50*dt;w.t+=dt;
 if(w.own){const pw=pl.pow>0?2:1,dm=430*SK.spw*pw,crossed=(x,z,r,wd)=>{const rx=x-w.x,rz=z-w.z,al=rx*w.dx+rz*w.dz;return al>d0-r&&al<w.d+r&&Math.abs(-rx*w.dz+rz*w.dx)<wd+r};
  for(const e of enemies){if(e.dead||e.st==='spawn'||w.hit.has(e))continue;for(const s of spheres(e))if(crossed(s[0],s[2],s[3],7.5)){w.hit.add(e);wpDmg(e,dm,s[0],s[1],s[2],{fx:w.x,fz:w.z});if(e.type==='bru')wpEffect(e,2);break}}
  for(const s of shots)if(!s.dead&&crossed(s.x,s.z,1,8)){popShot(s);if(isCli())net.q.ps.push(s.id)}
  if(G.mode==='pvp')for(const o of others)if(!o.dead&&!w.hit.has(o)&&crossed(o.x,o.z,0.6,7.5)){w.hit.add(o);pvHit(o,70*pw,false,o.x,o.y+1.1,o.z)}}
 if(w.d>5&&lim('wvs'+i,0.04)){const fx=w.x+w.dx*w.d,fz=w.z+w.dz*w.d;fxSparks(fx,w.y,fz,4,6,C.cyan)}
 if(w.d>80)wwaves.splice(i,1)}
for(let i=wfires.length-1;i>=0;i--){const f=wfires[i];f.t-=dt;if(f.e){if(f.e.dead)f.e=null;else if(f.e.monk){f.x=f.e.x+f.ox;f.z=f.e.z+f.oz}}
 if(f.own&&f.t>0){f.tk-=dt;if(f.tk<=0){f.tk=0.3;const pw=pl.pow>0?2:1,dm=60*0.3*SK.spw*pw;if(f.e)damage(f.e,dm*1.5,false,f.x,f.y,f.z,true);
  for(const e of enemies){if(e.dead||e.st==='spawn'||e===f.e)continue;for(const s of spheres(e))if(Math.hypot(s[0]-f.x,s[2]-f.z)<f.r+s[3]*0.5&&s[1]-s[3]<2.5){damage(e,dm,false,s[0],s[1],s[2],true);break}}
  if(G.mode==='pvp')for(const o of others)if(!o.dead&&Math.hypot(o.x-f.x,o.z-f.z)<f.r&&o.y<1.5)pvHit(o,8*pw,false,o.x,o.y+1,o.z)}}
 if(f.t>0.4&&lim('fsm'+i,0.25))fxSmoke(f.x+rnd(-f.r,f.r)*0.6,f.y+0.8,f.z+rnd(-f.r,f.r)*0.6,1,1.1,C.smokeD,1.5);
 if(f.t<=0)wfires.splice(i,1)}}
// others' visual events (net 'p' message .w)
function wfxPlay(o,a){switch(a[0]){
case'b':wbombs.push({x:a[1],y:a[2],z:a[3],vx:a[4],vy:a[5],vz:a[6],big:a[7],own:0,t:0,rot:0});break;
case'k':wwaves.push({x:a[1],y:a[2],z:a[3],dx:a[4],dz:a[5],d:0.5,t:0,own:0});snd('slash');break;
case'h':hammerFx(a[1],a[2],a[3],a[4]);break;
case'H':komaFx(a[1],a[2],0);break;
default:w2Fx(o,a)}}
// another player's action counter changed: replay the pose from the start (and the sword trail)
function wpOtherAct(o,an,ak){if(o.an===an)return;const first=o.an==null;o.an=an;if(first)return;o.ak=ak;o.at=0;
w2OtherAct(o,ak);if(ak===1||ak===2){wslash.push({x:o.x,y:o.y+1.15,z:o.z,yaw:o.yaw,dir:ak===2?-1:1,t:0});const v=sndVol;sndVol=v*clamp(1.2-Math.hypot(o.x-pl.x,o.z-pl.z)/30,0.15,0.7);snd('slash');sndVol=v}}
// ================= SPECIALS (pl.sp 1 = cut-in, 2 = active for spDur()) =================
function wpSpStart(){const w=wpW();pl.hon=0;switch(w.id){
case'gun':snd('beam');addText('ズドォォォン！',W/2,H*0.13,{size:84,st:'cyan',life:1.0,grow:0.1,rot:-0.08});flash(0.6);invA=1;break;
case'rifle':snd('charge');addText('ダダダダダッ！',W/2,H*0.15,{size:80,st:'cyan',life:0.9,grow:0.1,rot:-0.08});flash(0.35);pl.ammo=SK.mag;pl.reload=0;break;
case'shotgun':pl.flashT=0.08;pl.kick+=0.12;shotgunFire(w,1);snd('sgun');snd('boom',1.4);flash(0.6);invA=1;shake(0.8);addText('ズドドドン！',W/2,H*0.15,{size:90,st:'boom',life:0.9,rot:-0.08});break;
case'rail':snd('freeze');addText('パキィィン！',W/2,H*0.15,{size:86,st:'cyan',life:0.9,rot:-0.08});flash(0.5);invA=1;pl.ovh=0;break;
case'katana':katanaWave();break;
case'hammer':pl.vy=Math.max(pl.vy,10);pl.kkT=0.42;wpAct(8);snd('jump');snd('charge');addText('ハァァッ！',W/2,H*0.16,{size:84,st:'boom',life:0.6,rot:-0.06});break;
case'bomb':throwBomb(1);break;
default:w2SpStart(w)}}
function wpSpTick(dt){const w=wpW();if(w.id==='gun'){trauma=Math.max(trauma,0.6);pl.rec=1;lines(0.6,'#fff');beamDamage(dt)}else if(w.id==='rail'){lines(0.25,'#bfefff')}else if(w.id==='rifle'&&lim('rfx',0.5))lines(0.3,'#fff');else if(w.id==='spear'&&lim('spx',0.6))lines(0.2,'#ffe680')}
// ================= 必殺のカットイン (cutSp 0.6 → 0): a band with the hero's eye, one style per weapon =================
// bg band colour, rot band tilt, iris colour, fx pattern, mir = eye on the right (text on the left), tc '必殺！' colour
const CUTS={gun:{bg:'#2f6fd8',rot:-0.07,iris:'#ff9d00',fx:'speed'},rifle:{bg:'#23306e',rot:0.06,iris:'#59d8ff',fx:'beads',mir:1},
shotgun:{bg:'#ff5c93',rot:-0.1,iris:'#ffd91a',fx:'petals'},rail:{bg:'#c9f2ff',rot:0.05,iris:'#35c8ff',fx:'ice',mir:1},
katana:{bg:'#16121f',rot:-0.12,iris:'#e5402b',fx:'slash'},hammer:{bg:'#ffc21a',rot:0.08,iris:'#e5402b',fx:'crack',mir:1,tc:'#e5402b'},
bomb:{bg:'#1c1440',rot:-0.06,iris:'#ff6a3d',fx:'fire'},
flail:{bg:'#23306e',rot:0.07,iris:'#ff3b30',fx:'crack',mir:1},spear:{bg:'#ffd91a',rot:-0.08,iris:'#2f6fd8',fx:'speed',tc:'#2f6fd8'},
bow:{bg:'#2a3f8f',rot:0.06,iris:'#59d8ff',fx:'beads',mir:1},shield:{bg:'#c9f2ff',rot:-0.05,iris:'#c9a227',fx:'ice',tc:'#2f6fd8'},staff:{bg:'#2fb38a',rot:0.05,iris:'#ffd91a',fx:'petals',mir:1}};
function cutEye(iris){ctx.fillStyle='#ffe2c6';ctx.beginPath();ctx.ellipse(0,10,330,210,0,0,TAU);ctx.fill();
const lid=()=>{ctx.beginPath();ctx.moveTo(-150,10);ctx.quadraticCurveTo(-10,-70,150,-20);ctx.quadraticCurveTo(40,70,-120,50)};
ctx.fillStyle='#fff';lid();ctx.fill();ctx.save();lid();ctx.clip();ctx.fillStyle=iris;ctx.beginPath();ctx.ellipse(12,-2,60,64,0,0,TAU);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.stroke();
ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(12,0,24,32,0,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-12,-26,15,0,TAU);ctx.arc(34,18,7,0,TAU);ctx.fill();ctx.restore();
ctx.fillStyle=INK;ctx.beginPath();ctx.moveTo(-165,4);ctx.quadraticCurveTo(-20,-98,165,-34);ctx.quadraticCurveTo(-10,-62,-150,18);ctx.fill();ctx.beginPath();ctx.moveTo(-200,-66);ctx.lineTo(130,-128);ctx.lineTo(160,-100);ctx.lineTo(-185,-36);ctx.fill();
ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-110,54);ctx.quadraticCurveTo(10,76,130,40);ctx.stroke()}
// background pattern inside the band (behind the eye); band space x -800..800, y -150..150, t = seconds since the cut-in began
function cutBack(fx,t){const jr=mulberry(((now*14)|0)+5),r=mulberry(77);
if(fx==='speed'||fx==='slash'){ctx.fillStyle=fx==='slash'?'rgba(255,255,255,.55)':'#fff';for(let i=0;i<(fx==='slash'?18:34);i++){const y=(jr()*2-1)*150,x=(jr()*2-1)*800,w=200+jr()*600;ctx.fillRect(x,y,w,1.5+jr()*4)}}
else if(fx==='beads'){for(let i=0;i<46;i++){const y=(r()*2-1)*140,sp=1800+r()*1600,x=((r()*1600+t*sp)%1600)-800,rr=4+r()*7;ctx.fillStyle='rgba(255,255,255,.5)';ctx.fillRect(x-90-rr*6,y-rr*0.35,90+rr*6,rr*0.7);
 ctx.beginPath();ctx.arc(x,y,rr,0,TAU);ctx.fillStyle=i%3?'#59d8ff':'#fff';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.stroke()}}
else if(fx==='petals'){focusLines(300,0,120,40,'rgba(255,255,255,.7)',((now*10)|0)+9);for(let i=0;i<38;i++){const a=r()*TAU,d=(r()*700+t*900*(0.5+r()))%900,x=300+Math.cos(a)*d,y=Math.sin(a)*d*0.45,s=10+r()*12;
 ctx.save();ctx.translate(x,y);ctx.rotate(a+t*6*(r()-0.5));ctx.beginPath();ctx.ellipse(0,0,s,s*0.55,0,0,TAU);ctx.fillStyle=i%3?'#ffd6e4':'#fff';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.stroke();ctx.restore()}}
else if(fx==='ice'){ctx.fillStyle='#fff';for(let i=0;i<20;i++){const y=(jr()*2-1)*150,x=(jr()*2-1)*800;ctx.fillRect(x,y,300+jr()*400,2+jr()*3)}
 for(let i=0;i<16;i++){const x=(r()*2-1)*780,top=r()<0.5,s=40+r()*90,y=top?-150:150,g=sat(t*5-r()*0.6);if(g<=0)continue;ctx.beginPath();ctx.moveTo(x-s*0.3,y);ctx.lineTo(x+s*0.1,y+(top?1:-1)*s*1.4*g);ctx.lineTo(x+s*0.35,y);ctx.closePath();ctx.fillStyle=i%2?'#fff':'#8fe3ff';ctx.fill();ctx.strokeStyle='#2a8fd0';ctx.lineWidth=3;ctx.stroke()}
 ctx.fillStyle='#fff';ctx.fillRect(-800,92,1600,10);ctx.fillStyle='#35c8ff';ctx.fillRect(-800,96,1600,3)}
else if(fx==='crack'){ctx.save();ctx.globalAlpha=0.3;ctx.fillStyle=dotPat;ctx.fillRect(-800,-150,1600,300);ctx.restore();focusLines(-300,0,140,36,'rgba(255,255,255,.8)',((now*10)|0)+3)}
else if(fx==='fire'){for(let k=0;k<5;k++){const cx=-650+k*330+r()*80,cy=(r()*2-1)*80,R=(60+r()*70)*easeOut(sat(t*3-k*0.12)),cols=['#ffd91a','#ff6a3d','#59d8ff','#ff7aa8','#fff'],c=cols[k%5];if(R<=1)continue;
 ctx.strokeStyle=c;ctx.lineWidth=4;ctx.beginPath();for(let i=0;i<16;i++){const a=i/16*TAU;ctx.moveTo(cx+Math.cos(a)*R*0.35,cy+Math.sin(a)*R*0.35);ctx.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R)}ctx.stroke();
 ctx.fillStyle=c;for(let i=0;i<16;i++){const a=(i+0.5)/16*TAU;ctx.beginPath();ctx.arc(cx+Math.cos(a)*R*1.12,cy+Math.sin(a)*R*1.12,4,0,TAU);ctx.fill()}}}}
// pattern on top of the eye
function cutFront(fx,t){
if(fx==='slash'&&t>0.12){const g=easeOut(sat((t-0.12)/0.08)),L=760*g,c=(a,b)=>{ctx.beginPath();ctx.moveTo(-L,0);ctx.quadraticCurveTo(0,-a,L,0);ctx.quadraticCurveTo(0,b,-L,0)};
 ctx.save();ctx.rotate(0.3);c(28,28);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();ctx.beginPath();ctx.moveTo(-L*0.9,0);ctx.lineTo(L*0.9,0);ctx.strokeStyle='#59d8ff';ctx.lineWidth=3;ctx.stroke();ctx.restore()}
else if(fx==='crack'&&t>0.14){const r=mulberry(31),g=sat((t-0.14)/0.06);for(const[lw,col]of[[16,INK],[6,'#fff']]){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.lineJoin='miter';ctx.beginPath();
 for(let k=0;k<3;k++){let x=-700+k*460+r()*120,y=-160;ctx.moveTo(x,y);for(let i=0;i<6&&y<160*g*2-160;i++){x+=(r()-0.5)*120;y+=60+r()*20;ctx.lineTo(x,y)}}ctx.stroke()}}
else if(fx==='beads'&&t>0.1){ctx.save();ctx.globalAlpha=0.9;for(let i=0;i<3;i++){const y=-60+i*60,x=((t*2600+i*500)%1900)-950;ctx.fillStyle='#fff';ctx.fillRect(x-160,y-3,160,6);ctx.beginPath();ctx.arc(x,y,12,0,TAU);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke()}ctx.restore()}}
function drawCutSp(){const w=wpW(),S=CUTS[w.id]||CUTS.gun,t=0.6-cutSp,u=t<0.1?t/0.1:cutSp<0.1?cutSp/0.1:1,m=S.mir?-1:1;
ctx.save();ctx.translate(W/2,330);ctx.rotate(S.rot);const h=150*u;ctx.beginPath();ctx.rect(-800,-h,1600,h*2);ctx.fillStyle=S.bg;ctx.fill();ctx.save();ctx.clip();
cutBack(S.fx,t);ctx.save();ctx.scale(m,1);ctx.translate(-250+t*60,10);cutEye(S.iris);ctx.restore();cutFront(S.fx,t);ctx.restore();
ctx.strokeStyle=INK;ctx.lineWidth=8;ctx.strokeRect(-800,-h,1600,h*2);
if(u>0.9){txt('必殺！',260*m,-38,96,S.tc||'#ffd91a',INK,16,'center','#fff',28);const nm=w.sp,lv=w.id==='gun'?1:wpLv(w.id);txt(nm,300*m,62,Math.min(84,440/nm.length),'#fff',INK,16);if(lv>1){ctx.save();ctx.translate(260*m+182,-82);ctx.rotate(0.12);txt('Lv'+lv,0,0,44,'#fff',INK,10,'center','#e5402b',18);ctx.restore()}}ctx.restore()}
// ================= DRAW: world =================
function railBeam(a,b,ice){const NF=F_UNLIT|F_NOCAST,dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],l=Math.hypot(dx,dy,dz);if(l<0.2)return;const w=ice?0.26:0.13;
mPush();mT((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);orient(dx,dy,dz);mRX(PI/2);mS(w,l,w);emit(CYL,ice?C.white:C.cyan,0,0,NF,0);mPop();
const ux=dx/l,uy=dy/l,uz=dz/l,n=Math.min(10,Math.ceil(l/4));for(let i=0;i<n;i++){const t=((now*(ice?2:4)+i/n)%1)*l;mPush();mT(a[0]+ux*t,a[1]+uy*t,a[2]+uz*t);orient(dx,dy,dz);mRX(PI/2);const s=ice?0.9+0.3*(i%2):0.5;mS(s,1,s);emit(RING,i%2?C.cyan:C.white,0,0,NF,0);mPop()}
let px=a[0],py=a[1],pz=a[2];const k=Math.min(8,Math.ceil(l/3)),jit=ice?0.35:0.22;for(let i=1;i<=k;i++){const t=i/k*l,qx=a[0]+ux*t+(i<k?rnd(-jit,jit):0),qy=a[1]+uy*t+(i<k?rnd(-jit,jit):0),qz=a[2]+uz*t+(i<k?rnd(-jit,jit):0);
 mPush();mT((px+qx)/2,(py+qy)/2,(pz+qz)/2);const ll=orient(qx-px,qy-py,qz-pz);mS(0.05,0.05,ll);emit(BOX,ice?C.cyan:C.white,0,0,NF,0);mPop();px=qx;py=qy;pz=qz}
bill(BURST,b[0],b[1],b[2],ice?1.4:0.7,now*30,ice?C.white:C.cyan,NF);bill(STAR,a[0],a[1],a[2],ice?0.6:0.3,now*20,C.white,NF)}
function drawWpWorld(){const NF=F_UNLIT|F_NOCAST;drawW2World();
for(const s of wslash){const k=0.75+0.25*easeOut(sat(s.t/0.05)),sc=3.8*k;mPush();mT(s.x,s.y,s.z);mRY(s.yaw);mRZ(s.dir*0.55);mS(sc,1,sc);emit(SLASH,C.white,0,0,NF,0);mPop()}
for(const w of wwaves){const sc=16*Math.min(1,0.4+w.t*4),fx=w.x+w.dx*w.d,fz=w.z+w.dz*w.d,yaw=Math.atan2(-w.dx,-w.dz);
 mPush();mT(fx-w.dx*sc*0.5,w.y,fz-w.dz*sc*0.5);mRY(yaw);mRZ(-0.45);mS(sc,1,sc);emit(SLASH,C.white,0,0,NF,0);mT(0,0.012,0.03);mS(0.9,1,0.9);emit(SLASH,C.cyan,0,0,NF,0);mPop()}
for(const b of wbombs){const s=b.big?4:1.6;mPush();mT(b.x,b.y,b.z);mRY(b.rot);mRX(b.rot*0.7);mS(s,s,s);if(wpReady(6))wpModel(6);else sph(0,0,0,0.2,0.2,0.2,C.red);mPop();
 bill(STAR,b.x,b.y+0.22*s,b.z,0.12*s+0.05*Math.sin(now*40),now*20,C.yellow,NF)}
for(const f of wfires){const k=Math.min(1,f.t/0.5)*Math.min(1,(6-f.t)/0.25+0.15)*(f.big?3:1),hi=f.y>0.5,n=hi?6:9,rr=hi?1.4*(f.big?3:1):f.r*0.62;
 if(!hi)put(CYL,f.x,0.08,f.z,0,0,0,f.r*2*k,0.02,f.r*2*k,WF_EMB,0,0,F_NOCAST|F_NOEDGE);
 for(let j=0;j<n;j++){const a=j/n*TAU+f.x*0.7,r=j===0?0:rr*(0.55+0.45*((j*7)%3)/2),h=(hi?2.2:1.5+((j*5)%3)*0.55)*k*(1+0.22*Math.sin(now*9+j*1.7)),tl=0.18*Math.sin(now*5+j);
  put(CONE,f.x+Math.cos(a)*r,f.y+h*0.45,f.z+Math.sin(a)*r,tl,a,-tl,h*0.42,h,h*0.42,j%3?C.orange:C.red,0,0,NF|F_FLAME);put(CONE,f.x+Math.cos(a)*r*0.9,f.y+h*0.3,f.z+Math.sin(a)*r*0.9,tl,a+1,-tl,h*0.3,h*0.62,h*0.3,C.yellow,0,0,NF|F_FLAME)}}}
// local rail beam (after the view model / hero set muz)
function wpDrawLate(){if(G.state!=='play'&&!(G.state==='title'&&G.demoOn)&&!gaDemo())return;if(pl.rOn&&!pl.dead&&!(G.kcT>=0)&&!monkCine()&&!(tpsOn()&&tpsD<0.9&&SET.view!==2)){const d=aimDir(),AO=aimOrigin(),t=pl.rEnd||40;railBeam(muz,[AO[0]+d[0]*t,AO[1]+d[1]*t,AO[2]+d[2]*t],pl.rOn===2)}}
// another player's rail beam (direction from their yaw / pitch)
function wpOtherBeam(o){const cp=Math.cos(o.pitch),d=[-Math.sin(o.yaw)*cp,Math.sin(o.pitch),-Math.cos(o.yaw)*cp],t=rayWorld(o.gx,o.gy,o.gz,d[0],d[1],d[2],60);railBeam([o.gx,o.gy,o.gz],[o.gx+d[0]*t,o.gy+d[1]*t,o.gz+d[2]*t],!!(o.rb&16))}
// ================= DRAW: first-person view model (camera space, layer 2) =================
const KV_I=[0.3,-0.34,-0.5,0.25,0.95,0.35],KV_A=[[0,KV_I],[0.07,[0.42,-0.12,-0.45,-0.9,0.6,0.9]],[0.17,[-0.32,-0.42,-0.55,1.25,-0.25,-0.6]],[0.42,[-0.25,-0.45,-0.55,1.1,-0.2,-0.5]],[0.65,KV_I]],
KV_B=[[0,KV_I],[0.07,[-0.4,-0.12,-0.45,0.9,0.6,-0.9]],[0.17,[0.34,-0.42,-0.55,-1.25,-0.25,0.6]],[0.42,[0.27,-0.45,-0.55,-1.1,-0.2,0.5]],[0.65,KV_I]],
KV_S=[[0,KV_I],[0.2,[0.5,-0.2,-0.35,-1.6,0.15,1.4]],[0.32,[-0.5,-0.25,-0.5,1.6,0.05,-1.4]],[0.7,[-0.4,-0.3,-0.5,1.4,0,-1.2]],[1,KV_I]],
HV_I=[0.42,-0.52,-0.55,-0.15,1.15,-0.2],HV_R=[0.3,-0.22,-0.38,-0.1,2.15,-0.1],HV_D=[0.1,-0.36,-0.72,0,-0.3,0],
HV_S=[[0,HV_R],[0.11,HV_D],[0.45,HV_D],[0.8,HV_I]],HV_SP=[[0,HV_I],[0.3,HV_R],[0.4,[0.25,-0.1,-0.3,-0.05,2.5,0]],[0.47,HV_D],[0.95,HV_D],[1.3,HV_I]],
BV_I=[0.3,-0.34,-0.62],BV_T=[[0,BV_I],[0.12,[0.38,-0.06,-0.38]],[0.22,[0.12,-0.08,-0.95]],[0.4,[0.16,-0.6,-0.8]],[0.75,BV_I]];
function wpView(){const i=pl.wp|0,w=WPN[i];if(!wpReady(i))return false;curLayer=2;mPush();M.set(CAMW);
const bx=Math.sin(pl.bob)*0.012*pl.moving,by=Math.abs(Math.cos(pl.bob))*0.014*pl.moving,dip=pl.gunDip+(pl.dead?Math.min(1,pl.deadT*2):0),at=pl.at,ak=pl.ak|0,br=Math.sin(now*2)*0.006;let tip=[0,0,-0.6],s=0.8,show=1,fl=0;
mT(bx,-by-dip*0.3+br,0);
if(w.kind==='gun'||w.kind==='rail'){mT(0.21,-0.25,-0.5+pl.rec*(w.kind==='rail'?0.01:0.05));mRY(0.05);mRX((w.kind==='rail'?pl.rec*0.01:pl.rec*(w.kick||0.01)*3)-dip*0.8);mRZ(-dip*0.5);s=0.62;tip=w.muz;fl=1;}
else if(w.kind==='katana'){const v=kf(ak===1?KV_A:ak===2?KV_B:ak===7?KV_S:[[0,KV_I]],at);mT(v[0],v[1],v[2]);mRY(v[3]);mRX(v[4]);mRZ(v[5]);tip=[0,0,-0.76]}
else if(w.kind==='hammer'){let v;if(ak===3&&pl.hon){v=HV_I.map((a,j)=>a+(HV_R[j]-a)*sat(at/0.18));v[0]+=rnd(-1,1)*0.006*pl.hc;v[1]+=rnd(-1,1)*0.006*pl.hc}else v=kf(ak===4?HV_S:ak===8?HV_SP:[[0,HV_I]],at);
 mT(v[0],v[1],v[2]);mRY(v[3]);mRX(v[4]);mRZ(v[5]+PI);s=0.72;tip=[0,0,-0.84]}
else if(W2K[w.kind]){const r=w2View(w,ak,at);s=r.s;tip=r.tip}
else{const th=ak===5||ak===6,v=th?kf(BV_T,at):BV_I;mT(v[0],v[1],v[2]);show=(!th||at<0.2||at>0.6)&&(pl.bombs>0||(ak===6&&at<0.2)||pl.sp>0);s=ak===6&&at<0.2||pl.sp===1?2:0.95;mT(0,0.1*s,0);mRY(now*0.6);tip=[0.035,0.19,0]}
mPush();mS(s,s,s);if(show)wpModel(i,null,1);if(W2K[w.kind])w2ViewExtra(w,s);mPop();
muz[0]=M[0]*tip[0]*s+M[4]*tip[1]*s+M[8]*tip[2]*s+M[12];muz[1]=M[1]*tip[0]*s+M[5]*tip[1]*s+M[9]*tip[2]*s+M[13];muz[2]=M[2]*tip[0]*s+M[6]*tip[1]*s+M[10]*tip[2]*s+M[14];
if(fl&&pl.flashT>0&&w.kind==='gun'){const buff=pl.sp===2&&w.spMode==='buff';bill(BURST,muz[0],muz[1],muz[2],w.pel?0.42:0.24,pl.spin*3,buff?C.cyan:w.pel?C.sakura:C.yellow,F_UNLIT);bill(STAR,muz[0],muz[1],muz[2],0.15,pl.spin,C.white,F_UNLIT)}
if(w.kind==='bomb'&&show)bill(STAR,muz[0],muz[1],muz[2],0.035+0.015*Math.sin(now*40),now*20,C.yellow,F_UNLIT);
if(pl.sp===1){const k=0.15+pl.spT*0.6;bill(BURST,muz[0],muz[1],muz[2],k,now*20,C.cyan,F_UNLIT);bill(STAR,muz[0],muz[1],muz[2],k*0.5,-now*20,C.white,F_UNLIT)}
mPop();curLayer=1;return true}
// ================= DRAW: hero poses with a weapon (model space: up +Y, faces +Z, the hero's right is -X) =================
const KH_I=[-0.17,1.2,0.3,0.3,0.95],KH_A=[[0,KH_I],[0.07,[-0.36,1.55,0.08,1.7,0.7]],[0.18,[0.2,1.06,0.36,-1.5,-0.35]],[0.42,[0.18,1.08,0.34,-1.4,-0.3]],[0.65,KH_I]],
KH_B=[[0,KH_I],[0.07,[0.12,1.55,0.15,-1.5,0.7]],[0.18,[-0.32,1.06,0.36,1.5,-0.35]],[0.42,[-0.3,1.08,0.34,1.4,-0.3]],[0.65,KH_I]],
KH_S=[[0,KH_I],[0.2,[-0.4,1.35,-0.05,2.3,0.15]],[0.32,[0.33,1.3,0.25,-2.0,0]],[0.75,[0.31,1.3,0.25,-1.9,0]],[1,KH_I]],
HH_I=[-0.24,1.15,0.3,0.5,1.3],HH_R=[-0.3,1.55,0.06,-0.5,2.0],HH_D=[-0.04,1.02,0.42,0.05,-0.8],
HH_S=[[0,HH_R],[0.12,HH_D],[0.45,HH_D],[0.8,HH_I]],HH_SP=[[0,HH_I],[0.3,HH_R],[0.4,[-0.32,1.62,0.03,-0.55,2.15]],[0.47,HH_D],[0.95,HH_D],[1.3,HH_I]],
HB_I=[-0.27,1.22,0.3],HB_T=[[0,HB_I],[0.16,[-0.33,1.78,-0.2]],[0.27,[-0.12,1.62,0.5]],[0.5,[-0.04,1.15,0.4]],[0.85,HB_I]];
// body twist / bend for the swing (before heroGlobals)
function wpHeroBody(o,wp){const k=WPN[wp].kind,at=o.at==null?9:o.at,ak=o.ak|0;let tw=0,bd=0;
if(k==='katana'){if(ak===1)tw=kf([[0,0],[0.07,-0.45],[0.18,0.5],[0.45,0.4],[0.65,0]],at);else if(ak===2)tw=kf([[0,0],[0.07,0.4],[0.18,-0.45],[0.45,-0.35],[0.65,0]],at);else if(ak===7)tw=kf([[0,0],[0.2,-0.7],[0.32,0.7],[0.75,0.6],[1,0]],at)}
else if(k==='hammer'){if(ak===4)bd=kf([[0,-0.1],[0.12,0.45],[0.45,0.45],[0.8,0]],at);else if(ak===3)bd=-0.12*sat(at/0.2);else if(ak===8)bd=kf([[0,0],[0.3,-0.15],[0.47,0.5],[0.95,0.5],[1.3,0]],at)}
else if(W2K[k])w2HeroBody(o,k,at,ak);
else if(k==='bomb'&&(ak===5||ak===6))tw=kf([[0,0],[0.16,-0.45],[0.27,0.4],[0.5,0.25],[0.85,0]],at);
if(tw){hRot('spine',HY,tw*0.5);hRot('chest',HY,tw*0.5)}if(bd){hRot('spine',HX,bd*0.6);hRot('chest',HX,bd*0.4)}}
// arms (IK) and the weapon frame WF; the weapon hangs on the right wrist the IK actually reached
function wpHeroArms(o,wp,A,pit){const w=WPN[wp],k=w.kind,at=o.at==null?9:o.at,ak=o.ak|0,Hh=HERO;let P,f,u,s=1,show=1,tip=[0,0,-0.6],pr=[-1,-0.35,-0.1],tr=-1.2,lp=[0.6,-0.8,0],tl=1.3,L=null;
if(k==='gun'||k==='rail'){const R=m3axis(HX,-pit),r=m3v(R,[HERO_GUN_X+0.02,-0.12,0.13-(o.fireT>0?0.03:0)]);P=[A[0]+r[0],A[1]+r[1],A[2]+r[2]];f=m3v(R,[0,0,1]);u=m3v(R,[0,1,0]);tip=w.muz}
else if(k==='katana'){const K=ak===1?KH_A:ak===2?KH_B:ak===7?KH_S:[[0,KH_I]],v=kf(K,at),v2=kf(K,at+0.03);P=[v[0],v[1]+Math.sin(now*2)*0.01,v[2]];f=dirYE(v[3],v[4]);const f2=dirYE(v2[3],v2[4]),m=[f2[0]-f[0],f2[1]-f[1],f2[2]-f[2]];
 u=Math.hypot(m[0],m[1],m[2])>0.02?[-m[0],-m[1],-m[2]]:[0,0.3,-1];pr=[-1,-0.6,0];lp=[1,-0.6,0];tr=-0.5;tl=0.5;tip=[0,0,-0.76]}
else if(k==='hammer'){let v;if(ak===3&&o.hc!=null){v=HH_I.map((a,j)=>a+(HH_R[j]-a)*sat(at/0.2));v[1]+=Math.sin(now*40)*0.008*(o.hc||0)}else v=kf(ak===4?HH_S:ak===8?HH_SP:[[0,HH_I]],at);
 P=[v[0],v[1],v[2]];f=dirYE(v[3],v[4]);u=[0,-f[2],f[1]];/* head axis = local Y in the swing plane, the flared face (+Y) leading */pr=[-1,-0.5,0];lp=[1,-0.5,0];tip=[0,0,-0.84]}
else if(W2K[k])return w2HeroArms(o,w,A,pit,at,ak);
else{const th=ak===5||ak===6;P=th?kf(HB_T,at):HB_I;f=[0,0,1];u=[0,1,0];L=[0.24,1.12,0.2];lp=[1,-0.8,0.2];
 show=(!th||at<0.24||at>0.75)&&(o.bombs==null||o.bombs>0||(ak===6&&at<0.24));s=ak===6&&at<0.24?2.6:1.5;tip=[0.035,0.19,0]}
heroArm('R',P,pr,tr);P=Hh.GT[Hh.bi.hand_R].slice();
if(k==='gun'||k==='rail')L=[P[0]+f[0]*w.fore-u[0]*0.015,P[1]+f[1]*w.fore-u[1]*0.015,P[2]+f[2]*w.fore-u[2]*0.015];
else if(k==='katana')L=[P[0]-f[0]*0.14,P[1]-f[1]*0.14,P[2]-f[2]*0.14];else if(k==='hammer'){const d=0.27-0.37*sat((f[1]-0.3)/0.4);/* raised: the left hand drops below the right so the arm never crosses the head */L=[P[0]+f[0]*d,P[1]+f[1]*d,P[2]+f[2]*d]}
if(L)heroArm('L',L,lp,tl);if(k==='bomb')P=[P[0],P[1]+0.07*s,P[2]+0.04];
wpFrame(P,f,u,s);return{show,tip}}
// inside the hero's model matrix: the weapon, and the muzzle / tip point o.gx/gy/gz
function wpHeroDraw(o,wp,fr){const g=gId;gId=0;mPush();mApply(WF);if(fr.show)wpModel(wp,null,1);const t=fr.tip;
o.gx=M[0]*t[0]+M[4]*t[1]+M[8]*t[2]+M[12];o.gy=M[1]*t[0]+M[5]*t[1]+M[9]*t[2]+M[13];o.gz=M[2]*t[0]+M[6]*t[1]+M[10]*t[2]+M[14];if(W2K[WPN[wp].kind])w2HeroExtra(o,WPN[wp]);mPop();gId=g}
// ================= HUD / overlays =================
function wpHUD(w){if(w.kind==='rail'){const v=pl.heat||0;gauge(W/2-110,662,250,18,v,pl.ovh?(Math.sin(now*16)>0?'#ff3b30':'#ffd91a'):v>0.75?'#ff8a2b':'#59d8ff','熱');if(pl.ovh)txt('冷却中…',W/2+15,634,24,'#fff',INK,6)}
else if(w.kind==='bomb'){for(let i=0;i<3;i++){const x=W/2-60+i*60,y=672,on=i<pl.bombs;ctx.beginPath();ctx.arc(x+3,y+4,19,0,TAU);ctx.fillStyle=INK;ctx.fill();ctx.beginPath();ctx.arc(x,y,19,0,TAU);ctx.fillStyle=on?'#e5402b':'rgba(255,255,255,.55)';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();
  if(!on){const q=pl.bq&&pl.bq[i-pl.bombs];ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,16,-PI/2,-PI/2+TAU*sat(1-(q==null?WB_RF:q)/WB_RF));ctx.closePath();ctx.fillStyle='#ff9a7a';ctx.fill()}ctx.fillStyle=INK;ctx.fillRect(x-4,y-27,8,9)}}
else if(w.kind==='hammer'&&pl.hon)gauge(W/2-100,662,230,18,pl.hc,pl.hc>=1?(Math.sin(now*16)>0?'#fff':'#ffc21a'):'#ffc21a','溜');
else w2HUD(w)}
// special timer for the timed ones (珠時雨 / 妖光・氷牢)
function wpSpHUD(w){if(pl.sp!==2||(w.spMode!=='buff'&&w.spMode!=='mode'))return;const r=sat(1-pl.spT/spDur());txt(w.sp,W/2,588,24,'#fff',INK,6);gauge(W/2-90,604,220,14,r,'#35e0ff','')}
function wpOverlay(){if(G.state!=='play')return;
if(pl.cutT>0){const t=0.55-pl.cutT,g=easeOut(sat(t/0.08)),a=sat(pl.cutT/0.2);ctx.save();ctx.globalAlpha=a;ctx.translate(W/2,H/2);ctx.rotate(0.45);const L=W*0.75*g,hw=Math.max(3,22*(1-t*1.2));
 ctx.beginPath();ctx.moveTo(-L,0);ctx.quadraticCurveTo(0,-hw*1.6,L,0);ctx.quadraticCurveTo(0,hw*1.6,-L,0);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();
 ctx.beginPath();ctx.moveTo(-L*0.9,0);ctx.lineTo(L*0.9,0);ctx.strokeStyle='#59d8ff';ctx.lineWidth=3;ctx.stroke();ctx.restore();
 if(t>0.06){const k=easeBack(sat((t-0.06)/0.15));ctx.save();ctx.globalAlpha=a;ctx.translate(W*0.24,H*0.66);ctx.rotate(-0.12);ctx.scale(k,k);txt('一閃',0,0,110,'#fff',INK,16,'center','#59d8ff',30);ctx.restore()}}
if(pl.crackT>0&&pl.crk){const a=sat(pl.crackT/0.3),j=pl.crackT>0.85?rnd(-6,6):0;ctx.save();ctx.globalAlpha=a;ctx.translate(j,j*0.6);ctx.lineCap='square';
 for(const[lw,c]of[[30,INK],[16,'#fff']]){ctx.strokeStyle=c;ctx.lineWidth=lw;ctx.beginPath();for(const l of pl.crk){ctx.moveTo(l[0],l[1]);ctx.lineTo(l[2],l[3])}ctx.stroke()}
 if(pl.crackT>0.5){const k=easeBack(sat((1.1-pl.crackT)/0.15));ctx.save();ctx.translate(W*0.3,H*0.34);ctx.rotate(-0.08);ctx.scale(k,k);txt('駒砕き',0,0,96,'#ffd91a',INK,16,'center','#fff',30);ctx.restore()}ctx.restore()}}
// ================= EQUIP SCREEN (G.menu 'equip') =================
let eqSel=-1,eqPop=-9,eqDet=0;const EQ={px:612,py:196,pw:618,ph:236};
// 装備リスト: 2列で、武器が増えると行が増える。縦にスクロールできる（ドラッグ・スワイプ（慣性つき）・マウスホイール）。カードはタップを離したときに選び、動かしたときは選ばない
const EQL={x0:40,cw:250,gap:10,ch:84,pitch:96,cols:2,vy:196,vh:418,y:0,v:0,id:null,py:0,mv:0,lp:null};
const eqRows=()=>Math.ceil(WPN.length/EQL.cols),eqMax=()=>Math.max(0,eqRows()*EQL.pitch-(EQL.pitch-EQL.ch)-EQL.vh+6);
function eqShow(i){const r=(i/EQL.cols)|0,t=r*EQL.pitch;if(t<EQL.y)EQL.y=t;else if(t+EQL.ch>EQL.y+EQL.vh-6)EQL.y=t+EQL.ch-EQL.vh+6;EQL.y=clamp(EQL.y,0,eqMax());EQL.v=0}
function openEquip(back){G.menu='equip';G.eqBack=back||'main';eqSel=wpIdx(WS.eq);eqDet=0;EQL.id=null;eqShow(eqSel)}
function eqOn(){return G.state==='menu'&&G.menu==='equip'&&!setOpen&&!wipe.on}
function eqTouch(ph,p,id){if(!eqOn()){EQL.id=null;return false}
if(ph==='d'){if(p.x<EQL.x0-10||p.x>EQL.x0+EQL.cols*(EQL.cw+EQL.gap)||p.y<EQL.vy-6||p.y>EQL.vy+EQL.vh)return false;EQL.id=id;EQL.py=p.y;EQL.mv=0;EQL.v=0;EQL.lp=p;return true}
if(EQL.id!==id)return false;
if(ph==='m'){const dy=p.y-EQL.py;EQL.py=p.y;EQL.mv+=Math.abs(dy);EQL.y=clamp(EQL.y-dy,-60,eqMax()+60);EQL.v=lerp(EQL.v,-dy*60,0.5);EQL.lp=p;return true}
EQL.id=null;if(EQL.mv<14&&EQL.lp){EQL.v=0;const lx=EQL.lp.x-EQL.x0,ly=EQL.lp.y-EQL.vy+EQL.y,c=Math.floor(lx/(EQL.cw+EQL.gap)),r=Math.floor(ly/EQL.pitch),i=r*EQL.cols+c;
 if(lx>=0&&ly>=0&&c>=0&&c<EQL.cols&&lx-c*(EQL.cw+EQL.gap)<EQL.cw&&ly-r*EQL.pitch<EQL.ch&&i<WPN.length){eqSel=i;snd('ui')}}return true}
function eqWheel(e){if(!eqOn())return false;EQL.v+=e.deltaY*6;return true}
// 詳細: the numbers behind each weapon (no skills / power-ups); [label, value] rows, '' label = section heading
const eqF1=v=>(Math.round(v*10)/10).toString(),eqR0=v=>Math.round(v).toString();
function wpStats(w){const gun=(dm,cool,n)=>[['威力',dm+(n?' × '+n+'粒':'')],['連射','毎秒 '+eqF1(1/cool)+' 発'],['装弾数',w.mag+' 発'],['装填',eqF1(w.rel)+' 秒']],gp=['必殺ゲージ','たまり方 ×'+w.g];
switch(w.id){
case'gun':return[...gun(w.dmg,w.cool),['秒間ダメージ','約 '+eqR0(w.dmg/w.cool)],['射程','140 m'],gp,['','必殺 '+w.sp],['光線','毎秒 1400・'+w.spd+' 秒間'],['範囲','正面の太い一直線・墨弾も消す']];
case'rifle':return[...gun(w.dmg,w.cool),['秒間ダメージ','約 '+eqR0(w.dmg/w.cool)],['反動','なし'],gp,['','必殺 '+w.sp],['時間',w.spd+' 秒間'],['効果','弾が減らない・連射２倍（毎秒 '+eqR0(2/w.cool)+' 発）・弾が敵を追う']];
case'shotgun':return[...gun(w.dmg,w.cool,w.pel),['距離','3 m 以内 ×1.55 → 15 m 以上 ×0.3'],['１発の最大','約 '+eqR0(w.dmg*w.pel*1.55)],['鎧鬼','近くで３粒当てるとのけぞる'],gp,['','必殺 '+w.sp],['威力','34 × 36粒・壁も敵も貫通'],['射程','45 m']];
case'rail':return[['威力',RAIL_DM+'（0.06 秒ごと）'],['秒間ダメージ','約 '+eqR0(RAIL_DM/0.06)+'・敵をすべて貫通'],['熱','4.7 秒撃ち続けると過熱'],['冷却','過熱したら約 2 秒撃てない'],['射程','120 m（壁まで）'],gp,['','必殺 '+w.sp],['光線',RAIL_ICE+'（0.06 秒ごと）・毎秒 約 '+eqR0(RAIL_ICE/0.06)],['時間',w.spd+' 秒間・熱なし'],['凍結','3 秒・凍った敵は被ダメ ×1.5'],['ボス','凍らない代わりに動きが鈍る']];
case'katana':return[['威力','62'],['振る間隔','0.42 秒（毎秒 約 2.4 回）'],['秒間ダメージ','約 '+eqR0(62/0.42)],['範囲','前方 3.5 m・左右 70°'],['踏み込み','7.5 m 以内の正面の敵へ最大 5.5 m'],['墨弾','斬って消せる'],gp,['','必殺 '+w.sp],['威力','430・敵ごとに１回'],['範囲','幅 15 m・80 m 先まで・壁を越える']];
case'hammer':return[['威力','55 〜 160（溜めで上がる）'],['溜め','最大まで 1.1 秒'],['範囲','2.1 m 前・半径 2.8 〜 6.2 m'],['振る間隔','0.5 秒'],['鎧鬼','怯ませる'],['小鬼','はじき飛ばす'],gp,['','必殺 '+w.sp],['威力','380'],['範囲','自分のまわり 半径 16 m']];
case'flail':{const F=W2.fl;return[['溜め','最大まで '+F.chg+' 秒・３段階'],['投げ','威力 '+F.dm.join(' / ')+'・届く距離 '+F.R.join(' / ')+' m'],['振り回し','溜め中、まわり '+F.spinR+' m に '+F.spinDm+'（'+F.spinT+' 秒ごと）'],['３段目','鎧鬼を怯ませる'],gp,['','必殺 '+w.sp],['叩きつけ','４回 '+F.slam+'（半径 '+F.slamR+' m）＋ 前方 '+F.last+'（半径 '+F.lastR+' m）'],['そのあと','攻撃力 ×'+F.buf+'・'+F.bufT+' 秒']]}
case'spear':{const S=W2.sp;return[['威力',S.dm.join(' / ')+'（３連突き）'],['範囲','前方 '+S.R+' m・左右 '+Math.round(S.A*57)+'°'],['斬撃',S.wvDm+'・'+S.wv+' m 先まで・２体まで'],['雷','しびれて '+S.stun+' 秒止まる（ボス '+S.bstun+' 秒）・'+S.zap+' ダメージ'],gp,['','必殺 '+w.sp],['時間',w.spd+' 秒間'],['突き','前方 '+S.spR+' m・威力 ×'+S.spK],['斬撃',S.spWv+' m 先まで・何体でも貫通']]}
case'bow':{const S=W2.bw;return[['威力',S.dm+' 〜 '+S.dm*3+'（溜めで上がる）'],['溜め','最大まで '+S.chg+' 秒'],['貫通','１体 〜 ５体（溜めで増える）'],['射る間隔','0.22 秒'],gp,['','必殺 '+w.sp],['矢の雨',S.rain+'（0.12 秒ごと・'+S.rainT+' 秒間）・半径 '+S.rainR+' m'],['残った矢','約 '+S.zoneT+' 秒・中では溜めが ×'+S.zoneK+' 速い']]}
case'shield':{const S=W2.sh;return[['押す',S.bash+'（ダッシュ中・直後は '+S.dash+'）・前方 '+S.R+' m'],['のけぞり','雑魚敵だけ少し止まる'],['防御','正面の攻撃を防ぐ・移動 ×'+S.slow],['はね返し','押してから・離してから '+S.jg+' 秒以内の弾'],['返した弾','元の威力 ×'+S.refl+' ＋20'],gp,['','必殺 '+w.sp],['時間',w.spd+' 秒間'],['バリア','前方 '+S.barR+' m・敵の弾を止める']]}
case'staff':{const S=W2.st;return[['玉','敵に '+S.dm+'・味方は '+Math.round(S.heal*100)+'% 回復＋'+S.bT+'秒の加護'],['間隔',S.cool+' 秒'],['追尾','味方を少し追う'],['殴り','近くの敵に '+S.bonk],gp,['','必殺 '+w.sp],['効果','全員を回復・ダウンした味方を復活（いつでも使える）'],['加護',Math.round(S.sT)+'秒 ダメージ軽減＋攻撃力アップ（凸で強まる）']]}
case'bomb':return[['威力','130（爆風の端では 65）'],['爆風','半径 4.3 m・ボスにも当たる'],['所持','3 個'],['補充','投げた玉それぞれ '+WB_RF+' 秒で１個戻る'],['投げる間隔','0.5 秒'],['味方・自分','巻き込まない'],gp,['','必殺 '+w.sp],['威力','520（端では 260）・半径 9 m'],['炎','6 秒・毎秒 60（ボスに付くと ×1.5）']]}
return[]}
function drawEqDet(w,X,Y,PW,PH){panel(X,Y,PW,PH);const rows=wpStats(w),n=rows.length,lh=Math.min(36,(PH-70)/n);
para(X+16,Y-22,240,44,12);ctx.fillStyle=w.col;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();txt(w.name+'の性能',X+40,Y+1,24,'#fff',INK,6,'left');
let y=Y+44;for(const[l,v]of rows){if(!l){ctx.fillStyle='#e5402b';ctx.fillRect(X+18,y-lh*0.42,PW-36,lh*0.84);txt(v,X+30,y+1,Math.min(22,lh*0.62),'#fff',null,0,'left')}
 else{txt(l,X+30,y+1,Math.min(19,lh*0.55),'#555a70',null,0,'left');fitTxt(v,X+176,y+1,Math.min(21,lh*0.6),PW-200,INK);ctx.fillStyle='rgba(22,18,31,.15)';ctx.fillRect(X+24,y+lh/2-1,PW-48,2)}y+=lh}
txt('※スキル・強化アイテムなしの値',X+PW-20,Y+PH-18,15,'#555a70',null,0,'right')}
function fitTxt(s,x,y,size,maxw,fill,al){ctx.font='900 '+size+'px '+FONT;const w=ctx.measureText(s).width;if(w>maxw)size=Math.floor(size*maxw/w);txt(s,x,y,size,fill,null,0,al||'left')}
function drawEquip(dt){const sel=eqSel<0?wpIdx(WS.eq):eqSel,w=WPN[sel],ok=wpOwn(sel),eqI=wpCur(),isEq=ok&&sel===eqI,X=EQ.px,Y=EQ.py,PW=EQ.pw,PH=EQ.ph;
ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.rect(X,Y,PW,PH);ctx.clip('evenodd');ctx.fillStyle='rgba(22,18,31,.55)';ctx.fillRect(0,0,W,H);focusLines(W/2,H/2,520,44,'rgba(255,255,255,.14)',7);ctx.restore();
drawLogo(250,70,0.34);head('武器の装備');
// list（2列・縦スクロール。リストの枠の外はクリップする）
dt=dt||0.016;if(EQL.id===null){EQL.y+=EQL.v*dt;EQL.v*=Math.exp(-5*dt);const c=clamp(EQL.y,0,eqMax());if(c!==EQL.y){EQL.y=lerp(EQL.y,c,Math.min(1,dt*12));EQL.v=0}}
ctx.save();ctx.beginPath();ctx.rect(EQL.x0-14,EQL.vy-12,560,EQL.vh+18);ctx.clip();
for(let i=0;i<WPN.length;i++){const c=i%EQL.cols,r=(i/EQL.cols)|0,x=EQL.x0+c*(EQL.cw+EQL.gap),y=EQL.vy+r*EQL.pitch-EQL.y,cw=EQL.cw,ch=EQL.ch,wi=WPN[i],o=wpOwn(i),s=i===sel,e=o&&i===eqI;
 if(y>EQL.vy+EQL.vh+12||y+ch<EQL.vy-12)continue;
 para(x+5,y+7,cw,ch,12);ctx.fillStyle=INK;ctx.fill();para(x,y,cw,ch,12);ctx.fillStyle=o?'#fff':'#4d5370';ctx.fill();
 ctx.save();para(x,y,cw,ch,12);ctx.clip();ctx.fillStyle=o?wi.col:'#373c58';ctx.fillRect(x,y,24,ch);ctx.globalAlpha=0.18;ctx.fillStyle=dotPat;ctx.fillRect(x,y+ch*0.55,cw+20,ch);ctx.restore();
 para(x,y,cw,ch,12);ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();if(s){para(x-5,y-5,cw+10,ch+10,13);ctx.strokeStyle='#ffd91a';ctx.lineWidth=6;ctx.stroke()}
 fitTxt(o?wi.name:'？？？',x+38,y+32,24,cw-46,o?INK:'#c9cce0');if(!o)txt('未入手',x+40,y+62,15,'#a5a9c4',null,0,'left');
 if(e){ctx.save();ctx.translate(x+cw-40,y+60);ctx.rotate(-0.12);para(-40,-15,80,30,6);ctx.fillStyle='#e5402b';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();txt('装備中',3,1,18,'#fff');ctx.restore()}}
 ctx.restore();
// scroll bar + more-below hint
const mx=eqMax();if(mx>0){const tx=594,th=Math.max(46,EQL.vh*EQL.vh/(EQL.vh+mx)),ty=EQL.vy+clamp(EQL.y/mx,0,1)*(EQL.vh-th);ctx.fillStyle='rgba(22,18,31,.35)';ctx.fillRect(tx,EQL.vy,8,EQL.vh);ctx.fillStyle='#ffd91a';ctx.fillRect(tx,ty,8,th);ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.strokeRect(tx,ty,8,th);
 if(Math.sin(now*6)>-0.3){if(EQL.y<mx-8)txt('▼',EQL.x0+EQL.cols*(EQL.cw+EQL.gap)/2-6,EQL.vy+EQL.vh-8,30,'#ffd91a',INK,6);if(EQL.y>8)txt('▲',EQL.x0+EQL.cols*(EQL.cw+EQL.gap)/2-6,EQL.vy-4,30,'#ffd91a',INK,6)}}
// preview frame (the 3D weapon is drawn through the hole by wpPreview)
ctx.fillStyle=INK;ctx.fillRect(X+PW,Y+10,9,PH);ctx.fillRect(X+9,Y+PH,PW,10);ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.strokeRect(X,Y,PW,PH);
if(!ok)txt('？',X+PW-50,Y+50,64,'#fff',INK,10);
// info
panel(X,Y+PH+18,PW,170);const iy=Y+PH+18;para(X+16,iy-26,Math.min(PW-40,60+w.name.length*34),48,14);ctx.fillStyle=ok?w.col:'#4d5370';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();
txt(ok?w.name:'？？？',X+40,iy-1,32,'#fff',INK,7,'left');txt(ok?w.type:'',X+PW-24,iy+22,18,'#555a70',null,0,'right');
const tag=(x,y,s,col)=>{para(x,y-15,60,30,8);ctx.fillStyle=col;ctx.fill();txt(s,x+33,y+1,17,'#fff')};
if(ok){tag(X+18,iy+50,'通常',INK);fitTxt(w.d[0],X+92,iy+50,21,PW-110,INK);fitTxt(w.d[1],X+92,iy+80,18,PW-110,'#3a3f55');
 tag(X+18,iy+122,'必殺','#e5402b');txt(w.sp,X+92,iy+120,26,'#e5402b',null,0,'left');if(w.id!=='gun'){const ul=WS.own[w.id]&&(WS.up[w.id]|0)>0&&wpLv(w.id)<WLV;txt('必殺Lv'+wpLv(w.id)+(ul?'（「強化」で上げられる）':''),X+PW-24,iy+120,18,'#e5402b',null,0,'right')}fitTxt(w.s,X+92,iy+150,18,PW-110,INK)}
else{txt('武器ガチャで入手できる',X+PW/2,iy+68,24,INK);txt('（モード選択の「ガチャ」から）',X+PW/2,iy+108,20,'#555a70')}
if(eqDet&&ok)drawEqDet(w,X,Y,PW,PH+188);
if(DEV)txt('超強化中：すべての武器が使えます',306,659,16,'#ffd91a',INK,5,'left');
B(60,628,220,56,'もどる',()=>{G.menu=G.eqBack||'main'},{size:26});
wpUpBtn(w,X+PW-624,628,148,62,ok);// 必殺 level-up (gacha.js)
B(X+PW-462,628,148,62,eqDet&&ok?'閉じる':'詳細',ok?()=>{eqDet=eqDet?0:1;snd('ui')}:null,{col:!ok?'#d8d8e0':eqDet?'#59d8ff':'#fff',size:28});
B(X+PW-300,628,300,62,!ok?'未入手':isEq?'装備中':'装備する',()=>{if(ok&&!isEq){WS.eq=w.id;wsSave();snd('item');eqPop=now}},{col:!ok?'#d8d8e0':isEq?'#ffd91a':'#ff4a3d',tc:ok&&!isEq?'#fff':INK,size:30});
if(now-eqPop<0.7){const u=now-eqPop,k=easeBack(sat(u/0.15));ctx.save();ctx.globalAlpha=sat((0.7-u)/0.2);ctx.translate(X+PW-150,612);ctx.rotate(-0.1);ctx.scale(k*0.7,k*0.7);burstPath(4,5,120,44,14,1.25,7);ctx.fillStyle=INK;ctx.fill();burstPath(0,0,120,44,14,1.25,7);ctx.fillStyle='#ffd91a';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();txt('装備！',0,2,44,'#e5402b',INK,6,'center','#fff',12);ctx.restore()}}
// 3D preview inside the equip window (camera space, layer 2): a light backdrop and the weapon turning slowly
// largest scale that keeps the centred box inside the window over every angle the preview turns through, with perspective (cached per weapon and screen)
// 装備画面での向き: ry=回転の中心の角度（既定は真横=PI/2）、roll=画面内で回す角度。弓は縦長なので横に寝かせ、盾は薄い板なので正面から見せる
const WPV={bow:{roll:PI/2},shield:{ry:0}};
const wpPv=w=>{const v=WPV[w.id]||{};return{ry:v.ry==null?PI/2:v.ry,roll:v.roll||0}};
const WFIT={};
function wpFit(w,mn,mx,cx,cy,hw,hh,D){const pv=wpPv(w),cr=Math.cos(pv.roll),sr=Math.sin(pv.roll),key=w.id+'|'+W+'|'+H+'|'+cx.toFixed(3)+'|'+cy.toFixed(3)+'|'+hw.toFixed(3);if(WFIT[key])return WFIT[key];const c=[0,1,2].map(k=>(mn[k]+mx[k])/2),rots=[],pts=[];if(w.kind==='bomb')for(let k=0;k<12;k++)rots.push([k/12*TAU,0]);else for(let k=0;k<=16;k++)rots.push([pv.ry+0.4*Math.sin(k/16*TAU),0.15]);
for(const[ry,rx]of rots){const cyr=Math.cos(ry),syr=Math.sin(ry),cxr=Math.cos(rx),sxr=Math.sin(rx);for(let k=0;k<8;k++){const p=[(k&1?mx[0]:mn[0])-c[0],(k&2?mx[1]:mn[1])-c[1],(k&4?mx[2]:mn[2])-c[2]],y1=p[1]*cxr-p[2]*sxr,z1=p[1]*sxr+p[2]*cxr;{const px=p[0]*cyr+z1*syr;pts.push([px*cr-y1*sr,px*sr+y1*cr,-p[0]*syr+z1*cyr])}}}
const ok=sc=>pts.every(([x,y,z])=>[z,-z].every(z=>{const d=D-sc*z;return d>0.05&&Math.abs((cx*D+sc*x)/d-cx)<=hw*0.86&&Math.abs((cy*D-0.02+sc*y)/d-cy)<=hh*0.8}));
let lo=0,hi=8;for(let k=0;k<30;k++){const m=(lo+hi)/2;if(ok(m))lo=m;else hi=m}
if(!w.file||WMOD[w.id])WFIT[key]=lo;return lo}
function wpPreview(){if(G.state!=='menu'||G.menu!=='equip')return;const i=eqSel<0?wpIdx(WS.eq):eqSel;wpPreviewIn(i,EQ,wpOwn(i))}
// weapon i turning inside the screen rectangle R {px,py,pw,ph} (also the gacha screen); ok=false draws a dark silhouette
function wpPreviewIn(i,R,ok){const w=WPN[i];curLayer=2;mPush();M.set(CAMW);
const tn=Math.tan(cam.fov/2),asp=W/H,D=1.3,cx=((R.px+R.pw/2)/W*2-1)*tn*asp,cy=(1-(R.py+R.ph/2)/H*2)*tn,hw=R.pw/W*tn*asp,hh=R.ph/H*tn,D2=D*1.5;
mPush();mT(cx*D2,cy*D2,-D2);mS(hw*2*D2+0.06,hh*2*D2+0.06,1);emit(QUAD,ok?w.bg:[.78,.8,.88],0,0,F_UNLIT|F_NOCAST,0);mPop();
mT(cx*D,cy*D-0.02,-D);const md=w.file&&WMOD[w.id],mn=md?md.mn:[-0.08,-0.19,-0.63],mx=md?md.mx:[0.08,0.12,0.12],sc=wpFit(w,mn,mx,cx,cy,hw,hh,D);
if(w.kind==='bomb')mRY(now*0.8);else{const pv=wpPv(w);mRZ(pv.roll);mRY(pv.ry+0.4*Math.sin(now*0.7));mRX(0.15)}mS(sc,sc,sc);mT(-(mn[0]+mx[0])/2,-(mn[1]+mx[1])/2,-(mn[2]+mx[2])/2);
if(md)wpModel(i,ok?null:C.inkD);else if(!w.file){if(ok)drawYoGun(0,1);else{mPush();drawYoGun(0,0);mPop()}}
mPop();curLayer=1}
