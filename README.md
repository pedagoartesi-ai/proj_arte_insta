# Artes que Ensinam

Landing page em Next.js para a professora e pedagoga Simone Pereira Lima divulgar e vender materiais pedagógicos prontos para impressão em PDF.

O projeto foi criado como front-end inicial. Integrações com Kiwify, Supabase, Resend, webhooks, carrinho real e entrega automática não estão implementadas nesta etapa.

## Stack

- Next.js com App Router
- React
- TypeScript
- CSS global sem framework de UI
- lucide-react para ícones
- pnpm como gerenciador de pacotes

## Como Rodar

Instale as dependências:

```bash
pnpm install
```

Rode o servidor de desenvolvimento:

```bash
pnpm dev
```

Acesse:

```text
http://localhost:3000
```

## Scripts

```bash
pnpm dev
```

Inicia o servidor local de desenvolvimento.

```bash
pnpm build
```

Gera a build de produção e valida TypeScript/Next.js.

```bash
pnpm lint
```

Executa o ESLint.

## Estrutura Principal

```text
app/
  layout.tsx      Metadata, idioma e CSS global
  page.tsx        Landing page, dados estáticos e componentes
  globals.css     Design system, layout e responsividade

public/
  images/
    hero-artes-que-ensinam.png
    simone-pereira-lima.jpg
```

## Conteúdo da Página

A landing contém:

- cabeçalho com e-mail, suporte WhatsApp placeholder e redes sociais;
- logo textual "Artes que Ensinam";
- atalhos: Início, Contato, Sobre, Categorias e Carrinho;
- hero com imagem principal ocupando a primeira dobra;
- seção de diferenciais dos PDFs;
- categorias de materiais;
- vitrine demonstrativa com cards de produtos;
- seção sobre Simone Pereira Lima;
- contato por e-mail e WhatsApp placeholder;
- rodapé com links úteis, categorias e redes sociais.

## Escopo Atual

Implementado:

- layout responsivo desktop/mobile;
- vitrine estática de produtos demonstrativos;
- links sociais como placeholders;
- carrinho apenas visual, com `R$ 0,00` e contador `0`;
- metadata com domínio planejado: `https://abc_artes.ias-nexus-automacao.com.br`.

Fora do escopo desta versão:

- checkout real da Kiwify;
- autenticação;
- APIs;
- Supabase;
- Resend;
- webhooks;
- envio de e-mails;
- carrinho funcional;
- área de membro;
- blog;
- busca.

## Próximos Passos Sugeridos

Quando os dados reais estiverem prontos:

- trocar placeholders de Facebook, WhatsApp e Instagram pelos links oficiais;
- substituir produtos demonstrativos por produtos reais;
- adicionar imagens, preços finais e `checkoutUrl` da Kiwify;
- definir fluxo de confirmação e entrega dos PDFs;
- criar APIs/server actions apenas quando a integração com Supabase, Resend ou automação for iniciada.

## Verificação

Comandos usados para validar o projeto:

```bash
pnpm lint
pnpm build
```

Ambos devem passar antes de publicar ou continuar novas integrações.
