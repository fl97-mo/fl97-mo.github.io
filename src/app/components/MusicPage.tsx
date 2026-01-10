import * as Accordion from "@radix-ui/react-accordion";
import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { TypewriterText } from "./Typewriter";
import { useUI } from "../store/ui";
import { playSound, primeAudio } from "../utils/sfx";

type MusicItem = {
  id: string;
  name: string;
  desc: string;
  detail: string;
  tags?: string[];
  category?: string;
  year?: number;
  file?: string;
};

const ITEMS: MusicItem[] = [
  {
    id: "ufo",
    name: "NOMKEE - ENTER THE UFO",
    desc: "2018 · Track · Electro House / Spacey",
    category: "Track",
    year: 2018,
    tags: ["Electro", "House", "Spacey"],
    file: "NOMKEE_-_Enter_the_UFO.mp3",
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
    desc: "2020 · Track · Electro / Dark / Effects",
    category: "Track",
    year: 2020,
    tags: ["Electro", "Dark", "Effects"],
    file: "NOMKEE_-_I_know_you_better.wav",
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
    desc: "2020 · Intro · Clocks / Deep-House / Unfinished",
    category: "Intro",
    year: 2020,
    tags: ["Clocks", "Deep-House", "Unfinished"],
    file: "NOMKEE_-_Dont_want_to_look_away.mp3",
    detail:
      "> INFO\n" +
      "-- Short experiment, not a finished song.\n" +
      "-- I loved the transition + the FX chain.\n" +
      "-- The vibe fits the overall universe, so it belongs here.\n",
  },
  {
    id: "rayguns",
    name: "NOMKEE - RAYGUNS EVERYWHERE",
    desc: "2022 · Action music snippet · Cyberpunk / Hard / Unfinished",
    category: "Action music snippet",
    year: 2022,
    tags: ["Cyberpunk", "Hard", "Unfinished"],
    file: "Nomkee_-_Rayguns_everywhere.wav",
    detail:
      "> INFO\n" +
      "-- Very short action snippet, pure experiment.\n" +
      "-- Was never meant for upload.\n" +
      "-- Rediscovered it in 2025 and thought: why not.\n",
  },
];
const AUDIO_BASE = import.meta.env.DEV ? "/audio/" : "https://audio.fl97-mo.de/";

function streamHref(file: string) {
  const raw = file.replace(/^\/+/, "");
  if (raw.includes("..")) throw new Error("Invalid file path.");

  const encoded = raw.split("/").map(encodeURIComponent).join("/");
  return AUDIO_BASE.startsWith("/") ? `${AUDIO_BASE}${encoded}` : new URL(encoded, AUDIO_BASE).toString();
}



function splitArtistTitle(name: string) {
  const parts = name.split(" - ");
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
  }
  return { artist: undefined, title: name.trim() };
}

function MusicItemRow({
  item,
  isOpen,
  onPlay,
}: {
  item: MusicItem;
  isOpen: boolean;
  onPlay: () => void;
}) {
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
                  className="px-2 py-1 text-[10px] tracking-widest border border-primary/25 rounded bg-background/40 text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {item.file && (
            <div className="pt-3 border-t border-primary/15 flex items-center justify-between gap-3">
              <div className="text-[10px] text-muted-foreground tracking-widest truncate">
                <span className="text-primary">{"-- FILE:"}</span> {item.file}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    primeAudio().then(() => playSound("TERM", 0.18, 1.0, 420)).catch(() => {});
                    onPlay();
                  }}
                  className="px-4 py-2 border-2 border-primary/50 rounded bg-background/50 text-primary hover:border-primary hover:shadow-[0_0_10px_rgba(0,255,65,0.4)] transition-all text-xs tracking-widest"
                  style={{
                    boxShadow:
                      "inset -2px -2px 0px rgba(0,255,65,0.25), inset 2px 2px 0px rgba(0,0,0,0.55)",
                  }}
                >
                  PLAY
                </button>

                <a
                  href={streamHref(item.file)}
                  download
                  className="px-4 py-2 border-2 border-primary/50 rounded bg-background/50 text-primary/80 hover:text-primary hover:border-primary hover:shadow-[0_0_10px_rgba(0,255,65,0.35)] transition-all text-xs tracking-widest"
                  style={{
                    boxShadow:
                      "inset -2px -2px 0px rgba(0,255,65,0.18), inset 2px 2px 0px rgba(0,0,0,0.6)",
                  }}
                  onClick={() => {
                    primeAudio().then(() => playSound("TERM", 0.18, 1.0, 420)).catch(() => {});
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
  const { soundEnabled, setEqQueue, requestEqPlay } = useUI();

  const [open, setOpen] = useState<string[]>([]);
  const openRef = useRef<string[]>([]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const handleChange = (next: string[]) => {
    if (soundEnabled) {
      const openedNow = next.some((id) => !openRef.current.includes(id));
      if (openedNow) {
        primeAudio().then(() => playSound("TERM", 0.2, 1.0, 400)).catch(() => {});
      }
    }
    setOpen(next);
  };

  const openSet = useMemo(() => new Set(open), [open]);

  const eqTracks = useMemo(() => {
    return ITEMS.filter((i) => !!i.file).map((i) => {
      const { artist, title } = splitArtistTitle(i.name);
      const url = streamHref(i.file!);
      return {
        id: i.id,
        artist,
        title,
        year: i.year ? String(i.year) : undefined,
        streamUrl: url,
        downloadUrl: url,
      };
    });
  }, []);

  const doPlay = (id: string) => {
    setEqQueue(eqTracks);
    requestEqPlay(id);
    onOpenEQ();
  };

  return (
    <section className="mb-12 border border-primary/30 p-6 bg-card/50 rounded shadow-[0_0_10px_rgba(0,255,65,0.3)]">
      <h2 className="text-primary mb-4 flex items-center gap-2">
        <span className="text-muted-foreground">[</span>
        <TypewriterText text="MUSIC.DIR" speedMs={18} showCursor={false} />
        <span className="text-muted-foreground">]</span>
      </h2>

      <p className="text-muted-foreground text-sm">
        <span className="text-primary">{">"}</span>{" "}
        I produce music under the alias: <span className="text-primary">NOMKEE</span>.
      </p>

      <p className="text-muted-foreground mb-6 text-sm">
        <span className="text-primary">{">"}</span>{" "}
        Tracks are streamed. Press PLAY to open the song in EQUALIZER.DIR.
      </p>

      <Accordion.Root type="multiple" value={open} onValueChange={handleChange} className="space-y-4">
        {ITEMS.map((item) => (
          <MusicItemRow
            key={item.id}
            item={item}
            isOpen={openSet.has(item.id)}
            onPlay={() => doPlay(item.id)}
          />
        ))}
      </Accordion.Root>
    </section>
  );
}
