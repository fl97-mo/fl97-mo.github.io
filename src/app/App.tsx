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

import {
  primeAudio,
  startHoverNoise,
  startStatic,
  stopHoverNoise,
  stopStatic,
  playSound,
} from "./utils/sfx";
import { TypewriterCursorProvider } from "./components/Typewriter";
import { useUI } from "./store/ui";
import { useFocusTrap } from "./utils/useFocusTrap";

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

const MAIN_HEADINGS: Record<TabId, string> = {
  home: "FL97 MO Portfolio",
  systems: "Systems directory",
  coding: "Coding directory",
  music: "Music directory",
  eq: "Equalizer directory",
  astronaut: "Astronaut logo lab",
  imprint: "Imprint",
  privacy: "Privacy policy",
};

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
  const mainRef = useRef<HTMLElement | null>(null);
  const a11yNoticeRef = useRef<HTMLDivElement | null>(null);
  const a11yNoticeDismissRef = useRef<HTMLButtonElement | null>(null);
  const eqWarningRef = useRef<HTMLDivElement | null>(null);
  const eqWarningDismissRef = useRef<HTMLButtonElement | null>(null);

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

  const introComplete = introDone || accessibilityEnabled || !effectsEnabled;
  const homeRevealComplete = homeRevealDone || accessibilityEnabled || !effectsEnabled;
  const chromeHasRevealedRef = useRef(homeRevealComplete);
  const [navigationVisible, setNavigationVisible] = useState(homeRevealComplete);
  const [footerVisible, setFooterVisible] = useState(homeRevealComplete);

  const dismissEqWarning = useCallback(() => {
    setEqWarningOpen(false);
    setEqWarningDismissed(true);
    writeSessionBool(SS_EQ_WARNING_DISMISSED, true);
  }, []);

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
    let activeLink: HTMLAnchorElement | null = null;

    const findLink = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      return target.closest<HTMLAnchorElement>("a[href]");
    };

    const startLinkNoise = (link: HTMLAnchorElement | null) => {
      if (!soundEnabled || !link || activeLink === link) return;
      activeLink = link;
      startHoverNoise(0.58, 2.15);
      void primeAudio(["NOISE"])
        .then(() => {
          if (activeLink === link && soundEnabled) startHoverNoise(0.58, 2.15);
        })
        .catch(() => {
          if (activeLink === link) activeLink = null;
        });
    };

    const stopLinkNoise = (link: HTMLAnchorElement | null, nextTarget?: EventTarget | null) => {
      if (!link || activeLink !== link) return;
      if (nextTarget instanceof Node && link.contains(nextTarget)) return;

      activeLink = null;
      stopHoverNoise();
    };

    const onPointerOver = (event: PointerEvent) => startLinkNoise(findLink(event.target));
    const onPointerOut = (event: PointerEvent) =>
      stopLinkNoise(findLink(event.target), event.relatedTarget);
    const onFocusIn = (event: FocusEvent) => startLinkNoise(findLink(event.target));
    const onFocusOut = (event: FocusEvent) =>
      stopLinkNoise(findLink(event.target), event.relatedTarget);

    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      stopHoverNoise();
    };
  }, [soundEnabled]);

  useEffect(() => {
    if (effectsEnabled && !accessibilityEnabled) return;
    if (!introDone) markIntroDone();
    if (!homeRevealDone) markHomeRevealDone();
  }, [
    accessibilityEnabled,
    effectsEnabled,
    homeRevealDone,
    introDone,
    markHomeRevealDone,
    markIntroDone,
  ]);

  useEffect(() => {
    if (!accessibilityAutoDetected) return;

    const timer = window.setTimeout(() => {
      dismissAccessibilityAutoDetected();
    }, 12000);

    return () => window.clearTimeout(timer);
  }, [accessibilityAutoDetected, dismissAccessibilityAutoDetected]);

  useFocusTrap({
    active: accessibilityAutoDetected && !eqWarningOpen,
    containerRef: a11yNoticeRef,
    initialFocusRef: a11yNoticeDismissRef,
    onEscape: dismissAccessibilityAutoDetected,
  });

  useEffect(() => {
    if (!effectsEnabled || accessibilityEnabled) {
      chromeHasRevealedRef.current = true;
      setNavigationVisible(true);
      setFooterVisible(true);
      return;
    }

    if (!homeRevealDone) {
      chromeHasRevealedRef.current = false;
      setNavigationVisible(false);
      setFooterVisible(false);
      return;
    }

    if (chromeHasRevealedRef.current) {
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
    const shouldShowEqWarning =
      activeTab === "eq" && accessibilityEnabled && !eqWarningDismissed;

    setEqWarningOpen(shouldShowEqWarning);
  }, [accessibilityEnabled, activeTab, eqWarningDismissed]);

  useEffect(() => {
    if (!eqWarningOpen) return;

    window.setTimeout(() => eqWarningDismissRef.current?.focus(), 0);
  }, [dismissEqWarning, eqWarningOpen]);

  useFocusTrap({
    active: eqWarningOpen,
    containerRef: eqWarningRef,
    initialFocusRef: eqWarningDismissRef,
    onEscape: dismissEqWarning,
  });

  const navigateToTab = (tab: TabId) => {
    setActiveTab(tab);
    if (tab !== "systems") setSystemsTargetSlug(null);
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
  const showNavigation = navigationVisible || chromeInstant;
  const showFooter = footerVisible || chromeInstant;

  return (
    <CRTScreen>
      <TypewriterCursorProvider>
        <a
          href="#main-content"
          className="skip-link"
          onClick={(event) => {
            event.preventDefault();
            mainRef.current?.focus({ preventScroll: true });
            mainRef.current?.scrollIntoView({ block: "start" });
          }}
        >
          Skip to main content
        </a>

        <div
          aria-hidden={!showNavigation}
          className={`home-nav-reveal-shell ${showNavigation ? "is-visible" : ""} ${
            chromeInstant ? "is-instant" : ""
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            {showNavigation && (
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

        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          aria-labelledby="page-title"
          className="min-w-0 flex-1 focus:outline-none"
        >
          <h1 id="page-title" className="sr-only">
            {MAIN_HEADINGS[activeTab]}
          </h1>

          {activeTab === "home" && (
            <>
              <TerminalHeader introAlreadyDone={introComplete} onIntroDone={markIntroDone} />

              {introComplete && (
                <HomeContentReveal
                  instant={homeRevealComplete}
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
          aria-hidden={!showFooter}
          className={`mt-12 pt-6 border-t border-primary/30 text-center text-muted-foreground ${
            showFooter ? "home-chrome-reveal" : "invisible"
          }`}
        >
          <p className="flex items-center justify-center gap-2">
            <span className="text-primary">{">"}</span>
            <span>{"\u00a9"} 2025 PRIVATE PROJECT | SYSTEM VERSION 1.0.0</span>
          </p>

          <p className="mt-2 text-sm">Running on FLUX CAPACITOR | BUILD 0012231</p>

          <div className="mt-6 pt-3 border-t border-primary/10 text-xs tracking-widest flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (soundEnabled) {
                  primeAudio();
                  playSound("TERM", 0.2, 1.0, 400);
                }
                setActiveTab("imprint");
              }}
              className="text-primary/70 hover:text-primary transition-colors"
            >
              [ IMPRINT ]
            </button>

            <span className="text-primary/70" aria-hidden="true">::</span>

            <button
              type="button"
              onClick={() => {
                if (soundEnabled) {
                  primeAudio();
                  playSound("TERM", 0.2, 1.0, 400);
                }
                setActiveTab("privacy");
              }}
              className="text-primary/70 hover:text-primary transition-colors"
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
            ref={a11yNoticeRef}
            role="status"
            aria-live="polite"
            tabIndex={-1}
            className="
              fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2
              border-2 border-primary bg-background/95 p-4 text-primary
              crt-glow-overlay crt-inset-sunken
            "
          >
            <div className="mb-2 flex items-start justify-between gap-4 border-b border-primary/30 pb-2">
              <span className="text-sm tracking-widest">ACCESSIBILITY MODE DETECTED</span>
              <button
                ref={a11yNoticeDismissRef}
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
            ref={eqWarningRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="eq-warning-title"
            aria-describedby="eq-warning-copy"
            tabIndex={-1}
            className="
              fixed left-1/2 top-1/2 z-50 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2
              border-2 border-primary bg-background/95 p-4 text-primary
              crt-glow-overlay crt-inset-sunken
            "
          >
            <div className="mb-2 flex items-start justify-between gap-4 border-b border-primary/30 pb-2">
              <span id="eq-warning-title" className="text-sm tracking-widest">
                EQ A11Y MODE ACTIVE
              </span>
              <button
                ref={eqWarningDismissRef}
                type="button"
                onClick={dismissEqWarning}
                className="text-sm text-muted-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label="Dismiss EQ visual warning"
              >
                [X]
              </button>
            </div>
            <p id="eq-warning-copy" className="text-sm leading-relaxed">
              A11Y mode is active, so the EQ visualizers stay disabled here. Switch A11Y off in
              the top navigation if you want the animated EQ view.
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
