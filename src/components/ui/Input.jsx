import { useState } from 'react';

const fieldStyle = {
  display: 'flex', flexDirection: 'column', gap: '.35rem',
};
const labelStyle = {
  fontSize: '.72rem', fontWeight: 700, color: '#94A3B8',
  textTransform: 'uppercase', letterSpacing: '.5px',
};

export function Input({ label, icon, type = 'text', value, onChange, placeholder, required, error, helper, style = {}, inputStyle = {}, rightEl, ...props }) {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const inputType = type === 'password' ? (showPwd ? 'text' : 'password') : type;

  return (
    <div style={{ ...fieldStyle, ...style }}>
      {label && <label style={labelStyle}>{label}{required && <span style={{ color: '#EF4444' }}> *</span>}</label>}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: focused ? 'rgba(59,130,246,.06)' : 'rgba(255,255,255,.04)',
        border: `1px solid ${error ? 'rgba(239,68,68,.5)' : focused ? '#3B82F6' : 'rgba(255,255,255,.1)'}`,
        borderRadius: '10px', overflow: 'hidden',
        boxShadow: focused ? '0 0 0 3px rgba(59,130,246,.12)' : 'none',
        transition: 'all .2s',
      }}>
        {icon && (
          <span style={{ padding: '0 .75rem', fontSize: '.9rem', color: '#64748B', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,.07)' }}>{icon}</span>
        )}
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, padding: '.72rem .9rem', background: 'none', border: 'none',
            outline: 'none', color: '#F8FAFC', fontSize: '.9rem', fontFamily: 'Inter, sans-serif',
            ...inputStyle
          }}
          {...props}
        />
        {type === 'password' && (
          <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ padding: '0 .75rem', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.9rem' }}>
            {showPwd ? '🙈' : '👁'}
          </button>
        )}
        {rightEl && <div style={{ padding: '0 .75rem', flexShrink: 0 }}>{rightEl}</div>}
      </div>
      {error && <span style={{ fontSize: '.72rem', color: '#EF4444' }}>{error}</span>}
      {helper && !error && <span style={{ fontSize: '.72rem', color: '#64748B' }}>{helper}</span>}
    </div>
  );
}

export function Select({ label, value, onChange, options = [], placeholder, style = {}, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ ...fieldStyle, ...style }}>
      {label && <label style={labelStyle}>{label}{required && <span style={{ color: '#EF4444' }}> *</span>}</label>}
      <select
        value={value} onChange={onChange} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          padding: '.72rem .9rem', background: focused ? 'rgba(59,130,246,.06)' : 'rgba(255,255,255,.04)',
          border: `1px solid ${focused ? '#3B82F6' : 'rgba(255,255,255,.1)'}`,
          borderRadius: '10px', color: value ? '#F8FAFC' : '#64748B',
          fontSize: '.9rem', fontFamily: 'Inter, sans-serif',
          outline: 'none', cursor: 'pointer', appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748B' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right .9rem center', paddingRight: '2.5rem',
          boxShadow: focused ? '0 0 0 3px rgba(59,130,246,.12)' : 'none',
          transition: 'all .2s',
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value || o} value={o.value || o} style={{ background: '#0A0F1E' }}>
            {o.label || o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Textarea({ label, value, onChange, placeholder, rows = 4, style = {} }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ ...fieldStyle, ...style }}>
      {label && <label style={labelStyle}>{label}</label>}
      <textarea
        value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          padding: '.75rem .9rem', background: focused ? 'rgba(59,130,246,.06)' : 'rgba(255,255,255,.04)',
          border: `1px solid ${focused ? '#3B82F6' : 'rgba(255,255,255,.1)'}`,
          borderRadius: '10px', color: '#F8FAFC', fontSize: '.88rem',
          fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'vertical',
          lineHeight: 1.7, boxShadow: focused ? '0 0 0 3px rgba(59,130,246,.12)' : 'none',
          transition: 'all .2s',
        }}
      />
    </div>
  );
}

export function Switch({ checked, onChange, label, description }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
      {(label || description) && (
        <div>
          {label && <div style={{ fontSize: '.88rem', fontWeight: 600, color: '#F8FAFC' }}>{label}</div>}
          {description && <div style={{ fontSize: '.75rem', color: '#64748B', marginTop: '.1rem' }}>{description}</div>}
        </div>
      )}
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: '48px', height: '26px', borderRadius: '13px', cursor: 'pointer', flexShrink: 0,
          background: checked ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'rgba(255,255,255,.1)',
          position: 'relative', transition: 'background .25s',
        }}
      >
        <div style={{
          position: 'absolute', top: '3px', left: checked ? '25px' : '3px',
          width: '20px', height: '20px', borderRadius: '50%',
          background: checked ? 'white' : '#64748B',
          transition: 'left .25s, background .25s',
          boxShadow: '0 2px 4px rgba(0,0,0,.3)',
        }} />
      </div>
    </div>
  );
}
