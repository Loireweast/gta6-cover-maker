// Vice Cover Studio — the editor.
// Wires the controls to the poster: photos in, panels to fill, caption to
// type, grade and size to pick, PNG out. Drag the poster to move a photo,
// scroll over it to zoom, click a panel to pick it.

import { SIZES, GRADES, LAYOUTS, drawPoster, layoutPanels, defaultCrop } from './poster.js';

function el(id) {
  return document.getElementById(id);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Builds the editor on the page's controls and returns its controls. */
export function createEditor() {
  const canvas = el('poster');
  const state = {
    size: SIZES[0],
    layout: 'grid',
    grade: 'sunset',
    title: 'Neon Getaway',
    subtitle: 'One last score in the magic city',
    photos: [],
    crops: [],
    selected: 0,
  };
  let geometry = { panels: [], band: null };
  let selectionVisible = true;

  function status(text) {
    el('status').textContent = text;
  }

  function rebuildCrops() {
    const { panels } = layoutPanels(state.layout, state.size.w, state.size.h);
    const next = panels.map((_, i) => {
      const old = state.crops[i];
      return old ? { ...old } : defaultCrop();
    });
    state.crops = next;
    if (state.selected >= next.length) state.selected = 0;
  }

  function draw() {
    geometry = drawPoster(canvas, state);
    if (!selectionVisible) return;
    const rect = geometry.panels[state.selected];
    if (rect) {
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.setLineDash([14, 8]);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = Math.max(3, Math.round(canvas.width * 0.004));
      ctx.strokeRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);
      ctx.restore();
    }
    const crop = state.crops[state.selected];
    if (crop) {
      el('zoom').value = String(crop.zoom);
      el('panel-label').textContent = `Panel ${state.selected + 1} of ${state.crops.length}`;
    }
  }

  /** Hides the picked-panel outline (cover shots and exports go without it). */
  function setSelectionVisible(v) {
    selectionVisible = v;
    draw();
  }

  function renderFilmstrip() {
    const strip = el('filmstrip');
    strip.innerHTML = '';
    state.photos.forEach((photo, i) => {
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'thumb';
      thumb.title = photo.name;
      const img = document.createElement('img');
      img.src = photo.url;
      img.alt = photo.name;
      thumb.appendChild(img);
      thumb.addEventListener('click', () => {
        assignPhoto(i);
        [...strip.children].forEach((c) => c.classList.remove('active'));
        thumb.classList.add('active');
      });
      thumb.addEventListener('dblclick', () => fillAll(i));
      strip.appendChild(thumb);
    });
  }

  function addPhoto(img, name, url) {
    state.photos.push({ img, name, url });
    renderFilmstrip();
    if (state.photos.length === 1) fillAll(0);
    draw();
  }

  /** Puts photo `i` into the selected panel, keeping its crop centred. */
  function assignPhoto(i) {
    const crop = state.crops[state.selected];
    if (!crop) return;
    crop.photo = i;
    crop.zoom = 1;
    crop.ox = 0;
    crop.oy = 0;
    draw();
  }

  /** Fills every panel with photo `i`. */
  function fillAll(i) {
    for (const crop of state.crops) {
      crop.photo = i;
      crop.zoom = 1;
      crop.ox = 0;
      crop.oy = 0;
    }
    draw();
  }

  /** Loads one of the bundled sample photos into the filmstrip. */
  async function loadSample(name) {
    const img = await loadImage(`samples/${name}.jpg`);
    addPhoto(img, name, `samples/${name}.jpg`);
    return img;
  }

  /** Deals the loaded photos across the panels, one per panel in turn. */
  function dealPhotos() {
    if (!state.photos.length) return;
    state.crops.forEach((crop, i) => {
      crop.photo = i % state.photos.length;
      crop.zoom = 1;
      crop.ox = 0;
      crop.oy = 0;
    });
    draw();
  }

  function setSize(id) {
    const size = SIZES.find((s) => s.id === id) ?? SIZES[0];
    state.size = size;
    canvas.width = size.w;
    canvas.height = size.h;
    rebuildCrops();
    draw();
  }

  function setLayout(id) {
    state.layout = LAYOUTS.some((l) => l.id === id) ? id : 'grid';
    rebuildCrops();
    draw();
  }

  function setGrade(id) {
    state.grade = GRADES.some((g) => g.id === id) ? id : 'sunset';
    draw();
  }

  function setCaption(title, subtitle) {
    state.title = title;
    state.subtitle = subtitle;
    el('title').value = title;
    el('subtitle').value = subtitle;
    draw();
  }

  function segButtons(host, items, current, onPick) {
    const box = el(host);
    box.innerHTML = '';
    for (const item of items) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = item.label;
      b.dataset.id = item.id;
      if (item.id === current) b.classList.add('on');
      b.addEventListener('click', () => {
        [...box.children].forEach((c) => c.classList.remove('on'));
        b.classList.add('on');
        onPick(item.id);
      });
      box.appendChild(b);
    }
  }

  /** Renders the poster clean — no selection outline — for the PNG export. */
  function renderExportCanvas() {
    const off = document.createElement('canvas');
    off.width = state.size.w;
    off.height = state.size.h;
    drawPoster(off, state);
    return off;
  }

  function exportPoster() {
    const { w, h } = state.size;
    renderExportCanvas().toBlob((blob) => {
      if (!blob) {
        status('Export failed — try again.');
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-cover-${w}x${h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      status(`Saved vice-cover-${w}x${h}.png`);
    }, 'image/png');
  }

  // Photo picking: the person's own files, read on their machine only.
  el('photos').addEventListener('change', async (e) => {
    const files = [...(e.target.files ?? [])];
    for (const file of files) {
      try {
        const url = URL.createObjectURL(file);
        const img = await loadImage(url);
        addPhoto(img, file.name, url);
      } catch {
        status(`Could not read ${file.name}.`);
      }
    }
    e.target.value = '';
  });
  document.querySelectorAll('[data-sample]').forEach((b) => {
    b.addEventListener('click', () => {
      loadSample(b.dataset.sample).catch(() => status('Sample did not load.'));
    });
  });
  el('fill-all').addEventListener('click', () => {
    const crop = state.crops[state.selected];
    fillAll(crop && crop.photo >= 0 ? crop.photo : 0);
  });
  el('clear-photos').addEventListener('click', () => {
    state.photos = [];
    state.crops.forEach((c) => { c.photo = -1; });
    renderFilmstrip();
    draw();
  });

  el('zoom').addEventListener('input', (e) => {
    const crop = state.crops[state.selected];
    if (!crop) return;
    crop.zoom = Number(e.target.value);
    draw();
  });
  el('reset-crop').addEventListener('click', () => {
    const crop = state.crops[state.selected];
    if (!crop) return;
    crop.zoom = 1;
    crop.ox = 0;
    crop.oy = 0;
    draw();
  });

  el('title').addEventListener('input', (e) => { state.title = e.target.value; draw(); });
  el('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; draw(); });
  el('export').addEventListener('click', exportPoster);

  segButtons('layouts', LAYOUTS, state.layout, setLayout);
  segButtons('grades', GRADES, state.grade, setGrade);
  segButtons('sizes', SIZES, state.size.id, setSize);

  // The poster itself: click picks a panel, drag moves its photo, wheel zooms.
  let dragging = null;
  function toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
  }
  function panelAt(p) {
    return geometry.panels.findIndex((r) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h);
  }
  canvas.addEventListener('pointerdown', (e) => {
    const p = toCanvas(e);
    const i = panelAt(p);
    if (i < 0) return;
    state.selected = i;
    dragging = { x: p.x, y: p.y };
    canvas.setPointerCapture(e.pointerId);
    draw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = toCanvas(e);
    const crop = state.crops[state.selected];
    if (crop && crop.photo >= 0) {
      crop.ox += p.x - dragging.x;
      crop.oy += p.y - dragging.y;
      draw();
    }
    dragging = { x: p.x, y: p.y };
  });
  canvas.addEventListener('pointerup', () => { dragging = null; });
  canvas.addEventListener('pointercancel', () => { dragging = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const crop = state.crops[state.selected];
    if (!crop || crop.photo < 0) return;
    crop.zoom = Math.min(3, Math.max(1, crop.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
    draw();
  }, { passive: false });

  rebuildCrops();
  draw();
  return { state, draw, loadSample, dealPhotos, setSize, setLayout, setGrade, setCaption, assignPhoto, fillAll, exportPoster, setSelectionVisible };
}
