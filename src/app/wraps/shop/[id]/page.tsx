import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/shop/add-to-cart";
import { ProductImage } from "@/components/shop/product-card";
import { StoreUnavailable, TestModeBanner } from "@/components/shop/store-notice";
import { ConsultationCTA } from "@/components/sections/blocks";
import { getStorefrontProduct } from "@/lib/shop/products";
import { categoryName, formatAud, FREE_SHIPPING_OVER_CENTS, SHIPPING_FLAT_CENTS } from "@/lib/shop/catalog";
import { getVehicle } from "@/lib/data/wraps";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMetadata, productLd } from "@/lib/seo";
import { inStock, productHref } from "@/lib/shop/catalog";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getStorefrontProduct((await params).id);
  // Vehicle kits canonicalise to their kit finder URL (productHref) so each kit has one indexable URL.
  return product ? pageMetadata({ title: product.name, description: `${product.name}: ${product.description} ${formatAud(product.priceCents)} incl. GST, shipped Australia-wide.`.slice(0, 158), path: productHref(product) }) : { title: "Product" };
}

export default async function ProductPage({ params }: Props) {
  const product = await getStorefrontProduct((await params).id);
  if (product === null) return <section className="section"><div className="container"><StoreUnavailable/></div></section>;
  if (!product) notFound();
  const vehicle = product.fitment ? getVehicle(product.fitment.make, product.fitment.model) : undefined;
  return <>
    {!product.fitment && <JsonLd data={productLd({ id: product.id, name: product.name, description: product.description, priceCents: product.priceCents, imageUrl: product.imageUrl, inStock: inStock(product), path: productHref(product), category: categoryName(product.category) })} />}
    <section className="kit-product-hero"><div className="container kit-product-layout">
      <div className="kit-product-image"><ProductImage product={product} sizes="(max-width: 700px) 100vw, 50vw"/></div>
      <div>
        <span className="eyebrow">{categoryName(product.category).toUpperCase()}{product.sample && " · SAMPLE LISTING"}</span>
        <h1 className="heading-lg">{product.name}</h1>
        <p>{product.description}</p>
        <div className="shop-price">{formatAud(product.priceCents)} <small>incl. GST</small></div>
        <p className="shop-stock">{product.stock === null ? "Cut to order · usually dispatched in 3–5 business days" : product.stock > 0 ? `In stock${product.stock <= 5 ? ` · only ${product.stock} left` : ""}` : "Out of stock"}</p>
        <TestModeBanner/>
        <AddToCart product={product} showQty/>
        <small className="cart-notice">Shipping {formatAud(SHIPPING_FLAT_CENTS)} Australia-wide, free over {formatAud(FREE_SHIPPING_OVER_CENTS)}, or free click & collect at Laverton North.</small>
        {vehicle && <p className="shop-fitment">Made for the <b>{vehicle.make.name} {vehicle.model.name}</b> ({vehicle.model.years.at(-1)}–{vehicle.model.years[0]}). Check your year, trim and body variant before ordering. <Link href={`/wraps/kits/${vehicle.make.slug}/${vehicle.model.slug}`}>See all {vehicle.model.name} kits</Link></p>}
        <Link className="text-link" href={`/wraps/shop?category=${product.category}`}>← More {categoryName(product.category).toLowerCase()}</Link>
      </div>
    </div></section>
    <ConsultationCTA title="Want the studio to fit it?" text="Book the Laverton North studio and our team will fit your kit."/>
  </>;
}
