import { useEffect, type RefObject } from "react";

interface Layer {
  ref: RefObject<HTMLElement | null>;
  /** Fraction of the scroll distance the layer travels. Negative moves it up. */
  rate: number;
  /** Largest distance in px the layer may travel. */
  cap: number;
}

/** Below this width the effect runs at a third of its desktop intensity. */
const MOBILE_QUERY = "(max-width: 767px)";
const MOBILE_SCALE = 1 / 3;

/**
 * Light scroll parallax for a hero. Writes translate3d straight to the layers' styles from
 * one requestAnimationFrame loop, so React never re-renders on scroll. The scroll listener
 * and will-change only exist while the hero is on screen, and nothing runs when the user
 * prefers reduced motion.
 */
export function useHeroParallax(hero: RefObject<HTMLElement | null>, layers: Layer[]) {
  useEffect(() => {
    const section = hero.current;
    if (!section) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia(MOBILE_QUERY);
    let frame = 0;
    let running = false;
    let observer: IntersectionObserver | null = null;

    const apply = () => {
      frame = 0;
      const scrolled = Math.max(0, -section.getBoundingClientRect().top);
      const scale = mobile.matches ? MOBILE_SCALE : 1;
      for (const { ref, rate, cap } of layers) {
        const el = ref.current;
        if (!el) continue;
        const distance = Math.min(Math.abs(rate) * scrolled * scale, cap * scale);
        el.style.transform = `translate3d(0, ${Math.sign(rate) * distance}px, 0)`;
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onBreakpointChange = () => {
      if (running) onScroll();
    };

    const run = () => {
      if (running) return;
      running = true;
      for (const { ref } of layers) if (ref.current) ref.current.style.willChange = "transform";
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    };

    const pause = () => {
      if (!running) return;
      running = false;
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      for (const { ref } of layers) if (ref.current) ref.current.style.willChange = "";
    };

    const reset = () => {
      for (const { ref } of layers) if (ref.current) ref.current.style.transform = "";
    };

    const start = () => {
      if (reduceMotion.matches) return;
      observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? run() : pause()));
      observer.observe(section);
    };

    const stop = () => {
      observer?.disconnect();
      observer = null;
      pause();
    };

    const onMotionPreferenceChange = () => {
      stop();
      reset();
      start();
    };

    start();
    reduceMotion.addEventListener("change", onMotionPreferenceChange);
    mobile.addEventListener("change", onBreakpointChange);

    return () => {
      reduceMotion.removeEventListener("change", onMotionPreferenceChange);
      mobile.removeEventListener("change", onBreakpointChange);
      stop();
    };
    // The layer list is a stable literal at the call site; the refs are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero]);
}
