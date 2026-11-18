'use strict';
// ================= STAGE 5 BOSS: 大海魔クラーケン (STORY.md 5) =================
// A giant octopus of the deep, swollen with 墨穢れ, rises out of the sea in front of the bow (body around z -48, the deck ends at z -31.6).
// It runs on the stage 1-3 boss machine (boss123.js updBoss2: its two club-tipped attack tentacles are the "hands" hL / hR, net sync through m.b);
// krPre handles the form change and its own attacks. Asks for: 位置取り and reading the tentacles.
//   第1形態 (crimson, the ink seal 三つ巴 on its brow = weak point): tentacle club slams, 舷側叩き (tentacles rise along the hull and slam
//          across the deck: leave the red bands), ink lobs, a tentacle sweep along the deck (jump), 墨の噴射 (ink jets along red bands: blinds), summons.
//   第2形態 (HP half: it sinks, the seal cracks and it bursts up again ink-black with glowing red veins, spikes, a third eye (the weak point)
//          and an open beak; a storm breaks): two clubs at once, more and faster bands, 大渦 (a whirlpool off the bow drags everyone to the
//          bow: dash / jump to fight it), 墨の津波 (a wall of ink: jump), extra tentacles coil over the rails.
// Hazards (side slams, ink jets, the whirlpool) are local lists started by FXE events: every peer checks its own player (like shz in boss5.js).
Object.assign(C,{krR:hex(0xa3283f),krRD:hex(0x6e1730),krRU:hex(0xe58a8e),krB:hex(0x231a33),krBD:hex(0x120d1d),krBU:hex(0x4b3a5c),krS:hex(0xf5dccb),krS2:hex(0x8e7f99)});
const KR_Z=-48;// the body's base (world z); the head's front is around z -35
// ---- tuning (目安。遊んで調整する) ---- [form 1, form 2] where two values are given
BT.kraken={hp:5800,cd:0.62,up:[0.85,0.62],hold:[1.0,0.7],slamDmg:26,up2:0.95,volN:[6,9],sumN:[2,3],waveTel:0.85,waveN:[1,2],
 swTel:[0.95,0.75],swDur:[1.0,0.85],swDmg:20,swR:38,
 sideTel:[1.15,0.9],sideN:[2,4],sideDmg:22,sideW:3.6,sideL:24,
 jetTel:[1.0,0.8],jetN:[3,5],jetDmg:14,jetBlind:2.4,jetLife:1.0,jetW:1.6,
 whTel:1.0,whDur:4.2,whV:4.4,whDmg:12,whZ:-19.5,
 brk:3.4,say2:['墨ニ','染マレ!!'],
 // [普通1, 普通2, -, 極1, 極2, -]
 pats:[['fist','side','volley','fist','sweep','inkjet','summon'],['double','side','whirl','fist','inkjet','wave','sweep','side','summon','fist'],null,
  ['fist','side','pillar','volley','sweep','inkjet','summon'],['double','side','whirl','pillar','inkjet','wave','sweep','fist','side','summon'],null]};
const krz=[];
const krF2=b=>b.phase>1&&!(b.st==='brk'&&b.stT<1.6);// drawn in the second form
const krYo=b=>{const u=b.stT;let y=b.yo+(krF2(b)?2.5:0);if(b.st==='brk')y+=u<1.6?-Math.sin(u/1.6*PI*0.5)*7:-7*(1-easeOut(sat((u-1.6)/0.7)));if(b.st==='die')y-=u*u*5;return y};
const krS=b=>krF2(b)?1.12:1;
// local (kraken frame: x right, y up from the base, z forward = +z world) -> world
const krW=(b,x,y,z)=>{const s=krS(b);return[x*s,y*s+krYo(b),KR_Z+z*s]};
function krRestH(s,yo){return{x:s*8.5,y:Math.max(SEA_Y-3,1.7+Math.min(0,yo)),z:-30.4}}
function krMouth(b){return krW(b,0,3.2,14)}
function krCenter(e){const p=krW(e,0,12,8);return[p[0],p[1],p[2],9]}
// hit spheres: the weak point first (the seal / the third eye), then eyes, head, mantle, the two clubs
function krSph(e){const f2=krF2(e),s=krS(e),w=krW(e,0,15.2,11.1),out=[[w[0],w[1],w[2],2.4,2.5]];
for(const q of[-1,1]){const p=krW(e,q*6,11.5,11.4);out.push([p[0],p[1],p[2],2.3,f2?1.6:1.3])}
const h=krW(e,0,9.5,3.5),m=krW(e,0,24,-4);out.push([h[0],h[1],h[2],9.5*s,0.7],[m[0],m[1],m[2],10*s,0.45],[e.hL.x,e.hL.y,e.hL.z,2.0,1],[e.hR.x,e.hR.y,e.hR.z,2.0,1]);return out}
// ---- host: form change and the kraken's own attacks (true = handled this frame) ----
function krRest(b,dt,hands){for(let i=0;i<2;i++){const r=krRestH(i?1:-1,0),h=hands[i],k=Math.min(1,dt*4);h.x+=(r.x-h.x)*k;h.y+=(r.y-h.y)*k;h.z+=(r.z-h.z)*k}}
function krIdle(b,cd){b.st='idle';b.stT=0;b.cdT=cd;b.ah=-1}
function krPre(b,dt,hands){const K=BT.kraken,u=b.stT,st=b.st,pi=b.phase>1?1:0;
if(b.phase===1&&st!=='brk'&&b.hp<=b.mhp*0.5&&(st==='idle'||st==='hold')){b.phase=2;b.st='brk';b.stT=0;b.ah=-1;b.k=0;ev('krBrk');return true}
if(st==='brk'){b.mouth=u<1.6?0.3:1;krRest(b,dt,hands);if(!b.k&&u>=1.6){b.k=1;ev('krForm');ev('say',K.say2[0],K.say2[1],1)}if(u>K.brk)krIdle(b,0.4);return true}
// 舷側叩き: tentacles come up the hull and slam across the deck along red bands (near each player, then random)
if(st==='side'){b.mouth=0.5;krRest(b,dt,hands);if(!b.k){b.k=1;const n=K.sideN[pi]+(G.ex?1:0),L=[];
  for(const p of allP())if(!p.dead&&L.length<n)L.push([p.x<0?-1:1,r1(clamp(p.z+(p.vz||0)*0.4+rnd(-1,1),-22,21))]);
  for(let g=0;L.length<n&&g<40;g++){const z=r1(rnd(-22,21));if(L.every(q=>Math.abs(q[1]-z)>K.sideW+0.6))L.push([Math.random()<.5?-1:1,z])}
  ev('krSide',L,K.sideTel[pi])}
 if(u>K.sideTel[pi]+0.4*(K.sideN[pi]-1)+1.1)krIdle(b,pi?0.4:0.7);return true}
// 墨の噴射: ink jets from the beak along a fan of red bands (blinds)
if(st==='inkjet'){b.mouth=u<K.jetTel[pi]?0.6:1;krRest(b,dt,hands);if(!b.k){b.k=1;const P=bossT(b),a=Math.atan2(P.x,P.z+29.5);ev('krJet',r2(a),K.jetN[pi]+(G.ex?1:0),K.jetTel[pi])}
 if(u>K.jetTel[pi]+K.jetLife+0.6)krIdle(b,pi?0.4:0.8);return true}
// 大渦 (second form): a whirlpool off the bow drags everyone forward
if(st==='whirl'){b.mouth=1;krRest(b,dt,hands);if(!b.k){b.k=1;ev('krWhirl')}if(u>K.whTel+K.whDur+0.5)krIdle(b,0.5);return true}
return false}
// ---- FX events (host runs + broadcasts; hazards are checked by every peer for its own player) ----
Object.assign(FXE,{
krBrk(){krz.length=0;shake(0.7);snd('roar',1);lines(0.8,'#16121f');addText('ゴボゴボ…',W/2,H*0.3,{size:110,st:'ink',life:1.2});for(let i=0;i<10;i++)fxBlobs(rnd(-14,14),rnd(0,16),rnd(-40,-34),4,10,C.inkD,0.4)},
krForm(){flash(0.9);shake(1);stopT(0.12);snd('roar',1);snd('boom',1);addText('ズオォォッ！！',W/2,H*0.32,{size:130,st:'boom',life:1.2});
 for(let i=0;i<8;i++)explode(rnd(-14,14),rnd(4,24),rnd(-40,-34),2.6,{ink:1,quiet:1});fxRing(0,0.3,-30,40,C.red,0.6);for(let i=0;i<14;i++)fxSmoke(rnd(-20,20),SEA_Y+1,rnd(-44,-30),2,2.4,C.white,4)},
krSide(L,tel){for(let i=0;i<L.length;i++)krz.push({k:'side',s:L[i][0],z:L[i][1],t:-tel-i*0.4,hit:0});snd('charge');addText('ザザザ…',W/2,H*0.28,{size:90,st:'cyan',life:0.8})},
krJet(a,n,tel){const K=BT.kraken;for(let j=0;j<n;j++)krz.push({k:'jet',a:a+(j-(n-1)/2)*0.32,t:-tel,hit:0,ox:0,oz:-29.5});snd('charge');addText('ブクブク…',W/2,H*0.28,{size:90,st:'ink',life:0.8})},
krWhirl(){const K=BT.kraken;krz.push({k:'whirl',t:-K.whTel});snd('roar',0.8);lines(0.7,'#0f5a6a');addText('大渦！！',W/2,H*0.3,{size:120,st:'cyan',life:1.1})}});
function krHit(d,x,z,bl){const hp=pl.hp;hurtPlayer(d,x,z);if(bl&&pl.hp<hp)plBlind(bl);return pl.hp<hp}
function krTick(dt,live){const K=BT.kraken;
for(let i=krz.length-1;i>=0;i--){const h=krz[i],t0=h.t;h.t+=dt;
 if(h.k==='side'){if(t0<0&&h.t>=0){const x=h.s*(17.4-K.sideL/2);explode(x,0.6,h.z,1.6,{ink:1,text:'ドガァン！'});for(let j=0;j<5;j++)fxDebris(h.s*(16-j*4.5),0.4,h.z,3,7,C.deckS,0.35);shake(0.45);snd('boom',0.7);
   if(live&&Math.abs(pl.z-h.z)<K.sideW/2+0.4&&pl.x*h.s>17.4-K.sideL-0.4&&pl.y<2.6)krHit(K.sideDmg,h.s*17,pl.z)}
  if(h.t>1.5)krz.splice(i,1);continue}
 if(h.k==='jet'){if(h.t>K.jetLife){krz.splice(i,1);continue}if(h.t<0)continue;
  if(t0<0){snd('whoosh');for(let d=6;d<46;d+=7)decals.push({x:h.ox+Math.sin(h.a)*d,z:h.oz+Math.cos(h.a)*d,r:1.8,life:6})}
  if(lim('krjfx'+i,0.06)){const d=rnd(4,46);fxBlobs(h.ox+Math.sin(h.a)*d,0.6,h.oz+Math.cos(h.a)*d,2,5,C.inkD,0.16)}
  if(live&&!h.hit){const px=pl.x-h.ox,pz=pl.z-h.oz,al=px*Math.sin(h.a)+pz*Math.cos(h.a),pp=px*Math.cos(h.a)-pz*Math.sin(h.a);
   if(al>2&&Math.abs(pp)<K.jetW+0.4&&pl.y<1.6){h.hit=1;if(krHit(K.jetDmg,pl.x-Math.sin(h.a),pl.z-Math.cos(h.a),K.jetBlind))addText('墨ガ…！',W/2,H*0.62,{size:60,st:'ink',life:0.5})}}continue}
 if(h.k==='whirl'){if(h.t>K.whDur){krz.splice(i,1);continue}if(h.t<0||!live)continue;
  const dx=-pl.x*0.35,dz=-27-pl.z,d=Math.hypot(dx,dz)||1,v=K.whV*(pl.dashT>0?0.15:pl.y>0.05?0.55:1)*Math.min(1,h.t*2);pl.x+=dx/d*v*dt;pl.z+=dz/d*v*dt;collide(pl,0.5);
  if(lim('krwhfx',0.1))fxSmoke(rnd(-16,16),0.4,rnd(-20,10),1,1.2,C.white,2);
  if(pl.z<K.whZ&&pl.y<0.8&&lim('krwh',0.45)){if(krHit(K.whDmg,pl.x,pl.z-2))addText('引キ込マレル…！',W/2,H*0.62,{size:56,st:'cyan',life:0.45})}}}}
// ---- drawing ----
// a tentacle along a quadratic curve a -> c -> b, radius r0 -> r1; suckers on the inside of the curve. w = sideways wobble
function krTent(a,c,b,r0,r1,col,suck,w,ph,nn){const L=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2])+Math.hypot(c[0]-a[0],c[1]-a[1],c[2]-a[2])*0.3,n=nn||clamp(Math.ceil(L/1.5),8,30),t=now;
gId=nid();const P=[];for(let i=0;i<=n;i++){const u=i/n,A=(1-u)*(1-u),B=2*u*(1-u),Cc=u*u;let x=A*a[0]+B*c[0]+Cc*b[0],y=A*a[1]+B*c[1]+Cc*b[1],z=A*a[2]+B*c[2]+Cc*b[2];
 const wb=Math.sin(u*5.5-t*2.2+ph)*w*u*(1-u)*4;x+=wb;z+=wb*0.4;const r=lerp(r0,r1,u);P.push([x,y,z,r,u]);sph(x,y,z,r*2,r*2,r*2,col,0,.5)}gId=0;
for(let i=2;i<n;i+=2){const p=P[i],u=p[4],cx=lerp(a[0],b[0],u)-p[0],cy=lerp(a[1],b[1],u)-p[1],cz=lerp(a[2],b[2],u)-p[2],l=Math.hypot(cx,cy,cz);let ox=0,oy=-1,oz=0;if(l>0.5){ox=cx/l;oy=cy/l;oz=cz/l}
 const r=p[3];sph(p[0]+ox*r*0.82,p[1]+oy*r*0.82,p[2]+oz*r*0.82,r*0.75,r*0.75,r*0.75,suck,0,0)}return P}
function krClub(b,h,root,f2,sk,skD){mPush();mT(h.x,h.y,h.z);mRY(Math.atan2(h.x-root[0],h.z-root[2]));gId=nid();sph(0,0,0.4,3.2,1.4,4.8,sk,0,.5);sph(0,0.1,2.6,1.6,0.9,2.0,sk,0,.5);gId=0;
for(let i=0;i<4;i++)for(const q of[-1,1])sph(q*0.75,-0.55,-1.2+i*1.0,0.75,0.3,0.75,f2?C.krS2:C.krS);
if(f2)for(let i=0;i<5;i++)put(CONE,(i%2?1:-1)*1.25,0.2,-1.4+i*0.9,0,0,(i%2?-1:1)*1.2,0.35,0.9,0.35,C.white);mPop()}
// decorative tentacles in the sea around the body: [root x, root z, tip x, tip y, tip z]
const KR_DECO=[[-14,-40,-21,16,-33],[14,-40,21,16,-33],[-25,-46,-31,12,-40],[25,-46,31,12,-40],[-11,-54,-17,22,-60],[11,-54,17,22,-60]];
function drawKraken(b){const t=b.t,st=b.st,u=b.stT,f2=krF2(b),yo=krYo(b),S=krS(b),fl=b.flash>0?0.45:0,K=BT.kraken,NF=F_UNLIT|F_NOCAST,Y=SEA_Y,
 sk=f2?C.krB:C.krR,skD=f2?C.krBD:C.krRD,und=f2?C.krBU:C.krRU,suck=f2?C.krS2:C.krS,eye=f2?C.red:C.yellow,quake=st==='brk'&&u<1.6?Math.sin(u*60)*0.25:0,up=sat((yo+38)/38);
// churned sea around the body
for(let i=0;i<16;i++){const a=i/16*TAU+t*0.3,r=17+Math.sin(t*2+i)*1.2;sph(Math.sin(a)*r,Y+0.1,KR_Z+2+Math.cos(a)*r*0.6,5,0.4,3,C.seaFoam,0,0,NF)}
gTint=fl;mPush();mT(quake,yo,KR_Z);mS(S,S,S);
// head + mantle (one silhouette)
gId=nid();sph(0,9.5,3.5,23,18,18,sk,0,.5);mPush();mT(0,17,-2);mRX(-0.45+Math.sin(t*0.8)*0.04);sph(0,6,0,20,30,19,sk,0,.5);mPop();gId=0;
sph(0,4.6,6.5,17,9,14,und,0,.3);
mPush();mT(0,17,-2);mRX(-0.45+Math.sin(t*0.8)*0.04);
 // blotches (ink spots / glowing veins in the second form)
 for(const[az,el,s]of[[0.3,0.35,3],[-0.5,0.6,2.4],[0.9,0.15,2.2],[-1.0,0.25,2.8],[0.1,0.8,2],[-0.2,-0.1,2.6],[1.3,0.5,1.8],[-1.4,0.55,2]]){const ce=Math.cos(el);sph(9.6*ce*Math.sin(az),6+14.6*Math.sin(el),9.2*ce*Math.cos(az),s,s,s,f2?C.red:C.krRD,0,0,f2?F_UNLIT:0)}
 if(f2){for(const[az,el,l]of[[0.6,0.5,6],[-0.7,0.4,5],[0.2,0.1,4.5],[-0.3,0.7,4],[1.1,0.3,4]]){const ce=Math.cos(el),x=9.8*ce*Math.sin(az),y=6+15*Math.sin(el),z=9.4*ce*Math.cos(az);put(BOX,x,y,z,0,az,az*0.8+el,0.35,l,0.35,C.red,0,0,F_UNLIT)}
  for(let i=0;i<7;i++){const el=0.25+i*0.21,ce=Math.cos(el),px=0,py=6+15*Math.sin(el),pz=9.5*ce,nx=0,ny=Math.sin(el)/15,nz=ce/9.5;mPush();mT(px,py,pz);orient(nx,ny,nz);mRX(PI/2);mS(1.1,3.2-i*0.2,1.1);mT(0,0.35,0);emit(CONE,C.white,0,0,0,0);mPop()}}
mPop();
// eyes (they follow the local player)
for(const q of[-1,1]){const E=[q*6*S,11.5*S+yo,KR_Z+11.4*S],lx=clamp((pl.x-E[0])/50,-0.35,0.35),ly=clamp((pl.y+1.6-E[1])/60,-0.3,0.2);mPush();mT(q*6,11.5,11.4);mRY(q*0.45);
 sph(0,0,0,5.4,4.4,2.8,C.paper);sph(lx*2,ly*2,1.1,3.4,3.4,1.0,eye,0,0,F_UNLIT);box(lx*2,ly*2,1.62,2.7,0.55,0.3,C.inkD);sph(lx*2-0.7,ly*2+0.7,1.7,0.5,0.5,0.2,C.white,0,0,F_UNLIT);
 put(BOX,0,2.25,0.7,0,0,q*0.35,6.2,1.4,1.7,skD);put(BOX,0,-2.2,0.5,0,0,-q*0.15,5.4,0.9,1.4,skD);mPop()}
// the seal on the brow (form 1) / the third eye (form 2)
mPush();mT(0,15.2,10.8);mRX(-0.55);if(!f2){put(CYL,0,0,0,PI/2,0,0,4.4,0.4,4.4,C.gold,0,.8);put(CYL,0,0,0.12,PI/2,0,0,3.8,0.4,3.8,C.paper);tomoe(0,0,0.36,1.5,C.inkD,-t*0.8,0);
 if(st==='brk'&&u>0.6){put(BOX,0.6,0.4,0.45,0,0,0.7,0.16,2.4,0.2,C.white,0,0,F_UNLIT);put(BOX,-0.7,-0.5,0.45,0,0,-0.6,0.16,2.0,0.2,C.white,0,0,F_UNLIT)}}
 else{sph(0,0,0,3.0,4.4,1.6,C.paper);sph(0,0,0.5,2.2,3.4,1.0,C.red,0,0,F_UNLIT);box(0,0,0.95,0.5,3.0,0.3,C.inkD);put(BOX,0,2.5,0.2,0,0,0,2.6,0.9,1.0,skD);put(BOX,0,-2.5,0.2,0,0,0,2.6,0.9,1.0,skD);bill(BURST,0,0,1.4,2.2+Math.sin(t*7)*0.4,t*3,C.red,NF)}mPop();
// beak and the siphon
const mo=b.mouth||0;mPush();mT(0,3.2,13.6);put(SPH,0,0,0,0,0,0,4.8,3.4+mo*2.2,2.6,C.inkD);put(CONE,0,0.7+mo*1.0,0.9,PI*0.62,0,0,2.4,3.0,2.0,f2?C.paper:C.inkD,0,.6);put(CONE,0,-0.7-mo*1.0,0.9,PI*0.38,0,0,2.0,2.4,1.7,f2?C.paper:C.inkD,0,.6);
 if(mo>0.3){sph(0,0,0.5,3.0,mo*2.6,1.4,C.redD,0,0,F_UNLIT);if(f2)for(let i=0;i<8;i++){const a=i/8*TAU;put(CONE,Math.cos(a)*1.6,Math.sin(a)*mo*1.3,0.9,0,0,a+PI/2,0.35,0.9,0.35,C.white)}}mPop();
put(CYL,9.5,5.5,4,PI/2-0.3,0.5,0,2.4,4.2,2.4,und);put(CYL,10.2,5.9,6.0,PI/2-0.3,0.5,0,1.6,0.3,1.6,C.inkD);
mPop();
// tentacles: decorative ones in the sea, two coiling over the rails in the second form, then the two attacking clubs
for(let i=0;i<KR_DECO.length;i++){const[d0,d1,d2,d3,d4]=KR_DECO[i],sy=Math.sin(t*1.1+i*1.7),tip=[d2+Math.sin(t*0.9+i)*2,lerp(Y-6,d3+sy*1.8,up),d4+Math.cos(t*0.7+i)*1.5];
 krTent([d0*S,Y-1.5,d1],[(d0+d2)/2*S+(d0<0?-4:4),lerp(Y-4,(d3+4)*1.1,up),(d1+d4)/2],tip,1.9,0.45,sk,suck,1.4,i*1.3,14)}
if(f2&&st!=='die')for(const q of[-1,1]){const zz=q<0?-12:5,c=Math.sin(t*1.6+q)*0.8;krTent([q*23,Y-1,zz+3],[q*24.5,6,zz],[q*19.4+c*0.5,8.5+c,zz-2.5],1.5,0.4,sk,suck,0.6,q,12)}
const hands=[b.hL,b.hR];for(let i=0;i<2;i++){const h=hands[i],s=i?1:-1,root=[s*7*S,Y-1.5,KR_Z+10],dl=Math.hypot(h.x-root[0],h.z-root[2]),ctrl=[(root[0]+h.x)/2+s*3,Math.max(root[1],h.y)+6+dl*0.18,(root[2]+h.z)/2];
 krTent(root,ctrl,[h.x,h.y,h.z],2.5,1.1,sk,suck,0.8,i*2,0);krClub(b,h,ctrl,f2,sk,skD);for(let k=0;k<4;k++){const a=k*1.57+t;sph(root[0]+Math.cos(a)*3.2,Y+0.1,root[2]+Math.sin(a)*2.2,3,0.4,2,C.seaFoam,0,0,NF)}}
gTint=0;
// telegraphs of the club slams (the rest: bkTele = double / wave / sweep)
if(st==='up'){const s=6+Math.sin(t*20)*0.8;put(RING,b.tx,0.12,b.tz,0,0,0,s,1,s,C.red,0,0,NF);put(RING,b.tx,0.12,b.tz,0,0,0,s*0.5,1,s*0.5,C.red,0,0,NF)}
bkTele(b)}
// local hazards (every peer, world space)
function krDraw(){const K=BT.kraken,NF=F_UNLIT|F_NOCAST,Y=SEA_Y,t=now,b=boss&&boss.bk==='kraken'?boss:null,sk=b&&krF2(b)?C.krB:C.krR,suck=b&&krF2(b)?C.krS2:C.krS;
for(const h of krz){
 if(h.k==='side'){const L=K.sideL,x0=h.s*17.4,xm=h.s*(17.4-L/2),xe=h.s*(17.4-L);
  if(h.t<0&&Math.sin(t*(h.t>-0.35?40:15))>-0.3){box(xm,0.12,h.z,L,0.02,K.sideW,C.red,0,0,NF);for(let j=0;j<4;j++)put(PYR,h.s*(15.5-j*5.5),0.14,h.z,PI/2,-h.s*PI/2,0,1.6,0.8,1.0,C.red,0,0,NF)}
  // the tentacle: rises out of the sea beside the hull, arches high, slams across, lies there, sinks back
  let tip,ctrl;const r=[h.s*23,Y-1,h.z+2];
  if(h.t<-0.15){const k=easeOut(sat((h.t+1.1)/0.95));tip=[h.s*lerp(24,19,k),lerp(Y-2,15,k),h.z];ctrl=[h.s*25,lerp(Y,8,k),h.z+1]}
  else if(h.t<0){const k=sat((h.t+0.15)/0.15);tip=[lerp(h.s*19,xe,k),lerp(15,0.7,k),h.z];ctrl=[h.s*lerp(22,17,k),lerp(10,6,k),h.z]}
  else{const k=sat((h.t-0.8)/0.6);tip=[lerp(xe,h.s*22,k),lerp(0.7,Y-2,k*k),h.z];ctrl=[h.s*16.5,lerp(5,0,k),h.z]}
  if(tip[1]>Y-1.5){krTent(r,ctrl,tip,1.7,0.55,sk,suck,0.3,h.z,14)}}
 else if(h.k==='jet'){const s=Math.sin(h.a),c=Math.cos(h.a),W2=K.jetW*2;
  if(h.t<0){if(Math.sin(t*(h.t>-0.3?40:16))>-0.3){mPush();mT(h.ox+s*26,0.12,h.oz+c*26);mRY(h.a);mS(W2,0.02,44);emit(BOX,C.red,0,0,NF,0);mPop()}}
  else{const m=b?krMouth(b):[0,5,-37],k=1-sat((h.t-K.jetLife+0.3)/0.3);for(let i=1;i<=9;i++){const q=i/9,gx=h.ox+s*(2+q*42),gz=h.oz+c*(2+q*42),a=1-q,hy=lerp(m[1],0.8,Math.sqrt(q))+Math.sin(q*PI)*3;
    sph(lerp(m[0],gx,q),hy,lerp(m[2],gz,q),(2.4-q)*k+0.5,(2.4-q)*k+0.5,(2.4-q)*k+0.5,C.inkD,0,.6);sph(gx,0.3,gz,W2*1.3*k,0.5,2.4*k,C.inkD,0,0,F_NOCAST)}}}
 else if(h.k==='whirl'){const k=h.t<0?sat((h.t+K.whTel)/K.whTel)*0.5:Math.min(1,h.t*2)*(1-sat((h.t-K.whDur+0.5)/0.5));
  for(let a=0;a<4;a++)for(let i=0;i<12;i++){const q=i/12,ang=a*PI/2+q*4-t*2.4,r=4+q*22;sph(Math.sin(ang)*r,Y+0.15,-46+Math.cos(ang)*r*0.7,(2.6-q*1.2)*k+0.1,0.35,(3.4-q)*k+0.1,C.seaFoam,0,0,NF)}
  if(h.t>=0&&Math.sin(t*8)>-0.5)box(0,0.12,(K.whZ-25.6)/2,34,0.02,K.whZ+25.6,C.red,0,0,NF);
  if(h.t>=0)for(let i=0;i<10;i++){const z=10-((t*14+i*4.6)%40),x=-15+i*3.3;box(x,0.4,z,0.12,0.08,2.6,C.white,0,0,NF)}}}}
function krShot(s){return false}function krPop(s){}function krDrawShot(s){}
