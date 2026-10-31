"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const CONSENT_STORAGE_KEY = "ekkomi_cookie_consent";
const DRAFT_STORAGE_KEY = "ekkomi_waitlist_draft";
const POLICY_VERSION = "2026-10-v2";
const CONSENT_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;

type ConsentChoice = {
  necessary: true;
  functional: boolean;
  timestamp: string;
  expiresAt: number;
  policyVersion: string;
};

function readConsent(): ConsentChoice | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<ConsentChoice>;
    if (
      value.necessary !== true ||
      typeof value.functional !== "boolean" ||
      typeof value.timestamp !== "string" ||
      value.policyVersion !== POLICY_VERSION ||
      typeof value.expiresAt !== "number" ||
      value.expiresAt <= Date.now()
    ) return null;
    return value as ConsentChoice;
  } catch {
    return null;
  }
}

export default function CookieConsentManager() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const choiceRef = useRef<ConsentChoice | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const saved = readConsent();
    choiceRef.current = saved;
    setChoice(saved);
    setFunctional(saved?.functional ?? false);
    setOpen(!saved);
    setReady(true);

    if (!saved || !saved.functional) {
      try { window.localStorage.removeItem(DRAFT_STORAGE_KEY); } catch { }
    }

    const openSettings = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest<HTMLElement>("[data-cookie-settings-trigger]");
      if (!trigger) return;
      event.preventDefault();
      returnFocus.current = trigger;
      setFunctional(choiceRef.current?.functional ?? false);
      setPreferencesOpen(true);
      setOpen(true);
    };
    // The footer lives in server-provided markup and its controller also attaches
    // delegated listeners. Capture at document level so Cookie Settings remains
    // reliable after the dialog has been dismissed and the page has refreshed.
    document.addEventListener("click", openSettings, true);
    return () => document.removeEventListener("click", openSettings, true);
  }, []);

  useEffect(() => {
    if (!ready || !open) {
      if (ready && !open && returnFocus.current) {
        returnFocus.current.focus();
        returnFocus.current = null;
      }
      return;
    }

    const dialog = document.getElementById("ekkomi-privacy-dialog");
    if (!dialog) return;
    const focusable = () => Array.from(
      dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])')
    );
    focusable()[0]?.focus();

    const handleKeys = (event: KeyboardEvent) => {
      const items = focusable();
      if (event.key === "Escape" && choiceRef.current) {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", handleKeys);
    return () => dialog.removeEventListener("keydown", handleKeys);
  }, [open, ready, preferencesOpen]);

  const saveChoice = (allowFunctional: boolean) => {
    const next: ConsentChoice = {
      necessary: true,
      functional: allowFunctional,
      timestamp: new Date().toISOString(),
      expiresAt: Date.now() + CONSENT_LIFETIME_MS,
      policyVersion: POLICY_VERSION,
    };
    choiceRef.current = next;
    setChoice(next);
    setFunctional(allowFunctional);
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
      if (!allowFunctional) window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch { }
    setOpen(false);
  };

  if (!ready || !open || typeof document === "undefined") return null;

  return createPortal(
    <div id="ekkomi-consent-root">
      <div className="privacy-backdrop">
        <section
          className="privacy-dialog"
          id="ekkomi-privacy-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-title"
          aria-describedby="privacy-description"
        >
          <div className="privacy-mark" aria-hidden="true"><span /><span /><span /></div>
          <p className="privacy-eyebrow">EKKOMI · NOCTURNE</p>
          <h2 id="privacy-title">Your Privacy Matters</h2>
          {!preferencesOpen ? (
            <>
              <p className="privacy-copy" id="privacy-description">
                We use essential browser storage to remember your privacy choice. With your permission, the Collection page can save waitlist form details on this device so you can recover them after an interrupted submission. We do not use analytics or advertising tracking.
              </p>
              <div className="privacy-actions privacy-actions--summary">
                <button type="button" className="privacy-button privacy-button--primary" onClick={() => saveChoice(true)}>Accept All</button>
                <button type="button" className="privacy-button" onClick={() => saveChoice(false)}>Reject All</button>
                <button type="button" className="privacy-button" onClick={() => { setFunctional(choice?.functional ?? false); setPreferencesOpen(true); }}>Manage Preferences</button>
              </div>
            </>
          ) : (
            <>
              <p className="privacy-copy" id="privacy-description">
                Choose whether the Collection page may save a waitlist form draft on this device. This is separate from the opt-in to receive product availability emails when you submit the waitlist.
              </p>
              <div className="privacy-categories">
                <div className="privacy-category">
                  <div>
                    <h3>Strictly Necessary</h3>
                    <p>Stores your privacy choice so we can remember it. Always active.</p>
                  </div>
                  <label className="privacy-switch">
                    <span className="visually-hidden">Strictly Necessary storage is always active</span>
                    <input type="checkbox" role="switch" checked disabled readOnly />
                    <span className="privacy-switch-ui" aria-hidden="true" />
                  </label>
                </div>
                <div className="privacy-category">
                  <div>
                    <h3>Functional</h3>
                    <p>Saves the waitlist details you enter on this device for up to seven days after an interrupted submission. A successful submission or withdrawal clears the saved draft.</p>
                  </div>
                  <label className="privacy-switch">
                    <span className="visually-hidden">Allow Functional storage for waitlist drafts</span>
                    <input type="checkbox" role="switch" checked={functional} onChange={(event) => setFunctional(event.target.checked)} />
                    <span className="privacy-switch-ui" aria-hidden="true" />
                  </label>
                </div>
              </div>
              <p className="privacy-note">
                We do not currently use analytics, advertising pixels, or Shopify tracking. When you submit the waitlist, your form details are sent to Supabase for registration and may be used by Resend to send the requested emails.
              </p>
              <div className="privacy-actions">
                <button type="button" className="privacy-button privacy-button--primary" onClick={() => saveChoice(functional)}>Save My Preferences</button>
                <button type="button" className="privacy-button" onClick={() => saveChoice(true)}>Accept All</button>
                <button type="button" className="privacy-button" onClick={() => saveChoice(false)}>Reject All</button>
              </div>
            </>
          )}
          <p className="privacy-footnote">You can change your choice at any time using Cookie Settings in the footer.</p>
        </section>
      </div>
    </div>,
    document.body
  );
}



