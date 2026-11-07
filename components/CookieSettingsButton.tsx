"use client";

export default function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent("ekkomi:open-cookie-settings"))}
    >
      Cookie Preferences
    </button>
  );
}
