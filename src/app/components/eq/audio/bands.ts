import { STAR_BAND_ATTACK, STAR_BAND_RELEASE } from "../constants";
import { clamp } from "../math";

type Ref<T> = { current: T };

export function bandEnergy(
  freq: Uint8Array,
  sampleRate: number,
  binCount: number,
  hz0: number,
  hz1: number
) {
  if (!sampleRate || !binCount) return 0;

  const ny = sampleRate / 2;
  const n = binCount;

  const s = clamp(Math.floor((hz0 / ny) * n), 0, n - 1);
  const e = clamp(Math.ceil((hz1 / ny) * n), s + 1, n);

  let acc = 0;
  let count = 0;

  for (let i = s; i < e; i++) {
    const v = (freq[i] ?? 0) / 255;
    acc += v * v;
    count++;
  }

  const rms = count ? Math.sqrt(acc / count) : 0;
  return clamp(Math.pow(rms, 0.95), 0, 1);
}

export function computeCols(
  freq: Uint8Array,
  ranges: Array<[number, number]>,
  centers: Float32Array | null,
  colsLevelRef: Ref<Float32Array | null>
) {
  const cols = ranges.length;
  if (!cols || !centers || centers.length !== cols) return null;

  let out = colsLevelRef.current;
  if (!out || out.length !== cols) {
    out = new Float32Array(cols);
    colsLevelRef.current = out;
  }

  for (let i = 0; i < cols; i++) {
    const [s, e] = ranges[i];
    let m = 0;
    for (let b = s; b < e; b++) {
      const v = (freq[b] ?? 0) / 255;
      if (v > m) m = v;
    }

    const cHz = centers[i] ?? 0;
    let comp = Math.pow(cHz / 1200, 0.06);
    comp = clamp(comp, 0.9, 1.18);

    let t = Math.pow(m, 1.35) * comp;
    t = clamp(t, 0, 1);
    out[i] = t;
  }

  for (let i = 0; i < cols; i++) {
    const a = out[i];
    const l = i > 0 ? out[i - 1] : a;
    const r = i < cols - 1 ? out[i + 1] : a;
    out[i] = clamp(l * 0.18 + a * 0.64 + r * 0.18, 0, 1);
  }

  return out;
}

export function updateStarBandsSmooth(cols: Float32Array | null, starBandsSmoothRef: Ref<Float32Array | null>) {
  const sb = starBandsSmoothRef.current;
  if (!sb || !cols) return;

  const n = Math.min(sb.length, cols.length);
  for (let i = 0; i < n; i++) {
    const t = cols[i] ?? 0;
    const prev = sb[i] ?? 0;
    const k = t > prev ? STAR_BAND_ATTACK : STAR_BAND_RELEASE;
    sb[i] = prev + (t - prev) * k;
  }
}
