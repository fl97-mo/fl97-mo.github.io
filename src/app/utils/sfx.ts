type SfxName = "BUTTON" | "BTN_MECH" | "NOISE" | "STATIC" | "TERM" | "TYPING";

const FILES: Record<SfxName, string> = {
  BUTTON: "/BUTTON.wav",
  BTN_MECH: "/BTN_MECH.wav",
  NOISE: "/NOISE.wav",
  STATIC: "/STATIC.wav",
  TERM: "/TERM.wav",
  TYPING: "/TYPING.wav",
};


let ctx: AudioContext | null = null;
const buffers: Partial<Record<SfxName, AudioBuffer>> = {};
const lastPlay: Partial<Record<SfxName, number>> = {};

let hoverSource: AudioBufferSourceNode | null = null;
let hoverGain: GainNode | null = null;
let staticSource: AudioBufferSourceNode | null = null;
let staticGain: GainNode | null = null;

let typingSource: AudioBufferSourceNode | null = null;
let typingGain: GainNode | null = null;

let navPitch = 1.0;
let lastNavTime = 0;

const NAV_PITCH_STEP = 0.015;
const NAV_PITCH_MAX = 1.05;
const NAV_RESET_MS = 1000;

function getCtx() {
  if (!ctx) {
    ctx = new AudioContext({ latencyHint: "interactive" });
  }
  return ctx;
}

export async function primeAudio() {
  const audioCtx = getCtx();

  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  for (const key of Object.keys(FILES) as SfxName[]) {
    if (buffers[key]) continue;

    const res = await fetch(FILES[key]);
    const arr = await res.arrayBuffer();
    buffers[key] = await audioCtx.decodeAudioData(arr);
  }
}

export function playSound(
  name: SfxName,
  volume = 1,
  playbackRate = 1.0,
  attackMs = 0
) {
  const now = performance.now();
  if (lastPlay[name] && now - lastPlay[name]! < 70) return;
  lastPlay[name] = now;

  const buffer = buffers[name];
  if (!buffer) return;

  const audioCtx = getCtx();
  const src = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();

  src.buffer = buffer;
  src.playbackRate.value = playbackRate;

  const t0 = audioCtx.currentTime;
  const v = Math.max(0, volume);

  if (attackMs > 0) {
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(v, t0 + attackMs / 1000);
  } else {
    gain.gain.setValueAtTime(v, t0);
  }

  src.connect(gain).connect(audioCtx.destination);
  src.start();
}

export function playMechClick() {
  const now = performance.now();

  if (now - lastNavTime > NAV_RESET_MS) {
    navPitch = 1.0;
  }

  playSound("BTN_MECH", 0.4, navPitch);

  navPitch = Math.min(navPitch + NAV_PITCH_STEP, NAV_PITCH_MAX);
  lastNavTime = now;
}


export function startHoverNoise(volume = 0.9) {
  const buffer = buffers.NOISE;
  if (!buffer) return;
  if (hoverSource) return;

  const audioCtx = getCtx();
  const src = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();

  src.buffer = buffer;
  src.loop = true;
  gain.gain.value = volume;

  src.connect(gain).connect(audioCtx.destination);
  src.start();

  hoverSource = src;
  hoverGain = gain;
}

export function stopHoverNoise() {
  if (!hoverSource || !hoverGain) return;

  const audioCtx = getCtx();
  hoverGain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + 0.05
  );

  try {
    hoverSource.stop(audioCtx.currentTime + 0.06);
  } catch {}

  hoverSource.disconnect();
  hoverGain.disconnect();

  hoverSource = null;
  hoverGain = null;
}
function startLoop(
  name: SfxName,
  setRef: (src: AudioBufferSourceNode | null, gain: GainNode | null) => void,
  getRef: () => { src: AudioBufferSourceNode | null; gain: GainNode | null },
  volume: number
) {
  const { src } = getRef();
  if (src) return;

  const buffer = buffers[name];
  if (!buffer) return;

  const audioCtx = getCtx();
  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();

  source.buffer = buffer;
  source.loop = true;
  gain.gain.value = volume;

  source.connect(gain).connect(audioCtx.destination);
  source.start();

  setRef(source, gain);
}

function stopLoop(
  setRef: (src: AudioBufferSourceNode | null, gain: GainNode | null) => void,
  getRef: () => { src: AudioBufferSourceNode | null; gain: GainNode | null }
) {
  const { src, gain } = getRef();
  if (!src || !gain) return;

  const audioCtx = getCtx();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

  try {
    src.stop(audioCtx.currentTime + 0.09);
  } catch {}

  src.disconnect();
  gain.disconnect();
  setRef(null, null);


}

export function startStatic(volume = 0.15) {
  startLoop(
    "STATIC",
    (src, gain) => {
      staticSource = src;
      staticGain = gain;
    },
    () => ({ src: staticSource, gain: staticGain }),
    volume
  );
}

export function stopStatic() {
  stopLoop(
    (src, gain) => {
      staticSource = src;
      staticGain = gain;
    },
    () => ({ src: staticSource, gain: staticGain })
  );
}

export function startTypingLoop(volume = 0.6) {
  startLoop(
    "TYPING",
    (src, gain) => {
      typingSource = src;
      typingGain = gain;
    },
    () => ({ src: typingSource, gain: typingGain }),
    volume
  );
}

export function stopTypingLoop() {
  stopLoop(
    (src, gain) => {
      typingSource = src;
      typingGain = gain;
    },
    () => ({ src: typingSource, gain: typingGain })
  );
}
