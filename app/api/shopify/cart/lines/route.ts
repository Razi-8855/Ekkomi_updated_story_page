import { NextResponse } from "next/server";
import { getShopifyCartId, setShopifyCartCookie } from "@/lib/cart-cookie";
import { CartOperationError, removeCartLine, updateCartLine } from "@/lib/shopify-cart";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function errorResponse(error: unknown) {
  const known = error instanceof CartOperationError;
  return NextResponse.json(
    { error: known ? error.message : "The Shopify cart is temporarily unavailable. Please try again." },
    { status: known ? error.status : 503, headers: { "Cache-Control": "no-store" } },
  );
}

async function parseInput(request: Request) {
  try { return await request.json() as { lineId?: unknown; quantity?: unknown }; } catch { return null; }
}

export async function PATCH(request: Request) {
  const body = await parseInput(request);
  if (typeof body?.lineId !== "string" || !body.lineId.startsWith("gid://shopify/CartLine/")
    || !Number.isInteger(body.quantity) || (body.quantity as number) < 1 || (body.quantity as number) > 99) {
    return NextResponse.json({ error: "A valid cart line and quantity are required." }, { status: 400 });
  }
  const cartId = await getShopifyCartId();
  if (!cartId) return NextResponse.json({ error: "Your cart is empty." }, { status: 409 });
  try {
    const result = await updateCartLine(cartId, body.lineId, body.quantity as number);
    return NextResponse.json({ cart: result.cart }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  const body = await parseInput(request);
  if (typeof body?.lineId !== "string" || !body.lineId.startsWith("gid://shopify/CartLine/")) {
    return NextResponse.json({ error: "A valid cart line is required." }, { status: 400 });
  }
  const cartId = await getShopifyCartId();
  if (!cartId) return NextResponse.json({ error: "Your cart is empty." }, { status: 409 });
  try {
    const result = await removeCartLine(cartId, body.lineId);
    const response = NextResponse.json({ cart: result.cart }, { headers: { "Cache-Control": "no-store" } });
    setShopifyCartCookie(response, result.cart.totalQuantity ? result.id : null);
    return response;
  } catch (error) { return errorResponse(error); }
}
