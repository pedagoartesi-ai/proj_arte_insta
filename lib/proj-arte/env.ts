const fallbackPublicUrl = "https://abc-artes.ias-nexus-automacao.com.br";

export function getPublicUrl() {
  return process.env.PROJ_ARTE_PUBLIC_URL ?? fallbackPublicUrl;
}

export function getContactConfig() {
  const whatsappRaw = process.env.WHATSAPP ?? process.env.PROJ_ARTE_WHATSAPP ?? "";
  const whatsappDigits = whatsappRaw.replace(/\D/g, "");

  return {
    whatsappUrl: whatsappDigits ? `https://wa.me/${whatsappDigits}` : "",
  };
}

export function getSupabaseConfig() {
  const url = process.env.SUPABASE_PROJ_ARTE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_PROJ_ARTE_SERVICE_ROLE_KEY ?? "";
  const bucket = process.env.PROJ_ARTE_STORAGE_BUCKET ?? "projeto-arte-assets";

  return {
    url,
    serviceRoleKey,
    bucket,
    configured: Boolean(url && serviceRoleKey),
  };
}

export function getStripeConfig() {
  return {
    secretKey: process.env.PROJ_ARTE_STRIPE_SECRET_KEY ?? "",
    publishableKey: process.env.NEXT_PUBLIC_PROJ_ARTE_STRIPE_PUBLISHABLE_KEY ?? process.env.PROJ_ARTE_STRIPE_PUBLISHABLE_KEY ?? "",
    webhookSecret: process.env.PROJ_ARTE_STRIPE_WEBHOOK_SECRET ?? "",
    checkoutSuccessUrl:
      process.env.PROJ_ARTE_STRIPE_SUCCESS_URL ?? `${getPublicUrl()}/obrigado`,
    checkoutCancelUrl:
      process.env.PROJ_ARTE_STRIPE_CANCEL_URL ?? `${getPublicUrl()}/carrinho`,
  };
}

export function getAdminConfig() {
  return {
    email:
      process.env.PROJ_ARTE_ADMIN_EMAIL ?? process.env.EMAIL ?? "",
    passwordHash: process.env.PROJ_ARTE_ADMIN_PASSWORD_HASH ?? "",
    passwordPlain:
      process.env.PROJ_ARTE_ADMIN_PASSWORD ?? process.env.SENHA_EMAIL ?? "",
    sessionSecret:
      process.env.PROJ_ARTE_SESSION_SECRET ??
      process.env.PROJ_SCORE_INTERNAL_FUNCTION_TOKEN ??
      "proj-arte-dev-secret",
    sessionTtlSeconds: Number(process.env.PROJ_ARTE_SESSION_TTL_SECONDS ?? 60 * 60 * 24 * 7),
  };
}

export function hasSupabase() {
  return getSupabaseConfig().configured;
}
