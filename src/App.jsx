import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import Layout from '@/components/layout/Layout';
import { Spinner } from '@/components/ui/Button';

// Public
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Cadastro from '@/pages/Cadastro';

// App
import Dashboard from '@/pages/Dashboard';
import Leads from '@/pages/Leads';
import CRM from '@/pages/CRM';
import Chat from '@/pages/Chat';
import Analytics from '@/pages/Analytics';
import Configuracoes from '@/pages/Configuracoes';
import Planos from '@/pages/Planos';
import WhatsApp from '@/pages/WhatsApp';
import IA from '@/pages/IA';
import Automacoes from '@/pages/Automacoes';
import Admin from '@/pages/Admin';

function Loader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0F1E', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', boxShadow: '0 0 30px rgba(59,130,246,.4)' }}>🤖</div>
      <Spinner size={24} color="#3B82F6" />
    </div>
  );
}

function Page({ component: Component, name }) {
  return (
    <Layout currentPageName={name}>
      <Component />
    </Layout>
  );
}

export default function App() {
  const routes = [
    // Public
    { path: '/', el: <LandingPage />, pub: true },
    { path: '/LandingPage', el: <LandingPage />, pub: true },
    { path: '/landing', el: <LandingPage />, pub: true },
    { path: '/Login', el: <Login />, pub: true },
    { path: '/login', el: <Login />, pub: true },
    { path: '/Cadastro', el: <Cadastro />, pub: true },
    { path: '/cadastro', el: <Cadastro />, pub: true },
    // App
    { path: '/Dashboard', name: 'Dashboard', C: Dashboard },
    { path: '/dashboard', name: 'Dashboard', C: Dashboard },
    { path: '/Leads', name: 'Leads', C: Leads },
    { path: '/leads', name: 'Leads', C: Leads },
    { path: '/CRM', name: 'CRM', C: CRM },
    { path: '/crm', name: 'CRM', C: CRM },
    { path: '/Chat', name: 'Chat', C: Chat },
    { path: '/chat', name: 'Chat', C: Chat },
    { path: '/Analytics', name: 'Analytics', C: Analytics },
    { path: '/analytics', name: 'Analytics', C: Analytics },
    { path: '/Configuracoes', name: 'Configurações', C: Configuracoes },
    { path: '/configuracoes', name: 'Configurações', C: Configuracoes },
    { path: '/Planos', name: 'Planos', C: Planos },
    { path: '/planos', name: 'Planos', C: Planos },
    { path: '/WhatsApp', name: 'WhatsApp', C: WhatsApp },
    { path: '/whatsapp', name: 'WhatsApp', C: WhatsApp },
    { path: '/IA', name: 'Inteligência Artificial', C: IA },
    { path: '/ia', name: 'Inteligência Artificial', C: IA },
    { path: '/Automacoes', name: 'Automações', C: Automacoes },
    { path: '/automacoes', name: 'Automações', C: Automacoes },
    { path: '/Admin', name: 'Painel Admin', C: Admin },
    { path: '/admin', name: 'Painel Admin', C: Admin },
  ];

  return (
    <ToastProvider>
      <Router>
        <Suspense fallback={<Loader />}>
          <Routes>
            {routes.map(r => (
              <Route key={r.path} path={r.path} element={
                r.pub ? r.el :
                <Layout currentPageName={r.name}>
                  <r.C />
                </Layout>
              } />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ToastProvider>
  );
}
