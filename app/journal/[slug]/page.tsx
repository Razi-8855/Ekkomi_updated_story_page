import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getJournalArticle, journalArticles } from "@/data/journal";
import CollectionStyleFooter from "@/components/CollectionStyleFooter";
import "../journal.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return journalArticles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getJournalArticle(slug);
  if (!article) return { title: "Article Not Found | EKKOMI" };
  return {
    title: { absolute: `${article.title} | EKKOMI Journal` },
    description: article.description,
    alternates: { canonical: `https://www.ekkomi.co.uk/journal/${article.slug}` },
    openGraph: {
      title: `${article.title} | EKKOMI Journal`,
      description: article.description,
      url: `https://www.ekkomi.co.uk/journal/${article.slug}`,
      type: "article",
      siteName: "EKKOMI",
      locale: "en_GB",
      images: [{ url: article.image, alt: article.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} | EKKOMI Journal`,
      description: article.description,
      images: [article.image],
    },
  };
}

function articleSchema(article: NonNullable<ReturnType<typeof getJournalArticle>>) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    articleSection: article.category,
    inLanguage: "en-GB",
    description: article.description,
    image: [`https://www.ekkomi.co.uk${article.image}`],
    author: { "@type": "Organization", name: article.author, url: "https://www.ekkomi.co.uk/" },
    publisher: { "@id": "https://www.ekkomi.co.uk/#organization" },
    mainEntityOfPage: `https://www.ekkomi.co.uk/journal/${article.slug}`,
  };
}

export default async function JournalArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getJournalArticle(slug);
  if (!article) notFound();
  const related = journalArticles.filter((item) => item.slug !== article.slug);
  const schema = articleSchema(article);

  return (
    <main className="journal-page journal-article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <header className="journal-header">
        <Link className="journal-wordmark" href="/">EKKOMI</Link>
        <nav aria-label="Article navigation">
          <Link href="/journal">The Journal</Link>
          <Link href="/collection">The Collection</Link>
        </nav>
      </header>
      <article>
        <header className="article-heading">
          <h1>{article.title}</h1>
          <p className="article-byline">By {article.author}</p>
        </header>
        <figure className="article-hero">
          <Image src={article.image} alt={article.imageAlt} width={1800} height={1100} priority />
        </figure>
        <div className="article-body">
          {article.sections.map((section) => (
            <section className="article-section" key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
        </div>
      </article>
      <section className="related-articles" aria-labelledby="related-title">
        <p className="journal-eyebrow">Continue reading</p>
        <h2 id="related-title">Related Articles</h2>
        <div className="related-grid">
          {related.map((item) => (
            <article className="related-card" key={item.slug}>
              <Link className="related-image" href={`/journal/${item.slug}`}>
                <Image src={item.image} alt={item.imageAlt} width={900} height={600} />
              </Link>
              <h3><Link href={`/journal/${item.slug}`}>{item.title}</Link></h3>
              <Link className="journal-read-button" href={`/journal/${item.slug}`}>Read Article</Link>
            </article>
          ))}
        </div>
      </section>
      <CollectionStyleFooter />
    </main>
  );
}
