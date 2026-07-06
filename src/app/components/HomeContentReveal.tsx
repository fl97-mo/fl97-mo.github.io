import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useUI } from "../store/ui";
import { AboutSection } from "./AboutSection";
import { ContactSection } from "./ContactSection";
import { HomeModuleLoader } from "./HomeModuleLoader";
import { ProjectsSection } from "./ProjectsSection";
import { SkillsSection } from "./SkillsSection";

type HomeContentRevealProps = {
  instant?: boolean;
  onDone?: () => void;
  onFooterMounted?: () => void;
  onOpenSystems: (slug: string) => void;
};

const HOME_MODULES = [
  { name: "ABOUT.TXT", kind: "about" },
  { name: "STACK.DAT", kind: "skills" },
  { name: "PROJECTS.DIR", kind: "projects" },
  { name: "CONTACT.SYS", kind: "contact" },
  { name: "HEADER.NAV", kind: "navigation" },
  { name: "FOOTER.NAV", kind: "footer" },
];

const MODULE_NAMES = HOME_MODULES.map((module) => module.name);
const moduleIndex = (kind: string) => HOME_MODULES.findIndex((module) => module.kind === kind);
const FOOTER_MODULE_INDEX = moduleIndex("footer");

const MODULE_STEP_MS = 700;
const MODULE_START_DELAY_MS = 220;
const SEQUENCE_DONE_DELAY_MS = 140;

function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReduced(query.matches);
    update();

    if (query.addEventListener) {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }

    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  return prefersReduced;
}

export function HomeContentReveal({
  instant = false,
  onDone,
  onFooterMounted,
  onOpenSystems,
}: HomeContentRevealProps) {
  const { effectsEnabled, accessibilityEnabled } = useUI();
  const prefersReducedMotion = usePrefersReducedMotion();
  const skipSessionSequenceRef = useRef(instant);
  const shouldSkipSequence =
    skipSessionSequenceRef.current || !effectsEnabled || accessibilityEnabled || prefersReducedMotion;

  const [visibleCount, setVisibleCount] = useState(
    shouldSkipSequence ? HOME_MODULES.length : 0
  );
  const [loaderDone, setLoaderDone] = useState(shouldSkipSequence);
  const [bootDone, setBootDone] = useState(shouldSkipSequence);

  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (visibleCount > FOOTER_MODULE_INDEX) onFooterMounted?.();
  }, [onFooterMounted, visibleCount]);

  useEffect(() => {
    if (shouldSkipSequence) {
      setVisibleCount(HOME_MODULES.length);
      setLoaderDone(true);
      setBootDone(true);
      onDoneRef.current?.();
      return;
    }
  }, [shouldSkipSequence]);

  useEffect(() => {
    if (shouldSkipSequence || !bootDone) return;

    const timers: number[] = [];

    setVisibleCount(0);
    setLoaderDone(false);

    HOME_MODULES.forEach((_module, index) => {
      timers.push(
        window.setTimeout(() => {
          setVisibleCount(index + 1);
        }, MODULE_START_DELAY_MS + index * MODULE_STEP_MS)
      );
    });

    timers.push(
      window.setTimeout(() => {
        setLoaderDone(true);
        onDoneRef.current?.();
      }, MODULE_START_DELAY_MS + (HOME_MODULES.length - 1) * MODULE_STEP_MS + SEQUENCE_DONE_DELAY_MS)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [bootDone, shouldSkipSequence]);

  const renderSection = (index: number, section: ReactNode) => {
    if (visibleCount <= index) return null;

    return (
      <div
        className={shouldSkipSequence ? undefined : "home-module-reveal"}
        style={
          shouldSkipSequence
            ? undefined
            : { animationDelay: `${Math.min(index * 70, 210)}ms` }
        }
      >
        {section}
      </div>
    );
  };

  return (
    <>
      <HomeModuleLoader
        modules={MODULE_NAMES}
        mountedCount={visibleCount}
        complete={loaderDone || shouldSkipSequence}
        animated={!shouldSkipSequence}
        onBootDone={() => setBootDone(true)}
      />

      {renderSection(moduleIndex("about"), <AboutSection />)}
      {renderSection(moduleIndex("skills"), <SkillsSection />)}
      {renderSection(moduleIndex("projects"), <ProjectsSection onOpenSystems={onOpenSystems} />)}
      {renderSection(moduleIndex("contact"), <ContactSection />)}
    </>
  );
}
