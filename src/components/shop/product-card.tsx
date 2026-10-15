import Image from "next/image";
import Link from "next/link";
import { AddToCart } from "./add-to-cart";
import { categoryName, formatAud, productHref, type Product } from "@/lib/shop/catalog";

export function ProductImage({ product, sizes }: { product: Pick<Product, "name" | "imageUrl" | "category">; sizes: string }) {
  return <div className="shop-image">{product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes={sizes} /> : <span aria-hidden="true">{categoryName(product.category)}</span>}</div>;
}

export function ProductCard({ product }: { product: Product }) {
  return <article className="shop-card">
    <Link href={productHref(product)} className="shop-card-link">
      <ProductImage product={product} sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 25vw" />
      <span className="shop-card-cat">{categoryName(product.category)}{product.sample && " · sample listing"}</span>
      <h3>{product.name}</h3>
    </Link>
    <div className="shop-card-foot"><b>{formatAud(product.priceCents)}</b>{product.stock !== null && product.stock <= 5 && product.stock > 0 && <small>Only {product.stock} left</small>}</div>
    <AddToCart product={product} compact />
  </article>;
}

export function ProductGrid({ products, title }: { products: Product[]; title?: string }) {
  return <>
    <h2 className="shop-grid-title">{title ?? `${products.length} product${products.length === 1 ? "" : "s"}`}</h2>
    <div className="shop-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
  </>;
}
