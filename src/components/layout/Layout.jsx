import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { auth } from '@/api/base44Client';
import { TrialBanner, PastDueBanner } from '@/components/ui/AccessGate';

const NAV = [
  { label: 'Dashboard', icon: '📊', path: 'Dashboard' },
  { label: 'WhatsApp', icon: '🟢', path: 'WhatsApp' },
  { label: 'Conversas', icon: '💬', path: 'Chat', badge: 5 },
  { label: 'IA', icon: '🤖', path: 'IA' },
  { label: 'Automações', icon: '🔀', path: 'Automacoes' },
  { label: 'Leads', icon: '👥', path: 'Leads' },
  { label: 'CRM', icon: '🎯', path: 'CRM' },
  { label: 'Analytics', icon: '📈', path: 'Analytics' },
];
const NAV_BOTTOM = [
  { label: 'Planos', icon: '💳', path: 'Planos' },
  { label: 'Configurações', icon: '⚙️', path: 'Configuracoes' },
];

const PLAN_CFG = {
  trial: { label: 'Trial', color: '#F59E0B', bg: 'rgba(245,158,11,.12)' },
  starter: { label: 'Starter', color: '#64748B', bg: 'rgba(100,116,139,.12)' },
  pro: { label: 'Pro', color: '#3B82F6', bg: 'rgba(59,130,246,.15)' },
  premium: { label: 'Premium', color: '#8B5CF6', bg: 'rgba(139,92,246,.15)' },
};

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const W = collapsed ? '68px' : '236px';

  useEffect(() => {
    auth.me().then(setUser).catch(() => {
      // Mock user for demo
      setUser({ full_name: 'Guilherme Vinicius', email: 'guilherme@gvpbot.com', plan: 'pro', plan_status: 'active', is_admin: true });
    });
  }, []);

  const planC = PLAN_CFG[user?.plan] || PLAN_CFG.trial;
  const isActive = (path) => location.pathname.toLowerCase().includes(path.toLowerCase()) || currentPageName === path;

  async function logout() {
    try { await auth.logout(); } catch {}
    window.location.href = '/';
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070C18', fontFamily: 'Inter,sans-serif', color: '#F8FAFC' }}>

      {/* Mobile overlay */}
      {mobileOpen && <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 48, backdropFilter: 'blur(4px)' }} />}

      {/* SIDEBAR */}
      <aside style={{
        width: W, flexShrink: 0, height: '100vh', position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7,12,24,.99)', borderRight: '1px solid rgba(255,255,255,.07)',
        display: 'flex', flexDirection: 'column',
        transition: 'width .3s cubic-bezier(.4,0,.2,1)', overflowX: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ height: '62px', display: 'flex', alignItems: 'center', padding: collapsed ? '0 .9rem' : '0 1.1rem', borderBottom: '1px solid rgba(255,255,255,.07)', gap: '.7rem', flexShrink: 0 }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', flexShrink: 0, boxShadow: '0 0 18px rgba(59,130,246,.35)' }}>🤖</div>
          {!collapsed && <span style={{ fontSize: '1.05rem', fontWeight: 900, whiteSpace: 'nowrap' }}>GVP<span style={{ color: '#3B82F6' }}>BOT</span></span>}
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} style={collapseBtn}>‹</button>
          )}
        </div>
        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{ ...collapseBtn, margin: '.4rem auto', display: 'block' }}>›</button>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '.6rem .5rem', display: 'flex', flexDirection: 'column', gap: '.1rem', overflowY: 'auto' }}>
          {!collapsed && <div style={sectionLabel}>Principal</div>}
          {NAV.map(item => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={createPageUrl(item.path)} style={{
                display: 'flex', alignItems: 'center', gap: '.65rem',
                padding: collapsed ? '.7rem' : '.62rem .82rem', borderRadius: '10px',
                background: active ? 'rgba(59,130,246,.14)' : 'transparent',
                color: active ? '#60A5FA' : '#94A3B8', fontWeight: active ? 700 : 500,
                fontSize: '.87rem', textDecoration: 'none', transition: 'all .15s',
                justifyContent: collapsed ? 'center' : 'flex-start', position: 'relative',
              }}
                onMouseOver={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.color = '#F8FAFC'; } }}
                onMouseOut={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; } }}
              >
                {active && <div style={{ position: 'absolute', left: 0, top: '20%', height: '60%', width: '3px', borderRadius: '0 2px 2px 0', background: 'linear-gradient(180deg,#3B82F6,#8B5CF6)' }} />}
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                {!collapsed && item.badge && (
                  <span style={{ marginLeft: 'auto', background: '#EF4444', color: 'white', borderRadius: '100px', padding: '.08rem .5rem', fontSize: '.62rem', fontWeight: 800 }}>{item.badge}</span>
                )}
              </Link>
            );
          })}

          <div style={{ flex: 1 }} />

          {!collapsed && <div style={sectionLabel}>Sistema</div>}
          {NAV_BOTTOM.map(item => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={createPageUrl(item.path)} style={{
                display: 'flex', alignItems: 'center', gap: '.65rem',
                padding: collapsed ? '.7rem' : '.62rem .82rem', borderRadius: '10px',
                background: active ? 'rgba(59,130,246,.14)' : 'transparent',
                color: active ? '#60A5FA' : '#94A3B8',
                fontWeight: active ? 700 : 500, fontSize: '.87rem',
                textDecoration: 'none', transition: 'all .15s',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && item.label}
              </Link>
            );
          })}

          {/* Admin link */}
          {user?.is_admin && (
            <Link to={createPageUrl('Admin')} style={{
              display: 'flex', alignItems: 'center', gap: '.65rem',
              padding: collapsed ? '.7rem' : '.62rem .82rem', borderRadius: '10px',
              background: isActive('Admin') ? 'rgba(239,68,68,.12)' : 'transparent',
              color: isActive('Admin') ? '#FCA5A5' : '#64748B',
              fontSize: '.87rem', fontWeight: isActive('Admin') ? 700 : 500,
              textDecoration: 'none', transition: 'all .15s',
              justifyContent: collapsed ? 'center' : 'flex-start',
              border: '1px dashed rgba(239,68,68,.2)', marginTop: '.3rem',
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>🛡️</span>
              {!collapsed && 'Admin'}
            </Link>
          )}
        </nav>

        {/* User footer */}
        {user && !collapsed && (
          <div style={{ padding: '.85rem', borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', gap: '.7rem', flexShrink: 0 }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, flexShrink: 0 }}>
              {(user.full_name || user.email || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '.8rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name || user.email}</div>
              <span style={{ padding: '.1rem .45rem', borderRadius: '100px', fontSize: '.62rem', fontWeight: 700, background: planC.bg, color: planC.color }}>{planC.label}</span>
            </div>
            <button onClick={logout} title="Sair" style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '.9rem', flexShrink: 0, padding: '.2rem', borderRadius: '6px' }}>⬅️</button>
          </div>
        )}
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ height: '62px', flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 1.5rem', gap: '1rem', background: 'rgba(7,12,24,.96)', borderBottom: '1px solid rgba(255,255,255,.07)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 40 }}>
          <button onClick={() => setMobileOpen(true)} style={{ display: 'none', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.2rem' }} className="mobile-ham">☰</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '.95rem', fontWeight: 800, margin: 0 }}>{currentPageName}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
            {/* Status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.3rem .75rem', borderRadius: '100px', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulseDot 2s infinite' }} />
              <span style={{ fontSize: '.7rem', color: '#22C55E', fontWeight: 600 }}>Sistema online</span>
            </div>
            {/* Notifications */}
            <button style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem' }}>
              🔔
              <div style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', border: '1.5px solid #070C18' }} />
            </button>
            {/* Avatar */}
            {user && (
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer', border: '2px solid rgba(59,130,246,.3)' }} title={user.full_name || user.email}>
                {(user.full_name || user.email || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          <TrialBanner />
          <PastDueBanner />
          {children}
        </main>
      </div>

      <style>{`
        @keyframes pulseDot{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}50%{box-shadow:0 0 0 6px rgba(34,197,94,0)}}
        @media(max-width:768px){.mobile-ham{display:flex!important}}
      `}</style>
    </div>
  );
}

const collapseBtn = { background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '.9rem', padding: '.25rem .4rem', borderRadius: '6px', marginLeft: 'auto', fontFamily: 'Inter,sans-serif' };
const sectionLabel = { fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#334155', padding: '.3rem .82rem .15rem', marginTop: '.5rem' };
