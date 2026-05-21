import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  BadgeCheck,
  BookOpen,
  CalendarHeart,
  Camera,
  FileText,
  GraduationCap,
  Heart,
  Home,
  LayoutGrid,
  Mail,
  MessageCircle,
  Palette,
  Printer,
  Scissors,
  Send,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  ThumbsUp,
  UserRound,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type SocialLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type Category = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type Product = {
  title: string;
  category: string;
  priceLabel: string;
  checkoutUrl?: string;
  image?: string;
  featured?: boolean;
  accent: "rose" | "sun" | "sky" | "mint";
  icon: LucideIcon;
};

const email = "pedagoartesi@gmail.com";

const navItems: NavItem[] = [
  { label: "Início", href: "#inicio", icon: Home },
  { label: "Contato", href: "#contato", icon: Mail },
  { label: "Sobre", href: "#sobre", icon: UserRound },
  { label: "Categorias", href: "#categorias", icon: LayoutGrid },
  { label: "Carrinho", href: "#carrinho", icon: ShoppingCart },
];

const socialLinks: SocialLink[] = [
  { label: "Facebook", href: "#", icon: ThumbsUp },
  { label: "WhatsApp", href: "#", icon: MessageCircle },
  { label: "Instagram", href: "#", icon: Camera },
];

const categories: Category[] = [
  {
    title: "Alfabetização",
    description: "Atividades para leitura, escrita e primeiras descobertas.",
    icon: BookOpen,
  },
  {
    title: "Datas comemorativas",
    description: "Artes prontas para projetos, murais e lembrancinhas.",
    icon: CalendarHeart,
  },
  {
    title: "Rotina escolar",
    description: "Recursos para organizar a sala e ganhar tempo.",
    icon: BadgeCheck,
  },
  {
    title: "Jogos e recortes",
    description: "PDFs lúdicos para imprimir, montar e encantar.",
    icon: Scissors,
  },
];

const products: Product[] = [
  {
    title: "Kit Boas-vindas Criativo",
    category: "Rotina escolar",
    priceLabel: "R$ 9,90",
    accent: "rose",
    icon: Sparkles,
    featured: true,
  },
  {
    title: "Sequência de Alfabetização",
    category: "Alfabetização",
    priceLabel: "R$ 12,00",
    accent: "sky",
    icon: BookOpen,
  },
  {
    title: "Painel Datas com Carinho",
    category: "Datas comemorativas",
    priceLabel: "R$ 8,50",
    accent: "sun",
    icon: CalendarHeart,
  },
  {
    title: "Jogo Recorte e Aprenda",
    category: "Jogos e recortes",
    priceLabel: "R$ 7,90",
    accent: "mint",
    icon: Scissors,
  },
  {
    title: "Planner da Professora",
    category: "Rotina escolar",
    priceLabel: "R$ 10,00",
    accent: "rose",
    icon: FileText,
  },
  {
    title: "Atividades Prontas em PDF",
    category: "Alfabetização",
    priceLabel: "R$ 6,90",
    accent: "sky",
    icon: Printer,
  },
  {
    title: "Cartazes para Sala de Aula",
    category: "Rotina escolar",
    priceLabel: "R$ 8,00",
    accent: "sun",
    icon: Palette,
  },
  {
    title: "Combo Ideias que Ensinam",
    category: "Kits e combos",
    priceLabel: "R$ 15,00",
    accent: "mint",
    icon: Star,
    featured: true,
  },
];

export default function HomePage() {
  return (
    <>
      <main>
        <section className="first-fold" id="inicio" aria-label="Artes que Ensinam">
          <SiteHeader />
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

        <section className="intro-strip" aria-label="Destaques dos materiais">
          <div className="container intro-strip__grid">
            <Feature icon={ArrowDownToLine} title="Download imediato" />
            <Feature icon={Printer} title="Pronto para imprimir" />
            <Feature icon={FileText} title="Arquivos em PDF" />
            <Feature icon={Heart} title="Feito por professora" />
          </div>
        </section>

        <section className="section section--light" id="categorias">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">Categorias</span>
              <h2>Materiais para deixar a rotina mais leve</h2>
              <p>
                Recursos pedagógicos pensados para professores que precisam de
                praticidade, beleza e propósito na sala de aula.
              </p>
            </div>

            <div className="category-grid">
              {categories.map((category) => (
                <article className="category-item" key={category.title}>
                  <category.icon aria-hidden="true" />
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section products-section" id="produtos">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">Vitrine</span>
              <h2>Nossos produtos</h2>
              <p>
                Cards demonstrativos preparados para receber fotos, preços finais e
                links de checkout da Kiwify quando estiverem prontos.
              </p>
            </div>

            <div className="products-grid">
              {products.map((product) => (
                <ProductCard product={product} key={product.title} />
              ))}
            </div>
          </div>
        </section>

        <section className="section about-section" id="sobre">
          <div className="container about-layout">
            <div className="about-copy">
              <span className="eyebrow">Sobre</span>
              <h2>Professora Simone Pereira Lima</h2>
              <p>
                Simone é professora e pedagoga, apaixonada por criar materiais que
                ajudam educadores a transformar planejamento em experiências
                lúdicas, afetivas e significativas.
              </p>
              <p>
                A proposta da Artes que Ensinam é reunir arquivos em PDF prontos
                para imprimir, com visual acolhedor e uso simples no dia a dia da
                sala de aula.
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
          <div className="container contact-layout">
            <div>
              <span className="eyebrow">Contato</span>
              <h2>Fale com a Simone</h2>
              <p>
                Os canais sociais já ficam reservados no layout. Quando os links
                reais chegarem, basta trocar os placeholders.
              </p>
            </div>
            <div className="contact-actions">
              <a className="contact-card" href={`mailto:${email}`}>
                <Mail aria-hidden="true" />
                <span>{email}</span>
              </a>
              <a className="contact-card" href="#" aria-label="Contato pelo WhatsApp">
                <MessageCircle aria-hidden="true" />
                <span>Suporte pelo WhatsApp</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="topbar">
        <div className="container topbar__inner">
          <a href={`mailto:${email}`}>
            <Mail aria-hidden="true" />
            {email}
          </a>
          <a href="#">
            <MessageCircle aria-hidden="true" />
            Suporte WhatsApp
          </a>
          <nav className="social-mini" aria-label="Redes sociais">
            {socialLinks.map((social) => (
              <a href={social.href} aria-label={social.label} key={social.label}>
                <social.icon aria-hidden="true" />
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="brand-row">
        <div className="container brand-row__inner">
          <a className="brand-mark" href="#inicio" aria-label="Artes que Ensinam">
            <span className="brand-mark__abc">ABC</span>
            <span className="brand-mark__script">Artes que Ensinam</span>
            <span className="brand-mark__byline">por Simone Pereira Lima</span>
          </a>
          <a className="primary-cta" href="#produtos">
            Ver materiais
            <Send aria-hidden="true" />
          </a>
        </div>
      </div>

      <nav className="main-nav" aria-label="Navegação principal">
        <div className="container main-nav__inner">
          {navItems.map((item) => (
            <a href={item.href} key={item.label} className="nav-tile">
              <item.icon aria-hidden="true" />
              <span>{item.label}</span>
              {item.label === "Carrinho" ? (
                <strong className="cart-pill" id="carrinho">
                  R$ 0,00 <small>0</small>
                </strong>
              ) : null}
            </a>
          ))}
        </div>
      </nav>

      <div className="download-ribbon">
        Materiais em PDF prontos para imprimir
      </div>
    </header>
  );
}

function Feature({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="feature">
      <Icon aria-hidden="true" />
      <span>{title}</span>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const Icon = product.icon;
  const checkoutHref = product.checkoutUrl ?? "#contato";

  return (
    <article className={`product-card product-card--${product.accent}`}>
      <div className="product-preview">
        <div className="product-preview__sheet">
          <Icon aria-hidden="true" />
          <span>{product.category}</span>
          <strong>{product.title}</strong>
        </div>
      </div>
      <div className="product-card__body">
        <span className="product-category">{product.category}</span>
        <h3>{product.title}</h3>
        <p>{product.priceLabel}</p>
        <a
          className="buy-button"
          href={checkoutHref}
          aria-label={`Comprar ${product.title}`}
          data-checkout-placeholder="kiwify"
        >
          Comprar
        </a>
      </div>
      {product.featured ? <span className="featured-badge">Destaque</span> : null}
    </article>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-layout">
        <div className="footer-brand">
          <span className="brand-mark__abc">ABC</span>
          <strong>Artes que Ensinam</strong>
          <p>
            Materiais pedagógicos em PDF para imprimir, criar e ensinar com
            carinho.
          </p>
        </div>

        <div>
          <h2>Links úteis</h2>
          <a href="#inicio">Início</a>
          <a href="#sobre">Sobre</a>
          <a href="#contato">Contato</a>
          <a href="#produtos">Produtos</a>
        </div>

        <div>
          <h2>Categorias</h2>
          {categories.map((category) => (
            <a href="#categorias" key={category.title}>
              {category.title}
            </a>
          ))}
        </div>

        <div>
          <h2>Sociais</h2>
          {socialLinks.map((social) => (
            <a href={social.href} key={social.label}>
              <social.icon aria-hidden="true" />
              {social.label}
            </a>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <span>Copyright © Artes que Ensinam - Simone Pereira Lima</span>
        <span>{email}</span>
      </div>
    </footer>
  );
}
