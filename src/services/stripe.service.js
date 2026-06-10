const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function createCheckoutSession({ userId, referralCode, priceId }) {
  const res = await fetch(`${FUNCTIONS_URL}/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({
      user_id: userId,
      referral_code: referralCode || '',
      price_id: priceId || '',
    }),
  });

  const data = await res.json();
  if (data.url) window.location.href = data.url;
  else throw new Error(data.error || 'Error al crear sesión');
}

export async function createArsenalCheckout({ plan, userEmail }) {
  const OFFER_IDS = {
    basic: 'b18a2303-5bab-444f-b817-323a4ef6ff11',
    elite: '077216b1-0074-43d3-a680-ae018275eade',
  };
  const PRICE_IDS = {
    basic: 'price_1TgAhpHAhN6AYkd2HLEtBwJX',
    elite: 'price_1TgAj7HAhN6AYkd2iEubRvRU',
  };

  const res = await fetch(`${FUNCTIONS_URL}/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({
      price_id:          PRICE_IDS[plan],
      mode:              'payment',
      customer_email:    userEmail ?? '',
      metadata: {
        arsenal_offer_id: OFFER_IDS[plan],
      },
      success_url: `${window.location.origin}/arsenal-rpg?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${window.location.origin}/arsenal-rpg`,
    }),
  });

  const data = await res.json();
  if (data.url) window.location.href = data.url;
  else throw new Error(data.error || 'Error al crear sesión de Arsenal');
}

export async function getUserReferralCode(supabase, userId) {
  const { data } = await supabase
    .from('referral_codes')
    .select('code')
    .eq('user_id', userId)
    .single();
  return data?.code || null;
}