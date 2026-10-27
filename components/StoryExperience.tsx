"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const scenes = [
  { directory: "/video-sequences/scene-1", count: 98, caption: ".story-caption--intro" },
  { directory: "/video-sequences/scene2", count: 192, caption: ".story-caption--detail" },
  { directory: "/video-sequences/scene3", count: 192, caption: ".story-caption--full-look" },
];

const baseSceneDuration = 2;
const introDuration = 1;
const captionFade = 0.12;
const captionHold = 1;
const finalHold = 1;
const sceneStarts = scenes.map((_, index) =>
  scenes.slice(0, index).reduce((total, scene) => total + scene.count, 0)
);
const sceneDurations = scenes.map((scene) => scene.count / scenes[0].count * baseSceneDuration);
const totalScrollUnits = introDuration +
  scenes.reduce((total, _, index) => total + captionFade * 2 + captionHold + sceneDurations[index], 0) +
  (scenes.length - 1) * 0.01 + 0.15 + finalHold;

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
    const loaded: HTMLImageElement[][] = scenes.map(() => []);
    const loading = new Set<number>();
    const playhead = { frame: 0 };
    let active = true;

    const loadScene = (sceneIndex: number) => {
      if (sceneIndex < 0 || sceneIndex >= scenes.length || loading.has(sceneIndex)) return;
      loading.add(sceneIndex);
      const scene = scenes[sceneIndex];
      loaded[sceneIndex] = Array.from({ length: scene.count }, (_, index) => {
        const image = new Image();
        image.onload = render;
        image.src = `${scene.directory}/frame_${String(index + 1).padStart(4, "0")}.webp`;
        return image;
      });
    };

    const render = () => {
      if (!active) return;
      let sceneIndex = scenes.length - 1;
      for (let index = 0; index < scenes.length - 1; index++) {
        if (playhead.frame < sceneStarts[index + 1]) {
          sceneIndex = index;
          break;
        }
      }
      const sceneFrame = Math.min(
        scenes[sceneIndex].count - 1,
        Math.max(0, Math.round(playhead.frame - sceneStarts[sceneIndex]))
      );
      loadScene(sceneIndex);
      loadScene(sceneIndex + 1);

      const images = loaded[sceneIndex];
      let image = images[sceneFrame];
      if (!image?.complete || !image.naturalWidth) {
        for (let offset = 1; offset < images.length && (!image?.complete || !image.naturalWidth); offset++) {
          image = images[sceneFrame - offset] ?? images[sceneFrame + offset];
        }
      }
      if (!image?.complete || !image.naturalWidth) return;

      const ratio = Math.min(window.devicePixelRatio || 1, 1.6);
      const width = screen.clientWidth;
      const height = screen.clientHeight;
      if (target.width !== Math.round(width * ratio) || target.height !== Math.round(height * ratio)) {
        target.width = Math.round(width * ratio);
        target.height = Math.round(height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.fillStyle = "#171715";
      context.fillRect(0, 0, width, height);
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    };

    loadScene(0);
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
        end: () => `+=${Math.round(window.innerHeight * totalScrollUnits)}`,
        scrub: 0.4,
        invalidateOnRefresh: true,
        onUpdate: syncHeaderState,
        onRefresh: syncHeaderState,
      },
    });

    timeline.to(".hero-overlay", { y: () => -window.innerHeight * 1.1, duration: introDuration, ease: "none" }, 0);
    let timelinePosition = introDuration;

    scenes.forEach((scene, index) => {
      timeline.to(scene.caption, { autoAlpha: 1, duration: captionFade, ease: "none" }, timelinePosition);
      timelinePosition += captionFade + captionHold;
      timeline.to(scene.caption, { autoAlpha: 0, duration: captionFade, ease: "none" }, timelinePosition);
      timelinePosition += captionFade;

      const firstFrame = sceneStarts[index];
      timeline.to(playhead, {
        frame: firstFrame + scene.count - 1,
        duration: sceneDurations[index],
        ease: "none",
        onUpdate: render,
      }, timelinePosition);
      timelinePosition += sceneDurations[index];

      if (index < scenes.length - 1) {
        timeline.to(playhead, {
          frame: firstFrame + scene.count,
          duration: 0.01,
          ease: "none",
          onUpdate: render,
        }, timelinePosition);
        timelinePosition += 0.01;
      }
    });

    timeline.to(".story-caption--final", { autoAlpha: 1, duration: 0.15, ease: "none" }, timelinePosition);
    timeline.to(playhead, {
      frame: scenes.reduce((total, scene) => total + scene.count, 0) - 1,
      duration: finalHold,
      ease: "none",
      onUpdate: render,
    }, timelinePosition);

    const resize = () => render();
    window.addEventListener("resize", resize);
    return () => {
      active = false;
      window.removeEventListener("resize", resize);
      host.querySelector(".site-header")?.classList.remove("is-scrolled");
      timeline.scrollTrigger?.kill();
      timeline.kill();
      loaded.forEach((images) => images.forEach((image) => {
        image.onload = null;
        image.src = "";
      }));
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
                <img src="/logo/logo.svg" alt="EKKOMI" />
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
          <div className="footer-bottom">
            <span>© 2026 EKKOMI. All rights reserved.</span>
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
        <a className="closing-button" href="#collection">
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
