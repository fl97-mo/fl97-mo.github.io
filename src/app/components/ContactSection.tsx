import { Github, Linkedin } from "lucide-react";
import { useUI } from "../store/ui";
import { playSound, primeAudio } from "../utils/sfx";
import { TypewriterText } from "./Typewriter";

type Contact = {
  icon: any;
  label: string;
  value: string;
  href: string;
};

export function ContactSection() {
  const { soundEnabled } = useUI();

  const contacts: Contact[] = [
    {
      icon: Github,
      label: "GITHUB",
      value: "github.com/fl97-mo",
      href: "https://github.com/fl97-mo",
    },
    {
      icon: Linkedin,
      label: "LINKEDIN",
      value: "linkedin.com/in/fl97-mo",
      href: "https://linkedin.com/in/fl97-mo",
    },
  ];

  const handleOpen = () => {
    if (!soundEnabled) return;
    primeAudio();
    playSound("TERM", 0.2, 1.0, 400);
  };

  return (
    <section className="mb-12 border border-primary/30 bg-card/50 p-4 rounded crt-glow-soft sm:p-6">
      <h2 className="text-primary mb-4 flex items-center gap-2">
        <span className="text-muted-foreground">[</span>
        <TypewriterText text="CONTACT.SYS" speedMs={18} showCursor={false} />
        <span className="text-muted-foreground">]</span>
      </h2>

      <div className="space-y-3">
        {contacts.map((contact) => {
          const Icon = contact.icon;

          return (
            <a
              key={contact.label}
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${contact.label} profile in a new tab: ${contact.value}`}
              onClick={handleOpen}
              className="
                grid grid-cols-[1.25rem_auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1
                text-muted-foreground
                hover:text-primary
                transition-colors
                group
                focus:outline-none focus:ring-2 focus:ring-primary/50
              "
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="mt-0.5 text-primary">{">"}</span>

              <span className="grid min-w-0 gap-0.5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-baseline sm:gap-3">
                <span className="tracking-widest text-xs text-primary sm:text-sm">
                  {contact.label}:
                </span>

                <span className="break-all text-xs group-hover:underline sm:truncate sm:break-normal sm:text-sm">
                  {contact.value}
                </span>

                <span className="hidden text-xs text-primary/60 sm:inline">
                  [OPEN]
                </span>
              </span>
            </a>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-primary/20">
        <p className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 text-sm text-muted-foreground">
          <span className="text-primary">{">"}</span>
          <span>SYSTEM_STATUS: ONLINE | READ-ONLY MODE</span>
        </p>

      </div>
    </section>
  );
}
