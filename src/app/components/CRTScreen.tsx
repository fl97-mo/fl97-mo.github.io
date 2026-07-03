import { ReactNode } from "react";
import { useUI } from "../store/ui";

interface CRTScreenProps {
  children: ReactNode;
}

export function CRTScreen({ children }: CRTScreenProps) {
  const { effectsEnabled } = useUI();

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {effectsEnabled && (
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

      <div className="relative z-10 min-h-screen p-3 sm:p-4 md:p-6 xl:p-8">
        <div className="w-full max-w-[1800px] mx-auto bg-background/80 border-2 border-primary/40 rounded-lg p-4 sm:p-6 lg:p-8 xl:p-10 crt-glow-panel">
          {children}
        </div>
      </div>
    </div>
  );
}
