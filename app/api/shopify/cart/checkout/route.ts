import { NextResponse } from "next/server";
import { getShopifyCartId } from "@/lib/cart-cookie";
import { CartOperationError, validateCartForCheckout } from "@/lib/shopify-cart";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  const cartId = await getShopifyCartId();
  if (!cartId) return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
  try {
    const result = await validateCartForCheckout(cartId);
    return NextResponse.json({ checkoutUrl: result.checkoutUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const known = error instanceof CartOperationError;
    return NextResponse.json(
      { error: known ? error.message : "We could not verify your cart. Please try again shortly." },
      { status: known ? error.status : 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
