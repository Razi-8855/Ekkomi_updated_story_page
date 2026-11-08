import type { MetadataRoute } from "next";
import { getProductCanonicalUrl, PRODUCT_STYLE_SLUGS } from "@/lib/products";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://www.ekkomi.co.uk";

    return [
        {
            url: `${baseUrl}/`,
            changeFrequency: "monthly",
            priority: 1,
        },
        {
            url: `${baseUrl}/collection`,
            changeFrequency: "weekly",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/products`,
            changeFrequency: "weekly",
            priority: 0.85,
        },
        {
            url: `${baseUrl}/faq`,
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${baseUrl}/journal`,
            changeFrequency: "monthly",
            priority: 0.7,
        },
        ...[
            "the-art-of-embroidery-in-fashion",
            "how-to-style-a-premium-suede-leather-jacket",
            "how-to-care-for-a-suede-leather-jacket",
        ].map((slug) => ({
            url: `${baseUrl}/journal/${slug}`,
            changeFrequency: "yearly" as const,
            priority: 0.6,
        })),
        ...PRODUCT_STYLE_SLUGS.map((slug) => ({
            url: getProductCanonicalUrl(slug),
            changeFrequency: "weekly" as const,
            priority: 0.7,
        })),
    ];
}
