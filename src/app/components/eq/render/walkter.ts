import {
  LOOK_MAX_PITCH,
  LOOK_MAX_YAW,
  WALK_IDLE_ALPHA,
  WALK_IDLE_BOB_PX,
  WALK_IDLE_SWAY_PX,
} from "../constants";
import { clamp, lerp, smoothstep } from "../math";

export function drawWalker(
  g: CanvasRenderingContext2D,
  x: number,
  footY: number,
  scale: number,
  phase: number,
  bass: number,
  mids: number,
  air: number,
  alpha: number,
  kick: number,
  motion: number,
  tNow: number,
  bodyYaw: number,
  lookYaw: number,
  lookPitch: number,
  groundY: number,
  walkDir: number,
  hang: number,
  pullDir: number,
  playing: boolean
) {
  const dpr = window.devicePixelRatio || 1;
  const s = scale * dpr;

  const m = clamp(motion, 0, 1);
  const idle = 1 - m;

  const bodyY = clamp(bodyYaw, -LOOK_MAX_YAW, LOOK_MAX_YAW);
  const yaw = clamp(lookYaw, -LOOK_MAX_YAW, LOOK_MAX_YAW);
  const pitch = clamp(lookPitch, -LOOK_MAX_PITCH, LOOK_MAX_PITCH);

  const sideT = smoothstep(0.18, 0.92, Math.abs(bodyY));
  const frontT = 1 - sideT;
  const face = sideT;

  const bassM = bass * m;
  const midsM = mids * m;
  const airM = air * m;
  const kickM = kick * m;

  const idleBob =
    Math.sin(tNow * 1.22 + x * 0.003) * (WALK_IDLE_BOB_PX * dpr) * (0.35 + idle * 0.65);

  const idleSway =
    Math.sin(tNow * 0.85 + x * 0.0025) * (WALK_IDLE_SWAY_PX * dpr) * (0.35 + idle * 0.65);

  const legLen = 22 * s;
  const bodyH = 26 * s;
  const headR = 12 * s;

  const bounce = (kickM * 7.0 + bassM * 3.2) * dpr + idleBob;
  const sway = Math.sin(phase * 0.65) * (2.3 * dpr + midsM * 2.4 * dpr) + idleSway;
  const shimmy =
    Math.sin(phase * 1.8 + Math.cos(phase * 0.7)) * (1.2 * dpr + airM * 1.8 * dpr);

  const hipY =
    footY -
    legLen -
    bounce * 0.35 +
    Math.sin(phase * 2.0) * (2.0 * dpr + bassM * 3.2 * dpr);

  const torsoTopY = hipY - bodyH - bounce * 0.25;
  const tug = pullDir * clamp(hang, 0, 1) * (6.5 * dpr);

  const headCX = x + sway * 0.6 + shimmy * 0.25 + tug;

  const headCY =
    torsoTopY -
    headR * 0.35 -
    bounce * 0.15 +
    Math.sin(phase * 1.15) * (0.85 * dpr + airM * 1.25 * dpr);

  const headCXP = headCX + yaw * headR * 0.12;
  const headCYP = headCY + pitch * headR * 0.32;

  g.shadowBlur = 0;
  g.shadowOffsetX = 0;
  g.shadowOffsetY = 0;

  g.strokeStyle = `rgba(0,255,65,${alpha.toFixed(3)})`;
  g.lineWidth = Math.max(1, 1.35 * s);
  g.lineCap = "round";
  g.lineJoin = "round";
  g.miterLimit = 2;

  g.beginPath();
  g.arc(headCXP, headCYP, headR, 0, Math.PI * 2);
  g.stroke();

  const glassA = clamp(alpha * (0.12 + airM * 0.22 + kickM * 0.14 + bassM * 0.12), 0, 0.55);

  if (glassA > 0.001) {
    g.save();
    const inset = Math.max(1, Math.floor(0.9 * dpr));
    g.beginPath();
    g.arc(headCXP, headCYP, Math.max(1, headR - inset), 0, Math.PI * 2);
    g.clip();

    g.globalCompositeOperation = "lighter";

    const gx = headCXP - headR * 0.38 + yaw * headR * 0.12;
    const gy = headCYP - headR * 0.52 + pitch * headR * 0.1;
    const grad = g.createRadialGradient(gx, gy, headR * 0.12, headCXP, headCYP, headR * 1.18);

    grad.addColorStop(0, `rgba(0,255,65,${clamp(glassA * 1.7, 0, 0.45).toFixed(3)})`);
    grad.addColorStop(0.35, `rgba(0,255,65,${clamp(glassA * 0.9, 0, 0.34).toFixed(3)})`);
    grad.addColorStop(1, `rgba(0,255,65,${clamp(glassA * 0.16, 0, 0.12).toFixed(3)})`);
    g.fillStyle = grad;
    g.fillRect(headCX - headR * 1.25, headCY - headR * 1.25, headR * 2.5, headR * 2.5);

    const streakA = clamp(glassA * 0.62, 0, 0.18);
    if (streakA > 0.001) {
      g.strokeStyle = `rgba(0,255,65,${streakA.toFixed(3)})`;
      g.lineWidth = Math.max(1, Math.floor(0.85 * dpr));
      g.beginPath();
      g.moveTo(headCX - headR * 0.62, headCY - headR * 0.18);
      g.lineTo(headCX + headR * 0.42, headCY + headR * 0.58);
      g.stroke();

      g.strokeStyle = `rgba(0,255,65,${clamp(streakA * 0.75, 0, 0.16).toFixed(3)})`;
      g.lineWidth = Math.max(1, Math.floor(0.7 * dpr));
      g.beginPath();
      g.moveTo(headCX - headR * 0.46, headCY - headR * 0.58);
      g.lineTo(headCX + headR * 0.18, headCY + headR * 0.22);
      g.stroke();
    }

    g.restore();
    g.globalCompositeOperation = "source-over";
  }

  const visorW = 12 * s;
  const visorH = 7 * s;

  const visorCX = headCXP + yaw * headR * 0.38;
  const visorCY = headCYP + pitch * headR * 0.18;

  const visorW2 = Math.max(1 * dpr, visorW * (1 - face * 0.82));
  const visorH2 = visorH * (1 - face * 0.1);

  g.strokeStyle = `rgba(0,255,65,${(alpha * 0.72).toFixed(3)})`;
  g.strokeRect(visorCX - visorW2 * 0.5, visorCY - visorH2 * 0.5, visorW2, visorH2);

  if (face > 0.18) {
    g.save();
    g.globalCompositeOperation = "lighter";
    g.strokeStyle = `rgba(0,255,65,${clamp(alpha * (0.22 + face * 0.35), 0, 0.9).toFixed(3)})`;
    g.lineWidth = Math.max(1, Math.floor(0.9 * dpr));
    const edgeX = visorCX + (visorW2 * 0.5) * Math.sign(yaw || 1);
    g.beginPath();
    g.moveTo(edgeX, visorCY - visorH2 * 0.5);
    g.lineTo(edgeX, visorCY + visorH2 * 0.5);
    g.stroke();
    g.restore();
  }

  const visorFillA = clamp(alpha * (0.06 + airM * 0.1 + kickM * 0.08 + bassM * 0.05), 0, 0.3);
  if (visorFillA > 0.001) {
    g.fillStyle = `rgba(0,255,65,${visorFillA.toFixed(3)})`;
    g.fillRect(visorCX - visorW2 * 0.5, visorCY - visorH2 * 0.5, visorW2, visorH2);
  }

  const torsoCX = x + sway * 0.35 + tug * 0.75;

  const shoulderY = lerp(torsoTopY, hipY, 0.42) - bounce * 0.12;

  const shoulderCenterX = torsoCX + yaw * headR * 0.1;
  const shoulderSpread = 6.4 * s * (1 - face * 0.55);
  const shL = shoulderCenterX - shoulderSpread;
  const shR = shoulderCenterX + shoulderSpread;

  const armLen = (18 + kickM * 2.5) * s;

  const baseDown = Math.PI / 2 + pitch * 0.12 - hang * 0.6;

  const outward = 0.28 + midsM * 0.12;
  const liftAmp = (0.18 + airM * 0.14 + kickM * 0.2) * m;

  let thetaL = baseDown + outward + Math.sin(phase + 0.9) * liftAmp;
  let thetaR = baseDown - outward + Math.sin(phase + 0.9 + Math.PI) * liftAmp;

  const minOut = 0.12;
  thetaL = clamp(thetaL, baseDown + minOut, baseDown + 0.85);
  thetaR = clamp(thetaR, baseDown - 0.85, baseDown - minOut);

  const rightNear = bodyY >= 0;
  const farA = lerp(1.0, 0.62, sideT);
  const aR = rightNear ? 1.0 : farA;

  g.strokeStyle = `rgba(0,255,65,${alpha.toFixed(3)})`;
  g.beginPath();
  g.moveTo(shL, shoulderY);
  g.lineTo(
    shL + Math.cos(thetaL) * armLen + shimmy * 0.18,
    shoulderY + Math.sin(thetaL) * armLen + Math.sin(phase * 1.6) * (0.55 * dpr * m)
  );
  g.stroke();

  g.strokeStyle = `rgba(0,255,65,${(alpha * aR).toFixed(3)})`;
  g.beginPath();
  g.moveTo(shR, shoulderY);
  g.lineTo(
    shR + Math.cos(thetaR) * armLen - shimmy * 0.18,
    shoulderY + Math.sin(thetaR) * armLen + Math.cos(phase * 1.6) * (0.55 * dpr * m)
  );
  g.stroke();

  g.strokeStyle = `rgba(0,255,65,${alpha.toFixed(3)})`;

  const strideAmp = lerp(playing ? WALK_IDLE_ALPHA : 0, 1, m);
  const swingRaw = Math.sin(phase);
  const swingFwdRaw = -swingRaw * walkDir;
  const swing = swingFwdRaw * strideAmp;

  const hipSpread = 4.3 * s * lerp(1.0, 0.42, sideT);
  const hipL = torsoCX - hipSpread;
  const hipR = torsoCX + hipSpread;

  const stepSide = (11.6 + kickM * 4.2) * s * sideT;
  const stepFront = (5.8 + kickM * 2.2) * s * frontT;

  const stepA = swing * (stepSide + stepFront);
  const stepB = -swing * (stepSide + stepFront);

  const reachY0 = lerp(footY, groundY, hang);
  const hangDamp = 1 - hang * 0.9;

  const liftA = smoothstep(0, 1, clamp(Math.max(0, swingFwdRaw), 0, 1));
  const liftB = smoothstep(0, 1, clamp(Math.max(0, -swingFwdRaw), 0, 1));

  const liftPx =
    (7.2 + kickM * 5.0 + midsM * 2.0) *
    s *
    (0.45 + 0.55 * frontT) *
    hangDamp *
    strideAmp;

  let footXA = hipL + stepA + sway * 0.18;
  let footXB = hipR + stepB - sway * 0.18;

  let footYA = clamp(reachY0 - liftA * liftPx, -1e9, groundY + 2.2 * dpr);
  let footYB = clamp(reachY0 - liftB * liftPx, -1e9, groundY + 2.2 * dpr);

  const bendBlend = smoothstep(0.25, 0.8, sideT);
  const forwardBend = -walkDir;

  let maxLeg = legLen * lerp(1.08, 1.16, m);
  let minLeg = legLen * lerp(0.74, 0.62, m);

  const constrain = (hipX: number, fx: number, fy: number) => {
    let dx = fx - hipX;
    let dy = fy - hipY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    if (dist > maxLeg) {
      fx = hipX + nx * maxLeg;
      fy = hipY + ny * maxLeg;
    } else if (dist < minLeg) {
      fx = hipX + nx * minLeg;
      fy = hipY + ny * minLeg;
    }
    return { fx, fy };
  };

  {
    const r = constrain(hipL, footXA, footYA);
    footXA = r.fx;
    footYA = r.fy;
  }
  {
    const r = constrain(hipR, footXB, footYB);
    footXB = r.fx;
    footYB = r.fy;
  }

  const minSep = lerp(11.0, 6.0, sideT) * s;
  if (footXA > footXB - minSep) {
    const mid = (footXA + footXB) * 0.5;
    footXA = mid - minSep * 0.5;
    footXB = mid + minSep * 0.5;
  }

  {
    const r = constrain(hipL, footXA, footYA);
    footXA = r.fx;
    footYA = r.fy;
  }
  {
    const r = constrain(hipR, footXB, footYB);
    footXB = r.fx;
    footYB = r.fy;
  }

  const knee = (hipX: number, footX: number, footY2: number, sideSign: number, lift: number) => {
    const mx = (hipX + footX) * 0.5;
    const my = (hipY + footY2) * 0.5;

    const dx = footX - hipX;
    const dy = footY2 - hipY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    const px = (-dy / len) * sideSign;
    const py = (dx / len) * sideSign;

    const bend = 3.0 * s * (0.22 + 0.78 * lift) * (0.55 + 0.45 * sideT) * hangDamp;
    return { kx: mx + px * bend, ky: my + py * bend };
  };

  function drawLeg(hipX2: number, fx: number, fy: number, sgn: number, lift: number, a: number) {
    const { kx, ky } = knee(hipX2, fx, fy, sgn, lift);
    g.strokeStyle = `rgba(0,255,65,${clamp(a, 0, 1).toFixed(3)})`;
    g.beginPath();
    g.moveTo(hipX2, hipY);
    g.lineTo(kx, ky);
    g.lineTo(fx, fy);
    g.stroke();
  }

  const sideL = lerp(-1, forwardBend, bendBlend);
  const sideR = lerp(1, forwardBend, bendBlend);

  let legAA = alpha;
  let legBA = alpha;

  const farMulLeg = lerp(1.0, 0.78, sideT);
  const nearMix = smoothstep(-0.18, 0.18, bodyY);
  legAA *= lerp(1.0, farMulLeg, nearMix);
  legBA *= lerp(farMulLeg, 1.0, nearMix);

  if (swingFwdRaw >= 0) {
    drawLeg(hipR, footXB, footYB, sideR, liftB, legBA);
    drawLeg(hipL, footXA, footYA, sideL, liftA, legAA);
  } else {
    drawLeg(hipL, footXA, footYA, sideL, liftA, legAA);
    drawLeg(hipR, footXB, footYB, sideR, liftB, legBA);
  }

  const packW = 10 * s;
  const packH = 16 * s;
  const packY = lerp(torsoTopY, hipY, 0.25);
  g.strokeStyle = `rgba(0,255,65,${(alpha * 0.78).toFixed(3)})`;
  g.strokeRect(torsoCX - packW * 0.5, packY, packW, packH);

  const pulse = 0.035 + bassM * 0.16 + airM * 0.08 + kickM * 0.2;
  g.fillStyle = `rgba(0,255,65,${(alpha * pulse).toFixed(3)})`;
  g.fillRect(torsoCX - packW * 0.5, packY, packW, packH);
}
