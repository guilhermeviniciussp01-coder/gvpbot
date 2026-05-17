import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/supabaseClient';
import { TrialBanner, PastDueBanner } from '@/components/ui/AccessGate';

/* ── Navigation config ── */
const NAV_MAIN = [
  { label: 'Dashboard',   icon: '📊', path: 'Dashboard'  },
  { label: 'WhatsApp',    icon: '🟢', path: 'WhatsApp',  dot: 'connected' },
  { label: 'Conversas',   icon: '💬', path: 'Chat',       badge: 5 },
  { label: 'IA',          icon: '🤖', path: 'IA'         },
  { label: 'Automações',  icon: '🔀', path: 'Automacoes' },
  { label: 'Leads',       icon: '👥', path: 'Leads'      },
  { label: 'CRM',         icon: '🎯', path: 'CRM'        },
  { label: 'Analytics',   icon: '📈', path: 'Analytics'  },
];
const NAV_SYSTEM = [
  { label: 'Planos',        icon: '💳', path: 'Planos'        },
  { label: 'Configurações', icon: '⚙️', path: 'Configuracoes' },
];

const PLAN_COLORS = {
  trial:   { label: 'Trial',   color: '#F59E0B', bg: 'rgba(245,158,11,.12)' },
  starter: { label: 'Starter', color: '#64748B', bg: 'rgba(100,116,139,.12)' },
  pro:     { label: 'Pro',     color: '#3B82F6', bg: 'rgba(59,130,246,.15)'  },
  premium: { label: 'Premium', color: '#8B5CF6', bg: 'rgba(139,92,246,.15)'  },
};

function NavItem({ item, collapsed, active, onClick }) {
  const [hover, setHover] = useState(false);
  const bg    = active ? 'rgba(59,130,246,.14)' : hover ? 'rgba(255,255,255,.05)' : 'transparent';
  const color = active ? '#60A5FA' : hover ? '#F8FAFC' : '#94A3B8';

  return (
    <Link
      to={createPageUrl(item.path)}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : '.65rem',
        padding: collapsed ? '.68rem' : '.6rem .82rem',
        borderRadius: '10px', background: bg, color,
        fontWeight: active ? 700 : 500, fontSize: '.87rem',
        textDecoration: 'none', transition: 'all .15s',
        justifyContent: collapsed ? 'center' : 'flex-start',
        position: 'relative',
      }}
    >
      {/* Active indicator */}
      {active && (
        <div style={{
          position: 'absolute', left: 0, top: '20%', height: '60%',
          width: '3px', borderRadius: '0 2px 2px 0',
          background: 'linear-gradient(180deg,#3B82F6,#8B5CF6)',
        }} />
      )}

      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>

      {!collapsed && (
        <>
          <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>
          {item.badge && (
            <span style={{
              background: '#EF4444', color: 'white', borderRadius: '100px',
              padding: '.06rem .45rem', fontSize: '.62rem', fontWeight: 800,
            }}>{item.badge}</span>
          )}
        </>
      )}
    </Link>
  );
}

export default function Layout({ children, currentPageName }) {
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [user,        setUser]        = useState(null);
  const location = useLocation();
  const W = collapsed ? '66px' : '234px';

useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      setUser({
        full_name: session.user.user_metadata?.full_name || session.user.email,
        email: session.user.email,
        plan: session.user.user_metadata?.plano || 'trial',
        plan_status: 'active',
        is_admin: false,
      });
    } else {
      setUser(null);
    }
  });
  return () => subscription.unsubscribe();
}, []);
  /* Close mobile drawer on route change */
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

  const planC = PLAN_COLORS[user?.plan] || PLAN_COLORS.trial;
  const initials = (user?.full_name || user?.email || '?').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070C18', fontFamily: 'Inter,sans-serif', color: '#F8FAFC' }}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 48, backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: W, flexShrink: 0, height: '100vh',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5,9,20,.99)',
        borderRight: '1px solid rgba(255,255,255,.07)',
        display: 'flex', flexDirection: 'column',
        transition: 'width .28s cubic-bezier(.4,0,.2,1)',
        overflowX: 'hidden', overflowY: 'auto',
        // Mobile: hidden off-screen, slides in
        ...(mobileOpen
          ? { position: 'fixed', height: '100%' }
          : {}),
      }}>

        {/* Logo row */}
        <div style={{
          height: '62px', flexShrink: 0,
          display: 'flex', alignItems: 'center',
          padding: collapsed ? '0 1rem' : '0 1.1rem',
          borderBottom: '1px solid rgba(255,255,255,.07)',
          gap: '.7rem',
        }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
            background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.9rem', boxShadow: '0 0 18px rgba(59,130,246,.35)',
          }}>🤖</div>

          {!collapsed && (
            <>
              <span style={{ fontSize: '1.05rem', fontWeight: 900, whiteSpace: 'nowrap', flex: 1 }}>
                GVP<span style={{ color: '#3B82F6' }}>BOT</span>
              </span>
              <button onClick={() => setCollapsed(true)} style={collapseBtn} title="Recolher">◀</button>
            </>
          )}

          {collapsed && (
            <button onClick={() => setCollapsed(false)} style={{ ...collapseBtn, margin: '0 auto' }} title="Expandir">▶</button>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '.6rem .45rem', display: 'flex', flexDirection: 'column', gap: '.08rem' }}>

          {!collapsed && (
            <div style={sectionLabel}>Principal</div>
          )}

          {NAV_MAIN.map(item => (
            <NavItem key={item.path} item={item} collapsed={collapsed} active={isActive(item.path)} />
          ))}

          <div style={{ flex: 1, minHeight: '1rem' }} />

          {!collapsed && (
            <div style={sectionLabel}>Sistema</div>
          )}

          {NAV_SYSTEM.map(item => (
            <NavItem key={item.path} item={item} collapsed={collapsed} active={isActive(item.path)} />
          ))}

          {/* Admin link — only for admins */}
          {user?.is_admin && (
            <Link
              to={createPageUrl('Admin')}
              style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : '.65rem',
                padding: collapsed ? '.68rem' : '.6rem .82rem',
                borderRadius: '10px', marginTop: '.25rem',
                background: isActive('Admin') ? 'rgba(239,68,68,.12)' : 'transparent',
                border: `1px dashed ${isActive('Admin') ? 'rgba(239,68,68,.35)' : 'rgba(239,68,68,.18)'}`,
                color: isActive('Admin') ? '#FCA5A5' : '#64748B',
                fontWeight: isActive('Admin') ? 700 : 500, fontSize: '.87rem',
                textDecoration: 'none', transition: 'all .15s',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>🛡️</span>
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>Admin</span>}
            </Link>
          )}
        </nav>

        {/* User card */}
        {user && (
          <div style={{
            padding: '.8rem .9rem',
            borderTop: '1px solid rgba(255,255,255,.07)',
            display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : '.7rem', flexShrink: 0,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            {/* Avatar */}
            <div style={{
              width: '33px', height: '33px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.7rem', fontWeight: 800, border: '2px solid rgba(59,130,246,.3)',
            }}>{initials}</div>

            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '.8rem', fontWeight: 700,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{user.full_name || user.email}</div>
                  <span style={{
                    padding: '.1rem .42rem', borderRadius: '100px',
                    fontSize: '.6rem', fontWeight: 800,
                    background: planC.bg, color: planC.color,
                  }}>{planC.label}</span>
                </div>
                <button
                  onClick={logout}
                  title="Sair"
                  style={{
                    background: 'none', border: 'none', color: '#475569',
                    cursor: 'pointer', fontSize: '.88rem', padding: '.2rem',
                    borderRadius: '6px', flexShrink: 0,
                    transition: 'color .15s',
                  }}
                  onMouseOver={e => e.currentTarget.style.color = '#EF4444'}
                  onMouseOut={e  => e.currentTarget.style.color = '#475569'}
                >⬅️</button>
              </>
            )}
          </div>
        )}
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Top bar */}
        <header style={{
          height: '62px', flexShrink: 0,
          display: 'flex', alignItems: 'center',
          padding: '0 1.5rem', gap: '1rem',
          background: 'rgba(5,9,20,.97)',
          borderBottom: '1px solid rgba(255,255,255,.07)',
          backdropFilter: 'blur(20px)',
          position: 'sticky', top: 0, zIndex: 40,
        }}>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            style={{ display: 'none', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.2rem' }}
            className="ham"
          >☰</button>

          {/* Page title */}
          <h1 style={{ flex: 1, fontSize: '.95rem', fontWeight: 800, letterSpacing: '-.2px', margin: 0 }}>
            {currentPageName}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
            {/* Online badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '.4rem',
              padding: '.28rem .75rem', borderRadius: '100px',
              background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#22C55E', display: 'inline-block',
                animation: 'pulseDot 2s infinite',
              }} />
              <span style={{ fontSize: '.7rem', color: '#22C55E', fontWeight: 600 }}>Online</span>
            </div>

            {/* Notifications */}
            <button style={{
              position: 'relative', width: '36px', height: '36px',
              borderRadius: '10px', background: 'rgba(255,255,255,.05)',
              border: '1px solid rgba(255,255,255,.08)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem',
            }}>
              🔔
              <div style={{
                position: 'absolute', top: '5px', right: '5px',
                width: '7px', height: '7px', borderRadius: '50%',
                background: '#EF4444', border: '1.5px solid #070C18',
              }} />
            </button>

            {/* Avatar */}
            {user && (
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer',
                background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '.75rem', fontWeight: 800,
                border: '2px solid rgba(59,130,246,.3)',
              }} title={user.full_name || user.email}>{initials}</div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          <TrialBanner />
          <PastDueBanner />
          {children}
        </main>
      </div>

      <style>{`
        @keyframes pulseDot {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,.5); }
          50%      { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        @media (max-width: 768px) {
          .ham { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

const collapseBtn = {
  background: 'none', border: 'none', color: '#475569', cursor: 'pointer',
  fontSize: '.85rem', padding: '.25rem .35rem', borderRadius: '6px',
  fontFamily: 'inherit', transition: 'color .15s',
};
const sectionLabel = {
  fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '1.2px', color: '#2D3F56',
  padding: '.35rem .82rem .15rem', marginTop: '.4rem',
};
