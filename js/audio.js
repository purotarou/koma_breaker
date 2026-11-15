'use strict';
// ================= AUDIO =================
let AC=null,master=null,nbuf=null,musG=null,sndVol=1,musOn=0,musNext=0,musStep=0;
function audioInit(){if(AC){if(AC.state==='suspended')AC.resume();return}try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return}
master=AC.createGain();master.gain.value=0.6;const cp=AC.createDynamicsCompressor();master.connect(cp);cp.connect(AC.destination);musG=AC.createGain();musG.gain.value=0.3*SET.bgm;musG.connect(master);
nbuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
function tone(type,f0,f1,dur,vol,dl,dest){const t=AC.currentTime+(dl||0),o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);o.connect(g);g.connect(dest||master);o.start(t);o.stop(t+dur+0.02)}
function noise(dur,vol,ft,f0,f1,dl,dest){const t=AC.currentTime+(dl||0),s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=nbuf;s.loop=true;f.type=ft;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);s.connect(f);f.connect(g);g.connect(dest||master);s.start(t,Math.random()*0.5);s.stop(t+dur+0.02)}
function snd(n,a){if(!AC||AC.state!=='running'||sndVol<=0)return;const v=sndVol*SET.se;a=a||1;switch(n){
case'shot':noise(0.16,0.5*v,'lowpass',6000,500);tone('square',240,50,0.1,0.25*v);tone('sine',130,40,0.18,0.5*v);break;
case'hit':tone('square',520,180,0.06,0.2*v);noise(0.07,0.3*v,'bandpass',2400,900);break;
case'crit':tone('triangle',1500,2600,0.12,0.25*v);tone('square',700,200,0.08,0.2*v);break;
case'kill':tone('sawtooth',300,40,0.25,0.3*v);noise(0.22,0.4*v,'lowpass',2500,200);break;
case'boom':noise(0.5+0.25*a,0.8*v,'lowpass',2600,60);tone('sine',110,28,0.5+0.2*a,0.8*v);break;
case'dash':noise(0.2,0.3*v,'highpass',600,4000);break;
case'reload':tone('square',900,600,0.03,0.15*v);tone('square',500,300,0.04,0.2*v,0.12);break;
case'empty':tone('square',1200,900,0.03,0.12*v);break;
case'hurt':tone('sawtooth',160,50,0.25,0.4*v);noise(0.15,0.3*v,'lowpass',900,200);break;
case'charge':tone('sawtooth',120,900,0.5,0.25*v);break;
case'beam':noise(0.9,0.7*v,'lowpass',5000,200);tone('sawtooth',90,40,0.9,0.5*v);tone('square',880,220,0.6,0.15*v);break;
case'roar':tone('sawtooth',90,45,1.2,0.5*v);tone('sawtooth',95,40,1.2,0.4*v);noise(1.1,0.35*v,'lowpass',700,150);break;
case'spawn':tone('sine',90,240,0.2,0.2*v);break;
case'ui':tone('square',660,990,0.09,0.2*v);tone('square',990,1320,0.1,0.2*v,0.08);break;
case'jump':tone('square',260,520,0.1,0.15*v);break;
case'land':noise(0.1,0.3*v,'lowpass',700,150);break;
case'item':tone('triangle',880,1320,0.1,0.25*v);tone('triangle',1320,1760,0.14,0.25*v,0.09);break;
case'gong':tone('sine',196,192,2.4,0.55*v);tone('sine',392,386,1.6,0.25*v);tone('triangle',523,515,1.1,0.12*v);tone('sine',98,96,2.6,0.4*v);noise(0.25,0.35*v,'bandpass',2600,900);break;
case'clank':tone('triangle',1800,1500,0.09,0.18*v);tone('square',900,700,0.05,0.1*v);break;
case'orb':tone('triangle',1200,1800,0.05,0.08*v);break;}}
const MEL=[74,0,0,74,0,75,74,0,70,0,69,0,67,0,69,0,70,0,0,70,0,69,67,0,63,0,62,0,0,0,62,63,67,0,0,67,0,69,70,0,74,0,75,0,74,0,70,0,69,0,70,69,67,0,63,0,62,0,0,0,62,0,74,0],BAS=[38,34,31,33];
const mf=m=>440*Math.pow(2,(m-69)/12);
function music(){if(!AC||AC.state!=='running'||!musOn)return;const sd=musOn===2?0.088:0.105;if(musNext<AC.currentTime)musNext=AC.currentTime+0.05;
while(musNext<AC.currentTime+0.2){const s=musStep%64,b=s%16,dl=musNext-AC.currentTime;
if(b===0||b===6||b===8||(musOn===2&&b===14))tone('sine',120,42,0.2,0.9,dl,musG);if(b===4||b===12)noise(0.12,0.5,'bandpass',1800,900,dl,musG);if(b%2===0)noise(0.03,b%4===2?0.22:0.1,'highpass',7000,9000,dl,musG);
if(b%4===0||b%8===3||b%8===6){const f=mf(BAS[(s/16)|0]+(musOn===2&&b%8===3?12:0));tone('sawtooth',f,f,0.16,0.35,dl,musG)}
const m=MEL[s];if(m){const f=mf(m+(musOn===2?0:0));tone('triangle',f,f*0.995,0.22,0.5,dl,musG);tone('square',f*2,f*2,0.06,0.08,dl,musG)}
musNext+=sd;musStep++}}
