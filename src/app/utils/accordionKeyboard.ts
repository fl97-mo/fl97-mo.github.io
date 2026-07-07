import type { KeyboardEvent as ReactKeyboardEvent } from "react";

const ACCORDION_TRIGGER_SELECTOR = "button[data-accordion-trigger]";
const ACCORDION_ROOT_SELECTOR = "[data-accordion-root]";

function getAccordionTriggers(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLButtonElement>(ACCORDION_TRIGGER_SELECTOR)).filter(
    (trigger) => !trigger.disabled
  );
}

export function handleAccordionArrowNavigation(event: ReactKeyboardEvent<HTMLElement>) {
  const key = event.key;
  if (
    key !== "ArrowDown" &&
    key !== "ArrowRight" &&
    key !== "ArrowUp" &&
    key !== "ArrowLeft" &&
    key !== "Home" &&
    key !== "End"
  ) {
    return;
  }

  const target = event.target as HTMLElement | null;
  const currentTrigger = target?.closest<HTMLButtonElement>(ACCORDION_TRIGGER_SELECTOR);
  if (!currentTrigger) return;

  const currentRoot = currentTrigger.closest<HTMLElement>(ACCORDION_ROOT_SELECTOR);
  if (currentRoot !== event.currentTarget) return;

  const triggers = getAccordionTriggers(event.currentTarget);
  const currentIndex = triggers.indexOf(currentTrigger);
  if (currentIndex < 0) return;

  let nextIndex = currentIndex;
  if (key === "ArrowDown" || key === "ArrowRight") {
    nextIndex = (currentIndex + 1) % triggers.length;
  } else if (key === "ArrowUp" || key === "ArrowLeft") {
    nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
  } else if (key === "Home") {
    nextIndex = 0;
  } else if (key === "End") {
    nextIndex = triggers.length - 1;
  }

  event.preventDefault();
  triggers[nextIndex]?.focus();
}
