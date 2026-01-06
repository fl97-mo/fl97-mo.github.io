import { ANALYSER_SMOOTH, FFT_SIZE, VIS_COLUMNS } from "./constants";
import { clamp } from "./math";
import type { U8 } from "./types";

type Ref<T> = { current: T };

export type EnsureEqGraphArgs = {
  audio: HTMLAudioElement | null;
  volume: number;
  visEdges: number[];
  setError?: (msg: string | null) => void;

  ctxRef: Ref<AudioContext | null>;
  sourceRef: Ref<MediaElementAudioSourceNode | null>;
  gainRef: Ref<GainNode | null>;
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
};

export async function ensureEqGraph(args: EnsureEqGraphArgs) {
  const audio = args.audio;
  if (!audio) return;

  const AC =
    window.AudioContext ||
    ((window as any).webkitAudioContext as typeof AudioContext | undefined);

  if (!AC) {
    args.setError?.("Web Audio API not supported in this browser.");
    return;
  }

  if (!args.ctxRef.current) {
    args.ctxRef.current = new AC({ latencyHint: "interactive" });
  }

  const ctx = args.ctxRef.current;

  if (ctx.state === "suspended") {
    await ctx.resume().catch(() => {});
  }

  if (!args.sourceRef.current) {
    args.sourceRef.current = ctx.createMediaElementSource(audio);
  }

  if (!args.gainRef.current) {
    args.gainRef.current = ctx.createGain();
    args.gainRef.current.gain.value = args.volume;
  }

  if (!args.analyserRef.current) {
    const a = ctx.createAnalyser();
    a.fftSize = FFT_SIZE;
    a.smoothingTimeConstant = ANALYSER_SMOOTH;
    a.minDecibels = -100;
    a.maxDecibels = -20;
    args.analyserRef.current = a;
  }

  if (!args.connectedRef.current) {
    const src = args.sourceRef.current;
    const g = args.gainRef.current;
    const an = args.analyserRef.current;
    if (!src || !g || !an) return;

    src.connect(g);
    g.connect(an);
    an.connect(ctx.destination);

    const nyquist = ctx.sampleRate / 2;
    const binCount = an.frequencyBinCount;

    const ranges: [number, number][] = [];
    const centers = new Float32Array(VIS_COLUMNS);

    for (let i = 0; i < VIS_COLUMNS; i++) {
      const hz0 = args.visEdges[i];
      const hz1 = args.visEdges[i + 1];

      let start = Math.floor((hz0 / nyquist) * binCount);
      let end = Math.ceil((hz1 / nyquist) * binCount);

      start = clamp(start, 0, binCount - 1);
      end = clamp(end, start + 1, binCount);

      ranges.push([start, end]);
      centers[i] = Math.sqrt(hz0 * hz1);
    }

    args.binRangesRef.current = ranges;
    args.colHzRef.current = centers;

    args.smoothRef.current = new Float32Array(VIS_COLUMNS);
    args.peaksRef.current = new Float32Array(VIS_COLUMNS);
    args.colsLevelRef.current = new Float32Array(VIS_COLUMNS);
    args.starBandsSmoothRef.current = new Float32Array(VIS_COLUMNS);

    args.freqBufRef.current = new Uint8Array(new ArrayBuffer(binCount));
    args.timeBufRef.current = new Uint8Array(new ArrayBuffer(an.fftSize));

    args.connectedRef.current = true;
  }
}

export const ensureGraph = ensureEqGraph;
