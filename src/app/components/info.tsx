import { TypewriterText } from "./Typewriter";

export function INFOPage() {
  return (
    <section className="mb-12 border border-primary/30 p-6 bg-card/50 rounded shadow-[0_0_10px_rgba(0,255,65,0.3)]">
      <h2 className="text-primary mb-4 flex items-center gap-2">
        <span className="text-muted-foreground">[</span>
        <TypewriterText text="IMPRINT.DIR" speedMs={18} showCursor={false} />
        <span className="text-muted-foreground">]</span>
      </h2>

      <pre className="text-sm text-muted-foreground whitespace-pre-wrap select-none">
{`LEGAL NOTICE / SITE INFORMATION

Operator
--------
Florian Morina
Neu-Ulm, Germany
E-Mail: mail@fl97-mo.de

Nature of this website
----------------------
This website is a private, non-commercial personal project.
No paid services are offered and it is not operated as a business.

Hosting / Infrastructure
------------------------
This site is hosted via GitHub Pages and delivered through Cloudflare (CDN/DNS).
Both providers may technically process access data (e.g., IP address, user agent)
to provide and secure the website. See PRIVACY.DIR for details.  [*]

Disclaimer (no legal advice)
----------------------------
The information on this website is provided "as is" and for general
information purposes. It does not constitute professional advice.

Liability for content
---------------------
I create and maintain the content of this website with care.
However, I do not guarantee completeness, accuracy, or timeliness.
Use of the content is at your own risk.

As a private website operator, I am not responsible for user-generated
content on external platforms (e.g., repositories, social media) that may
be linked from this site.

Liability for external links
----------------------------
This website contains links to external websites. I have no control over
their content and do not adopt it as my own.

At the time of linking, no obvious legal violations were identifiable.
If I become aware of legal infringements, I will remove the respective links
as soon as reasonably possible.

License / Free to use
---------------------
Unless otherwise stated, the website code/text content is dedicated to the public domain (CC0 1.0).
Music is licensed separately (see "Music license" above).


Music license (Attribution required)
------------------------------------
Music tracks published on this website under the artist name "NOMKEE" are free to use
for private and commercial projects, including downloads, remixes, edits, and redistribution,
as long as credit is given.

Required credit format:
"NOMKEE - <Track Name>"

Third-party content
-------------------
Content that is linked, quoted, embedded, or otherwise provided by third parties is not covered by the
above dedication and remains subject to the respective rights and licenses of the original owners.

No responsibility for third-party services
------------------------------------------
If a platform supports clickable credits, please link to fl97-mo.de (optional, appreciated).
If a track is stated to have a different license, that license overrides this section.

GitHub Pages and Cloudflare are third-party services used to provide this site.
Their own terms and policies apply. See PRIVACY.DIR for data protection details.

Last update
-----------
2025-12-30

[*] Note: Technical data processing by hosting/CDN providers is common for
    operating and securing websites. For details and your rights, see PRIVACY.DIR.
`}
      </pre>
    </section>
  );
}
