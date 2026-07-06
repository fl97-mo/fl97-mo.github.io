import { useEffect, useRef, useState } from "react";

import { TypewriterText } from "./Typewriter";

type HomeModuleLoaderProps = {
  modules: string[];
  mountedCount: number;
  complete: boolean;
  animated: boolean;
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
const BOOT_COMMANDS = [
  "cd ~/portfolio",
  "./scripts/load-home.sh",
];
const BOOT_TEXT_SPEED_MS = 10;
const BOOT_COMMAND_SPEED_MS = 18;
const READY_DOT_FRAMES = [".", "..", "..."];
const READY_DOT_INTERVAL_MS = 360;

export function HomeModuleLoader({
  modules,
  mountedCount,
  complete,
  animated,
  onBootDone,
}: HomeModuleLoaderProps) {
  const [frame, setFrame] = useState(0);
  const [readyDotFrame, setReadyDotFrame] = useState(0);
  const [bootStep, setBootStep] = useState(animated ? 1 : BOOT_READY_STEP);
  const didFinishBootRef = useRef(!animated);

  const isComplete = complete;
  const bootReady = bootStep >= BOOT_READY_STEP;

  useEffect(() => {
    if (isComplete || !bootReady) return;

    const timer = window.setInterval(() => {
      setFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 90);

    return () => window.clearInterval(timer);
  }, [bootReady, isComplete]);

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

  return (
    <section
      className={`
        home-loader-reveal relative mb-12
        h-[28rem] overflow-hidden
        rounded border border-primary/30 bg-card/50
        p-5 pt-8 crt-glow-soft sm:h-[29rem] sm:p-6 sm:pt-8
      `}
      aria-live={isComplete ? "off" : "polite"}
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
          {BOOT_COMMANDS.map((command, index) => {
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

      {isComplete && (
        <div className="home-ready-reveal mt-2 pt-2">
          <p className="flex items-start gap-2 text-sm text-primary sm:text-base">
            <span className="text-primary">{">"}</span>
            <span>
              READY TO BROWSE
              <span className="inline-block w-[1.5em] text-left" aria-hidden="true">
                {animated ? READY_DOT_FRAMES[readyDotFrame] : "..."}
              </span>
              <span className="sr-only">...</span>
            </span>
          </p>
        </div>
      )}
    </section>
  );
}
