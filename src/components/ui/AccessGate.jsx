import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { auth } from '@/api/base44Client';
import { getTrialDaysLeft } from '@/lib/utils';

/* ─── Trial Banner (top of app pages) ─── */
export function TrialBanner() {
  const [user, setUser]     = useState(null);
  const [ready, setReady]   = useState(false);

  useEffect(() => {
    auth.me()
      .then(u => { setUser(u); setReady(true); })
      .catch(() => setReady(true));
  }, []);

  if (!ready || !user) return null;
  if (user.plan !== 'trial' && user.plan_status !== 'trial') return null;

  const days    = getTrialDaysLeft(user.trial_end);
  const urgent  = days <= 2;
  const expired = days === 0;
  const col     = urgent ? '#EF4444' : '#F59E0B';
  const colBg   = urgent ? 'rgba(239,68,68,.1)' : 'rgba(245,158,11,.1)';
  const colBrd  = urgent ? 'rgba(239,68,68,.25)' : 'rgba(245,158,11,.25)';

  return (
    <div style={{
      background: colBg, border: `1px solid ${colBrd}`,
      borderRadius: '12px', padding: '.7rem 1.25rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
      flexWrap: 'wrap', marginBottom: '1.25rem',
    }}>
      <span style={{ fontSize: '1.1rem' }}>{expired ? '🔒' : urgent ? '🚨' : '⏱'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '.85rem', fontWeight: 700, color: expired ? '#FCA5A5' : urgent ? '#FCA5A5' : '#FCD34D' }}>
          {expired
            ? 'Seu trial expirou! Escolha um plano para continuar.'
            : `Trial expira em ${days} dia${days !== 1 ? 's' : ''}`}
        </div>
        <div style={{ fontSize: '.73rem', color: '#94A3B8' }}>
          Faça upgrade para manter o acesso a todos os recursos
        </div>
      </div>
      <Link to={createPageUrl('Planos')}>
        <button style={{
          padding: '.48rem 1.1rem', borderRadius: '8px', border: 'none',
          background: urgent
            ? 'linear-gradient(135deg,#EF4444,#DC2626)'
            : 'linear-gradient(135deg,#F59E0B,#D97706)',
          color: 'white', fontWeight: 800, fontSize: '.82rem',
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          {expired ? '🚀 Escolher plano' : '💳 Ver planos'}
        </button>
      </Link>
    </div>
  );
}

/* ─── Past Due Banner ─── */
export function PastDueBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    auth.me()
      .then(u => { if (u?.plan_status === 'past_due') setShow(true); })
      .catch(() => {});
  }, []);

  if (!show) return null;

  return (
    <div style={{
      background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)',
      borderRadius: '12px', padding: '.7rem 1.25rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
      flexWrap: 'wrap', marginBottom: '1.25rem',
    }}>
      <span>🚨</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '.85rem', fontWeight: 700, color: '#FCA5A5' }}>
          Pagamento pendente
        </div>
        <div style={{ fontSize: '.73rem', color: '#94A3B8' }}>
          Regularize para evitar o bloqueio da conta
        </div>
      </div>
      <Link to={createPageUrl('Planos')}>
        <button style={{
          padding: '.48rem 1.1rem', borderRadius: '8px', border: 'none',
          background: 'linear-gradient(135deg,#EF4444,#DC2626)',
          color: 'white', fontWeight: 800, fontSize: '.82rem', cursor: 'pointer',
        }}>Regularizar agora</button>
      </Link>
    </div>
  );
}

/* ─── Full Blocked Screen ─── */
export function BlockedScreen({ reason = 'trial' }) {
  const REASONS = {
    trial:    { title: 'Trial expirado',        icon: '⏱', desc: 'Seu período de 7 dias acabou. Escolha um plano para continuar automatizando.' },
    past_due: { title: 'Pagamento pendente',    icon: '💳', desc: 'Seu pagamento está atrasado. Regularize para reativar o acesso imediatamente.' },
    blocked:  { title: 'Conta suspensa',        icon: '🔒', desc: 'Sua conta foi suspensa. Entre em contato com o suporte para mais informações.' },
  };
  const cfg = REASONS[reason] || REASONS.trial;

  return (
    <div style={{
      minHeight: '100vh', background: '#030712',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter,sans-serif', color: '#F8FAFC',
      padding: '2rem', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position:'absolute', width:'500px', height:'500px', borderRadius:'50%', background:'rgba(239,68,68,.07)', filter:'blur(100px)', top:'-150px', left:'-150px', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:'400px', height:'400px', borderRadius:'50%', background:'rgba(239,68,68,.05)', filter:'blur(100px)', bottom:'-100px', right:'-100px', pointerEvents:'none' }} />

      <div style={{ textAlign: 'center', maxWidth: '460px', position: 'relative', zIndex: 2 }}>
        <div style={{
          width: '82px', height: '82px', borderRadius: '50%',
          background: 'rgba(239,68,68,.12)', border: '2px solid rgba(239,68,68,.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.2rem', margin: '0 auto 1.5rem',
        }}>{cfg.icon}</div>

        <h2 style={{ fontSize: '1.65rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.75rem' }}>
          {cfg.title}
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '.92rem', lineHeight: 1.75, marginBottom: '2rem' }}>
          {cfg.desc}
        </p>

        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={createPageUrl('Planos')}>
            <button style={{
              padding: '.9rem 2.2rem', borderRadius: '12px',
              background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
              border: 'none', color: 'white', fontWeight: 800, fontSize: '.95rem',
              cursor: 'pointer', boxShadow: '0 8px 30px rgba(59,130,246,.4)',
            }}>
              {reason === 'past_due' ? '💳 Regularizar pagamento' : '🚀 Escolher plano'}
            </button>
          </Link>
          <a
            href="mailto:suporte@gvpbot.com.br"
            style={{
              padding: '.9rem 1.5rem', borderRadius: '12px',
              background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
              color: '#94A3B8', fontWeight: 600, fontSize: '.88rem',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
            }}
          >✉️ Suporte</a>
        </div>
      </div>
    </div>
  );
}
