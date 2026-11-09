"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShopifyCart } from "@/lib/shopify-cart";

declare global {
  interface Window {
    dispatchEvent(event: Event): boolean;
  }
}

const EMPTY_CART: ShopifyCart = {
  lines: [],
  totalQuantity: 0,
  subtotal: { amount: "0.00", currencyCode: "GBP" },
  checkoutUrl: "",
};

type ApiResult = { cart?: ShopifyCart; error?: string; checkoutUrl?: string };

export default function ShopifyCartUI() {
  const [cart, setCart] = useState<ShopifyCart>(EMPTY_CART);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/shopify/cart", { cache: "no-store" });
    const result = await response.json() as ApiResult;
    if (!response.ok) throw new Error(result.error || "Your bag could not be loaded.");
    setCart(result.cart ?? EMPTY_CART);
  }, []);

  const runLineAction = useCallback(async (url: string, method: "PATCH" | "DELETE", body: object) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(body),
      });
      const result = await response.json() as ApiResult;
      if (!response.ok) throw new Error(result.error || "The cart could not be updated.");
      setCart(result.cart ?? EMPTY_CART);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The cart could not be updated.");
      await refresh().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  useEffect(() => {
    void refresh().catch(() => setError("Your bag could not be loaded. Please try again."));
    const onOpen = () => { setError(""); setOpen(true); };
    const onCartUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ cart?: ShopifyCart; open?: boolean }>).detail;
      if (detail?.cart) setCart(detail.cart);
      if (detail?.open) { setError(""); setOpen(true); }
    };
    document.addEventListener("click", onOpenClick);
    window.addEventListener("ekkomi:cart-updated", onCartUpdated);
    function onOpenClick(event: Event) {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-ekkomi-cart-open]")) onOpen();
    }
    return () => {
      document.removeEventListener("click", onOpenClick);
      window.removeEventListener("ekkomi:cart-updated", onCartUpdated);
    };
  }, [refresh]);

  useEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-ekkomi-cart-count]").forEach((node) => {
      node.textContent = String(cart.totalQuantity);
      node.closest("button")?.setAttribute("aria-label", `Open shopping bag, ${cart.totalQuantity} items`);
    });
  }, [cart.totalQuantity]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const checkout = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/shopify/cart/checkout", { method: "POST", cache: "no-store" });
      const result = await response.json() as ApiResult;
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error || "Checkout could not be opened.");
      window.location.assign(result.checkoutUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Checkout could not be opened.");
      setBusy(false);
      await refresh().catch(() => undefined);
    }
  };

  return (
    <>
      {open && <div className="ekkomi-cart-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside className={`ekkomi-cart-drawer${open ? " is-open" : ""}`} aria-label="Your shopping bag" aria-modal={open} role="dialog" aria-hidden={!open}>
        <div className="ekkomi-cart-header">
          <div>
            <p className="ekkomi-cart-kicker">EKKOMI</p>
            <h2>YOUR BAG <span>({cart.totalQuantity})</span></h2>
          </div>
          <button type="button" className="ekkomi-cart-close" onClick={() => setOpen(false)} aria-label="Close bag">×</button>
        </div>

        <div className="ekkomi-cart-body" aria-live="polite">
          {error && <p className="ekkomi-cart-error" role="alert">{error}</p>}
          {cart.lines.length === 0 ? (
            <div className="ekkomi-cart-empty">
              <p>Your bag is currently empty.</p>
              <button type="button" onClick={() => setOpen(false)}>CONTINUE SHOPPING</button>
            </div>
          ) : cart.lines.map((line) => (
            <article className="ekkomi-cart-line" key={line.id}>
              <div className="ekkomi-cart-image">
                {line.image?.url && <img src={line.image.url} alt={line.image.altText || line.name} />}
              </div>
              <div className="ekkomi-cart-line-info">
                <div className="ekkomi-cart-line-heading">
                  <div><h3>{line.name}</h3><p>SIZE {line.size}</p></div>
                  <strong>{formatMoney(line.lineTotal.amount, line.lineTotal.currencyCode)}</strong>
                </div>
                <p className="ekkomi-cart-unit-price">{formatMoney(line.unitPrice.amount, line.unitPrice.currencyCode)} each</p>
                <div className="ekkomi-cart-line-actions">
                  <div className="ekkomi-cart-quantity" aria-label={`Quantity ${line.quantity}`}>
                    <button type="button" disabled={busy || line.quantity <= 1} onClick={() => void runLineAction("/api/shopify/cart/lines", "PATCH", { lineId: line.id, quantity: line.quantity - 1 })} aria-label="Decrease quantity">−</button>
                    <span>{line.quantity}</span>
                    <button type="button" disabled={busy} onClick={() => void runLineAction("/api/shopify/cart/lines", "PATCH", { lineId: line.id, quantity: line.quantity + 1 })} aria-label="Increase quantity">+</button>
                  </div>
                  <button type="button" className="ekkomi-cart-remove" disabled={busy} onClick={() => void runLineAction("/api/shopify/cart/lines", "DELETE", { lineId: line.id })}>REMOVE</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {cart.lines.length > 0 && <div className="ekkomi-cart-footer">
          <div className="ekkomi-cart-subtotal"><span>SUBTOTAL</span><strong>{formatMoney(cart.subtotal.amount, cart.subtotal.currencyCode)}</strong></div>
          <p className="ekkomi-cart-tax-note">Taxes and delivery are calculated at checkout.</p>
          <div className="ekkomi-cart-delivery" aria-label="Delivery information">
            <span className="ekkomi-cart-delivery-title">DELIVERY INFORMATION</span>
            <p className="ekkomi-cart-delivery-text">Estimated delivery: 7–10 days across the UK.</p>
          </div>
          <button type="button" className="ekkomi-cart-checkout" onClick={() => void checkout()} disabled={busy}>PROCEED TO CHECKOUT</button>
          <button type="button" className="ekkomi-cart-continue" onClick={() => setOpen(false)}>CONTINUE SHOPPING</button>
        </div>}
      </aside>
    </>
  );
}

function formatMoney(amount: string, currencyCode: string) {
  const value = Number(amount);
  try { return new Intl.NumberFormat("en-GB", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(value); }
  catch { return `${currencyCode} ${amount}`; }
}
