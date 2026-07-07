export type CrtColorPreset = {
  id: string;
  label: string;
  hex: string;
};

export const DEFAULT_CRT_COLOR = "#00ff41";

export const CRT_COLOR_PRESETS: CrtColorPreset[] = [
  { id: "green", label: "PHOSPHOR", hex: DEFAULT_CRT_COLOR },
  { id: "amber", label: "AMBER", hex: "#ffb000" },
  { id: "cyan", label: "CYAN", hex: "#00e5ff" },
  { id: "mint", label: "MINT", hex: "#37ffb5" },
  { id: "lime", label: "LIME", hex: "#b7ff00" },
  { id: "blue", label: "BLUE", hex: "#5aa7ff" },
  { id: "violet", label: "VIOLET", hex: "#a970ff" },
  { id: "magenta", label: "MAGENTA", hex: "#ff4dff" },
  { id: "red", label: "RED", hex: "#ff3b30" },
  { id: "white", label: "WHITE", hex: "#f5fff7" },
];

export function normalizeCrtColor(value: string | null | undefined) {
  const raw = value?.trim() ?? "";
  const short = /^#?([0-9a-f]{3})$/i.exec(raw);

  if (short) {
    const [r, g, b] = short[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  const long = /^#?([0-9a-f]{6})$/i.exec(raw);
  if (long) return `#${long[1]}`.toLowerCase();

  return DEFAULT_CRT_COLOR;
}

export function crtColorToRgb(value: string) {
  const hex = normalizeCrtColor(value).slice(1);
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);

  return `${r}, ${g}, ${b}`;
}
