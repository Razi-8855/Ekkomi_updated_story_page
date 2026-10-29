import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Metadata } from "next";
import CollectionExperience from "@/components/collection/CollectionExperience";
import "./collection.css";

export const metadata: Metadata = {
  title: "EKKOMI — Nocturne",
  description: "Nocturne — the first collection from EKKOMI. Five impulses. Five jackets.",
};

export default async function CollectionPage() {
  const html = await readFile(join(process.cwd(), "Ekkomi_collection_page", "index.html"), "utf8");
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  if (!body) throw new Error("Could not find the Collection page body markup.");

  // Render the original page's body fragment; Next owns the document, metadata and route.
  const markup = body
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\/>/gi, "")
    .replaceAll("assets/", "/collection-assets/");

  return <CollectionExperience markup={markup} />;
}
