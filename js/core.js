const canvas = document.getElementById("artCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true, colorSpace: "srgb" });

const PALETTES = {
  fractalBlue: ['#0a1424', '#1d4576', '#2b6fb0', '#d88737', '#e8ab56', '#5d92b8', '#865529'],
  autumn: ['#171413', '#d97d27', '#e8ad4a', '#844d28', '#4b6973', '#9f9479', '#cf5423'],
  sloterdijk: ['#d7e8f5', '#0863c5', '#1387e6', '#c9332b', '#ffffff', '#22252a', '#788796'],
  centraal: ['#172c44', '#b3422a', '#4389d0', '#e4af4c', '#606e7b', '#dcd8cb', '#7b291a'],
  amsterdam: ['#1e293b', '#dc2626', '#f87171', '#fef08a', '#e2e8f0', '#3b82f6', '#10b981'],
  pastel: ['#dce4eb', '#e6a49c', '#8ab89f', '#f2d174', '#798bca', '#c98165', '#a3c1ad'],
  cyber: ['#0d0221', '#ff0055', '#00f0ff', '#2d006b', '#fffa65', '#7928ca', '#00ffcc'],
  acid: ['#0d0c1d', '#b4f000', '#5e17eb', '#e0e2db', '#9b5de5', '#f15bb5', '#fee440'],
  ultramarine: ['#f5f5f5', '#0011ff', '#000000', '#264bff', '#8ca1ff', '#1e1b4b', '#38bdf8'],
  monochrome: ['#121212', '#f4f1ea', '#888888', '#2b2b2b', '#d3cfc7', '#525252', '#a3a3a3'],
  sunset: ['#2b1055', '#751a3d', '#b44346', '#d88653', '#f0ca68', '#ff758c', '#ff7eb3'],
  neon: ['#050505', '#ff007f', '#00f9ff', '#7000ff', '#ffea00', '#39ff14', '#ff3131'],
  bauhaus: ['#f4f1ea', '#d93829', '#2a5b84', '#e8a933', '#1a1a1a', '#5c768d', '#b22222'],
  vintage: ['#e8dcc4', '#8b4b45', '#496055', '#d19c4c', '#333230', '#6b4226', '#556b2f']
};

let bgColor = PALETTES.fractalBlue[0];
let currentColors = PALETTES.fractalBlue.slice(1);

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateRandomPalette(count = 6) {
  const colorCount = Math.max(1, Math.min(20, Math.round(count)));
  const baseHue = Math.random() * 360;
  const schemes = [
    i => baseHue + i * (360 / colorCount),
    i => baseHue + (i % 3) * 120 + Math.floor(i / 3) * 18,
    i => baseHue + (i % 2) * 180 + Math.floor(i / 2) * 24,
    i => baseHue + i * 137.508,
  ];
  const hueFor = schemes[Math.floor(Math.random() * schemes.length)];
  return Array.from({ length: colorCount }, (_, index) => {
    const hue = hueFor(index) + (Math.random() * 18 - 9);
    const saturation = 48 + Math.random() * 44;
    const lightness = 30 + Math.random() * 45;
    return hslToHex(hue, saturation, lightness);
  });
}

function generateRandomBackground() {
  const hue = Math.random() * 360;
  const saturation = 8 + Math.random() * 35;
  const lightness = Math.random() < 0.5 ? 7 + Math.random() * 13 : 84 + Math.random() * 12;
  return hslToHex(hue, saturation, lightness);
}

let globalSeed = 1337;
let seedState = 1337;
function resetRandom(seedVal) {
  seedState = (seedVal !== undefined ? seedVal : globalSeed) >>> 0;
}
function random() {
  let t = seedState += 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
function randomRange(min, max) { return min + random() * (max - min); }
function pick(arr) { return arr[Math.floor(random() * arr.length)]; }
function hash(x, y) {
  let h = globalSeed + (x | 0) * 374761393 + (y | 0) * 668265263;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) / 4294967296;
}
function lerp(a, b, t) { return a + t * (b - a); }
function smoothstep(t) { return t * t * (3 - 2 * t); }
function noise2D(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = smoothstep(fx), uy = smoothstep(fy);
  return lerp(lerp(hash(ix, iy), hash(ix + 1, iy), ux), lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), ux), uy);
}

function runShader(ctx, w, h, fsSource, uniforms) {
  if (!window._glCanvas) window._glCanvas = document.createElement('canvas');
  const canvas = window._glCanvas;
  canvas.width = w; canvas.height = h;
  const gl = canvas.getContext('webgl', { antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  if (!gl) return;
  const vs = `attribute vec2 pos; void main() { gl_Position = vec4(pos, 0.0, 1.0); }`;
  const prog = gl.createProgram();
  const shaders = [];
  let buf;
  try {
    [vs, fsSource].forEach((src, i) => {
      const s = gl.createShader(i ? gl.FRAGMENT_SHADER : gl.VERTEX_SHADER);
      shaders.push(s);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error(`Shader compilation failed: ${gl.getShaderInfoLog(s)}`);
      }
      gl.attachShader(prog, s);
    });
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(`Shader linking failed: ${gl.getProgramInfoLog(prog)}`);
    }
    gl.useProgram(prog);
    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(gl.getUniformLocation(prog, "res"), w, h);
    Object.entries(uniforms).forEach(([k, v]) => {
      const l = gl.getUniformLocation(prog, k);
      if (Array.isArray(v)) {
        if (v.length === 2) gl.uniform2f(l, v[0], v[1]);
        else if (v.length === 3) gl.uniform3f(l, v[0], v[1], v[2]);
      } else {
        gl.uniform1f(l, v);
      }
    });
    gl.viewport(0, 0, w, h);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    ctx.drawImage(canvas, 0, 0);
  } finally {
    gl.useProgram(null);
    if (buf) gl.deleteBuffer(buf);
    gl.deleteProgram(prog);
    shaders.forEach(shader => gl.deleteShader(shader));
  }
}

