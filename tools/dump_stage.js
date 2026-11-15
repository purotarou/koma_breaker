// Runs core.js + gfx.js + stage.js with a stub GL and dumps buildStage1Code()'s static instances (input for tools/blender_build_shrine.py).
// Usage: node tools/dump_stage.js . out.json
const fs=require('fs'),vm=require('vm');
const root=process.argv[2],out=process.argv[3];
const fnStub=new Proxy(function(){},{get:(t,k)=>k==='getShaderParameter'||k==='getProgramParameter'?()=>true:(()=>({})),apply:()=>({})});
const gl=new Proxy({},{get:(t,k)=>typeof k==='string'&&/^[A-Z_0-9]+$/.test(k)?1:fnStub[k]||(()=>({}))});
const el={getContext:(t)=>t==='webgl2'?gl:{},style:{}};
const ctx=vm.createContext({document:{getElementById:()=>el},addEventListener(){},innerWidth:1280,innerHeight:720,console,Math,Float32Array,Array,Object,JSON});
for(const f of['core','gfx'])vm.runInContext(fs.readFileSync(root+'/js/'+f+'.js','utf8'),ctx,{filename:f});
let st=fs.readFileSync(root+'/js/stage.js','utf8');
const tags={'// south gate':'gate','// hall behind gate':'hall','// sacred tree':'sacred_tree','// chozuya':'chozuya','// sake barrels':'sake_barrels','// forest':'forest','// hills / mountains / clouds':'background'};
for(const[k,v]of Object.entries(tags))st=st.replace(k,`G('${v}');`);
st=st.replace("box(0,-0.62,0,1700",`G('ground');box(0,-0.62,0,1700`).replace("wall(-23,-27,23,-27)",`G('walls');wall(-23,-27,23,-27)`).replace("torii(-17);",`G('torii');torii(-17);G('lanterns');`)
 .replace("fox(-6.6",`G('fox');fox(-6.6`).replace("leafy(-18.5,-22",`G('sakura');leafy(-18.5,-22`).replace("[C.flag1,C.flag2,C.flag3,C.flag1]",`G('nobori');[C.flag1,C.flag2,C.flag3,C.flag1]`);
vm.runInContext(`var GRP='misc';function G(n){GRP=n}`,ctx);
vm.runInContext(st,ctx,{filename:'stage'});
const res=vm.runInContext(`(()=>{
const names={};for(const k of['BOX','SPH','CYL','CONE','PYR','PRISM','STAR','BURST','RING','QUAD','SPIKE'])names[eval(k)]=k;
// tag each emit with current group
const inst=[];const _emit=emit;emit=function(pi,c,mat,gloss,fl,rim){inst.push({p:names[pi],g:GRP,m:Array.from(M),c:[c[0],c[1],c[2]],mat:mat||0,gloss:gloss||0,fl:fl||0,rim:rim||0});};
curLayer=0;mReset();buildStage1Code();
const geo={};for(const k of['BOX','SPH','CYL','CONE','PYR','PRISM']){const mb={BOX:mkBox(),SPH:mkSph(10,16),CYL:mkCyl(16),CONE:mkCone(16,false,0,0.5),PYR:mkCone(4,true,PI/4,0.7071),PRISM:mkPrism()}[k];geo[k]=mb.a}
return {cnames:Object.entries(C).map(([k,v])=>[k,v]),inst,geo,colC:colC.map(o=>({...o})),colB:colB.map(o=>({...o}))}})()`,ctx);
fs.writeFileSync(out,JSON.stringify(res));
const cnt={};for(const i of res.inst){cnt[i.g]=(cnt[i.g]||0)+1}
const mats=new Set(res.inst.map(i=>JSON.stringify([i.c,i.mat,i.gloss,i.fl,i.rim])));
console.log('instances',res.inst.length,'groups',cnt,'prims',[...new Set(res.inst.map(i=>i.p))],'uniqueMats',mats.size,'colC',res.colC.length,'colB',res.colB.length);
