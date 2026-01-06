import * as Accordion from "@radix-ui/react-accordion";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { TypewriterText } from "./Typewriter";
import { useUI } from "../store/ui";
import { playSound, primeAudio } from "../utils/sfx";

type CodingItem = {
  id: string;
  name: string;
  desc: string;
  detail: string;
};

const ITEMS: CodingItem[] = [
  {
    id: "repos",
    name: "Selected Repos",
    desc: "Curated links + context.",
    detail:
      "> Placeholder detail:\n" +
      "-- What it is\n" +
      "-- Why it exists\n" +
      "-- What I learned / tradeoffs\n" +
      "-- Link slots (GitHub / internal notes)",
  },
  {
    id: "tooling",
    name: "Tooling",
    desc: "Linux, Git workflows, small automation utilities.",
    detail:
      "> Placeholder detail:\n" +
      "-- Shell habits / aliases\n" +
      "-- Git flow / branching\n" +
      "-- Small scripts (quality-of-life)\n" +
      "-- Debugging + logging patterns",
  },
  {
    id: "case-studies",
    name: "Case Studies",
    desc: "Problem → approach → result (short technical writeups).",
    detail:
      "> Placeholder detail:\n" +
      "-- Context\n" +
      "-- Constraints\n" +
      "-- Approach\n" +
      "-- Result / metrics\n" +
      "-- Next improvements",
  },
];

function CodingItemRow({ item, isOpen }: { item: CodingItem; isOpen: boolean }) {
  return (
    <Accordion.Item
      value={item.id}
      className="border border-primary/20 rounded bg-background/50"
    >
      <Accordion.Header>
        <Accordion.Trigger className="group w-full p-4 text-left flex justify-between items-start outline-none">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <ChevronRight className="w-5 h-5 text-primary transition-transform group-data-[state=open]:rotate-90" />
              <span className="text-primary font-medium">{item.name}</span>
            </div>

            {!isOpen && (
              <div className="mt-2 pl-8 text-sm text-muted-foreground">
                <span className="text-primary">{"--"}</span> {item.desc}
              </div>
            )}
          </div>

          <span className="text-xs text-muted-foreground">{isOpen ? "[-]" : "[+]"}</span>
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Content className="px-4 pb-4">
        <div className="border-t border-primary/15 pt-4 pl-8 space-y-3">
          <TypewriterText
            as="pre"
            text={item.detail}
            speedMs={6}
            className="text-muted-foreground whitespace-pre-wrap text-sm"
          />

          <div className="pt-3 border-t border-primary/15 text-sm text-muted-foreground">
            <span className="text-primary">{"--"}</span> {item.desc}
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
    <section className="mb-12 border border-primary/30 p-6 bg-card/50 rounded shadow-[0_0_10px_rgba(0,255,65,0.3)]">
      <h2 className="text-primary mb-4 flex items-center gap-2">
        <span className="text-muted-foreground">[</span>
        <TypewriterText text="CODING.DIR" speedMs={18} showCursor={false} />
        <span className="text-muted-foreground">]</span>
      </h2>

      <p className="text-muted-foreground mb-6 text-sm">
        <span className="text-primary">{">"}</span>{" "}
        Work in Progress. Practical notes.
      </p>

      <Accordion.Root
        type="multiple"
        value={open}
        onValueChange={handleChange}
        className="space-y-4"
      >
        {ITEMS.map((item) => (
          <CodingItemRow key={item.id} item={item} isOpen={open.includes(item.id)} />
        ))}
      </Accordion.Root>
    </section>
  );
}
