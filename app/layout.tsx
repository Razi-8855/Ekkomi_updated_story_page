import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CookieConsent from "@/components/CookieConsent";
import ShopifyCartUI from "@/components/ShopifyCartUI";
import "./shopify-cart.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ekkomi.co.uk"),

  title: {
    default: "Ekkomi | British Luxury Leather & Suede Jackets",
    template: "%s | Ekkomi",
  },

  description:
    "Discover Ekkomi, a contemporary British luxury fashion house. Explore distinctive leather and suede jackets defined by craftsmanship, individuality and timeless design.",

  applicationName: "Ekkomi",

  icons: {
    icon: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  },

  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Ekkomi",
    title: "Ekkomi | British Luxury Leather & Suede Jackets",
    description:
      "Discover Ekkomi, a contemporary British luxury fashion house. Explore distinctive leather and suede jackets defined by craftsmanship, individuality and timeless design.",
    url: "https://www.ekkomi.co.uk/",
    images: [
      {
        url: "/collection-assets/collection/nocturne/temptation/temptation.jpg",
        width: 1200,
        height: 1800,
        alt: "Ekkomi luxury suede and leather jackets",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Ekkomi | British Luxury Leather & Suede Jackets",
    description:
      "Discover Ekkomi, a contemporary British luxury fashion house. Explore distinctive leather and suede jackets defined by craftsmanship, individuality and timeless design.",
    images: ["/collection-assets/collection/nocturne/temptation/temptation.jpg"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.ekkomi.co.uk/#organization",
        name: "Ekkomi",
        url: "https://www.ekkomi.co.uk/",
        description:
          "Ekkomi is a contemporary British luxury fashion house specialising in distinctive leather and suede jackets.",
        logo: {
          "@type": "ImageObject",
          url: "https://www.ekkomi.co.uk/icon.png",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://www.ekkomi.co.uk/#website",
        url: "https://www.ekkomi.co.uk/",
        name: "Ekkomi",
        publisher: {
          "@id": "https://www.ekkomi.co.uk/#organization",
        },
        inLanguage: "en-GB",
      },
    ],
  };

  return (
    <html lang="en-GB">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />

        {/* Google Tag Manager - Consent Mode v2 Default Setup */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  'analytics_storage': 'denied',
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'functionality_storage': 'denied',
  'wait_for_update': 500
});
gtag('js', new Date());`,
          }}
        />

        {/* Google Tag Manager */}
        <script
          async
          src="https://www.googletagmanager.com/gtm.js?id=GTM-KDDXFFNS"
        />
      </head>

      <body>
        <SmoothScroll />
        {children}
        <ShopifyCartUI />
        <CookieConsent />
      </body>
    </html>
  );
}
