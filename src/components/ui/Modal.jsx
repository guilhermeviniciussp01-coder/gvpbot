import { useEffect } from 'react';

export function Modal({ open, onClose, title, subtitle, icon, children, footer, size = 'md', danger = false }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const maxWidths = { sm: '400px', md: '540px', lg: '700px', xl: '900px' };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(8,14,28,.98)',
          border: `1px solid ${danger ? 'rgba(239,68,68,.25)' : 'rgba(255,255,255,.1)'}`,
          borderRadius: '20px', width: '100%', maxWidth: maxWidths[size],
          maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: danger
            ? '0 40px 80px rgba(0,0,0,.7), 0 0 40px rgba(239,68,68,.08)'
            : '0 40px 80px rgba(0,0,0,.7)',
          animation: 'modalIn .25s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {/* Header */}
        {(title || icon) && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,.08)',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
              {icon && (
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                  background: danger ? 'rgba(239,68,68,.15)' : 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                }}>{icon}</div>
              )}
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>{title}</div>
                {subtitle && <div style={{ fontSize: '.75rem', color: '#64748B', marginTop: '.1rem' }}>{subtitle}</div>}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                background: 'rgba(255,255,255,.06)', color: '#64748B', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem',
                transition: 'all .2s'
              }}
              onMouseOver={e => { e.target.style.background = 'rgba(239,68,68,.15)'; e.target.style.color = '#EF4444'; }}
              onMouseOut={e => { e.target.style.background = 'rgba(255,255,255,.06)'; e.target.style.color = '#64748B'; }}
            >✕</button>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '.75rem',
            flexShrink: 0
          }}>
            {footer}
          </div>
        )}
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.96) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, description, confirmText = 'Confirmar', loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} icon="⚠️" danger size="sm"
      footer={
        <>
          <button onClick={onClose} style={ghostBtnStyle}>Cancelar</button>
          <button onClick={onConfirm} disabled={loading} style={dangerBtnStyle}>
            {loading ? '⏳' : confirmText}
          </button>
        </>
      }
    >
      <p style={{ fontSize: '.88rem', color: '#94A3B8', lineHeight: 1.7 }}>{description}</p>
    </Modal>
  );
}

const ghostBtnStyle = {
  padding: '.6rem 1.1rem', borderRadius: '8px', fontSize: '.85rem', fontWeight: 500,
  background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
  color: '#94A3B8', cursor: 'pointer'
};
const dangerBtnStyle = {
  padding: '.6rem 1.25rem', borderRadius: '8px', fontSize: '.9rem', fontWeight: 700,
  background: 'linear-gradient(135deg,#EF4444,#DC2626)', border: 'none', color: 'white', cursor: 'pointer'
};
