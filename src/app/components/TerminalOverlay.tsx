import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Terminal as TerminalIcon } from "lucide-react";

import type { TabId } from "./RetroNavigation";
import { useUI } from "../store/ui";
import { getCrtPalette } from "../utils/crtTheme";
import { playSoundAsync } from "../utils/sfx";

type TerminalOverlayProps = {
  open: boolean;
  activeTab: TabId;
  onClose: () => void;
  onNavigate: (tab: TabId) => void;
};

type TerminalLineKind = "input" | "output" | "error" | "system";

type TerminalLine = {
  id: number;
  text: string;
  kind: TerminalLineKind;
};

type TerminalResult = {
  output?: string[];
  clear?: boolean;
  kind?: TerminalLineKind;
};

type TerminalCommandContext = {
  cwd: string;
  setCwd: (cwd: string) => void;
  navigate: (tab: TabId) => void;
  triggerMower: () => void;
  triggerMatrix: () => void;
  activeTab: TabId;
  soundEnabled: boolean;
  effectsEnabled: boolean;
  accessibilityEnabled: boolean;
  eqQueueCount: number;
  eqActiveLabel: string;
  eqRepeat: string;
  motionDisabled: boolean;
};

type TerminalCommandDefinition = {
  name: string;
  usage: string;
  description: string;
  aliases?: string[];
  run: (args: string[], ctx: TerminalCommandContext, raw: string) => TerminalResult;
};

const ROOT_CWD = "/home/fl97-mo";
const MAX_INPUT_LENGTH = 120;
const MAX_HISTORY_LINES = 100;
const MOWER_DURATION_MS = 6450;
const MOWER_ROWS = 20;
const MATRIX_DURATION_MS = 4600;
const REBOOT_STEP_MS = 560;

const REBOOT_SEQUENCE = [
  "rebooting portfolio kernel...",
  "stopping visual subsystems...",
  "clearing virtual queues...",
  "remounting /home/fl97-mo",
  "resetting intro state...",
  "starting HOME target...",
  "READY | type help",
];

const ROOT_ENTRIES = [
  "ABOUT.TXT",
  "STACK.DAT",
  "PROJECTS.DIR/",
  "SYSTEMS.DIR/",
  "CODING.DIR/",
  "MUSIC.DIR/",
  "EQUALIZER.DIR/",
  "ASTRO.EXE*",
  "CONTACT.SYS",
];

const VIRTUAL_DIRECTORIES: Record<string, string[]> = {
  [ROOT_CWD]: ROOT_ENTRIES,
  [`${ROOT_CWD}/PROJECTS.DIR`]: ["ETL_SETUP.EXE", "ASTRO_WALKER.EQ", "ASTRONAUT_LOGO_LAB.EXE"],
  [`${ROOT_CWD}/SYSTEMS.DIR`]: ["manual-to-framework.sys", "astro-walker-eq.sys", "astronaut-logo-lab.sys"],
  [`${ROOT_CWD}/CODING.DIR`]: ["automation.log", "scripts.bin", "tooling.notes"],
  [`${ROOT_CWD}/MUSIC.DIR`]: ["NOMKEE.catalog", "license.txt", "downloads/"],
  [`${ROOT_CWD}/EQUALIZER.DIR`]: ["upload.slot", "analyser.node", "canvas.render"],
  [`${ROOT_CWD}/ASTRO.EXE`]: ["canvas.lab", "preset.mem", "export.png"],
};

const VIRTUAL_FILES: Record<string, string> = {
  "ABOUT.TXT":
    "I experiment with small software systems, automation, and electronic music.\nLOCATION: GERMANY\nMODE: READ-ONLY PORTFOLIO",
  "STACK.DAT":
    "CORE: Python, Java, C++, JavaScript\nWEB: React, TypeScript, HTML, CSS\nSYSTEMS: Linux, Git, Bash\nAUDIO/VISUAL: Web Audio, Canvas",
  "CONTACT.SYS":
    "GITHUB: https://github.com/fl97-mo\nLINKEDIN: https://linkedin.com/in/fl97-mo\nSTATUS: ONLINE | READ-ONLY MODE",
};

const NAV_TARGETS: Record<string, { tab: TabId; cwd: string; label: string }> = {
  "~": { tab: "home", cwd: ROOT_CWD, label: "HOME" },
  ".": { tab: "home", cwd: ROOT_CWD, label: "HOME" },
  home: { tab: "home", cwd: ROOT_CWD, label: "HOME" },
  "/home/fl97-mo": { tab: "home", cwd: ROOT_CWD, label: "HOME" },
  projects: { tab: "home", cwd: `${ROOT_CWD}/PROJECTS.DIR`, label: "PROJECTS.DIR" },
  "projects.dir": { tab: "home", cwd: `${ROOT_CWD}/PROJECTS.DIR`, label: "PROJECTS.DIR" },
  systems: { tab: "systems", cwd: `${ROOT_CWD}/SYSTEMS.DIR`, label: "SYSTEMS.DIR" },
  "systems.dir": { tab: "systems", cwd: `${ROOT_CWD}/SYSTEMS.DIR`, label: "SYSTEMS.DIR" },
  coding: { tab: "coding", cwd: `${ROOT_CWD}/CODING.DIR`, label: "CODING.DIR" },
  "coding.dir": { tab: "coding", cwd: `${ROOT_CWD}/CODING.DIR`, label: "CODING.DIR" },
  music: { tab: "music", cwd: `${ROOT_CWD}/MUSIC.DIR`, label: "MUSIC.DIR" },
  "music.dir": { tab: "music", cwd: `${ROOT_CWD}/MUSIC.DIR`, label: "MUSIC.DIR" },
  eq: { tab: "eq", cwd: `${ROOT_CWD}/EQUALIZER.DIR`, label: "EQUALIZER.DIR" },
  equalizer: { tab: "eq", cwd: `${ROOT_CWD}/EQUALIZER.DIR`, label: "EQUALIZER.DIR" },
  "equalizer.dir": { tab: "eq", cwd: `${ROOT_CWD}/EQUALIZER.DIR`, label: "EQUALIZER.DIR" },
  astro: { tab: "astronaut", cwd: `${ROOT_CWD}/ASTRO.EXE`, label: "ASTRO.EXE" },
  astronaut: { tab: "astronaut", cwd: `${ROOT_CWD}/ASTRO.EXE`, label: "ASTRO.EXE" },
  "astro.exe": { tab: "astronaut", cwd: `${ROOT_CWD}/ASTRO.EXE`, label: "ASTRO.EXE" },
};

const NOMKEE_TRACKS = [
  "NOMKEE - ENTER THE UFO",
  "NOMKEE - I KNOW YOU BETTER",
  "NOMKEE - DONT WANT TO LOOK AWAY",
  "NOMKEE - RAYGUNS EVERYWHERE",
];

function normalizeTarget(target: string) {
  return target.trim().replace(/\/+$/, "").toLowerCase();
}

function normalizeFileName(file: string) {
  return file.trim().replace(/^\.?\//, "").replace(/\/+$/, "").toUpperCase();
}

function sanitizeInput(value: string) {
  return value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .slice(0, MAX_INPUT_LENGTH)
    .trim();
}

function tokenize(input: string) {
  return sanitizeInput(input).split(/\s+/).filter(Boolean);
}

function cdToTarget(args: string[], ctx: TerminalCommandContext): TerminalResult {
  const targetRaw = args[0] ?? "home";
  const targetKey = normalizeTarget(targetRaw);

  if (targetKey === "..") {
    ctx.setCwd(ROOT_CWD);
    ctx.navigate("home");
    return { output: [`cwd: ${ROOT_CWD}`] };
  }

  const target = NAV_TARGETS[targetKey];
  if (!target) return { output: [`cd: no such directory: ${targetRaw}`], kind: "error" };

  ctx.setCwd(target.cwd);
  ctx.navigate(target.tab);
  return { output: [`cwd: ${target.cwd}`, `entered ${target.label}`] };
}

function yesNo(value: boolean) {
  return value ? "ON" : "OFF";
}

function tabLabel(tab: TabId) {
  if (tab === "eq") return "EQUALIZER.DIR";
  if (tab === "astronaut") return "ASTRO.EXE";
  return `${tab.toUpperCase()}.DIR`;
}

function visitorSnapshot() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      language: "unknown",
      viewport: "unknown",
      timezone: "unknown",
      online: "unknown",
      platform: "unknown",
    };
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
  const platform =
    "userAgentData" in navigator
      ? (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? "unknown"
      : navigator.platform || "unknown";

  return {
    language: navigator.language || "unknown",
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    timezone,
    online: navigator.onLine ? "online" : "offline",
    platform,
  };
}

const COMMAND_DEFINITIONS: TerminalCommandDefinition[] = [
  {
    name: "help",
    usage: "help",
    description: "show available commands",
    run: () => ({
      output: [
        COMMAND_DEFINITIONS.map((cmd) => `${cmd.usage.padEnd(18)} ${cmd.description}`).join("\n"),
      ],
    }),
  },
  {
    name: "pwd",
    usage: "pwd",
    description: "print current virtual directory",
    run: (_args, ctx) => ({ output: [ctx.cwd] }),
  },
  {
    name: "status",
    usage: "status",
    description: "show current portfolio and session state",
    run: (_args, ctx) => ({
      output: [
        [
          "> STATUS",
          `-- TAB: ${tabLabel(ctx.activeTab)}`,
          `-- CWD: ${ctx.cwd}`,
          `-- SOUND: ${yesNo(ctx.soundEnabled)}`,
          `-- EFFECTS: ${yesNo(ctx.effectsEnabled)}`,
          `-- A11Y: ${yesNo(ctx.accessibilityEnabled)}`,
          `-- MOTION: ${ctx.motionDisabled ? "REDUCED" : "ENABLED"}`,
          `-- EQ_QUEUE: ${ctx.eqQueueCount}`,
          `-- EQ_REPEAT: ${ctx.eqRepeat}`,
        ].join("\n"),
      ],
    }),
  },
  {
    name: "whoami",
    usage: "whoami",
    description: "describe the current visitor session",
    run: () => {
      const visitor = visitorSnapshot();

      return {
        output: [
          [
            "visitor@local-browser",
            "---------------------",
            "role: guest / read-only visitor",
            "account: none",
            "tracking profile: none",
            `language: ${visitor.language}`,
            `platform: ${visitor.platform}`,
            `viewport: ${visitor.viewport}`,
            `timezone: ${visitor.timezone}`,
            `network: ${visitor.online}`,
          ].join("\n"),
        ],
      };
    },
  },
  {
    name: "now",
    usage: "now",
    description: "show what is active right now",
    run: (_args, ctx) => {
      const visitor = visitorSnapshot();

      return {
        output: [
          [
            "> NOW",
            `-- LOCAL_TIME: ${new Date().toLocaleString()}`,
            `-- VIEW: ${tabLabel(ctx.activeTab)}`,
            `-- CWD: ${ctx.cwd}`,
            `-- ACTIVE_AUDIO: ${ctx.eqActiveLabel}`,
            `-- QUEUE: ${ctx.eqQueueCount} item${ctx.eqQueueCount === 1 ? "" : "s"}`,
            `-- DISPLAY: ${visitor.viewport}`,
          ].join("\n"),
        ],
      };
    },
  },
  {
    name: "ls",
    usage: "ls",
    description: "list files in current virtual directory",
    run: (_args, ctx) => ({ output: [VIRTUAL_DIRECTORIES[ctx.cwd]?.join("  ") ?? ROOT_ENTRIES.join("  ")] }),
  },
  {
    name: "cd",
    usage: "cd <target>",
    description: "change virtual directory and navigate the site",
    run: cdToTarget,
  },
  {
    name: "cat",
    usage: "cat <file>",
    description: "print known virtual files",
    run: (args) => {
      const fileRaw = args[0] ?? "";
      const file = normalizeFileName(fileRaw);
      if (!fileRaw) return { output: ["cat: missing file operand"], kind: "error" };
      if (!VIRTUAL_FILES[file]) return { output: [`cat: ${fileRaw}: no such file`], kind: "error" };
      return { output: [VIRTUAL_FILES[file]] };
    },
  },
  {
    name: "clear",
    usage: "clear",
    description: "clear terminal output",
    run: () => ({ clear: true }),
  },
  {
    name: "reboot",
    usage: "reboot",
    description: "simulate a portfolio reboot",
    run: () => ({ output: ["reboot sequence unavailable"] }),
  },
  {
    name: "neofetch",
    usage: "neofetch",
    description: "show mini profile",
    aliases: ["neoftch", "neo"],
    run: () => ({
      output: [
        [
          "fl97-mo@portfolio",
          "-----------------",
          "user: fl97-mo",
          "location: Germany",
          "stack: React, TypeScript, Linux, Git, Bash, Web Audio, Canvas",
          "project version: SYSTEM VERSION 1.0.0",
          "theme: CRT terminal",
        ].join("\n"),
      ],
    }),
  },
  {
    name: "nomkee",
    usage: "nomkee",
    description: "show music alias and tracks",
    run: () => ({ output: [`alias: NOMKEE\n${NOMKEE_TRACKS.map((track) => `-- ${track}`).join("\n")}`] }),
  },
  {
    name: "mission",
    usage: "mission",
    description: "print current mission",
    run: () => ({ output: ["current mission: build small systems, music, automation"] }),
  },
  {
    name: "astro",
    usage: "astro",
    description: "navigate to the Astronaut Lab",
    run: (_args, ctx) => cdToTarget(["astro"], ctx),
  },
  {
    name: "sudo",
    usage: "sudo",
    description: "try elevated mode",
    run: () => ({ output: ["permission denied: portfolio is read-only"], kind: "error" }),
  },
  {
    name: "hack",
    usage: "hack",
    description: "attempt something suspicious",
    run: () => ({ output: ["nice try."] }),
  },
  {
    name: "matrix",
    usage: "matrix",
    description: "run a short falling-code terminal effect",
    run: (_args, ctx) => {
      if (ctx.motionDisabled) return { output: ["matrix.sys skipped: motion disabled"] };
      ctx.triggerMatrix();
      return { output: ["matrix.sys streaming..."] };
    },
  },
  {
    name: "flux",
    usage: "flux",
    description: "check capacitor status",
    run: () => ({ output: ["FLUX CAPACITOR ONLINE | BUILD 0012231"] }),
  },
  {
    name: "contact",
    usage: "contact",
    description: "show contact links",
    run: () => ({
      output: ["GITHUB: https://github.com/fl97-mo\nLINKEDIN: https://linkedin.com/in/fl97-mo"],
    }),
  },
  {
    name: "lawnmower",
    usage: "lawnmower",
    description: "run a tiny temporary mowing animation",
    run: (_args, ctx) => {
      if (ctx.motionDisabled) return { output: ["lawnmower.exe skipped: motion disabled"] };
      ctx.triggerMower();
      return { output: ["lawnmower.exe started"] };
    },
  },
];

function findCommand(name: string) {
  return COMMAND_DEFINITIONS.find((cmd) => cmd.name === name || cmd.aliases?.includes(name));
}

function executeTerminalCommand(raw: string, ctx: TerminalCommandContext): TerminalResult {
  const tokens = tokenize(raw);
  const rawCommand = tokens[0] ?? "";
  const command = rawCommand.toLowerCase();

  if (!command) return { output: [] };

  const definition = findCommand(command);
  if (!definition) return { output: [`command not found: ${rawCommand}`], kind: "error" };

  return definition.run(tokens.slice(1), ctx, raw);
}

function drawPixelMower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: -1 | 1,
  scale: number
) {
  const crt = getCrtPalette();

  ctx.save();
  ctx.translate(x, y);
  if (direction < 0) ctx.scale(-1, 1);

  ctx.fillStyle = crt.card;
  ctx.strokeStyle = crt.rgba(0.88);
  ctx.lineWidth = Math.max(1, scale);

  ctx.fillRect(-18 * scale, -8 * scale, 36 * scale, 14 * scale);
  ctx.strokeRect(-18 * scale, -8 * scale, 36 * scale, 14 * scale);

  ctx.fillStyle = crt.rgba(0.34);
  ctx.fillRect(-8 * scale, -14 * scale, 18 * scale, 6 * scale);
  ctx.strokeRect(-8 * scale, -14 * scale, 18 * scale, 6 * scale);

  ctx.strokeStyle = crt.rgba(0.7);
  ctx.beginPath();
  ctx.moveTo(12 * scale, -12 * scale);
  ctx.lineTo(28 * scale, -24 * scale);
  ctx.stroke();

  ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
  ctx.strokeStyle = crt.rgba(0.82);
  for (const wheelX of [-12, 12]) {
    ctx.beginPath();
    ctx.arc(wheelX * scale, 8 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawMowedRows(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progressRows: number
) {
  const rowH = height / MOWER_ROWS;
  const activeRow = Math.min(MOWER_ROWS - 1, Math.floor(progressRows));
  const activeProgress = Math.min(1, Math.max(0, progressRows - activeRow));

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#000000";

  for (let row = 0; row < activeRow; row++) {
    ctx.fillRect(0, row * rowH, width, Math.ceil(rowH));
  }

  if (progressRows < MOWER_ROWS) {
    const y = activeRow * rowH;
    const w = width * activeProgress;

    if (activeRow % 2 === 0) {
      ctx.fillRect(width - w, y, w, Math.ceil(rowH));
    } else {
      ctx.fillRect(0, y, w, Math.ceil(rowH));
    }
  } else {
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0)";
  for (let row = 0; row <= MOWER_ROWS; row++) {
    const y = Math.round(row * rowH);
    ctx.fillRect(0, y, width, 1);
  }

  const mowerRow = Math.min(MOWER_ROWS - 1, activeRow);
  const direction: -1 | 1 = mowerRow % 2 === 0 ? -1 : 1;
  const travel = width * activeProgress;
  const mowerX = direction < 0 ? width - travel : travel;
  const mowerY = mowerRow * rowH + rowH * 0.5;
  const mowerScale = Math.max(1, Math.min(2.2, rowH / 22));

  drawPixelMower(ctx, mowerX, mowerY, direction, mowerScale);
}

type MatrixColumn = {
  x: number;
  y: number;
  speed: number;
  tail: number;
  phase: number;
};

function makeMatrixColumns(width: number, height: number, colW: number) {
  const count = Math.max(8, Math.ceil(width / colW));

  return Array.from({ length: count }, (_, index) => ({
    x: index * colW + colW * 0.2,
    y: -Math.random() * height,
    speed: 92 + Math.random() * 165,
    tail: 8 + Math.floor(Math.random() * 16),
    phase: Math.floor(Math.random() * 128),
  }));
}

function drawMatrixRain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  columns: MatrixColumn[],
  dt: number,
  elapsedMs: number
) {
  const crt = getCrtPalette();
  const rowH = 16;
  const fadeOut = 1 - Math.max(0, elapsedMs - MATRIX_DURATION_MS + 650) / 650;
  const fade = Math.max(0, Math.min(1, fadeOut));

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 0, width, height);

  ctx.font = `14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
  ctx.textBaseline = "top";

  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    col.y += col.speed * dt;

    if (col.y - col.tail * rowH > height) {
      col.y = -Math.random() * height * 0.45;
      col.speed = 92 + Math.random() * 165;
      col.tail = 8 + Math.floor(Math.random() * 16);
      col.phase = Math.floor(Math.random() * 128);
    }

    const headRow = Math.floor(col.y / rowH);

    for (let j = 0; j < col.tail; j++) {
      const y = col.y - j * rowH;
      if (y < -rowH || y > height + rowH) continue;

      const tailT = 1 - j / Math.max(1, col.tail - 1);
      const pulse = 0.74 + 0.26 * Math.sin((elapsedMs * 0.012 + i * 1.7 + j * 0.9) * 0.9);
      const alpha = (j === 0 ? 0.98 : 0.14 + tailT * 0.58) * pulse * fade;
      const bit = (headRow - j + col.phase + i * 7) % 2 === 0 ? "0" : "1";

      ctx.fillStyle = crt.rgba(alpha);
      ctx.fillText(bit, col.x, y);
    }
  }

  ctx.fillStyle = crt.rgba(0.08 * fade);
  for (let y = 0; y < height; y += 5) {
    ctx.fillRect(0, y, width, 1);
  }
}

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();

    if (query.addEventListener) {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }

    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  return reducedMotion;
}

export function TerminalOverlay({ open, activeTab, onClose, onNavigate }: TerminalOverlayProps) {
  const {
    soundEnabled,
    effectsEnabled,
    accessibilityEnabled,
    resetIntroForSession,
    eqQueue,
    eqActiveId,
    eqRepeat,
    setEqQueue,
    setEqActiveId,
  } = useUI();

  const prefersReducedMotion = usePrefersReducedMotion();

  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const mowerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mowerTimerRef = useRef<number | null>(null);
  const mowerRafRef = useRef<number | null>(null);
  const matrixTimerRef = useRef<number | null>(null);
  const matrixRafRef = useRef<number | null>(null);
  const rebootTimersRef = useRef<number[]>([]);
  const pointerDownInsideRef = useRef(false);
  const lineIdRef = useRef(3);

  const [cwd, setCwd] = useState(ROOT_CWD);
  const [input, setInput] = useState("");
  const [rebooting, setRebooting] = useState(false);
  const [mowerActive, setMowerActive] = useState(false);
  const [matrixActive, setMatrixActive] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 1, text: "FL97-MO VIRTUAL TERMINAL", kind: "system" },
    { id: 2, text: "type help", kind: "output" },
  ]);

  const motionDisabled = !effectsEnabled || accessibilityEnabled || prefersReducedMotion;
  const eqActiveLabel = useMemo(() => {
    const activeTrack = eqQueue.find((track) => track.id === eqActiveId);
    return activeTrack?.title ?? "none";
  }, [eqActiveId, eqQueue]);

  const makeLines = (texts: string[], kind: TerminalLineKind) => {
    const next: TerminalLine[] = [];

    for (const text of texts) {
      for (const row of text.split("\n")) {
        next.push({ id: lineIdRef.current++, text: row, kind });
      }
    }

    return next;
  };

  const appendLines = (next: TerminalLine[]) => {
    setLines((prev) => [...prev, ...next].slice(-MAX_HISTORY_LINES));
  };

  const triggerMower = () => {
    if (mowerTimerRef.current !== null) window.clearTimeout(mowerTimerRef.current);
    if (mowerRafRef.current !== null) window.cancelAnimationFrame(mowerRafRef.current);

    setMowerActive(false);
    window.requestAnimationFrame(() => {
      setMowerActive(true);
    });
  };

  const triggerMatrix = () => {
    if (matrixTimerRef.current !== null) window.clearTimeout(matrixTimerRef.current);
    if (matrixRafRef.current !== null) window.cancelAnimationFrame(matrixRafRef.current);

    setMatrixActive(false);
    window.requestAnimationFrame(() => {
      setMatrixActive(true);
    });
  };

  const clearRebootTimers = () => {
    for (const timer of rebootTimersRef.current) window.clearTimeout(timer);
    rebootTimersRef.current = [];
  };

  const runRebootSequence = () => {
    clearRebootTimers();
    setRebooting(true);
    setInput("");
    setLines([]);

    REBOOT_SEQUENCE.forEach((text, index) => {
      const timer = window.setTimeout(() => {
        appendLines(makeLines([text], index === REBOOT_SEQUENCE.length - 1 ? "system" : "output"));

        if (index === 2) {
          setEqQueue([]);
          setEqActiveId(null);
        }

        if (index === 3) {
          setCwd(ROOT_CWD);
        }

        if (index === 4) {
          resetIntroForSession();
        }

        if (index === 5) {
          onNavigate("home");
        }

        if (index === REBOOT_SEQUENCE.length - 1) {
          setRebooting(false);
          window.setTimeout(() => inputRef.current?.focus(), 0);
        }
      }, index * REBOOT_STEP_MS);

      rebootTimersRef.current.push(timer);
    });
  };

  const commandContext = useMemo<TerminalCommandContext>(
    () => ({
      cwd,
      setCwd,
      navigate: onNavigate,
      triggerMower,
      triggerMatrix,
      activeTab,
      soundEnabled,
      effectsEnabled,
      accessibilityEnabled,
      eqQueueCount: eqQueue.length,
      eqActiveLabel,
      eqRepeat,
      motionDisabled,
    }),
    [
      accessibilityEnabled,
      activeTab,
      cwd,
      effectsEnabled,
      eqActiveLabel,
      eqQueue.length,
      eqRepeat,
      motionDisabled,
      onNavigate,
      soundEnabled,
    ]
  );

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    return () => {
      if (mowerTimerRef.current !== null) window.clearTimeout(mowerTimerRef.current);
      if (mowerRafRef.current !== null) window.cancelAnimationFrame(mowerRafRef.current);
      if (matrixTimerRef.current !== null) window.clearTimeout(matrixTimerRef.current);
      if (matrixRafRef.current !== null) window.cancelAnimationFrame(matrixRafRef.current);
      clearRebootTimers();
    };
  }, []);

  useEffect(() => {
    if (!mowerActive) return;

    const canvas = mowerCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let start = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      canvas.width = Math.ceil(window.innerWidth * dpr);
      canvas.height = Math.ceil(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tick = (now: number) => {
      if (!start) {
        start = now;
        resize();
      }

      const elapsed = now - start;
      const t = Math.min(1, elapsed / MOWER_DURATION_MS);
      drawMowedRows(ctx, window.innerWidth, window.innerHeight, t * MOWER_ROWS);

      if (t < 1) {
        mowerRafRef.current = window.requestAnimationFrame(tick);
      } else {
        mowerTimerRef.current = window.setTimeout(() => {
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
          setMowerActive(false);
          mowerTimerRef.current = null;
          mowerRafRef.current = null;
        }, 240);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    mowerRafRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      if (mowerRafRef.current !== null) window.cancelAnimationFrame(mowerRafRef.current);
    };
  }, [mowerActive]);

  useEffect(() => {
    if (!matrixActive) return;

    const canvas = matrixCanvasRef.current;
    const host = outputRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    let start = 0;
    let prev = 0;
    let columns: MatrixColumn[] = [];
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      canvas.width = Math.ceil(width * dpr);
      canvas.height = Math.ceil(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      columns = makeMatrixColumns(width, height, 14);
    };

    const stop = () => {
      const rect = host.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      setMatrixActive(false);
      matrixTimerRef.current = null;
      matrixRafRef.current = null;
    };

    const tick = (now: number) => {
      if (!start) {
        start = now;
        prev = now;
        resize();
      }

      const elapsed = now - start;
      const dt = Math.min(0.05, Math.max(0.001, (now - prev) / 1000));
      prev = now;

      const rect = host.getBoundingClientRect();
      drawMatrixRain(ctx, rect.width, rect.height, columns, dt, elapsed);

      if (elapsed < MATRIX_DURATION_MS) {
        matrixRafRef.current = window.requestAnimationFrame(tick);
      } else {
        matrixTimerRef.current = window.setTimeout(stop, 120);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    matrixRafRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      if (matrixRafRef.current !== null) window.cancelAnimationFrame(matrixRafRef.current);
      if (matrixTimerRef.current !== null) window.clearTimeout(matrixTimerRef.current);
    };
  }, [matrixActive]);

  useEffect(() => {
    if (!motionDisabled) return;
    if (mowerRafRef.current !== null) window.cancelAnimationFrame(mowerRafRef.current);
    if (mowerTimerRef.current !== null) window.clearTimeout(mowerTimerRef.current);
    if (matrixRafRef.current !== null) window.cancelAnimationFrame(matrixRafRef.current);
    if (matrixTimerRef.current !== null) window.clearTimeout(matrixTimerRef.current);
    mowerRafRef.current = null;
    mowerTimerRef.current = null;
    matrixRafRef.current = null;
    matrixTimerRef.current = null;
    setMowerActive(false);
    setMatrixActive(false);
  }, [motionDisabled]);

  const handlePanelBlur = () => {
    window.setTimeout(() => {
      if (pointerDownInsideRef.current) return;

      const panel = panelRef.current;
      const active = document.activeElement;
      if (panel && active && !panel.contains(active)) onClose();
    }, 0);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const command = sanitizeInput(input);
    setInput("");
    if (!command || rebooting) return;

    if (soundEnabled) void playSoundAsync("TERM", 0.08, 1.05).catch(() => {});

    if (command.toLowerCase() === "reboot") {
      runRebootSequence();
      return;
    }

    const result = executeTerminalCommand(command, commandContext);

    if (result.clear) {
      setLines([]);
      return;
    }

    const output = result.output ?? [];
    const outputLines = makeLines(output, result.kind ?? "output");

    appendLines([
      ...makeLines([`${cwd} $ ${command}`], "input"),
      ...outputLines,
    ]);
  };

  const lineClass = (kind: TerminalLineKind) => {
    if (kind === "input") return "text-primary";
    if (kind === "error") return "text-destructive";
    if (kind === "system") return "text-primary/90";
    return "text-muted-foreground";
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-black/45 p-3 sm:p-6 md:p-8"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {mowerActive && (
        <canvas ref={mowerCanvasRef} className="pointer-events-none fixed inset-0 z-[95]" aria-hidden="true" />
      )}

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Fake portfolio terminal"
        tabIndex={-1}
        onBlur={handlePanelBlur}
        onPointerDownCapture={() => {
          pointerDownInsideRef.current = true;
        }}
        onPointerUpCapture={() => {
          window.setTimeout(() => {
            pointerDownInsideRef.current = false;
          }, 0);
        }}
        onPointerCancelCapture={() => {
          pointerDownInsideRef.current = false;
        }}
        className="mt-3 flex h-[min(78vh,760px)] w-full max-w-5xl flex-col overflow-hidden rounded border-2 border-primary/60 bg-background/90 crt-glow-overlay sm:mt-6"
      >
        <div className="flex items-center justify-between gap-3 border-b border-primary/30 bg-card/80 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2 text-primary">
            <TerminalIcon className="h-5 w-5 shrink-0" />
            <span className="truncate tracking-widest">fl97-mo@portfolio:{cwd}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded border border-primary/40 bg-background/60 px-3 py-1 text-primary hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Close terminal"
          >
            [X]
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          {matrixActive && (
            <canvas
              ref={matrixCanvasRef}
              className="pointer-events-none absolute inset-0 z-10 opacity-95"
              aria-hidden="true"
            />
          )}

          <div
            ref={outputRef}
            className="relative z-0 h-full cursor-text overflow-y-auto bg-black/25 px-4 py-3"
            onPointerDown={(event) => {
              if (event.target === outputRef.current) {
                event.preventDefault();
                inputRef.current?.focus();
              }
            }}
            onClick={() => inputRef.current?.focus()}
          >
            <div role="log" aria-live="polite" aria-relevant="additions text">
              {lines.map((line) => (
                <pre
                  key={line.id}
                  className={`whitespace-pre-wrap break-words text-sm leading-6 ${lineClass(line.kind)}`}
                >
                  {line.text}
                </pre>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-0 flex min-w-0 items-baseline gap-2">
              <label htmlFor="terminal-input" className="sr-only">
                Terminal command
              </label>
              <span className="shrink-0 whitespace-pre text-sm leading-6 text-primary">{cwd} $</span>
              <input
                ref={inputRef}
                id="terminal-input"
                value={input}
                maxLength={MAX_INPUT_LENGTH}
                disabled={rebooting}
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => setInput(event.target.value.slice(0, MAX_INPUT_LENGTH))}
                className="min-w-0 flex-1 border-none bg-transparent p-0 text-sm leading-6 text-primary caret-primary outline-none placeholder:text-muted-foreground disabled:opacity-60"
                placeholder=""
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
