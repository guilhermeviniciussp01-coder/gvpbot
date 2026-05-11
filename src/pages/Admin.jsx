import { useState, useEffect } from 'react';
import { Lead, Subscription, Payment, WhatsappInstance, Automation } from '@/api/entities';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate } from '@/lib/utils';

const MOCK_USERS = [
  { id: 'u1', full_name: 'Marcela Costa', email: 'marcela@boutique.com', plan: 'pro', plan_status: 'active', company_name: 'Boutique Estilo', created_date: '2026-03-15T10:00:00Z', is_admin: false },
  { id: 'u2', full_name: 'Rafael Santos', email: 'rafael@delivery.com', plan: 'starter', plan_status: 'active', company_name: 'Sabor do Rio', created_date: '2026-04-02T09:00:00Z', is_admin: false },
  { id: 'u3', full_name: 'Ana Paula Lima', email: 'ana@clinica.com', plan: 'premium', plan_status: 'active', company_name: 'Clínica Bela', created_date: '2026-01-20T11:00:00Z', is_admin: false },
  { id: 'u4', full_name: 'João Ferreira', email: 'joao@imoveis.com', plan: 'trial', plan_status: 'trial', company_name: 'ImobJF', created_date: '2026-05-08T08:00:00Z', is_admin: false },
  { id: 'u5', full_name: 'Carlos Eduardo', email: 'carlos@tech.com', plan: 'pro', plan_status: 'past_due', company_name: 'TecnoWeb', created_date: '2026-02-10T14:00:00Z', is_admin: false },
  { id: 'u6', full_name: 'Luana Martins', email: 'luana@studio.com', plan: 'starter', plan_status: 'active', company_name: 'Studio Hair', created_date: '2026-04-18T10:30:00Z', is_admin: false },
  { id: 'u7', full_name: 'Guilherme Vinicius', email: 'guilherme@gvpbot.com', plan: 'premium', plan_status: 'active', company_name: 'GVP BOT', created_date: '2026-01-01T00:00:00Z', is_admin: true },
];

const MOCK_PAYMENTS = [
  { id: 'p1', description: 'Plano Pro - Maio/2026', amount: 197, status: 'approved', method: 'credit_card', paid_at: '2026-05-01T10:00:00Z', user: 'Marcela Costa' },
  { id: 'p2', description: 'Plano Premium - Maio/2026', amount: 397, status: 'approved', method: 'pix', paid_at: '2026-05-01T09:00:00Z', user: 'Ana Paula Lima' },
  { id: 'p3', description: 'Plano Starter - Maio/2026', amount: 97, status: 'approved', method: 'boleto', paid_at: '2026-05-03T11:00:00Z', user: 'Rafael Santos' },
  { id: 'p4', description: 'Plano Pro - Maio/2026', amount: 197, status: 'rejected', method: 'credit_card', paid_at: '2026-05-05T15:00:00Z', user: 'Carlos Eduardo' },
  { id: 'p5', description: 'Plano Starter - Maio/2026', amount: 97, status: 'approved', method: 'pix', paid_at: '2026-05-02T08:30:00Z', user: 'Luana Martins' },
];

function MetricCard({ icon, label, value, trend, color, sub }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.35rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>{icon}</div>
        {trend && <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '.18rem .55rem', borderRadius: '100px', background: trend.startsWith('+') ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)', color: trend.startsWith('+') ? '#22C55E' : '#EF4444' }}>{trend}</span>}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1, background: `linear-gradient(135deg,${color},${color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '.2rem' }}>{value}</div>
      <div style={{ fontSize: '.78rem', color: '#64748B' }}>{label}</div>
      {sub && <div style={{ fontSize: '.72rem', color: '#475569', marginTop: '.2rem' }}>{sub}</div>}
    </div>
  );
}

export default function Admin() {
  const toast = useToast();
  const [tab, setTab] = useState('overview');
  const [users, setUsers] = useState(MOCK_USERS);
  const [payments] = useState(MOCK_PAYMENTS);
  const [blockModal, setBlockModal] = useState(false);
  const [blockId, setBlockId] = useState(null);
  const [search, setSearch] = useState('');

  const mrr = MOCK_USERS.reduce((a, u) => {
    const prices = { starter: 97, pro: 197, premium: 397, trial: 0 };
    return a + (u.plan_status === 'active' ? prices[u.plan] || 0 : 0);
  }, 0);

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.company_name?.toLowerCase().includes(q);
  });

  const PLAN_CFG = {
    trial: { color: '#F59E0B', bg: 'rgba(245,158,11,.12)' },
    starter: { color: '#64748B', bg: 'rgba(100,116,139,.12)' },
    pro: { color: '#3B82F6', bg: 'rgba(59,130,246,.12)' },
    premium: { color: '#8B5CF6', bg: 'rgba(139,92,246,.12)' },
  };
  const STATUS_CFG = {
    active: { label: 'Ativo', color: '#22C55E' },
    trial: { label: 'Trial', color: '#F59E0B' },
    past_due: { label: 'Atrasado', color: '#EF4444' },
    cancelled: { label: 'Cancelado', color: '#64748B' },
    blocked: { label: 'Bloqueado', color: '#EF4444' },
  };
  const PAY_STATUS = {
    approved: { label: '✅ Aprovado', color: '#22C55E' },
    rejected: { label: '❌ Recusado', color: '#EF4444' },
    pending: { label: '⏳ Pendente', color: '#F59E0B' },
    refunded: { label: '↩️ Estornado', color: '#64748B' },
  };

  const TABS = [
    { id: 'overview', label: '📊 Visão Geral' },
    { id: 'users', label: '👥 Usuários' },
    { id: 'payments', label: '💳 Pagamentos' },
    { id: 'system', label: '⚙️ Sistema' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Admin Banner */}
      <div style={{ background: 'linear-gradient(135deg,rgba(239,68,68,.1),rgba(239,68,68,.05))', border: '1px solid rgba(239,68,68,.25)', borderRadius: '14px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '1.5rem' }}>🛡️</span>
        <div>
          <div style={{ fontWeight: 800, color: '#FCA5A5', fontSize: '.95rem' }}>Painel Administrativo</div>
          <div style={{ fontSize: '.78rem', color: '#64748B' }}>Acesso restrito — visível apenas para administradores</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.6rem' }}>
          <span style={{ padding: '.25rem .75rem', borderRadius: '100px', background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', color: '#FCA5A5', fontSize: '.72rem', fontWeight: 700 }}>🔴 ADMIN</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '.4rem', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', padding: '.3rem' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '.55rem .75rem', borderRadius: '9px', fontSize: '.82rem', fontWeight: 700, background: tab === t.id ? 'rgba(239,68,68,.15)' : 'transparent', border: `1px solid ${tab === t.id ? 'rgba(239,68,68,.3)' : 'transparent'}`, color: tab === t.id ? '#FCA5A5' : '#64748B', cursor: 'pointer', transition: 'all .2s' }}>{t.label}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
            <MetricCard icon="👥" label="Usuários totais" value={users.length} trend="+3 este mês" color="#3B82F6" />
            <MetricCard icon="💰" label="MRR" value={`R$${mrr.toLocaleString('pt-BR')}`} trend="+18%" color="#22C55E" sub="Receita mensal recorrente" />
            <MetricCard icon="🚀" label="Planos Pro" value={users.filter(u => u.plan === 'pro').length} color="#8B5CF6" sub={`${users.filter(u => u.plan === 'premium').length} Premium`} />
            <MetricCard icon="⚠️" label="Pagamentos atrasados" value={users.filter(u => u.plan_status === 'past_due').length} trend="-1" color="#EF4444" />
          </div>

          {/* Plan distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ fontWeight: 800, marginBottom: '1.25rem' }}>Distribuição por plano</div>
              {[
                { plan: 'premium', label: 'Premium', count: users.filter(u => u.plan === 'premium').length, color: '#8B5CF6' },
                { plan: 'pro', label: 'Pro', count: users.filter(u => u.plan === 'pro').length, color: '#3B82F6' },
                { plan: 'starter', label: 'Starter', count: users.filter(u => u.plan === 'starter').length, color: '#64748B' },
                { plan: 'trial', label: 'Trial', count: users.filter(u => u.plan === 'trial').length, color: '#F59E0B' },
              ].map(p => (
                <div key={p.plan} style={{ marginBottom: '.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginBottom: '.3rem' }}>
                    <span style={{ color: '#94A3B8' }}>{p.label}</span>
                    <span style={{ fontWeight: 700 }}>{p.count} ({Math.round((p.count / users.length) * 100)}%)</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(p.count / users.length) * 100}%`, height: '100%', background: `linear-gradient(90deg,${p.color},${p.color}88)`, borderRadius: '3px', transition: 'width .8s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem' }}>
              <div style={{ fontWeight: 800, marginBottom: '1.25rem' }}>Últimos pagamentos</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {payments.slice(0, 4).map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.5rem', background: 'rgba(255,255,255,.02)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '1rem' }}>{p.method === 'pix' ? '🟢' : p.method === 'boleto' ? '📄' : '💳'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.user}</div>
                      <div style={{ fontSize: '.7rem', color: '#64748B' }}>{p.description.split(' - ')[0]}</div>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '.85rem', color: p.status === 'approved' ? '#22C55E' : '#EF4444' }}>R${p.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '.5rem', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '10px', padding: '.5rem .85rem' }}>
              <span style={{ color: '#64748B' }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuário..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: '.85rem', fontFamily: 'Inter,sans-serif' }} />
            </div>
            <span style={{ fontSize: '.82rem', color: '#64748B' }}>{filteredUsers.length} usuários</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,.03)' }}>
                    {['Usuário', 'Empresa', 'Plano', 'Status', 'Cadastro', 'Ações'].map(h => (
                      <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => {
                    const planC = PLAN_CFG[u.plan] || PLAN_CFG.trial;
                    const stC = STATUS_CFG[u.plan_status] || STATUS_CFG.active;
                    return (
                      <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,.04)', transition: 'background .15s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '.8rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg,${planC.color},${planC.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 700, flexShrink: 0 }}>{(u.full_name || '?')[0]}</div>
                            <div>
                              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '.4rem' }}>{u.full_name} {u.is_admin && <span style={{ fontSize: '.55rem', background: 'rgba(239,68,68,.15)', color: '#FCA5A5', padding: '.1rem .4rem', borderRadius: '4px', fontWeight: 800 }}>ADMIN</span>}</div>
                              <div style={{ fontSize: '.72rem', color: '#64748B' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '.8rem 1rem', color: '#94A3B8' }}>{u.company_name}</td>
                        <td style={{ padding: '.8rem 1rem' }}>
                          <span style={{ padding: '.2rem .6rem', borderRadius: '100px', fontSize: '.7rem', fontWeight: 700, background: planC.bg, color: planC.color, border: `1px solid ${planC.color}30` }}>{u.plan?.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: '.8rem 1rem' }}>
                          <span style={{ fontSize: '.78rem', fontWeight: 600, color: stC.color }}>{stC.label}</span>
                        </td>
                        <td style={{ padding: '.8rem 1rem', color: '#64748B', fontSize: '.78rem' }}>{formatDate(u.created_date)}</td>
                        <td style={{ padding: '.8rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '.3rem' }}>
                            <button onClick={() => { const plans = ['trial', 'starter', 'pro', 'premium']; const idx = plans.indexOf(u.plan); setUsers(p => p.map(x => x.id === u.id ? { ...x, plan: plans[(idx + 1) % plans.length] } : x)); toast({ message: '✅ Plano alterado', type: 'success' }); }} style={{ ...smallBtn }} title="Mudar plano">📋</button>
                            {!u.is_admin && <button onClick={() => { setBlockId(u.id); setBlockModal(true); }} style={{ ...smallBtn, color: '#EF4444' }} title="Bloquear">🚫</button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENTS */}
      {tab === 'payments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
            <MetricCard icon="💰" label="Receita este mês" value={`R$${payments.filter(p => p.status === 'approved').reduce((a, p) => a + p.amount, 0).toLocaleString('pt-BR')}`} trend="+22%" color="#22C55E" />
            <MetricCard icon="✅" label="Aprovados" value={payments.filter(p => p.status === 'approved').length} color="#3B82F6" />
            <MetricCard icon="❌" label="Recusados" value={payments.filter(p => p.status === 'rejected').length} color="#EF4444" />
          </div>
          <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,.03)' }}>
                    {['Cliente', 'Descrição', 'Valor', 'Método', 'Status', 'Data'].map(h => (
                      <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: '#475569' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => {
                    const st = PAY_STATUS[p.status] || PAY_STATUS.pending;
                    return (
                      <tr key={p.id} style={{ borderTop: '1px solid rgba(255,255,255,.04)' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '.8rem 1rem', fontWeight: 600 }}>{p.user}</td>
                        <td style={{ padding: '.8rem 1rem', color: '#94A3B8' }}>{p.description}</td>
                        <td style={{ padding: '.8rem 1rem', fontWeight: 800, color: '#22C55E' }}>R${p.amount}</td>
                        <td style={{ padding: '.8rem 1rem', color: '#64748B', textTransform: 'capitalize' }}>{p.method.replace('_', ' ')}</td>
                        <td style={{ padding: '.8rem 1rem' }}><span style={{ fontSize: '.78rem', fontWeight: 700, color: st.color }}>{st.label}</span></td>
                        <td style={{ padding: '.8rem 1rem', color: '#64748B', fontSize: '.78rem' }}>{formatDate(p.paid_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM */}
      {tab === 'system' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {[
            { title: '🔒 Segurança', items: ['bcrypt hash senhas', 'JWT tokens válidos 7d', 'Rate limit 100 req/min', 'CORS configurado', 'Sanitização de inputs', 'Proteção CSRF ativa'] },
            { title: '🌐 Infraestrutura', items: ['Uptime: 99.9%', 'Latência média: 45ms', 'CDN ativo (CloudFlare)', 'SSL/TLS v1.3', 'Backups diários', 'Servidores: São Paulo, BR'] },
            { title: '📊 Database', items: ['Base44 Cloud DB', '6 entidades ativas', 'RLS habilitado', 'Índices otimizados', 'Migrations automáticas', 'LGPD compliance'] },
            { title: '🔗 Integrações', items: ['Evolution API: Configurado', 'OpenRouter: Ativo', 'Mercado Pago: Ativo', 'Webhooks: Configurados', 'SMTP: Gmail ativo', 'API Docs: Disponível'] },
          ].map((sec, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '1.35rem' }}>
              <div style={{ fontWeight: 800, marginBottom: '1rem' }}>{sec.title}</div>
              {sec.items.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.35rem 0', borderBottom: '1px solid rgba(255,255,255,.04)', fontSize: '.82rem' }}>
                  <span style={{ color: '#22C55E', flexShrink: 0, fontSize: '.7rem' }}>✓</span>
                  <span style={{ color: '#94A3B8' }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal open={blockModal} onClose={() => setBlockModal(false)} onConfirm={() => { setUsers(p => p.map(u => u.id === blockId ? { ...u, plan_status: 'blocked' } : u)); setBlockModal(false); toast({ message: '🚫 Usuário bloqueado', type: 'warning' }); }} title="Bloquear usuário?" description="O usuário perderá acesso ao sistema imediatamente." confirmText="Bloquear" />
    </div>
  );
}

const smallBtn = { width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem' };
