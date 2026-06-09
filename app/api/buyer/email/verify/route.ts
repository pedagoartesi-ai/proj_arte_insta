import { NextResponse } from "next/server";
import { buyerEmailVerifySchema } from "@/lib/proj-arte/schemas";
import {
  createBuyerEmailToken,
  normalizeBuyerEmail,
  verifyBuyerVerificationRequestToken,
} from "@/lib/proj-arte/buyer-verification";

export async function POST(request: Request) {
  const parsed = buyerEmailVerifySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const email = normalizeBuyerEmail(parsed.data.email);

  const verification = verifyBuyerVerificationRequestToken(parsed.data.requestToken, email, parsed.data.code);
  if (!verification.ok) {
    const status = verification.reason === "expired" ? 410 : 401;
    return NextResponse.json({ error: "code_invalid", reason: verification.reason }, { status });
  }

  const token = createBuyerEmailToken({
    email,
    verificationId: verification.payload.id,
    verifiedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, email, token: token.token, expiresAt: token.expiresAt });
}
