// The display taxonomy is kept separate so engine IDs and rendering stay stable.
const ENGINE_CATALOG = [
  ['Color & Composition', [
    ['gradients', 'Gradients'], ['colorBands', 'Stripe Collage'],
    ['blocks', 'Block Composition'], ['mondrian', 'Mondriaan Grid'],
    ['bauhaus', 'Bauhaus Shapes'],
  ]],
  ['Tiles & Textiles', [
    ['checkerboard', 'Checkerboard'], ['woven', 'Woven Patterns'],
    ['seamlessGeometricTiling', 'Pattern Tiles'], ['geoGrid', 'Shape Grid'],
    ['hexCubes', 'Cube Tiles'], ['truchetGrid', 'Truchet Paths'],
    ['hexGrid', 'Hexagon Tiles'], ['circMaze', 'Maze'],
  ]],
  ['Cells & Mosaics', [
    ['crystalGems', 'Crystal Facets'], ['circlePacking', 'Packed Circles'],
    ['delaunay', 'Triangle Web'], ['voronoiStained', 'Stained Glass'],
  ]],
  ['Nature & Terrain', [
    ['topography', 'Topographic Map'], ['fluidMarble', 'Marbling'],
    ['cellular', 'Organic Blooms'], ['perlinContours', 'Contour Lines'],
    ['waves', 'Layered Waves'], ['superformula', 'Geometric Flowers'],
  ]],
  ['Radial & Loop Forms', [
    ['mandalaPrecision', 'Coil Mandala'],
    ['concentricPolygons', 'Nested Polygons'], ['kaleidoscope', 'Kaleidoscope'],
    ['spirograph', 'Spirograph'], ['radialBurst', 'Radial Burst'],
    ['harmonograph', 'Harmonograph'], ['lissajous', 'Lissajous Loops'],
  ]],
  ['Flow & Particles', [
    ['unifiedFlow', 'Flow Lines'], ['flowField', 'Flow Particles'],
    ['vortexBlocks', 'Block Flow'], ['constellation', 'Constellations'],
  ]],
  ['Waves & Optical', [
    ['opArt', 'Op Art'], ['polarPoints', 'Wave Dots'],
    ['chladni', 'Vibration Patterns'], ['sineOscillator', 'Sine Waves'],
    ['quantumInterference', 'Ripple Interference'],
  ]],
  ['Space & Architecture', [
    ['organicThreeJS', 'Torus Knot'], ['wireTerrain', 'Wireframe Terrain'],
    ['isoBlocks', 'Isometric Towers'], ['isometricGreeble', 'Terraced City'],
    ['skyline', 'City Skyline'],
  ]],
  ['Texture & Fractals', [
    ['symmPixelArt', 'Pixel Tapestry'], ['halftone', 'Halftone'],
    ['webglFractal', 'Julia Fractal'], ['clifford', 'Strange Attractor'],
    ['glitch', 'Glitch'],
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
