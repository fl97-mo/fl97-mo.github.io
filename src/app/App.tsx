import { useCallback, useEffect, useRef, useState } from "react";

import { CRTScreen } from "./components/CRTScreen";
import { RetroNavigation, TabId } from "./components/RetroNavigation";

import { TerminalHeader } from "./components/TerminalHeader";
import { HomeContentReveal } from "./components/HomeContentReveal";

import { SystemsPage } from "./components/SystemsPage";
import { CodingPage } from "./components/CodingPage";
import { MusicPage } from "./components/MusicPage";
import { EqualizerPage } from "./components/EqualizerPage";
import { AstronautLogoLab } from "./components/AstronautLogoLab";
import { INFOPage } from "./components/info";
import { PrivacyPage } from "./components/PrivacyPage";
import { TerminalOverlay } from "./components/TerminalOverlay";
import { ColorPickerDialog } from "./components/ColorPickerDialog";

import { primeAudio, startStatic, stopStatic, playSound } from "./utils/sfx";
import { TypewriterCursorProvider } from "./components/Typewriter";
import { useUI } from "./store/ui";

const SS_EQ_WARNING_DISMISSED = "ui.eqWarningDismissed.session";

function readSessionBool(key: string, fallback: boolean) {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === "1";
  } catch {
    return fallback;
  }
}

function writeSessionBool(key: string, value: boolean) {
  try {
    window.sessionStorage.setItem(key, value ? "1" : "0");
  } catch {}
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [systemsTargetSlug, setSystemsTargetSlug] = useState<string | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [eqWarningDismissed, setEqWarningDismissed] = useState(() =>
    readSessionBool(SS_EQ_WARNING_DISMISSED, false)
  );
  const [eqWarningOpen, setEqWarningOpen] = useState(false);

  const primedRef = useRef(false);
  const terminalButtonRef = useRef<HTMLButtonElement | null>(null);

  const {
    introDone,
    homeRevealDone,
    accessibilityEnabled,
    accessibilityAutoDetected,
    markIntroDone,
    markHomeRevealDone,
    dismissAccessibilityAutoDetected,
    effectsEnabled,
    soundEnabled,
  } = useUI();

  const chromeHasRevealedRef = useRef(homeRevealDone);
  const [navigationVisible, setNavigationVisible] = useState(homeRevealDone);
  const [footerVisible, setFooterVisible] = useState(homeRevealDone);

  useEffect(() => {
    const handler = async () => {
      if (primedRef.current) return;
      primedRef.current = true;

      try {
        await primeAudio(["TERM", "BTN_MECH", "STATIC", "TYPING", "NOISE"]);
        if (soundEnabled && !accessibilityEnabled) startStatic();
      } catch {}
    };

    window.addEventListener("pointerdown", handler, { once: true, passive: true });
    window.addEventListener("keydown", handler, { once: true });
    window.addEventListener("touchstart", handler, { once: true, passive: true });

    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, [accessibilityEnabled, soundEnabled]);

  useEffect(() => {
    if (!primedRef.current) return;
    if (soundEnabled && !accessibilityEnabled) startStatic();
    else stopStatic();
  }, [accessibilityEnabled, soundEnabled]);

  useEffect(() => {
    if ((!effectsEnabled || accessibilityEnabled) && !introDone) markIntroDone();
  }, [accessibilityEnabled, effectsEnabled, introDone, markIntroDone]);

  useEffect(() => {
    if (!accessibilityAutoDetected) return;

    const timer = window.setTimeout(() => {
      dismissAccessibilityAutoDetected();
    }, 12000);

    return () => window.clearTimeout(timer);
  }, [accessibilityAutoDetected, dismissAccessibilityAutoDetected]);

  useEffect(() => {
    if (!homeRevealDone) {
      chromeHasRevealedRef.current = false;
      setNavigationVisible(false);
      setFooterVisible(false);
      return;
    }

    if (chromeHasRevealedRef.current || !effectsEnabled || accessibilityEnabled) {
      chromeHasRevealedRef.current = true;
      setNavigationVisible(true);
      setFooterVisible(true);
      return;
    }

    setNavigationVisible(true);

    const footerTimer = window.setTimeout(() => {
      chromeHasRevealedRef.current = true;
      setFooterVisible(true);
    }, 360);

    return () => window.clearTimeout(footerTimer);
  }, [accessibilityEnabled, effectsEnabled, homeRevealDone]);

  useEffect(() => {
    if (activeTab === "eq" && !eqWarningDismissed) {
      setEqWarningOpen(true);
    }
  }, [activeTab, eqWarningDismissed]);

  const navigateToTab = (tab: TabId) => {
    setActiveTab(tab);
    if (tab !== "systems") setSystemsTargetSlug(null);
  };

  const dismissEqWarning = () => {
    setEqWarningOpen(false);
    setEqWarningDismissed(true);
    writeSessionBool(SS_EQ_WARNING_DISMISSED, true);
  };

  const closeTerminal = () => {
    setTerminalOpen(false);
    window.requestAnimationFrame(() => {
      terminalButtonRef.current?.focus();
    });
  };

  const openTerminal = () => {
    if (soundEnabled) {
      primeAudio().catch(() => {});
      playSound("TERM", 0.22, 1.0, 120);
    }
    setTerminalOpen(true);
  };

  const revealFooter = useCallback(() => {
    chromeHasRevealedRef.current = true;
    setFooterVisible(true);
  }, []);
  const chromeInstant = !effectsEnabled || accessibilityEnabled;

  return (
    <CRTScreen>
      <TypewriterCursorProvider>
        <div
          aria-hidden={!navigationVisible}
          className={`home-nav-reveal-shell ${navigationVisible ? "is-visible" : ""} ${
            chromeInstant ? "is-instant" : ""
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            {navigationVisible && (
              <RetroNavigation
                activeTab={activeTab}
                onChange={navigateToTab}
                onOpenTerminal={openTerminal}
                terminalButtonRef={terminalButtonRef}
                terminalOpen={terminalOpen}
              />
            )}
          </div>
        </div>

        <main className="min-w-0 flex-1">
          {activeTab === "home" && (
            <>
              <TerminalHeader introAlreadyDone={introDone} onIntroDone={markIntroDone} />

              {introDone && (
                <HomeContentReveal
                  instant={homeRevealDone}
                  activeTab={activeTab}
                  onDone={markHomeRevealDone}
                  onFooterMounted={revealFooter}
                  onNavigate={navigateToTab}
                  onOpenSystems={(slug) => {
                    setSystemsTargetSlug(slug);
                    setActiveTab("systems");
                  }}
                />
              )}
            </>
          )}

          {activeTab === "systems" && (
            <SystemsPage
              initialOpenSlug={systemsTargetSlug}
              onConsumedInitialOpen={() => setSystemsTargetSlug(null)}
            />
          )}

          {activeTab === "coding" && <CodingPage />}
          {activeTab === "music" && <MusicPage onOpenEQ={() => setActiveTab("eq")} />}
          {activeTab === "eq" && <EqualizerPage />}

          {activeTab === "astronaut" && <AstronautLogoLab />}

          {activeTab === "imprint" && <INFOPage />}
          {activeTab === "privacy" && <PrivacyPage />}
        </main>

        <footer
          aria-hidden={!footerVisible}
          className={`mt-12 pt-6 border-t border-primary/30 text-center text-muted-foreground ${
            footerVisible ? "home-chrome-reveal" : "invisible"
          }`}
        >
          <p className="flex items-center justify-center gap-2">
            <span className="text-primary">{">"}</span>
            <span>{"\u00a9"} 2025 PRIVATE PROJECT | SYSTEM VERSION 1.0.0</span>
          </p>

          <p className="mt-2 text-sm">Running on FLUX CAPACITOR | BUILD 0012231</p>

          <div className="mt-6 pt-3 border-t border-primary/10 text-xs tracking-widest flex items-center justify-center gap-4">
            <button
              onClick={() => {
                if (soundEnabled) {
                  primeAudio();
                  playSound("TERM", 0.2, 1.0, 400);
                }
                setActiveTab("imprint");
              }}
              className="text-primary/50 hover:text-primary transition-colors"
            >
              [ IMPRINT ]
            </button>

            <span className="text-primary/30">::</span>

            <button
              onClick={() => {
                if (soundEnabled) {
                  primeAudio();
                  playSound("TERM", 0.2, 1.0, 400);
                }
                setActiveTab("privacy");
              }}
              className="text-primary/50 hover:text-primary transition-colors"
            >
              [ PRIVACY ]
            </button>
          </div>
        </footer>

        <TerminalOverlay
          open={terminalOpen}
          activeTab={activeTab}
          onClose={closeTerminal}
          onNavigate={navigateToTab}
        />

        <ColorPickerDialog />

        {accessibilityAutoDetected && (
          <div
            role="status"
            aria-live="polite"
            className="
              fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2
              border-2 border-primary bg-background/95 p-4 text-primary
              crt-glow-overlay crt-inset-sunken
            "
          >
            <div className="mb-2 flex items-start justify-between gap-4 border-b border-primary/30 pb-2">
              <span className="text-sm tracking-widest">A11Y MODE DETECTED</span>
              <button
                type="button"
                onClick={dismissAccessibilityAutoDetected}
                className="text-sm text-muted-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label="Dismiss accessibility mode notice"
              >
                [X]
              </button>
            </div>
            <p className="text-sm leading-relaxed">
              Accessibility mode detected. I turned off all effects and animations for you.
              If you think that is a mistake, just switch off the A11Y mode with the top-right switch. Enjoy your stay :)
            </p>
          </div>
        )}

        {eqWarningOpen && (
          <div
            role="alertdialog"
            aria-modal="false"
            aria-labelledby="eq-warning-title"
            aria-describedby="eq-warning-copy"
            className="
              fixed left-1/2 top-1/2 z-50 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2
              border-2 border-primary bg-background/95 p-4 text-primary
              crt-glow-overlay crt-inset-sunken
            "
          >
            <div className="mb-2 flex items-start justify-between gap-4 border-b border-primary/30 pb-2">
              <span id="eq-warning-title" className="text-sm tracking-widest">
                EQ VISUAL WARNING
              </span>
              <button
                type="button"
                onClick={dismissEqWarning}
                className="text-sm text-muted-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label="Dismiss EQ visual warning"
              >
                [X]
              </button>
            </div>
            <p id="eq-warning-copy" className="text-sm leading-relaxed">
              Be cautious: this EQ uses flashy visual elements. If you have sensory
              sensitivity or prefer reduced stimulation, you might want to skip this one.
            </p>
            <button
              type="button"
              onClick={dismissEqWarning}
              className="mt-3 border border-primary/50 px-3 py-1.5 text-xs tracking-widest text-primary transition-colors hover:border-primary hover:bg-primary hover:text-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              [ OK, CONTINUE ]
            </button>
          </div>
        )}
      </TypewriterCursorProvider>
    </CRTScreen>
  );
}
