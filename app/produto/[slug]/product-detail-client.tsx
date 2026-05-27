"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/proj-arte/types";

export function ProductDetailClient({ product, categoryLabel }: { product: Product; categoryLabel: string }) {
  const images = useMemo(
    () => [product.coverImageUrl, ...product.galleryUrls].filter(Boolean) as string[],
    [product.coverImageUrl, product.galleryUrls],
  );
  const [selected, setSelected] = useState(0);

  return (
    <article style={{ display: "grid", gap: 18, gridTemplateColumns: "1.1fr 1fr", background: "#fff", borderRadius: 16, border: "1px solid #f1d4e1", padding: 18 }}>
      <section>
        {images[0] ? (
          <img src={images[selected] ?? images[0]} alt={product.title} style={{ width: "100%", borderRadius: 12, objectFit: "cover" }} />
        ) : (
          <div style={{ border: "1px dashed #e4a8c4", borderRadius: 12, minHeight: 320, display: "grid", placeItems: "center", color: "#be185d", fontWeight: 700 }}>
            Sem imagem cadastrada
          </div>
        )}

        {images.length > 1 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 8, marginTop: 10 }}>
            {images.map((image, index) => (
              <button key={`${product.id}-thumb-${index}`} type="button" onClick={() => setSelected(index)} style={{ border: selected === index ? "2px solid #ec4899" : "1px solid #ddd", borderRadius: 8, padding: 0, overflow: "hidden", background: "white", cursor: "pointer" }}>
                <img src={image} alt={`${product.title} imagem ${index + 1}`} style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section style={{ display: "grid", alignContent: "start", gap: 12 }}>
        <span style={{ color: "#be185d", fontWeight: 800, textTransform: "uppercase", fontSize: 12 }}>{categoryLabel}</span>
        <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.1 }}>{product.title}</h1>
        <p style={{ margin: 0, whiteSpace: "pre-wrap", color: "#4b5563" }}>{product.description || "Material pedagógico digital para uso em sala."}</p>
        <strong style={{ fontSize: 32, color: "#111827" }}>{product.priceLabel}</strong>

        <Link
          href="/#produtos"
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, background: "#ec4899", color: "white", fontWeight: 800, minHeight: 44, padding: "0 22px", textDecoration: "none" }}
        >
          Voltar para comprar
        </Link>
      </section>
    </article>
  );
}
