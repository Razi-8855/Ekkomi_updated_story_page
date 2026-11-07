export type FAQItem = { question: string; answer: string };
export type FAQCategory = { title: string; items: FAQItem[] };

export const faqCategories: FAQCategory[] = [
  {
    title: "About EKKOMI",
    items: [
      {
        question: "What is EKKOMI?",
        answer: "EKKOMI is a fashion brand focused on premium suede leather jackets, combining contemporary fashion with distinctive embroidery and refined craftsmanship.",
      },
      {
        question: "What makes EKKOMI jackets unique?",
        answer: "EKKOMI jackets bring together premium suede aesthetics, distinctive embroidered details and contemporary design. Each piece is designed to make a statement while maintaining a refined appearance.",
      },
      {
        question: "Where can I purchase EKKOMI jackets?",
        answer: "You can explore the EKKOMI collection on our website. When you find a jacket you like, select your preferred size, add it to your bag and proceed to our secure Shopify checkout.",
      },
    ],
  },
  {
    title: "Products and Sizing",
    items: [
      {
        question: "What materials are used in EKKOMI jackets?",
        answer: "EKKOMI jackets are designed using premium suede leather. Please refer to individual product descriptions for specific product details.",
      },
      {
        question: "What sizes are available?",
        answer: "Our jackets are available in standard sizes S, M, L and XL, depending on product availability.",
      },
      {
        question: "Can I request a custom-sized jacket?",
        answer: "Yes. EKKOMI offers a customisation enquiry option. Select the CUSTOM option on the product page and connect with our stylist team through WhatsApp to discuss your requirements.",
      },
      {
        question: "Can I get assistance choosing the right size?",
        answer: "Yes. You can refer to our Size Guide or contact our stylist team for assistance with selecting the appropriate size.",
      },
    ],
  },
  {
    title: "Orders and Payments",
    items: [
      {
        question: "How do I place an order?",
        answer: "Explore our collection, select your preferred jacket and size, add it to your bag and proceed to checkout. Complete your order through our secure Shopify checkout.",
      },
      {
        question: "Do I need to create an account to purchase from EKKOMI?",
        answer: "No. You can purchase from EKKOMI without creating an account. Simply provide the required contact and delivery information during checkout.",
      },
      {
        question: "How can I track my order?",
        answer: "After placing your order, you will receive an order confirmation email. Once your order has been dispatched and tracking information is available, you will receive a shipping confirmation email containing your tracking details.",
      },
      {
        question: "What payment methods are accepted?",
        answer: "Available payment methods are displayed during checkout. You can select from the payment options supported by our store.",
      },
    ],
  },
  {
    title: "Shipping and Returns",
    items: [
      {
        question: "Where does EKKOMI deliver?",
        answer: "Please refer to the shipping information available at checkout or contact our team to confirm delivery availability for your location.",
      },
      {
        question: "How long does delivery take?",
        answer: "Delivery timelines depend on your destination and shipping method. The applicable delivery information will be provided during checkout or through your order confirmation.",
      },
      {
        question: "What is EKKOMI's return and exchange policy?",
        answer: "Please refer to our Returns and Refunds Policy for the applicable conditions, eligibility and procedure.",
      },
    ],
  },
  {
    title: "Care and Assistance",
    items: [
      {
        question: "How should I care for my suede leather jacket?",
        answer: "Suede requires careful handling. Avoid excessive moisture, use appropriate suede-care products and follow the care instructions provided with your jacket. For specific care recommendations, contact our team.",
      },
      {
        question: "How can I contact EKKOMI?",
        answer: "You can reach our team through the Contact page or use the Speak to Our Stylist option available on our website.",
      },
    ],
  },
];

export const faqItems = faqCategories.flatMap((category) => category.items);
