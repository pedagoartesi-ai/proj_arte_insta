import { createHmac, randomInt, randomUUID, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminConfig } from "./env";

export type BuyerEmailVerificationRow = {
  id: string;
  email: string;
  code_hash: string;
  expires_at: string;
  verified_at: string | null;
  attempts: number | null;
  created_at?: string;
  updated_at?: string;
};

const CODE_TTL_MINUTES = 10;
const TOKEN_TTL_MINUTES = 60;

export function normalizeBuyerEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateBuyerCode() {
  return String(randomInt(100000, 1000000));
}

function secretSeed() {
  return getAdminConfig().sessionSecret || "proj-arte-email-verification-secret";
}

export function hashBuyerCode(email: string, code: string) {
  const payload = `${normalizeBuyerEmail(email)}:${code}:${secretSeed()}`;
  return createHmac("sha256", secretSeed()).update(payload).digest("hex");
}

export function createBuyerEmailToken(input: { email: string; verificationId: string; verifiedAt: string }) {
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();
  const payload = {
    id: input.verificationId,
    email: normalizeBuyerEmail(input.email),
    verifiedAt: input.verifiedAt,
    expiresAt,
    nonce: randomUUID(),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secretSeed()).update(encoded).digest("base64url");
  return { token: `${encoded}.${signature}`, expiresAt };
}

export function createBuyerVerificationRequestToken(input: { email: string; codeHash: string }) {
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();
  const payload = {
    id: randomUUID(),
    email: normalizeBuyerEmail(input.email),
    codeHash: input.codeHash,
    expiresAt,
    nonce: randomUUID(),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secretSeed()).update(encoded).digest("base64url");
  return { token: `${encoded}.${signature}`, id: payload.id, expiresAt };
}

export function verifyBuyerVerificationRequestToken(token: string, expectedEmail: string, code: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return { ok: false as const, reason: "malformed" };

  const expectedSignature = createHmac("sha256", secretSeed()).update(encoded).digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return { ok: false as const, reason: "invalid_signature" };
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
      id: string;
      email: string;
      codeHash: string;
      expiresAt: string;
    };

    if (normalizeBuyerEmail(payload.email) !== normalizeBuyerEmail(expectedEmail)) {
      return { ok: false as const, reason: "email_mismatch" };
    }

    if (Date.parse(payload.expiresAt) < Date.now()) {
      return { ok: false as const, reason: "expired" };
    }

    const expectedHash = hashBuyerCode(expectedEmail, code);
    const expectedHashBuffer = Buffer.from(expectedHash);
    const codeHashBuffer = Buffer.from(payload.codeHash);
    if (expectedHashBuffer.length !== codeHashBuffer.length || !timingSafeEqual(expectedHashBuffer, codeHashBuffer)) {
      return { ok: false as const, reason: "invalid_code" };
    }

    return { ok: true as const, payload };
  } catch {
    return { ok: false as const, reason: "invalid_payload" };
  }
}

export function verifyBuyerEmailToken(token: string, expectedEmail: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return { ok: false as const, reason: "malformed" };

  const expectedSignature = createHmac("sha256", secretSeed()).update(encoded).digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return { ok: false as const, reason: "invalid_signature" };
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
      email: string;
      expiresAt: string;
      verifiedAt: string;
      id: string;
    };

    if (normalizeBuyerEmail(payload.email) !== normalizeBuyerEmail(expectedEmail)) {
      return { ok: false as const, reason: "email_mismatch" };
    }

    if (Date.parse(payload.expiresAt) < Date.now()) {
      return { ok: false as const, reason: "expired" };
    }

    return { ok: true as const, payload };
  } catch {
    return { ok: false as const, reason: "invalid_payload" };
  }
}

export function buildBuyerVerificationEmail(code: string) {
  return {
    subject: "Seu código de verificação - Artes que Ensinam",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#30252d">
        <h2>Confirme seu email</h2>
        <p>Use este código para liberar a compra com segurança:</p>
        <div style="font-size:32px;font-weight:800;letter-spacing:6px;margin:18px 0">${code}</div>
        <p>O código expira em ${CODE_TTL_MINUTES} minutos.</p>
        <p>Se você não pediu esse código, pode ignorar.</p>
      </div>
    `,
  };
}

export function buyerVerificationExpiryMinutes() {
  return CODE_TTL_MINUTES;
}

export function buyerVerificationTokenExpiryMinutes() {
  return TOKEN_TTL_MINUTES;
}

function describeSupabaseError(error: unknown, fallback: string) {
  if (!error) return fallback;
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const details = error as { message?: string; code?: string; details?: string; hint?: string };
    return [details.message, details.code, details.details, details.hint].filter(Boolean).join(" | ") || fallback;
  }
  return String(error);
}

export async function persistBuyerVerification(
  supabase: SupabaseClient,
  email: string,
  codeHash: string,
) {
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("buyer_email_verifications")
    .insert({
      email: normalizeBuyerEmail(email),
      code_hash: codeHash,
      expires_at: expiresAt,
      verified_at: null,
      attempts: 0,
    })
    .select("id,email,code_hash,expires_at,verified_at,attempts")
    .single();

  if (error || !data) {
    throw new Error(describeSupabaseError(error, "buyer_verification_insert_failed"));
  }

  return data as BuyerEmailVerificationRow;
}

export async function getLatestBuyerVerification(supabase: SupabaseClient, email: string) {
  const { data, error } = await supabase
    .from("buyer_email_verifications")
    .select("id,email,code_hash,expires_at,verified_at,attempts")
    .eq("email", normalizeBuyerEmail(email))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as BuyerEmailVerificationRow;
}

export async function markBuyerVerificationAsVerified(
  supabase: SupabaseClient,
  id: string,
) {
  const verifiedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("buyer_email_verifications")
    .update({ verified_at: verifiedAt, updated_at: verifiedAt })
    .eq("id", id)
    .select("id,email,code_hash,expires_at,verified_at,attempts")
    .single();

  if (error || !data) {
    throw new Error(describeSupabaseError(error, "buyer_verification_update_failed"));
  }

  return data as BuyerEmailVerificationRow;
}
