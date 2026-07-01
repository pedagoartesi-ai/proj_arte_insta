import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getStripeConfig } from "@/lib/proj-arte/env";
import { getSupabaseAdminClient } from "@/lib/proj-arte/supabase";

type ProductRow = {
  id: string;
  title: string;
  pdf_url: string | null;
};

function getLineItemPriceId(item: Stripe.LineItem) {
  return typeof item.price === "string" ? item.price : item.price?.id ?? null;
}

function getLineItemProductId(item: Stripe.LineItem) {
  if (typeof item.price === "string") return null;
  const productIdFromPrice = item.price?.metadata?.productId;
  if (productIdFromPrice) return productIdFromPrice;

  const stripeProduct = item.price?.product;
  if (!stripeProduct || typeof stripeProduct === "string") return null;
  if ("deleted" in stripeProduct && stripeProduct.deleted) return null;
  return stripeProduct.metadata?.productId ?? null;
}

export async function POST(request: Request) {
  const config = getStripeConfig();
  if (!config.secretKey || !config.webhookSecret) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = (await headers()).get("stripe-signature") ?? "";
  const stripe = new Stripe(config.secretKey, { apiVersion: "2026-04-22.dahlia" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, config.webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: "invalid_signature", detail: String(error) }, { status: 400 });
  }

  const { data: insertedEvent, error: eventInsertError } = await supabase
    .from("stripe_events")
    .insert({ event_id: event.id, event_type: event.type, payload: event })
    .select("id")
    .maybeSingle();

  if (eventInsertError) {
    const isDuplicate = (eventInsertError as { code?: string }).code === "23505";
    if (isDuplicate) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    return NextResponse.json({ error: "event_insert_failed", detail: eventInsertError.message }, { status: 500 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 100,
        expand: ["data.price.product"],
      });
      const productIds = lineItems.data
        .map(getLineItemProductId)
        .filter(Boolean) as string[];

      const { data: productRows } = productIds.length
        ? await supabase
            .from("products")
            .select("id,title,pdf_url")
            .in("id", productIds)
        : { data: [] as ProductRow[] };

      const productById = new Map<string, ProductRow>();
      for (const row of productRows ?? []) {
        productById.set(row.id, row);
      }

      const { data: orderRow, error: orderError } = await supabase
        .from("orders")
        .upsert(
          {
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
            status: session.payment_status ?? "paid",
            customer_email: session.customer_details?.email ?? session.customer_email ?? null,
            customer_name: session.customer_details?.name ?? null,
            amount_total_cents: session.amount_total ?? 0,
            currency: session.currency ?? "brl",
            refund_policy: "Reembolso apenas se houver falha no envio do material.",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_checkout_session_id" },
        )
        .select("id,customer_email")
        .single();

      if (orderError || !orderRow) {
        throw new Error(`order_upsert_failed: ${orderError?.message ?? "unknown"}`);
      }

      const orderItems = lineItems.data.map((item) => {
        const priceId = getLineItemPriceId(item);
        const productId = getLineItemProductId(item);
        const product = productId ? productById.get(productId) : undefined;
        return {
          order_id: orderRow.id,
          product_id: product?.id ?? null,
          stripe_price_id: priceId,
          title: product?.title ?? item.description ?? "Material em PDF",
          quantity: item.quantity ?? 1,
          unit_amount_cents: item.price?.unit_amount ?? 0,
          total_amount_cents: item.amount_total ?? 0,
          pdf_url: product?.pdf_url ?? null,
        };
      });

      await supabase.from("order_items").delete().eq("order_id", orderRow.id);
      if (orderItems.length) {
        const { error: orderItemsError } = await supabase.from("order_items").insert(orderItems);
        if (orderItemsError) {
          throw new Error(`order_items_insert_failed: ${orderItemsError.message}`);
        }
      }

      const resendApiKey = process.env.RESEND_API_KEY ?? process.env.PROJ_ARTE_RESEND_API_KEY ?? "";
      const resendFrom = process.env.RESEND_FROM_EMAIL ?? process.env.PROJ_ARTE_RESEND_FROM_EMAIL ?? "";
      const pdfLinks = orderItems.filter((item) => item.pdf_url).map((item) => item.pdf_url as string);

      if (orderRow.customer_email && pdfLinks.length && resendApiKey && resendFrom) {
        const html = `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#30252d">
            <h2>Pagamento confirmado ✅</h2>
            <p>Obrigado pela sua compra! Seguem os links dos seus materiais em PDF:</p>
            <ul>
              ${pdfLinks.map((link) => `<li><a href="${link}">${link}</a></li>`).join("")}
            </ul>
            <p>Política de reembolso: apenas se houver falha no envio do material.</p>
          </div>
        `;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [orderRow.customer_email],
            subject: "Seu material em PDF - Artes que Ensinam",
            html,
          }),
        });
      }
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await supabase
        .from("orders")
        .upsert(
          {
            stripe_checkout_session_id: session.id,
            status: "failed",
            customer_email: session.customer_details?.email ?? session.customer_email ?? null,
            amount_total_cents: session.amount_total ?? 0,
            currency: session.currency ?? "brl",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_checkout_session_id" },
        );
    }

    await supabase
      .from("stripe_events")
      .update({ processed_at: new Date().toISOString(), process_error: null })
      .eq("id", insertedEvent?.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    await supabase
      .from("stripe_events")
      .update({ process_error: String(error) })
      .eq("id", insertedEvent?.id);

    return NextResponse.json({ error: "webhook_processing_failed", detail: String(error) }, { status: 500 });
  }
}
