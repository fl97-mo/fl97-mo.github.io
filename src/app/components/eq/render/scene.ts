import { clamp, lerp, smoothstep } from "../math";
import {
  BG_PIX_DENSITY,
  BG_PIX_MAX,
  BG_PIX_MIN,
  GRAVITY,
  LOOK_ATTACK,
  LOOK_BLEND_ATTACK,
  LOOK_BLEND_RELEASE,
  LOOK_MAX_PITCH,
  LOOK_MAX_YAW,
  LOOK_RELEASE,
  SCAN_ALPHA,
  SCENE_SILENCE_FLOOR,
  SCENE_SILENCE_SPAN,
  SCENE_VIS_ATTACK,
  SCENE_VIS_RELEASE,
  WALK_BASE_SPEED,
  WALK_IDLE_SPEED,
  WALK_MOTION_ATTACK,
  WALK_MOTION_RELEASE,
  WALK_SPEED_GAIN,
  WALKER_TRAIL_LEN,
} from "../constants";
import type { BgPix, Particle, PointerState, Star } from "../types";
import { bandEnergy, computeCols, updateStarBandsSmooth } from "../audio/bands";
import { initStars, drawStars } from "./stars";
import { drawWalker } from "./walkter";

type Ref<T> = { current: T };

export type DrawWalkersDeps = {
  visEdges: number[];

  walkersRef: Ref<HTMLCanvasElement | null>;
  pointerRef: Ref<PointerState>;

  ctxRef: Ref<AudioContext | null>;
  audioRef: Ref<HTMLAudioElement | null>;
  connectedRef: Ref<boolean>;
  freqBufRef: Ref<Uint8Array | null>;

  bgPixRef: Ref<{ w: number; h: number; pts: BgPix[] } | null>;

  starsRef: Ref<Star[] | null>;
  starsMetaRef: Ref<{ w: number; h: number } | null>;
  starBandsSmoothRef: Ref<Float32Array | null>;

  binRangesRef: Ref<Array<[number, number]>>;
  colHzRef: Ref<Float32Array | null>;
  colsLevelRef: Ref<Float32Array | null>;

  bassEnvRef: Ref<number>;
  beatFloorRef: Ref<number>;
  beatCooldownRef: Ref<number>;
  kickRef: Ref<number>;
  beatImpulseRef: Ref<number>;
  beatCountRef: Ref<number>;

  sceneVisRef: Ref<number>;

  waveAmpRef: Ref<number>;
  waveAlphaRef: Ref<number>;
  waveSpeedRef: Ref<number>;
  wavePhaseRef: Ref<number>;

  timeRef: Ref<number>;
  durationRef: Ref<number>;

  prevWalkerXRef: Ref<number | null>;
  dirRef: Ref<number>;
  phaseRef: Ref<number>;
  walkerMotionRef: Ref<number>;

  lookYawRef: Ref<number>;
  lookPitchRef: Ref<number>;
  lookActiveRef: Ref<number>;

  seekYRef: Ref<number>;
  seekVRef: Ref<number>;
  seekHeldRef: Ref<boolean>;
  seekVelNormRef: Ref<number>;

  trailRef: Ref<Array<{ x: number; footY: number }>>;
  particlesRef: Ref<Particle[]>;
};

export function drawWalkers(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  an: AnalyserNode | null,
  dt: number,
  nowMs: number,
  deps: DrawWalkersDeps
) {
  const dpr = window.devicePixelRatio || 1;
  const tNow = nowMs * 0.001;

  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  g.shadowBlur = 0;
  g.shadowOffsetX = 0;
  g.shadowOffsetY = 0;

  g.clearRect(0, 0, w, h);
  g.fillStyle = "rgba(0,0,0,0.14)";
  g.fillRect(0, 0, w, h);

  {
    const cache = deps.bgPixRef.current;
    if (!cache || cache.w !== w || cache.h !== h) {
      const n = clamp(Math.floor((w * h) / BG_PIX_DENSITY), BG_PIX_MIN, BG_PIX_MAX);
      const pts: BgPix[] = [];
      for (let i = 0; i < n; i++) {
        const s = Math.random() < 0.12 ? 2 : 1;
        pts.push({
          x: Math.floor(Math.random() * w),
          y: Math.floor(Math.random() * h * 0.86),
          a: 0.07 + Math.random() * 0.24,
          s,
          sp: 0.35 + Math.random() * 1.15,
          ph: Math.random() * Math.PI * 2,
        });
      }
      deps.bgPixRef.current = { w, h, pts };
    }

    const pts = deps.bgPixRef.current?.pts ?? [];
    const baseA = 0.78 + 0.22 * deps.sceneVisRef.current;

    g.save();
    g.globalCompositeOperation = "lighter";
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const tw2 = 0.62 + 0.38 * Math.sin(tNow * p.sp + p.ph);
      const aa = clamp(p.a * tw2 * baseA, 0, 0.34);

      if (aa <= 0.001) continue;
      g.fillStyle = `rgba(0,255,65,${aa.toFixed(3)})`;
      g.fillRect(p.x, p.y, p.s, p.s);
    }
    g.restore();
  }

  {
    const meta = deps.starsMetaRef.current;
    if (!deps.starsRef.current || !meta || meta.w !== w || meta.h !== h) {
      initStars(w, h, deps.visEdges, deps.starsRef, deps.starsMetaRef);
    }
  }

  const stars = deps.starsRef.current ?? [];

  const FRAME_PAD_PX = 2;
  const horizon = Math.floor(h - FRAME_PAD_PX * dpr);

  let bass = 0;
  let mids = 0;
  let air = 0;

  const freq = deps.freqBufRef.current;

  if (an && deps.connectedRef.current && freq) {
    const ctx = deps.ctxRef.current;
    const sr = ctx?.sampleRate ?? 0;

    an.getByteFrequencyData(freq);
    bass = bandEnergy(freq, sr, an.frequencyBinCount, 35, 180);
    mids = bandEnergy(freq, sr, an.frequencyBinCount, 250, 2600);
    air = bandEnergy(freq, sr, an.frequencyBinCount, 2400, 12000);

    const rawCols = computeCols(freq, deps.binRangesRef.current, deps.colHzRef.current, deps.colsLevelRef);
    updateStarBandsSmooth(rawCols, deps.starBandsSmoothRef);
  }

  const audio = deps.audioRef.current;
  const playing = !!audio && !audio.paused;

  const envPrev = deps.bassEnvRef.current;
  const kAtt = 1 - Math.exp(-dt * 18);
  const kRel = 1 - Math.exp(-dt * 6);
  const bassEnv = envPrev + (bass - envPrev) * (bass > envPrev ? kAtt : kRel);
  deps.bassEnvRef.current = bassEnv;

  const floorPrev = deps.beatFloorRef.current;
  const kFloor = 1 - Math.exp(-dt * 1.1);
  const floor = floorPrev + (bassEnv - floorPrev) * kFloor;
  deps.beatFloorRef.current = floor;

  const delta = Math.max(0, bassEnv - floor);
  const kickTarget = clamp(delta / 0.18, 0, 1);
  deps.kickRef.current = Math.max(deps.kickRef.current * Math.exp(-dt * 7.0), kickTarget);
  const kick = deps.kickRef.current;

  deps.beatCooldownRef.current = Math.max(0, deps.beatCooldownRef.current - dt);
  const ratio = bassEnv / Math.max(1e-4, floor);

  const beatNow =
    playing &&
    deps.beatCooldownRef.current <= 0 &&
    bassEnv > 0.08 &&
    (ratio > 1.65 || delta > 0.105);

  if (beatNow) {
    deps.beatCooldownRef.current = 0.18;
    deps.beatCountRef.current += 1;
  }

  deps.beatImpulseRef.current = Math.max(
    deps.beatImpulseRef.current * Math.exp(-dt * 6.5),
    beatNow ? 1 : 0
  );

  const beat = beatNow;
  const beatImpulse = deps.beatImpulseRef.current;
  const beatCount = deps.beatCountRef.current;

  const rawEnergy = clamp(bass * 0.68 + mids * 0.52 + air * 0.3 + kick * 0.55, 0, 1);

  const targetVis = playing ? clamp((rawEnergy - SCENE_SILENCE_FLOOR) / SCENE_SILENCE_SPAN, 0, 1) : 0;
  const prevVis = deps.sceneVisRef.current;
  const kVis = targetVis > prevVis ? SCENE_VIS_ATTACK : SCENE_VIS_RELEASE;
  const sceneVis = (deps.sceneVisRef.current = prevVis + (targetVis - prevVis) * kVis);

  drawStars(g, stars, dt, nowMs, an, freq, bass, mids, air, kick, beat, beatImpulse, sceneVis, beatCount, deps);

  if (SCAN_ALPHA > 0) {
    g.fillStyle = `rgba(0,255,65,${(SCAN_ALPHA * 0.55).toFixed(3)})`;
    const step = Math.max(2, Math.floor(4 * dpr));
    for (let y = 0; y < h; y += step) g.fillRect(0, y, w, 1);
  }

  g.strokeStyle = `rgba(0,255,65,${(0.14 + bass * 0.22 + kick * 0.12).toFixed(3)})`;
  g.lineWidth = Math.max(1, Math.floor(1 * dpr));
  g.beginPath();
  g.moveTo(0, h - 0.5);
  g.lineTo(w, h - 0.5);
  g.stroke();

  {
    const k = (base: number) => 1 - Math.pow(1 - base, dt * 60);

    const targetSpeed = 0.42 + mids * 0.18 + kick * 0.08;
    const targetAmp = (7.0 + mids * 7.5 + kick * 4.0) * dpr;
    const targetAlpha = clamp(0.055 + mids * 0.11 + kick * 0.07, 0.045, 0.24);

    deps.waveSpeedRef.current += (targetSpeed - deps.waveSpeedRef.current) * k(0.05);
    deps.waveAmpRef.current += (targetAmp - deps.waveAmpRef.current) * k(0.06);
    deps.waveAlphaRef.current += (targetAlpha - deps.waveAlphaRef.current) * k(0.05);

    deps.wavePhaseRef.current += dt * (deps.waveSpeedRef.current * 1.7);

    const a = deps.waveAlphaRef.current;
    const amp = deps.waveAmpRef.current;
    const ph = deps.wavePhaseRef.current;

    const baseLine = horizon - 9 * dpr;

    g.save();
    g.globalCompositeOperation = "lighter";
    g.strokeStyle = `rgba(0,255,65,${a.toFixed(3)})`;
    g.lineWidth = Math.max(1, Math.floor((1.0 + mids * 0.35 + kick * 0.2) * dpr));

    g.beginPath();
    const step = Math.max(2, Math.floor(6 * dpr));
    for (let x = 0; x <= w; x += step) {
      const t1 = x * 0.0105 + ph;
      const t2 = x * 0.021 + ph * 1.1;

      const osc1 = 0.5 + 0.5 * Math.sin(t1);
      const osc2 = 0.5 + 0.5 * Math.sin(t2);

      const y = baseLine - (osc1 * 0.82 + osc2 * 0.18) * amp;

      if (x === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
    g.restore();
  }

  if (audio) {
    const t = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    const d = Number.isFinite(audio.duration) ? audio.duration : deps.durationRef.current;
    deps.timeRef.current = t;
    deps.durationRef.current = d;
  }

  const dur = deps.durationRef.current;
  const cur = deps.timeRef.current;
  const prog = dur > 0.001 ? clamp(cur / dur, 0, 1) : 0;

  const trackL = w * 0.12;
  const trackR = w * 0.88;

  const walkerX = lerp(trackL, trackR, prog);

  const prevX = deps.prevWalkerXRef.current;
  const dx = prevX == null ? 0 : walkerX - prevX;

  if (Math.abs(dx) > 1e-4) deps.dirRef.current = Math.sign(dx) || deps.dirRef.current;
  const dir = deps.dirRef.current || 1;

  deps.prevWalkerXRef.current = walkerX;

  const expK = (base: number) => 1 - Math.pow(1 - base, dt * 60);

  const targetMotion = playing ? clamp(0.18 + sceneVis * 0.92, 0, 1) : 0;
  const prevMotion = deps.walkerMotionRef.current;
  const kM = targetMotion > prevMotion ? expK(WALK_MOTION_ATTACK) : expK(WALK_MOTION_RELEASE);
  const motion = (deps.walkerMotionRef.current = prevMotion + (targetMotion - prevMotion) * kM);

  const walkerAlpha = clamp(0.12 + sceneVis * 0.72 + bass * 0.12 + kick * 0.18, 0.1, 0.95);

  const speedTarget = WALK_BASE_SPEED + mids * WALK_SPEED_GAIN + kick * 1.2;
  deps.phaseRef.current += dt * lerp(WALK_IDLE_SPEED, speedTarget, motion);
  const phase = deps.phaseRef.current;

  // =========================
  // SEEK SPRING (KEEP!)
  // =========================
  const seekMax = 74 * dpr;

  {
    let y = deps.seekYRef.current;
    let v = deps.seekVRef.current;

    if (deps.seekHeldRef.current) {
      const target = -seekMax;
      const k = 70;
      const d = 16;
      const a = (target - y) * k - v * d;
      v += a * dt;
      y += v * dt;

      const wig =
        Math.sin(tNow * 9.0 + phase * 0.35) *
        (1.2 * dpr) *
        (0.25 + 0.75 * Math.abs(deps.seekVelNormRef.current));
      y += wig;
    } else {
      v += GRAVITY * dpr * dt;
      y += v * dt;
    }

    if (y > 0) {
      y = 0;
      if (v > 0) v *= -0.22;
      if (Math.abs(v) < 35 * dpr) v = 0;
    }

    deps.seekYRef.current = y;
    deps.seekVRef.current = v;
  }

  const hang = clamp(-deps.seekYRef.current / seekMax, 0, 1);
  const pullDir = deps.seekVelNormRef.current;

  const footY = horizon + deps.seekYRef.current;
  const grounded = deps.seekYRef.current >= -1;

  const baseYaw = dir * lerp(0.18, 0.92, smoothstep(0.08, 0.72, motion));

  let mouseYaw = 0;
  let mousePitch = 0;
  let wantLook = 0;

  const el = deps.walkersRef.current;
  if (el && deps.pointerRef.current.has) {
    const rect = el.getBoundingClientRect();
    const mx = (deps.pointerRef.current.cx - rect.left) * dpr;
    const my = (deps.pointerRef.current.cy - rect.top) * dpr;

    wantLook = 1;

    const approxHeadY = footY - 60 * dpr;
    const ddx = mx - walkerX;
    const ddy = my - approxHeadY;

    const yawN = clamp(ddx / (w * 0.32), -1, 1);
    const pitchN = clamp(ddy / (h * 0.28), -1, 1);

    const yawShaped = Math.sign(yawN) * Math.pow(Math.abs(yawN), 0.85);
    const pitchShaped = Math.sign(pitchN) * Math.pow(Math.abs(pitchN), 0.9);

    const weight = 0.55 + 0.45 * motion;

    mouseYaw = yawShaped * LOOK_MAX_YAW * weight;
    mousePitch = pitchShaped * LOOK_MAX_PITCH * weight;
  }

  {
    const prevA = deps.lookActiveRef.current;
    const kA = wantLook > prevA ? expK(LOOK_BLEND_ATTACK) : expK(LOOK_BLEND_RELEASE);
    deps.lookActiveRef.current = prevA + (wantLook - prevA) * kA;
  }

  const aLook = deps.lookActiveRef.current;
  const desiredYaw = lerp(baseYaw, mouseYaw, aLook);

  const backFrac = lerp(1.0, 0.22, smoothstep(0.15, 0.65, motion));
  const maxBack = LOOK_MAX_YAW * backFrac;

  let yawMin = -LOOK_MAX_YAW;
  let yawMax = LOOK_MAX_YAW;

  if (motion > 0.12) {
    if (dir >= 0) yawMin = -maxBack;
    else yawMax = maxBack;
  }

  const desiredYawClamped = clamp(desiredYaw, yawMin, yawMax);
  const desiredPitch = lerp(0, mousePitch, aLook);

  const speed = 0.35 + motion * 0.65;
  const att = expK(LOOK_ATTACK * speed);
  const rel = expK(LOOK_RELEASE * speed);

  {
    const prev = deps.lookYawRef.current;
    const k = Math.abs(desiredYawClamped) > Math.abs(prev) ? att : rel;
    deps.lookYawRef.current = clamp(prev + (desiredYawClamped - prev) * k, -LOOK_MAX_YAW, LOOK_MAX_YAW);
  }

  {
    const prev = deps.lookPitchRef.current;
    const k = Math.abs(desiredPitch) > Math.abs(prev) ? att : rel;
    deps.lookPitchRef.current = clamp(prev + (desiredPitch - prev) * k, -LOOK_MAX_PITCH, LOOK_MAX_PITCH);
  }

  const lookYaw = deps.lookYawRef.current;
  const lookPitch = deps.lookPitchRef.current;

  const bodyYawDraw = clamp(
    lerp(baseYaw, lookYaw, aLook * (0.35 + 0.25 * motion)),
    -LOOK_MAX_YAW,
    LOOK_MAX_YAW
  );

  const trail = deps.trailRef.current;
  if (WALKER_TRAIL_LEN > 0) {
    trail.unshift({ x: walkerX, footY });
    while (trail.length > WALKER_TRAIL_LEN) trail.pop();
  } else {
    if (trail.length) trail.length = 0;
  }

  drawWalker(
    g,
    walkerX,
    footY,
    1,
    phase,
    bass,
    mids,
    air,
    walkerAlpha,
    kick,
    motion,
    tNow,
    bodyYawDraw,
    lookYaw,
    lookPitch,
    horizon,
    dir,
    hang,
    pullDir,
    playing
  );

  const parts = deps.particlesRef.current;
  if (
    playing &&
    motion > 0.28 &&
    Math.abs(Math.sin(phase)) > 0.993 &&
    bass + kick > 0.16 &&
    grounded
  ) {
    const px = walkerX + Math.sin(phase) * (12 * dpr);
    const py = horizon + 1 * dpr;
    for (let i = 0; i < 6; i++) {
      parts.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * (32 * dpr) * (0.55 + bass + kick),
        vy: -(Math.random() * (62 * dpr) * (0.5 + bass + kick * 0.8)),
        life: 0.38 + Math.random() * 0.35,
      });
    }
  }

  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    p.vy += 115 * dpr * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const aa = clamp(p.life, 0, 1) * (0.12 + air * 0.2 + kick * 0.1) * motion;
    if (aa > 0.001) {
      g.fillStyle = `rgba(0,255,65,${aa.toFixed(3)})`;
      g.fillRect(
        Math.floor(p.x),
        Math.floor(p.y),
        Math.max(1, Math.floor(2 * dpr)),
        Math.max(1, Math.floor(2 * dpr))
      );
    }
    if (p.life <= 0 || p.y > h + 40) parts.splice(i, 1);
  }
}
