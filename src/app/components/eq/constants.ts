export const MIN_HZ = 18;
export const MAX_HZ = 18000;

export const VIS_COLUMNS = 40;
export const SEGMENTS = 18;

export const MAP_LOW_HZ = 220;
export const MAP_MID_HZ = 5000;
export const MAP_LOW_P = 0.22;
export const MAP_MID_P = 0.58;
export const MAP_HIGH_P = 0.2;

export const BG_PIX_DENSITY = 5200;
export const BG_PIX_MIN = 220;
export const BG_PIX_MAX = 360;

export const LOOK_MAX_YAW = 0.95;
export const LOOK_MAX_PITCH = 0.55;

export const LOOK_ATTACK = 0.22;
export const LOOK_RELEASE = 0.14;

export const LOOK_BLEND_ATTACK = 0.18;
export const LOOK_BLEND_RELEASE = 0.1;

export const FFT_SIZE = 16384;
export const ANALYSER_SMOOTH = 0.22;

export const BAR_ATTACK = 0.62;
export const BAR_RELEASE = 0.26;

export const PEAK_DECAY = 0.022;
export const PEAK_THICK_PX = 2;

export const COL_FILL = 0.92;
export const COL_GAP_PX = 2;
export const SEG_GAP_PX = 3;

export const GRID_ALPHA = 0.06;
export const SCAN_ALPHA = 0.045;

export const TICKS_HZ = [32, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;

export const WALK_BASE_SPEED = 1.95;
export const WALK_SPEED_GAIN = 2.05;

export const WALK_MOTION_ATTACK = 0.12;
export const WALK_MOTION_RELEASE = 0.055;

export const WALK_IDLE_SPEED = 0.12;
export const WALK_IDLE_ALPHA = 0.28;

export const WALK_IDLE_BOB_PX = 0.95;
export const WALK_IDLE_SWAY_PX = 0.55;

export const STAR_COUNT_MIN = 12;
export const STAR_COUNT_MAX = 18;

export const STAR_CORE_R_BASE = 3.6;
export const STAR_CORE_R_JITTER = 1.6;

export const STAR_CORE_ALPHA_BASE = 0.12;
export const STAR_CORE_ALPHA_MAX = 0.95;

export const STAR_CORE_ATTACK = 0.06;
export const STAR_CORE_RELEASE = 0.035;

export const STAR_BAND_ATTACK = 0.085;
export const STAR_BAND_RELEASE = 0.04;

export const STAR_BREATH_SPEED = 0.18;

export const STAR_RING_R_MIN = 2;
export const STAR_RING_R_MAX = 80.0;

export const STAR_RING_THICK_MIN = 1.0;
export const STAR_RING_THICK_MAX = 3.2;

export const STAR_RING_ALPHA_BASE = 0.10;
export const STAR_RING_ALPHA_GAIN = 1.05;

export const STAR_PULSE_SPEED = 0.46;
export const STAR_PULSE_MAX = 4;

export const STAR_GAIN = 0.62;

export const STAR_PULSE_RATE_MIN = 0.16;
export const STAR_PULSE_RATE_GAIN = 2.35;
export const STAR_PULSE_RATE_KICK_GAIN = 1.15;

export const STAR_PULSE_GATE = 0.03;
export const STAR_PULSE_COOLDOWN = 0.12;

export const STAR_BEAT_GATE = 0.26;

export const SCENE_VIS_ATTACK = 0.1;
export const SCENE_VIS_RELEASE = 0.035;

export const SCENE_SILENCE_FLOOR = 0.012;
export const SCENE_SILENCE_SPAN = 0.09;

export const GRAVITY = 1200;

export const WALKER_TRAIL_LEN = 0;
