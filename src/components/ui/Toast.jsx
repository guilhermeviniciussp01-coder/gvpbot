import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';

const ToastContext    = createContext(null);
const NotifContext    = createContext(null);

// ── Notification store global ─────────────────────────────────────────────────
let _notifListeners = [];
let _notifStore     = [];

export function addNotification(notif) {
  const item = {
    id:      Date.now() + Math.random(),
    at:      new Date(),
    read:    false,
    icon:    notif.icon  || '🔔',
    title:   notif.title || notif.message || 'Notificação',
    body:    notif.body  || notif.message || '',
    type:    notif.type  || 'info',
  };
  _notifStore = [item, ..._notifStore].slice(0, 50);
  _notifListeners.forEach(fn => fn([..._notifStore]));
  return item;
}

function useNotifStore() {
  const [notifs, setNotifs] = useState([..._notifStore]);
  useEffect(() => {
    _notifListeners.push(setNotifs);
    return () => { _notifListeners = _notifListeners.filter(f => f !== setNotifs); };
  }, []);
  const markAllRead = useCallback(() => {
    _notifStore = _notifStore.map(n => ({ ...n, read: true }));
    _notifListeners.forEach(fn => fn([..._notifStore]));
  }, []);
  const clear = useCallback(() => {
    _notifStore = [];
    _notifListeners.forEach(fn => fn([]));
  }, []);
  return { notifs, markAllRead, clear };
}

// ── Toast + Notification Provider ────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ message, title, type = 'info', duration = 3500, notify = true, icon }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    // também adiciona na central de notificações
    if (notify) {
      addNotification({ title: title || message, body: message, type, icon });
    }
  }, []);

  const COLORS = {
    success: { border: 'rgba(34,197,94,.35)',  icon: '✅' },
    error:   { border: 'rgba(239,68,68,.35)',  icon: '❌' },
    warning: { border: 'rgba(245,158,11,.35)', icon: '⚠️' },
    info:    { border: 'rgba(59,130,246,.35)', icon: 'ℹ️' },
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'center', pointerEvents: 'none' }}>
        {toasts.map(t => {
          const c = COLORS[t.type] || COLORS.info;
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.65rem 1.4rem', background: 'rgba(10,15,30,.97)', border: `1px solid ${c.border}`, borderRadius: '100px', fontSize: '.83rem', fontWeight: 500, color: '#F8FAFC', boxShadow: '0 8px 32px rgba(0,0,0,.4)', whiteSpace: 'nowrap', animation: 'toastIn .25s ease', pointerEvents: 'auto' }}>
              <span>{c.icon}</span>
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

// ── Notification Bell Component (exportado para usar no Layout) ───────────────
export function NotificationBell() {
  const { notifs, markAllRead, clear } = useNotifStore();
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);
  const unread            = notifs.filter(n => !n.read).length;

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const TYPE_COLOR = { success: '#22C55E', error: '#EF4444', warning: '#F59E0B', info: '#3B82F6' };

  function timeAgo(date) {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60)  return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return new Date(date).toLocaleDateString('pt-BR');
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(p => !p); if (!open) markAllRead(); }}
        style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '10px', background: open ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94A3B8', transition: 'all .15s' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#EF4444', color: 'white', fontSize: '.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #070C18', animation: 'badgePop .3s ease' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '340px', background: '#0F1629', border: '1px solid rgba(255,255,255,.1)', borderRadius: '14px', boxShadow: '0 20px 60px rgba(0,0,0,.6)', zIndex: 1000, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '.88rem' }}>🔔 Notificações</span>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              {notifs.length > 0 && (
                <button onClick={clear} style={{ fontSize: '.7rem', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '.2rem .5rem', borderRadius: '5px' }}>Limpar</button>
              )}
            </div>
          </div>

          {/* Lista */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#475569' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '.5rem' }}>🔕</div>
                <div style={{ fontSize: '.82rem' }}>Nenhuma notificação</div>
              </div>
            ) : notifs.map(n => (
              <div key={n.id} style={{ padding: '.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,.04)', display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `${TYPE_COLOR[n.type] || '#3B82F6'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', flexShrink: 0 }}>
                  {n.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                  {n.body && n.body !== n.title && (
                    <div style={{ fontSize: '.75rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>
                  )}
                </div>
                <div style={{ fontSize: '.68rem', color: '#334155', flexShrink: 0, paddingTop: '.1rem' }}>{timeAgo(n.at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`@keyframes badgePop{from{transform:scale(0)}to{transform:scale(1)}}`}</style>
    </div>
  );
}
