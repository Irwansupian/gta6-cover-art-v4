// main.js — Vice Panel Studio's editor.
//
// Reads the control panel, keeps the cover's state, paints the cover onto
// the canvas (panels, grades, title block, rating badge) and exports PNGs.
// A `?shot=cover` URL hides the controls for screenshots; layout, title,
// subtitle and rating can also be preset from the query string.

import {
  COVER_W, COVER_H, LAYOUTS, ART_KINDS, ART_LABELS, GRADES, GRADE_LABELS,
  paintArtwork, applyGrade, tracePanel,
} from './panels.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const ctx = canvas.getContext('2d');
const status = $('status');

const DEFAULT_PANELS = [
  { art: 'pier', grade: 'gold' },
  { art: 'sunset', grade: 'teal' },
  { art: 'boulevard', grade: 'magenta' },
  { art: 'night', grade: 'violet' },
];

const state = {
  title: 'NEON TIDE',
  subtitle: 'Vice Dreams',
  rating: 'M',
  layout: 'trio',
  panels: DEFAULT_PANELS.map((p) => ({ ...p })),
};

const images = { pier: null, boulevard: null };

function loadPhoto(name, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { images[name] = img; resolve(); };
    img.onerror = () => resolve(); // paintArtwork falls back to a scene
    img.src = src;
  });
}

// Fonts matter to the title; wait for them, but never hang on them.
function fontsSettled() {
  if (!document.fonts || !document.fonts.ready) return Promise.resolve();
  const loads = [
    document.fonts.load('100px Anton'),
    document.fonts.load('40px Pacifico'),
  ];
  const all = Promise.all(loads).then(() => document.fonts.ready).catch(() => {});
  const timeout = new Promise((resolve) => setTimeout(resolve, 1500));
  return Promise.race([all, timeout]);
}

function fitPanels() {
  const count = LAYOUTS[state.layout].panels.length;
  while (state.panels.length < count) {
    state.panels.push({ ...DEFAULT_PANELS[state.panels.length % DEFAULT_PANELS.length] });
  }
}

function buildPanelControls() {
  fitPanels();
  const host = $('panelControls');
  host.textContent = '';
  const count = LAYOUTS[state.layout].panels.length;
  for (let i = 0; i < count; i++) {
    const box = document.createElement('fieldset');
    box.className = 'panelctl';
    const legend = document.createElement('legend');
    legend.textContent = 'Panel ' + (i + 1);
    box.appendChild(legend);
    const row = document.createElement('div');
    row.className = 'row';
    const artSel = document.createElement('select');
    for (const kind of ART_KINDS) {
      const opt = document.createElement('option');
      opt.value = kind;
      opt.textContent = ART_LABELS[kind];
      artSel.appendChild(opt);
    }
    artSel.value = state.panels[i].art;
    artSel.addEventListener('change', () => { state.panels[i].art = artSel.value; render(); });
    const gradeSel = document.createElement('select');
    for (const grade of GRADES) {
      const opt = document.createElement('option');
      opt.value = grade;
      opt.textContent = GRADE_LABELS[grade];
      gradeSel.appendChild(opt);
    }
    gradeSel.value = state.panels[i].grade;
    gradeSel.addEventListener('change', () => { state.panels[i].grade = gradeSel.value; render(); });
    row.appendChild(artSel);
    row.appendChild(gradeSel);
    box.appendChild(row);
    host.appendChild(box);
  }
}

function roundRectPath(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawBadge() {
  const x = 44, y = 44, w = 104, h = 128;
  ctx.save();
  ctx.fillStyle = '#0a0a0c';
  roundRectPath(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const letter = state.rating === '18' ? '18' : state.rating;
  ctx.font = (letter.length > 1 ? 56 : 74) + 'px Anton, sans-serif';
  ctx.fillText(letter, x + w / 2, y + 52);
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillText('RATING', x + w / 2, y + h - 24);
  ctx.restore();
}

function drawBarcode() {
  // A little title-seeded barcode in the bottom-right corner, like a real box.
  let seed = 7;
  for (const ch of state.title) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  let x = COVER_W - 196;
  const y = COVER_H - 58;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillRect(x - 10, y - 8, 168, 46);
  ctx.fillStyle = '#111';
  while (x < COVER_W - 58) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const w = 2 + (seed % 4) * 2;
    if (seed % 3 !== 0) ctx.fillRect(x, y, w, 30);
    x += w + 3;
  }
  ctx.restore();
}

function drawTitleBlock() {
  // Scrim so the type stays readable over any panel.
  const g = ctx.createLinearGradient(0, COVER_H - 430, 0, COVER_H);
  g.addColorStop(0, 'rgba(5,2,12,0)');
  g.addColorStop(0.45, 'rgba(5,2,12,0.55)');
  g.addColorStop(1, 'rgba(5,2,12,0.88)');
  ctx.fillStyle = g;
  ctx.fillRect(0, COVER_H - 430, COVER_W, 430);

  ctx.save();
  ctx.textAlign = 'center';
  try { ctx.letterSpacing = '3px'; } catch { /* older engines: no tracking */ }
  ctx.font = '148px Anton, sans-serif';
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#12061f';
  const title = (state.title || 'UNTITLED').toUpperCase();
  // Shrink to fit rather than overflow the frame.
  while (ctx.measureText(title).width > COVER_W - 90) {
    const size = parseInt(ctx.font, 10) - 8;
    if (size < 48) break;
    ctx.font = size + 'px Anton, sans-serif';
  }
  ctx.strokeText(title, COVER_W / 2, COVER_H - 218);
  const grad = ctx.createLinearGradient(0, COVER_H - 330, 0, COVER_H - 190);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.55, '#ffd3e8');
  grad.addColorStop(1, '#ff5da2');
  ctx.fillStyle = grad;
  ctx.fillText(title, COVER_W / 2, COVER_H - 218);

  if (state.subtitle) {
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
    ctx.font = '64px Pacifico, cursive';
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(10,20,20,0.85)';
    ctx.strokeText(state.subtitle, COVER_W / 2, COVER_H - 108);
    ctx.fillStyle = '#7de8d3';
    ctx.fillText(state.subtitle, COVER_W / 2, COVER_H - 108);
  }
  ctx.restore();
}

function drawVignette() {
  const g = ctx.createRadialGradient(
    COVER_W / 2, COVER_H / 2, COVER_H * 0.32,
    COVER_W / 2, COVER_H / 2, COVER_H * 0.78,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, COVER_W, COVER_H);
}

function render() {
  fitPanels();
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, COVER_W, COVER_H);
  const polys = LAYOUTS[state.layout].panels;
  polys.forEach((poly, i) => {
    ctx.save();
    tracePanel(ctx, poly);
    ctx.clip();
    paintArtwork(ctx, state.panels[i].art, poly, images);
    applyGrade(ctx, state.panels[i].grade, poly);
    ctx.restore();
  });
  // Gutters and frame.
  ctx.save();
  ctx.lineJoin = 'round';
  for (const poly of polys) {
    tracePanel(ctx, poly);
    ctx.lineWidth = 15;
    ctx.strokeStyle = '#050505';
    ctx.stroke();
  }
  ctx.lineWidth = 26;
  ctx.strokeStyle = '#050505';
  ctx.strokeRect(0, 0, COVER_W, COVER_H);
  ctx.restore();

  drawVignette();
  drawBadge();
  drawTitleBlock();
  drawBarcode();
}

function syncControlsFromState() {
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('layout').value = state.layout;
  $('rating').value = state.rating;
  buildPanelControls();
}

function applyQuery() {
  const q = new URLSearchParams(location.search);
  if (q.get('title')) state.title = q.get('title').slice(0, 24);
  if (q.get('sub')) state.subtitle = q.get('sub').slice(0, 40);
  if (q.get('rating') && ['RP', 'M', '18', 'AO'].includes(q.get('rating'))) state.rating = q.get('rating');
  if (q.get('layout') && LAYOUTS[q.get('layout')]) state.layout = q.get('layout');
  if (q.get('shot') === 'cover') document.body.classList.add('shot-cover');
}

function wire() {
  $('title').addEventListener('input', (e) => { state.title = e.target.value; render(); });
  $('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
  $('rating').addEventListener('change', (e) => { state.rating = e.target.value; render(); });
  $('layout').addEventListener('change', (e) => {
    state.layout = e.target.value;
    buildPanelControls();
    render();
  });
  $('shuffle').addEventListener('click', () => {
    state.panels = state.panels.map((p, i) => ({
      art: ART_KINDS[(ART_KINDS.indexOf(p.art) + 1 + i) % ART_KINDS.length],
      grade: GRADES[(GRADES.indexOf(p.grade) + 2) % GRADES.length],
    }));
    buildPanelControls();
    render();
  });
  $('export').addEventListener('click', () => {
    canvas.toBlob((blob) => {
      if (!blob) { status.textContent = 'Export failed in this browser.'; return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (state.title || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-cover.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      status.textContent = 'PNG exported at 1080 x 1350.';
    }, 'image/png');
  });
}

async function boot() {
  applyQuery();
  syncControlsFromState();
  wire();
  render(); // first paint even before photos/fonts arrive
  await Promise.all([loadPhoto('pier', './samples/pier.jpg'), loadPhoto('boulevard', './samples/boulevard.jpg')]);
  await fontsSettled();
  render();
  window.__vpsReady = true;
}

boot().catch((err) => {
  status.textContent = 'Something went wrong: ' + err.message;
  window.__vpsReady = true;
});
