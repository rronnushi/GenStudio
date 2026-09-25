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
