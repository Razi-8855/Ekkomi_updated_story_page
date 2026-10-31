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
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
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

  // Sync consent state to GTM dataLayer and Google Consent Mode
  const updateGtmConsent = useCallback((prefs: CookiePreferences) => {
    if (typeof window === "undefined") return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "consent_update",
      cookie_consent_analytics: prefs.analytics,
      cookie_consent_marketing: prefs.marketing,
      cookie_consent_functional: prefs.functional,
      cookie_consent_timestamp: prefs.timestamp,
    });

    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: prefs.analytics ? "granted" : "denied",
        ad_storage: prefs.marketing ? "granted" : "denied",
        ad_user_data: prefs.marketing ? "granted" : "denied",
        ad_personalization: prefs.marketing ? "granted" : "denied",
        functionality_storage: prefs.functional ? "granted" : "denied",
      });
    }

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

    window.dispatchEvent(new CustomEvent("ekkomi:consent-updated", { detail: prefs }));
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

    updateGtmConsent(prefs);
    setShowBanner(false);
    setShowSettings(false);
  }, [updateGtmConsent]);

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
      updateGtmConsent(stored);
    } else {
      // Subtle delay before revealing the banner for a smooth entrance
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [readStoredConsent, updateGtmConsent]);

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
      {/* 1. Main Cookie Consent Banner (Suit Direct minimal white aesthetic) */}
      <section
        className={`suit-direct-cookie-banner ${showBanner && !showSettings ? "is-visible" : ""}`}
        role="region"
        aria-label="Cookie consent banner"
        aria-hidden={!showBanner || showSettings}
      >
        <div className="suit-direct-cookie-inner">
          <div className="suit-direct-cookie-copy">
            <p className="suit-direct-cookie-title">We Value Your Privacy</p>
            <p className="suit-direct-cookie-text">
              We use cookies to improve your experience on our site, analyze site performance, and support our marketing
              efforts. You can choose to accept all cookies or manage your preferences individually.
            </p>
          </div>

          <div className="suit-direct-cookie-actions">
            <button
              type="button"
              className="suit-direct-cookie-btn suit-direct-cookie-btn--settings"
              onClick={handleOpenSettings}
            >
              Cookie Settings
            </button>
            <button
              type="button"
              className="suit-direct-cookie-btn suit-direct-cookie-btn--accept"
              onClick={handleAcceptAll}
            >
              Accept All Cookies
            </button>
          </div>
        </div>
      </section>

      {/* 2. Preferences Modal / Settings Drawer */}
      <div
        className={`suit-direct-cookie-modal-backdrop ${showSettings ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="suit-direct-cookie-modal-title"
        aria-hidden={!showSettings}
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowSettings(false);
        }}
      >
        <div className="suit-direct-cookie-modal-card">
          <header className="suit-direct-cookie-modal-header">
            <div>
              <span className="suit-direct-cookie-kicker">UK GDPR & PECR COMPLIANCE</span>
              <h2 id="suit-direct-cookie-modal-title" className="suit-direct-cookie-modal-title">
                Cookie Preferences
              </h2>
            </div>
            <button
              type="button"
              className="suit-direct-cookie-modal-close"
              aria-label="Close cookie preferences"
              onClick={() => setShowSettings(false)}
            >
              ✕
            </button>
          </header>

          <div className="suit-direct-cookie-modal-body">
            <p className="suit-direct-cookie-modal-intro">
              Manage your cookie settings below. Strictly necessary cookies remain active to provide essential site
              services, secure shopping journeys, and waitlist registration. All optional categories remain disabled
              unless you explicitly enable them.
            </p>

            <div className="suit-direct-cookie-categories">
              {/* Category 1: Strictly Necessary */}
              <div className="suit-direct-cookie-category-item">
                <div className="suit-direct-cookie-category-header">
                  <div className="suit-direct-cookie-category-info">
                    <div className="suit-direct-cookie-category-title-row">
                      <span className="suit-direct-cookie-category-name">Strictly Necessary Cookies</span>
                      <span className="suit-direct-cookie-badge suit-direct-cookie-badge--active">ALWAYS ACTIVE</span>
                    </div>
                    <p className="suit-direct-cookie-category-desc">
                      Essential for navigation, secure sessions, waitlist requests, and storing your consent preferences.
                      These cookies cannot be switched off under UK law.
                    </p>
                  </div>
                  <div className="suit-direct-cookie-switch-wrapper">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      aria-label="Strictly necessary cookies (always active)"
                      className="suit-direct-cookie-switch-input"
                    />
                    <span className="suit-direct-cookie-switch-track is-disabled-checked" aria-hidden="true">
                      <span className="suit-direct-cookie-switch-thumb" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Category 2: Analytics */}
              <div className="suit-direct-cookie-category-item">
                <div className="suit-direct-cookie-category-header">
                  <div className="suit-direct-cookie-category-info">
                    <label htmlFor={analyticsSwitchId} className="suit-direct-cookie-category-title-row is-clickable">
                      <span className="suit-direct-cookie-category-name">Analytics & Performance</span>
                    </label>
                    <p className="suit-direct-cookie-category-desc">
                      Enables us to measure site traffic and discover how visitors engage with the Nocturne story and
                      garments. All aggregated data is used strictly to improve user experience.
                    </p>
                  </div>
                  <div className="suit-direct-cookie-switch-wrapper">
                    <input
                      id={analyticsSwitchId}
                      type="checkbox"
                      role="switch"
                      aria-checked={analyticsEnabled}
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                      className="suit-direct-cookie-switch-input"
                    />
                    <label
                      htmlFor={analyticsSwitchId}
                      className={`suit-direct-cookie-switch-track ${analyticsEnabled ? "is-checked" : ""}`}
                      aria-hidden="true"
                    >
                      <span className="suit-direct-cookie-switch-thumb" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Category 3: Functional */}
              <div className="suit-direct-cookie-category-item">
                <div className="suit-direct-cookie-category-header">
                  <div className="suit-direct-cookie-category-info">
                    <label htmlFor={functionalSwitchId} className="suit-direct-cookie-category-title-row is-clickable">
                      <span className="suit-direct-cookie-category-name">Functional Preferences</span>
                    </label>
                    <p className="suit-direct-cookie-category-desc">
                      Remembers your tailored browsing preferences (such as selected department view or display options)
                      to offer an uninterrupted individual experience.
                    </p>
                  </div>
                  <div className="suit-direct-cookie-switch-wrapper">
                    <input
                      id={functionalSwitchId}
                      type="checkbox"
                      role="switch"
                      aria-checked={functionalEnabled}
                      checked={functionalEnabled}
                      onChange={(e) => setFunctionalEnabled(e.target.checked)}
                      className="suit-direct-cookie-switch-input"
                    />
                    <label
                      htmlFor={functionalSwitchId}
                      className={`suit-direct-cookie-switch-track ${functionalEnabled ? "is-checked" : ""}`}
                      aria-hidden="true"
                    >
                      <span className="suit-direct-cookie-switch-thumb" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Category 4: Marketing */}
              <div className="suit-direct-cookie-category-item">
                <div className="suit-direct-cookie-category-header">
                  <div className="suit-direct-cookie-category-info">
                    <label htmlFor={marketingSwitchId} className="suit-direct-cookie-category-title-row is-clickable">
                      <span className="suit-direct-cookie-category-name">Marketing & Personalisation</span>
                    </label>
                    <p className="suit-direct-cookie-category-desc">
                      Permits relevant editorial announcements, pre-order invitations, and tailored messaging aligned
                      with your luxury fashion interests across external platforms.
                    </p>
                  </div>
                  <div className="suit-direct-cookie-switch-wrapper">
                    <input
                      id={marketingSwitchId}
                      type="checkbox"
                      role="switch"
                      aria-checked={marketingEnabled}
                      checked={marketingEnabled}
                      onChange={(e) => setMarketingEnabled(e.target.checked)}
                      className="suit-direct-cookie-switch-input"
                    />
                    <label
                      htmlFor={marketingSwitchId}
                      className={`suit-direct-cookie-switch-track ${marketingEnabled ? "is-checked" : ""}`}
                      aria-hidden="true"
                    >
                      <span className="suit-direct-cookie-switch-thumb" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Policy & Cookie Information Notice */}
            <div className="suit-direct-cookie-policy-section">
              <button
                type="button"
                className="suit-direct-cookie-policy-toggle"
                onClick={() => setShowPolicyNotice(!showPolicyNotice)}
                aria-expanded={showPolicyNotice}
              >
                <span>Privacy & Data Protection Notice</span>
                <span className="suit-direct-cookie-policy-arrow" aria-hidden="true">
                  {showPolicyNotice ? "−" : "+"}
                </span>
              </button>
              {showPolicyNotice && (
                <div className="suit-direct-cookie-policy-content">
                  <p>
                    Ekkomi is committed to upholding the privacy of every client. In accordance with the UK General Data
                    Protection Regulation (UK GDPR) and the Privacy and Electronic Communications Regulations (PECR):
                  </p>
                  <ul>
                    <li>We do not deploy non-essential cookies or tracking scripts without prior affirmative consent.</li>
                    <li>Waitlist submissions are securely processed through our direct Supabase integration solely to deliver requested notifications.</li>
                    <li>Personal information is never sold or shared with unauthorised third parties.</li>
                    <li>You can update or revoke your consent at any time via the persistent Cookie Preferences link in the website footer.</li>
                  </ul>
                  <p>
                    For any privacy inquiries or data subject access requests, please contact{" "}
                    <a href="mailto:info@ekkomi.co.uk" className="suit-direct-cookie-text-link">
                      info@ekkomi.co.uk
                    </a>.
                  </p>
                </div>
              )}
            </div>
          </div>

          <footer className="suit-direct-cookie-modal-footer">
            <button
              type="button"
              className="suit-direct-cookie-btn suit-direct-cookie-btn--accept"
              onClick={handleSavePreferences}
            >
              Save Preferences
            </button>
            <div className="suit-direct-cookie-modal-footer-secondary">
              <button
                type="button"
                className="suit-direct-cookie-btn suit-direct-cookie-btn--settings"
                onClick={handleRejectNonEssential}
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                className="suit-direct-cookie-btn suit-direct-cookie-btn--outline"
                onClick={handleAcceptAll}
              >
                Accept All Cookies
              </button>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
