// panels.js — the artwork half of Vice Panel Studio.
//
// Three slanted-panel layouts, a small library of panel artwork (two sample
// photographs plus three scenes painted procedurally on the canvas) and a
// set of colour grades. Everything is drawn with Canvas 2D at render time;
// nothing is fetched, and the seeded star field keeps every render identical.

export const COVER_W = 1080;
export const COVER_H = 1350;

// Each layout is a list of polygons in cover coordinates. Panels are drawn
// in order, then every polygon is stroked with a thick black gutter, which
// is what gives the page its comic-book seams.
export const LAYOUTS = {
  trio: {
    label: 'Slash Trio',
    panels: [
      [[0, 0], [1080, 0], [1080, 420], [0, 545]],
      [[0, 570], [1080, 445], [1080, 875], [0, 1000]],
      [[0, 1025], [1080, 900], [1080, 1350], [0, 1350]],
    ],
  },
  quad: {
    label: 'Quad Grid',
    panels: [
      [[0, 0], [625, 0], [545, 615], [0, 695]],
      [[650, 0], [1080, 0], [1080, 690], [570, 615]],
      [[0, 720], [520, 640], [605, 1350], [0, 1350]],
      [[545, 640], [1080, 715], [1080, 1350], [630, 1350]],
    ],
  },
  hero: {
    label: 'Hero + Strip',
    panels: [
      [[0, 0], [1080, 0], [1080, 745], [0, 875]],
      [[0, 900], [525, 800], [525, 1350], [0, 1350]],
      [[550, 800], [1080, 900], [1080, 1350], [550, 1350]],
    ],
  },
};

export const ART_KINDS = ['pier', 'boulevard', 'sunset', 'night', 'palms'];
export const ART_LABELS = {
  pier: 'Pier photo',
  boulevard: 'Boulevard photo',
  sunset: 'Sunset scene',
  night: 'Night scene',
  palms: 'Palms scene',
};

export const GRADES = ['none', 'gold', 'teal', 'magenta', 'violet', 'mono', 'noir'];
export const GRADE_LABELS = {
  none: 'No grade',
  gold: 'Gold heat',
  teal: 'Teal wash',
  magenta: 'Magenta pop',
  violet: 'Violet dusk',
  mono: 'Mono',
  noir: 'Noir',
};

// A tiny deterministic PRNG (LCG) so the star field never changes between
// renders of the same cover.
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function bbox(poly) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of poly) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function tracePath(ctx, poly) {
  ctx.beginPath();
  poly.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
}

// Draw an image so it covers the box completely (centre-cropped).
function drawCoverImage(ctx, img, box) {
  const scale = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h);
}

function skyline(ctx, box, baseY, colour, seed, maxH) {
  const rnd = seeded(seed);
  ctx.fillStyle = colour;
  let x = box.x - 10;
  while (x < box.x + box.w + 10) {
    const bw = 30 + rnd() * 90;
    const bh = maxH * (0.35 + rnd() * 0.65);
    ctx.fillRect(x, baseY - bh, bw, bh + (box.y + box.h - baseY));
    x += bw + 4 + rnd() * 26;
  }
}

function paintSunset(ctx, box) {
  const g = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
  g.addColorStop(0, '#2b1055');
  g.addColorStop(0.45, '#b83a6e');
  g.addColorStop(0.75, '#ff7e47');
  g.addColorStop(1, '#ffc46b');
  ctx.fillStyle = g;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(box.x + box.w * 0.68, box.y + box.h * 0.52, box.h * 0.16, 0, Math.PI * 2);
  ctx.fill();
  skyline(ctx, box, box.y + box.h * 0.86, '#1c0b2e', 7, box.h * 0.4);
  ctx.fillStyle = '#12061f';
  ctx.fillRect(box.x, box.y + box.h * 0.86, box.w, box.h * 0.14);
}

function paintNight(ctx, box) {
  const g = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
  g.addColorStop(0, '#04060f');
  g.addColorStop(0.7, '#0d1b3a');
  g.addColorStop(1, '#173763');
  ctx.fillStyle = g;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  const rnd = seeded(42);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 130; i++) {
    const sx = box.x + rnd() * box.w;
    const sy = box.y + rnd() * box.h * 0.62;
    const r = rnd() * 1.7 + 0.4;
    ctx.globalAlpha = 0.35 + rnd() * 0.65;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#f4f1de';
  ctx.beginPath();
  ctx.arc(box.x + box.w * 0.24, box.y + box.h * 0.3, box.h * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0d1b3a';
  ctx.beginPath();
  ctx.arc(box.x + box.w * 0.28, box.y + box.h * 0.27, box.h * 0.08, 0, Math.PI * 2);
  ctx.fill();
  skyline(ctx, box, box.y + box.h * 0.92, '#02040a', 99, box.h * 0.5);
  // A scatter of lit windows in the skyline band.
  const rnd2 = seeded(1234);
  ctx.fillStyle = '#ffd97a';
  for (let i = 0; i < 90; i++) {
    const wx = box.x + rnd2() * box.w;
    const wy = box.y + box.h * (0.55 + rnd2() * 0.4);
    ctx.globalAlpha = 0.25 + rnd2() * 0.75;
    ctx.fillRect(wx, wy, 3.5, 5);
  }
  ctx.globalAlpha = 1;
}

function paintPalms(ctx, box) {
  const g = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
  g.addColorStop(0, '#0f7f7a');
  g.addColorStop(0.55, '#39c2a5');
  g.addColorStop(1, '#f7e08a');
  ctx.fillStyle = g;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  // Sun with retro banding gaps.
  const cx = box.x + box.w * 0.5;
  const cy = box.y + box.h * 0.46;
  const r = box.h * 0.3;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const sg = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  sg.addColorStop(0, '#ff5da2');
  sg.addColorStop(1, '#ffb347');
  ctx.fillStyle = sg;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(20,16,29,0.55)';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(cx - r, cy + r * (0.05 + i * 0.19), r * 2, r * 0.055 + i * 2);
  }
  ctx.restore();
  palmTree(ctx, box.x + box.w * 0.16, box.y + box.h, box.h * 0.62);
  palmTree(ctx, box.x + box.w * 0.88, box.y + box.h, box.h * 0.5);
  ctx.fillStyle = '#0d2b26';
  ctx.fillRect(box.x, box.y + box.h * 0.94, box.w, box.h * 0.06);
}

function palmTree(ctx, baseX, baseY, height) {
  ctx.strokeStyle = '#0d2b26';
  ctx.fillStyle = '#0d2b26';
  ctx.lineWidth = Math.max(6, height * 0.035);
  ctx.lineCap = 'round';
  const topX = baseX + height * 0.16;
  const topY = baseY - height;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + height * 0.02, baseY - height * 0.6, topX, topY);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.08 + i * 0.14);
    const len = height * 0.34;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.6, topY - Math.sin(a) * len * 0.75 - height * 0.05,
      topX + Math.cos(a) * len, topY - Math.sin(a) * len * 0.35 + height * 0.1,
    );
    ctx.stroke();
  }
}

// Paint one panel's artwork inside its polygon clip.
export function paintArtwork(ctx, kind, poly, images) {
  const box = bbox(poly);
  if ((kind === 'pier' || kind === 'boulevard') && images[kind]) {
    drawCoverImage(ctx, images[kind], box);
    return;
  }
  if (kind === 'night') paintNight(ctx, box);
  else if (kind === 'palms') paintPalms(ctx, box);
  else paintSunset(ctx, box); // photos that failed to load fall back to sunset
}

// Apply a colour grade over the panel that is currently clipped.
export function applyGrade(ctx, grade, poly) {
  if (grade === 'none') return;
  const box = bbox(poly);
  ctx.save();
  if (grade === 'mono') {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#7f7f7f';
    ctx.fillRect(box.x, box.y, box.w, box.h);
  } else if (grade === 'noir') {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.globalCompositeOperation = 'multiply';
    const g = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
    g.addColorStop(0, '#cfcfcf');
    g.addColorStop(1, '#4a4a4a');
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, box.h);
  } else {
    const colours = { gold: '#ff9d00', teal: '#00b3a4', magenta: '#ff2e88', violet: '#7b2ff7' };
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = colours[grade] || '#ffffff';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export function tracePanel(ctx, poly) {
  tracePath(ctx, poly);
}
