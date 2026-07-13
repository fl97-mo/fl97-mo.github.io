import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Gamepad2, Play, RotateCcw, X } from "lucide-react";
import { getCrtPalette } from "../../utils/crtTheme";

type RunnerMode = "ready" | "playing" | "crashed";
type RunnerObjectKind = "ufo" | "coin";

type RunnerObject = {
  id: number;
  kind: RunnerObjectKind;
  x: number;
  y: number;
  w: number;
  h: number;
  phase: number;
};

type RunnerStar = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  speed: number;
  phase: number;
};

type RunnerGame = {
  width: number;
  height: number;
  dpr: number;
  groundY: number;
  player: {
    x: number;
    y: number;
    hitY: number;
    vy: number;
    duck: boolean;
  };
  objects: RunnerObject[];
  stars: RunnerStar[];
  spawnIn: number;
  score: number;
  coins: number;
  speed: number;
  distance: number;
  nextId: number;
  flash: number;
  shake: number;
  t: number;
};

type RunnerKeys = {
  duck: boolean;
};

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type Ref<T> = {
  current: T;
};

type EqRunnerGameProps = {
  className?: string;
  gameDuckRef?: Ref<boolean>;
  seekHeldRef?: Ref<boolean>;
  seekYRef?: Ref<number>;
  seekVelNormRef?: Ref<number>;
  timeRef?: Ref<number>;
  durationRef?: Ref<number>;
};

const BEST_KEY = "eq-runner-best";
const GRAVITY = 1280;
const JUMP_VELOCITY = 545;
const PLAYER_STAND_HURT_H = 42;
const PLAYER_STAND_HURT_W = 20;
const PLAYER_DUCK_HURT_H = 18;
const PLAYER_DUCK_HURT_W = 30;
const PLAYER_STAND_COLLECT_H = 76;
const PLAYER_STAND_COLLECT_W = 54;
const PLAYER_DUCK_COLLECT_H = 34;
const PLAYER_DUCK_COLLECT_W = 58;
const PLAYER_MAX_SYNC_LIFT = 76;
const JUMP_VISUAL_HOLD_MS = 220;

const CONTROL_CODES = new Set(["ArrowUp", "ArrowDown", "Space", "KeyW", "KeyS"]);

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function makeStars(width: number, height: number): RunnerStar[] {
  const count = clamp(Math.floor((width * height) / 1500), 28, 120);
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * Math.max(1, height * 0.82),
    r: Math.random() < 0.82 ? 1 : 1.7,
    alpha: randomRange(0.16, 0.72),
    speed: randomRange(0.06, 0.24),
    phase: Math.random() * Math.PI * 2,
  }));
}

function createGame(width: number, height: number, dpr = window.devicePixelRatio || 1): RunnerGame {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const groundY = Math.max(92, safeH - 5);

  return {
    width: safeW,
    height: safeH,
    dpr,
    groundY,
    player: {
      x: safeW * 0.12,
      y: 0,
      hitY: 0,
      vy: 0,
      duck: false,
    },
    objects: [],
    stars: makeStars(safeW, safeH),
    spawnIn: 0.78,
    score: 0,
    coins: 0,
    speed: 214,
    distance: 0,
    nextId: 1,
    flash: 0,
    shake: 0,
    t: 0,
  };
}

function getPlayerHurtRect(game: RunnerGame): Rect {
  const ducking = game.player.duck && game.player.hitY <= 5;
  const w = ducking ? PLAYER_DUCK_HURT_W : PLAYER_STAND_HURT_W;
  const h = ducking ? PLAYER_DUCK_HURT_H : PLAYER_STAND_HURT_H;
  const yOffset = ducking ? 3 : 10;

  return {
    x: game.player.x - w * 0.5,
    y: game.groundY - game.player.hitY - h - yOffset,
    w,
    h,
  };
}

function getPlayerCollectRect(game: RunnerGame): Rect {
  const ducking = game.player.duck && game.player.hitY <= 5;
  const w = ducking ? PLAYER_DUCK_COLLECT_W : PLAYER_STAND_COLLECT_W;
  const h = ducking ? PLAYER_DUCK_COLLECT_H : PLAYER_STAND_COLLECT_H;
  const yOffset = ducking ? 0 : 4;

  return {
    x: game.player.x - w * 0.5,
    y: game.groundY - game.player.hitY - h - yOffset,
    w,
    h,
  };
}

function getUfoHurtRect(obj: RunnerObject): Rect {
  return {
    x: obj.x + obj.w * 0.22,
    y: obj.y + obj.h * 0.24,
    w: obj.w * 0.56,
    h: obj.h * 0.52,
  };
}

function expandRect(rect: Rect, xPad: number, yPad: number): Rect {
  return {
    x: rect.x - xPad,
    y: rect.y - yPad,
    w: rect.w + xPad * 2,
    h: rect.h + yPad * 2,
  };
}

function rectsOverlap(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function spawnObject(game: RunnerGame) {
  const fast = clamp((game.speed - 214) / 210, 0, 1);
  const kind: RunnerObjectKind = Math.random() < 0.34 ? "coin" : "ufo";
  const highLane = Math.random() < (kind === "coin" ? 0.55 : 0.38 + fast * 0.1);

  if (kind === "coin") {
    const size = 18;
    const centerY = game.groundY - (highLane ? 78 : 45);
    game.objects.push({
      id: game.nextId++,
      kind,
      x: game.width + 22,
      y: centerY - size * 0.5,
      w: size,
      h: size,
      phase: Math.random() * Math.PI * 2,
    });
  } else {
    game.objects.push({
      id: game.nextId++,
      kind,
      x: game.width + 28,
      y: game.groundY - (highLane ? 53 : 29),
      w: 45,
      h: 20,
      phase: Math.random() * Math.PI * 2,
    });
  }

  game.spawnIn = Math.max(0.48, 0.96 - fast * 0.28 + Math.random() * 0.44);
}

function updateRunner(
  game: RunnerGame,
  dt: number,
  mode: RunnerMode,
  keys: RunnerKeys,
  progress: number,
  visualLift: number,
  jumpActive: boolean
) {
  game.t += dt;
  game.flash = Math.max(0, game.flash - dt);
  game.shake = Math.max(0, game.shake - dt);
  game.player.x = lerp(game.width * 0.12, game.width * 0.88, clamp(progress, 0, 1));
  game.player.hitY =
    visualLift > 0.5 || jumpActive ? Math.max(visualLift, Math.min(game.player.y, PLAYER_MAX_SYNC_LIFT)) : 0;

  if (mode !== "playing") {
    game.distance += dt * 28;
    return false;
  }

  game.speed = Math.min(440, 214 + game.distance * 0.018);
  game.distance += game.speed * dt;
  game.score += dt * (12 + game.speed * 0.045);

  const player = game.player;
  player.duck = keys.duck;

  if (player.y > 0 || player.vy > 0) {
    player.vy -= GRAVITY * dt;
    if (keys.duck) player.vy -= GRAVITY * 0.55 * dt;
    player.y += player.vy * dt;

    if (player.y <= 0) {
      player.y = 0;
      player.vy = 0;
    }
  }
  player.hitY =
    visualLift > 0.5 || jumpActive ? Math.max(visualLift, Math.min(player.y, PLAYER_MAX_SYNC_LIFT)) : 0;

  game.spawnIn -= dt;
  if (game.spawnIn <= 0) spawnObject(game);

  const playerHurtRect = getPlayerHurtRect(game);
  const playerCollectRect = getPlayerCollectRect(game);
  const nextObjects: RunnerObject[] = [];
  let crashed = false;

  for (const obj of game.objects) {
    obj.x -= game.speed * dt * (obj.kind === "coin" ? 0.94 : 1);

    if (obj.kind === "coin") {
      const hit = rectsOverlap(playerCollectRect, expandRect(obj, 5, 5));
      if (hit) {
        game.coins += 1;
        game.score += 55;
        game.flash = 0.16;
        continue;
      }
    } else if (rectsOverlap(playerHurtRect, getUfoHurtRect(obj))) {
      crashed = true;
    }

    if (obj.x + obj.w > -60) nextObjects.push(obj);
  }

  game.objects = nextObjects;

  if (crashed) {
    game.shake = 0.28;
    return true;
  }

  return false;
}

function drawGround(g: CanvasRenderingContext2D, game: RunnerGame, crt: ReturnType<typeof getCrtPalette>) {
  const { width, groundY, distance } = game;

  g.save();
  g.strokeStyle = crt.rgba(0.52);
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, groundY + 0.5);
  g.lineTo(width, groundY + 0.5);
  g.stroke();

  g.strokeStyle = crt.rgba(0.18);
  const offset = -((distance * 0.52) % 24);
  for (let x = offset; x < width + 24; x += 24) {
    g.beginPath();
    g.moveTo(x, groundY + 8);
    g.lineTo(x + 10, groundY + 8);
    g.stroke();
  }
  g.restore();
}

function drawBackground(g: CanvasRenderingContext2D, game: RunnerGame, crt: ReturnType<typeof getCrtPalette>) {
  const { width, height } = game;

  const shade = g.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, "rgba(0,0,0,0.18)");
  shade.addColorStop(0.42, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.08)");
  g.fillStyle = shade;
  g.fillRect(0, 0, width, height);

  g.save();
  g.globalCompositeOperation = "lighter";
  for (const star of game.stars) {
    const span = width + 24;
    const x = ((((star.x - game.distance * star.speed) % span) + span) % span) - 12;
    const pulse = 0.68 + 0.32 * Math.sin(game.t * 3.2 + star.phase);
    g.fillStyle = crt.rgba(star.alpha * pulse);
    g.fillRect(Math.floor(x), Math.floor(star.y), star.r, star.r);
  }
  g.restore();

  g.save();
  g.strokeStyle = crt.rgba(0.055);
  g.lineWidth = 1;
  for (let y = game.groundY - 24; y > 16; y -= 24) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(width, y);
    g.stroke();
  }
  g.restore();
}

function drawCoin(g: CanvasRenderingContext2D, obj: RunnerObject, t: number, crt: ReturnType<typeof getCrtPalette>) {
  const cx = obj.x + obj.w * 0.5;
  const cy = obj.y + obj.h * 0.5 + Math.sin(t * 6 + obj.phase) * 2;
  const squash = 0.66 + Math.sin(t * 7 + obj.phase) * 0.18;

  g.save();
  g.globalCompositeOperation = "lighter";
  g.strokeStyle = "rgba(255,214,82,0.92)";
  g.fillStyle = "rgba(255,214,82,0.14)";
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(cx, cy, obj.w * 0.42 * squash, obj.h * 0.46, 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();

  g.strokeStyle = crt.rgba(0.48);
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(cx, cy - 5);
  g.lineTo(cx, cy + 5);
  g.stroke();
  g.restore();
}

function drawUfo(g: CanvasRenderingContext2D, obj: RunnerObject, t: number, crt: ReturnType<typeof getCrtPalette>) {
  const cx = obj.x + obj.w * 0.5;
  const cy = obj.y + obj.h * 0.5 + Math.sin(t * 5.8 + obj.phase) * 2;

  g.save();
  g.globalCompositeOperation = "lighter";

  g.fillStyle = "rgba(104,196,255,0.12)";
  g.strokeStyle = "rgba(104,196,255,0.72)";
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(cx, cy - obj.h * 0.22, obj.w * 0.18, Math.PI, 0);
  g.fill();
  g.stroke();

  g.fillStyle = crt.rgba(0.12);
  g.strokeStyle = crt.rgba(0.86);
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(cx, cy, obj.w * 0.46, obj.h * 0.32, 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();

  g.fillStyle = "rgba(255,82,168,0.66)";
  for (let i = -1; i <= 1; i++) {
    g.fillRect(cx + i * 10 - 1.5, cy + 3, 3, 3);
  }

  g.restore();
}

function drawRunner(canvas: HTMLCanvasElement, game: RunnerGame, mode: RunnerMode) {
  const g = canvas.getContext("2d");
  if (!g) return;

  const crt = getCrtPalette();
  const shake = game.shake > 0 ? Math.sin(game.t * 92) * game.shake * 12 : 0;

  g.setTransform(game.dpr, 0, 0, game.dpr, 0, 0);
  g.clearRect(0, 0, game.width, game.height);

  drawBackground(g, game, crt);

  g.save();
  g.translate(shake, 0);
  drawGround(g, game, crt);

  for (const obj of game.objects) {
    if (obj.kind === "coin") drawCoin(g, obj, game.t, crt);
    else drawUfo(g, obj, game.t, crt);
  }
  g.restore();

  if (game.flash > 0) {
    g.fillStyle = `rgba(255,214,82,${game.flash * 0.42})`;
    g.fillRect(0, 0, game.width, game.height);
  }

  if (mode === "crashed") {
    g.fillStyle = "rgba(255,38,0,0.08)";
    g.fillRect(0, 0, game.width, game.height);
  }
}

export function EqRunnerGame({
  className = "",
  gameDuckRef,
  seekHeldRef,
  seekYRef,
  seekVelNormRef,
  timeRef,
  durationRef,
}: EqRunnerGameProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<RunnerMode>("ready");
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [best, setBest] = useState(0);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<RunnerGame | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(performance.now());
  const hudPushRef = useRef(0);
  const keysRef = useRef<RunnerKeys>({ duck: false });
  const modeRef = useRef<RunnerMode>("ready");
  const bestRef = useRef(0);
  const jumpHoldUntilRef = useRef(0);

  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(BEST_KEY) ?? 0);
      if (Number.isFinite(stored) && stored > 0) {
        bestRef.current = Math.floor(stored);
        setBest(Math.floor(stored));
      }
    } catch {}
  }, []);

  const setRunnerMode = useCallback((next: RunnerMode) => {
    modeRef.current = next;
    setMode(next);
  }, []);

  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    const rect = host?.getBoundingClientRect();
    const width = Math.max(1, rect?.width ?? 320);
    const height = Math.max(1, rect?.height ?? 210);
    const dpr = window.devicePixelRatio || 1;

    if (canvas) {
      const nextW = Math.round(width * dpr);
      const nextH = Math.round(height * dpr);
      if (canvas.width !== nextW) canvas.width = nextW;
      if (canvas.height !== nextH) canvas.height = nextH;
    }

    return { width, height, dpr };
  }, []);

  const pushHud = useCallback((game: RunnerGame, now: number, force = false) => {
    if (!force && now - hudPushRef.current < 95) return;
    hudPushRef.current = now;
    setScore(Math.floor(game.score));
    setCoins(game.coins);
  }, []);

  const getEqProgress = useCallback(() => {
    const duration = durationRef?.current ?? 0;
    const time = timeRef?.current ?? 0;
    return duration > 0.001 ? clamp(time / duration, 0, 1) : 0;
  }, [durationRef, timeRef]);

  const getVisualLift = useCallback(() => {
    const dpr = gameRef.current?.dpr ?? window.devicePixelRatio ?? 1;
    return Math.max(0, -(seekYRef?.current ?? 0) / Math.max(1, dpr));
  }, [seekYRef]);

  const resetRunner = useCallback(
    (nextMode: RunnerMode = "ready") => {
      const dims = prepareCanvas();
      const game = createGame(dims.width, dims.height, dims.dpr);
      game.player.x = lerp(game.width * 0.12, game.width * 0.88, getEqProgress());
      gameRef.current = game;
      keysRef.current.duck = false;
      jumpHoldUntilRef.current = 0;
      if (gameDuckRef) gameDuckRef.current = false;
      if (seekHeldRef) seekHeldRef.current = false;
      if (seekVelNormRef) seekVelNormRef.current = 0;
      setRunnerMode(nextMode);
      pushHud(game, performance.now(), true);
      if (canvasRef.current) drawRunner(canvasRef.current, game, nextMode);
    },
    [gameDuckRef, getEqProgress, prepareCanvas, pushHud, seekHeldRef, seekVelNormRef, setRunnerMode]
  );

  const persistBest = useCallback((finalScore: number) => {
    const nextBest = Math.max(bestRef.current, Math.floor(finalScore));
    if (nextBest === bestRef.current) return;
    bestRef.current = nextBest;
    setBest(nextBest);
    try {
      localStorage.setItem(BEST_KEY, String(nextBest));
    } catch {}
  }, []);

  const crashRunner = useCallback(
    (finalScore: number) => {
      if (modeRef.current !== "playing") return;
      persistBest(finalScore);
      keysRef.current.duck = false;
      jumpHoldUntilRef.current = 0;
      if (gameDuckRef) gameDuckRef.current = false;
      if (seekHeldRef) seekHeldRef.current = false;
      if (seekVelNormRef) seekVelNormRef.current = 0;
      setRunnerMode("crashed");
      const game = gameRef.current;
      if (game) pushHud(game, performance.now(), true);
    },
    [gameDuckRef, persistBest, pushHud, seekHeldRef, seekVelNormRef, setRunnerMode]
  );

  const startRunner = useCallback(() => {
    resetRunner("playing");
    stageRef.current?.focus();
  }, [resetRunner]);

  const jumpRunner = useCallback(() => {
    if (modeRef.current !== "playing") {
      startRunner();
      return;
    }

    const player = gameRef.current?.player;
    const now = performance.now();
    const visualGrounded = !!seekYRef && getVisualLift() <= 4 && now >= jumpHoldUntilRef.current;

    if (!player || (player.y > 1 && !visualGrounded)) return;
    player.duck = false;
    keysRef.current.duck = false;
    player.y = 1;
    player.vy = JUMP_VELOCITY;
    player.hitY = 1;
    jumpHoldUntilRef.current = now + JUMP_VISUAL_HOLD_MS;
    if (gameDuckRef) gameDuckRef.current = false;
    if (seekHeldRef) seekHeldRef.current = true;
    if (seekVelNormRef) seekVelNormRef.current = 0.38;
  }, [gameDuckRef, getVisualLift, seekHeldRef, seekVelNormRef, seekYRef, startRunner]);

  const setDuck = useCallback((duck: boolean) => {
    keysRef.current.duck = duck;
    if (gameDuckRef) gameDuckRef.current = duck;
    const player = gameRef.current?.player;
    if (player) player.duck = duck;
  }, [gameDuckRef]);

  useEffect(() => {
    if (!isOpen) {
      gameRef.current = null;
      keysRef.current.duck = false;
      jumpHoldUntilRef.current = 0;
      if (gameDuckRef) gameDuckRef.current = false;
      if (seekHeldRef) seekHeldRef.current = false;
      if (seekVelNormRef) seekVelNormRef.current = 0;
      return;
    }

    const id = requestAnimationFrame(() => {
      resetRunner("ready");
      stageRef.current?.focus();
    });

    return () => cancelAnimationFrame(id);
  }, [gameDuckRef, isOpen, resetRunner, seekHeldRef, seekVelNormRef]);

  useEffect(() => {
    if (!isOpen) return;

    const resize = () => {
      const dims = prepareCanvas();
      const game = gameRef.current;
      const changed =
        !game ||
        Math.abs(game.width - dims.width) > 1 ||
        Math.abs(game.height - dims.height) > 1 ||
        game.dpr !== dims.dpr;

      if (!changed) return;
      const nextGame = createGame(dims.width, dims.height, dims.dpr);
      nextGame.player.x = lerp(nextGame.width * 0.12, nextGame.width * 0.88, getEqProgress());
      gameRef.current = nextGame;
      setRunnerMode("ready");
      pushHud(nextGame, performance.now(), true);
      if (canvasRef.current) drawRunner(canvasRef.current, nextGame, "ready");
    };

    resize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", resize, { passive: true });
      return () => window.removeEventListener("resize", resize);
    }

    const ro = new ResizeObserver(resize);
    if (hostRef.current) ro.observe(hostRef.current);
    return () => ro.disconnect();
  }, [getEqProgress, isOpen, prepareCanvas, pushHud, setRunnerMode]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!CONTROL_CODES.has(event.code)) return;
      event.preventDefault();

      if (event.code === "ArrowDown" || event.code === "KeyS") {
        if (modeRef.current !== "playing") startRunner();
        setDuck(true);
        return;
      }

      if (!event.repeat) jumpRunner();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "ArrowDown" && event.code !== "KeyS") return;
      event.preventDefault();
      setDuck(false);
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
    };
  }, [isOpen, jumpRunner, setDuck, startRunner]);

  useEffect(() => {
    if (!isOpen) return;

    lastRef.current = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.045, Math.max(0.001, (now - lastRef.current) / 1000));
      lastRef.current = now;

      const game = gameRef.current;
      const canvas = canvasRef.current;

      if (game && canvas) {
        const holdJump = modeRef.current === "playing" && now < jumpHoldUntilRef.current;
        if (seekHeldRef) seekHeldRef.current = holdJump;
        if (!holdJump && seekVelNormRef) seekVelNormRef.current = 0;

        const crashed = updateRunner(
          game,
          dt,
          modeRef.current,
          keysRef.current,
          getEqProgress(),
          getVisualLift(),
          holdJump
        );
        if (crashed) crashRunner(game.score);
        pushHud(game, now);
        drawRunner(canvas, game, modeRef.current);
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [crashRunner, getEqProgress, getVisualLift, isOpen, pushHud, seekHeldRef, seekVelNormRef]);

  const toggleOpen = () => {
    setIsOpen((open) => !open);
  };

  const statusText =
    mode === "playing"
      ? `Game running. Score ${score}. Coins ${coins}.`
      : mode === "crashed"
        ? `Game over. Score ${score}. Coins ${coins}.`
        : `Game ready. Best score ${best}.`;

  return (
    <div ref={hostRef} className={`${className} pointer-events-none z-20`}>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {statusText}
      </p>

      {isOpen && (
        <div
          ref={stageRef}
          tabIndex={-1}
          className="absolute inset-0 overflow-hidden rounded bg-transparent outline-none pointer-events-auto touch-none"
          aria-label="Equalizer runner game"
        >
          <canvas
            ref={canvasRef}
            className="pointer-events-none h-full w-full rounded"
            role="img"
            aria-label="Retro runner game layer with UFO obstacles and collectible coins"
          />

          <div className="pointer-events-none absolute left-2 top-2 flex max-w-[calc(100%-5.5rem)] flex-wrap gap-x-3 gap-y-1 rounded border border-primary/25 bg-background/55 px-2 py-1 text-sm tracking-widest text-primary/90 backdrop-blur-[1px]">
            <span className="tabular-nums">SCORE {score}</span>
            <span className="tabular-nums">COINS {coins}</span>
            <span className="tabular-nums">BEST {best}</span>
          </div>

          {mode !== "playing" && (
            <div className="absolute inset-0 flex items-center justify-center px-4">
              <button
                type="button"
                onClick={startRunner}
                className="inline-flex h-12 min-w-32 items-center justify-center gap-2 rounded border-2 border-primary/60 bg-background/85 px-4 text-base tracking-widest text-primary transition-all hover:border-primary crt-hover-glow crt-inset-button"
              >
                {mode === "crashed" ? <RotateCcw className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                <span>{mode === "crashed" ? "RETRY" : "START"}</span>
              </button>
            </div>
          )}

          <div className="absolute bottom-2 right-2 flex gap-2 pointer-events-auto">
            <button
              type="button"
              title="Jump"
              aria-label="Jump"
              onPointerDown={(event) => {
                event.preventDefault();
                jumpRunner();
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded border-2 border-primary/45 bg-background/75 text-primary transition-all hover:border-primary crt-hover-glow-soft crt-inset-button-soft touch-none"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
            <button
              type="button"
              title="Duck"
              aria-label="Duck"
              onPointerDown={(event) => {
                event.preventDefault();
                if (modeRef.current !== "playing") startRunner();
                setDuck(true);
              }}
              onPointerUp={() => setDuck(false)}
              onPointerCancel={() => setDuck(false)}
              onPointerLeave={() => setDuck(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded border-2 border-primary/45 bg-background/75 text-primary transition-all hover:border-primary crt-hover-glow-soft crt-inset-button-soft touch-none"
            >
              <ArrowDown className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={toggleOpen}
        aria-pressed={isOpen}
        aria-label={isOpen ? "Close equalizer runner game" : "Open equalizer runner game"}
        className="pointer-events-auto absolute right-2 top-2 z-30 inline-flex h-9 items-center justify-center gap-2 rounded border-2 border-primary/55 bg-background/80 px-2 text-sm tracking-widest text-primary transition-all hover:border-primary crt-hover-glow crt-inset-button"
      >
        {isOpen ? <X className="h-4 w-4" /> : <Gamepad2 className="h-4 w-4" />}
        <span>{isOpen ? "EXIT" : "RUN"}</span>
      </button>
    </div>
  );
}
