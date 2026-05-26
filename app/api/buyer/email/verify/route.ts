import { NextResponse } from "next/server";
import { buyerEmailVerifySchema } from "@/lib/proj-arte/schemas";
import { getSupabaseAdminClient } from "@/lib/proj-arte/supabase";
import {
  createBuyerEmailToken,
  getLatestBuyerVerification,
  hashBuyerCode,
  markBuyerVerificationAsVerified,
  normalizeBuyerEmail,
} from "@/lib/proj-arte/buyer-verification";

export async function POST(request: Request) {
  const parsed = buyerEmailVerifySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  const email = normalizeBuyerEmail(parsed.data.email);
  const verification = await getLatestBuyerVerification(supabase, email);
  if (!verification) {
    return NextResponse.json({ error: "code_not_found" }, { status: 404 });
  }

  if (Date.parse(verification.expires_at) < Date.now()) {
    return NextResponse.json({ error: "code_expired" }, { status: 410 });
  }

  const expectedHash = hashBuyerCode(email, parsed.data.code);
  if (expectedHash !== verification.code_hash) {
    await supabase
      .from("buyer_email_verifications")
      .update({ attempts: (verification.attempts ?? 0) + 1 })
      .eq("id", verification.id);

    return NextResponse.json({ error: "code_invalid" }, { status: 401 });
  }

  const verified = await markBuyerVerificationAsVerified(supabase, verification.id);
  const token = createBuyerEmailToken({
    email,
    verificationId: verified.id,
    verifiedAt: verified.verified_at ?? new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, email, token: token.token, expiresAt: token.expiresAt });
}
