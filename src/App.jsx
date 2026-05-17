import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, useEffect, useState } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import Layout from '@/components/layout/Layout';
import { Spinner } from '@/components/ui/Button';
import { supabase } from '@/api/supabaseClient';

// Public pages
import LandingPage   from '@/pages/LandingPage';
import Login         from '@/pages/Login';
import Cadastro      from '@/pages/Cadastro';

// App pages
import Dashboard     from '@/pages/Dashboard';
import Leads         from '@/pages/Leads';
import CRM           from '@/pages/CRM';
import Chat          from '@/pages/Chat';
import Analytics     from '@/pages/Analytics';
import Configuracoes from '@/pages/Configuracoes';
import Planos        from '@/pages/Planos';
import WhatsApp      from '@/pages/WhatsApp';
import IA            from '@/pages/IA';
import Automacoes    from '@/pages/Automacoes';
import Admin         from '@/pages/Admin';

function AppLoader() {
  return (
    <div style={{ minHeight:'100vh', background:'#070C18', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'1.25rem' }}>
      <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', boxShadow:'0 0 30px rgba(59,130,246,.4)' }}>🤖</div>
      <Spinner size={22} color="#3B82F6" />
    </div>
  );
}

// ── Rota protegida — redireciona para login se não estiver logado ──
function ProtectedRoute({ Page, name }) {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <AppLoader />;
  if (!session) return <Navigate to="/Login" replace />;

  return (
    <Layout currentPageName={name}>
      <Page />
    </Layout>
  );
}

const PUBLIC_ROUTES = [
  { path: '/',             el: <LandingPage /> },
  { path: '/LandingPage',  el: <LandingPage /> },
  { path: '/landing',      el: <LandingPage /> },
  { path: '/Login',        el: <Login /> },
  { path: '/login',        el: <Login /> },
  { path: '/Cadastro',     el: <Cadastro /> },
  { path: '/cadastro',     el: <Cadastro /> },
  { path: '/registro',     el: <Cadastro /> },
];

const APP_ROUTES = [
  { paths: ['/Dashboard',     '/dashboard'],     name: 'Dashboard',               Page: Dashboard     },
  { paths: ['/Leads',         '/leads'],          name: 'Leads',                   Page: Leads         },
  { paths: ['/CRM',           '/crm'],            name: 'CRM',                     Page: CRM           },
  { paths: ['/Chat',          '/chat'],           name: 'Conversas',               Page: Chat          },
  { paths: ['/Analytics',     '/analytics'],      name: 'Analytics',               Page: Analytics     },
  { paths: ['/WhatsApp',      '/whatsapp'],       name: 'WhatsApp',                Page: WhatsApp      },
  { paths: ['/IA',            '/ia'],             name: 'Inteligência Artificial', Page: IA            },
  { paths: ['/Automacoes',    '/automacoes'],     name: 'Automações',              Page: Automacoes    },
  { paths: ['/Planos',        '/planos'],         name: 'Planos & Assinatura',     Page: Planos        },
  { paths: ['/Configuracoes', '/configuracoes'],  name: 'Configurações',           Page: Configuracoes },
  { paths: ['/Admin',         '/admin'],          name: 'Painel Admin',            Page: Admin         },
];

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Suspense fallback={<AppLoader />}>
          <Routes>
            {PUBLIC_ROUTES.map(r => (
              <Route key={r.path} path={r.path} element={r.el} />
            ))}
            {APP_ROUTES.flatMap(r =>
              r.paths.map(p => (
                <Route key={p} path={p} element={<ProtectedRoute Page={r.Page} name={r.name} />} />
              ))
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ToastProvider>
  );
}
