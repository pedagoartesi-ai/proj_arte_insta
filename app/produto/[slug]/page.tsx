import Link from "next/link";
import { notFound } from "next/navigation";
import { listCategories, getProductBySlug } from "@/lib/proj-arte/store";
import { ProductDetailClient } from "./product-detail-client";

export default async function ProdutoDetalhePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, categories] = await Promise.all([getProductBySlug(slug), listCategories()]);

  if (!product || !product.active) {
    notFound();
  }

  const categoryLabel =
    categories.find((category) => category.slug === product.activityTypeSlug)?.name ?? product.activityTypeSlug;

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px 40px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/" style={{ color: "#be185d", fontWeight: 700 }}>
          ← Voltar para vitrine
        </Link>
      </div>

      <ProductDetailClient product={product} categoryLabel={categoryLabel} />
    </main>
  );
}
