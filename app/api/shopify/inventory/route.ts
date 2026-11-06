import { NextResponse } from "next/server";
import { getLiveVariantAvailability } from "@/lib/shopify-storefront";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const variantIds =
    typeof body === "object" && body !== null && "variantIds" in body
      ? (body as { variantIds?: unknown }).variantIds
      : null;

  if (
    !Array.isArray(variantIds) ||
    variantIds.length < 1 ||
    variantIds.length > 100 ||
    !variantIds.every(
      (id) => typeof id === "string" && /^gid:\/\/shopify\/ProductVariant\/\d+$/.test(id),
    )
  ) {
    return NextResponse.json({ error: "A valid list of Shopify variant IDs is required." }, { status: 400 });
  }

  try {
    const variants = await getLiveVariantAvailability(variantIds);
    return NextResponse.json({ variants }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Live inventory could not be verified. Please try again shortly." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
