import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const { text, moduleTitle, evidencePrompt } = await req.json();
    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Eres el validador de evidencia del Templo del Propósito. MÓDULO: "${moduleTitle}" PROMPT: "${evidencePrompt}" TEXTO DEL ESTUDIANTE: "${text}" Evalúa si hay reflexión personal real y relevante. Responde SOLO JSON sin backticks: {"approved": true/false, "message": "2 oraciones épicas en español tono templario"}`,
        }],
      }),
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '{"approved":false,"message":"Sin respuesta."}';
    let result;
    try { result = JSON.parse(raw); }
    catch { result = { approved: false, message: raw }; }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ approved: false, message: `Error: ${err.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});