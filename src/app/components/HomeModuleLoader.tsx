import { useEffect, useRef, useState } from "react";

import { TypewriterText } from "./Typewriter";
import type { TabId } from "./RetroNavigation";
import { TerminalOverlay } from "./TerminalOverlay";
import { HOME_BOOT_COMMANDS, HOME_BOOT_READY_TEXT } from "./homeBootSequence";
import { useUI } from "../store/ui";
import { primeAudio, startHoverNoise, stopHoverNoise } from "../utils/sfx";

type HomeModuleLoaderProps = {
  modules: string[];
  mountedCount: number;
  complete: boolean;
  animated: boolean;
  activeTab: TabId;
  onNavigate: (tab: TabId) => void;
  onAbortBoot: () => void;
  onBootDone: () => void;
};

const SPINNER_FRAMES = [
  "\u280b",
  "\u2819",
  "\u2839",
  "\u2838",
  "\u283c",
  "\u2834",
  "\u2826",
  "\u2827",
  "\u2807",
  "\u280f",
];

const BOOT_COMMAND_STEP = 4;
const BOOT_READY_STEP = 6;
const BOOT_TEXT_SPEED_MS = 10;
const BOOT_COMMAND_SPEED_MS = 18;
const READY_DOT_FRAMES = [".", "..", "..."];
const READY_DOT_INTERVAL_MS = 360;
const READY_HOLD_BEFORE_COLLAPSE_MS = 1250;
const CONTENT_FADE_BEFORE_COLLAPSE_MS = 360;
const INLINE_TERMINAL_BODY_REVEAL_MS = 360;
const INLINE_TERMINAL_BODY_HIDE_MS = 120;
const INLINE_TERMINAL_COLLAPSE_MS = 700;
const INLINE_TERMINAL_UNMOUNT_MS = INLINE_TERMINAL_BODY_HIDE_MS + INLINE_TERMINAL_COLLAPSE_MS + 40;
type CollapseState = "expanded" | "settling" | "collapsed";

export function HomeModuleLoader({
  modules,
  mountedCount,
  complete,
  animated,
  activeTab,
  onNavigate,
  onAbortBoot,
  onBootDone,
}: HomeModuleLoaderProps) {
  const { soundEnabled } = useUI();
  const [frame, setFrame] = useState(0);
  const [readyDotFrame, setReadyDotFrame] = useState(0);
  const [collapseState, setCollapseState] = useState<CollapseState>(
    !animated && complete ? "collapsed" : "expanded"
  );
  const [inlineTerminalMounted, setInlineTerminalMounted] = useState(false);
  const [inlineTerminalExpanded, setInlineTerminalExpanded] = useState(false);
  const [inlineTerminalBodyVisible, setInlineTerminalBodyVisible] = useState(false);
  const [inlineTerminalHasOpened, setInlineTerminalHasOpened] = useState(false);
  const [bootStep, setBootStep] = useState(animated ? 1 : BOOT_READY_STEP);
  const didFinishBootRef = useRef(!animated);
  const completionAnimationHandledRef = useRef(!animated && complete);
  const inlineBodyRevealTimerRef = useRef<number | null>(null);
  const inlineCollapseTimerRef = useRef<number | null>(null);
  const inlineCloseTimerRef = useRef<number | null>(null);
  const inlineOpenRafRef = useRef<number | null>(null);

  const isComplete = complete;
  const bootReady = bootStep >= BOOT_READY_STEP;
  const collapsed = collapseState === "collapsed";
  const contentVisible = collapseState === "expanded";
  const canOpenInlineTerminal = isComplete && collapsed && !inlineTerminalMounted;
  const readyDots = animated ? READY_DOT_FRAMES[readyDotFrame] : "...";

  useEffect(() => {
    if (isComplete || !bootReady) return;

    const timer = window.setInterval(() => {
      setFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 90);

    return () => window.clearInterval(timer);
  }, [bootReady, isComplete]);

  useEffect(() => {
    return () => {
      stopHoverNoise();
      if (inlineBodyRevealTimerRef.current !== null) window.clearTimeout(inlineBodyRevealTimerRef.current);
      if (inlineCollapseTimerRef.current !== null) window.clearTimeout(inlineCollapseTimerRef.current);
      if (inlineCloseTimerRef.current !== null) window.clearTimeout(inlineCloseTimerRef.current);
      if (inlineOpenRafRef.current !== null) window.cancelAnimationFrame(inlineOpenRafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!bootReady || didFinishBootRef.current) return;
    didFinishBootRef.current = true;
    onBootDone();
  }, [bootReady, onBootDone]);

  useEffect(() => {
    if (!isComplete || !animated) {
      setReadyDotFrame(READY_DOT_FRAMES.length - 1);
      return;
    }

    setReadyDotFrame(0);

    const timer = window.setInterval(() => {
      setReadyDotFrame((prev) => (prev >= READY_DOT_FRAMES.length - 1 ? 1 : prev + 1));
    }, READY_DOT_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [animated, isComplete]);

  useEffect(() => {
    if (!isComplete) {
      setCollapseState("expanded");
      setInlineTerminalMounted(false);
      setInlineTerminalExpanded(false);
      setInlineTerminalBodyVisible(false);
      setInlineTerminalHasOpened(false);
      completionAnimationHandledRef.current = false;
      return;
    }

    if (!animated) {
      setCollapseState("collapsed");
      completionAnimationHandledRef.current = true;
      return;
    }

    if (completionAnimationHandledRef.current) return;
    completionAnimationHandledRef.current = true;

    setCollapseState("expanded");

    const settleTimer = window.setTimeout(() => {
      setCollapseState("settling");
    }, READY_HOLD_BEFORE_COLLAPSE_MS);

    const collapseTimer = window.setTimeout(() => {
      setCollapseState("collapsed");
    }, READY_HOLD_BEFORE_COLLAPSE_MS + CONTENT_FADE_BEFORE_COLLAPSE_MS);

    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(collapseTimer);
    };
  }, [animated, isComplete]);

  const openInlineTerminal = () => {
    if (!canOpenInlineTerminal) return;
    stopHoverNoise();
    if (inlineBodyRevealTimerRef.current !== null) window.clearTimeout(inlineBodyRevealTimerRef.current);
    if (inlineCollapseTimerRef.current !== null) window.clearTimeout(inlineCollapseTimerRef.current);
    if (inlineCloseTimerRef.current !== null) window.clearTimeout(inlineCloseTimerRef.current);
    if (inlineOpenRafRef.current !== null) window.cancelAnimationFrame(inlineOpenRafRef.current);

    setInlineTerminalHasOpened(true);
    setInlineTerminalMounted(true);
    setInlineTerminalExpanded(false);
    setInlineTerminalBodyVisible(false);

    inlineOpenRafRef.current = window.requestAnimationFrame(() => {
      setInlineTerminalExpanded(true);
      inlineOpenRafRef.current = null;
    });

    inlineBodyRevealTimerRef.current = window.setTimeout(() => {
      setInlineTerminalBodyVisible(true);
      inlineBodyRevealTimerRef.current = null;
    }, INLINE_TERMINAL_BODY_REVEAL_MS);
  };

  const skipLoadingAnimation = () => {
    if (isComplete) return;
    stopHoverNoise();
    if (inlineBodyRevealTimerRef.current !== null) window.clearTimeout(inlineBodyRevealTimerRef.current);
    if (inlineCollapseTimerRef.current !== null) window.clearTimeout(inlineCollapseTimerRef.current);
    if (inlineCloseTimerRef.current !== null) window.clearTimeout(inlineCloseTimerRef.current);
    if (inlineOpenRafRef.current !== null) window.cancelAnimationFrame(inlineOpenRafRef.current);

    didFinishBootRef.current = true;
    completionAnimationHandledRef.current = true;
    setBootStep(BOOT_READY_STEP);
    setCollapseState("collapsed");
    setInlineTerminalMounted(false);
    setInlineTerminalExpanded(false);
    setInlineTerminalBodyVisible(false);
    setInlineTerminalHasOpened(false);
    onAbortBoot();
  };

  const closeInlineTerminal = () => {
    if (!inlineTerminalMounted) return;
    stopHoverNoise();
    if (inlineBodyRevealTimerRef.current !== null) window.clearTimeout(inlineBodyRevealTimerRef.current);
    if (inlineCollapseTimerRef.current !== null) window.clearTimeout(inlineCollapseTimerRef.current);
    if (inlineCloseTimerRef.current !== null) window.clearTimeout(inlineCloseTimerRef.current);
    if (inlineOpenRafRef.current !== null) window.cancelAnimationFrame(inlineOpenRafRef.current);

    setInlineTerminalBodyVisible(false);

    inlineCollapseTimerRef.current = window.setTimeout(() => {
      setInlineTerminalExpanded(false);
      inlineCollapseTimerRef.current = null;
    }, INLINE_TERMINAL_BODY_HIDE_MS);

    inlineCloseTimerRef.current = window.setTimeout(() => {
      setInlineTerminalMounted(false);
      inlineCloseTimerRef.current = null;
    }, INLINE_TERMINAL_UNMOUNT_MS);
  };

  const startReadyHoverNoise = () => {
    if (!canOpenInlineTerminal || !soundEnabled) return;
    void primeAudio(["NOISE"])
      .then(() => startHoverNoise())
      .catch(() => {});
  };

  const activeIndex = bootReady && !isComplete && mountedCount < modules.length ? mountedCount : null;
  const renderedModules = modules.slice(
    0,
    isComplete ? modules.length : bootReady ? Math.min(modules.length, mountedCount + 1) : 0
  );

  const renderBootText = (
    text: string,
    step: number,
    nextStep?: number,
    className = "",
    speedMs = BOOT_TEXT_SPEED_MS
  ) => {
    if (!animated || bootStep > step) return <span className={className}>{text}</span>;
    if (bootStep < step) return null;

    return (
      <TypewriterText
        as="span"
        text={text}
        speedMs={speedMs}
        startDelayMs={step === 1 ? 100 : 90}
        showCursor={false}
        className={className}
        onDone={() => {
          if (nextStep !== undefined) setBootStep(nextStep);
        }}
      />
    );
  };

  const readyLabel = (
    <span className="flex min-w-0 items-start gap-2">
      <span className="text-primary">{">"}</span>
      <span className="min-w-0 truncate">
        {HOME_BOOT_READY_TEXT}
        <span className="inline-block w-[1.5em] text-left" aria-hidden="true">
          {readyDots}
        </span>
        <span className="sr-only">...</span>
      </span>
    </span>
  );
  const loaderStatus = isComplete
    ? "Home content loaded. Inline terminal is ready."
    : !bootReady
    ? "Starting home boot sequence."
    : activeIndex !== null
    ? `Loading ${modules[activeIndex]}. ${mountedCount} of ${modules.length} modules loaded.`
    : `Loading home content. ${mountedCount} of ${modules.length} modules loaded.`;

  return (
    <section
      className={`
        ${animated ? "home-loader-reveal" : ""}
        relative overflow-hidden
        rounded border border-primary/30 bg-card/50
        crt-glow-soft
        transition-[height,padding,margin] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${
          inlineTerminalExpanded
            ? "mb-12 h-[32rem] p-0 sm:h-[34rem] lg:h-[36rem]"
            : collapsed
            ? "mb-8 h-14 p-0"
            : "mb-12 h-[28rem] p-5 pt-8 sm:h-[29rem] sm:p-6 sm:pt-8"
        }
      `}
    >
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {loaderStatus}
      </p>

      <div
        aria-hidden={!contentVisible || inlineTerminalMounted}
        className={`
          transition-[opacity,transform] duration-300 ease-out
          ${
            contentVisible && !inlineTerminalMounted
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0"
          }
        `}
      >
        <div className="mb-5 space-y-2.5 text-muted-foreground sm:mb-6 sm:space-y-3">
          {bootStep >= 1 && (
            <p className="flex items-start gap-2 text-sm sm:text-base">
              <span className="text-primary">{">"}</span>
              {renderBootText("SYSTEM BOOT SEQUENCE COMPLETE", 1, 2)}
            </p>
          )}

          {bootStep >= 2 && (
            <p className="flex items-start gap-2 text-sm sm:text-base">
              <span className="text-primary">{">"}</span>
              {renderBootText("READING HOME MANIFEST", 2, 3)}
            </p>
          )}

          {bootStep >= 3 && (
            <p className="flex items-start gap-2 text-sm sm:text-base">
              <span className="text-primary">{">"}</span>
              {renderBootText("STARTING HOME TARGET", 3, 4)}
            </p>
          )}
        </div>

        {bootStep >= BOOT_COMMAND_STEP && (
          <div className="mb-5 space-y-1 overflow-x-auto text-sm text-muted-foreground">
            {HOME_BOOT_COMMANDS.map((command, index) => {
              const step = BOOT_COMMAND_STEP + index;
              if (bootStep < step) return null;

              return (
                <p key={command} className="whitespace-nowrap">
                  <span className="text-primary">visitor@fl97</span>
                  <span className="text-primary/60">:</span>
                  <span>{index === 0 ? "~" : "~/portfolio"}</span>
                  <span className="text-primary"> $ </span>
                  {renderBootText(command, step, step + 1, "text-primary", BOOT_COMMAND_SPEED_MS)}
                  {animated && bootStep === step && (
                    <span className="ml-1 inline-block animate-pulse text-primary">
                      {"\u2588"}
                    </span>
                  )}
                </p>
              );
            })}
          </div>
        )}

        {bootReady && (
          <div className="space-y-2 text-sm">
            {renderedModules.map((moduleName, index) => {
              const isMounted = mountedCount > index;
              const isActive = activeIndex === index;

              return (
                <div
                  key={moduleName}
                  className="flex min-w-0 items-center gap-3 text-muted-foreground"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {isMounted ? "loaded" : isActive ? "loading" : "queued"} {moduleName}
                  </span>

                  <span
                    className={`shrink-0 ${
                      isMounted ? "text-primary" : "text-primary/70"
                    }`}
                  >
                    {isMounted ? "[ OK ]" : `[ ${SPINNER_FRAMES[frame]} ]`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!isComplete && !inlineTerminalMounted && (
        <button
          type="button"
          onClick={skipLoadingAnimation}
          className="absolute inset-0 z-10 cursor-pointer bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label="Skip loading animation"
        />
      )}

      {isComplete && !inlineTerminalMounted && (
        <button
          type="button"
          onClick={openInlineTerminal}
          disabled={!canOpenInlineTerminal}
          onMouseEnter={startReadyHoverNoise}
          onMouseLeave={stopHoverNoise}
          onFocus={startReadyHoverNoise}
          onBlur={stopHoverNoise}
          className={`
            absolute inset-x-0 flex h-14 items-center px-4 text-left text-sm text-primary
            bg-card/80
            transition-[background-color,opacity,transform] duration-300 sm:px-5 sm:text-base
            hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none
            disabled:cursor-default disabled:hover:bg-transparent
            ${inlineTerminalHasOpened ? "top-0 border-b border-primary/30" : "home-ready-reveal bottom-0"}
          `}
          aria-label="Open inline terminal"
        >
          {readyLabel}
        </button>
      )}

      {isComplete && inlineTerminalMounted && (
        <div
          aria-hidden={!inlineTerminalExpanded}
          className={`
            absolute inset-0 overflow-hidden transition-opacity duration-300
            ${inlineTerminalExpanded ? "opacity-100" : "pointer-events-none opacity-100"}
          `}
        >
          <TerminalOverlay
            open={inlineTerminalMounted}
            activeTab={activeTab}
            onClose={closeInlineTerminal}
            onNavigate={onNavigate}
            variant="inline"
            inlineHeaderTitle={readyLabel}
            inlineBodyVisible={inlineTerminalBodyVisible}
          />
        </div>
      )}
    </section>
  );
}
