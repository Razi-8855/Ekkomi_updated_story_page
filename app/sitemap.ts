import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://www.ekkomi.co.uk";

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 1,
        },
        {
            url: `${baseUrl}/collection`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/faq`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${baseUrl}/journal`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        },
        ...[
            "the-art-of-embroidery-in-fashion",
            "how-to-style-a-premium-suede-leather-jacket",
            "how-to-care-for-a-suede-leather-jacket",
        ].map((slug) => ({
            url: `${baseUrl}/journal/${slug}`,
            lastModified: new Date(),
            changeFrequency: "yearly" as const,
            priority: 0.6,
        })),
    ];
}
