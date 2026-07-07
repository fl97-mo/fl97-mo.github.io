export function AboutSection() {
  return (
    <section className="mb-12 border border-primary/30 p-6 bg-card/50 rounded crt-glow-soft">
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
          <span className="text-primary">{'>'}</span> LOCATION: GERMANY
        </p>
        <p>
          <span className="text-primary">{'>'}</span> Enjoy your stay :)
        </p>
      </div>
    </section>
  );
}
