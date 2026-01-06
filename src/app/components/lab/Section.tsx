export function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-primary/15 rounded bg-background/30 p-3">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-xs text-muted-foreground tracking-widest">
          {title}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}
