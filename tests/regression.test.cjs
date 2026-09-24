const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('engine catalog renames and groups every engine exactly once', () => {
  const context = vm.createContext({});
  vm.runInContext(`${read('js/engines.js')}\n${read('js/catalog.js')}`, context);
  const catalog = vm.runInContext('ENGINE_CATALOG.map(([group, entries]) => [group, entries])', context);
  const normalized = JSON.parse(JSON.stringify(catalog));
  const groups = normalized.map(([group]) => group);
  const entries = normalized.flatMap(([, engines]) => engines);

  assert.deepEqual(groups, [
    'Color & Composition', 'Tiles & Textiles', 'Cells & Mosaics',
    'Nature & Terrain', 'Radial & Loop Forms', 'Flow & Particles',
    'Waves & Optical', 'Space & Architecture', 'Texture & Fractals',
  ]);
  assert.equal(entries.length, 49);
  assert.equal(new Set(entries.map(([id]) => id)).size, 49);
  assert.deepEqual(entries.slice(0, 5), [
    ['gradients', 'Gradients'], ['colorBands', 'Stripe Collage'],
    ['blocks', 'Block Composition'], ['mondrian', 'Mondriaan Grid'],
    ['bauhaus', 'Bauhaus Shapes'],
  ]);
  assert.deepEqual(entries.slice(-5), [
    ['symmPixelArt', 'Pixel Tapestry'], ['halftone', 'Halftone'],
    ['webglFractal', 'Julia Fractal'], ['clifford', 'Strange Attractor'],
    ['glitch', 'Glitch'],
  ]);
});

function loadCore(gl) {
  const context = vm.createContext({
    document: { getElementById: () => ({ getContext: () => ({}) }) },
    window: { _glCanvas: { getContext: () => gl } },
  });
  vm.runInContext(read('js/core.js'), context);
  return context;
}

test('palette hue wraps in both directions', () => {
  const core = loadCore();
  assert.equal(core.hslToHex(-20, 100, 50), '#ff0055');
  assert.equal(core.hslToHex(-20, 100, 50), core.hslToHex(340, 100, 50));
  assert.equal(core.hslToHex(700, 100, 50), core.hslToHex(340, 100, 50));
});

test('seeded drawing sequence remains repeatable', () => {
  const core = loadCore();
  core.resetRandom(1337);
  const first = Array.from({ length: 100 }, () => core.random());
  core.resetRandom(1337);
  assert.deepEqual(Array.from({ length: 100 }, () => core.random()), first);
  assert.ok(first.every(value => value >= 0 && value < 1));
});

test('render requests coalesce and recover after a drawing failure', () => {
  const callbacks = [];
  let attempts = 0;
  const source = read('js/studio.js');
  const context = vm.createContext({
    requestAnimationFrame: callback => callbacks.push(callback),
    render: () => { if (++attempts === 1) throw new Error('drawing failed'); },
  });
  vm.runInContext(source.slice(source.indexOf('let renderPending'), source.indexOf('function render()')), context);
  context.scheduleRender();
  context.scheduleRender();
  assert.equal(callbacks.length, 1);
  assert.throws(callbacks.shift(), /drawing failed/);
  context.scheduleRender();
  assert.equal(callbacks.length, 1);
  callbacks.shift()();
  assert.equal(attempts, 2);
});

for (const failure of [null, 'compile', 'link', 'draw']) {
  test(`WebGL resources are released after ${failure || 'successful rendering'}`, () => {
    const created = { shaders: [], programs: [], buffers: [] };
    const deleted = { shaders: [], programs: [], buffers: [] };
    const api = {
      createShader: () => { const resource = {}; created.shaders.push(resource); return resource; },
      createProgram: () => { const resource = {}; created.programs.push(resource); return resource; },
      createBuffer: () => { const resource = {}; created.buffers.push(resource); return resource; },
      deleteShader: resource => deleted.shaders.push(resource),
      deleteProgram: resource => deleted.programs.push(resource),
      deleteBuffer: resource => deleted.buffers.push(resource),
      getShaderParameter: () => failure !== 'compile',
      getProgramParameter: () => failure !== 'link',
      getShaderInfoLog: () => 'compile error',
      getProgramInfoLog: () => 'link error',
    };
    const gl = new Proxy(api, { get: (target, key) => target[key] ?? (() => {}) });
    const core = loadCore(gl);
    const draw = () => core.runShader({ drawImage: () => {
      if (failure === 'draw') throw new Error('draw error');
    } }, 32, 32, 'shader source', { scalar: 1, vector: [1, 2] });
    if (failure) assert.throws(draw);
    else draw();
    assert.deepEqual(deleted, created);
  });
}
