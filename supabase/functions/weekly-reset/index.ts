// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const auth = req.headers.get("x-cron-secret");
    if (auth !== Deno.env.get("CRON_SECRET")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificar si el ciclo expiró
    const { data: comp, error: compErr } = await sb
      .from("competition_settings")
      .select("end_date, is_active, cycle_number")
      .eq("id", "current")
      .single();

    if (compErr || !comp) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "no config" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (!comp.is_active) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "competition not active" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (new Date(comp.end_date) > new Date()) {
      return new Response(
        JSON.stringify({
          skipped: true,
          reason: "not expired yet",
          ends_at: comp.end_date,
          cycle: comp.cycle_number,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Ejecutar cierre de ciclo
    const { data, error } = await sb.rpc("close_weekly_cycle");

    if (error) {
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ ok: true, result: data }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});