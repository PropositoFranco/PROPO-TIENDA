import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'
import './services/supabase'
import { LevelUpProvider } from './context/LevelUpContext'

// --- Auto-recuperación de "chunk load failed" ---
// Cuando hacemos un deploy nuevo, los hashes de los chunks cambian.
// Si alguien tiene la pestaña abierta desde antes del deploy, su
// index.html en memoria pide un chunk viejo que ya no existe, el
// servidor cae al fallback de SPA (HTML) y el navegador tira
// "Failed to load module script... MIME type text/html".
// Esto detecta ese caso y fuerza UN solo reload automático
// (con bandera en sessionStorage para no entrar en loop infinito).
function isChunkLoadError(message = '') {
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Failed to load module script/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /error loading dynamically imported module/i.test(message)
  );
}

function handlePossibleChunkError(message) {
  if (!isChunkLoadError(message)) return;
  const flag = 'tdp_chunk_reload_attempted';
  if (sessionStorage.getItem(flag)) return; // ya lo intentamos, no reintentar en loop
  sessionStorage.setItem(flag, '1');
  window.location.reload();
}

window.addEventListener('error', (e) => {
  handlePossibleChunkError(e?.message || '');
});

window.addEventListener('unhandledrejection', (e) => {
  handlePossibleChunkError(e?.reason?.message || String(e?.reason || ''));
});

// Limpiar la bandera cuando la carga es exitosa, para permitir
// detectar un futuro deploy sin quedar "bloqueados" tras el primer uso.
window.addEventListener('load', () => {
  setTimeout(() => sessionStorage.removeItem('tdp_chunk_reload_attempted'), 3000);
});

function Root() {
  return (
    <LevelUpProvider>
      <App />
    </LevelUpProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Root />,
)