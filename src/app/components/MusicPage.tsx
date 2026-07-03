import * as Accordion from "@radix-ui/react-accordion";
import { ChevronRight, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { TypewriterText } from "./Typewriter";
import { useUI } from "../store/ui";
import { playSoundAsync } from "../utils/sfx";

type MusicItem = {
  id: string;
  name: string;
  desc: string;
  detail: string;
  tags?: string[];
  category?: string;
  year?: number;

  file?: string;
  publicFile?: string;
};

const ITEMS: MusicItem[] = [
  {
    id: "ufo",
    name: "NOMKEE - ENTER THE UFO",
    desc: "2018 - Track - Electro House / Spacey",
    category: "Track",
    year: 2018,
    tags: ["EDM", "Electro", "House", "Space"],
    file: "NOMKEE_-_Enter_the_UFO.mp3",
    publicFile: "NOMKEE - Enter the UFO.mp3",
    detail:
      "> INFO\n" +
      "-- One of my earliest tracks, and also one of the most popular.\n" +
      "-- The intro was sampled, then I stacked a distorted, aggressive bass.\n" +
      "-- High contrast: calm / spacey sections vs hard EDM drops.\n" +
      "-- Simple pluck synths keep the melody clean.\n",
  },
  {
    id: "iknow",
    name: "NOMKEE - I KNOW YOU BETTER",
    desc: "2020 - Track - Electro / Dark / Effects",
    category: "Track",
    year: 2020,
    tags: ["EDM", "Electro", "Dark", "FX"],
    file: "NOMKEE_-_I_know_you_better.wav",
    publicFile: "NOMKEE - I know you better.mp3",
    detail:
      "> INFO\n" +
      "-- Darker, still dance-driven.\n" +
      "-- Switches from melancholic tension into euphoric drops.\n" +
      "-- Heavy use of FX, directly inspired by a festival visit.\n" +
      "-- I wanted to push transitions and atmosphere harder.\n",
  },
  {
    id: "dontlook",
    name: "NOMKEE - DONT WANT TO LOOK AWAY",
    desc: "2020 - Intro - Clocks / Deep-House / Unfinished",
    category: "Intro",
    year: 2020,
    tags: ["Deep House", "Clocks", "Unfinished", "FX"],
    file: "NOMKEE_-_Dont_want_to_look_away.mp3",
    publicFile: "NOMKEE - Dont want to look away.mp3",
    detail:
      "> INFO\n" +
      "-- Short experiment, not a finished song.\n" +
      "-- I loved the transition + the FX chain.\n" +
      "-- The vibe fits the overall universe, so it belongs here.\n",
  },
  {
    id: "rayguns",
    name: "NOMKEE - RAYGUNS EVERYWHERE",
    desc: "2022 - Action music snippet - Cyberpunk / Hard / Unfinished",
    category: "Action music snippet",
    year: 2022,
    tags: ["Cyberpunk", "Hard", "Snippet", "Unfinished"],
    file: "Nomkee_-_Rayguns_everywhere.wav",
    publicFile: "Nomkee - Rayguns everywhere.wav",
    detail:
      "> INFO\n" +
      "-- Very short action snippet, pure experiment.\n" +
      "-- Was never meant for upload.\n" +
      "-- Rediscovered it in 2025 and thought: why not.\n",
  },
  {
    id: "astro97-part-1",
    name: "NOMKEE - BALLAD OF THE WANDERING ASTRO97 PART 1",
    desc: "2026 - Track - Melodic EDM / Space / Melancholic",
    category: "Track",
    year: 2026,
    tags: ["EDM", "Space", "Melancholic", "Series"],
    file: "Nomkee - Ballad of the wandering Astro97 Part 1.wav",
    detail:
      "> INFO\n" +
      "-- Part one of the Wandering Astro97 series.\n" +
      "-- Melodic EDM with a reflective, slightly lonely space mood.\n" +
      "-- Feels like the first launch: bright, emotional, but not fully safe.\n" +
      "-- Clean synth layers and melancholic chords carry the story forward.\n",
  },
  {
    id: "astro97-part-2",
    name: "NOMKEE - BALLAD OF THE WANDERING ASTRO97 PART 2",
    desc: "2026 - Track - Space EDM / Plucks / Melancholic",
    category: "Track",
    year: 2026,
    tags: ["EDM", "Space", "Plucks", "Melancholic", "Series"],
    file: "Nomkee - Ballad of the wandering Astro97 Part 2.wav",
    detail:
      "> INFO\n" +
      "-- The second chapter of the Astro97 idea.\n" +
      "-- More space-driven than part one, with plucks floating through the mix.\n" +
      "-- Keeps the melancholic mood, but opens it up with a wider atmosphere.\n" +
      "-- Feels more distant, like the signal is already deep in orbit.\n",
  },
  {
    id: "cheri",
    name: "NOMKEE - CHERI",
    desc: "2026 - Remix - Classic EDM / Euphoric / Dance",
    category: "Remix",
    year: 2026,
    tags: ["EDM", "Remix", "Euphoric", "Classic"],
    file: "Nomkee - Cheri.wav",
    detail:
      "> INFO\n" +
      "-- A euphoric EDM take inspired by Cherry Cherry Lady by Modern Talking.\n" +
      "-- Classic dance energy, pushed into a brighter modern direction.\n" +
      "-- Catchy, nostalgic, and intentionally a bit over the top.\n" +
      "-- Big melodic lift, clean drive, and a direct remix character.\n",
  },
  {
    id: "from-the-hood",
    name: "NOMKEE - FROM THE HOOD",
    desc: "2026 - Track - Classic EDM / Reversed Plucks / Stereo FX",
    category: "Track",
    year: 2026,
    tags: ["EDM", "Classic", "Plucks", "Stereo FX"],
    file: "Nomkee - From the Hood.wav",
    detail:
      "> INFO\n" +
      "-- Classic EDM foundation with reversed plucks and a lot of movement.\n" +
      "-- Uses left-to-right effects, ticking frequencies, and small ear-candy details.\n" +
      "-- Plays with stereo space instead of staying locked in the middle.\n" +
      "-- Rougher and more technical, but still built around a dance-driven pulse.\n",
  },
  {
    id: "hop",
    name: "NOMKEE - HOP",
    desc: "2026 - Remix - Lo-Fi Hip Hop / 90s Rap / Melancholic",
    category: "Remix",
    year: 2026,
    tags: ["Lo-Fi", "Hip Hop", "90s", "Melancholic", "Remix"],
    file: "Nomkee - Hop.wav",
    detail:
      "> INFO\n" +
      "-- A melancholic lo-fi hip hop remix with a 90s rap influence.\n" +
      "-- More laid-back than the EDM tracks, with dusty rhythm and a softer mood.\n" +
      "-- Built for a late-night atmosphere rather than a big drop.\n" +
      "-- Keeps the NOMKEE space feeling, but translates it into a slower beat.\n",
  },
  {
    id: "man-from-kepler",
    name: "NOMKEE - MAN FROM KEPLER 22-B",
    desc: "2026 - Sketch - Retrowave / Sci-Fi / Unfinished",
    category: "Sketch",
    year: 2026,
    tags: ["Retrowave", "Synthwave", "Space", "Unfinished"],
    file: "Nomkee - Man from Kepler 22-b.wav",
    detail:
      "> INFO\n" +
      "-- Retrowave-style sketch with a clear sci-fi direction.\n" +
      "-- Still unfinished, but the core atmosphere already works.\n" +
      "-- Feels like a transmission from a distant neon planet.\n" +
      "-- More mood-piece than final song, but too cool to leave hidden.\n",
  },
  {
    id: "ocarina-of-time",
    name: "NOMKEE - OCARINA OF TIME",
    desc: "2026 - Remix - Hardstyle / Game Theme / Loud",
    category: "Remix",
    year: 2026,
    tags: ["Hardstyle", "Game Remix", "Loud", "Remix"],
    file: "Nomkee - Ocarina of Time.wav",
    detail:
      "> INFO\n" +
      "-- A loud hardstyle remix inspired by Zelda: Ocarina of Time on N64.\n" +
      "-- Takes a nostalgic game melody and pushes it into a heavier club direction.\n" +
      "-- Harder kick energy, brighter lead pressure, and a more aggressive finish.\n" +
      "-- Childhood memory meets maximum volume.\n",
  },
  {
    id: "sonar",
    name: "NOMKEE - SONAR",
    desc: "2026 - Snippet - Interstellar FX / Waves / Frequencies",
    category: "Snippet",
    year: 2026,
    tags: ["Snippet", "Space", "Sound Design", "Frequencies"],
    file: "Nomkee - Sonar.wav",
    detail:
      "> INFO\n" +
      "-- Short snippet built around interstellar-style effects.\n" +
      "-- Uses waves, sonar-like pulses, and frequency movement as the main idea.\n" +
      "-- Less of a full track and more of a small sound-design signal.\n" +
      "-- Fits the space theme as a transmission between bigger songs.\n",
  },
  {
    id: "wandering-through-space",
    name: "NOMKEE - WANDERING THROUGH SPACE",
    desc: "2026 - Track - EDM / Lo-Fi Rap Elements / Melancholic",
    category: "Track",
    year: 2026,
    tags: ["EDM", "Lo-Fi", "Hip Hop", "90s", "Melancholic", "Space"],
    file: "Nomkee - Wandering through space.wav",
    detail:
      "> INFO\n" +
      "-- Harder to put into one genre, which is part of the charm.\n" +
      "-- Classic EDM structure mixed with melancholic lo-fi and 90s rap elements.\n" +
      "-- Feels like drifting through space while still carrying a grounded beat.\n" +
      "-- One of the more hybrid NOMKEE tracks: reflective, rhythmic, and cosmic.\n",
  },
];

const PUBLIC_BASE = import.meta.env.BASE_URL || "/";

function assetHref(base: string, file: string) {
  const raw = file.replace(/^\/+/, "");
  if (raw.includes("..")) throw new Error("Invalid file path.");

  const encoded = raw.split("/").map(encodeURIComponent).join("/");

  if (base.startsWith("/")) {
    const prefix = base.endsWith("/") ? base : `${base}/`;
    return `${prefix}${encoded}`;
  }

  return new URL(encoded, base).toString();
}

function downloadHref(file: string) {
  return assetHref(PUBLIC_BASE, file);
}

function MusicItemRow({
  item,
  isOpen,
}: {
  item: MusicItem;
  isOpen: boolean;
}) {
  const downloadFile = item.publicFile ?? item.file;

  return (
    <Accordion.Item
      value={item.id}
      className="border border-primary/20 rounded bg-background/50 overflow-hidden"
    >
      <Accordion.Header>
        <Accordion.Trigger className="group w-full p-4 text-left flex justify-between items-start outline-none">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <ChevronRight className="w-5 h-5 text-primary transition-transform group-data-[state=open]:rotate-90" />
              <span className="text-primary font-medium tracking-widest">{item.name}</span>
            </div>

            {!isOpen && (
              <div className="mt-2 pl-8 text-sm text-muted-foreground">
                <span className="text-primary">{"--"}</span> {item.desc}
              </div>
            )}
          </div>

          <span className="text-xs text-muted-foreground tabular-nums">{isOpen ? "[-]" : "[+]"}</span>
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Content className="px-4 pb-4 data-[state=open]:animate-in data-[state=closed]:animate-out">
        <div className="border-t border-primary/15 pt-4 pl-8 space-y-3">
          <TypewriterText
            as="pre"
            text={item.detail}
            speedMs={7}
            className="text-muted-foreground whitespace-pre-wrap text-sm leading-6"
          />

          {!!item.tags?.length && (
            <div className="flex flex-wrap gap-2 pt-1">
              {item.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 text-xs tracking-widest border border-primary/25 rounded bg-background/40 text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {downloadFile && (
            <div className="pt-3 border-t border-primary/15 flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground tracking-widest truncate">
                <span className="text-primary">{"-- DOWNLOAD:"}</span> {downloadFile}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={downloadHref(downloadFile)}
                  download={downloadFile}
                  className="px-4 py-2 border-2 border-primary/50 rounded bg-background/50 text-primary/80 hover:text-primary hover:border-primary crt-hover-glow-soft transition-all text-xs tracking-widest"
                  style={{
                    boxShadow:
                      "inset -2px -2px 0px var(--crt-inset-soft), inset 2px 2px 0px rgba(0,0,0,0.6)",
                  }}
                  onClick={() => {
                    void playSoundAsync("TERM", 0.18, 1.0, 420).catch(() => {});
                  }}
                >
                  DOWNLOAD
                </a>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-primary/15 text-sm text-muted-foreground">
            <span className="text-primary">{"--"}</span> {item.desc}
          </div>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
}

export function MusicPage({ onOpenEQ }: { onOpenEQ: () => void }) {
  const { soundEnabled } = useUI();

  const [open, setOpen] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const openRef = useRef<string[]>([]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const handleChange = (next: string[]) => {
    if (soundEnabled) {
      const openedNow = next.some((id) => !openRef.current.includes(id));
      const closedNow = openRef.current.some((id) => !next.includes(id));

      if (openedNow) {
        void playSoundAsync("TERM", 0.2, 1.0, 400).catch(() => {});
      } else if (closedNow) {
        void playSoundAsync("TERM", 0.18, 0.92, 0).catch(() => {});
      }
    }

    setOpen(next);
  };

  const openSet = useMemo(() => new Set(open), [open]);
  const activeTagSet = useMemo(() => new Set(activeTags), [activeTags]);

  const filteredItems = useMemo(() => {
    if (!activeTags.length) return ITEMS;
    return ITEMS.filter((item) => activeTags.every((tag) => item.tags?.includes(tag)));
  }, [activeTags]);

  const visibleFilterTags = useMemo(() => {
    const sourceItems = activeTags.length ? filteredItems : ITEMS;

    return Array.from(
      sourceItems.reduce((tags, item) => {
        item.tags?.forEach((tag) => tags.set(tag, (tags.get(tag) ?? 0) + 1));
        return tags;
      }, new Map<string, number>())
    ).sort((a, b) => {
      const aActive = activeTagSet.has(a[0]);
      const bActive = activeTagSet.has(b[0]);

      if (aActive !== bActive) return aActive ? -1 : 1;
      return b[1] - a[1] || a[0].localeCompare(b[0]);
    });
  }, [activeTagSet, activeTags.length, filteredItems]);

  const openEqualizer = () => {
    if (soundEnabled) void playSoundAsync("TERM", 0.18, 1.0, 420).catch(() => {});
    onOpenEQ();
  };

  const toggleTag = (tag: string) => {
    if (soundEnabled) void playSoundAsync("TERM", 0.14, 1.0, 320).catch(() => {});
    setOpen([]);
    setActiveTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    );
  };

  const clearFilters = () => {
    if (soundEnabled) void playSoundAsync("TERM", 0.14, 0.95, 160).catch(() => {});
    setOpen([]);
    setActiveTags([]);
  };

  return (
    <section className="mb-12 border border-primary/30 p-6 bg-card/50 rounded crt-glow-soft">
      <h2 className="text-primary mb-4 flex items-center gap-2">
        <span className="text-muted-foreground">[</span>
        <TypewriterText text="MUSIC.DIR" speedMs={18} showCursor={false} />
        <span className="text-muted-foreground">]</span>
      </h2>

      <p className="text-muted-foreground text-sm">
        <span className="text-primary">{">"}</span>{" "}
        I produce music under the alias: <span className="text-primary">NOMKEE</span>.
      </p>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-muted-foreground text-sm">
          <span className="text-primary">{">"}</span>{" "}
          The EQ now uses your local audio files. Open EQUALIZER.DIR and upload music there.
        </p>

        <button
          type="button"
          onClick={openEqualizer}
          className="inline-flex items-center justify-center gap-2 px-5 py-2 border-2 border-primary/50 rounded bg-background/50 text-primary hover:border-primary crt-hover-glow transition-all"
          style={{
            boxShadow:
              "inset -2px -2px 0px var(--crt-inset-button), inset 2px 2px 0px rgba(0,0,0,0.55)",
          }}
        >
          <Upload className="w-4 h-4" />
          <span>OPEN EQ UPLOAD</span>
        </button>
      </div>

      <div className="mb-6 border-y border-primary/15 py-4">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs tracking-widest text-muted-foreground">
            <span className="text-primary">{"-- FILTER TAGS:"}</span>{" "}
            {filteredItems.length}/{ITEMS.length} TRACKS
          </p>

          {!!activeTags.length && (
            <button
              type="button"
              onClick={clearFilters}
              className="self-start text-xs tracking-widest text-primary/70 hover:text-primary transition-colors"
            >
              [ CLEAR ]
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={clearFilters}
            aria-pressed={!activeTags.length}
            className={`px-3 py-1.5 rounded border text-xs tracking-widest transition-all ${
              !activeTags.length
                ? "border-primary bg-primary/15 text-primary crt-hover-glow-soft"
                : "border-primary/25 bg-background/40 text-muted-foreground hover:border-primary/60 hover:text-primary"
            }`}
          >
            ALL
          </button>

          {visibleFilterTags.map(([tag, count]) => {
            const active = activeTagSet.has(tag);

            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs tracking-widest transition-all ${
                  active
                    ? "border-primary bg-primary/15 text-primary crt-hover-glow-soft"
                    : "border-primary/25 bg-background/40 text-muted-foreground hover:border-primary/60 hover:text-primary"
                }`}
              >
                <span>{tag}</span>
                <span className="text-[10px] text-primary/60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Accordion.Root type="multiple" value={open} onValueChange={handleChange} className="space-y-4">
        {filteredItems.map((item) => (
          <MusicItemRow
            key={item.id}
            item={item}
            isOpen={openSet.has(item.id)}
          />
        ))}
      </Accordion.Root>

      {!filteredItems.length && (
        <div className="mt-4 rounded border border-primary/20 bg-background/40 p-4 text-sm text-muted-foreground">
          <span className="text-primary">{">"}</span>{" "}
          No track matches this tag combination. Clear one filter and scan again.
        </div>
      )}
    </section>
  );
}
