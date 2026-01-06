import { useEffect, useState } from "react";
import { TypewriterText } from "./Typewriter";
import { useUI } from "../store/ui";

const ASCII_BANNER = `
  _____ _     ___  ____  ___    _    _   _   __  __  ___  ____  ___ _   _    _    
 |  ___| |   / _ \\|  _ \\|_ _|  / \\  | \\ | | |  \\/  |/ _ \\|  _ \\|_ _| \\ | |  / \\   
 | |_  | |  | | | | |_) || |  / _ \\ |  \\| | | |\\/| | | | | |_) || ||  \\| | / _ \\  
 |  _| | |__| |_| |  _ < | | / ___ \\| |\\  | | |  | | |_| |  _ < | || |\\  |/ ___ \\ 
 |_|   |_____\\___/|_| \\_\\___/_/   \\_\\_| \\_| |_|  |_|\\___/|_| \\_\\___|_| \\_/_/   \\_\\
`;

type Props = {
  onIntroDone?: () => void;
  introAlreadyDone?: boolean;
};

export function TerminalHeader({ onIntroDone, introAlreadyDone = false }: Props) {
  const { effectsEnabled } = useUI();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(introAlreadyDone ? 3 : 0);

  useEffect(() => {
    if (introAlreadyDone) setStep(3);
  }, [introAlreadyDone]);

  useEffect(() => {
    if (!effectsEnabled && !introAlreadyDone) {
      setStep(3);
      onIntroDone?.();
    }
  }, [effectsEnabled, introAlreadyDone, onIntroDone]);

  if (introAlreadyDone) {
    return (
      <div className="mb-12">
        <div className="overflow-x-auto">
          <pre
            className="
              text-primary
              text-[9px] sm:text-[10px] md:text-xs lg:text-sm
              leading-tight
              select-none
              whitespace-pre
              min-w-max
              mb-6
            "
          >
            {ASCII_BANNER}
          </pre>
        </div>

        <div className="space-y-2 text-sm sm:text-base md:text-lg">
          <p className="text-muted-foreground flex items-start gap-2">
            <span className="text-primary">{">"}</span>
            <span>SYSTEM BOOT SEQUENCE COMPLETE</span>
          </p>
          <p className="text-muted-foreground flex items-start gap-2">
            <span className="text-primary">{">"}</span>
            <span>INITIALIZING WEBSITE.EXE</span>
          </p>
          <p className="text-primary flex items-start gap-2">
            <span>{">"}</span>
            <span>READY TO BROWSE...</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="overflow-x-auto">
        <TypewriterText
          as="pre"
          text={ASCII_BANNER}
          speedMs={1}
          startDelayMs={60}
          showCursor={false}
          className="
            text-primary
            text-[9px] sm:text-[10px] md:text-xs lg:text-sm
            leading-tight
            select-none
            whitespace-pre
            min-w-max
            mb-6
          "
          onDone={() => setStep(1)}
        />
      </div>

      <div className="space-y-2 text-sm sm:text-base md:text-lg">
        {step >= 1 && (
          <p className="text-muted-foreground flex items-start gap-2">
            <span className="text-primary">{">"}</span>
            <TypewriterText
              text="SYSTEM BOOT SEQUENCE COMPLETE"
              speedMs={12}
              startDelayMs={120}
              showCursor
              className="text-muted-foreground"
              onDone={() => setStep(2)}
            />
          </p>
        )}

        {step >= 2 && (
          <p className="text-muted-foreground flex items-start gap-2">
            <span className="text-primary">{">"}</span>
            <TypewriterText
              text="INITIALIZING WEBSITE.EXE..."
              speedMs={12}
              startDelayMs={120}
              showCursor
              className="text-muted-foreground"
              onDone={() => setStep(3)}
            />
          </p>
        )}

        {step >= 3 && (
          <p className="text-primary flex items-start gap-2">
            <span>{">"}</span>
            <TypewriterText
              text="READY TO BROWSE"
              speedMs={14}
              startDelayMs={140}
              showCursor
              className="text-primary"
              onDone={() => onIntroDone?.()}
            />
          </p>
        )}
      </div>
    </div>
  );
}
