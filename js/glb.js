'use strict';
// ================= GLB STAGE LOADER =================
// Loads a stage authored in Blender (blender/*.blend -> tools/blender_export_stage.py -> assets/*.glb)
// and feeds it into the existing instanced G-buffer renderer, so outlines (ID + normal edges),
// screen tones and the procedural patterns behave exactly like the code-built primitives.
//  * Each glTF mesh primitive (deduplicated by its POSITION/NORMAL/indices accessors) becomes one addPrim() batch;
//    every node using it is one instance (node world matrix), so draw calls stay ~one per unique geometry.
//  * Colour = material baseColorFactor (raw game value). Material extras: kb_mat (pattern 0-9), kb_gloss, kb_flags (incl. animation bits 8/16/32/64, see ANIM in gfx.js), kb_rim.
//  * Each instance gets its own outline ID (nid()), like each box()/put() call did.
//  * Nodes with extras.kb_col: 'cyl' -> colC {x,z,r=scale.x,h=scale.y}; 'box' -> colB from translation +- scale (h = top).
const GLB_CT={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
const GLB_NC={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
function glbParse(buf){const dv=new DataView(buf);if(dv.getUint32(0,true)!==0x46546C67)throw new Error('not a GLB');
let o=12,json=null,bin=null;while(o<buf.byteLength){const len=dv.getUint32(o,true),type=dv.getUint32(o+4,true);
if(type===0x4E4F534A)json=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,o+8,len)));else if(type===0x004E4942)bin=new Uint8Array(buf,o+8,len);o+=8+len}
if(!json)throw new Error('GLB has no JSON chunk');return{j:json,bin}}
function glbAcc(g,i){const a=g.j.accessors[i],bv=g.j.bufferViews[a.bufferView],T=GLB_CT[a.componentType],nc=GLB_NC[a.type];
const off=g.bin.byteOffset+(bv.byteOffset||0)+(a.byteOffset||0),stride=bv.byteStride||0,es=T.BYTES_PER_ELEMENT*nc;
if(!stride||stride===es)return{v:new T(g.bin.buffer.slice(off,off+a.count*es)),nc};
const out=new T(a.count*nc),dv=new DataView(g.bin.buffer);const rd={5126:'getFloat32',5125:'getUint32',5123:'getUint16',5121:'getUint8',5122:'getInt16',5120:'getInt8'}[a.componentType];
for(let k=0;k<a.count;k++)for(let c=0;c<nc;c++)out[k*nc+c]=dv[rd](off+k*stride+c*T.BYTES_PER_ELEMENT,true);return{v:out,nc}}
function glbNodeMat(n){const m=m4();if(n.matrix){m.set(n.matrix);return m}
const t=n.translation||[0,0,0],q=n.rotation||[0,0,0,1],s=n.scale||[1,1,1],[x,y,z,w]=q;
const xx=x*x,yy=y*y,zz=z*z,xy=x*y,xz=x*z,yz=y*z,wx=w*x,wy=w*y,wz=w*z;
m[0]=(1-2*(yy+zz))*s[0];m[1]=2*(xy+wz)*s[0];m[2]=2*(xz-wy)*s[0];m[3]=0;
m[4]=2*(xy-wz)*s[1];m[5]=(1-2*(xx+zz))*s[1];m[6]=2*(yz+wx)*s[1];m[7]=0;
m[8]=2*(xz+wy)*s[2];m[9]=2*(yz-wx)*s[2];m[10]=(1-2*(xx+yy))*s[2];m[11]=0;m[12]=t[0];m[13]=t[1];m[14]=t[2];m[15]=1;return m}
// Build {items:[{pi,m,c,mat,gloss,fl,rim}], colC:[], colB:[]} from a GLB ArrayBuffer. Creates prims (GPU buffers) once.
function glbStage(buf){const g=glbParse(buf),J=g.j,geo=new Map(),bnd={},items=[],cc=[],cb=[];
const primOf=p=>{const key=p.attributes.POSITION+'/'+p.attributes.NORMAL+'/'+p.indices;if(geo.has(key))return geo.get(key);
 if(p.mode!==undefined&&p.mode!==4)throw new Error('GLB: only triangle lists are supported');
 const P=glbAcc(g,p.attributes.POSITION).v,N=p.attributes.NORMAL!==undefined?glbAcc(g,p.attributes.NORMAL).v:null,I=p.indices!==undefined?glbAcc(g,p.indices).v:null;
 const mb=new MB(),cnt=I?I.length:P.length/3,v=k=>[P[k*3],P[k*3+1],P[k*3+2]],nv=k=>N?[N[k*3],N[k*3+1],N[k*3+2]]:undefined;
 for(let t=0;t<cnt;t+=3){const a=I?I[t]:t,b=I?I[t+1]:t+1,c=I?I[t+2]:t+2;mb.tri(v(a),v(b),v(c),nv(a),nv(b),nv(c))}
 const pi=addPrim(mb),mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(let k=0;k<P.length;k++){const c=k%3;if(P[k]<mn[c])mn[c]=P[k];if(P[k]>mx[c])mx[c]=P[k]}
 bnd[pi]=[mn,mx];geo.set(key,pi);return pi};
const matOf=i=>{const m=i===undefined?{}:J.materials[i],x=m.extras||{},bc=(m.pbrMetallicRoughness||{}).baseColorFactor||[1,1,1,1];
 return{c:[bc[0],bc[1],bc[2]],mat:x.kb_mat|0,gloss:+x.kb_gloss||0,fl:x.kb_flags|0,rim:+x.kb_rim||0}};
const mats=(J.materials||[]).map((_,i)=>matOf(i)),defMat=matOf(undefined);
const walk=(ni,parent)=>{const n=J.nodes[ni],w=m4mul(m4(),parent,glbNodeMat(n)),x=n.extras||{};
 if(x.kb_col){const sx=Math.hypot(w[0],w[1],w[2]),sy=Math.hypot(w[4],w[5],w[6]),sz=Math.hypot(w[8],w[9],w[10]);
  if(x.kb_col==='cyl')cc.push({x:w[12],z:w[14],r:sx,h:sy});else if(x.kb_col==='box')cb.push({x0:w[12]-sx,x1:w[12]+sx,z0:w[14]-sz,z1:w[14]+sz,h:w[13]+sy})}
 else if(n.mesh!==undefined)for(const p of J.meshes[n.mesh].primitives){const mt=p.material!==undefined?mats[p.material]:defMat;items.push({pi:primOf(p),m:w,...mt})}
 for(const c of n.children||[])walk(c,w)};
const I4=m4();I4[0]=I4[5]=I4[10]=I4[15]=1;for(const ni of J.scenes[J.scene||0].nodes)walk(ni,I4);
glbAssignIds(items,bnd);
return{items,colC:cc,colB:cb,draws:geo.size}}
// Outline IDs: the static layer only has 110 IDs (1..110, 8-bit G-buffer channel) and an outline is drawn only where
// neighbouring pixels have different IDs, so two parts sharing an ID lose the line where they overlap on screen.
// Code-built stages get sequential nid() (parts of one prop are emitted back to back); GLB node order is arbitrary,
// so instead each part takes the ID whose nearest existing user is farthest away (bounding-box gap distance).
// Touching parts therefore never share an ID, and any reuse happens between parts as far apart as possible.
function glbAssignIds(items,lb){
const bb=items.map(it=>{const[mn,mx]=lb[it.pi],m=it.m,o=[1e9,1e9,1e9,-1e9,-1e9,-1e9];
 for(let k=0;k<8;k++){const p=[k&1?mx[0]:mn[0],k&2?mx[1]:mn[1],k&4?mx[2]:mn[2]];for(let c=0;c<3;c++){const v=m[c]*p[0]+m[4+c]*p[1]+m[8+c]*p[2]+m[12+c];if(v<o[c])o[c]=v;if(v>o[3+c])o[3+c]=v}}
 return o});
const near=new Float64Array(111);let next=0;
for(let i=0;i<items.length;i++){const a=bb[i];near.fill(Infinity);
 for(let j=0;j<i;j++){const b=bb[j];let g=0;for(let c=0;c<3;c++){const d=Math.max(0,b[c]-a[3+c],a[c]-b[3+c]);g+=d*d}const id=items[j].id;if(g<near[id])near[id]=g}
 let id=1,bd=-1;for(let t=0;t<110;t++){const c=1+(next+t)%110;if(near[c]>bd){bd=near[c];id=c;if(bd===Infinity)break}}
 items[i].id=id;next=id%110}}
// Emit a loaded stage into the current (static) layer.
function emitGlbStage(st){for(const it of st.items){mPush();M.set(it.m);gId=it.id;emit(it.pi,it.c,it.mat,it.gloss,it.fl,it.rim);gId=0;mPop()}
for(const c of st.colC)colC.push({...c});for(const b of st.colB)colB.push({...b})}
// Load a GLB as an ArrayBuffer. fetch() is refused when index.html is opened straight from disk (file://), so then fall back
// to <script src="<path>.js">, which sets KB_GLB[path] to the same file as base64 (written next to each .glb by the export tool).
const KB_GLB={};
function loadGlbBuf(path){return fetch(path,{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.arrayBuffer()})
 .catch(e=>new Promise((res,rej)=>{const s=document.createElement('script');s.src=path+'.js';s.onerror=()=>rej(e);
  s.onload=()=>{const b=KB_GLB[path];if(!b)return rej(e);delete KB_GLB[path];const bin=atob(b),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);res(u.buffer)};
  document.head.appendChild(s)}))}
// ---- stages authored in Blender. ?stage1=code ... ?stage5=code force the code-built version (comparison / fallback). ----
const STAGE_FILES=['assets/stage_shrine.glb','assets/stage_castle.glb','assets/stage_town.glb','assets/stage_temple.glb','assets/stage_inkpond.glb'],STAGE_GLB=STAGE_FILES.map(()=>null);
const stageReady=Promise.all(STAGE_FILES.map((f,i)=>new URLSearchParams(location.search).get('stage'+(i+1))==='code'?null:
 loadGlbBuf(f).then(b=>{STAGE_GLB[i]=glbStage(b)})
 .catch(e=>console.warn('[stage] '+f+' failed to load, using the code-built stage:',e))));
