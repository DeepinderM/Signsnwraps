import type { Metadata } from "next";
import { notFound } from "next/navigation";

const docs: Record<string, { title: string; summary: string }> = {
  privacy: {
    title: "Privacy policy",
    summary: "We respect your privacy. Before launch, publish a reviewed policy explaining what personal information is collected through this website, why it is used, who may receive it, how long it is kept, and how people can access or correct it.",
  },
  terms: {
    title: "Terms of website use",
    summary: "These starter terms describe general website use only. Have the final terms reviewed for your business, services, intellectual property, quotations, cancellations and applicable Australian consumer law before publication.",
  },
  warranty: {
    title: "Warranty information",
    summary: "Warranty coverage depends on the product, materials, installation conditions and supplier terms. Provide customers with the applicable project-specific warranty documentation and have this general copy reviewed before launch.",
  },
  disclaimer: {
    title: "Website disclaimer",
    summary: "Website information is general in nature and does not replace a project-specific assessment or quotation. Specifications, suitability, timing and availability should be confirmed with Signsnwraps before work begins.",
  },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(docs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return docs[slug] ? { title: docs[slug].title, alternates: { canonical: `/legal/${slug}` } } : { title: "Page not found" };
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  const doc = docs[slug];
  if (!doc) notFound();

  return (
    <section className="legal-page">
      <div className="container">
        <span className="eyebrow">SIGNSNWRAPS · IMPORTANT INFORMATION</span>
        <h1 className="heading-xl">{doc.title}</h1>
        <div className="legal-copy">
          <p>{doc.summary}</p>
          <p>
            This page contains preliminary website copy and is not legal advice. The final policy or terms should reflect Signsnwraps&apos; actual operating practices and be reviewed by a qualified Australian legal professional before the website goes live.
          </p>
        </div>
      </div>
      <style>{`.legal-page{padding:100px 0 150px;min-height:65vh}.legal-page h1{margin:24px 0 44px;text-transform:capitalize}.legal-copy{max-width:760px;border-top:1px solid var(--line);padding-top:22px}.legal-copy p{font-size:16px;line-height:1.8;color:#667069}@media(max-width:640px){.legal-page{padding:70px 0 100px}}`}</style>
    </section>
  );
}
