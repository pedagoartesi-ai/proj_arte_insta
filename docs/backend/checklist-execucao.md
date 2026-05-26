# Checklist de Execução — Projeto Arte

## Objetivo
Fechar o fluxo de compra em página própria, com Stripe, Resend e entrega de PDF por email.

## Etapas

### 1) Catálogo e filtros
- [ ] Carregar categorias reais
- [ ] Filtrar produtos por categoria
- [ ] Manter paginação/organização da vitrine
- [ ] Validar layout responsivo

### 2) Verificação de email do comprador
- [ ] Solicitar código por email via Resend
- [ ] Validar código antes de liberar a compra
- [ ] Guardar token de verificação temporário
- [ ] Bloquear checkout sem email verificado

### 3) Checkout embutido
- [ ] Criar sessão Stripe em modo embedded
- [ ] Renderizar checkout na própria página
- [ ] Evitar redirect externo como fluxo principal
- [ ] Manter carrinho com múltiplos itens

### 4) Webhook e entrega
- [ ] Processar `checkout.session.completed`
- [ ] Persistir pedido e itens
- [ ] Enviar PDF por email com Resend
- [ ] Registrar eventos do Stripe

### 5) Finalização
- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] Teste ponta a ponta
- [ ] Desativar cron de acompanhamento
- [ ] Entrega final

## Regra operacional
Nada é considerado pronto antes do teste fim a fim em ambiente real ou validado pelo menos com build + inspeção do fluxo completo.
