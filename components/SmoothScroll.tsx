"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    let lenis: Lenis | null = null;
    const navigateToStoryIntro = (event: Event) => {
      const progress = (event as CustomEvent<{ progress: number }>).detail.progress;
      const trigger = ScrollTrigger.getById("ekkomi-story");
      if (!trigger) {
        document.querySelector("#story")?.scrollIntoView({ behavior: "smooth" });
        return;
      }

      const destination = trigger.start + (trigger.end - trigger.start) * progress;
      if (lenis) lenis.scrollTo(destination, { duration: 1.1, force: true, programmatic: true });
      else window.scrollTo({ top: destination, behavior: "auto" });
    };
    window.addEventListener("ekkomi:story-intro", navigateToStoryIntro);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => window.removeEventListener("ekkomi:story-intro", navigateToStoryIntro);
    }

    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    const activeLenis = lenis;
    const tick = (time: number) => activeLenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    const refresh = () => ScrollTrigger.refresh();
    const visualViewport = window.visualViewport;
    let refreshTimer: number | undefined;
    let lastViewportWidth = visualViewport?.width ?? window.innerWidth;
    let lastViewportHeight = visualViewport?.height ?? window.innerHeight;
    const refreshAfterViewportSettles = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        const nextWidth = visualViewport?.width ?? window.innerWidth;
        const nextHeight = visualViewport?.height ?? window.innerHeight;
        if (nextWidth === lastViewportWidth && nextHeight === lastViewportHeight) return;

        lastViewportWidth = nextWidth;
        lastViewportHeight = nextHeight;
        activeLenis.resize();
        if (ScrollTrigger.getById("ekkomi-story")) ScrollTrigger.refresh();
      }, 120);
    };
    window.addEventListener("load", refresh);
    visualViewport?.addEventListener("resize", refreshAfterViewportSettles);
    return () => {
      window.removeEventListener("ekkomi:story-intro", navigateToStoryIntro);
      window.removeEventListener("load", refresh);
      visualViewport?.removeEventListener("resize", refreshAfterViewportSettles);
      window.clearTimeout(refreshTimer);
      gsap.ticker.remove(tick);
      activeLenis.off("scroll", ScrollTrigger.update);
      activeLenis.destroy();
    };
  }, []);
  return null;
}
