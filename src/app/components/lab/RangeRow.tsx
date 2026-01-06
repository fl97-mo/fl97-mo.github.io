import { clamp } from "./math";

export function RangeRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
  format,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const pct = clamp((value - min) / Math.max(1e-9, max - min), 0, 1) * 100;
  const valueStr = format ? format(value) : value.toFixed(2);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] text-muted-foreground tracking-widest truncate">
          {label}
        </div>
        <div className="text-[11px] text-primary/80 tabular-nums tracking-widest">
          {valueStr}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="neoRange w-full"
        style={{
          background: `linear-gradient(to right, rgba(0,255,65,0.65) 0%, rgba(0,255,65,0.65) ${pct}%, rgba(0,255,65,0.14) ${pct}%, rgba(0,255,65,0.14) 100%)`,
        }}
      />
    </div>
  );
}
