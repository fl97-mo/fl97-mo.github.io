export function ToggleChip({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className={`px-3 py-2 rounded border transition-all text-xs tracking-widest ${
        value
          ? "border-primary bg-primary/15 text-primary crt-glow-chip"
          : "border-primary/20 bg-background/40 text-muted-foreground hover:border-primary/60 hover:text-primary"
      }`}
    >
      {value ? `> ${label}` : `-- ${label}`}
    </button>
  );
}
