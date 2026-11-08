import type { Metadata } from "next";
import StoryExperience from "@/components/StoryExperience";

export const metadata: Metadata = {
    title: {
        absolute: "EKKOMI | Embroidered Suede Jackets",
    },

    description:
        "Discover EKKOMI, a fashion brand creating distinctive suede leather jackets with embroidered details and contemporary design.",

    alternates: {
        canonical: "/",
    },

    openGraph: {
        title: "EKKOMI | Embroidered Suede Jackets",
        description:
            "Discover EKKOMI, a fashion brand creating distinctive suede leather jackets with embroidered details and contemporary design.",
        url: "/",
        type: "website",
        images: [
            {
                url: "/collection-assets/collection/nocturne/temptation/temptation.jpg",
                width: 1200,
                height: 1800,
                alt: "EKKOMI embroidered suede jackets",
            },
        ],
    },

    twitter: {
        card: "summary_large_image",
        title: "EKKOMI | Embroidered Suede Jackets",
        description:
            "Discover EKKOMI, a fashion brand creating distinctive suede leather jackets with embroidered details and contemporary design.",
        images: ["/collection-assets/collection/nocturne/temptation/temptation.jpg"],
    },
};

export default function HomePage() {
    return (
        <StoryExperience />
    );
}
