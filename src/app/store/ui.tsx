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

type UIState = {
  soundEnabled: boolean;
  effectsEnabled: boolean;
  introDone: boolean;

  setSoundEnabled: (v: boolean) => void;
  setEffectsEnabled: (v: boolean) => void;

  markIntroDone: () => void;
  resetIntroForSession: () => void;
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
  } catch {
  }
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState(false);
  const [effectsEnabled, setEffectsEnabledState] = useState(true);
  const [introDone, setIntroDone] = useState(false);

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

  const value = useMemo<UIState>(
    () => ({
      soundEnabled,
      effectsEnabled,
      introDone,
      setSoundEnabled,
      setEffectsEnabled,
      markIntroDone,
      resetIntroForSession,
    }),
    [
      soundEnabled,
      effectsEnabled,
      introDone,
      setSoundEnabled,
      setEffectsEnabled,
      markIntroDone,
      resetIntroForSession,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error("UIContext missing (wrap with <UIProvider>).");
  }
  return ctx;
}
