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
      <body>
        <SmoothScroll />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
