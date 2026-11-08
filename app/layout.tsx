import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CookieConsent from "@/components/CookieConsent";
import ShopifyCartUI from "@/components/ShopifyCartUI";
import OrganizationSchema from "@/components/OrganizationSchema";
import { EKKOMI_WHATSAPP_NUMBER } from "@/lib/brand-config";
import "./shopify-cart.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ekkomi.co.uk"),

  title: {
    default: "EKKOMI | Embroidered Suede Jackets",
    template: "%s | Ekkomi",
  },

  description:
    "Discover EKKOMI, a fashion brand creating distinctive suede leather jackets with embroidered details and contemporary design.",

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
    title: "EKKOMI | Embroidered Suede Jackets",
    description:
      "Discover EKKOMI, a fashion brand creating distinctive suede leather jackets with embroidered details and contemporary design.",
    url: "https://www.ekkomi.co.uk/",
    images: [
      {
        url: "/collection-assets/collection/nocturne/temptation/temptation.jpg",
        width: 1200,
        height: 1800,
        alt: "EKKOMI embroidered suede jackets",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "EKKOMI | Embroidered Suede Jackets",
    description:
      "Discover EKKOMI, a fashion brand creating distinctive suede leather jackets with embroidered details and contemporary design.",
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
    <html lang="en-GB" data-ekkomi-whatsapp={EKKOMI_WHATSAPP_NUMBER}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <OrganizationSchema />

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
