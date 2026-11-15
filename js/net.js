'use strict';
// ================= NET (MQTT over WebSocket relay) =================
const BROKERS=[{u:'wss://broker.emqx.io:8084/mqtt'},{u:'wss://broker.hivemq.com:8884/mqtt'},{u:'wss://test.mosquitto.org:8081/mqtt'},{u:'wss://mqtt.eclipseprojects.io:443/mqtt'},{u:'wss://public.cloud.shiftr.io:443',user:'public',pass:'public'},{u:'wss://broker-cn.emqx.io:8084/mqtt'}];
{const m=/[?&]mq=([^&]+)/.exec(location.search);if(m)BROKERS.unshift({u:decodeURIComponent(m[1])})}
const net={on:false,host:false,ws:null,ready:false,code:'',id:Math.random().toString(36).slice(2,10),slot:0,roster:[],mode:'coop',stage:0,started:false,st:'',err:'',sendT:0,snapT:0,lobT:0,joinT:0,hostSeen:0,seen:{},evq:[],evseq:0,evDone:0,hq:[],dacc:{},pvAcc:{},q:{f:[],pk:[],kb:[],ps:[]},picked:{},ping:0,input:'',csp:false,tries:[],gen:0};
try{document.addEventListener('securitypolicyviolation',()=>{net.csp=true})}catch(e){}
const te=new TextEncoder(),td=new TextDecoder();
function mqStr(s){const b=te.encode(s),o=new Uint8Array(b.length+2);o[0]=b.length>>8;o[1]=b.length&255;o.set(b,2);return o}
function mqPkt(type,parts){let n=0;for(const p of parts)n+=p.length;const len=[];let m=n;do{let d=m%128;m=(m/128)|0;if(m)d|=128;len.push(d)}while(m);const o=new Uint8Array(1+len.length+n);o[0]=type;o.set(len,1);let k=1+len.length;for(const p of parts){o.set(p,k);k+=p.length}return o}
const netTopic=()=>'komabreaker/v2/r'+net.code;
function netClose(){net.gen++;if(net.ping)clearInterval(net.ping);net.ping=0;for(const w of net.tries){try{w.close()}catch(e){}}net.tries=[];const ws=net.ws;net.ws=null;net.ready=false;if(ws){try{ws.close()}catch(e){}}}
// open all listed brokers at once; first one that completes CONNECT+SUBSCRIBE wins
function netOpen(list,topicFor,onReady,onFail){netClose();const gen=net.gen;let left=list.length,won=false;
for(const bi of list){const B=BROKERS[bi];let ws,done=false,buf=new Uint8Array(0),to=0;
 const fail=()=>{if(done)return;done=true;clearTimeout(to);try{ws&&ws.close()}catch(e){}if(--left<=0&&!won&&gen===net.gen)onFail()};
 try{ws=new WebSocket(B.u,'mqtt')}catch(e){fail();continue}net.tries.push(ws);ws.binaryType='arraybuffer';to=setTimeout(fail,10000);
 ws.onopen=()=>{const parts=[mqStr('MQTT'),new Uint8Array([4,B.user?0xC2:0x02,0,60]),mqStr('kb'+net.id+((Math.random()*1e5)|0))];if(B.user){parts.push(mqStr(B.user),mqStr(B.pass||''))}ws.send(mqPkt(0x10,parts))};
 ws.onmessage=e=>{if(gen!==net.gen)return;if(won&&net.ws!==ws)return;let b=new Uint8Array(buf.length+e.data.byteLength);b.set(buf);b.set(new Uint8Array(e.data),buf.length);
  for(;;){if(b.length<2)break;let i=1,mul=1,len=0,ok=false;while(i<b.length&&i<5){const d=b[i++];len+=(d&127)*mul;mul*=128;if(!(d&128)){ok=true;break}}if(!ok||b.length<i+len)break;const t=b[0]>>4,body=b.subarray(i,i+len);
   if(t===2){if(body[1]!==0){fail();return}ws.send(mqPkt(0x82,[new Uint8Array([0,1]),mqStr(topicFor(bi)),new Uint8Array([0])]))}
   else if(t===9&&!done){if(body[2]===0x80){fail();return}done=true;clearTimeout(to);if(won){try{ws.close()}catch(er){}return}won=true;
    for(const w of net.tries)if(w!==ws){try{w.close()}catch(er){}}net.tries=[];net.ws=ws;net.ready=true;
    net.ping=setInterval(()=>{if(net.ws===ws&&ws.readyState===1)ws.send(new Uint8Array([0xC0,0]))},20000);onReady(bi)}
   else if(t===3&&net.ws===ws){const tl=(body[0]<<8)|body[1];let m=null;try{m=JSON.parse(td.decode(body.subarray(2+tl)))}catch(er){}if(m&&m.i&&m.i!==net.id){try{netMsg(m)}catch(er){console.error(er)}}}
   b=b.subarray(i+len)}buf=b.slice()};
 ws.onerror=()=>{if(!done)fail()};ws.onclose=()=>{if(!done)fail();else if(net.ws===ws&&net.on&&gen===net.gen)netLeave('通信が切断されました')}}}
function failMsg(){return net.csp?'この開き方では通信できません。Safariで直接ページを開いてください':'サーバーに接続できませんでした（別のWi-Fi・モバイル回線でもお試しください）'}
function netSend(o){const ws=net.ws;if(!net.ready||!ws||ws.readyState!==1)return;o.i=net.id;ws.send(mqPkt(0x30,[mqStr(netTopic()),te.encode(JSON.stringify(o))]))}
function netReset(){Object.assign(net,{roster:[],started:false,seen:{},evq:[],evseq:0,evDone:0,hq:[],dacc:{},pvAcc:{},q:{f:[],pk:[],kb:[],ps:[]},picked:{},err:'',st:'接続中…',hostSeen:now,joinT:0,lobT:0});others.length=0}
function netHost(){netReset();net.on=true;net.host=true;G.menu='lobby';const pin=String(1000+((Math.random()*9000)|0)),list=BROKERS.map((_,k)=>k).slice(0,9);
net.code='';netOpen(list,bi=>'komabreaker/v2/r'+String(bi+1)+pin,bi=>{net.code=String(bi+1)+pin;net.st='';net.slot=0;pl.slot=0;net.roster=[{id:net.id,slot:0}]},()=>{net.on=false;net.err=failMsg();G.menu='online'})}
function netJoin(code){const bi=+code[0]-1;if(!(bi>=0&&bi<BROKERS.length)||code.length!==5){net.err='コードが正しくありません';return}netReset();net.on=true;net.host=false;net.code=code;G.menu='lobby';
netOpen([bi],()=>'komabreaker/v2/r'+code,()=>{net.st='部屋を探しています…';net.hostSeen=now},()=>netLeave(failMsg()))}
function netLeave(err){if(net.ready)netSend({t:'x',h:net.host?1:0});const was=net.on;net.on=false;netClose();others.length=0;net.err=err||'';if(G.state!=='menu'&&G.state!=='title'&&was){resetWorld();G.state='menu'}if(G.state==='menu')G.menu='online';G.mode='solo';G.np=1;G.paused=false}
const lobbyMsg=()=>({t:'l',r:net.roster.map(r=>[r.id,r.slot]),m:net.mode,s:net.stage,go:net.started});
function dropPeer(id){const i=net.roster.findIndex(r=>r.id===id);if(i>=0)net.roster.splice(i,1);syncOthers()}
function syncOthers(){for(let i=others.length-1;i>=0;i--)if(!net.roster.find(r=>r.id===others[i].id))others.splice(i,1);
for(const r of net.roster){if(r.id===net.id){net.slot=r.slot;pl.slot=r.slot;continue}let o=others.find(q=>q.id===r.id);if(!o){const sp=SPAWN[r.slot];o={id:r.id,slot:r.slot,x:sp[0],z:sp[1],y:0,yaw:0,pitch:0,nx:sp[0],nz:sp[1],ny:0,nyaw:0,np:0,vx:0,vz:0,hp:100,dead:false,flash:0,fireT:0,wt:0,mv:0,gx:sp[0],gy:1.3,gz:sp[1],last:now,sp:0,pow:0};others.push(o)}o.slot=r.slot}}
function setRoster(r){net.roster=r.map(a=>({id:a[0],slot:a[1]}));syncOthers()}
function pvTally(k,v){if(k>=0&&k<4&&k!==v)G.pk[k]++;G.pd[v]++}
function onPState(m){const o=others.find(q=>q.id===m.i);if(!o)return;const s=m.s;o.vx=(s[0]-o.nx)/0.08;o.vz=(s[1]-o.nz)/0.08;o.nx=s[0];o.nz=s[1];o.ny=s[2];o.nyaw=s[3];o.np=s[4];o.hp=s[5];const wasDead=o.dead;o.dead=!!(s[6]&1);o.sp=s[6]&2;o.pow=s[6]&4;o.last=now;
if(wasDead&&!o.dead){o.x=o.nx;o.z=o.nz;fxStar(o.x,1,o.z,3,C.white,0.12)}if(!wasDead&&o.dead){fxBlobs(o.x,1,o.z,12,6,PCOL[o.slot],0.16);fxStar(o.x,1,o.z,3,C.white,0.12);if(G.mode==='pvp'&&lim('pd',0.3))sfxAt('ドシャッ',o.x,2.6,o.z,{size:56,st:'ink',life:0.5})}
if(m.f)for(const f of m.f){fxTracer(o.gx,o.gy,o.gz,f[0],f[1],f[2],o.pow?C.orange:C.white,0.06);fxStar(f[0],f[1],f[2],0.6,C.white,0.07);o.fireT=0.06;if(lim('rs'+o.slot,0.1)){const v=sndVol;sndVol=v*clamp(1.2-Math.hypot(o.x-pl.x,o.z-pl.z)/30,0.15,0.7);snd('shot');sndVol=v}}
if(m.pv&&G.mode==='pvp')for(const a of m.pv)if(a[0]===net.slot)hurtPlayer(a[1],o.x,o.z,o.slot);
if(net.host){if(m.d)for(const a of m.d){if(a[0]<0){const b=enemies.find(q=>q.id===-a[0]);if(b&&b.monk)monkBell(b,a[1]);continue}const e=enemies.find(q=>q.id===a[0]);if(e&&!e.dead&&!(e.type==='boss'&&(e.st==='rise'||e.st==='die'||e.st==='drop'))){e.hp-=a[1];e.flash=0.07;if(e.hp<=0)kill(e,o.slot)}}
 if(m.ps)for(const id of m.ps){const s=shots.find(q=>q.id===id);if(s)popShot(s)}if(m.pk)for(const id of m.pk){const i=items.findIndex(q=>q.id===id);if(i>=0)items.splice(i,1)}if(m.kb)for(const k of m.kb)pvTally(k,o.slot)}}
function updateOthers(dt){const k=Math.min(1,dt*12);for(const o of others){const px=o.x,pz=o.z;o.x+=(o.nx-o.x)*k;o.z+=(o.nz-o.z)*k;o.y+=(o.ny-o.y)*k;o.yaw+=angDiff(o.nyaw,o.yaw)*k;o.pitch+=(o.np-o.pitch)*k;o.mv=lerp(o.mv,Math.min(1,Math.hypot(o.x-px,o.z-pz)/Math.max(dt,0.001)/5),k);o.wt+=dt;o.fireT-=dt;o.flash-=dt}}
const TC={i:'imp',l:'lan',b:'bru'};
function snapMsg(){const m={t:'s',gs:G.state,r:net.roster.map(r=>[r.id,r.slot]),g:[G.wave,G.kills,G.score,r1(G.time),G.pk,G.pd,r1(G.tm)],it:items.map(i=>[i.id,i.k,r1(i.x),r1(i.z)])};
if(G.mode!=='pvp'){m.e=[];for(const e of enemies)if(!e.dead&&e.type!=='boss')m.e.push([e.id,e.type[0],r1(e.x),r1(e.y),r1(e.z),r2(e.yaw),e.st,r2(e.stT),Math.ceil(e.hp),r2(e.sc),e.v]);
m.sh=shots.filter(s=>!s.dead).map(s=>[s.id,s.k,r1(s.x),r1(s.y),r1(s.z),r1(s.vx),r1(s.vy),r1(s.vz),s.tx||0,s.tz||0]);m.et=r1(G.endT);
const b=boss;if(b&&b.monk)m.k=[b.id,b.st,r2(b.stT),Math.ceil(b.hp),Math.ceil(b.mhp),r1(b.x),r1(b.y),r1(b.z),r2(b.yaw),b.phase,Math.ceil(b.bhp),Math.ceil(b.bmax),r1(b.tx),r1(b.tz),b.bell2?[r1(b.bell2.x),r1(b.bell2.z),r2(b.bell2.yaw)]:0];else if(b)m.b=[b.id,b.st,r2(b.stT),Math.ceil(b.hp),Math.ceil(b.mhp),r1(b.yo),b.phase,r2(b.mouth),b.ah,r1(b.tx),r1(b.tz),r1(b.hL.x),r1(b.hL.y),r1(b.hL.z),r1(b.hR.x),r1(b.hR.y),r1(b.hR.z)]}
if(net.hq.length){m.h=net.hq;net.hq=[]}net.evq=net.evq.filter(e=>now-e[3]<0.7);if(net.evq.length)m.ev=net.evq.map(e=>[e[0],e[1],e[2]]);return m}
function onSnap(m){if(G.state==='menu'||G.state==='title')return;setRoster(m.r);const g=m.g;G.wave=g[0];G.kills=g[1];G.score=g[2];G.time=g[3];G.pk=g[4];G.pd=g[5];G.tm=g[6];G.np=net.roster.length;
if(m.gs!==G.state&&(m.gs==='clear'||m.gs==='over')&&G.state==='play'){G.state=m.gs;G.resT=0;musOn=0;snd('ui');if(m.gs==='clear')saveHi();skReward(m.gs==='clear')}
const old={};for(const it of items)old[it.id]=it;items.length=0;for(const a of m.it)if(!net.picked[a[0]])items.push(old[a[0]]||{id:a[0],k:a[1],x:a[2],z:a[3],t:0});
if(m.e){const map={},keep={};for(const e of enemies)map[e.id]=e;
 for(const a of m.e){let e=map[a[0]];if(!e){e={id:a[0],type:TC[a[1]],x:a[2],y:a[3],z:a[4],yaw:a[5],t:rnd(0,9),flash:0,dead:false,seed:rnd(0,100),kx:0,kz:0,r:0.6,sc:a[9],v:a[10],st:a[6],stT:a[7],mine:-9};enemies.push(e);if(a[6]==='spawn')spawnFx(e)}
  e.nx=a[2];e.ny=a[3];e.nz=a[4];e.nyaw=a[5];if(e.st!==a[6]){e.st=a[6];e.stT=a[7]}else if(Math.abs(e.stT-a[7])>0.3)e.stT=a[7];e.hp=a[8];keep[a[0]]=1}
 if(m.b){const a=m.b;let b=map[a[0]];if(!b){b={id:a[0],type:'boss',x:0,y:0,z:-21.5,yaw:0,t:0,flash:0,dead:false,seed:1,mine:-9,hx:0,r:6,st:a[1],stT:a[2],yo:a[5],hL:{x:a[11],y:a[12],z:a[13]},hR:{x:a[14],y:a[15],z:a[16]}};enemies.push(b);boss=b;bossIntro()}
  if(b.st!==a[1]){b.st=a[1];b.stT=a[2];if(a[1]==='die')musOn=0}b.hp=a[3];b.mhp=a[4];b.nyo=a[5];b.phase=a[6];b.mouth=a[7];b.ah=a[8];b.tx=a[9];b.tz=a[10];b.nL=[a[11],a[12],a[13]];b.nR=[a[14],a[15],a[16]];keep[a[0]]=1}
 if(m.k){const a=m.k;let b=map[a[0]];if(!b){b=mkMonk(a[0]);b.st=a[1];b.stT=a[2];b.x=b.px=a[5];b.y=a[6];b.z=b.pz=a[7];b.yaw=a[8];enemies.push(b);boss=b;if(a[1]==='drop'){bossIntro();templeDoor.target=1}}
  if(b.st!==a[1]){b.st=a[1];b.stT=a[2];if(a[1]==='die')musOn=0}else if(Math.abs(b.stT-a[2])>0.3)b.stT=a[2];
  b.hp=a[3];b.mhp=a[4];b.nx=a[5];b.ny=a[6];b.nz=a[7];b.nyaw=a[8];b.phase=a[9];b.bhp=a[10];b.bmax=a[11];b.tx=a[12];b.tz=a[13];if(a[14]&&!b.bell2)b.bell2=mkBell2(b,a[14][0],a[14][1],a[14][2]);keep[a[0]]=1}
 for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(keep[e.id])continue;if(e.type==='boss')boss=null;else killFx(e);enemies.splice(i,1)}
 const sm={},sk={};for(const s of shots)sm[s.id]=s;for(const a of m.sh){let s=sm[a[0]];if(!s){s={id:a[0],k:a[1],r:a[1]?0.55:0.28,g:a[1]?16:0,dead:false,life:9};shots.push(s)}if(!s.dead){s.x=a[2];s.y=a[3];s.z=a[4];s.vx=a[5];s.vy=a[6];s.vz=a[7];s.tx=a[8];s.tz=a[9]}sk[a[0]]=1}
 for(let i=shots.length-1;i>=0;i--){const s=shots[i];if(sk[s.id])continue;if(!s.dead&&s.k===0)popShot(s);shots.splice(i,1)}
 if(m.et>=0&&G.endT<0)G.endT=m.et}
if(m.h)for(const h of m.h)if(h[0]===net.slot)hurtPlayer(h[1],h[2],h[3]);
if(m.ev)for(const e of m.ev)if(e[0]>net.evDone){net.evDone=e[0];FXE[e[1]](...e[2])}}
function clientInterp(dt){const k=Math.min(1,dt*10);for(const e of enemies){if(e.monk){e.x+=(e.nx-e.x)*k;e.y+=(e.ny-e.y)*k;e.z+=(e.nz-e.z)*k;e.yaw+=angDiff(e.nyaw,e.yaw)*k;monkCos(e,dt);continue}if(e.type==='boss'){bossCos(e,dt);e.yo+=(e.nyo-e.yo)*k;if(e.nL){e.hL.x+=(e.nL[0]-e.hL.x)*k;e.hL.y+=(e.nL[1]-e.hL.y)*k;e.hL.z+=(e.nL[2]-e.hL.z)*k;e.hR.x+=(e.nR[0]-e.hR.x)*k;e.hR.y+=(e.nR[1]-e.hR.y)*k;e.hR.z+=(e.nR[2]-e.hR.z)*k}continue}
e.t+=dt;e.stT+=dt;e.flash-=dt;e.x+=(e.nx-e.x)*k;e.y+=(e.ny-e.y)*k;e.z+=(e.nz-e.z)*k;e.yaw+=angDiff(e.nyaw,e.yaw)*k}
for(const s of shots){s.vy-=s.g*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt}if(G.endT>=0)G.endT+=RDT}
function netMsg(m){const t=m.t;if(net.host){net.seen[m.i]=now;
 if(t==='j'){if(!net.roster.find(r=>r.id===m.i)&&net.roster.length<4&&!net.started){let s=0;while(net.roster.find(r=>r.slot===s))s++;net.roster.push({id:m.i,slot:s});syncOthers();snd('ui')}net.lobT=0;if(net.started)netSend(lobbyMsg())}
 else if(t==='x')dropPeer(m.i);else if(t==='p')onPState(m)}
else{if(t==='l'){net.hostSeen=now;net.mode=m.m;net.stage=m.s;setRoster(m.r);const me=net.roster.find(r=>r.id===net.id);if(me)net.st='';else if(m.go)net.st='ゲーム中のため入れません';else if(net.roster.length>=4)net.st='満員です';
  if(!m.go&&me&&G.state!=='menu'&&G.state!=='title'&&!wipe.on){resetWorld();G.state='menu';G.menu='lobby';G.paused=false}net.started=!!m.go}
 else if(t==='go'){net.hostSeen=now;if(G.state==='menu'&&m.r.find(a=>a[0]===net.id)){net.mode=m.m;net.stage=m.s;setRoster(m.r);startWipe(startNet)}}
 else if(t==='s'){net.hostSeen=now;onSnap(m)}else if(t==='p')onPState(m);else if(t==='x'){if(m.h)netLeave('ホストが退出しました')}}}
function hostStart(){net.started=true;const m={t:'go',r:net.roster.map(r=>[r.id,r.slot]),m:net.mode,s:net.stage};netSend(m);setTimeout(()=>netSend(m),300);setTimeout(()=>netSend(m),800);startWipe(startNet)}
function hostLobby(){net.started=false;resetWorld();G.state='menu';G.menu='lobby';net.lobT=0}
function startNet(){G.mode=net.mode;G.stage=net.stage;net.started=true;syncOthers();beginGame()}
function netTick(dt){if(!net.on||!net.ready)return;const q=net.q;
if(G.state==='menu'){if(net.host){net.lobT-=dt;if(net.lobT<=0){net.lobT=0.5;for(const r of net.roster.slice())if(r.id!==net.id&&now-(net.seen[r.id]||0)>7)dropPeer(r.id);netSend(lobbyMsg())}}
 else{net.joinT-=dt;if(net.joinT<=0){net.joinT=1;netSend({t:'j'})}if(now-net.hostSeen>9)netLeave(net.roster.length?'ホストとの接続が切れました':'部屋が見つかりませんでした')}return}
net.sendT-=dt;if(net.sendT<=0){net.sendT=0.08;const m={t:'p',s:[r2(pl.x),r2(pl.z),r2(pl.y),r2(pl.yaw),r2(pl.pitch),Math.ceil(pl.hp),(pl.dead?1:0)|(pl.sp===2?2:0)|(pl.pow>0?4:0)]};
 if(q.f.length){m.f=q.f.slice(-6);q.f=[]}if(q.pk.length){m.pk=q.pk;q.pk=[]}if(q.kb.length){m.kb=q.kb;q.kb=[]}if(q.ps.length){m.ps=q.ps;q.ps=[]}
 let a=[];for(const k in net.dacc)a.push([+k,Math.round(net.dacc[k])]);if(a.length){m.d=a;net.dacc={}}a=[];for(const k in net.pvAcc)a.push([+k,Math.round(net.pvAcc[k])]);if(a.length){m.pv=a;net.pvAcc={}}netSend(m)}
if(net.host){for(const r of net.roster.slice())if(r.id!==net.id&&now-(net.seen[r.id]||0)>7)dropPeer(r.id);net.snapT-=dt;if(net.snapT<=0){net.snapT=0.1;netSend(snapMsg())}}
else if(now-net.hostSeen>9)netLeave('ホストとの接続が切れました')}
