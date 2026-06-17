import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/lib/proj-arte/store";
import { checkoutSchema } from "@/lib/proj-arte/schemas";
import { getPublicUrl, getStripeConfig } from "@/lib/proj-arte/env";
import { verifyBuyerEmailToken } from "@/lib/proj-arte/buyer-verification";

export async function POST(request: NextRequest) {
  const config = getStripeConfig();
  if (!config.secretKey) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const verification = verifyBuyerEmailToken(parsed.data.buyerEmailVerificationToken, parsed.data.buyerEmail);
  if (!verification.ok) {
    return NextResponse.json({ error: "buyer_email_not_verified", reason: verification.reason }, { status: 401 });
  }

  const catalog = await listProducts({ onlyActive: true, limit: 1000 });
  const catalogMap = new Map(catalog.data.map((item) => [item.id, item]));
  const lineItems: Array<{ price: string; quantity: number }> = [];
  const productRefs: string[] = [];

  for (const item of parsed.data.items) {
    const product = catalogMap.get(item.productId) ??
      catalog.data.find((entry) => entry.slug === item.productId);

    if (!product) {
      return NextResponse.json({ error: "product_not_found", productId: item.productId }, { status: 404 });
    }

    if (!product.stripePriceId) {
      return NextResponse.json({ error: "stripe_price_missing", productId: item.productId }, { status: 409 });
    }

    lineItems.push({ price: product.stripePriceId, quantity: item.quantity });
    productRefs.push(product.id);
  }

  const stripe = new Stripe(config.secretKey, { apiVersion: "2026-04-22.dahlia" });
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ui_mode: "embedded_page",
    payment_method_types: ["card", "pix"],
    line_items: lineItems,
    customer_email: parsed.data.buyerEmail,
    return_url:
      parsed.data.returnUrl ?? `${getPublicUrl()}/obrigado?session_id={CHECKOUT_SESSION_ID}`,
    redirect_on_completion: "if_required",
    metadata: {
      productIds: productRefs.join(","),
      buyerEmail: parsed.data.buyerEmail,
    },
  });

  return NextResponse.json({ clientSecret: session.client_secret, id: session.id });
}
