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
    file: "NOMKEE - Enter the UFO.mp3",
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
    file: "NOMKEE - I know you better.mp3",
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
    file: "NOMKEE - Dont want to look away.mp3",
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
    file: "Nomkee - Rayguns everywhere.wav",
    detail:
      "> INFO\n" +
      "-- Very short action snippet, pure experiment.\n" +
      "-- Was never meant for upload.\n" +
      "-- Rediscovered it in 2025 and thought: why not.\n",
  },
];

const MAX_AUDIO_MB = 80;
const MAX_AUDIO_BYTES = MAX_AUDIO_MB * 1024 * 1024;

function validateAudioFile(file: File) {
  if (!file.type || !file.type.startsWith("audio/")) {
    throw new Error("Only audio files are allowed.");
  }
  if (file.size > MAX_AUDIO_BYTES) {
    throw new Error(`File too large. Max ${MAX_AUDIO_MB}MB.`);
  }
}

function publicHref(file: string) {
  const clean = file.replace(/^\/+/, "");
  if (clean.includes("..") || clean.includes(":")) {
    throw new Error("Invalid file path.");
  }

  const url = new URL(clean, document.baseURI);
  if (url.origin !== location.origin) {
    throw new Error("Cross-origin download blocked.");
  }

  return url.toString();
}


function MusicItemRow({ item, isOpen }: { item: MusicItem; isOpen: boolean }) {
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

              <a
                href={publicHref(item.file)}
                download
                className="px-4 py-2 border-2 border-primary/50 rounded bg-background/50 text-primary hover:border-primary hover:shadow-[0_0_10px_rgba(0,255,65,0.4)] transition-all text-xs tracking-widest shrink-0"
                style={{
                  boxShadow:
                    "inset -2px -2px 0px rgba(0,255,65,0.25), inset 2px 2px 0px rgba(0,0,0,0.55)",
                }}
                onClick={() => {
                  primeAudio()
                    .then(() => playSound("TERM", 0.18, 1.0, 420))
                    .catch(() => {});
                }}
              >
                DOWNLOAD
              </a>
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
  const { soundEnabled, eqQueue, eqFiles, setEqFile, requestEqPlay } = useUI();

  const [open, setOpen] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const openRef = useRef<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingIdRef = useRef<string | null>(null);
  const pendingAutoPlayRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const handleChange = (next: string[]) => {
    if (soundEnabled) {
      const openedNow = next.some((id) => !openRef.current.includes(id));
      if (openedNow) {
        primeAudio()
          .then(() => playSound("TERM", 0.2, 1.0, 400))
          .catch(() => {});
      }
    }
    setOpen(next);
  };

  const openSet = useMemo(() => new Set(open), [open]);

  const pickFileFor = (id: string, autoPlay: boolean) => {
    pendingIdRef.current = id;
    pendingAutoPlayRef.current = autoPlay;
    fileInputRef.current?.click();
  };

  const doPlay = (id: string) => {
    requestEqPlay(id);
    onOpenEQ();
  };

  const onPickedFile = (file: File | null) => {
    const id = pendingIdRef.current;
    const autoPlay = pendingAutoPlayRef.current;

    pendingIdRef.current = null;
    pendingAutoPlayRef.current = false;

    if (!id || !file) return;

    try {
      validateAudioFile(file);
      setFileError(null);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Invalid file.");
      return;
    }

    setEqFile(id, file);
    if (autoPlay) doPlay(id);
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
      File upload processed locally by browser. This solution is to showcase the EQ until the audio-hosting server is ready.
    </p>


      {fileError && (
        <div className="mb-4 border border-primary/25 rounded bg-background/40 px-4 py-3 text-xs tracking-widest text-muted-foreground">
          <span className="text-primary">{"-- ERROR:"}</span> {fileError}
        </div>
      )}

      <div className="border border-primary/20 rounded bg-background/40 p-4 mb-6">
        <div className="text-xs text-muted-foreground tracking-widest mb-3">TRACK SLOTS</div>

        <div className="space-y-2">
          {eqQueue.map((t) => {
            const f = eqFiles[t.id];
            const loaded = !!f;

            return (
              <div
                key={t.id}
                className="border border-primary/15 rounded bg-background/30 px-3 py-3 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-primary tracking-widest text-sm truncate">{t.title || t.id}</div>
                    <div className="text-[11px] text-muted-foreground tracking-widest truncate">
                      {loaded ? `-- FILE: ${f!.name} (${Math.round(f!.size / 1024)}KB)` : "-- FILE: (none)"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => pickFileFor(t.id, false)}
                      className="px-4 py-2 border-2 border-primary/50 rounded bg-background/50 text-primary/80 hover:text-primary hover:border-primary hover:shadow-[0_0_10px_rgba(0,255,65,0.35)] transition-all text-xs tracking-widest"
                      style={{
                        boxShadow:
                          "inset -2px -2px 0px rgba(0,255,65,0.18), inset 2px 2px 0px rgba(0,0,0,0.6)",
                      }}
                    >
                      LOAD
                    </button>

                    <button
                      onClick={() => {
                        if (!loaded) pickFileFor(t.id, true);
                        else doPlay(t.id);
                      }}
                      className="px-4 py-2 border-2 border-primary/50 rounded bg-background/50 text-primary hover:border-primary hover:shadow-[0_0_10px_rgba(0,255,65,0.4)] transition-all text-xs tracking-widest"
                      style={{
                        boxShadow:
                          "inset -2px -2px 0px rgba(0,255,65,0.25), inset 2px 2px 0px rgba(0,0,0,0.55)",
                      }}
                    >
                      PLAY
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground tracking-widest">
                  <span className="text-primary">{"--"}</span> Click PLAY to auto-open EQUALIZER.DIR
                </div>
              </div>
            );
          })}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0] ?? null;
            e.currentTarget.value = "";
            onPickedFile(file);
          }}
        />
      </div>

      <Accordion.Root type="multiple" value={open} onValueChange={handleChange} className="space-y-4">
        {ITEMS.map((item) => (
          <MusicItemRow key={item.id} item={item} isOpen={openSet.has(item.id)} />
        ))}
      </Accordion.Root>
    </section>
  );
}
