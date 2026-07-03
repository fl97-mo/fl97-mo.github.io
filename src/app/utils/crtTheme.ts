function clampAlpha(alpha: number) {
  return Math.min(1, Math.max(0, alpha));
}

function rootStyle() {
  if (typeof document === "undefined") return null;
  return window.getComputedStyle(document.documentElement);
}

function cssVar(name: string, fallback: string) {
  return rootStyle()?.getPropertyValue(name).trim() || fallback;
}

export function getCrtPalette() {
  const rgb = cssVar("--crt-rgb", "0, 255, 65");
  const compactRgb = rgb.replace(/\s*,\s*/g, ",");

  return {
    rgb: compactRgb,
    background: cssVar("--background", "#000000"),
    card: cssVar("--card", "#050805"),
    rgba(alpha: number) {
      return `rgba(${compactRgb},${clampAlpha(alpha).toFixed(3)})`;
    },
  };
}
