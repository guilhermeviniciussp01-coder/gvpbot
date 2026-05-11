import { useState } from 'react';

export function Button({
  children, onClick, variant = 'primary', size = 'md',
  loading = false, disabled = false, icon, style = {}, type = 'button'
}) {
  const [hover, setHover] = useState(false);

  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '.45rem', border: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer',
    fontFamily: 'Inter, sans-serif', fontWeight: 700, transition: 'all .2s ease',
    opacity: disabled ? .5 : 1,
  };

  const sizes = {
    xs: { padding: '.3rem .7rem', fontSize: '.75rem', borderRadius: '8px' },
    sm: { padding: '.5rem 1rem', fontSize: '.82rem', borderRadius: '10px' },
    md: { padding: '.65rem 1.35rem', fontSize: '.9rem', borderRadius: '10px' },
    lg: { padding: '.85rem 1.75rem', fontSize: '.98rem', borderRadius: '12px' },
  };

  const variants = {
    primary: {
      background: hover ? 'linear-gradient(135deg,#2563EB,#7C3AED)' : 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
      color: 'white',
      boxShadow: hover ? '0 8px 30px rgba(59,130,246,.45)' : '0 4px 20px rgba(59,130,246,.3)',
      transform: hover ? 'translateY(-1px)' : 'none',
    },
    secondary: {
      background: hover ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.04)',
      border: '1px solid rgba(255,255,255,.1)', color: '#94A3B8',
    },
    ghost: {
      background: 'transparent', border: '1px solid rgba(255,255,255,.1)', color: '#94A3B8',
      ...(hover ? { borderColor: '#3B82F6', color: '#F8FAFC' } : {}),
    },
    danger: {
      background: hover ? 'linear-gradient(135deg,#DC2626,#B91C1C)' : 'linear-gradient(135deg,#EF4444,#DC2626)',
      color: 'white',
      boxShadow: hover ? '0 8px 20px rgba(239,68,68,.4)' : '0 4px 12px rgba(239,68,68,.2)',
    },
    success: {
      background: hover ? 'linear-gradient(135deg,#16A34A,#15803D)' : 'linear-gradient(135deg,#22C55E,#16A34A)',
      color: 'white',
    },
    outline: {
      background: 'transparent',
      border: '1px solid rgba(59,130,246,.4)', color: '#3B82F6',
      ...(hover ? { background: 'rgba(59,130,246,.1)' } : {}),
    },
  };

  return (
    <button
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {loading ? <Spinner size={16} /> : icon}
      {children}
    </button>
  );
}

export function Spinner({ size = 20, color = 'white' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid rgba(255,255,255,.15)`,
      borderTopColor: color,
      animation: 'spin .7s linear infinite', flexShrink: 0,
    }} />
  );
}

// Add global styles
if (typeof document !== 'undefined' && !document.getElementById('btn-css')) {
  const s = document.createElement('style');
  s.id = 'btn-css';
  s.textContent = `@keyframes spin{to{transform:rotate(360deg)}}`;
  document.head.appendChild(s);
}
