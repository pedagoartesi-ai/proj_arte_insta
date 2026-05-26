# Checklist de Execução — Projeto Arte

## Objetivo
Fechar o fluxo de compra em página própria, com Stripe, Resend e entrega de PDF por email.

## Etapas

### 1) Catálogo e filtros
- [x] Carregar categorias reais
- [x] Filtrar produtos por categoria
- [x] Manter paginação/organização da vitrine
- [x] Validar layout responsivo

### 2) Verificação de email do comprador
- [x] Solicitar código por email via Resend
- [x] Validar código antes de liberar a compra
- [x] Guardar token de verificação temporário
- [x] Bloquear checkout sem email verificado

### 3) Checkout embutido
- [x] Criar sessão Stripe em modo embedded
- [x] Renderizar checkout na própria página
- [x] Evitar redirect externo como fluxo principal
- [x] Manter carrinho com múltiplos itens

### 4) Webhook e entrega
- [x] Processar `checkout.session.completed`
- [x] Persistir pedido e itens
- [x] Enviar PDF por email com Resend
- [x] Registrar eventos do Stripe

### 5) Finalização
- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] Teste ponta a ponta
- [ ] Desativar cron de acompanhamento
- [ ] Entrega final

## Regra operacional
Nada é considerado pronto antes do teste fim a fim em ambiente real ou validado pelo menos com build + inspeção do fluxo completo.
