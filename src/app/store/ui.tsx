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
};

type UIState = {
  soundEnabled: boolean;
  effectsEnabled: boolean;
  accessibilityEnabled: boolean;
  introDone: boolean;
  homeRevealDone: boolean;

  setSoundEnabled: (v: boolean) => void;
  setEffectsEnabled: (v: boolean) => void;
  setAccessibilityEnabled: (v: boolean) => void;

  markIntroDone: () => void;
  markHomeRevealDone: () => void;
  resetIntroForSession: () => void;

  eqQueue: EqTrack[];
  eqActiveId: string | null;
  eqRepeat: EqRepeat;
  eqFiles: Record<string, File | undefined>;

  setEqQueue: (q: EqTrack[]) => void;
  setEqActiveId: (id: string | null) => void;
  setEqFile: (id: string, file: File) => void;

  cycleEqRepeat: () => void;
};

const UIContext = createContext<UIState | null>(null);

const SS_SOUND = "ui.soundEnabled.session";
const SS_EFFECTS = "ui.effectsEnabled.session";
const SS_ACCESSIBILITY = "ui.accessibilityEnabled.session";
const SS_INTRO_DONE = "ui.introDone.session";
const SS_HOME_REVEAL_DONE = "ui.homeRevealDone.session";

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

const DEFAULT_EQ_QUEUE: EqTrack[] = [];

export function UIProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState(() =>
    readBoolFromSessionStorage(SS_SOUND, false)
  );
  const [effectsEnabled, setEffectsEnabledState] = useState(() =>
    readBoolFromSessionStorage(SS_EFFECTS, true)
  );
  const [accessibilityEnabled, setAccessibilityEnabledState] = useState(() =>
    readBoolFromSessionStorage(SS_ACCESSIBILITY, false)
  );
  const [introDone, setIntroDone] = useState(() =>
    readBoolFromSessionStorage(SS_INTRO_DONE, false)
  );
  const [homeRevealDone, setHomeRevealDone] = useState(() => {
    const id = readBoolFromSessionStorage(SS_INTRO_DONE, false);
    return id && readBoolFromSessionStorage(SS_HOME_REVEAL_DONE, false);
  });

  const [eqQueue, setEqQueueState] = useState<EqTrack[]>(DEFAULT_EQ_QUEUE);

  const [eqActiveId, setEqActiveIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return null;
  });

  const [eqRepeat, setEqRepeat] = useState<EqRepeat>(() => {
    if (typeof window === "undefined") return "OFF";
    const raw = readStrFromSessionStorage(SS_EQ_REPEAT, "OFF");
    return raw === "ALL" || raw === "ONE" || raw === "OFF" ? raw : "OFF";
  });

  const [eqFiles, setEqFiles] = useState<Record<string, File | undefined>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const se = readBoolFromSessionStorage(SS_SOUND, false);
    const ee = readBoolFromSessionStorage(SS_EFFECTS, true);
    const ae = readBoolFromSessionStorage(SS_ACCESSIBILITY, false);
    const id = readBoolFromSessionStorage(SS_INTRO_DONE, false);
    const hrd = id && readBoolFromSessionStorage(SS_HOME_REVEAL_DONE, false);

    setSoundEnabledState(se);
    setEffectsEnabledState(ee);
    setAccessibilityEnabledState(ae);
    setIntroDone(id);
    setHomeRevealDone(hrd);

    if (se) {
      primeAudio(["TERM", "BTN_MECH", "STATIC", "TYPING"])
        .then(() => startStatic())
        .catch(() => {});
    }
  }, []);

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

  const setAccessibilityEnabled = useCallback((v: boolean) => {
    setAccessibilityEnabledState(v);
    writeBoolToSessionStorage(SS_ACCESSIBILITY, v);
  }, []);

  const markIntroDone = useCallback(() => {
    setIntroDone(true);
    writeBoolToSessionStorage(SS_INTRO_DONE, true);
  }, []);

  const markHomeRevealDone = useCallback(() => {
    setHomeRevealDone(true);
    writeBoolToSessionStorage(SS_HOME_REVEAL_DONE, true);
  }, []);

  const resetIntroForSession = useCallback(() => {
    setIntroDone(false);
    setHomeRevealDone(false);
    writeBoolToSessionStorage(SS_INTRO_DONE, false);
    writeBoolToSessionStorage(SS_HOME_REVEAL_DONE, false);
  }, []);

  const setEqQueue = useCallback((q: EqTrack[]) => {
    const ids = new Set(q.map((t) => t.id));

    setEqQueueState(q);
    setEqFiles((prev) => {
      const next: Record<string, File | undefined> = {};
      for (const [id, file] of Object.entries(prev)) {
        if (ids.has(id)) next[id] = file;
      }
      return next;
    });

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

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.accessibility = accessibilityEnabled ? "on" : "off";
  }, [accessibilityEnabled]);

  const value = useMemo<UIState>(
    () => ({
      soundEnabled,
      effectsEnabled,
      accessibilityEnabled,
      introDone,
      homeRevealDone,
      setSoundEnabled,
      setEffectsEnabled,
      setAccessibilityEnabled,
      markIntroDone,
      markHomeRevealDone,
      resetIntroForSession,

      eqQueue,
      eqActiveId,
      eqRepeat,
      eqFiles,

      setEqQueue,
      setEqActiveId,
      setEqFile,
      cycleEqRepeat,
    }),
    [
      soundEnabled,
      effectsEnabled,
      accessibilityEnabled,
      introDone,
      homeRevealDone,
      setSoundEnabled,
      setEffectsEnabled,
      setAccessibilityEnabled,
      markIntroDone,
      markHomeRevealDone,
      resetIntroForSession,
      eqQueue,
      eqActiveId,
      eqRepeat,
      eqFiles,
      setEqQueue,
      setEqActiveId,
      setEqFile,
      cycleEqRepeat,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("UIContext missing (wrap with <UIProvider>).");
  return ctx;
}
