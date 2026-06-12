// supabase/functions/stripe-webhook/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Webhook de Stripe — maneja referidos + genera código de Propotienda
// ─────────────────────────────────────────────────────────────────────────────
import { serve }         from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient }  from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe            from 'https://esm.sh/stripe@14?target=deno';

const REFERRAL_XP        = 500;
const REFERRAL_CRISTALES = 2000;
const APP_URL            = Deno.env.get('APP_URL') ?? 'https://tu-dominio.com';


// ─── Generador de código (mismo formato que el frontend: TP-99AB-88CD) ────────
function generatePropoCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const n2 = () => String(Math.floor(10 + Math.random() * 89));
  return `TP-${n2()}${seg(2)}-${n2()}${seg(2)}`;
}

// ─── Email template ───────────────────────────────────────────────────────────
const emailTemplate = (nombre: string, loginUrl: string, propoCode: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bienvenido a PROPO-TIENDA</title>
</head>
<body style="margin:0;padding:0;background:#0a0015;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:linear-gradient(135deg,#0d0025,#1a0040);border:1px solid #d4af37;border-radius:16px;overflow:hidden;">
          <!-- HEADER -->
          <tr>
            <td align="center" style="padding:40px 30px 20px;border-bottom:1px solid rgba(212,175,55,0.3);">
              <div style="font-size:36px;margin-bottom:12px;">🏪</div>
              <h1 style="color:#d4af37;font-size:22px;margin:0;letter-spacing:3px;">PROPOTIENDA</h1>
              <p style="color:rgba(212,175,55,0.6);font-size:11px;letter-spacing:4px;margin:6px 0 0;">TIENDA EXCLUSIVA · SOLO FUNDADORES</p>
            </td>
          </tr>
          <!-- BODY -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="color:rgba(220,210,255,0.85);font-size:16px;line-height:1.7;margin:0 0 24px;">
                Hola <strong style="color:#d4af37;">${nombre}</strong>,<br/>
                ¡Tu pago fue confirmado! Ya eres <strong style="color:#d4af37;">Miembro Fundador Oficial</strong> del Templo del Propósito.
              </p>
              <!-- CÓDIGO -->
              <div style="background:rgba(0,0,0,0.5);border:1.5px solid rgba(212,175,55,0.6);border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                <p style="color:rgba(200,185,240,0.6);font-size:10px;letter-spacing:4px;margin:0 0 10px;">TU CÓDIGO DE ACCESO A LA PROPOTIENDA</p>
                <div style="font-family:'Courier New',monospace;font-size:28px;font-weight:700;color:#ffe066;letter-spacing:4px;">${propoCode}</div>
                <p style="color:rgba(200,185,240,0.5);font-size:10px;margin:10px 0 0;">Guárdalo — lo necesitarás para acceder a la tienda exclusiva</p>
              </div>
              <!-- CTA -->
              <div style="text-align:center;">
                <a href="${loginUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,rgba(212,175,55,0.2),rgba(124,58,237,0.3));border:1px solid rgba(212,175,55,0.5);border-radius:10px;color:#d4af37;text-decoration:none;font-size:12px;letter-spacing:3px;font-family:'Georgia',serif;">
                  ⚔️ IR AL TEMPLO
                </a>
              </div>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:20px;border-top:1px solid rgba(212,175,55,0.15);">
              <p style="color:rgba(212,175,55,0.35);font-size:10px;margin:0;letter-spacing:2px;">TEMPLO DEL PROPÓSITO · MIEMBROS FUNDADORES</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ─── MAIN ─────────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature', { status: 400 });
  }

  // ── Inicializar clientes ──────────────────────────────────────────────────
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')        ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // ── Verificar firma de Stripe ─────────────────────────────────────────────
  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
    );
  } catch (err) {
    console.error('Webhook signature error:', err);
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  // ── Solo nos interesa checkout.session.completed ──────────────────────────
  // ── Eventos de suscripción ────────────────────────────────────────────────
  if (event.type === 'invoice.paid') {
    try {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id ?? null;
      const subscriptionId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id ?? null;

      if (customerId) {
        // Buscar usuario por stripe_customer_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, membership_months_paid')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (profile) {
          const monthsPaid = (profile.membership_months_paid ?? 0) + 1;
          // Mes 7+ → plan graduado ($4/mes) — solo log, Stripe maneja el precio
          console.log(`[membership] user=${profile.id} months_paid=${monthsPaid}`);

          // Extender membresía +1 mes
          await extenderMembresia(supabase, profile.id);

          await supabase
            .from('profiles')
            .update({
              membership_status:      'active',
              membership_months_paid: monthsPaid,
              paused_at:              null,
              stripe_subscription_id: subscriptionId,
            })
            .eq('id', profile.id);
        }
      }
    } catch (err) {
      console.error('[membership] Error en invoice.paid:', err);
    }
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (event.type === 'invoice.payment_failed' ||
      event.type === 'customer.subscription.deleted') {
    try {
      const obj = event.data.object as any;
      const customerId = typeof obj.customer === 'string'
        ? obj.customer
        : obj.customer?.id ?? null;

      if (customerId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, membership_status')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (profile && profile.membership_status !== 'paused') {
          await supabase
            .from('profiles')
            .update({
              membership_status: 'paused',
              paused_at:         new Date().toISOString(),
            })
            .eq('id', profile.id);

          console.log(`[membership] Protocolo en pausa para user=${profile.id}`);
        }
      }
    } catch (err) {
      console.error('[membership] Error en payment_failed/subscription_deleted:', err);
    }
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata ?? {};

  const userId       = metadata.user_id    ?? null;
  const referralCode = metadata.referral_code ?? null;
  const sessionId    = session.id;
  const userEmail    = session.customer_details?.email ?? metadata.email ?? null;
  const userName     = session.customer_details?.name  ?? 'Fundador';
  const amountPaid   = session.amount_total ?? 0;
  const currency     = session.currency    ?? 'usd';

  console.log(`[webhook] checkout.session.completed | session=${sessionId} | user=${userId} | referral=${referralCode}`);

  // ── 1. Generar y guardar el código de Propotienda ─────────────────────────
  let propoCode = generatePropoCode();

  // Garantizar que el código sea único (reintenta hasta 5 veces)
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase
      .from('access_codes')
      .select('id')
      .eq('code', propoCode)
      .maybeSingle();

    if (!existing) break; // código disponible
    propoCode = generatePropoCode();
  }

  const { error: insertError } = await supabase
    .from('access_codes')
    .insert({
      code:                  propoCode,
      stripe_session_id:     sessionId,
      stripe_payment_intent: typeof session.payment_intent === 'string'
                               ? session.payment_intent
                               : session.payment_intent?.id ?? null,
      user_id:               userId,
      user_email:            userEmail,
      amount_paid:           amountPaid,
      currency:              currency,
      is_used:               false,
      created_at:            new Date().toISOString(),
    });

  if (insertError) {
    console.error('[webhook] Error insertando access_code:', insertError);
    // No retornamos error — dejamos que siga con el flujo de referidos
  } else {
    console.log(`[webhook] Código generado: ${propoCode} para session ${sessionId}`);
  }

  // ── 2. Lógica de referidos (tu código existente, sin cambios) ─────────────
  if (referralCode && userId) {
    try {
      // Buscar la campaña por cupón
      const { data: campaign } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('stripe_coupon_a', referralCode)
        .eq('is_active', true)
        .maybeSingle();

      if (campaign) {
        const xpReward    = campaign.xp_reward_a    ?? REFERRAL_XP;
        const coinsReward = campaign.coins_reward_a ?? REFERRAL_CRISTALES;

        // Actualizar perfil del comprador
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id:              userId,
            referral_used:   referralCode,
            xp:              supabase.rpc('increment', { row_id: userId, inc: xpReward }),
            cristales:       supabase.rpc('increment', { row_id: userId, inc: coinsReward }),
            updated_at:      new Date().toISOString(),
          }, { onConflict: 'id' });

        if (profileError) {
          console.error('[webhook] Error actualizando perfil:', profileError);
        } else {
          console.log(`[webhook] Referido procesado: +${xpReward} XP, +${coinsReward} cristales para user ${userId}`);
        }
      }
    } catch (refErr) {
      console.error('[webhook] Error en lógica de referidos:', refErr);
    }
  }

  // ── 3. Enviar email de bienvenida con el código ───────────────────────────
  if (userEmail) {
    try {
      const loginUrl = `${APP_URL}/bienvenido?session_id=${sessionId}`;
      const html     = emailTemplate(userName, loginUrl, propoCode);

      await supabase.functions.invoke('send-email', {
        body: {
          to:      userEmail,
          subject: '🏪 Tu código de acceso a la Propotienda — Templo del Propósito',
          html,
        },
      });

      console.log(`[webhook] Email enviado a ${userEmail}`);
    } catch (emailErr) {
      console.error('[webhook] Error enviando email:', emailErr);
      // No es crítico — el código igual quedó guardado en Supabase
    }
  }

  // ── Guardar stripe_customer_id en el perfil ───────────────────────────────
  if (userId && session.customer) {
    const stripeCustomerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer.id;
    await supabase
      .from('profiles')
      .update({
        stripe_customer_id:     stripeCustomerId,
        membership_status:      'active',
        stripe_subscription_id: typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id ?? null,
      })
      .eq('id', userId);
  }

  return new Response(JSON.stringify({ received: true, code: propoCode }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
