import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Payment } from '@/api/entities';

const PLANS = [
  {
    id: 'starter', name: 'Starter', icon: '🌱', price_monthly: 97, price_annual: 77,
    color: '#64748B', color2: '#475569',
    features: ['1 número WhatsApp', 'Até 500 conversas/mês', 'Bot com menus básicos', 'Captura de leads', 'Dashboard básico', 'Suporte por email'],
    off: ['IA GPT-4o', 'Instagram', 'CRM completo', 'Analytics avançado', 'API'],
  },
  {
    id: 'pro', name: 'Pro', icon: '🚀', price_monthly: 197, price_annual: 157,
    color: '#3B82F6', color2: '#8B5CF6', popular: true,
    features: ['3 números WhatsApp', 'Conversas ilimitadas', 'IA GPT-4o avançada', 'WhatsApp + Instagram', 'CRM completo', 'Analytics avançado', 'Automações visuais', 'Suporte prioritário'],
    off: ['White-label', 'API acesso', 'Gerente de conta'],
  },
  {
    id: 'premium', name: 'Premium', icon: '💎', price_monthly: 397, price_annual: 317,
    color: '#8B5CF6', color2: '#6D28D9',
    features: ['Números ilimitados', 'Conversas ilimitadas', 'IA GPT-4o customizada', 'Todos os canais', 'CRM + automações', 'Analytics + BI export', 'White-label completo', 'API acesso completo', 'Gerente de conta dedicado', 'SLA garantido 99.9%'],
    off: [],
  },
];

const FAQS = [
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim! Sem contratos de fidelidade, sem multas. Cancele direto pelo painel, o acesso continua até o fim do período pago.' },
  { q: 'O trial é realmente gratuito?', a: 'Sim, 7 dias completos com todos os recursos do plano Pro — sem precisar de cartão de crédito. Cancele antes e não é cobrado nada.' },
  { q: 'Quantos números posso conectar?', a: 'Starter (1 número), Pro (3 números) e Premium (ilimitado). Cada instância funciona de forma independente.' },
  { q: 'A IA entende português do Brasil?', a: 'Sim! Totalmente otimizada para PT-BR, com gírias, expressões regionais e contexto cultural brasileiro.' },
  { q: 'Posso migrar entre planos?', a: 'Claro! Faça upgrade ou downgrade a qualquer momento. O valor é calculado proporcionalmente ao período restante.' },
  { q: 'Os dados são seguros?', a: 'Sim. Usamos criptografia AES-256, HTTPS em todas as conexões e seguimos a LGPD. Seus dados nunca são compartilhados.' },
];

/* ── Pix QR ── */
function PixQR() {
  const cells = [];
  for (let r = 0; r < 20; r++) for (let c = 0; c < 20; c++) {
    const edge = (r < 6 && c < 6) || (r < 6 && c > 13) || (r > 13 && c < 6);
    if (edge || Math.sin(r * 4.1 + c * 2.3) > 0.2) cells.push({ r, c });
  }
  return (
    <svg width="160" height="160" style={{ borderRadius: 10, background: 'white', padding: 8 }}>
      {cells.map((cell, i) => <rect key={i} x={cell.c * 8} y={cell.r * 8} width={7} height={7} fill="#000" />)}
    </svg>
  );
}

/* ── Payment Modal ── */
function PaymentModal({ open, onClose, plan, annual }) {
  const toast = useToast();
  const [tab, setTab] = useState('card');
  const [step, setStep] = useState('form'); // form | processing | success
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [pixTimer, setPixTimer] = useState(600);
  const [boletoGenerated, setBoletoGenerated] = useState(false);
  const price = annual ? plan?.price_annual : plan?.price_monthly;

  useEffect(() => {
    if (!open) { setStep('form'); setCard({ number: '', name: '', expiry: '', cvv: '' }); setBoletoGenerated(false); setPixTimer(600); }
  }, [open]);

  useEffect(() => {
    if (tab === 'pix' && step === 'form') {
      const t = setInterval(() => setPixTimer(p => p <= 0 ? 0 : p - 1), 1000);
      return () => clearInterval(t);
    }
  }, [tab, step]);

  function fmtTime(s) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }

  function maskCard(v) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();
  }
  function maskExpiry(v) {
    const d = v.replace(/\D/g, '').slice(0, 4);
    if (d.length >= 3) return `${d.slice(0, 2)}/${d.slice(2)}`;
    return d;
  }

  async function pay() {
    if (tab === 'card') {
      if (!card.number || !card.name || !card.expiry || !card.cvv) { toast({ message: 'Preencha todos os campos do cartão', type: 'error' }); return; }
    }
    setStep('processing');
    await new Promise(r => setTimeout(r, 2200));
    try {
      await Payment.create({ amount: price, currency: 'BRL', status: 'approved', method: tab === 'card' ? 'credit_card' : tab, description: `Plano ${plan?.name} - ${annual ? 'Anual' : 'Mensal'}`, paid_at: new Date().toISOString() });
    } catch {}
    setStep('success');
    toast({ message: `🎉 Plano ${plan?.name} ativado!`, type: 'success', duration: 5000 });
  }

  const TABS = [
    { id: 'card', label: '💳 Cartão' },
    { id: 'pix', label: '🟢 PIX' },
    { id: 'boleto', label: '📄 Boleto' },
  ];

  return (
    <Modal open={open} onClose={onClose} title={`Assinar plano ${plan?.name}`} subtitle={`R$${price}/mês${annual ? ' (cobrança anual)' : ''}`} icon={plan?.icon} size="md">
      {step === 'form' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Summary */}
          <div style={{ background: `linear-gradient(135deg,${plan?.color}12,${plan?.color}06)`, border: `1px solid ${plan?.color}25`, borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '.92rem' }}>{plan?.icon} {plan?.name}</div>
              <div style={{ fontSize: '.75rem', color: '#64748B', marginTop: '.2rem' }}>{annual ? 'Cobrança anual (20% desconto)' : 'Cobrança mensal'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: plan?.color }}>R${price}</div>
              <div style={{ fontSize: '.7rem', color: '#64748B' }}>por mês</div>
            </div>
          </div>

          {/* Payment tabs */}
          <div style={{ display: 'flex', gap: '.3rem', background: 'rgba(255,255,255,.03)', borderRadius: '10px', padding: '.3rem' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '.55rem', borderRadius: '7px', fontSize: '.8rem', fontWeight: 700, background: tab === t.id ? 'rgba(59,130,246,.15)' : 'transparent', border: `1px solid ${tab === t.id ? 'rgba(59,130,246,.3)' : 'transparent'}`, color: tab === t.id ? '#60A5FA' : '#64748B', cursor: 'pointer', transition: 'all .15s' }}>{t.label}</button>
            ))}
          </div>

          {/* Card form */}
          {tab === 'card' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
              {/* Card preview */}
              <div style={{ borderRadius: '14px', background: `linear-gradient(135deg,${plan?.color},${plan?.color2 || plan?.color})`, padding: '1.25rem', aspectRatio: '1.8/1', position: 'relative', overflow: 'hidden', maxWidth: '300px', margin: '0 auto', width: '100%' }}>
                <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,.06)', top: '-80px', right: '-60px' }} />
                <div style={{ position: 'absolute', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,.04)', bottom: '-60px', left: '-40px' }} />
                <div style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '.5px', marginBottom: '.75rem' }}>GVP<span style={{ opacity: .7 }}>BOT</span></div>
                <div style={{ fontSize: '.8rem', letterSpacing: '3px', fontWeight: 600, marginBottom: '1rem', opacity: .9 }}>{card.number || '•••• •••• •••• ••••'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', opacity: .8 }}>
                  <span>{card.name || 'SEU NOME'}</span>
                  <span>{card.expiry || '00/00'}</span>
                </div>
              </div>
              <Input label="Número do cartão" value={card.number} onChange={e => setCard(p => ({ ...p, number: maskCard(e.target.value) }))} placeholder="0000 0000 0000 0000" icon="💳" />
              <Input label="Nome no cartão" value={card.name} onChange={e => setCard(p => ({ ...p, name: e.target.value.toUpperCase() }))} placeholder="COMO ESTÁ NO CARTÃO" icon="👤" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <Input label="Validade" value={card.expiry} onChange={e => setCard(p => ({ ...p, expiry: maskExpiry(e.target.value) }))} placeholder="MM/AA" icon="📅" />
                <Input label="CVV" type="password" value={card.cvv} onChange={e => setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="•••" icon="🔒" />
              </div>
              <div style={{ fontSize: '.72rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <span>🔒</span> Pagamento 100% seguro · SSL · PCI-DSS Compliant
              </div>
            </div>
          )}

          {/* PIX */}
          {tab === 'pix' && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.15)', borderRadius: '16px', padding: '1.5rem' }}>
                <PixQR />
              </div>
              <div style={{ fontSize: '.82rem', color: '#64748B', lineHeight: 1.7 }}>
                Abra o app do banco → PIX → Ler QR Code<br />
                O pagamento é confirmado em segundos ⚡
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '10px', padding: '.6rem 1rem', width: '100%', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '.75rem', color: '#64748B', flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>00020126580014BR.GOV.BCB.PIX0136...</span>
                <button onClick={() => toast({ message: '📋 Chave PIX copiada!', type: 'success' })} style={{ padding: '.3rem .75rem', borderRadius: '7px', background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.2)', color: '#22C55E', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Copiar</button>
              </div>
              <div style={{ color: pixTimer < 60 ? '#EF4444' : '#64748B', fontSize: '.78rem' }}>
                QR expira em <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtTime(pixTimer)}</strong>
              </div>
            </div>
          )}

          {/* Boleto */}
          {tab === 'boleto' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
              {!boletoGenerated ? (
                <>
                  <div style={{ fontSize: '3rem' }}>📄</div>
                  <div style={{ fontSize: '.88rem', color: '#94A3B8', lineHeight: 1.7 }}>Gere o boleto e pague em qualquer banco, lotérica ou app bancário.<br /><strong style={{ color: '#F59E0B' }}>Prazo: 2 dias úteis</strong></div>
                  <Button onClick={() => setBoletoGenerated(true)} icon="📄">Gerar boleto</Button>
                </>
              ) : (
                <>
                  <div style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)', borderRadius: '12px', padding: '1rem', width: '100%' }}>
                    <div style={{ fontSize: '.7rem', color: '#64748B', marginBottom: '.5rem' }}>Linha digitável</div>
                    <div style={{ fontSize: '.75rem', fontFamily: 'monospace', color: '#FCD34D', wordBreak: 'break-all' }}>34191.09008 70000.000108 00000.000000 1 98780000019700</div>
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button onClick={() => toast({ message: '📋 Código copiado!', type: 'success' })} style={{ padding: '.5rem 1rem', borderRadius: '8px', background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.25)', color: '#F59E0B', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer' }}>📋 Copiar código</button>
                    <button onClick={() => toast({ message: '⬇️ PDF gerado!', type: 'success' })} style={{ padding: '.5rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: '#94A3B8', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer' }}>⬇️ Baixar PDF</button>
                  </div>
                  <div style={{ fontSize: '.75rem', color: '#64748B' }}>⚠️ Vencimento: {new Date(Date.now() + 2 * 86400000).toLocaleDateString('pt-BR')}</div>
                </>
              )}
            </div>
          )}

          <Button onClick={pay} style={{ width: '100%', justifyContent: 'center', padding: '.85rem' }}>
            {tab === 'card' ? `💳 Pagar R$${price}` : tab === 'pix' ? '✅ Confirmar pagamento PIX' : '📄 Finalizar'}
          </Button>
        </div>
      )}

      {step === 'processing' && (
        <div style={{ textAlign: 'center', padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '3px solid rgba(59,130,246,.2)', borderTopColor: '#3B82F6', animation: 'spin .8s linear infinite' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '.35rem' }}>Processando pagamento...</div>
            <div style={{ fontSize: '.83rem', color: '#64748B' }}>Aguarde alguns segundos. Não feche esta janela.</div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            {['🔒 SSL', '🏦 Mercado Pago', '✅ PCI-DSS'].map(t => <span key={t} style={{ fontSize: '.72rem', color: '#475569', background: 'rgba(255,255,255,.04)', padding: '.2rem .6rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,.07)' }}>{t}</span>)}
          </div>
        </div>
      )}

      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(34,197,94,.15)', border: '2px solid rgba(34,197,94,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', animation: 'popIn .4s ease' }}>✅</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#22C55E', marginBottom: '.4rem' }}>Pagamento aprovado!</div>
            <div style={{ fontSize: '.85rem', color: '#64748B', lineHeight: 1.7 }}>Plano <strong style={{ color: plan?.color }}>{plan?.name}</strong> ativado com sucesso.<br />Aproveite todos os recursos!</div>
          </div>
          <div style={{ background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.15)', borderRadius: '12px', padding: '1rem', width: '100%' }}>
            {plan?.features.slice(0, 4).map(f => <div key={f} style={{ fontSize: '.8rem', color: '#22C55E', padding: '.2rem 0' }}>✓ {f}</div>)}
          </div>
          <Button onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>🚀 Ir para o dashboard</Button>
        </div>
      )}
    </Modal>
  );
}

export default function Planos() {
  const toast = useToast();
  const [annual, setAnnual] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [currentPlan] = useState('trial');
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    Payment.list({ sort: '-created_date', limit: 5 }).then(setPayments).catch(() => {});
  }, []);

  function selectPlan(plan) {
    setSelectedPlan(plan);
    setPayModal(true);
  }

  const savings = (p) => Math.round((p.price_monthly - p.price_annual) * 12);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.5rem' }}>
          Escolha o plano <span style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ideal</span>
        </h2>
        <p style={{ fontSize: '.9rem', color: '#64748B' }}>7 dias grátis em qualquer plano · Sem cartão · Cancele quando quiser</p>
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '.88rem', fontWeight: 600, color: !annual ? '#F8FAFC' : '#64748B' }}>Mensal</span>
        <div onClick={() => setAnnual(!annual)} style={{ width: '52px', height: '28px', borderRadius: '14px', background: annual ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'rgba(255,255,255,.1)', cursor: 'pointer', position: 'relative', transition: 'background .25s' }}>
          <div style={{ position: 'absolute', top: '4px', left: annual ? '28px' : '4px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left .25s', boxShadow: '0 2px 4px rgba(0,0,0,.3)' }} />
        </div>
        <span style={{ fontSize: '.88rem', fontWeight: 600, color: annual ? '#F8FAFC' : '#64748B', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
          Anual <span style={{ padding: '.15rem .55rem', borderRadius: '100px', background: 'rgba(34,197,94,.15)', color: '#22C55E', fontSize: '.7rem', fontWeight: 800 }}>-20%</span>
        </span>
      </div>

      {/* Plans grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
        {PLANS.map(plan => {
          const price = annual ? plan.price_annual : plan.price_monthly;
          const isCurrent = currentPlan === plan.id;
          return (
            <div key={plan.id} style={{
              background: plan.popular ? `linear-gradient(160deg,rgba(59,130,246,.1),rgba(139,92,246,.08))` : 'rgba(255,255,255,.03)',
              border: `1.5px solid ${plan.popular ? 'rgba(59,130,246,.4)' : 'rgba(255,255,255,.08)'}`,
              borderRadius: '20px', padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
              position: 'relative', overflow: 'hidden', transition: 'all .2s',
            }}
              onMouseOver={e => { if (!plan.popular) e.currentTarget.style.border = `1.5px solid ${plan.color}40`; }}
              onMouseOut={e => { if (!plan.popular) e.currentTarget.style.border = '1.5px solid rgba(255,255,255,.08)'; }}
            >
              {plan.popular && (
                <div style={{ position: 'absolute', top: '14px', right: '14px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', borderRadius: '100px', padding: '.2rem .7rem', fontSize: '.65rem', fontWeight: 800, color: 'white' }}>🔥 Popular</div>
              )}
              {annual && (
                <div style={{ position: 'absolute', top: plan.popular ? '44px' : '14px', right: '14px', background: 'rgba(34,197,94,.15)', border: '1px solid rgba(34,197,94,.25)', borderRadius: '100px', padding: '.18rem .6rem', fontSize: '.62rem', fontWeight: 800, color: '#22C55E' }}>Economize R${savings(plan)}/ano</div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '.75rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${plan.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{plan.icon}</div>
                  <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>{plan.name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '.3rem' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-1.5px', background: `linear-gradient(135deg,${plan.color},${plan.color2 || plan.color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>R${price}</span>
                  <span style={{ fontSize: '.82rem', color: '#64748B' }}>/mês</span>
                </div>
                {annual && <div style={{ fontSize: '.72rem', color: '#64748B', marginTop: '.2rem' }}>Cobrado R${price * 12}/ano</div>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem', flex: 1 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '.55rem', fontSize: '.83rem' }}>
                    <span style={{ color: plan.color, fontSize: '.7rem', fontWeight: 800, flexShrink: 0 }}>✓</span>
                    <span style={{ color: '#CBD5E1' }}>{f}</span>
                  </div>
                ))}
                {plan.off.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '.55rem', fontSize: '.83rem', opacity: .4 }}>
                    <span style={{ color: '#EF4444', fontSize: '.7rem', flexShrink: 0 }}>✕</span>
                    <span style={{ color: '#475569', textDecoration: 'line-through' }}>{f}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => selectPlan(plan)} disabled={isCurrent} style={{
                width: '100%', padding: '.8rem', borderRadius: '12px', fontWeight: 800, fontSize: '.9rem', cursor: isCurrent ? 'default' : 'pointer', transition: 'all .2s',
                background: isCurrent ? 'rgba(255,255,255,.06)' : plan.popular ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : `linear-gradient(135deg,${plan.color},${plan.color2 || plan.color})`,
                border: 'none', color: isCurrent ? '#64748B' : 'white',
                boxShadow: !isCurrent && plan.popular ? '0 8px 30px rgba(59,130,246,.4)' : 'none',
              }}>
                {isCurrent ? '✓ Plano atual' : '🚀 Começar grátis'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust badges */}
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {['✅ 7 dias grátis', '💳 Sem cartão de crédito', '🔒 Pagamento seguro', '↩️ Cancele quando quiser', '🇧🇷 Suporte em português'].map(b => (
          <span key={b} style={{ fontSize: '.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '.3rem' }}>{b}</span>
        ))}
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,.06)', fontWeight: 800 }}>💳 Histórico de pagamentos</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>
              <thead><tr style={{ background: 'rgba(255,255,255,.02)' }}>
                {['Descrição', 'Valor', 'Método', 'Status', 'Data', ''].map(h => <th key={h} style={{ padding: '.6rem 1rem', textAlign: 'left', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', color: '#475569' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ borderTop: '1px solid rgba(255,255,255,.04)' }}>
                    <td style={{ padding: '.65rem 1rem', color: '#94A3B8' }}>{p.description}</td>
                    <td style={{ padding: '.65rem 1rem', fontWeight: 800, color: '#22C55E' }}>R${p.amount}</td>
                    <td style={{ padding: '.65rem 1rem', color: '#64748B', textTransform: 'capitalize' }}>{p.method?.replace('_', ' ')}</td>
                    <td style={{ padding: '.65rem 1rem' }}><span style={{ color: '#22C55E', fontWeight: 700 }}>✅ Aprovado</span></td>
                    <td style={{ padding: '.65rem 1rem', color: '#475569' }}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString('pt-BR') : '—'}</td>
                    <td style={{ padding: '.65rem 1rem' }}><button onClick={() => toast({ message: '⬇️ Fatura gerada!', type: 'success' })} style={{ padding: '.25rem .6rem', borderRadius: '6px', background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.2)', color: '#60A5FA', fontSize: '.72rem', cursor: 'pointer' }}>Fatura</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAQs */}
      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,.06)', fontWeight: 800 }}>❓ Dúvidas frequentes</div>
        {FAQS.map((faq, i) => (
          <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '1rem 1.5rem', background: 'none', border: 'none', color: '#F8FAFC', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontFamily: 'Inter,sans-serif', fontSize: '.88rem', fontWeight: 600, transition: 'background .15s' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
              {faq.q}
              <span style={{ fontSize: '.8rem', color: '#64748B', transition: 'transform .2s', transform: openFaq === i ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▼</span>
            </button>
            {openFaq === i && (
              <div style={{ padding: '0 1.5rem 1rem', fontSize: '.85rem', color: '#94A3B8', lineHeight: 1.7, animation: 'fadeUp .2s ease' }}>{faq.a}</div>
            )}
          </div>
        ))}
      </div>

      <PaymentModal open={payModal} onClose={() => setPayModal(false)} plan={selectedPlan} annual={annual} />
    </div>
  );
}
