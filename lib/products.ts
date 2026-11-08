import { productStories, productTaglines } from "@/data/product-stories";
import type { ShopifyCatalog, ShopifyImage, ShopifyProduct } from "@/lib/shopify-storefront";

export type CatalogProduct = ShopifyProduct & {
  department: "men" | "women";
};

export const PRODUCT_STYLE_SLUGS = ["audacity", "curiosity", "desire", "insolence", "temptation"] as const;
export type ProductStyleSlug = (typeof PRODUCT_STYLE_SLUGS)[number];

const productReferenceImages: Record<ProductStyleSlug, string[]> = {
  audacity: ["audacity.jpg", "audacity_back.jpg", "audacity_detail.jpg", "audacity_lookbook_1.jpg", "audacity_editorial_1.jpg"],
  curiosity: ["curiosity.jpg", "curiosity_back.jpg", "curiosity_detail.jpg", "curiosity_lookbook_1.jpg", "curiosity_lining.jpg"],
  desire: ["desire.jpg", "desire_back.jpg", "desire_detail.jpg", "desire_lookbook_1.jpg", "desire_editorial_1.jpg"],
  insolence: ["insolence.jpg", "insolence_back.jpg", "insolence_detail.jpg", "insolence_editorial_1.jpg", "insolence_editorial_2.jpg"],
  temptation: ["temptation.jpg", "temptation_back.jpg", "temptation_detail.jpg", "temptation_lookbook_1.jpg", "temptation_lookbook_2.jpg"],
};

export type ProductStyleMapping = {
  slug: ProductStyleSlug;
  name: string;
  product: CatalogProduct | null;
  ambiguous: boolean;
};

export function flattenCatalog(catalog: ShopifyCatalog): CatalogProduct[] {
  return [
    ...catalog.men.map((product) => ({ ...product, department: "men" as const })),
    ...catalog.women.map((product) => ({ ...product, department: "women" as const })),
  ];
}

/**
 * Collapse the Shopify men's and women's records to the five editorial styles.
 * The supplied stories describe the men's assortment, so that record is the
 * canonical representative when both departments contain the same style.
 */
export function mapProductStyles(catalog: ShopifyCatalog): ProductStyleMapping[] {
  const products = flattenCatalog(catalog);
  return PRODUCT_STYLE_SLUGS.map((slug) => {
    const matches = products.filter((product) =>
      getProductIdentityKey(product) === slug || product.handle === slug || product.handle.startsWith(`${slug}-`),
    );
    const men = matches.filter((product) => product.department === "men");
    const candidates = men.length ? men : matches.filter((product) => product.department === "women");
    return {
      slug,
      name: slug.toUpperCase(),
      product: candidates.length === 1 ? candidates[0] : null,
      ambiguous: candidates.length > 1,
    };
  });
}

export function getProductReferenceImages(slug: ProductStyleSlug): ShopifyImage[] {
  return productReferenceImages[slug].map((fileName, index) => ({
    url: `/collection-assets/collection/nocturne/${slug}/${fileName}`,
    altText: `${slug} jacket ${index === 0 ? "portrait" : `detail ${index}`}`,
    width: null,
    height: null,
  }));
}

export function getProductDisplayName(product: ShopifyProduct) {
  return product.title
    .replace(/\s*[-–—|]?\s*(?:MEN|WOMEN)(?:['’]S)?(?:\s+(?:SUEDE|LEATHER))?(?:\s+JACKETS?)?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getProductIdentityKey(product: ShopifyProduct) {
  return getProductDisplayName(product).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function getProductAttributes(product: CatalogProduct) {
  const identity = getProductIdentityKey(product);
  const story = product.department === "men" ? productStories[identity] ?? null : null;
  const colourOption = product.options.find((option) => /colou?r/i.test(option.name))?.values[0];
  const colourMetafield = product.metafields.find((field) => field?.key === "colour" || field?.key === "color")?.value;
  const material = product.metafields.find((field) => field?.key === "material")?.value;
  const embroidery = product.metafields.find((field) => field?.key === "embroidery")?.value;
  const tagline =
    product.metafields.find((field) => field?.key === "tagline")?.value ||
    story?.coreStatement ||
    productTaglines[identity] ||
    "";

  return {
    identity,
    story,
    displayName: getProductDisplayName(product),
    genderLabel: product.department === "men" ? "Men’s collection" : "Women’s collection",
    description: story?.description || product.description,
    colour: colourOption || colourMetafield || story?.colour || "",
    material: material || "",
    embroidery: embroidery || "",
    tagline,
  };
}

export function getProductCanonicalUrl(handle: string) {
  return `https://www.ekkomi.co.uk/products/${encodeURIComponent(handle)}`;
}
