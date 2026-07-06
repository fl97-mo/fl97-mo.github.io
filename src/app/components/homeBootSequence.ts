export const HOME_BOOT_MODULES = [
  { name: "ABOUT.TXT", kind: "about" },
  { name: "STACK.DAT", kind: "skills" },
  { name: "PROJECTS.DIR", kind: "projects" },
  { name: "CONTACT.SYS", kind: "contact" },
  { name: "HEADER.NAV", kind: "navigation" },
  { name: "FOOTER.NAV", kind: "footer" },
] as const;

export const HOME_BOOT_MODULE_NAMES = HOME_BOOT_MODULES.map((module) => module.name);

export const HOME_BOOT_COMMANDS = [
  "cd ~/portfolio",
  "./scripts/load-home.sh",
] as const;

export const HOME_BOOT_STATUS_LINES = [
  "SYSTEM BOOT SEQUENCE COMPLETE",
  "READING HOME MANIFEST",
  "STARTING HOME TARGET",
] as const;

export const HOME_BOOT_READY_TEXT = "READY TO BROWSE";

export type HomeBootTranscriptKind = "input" | "output" | "system";

export type HomeBootTranscriptLine = {
  text: string;
  kind: HomeBootTranscriptKind;
};

export const HOME_BOOT_TRANSCRIPT_LINES: HomeBootTranscriptLine[] = [
  ...HOME_BOOT_STATUS_LINES.map((text) => ({ text, kind: "output" as const })),
  { text: "visitor@fl97:~ $ cd ~/portfolio", kind: "input" },
  { text: "visitor@fl97:~/portfolio $ ./scripts/load-home.sh", kind: "input" },
  ...HOME_BOOT_MODULE_NAMES.map((name) => ({
    text: `loaded ${name} [ OK ]`,
    kind: "output" as const,
  })),
];
