import type { Metadata } from "next";
import Link from "next/link";
import CollectionStyleFooter from "@/components/CollectionStyleFooter";
import { productStories } from "@/data/product-stories";
import { getProductCanonicalUrl, getProductReferenceImages, mapProductStyles, PRODUCT_STYLE_SLUGS, type ProductStyleMapping } from "@/lib/products";
import { getShopifyCatalog } from "@/lib/shopify-storefront";
import "./products.css";

const pageTitle = "EKKOMI Products | The Collection";
const pageDescription = "Explore the EKKOMI collection of embroidered suede jackets. Five distinct expressions, each with its own character, inspiration and design identity.";
const productsShareImage = "/collection-assets/collection/nocturne/curiosity/curiosity.jpg";

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: pageDescription,
  alternates: { canonical: "https://www.ekkomi.co.uk/products" },
  openGraph: { title: pageTitle, description: pageDescription, url: "https://www.ekkomi.co.uk/products", type: "website", siteName: "EKKOMI", locale: "en_GB", images: [{ url: productsShareImage, alt: "EKKOMI embroidered suede jacket" }] },
  twitter: { card: "summary_large_image", title: pageTitle, description: pageDescription, images: [productsShareImage] },
};

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  let products: ProductStyleMapping[] = PRODUCT_STYLE_SLUGS.map((slug) => ({ slug, name: slug.toUpperCase(), product: null, ambiguous: false }));
  try {
    products = mapProductStyles(await getShopifyCatalog());
  } catch {
    // Editorial stories and existing reference imagery remain viewable while Shopify is unavailable.
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": "https://www.ekkomi.co.uk/products#webpage", url: "https://www.ekkomi.co.uk/products", name: pageTitle, description: pageDescription, isPartOf: { "@id": "https://www.ekkomi.co.uk/#website" }, publisher: { "@id": "https://www.ekkomi.co.uk/#organization" } },
      { "@type": "ItemList", name: "EKKOMI Jacket Styles", numberOfItems: products.length, itemListElement: products.map((style, index) => ({ "@type": "ListItem", position: index + 1, item: { "@id": getProductCanonicalUrl(style.slug), url: getProductCanonicalUrl(style.slug), name: style.name } })) },
    ],
  };

  return (
    <main className="products-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <header className="products-header">
        <Link className="products-header__wordmark" href="/" aria-label="EKKOMI home">EKKOMI</Link>
        <nav aria-label="Products navigation"><Link href="/collection">Collection</Link><Link href="/journal">Journal</Link></nav>
      </header>

      <section className="products-hero" aria-labelledby="products-title">
        <h1 id="products-title">THE COLLECTION</h1>
        <p>{pageDescription}</p>
      </section>

      <section className="products-grid" aria-label="The five EKKOMI jacket styles">
        {products.map((style) => {
          const story = productStories[style.slug];
          const image = style.product?.featuredImage ?? style.product?.images[0] ?? getProductReferenceImages(style.slug)[0];
          return (
            <article className="products-card" key={style.slug}>
              <Link className="products-card__image" href={`/products/${style.slug}`} aria-label={`Discover ${style.name}`}>
                <img src={image.url} alt={image.altText || `${style.name} suede jacket`} loading="lazy" />
              </Link>
              <div className="products-card__meta">
                {style.ambiguous && <p>Product details need confirmation</p>}
                <h2><Link href={`/products/${style.slug}`}>{style.name}</Link></h2>
                <p className="products-card__description">{story.description.split(/(?<=[.!?])\s+/)[0]}</p>
                <Link className="products-card__link" href={`/products/${style.slug}`}>Discover the Jacket</Link>
              </div>
            </article>
          );
        })}
      </section>

      <CollectionStyleFooter />
    </main>
  );
}
