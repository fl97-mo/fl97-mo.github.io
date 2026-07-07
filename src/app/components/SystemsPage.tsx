import * as Accordion from "@radix-ui/react-accordion";
import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useUI } from "../store/ui";
import { handleAccordionArrowNavigation } from "../utils/accordionKeyboard";
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
      data-accordion-root
      type="multiple"
      value={openSections}
      onValueChange={handleChange}
      onKeyDownCapture={handleAccordionArrowNavigation}
      className="space-y-3"
    >
      {sections.map((sec) => (
        <Accordion.Item
          key={sec.id}
          value={sec.id}
          className="border border-primary/20 rounded bg-background/40"
        >
          <Accordion.Header>
            <Accordion.Trigger
              data-accordion-trigger
              aria-label={`${openSections.includes(sec.id) ? "Collapse" : "Expand"} section ${sec.title}`}
              className="group w-full px-3 sm:px-4 py-3 flex justify-between items-center text-left"
            >
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
    title: "How I started sketching a small report framework",
    tags: ["ETL", "REPORT_JOBS", "FRAMEWORK", "VALIDATION", "LOGGING", "THREADING"],
    summary: [
      "A practical idea for repeated reports that start with exports, Excel files, CSVs, or database results",
      "The reports enter the system as jobs instead of being handled by separate one-off scripts",
      "A central controller decides what runs and sends each job through the same structure",
      "Standard methods handle loading, processing, validation, logging, and exporting",
      "The point is reuse: new reports should plug into the framework with their own config",
      "Threading could later allow independent report jobs to run at the same time",
    ],
    typedIntro: [
      "> This started as a normal Excel and ETL automation idea.",
      "> After thinking about it longer, it became more of a small report framework.",
      "> The reports are treated like jobs.",
      "> A central controller loads the right config and pushes each job through the same layers.",
      "> Loading, processing, validation, logging, and export should be reusable methods.",
      "> That way a new report does not need its own messy script from scratch.",
    ],
    sections: [
      {
        id: "s1",
        title: "1. Where the idea came from",
        text:
          "The starting point is normal data work. A report begins with an export from a system, an Excel file, a CSV, or a database result. Then someone opens the file, cleans columns, removes rows, adds lookups, fixes small format issues, and creates a final report. That works for one report. It gets annoying when the same type of work appears again with another file, another mapping table, or another output format.",
      },
      {
        id: "s2",
        title: "2. The part that becomes messy",
        text:
          "The messy part is usually not one single step. It is the amount of small assumptions around the report. One file needs a special column name. Another file has a different date format. One report needs a status mapping. Another one needs a duplicate check. If every report gets its own script or its own Excel workaround, the same logic slowly gets copied into many places.",
      },
      {
        id: "s3",
        title: "3. Why I would not build just another script",
        text:
          "A single script can solve one report. That is useful, but it can also become the next problem. If each script loads files differently, checks errors differently, writes logs differently, and exports files differently, the automation is still hard to maintain. I wanted the common parts to live in one structure instead of being rewritten for every report.",
      },
      {
        id: "s4",
        title: "4. The framework idea",
        text:
          "The idea is to build a small framework around repeated report work. The framework provides standard methods for things that happen again and again: loading files, checking required columns, cleaning values, joining mapping tables, writing logs, and exporting results. A report should mainly describe what it needs. The framework should handle how the standard process works.",
      },
      {
        id: "s5",
        title: "5. Report jobs instead of random scripts",
        text:
          "In this model, a report is a job. A job has a name, input sources, expected columns, optional mappings, validation rules, and an output target. The controller reads this information from a config and starts the job. This makes the report easier to describe. It is no longer just a file plus a few manual steps. It becomes something the system can process in a predictable way.",
      },
      {
        id: "s6",
        title: "6. The central controller",
        text:
          "The controller is the part that keeps the overview. It does not do all data work itself. It loads the report config, places the job into the queue, starts the processing layer, receives validation results, writes the run status, and sends the final data to the export step. This keeps the automation centrally controlled without putting every detail into one giant function.",
      },
      {
        id: "s7",
        title: "7. Queue idea",
        text:
          "I imagine the report jobs moving through a queue. New jobs are loaded into the system and pushed forward one by one. The image in my head is a feed mechanism: the next prepared job moves into the processing layer, then the next one follows. This makes the flow easier to understand than a folder full of unrelated scripts.",
      },
      {
        id: "s8",
        title: "8. Architecture sketch",
        render: () => (
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap border border-primary/20 bg-background/40 rounded p-3 sm:p-4">
{`> REPORT_FRAMEWORK

[ REPORT JOBS ]
  -- machine report
  -- cost overview
  -- dashboard export
  -- monthly status file
        |
        v
[ JOB QUEUE ]
  -- jobs wait in a controlled order
  -- each job points to its config
        |
        v
[ CENTRAL CONTROLLER ]
  -- loads config
  -- starts job
  -- sends job through framework methods
  -- collects status, warnings, and errors
        |
        v
[ PROCESSING LAYER ]
  -- load input
  -- clean data
  -- map values
  -- join tables
  -- prepare report table
        |
        v
[ VALIDATION + LOGGING ]
  -- required columns
  -- duplicates
  -- missing values
  -- failed lookups
  -- row counts
        |
        v
[ OUTPUT ]
  -- Excel file
  -- CSV file
  -- dashboard table
  -- run log`}
          </pre>
        ),
      },
      {
        id: "s9",
        title: "9. Standard methods",
        render: () => (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {[
              {
                title: "Reusable methods",
                items: [
                  "load input files",
                  "normalize column names",
                  "check required columns",
                  "clean dates and numbers",
                  "join lookup tables",
                  "write output files",
                  "create run logs",
                ],
              },
              {
                title: "Report config",
                items: [
                  "report name",
                  "input source",
                  "expected columns",
                  "mapping files",
                  "validation rules",
                  "output format",
                  "output path",
                ],
              },
            ].map((block) => (
              <div
                key={block.title}
                className="border border-primary/20 bg-background/40 rounded p-3 sm:p-4"
              >
                <div className="text-primary mb-2">{"> "} {block.title}</div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-primary">--</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "s10",
        title: "10. Processing layer",
        text:
          "The processing layer does the actual data work. It reads the input, renames columns, fixes formats, removes rows that are clearly not needed, applies mapping tables, and creates the report table. I would keep this layer focused. It should not decide which job runs next, and it should not hide problems. It receives data and config, then returns a processed result.",
      },
      {
        id: "s11",
        title: "11. Validation layer",
        text:
          "Validation should be separate from processing. A report can look finished and still be wrong. The validation layer checks the parts that usually cause trouble: missing columns, empty IDs, duplicate keys, unreadable dates, failed lookups, strange status values, and row counts that do not make sense. If something looks risky, the job should finish with warnings or stop with an error.",
      },
      {
        id: "s12",
        title: "12. Logging layer",
        text:
          "Logging is the part that makes the run understandable later. A small log is enough at the beginning. It should show which job ran, which file was loaded, how many rows came in, which warnings appeared, and where the output was saved. Without this, the framework becomes a black box. With it, debugging starts from facts instead of guessing.",
      },
      {
        id: "s13",
        title: "13. Example run log",
        render: () => (
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap border border-primary/20 bg-background/40 rounded p-3 sm:p-4">
{`> RUN_LOG

-- job: machine_report
-- config: config/machine_report.json
-- input: input_raw/machine_export.xlsx
-- rows loaded: 2841
-- required columns: ok
-- duplicate machine IDs: 2
-- missing status values: 9
-- unmatched lookup rows: 17
-- validation: warnings
-- output: output/machine_report_clean.xlsx
-- status: finished_with_warnings`}
          </pre>
        ),
      },
      {
        id: "s14",
        title: "14. Why this is a framework",
        text:
          "The framework part starts when the same methods can be used by many reports. One report may use an Excel export, another one may use a CSV, and another one may later use a database query. The loading method, validation method, logging method, and export method still follow the same pattern. A new report does not rebuild the whole process. It plugs into the existing structure.",
      },
      {
        id: "s15",
        title: "15. Difference to a one-off script",
        render: () => (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="border border-primary/20 bg-background/40 rounded p-3 sm:p-4">
              <div className="text-primary mb-3">{"> "} One-off script</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "built for one report",
                  "own loading logic",
                  "own error handling",
                  "own export code",
                  "harder to compare with other reports",
                  "often grows through quick fixes",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-primary">--</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-primary/20 bg-background/40 rounded p-3 sm:p-4">
              <div className="text-primary mb-3">{"> "} Framework approach</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "same structure for many reports",
                  "shared loading methods",
                  "shared validation rules",
                  "shared logging format",
                  "report details live in config",
                  "new reports reuse existing parts",
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
        id: "s16",
        title: "16. How a report would run",
        render: () => (
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap border border-primary/20 bg-background/40 rounded p-3 sm:p-4">
{`> REPORT_JOB_FLOW

report: machine_report

1. controller receives job
2. controller loads report config
3. framework loads defined input files
4. processing layer creates working table
5. validation layer checks the result
6. logging layer writes warnings and status
7. export method writes final report

The report defines the task.
The framework provides the mechanism.`}
          </pre>
        ),
      },
      {
        id: "s17",
        title: "17. What belongs in config",
        text:
          "The config should hold things that change from report to report. That includes input paths, expected columns, sheet names, mapping files, filters, validation rules, and output names. This keeps the code cleaner. The framework methods stay general, while the config describes the specific report.",
      },
      {
        id: "s18",
        title: "18. Example config idea",
        render: () => (
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap border border-primary/20 bg-background/40 rounded p-3 sm:p-4">
{`> MACHINE_REPORT_CONFIG

report_name: machine_report

input:
  file: input_raw/machine_export.xlsx
  sheet: Export

required_columns:
  -- machine_id
  -- location
  -- status
  -- material_number

mappings:
  status_map: config/status_values.csv
  material_map: config/material_lookup.csv

validation:
  -- machine_id must not be empty
  -- machine_id should be unique
  -- status must exist in status_map
  -- material_number should match material_map

output:
  file: output/machine_report_clean.xlsx
  format: excel`}
          </pre>
        ),
      },
      {
        id: "s19",
        title: "19. Folder structure",
        render: () => (
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap border border-primary/20 bg-background/40 rounded p-3 sm:p-4">
{`> PROJECT_LAYOUT

/report-framework
  /input_raw
    -- original exports

  /config
    -- report configs
    -- column mappings
    -- lookup tables

  /framework
    -- controller
    -- queue
    -- loaders
    -- processors
    -- validators
    -- loggers
    -- exporters

  /output
    -- generated reports

  /logs
    -- run logs
    -- validation warnings`}
          </pre>
        ),
      },
      {
        id: "s20",
        title: "20. Threading as a later step",
        text:
          "Threading would make sense after the single-job version works. Some reports can run at the same time because they read different inputs and write different outputs. Other reports need to wait because they use the same file or depend on a previous result. The controller would need to decide which jobs are safe to run in parallel.",
      },
      {
        id: "s21",
        title: "21. Threading sketch",
        render: () => (
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap border border-primary/20 bg-background/40 rounded p-3 sm:p-4">
{`> THREADING_IDEA

[ JOB QUEUE ]
  -- report_A
  -- report_B
  -- report_C
        |
        v
[ CONTROLLER ]
  -- checks job rules
  -- starts safe jobs in parallel
  -- keeps dependent jobs waiting
        |
        v
[ WORKERS ]
  -- worker_01: report_A
  -- worker_02: report_B
  -- worker_03: waiting
        |
        v
[ SHARED STATUS ]
  -- each job writes its own log
  -- controller keeps the overview`}
          </pre>
        ),
      },
      {
        id: "s22",
        title: "22. What needs care with threading",
        text:
          "Parallel jobs can create new problems. Two jobs should not overwrite the same output file. Logs need job IDs so they do not mix together. Shared lookup files should be read safely. If a report depends on another report, the controller has to know the order. So threading is useful, but it should be added carefully. Otherwise the framework becomes harder to understand than the manual workflow it was meant to replace.",
      },
      {
        id: "s23",
        title: "23. What I would build first",
        text:
          "I would start with one report job and keep it boring. Load one input file, read one config, run one processing function, run a few validation checks, write one log, and export one file. After that, I would add a second report and check whether the shared methods still make sense. If adding the second report feels easy, the framework idea is working.",
      },
      {
        id: "s24",
        title: "24. Why this idea fits my projects",
        text:
          "I like this idea because it sits between data work and system design. It is still practical: files go in, reports come out. But the interesting part is the structure around it. The controller, queue, reusable methods, validation, and logging turn repeated report work into something that can grow without becoming a pile of separate scripts.",
      },
      {
        id: "s25",
        title: "25. Main takeaway",
        text:
          "The main takeaway is simple: automation becomes more useful when the repeated parts are standardized. A script can save time once. A small framework can make the next report easier too. The goal is not to overbuild a simple Excel task. The goal is to avoid writing the same loading, checking, logging, and exporting logic again and again.",
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
        <Accordion.Trigger
          data-accordion-trigger
          aria-label={`${isOpen ? "Collapse" : "Expand"} systems post ${post.title}`}
          className="group w-full p-3 sm:p-4 text-left flex justify-between items-start gap-3"
        >
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
    <section className="mb-12 border border-primary/30 p-4 sm:p-6 bg-card/50 rounded crt-glow-soft">
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
        data-accordion-root
        type="multiple"
        value={open}
        onValueChange={handlePostsChange}
        onKeyDownCapture={handleAccordionArrowNavigation}
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
