import { useEffect, useRef } from "react";
import type { BgPix, Particle, PointerState, Star, U8 } from "./types";
import { drawSpectrum } from "./render/spectrum";
import { drawWalkers } from "./render/scene";

type Ref<T> = { current: T };

export type UseEqLoopArgs = {
  tickList: number[];
  visEdges: number[];

  pointerRef: Ref<{ cx: number; cy: number; has: boolean }>;
  audioRef: Ref<HTMLAudioElement | null>;

  spectrumRef: Ref<HTMLCanvasElement | null>;
  walkersRef: Ref<HTMLCanvasElement | null>;

  ctxRef: Ref<AudioContext | null>;
  analyserRef: Ref<AnalyserNode | null>;
  connectedRef: Ref<boolean>;

  binRangesRef: Ref<Array<[number, number]>>;
  colHzRef: Ref<Float32Array | null>;
  smoothRef: Ref<Float32Array | null>;
  peaksRef: Ref<Float32Array | null>;
  colsLevelRef: Ref<Float32Array | null>;
  starBandsSmoothRef: Ref<Float32Array | null>;

  freqBufRef: Ref<U8 | null>;
  timeBufRef: Ref<U8 | null>;

  starsRef: Ref<Star[] | null>;
  starsMetaRef: Ref<{ w: number; h: number } | null>;
  bgPixRef: Ref<{ w: number; h: number; pts: BgPix[] } | null>;

  particlesRef: Ref<Particle[]>;
  trailRef: Ref<Array<{ x: number; footY: number }>>;

  timeRef: Ref<number>;
  durationRef: Ref<number>;

  seekHeldRef: Ref<boolean>;
  seekYRef: Ref<number>;
  seekVRef: Ref<number>;
  seekVelNormRef: Ref<number>;

  waveAmpRef: Ref<number>;
  waveAlphaRef: Ref<number>;
  waveSpeedRef: Ref<number>;
  wavePhaseRef: Ref<number>;

  lookYawRef: Ref<number>;
  lookPitchRef: Ref<number>;
  lookActiveRef: Ref<number>;

  bassEnvRef: Ref<number>;
  beatFloorRef: Ref<number>;
  beatCooldownRef: Ref<number>;
  kickRef: Ref<number>;
  beatImpulseRef: Ref<number>;
  beatCountRef: Ref<number>;

  sceneVisRef: Ref<number>;
  walkerMotionRef: Ref<number>;

  phaseRef: Ref<number>;
  prevWalkerXRef: Ref<number | null>;
  dirRef: Ref<number>;
};

export function useEqLoop(args: UseEqLoopArgs) {
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(performance.now());

  const specCssRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const walkCssRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dprRef = useRef<number>(window.devicePixelRatio || 1);

  const specCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const walkCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const ptrStateRef = useRef<PointerState>({ has: false, cx: 0, cy: 0, down: false });

  const resizeCanvas = (el: HTMLCanvasElement, cssW: number, cssH: number, dpr: number) => {
    const W = Math.max(1, Math.round(cssW * dpr));
    const H = Math.max(1, Math.round(cssH * dpr));
    if (el.width !== W) el.width = W;
    if (el.height !== H) el.height = H;
  };

  const measureOnce = () => {
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    const spectrumEl = args.spectrumRef.current;
    if (spectrumEl) {
      const r = spectrumEl.getBoundingClientRect();
      specCssRef.current = { w: r.width, h: r.height };
      resizeCanvas(spectrumEl, r.width, r.height, dpr);
      if (!specCtxRef.current) specCtxRef.current = spectrumEl.getContext("2d");
    }

    const walkersEl = args.walkersRef.current;
    if (walkersEl) {
      const r = walkersEl.getBoundingClientRect();
      walkCssRef.current = { w: r.width, h: r.height };
      resizeCanvas(walkersEl, r.width, r.height, dpr);
      if (!walkCtxRef.current) walkCtxRef.current = walkersEl.getContext("2d");
    }
  };

  useEffect(() => {
    const spectrumEl = args.spectrumRef.current;
    const walkersEl = args.walkersRef.current;

    let ro: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver((entries) => {
        const dpr = window.devicePixelRatio || 1;
        dprRef.current = dpr;

        for (const e of entries) {
          const el = e.target as HTMLCanvasElement;
          const cssW = e.contentRect.width;
          const cssH = e.contentRect.height;

          if (el === spectrumEl) {
            specCssRef.current = { w: cssW, h: cssH };
            resizeCanvas(el, cssW, cssH, dpr);
            if (!specCtxRef.current) specCtxRef.current = el.getContext("2d");
          } else if (el === walkersEl) {
            walkCssRef.current = { w: cssW, h: cssH };
            resizeCanvas(el, cssW, cssH, dpr);
            if (!walkCtxRef.current) walkCtxRef.current = el.getContext("2d");
          }
        }
      });

      if (spectrumEl) ro.observe(spectrumEl);
      if (walkersEl) ro.observe(walkersEl);
    } else {
      measureOnce();
      window.addEventListener("resize", measureOnce, { passive: true });
    }

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", measureOnce);
    };
  }, [args.spectrumRef, args.walkersRef]);

  useEffect(() => {
    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastRef.current) / 1000));
      lastRef.current = now;

      const dprNow = window.devicePixelRatio || 1;
      if (dprNow !== dprRef.current) {
        dprRef.current = dprNow;

        const spectrumEl = args.spectrumRef.current;
        if (spectrumEl) resizeCanvas(spectrumEl, specCssRef.current.w, specCssRef.current.h, dprNow);

        const walkersEl = args.walkersRef.current;
        if (walkersEl) resizeCanvas(walkersEl, walkCssRef.current.w, walkCssRef.current.h, dprNow);
      }

      const an = args.analyserRef.current;

      const spectrumEl = args.spectrumRef.current;
      if (spectrumEl) {
        if (!specCtxRef.current) specCtxRef.current = spectrumEl.getContext("2d");
        const g = specCtxRef.current;
        if (g) drawSpectrum(g, spectrumEl.width, spectrumEl.height, an, args.tickList, args as any);
      }

      const walkersEl = args.walkersRef.current;
      if (walkersEl) {
        if (!walkCtxRef.current) walkCtxRef.current = walkersEl.getContext("2d");
        const g = walkCtxRef.current;

        if (g) {
          const p = ptrStateRef.current;
          p.has = args.pointerRef.current.has;
          p.cx = args.pointerRef.current.cx;
          p.cy = args.pointerRef.current.cy;
          p.down = args.seekHeldRef.current;

          drawWalkers(g, walkersEl.width, walkersEl.height, an, dt, now, {
            visEdges: args.visEdges,

            walkersRef: args.walkersRef,
            pointerRef: { current: p },

            ctxRef: args.ctxRef,
            audioRef: args.audioRef,
            connectedRef: args.connectedRef,
            freqBufRef: args.freqBufRef,

            bgPixRef: args.bgPixRef,

            starsRef: args.starsRef,
            starsMetaRef: args.starsMetaRef,
            starBandsSmoothRef: args.starBandsSmoothRef,

            binRangesRef: args.binRangesRef,
            colHzRef: args.colHzRef,
            colsLevelRef: args.colsLevelRef,

            bassEnvRef: args.bassEnvRef,
            beatFloorRef: args.beatFloorRef,
            beatCooldownRef: args.beatCooldownRef,
            kickRef: args.kickRef,
            beatImpulseRef: args.beatImpulseRef,
            beatCountRef: args.beatCountRef,

            sceneVisRef: args.sceneVisRef,

            waveAmpRef: args.waveAmpRef,
            waveAlphaRef: args.waveAlphaRef,
            waveSpeedRef: args.waveSpeedRef,
            wavePhaseRef: args.wavePhaseRef,

            timeRef: args.timeRef,
            durationRef: args.durationRef,

            prevWalkerXRef: args.prevWalkerXRef,
            dirRef: args.dirRef,
            phaseRef: args.phaseRef,
            walkerMotionRef: args.walkerMotionRef,

            lookYawRef: args.lookYawRef,
            lookPitchRef: args.lookPitchRef,
            lookActiveRef: args.lookActiveRef,

            seekYRef: args.seekYRef,
            seekVRef: args.seekVRef,
            seekHeldRef: args.seekHeldRef,
            seekVelNormRef: args.seekVelNormRef,

            trailRef: args.trailRef,
            particlesRef: args.particlesRef,
          } as any);
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [args.tickList, args.visEdges, args.spectrumRef, args.walkersRef, args.analyserRef, args.connectedRef]);
}
