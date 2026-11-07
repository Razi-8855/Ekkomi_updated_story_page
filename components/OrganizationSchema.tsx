const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "@id": "https://www.ekkomi.co.uk/#organization",
  name: "EKKOMI",
  url: "https://www.ekkomi.co.uk",
  description:
    "EKKOMI is a luxury fashion brand specialising in premium suede leather jackets with distinctive embroidered details.",
  logo: {
    "@type": "ImageObject",
    url: "https://www.ekkomi.co.uk/logo/logo-2.png",
  },
  brand: {
    "@type": "Brand",
    name: "EKKOMI",
  },
  sameAs: [
    "https://www.facebook.com/ekkomi",
    "https://www.instagram.com/ekkomi_official",
  ],
};

export default function OrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c"),
      }}
    />
  );
}
