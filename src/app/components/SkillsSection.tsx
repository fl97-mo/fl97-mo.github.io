import { useUI } from "../store/ui";
import { playSound, primeAudio } from "../utils/sfx";

export function SkillsSection() {
  const { soundEnabled } = useUI();
  const skills = [
    {
      category: 'CORE',
      items: ['Python', 'Java', 'C++', 'JavaScript (Basics)'],
    },
    {
      category: 'DATA / AUTOMATION',
      items: ['Pandas', 'SQL', 'VBA', 'n8n'],
    },
    {
      category: 'WEB',
      items: ['HTML', 'CSS', 'React (Basics)'],
    },
    {
      category: 'SYSTEMS / TOOLING',
      items: ['Linux', 'Git', 'Bash'],
    },
  ];

  const wikiMap: Record<string, string> = {
    Python: 'Python_(programming_language)',
    Java: 'Java_(programming_language)',
    'C++': 'C%2B%2B',
    'JavaScript (Basics)': 'JavaScript',

    Pandas: 'Pandas_(software)',
    SQL: 'SQL',
    VBA: 'Visual_Basic_for_Applications',
    'n8n': 'n8n',

    HTML: 'HTML',
    CSS: 'CSS',
    'React (Basics)': 'React_(software)',

    Linux: 'Linux',
    Git: 'Git',
    Bash: 'Bash_(Unix_shell)',
  };

  const wikiUrl = (label: string) => `https://en.wikipedia.org/wiki/${wikiMap[label] ?? encodeURIComponent(label)}`;

  return (
    <section className="mb-12 border border-primary/30 p-6 bg-card/50 rounded shadow-[0_0_10px_rgba(0,255,65,0.3)]">
      <h2 className="text-primary mb-4 flex items-center gap-2">
        <span className="text-muted-foreground">{'['}</span>
        STACK.DAT
        <span className="text-muted-foreground">{']'}</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {skills.map((group, index) => (
          <div key={index}>
            <h3 className="text-primary mb-2">
              {'>'} {group.category}:
            </h3>

            <div className="pl-4 space-y-1">
              {group.items.map((skill, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-primary">{'--'}</span>

                <a
                  href={wikiUrl(skill)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 hover:text-primary transition-colors"
                  title={`Open Wikipedia: ${skill}`}
                  onClick={() => {
                    if (!soundEnabled) return;
                    primeAudio();
                    playSound("TERM", 0.2, 1.0, 400);
                  }}
>
                    <span className="group-hover:underline underline-offset-4">
                      {skill}
                    </span>
                    <span className="text-primary/70 group-hover:text-primary transition-colors">
                      ↗
                    </span>
                  </a>

                  <span className="text-primary ml-auto">[OK]</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
