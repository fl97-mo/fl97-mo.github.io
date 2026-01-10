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

export function UIProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState(false);
  const [effectsEnabled, setEffectsEnabledState] = useState(true);
  const [introDone, setIntroDone] = useState(false);

  const [eqQueue, setEqQueueState] = useState<EqTrack[]>([]);
  const [eqActiveId, setEqActiveIdState] = useState<string | null>(null);
  const [eqRepeat, setEqRepeat] = useState<EqRepeat>("OFF");
  const [eqFiles, setEqFiles] = useState<Record<string, File | undefined>>({});
  const [eqPendingPlayId, setEqPendingPlayId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSoundEnabledState(readBoolFromSessionStorage(SS_SOUND, false));
    setEffectsEnabledState(readBoolFromSessionStorage(SS_EFFECTS, true));
    setIntroDone(readBoolFromSessionStorage(SS_INTRO_DONE, false));
  }, []);

  const setSoundEnabled = useCallback((v: boolean) => {
    setSoundEnabledState(v);
    writeBoolToSessionStorage(SS_SOUND, v);

    if (!v) {
      stopStatic();
      stopTypingLoop();
      stopHoverNoise();
      return;
    }

    primeAudio().then(() => startStatic()).catch(() => {});
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
