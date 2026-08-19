export async function onRequest(context) {
  const url = new URL(context.request.url);

  // 1) Página especial de instalación con instrucciones
  if (url.pathname === '/camino/instalar') {
    return installPageResponse();
  }

  // 2) Dejar pasar archivos estáticos tal cual (imágenes, css, js, json, fuentes)
  if (/\.[a-zA-Z0-9]+$/.test(url.pathname)) {
    return context.next();
  }

  // 3) Cualquier otra ruta dentro de /camino/*
  if (url.pathname.startsWith('/camino')) {
    try {
      const indexRequest = new Request(new URL('/index.html', url.origin), context.request);
      const assetResponse = await context.env.ASSETS.fetch(indexRequest);

      const rewritten = new HTMLRewriter()
        .on('#app-manifest', {
          element(el) {
            el.setAttribute('href', '/manifest-camino.json');
          },
        })
        .on('title', {
          element(el) {
            el.setInnerContent('Camino a Líder Digital');
          },
        })
                .on('head', {
          element(el) {
            el.append(
              '<meta name="apple-mobile-web-app-title" content="Camino a Líder Digital">' +
              '<link rel="apple-touch-icon" href="/icon-camino-192.png">' +
              '<script>(function(){' +
                'if("serviceWorker" in navigator){' +
                  'navigator.serviceWorker.getRegistrations().then(function(regs){' +
                    'regs.forEach(function(reg){ reg.unregister(); });' +
                  '});' +
                '}' +
                'if(window.caches){' +
                  'caches.keys().then(function(names){' +
                    'names.forEach(function(n){ caches.delete(n); });' +
                  '});' +
                '}' +
              '})();</script>',
              { html: true }
            );
          },
        })
        .transform(assetResponse);

      // Forzar que esto NUNCA se guarde en caché
      rewritten.headers.set('Cache-Control', 'no-store');
      return rewritten;

    } catch (err) {
      // Si algo truena, MUÉSTRALO en vez de esconderlo
      return new Response('ERROR EN FUNCION CAMINO: ' + err.message + '\n\n' + err.stack, {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
      });
    }
  }

  return context.next();
}

function installPageResponse() {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Instala Camino a Líder Digital</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: radial-gradient(ellipse at top, #1a0f2e 0%, #0a0612 60%, #050308 100%);
    color: #f0e6d2;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
  }
  .card {
    max-width: 420px;
    width: 100%;
    background: rgba(30, 18, 48, 0.6);
    border: 1px solid rgba(212, 175, 55, 0.35);
    border-radius: 16px;
    padding: 32px 24px;
    box-shadow: 0 0 40px rgba(120, 60, 200, 0.15);
  }
  h1 {
    font-size: 1.4rem;
    color: #d4af37;
    margin-bottom: 8px;
    letter-spacing: 0.5px;
  }
  p.sub {
    font-size: 0.95rem;
    color: #c9b8d8;
    margin-bottom: 28px;
  }
  .step {
    background: rgba(212, 175, 55, 0.08);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 14px;
    text-align: left;
  }
  .step .num {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #d4af37;
    color: #1a0f2e;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95rem;
  }
  .step .txt {
    font-size: 0.92rem;
    line-height: 1.4;
    color: #f0e6d2;
  }
  .warn {
    margin-top: 20px;
    padding: 14px;
    background: rgba(200, 60, 60, 0.12);
    border: 1px solid rgba(200, 60, 60, 0.4);
    border-radius: 10px;
    font-size: 0.88rem;
    color: #f5c9c9;
  }
  .btn {
    display: inline-block;
    margin-top: 22px;
    padding: 14px 28px;
    background: linear-gradient(135deg, #d4af37, #b8942b);
    color: #1a0f2e;
    font-weight: 700;
    border-radius: 10px;
    text-decoration: none;
    font-size: 0.95rem;
    border: none;
    cursor: pointer;
  }
  .icon { font-size: 1.4rem; }
</style>
</head>
<body>

<div class="card" id="app">
  <h1>⚔️ Camino a Líder Digital</h1>
  <p class="sub">Instala la app en tu pantalla de inicio</p>
  <div id="content"></div>
</div>

<script>
(function() {
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);
  const isInAppBrowser = /FBAN|FBAV|Instagram|WhatsApp|Line\\//.test(ua);
  const content = document.getElementById('content');

  const homeURL = 'https://propotienda.com/camino/participante/home';

  if (isInAppBrowser) {
    content.innerHTML = \`
      <div class="warn">
        <div class="icon">⚠️</div>
        Estás abriendo esto desde WhatsApp o Instagram. Antes de continuar,
        toca los <b>tres puntos (⋮)</b> o el ícono de <b>compartir</b> arriba,
        y elige <b>"Abrir en el navegador"</b> (Safari o Chrome).
      </div>
    \`;
    return;
  }

  if (isIOS) {
    content.innerHTML = \`
      <div class="step"><div class="num">1</div><div class="txt">Toca el botón de <b>Compartir</b> (el cuadrado con la flecha hacia arriba) en la barra inferior de Safari.</div></div>
      <div class="step"><div class="num">2</div><div class="txt">Desliza hacia abajo y elige <b>"Agregar a Inicio"</b>.</div></div>
      <div class="step"><div class="num">3</div><div class="txt">Toca <b>"Agregar"</b> arriba a la derecha. ¡Listo, ya tienes tu app!</div></div>
    \`;
  } else if (isAndroid) {
    content.innerHTML = \`
      <div class="step"><div class="num">1</div><div class="txt">Toca el botón de abajo para instalar con un solo toque.</div></div>
      <a href="\${homeURL}" class="btn">📲 Ir a la app e instalar</a>
    \`;
  } else {
    content.innerHTML = \`
      <div class="step"><div class="num">1</div><div class="txt">Abre este link desde tu celular (iPhone o Android) para instalar la app.</div></div>
      <a href="\${homeURL}" class="btn">Ir a la app</a>
    \`;
  }
})();
</script>

</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });
}