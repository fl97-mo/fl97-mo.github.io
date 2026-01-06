import {
  STAR_BEAT_GATE,
  STAR_BREATH_SPEED,
  STAR_CORE_ALPHA_BASE,
  STAR_CORE_ALPHA_MAX,
  STAR_CORE_ATTACK,
  STAR_CORE_R_BASE,
  STAR_CORE_R_JITTER,
  STAR_CORE_RELEASE,
  STAR_GAIN,
  STAR_PULSE_COOLDOWN,
  STAR_PULSE_GATE,
  STAR_PULSE_MAX,
  STAR_PULSE_RATE_GAIN,
  STAR_PULSE_RATE_KICK_GAIN,
  STAR_PULSE_RATE_MIN,
  STAR_PULSE_SPEED,
  STAR_RING_ALPHA_BASE,
  STAR_RING_ALPHA_GAIN,
  STAR_RING_R_MAX,
  STAR_RING_R_MIN,
  STAR_RING_THICK_MAX,
  STAR_RING_THICK_MIN,
  STAR_COUNT_MAX,
  STAR_COUNT_MIN,
  VIS_COLUMNS,
} from "../constants";
import { clamp, lerp } from "../math";
import type { Star } from "../types";

type Ref<T> = { current: T };

export function initStars(
  w: number,
  h: number,
  visEdges: number[],
  starsRef: Ref<Star[] | null>,
  starsMetaRef: Ref<{ w: number; h: number } | null>
) {
  const shuffle = <T,>(arr: T[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  };

  const n = clamp(Math.floor((w * h) / 76000), STAR_COUNT_MIN, STAR_COUNT_MAX);
  const cols = shuffle(Array.from({ length: VIS_COLUMNS }, (_, i) => i));
  const stars: Star[] = [];

  for (let i = 0; i < n; i++) {
    const col = i < cols.length ? cols[i] : Math.floor(Math.random() * VIS_COLUMNS);

    const xBase = ((col + 0.5) / VIS_COLUMNS) * w;
    const xJit = (Math.random() - 0.5) * (w / VIS_COLUMNS) * 0.8;
    const baseX = clamp(xBase + xJit, 10, w - 10);

    const baseY = Math.random() * (h * 0.56) + h * 0.08;

    const hz0 = visEdges[col] ?? 0;
    const hz1 = visEdges[col + 1] ?? hz0 + 1;
    const hz = hz0 + Math.random() * (hz1 - hz0);

    stars.push({
      baseX,
      baseY,
      col,
      hz,
      bin: -1,
      baseR: STAR_CORE_R_BASE + Math.random() * STAR_CORE_R_JITTER,
      seed: Math.random() * 1000,
      core: 0,
      pulses: [],
      pulsePhase: Math.random(),
      cd: Math.random() * STAR_PULSE_COOLDOWN,
    });
  }

  starsRef.current = stars;
  starsMetaRef.current = { w, h };
}

export function drawStars(
  g: CanvasRenderingContext2D,
  stars: Star[],
  dt: number,
  nowMs: number,
  an: AnalyserNode | null,
  freq: Uint8Array | null,
  bass: number,
  mids: number,
  air: number,
  kick: number,
  beat: boolean,
  beatImpulse: number,
  sceneVis: number,
  beatCount: number,
  deps: {
    connectedRef: Ref<boolean>;
    ctxRef: Ref<AudioContext | null>;
    starBandsSmoothRef: Ref<Float32Array | null>;
  }
) {
  const dpr = window.devicePixelRatio || 1;
  const sb = deps.starBandsSmoothRef.current;
  const hasAudio = !!(an && deps.connectedRef.current && freq);

  const ensureBins = (stars2: Star[], an2: AnalyserNode) => {
    const ctx = deps.ctxRef.current;
    if (!ctx) return;
    const ny = ctx.sampleRate / 2;
    const n = an2.frequencyBinCount;
    for (const s of stars2) {
      if (s.bin >= 0) continue;
      const bin = Math.floor((s.hz / ny) * n);
      s.bin = clamp(bin, 0, n - 1);
    }
  };

  if (hasAudio && an) ensureBins(stars, an);

  const t = nowMs * 0.001;
  const pulseSpeed = STAR_PULSE_SPEED + bass * 0.08 + kick * 0.1;

  const sceneV = clamp(sceneVis, 0, 1);
  const vis = clamp(0.22 + 0.78 * sceneV, 0, 1);
  const visPow = Math.pow(vis, 1.0);

  const nStars = stars.length || 1;
  const forcedA = beat ? beatCount % nStars : -1;
  const forcedB = beat ? (beatCount * 7) % nStars : -1;

  for (let si = 0; si < stars.length; si++) {
    const s = stars[si];

    const inputRaw = hasAudio
      ? sb
        ? sb[s.col] ?? 0
        : s.bin >= 0
        ? ((freq![s.bin] ?? 0) / 255)
        : 0
      : 0;

    const input = clamp(inputRaw * STAR_GAIN, 0, 1);

    const kCore = input > s.core ? STAR_CORE_ATTACK : STAR_CORE_RELEASE;
    s.core = s.core + (input - s.core) * kCore;

    s.cd = Math.max(0, s.cd - dt);

    for (let i = s.pulses.length - 1; i >= 0; i--) {
      s.pulses[i] += dt * pulseSpeed;
      if (s.pulses[i] >= 1) s.pulses.splice(i, 1);
    }

    if (sceneV > 0.06) {
      const lowWeight = clamp(1 - (s.hz - 70) / 1200, 0, 1);
      const baseChance =
        (0.06 + 0.22 * lowWeight) *
        (0.45 + 0.55 * sceneV) *
        (0.65 + 0.85 * beatImpulse);

      const forceThis = si === forcedA || si === forcedB;

      const rate =
        STAR_PULSE_RATE_MIN +
        STAR_PULSE_RATE_GAIN * input +
        STAR_PULSE_RATE_KICK_GAIN * kick;

      s.pulsePhase += dt * rate;

      const wantFlow = input > STAR_PULSE_GATE && s.pulsePhase >= 1;
      const wantBeat = beat && input > STAR_BEAT_GATE && (forceThis || Math.random() < baseChance);

      if (s.cd <= 0 && (wantFlow || wantBeat)) {
        s.pulses.unshift(0);
        s.cd = STAR_PULSE_COOLDOWN * (0.75 + Math.random() * 0.45);
        if (wantFlow) s.pulsePhase -= 1;
        if (s.pulses.length > STAR_PULSE_MAX) s.pulses.length = STAR_PULSE_MAX;
      }
    } else {
      s.pulsePhase += dt * STAR_PULSE_RATE_MIN * 0.25;
    }

    const breath = 0.97 + 0.03 * Math.sin(t * STAR_BREATH_SPEED + s.seed * 0.25);

    const cx = s.baseX;
    const cy = s.baseY;

    const rCore = s.baseR * dpr;
    const beatLift = 1 + beatImpulse * 0.28;

    const coreA0 =
      (STAR_CORE_ALPHA_BASE + s.core * (STAR_CORE_ALPHA_MAX - STAR_CORE_ALPHA_BASE)) *
      breath *
      beatLift;

    const coreA = clamp(coreA0 * visPow, 0, 0.98);
    if (coreA <= 0.002) continue;

    const haloA = clamp(coreA * (0.2 + air * 0.22 + beatImpulse * 0.12), 0, 0.34);
    if (haloA > 0.001) {
      g.strokeStyle = `rgba(0,255,65,${haloA.toFixed(3)})`;
      g.lineWidth = Math.max(1, Math.floor(1.2 * dpr));
      g.beginPath();
      g.arc(cx, cy, rCore * 2.25, 0, Math.PI * 2);
      g.stroke();
    }

    g.fillStyle = `rgba(0,255,65,${coreA.toFixed(3)})`;
    g.beginPath();
    g.arc(cx, cy, rCore, 0, Math.PI * 2);
    g.fill();

    const rimA = clamp(coreA * 0.62, 0, 0.7);
    if (rimA > 0.001) {
      g.strokeStyle = `rgba(0,255,65,${rimA.toFixed(3)})`;
      g.lineWidth = Math.max(1, Math.floor(1 * dpr));
      g.beginPath();
      g.arc(cx, cy, rCore * 1.06, 0, Math.PI * 2);
      g.stroke();
    }

    const innerA = clamp(coreA * 0.22, 0, 0.24);
    if (innerA > 0.001) {
      g.fillStyle = `rgba(0,255,65,${innerA.toFixed(3)})`;
      g.beginPath();
      g.arc(cx - rCore * 0.12, cy - rCore * 0.14, rCore * 0.44, 0, Math.PI * 2);
      g.fill();
    }

    g.save();
    g.globalCompositeOperation = "lighter";

    const sparkle = clamp(0.35 + s.core * 1.15 + kick * 0.85 + beatImpulse * 1.15, 0, 2.8);
    const spike = rCore * (1.55 + sparkle * 0.85);
    const spikeA = clamp(coreA * (0.12 + sparkle * 0.11), 0, 0.48);

    if (spikeA > 0.001) {
      g.strokeStyle = `rgba(0,255,65,${spikeA.toFixed(3)})`;
      g.lineWidth = Math.max(1, Math.floor(1 * dpr));
      g.beginPath();
      g.moveTo(cx - spike, cy);
      g.lineTo(cx + spike, cy);
      g.moveTo(cx, cy - spike);
      g.lineTo(cx, cy + spike);
      g.stroke();
    }

    for (let i = 0; i < s.pulses.length; i++) {
      const p = s.pulses[i];
      const fade = Math.pow(1 - p, 1.85);

      const rr = rCore * 1.12 + lerp(STAR_RING_R_MIN, STAR_RING_R_MAX, p) * dpr;
      const thick = lerp(STAR_RING_THICK_MAX, STAR_RING_THICK_MIN, p) * dpr;

      const amp =
        (0.18 + 0.82 * s.core) *
        (0.42 + 0.58 * kick) *
        (0.75 + 0.85 * beatImpulse);

      const ringA = clamp(
        (STAR_RING_ALPHA_BASE + STAR_RING_ALPHA_GAIN * amp) *
          fade *
          (0.9 + 0.1 * mids) *
          visPow,
        0,
        0.92
      );

      if (ringA <= 0.001) continue;

      g.strokeStyle = `rgba(0,255,65,${ringA.toFixed(3)})`;
      g.lineWidth = Math.max(1, thick);
      g.beginPath();
      g.arc(cx, cy, rr, 0, Math.PI * 2);
      g.stroke();

      const glowA = ringA * 0.22;
      if (glowA > 0.001) {
        g.strokeStyle = `rgba(0,255,65,${glowA.toFixed(3)})`;
        g.lineWidth = Math.max(1, thick * 2.1);
        g.beginPath();
        g.arc(cx, cy, rr, 0, Math.PI * 2);
        g.stroke();
      }
    }

    g.restore();
  }
}
