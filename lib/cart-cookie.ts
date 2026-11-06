import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const SHOPIFY_CART_COOKIE = "ekkomi_shopify_cart";

export async function getShopifyCartId() {
  return (await cookies()).get(SHOPIFY_CART_COOKIE)?.value ?? null;
}

export function setShopifyCartCookie(response: NextResponse, cartId: string | null) {
  response.cookies.set({
    name: SHOPIFY_CART_COOKIE,
    value: cartId ?? "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: cartId ? 60 * 60 * 24 * 30 : 0,
  });
}

