"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  BookOpen,
  CalendarHeart,
  Camera,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  LayoutGrid,
  Mail,
  MessageCircle,
  Palette,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  UserRound,
  Send,
  Loader2,
  FileText,
  GraduationCap,
} from "lucide-react";
import type { ActivityType, Product } from "@/lib/proj-arte/types";

const email = "pedagoartesi@gmail.com";

declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized?: boolean;
      init?: () => void;
    };
    Stripe?: (publishableKey: string) => {
      initEmbeddedCheckout: (args: { fetchClientSecret: () => Promise<string> }) => {
        mount: (element: HTMLElement | string) => void;
        unmount?: () => void;
      };
    };
  }
}

type Props = {
  initialCategories: ActivityType[];
  initialProducts: Product[];
  publicUrl: string;
  whatsappUrl: string;
  stripePublishableKey: string;
};

const socialLinks = (whatsappUrl: string) => [
  { label: "WhatsApp", href: whatsappUrl || "#contato", icon: MessageCircle },
  { label: "Instagram", href: "#contato", icon: Camera },
  { label: "Facebook", href: "#contato", icon: Heart },
];

const categoryIcons: Record<string, typeof BadgeCheck> = {
  "avaliacoes-sondagens-relatorios": BadgeCheck,
  "kits-sala-de-aula": Sparkles,
  "decoracao-sala-volta-as-aulas": Palette,
  apostilas: BookOpen,
  alfabetizacao: GraduationCap,
  "datas-comemorativas": CalendarHeart,
  saeb: BadgeCheck,
  "educacao-infantil": Heart,
  "kits-combos": Star,
  "terceiro-ao-quinto-ano": GraduationCap,
  "leitura-escrita": BookOpen,
  matematica: FileText,
  "recursos-na-lata": ShieldCheck,
  "sequencia-didatica": LayoutGrid,
  lembrancinhas: Heart,
  painel: Camera,
};

export function ProjetoArteStorefront({
  initialCategories,
  initialProducts,
  publicUrl,
  whatsappUrl,
  stripePublishableKey,
}: Props) {
  const [categories] = useState(initialCategories);
  const [products] = useState(initialProducts);
  const [activeCategory, setActiveCategory] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [emailInput, setEmailInput] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationRequestToken, setVerificationRequestToken] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "sending" | "code-sent" | "verifying" | "verified" | "error">("idle");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [contactEmailOpen, setContactEmailOpen] = useState(false);
  const [contactEmailSubject, setContactEmailSubject] = useState("Contato pelo site Artes que Ensinam");
  const [contactEmailBody, setContactEmailBody] = useState("");
  const [contactSenderEmail, setContactSenderEmail] = useState("");
  const [contactSenderWhatsapp, setContactSenderWhatsapp] = useState("");
  const [contactSendStatus, setContactSendStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [contactSendMessage, setContactSendMessage] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "creating" | "ready" | "error">("idle");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [stripeReady, setStripeReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const embeddedCheckoutRef = useRef<HTMLDivElement | null>(null);
  const embeddedCheckoutInstance = useRef<{ unmount?: () => void } | null>(null);

  const categoryBySlug = useMemo(
    () => new Map(categories.map((category) => [category.slug, category])),
    [categories],
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.activityTypeSlug, (counts.get(product.activityTypeSlug) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter((product) => product.activityTypeSlug === activeCategory);
  }, [activeCategory, products]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleProducts = useMemo(
    () => filteredProducts.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage),
    [filteredProducts, safeCurrentPage],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.UnicornStudio) {
      window.UnicornStudio = { isInitialized: false };
    }

    const existing = document.querySelector('script[data-unicorn="true"]') as HTMLScriptElement | null;
    if (existing) return;

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js";
    script.async = true;
    script.setAttribute("data-unicorn", "true");
    script.onload = () => {
      if (!window.UnicornStudio?.isInitialized) {
        window.UnicornStudio?.init?.();
        if (window.UnicornStudio) window.UnicornStudio.isInitialized = true;
      }
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!stripeReady || !clientSecret || !stripePublishableKey || !embeddedCheckoutRef.current) return;

    let cancelled = false;

    async function mountCheckout() {
      if (!window.Stripe) return;

      embeddedCheckoutInstance.current?.unmount?.();
      embeddedCheckoutInstance.current = null;
      embeddedCheckoutRef.current!.innerHTML = "";

      const stripe = window.Stripe(stripePublishableKey);
      const checkout = stripe.initEmbeddedCheckout({
        fetchClientSecret: async () => clientSecret,
      });

      if (cancelled) return;
      checkout.mount(embeddedCheckoutRef.current!);
      embeddedCheckoutInstance.current = checkout;
    }

    void mountCheckout();

    return () => {
      cancelled = true;
      embeddedCheckoutInstance.current?.unmount?.();
      embeddedCheckoutInstance.current = null;
    };
  }, [clientSecret, stripePublishableKey, stripeReady]);

  async function sendContactEmail() {
    const senderEmail = contactSenderEmail.trim();
    const senderWhatsapp = contactSenderWhatsapp.trim();
    const subject = contactEmailSubject.trim() || "Contato pelo site Artes que Ensinam";
    const message = contactEmailBody.trim();

    if (!senderEmail || !message) {
      setContactSendStatus("error");
      setContactSendMessage("Preencha seu email e a mensagem antes de enviar.");
      return;
    }

    setContactSendStatus("sending");
    setContactSendMessage("");

    try {
      const res = await fetch("/api/contact/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message,
          email: senderEmail,
          whatsapp: senderWhatsapp,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setContactSendStatus("error");
        setContactSendMessage(data.message ?? "Não foi possível enviar. Tente novamente.");
        return;
      }

      setContactSendStatus("success");
      setContactSendMessage("Mensagem enviada com sucesso.");
      setContactEmailBody("");
    } catch {
      setContactSendStatus("error");
      setContactSendMessage("Não foi possível conectar ao envio. Tente novamente.");
    }
  }

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([productId, quantity]) => {
        const product = products.find((item) => item.id === productId);
        if (!product) return null;
        return { product, quantity };
      })
      .filter(Boolean) as Array<{ product: Product; quantity: number }>;
  }, [cart, products]);

  const subtotalCents = cartItems.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);
  const subtotalLabel = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(subtotalCents / 100);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(productId: string) {
    setCart((current) => ({ ...current, [productId]: (current[productId] ?? 0) + 1 }));
  }

  function removeFromCart(productId: string) {
    setCart((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }

  function updateCartItem(productId: string, quantity: number) {
    setCart((current) => {
      if (quantity <= 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      return { ...current, [productId]: Math.min(10, quantity) };
    });
  }

  async function requestEmailVerification() {
    setVerificationStatus("sending");
    setVerificationMessage("");
    setVerificationRequestToken("");
    setVerificationToken("");
    const res = await fetch("/api/buyer/email/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setVerificationStatus("error");
      setVerificationMessage(data.message ?? (data.error ? `Falha: ${data.error}` : "Não foi possível enviar o código."));
      return;
    }

    setVerificationStatus("code-sent");
    setVerificationRequestToken(data.verificationRequestToken ?? "");
    setVerificationMessage(`Código enviado para ${data.email}.`);
  }

  async function verifyEmailCode() {
    if (!verificationRequestToken) {
      setVerificationStatus("error");
      setVerificationMessage("Peça um novo código antes de verificar.");
      return;
    }

    setVerificationStatus("verifying");
    setVerificationMessage("");
    const res = await fetch("/api/buyer/email/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailInput, code: verificationCode, requestToken: verificationRequestToken }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setVerificationStatus("error");
      setVerificationMessage(data.error ? `Falha: ${data.error}` : "Código inválido.");
      return;
    }

    setVerificationToken(data.token);
    setVerificationStatus("verified");
    setVerificationMessage("Email verificado. Checkout liberado.");
  }

  async function startCheckout() {
    if (!cartItems.length) {
      setCheckoutStatus("error");
      setCheckoutMessage("Adicione pelo menos 1 produto ao carrinho.");
      return;
    }
    if (!verificationToken) {
      setCheckoutStatus("error");
      setCheckoutMessage("Verifique o email antes de continuar.");
      return;
    }
    if (!stripePublishableKey) {
      setCheckoutStatus("error");
      setCheckoutMessage("Chave pública do Stripe ausente no ambiente.");
      return;
    }

    setCheckoutStatus("creating");
    setCheckoutMessage("");
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity })),
        buyerEmail: emailInput,
        buyerEmailVerificationToken: verificationToken,
        embedded: true,
        returnUrl: `${publicUrl}/obrigado?session_id={CHECKOUT_SESSION_ID}`,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setCheckoutStatus("error");
      setCheckoutMessage(data.error ? `Falha: ${data.error}` : "Não foi possível criar o checkout.");
      return;
    }

    if (!data.clientSecret) {
      setCheckoutStatus("error");
      setCheckoutMessage("Checkout criado sem client secret.");
      return;
    }

    setClientSecret(data.clientSecret);
    setCheckoutStatus("ready");
    setCheckoutMessage("Checkout embutido pronto.");
    setCartOpen(true);
  }

  function openCategoryFilters() {
    setFiltersOpen((current) => !current);
  }

  function openCart() {
    setCartOpen(true);
    setFiltersOpen(false);
  }

  return (
    <>
      <Script src="https://js.stripe.com/v3/" strategy="afterInteractive" onLoad={() => setStripeReady(true)} />
      <main>
        <section className="first-fold" id="inicio" aria-label="Artes que Ensinam">
          <header className="site-header">
            <nav className="main-nav" aria-label="Navegação principal">
              <div className="main-nav__inner">
                <a className="nav-brand" href="#inicio" aria-label="Artes que Ensinam">
                  <span className="brand-mark__abc">ABC</span>
                  <span className="brand-mark__script">Artes que Ensinam</span>
                  <span className="brand-mark__byline">por Simone Pereira Lima</span>
                </a>

                <div className="main-nav__actions">
                  <a
                    href="#inicio"
                    className="nav-tile"
                    onClick={() => {
                      setActiveCategory("all");
                      setCurrentPage(1);
                      setFiltersOpen(false);
                    }}
                  >
                    <Home aria-hidden="true" />
                    <span>Início</span>
                  </a>
                  <a href="#produtos" className="nav-tile nav-tile--cta">
                    <Send aria-hidden="true" />
                    <span>Ver materiais</span>
                  </a>
                  <button type="button" className="nav-tile nav-tile--button" onClick={openCategoryFilters}>
                    <LayoutGrid aria-hidden="true" />
                    <span>Categorias</span>
                  </button>
                  <a href="#sobre" className="nav-tile">
                    <UserRound aria-hidden="true" />
                    <span>Sobre</span>
                  </a>
                  <a href="#contato" className="nav-tile">
                    <Mail aria-hidden="true" />
                    <span>Contato</span>
                  </a>
                  <button type="button" className="nav-tile nav-tile--button" onClick={openCart}>
                    <ShoppingCart aria-hidden="true" />
                    <span>Carrinho</span>
                    <strong className="cart-pill" id="carrinho">
                      R$ {subtotalCents === 0 ? "0,00" : subtotalLabel.replace("R$", "").trim()} <small>{cartCount}</small>
                    </strong>
                  </button>
                </div>
              </div>
            </nav>

          </header>

          <div className="hero-art" aria-label="Apresentação visual da professora Simone">
            <Image
              src="/images/hero-artes-que-ensinam.png"
              alt="Professora Artes Pedagógicas para educar com amor"
              priority
              fill
              sizes="100vw"
              className="hero-art__image"
            />
          </div>

        </section>

        {filtersOpen ? (
          <div className="category-modal-backdrop" role="presentation" onClick={() => setFiltersOpen(false)}>
            <div
              className="category-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Categorias"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="category-modal__header">
                <h2>Categorias</h2>
                <button type="button" className="modal-close" onClick={() => setFiltersOpen(false)} aria-label="Fechar categorias">
                  ×
                </button>
              </div>
              <div className="category-grid category-grid--compact">
                {categories.map((category) => {
                  const Icon = categoryIcons[category.slug] ?? BadgeCheck;
                  const active = activeCategory === category.slug;
                  const count = categoryCounts.get(category.slug) ?? 0;
                  return (
                    <button
                      type="button"
                      className={`category-item ${active ? "category-item--active" : ""}`}
                      key={category.slug}
                      onClick={() => {
                        setActiveCategory(category.slug);
                        setCurrentPage(1);
                        setFiltersOpen(false);
                      }}
                    >
                      <Icon aria-hidden="true" />
                      <h3>{category.name}</h3>
                      <p>{category.description}</p>
                      <span className="category-count">{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="filter-strip filter-strip--modal" role="tablist" aria-label="Filtrar atividades">
                <button
                  type="button"
                  className={`filter-chip ${activeCategory === "all" ? "filter-chip--active" : ""}`}
                  onClick={() => {
                    setActiveCategory("all");
                    setCurrentPage(1);
                    setFiltersOpen(false);
                  }}
                >
                  Todas as atividades
                </button>
                {categories.map((category) => (
                  <button
                    type="button"
                    className={`filter-chip ${activeCategory === category.slug ? "filter-chip--active" : ""}`}
                    onClick={() => {
                      setActiveCategory(category.slug);
                      setCurrentPage(1);
                      setFiltersOpen(false);
                    }}
                    key={`${category.slug}-chip`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <section className="section products-section" id="produtos">
          <div className="container products-layout">
            <div>
              <div className="section-heading">
                <span className="eyebrow">Vitrine</span>
                <h2>Produtos prontos para venda</h2>
                <p>Clique no produto para abrir o informativo com imagens. O checkout só abre no carrinho.</p>
              </div>

              <div className="products-grid">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryLabel={categoryBySlug.get(product.activityTypeSlug)?.name ?? product.activityTypeSlug}
                    onAdd={() => {
                      addToCart(product.id);
                      setCartOpen(true);
                    }}
                  />
                ))}
              </div>

              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onChange={setCurrentPage}
              />
            </div>

            <aside className={`checkout-panel ${cartOpen ? "checkout-panel--open" : ""}`} id="checkout-panel">
              <div className="checkout-panel__head">
                <div className="checkout-panel__head-row">
                  <span className="eyebrow">Carrinho</span>
                  <button type="button" className="panel-close" onClick={() => setCartOpen(false)}>
                    Fechar
                  </button>
                </div>
                <h3>Seu pedido</h3>
                <p>{cartItems.length ? `${cartItems.length} item(ns) selecionado(s)` : "Adicione um produto para iniciar."}</p>
              </div>

              <div className="cart-list">
                {cartItems.length ? cartItems.map(({ product, quantity }) => (
                  <div className="cart-row" key={product.id}>
                    <div>
                      <strong>{product.title}</strong>
                      <span>{product.priceLabel}</span>
                    </div>
                    <div className="cart-row__actions">
                      <button type="button" onClick={() => updateCartItem(product.id, quantity - 1)} aria-label={`Diminuir ${product.title}`}>
                        −
                      </button>
                      <strong>{quantity}</strong>
                      <button type="button" onClick={() => updateCartItem(product.id, quantity + 1)} aria-label={`Aumentar ${product.title}`}>
                        +
                      </button>
                      <button type="button" className="cart-row__remove" onClick={() => removeFromCart(product.id)}>
                        Remover
                      </button>
                    </div>
                  </div>
                )) : <p className="checkout-panel__empty">Nenhum item no carrinho ainda.</p>}
              </div>

              <div className="checkout-summary">
                <div>
                  <span>Total</span>
                  <strong>{subtotalLabel}</strong>
                </div>
                <div className="checkout-actions">
                  <input
                    id="buyer-email"
                    name="buyerEmail"
                    type="email"
                    placeholder="Email do comprador"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                  <button type="button" onClick={requestEmailVerification} disabled={!emailInput || verificationStatus === "sending"}>
                    {verificationStatus === "sending" ? <Loader2 aria-hidden="true" className="spin" /> : null}
                    Enviar código
                  </button>
                  <div className="verification-row">
                    <input
                      id="buyer-verification-code"
                      name="buyerVerificationCode"
                      type="text"
                      inputMode="numeric"
                      placeholder="Código de 6 dígitos"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                    <button type="button" onClick={verifyEmailCode} disabled={verificationCode.length !== 6 || verificationStatus === "verifying"}>
                      {verificationStatus === "verifying" ? <Loader2 aria-hidden="true" className="spin" /> : null}
                      Verificar
                    </button>
                  </div>
                  <button type="button" className="checkout-button" onClick={startCheckout} disabled={!cartItems.length || verificationStatus !== "verified" || checkoutStatus === "creating"}>
                    Iniciar checkout embutido
                  </button>
                </div>
                {verificationMessage ? <p className={`status-message status-message--${verificationStatus}`}>{verificationMessage}</p> : null}
                {checkoutMessage ? <p className={`status-message status-message--${checkoutStatus}`}>{checkoutMessage}</p> : null}
              </div>

              <div className="embedded-checkout-wrap">
                {cartOpen ? <div ref={embeddedCheckoutRef} className="embedded-checkout" /> : <p className="checkout-panel__empty">Abra o carrinho para ver o checkout.</p>}
              </div>
            </aside>
          </div>
        </section>

        <section className="section about-section" id="sobre">
          <div className="container about-layout">
            <div className="about-copy">
              <span className="eyebrow">Sobre</span>
              <h2>Professora Simone Pereira Lima</h2>
              <p>
                Simone é professora e pedagoga, apaixonada por criar materiais que ajudam educadores a transformar planejamento em experiências lúdicas, afetivas e significativas.
              </p>
              <p>
                A proposta da Artes que Ensinam é reunir arquivos em PDF prontos para imprimir, com visual acolhedor e uso simples no dia a dia da sala de aula.
              </p>
              <div className="about-badges" aria-label="Diferenciais">
                <span>
                  <GraduationCap aria-hidden="true" />
                  Pedagoga
                </span>
                <span>
                  <ShieldCheck aria-hidden="true" />
                  Materiais autorais
                </span>
              </div>
            </div>
            <div className="portrait-frame">
              <Image
                src="/images/simone-pereira-lima.jpg"
                alt="Professora Simone Pereira Lima"
                width={878}
                height={1200}
                className="portrait-frame__image"
              />
            </div>
          </div>
        </section>

        <section className="section contact-section" id="contato">
          <div className="contact-section__bg" aria-hidden="true">
            <div data-us-project="qTiAlX0sxkuBOAiL7qHL" className="contact-section__bg-project" />
          </div>
          <div className="container contact-layout">
            <div>
              <span className="eyebrow">Contato</span>
              <h2>Fale com a Simone</h2>
              <p>
                WhatsApp abre no canal do projeto e o email vai direto para a Simone.
              </p>
            </div>
            <div className="contact-actions">
              <button type="button" className="contact-card" onClick={() => setContactEmailOpen(true)}>
                <Mail aria-hidden="true" />
                <span>Email para a Simone</span>
              </button>
              <a className="contact-card" href={whatsappUrl || "#contato"} target={whatsappUrl ? "_blank" : undefined} rel={whatsappUrl ? "noreferrer" : undefined} aria-label="Contato pelo WhatsApp">
                <MessageCircle aria-hidden="true" />
                <span>Suporte pelo WhatsApp</span>
              </a>
            </div>
            {contactEmailOpen ? (
              <div className="category-modal-backdrop" role="presentation" onClick={() => setContactEmailOpen(false)}>
                <div
                  className="category-modal contact-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Enviar email para a Simone"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="category-modal__header">
                    <h2>Enviar email</h2>
                    <button type="button" className="modal-close" onClick={() => setContactEmailOpen(false)} aria-label="Fechar contato">
                      ×
                    </button>
                  </div>
                  <form
                    className="contact-mailbox"
                    noValidate
                    onSubmit={(event) => {
                      event.preventDefault();
                      void sendContactEmail();
                    }}
                  >
                    <label>
                      Seu email
                      <input
                        id="contact-sender-email"
                        name="contactSenderEmail"
                        type="email"
                        value={contactSenderEmail}
                        onChange={(e) => setContactSenderEmail(e.target.value)}
                        placeholder="seuemail@dominio.com"
                        autoComplete="email"
                      />
                    </label>
                    <label>
                      WhatsApp
                      <input
                        id="contact-sender-whatsapp"
                        name="contactSenderWhatsapp"
                        type="text"
                        value={contactSenderWhatsapp}
                        onChange={(e) => setContactSenderWhatsapp(e.target.value)}
                        placeholder="(00) 00000-0000"
                        autoComplete="tel"
                      />
                    </label>
                    <label>
                      Assunto
                      <input
                        id="contact-email-subject"
                        name="contactEmailSubject"
                        type="text"
                        value={contactEmailSubject}
                        onChange={(e) => setContactEmailSubject(e.target.value)}
                        placeholder="Assunto do email"
                      />
                    </label>
                    <label>
                      Mensagem
                      <textarea
                        id="contact-email-body"
                        name="contactEmailBody"
                        value={contactEmailBody}
                        onChange={(e) => setContactEmailBody(e.target.value)}
                        placeholder="Escreva sua mensagem para pedagoartesi@gmail.com"
                        rows={5}
                      />
                    </label>
                    <button
                      type="submit"
                      className="checkout-button contact-mailbox__send"
                      disabled={contactSendStatus === "sending"}
                    >
                      {contactSendStatus === "sending" ? <Loader2 aria-hidden="true" /> : <Send aria-hidden="true" />} Enviar email
                    </button>
                    {contactSendMessage ? <p className="contact-mailbox__feedback">{contactSendMessage}</p> : null}
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-layout">
          <div className="footer-brand">
            <span className="brand-mark__abc">ABC</span>
            <strong>Artes que Ensinam</strong>
            <p>Materiais pedagógicos em PDF para imprimir, criar e ensinar com carinho.</p>
          </div>
          <div>
            <h2>Links úteis</h2>
            <a href="#inicio">Início</a>
            <a href="#sobre">Sobre</a>
            <a href="#contato">Contato</a>
            <a href="#produtos">Produtos</a>
          </div>
          <div>
            <h2>Sociais</h2>
            {socialLinks(whatsappUrl).map((social) => (
              <a href={social.href} key={social.label}>
                <social.icon aria-hidden="true" />
                {social.label}
              </a>
            ))}
            <button type="button" className="footer-filter-link" onClick={openCategoryFilters}>
              Abrir categorias
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>Copyright © Artes que Ensinam - Simone Pereira Lima</span>
          <span>{email}</span>
        </div>
      </footer>
    </>
  );
}

function ProductCard({
  product,
  categoryLabel,
  onAdd,
}: {
  product: Product;
  categoryLabel: string;
  onAdd: () => void;
}) {
  const slides = [product.coverImageUrl, ...product.galleryUrls].filter(Boolean) as string[];
  const accent = product.featured ? "rose" : product.activityTypeSlug.includes("datas") ? "sun" : product.activityTypeSlug.includes("alfabetizacao") ? "sky" : "mint";

  return (
    <article className={`product-card product-card--${accent}`}>
      <Link
        href={`/produto/${product.slug}`}
        className="product-preview"
        aria-label={`Abrir detalhes de ${product.title}`}
        style={{ border: 0, background: "transparent", padding: 0, width: "100%", textAlign: "left", cursor: "pointer" }}
      >
        <div className="product-preview__rail">
          {(slides.length ? slides : [""]).map((slide, index) => (
            <div
              className={slide ? "product-preview__sheet product-preview__sheet--image" : "product-preview__sheet"}
              key={`${product.title}-${index}`}
            >
              {slide ? (
                <img src={slide} alt={`${product.title} - imagem ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <>
                  <Sparkles aria-hidden="true" />
                  <span>{categoryLabel}</span>
                  <strong>{product.title}</strong>
                  <small>Clique para ver detalhes</small>
                </>
              )}
            </div>
          ))}
        </div>
      </Link>
      <div className="product-card__body">
        <span className="product-category">{categoryLabel}</span>
        <h3>{product.title}</h3>
        <p>{product.priceLabel}</p>
        <div className="product-card__actions">
          <Link className="buy-button" href={`/produto/${product.slug}`} aria-label={`Ver informativo de ${product.title}`}>
            Ver informativo
          </Link>
          <button type="button" className="buy-button" onClick={onAdd} aria-label={`Adicionar ${product.title}`}>
            <Plus aria-hidden="true" /> Adicionar
          </button>
        </div>
      </div>
      {product.featured ? <span className="featured-badge">Destaque</span> : null}
    </article>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const pages: Array<number | "ellipsis"> = [];
  for (let page = 1; page <= totalPages; page += 1) {
    if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
      pages.push(page);
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis");
    }
  }

  return (
    <nav className="pagination" aria-label="Paginação dos produtos">
      <button type="button" onClick={() => onChange(currentPage - 1)} disabled={currentPage === 1}>
        <ChevronLeft aria-hidden="true" />
      </button>
      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span className="pagination__ellipsis" key={`ellipsis-${index}`}>…</span>
        ) : (
          <button
            type="button"
            className={page === currentPage ? "pagination__page pagination__page--active" : "pagination__page"}
            onClick={() => onChange(page)}
            key={page}
          >
            {page}
          </button>
        ),
      )}
      <button type="button" onClick={() => onChange(currentPage + 1)} disabled={currentPage === totalPages}>
        <ChevronRight aria-hidden="true" />
      </button>
    </nav>
  );
}
