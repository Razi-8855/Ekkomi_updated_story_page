"use client";

import { useEffect, useState, useId, useCallback } from "react";

export interface CookiePreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: string;
  version: number;
}

const STORAGE_KEY = "ekkomi_consent_v1";
const COOKIE_NAME = "ekkomi_consent";
const CURRENT_VERSION = 1;

declare global {
  interface Window {
    EkkomiConsent?: {
      getConsent: () => CookiePreferences | null;
      hasConsent: (category: "analytics" | "marketing" | "functional") => boolean;
      openSettings: () => void;
      acceptAll: () => void;
      rejectNonEssential: () => void;
    };
  }
}

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPolicyNotice, setShowPolicyNotice] = useState(false);

  // Category toggle states for the settings modal
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [functionalEnabled, setFunctionalEnabled] = useState(false);

  const analyticsSwitchId = useId();
  const marketingSwitchId = useId();
  const functionalSwitchId = useId();

  // Helper to read stored consent
  const readStoredConsent = useCallback((): CookiePreferences | null => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CookiePreferences;
        if (parsed && parsed.version === CURRENT_VERSION && parsed.timestamp) {
          return parsed;
        }
      }
      // Fallback check in document.cookie
      const match = document.cookie.match(new RegExp(`(^|;\\s*)${COOKIE_NAME}=([^;]+)`));
      if (match) {
        const parsed = JSON.parse(decodeURIComponent(match[2])) as CookiePreferences;
        if (parsed && parsed.version === CURRENT_VERSION && parsed.timestamp) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }, []);

  // Helper to activate any scripts conditionally waiting for consent
  const triggerScriptActivation = useCallback((prefs: CookiePreferences) => {
    if (typeof window === "undefined") return;

    // Dispatch global event for listeners / tag managers
    window.dispatchEvent(new CustomEvent("ekkomi:consent-updated", { detail: prefs }));

    // Activate any script elements tagged with data-cookie-category
    const pendingScripts = document.querySelectorAll<HTMLScriptElement>("script[data-cookie-category]");
    pendingScripts.forEach((script) => {
      const category = script.getAttribute("data-cookie-category") as "analytics" | "marketing" | "functional";
      if (category && prefs[category]) {
        if (script.getAttribute("type") === "text/plain") {
          const newScript = document.createElement("script");
          Array.from(script.attributes).forEach((attr) => {
            if (attr.name !== "type" && attr.name !== "data-cookie-category") {
              newScript.setAttribute(attr.name, attr.value);
            }
          });
          newScript.type = "text/javascript";
          newScript.innerHTML = script.innerHTML;
          script.parentNode?.replaceChild(newScript, script);
        }
      }
    });
  }, []);

  // Commit consent to localStorage and cookie
  const commitConsent = useCallback((analytics: boolean, marketing: boolean, functional: boolean) => {
    const prefs: CookiePreferences = {
      necessary: true,
      analytics,
      marketing,
      functional,
      timestamp: new Date().toISOString(),
      version: CURRENT_VERSION,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      const serialized = encodeURIComponent(JSON.stringify(prefs));
      // Expire in 1 year (365 days)
      document.cookie = `${COOKIE_NAME}=${serialized}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Storage might be restricted
    }

    triggerScriptActivation(prefs);
    setShowBanner(false);
    setShowSettings(false);
  }, [triggerScriptActivation]);

  const handleAcceptAll = useCallback(() => {
    commitConsent(true, true, true);
  }, [commitConsent]);

  const handleRejectNonEssential = useCallback(() => {
    commitConsent(false, false, false);
  }, [commitConsent]);

  const handleSavePreferences = useCallback(() => {
    commitConsent(analyticsEnabled, marketingEnabled, functionalEnabled);
  }, [commitConsent, analyticsEnabled, marketingEnabled, functionalEnabled]);

  const handleOpenSettings = useCallback(() => {
    const existing = readStoredConsent();
    if (existing) {
      setAnalyticsEnabled(existing.analytics);
      setMarketingEnabled(existing.marketing);
      setFunctionalEnabled(existing.functional);
    } else {
      setAnalyticsEnabled(false);
      setMarketingEnabled(false);
      setFunctionalEnabled(false);
    }
    setShowSettings(true);
  }, [readStoredConsent]);

  // Initial setup & global listener registration
  useEffect(() => {
    setMounted(true);
    const stored = readStoredConsent();

    if (stored) {
      setAnalyticsEnabled(stored.analytics);
      setMarketingEnabled(stored.marketing);
      setFunctionalEnabled(stored.functional);
      triggerScriptActivation(stored);
    } else {
      // Subtle delay before revealing the banner for a smooth, premium entrance
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [readStoredConsent, triggerScriptActivation]);

  // Expose global window API and attach custom event listener for footer buttons
  useEffect(() => {
    window.EkkomiConsent = {
      getConsent: () => readStoredConsent(),
      hasConsent: (category) => {
        const c = readStoredConsent();
        return c ? Boolean(c[category]) : false;
      },
      openSettings: () => handleOpenSettings(),
      acceptAll: () => handleAcceptAll(),
      rejectNonEssential: () => handleRejectNonEssential(),
    };

    const onOpenEvent = () => handleOpenSettings();
    window.addEventListener("ekkomi:open-cookie-settings", onOpenEvent);

    return () => {
      window.removeEventListener("ekkomi:open-cookie-settings", onOpenEvent);
    };
  }, [readStoredConsent, handleOpenSettings, handleAcceptAll, handleRejectNonEssential]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showSettings) {
        setShowSettings(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSettings]);

  if (!mounted) return null;

  return (
    <>
      {/* 1. Main Cookie Consent Floating Banner */}
      <section
        className={`ekkomi-cookie-banner ${showBanner && !showSettings ? "is-visible" : ""}`}
        role="region"
        aria-label="Cookie consent banner"
        aria-hidden={!showBanner || showSettings}
      >
        <div className="ekkomi-cookie-banner-inner">
          <div className="ekkomi-cookie-banner-content">
            <span className="ekkomi-cookie-eyebrow">CONSIDERED EXPERIENCE</span>
            <h2 className="ekkomi-cookie-title">Cookie & Privacy Choices</h2>
            <p className="ekkomi-cookie-text">
              We use strictly necessary cookies to ensure the website functions flawlessly. With your consent, we
              also employ optional analytics, functional, and marketing technologies to understand how you explore our
              story and to curate refined communications.
            </p>
            <div className="ekkomi-cookie-inline-links">
              <button
                type="button"
                className="ekkomi-cookie-link-btn"
                onClick={() => handleOpenSettings()}
              >
                View categories & settings
              </button>
            </div>
          </div>

          <div className="ekkomi-cookie-banner-actions">
            <button
              type="button"
              className="ekkomi-cookie-btn ekkomi-cookie-btn--primary"
              onClick={handleAcceptAll}
            >
              ACCEPT ALL
            </button>
            <button
              type="button"
              className="ekkomi-cookie-btn ekkomi-cookie-btn--secondary"
              onClick={handleRejectNonEssential}
            >
              REJECT NON-ESSENTIAL
            </button>
            <button
              type="button"
              className="ekkomi-cookie-btn ekkomi-cookie-btn--tertiary"
              onClick={handleOpenSettings}
            >
              COOKIE SETTINGS
            </button>
          </div>
        </div>
      </section>

      {/* 2. Preferences Modal / Settings Drawer */}
      <div
        className={`ekkomi-cookie-modal-backdrop ${showSettings ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ekkomi-cookie-modal-title"
        aria-hidden={!showSettings}
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowSettings(false);
        }}
      >
        <div className="ekkomi-cookie-modal-card">
          <header className="ekkomi-cookie-modal-header">
            <div>
              <span className="ekkomi-cookie-modal-kicker">UK GDPR & PECR COMPLIANCE</span>
              <h2 id="ekkomi-cookie-modal-title" className="ekkomi-cookie-modal-title">
                Cookie Preferences
              </h2>
            </div>
            <button
              type="button"
              className="ekkomi-cookie-modal-close"
              aria-label="Close cookie preferences"
              onClick={() => setShowSettings(false)}
            >
              ✕
            </button>
          </header>

          <div className="ekkomi-cookie-modal-body">
            <p className="ekkomi-cookie-modal-intro">
              Manage your cookie settings below. Strictly necessary cookies remain active to provide essential site
              services, security, and waitlist registration. All optional categories remain disabled unless you
              explicitly enable them.
            </p>

            <div className="ekkomi-cookie-categories">
              {/* Category 1: Strictly Necessary */}
              <div className="ekkomi-cookie-category-item">
                <div className="ekkomi-cookie-category-header">
                  <div className="ekkomi-cookie-category-info">
                    <div className="ekkomi-cookie-category-title-row">
                      <span className="ekkomi-cookie-category-name">Strictly Necessary</span>
                      <span className="ekkomi-cookie-badge ekkomi-cookie-badge--active">ALWAYS ACTIVE</span>
                    </div>
                    <p className="ekkomi-cookie-category-desc">
                      Essential for navigation, secure sessions, waitlist requests, and storing your consent preferences.
                      These cookies cannot be switched off under UK law.
                    </p>
                  </div>
                  <div className="ekkomi-cookie-switch-wrapper">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      aria-label="Strictly necessary cookies (always active)"
                      className="ekkomi-cookie-switch-input"
                    />
                    <span className="ekkomi-cookie-switch-track is-disabled-checked" aria-hidden="true">
                      <span className="ekkomi-cookie-switch-thumb" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Category 2: Analytics */}
              <div className="ekkomi-cookie-category-item">
                <div className="ekkomi-cookie-category-header">
                  <div className="ekkomi-cookie-category-info">
                    <label htmlFor={analyticsSwitchId} className="ekkomi-cookie-category-title-row is-clickable">
                      <span className="ekkomi-cookie-category-name">Analytics & Performance</span>
                    </label>
                    <p className="ekkomi-cookie-category-desc">
                      Enables us to measure site traffic and discover how visitors engage with the Nocturne story and
                      garments. All aggregated data is used strictly to improve user experience.
                    </p>
                  </div>
                  <div className="ekkomi-cookie-switch-wrapper">
                    <input
                      id={analyticsSwitchId}
                      type="checkbox"
                      role="switch"
                      aria-checked={analyticsEnabled}
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                      className="ekkomi-cookie-switch-input"
                    />
                    <label
                      htmlFor={analyticsSwitchId}
                      className={`ekkomi-cookie-switch-track ${analyticsEnabled ? "is-checked" : ""}`}
                      aria-hidden="true"
                    >
                      <span className="ekkomi-cookie-switch-thumb" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Category 3: Marketing */}
              <div className="ekkomi-cookie-category-item">
                <div className="ekkomi-cookie-category-header">
                  <div className="ekkomi-cookie-category-info">
                    <label htmlFor={marketingSwitchId} className="ekkomi-cookie-category-title-row is-clickable">
                      <span className="ekkomi-cookie-category-name">Marketing & Personalisation</span>
                    </label>
                    <p className="ekkomi-cookie-category-desc">
                      Permits relevant editorial announcements, pre-order invitations, and tailored messaging aligned
                      with your luxury fashion interests across external platforms.
                    </p>
                  </div>
                  <div className="ekkomi-cookie-switch-wrapper">
                    <input
                      id={marketingSwitchId}
                      type="checkbox"
                      role="switch"
                      aria-checked={marketingEnabled}
                      checked={marketingEnabled}
                      onChange={(e) => setMarketingEnabled(e.target.checked)}
                      className="ekkomi-cookie-switch-input"
                    />
                    <label
                      htmlFor={marketingSwitchId}
                      className={`ekkomi-cookie-switch-track ${marketingEnabled ? "is-checked" : ""}`}
                      aria-hidden="true"
                    >
                      <span className="ekkomi-cookie-switch-thumb" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Category 4: Functional */}
              <div className="ekkomi-cookie-category-item">
                <div className="ekkomi-cookie-category-header">
                  <div className="ekkomi-cookie-category-info">
                    <label htmlFor={functionalSwitchId} className="ekkomi-cookie-category-title-row is-clickable">
                      <span className="ekkomi-cookie-category-name">Functional Preferences</span>
                    </label>
                    <p className="ekkomi-cookie-category-desc">
                      Remembers your tailored browsing preferences (such as selected department view or display options)
                      to offer an uninterrupted individual experience.
                    </p>
                  </div>
                  <div className="ekkomi-cookie-switch-wrapper">
                    <input
                      id={functionalSwitchId}
                      type="checkbox"
                      role="switch"
                      aria-checked={functionalEnabled}
                      checked={functionalEnabled}
                      onChange={(e) => setFunctionalEnabled(e.target.checked)}
                      className="ekkomi-cookie-switch-input"
                    />
                    <label
                      htmlFor={functionalSwitchId}
                      className={`ekkomi-cookie-switch-track ${functionalEnabled ? "is-checked" : ""}`}
                      aria-hidden="true"
                    >
                      <span className="ekkomi-cookie-switch-thumb" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Policy & Cookie Information Notice */}
            <div className="ekkomi-cookie-policy-section">
              <button
                type="button"
                className="ekkomi-cookie-policy-toggle"
                onClick={() => setShowPolicyNotice(!showPolicyNotice)}
                aria-expanded={showPolicyNotice}
              >
                <span>Privacy & Data Protection Notice</span>
                <span className="ekkomi-cookie-policy-arrow" aria-hidden="true">
                  {showPolicyNotice ? "−" : "+"}
                </span>
              </button>
              {showPolicyNotice && (
                <div className="ekkomi-cookie-policy-content">
                  <p>
                    Ekkomi is committed to upholding the privacy of every client. In accordance with the UK General Data
                    Protection Regulation (UK GDPR) and the Privacy and Electronic Communications Regulations (PECR):
                  </p>
                  <ul>
                    <li>We do not deploy non-essential cookies without prior affirmative consent.</li>
                    <li>Waitlist submissions are securely processed through our direct Supabase integration solely to deliver requested notifications.</li>
                    <li>Personal information is never sold or shared with unauthorised third parties.</li>
                    <li>You can update or revoke your consent at any time via the persistent Cookie Preferences link in the website footer.</li>
                  </ul>
                  <p>For any privacy inquiries or data subject access requests, please reach out to <a href="mailto:info@ekkomi.co.uk" className="ekkomi-cookie-text-link">info@ekkomi.co.uk</a>.</p>
                </div>
              )}
            </div>
          </div>

          <footer className="ekkomi-cookie-modal-footer">
            <button
              type="button"
              className="ekkomi-cookie-btn ekkomi-cookie-btn--primary"
              onClick={handleSavePreferences}
            >
              SAVE PREFERENCES
            </button>
            <div className="ekkomi-cookie-modal-footer-secondary">
              <button
                type="button"
                className="ekkomi-cookie-btn ekkomi-cookie-btn--secondary"
                onClick={handleRejectNonEssential}
              >
                REJECT NON-ESSENTIAL
              </button>
              <button
                type="button"
                className="ekkomi-cookie-btn ekkomi-cookie-btn--tertiary"
                onClick={handleAcceptAll}
              >
                ACCEPT ALL
              </button>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}

