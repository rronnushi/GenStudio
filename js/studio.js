const uiEngineSelect = document.getElementById('engineSelect');
const uiDynamicControls = document.getElementById('dynamicControls');
const paletteContainer = document.getElementById("paletteContainer");
const btnAddColor = document.getElementById("btnAddColor");
const presetPalette = document.getElementById("presetPalette");
const paletteCountLabel = document.getElementById("paletteCount");
const bgSwatchWrap = document.getElementById("bgSwatchWrap"), bgColorPicker = document.getElementById("bgColorPicker");

const compMargin = document.getElementById("compMargin"), compZoom = document.getElementById("compZoom");
const compRotation = document.getElementById("compRotation"), compOffsetX = document.getElementById("compOffsetX"), compOffsetY = document.getElementById("compOffsetY");
const compGrain = document.getElementById("compGrain"), compSymmetry = document.getElementById("compSymmetry");

const engineGroups = {};
Object.entries(ENGINES).forEach(([k, e]) => {
  if (!engineGroups[e.group]) engineGroups[e.group] = [];
  engineGroups[e.group].push({ k, n: e.name });
});
Object.entries(engineGroups).forEach(([g, arr]) => {
  const og = document.createElement('optgroup');
  og.label = g;
  arr.forEach(e => og.appendChild(new Option(e.n, e.k)));
  uiEngineSelect.appendChild(og);
});

function renderPaletteUI() {
  paletteContainer.querySelectorAll('.swatch-wrap:not(.bg-swatch)').forEach(el => el.remove());
  bgSwatchWrap.style.backgroundColor = bgColor;
  bgColorPicker.value = bgColor;
  paletteCountLabel.innerText = `${currentColors.length} / 20`;

  currentColors.forEach((hex, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'swatch-wrap';
    wrap.style.backgroundColor = hex;

    const input = document.createElement('input');
    input.type = 'color';
    input.value = hex;
    input.addEventListener('input', (e) => {
      currentColors[idx] = e.target.value;
      wrap.style.backgroundColor = e.target.value;
      scheduleRender();
    });

    const del = document.createElement('div');
    del.className = 'swatch-del';
    del.innerHTML = '&times;';
    del.title = 'Remove Color';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentColors.length > 1) {
        currentColors.splice(idx, 1);
        renderPaletteUI();
        scheduleRender();
      }
    });

    wrap.addEventListener('dblclick', () => {
      if (currentColors.length > 1) {
        currentColors.splice(idx, 1);
        renderPaletteUI();
        scheduleRender();
      }
    });

    wrap.appendChild(del);
    wrap.appendChild(input);
    paletteContainer.insertBefore(wrap, btnAddColor);
  });
}

bgColorPicker.addEventListener('input', (e) => {
  bgColor = e.target.value;
  bgSwatchWrap.style.backgroundColor = bgColor;
  scheduleRender();
});

btnAddColor.addEventListener('click', () => {
  if (currentColors.length < 20) {
    currentColors.push('#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
    renderPaletteUI();
    scheduleRender();
  }
});

function buildDynamicUI() {
  const engine = ENGINES[uiEngineSelect.value];
  uiDynamicControls.innerHTML = '';
  Object.entries(engine.params).forEach(([key, conf]) => {
    const wrap = document.createElement('div');
    wrap.className = 'control-group';
    if (conf.type === 'range') {
      wrap.innerHTML = `<div class="label-row"><span>${conf.label}</span><span class="val" id="val_${key}">${conf.val}</span></div><input type="range" id="param_${key}" min="${conf.min}" max="${conf.max}" step="${(conf.max - conf.min) > 10 ? 1 : 0.1}" value="${conf.val}">`;
      uiDynamicControls.appendChild(wrap);
      document.getElementById(`param_${key}`).addEventListener('input', (e) => {
        document.getElementById(`val_${key}`).innerText = e.target.value;
        engine.params[key].val = parseFloat(e.target.value);
        scheduleRender();
      });
    } else if (conf.type === 'select') {
      let opts = conf.options.map(opt => `<option value="${opt}" ${conf.val === opt ? 'selected' : ''}>${opt}</option>`).join('');
      wrap.innerHTML = `<div class="label-row"><span>${conf.label}</span></div><select id="param_${key}">${opts}</select>`;
      uiDynamicControls.appendChild(wrap);
      document.getElementById(`param_${key}`).addEventListener('change', (e) => {
        engine.params[key].val = e.target.value;
        scheduleRender();
      });
    }
  });
}

function applyGrainPass(amount, targetCtx, w, h) {
  if (amount <= 0) return;
  const imgData = targetCtx.getImageData(0, 0, w, h), d = imgData.data, noiseMult = amount * 1.5;
  for (let i = 0; i < d.length; i += 4) {
    const noise = (Math.random() - 0.5) * noiseMult;
    d[i] = Math.min(255, Math.max(0, d[i] + noise));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise));
  }
  targetCtx.putImageData(imgData, 0, 0);
}

function applyGlobalSymmetry(symType, rCtx, tempCVS, w, h) {
  if (symType === 'None') return;
  tempCVS.width = w; tempCVS.height = h;
  const tCtx = tempCVS.getContext('2d', { willReadFrequently: true, colorSpace: "srgb" });
  tCtx.drawImage(rCtx.canvas, 0, 0);
  rCtx.fillStyle = bgColor;
  rCtx.fillRect(0, 0, w, h);

  if (symType === 'Horizontal') {
    rCtx.drawImage(tempCVS, 0, 0, w / 2, h, 0, 0, w / 2, h);
    rCtx.save(); rCtx.translate(w, 0); rCtx.scale(-1, 1);
    rCtx.drawImage(tempCVS, 0, 0, w / 2, h, 0, 0, w / 2, h);
    rCtx.restore();
  } else if (symType === 'Vertical') {
    rCtx.drawImage(tempCVS, 0, 0, w, h / 2, 0, 0, w, h / 2);
    rCtx.save(); rCtx.translate(0, h); rCtx.scale(1, -1);
    rCtx.drawImage(tempCVS, 0, 0, w, h / 2, 0, 0, w, h / 2);
    rCtx.restore();
  } else if (symType === 'Quad') {
    rCtx.drawImage(tempCVS, 0, 0, w / 2, h / 2, 0, 0, w / 2, h / 2);
    rCtx.save(); rCtx.translate(w, 0); rCtx.scale(-1, 1);
    rCtx.drawImage(tempCVS, 0, 0, w / 2, h / 2, 0, 0, w / 2, h / 2);
    rCtx.restore();
    rCtx.save(); rCtx.translate(0, h); rCtx.scale(1, -1);
    rCtx.drawImage(tempCVS, 0, 0, w / 2, h / 2, 0, 0, w / 2, h / 2);
    rCtx.restore();
    rCtx.save(); rCtx.translate(w, h); rCtx.scale(-1, -1);
    rCtx.drawImage(tempCVS, 0, 0, w / 2, h / 2, 0, 0, w / 2, h / 2);
    rCtx.restore();
  }
}

function renderPipeline(targetCtx, w, h, scaleMult = 1) {
  const seedVal = parseInt(document.getElementById('paramSeed').value);
  globalSeed = seedVal;
  resetRandom(seedVal);

  const engine = ENGINES[uiEngineSelect.value];
  const p = {};
  Object.keys(engine.params).forEach(k => p[k] = engine.params[k].val);

  const margin = parseFloat(compMargin.value) * scaleMult;
  const frameX = margin;
  const frameY = margin;
  const frameW = Math.max(1, Math.round(w - margin * 2));
  const frameH = Math.max(1, Math.round(h - margin * 2));

  targetCtx.fillStyle = bgColor;
  targetCtx.fillRect(0, 0, w, h);

  if (frameW <= 0 || frameH <= 0) return;

  const offCanvas = document.createElement("canvas");
  offCanvas.width = frameW;
  offCanvas.height = frameH;
  const offCtx = offCanvas.getContext("2d", { willReadFrequently: true, colorSpace: "srgb" });

  engine.render(offCtx, frameW, frameH, p, currentColors);

  const symCanvas = document.createElement("canvas");
  applyGlobalSymmetry(compSymmetry.value, offCtx, symCanvas, frameW, frameH);

  const zoom = parseFloat(compZoom.value) / 100;
  const rot = parseFloat(compRotation.value) * Math.PI / 180;
  const ox = (parseFloat(compOffsetX.value) / 100) * frameW;
  const oy = (parseFloat(compOffsetY.value) / 100) * frameH;

  targetCtx.save();
  targetCtx.beginPath();
  targetCtx.rect(frameX, frameY, frameW, frameH);
  targetCtx.clip();

  targetCtx.imageSmoothingEnabled = true;
  targetCtx.imageSmoothingQuality = "high";

  targetCtx.translate(frameX + frameW / 2 + ox, frameY + frameH / 2 + oy);
  targetCtx.rotate(rot);
  targetCtx.scale(zoom, zoom);

  targetCtx.drawImage(offCanvas, -frameW / 2, -frameH / 2, frameW, frameH);
  targetCtx.restore();

  applyGrainPass(parseFloat(compGrain.value), targetCtx, w, h);
}

let renderPending = false;
function scheduleRender() {
  if (renderPending) return;
  renderPending = true;
  requestAnimationFrame(() => {
    // Release the queue before drawing so a failed render cannot freeze the UI.
    renderPending = false;
    render();
  });
}

function render() {
  renderPipeline(ctx, canvas.width, canvas.height, 1);
}

uiEngineSelect.addEventListener('change', () => { buildDynamicUI(); scheduleRender(); });

presetPalette.addEventListener('change', (e) => {
  if (PALETTES[e.target.value]) {
    bgColor = PALETTES[e.target.value][0];
    currentColors = PALETTES[e.target.value].slice(1);
    renderPaletteUI();
    scheduleRender();
  }
});

document.getElementById('btnReorderColors').addEventListener('click', () => {
  for (let i = currentColors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [currentColors[i], currentColors[j]] = [currentColors[j], currentColors[i]];
  }
  renderPaletteUI();
  scheduleRender();
});

document.getElementById('btnRandColors').addEventListener('click', () => {
  currentColors = generateRandomPalette();
  presetPalette.value = "";
  renderPaletteUI();
  scheduleRender();
});

function updateGlobalUI() {
  document.getElementById('valMargin').innerText = compMargin.value + 'px';
  document.getElementById('valZoom').innerText = compZoom.value + '%';
  document.getElementById('valRotation').innerText = compRotation.value + '°';
  document.getElementById('valOffsetX').innerText = compOffsetX.value + '%';
  document.getElementById('valOffsetY').innerText = compOffsetY.value + '%';
  document.getElementById('valGrain').innerText = compGrain.value + '%';
}

[compMargin, compZoom, compRotation, compOffsetX, compOffsetY, compGrain].forEach(control => {
  control.addEventListener('input', () => { updateGlobalUI(); scheduleRender(); });
});
compSymmetry.addEventListener('change', () => { scheduleRender(); });

document.getElementById('btnResetGlobals').addEventListener('click', () => {
  compMargin.value = 0; compZoom.value = 100; compRotation.value = 0;
  compOffsetX.value = 0; compOffsetY.value = 0; compGrain.value = 15;
  compSymmetry.value = 'None';
  updateGlobalUI();
  scheduleRender();
});

document.getElementById('paramSeed').addEventListener('input', e => {
  document.getElementById('valSeed').innerText = e.target.value;
  scheduleRender();
});

document.getElementById('btnNewSeed').addEventListener('click', () => {
  const newSeed = Math.floor(Math.random() * 99999);
  document.getElementById('paramSeed').value = newSeed;
  document.getElementById('valSeed').innerText = newSeed;
  scheduleRender();
});

document.getElementById('btnRandomize').addEventListener('click', () => {
  const keys = Object.keys(ENGINES);
  uiEngineSelect.value = keys[Math.floor(Math.random() * keys.length)];
  if (Math.random() > 0.5) {
    const pKeys = Object.keys(PALETTES);
    presetPalette.value = pKeys[Math.floor(Math.random() * pKeys.length)];
    bgColor = PALETTES[presetPalette.value][0];
    currentColors = PALETTES[presetPalette.value].slice(1);
  } else {
    currentColors = generateRandomPalette();
    presetPalette.value = "";
  }
  renderPaletteUI();
  const engine = ENGINES[uiEngineSelect.value];
  Object.entries(engine.params).forEach(([key, conf]) => {
    if (conf.type === 'range') conf.val = Math.floor(conf.min + Math.random() * (conf.max - conf.min + 1));
    else if (conf.type === 'select') conf.val = conf.options[Math.floor(Math.random() * conf.options.length)];
  });
  buildDynamicUI();
  const newSeed = Math.floor(Math.random() * 99999);
  document.getElementById('paramSeed').value = newSeed;
  document.getElementById('valSeed').innerText = newSeed;
  scheduleRender();
});

async function executeExport(scaleMultiplier = 1) {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width * scaleMultiplier;
  exportCanvas.height = canvas.height * scaleMultiplier;
  const exportCtx = exportCanvas.getContext('2d', { willReadFrequently: true, colorSpace: "srgb" });

  renderPipeline(exportCtx, exportCanvas.width, exportCanvas.height, scaleMultiplier);

  const fileName = `RRON_Studio_${exportCanvas.width}x${exportCanvas.height}_${Date.now()}.png`;

  exportCanvas.toBlob(async (blob) => {
    if (!blob) return;
    if (navigator.share) {
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'RRON Generative Art' });
          return;
        } catch (err) {}
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = fileName;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 200);
  }, 'image/png');
}

document.getElementById('btnExport').addEventListener('click', () => executeExport(1));
document.getElementById('btnExport2x').addEventListener('click', () => executeExport(2));

document.querySelectorAll(".aspect-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".aspect-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    canvas.width = parseInt(e.target.dataset.w);
    canvas.height = parseInt(e.target.dataset.h);
    scheduleRender();
  });
});

canvas.width = 1080;
canvas.height = 1920;
renderPaletteUI();
buildDynamicUI();
scheduleRender();
