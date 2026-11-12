"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    let lenis: Lenis | null = null;
    let isPageScrollLocked = false;
    const scrollStoryTo = (event: Event) => {
      const { step, duration = 0.48 } = (event as CustomEvent<{ step: number; duration?: number }>).detail;
      const trigger = ScrollTrigger.getById("ekkomi-story-video");
      if (!trigger) {
        document.querySelector("#story")?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        });
        return;
      }

      const destination = step >= 8 ? trigger.end : trigger.start + Math.max(0, step) * window.innerHeight;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (lenis) lenis.scrollTo(destination, { duration: reducedMotion ? 0 : duration, force: true, programmatic: true });
      else window.scrollTo({ top: destination, behavior: "auto" });
    };
    const stopPageScroll = () => {
      isPageScrollLocked = true;
      lenis?.stop();
    };
    const startPageScroll = () => {
      isPageScrollLocked = false;
      lenis?.start();
    };
    window.addEventListener("ekkomi:story-scroll-to", scrollStoryTo);
    window.addEventListener("ekkomi:modal-scroll-lock", stopPageScroll);
    window.addEventListener("ekkomi:modal-scroll-unlock", startPageScroll);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => {
        window.removeEventListener("ekkomi:story-scroll-to", scrollStoryTo);
        window.removeEventListener("ekkomi:modal-scroll-lock", stopPageScroll);
        window.removeEventListener("ekkomi:modal-scroll-unlock", startPageScroll);
      };
    }

    lenis = new Lenis({
      lerp: 0.12,
      smoothWheel: true,
      syncTouch: true,
      syncTouchLerp: 0.12,
    });
    if (isPageScrollLocked) lenis.stop();
    const activeLenis = lenis;
    const tick = (time: number) => activeLenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
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
      window.removeEventListener("ekkomi:story-scroll-to", scrollStoryTo);
      window.removeEventListener("ekkomi:modal-scroll-lock", stopPageScroll);
      window.removeEventListener("ekkomi:modal-scroll-unlock", startPageScroll);
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
