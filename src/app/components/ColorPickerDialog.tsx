import { useRef } from "react";
import { createPortal } from "react-dom";
import { Palette, X } from "lucide-react";

import { useUI } from "../store/ui";
import { CRT_COLOR_PRESETS, DEFAULT_CRT_COLOR } from "../utils/crtAccent";
import { playSoundAsync } from "../utils/sfx";
import { useFocusTrap } from "../utils/useFocusTrap";

export function ColorPickerDialog() {
  const {
    accessibilityEnabled,
    closeColorPicker,
    colorPickerOpen,
    crtColor,
    setCrtColor,
    soundEnabled,
  } = useUI();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useFocusTrap({
    active: colorPickerOpen,
    containerRef: panelRef,
    initialFocusRef: closeButtonRef,
    onEscape: closeColorPicker,
  });

  if (!colorPickerOpen || typeof document === "undefined") return null;

  const selectColor = (hex: string, withSound = true) => {
    if (accessibilityEnabled) return;
    setCrtColor(hex);
    if (withSound && soundEnabled) {
      void playSoundAsync("TERM", 0.045, 1.0, 72, 36).catch(() => {});
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-3 sm:p-6"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) closeColorPicker();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="CRT color picker"
        tabIndex={-1}
        className="w-full max-w-xl overflow-hidden rounded border-2 border-primary/60 bg-background/95 crt-glow-overlay focus:outline-none"
      >
        <div className="flex items-center justify-between gap-3 border-b border-primary/30 bg-card/80 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2 text-primary">
            <Palette className="h-5 w-5 shrink-0" />
            <span className="truncate tracking-widest">COLORPICKER.SYS</span>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeColorPicker}
            className="shrink-0 rounded border border-primary/40 bg-background/60 p-1 text-primary hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Close color picker"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-primary/20 bg-black/25 px-3 py-2">
            <div>
              <p className="text-xs tracking-widest text-muted-foreground">CURRENT SIGNAL</p>
              <p className="text-sm text-primary">{crtColor.toUpperCase()}</p>
            </div>

            <span
              className="h-10 w-20 shrink-0 border-2 border-primary/60"
              style={{ backgroundColor: crtColor }}
              aria-hidden="true"
            />
          </div>

          {accessibilityEnabled ? (
            <div className="border border-destructive/70 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              A11Y MODE LOCKED: high-contrast white stays protected. Disable A11Y first.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {CRT_COLOR_PRESETS.map((preset) => {
                  const selected = crtColor === preset.hex;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => selectColor(preset.hex)}
                      className={`group flex min-h-16 flex-col justify-between border bg-black/20 p-2 text-left transition-all hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                        selected ? "border-primary crt-glow-active" : "border-primary/30"
                      }`}
                      aria-pressed={selected}
                    >
                      <span
                        className="h-6 w-full border border-primary/30"
                        style={{ backgroundColor: preset.hex }}
                        aria-hidden="true"
                      />
                      <span className="mt-2 text-xs tracking-widest text-muted-foreground group-hover:text-primary">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-primary/20 pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex w-full items-center justify-between gap-3 border border-primary/30 bg-black/20 px-3 py-2 text-sm text-muted-foreground sm:w-auto sm:min-w-72">
                    <span className="tracking-widest">CUSTOM HEX</span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-xs text-primary">{crtColor.toUpperCase()}</span>
                      <input
                        type="color"
                        value={crtColor}
                        onChange={(event) => selectColor(event.target.value, false)}
                        className="h-8 w-12 cursor-pointer border border-primary/40 bg-background p-0.5"
                        aria-label="Custom CRT color"
                      />
                    </span>
                  </label>

                  <div className="flex shrink-0 justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => selectColor(DEFAULT_CRT_COLOR)}
                      className="h-11 rounded border border-primary/40 bg-background/60 px-4 text-primary hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      [ RESET ]
                    </button>

                    <button
                      type="button"
                      onClick={closeColorPicker}
                      className="h-11 rounded border border-primary/50 bg-primary/10 px-5 text-primary hover:border-primary hover:bg-primary hover:text-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      [ OK ]
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {accessibilityEnabled && (
            <div className="flex justify-end border-t border-primary/20 pt-4">
              <button
                type="button"
                onClick={closeColorPicker}
                className="h-11 rounded border border-primary/50 bg-primary/10 px-5 text-primary hover:border-primary hover:bg-primary hover:text-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                [ OK ]
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
