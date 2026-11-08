import type { Metadata } from "next";
import CollectionExperience from "@/components/collection/CollectionExperience";
import { flattenCatalog } from "@/lib/products";
import { getShopifyCatalog, type ShopifyCatalog } from "@/lib/shopify-storefront";
import markup from "./markup";
import "./collection.css";

const collectionTitle = "Nocturne Collection | Embroidered Suede Jackets – EKKOMI";
const collectionDescription =
  "Discover Nocturne by EKKOMI, a collection of distinctive embroidered suede jackets inspired by individuality and considered design.";

export const metadata: Metadata = {
  title: { absolute: collectionTitle },
  description: collectionDescription,
  alternates: { canonical: "/collection" },
  openGraph: {
    title: collectionTitle,
    description: collectionDescription,
    url: "/collection",
    type: "website",
    siteName: "Ekkomi",
    locale: "en_GB",
    images: [{ url: "/collection-assets/collection/nocturne/temptation/temptation.jpg", alt: "EKKOMI Nocturne embroidered suede jacket" }],
  },
  twitter: {
    card: "summary_large_image",
    title: collectionTitle,
    description: collectionDescription,
    images: ["/collection-assets/collection/nocturne/temptation/temptation.jpg"],
  },
};

export const revalidate = 60;

function buildCollectionJsonLd(catalog: ShopifyCatalog) {
  const products = flattenCatalog(catalog);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://www.ekkomi.co.uk/collection#webpage",
        url: "https://www.ekkomi.co.uk/collection",
        name: collectionTitle,
        description: collectionDescription,
        isPartOf: { "@id": "https://www.ekkomi.co.uk/#website" },
        publisher: { "@id": "https://www.ekkomi.co.uk/#organization" },
      },
      {
        "@type": "ItemList",
        name: "Nocturne Collection",
        numberOfItems: products.length,
        itemListElement: products.map((product, index) => {
          return {
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Product",
              "@id": product.id,
              name: product.title,
              description: product.description,
              ...(product.featuredImage?.url || product.images[0]?.url
                ? { image: product.featuredImage?.url ?? product.images[0]?.url }
                : {}),
              brand: { "@type": "Brand", name: "EKKOMI" },
              url: "https://www.ekkomi.co.uk/collection",
              offers: product.variants.map((variant) => {
                const available = variant.availableForSale && !variant.currentlyNotInStock &&
                  (variant.quantityAvailable === null || variant.quantityAvailable > 0);
                return {
                  "@type": "Offer",
                  url: "https://www.ekkomi.co.uk/collection",
                  price: variant.price.amount,
                  priceCurrency: variant.price.currencyCode,
                  availability: available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                };
              }),
            },
          };
        }),
      },
    ],
  };
}

export default async function CollectionPage() {
  let catalog: ShopifyCatalog | null = null;
  let loadError = false;

  try {
    catalog = await getShopifyCatalog();
  } catch (error) {
    loadError = true;
    console.error(
      "[Shopify catalog]",
      error instanceof Error
        ? error.message
        : "Unable to load Shopify products.",
    );
  }

  const pageMarkup = markup
    .replace("{{MEN_COUNT}}", String(catalog?.men.length ?? 0).padStart(2, "0"))
    .replace("{{WOMEN_COUNT}}", String(catalog?.women.length ?? 0).padStart(2, "0"));
  const structuredData = catalog ? buildCollectionJsonLd(catalog) : null;

  return (
    <>
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}
      <CollectionExperience
        markup={pageMarkup}
        catalog={catalog}
        loadError={loadError}
      />
    </>
  );
}
