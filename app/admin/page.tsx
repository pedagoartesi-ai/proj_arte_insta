"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";

type MeResponse =
  | { authenticated: false }
  | { authenticated: true; session: { email: string } };

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  activityTypeSlug: string;
  priceCents: number;
  priceLabel: string;
  pdfUrl: string | null;
  coverImageUrl: string | null;
  galleryUrls: string[];
  active: boolean;
  featured: boolean;
  checkoutUrl: string | null;
  stripePriceId: string | null;
  stripeProductId: string | null;
  sortOrder: number;
};

const emptyForm = {
  title: "",
  slug: "",
  activityTypeSlug: "alfabetizacao",
  priceCents: 0,
  priceLabel: "",
  description: "",
  pdfUrl: "",
  coverImageUrl: "",
  galleryUrls: "",
  checkoutUrl: "",
  stripePriceId: "",
  stripeProductId: "",
  featured: false,
  active: true,
  sortOrder: 0,
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminPage() {
  const [me, setMe] = useState<MeResponse>({ authenticated: false });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const isAuthenticated = me.authenticated;

  useEffect(() => {
    void refreshSession();
    void refreshCatalog();
  }, []);

  async function refreshSession() {
    const res = await fetch("/api/admin/me", { cache: "no-store" });
    const data = (await res.json()) as MeResponse;
    setMe(data);
  }

  async function refreshCatalog() {
    const [categoriesRes, productsRes] = await Promise.all([
      fetch("/api/categories", { cache: "no-store" }),
      fetch("/api/admin/products?limit=100", { cache: "no-store" }),
    ]);

    const categoriesData = await categoriesRes.json();
    const productsData = await productsRes.json();
    setCategories(categoriesData.data ?? []);
    setProducts(productsData.data ?? []);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      setMessage("Login inválido.");
      return;
    }
    setMessage("Login ok.");
    await refreshSession();
    await refreshCatalog();
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setMe({ authenticated: false });
  }

  async function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const slug = form.slug || slugify(form.title);
    const payload = {
      ...form,
      slug,
      priceCents: Number(form.priceCents),
      sortOrder: Number(form.sortOrder),
      galleryUrls: form.galleryUrls
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
      pdfUrl: form.pdfUrl || null,
      coverImageUrl: form.coverImageUrl || null,
      checkoutUrl: form.checkoutUrl || null,
      stripePriceId: form.stripePriceId || null,
      stripeProductId: form.stripeProductId || null,
      priceLabel: form.priceLabel || undefined,
    };

    const endpoint = editingProductId ? `/api/admin/products/${editingProductId}` : "/api/admin/products";
    const res = await fetch(endpoint, {
      method: editingProductId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage(`Falha ao salvar: ${body.error ?? "erro"}`);
      return;
    }
    setMessage(editingProductId ? "Produto atualizado." : "Produto criado.");
    setEditingProductId(null);
    setForm(emptyForm);
    await refreshCatalog();
  }

  function startEditProduct(product: Product) {
    setEditingProductId(product.id);
    setMessage("");
    setForm({
      title: product.title,
      slug: product.slug,
      activityTypeSlug: product.activityTypeSlug,
      priceCents: product.priceCents,
      priceLabel: product.priceLabel,
      description: product.description,
      pdfUrl: product.pdfUrl ?? "",
      coverImageUrl: product.coverImageUrl ?? "",
      galleryUrls: product.galleryUrls.join("\n"),
      checkoutUrl: product.checkoutUrl ?? "",
      stripePriceId: product.stripePriceId ?? "",
      stripeProductId: product.stripeProductId ?? "",
      featured: product.featured,
      active: product.active,
      sortOrder: product.sortOrder,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingProductId(null);
    setForm(emptyForm);
    setMessage("");
  }

  async function removeProduct(id: string) {
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setMessage("Falha ao remover produto.");
      return;
    }
    setMessage("Produto removido.");
    await refreshCatalog();
  }

  async function uploadAsset(file: File, folder: string) {
    const signRes = await fetch("/api/admin/uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, contentType: file.type || "application/octet-stream", folder }),
    });

    const signBody = await signRes.json().catch(() => ({}));
    if (!signRes.ok || !signBody?.data?.signedUrl || !signBody?.data?.path || !signBody?.data?.bucket) {
      throw new Error(signBody?.error ?? "sign_failed");
    }

    const uploadRes = await fetch(signBody.data.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error("upload_failed");
    }

    const { origin } = new URL(signBody.data.signedUrl);
    return `${origin}/storage/v1/object/public/${signBody.data.bucket}/${signBody.data.path}`;
  }

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Admin — Artes que Ensinam</h1>
      <p>Cadastro enxuto para publicar material, ligar o preço do Stripe e testar entrega do PDF.</p>
      {message ? <p>{message}</p> : null}

      {!isAuthenticated ? (
        <form onSubmit={handleLogin} style={{ display: "grid", gap: 12, maxWidth: 420, marginTop: 24 }}>
          <input id="admin-email" name="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              id="admin-password"
              name="password"
              placeholder="Senha"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
              {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
          <button type="submit" disabled={loading}>Entrar</button>
        </form>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <strong>Autenticado como {me.session.email}</strong>
            <button onClick={handleLogout}>Sair</button>
          </div>

          <section style={{ marginTop: 24 }}>
            <h2>{editingProductId ? "Editar produto" : "Novo produto"}</h2>
            <form onSubmit={handleSaveProduct} style={{ display: "grid", gap: 10 }}>
              <input id="product-title" name="title" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <select id="product-category" name="activityTypeSlug" value={form.activityTypeSlug} onChange={(e) => setForm({ ...form, activityTypeSlug: e.target.value })}>
                {categories.map((category) => (
                  <option value={category.slug} key={category.id}>{category.name}</option>
                ))}
              </select>
              <input id="product-price-cents" name="priceCents" type="number" min={0} step={1} placeholder="Preço em centavos (ex: 1000 para R$ 10,00)" value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value) })} />
              <input id="product-price-label" name="priceLabel" placeholder="Preço label (ex: R$ 10,00)" value={form.priceLabel} onChange={(e) => setForm({ ...form, priceLabel: e.target.value })} />
              <input id="product-stripe-price-id" name="stripePriceId" placeholder="Stripe Price ID (price_...)" value={form.stripePriceId} onChange={(e) => setForm({ ...form, stripePriceId: e.target.value.trim() })} />
              <textarea id="product-description" name="description" placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div style={{ display: "grid", gap: 8 }}>
                <label>PDF do produto (upload)</label>
                <input
                  id="product-pdf-upload"
                  name="productPdf"
                  type="file"
                  accept="application/pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingPdf(true);
                    setMessage("");
                    try {
                      const url = await uploadAsset(file, "products/pdfs");
                      setForm((prev) => ({ ...prev, pdfUrl: url }));
                      setMessage("PDF enviado com sucesso.");
                    } catch (error) {
                      setMessage(`Falha no upload do PDF: ${String(error)}`);
                    } finally {
                      setUploadingPdf(false);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <input id="product-pdf-url" name="pdfUrl" placeholder="URL do PDF (preenchido automaticamente)" value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} />
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <label>Imagem de capa (upload)</label>
                <input
                  id="product-cover-upload"
                  name="productCover"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingCover(true);
                    setMessage("");
                    try {
                      const url = await uploadAsset(file, "products/covers");
                      setForm((prev) => ({ ...prev, coverImageUrl: url }));
                      setMessage("Capa enviada com sucesso.");
                    } catch (error) {
                      setMessage(`Falha no upload da capa: ${String(error)}`);
                    } finally {
                      setUploadingCover(false);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <input id="product-cover-url" name="coverImageUrl" placeholder="URL da capa (preenchido automaticamente)" value={form.coverImageUrl} onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })} />
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <label>Galeria de imagens (upload múltiplo)</label>
                <input
                  id="product-gallery-upload"
                  name="productGallery"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (!files.length) return;
                    setUploadingGallery(true);
                    setMessage("");
                    try {
                      const uploaded = await Promise.all(files.map((file) => uploadAsset(file, "products/gallery")));
                      setForm((prev) => {
                        const existing = prev.galleryUrls
                          .split(/\n|,/)
                          .map((item) => item.trim())
                          .filter(Boolean);
                        return { ...prev, galleryUrls: [...existing, ...uploaded].join("\n") };
                      });
                      setMessage("Galeria enviada com sucesso.");
                    } catch (error) {
                      setMessage(`Falha no upload da galeria: ${String(error)}`);
                    } finally {
                      setUploadingGallery(false);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <textarea id="product-gallery-urls" name="galleryUrls" placeholder="URLs da galeria (preenchido automaticamente; 1 por linha)" value={form.galleryUrls} onChange={(e) => setForm({ ...form, galleryUrls: e.target.value })} />
              </div>
              <label><input id="product-active" name="active" type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Ativo</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="submit" disabled={loading || uploadingPdf || uploadingCover || uploadingGallery}>
                  {editingProductId ? "Atualizar produto" : "Salvar produto"}
                </button>
                {editingProductId ? <button type="button" onClick={cancelEdit}>Cancelar edição</button> : null}
              </div>
            </form>
          </section>

          <section style={{ marginTop: 32 }}>
            <h2>Produtos</h2>
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              {products.map((product) => (
                <article key={product.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 12 }}>
                  <strong>{product.title}</strong>
                  <div>{product.activityTypeSlug}</div>
                  <div>{product.priceLabel}</div>
                  <div>Stripe: {product.stripePriceId ? product.stripePriceId : "pendente"}</div>
                  <div>PDF: {product.pdfUrl ? "preenchido" : "pendente"}</div>
                  <div>Status: {product.active ? "Ativo" : "Inativo"}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    <button type="button" onClick={() => startEditProduct(product)}>Editar</button>
                    <button type="button" onClick={() => removeProduct(product.id)}>Excluir</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
