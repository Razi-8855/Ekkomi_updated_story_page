import type { Metadata } from "next";
import StoryExperience from "@/components/StoryExperience";

export const metadata: Metadata = {
    title: {
        absolute: "Ekkomi | Luxury Suede & Leather Jackets",
    },

    description:
        "Discover Ekkomi's distinctive approach to luxury fashion. Explore considered designs, premium suede and leather jackets, and the Nocturne collection.",

    alternates: {
        canonical: "/",
    },

    openGraph: {
        title: "Ekkomi | Luxury Suede & Leather Jackets",
        description:
            "Discover Ekkomi's distinctive approach to luxury fashion, craftsmanship and contemporary design.",
        url: "/",
        type: "website",
        images: [
            {
                url: "/collection-assets/collection/nocturne/temptation/temptation.jpg",
                width: 1200,
                height: 1800,
                alt: "Ekkomi | Luxury Suede & Leather Jackets",
            },
        ],
    },

    twitter: {
        card: "summary_large_image",
        title: "Ekkomi | Luxury Suede & Leather Jackets",
        description:
            "Discover Ekkomi's distinctive approach to luxury fashion, craftsmanship and contemporary design.",
        images: ["/collection-assets/collection/nocturne/temptation/temptation.jpg"],
    },
};

const organizationJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            "@id": "https://www.ekkomi.co.uk/#organization",
            "name": "Ekkomi",
            "url": "https://www.ekkomi.co.uk",
            "logo": "https://www.ekkomi.co.uk/assets/Ekkomi_logo_1.png",
            "description":
                "British luxury fashion house specialising in considered suede and leather jackets.",
            "email": "info@ekkomi.co.uk",
            "sameAs": ["https://instagram.com/ekkomi_official"],
        },
        {
            "@type": "WebSite",
            "@id": "https://www.ekkomi.co.uk/#website",
            "url": "https://www.ekkomi.co.uk",
            "name": "Ekkomi",
            "publisher": { "@id": "https://www.ekkomi.co.uk/#organization" },
        },
    ],
};

export default function Home() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(organizationJsonLd),
                }}
            />
            <StoryExperience />
        </>
    );
}
