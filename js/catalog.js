// The display taxonomy is kept separate so engine IDs and rendering stay stable.
const ENGINE_CATALOG = [
  ['Color & Composition', [
    ['gradients', 'Gradients'], ['colorBands', 'Stripe Collage'],
    ['blocks', 'Block Composition'], ['mondrian', 'Mondriaan Grid'],
    ['bauhaus', 'Bauhaus Shapes'],
  ]],
  ['Patterns & Effects', [
    ['checkerboard', 'Checkerboard'], ['woven', 'Woven Patterns'],
    ['seamlessGeometricTiling', 'Pattern Tiles'], ['geoGrid', 'Shape Grid'],
    ['hexCubes', 'Cube Tiles'], ['truchetGrid', 'Truchet Paths'],
    ['hexGrid', 'Hexagon Tiles'], ['circMaze', 'Maze'], ['waveFunctionCollapse', 'Wave Function Tiles'],
    ['symmPixelArt', 'Pixel Tapestry'], ['halftone', 'Halftone'],
    ['glitch', 'Glitch'],
  ]],
  ['Geometry & Symmetry', [
    ['crystalGems', 'Crystal Facets'], ['circlePacking', 'Packed Circles'],
    ['delaunay', 'Triangle Web'], ['voronoiStained', 'Stained Glass'],
    ['mandalaPrecision', 'Coil Mandala'],
    ['concentricPolygons', 'Nested Polygons'], ['kaleidoscope', 'Kaleidoscope'],
    ['spirograph', 'Spirograph'], ['radialBurst', 'Radial Burst'],
    ['harmonograph', 'Harmonograph'], ['lissajous', 'Lissajous Loops'], ['guilloche', 'Guilloché Engraving'],
  ]],
  ['Organic & Flow', [
    ['topography', 'Topographic Map'], ['fluidMarble', 'Marbling'],
    ['cellular', 'Organic Blooms'], ['perlinContours', 'Contour Lines'],
    ['waves', 'Layered Waves'], ['superformula', 'Geometric Flowers'],
    ['unifiedFlow', 'Flow Lines'], ['flowField', 'Flow Particles'],
    ['vortexBlocks', 'Block Flow'],
  ]],
  ['Fields & Systems', [
    ['opArt', 'Op Art'], ['polarPoints', 'Wave Dots'],
    ['chladni', 'Vibration Patterns'], ['sineOscillator', 'Sine Waves'],
    ['quantumInterference', 'Ripple Interference'], ['webglFractal', 'Julia Fractal'],
    ['clifford', 'Strange Attractor'], ['constellation', 'Constellations'],
  ]],
  ['3D & Architecture', [
    ['organicThreeJS', 'Torus Knot'], ['wireTerrain', 'Wireframe Terrain'],
    ['isoBlocks', 'Isometric Towers'], ['isometricGreeble', 'Terraced City'],
    ['skyline', 'City Skyline'],
  ]],
];

const ENGINE_DESCRIPTIONS = {
  gradients: 'Layered color fields with soft directional transitions.',
  colorBands: 'Graphic stripes arranged into bold rhythmic compositions.',
  blocks: 'A flexible field of balanced geometric color blocks.',
  mondrian: 'Rectangular divisions inspired by modernist grid painting.',
  bauhaus: 'Playful circles, arches, blocks, and architectural forms.',
  checkerboard: 'Classic checks transformed through scale and color.',
  woven: 'Interlocking motifs that build a textile-like surface.',
  seamlessGeometricTiling: 'Repeatable geometric tiles with crisp visual rhythm.',
  geoGrid: 'Mixed shapes organized across a modular grid.',
  hexCubes: 'Isometric cube forms assembled into dimensional patterns.',
  truchetGrid: 'Rotating path tiles that form unexpected connected routes.',
  hexGrid: 'A structured field of configurable hexagonal cells.',
  circMaze: 'Circular and orthogonal passages generated as a maze.',
  waveFunctionCollapse: 'Rule-based tiles assembled into coherent patterns.',
  symmPixelArt: 'Mirrored pixel clusters with a tapestry-like character.',
  halftone: 'Dot screens that translate tone into graphic texture.',
  glitch: 'Digital fragments, displacement, and controlled visual noise.',
  crystalGems: 'Angular facets assembled into crystalline color fields.',
  circlePacking: 'Nested circles packed organically into available space.',
  delaunay: 'Connected triangles forming a loose geometric web.',
  voronoiStained: 'Irregular cells resembling colored glass and leadwork.',
  mandalaPrecision: 'Concentric coils built with precise radial repetition.',
  concentricPolygons: 'Nested angular rings that rotate and contract inward.',
  kaleidoscope: 'Mirrored forms repeated through radial symmetry.',
  spirograph: 'Interlocking orbital curves drawn by mathematical gears.',
  radialBurst: 'Rays spreading outward from a concentrated center.',
  harmonograph: 'Layered pendulum curves with intricate interference.',
  lissajous: 'Smooth looping figures created from paired oscillations.',
  guilloche: 'Fine engraved curves woven into ornamental rosettes.',
  topography: 'Contour bands that resemble mapped terrain and elevation.',
  fluidMarble: 'Flowing color ribbons with liquid, marbled movement.',
  cellular: 'Organic blooms grown from layered circular structures.',
  perlinContours: 'Noise-driven contour lines with a natural landscape feel.',
  waves: 'Stacked flowing layers shaped into rolling silhouettes.',
  superformula: 'Mathematical flowers with configurable petals and layers.',
  unifiedFlow: 'Continuous streamlines moving through a shared vector field.',
  flowField: 'Thousands of particles tracing directional currents.',
  vortexBlocks: 'Rectangular marks pulled through a swirling field.',
  opArt: 'High-contrast geometry designed for optical movement.',
  polarPoints: 'Dense dots arranged by waves and polar distortion.',
  chladni: 'Geometric nodal patterns inspired by vibrating surfaces.',
  sineOscillator: 'Layered sine waves turned into graphic line fields.',
  quantumInterference: 'Overlapping wave sources creating rippled interference.',
  webglFractal: 'A detailed Julia fractal rendered through WebGL.',
  clifford: 'Particle trails orbiting through a strange attractor.',
  constellation: 'Stars and connecting threads forming celestial networks.',
  organicThreeJS: 'A sculptural torus knot rendered as a 3D form.',
  wireTerrain: 'A perspective wireframe landscape of generated elevation.',
  isoBlocks: 'Stacked isometric towers with varied height and color.',
  isometricGreeble: 'Dense architectural terraces and modular city forms.',
  skyline: 'Layered buildings assembled into an atmospheric city view.',
};

if (typeof ENGINES !== 'undefined') {
  const catalogIds = new Set();
  for (const [group, entries] of ENGINE_CATALOG) {
    for (const [id, name] of entries) {
      if (!ENGINES[id] || catalogIds.has(id)) throw new Error(`Invalid catalog engine: ${id}`);
      catalogIds.add(id);
      ENGINES[id].name = name;
      ENGINES[id].group = group;
    }
  }
  if (catalogIds.size !== Object.keys(ENGINES).length) throw new Error('Engine catalog is incomplete');
}
