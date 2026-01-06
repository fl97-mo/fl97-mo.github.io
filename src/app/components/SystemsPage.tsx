import * as Accordion from "@radix-ui/react-accordion";
import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useUI } from "../store/ui";
import { playSound, primeAudio } from "../utils/sfx";
import { TypewriterText } from "./Typewriter";

type SystemsPost = {
  slug: string;
  title: string;
  summary: string[];
  typedIntro: string[];
  tags?: string[];
  sections: DidacticSection[];
};

type DidacticSection = {
  id: string;
  title: string;
  text?: string;
  render?: () => ReactNode;
};

function TechTags({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2 pl-3 sm:pl-8">
      {tags.map((tag) => (
        <span
          key={tag}
          className="
            text-xs px-2 py-1
            border border-primary/30
            bg-primary/10
            text-primary
            rounded tracking-wide
          "
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function DidacticSections({ sections }: { sections: DidacticSection[] }) {
  const { soundEnabled } = useUI();

  const [openSections, setOpenSections] = useState<string[]>([]);
  const openRef = useRef<string[]>([]);

  useEffect(() => {
    openRef.current = openSections;
  }, [openSections]);

const handleChange = (next: string[]) => {
  if (soundEnabled) {
    const openedNow = next.some((id) => !openRef.current.includes(id));
    const closedNow = openRef.current.some((id) => !next.includes(id));

    if (openedNow) {
      primeAudio();
      playSound("TERM", 0.4, 1.0, 400);
    } else if (closedNow) {
      primeAudio();
      playSound("TERM", 0.28, 0.92, 0);
    }
  }

  setOpenSections(next);
};


  return (
    <Accordion.Root
      type="multiple"
      value={openSections}
      onValueChange={handleChange}
      className="space-y-3"
    >
      {sections.map((sec) => (
        <Accordion.Item
          key={sec.id}
          value={sec.id}
          className="border border-primary/20 rounded bg-background/40"
        >
          <Accordion.Header>
            <Accordion.Trigger className="group w-full px-3 sm:px-4 py-3 flex justify-between items-center text-left">
              <div className="flex items-center gap-3">
                <ChevronRight className="w-4 h-4 text-primary transition-transform group-data-[state=open]:rotate-90" />
                <span className="text-primary">{sec.title}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                [<span className="group-data-[state=open]:hidden">+</span>
                <span className="hidden group-data-[state=open]:inline">-</span>]
              </span>
            </Accordion.Trigger>
          </Accordion.Header>

          <Accordion.Content className="px-3 sm:px-4 pb-4">
            {sec.render ? (
              sec.render()
            ) : (
              <TypewriterText
                text={sec.text ?? ""}
                speedMs={8}
                className="text-muted-foreground text-sm"
              />
            )}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

const SYSTEMS_POSTS: SystemsPost[] = [
  // 1) ETL
  {
    slug: "manual-to-framework",
    title: "Shifting from spreadsheet data workflows into systems",
    tags: ["NOTE", "ETL-THINKING", "AUTOMATION"],
    summary: [
      "Observations from spreadsheet-heavy, manual workflows",
      "Why automating single steps often adds complexity",
      "Notes on layered thinking instead of step-by-step scripts",
      "Why structure matters more than tools",
    ],
    typedIntro: [
      "> These are personal notes on how messy, manual workflows tend to grow over time,",
      "> and how thinking in terms of systems can make them easier to reason about.",
      "> This is not a tutorial or a framework description,",
      "> but a written reflection based on practical observations.",
    ],
    sections: [
      {
        id: "s1",
        title: "1. Where this usually starts",
        text:
          "In many situations, work grows around whatever tools are already available. Queries are copied, spreadsheets grow, small fixes pile up, and the process slowly becomes harder to reason about.",
      },
      {
        id: "s2",
        title: "2. Why this slowly breaks down",
        text:
          "Logic ends up scattered across query tools, spreadsheet formulas, and personal knowledge. Small changes become expensive, failures are hard to trace, and results are difficult to reproduce.",
      },
      {
        id: "s3",
        title: "3. The obvious first reaction",
        text:
          "A common first reaction is to automate individual steps with scripts. While this reduces manual effort, it often introduces new complexity and hidden dependencies.",
      },
      {
        id: "s4",
        title: "4. A useful mental shift",
        text:
          "The key shift is to stop thinking in terms of steps and start thinking in terms of data states.",
      },
      {
        id: "s5",
        title: "5. Layered architecture as a thinking tool",
        text:
          "Layered architectures separate responsibilities and make failures local instead of systemic.",
      },
      {
        id: "s6",
        title: "6.  A simple ETL-style mental model",
        render: () => (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {[
              {
                title: "Extract",
                items: [
                  "DB / APIs / Files",
                  "Config-driven sources",
                  "Deterministic input state",
                ],
              },
              {
                title: "Transform",
                items: [
                  "Validation boundaries",
                  "Code-based processing",
                  "Explicit schemas",
                  "Logging & error isolation",
                ],
              },
              {
                title: "Load",
                items: ["Versioned outputs", "Power BI / CSV / Excel", "Reproducible reports"],
              },
            ].map((block) => (
              <div
                key={block.title}
                className="border border-primary/20 bg-background/40 rounded p-3 sm:p-4"
              >
                <div className="text-primary mb-2">
                  {"> "} {block.title}
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {block.items.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">--</span>
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "s7",
        title: "7. Manual habits vs structured thinking",
        render: () => (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="border border-primary/20 bg-background/40 rounded p-3 sm:p-4">
              <div className="text-primary mb-3">{"> "} Manual process</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Same report, different scripts",
                  "Logic in people, documentation decentralised",
                  "Manual steps, more errors.",
                  "No validations or logging",
                  "Hard to scale",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-primary">--</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-primary/20 bg-background/40 rounded p-3 sm:p-4">
              <div className="text-primary mb-3">{"> "} System framework</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Central entrypoint",
                  "Logic in structure",
                  "Reproducible outputs",
                  "Validation boundaries",
                  "Config-driven scaling",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-primary">++</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: "s8",
        title: "8. When patterns start repeating",
        text:
          "Once patterns repeat, they should be captured as utilities instead of copied logic.",
      },
      {
        id: "s9",
        title: "9. Open-ended thoughts",
        text:
          "With a stable mental model, systems can evolve without breaking the core design.",
      },
    ],
  },

  // 2) EQ
  {
    slug: "astro-walker-eq",
    title: "Audi visualization as an experience with ASTRO_EQ",
    tags: ["WEB_AUDIO", "CANVAS", "REAL_TIME"],
    summary: [
      "Audio features -> smoothed control signals -> astronaut motion",
      "Astronaut as a tiny procedural “rig”: constraints keep the silhouette consistent",
      "Timeline-walk: the astronaut moves with track progress (and reacts to direction changes)",
    ],
    typedIntro: [
      "> The project is mainly about a small astronaut scene:",
      "> stable signals -> constrained character motion -> a calm, readable vibe.",
    ],
    sections: [
      {
        id: "aw1",
        title: "1. The goal",
        text:
          "I didn’t want the usual “bars drive everything” approach, because that often looks cool for a few seconds and then becomes noise. The target here is a small character loop: the astronaut reacts to the music and lives within.",
      },
      {
        id: "aw2",
        title: "2. Audio input",
        text:
          "The audio chain stays simple: HTMLAudioElement -> MediaElementSource -> GainNode -> AnalyserNode. The analyser provides FFT snapshots each frame, but most of the “character” comes from what happens after: extracting a few stable features and smoothing them. Keeping the graph minimal makes the behavior easier to predict and tune.",
      },
      {
        id: "aw3",
        title: "3. From FFT to usable signals (columns + band energy)",
        text:
          "FFT data is compressed into two kinds of features: (1) spectrum columns for visual structure and ambience, and (2) a few band energies (bass/mids/air) that drive character behavior. The key is that these values are shaped and smoothed so they behave more like control knobs than raw measurements.",
      },
      {
        id: "aw4",
        title: "4. The astronaut is a small procedural rig",
        text:
          "The astronaut is drawn procedurally (head/visor/body/arms/legs/backpack) using simple geometry and strokes. The important part is not detail, but is consistency at small sizes. That’s why the rig has constraints (like min/max leg length and spacing rules): even when motion increases, the pose stays readable and doesn’t fold into impossible shapes.",
      },
      {
        id: "aw5",
        title: "5. Motion mapping (gait phase + controlled accents)",
        text:
          "A phase value advances over time and drives a gait cycle (stride + lift). Band signals then modulate the motion in a conservative way: bass/kick mostly adds bounce and weight, mids affect stride/speed, and air adds small shimmer details. The goal is that louder sections feel more energetic, but the astronaut never turns into a blob of random deformation.",
      },
      {
        id: "aw6",
        title: "6. Envelopes (attack/release) = “no snapping”",
        text:
          "Any value that affects motion gets an attack/release style envelope: rising a bit faster, falling a bit slower. This is what makes the astronaut feel like it has inertia. Without that, the pose changes would snap on every transient and you immediately lose the character.",
      },
      {
        id: "aw7",
        title: "7. Timeline walk (music progress -> world position)",
        text:
          "The astronaut’s horizontal position is tied to track progress (currentTime / duration). Even though it's simplet, it helps the scene feel grounded: the character is “walking through the track”.",
      },
      {
        id: "aw8",
        title: "8. Interaction: gaze that feels intentional",
        text:
          "Pointer input is mapped into a look yaw/pitch, shaped (non-linear) and clamped. When the astronaut is moving, backward-looking is restricted so it doesn’t break the body direction. Look activation blends in/out with its own smoothing, so it feels like attention shifting rather than a robot instantly snapping to the cursor.",
      },
      {
        id: "aw9",
        title: "9. Seek as physics (scrubbing influences pose)",
        text:
          "Seeking isn’t treated as a pure UI event. While scrubbing, a small spring-like vertical signal is simulated and then relaxed when released. From that, a normalized “hang” factor is derived and fed into the astronaut pose (tug + arm/torso feel). It’s subtle, but it makes interaction feel part of the world instead of an overlay.",
      },
      {
        id: "aw11",
        title: "11. Stars and ambience",
        text:
          "The background stars are anchored to spectrum columns and use gated pulses (plus a beat impulse) so they feel alive but not noisy.",
      },
      {
        id: "aw12",
        title: "12. Real-time looping",
        text:
          "Everything runs in one requestAnimationFrame loop with dt clamping, and expensive setup stays out of the hot path (precomputed ranges, cached buffers). It’s not glamorous, but it’s the difference between a scene that feels calm and one that falls apart on slower devices or after tab stutters.",
      },
    ],
  },


  // 3) astronaut lab
  {
    slug: "astronaut-logo-lab",
    title: "Astronaut Playground: a controlled lab for tiny character systems",
    tags: ["CANVAS", "PROCEDURAL", "PLAYGROUND", "ASSET_PIPELINE", "TS"],
    summary: [
      "A constrained sandbox to iterate on the astronaut ‘language’ (shape, line, glow, readability)",
      "Designed as a mini system: parameters -> deterministic output -> exportable assets",
      "Bridges the EQ walker and the site",
      "The point: build a reusable visual system, not a one-off drawing",
    ],
    typedIntro: [
      "> I started this as a small logo sketch tool,",
      "> If I invest in a mini character for the EQ,",
      "> Why not also use that character in other places.",
    ],
    sections: [
      {
        id: "al1",
        title: "1. Why a playground at all",
        text:
          "A static logo is a single output. A playground is a repeatable process. The EQ already proved that a minimal astronaut silhouette can carry identity. The lab exists so that identity can be explored safely: test variations, keep the character readable at small sizes, and avoid drifting into random styles.",
      },
      {
        id: "al2",
        title: "2. The core rule: constraints create consistency",
        text:
          "This tool is intentionally not a full editor. The lab uses a small set of parameters that matter. The constraints are the product: they prevent outputs that don’t belong to the system.",
      },
      {
        id: "al3",
        title: "3. Silhouette-first design",
        text:
          "The astronaut mark must survive tiny sizes and still read instantly. That means the silhouette has to stay clean: head shape, visor placement, backpack hint, and a limited number of interior lines. The lab is built to iterate on those fundamentals instead of chasing detail.",
      },
      {
        id: "al4",
        title: "4. Procedural mindset",
        text:
          "The main mental model is: pick parameters, generate a clean result, export it.",
      },
      {
        id: "al5",
        title: "5. Same universe, same rules",
        text:
          "The EQ walker isn’t just decoration, it’s a character with motion rules, clamped look, and ‘physical’ signal conditioning. The playground is the place where those visual rules can be tested in isolation: what line thickness works, how much glow is too much, how much visor detail survives compression, how far you can push proportions before the astronaut stops being readable.",
      },
    ],
  },
];

function SystemsPostItem({ post, isOpen }: { post: SystemsPost; isOpen: boolean }) {
  return (
    <Accordion.Item
      value={post.slug}
      id={`post-${post.slug}`}
      className="border border-primary/20 rounded bg-background/50"
    >
      <Accordion.Header>
        <Accordion.Trigger className="group w-full p-3 sm:p-4 text-left flex justify-between items-start gap-3">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 mt-0.5 text-primary transition-transform group-data-[state=open]:rotate-90" />
              <span className="text-primary font-medium">{post.title}</span>
            </div>

            {!isOpen && post.tags && <TechTags tags={post.tags} />}

            {!isOpen && (
              <div className="mt-3 space-y-1 text-sm text-muted-foreground pl-3 sm:pl-8">
                {post.summary.map((line, idx) => (
                  <div key={idx}>
                    <span className="text-primary">{"--"}</span> {line}
                  </div>
                ))}
              </div>
            )}
          </div>

          <span className="text-xs text-muted-foreground shrink-0">
            {isOpen ? "[-]" : "[+]"}
          </span>
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Content className="px-3 sm:px-4 pb-4">
        <div className="border-t border-primary/15 pt-4 pl-3 sm:pl-8 space-y-4">
          <TypewriterText
            as="pre"
            text={post.typedIntro.join("\n")}
            speedMs={10}
            className="text-muted-foreground text-sm whitespace-pre-wrap"
            showCursor
          />

          <DidacticSections sections={post.sections} />

          <div className="pt-4 border-t border-primary/15 space-y-1 text-sm text-muted-foreground">
            {post.summary.map((line, idx) => (
              <div key={idx}>
                <span className="text-primary">{"--"}</span> {line}
              </div>
            ))}
          </div>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
}

export function SystemsPage({
  initialOpenSlug,
  onConsumedInitialOpen,
}: {
  initialOpenSlug?: string | null;
  onConsumedInitialOpen?: () => void;
}) {
  const [open, setOpen] = useState<string[]>([]);
  const consumedRef = useRef(false);
  const { soundEnabled } = useUI();

  const openRef = useRef<string[]>([]);
  const suppressTermRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

const handlePostsChange = (next: string[]) => {
  if (!suppressTermRef.current && soundEnabled) {
    const openedNow = next.some((slug) => !openRef.current.includes(slug));
    const closedNow = openRef.current.some((slug) => !next.includes(slug));

    if (openedNow) {
      primeAudio();
      playSound("TERM", 0.4, 1.0, 400);
    } else if (closedNow) {
      primeAudio();
      playSound("TERM", 0.28, 0.92, 0);
    }
  }

  setOpen(next);
};

  const shouldScroll = useMemo(() => Boolean(initialOpenSlug), [initialOpenSlug]);

  useEffect(() => {
    if (!initialOpenSlug) return;
    if (consumedRef.current) return;

    consumedRef.current = true;
    suppressTermRef.current = true;

    setOpen((prev) =>
      prev.includes(initialOpenSlug) ? prev : [...prev, initialOpenSlug]
    );

    queueMicrotask(() => {
      suppressTermRef.current = false;
    });

    if (shouldScroll) {
      setTimeout(() => {
        const el = document.getElementById(`post-${initialOpenSlug}`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }

    onConsumedInitialOpen?.();
  }, [initialOpenSlug, onConsumedInitialOpen, shouldScroll]);

  return (
    <section className="mb-12 border border-primary/30 p-4 sm:p-6 bg-card/50 rounded shadow-[0_0_10px_rgba(0,255,65,0.3)]">
      <h2 className="text-primary mb-4 flex items-center gap-2">
        <span className="text-muted-foreground">[</span>
        <TypewriterText text="SYSTEMS.DIR" speedMs={18} showCursor={false} />
        <span className="text-muted-foreground">]</span>
      </h2>

      <p className="text-muted-foreground mb-6 text-sm">
        <span className="text-primary">{">"}</span>{" "}
        Explorative system design notes from personal projects—behavior, signals, and patterns, not final recommendations.
      </p>

      <Accordion.Root
        type="multiple"
        value={open}
        onValueChange={handlePostsChange}
        className="space-y-4"
      >
        {SYSTEMS_POSTS.map((post) => (
          <SystemsPostItem
            key={post.slug}
            post={post}
            isOpen={open.includes(post.slug)}
          />
        ))}
      </Accordion.Root>
    </section>
  );
};
