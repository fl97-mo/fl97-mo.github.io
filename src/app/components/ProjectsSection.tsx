import { useEffect } from "react";
import { useUI } from "../store/ui";
import {
  primeAudio,
  startHoverNoise,
  stopHoverNoise,
  playSound,
} from "../utils/sfx";

type ProjectsSectionProps = {
  onOpenSystems?: (slug: string) => void;
};

export function ProjectsSection({ onOpenSystems }: ProjectsSectionProps) {
  const { soundEnabled } = useUI();

  useEffect(() => {
    return () => {
      stopHoverNoise();
    };
  }, []);


  const projects = [
    {
      name: "ETL_SETUP.EXE",
      description:
        "How I shifted from manual spreadsheet-heavy workflows to structured, config-driven pipelines.",
      tech: ["ETL", "DATA", "Automation"],
      status: "ACTIVE",
      systemsSlug: "manual-to-framework",
    },
    {
      name: "ASTRO_WALKER.EQ",
      description:
        "A real-time EQ built like a small engine: FFT -> log-spaced bands -> smoothed envelopes + beat impulse -> a procedural astronaut walker scene. Focus: controllable signals, readable silhouette, stable timing (instrument-like, not jitter).",
      tech: ["Web Audio", "DSP", "Canvas", "TypeScript", "Real-time"],
      status: "ACTIVE",
      systemsSlug: "astro-walker-eq",
    },
    {
      name: "ASTRONAUT_LOGO_LAB.EXE",
      description:
        "A constrained astronaut playground: iterate on a clean mini character system (silhouette, visor, line/glow) with guardrails, then export consistent PNG assets. Built to extend the EQ astronaut into a reusable visual universe.",
      tech: ["Canvas", "Procedural", "Playground", "Asset Pipeline", "TypeScript"],
      status: "ACTIVE",
      systemsSlug: "astronaut-logo-lab",
    },
  ];

  return (
    <section className="mb-12 border border-primary/30 p-6 bg-card/50 rounded shadow-[0_0_10px_rgba(0,255,65,0.3)]">
      <h2 className="text-primary mb-4 flex items-center gap-2">
        <span className="text-muted-foreground">{"["}</span>
        PROJECTS.DIR
        <span className="text-muted-foreground">{"]"}</span>
      </h2>

      <div className="space-y-6">
        {projects.map((project, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              stopHoverNoise();

              if (soundEnabled) {
                primeAudio();
                playSound("TERM", 0.2, 1.0, 400);
              }

              onOpenSystems?.(project.systemsSlug);
            }}
            onMouseEnter={() => {
              if (!soundEnabled) return;
              primeAudio();
              startHoverNoise();
            }}
            onMouseLeave={stopHoverNoise}
            onFocus={() => {
              if (!soundEnabled) return;
              primeAudio();
              startHoverNoise();
            }}
            onBlur={stopHoverNoise}
            className="
              w-full text-left border border-primary/20 p-4 bg-background/50 rounded
              hover:border-primary/50 hover:shadow-[0_0_14px_rgba(0,255,65,0.35)]
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-primary/40
            "
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
              <h3 className="text-primary flex items-start gap-2 flex-wrap">
                <span>{">"}</span>

                <span className="underline underline-offset-4 decoration-primary/40 break-all">
                  {project.name}
                </span>

                <span className="text-primary/70">↗</span>
              </h3>

              <span className="text-xs w-fit px-2 py-1 border border-primary/30 rounded text-primary">
                {project.status}
              </span>
            </div>

            <p className="text-muted-foreground mb-3 pl-4 text-sm leading-relaxed">
              {project.description}
            </p>

            <div className="flex flex-wrap gap-2 pl-4">
              {project.tech.map((tech, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 bg-primary/10 border border-primary/20 rounded text-primary"
                >
                  {tech}
                </span>
              ))}
            </div>

            <div className="mt-3 pl-4 text-xs text-muted-foreground sm:hidden">
              <span className="text-primary">{"--"}</span> Tap to open SYSTEMS.DIR
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
