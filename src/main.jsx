import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

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
