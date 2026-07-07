import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useUI } from "../store/ui";
import { AboutSection } from "./AboutSection";
import { ContactSection } from "./ContactSection";
import { HomeModuleLoader } from "./HomeModuleLoader";
import { ProjectsSection } from "./ProjectsSection";
import { SkillsSection } from "./SkillsSection";
import type { TabId } from "./RetroNavigation";
import { HOME_BOOT_MODULE_NAMES, HOME_BOOT_MODULES } from "./homeBootSequence";

type HomeContentRevealProps = {
  instant?: boolean;
  activeTab: TabId;
  onDone?: () => void;
  onFooterMounted?: () => void;
  onNavigate: (tab: TabId) => void;
  onOpenSystems: (slug: string) => void;
};

const moduleIndex = (kind: string) => HOME_BOOT_MODULES.findIndex((module) => module.kind === kind);
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
  activeTab,
  onDone,
  onFooterMounted,
  onNavigate,
  onOpenSystems,
}: HomeContentRevealProps) {
  const { effectsEnabled, accessibilityEnabled } = useUI();
  const prefersReducedMotion = usePrefersReducedMotion();
  const skipSessionSequenceRef = useRef(instant);
  const shouldSkipSequence =
    skipSessionSequenceRef.current || !effectsEnabled || accessibilityEnabled || prefersReducedMotion;
  const moduleSequenceStartedRef = useRef(shouldSkipSequence);

  const [visibleCount, setVisibleCount] = useState(
    shouldSkipSequence ? HOME_BOOT_MODULES.length : 0
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

  const finishSessionBoot = () => {
    onDoneRef.current?.();
  };

  const abortSessionBoot = () => {
    skipSessionSequenceRef.current = true;
    moduleSequenceStartedRef.current = true;
    setVisibleCount(HOME_BOOT_MODULES.length);
    setLoaderDone(true);
    setBootDone(true);
    finishSessionBoot();
  };

  useEffect(() => {
    if (shouldSkipSequence) {
      skipSessionSequenceRef.current = true;
      moduleSequenceStartedRef.current = true;
      setVisibleCount(HOME_BOOT_MODULES.length);
      setLoaderDone(true);
      setBootDone(true);
      finishSessionBoot();
      return;
    }
  }, [shouldSkipSequence]);

  useEffect(() => {
    if (shouldSkipSequence || !bootDone || moduleSequenceStartedRef.current) return;

    const timers: number[] = [];

    moduleSequenceStartedRef.current = true;
    setVisibleCount(0);
    setLoaderDone(false);

    HOME_BOOT_MODULES.forEach((_module, index) => {
      timers.push(
        window.setTimeout(() => {
          setVisibleCount(index + 1);
        }, MODULE_START_DELAY_MS + index * MODULE_STEP_MS)
      );
    });

    timers.push(
      window.setTimeout(() => {
        setLoaderDone(true);
        finishSessionBoot();
      }, MODULE_START_DELAY_MS + (HOME_BOOT_MODULES.length - 1) * MODULE_STEP_MS + SEQUENCE_DONE_DELAY_MS)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [bootDone, shouldSkipSequence]);

  const renderSection = (index: number, section: ReactNode) => {
    if (visibleCount <= index) return null;
    const sectionInstant = shouldSkipSequence || loaderDone;

    return (
      <div
        className={sectionInstant ? undefined : "home-module-reveal"}
        style={
          sectionInstant
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
        modules={HOME_BOOT_MODULE_NAMES}
        mountedCount={visibleCount}
        complete={loaderDone || shouldSkipSequence}
        animated={!shouldSkipSequence}
        activeTab={activeTab}
        onNavigate={onNavigate}
        onAbortBoot={abortSessionBoot}
        onBootDone={() => setBootDone(true)}
      />

      {renderSection(moduleIndex("about"), <AboutSection />)}
      {renderSection(moduleIndex("skills"), <SkillsSection />)}
      {renderSection(moduleIndex("projects"), <ProjectsSection onOpenSystems={onOpenSystems} />)}
      {renderSection(moduleIndex("contact"), <ContactSection />)}
    </>
  );
}
