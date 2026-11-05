// Extracted page body from the original Collection project. Keep the source folder intact.
const collectionMarkup = `
  <a class="skip-link" href="#collection">Skip to collection</a>
  <header class="site-header">
    <a class="wordmark" href="#top" aria-label="Ekkomi home">
      <img class="wordmark-logo" src="/collection-assets/Ekkomi_logo_1.png" alt="Ekkomi" width="200" height="120" decoding="async" fetchpriority="high" />
      <span class="wordmark-text">EKKOMI</span>
    </a>
    <div class="header-actions">
      <button class="menu-button" type="button" aria-label="Open menu">Menu <span aria-hidden="true">+</span></button>
    </div>
  </header>

  <main id="top">
    <!-- ============================================================
         HERO SECTION: 3D PERSPECTIVE DRIFT WALL + OVERLAID COPY
         Photos from jackets_original drifting continuously, lifting on hover
         ============================================================ -->
    <section class="hero-section" id="heroSection" aria-labelledby="nocturne-title">
      <div class="hero__wall" id="heroDriftWall" aria-label="Perspective wall of Nocturne collection photos drifting past"></div>

      <div class="hero__content">
        <p class="eyebrow hero-eyebrow">The first collection</p>
        <h1 class="hero-title" id="nocturne-title">Nocturne</h1>
        <p class="intro-statement hero-statement">Five impulses. Five jackets. A collection that reconsiders what we&#8217;ve been taught to keep in check.</p>
        <a class="hero-explore-btn" href="#collection" aria-label="Explore the Nocturne collection">
          Explore collection <span class="hero-arrow" aria-hidden="true">&darr;</span>
        </a>
      </div>
    </section>

    <!-- ============================================================
         NOCTURNE COLLECTION: DUAL EDIT (MEN'S & WOMEN'S)
         ============================================================ -->
    <section class="collection-showcase-section" id="collection" role="region" aria-label="Nocturne collection">
      
      <!-- Top Department Switcher Bar -->
      <div class="collection-nav-bar" id="collectionNavBar">
        <div class="section">
          <div class="collection-gender-switch" role="tablist" aria-label="Nocturne collection departments">
            <button class="gender-switch-btn is-active" id="tab-gender-men" type="button" role="tab" aria-selected="true" data-department="men">
              <span class="gender-label">MEN</span>
              <span class="gender-badge">05 Styles</span>
            </button>
            <span class="gender-switch-divider" aria-hidden="true">/</span>
            <button class="gender-switch-btn" id="tab-gender-women" type="button" role="tab" aria-selected="false" data-department="women">
              <span class="gender-label">WOMEN</span>
              <span class="gender-badge">03 Styles</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================
           1. MEN'S COLLECTION (5 Jackets)
           Curiosity, Temptation, Desire, Audacity, Insolence
           ============================================================ -->
      <div class="collection-department-block is-active" id="mens-department" data-department="men">
        <header class="section collection-department-header" id="mens-collection">
          <div class="department-header-inner">
            <h2 class="department-title">Men&#8217;s Collection</h2>
            <p class="department-subtitle">Five expressions of instinct.</p>
          </div>
        </header>

        <!-- Accordion Gallery Container (Men's 5 panels) -->
        <div class="section accordion-gallery-container">
          <div id="accordionGalleryMen" class="accordion-gallery" role="list" aria-label="Men's Nocturne jackets gallery"></div>
        </div>
      </div>

      <!-- ============================================================
           2. WOMEN'S COLLECTION (3 Jackets)
           Curiosity, Desire, Audacity
           ============================================================ -->
      <div class="collection-department-block is-hidden" id="womens-department" data-department="women" style="display: none;">
        <header class="section collection-department-header" id="womens-collection">
          <div class="department-header-inner">
            <h2 class="department-title">Women&#8217;s Collection</h2>
            <p class="department-subtitle">Three expressions of instinct.</p>
          </div>
        </header>

        <!-- Accordion Gallery Container (Women's 3 panels) -->
        <div class="section accordion-gallery-container">
          <div id="accordionGalleryWomen" class="accordion-gallery" role="list" aria-label="Women's Nocturne jackets gallery"></div>
        </div>
      </div>

      <!-- ============================================================
           3. DYNAMIC PRODUCT SHOWCASE (Single in-place showcase)
           Directly beneath the carousel, updates dynamically
           ============================================================ -->
      <div class="showcase-container">
        <section class="jacket-detail-section dynamic-product-showcase" id="productShowcase" aria-live="polite">
          <!-- Dynamically populated and transitioned by app.js (Initial state rendered on boot) -->
        </section>
      </div>

      <!-- ============================================================
           CRAWLER & ACCESSIBILITY PRODUCT INDEX (5 NOCTURNE PIECES)
           Ensures full semantic indexing in SSR HTML without separate URLs
           ============================================================ -->
      <section class="collection-seo-index sr-only" aria-label="Nocturne Collection Jackets Overview">
        <article id="curiosity" class="seo-product-item">
          <h2>Curiosity Suede Jacket — £785</h2>
          <p>Color: Navy. Rich tactile luxury suede with a brushed nap that catches and deepens the light. Tonal needlework across the upper chest, lined in bespoke Nocturne silk.</p>
          <p>Price: £785 GBP. Available for purchase.</p>
          <a href="/collection#curiosity">View Curiosity Suede Jacket</a>
        </article>
        <article id="temptation" class="seo-product-item">
          <h2>Temptation Suede Jacket — £855</h2>
          <p>Color: Red. Rich tactile luxury suede with a brushed nap that catches and deepens the light. Shifting needlework across the upper chest, lined in bespoke Nocturne silk.</p>
          <p>Price: £855 GBP. Available for purchase.</p>
          <a href="/collection#temptation">View Temptation Suede Jacket</a>
        </article>
        <article id="desire" class="seo-product-item">
          <h2>Desire Suede Jacket — £855</h2>
          <p>Color: Olive Green. Rich tactile luxury suede with a brushed nap that catches and deepens the light. Shifting needlework across the upper chest, lined in bespoke Nocturne silk.</p>
          <p>Price: £855 GBP. Available for purchase.</p>
          <a href="/collection#desire">View Desire Suede Jacket</a>
        </article>
        <article id="audacity" class="seo-product-item">
          <h2>Audacity Suede Jacket — £970</h2>
          <p>Color: Mustard Yellow. Rich tactile luxury suede with a brushed nap that catches and deepens the light. Tonal needlework across the upper chest, lined in bespoke Nocturne silk.</p>
          <p>Price: £970 GBP. Available for purchase.</p>
          <a href="/collection#audacity">View Audacity Suede Jacket</a>
        </article>
        <article id="insolence" class="seo-product-item">
          <h2>Insolence Suede Jacket — £1,050</h2>
          <p>Color: Jet Black. Rich tactile luxury suede with a brushed nap that catches and deepens the light. Tonal needlework across the upper chest, lined in bespoke Nocturne silk.</p>
          <p>Price: £1,050 GBP. Available for purchase.</p>
          <a href="/collection#insolence">View Insolence Suede Jacket</a>
        </article>
      </section>

    </section>
  </main>

  <footer class="site-footer" role="contentinfo">
    <div class="section footer-inner">
      <div class="footer-col-brand">
        <span class="footer-wordmark">EKKOMI</span>
        <p class="footer-copyright">&copy; 2026 EKKOMI. All rights reserved.<span class="footer-bullet" aria-hidden="true">&bull;</span><button type="button" class="footer-cookie-link" data-open-cookie-settings>Cookie Preferences</button></p>
      </div>
      <div class="footer-col-links">
        <a class="footer-link footer-link-ig" href="https://instagram.com/ekkomi" target="_blank" rel="noopener noreferrer" aria-label="Ekkomi on Instagram">
          <svg class="footer-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
          <span>INSTAGRAM</span>
        </a>
        <a class="footer-link footer-link-email" href="mailto:info@ekkomi.co.uk" aria-label="Email Ekkomi at info@ekkomi.co.uk">
          <svg class="footer-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7\"></path>
          </svg>
          <span>info@ekkomi.co.uk</span>
        </a>
      </div>
    </div>
  </footer>
  <!-- Persistent Floating Join Waiting List Button (Bottom-Left) [DISABLED for purchase campaign] -->
  <!--
<button type="button" class="floating-waitlist-btn" id="floatingWaitlistBtn" aria-label="Join the waiting list">
    <span class="floating-btn-text">JOIN THE WAITING LIST</span>
    <span class="floating-btn-indicator" aria-hidden="true"></span>
  </button>
  -->

  <!-- Floating WhatsApp Stylist Button (Bottom-Right) -->
  <a href="https://wa.me/447123456789?text=Hello%20Ekkomi%2C%20I%20would%20like%20to%20speak%20with%20your%20stylist%20regarding%20the%20Nocturne%20collection." class="floating-whatsapp-btn" id="floatingWhatsappBtn" target="_blank" rel="noopener noreferrer" aria-label="Contact Ekkomi Stylist on WhatsApp">
    <svg class="floating-wa-icon" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7.02 8.48 7.02 9.68C7.02 10.88 7.9 12.03 8.02 12.19C8.14 12.35 9.73 14.81 12.17 15.86C12.75 16.11 13.2 16.26 13.55 16.37C14.13 16.56 14.67 16.53 15.09 16.47C15.56 16.4 16.53 15.88 16.73 15.31C16.94 14.74 16.94 14.25 16.88 14.15C16.81 14.05 16.66 13.99 16.43 13.88C16.2 13.77 15.07 13.21 14.86 13.13C14.65 13.05 14.5 13.01 14.34 13.24C14.19 13.47 13.75 14.01 13.62 14.17C13.49 14.33 13.36 14.35 13.13 14.23C12.9 14.12 11.93 13.8 10.78 12.78C9.89 11.98 9.28 11 9.05 10.61C8.82 10.22 9.03 10.01 9.14 9.9C9.25 9.79 9.38 9.61 9.5 9.47C9.62 9.33 9.66 9.23 9.74 9.07C9.82 8.91 9.78 8.77 9.72 8.65C9.66 8.53 9.22 7.45 9.04 7.01C8.86 6.58 8.68 6.64 8.53 6.63L8.53 7.33Z"/>
    </svg>
    <span class="floating-wa-label">Stylist</span>
  </a>

  <!-- ============================================================
       JOIN THE WAITING LIST: MULTI-STEP EDITORIAL MODAL
       ============================================================ -->
  <div class="waitlist-modal-backdrop" id="waitlistBackdrop" aria-hidden="true">
    <div class="waitlist-modal-dialog" id="waitlistDialog" role="dialog" aria-modal="true" aria-labelledby="waitlistModalTitle">
      
      <!-- Modal Navigation Header -->
      <div class="waitlist-modal-header">
        <button type="button" class="waitlist-back-btn is-hidden" id="waitlistBackBtn" aria-label="Go back to previous step">
          <span aria-hidden="true">&larr;</span> Back
        </button>
        <div class="waitlist-progress-dots" id="waitlistProgress" aria-label="Step progress">
          <span class="progress-dot is-active" data-step="1"></span>
          <span class="progress-dot" data-step="2"></span>
          <span class="progress-dot" data-step="3"></span>
          <span class="progress-dot" data-step="4"></span>
          <span class="progress-dot" data-step="5"></span>
        </div>
        <button type="button" class="waitlist-close-btn" id="waitlistCloseBtn" aria-label="Exit popup and explore collection" title="Exit to collection">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="1" y1="1" x2="13" y2="13"></line>
            <line x1="13" y1="1" x2="1" y2="13"></line>
          </svg>
        </button>
      </div>

      <!-- Step 1: Introduction -->
      <div class="waitlist-step" id="waitlistStep1" data-step="1">
        <div class="waitlist-step-content text-center">
          <p class="waitlist-eyebrow">SOLD OUT</p>
          <div class="waitlist-title" id="waitlistModalTitle" role="heading" aria-level="2">Missed your favourite?<br />Join the waiting list.</div>
          <p class="waitlist-subtitle">Be the first to know when your favourite piece becomes available. Register your interest for priority updates.</p>
          <div class="waitlist-actions">
            <button type="button" class="waitlist-primary-btn" id="step1ContinueBtn">JOIN THE WAITING LIST</button>
          </div>
        </div>
      </div>

      <!-- Step 2: Select Collection -->
      <div class="waitlist-step is-hidden" id="waitlistStep2" data-step="2">
        <div class="waitlist-step-content">
          <p class="waitlist-eyebrow">STEP 01 / 04</p>
          <div class="waitlist-title" role="heading" aria-level="2">CHOOSE YOUR COLLECTION</div>
          <div class="waitlist-collection-grid" role="radiogroup" aria-label="Choose collection">
            <button type="button" class="waitlist-card-option" data-collection="men" role="radio" aria-checked="false">
              <span class="option-tag">05 Styles</span>
              <span class="option-name">MEN</span>
              <span class="option-desc">Curiosity, Temptation, Desire, Audacity, Insolence</span>
            </button>
            <button type="button" class="waitlist-card-option" data-collection="women" role="radio" aria-checked="false">
              <span class="option-tag">03 Styles</span>
              <span class="option-name">WOMEN</span>
              <span class="option-desc">Curiosity, Desire, Audacity</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Step 3: Select Jacket -->
      <div class="waitlist-step is-hidden" id="waitlistStep3" data-step="3">
        <div class="waitlist-step-content">
          <p class="waitlist-eyebrow">STEP 02 / 04 &middot; <span id=\"summaryCollectionLabel\">MEN</span></p>
          <div class="waitlist-title" role="heading" aria-level="2">CHOOSE YOUR JACKET</div>
          <div class="waitlist-jackets-list" id="waitlistJacketsList" role="radiogroup" aria-label="Choose jacket">
            <!-- Populated dynamically by waitlist.js -->
          </div>
        </div>
      </div>

      <!-- Step 4: Select Size -->
      <div class="waitlist-step is-hidden" id="waitlistStep4" data-step="4">
        <div class="waitlist-step-content text-center">
          <p class="waitlist-eyebrow">STEP 03 / 04 &middot; <span id=\"summaryJacketLabel\">DESIRE</span></p>
          <div class="waitlist-title" role="heading" aria-level="2">SELECT YOUR SIZE</div>
          <p class="waitlist-subtitle" id="step4Subtitle">Currently unavailable. Select your size to join the waiting list.</p>
          <div class="waitlist-sizes-grid" id="waitlistSizesGrid" role="radiogroup" aria-label="Select size">
            <!-- Populated dynamically by waitlist.js -->
          </div>
        </div>
      </div>

      <!-- Step 5: Customer Details Form -->
      <div class="waitlist-step is-hidden" id="waitlistStep5" data-step="5">
        <div class="waitlist-step-content">
          <p class="waitlist-eyebrow">FINAL STEP</p>
          <div class="waitlist-title" role="heading" aria-level="2">YOUR DETAILS</div>
          
          <!-- Summary Pill -->
          <div class="waitlist-selection-pill" id="waitlistSelectionPill">
            <span class="pill-dot" id="pillColorDot"></span>
            <span class="pill-text" id="pillSummaryText">Men &middot; Desire &middot; Size M</span>
            <button type="button" class="pill-edit-btn" id="pillEditBtn" aria-label="Edit selections">Edit</button>
          </div>

          <form class="waitlist-form" id="waitlistForm" novalidate>
            <!-- Anti-Spam Honeypot Field (invisible to real human visitors) -->
            <input type="text" name="b_company_url" id="waitlistHoneypot" tabindex="-1" autocomplete="off" style="display:none!important;" aria-hidden="true" />
            <div class="waitlist-form-group">
              <label class="waitlist-label" for="waitlistFullName">Full Name</label>
              <input class="waitlist-input" type="text" id="waitlistFullName" name="fullName" placeholder="Your full name" autocomplete="name" required />
              <span class="waitlist-error" id="nameError"></span>
            </div>

            <div class="waitlist-form-group">
              <label class="waitlist-label" for="waitlistEmail">Email Address</label>
              <input class="waitlist-input" type="email" id="waitlistEmail" name="email" placeholder="your@email.com" autocomplete="email" required />
              <span class="waitlist-error" id="emailError"></span>
            </div>

            <div class="waitlist-form-group">
              <label class="waitlist-label" for="waitlistPhone">Phone Number</label>
              <input class="waitlist-input" type="tel" id="waitlistPhone" name="phone" placeholder="+44 7123 456789" autocomplete="tel" required />
              <span class="waitlist-error" id="phoneError"></span>
            </div>

            <div class="waitlist-consent-group">
              <label class="waitlist-consent-label">
                <input class="waitlist-checkbox" type="checkbox" id="waitlistConsent" name="consent" required />
                <span class="consent-text">I agree to receive availability updates from EKKOMI regarding my selected piece.</span>
              </label>
              <span class="waitlist-error" id="consentError"></span>
            </div>

            <div class="waitlist-form-error" id="generalFormError" role="alert"></div>

            <button type="submit" class="waitlist-primary-btn" id="submitWaitlistBtn">
              <span class="btn-text">JOIN THE WAITING LIST</span>
              <span class="btn-spinner is-hidden" aria-hidden="true"></span>
            </button>
          </form>
        </div>
      </div>

      <!-- Step 6: Registration Success -->
      <div class="waitlist-step is-hidden" id="waitlistStep6" data-step="6">
        <div class="waitlist-step-content text-center">
          <div class="waitlist-success-badge" aria-hidden="true">&#10003;</div>
          <div class="waitlist-title" role="heading" aria-level="2">YOU&#8217;RE ON THE LIST</div>
          <p class="waitlist-success-msg">Your interest has been registered successfully.</p>
          <div class="waitlist-availability-box">
            <p class="availability-headline">We&#8217;ll notify you about your selected jacket&#8217;s availability.</p>
          </div>
          <p class="waitlist-closing-line">Thank you for your interest in EKKOMI.</p>
          <div class="waitlist-actions">
            <button type="button" class="waitlist-primary-btn" id="backToCollectionBtn">EXPLORE EKKOMI COLLECTIONS</button>
          </div>
        </div>
      </div>

    </div>
  </div>
`;

const collectionFooter = `<footer class="collection-footer" role="contentinfo">
  <div class="collection-footer__inner">
    <nav class="collection-footer__column" aria-label="Privacy and policy">
      <h3 class="collection-footer__heading">Privacy &amp; Policy</h3>
      <a class="collection-footer__link" href="https://shop.ekkomi.co.uk/policies/privacy-policy">Privacy Policy</a>
      <a class="collection-footer__link" href="https://shop.ekkomi.co.uk/policies/terms-of-service">Terms of Service</a>
      <a class="collection-footer__link" href="https://shop.ekkomi.co.uk/policies/refund-policy">Refund Policy</a>
      <a class="collection-footer__link" href="https://shop.ekkomi.co.uk/policies/legal-notice">Legal Notice</a>
      <a class="collection-footer__link" href="https://shop.ekkomi.co.uk/policies/contact-information">Contact Information</a>
    </nav>
    <nav class="collection-footer__column" aria-label="Customer care">
      <h3 class="collection-footer__heading">Customer Care</h3>
      <a class="collection-footer__link" href="https://shop.ekkomi.co.uk/pages/contact">Contact Us</a>
      <a class="collection-footer__link" href="https://shop.ekkomi.co.uk/policies/shipping-policy">Shipping</a>
      <a class="collection-footer__link" href="https://shop.ekkomi.co.uk/policies/refund-policy">Returns</a>
    </nav>
    <nav class="collection-footer__column" aria-label="About us">
      <h3 class="collection-footer__heading">About Us</h3>
      <a class="collection-footer__link" href="https://www.ekkomi.co.uk/">Our Story</a>
      <a class="collection-footer__link" href="https://www.ekkomi.co.uk/collection">Our Crafts</a>
    </nav>
    <nav class="collection-footer__column" aria-label="Connect">
      <h3 class="collection-footer__heading">Connect</h3>
      <a class="collection-footer__link collection-footer__social-link" href="https://instagram.com/ekkomi_official" target="_blank" rel="noopener noreferrer">
        <svg class="collection-footer__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle class="collection-footer__icon-dot" cx="17.7" cy="6.6" r=".8" /></svg>
        <span>Instagram</span>
      </a>
      <a class="collection-footer__link collection-footer__social-link" href="mailto:info@ekkomi.co.uk">
        <svg class="collection-footer__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m4 7 8 6 8-6" /></svg>
        <span>Email</span>
      </a>
    </nav>
  </div>
  <div class="collection-footer__bottom">
    <p class="collection-footer__copyright">&copy; 2026 EKKOMI. All rights reserved.</p>
    <button type="button" class="collection-footer__settings" data-open-cookie-settings>Cookie Preferences</button>
  </div>
</footer>`;

const collectionMarkupWithFooter = collectionMarkup.replace(
  /<footer class="site-footer" role="contentinfo">[\s\S]*?<\/footer>/,
  collectionFooter
);

export default collectionMarkupWithFooter;
