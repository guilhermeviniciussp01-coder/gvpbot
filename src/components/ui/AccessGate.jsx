import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { auth } from '@/api/base44Client';

export function TrialBanner() {
  const [user, setUser] = useState(null);
  const [daysLeft, setDaysLeft] = useState(7);

  useEffect(() => {
    auth.me().then(u => {
      setUser(u);
      if (u?.trial_end) {
        const diff = new Date(u.trial_end) - Date.now();
        setDaysLeft(Math.max(0, Math.ceil(diff / 86400000)));
      }
    }).catch(() => {});
  }, []);

  if (!user || user?.plan !== 'trial') return null;

  const urgent = daysLeft <= 2;

  return (
    <div style={{
      background: urgent ? 'linear-gradient(135deg,rgba(239,68,68,.12),rgba(239,68,68,.06))' : 'linear-gradient(135deg,rgba(245,158,11,.1),rgba(245,158,11,.05))',
      border: `1px solid ${urgent ? 'rgba(239,68,68,.3)' : 'rgba(245,158,11,.3)'}`,
      borderRadius: '12px', padding: '.75rem 1.25rem',
      display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem'
    }}>
      <span style={{ fontSize: '1.1rem' }}>{urgent ? '🚨' : '⏱'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '.85rem', fontWeight: 700, color: urgent ? '#FCA5A5' : '#FCD34D' }}>
          {daysLeft === 0 ? 'Seu trial expirou!' : `Trial expira em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`}
        </div>
        <div style={{ fontSize: '.75rem', color: '#94A3B8' }}>Faça upgrade para continuar usando todos os recursos</div>
      </div>
      <Link to={createPageUrl('Planos')}>
        <button style={{ padding: '.5rem 1.1rem', borderRadius: '8px', background: urgent ? 'linear-gradient(135deg,#EF4444,#DC2626)' : 'linear-gradient(135deg,#F59E0B,#D97706)', border: 'none', color: 'white', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {urgent ? '🚀 Fazer upgrade agora' : '💳 Ver planos'}
        </button>
      </Link>
    </div>
  );
}

export function BlockedScreen({ reason = 'trial' }) {
  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif', color: '#F8FAFC', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(239,68,68,.08)', filter: 'blur(100px)', top: '-100px', left: '-100px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(239,68,68,.06)', filter: 'blur(100px)', bottom: '-100px', right: '-100px', pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center', maxWidth: '460px', position: 'relative', zIndex: 2 }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239,68,68,.15)', border: '2px solid rgba(239,68,68,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.5rem' }}>🔒</div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.75rem' }}>
          {reason === 'trial' ? 'Trial expirado' : reason === 'past_due' ? 'Pagamento pendente' : 'Acesso bloqueado'}
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '.92rem', lineHeight: 1.7, marginBottom: '2rem' }}>
          {reason === 'trial' ? 'Seu período de teste de 7 dias acabou. Escolha um plano para continuar automatizando seu atendimento.' : reason === 'past_due' ? 'Seu pagamento está atrasado. Regularize para reativar o acesso.' : 'Sua conta foi suspensa. Entre em contato com o suporte.'}
        </p>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={createPageUrl('Planos')}>
            <button style={{ padding: '.85rem 2rem', borderRadius: '12px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', border: 'none', color: 'white', fontWeight: 800, fontSize: '.95rem', cursor: 'pointer', boxShadow: '0 8px 30px rgba(59,130,246,.4)' }}>
              {reason === 'trial' ? '🚀 Escolher plano' : '💳 Regularizar pagamento'}
            </button>
          </Link>
          <a href="mailto:suporte@gvpbot.com.br" style={{ padding: '.85rem 1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#94A3B8', fontWeight: 600, fontSize: '.88rem', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Suporte</a>
        </div>
      </div>
    </div>
  );
}

export function PastDueBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    auth.me().then(u => {
      if (u?.plan_status === 'past_due') setShow(true);
    }).catch(() => {});
  }, []);

  if (!show) return null;

  return (
    <div style={{ background: 'linear-gradient(135deg,rgba(239,68,68,.12),rgba(239,68,68,.06))', border: '1px solid rgba(239,68,68,.3)', borderRadius: '12px', padding: '.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
      <span>🚨</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '.85rem', fontWeight: 700, color: '#FCA5A5' }}>Pagamento atrasado</div>
        <div style={{ fontSize: '.75rem', color: '#94A3B8' }}>Regularize para evitar o bloqueio da conta</div>
      </div>
      <Link to={createPageUrl('Planos')}>
        <button style={{ padding: '.5rem 1.1rem', borderRadius: '8px', background: 'linear-gradient(135deg,#EF4444,#DC2626)', border: 'none', color: 'white', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>Regularizar agora</button>
      </Link>
    </div>
  );
}
