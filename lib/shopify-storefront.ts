export type ShopifyImage = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type ShopifyVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  currentlyNotInStock: boolean;
  quantityAvailable: number | null;
  price: { amount: string; currencyCode: string };
  compareAtPrice: { amount: string; currencyCode: string } | null;
  selectedOptions: Array<{ name: string; value: string }>;
};

export type ShopifyMetafield = {
  namespace: string;
  key: string;
  value: string;
} | null;

export type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  description: string;
  featuredImage: ShopifyImage | null;
  images: ShopifyImage[];
  options: Array<{ name: string; values: string[] }>;
  variants: ShopifyVariant[];
  metafields: ShopifyMetafield[];
};

export type ShopifyCatalog = {
  men: ShopifyProduct[];
  women: ShopifyProduct[];
};

type ShopifyProductConnectionResponse = Omit<ShopifyProduct, "images" | "variants"> & {
  images: { nodes: ShopifyImage[] };
  variants: { nodes: ShopifyVariant[] };
};

type ShopifyCollectionResponse = {
  handle: string;
  title: string;
  products: { nodes: ShopifyProductConnectionResponse[] };
};

const COLLECTION_QUERY = `
  query EkkomiCollectionProducts($menHandle: String!, $womenHandle: String!) {
    men: collection(handle: $menHandle) {
      handle
      title
      products(first: 50) {
        nodes {
          id
          title
          handle
          description
          featuredImage { url altText width height }
          images(first: 30) { nodes { url altText width height } }
          options { name values }
          variants(first: 100) {
            nodes {
              id
              title
              availableForSale
              currentlyNotInStock
              quantityAvailable
              price { amount currencyCode }
              compareAtPrice { amount currencyCode }
              selectedOptions { name value }
            }
          }
          metafields(identifiers: [
            { namespace: "custom", key: "material" }
            { namespace: "custom", key: "colour" }
            { namespace: "custom", key: "color" }
            { namespace: "custom", key: "tagline" }
            { namespace: "custom", key: "embroidery" }
            { namespace: "custom", key: "inner_world" }
            { namespace: "custom", key: "craft" }
          ]) { namespace key value }
        }
      }
    }
    women: collection(handle: $womenHandle) {
      handle
      title
      products(first: 50) {
        nodes {
          id
          title
          handle
          description
          featuredImage { url altText width height }
          images(first: 30) { nodes { url altText width height } }
          options { name values }
          variants(first: 100) {
            nodes {
              id
              title
              availableForSale
              currentlyNotInStock
              quantityAvailable
              price { amount currencyCode }
              compareAtPrice { amount currencyCode }
              selectedOptions { name value }
            }
          }
          metafields(identifiers: [
            { namespace: "custom", key: "material" }
            { namespace: "custom", key: "colour" }
            { namespace: "custom", key: "color" }
            { namespace: "custom", key: "tagline" }
            { namespace: "custom", key: "embroidery" }
            { namespace: "custom", key: "inner_world" }
            { namespace: "custom", key: "craft" }
          ]) { namespace key value }
        }
      }
    }
  }
`;

const LIVE_VARIANT_QUERY = `
  query EkkomiLiveVariantInventory($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        availableForSale
        currentlyNotInStock
        quantityAvailable
      }
    }
  }
`;

type ShopifyGraphQLResult<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

function getShopifyConnection() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim();
  const version = process.env.SHOPIFY_STOREFRONT_API_VERSION?.trim();

  if (!domain || !token || !version) {
    throw new Error("Shopify is not configured. Check the required Shopify environment variables.");
  }
  if (!/^\d{4}-\d{2}$/.test(version)) {
    throw new Error("Shopify API version must use the YYYY-MM format.");
  }

  const normalizedDomain = domain.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  let endpoint: URL;
  try {
    endpoint = new URL(`https://${normalizedDomain}/api/${version}/graphql.json`);
  } catch {
    throw new Error("Shopify store domain is invalid.");
  }
  if (endpoint.protocol !== "https:") {
    throw new Error("Shopify Storefront API requires HTTPS.");
  }

  return { endpoint, token };
}

export async function runShopifyQuery<T>(
  query: string,
  variables: Record<string, unknown>,
  revalidateSeconds?: number,
): Promise<ShopifyGraphQLResult<T>> {
  const { endpoint, token } = getShopifyConnection();
  const options: RequestInit & { next?: { revalidate: number } } = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  };

  if (revalidateSeconds) options.next = { revalidate: revalidateSeconds };
  else options.cache = "no-store";

  let response: Response;
  try {
    response = await fetch(endpoint, options);
  } catch {
    throw new Error("Could not connect to Shopify. The collection data is temporarily unavailable.");
  }
  if (!response.ok) {
    throw new Error(`Shopify Storefront API returned HTTP ${response.status}.`);
  }
  return (await response.json()) as ShopifyGraphQLResult<T>;
}

async function runWithInventoryFallback<T>(
  query: string,
  variables: Record<string, unknown>,
  revalidateSeconds?: number,
) {
  const hasQuantityField = /\bquantityAvailable\b/.test(query);
  const queryWithoutQuantities = query.replace(/^\s*quantityAvailable\s*$/gm, "");
  const result = await runShopifyQuery<T>(query, variables, revalidateSeconds);
  const inventoryAccessError = result.errors?.some((error) =>
    /quantityAvailable|inventory.*access|access.*inventory/i.test(error.message ?? ""),
  );
  if (!inventoryAccessError) return result;

  return runShopifyQuery<T>(queryWithoutQuantities, variables, revalidateSeconds);
}

const MEN_DISPLAY_ORDER = ["curiosity", "temptation", "desire", "audacity", "insolence"];
const WOMEN_DISPLAY_ORDER = ["curiosity-women", "desire-women", "audacity-women"];

function orderProducts(products: ShopifyProduct[], handles: string[]) {
  const order = new Map(handles.map((handle, index) => [handle, index]));
  return [...products].sort((a, b) => {
    const ai = order.get(a.handle) ?? handles.length;
    const bi = order.get(b.handle) ?? handles.length;
    return ai - bi || a.title.localeCompare(b.title);
  });
}

function normalizeProduct(product: ShopifyProductConnectionResponse): ShopifyProduct {
  return {
    ...product,
    images: product.images?.nodes ?? [],
    variants: (product.variants?.nodes ?? []).map((variant) => ({
      ...variant,
      quantityAvailable: variant.quantityAvailable ?? null,
    })),
    metafields: product.metafields ?? [],
  };
}

export type ShopifyVariantAvailability = Pick<
  ShopifyVariant,
  "id" | "availableForSale" | "currentlyNotInStock" | "quantityAvailable"
>;

export async function getLiveVariantAvailability(
  variantIds: string[],
): Promise<ShopifyVariantAvailability[]> {
  const result = await runWithInventoryFallback<{
    nodes?: Array<ShopifyVariantAvailability | null>;
  }>(LIVE_VARIANT_QUERY, { ids: variantIds });

  if (result.errors?.length || !result.data?.nodes) {
    throw new Error("Shopify could not verify the selected variant inventory.");
  }
  return result.data.nodes.filter((variant): variant is ShopifyVariantAvailability => Boolean(variant));
}

export async function getShopifyCatalog(): Promise<ShopifyCatalog> {
  const result = await runWithInventoryFallback<{
    men?: ShopifyCollectionResponse | null;
    women?: ShopifyCollectionResponse | null;
  }>(COLLECTION_QUERY, { menHandle: "men", womenHandle: "women" }, 300);

  if (result.errors?.length) {
    throw new Error("Shopify returned an error while loading the collections.");
  }

  const men = result.data?.men;
  const women = result.data?.women;
  if (!men || !women) {
    throw new Error("The MEN or WOMEN Shopify collection handle could not be found.");
  }

  return {
    men: orderProducts(men.products.nodes.map(normalizeProduct), MEN_DISPLAY_ORDER),
    women: orderProducts(women.products.nodes.map(normalizeProduct), WOMEN_DISPLAY_ORDER),
  };
}
