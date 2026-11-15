// js/spriteSlicer.js — Автонарізка AI-листів спрайтів за реальним вмістом, а не рівною сіткою.
// Ряди в листах ворогів лежать нерівно (напр. 33–230, 286–472, 522–774, 816–1011 з 1199),
// а 4-й ряд має 8 кадрів напрямків замість 6. Рівна сітка 6×4 різала кадри й тягнула шматки сусідніх.
// Результат: rows[r][c] = { x, y, w, h } — у ряду всі кадри однакового розміру, тож опорна точка
// (низ кадру = ноги) стабільна, а центр кадру стоїть на центрі фігури.

const ALPHA_MIN = 40;

function findRuns(counts, minCount, minLen) {
  const runs = [];
  let start = -1;
  for (let i = 0; i <= counts.length; i++) {
    const on = i < counts.length && counts[i] > minCount;
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      if (i - start >= minLen) runs.push([start, i]);
      start = -1;
    }
  }
  return runs;
}

// counts: кадрів у кожному ряду, напр. [6, 6, 6, 8]
export function sliceSheet(canvas, counts) {
  const W = canvas.width, H = canvas.height;
  let data;
  try {
    data = canvas.getContext('2d').getImageData(0, 0, W, H).data;
  } catch (e) {
    return null;
  }
  const opaque = (x, y) => data[(y * W + x) * 4 + 3] > ALPHA_MIN;

  // 1. Смуги рядів: проєкція непрозорих пікселів на вісь Y
  const rowCounts = new Array(H).fill(0);
  for (let y = 0; y < H; y++) {
    let n = 0;
    for (let x = 0; x < W; x += 2) if (opaque(x, y)) n++;
    rowCounts[y] = n;
  }
  let bands = findRuns(rowCounts, 2, 25);
  if (bands.length !== counts.length) {
    const rh = H / counts.length;
    bands = counts.map((_, r) => [Math.floor(r * rh), Math.floor((r + 1) * rh)]);
  }

  // 2. У кожній смузі — колонки за проєкцією на X; якщо злиплись (ефекти атаки), рівний поділ
  return bands.map(([y0, y1], r) => {
    const n = counts[r];
    const fw = Math.floor(W / n);
    const colCounts = new Array(W).fill(0);
    for (let x = 0; x < W; x++) {
      let c = 0;
      for (let y = y0; y < y1; y += 2) if (opaque(x, y)) c++;
      colCounts[x] = c;
    }
    // дрібні шматки (пил, бризки між кадрами) не рахуємо окремими кадрами
    const segs = findRuns(colCounts, 1, 15).filter(([a, b]) => b - a > fw * 0.3);
    const centers = segs.length === n
      ? segs.map(([a, b]) => (a + b) / 2)
      : Array.from({ length: n }, (_, c) => (c + 0.5) * (W / n));
    const top = Math.max(0, y0 - 3), bottom = Math.min(H, y1 + 3);
    return centers.map((cx) => ({
      x: Math.round(Math.max(0, Math.min(W - fw, cx - fw / 2))),
      y: top,
      w: fw,
      h: bottom - top,
    }));
  });
}
