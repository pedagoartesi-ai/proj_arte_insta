import { NextResponse } from "next/server";

type Payload = {
  subject?: string;
  message?: string;
  email?: string;
  whatsapp?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Payload | null;
  const subject = body?.subject?.trim() || "Contato pelo site Artes que Ensinam";
  const message = body?.message?.trim() ?? "";
  const email = body?.email?.trim() ?? "";
  const whatsapp = body?.whatsapp?.trim() ?? "";

  if (!message || !email || !email.includes("@")) {
    return NextResponse.json({ error: "invalid_payload", message: "Preencha um email válido e a mensagem." }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY ?? process.env.PROJ_ARTE_RESEND_API_KEY ?? "";
  const resendFrom =
    process.env.RESEND_FROM_EMAIL ??
    process.env.RESEND_FROM ??
    process.env.PROJ_ARTE_RESEND_FROM_EMAIL ??
    "onboarding@resend.dev";
  const resendTo = process.env.RESEND_TO_EMAIL ?? process.env.RESEND_CONTACT_TO_EMAIL ?? process.env.PROJ_ARTE_CONTACT_TO_EMAIL ?? "pedagoartesi@gmail.com";

  if (!resendApiKey) {
    return NextResponse.json({ error: "resend_not_configured", message: "Envio de email não configurado no servidor." }, { status: 503 });
  }

  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const html = `
    <h2>Novo contato pelo site Artes que Ensinam</h2>
    <p><strong>Email do cliente:</strong> ${escapeHtml(email)}</p>
    <p><strong>WhatsApp do cliente:</strong> ${escapeHtml(whatsapp || "Não informado")}</p>
    <p><strong>Assunto:</strong> ${escapeHtml(subject)}</p>
    <p><strong>Mensagem:</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [resendTo],
      subject: `[Site] ${subject}`,
      html,
      reply_to: email,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return NextResponse.json({ error: "send_failed", message: "O Resend recusou o envio.", detail }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
