import { ReactNode } from "react";
import { useUI } from "../store/ui";

interface CRTScreenProps {
  children: ReactNode;
}

export function CRTScreen({ children }: CRTScreenProps) {
  const { accessibilityEnabled, effectsEnabled } = useUI();
  const showCrtEffects = effectsEnabled && !accessibilityEnabled;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {showCrtEffects && (
        <div className="crt-effects" aria-hidden="true">
          <div className="crt-effects__phosphor" />
          <div className="crt-effects__glass" />
        </div>
      )}

      <div className="relative z-10 min-h-screen p-3 sm:p-4 md:p-5 xl:p-6">
        <div className="mx-auto flex min-h-[calc(100svh-1.5rem)] w-full max-w-none flex-col rounded-lg border-2 border-primary/40 bg-background/80 p-4 crt-glow-panel sm:min-h-[calc(100svh-2rem)] sm:p-6 md:min-h-[calc(100svh-2.5rem)] lg:p-8 xl:min-h-[calc(100svh-3rem)] xl:p-9">
          {children}
        </div>
      </div>
    </div>
  );
}
