"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { ShopifyCatalog } from "@/lib/shopify-storefront";

declare global {
  interface Window {
    gsap: typeof gsap;
    ekkomiCollectionRuntimeLoading?: boolean;
    initEkkomiCollection?: () => void;
    EKKOMI_SHOPIFY_CATALOG?: ShopifyCatalog;
  }
}

export default function CollectionExperience({
  markup,
  catalog,
  loadError,
}: {
  markup: string;
  catalog: ShopifyCatalog | null;
  loadError: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = root.current;
    if (!host) return;

    if (!catalog || loadError) {
      const showcase = host.querySelector<HTMLElement>("#productShowcase");
      if (showcase) {
        const message = document.createElement("p");
        message.className = "shopify-catalog-error";
        message.textContent =
          "The collection is temporarily unavailable. Please refresh in a few moments.";
        showcase.replaceChildren(message);
      }
      return;
    }

    window.EKKOMI_SHOPIFY_CATALOG = catalog;

    // The Collection interaction controller shares the app's installed GSAP instance.
    window.gsap = gsap;

    // Remove any previously cached script instance to guarantee fresh execution
    const existingScript = document.getElementById("ekkomi-collection-runtime-script");
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = "ekkomi-collection-runtime-script";
    script.src = `/collection-runtime.js?v=${Date.now()}`;
    script.async = false;
    script.onload = () => {
      if (typeof window.initEkkomiCollection === "function") {
        window.initEkkomiCollection();
      }
    };
    document.body.appendChild(script);
  }, [catalog, loadError]);

  return (
    <>
      <div id="collection-experience" ref={root} dangerouslySetInnerHTML={{ __html: markup }} />
    </>
  );
}
