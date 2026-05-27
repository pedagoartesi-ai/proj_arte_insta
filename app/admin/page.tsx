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
  activityTypeSlug: string;
  priceLabel: string;
  active: boolean;
  featured: boolean;
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

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const payload = {
      ...form,
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

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage(`Falha ao criar: ${body.error ?? "erro"}`);
      return;
    }
    setMessage("Produto criado.");
    setForm(emptyForm);
    await refreshCatalog();
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

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Admin — Artes que Ensinam</h1>
      <p>Backend preparado para produtos, PDF, preços, Stripe e filtros por atividade.</p>
      {message ? <p>{message}</p> : null}

      {!isAuthenticated ? (
        <form onSubmit={handleLogin} style={{ display: "grid", gap: 12, maxWidth: 420, marginTop: 24 }}>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
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
            <h2>Novo produto</h2>
            <form onSubmit={handleCreateProduct} style={{ display: "grid", gap: 10 }}>
              <input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              <select value={form.activityTypeSlug} onChange={(e) => setForm({ ...form, activityTypeSlug: e.target.value })}>
                {categories.map((category) => (
                  <option value={category.slug} key={category.id}>{category.name}</option>
                ))}
              </select>
              <input type="number" placeholder="Preço em centavos" value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: Number(e.target.value) })} />
              <input placeholder="Preço label (ex: R$ 10,00)" value={form.priceLabel} onChange={(e) => setForm({ ...form, priceLabel: e.target.value })} />
              <textarea placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <input placeholder="URL do PDF" value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} />
              <input placeholder="URL da capa" value={form.coverImageUrl} onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })} />
              <textarea placeholder="URLs da galeria separadas por vírgula ou nova linha" value={form.galleryUrls} onChange={(e) => setForm({ ...form, galleryUrls: e.target.value })} />
              <input placeholder="Checkout URL" value={form.checkoutUrl} onChange={(e) => setForm({ ...form, checkoutUrl: e.target.value })} />
              <input placeholder="Stripe Price ID" value={form.stripePriceId} onChange={(e) => setForm({ ...form, stripePriceId: e.target.value })} />
              <input placeholder="Stripe Product ID" value={form.stripeProductId} onChange={(e) => setForm({ ...form, stripeProductId: e.target.value })} />
              <input type="number" placeholder="Ordem" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              <label><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Destaque</label>
              <label><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Ativo</label>
              <button type="submit" disabled={loading}>Salvar produto</button>
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
                  <div>{product.featured ? "Destaque" : "Normal"} · {product.active ? "Ativo" : "Inativo"}</div>
                  <button onClick={() => removeProduct(product.id)}>Excluir</button>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
