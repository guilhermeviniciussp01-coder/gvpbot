import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { auth } from '@/api/base44Client';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '📊', path: '/Dashboard' },
  { label: 'Conversas', icon: '💬', path: '/Chat', badge: null },
  { label: 'Leads', icon: '👥', path: '/Leads' },
  { label: 'CRM', icon: '🎯', path: '/CRM' },
  { label: 'Automações', icon: '🔀', path: '/Automacoes' },
  { label: 'Campanhas', icon: '📣', path: '/Campanhas' },
  { label: 'Analytics', icon: '📈', path: '/Analytics' },
];

const BOTTOM_ITEMS = [
  { label: 'Configurações', icon: '⚙️', path: '/Configuracoes' },
  { label: 'Planos', icon: '💳', path: '/Planos' },
];

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(3);
  const navigate = useNavigate();

  useEffect(() => {
    auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await auth.logout();
    navigate('/');
  };

  const sidebarWidth = collapsed ? '70px' : '240px';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0A0F1E', fontFamily: 'Inter, sans-serif', color: '#F8FAFC' }}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 49, backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* SIDEBAR */}
      <aside style={{
        width: sidebarWidth, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
        background: 'rgba(10,15,30,.98)', borderRight: '1px solid rgba(255,255,255,.07)',
        display: 'flex', flexDirection: 'column', transition: 'width .3s cubic-bezier(.4,0,.2,1)',
        zIndex: 50, overflowX: 'hidden',
        // Mobile
        '@media(max-width:768px)': {
          position: 'fixed', left: mobileOpen ? 0 : '-240px',
          width: '240px', transition: 'left .3s ease',
        }
      }}
        className="sidebar-desktop"
      >
        {/* Logo */}
        <div style={{
          height: '64px', display: 'flex', alignItems: 'center',
          padding: collapsed ? '0 1rem' : '0 1.25rem',
          borderBottom: '1px solid rgba(255,255,255,.07)',
          gap: '.75rem', flexShrink: 0
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem',
            boxShadow: '0 0 20px rgba(59,130,246,.35)',
          }}>🤖</div>
          {!collapsed && (
            <span style={{ fontSize: '1.1rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
              GVP<span style={{ color: '#3B82F6' }}>BOT</span>
            </span>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '.9rem', padding: '.25rem', borderRadius: '6px' }}
            >‹</button>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '.9rem', padding: '.25rem', borderRadius: '6px', marginLeft: '-4px' }}
            >›</button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '.75rem .5rem', display: 'flex', flexDirection: 'column', gap: '.15rem', overflowY: 'auto' }}>
          {!collapsed && <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#475569', padding: '.3rem .75rem .2rem', marginBottom: '.25rem' }}>Principal</div>}

          {NAV_ITEMS.map(item => {
            const isActive = currentPageName === item.path.slice(1) || window.location.pathname.includes(item.path);
            return (
              <Link
                key={item.path}
                to={createPageUrl(item.path.slice(1))}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.7rem',
                  padding: collapsed ? '.7rem' : '.65rem .85rem',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(59,130,246,.15)' : 'transparent',
                  color: isActive ? '#60A5FA' : '#94A3B8',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '.88rem', textDecoration: 'none',
                  transition: 'all .15s', position: 'relative',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onMouseOver={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.color = '#F8FAFC'; } }}
                onMouseOut={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; } }}
              >
                <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                {!collapsed && item.badge !== undefined && (
                  <span style={{
                    marginLeft: 'auto', background: '#3B82F6', color: 'white',
                    borderRadius: '100px', padding: '.1rem .5rem', fontSize: '.65rem', fontWeight: 800
                  }}>{item.badge || '●'}</span>
                )}
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: '3px', height: '60%', borderRadius: '0 3px 3px 0',
                    background: 'linear-gradient(180deg,#3B82F6,#8B5CF6)'
                  }} />
                )}
              </Link>
            );
          })}

          <div style={{ flex: 1 }} />

          {!collapsed && <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#475569', padding: '.3rem .75rem .2rem', marginTop: '.5rem' }}>Sistema</div>}
          {BOTTOM_ITEMS.map(item => {
            const isActive = currentPageName === item.path.slice(1) || window.location.pathname.includes(item.path);
            return (
              <Link
                key={item.path}
                to={createPageUrl(item.path.slice(1))}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.7rem',
                  padding: collapsed ? '.7rem' : '.65rem .85rem',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(59,130,246,.15)' : 'transparent',
                  color: isActive ? '#60A5FA' : '#94A3B8',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '.88rem', textDecoration: 'none', transition: 'all .15s',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
              >
                <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        {!collapsed && user && (
          <div style={{
            padding: '1rem', borderTop: '1px solid rgba(255,255,255,.07)',
            display: 'flex', alignItems: 'center', gap: '.75rem',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.78rem', fontWeight: 700
            }}>
              {(user.full_name || user.email || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name || user.email}</div>
              <div style={{ fontSize: '.68rem', color: '#22C55E' }}>● {user.plan === 'trial' ? 'Trial ativo' : user.plan || 'Ativo'}</div>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '.85rem' }} title="Sair">⬅️</button>
          </div>
        )}
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{
          height: '64px', flexShrink: 0, display: 'flex', alignItems: 'center',
          padding: '0 1.5rem', gap: '1rem',
          background: 'rgba(10,15,30,.95)', borderBottom: '1px solid rgba(255,255,255,.07)',
          backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 30,
        }}>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.2rem', display: 'none' }}
            className="mobile-menu-btn"
          >☰</button>

          {/* Page title */}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>{currentPageName || 'Dashboard'}</h1>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <button style={{
              position: 'relative', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
              borderRadius: '10px', width: '38px', height: '38px', cursor: 'pointer', color: '#94A3B8', fontSize: '1rem',
            }}>
              🔔
              {notifications > 0 && (
                <div style={{
                  position: 'absolute', top: '4px', right: '4px',
                  width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444',
                  border: '1.5px solid #0A0F1E'
                }} />
              )}
            </button>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.8rem', fontWeight: 700, cursor: 'pointer'
                }}>
                  {(user.full_name || user.email || '?')[0].toUpperCase()}
                </div>
                <div style={{ display: 'none' }}>
                  <span style={{ fontSize: '.82rem', fontWeight: 600 }}>{user.full_name || user.email}</span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media(max-width:768px) {
          .sidebar-desktop { position: fixed !important; left: ${mobileOpen ? '0' : '-240px'} !important; width: 240px !important; transition: left .3s ease !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
