export function AboutSection() {
  return (
    <section className="mb-12 border border-primary/30 p-6 bg-card/50 rounded shadow-[0_0_10px_rgba(0,255,65,0.3)]">
      <h2 className="text-primary mb-4 flex items-center gap-2">
        <span className="text-muted-foreground">{'['}</span>
        ABOUT.TXT
        <span className="text-muted-foreground">{']'}</span>
      </h2>
      <div className="space-y-3 text-muted-foreground">
        <p>
          <span className="text-primary">{'>'}</span> I experiment with small software systems and like creating music.
        </p>
        <p>
          <span className="text-primary">{'>'}</span> Automations and tools that help with daily life.
        </p>
        <p>
          <span className="text-primary">{'>'}</span> I like creating electronic music.
        </p>
        <p>
          <span className="text-primary">{'>'}</span> LOCATION: GERMANY
        </p>
      </div>
    </section>
  );
}
