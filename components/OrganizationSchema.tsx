const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "OnlineStore"],
  "@id": "https://www.ekkomi.co.uk/#organization",
  name: "EKKOMI",
  url: "https://www.ekkomi.co.uk",
  description:
    "EKKOMI is a fashion brand specialising in suede leather jackets with distinctive embroidered details.",
  logo: {
    "@type": "ImageObject",
    url: "https://www.ekkomi.co.uk/logo/Ekkomi_logo_final.svg",
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
