export type JournalSection = {
  heading: string;
  paragraphs: string[];
};

export type JournalArticle = {
  slug: string;
  category: string;
  author: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  sections: JournalSection[];
};

export const journalArticles: JournalArticle[] = [
  {
    slug: "the-art-of-embroidery-in-fashion",
    category: "Craftsmanship",
    author: "EKKOMI",
    title: "The Art of Embroidery in Fashion",
    description: "Fashion is often defined by the details that bring a piece to life. Among the many techniques used in garment design, embroidery holds a special place.",
    image: "/collection-assets/collection/nocturne/audacity/audacity_detail.jpg",
    imageAlt: "Embroidered detail on an EKKOMI suede jacket",
    sections: [
      { heading: "The Beauty of Detail", paragraphs: [
        "Fashion is often defined by the details that bring a piece to life. Among the many techniques used in garment design, embroidery holds a special place. It transforms fabric into something expressive, adding depth, character and individuality to a garment.",
        "From traditional hand-stitched patterns to contemporary interpretations, embroidery continues to evolve while preserving its connection to craftsmanship.",
      ] },
      { heading: "A Craft Rooted in Tradition", paragraphs: [
        "Embroidery has been part of clothing and textile traditions for generations. Across cultures, intricate stitching has been used to communicate identity, celebrate heritage and add character to garments.",
        "Today, designers reinterpret these techniques through modern patterns, textures and materials, creating pieces that bring together traditional artistry and contemporary style.",
      ] },
      { heading: "The Importance of Every Detail", paragraphs: [
        "Good embroidery is about more than decoration. The placement, pattern, thread and execution all contribute to the overall appearance of a garment.",
        "When thoughtfully incorporated, embroidered details complement the fabric rather than overpower it. They create visual interest while allowing the garment's original character to remain prominent.",
      ] },
      { heading: "Embroidery Meets Contemporary Design", paragraphs: [
        "The combination of suede textures and embroidered detailing creates an interesting balance between softness and visual expression.",
        "Suede offers a distinctive texture, while embroidery introduces pattern and individuality. Together, they create garments that stand apart through considered design rather than excessive decoration.",
      ] },
      { heading: "The EKKOMI Perspective", paragraphs: [
        "At EKKOMI, embroidery is an important part of our design identity. Our jackets bring together distinctive detailing, premium suede aesthetics and contemporary silhouettes.",
        "We believe that the smallest details can make the strongest impression. Every design is an opportunity to express individuality through craftsmanship and thoughtful design.",
      ] },
    ],
  },
  {
    slug: "how-to-style-a-premium-suede-leather-jacket",
    category: "Style & Inspiration",
    author: "EKKOMI",
    title: "How to Style a Premium Suede Leather Jacket",
    description: "A well-designed suede leather jacket can become one of the most versatile pieces in a wardrobe. Its distinctive texture, structured silhouette and timeless appeal make it suitable for a range of occasions.",
    image: "/collection-assets/collection/nocturne/desire/desire_lookbook_1.jpg",
    imageAlt: "EKKOMI suede jacket styled for an editorial look",
    sections: [
      { heading: "A Jacket That Defines Your Style", paragraphs: [
        "A well-designed suede leather jacket can become one of the most versatile pieces in a wardrobe. Its distinctive texture, structured silhouette and timeless appeal make it suitable for a range of occasions.",
        "Whether you prefer a relaxed everyday look or a more considered outfit, the right styling can make your jacket the centrepiece of your appearance.",
      ] },
      { heading: "1. Keep It Minimal for Everyday Wear", paragraphs: [
        "For a relaxed look, pair your suede jacket with a simple T-shirt, well-fitted denim and clean sneakers.",
        "Neutral colours work particularly well, allowing the jacket's texture and detailing to stand out without making the outfit feel overwhelming.",
      ] },
      { heading: "2. Create a Smart Casual Look", paragraphs: [
        "For a more polished appearance, combine your jacket with a plain shirt, tailored trousers and leather footwear.",
        "This combination balances the casual character of suede with more structured clothing, making it suitable for dinners, social gatherings and informal occasions.",
      ] },
      { heading: "3. Experiment with Monochromatic Styling", paragraphs: [
        "Monochromatic outfits create a clean and coordinated appearance.",
        "Try combining different shades of the same colour family. For example, a darker suede jacket paired with neutral trousers and a matching top can create a balanced and cohesive look.",
      ] },
      { heading: "4. Let the Jacket Make the Statement", paragraphs: [
        "When wearing a jacket with distinctive embroidery or detailing, keep the rest of your outfit relatively simple.",
        "Avoid combining too many competing patterns. Allow the jacket to become the focal point while the remaining pieces complement its design.",
      ] },
      { heading: "5. Layer with Confidence", paragraphs: [
        "Layering can add depth and versatility to your outfit.",
        "During cooler weather, wear your jacket over a lightweight knit or a simple sweatshirt. Choose layers that fit comfortably underneath without affecting the jacket's natural silhouette.",
      ] },
      { heading: "Finding Your Own Style", paragraphs: [
        "There is no single way to style a suede jacket. The best combinations are the ones that reflect your personality and make you feel comfortable.",
        "Experiment with colours, textures and silhouettes until you find a look that feels natural to you.",
      ] },
      { heading: "The EKKOMI Collection", paragraphs: [
        "At EKKOMI, our suede jackets combine distinctive embroidery with contemporary design. Each piece is created to bring character and individuality to your wardrobe.",
      ] },
    ],
  },
  {
    slug: "how-to-care-for-a-suede-leather-jacket",
    category: "Care & Guides",
    author: "EKKOMI",
    title: "How to Care for a Suede Leather Jacket",
    description: "Suede is known for its distinctive texture and soft finish. Its appearance is part of what makes it special, but it also requires careful handling to maintain its character over time.",
    image: "/collection-assets/collection/nocturne/temptation/temptation_detail.jpg",
    imageAlt: "Suede texture detail on an EKKOMI jacket",
    sections: [
      { heading: "Preserving the Character of Suede", paragraphs: [
        "Suede is known for its distinctive texture and soft finish. Its appearance is part of what makes it special, but it also requires careful handling to maintain its character over time.",
        "With the right care and storage habits, you can help keep your suede jacket looking its best.",
      ] },
      { heading: "1. Avoid Excessive Moisture", paragraphs: [
        "Suede is sensitive to water, and excessive moisture can affect its texture and appearance.",
        "Try to avoid wearing your jacket in heavy rain. If it becomes damp, gently blot the moisture with a clean, dry cloth and allow it to air-dry naturally.",
        "Avoid using direct heat sources such as hair dryers or radiators.",
      ] },
      { heading: "2. Brush Gently", paragraphs: [
        "Regular gentle brushing can help maintain the natural appearance of suede.",
        "Use a suitable suede brush and follow the direction of the nap. Avoid applying excessive pressure, as this may damage the surface.",
      ] },
      { heading: "3. Avoid Ordinary Cleaning Products", paragraphs: [
        "Household detergents and regular fabric-cleaning products may not be suitable for suede.",
        "Use products specifically designed for suede and always follow their instructions. If you are unsure about a stain or mark, seek professional cleaning advice.",
      ] },
      { heading: "4. Store It Properly", paragraphs: [
        "Proper storage helps maintain the shape and appearance of your jacket.",
        "Hang it on a suitable, well-shaped hanger and store it in a cool, dry and well-ventilated place.",
        "Avoid storing suede in plastic covers for extended periods, as restricted airflow can affect the material.",
      ] },
      { heading: "5. Be Careful with Perfumes and Oils", paragraphs: [
        "Perfumes, oils and other liquid products can leave marks on suede.",
        "Allow perfumes and similar products to dry before putting on your jacket. Take care when handling cosmetics and other products that may come into contact with the material.",
      ] },
      { heading: "6. Seek Professional Cleaning When Needed", paragraphs: [
        "For stubborn stains, deep marks or significant cleaning requirements, consult a professional cleaner experienced in handling suede.",
        "Avoid experimenting with unfamiliar cleaning methods, as incorrect treatment may permanently affect the material.",
      ] },
      { heading: "A Little Care Goes a Long Way", paragraphs: [
        "A suede jacket is a piece worth looking after. Simple habits such as gentle brushing, careful storage and avoiding excessive moisture can help preserve its appearance.",
        "At EKKOMI, we believe that caring for a garment is part of appreciating its design and craftsmanship.",
      ] },
    ],
  },
];

export function getJournalArticle(slug: string) {
  return journalArticles.find((article) => article.slug === slug);
}
