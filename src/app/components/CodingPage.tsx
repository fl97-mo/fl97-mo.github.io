import * as Accordion from "@radix-ui/react-accordion";
import { ChevronRight, ExternalLink, Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
  paragraphs: string[];
  highlights: string[];
  learned: string;
  improvements: string[];
  snippet: CodeSnippet;
  extraSnippets?: CodeSnippet[];
};

const ITEMS: CodingItem[] = [
  {
    id: "terminal-rpg",
    name: "TerminalRPG",
    desc: "Medieval terminal RPG with modular game systems and data-driven content.",
    status: "Work in Progress",
    type: "Game / Systems Programming / Terminal UX",
    stack: [
      "Python",
      "JSON",
      "Terminal UI",
      "ANSI styling",
      "wcwidth",
      "Modular game systems",
      "Windows input",
    ],
    repo: {
      href: "https://github.com/fl97-mo/TerminalRPG",
      label: "GITHUB_REPO",
    },
    tags: ["Python", "Game Systems", "Terminal UX", "JSON", "CLI"],
    paragraphs: [
      "TerminalRPG is a medieval text-based RPG built around a simple idea: a terminal can feel like a small game world, not just a command window. A small entry point creates the hero and hands control to the main game loop, while the rest of the project is split into focused systems.",
      "Locations, NPCs, quests, attacks, items, maps and dialogue are separated into modules or JSON data. That keeps the project easier to extend and makes it feel less like a pile of hardcoded menu text.",
      "The fun technical part is how quickly the game turns into an architecture problem. The hero model keeps stats, equipment, backpack, XP, level scaling and quest logs together, while helper functions handle terminal layout details such as ANSI color codes not counting as visible width.",
      "Combat is still experimental, but already has personality: some attacks use timing or typing challenges, then combine base damage, hero stats and a multiplier. It is Windows-focused right now because of msvcrt, which was a practical tradeoff for responsive keyboard input first.",
    ],
    highlights: [
      "Data-driven content for quests, maps, NPCs and dialogue.",
      "Terminal layout helpers for ANSI styling and visible-width alignment.",
      "Combat experiments with timing, typing and stat-based damage.",
    ],
    learned:
      "This project taught me how many small systems have to cooperate before a game starts to feel alive: content, stats, equipment, movement, combat, quests and time progression all pull on each other.",
    improvements: [
      "Cross-platform keyboard input instead of Windows-only msvcrt.",
      "More robust save/load handling.",
      "Clearer folder, setup and run instructions.",
      "Stronger validation around player input.",
    ],
    snippet: {
      language: "Python",
      code: `damage = (attack["base_damage"] + self.hero.attack) * multiplier
self.hero.stamina -= attack["stamina_cost"]`,
    },
  },
  {
    id: "python-beginner-guide",
    name: "Level-1-Python-Beginner-Guide",
    desc: "Beginner-friendly Python learning path with exercises, algorithms and mini projects.",
    status: "Public / Under Construction",
    type: "Self-created beginner course / Python fundamentals / learning resource",
    stack: [
      "Python",
      "Jupyter Notebook",
      "Teaching Material",
      "Exercises",
      "Algorithms",
      "Mini Projects",
    ],
    repo: {
      href: "https://github.com/fl97-mo/Level-1-Python-Beginner-Guide",
      label: "GITHUB_REPO",
    },
    tags: ["Python", "Teaching", "Algorithms", "Exercises", "Mini Projects"],
    paragraphs: [
      "I created this repository as a beginner-friendly Python guide. The goal was not to build one large application, but to structure Python fundamentals in a way that feels practical, followable and useful for people who are just starting out.",
      "The guide moves step by step through variables, input, type conversion, string operations, conditionals, loops, error handling, functions, data structures, modules, OOP basics, small projects and algorithms. I wanted it to feel like a learning path where each topic builds on the previous one.",
      "What I like about this project is that it shows another side of coding: explaining code clearly. Writing beginner material forces me to think about structure, naming, comments, examples and progression. It is not only about solving a problem, but about making the thought process understandable.",
      "Some parts are intentionally simple, like the shopping list project with a basic CLI menu, input handling, list operations, item removal and total cost calculation. Other parts introduce more algorithmic thinking, like Breadth-First Search, where the code explores possible paths through a graph and returns the shortest route.",
    ],
    highlights: [
      "Step-by-step Python fundamentals instead of disconnected scripts.",
      "Simple CLI mini projects that make basic concepts tangible.",
      "Algorithm examples that introduce structured problem solving.",
    ],
    learned:
      "This project helped me practice breaking programming concepts into small, readable pieces. The focus is clarity first: understand the problem, understand the code, then improve it.",
    improvements: [
      "More consistent naming across chapters.",
      "More exercises per topic.",
      "Improved notebooks.",
      "A clearer challenge, solution and explanation structure for each chapter.",
    ],
    snippet: {
      language: "Python",
      code: `while queue:
    path = queue.pop(0)
    node = path[-1]

    if node == end:
        return path`,
    },
  },
  {
    id: "astro97-vst",
    name: "Astro97-VST",
    desc: "Private retro terminal-inspired synthesizer built with C++ and JUCE.",
    status: "Private / Work in Progress",
    type: "Audio Plugin / Synthesizer / DSP UI Experiment",
    stack: [
      "C++17",
      "JUCE",
      "CMake",
      "VST3",
      "Standalone Plugin",
      "DSP",
      "APVTS",
      "MIDI",
      "Custom LookAndFeel",
    ],
    privateRepoLabel: "PRIVATE_REPO / WORK_IN_PROGRESS / C++ JUCE SYNTH",
    tags: ["C++", "JUCE", "DSP", "Audio Plugin", "UI"],
    paragraphs: [
      "Astro97-VST is my private work-in-progress audio plugin. I think of it as a retro terminal-inspired synthesizer rather than a clean, neutral plugin UI. It is built with C++17, CMake and JUCE, and targets both VST3 and Standalone builds.",
      "The core is structured around a custom audio processor, an internal synthesiser, multiple synth voices, APVTS parameters, chorus, reverb, gain, preset management and a text oscillator system. The CMake setup can also embed a terminal-style font from the project assets, which fits the visual identity.",
      "The most interesting idea is the text oscillator. Instead of only choosing classic wave shapes like sine, saw or square, the plugin includes an ASCII wave option and builds waveform tables from typed text. The processor stores oscillator text in the plugin state, sanitizes it, rebuilds the tables and syncs them into the synth voices.",
      "On the UI side, the project uses a custom JUCE LookAndFeel, terminal panels, knobs, choice controls, sliders, preset controls, seed randomization and a wave terminal preview. It is probably the project where my coding and design sides meet most directly: the sound matters, but the interface has its own small world too.",
    ],
    highlights: [
      "Text-based oscillator idea with generated waveform tables.",
      "APVTS-driven parameter state for synth, effects and macro controls.",
      "Custom terminal-style JUCE UI with preset and randomization controls.",
    ],
    learned:
      "This project is about real-time constraints and structure. The UI can be playful, but the audio engine needs clean state, predictable processing and careful parameter handling.",
    improvements: [
      "More smoothing around parameter changes.",
      "Better preset organization.",
      "More focused sound-design documentation.",
      "Longer testing in both Standalone and VST3 builds.",
    ],
    snippet: {
      language: "C++",
      code: `setParameterValue("oscAWave", static_cast<float>(chooseWave()));
setParameterValue("macroDark", macroDark);
setParameterValue("chorus", chorusMix);
setOscText(true, chooseStyleText(rng, terminalTexts));`,
    },
  },
  {
    id: "portfolio",
    name: "fl97-mo.github.io",
    desc: "Interactive portfolio playground with terminal visuals, audio feedback and accessibility states.",
    status: "Public Portfolio / Playground",
    type: "Portfolio Website / Interactive UI / Accessibility Experiment",
    stack: [
      "React 18",
      "Vite",
      "TypeScript",
      "Tailwind CSS 4",
      "Radix UI",
      "Lucide Icons",
      "Session Storage",
      "Web Audio / SFX",
      "Canvas 2D",
      "Web Audio API",
      "Procedural Rendering",
    ],
    repo: {
      href: "https://github.com/fl97-mo/fl97-mo.github.io",
      label: "GITHUB_REPO",
    },
    tags: [
      "React",
      "TypeScript",
      "Tailwind",
      "Accessibility",
      "Web Audio",
      "Canvas",
      "Astro EQ",
      "Astro Lab",
    ],
    paragraphs: [
      "This website is not just a portfolio page. I treat it more like a personal interface playground where retro terminal visuals, CRT effects, sound feedback, animated reveals, tabs, music tools, accessibility states and small experimental sections all live in the same React app.",
      "The app uses an internal active-tab system instead of routing: home, systems, coding, music, equalizer, astronaut lab, imprint and privacy are rendered from one main shell. That keeps the site feeling like one connected interface instead of separate pages.",
      "A lot of the work is UI state. The app remembers session-level choices like sound, effects, accessibility mode, CRT color, intro completion and EQ repeat settings. It also reacts to reduced-motion preferences and can write a global accessibility attribute so CSS can respond consistently.",
      "The part I am especially proud of is the EQ page, and specifically the Astro EQ / walker scene. It started as a local-audio equalizer, but it turned into a small real-time visual engine: browser audio upload, Web Audio analyser, frequency bands, smoothed envelopes, beat signals, spectrum rendering and a procedural astronaut walking through the track.",
      "That makes it more complex than it looks at first. The page has to manage audio graph lifecycle, temporary object URLs, queue state, repeat modes, canvas resizing, device pixel ratio, animation timing, reduced-motion and accessibility mode. On top of that, the visuals need smoothing so the character feels musical instead of nervous and random.",
      "The Astro Lab grew out of that work. After building the EQ astronaut as an audio-reactive character, I wanted a controlled version of the same visual language: pose presets, rig sliders, line toggles, energy controls and PNG export. The EQ became the live performance version; Astro Lab became the design bench for the character system.",
    ],
    highlights: [
      "Session-level UI state for sound, effects, accessibility and CRT color.",
      "Keyboard and focus details for overlays, accordions and dialogs.",
      "Astro EQ pipeline: local audio -> analyser -> frequency bands -> smoothed visual signals -> canvas scene.",
      "A procedural astronaut walker with beat response, gaze movement, seek interaction, stars and spectrum visuals.",
      "Astro Lab grew from the EQ astronaut into a reusable character/logo playground with export.",
    ],
    learned:
      "This site is where I connect coding, design, music and UX. The EQ taught me that playful UI can still be real engineering: timing, signal smoothing, cleanup, browser constraints and accessibility all matter if the effect should feel intentional instead of decorative.",
    improvements: [
      "Keep expanding project case studies.",
      "Tighten copy where sections still feel too placeholder-like.",
      "Document the EQ signal pipeline more clearly.",
      "Add more Astro Lab presets based on the EQ walker poses.",
      "Continue testing visual effects against accessibility mode.",
    ],
    snippet: {
      title: "AUDIO_ANALYSER_GRAPH",
      language: "TypeScript / Web Audio",
      code: `const analyser = ctx.createAnalyser();
analyser.fftSize = FFT_SIZE;
analyser.smoothingTimeConstant = ANALYSER_SMOOTH;

source.connect(gain);
gain.connect(analyser);
analyser.connect(ctx.destination);`,
    },
    extraSnippets: [
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
    ],
  },
];

function CodeSnippetBlock({ snippet }: { snippet: CodeSnippet }) {
  return (
    <div className="overflow-hidden rounded border border-primary/25 bg-black/20 crt-inset-sunken">
      <div className="flex items-center justify-between gap-3 border-b border-primary/20 bg-primary/5 px-3 py-2">
        <span className="text-xs tracking-widest text-primary">{snippet.title ?? "CODE_SNIPPET"}</span>
        <span className="shrink-0 rounded border border-primary/25 bg-background/60 px-2 py-1 text-xs tracking-widest text-muted-foreground">
          {snippet.language}
        </span>
      </div>

      <pre className="overflow-x-auto p-4 text-sm leading-6 text-primary/90">
        <code>{snippet.code.trim()}</code>
      </pre>
    </div>
  );
}

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

function CodingItemRow({ item, isOpen }: { item: CodingItem; isOpen: boolean }) {
  return (
    <Accordion.Item
      value={item.id}
      className="overflow-hidden rounded border border-primary/20 bg-background/50"
    >
      <Accordion.Header>
        <Accordion.Trigger
          data-accordion-trigger
          aria-label={`${isOpen ? "Collapse" : "Expand"} coding details for ${item.name}`}
          className="group flex w-full items-start justify-between gap-4 p-4 text-left outline-none"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <ChevronRight className="h-5 w-5 text-primary transition-transform group-data-[state=open]:rotate-90" />
              <span className="text-primary font-medium tracking-widest">{item.name}</span>
            </div>

            {!isOpen && (
              <div className="mt-2 pl-8 text-sm leading-6 text-muted-foreground">
                <span className="text-primary">{"--"}</span> {item.desc}
              </div>
            )}
          </div>

          <span className="text-xs tabular-nums text-muted-foreground">{isOpen ? "[-]" : "[+]"}</span>
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Content className="px-4 pb-4 data-[state=open]:animate-in data-[state=closed]:animate-out">
        <div className="space-y-5 border-t border-primary/15 pt-4 pl-8">
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

          <div className="space-y-3 text-sm leading-6 text-muted-foreground">
            {item.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-6">
                <span className="text-primary">{">"}</span> {paragraph}
              </p>
            ))}
          </div>

          {[item.snippet, ...(item.extraSnippets ?? [])].map((snippet) => (
            <CodeSnippetBlock
              key={`${snippet.title ?? snippet.language}-${snippet.code}`}
              snippet={snippet}
            />
          ))}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm tracking-widest text-primary">WHAT_STANDS_OUT</h3>
              <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                {item.highlights.map((highlight) => (
                  <li key={highlight}>
                    <span className="text-primary">{"--"}</span> {highlight}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm tracking-widest text-primary">NEXT_IMPROVEMENTS</h3>
              <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                {item.improvements.map((improvement) => (
                  <li key={improvement}>
                    <span className="text-primary">{"--"}</span> {improvement}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-primary/15 pt-4 text-sm leading-6 text-muted-foreground">
            <span className="text-primary">{"-- WHAT I LEARNED:"}</span> {item.learned}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-primary/15 pt-4">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-primary/25 bg-primary/5 px-2 py-1 text-xs tracking-widest text-muted-foreground"
              >
                {tag}
              </span>
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
      if (openedNow) {
        primeAudio();
        playSound("TERM", 0.2, 1.0, 400);
      }
    }
    setOpen(next);
  };

  return (
    <section className="mb-12 rounded border border-primary/30 bg-card/50 p-6 crt-glow-soft">
      <h2 className="mb-4 flex items-center gap-2 text-primary">
        <span className="text-muted-foreground">[</span>
        <TypewriterText text="CODING.DIR" speedMs={18} showCursor={false} />
        <span className="text-muted-foreground">]</span>
      </h2>

      <p className="mb-6 text-sm text-muted-foreground">
        <span className="text-primary">{">"}</span>{" "}
        Selected coding projects, short technical notes and small snippets from the actual systems.
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
