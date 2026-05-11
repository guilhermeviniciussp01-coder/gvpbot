import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ message, type = 'info', duration = 3000 }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const borders = {
    success: 'rgba(34,197,94,.3)', error: 'rgba(239,68,68,.3)',
    info: 'rgba(59,130,246,.3)', warning: 'rgba(245,158,11,.3)'
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'center',
        pointerEvents: 'none'
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '.6rem',
            padding: '.65rem 1.4rem',
            background: 'rgba(10,15,30,.97)',
            border: `1px solid ${borders[t.type] || borders.info}`,
            borderRadius: '100px', fontSize: '.83rem', fontWeight: 500,
            color: '#F8FAFC', boxShadow: '0 8px 32px rgba(0,0,0,.4)',
            whiteSpace: 'nowrap', animation: 'toastIn .3s ease',
            pointerEvents: 'auto',
          }}>
            <span>{icons[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
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
