import { NextResponse } from "next/server";
import { getShopifyCartId, setShopifyCartCookie } from "@/lib/cart-cookie";
import { addCartLine, CartOperationError, getCart } from "@/lib/shopify-cart";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const emptyCart = {
  lines: [],
  totalQuantity: 0,
  subtotal: { amount: "0.00", currencyCode: "GBP" },
  checkoutUrl: "",
};

function errorResponse(error: unknown) {
  const known = error instanceof CartOperationError;
  return NextResponse.json(
    { error: known ? error.message : "The Shopify cart is temporarily unavailable. Please try again." },
    { status: known ? error.status : 503, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET() {
  const cartId = await getShopifyCartId();
  if (!cartId) return NextResponse.json({ cart: emptyCart }, { headers: { "Cache-Control": "no-store" } });
  try {
    const result = await getCart(cartId);
    if (!result) {
      const response = NextResponse.json({ cart: emptyCart }, { headers: { "Cache-Control": "no-store" } });
      setShopifyCartCookie(response, null);
      return response;
    }
    return NextResponse.json({ cart: result.cart }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const input = body as { variantId?: unknown; quantity?: unknown };
  if (typeof input?.variantId !== "string" || !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(input.variantId)
    || !Number.isInteger(input.quantity) || (input.quantity as number) < 1 || (input.quantity as number) > 99) {
    return NextResponse.json({ error: "A valid Shopify variant and quantity are required." }, { status: 400 });
  }
  try {
    const result = await addCartLine(await getShopifyCartId(), input.variantId, input.quantity as number);
    const response = NextResponse.json({ cart: result.cart }, { headers: { "Cache-Control": "no-store" } });
    setShopifyCartCookie(response, result.id);
    return response;
  } catch (error) { return errorResponse(error); }
}
