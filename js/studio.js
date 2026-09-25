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
const controlsScroll = document.querySelector('.controls-scroll');
const settingsScrollHandle = document.getElementById('settingsScrollHandle');
const ENGINE_DEFAULTS = Object.fromEntries(Object.entries(ENGINES).map(([id, engine]) => [
  id, Object.fromEntries(Object.entries(engine.params).map(([key, config]) => [key, config.val])),
]));

function bindSafeMobileScrolling() {
  let activeRangeGesture = null;
  let activeHandleGesture = null;

  const restoreRangeValue = gesture => {
    gesture.range.value = gesture.value;
    gesture.restoring = true;
    gesture.range.dispatchEvent(new Event('input', { bubbles: true }));
    gesture.restoring = false;
  };

  controlsScroll.addEventListener('pointerdown', event => {
    const range = event.target.closest('input[type=range]');
    if (!range || event.pointerType !== 'touch') return;
    activeRangeGesture = {
      pointerId: event.pointerId,
      range,
      value: range.value,
      startX: event.clientX,
      startY: event.clientY,
      startScrollTop: controlsScroll.scrollTop,
      scrolling: false,
      restoring: false,
    };
  }, true);

  controlsScroll.addEventListener('pointermove', event => {
    const gesture = activeRangeGesture;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (!gesture.scrolling && Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
      gesture.scrolling = true;
      restoreRangeValue(gesture);
    }
    if (gesture.scrolling) {
      restoreRangeValue(gesture);
      controlsScroll.scrollTop = gesture.startScrollTop - deltaY;
      event.preventDefault();
    }
  }, { capture: true, passive: false });

  controlsScroll.addEventListener('input', event => {
    const gesture = activeRangeGesture;
    if (gesture && gesture.scrolling && !gesture.restoring && event.target === gesture.range) {
      event.stopImmediatePropagation();
      gesture.range.value = gesture.value;
    }
  }, true);

  ['pointerup', 'pointercancel'].forEach(type => {
    controlsScroll.addEventListener(type, event => {
      if (activeRangeGesture?.pointerId === event.pointerId) activeRangeGesture = null;
    }, true);
  });

  settingsScrollHandle.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return;
    activeHandleGesture = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollTop: controlsScroll.scrollTop,
    };
    settingsScrollHandle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  settingsScrollHandle.addEventListener('pointermove', event => {
    const gesture = activeHandleGesture;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    controlsScroll.scrollTop = gesture.startScrollTop - (event.clientY - gesture.startY);
    event.preventDefault();
  }, { passive: false });

  ['pointerup', 'pointercancel'].forEach(type => {
    settingsScrollHandle.addEventListener(type, event => {
      if (activeHandleGesture?.pointerId === event.pointerId) activeHandleGesture = null;
    });
  });
}

bindSafeMobileScrolling();
const fxHalftone = document.getElementById('fxHalftone'), fxColorLevels = document.getElementById('fxColorLevels');
const fxContrast = document.getElementById('fxContrast'), fxVignette = document.getElementById('fxVignette');

ENGINE_CATALOG.forEach(([group, entries]) => {
  const og = document.createElement('optgroup');
  og.label = group;
  entries.forEach(([id]) => og.appendChild(new Option(ENGINES[id].name, id)));
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
    currentColors.push(generateRandomPalette(1)[0]);
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

function resetActiveEngine() {
  const engine = ENGINES[uiEngineSelect.value];
  Object.entries(ENGINE_DEFAULTS[uiEngineSelect.value]).forEach(([key, value]) => {
    engine.params[key].val = value;
  });
  buildDynamicUI();
  scheduleRender();
}

function randomSafeRangeValue(key, config) {
  const span = config.max - config.min;
  const descriptor = `${key} ${config.label}`;
  const affectsRenderCost = /(density|detail|iteration|attempt|particle|point|vertex|node|dot|ray|stream|count|amount|segment|division|subdivision|cell|grid|step|resolution|smoothness|loop|ring|layer|petal|flower|line famil)/i.test(descriptor);
  const low = config.min + span * 0.12;
  const high = config.min + span * (affectsRenderCost ? 0.45 : 0.78);
  const value = low + Math.random() * Math.max(0, high - low);
  return span > 10 ? Math.round(value) : Math.round(value * 10) / 10;
}

function randomizeEngineSafely() {
  const engine = ENGINES[uiEngineSelect.value];
  Object.entries(engine.params).forEach(([key, config]) => {
    if (config.type === 'range') config.val = randomSafeRangeValue(key, config);
    else if (config.type === 'select') config.val = config.options[Math.floor(Math.random() * config.options.length)];
  });
}

function clampByte(value) { return Math.max(0, Math.min(255, value)); }

function applyFinishPass(targetCtx, w, h) {
  const contrast = Number(fxContrast.value), vignette = Number(fxVignette.value) / 100;
  const halftone = Number(fxHalftone.value) / 100;
  const colorCount = fxColorLevels.value === '0' ? 0 : Math.max(2, Math.round(16 - Number(fxColorLevels.value) * .14));
  if (!contrast && !vignette && !halftone && !colorCount) return;

  const image = targetCtx.getImageData(0, 0, w, h), d = image.data;
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const centerX = w / 2, centerY = h / 2, maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    let adjustment = 0;
    if (vignette) adjustment -= Math.pow(Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) / maxDist, 1.7) * 110 * vignette;
    if (halftone) adjustment += (Math.sin(x * .72) * Math.sin(y * .72)) * 24 * halftone;
    d[i] = clampByte((contrast ? contrastFactor * (d[i] - 128) + 128 : d[i]) + adjustment);
    d[i + 1] = clampByte((contrast ? contrastFactor * (d[i + 1] - 128) + 128 : d[i + 1]) + adjustment);
    d[i + 2] = clampByte((contrast ? contrastFactor * (d[i + 2] - 128) + 128 : d[i + 2]) + adjustment);
  }
  if (colorCount) {
    // Build a compact palette from the finished image, then snap every pixel to
    // it. This keeps the selected number meaningful without washing artwork into
    // a generic RGB cube.
    const bins = new Uint32Array(32768);
    for (let i = 0; i < d.length; i += 16) bins[(d[i] >> 3 << 10) | (d[i + 1] >> 3 << 5) | (d[i + 2] >> 3)]++;
    const palette = Array.from(bins, (count, bin) => ({ count, bin })).filter(entry => entry.count)
      .sort((a, b) => b.count - a.count).slice(0, colorCount).map(({ bin }) => [
        ((bin >> 10) & 31) * 8 + 4, ((bin >> 5) & 31) * 8 + 4, (bin & 31) * 8 + 4,
      ]);
    for (let i = 0; i < d.length; i += 4) {
      let closest = palette[0], distance = Infinity;
      for (const color of palette) {
        const candidate = (d[i] - color[0]) ** 2 + (d[i + 1] - color[1]) ** 2 + (d[i + 2] - color[2]) ** 2;
        if (candidate < distance) { distance = candidate; closest = color; }
      }
      d[i] = closest[0]; d[i + 1] = closest[1]; d[i + 2] = closest[2];
    }
  }
  targetCtx.putImageData(image, 0, 0);
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

  engine.render(offCtx, frameW, frameH, p, currentColors, scaleMult);

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

  applyFinishPass(targetCtx, w, h);
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
  currentColors = generateRandomPalette(currentColors.length);
  bgColor = generateRandomBackground();
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
  document.getElementById('valHalftone').innerText = fxHalftone.value + '%';
  document.getElementById('valColorLevels').innerText = fxColorLevels.value === '0' ? 'Full' : `${Math.max(2, Math.round(16 - Number(fxColorLevels.value) * .14))} colors`;
  document.getElementById('valContrast').innerText = fxContrast.value;
  document.getElementById('valVignette').innerText = fxVignette.value + '%';
}

[compMargin, compZoom, compRotation, compOffsetX, compOffsetY, compGrain].forEach(control => {
  control.addEventListener('input', () => { updateGlobalUI(); scheduleRender(); });
});
compSymmetry.addEventListener('change', () => { scheduleRender(); });
[fxHalftone, fxColorLevels, fxContrast, fxVignette].forEach(control => {
  control.addEventListener('input', () => { updateGlobalUI(); scheduleRender(); });
});

document.getElementById('btnResetGlobals').addEventListener('click', () => {
  compMargin.value = 0; compZoom.value = 100; compRotation.value = 0;
  compOffsetX.value = 0; compOffsetY.value = 0; compGrain.value = 15;
  compSymmetry.value = 'None';
  fxHalftone.value = 0; fxColorLevels.value = 0; fxContrast.value = 0; fxVignette.value = 0;
  updateGlobalUI();
  scheduleRender();
});

document.getElementById('paramSeed').addEventListener('input', e => {
  document.getElementById('valSeed').innerText = e.target.value;
  scheduleRender();
});

document.getElementById('btnResetEngine').addEventListener('click', resetActiveEngine);

document.getElementById('btnNewSeed').addEventListener('click', () => {
  const newSeed = Math.floor(Math.random() * 99999);
  document.getElementById('paramSeed').value = newSeed;
  document.getElementById('valSeed').innerText = newSeed;
  scheduleRender();
});

document.getElementById('btnRandomize').addEventListener('click', () => {
  const keys = Object.keys(ENGINES);
  uiEngineSelect.value = keys[Math.floor(Math.random() * keys.length)];
  currentColors = generateRandomPalette(currentColors.length);
  bgColor = generateRandomBackground();
  presetPalette.value = "";
  renderPaletteUI();
  randomizeEngineSafely();
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
