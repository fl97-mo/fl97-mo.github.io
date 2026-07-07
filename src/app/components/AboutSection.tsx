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
          <span className="text-primary">{'>'}</span> I build software systems and automations.
        </p>
        <p>
          <span className="text-primary">{'>'}</span> I like tools that make everyday work feel lighter, clearer, or just more fun.
        </p>
        <p>
          <span className="text-primary">{'>'}</span> I also create electronic music and bring that sound-design brain into my interfaces.
        </p>
        <p>
          <span className="text-primary">{'>'}</span> CURRENT LOCATION: GERMANY
        </p>
        <p>
          <span className="text-primary">{'>'}</span> STATUS: building and learning
        </p>
      </div>
    </section>
  );
}
