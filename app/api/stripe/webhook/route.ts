import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getStripeConfig } from "@/lib/proj-arte/env";
import { getSupabaseAdminClient } from "@/lib/proj-arte/supabase";

export async function POST(request: Request) {
  const config = getStripeConfig();
  if (!config.secretKey || !config.webhookSecret) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      await supabase.from("stripe_events").insert({
        event_id: event.id,
        event_type: event.type,
        payload: event,
      });
      await supabase.from("orders").upsert({
        stripe_checkout_session_id: session.id,
        status: session.payment_status ?? "paid",
        customer_email: session.customer_details?.email ?? session.customer_email ?? null,
        amount_total_cents: session.amount_total ?? 0,
        currency: session.currency ?? "brl",
      });
    }
  }

  return NextResponse.json({ received: true });
}
