import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../../services/supabase';

/* =========================================================================
   EL GUARDIÁN — versión React (antes vivía como iframe anidado dentro de
   hub.html: hub.html estaba a su vez dentro de un iframe de HubPage.jsx).
   ------------------------------------------------------------------------
   Ese doble iframe era la causa del "choque": el HTML original cargaba
   @supabase/supabase-js desde CDN en el click, compitiendo por el hilo
   principal justo cuando se intentaba ocultar la barra superior. Aquí
   reutilizamos el cliente `supabase` que ya vive en React — cero CDN,
   cero segundo documento, cero pelea de hilos.

   Se monta directo en HubPage.jsx (como hermano del <iframe> del hub) y
   se muestra/oculta con la misma prop `open` que ya controla `oraculoOpen`
   allá. HubPage ya se encarga de avisarle a AppLayout (vía postMessage)
   para ocultar la barra superior — este componente no necesita tocar eso.
   ========================================================================= */

const SUPABASE_URL = 'https://hdwzhwuhlrtrmhnecypm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhkd3pod3VobHJ0cm1obmVjeXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMTUxMjQsImV4cCI6MjA5Mzc5MTEyNH0.bTgW5aIQpslxbtZdKcacvMUMAKUSwcb3StA-OumIUmw';
const GUARDIAN_API_URL = SUPABASE_URL + '/functions/v1/guardian-api';
const LIMITE_CARACTERES = 450;

const PREGUNTAS_INICIALES = [
  { q: '¿Qué es el Templo del Propósito y qué transformación real puedo esperar si me comprometo con la plataforma?', label: '¿Qué voy a lograr aquí?' },
  { q: '¿Cómo es el proceso cuando entro por primera vez y qué debo hacer para empezar a ver cambios reales?', label: '¿Por dónde empiezo?' },
  { q: '¿Cómo funciona la evaluación semanal y los territorios, y cómo me ayuda a saber exactamente en qué enfocar mi esfuerzo cada semana?', label: '¿En qué debo enfocarme?' },
  { q: '¿Cómo gano PropoCoins y qué puedo hacer con ellos para acelerar mi propia transformación?', label: '¿Cómo acelero mi cambio?' },
  { q: '¿Qué es la Activación Templaria (el sello que doy al terminar mi ejercicio semanal) y qué recompensa me da al completarlo?', label: '¿Cómo veo mi progreso?' },
  { q: '¿Cómo funciona el ranking semanal y cómo me ayuda a comprobar que mi constancia sí se está notando?', label: '¿Voy avanzando de verdad?' },
  { q: '¿Cómo funcionan las membresías y qué significa realmente comprometerme con este proceso de 6 meses?', label: '¿Qué tan en serio es esto?' },
  { q: '¿El Templo del Propósito es una secta, un MLM disfrazado, o algo raro?', label: '¿Es esto un MLM o algo raro?' },
  { q: '¿Qué es 100 Templarios Dijeron y cómo me ayuda a seguir avanzando sin que se sienta como tarea?', label: '¿Cómo lo hago divertido?' },
  { q: '¿De qué formas puedo invitar a otras personas a la Propotienda, y qué gano yo por hacerlo?', label: '¿Cómo invito a alguien?' },
  { q: "No tengo un 'gasto típico' confirmado con datos históricos todavía, pero explícame de forma honesta cuánto podría llegar a costarme todo esto en 6 meses considerando la membresía y lo que es opcional.", label: '¿Cuánto cuesta todo esto realmente?' },
  { q: '¿Qué pasa si una semana no completo mi ejercicio o no entro a la plataforma?', label: '¿Qué pasa si no completo mi ejercicio?' },
];

function escaparHTML(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatear(texto) {
  const escapado = escaparHTML(texto);
  const lineas = escapado.split('\n');
  let html = '';
  let dentroLista = false;
  lineas.forEach(linea => {
    const esBullet = linea.trim().startsWith('- ');
    if (esBullet && !dentroLista) { html += '<ul>'; dentroLista = true; }
    if (!esBullet && dentroLista) { html += '</ul>'; dentroLista = false; }
    if (esBullet) html += '<li>' + linea.trim().slice(2) + '</li>';
    else if (linea.trim() === '') html += '<br>';
    else html += linea + '<br>';
  });
  if (dentroLista) html += '</ul>';
  return html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function saludoSegunNombre(nombre) {
  if (!nombre) return 'Bienvenido';
  const limpio = nombre.trim().toLowerCase();
  const apodosFemeninos = ['dani', 'sofi', 'vale', 'male', 'ale'];
  if (apodosFemeninos.includes(limpio)) return 'Bienvenida';
  return limpio.endsWith('a') ? 'Bienvenida' : 'Bienvenido';
}

export default function GuardianChatbot({ open, onClose, nombreUsuario = '' }) {
  const entradaRef = useRef(null);
  const ventanaHeaderRef = useRef(null);
  const videoLoopRef = useRef(null);
  const overlayRef = useRef(null);
  const scrollRef = useRef(null);
  const pensandoRef = useRef(null);
  const msgRefs = useRef({});

  const historialRef = useRef([]);
  const ultimaPreguntaFallidaRef = useRef(null);
  const savedScrollYRef = useRef(0);

  // Los mensajes viven en estado de React (no insertados a mano en el DOM),
  // así que sobreviven a que el chatbot se oculte y se vuelva a mostrar.
  // Solo "Nueva sesión" debe vaciar esta lista.
  const [mensajes, setMensajes] = useState([]);
  const [pensando, setPensando] = useState(false);

  const [preguntas, setPreguntas] = useState(PREGUNTAS_INICIALES.map(p => p.q));
  const [bloqueado, setBloqueado] = useState(false);
  const [contador, setContador] = useState(0);
  const [vh, setVh] = useState(() => window.visualViewport?.height ?? window.innerHeight);
  const [vOffset, setVOffset] = useState(() => window.visualViewport?.offsetTop ?? 0);
  const [inited, setInited] = useState(false);

  function nuevoId() {
    return 'm' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  }

  // ── Abrir/cerrar: bloqueo de scroll del body + alto real de viewport ──
  useEffect(() => {
    if (open) {
      savedScrollYRef.current = window.scrollY || window.pageYOffset || 0;
      document.documentElement.style.height = '100%';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollYRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      setVh(window.visualViewport?.height ?? window.innerHeight);
      setVOffset(window.visualViewport?.offsetTop ?? 0);
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.documentElement.style.height = '';
      window.scrollTo(0, savedScrollYRef.current);
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.documentElement.style.height = '';
    };
  }, [open]);

  useEffect(() => {
    const update = () => {
      setVh(window.visualViewport?.height ?? window.innerHeight);
      setVOffset(window.visualViewport?.offsetTop ?? 0);
    };
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  // ── Mensaje de bienvenida (una sola vez, al primer open) ──
  useEffect(() => {
    if (open && !inited) {
      setInited(true);
      agregarMensaje(
        (nombreUsuario
          ? `¡${saludoSegunNombre(nombreUsuario)} a la Propotienda, **${nombreUsuario}**! 🔥`
          : `¡${saludoSegunNombre(nombreUsuario)} a la Propotienda! 🔥`) +
        ' Estás a un clic de descubrir todo lo que puedes lograr aquí dentro: tu evaluación semanal, ' +
        'tus territorios, tus PropoCoins, las membresías y los sorteos — todo armado para que ' +
        'tu cambio se note de verdad, semana tras semana, sin que tengas que adivinar por dónde empezar. ' +
        'Elige una de las preguntas de abajo o cuéntame qué quieres saber, y arrancamos.',
        'bot'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, inited]);

  // ── Al reabrir: si ya hubo conversación (al menos una pregunta del
  //    usuario), mostrar el final tal como quedó. Si es la primera vez
  //    (solo el saludo, sin preguntas), se deja la vista inicial de
  //    siempre (arriba, con el video y las preguntas sugeridas) ──
  useEffect(() => {
    if (!open) return;
    const hayConversacion = mensajes.some(m => m.tipo === 'user');
    if (hayConversacion) {
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Auto-scroll: cuando llega la respuesta del bot, deja arriba la
  //    última pregunta del usuario (igual que antes); si es un mensaje
  //    del usuario o un error, se muestra ese mismo mensaje arriba ──
  useEffect(() => {
    if (!mensajes.length) return;
    const ultimo = mensajes[mensajes.length - 1];
    let idObjetivo = ultimo.id;
    if (ultimo.tipo === 'bot') {
      for (let i = mensajes.length - 2; i >= 0; i--) {
        if (mensajes[i].tipo === 'user') { idObjetivo = mensajes[i].id; break; }
      }
    }
    msgRefs.current[idObjetivo]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [mensajes]);

  useEffect(() => {
    if (pensando) {
      pensandoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [pensando]);

  // ── Video encogible al hacer scroll dentro del panel ──
  useEffect(() => {
    const scrollEl = scrollRef.current;
    const ventanaHeader = ventanaHeaderRef.current;
    const videoLoop = videoLoopRef.current;
    if (!scrollEl || !ventanaHeader || !videoLoop) return;

    function tamanos() {
      const compacto = window.matchMedia('(max-height:520px)').matches;
      return compacto ? { completo: 150, minimo: 56, rango: 55 } : { completo: 230, minimo: 90, rango: 70 };
    }
    let t = tamanos();
    function actualizar() {
      const y = scrollEl.scrollTop || 0;
      const ratio = Math.max(0, Math.min(1, y / t.rango));
      const alto = t.completo - ratio * (t.completo - t.minimo);
      videoLoop.style.height = alto + 'px';
      ventanaHeader.classList.toggle('is-compact', ratio > 0.65);
    }
    let pendiente = false;
    const onScroll = () => {
      if (!pendiente) {
        requestAnimationFrame(() => { actualizar(); pendiente = false; });
        pendiente = true;
      }
    };
    const onResize = () => { t = tamanos(); actualizar(); };
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    actualizar();
    return () => {
      scrollEl.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [open]);

  // ── Brillo de borde que sigue al cursor (solo PC con mouse) ──
  useEffect(() => {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const root = overlayRef.current;
    if (!root) return;
    const SELECTOR_BRILLO = '.gc-ventana, .gc-chip, .gc-accion, .gc-textarea, .gc-enviar';
    const onMove = (e) => {
      root.querySelectorAll(SELECTOR_BRILLO).forEach(el => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--lx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--ly', (e.clientY - r.top) + 'px');
      });
    };
    document.addEventListener('mousemove', onMove, { passive: true });
    return () => document.removeEventListener('mousemove', onMove);
  }, [open]);

  // ── ESC para cerrar ──
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function agregarMensaje(texto, tipo) {
    const id = nuevoId();
    setMensajes(prev => [...prev, { id, tipo, texto }]);
    return id;
  }

  function agregarMensajeError(detalleTecnico) {
    setMensajes(prev => [...prev, { id: nuevoId(), tipo: 'error', detalle: detalleTecnico || null }]);
  }

  function mostrarPensando() {
    setPensando(true);
  }
  function quitarPensando() {
    setPensando(false);
  }

  async function obtenerAccessToken() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session?.access_token) return null;
      return data.session.access_token;
    } catch {
      return null;
    }
  }

  const consultarGuardian = useCallback(async () => {
    setBloqueado(true);
    mostrarPensando();
    try {
      const token = await obtenerAccessToken();
      if (!token) {
        quitarPensando();
        ultimaPreguntaFallidaRef.current = true;
        agregarMensajeError('No pude verificar tu sesión. Cierra y vuelve a abrir el Guardián (o recarga la página) para intentar de nuevo.');
        return;
      }
      const historial = historialRef.current;
      const cuerpo = {
        modo: 'chat',
        mensaje: historial[historial.length - 1]?.content || '',
        historial: historial.slice(0, -1).slice(-10),
      };
      const response = await fetch(GUARDIAN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(cuerpo),
      });
      const crudo = await response.text();
      let data;
      try {
        data = JSON.parse(crudo);
      } catch {
        throw new Error('Respuesta no era JSON válido: ' + crudo.slice(0, 200));
      }
      if (!response.ok || !data.ok) throw new Error(data?.error || 'HTTP ' + response.status);

      const textoResp = (data.respuesta || '').trim();
      quitarPensando();
      ultimaPreguntaFallidaRef.current = null;
      if (!textoResp) {
        agregarMensajeError('La respuesta llegó vacía.');
      } else {
        agregarMensaje(textoResp, 'bot');
        historial.push({ role: 'assistant', content: textoResp });
        generarPreguntasDeSeguimiento();
      }
    } catch (err) {
      console.error('Error al consultar al Guardián:', err);
      quitarPensando();
      ultimaPreguntaFallidaRef.current = true;
      agregarMensajeError((err?.name ? err.name + ': ' : '') + (err?.message || String(err)));
    } finally {
      setBloqueado(false);
      entradaRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reintentarUltimoEnvio() {
    if (ultimaPreguntaFallidaRef.current) consultarGuardian();
  }

  async function generarPreguntasDeSeguimiento() {
    try {
      const token = await obtenerAccessToken();
      if (!token) return;
      const response = await fetch(GUARDIAN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ modo: 'seguimiento', historial: historialRef.current.slice(-6) }),
      });
      if (!response.ok) return;
      const data = await response.json();
      if (!data.ok || !Array.isArray(data.preguntas) || !data.preguntas.length) return;
      setPreguntas(data.preguntas.slice(0, 3));
    } catch (e) {
      console.warn('No se pudieron generar preguntas de seguimiento, se dejan las anteriores:', e);
    }
  }

  async function enviarPregunta(textoCrudo) {
    const texto = (textoCrudo || '').trim();
    if (!texto) return;
    agregarMensaje(texto, 'user');
    historialRef.current.push({ role: 'user', content: texto });
    if (entradaRef.current) {
      entradaRef.current.value = '';
      entradaRef.current.style.height = 'auto';
    }
    setContador(0);
    await consultarGuardian();
  }

  function actualizarContadorDesdeInput() {
    const largo = entradaRef.current?.value.length || 0;
    setContador(largo);
  }

  function onInputChange() {
    const el = entradaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 110) + 'px';
    actualizarContadorDesdeInput();
  }

  function onEntradaKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarPregunta(entradaRef.current?.value || '');
    }
  }

  function onChipClick(texto) {
    if (bloqueado) return;
    if (entradaRef.current) {
      entradaRef.current.value = texto;
      entradaRef.current.style.height = 'auto';
      entradaRef.current.style.height = Math.min(entradaRef.current.scrollHeight, 110) + 'px';
      entradaRef.current.focus();
    }
    actualizarContadorDesdeInput();
  }

  function nuevaSesion() {
    historialRef.current = [];
    msgRefs.current = {};
    setMensajes([]);
    setPreguntas(PREGUNTAS_INICIALES.map(p => p.q));
    agregarMensaje(
      (nombreUsuario
        ? `¡${saludoSegunNombre(nombreUsuario)} a la Propotienda, **${nombreUsuario}**! 🔥`
        : `¡${saludoSegunNombre(nombreUsuario)} a la Propotienda! 🔥`) +
      ' Estás a un clic de descubrir todo lo que puedes lograr aquí dentro: tu evaluación semanal, ' +
      'tus territorios, tus PropoCoins, las membresías y los sorteos — todo armado para que ' +
      'tu cambio se note de verdad, semana tras semana, sin que tengas que adivinar por dónde empezar. ' +
      'Elige una de las preguntas de abajo o cuéntame qué quieres saber, y arrancamos.',
      'bot'
    );
  }

  function descargarPlan() {
    const contenido = historialRef.current
      .map(m => (m.role === 'user' ? (nombreUsuario || 'Tú') : 'El Guardián') + ': ' + m.content)
      .join('\n\n');
    const blob = new Blob([contenido || 'Aún no hay conversación con el Guardián.'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plan-templo-del-proposito.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!open) return null;

  const cercaDelLimite = contador >= LIMITE_CARACTERES * 0.85 && contador < LIMITE_CARACTERES;
  const lleno = contador >= LIMITE_CARACTERES;

  return (
    <div
      ref={overlayRef}
      className="gc-overlay"
      style={{ height: `${vh}px`, top: `${vOffset}px` }}
    >
      <style>{CSS}</style>

      <div className="gc-modal-header">
        <div className="gc-modal-title">
          <span className="gc-modal-icon">🛡️</span>
          <span className="gc-modal-label">EL GUARDIÁN</span>
        </div>
        <button className="gc-close" onClick={onClose} aria-label="Cerrar">✕</button>
      </div>

      <div className="gc-scroll" ref={scrollRef}>
        <div className="gc-esfera naranja"></div>
        <div className="gc-esfera amarillo"></div>
        <div className="gc-esfera cian"></div>
        <div className="gc-esfera morado"></div>

        <div className="gc-shell">
          <div className="gc-encabezado">
            <span className="gc-chispa c1">✦</span>
            <span className="gc-chispa c2">✧</span>
            <span className="gc-chispa c3">✦</span>
            <h1 className="gc-titulo"><span className="gc-subrayado"></span>Guía de la Propotienda</h1>
          </div>

          <div className="gc-ventana">
            <div className="gc-ventana-header" ref={ventanaHeaderRef}>
              <div className="gc-barra-ventana">
                <div className="gc-puntos"><span></span><span></span><span></span></div>
                <span className="gc-etiqueta">La Cámara del Guardián</span>
              </div>
              <div className="gc-video-loop" ref={videoLoopRef}>
                <iframe
                  src="https://player.vimeo.com/video/1218704734?autoplay=1&loop=1&muted=1&background=1&autopause=0&controls=0"
                  title="Video del Guardián del Templo"
                  allow="autoplay; fullscreen; picture-in-picture"
                  loading="eager"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>

            <div className="gc-contenido">
              <div className="gc-chat">
                {mensajes.map(m => (
                  <div
                    key={m.id}
                    ref={el => { if (el) msgRefs.current[m.id] = el; }}
                    className={'gc-msg ' + m.tipo}
                  >
                    {m.tipo === 'bot' && <div dangerouslySetInnerHTML={{ __html: formatear(m.texto) }} />}
                    {m.tipo === 'user' && m.texto}
                    {m.tipo === 'error' && (
                      <>
                        Hubo un problema para conectar con el Guardián. Revisa tu conexión e inténtalo de nuevo.
                        {m.detalle && <span className="gc-detalle">Detalle técnico: {m.detalle}</span>}
                        <br />
                        <button
                          className="gc-reintentar"
                          onClick={() => {
                            setMensajes(prev => prev.filter(x => x.id !== m.id));
                            reintentarUltimoEnvio();
                          }}
                        >
                          Reintentar
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {pensando && (
                  <div className="gc-thinking" ref={pensandoRef}><span></span><span></span><span></span></div>
                )}
              </div>

              <div className="gc-acciones">
                <button className="gc-accion" onClick={descargarPlan}>⬇ Descargar plan</button>
                <button className="gc-accion" onClick={nuevaSesion}>↻ Nueva sesión</button>
              </div>

              <div className="gc-preguntas">
                {preguntas.map((q, i) => (
                  <button
                    key={i}
                    className="gc-chip"
                    disabled={bloqueado}
                    onClick={() => onChipClick(q)}
                  >
                    {q.length > 42 ? q.slice(0, 40).trim() + '…' : q}
                  </button>
                ))}
              </div>

              <div className="gc-input-zona">
                <div className="gc-input-bar">
                  <textarea
                    ref={entradaRef}
                    className="gc-textarea"
                    rows={1}
                    maxLength={LIMITE_CARACTERES}
                    placeholder="Escríbele al Guardián..."
                    disabled={bloqueado}
                    onChange={onInputChange}
                    onKeyDown={onEntradaKeyDown}
                  />
                  <button
                    className="gc-enviar"
                    disabled={bloqueado}
                    onClick={() => enviarPregunta(entradaRef.current?.value || '')}
                  >
                    ↑
                  </button>
                </div>
                <div className={`gc-contador ${cercaDelLimite ? 'cerca' : ''} ${lleno ? 'lleno' : ''}`}>
                  {contador} / {LIMITE_CARACTERES}
                </div>
              </div>
            </div>
          </div>

          <p className="gc-footer-note">El Guardián solo responde con información confirmada del proyecto. Si algo no lo sabe con certeza, te lo dirá en vez de inventarlo.</p>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.gc-overlay{
  position:fixed; inset:0; z-index:2147483647;
  display:flex; flex-direction:column;
  background:#0a0e17;
  font-family:'Inter', sans-serif;
  color:#eef1f7;
  cursor:auto;
}
.gc-modal-header{
  position:absolute; top:0; left:0; right:0; z-index:5;
  display:flex; align-items:center; justify-content:space-between;
  padding:max(14px, env(safe-area-inset-top)) 18px 12px;
  pointer-events:none;
}
.gc-modal-title{ display:flex; align-items:center; gap:10px; pointer-events:none; }
.gc-modal-icon{ font-size:20px; filter:drop-shadow(0 1px 3px rgba(0,0,0,0.8)); }
.gc-modal-label{ font-family:'Cinzel',serif; font-size:15px; letter-spacing:2px; color:#22D3EE; text-shadow:0 0 14px rgba(34,211,238,0.5), 0 1px 3px rgba(0,0,0,0.8); }
.gc-close{
  background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.25); color:rgba(255,255,255,0.85);
  width:34px; height:34px; border-radius:50%; cursor:pointer; font-size:16px; flex-shrink:0; pointer-events:auto;
}
.gc-scroll{
  flex:1; min-height:0; overflow-y:auto; overflow-x:hidden;
  display:flex; justify-content:center;
  padding:0 14px 24px;
  position:relative;
}
.gc-esfera{ position:fixed; top:50%; left:50%; border-radius:50%; pointer-events:none; z-index:-1; filter:blur(95px); mix-blend-mode:screen; opacity:0.95; will-change:transform; }
.gc-esfera.naranja{ width:780px; height:780px; background:radial-gradient(circle, #FA9238 0%, rgba(250,146,56,0) 72%); animation:gcMoverNaranja 34s ease-in-out infinite; }
.gc-esfera.amarillo{ width:680px; height:680px; background:radial-gradient(circle, #F7BD21 0%, rgba(247,189,33,0) 72%); animation:gcMoverAmarillo 47s ease-in-out infinite; animation-delay:-9s; }
.gc-esfera.cian{ width:820px; height:820px; background:radial-gradient(circle, #5FDCFD 0%, rgba(95,220,253,0) 72%); animation:gcMoverCian 41s ease-in-out infinite; animation-delay:-21s; }
.gc-esfera.morado{ width:720px; height:720px; background:radial-gradient(circle, #6141D5 0%, rgba(97,65,213,0) 72%); animation:gcMoverMorado 26s ease-in-out infinite; animation-delay:-4s; }
@keyframes gcMoverNaranja{
  0%,100%{ transform:translate(calc(-50% - 22vw), calc(-50% - 18vh)) scale(1); }
  18%{ transform:translate(calc(-50% - 32vw), calc(-50% - 6vh)) scale(1.15); }
  36%{ transform:translate(calc(-50% - 12vw), calc(-50% - 26vh)) scale(0.85); }
  54%{ transform:translate(calc(-50% - 28vw), calc(-50% - 12vh)) scale(1.08); }
  72%{ transform:translate(calc(-50% - 8vw), calc(-50% - 28vh)) scale(0.92); }
  88%{ transform:translate(calc(-50% - 20vw), calc(-50% - 16vh)) scale(1.05); }
}
@keyframes gcMoverAmarillo{
  0%,100%{ transform:translate(calc(-50% - 24vw), calc(-50% + 16vh)) scale(1); }
  20%{ transform:translate(calc(-50% - 14vw), calc(-50% + 24vh)) scale(1.14); }
  42%{ transform:translate(calc(-50% - 30vw), calc(-50% + 6vh)) scale(0.86); }
  60%{ transform:translate(calc(-50% - 10vw), calc(-50% + 20vh)) scale(1.1); }
  80%{ transform:translate(calc(-50% - 22vw), calc(-50% + 12vh)) scale(0.94); }
}
@keyframes gcMoverCian{
  0%,100%{ transform:translate(calc(-50% + 24vw), calc(-50% - 10vh)) scale(1); }
  16%{ transform:translate(calc(-50% + 34vw), calc(-50% - 20vh)) scale(1.16); }
  34%{ transform:translate(calc(-50% + 14vw), calc(-50% + 8vh)) scale(0.86); }
  52%{ transform:translate(calc(-50% + 30vw), calc(-50% - 4vh)) scale(1.1); }
  70%{ transform:translate(calc(-50% + 18vw), calc(-50% - 18vh)) scale(0.9); }
  86%{ transform:translate(calc(-50% + 26vw), calc(-50% + 2vh)) scale(1.04); }
}
@keyframes gcMoverMorado{
  0%,100%{ transform:translate(calc(-50% - 6vw), calc(-50% - 6vh)) scale(1); }
  22%{ transform:translate(calc(-50% + 8vw), calc(-50% + 5vh)) scale(1.15); }
  44%{ transform:translate(calc(-50% - 10vw), calc(-50% + 8vh)) scale(0.88); }
  66%{ transform:translate(calc(-50% + 6vw), calc(-50% - 9vh)) scale(1.1); }
  85%{ transform:translate(calc(-50% - 4vw), calc(-50% + 2vh)) scale(0.95); }
}
.gc-shell{ width:100%; max-width:676px; }
.gc-encabezado{ text-align:center; position:relative; margin-top:56px; margin-bottom:18px; }
.gc-titulo{ font-family:'Poppins', sans-serif; font-weight:800; font-size:34px; color:#fff; letter-spacing:-0.01em; margin:0; position:relative; display:inline-block; }
.gc-subrayado{ position:absolute; left:6%; right:6%; top:-10px; height:2px; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent); }
.gc-chispa{ position:absolute; font-size:16px; color:#f2c94c; filter:drop-shadow(0 0 6px rgba(242,201,76,0.7)); animation:gcDestello 2.6s ease-in-out infinite; }
.gc-chispa.c1{ top:-14px; left:14%; animation-delay:.2s; }
.gc-chispa.c2{ top:6px; right:12%; font-size:12px; animation-delay:1s; }
.gc-chispa.c3{ bottom:-8px; right:26%; font-size:10px; animation-delay:1.6s; }
@keyframes gcDestello{ 0%,100%{ opacity:.35; transform:scale(0.85);} 50%{ opacity:1; transform:scale(1.05);} }
.gc-ventana{ border-radius:16px; background:#141a2b; border:1px solid rgba(255,255,255,0.06); box-shadow:0 20px 50px rgba(0,0,0,0.45); margin-bottom:16px; }
.gc-ventana-header{ position:sticky; top:0; z-index:4; border-radius:16px 16px 0 0; overflow:hidden; background:#1b2338; box-shadow:0 10px 18px -12px rgba(0,0,0,0.6); }
.gc-contenido{ border-radius:0 0 16px 16px; overflow:hidden; background:#141a2b; }
.gc-barra-ventana{ display:flex; align-items:center; justify-content:center; position:relative; padding:10px 14px; background:#1b2338; border-bottom:1px solid rgba(255,255,255,0.05); }
.gc-puntos{ position:absolute; left:14px; display:flex; gap:6px; }
.gc-puntos span{ width:9px; height:9px; border-radius:50%; background:rgba(255,255,255,0.18); }
.gc-etiqueta{ font-size:11px; letter-spacing:0.10em; text-transform:uppercase; color:#8b93a7; font-weight:600; }
.gc-video-loop{ position:relative; height:230px; background:radial-gradient(circle at 30% 20%, rgba(47,214,217,0.25), transparent 55%), radial-gradient(circle at 75% 75%, rgba(242,201,76,0.18), transparent 50%), #0e1424; display:flex; align-items:center; justify-content:center; overflow:hidden; transition:height .1s linear; }
.gc-video-loop iframe{ position:absolute; top:50%; left:50%; width:100%; height:100%; min-width:100%; min-height:100%; transform:translate(-50%,-50%) scale(1.6); border:0; pointer-events:none; z-index:0; }
.gc-ventana-header.is-compact .gc-barra-ventana{ padding:5px 12px; }
.gc-ventana-header.is-compact .gc-etiqueta{ font-size:9px; }
.gc-ventana-header.is-compact .gc-puntos span{ width:6px; height:6px; }
.gc-preguntas{ display:flex; flex-wrap:wrap; gap:5px; padding:8px 12px 0; justify-content:center; border-top:1px solid rgba(255,255,255,0.05); margin-top:2px; }
.gc-chip{ font-family:'Inter', sans-serif; font-size:11px; font-weight:600; color:#f2c94c; background:rgba(242,201,76,0.08); border:1px solid rgba(242,201,76,0.16); border-radius:999px; padding:5px 9px; cursor:pointer; transition:all .18s ease; position:relative; }
.gc-chip:hover{ background:rgba(242,201,76,0.16); }
.gc-chip:disabled{ opacity:.4; cursor:not-allowed; }
.gc-chat{ padding:16px 14px 4px; display:flex; flex-direction:column; gap:12px; }
.gc-msg{ max-width:88%; padding:11px 14px; border-radius:14px; font-size:13.5px; line-height:1.5; }
.gc-msg.bot{ align-self:flex-start; background:#161d30; border:1px solid rgba(255,255,255,0.05); border-top-left-radius:3px; }
.gc-msg.bot strong{ color:#f2c94c; font-weight:700; }
.gc-msg.bot ul{ margin:6px 0; padding-left:18px; }
.gc-msg.bot li{ margin-bottom:4px; }
.gc-msg.user{ align-self:flex-end; background:linear-gradient(135deg, #f6c343, #e8962e); color:#26190a; font-weight:600; border-top-right-radius:3px; }
.gc-msg.error{ align-self:center; background:rgba(160,40,40,0.16); border:1px solid rgba(220,90,90,0.35); color:#f3c8c8; font-size:13px; max-width:96%; text-align:left; }
.gc-detalle{ display:block; margin-top:6px; font-size:11.5px; color:#e0a5a5; word-break:break-word; }
.gc-msg.error button{ margin-top:8px; background:rgba(242,201,76,0.16); border:1px solid rgba(242,201,76,0.16); color:#f2c94c; border-radius:8px; padding:6px 10px; font-size:12.5px; cursor:pointer; }
.gc-thinking{ align-self:flex-start; display:flex; gap:5px; padding:12px 15px; }
.gc-thinking span{ width:6px; height:6px; border-radius:50%; background:#f2c94c; animation:gcPulso 1.1s ease-in-out infinite; }
.gc-thinking span:nth-child(2){ animation-delay:.15s; }
.gc-thinking span:nth-child(3){ animation-delay:.3s; }
@keyframes gcPulso{ 0%,100%{ opacity:.25; transform:translateY(0);} 50%{ opacity:1; transform:translateY(-3px);} }
.gc-acciones{ display:flex; gap:6px; justify-content:center; padding:6px 12px 0; }
.gc-accion{ display:flex; align-items:center; gap:4px; background:#1b2338; border:1px solid rgba(255,255,255,0.06); color:#8b93a7; font-size:10.5px; font-weight:600; padding:4px 9px; border-radius:8px; cursor:pointer; position:relative; }
.gc-accion:hover{ color:#eef1f7; border-color:rgba(255,255,255,0.15); }
.gc-input-zona{ position:sticky; bottom:0; z-index:3; background:#141a2b; padding-bottom:env(safe-area-inset-bottom); }
.gc-input-bar{ display:flex; align-items:flex-end; gap:8px; padding:12px 10px 2px; }
.gc-textarea{ flex:1; resize:none; background:#1b2338; border:1px solid rgba(255,255,255,0.08); border-radius:24px; color:#eef1f7; font-family:'Inter', sans-serif; font-size:13px; line-height:1.4; padding:13px 20px; max-height:110px; outline:none; position:relative; }
.gc-textarea:focus{ border-color:#f2c94c; }
.gc-textarea::placeholder{ color:#8b93a7; }
.gc-enviar{ width:42px; height:42px; flex:none; border-radius:50%; background:linear-gradient(135deg, #f6c343, #e8962e); border:none; color:#26190a; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; position:relative; }
.gc-enviar:disabled{ opacity:.4; cursor:not-allowed; }
.gc-contador{ text-align:right; font-size:10.5px; color:#8b93a7; padding:0 22px 6px; user-select:none; }
.gc-contador.cerca{ color:#f2c94c; }
.gc-contador.lleno{ color:#e0685a; }
.gc-footer-note{ text-align:center; font-size:11.5px; color:#8b93a7; padding:6px 20px 4px; }
@media (max-height:520px){
  .gc-scroll{ padding:0 10px 20px; }
  .gc-encabezado{ margin-top:44px; margin-bottom:8px; }
  .gc-titulo{ font-size:19px; }
  .gc-chispa{ display:none; }
  .gc-barra-ventana{ padding:6px 12px; }
  .gc-etiqueta{ font-size:9.5px; }
  .gc-chat{ padding:12px 14px 4px; }
}
@media (hover:hover) and (pointer:fine){
  .gc-ventana::before, .gc-ventana::after,
  .gc-chip::before, .gc-chip::after,
  .gc-accion::before, .gc-accion::after,
  .gc-textarea::before, .gc-textarea::after,
  .gc-enviar::before, .gc-enviar::after{
    content:""; position:absolute; inset:0; border-radius:inherit; padding:1.5px;
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
    opacity:0; pointer-events:none; animation-play-state: paused; z-index:3;
  }
  .gc-ventana::before, .gc-chip::before, .gc-accion::before, .gc-textarea::before, .gc-enviar::before{
    background: radial-gradient(160px 160px at var(--lx,50%) var(--ly,50%), rgba(201,166,255,0.95), transparent 65%);
    filter: drop-shadow(0 0 6px rgba(201,166,255,0.6));
    animation: gcCicloBrilloMorado 6s ease-in-out infinite;
  }
  .gc-ventana::after, .gc-chip::after, .gc-accion::after, .gc-textarea::after, .gc-enviar::after{
    background: radial-gradient(160px 160px at var(--lx,50%) var(--ly,50%), rgba(242,201,76,0.95), transparent 65%);
    filter: drop-shadow(0 0 6px rgba(242,201,76,0.6));
    animation: gcCicloBrilloDorado 6s ease-in-out infinite;
    animation-delay: 3s;
  }
  .gc-ventana:hover::before, .gc-chip:hover::before, .gc-accion:hover::before, .gc-textarea:hover::before, .gc-enviar:hover::before,
  .gc-ventana:hover::after, .gc-chip:hover::after, .gc-accion:hover::after, .gc-textarea:hover::after, .gc-enviar:hover::after{
    animation-play-state: running;
  }
}
@keyframes gcCicloBrilloMorado{ 0%,100%{ opacity:0; } 50%{ opacity:1; } }
@keyframes gcCicloBrilloDorado{ 0%,100%{ opacity:0; } 50%{ opacity:1; } }
`;
