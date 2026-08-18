// Fallback general de la SPA. Cloudflare tiene un bug conocido donde
// ignora la regla "/* /index.html 200" de _redirects (falso positivo de
// "infinite loop"). Esta función hace manualmente lo mismo que esa regla
// debería hacer: cualquier ruta que NO sea un archivo estático real,
// se sirve con index.html para que React Router tome el control.
//
// No toca /camino/* — esa carpeta ya tiene su propia función más
// específica (functions/camino/[[path]].js) y Cloudflare siempre prioriza
// la ruta más específica, así que esta función ni se ejecuta para /camino/*.

export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Dejar pasar archivos estáticos tal cual (imágenes, css, js, json, fuentes)
  if (/\.[a-zA-Z0-9]+$/.test(url.pathname)) {
    return context.next();
  }

  try {
    const indexRequest = new Request(new URL('/index.html', url.origin), context.request);
    return await context.env.ASSETS.fetch(indexRequest);
  } catch (err) {
    // Si algo truena, MUÉSTRALO en vez de esconderlo
    return new Response('ERROR EN FUNCION FALLBACK: ' + err.message + '\n\n' + err.stack, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
    });
  }
}