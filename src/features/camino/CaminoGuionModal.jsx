import { useEffect, useState } from "react";
import { supabaseCamino as supabase } from "../../services/supabaseCamino";

const styles = `
.cgm-overlay{
  position:fixed; inset:0; z-index:200; display:flex; align-items:center; justify-content:center;
  padding:20px; background:rgba(4,2,14,0.82); backdrop-filter:blur(3px);
  animation:cgm-fade .18s ease-out;
}
@keyframes cgm-fade{ from{opacity:0;} to{opacity:1;} }
.cgm-modal{
  width:100%; max-width:560px; max-height:88vh; overflow-y:auto;
  background:linear-gradient(180deg, rgba(14,7,38,0.98), rgba(6,3,18,0.98));
  border:1px solid var(--gold-dim,rgba(212,175,55,0.4)); border-radius:18px;
  padding:26px 24px 22px; position:relative;
  box-shadow:0 0 40px rgba(212,175,55,0.18), 0 20px 60px rgba(0,0,0,0.6);
  animation:cgm-rise .22s ease-out;
}
@keyframes cgm-rise{ from{transform:translateY(14px); opacity:0;} to{transform:translateY(0); opacity:1;} }
.cgm-close{
  position:absolute; top:14px; right:14px; width:30px; height:30px; border-radius:50%;
  background:rgba(212,175,55,0.1); border:1px solid var(--gold-dim,rgba(212,175,55,0.4));
  color:var(--lilac,#c8b9f0); font-size:16px; cursor:pointer; line-height:1;
}
.cgm-close:hover{ color:#FFE566; border-color:#D4AF37; }
.cgm-eyebrow{
  font-family:'Cinzel',serif; font-weight:900; font-size:11px; letter-spacing:2px;
  color:#D4AF37; margin-bottom:6px; display:flex; align-items:center; gap:6px;
}
.cgm-title{
  font-family:'Cinzel Decorative',serif; font-weight:900; font-size:20px; color:#fff; margin-bottom:14px;
}
.cgm-field-label{
  font-family:'Cinzel',serif; font-weight:700; font-size:12px; letter-spacing:0.4px;
  color:var(--lilac,#c8b9f0); margin-bottom:6px; display:block;
}
.cgm-input{
  width:100%; padding:11px 13px; border-radius:10px; margin-bottom:16px;
  background:rgba(255,255,255,0.05); border:1px solid rgba(212,175,55,0.3);
  color:#fff; font-family:'Nunito',sans-serif; font-size:14px; outline:none;
}
.cgm-input:focus{ border-color:#D4AF37; }
.cgm-prompt-box{
  background:rgba(212,175,55,0.06); border:1px solid rgba(212,175,55,0.3); border-radius:12px;
  padding:16px; font-family:'Nunito',sans-serif; font-size:13.5px; line-height:1.6;
  color:rgba(255,255,255,0.92); white-space:pre-wrap; margin-bottom:14px; max-height:260px; overflow-y:auto;
}
.cgm-prompt-box b{ color:#FFE566; }
.cgm-actions{ display:flex; gap:10px; flex-wrap:wrap; }
.cgm-btn{
  padding:12px 20px; border-radius:10px; cursor:pointer;
  font-family:'Cinzel',serif; font-weight:900; font-size:11.5px; letter-spacing:1px;
  border:1px solid #D4AF37; background:rgba(212,175,55,0.14); color:#FFE566; flex:1; min-width:160px;
  text-align:center;
}
.cgm-btn:hover{ background:rgba(212,175,55,0.22); }
.cgm-btn.secondary{ background:transparent; border-color:rgba(200,185,240,0.4); color:var(--lilac,#c8b9f0); }
.cgm-hint{
  font-family:'Nunito',sans-serif; font-size:12px; color:rgba(200,185,240,0.6); margin-top:10px; line-height:1.5;
}
.cgm-ejemplo-toggle{
  font-family:'Cinzel',serif; font-size:11px; font-weight:700; color:var(--lilac,#c8b9f0);
  background:none; border:none; cursor:pointer; text-decoration:underline; padding:0; margin-top:4px;
}
`;

function armarPrompt(promptTexto, nicho) {
  const nichoFinal = (nicho || "").trim() || "[Insertar Nicho/Audiencia]";
  return promptTexto.replace("[Insertar Nicho/Audiencia]", nichoFinal);
}

/**
 * Modal "Generar Guion con IA" — Prompt Maestro adaptado al nicho del líder.
 * Uso: <CaminoGuionModal formato="Ranking" onClose={...} />
 */
export default function CaminoGuionModal({ formato, onClose }) {
  const [cargando, setCargando] = useState(true);
  const [promptTexto, setPromptTexto] = useState("");
  const [ejemploSalida, setEjemploSalida] = useState(null);
  const [mostrarEjemplo, setMostrarEjemplo] = useState(false);
  const [nicho, setNicho] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;

      const [{ data: promptRow }, { data: participanteRow }] = await Promise.all([
        supabase
          .from("camino_prompts_formato")
          .select("prompt_texto, ejemplo_salida")
          .eq("formato", formato)
          .maybeSingle(),
        uid
          ? supabase.from("camino_participantes").select("nicho").eq("id", uid).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (!activo) return;
      setPromptTexto(promptRow?.prompt_texto || "");
      setEjemploSalida(promptRow?.ejemplo_salida || null);
      setNicho(participanteRow?.nicho || "");
      setCargando(false);
    }
    cargar();
    return () => { activo = false; };
  }, [formato]);

  async function guardarNicho(valor) {
    setGuardando(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData?.session?.user?.id;
    if (uid) {
      await supabase.from("camino_participantes").update({ nicho: valor }).eq("id", uid);
    }
    setGuardando(false);
  }

  const promptFinal = armarPrompt(promptTexto, nicho);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(promptFinal);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // fallback silencioso si el navegador bloquea el clipboard
    }
  }

  return (
    <div className="cgm-overlay" onClick={onClose}>
      <style>{styles}</style>
      <div className="cgm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="cgm-close" onClick={onClose} aria-label="Cerrar">✕</button>
        <div className="cgm-eyebrow">🪄 GENERADOR DE GUIONES</div>
        <div className="cgm-title">Guion para "{formato}"</div>

        {cargando ? (
          <p style={{ color: "var(--lilac)", fontFamily: "'Nunito',sans-serif", fontSize: 14 }}>
            Preparando tu prompt...
          </p>
        ) : (
          <>
            <label className="cgm-field-label" htmlFor="cgm-nicho">Tu nicho / audiencia</label>
            <input
              id="cgm-nicho"
              className="cgm-input"
              placeholder="Ej. Nutrición para mamás ocupadas"
              value={nicho}
              onChange={(e) => setNicho(e.target.value)}
              onBlur={(e) => guardarNicho(e.target.value)}
            />

            <label className="cgm-field-label">Prompt listo para copiar</label>
            <div className="cgm-prompt-box">{promptFinal}</div>

            <div className="cgm-actions">
              <button className="cgm-btn" onClick={copiar}>
                {copiado ? "✅ COPIADO" : "📋 COPIAR PROMPT"}
              </button>
              <button className="cgm-btn secondary" onClick={onClose}>CERRAR</button>
            </div>

            {ejemploSalida && (
              <>
                <button className="cgm-ejemplo-toggle" onClick={() => setMostrarEjemplo((v) => !v)}>
                  {mostrarEjemplo ? "Ocultar ejemplo ▴" : "Ver un ejemplo de guion resuelto ▾"}
                </button>
                {mostrarEjemplo && <div className="cgm-prompt-box" style={{ marginTop: 10 }}>{ejemploSalida}</div>}
              </>
            )}

            <p className="cgm-hint">
              Pega este prompt en tu IA de preferencia (ChatGPT, Gemini o Claude). Guardamos tu nicho para que no
              tengas que volver a escribirlo mañana.{guardando ? " Guardando…" : ""}
            </p>
          </>
        )}
      </div>
    </div>
  );
}