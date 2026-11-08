"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Scene = { directory: string; count: number; focalX: number; caption: string };
type FrameEntry = {
  image?: HTMLImageElement;
  status: "queued" | "loading" | "ready" | "failed";
  priority: number;
};
type FrameRequest = { sceneIndex: number; frameIndex: number; priority: number };

const sceneDefinitions = [
  { desktop: "/video-sequences/scene1", desktopCount: 192, mobile: "/video-sequences_mobile-view/scene1-mobile", mobileCount: 98, caption: ".story-caption--intro", focalX: 0.58 },
  { desktop: "/video-sequences/scene2", desktopCount: 192, mobile: "/video-sequences_mobile-view/scene2-mobile", mobileCount: 192, caption: ".story-caption--detail", focalX: 0.5 },
  { desktop: "/video-sequences/scene3", desktopCount: 190, mobile: "/video-sequences_mobile-view/scene3-mobile", mobileCount: 190, caption: ".story-caption--full-look", focalX: 0.5 },
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
    count: isMobile ? scene.mobileCount : scene.desktopCount,
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
    let loaded = activeScenes.map(() => new Map<number, FrameEntry>());
    const playhead = { frame: 0 };
    let active = true;
    let pendingQueue: FrameRequest[] = [];
    let activeLoads = 0;
    let renderFrameId = 0;
    let lastDrawnScene = -1;
    let lastDrawnFrame = -1;
    let lastCanvasWidth = 0;
    let lastCanvasHeight = 0;
    let seedRepresentativeFrames = true;
    let maxConcurrentLoads = isMobile ? 2 : 3;
    let maxCachedFrames = isMobile ? 14 : 18;

    const releaseScene = (sceneIndex: number) => {
      loaded[sceneIndex]?.forEach((entry) => {
        if (!entry.image) return;
        entry.image.onload = null;
        entry.image.onerror = null;
        entry.image.src = "";
      });
      loaded[sceneIndex]?.clear();
    };

    const virtualFrameFor = (sceneIndex: number, frameIndex: number) => {
      const count = activeScenes[sceneIndex]?.count ?? 1;
      return sceneStarts[sceneIndex] + (count <= 1 ? 0 : frameIndex / (count - 1)) * (timelineFramesPerScene - 1);
    };

    const trimDecodedFrames = () => {
      const currentScene = getSceneIndex(playhead.frame);
      const scene = activeScenes[currentScene];
      if (!scene) return;
      const virtualFrame = Math.min(timelineFramesPerScene - 1, Math.max(0, playhead.frame - sceneStarts[currentScene]));
      const currentFrame = Math.min(scene.count - 1, Math.round(virtualFrame / (timelineFramesPerScene - 1) * (scene.count - 1)));
      const entries: Array<{ sceneIndex: number; frameIndex: number; distance: number }> = [];
      loaded.forEach((frames, sceneIndex) => frames.forEach((entry, frameIndex) => {
        if (entry.status === "ready") {
          entries.push({ sceneIndex, frameIndex, distance: Math.abs(virtualFrameFor(sceneIndex, frameIndex) - playhead.frame) });
        }
      }));
      if (entries.length <= maxCachedFrames) return;
      entries.sort((a, b) => b.distance - a.distance);
      let remaining = entries.length - maxCachedFrames;
      for (const entry of entries) {
        if (!remaining) break;
        if (entry.sceneIndex === currentScene && entry.frameIndex === currentFrame) continue;
        const frame = loaded[entry.sceneIndex].get(entry.frameIndex);
        if (frame?.image) {
          frame.image.onload = null;
          frame.image.onerror = null;
          frame.image.src = "";
        }
        loaded[entry.sceneIndex].delete(entry.frameIndex);
        remaining -= 1;
      }
    };

    const pumpQueue = () => {
      while (active && activeLoads < maxConcurrentLoads && pendingQueue.length) {
        const request = pendingQueue.shift()!;
        const scene = activeScenes[request.sceneIndex];
        const entry = loaded[request.sceneIndex]?.get(request.frameIndex);
        if (!scene || !entry || entry.status !== "queued") continue;

        entry.status = "loading";
        activeLoads += 1;
        const image = new Image();
        image.decoding = "async";
        if ("fetchPriority" in image) image.fetchPriority = request.priority === 0 ? "high" : "auto";
        entry.image = image;

        void (async () => {
          try {
            const loadedEvent = new Promise<void>((resolve, reject) => {
              image.onload = () => resolve();
              image.onerror = () => reject(new Error("Frame request failed."));
            });
            image.src = `${scene.directory}/frame_${String(request.frameIndex + 1).padStart(4, "0")}.webp`;
            if (typeof image.decode === "function") {
              try {
                await image.decode();
              } catch {
                await loadedEvent;
              }
            } else {
              await loadedEvent;
            }
            if (!active || loaded[request.sceneIndex]?.get(request.frameIndex) !== entry) return;
            if (!image.naturalWidth) throw new Error("Decoded frame has no image dimensions.");
            entry.status = "ready";
            trimDecodedFrames();
            render();
          } catch {
            if (loaded[request.sceneIndex]?.get(request.frameIndex) === entry) {
              entry.status = "failed";
              if (entry.image) {
                entry.image.onload = null;
                entry.image.onerror = null;
              }
            }
            // A failed frame is skipped; render() uses the closest decoded frame.
            render();
          } finally {
            activeLoads -= 1;
            pumpQueue();
          }
        })();
      }
    };

    const scheduleLoads = (sceneIndex: number, frameIndex: number) => {
      const scene = activeScenes[sceneIndex];
      if (!scene) return;
      const wanted: FrameRequest[] = [];
      const add = (targetScene: number, targetFrame: number, priority: number) => {
        const targetSceneDefinition = activeScenes[targetScene];
        if (!targetSceneDefinition || targetFrame < 0 || targetFrame >= targetSceneDefinition.count) return;
        wanted.push({ sceneIndex: targetScene, frameIndex: targetFrame, priority });
      };

      add(sceneIndex, frameIndex, 0);
      for (let offset = -2; offset <= (isMobile ? 6 : 8); offset += 1) {
        if (offset !== 0) add(sceneIndex, frameIndex + offset, Math.abs(offset) + 1);
      }

      const virtualFrame = Math.max(0, playhead.frame - sceneStarts[sceneIndex]);
      const sceneProgress = virtualFrame / (timelineFramesPerScene - 1);
      if (sceneIndex < activeScenes.length - 1 && sceneProgress > 0.72) {
        for (let index = 0; index < (isMobile ? 3 : 5); index += 1) add(sceneIndex + 1, index, 20 + index);
      }

      if (seedRepresentativeFrames) {
        activeScenes.forEach((sampledScene, sampledSceneIndex) => {
          [0.25, 0.5, 0.75, 1].forEach((fraction, sampleIndex) => {
            add(sampledSceneIndex, Math.round((sampledScene.count - 1) * fraction), 80 + sampleIndex);
          });
        });
        seedRepresentativeFrames = false;
      }

      const keys = new Set(wanted.map(({ sceneIndex: si, frameIndex: fi }) => `${si}:${fi}`));
      const priorities = new Map(wanted.map(({ sceneIndex: si, frameIndex: fi, priority }) => [`${si}:${fi}`, priority]));
      pendingQueue = pendingQueue
        .filter((request) => keys.has(`${request.sceneIndex}:${request.frameIndex}`) || request.priority >= 80)
        .map((request) => ({
          ...request,
          priority: Math.min(request.priority, priorities.get(`${request.sceneIndex}:${request.frameIndex}`) ?? request.priority),
        }));
      loaded.forEach((frames, si) => frames.forEach((entry, fi) => {
        if (entry.status === "queued" && entry.priority < 80 && !keys.has(`${si}:${fi}`)) frames.delete(fi);
      }));

      wanted.sort((a, b) => a.priority - b.priority);
      wanted.forEach((request) => {
        const existing = loaded[request.sceneIndex].get(request.frameIndex);
        if (existing) {
          if (existing.status === "queued") existing.priority = Math.min(existing.priority, request.priority);
          return;
        }
        loaded[request.sceneIndex].set(request.frameIndex, { status: "queued", priority: request.priority });
        pendingQueue.push(request);
      });
      pendingQueue.sort((a, b) => a.priority - b.priority);
      pumpQueue();
    };

    const drawCurrentFrame = () => {
      renderFrameId = 0;
      if (!active) return;
      const sceneIndex = getSceneIndex(playhead.frame);
      const scene = activeScenes[sceneIndex];
      const virtualFrame = Math.min(timelineFramesPerScene - 1, Math.max(0, playhead.frame - sceneStarts[sceneIndex]));
      const sceneFrame = Math.min(scene.count - 1, Math.round(virtualFrame / (timelineFramesPerScene - 1) * (scene.count - 1)));
      scheduleLoads(sceneIndex, sceneFrame);

      const images = loaded[sceneIndex];
      let entry = images.get(sceneFrame);
      if (entry?.status !== "ready" || !entry.image?.naturalWidth) {
        let closestDistance = Infinity;
        images.forEach((candidate, index) => {
          if (candidate.status === "ready" && candidate.image?.naturalWidth && Math.abs(index - sceneFrame) < closestDistance) {
            entry = candidate;
            closestDistance = Math.abs(index - sceneFrame);
          }
        });
      }
      const image = entry?.status === "ready" ? entry.image : undefined;
      if (!image?.naturalWidth) return;

      const ratio = Math.min(window.devicePixelRatio || 1, isMobile ? 1.35 : 1.6);
      const width = screen.clientWidth;
      const height = screen.clientHeight;
      const canvasWidth = Math.round(width * ratio);
      const canvasHeight = Math.round(height * ratio);
      if (target.width !== canvasWidth || target.height !== canvasHeight) {
        target.width = canvasWidth;
        target.height = canvasHeight;
      }
      const actualFrame = entry === images.get(sceneFrame)
        ? sceneFrame
        : [...images.entries()].find(([, candidate]) => candidate === entry)?.[0] ?? sceneFrame;
      if (lastDrawnScene === sceneIndex && lastDrawnFrame === actualFrame && lastCanvasWidth === canvasWidth && lastCanvasHeight === canvasHeight) return;
      lastDrawnScene = sceneIndex;
      lastDrawnFrame = actualFrame;
      lastCanvasWidth = canvasWidth;
      lastCanvasHeight = canvasHeight;
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

    const render = () => {
      if (!active || renderFrameId) return;
      renderFrameId = window.requestAnimationFrame(drawCurrentFrame);
    };

    const resetForViewport = () => {
      const nextIsMobile = mobileQuery.matches;
      if (nextIsMobile !== isMobile) {
        loaded.forEach((_, index) => releaseScene(index));
        pendingQueue = [];
        isMobile = nextIsMobile;
        maxConcurrentLoads = isMobile ? 2 : 3;
        maxCachedFrames = isMobile ? 14 : 18;
        activeScenes = getSceneSet(isMobile);
        loaded = activeScenes.map(() => new Map<number, FrameEntry>());
        seedRepresentativeFrames = true;
      }
      lastDrawnScene = -1;
      render();
    };

    // The first decoded frame is the on-canvas poster; remaining frames load
    // progressively around the playhead and through a small bounded queue.
    loaded[0].set(0, { status: "queued", priority: 0 });
    pendingQueue.push({ sceneIndex: 0, frameIndex: 0, priority: 0 });
    pumpQueue();
    render();
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
        scrub: 0.18,
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
                    if (!img.src.endsWith("/logo-1.png")) {
                      img.src = "/logo/logo-1.png";
                    } else if (!img.src.endsWith("/collection-assets/Ekkomi_logo_1.png")) {
                      img.src = "/collection-assets/Ekkomi_logo_1.png";
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
                <a href="#collection" onClick={closeMenu}>COLLECTION</a>
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
      <footer className="story-footer" id="contact">
        <div className="story-footer__inner">
          <div className="story-footer__brand">
            <span className="story-footer__wordmark">EKKOMI</span>
          </div>

          <nav className="story-footer__group" aria-label="Information">
            <h3 className="story-footer__heading">Information</h3>
            <a className="story-footer__link" href="https://shop.ekkomi.co.uk/policies/privacy-policy">Privacy Policy</a>
            <a className="story-footer__link" href="https://shop.ekkomi.co.uk/policies/terms-of-service">Terms of Service</a>
            <a className="story-footer__link" href="https://shop.ekkomi.co.uk/pages/contact">Contact Us</a>
            <Link className="story-footer__link" href="/faq">FAQ</Link>
          </nav>

          <nav className="story-footer__group" aria-label="About us">
            <h3 className="story-footer__heading">About Us</h3>
            <a className="story-footer__link" href="https://www.ekkomi.co.uk/">Story</a>
            <a className="story-footer__link" href="https://www.ekkomi.co.uk/collection">Collection</a>
            <Link className="story-footer__link" href="/products">Products</Link>
            <a className="story-footer__link" href="https://www.ekkomi.co.uk/journal">Journal</a>
          </nav>

          <nav className="story-footer__group" aria-label="Connect">
            <h3 className="story-footer__heading">Connect</h3>
            <a className="story-footer__link story-footer__social-link" href="https://instagram.com/ekkomi_official" target="_blank" rel="noopener noreferrer">
              <svg className="story-footer__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle className="story-footer__icon-dot" cx="17.7" cy="6.6" r=".8" /></svg>
              <span>Instagram</span>
            </a>
            <a className="story-footer__link story-footer__social-link" href="mailto:info@ekkomi.co.uk">
              <svg className="story-footer__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m4 7 8 6 8-6" /></svg>
              <span>Email</span>
            </a>
            <a className="story-footer__link story-footer__social-link" href="https://www.facebook.com/ekkomi" target="_blank" rel="noopener noreferrer">
              <svg className="story-footer__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.1 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.8-.1-1.7-.2-2.6-.2-2.6 0-4.4 1.6-4.4 4.6V10H8v3h2.4v8" /></svg>
              <span>Facebook</span>
            </a>
          </nav>
        </div>
        <div className="story-footer__bottom">
          <p className="story-footer__copyright">© 2026 EKKOMI. All rights reserved.</p>
          <button
            type="button"
            className="story-footer__settings"
            onClick={() => window.dispatchEvent(new CustomEvent("ekkomi:open-cookie-settings"))}
          >
            Cookie Preferences
          </button>
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




