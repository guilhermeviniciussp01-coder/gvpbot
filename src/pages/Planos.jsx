import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { getUser, getUserSubscription, createSubscription } from '@/api/supabaseClient';

const PLANS = [
  {
    id: 'starter', name: 'Starter', icon: '🌱',
    price: 97, price_annual: 77,
    color: '#64748B', color2: '#475569',
    features: ['1 número WhatsApp', 'Até 500 conversas/mês', 'Bot com menus básicos', 'Captura de leads', 'Dashboard básico', 'Suporte por email'],
    off: ['IA com OpenRouter', 'Instagram', 'CRM completo', 'Analytics avançado'],
  },
  {
    id: 'pro', name: 'Pro', icon: '🚀',
    price: 197, price_annual: 157,
    color: '#3B82F6', color2: '#8B5CF6', popular: true,
    features: ['3 números WhatsApp', 'Conversas ilimitadas', 'IA com OpenRouter', 'WhatsApp + Instagram', 'CRM completo', 'Analytics avançado', 'Automações visuais', 'Suporte prioritário'],
    off: ['White-label', 'Gerente de conta'],
  },
  {
    id: 'premium', name: 'Premium', icon: '💎',
    price: 397, price_annual: 317,
    color: '#8B5CF6', color2: '#6D28D9',
    features: ['Números ilimitados', 'Conversas ilimitadas', 'IA customizada', 'Todos os canais', 'CRM + automações', 'Analytics + BI export', 'White-label completo', 'Gerente de conta dedicado', 'SLA 99.9%'],
    off: [],
  },
];

// ── PagBank: criar assinatura recorrente ──────────────────────────────────────
// PagBank sandbox: https://sandbox.api.pagseguro.com
// PagBank produção: https://api.pagseguro.com
const PAGBANK_BASE = 'https://api.pagseguro.com';

async function createPagBankPlan(plan, annual) {
  const token = import.meta.env.VITE_PAGBANK_TOKEN;
  const price = annual ? plan.price_annual : plan.price;

  // 1. Criar plano de assinatura no PagBank (se não existir)
  const planRes = await fetch(`${PAGBANK_BASE}/recurring-charges/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: `GVP BOT — Plano ${plan.name}`,
      description: `Assinatura ${annual ? 'anual' : 'mensal'} do plano ${plan.name}`,
      amount: {
        value: price * 100, // centavos
        currency: 'BRL',
      },
      interval: {
        unit: annual ? 'YEAR' : 'MONTH',
        length: 1,
      },
      trial: {
        enabled: true,
        hold_setup_fee: false,
        days: 7,
      },
    }),
  });

  const planData = await planRes.json();
  if (!planRes.ok) throw new Error(planData.error_messages?.[0]?.description || planData.message || 'Erro ao criar plano no PagBank');
  return planData.id;
}

async function createPagBankCheckout(plan, annual, userEmail) {
  const token = import.meta.env.VITE_PAGBANK_TOKEN;
  const price = annual ? plan.price_annual : plan.price;
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  // Usar o endpoint de checkout do PagBank (gera link de pagamento)
  const res = await fetch(`${PAGBANK_BASE}/checkouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      reference_id: `gvpbot-${plan.id}-${Date.now()}`,
      customer_modifiable: true,
      items: [
        {
          reference_id: plan.id,
          name: `GVP BOT — Plano ${plan.name} (${annual ? 'Anual' : 'Mensal'})`,
          quantity: 1,
          unit_amount: price * 100, // centavos
        },
      ],
      payment_methods: [
        { type: 'CREDIT_CARD' },
        { type: 'DEBIT_CARD' },
        { type: 'PIX' },
        { type: 'BOLETO' },
      ],
      payment_methods_configs: [
        {
          type: 'CREDIT_CARD',
          config_options: [
            { option: 'INSTALLMENTS_LIMIT', value: '12' },
          ],
        },
      ],
      redirect_url: `${appUrl}/Dashboard?payment=success&plan=${plan.id}`,
      return_url:   `${appUrl}/Dashboard?payment=success&plan=${plan.id}`,
      customer: { email: userEmail || '' },
      notification_urls: [`${appUrl}/api/pagbank-webhook`],
      metadata: {
        plan_id: plan.id,
        annual: String(annual),
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error_messages?.[0]?.description || data.message || 'Erro ao criar checkout');

  // Retorna o link de pagamento
  const link = data.links?.find(l => l.rel === 'PAY')?.href
             || data.links?.[0]?.href;
  if (!link) throw new Error('Link de pagamento não retornado pelo PagBank');
  return { checkoutId: data.id, paymentLink: link };
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Planos() {
  const toast = useToast();
  const [annual, setAnnual]             = useState(false);
  const [loading, setLoading]           = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [currentPlan, setCurrentPlan]   = useState(null);
  const [user, setUser]                 = useState(null);

  useEffect(() => { loadData(); }, []);

  // Verificar retorno do PagBank
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const plan    = params.get('plan');
    if (payment === 'success' && plan) {
      toast({ message: `🎉 Pagamento confirmado! Plano ${plan} ativado!`, type: 'success' });
      window.history.replaceState({}, '', '/Planos');
      loadData();
    }
  }, []);

  async function loadData() {
    const u = await getUser();
    setUser(u);
    const sub = await getUserSubscription();
    setCurrentPlan(sub?.plan_id || u?.user_metadata?.plano || 'trial');
  }

  async function handleCheckout(plan) {
    if (!import.meta.env.VITE_PAGBANK_TOKEN) {
      toast({ message: '⚠️ Configure VITE_PAGBANK_TOKEN no Vercel para ativar pagamentos', type: 'warning' });
      return;
    }
    setLoading(true);
    setCheckoutPlan(plan.id);
    try {
      const price = annual ? plan.price_annual : plan.price;
      const { checkoutId, paymentLink } = await createPagBankCheckout(plan, annual, user?.email);

      // Salva assinatura como pendente antes de redirecionar
      await createSubscription(plan.id, checkoutId, price);

      // Redireciona para o checkout do PagBank
      window.location.href = paymentLink;
    } catch (err) {
      toast({ message: `❌ Erro: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
      setCheckoutPlan(null);
    }
  }

  const cardBg = 'rgba(255,255,255,.03)';
  const border = 'rgba(255,255,255,.08)';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'Inter,sans-serif', color: '#F8FAFC' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(0,163,255,.1)', border: '1px solid rgba(0,163,255,.25)', borderRadius: '100px', padding: '.35rem 1rem', fontSize: '.78rem', color: '#67D4FF', fontWeight: 600, marginBottom: '1rem' }}>
          💳 Planos & Assinatura · PagBank
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '.5rem' }}>Escolha seu plano</h1>
        <p style={{ color: '#64748B', fontSize: '.95rem', marginBottom: '1.5rem' }}>7 dias grátis · Sem cartão para o trial · Cancele quando quiser</p>

        {/* Toggle mensal/anual */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.75rem', background: 'rgba(255,255,255,.04)', border: `1px solid ${border}`, borderRadius: '100px', padding: '.3rem .5rem' }}>
          <button onClick={() => setAnnual(false)} style={{ padding: '.35rem .9rem', borderRadius: '100px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '.82rem', background: !annual ? '#3B82F6' : 'transparent', color: !annual ? 'white' : '#64748B', transition: 'all .2s' }}>Mensal</button>
          <button onClick={() => setAnnual(true)} style={{ padding: '.35rem .9rem', borderRadius: '100px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '.82rem', background: annual ? '#3B82F6' : 'transparent', color: annual ? 'white' : '#64748B', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            Anual <span style={{ background: '#22C55E', color: 'white', fontSize: '.65rem', padding: '.1rem .4rem', borderRadius: '100px' }}>-20%</span>
          </button>
        </div>
      </div>

      {/* Plano atual */}
      {currentPlan && currentPlan !== 'trial' && (
        <div style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', borderRadius: '12px', padding: '.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '.75rem', fontSize: '.88rem' }}>
          ✅ Plano atual: <strong style={{ color: '#4ADE80', textTransform: 'capitalize' }}>{currentPlan}</strong>
        </div>
      )}

      {/* Cards dos planos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        {PLANS.map(plan => {
          const isCurrent = currentPlan === plan.id;
          const price = annual ? plan.price_annual : plan.price;
          return (
            <div key={plan.id} style={{
              background: plan.popular ? 'linear-gradient(145deg,rgba(59,130,246,.07),rgba(139,92,246,.07))' : cardBg,
              border: plan.popular ? '1px solid rgba(59,130,246,.35)' : `1px solid ${border}`,
              borderRadius: '18px', padding: '1.75rem', position: 'relative',
            }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg,#3B82F6,#8B5CF6)', color: 'white', borderRadius: '100px', padding: '.25rem .9rem', fontSize: '.7rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                  ⭐ MAIS POPULAR
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `linear-gradient(135deg,${plan.color},${plan.color2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>{plan.icon}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{plan.name}</div>
                  {isCurrent && <span style={{ fontSize: '.65rem', background: 'rgba(34,197,94,.15)', color: '#4ADE80', padding: '.1rem .5rem', borderRadius: '100px', fontWeight: 700 }}>ATUAL</span>}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 900 }}>R${price}</span>
                <span style={{ color: '#64748B', fontSize: '.85rem' }}>/mês</span>
                {annual && <div style={{ fontSize: '.75rem', color: '#4ADE80', marginTop: '.2rem' }}>Cobrado anualmente · Economia R${(plan.price - plan.price_annual) * 12}/ano</div>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1.5rem' }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.82rem', color: '#CBD5E1' }}>
                    <span style={{ color: '#22C55E', fontSize: '.75rem' }}>✓</span> {f}
                  </div>
                ))}
                {plan.off.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.82rem', color: '#334155' }}>
                    <span style={{ fontSize: '.75rem' }}>✗</span> {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleCheckout(plan)}
                disabled={loading || isCurrent}
                style={{
                  width: '100%', padding: '.8rem', borderRadius: '10px', border: 'none',
                  cursor: isCurrent ? 'default' : 'pointer', fontWeight: 700, fontSize: '.88rem',
                  background: isCurrent ? 'rgba(34,197,94,.1)' : plan.popular ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'rgba(255,255,255,.07)',
                  color: isCurrent ? '#4ADE80' : 'white',
                  opacity: loading && checkoutPlan !== plan.id ? .5 : 1,
                  transition: 'all .2s',
                }}
              >
                {isCurrent ? '✓ Plano atual' : loading && checkoutPlan === plan.id ? '⏳ Aguarde...' : `Assinar ${plan.name} →`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Formas de pagamento aceitas */}
      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '.82rem', color: '#64748B', fontWeight: 600 }}>Formas de pagamento:</span>
        {['💳 Cartão de crédito (até 12x)', '💳 Cartão de débito', '⚡ PIX (aprovação imediata)', '📄 Boleto bancário'].map((m, i) => (
          <span key={i} style={{ fontSize: '.8rem', color: '#94A3B8', background: 'rgba(255,255,255,.04)', padding: '.25rem .7rem', borderRadius: '100px', border: `1px solid ${border}` }}>{m}</span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '.75rem', color: '#475569' }}>Processado por <strong style={{ color: '#00A3FF' }}>PagBank</strong></span>
      </div>

      {/* Aviso de configuração */}
      {!import.meta.env.VITE_PAGBANK_TOKEN && (
        <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ fontWeight: 700, color: '#F59E0B', marginBottom: '.5rem' }}>⚙️ Configure o PagBank</div>
          <div style={{ fontSize: '.85rem', color: '#94A3B8', lineHeight: 1.7 }}>
            Adicione no Vercel → Settings → Environment Variables:<br />
            <code style={{ background: 'rgba(255,255,255,.06)', padding: '.1rem .45rem', borderRadius: '4px', fontSize: '.8rem' }}>VITE_PAGBANK_TOKEN</code> — Token da sua conta PagBank (Negócios → API e integrações)<br />
            <code style={{ background: 'rgba(255,255,255,.06)', padding: '.1rem .45rem', borderRadius: '4px', fontSize: '.8rem' }}>VITE_APP_URL</code> — URL do seu SaaS (ex: https://gvpbot.vercel.app)
          </div>
        </div>
      )}

      {/* FAQs */}
      <div style={{ borderTop: `1px solid ${border}`, paddingTop: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem', textAlign: 'center' }}>Dúvidas frequentes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {[
            { q: 'Posso cancelar a qualquer momento?', a: 'Sim! Sem contratos. Cancele pelo painel e o acesso continua até o fim do período pago.' },
            { q: 'Como funciona o pagamento via PagBank?', a: 'Aceita cartão (crédito/débito até 12x), PIX (aprovação na hora) e boleto. Renovação automática.' },
            { q: 'O trial é realmente gratuito?', a: '7 dias com todos os recursos do Pro, sem precisar de cartão. Cancele antes e não cobra nada.' },
            { q: 'Posso trocar de plano?', a: 'Sim! Upgrade ou downgrade a qualquer momento. Valor calculado proporcionalmente.' },
          ].map((faq, i) => (
            <div key={i} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '12px', padding: '1rem 1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '.4rem' }}>{faq.q}</div>
              <div style={{ color: '#64748B', fontSize: '.82rem', lineHeight: 1.6 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
