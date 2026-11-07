import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { journalArticles } from "@/data/journal";
import CollectionStyleFooter from "@/components/CollectionStyleFooter";
import "./journal.css";

const title = "The EKKOMI Journal | Style, Craft and Care";
const description = "Explore EKKOMI journal stories on embroidery, suede jacket styling and caring for suede leather jackets.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "https://www.ekkomi.co.uk/journal" },
  openGraph: { title, description, url: "https://www.ekkomi.co.uk/journal", type: "website", siteName: "EKKOMI", locale: "en_GB" },
  twitter: { card: "summary_large_image", title, description },
};

export default function JournalPage() {
  return (
    <main className="journal-page">
      <header className="journal-header">
        <Link className="journal-wordmark" href="/">EKKOMI</Link>
        <nav aria-label="Journal navigation">
          <Link href="/">Our Story</Link>
          <Link href="/collection">The Collection</Link>
        </nav>
      </header>
      <section className="journal-intro">
        <h1>The Journal</h1>
        <p>Thoughts on the details, materials and considered choices behind the way we dress.</p>
      </section>
      <section className="journal-list" aria-label="Journal articles">
        {journalArticles.map((article, index) => (
          <article className="journal-card" key={article.slug}>
            <Link className="journal-card-image" href={`/journal/${article.slug}`} aria-label={`Read ${article.title}`}>
              <Image src={article.image} alt={article.imageAlt} width={1200} height={800} priority={index === 0} />
            </Link>
            <div className="journal-card-copy">
              <h2><Link href={`/journal/${article.slug}`}>{article.title}</Link></h2>
              <p>{article.description}</p>
              <Link className="journal-read-button" href={`/journal/${article.slug}`}>Read Article</Link>
            </div>
          </article>
        ))}
      </section>
      <CollectionStyleFooter />
    </main>
  );
}
