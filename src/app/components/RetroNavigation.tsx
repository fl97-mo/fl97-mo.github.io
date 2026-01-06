import { Home, Code, Music, Layers, SlidersHorizontal, Rocket } from "lucide-react";
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
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => onChange(!value)}
      className={`
        inline-flex h-11
        items-center gap-3
        px-3 rounded border
        transition-all duration-150
        bg-[#0b120b]
        border-[#1f3a1f]
      `}
      style={{
        boxShadow:
          "inset -1px -1px 2px rgba(0,0,0,0.8), inset 1px 1px 2px rgba(255,255,255,0.04)",
      }}
    >
      <span className="text-[11px] tracking-widest text-muted-foreground whitespace-nowrap">
        {label}
      </span>

      <div className="flex items-center gap-2">
        <span className="relative w-9 h-5 rounded-sm border border-[#2a3d2a] bg-[#050805] px-0.5">
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
            border border-[#1f3a1f]
            transition-all duration-150
            ${
              value
                ? "bg-primary shadow-[0_0_6px_rgba(0,255,65,0.9)]"
                : "bg-[#0e1a0e]"
            }
          `}
        />
      </div>
    </button>
  );
}

export function RetroNavigation({
  activeTab,
  onChange,
}: {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}) {
  const { soundEnabled, setSoundEnabled, effectsEnabled, setEffectsEnabled } = useUI();

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
      <nav className="border-2 border-primary/40 bg-card/50 p-2 rounded shadow-[0_0_10px_rgba(0,255,65,0.3)]">
        <div className="grid gap-2 md:gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
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
                        ? "border-primary bg-primary text-background shadow-[0_0_15px_rgba(0,255,65,0.6)]"
                        : "border-primary/50 bg-background/50 text-primary hover:border-primary hover:shadow-[0_0_10px_rgba(0,255,65,0.4)]"
                    }
                  `}
                  style={{
                    boxShadow: isActive
                      ? "inset -2px -2px 0px rgba(0,0,0,0.5), inset 2px 2px 0px rgba(0,255,65,0.3)"
                      : "inset -2px -2px 0px rgba(0,255,65,0.3), inset 2px 2px 0px rgba(0,0,0,0.5)",
                  }}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
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
          </div>
        </div>
      </nav>
    </div>
  );
}
