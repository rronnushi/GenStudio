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
  gradients: 'Colors blend into smooth, layered backgrounds.',
  colorBands: 'Stripes of different widths build bold color compositions.',
  blocks: 'Colored rectangles create balanced abstract layouts.',
  mondrian: 'Rectangular sections form structured modernist grids.',
  bauhaus: 'Circles, arches, lines, and blocks form bold compositions.',
  checkerboard: 'Checks shift in size and color across a repeating grid.',
  woven: 'Interlocking shapes create patterns that look woven.',
  seamlessGeometricTiling: 'Geometric tiles repeat to fill the whole canvas.',
  geoGrid: 'Different shapes are arranged across a simple grid.',
  hexCubes: 'Angled cube faces join into repeating 3D patterns.',
  truchetGrid: 'Curved and angled tiles connect into winding paths.',
  hexGrid: 'Hexagons form a clean and adjustable repeating pattern.',
  circMaze: 'Paths and walls grow into a circular maze.',
  waveFunctionCollapse: 'Small tiles fit together to make surprising patterns.',
  symmPixelArt: 'Mirrored pixels create colorful tapestry-like designs.',
  halftone: 'A field of dots turns color and light into texture.',
  glitch: 'Blocks, lines, and shifts create a digital glitch effect.',
  crystalGems: 'Sharp colored faces form crystal-like shapes.',
  circlePacking: 'Circles of many sizes fill the available space.',
  delaunay: 'Colorful triangles connect into irregular geometric networks.',
  voronoiStained: 'Irregular colored cells resemble pieces of stained glass.',
  mandalaPrecision: 'Rings and coils repeat around a detailed center.',
  concentricPolygons: 'Angular shapes rotate and shrink toward the center.',
  kaleidoscope: 'Mirrored shapes repeat around a central point.',
  spirograph: 'Circular movements draw detailed looping curves.',
  radialBurst: 'Lines and rays spread outward from the center.',
  harmonograph: 'Overlapping swinging lines create delicate drawings.',
  lissajous: 'Smooth curves cross and loop into balanced figures.',
  guilloche: 'Fine repeating curves form engraved-looking decorations.',
  topography: 'Layered contour lines resemble hills on a map.',
  fluidMarble: 'Color ribbons twist together like liquid marble.',
  cellular: 'Layered circles grow into soft organic blooms.',
  perlinContours: 'Uneven contour lines create natural-looking terrain.',
  waves: 'Flowing layers stack into rolling waves and landscapes.',
  superformula: 'Petals and layers form adjustable geometric flowers.',
  unifiedFlow: 'Long lines follow smooth paths across the canvas.',
  flowField: 'Small particles move through flowing paths.',
  vortexBlocks: 'Small blocks turn and travel through a swirling path.',
  opArt: 'High-contrast shapes create movement and optical effects.',
  polarPoints: 'Dense dots bend into waves, rings, and spirals.',
  chladni: 'Fine lines gather into patterns inspired by vibrating plates.',
  sineOscillator: 'Layered wave lines create flowing graphic patterns.',
  quantumInterference: 'Overlapping ripples form detailed wave patterns.',
  webglFractal: 'A repeating fractal reveals more detail as you zoom.',
  clifford: 'Thousands of points gather into strange flowing shapes.',
  constellation: 'Stars and connecting lines form imagined constellations.',
  organicThreeJS: 'A looping 3D knot twists through space.',
  wireTerrain: 'A wire grid rises and falls like a landscape.',
  isoBlocks: 'Stacked blocks grow into colorful isometric towers.',
  isometricGreeble: 'Platforms and blocks build a dense abstract city.',
  skyline: 'Layered buildings form a colorful city skyline.',
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
