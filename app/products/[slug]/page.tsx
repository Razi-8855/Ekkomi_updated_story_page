import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CollectionStyleFooter from "@/components/CollectionStyleFooter";
import ProductGallery from "@/components/products/ProductGallery";
import { productStories } from "@/data/product-stories";
import { getProductCanonicalUrl, getProductReferenceImages, mapProductStyles, PRODUCT_STYLE_SLUGS, type ProductStyleSlug } from "@/lib/products";
import { getLiveVariantAvailability, getShopifyCatalog, type ShopifyVariant, type ShopifyVariantAvailability } from "@/lib/shopify-storefront";
import "../products.css";

type Props = { params: Promise<{ slug: string }> };
const standardSizes = ["S", "M", "L", "XL"];
export const dynamic = "force-dynamic";

function getSlug(value: string): ProductStyleSlug | null {
  return PRODUCT_STYLE_SLUGS.includes(value as ProductStyleSlug) ? value as ProductStyleSlug : null;
}

function standardVariants(variants: ShopifyVariant[]) {
  return variants
    .filter((variant) => standardSizes.includes(variant.selectedOptions.find((option) => option.name.toLowerCase() === "size")?.value ?? ""))
    .sort((a, b) => standardSizes.indexOf(a.selectedOptions.find((option) => option.name.toLowerCase() === "size")?.value ?? "") - standardSizes.indexOf(b.selectedOptions.find((option) => option.name.toLowerCase() === "size")?.value ?? ""));
}

function defaultStandardVariant(variants: ShopifyVariant[]) {
  const available = (variant: ShopifyVariant) =>
    variant.availableForSale &&
    !variant.currentlyNotInStock &&
    (variant.quantityAvailable == null || variant.quantityAvailable > 0);

  return variants.find((variant) =>
    variant.selectedOptions.some((option) => option.name.toLowerCase() === "size" && option.value === "M") && available(variant),
  ) ?? variants.find(available) ?? variants[0] ?? null;
}

function uniqueImages(images: ReturnType<typeof getProductReferenceImages>) {
  return [...new Map(images.filter((image) => Boolean(image.url)).map((image) => [image.url, image])).values()];
}

function formatMoney(amount: string, currency: string) {
  const value = Number(amount);
  try { return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 2 }).format(value); }
  catch { return `${currency} ${amount}`; }
}

function createProductGroup(slug: ProductStyleSlug, product: NonNullable<ReturnType<typeof mapProductStyles>[number]["product"]>, description: string, images: string[], variants: ShopifyVariant[], liveAvailability: ShopifyVariantAvailability[]) {
  const liveById = new Map(liveAvailability.map((item) => [item.id, item]));
  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    "@id": getProductCanonicalUrl(slug),
    productGroupID: product.id,
    name: slug.toUpperCase(),
    description,
    image: images,
    url: getProductCanonicalUrl(slug),
    brand: { "@type": "Brand", name: "EKKOMI" },
    variesBy: ["https://schema.org/size"],
    hasVariant: variants.map((variant) => {
      const size = variant.selectedOptions.find((option) => option.name.toLowerCase() === "size")?.value;
      const current = liveById.get(variant.id) ?? variant;
      const available = current.availableForSale && !current.currentlyNotInStock && (current.quantityAvailable == null || current.quantityAvailable > 0);
      return {
        "@type": "Product",
        name: `${slug.toUpperCase()} · Size ${size}`,
        description,
        image: images,
        ...(variant.sku?.trim() ? { sku: variant.sku } : {}),
        size,
        offers: {
          "@type": "Offer",
          url: getProductCanonicalUrl(slug),
          price: variant.price.amount,
          priceCurrency: variant.price.currencyCode,
          availability: available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
      };
    }),
  };
}

async function getPageData(slug: ProductStyleSlug) {
  try {
    const catalog = await getShopifyCatalog();
    return mapProductStyles(catalog).find((style) => style.slug === slug) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = getSlug(rawSlug);
  if (!slug) return { title: "Jacket not found | EKKOMI", robots: { index: false, follow: true } };
  const title = `${slug.toUpperCase()} | EKKOMI Jacket Story`;
  const description = productStories[slug].description;
  const canonical = getProductCanonicalUrl(slug);
  const style = await getPageData(slug);
  const image = style?.product?.featuredImage?.url ?? style?.product?.images[0]?.url ?? getProductReferenceImages(slug)[0].url;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website", siteName: "EKKOMI", locale: "en_GB", images: [{ url: image, alt: `${slug.toUpperCase()} jacket` }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = getSlug(rawSlug);
  if (!slug) notFound();

  const style = await getPageData(slug);
  const product = style?.product ?? null;
  const story = productStories[slug];
  const variants = product ? standardVariants(product.variants) : [];
  const imageList = uniqueImages(product ? [...(product.featuredImage ? [product.featuredImage] : []), ...product.images] : getProductReferenceImages(slug));
  const imageUrls = imageList.map((image) => image.url);
  let liveAvailability: ShopifyVariantAvailability[] = [];
  if (variants.length) {
    try {
      liveAvailability = await getLiveVariantAvailability(variants.map((variant) => variant.id));
    } catch {
      // The Storefront catalog availability remains available as a fallback in structured data.
    }
  }
  const schema = product ? createProductGroup(slug, product, story.description, imageUrls, variants, liveAvailability) : null;
  const pricingVariant = defaultStandardVariant(variants);
  const sellingPrice = pricingVariant ? Number(pricingVariant.price.amount) : null;
  const currency = pricingVariant?.price.currencyCode;
  const otherStyles = PRODUCT_STYLE_SLUGS.filter((otherSlug) => otherSlug !== slug).map((otherSlug) => ({ slug: otherSlug, image: getProductReferenceImages(otherSlug)[0] }));

  return (
    <main className="product-detail-page">
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />}
      <header className="products-header">
        <Link className="products-header__wordmark" href="/" aria-label="EKKOMI home">EKKOMI</Link>
        <nav aria-label="Product story navigation"><Link href="/products">All Jackets</Link><Link href="/collection">Collection</Link><Link href="/journal">Journal</Link></nav>
      </header>

      <div className="product-detail__breadcrumb"><Link href="/products">Products</Link><span aria-hidden="true">/</span><span>{slug.toUpperCase()}</span></div>

      <section className="product-detail__hero product-story-hero">
        <ProductGallery images={imageList} productName={slug.toUpperCase()} />
        <div className="product-detail__summary">
          <h1>{slug.toUpperCase()}</h1>
          <p className="product-detail__core">{story.coreStatement}</p>
          <p className="product-detail__description">{story.description.split(/(?<=[.!?])\s+/)[0]}</p>
        </div>
      </section>

      <section className="product-detail__story product-story-editorial">
        <div className="product-story-copy">
          <p className="products-eyebrow">THE STORY</p>
          <h2>{slug.toUpperCase()}</h2>
          <p>{story.description}</p>
        </div>
        <div className="product-story-copy">
          <p className="products-eyebrow">DESIGN INSPIRATION</p>
          <h2>THE DESIGN IDEA</h2>
          <p className="product-story-quote">“{story.coreStatement}”</p>
        </div>
      </section>

      <section className="product-detail__facts product-story-information" aria-labelledby="product-information-title">
        <p className="products-eyebrow">PRODUCT INFORMATION</p>
        <h2 id="product-information-title">THE DETAILS</h2>
        <dl>
          <div><dt>Colour</dt><dd>{story.colour}</dd></div>
          {sellingPrice !== null && Number.isFinite(sellingPrice) && currency && <div><dt>Price</dt><dd>
            {formatMoney(String(sellingPrice), currency)}
          </dd></div>}
          <div className="product-story-size-row"><dt>Sizes</dt><dd>{variants.length
            ? [...new Set(variants.map((variant) => variant.selectedOptions.find((option) => option.name.toLowerCase() === "size")?.value).filter((size): size is string => Boolean(size)))].join(", ")
            : "Size information temporarily unavailable"}</dd></div>
          {style?.ambiguous && <div><dt>Product mapping</dt><dd>More than one Shopify product matches this style in the selected collection. Please confirm the intended product record.</dd></div>}
        </dl>
      </section>

      <section className="product-detail__story product-story-interpretation">
        <div className="product-story-copy">
          <p className="products-eyebrow">CREATIVE INTERPRETATION</p>
          <h2>THE FEELING</h2>
          <p>{story.interpretation}</p>
        </div>
        <div className="product-story-copy">
          <p className="products-eyebrow">VISUAL DIRECTION</p>
          <h2>IN FRAME</h2>
          <ul>{story.visualDirection.map((line) => <li key={line}>{line}</li>)}</ul>
        </div>
      </section>

      {imageList.length > 1 && <section className="product-detail__gallery-section" aria-labelledby="product-gallery-title">
        <p className="products-eyebrow">MATERIAL &amp; FORM</p>
        <h2 id="product-gallery-title">PRODUCT PERSPECTIVES</h2>
        <div className="product-detail__gallery-grid">{imageList.slice(1).map((image, index) => <figure key={`${image.url}-${index}`}><img src={image.url} alt={image.altText || `${slug} jacket detail ${index + 1}`} loading="lazy" />{image.altText && <figcaption>{image.altText}</figcaption>}</figure>)}</div>
      </section>}

      <section className="product-detail__related product-story-explore" aria-labelledby="explore-jackets-title">
        <p className="products-eyebrow">FIVE DISTINCT EXPRESSIONS</p>
        <h2 id="explore-jackets-title">EXPLORE MORE JACKETS</h2>
        <div className="product-detail__related-grid">{otherStyles.map(({ slug: otherSlug, image }) => <Link className="product-detail__related-card" href={`/products/${otherSlug}`} key={otherSlug}><img src={image.url} alt={image.altText || `${otherSlug} jacket`} loading="lazy" /><strong>{otherSlug.toUpperCase()}</strong></Link>)}</div>
      </section>

      <CollectionStyleFooter />
    </main>
  );
}
