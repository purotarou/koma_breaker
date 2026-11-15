// Runs the code-built stage generator (buildStage1Code / buildStage2Code) with a stub GL and dumps its static instances,
// unit-primitive geometry and colliders as JSON (input for tools/blender_build_stage.py).
// Usage: node tools/dump_stage.js <1|2> out.json
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..'), stage = +process.argv[2], out = process.argv[3];
if (!(stage === 1 || stage === 2) || !out) { console.error('usage: node tools/dump_stage.js <1|2> out.json'); process.exit(2) }
const fnStub = new Proxy(function () {}, { get: (t, k) => (k === 'getShaderParameter' || k === 'getProgramParameter') ? () => true : () => ({}) });
const gl = new Proxy({}, { get: (t, k) => typeof k === 'string' && /^[A-Z_0-9]+$/.test(k) ? 1 : fnStub[k] || (() => ({})) });
const el = { getContext: t => t === 'webgl2' ? gl : {}, style: {} };
const ctx = vm.createContext({ document: { getElementById: () => el }, addEventListener() {}, innerWidth: 1280, innerHeight: 720, console,
  location: { search: '' }, URLSearchParams, TextDecoder, fetch: () => new Promise(() => {}) });
const read = f => fs.readFileSync(path.join(root, 'js', f), 'utf8');
for (const f of ['core.js', 'gfx.js', 'glb.js']) vm.runInContext(read(f), ctx, { filename: f });
vm.runInContext(`var GRP='misc';function G(n){GRP=n}`, ctx);
// Insert G('<group>') markers so every instance is labelled with the prop it belongs to (becomes a Blender collection).
const tag = (src, marks) => { for (const [k, v] of marks) { if (!src.includes(k)) throw new Error('marker not found: ' + k); src = src.replace(k, `G('${v}');` + (k.startsWith('//') ? '' : k)) } return src };
let src = read('stage.js'), fn;
if (stage === 1) {
  src = tag(src, [['// south gate', 'gate'], ['// hall behind gate', 'hall'], ['// sacred tree', 'sacred_tree'], ['// chozuya', 'chozuya'], ['// sake barrels', 'sake_barrels'],
    ['// forest', 'forest'], ['// hills / mountains / clouds', 'background'], ['box(0,-0.62,0,1700', 'ground'], ['wall(-23,-27,23,-27)', 'walls'], ['torii(-17);', 'torii'],
    ['toro(-7.5,-9)', 'lanterns'], ['fox(-6.6', 'fox'], ['leafy(-18.5,-22', 'sakura'], ['[C.flag1,C.flag2,C.flag3,C.flag1]', 'nobori']]);
  fn = 'buildStage1Code';
} else {
  // players.js can't run standalone; take only the extra colours and the stage-2 generator from it.
  const p = read('players.js'), c0 = p.indexOf('Object.assign(C,{'), f0 = p.indexOf('function buildStage2Code(');
  let body = p.slice(f0, p.indexOf('\n// ---- players ----', f0));
  body = tag(body, [['box(0,-0.62,0,1700', 'ground'], ['wall(-23,-27,23,-27)', 'walls'], ['for(const[x,z]of[[-24,-28]', 'towers'], ['for(const s of[-1,1]){box(s*4.6', 'gates'],
    ['fire(-7.5,-9);', 'braziers'], ['cannon(-15,-6,0.5);', 'cannons'], ['for(const[bx,by]of[[-1.3', 'straw_bales'], ['leafy(-18.5,-22', 'pines'], ['[C.flag3,C.flag2,C.flag1,C.flag3]', 'nobori'],
    ['for(let i=0;i<56;', 'forest'], ['for(let i=0;i<44;', 'town'], ['box(72,6,-125', 'castle'], ['put(SPH,-70,200', 'background']]);
  src += '\n' + p.slice(c0, p.indexOf(';', c0) + 1) + '\n' + body;
  fn = 'buildStage2Code';
}
vm.runInContext(src, ctx, { filename: 'stage' + stage });
const res = vm.runInContext(`(()=>{
const names={};for(const k of['BOX','SPH','CYL','CONE','PYR','PRISM','STAR','BURST','RING','QUAD','SPIKE'])names[eval(k)]=k;
const inst=[];emit=function(pi,c,mat,gloss,fl,rim){inst.push({p:names[pi],g:GRP,m:Array.from(M),c:[c[0],c[1],c[2]],mat:mat||0,gloss:gloss||0,fl:fl||0,rim:rim||0})};
colC.length=0;colB.length=0;curLayer=0;mReset();${fn}();
const geo={},mk={BOX:mkBox(),SPH:mkSph(10,16),CYL:mkCyl(16),CONE:mkCone(16,false,0,0.5),PYR:mkCone(4,true,PI/4,0.7071),PRISM:mkPrism()};
for(const k of new Set(inst.map(i=>i.p)))geo[k]=mk[k].a;
return {cnames:Object.entries(C),inst,geo,colC:colC.map(o=>({...o})),colB:colB.map(o=>({...o}))}})()`, ctx);
fs.writeFileSync(out, JSON.stringify(res));
const cnt = {}; for (const i of res.inst) cnt[i.g] = (cnt[i.g] || 0) + 1;
console.log('instances', res.inst.length, 'groups', cnt, 'prims', Object.keys(res.geo), 'uniqueMats', new Set(res.inst.map(i => JSON.stringify([i.c, i.mat, i.gloss, i.fl, i.rim]))).size, 'colC', res.colC.length, 'colB', res.colB.length);
