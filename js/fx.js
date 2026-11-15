'use strict';
// ================= FX =================
const parts=[],decals=[],texts=[];
let trauma=0,flashA=0,invA=0,hurtA=0,monoA=0,hitStop=0,slowT=0,slowK=1,lineA=0,lineCol='#16121f',lineCx=W/2,lineCy=H/2,now=0;
const tlim={};function lim(k,t){if((tlim[k]||0)>now)return false;tlim[k]=now+t;return true}
const shake=a=>{trauma=Math.min(1,trauma+a)},flash=a=>{flashA=Math.max(flashA,a)},stopT=t=>{hitStop=Math.max(hitStop,t)};
function lines(a,col,cx,cy){if(a>lineA){lineA=a;lineCol=col||'#16121f';lineCx=cx==null?W/2:cx;lineCy=cy==null?H/2:cy}}
function addP(o){o.max=o.life;o.age=0;o.dl=o.dl||0;if(parts.length>520)parts.splice(0,40);parts.push(o);return o}
function fxStar(x,y,z,s,c,life,prim){addP({k:0,x,y,z,s,c,life:life||0.12,rot:rnd(0,TAU),prim:prim||BURST})}
function fxBlobs(x,y,z,n,spd,c,s){for(let i=0;i<n;i++){const a=rnd(0,TAU),u=rnd(0.1,1);addP({k:1,x,y,z,vx:Math.cos(a)*spd*rnd(.3,1),vy:u*spd*rnd(.5,1.1),vz:Math.sin(a)*spd*rnd(.3,1),s:s*rnd(.5,1.2),c,life:rnd(.5,1.2),g:18})}}
function fxSparks(x,y,z,n,spd,c){for(let i=0;i<n;i++)addP({k:2,x,y,z,vx:rnd(-1,1)*spd,vy:rnd(-.3,1)*spd,vz:rnd(-1,1)*spd,s:rnd(.4,.9),c,life:rnd(.12,.3),g:8})}
function fxSmoke(x,y,z,n,s,c,spd){for(let i=0;i<n;i++){const a=rnd(0,TAU);addP({k:3,x:x+Math.cos(a)*s*.3,y:y+rnd(-.2,.4)*s,z:z+Math.sin(a)*s*.3,vx:Math.cos(a)*spd*rnd(.3,1),vy:rnd(.4,2.2),vz:Math.sin(a)*spd*rnd(.3,1),s:s*rnd(.6,1.2),c,life:rnd(.6,1.1),dl:rnd(0,.1)})}}
function fxRing(x,y,z,s,c,life){addP({k:4,x,y,z,s,c,life})}
function fxBall(x,y,z,s,c,life,dl){addP({k:5,x,y,z,s,c,life,dl:dl||0,rot:rnd(0,TAU),rx:rnd(0,TAU)})}
function fxDebris(x,y,z,n,spd,c,s){for(let i=0;i<n;i++)addP({k:6,x,y,z,vx:rnd(-1,1)*spd,vy:rnd(.4,1.2)*spd,vz:rnd(-1,1)*spd,s:s*rnd(.6,1.4),c,life:rnd(.7,1.4),g:20,rot:rnd(0,TAU),spin:rnd(-12,12)})}
function fxTracer(x0,y0,z0,x1,y1,z1,c,w){addP({k:7,x:x0,y:y0,z:z0,x1,y1,z1,c,s:w||0.05,life:0.07})}
function fxOrb(x,y,z){addP({k:8,x,y,z,vx:rnd(-4,4),vy:rnd(3,7),vz:rnd(-4,4),s:0.24,c:C.cyan,life:3})}
function updateParts(dt){for(let i=parts.length-1;i>=0;i--){const p=parts[i];if(p.dl>0){p.dl-=dt;continue}p.age+=dt;p.life-=dt;if(p.life<=0){parts.splice(i,1);continue}
const k=p.k;if(k===1||k===6||k===2){p.vy-=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(k===6)p.rot+=p.spin*dt;if(p.y<0.05&&k!==2){if(k===1){if(Math.random()<0.45&&decals.length<50)decals.push({x:p.x,z:p.z,r:p.s*rnd(2,4),life:rnd(5,9)});parts.splice(i,1)}else{p.y=0.05;p.vy=-p.vy*0.35;p.vx*=0.6;p.vz*=0.6}}}
else if(k===3){p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;const f=Math.exp(-3*dt);p.vx*=f;p.vz*=f}
else if(k===8){const dx=pl.x-p.x,dy=1.2-p.y,dz=pl.z-p.z,d=Math.hypot(dx,dy,dz)||1;if(p.age>0.3){const a=40*dt;p.vx+=dx/d*a;p.vy+=dy/d*a;p.vz+=dz/d*a;const f=Math.exp(-4*dt);p.vx*=f;p.vy*=f;p.vz*=f}else p.vy-=14*dt;p.x+=p.vx*dt;p.y=Math.max(0.2,p.y+p.vy*dt);p.z+=p.vz*dt;if(d<1.1&&p.age>0.3){pl.gauge=Math.min(100,pl.gauge+3);parts.splice(i,1)}}}
for(let i=decals.length-1;i>=0;i--){decals[i].life-=dt;if(decals[i].life<=0)decals.splice(i,1)}}
function orient(dx,dy,dz){const l=Math.hypot(dx,dy,dz)||1;mRY(Math.atan2(dx,dz));mRX(-Math.asin(clamp(dy/l,-1,1)));return l}
function drawParts(){const NF=F_UNLIT|F_NOCAST;for(const p of parts){if(p.dl>0)continue;const t=p.age/p.max;switch(p.k){
case 0:bill(p.prim,p.x,p.y,p.z,p.s*(0.3+0.7*easeOut(Math.min(1,t*3)))*(t>0.7?(1-t)/0.3:1),p.rot,p.c,NF);break;
case 1:{const s=p.s*(p.life<0.15?p.life/0.15:1);sph(p.x,p.y,p.z,s,s*1.2,s,p.c,0,1);break}
case 2:{mPush();mT(p.x,p.y,p.z);orient(p.vx,p.vy,p.vz);mS(0.035,0.035,p.s*(1-t));emit(BOX,p.c,0,0,NF,0);mPop();break}
case 3:{const s=p.s*(0.35+0.65*easeOut(Math.min(1,t*2.5)))*(t>0.55?(1-t)/0.45:1);sph(p.x,p.y,p.z,s,s*0.9,s,p.c,0,0,F_NOCAST);break}
case 4:{const s=p.s*easeOut(t);put(RING,p.x,p.y,p.z,0,0,0,s,1,s,p.c,0,0,NF);break}
case 5:{const s=p.s*easeOut(Math.min(1,t*3))*(t>0.5?(1-t)*2:1);put(SPIKE,p.x,p.y,p.z,p.rx,p.rot+p.age*3,0,s,s,s,p.c,0,0,NF);break}
case 6:put(BOX,p.x,p.y,p.z,p.rot,p.rot*1.3,0,p.s,p.s,p.s*1.6,p.c);break;
case 7:{mPush();mT((p.x+p.x1)/2,(p.y+p.y1)/2,(p.z+p.z1)/2);const l=orient(p.x1-p.x,p.y1-p.y,p.z1-p.z);const w=p.s*(1-t*0.7);mS(w,w,l);emit(BOX,p.c,0,0,NF,0);mPop();break}
case 8:sph(p.x,p.y,p.z,p.s,p.s,p.s,p.c,0,0,NF);break;}}
let i=0;for(const d of decals){const r=d.r*Math.min(1,d.life);put(CYL,d.x,0.075+(i++)*0.0004,d.z,0,0,0,r,0.02,r*0.8,C.inkD,0,0,F_NOCAST|F_NOEDGE)}}
function explode(x,y,z,S,o){o=o||{};fxStar(x,y,z,S*3.4,C.white,0.1);fxBall(x,y,z,S*1.5,C.yellow,0.32,0);fxBall(x,y,z,S*2.2,C.orange,0.38,0.04);fxBall(x,y,z,S,C.white,0.2,0);
fxSmoke(x,y,z,Math.round(5+S*2),S*1.2,o.ink?C.ink:C.smoke,S*2.4);fxSmoke(x,y,z,3,S,C.smokeD,S*2);fxDebris(x,y,z,6,S*4+4,C.ink,0.1*S+0.08);fxBlobs(x,y,z,8,S*4+4,C.ink,0.16);
if(y<S*1.2+1.2)fxRing(x,0.1,z,S*5.5,C.white,0.32);
const k=sat(1.3-Math.hypot(x-cam.x,z-cam.z)/45);shake(0.2+0.45*k*Math.min(1.6,S));flash(0.1+0.22*k);stopT(0.04+0.025*S);lines(0.55*k,'#fff');
if(!o.quiet&&(!pl.sp||lim('spx',0.5)))sfxAt(o.text||pick(['ドカァン！','ズガァン！','ボカァン！']),x,y+S*0.5,z,{size:60+S*26,st:'boom',life:0.75});snd('boom',S)}
// ---- hand-lettered katakana (stroke font) ----
const KS={'ト':[[[40,6],[40,94]],[[40,36],[82,60]]],'ン':[[[12,18],[40,36]],[[12,90],[48,80],[70,60],[88,24]]],'タ':[[[44,6],[20,44]],[[40,22],[82,22],[68,62],[30,94]],[[34,44],[62,62]]],
'ハ':[[[38,20],[30,56],[10,88]],[[60,20],[72,54],[92,86]]],'ス':[[[18,14],[78,14],[56,52],[14,90]],[[52,54],[88,90]]],'キ':[[[16,36],[84,24]],[[14,64],[88,52]],[[40,6],[60,94]]],
'ツ':[[[14,22],[28,48]],[[42,16],[54,42]],[[86,16],[72,62],[28,92]]],'カ':[[[12,32],[82,32],[78,74],[64,92],[50,84]],[[46,6],[40,50],[14,92]]],'シ':[[[16,16],[38,30]],[[10,44],[32,58]],[[14,92],[54,80],[90,32]]],
'ヤ':[[[10,42],[86,26],[64,56]],[[36,8],[56,94]]],'ア':[[[10,14],[88,14],[64,44]],[[48,32],[46,60],[20,92]]],'ク':[[[42,6],[14,48]],[[38,22],[84,22],[68,64],[26,94]]],
'ホ':[[[10,30],[90,30]],[[50,6],[50,94]],[[30,52],[10,82]],[[70,52],[90,82]]],'オ':[[[10,32],[90,32]],[[60,6],[60,94],[46,84]],[[58,34],[10,82]]],'コ':[[[14,18],[84,18],[84,86]],[[14,86],[84,86]]],
'ユ':[[[18,22],[68,22],[62,82]],[[8,84],[94,84]]],'サ':[[[8,34],[92,34]],[[32,10],[32,60]],[[68,8],[68,56],[38,94]]],'チ':[[[74,8],[20,26]],[[8,46],[92,46]],[[50,22],[50,60],[24,94]]],
'ヌ':[[[16,14],[80,14],[58,56],[14,92]],[[34,40],[88,88]]],'ワ':[[[14,16],[14,50]],[[14,16],[86,16],[78,58],[34,94]]],'イ':[[[82,6],[46,40],[10,60]],[[52,36],[52,94]]],
'ヒ':[[[84,28],[22,46]],[[22,8],[22,78],[34,88],[86,88]]],'ヘ':[[[6,64],[36,24],[94,76]]],'ウ':[[[50,4],[50,24]],[[14,24],[14,52]],[[14,24],[86,24],[78,60],[36,94]]],
'フ':[[[12,16],[86,16],[74,60],[28,94]]],'ル':[[[32,12],[30,58],[8,92]],[[58,8],[58,88],[94,54]]],'リ':[[[26,10],[26,58]],[[72,6],[72,56],[42,94]]],'ラ':[[[22,10],[78,10]],[[10,34],[88,34],[76,66],[34,94]]],
'メ':[[[80,8],[52,56],[12,92]],[[24,30],[86,78]]],'マ':[[[10,18],[88,18],[52,58]],[[36,46],[66,84]]],'レ':[[[24,8],[24,88],[56,74],[88,40]]],'ロ':[[[16,18],[84,18],[84,84],[16,84],[16,10]]],
'ー':[[[4,54],[34,46],[64,53],[96,45]]],'！':[[[52,0],[46,66]]],'…':[],' ':[]};
const KM={'ド':['ト',1],'ダ':['タ',1],'バ':['ハ',1],'ズ':['ス',1],'ガ':['カ',1],'グ':['ク',1],'ボ':['ホ',1],'ゴ':['コ',1],'ザ':['サ',1],'ビ':['ヒ',1],'ブ':['フ',1],'ギ':['キ',1],'ジ':['シ',1],'ピ':['ヒ',2],'ペ':['ヘ',2],'パ':['ハ',2],
'ッ':['ツ',3],'ァ':['ア',3],'ォ':['オ',3],'ャ':['ヤ',3],'ュ':['ユ',3],'ィ':['イ',3],'ゥ':['ウ',3]};
function strokePoly(pts,w0,w1){const n=pts.length,L=[],R=[],seg=[];let tot=0,acc=0;for(let i=0;i<n-1;i++){const l=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]);seg.push(l);tot+=l}
for(let i=0;i<n;i++){let ax,ay,bx,by;if(i>0){ax=pts[i][0]-pts[i-1][0];ay=pts[i][1]-pts[i-1][1];const l=Math.hypot(ax,ay)||1;ax/=l;ay/=l}if(i<n-1){bx=pts[i+1][0]-pts[i][0];by=pts[i+1][1]-pts[i][1];const l=Math.hypot(bx,by)||1;bx/=l;by/=l}
if(i===0){ax=bx;ay=by}if(i===n-1){bx=ax;by=ay}let nx=-(ay+by),ny=ax+bx,l=Math.hypot(nx,ny);if(l<1e-4){nx=-ay;ny=ax;l=1}nx/=l;ny/=l;const ch=Math.max(0.55,nx*-ay+ny*ax),hw=(w0+(w1-w0)*(tot?acc/tot:0))/2/ch;
L.push([pts[i][0]+nx*hw,pts[i][1]+ny*hw]);R.push([pts[i][0]-nx*hw,pts[i][1]-ny*hw]);if(i<n-1)acc+=seg[i]}return L.concat(R.reverse())}
const gcache={};
function glyph(ch){if(gcache[ch])return gcache[ch];const p=new Path2D();let base=ch,mod=0;if(KM[ch]){base=KM[ch][0];mod=KM[ch][1]}const st=KS[base]||[];
const add=(pts,w0,w1)=>{const q=strokePoly(pts,w0,w1);p.moveTo(q[0][0],q[0][1]);for(let i=1;i<q.length;i++)p.lineTo(q[i][0],q[i][1]);p.closePath()};
for(const s of st){let pts=s;if(mod===3)pts=s.map(a=>[50+(a[0]-50)*0.64,64+(a[1]-50)*0.64]);add(pts,mod===3?15:19,mod===3?9:11)}
if(mod===1){add([[76,0],[86,18]],11,8);add([[90,-6],[100,12]],11,8)}if(mod===2){p.moveTo(98,6);p.arc(88,6,10,0,TAU);p.moveTo(92,6);p.arc(88,6,4,0,TAU,true)}
if(ch==='！'){p.rect(36,82,18,18)}if(ch==='…'){for(let i=0;i<3;i++)p.rect(10+i*30,70,16,16)}
gcache[ch]=p;return p}
const STY={fire:{halo:'#fff',ink:'#16121f',f0:'#fff9b0',f1:'#ffae00'},hit:{halo:'#e8112d',ink:'#16121f',f0:'#ffffff',f1:'#ffe3e3'},boom:{halo:'#fff',ink:'#16121f',f0:'#ffe85a',f1:'#ff3d1f'},
ink:{halo:'#fff',ink:'#fff',f0:'#2a2440',f1:'#0d0b16'},cyan:{halo:'#fff',ink:'#0c1838',f0:'#f0feff',f1:'#4fd4ff'},hurt:{halo:'#fff',ink:'#16121f',f0:'#ff6a5a',f1:'#c20020'},logo:{halo:'#fff',ink:'#16121f',f0:'#fff36b',f1:'#ff5a1f'}};
for(const k in STY){const g=ctx.createLinearGradient(0,0,0,100);g.addColorStop(0,STY[k].f0);g.addColorStop(1,STY[k].f1);STY[k].g=g}
function layout(str,size,grow,jit){const L=[];let px=0,i=0;for(const ch of str){const small='ッァィゥォャュ'.includes(ch),s=1+grow*i,adv=size*s*(small?0.62:ch==='！'?0.56:0.9);L.push({p:glyph(ch),x:px+adv*0.5,y:jit?rnd(-0.08,0.08)*size:0,r:jit?rnd(-0.14,0.14):0,s});px+=adv;i++}for(const l of L)l.x-=px/2;L.w=px;return L}
function drawGlyphs(L,size,st,shadow){ctx.lineJoin='miter';ctx.miterLimit=2.5;for(let pass=shadow?-1:0;pass<3;pass++)for(const l of L){ctx.save();ctx.translate(l.x+(pass<0?size*0.07:0),l.y+(pass<0?size*0.08:0));ctx.rotate(l.r);const s=l.s*size/100;ctx.scale(s,s);ctx.translate(-50,-50);
if(pass<=0){ctx.strokeStyle=pass<0?st.ink:st.halo;ctx.lineWidth=pass<0?16:26;ctx.stroke(l.p)}else if(pass===1){ctx.strokeStyle=st.ink;ctx.lineWidth=13;ctx.stroke(l.p);ctx.fillStyle=st.ink;ctx.fill(l.p)}else{ctx.fillStyle=st.g;ctx.fill(l.p)}ctx.restore()}}
let eRects=[],eRectsT=-1;
function enemyRects(){if(eRectsT===now)return eRects;eRectsT=now;eRects=[];const f=H/2/Math.tan(cam.fov/2);
for(const e of enemies){if(e.dead)continue;const c=eCenter(e),p=project(c[0],c[1],c[2]);if(!p)continue;const r=Math.min(c[3]*f/p.w*1.15,e.type==='boss'?330:300);eRects.push([p.x-r,p.y-r*1.3,p.x+r,p.y+r*1.1,e.type==='boss'?1.5:1])}
for(const o of others){if(o.dead)continue;const p=project(o.x,o.y+1.1,o.z);if(!p)continue;const r=Math.min(1.1*f/p.w,260);eRects.push([p.x-r*0.6,p.y-r*1.2,p.x+r*0.6,p.y+r*1.2,1])}return eRects}
function ovl(a0,a1,a2,a3,b){const w=Math.min(a2,b[2])-Math.max(a0,b[0]),h=Math.min(a3,b[3])-Math.max(a1,b[1]);return w>0&&h>0?w*h:0}
function placeText(x0,y0,w,h){const R=enemyRects(),hw=w/2,hh=h/2,CR=[W/2-120,H/2-90,W/2+120,H/2+90,2.5],step=Math.max(70,Math.min(w,h*2)*0.55);let bx=x0,by=y0,bs=1e18;
for(let ring=0;ring<5;ring++){const n=ring?10:1;for(let k=0;k<n;k++){const a=k/n*TAU+ring*0.4,x=clamp(x0+Math.cos(a)*step*ring*1.4,hw+30,W-hw-30),y=clamp(y0+Math.sin(a)*step*ring*0.9,hh+24,H-hh-24),a0=x-hw,a1=y-hh,a2=x+hw,a3=y+hh;
let sc=ovl(a0,a1,a2,a3,CR)*CR[4];for(const r of R)sc+=ovl(a0,a1,a2,a3,r)*r[4];for(const t of texts)sc+=ovl(a0,a1,a2,a3,[t.x-t.L.w/2,t.y-t.size*0.6,t.x+t.L.w/2,t.y+t.size*0.6])*0.5;sc+=Math.hypot(x-x0,y-y0)*40;
if(sc<bs){bs=sc;bx=x;by=y}}if(bs<ring*step*60+1)break}return[bx,by]}
function addText(str,x,y,o){o=o||{};const size=o.size||60,L=layout(str,size,o.grow==null?0.09:o.grow,true);x=clamp(x,L.w/2+40,W-L.w/2-40);y=clamp(y,size*0.7+20,H-size*0.7-20);if(!o.fixed){const q=placeText(x,y,L.w,size*1.2);x=q[0];y=q[1]}
const t={L,x,y,size,rot:o.rot==null?rnd(-0.28,0.12):o.rot,life:o.life||0.5,age:0,st:STY[o.st||'fire'],vx:o.vx||0,vy:o.vy||0};texts.push(t);if(texts.length>10)texts.shift();return t}
function sfxAt(str,x,y,z,o){const p=project(x,y,z);if(!p)return;o=o||{};o.size=(o.size||60)*clamp(14/p.w,0.6,1.25);addText(str,p.x+(o.ox||0),p.y+(o.oy||0),o)}
function ageTexts(dt){for(let i=texts.length-1;i>=0;i--){const t=texts[i];t.age+=dt;if(t.age>=t.life){texts.splice(i,1);continue}t.x+=t.vx*dt;t.y+=t.vy*dt}}
function drawTexts(){
for(const t of texts){const a=t.age;let sc=a<0.09?easeBack(a/0.09):1+0.03*Math.sin(a*40),al=1;if(a>t.life-0.1){const k=(t.life-a)/0.1;sc*=0.7+0.3*k;al=k}
ctx.save();ctx.globalAlpha=al;ctx.translate(t.x+(a<0.2?rnd(-3,3):0),t.y+(a<0.2?rnd(-3,3):0));ctx.rotate(t.rot);ctx.scale(sc,sc);ctx.transform(1,0,-0.2,1,0,0);drawGlyphs(t.L,t.size,t.st);ctx.restore()}}
function focusLines(cx,cy,inner,n,col,seed){const r=mulberry(seed);ctx.fillStyle=col;ctx.beginPath();for(let i=0;i<n;i++){const a=(i+r())/n*TAU,w=0.004+r()*0.017,r0=inner*(0.8+r()*0.7),R=1600;ctx.moveTo(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0);ctx.lineTo(cx+Math.cos(a-w)*R,cy+Math.sin(a-w)*R);ctx.lineTo(cx+Math.cos(a+w)*R,cy+Math.sin(a+w)*R);ctx.closePath()}ctx.fill()}
