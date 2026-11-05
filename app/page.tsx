import type { Metadata } from "next";
import StoryExperience from "@/components/StoryExperience";

export const metadata: Metadata = {
    title: {
        absolute: "Ekkomi | British Luxury Leather & Suede Jackets",
    },

    description:
        "Discover Ekkomi, a contemporary British luxury fashion house. Explore distinctive leather and suede jackets defined by craftsmanship, individuality and timeless design.",

    alternates: {
        canonical: "/",
    },

    openGraph: {
        title: "Ekkomi | British Luxury Leather & Suede Jackets",
        description:
            "Discover Ekkomi, a contemporary British luxury fashion house. Explore distinctive leather and suede jackets defined by craftsmanship, individuality and timeless design.",
        url: "/",
        type: "website",
        images: [
            {
                url: "/collection-assets/collection/nocturne/temptation/temptation.jpg",
                width: 1200,
                height: 1800,
                alt: "Ekkomi | British Luxury Leather & Suede Jackets",
            },
        ],
    },

    twitter: {
        card: "summary_large_image",
        title: "Ekkomi | British Luxury Leather & Suede Jackets",
        description:
            "Discover Ekkomi, a contemporary British luxury fashion house. Explore distinctive leather and suede jackets defined by craftsmanship, individuality and timeless design.",
        images: ["/collection-assets/collection/nocturne/temptation/temptation.jpg"],
    },
};

export default function HomePage() {
    return <StoryExperience />;
}