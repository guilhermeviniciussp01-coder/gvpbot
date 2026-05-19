import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { getUser, getUserSubscription, createSubscription, supabase } from '@/api/supabaseClient';

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

const PAGBANK_BASE = 'https://api.pagseguro.com';

async function createPagBankCheckout(plan, annual, userEmail) {
  const token  = import.meta.env.VITE_PAGBANK_TOKEN;
  const price  = annual ? plan.price_annual : plan.price;
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const res = await fetch(`${PAGBANK_BASE}/checkouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      reference_id: `gvpbot-${plan.id}-${Date.now()}`,
      customer_modifiable: true,
      items: [{ reference_id: plan.id, name: `GVP BOT — Plano ${plan.name} (${annual ? 'Anual' : 'Mensal'})`, quantity: 1, unit_amount: price * 100 }],
      payment_methods: [{ type: 'CREDIT_CARD' }, { type: 'DEBIT_CARD' }, { type: 'PIX' }, { type: 'BOLETO' }],
      payment_methods_configs: [{ type: 'CREDIT_CARD', config_options: [{ option: 'INSTALLMENTS_LIMIT', value: '12' }] }],
      redirect_url: `${appUrl}/Dashboard?payment=success&plan=${plan.id}`,
      return_url:   `${appUrl}/Dashboard?payment=success&plan=${plan.id}`,
      customer: { email: userEmail || '' },
      notification_urls: [`${appUrl}/api/pagbank-webhook`],
      metadata: { plan_id: plan.id, annual: String(annual) },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_messages?.[0]?.description || data.message || 'Erro ao criar checkout');
  const link = data.links?.find(l => l.rel === 'PAY')?.href || data.links?.[0]?.href;
  if (!link) throw new Error('Link de pagamento não retornado');
  return { checkoutId: data.id, paymentLink: link };
}

// ── Gerar recibo HTML e fazer download ────────────────────────────────────────
function downloadRecibo(sub) {
  const planName = sub.plan_id?.charAt(0).toUpperCase() + sub.plan_id?.slice(1);
  const date = new Date(sub.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Recibo GVP BOT</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 40px; color: #1e293b; }
    .header { text-align: center; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: 900; color: #1e293b; }
    .logo span { color: #3B82F6; }
    .badge { display: inline-block; background: #DCFCE7; color: #166534; padding: 4px 16px; border-radius: 100px; font-size: 13px; font-weight: 700; margin-top: 8px; }
    .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 15px; }
    .label { color: #64748b; }
    .value { font-weight: 600; }
    .total { font-size: 18px; font-weight: 900; color: #3B82F6; }
    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">GVP<span>BOT</span></div>
    <div style="color:#64748b;font-size:13px;margin-top:4px">Recibo de Pagamento</div>
    <div class="badge">✓ Pago</div>
  </div>
  <div class="row"><span class="label">Número do pedido</span><span class="value">${sub.payment_id?.slice(0,20) || '—'}</span></div>
  <div class="row"><span class="label">Data</span><span class="value">${date}</span></div>
  <div class="row"><span class="label">Plano</span><span class="value">${planName}</span></div>
  <div class="row"><span class="label">Período</span><span class="value">Mensal</span></div>
  <div class="row"><span class="label">Status</span><span class="value" style="color:#16a34a">✓ Aprovado</span></div>
  <div class="row" style="border-bottom:none"><span class="label total">Total pago</span><span class="value total">R$ ${Number(sub.amount || 0).toFixed(2).replace('.',',')}</span></div>
  <div class="footer">GVP BOT — Automação WhatsApp e Instagram com IA<br/>Este documento é um comprovante de pagamento eletrônico.</div>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `recibo-gvpbot-${sub.plan_id}-${new Date(sub.created_at).toISOString().slice(0,10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    active:    { label: 'Ativo',     color: '#22C55E', bg: 'rgba(34,197,94,.1)'   },
    pending:   { label: 'Pendente',  color: '#F59E0B', bg: 'rgba(245,158,11,.1)'  },
    cancelled: { label: 'Cancelado', color: '#EF4444', bg: 'rgba(239,68,68,.1)'   },
    expired:   { label: 'Expirado',  color: '#64748B', bg: 'rgba(100,116,139,.1)' },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', padding: '.2rem .65rem', borderRadius: '100px', background: c.bg, color: c.color, fontSize: '.72rem', fontWeight: 700 }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.color, display: 'inline-block' }} />
      {c.label}
    </span>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Planos() {
  const toast = useToast();
  const [annual, setAnnual]             = useState(false);
  const [loading, setLoading]           = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [currentPlan, setCurrentPlan]   = useState(null);
  const [user, setUser]                 = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [histLoading, setHistLoading]   = useState(true);
  const [tab, setTab]                   = useState('planos'); // 'planos' | 'historico'

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      toast({ message: `🎉 Pagamento confirmado! Plano ${params.get('plan')} ativado!`, type: 'success' });
      window.history.replaceState({}, '', '/Planos');
      loadData();
    }
  }, []);

  async function loadData() {
    const u = await getUser();
    setUser(u);
    const sub = await getUserSubscription();
    setCurrentPlan(sub?.plan_id || u?.user_metadata?.plano || 'trial');
    await loadHistory(u);
  }

  async function loadHistory(u) {
    setHistLoading(true);
    try {
      if (!u) return;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error) setSubscriptions(data || []);
    } catch (e) { console.error(e); }
    finally { setHistLoading(false); }
  }

  async function handleCheckout(plan) {
    if (!import.meta.env.VITE_PAGBANK_TOKEN) {
      toast({ message: '⚠️ Configure VITE_PAGBANK_TOKEN no Vercel', type: 'warning' });
      return;
    }
    setLoading(true);
    setCheckoutPlan(plan.id);
    try {
      const price = annual ? plan.price_annual : plan.price;
      const { checkoutId, paymentLink } = await createPagBankCheckout(plan, annual, user?.email);
      await createSubscription(plan.id, checkoutId, price);
      window.location.href = paymentLink;
    } catch (err) {
      toast({ message: `❌ ${err.message}`, type: 'error' });
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
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(0,163,255,.1)', border: '1px solid rgba(0,163,255,.25)', borderRadius: '100px', padding: '.35rem 1rem', fontSize: '.78rem', color: '#67D4FF', fontWeight: 600, marginBottom: '1rem' }}>
          💳 Planos & Assinatura · PagBank
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '.5rem' }}>Escolha seu plano</h1>
        <p style={{ color: '#64748B', fontSize: '.95rem' }}>7 dias grátis · Sem cartão para o trial · Cancele quando quiser</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '2rem', borderBottom: `1px solid ${border}`, paddingBottom: '.75rem' }}>
        {[
          { id: 'planos',    label: '📋 Planos'           },
          { id: 'historico', label: `🧾 Histórico ${subscriptions.length > 0 ? `(${subscriptions.length})` : ''}` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '.5rem 1.1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: tab === t.id ? 700 : 500, fontSize: '.85rem', background: tab === t.id ? 'rgba(59,130,246,.15)' : 'transparent', color: tab === t.id ? '#60A5FA' : '#64748B' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: PLANOS ── */}
      {tab === 'planos' && (
        <>
          {/* Toggle mensal/anual */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
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
              <button onClick={() => setTab('historico')} style={{ marginLeft: 'auto', background: 'none', border: '1px solid rgba(34,197,94,.3)', color: '#4ADE80', borderRadius: '6px', padding: '.2rem .7rem', fontSize: '.75rem', cursor: 'pointer' }}>Ver histórico →</button>
            </div>
          )}

          {/* Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {PLANS.map(plan => {
              const isCurrent = currentPlan === plan.id;
              const price = annual ? plan.price_annual : plan.price;
              return (
                <div key={plan.id} style={{ background: plan.popular ? 'linear-gradient(145deg,rgba(59,130,246,.07),rgba(139,92,246,.07))' : cardBg, border: plan.popular ? '1px solid rgba(59,130,246,.35)' : `1px solid ${border}`, borderRadius: '18px', padding: '1.75rem', position: 'relative' }}>
                  {plan.popular && (
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg,#3B82F6,#8B5CF6)', color: 'white', borderRadius: '100px', padding: '.25rem .9rem', fontSize: '.7rem', fontWeight: 800, whiteSpace: 'nowrap' }}>⭐ MAIS POPULAR</div>
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
                    style={{ width: '100%', padding: '.8rem', borderRadius: '10px', border: 'none', cursor: isCurrent ? 'default' : 'pointer', fontWeight: 700, fontSize: '.88rem', background: isCurrent ? 'rgba(34,197,94,.1)' : plan.popular ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'rgba(255,255,255,.07)', color: isCurrent ? '#4ADE80' : 'white', opacity: loading && checkoutPlan !== plan.id ? .5 : 1, transition: 'all .2s' }}
                  >
                    {isCurrent ? '✓ Plano atual' : loading && checkoutPlan === plan.id ? '⏳ Aguarde...' : `Assinar ${plan.name} →`}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Formas de pagamento */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.82rem', color: '#64748B', fontWeight: 600 }}>Pagamento via:</span>
            {['💳 Cartão (até 12x)', '⚡ PIX', '📄 Boleto', '💳 Débito'].map((m, i) => (
              <span key={i} style={{ fontSize: '.8rem', color: '#94A3B8', background: 'rgba(255,255,255,.04)', padding: '.25rem .7rem', borderRadius: '100px', border: `1px solid ${border}` }}>{m}</span>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: '.75rem', color: '#475569' }}>Processado por <strong style={{ color: '#00A3FF' }}>PagBank</strong></span>
          </div>
        </>
      )}

      {/* ── TAB: HISTÓRICO ── */}
      {tab === 'historico' && (
        <div>
          {histLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Carregando histórico...</div>
          ) : subscriptions.length === 0 ? (
            <div style={{ background: cardBg, border: `1px dashed ${border}`, borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🧾</div>
              <div style={{ fontWeight: 700, marginBottom: '.5rem' }}>Nenhum pagamento encontrado</div>
              <div style={{ color: '#64748B', fontSize: '.88rem' }}>Seus pagamentos aparecerão aqui após a assinatura</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', overflow: 'hidden' }}>
              {/* Cabeçalho da tabela */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 110px 120px', gap: '1rem', padding: '.75rem 1.25rem', background: 'rgba(255,255,255,.02)', borderBottom: `1px solid ${border}`, fontSize: '.73rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                <span>Data</span>
                <span>Plano</span>
                <span>Valor</span>
                <span>Status</span>
                <span style={{ textAlign: 'right' }}>Recibo</span>
              </div>

              {/* Linhas */}
              {subscriptions.map((sub, i) => {
                const planInfo = PLANS.find(p => p.id === sub.plan_id);
                const date = new Date(sub.created_at);
                const isLast = i === subscriptions.length - 1;
                return (
                  <div key={sub.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 110px 120px', gap: '1rem', padding: '1rem 1.25rem', borderBottom: isLast ? 'none' : `1px solid ${border}`, alignItems: 'center', fontSize: '.85rem', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Data */}
                    <div>
                      <div style={{ fontWeight: 600 }}>{date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div style={{ fontSize: '.72rem', color: '#475569', marginTop: '.1rem' }}>{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>

                    {/* Plano */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      {planInfo && <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: `linear-gradient(135deg,${planInfo.color},${planInfo.color2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', flexShrink: 0 }}>{planInfo.icon}</span>}
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{sub.plan_id}</span>
                    </div>

                    {/* Valor */}
                    <div style={{ fontWeight: 700, color: '#F8FAFC' }}>
                      R$ {Number(sub.amount || 0).toFixed(2).replace('.', ',')}
                    </div>

                    {/* Status */}
                    <div><StatusBadge status={sub.status} /></div>

                    {/* Recibo */}
                    <div style={{ textAlign: 'right' }}>
                      {sub.status === 'active' ? (
                        <button
                          onClick={() => downloadRecibo(sub)}
                          style={{ padding: '.35rem .75rem', borderRadius: '7px', border: '1px solid rgba(59,130,246,.3)', background: 'rgba(59,130,246,.08)', color: '#60A5FA', cursor: 'pointer', fontSize: '.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}
                        >
                          ⬇️ Baixar
                        </button>
                      ) : (
                        <span style={{ fontSize: '.75rem', color: '#334155' }}>—</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Rodapé com totais */}
              {subscriptions.some(s => s.status === 'active') && (
                <div style={{ padding: '.85rem 1.25rem', background: 'rgba(255,255,255,.02)', borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', fontSize: '.82rem' }}>
                  <span style={{ color: '#64748B' }}>Total pago:</span>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#4ADE80' }}>
                    R$ {subscriptions.filter(s => s.status === 'active').reduce((acc, s) => acc + Number(s.amount || 0), 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
