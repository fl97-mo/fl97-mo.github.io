export type U8 = Uint8Array<ArrayBuffer>;

export type PointerState = {
  has: boolean;
  cx: number;
  cy: number;
  down: boolean;
};

export type BgPix = {
  x: number;
  y: number;
  a: number;
  s: number;
  sp: number;
  ph: number;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
};

export type Star = {
  baseX: number;
  baseY: number;

  col: number;
  hz: number;
  bin: number;

  baseR: number;
  seed: number;

  core: number;

  pulses: number[];
  pulsePhase: number;
  cd: number;
};
