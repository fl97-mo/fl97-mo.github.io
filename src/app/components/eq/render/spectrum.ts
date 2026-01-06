import {
  BAR_ATTACK,
  BAR_RELEASE,
  COL_FILL,
  COL_GAP_PX,
  GRID_ALPHA,
  MAP_HIGH_P,
  MAP_LOW_HZ,
  MAP_LOW_P,
  MAP_MID_HZ,
  MAP_MID_P,
  MAX_HZ,
  MIN_HZ,
  PEAK_DECAY,
  PEAK_THICK_PX,
  SCAN_ALPHA,
  SEG_GAP_PX,
  SEGMENTS,
  VIS_COLUMNS,
} from "../constants";
import { clamp } from "../math";
import { computeCols, updateStarBandsSmooth } from "../audio/bands";

type Ref<T> = { current: T };

export type DrawSpectrumDeps = {
  connectedRef: Ref<boolean>;

  binRangesRef: Ref<Array<[number, number]>>;
  colHzRef: Ref<Float32Array | null>;

  smoothRef: Ref<Float32Array | null>;
  peaksRef: Ref<Float32Array | null>;
  colsLevelRef: Ref<Float32Array | null>;
  starBandsSmoothRef: Ref<Float32Array | null>;

  freqBufRef: Ref<Uint8Array | null>;
  timeBufRef: Ref<Uint8Array | null>;
};

function formatHz(hz: number) {
  if (hz >= 1000) {
    const k = hz / 1000;
    const str = k >= 10 ? k.toFixed(0) : k.toFixed(1);
    return `${str}k`;
  }
  return `${Math.round(hz)}`;
}

function hzToXNorm(hz: number) {
  const lowEnd = clamp(MAP_LOW_HZ, MIN_HZ + 1, MAX_HZ - 1);
  const midEnd = clamp(MAP_MID_HZ, lowEnd + 10, MAX_HZ - 1);

  const pL = MAP_LOW_P;
  const pM = MAP_MID_P;
  const pH = MAP_HIGH_P;

  const L0 = Math.log(MIN_HZ);
  const L1 = Math.log(lowEnd);
  const M0 = Math.log(lowEnd);
  const M1 = Math.log(midEnd);
  const H0 = Math.log(midEnd);
  const H1 = Math.log(MAX_HZ);

  const x = clamp(hz, MIN_HZ, MAX_HZ);

  if (x <= lowEnd) {
    const t = (Math.log(x) - L0) / Math.max(1e-9, L1 - L0);
    return clamp(pL * t, 0, 1);
  }
  if (x <= midEnd) {
    const t = (Math.log(x) - M0) / Math.max(1e-9, M1 - M0);
    return clamp(pL + pM * t, 0, 1);
  }
  const t = (Math.log(x) - H0) / Math.max(1e-9, H1 - H0);
  return clamp(pL + pM + pH * t, 0, 1);
}

export function drawSpectrum(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  an: AnalyserNode | null,
  tickList: number[],
  deps: DrawSpectrumDeps
) {
  const dpr = window.devicePixelRatio || 1;
  const labelH = Math.floor(26 * dpr);
  const plotH = Math.max(1, h - labelH);

  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  g.shadowBlur = 0;
  g.shadowOffsetX = 0;
  g.shadowOffsetY = 0;

  g.clearRect(0, 0, w, h);
  g.fillStyle = "rgba(0,0,0,0.14)";
  g.fillRect(0, 0, w, h);

  const cols = VIS_COLUMNS;
  const colW = w / cols;

  const colGap = Math.max(0, Math.floor(COL_GAP_PX * dpr));
  const segGap = Math.max(0, Math.floor(SEG_GAP_PX * dpr));
  const innerW = Math.max(1, Math.floor(colW * COL_FILL) - colGap);

  const totalGapH = (SEGMENTS - 1) * segGap;
  const segH = Math.max(1, Math.floor((plotH - totalGapH) / SEGMENTS));
  const usedH = SEGMENTS * segH + totalGapH;
  const topPad = Math.max(0, Math.floor((plotH - usedH) / 2));

  if (GRID_ALPHA > 0) {
    g.strokeStyle = `rgba(0,255,65,${GRID_ALPHA})`;
    g.lineWidth = 1;
    for (let s = 0; s <= SEGMENTS; s++) {
      const y = topPad + s * (segH + segGap);
      const yy = Math.floor(y) + 0.5;
      g.beginPath();
      g.moveTo(0, yy);
      g.lineTo(w, yy);
      g.stroke();
    }
  }

  const ranges = deps.binRangesRef.current;
  const centers = deps.colHzRef.current;

  if (an && deps.connectedRef.current && ranges.length === cols && centers && centers.length === cols) {
    const freq = deps.freqBufRef.current;
    const time = deps.timeBufRef.current;
    if (!freq || !time) return;

    an.getByteFrequencyData(freq);

    let smooth = deps.smoothRef.current;
    if (!smooth || smooth.length !== cols) {
      smooth = new Float32Array(cols);
      deps.smoothRef.current = smooth;
    }

    let peaks = deps.peaksRef.current;
    if (!peaks || peaks.length !== cols) {
      peaks = new Float32Array(cols);
      deps.peaksRef.current = peaks;
    }

    const rawCols = computeCols(freq, ranges, centers, deps.colsLevelRef);
    if (!rawCols) return;

    updateStarBandsSmooth(rawCols, deps.starBandsSmoothRef);

    for (let i = 0; i < cols; i++) {
      const t = rawCols[i];

      const prev = smooth[i] ?? 0;
      const k = t > prev ? BAR_ATTACK : BAR_RELEASE;
      const next = prev + (t - prev) * k;
      smooth[i] = next;

      const pPrev = peaks[i] ?? 0;
      peaks[i] = Math.max(next, pPrev - PEAK_DECAY);

      const lit = clamp(Math.floor(next * (SEGMENTS + 1e-6)), 0, SEGMENTS);

      const x0 = Math.floor(i * colW);
      const x = x0 + Math.floor((colW - innerW) / 2);

      for (let sIdx = 0; sIdx < lit; sIdx++) {
        const yy = topPad + (SEGMENTS - 1 - sIdx) * (segH + segGap);
        const tA = 1 - sIdx / Math.max(1, SEGMENTS - 1);
        const alpha = 0.22 + 0.7 * tA;
        g.fillStyle = `rgba(0,255,65,${alpha.toFixed(3)})`;
        g.fillRect(x, yy, innerW, segH);
      }

      const peakSeg = clamp(Math.floor(peaks[i] * (SEGMENTS - 1)), 0, SEGMENTS - 1);
      const peakY = topPad + (SEGMENTS - 1 - peakSeg) * (segH + segGap);

      g.fillStyle = "rgba(0,255,65,0.85)";
      g.fillRect(
        x,
        peakY - Math.max(1, Math.floor(PEAK_THICK_PX * dpr)),
        innerW,
        Math.max(1, Math.floor(PEAK_THICK_PX * dpr))
      );
    }

    if (SCAN_ALPHA > 0) {
      g.fillStyle = `rgba(0,255,65,${SCAN_ALPHA})`;
      const step = Math.max(2, Math.floor(3 * dpr));
      for (let y = 0; y < plotH; y += step) g.fillRect(0, y, w, 1);
    }

    g.strokeStyle = `rgba(0,255,65,${GRID_ALPHA * 1.4})`;
    g.lineWidth = 1;
    for (const hz of tickList) {
      const xn = hzToXNorm(hz);
      const x = Math.floor(xn * w) + 0.5;
      g.beginPath();
      g.moveTo(x, plotH);
      g.lineTo(x, plotH + Math.floor(6 * dpr));
      g.stroke();
    }

    g.fillStyle = "rgba(0,255,65,0.7)";
    g.font = `${Math.max(10, Math.floor(10 * dpr))}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
    g.textBaseline = "top";
    for (const hz of tickList) {
      const xn = hzToXNorm(hz);
      const x = Math.floor(xn * w);
      const label = formatHz(hz);
      const tw = g.measureText(label).width;
      const xx = clamp(x - tw / 2, 2, w - tw - 2);
      g.fillText(label, xx, plotH + Math.floor(8 * dpr));
    }

    an.getByteTimeDomainData(time);
  } else {
    g.fillStyle = "rgba(0,255,65,0.65)";
    g.font = `${Math.max(12, Math.round(12 * dpr))}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
    g.fillText("SPECTRUM OFFLINE", 12 * dpr, 18 * dpr);
  }
}
