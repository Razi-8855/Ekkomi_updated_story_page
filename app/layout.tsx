import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CookieConsent from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "EKKOMI — A study in presence",
  description: "An EKKOMI visual story. Considered form, made to be felt.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
        {/* Google Tag Manager Script (GTM-KDDXFFNS) */}
        <script async src="https://www.googletagmanager.com/gtm.js?id=GTM-KDDXFFNS" />
      </head>
      <body>
        <SmoothScroll />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
