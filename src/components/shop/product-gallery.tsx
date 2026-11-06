"use client";

import { useState } from "react";
import Image from "next/image";
import { categoryName, type Product } from "@/lib/shop/catalog";

/** Main product photo with thumbnails underneath (falls back to a branded tile when there's no photo). */
export function ProductGallery({ product }: { product: Pick<Product, "name" | "imageUrl" | "images" | "category"> }) {
  const photos = product.images.length ? product.images : product.imageUrl ? [product.imageUrl] : [];
  const [index, setIndex] = useState(0);
  if (!photos.length) return <div className="shop-image product-gallery-main is-empty"><span aria-hidden="true">{categoryName(product.category)}</span></div>;
  return <div className="product-gallery">
    <div className="shop-image product-gallery-main"><Image src={photos[index]} alt={`${product.name}${photos.length > 1 ? `, photo ${index + 1} of ${photos.length}` : ""}`} fill priority sizes="(max-width: 700px) 100vw, 50vw" /></div>
    {photos.length > 1 && <div className="product-gallery-thumbs" role="list">{photos.map((photo, i) => <button key={photo} type="button" role="listitem" className={i === index ? "is-on" : ""} onClick={() => setIndex(i)} aria-label={`Show photo ${i + 1}`} aria-current={i === index}>
      <Image src={photo} alt="" fill sizes="80px" />
    </button>)}</div>}
  </div>;
}
