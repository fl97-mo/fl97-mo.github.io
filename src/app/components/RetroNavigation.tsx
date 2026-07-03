import type { RefObject } from "react";
import { Home, Code, Music, Layers, SlidersHorizontal, Rocket, Terminal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUI } from "../store/ui";
import { playMechClick, playSound, primeAudio, stopHoverNoise } from "../utils/sfx";

export type TabId =
  | "home"
  | "systems"
  | "coding"
  | "music"
  | "eq"
  | "astronaut"
  | "imprint"
  | "privacy";

function RetroToggle({
  label,
  title,
  value,
  onChange,
}: {
  label: string;
  title?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const accessibleLabel = title ?? label;

  return (
    <button
      type="button"
      aria-label={accessibleLabel}
      aria-pressed={value}
      title={accessibleLabel}
      onClick={() => onChange(!value)}
      className={`
        inline-flex h-11
        items-center justify-between gap-3
        px-3 rounded border
        transition-all duration-150
        bg-[var(--crt-toggle-shell)]
        border-[var(--crt-toggle-border)]
      `}
      style={{
        boxShadow:
          "inset -1px -1px 2px rgba(0,0,0,0.8), inset 1px 1px 2px rgba(255,255,255,0.04)",
      }}
    >
      <span className="text-sm tracking-widest text-muted-foreground whitespace-nowrap">
        {label}
      </span>

      <div className="flex items-center gap-2">
        <span className="relative w-9 h-5 rounded-sm border border-[var(--crt-toggle-track-border)] bg-[var(--crt-toggle-track)] px-0.5">
          <span
            className={`
              absolute top-0.5 left-0.5
              w-4 h-4
              rounded-sm
              transition-transform duration-150
              bg-[#2b2b2b]
              border border-[#444]
              ${value ? "translate-x-[18px]" : "translate-x-0"}
            `}
            style={{
              boxShadow:
                "inset -1px -1px 1px rgba(0,0,0,0.7), inset 1px 1px 1px rgba(255,255,255,0.08)",
            }}
          />
        </span>

        <span
          className={`
            w-2 h-2 rounded-full
            border border-[var(--crt-toggle-border)]
            transition-all duration-150
            ${
              value
                ? "bg-primary"
                : "bg-[var(--crt-toggle-off)]"
            }
          `}
          style={{
            boxShadow: value ? "0 0 6px var(--crt-glow-active)" : undefined,
          }}
        />
      </div>
    </button>
  );
}

export function RetroNavigation({
  activeTab,
  onChange,
  onOpenTerminal,
  terminalButtonRef,
  terminalOpen = false,
}: {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  onOpenTerminal: () => void;
  terminalButtonRef?: RefObject<HTMLButtonElement | null>;
  terminalOpen?: boolean;
}) {
  const {
    soundEnabled,
    setSoundEnabled,
    effectsEnabled,
    setEffectsEnabled,
    accessibilityEnabled,
    setAccessibilityEnabled,
  } = useUI();

  const navItems: { id: TabId; label: string; icon: LucideIcon }[] = [
    { id: "home", label: "HOME", icon: Home },
    { id: "systems", label: "SYSTEMS", icon: Layers },
    { id: "coding", label: "CODING", icon: Code },
    { id: "music", label: "MUSIC", icon: Music },
    { id: "eq", label: "EQ", icon: SlidersHorizontal },
    { id: "astronaut", label: "ASTRO", icon: Rocket },
  ];

  const handleTabClick = (tab: TabId) => {
    stopHoverNoise();

    if (tab !== activeTab && soundEnabled) {
      primeAudio().catch(() => {});
      playMechClick();
    }

    onChange(tab);
  };

  return (
    <div className="mb-8">
      <nav className="border-2 border-primary/40 bg-card/50 p-2 rounded crt-glow-soft">
        <div className="grid gap-2 md:gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-2 grid-cols-[auto_repeat(2,minmax(0,1fr))] sm:grid-cols-[auto_repeat(3,minmax(0,1fr))] xl:grid-cols-[auto_repeat(6,minmax(0,1fr))]">
            <button
              ref={terminalButtonRef}
              type="button"
              aria-label="Open terminal"
              aria-pressed={terminalOpen}
              title="Open terminal"
              onClick={onOpenTerminal}
              className={`
                h-11 w-11
                flex items-center justify-center
                border-2 transition-all duration-100
                ${
                  terminalOpen
                    ? "border-primary bg-primary text-background crt-glow-active crt-inset-active"
                    : "border-primary/50 bg-background/50 text-primary hover:border-primary crt-hover-glow crt-inset-idle"
                }
              `}
            >
              <Terminal className="h-5 w-5 shrink-0" />
            </button>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className={`
                    w-full h-11
                    flex items-center justify-center gap-2
                    px-4
                    border-2 transition-all duration-100
                    ${
                      isActive
                        ? "border-primary bg-primary text-background crt-glow-active crt-inset-active"
                        : "border-primary/50 bg-background/50 text-primary hover:border-primary crt-hover-glow crt-inset-idle"
                    }
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
            <RetroToggle
              label="SOUND"
              value={soundEnabled}
              onChange={(v) => {
                if (soundEnabled) {
                  playSound("BUTTON", 0.95);
                } else if (v) {
                  primeAudio().then(() => playSound("BUTTON", 0.95)).catch(() => {});
                }
                setSoundEnabled(v);
              }}
            />

            <RetroToggle
              label="EFFECTS"
              value={effectsEnabled}
              onChange={(v) => {
                if (soundEnabled) playSound("BUTTON", 0.95);
                setEffectsEnabled(v);
              }}
            />

            <RetroToggle
              label="A11Y"
              title="Accessibility high contrast"
              value={accessibilityEnabled}
              onChange={(v) => {
                if (soundEnabled) playSound("BUTTON", 0.95);
                setAccessibilityEnabled(v);
              }}
            />
          </div>
        </div>
      </nav>
    </div>
  );
}
