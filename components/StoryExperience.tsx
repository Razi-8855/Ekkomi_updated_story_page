"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Scene = { directory: string; count: number; focalX: number; caption: string };

const sceneDefinitions = [
  { desktop: "/video-sequences/scene1", mobile: "/video-sequences_mobile-view/scene1-mobile", mobileCount: 190, caption: ".story-caption--intro", focalX: 0.58 },
  { desktop: "/video-sequences/scene2", mobile: "/video-sequences_mobile-view/scene2-mobile", mobileCount: 192, caption: ".story-caption--detail", focalX: 0.5 },
  { desktop: "/video-sequences/scene3", mobile: "/video-sequences_mobile-view/scene3-mobile", mobileCount: 192, caption: ".story-caption--full-look", focalX: 0.5 },
] as const;

const timelineFramesPerScene = 192;
const baseSceneDuration = 2;
const introDuration = 1;
const captionFade = 0.12;
const captionHold = 1;
const finalHold = 0.25;
const sceneStarts = sceneDefinitions.map((_, index) => index * timelineFramesPerScene);
const sceneDurations = sceneDefinitions.map(() => baseSceneDuration);
const totalScrollUnits = introDuration +
  sceneDefinitions.reduce((total) => total + captionFade * 2 + captionHold + baseSceneDuration, 0) +
  (sceneDefinitions.length - 1) * 0.01 + 0.15 + finalHold;

function getSceneSet(isMobile: boolean): Scene[] {
  return sceneDefinitions.map((scene) => ({
    directory: isMobile ? scene.mobile : scene.desktop,
    count: isMobile ? scene.mobileCount : timelineFramesPerScene,
    focalX: isMobile ? scene.focalX : 0.5,
    caption: scene.caption,
  }));
}

function getSceneIndex(frame: number) {
  return Math.min(sceneDefinitions.length - 1, Math.max(0, Math.floor(frame / timelineFramesPerScene)));
}

export default function StoryExperience() {
  const shell = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const host = shell.current;
    const screen = stage.current;
    const target = canvas.current;
    const context = target?.getContext("2d", { alpha: false });
    if (!host || !screen || !target || !context) return;

    gsap.registerPlugin(ScrollTrigger);
    const mobileQuery = window.matchMedia("(max-width: 767px), (max-width: 1023px) and (orientation: portrait), (pointer: coarse)");
    let isMobile = mobileQuery.matches;
    let activeScenes = getSceneSet(isMobile);
    let loaded = activeScenes.map(() => new Map<number, HTMLImageElement>());
    const playhead = { frame: 0 };
    let active = true;

    const releaseScene = (sceneIndex: number) => {
      loaded[sceneIndex]?.forEach((image) => {
        image.onload = null;
        image.onerror = null;
        image.src = "";
      });
      loaded[sceneIndex]?.clear();
    };

    const loadFrame = (sceneIndex: number, frameIndex: number) => {
      const scene = activeScenes[sceneIndex];
      if (!scene || frameIndex < 0 || frameIndex >= scene.count || loaded[sceneIndex].has(frameIndex)) return;
      const image = new Image();
      loaded[sceneIndex].set(frameIndex, image);
      image.onload = render;
      image.onerror = () => loaded[sceneIndex].delete(frameIndex);
      image.decoding = "async";
      image.src = `${scene.directory}/frame_${String(frameIndex + 1).padStart(4, "0")}.webp`;
    };

    const preloadAround = (sceneIndex: number, frameIndex: number, radius: number) => {
      const scene = activeScenes[sceneIndex];
      if (!scene) return;
      const start = Math.max(0, frameIndex - Math.min(2, radius));
      const end = Math.min(scene.count - 1, frameIndex + radius);
      for (let index = start; index <= end; index++) loadFrame(sceneIndex, index);
    };

    const render = () => {
      if (!active) return;
      const sceneIndex = getSceneIndex(playhead.frame);
      const scene = activeScenes[sceneIndex];
      const virtualFrame = Math.min(timelineFramesPerScene - 1, Math.max(0, playhead.frame - sceneStarts[sceneIndex]));
      const sceneFrame = Math.min(scene.count - 1, Math.round(virtualFrame / (timelineFramesPerScene - 1) * (scene.count - 1)));
      preloadAround(sceneIndex, sceneFrame, isMobile ? 5 : 8);
      preloadAround(sceneIndex + 1, 0, isMobile ? 2 : 4);

      // Keep only the active scene and its immediate neighbours in memory.
      loaded.forEach((_, index) => {
        if (index < sceneIndex - 1 || index > sceneIndex + 1) releaseScene(index);
      });

      const images = loaded[sceneIndex];
      let image = images.get(sceneFrame);
      if (!image?.complete || !image.naturalWidth) {
        let closestDistance = Infinity;
        images.forEach((candidate, index) => {
          if (candidate.complete && candidate.naturalWidth && Math.abs(index - sceneFrame) < closestDistance) {
            image = candidate;
            closestDistance = Math.abs(index - sceneFrame);
          }
        });
      }
      if (!image?.complete || !image.naturalWidth) return;

      const ratio = Math.min(window.devicePixelRatio || 1, isMobile ? 1.35 : 1.6);
      const width = screen.clientWidth;
      const height = screen.clientHeight;
      if (target.width !== Math.round(width * ratio) || target.height !== Math.round(height * ratio)) {
        target.width = Math.round(width * ratio);
        target.height = Math.round(height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.fillStyle = "#171715";
      context.fillRect(0, 0, width, height);

      const viewportRatio = width / height;
      const imageRatio = image.naturalWidth / image.naturalHeight;
      const contain = isMobile && viewportRatio > imageRatio * 1.08;
      const scale = contain
        ? Math.min(width / image.naturalWidth, height / image.naturalHeight)
        : Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      const x = (width - drawWidth) * (contain ? 0.5 : scene.focalX);
      context.drawImage(image, x, (height - drawHeight) / 2, drawWidth, drawHeight);
    };

    const resetForViewport = () => {
      const nextIsMobile = mobileQuery.matches;
      if (nextIsMobile !== isMobile) {
        loaded.forEach((_, index) => releaseScene(index));
        isMobile = nextIsMobile;
        activeScenes = getSceneSet(isMobile);
        loaded = activeScenes.map(() => new Map<number, HTMLImageElement>());
      }
      render();
    };

    loadFrame(0, 0);
    const syncHeaderState = (trigger: ScrollTrigger) => {
      host.querySelector(".site-header")?.classList.toggle(
        "is-scrolled",
        trigger.scroll() > trigger.start + 8
      );
    };
    const timeline = gsap.timeline({
      scrollTrigger: {
        id: "ekkomi-story",
        trigger: host,
        pin: screen,
        start: "top top",
        end: () => {
          const sceneTimelineUnits = captionFade * 2 + captionHold + sceneDurations[0];
          const targetSceneVh = window.matchMedia("(max-width: 767px)").matches
            ? 1
            : window.matchMedia("(max-width: 1023px)").matches
              ? 1.35
              : 1.75;
          const scrollScale = targetSceneVh / sceneTimelineUnits;
          return `+=${Math.round(screen.clientHeight * totalScrollUnits * scrollScale)}`;
        },
        scrub: 0.4,
        invalidateOnRefresh: true,
        onUpdate: syncHeaderState,
        onRefresh: syncHeaderState,
      },
    });

    timeline.to(".hero-overlay", { y: () => -screen.clientHeight * 1.1, opacity: 0, duration: introDuration, ease: "none" }, 0);
    timeline.to(".hero-shade", { opacity: 0, duration: introDuration, ease: "none" }, 0);
    let timelinePosition = introDuration;

    sceneDefinitions.forEach((definition, index) => {
      timeline.to(definition.caption, { autoAlpha: 1, duration: captionFade, ease: "none" }, timelinePosition);
      timelinePosition += captionFade + captionHold;
      timeline.to(definition.caption, { autoAlpha: 0, duration: captionFade, ease: "none" }, timelinePosition);
      timelinePosition += captionFade;

      const firstFrame = sceneStarts[index];
      timeline.to(playhead, {
        frame: firstFrame + timelineFramesPerScene - 1,
        duration: sceneDurations[index],
        ease: "none",
        onUpdate: render,
      }, timelinePosition);
      timelinePosition += sceneDurations[index];

      if (index < sceneDefinitions.length - 1) {
        timeline.to(playhead, {
          frame: firstFrame + timelineFramesPerScene,
          duration: 0.01,
          ease: "none",
          onUpdate: render,
        }, timelinePosition);
        timelinePosition += 0.01;
      }
    });

    timeline.to(".story-caption--final", { autoAlpha: 1, duration: 0.15, ease: "none" }, timelinePosition);
    timeline.to(playhead, {
      frame: sceneDefinitions.length * timelineFramesPerScene - 1,
      duration: finalHold,
      ease: "none",
      onUpdate: render,
    }, timelinePosition);

    const resizeObserver = new ResizeObserver(resetForViewport);
    resizeObserver.observe(screen);
    window.addEventListener("resize", resetForViewport);
    mobileQuery.addEventListener("change", resetForViewport);
    return () => {
      active = false;
      resizeObserver.disconnect();
      window.removeEventListener("resize", resetForViewport);
      mobileQuery.removeEventListener("change", resetForViewport);
      host.querySelector(".site-header")?.classList.remove("is-scrolled");
      timeline.scrollTrigger?.kill();
      timeline.kill();
      loaded.forEach((_, index) => releaseScene(index));
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const navigateToStoryIntro = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    closeMenu();
    window.history.pushState(null, "", "#story");
    window.dispatchEvent(new CustomEvent("ekkomi:story-intro", {
      detail: { progress: (introDuration + captionFade + 0.04) / totalScrollUnits },
    }));
  };

  return (
    <main>
      <section className="story-scroll" ref={shell} id="story">
        <div className="story-stage" ref={stage}>
          <canvas ref={canvas} className="story-canvas" aria-label="Scroll-controlled EKKOMI fashion film" />
          <div className="hero-shade" />
          <div className="hero-overlay">
            <header className="site-header">
              <a className="brand-logo" href="#story" aria-label="EKKOMI home">
                <img
                  src="/logo/logo-2.png"
                  alt="EKKOMI"
                  decoding="async"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (!img.src.endsWith("/logo.svg")) {
                      img.src = "/logo/logo.svg";
                    }
                  }}
                />
              </a>
              <button
                className="menu-toggle"
                aria-expanded={menuOpen}
                aria-label="Toggle navigation"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <span /><span />
              </button>
              <nav className={menuOpen ? "nav-open" : ""} aria-label="Main navigation">
                <a href="#story" onClick={navigateToStoryIntro}>STORY</a>
                <a href="/collection" onClick={closeMenu}>COLLECTION</a>
                <a href="#contact" onClick={closeMenu}>CONTACT</a>
              </nav>
            </header>
            <div className="hero-copy">
              <h1>EKKOMI</h1>
            </div>
          </div>

          <div className="story-captions" aria-live="polite">
            <div className="story-caption story-caption--intro">
              <h2>Here I Am.</h2>
              <p>A little of what I&apos;ve inherited. Entirely who I&apos;ve chosen to be.</p>
            </div>
            <div className="story-caption story-caption--detail">
              <h2>Artisanal Embroidery Meets Exquisite Leather.</h2>
              <p>The quiet luxury of beautiful things, made slowly.</p>
            </div>
            <div className="story-caption story-caption--full-look">
              <h2>Art, Made to Be Worn.</h2>
              <p>Old-world craft meets a new generation of self-expression.</p>
            </div>
            <div className="story-caption story-caption--final">
              <h2>A Different Kind of Leather Jacket.</h2>
              <p>Wearable Art × Inherited Craft × Quiet Rebellion</p>
            </div>
          </div>
        </div>
      </section>
      <ClosingSection />
      <footer className="site-footer" id="contact">
        <div className="footer-inner">
          <div className="footer-top">
            <span className="footer-brand">EKKOMI</span>
            <div className="footer-contact">
              <a className="footer-contact-link" href="https://instagram.com/ekkomi_official" target="_blank" rel="noopener noreferrer" aria-label="EKKOMI on Instagram">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle className="icon-dot" cx="17.6" cy="6.7" r=".9" />
                </svg>
                <span>INSTAGRAM</span>
              </a>
              <a className="footer-contact-link" href="mailto:info@ekkomi.co.uk" aria-label="Email EKKOMI at info@ekkomi.co.uk">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <rect x="3" y="5" width="18" height="14" rx="1" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
                <span>info@ekkomi.co.uk</span>
              </a>

            </div>
          </div>
          <div className="footer-bottom story-footer-bottom">
            <span>© 2026 EKKOMI. All rights reserved.</span>
            <span className="footer-bullet" aria-hidden="true">•</span>
            <button
              type="button"
              className="story-cookie-preferences"
              onClick={() => window.dispatchEvent(new CustomEvent("ekkomi:open-cookie-settings"))}
            >
              COOKIE PREFERENCES
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ClosingSection() {
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = section.current;
    if (!target || !("IntersectionObserver" in window)) {
      target?.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      target.classList.add("is-visible");
      observer.disconnect();
    }, { threshold: 0.18 });

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="closing-section" id="collection" ref={section} aria-labelledby="closing-title">
      <div className="closing-content">
        <img className="closing-logo" src="/logo/logo-2.png" alt="EKKOMI bee emblem and wordmark" />
        <h2 id="closing-title" className="closing-statement">
          <span>CRAFTED WITH INTENTION.</span>
          <span>DEFINED BY CHARACTER.</span>
        </h2>
        <p className="closing-support">Discover the collection.</p>
        <a className="closing-button" href="/collection">
          <span>EXPLORE THE COLLECTION</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 12h15m-6-6 6 6-6 6" />
          </svg>
        </a>
        <a className="closing-back-to-top" href="#story">
          BACK TO TOP <span aria-hidden="true">↑</span>
        </a>
      </div>
    </section>
  );
}




