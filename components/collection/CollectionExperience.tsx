"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

declare global {
  interface Window {
    gsap: typeof gsap;
    ekkomiCollectionRuntimeLoading?: boolean;
  }
}

export default function CollectionExperience({ markup }: { markup: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = root.current;
    if (!host) return;

    // The Collection's existing interaction controller uses GSAP's browser global.
    // Reuse the same installed GSAP instance as the Story experience.
    window.gsap = gsap;

    if (window.ekkomiCollectionRuntimeLoading) return;
    window.ekkomiCollectionRuntimeLoading = true;

    const script = document.createElement("script");
    script.src = "/collection-runtime.js";
    script.async = false;
    document.body.appendChild(script);
  }, []);

  return <div id="collection-experience" ref={root} dangerouslySetInnerHTML={{ __html: markup }} />;
}
