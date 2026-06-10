import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { user_id, referral_code, price_id, success_url, cancel_url, mode, use_elements, offer_id, offer_title, metadata, customer_email } = body;

    // ── Modo PaymentIntent (modal in-app) ──────────────────────────
    if (use_elements) {
      const price = await stripe.prices.retrieve(price_id);
      const intent = await stripe.paymentIntents.create({
        amount: price.unit_amount!,
        currency: price.currency,
        metadata: {
          user_id:     user_id || '',
          offer_id:    offer_id || '',
          offer_title: offer_title || '',
          ...(metadata ?? {}),
        },
      });
      return new Response(JSON.stringify({ clientSecret: intent.client_secret }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // ── Modo Checkout Session (redirect normal) ────────────────────
    const session = await stripe.checkout.sessions.create({
      mode: mode || "subscription",
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: success_url || `${req.headers.get("origin")}/bienvenido?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/store`,
      client_reference_id: user_id,
      metadata: {
        user_id,
        referral_code: referral_code || "",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});