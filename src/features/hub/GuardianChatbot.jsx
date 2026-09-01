import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../../services/supabase';

/* =========================================================================
   EL GUARDIÁN — v2 (rediseño visual completo)
   ------------------------------------------------------------------------
   Toda la lógica funcional (Supabase, edge function guardian-api, historial,
   preguntas iniciales/de seguimiento, saludo de bienvenida, manejo de
   scroll/teclado/ESC, aislamiento de eventos frente al resto de la app) se
   mantiene EXACTAMENTE igual que en la versión anterior. Lo único que
   cambia aquí es la capa visual (JSX de presentación + CSS).

   FIX DEL PUNTERO: el cursor nativo del sistema desaparecía al abrir este
   modal en computadora. Este archivo no tiene ninguna razón propia para
   ocultarlo (nunca se usa Pointer Lock ni Fullscreen API), así que la causa
   está en una regla global de tu app (p. ej. `cursor: none` en <html>/<body>
   o en un selector `*`). Como blindaje, aquí se fuerza `cursor: auto/pointer
   /text !important` en todo el árbol del overlay con selectores de alta
   especificidad — esto gana contra casi cualquier regla global que no sea
   también `!important` sobre un elemento aún más específico. Si el problema
   persiste tras este cambio, es porque esa otra regla vive en un archivo
   que no tengo (compárteme el CSS global o AppLayout.jsx y lo cierro del
   todo ahí).
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

function mensajeBienvenida(nombreUsuario) {
  return (
    (nombreUsuario
      ? `¡${saludoSegunNombre(nombreUsuario)} a la Propotienda, **${nombreUsuario}**! 🔥`
      : `¡${saludoSegunNombre(nombreUsuario)} a la Propotienda! 🔥`) +
    ' Estás a un clic de descubrir todo lo que puedes lograr aquí dentro: tu evaluación semanal, ' +
    'tus territorios, tus PropoCoins, las membresías y los sorteos — todo armado para que ' +
    'tu cambio se note de verdad, semana tras semana, sin que tengas que adivinar por dónde empezar. ' +
    'Elige una de las preguntas de abajo o cuéntame qué quieres saber, y arrancamos.'
  );
}

// ── Detección de equipo/red modestos, síncrona (sin esperar a medir fps
//    en vivo). Cualquiera de estas señales ya es suficiente para no
//    arriesgarnos a cargar el video de fondo desde el primer render:
//    - hardwareConcurrency: pocos núcleos de CPU.
//    - deviceMemory: poca RAM (Chrome/Android la expone; iOS Safari no,
//      así que en iPhone esta señal en particular simplemente no aplica
//      y no afecta nada — el resto de señales sigue funcionando igual).
//    - connection.saveData / effectiveType lento: el usuario o su red ya
//      están pidiendo consumir menos datos/batería.
//    - prefers-reduced-motion: el propio sistema operativo ya nos dice
//      que el usuario prefiere menos animación.
function detectarGamaBajaSincrona() {
  if (typeof navigator === 'undefined') return false;
  const pocosNucleos = (navigator.hardwareConcurrency || 8) <= 4;
  const pocaRam = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
  const conexion = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const redLimitada = !!(conexion && (conexion.saveData || /^(slow-2g|2g|3g)$/.test(conexion.effectiveType || '')));
  const movimientoReducido = typeof window !== 'undefined' &&
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return pocosNucleos || pocaRam || redLimitada || movimientoReducido;
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
  const [inited, setInited] = useState(false);
  // Se activa si, ya sea de entrada (núcleos de CPU, RAM del equipo, modo
  // ahorro de datos) o después de medir fps en vivo, detectamos que el
  // equipo no va a sostenerse bien. Al activarse, el CSS de abajo apaga los
  // efectos más pesados (esferas de fondo con blur, brillo de borde
  // animado) Y, más importante para equipos de gama baja/media como un
  // Motorola One Zoom, el video de fondo NUNCA se llega a cargar — el
  // video (decodificación continua) es, con mucha diferencia, lo más caro
  // de sostener en un procesador modesto, más caro que cualquier CSS.
  const [modoLigero, setModoLigero] = useState(detectarGamaBajaSincrona);
  const [tecladoAbierto, setTecladoAbierto] = useState(false);
  // Se apaga el video (entre otras cosas) mientras el usuario cambia de
  // app o bloquea el celular. Sin esto, un video "en pausa visual" pero
  // técnicamente montado sigue existiendo en el DOM mientras la app está
  // en segundo plano, listo para que el sistema operativo decida que es
  // un buen candidato para matar el proceso por uso de batería/memoria
  // en segundo plano.
  const [pantallaOculta, setPantallaOculta] = useState(
    typeof document !== 'undefined' ? document.hidden : false
  );

  useEffect(() => {
    const onVisibilidad = () => setPantallaOculta(document.hidden);
    document.addEventListener('visibilitychange', onVisibilidad);
    return () => document.removeEventListener('visibilitychange', onVisibilidad);
  }, []);

  // ── Precalentar la conexión con Vimeo desde que carga el hub (no solo
  //    cuando se abre el chat), para que al abrir el chatbot el video no
  //    pierda tiempo en la conexión inicial y empiece a reproducirse más
  //    rápido. No cambia nada de layout, tamaño ni calidad del video.
  //    En equipos de gama baja no hacemos ni esto: no tiene sentido
  //    reservar DNS/conexión para un video que ya decidimos no mostrar ──
  useEffect(() => {
    if (modoLigero) return;
    const dominios = ['https://player.vimeo.com', 'https://i.vimeocdn.com', 'https://f.vimeocdn.com'];
    const agregados = [];
    dominios.forEach(href => {
      if (document.querySelector(`link[data-guardian-preconnect="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      link.crossOrigin = 'anonymous';
      link.setAttribute('data-guardian-preconnect', href);
      document.head.appendChild(link);
      agregados.push(link);
    });
    return () => {
      agregados.forEach(link => link.remove());
    };
  }, []);

  function nuevoId() {
    return 'm' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  }

  // ── Detección de equipo débil: al abrir, medimos cuántos frames por
  //    segundo sostiene el navegador durante ~12 frames. Si va lento, o
  //    si el equipo reporta pocos núcleos de CPU, activamos el modo
  //    ligero automáticamente. Esto corre una sola vez por apertura y
  //    no vuelve a medir de ahí en adelante (para no seguir gastando
  //    recursos midiendo). ──
  useEffect(() => {
    if (!open) return;
    let frames = 0;
    let inicio = null;
    let raf;
    const medir = (t) => {
      if (inicio === null) inicio = t;
      frames++;
      if (frames < 14) {
        raf = requestAnimationFrame(medir);
        return;
      }
      const duracionMs = t - inicio;
      const fpsAprox = (frames / duracionMs) * 1000;
      const pocosNucleos = (navigator.hardwareConcurrency || 8) <= 4;
      if (fpsAprox < 45 || pocosNucleos) setModoLigero(true);
    };
    raf = requestAnimationFrame(medir);
    return () => cancelAnimationFrame(raf);
  }, [open]);

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
    } else {
      // Muy importante: si el usuario estaba escribiendo y cierra sin
      // enviar, el teclado se queda "fantasma" abierto si no soltamos el
      // foco a propósito. Como HubPage.jsx calcula el alto del hub con el
      // mismo dato de pantalla visible (visualViewport), un teclado
      // fantasma hace que el hub se vea encogido o con una franja negra
      // abajo. Por eso soltamos el foco explícitamente antes de cerrar.
      entradaRef.current?.blur();
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.documentElement.style.height = '';
      window.scrollTo(0, savedScrollYRef.current);
      // Auto-corrección: una vez que el chat terminó de cerrarse y la
      // pantalla ya se asentó, le avisamos al resto de la app (HubPage)
      // que vuelva a medir el tamaño real de la pantalla, disparando el
      // mismo evento nativo que ya usa para eso. Esto evita que el hub se
      // quede con una medida equivocada, sin importar la causa.
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 400);
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

  // ── Mantener la barra de escribir visible arriba del teclado en
  //    celular, y ocultar la nota del pie mientras el teclado esté
  //    abierto (causa real: en PWA de iPhone, 100dvh no se achica
  //    cuando aparece el teclado; hay que medirlo con visualViewport) ──
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;
    let rafPendiente = false;
    let scrollTimeoutId = null;
    const aplicar = () => {
      rafPendiente = false;
      const diferencia = window.innerHeight - vv.height;
      setTecladoAbierto(diferencia > 120);
      // CLAVE: no basta con achicar el alto del panel al alto del
      // viewport visual (vv.height). El panel es `position:fixed;
      // inset:0`, que lo ancla al viewport de LAYOUT, no al visual. En
      // cuanto el teclado abre, iOS desplaza el viewport visual hacia
      // abajo/lateral (vv.offsetTop / vv.offsetLeft dejan de ser 0) para
      // mantener visible el campo enfocado — sobre todo en horizontal,
      // donde el teclado ocupa una porción enorme de la pantalla. Si solo
      // corregimos el alto y no ese desplazamiento, el panel queda
      // "flotando" fuera del área realmente visible: por eso se veía
      // cortado de formas distintas y nunca se veía lo que escribías.
      // Sincronizamos alto + posición con el viewport visual real, tal
      // como hace cualquier app nativa (WhatsApp incluido).
      if (overlayRef.current) {
        overlayRef.current.style.height = vv.height + 'px';
        overlayRef.current.style.width = vv.width + 'px';
        overlayRef.current.style.top = vv.offsetTop + 'px';
        overlayRef.current.style.left = vv.offsetLeft + 'px';
      }
      if (document.activeElement === entradaRef.current) {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' });
        // Un solo timeout "vivo" a la vez: si llega otro evento de resize/
        // scroll antes de que se cumpla, cancelamos el anterior en vez de
        // apilar timeouts. Mientras el teclado se abre, iOS puede disparar
        // este evento muchas veces seguidas; apilar timeouts (cada uno
        // leyendo scrollHeight y forzando scroll) es trabajo de más justo
        // cuando el equipo ya está bajo presión de memoria por el video.
        if (scrollTimeoutId) clearTimeout(scrollTimeoutId);
        scrollTimeoutId = setTimeout(() => {
          scrollTimeoutId = null;
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' });
        }, 250);
      }
    };
    // Agrupamos ráfagas de eventos 'resize'/'scroll' del visualViewport en
    // un solo cálculo por frame con requestAnimationFrame, en lugar de
    // ejecutar el cálculo completo (que incluye lecturas de layout) cada
    // vez que el navegador dispara el evento — durante la animación del
    // teclado eso puede ser muy seguido.
    const actualizar = () => {
      if (rafPendiente) return;
      rafPendiente = true;
      requestAnimationFrame(aplicar);
    };
    vv.addEventListener('resize', actualizar);
    vv.addEventListener('scroll', actualizar);
    actualizar();
    return () => {
      vv.removeEventListener('resize', actualizar);
      vv.removeEventListener('scroll', actualizar);
      if (scrollTimeoutId) clearTimeout(scrollTimeoutId);
      if (overlayRef.current) {
        overlayRef.current.style.height = '';
        overlayRef.current.style.width = '';
        overlayRef.current.style.top = '';
        overlayRef.current.style.left = '';
      }
    };
  }, [open]);

  // ── Mensaje de bienvenida (una sola vez, al primer open) ──
  useEffect(() => {
    if (open && !inited) {
      setInited(true);
      agregarMensaje(mensajeBienvenida(nombreUsuario), 'bot');
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
  //    última pregunta del usuario; si es un mensaje del usuario o un
  //    error, se muestra ese mismo mensaje arriba. IMPORTANTE: si el
  //    mensaje es del bot pero no existe ninguna pregunta previa del
  //    usuario (o sea, es solo el saludo inicial), NO se hace scroll —
  //    así la primera apertura siempre se queda arriba del todo, con el
  //    video a tamaño completo y el saludo visible ──
  useEffect(() => {
    if (!mensajes.length) return;
    const ultimo = mensajes[mensajes.length - 1];
    if (ultimo.tipo === 'bot') {
      let idPregunta = null;
      for (let i = mensajes.length - 2; i >= 0; i--) {
        if (mensajes[i].tipo === 'user') { idPregunta = mensajes[i].id; break; }
      }
      if (idPregunta) {
        msgRefs.current[idPregunta]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    msgRefs.current[ultimo.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  // Limitado a un cálculo por frame (requestAnimationFrame): algunos mouse
  // disparan "mousemove" cientos de veces por segundo, y recalcular la
  // posición de 5 elementos en cada uno de esos eventos es lo que causaba
  // que el chat se sintiera lento/trabado en computadoras de gama baja.
  useEffect(() => {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    if (modoLigero) return;
    const root = overlayRef.current;
    if (!root) return;
    const SELECTOR_BRILLO = '.gc-ventana, .gc-chip, .gc-accion, .gc-textarea, .gc-enviar';
    let ultimoEvento = null;
    let pendiente = false;
    const aplicarBrillo = () => {
      pendiente = false;
      if (!ultimoEvento) return;
      const { clientX, clientY } = ultimoEvento;
      root.querySelectorAll(SELECTOR_BRILLO).forEach(el => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--lx', (clientX - r.left) + 'px');
        el.style.setProperty('--ly', (clientY - r.top) + 'px');
      });
    };
    const onMove = (e) => {
      ultimoEvento = e;
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(aplicarBrillo);
      }
    };
    document.addEventListener('mousemove', onMove, { passive: true });
    return () => document.removeEventListener('mousemove', onMove);
  }, [open, modoLigero]);

  // ── ESC para cerrar ──
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') { entradaRef.current?.blur(); onClose?.(); } };
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
      entradaRef.current.blur();
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
    // Aseguramos manualmente que la barra de escribir quede visible
    // arriba del teclado: el navegador a veces falla en hacer ese scroll
    // automático justo cuando el textarea cambia de alto (por el texto
    // largo de la pregunta) en el mismo instante en que se abre el
    // teclado. Lo intentamos de inmediato y una vez más un poco después,
    // por si el teclado tarda en terminar de abrirse.
    const irAlFondo = () => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    };
    requestAnimationFrame(irAlFondo);
    setTimeout(irAlFondo, 350);
  }

  function onEntradaFocus() {
    // Mismo ajuste que onChipClick, pero para cuando el usuario toca
    // el textarea directamente para escribir a mano.
    const irAlFondo = () => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    };
    requestAnimationFrame(irAlFondo);
    setTimeout(irAlFondo, 350);
  }

  function nuevaSesion() {
    historialRef.current = [];
    msgRefs.current = {};
    setMensajes([]);
    setPreguntas(PREGUNTAS_INICIALES.map(p => p.q));
    agregarMensaje(mensajeBienvenida(nombreUsuario), 'bot');
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
      className={'gc-overlay' + (modoLigero ? ' gc-ligero' : '') + (tecladoAbierto ? ' gc-teclado-abierto' : '')}
      // El chatbot debe comportarse como una pestaña totalmente aislada:
      // nada de lo que se toque aquí adentro debe "escapar" hacia
      // listeners globales de `window` del resto de la app (por ejemplo,
      // el que intenta activar pantalla completa en AppLayout con el
      // primer toque en cualquier parte de la pantalla). Frenamos la
      // propagación en fase de burbuja: los botones internos (enviar,
      // cerrar, preguntas, textarea) reciben el clic con total
      // normalidad primero; solo evitamos que siga subiendo más allá
      // de este overlay hacia el resto de la app.
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{CSS}</style>

      <div className="gc-fondo" aria-hidden="true">
        <div className="gc-esfera naranja"></div>
        <div className="gc-esfera amarillo"></div>
        <div className="gc-esfera cian"></div>
        <div className="gc-esfera morado"></div>
      </div>

      <div className="gc-modal-header">
        <div className="gc-modal-title">
          <span className="gc-modal-icon">🛡️</span>
          <span className="gc-modal-label">EL GUARDIÁN</span>
        </div>
        <button
          className="gc-close"
          onClick={() => { entradaRef.current?.blur(); onClose?.(); }}
          aria-label="Cerrar"
        >✕</button>
      </div>

      <div className="gc-scroll" ref={scrollRef}>
        <div className="gc-shell">
          <div className="gc-ventana">
            <div className="gc-ventana-header" ref={ventanaHeaderRef}>
              <div className="gc-barra-ventana">
                <div className="gc-puntos"><span></span><span></span><span></span></div>
                <span className="gc-etiqueta">La Cámara del Guardián</span>
              </div>
              <div className="gc-video-loop" ref={videoLoopRef}>
                {/* El video solo se monta cuando de verdad aporta algo: NO
                    mientras el teclado está abierto (no se ve y sobrecarga
                    el layout justo cuando más importa la fluidez), NO en
                    equipos de gama baja/red limitada (el video es lo más
                    caro de sostener en un procesador modesto, mucho más
                    que cualquier CSS), y NO mientras la app está en
                    segundo plano (evita que quede "vivo" gastando batería
                    y aumentando el riesgo de que el sistema mate la app).
                    Cuando no se monta, el propio fondo con degradado del
                    contenedor (ver CSS de .gc-video-loop) se ve bien solo,
                    así que nunca queda un hueco vacío o roto. */}
                {!tecladoAbierto && !modoLigero && !pantallaOculta && (
                  <iframe
                    src="https://player.vimeo.com/video/1218704734?autoplay=1&loop=1&muted=1&background=1&autopause=0&controls=0"
                    title="Video del Guardián del Templo"
                    allow="autoplay; fullscreen; picture-in-picture"
                    loading="eager"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                )}
                <div className="gc-video-vineta" aria-hidden="true"></div>
              </div>
            </div>

            <div className="gc-contenido">
              <div className="gc-encabezado">
                <span className="gc-chispa c1">✦</span>
                <span className="gc-chispa c2">✧</span>
                <span className="gc-chispa c3">✦</span>
                <h1 className="gc-titulo"><span className="gc-subrayado"></span>Guía de la Propotienda</h1>
              </div>

              <div className="gc-chat">
                {mensajes.map(m => (
                  <div
                    key={m.id}
                    ref={el => { if (el) msgRefs.current[m.id] = el; }}
                    className={'gc-msg ' + m.tipo}
                  >
                    {m.tipo === 'bot' && <div className="gc-msg-cuerpo" dangerouslySetInnerHTML={{ __html: formatear(m.texto) }} />}
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
                    {q}
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
                    onFocus={onEntradaFocus}
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
/* ================= RESET DE PUNTERO (fix del bug) =================
   Se fuerza cursor visible en TODO el árbol del overlay con máxima
   especificidad + !important. Esto gana sobre casi cualquier regla
   global tipo "* { cursor: none }" que exista en el resto de la app,
   sin necesidad de tocar esos archivos. */
.gc-overlay, .gc-overlay *{ cursor: auto !important; }
.gc-overlay button, .gc-overlay [role="button"],
.gc-overlay .gc-chip, .gc-overlay .gc-enviar, .gc-overlay .gc-close,
.gc-overlay .gc-accion, .gc-overlay .gc-reintentar{ cursor: pointer !important; }
.gc-overlay button:disabled{ cursor: not-allowed !important; }
.gc-overlay .gc-textarea{ cursor: text !important; }
.gc-overlay iframe{ pointer-events: none; }

.gc-overlay{
  position:fixed; inset:0; z-index:2147483647;
  height:100vh;
  display:flex; flex-direction:column;
  background:#0a0e17;
  font-family:'Inter', sans-serif;
  color:#eef1f7;
  contain: layout paint style;
}
@supports (height: 100dvh){
  .gc-overlay{ height:100dvh; }
}

/* Fondo decorativo: esferas de luz, ahora en una capa propia con
   will-change/contain aisladas del flujo de scroll, para que el
   navegador no tenga que repintar nada más al animarlas. */
.gc-fondo{ position:fixed; inset:0; z-index:0; overflow:hidden; pointer-events:none; contain:strict; }
.gc-esfera{ position:absolute; top:50%; left:50%; border-radius:50%; filter:blur(90px); mix-blend-mode:screen; opacity:0.9; will-change:transform; }
.gc-esfera.naranja{ width:64vmax; height:64vmax; background:radial-gradient(circle, #FA9238 0%, rgba(250,146,56,0) 72%); animation:gcMoverNaranja 34s ease-in-out infinite; }
.gc-esfera.amarillo{ width:56vmax; height:56vmax; background:radial-gradient(circle, #F7BD21 0%, rgba(247,189,33,0) 72%); animation:gcMoverAmarillo 47s ease-in-out infinite; animation-delay:-9s; }
.gc-esfera.cian{ width:68vmax; height:68vmax; background:radial-gradient(circle, #5FDCFD 0%, rgba(95,220,253,0) 72%); animation:gcMoverCian 41s ease-in-out infinite; animation-delay:-21s; }
.gc-esfera.morado{ width:60vmax; height:60vmax; background:radial-gradient(circle, #6141D5 0%, rgba(97,65,213,0) 72%); animation:gcMoverMorado 26s ease-in-out infinite; animation-delay:-4s; }
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
  width:34px; height:34px; border-radius:50%; font-size:16px; flex-shrink:0; pointer-events:auto;
  transition:background .15s ease, border-color .15s ease;
}
.gc-close:hover{ background:rgba(0,0,0,0.7); border-color:rgba(255,255,255,0.45); }

.gc-scroll{
  position:relative; z-index:1;
  flex:1; min-height:0; overflow-y:auto; overflow-x:hidden;
  display:flex; justify-content:center;
  padding:0 14px 24px;
  /* Desactiva "scroll anchoring" del navegador: sin esto, Chrome/Edge en
     PC intentan re-ajustar el scroll cada vez que el video cambia de
     tamaño (al encogerse en el header sticky), lo que dispara de nuevo
     el cálculo de tamaño y así en bucle — el video "vibra" chico/grande
     sin parar. Con overflow-anchor:none el navegador deja de "corregir"
     el scroll por su cuenta y el encogido queda estable. */
  overflow-anchor: none;
}
.gc-shell{ width:100%; max-width:676px; }

.gc-encabezado{ text-align:center; position:relative; margin:16px 0 14px; }
.gc-titulo{ font-family:'Poppins', sans-serif; font-weight:800; font-size:22px; color:#fff; letter-spacing:-0.01em; margin:0; position:relative; display:inline-block; }
.gc-subrayado{ position:absolute; left:6%; right:6%; top:-10px; height:2px; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent); }
.gc-chispa{ position:absolute; font-size:16px; color:#f2c94c; filter:drop-shadow(0 0 6px rgba(242,201,76,0.7)); animation:gcDestello 2.6s ease-in-out infinite; }
.gc-chispa.c1{ top:-14px; left:14%; animation-delay:.2s; }
.gc-chispa.c2{ top:6px; right:12%; font-size:12px; animation-delay:1s; }
.gc-chispa.c3{ bottom:-8px; right:26%; font-size:10px; animation-delay:1.6s; }
@keyframes gcDestello{ 0%,100%{ opacity:.35; transform:scale(0.85);} 50%{ opacity:1; transform:scale(1.05);} }

.gc-ventana{ position:relative; border-radius:18px; background:#141a2b; border:1px solid rgba(255,255,255,0.06); box-shadow:0 20px 50px rgba(0,0,0,0.45); margin-bottom:16px; }
.gc-ventana-header{ position:sticky; top:0; z-index:4; border-radius:18px 18px 0 0; overflow:hidden; background:#1b2338; box-shadow:0 10px 18px -12px rgba(0,0,0,0.6); overflow-anchor:none; }
.gc-contenido{ border-radius:0 0 18px 18px; overflow:hidden; background:#141a2b; }
.gc-barra-ventana{ display:flex; align-items:center; justify-content:center; position:relative; padding:10px 14px; background:#1b2338; border-bottom:1px solid rgba(255,255,255,0.05); }
.gc-puntos{ position:absolute; left:14px; display:flex; gap:6px; }
.gc-puntos span{ width:9px; height:9px; border-radius:50%; background:rgba(255,255,255,0.18); }
.gc-etiqueta{ font-size:11px; letter-spacing:0.10em; text-transform:uppercase; color:#8b93a7; font-weight:600; }

.gc-video-loop{ position:relative; height:230px; background:radial-gradient(circle at 30% 20%, rgba(47,214,217,0.25), transparent 55%), radial-gradient(circle at 75% 75%, rgba(242,201,76,0.18), transparent 50%), #0e1424; display:flex; align-items:center; justify-content:center; overflow:hidden; transition:height .1s linear; overflow-anchor:none; }
.gc-video-loop iframe{ position:absolute; top:50%; left:50%; width:100%; height:100%; min-width:100%; min-height:100%; transform:translate(-50%,-50%) scale(1.6); border:0; z-index:0; }
.gc-video-vineta{ position:absolute; inset:0; z-index:1; pointer-events:none; box-shadow:inset 0 -30px 40px -10px rgba(14,20,36,0.55); }
.gc-ventana-header.is-compact .gc-barra-ventana{ padding:5px 12px; }
.gc-ventana-header.is-compact .gc-etiqueta{ font-size:9px; }
.gc-ventana-header.is-compact .gc-puntos span{ width:6px; height:6px; }

.gc-chat{ padding:16px 14px 4px; display:flex; flex-direction:column; gap:12px; }
.gc-msg{ max-width:88%; padding:11px 14px; border-radius:14px; font-size:13.5px; line-height:1.5; }
.gc-msg.bot{ align-self:flex-start; background:#161d30; border:1px solid rgba(255,255,255,0.05); border-top-left-radius:3px; }
.gc-msg.bot strong{ color:#f2c94c; font-weight:700; }
.gc-msg.bot ul{ margin:6px 0; padding-left:18px; }
.gc-msg.bot li{ margin-bottom:4px; }
.gc-msg.user{ align-self:flex-end; background:linear-gradient(135deg, #f6c343, #e8962e); color:#26190a; font-weight:600; border-top-right-radius:3px; }
.gc-msg.error{ align-self:center; background:rgba(160,40,40,0.16); border:1px solid rgba(220,90,90,0.35); color:#f3c8c8; font-size:13px; max-width:96%; text-align:left; }
.gc-detalle{ display:block; margin-top:6px; font-size:11.5px; color:#e0a5a5; word-break:break-word; }
.gc-msg.error button{ margin-top:8px; background:rgba(242,201,76,0.16); border:1px solid rgba(242,201,76,0.16); color:#f2c94c; border-radius:8px; padding:6px 10px; font-size:12.5px; }

.gc-thinking{ align-self:flex-start; display:flex; gap:5px; padding:12px 15px; }
.gc-thinking span{ width:6px; height:6px; border-radius:50%; background:#f2c94c; animation:gcPulso 1.1s ease-in-out infinite; }
.gc-thinking span:nth-child(2){ animation-delay:.15s; }
.gc-thinking span:nth-child(3){ animation-delay:.3s; }
@keyframes gcPulso{ 0%,100%{ opacity:.25; transform:translateY(0);} 50%{ opacity:1; transform:translateY(-3px);} }

.gc-acciones{ display:flex; gap:6px; justify-content:center; padding:6px 12px 0; }
.gc-accion{ display:flex; align-items:center; gap:4px; background:#1b2338; border:1px solid rgba(255,255,255,0.06); color:#8b93a7; font-size:10.5px; font-weight:600; padding:4px 9px; border-radius:8px; position:relative; transition:color .15s ease, border-color .15s ease; }
.gc-accion:hover{ color:#eef1f7; border-color:rgba(255,255,255,0.15); }

.gc-preguntas{ display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:10px 12px 0; border-top:1px solid rgba(255,255,255,0.05); margin-top:2px; }
.gc-chip{ font-family:'Inter', sans-serif; font-size:12px; line-height:1.35; font-weight:600; color:#f2c94c; background:rgba(242,201,76,0.08); border:1px solid rgba(242,201,76,0.16); border-radius:12px; padding:9px 12px; transition:background .18s ease; position:relative; text-align:left; white-space:normal; }
.gc-chip:hover{ background:rgba(242,201,76,0.16); }
.gc-chip:disabled{ opacity:.4; }

.gc-input-zona{ position:sticky; bottom:0; z-index:3; background:#141a2b; padding-bottom:env(safe-area-inset-bottom); }
.gc-input-bar{ display:flex; align-items:flex-end; gap:8px; padding:12px 10px 2px; }
.gc-textarea{ flex:1; resize:none; background:#1b2338; border:1px solid rgba(255,255,255,0.08); border-radius:24px; color:#eef1f7; font-family:'Inter', sans-serif; font-size:13px; line-height:1.4; padding:13px 20px; max-height:110px; outline:none; position:relative; }
.gc-textarea:focus{ border-color:#f2c94c; }
.gc-textarea::placeholder{ color:#8b93a7; }
.gc-enviar{ width:42px; height:42px; flex:none; border-radius:50%; background:linear-gradient(135deg, #f6c343, #e8962e); border:none; color:#26190a; font-size:18px; display:flex; align-items:center; justify-content:center; position:relative; }
.gc-enviar:disabled{ opacity:.4; }
.gc-contador{ text-align:right; font-size:10.5px; color:#8b93a7; padding:0 22px 6px; user-select:none; }
.gc-contador.cerca{ color:#f2c94c; }
.gc-contador.lleno{ color:#e0685a; }
.gc-footer-note{ text-align:center; font-size:11.5px; color:#8b93a7; padding:6px 20px 4px; }
.gc-overlay.gc-teclado-abierto .gc-footer-note{ display:none; }
.gc-overlay.gc-teclado-abierto .gc-video-loop{ height:0 !important; min-height:0; }
.gc-overlay.gc-teclado-abierto .gc-encabezado{ display:none; }
.gc-overlay.gc-teclado-abierto .gc-acciones{ display:none; }
.gc-overlay.gc-teclado-abierto .gc-preguntas{ display:none; }
.gc-overlay.gc-teclado-abierto .gc-chat{ padding-top:8px; }
/* Refuerzo extra de memoria/CPU: mientras el teclado está abierto (el
   momento más delicado, justo cuando iOS puede matar el WebView por
   presión de memoria), pausamos las esferas de fondo animadas — ya no
   se ven de todos modos porque el resto del panel también se compacta. */
.gc-overlay.gc-teclado-abierto .gc-esfera{ animation-play-state:paused !important; }

@media (max-height:520px){
  .gc-scroll{ padding:0 10px 20px; }
  .gc-encabezado{ margin:8px 0 6px; }
  .gc-titulo{ font-size:19px; }
  .gc-chispa{ display:none; }
  .gc-barra-ventana{ padding:6px 12px; }
  .gc-etiqueta{ font-size:9.5px; }
  .gc-chat{ padding:12px 14px 4px; }
}
@media (max-width:420px){
  .gc-preguntas{ grid-template-columns:1fr; }
}

/* Gama baja / móvil: menos esferas activas y blur más barato, para que
   el panel se sienta igual de fluido en un equipo modesto. */
@media (max-width:600px){
  .gc-esfera{ filter:blur(60px); opacity:.75; }
  .gc-esfera.amarillo, .gc-esfera.morado{ display:none; }
}
@media (prefers-reduced-motion: reduce){
  .gc-esfera, .gc-chispa, .gc-thinking span{ animation:none !important; }
}

/* ================= MODO LIGERO =================
   Se activa de entrada (pocos núcleos, poca RAM, red limitada o
   "reducir movimiento" del sistema — ver detectarGamaBajaSincrona) y
   además puede activarse después si la medición de fps en vivo detecta
   que el equipo no sostiene ~45fps. Con esto: el video de fondo nunca
   se llega a cargar (ver el JSX del iframe), y aquí en CSS se apagan
   los efectos más caros de componer (blur, animación de las esferas,
   brillo animado que sigue al cursor), para que el chat se sienta
   fluido incluso en equipos modestos como un teléfono de gama
   media/baja, sin depender de arreglar nada en ese equipo. */
.gc-ligero .gc-esfera{ filter:none; opacity:.35; animation:none; will-change:auto; }
.gc-ligero .gc-esfera.amarillo, .gc-ligero .gc-esfera.morado{ display:none; }
.gc-ligero .gc-video-loop{ transition:none; }
.gc-ligero .gc-ventana::before, .gc-ligero .gc-ventana::after,
.gc-ligero .gc-chip::before, .gc-ligero .gc-chip::after,
.gc-ligero .gc-accion::before, .gc-ligero .gc-accion::after,
.gc-ligero .gc-textarea::before, .gc-ligero .gc-textarea::after,
.gc-ligero .gc-enviar::before, .gc-ligero .gc-enviar::after{ display:none; }

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
