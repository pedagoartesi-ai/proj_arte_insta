# Plano de Implementação — Backend Projeto Arte

## Decisões confirmadas
- Admin único (sem multi-admin)
- Login com confirmação de email
- Comprador com acesso direto à página de compras
- Ao fim de cada etapa: commit GitHub + deploy Vercel

## Estrutura de arquivos (alvo)

```txt
projeto_arte_insta/
├─ app/
│  ├─ page.tsx
│  ├─ admin/
│  │  └─ page.tsx
│  ├─ minhas-compras/
│  │  └─ page.tsx
│  └─ api/
│     ├─ categories/route.ts
│     ├─ products/route.ts
│     ├─ admin/
│     │  ├─ login/route.ts
│     │  ├─ verify-email/route.ts
│     │  ├─ logout/route.ts
│     │  ├─ me/route.ts
│     │  ├─ products/route.ts
│     │  ├─ products/[id]/route.ts
│     │  └─ uploads/sign/route.ts
│     ├─ stripe/
│     │  ├─ checkout/route.ts
│     │  └─ webhook/route.ts
│     └─ buyer/
│        ├─ access/request/route.ts
│        ├─ access/verify/route.ts
│        └─ purchases/route.ts
├─ lib/proj-arte/
│  ├─ auth.ts
│  ├─ catalog.ts
│  ├─ env.ts
│  ├─ schemas.ts
│  ├─ store.ts
│  ├─ supabase.ts
│  ├─ tokens.ts
│  └─ types.ts
├─ supabase/
│  └─ schema.sql
├─ docs/backend/plano-implementacao.md
└─ .env.example
```

## Etapas

### Etapa 1 — Admin único + confirmação de email
- login email/senha
- OTP/email code
- sessão segura (cookie httpOnly)
- bloquear multi-admin

**Commit:** `feat(auth): single admin with email confirmation`

---

### Etapa 2 — Catálogo com filtro e paginação
- categoria vira filtro por tipo de atividade
- limite por página
- paginação funcional
- preview horizontal (arrastar)

**Commit:** `feat(catalog): activity filter pagination and horizontal preview`

---

### Etapa 3 — CRUD admin de PDF/preço/imagens
- criar/editar/excluir produtos
- upload assinado
- preço e metadados de venda

**Commit:** `feat(admin): product CRUD with pdf image and pricing`

---

### Etapa 4 — Stripe
- checkout session
- webhook assinado
- persistência de pedido

**Commit:** `feat(payments): stripe checkout and signed webhook`

---

### Etapa 5 — Acesso comprador
- link direto por email/token
- página minhas-compras com materiais pagos

**Commit:** `feat(buyer): direct access to purchased materials`

---

## Regra operacional obrigatória
Para cada etapa:
1. Implementar
2. `pnpm build`
3. Commit
4. Push GitHub
5. Deploy Vercel
6. Validar em produção
