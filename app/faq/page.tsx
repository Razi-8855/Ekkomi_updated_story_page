import type { Metadata } from "next";
import Link from "next/link";
import FAQAccordion from "@/components/FAQAccordion";
import FAQSchema from "@/components/FAQSchema";
import CollectionStyleFooter from "@/components/CollectionStyleFooter";
import { faqCategories } from "@/data/faqs";
import "./faq.css";

export const metadata: Metadata = {
  title: { absolute: "EKKOMI FAQs | Suede Jackets, Sizing and Orders" },
  description:
    "Find answers about EKKOMI suede leather jackets, embroidered details, sizing, orders, shipping, returns and customer support.",
  alternates: { canonical: "https://www.ekkomi.co.uk/faq" },
  openGraph: {
    title: "EKKOMI FAQs | Suede Jackets, Sizing and Orders",
    description:
      "Find answers about EKKOMI suede leather jackets, embroidered details, sizing, orders, shipping, returns and customer support.",
    url: "https://www.ekkomi.co.uk/faq",
    type: "website",
    siteName: "EKKOMI",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "EKKOMI FAQs | Suede Jackets, Sizing and Orders",
    description:
      "Find answers about EKKOMI suede leather jackets, embroidered details, sizing, orders, shipping, returns and customer support.",
  },
};

export default function FAQPage() {
  return (
    <main className="faq-page">
      <FAQSchema />
      <header className="faq-page__header">
        <Link className="faq-page__wordmark" href="/" aria-label="EKKOMI home">EKKOMI</Link>
        <nav className="faq-page__navigation" aria-label="Page navigation">
          <Link href="/">Our Story</Link>
          <Link href="/collection">The Collection</Link>
        </nav>
      </header>

      <section className="faq-page__intro" aria-labelledby="faq-title">
        <h1 id="faq-title">Frequently Asked Questions</h1>
        <p className="faq-page__lead">
          Find answers to common questions about EKKOMI, our collections, craftsmanship, sizing, orders and customer support.
        </p>
      </section>

      <FAQAccordion categories={faqCategories} />

      <CollectionStyleFooter />
    </main>
  );
}
