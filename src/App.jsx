import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import Layout from '@/components/layout/Layout';
import { Spinner } from '@/components/ui/Button';

// Public pages
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Cadastro from '@/pages/Cadastro';

// App pages
import Dashboard from '@/pages/Dashboard';
import Leads from '@/pages/Leads';
import CRM from '@/pages/CRM';
import Chat from '@/pages/Chat';
import Analytics from '@/pages/Analytics';
import Configuracoes from '@/pages/Configuracoes';
import Planos from '@/pages/Planos';

const PAGE_NAMES = {
  dashboard: 'Dashboard',
  leads: 'Leads',
  crm: 'CRM',
  chat: 'Chat',
  analytics: 'Analytics',
  configuracoes: 'Configurações',
  planos: 'Planos',
};

function AppLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0F1E', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 0 30px rgba(59,130,246,.4)', animation: 'glow 2s ease-in-out infinite alternate' }}>🤖</div>
      <Spinner size={24} color="#3B82F6" />
      <style>{`@keyframes glow{0%{box-shadow:0 0 20px rgba(59,130,246,.3)}100%{box-shadow:0 0 40px rgba(59,130,246,.6)}}`}</style>
    </div>
  );
}

function AppPage({ page, name }) {
  return (
    <Layout currentPageName={name}>
      {page}
    </Layout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Suspense fallback={<AppLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/LandingPage" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/Cadastro" element={<Cadastro />} />

            {/* App */}
            <Route path="/dashboard" element={<AppPage page={<Dashboard />} name="Dashboard" />} />
            <Route path="/Dashboard" element={<AppPage page={<Dashboard />} name="Dashboard" />} />
            <Route path="/leads" element={<AppPage page={<Leads />} name="Leads" />} />
            <Route path="/Leads" element={<AppPage page={<Leads />} name="Leads" />} />
            <Route path="/crm" element={<AppPage page={<CRM />} name="CRM" />} />
            <Route path="/CRM" element={<AppPage page={<CRM />} name="CRM" />} />
            <Route path="/chat" element={<AppPage page={<Chat />} name="Chat" />} />
            <Route path="/Chat" element={<AppPage page={<Chat />} name="Chat" />} />
            <Route path="/analytics" element={<AppPage page={<Analytics />} name="Analytics" />} />
            <Route path="/Analytics" element={<AppPage page={<Analytics />} name="Analytics" />} />
            <Route path="/configuracoes" element={<AppPage page={<Configuracoes />} name="Configurações" />} />
            <Route path="/Configuracoes" element={<AppPage page={<Configuracoes />} name="Configurações" />} />
            <Route path="/planos" element={<AppPage page={<Planos />} name="Planos" />} />
            <Route path="/Planos" element={<AppPage page={<Planos />} name="Planos" />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ToastProvider>
  );
}
