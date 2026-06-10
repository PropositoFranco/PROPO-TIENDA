const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DEEPSEEK_KEY = Deno.env.get("DEEPSEEK_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { post_id, user_id, body } = await req.json();

    // 1 — Analizar con DeepSeek
    const aiRes = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 100,
        messages: [
          {
            role: "system",
            content: "Eres un moderador de comunidad. Responde SOLO con JSON válido, sin markdown ni explicaciones.",
          },
          {
            role: "user",
            content: `Analiza este mensaje de una comunidad de productividad. Responde SOLO con JSON: {"violation": true/false, "reason": "motivo breve o null"}

Reglas violadas si:
- Promociona servicios, negocios, productos propios o de terceros
- Spam, links externos irrelevantes
- Lenguaje ofensivo o irrespetuoso
- Contenido completamente ajeno a productividad/crecimiento personal

Mensaje: "${body.replace(/"/g, "'").substring(0, 500)}"`,
          },
        ],
      }),
    });

    const aiData = await aiRes.json();
    const rawText = aiData.choices?.[0]?.message?.content || '{"violation":false}';
    const clean = rawText.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    if (!result.violation) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2 — Borrar el post
    await fetch(`${SUPABASE_URL}/rest/v1/community_posts?id=eq.${post_id}`, {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });

    // 3 — Registrar infracción
    await fetch(`${SUPABASE_URL}/rest/v1/feed_infractions`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id, post_id, reason: result.reason, auto_deleted: true }),
    });

    // 4 — Contar infracciones del usuario
    const countRes = await fetch(
      `${SUPABASE_URL}/rest/v1/feed_infractions?user_id=eq.${user_id}&select=id`,
      {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const infractions = await countRes.json();
    const count = infractions.length;

    // 5 — Restringir si tiene 2+ infracciones
    if (count >= 2) {
      const hours = count >= 4 ? 72 : count >= 3 ? 24 : 6;
      const until = new Date(Date.now() + hours * 3600000).toISOString();
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}`, {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ posting_restricted_until: until }),
      });
    }

    return new Response(
      JSON.stringify({ violation: true, reason: result.reason, infractions: count }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});