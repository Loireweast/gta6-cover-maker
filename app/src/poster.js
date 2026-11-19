// Vice Cover Studio — the poster renderer.
// Draws a multi-panel GTA-style poster onto a canvas: a collage of photo
// panels above a dark caption band, graded like a Vice sunset or neon night,
// with a big condensed title. Every layout is relative, so the same poster
// works at any export size.

export const SIZES = [
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'tall', label: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 × 1080', w: 1920, h: 1080 },
];

export const GRADES = [
  { id: 'sunset', label: 'Sunset' },
  { id: 'neon', label: 'Neon' },
  { id: 'noir', label: 'Noir' },
];

export const LAYOUTS = [
  { id: 'grid', label: 'Vice Grid' },
  { id: 'four', label: 'Four Up' },
  { id: 'strips', label: 'Strips' },
];

export function defaultCrop() {
  return { photo: -1, zoom: 1, ox: 0, oy: 0 };
}

/** Panels for a layout, in pixels, plus the caption band at the foot. */
export function layoutPanels(layoutId, w, h) {
  const bandH = Math.round(h * 0.24);
  const band = { x: 0, y: h - bandH, w, h: bandH };
  const areaH = h - bandH;
  const g = Math.max(8, Math.round(w * 0.008));
  let panels;
  if (layoutId === 'four') {
    const cw = (w - g) / 2;
    const rh = (areaH - g) / 2;
    panels = [
      { x: 0, y: 0, w: cw, h: rh },
      { x: cw + g, y: 0, w: cw, h: rh },
      { x: 0, y: rh + g, w: cw, h: rh },
      { x: cw + g, y: rh + g, w: cw, h: rh },
    ];
  } else if (layoutId === 'strips') {
    const cw = (w - 2 * g) / 3;
    panels = [0, 1, 2].map((i) => ({ x: i * (cw + g), y: 0, w: cw, h: areaH }));
  } else {
    // Vice Grid: one hero panel on the left, two stacked on the right.
    const heroW = Math.round(w * 0.62);
    const rx = heroW + g;
    const rw = w - rx;
    const th = (areaH - g) / 2;
    panels = [
      { x: 0, y: 0, w: heroW, h: areaH },
      { x: rx, y: 0, w: rw, h: th },
      { x: rx, y: th + g, w: rw, h: areaH - th - g },
    ];
  }
  return { panels, band };
}

/** One panel: the photo cover-fitted with its crop, or a placeholder. */
function drawPanelPhoto(ctx, rect, img, crop, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (img) {
    const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const scale = base * crop.zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = x + (w - dw) / 2 + crop.ox;
    const dy = y + (h - dh) / 2 + crop.oy;
    if (grade === 'noir') ctx.filter = 'grayscale(0.9) contrast(1.18) brightness(1.06)';
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
  } else {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#3a1c5c');
    g.addColorStop(1, '#1c0b33');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = `600 ${Math.max(14, Math.round(h * 0.055))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', x + w / 2, y + h / 2);
  }
  ctx.restore();
}

/** The colour grade: sunset warmth, neon duotone, or a vignette over all. */
function applyGrade(ctx, area, grade, w) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(area.x, area.y, area.w, area.h);
  ctx.clip();
  if (grade === 'sunset') {
    const g = ctx.createLinearGradient(0, area.y, 0, area.y + area.h);
    g.addColorStop(0, 'rgba(255, 190, 90, 0.10)');
    g.addColorStop(0.55, 'rgba(255, 110, 60, 0.12)');
    g.addColorStop(1, 'rgba(255, 45, 120, 0.34)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = g;
    ctx.fillRect(area.x, area.y, area.w, area.h);
    const sun = ctx.createRadialGradient(
      w * 0.78, area.y + area.h * 0.16, 0,
      w * 0.78, area.y + area.h * 0.16, w * 0.42,
    );
    sun.addColorStop(0, 'rgba(255, 220, 130, 0.55)');
    sun.addColorStop(1, 'rgba(255, 220, 130, 0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = sun;
    ctx.fillRect(area.x, area.y, area.w, area.h);
  } else if (grade === 'neon') {
    const g = ctx.createLinearGradient(area.x, area.y, area.x + area.w, area.y + area.h);
    g.addColorStop(0, 'rgba(255, 46, 136, 0.30)');
    g.addColorStop(0.5, 'rgba(120, 40, 220, 0.12)');
    g.addColorStop(1, 'rgba(34, 211, 238, 0.30)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = g;
    ctx.fillRect(area.x, area.y, area.w, area.h);
    const glow = ctx.createRadialGradient(
      area.x + area.w * 0.12, area.y + area.h * 0.9, 0,
      area.x + area.w * 0.12, area.y + area.h * 0.9, w * 0.5,
    );
    glow.addColorStop(0, 'rgba(34, 211, 238, 0.45)');
    glow.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = glow;
    ctx.fillRect(area.x, area.y, area.w, area.h);
  }
  ctx.globalCompositeOperation = 'source-over';
  const cx = area.x + area.w / 2;
  const cy = area.y + area.h / 2;
  const v = ctx.createRadialGradient(cx, cy, Math.min(area.w, area.h) * 0.36, cx, cy, Math.max(area.w, area.h) * 0.72);
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, 'rgba(10, 2, 20, 0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(area.x, area.y, area.w, area.h);
  ctx.restore();
}

/** A small palm silhouette, drawn from curves, for the caption band. */
function drawPalm(ctx, x, baseY, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + s * 0.08, baseY - s * 0.55, x + s * 0.02, baseY - s);
  ctx.stroke();
  const tx = x + s * 0.02;
  const ty = baseY - s;
  const fronds = [
    [-1, -0.15, -0.55, -0.75],
    [-0.6, -0.5, -0.28, -0.95],
    [0, -0.7, 0.05, -1.05],
    [0.6, -0.5, 0.3, -0.95],
    [1, -0.15, 0.55, -0.75],
  ];
  for (const [dx1, dy1, dx2, dy2] of fronds) {
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + dx1 * s * 0.35, ty + dy1 * s * 0.5, tx + dx2 * s * 0.55, ty + dy2 * s * 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

/** The dark band at the foot: neon rule, palms, big tilted title, subtitle. */
function drawCaptionBand(ctx, band, title, subtitle, w) {
  const g = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
  g.addColorStop(0, '#1d0b33');
  g.addColorStop(1, '#0e0518');
  ctx.fillStyle = g;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  const rule = ctx.createLinearGradient(0, 0, w, 0);
  rule.addColorStop(0, '#ff2e88');
  rule.addColorStop(0.5, '#ff7a18');
  rule.addColorStop(1, '#22d3ee');
  ctx.fillStyle = rule;
  ctx.fillRect(0, band.y, w, Math.max(4, Math.round(band.h * 0.025)));
  drawPalm(ctx, w * 0.055, band.y + band.h * 0.94, band.h * 0.6, 'rgba(255, 255, 255, 0.08)');
  drawPalm(ctx, w * 0.945, band.y + band.h * 0.94, band.h * 0.68, 'rgba(255, 255, 255, 0.08)');

  const text = (title.trim() || 'UNTITLED').toUpperCase();
  let size = band.h * 0.46;
  ctx.font = `${size}px "Bebas Neue", "Arial Narrow", sans-serif`;
  while (ctx.measureText(text).width > w * 0.9 && size > 20) {
    size -= 2;
    ctx.font = `${size}px "Bebas Neue", "Arial Narrow", sans-serif`;
  }
  ctx.save();
  ctx.translate(w / 2, band.y + band.h * 0.5);
  ctx.rotate(-0.022);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10, 2, 20, 0.9)';
  ctx.lineWidth = size * 0.14;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 0, 0);
  const tw = ctx.measureText(text).width;
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(-tw / 2, size * 0.42, tw, Math.max(4, size * 0.07));
  ctx.restore();

  const sub = subtitle.trim().toUpperCase();
  if (sub) {
    const subSize = Math.max(13, band.h * 0.105);
    ctx.font = `700 ${subSize}px system-ui, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, band.h * 0.02)}px`; } catch { /* older canvas */ }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd23f';
    ctx.fillText(sub, w / 2, band.y + band.h * 0.86);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
}

/**
 * Draws the whole poster. `state` holds size, layout, grade, title, subtitle,
 * photos (HTMLImageElements) and one crop per panel. Returns the panel rects
 * and the band, so the editor can hit-test them.
 */
export function drawPoster(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const { panels, band } = layoutPanels(state.layout, w, h);
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, w, h);
  panels.forEach((rect, i) => {
    const crop = state.crops[i] || defaultCrop();
    const photo = crop.photo >= 0 ? state.photos[crop.photo] ?? null : null;
    const img = photo ? photo.img : null;
    drawPanelPhoto(ctx, rect, img, crop, state.grade);
  });
  applyGrade(ctx, { x: 0, y: 0, w, h: band.y }, state.grade, w);
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.lineWidth = Math.max(2, Math.round(w * 0.003));
  for (const r of panels) ctx.strokeRect(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3);
  ctx.restore();
  drawCaptionBand(ctx, band, state.title, state.subtitle, w);
  return { panels, band };
}
