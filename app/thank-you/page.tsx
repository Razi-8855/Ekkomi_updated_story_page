import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thank You — EKKOMI",
  description: "Your priority waitlist registration has been received.",
};

export default function ThankYouPage() {
  return (
    <main className="thank-you-page">
      <header className="thank-you-header">
        <Link href="/" className="thank-you-brand" aria-label="EKKOMI home">
          <img src="/logo/logo-2.png" alt="EKKOMI" className="thank-you-logo" />
        </Link>
      </header>

      <section className="thank-you-content">
        <div className="thank-you-card">
          <span className="thank-you-eyebrow">PRIORITY WAITLIST REGISTRATION</span>
          <h1 className="thank-you-title">You Are On The List</h1>
          <p className="thank-you-message">
            Thank you for registering your interest in the Nocturne Edit.
            Each piece is crafted in strictly limited allocations in our atelier.
            You will receive a private email notification with priority access as soon as pieces become available.
          </p>

          <div className="thank-you-divider" aria-hidden="true" />

          <div className="thank-you-actions">
            <Link href="/collection" className="thank-you-btn thank-you-btn--primary">
              EXPLORE THE COLLECTION
            </Link>
            <Link href="/" className="thank-you-btn thank-you-btn--secondary">
              DISCOVER THE STORY
            </Link>
          </div>
        </div>
      </section>

      <footer className="thank-you-footer">
        <div className="thank-you-footer-inner">
          <span className="thank-you-footer-copy">© 2026 EKKOMI. All rights reserved.</span>
          <a href="mailto:info@ekkomi.co.uk" className="thank-you-footer-link">info@ekkomi.co.uk</a>
        </div>
      </footer>
    </main>
  );
}
