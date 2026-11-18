'use strict';
// ---- shaders ----
function shd(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.error(gl.getShaderInfoLog(s));throw new Error('shader')}return s}
function mkProg(vs,fs,names){const p=gl.createProgram();gl.attachShader(p,shd(gl.VERTEX_SHADER,vs));gl.attachShader(p,shd(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){console.error(gl.getProgramInfoLog(p));throw new Error('link')}const u={};for(const n of names)u[n]=gl.getUniformLocation(p,n);return{p,u}}
const INST=`layout(location=0) in vec3 aP;layout(location=1) in vec3 aN;layout(location=2) in vec4 i0;layout(location=3) in vec4 i1;layout(location=4) in vec4 i2;layout(location=5) in vec4 i3;layout(location=6) in vec4 iC;layout(location=7) in vec4 iX;`;
// Stage animation, chosen per instance by flag bits (kb_flags in Blender): 8 sway (foliage, bends more the higher it is),
// 16 cloth (nobori: ripples along the instance's local Z, moving along local X), 32 drift (clouds: slow orbit around the stage),
// 64 flame (flickers / licks around the instance origin). Shared by the G-buffer and shadow passes so shadows move too.
const ANIM=`uniform float uT;
vec3 kbAnim(vec3 w,vec3 o,mat3 m3,float fl,inout vec3 n){float b=floor(fl/8.0);if(b<0.5)return w;
if(mod(b,2.0)>0.5){float h=clamp((w.y-1.0)/10.0,0.0,1.5),ph=dot(o.xz,vec2(0.05,0.04))+dot(w.xz,vec2(0.08,0.05));
 w.x+=(sin(uT*1.3+ph)*0.32+sin(uT*3.1+ph*2.3)*0.07)*h;w.z+=(sin(uT*1.05+ph*1.7)*0.22+sin(uT*2.7+ph*1.9)*0.05)*h;
 w+=0.035*h*sin(uT*5.0+dot(w,vec3(2.1,1.7,2.3)));}
if(mod(floor(b*0.5),2.0)>0.5){vec3 ax=normalize(m3[0]),az=normalize(m3[2]);float d=max(dot(w-o,az)+0.42,0.0);
 w+=ax*(sin(uT*5.5-d*6.0+w.y*1.3+dot(o.xz,vec2(1.7,2.3)))*0.14+sin(uT*9.0-d*9.0+w.y*2.0)*0.04)*d;}
if(mod(floor(b*0.25),2.0)>0.5){float a=uT*0.004,c=cos(a),s=sin(a);w.xz=mat2(c,s,-s,c)*w.xz;n.xz=mat2(c,s,-s,c)*n.xz;}
if(mod(floor(b*0.125),2.0)>0.5){vec3 r=w-o;float k=1.0+0.2*sin(uT*17.0+o.x*3.0)+0.1*sin(uT*29.0+o.z*5.0),tip=max(r.y,0.0);
 r.y*=k;r.xz*=1.0+0.08*sin(uT*23.0+o.x*7.0);r.x+=tip*0.3*sin(uT*9.0+o.z*2.0);r.z+=tip*0.25*sin(uT*11.0+o.x*2.0);w=o+r;}
return w;}`;
const VS_G=`#version 300 es
precision highp float;
${INST}
${ANIM}
layout(location=8) in vec2 aU;
uniform mat4 uVP,uLVP;
out vec3 vN,vW,vO,vL;out vec4 vC,vX;out vec2 vU;
void main(){vU=aU;mat4 m=mat4(i0,i1,i2,i3);vec4 w=m*vec4(aP,1.0);mat3 m3=mat3(m);
vec3 s2=vec3(dot(m3[0],m3[0]),dot(m3[1],m3[1]),dot(m3[2],m3[2]));
vN=normalize(m3*(aN/s2));w.xyz=kbAnim(w.xyz,i3.xyz,m3,iX.z,vN);vW=w.xyz;vO=aP*sqrt(s2);
vec4 l=uLVP*vec4(w.xyz+vN*0.07,1.0);vL=l.xyz*0.5+0.5;vC=iC;vX=iX;gl_Position=uVP*w;}`;
const FS_G=`#version 300 es
precision highp float;precision mediump sampler2DShadow;
in vec3 vN,vW,vO,vL;in vec4 vC,vX;in vec2 vU;
uniform sampler2DShadow uSh;uniform sampler2D uHT,uBT,uBM;uniform vec3 uLD,uCam;uniform mat4 uV;uniform float uT;
layout(location=0) out vec4 o0;layout(location=1) out vec4 o1;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float ln(float d,float w){float a=fwidth(d)*1.2+1e-5;return 1.0-smoothstep(w-a,w+a,d);}
void main(){
vec3 N=normalize(vN);vec3 alb=vC.rgb;float mat=vC.a;
float fl=vX.z;float unlit=mod(fl,2.0);float noE=mod(floor(fl*0.5),2.0);
float L=dot(N,uLD)*0.5+0.5;float sh=1.0;
if(vL.x>0.0&&vL.x<1.0&&vL.y>0.0&&vL.y<1.0&&vL.z<1.0)sh=texture(uSh,vec3(vL.xy,vL.z-0.0012));
L=min(L,mix(0.2,1.0,sh));
float pf=1.0-smoothstep(28.0,80.0,length(vW-uCam));
// mat 10/11: textured (the hero, uHT on unit 3, UV at location 8). 11 also turns the strongly red texels (the coat) into the instance colour,
// keeping the texture's shading. A flash (gTint, which also sets the unlit flag) whitens it.
// mat 12-14: the final boss (js/boss5.js; colour uBT on unit 4, skin mask uBM on unit 5). The UV of his right half carries u+1.
// 12 = as baked (white), 13 = the skin becomes the instance colour, 14 = his right half red / left half black (the first form).
// mat 15: the open sea of stage 5 (js/sea.js). World-space swells, crest lines and ripples that stream south (+z) at the ship's speed (9 m/s),
// so the ship sailing north reads from the water alone. Kept far past the usual pattern fade so the motion shows out to the horizon.
if(mat>14.5){vec2 p=vW.xz;float D=length(vW.xz-uCam.xz),fd=1.0-smoothstep(140.0,560.0,D),fz=p.y-uT*9.0;
 float sw=sin(p.x*0.045+fz*0.06)*1.6+sin(p.x*0.11-fz*0.031)*0.7,band=fract(fz*0.085+sw*0.12);
 alb*=mix(0.8,1.07,smoothstep(0.05,0.6,band)*(1.0-smoothstep(0.72,0.98,band)));
 float cr=ln(abs(band-0.64)/0.085,0.13)*step(0.1,sin(p.x*0.33+fz*0.11+sin(fz*0.07)*3.0));alb=mix(alb,vec3(1.0),cr*0.92*fd);
 float r2=abs(fract(fz*0.42+p.x*0.11+sin(p.x*0.37+fz*0.29)*0.45)-0.5)*2.0;alb=mix(alb,alb*1.22+0.04,ln(r2,0.07)*0.7*(1.0-smoothstep(25.0,110.0,D)));}
else if(mat>11.5){float sd=step(1.0,vU.x);vec2 uv=vec2(vU.x-sd,vU.y);vec3 t=texture(uBT,uv).rgb;
 if(mat>12.5){float m=texture(uBM,uv).r;vec3 tc=mat>13.5?mix(vec3(0.2,0.2,0.22),vec3(0.86,0.1,0.1),sd):vC.rgb;t=mix(t,tc*clamp((t.r+t.g+t.b)*0.3833,0.3,1.15),m);}
 alb=unlit>0.5?mix(t,vec3(1.0),0.85):t;}
else if(mat>9.5){vec3 t=texture(uHT,vU).rgb;
 if(mat>10.5){float c=(t.r-max(t.g,t.b))/max(t.r,0.001);float k=smoothstep(0.25,0.45,c)*step(0.12,t.r)*(1.0-smoothstep(0.03,0.07,t.g-t.b));
  t=mix(t,vC.rgb*clamp((t.r+t.g+t.b)/1.1,0.35,1.15),k);}
 alb=unlit>0.5?mix(t,vec3(1.0),0.85):t;}
else if(mat>0.5){
 if(mat<1.5){vec2 p=vW.xz/vec2(1.6,1.0);float row=floor(p.y);p.x+=mod(row,2.0)*0.5;vec2 c=floor(p);vec2 f=fract(p);vec2 dd=min(f,1.0-f)*vec2(1.6,1.0);
  float l=max(ln(dd.x,0.03),ln(dd.y,0.03));alb*=0.93+0.1*hash(c+row*13.0);alb=mix(alb,alb*0.5,l*pf);}
 else if(mat<2.5){float d=abs(fract(vO.x/0.5)-0.5)*0.5;alb=mix(alb,alb*0.55,ln(d,0.02)*pf);}
 else if(mat<3.5){float d=abs(fract(vO.z/0.5)-0.5)*0.5;alb=mix(alb,alb*0.55,ln(d,0.02)*pf);}
 else if(mat<4.5){vec2 g=vW.xz/1.3;vec2 c=floor(g);float h=hash(c);
  if(h>0.5){vec2 q=fract(g)-0.5-(vec2(hash(c+1.7),hash(c+9.2))-0.5)*0.5;float a=h*50.0;float cs=cos(a),sn=sin(a);q=vec2(cs*q.x-sn*q.y,sn*q.x+cs*q.y)*1.3;
   float m=ln(abs(q.y),0.018)*step(abs(q.x),0.10+0.12*hash(c+4.4));m=max(m,ln(abs(q.y-0.08),0.014)*step(abs(q.x+0.04),0.07));alb=mix(alb,alb*0.62,m*pf);}}
 else if(mat<5.5){vec2 p=vec2(vO.x+vO.z,vO.y)/vec2(1.1,0.45);float row=floor(p.y);p.x+=mod(row,2.0)*0.5;vec2 f=fract(p);vec2 dd=min(f,1.0-f)*vec2(1.1,0.45);
  alb=mix(alb,alb*0.55,max(ln(dd.x,0.02),ln(dd.y,0.02))*pf);}
 else if(mat<6.5){float d=abs(fract(vO.y/0.17)-0.5)*0.17;alb=mix(alb,alb*0.62,ln(d,0.012)*pf);}
 else if(mat<7.5){vec2 p=vO.xz;float d=abs(fract((p.x*0.8+p.y*0.5)*2.2+sin(p.y*3.0+uT*1.5)*0.25-uT*0.35)-0.5)/2.2;
  alb=mix(alb,vec3(1.0),ln(d,0.035)*step(0.1,sin(p.x*5.0-p.y*3.0+uT*0.9))*0.85*pf);}
 else if(mat<8.5){vec3 an=abs(N);vec2 p=an.y>max(an.x,an.z)*1.3?vO.xz:(an.x>an.z?vO.zy:vO.xy);p*=0.72;vec2 c=floor(p);
  if(hash(c+vec2(3.1,7.7))>0.3){vec2 q=fract(p)-0.5-(vec2(hash(c+1.3),hash(c+5.9))-0.5)*0.35;float r=0.2+0.1*hash(c+2.2);
   float m=ln(abs(length(q)-r),0.03)*step(q.y,-0.04);alb=mix(alb,alb*0.5,m*pf*(L<0.62?1.0:0.75));}}
 else if(mat<9.5){float r=length(vO.xz),n=max(3.0,floor(6.2832*r/0.32)),s=(atan(vO.z,vO.x)/6.2832+0.5)*n,col=floor(s);
  float h=hash(vec2(col,floor(vO.y/1.1+hash(vec2(col,1.0)))));float d=abs(fract(s+0.15*sin(vO.y*2.3+col*1.7))-0.5)*0.32;
  alb=mix(alb,alb*0.6,ln(d,0.016)*step(0.3,h)*pf);}
}
float a=L*0.85;
vec3 Vd=normalize(uCam-vW);
if(vX.y>0.0){vec3 Hh=normalize(Vd+uLD);float sp=pow(max(dot(N,Hh),0.0),24.0/vX.y);if(sp>0.5&&sh>0.5)a=1.0;}
if(vX.w>0.0){float rim=1.0-max(dot(N,Vd),0.0);if(rim>1.0-0.3*vX.w&&dot(N,uLD)>-0.1)a=1.0;}
if(unlit>0.5)a=0.85;
if(mat>9.5)a=mix(a,0.85,0.45);// the texture already carries soft shading: tone dots only in the deeper shadows
o0=vec4(alb,a);
vec3 vn=normalize(mat3(uV)*N);
o1=vec4(vn.xy*0.5+0.5,vX.x/255.0,(unlit+2.0*noE)/3.0);}`;
const VS_S=`#version 300 es
precision highp float;
${INST}
${ANIM}
uniform mat4 uLVP;
void main(){mat4 m=mat4(i0,i1,i2,i3);float nc=mod(floor(iX.z*0.25),2.0);vec3 n=vec3(0.0);vec3 w=kbAnim((m*vec4(aP,1.0)).xyz,i3.xyz,mat3(m),iX.z,n);gl_Position=nc>0.5?vec4(2.0,2.0,2.0,1.0):uLVP*vec4(w,1.0);}`;
const FS_S=`#version 300 es
precision mediump float;void main(){}`;
const VS_Q=`#version 300 es
out vec2 vUv;void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));vUv=p;gl_Position=vec4(p*2.0-1.0,0.0,1.0);}`;
const FS_P=`#version 300 es
precision highp float;
in vec2 vUv;out vec4 oC;
uniform sampler2D uC,uN;uniform highp sampler2D uD;
uniform vec2 uPx,uTan,uFocus;uniform float uNear,uFar,uTime,uMood,uFlash,uInv,uMono,uHurt;
uniform vec3 uCR,uCU,uCF,uS0,uS1,uS2,uFogC,uGrade,uShade,uFogR;uniform float uNight;uniform vec2 uVS;
const vec2 OFF[4]=vec2[4](vec2(1.,0.),vec2(0.,1.),vec2(.7071,.7071),vec2(.7071,-.7071));
const mat2 R45=mat2(.7071,-.7071,.7071,.7071);
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float h1(float x){return fract(sin(x*127.1)*43758.5453);}
float linZ(float d){return uNear*uFar/(uFar-d*(uFar-uNear));}
vec3 dn(vec2 e){vec2 p=e*2.0-1.0;return vec3(p,sqrt(max(0.0,1.0-dot(p,p))));}
vec3 sky(vec2 uv,vec2 fc){
 vec2 nd=uv*2.0-1.0;vec3 dir=normalize(uCF+uCR*nd.x*uTan.x+uCU*nd.y*uTan.y);
 float g=clamp(dir.y/0.8,0.0,1.0);
 vec3 top=mix(uS0,vec3(0.28,0.03,0.15),uMood);
 vec3 mid=mix(uS1,vec3(0.90,0.25,0.18),uMood);
 vec3 hor=mix(uS2,vec3(1.0,0.82,0.45),uMood);
 vec3 base=mix(hor,mid,smoothstep(0.0,0.4,g));
 vec2 q=R45*fc/9.0;float dd=length(fract(q)-0.5);
 float r=smoothstep(0.12,0.95,g)*0.8;
 float m=(1.0-smoothstep(r-0.06,r+0.06,dd))*step(0.01,r);
 vec3 col=mix(base,top,m);
 if(uNight>0.5){vec2 sp=vec2(atan(dir.z,dir.x)*30.0,dir.y*40.0);vec2 cl=floor(sp);float hh=hash(cl);vec2 sf=fract(sp)-0.5-(vec2(hash(cl+3.3),hash(cl+7.1))-0.5)*0.6;col=mix(col,vec3(1.0,0.98,0.8),step(0.86,hh)*(1.0-smoothstep(0.03,0.08,length(sf)))*(1.0-uMood)*step(0.03,dir.y));}
 if(uMood>0.01){vec2 p=(uv-uFocus)*vec2(1.7778,1.0);float ang=atan(p.y,p.x);float rr=length(p);float k=floor(ang*38.0);
  float hs=h1(k),hs2=h1(k+0.5);float inner=0.20+0.32*hs+0.03*sin(uTime*4.0+hs*40.0);
  col=mix(col,vec3(0.09,0.02,0.10),step(0.42,hs2)*smoothstep(inner,inner+0.015,rr)*uMood*0.9);}
 return col;}
void main(){
 vec2 uv0=vUv,uv=vUv*uVS,fc=gl_FragCoord.xy;// uv0: 0..1 over the viewport, uv: where to read the (W x H) buffers (a smaller viewport = the gacha highlight frame)
 vec4 c=texture(uC,uv),n=texture(uN,uv);float d=texture(uD,uv).r;float dm=d;
 for(int i=0;i<2;i++){vec2 o=OFF[i]*2.2*uPx;dm=min(dm,min(texture(uD,uv+o).r,texture(uD,uv-o).r));}
 float z=linZ(d),zm=linZ(dm);
 float th=clamp(6.5/zm,0.8,2.2);
 float code=floor(n.a*3.0+0.5);float unlit=mod(code,2.0);float noE=step(1.5,code);
 vec3 nc=dn(n.xy);float eI=0.0,eN=0.0;
 for(int i=0;i<4;i++){vec2 o=OFF[i]*th*uPx;vec4 a=texture(uN,uv+o),b=texture(uN,uv-o);
  float wa=1.0-step(1.5,floor(a.a*3.0+0.5)),wb=1.0-step(1.5,floor(b.a*3.0+0.5));
  eI+=wa*step(0.0019,abs(a.b-n.b))+wb*step(0.0019,abs(b.b-n.b));
  eN+=wa*(1.0-dot(nc,dn(a.xy)))+wb*(1.0-dot(nc,dn(b.xy)));}
 float e=max(smoothstep(0.5,2.2,eI),smoothstep(0.8,2.0,eN))*(1.0-noE);
 vec3 fogC=mix(uFogC,vec3(1.0,0.80,0.50),uMood);
 vec3 col;
 if(n.b<0.001&&d>0.99999){col=sky(uv0,fc);}
 else{
  vec3 base=c.rgb;float a=c.a;float L=a/0.85;
  vec3 shc=base*mix(uShade,vec3(0.60,0.36,0.52),uMood);
  float t=clamp((0.60-L)/0.30,0.0,1.0);
  vec2 q=R45*fc/5.5;float dd=length(fract(q)-0.5);float r=t*0.78;
  float m=(1.0-smoothstep(r-0.07,r+0.07,dd))*step(0.001,t);
  col=mix(base,shc,m);
  if(a>0.93)col=mix(col,vec3(1.0),0.92);
  col=mix(col,base,unlit);
  col*=mix(uGrade,vec3(1.0),unlit);
  col=mix(col,col*vec3(1.06,0.84,0.88)+vec3(0.05,0.0,0.03),uMood*0.5*(1.0-unlit));
  col=mix(col,fogC,smoothstep(uFogR.x,uFogR.y,z)*uFogR.z*(1.0-unlit));
 }
 float lf=1.0-smoothstep(60.0,400.0,zm)*0.6;
 col=mix(col,vec3(0.07,0.05,0.10),e*lf);
 if(uHurt>0.0){float vg=length((uv0-0.5)*vec2(1.25,1.0));float d2=length(fract(fc/7.0)-0.5);float r2=smoothstep(0.28,0.72,vg)*uHurt*0.95;
  col=mix(col,vec3(0.93,0.08,0.13),(1.0-smoothstep(r2-0.05,r2+0.05,d2))*step(0.01,r2));}
 float lum=dot(col,vec3(0.299,0.587,0.114));
 col=mix(col,vec3(lum)*vec3(1.0,0.98,0.94),uMono);
 col=mix(col,vec3(1.0-smoothstep(0.30,0.55,lum)),uInv);
 col=mix(col,vec3(1.0),uFlash);
 col*=0.975+0.025*hash(fc*0.7);
 oC=vec4(col,1.0);}`;
const FS_F=`#version 300 es
precision highp float;
in vec2 vUv;out vec4 oC;uniform sampler2D uT;uniform vec2 uPx,uVS;
void main(){vec2 U=vUv*uVS;vec3 lu=vec3(0.299,0.587,0.114);
vec3 nw=texture(uT,U+vec2(-1.,-1.)*uPx).rgb,ne=texture(uT,U+vec2(1.,-1.)*uPx).rgb,sw=texture(uT,U+vec2(-1.,1.)*uPx).rgb,se=texture(uT,U+vec2(1.,1.)*uPx).rgb,mm=texture(uT,U).rgb;
float lnw=dot(nw,lu),lne=dot(ne,lu),lsw=dot(sw,lu),lse=dot(se,lu),lm=dot(mm,lu);
float mn=min(lm,min(min(lnw,lne),min(lsw,lse))),mx=max(lm,max(max(lnw,lne),max(lsw,lse)));
vec2 dir=vec2(-((lnw+lne)-(lsw+lse)),((lnw+lsw)-(lne+lse)));
float rd=max((lnw+lne+lsw+lse)*0.03125,0.0078125);float rc=1.0/(min(abs(dir.x),abs(dir.y))+rd);
dir=clamp(dir*rc,vec2(-8.0),vec2(8.0))*uPx;
vec3 A=0.5*(texture(uT,U+dir*(1.0/3.0-0.5)).rgb+texture(uT,U+dir*(2.0/3.0-0.5)).rgb);
vec3 B=A*0.5+0.25*(texture(uT,U+dir*-0.5).rgb+texture(uT,U+dir*0.5).rgb);
float lb=dot(B,lu);oC=vec4((lb<mn||lb>mx)?A:B,1.0);}`;
const pG=mkProg(VS_G,FS_G,['uVP','uLVP','uSh','uLD','uCam','uV','uT','uHT','uBT','uBM']);
// textured models (kb_mat 10/11) sample uHT on texture unit 3 (units 0-2 are the shadow map / G-buffer). A 1x1 white stands in until a texture loads,
// so the sampler never shares a unit with the shadow sampler. setModelTex() swaps in the real one (js/hero.js).
gl.useProgram(pG.p);gl.uniform1i(pG.u.uHT,3);gl.uniform1i(pG.u.uBT,4);gl.uniform1i(pG.u.uBM,5);
let modelTex=gl.createTexture();gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,modelTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));gl.activeTexture(gl.TEXTURE0);
function setModelTex(img){const t=gl.createTexture();gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.activeTexture(gl.TEXTURE0);gl.deleteTexture(modelTex);modelTex=t}
// the final boss's colour (unit 4) and skin mask (unit 5): 1x1 white / black until js/boss5.js loads them
function texUnit(u,img,px){const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+u);gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
if(img){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR)}
else{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(px));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR)}
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.activeTexture(gl.TEXTURE0);return t}
const bossTexU=[texUnit(4,null,[255,255,255,255]),texUnit(5,null,[0,0,0,255])];
function setBossTex(i,img){gl.deleteTexture(bossTexU[i]);bossTexU[i]=texUnit(4+i,img)}
const pS=mkProg(VS_S,FS_S,['uLVP','uT']);
const pP=mkProg(VS_Q,FS_P,['uC','uN','uD','uPx','uTan','uFocus','uNear','uFar','uTime','uMood','uFlash','uInv','uMono','uHurt','uCR','uCU','uCF','uS0','uS1','uS2','uFogC','uGrade','uNight','uShade','uFogR','uVS']);
const pF=mkProg(VS_Q,FS_F,['uT','uPx','uVS']);
// ---- render targets ----
function mkTex(w,h,ifmt,fmt,type,filt){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,ifmt,w,h,0,fmt,type,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filt);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filt);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t}
const gCol=mkTex(W,H,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,gl.NEAREST),gNrm=mkTex(W,H,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,gl.NEAREST),gDep=mkTex(W,H,gl.DEPTH_COMPONENT24,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,gl.NEAREST);
const gFbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,gFbo);
gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,gCol,0);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT1,gl.TEXTURE_2D,gNrm,0);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,gDep,0);
gl.drawBuffers([gl.COLOR_ATTACHMENT0,gl.COLOR_ATTACHMENT1]);
const SHN=2048,shTex=mkTex(SHN,SHN,gl.DEPTH_COMPONENT24,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
const shFbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,shFbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shTex,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
const pTex=mkTex(W,H,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,gl.LINEAR);
const pFbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,pFbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,pTex,0);
gl.bindFramebuffer(gl.FRAMEBUFFER,null);
const quadVao=gl.createVertexArray();
// ---- meshes ----
function MB(){this.a=[]}
MB.prototype.tri=function(p0,p1,p2,n0,n1,n2){if(!n0){const ux=p1[0]-p0[0],uy=p1[1]-p0[1],uz=p1[2]-p0[2],vx=p2[0]-p0[0],vy=p2[1]-p0[1],vz=p2[2]-p0[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;n0=n1=n2=[nx/l,ny/l,nz/l]}
this.a.push(p0[0],p0[1],p0[2],n0[0],n0[1],n0[2],p1[0],p1[1],p1[2],n1[0],n1[1],n1[2],p2[0],p2[1],p2[2],n2[0],n2[1],n2[2])};
MB.prototype.quad=function(a,b,c,d,na,nb,nc,nd){this.tri(a,b,c,na,nb,nc);this.tri(a,c,d,na,nc,nd)};
const UP=[0,1,0],DN=[0,-1,0];
function mkBox(){const m=new MB();for(const n of[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const u=[n[2],n[0],n[1]],w=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]];const p=(a,b)=>[(n[0]+a*u[0]+b*w[0])*.5,(n[1]+a*u[1]+b*w[1])*.5,(n[2]+a*u[2]+b*w[2])*.5];m.quad(p(-1,-1),p(1,-1),p(1,1),p(-1,1),n,n,n,n)}return m}
function mkSph(R,S,rf){const m=new MB();const P=(i,j)=>{const t=i/R*PI,p=(j%S)/S*TAU;const n=[Math.sin(t)*Math.cos(p),Math.cos(t),Math.sin(t)*Math.sin(p)];const r=rf?rf(i,j%S):0.5;return{p:[n[0]*r,n[1]*r,n[2]*r],n}};
for(let i=0;i<R;i++)for(let j=0;j<S;j++){const a=P(i,j),b=P(i,j+1),c=P(i+1,j+1),d=P(i+1,j);if(rf){if(i>0)m.tri(a.p,b.p,c.p);if(i<R-1)m.tri(a.p,c.p,d.p)}else{if(i>0)m.tri(a.p,b.p,c.p,a.n,b.n,c.n);if(i<R-1)m.tri(a.p,c.p,d.p,a.n,c.n,d.n)}}return m}
function mkCyl(S){const m=new MB();for(let j=0;j<S;j++){const p0=j/S*TAU,p1=(j+1)/S*TAU,c0=Math.cos(p0),s0=Math.sin(p0),c1=Math.cos(p1),s1=Math.sin(p1),n0=[c0,0,s0],n1=[c1,0,s1];
m.quad([c0*.5,.5,s0*.5],[c1*.5,.5,s1*.5],[c1*.5,-.5,s1*.5],[c0*.5,-.5,s0*.5],n0,n1,n1,n0);m.tri([0,.5,0],[c1*.5,.5,s1*.5],[c0*.5,.5,s0*.5],UP,UP,UP);m.tri([0,-.5,0],[c0*.5,-.5,s0*.5],[c1*.5,-.5,s1*.5],DN,DN,DN)}return m}
function mkCone(S,flat,ph,rad){const m=new MB();const nn=p=>{const l=Math.hypot(1,rad);return[Math.cos(p)/l,rad/l,Math.sin(p)/l]};for(let j=0;j<S;j++){const p0=ph+j/S*TAU,p1=ph+(j+1)/S*TAU,a=[Math.cos(p0)*rad,-.5,Math.sin(p0)*rad],b=[Math.cos(p1)*rad,-.5,Math.sin(p1)*rad];
if(flat)m.tri([0,.5,0],b,a);else m.tri([0,.5,0],b,a,nn((p0+p1)/2),nn(p1),nn(p0));m.tri([0,-.5,0],a,b,DN,DN,DN)}return m}
function mkPrism(){const m=new MB(),A=[-.5,-.5,.5],B=[.5,-.5,.5],Cc=[0,.5,.5],A2=[-.5,-.5,-.5],B2=[.5,-.5,-.5],C2=[0,.5,-.5];m.tri(A,B,Cc);m.tri(B2,A2,C2);m.quad(B,B2,C2,Cc);m.quad(A2,A,Cc,C2);m.quad(A2,B2,B,A);return m}
function mkStar(n,ri,ro,jit,seed){const m=new MB(),r=mulberry(seed),pts=[],F=[0,0,1],K=[0,0,-1],O=[0,0,0];for(let k=0;k<n*2;k++){const a=k/(n*2)*TAU,rr=k%2?ri*(1-jit*.5*r()):ro*(1-jit*r());pts.push([Math.cos(a)*rr,Math.sin(a)*rr,0])}
for(let k=0;k<n*2;k++){const a=pts[k],b=pts[(k+1)%(n*2)];m.tri(O,a,b,F,F,F);m.tri(O,b,a,K,K,K)}return m}
function mkRing(S,ri){const m=new MB();for(let j=0;j<S;j++){const p0=j/S*TAU,p1=(j+1)/S*TAU,a=[Math.cos(p0)*.5,0,Math.sin(p0)*.5],b=[Math.cos(p1)*.5,0,Math.sin(p1)*.5],c=[Math.cos(p1)*ri,0,Math.sin(p1)*ri],d=[Math.cos(p0)*ri,0,Math.sin(p0)*ri];m.quad(a,d,c,b,UP,UP,UP,UP);m.quad(a,b,c,d,DN,DN,DN,DN)}return m}
function mkQuad(){const m=new MB(),F=[0,0,1],K=[0,0,-1],a=[-.5,-.5,0],b=[.5,-.5,0],c=[.5,.5,0],d=[-.5,.5,0];m.quad(a,b,c,d,F,F,F,F);m.quad(a,d,c,b,K,K,K,K);return m}
// ---- instanced batches ----
const FL=24,prims=[];
function addPrim(mb){const vbo=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mb.a),gl.STATIC_DRAW);const p={count:mb.a.length/6,b:[]};
for(let l=0;l<3;l++){const b={d:new Float32Array(64*FL),n:0,cap:64,buf:gl.createBuffer(),vao:gl.createVertexArray(),dirty:true};gl.bindVertexArray(b.vao);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);
gl.bindBuffer(gl.ARRAY_BUFFER,b.buf);for(let k=0;k<6;k++){gl.enableVertexAttribArray(2+k);gl.vertexAttribPointer(2+k,4,gl.FLOAT,false,96,k*16);gl.vertexAttribDivisor(2+k,1)}p.b.push(b)}
gl.bindVertexArray(null);prims.push(p);return prims.length-1}
// Indexed prim over caller-owned buffers (CPU-skinned models, js/hero.js): vbo = position+normal (stride 24, rewritten each frame),
// uvb = UV (location 8), idx = Uint16 indices. Several prims may share one vbo / uvb with different index lists.
function addIdxPrim(vbo,uvb,idx){const ib=gl.createBuffer(),p={count:idx.length,ib,b:[]};
for(let l=0;l<3;l++){const b={d:new Float32Array(4*FL),n:0,cap:4,buf:gl.createBuffer(),vao:gl.createVertexArray(),dirty:true};gl.bindVertexArray(b.vao);gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);
gl.bindBuffer(gl.ARRAY_BUFFER,uvb);gl.enableVertexAttribArray(8);gl.vertexAttribPointer(8,2,gl.FLOAT,false,8,0);
gl.bindBuffer(gl.ARRAY_BUFFER,b.buf);for(let k=0;k<6;k++){gl.enableVertexAttribArray(2+k);gl.vertexAttribPointer(2+k,4,gl.FLOAT,false,96,k*16);gl.vertexAttribDivisor(2+k,1)}
if(l===0){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,idx,gl.STATIC_DRAW)}else gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);p.b.push(b)}
gl.bindVertexArray(null);prims.push(p);return prims.length-1}
const BOX=addPrim(mkBox()),SPH=addPrim(mkSph(10,16)),CYL=addPrim(mkCyl(16)),CONE=addPrim(mkCone(16,false,0,0.5)),PYR=addPrim(mkCone(4,true,PI/4,0.7071)),PRISM=addPrim(mkPrism()),
STAR=addPrim(mkStar(10,0.24,0.5,0,1)),BURST=addPrim(mkStar(14,0.2,0.5,0.45,7)),RING=addPrim(mkRing(28,0.4)),QUAD=addPrim(mkQuad()),SPIKE=addPrim(mkSph(6,10,(i,j)=>(i===0||i===6)?0.5:((i+j)%2===0?0.5:0.27)));
const F_UNLIT=1,F_NOEDGE=2,F_NOCAST=4,F_SWAY=8,F_CLOTH=16,F_DRIFT=32,F_FLAME=64;
let curLayer=1,idS=0,idD=0,gTint=0,gId=0,gIce=0;// gIce: frozen enemies (weapons.js) are drawn icy pale blue
function nid(){return curLayer===0?(1+(idS=(idS+1)%110)):(112+(idD=(idD+1)%140))}
function emit(pi,c,mat,gloss,fl,rim){const b=prims[pi].b[curLayer];if(b.n>=b.cap){const nd=new Float32Array(b.cap*2*FL);nd.set(b.d);b.d=nd;b.cap*=2}
const d=b.d,o=b.n*FL;d.set(M,o);let r=c[0],g=c[1],bl=c[2];if(gTint>0){r+=(1-r)*gTint;g+=(1-g)*gTint;bl+=(1-bl)*gTint;if(gTint>0.5)fl|=1}if(gIce>0){r=r*0.4+0.55;g=g*0.4+0.8;bl=bl*0.3+0.7}
d[o+16]=r;d[o+17]=g;d[o+18]=bl;d[o+19]=mat;d[o+20]=gId||nid();d[o+21]=gloss;d[o+22]=fl;d[o+23]=rim;b.n++;b.dirty=true}
function put(pi,x,y,z,rx,ry,rz,sx,sy,sz,c,mat,gloss,fl,rim){mPush();mT(x,y,z);if(ry)mRY(ry);if(rx)mRX(rx);if(rz)mRZ(rz);mS(sx,sy,sz);emit(pi,c,mat||0,gloss||0,fl||0,rim||0);mPop()}
const box=(x,y,z,sx,sy,sz,c,mat,gloss,fl,rim)=>put(BOX,x,y,z,0,0,0,sx,sy,sz,c,mat,gloss,fl,rim);
const sph=(x,y,z,sx,sy,sz,c,mat,gloss,fl,rim)=>put(SPH,x,y,z,0,0,0,sx,sy,sz,c,mat,gloss,fl,rim);
const cyl=(x,y,z,sx,sy,sz,c,mat,gloss,fl,rim)=>put(CYL,x,y,z,0,0,0,sx,sy,sz,c,mat,gloss,fl,rim);
function flushLayer(l){for(const p of prims){const b=p.b[l];if(!b.n)continue;gl.bindVertexArray(b.vao);if(b.dirty){gl.bindBuffer(gl.ARRAY_BUFFER,b.buf);gl.bufferData(gl.ARRAY_BUFFER,b.d.subarray(0,b.n*FL),l===0?gl.STATIC_DRAW:gl.DYNAMIC_DRAW);b.dirty=false}if(p.ib)gl.drawElementsInstanced(gl.TRIANGLES,p.count,gl.UNSIGNED_SHORT,0,b.n);else gl.drawArraysInstanced(gl.TRIANGLES,0,p.count,b.n)}}
function beginDynamic(){for(const p of prims){p.b[1].n=0;p.b[2].n=0}idD=0;curLayer=1;mReset();gTint=0;gId=0;gIce=0}
// ---- camera ----
const cam={x:0,y:1.62,z:16,yaw:0,pitch:0,roll:0,fov:80*PI/180};
// the screen rectangle the 3D view is drawn into (the whole screen; the gacha highlight frame while it plays, see render3d)
const VPR_FULL={x:0,y:0,w:W,h:H};let vpR=VPR_FULL;
const VIEW=m4(),PROJ=m4(),VP=m4(),CAMW=m4(),LV=m4(),LP=m4(),LVP=m4();
const cR=[1,0,0],cU=[0,1,0],cF=[0,0,-1],NEAR=0.05,FAR=900;
function camUpdate(){const cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch),cy=Math.cos(cam.yaw),sy=Math.sin(cam.yaw),cr=Math.cos(cam.roll),sr=Math.sin(cam.roll);
const fx=-sy*cp,fy=sp,fz=-cy*cp,rx=cy,rz=-sy,ux=sy*sp,uy=cp,uz=cy*sp;
cR[0]=rx*cr+ux*sr;cR[1]=uy*sr;cR[2]=rz*cr+uz*sr;cU[0]=-rx*sr+ux*cr;cU[1]=uy*cr;cU[2]=-rz*sr+uz*cr;cF[0]=fx;cF[1]=fy;cF[2]=fz;
const ex=cam.x,ey=cam.y,ez=cam.z;
VIEW[0]=cR[0];VIEW[4]=cR[1];VIEW[8]=cR[2];VIEW[12]=-(cR[0]*ex+cR[1]*ey+cR[2]*ez);VIEW[1]=cU[0];VIEW[5]=cU[1];VIEW[9]=cU[2];VIEW[13]=-(cU[0]*ex+cU[1]*ey+cU[2]*ez);
VIEW[2]=-fx;VIEW[6]=-fy;VIEW[10]=-fz;VIEW[14]=fx*ex+fy*ey+fz*ez;VIEW[3]=VIEW[7]=VIEW[11]=0;VIEW[15]=1;
CAMW[0]=cR[0];CAMW[1]=cR[1];CAMW[2]=cR[2];CAMW[3]=0;CAMW[4]=cU[0];CAMW[5]=cU[1];CAMW[6]=cU[2];CAMW[7]=0;CAMW[8]=-fx;CAMW[9]=-fy;CAMW[10]=-fz;CAMW[11]=0;CAMW[12]=ex;CAMW[13]=ey;CAMW[14]=ez;CAMW[15]=1;
m4persp(PROJ,cam.fov,vpR.w/vpR.h,NEAR,FAR);m4mul(VP,PROJ,VIEW)}
function project(x,y,z){const cx=VP[0]*x+VP[4]*y+VP[8]*z+VP[12],cy=VP[1]*x+VP[5]*y+VP[9]*z+VP[13],cw=VP[3]*x+VP[7]*y+VP[11]*z+VP[15];if(cw<0.05)return null;return{x:vpR.x+(cx/cw*.5+.5)*vpR.w,y:vpR.y+(1-(cy/cw*.5+.5))*vpR.h,w:cw}}
function bill(pi,x,y,z,s,rot,c,fl){mPush();const cr=Math.cos(rot)*s,sr=Math.sin(rot)*s;M[0]=cR[0]*cr+cU[0]*sr;M[1]=cR[1]*cr+cU[1]*sr;M[2]=cR[2]*cr+cU[2]*sr;M[4]=-cR[0]*sr+cU[0]*cr;M[5]=-cR[1]*sr+cU[1]*cr;M[6]=-cR[2]*sr+cU[2]*cr;M[8]=-cF[0]*s;M[9]=-cF[1]*s;M[10]=-cF[2]*s;M[12]=x;M[13]=y;M[14]=z;emit(pi,c,0,0,fl,0);mPop()}
const LD=(()=>{const v=[0.52,0.76,0.40],l=Math.hypot(v[0],v[1],v[2]);return[v[0]/l,v[1]/l,v[2]/l]})();
m4look(LV,LD[0]*90,LD[1]*90,LD[2]*90-2,0,0,-2,0,1,0);m4ortho(LP,-44,44,-44,44,10,175);m4mul(LVP,LP,LV);
// per-stage sun direction (STG[n].sun); the shadow camera follows it
const LD0=LD.slice();
function setSun(v){v=v||LD0;const l=Math.hypot(v[0],v[1],v[2]);for(let i=0;i<3;i++)LD[i]=v[i]/l;m4look(LV,LD[0]*90,LD[1]*90,LD[2]*90-2,0,0,-2,0,1,0);m4mul(LVP,LP,LV)}
