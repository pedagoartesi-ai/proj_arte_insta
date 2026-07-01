import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import Stripe from "https://esm.sh/stripe@18.5.0?target=denonext";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const resendFrom = Deno.env.get("RESEND_FROM_EMAIL") ?? "onboarding@resend.dev";

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !supabaseServiceRole) {
    return new Response(JSON.stringify({ error: "missing_env" }), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2025-04-30.basil" });
  const supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const signature = req.headers.get("stripe-signature") ?? "";
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (error) {
    return new Response(JSON.stringify({ error: "invalid_signature", detail: String(error) }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const { data: insertedEvent, error: eventInsertError } = await supabase
    .from("stripe_events")
    .insert({ event_id: event.id, event_type: event.type, payload: event })
    .select("id")
    .maybeSingle();

  if (eventInsertError) {
    const isDuplicate = (eventInsertError as { code?: string }).code === "23505";
    if (isDuplicate) {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "event_insert_failed", detail: eventInsertError.message }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
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

      const pdfLinks = orderItems.filter((item) => item.pdf_url).map((item) => item.pdf_url as string);
      if (orderRow.customer_email && pdfLinks.length && resendApiKey) {
        const html = `
          <h2>Pagamento confirmado ✅</h2>
          <p>Obrigado pela sua compra! Seguem os links dos seus materiais em PDF:</p>
          <ul>
            ${pdfLinks.map((link) => `<li><a href="${link}">${link}</a></li>`).join("")}
          </ul>
          <p>Política de reembolso: apenas se houver falha no envio do material.</p>
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

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
      status: 200,
    });
  } catch (error) {
    await supabase
      .from("stripe_events")
      .update({ process_error: String(error) })
      .eq("id", insertedEvent?.id);

    return new Response(JSON.stringify({ error: "webhook_processing_failed", detail: String(error) }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
      status: 500,
    });
  }
});
