import { JsonLd } from "./json-ld";
import { faqLd, type Faq } from "@/lib/seo";
import { pageFaqs, type PageFaqKey } from "@/lib/data/faqs";

type Props = { page?: PageFaqKey; items?: readonly Faq[]; title?: string; intro?: string; eyebrow?: string; schema?: boolean };

/**
 * Answer-first FAQ block: a direct summary answer, then questions as an accordion, plus FAQPage structured data.
 * Pass `page` to use content from src/lib/data/faqs.ts, or `items` for page-specific questions.
 * Use `schema={false}` when the same questions are already marked up elsewhere on the page.
 */
export function FaqSection({ page, items, title, intro, eyebrow = "QUESTIONS & ANSWERS", schema = true }: Props) {
  const content = page ? pageFaqs[page] : undefined;
  const faqs = items ?? content?.items ?? [];
  const heading = title ?? content?.title ?? "Common questions.";
  const summary = intro ?? content?.intro;
  if (!faqs.length) return null;
  return <section className="section faq-section">
    {schema && <JsonLd data={faqLd(faqs)} />}
    <div className="container faq-section-grid">
      <div><span className="eyebrow">{eyebrow}</span><h2 className="heading-lg">{heading}</h2>{summary && <p className="faq-answer-lead">{summary}</p>}</div>
      <div className="catalog-faq">{faqs.map((faq) => <details key={faq.question}><summary><h3>{faq.question}</h3><span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div>
    </div>
  </section>;
}
