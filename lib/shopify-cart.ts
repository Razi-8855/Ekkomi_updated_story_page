import { getLiveVariantAvailability, runShopifyQuery } from "@/lib/shopify-storefront";

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  cost { subtotalAmount { amount currencyCode } }
  lines(first: 100) {
    nodes {
      id
      quantity
      merchandise {
        ... on ProductVariant {
          id
          title
          selectedOptions { name value }
          product { title featuredImage { url altText width height } }
        }
      }
      cost {
        amountPerQuantity { amount currencyCode }
        subtotalAmount { amount currencyCode }
      }
    }
  }
`;

const CART_QUERY = `query EkkomiCart($cartId: ID!) { cart(id: $cartId) { ${CART_FIELDS} } }`;
const CART_CREATE = `mutation EkkomiCartCreate($input: CartInput!) {
  cartCreate(input: $input) {
    cart { ${CART_FIELDS} }
    userErrors { field message }
  }
}`;
const CART_LINES_ADD = `mutation EkkomiCartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart { ${CART_FIELDS} }
    userErrors { field message }
  }
}`;
const CART_LINES_UPDATE = `mutation EkkomiCartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
  cartLinesUpdate(cartId: $cartId, lines: $lines) {
    cart { ${CART_FIELDS} }
    userErrors { field message }
  }
}`;
const CART_LINES_REMOVE = `mutation EkkomiCartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
  cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
    cart { ${CART_FIELDS} }
    userErrors { field message }
  }
}`;

export type ShopifyCartLine = {
  id: string;
  variantId: string;
  name: string;
  size: string;
  image: { url: string; altText: string | null } | null;
  quantity: number;
  unitPrice: { amount: string; currencyCode: string };
  lineTotal: { amount: string; currencyCode: string };
};

export type ShopifyCart = {
  lines: ShopifyCartLine[];
  totalQuantity: number;
  subtotal: { amount: string; currencyCode: string };
  checkoutUrl: string;
};

type CartGraphQL = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: { amount: string; currencyCode: string } };
  lines: { nodes: Array<{
    id: string;
    quantity: number;
    merchandise: {
      id: string;
      title: string;
      selectedOptions: Array<{ name: string; value: string }>;
      product: { title: string; featuredImage: { url: string; altText: string | null } | null };
    };
    cost: {
      amountPerQuantity: { amount: string; currencyCode: string };
      subtotalAmount: { amount: string; currencyCode: string };
    };
  }> };
};

export class CartOperationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function normalizeCart(cart: CartGraphQL): ShopifyCart {
  const lines = cart.lines.nodes.map((line) => ({
    id: line.id,
    variantId: line.merchandise.id,
    name: line.merchandise.product.title,
    size: line.merchandise.selectedOptions.find((option) => /size/i.test(option.name))?.value ?? line.merchandise.title,
    image: line.merchandise.product.featuredImage,
    quantity: line.quantity,
    unitPrice: line.cost.amountPerQuantity,
    lineTotal: line.cost.subtotalAmount,
  }));
  return {
    lines,
    totalQuantity: cart.totalQuantity,
    subtotal: cart.cost.subtotalAmount,
    checkoutUrl: cart.checkoutUrl,
  };
}

function mutationError(errors?: Array<{ message: string }>, gqlErrors?: Array<{ message?: string }>) {
  const message = errors?.map((error) => error.message).filter(Boolean).join(" ")
    || gqlErrors?.map((error) => error.message).filter(Boolean).join(" ");
  if (message) throw new CartOperationError(message, 409);
}

export async function getCart(cartId: string): Promise<{ id: string; cart: ShopifyCart } | null> {
  const result = await runShopifyQuery<{ cart: CartGraphQL | null }>(CART_QUERY, { cartId });
  mutationError(undefined, result.errors);
  if (!result.data?.cart) return null;
  return { id: cartId, cart: normalizeCart(result.data.cart) };
}

async function validateVariantQuantity(variantId: string, quantity: number, alreadyInCart = 0, previousLineQuantity = 0) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new CartOperationError("Choose a quantity between 1 and 99.");
  }
  let variants;
  try {
    variants = await getLiveVariantAvailability([variantId]);
  } catch {
    throw new CartOperationError("Live availability could not be verified. Please try again shortly.", 503);
  }
  const variant = variants.find((item) => item.id === variantId);
  if (quantity < previousLineQuantity) return;
  if (!variant || !variant.availableForSale || variant.currentlyNotInStock) {
    throw new CartOperationError("This size has just sold out. Choose another size.", 409);
  }
  const available = variant.quantityAvailable;
  if (available === 0 || quantity + alreadyInCart > (available ?? 1)) {
    throw new CartOperationError(
      available == null
        ? "Shopify could not provide the live quantity. For now, only one unit can be added."
        : `Only ${Math.max(0, available - alreadyInCart)} unit(s) remain for this size.`,
      409,
    );
  }
}

export async function addCartLine(cartId: string | null, variantId: string, quantity: number) {
  let activeId = cartId;
  let existing: ShopifyCart | null = null;
  if (activeId) {
    const current = await getCart(activeId);
    if (current) {
      activeId = current.id;
      existing = current.cart;
    } else {
      activeId = null;
    }
  }
  const existingQuantity = existing?.lines.filter((line) => line.variantId === variantId).reduce((sum, line) => sum + line.quantity, 0) ?? 0;
  await validateVariantQuantity(variantId, quantity, existingQuantity);

  if (!activeId) {
    const result = await runShopifyQuery<{ cartCreate: { cart: CartGraphQL | null; userErrors: Array<{ message: string }> } }>(
      CART_CREATE,
      { input: { lines: [{ merchandiseId: variantId, quantity }] } },
    );
    mutationError(result.data?.cartCreate?.userErrors, result.errors);
    const created = result.data?.cartCreate?.cart;
    if (!created) throw new CartOperationError("Shopify could not create the cart.", 502);
    return { id: created.id, cart: normalizeCart(created) };
  }

  const result = await runShopifyQuery<{ cartLinesAdd: { cart: CartGraphQL | null; userErrors: Array<{ message: string }> } }>(
    CART_LINES_ADD,
    { cartId: activeId, lines: [{ merchandiseId: variantId, quantity }] },
  );
  mutationError(result.data?.cartLinesAdd?.userErrors, result.errors);
  const cart = result.data?.cartLinesAdd?.cart;
  if (!cart) throw new CartOperationError("Shopify could not update the cart.", 502);
  return { id: cart.id, cart: normalizeCart(cart) };
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number) {
  const current = await getCart(cartId);
  if (!current) throw new CartOperationError("Your cart has expired. Refresh the page and try again.", 409);
  const line = current.cart.lines.find((item) => item.id === lineId);
  if (!line) throw new CartOperationError("This item is no longer in your cart.", 404);
  await validateVariantQuantity(line.variantId, quantity, 0, line.quantity);
  const result = await runShopifyQuery<{ cartLinesUpdate: { cart: CartGraphQL | null; userErrors: Array<{ message: string }> } }>(
    CART_LINES_UPDATE,
    { cartId, lines: [{ id: lineId, quantity }] },
  );
  mutationError(result.data?.cartLinesUpdate?.userErrors, result.errors);
  const cart = result.data?.cartLinesUpdate?.cart;
  if (!cart) throw new CartOperationError("Shopify could not update the cart quantity.", 502);
  return { id: cart.id, cart: normalizeCart(cart) };
}

export async function removeCartLine(cartId: string, lineId: string) {
  const result = await runShopifyQuery<{ cartLinesRemove: { cart: CartGraphQL | null; userErrors: Array<{ message: string }> } }>(
    CART_LINES_REMOVE,
    { cartId, lineIds: [lineId] },
  );
  mutationError(result.data?.cartLinesRemove?.userErrors, result.errors);
  const cart = result.data?.cartLinesRemove?.cart;
  if (!cart) throw new CartOperationError("Shopify could not remove this item.", 502);
  return { id: cart.id, cart: normalizeCart(cart) };
}

export async function validateCartForCheckout(cartId: string) {
  const current = await getCart(cartId);
  if (!current) throw new CartOperationError("Your cart has expired. Please add your items again.", 409);
  if (!current.cart.lines.length) throw new CartOperationError("Your bag is empty.", 400);
  const availability = await getLiveVariantAvailability([...new Set(current.cart.lines.map((line) => line.variantId))]);
  const byId = new Map(availability.map((variant) => [variant.id, variant]));
  for (const line of current.cart.lines) {
    const variant = byId.get(line.variantId);
    if (!variant || !variant.availableForSale || variant.currentlyNotInStock || variant.quantityAvailable === 0) {
      throw new CartOperationError(`${line.name} in size ${line.size} is no longer available. Remove it or choose another size.`, 409);
    }
    if (line.quantity > (variant.quantityAvailable ?? 1)) {
      throw new CartOperationError(`Only ${variant.quantityAvailable ?? 1} unit(s) of ${line.name} in size ${line.size} remain. Update the quantity before checkout.`, 409);
    }
  }
  const checkout = new URL(current.cart.checkoutUrl);
  if (checkout.protocol !== "https:") {
    throw new CartOperationError("Shopify returned an invalid checkout address.", 502);
  }
  return { ...current, checkoutUrl: checkout.toString() };
}
