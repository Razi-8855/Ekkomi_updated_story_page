import { NextResponse } from "next/server";
import { getLiveVariantAvailability } from "@/lib/shopify-storefront";

export const dynamic = "force-dynamic";
const MAX_REQUEST_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413, headers: { "Cache-Control": "no-store" } });
  }

  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return NextResponse.json({ error: "Request is too large." }, { status: 413, headers: { "Cache-Control": "no-store" } });
      }
      chunks.push(value);
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const requestBytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    requestBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const requestText = new TextDecoder().decode(requestBytes);

  let body: unknown;
  try {
    body = JSON.parse(requestText);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const variantIds =
    typeof body === "object" && body !== null && !Array.isArray(body) && "variantIds" in body
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

  // Deduplicate valid IDs before querying Shopify to avoid needless API work.
  const uniqueVariantIds = [...new Set(variantIds)];
  try {
    const variants = await getLiveVariantAvailability(uniqueVariantIds);
    return NextResponse.json({ variants }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Live inventory could not be verified. Please try again shortly." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
