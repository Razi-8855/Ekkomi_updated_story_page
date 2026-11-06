import type { Metadata } from "next";
import CollectionExperience from "@/components/collection/CollectionExperience";
import { getShopifyCatalog, type ShopifyCatalog } from "@/lib/shopify-storefront";
import markup from "./markup";
import "./collection.css";

const collectionTitle = "Nocturne Collection | Luxury Suede Jackets – Ekkomi";
const collectionDescription =
  "Discover Nocturne by Ekkomi, a collection of distinctive suede jackets inspired by individuality and understated luxury.";

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
  },
  twitter: {
    card: "summary_large_image",
    title: collectionTitle,
    description: collectionDescription,
  },
};

export const revalidate = 300;

function buildCollectionJsonLd(catalog: ShopifyCatalog) {
  const products = [...catalog.men, ...catalog.women];

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
          const standardVariants = product.variants.filter((item) => {
            const size = item.selectedOptions.find((option) => option.name.toLowerCase() === "size")?.value;
            return ["S", "M", "L", "XL"].includes(size ?? "");
          });
          const isPurchasable = (item: (typeof product.variants)[number]) =>
            item.availableForSale && (item.quantityAvailable == null || item.quantityAvailable > 0);
          const variant =
            standardVariants.find(isPurchasable) ??
            standardVariants[0] ??
            product.variants[0];
          const material = product.metafields.find(
            (item) => item?.key === "material",
          )?.value;
          const color = product.options.find((option) =>
            /colou?r/i.test(option.name),
          )?.values[0];

          return {
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Product",
              "@id": `https://www.ekkomi.co.uk/collection#${product.handle}`,
              name: product.title,
              description: product.description,
              image: product.featuredImage?.url ?? product.images[0]?.url,
              ...(color ? { color } : {}),
              ...(material ? { material } : {}),
              brand: { "@type": "Brand", name: "Ekkomi" },
              ...(variant
                ? {
                    offers: {
                      "@type": "Offer",
                      price: variant.price.amount,
                      priceCurrency: variant.price.currencyCode,
                      availability: standardVariants.some(isPurchasable)
                        ? "https://schema.org/InStock"
                        : "https://schema.org/OutOfStock",
                      url: `https://www.ekkomi.co.uk/collection#${product.handle}`,
                    },
                  }
                : {}),
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
