import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useUI } from "../store/ui";
import { primeAudio, startTypingLoop, stopTypingLoop } from "../utils/sfx";

function usePrefersReducedMotion() {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }, []);
}

type CursorCtx = {
  typingIds: string[];
  lastFinishedId: string | null;
  startTyping: (id: string) => void;
  finishTyping: (id: string, eligibleForCursor: boolean) => void;
  stopInstance: (id: string) => void;
};

const TypewriterCursorContext = createContext<CursorCtx | null>(null);

export function TypewriterCursorProvider({ children }: { children: ReactNode }) {
  const [typingIds, setTypingIds] = useState<string[]>([]);
  const [finishedStack, setFinishedStack] = useState<string[]>([]);

  const startTyping = useCallback((id: string) => {
    setTypingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const finishTyping = useCallback((id: string, eligibleForCursor: boolean) => {
    setTypingIds((prev) => prev.filter((x) => x !== id));

    if (eligibleForCursor) {
      setFinishedStack((prev) => {
        const without = prev.filter((x) => x !== id);
        return [...without, id];
      });
    }
  }, []);

  const stopInstance = useCallback((id: string) => {
    setTypingIds((prev) => prev.filter((x) => x !== id));
    setFinishedStack((prev) => prev.filter((x) => x !== id));
  }, []);

  const lastFinishedId = finishedStack.length ? finishedStack[finishedStack.length - 1] : null;

  const value = useMemo(
    () => ({ typingIds, lastFinishedId, startTyping, finishTyping, stopInstance }),
    [typingIds, lastFinishedId, startTyping, finishTyping, stopInstance]
  );
const { soundEnabled, effectsEnabled } = useUI();
useEffect(() => {
  if (!soundEnabled || !effectsEnabled || typingIds.length === 0) {
    stopTypingLoop();
    return;
  }

  primeAudio().then(() => startTypingLoop()).catch(() => {});

  return () => {
    stopTypingLoop();
  };
}, [soundEnabled, effectsEnabled, typingIds.length]);

  return <TypewriterCursorContext.Provider value={value}>{children}</TypewriterCursorContext.Provider>;
}

function useTypewriterCursorCtx() {
  const ctx = useContext(TypewriterCursorContext);
  if (!ctx) throw new Error("TypewriterCursorContext missing (wrap with <TypewriterCursorProvider>).");
  return ctx;
}

export function TypewriterText({
  text,
  speedMs = 10,
  startDelayMs = 0,
  className = "",
  showCursor = true,
  cursorChar = "█",
  as = "div",
  onDone,
}: {
  text: string;
  speedMs?: number;
  startDelayMs?: number;
  className?: string;
  showCursor?: boolean;
  cursorChar?: string;
  as?: "div" | "pre";
  onDone?: () => void;
}) {
  const prefersReduced = usePrefersReducedMotion();
  const { effectsEnabled } = useUI();

  const reduceMotion = prefersReduced || !effectsEnabled;

  const { typingIds, lastFinishedId, startTyping, finishTyping, stopInstance } =
    useTypewriterCursorCtx();

  const id = useId();
  const [i, setI] = useState(reduceMotion ? text.length : 0);
  const [done, setDone] = useState(reduceMotion);

  const startTimeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const onDoneRef = useRef<(() => void) | undefined>(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const didFireDoneRef = useRef(false);
  const fireDoneOnce = () => {
    if (didFireDoneRef.current) return;
    didFireDoneRef.current = true;
    onDoneRef.current?.();
  };

  const clearAllTimers = () => {
    if (startTimeoutRef.current !== null) {
      window.clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const isTypingNow = typingIds.includes(id);
  const anyTyping = typingIds.length > 0;

  useEffect(() => {
    clearAllTimers();
    didFireDoneRef.current = false;

    if (reduceMotion) {
      setI(text.length);
      setDone(true);
      finishTyping(id, showCursor);
      fireDoneOnce();
      return () => {
        clearAllTimers();
        stopInstance(id);
      };
    }

    if (!text) {
      setI(0);
      setDone(true);
      finishTyping(id, showCursor);
      fireDoneOnce();
      return () => {
        clearAllTimers();
        stopInstance(id);
      };
    }

    setI(0);
    setDone(false);

    startTimeoutRef.current = window.setTimeout(() => {
      startTyping(id);

      intervalRef.current = window.setInterval(() => {
        setI((prev) => {
          const next = prev + 1;

          if (next >= text.length) {
            clearAllTimers();
            setDone(true);
            finishTyping(id, showCursor);
            fireDoneOnce();
            return text.length;
          }

          return next;
        });
      }, speedMs);
    }, startDelayMs);

    return () => {
      clearAllTimers();
      stopInstance(id);
    };
  }, [
    id,
    text,
    speedMs,
    startDelayMs,
    reduceMotion,
    showCursor,
    startTyping,
    finishTyping,
    stopInstance,
  ]);

  const cursorVisible = showCursor && (isTypingNow || (!anyTyping && done && lastFinishedId === id));
  const Tag = as;

  return (
    <Tag
      className={className}
      onClick={() => {
        clearAllTimers();
        setI(text.length);
        setDone(true);
        finishTyping(id, showCursor);
        fireDoneOnce();
      }}
      title="Click to reveal instantly"
    >
      <span>{text.slice(0, i)}</span>

      {cursorVisible && (
        <>
          <span className="ml-1 inline-block animate-[blink_1s_steps(1)_infinite]">{cursorChar}</span>
          <style>{`
            @keyframes blink { 50% { opacity: 0; } }
          `}</style>
        </>
      )}
    </Tag>
  );
}
