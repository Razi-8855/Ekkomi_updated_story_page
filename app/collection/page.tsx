import type { Metadata } from "next";
import CollectionExperience from "@/components/collection/CollectionExperience";
import markup from "./markup";
import "./collection.css";

export const metadata: Metadata = {
  title: "EKKOMI — Nocturne",
  description: "Nocturne — the first collection from EKKOMI. Five impulses. Five jackets.",
};

export default function CollectionPage() {
  return <CollectionExperience markup={markup} />;
}


