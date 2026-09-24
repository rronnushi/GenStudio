const ENGINES = {
  gradients: {
    name: "Color Gradients", group: "Foundations",
    params: {
      style: { type: 'select', options: ['Linear', 'Radial', 'Conic'], val: 'Linear', label: "Style" },
      angle: { type: 'range', min: 0, max: 360, val: 45, label: "Angle" },
      steps: { type: 'range', min: 2, max: 255, val: 255, label: "Color Bands" }
    },
    render: (c, w, h, p, cols) => {
      const seedAngleShift = (random() * 360);
      const effectiveAngle = (p.angle + seedAngleShift) * Math.PI / 180;
      const cx = w / 2, cy = h / 2, d = Math.hypot(w, h);

      let g = p.style === 'Linear' 
        ? c.createLinearGradient(cx - Math.cos(effectiveAngle)*d/2, cy - Math.sin(effectiveAngle)*d/2, cx + Math.cos(effectiveAngle)*d/2, cy + Math.sin(effectiveAngle)*d/2) 
        : (p.style === 'Radial' ? c.createRadialGradient(cx, cy, 0, cx, cy, d / 1.5) : c.createConicGradient(effectiveAngle, cx, cy));

      const seedOrderedCols = [bgColor, ...cols].map((cl, i) => ({ cl, sort: hash(i, 42) })).sort((a,b) => a.sort - b.sort).map(o => o.cl);
      seedOrderedCols.forEach((col, i, arr) => g.addColorStop(i / (arr.length - 1 || 1), col));

      c.fillStyle = g; c.fillRect(0, 0, w, h);
      if (p.steps < 255) {
        const img = c.getImageData(0, 0, w, h), dt = img.data, f = 255 / p.steps;
        for (let i = 0; i < dt.length; i += 4) {
          dt[i] = Math.round(dt[i] / f) * f;
          dt[i+1] = Math.round(dt[i+1] / f) * f;
          dt[i+2] = Math.round(dt[i+2] / f) * f;
        }
        c.putImageData(img, 0, 0);
      }
    }
  },

  colorBands: {
    name: "Stripe Collage", group: "Foundations",
    params: {
      div: { type: 'range', min: 1, max: 200, val: 8, label: "Sections" },
      den: { type: 'range', min: 1, max: 1000, val: 60, label: "Stripe Density" },
      angle: { type: 'range', min: 0, max: 360, val: 90, label: "Stripe Angle" },
      gp: { type: 'range', min: 0, max: 50, val: 0, label: "Spacing Gap" },
      ch: { type: 'range', min: 0, max: 100, val: 0, label: "Edge Bleed" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h);
      const rad = p.angle * Math.PI / 180;
      const diag = Math.hypot(w, h) * 1.5;
      c.save();
      c.translate(w / 2, h / 2);
      c.rotate(rad);
      c.translate(-diag / 2, -diag / 2);

      let cw = diag / p.div;
      for (let i = 0; i < p.div; i++) {
        let y = 0;
        while (y < diag) {
          let dh = randomRange(1, 2000 / p.den);
          c.fillStyle = pick(cols);
          let o = randomRange(-p.ch, p.ch);
          c.fillRect(i * cw - 0.5 + o + p.gp / 2, y - 0.5 + p.gp / 2, cw + 1.5 + Math.abs(o) - p.gp, dh + 1.5 - p.gp);
          y += dh;
        }
      }
      c.restore();
    }
  },

  organicThreeJS: {
    name: "3D Ribbon Knot", group: "3D Forms",
    params: {
      twist: { type: 'range', min: 1, max: 20, val: 5, label: "Knot Coils" },
      density: { type: 'range', min: 50, max: 1200, val: 400, label: "Smoothness" },
      scale: { type: 'range', min: 10, max: 300, val: 120, label: "Size" },
      tube: { type: 'range', min: 1, max: 100, val: 40, label: "Thickness" },
      rx: { type: 'range', min: 0, max: 360, val: 45, label: "Tilt X" },
      ry: { type: 'range', min: 0, max: 360, val: 45, label: "Tilt Y" },
      rz: { type: 'range', min: 0, max: 360, val: 0, label: "Tilt Z" },
      wireWeight: { type: 'range', min: 0, max: 50, val: 2, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h);
      if (!window.THREE) return;
      if (!window._thR) window._thR = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
      window._thR.setSize(w, h);
      window._thR.setClearColor(0, 0);
      const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(45, w / h, 0.1, 3000);
      cam.position.z = 400 + Math.max(w, h) * 0.25;
      const tc = document.createElement('canvas'); tc.width = 256; tc.height = 1;
      const tx = tc.getContext('2d'), grad = tx.createLinearGradient(0, 0, 256, 0);
      cols.forEach((cl, i) => grad.addColorStop(i / (cols.length - 1 || 1), cl));
      tx.fillStyle = grad; tx.fillRect(0, 0, 256, 1);
      const texture = new THREE.CanvasTexture(tc);
      const geo = new THREE.TorusKnotGeometry(p.scale * 1.5, p.tube, p.density, 16, p.twist, 3);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        wireframe: p.wireWeight > 0,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });
      const m = new THREE.Mesh(geo, mat);
      const seedRotX = randomRange(-20, 20);
      const seedRotY = randomRange(-20, 20);
      m.rotation.set((p.rx + seedRotX) * Math.PI / 180, (p.ry + seedRotY) * Math.PI / 180, p.rz * Math.PI / 180);
      sc.add(m);
      window._thR.render(sc, cam);
      c.drawImage(window._thR.domElement, 0, 0);
      geo.dispose(); mat.dispose(); texture.dispose();
    }
  },

  wireTerrain: {
    name: "3D Wireframe Landscape", group: "3D Forms",
    params: {
      sc: { type: 'range', min: 10, max: 100, val: 40, label: "Grid Density" },
      ht: { type: 'range', min: 10, max: 500, val: 200, label: "Mountain Height" },
      wp: { type: 'range', min: 10, max: 500, val: 200, label: "Terrain Curvature" },
      lw: { type: 'range', min: 0.5, max: 50, val: 1.5, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h);
      c.lineWidth = p.lw;
      const pts = [];
      const seedOffsetX = (hash(globalSeed, 1) * 1000);
      const seedOffsetY = (hash(globalSeed, 2) * 1000);
      for (let y = 0; y < h * 1.5; y += p.sc) {
        let r = [];
        for (let x = 0; x <= w; x += p.sc) {
          r.push({ x, y: y - noise2D((x + seedOffsetX) / p.wp, (y + seedOffsetY) / p.wp) * p.ht });
        }
        pts.push(r);
      }
      for (let y = 0; y < pts.length - 1; y++) {
        for (let x = 0; x < pts[y].length - 1; x++) {
          c.strokeStyle = cols[(x + y) % cols.length];
          c.beginPath();
          c.moveTo(pts[y][x].x, pts[y][x].y);
          c.lineTo(pts[y][x + 1].x, pts[y][x + 1].y);
          c.lineTo(pts[y + 1][x].x, pts[y + 1][x].y);
          c.stroke();
        }
      }
    }
  },

  topography: {
    name: "Topography", group: "Natural Forms",
    params: {
      scale: { type: 'range', min: 10, max: 600, val: 140, label: "Detail Zoom" },
      bands: { type: 'range', min: 2, max: 64, val: 20, label: "Elevation Levels" },
      lineWeight: { type: 'range', min: 0, max: 50, val: 8, label: "Outline Width" }
    },
    render: (ctx, w, h, p, cols) => {
      const imgData = ctx.createImageData(w, h);
      const data = imgData.data;
      const scale = p.scale / 30000;
      const bandCount = p.bands;
      const thicknessThreshold = p.lineWeight / 200;
      const rgbCols = [bgColor, ...cols].map(hex => {
        const num = parseInt(hex.slice(1), 16);
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
      });
      const contourCol = rgbCols[0];
      const ox = hash(globalSeed, 11) * 500;
      const oy = hash(globalSeed, 22) * 500;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let n1 = noise2D((x + ox) * scale, (y + oy) * scale);
          let n2 = noise2D((x + 50 + ox) * scale * 2, (y + 50 + oy) * scale * 2) * 0.3;
          let n = (n1 + n2) / 1.3;
          n = Math.max(0, Math.min(1, (n + 0.5) * 0.7));

          const bandFloat = n * bandCount;
          const bandIndex = Math.floor(bandFloat);
          const fraction = bandFloat - bandIndex;
          const idx = (y * w + x) * 4;

          if (p.lineWeight > 0 && (fraction < thicknessThreshold || fraction > (1 - thicknessThreshold))) {
            data[idx] = contourCol[0];
            data[idx + 1] = contourCol[1];
            data[idx + 2] = contourCol[2];
          } else {
            const cIdx = ((bandIndex % cols.length) + cols.length) % cols.length;
            const col = rgbCols[cIdx + 1] || rgbCols[1];
            data[idx] = col[0];
            data[idx + 1] = col[1];
            data[idx + 2] = col[2];
          }
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
  },

  fluidMarble: {
    name: "Fluid Marble", group: "Natural Forms",
    params: {
      sc: { type: 'range', min: 10, max: 1000, val: 300, label: "Scale" },
      wp: { type: 'range', min: 0, max: 200, val: 60, label: "Swirl Warp" },
      bnd: { type: 'range', min: 1, max: 30, val: 8, label: "Color Ribbons" },
      tb: { type: 'range', min: 1, max: 50, val: 10, label: "Turbulence" },
      con: { type: 'range', min: 10, max: 300, val: 100, label: "Contrast" }
    },
    render: (c, w, h, p, cols) => {
      const imgData = c.createImageData(w, h);
      const dt = imgData.data, ns = p.sc / 10000, tb = p.tb / 10;
      const rgb = cols.map(x => { const n = parseInt(x.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; });
      const ox = hash(globalSeed, 3) * 1000, oy = hash(globalSeed, 4) * 1000;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let wx = x + noise2D((x + ox) * ns, (y + oy) * ns) * p.wp * tb;
          let wy = y + noise2D((x + ox + 100) * ns, (y + oy + 100) * ns) * p.wp * tb;
          let n = noise2D(wx * ns, wy * ns) * 0.5 + 0.5;
          let bf = n * p.bnd, ci = Math.floor(bf) % cols.length, ni = (ci + 1) % cols.length, fr = bf - Math.floor(bf);
          let f = Math.pow(fr * fr * (3 - 2 * fr), p.con / 100);
          const c1 = rgb[ci], c2 = rgb[ni], id = (y * w + x) * 4;
          dt[id] = c1[0] + (c2[0] - c1[0]) * f;
          dt[id + 1] = c1[1] + (c2[1] - c1[1]) * f;
          dt[id + 2] = c1[2] + (c2[2] - c1[2]) * f;
          dt[id + 3] = 255;
        }
      }
      c.putImageData(imgData, 0, 0);
    }
  },

  cellular: {
    name: "Cellular Blooms", group: "Natural Forms",
    params: {
      cl: { type: 'range', min: 1, max: 500, val: 40, label: "Bloom Count" },
      dst: { type: 'range', min: 0, max: 1000, val: 120, label: "Organic Warp" },
      l: { type: 'range', min: 1, max: 30, val: 8, label: "Rings per Bloom" },
      sp: { type: 'range', min: 0, max: 200, val: 40, label: "Radius Spread" },
      mut: { type: 'range', min: 1, max: 50, val: 6, label: "Petal Shape" },
      outlineWidth: { type: 'range', min: 0, max: 50, val: 2, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); c.lineJoin = 'round';
      for (let i = 0; i < p.cl; i++) {
        const cx = random() * w, cy = random() * h, br = randomRange(10, Math.min(w, h) * (p.sp / 100));
        for (let l = p.l; l > 0; l--) {
          const lr = l / p.l, r = br * lr;
          c.beginPath();
          const pts = Math.max(50, Math.floor(r * 2));
          for (let pt = 0; pt <= pts; pt++) {
            const th = (pt / pts) * Math.PI * 2;
            const n1 = noise2D(Math.cos(th) * 1.5 + cx * 0.01, Math.sin(th) * 1.5 + cy * 0.01);
            let mv = Math.pow(Math.abs(noise2D(Math.cos(th) * p.mut + cx, Math.sin(th) * p.mut + cy)), 3);
            const dr = r + (n1 * p.dst * lr) + (mv * p.dst * 3);
            const px = cx + Math.cos(th) * dr, py = cy + Math.sin(th) * dr;
            if (pt === 0) c.moveTo(px, py); else c.lineTo(px, py);
          }
          c.fillStyle = cols[l % cols.length];
          c.globalAlpha = 0.9;
          c.fill();
          if (p.outlineWidth > 0) {
            c.strokeStyle = cols[(l + 1) % cols.length];
            c.lineWidth = p.outlineWidth;
            c.stroke();
          }
        }
      }
      c.globalAlpha = 1;
    }
  },

  perlinContours: {
    name: "Contour Rings", group: "Natural Forms",
    params: {
      sc: { type: 'range', min: 1, max: 100, val: 50, label: "Field Frequency" },
      th: { type: 'range', min: 0, max: 50, val: 10, label: "Outline Width" },
      sm: { type: 'range', min: 1, max: 100, val: 10, label: "Ring Density" }
    },
    render: (c, w, h, p, cols) => {
      const id = c.createImageData(w, h), dt = id.data;
      const bg = [parseInt(bgColor.slice(1,3),16), parseInt(bgColor.slice(3,5),16), parseInt(bgColor.slice(5,7),16)];
      const fg = [parseInt(cols[0].slice(1,3),16), parseInt(cols[0].slice(3,5),16), parseInt(cols[0].slice(5,7),16)];
      const ox = hash(globalSeed, 7) * 200, oy = hash(globalSeed, 8) * 200;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let v = noise2D((x + ox) * p.sc / 10000, (y + oy) * p.sc / 10000) * 0.5 + 0.5;
          let fr = v * p.sm - Math.floor(v * p.sm);
          let cl = (p.th > 0 && fr < p.th / 100) ? fg : bg;
          let i = (y * w + x) * 4;
          dt[i] = cl[0]; dt[i + 1] = cl[1]; dt[i + 2] = cl[2]; dt[i + 3] = 255;
        }
      }
      c.putImageData(id, 0, 0);
    }
  },

mandalaPrecision: {
    name: "Mandala", group: "Geometric",
    params: {
      canvasCoverage: { type: 'range', min: 40, max: 300, val: 110, label: "Scale / Bleed %" },
      rings: { type: 'range', min: 2, max: 40, val: 10, label: "Strata Tiers (Depth)" },
      symmetry: { type: 'range', min: 2, max: 64, val: 24, label: "Harmonic Symmetry" },
      coilProbability: { type: 'range', min: 0, max: 100, val: 65, label: "Coil Tier Ratio %" },
      coilDensity: { type: 'range', min: 2, max: 32, val: 12, label: "Coil Density (Frequency)" },
      coilReach: { type: 'range', min: 0, max: 180, val: 85, label: "Coil Loop Amplitude %" },
      coilTwist: { type: 'range', min: 0, max: 100, val: 35, label: "Helical Phase Twist %" },
      depthRhythm: { type: 'range', min: 2, max: 100, val: 75, label: "Depth Contrast %" },
      strokeWeight: { type: 'range', min: 0.5, max: 9.0, val: 1.5, label: "Base Line Weight" },
      colorMode: { 
        type: 'select', 
        options: ['Ring Alternating', 'Palette Radiant', 'Monochrome'], 
        val: 'Ring Alternating', 
        label: "Color Styling" 
      }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor;
      c.fillRect(0, 0, w, h);

      const cx = Math.floor(w * 0.5);
      const cy = Math.floor(h * 0.5);
      const cornerDist = Math.hypot(w * 0.5, h * 0.5);
      const maxRadius = cornerDist * (p.canvasCoverage / 100);

      const numTiers = Math.max(3, Math.floor(p.rings));
      const baseSym = Math.max(6, Math.floor(p.symmetry));
      const baseWeight = p.strokeWeight;
      const rhythmDepth = p.depthRhythm / 100;

      const coilChance = p.coilProbability / 100;
      const coilFreqParam = Math.max(1, Math.floor(p.coilDensity));
      const coilAmpParam = p.coilReach / 100;
      const twistFactor = (p.coilTwist / 100) * 0.85;

      const activeCols = cols && cols.length > 0 ? cols : ['#111418'];
      const numCols = activeCols.length;

      c.lineCap = 'round';
      c.lineJoin = 'round';

      const getTierColor = (idx, total) => {
        if (p.colorMode === 'Monochrome') return activeCols[0];
        if (p.colorMode === 'Ring Alternating') return activeCols[idx % numCols];
        const t = idx / Math.max(1, total - 1);
        return activeCols[Math.min(numCols - 1, Math.floor(t * numCols))];
      };

      // 1. Concentric Harmonic Shell Tiers
      const tiers = [];
      const innerCoreR = Math.max(12, maxRadius * 0.07);

      for (let i = 0; i < numTiers; i++) {
        const t0 = i / numTiers;
        const t1 = (i + 1) / numTiers;

        const r0 = innerCoreR + (maxRadius - innerCoreR) * Math.pow(t0, 1.35);
        const r1 = innerCoreR + (maxRadius - innerCoreR) * Math.pow(t1, 1.35);

        tiers.push({
          rIn: r0,
          rOut: r1,
          span: r1 - r0,
          midR: (r0 + r1) * 0.5,
          idx: i
        });
      }

      // 2. Central Rosette Hub
      const coreCol = getTierColor(0, numTiers);
      c.strokeStyle = coreCol;
      c.lineWidth = baseWeight * 1.6;

      c.beginPath();
      c.arc(cx, cy, innerCoreR * 0.35, 0, Math.PI * 2);
      c.stroke();

      c.beginPath();
      c.arc(cx, cy, innerCoreR * 0.75, 0, Math.PI * 2);
      c.stroke();

      // Hub Helical Coil (Clean closed periodicity)
      const eyeCoils = baseSym * 2;
      const eyeSamples = eyeCoils * 18;
      const eyeAmp = innerCoreR * 0.15;
      const eyeTrack = innerCoreR * 0.55;

      c.lineWidth = baseWeight * 0.75;
      c.beginPath();
      for (let s = 0; s < eyeSamples; s++) {
        const phi = (s / eyeSamples) * Math.PI * 2;
        const th = phi * eyeCoils;
        const rCur = eyeTrack + Math.sin(th) * eyeAmp;
        const aTot = phi + (Math.cos(th) * eyeAmp) / eyeTrack;
        const px = cx + Math.cos(aTot) * rCur;
        const py = cy + Math.sin(aTot) * rCur;
        if (s === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.stroke();

      // 3. Render Strata Tiers
      for (let k = 0; k < tiers.length; k++) {
        const tier = tiers[k];
        const tierCol = getTierColor(tier.idx, numTiers);
        c.strokeStyle = tierCol;
        c.fillStyle = tierCol;

        const tierHash = hash(tier.idx * 73 + globalSeed, 31);
        let sym = baseSym;
        if (tierHash > 0.65) sym = baseSym * 2;
        else if (tierHash < 0.28 && baseSym % 2 === 0) sym = Math.floor(baseSym * 0.5);

        const tierWeight = baseWeight * (0.75 + ((tier.idx % 2) * rhythmDepth * 0.95));
        c.lineWidth = tierWeight;

        const isCoilTier = (tierHash < coilChance) || (k === tiers.length - 1 && coilChance > 0.15);

        if (isCoilTier) {
          // Exact integer harmonics to avoid seam jumps
          const totalCoils = Math.round(sym * coilFreqParam);
          const samples = totalCoils * 20;
          const loopAmplitude = (tier.span * 0.48) * coilAmpParam;
          const trackR = tier.midR;
          const twistSign = (tier.idx % 2 === 0 ? 1 : -1);

          c.beginPath();
          for (let s = 0; s < samples; s++) {
            const phi = (s / samples) * Math.PI * 2;
            const theta = phi * totalCoils;

            // Modulate amplitude so it strictly meets zero jump at the 2PI boundary
            const radialOffset = Math.sin(theta) * loopAmplitude;
            const angularShear = (Math.cos(theta) * loopAmplitude) / trackR;
            const currentAngle = phi + angularShear * (1.0 + twistFactor * twistSign);
            const currentRadius = trackR + radialOffset;

            const px = cx + Math.cos(currentAngle) * currentRadius;
            const py = cy + Math.sin(currentAngle) * currentRadius;

            if (s === 0) c.moveTo(px, py);
            else c.lineTo(px, py);
          }
          c.closePath();
          c.stroke();

          // Parallel tracking guide rings
          c.lineWidth = baseWeight * 0.65;
          c.beginPath();
          c.arc(cx, cy, Math.max(1, trackR - loopAmplitude), 0, Math.PI * 2);
          c.stroke();

          c.beginPath();
          c.arc(cx, cy, trackR + loopAmplitude, 0, Math.PI * 2);
          c.stroke();

          // Outer satellite beads
          if (tierHash > 0.4) {
            const dotCount = Math.floor(totalCoils / 2);
            const dotStep = (Math.PI * 2) / dotCount;
            const dotR = baseWeight * 0.95;
            for (let d = 0; d < dotCount; d++) {
              const da = d * dotStep;
              const bx = cx + Math.cos(da) * (trackR + loopAmplitude);
              const by = cy + Math.sin(da) * (trackR + loopAmplitude);
              c.beginPath();
              c.arc(bx, by, dotR, 0, Math.PI * 2);
              c.fill();
            }
          }
        } else {
          const altType = Math.floor(hash(tier.idx * 101 + globalSeed, 17) * 3);

          if (altType === 0) {
            // Diamond Lattice Guilloche Mesh
            const count = sym * 2;
            const stepAngle = (Math.PI * 2) / count;
            const chordOffset = stepAngle * 2.5;

            c.beginPath();
            for (let i = 0; i < count; i++) {
              const a0 = i * stepAngle;
              const pIn = { x: cx + Math.cos(a0) * tier.rIn, y: cy + Math.sin(a0) * tier.rIn };
              const pOut1 = { x: cx + Math.cos(a0 + chordOffset) * tier.rOut, y: cy + Math.sin(a0 + chordOffset) * tier.rOut };
              const pOut2 = { x: cx + Math.cos(a0 - chordOffset) * tier.rOut, y: cy + Math.sin(a0 - chordOffset) * tier.rOut };

              c.moveTo(pIn.x, pIn.y);
              c.lineTo(pOut1.x, pOut1.y);
              c.moveTo(pIn.x, pIn.y);
              c.lineTo(pOut2.x, pOut2.y);
            }
            c.stroke();
          } else if (altType === 1) {
            // Lanceolate Petal Spindles
            const stepAngle = (Math.PI * 2) / sym;
            const spread = stepAngle * 0.4;
            c.lineWidth = baseWeight * 1.15;
            c.beginPath();

            for (let i = 0; i < sym; i++) {
              const a = i * stepAngle;
              const p0 = { x: cx + Math.cos(a - spread) * tier.rIn, y: cy + Math.sin(a - spread) * tier.rIn };
              const p1 = { x: cx + Math.cos(a + spread) * tier.rIn, y: cy + Math.sin(a + spread) * tier.rIn };
              const pApex = { x: cx + Math.cos(a) * tier.rOut, y: cy + Math.sin(a) * tier.rOut };
              const pMidL = { x: cx + Math.cos(a - spread * 1.4) * tier.midR, y: cy + Math.sin(a - spread * 1.4) * tier.midR };
              const pMidR = { x: cx + Math.cos(a + spread * 1.4) * tier.midR, y: cy + Math.sin(a + spread * 1.4) * tier.midR };

              c.moveTo(p0.x, p0.y);
              c.quadraticCurveTo(pMidL.x, pMidL.y, pApex.x, pApex.y);
              c.moveTo(p1.x, p1.y);
              c.quadraticCurveTo(pMidR.x, pMidR.y, pApex.x, pApex.y);
              c.moveTo(cx + Math.cos(a) * tier.rIn, cy + Math.sin(a) * tier.rIn);
              c.lineTo(pApex.x, pApex.y);
            }
            c.stroke();
          } else {
            // Dual Concentric Rail with Dentils
            c.beginPath();
            c.arc(cx, cy, tier.rIn, 0, Math.PI * 2);
            c.stroke();

            c.beginPath();
            c.arc(cx, cy, tier.rOut, 0, Math.PI * 2);
            c.stroke();

            const dentils = sym * 4;
            const dentilStep = (Math.PI * 2) / dentils;
            c.lineWidth = baseWeight * 0.7;
            c.beginPath();
            for (let i = 0; i < dentils; i++) {
              const a = i * dentilStep;
              c.moveTo(cx + Math.cos(a) * tier.rIn, cy + Math.sin(a) * tier.rIn);
              c.lineTo(cx + Math.cos(a) * tier.rOut, cy + Math.sin(a) * tier.rOut);
            }
            c.stroke();
          }
        }
      }

      // 4. Perimeter Guilloche Frame
      c.strokeStyle = getTierColor(numTiers - 1, numTiers);
      c.lineWidth = baseWeight * 1.8;
      c.beginPath();
      c.arc(cx, cy, maxRadius, 0, Math.PI * 2);
      c.stroke();

      c.lineWidth = baseWeight * 0.85;
      c.beginPath();
      c.arc(cx, cy, maxRadius + baseWeight * 3.5, 0, Math.PI * 2);
      c.stroke();
    }
  },
  
  checkerboard: {
    name: "Checkerboard", group: "Geometric",
    params: {
      sc: { type: 'range', min: 10, max: 400, val: 60, label: "Tile Size" },
      angle: { type: 'range', min: 0, max: 360, val: 0, label: "Angle" },
      colorMode: { type: 'select', options: ['Alternating Two-Tone', 'Random Individual', 'Gradient Blend'], val: 'Random Individual', label: "Color Layout" },
      md: { type: 'select', options: ['Solid Fill', 'Outlines', 'Mixed Circles'], val: 'Solid Fill', label: "Tile Style" },
      gap: { type: 'range', min: 0, max: 40, val: 2, label: "Spacing" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h);
      const r = p.angle * Math.PI / 180;
      const diag = Math.ceil(Math.hypot(w, h) * 1.5);
      const size = Math.max(6, Math.floor(p.sc));
      const gap = p.gap;
      const innerSize = Math.max(1, size - gap);

      c.save();
      c.translate(w / 2, h / 2);
      c.rotate(r);
      c.translate(-diag / 2, -diag / 2);

      const countX = Math.ceil(diag / size) + 2;
      const countY = Math.ceil(diag / size) + 2;
      const seedOffset = Math.floor(random() * 50);

      for (let gy = 0; gy < countY; gy++) {
        for (let gx = 0; gx < countX; gx++) {
          const px = Math.floor(gx * size);
          const py = Math.floor(gy * size);

          let fillCol;
          if (p.colorMode === 'Alternating Two-Tone') {
            fillCol = (gx + gy + seedOffset) % 2 === 0 ? cols[0] : (cols[1] || bgColor);
          } else if (p.colorMode === 'Gradient Blend') {
            const prog = (gx / countX + gy / countY + seedOffset * 0.05) * 0.5;
            const idx = Math.floor(prog * cols.length) % cols.length;
            fillCol = cols[idx];
          } else {
            const cellHash = Math.abs(Math.floor(hash(gx * 73 + globalSeed, gy * 91 + globalSeed) * 100000));
            fillCol = cols[cellHash % cols.length];
          }

          c.fillStyle = fillCol;
          c.strokeStyle = fillCol;
          c.lineWidth = 1.5;

          if (p.md === 'Solid Fill') {
            c.fillRect(px, py, innerSize, innerSize);
          } else if (p.md === 'Outlines') {
            c.strokeRect(px + 1, py + 1, innerSize - 2, innerSize - 2);
          } else {
            if ((gx + gy) % 2 === 0) {
              c.fillRect(px, py, innerSize, innerSize);
            } else {
              c.beginPath();
              c.arc(px + innerSize / 2, py + innerSize / 2, innerSize / 2, 0, Math.PI * 2);
              c.fill();
            }
          }
        }
      }
      c.restore();
    }
  },

  crystalGems: {
    name: "Crystal Gems", group: "Geometric",
    params: {
      sc: { type: 'range', min: 20, max: 500, val: 90, label: "Facet Scale" },
      dist: { type: 'range', min: 0, max: 200, val: 80, label: "Shatter Noise" },
      mod: { type: 'select', options: ['Vibrant Gradient', 'Flat Minimal'], val: 'Vibrant Gradient', label: "Surface Style" },
      outlineWidth: { type: 'range', min: 0, max: 50, val: 1, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h);
      const s = p.sc, d = p.dist / 100, cw = Math.ceil(w / s) + 2, ch = Math.ceil(h / s) + 2, pts = [];
      for (let y = -1; y <= ch; y++) {
        let r = [];
        for (let x = -1; x <= cw; x++) r.push({ x: x * s + randomRange(-0.5 * d, 0.5 * d) * s, y: y * s + randomRange(-0.5 * d, 0.5 * d) * s });
        pts.push(r);
      }
      for (let y = 0; y < pts.length - 1; y++) {
        for (let x = 0; x < pts[y].length - 1; x++) {
          const dr = (a, b, q) => {
            c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(q.x, q.y); c.closePath();
            let g = p.mod === 'Flat Minimal' ? pick(cols) : c.createLinearGradient(a.x, a.y, q.x, q.y);
            if (p.mod !== 'Flat Minimal') { g.addColorStop(0, pick(cols)); g.addColorStop(1, bgColor); }
            c.fillStyle = g; c.fill();
            if (p.outlineWidth > 0) { c.strokeStyle = bgColor; c.lineWidth = p.outlineWidth; c.stroke(); }
          };
          if ((x + y) % 2 === 0) { dr(pts[y][x], pts[y][x + 1], pts[y + 1][x]); dr(pts[y][x + 1], pts[y + 1][x + 1], pts[y + 1][x]); }
          else { dr(pts[y][x], pts[y][x + 1], pts[y + 1][x + 1]); dr(pts[y][x], pts[y + 1][x], pts[y + 1][x + 1]); }
        }
      }
    }
  },

  woven: {
    name: "Woven Tapestry", group: "Geometric",
    params: {
      s: { type: 'range', min: 10, max: 200, val: 50, label: "Tile Size" },
      t: { type: 'range', min: 0, max: 50, val: 2, label: "Outline Width" },
      div: { type: 'range', min: 1, max: 20, val: 4, label: "Symmetry Repeat" },
      st: { type: 'select', options: ['Chevron', 'Triangle', 'Block', 'Cross', 'Diamond'], val: 'Chevron', label: "Weave Pattern" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h);
      const s = Math.max(12, Math.floor(p.s));
      const colsCount = Math.ceil(w / s) + 2;
      const rowsCount = Math.ceil(h / s) + 2;
      c.lineWidth = p.t;
      c.lineJoin = 'miter';
      const seedOffset = Math.floor(random() * 20);

      for (let gy = -1; gy < rowsCount; gy++) {
        for (let gx = -1; gx < colsCount; gx++) {
          const px = gx * s;
          const py = gy * s;
          const n = Math.abs(noise2D((gx + seedOffset) / p.div, (gy + seedOffset) / p.div));
          const primaryIdx = Math.floor(n * 10) % cols.length;
          const altIdx = (Math.abs(gx * 3 + gy * 7 + seedOffset) % cols.length);
          const col1 = cols[primaryIdx] || cols[0];
          const col2 = cols[(primaryIdx + 1) % cols.length] || cols[altIdx];

          const isEven = (gx + gy) % 2 === 0;
          c.strokeStyle = p.t > 0 ? bgColor : 'transparent';

          if (p.st === 'Block') {
            c.fillStyle = isEven ? col1 : col2;
            c.beginPath();
            c.rect(px, py, s + 1, s + 1);
            c.fill();
            if (p.t > 0) c.stroke();
          } else if (p.st === 'Triangle') {
            c.fillStyle = col1;
            c.beginPath();
            if (isEven) {
              c.moveTo(px, py); c.lineTo(px + s + 1, py); c.lineTo(px, py + s + 1);
            } else {
              c.moveTo(px + s + 1, py); c.lineTo(px + s + 1, py + s + 1); c.lineTo(px, py + s + 1);
            }
            c.closePath(); c.fill();
            if (p.t > 0) c.stroke();

            c.fillStyle = col2;
            c.beginPath();
            if (isEven) {
              c.moveTo(px + s + 1, py); c.lineTo(px + s + 1, py + s + 1); c.lineTo(px, py + s + 1);
            } else {
              c.moveTo(px, py); c.lineTo(px + s + 1, py); c.lineTo(px, py + s + 1);
            }
            c.closePath(); c.fill();
            if (p.t > 0) c.stroke();
          } else if (p.st === 'Diamond') {
            c.fillStyle = col2;
            c.fillRect(px, py, s + 1, s + 1);
            c.fillStyle = col1;
            c.beginPath();
            c.moveTo(px + s / 2, py);
            c.lineTo(px + s + 1, py + s / 2);
            c.lineTo(px + s / 2, py + s + 1);
            c.lineTo(px, py + s / 2);
            c.closePath();
            c.fill();
            if (p.t > 0) c.stroke();
          } else if (p.st === 'Cross') {
            c.fillStyle = col2;
            c.fillRect(px, py, s + 1, s + 1);
            c.fillStyle = col1;
            const third = s / 3;
            c.fillRect(px + third, py, third, s + 1);
            c.fillRect(px, py + third, s + 1, third);
            if (p.t > 0) {
              c.strokeRect(px + third, py, third, s + 1);
              c.strokeRect(px, py + third, s + 1, third);
            }
          } else {
            c.fillStyle = col1;
            c.beginPath();
            if (isEven) {
              c.moveTo(px, py);
              c.lineTo(px + s / 2, py + s / 2);
              c.lineTo(px, py + s + 1);
              c.lineTo(px + s / 2, py + s + 1);
              c.lineTo(px + s + 1, py + s / 2);
              c.lineTo(px + s / 2, py);
            } else {
              c.moveTo(px + s + 1, py);
              c.lineTo(px + s / 2, py + s / 2);
              c.lineTo(px + s + 1, py + s + 1);
              c.lineTo(px + s / 2, py + s + 1);
              c.lineTo(px, py + s / 2);
              c.lineTo(px + s / 2, py);
            }
            c.closePath();
            c.fill();
            if (p.t > 0) c.stroke();

            c.fillStyle = col2;
            c.beginPath();
            if (isEven) {
              c.moveTo(px, py);
              c.lineTo(px + s / 2, py);
              c.lineTo(px, py + s / 2);
              c.closePath(); c.fill();
              if (p.t > 0) c.stroke();

              c.beginPath();
              c.moveTo(px + s + 1, py + s + 1);
              c.lineTo(px + s / 2, py + s + 1);
              c.lineTo(px + s + 1, py + s / 2);
              c.closePath(); c.fill();
              if (p.t > 0) c.stroke();
            } else {
              c.moveTo(px + s + 1, py);
              c.lineTo(px + s / 2, py);
              c.lineTo(px + s + 1, py + s / 2);
              c.closePath(); c.fill();
              if (p.t > 0) c.stroke();

              c.beginPath();
              c.moveTo(px, py + s + 1);
              c.lineTo(px + s / 2, py + s + 1);
              c.lineTo(px, py + s / 2);
              c.closePath(); c.fill();
              if (p.t > 0) c.stroke();
            }
          }
        }
      }
    }
  },

seamlessGeometricTiling: {
    name: "Geometric Tiling", group: "Patterns",
    params: {
      pattern: { 
        type: 'select', 
        options: [
          'Concentric Circles', 'Zigzag Waves', 'Isometric Cubes', 'Diamond Rings', 'Hexagonal Grid',
          'Greek Key Maze', 'Diagonal Stripes', 'Intersecting Sine Waves', 'Rounded Diamond Mesh',
          'Scattered Minimal Squares', 'Dense Chevron Columns', 'Tartan Diamond Plaid',
          'Interlocking Flower Circles', 'Nested Square Whirl', 'Polka Dot Bubble Grid', 'Triple-Track Weave'
        ], 
        val: 'Concentric Circles', 
        label: "Pattern Motif" 
      },
      scale: { type: 'range', min: 20, max: 1200, val: 140, label: "Zoom / Scale" },
      stripesPerCell: { type: 'range', min: 1, max: 64, val: 8, label: "Density" },
      strokeW: { type: 'range', min: 0.5, max: 50, val: 8, label: "Outline Width" },
      weightVar: { 
        type: 'select', 
        options: ['Uniform Solid', 'High-Contrast Dispersal', 'Randomized Weights', 'Alternating Rhythms', 'Harmonic Taper'], 
        val: 'High-Contrast Dispersal', 
        label: "Line Variation" 
      },
      weightSteps: { type: 'range', min: 2, max: 16, val: 8, label: "Weight Steps" },
      transparency: { type: 'range', min: 0, max: 100, val: 0, label: "Transparency %" },
      stagger: { 
        type: 'select', 
        options: ['Square Grid', 'Brick Stagger (X)', 'Column Stagger (Y)'], 
        val: 'Square Grid', 
        label: "Grid Stagger" 
      },
      haloStroke: { type: 'range', min: 0, max: 50, val: 0, label: "Backing Halo" },
      angle: { type: 'range', min: 0, max: 360, val: 0, label: "Angle" },
      colorFlow: { 
        type: 'select', 
        options: ['Random', 'Palette Flow', 'Row Shift', 'Alternating', 'Black & White', 'Inverted B&W'], 
        val: 'Random', 
        label: "Color Mode" 
      }
    },
    render: (c, w, h, p, cols) => {
      const isBW = p.colorFlow === 'Black & White';
      const isInvBW = p.colorFlow === 'Inverted B&W';

      let effectiveBg = bgColor;
      let primaryDark = '#000000';
      let primaryLight = '#ffffff';

      if (isBW) {
        effectiveBg = '#ffffff';
      } else if (isInvBW) {
        effectiveBg = '#000000';
        primaryDark = '#ffffff';
        primaryLight = '#000000';
      }

      c.fillStyle = effectiveBg;
      c.fillRect(0, 0, w, h);

      const s = Math.max(16, Math.floor(p.scale));
      const cx = w / 2;
      const cy = h / 2;

      const activeCols = (isBW || isInvBW) 
        ? [primaryDark, primaryLight] 
        : (cols.length ? [...cols] : ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']);

      c.lineCap = 'round';
      c.lineJoin = 'miter';
      c.globalAlpha = Math.max(0.01, 1 - (p.transparency / 100));

      const angleDeg = parseFloat(p.angle) || 0;
      c.save();
      c.translate(cx, cy);
      c.rotate((angleDeg * Math.PI) / 180);
      c.translate(-cx, -cy);

      const diag = Math.hypot(w, h);
      const halfCols = Math.ceil((diag * 0.8) / s) + 2;
      const halfRows = Math.ceil((diag * 0.8) / s) + 2;
      const density = Math.max(1, Math.floor(p.stripesPerCell));
      const numSteps = Math.max(2, Math.floor(p.weightSteps));

      const getLineWidth = (keyA, keyB = 0) => {
        const base = Math.max(0.5, p.strokeW);
        if (p.weightVar === 'Uniform Solid') return base;

        let stepFrac = 0.5;
        if (p.weightVar === 'High-Contrast Dispersal') {
          const rawIndex = Math.abs(keyA * 3 + keyB * 7 + (globalSeed % 1000)) % numSteps;
          const dispersed = (rawIndex % 2 === 0) 
            ? (rawIndex * 0.5) 
            : (numSteps - 1 - (rawIndex - 1) * 0.5);
          stepFrac = dispersed / (numSteps - 1 || 1);
          return Math.max(0.5, base * (0.08 + stepFrac * 3.52));
        } else if (p.weightVar === 'Randomized Weights') {
          const raw = hash(keyA * 79 + keyB * 23, globalSeed);
          const bucket = Math.floor(raw * numSteps);
          const dispersed = (bucket % 2 === 0) 
            ? (bucket * 0.5) 
            : (numSteps - 1 - (bucket - 1) * 0.5);
          stepFrac = dispersed / (numSteps - 1 || 1);
          return Math.max(0.5, base * (0.1 + stepFrac * 3.4));
        } else if (p.weightVar === 'Alternating Rhythms') {
          const isThick = Math.abs(keyA + keyB + (globalSeed % 2)) % 2 === 0;
          const subLevel = (Math.floor(Math.abs(keyA + keyB) / 2) % Math.ceil(numSteps / 2)) / (Math.ceil(numSteps / 2) || 1);
          return isThick 
            ? Math.max(0.5, base * (1.8 + subLevel * 1.8)) 
            : Math.max(0.5, base * (0.15 + subLevel * 0.45));
        } else if (p.weightVar === 'Harmonic Taper') {
          const rawWave = 0.5 + 0.5 * Math.sin((keyA + keyB + (globalSeed % 360)) * 0.65);
          const bucket = Math.floor(rawWave * numSteps);
          const dispersed = (bucket % 2 === 0) 
            ? (bucket * 0.5) 
            : (numSteps - 1 - (bucket - 1) * 0.5);
          stepFrac = dispersed / (numSteps - 1 || 1);
          return Math.max(0.5, base * (0.12 + stepFrac * 3.2));
        }
        return base;
      };

      const getLineColor = (gridIdx, subIdx = 0) => {
        if (isBW) return subIdx % 2 === 0 ? '#000000' : '#333333';
        if (isInvBW) return subIdx % 2 === 0 ? '#ffffff' : '#cccccc';
        if (p.colorFlow === 'Palette Flow') {
          return activeCols[Math.abs(gridIdx + subIdx + globalSeed) % activeCols.length];
        } else if (p.colorFlow === 'Row Shift') {
          return activeCols[Math.abs(gridIdx + globalSeed) % activeCols.length];
        } else if (p.colorFlow === 'Alternating') {
          return (Math.abs(gridIdx + subIdx + globalSeed) % 2 === 0) ? activeCols[0] : (activeCols[1] || activeCols[0]);
        }
        // Default: 'Random'
        const ch = Math.abs(Math.floor(hash(gridIdx * 61 + subIdx, globalSeed) * 100000));
        return activeCols[ch % activeCols.length];
      };

      const strokeWithHalo = (baseColor, lineW) => {
        if (p.haloStroke > 0) {
          c.save();
          c.lineWidth = lineW + p.haloStroke * 2;
          c.strokeStyle = effectiveBg;
          c.stroke();
          c.restore();
        }
        c.lineWidth = lineW;
        c.strokeStyle = baseColor;
        c.stroke();
      };

      const getStaggerOffset = (gx, gy) => {
        let ox = 0, oy = 0;
        if (p.stagger === 'Brick Stagger (X)' && Math.abs(gy) % 2 === 1) ox = s * 0.5;
        if (p.stagger === 'Column Stagger (Y)' && Math.abs(gx) % 2 === 1) oy = s * 0.5;
        return { ox, oy };
      };

      if (p.pattern === 'Concentric Circles') {
        const ringCount = Math.max(2, density);
        const maxRadius = s * 0.49;
        for (let gy = -halfRows; gy <= halfRows; gy++) {
          for (let gx = -halfCols; gx <= halfCols; gx++) {
            const { ox, oy } = getStaggerOffset(gx, gy);
            const x = cx + gx * s + ox;
            const y = cy + gy * s + oy;
            for (let rIdx = ringCount; rIdx >= 1; rIdx--) {
              const rad = maxRadius * (rIdx / ringCount);
              const lineW = getLineWidth(gx * 19 + gy, rIdx);
              const strokeC = getLineColor(gx + gy, rIdx);
              c.beginPath();
              c.arc(x, y, rad, 0, Math.PI * 2);
              strokeWithHalo(strokeC, lineW);
            }
            c.fillStyle = getLineColor(gx + gy, 0);
            c.beginPath();
            c.arc(x, y, Math.max(1, p.strokeW * 0.8), 0, Math.PI * 2);
            c.fill();
          }
        }
      } else if (p.pattern === 'Zigzag Waves') {
        const stepY = (s * 0.6) / density;
        const yRange = halfRows * density * 2;
        for (let gy = -yRange; gy <= yRange; gy++) {
          const y = cy + gy * stepY;
          const lineW = getLineWidth(gy, 0);
          const strokeC = getLineColor(gy, gy);
          c.beginPath();
          c.moveTo(cx - (halfCols + 1) * s, y);
          for (let gx = -halfCols - 1; gx <= halfCols + 1; gx++) {
            const { ox } = getStaggerOffset(gx, gy);
            const x = cx + gx * s + ox;
            c.lineTo(x + s * 0.5, y + (gx % 2 === 0 ? -stepY * density : stepY * density));
          }
          strokeWithHalo(strokeC, lineW);
        }
      } else if (p.pattern === 'Isometric Cubes') {
        const hx = Math.sqrt(3) * (s * 0.5);
        const hy = s * 0.75;
        const r = s * 0.5;
        const numStripes = density;

        for (let gy = -halfRows * 2; gy <= halfRows * 2; gy++) {
          const shift = (Math.abs(gy) % 2 === 1) ? hx : 0;
          const y = cy + gy * hy;
          for (let gx = -halfCols - 1; gx <= halfCols + 1; gx++) {
            const x = cx + gx * (hx * 2) + shift;

            c.save();
            c.beginPath();
            c.moveTo(x, y); c.lineTo(x + hx, y - r * 0.5); c.lineTo(x, y - r); c.lineTo(x - hx, y - r * 0.5);
            c.closePath();
            c.fillStyle = effectiveBg; c.fill(); c.clip();

            const cTop = getLineColor(gx, gy);
            for (let i = -numStripes * 2; i <= numStripes * 2; i++) {
              const step = (hx / numStripes) * i;
              const lineW = getLineWidth(gx * 7 + gy, i);
              c.beginPath();
              c.moveTo(x - hx + step, y);
              c.lineTo(x + step, y - r);
              strokeWithHalo(cTop, lineW);
            }
            c.restore();

            c.save();
            c.beginPath();
            c.moveTo(x, y); c.lineTo(x - hx, y - r * 0.5); c.lineTo(x - hx, y + r * 0.5); c.lineTo(x, y + r);
            c.closePath();
            c.fillStyle = effectiveBg; c.fill(); c.clip();

            const cLeft = getLineColor(gx + 1, gy);
            for (let i = -numStripes; i <= numStripes * 2; i++) {
              const stepY = (r / numStripes) * i;
              const lineW = getLineWidth(gx * 11 + gy, i);
              c.beginPath();
              c.moveTo(x - hx * 1.5, y - r * 0.5 + stepY);
              c.lineTo(x + hx * 0.5, y + r * 0.5 + stepY);
              strokeWithHalo(cLeft, lineW);
            }
            c.restore();

            c.save();
            c.beginPath();
            c.moveTo(x, y); c.lineTo(x + hx, y - r * 0.5); c.lineTo(x + hx, y + r * 0.5); c.lineTo(x, y + r);
            c.closePath();
            c.fillStyle = effectiveBg; c.fill(); c.clip();

            const cRight = getLineColor(gx, gy + 1);
            const stepX = hx / numStripes;
            for (let i = 0; i <= numStripes; i++) {
              const vx = x + i * stepX;
              const lineW = getLineWidth(gx * 13 + gy, i);
              c.beginPath();
              c.moveTo(vx, y - r);
              c.lineTo(vx, y + r * 1.5);
              strokeWithHalo(cRight, lineW);
            }
            c.restore();

            const wireW = getLineWidth(gx + gy, 99);
            const wireC = (isBW || isInvBW) ? primaryDark : activeCols[0];
            c.beginPath();
            c.moveTo(x, y); c.lineTo(x, y + r);
            c.moveTo(x, y); c.lineTo(x - hx, y - r * 0.5);
            c.moveTo(x, y); c.lineTo(x + hx, y - r * 0.5);
            c.moveTo(x, y - r); c.lineTo(x + hx, y - r * 0.5); c.lineTo(x + hx, y + r * 0.5); c.lineTo(x, y + r);
            c.lineTo(x - hx, y + r * 0.5); c.lineTo(x - hx, y - r * 0.5); c.closePath();
            strokeWithHalo(wireC, wireW);
          }
        }
      } else if (p.pattern === 'Diamond Rings') {
        const step = s / density;
        const maxRadius = halfCols * s;
        for (let r = step; r <= maxRadius; r += step) {
          const idx = Math.floor(r / step);
          const lineW = getLineWidth(idx, 0);
          const strokeC = getLineColor(idx, idx);
          c.beginPath();
          c.moveTo(cx, cy - r);
          c.lineTo(cx + r, cy);
          c.lineTo(cx, cy + r);
          c.lineTo(cx - r, cy);
          c.closePath();
          strokeWithHalo(strokeC, lineW);
        }
      } else if (p.pattern === 'Hexagonal Grid') {
        const step = (s * 0.866) / density;
        const numLines = Math.ceil(diag / step);
        for (let i = -numLines; i <= numLines; i++) {
          const offset = i * step;
          const lineW = getLineWidth(i, 0);
          const strokeC = getLineColor(i, i);

          c.beginPath();
          c.moveTo(cx - diag, cy + offset);
          c.lineTo(cx + diag, cy + offset);
          strokeWithHalo(strokeC, lineW);

          c.beginPath();
          c.moveTo(cx + offset - diag * 0.5, cy - diag * 0.866);
          c.lineTo(cx + offset + diag * 0.5, cy + diag * 0.866);
          strokeWithHalo(strokeC, getLineWidth(i, 1));

          c.beginPath();
          c.moveTo(cx + offset + diag * 0.5, cy - diag * 0.866);
          c.lineTo(cx + offset - diag * 0.5, cy + diag * 0.866);
          strokeWithHalo(strokeC, getLineWidth(i, 2));
        }
      } else if (p.pattern === 'Greek Key Maze') {
        const stepY = s / density;
        const yRange = halfRows * density * 2;
        for (let gy = -yRange; gy <= yRange; gy++) {
          const y = cy + gy * stepY;
          const lineW = getLineWidth(gy, 0);
          const strokeC = getLineColor(gy, gy);
          c.beginPath();
          c.moveTo(cx - (halfCols + 1) * s, y);
          for (let gx = -halfCols - 1; gx <= halfCols + 1; gx++) {
            const { ox } = getStaggerOffset(gx, gy);
            const x = cx + gx * s + ox;
            c.lineTo(x, y - stepY * 0.5);
            c.lineTo(x + s * 0.5, y - stepY * 0.5);
            c.lineTo(x + s * 0.5, y + stepY * 0.5);
            c.lineTo(x + s, y + stepY * 0.5);
            c.lineTo(x + s, y);
          }
          strokeWithHalo(strokeC, lineW);
        }
      } else if (p.pattern === 'Diagonal Stripes') {
        const step = (s * 0.707) / density;
        const totalLines = Math.ceil(diag / step);
        for (let i = -totalLines; i <= totalLines; i++) {
          const offset = i * step;
          const lineW = getLineWidth(i, 0);
          const strokeC = getLineColor(i, i);
          c.beginPath();
          c.moveTo(cx + offset - diag, cy - diag);
          c.lineTo(cx + offset + diag, cy + diag);
          strokeWithHalo(strokeC, lineW);
        }
      } else if (p.pattern === 'Intersecting Sine Waves') {
        const stepY = (s * 0.6) / density;
        const yRange = halfRows * density * 2;
        const waveLen = s * 1.5;
        for (let gy = -yRange; gy <= yRange; gy++) {
          const y = cy + gy * stepY;
          const phase = (gy % 2 === 0) ? 0 : Math.PI;
          const lineW = getLineWidth(gy, 0);
          const strokeC = getLineColor(gy, gy);
          c.beginPath();
          for (let x = cx - halfCols * s; x <= cx + halfCols * s; x += 6) {
            const dy = Math.sin((x / waveLen) * Math.PI * 2 + phase + (globalSeed % 360)) * (stepY * 1.8);
            if (x === cx - halfCols * s) c.moveTo(x, y + dy); else c.lineTo(x, y + dy);
          }
          strokeWithHalo(strokeC, lineW);
        }
      } else if (p.pattern === 'Rounded Diamond Mesh') {
        const r = s * 0.42;
        const cr = Math.min(r * 0.4, 16);
        for (let gy = -halfRows; gy <= halfRows; gy++) {
          for (let gx = -halfCols; gx <= halfCols; gx++) {
            const { ox, oy } = getStaggerOffset(gx, gy);
            const x = cx + gx * s + ox;
            const y = cy + gy * s + oy;
            const lineW = getLineWidth(gx, gy);
            const strokeC = getLineColor(gx, gy);

            c.save();
            c.translate(x, y);
            c.rotate(Math.PI / 4);
            c.beginPath();
            c.moveTo(-r + cr, -r);
            c.lineTo(r - cr, -r);
            c.quadraticCurveTo(r, -r, r, -r + cr);
            c.lineTo(r, r - cr);
            c.quadraticCurveTo(r, r, r - cr, r);
            c.lineTo(-r + cr, r);
            c.quadraticCurveTo(-r, r, -r, r - cr);
            c.lineTo(-r, -r + cr);
            c.quadraticCurveTo(-r, -r, -r + cr, -r);
            strokeWithHalo(strokeC, lineW);
            c.restore();

            c.fillStyle = strokeC;
            c.beginPath();
            c.arc(x + s * 0.5, y + s * 0.5, Math.max(1.5, p.strokeW * 0.75), 0, Math.PI * 2);
            c.fill();
          }
        }
      } else if (p.pattern === 'Scattered Minimal Squares') {
        const sub = Math.max(2, Math.floor(density * 0.8));
        const cellSize = s / sub;
        for (let gy = -halfRows * sub; gy <= halfRows * sub; gy++) {
          for (let gx = -halfCols * sub; gx <= halfCols * sub; gx++) {
            const x = cx + gx * cellSize;
            const y = cy + gy * cellSize;
            const pseudo = Math.abs(Math.floor(hash(gx * 73 + globalSeed, gy * 31 + globalSeed) * 100));
            if (pseudo % 3 === 0) {
              const weightMod = getLineWidth(gx, gy) / p.strokeW;
              const sqSize = cellSize * (0.3 + (pseudo % 5) * 0.16) * Math.min(2.5, Math.max(0.4, weightMod));
              c.fillStyle = getLineColor(gx, pseudo);
              if (p.haloStroke > 0) {
                c.strokeStyle = effectiveBg;
                c.lineWidth = p.haloStroke;
                c.strokeRect(x - sqSize * 0.5, y - sqSize * 0.5, sqSize, sqSize);
              }
              c.fillRect(x - sqSize * 0.5, y - sqSize * 0.5, sqSize, sqSize);
            }
          }
        }
      } else if (p.pattern === 'Dense Chevron Columns') {
        const colW = s * 0.5;
        const stepY = (s * 0.4) / density;
        const yRange = halfRows * density * 2;
        for (let gx = -halfCols * 2; gx <= halfCols * 2; gx++) {
          const x = cx + gx * colW;
          const invert = Math.abs(gx) % 2 === 1;
          for (let gy = -yRange; gy <= yRange; gy++) {
            const y = cy + gy * stepY;
            const lineW = getLineWidth(gx, gy);
            const strokeC = getLineColor(gx, gy);
            c.beginPath();
            c.moveTo(x - colW * 0.5, y + (invert ? colW * 0.4 : -colW * 0.4));
            c.lineTo(x, y);
            c.lineTo(x + colW * 0.5, y + (invert ? colW * 0.4 : -colW * 0.4));
            strokeWithHalo(strokeC, lineW);
          }
        }
      } else if (p.pattern === 'Tartan Diamond Plaid') {
        const step = (s * 0.707) / density;
        const totalLines = Math.ceil(diag / step);
        for (let i = -totalLines; i <= totalLines; i++) {
          const offset = i * step;
          const isPair = Math.abs(i) % 4 < 2;
          const baseW = isPair ? p.strokeW * 1.6 : Math.max(0.5, p.strokeW * 0.6);
          const lineW = getLineWidth(i, 0) * (baseW / p.strokeW);
          const strokeC = getLineColor(i, i);

          c.beginPath();
          c.moveTo(cx + offset - diag, cy - diag);
          c.lineTo(cx + offset + diag, cy + diag);
          strokeWithHalo(strokeC, lineW);

          c.beginPath();
          c.moveTo(cx - offset + diag, cy - diag);
          c.lineTo(cx - offset - diag, cy + diag);
          strokeWithHalo(strokeC, lineW);
        }
      } else if (p.pattern === 'Interlocking Flower Circles') {
        const r = s * 0.5;
        for (let gy = -halfRows; gy <= halfRows; gy++) {
          for (let gx = -halfCols; gx <= halfCols; gx++) {
            const { ox, oy } = getStaggerOffset(gx, gy);
            const x = cx + gx * r + ox;
            const y = cy + gy * r + oy;
            const lineW = getLineWidth(gx, gy);
            const strokeC = getLineColor(gx, gy);
            c.beginPath();
            c.arc(x, y, r, 0, Math.PI * 2);
            strokeWithHalo(strokeC, lineW);
          }
        }
      } else if (p.pattern === 'Nested Square Whirl') {
        for (let gy = -halfRows; gy <= halfRows; gy++) {
          for (let gx = -halfCols; gx <= halfCols; gx++) {
            const { ox, oy } = getStaggerOffset(gx, gy);
            const x = cx + gx * s + ox;
            const y = cy + gy * s + oy;
            const maxSq = s * 0.48;
            for (let d = density; d >= 1; d--) {
              const sq = maxSq * (d / density);
              const rotAngle = (density - d) * 0.08;
              c.save();
              c.translate(x, y);
              c.rotate(rotAngle);
              const lineW = getLineWidth(gx * 5 + gy, d);
              const strokeC = getLineColor(gx + gy, d);
              c.beginPath();
              c.rect(-sq, -sq, sq * 2, sq * 2);
              strokeWithHalo(strokeC, lineW);
              c.restore();
            }
          }
        }
      } else if (p.pattern === 'Polka Dot Bubble Grid') {
        const sub = Math.max(1, Math.floor(density * 0.5));
        const step = s / sub;
        for (let gy = -halfRows * sub; gy <= halfRows * sub; gy++) {
          for (let gx = -halfCols * sub; gx <= halfCols * sub; gx++) {
            const { ox, oy } = getStaggerOffset(gx, gy);
            const x = cx + gx * step + ox;
            const y = cy + gy * step + oy;
            const isSolid = (Math.abs(gx + gy) % 2 === 0);
            const strokeC = getLineColor(gx, gy);
            const lineW = getLineWidth(gx, gy);

            if (isSolid) {
              c.fillStyle = strokeC;
              const dotR = step * 0.25 * (lineW / p.strokeW);
              if (p.haloStroke > 0) {
                c.beginPath();
                c.arc(x, y, Math.max(1, dotR) + p.haloStroke, 0, Math.PI * 2);
                c.fillStyle = effectiveBg;
                c.fill();
                c.fillStyle = strokeC;
              }
              c.beginPath();
              c.arc(x, y, Math.max(1, dotR), 0, Math.PI * 2);
              c.fill();
            } else {
              c.beginPath();
              c.arc(x, y, step * 0.35, 0, Math.PI * 2);
              strokeWithHalo(strokeC, lineW);
            }
          }
        }
      } else {
        const step = s;
        for (let gy = -halfRows; gy <= halfRows; gy++) {
          for (let gx = -halfCols; gx <= halfCols; gx++) {
            const x = cx + gx * step;
            const y = cy + gy * step;
            const isHoriz = (Math.abs(gx + gy) % 2 === 0);
            const strokeC = getLineColor(gx, gy);

            const lineTotal = Math.min(4, density);
            for (let l = 0; l < lineTotal; l++) {
              const lineW = getLineWidth(gx * 7 + gy, l);
              const off = (l - (lineTotal - 1) / 2) * (p.strokeW * 2.5);
              c.beginPath();
              if (isHoriz) {
                c.moveTo(x - step * 0.48, y + off);
                c.lineTo(x + step * 0.48, y + off);
              } else {
                c.moveTo(x + off, y - step * 0.48);
                c.lineTo(x + off, y + step * 0.48);
              }
              strokeWithHalo(strokeC, lineW);
            }
          }
        }
      }

      c.restore();
      c.globalAlpha = 1.0;
    }
  },
  
  blocks: {
    name: "Architectural Blocks", group: "Geometric",
    params: {
      d: { type: 'range', min: 1, max: 12, val: 6, label: "Subdivision Depth" },
      pad: { type: 'range', min: 0, max: 150, val: 10, label: "Padding" },
      ht: { type: 'range', min: 0, max: 100, val: 40, label: "Pattern Detail %" },
      r: { type: 'range', min: 0, max: 50, val: 0, label: "Corner Radius" },
      outlineWidth: { type: 'range', min: 0, max: 50, val: 2, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); const rects = [];
      const spl = (x, y, rw, rh, d) => {
        if (d === 0 || (d < p.d && random() > 0.85)) { rects.push({ x, y, w: rw, h: rh }); return; }
        let r = randomRange(0.2, 0.8);
        if (rw > rh) { spl(x, y, rw * r, rh, d - 1); spl(x + rw * r, y, rw - rw * r, rh, d - 1); }
        else { spl(x, y, rw, rh * r, d - 1); spl(x, y + rh * r, rw, rh - rh * r, d - 1); }
      };
      spl(0, 0, w, h, p.d);
      const dr = (x, y, w, h, r) => {
        c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
        c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
        c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
      };
      rects.forEach(rt => {
        const bx = rt.x + p.pad, by = rt.y + p.pad, bw = rt.w - p.pad * 2, bh = rt.h - p.pad * 2;
        if (bw <= 0 || bh <= 0) return;
        const c1 = pick(cols);
        c.fillStyle = bgColor; c.globalAlpha = 0.5; c.fillRect(bx + p.pad / 2, by + p.pad / 2, bw, bh); c.globalAlpha = 1;
        c.fillStyle = c1; c.strokeStyle = c1;
        if (random() * 100 < p.ht) {
          const c2 = pick(cols), sw = randomRange(2, 20);
          c.save();
          p.r > 0 ? dr(bx, by, bw, bh, p.r) : (c.beginPath(), c.rect(bx, by, bw, bh));
          c.clip(); c.fillRect(bx, by, bw, bh); c.fillStyle = c2;
          let pt = Math.floor(random() * 3);
          if (pt === 0) { for (let x = bx; x < bx + bw; x += sw * 2) c.fillRect(x, by, sw, bh); }
          else if (pt === 1) { for (let y = by; y < by + bh; y += sw * 2) c.fillRect(bx, y, bw, sw); }
          else { c.beginPath(); c.arc(bx + bw / 2, by + bh / 2, Math.min(bw, bh) * randomRange(0.2, 0.5), 0, Math.PI * 2); c.fill(); }
          c.restore();
        } else {
          p.r > 0 ? dr(bx, by, bw, bh, p.r) : (c.beginPath(), c.rect(bx, by, bw, bh));
          c.fill();
        }
        if (p.outlineWidth > 0) {
          c.strokeStyle = bgColor; c.lineWidth = p.outlineWidth;
          p.r > 0 ? (dr(bx, by, bw, bh, p.r), c.stroke()) : c.strokeRect(bx, by, bw, bh);
        }
      });
    }
  },

  geoGrid: {
    name: "Geometric Grid", group: "Geometric",
    params: {
      s: { type: 'range', min: 10, max: 500, val: 80, label: "Cell Size" },
      sh: { type: 'select', options: ['all', 'squares', 'circles', 'mixed'], val: 'all', label: "Shape Motif" },
      outlineWidth: { type: 'range', min: 0, max: 50, val: 1, label: "Outline Width" },
      angle: { type: 'range', min: 0, max: 360, val: 0, label: "Grid Angle" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h);
      const s = p.s, colsNum = Math.ceil(w / s) + 2, rowsNum = Math.ceil(h / s) + 2;
      c.save(); c.translate(w / 2, h / 2); c.rotate(p.angle * Math.PI / 180); c.translate(-w / 2, -h / 2);
      for (let y = 0; y < rowsNum; y++) {
        for (let x = 0; x < colsNum; x++) {
          let px = x * s, py = y * s, ts = s;
          let cIdxFill = Math.abs(Math.floor(hash(x + globalSeed, y + globalSeed) * 1000)) % cols.length;
          c.fillStyle = cols[cIdxFill]; c.strokeStyle = p.outlineWidth > 0 ? bgColor : 'transparent'; c.lineWidth = p.outlineWidth;
          let t = (Math.abs(Math.floor(hash(x + 1 + globalSeed, y + 1 + globalSeed) * 100))) % 4;
          if (p.sh === 'squares') t = 0; if (p.sh === 'circles') t = 1; if (p.sh === 'mixed') t = t % 2;
          c.beginPath();
          if (t === 0) c.rect(px, py, ts, ts);
          else if (t === 1) c.arc(px + ts / 2, py + ts / 2, ts / 2, 0, Math.PI * 2);
          else if (t === 2) { c.moveTo(px, py + ts); c.lineTo(px + ts / 2, py); c.lineTo(px + ts, py + ts); }
          else { c.moveTo(px + ts / 2, py + ts / 2); c.arc(px + ts / 2, py + ts / 2, ts / 2, 0, Math.PI); }
          c.fill(); if (p.outlineWidth > 0) c.stroke();
        }
      }
      c.restore();
    }
  },

  circlePacking: {
    name: "Circle Bubbles", group: "Geometric",
    params: {
      a: { type: 'range', min: 500, max: 20000, val: 5000, label: "Bubble Attempts" },
      mn: { type: 'range', min: 2, max: 50, val: 4, label: "Smallest Radius" },
      mx: { type: 'range', min: 10, max: 400, val: 120, label: "Largest Radius" },
      nest: { type: 'range', min: 0, max: 5, val: 2, label: "Inner Filled Circles" },
      stk: { type: 'range', min: 0, max: 50, val: 1, label: "Outline Width" },
      opacity: { type: 'range', min: 10, max: 100, val: 100, label: "Opacity %" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); const circs = [];
      for (let i = 0; i < p.a; i++) {
        let r = randomRange(p.mn, p.mx), x = randomRange(r, w - r), y = randomRange(r, h - r), v = true;
        for (let j = 0; j < circs.length; j++) {
          if ((x - circs[j].x) ** 2 + (y - circs[j].y) ** 2 < (r + circs[j].r + p.stk) ** 2) { v = false; break; }
        }
        if (v) circs.push({ x, y, r, c: pick(cols) });
      }
      circs.forEach(ci => {
        c.fillStyle = ci.c; c.strokeStyle = bgColor; c.lineWidth = p.stk; c.globalAlpha = p.opacity / 100;
        c.beginPath(); c.arc(ci.x, ci.y, ci.r, 0, Math.PI * 2); c.fill();
        if (p.stk > 0) c.stroke();

        for (let k = 1; k <= p.nest; k++) {
          let nr = ci.r * (1 - k / (p.nest + 1));
          if (nr > p.mn * 0.5) {
            c.fillStyle = pick(cols);
            c.beginPath(); c.arc(ci.x, ci.y, nr, 0, Math.PI * 2); c.fill();
            if (p.stk > 0) {
              c.strokeStyle = bgColor;
              c.lineWidth = Math.max(1, p.stk * 0.6);
              c.stroke();
            }
          }
        }
      });
      c.globalAlpha = 1;
    }
  },

isoBlocks: {
    name: "Isometric City", group: "Geometric",
    params: {
      g: { type: 'range', min: 4, max: 60, val: 18, label: "City Grid Size" },
      ht: { type: 'range', min: 0, max: 1000, val: 120, label: "Tower Height" },
      t: { type: 'range', min: 10, max: 90, val: 50, label: "Perspective Tilt" },
      gp: { type: 'range', min: 0, max: 80, val: 10, label: "Street Gap %" },
      win: { type: 'range', min: 0, max: 100, val: 20, label: "Windows %" },
      outlineWidth: { type: 'range', min: 0, max: 50, val: 1, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor;
      c.fillRect(0, 0, w, h);
      c.lineJoin = 'round';

      const grid = Math.max(4, Math.floor(p.g));
      const tw = Math.min(w, h) / grid;
      const th = tw * (p.t / 100);

      const gapScale = Math.min(0.85, (p.gp / 100));
      const ww = Math.max(2, tw * (1 - gapScale));
      const hh = Math.max(1, th * (1 - gapScale));

      const ox = w / 2;
      const oy = h * 0.88;
      const seedShift = globalSeed % 50;

      for (let d = 0; d <= (grid - 1) * 2; d++) {
        const minR = Math.max(0, d - (grid - 1));
        const maxR = Math.min(grid - 1, d);

        for (let r = minR; r <= maxR; r++) {
          const l = d - r;

          // Tower height: smooth low-frequency terrain noise
          const n = noise2D(r * 0.15 + seedShift, l * 0.15 + seedShift);
          const towerHeight = Math.abs(n) * p.ht * 4.5 + 8;

          // Color assignment: high-frequency spatial hash breaks spatial clumps
          // Alternate odd/even checker steps prevent adjacent twins
          const cellHash = Math.abs(Math.floor(hash(r * 197 + globalSeed, l * 283 + globalSeed) * 100000));
          const checkerOffset = (r ^ l) & 1 ? 1 : 0;
          const colorIdx = (cellHash + checkerOffset) % cols.length;
          const baseCol = cols[colorIdx];

          const ix = ox + (l - r) * (tw / 2);
          const iy = oy - (l + r) * (th / 2);

          c.lineWidth = p.outlineWidth;
          c.strokeStyle = p.outlineWidth > 0 ? bgColor : baseCol;

          // 1. Left Wall (Shadowed)
          c.globalAlpha = 0.55;
          c.fillStyle = baseCol;
          c.beginPath();
          c.moveTo(ix, iy - towerHeight);
          c.lineTo(ix - ww / 2, iy + hh / 2 - towerHeight);
          c.lineTo(ix - ww / 2, iy + hh / 2);
          c.lineTo(ix, iy);
          c.closePath();
          c.fill();
          if (p.outlineWidth > 0) c.stroke();

          // 2. Right Wall (Mid-tone)
          c.globalAlpha = 0.75;
          c.beginPath();
          c.moveTo(ix, iy - towerHeight);
          c.lineTo(ix + ww / 2, iy + hh / 2 - towerHeight);
          c.lineTo(ix + ww / 2, iy + hh / 2);
          c.lineTo(ix, iy);
          c.closePath();
          c.fill();
          if (p.outlineWidth > 0) c.stroke();

          // 3. Roof Top (Direct Light)
          c.globalAlpha = 1.0;
          c.beginPath();
          c.moveTo(ix, iy - towerHeight);
          c.lineTo(ix + ww / 2, iy + hh / 2 - towerHeight);
          c.lineTo(ix, iy + hh - towerHeight);
          c.lineTo(ix - ww / 2, iy + hh / 2 - towerHeight);
          c.closePath();
          c.fill();
          if (p.outlineWidth > 0) c.stroke();

          // 4. Windows
          if (p.win > 0 && towerHeight > 24 && ww > 8) {
            const cellPseudo = Math.abs(Math.floor(hash(r * 31 + globalSeed, l * 47) * 100));
            if (cellPseudo < p.win) {
              c.fillStyle = bgColor;
              c.globalAlpha = 0.85;
              const winW = Math.max(1, ww * 0.12);
              const winH = Math.max(2, winW * 1.8);
              const stepY = winH * 2.2;

              for (let wy = iy - towerHeight + hh + 2; wy < iy - winH; wy += stepY) {
                c.fillRect(ix - ww * 0.32, wy, winW, winH);
                c.fillRect(ix + ww * 0.32 - winW, wy, winW, winH);
              }
            }
          }
        }
      }

      c.globalAlpha = 1.0;
    }
  },

isometricGreeble: {
  name: "Isometric City 2.0", group: "Geometric",
  params: {
density: { type: 'range', min: 8, max: 240, val: 42, label: "City Block Scale" },
subdiv: { type: 'range', min: 0.5, max: 8.0, val: 4.4, label: "Detail Depth" },
maxSlab: { type: 'range', min: 1, max: 24, val: 6, label: "Max Plateau Size" },
ht: { type: 'range', min: 10, max: 1200, val: 220, label: "Max Elevation" },
relief: { type: 'range', min: 0, max: 100, val: 60, label: "Height Contrast %" },
ribbing: { type: 'range', min: 0, max: 100, val: 45, label: "Ribbed Runners %" },
terraces: { type: 'range', min: 0, max: 100, val: 45, label: "Stepped Terraces %" },
isoAngle: { type: 'range', min: 0, max: 360, val: 0, label: "Isometric Angle" },
symmetryMode: { type: 'select', options: ['None', 'Bilateral', 'Quad'], val: 'None', label: "Symmetry Type" },
camZoom: { type: 'range', min: 10, max: 500, val: 100, label: "Camera Zoom %" },
outlineWidth: { type: 'range', min: 0, max: 10, val: 1.0, label: "Outline Width" },
renderStyle: { type: 'select', options: ['Standard', 'Architectural Linework', 'Both'], val: 'Standard', label: "Render Style" },
hatchDensity: { type: 'range', min: 2, max: 20, val: 5, label: "Facade Line Spacing" }
  },
  render: (c, w, h, p, cols) => {
const isInkOnly = p.renderStyle === 'Architectural Linework';
const hasLinework = p.renderStyle === 'Architectural Linework' || p.renderStyle === 'Both';

c.fillStyle = isInkOnly ? '#F5F5F3' : bgColor;
c.fillRect(0, 0, w, h);
c.lineJoin = 'miter';

const diag = Math.hypot(w, h);
const blocksAcross = Math.max(6, Math.floor(p.density));
const nominalUnit = Math.max(2.5, diag / blocksAcross);
const worldRadius = Math.ceil(blocksAcross * 0.95);

const zoomFac = Math.max(0.05, p.camZoom / 100);
const baseUnit = nominalUnit * zoomFac;
const halfTW = baseUnit;
const halfTH = baseUnit * 0.5;

const cx = w * 0.5;
const cy = h * 0.5;
const seedShift = (globalSeed % 1000);

const angleRad = (p.isoAngle * Math.PI) / 180;
const cosA = Math.cos(angleRad);
const sinA = Math.sin(angleRad);

// 1. Recursive Partitioning
const rawDepth = p.subdiv;
const baseDepth = Math.floor(rawDepth);
const fracDepth = rawDepth - baseDepth;
const maxSlabThreshold = Math.max(1, Math.floor(p.maxSlab));

const baseBlocks = [];

const splitSlab = (gx, gy, gw, gh, depth) => {
  const minDim = Math.min(gw, gh);
  const maxDim = Math.max(gw, gh);

  let shouldStop = false;
  if (depth <= 0) {
    shouldStop = true;
  } else if (depth === 1 && fracDepth > 0) {
    if (random() > fracDepth && maxDim <= maxSlabThreshold) shouldStop = true;
  } else if (minDim <= 1) {
    shouldStop = true;
  } else if (depth < baseDepth && maxDim <= maxSlabThreshold && random() < 0.18) {
    shouldStop = true;
  }

  if (shouldStop) {
    const rRoll = random() * 100;

    // Type A: Segmented Urban Row-Buildings & Runners
    if (minDim >= 2 && maxDim >= 3 && rRoll < p.ribbing) {
      const isHoriz = gw >= gh;
      const totalTracks = isHoriz ? gh : gw;
      const totalLength = isHoriz ? gw : gh;
      let trackPos = 0;

      while (trackPos < totalTracks) {
        const remainingTracks = totalTracks - trackPos;
        let laneDepth = 1;
        const dRoll = random();
        if (remainingTracks >= 3 && dRoll > 0.7) laneDepth = 3;
        else if (remainingTracks >= 2 && dRoll > 0.4) laneDepth = 2;

        let lengthPos = 0;
        let buildingIdx = 0;

        while (lengthPos < totalLength) {
          const remainingLen = totalLength - lengthPos;
          let bLen = Math.min(remainingLen, Math.floor(randomRange(2, 5)));
          if (remainingLen - bLen === 1) bLen = remainingLen;

          const buildingJitter = randomRange(0.8, 1.3);

          if (isHoriz) {
            baseBlocks.push({
              gx: gx + lengthPos, gy: gy + trackPos,
              gw: bLen, gh: laneDepth,
              type: 1, ribIdx: trackPos + buildingIdx, laneWidth: laneDepth,
              buildingJitter
            });
          } else {
            baseBlocks.push({
              gx: gx + trackPos, gy: gy + lengthPos,
              gw: laneDepth, gh: bLen,
              type: 1, ribIdx: trackPos + buildingIdx, laneWidth: laneDepth,
              buildingJitter
            });
          }

          lengthPos += bLen;
          buildingIdx++;
        }
        trackPos += laneDepth;
      }
    }
    // Type B: Organic Mixed Terraces
    else if (minDim >= 1 && rRoll < (p.ribbing + p.terraces)) {
      const footprintMax = Math.max(1.8, Math.min(4.0, maxSlabThreshold * 0.8));
      const colsTerrace = Math.max(1, Math.round(gw / footprintMax));
      const rowsTerrace = Math.max(1, Math.round(gh / footprintMax));
      const cellW = gw / colsTerrace;
      const cellH = gh / rowsTerrace;

      for (let ry = 0; ry < rowsTerrace; ry++) {
        for (let rx = 0; rx < colsTerrace; rx++) {
          const tGx = gx + rx * cellW;
          const tGy = gy + ry * cellH;
          const tMinDim = Math.min(cellW, cellH);

          const cellSeed = hash(Math.floor(tGx * 131 + tGy * 257), globalSeed);
          const terraceRoll = (cellSeed * 100) % 100;

          // 1. Interspersed Flat Anchor Slab / Courtyard
          if (terraceRoll < 28) {
            baseBlocks.push({
              gx: tGx, gy: tGy, gw: cellW, gh: cellH,
              type: 0, heightMod: 0.85 + (cellSeed * 0.4)
            });
            continue;
          }

          // 2. Varied Tier Count per Sub-cell
          let maxTiers = 2;
          if (p.terraces > 65 && tMinDim >= 2.0 && terraceRoll > 60) maxTiers = 4;
          else if (p.terraces > 35 && tMinDim >= 1.4 && terraceRoll > 40) maxTiers = 3;

          let curGw = cellW;
          let curGh = cellH;
          let curGx = tGx;
          let curGy = tGy;

          const terraceJitter = 0.8 + (cellSeed * 0.55);
          const isAsymmetricSetback = (terraceRoll % 2 === 0);

          for (let t = 0; t < maxTiers; t++) {
            baseBlocks.push({
              gx: curGx, gy: curGy, gw: curGw, gh: curGh,
              type: 2, tierIdx: t, maxTiers: maxTiers,
              terraceJitter,
              clusterHash: Math.floor(cellSeed * 1000)
            });

            let stepX, stepY;
            if (isAsymmetricSetback) {
              stepX = curGw > 2.0 ? (curGw * randomRange(0.2, 0.35)) : 0.25;
              stepY = curGh > 2.0 ? (curGh * randomRange(0.1, 0.25)) : 0.15;
              if (curGw - stepX <= 0.4 || curGh - stepY <= 0.4) break;
              curGx += (t % 2 === 0 ? stepX : 0);
              curGy += (t % 2 === 1 ? stepY : 0);
              curGw -= stepX;
              curGh -= stepY;
            } else {
              const insetRatio = randomRange(0.14, 0.26);
              stepX = Math.max(0.18, curGw * insetRatio);
              stepY = Math.max(0.18, curGh * insetRatio);
              if (curGw - stepX * 2 <= 0.3 || curGh - stepY * 2 <= 0.3) break;
              curGx += stepX;
              curGy += stepY;
              curGw -= stepX * 2;
              curGh -= stepY * 2;
            }
          }
        }
      }
    }
    // Type C: Standard Monoliths & Mixed Plazas
    else {
      if (minDim >= 3 && random() < 0.32) {
        const cutW = Math.max(1, Math.floor(gw * randomRange(0.2, 0.8)));
        const cutH = Math.max(1, Math.floor(gh * randomRange(0.2, 0.8)));
        baseBlocks.push({ gx, gy, gw: cutW, gh: cutH, type: 0, heightMod: 1.3 });
        baseBlocks.push({ gx: gx + cutW, gy, gw: gw - cutW, gh, type: 0, heightMod: 0.75 });
        baseBlocks.push({ gx, gy: gy + cutH, gw: cutW, gh: gh - cutH, type: 0, heightMod: 1.05 });
      } else {
        baseBlocks.push({ gx, gy, gw, gh, type: 0, heightMod: 1.0 });
      }
    }
    return;
  }

  const splitH = gw > gh ? true : (gw < gh ? false : random() > 0.5);
  const ratio = randomRange(0.15, 0.85);

  if (splitH) {
    const cut = Math.max(1, Math.min(gw - 1, Math.floor(gw * ratio)));
    splitSlab(gx, gy, cut, gh, depth - 1);
    splitSlab(gx + cut, gy, gw - cut, gh, depth - 1);
  } else {
    const cut = Math.max(1, Math.min(gh - 1, Math.floor(gh * ratio)));
    splitSlab(gx, gy, gw, cut, depth - 1);
    splitSlab(gx, gy + cut, gw, gh - cut, depth - 1);
  }
};

if (p.symmetryMode === 'Quad') {
  splitSlab(0, 0, worldRadius, worldRadius, baseDepth + 1);
} else if (p.symmetryMode === 'Bilateral') {
  splitSlab(0, -worldRadius, worldRadius, worldRadius * 2, baseDepth + 1);
} else {
  splitSlab(-worldRadius, -worldRadius, worldRadius * 2, worldRadius * 2, baseDepth + 1);
}

// 2. Pre-calculate Elevation & High-Contrast Colors
const reliefFac = p.relief / 100;
const numCols = cols.length;

for (let i = 0; i < baseBlocks.length; i++) {
  const b = baseBlocks[i];
  const midX = b.gx + b.gw * 0.5;
  const midY = b.gy + b.gh * 0.5;

  const baseTerrain = noise2D((midX + seedShift) * 0.045, (midY + seedShift) * 0.045);
  const clusterBoost = Math.pow(Math.max(0, baseTerrain), 2.4) * 2.6;
  const jitter = ((hash(b.gx * 91 + globalSeed, b.gy * 53) - 0.5) * reliefFac);

  let hVal = (baseTerrain * 0.4 + 0.3 + clusterBoost + jitter) * p.ht * zoomFac;

  if (b.type === 1) {
    const rhythmMod = (b.laneWidth >= 3 ? 18 : (b.laneWidth === 2 ? 10 : 5)) * zoomFac;
    hVal = (hVal + (b.ribIdx % 2 === 0 ? rhythmMod : -rhythmMod * 0.6)) * (b.buildingJitter || 1.0);
    b.baseZ = 0;
  } else if (b.type === 2) {
    const adjustedH = hVal * (b.terraceJitter || 1.0);
    const tierH = Math.max(5 * zoomFac, (adjustedH * 0.5) / b.maxTiers);
    b.baseZ = b.tierIdx * tierH;
    hVal = (b.tierIdx + 1) * tierH;
  } else {
    if (b.heightMod) hVal *= b.heightMod;
    b.baseZ = 0;
  }

  b.h = Math.max(2.5 * zoomFac, hVal);

  const cellHash = Math.abs(Math.floor(hash(b.gx * 197 + globalSeed, b.gy * 283 + globalSeed) * 100000));
  const checker = (Math.abs(Math.floor(b.gx)) ^ Math.abs(Math.floor(b.gy))) & 1 ? 1 : 0;
  let cIdx = (cellHash + checker) % numCols;

  if (b.type === 1) {
    cIdx = (cIdx + b.ribIdx * 2 + Math.floor(b.gw + b.gh)) % numCols;
  } else if (b.type === 2) {
    const tierOffset = (b.tierIdx * 3) + ((b.clusterHash || 0) % numCols);
    cIdx = (cIdx + tierOffset) % numCols;
  }

  b.col = cols[cIdx];
  b.styleHash = cellHash;
}

// 3. Mirror Coordinates
const finalBlocks = [];
const sym = p.symmetryMode;

for (let i = 0; i < baseBlocks.length; i++) {
  const b = baseBlocks[i];
  finalBlocks.push({ gx: b.gx, gy: b.gy, gw: b.gw, gh: b.gh, h: b.h, baseZ: b.baseZ, col: b.col, styleHash: b.styleHash });

  if (sym === 'Bilateral') {
    finalBlocks.push({ gx: -b.gx - b.gw, gy: b.gy, gw: b.gw, gh: b.gh, h: b.h, baseZ: b.baseZ, col: b.col, styleHash: b.styleHash });
  } else if (sym === 'Quad') {
    finalBlocks.push({ gx: -b.gx - b.gw, gy: b.gy, gw: b.gw, gh: b.gh, h: b.h, baseZ: b.baseZ, col: b.col, styleHash: b.styleHash });
    finalBlocks.push({ gx: b.gx, gy: -b.gy - b.gh, gw: b.gw, gh: b.gh, h: b.h, baseZ: b.baseZ, col: b.col, styleHash: b.styleHash });
    finalBlocks.push({ gx: -b.gx - b.gw, gy: -b.gy - b.gh, gw: b.gw, gh: b.gh, h: b.h, baseZ: b.baseZ, col: b.col, styleHash: b.styleHash });
  }
}

// 4. Depth Sorting Key
for (let i = 0; i < finalBlocks.length; i++) {
  const b = finalBlocks[i];
  const bMidX = b.gx + b.gw * 0.5;
  const bMidY = b.gy + b.gh * 0.5;
  const rx = bMidX * cosA - bMidY * sinA;
  const ry = bMidX * sinA + bMidY * cosA;
  b.depthKey = (rx + ry) + (b.baseZ * 0.001);
}

finalBlocks.sort((a, b) => a.depthKey - b.depthKey);

// Fast Shading Cache
const shadeCache = {};
const getShaded = (hex, factor) => {
  const key = hex + factor;
  if (shadeCache[key]) return shadeCache[key];
  const num = parseInt(hex.slice(1), 16);
  const r = Math.floor(((num >> 16) & 255) * factor);
  const g = Math.floor(((num >> 8) & 255) * factor);
  const b = Math.floor((num & 255) * factor);
  const res = `rgb(${r},${g},${b})`;
  shadeCache[key] = res;
  return res;
};

const strokeColor = '#121417';
const outlineW = p.outlineWidth;
c.lineWidth = outlineW;
c.strokeStyle = strokeColor;

// Helper for rendering walls with optional hatching
const renderWall = (pAx, pAy, pBx, pBy, elevation, shadeFactor, sideType, styleHash) => {
  c.save();
  c.beginPath();
  c.moveTo(pAx, pAy - elevation);
  c.lineTo(pBx, pBy - elevation);
  c.lineTo(pBx, pBy);
  c.lineTo(pAx, pAy);
  c.closePath();

  if (!hasLinework) {
    c.fillStyle = getShaded(currentCol, shadeFactor);
    c.fill();
    if (outlineW > 0) c.stroke();
    c.restore();
    return;
  }

  // Linework logic
  const roll = (styleHash + sideType * 17) % 100;
  let doHorizontalStripes = false;
  let doBlackSolid = false;
  let doVerticalMullions = false;

  if (sideType === 1) {
    if (roll < 22) doBlackSolid = true;
    else if (roll < 88) doHorizontalStripes = true;
    else doVerticalMullions = true;
  } else if (sideType === 2) {
    if (roll < 12) doBlackSolid = true;
    else if (roll < 75) doHorizontalStripes = true;
  } else {
    if (roll < 55) doHorizontalStripes = true;
  }

  const wallBg = isInkOnly ? '#FFFFFF' : getShaded(currentCol, shadeFactor);

  if (doBlackSolid) {
    c.fillStyle = '#121417';
    c.fill();
  } else {
    c.fillStyle = wallBg;
    c.fill();
    c.clip();

    c.strokeStyle = '#121417';
    c.lineWidth = Math.max(0.6, outlineW * 0.8);

    if (doHorizontalStripes) {
      const step = Math.max(2.0, p.hatchDensity * zoomFac * 0.55);
      c.beginPath();
      for (let z = 0; z <= elevation; z += step) {
        c.moveTo(pAx, pAy - z);
        c.lineTo(pBx, pBy - z);
      }
      c.stroke();
    } else if (doVerticalMullions) {
      const dx = pBx - pAx;
      const dy = pBy - pAy;
      const wallLen = Math.hypot(dx, dy);
      const divisions = Math.max(1, Math.round(wallLen / (baseUnit * 0.25)));
      c.beginPath();
      for (let s = 1; s < divisions; s++) {
        const t = s / divisions;
        const lx = pAx + dx * t;
        const ly = pAy + dy * t;
        c.moveTo(lx, ly);
        c.lineTo(lx, ly - elevation);
      }
      c.stroke();
    }
  }

  c.restore();
  if (outlineW > 0) {
    c.strokeStyle = strokeColor;
    c.lineWidth = outlineW;
    c.beginPath();
    c.moveTo(pAx, pAy - elevation);
    c.lineTo(pBx, pBy - elevation);
    c.lineTo(pBx, pBy);
    c.lineTo(pAx, pAy);
    c.closePath();
    c.stroke();
  }
};

let currentCol = '#FFFFFF';

// 5. Per-Face Render Loop
for (let i = 0; i < finalBlocks.length; i++) {
  const b = finalBlocks[i];
  const elevation = b.h - b.baseZ;
  const bz = b.baseZ;
  currentCol = b.col;

  const xA = b.gx, yA = b.gy;
  const xB = b.gx + b.gw, yB = b.gy;
  const xC = b.gx + b.gw, yC = b.gy + b.gh;
  const xD = b.gx, yD = b.gy + b.gh;

  const rx0 = xA * cosA - yA * sinA, ry0 = xA * sinA + yA * cosA;
  const rx1 = xB * cosA - yB * sinA, ry1 = xB * sinA + yB * cosA;
  const rx2 = xC * cosA - yC * sinA, ry2 = xC * sinA + yC * cosA;
  const rx3 = xD * cosA - yD * sinA, ry3 = xD * sinA + yD * cosA;

  const p0x = cx + (rx0 - ry0) * halfTW, p0y = cy + (rx0 + ry0) * halfTH - bz;
  const p1x = cx + (rx1 - ry1) * halfTW, p1y = cy + (rx1 + ry1) * halfTH - bz;
  const p2x = cx + (rx2 - ry2) * halfTW, p2y = cy + (rx2 + ry2) * halfTH - bz;
  const p3x = cx + (rx3 - ry3) * halfTW, p3y = cy + (rx3 + ry3) * halfTH - bz;

  // Frustum Cull
  const minY = Math.min(p0y, p1y, p2y, p3y) - elevation;
  const maxY = Math.max(p0y, p1y, p2y, p3y);
  const minX = Math.min(p0x, p1x, p2x, p3x);
  const maxX = Math.max(p0x, p1x, p2x, p3x);

  if (maxY < -25 || minY > h + 25 || maxX < -25 || minX > w + 25) {
    continue;
  }

  // Extruded Walls
  if (elevation > 0) {
    if (p2x > p3x) renderWall(p3x, p3y, p2x, p2y, elevation, 0.72, 1, b.styleHash);
    if (p1x > p2x) renderWall(p2x, p2y, p1x, p1y, elevation, 0.52, 2, b.styleHash);
    if (p0x > p1x) renderWall(p1x, p1y, p0x, p0y, elevation, 0.62, 3, b.styleHash);
    if (p3x > p0x) renderWall(p0x, p0y, p3x, p3y, elevation, 0.82, 0, b.styleHash);
  }

  // Lit Roof Slab
  c.fillStyle = isInkOnly ? '#FFFFFF' : b.col;
  c.beginPath();
  c.moveTo(p0x, p0y - elevation);
  c.lineTo(p1x, p1y - elevation);
  c.lineTo(p2x, p2y - elevation);
  c.lineTo(p3x, p3y - elevation);
  c.closePath();
  c.fill();
  if (outlineW > 0) {
    c.strokeStyle = strokeColor;
    c.lineWidth = outlineW;
    c.stroke();
  }
}
  }
},
  
  hexCubes: {
    name: "Hexagon Cubes", group: "Geometric",
    params: {
      sc: { type: 'range', min: 5, max: 200, val: 30, label: "Hexagon Size" },
      st: { type: 'range', min: 0, max: 50, val: 1, label: "Outline Width" },
      fs: { type: 'range', min: 10, max: 100, val: 100, label: "Scale %" },
      gp: { type: 'range', min: 0, max: 20, val: 0, label: "Spacing Gap" }
    },
    render: (c, w, h, p, cols) => {
      const r = p.sc, hw = Math.sqrt(3) * r, hh = 2 * r;
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); c.lineJoin = 'round';
      for (let y = -hh; y < h + hh; y += hh * 0.75) {
        for (let x = -hw; x < w + hw; x += hw) {
          let cx = x;
          if (Math.round(y / (hh * 0.75)) % 2 !== 0) cx += hw / 2;
          let sw = hw * (p.fs / 100) - p.gp, sr = r * (p.fs / 100) - p.gp / 2;
          c.lineWidth = Math.max(1, p.st);
          c.fillStyle = pick(cols); c.strokeStyle = p.st > 0 ? bgColor : c.fillStyle;
          c.beginPath(); c.moveTo(cx, y); c.lineTo(cx + sw / 2, y - sr / 2); c.lineTo(cx, y - sr); c.lineTo(cx - sw / 2, y - sr / 2); c.fill(); if (p.st > 0) c.stroke();
          c.fillStyle = pick(cols); c.strokeStyle = p.st > 0 ? bgColor : c.fillStyle;
          c.beginPath(); c.moveTo(cx, y); c.lineTo(cx - sw / 2, y - sr / 2); c.lineTo(cx - sw / 2, y + sr / 2); c.lineTo(cx, y + sr); c.fill(); if (p.st > 0) c.stroke();
          c.fillStyle = pick(cols); c.strokeStyle = p.st > 0 ? bgColor : c.fillStyle;
          c.beginPath(); c.moveTo(cx, y); c.lineTo(cx + sw / 2, y - sr / 2); c.lineTo(cx + sw / 2, y + sr / 2); c.lineTo(cx, y + sr); c.fill(); if (p.st > 0) c.stroke();
        }
      }
    }
  },

  mondrian: {
    name: "Mondriaan", group: "Geometric",
    params: {
      d: { type: 'range', min: 1, max: 9, val: 5, label: "Grid Divisions" },
      lw: { type: 'range', min: 0, max: 50, val: 10, label: "Outline Width" },
      gp: { type: 'range', min: 0, max: 50, val: 0, label: "Margin Padding" },
      fp: { type: 'range', min: 0, max: 100, val: 30, label: "Color Fill %" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor;
      c.fillRect(0, 0, w, h);

      const rcs = [];
      const minSize = Math.max(16, (p.lw + p.gp) * 2);
      const maxDepth = Math.min(Math.floor(p.d), 9);

      const sub = (x, y, rw, rh, depth) => {
        if (depth <= 0 || rw < minSize * 2 || rh < minSize * 2 || (depth < maxDepth && random() > 0.88)) {
          rcs.push({ x, y, rw, rh });
          return;
        }

        const splitRatio = randomRange(0.28, 0.72);
        if (rw > rh) {
          const splitW = Math.floor(rw * splitRatio);
          sub(x, y, splitW, rh, depth - 1);
          sub(x + splitW, y, rw - splitW, rh, depth - 1);
        } else {
          const splitH = Math.floor(rh * splitRatio);
          sub(x, y, rw, splitH, depth - 1);
          sub(x, y + splitH, rw, rh - splitH, depth - 1);
        }
      };

      sub(0, 0, w, h, maxDepth);

      c.lineWidth = p.lw;
      const strokeCol = cols[0] || '#000000';
      c.strokeStyle = strokeCol;

      const fillPool = cols.length > 1 ? cols.slice(1) : cols;

      for (let i = 0; i < rcs.length; i++) {
        const r = rcs[i];
        const rx = r.x + p.gp;
        const ry = r.y + p.gp;
        const rw = r.rw - p.gp * 2;
        const rh = r.rh - p.gp * 2;

        if (rw > 0 && rh > 0) {
          const isFilled = random() * 100 < p.fp;
          c.fillStyle = isFilled ? pick(fillPool) : bgColor;
          c.fillRect(rx, ry, rw, rh);
          if (p.lw > 0) c.strokeRect(rx, ry, rw, rh);
        }
      }
    }
  },

  bauhaus: {
    name: "Bauhaus Studio", group: "Geometric",
    params: {
      n: { type: 'range', min: 5, max: 100, val: 30, label: "Shape Count" },
      sc: { type: 'range', min: 10, max: 300, val: 100, label: "Scale" },
      md: { type: 'select', options: ['mixed', 'circles', 'squares'], val: 'mixed', label: "Primary Motif" },
      opacity: { type: 'range', min: 10, max: 100, val: 100, label: "Opacity %" },
      outlineWidth: { type: 'range', min: 0, max: 50, val: 0, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); c.globalAlpha = p.opacity / 100;
      c.lineWidth = p.outlineWidth;
      c.strokeStyle = bgColor;
      for (let i = 0; i < p.n; i++) {
        let x = random() * w, y = random() * h, s = p.sc * randomRange(0.2, 1.5);
        let t = p.md === 'mixed' ? Math.floor(random() * 3) : (p.md === 'circles' ? Math.floor(random() * 2) : 2);
        c.fillStyle = pick(cols); c.beginPath();
        if (t === 0) { c.arc(x, y, s / 2, 0, Math.PI * 2); c.fill(); if (p.outlineWidth > 0) c.stroke(); }
        else if (t === 1) { c.arc(x, y, s / 2, 0, Math.PI); c.fill(); if (p.outlineWidth > 0) c.stroke(); }
        else { c.fillRect(x, y, s, s / 2); if (p.outlineWidth > 0) c.strokeRect(x, y, s, s / 2); }
      }
      c.globalAlpha = 1;
    }
  },

  delaunay: {
    name: "Geometric Web (Triangulation)", group: "Geometric",
    params: {
      n: { type: 'range', min: 10, max: 300, val: 50, label: "Vertices" },
      d: { type: 'range', min: 10, max: 500, val: 150, label: "Connection Distance" },
      st: { type: 'select', options: ['Fill', 'Wire'], val: 'Fill', label: "Polygon Style" },
      outlineWidth: { type: 'range', min: 0, max: 50, val: 1, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); const pts = [];
      for (let i = 0; i < p.n; i++) pts.push({ x: random() * w, y: random() * h });
      c.lineWidth = p.outlineWidth; c.strokeStyle = cols[0];
      for (let i = 0; i < p.n; i++) {
        for (let j = i + 1; j < p.n; j++) {
          for (let k = j + 1; k < p.n; k++) {
            const d1 = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
            const d2 = Math.hypot(pts[j].x - pts[k].x, pts[j].y - pts[k].y);
            const d3 = Math.hypot(pts[k].x - pts[i].x, pts[k].y - pts[i].y);
            if (d1 < p.d && d2 < p.d && d3 < p.d) {
              c.beginPath();
              c.moveTo(pts[i].x, pts[i].y);
              c.lineTo(pts[j].x, pts[j].y);
              c.lineTo(pts[k].x, pts[k].y);
              c.closePath();
              if (p.st === 'Fill') { c.fillStyle = pick(cols); c.fill(); }
              if (p.outlineWidth > 0) c.stroke();
            }
          }
        }
      }
    }
  },

circMaze: {
    name: "Labyrinth Maze", group: "Geometric",
    params: {
      sc: { type: 'range', min: 10, max: 100, val: 28, label: "Cell Spacing" },
      gp: { type: 'range', min: 0, max: 100, val: 15, label: "Path Openings %" },
      th: { type: 'range', min: 0.5, max: 50, val: 3, label: "Wall Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor;
      c.fillRect(0, 0, w, h);

      const cellSize = Math.max(8, Math.floor(p.sc));
      const colsCount = Math.ceil(w / cellSize) + 1;
      const rowsCount = Math.ceil(h / cellSize) + 1;

      c.lineWidth = p.th;
      c.lineCap = 'round';
      c.lineJoin = 'miter';

      const openThreshold = p.gp / 100;
      const wallBatches = Array.from({ length: cols.length }, () => []);

      // Generate authentic interconnected maze pathways
      for (let gy = 0; gy < rowsCount; gy++) {
        for (let gx = 0; gx < colsCount; gx++) {
          const x = gx * cellSize;
          const y = gy * cellSize;

          // Deterministic cell selection based on seed
          const seedVal = hash(gx * 137 + globalSeed, gy * 283 + globalSeed);
          const colorIdx = Math.abs(Math.floor(seedVal * 100000)) % cols.length;

          // Wall decisions: either carve South or carve East
          const carveSouth = (seedVal * 1000 % 100) > 50;
          const addLoop = random() < openThreshold;

          // Batch path segments instead of rendering individual stroke operations
          if (!carveSouth || addLoop) {
            // North-East / East wall boundary
            wallBatches[colorIdx].push({ x1: x, y1: y, x2: x + cellSize, y2: y });
          }
          if (carveSouth || addLoop) {
            // South / West wall boundary
            wallBatches[colorIdx].push({ x1: x, y1: y, x2: x, y2: y + cellSize });
          }
        }
      }

      // Single draw call per color for high FPS
      for (let k = 0; k < cols.length; k++) {
        const batch = wallBatches[k];
        if (!batch || batch.length === 0) continue;

        c.strokeStyle = cols[k];
        c.beginPath();
        for (let i = 0; i < batch.length; i++) {
          c.moveTo(batch[i].x1, batch[i].y1);
          c.lineTo(batch[i].x2, batch[i].y2);
        }
        c.stroke();
      }

      // Outer perimeter frame
      if (p.th > 0) {
        c.strokeStyle = cols[0];
        c.strokeRect(0, 0, w, h);
      }
    }
  },



voronoiStained: {
    name: "Stained Glass Cells", group: "Geometric",
    params: {
      n: { type: 'range', min: 10, max: 500, val: 50, label: "Cell Count" },
      outlineWidth: { type: 'range', min: 0, max: 50, val: 3, label: "Outline Width" },
      shd: { type: 'select', options: ['Off', 'Subtle Shade', 'Deep Bevel'], val: 'Subtle Shade', label: "Cell Shading" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h);
      const pts = [];
      for (let i = 0; i < p.n; i++) {
        pts.push({ x: random() * w, y: random() * h, c: pick(cols) });
      }

      const id = c.createImageData(w, h);
      const dt = id.data;
      const bgRGB = [parseInt(bgColor.slice(1,3),16), parseInt(bgColor.slice(3,5),16), parseInt(bgColor.slice(5,7),16)];

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let md = Infinity, md2 = Infinity, mp = pts[0];

          for (let i = 0; i < p.n; i++) {
            const d = (pts[i].x - x) ** 2 + (pts[i].y - y) ** 2;
            if (d < md) {
              md2 = md;
              md = d;
              mp = pts[i];
            } else if (d < md2) {
              md2 = d;
            }
          }

          const d1 = Math.sqrt(md);
          const d2 = Math.sqrt(md2);
          const borderDist = d2 - d1;
          const idx = (y * w + x) * 4;

          // Border lead line check
          if (p.outlineWidth > 0 && borderDist < p.outlineWidth) {
            dt[idx] = bgRGB[0] * 0.2;
            dt[idx + 1] = bgRGB[1] * 0.2;
            dt[idx + 2] = bgRGB[2] * 0.2;
            dt[idx + 3] = 255;
          } else {
            const hex = mp.c;
            const num = parseInt(hex.slice(1), 16);
            let r = (num >> 16) & 255;
            let g = (num >> 8) & 255;
            let b = num & 255;

            // Per-cell radial shading computed from cell centroid to cell boundary
            if (p.shd !== 'Off') {
              const cellRadius = d1 + borderDist;
              const normCenter = cellRadius > 0 ? (d1 / cellRadius) : 0;
              
              let shadeFactor;
              if (p.shd === 'Deep Bevel') {
                // Deep concave glass shard lighting
                shadeFactor = 1.15 - Math.pow(normCenter, 1.8) * 0.55;
              } else {
                // Subtle organic dome gradient
                shadeFactor = 1.08 - normCenter * 0.28;
              }

              r = Math.min(255, Math.max(0, r * shadeFactor));
              g = Math.min(255, Math.max(0, g * shadeFactor));
              b = Math.min(255, Math.max(0, b * shadeFactor));
            }

            dt[idx] = r;
            dt[idx + 1] = g;
            dt[idx + 2] = b;
            dt[idx + 3] = 255;
          }
        }
      }
      c.putImageData(id, 0, 0);
    }
  },

  concentricPolygons: {
    name: "Hypnotic Nesting Shapes", group: "Geometric",
    params: {
      sd: { type: 'range', min: 3, max: 12, val: 6, label: "Corner Count" },
      n: { type: 'range', min: 5, max: 80, val: 26, label: "Nested Rings" },
      rt: { type: 'range', min: 0, max: 90, val: 6, label: "Angle Step" },
      sc: { type: 'range', min: 20, max: 98, val: 91, label: "Inward Scale %" },
      outlineWidth: { type: 'range', min: 0, max: 50, val: 2, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); c.translate(w / 2, h / 2);
      let r = Math.hypot(w, h) / 1.8;
      const initialRot = (hash(globalSeed, 9) * 360) * Math.PI / 180;
      c.rotate(initialRot);
      for (let i = 0; i < p.n; i++) {
        c.beginPath();
        for (let s = 0; s <= p.sd; s++) {
          let a = s * (Math.PI * 2 / p.sd);
          let nx = r * Math.cos(a), ny = r * Math.sin(a);
          if (s === 0) c.moveTo(nx, ny); else c.lineTo(nx, ny);
        }
        c.fillStyle = cols[i % cols.length]; c.fill();
        if (p.outlineWidth > 0) {
          c.strokeStyle = bgColor; c.lineWidth = p.outlineWidth; c.stroke();
        }
        r *= p.sc / 100; c.rotate(p.rt * Math.PI / 180);
      }
      c.rotate(-initialRot);
      c.translate(-w / 2, -h / 2);
    }
  },

  kaleidoscope: {
    name: "Kaleidoscope Mandala", group: "Geometric",
    params: {
      f: { type: 'range', min: 2, max: 64, val: 12, label: "Mirror Folds" },
      d: { type: 'range', min: 10, max: 5000, val: 600, label: "Ornament Density" },
      st: { type: 'select', options: ['organic', 'geometric', 'orbital'], val: 'organic', label: "Ornament Style" },
      hl: { type: 'range', min: 0, max: 100, val: 0, label: "Center Hole %" },
      rad: { type: 'range', min: 50, max: 200, val: 120, label: "Radius %" },
      outlineWidth: { type: 'range', min: 0.5, max: 50, val: 3, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      const fl = p.f % 2 !== 0 ? p.f + 1 : p.f, wa = Math.PI * 2 / fl, r = Math.sqrt(w * w + h * h) * (p.rad / 100);
      const sb = document.createElement('canvas'); sb.width = r; sb.height = r;
      const sx = sb.getContext('2d', { willReadFrequently: true, colorSpace: "srgb" });
      sx.fillStyle = bgColor; sx.fillRect(0, 0, r, r); sx.lineCap = 'round'; sx.lineJoin = 'round';
      for (let i = 0; i < p.d; i++) {
        sx.fillStyle = pick(cols); sx.strokeStyle = pick(cols); sx.lineWidth = randomRange(0.5, p.outlineWidth); sx.globalAlpha = randomRange(0.4, 1);
        const rd = randomRange(r * (p.hl / 100), r), th = randomRange(-0.1, wa + 0.1), px = Math.cos(th) * rd, py = Math.sin(th) * rd, sz = randomRange(5, p.outlineWidth * 15);
        sx.save(); sx.translate(px, py); sx.rotate(random() * Math.PI * 2);
        if (p.st === 'geometric') {
          if (random() > 0.5) sx.fillRect(-sz / 2, -sz / 2, sz, sz); else { sx.beginPath(); sx.arc(0, 0, sz / 2, 0, Math.PI * 2); sx.fill(); }
          if (random() > 0.5 && p.outlineWidth > 0) sx.strokeRect(-sz / 2, -sz / 2, sz * 1.4, sz * 1.4);
        } else if (p.st === 'organic') {
          sx.beginPath(); sx.moveTo(-sz, 0); sx.quadraticCurveTo(0, sz * 1.5, sz, 0); sx.quadraticCurveTo(0, -sz * 0.5, -sz, 0); sx.fill();
          if (random() > 0.3 && p.outlineWidth > 0) { sx.beginPath(); sx.moveTo(0, 0); sx.lineTo(sz * 2, randomRange(-sz, sz)); sx.stroke(); }
        } else {
          sx.beginPath(); sx.arc(0, 0, sz, 0, randomRange(Math.PI / 2, Math.PI * 1.5)); if (p.outlineWidth > 0) sx.stroke();
          if (random() > 0.8) { sx.beginPath(); sx.arc(sz, 0, sz / 4, 0, Math.PI * 2); sx.fill(); }
        }
        sx.restore();
      }
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); c.translate(w / 2, h / 2);
      for (let f = 0; f < fl; f++) {
        c.save(); c.rotate(f * wa); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, -0.01, wa + 0.01); c.clip();
        if (f % 2 === 1) { c.scale(1, -1); c.rotate(-wa); }
        c.drawImage(sb, 0, 0); c.restore();
      }
      c.translate(-w / 2, -h / 2);
    }
  },

  polarPoints: {
    name: "Harmonic Polar Array", group: "Geometric",
    params: {
      den: { type: 'range', min: 100, max: 50000, val: 4000, label: "Dot Density" },
      a: { type: 'range', min: 1, max: 1000, val: 120, label: "Wave Intensity" },
      f: { type: 'range', min: 1, max: 200, val: 10, label: "Rhythm" },
      tw: { type: 'range', min: 0, max: 360, val: 0, label: "Vortex Twist" },
      sz: { type: 'range', min: 1, max: 20, val: 2, label: "Dot Radius" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h);
      const cw = Math.floor(Math.sqrt(p.den)), ch = cw, sx = w / cw, sy = h / ch, f = p.f / 1000;
      for (let r = 0; r <= ch; r++) {
        for (let cl = 0; cl <= cw; cl++) {
          let x = cl * sx, y = r * sy, nx = x + Math.sin(y * f) * p.a, ny = y + Math.cos(x * f) * p.a;
          if (p.tw > 0) {
            let cx = w / 2, cy = h / 2, ang = Math.atan2(ny - cy, nx - cx) + (p.tw * Math.PI / 180) * (Math.hypot(nx - cx, ny - cy) / w);
            let d = Math.hypot(nx - cx, ny - cy);
            nx = cx + Math.cos(ang) * d; ny = cy + Math.sin(ang) * d;
          }
          c.beginPath(); c.arc(nx, ny, randomRange(1, Math.max(2, p.sz)), 0, Math.PI * 2); c.fillStyle = pick(cols); c.fill();
        }
      }
    }
  },

  truchetGrid: {
    name: "Labyrinth Curves (Truchet)", group: "Patterns",
    params: {
      s: { type: 'range', min: 10, max: 200, val: 50, label: "Tile Size" },
      t: { type: 'range', min: 0.5, max: 50, val: 12, label: "Outline Width" },
      st: { type: 'select', options: ['arcs', 'diagonals', 'mixed'], val: 'arcs', label: "Joint Shape" },
      bg: { type: 'select', options: ['Transparent', 'Solid', 'Split'], val: 'Transparent', label: "Backing Fill" },
      seg: { type: 'select', options: ['Off', 'On'], val: 'On', label: "Segment Colors" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); c.lineCap = 'round'; const s = p.s;
      for (let y = 0; y < h; y += s) {
        for (let x = 0; x < w; x += s) {
          const f = random() > 0.5, cB = pick(cols), cA = pick(cols);
          if (p.bg === 'Solid') { c.fillStyle = cB; c.fillRect(x, y, s + 1, s + 1); }
          else if (p.bg === 'Split') {
            c.fillStyle = cB; c.beginPath(); c.moveTo(x, y); f ? c.lineTo(x + s, y) : c.lineTo(x + s, y + s); f ? c.lineTo(x, y + s) : c.lineTo(x, y + s); c.fill();
            c.fillStyle = cA; c.beginPath(); c.moveTo(x + s, y + s); f ? c.lineTo(x + s, y) : c.lineTo(x, y); f ? c.lineTo(x, y + s) : c.lineTo(x + s, y); c.fill();
          }
          c.lineWidth = p.t; const typ = p.st === 'mixed' ? (random() > 0.5 ? 'arcs' : 'diagonals') : p.st;
          let lc1 = pick(cols), lc2 = p.seg === 'On' ? pick(cols) : lc1; c.beginPath(); c.strokeStyle = lc1;
          if (typ === 'diagonals') {
            f ? (c.moveTo(x, y), c.lineTo(x + s, y + s)) : (c.moveTo(x + s, y), c.lineTo(x, y + s)); c.stroke();
          } else {
            f ? (c.arc(x, y, s / 2, 0, Math.PI / 2), c.stroke(), c.beginPath(), c.strokeStyle = lc2, c.arc(x + s, y + s, s / 2, Math.PI, Math.PI * 1.5)) :
                (c.arc(x + s, y, s / 2, Math.PI / 2, Math.PI), c.stroke(), c.beginPath(), c.strokeStyle = lc2, c.arc(x, y + s, s / 2, Math.PI * 1.5, Math.PI * 2));
            c.stroke();
          }
        }
      }
    }
  },

  symmPixelArt: {
    name: "Retro Pixel Tapestry", group: "Patterns",
    params: {
      grid: { type: 'range', min: 10, max: 300, val: 80, label: "Pixel Density" },
      comp: { type: 'range', min: 1, max: 100, val: 25, label: "Cluster Spread" },
      th: { type: 'range', min: 1, max: 100, val: 20, label: "Coverage %" },
      dot: { type: 'range', min: 10, max: 100, val: 40, label: "Dot Centers" },
      inv: { type: 'select', options: ['No', 'Yes'], val: 'No', label: "Invert Colors" }
    },
    render: (c, w, h, p, cols) => {
      let ca = p.inv === 'Yes' ? [...cols].reverse() : cols; c.fillStyle = bgColor; c.fillRect(0, 0, w, h);
      const s = Math.max(2, Math.floor(Math.min(w, h) / p.grid)), cw = Math.ceil(w / s), ch = Math.ceil(h / s);
      const seedShift = Math.floor(random() * 50);
      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
          let n = noise2D((x + seedShift) * (p.comp / 100), (y + seedShift) * (p.comp / 100)), r = (x ^ y ^ globalSeed) % (p.comp / 5 | 1);
          if (n > p.th / 100 || r === 0) {
            c.fillStyle = ca[Math.floor(Math.abs(n * 15) + r) % ca.length];
            c.fillRect(x * s, y * s, s + 1, s + 1);
            if (n > p.th / 100 + 0.2 && s > 6 && x % 2 === 0) {
              c.fillStyle = bgColor; let ds = s * (p.dot / 100);
              c.fillRect(x * s + (s - ds) / 2, y * s + (s - ds) / 2, ds, ds);
            }
          }
        }
      }
    }
  },

  hexGrid: {
    name: "Hexagonal Lattice", group: "Patterns",
    params: {
      s: { type: 'range', min: 5, max: 100, val: 20, label: "Hexagon Radius" },
      th: { type: 'range', min: 0, max: 50, val: 1, label: "Outline Width" },
      md: { type: 'select', options: ['Solid', 'Hollow'], val: 'Solid', label: "Fill Mode" },
      gp: { type: 'range', min: 0, max: 20, val: 0, label: "Spacing Gap" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); const r = p.s, hw = Math.sqrt(3) * r, hh = 2 * r; c.lineWidth = p.th;
      for (let y = -hh; y < h + hh; y += hh * 0.75) {
        for (let x = -hw; x < w + hw; x += hw) {
          let cx = x;
          if (Math.round(y / (hh * 0.75)) % 2 !== 0) cx += hw / 2;
          c.beginPath();
          for (let i = 0; i < 6; i++) {
            let a = Math.PI / 180 * (60 * i + 30);
            let nx = cx + (r - p.gp) * Math.cos(a), ny = y + (r - p.gp) * Math.sin(a);
            if (i === 0) c.moveTo(nx, ny); else c.lineTo(nx, ny);
          }
          c.closePath();
          c.fillStyle = cols[Math.abs(Math.floor(hash(x + globalSeed, y + globalSeed) * 1000)) % cols.length];
          c.strokeStyle = bgColor;
          if (p.md === 'Solid') c.fill();
          if (p.th > 0) c.stroke();
        }
      }
    }
  },

  halftone: {
    name: "Print Screen Halftone", group: "Patterns",
    params: {
      sc: { type: 'range', min: 5, max: 100, val: 20, label: "Dot Diameter" },
      angle: { type: 'range', min: 0, max: 360, val: 15, label: "Screen Angle" },
      t: { type: 'select', options: ['circles', 'squares'], val: 'circles', label: "Dot Shape" },
      nv: { type: 'range', min: 1, max: 200, val: 100, label: "Wave Frequency" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); const r = p.angle * Math.PI / 180, d = Math.hypot(w, h) * 1.5;
      const ox = hash(globalSeed, 5) * 500, oy = hash(globalSeed, 6) * 500;
      c.save(); c.translate(w / 2, h / 2); c.rotate(r); c.translate(-d / 2, -d / 2);
      for (let y = 0; y < d; y += p.sc) {
        for (let x = 0; x < d; x += p.sc) {
          let n = noise2D((x + ox) / (p.nv * 2), (y + oy) / (p.nv * 2)) * 0.5 + 0.5;
          let ci = Math.floor((n + noise2D((x + ox) / 50, (y + oy) / 50) * 0.5) * cols.length) % cols.length;
          if (ci < 0) ci += cols.length;
          c.fillStyle = cols[ci];
          if (p.t === 'circles') {
            c.beginPath(); c.arc(x, y, (p.sc / 2) * n, 0, Math.PI * 2); c.fill();
          } else {
            let sz = p.sc * n; c.fillRect(x - sz / 2, y - sz / 2, sz, sz);
          }
        }
      }
      c.restore();
    }
  },

  unifiedFlow: {
    name: "Flow Field Streamlines", group: "Linear Geometry",
    params: {
      den: { type: 'range', min: 100, max: 20000, val: 3000, label: "Particle Stream" },
      th: { type: 'range', min: 0.1, max: 50, val: 2, label: "Outline Width" },
      sc: { type: 'range', min: 1, max: 500, val: 50, label: "Turbulence" },
      len: { type: 'range', min: 10, max: 500, val: 120, label: "Stream Length" },
      crv: { type: 'range', min: 0.1, max: 20, val: 5, label: "Curvature" },
      opacity: { type: 'range', min: 10, max: 100, val: 80, label: "Opacity %" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); c.lineCap = 'round'; c.lineJoin = 'round';
      const ns = p.sc / 10000, cm = p.crv * Math.PI;
      for (let i = 0; i < p.den; i++) {
        let x = random() * w, y = random() * h;
        c.beginPath(); c.moveTo(x, y);
        c.strokeStyle = pick(cols);
        c.globalAlpha = p.opacity / 100;
        c.lineWidth = randomRange(0.1, p.th);
        let l = p.len * randomRange(0.5, 1.5);
        for (let s = 0; s < l; s++) {
          let n1 = noise2D(x * ns, y * ns), n2 = noise2D(x * ns * 2.5, y * ns * 2.5) * 0.5, a = (n1 + n2) * cm;
          x += Math.cos(a) * 1.5; y += Math.sin(a) * 1.5;
          c.lineTo(x, y);
        }
        c.stroke();
      }
      c.globalAlpha = 1;
    }
  },

  opArt: {
    name: "Op-Art Illusions", group: "Linear Geometry",
    params: {
      style: { type: 'select', options: ['Concentric Ripples', 'Directional Waves', 'Radial Rays'], val: 'Concentric Ripples', label: "Pattern Style" },
      angle: { type: 'range', min: 0, max: 360, val: 0, label: "Wave Angle" },
      freq: { type: 'range', min: 2, max: 80, val: 16, label: "Line Density" },
      warp: { type: 'range', min: 5, max: 300, val: 65, label: "Distortion" },
      outlineWidth: { type: 'range', min: 0.5, max: 50, val: 3, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); c.lineWidth = p.outlineWidth;
      const cx = w / 2, cy = h / 2;
      const seedPhase = (random() * Math.PI * 2);
      if (p.style === 'Concentric Ripples') {
        const maxR = Math.hypot(w, h);
        for (let r = p.freq; r < maxR; r += p.freq) {
          c.beginPath(); c.strokeStyle = cols[Math.floor(r / p.freq) % cols.length];
          for (let i = 0; i <= 180; i++) {
            const a = (i / 180) * Math.PI * 2;
            const wave = Math.sin(a * 6 + r * 0.05 + seedPhase) * (p.warp * 0.5);
            const currentR = Math.max(0, r + wave);
            const x = cx + Math.cos(a) * currentR, y = cy + Math.sin(a) * currentR;
            if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
          }
          c.closePath(); c.stroke();
        }
      } else if (p.style === 'Directional Waves') {
        const rad = p.angle * Math.PI / 180;
        const diag = Math.hypot(w, h) * 1.5;
        c.save();
        c.translate(cx, cy);
        c.rotate(rad);
        c.translate(-diag / 2, -diag / 2);
        for (let y = 0; y < diag; y += p.freq) {
          c.beginPath(); c.strokeStyle = cols[Math.floor(y / p.freq) % cols.length];
          for (let x = 0; x <= diag; x += 10) {
            const dist = Math.hypot(x - diag / 2, y - diag / 2);
            const oy = y + Math.sin(dist / (p.warp || 1) + seedPhase) * 18;
            if (x === 0) c.moveTo(x, oy); else c.lineTo(x, oy);
          }
          c.stroke();
        }
        c.restore();
      } else {
        const rays = Math.floor(p.freq * 2);
        for (let i = 0; i < rays; i++) {
          const a = (i / rays) * Math.PI * 2 + seedPhase + (p.angle * Math.PI / 180);
          c.strokeStyle = cols[i % cols.length];
          c.beginPath(); c.moveTo(cx, cy);
          const maxDist = Math.hypot(w, h);
          const endX = cx + Math.cos(a + Math.sin(maxDist / p.warp) * 0.5) * maxDist;
          const endY = cy + Math.sin(a + Math.sin(maxDist / p.warp) * 0.5) * maxDist;
          c.lineTo(endX, endY); c.stroke();
        }
      }
    }
  },

  spirograph: {
    name: "Geometric Wheel (Spirograph)", group: "Linear Geometry",
    params: {
      loops: { type: 'range', min: 1, max: 12, val: 4, label: "Ring Sets" },
      R: { type: 'range', min: 40, max: 500, val: 160, label: "Base Radius" },
      r: { type: 'range', min: 5, max: 300, val: 68, label: "Wheel Gear" },
      d: { type: 'range', min: 10, max: 400, val: 110, label: "Pen Reach" },
      outlineWidth: { type: 'range', min: 0.5, max: 50, val: 1.5, label: "Outline Width" },
      angle: { type: 'range', min: 0, max: 360, val: 0, label: "Wheel Rotation" },
      fillCanvas: { type: 'select', options: ['Yes', 'No'], val: 'Yes', label: "Fill Entire Canvas" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); c.lineWidth = p.outlineWidth;
      const loopCount = Math.floor(p.loops);
      const maxDim = Math.min(w, h) * 0.48;
      const seedRot = randomRange(0, 360);
      for (let k = 0; k < loopCount; k++) {
        c.save(); c.translate(w / 2, h / 2);
        c.rotate((k * (360 / loopCount) + seedRot + p.angle) * Math.PI / 180);
        const scaleMultiplier = p.fillCanvas === 'Yes' ? (0.4 + (k / loopCount) * 0.8) : (1 + k * 0.15);
        const curR = (p.R * scaleMultiplier) % maxDim + 30;
        const curr = Math.max(2, p.r * (1 + k * 0.1));
        const curd = p.d * (1 + k * 0.2);
        c.strokeStyle = cols[k % cols.length];
        c.beginPath();
        for (let th = 0; th < Math.PI * 30; th += 0.04) {
          const x = (curR - curr) * Math.cos(th) + curd * Math.cos((curR - curr) / curr * th);
          const y = (curR - curr) * Math.sin(th) - curd * Math.sin((curR - curr) / curr * th);
          if (th === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke(); c.restore();
      }
    }
  },

  radialBurst: {
    name: "Radial Light Burst", group: "Linear Geometry",
    params: {
      n: { type: 'range', min: 10, max: 1000, val: 200, label: "Ray Count" },
      r1: { type: 'range', min: 0, max: 100, val: 10, label: "Center Core %" },
      r2: { type: 'range', min: 10, max: 200, val: 100, label: "Outer Edge %" },
      outlineWidth: { type: 'range', min: 0.5, max: 50, val: 2, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); c.translate(w / 2, h / 2);
      c.lineWidth = p.outlineWidth; c.lineCap = 'round'; const d = Math.min(w, h);
      for (let i = 0; i < p.n; i++) {
        c.beginPath(); c.strokeStyle = pick(cols);
        let a = random() * Math.PI * 2, ir = d * (p.r1 / 100), or = d * (p.r2 / 100) * randomRange(0.5, 1.5);
        c.moveTo(Math.cos(a) * ir, Math.sin(a) * ir);
        c.lineTo(Math.cos(a) * or, Math.sin(a) * or);
        c.stroke();
      }
      c.translate(-w / 2, -h / 2);
    }
  },

  constellation: {
    name: "Constellation Web", group: "Particles",
    params: {
      n: { type: 'range', min: 50, max: 3000, val: 400, label: "Node Stars" },
      d: { type: 'range', min: 10, max: 500, val: 100, label: "Connection Distance" },
      s: { type: 'range', min: 1, max: 30, val: 5, label: "Node Size" },
      crv: { type: 'range', min: 0, max: 100, val: 0, label: "Curved Threads" },
      outlineWidth: { type: 'range', min: 0.2, max: 50, val: 2, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); const pts = [];
      for (let i = 0; i < p.n; i++) pts.push({ x: randomRange(-50, w + 50), y: randomRange(-50, h + 50), r: randomRange(1, p.s), c: pick(cols) });
      c.lineCap = 'round';
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const ds = (pts[i].x - pts[j].x) ** 2 + (pts[i].y - pts[j].y) ** 2;
          if (ds < p.d * p.d) {
            c.strokeStyle = pts[i].c; c.globalAlpha = (1 - Math.sqrt(ds) / p.d) ** 2 * 0.8;
            c.lineWidth = randomRange(0.2, p.outlineWidth); c.beginPath(); c.moveTo(pts[i].x, pts[i].y);
            if (p.crv > 0) c.quadraticCurveTo((pts[i].x + pts[j].x) / 2 + randomRange(-p.crv, p.crv), (pts[i].y + pts[j].y) / 2 + randomRange(-p.crv, p.crv), pts[j].x, pts[j].y);
            else c.lineTo(pts[j].x, pts[j].y);
            c.stroke();
          }
        }
      }
      c.globalAlpha = 1;
      pts.forEach(pt => { c.fillStyle = pt.c; c.beginPath(); c.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); c.fill(); });
    }
  },

  vortexBlocks: {
    name: "Vortex Ribbon Blocks", group: "Particles",
    params: {
      den: { type: 'range', min: 10, max: 5000, val: 200, label: "Block Count" },
      sc: { type: 'range', min: 1, max: 500, val: 50, label: "Swirl Noise" },
      len: { type: 'range', min: 5, max: 300, val: 30, label: "Block Size" },
      rot: { type: 'range', min: 1, max: 100, val: 40, label: "Twist Steps" },
      opacity: { type: 'range', min: 10, max: 100, val: 100, label: "Opacity %" },
      outlineWidth: { type: 'range', min: 0, max: 50, val: 1, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); const ns = p.sc / 10000;
      c.globalAlpha = p.opacity / 100;
      for (let i = 0; i < p.den; i++) {
        let x = random() * w, y = random() * h, col = pick(cols);
        for (let s = 0; s < p.rot; s++) {
          let n = noise2D(x * ns, y * ns) * Math.PI * 4;
          x += Math.cos(n) * p.len * 1.5; y += Math.sin(n) * p.len * 1.5;
          c.save(); c.translate(x, y); c.rotate(n);
          c.fillStyle = col; c.strokeStyle = col; c.lineWidth = p.outlineWidth;
          c.fillRect(0, -p.len / 4, p.len, p.len / 2); 
          if (p.outlineWidth > 0) c.strokeRect(0, -p.len / 4, p.len, p.len / 2);
          c.restore();
        }
      }
      c.globalAlpha = 1;
    }
  },

  flowField: {
    name: "Flow Field Particles", group: "Particles",
    params: {
      n: { type: 'range', min: 100, max: 20000, val: 2000, label: "Particle Dust" },
      sc: { type: 'range', min: 1, max: 500, val: 50, label: "Turbulence" },
      ln: { type: 'range', min: 10, max: 200, val: 50, label: "Path Trace" },
      th: { type: 'range', min: 1, max: 50, val: 1.5, label: "Particle Size" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); const ns = p.sc / 10000;
      for (let i = 0; i < p.n; i++) {
        let x = random() * w, y = random() * h; c.fillStyle = pick(cols);
        for (let s = 0; s < p.ln; s++) {
          let a = noise2D(x * ns, y * ns) * Math.PI * 4;
          x += Math.cos(a) * 2; y += Math.sin(a) * 2;
          c.fillRect(x, y, p.th, p.th);
        }
      }
    }
  },

  webglFractal: {
    name: "Fractal Nebula (Julia)", group: "Mathematical",
    params: {
      zoom: { type: 'range', min: 1, max: 500, val: 20, label: "Fractal Zoom" },
      cx: { type: 'range', min: -100, max: 100, val: -40, label: "Morph Center X" },
      cy: { type: 'range', min: -100, max: 100, val: 60, label: "Morph Center Y" },
      iter: { type: 'range', min: 10, max: 1000, val: 150, label: "Detail Steps" }
    },
    render: (c, w, h, p, cols) => {
      const hx2rgb = (h) => { let n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
      let fs = `precision highp float; uniform vec2 res; uniform float zoom, cx, cy, iter; uniform vec3 bg, c1, c2;
        void main(){ vec2 z = (gl_FragCoord.xy - res/2.0) / min(res.x, res.y) * (10.0/zoom); float i=0.0;
        for(int j=0; j<1000; j++){ if(float(j)>iter || dot(z,z)>16.0) break; z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + vec2(cx,cy); i++; }
        float t = i/iter; vec3 col = mix(bg, mix(c1, c2, t*2.0), smoothstep(0.0, 1.0, t*1.5)); if(i>=iter) col = bg; gl_FragColor = vec4(col,1.0); }`;
      runShader(c, w, h, fs, { zoom: p.zoom, cx: p.cx / 100, cy: p.cy / 100, iter: p.iter, bg: hx2rgb(bgColor), c1: hx2rgb(cols[0]), c2: hx2rgb(cols[Math.min(1, cols.length - 1)]) });
    }
  },

  clifford: {
    name: "Chaos Particle Attractor", group: "Mathematical",
    params: {
      iter: { type: 'range', min: 10, max: 1000, val: 200, label: "Particle Points (K)" },
      a: { type: 'range', min: -30, max: 30, val: 15, label: "Orbit Parameter A" },
      b: { type: 'range', min: -30, max: 30, val: -17, label: "Orbit Parameter B" },
      c: { type: 'range', min: -30, max: 30, val: 17, label: "Orbit Parameter C" },
      d: { type: 'range', min: -30, max: 30, val: 14, label: "Orbit Parameter D" },
      sc: { type: 'range', min: 10, max: 100, val: 20, label: "Orbit Scale %" },
      opacity: { type: 'range', min: 1, max: 100, val: 10, label: "Opacity %" }
    },
    render: (ctx, w, h, p, cols) => {
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, w, h);
      let x = 0, y = 0, a = p.a / 10, b = p.b / 10, c = p.c / 10, d = p.d / 10;
      const sc = Math.min(w, h) * (p.sc / 100); ctx.fillStyle = cols[0]; ctx.globalAlpha = p.opacity / 100;
      for (let i = 0; i < p.iter * 1000; i++) {
        let xn = Math.sin(a * y) + c * Math.cos(a * x), yn = Math.sin(b * x) + d * Math.cos(b * y);
        x = xn; y = yn;
        ctx.fillRect(w / 2 + x * sc, h / 2 + y * sc, 1.5, 1.5);
        if (i % (p.iter * 200) === 0) ctx.fillStyle = pick(cols);
      }
      ctx.globalAlpha = 1;
    }
  },

  harmonograph: {
    name: "Pendulum Resonance (Harmonograph)", group: "Mathematical",
    params: {
      f1: { type: 'range', min: 1, max: 100, val: 39, label: "Rhythm 1" },
      f2: { type: 'range', min: 1, max: 100, val: 40, label: "Rhythm 2" },
      f3: { type: 'range', min: 1, max: 100, val: 40, label: "Rhythm 3" },
      f4: { type: 'range', min: 1, max: 100, val: 39, label: "Rhythm 4" },
      dp: { type: 'range', min: 1, max: 100, val: 5, label: "Friction Decay" },
      st: { type: 'range', min: 10, max: 500, val: 200, label: "Cycles" },
      outlineWidth: { type: 'range', min: 0.1, max: 50, val: 0.5, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); c.strokeStyle = cols[0]; c.lineWidth = p.outlineWidth;
      c.beginPath(); const sc = Math.min(w, h) * 0.4;
      let p1 = random() * Math.PI, p2 = random() * Math.PI, p3 = random() * Math.PI, p4 = random() * Math.PI, d = p.dp / 10000;
      for (let t = 0; t < p.st; t += 0.01) {
        let x = sc * Math.exp(-d * t) * Math.sin(t * p.f1 / 10 + p1) + sc * Math.exp(-d * t) * Math.sin(t * p.f2 / 10 + p2);
        let y = sc * Math.exp(-d * t) * Math.sin(t * p.f3 / 10 + p3) + sc * Math.exp(-d * t) * Math.sin(t * p.f4 / 10 + p4);
        if (t === 0) c.moveTo(w / 2 + x, h / 2 + y); else c.lineTo(w / 2 + x, h / 2 + y);
      }
      c.stroke();
    }
  },

  superformula: {
    name: "Geometric Flora & Blooms", group: "Mathematical",
    params: {
      flowers: { type: 'range', min: 1, max: 12, val: 1, label: "Flower Count" },
      layout: { type: 'select', options: ['Center Layered', 'Random Meadow', 'Circular Garden', 'Grid'], val: 'Center Layered', label: "Flower Layout" },
      count: { type: 'range', min: 1, max: 16, val: 5, label: "Layers per Flower" },
      m: { type: 'range', min: 1, max: 32, val: 6, label: "Petal Symmetry" },
      n1: { type: 'range', min: 0.1, max: 10, val: 1.2, label: "Roundness" },
      n2: { type: 'range', min: 0.1, max: 10, val: 1.0, label: "Pinch Form" },
      sc: { type: 'range', min: 10, max: 200, val: 50, label: "Bloom Size" },
      angle: { type: 'range', min: 0, max: 360, val: 0, label: "Angle" },
      rotationStep: { type: 'range', min: 0, max: 90, val: 15, label: "Layer Twist" },
      spread: { type: 'range', min: 0, max: 150, val: 20, label: "Layer Shift" },
      outlineWidth: { type: 'range', min: 0, max: 50, val: 1.5, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h);
      const flowerCount = Math.floor(p.flowers);
      const layers = Math.floor(p.count);
      const seedRot = randomRange(0, 360) + p.angle;

      const flowerCenters = [];
      if (p.layout === 'Center Layered' || flowerCount === 1) {
        for (let f = 0; f < flowerCount; f++) {
          const ang = (f / flowerCount) * Math.PI * 2 + (seedRot * Math.PI / 180);
          const rad = f === 0 ? 0 : Math.min(w, h) * 0.25;
          flowerCenters.push({ x: w / 2 + Math.cos(ang) * rad, y: h / 2 + Math.sin(ang) * rad, scaleMult: f === 0 ? 1.0 : 0.65 });
        }
      } else if (p.layout === 'Circular Garden') {
        for (let f = 0; f < flowerCount; f++) {
          const ang = (f / flowerCount) * Math.PI * 2 + (seedRot * Math.PI / 180);
          const rad = Math.min(w, h) * 0.32;
          flowerCenters.push({ x: w / 2 + Math.cos(ang) * rad, y: h / 2 + Math.sin(ang) * rad, scaleMult: 0.6 });
        }
      } else if (p.layout === 'Grid') {
        const colsGrid = Math.ceil(Math.sqrt(flowerCount));
        const rowsGrid = Math.ceil(flowerCount / colsGrid);
        for (let f = 0; f < flowerCount; f++) {
          const gx = f % colsGrid;
          const gy = Math.floor(f / colsGrid);
          flowerCenters.push({
            x: ((gx + 1) / (colsGrid + 1)) * w,
            y: ((gy + 1) / (rowsGrid + 1)) * h,
            scaleMult: 0.85 / Math.max(colsGrid, rowsGrid)
          });
        }
      } else {
        for (let f = 0; f < flowerCount; f++) {
          flowerCenters.push({
            x: randomRange(w * 0.15, w * 0.85),
            y: randomRange(h * 0.15, h * 0.85),
            scaleMult: randomRange(0.4, 0.8)
          });
        }
      }

      flowerCenters.forEach((fc, fIdx) => {
        for (let i = 0; i < layers; i++) {
          c.save();
          const angleOffset = (i * p.rotationStep + fIdx * 25 + seedRot) * Math.PI / 180;
          const spreadDist = i * p.spread * 0.4;
          const ox = Math.cos(angleOffset) * spreadDist;
          const oy = Math.sin(angleOffset) * spreadDist;

          c.translate(fc.x + ox, fc.y + oy);
          c.rotate(angleOffset);

          const sizeFactor = 1 - (i / (layers + 1)) * 0.75;
          const baseScale = Math.min(w, h) * (p.sc / 100) * fc.scaleMult * sizeFactor;

          c.beginPath();
          const mm = p.m + (i % 2);
          const nn1 = Math.max(0.1, p.n1);
          const nn2 = Math.max(0.1, p.n2);

          for (let th = 0; th <= Math.PI * 2; th += 0.015) {
            const part1 = Math.pow(Math.abs(Math.cos(mm * th / 4)), nn2);
            const part2 = Math.pow(Math.abs(Math.sin(mm * th / 4)), nn2);
            const r = Math.pow(part1 + part2, -1 / nn1);
            const x = baseScale * r * Math.cos(th);
            const y = baseScale * r * Math.sin(th);
            if (th === 0) c.moveTo(x, y); else c.lineTo(x, y);
          }
          c.closePath();

          const colorIdx = (i + fIdx + Math.floor(random() * cols.length)) % cols.length;
          c.fillStyle = cols[colorIdx];
          c.globalAlpha = 0.82;
          c.fill();
          c.globalAlpha = 1.0;
          if (p.outlineWidth > 0) {
            c.lineWidth = p.outlineWidth;
            c.strokeStyle = bgColor;
            c.stroke();
          }
          c.restore();
        }
      });
    }
  },

  chladni: {
    name: "Acoustic Vibration Plates", group: "Mathematical",
    params: {
      colorCount: { type: 'range', min: 1, max: 12, val: 5, label: "Color Count" },
      m: { type: 'range', min: 1, max: 14, val: 3, label: "Tone Pitch M" },
      n: { type: 'range', min: 1, max: 14, val: 5, label: "Tone Pitch N" },
      th: { type: 'range', min: 0, max: 50, val: 18, label: "Outline Width" },
      sc: { type: 'range', min: 20, max: 300, val: 100, label: "Wave Scale" }
    },
    render: (c, w, h, p, cols) => {
      const id = c.createImageData(w, h);
      const dt = id.data;
      const maxColors = Math.min(Math.floor(p.colorCount), cols.length);
      const activePalette = cols.slice(0, maxColors);
      const bgRGB = [parseInt(bgColor.slice(1,3),16), parseInt(bgColor.slice(3,5),16), parseInt(bgColor.slice(5,7),16)];
      const paletteRGB = activePalette.map(hex => {
        const num = parseInt(hex.slice(1), 16);
        return [num >> 16, (num >> 8) & 255, num & 255];
      });
      const zoom = 3.14159 * (3.0 / (p.sc / 100));
      const minDim = Math.min(w, h);
      const threshold = p.th / 100;
      const seedPhase = (hash(globalSeed, 13) * 6.28);
      for (let y = 0; y < h; y++) {
        const uy = (y / minDim) * zoom + seedPhase;
        for (let x = 0; x < w; x++) {
          const ux = (x / minDim) * zoom + seedPhase;
          const val = Math.cos(p.n * ux) * Math.cos(p.m * uy) - Math.cos(p.m * ux) * Math.cos(p.n * uy);
          const absVal = Math.abs(val);
          const pIdx = (y * w + x) * 4;
          if (absVal < threshold) {
            const colorProg = (absVal / threshold) * paletteRGB.length;
            const cIdx = Math.floor(colorProg) % paletteRGB.length;
            const chosen = paletteRGB[cIdx] || paletteRGB[0];
            dt[pIdx] = chosen[0]; dt[pIdx + 1] = chosen[1]; dt[pIdx + 2] = chosen[2];
          } else {
            dt[pIdx] = bgRGB[0]; dt[pIdx + 1] = bgRGB[1]; dt[pIdx + 2] = bgRGB[2];
          }
          dt[pIdx + 3] = 255;
        }
      }
      c.putImageData(id, 0, 0);
    }
  },

  sineOscillator: {
    name: "Oscilloscope Waves", group: "Mathematical",
    params: {
      n: { type: 'range', min: 1, max: 100, val: 20, label: "Wave Count" },
      f: { type: 'range', min: 1, max: 50, val: 10, label: "Frequency" },
      a: { type: 'range', min: 10, max: 500, val: 100, label: "Wave Height" },
      outlineWidth: { type: 'range', min: 0.5, max: 50, val: 2, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); c.lineWidth = p.outlineWidth;
      for (let i = 0; i < p.n; i++) {
        c.beginPath(); c.strokeStyle = cols[i % cols.length];
        let a = randomRange(10, p.a), ph = random() * Math.PI * 2;
        for (let x = 0; x <= w; x += 5) {
          let y = h / 2 + Math.sin(x * p.f / 1000 + ph) * a;
          if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
      }
    }
  },

  quantumInterference: {
    name: "Wave Interference Pools", group: "Mathematical",
    params: {
      colorSteps: { type: 'range', min: 1, max: 24, val: 8, label: "Color Steps" },
      sources: { type: 'range', min: 2, max: 6, val: 3, label: "Wave Sources" },
      f: { type: 'range', min: 1, max: 100, val: 24, label: "Wave Frequency" },
      decay: { type: 'range', min: 0, max: 100, val: 30, label: "Distance Fade" },
      mode: { type: 'select', options: ['Additive Ripple', 'Standing Nodes', 'Turbulent Phase'], val: 'Additive Ripple', label: "Interference Mode" },
      zoom: { type: 'range', min: 10, max: 300, val: 100, label: "Field Zoom" }
    },
    render: (c, w, h, p, cols) => {
      const id = c.createImageData(w, h), dt = id.data;
      const bg = [parseInt(bgColor.slice(1,3),16), parseInt(bgColor.slice(3,5),16), parseInt(bgColor.slice(5,7),16)];
      const rgb = cols.map(x => { const n = parseInt(x.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; });
      
      const zm = p.zoom / 100;
      const minDim = Math.min(w, h);
      const numSources = Math.floor(p.sources);
      const pts = [];
      const seedRot = (random() * Math.PI * 2);
      for (let s = 0; s < numSources; s++) {
        const ang = (s / numSources) * Math.PI * 2 + seedRot;
        const dist = minDim * 0.32;
        pts.push({
          x: w / 2 + Math.cos(ang) * dist,
          y: h / 2 + Math.sin(ang) * dist
        });
      }

      const steps = Math.max(1, Math.floor(p.colorSteps));
      const decayRate = p.decay / 200;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let xx = (x - w / 2) * zm + w / 2;
          let yy = (y - h / 2) * zm + h / 2;

          let waveSum = 0;
          for (let s = 0; s < pts.length; s++) {
            const d = Math.hypot(xx - pts[s].x, yy - pts[s].y) / minDim * 12;
            const falloff = 1 / (1 + d * decayRate);
            if (p.mode === 'Standing Nodes') {
              waveSum += Math.cos(d * p.f) * falloff;
            } else if (p.mode === 'Turbulent Phase') {
              waveSum += Math.sin(d * p.f + s * 1.5) * Math.cos(d * 0.5) * falloff;
            } else {
              waveSum += Math.sin(d * p.f) * falloff;
            }
          }

          let norm = (waveSum / numSources) * 0.5 + 0.5;
          norm = Math.max(0, Math.min(0.999, norm));

          let stepped = Math.floor(norm * steps) / steps;
          const colIdx = Math.floor(stepped * rgb.length) % rgb.length;
          const chosen = rgb[colIdx];

          let i = (y * w + x) * 4;
          if (norm < 0.05) {
            dt[i] = bg[0]; dt[i + 1] = bg[1]; dt[i + 2] = bg[2];
          } else {
            dt[i] = chosen[0]; dt[i + 1] = chosen[1]; dt[i + 2] = chosen[2];
          }
          dt[i + 3] = 255;
        }
      }
      c.putImageData(id, 0, 0);
    }
  },

  lissajous: {
    name: "Lissajous Loops", group: "Mathematical",
    params: {
      loops: { type: 'range', min: 1, max: 24, val: 6, label: "Loop Count" },
      spread: { type: 'range', min: 10, max: 100, val: 95, label: "Canvas Reach %" },
      a: { type: 'range', min: 1, max: 20, val: 5, label: "Harmonic A" },
      b: { type: 'range', min: 1, max: 20, val: 4, label: "Harmonic B" },
      dl: { type: 'range', min: 0, max: 180, val: 90, label: "Phase Shift" },
      outlineWidth: { type: 'range', min: 0.5, max: 50, val: 1.5, label: "Outline Width" },
      angle: { type: 'range', min: 0, max: 360, val: 0, label: "Angle" },
      multiMode: { type: 'select', options: ['Nested Waves', 'Canvas Fill Lattice', 'Radial Bloom'], val: 'Canvas Fill Lattice', label: "Distribution" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h);
      c.lineWidth = p.outlineWidth;
      const count = Math.floor(p.loops);
      const baseScX = (w * 0.48) * (p.spread / 100);
      const baseScY = (h * 0.48) * (p.spread / 100);
      const phase = p.dl * Math.PI / 180;
      const seedRot = randomRange(0, 360) + p.angle;

      for (let k = 0; k < count; k++) {
        c.save();
        let ox = w / 2, oy = h / 2, curScX = baseScX, curScY = baseScY, localRot = 0;

        if (p.multiMode === 'Canvas Fill Lattice') {
          const prog = count > 1 ? k / (count - 1) : 0.5;
          curScX = baseScX * (0.35 + 0.65 * prog);
          curScY = baseScY * (0.35 + 0.65 * prog);
          localRot = (k * 12 + seedRot) * Math.PI / 180;
        } else if (p.multiMode === 'Radial Bloom') {
          localRot = (k * (360 / count) + seedRot) * Math.PI / 180;
          curScX = baseScX * 0.85;
          curScY = baseScY * 0.85;
        } else {
          const scaleStep = 1 - (k / count) * 0.7;
          curScX = baseScX * scaleStep;
          curScY = baseScY * scaleStep;
        }

        c.translate(ox, oy);
        c.rotate(localRot);

        c.strokeStyle = cols[k % cols.length];
        c.beginPath();
        const curPhase = phase + (k * 0.25);
        for (let t = 0; t <= Math.PI * 2; t += 0.005) {
          let x = curScX * Math.sin(p.a * t + curPhase);
          let y = curScY * Math.sin(p.b * t);
          if (t === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
        c.restore();
      }
    }
  },

  skyline: {
    name: "City Skyline", group: "Abstract Landscapes",
    params: {
      l: { type: 'range', min: 1, max: 20, val: 4, label: "City Layers" },
      sc: { type: 'range', min: 5, max: 300, val: 40, label: "Building Width" },
      wc: { type: 'range', min: 0, max: 100, val: 30, label: "Illuminated Windows %" },
      dp: { type: 'range', min: 0, max: 100, val: 60, label: "Haze Depth" },
      gp: { type: 'range', min: 0, max: 50, val: 0, label: "Alley Gap" },
      an: { type: 'range', min: 0, max: 100, val: 20, label: "Antennas %" }
    },
    render: (c, w, h, p, cols) => {
      const sg = c.createLinearGradient(0, 0, 0, h);
      sg.addColorStop(0, bgColor); sg.addColorStop(1, cols[0]);
      c.fillStyle = sg; c.fillRect(0, 0, w, h);
      for (let l = p.l; l > 0; l--) {
        const lr = l / p.l, bc = cols[Math.floor((p.l - l) % cols.length)];
        c.fillStyle = bc; c.globalAlpha = (1 - (p.dp / 100)) + (1 - lr) * (p.dp / 100);
        let x = 0;
        while (x < w) {
          const wd = Math.max(5, p.sc * randomRange(0.5, 2) * lr), ht = (h * 0.8) * random() * lr + (h * 0.1), y = h - ht;
          c.fillRect(x, y, wd + 1, ht + 1);
          if (random() * 100 < p.an) c.fillRect(x + wd / 2, y - ht / 3, 2, ht / 3);
          if (random() * 100 < p.wc) {
            c.fillStyle = bgColor;
            const ws = wd * 0.15, cls = Math.floor(wd / (ws * 1.5)), rws = Math.floor(ht / (ws * 2));
            for (let wr = 1; wr < rws; wr++) {
              for (let wc = 1; wc <= cls; wc++) {
                if (random() > 0.6) {
                  c.globalAlpha = randomRange(0.2, 1);
                  c.fillRect(x + wc * (ws * 1.5) - ws, y + wr * (ws * 2), ws, ws * 1.5);
                }
              }
            }
            c.fillStyle = bc; c.globalAlpha = (1 - (p.dp / 100)) + (1 - lr) * (p.dp / 100);
          }
          x += wd + p.gp;
        }
      }
      c.globalAlpha = 1;
    }
  },

  waves: {
    name: "Layered Ocean Waves", group: "Abstract Landscapes",
    params: {
      l: { type: 'range', min: 1, max: 100, val: 8, label: "Wave Layers" },
      f: { type: 'range', min: 1, max: 1000, val: 200, label: "Wave Frequency" },
      a: { type: 'range', min: 0, max: 500, val: 60, label: "Wave Height" },
      tb: { type: 'range', min: 0, max: 100, val: 30, label: "Turbulence" },
      sp: { type: 'range', min: 0, max: 100, val: 10, label: "Layer Shift" },
      outlineWidth: { type: 'range', min: 0, max: 50, val: 2, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h); const bf = 1 / p.f, cp = p.tb / 100;
      for (let i = 0; i < p.l; i++) {
        c.fillStyle = cols[i % cols.length]; c.globalAlpha = 0.85; c.beginPath(); c.moveTo(0, h);
        const am = randomRange(p.a * 0.6, p.a * 1.4), fq = bf * randomRange(0.5, 1.5);
        const ph = randomRange(0, Math.PI * 2) + (p.sp * i / 10), by = (h / p.l) * i + am;
        for (let x = 0; x <= w; x += 10) {
          const y = by + Math.sin(x * fq + ph) * am + Math.cos(x * fq * (1.5 + cp * 2) + ph) * (am * cp);
          if (x === 0) c.lineTo(x, y); else c.lineTo(x, y);
        }
        c.lineTo(w, h); c.closePath();
        c.fill();
        if (p.outlineWidth > 0) {
          c.strokeStyle = bgColor; c.lineWidth = p.outlineWidth; c.stroke();
        }
      }
      c.globalAlpha = 1;
    }
  },

  glitch: {
    name: "Glitch & Signal Artifacts", group: "Abstract Landscapes",
    params: {
      style: { type: 'select', options: ['RGB Slice Split', 'Data Bars', 'Pixel Scanlines', 'Corrupt Blocks'], val: 'RGB Slice Split', label: "Glitch Motif" },
      amount: { type: 'range', min: 10, max: 800, val: 220, label: "Chaos Intensity" },
      maxWidth: { type: 'range', min: 10, max: 600, val: 240, label: "Max Width" },
      maxHeight: { type: 'range', min: 1, max: 120, val: 25, label: "Max Height" },
      bleed: { type: 'range', min: 0, max: 100, val: 40, label: "Displacement" },
      outlineWidth: { type: 'range', min: 0, max: 50, val: 1, label: "Outline Width" }
    },
    render: (c, w, h, p, cols) => {
      c.fillStyle = bgColor; c.fillRect(0, 0, w, h);
      const baseCount = Math.floor(p.amount * 0.3);
      for (let i = 0; i < baseCount; i++) {
        c.fillStyle = pick(cols);
        c.fillRect(random() * w, random() * h, randomRange(20, p.maxWidth), randomRange(2, p.maxHeight));
      }
      if (p.style === 'RGB Slice Split') {
        const slices = Math.floor(p.amount * 0.2);
        for (let s = 0; s < slices; s++) {
          const sy = random() * h, sh = randomRange(4, p.maxHeight);
          const shift = (random() - 0.5) * p.bleed * 3;
          c.save(); c.beginPath(); c.rect(0, sy, w, sh); c.clip();
          c.fillStyle = pick(cols); c.globalAlpha = 0.6;
          c.fillRect(shift, sy, w, sh); c.restore();
        }
      } else if (p.style === 'Pixel Scanlines') {
        c.fillStyle = bgColor;
        for (let y = 0; y < h; y += 4) c.fillRect(0, y, w, 1.5);
      }
      const artifacts = Math.floor(p.amount);
      for (let i = 0; i < artifacts; i++) {
        c.fillStyle = pick(cols); c.globalAlpha = randomRange(0.4, 0.95);
        const x = random() * w, y = random() * h, bw = randomRange(5, p.maxWidth), bh = randomRange(1, p.maxHeight);
        c.fillRect(x, y, bw, bh);
        if (p.outlineWidth > 0 && random() > 0.85) { 
          c.strokeStyle = bgColor; c.lineWidth = p.outlineWidth; c.strokeRect(x, y, bw, bh); 
        }
      }
      c.globalAlpha = 1.0;
    }
  }
};

