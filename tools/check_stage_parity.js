// Checks that assets/stage_shrine.glb (via js/glb.js) reproduces the code-built shrine (buildStage1Code) exactly:
// same instances (transform, colour, pattern/gloss/flags/rim), same geometry (positions, normals, winding) and colliders.
// Usage: node tools/check_stage_parity.js        (exit code 1 on mismatch)
// Only meaningful while the Blender stage is meant to match the code version; once the stage is edited in Blender, expect diffs.
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const stub = new Proxy(function () {}, { get: (t, k) => (k === 'getShaderParameter' || k === 'getProgramParameter') ? () => true : () => ({}) });
const gl = new Proxy({}, { get: (t, k) => typeof k === 'string' && /^[A-Z_0-9]+$/.test(k) ? 1 : stub[k] || (() => ({})) });
const el = { getContext: t => t === 'webgl2' ? gl : {}, style: {} };
const ctx = vm.createContext({ document: { getElementById: () => el }, addEventListener() {}, innerWidth: 1280, innerHeight: 720, console, TextDecoder, URLSearchParams,
  location: { search: '' }, fetch: () => new Promise(() => {}) });
for (const f of ['core', 'gfx', 'glb', 'stage']) vm.runInContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
const buf = fs.readFileSync(path.join(root, 'assets/stage_shrine.glb'));
ctx.GLB = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
const r = vm.runInContext(`(() => {
  const geo = {}; const add0 = addPrim; addPrim = mb => { const i = add0(mb); geo[i] = mb.a; return i };
  for (const [i, mb] of [[BOX, mkBox()], [SPH, mkSph(10, 16)], [CYL, mkCyl(16)], [CONE, mkCone(16, false, 0, 0.5)], [PYR, mkCone(4, true, PI / 4, 0.7071)], [PRISM, mkPrism()]]) geo[i] = mb.a;
  const rec = []; emit = (pi, c, mat, gloss, fl, rim) => rec.push({ pi, m: Array.from(M), c: Array.from(c), mat: mat || 0, gloss: gloss || 0, fl: fl || 0, rim: rim || 0 });
  const run = f => { colC.length = 0; colB.length = 0; curLayer = 0; mReset(); f(); return { inst: rec.splice(0), colC: colC.splice(0), colB: colB.splice(0) } };
  const A = run(buildStage1Code); SHRINE = glbStage(GLB); const B = run(buildStage1);
  // geometry: every triangle of the code prim must have a triangle in the GLB prim with the same vertices, normals and winding
  const geoErr = (x, y) => { const a = geo[x], b = geo[y]; if (a.length !== b.length) return { pos: Infinity, nrm: Infinity, wind: Infinity };
    const tri = (q, k) => [0, 1, 2].map(j => q.slice(k + j * 6, k + j * 6 + 6)); let pos = 0, nrm = 0, wind = 0;
    const cross = t => { const u = [0, 1, 2].map(c => t[1][c] - t[0][c]), v = [0, 1, 2].map(c => t[2][c] - t[0][c]); return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]] };
    for (let k = 0; k < a.length; k += 18) { const ta = tri(a, k); let best = null, bd = Infinity;
      for (let q = 0; q < b.length; q += 18) { const tb = tri(b, q); let d = 0; for (const va of ta) { let m = Infinity; for (const vb of tb) m = Math.min(m, Math.hypot(va[0] - vb[0], va[1] - vb[1], va[2] - vb[2])); d = Math.max(d, m) } if (d < bd) { bd = d; best = tb } }
      pos = Math.max(pos, bd); for (const va of ta) { const vb = best.reduce((p, v) => Math.hypot(va[0] - v[0], va[1] - v[1], va[2] - v[2]) < Math.hypot(va[0] - p[0], va[1] - p[1], va[2] - p[2]) ? v : p); nrm = Math.max(nrm, Math.hypot(va[3] - vb[3], va[4] - vb[4], va[5] - vb[5])) }
      const ca = cross(ta), cb = cross(best); if (ca[0] * cb[0] + ca[1] * cb[1] + ca[2] * cb[2] < 0) wind++ }
    return { pos, nrm, wind } };
  const used = new Set(), pairs = {}; let unmatched = 0, maxM = 0, maxC = 0, attr = 0;
  for (const b of B.inst) { let bi = -1, bd = Infinity; A.inst.forEach((a, i) => { if (used.has(i)) return; let d = 0; for (let j = 0; j < 16; j++) d = Math.max(d, Math.abs(a.m[j] - b.m[j])); if (d < bd) { bd = d; bi = i } });
    if (bd > 1e-3) { unmatched++; continue } used.add(bi); const a = A.inst[bi]; maxM = Math.max(maxM, bd); pairs[a.pi + '>' + b.pi] = [a.pi, b.pi];
    for (let i = 0; i < 3; i++) maxC = Math.max(maxC, Math.abs(a.c[i] - b.c[i]));
    if (a.mat !== b.mat || a.fl !== b.fl || Math.abs(a.gloss - b.gloss) > 1e-6 || Math.abs(a.rim - b.rim) > 1e-6) attr++ }
  const g = Object.values(pairs).map(([x, y]) => geoErr(x, y)), mx = k => Math.max(0, ...g.map(e => e[k]));
  const norm = o => JSON.stringify(o.map(x => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, +v.toFixed(3)]))).map(JSON.stringify).sort());
  return { instances: [A.inst.length, B.inst.length], unmatched, maxMatrixErr: maxM, maxColorErr: maxC, attrMismatch: attr,
    geoPairs: g.length, maxPosErr: mx('pos'), maxNormalErr: mx('nrm'), flippedTris: g.reduce((s, e) => s + e.wind, 0),
    colliders: norm(A.colC) === norm(B.colC) && norm(A.colB) === norm(B.colB), draws: SHRINE.draws } })()`, ctx);
console.log(r);
const ok = r.instances[0] === r.instances[1] && !r.unmatched && r.maxMatrixErr < 1e-4 && r.maxColorErr < 1e-5 && !r.attrMismatch && r.maxPosErr < 1e-4 && r.maxNormalErr < 1e-3 && !r.flippedTris && r.colliders;
console.log(ok ? 'PARITY OK' : 'PARITY MISMATCH'); process.exit(ok ? 0 : 1);
