"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const scenes = [
  {
    desktop: "/desktop-videos/scene1-desktop.mp4",
    mobile: "/mobile-videos/scene1-mobile.mp4",
    desktopPoster: "/desktop-videos/scene1-desktop-poster.jpg",
    mobilePoster: "/mobile-videos/scene1-mobile-poster.jpg",
    caption: ".story-caption--intro",
  },
  {
    desktop: "/desktop-videos/scene2-desktop.mp4",
    mobile: "/mobile-videos/scene2-mobile.mp4",
    caption: ".story-caption--detail",
  },
  {
    desktop: "/desktop-videos/scene3-desktop.mp4",
    mobile: "/mobile-videos/scene3-mobile.mp4",
    caption: ".story-caption--full-look",
  },
] as const;

const FINAL_CAPTION = ".story-caption--final";
const STORY_TRIGGER_ID = "ekkomi-story-video";
const LAST_PIN_STEP = 8;

type StoryStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

function captionForStage(stage: StoryStage) {
  if (stage === 1) return scenes[0].caption;
  if (stage === 3) return scenes[1].caption;
  if (stage === 5) return scenes[2].caption;
  if (stage === 7) return FINAL_CAPTION;
  return null;
}

function videoSceneForStage(stage: StoryStage) {
  if (stage === 2) return 0;
  if (stage === 4) return 1;
  if (stage === 6) return 2;
  return null;
}

function getVideoPath(sceneIndex: number, isMobile: boolean) {
  const scene = scenes[sceneIndex];
  return isMobile ? scene.mobile : scene.desktop;
}

function getPosterPath(isMobile: boolean) {
  return isMobile ? scenes[0].mobilePoster : scenes[0].desktopPoster;
}

export default function StoryExperience() {
  const shell = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const freezeFrame = useRef<HTMLCanvasElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [storyStage, setStoryStageState] = useState<StoryStage>(0);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState("");

  const storyStageRef = useRef<StoryStage>(0);
  const mobileAssetRef = useRef(false);
  const currentVideoSceneRef = useRef(0);
  const playingSceneRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const transitioningRef = useRef(false);
  const finishedRef = useRef(false);
  const playbackTokenRef = useRef(0);
  const transitionTimerRef = useRef<number | null>(null);
  const currentCaptionRef = useRef<string | null>(null);
  const expectedScrollStepRef = useRef(0);
  const programmaticScrollUntilRef = useRef(0);

  const updateStage = useCallback((nextStage: StoryStage) => {
    storyStageRef.current = nextStage;
    setStoryStageState(nextStage);
  }, []);

  useEffect(() => {
    const host = shell.current;
    const screen = stage.current;
    const video = videoRef.current;
    const frame = freezeFrame.current;
    const frameContext = frame?.getContext("2d", { alpha: false });
    if (!host || !screen || !video || !frame || !frameContext) return;

    gsap.registerPlugin(ScrollTrigger);

    const mobileQuery = window.matchMedia(
      "(max-width: 767px), (max-width: 1023px) and (orientation: portrait), (pointer: coarse)",
    );
    mobileAssetRef.current = mobileQuery.matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    host.classList.add("story-sequence-active");

    let active = true;
    let videoLoadTimer: number | null = null;
    let activeLoadCleanup: (() => void) | null = null;

    const clearTransitionTimer = () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };

    const setSource = (sceneIndex: number, isMobile = mobileAssetRef.current) => {
      const nextSource = getVideoPath(sceneIndex, isMobile);
      currentVideoSceneRef.current = sceneIndex;
      if (video.dataset.source === nextSource) return;
      activeLoadCleanup?.();
      activeLoadCleanup = null;
      if (videoLoadTimer !== null) window.clearTimeout(videoLoadTimer);
      video.pause();
      video.preload = "metadata";
      video.dataset.source = nextSource;
      video.poster = getPosterPath(isMobile);
      video.src = nextSource;
      video.load();
    };

    const waitUntilPlayable = (sceneIndex: number, token: number, retry = false) => new Promise<boolean>((resolve) => {
      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA && currentVideoSceneRef.current === sceneIndex) {
        resolve(true);
        return;
      }
      if (video.error && !retry) {
        resolve(false);
        return;
      }

      let settled = false;
      const settle = (ready: boolean) => {
        if (settled) return;
        settled = true;
        activeLoadCleanup?.();
        activeLoadCleanup = null;
        if (videoLoadTimer !== null) window.clearTimeout(videoLoadTimer);
        videoLoadTimer = null;
        resolve(ready && active && token === playbackTokenRef.current);
      };
      const onCanPlay = () => settle(true);
      const onError = () => settle(false);
      activeLoadCleanup = () => {
        video.removeEventListener("canplay", onCanPlay);
        video.removeEventListener("error", onError);
      };
      video.addEventListener("canplay", onCanPlay, { once: true });
      video.addEventListener("error", onError, { once: true });
      videoLoadTimer = window.setTimeout(() => settle(false), 20000);
    });

    const scrollToStep = (step: number, duration = 0.48) => {
      expectedScrollStepRef.current = step;
      programmaticScrollUntilRef.current = performance.now() + duration * 1000 + 180;
      window.dispatchEvent(new CustomEvent("ekkomi:story-scroll-to", {
        detail: { step, duration },
      }));
    };

    const setTransitioning = (durationMs: number, onComplete?: () => void) => {
      clearTransitionTimer();
      transitioningRef.current = true;
      transitionTimerRef.current = window.setTimeout(() => {
        transitioningRef.current = false;
        transitionTimerRef.current = null;
        onComplete?.();
      }, durationMs);
    };

    const transitionCaption = (nextSelector: string | null) => {
      const previousSelector = currentCaptionRef.current;
      const timeline = gsap.timeline();
      if (previousSelector && previousSelector !== nextSelector) {
        timeline.to(host.querySelector(previousSelector), {
          autoAlpha: 0,
          y: prefersReducedMotion ? 0 : 12,
          duration: prefersReducedMotion ? 0 : 0.3,
          ease: "power2.out",
        });
      }
      if (nextSelector) {
        const nextCaption = host.querySelector(nextSelector);
        timeline.fromTo(nextCaption,
          { autoAlpha: 0, y: prefersReducedMotion ? 0 : 18 },
          { autoAlpha: 1, y: 0, duration: prefersReducedMotion ? 0 : 0.65, ease: "power2.out" },
          previousSelector && previousSelector !== nextSelector ? ">-0.08" : 0,
        );
      }
      currentCaptionRef.current = nextSelector;
      return timeline;
    };

    const changeStage = (nextStage: StoryStage, scrollStep: number, caption: string | null) => {
      updateStage(nextStage);
      const firstTagline = nextStage === 1;
      const heroOverlay = host.querySelector<HTMLElement>(".hero-overlay");
      const heroShade = host.querySelector<HTMLElement>(".hero-shade");
      if (firstTagline && heroOverlay) {
        gsap.to(heroOverlay, {
          y: -screen.clientHeight * 1.1,
          autoAlpha: 0,
          duration: prefersReducedMotion ? 0 : 0.65,
          ease: "power2.inOut",
        });
        if (heroShade) gsap.to(heroShade, { autoAlpha: 0, duration: prefersReducedMotion ? 0 : 0.55, ease: "none" });
      }
      const captionTimeline = transitionCaption(caption);
      scrollToStep(scrollStep, prefersReducedMotion ? 0 : 0.48);
      const wait = Math.max(700, captionTimeline.duration() * 1000 + 100);
      setTransitioning(prefersReducedMotion ? 0 : wait);
    };

    const revealNextTagline = (completedScene: number, hasCompletedFrame = true) => {
      playingRef.current = false;
      playingSceneRef.current = null;
      setVideoLoading(false);
      setVideoError("");
      video.classList.remove("is-visible");
      if (hasCompletedFrame || completedScene > 0) frame.classList.add("is-visible");
      else frame.classList.remove("is-visible");

      if (completedScene === 0) {
        setSource(1);
        changeStage(3, 3, scenes[1].caption);
      } else if (completedScene === 1) {
        setSource(2);
        changeStage(5, 5, scenes[2].caption);
      } else {
        changeStage(7, 7, FINAL_CAPTION);
      }
    };

    const captureFinalFrame = () => {
      if (!video.videoWidth || !video.videoHeight) return false;
      frame.width = video.videoWidth;
      frame.height = video.videoHeight;
      frameContext.drawImage(video, 0, 0, frame.width, frame.height);
      return true;
    };

    const handleVideoEnded = () => {
      const completedScene = playingSceneRef.current;
      if (completedScene === null) return;
      video.pause();
      captureFinalFrame();
      revealNextTagline(completedScene);
    };

    const completeAfterFallback = () => {
      const failedScene = playingSceneRef.current;
      if (failedScene === null) return;
      const hasFrame = captureFinalFrame();
      revealNextTagline(failedScene, hasFrame);
    };

    const startPlayback = async (sceneIndex: number, retry = false) => {
      const playStage = (sceneIndex * 2 + 2) as StoryStage;
      updateStage(playStage);
      transitionCaption(null);
      playingSceneRef.current = sceneIndex;
      playingRef.current = true;
      setVideoError("");
      setVideoLoading(true);
      setTransitioning(20000);
      scrollToStep(playStage);
      setSource(sceneIndex);
      const token = ++playbackTokenRef.current;
      video.preload = "auto";
      const shouldReload = video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA || !!video.error;
      const playablePromise = waitUntilPlayable(sceneIndex, token, retry || !!video.error);
      if (shouldReload) video.load();

      const canPlay = await playablePromise;
      if (!active || token !== playbackTokenRef.current) return;
      if (!canPlay) {
        playingRef.current = false;
        setVideoLoading(false);
        setVideoError("This film could not be loaded. Please retry, or continue to the next scene.");
        transitioningRef.current = false;
        clearTransitionTimer();
        return;
      }

      try {
        video.currentTime = 0;
        await video.play();
        if (!active || token !== playbackTokenRef.current) return;
        setVideoLoading(false);
        video.classList.add("is-visible");
        host.querySelector(".story-poster")?.classList.add("is-hidden");
        frame.classList.remove("is-visible");
        clearTransitionTimer();
        transitioningRef.current = false;
      } catch {
        playingRef.current = false;
        setVideoLoading(false);
        setVideoError("Playback was blocked by this browser. Retry the film or continue to the next scene.");
        transitioningRef.current = false;
        clearTransitionTimer();
      }
    };

    const retryPlayback = () => {
      const sceneIndex = playingSceneRef.current;
      if (sceneIndex === null) return;
      void startPlayback(sceneIndex, true);
    };

    const resetToHero = () => {
      if (playingRef.current || transitioningRef.current) return;
      playbackTokenRef.current += 1;
      playingSceneRef.current = null;
      playingRef.current = false;
      finishedRef.current = false;
      setVideoLoading(false);
      setVideoError("");
      video.pause();
      video.classList.remove("is-visible");
      frame.classList.remove("is-visible");
      frameContext.clearRect(0, 0, frame.width, frame.height);
      host.querySelector(".story-poster")?.classList.remove("is-hidden");
      setSource(0);
      transitionCaption(null);
      const heroOverlay = host.querySelector<HTMLElement>(".hero-overlay");
      const heroShade = host.querySelector<HTMLElement>(".hero-shade");
      if (heroOverlay) gsap.to(heroOverlay, { y: 0, autoAlpha: 1, duration: prefersReducedMotion ? 0 : 0.55, ease: "power2.out" });
      if (heroShade) gsap.to(heroShade, { autoAlpha: 1, duration: prefersReducedMotion ? 0 : 0.5, ease: "none" });
      updateStage(0);
      scrollToStep(0, prefersReducedMotion ? 0 : 0.48);
      setTransitioning(prefersReducedMotion ? 0 : 700);
    };

    const finishStory = () => {
      finishedRef.current = true;
      host.classList.remove("story-sequence-active");
      updateStage(8);
      scrollToStep(LAST_PIN_STEP, 0.58);
    };

    const advanceStory = () => {
      if (transitioningRef.current || playingRef.current || finishedRef.current) return;
      const currentStage = storyStageRef.current;
      if (currentStage === 0) changeStage(1, 1, scenes[0].caption);
      else if (currentStage === 1) void startPlayback(0);
      else if (currentStage === 3) void startPlayback(1);
      else if (currentStage === 5) void startPlayback(2);
      else if (currentStage === 7) finishStory();
    };

    const handleWheel = (event: WheelEvent) => {
      const trigger = ScrollTrigger.getById(STORY_TRIGGER_ID);
      if (!trigger || finishedRef.current || window.scrollY < trigger.start - 2 || window.scrollY > trigger.end + 2) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.deltaY === 0) return;
      if (event.deltaY < 0 && storyStageRef.current === 0 && !playingRef.current && !transitioningRef.current) {
        host.classList.remove("story-sequence-active");
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      if (playingRef.current || transitioningRef.current) return;
      if (event.deltaY < 0) {
        if (storyStageRef.current > 0) resetToHero();
        return;
      }
      advanceStory();
    };

    let touchStartY: number | null = null;
    const handleTouchStart = (event: TouchEvent) => {
      const trigger = ScrollTrigger.getById(STORY_TRIGGER_ID);
      if (trigger && !finishedRef.current && window.scrollY >= trigger.start - 2 && window.scrollY <= trigger.end + 2) {
        event.stopImmediatePropagation();
      }
      if (event.touches.length !== 1) {
        touchStartY = null;
        return;
      }
      touchStartY = event.touches[0].clientY;
    };
    const handleTouchEnd = (event: TouchEvent) => {
      const trigger = ScrollTrigger.getById(STORY_TRIGGER_ID);
      if (trigger && !finishedRef.current && window.scrollY >= trigger.start - 2 && window.scrollY <= trigger.end + 2) {
        event.stopImmediatePropagation();
      }
      if (touchStartY === null || !event.changedTouches.length) return;
      const deltaY = touchStartY - event.changedTouches[0].clientY;
      touchStartY = null;
      if (Math.abs(deltaY) < 34) return;
      if (!trigger || finishedRef.current || window.scrollY < trigger.start - 2 || window.scrollY > trigger.end + 2) return;
      if (playingRef.current || transitioningRef.current) return;
      if (deltaY > 0) advanceStory();
      else if (storyStageRef.current > 0) resetToHero();
      else host.classList.remove("story-sequence-active");
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("a, button, input, textarea, select, [contenteditable='true']")) return;
      const forward = ["ArrowDown", "PageDown", " "].includes(event.key);
      const backward = ["ArrowUp", "PageUp"].includes(event.key);
      if (!forward && !backward) return;
      const trigger = ScrollTrigger.getById(STORY_TRIGGER_ID);
      if (!trigger || finishedRef.current || window.scrollY < trigger.start - 2 || window.scrollY > trigger.end + 2) return;
      if (backward && storyStageRef.current === 0 && !playingRef.current && !transitioningRef.current) {
        host.classList.remove("story-sequence-active");
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      if (playingRef.current || transitioningRef.current) return;
      if (forward) advanceStory();
      else if (storyStageRef.current > 0) resetToHero();
    };

    const handleStoryIntro = () => {
      if (storyStageRef.current === 0 && !transitioningRef.current && !playingRef.current) {
        changeStage(1, 1, scenes[0].caption);
      } else {
        scrollToStep(Math.max(1, storyStageRef.current));
      }
    };

    const updateHeader = (trigger: ScrollTrigger) => {
      host.querySelector(".site-header")?.classList.toggle("is-scrolled", trigger.scroll() > trigger.start + 8);
      if (finishedRef.current || playingRef.current || transitioningRef.current) return;
      if (performance.now() < programmaticScrollUntilRef.current) return;
      const expectedScroll = trigger.start + expectedScrollStepRef.current * window.innerHeight;
      if (Math.abs(trigger.scroll() - expectedScroll) > Math.max(24, window.innerHeight * 0.08)) {
        scrollToStep(expectedScrollStepRef.current, prefersReducedMotion ? 0 : 0.3);
      }
    };

    const skipStorySequence = () => {
      playbackTokenRef.current += 1;
      video.pause();
      playingRef.current = false;
      playingSceneRef.current = null;
      finishedRef.current = true;
      transitioningRef.current = false;
      clearTransitionTimer();
      setVideoLoading(false);
      setVideoError("");
      host.classList.remove("story-sequence-active");
      updateStage(8);
    };

    const pin = ScrollTrigger.create({
      id: STORY_TRIGGER_ID,
      trigger: host,
      pin: screen,
      start: "top top",
      end: () => `+=${Math.ceil(window.innerHeight * LAST_PIN_STEP)}`,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onUpdate: updateHeader,
      onRefresh: updateHeader,
      onEnter: () => { if (!finishedRef.current) host.classList.add("story-sequence-active"); },
      onEnterBack: () => { if (!finishedRef.current) host.classList.add("story-sequence-active"); },
      onLeaveBack: () => host.classList.remove("story-sequence-active"),
    });

    setSource(0);
    video.addEventListener("ended", handleVideoEnded);
    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true, capture: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true, capture: true });
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("ekkomi:story-intro", handleStoryIntro);
    window.addEventListener("ekkomi:story-skip", skipStorySequence);
    window.addEventListener("ekkomi:story-video-continue", completeAfterFallback);
    window.addEventListener("ekkomi:story-video-retry", retryPlayback);

    const handleViewportChange = () => {
      const nextIsMobile = mobileQuery.matches;
      if (nextIsMobile === mobileAssetRef.current) return;
      mobileAssetRef.current = nextIsMobile;
      if (!playingRef.current) setSource(currentVideoSceneRef.current, nextIsMobile);
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", handleViewportChange);
    mobileQuery.addEventListener("change", handleViewportChange);
    const resizeObserver = new ResizeObserver(() => ScrollTrigger.refresh());
    resizeObserver.observe(screen);

    return () => {
      active = false;
      playbackTokenRef.current += 1;
      clearTransitionTimer();
      if (videoLoadTimer !== null) window.clearTimeout(videoLoadTimer);
      activeLoadCleanup?.();
      resizeObserver.disconnect();
      mobileQuery.removeEventListener("change", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("wheel", handleWheel, true);
      window.removeEventListener("touchstart", handleTouchStart, true);
      window.removeEventListener("touchend", handleTouchEnd, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("ekkomi:story-intro", handleStoryIntro);
      window.removeEventListener("ekkomi:story-skip", skipStorySequence);
      window.removeEventListener("ekkomi:story-video-continue", completeAfterFallback);
      window.removeEventListener("ekkomi:story-video-retry", retryPlayback);
      video.removeEventListener("ended", handleVideoEnded);
      video.pause();
      video.removeAttribute("src");
      video.load();
      host.classList.remove("story-sequence-active");
      host.querySelector(".site-header")?.classList.remove("is-scrolled");
      pin.kill();
      gsap.killTweensOf(host.querySelectorAll(".hero-overlay, .hero-shade, .story-caption"));
    };
  }, [updateStage]);

  const closeMenu = () => setMenuOpen(false);
  const navigateToStorySection = () => {
    closeMenu();
    window.dispatchEvent(new CustomEvent("ekkomi:story-skip"));
  };
  const navigateToStoryIntro = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    closeMenu();
    window.history.pushState(null, "", "#story");
    window.dispatchEvent(new CustomEvent("ekkomi:story-intro"));
  };

  const handleVideoRetry = () => {
    setVideoError("");
    window.dispatchEvent(new CustomEvent("ekkomi:story-video-retry"));
  };

  const handleVideoContinue = () => {
    window.dispatchEvent(new CustomEvent("ekkomi:story-video-continue"));
  };

  return (
    <main>
      <section className="story-scroll" ref={shell} id="story">
        <div className="story-stage" ref={stage} data-story-stage={storyStage}>
          <picture className="story-poster">
            <source
              media="(max-width: 767px), (max-width: 1023px) and (orientation: portrait), (pointer: coarse)"
              srcSet="/mobile-videos/scene1-mobile-poster.jpg"
            />
            <img
              src="/desktop-videos/scene1-desktop-poster.jpg"
              alt=""
              fetchPriority="high"
              decoding="async"
              loading="eager"
            />
          </picture>
          <video
            ref={videoRef}
            className="story-video"
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
          <canvas className="story-freeze-frame" ref={freezeFrame} aria-hidden="true" />
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
                    if (!img.src.endsWith("/logo-1.png")) img.src = "/logo/logo-1.png";
                    else if (!img.src.endsWith("/collection-assets/Ekkomi_logo_1.png")) img.src = "/collection-assets/Ekkomi_logo_1.png";
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
                <a href="#collection" onClick={navigateToStorySection}>COLLECTION</a>
                <a href="#contact" onClick={navigateToStorySection}>CONTACT</a>
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

          {(videoLoading || videoError) && (
            <div className="story-video-status" role={videoError ? "alert" : "status"}>
              {videoError ? (
                <>
                  <p>{videoError}</p>
                  <div className="story-video-status__actions">
                    <button type="button" onClick={handleVideoRetry}>RETRY VIDEO</button>
                    <button type="button" onClick={handleVideoContinue}>CONTINUE</button>
                  </div>
                </>
              ) : <p>Loading the film…</p>}
            </div>
          )}
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
