import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { TypewriterText } from "./Typewriter";
import { useUI } from "../store/ui";

import { MIN_HZ, MAX_HZ, VIS_COLUMNS, SEGMENTS, TICKS_HZ } from "./eq/constants";
import { clamp, formatTime, makeMidEmphasisEdges } from "./eq/math";
import type { BgPix, Particle, Star, U8 } from "./eq/types";
import { ensureEqGraph } from "./eq/audioGraph";
import { useEqLoop } from "./eq/useEqLoop";

type EqTrack = {
  id: string;
  title: string;
  artist?: string;
  year?: string;
  downloadUrl?: string;
};

const AUDIO_FILE_RE = /\.(aac|aiff?|flac|m4a|mp3|ogg|opus|wav|webm)$/i;

function isAudioFile(file: File) {
  return file.type.startsWith("audio/") || AUDIO_FILE_RE.test(file.name);
}

function titleFromFileName(name: string) {
  return name.replace(/\.[^.]+$/, "") || name;
}

function makeLocalTrack(file: File, index: number): EqTrack {
  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(0, 80) || "audio";

  return {
    id: `local-${Date.now()}-${index}-${safeName}`,
    artist: "LOCAL_FILE",
    title: titleFromFileName(file.name),
    year: file.lastModified ? String(new Date(file.lastModified).getFullYear()) : undefined,
  };
}

export function EqualizerPage() {
  const VIS_EDGES = useMemo(() => makeMidEmphasisEdges(VIS_COLUMNS), []);
  const TICK_LIST = useMemo(() => TICKS_HZ.filter((h) => h >= MIN_HZ && h <= MAX_HZ), []);

  const pointerRef = useRef<{ cx: number; cy: number; has: boolean }>({
    cx: 0,
    cy: 0,
    has: false,
  });

  const waveAmpRef = useRef(0);
  const waveAlphaRef = useRef(0);
  const waveSpeedRef = useRef(0.75);
  const wavePhaseRef = useRef(0);
  const starScrollRef = useRef(0);

  const lookYawRef = useRef(0);
  const lookPitchRef = useRef(0);
  const lookActiveRef = useRef(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const spectrumRef = useRef<HTMLCanvasElement | null>(null);
  const walkersRef = useRef<HTMLCanvasElement | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const connectedRef = useRef(false);

  const objectUrlRef = useRef<string | null>(null);

  const binRangesRef = useRef<[number, number][]>([]);
  const colHzRef = useRef<Float32Array | null>(null);

  const smoothRef = useRef<Float32Array | null>(null);
  const peaksRef = useRef<Float32Array | null>(null);
  const colsLevelRef = useRef<Float32Array | null>(null);
  const starBandsSmoothRef = useRef<Float32Array | null>(null);

  const freqBufRef = useRef<U8 | null>(null);
  const timeBufRef = useRef<U8 | null>(null);

  const starsRef = useRef<Star[] | null>(null);
  const starsMetaRef = useRef<{ w: number; h: number } | null>(null);
  const bgPixRef = useRef<{ w: number; h: number; pts: BgPix[] } | null>(null);

  const particlesRef = useRef<Particle[]>([]);
  const trailRef = useRef<{ x: number; footY: number }[]>([]);

  const timeRef = useRef(0);
  const durationRef = useRef(0);

  const seekHeldRef = useRef(false);
  const seekYRef = useRef(0);
  const seekVRef = useRef(0);
  const seekVelNormRef = useRef(0);
  const lastSeekRef = useRef<{ t: number; ts: number } | null>(null);

  const bassEnvRef = useRef(0);
  const beatFloorRef = useRef(0);
  const beatCooldownRef = useRef(0);
  const kickRef = useRef(0);
  const beatImpulseRef = useRef(0);
  const beatCountRef = useRef(0);

  const sceneVisRef = useRef(0);
  const walkerMotionRef = useRef(0);

  const phaseRef = useRef(0);
  const prevWalkerXRef = useRef<number | null>(null);
  const dirRef = useRef(1);

  const forceAutoplayRef = useRef(false);

  const {
    accessibilityEnabled,
    crtColor,
    eqQueue,
    eqActiveId,
    eqFiles,
    eqRepeat,
    setEqQueue,
    setEqActiveId,
    setEqFile,
    cycleEqRepeat,
  } = useUI();

  const [loadedLabel, setLoadedLabel] = useState<string>("NO_TRACK");
  const [sourceKind, setSourceKind] = useState<"NONE" | "LOCAL_FILE">("NONE");

  const [volume, setVolume] = useState(0.9);
  const [isPlaying, setIsPlaying] = useState(false);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);

  const [error, setError] = useState<string | null>(null);

  const activeTrack = useMemo(() => {
    const list = (eqQueue ?? []) as EqTrack[];
    if (!list.length) return null;
    const id = eqActiveId ?? list[0].id;
    return list.find((t) => t.id === id) ?? list[0];
  }, [eqQueue, eqActiveId]);

  const activeIndex = useMemo(() => {
    const list = (eqQueue ?? []) as EqTrack[];
    if (!list.length) return 0;
    const id = eqActiveId ?? list[0].id;
    const idx = list.findIndex((t) => t.id === id);
    return Math.max(0, idx);
  }, [eqQueue, eqActiveId]);

  const goDelta = (delta: number, forcePlay: boolean) => {
    const list = (eqQueue ?? []) as EqTrack[];
    if (!list.length) return;

    const idx = activeIndex;
    let next = idx + delta;
    if (next < 0) next = list.length - 1;
    if (next >= list.length) next = 0;

    forceAutoplayRef.current = forcePlay;
    setEqActiveId(list[next].id);
  };

  const handleUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter(isAudioFile);
    event.target.value = "";

    if (!files.length) {
      setError("No supported audio file selected.");
      return;
    }

    const tracks = files.map(makeLocalTrack);
    setEqQueue(tracks);
    tracks.forEach((track, index) => {
      const file = files[index];
      if (file) setEqFile(track.id, file);
    });
    setEqActiveId(tracks[0]?.id ?? null);
    setError(null);
  };

  const clearQueue = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setEqQueue([]);
    setEqActiveId(null);
    setLoadedLabel("NO_TRACK");
    setSourceKind("NONE");
    setIsPlaying(false);
    durationRef.current = 0;
    timeRef.current = 0;
    setDuration(0);
    setCurrentTime(0);
    setBufferedTime(0);
    setError(null);
  };

  const ensureGraph = async () => {
    await ensureEqGraph({
      audio: audioRef.current,
      volume,
      setError: (msg) => setError(msg),
      visEdges: VIS_EDGES,

      ctxRef,
      sourceRef,
      gainRef,
      analyserRef,
      connectedRef,

      binRangesRef,
      colHzRef,
      smoothRef,
      peaksRef,
      colsLevelRef,
      starBandsSmoothRef,
      freqBufRef,
      timeBufRef,
    });
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    setError(null);

    if (!audio.src || sourceKind === "NONE") {
      setError("No track loaded. Upload an audio file first.");
      return;
    }

    await ensureGraph();

    const ctx = ctxRef.current;
    if (ctx && ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }

    if (audio.paused) {
      await audio.play().catch((e) => {
        setError(e?.message ? String(e.message) : "Failed to play.");
      });
    } else {
      audio.pause();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setError(null);

    const t = activeTrack as EqTrack | null;
    const list = (eqQueue ?? []) as EqTrack[];

    if (!t) {
      setLoadedLabel("NO_TRACK");
      setSourceKind("NONE");
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      setIsPlaying(false);
      durationRef.current = 0;
      timeRef.current = 0;
      setDuration(0);
      setCurrentTime(0);
      return;
    }

    if (!eqActiveId && list.length) setEqActiveId(t.id);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const file = (eqFiles && (eqFiles as any)[t.id]) || null;
    const srcUrl = file ? URL.createObjectURL(file) : "";

    if (file) objectUrlRef.current = srcUrl;

    audio.pause();
    audio.removeAttribute("crossorigin");
    audio.preload = "auto";
    if (srcUrl) audio.src = srcUrl;
    else audio.removeAttribute("src");
    audio.load();


    setLoadedLabel(`${t.artist ? `${t.artist} - ` : ""}${t.title}`);
    setSourceKind(file ? "LOCAL_FILE" : "NONE");
    setIsPlaying(false);

    seekHeldRef.current = false;
    seekYRef.current = 0;
    seekVRef.current = 0;
    seekVelNormRef.current = 0;
    lastSeekRef.current = null;

    const shouldAuto = !!srcUrl && forceAutoplayRef.current;
    forceAutoplayRef.current = false;

    if (shouldAuto) {
      (async () => {
        await ensureGraph();
        const ctx = ctxRef.current;
        if (ctx && ctx.state === "suspended") await ctx.resume().catch(() => {});
        await audio.play().catch((e) => {
          setError(e?.message ? String(e.message) : "Failed to play.");
        });
      })();
    }
  }, [activeTrack, eqFiles, eqQueue, eqActiveId, setEqActiveId, VIS_EDGES]);
useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  const update = () => {
    const d = Number.isFinite(audio.duration) ? audio.duration : 0;
    if (!d || d <= 0) {
      setBufferedTime(0);
      return;
    }

    const buf = audio.buffered;
    if (!buf || buf.length === 0) {
      setBufferedTime(0);
      return;
    }

    const t = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;

    let end = 0;
    for (let i = 0; i < buf.length; i++) {
      const s = buf.start(i);
      const e = buf.end(i);
      if (t >= s && t <= e) {
        end = e;
        break;
      }
      end = Math.max(end, e);
    }

    setBufferedTime(end);
  };

  audio.addEventListener("progress", update);
  audio.addEventListener("loadedmetadata", update);
  audio.addEventListener("durationchange", update);
  audio.addEventListener("timeupdate", update);
  audio.addEventListener("seeked", update);

  update();

  return () => {
    audio.removeEventListener("progress", update);
    audio.removeEventListener("loadedmetadata", update);
    audio.removeEventListener("durationchange", update);
    audio.removeEventListener("timeupdate", update);
    audio.removeEventListener("seeked", update);
  };
}, []);

  useEffect(() => {
    const g = gainRef.current;
    const ctx = ctxRef.current;
    if (g && ctx) {
      g.gain.setTargetAtTime(volume, ctx.currentTime, 0.03);
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      const d = Number.isFinite(audio.duration) ? audio.duration : 0;
      const t = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      durationRef.current = d;
      timeRef.current = t;
      setDuration(d);
      setCurrentTime(t);
    };

    const onTime = () => {
      const t = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      timeRef.current = t;
      setCurrentTime(t);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    const onEnded = () => {
      setIsPlaying(false);
      const list = (eqQueue ?? []) as EqTrack[];
      if (!list.length) return;

      if (eqRepeat === "ONE") {
        audio.currentTime = 0;
        forceAutoplayRef.current = true;
        audio.play().catch(() => {});
        return;
      }

      const atLast = activeIndex >= list.length - 1;

      if (eqRepeat === "ALL") {
        goDelta(1, true);
        return;
      }

      if (!atLast) {
        goDelta(1, true);
      }
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [eqQueue, eqRepeat, activeIndex]);

  useEqLoop({
    visualResetKey: `${accessibilityEnabled ? "a11y" : "crt"}:${crtColor}`,
    visualDisabled: accessibilityEnabled,
    tickList: TICK_LIST,
    visEdges: VIS_EDGES,

    pointerRef,
    audioRef,

    spectrumRef,
    walkersRef,

    ctxRef,
    analyserRef,
    connectedRef,

    binRangesRef,
    colHzRef,
    smoothRef,
    peaksRef,
    colsLevelRef,
    starBandsSmoothRef,

    freqBufRef,
    timeBufRef,

    starsRef,
    starsMetaRef,
    bgPixRef,

    particlesRef,
    trailRef,

    timeRef,
    durationRef,

    seekHeldRef,
    seekYRef,
    seekVRef,
    seekVelNormRef,

    waveAmpRef,
    waveAlphaRef,
    waveSpeedRef,
    wavePhaseRef,
    starScrollRef,

    lookYawRef,
    lookPitchRef,
    lookActiveRef,

    bassEnvRef,
    beatFloorRef,
    beatCooldownRef,
    kickRef,
    beatImpulseRef,
    beatCountRef,

    sceneVisRef,
    walkerMotionRef,

    phaseRef,
    prevWalkerXRef,
    dirRef,
  });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current.cx = e.clientX;
      pointerRef.current.cy = e.clientY;
      pointerRef.current.has = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const up = () => {
      if (!seekHeldRef.current) return;
      seekHeldRef.current = false;
      lastSeekRef.current = null;
      seekVelNormRef.current = 0;
    };

    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) audio.pause();

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      try {
        analyserRef.current?.disconnect();
      } catch {}
      try {
        gainRef.current?.disconnect();
      } catch {}
      try {
        sourceRef.current?.disconnect();
      } catch {}

      connectedRef.current = false;
      sourceRef.current = null;
      analyserRef.current = null;
      gainRef.current = null;

      const ctx = ctxRef.current;
      ctxRef.current = null;
      if (ctx) ctx.close().catch(() => {});
    };
  }, []);

  const nowPlayingText = useMemo(() => {
    const list = (eqQueue ?? []) as EqTrack[];
    const q = list.length ? `${activeIndex + 1}/${list.length}` : "0/0";
    const src = sourceKind === "LOCAL_FILE" ? "LOCAL_FILE" : "NONE";

    const trackLine =
      activeTrack && loadedLabel !== "NO_TRACK" ? `-- TRACK: ${loadedLabel}` : `-- TRACK: (none)`;

    return (
      `> NOW_PLAYING\n\n` +
      `${trackLine}\n` +
      `-- SOURCE: ${src}\n` +
      `-- QUEUE: ${q}\n` +
      `-- Range: ${MIN_HZ}Hz-${MAX_HZ}Hz\n` +
      `-- COLS: ${VIS_COLUMNS} | SEG: ${SEGMENTS}\n` +
      `-- REPEAT: ${eqRepeat}\n`
    );
  }, [activeTrack, loadedLabel, sourceKind, eqQueue, activeIndex, eqRepeat]);
  const playerStatusText = useMemo(() => {
    const queueLength = eqQueue?.length ?? 0;

    if (error) return `Audio player error: ${error}`;
    if (!queueLength) return "Audio player queue is empty. Upload audio files to start.";
    if (!activeTrack || loadedLabel === "NO_TRACK") {
      return `${queueLength} audio tracks in queue. No active track loaded.`;
    }

    return `${isPlaying ? "Playing" : "Paused"} ${loadedLabel}. Track ${
      activeIndex + 1
    } of ${queueLength}. Repeat mode ${eqRepeat}.`;
  }, [activeIndex, activeTrack, eqQueue?.length, error, isPlaying, loadedLabel, eqRepeat]);

  return (
    <section className="mb-12 border border-primary/30 p-4 md:p-6 bg-card/50 rounded crt-glow-soft text-sm">
      <h2 className="text-primary mb-4 flex items-center gap-2">
        <span className="text-muted-foreground">[</span>
        <TypewriterText text="EQUALIZER.DIR" speedMs={18} showCursor={false} />
        <span className="text-muted-foreground">]</span>
      </h2>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {playerStatusText}
      </p>

      <input
        ref={uploadInputRef}
        type="file"
        aria-label="Upload local audio files"
        accept="audio/*,.aac,.aiff,.aif,.flac,.m4a,.mp3,.ogg,.opus,.wav,.webm"
        multiple
        className="sr-only"
        onChange={handleUploadChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[2.35fr_0.65fr] gap-4 items-stretch">
        <div className="min-w-0">
          <div className="flex h-full min-h-0 flex-col border border-primary/20 rounded bg-background/40 p-4">
            <div className="relative border border-primary/15 rounded bg-background/30 p-3 mb-2">
              <canvas
                ref={walkersRef}
                role={accessibilityEnabled ? undefined : "img"}
                aria-hidden={accessibilityEnabled}
                aria-label={accessibilityEnabled ? undefined : "Animated audio walker visualization"}
                className={`w-full h-56 rounded ${accessibilityEnabled ? "opacity-0" : ""}`}
              />

              {accessibilityEnabled && (
                <div
                  role="note"
                  className="absolute inset-3 flex items-center justify-center rounded border border-primary/30 bg-background text-center text-sm tracking-widest text-primary"
                >
                  A11Y MODE: ASTRO WALKER VISUAL DISABLED
                </div>
              )}
            </div>

            <div className="relative border border-primary/15 rounded bg-background/30 p-2">
              <canvas
                ref={spectrumRef}
                role={accessibilityEnabled ? undefined : "img"}
                aria-hidden={accessibilityEnabled}
                aria-label={accessibilityEnabled ? undefined : "Audio spectrum visualization"}
                className={`w-full h-64 rounded ${accessibilityEnabled ? "opacity-0" : ""}`}
              />

              {accessibilityEnabled && (
                <div
                  role="note"
                  className="absolute inset-2 flex items-center justify-center rounded border border-primary/30 bg-background text-center text-sm tracking-widest text-primary"
                >
                  A11Y MODE: AUDIO SPECTRUM VISUAL DISABLED
                </div>
              )}
            </div>

          <div className="mt-3 grid gap-1 text-sm text-muted-foreground tracking-widest sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-3">
            <div className="min-w-0">
              -- TRACK:{" "}
              <span className="break-words text-primary/80 sm:break-normal">
                {loadedLabel === "NO_TRACK" ? "(none)" : loadedLabel}
              </span>
            </div>
            <div className="tabular-nums sm:text-right">
              -- TIME:{" "}
              <span className="text-primary/80">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="text-sm text-muted-foreground tracking-widest w-16">{formatTime(currentTime)}</div>
            <input
              type="range"
              aria-label="Seek audio position"
              aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
              min={0}
              max={Math.max(0.001, duration)}
              step={0.01}
              value={clamp(currentTime, 0, Math.max(0.001, duration))}
              onPointerDown={() => {
                seekHeldRef.current = true;
                lastSeekRef.current = { t: timeRef.current, ts: performance.now() };
              }}
              onChange={(e) => {
                const audio = audioRef.current;
                if (!audio) return;
                const t = Number((e.target as HTMLInputElement).value);

                const now = performance.now();
                const prev = lastSeekRef.current;
                if (prev) {
                  const dt = Math.max(1e-3, (now - prev.ts) / 1000);
                  const v = (t - prev.t) / dt;
                  seekVelNormRef.current = clamp(v / 12, -1, 1);
                }
                lastSeekRef.current = { t, ts: now };

                audio.currentTime = t;
                timeRef.current = t;
                setCurrentTime(t);
              }}
              className="w-full crt-range crt-range--seek"
style={{
  ["--fill" as any]: duration > 0 ? (clamp(currentTime, 0, duration) / duration) * 100 : 0,
  ["--buffer" as any]:
    duration > 0 ? (clamp(Math.max(bufferedTime, currentTime), 0, duration) / duration) * 100 : 0,
}}

            />
            <div className="text-sm text-muted-foreground tracking-widest w-16 text-right">{formatTime(duration)}</div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="text-sm text-muted-foreground tracking-widest w-16">VOLUME</div>
            <input
              type="range"
              aria-label="Volume"
              aria-valuetext={`${Math.round(volume * 100)} percent`}
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number((e.target as HTMLInputElement).value))}
              className="w-full crt-range"
style={{ ["--fill" as any]: clamp(volume, 0, 1) * 100 }}

            />
            <div className="text-sm text-primary/80 w-16 text-right tabular-nums">{Math.round(volume * 100)}%</div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => togglePlay()}
              aria-label={
                isPlaying
                  ? `Pause ${loadedLabel === "NO_TRACK" ? "current audio track" : loadedLabel}`
                  : `Play ${loadedLabel === "NO_TRACK" ? "selected audio track" : loadedLabel}`
              }
              className="px-5 py-2 border-2 border-primary/50 rounded bg-background/50 text-primary hover:border-primary crt-hover-glow transition-all"
              style={{
                boxShadow:
                  "inset -2px -2px 0px var(--crt-inset-button), inset 2px 2px 0px rgba(0,0,0,0.55)",
              }}
            >
              {isPlaying ? "PAUSE" : "PLAY"}
            </button>

            <button
              type="button"
              onClick={() => goDelta(-1, true)}
              aria-label="Play previous track"
              className="px-5 py-2 border-2 border-primary/50 rounded bg-background/50 text-primary/80 hover:text-primary hover:border-primary crt-hover-glow-soft transition-all"
              style={{
                boxShadow:
                  "inset -2px -2px 0px var(--crt-inset-soft), inset 2px 2px 0px rgba(0,0,0,0.6)",
              }}
              disabled={(eqQueue?.length ?? 0) < 2}
            >
              PREV
            </button>

            <button
              type="button"
              onClick={() => goDelta(1, true)}
              aria-label="Play next track"
              className="px-5 py-2 border-2 border-primary/50 rounded bg-background/50 text-primary/80 hover:text-primary hover:border-primary crt-hover-glow-soft transition-all"
              style={{
                boxShadow:
                  "inset -2px -2px 0px var(--crt-inset-soft), inset 2px 2px 0px rgba(0,0,0,0.6)",
              }}
              disabled={(eqQueue?.length ?? 0) < 2}
            >
              NEXT
            </button>

            <button
              type="button"
              onClick={() => cycleEqRepeat()}
              aria-label={`Cycle repeat mode. Current mode: ${eqRepeat}`}
              className="px-5 py-2 border-2 border-primary/50 rounded bg-background/50 text-primary/80 hover:text-primary hover:border-primary crt-hover-glow-soft transition-all"
              style={{
                boxShadow:
                  "inset -2px -2px 0px var(--crt-inset-soft), inset 2px 2px 0px rgba(0,0,0,0.6)",
              }}
            >
              REPEAT: {eqRepeat}
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 border border-destructive/40 bg-background/60 rounded p-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <audio ref={audioRef} preload="auto" aria-hidden="true" />
        </div>
        </div>

        <aside className="border border-primary/20 rounded bg-background/40 p-4 flex h-full min-h-0 max-h-[70rem] flex-col gap-4 overflow-hidden lg:max-h-[calc(100vh-14rem)]">
          <div
            className={`grid w-full gap-2 ${
              (eqQueue?.length ?? 0) > 0 ? "sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              aria-label="Upload local audio files"
              className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-2 px-2 text-sm border-2 border-primary/50 rounded bg-background/50 text-primary hover:border-primary crt-hover-glow transition-all"
              style={{
                boxShadow:
                  "inset -2px -2px 0px var(--crt-inset-button), inset 2px 2px 0px rgba(0,0,0,0.55)",
              }}
            >
              <Upload className="w-4 h-4" />
              <span className="whitespace-nowrap">UPLOAD AUDIO</span>
            </button>

            {(eqQueue?.length ?? 0) > 0 && (
              <button
                type="button"
                onClick={clearQueue}
                aria-label="Clear equalizer queue"
                className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-2 px-2 text-sm border-2 border-primary/30 rounded bg-background/40 text-primary/80 hover:text-primary hover:border-primary/60 transition-all"
                style={{
                  boxShadow:
                    "inset -2px -2px 0px var(--crt-focus-soft), inset 2px 2px 0px rgba(0,0,0,0.6)",
                }}
              >
                <Trash2 className="w-4 h-4" />
                <span className="whitespace-nowrap">CLEAR QUEUE</span>
              </button>
            )}
          </div>

          <div className="border border-primary/15 rounded bg-background/30 p-3">
            <pre
              aria-live="polite"
              className="text-base text-muted-foreground whitespace-pre-wrap select-none leading-6"
            >
              {nowPlayingText}
            </pre>
          </div>

          <div className="border border-primary/15 rounded bg-background/30 p-3 flex min-h-0 flex-1 flex-col">
            <div className="text-sm text-muted-foreground tracking-widest mb-2 shrink-0">QUEUE</div>

            {(eqQueue?.length ?? 0) === 0 ? (
              <div className="text-sm text-muted-foreground tracking-widest">-- EMPTY (upload audio files)</div>
            ) : (
              <div className="min-h-0 max-h-[28rem] flex-1 space-y-2 overflow-y-auto overflow-x-hidden pr-1">
                {(eqQueue ?? []).map((t: any) => {
                  const active = t.id === ((activeTrack as any)?.id ?? null);
                  const label = `${t.artist ? `${t.artist} - ` : ""}${t.title}`;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      aria-current={active ? "true" : undefined}
                      aria-label={`${active ? "Current track" : "Load track"}: ${label}`}
                      onClick={() => {
                        forceAutoplayRef.current = true;
                        setEqActiveId(t.id);
                      }}
                      className={`w-full text-left px-3 py-2 rounded border transition-all ${
                        active
                          ? "border-primary bg-primary/15 text-primary crt-glow-selected"
                          : "border-primary/20 bg-background/40 text-muted-foreground hover:border-primary/60 hover:text-primary"
                      }`}
                    >
                      <span className="text-sm tracking-widest">
                        {active ? "> " : "-- "}
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
