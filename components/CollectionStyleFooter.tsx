import Link from "next/link";
import CookieSettingsButton from "@/components/CookieSettingsButton";
import "./CollectionStyleFooter.css";

export default function CollectionStyleFooter() {
  return (
    <footer className="aux-collection-footer" id="contact" role="contentinfo">
      <div className="aux-collection-footer__inner">
        <nav className="aux-collection-footer__column" aria-label="Privacy and policy">
          <h2>Privacy &amp; Policy</h2>
          <a href="https://shop.ekkomi.co.uk/policies/privacy-policy">Privacy Policy</a>
          <a href="https://shop.ekkomi.co.uk/policies/terms-of-service">Terms of Service</a>
          <a href="https://shop.ekkomi.co.uk/policies/refund-policy">Refund Policy</a>
          <a href="https://shop.ekkomi.co.uk/policies/legal-notice">Legal Notice</a>
          <a href="https://shop.ekkomi.co.uk/policies/contact-information">Contact Information</a>
        </nav>
        <nav className="aux-collection-footer__column" aria-label="Customer care">
          <h2>Customer Care</h2>
          <a href="https://shop.ekkomi.co.uk/pages/contact">Contact Us</a>
          <a href="https://shop.ekkomi.co.uk/policies/shipping-policy">Shipping</a>
          <a href="https://shop.ekkomi.co.uk/policies/refund-policy">Returns</a>
          <Link href="/faq">FAQ</Link>
        </nav>
        <nav className="aux-collection-footer__column" aria-label="About us">
          <h2>About Us</h2>
          <a href="https://www.ekkomi.co.uk/">Our Story</a>
          <a href="https://www.ekkomi.co.uk/collection">Our Crafts</a>
          <Link href="/journal">Our Journal</Link>
        </nav>
        <nav className="aux-collection-footer__column" aria-label="Connect">
          <h2>Connect</h2>
          <a className="aux-collection-footer__social" href="https://instagram.com/ekkomi_official" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle className="aux-collection-footer__icon-dot" cx="17.7" cy="6.6" r=".8" /></svg>
            <span>Instagram</span>
          </a>
          <a className="aux-collection-footer__social" href="mailto:info@ekkomi.co.uk">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m4 7 8 6 8-6" /></svg>
            <span>Email</span>
          </a>
        </nav>
      </div>
      <div className="aux-collection-footer__bottom">
        <p>© 2026 EKKOMI. All rights reserved.</p>
        <CookieSettingsButton className="aux-collection-footer__settings" />
      </div>
    </footer>
  );
}
