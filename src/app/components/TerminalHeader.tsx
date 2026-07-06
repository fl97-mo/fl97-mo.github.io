import { useEffect } from "react";
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

  useEffect(() => {
    if (!effectsEnabled && !introAlreadyDone) {
      onIntroDone?.();
    }
  }, [effectsEnabled, introAlreadyDone, onIntroDone]);

  if (introAlreadyDone) {
    return (
      <div className="mb-8">
        <div className="overflow-x-auto">
          <pre
            className="
              text-primary
              text-xs sm:text-xs md:text-xs lg:text-sm
              leading-tight
              select-none
              whitespace-pre
              min-w-max
            "
          >
            {ASCII_BANNER}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="overflow-x-auto">
        <TypewriterText
          as="pre"
          text={ASCII_BANNER}
          speedMs={1}
          startDelayMs={60}
          showCursor={false}
          className="
            text-primary
            text-xs sm:text-xs md:text-xs lg:text-sm
            leading-tight
            select-none
            whitespace-pre
            min-w-max
          "
          onDone={onIntroDone}
        />
      </div>
    </div>
  );
}
