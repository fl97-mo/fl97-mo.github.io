import { TypewriterText } from "./Typewriter";

export function PrivacyPage() {
  return (
    <section className="mb-12 border border-primary/30 p-6 bg-card/50 rounded shadow-[0_0_10px_rgba(0,255,65,0.3)]">
      <h2 className="text-primary mb-4 flex items-center gap-2">
        <span className="text-muted-foreground">[</span>
        <TypewriterText text="PRIVACY.DIR" speedMs={18} showCursor={false} />
        <span className="text-muted-foreground">]</span>
      </h2>

      <pre className="text-sm text-muted-foreground whitespace-pre-wrap select-none">
{`PRIVACY POLICY (GDPR / DSGVO)

1) Controller (Data Controller)
-------------------------------
Florian Morina
Neu-Ulm, Germany
E-Mail: mail@fl97-mo.de

This is a private, non-commercial website. If you have questions regarding
data protection, contact me via email.

2) Scope
--------
This privacy policy explains which personal data may be processed when you
visit this website or contact me via email.

3) No tracking / no analytics by the website operator
-----------------------------------------------------
- I do not intentionally use tracking or analytics tools.
- I do not create user profiles.
- I do not use marketing cookies.

Important: Even if I do not use tracking/analytics myself, technical data may be
processed by third-party hosting and delivery providers to operate and secure the website.
In addition, third-party providers may set technically necessary cookies (e.g., for
security, rate-limiting, or performance), depending on configuration and their services.

4) Hosting & delivery (GitHub Pages + Cloudflare)
-------------------------------------------------
This website is hosted via GitHub Pages and delivered through Cloudflare (CDN/DNS).
When you access this site, your request is technically routed through these services.
As a result, personal data may be processed, in particular:

- IP address
- date and time of the request
- requested page / file
- referrer (if transmitted by your browser)
- browser type and version
- operating system
- language settings
- device information (where applicable)
- diagnostic / security-related metadata

Purpose:
- delivering the website (content distribution)
- ensuring stability and performance
- detecting and preventing abuse/attacks (security)

Legal bases (depending on the situation):
- Art. 6(1)(f) GDPR (legitimate interests): secure, stable, and reliable operation
- Art. 6(1)(b) GDPR may apply if you explicitly request something from me (e.g., via email)

Retention:
- I do not operate my own server logs on self-hosted infrastructure.
- Hosting/CDN providers may store technical logs for a limited period for security and operation.
- I have no direct control over provider log retention beyond settings they make available.
  For details, please refer to the providers’ policies.

Providers’ policies (for transparency):
- GitHub Privacy Statement (GitHub Pages is part of GitHub’s services)
- Cloudflare Privacy Policy / Trust & GDPR resources

4b) Audio hosting (audio.fl97-mo.de)
------------------------------------
Audio files are served from a separate domain: audio.fl97-mo.de.
When you stream or download audio, your browser requests media files from that server.

Processed data (technical access data):
- IP address
- date and time of the request
- requested audio file / URL
- referrer (if transmitted by your browser)
- user agent / device information

Purpose:
- delivering the audio content
- ensuring stability and protecting the service from abuse

Legal basis:
- Art. 6(1)(f) GDPR (legitimate interests): reliable and secure operation

Retention:
- Server/provider logs may be stored for a limited period for security and operation.
- If the audio service is delivered through a CDN or reverse proxy, that provider may also process logs.


5) International data transfers (third countries)
-------------------------------------------------
GitHub and Cloudflare are international providers and may process data in countries
outside the EU/EEA (e.g., the United States), depending on service setup.

Where required, transfers may rely on appropriate safeguards such as Standard
Contractual Clauses (SCCs) under Art. 46 GDPR, and/or other applicable mechanisms.

6) Contact via email
--------------------
If you contact me via email, I process the data you provide (e.g., email address,
message content, timestamp) solely to respond to your request.

Legal basis:
- Art. 6(1)(b) GDPR (communication about a request), or
- Art. 6(1)(f) GDPR (legitimate interest in responding to inquiries)

Retention:
- I keep email communication only as long as necessary to handle the request,
  or longer if required (e.g., for legal obligations or documentation of the request).

7) External links
-----------------
This website may contain links to external websites and platforms (e.g., project
repositories, social media). When you follow such a link, the respective provider
processes personal data under their own responsibility and policies.

I have no influence on the processing of personal data by external providers.

8) Your rights under GDPR
-------------------------
You have the right to:
- access (Art. 15 GDPR)
- rectification (Art. 16 GDPR)
- erasure (Art. 17 GDPR)
- restriction of processing (Art. 18 GDPR)
- data portability (Art. 20 GDPR), where applicable
- object to processing based on Art. 6(1)(f) GDPR (Art. 21 GDPR)
- lodge a complaint with a supervisory authority (Art. 77 GDPR)

You may contact any supervisory authority, in particular in your EU member state
of residence, place of work, or where the alleged infringement occurred.

9) Security
-----------
I take reasonable technical and organizational measures to protect this website.
However, no method of transmission over the Internet is 100% secure.

10) Changes to this policy
--------------------------
I may update this privacy policy if the website changes or if legal requirements change.

Last update
-----------
2025-12-30
`}
      </pre>
    </section>
  );
}
