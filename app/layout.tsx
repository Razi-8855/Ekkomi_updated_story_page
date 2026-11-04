import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CookieConsent from "@/components/CookieConsent";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ekkomi.co.uk"),

  title: {
    default: "Ekkomi | Luxury Suede & Leather Jackets",
    template: "%s | Ekkomi",
  },

  description:
    "Discover Ekkomi, a contemporary luxury fashion house. Explore distinctive suede and leather jackets defined by considered design, craftsmanship and individuality.",

  applicationName: "Ekkomi",

  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Ekkomi",
    title: "Ekkomi | Luxury Suede & Leather Jackets",
    description:
      "Discover Ekkomi's distinctive approach to luxury fashion, craftsmanship and contemporary design.",
    images: [
      {
        url: "/collection-assets/collection/nocturne/temptation/temptation.jpg",
        width: 1200,
        height: 1800,
        alt: "Ekkomi | Luxury Suede & Leather Jackets",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Ekkomi | Luxury Suede & Leather Jackets",
    description:
      "Discover Ekkomi's distinctive approach to luxury fashion, craftsmanship and contemporary design.",
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
  return (
    <html lang="en">
      <head>
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
        <CookieConsent />
      </body>
    </html>
  );
}
