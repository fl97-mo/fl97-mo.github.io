import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Terminal as TerminalIcon } from "lucide-react";

import type { TabId } from "./RetroNavigation";
import { useUI } from "../store/ui";
import { playSoundAsync } from "../utils/sfx";

type TerminalOverlayProps = {
  open: boolean;
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
          "theme: CRT green terminal",
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
    description: "print a tiny fake boot sequence",
    run: () => ({
      output: [
        [
          "matrix.sys initializing...",
          "01000110 01001100 00110001 00111001",
          "green channel locked",
          "shell sandbox: fake",
          "no exploit found",
        ].join("\n"),
      ],
    }),
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
  ctx.save();
  ctx.translate(x, y);
  if (direction < 0) ctx.scale(-1, 1);

  ctx.fillStyle = "rgba(3, 8, 3, 0.95)";
  ctx.strokeStyle = "rgba(0, 255, 65, 0.88)";
  ctx.lineWidth = Math.max(1, scale);

  ctx.fillRect(-18 * scale, -8 * scale, 36 * scale, 14 * scale);
  ctx.strokeRect(-18 * scale, -8 * scale, 36 * scale, 14 * scale);

  ctx.fillStyle = "rgba(0, 255, 65, 0.34)";
  ctx.fillRect(-8 * scale, -14 * scale, 18 * scale, 6 * scale);
  ctx.strokeRect(-8 * scale, -14 * scale, 18 * scale, 6 * scale);

  ctx.strokeStyle = "rgba(0, 255, 65, 0.7)";
  ctx.beginPath();
  ctx.moveTo(12 * scale, -12 * scale);
  ctx.lineTo(28 * scale, -24 * scale);
  ctx.stroke();

  ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
  ctx.strokeStyle = "rgba(0, 255, 65, 0.82)";
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

export function TerminalOverlay({ open, onClose, onNavigate }: TerminalOverlayProps) {
  const {
    soundEnabled,
    effectsEnabled,
    resetIntroForSession,
    setEqQueue,
    setEqActiveId,
  } = useUI();

  const prefersReducedMotion = usePrefersReducedMotion();

  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const mowerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mowerTimerRef = useRef<number | null>(null);
  const mowerRafRef = useRef<number | null>(null);
  const rebootTimersRef = useRef<number[]>([]);
  const pointerDownInsideRef = useRef(false);
  const lineIdRef = useRef(3);

  const [cwd, setCwd] = useState(ROOT_CWD);
  const [input, setInput] = useState("");
  const [rebooting, setRebooting] = useState(false);
  const [mowerActive, setMowerActive] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 1, text: "FL97-MO VIRTUAL TERMINAL", kind: "system" },
    { id: 2, text: "type help", kind: "output" },
  ]);

  const motionDisabled = !effectsEnabled || prefersReducedMotion;

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
      motionDisabled,
    }),
    [
      cwd,
      motionDisabled,
      onNavigate,
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
        className="mt-3 flex h-[min(78vh,760px)] w-full max-w-5xl flex-col overflow-hidden rounded border-2 border-primary/60 bg-background/90 shadow-[0_0_35px_rgba(0,255,65,0.32)] sm:mt-6"
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

        <div
          ref={outputRef}
          className="flex-1 cursor-text overflow-y-auto bg-black/25 px-4 py-3"
          onPointerDown={(event) => {
            if (event.target === outputRef.current) {
              event.preventDefault();
              inputRef.current?.focus();
            }
          }}
          onClick={() => inputRef.current?.focus()}
        >
          {lines.map((line) => (
            <pre
              key={line.id}
              className={`whitespace-pre-wrap break-words text-sm leading-6 ${lineClass(line.kind)}`}
            >
              {line.text}
            </pre>
          ))}

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
  );
}
