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
    <section className="mb-12 border border-primary/30 p-6 bg-card/50 rounded shadow-[0_0_10px_rgba(0,255,65,0.3)]">
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
              onClick={handleOpen}
              className="
                flex items-center gap-3
                text-muted-foreground
                hover:text-primary
                transition-colors
                group
              "
            >
              <Icon className="w-5 h-5 text-primary" />
              <span className="text-primary">{">"}</span>

              <span className="flex-1 tracking-widest text-xs sm:text-sm">
                {contact.label}:
              </span>

              <span className="group-hover:underline text-xs sm:text-sm">
                {contact.value}
              </span>

              <span className="text-primary/60 text-xs hidden sm:inline">
                [OPEN]
              </span>
            </a>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-primary/20">
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <span className="text-primary">{">"}</span>
          SYSTEM_STATUS: ONLINE | READ-ONLY MODE
        </p>

      </div>
    </section>
  );
}
