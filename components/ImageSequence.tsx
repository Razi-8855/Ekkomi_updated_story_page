"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Props = { directory: string; count: number; start?: number; id: string; sceneNumber: number; fit?: "cover" | "contain" };

export default function ImageSequence({ directory, count, start = 1, id, sceneNumber, fit = "cover" }: Props) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = section.current, target = canvas.current;
    if (!host || !target) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = target.getContext("2d", { alpha: false });
    if (!ctx) return;
    let images: HTMLImageElement[] = [];
    let active = true;
    const state = { frame: 0 };
    const draw = (index: number) => {
      let img = images[Math.round(index)];
      if (!img?.complete || !img.naturalWidth) {
        for (let offset = 1; offset < images.length && (!img?.complete || !img.naturalWidth); offset++) {
          img = images[Math.round(index) - offset] ?? images[Math.round(index) + offset];
        }
      }
      if (!active || !img?.complete || !img.naturalWidth) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.6);
      const w = host.clientWidth, h = host.clientHeight;
      if (target.width !== Math.round(w * ratio) || target.height !== Math.round(h * ratio)) {
        target.width = Math.round(w * ratio);
        target.height = Math.round(h * ratio);
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.fillStyle = "#171715";
      ctx.fillRect(0, 0, w, h);
      const scale = fit === "cover"
        ? Math.max(w / img.naturalWidth, h / img.naturalHeight)
        : Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || images.length) return;
      images = Array.from({ length: count }, (_, i) => {
        const image = new Image();
        image.src = `${directory}/frame_${String(i + start).padStart(4, "0")}.webp`;
        image.onload = () => draw(state.frame);
        return image;
      });
    }, { rootMargin: "100% 0px" });
    observer.observe(host);

    const pin = host.querySelector<HTMLElement>(".sequence-pin");
    const animation = gsap.to(state, {
      frame: count - 1,
      ease: "none",
      onUpdate: () => draw(state.frame),
      scrollTrigger: {
        trigger: host,
        pin,
        start: "top top",
        end: `+=${Math.round(window.innerHeight * 2)}`,
        scrub: 0.25,
        invalidateOnRefresh: true,
      },
    });
    const resize = () => draw(state.frame);
    window.addEventListener("resize", resize);
    return () => {
      active = false;
      observer.disconnect();
      animation.scrollTrigger?.kill();
      animation.kill();
      window.removeEventListener("resize", resize);
      images = [];
    };
  }, [count, directory, fit, start]);

  return (
    <section className="sequence" id={id} ref={section} aria-label={`Fashion film scene ${sceneNumber}`}>
      <div className="sequence-pin"><canvas ref={canvas} /></div>
    </section>
  );
}
