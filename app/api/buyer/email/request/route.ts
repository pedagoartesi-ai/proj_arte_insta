import { NextResponse } from "next/server";
import { buyerEmailRequestSchema } from "@/lib/proj-arte/schemas";
import { getSupabaseAdminClient } from "@/lib/proj-arte/supabase";
import {
  buildBuyerVerificationEmail,
  generateBuyerCode,
  hashBuyerCode,
  normalizeBuyerEmail,
  persistBuyerVerification,
} from "@/lib/proj-arte/buyer-verification";

export async function POST(request: Request) {
  try {
    const parsed = buyerEmailRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
    }

    const resendApiKey = process.env.RESEND_API_KEY ?? process.env.PROJ_ARTE_RESEND_API_KEY ?? "";
    const resendFrom =
      process.env.RESEND_FROM_EMAIL ??
      process.env.RESEND_FROM ??
      process.env.PROJ_ARTE_RESEND_FROM_EMAIL ??
      "onboarding@resend.dev";
    if (!resendApiKey) {
      return NextResponse.json({ error: "resend_not_configured", message: "Envio de email não configurado no servidor." }, { status: 503 });
    }

    const email = normalizeBuyerEmail(parsed.data.email);
    const code = generateBuyerCode();
    const codeHash = hashBuyerCode(email, code);
    const verification = await persistBuyerVerification(supabase, email, codeHash);
    const { subject, html } = buildBuyerVerificationEmail(code);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [email],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return NextResponse.json({ error: "verification_email_failed", message: "O Resend recusou o envio do código.", detail }, { status: 502 });
    }

    return NextResponse.json({ ok: true, email, verificationId: verification.id, ttlMinutes: 10 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "verification_request_failed",
        message: "Não foi possível gerar ou enviar o código de verificação.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
