import {
  MAP_HIGH_P,
  MAP_LOW_HZ,
  MAP_LOW_P,
  MAP_MID_HZ,
  MAX_HZ,
  MIN_HZ,
} from "./constants";

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / Math.max(1e-9, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function formatTime(sec: number) {
  if (!Number.isFinite(sec)) return "0:00";
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function formatHz(hz: number) {
  if (hz >= 1000) {
    const k = hz / 1000;
    const str = k >= 10 ? k.toFixed(0) : k.toFixed(1);
    return `${str}k`;
  }
  return `${Math.round(hz)}`;
}

export function logSpace(min: number, max: number, count: number) {
  const out: number[] = [];
  const a = Math.log(min);
  const b = Math.log(max);
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    out.push(Math.exp(a + (b - a) * t));
  }
  return out;
}

export function makeMidEmphasisEdges(cols: number) {
  const lowCols = Math.max(1, Math.round(cols * MAP_LOW_P));
  const highCols = Math.max(1, Math.round(cols * MAP_HIGH_P));
  const midCols = Math.max(1, cols - lowCols - highCols);

  const lowEnd = clamp(MAP_LOW_HZ, MIN_HZ + 1, MAX_HZ - 1);
  const midEnd = clamp(MAP_MID_HZ, lowEnd + 10, MAX_HZ - 1);

  const a = logSpace(MIN_HZ, lowEnd, lowCols + 1);
  const b = logSpace(lowEnd, midEnd, midCols + 1);
  const c = logSpace(midEnd, MAX_HZ, highCols + 1);

  return [...a.slice(0, -1), ...b.slice(0, -1), ...c];
}
