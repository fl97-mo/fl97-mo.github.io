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
  const [r, g, b] = crtColorToRgbTuple(value);

  return `${r}, ${g}, ${b}`;
}

function crtColorToRgbTuple(value: string): [number, number, number] {
  const hex = normalizeCrtColor(value).slice(1);
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function rgbToHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

function mixRgb(
  source: [number, number, number],
  target: [number, number, number],
  amount: number
): [number, number, number] {
  return source.map((part, index) =>
    Math.round(part + (target[index] - part) * amount)
  ) as [number, number, number];
}

function cursorUrl(svg: string, x: number, y: number, fallback: string) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${x} ${y}, ${fallback}`;
}

export function getCrtCursorTheme(value: string) {
  const accentRgb = crtColorToRgbTuple(value);
  const accent = rgbToHex(accentRgb);
  const edge = rgbToHex(mixRgb(accentRgb, [0, 0, 0], 0.92));
  const shine = rgbToHex(mixRgb(accentRgb, [255, 255, 255], 0.72));

  const defaultCursor = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges"><path fill="${edge}" d="M2 2h4v2h2v2h2v2h2v2h2v2h2v2h2v2h2v4h-6v2h-2v4h-6v-4h-2v-4H8v-2H6v-2H4v-2H2z"/><path fill="${accent}" d="M4 4h2v2h2v2h2v2h2v2h2v2h2v2h2v2h-6v2h-2v4h-2v-4H8v-4H6v-2H4z"/><path fill="${shine}" d="M6 6h2v2H6zm2 2h2v2H8zm2 2h2v2h-2z"/></svg>`;
  const pointerCursor = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges"><path fill="${edge}" d="M10 2h8v10h2v-2h6v2h2v2h2v12h-2v4H10v-2H8v-2H6v-8H4v-6h6z"/><path fill="${accent}" d="M12 4h4v12h2v-4h4v4h2v-2h2v2h2v8h-2v4H12v-2h-2v-2H8v-6H6v-2h6z"/><path fill="${shine}" d="M14 6h2v8h-2zm6 8h2v6h-2zm4 3h2v5h-2z"/></svg>`;
  const textCursor = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges"><path fill="${edge}" d="M10 2h12v4h-4v20h4v4H10v-4h4V6h-4z"/><path fill="${accent}" d="M12 4h8v1h-4v22h4v1h-8v-1h4V5h-4z"/><path fill="${shine}" d="M16 7h1v18h-1z"/></svg>`;

  return {
    default: cursorUrl(defaultCursor, 3, 3, "auto"),
    pointer: cursorUrl(pointerCursor, 14, 4, "pointer"),
    text: cursorUrl(textCursor, 16, 16, "text"),
  };
}

export function applyCrtCursorTheme(root: HTMLElement, value: string) {
  const cursors = getCrtCursorTheme(value);
  root.style.setProperty("--crt-cursor-default", cursors.default);
  root.style.setProperty("--crt-cursor-pointer", cursors.pointer);
  root.style.setProperty("--crt-cursor-text", cursors.text);
}
