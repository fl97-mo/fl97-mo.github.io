import * as Accordion from "@radix-ui/react-accordion";
import { ChevronRight, ExternalLink, Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { TypewriterText } from "./Typewriter";
import { useUI } from "../store/ui";
import { handleAccordionArrowNavigation } from "../utils/accordionKeyboard";
import { playSound, primeAudio } from "../utils/sfx";

type CodeSnippet = {
  title?: string;
  language: string;
  code: string;
};

type RepoLink = {
  href: string;
  label: string;
};

type CodingSection = {
  id: string;
  title: string;
  text?: string;
  items?: string[];
  render?: () => ReactNode;
};

type CodingItem = {
  id: string;
  name: string;
  desc: string;
  status: string;
  type: string;
  stack: string[];
  repo?: RepoLink;
  privateRepoLabel?: string;
  tags: string[];
  summary: string[];
  typedIntro: string[];
  sections: CodingSection[];
};

function CodeSnippetBlock({ snippet }: { snippet: CodeSnippet }) {
  return (
    <div className="overflow-hidden rounded border border-primary/25 bg-black/20 crt-inset-sunken">
      <div className="flex items-center justify-between gap-3 border-b border-primary/20 bg-primary/5 px-3 py-2">
        <span className="text-xs tracking-widest text-primary">{snippet.title ?? "CODE_SNIPPET"}</span>
        <span className="shrink-0 rounded border border-primary/25 bg-background/60 px-2 py-1 text-xs tracking-widest text-muted-foreground">
          {snippet.language}
        </span>
      </div>

      <pre className="overflow-x-auto p-3 sm:p-4 text-sm leading-6 text-primary/90">
        <code>{snippet.code.trim()}</code>
      </pre>
    </div>
  );
}

function SnippetStack({ snippets }: { snippets: CodeSnippet[] }) {
  return (
    <div className="space-y-3">
      {snippets.map((snippet) => (
        <CodeSnippetBlock
          key={`${snippet.title ?? snippet.language}-${snippet.code}`}
          snippet={snippet}
        />
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="text-primary">--</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function TechTags({ tags }: { tags: string[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2 pl-3 sm:pl-8">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded border border-primary/30 bg-primary/10 px-2 py-1 text-xs tracking-wide text-primary"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

const ITEMS: CodingItem[] = [
  {
    id: "terminal-rpg",
    name: "TerminalRPG",
    desc: "A small medieval RPG with exploration, combat, inventory and quest data.",
    status: "Work in Progress",
    type: "Python game project",
    stack: ["Python", "JSON", "Game loop", "Inventory", "Quest data", "Keyboard input"],
    repo: {
      href: "https://github.com/fl97-mo/TerminalRPG",
      label: "OPEN_REPO",
    },
    tags: ["Python", "Game systems", "JSON", "RPG"],
    summary: [
      "Text-based RPG with locations, NPCs, battles, items and quests",
      "JSON data keeps content separate from the main game logic",
      "The main challenge is connecting many small systems without losing clarity",
    ],
    typedIntro: [
      "> A small Python RPG where structure matters more than graphics.",
      "> The project connects character stats, equipment, map data, quests and combat.",
    ],
    sections: [
      {
        id: "idea",
        title: "1. What it is",
        text:
          "TerminalRPG is a medieval text-based RPG. The player moves through locations, talks to NPCs, collects items, fights enemies and builds up a hero over time. It started simple, but it quickly became a project about keeping game logic readable.",
      },
      {
        id: "structure",
        title: "2. How it is structured",
        text:
          "A small entry point starts the game, creates the hero and hands control to the main loop. Content such as locations, attacks, items, maps, quests and dialogue is split into modules or JSON data where that makes sense. That keeps the project easier to extend than one long file full of menu text.",
      },
      {
        id: "details",
        title: "3. Details I like",
        items: [
          "The hero keeps stats, equipment, backpack, XP, level progress and quest state together.",
          "Inventory and equipment changes recalculate values such as attack and max health.",
          "Combat experiments with timing and typing challenges instead of only static damage numbers.",
        ],
      },
      {
        id: "snippet",
        title: "4. Small snippet",
        render: () => (
          <SnippetStack
            snippets={[
              {
                title: "COMBAT_DAMAGE",
                language: "Python",
                code: `damage = (attack["base_damage"] + self.hero.attack) * multiplier
self.hero.stamina -= attack["stamina_cost"]`,
              },
            ]}
          />
        ),
      },
      {
        id: "learned",
        title: "5. What I learned",
        text:
          "This project taught me how quickly a small game becomes a structure problem. Stats, items, quests, movement and combat all affect each other, so naming and clear boundaries matter a lot.",
      },
      {
        id: "next",
        title: "6. Next improvements",
        items: [
          "Cleaner input handling across platforms.",
          "More robust save and load behavior.",
          "Clearer setup and run instructions.",
          "More validation around player input.",
        ],
      },
    ],
  },
  {
    id: "python-beginner-guide",
    name: "Level-1-Python-Beginner-Guide",
    desc: "A beginner-friendly Python learning path with exercises and mini projects.",
    status: "Public / Under Construction",
    type: "Learning resource",
    stack: ["Python", "Jupyter Notebook", "Exercises", "Algorithms", "Mini projects"],
    repo: {
      href: "https://github.com/fl97-mo/Level-1-Python-Beginner-Guide",
      label: "OPEN_REPO",
    },
    tags: ["Python", "Teaching", "Algorithms", "Exercises"],
    summary: [
      "Python basics explained as a step-by-step path",
      "Includes exercises, small projects and algorithm examples",
      "Shows how I think about explaining code, not only writing it",
    ],
    typedIntro: [
      "> This repository is about making beginner topics easier to follow.",
      "> The focus is simple examples, clear order and readable explanations.",
    ],
    sections: [
      {
        id: "goal",
        title: "1. The goal",
        text:
          "I created this repository as a beginner-friendly Python guide. It is not one large application. It is a learning path that moves through the basics in a practical order.",
      },
      {
        id: "topics",
        title: "2. Topics inside",
        items: [
          "Variables, input, type conversion and strings.",
          "Conditions, loops, error handling and functions.",
          "Data structures, modules and OOP basics.",
          "Small projects and algorithm examples.",
        ],
      },
      {
        id: "why",
        title: "3. Why I like it",
        text:
          "Writing beginner material is a different kind of coding practice. It forces me to think about names, comments, examples and progression. The code has to work, but the thought process also has to be understandable.",
      },
      {
        id: "snippet",
        title: "4. Small snippet",
        render: () => (
          <SnippetStack
            snippets={[
              {
                title: "BREADTH_FIRST_SEARCH",
                language: "Python",
                code: `while queue:
    path = queue.pop(0)
    node = path[-1]

    if node == end:
        return path`,
              },
            ]}
          />
        ),
      },
      {
        id: "learned",
        title: "5. What I learned",
        text:
          "This helped me practice breaking concepts into small steps. The point is not to hide complexity behind clever syntax, but to make each step feel understandable before moving on.",
      },
      {
        id: "next",
        title: "6. Next improvements",
        items: [
          "More consistent naming across chapters.",
          "More exercises per topic.",
          "Improved notebooks.",
          "A clearer challenge, solution and explanation structure.",
        ],
      },
    ],
  },
  {
    id: "astro97-vst",
    name: "Astro97-VST",
    desc: "A private C++/JUCE audio plugin experiment with a custom synth idea.",
    status: "Private / Work in Progress",
    type: "Audio plugin / Synthesizer",
    stack: ["C++17", "JUCE", "CMake", "VST3", "DSP", "APVTS", "MIDI", "Plugin UI"],
    privateRepoLabel: "PRIVATE_REPO / WORK_IN_PROGRESS / C++ JUCE SYNTH",
    tags: ["C++", "JUCE", "DSP", "Audio plugin"],
    summary: [
      "Private synth plugin built with C++ and JUCE",
      "Uses APVTS parameters, voices, effects, presets and custom UI work",
      "The most interesting idea is turning text into oscillator material",
    ],
    typedIntro: [
      "> This is my private audio plugin experiment.",
      "> The important part is the sound engine, parameter state and the text oscillator idea.",
    ],
    sections: [
      {
        id: "overview",
        title: "1. What it is",
        text:
          "Astro97-VST is a private work-in-progress audio plugin built with C++17, CMake and JUCE. It targets VST3 and Standalone builds and combines synth voices, parameters, effects, presets and a custom visual direction.",
      },
      {
        id: "engine",
        title: "2. The sound side",
        text:
          "The core is built around an audio processor, an internal synthesiser, multiple voices, APVTS parameters, chorus, reverb, gain, preset handling and a text oscillator system. The audio part has to stay predictable, because real-time code does not forgive messy state.",
      },
      {
        id: "text-osc",
        title: "3. The text oscillator idea",
        text:
          "The most interesting part is the text oscillator. Instead of only choosing classic waves like sine, saw or square, the plugin can build oscillator tables from typed text. The processor stores that text, sanitizes it, rebuilds the tables and syncs them into the synth voices.",
      },
      {
        id: "snippet",
        title: "4. Small snippet",
        render: () => (
          <SnippetStack
            snippets={[
              {
                title: "STYLE_RANDOMIZE",
                language: "C++",
                code: `setParameterValue("oscAWave", static_cast<float>(chooseWave()));
setParameterValue("macroDark", macroDark);
setParameterValue("chorus", chorusMix);
setOscText(true, chooseStyleText(rng, styleTexts));`,
              },
            ]}
          />
        ),
      },
      {
        id: "learned",
        title: "5. What I learned",
        text:
          "This project is about structure under real-time constraints. The interface can be playful, but the audio engine needs clean state, smooth parameter changes and predictable processing.",
      },
      {
        id: "next",
        title: "6. Next improvements",
        items: [
          "Smoother parameter transitions.",
          "Better preset organization.",
          "More focused sound-design notes.",
          "Longer testing in Standalone and VST3 builds.",
        ],
      },
    ],
  },
  {
    id: "portfolio",
    name: "fl97-mo.github.io",
    desc: "My React portfolio with music tools, Astro EQ, Astro Lab and accessibility states.",
    status: "Public Portfolio / Playground",
    type: "React website / Interactive tools",
    stack: [
      "React",
      "Vite",
      "TypeScript",
      "Tailwind",
      "Radix UI",
      "Canvas 2D",
      "Web Audio",
      "Session storage",
      "Accessibility",
    ],
    repo: {
      href: "https://github.com/fl97-mo/fl97-mo.github.io",
      label: "OPEN_REPO",
    },
    tags: ["React", "TypeScript", "Canvas", "Web Audio", "Astro EQ", "Astro Lab"],
    summary: [
      "Personal website with sections for music, systems, coding and visual tools",
      "The EQ page is the part I am especially proud of",
      "Astro Lab grew out of the EQ astronaut and became a small design playground",
    ],
    typedIntro: [
      "> This website is where my coding, music and visual ideas meet.",
      "> The EQ page became much more than a player: it turned into a small real-time scene.",
    ],
    sections: [
      {
        id: "overview",
        title: "1. What the site does",
        text:
          "This website is my portfolio, but I also use it as a place to build small interactive ideas. It has sections for projects, system notes, coding examples, music, the equalizer and the Astro Lab.",
      },
      {
        id: "state",
        title: "2. UI state and accessibility",
        text:
          "A lot of the work is state handling: sound on/off, effects on/off, accessibility mode, color choice, intro state, EQ queue state and repeat mode. The site also reacts to reduced-motion preferences and can switch visual-heavy parts into calmer accessible states.",
      },
      {
        id: "eq",
        title: "3. Why I am proud of the EQ",
        text:
          "The EQ page started as a local-audio equalizer, but it became a small real-time visual engine. It reads audio in the browser, builds an analyser graph, turns frequency data into smoother control signals, renders spectrum columns and drives an astronaut scene from the music.",
      },
      {
        id: "eq-complexity",
        title: "4. Why it is more complex than it looks",
        items: [
          "It has to manage uploaded audio files, object URLs, queue state, repeat modes and cleanup.",
          "The Web Audio graph needs to be created lazily and reused safely.",
          "Canvas rendering has to handle resizing, device pixel ratio and animation timing.",
          "Raw FFT data is too nervous, so signals need shaping and smoothing before they drive motion.",
          "The visual effects need fallbacks for accessibility mode and reduced-motion users.",
        ],
      },
      {
        id: "astro-lab",
        title: "5. How Astro Lab came from it",
        text:
          "After building the EQ astronaut as a music-reactive character, I wanted a controlled place to shape that character. Astro Lab became that bench: pose presets, rig sliders, line toggles, energy controls and PNG export. The EQ is the live version; Astro Lab is where the character can be designed and reused.",
      },
      {
        id: "snippets",
        title: "6. Code snippets",
        render: () => (
          <SnippetStack
            snippets={[
              {
                title: "AUDIO_ANALYSER_GRAPH",
                language: "TypeScript / Web Audio",
                code: `const analyser = ctx.createAnalyser();
analyser.fftSize = FFT_SIZE;
analyser.smoothingTimeConstant = ANALYSER_SMOOTH;

source.connect(gain);
gain.connect(analyser);
analyser.connect(ctx.destination);`,
              },
              {
                title: "EQ_RENDER_LOOP",
                language: "TypeScript / Canvas",
                code: `drawSpectrum(g, spectrumEl.width, spectrumEl.height, analyser, tickList, deps);
drawWalkers(g, walkersEl.width, walkersEl.height, analyser, dt, now, deps);

rafRef.current = requestAnimationFrame(step);`,
              },
              {
                title: "ASTRO_LAB_EXPORT",
                language: "TypeScript / React",
                code: `drawEqAstronaut(ctx, canvas.width, canvas.height, params);

exportPNG(
  (g, w, h) => drawEqAstronaut(g, w, h, params),
  exportSize,
  transparentBG
);`,
              },
              {
                title: "MUSIC_FILTER_EXAMPLE",
                language: "TypeScript / React",
                code: `const filteredItems = useMemo(() => {
  if (!activeTags.length) return ITEMS;

  return ITEMS.filter((item) =>
    activeTags.every((tag) => item.tags?.includes(tag))
  );
}, [activeTags]);`,
              },
            ]}
          />
        ),
      },
      {
        id: "learned",
        title: "7. What I learned",
        text:
          "The EQ taught me that a playful idea still needs serious engineering. Timing, smoothing, cleanup, browser constraints and accessibility all matter if the result should feel intentional instead of decorative.",
      },
      {
        id: "next",
        title: "8. Next improvements",
        items: [
          "Document the EQ signal flow more clearly.",
          "Add more Astro Lab presets based on the walker poses.",
          "Keep testing visual effects against accessibility mode.",
          "Expand the coding page with more compact case-study sections.",
        ],
      },
    ],
  },
];

function RepoAction({ item }: { item: CodingItem }) {
  if (!item.repo) {
    return (
      <span className="inline-flex max-w-full items-center justify-center gap-2 rounded border border-primary/25 bg-background/40 px-3 py-2 text-center text-xs tracking-widest text-muted-foreground">
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="min-w-0 break-words">{item.privateRepoLabel ?? "PRIVATE_REPO"}</span>
      </span>
    );
  }

  return (
    <a
      href={item.repo.href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex max-w-full items-center justify-center gap-2 rounded border border-primary/40 bg-background/50 px-3 py-2 text-xs tracking-widest text-primary/80 transition-all hover:border-primary hover:text-primary crt-hover-glow-soft"
      aria-label={`Open repository for ${item.name}`}
    >
      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 break-words">{item.repo.label}</span>
    </a>
  );
}

function ProjectSections({ sections }: { sections: CodingSection[] }) {
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
      data-accordion-root
      type="multiple"
      value={openSections}
      onValueChange={handleChange}
      onKeyDownCapture={handleAccordionArrowNavigation}
      className="space-y-3"
    >
      {sections.map((section) => (
        <Accordion.Item
          key={section.id}
          value={section.id}
          className="rounded border border-primary/20 bg-background/40"
        >
          <Accordion.Header>
            <Accordion.Trigger
              data-accordion-trigger
              aria-label={`${openSections.includes(section.id) ? "Collapse" : "Expand"} section ${section.title}`}
              className="group flex w-full items-center justify-between gap-3 px-3 py-3 text-left sm:px-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ChevronRight className="h-4 w-4 shrink-0 text-primary transition-transform group-data-[state=open]:rotate-90" />
                <span className="text-primary">{section.title}</span>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                [<span className="group-data-[state=open]:hidden">+</span>
                <span className="hidden group-data-[state=open]:inline">-</span>]
              </span>
            </Accordion.Trigger>
          </Accordion.Header>

          <Accordion.Content className="px-3 pb-4 sm:px-4 data-[state=open]:animate-in data-[state=closed]:animate-out">
            {section.render ? (
              section.render()
            ) : section.items ? (
              <BulletList items={section.items} />
            ) : (
              <TypewriterText
                text={section.text ?? ""}
                speedMs={8}
                className="text-sm leading-6 text-muted-foreground"
              />
            )}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

function ProjectMeta({ item }: { item: CodingItem }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {item.stack.map((tech) => (
            <span
              key={tech}
              className="rounded border border-primary/25 bg-background/40 px-2 py-1 text-xs tracking-widest text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="grid gap-2 text-xs tracking-widest text-muted-foreground sm:grid-cols-2">
          <div>
            <span className="text-primary">{"-- STATUS:"}</span> {item.status}
          </div>
          <div>
            <span className="text-primary">{"-- TYPE:"}</span> {item.type}
          </div>
        </div>
      </div>

      <RepoAction item={item} />
    </div>
  );
}

function CodingItemRow({ item, isOpen }: { item: CodingItem; isOpen: boolean }) {
  return (
    <Accordion.Item
      value={item.id}
      className="rounded border border-primary/20 bg-background/50"
    >
      <Accordion.Header>
        <Accordion.Trigger
          data-accordion-trigger
          aria-label={`${isOpen ? "Collapse" : "Expand"} coding project ${item.name}`}
          className="group flex w-full items-start justify-between gap-3 p-3 text-left outline-none sm:p-4"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-primary transition-transform group-data-[state=open]:rotate-90" />
              <span className="text-primary font-medium">{item.name}</span>
            </div>

            {!isOpen && <TechTags tags={item.tags} />}

            {!isOpen && (
              <div className="mt-3 space-y-1 pl-3 text-sm leading-6 text-muted-foreground sm:pl-8">
                {item.summary.map((line) => (
                  <div key={line}>
                    <span className="text-primary">{"--"}</span> {line}
                  </div>
                ))}
              </div>
            )}
          </div>

          <span className="shrink-0 text-xs text-muted-foreground">{isOpen ? "[-]" : "[+]"}</span>
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Content className="px-3 pb-4 sm:px-4">
        <div className="space-y-4 border-t border-primary/15 pt-4 pl-3 sm:pl-8">
          <ProjectMeta item={item} />

          <TypewriterText
            as="pre"
            text={item.typedIntro.join("\n")}
            speedMs={10}
            className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground"
            showCursor
          />

          <ProjectSections sections={item.sections} />

          <div className="space-y-1 border-t border-primary/15 pt-4 text-sm leading-6 text-muted-foreground">
            {item.summary.map((line) => (
              <div key={line}>
                <span className="text-primary">{"--"}</span> {line}
              </div>
            ))}
          </div>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
}

export function CodingPage() {
  const { soundEnabled } = useUI();

  const [open, setOpen] = useState<string[]>([]);
  const openRef = useRef<string[]>([]);
  const openSet = useMemo(() => new Set(open), [open]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

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

    setOpen(next);
  };

  return (
    <section className="mb-12 rounded border border-primary/30 bg-card/50 p-4 sm:p-6 crt-glow-soft">
      <h2 className="mb-4 flex items-center gap-2 text-primary">
        <span className="text-muted-foreground">[</span>
        <TypewriterText text="CODING.DIR" speedMs={18} showCursor={false} />
        <span className="text-muted-foreground">]</span>
      </h2>

      <p className="mb-6 text-sm text-muted-foreground">
        <span className="text-primary">{">"}</span>{" "}
        Selected projects with short notes, links and a few concrete code examples.
      </p>

      <Accordion.Root
        data-accordion-root
        type="multiple"
        value={open}
        onValueChange={handleChange}
        onKeyDownCapture={handleAccordionArrowNavigation}
        className="space-y-4"
      >
        {ITEMS.map((item) => (
          <CodingItemRow key={item.id} item={item} isOpen={openSet.has(item.id)} />
        ))}
      </Accordion.Root>
    </section>
  );
}
