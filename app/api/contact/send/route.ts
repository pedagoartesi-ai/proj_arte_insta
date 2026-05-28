import { NextResponse } from "next/server";

type Payload = {
  subject?: string;
  message?: string;
  email?: string;
  whatsapp?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Payload | null;
  const subject = body?.subject?.trim() ?? "";
  const message = body?.message?.trim() ?? "";
  const email = body?.email?.trim() ?? "";
  const whatsapp = body?.whatsapp?.trim() ?? "";

  if (!subject || !message || !email || !whatsapp) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY ?? process.env.PROJ_ARTE_RESEND_API_KEY ?? "";
  const resendFrom = process.env.RESEND_FROM_EMAIL ?? process.env.PROJ_ARTE_RESEND_FROM_EMAIL ?? "";
  const resendTo = process.env.RESEND_TO_EMAIL ?? process.env.PROJ_ARTE_CONTACT_TO_EMAIL ?? "pedagoartesi@gmail.com";

  if (!resendApiKey || !resendFrom) {
    return NextResponse.json({ error: "resend_not_configured" }, { status: 503 });
  }

  const html = `
    <h2>Novo contato pelo site Artes que Ensinam</h2>
    <p><strong>Email do cliente:</strong> ${email}</p>
    <p><strong>WhatsApp do cliente:</strong> ${whatsapp}</p>
    <p><strong>Assunto:</strong> ${subject}</p>
    <p><strong>Mensagem:</strong></p>
    <p>${message.replace(/\n/g, "<br />")}</p>
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
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return NextResponse.json({ error: "send_failed", detail }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

