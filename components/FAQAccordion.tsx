"use client";

import { useState } from "react";
import type { FAQCategory } from "@/data/faqs";

export default function FAQAccordion({ categories }: { categories: FAQCategory[] }) {
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <div className="faq-page__categories">
      {categories.map((category, categoryIndex) => (
        <section className="faq-page__category" key={category.title} aria-labelledby={`faq-category-${categoryIndex}`}>
          <div className="faq-page__category-heading">
            <h2 id={`faq-category-${categoryIndex}`}>{category.title}</h2>
          </div>
          <div className="faq-page__questions">
            {category.items.map((item, itemIndex) => {
              const key = `${categoryIndex}-${itemIndex}`;
              const expanded = openItem === key;
              const answerId = `faq-answer-${key}`;

              return (
                <article className={`faq-page__item${expanded ? " is-open" : ""}`} key={item.question}>
                  <h3 className="faq-page__question-heading">
                    <button
                      className="faq-page__question"
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={answerId}
                      onClick={() => setOpenItem(expanded ? null : key)}
                    >
                      <span>{item.question}</span>
                      <span className="faq-page__question-mark" aria-hidden="true">{expanded ? "−" : "+"}</span>
                    </button>
                  </h3>
                  <div
                    className={`faq-page__answer${expanded ? " is-open" : ""}`}
                    id={answerId}
                    aria-hidden={!expanded}
                    inert={!expanded}
                  >
                    <div className="faq-page__answer-inner">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
