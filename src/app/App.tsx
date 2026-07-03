import { useEffect, useRef, useState } from "react";

import { CRTScreen } from "./components/CRTScreen";
import { RetroNavigation, TabId } from "./components/RetroNavigation";

import { TerminalHeader } from "./components/TerminalHeader";
import { AboutSection } from "./components/AboutSection";
import { SkillsSection } from "./components/SkillsSection";
import { ProjectsSection } from "./components/ProjectsSection";
import { ContactSection } from "./components/ContactSection";

import { SystemsPage } from "./components/SystemsPage";
import { CodingPage } from "./components/CodingPage";
import { MusicPage } from "./components/MusicPage";
import { EqualizerPage } from "./components/EqualizerPage";
import { AstronautLogoLab } from "./components/AstronautLogoLab";
import { INFOPage } from "./components/info";
import { PrivacyPage } from "./components/PrivacyPage";
import { TerminalOverlay } from "./components/TerminalOverlay";

import { primeAudio, startStatic, stopStatic, playSound } from "./utils/sfx";
import { TypewriterCursorProvider } from "./components/Typewriter";
import { useUI } from "./store/ui";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [systemsTargetSlug, setSystemsTargetSlug] = useState<string | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);

  const primedRef = useRef(false);
  const terminalButtonRef = useRef<HTMLButtonElement | null>(null);

  const { introDone, markIntroDone, effectsEnabled, soundEnabled } = useUI();

  useEffect(() => {
    const handler = async () => {
      if (primedRef.current) return;
      primedRef.current = true;

      try {
        await primeAudio(["TERM", "BTN_MECH", "STATIC", "TYPING", "NOISE"]);
        if (soundEnabled) startStatic();
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
  }, [soundEnabled]);

  useEffect(() => {
    if (!primedRef.current) return;
    if (soundEnabled) startStatic();
    else stopStatic();
  }, [soundEnabled]);

  useEffect(() => {
    if (!effectsEnabled && !introDone) markIntroDone();
  }, [effectsEnabled, introDone, markIntroDone]);

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

  return (
    <CRTScreen>
      <TypewriterCursorProvider>
        <RetroNavigation
          activeTab={activeTab}
          onChange={navigateToTab}
          onOpenTerminal={openTerminal}
          terminalButtonRef={terminalButtonRef}
          terminalOpen={terminalOpen}
        />

        {activeTab === "home" && (
          <>
            <TerminalHeader introAlreadyDone={introDone} onIntroDone={markIntroDone} />

            {introDone && (
              <>
                <AboutSection />
                <SkillsSection />
                <ProjectsSection
                  onOpenSystems={(slug) => {
                    setSystemsTargetSlug(slug);
                    setActiveTab("systems");
                  }}
                />
                <ContactSection />
              </>
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

        <footer className="mt-12 pt-6 border-t border-primary/30 text-center text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <span className="text-primary">{">"}</span>
            <span>© 2025 PRIVATE PROJECT | SYSTEM VERSION 1.0.0</span>
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
          onClose={closeTerminal}
          onNavigate={navigateToTab}
        />
      </TypewriterCursorProvider>
    </CRTScreen>
  );
}
