'use strict';
// ================= CORE =================
const W=1280,H=720,PI=Math.PI,TAU=PI*2;
const stageEl=document.getElementById('stage'),glc=document.getElementById('gl'),uic=document.getElementById('ui');
const ctx=uic.getContext('2d');
const gl=glc.getContext('webgl2',{antialias:false,alpha:false,depth:false,stencil:false,powerPreference:'high-performance'});
function fit(){const s=Math.min(innerWidth/W,innerHeight/H);stageEl.style.transform='translate('+((innerWidth-W*s)/2)+'px,'+((innerHeight-H*s)/2)+'px) scale('+s+')'}
addEventListener('resize',fit);addEventListener('orientationchange',fit);fit();
if(!gl){ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.fillStyle='#000';ctx.font='bold 32px sans-serif';ctx.textAlign='center';ctx.fillText('このゲームには WebGL2 対応ブラウザが必要です',W/2,H/2);throw new Error('WebGL2 is not supported')}
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,sat=v=>v<0?0:v>1?1:v;
const pick=a=>a[(Math.random()*a.length)|0];
const easeOut=t=>1-(1-t)*(1-t)*(1-t);
const easeBack=t=>{const u=t-1;return 1+2.70158*u*u*u+1.70158*u*u};
function angDiff(a,b){let d=a-b;while(d>PI)d-=TAU;while(d<-PI)d+=TAU;return d}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
// ---- matrices (column major) ----
const m4=()=>new Float32Array(16);
function m4mul(o,a,b){for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o}
function m4persp(o,fy,asp,n,f){const t=1/Math.tan(fy/2);o.fill(0);o[0]=t/asp;o[5]=t;o[10]=(f+n)/(n-f);o[11]=-1;o[14]=2*f*n/(n-f);return o}
function m4ortho(o,l,r,b,t,n,f){o.fill(0);o[0]=2/(r-l);o[5]=2/(t-b);o[10]=-2/(f-n);o[12]=-(r+l)/(r-l);o[13]=-(t+b)/(t-b);o[14]=-(f+n)/(f-n);o[15]=1;return o}
function m4look(o,ex,ey,ez,cx,cy,cz,ux,uy,uz){let zx=ex-cx,zy=ey-cy,zz=ez-cz,l=1/Math.hypot(zx,zy,zz);zx*=l;zy*=l;zz*=l;let xx=uy*zz-uz*zy,xy=uz*zx-ux*zz,xz=ux*zy-uy*zx;l=1/Math.hypot(xx,xy,xz);xx*=l;xy*=l;xz*=l;const yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
o[0]=xx;o[1]=yx;o[2]=zx;o[3]=0;o[4]=xy;o[5]=yy;o[6]=zy;o[7]=0;o[8]=xz;o[9]=yz;o[10]=zz;o[11]=0;o[12]=-(xx*ex+xy*ey+xz*ez);o[13]=-(yx*ex+yy*ey+yz*ez);o[14]=-(zx*ex+zy*ey+zz*ez);o[15]=1;return o}
const MS=[];for(let i=0;i<40;i++)MS.push(m4());let mi=0,M=MS[0];
function mReset(){mi=0;M=MS[0];M.fill(0);M[0]=M[5]=M[10]=M[15]=1}
function mPush(){const n=MS[mi+1];n.set(M);mi++;M=n}
function mPop(){mi--;M=MS[mi]}
function mT(x,y,z){M[12]+=M[0]*x+M[4]*y+M[8]*z;M[13]+=M[1]*x+M[5]*y+M[9]*z;M[14]+=M[2]*x+M[6]*y+M[10]*z}
function mS(x,y,z){M[0]*=x;M[1]*=x;M[2]*=x;M[4]*=y;M[5]*=y;M[6]*=y;M[8]*=z;M[9]*=z;M[10]*=z}
function mRY(a){const c=Math.cos(a),s=Math.sin(a);for(let i=0;i<3;i++){const p=M[i],q=M[8+i];M[i]=p*c-q*s;M[8+i]=p*s+q*c}}
function mRX(a){const c=Math.cos(a),s=Math.sin(a);for(let i=0;i<3;i++){const p=M[4+i],q=M[8+i];M[4+i]=p*c+q*s;M[8+i]=-p*s+q*c}}
function mRZ(a){const c=Math.cos(a),s=Math.sin(a);for(let i=0;i<3;i++){const p=M[i],q=M[4+i];M[i]=p*c+q*s;M[4+i]=-p*s+q*c}}
mReset();
