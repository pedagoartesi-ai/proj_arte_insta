create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null default '',
  activity_type_slug text not null references public.categories(slug) on update cascade,
  price_cents integer not null default 0,
  price_label text,
  pdf_url text,
  cover_image_url text,
  gallery_urls text[] not null default '{}',
  featured boolean not null default false,
  active boolean not null default true,
  checkout_url text,
  stripe_product_id text,
  stripe_price_id text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_checkout_session_id text unique not null,
  stripe_payment_intent_id text,
  status text not null default 'pending',
  customer_email text,
  customer_name text,
  amount_total_cents integer not null default 0,
  currency text not null default 'brl',
  refund_policy text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  stripe_price_id text,
  title text not null,
  quantity integer not null default 1,
  unit_amount_cents integer not null default 0,
  total_amount_cents integer not null default 0,
  pdf_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.stripe_events (
  id uuid primary key default gen_random_uuid(),
  event_id text unique not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  process_error text,
  created_at timestamptz not null default now()
);

create table if not exists public.buyer_email_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.stripe_events enable row level security;
alter table public.buyer_email_verifications enable row level security;

-- Seed inicial para a vitrine e filtros
insert into public.categories (name, slug, description, sort_order, active)
values
  ('Avaliações, sondagens e relatórios', 'avaliacoes-sondagens-relatorios', 'Materiais para diagnóstico, acompanhamento e registro.', 1, true),
  ('Kits sala de aula', 'kits-sala-de-aula', 'Recursos completos para organizar a rotina.', 2, true),
  ('Decoração de sala - Volta às aulas', 'decoracao-sala-volta-as-aulas', 'Painéis e decorações para a primeira semana.', 3, true),
  ('Apostilas', 'apostilas', 'Sequências didáticas e cadernos organizados.', 4, true),
  ('Alfabetização', 'alfabetizacao', 'Leitura, escrita e consciência fonológica.', 5, true),
  ('Datas comemorativas', 'datas-comemorativas', 'Atividades para festas, murais e lembranças.', 6, true),
  ('SAEB', 'saeb', 'Materiais voltados para avaliação e preparação.', 7, true),
  ('Educação Infantil', 'educacao-infantil', 'Propostas lúdicas e pedagógicas para os pequenos.', 8, true),
  ('Kits/Combos', 'kits-combos', 'Combos com melhor custo-benefício.', 9, true),
  ('3º ao 5º ano', 'terceiro-ao-quinto-ano', 'Atividades alinhadas aos anos finais do fundamental.', 10, true),
  ('Leitura-Escrita', 'leitura-escrita', 'Produções focadas em leitura e escrita.', 11, true),
  ('Matemática', 'matematica', 'Recursos para contagem, operações e raciocínio.', 12, true),
  ('Recursos na lata', 'recursos-na-lata', 'Atividades práticas para usar sem complicação.', 13, true),
  ('Sequência didática', 'sequencia-didatica', 'Projetos com começo, meio e fim bem organizados.', 14, true),
  ('Lembrancinhas', 'lembrancinhas', 'Materiais delicados para datas especiais.', 15, true),
  ('Painel', 'painel', 'Painéis prontos para imprimir e montar.', 16, true)
on conflict (slug) do nothing;

insert into public.products (slug, title, description, activity_type_slug, price_cents, price_label, featured, active, sort_order)
values
  ('kit-maio-laranja', 'Kit Completo Maio Laranja com Plano de Aula', 'Material pedagógico pronto para imprimir, montar e usar na sala de aula.', 'datas-comemorativas', 1000, 'R$ 10,00', true, true, 1),
  ('moldura-bambole-maio-laranja', 'Moldura para Fotos no Bambolê – Maio Laranja', 'Arquivo visual para montar exposição ou ação temática.', 'painel', 600, 'R$ 6,00', false, true, 2),
  ('alfabetizacao-base', 'Sequência de Alfabetização', 'Atividades de leitura e escrita em PDF para dias corridos.', 'alfabetizacao', 1290, 'R$ 12,90', true, true, 3),
  ('planner-da-professora', 'Planner da Professora', 'Organização simples para rotina, planejamento e acompanhamento.', 'kits-sala-de-aula', 1000, 'R$ 10,00', false, true, 4)
on conflict (slug) do nothing;
