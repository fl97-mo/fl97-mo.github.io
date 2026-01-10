import { useEffect, useMemo, useRef, useState } from "react";
import { TypewriterText } from "../Typewriter";
import { useUI } from "../../store/ui";
import { playSound, primeAudio } from "../../utils/sfx";
import {
  DEFAULT_RIG,
  type LineToggles,
  type PosePreset,
  type RenderParams,
  type RigParams,
} from "./types";
import { drawEqAstronaut } from "./drawEqAstronaut";
import { exportPNG } from "./exportPNG";
import { RangeRow } from "./RangeRow";
import { ToggleChip } from "./ToggleChip";
import { Section } from "./Section";

const LOCAL_STYLES = `
  .neoRange{
    -webkit-appearance:none;
    appearance:none;
    height:12px;
    border-radius:9999px;
    border:1px solid rgba(0,255,65,0.28);
    box-shadow: inset 0 0 0 2px rgba(0,0,0,0.35);
    outline:none;
  }
  .neoRange::-webkit-slider-thumb{
    -webkit-appearance:none;
    appearance:none;
    width:18px;
    height:18px;
    border-radius:9999px;
    background: rgba(210,255,220,0.92);
    border:2px solid rgba(0,255,65,0.65);
    box-shadow: 0 0 12px rgba(0,255,65,0.35);
    cursor:pointer;
  }
  .neoRange::-moz-range-thumb{
    width:18px;
    height:18px;
    border-radius:9999px;
    background: rgba(210,255,220,0.92);
    border:2px solid rgba(0,255,65,0.65);
    box-shadow: 0 0 12px rgba(0,255,65,0.35);
    cursor:pointer;
  }
  .neoRange::-moz-range-track{
    height:12px;
    border-radius:9999px;
    background: transparent;
  }

  @keyframes flickerLocal {
    0%   { opacity: 0.92; }
    15%  { opacity: 0.98; }
    30%  { opacity: 0.90; }
    45%  { opacity: 0.99; }
    60%  { opacity: 0.91; }
    75%  { opacity: 0.97; }
    100% { opacity: 0.93; }
  }
`;

export function AstronautLogoLab() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ui = useUI() as any;
  const effectsEnabled = !!ui.effectsEnabled;
  const soundEnabled = !!ui.soundEnabled;

  const [preset, setPreset] = useState<PosePreset>("threeQuarter");
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));

  const [bodyYaw, setBodyYaw] = useState(0.55);
  const [lookYaw, setLookYaw] = useState(0.35);
  const [lookPitch, setLookPitch] = useState(-0.08);

  const [motion, setMotion] = useState(0.65);
  const [phase, setPhase] = useState(1.2);
  const [walkDir, setWalkDir] = useState<1 | -1>(1);

  const [crouch, setCrouch] = useState(0.0);
  const [hang, setHang] = useState(0.0);
  const [pullDir, setPullDir] = useState(0.0);

  const [bass, setBass] = useState(0.35);
  const [mids, setMids] = useState(0.35);
  const [air, setAir] = useState(0.25);
  const [kick, setKick] = useState(0.22);

  const [lineAlpha, setLineAlpha] = useState(0.95);
  const [glow, setGlow] = useState(0.55);
  const [lineWidth, setLineWidth] = useState(1.35);

  const [glass, setGlass] = useState(0.68);
  const [visorFill, setVisorFill] = useState(0.24);

  const [transparentBG, setTransparentBG] = useState(true);
  const [bgAlpha, setBgAlpha] = useState(0.22);

  const [exportSize, setExportSize] = useState(1024);

  const [rig, setRig] = useState<RigParams>(DEFAULT_RIG);
  const setRigValue = <K extends keyof RigParams>(key: K, value: number) =>
    setRig((r) => ({ ...r, [key]: value }));

  const [lines, setLines] = useState<LineToggles>({
    glow: true,
    head: true,
    glass: true,
    visor: true,
    visorFill: true,
    arms: true,
    legs: true,
    backpack: true,
    ground: true,
  });

  const [crtScanlines, setCrtScanlines] = useState(true);
  const [crtVignette, setCrtVignette] = useState(true);
  const [crtFlicker, setCrtFlicker] = useState(true);
  const [crtInnerGlow, setCrtInnerGlow] = useState(true);

  const applyPreset = (id: PosePreset) => {
    setPreset(id);
    if (id === "front") {
      setBodyYaw(0.0);
      setLookYaw(0.0);
      setLookPitch(-0.06);
      return;
    }
    if (id === "threeQuarter") {
      setBodyYaw(0.55);
      setLookYaw(0.35);
      setLookPitch(-0.08);
      return;
    }
    setBodyYaw(0.92);
    setLookYaw(0.55);
    setLookPitch(-0.06);
  };

  const params = useMemo<RenderParams>(
    () => ({
      preset,
      seed,
      bodyYaw,
      lookYaw,
      lookPitch,
      motion,
      phase,
      walkDir,
      crouch,
      hang,
      pullDir,
      bass,
      mids,
      air,
      kick,
      lineAlpha,
      glow,
      lineWidth,
      glass,
      visorFill,
      bgAlpha,
      transparentBG,
      rig,
      lines,
    }),
    [
      preset,
      seed,
      bodyYaw,
      lookYaw,
      lookPitch,
      motion,
      phase,
      walkDir,
      crouch,
      hang,
      pullDir,
      bass,
      mids,
      air,
      kick,
      lineAlpha,
      glow,
      lineWidth,
      glass,
      visorFill,
      bgAlpha,
      transparentBG,
      rig,
      lines,
    ]
  );

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const ww = Math.max(1, Math.floor(rect.width * dpr));
    const hh = Math.max(1, Math.floor(rect.height * dpr));
    if (c.width !== ww) c.width = ww;
    if (c.height !== hh) c.height = hh;

    const gg = c.getContext("2d");
    if (!gg) return;

    drawEqAstronaut(gg, c.width, c.height, params);
  }, [params]);

  const quickReset = () => {
    setRig(DEFAULT_RIG);
    applyPreset(preset);
    setMotion(0.65);
    setPhase(1.2);
    setLineAlpha(0.95);
    setGlow(0.55);
    setLineWidth(1.35);
    setGlass(0.68);
    setVisorFill(0.24);
    setBass(0.35);
    setMids(0.35);
    setAir(0.25);
    setKick(0.22);
    setCrouch(0.0);
    setHang(0.0);
    setPullDir(0.0);
    setTransparentBG(true);
    setBgAlpha(0.22);
    setLines({
      glow: true,
      head: true,
      glass: true,
      visor: true,
      visorFill: true,
      arms: true,
      legs: true,
      backpack: true,
      ground: true,
    });
    setCrtScanlines(true);
    setCrtInnerGlow(true);
    setCrtFlicker(true);
    setCrtVignette(true);
  };

  return (
    <section className="mb-12 border border-primary/30 p-4 md:p-6 bg-card/50 rounded shadow-[0_0_10px_rgba(0,255,65,0.3)]">
      <style>{LOCAL_STYLES}</style>

      <h2 className="text-primary mb-3 flex items-center gap-2">
        <span className="text-muted-foreground">[</span>
        <TypewriterText
          text="ASTRO_LAB.DIR"
          speedMs={18}
          showCursor={false}
        />
        <span className="text-muted-foreground">]</span>
      </h2>

      <div className="text-muted-foreground mb-4 text-sm flex flex-wrap items-center gap-2">
        <span className="text-primary">{">"}</span>
        <span>Astrolab</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-4 items-start">
        <div className="border border-primary/20 rounded bg-background/40 p-3 md:p-4">
          <div className="relative border border-primary/15 rounded bg-black/95 p-2 overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-[360px] md:h-[420px] rounded"
            />

            {effectsEnabled && (
              <>
                {crtScanlines && (
                  <div className="pointer-events-none absolute inset-0 rounded bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.18),rgba(0,0,0,0.18)_1px,transparent_1px,transparent_3px)] opacity-80" />
                )}
                {crtInnerGlow && (
                  <div className="pointer-events-none absolute inset-0 rounded shadow-[inset_0_0_90px_rgba(0,255,65,0.08)]" />
                )}
                {crtFlicker && (
                  <div className="pointer-events-none absolute inset-0 rounded bg-primary/3 animate-[flickerLocal_1.8s_infinite]" />
                )}
                {crtVignette && (
                  <div className="pointer-events-none absolute inset-0 rounded bg-[radial-gradient(circle_at_50%_45%,rgba(0,255,65,0.06),rgba(0,0,0,0.55)_70%,rgba(0,0,0,0.78))] mix-blend-multiply" />
                )}
              </>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={async () => {
                if (soundEnabled) {
                  await primeAudio().catch(() => {});
                  playSound("TERM", 0.2, 1.0, 350);
                }
                exportPNG(
                  (gg, ww, hh) => drawEqAstronaut(gg, ww, hh, params),
                  exportSize,
                  transparentBG
                );
              }}
              className="px-3 py-2 border-2 border-primary/50 rounded bg-background/50 text-primary hover:border-primary hover:shadow-[0_0_10px_rgba(0,255,65,0.35)] transition-all text-xs tracking-widest"
              style={{
                boxShadow:
                  "inset -2px -2px 0px rgba(0,255,65,0.18), inset 2px 2px 0px rgba(0,0,0,0.6)",
              }}
            >
              EXPORT PNG
            </button>

            <button
              onClick={quickReset}
              className="px-3 py-2 border-2 border-primary/30 rounded bg-background/40 text-primary/80 hover:text-primary hover:border-primary/60 transition-all text-xs tracking-widest"
              style={{
                boxShadow:
                  "inset -2px -2px 0px rgba(0,255,65,0.12), inset 2px 2px 0px rgba(0,0,0,0.65)",
              }}
            >
              RESET
            </button>
          </div>

          <div className="mt-2 text-[10px] text-muted-foreground tracking-widest flex flex-wrap gap-x-3 gap-y-1">
            <div>
              -- PRESET: <span className="text-primary/80">{preset}</span>
            </div>
            <div>
              -- EXPORT: <span className="text-primary/80">{exportSize}px</span>
            </div>
            <div>
              -- BG:{" "}
              <span className="text-primary/80">
                {transparentBG ? "TRANSPARENT" : `BLACK(${bgAlpha.toFixed(2)})`}
              </span>
            </div>
          </div>
        </div>

        <aside className="border border-primary/20 rounded bg-background/40 p-3 md:p-4 xl:sticky xl:top-6 xl:max-h-[calc(100vh-5.5rem)] overflow-auto">
          <Section title="PRESET">
            <div className="grid grid-cols-3 gap-2">
              {(["front", "threeQuarter", "side"] as PosePreset[]).map((id) => {
                const active = preset === id;
                return (
                  <button
                    key={id}
                    onClick={() => applyPreset(id)}
                    className={`px-3 py-2 rounded border transition-all text-xs tracking-widest ${
                      active
                        ? "border-primary bg-primary/15 text-primary shadow-[0_0_10px_rgba(0,255,65,0.25)]"
                        : "border-primary/20 bg-background/40 text-muted-foreground hover:border-primary/60 hover:text-primary"
                    }`}
                  >
                    {active ? `> ${id}` : `-- ${id}`}
                  </button>
                );
              })}
            </div>
          </Section>

          <div className="mt-3">
            <Section
              title="QUICK CONTROLS"
              right={
                <button
                  onClick={() => {
                    setRig(DEFAULT_RIG);
                    setLineAlpha(0.95);
                    setGlow(0.55);
                    setLineWidth(1.35);
                  }}
                  className="px-2 py-1 rounded border border-primary/20 bg-background/40 text-[10px] tracking-widest text-muted-foreground hover:border-primary/60 hover:text-primary transition-all"
                >
                  -- QUICK RESET
                </button>
              }
            >
              <div className="space-y-3">
                <RangeRow
                  label="SCALE"
                  min={2.0}
                  max={10}
                  step={0.01}
                  value={rig.scale}
                  onChange={(v) => setRigValue("scale", v)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <RangeRow
                    label="OFFSET_X"
                    min={-1}
                    max={1}
                    step={0.01}
                    value={rig.offsetX}
                    onChange={(v) => setRigValue("offsetX", v)}
                  />
                  <RangeRow
                    label="OFFSET_Y"
                    min={-1}
                    max={1}
                    step={0.01}
                    value={rig.offsetY}
                    onChange={(v) => setRigValue("offsetY", v)}
                  />
                </div>

                <RangeRow
                  label="BODY_YAW"
                  min={-0.95}
                  max={0.95}
                  step={0.01}
                  value={bodyYaw}
                  onChange={setBodyYaw}
                />
                <RangeRow
                  label="LOOK_YAW"
                  min={-0.95}
                  max={0.95}
                  step={0.01}
                  value={lookYaw}
                  onChange={setLookYaw}
                />
                <RangeRow
                  label="LOOK_PITCH"
                  min={-0.55}
                  max={0.55}
                  step={0.01}
                  value={lookPitch}
                  onChange={setLookPitch}
                />

                <div className="grid grid-cols-2 gap-3">
                  <RangeRow
                    label="MOTION"
                    min={0}
                    max={1}
                    step={0.01}
                    value={motion}
                    onChange={setMotion}
                  />
                  <RangeRow
                    label="PHASE"
                    min={0}
                    max={6.283}
                    step={0.01}
                    value={phase}
                    onChange={setPhase}
                    format={(v) => v.toFixed(2)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <RangeRow
                    label="ALPHA"
                    min={0.2}
                    max={1}
                    step={0.01}
                    value={lineAlpha}
                    onChange={setLineAlpha}
                  />
                  <RangeRow
                    label="GLOW"
                    min={0}
                    max={1}
                    step={0.01}
                    value={glow}
                    onChange={setGlow}
                  />
                  <RangeRow
                    label="LINE_W"
                    min={0.7}
                    max={3}
                    step={0.01}
                    value={lineWidth}
                    onChange={setLineWidth}
                  />
                </div>

                <button
                  onClick={() => setWalkDir((d) => (d === 1 ? -1 : 1))}
                  className={`w-full px-3 py-2 rounded border transition-all text-xs tracking-widest ${
                    walkDir === 1
                      ? "border-primary/20 bg-background/40 text-muted-foreground hover:border-primary/60 hover:text-primary"
                      : "border-primary bg-primary/15 text-primary shadow-[0_0_10px_rgba(0,255,65,0.2)]"
                  }`}
                >
                  {walkDir === 1 ? "-- WALK: RIGHT" : "> WALK: LEFT"}
                </button>
              </div>
            </Section>
          </div>

          <div className="mt-3">
            <details className="border border-primary/15 rounded bg-background/30">
              <summary className="cursor-pointer select-none px-3 py-3 text-xs tracking-widest text-muted-foreground hover:text-primary">
                -- ADVANCED (STYLE / ENERGY / EXPORT)
              </summary>

              <div className="p-3 pt-0 space-y-3">
                <Section title="STYLE">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <RangeRow
                        label="HELM_GLASS"
                        min={0}
                        max={1}
                        step={0.01}
                        value={glass}
                        onChange={setGlass}
                      />
                      <RangeRow
                        label="VISOR_FILL"
                        min={0}
                        max={1}
                        step={0.01}
                        value={visorFill}
                        onChange={setVisorFill}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <RangeRow
                        label="CROUCH"
                        min={0}
                        max={1}
                        step={0.01}
                        value={crouch}
                        onChange={setCrouch}
                      />
                      <RangeRow
                        label="HANG"
                        min={0}
                        max={1}
                        step={0.01}
                        value={hang}
                        onChange={setHang}
                      />
                      <RangeRow
                        label="PULL"
                        min={-1}
                        max={1}
                        step={0.01}
                        value={pullDir}
                        onChange={setPullDir}
                      />
                    </div>
                  </div>
                </Section>

                <Section title="ENERGY">
                  <div className="grid grid-cols-2 gap-3">
                    <RangeRow
                      label="BASS"
                      min={0}
                      max={1}
                      step={0.01}
                      value={bass}
                      onChange={setBass}
                    />
                    <RangeRow
                      label="KICK"
                      min={0}
                      max={1}
                      step={0.01}
                      value={kick}
                      onChange={setKick}
                    />
                    <RangeRow
                      label="MIDS"
                      min={0}
                      max={1}
                      step={0.01}
                      value={mids}
                      onChange={setMids}
                    />
                    <RangeRow
                      label="AIR"
                      min={0}
                      max={1}
                      step={0.01}
                      value={air}
                      onChange={setAir}
                    />
                  </div>
                </Section>

                <Section title="LAYERS + CRT">
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <ToggleChip
                        label="GLOW"
                        value={lines.glow}
                        onChange={(v) => setLines((x) => ({ ...x, glow: v }))}
                      />
                      <ToggleChip
                        label="HEAD"
                        value={lines.head}
                        onChange={(v) => setLines((x) => ({ ...x, head: v }))}
                      />
                      <ToggleChip
                        label="GLASS"
                        value={lines.glass}
                        onChange={(v) => setLines((x) => ({ ...x, glass: v }))}
                      />
                      <ToggleChip
                        label="VISOR"
                        value={lines.visor}
                        onChange={(v) => setLines((x) => ({ ...x, visor: v }))}
                      />
                      <ToggleChip
                        label="V_FILL"
                        value={lines.visorFill}
                        onChange={(v) =>
                          setLines((x) => ({ ...x, visorFill: v }))
                        }
                      />
                      <ToggleChip
                        label="ARMS"
                        value={lines.arms}
                        onChange={(v) => setLines((x) => ({ ...x, arms: v }))}
                      />
                      <ToggleChip
                        label="LEGS"
                        value={lines.legs}
                        onChange={(v) => setLines((x) => ({ ...x, legs: v }))}
                      />
                      <ToggleChip
                        label="PACK"
                        value={lines.backpack}
                        onChange={(v) =>
                          setLines((x) => ({ ...x, backpack: v }))
                        }
                      />
                      <ToggleChip
                        label="GROUND"
                        value={lines.ground}
                        onChange={(v) => setLines((x) => ({ ...x, ground: v }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <ToggleChip
                        label="SCAN"
                        value={crtScanlines}
                        onChange={setCrtScanlines}
                      />
                      <ToggleChip
                        label="INNER"
                        value={crtInnerGlow}
                        onChange={setCrtInnerGlow}
                      />
                      <ToggleChip
                        label="FLICK"
                        value={crtFlicker}
                        onChange={setCrtFlicker}
                      />
                      <ToggleChip
                        label="VIGN"
                        value={crtVignette}
                        onChange={setCrtVignette}
                      />
                    </div>
                  </div>
                </Section>

                <Section title="EXPORT">
                  <div className="space-y-3">
                    <button
                      onClick={() => setTransparentBG((v) => !v)}
                      className={`w-full px-3 py-2 rounded border transition-all text-xs tracking-widest ${
                        transparentBG
                          ? "border-primary bg-primary/15 text-primary shadow-[0_0_10px_rgba(0,255,65,0.2)]"
                          : "border-primary/20 bg-background/40 text-muted-foreground hover:border-primary/60 hover:text-primary"
                      }`}
                    >
                      {transparentBG ? "> BG: TRANSPARENT" : "-- BG: BLACK"}
                    </button>

                    {!transparentBG && (
                      <RangeRow
                        label="BG_ALPHA"
                        min={0}
                        max={1}
                        step={0.01}
                        value={bgAlpha}
                        onChange={setBgAlpha}
                      />
                    )}

                    <RangeRow
                      label="EXPORT_PX"
                      min={256}
                      max={2048}
                      step={256}
                      value={exportSize}
                      onChange={setExportSize}
                      format={(v) => `${Math.round(v)}`}
                    />
                  </div>
                </Section>
              </div>
            </details>
          </div>
        </aside>
      </div>
    </section>
  );
}
