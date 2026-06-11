import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')              ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { event_id, user_id } = await req.json();

    if (!event_id || !user_id) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar y marcar claimed = true en una sola operación atómica
    const { data: evento, error } = await supabase
      .from('referral_events')
      .update({ claimed: true, claimed_at: new Date().toISOString() })
      .eq('id', event_id)
      .eq('user_id', user_id)
      .eq('claimed', false)
      .gt('expires_at', new Date().toISOString())
      .select()
      .maybeSingle();

    if (error || !evento) {
      return new Response(JSON.stringify({ error: 'Cupón inválido, ya usado o expirado' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: Deno.env.get('STRIPE_ALIANZA_PRICE_ID')!, quantity: 1 }],
      mode: 'payment',
      success_url: 'https://propotienda.com/alianza?activado=true',
      cancel_url:  'https://propotienda.com/alianza',
      metadata: {
        type:     'alianza_bonus',
        user_id,
        event_id,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});