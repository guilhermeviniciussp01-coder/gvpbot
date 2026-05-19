import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/api/supabaseClient';
import { TrialBanner, PastDueBanner } from '@/components/ui/AccessGate';
import { NotificationBell } from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MessageCircle,
  Bot,
  Zap,
  Users,
  Target,
  BarChart3,
  CreditCard,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  Sparkles,
  Phone,
} from 'lucide-react';

/* Navigation config with Lucide icons */
const NAV_MAIN = [
  { label: 'Dashboard',   Icon: LayoutDashboard, path: 'Dashboard' },
  { label: 'WhatsApp',    Icon: Phone,           path: 'WhatsApp', dot: 'connected' },
  { label: 'Conversas',   Icon: MessageCircle,   path: 'Chat', badge: 5 },
  { label: 'IA',          Icon: Bot,             path: 'IA' },
  { label: 'Automacoes',  Icon: Zap,             path: 'Automacoes' },
  { label: 'Leads',       Icon: Users,           path: 'Leads' },
  { label: 'CRM',         Icon: Target,          path: 'CRM' },
  { label: 'Analytics',   Icon: BarChart3,       path: 'Analytics' },
];

const NAV_SYSTEM = [
  { label: 'Planos',        Icon: CreditCard, path: 'Planos' },
  { label: 'Configuracoes', Icon: Settings,   path: 'Configuracoes' },
];

const PLAN_CONFIG = {
  trial:   { label: 'Trial',   color: 'text-amber-400',  bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  starter: { label: 'Starter', color: 'text-slate-400',  bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  pro:     { label: 'Pro',     color: 'text-blue-400',   bg: 'bg-blue-500/10',  border: 'border-blue-500/20' },
  premium: { label: 'Premium', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
};

function NavItem({ item, collapsed, active, onClick }) {
  const { Icon } = item;
  
  return (
    <Link
      to={createPageUrl(item.path)}
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm
        transition-all duration-200 ease-out
        ${active 
          ? 'bg-white/10 text-white shadow-lg shadow-blue-500/5' 
          : 'text-slate-400 hover:text-white hover:bg-white/5'
        }
        ${collapsed ? 'justify-center px-2.5' : ''}
      `}
    >
      {/* Active indicator */}
      {active && (
        <motion.div
          layoutId="activeNav"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-full"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}

      <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${active ? 'text-blue-400' : 'group-hover:text-blue-400'}`} />

      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          
          {item.badge && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center">
              {item.badge}
            </span>
          )}
          
          {item.dot === 'connected' && (
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          )}
        </>
      )}

      {collapsed && item.badge && (
        <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function UserMenu({ user, collapsed, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const planC = PLAN_CONFIG[user?.plan] || PLAN_CONFIG.trial;
  const initials = (user?.full_name || user?.email || '?').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`
          flex items-center gap-3 p-2 rounded-xl w-full
          hover:bg-white/5 transition-all duration-200
          ${collapsed ? 'justify-center' : ''}
        `}
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-blue-500/20 shrink-0">
          {initials}
        </div>

        {!collapsed && (
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.full_name || user?.email}
            </p>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md ${planC.bg} ${planC.color} ${planC.border} border`}>
              {planC.label}
            </span>
          </div>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute bottom-full mb-2 ${collapsed ? 'left-full ml-2' : 'left-0 right-0'}
              bg-slate-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50
              overflow-hidden min-w-[200px] z-50
            `}
          >
            <div className="p-3 border-b border-white/5">
              <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <div className="p-1.5">
              <Link
                to={createPageUrl('Configuracoes')}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Configuracoes
              </Link>
              <button
                onClick={() => { setOpen(false); onLogout(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    function buildUser(u) {
      if (!u) return null;
      return {
        full_name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || '',
        email: u.email || '',
        plan: u.user_metadata?.plano || 'trial',
        plan_status: 'active',
        is_admin: false,
      };
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(buildUser(user ?? null));
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        return;
      }
      if (session?.user) {
        (async () => {
          const { data: { user } } = await supabase.auth.getUser();
          setUser(buildUser(user ?? null));
        })();
      }
    });

    return () => authListener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  function isActive(path) {
    const p = path.toLowerCase();
    return (
      location.pathname.toLowerCase().includes(p) ||
      (currentPageName || '').toLowerCase().includes(p.replace('automacoes','automaç'))
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] font-sans text-slate-100">

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={`
          h-screen sticky top-0 z-50 flex flex-col shrink-0
          bg-[#0d0d12] border-r border-white/5
          ${mobileOpen ? 'fixed inset-y-0 left-0 w-[260px]' : 'hidden lg:flex'}
        `}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center shrink-0 border-b border-white/5 ${collapsed ? 'px-4 justify-center' : 'px-5'}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-3 flex items-center justify-between flex-1"
            >
              <span className="text-lg font-black tracking-tight">
                GVP<span className="text-blue-400">BOT</span>
              </span>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="absolute -right-3 top-6 w-6 h-6 bg-slate-800 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto scrollbar-hide">
          {!collapsed && (
            <span className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Principal
            </span>
          )}

          {NAV_MAIN.map(item => (
            <NavItem key={item.path} item={item} collapsed={collapsed} active={isActive(item.path)} />
          ))}

          <div className="flex-1 min-h-4" />

          {!collapsed && (
            <span className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Sistema
            </span>
          )}

          {NAV_SYSTEM.map(item => (
            <NavItem key={item.path} item={item} collapsed={collapsed} active={isActive(item.path)} />
          ))}

          {/* Admin link */}
          {user?.is_admin && (
            <Link
              to={createPageUrl('Admin')}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl mt-1
                border border-dashed border-red-500/30 text-slate-400
                hover:text-red-300 hover:bg-red-500/5 hover:border-red-500/50
                transition-all duration-200
                ${collapsed ? 'justify-center' : ''}
                ${isActive('Admin') ? 'bg-red-500/10 text-red-400 border-red-500/40' : ''}
              `}
            >
              <Shield className="w-[18px] h-[18px]" />
              {!collapsed && <span className="text-sm font-medium">Admin</span>}
            </Link>
          )}
        </nav>

        {/* User */}
        {user && (
          <div className={`p-3 border-t border-white/5 ${collapsed ? 'px-2' : ''}`}>
            <UserMenu user={user} collapsed={collapsed} onLogout={logout} />
          </div>
        )}
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header */}
        <header className="h-16 shrink-0 flex items-center px-4 lg:px-6 gap-4 bg-[#0d0d12]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30">
          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <h1 className="text-base font-bold tracking-tight flex-1">
            {currentPageName}
          </h1>

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-slate-400 w-64 hover:border-white/10 transition-colors cursor-pointer">
            <Search className="w-4 h-4" />
            <span className="text-sm">Buscar...</span>
            <kbd className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-white/10 rounded">K</kbd>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center gap-2">
            {/* Online status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Online</span>
            </div>

            {/* Notifications */}
            <NotificationBell />

            {/* Avatar (mobile) */}
            {user && (
              <div className="lg:hidden w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-blue-500/20">
                {(user.full_name || user.email || '?').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <TrialBanner />
          <PastDueBanner />
          {children}
        </main>
      </div>

      {/* Mobile close button */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white/10 text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Global Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

