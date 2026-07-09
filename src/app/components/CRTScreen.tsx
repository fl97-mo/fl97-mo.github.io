import { ReactNode } from "react";
import { useUI } from "../store/ui";

interface CRTScreenProps {
  children: ReactNode;
}

export function CRTScreen({ children }: CRTScreenProps) {
  const { accessibilityEnabled, effectsEnabled } = useUI();
  const showCrtEffects = effectsEnabled && !accessibilityEnabled;

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {showCrtEffects && (
        <>
          <div className="pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.15),rgba(0,0,0,0.15)_1px,transparent_1px,transparent_2px)]" />
          <div
            className="pointer-events-none fixed inset-0 z-40"
            style={{ boxShadow: "inset 0 0 100px var(--crt-screen-glow)" }}
          />
          <div className="pointer-events-none fixed inset-0 z-30 bg-primary/3 animate-[flicker_1.8s_infinite]" />

          <style>{`
            @keyframes flicker {
              0%   { opacity: 0.90; }
              15%  { opacity: 0.96; }
              30%  { opacity: 0.88; }
              45%  { opacity: 0.97; }
              60%  { opacity: 0.89; }
              75%  { opacity: 0.95; }
              100% { opacity: 0.91; }
            }
          `}</style>
        </>
      )}

      <div className="relative z-10 min-h-screen p-3 sm:p-4 md:p-5 xl:p-6">
        <div className="mx-auto flex min-h-[calc(100svh-1.5rem)] w-full max-w-none flex-col rounded-lg border-2 border-primary/40 bg-background/80 p-4 crt-glow-panel sm:min-h-[calc(100svh-2rem)] sm:p-6 md:min-h-[calc(100svh-2.5rem)] lg:p-8 xl:min-h-[calc(100svh-3rem)] xl:p-9">
          {children}
        </div>
      </div>
    </div>
  );
}
