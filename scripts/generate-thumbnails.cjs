const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const outputDirectory = path.join(root, 'assets', 'thumbnails');
const launchOptions = process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {};
const requestedIds = new Set(process.argv.slice(2));

(async () => {
  fs.mkdirSync(outputDirectory, { recursive: true });
  const browser = await chromium.launch({ ...launchOptions, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  if (process.env.THREEJS_PATH) {
    await page.route('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', route => {
      route.fulfill({ path: path.resolve(process.env.THREEJS_PATH) });
    });
  }

  await page.goto(pathToFileURL(path.join(root, 'studio.html')).href);
  await page.waitForFunction(() => typeof ENGINES !== 'undefined' && typeof render === 'function');

  const catalogEngines = await page.evaluate(() => ENGINE_CATALOG.flatMap(([, entries]) => entries));
  const engines = catalogEngines
    .map((entry, catalogIndex) => ({ entry, catalogIndex }))
    .filter(({ entry: [id] }) => !requestedIds.size || requestedIds.has(id));
  for (let outputIndex = 0; outputIndex < engines.length; outputIndex++) {
    const { entry: [id, name], catalogIndex } = engines[outputIndex];
    const dataUrl = await page.evaluate(({ id, index }) => {
      uiEngineSelect.value = id;
      resetActiveEngine();
      const paletteKeys = Object.keys(PALETTES);
      const palette = PALETTES[paletteKeys[index % paletteKeys.length]];
      bgColor = palette[0];
      currentColors = palette.slice(1);
      document.getElementById('paramSeed').value = 1301 + index * 977;
      compGrain.value = 8;
      canvas.width = 480;
      canvas.height = 320;
      render();
      if (id === 'organicThreeJS' && !window.THREE) {
        const context = canvas.getContext('2d');
        const points = [];
        const rotateX = 0.72, rotateY = -0.55;
        for (let step = 0; step <= 720; step++) {
          const t = step / 720 * Math.PI * 2;
          const radius = 2 + Math.cos(3 * t);
          let x = radius * Math.cos(2 * t), y = radius * Math.sin(2 * t), z = Math.sin(3 * t);
          const y1 = y * Math.cos(rotateX) - z * Math.sin(rotateX);
          z = y * Math.sin(rotateX) + z * Math.cos(rotateX);
          y = y1;
          const x1 = x * Math.cos(rotateY) + z * Math.sin(rotateY);
          z = -x * Math.sin(rotateY) + z * Math.cos(rotateY);
          points.push({ x: 240 + x1 * 63, y: 160 + y * 63, z, step });
        }
        const segments = points.slice(1).map((point, segmentIndex) => ({ from: points[segmentIndex], to: point }));
        segments.sort((a, b) => (a.from.z + a.to.z) - (b.from.z + b.to.z));
        context.lineCap = 'round';
        segments.forEach(({ from, to }) => {
          context.strokeStyle = currentColors[Math.floor(from.step / 60) % currentColors.length];
          context.lineWidth = 7 + (from.z + 3) * 1.2;
          context.beginPath(); context.moveTo(from.x, from.y); context.lineTo(to.x, to.y); context.stroke();
        });
      }
      return canvas.toDataURL('image/webp', 0.8);
    }, { id, index: catalogIndex });

    const encoded = dataUrl.replace(/^data:image\/webp;base64,/, '');
    fs.writeFileSync(path.join(outputDirectory, `${id}.webp`), encoded, 'base64');
    process.stdout.write(`[${outputIndex + 1}/${engines.length}] ${name}\n`);
  }

  await browser.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
