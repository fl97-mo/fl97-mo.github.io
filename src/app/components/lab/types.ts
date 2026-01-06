export type PosePreset = "front" | "threeQuarter" | "side";

export type RigParams = {
  scale: number;
  offsetX: number;
  offsetY: number;
  head: number;
  body: number;
  arm: number;
  leg: number;
  shoulders: number;
  hips: number;
  visorW: number;
  visorH: number;
  pack: number;
  jitter: number;
  motionAmp: number;
};

export const DEFAULT_RIG: RigParams = {
  scale: 3.6,
  offsetX: 0,
  offsetY: 0,
  head: 1.0,
  body: 1.0,
  arm: 1.0,
  leg: 1.0,
  shoulders: 1.0,
  hips: 1.0,
  visorW: 1.0,
  visorH: 1.0,
  pack: 1.0,
  jitter: 0.08,
  motionAmp: 0.55,
};

export type LineToggles = {
  glow: boolean;
  head: boolean;
  glass: boolean;
  visor: boolean;
  visorFill: boolean;
  arms: boolean;
  legs: boolean;
  backpack: boolean;
  ground: boolean;
};

export type RenderParams = {
  preset: PosePreset;
  seed: number;

  bodyYaw: number;
  lookYaw: number;
  lookPitch: number;

  motion: number;
  phase: number;
  walkDir: 1 | -1;

  crouch: number;
  hang: number;
  pullDir: number;

  bass: number;
  mids: number;
  air: number;
  kick: number;

  lineAlpha: number;
  glow: number;
  lineWidth: number;
  glass: number;
  visorFill: number;

  bgAlpha: number;
  transparentBG: boolean;

  rig: RigParams;
  lines: LineToggles;
};
