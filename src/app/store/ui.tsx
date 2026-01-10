import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  primeAudio,
  startStatic,
  stopHoverNoise,
  stopStatic,
  stopTypingLoop,
} from "../utils/sfx";

export type EqRepeat = "OFF" | "ONE" | "ALL";

export type EqTrack = {
  id: string;
  title: string;
  artist?: string;
  year?: string;
  downloadUrl?: string;
  streamUrl?: string;
};

type UIState = {
  soundEnabled: boolean;
  effectsEnabled: boolean;
  introDone: boolean;

  setSoundEnabled: (v: boolean) => void;
  setEffectsEnabled: (v: boolean) => void;

  markIntroDone: () => void;
  resetIntroForSession: () => void;

  eqQueue: EqTrack[];
  eqActiveId: string | null;
  eqRepeat: EqRepeat;
  eqFiles: Record<string, File | undefined>;

  setEqQueue: (q: EqTrack[]) => void;
  setEqActiveId: (id: string | null) => void;
  setEqFile: (id: string, file: File) => void;

  cycleEqRepeat: () => void;
  requestEqPlay: (id: string) => void;
  consumeEqPendingPlay: () => string | null;
};

const UIContext = createContext<UIState | null>(null);

const SS_SOUND = "ui.soundEnabled.session";
const SS_EFFECTS = "ui.effectsEnabled.session";
const SS_INTRO_DONE = "ui.introDone.session";

const SS_EQ_QUEUE = "ui.eqQueue.session";
const SS_EQ_ACTIVE = "ui.eqActiveId.session";
const SS_EQ_REPEAT = "ui.eqRepeat.session";

function readBoolFromSessionStorage(key: string, fallback: boolean) {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === "1";
  } catch {
    return fallback;
  }
}

function writeBoolToSessionStorage(key: string, value: boolean) {
  try {
    window.sessionStorage.setItem(key, value ? "1" : "0");
  } catch {}
}

function readStrFromSessionStorage(key: string, fallback: string | null) {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw === null ? fallback : raw;
  } catch {
    return fallback;
  }
}

function writeStrToSessionStorage(key: string, value: string | null) {
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {}
}

function readJsonFromSessionStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonToSessionStorage(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function isDevHost() {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1";
}

const AUDIO_BASE = isDevHost() ? "/audio/" : "https://audio.fl97-mo.de/";

function streamHref(file: string) {
  const raw = file.replace(/^\/+/, "");
  if (raw.includes("..")) throw new Error("Invalid file path.");
  const encoded = raw.split("/").map(encodeURIComponent).join("/");
  return AUDIO_BASE.startsWith("/")
    ? `${AUDIO_BASE}${encoded}`
    : new URL(encoded, AUDIO_BASE).toString();
}

const DEFAULT_EQ_QUEUE: EqTrack[] = [
  {
    id: "ufo",
    artist: "NOMKEE",
    title: "ENTER THE UFO",
    year: "2018",
    streamUrl: streamHref("NOMKEE_-_Enter_the_UFO.mp3"),
    downloadUrl: streamHref("NOMKEE_-_Enter_the_UFO.mp3"),
  },
  {
    id: "iknow",
    artist: "NOMKEE",
    title: "I KNOW YOU BETTER",
    year: "2020",
    streamUrl: streamHref("NOMKEE_-_I_know_you_better.wav"),
    downloadUrl: streamHref("NOMKEE_-_I_know_you_better.wav"),
  },
  {
    id: "dontlook",
    artist: "NOMKEE",
    title: "DONT WANT TO LOOK AWAY",
    year: "2020",
    streamUrl: streamHref("NOMKEE_-_Dont_want_to_look_away.mp3"),
    downloadUrl: streamHref("NOMKEE_-_Dont_want_to_look_away.mp3"),
  },
  {
    id: "rayguns",
    artist: "NOMKEE",
    title: "RAYGUNS EVERYWHERE",
    year: "2022",
    streamUrl: streamHref("Nomkee_-_Rayguns_everywhere.wav"),
    downloadUrl: streamHref("Nomkee_-_Rayguns_everywhere.wav"),
  },
];

export function UIProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState(false);
  const [effectsEnabled, setEffectsEnabledState] = useState(true);
  const [introDone, setIntroDone] = useState(false);

  const [eqQueue, setEqQueueState] = useState<EqTrack[]>(() => {
    if (typeof window === "undefined") return DEFAULT_EQ_QUEUE;
    return readJsonFromSessionStorage<EqTrack[]>(SS_EQ_QUEUE, DEFAULT_EQ_QUEUE);
  });

  const [eqActiveId, setEqActiveIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return DEFAULT_EQ_QUEUE[0]?.id ?? null;
    const q = readJsonFromSessionStorage<EqTrack[]>(SS_EQ_QUEUE, DEFAULT_EQ_QUEUE);
    const saved = readStrFromSessionStorage(SS_EQ_ACTIVE, null);
    if (saved && q.some((t) => t.id === saved)) return saved;
    return q[0]?.id ?? null;
  });

  const [eqRepeat, setEqRepeat] = useState<EqRepeat>(() => {
    if (typeof window === "undefined") return "OFF";
    const raw = readStrFromSessionStorage(SS_EQ_REPEAT, "OFF");
    return raw === "ALL" || raw === "ONE" || raw === "OFF" ? raw : "OFF";
  });

  const [eqFiles, setEqFiles] = useState<Record<string, File | undefined>>({});
  const [eqPendingPlayId, setEqPendingPlayId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const se = readBoolFromSessionStorage(SS_SOUND, false);
    const ee = readBoolFromSessionStorage(SS_EFFECTS, true);
    const id = readBoolFromSessionStorage(SS_INTRO_DONE, false);

    setSoundEnabledState(se);
    setEffectsEnabledState(ee);
    setIntroDone(id);

    if (se) {
      primeAudio(["TERM", "BTN_MECH", "STATIC", "TYPING"])
        .then(() => startStatic())
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    writeJsonToSessionStorage(SS_EQ_QUEUE, eqQueue);
  }, [eqQueue]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    writeStrToSessionStorage(SS_EQ_ACTIVE, eqActiveId);
  }, [eqActiveId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    writeStrToSessionStorage(SS_EQ_REPEAT, eqRepeat);
  }, [eqRepeat]);

  const setSoundEnabled = useCallback((v: boolean) => {
    setSoundEnabledState(v);
    writeBoolToSessionStorage(SS_SOUND, v);

    if (!v) {
      stopStatic();
      stopTypingLoop();
      stopHoverNoise();
      return;
    }

    primeAudio(["TERM", "BTN_MECH", "STATIC", "TYPING"])
      .then(() => startStatic())
      .catch(() => {});
  }, []);

  const setEffectsEnabled = useCallback((v: boolean) => {
    setEffectsEnabledState(v);
    writeBoolToSessionStorage(SS_EFFECTS, v);
  }, []);

  const markIntroDone = useCallback(() => {
    setIntroDone(true);
    writeBoolToSessionStorage(SS_INTRO_DONE, true);
  }, []);

  const resetIntroForSession = useCallback(() => {
    setIntroDone(false);
    writeBoolToSessionStorage(SS_INTRO_DONE, false);
  }, []);

  const setEqQueue = useCallback((q: EqTrack[]) => {
    setEqQueueState(q);
    if (!q.length) {
      setEqActiveIdState(null);
      return;
    }
    setEqActiveIdState((prev) => {
      if (prev && q.some((t) => t.id === prev)) return prev;
      return q[0].id;
    });
  }, []);

  const setEqActiveId = useCallback((id: string | null) => {
    setEqActiveIdState(id);
  }, []);

  const setEqFile = useCallback((id: string, file: File) => {
    setEqFiles((prev) => ({ ...prev, [id]: file }));
    setEqQueueState((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title: file.name,
            }
          : t
      )
    );
    setEqActiveIdState((prev) => prev ?? id);
  }, []);

  const cycleEqRepeat = useCallback(() => {
    setEqRepeat((prev) => (prev === "OFF" ? "ALL" : prev === "ALL" ? "ONE" : "OFF"));
  }, []);

  const requestEqPlay = useCallback((id: string) => {
    setEqActiveIdState(id);
    setEqPendingPlayId(id);
  }, []);

  const consumeEqPendingPlay = useCallback(() => {
    let out: string | null = null;
    setEqPendingPlayId((prev) => {
      out = prev;
      return null;
    });
    return out;
  }, []);

  const value = useMemo<UIState>(
    () => ({
      soundEnabled,
      effectsEnabled,
      introDone,
      setSoundEnabled,
      setEffectsEnabled,
      markIntroDone,
      resetIntroForSession,

      eqQueue,
      eqActiveId,
      eqRepeat,
      eqFiles,

      setEqQueue,
      setEqActiveId,
      setEqFile,
      cycleEqRepeat,
      requestEqPlay,
      consumeEqPendingPlay,
    }),
    [
      soundEnabled,
      effectsEnabled,
      introDone,
      setSoundEnabled,
      setEffectsEnabled,
      markIntroDone,
      resetIntroForSession,
      eqQueue,
      eqActiveId,
      eqRepeat,
      eqFiles,
      setEqQueue,
      setEqActiveId,
      setEqFile,
      cycleEqRepeat,
      requestEqPlay,
      consumeEqPendingPlay,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("UIContext missing (wrap with <UIProvider>).");
  return ctx;
}
