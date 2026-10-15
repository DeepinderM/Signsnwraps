import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { ProductGrid } from "@/components/shop/product-card";
import { StoreUnavailable, TestModeBanner } from "@/components/shop/store-notice";
import { getStorefrontProducts } from "@/lib/shop/products";
import { isCategory, productCategories } from "@/lib/shop/catalog";
import { ConsultationCTA } from "@/components/sections/blocks";
import { FaqSection } from "@/components/seo/faq-section";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata({ title: "Shop PPF Kits, Colour PPF & Tools", description: "Buy pre-cut PPF kits, colour paint protection film, universal protection pieces and install tools online. Australia-wide shipping or free click and collect.", path: "/wraps/shop" });

type Props = { searchParams: Promise<{ category?: string }> };

export default async function ShopPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const active = isCategory(category) ? category : undefined;
  const products = await getStorefrontProducts(active);
  const heading = productCategories.find((item) => item.slug === active);
  return <>
    <section className="catalog-hero shop-hero"><div className="container"><span className="eyebrow">WRAPS · SHOP</span><h1 className="heading-xl">{heading ? heading.name : <>Kits, film<br/>& tools.</>}</h1><p className="body-lg">{heading ? heading.detail : "Pre-cut PPF kits, colour film, protection pieces and install essentials. Ships Australia-wide or collect from Laverton North."}</p>
      <nav className="shop-filters" aria-label="Product categories"><Link href="/wraps/shop" aria-current={!active ? "page" : undefined}>All</Link>{productCategories.map((item) => <Link key={item.slug} href={`/wraps/shop?category=${item.slug}`} aria-current={active === item.slug ? "page" : undefined}>{item.name}</Link>)}</nav>
    </div></section>
    <section className="section shop-section"><div className="container"><TestModeBanner/>
      {products === null ? <StoreUnavailable/> : products.length === 0 ? <div className="shop-notice"><b>No products here yet.</b><p>Check back soon, or ask the studio about this range.</p></div> : <ProductGrid products={products}/>}
      {active === "vehicle-kit" && <p className="product-caveat">Looking for your vehicle? <Link href="/wraps/kits">Use the kit finder</Link></p>}
    </div></section>
    <FaqSection page="shop"/>
    <ConsultationCTA title="Prefer a professional fit?" text="Book the Laverton North studio to have our team fit your kit."/>
  </>;
}
