import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

// Cria o QueryClient para o React Query (necessário para o @base44/sdk)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});

/* ── SEO ── */
(function injectSEO() {
  const H = document.head;
  const meta = (name, content, prop) => {
    const k = prop ? 'property' : 'name';
    let el = H.querySelector(`meta[${k}="${name}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute(k, name); H.appendChild(el); }
    el.setAttribute('content', content);
  };
  document.title = 'GVP BOT — Automatize seu WhatsApp com IA';
  meta('description', 'Automatize seu atendimento no WhatsApp e Instagram com Inteligência Artificial. Capture leads, responda clientes e venda 24h por dia.');
  meta('keywords', 'bot whatsapp, automação whatsapp, chatbot ia, evolution api, capturar leads, atendimento automático brasil');
  meta('robots', 'index, follow');
  meta('author', 'GVP BOT');
  meta('og:title', 'GVP BOT — Automatize seu WhatsApp com IA', true);
  meta('og:description', 'IA que vende por você 24h. Captura de leads, respostas automáticas, CRM completo.', true);
  meta('og:type', 'website', true);
  meta('og:url', 'https://gvpbot.com.br', true);
  meta('og:image', 'https://gvpbot.com.br/og-image.png', true);
  meta('og:locale', 'pt_BR', true);
  meta('og:site_name', 'GVP BOT', true);
  meta('twitter:card', 'summary_large_image');
  meta('twitter:title', 'GVP BOT — Automatize seu WhatsApp com IA');
  meta('twitter:description', 'IA que vende por você 24h. 7 dias grátis, sem cartão.');
  let fav = H.querySelector("link[rel='icon']");
  if (!fav) { fav = document.createElement('link'); fav.rel = 'icon'; H.appendChild(fav); }
  fav.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>";
  // Canonical
  let can = H.querySelector("link[rel='canonical']");
  if (!can) { can = document.createElement('link'); can.rel = 'canonical'; H.appendChild(can); }
  can.href = 'https://gvpbot.com.br';
})();

/* ── Global CSS ── */
const css = document.createElement('style');
css.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #070C18; color: #F8FAFC;
    -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.2); }
  a { text-decoration: none; color: inherit; }
  button, input, select, textarea { font-family: inherit; }
  ::selection { background: rgba(59,130,246,.3); color: #F8FAFC; }

  @keyframes spin       { to { transform: rotate(360deg); } }
  @keyframes fadeUp     { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
  @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
  @keyframes scaleIn    { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
  @keyframes shimmer    { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes pulseDot   { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)} 50%{box-shadow:0 0 0 6px rgba(34,197,94,0)} }
  @keyframes float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes glow       { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes modalIn    { from{opacity:0;transform:scale(.96) translateY(8px)} to{opacity:1;transform:none} }
  @keyframes slideRight { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:none} }
  @keyframes popIn      { 0%{transform:scale(0)} 80%{transform:scale(1.1)} 100%{transform:scale(1)} }
  @keyframes typingDot  { 0%,80%,100%{transform:scale(.5);opacity:.4} 40%{transform:scale(1);opacity:1} }
  @keyframes countUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }

  @media(max-width:768px) {
    .hide-mobile { display: none !important; }
    .mobile-full { width: 100% !important; }
  }
`;
document.head.appendChild(css);
// Limpa sessão do Base44
Object.keys(localStorage).forEach(k => {
  if (k.includes('base44')) localStorage.removeItem(k);
});
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
