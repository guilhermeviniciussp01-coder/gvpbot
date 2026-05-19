import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getUserConfig, getWhatsappInstances } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/Toast';

const STEPS = [
  {
    id: 'whatsapp',
    icon: '📱',
    title: 'Conectar WhatsApp',
    desc: 'Configure a Evolution API e escaneie o QR Code',
    action: '/WhatsApp',
    actionLabel: 'Conectar agora →',
    color: '#22C55E',
  },
  {
    id: 'ia',
    icon: '🤖',
    title: 'Configurar Inteligência Artificial',
    desc: 'Adicione sua API Key do OpenRouter e escolha um modelo',
    action: '/IA',
    actionLabel: 'Configurar IA →',
    color: '#3B82F6',
  },
  {
    id: 'flow',
    icon: '⚡',
    title: 'Criar primeiro fluxo',
    desc: 'Monte uma automação de resposta automática para seus clientes',
    action: '/Automacoes',
    actionLabel: 'Criar fluxo →',
    color: '#8B5CF6',
  },
  {
    id: 'plan',
    icon: '🚀',
    title: 'Escolher um plano',
    desc: 'Faça upgrade para desbloquear todos os recursos e canais',
    action: '/Planos',
    actionLabel: 'Ver planos →',
    color: '#F59E0B',
  },
];

export default function Onboarding() {
  const toast    = useToast();
  const navigate = useNavigate();
  const [user, setUser]       = useState(null);
  const [done, setDone]       = useState({});   // { whatsapp: true, ia: true, ... }
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkProgress();
  }, []);

  async function checkProgress() {
    setLoading(true);
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);

      const [cfg, wInstances] = await Promise.all([
        getUserConfig().catch(() => null),
        getWhatsappInstances().catch(() => []),
      ]);

      const plan = u?.user_metadata?.plano;

      setDone({
        whatsapp: wInstances.length > 0,
        ia:       !!(cfg?.openrouter_key),
        flow:     !!(localStorage.getItem('gvpbot_first_flow')),
        plan:     plan && plan !== 'trial',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const completedCount = Object.values(done).filter(Boolean).length;
  const percent = Math.round((completedCount / STEPS.length) * 100);
  const firstName = user?.user_metadata?.full_name?.split(' ')[0]
                  || user?.email?.split('@')[0]
                  || 'por aqui';

  if (dismissed) return null;

  const cardBg = 'rgba(255,255,255,.03)';
  const border = 'rgba(255,255,255,.08)';

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'Inter,sans-serif', color: '#F8FAFC' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.2)', borderRadius: '100px', padding: '.3rem .9rem', fontSize: '.75rem', color: '#93C5FD', fontWeight: 600, marginBottom: '.75rem' }}>
            ✨ Bem-vindo ao GVP BOT
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '.4rem' }}>
            Olá, {firstName}! 👋
          </h1>
          <p style={{ color: '#64748B', fontSize: '.92rem' }}>
            Complete o setup em poucos minutos e comece a automatizar seu atendimento.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '8px', color: '#475569', cursor: 'pointer', padding: '.4rem .7rem', fontSize: '.75rem', flexShrink: 0, marginTop: '.25rem' }}
        >
          ✕ Fechar
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.85rem' }}>
          <span style={{ fontWeight: 700, fontSize: '.92rem' }}>Progresso de configuração</span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: percent === 100 ? '#22C55E' : '#60A5FA' }}>{percent}%</span>
        </div>
        <div style={{ height: '8px', background: 'rgba(255,255,255,.06)', borderRadius: '100px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${percent}%`, background: percent === 100 ? 'linear-gradient(90deg,#22C55E,#16A34A)' : 'linear-gradient(90deg,#3B82F6,#8B5CF6)', borderRadius: '100px', transition: 'width .6s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.6rem' }}>
          <span style={{ fontSize: '.75rem', color: '#475569' }}>{completedCount} de {STEPS.length} etapas concluídas</span>
          {percent === 100 && <span style={{ fontSize: '.75rem', color: '#22C55E', fontWeight: 700 }}>🎉 Setup completo!</span>}
        </div>
      </div>

      {/* Checklist */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#475569' }}>Carregando...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
          {STEPS.map((step, i) => {
            const isDone = done[step.id];
            return (
              <div
                key={step.id}
                style={{
                  background: isDone ? `${step.color}08` : cardBg,
                  border: `1px solid ${isDone ? step.color + '25' : border}`,
                  borderRadius: '14px', padding: '1.1rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  transition: 'all .2s', flexWrap: 'wrap',
                }}
              >
                {/* Step number / check */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                  background: isDone ? step.color : 'rgba(255,255,255,.05)',
                  border: `1px solid ${isDone ? step.color : 'rgba(255,255,255,.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isDone ? '1rem' : '1.1rem',
                  transition: 'all .3s',
                }}>
                  {isDone ? '✓' : step.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: '.2rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    {step.title}
                    {isDone && <span style={{ fontSize: '.65rem', background: `${step.color}15`, color: step.color, padding: '.1rem .5rem', borderRadius: '100px', fontWeight: 700 }}>CONCLUÍDO</span>}
                  </div>
                  <div style={{ fontSize: '.8rem', color: '#64748B' }}>{step.desc}</div>
                </div>

                {/* Action */}
                {!isDone && (
                  <button
                    onClick={() => navigate(step.action)}
                    style={{
                      padding: '.5rem 1.1rem', borderRadius: '9px', border: 'none', flexShrink: 0,
                      background: `linear-gradient(135deg,${step.color},${step.color}cc)`,
                      color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '.8rem',
                    }}
                  >
                    {step.actionLabel}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CTA se tudo concluído */}
      {percent === 100 && (
        <div style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg,rgba(34,197,94,.08),rgba(59,130,246,.08))', border: '1px solid rgba(34,197,94,.2)', borderRadius: '14px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>🎉</div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.4rem' }}>Setup completo! Seu bot está pronto.</div>
          <div style={{ color: '#64748B', fontSize: '.88rem', marginBottom: '1.25rem' }}>Acesse o Dashboard para ver as métricas em tempo real.</div>
          <button onClick={() => navigate('/Dashboard')} style={{ padding: '.7rem 1.75rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>
            Ir para o Dashboard →
          </button>
        </div>
      )}
    </div>
  );
}
