import { randomUUID } from "crypto";
import { activityTypes, paginate, seedProducts } from "./catalog";
import { getSupabaseAdminClient } from "./supabase";
import type { ActivityType, PaginatedResult, Product } from "./types";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number | null;
  active: boolean | null;
};

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  activity_type_slug: string;
  price_cents: number;
  price_label: string | null;
  pdf_url: string | null;
  cover_image_url: string | null;
  gallery_urls: string[] | null;
  featured: boolean | null;
  active: boolean | null;
  checkout_url: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

function mapCategoryRow(row: CategoryRow): ActivityType {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    sortOrder: row.sort_order ?? 0,
    active: row.active ?? true,
  };
}

function mapProductRow(row: ProductRow): Product {
  const priceCents = row.price_cents ?? 0;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    activityTypeSlug: row.activity_type_slug,
    priceCents,
    priceLabel:
      row.price_label ??
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(priceCents / 100),
    pdfUrl: row.pdf_url,
    coverImageUrl: row.cover_image_url,
    galleryUrls: row.gallery_urls ?? [],
    featured: row.featured ?? false,
    active: row.active ?? true,
    checkoutUrl: row.checkout_url,
    stripeProductId: row.stripe_product_id,
    stripePriceId: row.stripe_price_id,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

export async function listCategories(): Promise<ActivityType[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return activityTypes;

  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,description,sort_order,active")
    .order("sort_order", { ascending: true });

  if (error || !data) return activityTypes;
  return data.map(mapCategoryRow);
}

export async function listProducts(options: {
  page?: number;
  limit?: number;
  categorySlug?: string;
  search?: string;
  onlyActive?: boolean;
} = {}): Promise<PaginatedResult<Product>> {
  const { page = 1, limit = 8, categorySlug, search, onlyActive = true } = options;
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    let items = [...seedProducts];
    if (categorySlug && categorySlug !== "all") {
      items = items.filter((item) => item.activityTypeSlug === categorySlug);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((item) =>
        `${item.title} ${item.description} ${item.priceLabel}`.toLowerCase().includes(q),
      );
    }
    if (onlyActive) {
      items = items.filter((item) => item.active);
    }
    return paginate(items.sort((a, b) => a.sortOrder - b.sortOrder), page, limit);
  }

  const [{ data: categoriesData }, { data: productsData, error }] = await Promise.all([
    supabase.from("categories").select("id,slug"),
    supabase.from("products").select("*").order("sort_order", { ascending: true }),
  ]);

  if (error || !productsData) {
    return paginate(seedProducts, page, limit);
  }

  const allowedCategories = new Set((categoriesData ?? []).map((row) => row.slug));
  let items = productsData.map(mapProductRow);

  if (onlyActive) {
    items = items.filter((item) => item.active);
  }
  if (categorySlug && categorySlug !== "all") {
    items = items.filter((item) => item.activityTypeSlug === categorySlug);
  }
  if (search) {
    const q = search.toLowerCase();
    items = items.filter((item) =>
      `${item.title} ${item.description} ${item.priceLabel}`.toLowerCase().includes(q),
    );
  }
  if (allowedCategories.size > 0) {
    items = items.filter((item) => allowedCategories.has(item.activityTypeSlug));
  }

  return paginate(items, page, limit);
}

export async function getProductById(id: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return seedProducts.find((product) => product.id === id) ?? null;

  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapProductRow(data as ProductRow);
}

export async function getProductBySlug(slug: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return seedProducts.find((product) => product.slug === slug) ?? null;

  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return mapProductRow(data as ProductRow);
}

export async function createProduct(input: Partial<Product>) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("supabase_not_configured");
  }

  const now = new Date().toISOString();
  const payload = {
    slug: input.slug ?? randomUUID(),
    title: input.title ?? "Novo material",
    description: input.description ?? "",
    activity_type_slug: input.activityTypeSlug ?? "alfabetizacao",
    price_cents: input.priceCents ?? 0,
    price_label: input.priceLabel ?? null,
    pdf_url: input.pdfUrl ?? null,
    cover_image_url: input.coverImageUrl ?? null,
    gallery_urls: input.galleryUrls ?? [],
    featured: input.featured ?? false,
    active: input.active ?? true,
    checkout_url: input.checkoutUrl ?? null,
    stripe_product_id: input.stripeProductId ?? null,
    stripe_price_id: input.stripePriceId ?? null,
    sort_order: input.sortOrder ?? 0,
    updated_at: now,
    created_at: now,
  };

  const { data, error } = await supabase.from("products").insert(payload).select("*").single();
  if (error || !data) {
    throw error ?? new Error("create_product_failed");
  }
  return mapProductRow(data as ProductRow);
}

export async function updateProduct(id: string, input: Partial<Product>) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("supabase_not_configured");
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const mapping: Record<string, unknown> = {
    slug: input.slug,
    title: input.title,
    description: input.description,
    activity_type_slug: input.activityTypeSlug,
    price_cents: input.priceCents,
    price_label: input.priceLabel,
    pdf_url: input.pdfUrl,
    cover_image_url: input.coverImageUrl,
    gallery_urls: input.galleryUrls,
    featured: input.featured,
    active: input.active,
    checkout_url: input.checkoutUrl,
    stripe_product_id: input.stripeProductId,
    stripe_price_id: input.stripePriceId,
    sort_order: input.sortOrder,
  };

  Object.entries(mapping).forEach(([key, value]) => {
    if (value !== undefined) payload[key] = value;
  });

  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("update_product_failed");
  }
  return mapProductRow(data as ProductRow);
}

export async function deleteProduct(id: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("supabase_not_configured");
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
  return true;
}
