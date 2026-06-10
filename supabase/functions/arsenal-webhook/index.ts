import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-04-10' });
const webhookSecret = Deno.env.get('STRIPE_ARSENAL_WEBHOOK_SECRET')!;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  const body      = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const offerId = session.metadata?.arsenal_offer_id ?? '';

    // Determinar plan
    const plan = offerId === '077216b1-0074-43d3-a680-ae018275eade' ? 'elite' : 'basic';

    const email = session.customer_email ?? session.customer_details?.email ?? '';

    if (email && session.id) {
      await supabase.from('arsenal_purchases').upsert({
        email,
        plan,
        stripe_session_id: session.id,
      }, { onConflict: 'stripe_session_id' });
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});