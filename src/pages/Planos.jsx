import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const PLANS = [
  {
    id: 'starter', name: 'Starter', icon: '🌱', price_monthly: 97, price_annual: 77,
    color: '#64748B', popular: false,
    features: ['1 número WhatsApp', 'Até 500 conversas/mês', 'Bot com menus básicos', 'Captura de leads', 'Dashboard básico', 'Suporte por email'],
    off: ['IA GPT-4o', 'Instagram', 'CRM completo', 'Analytics avançado'],
  },
  {
    id: 'pro', name: 'Pro', icon: '🚀', price_monthly: 197, price_annual: 157,
    color: '#3B82F6', popular: true,
    features: ['3 números WhatsApp', 'Conversas ilimitadas', 'IA GPT-4o avançada', 'WhatsApp + Instagram', 'CRM completo', 'Analytics avançado', 'Respostas rápidas', 'Suporte prioritário'],
    off: ['White-label', 'API acesso'],
  },
  {
    id: 'premium', name: 'Premium', icon: '💎', price_monthly: 397, price_annual: 317,
    color: '#8B5CF6', popular: false,
    features: ['Números ilimitados', 'Conversas ilimitadas', 'IA GPT-4o + custom', 'Todos os canais', 'CRM + automações', 'Analytics + BI', 'White-label', 'API acesso completo', 'Gerente de conta', 'SLA garantido'],
    off: [],
  },
];

const FAQS = [
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim! Sem contratos, sem multas. Cancele quando quiser diretamente pelo painel.' },
  { q: 'O trial é realmente gratuito?', a: 'Sim, 7 dias completos no plano Pro sem precisar de cartão de crédito.' },
  { q: 'Quantos números posso conectar?', a: 'Depende do plano: Starter (1), Pro (3) e Premium (ilimitado).' },
  { q: 'A IA entende português?', a: 'Sim! Totalmente otimizada para PT-BR, com gírias e contexto brasileiro.' },
  { q: 'Preciso instalar algo?', a: 'Não. Tudo 100% na nuvem, funciona direto no navegador.' },
];

export default function Planos() {
  const toast = useToast();
  const [annual, setAnnual] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [payTab, setPayTab] = useState('card');
  const [openFaq, setOpenFaq] = useState(null);
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  function selectPlan(plan) {
    setSelectedPlan(plan);
    setPayModal(true);
    setSuccess(false);
    setProcessing(false);
  }

  async function processPayment() {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2200));
    setProcessing(false);
    setSuccess(true);
    toast({ message: `✅ Plano ${selectedPlan?.name} ativado!`, type: 'success' });
  }

  const currentPrice = (plan) => annual ? plan.price_annual : plan.price_monthly;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.25)', borderRadius: '100px', padding: '.35rem 1rem', fontSize: '.78rem', fontWeight: 700, color: '#93C5FD', marginBottom: '1rem' }}>
          💎 Trial gratuito por 7 dias
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '.5rem' }}>
          Escolha seu <span style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>plano</span>
        </h2>
        <p style={{ color: '#64748B', fontSize: '.95rem', marginBottom: '1.5rem' }}>Sem contratos. Cancele quando quiser.</p>

        {/* Toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '100px', padding: '.35rem .5rem' }}>
          <button onClick={() => setAnnual(false)} style={{ padding: '.4rem 1rem', borderRadius: '100px', fontSize: '.82rem', fontWeight: 700, background: !annual ? 'rgba(59,130,246,.2)' : 'transparent', color: !annual ? '#60A5FA' : '#64748B', border: 'none', cursor: 'pointer', transition: 'all .2s' }}>Mensal</button>
          <button onClick={() => setAnnual(true)} style={{ padding: '.4rem 1rem', borderRadius: '100px', fontSize: '.82rem', fontWeight: 700, background: annual ? 'rgba(59,130,246,.2)' : 'transparent', color: annual ? '#60A5FA' : '#64748B', border: 'none', cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            Anual <span style={{ background: 'rgba(34,197,94,.15)', color: '#22C55E', fontSize: '.65rem', padding: '.15rem .45rem', borderRadius: '100px', border: '1px solid rgba(34,197,94,.25)', fontWeight: 800 }}>-20%</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        {PLANS.map(plan => (
          <div key={plan.id} style={{
            background: plan.popular ? `linear-gradient(135deg,rgba(59,130,246,.1),rgba(139,92,246,.06))` : 'rgba(255,255,255,.03)',
            border: `1px solid ${plan.popular ? 'rgba(59,130,246,.4)' : 'rgba(255,255,255,.08)'}`,
            borderRadius: '20px', padding: '1.75rem',
            transform: plan.popular ? 'scale(1.04)' : 'scale(1)',
            boxShadow: plan.popular ? '0 0 50px rgba(59,130,246,.12)' : 'none',
            display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'all .3s',
          }}
            onMouseOver={e => { if (!plan.popular) { e.currentTarget.style.borderColor = `${plan.color}40`; e.currentTarget.style.transform = 'translateY(-4px)'; } }}
            onMouseOut={e => { if (!plan.popular) { e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; e.currentTarget.style.transform = 'none'; } }}
          >
            {plan.popular && (
              <div style={{ textAlign: 'center', fontSize: '.72rem', fontWeight: 800, letterSpacing: '.5px', textTransform: 'uppercase', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '-.5rem' }}>🔥 Mais vendido</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <span style={{ fontSize: '1.4rem' }}>{plan.icon}</span>
              <span style={{ fontSize: '1rem', fontWeight: 800 }}>{plan.name}</span>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1, background: `linear-gradient(135deg,${plan.color},${plan.color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                R${currentPrice(plan)}
              </div>
              <div style={{ fontSize: '.78rem', color: '#64748B', marginTop: '.2rem' }}>/mês{annual && ' · cobrado anualmente'}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', flex: 1 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.83rem' }}>
                  <span style={{ color: '#22C55E', flexShrink: 0 }}>✓</span>
                  <span style={{ color: '#CBD5E1' }}>{f}</span>
                </div>
              ))}
              {plan.off.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.83rem', opacity: .4 }}>
                  <span style={{ color: '#64748B', flexShrink: 0 }}>✗</span>
                  <span style={{ color: '#64748B' }}>{f}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => selectPlan(plan)}
              style={{
                padding: '.85rem', borderRadius: '12px', fontWeight: 800, fontSize: '.9rem', cursor: 'pointer', transition: 'all .2s',
                background: plan.popular ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'transparent',
                border: plan.popular ? 'none' : `1px solid rgba(255,255,255,.12)`,
                color: plan.popular ? 'white' : '#94A3B8',
                boxShadow: plan.popular ? '0 4px 20px rgba(59,130,246,.35)' : 'none',
              }}
              onMouseOver={e => { if (plan.popular) { e.currentTarget.style.boxShadow = '0 8px 30px rgba(59,130,246,.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; } else { e.currentTarget.style.borderColor = `${plan.color}50`; e.currentTarget.style.color = '#F8FAFC'; } }}
              onMouseOut={e => { e.currentTarget.style.boxShadow = plan.popular ? '0 4px 20px rgba(59,130,246,.35)' : 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; e.currentTarget.style.color = plan.popular ? 'white' : '#94A3B8'; }}
            >
              {plan.popular ? 'Assinar Pro →' : `Assinar ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      {/* Trust */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        {['🔒 SSL Seguro', '🛡️ LGPD', '⚡ 99.9% Uptime', '✅ 7 dias grátis', '🇧🇷 Servidores BR'].map(t => (
          <span key={t} style={{ fontSize: '.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '.3rem' }}>{t}</span>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, textAlign: 'center', marginBottom: '1.25rem' }}>Perguntas frequentes</h3>
        {FAQS.map((faq, i) => (
          <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem .25rem', background: 'none', border: 'none', color: '#F8FAFC', fontWeight: 600, fontSize: '.88rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif', textAlign: 'left', gap: '1rem' }}>
              {faq.q}
              <span style={{ transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform .2s', color: '#64748B', flexShrink: 0 }}>+</span>
            </button>
            {openFaq === i && (
              <div style={{ paddingBottom: '1rem', paddingLeft: '.25rem', fontSize: '.85rem', color: '#94A3B8', lineHeight: 1.7, animation: 'fadeDown .2s ease' }}>{faq.a}</div>
            )}
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title={success ? 'Pagamento realizado!' : `Assinar plano ${selectedPlan?.name}`} icon={success ? '✅' : selectedPlan?.icon} size="sm"
        footer={!success && (
          <>
            <button onClick={() => setPayModal(false)} style={{ padding: '.6rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#94A3B8', cursor: 'pointer', fontSize: '.85rem' }}>Cancelar</button>
            <Button onClick={processPayment} loading={processing}>
              {processing ? 'Processando...' : `Pagar R$${selectedPlan ? currentPrice(selectedPlan) : 0}`}
            </Button>
          </>
        )}
      >
        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '.5rem' }}>Plano {selectedPlan?.name} ativado!</div>
            <div style={{ color: '#64748B', fontSize: '.88rem' }}>Bem-vindo ao GVP BOT {selectedPlan?.name}. Aproveite todos os recursos!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              {[{ id: 'card', label: '💳 Cartão' }, { id: 'pix', label: '🟢 PIX' }, { id: 'boleto', label: '📄 Boleto' }].map(t => (
                <button key={t.id} onClick={() => setPayTab(t.id)} style={{ flex: 1, padding: '.5rem', borderRadius: '8px', fontSize: '.78rem', fontWeight: 700, background: payTab === t.id ? 'rgba(59,130,246,.15)' : 'rgba(255,255,255,.04)', border: `1px solid ${payTab === t.id ? 'rgba(59,130,246,.3)' : 'rgba(255,255,255,.08)'}`, color: payTab === t.id ? '#60A5FA' : '#64748B', cursor: 'pointer', transition: 'all .2s' }}>{t.label}</button>
              ))}
            </div>
            {payTab === 'card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                <div>
                  <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: '.35rem' }}>Número do cartão</label>
                  <input value={cardData.number} onChange={e => setCardData(p => ({...p, number: e.target.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim()}))} placeholder="0000 0000 0000 0000" style={inputStyle} />
                </div>
                <input value={cardData.name} onChange={e => setCardData(p => ({...p, name: e.target.value}))} placeholder="Nome no cartão" style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <input value={cardData.expiry} onChange={e => setCardData(p => ({...p, expiry: e.target.value}))} placeholder="MM/AA" style={inputStyle} />
                  <input value={cardData.cvv} onChange={e => setCardData(p => ({...p, cvv: e.target.value.slice(0,4)}))} placeholder="CVV" style={inputStyle} />
                </div>
              </div>
            )}
            {payTab === 'pix' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '130px', height: '130px', background: 'white', borderRadius: '12px', margin: '0 auto .85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', color: '#333', padding: '8px' }}>
                  <canvas id="pix-qr" width="114" height="114" ref={c => { if(c){const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,114,114);ctx.fillStyle='#000';for(let r=0;r<18;r++)for(let cl=0;cl<18;cl++){if(Math.sin(r*cl+r+cl)>.2)ctx.fillRect(cl*6+2,r*6+2,5,5);}}}} />
                </div>
                <div style={{ fontSize: '.78rem', color: '#64748B', marginBottom: '.5rem' }}>Escaneie com seu banco</div>
                <div style={{ background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.2)', borderRadius: '8px', padding: '.5rem', fontSize: '.75rem', color: '#22C55E', fontWeight: 700 }}>🟢 PIX · 5% de desconto!</div>
              </div>
            )}
            {payTab === 'boleto' && (
              <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '.5rem' }}>📄</div>
                <div style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: '.25rem' }}>Boleto bancário</div>
                <div style={{ fontSize: '.75rem', color: '#64748B', lineHeight: 1.6 }}>Vence em 3 dias úteis.<br/>Compensação em até 2 dias úteis.</div>
                <div style={{ marginTop: '.75rem', padding: '.5rem .75rem', background: 'rgba(255,255,255,.04)', borderRadius: '8px', fontSize: '.72rem', color: '#94A3B8', fontFamily: 'monospace' }}>23793.38012 60007.022069 08000.063305 1 00000000{selectedPlan ? currentPrice(selectedPlan)*100 : '00000'}</div>
              </div>
            )}
            <div style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: '10px', padding: '.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '.82rem' }}>
              <span style={{ color: '#94A3B8' }}>Total {annual ? '(anual)' : '(mensal)'}</span>
              <span style={{ fontWeight: 800, color: '#3B82F6' }}>R${selectedPlan ? currentPrice(selectedPlan) : 0}/mês</span>
            </div>
          </div>
        )}
      </Modal>
      <style>{`@keyframes fadeDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '.7rem .9rem', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '10px', color: '#F8FAFC', fontSize: '.88rem', fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box' };
