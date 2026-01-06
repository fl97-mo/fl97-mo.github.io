import { clamp, lerp, smoothstep } from "./math";
import { mulberry32 } from "./random";
import type { RenderParams } from "./types";

export function drawEqAstronaut(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: RenderParams
) {
  const green = (a: number) =>
    `rgba(0,255,65,${clamp(a, 0, 1).toFixed(3)})`;

  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, w, h);

  if (!p.transparentBG) {
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    g.fillStyle = `rgba(0,0,0,${clamp(p.bgAlpha, 0, 1).toFixed(3)})`;
    g.fillRect(0, 0, w, h);
  }

  const base = Math.min(w, h);
  const px = base / 420;
  const s = px * p.rig.scale;

  const rnd = mulberry32(p.seed);
  const j = clamp(p.rig.jitter, 0, 0.35);

  const jx = (rnd() - 0.5) * s * 0.65 * j;
  const jy = (rnd() - 0.5) * s * 0.55 * j;

  const cxBase = w * 0.5 + jx + p.rig.offsetX * base * 0.35;
  const footYBase = h * 0.82 + jy + p.rig.offsetY * base * 0.35;

  const lineA = clamp(p.lineAlpha, 0, 1);
  const strokeA = clamp(lineA, 0.06, 1);

  const lw = Math.max(
    1,
    p.lineWidth * px * (0.85 + 0.55 * Math.sqrt(Math.max(0.1, p.rig.scale)))
  );

  let bodyYaw = clamp(p.bodyYaw, -0.95, 0.95);
  let lookYaw = clamp(p.lookYaw, -0.95, 0.95);
  let lookPitch = clamp(p.lookPitch, -0.55, 0.55);

  const sideT = smoothstep(0.18, 0.92, Math.abs(bodyYaw));
  const frontT = 1 - sideT;
  const face = sideT;

  const motion = clamp(p.motion, 0, 1);
  const c = clamp(p.crouch, 0, 1);
  const hang = clamp(p.hang, 0, 1);
  const pullDir = clamp(p.pullDir, -1, 1);

  const bassM = clamp(p.bass, 0, 1) * motion;
  const midsM = clamp(p.mids, 0, 1) * motion;
  const airM = clamp(p.air, 0, 1) * motion;
  const kickM = clamp(p.kick, 0, 1) * motion;

  const phase = p.phase;

  const amp = clamp(p.rig.motionAmp, 0, 1) * (0.25 + 0.75 * motion);

  const bounce =
    (kickM * 0.9 + bassM * 0.55) * amp * s * 1.9 +
    Math.sin(phase * 2.0) * (0.22 * s * amp + bassM * 0.32 * s * amp);

  const sway =
    Math.sin(phase * 0.65) * (0.32 * s * amp + midsM * 0.38 * s * amp);

  const shimmy =
    Math.sin(phase * 1.8 + Math.cos(phase * 0.7)) *
    (0.16 * s * amp + airM * 0.26 * s * amp);

  const headR = 12 * s * p.rig.head;
  const legLen = 22 * s * p.rig.leg;
  const bodyH = (26 - 6 * c) * s * p.rig.body;

  const crouchDrop = c * (2.15 * s);
  const footY = footYBase;
  const hipY = footY - legLen - bounce * 0.35 + crouchDrop;
  const torsoTopY = hipY - bodyH - bounce * 0.25;

  const tug = pullDir * hang * (0.95 * s);

  const headCX = cxBase + sway * 0.6 + shimmy * 0.25 + tug;
  const headCY =
    torsoTopY -
    headR * 0.35 -
    bounce * 0.15 +
    Math.sin(phase * 1.15) * (0.12 * s * amp + airM * 0.18 * s * amp);

  const headCXP = headCX + lookYaw * headR * 0.12;
  const headCYP = headCY + lookPitch * headR * 0.32;

  const margin = base * 0.06;
  const approxMinY = headCYP - headR - lw * 2;
  const approxMaxY = footY + lw * 2 + 0.35 * s;
  let dy = 0;
  if (approxMinY < margin) dy = margin - approxMinY;
  if (approxMaxY + dy > h - margin) dy -= approxMaxY + dy - (h - margin);

  g.save();
  g.translate(0, dy);

  if (p.lines.glow) {
    const haloA = clamp(strokeA * (0.05 + p.glow * 0.35), 0, 0.45);
    if (haloA > 0.001) {
      g.globalCompositeOperation = "lighter";
      g.strokeStyle = green(haloA);
      g.lineWidth = lw * 2.25;
      g.lineCap = "round";
      g.lineJoin = "round";

      if (p.lines.head) {
        g.beginPath();
        g.arc(headCXP, headCYP, headR, 0, Math.PI * 2);
        g.stroke();
      }

      const torsoCX = cxBase + sway * 0.35 + tug * 0.75;
      const shoulderY = lerp(torsoTopY, hipY, 0.42) - bounce * 0.12;
      const shoulderCenterX = torsoCX + bodyYaw * headR * 0.1;
      const shoulderSpread = (6.4 * s) * (1 - face * 0.55) * p.rig.shoulders;

      g.beginPath();
      g.moveTo(shoulderCenterX - shoulderSpread, shoulderY);
      g.lineTo(shoulderCenterX + shoulderSpread, shoulderY);
      g.stroke();

      g.globalCompositeOperation = "source-over";
    }
  }

  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  g.strokeStyle = green(strokeA);
  g.lineWidth = lw;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.miterLimit = 2;

  if (p.lines.head) {
    g.beginPath();
    g.arc(headCXP, headCYP, headR, 0, Math.PI * 2);
    g.stroke();
  }

  if (p.lines.glass && p.lines.head) {
    const glassA = clamp(
      strokeA *
        p.glass *
        (0.12 + airM * 0.22 + kickM * 0.14 + bassM * 0.12 + p.glow * 0.08),
      0,
      0.62
    );

    if (glassA > 0.001) {
      g.save();
      const inset = Math.max(1, Math.floor(0.85 * px));
      g.beginPath();
      g.arc(headCXP, headCYP, Math.max(1, headR - inset), 0, Math.PI * 2);
      g.clip();

      g.globalCompositeOperation = "lighter";

      const gx = headCXP - headR * 0.38 + lookYaw * headR * 0.12;
      const gy = headCYP - headR * 0.52 + lookPitch * headR * 0.1;
      const grad = g.createRadialGradient(
        gx,
        gy,
        headR * 0.12,
        headCXP,
        headCYP,
        headR * 1.18
      );

      grad.addColorStop(0, green(clamp(glassA * 1.7, 0, 0.45)));
      grad.addColorStop(0.35, green(clamp(glassA * 0.9, 0, 0.34)));
      grad.addColorStop(1, green(clamp(glassA * 0.16, 0, 0.12)));

      g.fillStyle = grad;
      g.fillRect(
        headCXP - headR * 1.25,
        headCYP - headR * 1.25,
        headR * 2.5,
        headR * 2.5
      );

      const streakA = clamp(glassA * (0.52 + p.glow * 0.35), 0, 0.22);
      if (streakA > 0.001) {
        g.strokeStyle = green(streakA);
        g.lineWidth = Math.max(1, lw * 0.7);
        g.beginPath();
        g.moveTo(headCXP - headR * 0.62, headCYP - headR * 0.18);
        g.lineTo(headCXP + headR * 0.42, headCYP + headR * 0.58);
        g.stroke();

        g.strokeStyle = green(clamp(streakA * 0.75, 0, 0.18));
        g.lineWidth = Math.max(1, lw * 0.58);
        g.beginPath();
        g.moveTo(headCXP - headR * 0.46, headCYP - headR * 0.58);
        g.lineTo(headCXP + headR * 0.18, headCYP + headR * 0.22);
        g.stroke();
      }

      g.restore();
      g.globalCompositeOperation = "source-over";
    }
  }

  const visorW = 12 * s * p.rig.visorW;
  const visorH = 7 * s * p.rig.visorH;

  const visorCX = headCXP + lookYaw * headR * 0.38;
  const visorCY = headCYP + lookPitch * headR * 0.18;

  const visorW2 = Math.max(1, visorW * (1 - face * 0.82));
  const visorH2 = Math.max(1, visorH * (1 - face * 0.1));

  if (p.lines.visor && p.lines.head) {
    g.strokeStyle = green(strokeA * 0.72);
    g.lineWidth = Math.max(1, lw * 0.92);
    g.strokeRect(
      visorCX - visorW2 * 0.5,
      visorCY - visorH2 * 0.5,
      visorW2,
      visorH2
    );

    if (face > 0.18) {
      g.save();
      g.globalCompositeOperation = "lighter";
      g.strokeStyle = green(clamp(strokeA * (0.22 + face * 0.35), 0, 0.9));
      g.lineWidth = Math.max(1, lw * 0.75);
      const edgeX = visorCX + (visorW2 * 0.5) * Math.sign(lookYaw || 1);
      g.beginPath();
      g.moveTo(edgeX, visorCY - visorH2 * 0.5);
      g.lineTo(edgeX, visorCY + visorH2 * 0.5);
      g.stroke();
      g.restore();
    }
  }

  if (p.lines.visorFill && p.lines.visor && p.lines.head) {
    const visorFillA = clamp(
      strokeA * p.visorFill * (0.06 + airM * 0.1 + kickM * 0.08 + bassM * 0.05),
      0,
      0.38
    );
    if (visorFillA > 0.001) {
      g.fillStyle = green(visorFillA);
      g.fillRect(
        visorCX - visorW2 * 0.5,
        visorCY - visorH2 * 0.5,
        visorW2,
        visorH2
      );
    }
  }

  const torsoCX = cxBase + sway * 0.35 + tug * 0.75;
  const shoulderY = lerp(torsoTopY, hipY, 0.42) - bounce * 0.12;

  const shoulderCenterX = torsoCX + bodyYaw * headR * 0.1;
  const shoulderSpread = (6.4 * s) * (1 - face * 0.55) * p.rig.shoulders;
  const shL = shoulderCenterX - shoulderSpread;
  const shR = shoulderCenterX + shoulderSpread;

  if (p.lines.arms) {
    const armLen = (18 + kickM * 2.5) * s * (1 - 0.2 * c) * p.rig.arm;
    const baseDown = Math.PI / 2 + lookPitch * 0.12 - hang * 0.6;
    const outward = 0.28 + midsM * 0.12;
    const liftAmp = (0.18 + airM * 0.14 + kickM * 0.2) * motion;

    let thetaL = baseDown + outward + Math.sin(phase + 0.9) * liftAmp;
    let thetaR =
      baseDown - outward + Math.sin(phase + 0.9 + Math.PI) * liftAmp;

    const minOut = 0.12;
    thetaL = clamp(thetaL, baseDown + minOut, baseDown + 0.85);
    thetaR = clamp(thetaR, baseDown - 0.85, baseDown - minOut);

    const rightNear = bodyYaw >= 0;
    const farA = lerp(1.0, 0.62, sideT);
    const aL = rightNear ? farA : 1.0;
    const aR = rightNear ? 1.0 : farA;

    g.strokeStyle = green(strokeA * aL);
    g.beginPath();
    g.moveTo(shL, shoulderY);
    g.lineTo(
      shL + Math.cos(thetaL) * armLen + shimmy * 0.18,
      shoulderY + Math.sin(thetaL) * armLen + Math.sin(phase * 1.6) * (0.12 * s)
    );
    g.stroke();

    g.strokeStyle = green(strokeA * aR);
    g.beginPath();
    g.moveTo(shR, shoulderY);
    g.lineTo(
      shR + Math.cos(thetaR) * armLen - shimmy * 0.18,
      shoulderY + Math.sin(thetaR) * armLen + Math.cos(phase * 1.6) * (0.12 * s)
    );
    g.stroke();

    g.strokeStyle = green(strokeA);
  }

  if (p.lines.legs) {
    const strideAmp = motion;
    const swingRaw = Math.sin(phase);
    const swingFwdRaw = -swingRaw * p.walkDir;
    const swing = swingFwdRaw * strideAmp;

    const hipSpread = (4.3 * s) * lerp(1.0, 0.42, sideT) * p.rig.hips;
    const hipL = torsoCX - hipSpread;
    const hipR = torsoCX + hipSpread;

    const stepSide = (11.6 + kickM * 4.2) * s * sideT;
    const stepFront = (5.8 + kickM * 2.2) * s * frontT;

    const stepA = swing * (stepSide + stepFront);
    const stepB = -swing * (stepSide + stepFront);

    const liftA = smoothstep(0, 1, clamp(Math.max(0, swingFwdRaw), 0, 1));
    const liftB = smoothstep(0, 1, clamp(Math.max(0, -swingFwdRaw), 0, 1));

    const liftPx =
      (7.2 + kickM * 5.0 + midsM * 2.0) *
      s *
      (0.45 + 0.55 * frontT) *
      strideAmp *
      (1 - 0.28 * c);

    const groundY = footY;

    const footXA = hipL + stepA + sway * 0.18;
    const footXB = hipR + stepB - sway * 0.18;

    const footYA = clamp(groundY - liftA * liftPx, -1e9, groundY + 0.25 * s);
    const footYB = clamp(groundY - liftB * liftPx, -1e9, groundY + 0.25 * s);

    const knee = (
      hipX: number,
      footX: number,
      footY_: number,
      sideSign: number,
      lift: number
    ) => {
      const mx = (hipX + footX) * 0.5;
      const my = (hipY + footY_) * 0.5;

      const dx = footX - hipX;
      const dy2 = footY_ - hipY;
      const len = Math.sqrt(dx * dx + dy2 * dy2) || 1;

      const px2 = (-dy2 / len) * sideSign;
      const py2 = (dx / len) * sideSign;

      const bend = (3.0 * s) * (0.22 + 0.78 * lift) * (0.55 + 0.45 * sideT);
      return { kx: mx + px2 * bend, ky: my + py2 * bend };
    };

    const bendBlend = smoothstep(0.25, 0.8, sideT);
    const forwardBend = -p.walkDir;

    const sideL = lerp(-1, forwardBend, bendBlend);
    const sideR = lerp(1, forwardBend, bendBlend);

    let legAA = strokeA;
    let legBA = strokeA;

    const farMulLeg = lerp(1.0, 0.78, sideT);
    const nearMix = smoothstep(-0.18, 0.18, bodyYaw);
    legAA *= lerp(1.0, farMulLeg, nearMix);
    legBA *= lerp(farMulLeg, 1.0, nearMix);

    const drawLeg = (
      hipX: number,
      fx: number,
      fy: number,
      sgn: number,
      lift: number,
      a: number
    ) => {
      const { kx, ky } = knee(hipX, fx, fy, sgn, lift);
      g.strokeStyle = green(a);
      g.beginPath();
      g.moveTo(hipX, hipY);
      g.lineTo(kx, ky);
      g.lineTo(fx, fy);
      g.stroke();
    };

    if (swingFwdRaw >= 0) {
      drawLeg(hipR, footXB, footYB, sideR, liftB, legBA);
      drawLeg(hipL, footXA, footYA, sideL, liftA, legAA);
    } else {
      drawLeg(hipL, footXA, footYA, sideL, liftA, legAA);
      drawLeg(hipR, footXB, footYB, sideR, liftB, legBA);
    }
  }

  if (p.lines.backpack) {
    const packW = 10 * s * p.rig.pack;
    const packH = 16 * s * p.rig.pack;
    const packY = lerp(torsoTopY, hipY, 0.25);

    g.strokeStyle = green(strokeA * 0.78);
    g.lineWidth = lw;
    g.strokeRect(torsoCX - packW * 0.5, packY, packW, packH);

    const pulse = 0.035 + bassM * 0.16 + airM * 0.08 + kickM * 0.2;
    g.fillStyle = green(clamp(strokeA * pulse, 0, 0.35));
    g.fillRect(torsoCX - packW * 0.5, packY, packW, packH);
  }

  if (p.lines.ground) {
    g.strokeStyle = green(clamp(strokeA * (0.18 + p.glow * 0.22), 0, 0.55));
    g.lineWidth = Math.max(1, lw * 0.78);
    g.beginPath();
    g.moveTo(cxBase - 0.45 * base, footY + 0.18 * s);
    g.lineTo(cxBase + 0.45 * base, footY + 0.18 * s);
    g.stroke();
  }

  g.restore();
}
