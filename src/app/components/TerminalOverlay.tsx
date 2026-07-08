import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Terminal as TerminalIcon } from "lucide-react";

import type { TabId } from "./RetroNavigation";
import { useUI } from "../store/ui";
import { getCrtPalette } from "../utils/crtTheme";
import { playSoundAsync, primeAudio, startHoverNoise, stopHoverNoise } from "../utils/sfx";
import { useFocusTrap } from "../utils/useFocusTrap";
import { HOME_BOOT_TRANSCRIPT_LINES } from "./homeBootSequence";
import { drawEqAstronaut } from "./lab/drawEqAstronaut";
import { DEFAULT_RIG, type RenderParams } from "./lab/types";

type TerminalOverlayProps = {
  open: boolean;
  activeTab: TabId;
  onClose: () => void;
  onNavigate: (tab: TabId) => void;
  variant?: "overlay" | "inline";
  inlineHeaderTitle?: ReactNode;
  inlineBodyVisible?: boolean;
};

type TerminalLineKind = "input" | "output" | "error" | "system";

type TerminalLine = {
  id: number;
  text: string;
  kind: TerminalLineKind;
  helpItems?: TerminalHelpItem[];
};

type TerminalSeedLine = {
  text: string;
  kind: TerminalLineKind;
};

type TerminalResult = {
  output?: string[];
  helpItems?: TerminalHelpItem[];
  clear?: boolean;
  kind?: TerminalLineKind;
};

type TerminalHelpItem = {
  usage: string;
  description: string;
};

type TerminalCommandContext = {
  cwd: string;
  setCwd: (cwd: string) => void;
  navigate: (tab: TabId) => void;
  triggerMower: () => void;
  triggerMatrix: () => void;
  triggerAstroTrance: () => void;
  openColorPicker: () => void;
  activeTab: TabId;
  soundEnabled: boolean;
  effectsEnabled: boolean;
  accessibilityEnabled: boolean;
  crtColor: string;
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
const ASTROTRANCE_DURATION_MS = 14000;
const ASTROTRANCE_BPM = 128;
const ASTROTRANCE_BEAT_MS = 60000 / ASTROTRANCE_BPM;
const ASTROTRANCE_AUDIO_SRC = `${import.meta.env.BASE_URL}astrotrance.mp3`;
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

const DEFAULT_TERMINAL_SEED: TerminalSeedLine[] = [
  { text: "FL97-MO VIRTUAL TERMINAL", kind: "system" },
  { text: "type help", kind: "output" },
];

function initialTerminalSeed(includeHomeBoot: boolean): TerminalSeedLine[] {
  if (!includeHomeBoot) return DEFAULT_TERMINAL_SEED;

  return [
    { text: "FL97-MO VIRTUAL TERMINAL", kind: "system" },
    ...HOME_BOOT_TRANSCRIPT_LINES,
    { text: "type help | clear to wipe this session", kind: "output" },
  ];
}

function buildTerminalLines(seed: TerminalSeedLine[]) {
  let id = 1;
  const lines: TerminalLine[] = [];

  for (const line of seed) {
    for (const row of line.text.split("\n")) {
      lines.push({ id: id++, text: row, kind: line.kind });
    }
  }

  return { lines, nextId: id };
}

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
  "NOMKEE - BALLAD OF THE WANDERING ASTRO97 PART 1",
  "NOMKEE - BALLAD OF THE WANDERING ASTRO97 PART 2",
  "NOMKEE - CHERI",
  "NOMKEE - FROM THE HOOD",
  "NOMKEE - HOP",
  "NOMKEE - MAN FROM KEPLER 22-B",
  "NOMKEE - OCARINA OF TIME",
  "NOMKEE - SONAR",
  "NOMKEE - WANDERING THROUGH SPACE",
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

function animationBlockedMessage(
  commandName: string,
  ctx: TerminalCommandContext,
  options: { requireSound?: boolean } = {}
) {
  const reasons: string[] = [];
  if (options.requireSound && !ctx.soundEnabled) reasons.push("sound turned off");
  if (!ctx.effectsEnabled) reasons.push("effects turned off");
  if (ctx.accessibilityEnabled) reasons.push("a11y turned on");

  const reason =
    reasons.length === 0
      ? "reduced motion requested"
      : reasons.length === 1
      ? reasons[0]
      : `${reasons.slice(0, -1).join(", ")} and ${reasons[reasons.length - 1]}`;

  return `${commandName} animation not run: ${reason}.`;
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

function TerminalHelpList({ items }: { items: TerminalHelpItem[] }) {
  return (
    <div className="my-2 space-y-2 text-sm leading-6 sm:space-y-1">
      {items.map((item) => (
        <div
          key={item.usage}
          className="grid min-w-0 gap-0.5 border-l border-primary/20 pl-3 sm:grid-cols-[minmax(8rem,0.36fr)_minmax(0,1fr)] sm:gap-5 sm:border-l-0 sm:pl-0"
        >
          <div className="min-w-0 break-words text-primary">{item.usage}</div>
          <div className="min-w-0 break-words text-muted-foreground sm:pl-0">{item.description}</div>
        </div>
      ))}
    </div>
  );
}

const COMMAND_DEFINITIONS: TerminalCommandDefinition[] = [
  {
    name: "help",
    usage: "help",
    description: "show available commands",
    run: () => ({
      helpItems: COMMAND_DEFINITIONS.map((cmd) => ({
        usage: cmd.usage,
        description: cmd.description,
      })).sort((a, b) => a.usage.localeCompare(b.usage)),
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
          `-- CRT_COLOR: ${ctx.crtColor.toUpperCase()}`,
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
    name: "colorpicker",
    usage: "colorpicker",
    description: "open CRT color palette",
    aliases: ["colors", "theme"],
    run: (_args, ctx) => {
      if (ctx.accessibilityEnabled) {
        return {
          output: [
            "colorpicker.sys locked: A11Y mode uses a fixed high-contrast white palette. Disable A11Y first.",
          ],
          kind: "error",
        };
      }

      ctx.openColorPicker();
      return { output: [`colorpicker.sys opened | current ${ctx.crtColor.toUpperCase()}`], kind: "system" };
    },
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
    description: "show music alias, license, and tracks",
    run: () => ({
      output: [
        [
          "alias: NOMKEE",
          "audio: original music + UI sound effects",
          "license: free to use with attribution",
          'credit: "NOMKEE - <Track Name>"',
          "tracks:",
          NOMKEE_TRACKS.map((track) => `-- ${track}`).join("\n"),
        ].join("\n"),
      ],
    }),
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
      if (ctx.motionDisabled) {
        return { output: [animationBlockedMessage("matrix.sys", ctx)], kind: "error" };
      }
      ctx.triggerMatrix();
      return { output: ["matrix.sys streaming..."] };
    },
  },
  {
    name: "astrotrance",
    usage: "astrotrance",
    description: "run a 14s 128 BPM astronaut rave",
    aliases: ["rave"],
    run: (_args, ctx) => {
      if (!ctx.soundEnabled || ctx.motionDisabled) {
        return {
          output: [animationBlockedMessage("astrotrance.exe", ctx, { requireSound: true })],
          kind: "error",
        };
      }

      ctx.triggerAstroTrance();
      return {
        output: [
          `astrotrance.exe started | ${ASTROTRANCE_BPM} BPM | sound: ${
            ctx.soundEnabled ? "astrotrance.mp3" : "off"
          }`,
        ],
      };
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
      if (ctx.motionDisabled) {
        return { output: [animationBlockedMessage("lawnmower.exe", ctx)], kind: "error" };
      }
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

function drawAstroTrance(ctx: CanvasRenderingContext2D, width: number, height: number, elapsedMs: number) {
  const crt = getCrtPalette();
  const beat = elapsedMs / ASTROTRANCE_BEAT_MS;
  const beatIndex = Math.floor(beat);
  const beatPhase = beat - beatIndex;
  const beatPulse = Math.pow(1 - beatPhase, 3);
  const fade = Math.max(0, Math.min(1, 1 - Math.max(0, elapsedMs - ASTROTRANCE_DURATION_MS + 760) / 760));
  const t = elapsedMs * 0.001;
  const base = Math.min(width, height);
  const px = Math.max(1, base / 520);
  const groove = Math.sin(beat * Math.PI * 2);
  const shoulderGroove = Math.sin(beat * Math.PI * 4 + 0.45);

  const params: RenderParams = {
    preset: "front",
    seed: 97,
    bodyYaw: groove * 0.12 + shoulderGroove * 0.04,
    lookYaw: Math.sin(beat * Math.PI * 0.5 + 0.6) * 0.1,
    lookPitch: -0.04 + Math.sin(beat * Math.PI * 2 + 0.35) * 0.055,
    motion: 1,
    phase: beat * Math.PI * 2,
    walkDir: 1,
    crouch: beatPulse * 0.16 + (0.5 + 0.5 * groove) * 0.035,
    hang: Math.max(0, shoulderGroove) * 0.08,
    pullDir: Math.sin(beat * Math.PI * 2 + 1.2) * 0.35,
    bass: 0.55 + beatPulse * 0.45,
    mids: 0.42 + 0.35 * (0.5 + 0.5 * Math.sin(t * 5.4)),
    air: 0.58 + 0.32 * (0.5 + 0.5 * Math.sin(t * 8.1 + 1.4)),
    kick: beatPulse,
    lineAlpha: 0.82 + beatPulse * 0.18,
    glow: 0.62 + beatPulse * 0.28,
    lineWidth: 1.25 + beatPulse * 0.28,
    glass: 0.74,
    visorFill: 0.28 + beatPulse * 0.12,
    bgAlpha: 0.34 + beatPulse * 0.12,
    transparentBG: false,
    rig: {
      ...DEFAULT_RIG,
      scale: 2.72 + beatPulse * 0.12,
      motionAmp: 0.78,
      jitter: 0.02,
      shoulders: 1.08,
      hips: 0.96,
      offsetY: 0.08 + groove * 0.012,
    },
    lines: {
      glow: true,
      shoulder: false,
      head: true,
      glass: true,
      visor: true,
      visorFill: true,
      arms: true,
      legs: true,
      backpack: true,
      ground: true,
    },
  };

  drawEqAstronaut(ctx, width, height, params);

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.globalCompositeOperation = "lighter";

  const laserCount = 6;
  for (let i = 0; i < laserCount; i++) {
    const phase = t * (0.9 + i * 0.08) + i * 1.21;
    const fromLeft = i % 2 === 0;
    const x0 = fromLeft ? 0 : width;
    const y0 = height * (0.08 + i * 0.115);
    const x1 = width * (0.5 + Math.sin(phase) * 0.42);
    const y1 = height * (0.22 + Math.cos(phase * 0.8) * 0.16);

    ctx.strokeStyle = crt.rgba((0.08 + beatPulse * 0.16) * (1 - i * 0.075));
    ctx.lineWidth = Math.max(1, (1.4 + beatPulse * 2.2) * px);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  const bars = 28;
  const gap = Math.max(2, 3 * px);
  const floorY = height - 16 * px;
  const usableW = width * 0.72;
  const barW = Math.max(2, (usableW - gap * (bars - 1)) / bars);
  const startX = (width - usableW) * 0.5;

  for (let i = 0; i < bars; i++) {
    const n = i / Math.max(1, bars - 1);
    const wave = 0.5 + 0.5 * Math.sin(t * 7.5 + i * 0.65);
    const level = 0.18 + wave * 0.46 + beatPulse * (0.18 + Math.sin(n * Math.PI) * 0.24);
    const h = level * height * 0.17;
    const x = startX + i * (barW + gap);

    ctx.fillStyle = crt.rgba(0.12 + level * 0.42);
    ctx.fillRect(x, floorY - h, barW, h);
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.font = `${Math.max(12, 13 * px)}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = crt.rgba((0.58 + beatPulse * 0.34) * fade);
  ctx.fillText("ASTROTRANCE 128 BPM", width * 0.5, 14 * px);

  ctx.restore();
}

export function TerminalOverlay({
  open,
  activeTab,
  onClose,
  onNavigate,
  variant = "overlay",
  inlineHeaderTitle,
  inlineBodyVisible = true,
}: TerminalOverlayProps) {
  const {
    soundEnabled,
    effectsEnabled,
    accessibilityEnabled,
    crtColor,
    colorPickerOpen,
    openColorPicker,
    homeRevealDone,
    resetIntroForSession,
    eqQueue,
    eqActiveId,
    eqRepeat,
    setEqQueue,
    setEqActiveId,
  } = useUI();

  const isInline = variant === "inline";

  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const mowerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const astroTranceMatrixCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const astroTranceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const astroTranceAudioRef = useRef<HTMLAudioElement | null>(null);
  const mowerTimerRef = useRef<number | null>(null);
  const mowerRafRef = useRef<number | null>(null);
  const matrixTimerRef = useRef<number | null>(null);
  const matrixRafRef = useRef<number | null>(null);
  const astroTranceTimerRef = useRef<number | null>(null);
  const astroTranceRafRef = useRef<number | null>(null);
  const rebootTimersRef = useRef<number[]>([]);
  const pointerDownInsideRef = useRef(false);
  const initialLinesRef = useRef<{ lines: TerminalLine[]; nextId: number } | null>(null);
  if (initialLinesRef.current === null) {
    initialLinesRef.current = buildTerminalLines(initialTerminalSeed(homeRevealDone));
  }
  const lineIdRef = useRef(initialLinesRef.current.nextId);
  const terminalTouchedRef = useRef(false);
  const homeBootTranscriptLoadedRef = useRef(homeRevealDone);

  const [cwd, setCwd] = useState(ROOT_CWD);
  const [input, setInput] = useState("");
  const [rebooting, setRebooting] = useState(false);
  const [mowerActive, setMowerActive] = useState(false);
  const [matrixActive, setMatrixActive] = useState(false);
  const [astroTranceActive, setAstroTranceActive] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>(initialLinesRef.current.lines);

  const motionDisabled = !effectsEnabled || accessibilityEnabled;
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

  const makeHelpLine = (helpItems: TerminalHelpItem[]): TerminalLine => ({
    id: lineIdRef.current++,
    text: "",
    kind: "output",
    helpItems,
  });

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

  const stopAstroTranceAudio = () => {
    const audio = astroTranceAudioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
  };

  const playAstroTranceAudio = () => {
    if (!soundEnabled) {
      stopAstroTranceAudio();
      return;
    }

    let audio = astroTranceAudioRef.current;
    if (!audio) {
      audio = new Audio(ASTROTRANCE_AUDIO_SRC);
      audio.preload = "auto";
      audio.volume = 0.78;
      astroTranceAudioRef.current = audio;
    }

    audio.pause();
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  };

  const triggerAstroTrance = () => {
    if (astroTranceTimerRef.current !== null) window.clearTimeout(astroTranceTimerRef.current);
    if (astroTranceRafRef.current !== null) window.cancelAnimationFrame(astroTranceRafRef.current);
    stopAstroTranceAudio();

    setAstroTranceActive(false);
    window.requestAnimationFrame(() => {
      setAstroTranceActive(true);
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
      triggerAstroTrance,
      openColorPicker,
      activeTab,
      soundEnabled,
      effectsEnabled,
      accessibilityEnabled,
      crtColor,
      eqQueueCount: eqQueue.length,
      eqActiveLabel,
      eqRepeat,
      motionDisabled,
    }),
    [
      accessibilityEnabled,
      activeTab,
      crtColor,
      cwd,
      effectsEnabled,
      eqActiveLabel,
      eqQueue.length,
      eqRepeat,
      motionDisabled,
      onNavigate,
      openColorPicker,
      soundEnabled,
    ]
  );

  useEffect(() => {
    if (!open) return;
    if (isInline && !inlineBodyVisible) return;
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [inlineBodyVisible, isInline, open]);

  useEffect(() => {
    if (open) return;

    if (astroTranceRafRef.current !== null) window.cancelAnimationFrame(astroTranceRafRef.current);
    if (astroTranceTimerRef.current !== null) window.clearTimeout(astroTranceTimerRef.current);
    astroTranceRafRef.current = null;
    astroTranceTimerRef.current = null;
    stopAstroTranceAudio();
    setAstroTranceActive(false);
  }, [open]);

  useFocusTrap({
    active: open && !isInline && !colorPickerOpen,
    containerRef: panelRef,
    initialFocusRef: inputRef,
    onEscape: onClose,
  });

  useEffect(() => {
    if (!homeRevealDone || homeBootTranscriptLoadedRef.current || terminalTouchedRef.current) return;

    const next = buildTerminalLines(initialTerminalSeed(true));
    lineIdRef.current = next.nextId;
    homeBootTranscriptLoadedRef.current = true;
    setLines(next.lines);
  }, [homeRevealDone]);

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    return () => {
      stopHoverNoise();
      stopAstroTranceAudio();
      if (mowerTimerRef.current !== null) window.clearTimeout(mowerTimerRef.current);
      if (mowerRafRef.current !== null) window.cancelAnimationFrame(mowerRafRef.current);
      if (matrixTimerRef.current !== null) window.clearTimeout(matrixTimerRef.current);
      if (matrixRafRef.current !== null) window.cancelAnimationFrame(matrixRafRef.current);
      if (astroTranceTimerRef.current !== null) window.clearTimeout(astroTranceTimerRef.current);
      if (astroTranceRafRef.current !== null) window.cancelAnimationFrame(astroTranceRafRef.current);
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
    if (!astroTranceActive) return;

    const matrixCanvas = astroTranceMatrixCanvasRef.current;
    const canvas = astroTranceCanvasRef.current;
    const host = outputRef.current;
    const matrixCtx = matrixCanvas?.getContext("2d");
    const ctx = canvas?.getContext("2d");
    if (!matrixCanvas || !canvas || !host || !matrixCtx || !ctx) return;

    let start = 0;
    let prev = 0;
    let matrixColumns: MatrixColumn[] = [];
    let cssW = 1;
    let cssH = 1;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      cssW = width;
      cssH = height;

      matrixCanvas.width = Math.ceil(width * dpr);
      matrixCanvas.height = Math.ceil(height * dpr);
      matrixCanvas.style.width = `${width}px`;
      matrixCanvas.style.height = `${height}px`;
      matrixCanvas.style.opacity = "0.42";
      matrixCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      matrixCtx.clearRect(0, 0, width, height);
      matrixColumns = makeMatrixColumns(width, height, 16);

      canvas.width = Math.ceil(width * dpr);
      canvas.height = Math.ceil(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.style.opacity = "1";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const stop = () => {
      const rect = host.getBoundingClientRect();
      matrixCtx.clearRect(0, 0, rect.width, rect.height);
      ctx.clearRect(0, 0, rect.width * dpr, rect.height * dpr);
      stopAstroTranceAudio();
      setAstroTranceActive(false);
      astroTranceTimerRef.current = null;
      astroTranceRafRef.current = null;
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
      const fade = Math.max(0, Math.min(1, 1 - Math.max(0, elapsed - ASTROTRANCE_DURATION_MS + 760) / 760));
      const matrixElapsed = elapsed % Math.max(1000, MATRIX_DURATION_MS - 760);
      matrixCanvas.style.opacity = `${0.42 * fade}`;
      canvas.style.opacity = `${fade}`;

      drawMatrixRain(matrixCtx, cssW, cssH, matrixColumns, dt, matrixElapsed);
      drawAstroTrance(ctx, canvas.width, canvas.height, elapsed);

      if (elapsed < ASTROTRANCE_DURATION_MS) {
        astroTranceRafRef.current = window.requestAnimationFrame(tick);
      } else {
        astroTranceTimerRef.current = window.setTimeout(stop, 120);
      }
    };

    playAstroTranceAudio();

    resize();
    window.addEventListener("resize", resize);
    astroTranceRafRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      stopAstroTranceAudio();
      if (astroTranceRafRef.current !== null) window.cancelAnimationFrame(astroTranceRafRef.current);
      if (astroTranceTimerRef.current !== null) window.clearTimeout(astroTranceTimerRef.current);
    };
  }, [astroTranceActive]);

  useEffect(() => {
    if (!motionDisabled) return;
    if (mowerRafRef.current !== null) window.cancelAnimationFrame(mowerRafRef.current);
    if (mowerTimerRef.current !== null) window.clearTimeout(mowerTimerRef.current);
    if (matrixRafRef.current !== null) window.cancelAnimationFrame(matrixRafRef.current);
    if (matrixTimerRef.current !== null) window.clearTimeout(matrixTimerRef.current);
    if (astroTranceRafRef.current !== null) window.cancelAnimationFrame(astroTranceRafRef.current);
    if (astroTranceTimerRef.current !== null) window.clearTimeout(astroTranceTimerRef.current);
    mowerRafRef.current = null;
    mowerTimerRef.current = null;
    matrixRafRef.current = null;
    matrixTimerRef.current = null;
    astroTranceRafRef.current = null;
    astroTranceTimerRef.current = null;
    stopHoverNoise();
    stopAstroTranceAudio();
    setMowerActive(false);
    setMatrixActive(false);
    setAstroTranceActive(false);
  }, [motionDisabled]);

  const handlePanelBlur = () => {
    window.setTimeout(() => {
      if (colorPickerOpen) return;
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

    terminalTouchedRef.current = true;

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
    const helpLines = result.helpItems?.length ? [makeHelpLine(result.helpItems)] : [];

    appendLines([
      ...makeLines([`${cwd} $ ${command}`], "input"),
      ...outputLines,
      ...helpLines,
    ]);
  };

  const lineClass = (kind: TerminalLineKind) => {
    if (kind === "input") return "text-primary";
    if (kind === "error") return "text-destructive";
    if (kind === "system") return "text-primary/90";
    return "text-muted-foreground";
  };

  const startInlineHeaderHoverNoise = () => {
    if (!isInline || !soundEnabled) return;
    void primeAudio(["NOISE"])
      .then(() => startHoverNoise())
      .catch(() => {});
  };

  const collapseInlineTerminal = () => {
    if (!isInline) return;
    stopHoverNoise();
    if (soundEnabled) void playSoundAsync("TERM", 0.12, 0.96, 120).catch(() => {});
    onClose();
  };

  if (!open) return null;

  const inputId = isInline ? "terminal-input-inline" : "terminal-input-overlay";
  const defaultTerminalHeaderTitle = (
    <div className="flex min-w-0 items-center gap-2 text-primary">
      <TerminalIcon className="h-5 w-5 shrink-0" />
      <span className="truncate tracking-widest">fl97-mo@portfolio:{cwd}</span>
    </div>
  );
  const terminalHeaderTitle =
    isInline && inlineHeaderTitle ? (
      <div className="flex min-w-0 items-center gap-2 text-primary">{inlineHeaderTitle}</div>
    ) : (
      defaultTerminalHeaderTitle
    );
  const mowerCanvasPortal =
    mowerActive && typeof document !== "undefined"
      ? createPortal(
          <canvas
            ref={mowerCanvasRef}
            className="pointer-events-none fixed inset-0 z-[95]"
            aria-hidden="true"
          />,
          document.body
        )
      : null;

  const terminalPanel = (
    <>
      <div
        ref={panelRef}
        role={isInline ? "region" : "dialog"}
        aria-modal={isInline ? undefined : true}
        aria-label="Fake portfolio terminal"
        tabIndex={-1}
        onBlur={isInline ? undefined : handlePanelBlur}
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
        className={
          isInline
            ? "flex h-full w-full flex-col overflow-hidden rounded bg-background/90"
            : "mt-3 flex h-[min(78vh,760px)] w-full max-w-5xl flex-col overflow-hidden rounded border-2 border-primary/60 bg-background/90 crt-glow-overlay sm:mt-6"
        }
      >
        {isInline ? (
          <button
            type="button"
            onClick={collapseInlineTerminal}
            onMouseEnter={startInlineHeaderHoverNoise}
            onMouseLeave={stopHoverNoise}
            onFocus={startInlineHeaderHoverNoise}
            onBlur={stopHoverNoise}
            className="flex h-14 w-full items-center justify-between gap-3 border-b border-primary/30 bg-card/80 px-4 text-left text-sm text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:px-5 sm:text-base"
            aria-label="Collapse terminal"
          >
            {terminalHeaderTitle}
          </button>
        ) : (
          <div className="flex items-center justify-between gap-3 border-b border-primary/30 bg-card/80 px-3 py-2">
            {terminalHeaderTitle}

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded border border-primary/40 bg-background/60 px-3 py-1 text-primary hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Close terminal"
            >
              [X]
            </button>
          </div>
        )}

        <div
          aria-hidden={isInline && !inlineBodyVisible}
          className={`relative min-h-0 flex-1 overflow-hidden transition-[opacity,transform] duration-300 ease-out ${
            isInline && !inlineBodyVisible
              ? "pointer-events-none translate-y-1 opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          {matrixActive && (
            <canvas
              ref={matrixCanvasRef}
              className="pointer-events-none absolute inset-0 z-10 opacity-95"
              aria-hidden="true"
            />
          )}

          {astroTranceActive && (
            <>
              <canvas
                ref={astroTranceMatrixCanvasRef}
                className="pointer-events-none absolute inset-0 z-[18]"
                aria-hidden="true"
              />
              <canvas
                ref={astroTranceCanvasRef}
                className="pointer-events-none absolute inset-0 z-20 opacity-95"
                aria-hidden="true"
              />
            </>
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
              {lines.map((line) =>
                line.helpItems ? (
                  <TerminalHelpList key={line.id} items={line.helpItems} />
                ) : (
                  <pre
                    key={line.id}
                    className={`whitespace-pre-wrap break-words text-sm leading-6 ${lineClass(line.kind)}`}
                  >
                    {line.text}
                  </pre>
                )
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-0 flex min-w-0 items-baseline gap-2">
              <label htmlFor={inputId} className="sr-only">
                Terminal command
              </label>
              <span className="shrink-0 whitespace-pre text-sm leading-6 text-primary">{cwd} $</span>
              <input
                ref={inputRef}
                id={inputId}
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
    </>
  );

  if (isInline) {
    return (
      <>
        {mowerCanvasPortal}
        <div className="h-full w-full">{terminalPanel}</div>
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-black/45 p-3 sm:p-6 md:p-8"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {mowerCanvasPortal}
      {terminalPanel}
    </div>
  );
}
