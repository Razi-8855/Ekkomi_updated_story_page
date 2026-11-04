import type { Metadata } from "next";
import CollectionExperience from "@/components/collection/CollectionExperience";
import markup from "./markup";
import "./collection.css";

export const metadata: Metadata = {
  title: "Nocturne Collection | Luxury Suede Jackets – Ekkomi",

  description:
    "Discover Nocturne by Ekkomi: five distinctive suede jackets inspired by individuality, intricate embroidery and understated British luxury.",

  alternates: {
    canonical: "/collection",
  },

  openGraph: {
    title: "Nocturne Collection | Luxury Suede Jackets – Ekkomi",
    description:
      "Discover Nocturne by Ekkomi: five distinctive suede jackets inspired by individuality, intricate embroidery and understated British luxury.",
    url: "/collection",
    type: "website",
    images: [
      {
        url: "/collection-assets/collection/nocturne/temptation/temptation.jpg",
        width: 1200,
        height: 1800,
        alt: "Ekkomi Nocturne Collection - Luxury Suede Jackets",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Nocturne Collection | Luxury Suede Jackets – Ekkomi",
    description:
      "Discover Nocturne by Ekkomi: five distinctive suede jackets inspired by individuality, intricate embroidery and understated British luxury.",
    images: ["/collection-assets/collection/nocturne/temptation/temptation.jpg"],
  },
};

const collectionJsonLd = {
  "breadcrumb": {
    "@id": "https://www.ekkomi.co.uk/collection#breadcrumb",
  },
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "https://www.ekkomi.co.uk/collection#webpage",
      "url": "https://www.ekkomi.co.uk/collection",
      "name": "Nocturne Collection | Luxury Suede Jackets | Ekkomi",
      "description":
        "Discover Nocturne by Ekkomi: five distinctive luxury suede jackets defined by considered British design.",
      "isPartOf": {
        "@type": "WebSite",
        "@id": "https://www.ekkomi.co.uk/#website",
        "name": "Ekkomi",
        "url": "https://www.ekkomi.co.uk",
      },
    },
    {
      "@type": "ItemList",
      "@id": "https://www.ekkomi.co.uk/collection#itemlist",
      "name": "Nocturne Collection",
      "description": "Five luxury suede jackets by Ekkomi.",
      "numberOfItems": 5,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "Product",
            "@id": "https://www.ekkomi.co.uk/collection#curiosity",
            "name": "Curiosity Suede Jacket",
            "description":
              "Navy luxury suede jacket with tonal needlework, brushed nap, and bespoke Nocturne silk lining.",
            "image":
              "https://www.ekkomi.co.uk/collection-assets/collection/nocturne/curiosity/curiosity.jpg",
            "color": "Navy",
            "material": "Luxury Suede",
            "brand": { "@type": "Brand", "name": "Ekkomi" },
            "offers": {
              "@type": "Offer",
              "price": "785.00",
              "priceCurrency": "GBP",
              "availability": "https://schema.org/PreOrder",
              "url": "https://www.ekkomi.co.uk/collection#curiosity",
            },
          },
        },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "Product",
            "@id": "https://www.ekkomi.co.uk/collection#temptation",
            "name": "Temptation Suede Jacket",
            "description":
              "Forest Green luxury suede jacket with shifting needlework across the upper chest and bespoke Nocturne silk lining.",
            "image":
              "https://www.ekkomi.co.uk/collection-assets/collection/nocturne/temptation/temptation.jpg",
            "color": "Forest Green",
            "material": "Luxury Suede",
            "brand": { "@type": "Brand", "name": "Ekkomi" },
            "offers": {
              "@type": "Offer",
              "price": "855.00",
              "priceCurrency": "GBP",
              "availability": "https://schema.org/PreOrder",
              "url": "https://www.ekkomi.co.uk/collection#temptation",
            },
          },
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@type": "Product",
            "@id": "https://www.ekkomi.co.uk/collection#desire",
            "name": "Desire Suede Jacket",
            "description":
              "Deep Red luxury suede jacket with shifting embroidery and bespoke Nocturne silk lining.",
            "image":
              "https://www.ekkomi.co.uk/collection-assets/collection/nocturne/desire/desire.jpg",
            "color": "Deep Red",
            "material": "Luxury Suede",
            "brand": { "@type": "Brand", "name": "Ekkomi" },
            "offers": {
              "@type": "Offer",
              "price": "855.00",
              "priceCurrency": "GBP",
              "availability": "https://schema.org/PreOrder",
              "url": "https://www.ekkomi.co.uk/collection#desire",
            },
          },
        },
        {
          "@type": "ListItem",
          "position": 4,
          "item": {
            "@type": "Product",
            "@id": "https://www.ekkomi.co.uk/collection#audacity",
            "name": "Audacity Suede Jacket",
            "description":
              "Mustard yellow luxury suede jacket with tonal needlework, brushed nap, and bespoke Nocturne silk lining.",
            "image":
              "https://www.ekkomi.co.uk/collection-assets/collection/nocturne/audacity/audacity.jpg",
            "color": "Mustard yellow",
            "material": "Luxury Suede",
            "brand": { "@type": "Brand", "name": "Ekkomi" },
            "offers": {
              "@type": "Offer",
              "price": "970.00",
              "priceCurrency": "GBP",
              "availability": "https://schema.org/PreOrder",
              "url": "https://www.ekkomi.co.uk/collection#audacity",
            },
          },
        },
        {
          "@type": "ListItem",
          "position": 5,
          "item": {
            "@type": "Product",
            "@id": "https://www.ekkomi.co.uk/collection#insolence",
            "name": "Insolence Suede Jacket",
            "description":
              "Jet black luxury suede jacket with tonal needlework across the upper chest and bespoke Nocturne silk lining.",
            "image":
              "https://www.ekkomi.co.uk/collection-assets/collection/nocturne/insolence/insolence.jpg",
            "color": "Jet black",
            "material": "Luxury Suede",
            "brand": { "@type": "Brand", "name": "Ekkomi" },
            "offers": {
              "@type": "Offer",
              "price": "1050.00",
              "priceCurrency": "GBP",
              "availability": "https://schema.org/PreOrder",
              "url": "https://www.ekkomi.co.uk/collection#insolence",
            },
          },
        },
      ],
    },
  ],
};

export default function CollectionPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionJsonLd),
        }}
      />
      <CollectionExperience markup={markup} />
    </>
  );
}
