import { useState, useEffect } from 'react';

import { generateMockMetrics, generateSparkData, formatNumber, formatCurrency, formatRelative, getInitials, getAvatarColor } from '@/lib/utils';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

function SparkLine({ data, color = '#3B82F6', height = 40 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.val));
  const min = Math.min(...data.map(d => d.val));
  const range = max - min || 1;
  const w = 120, h = height;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d.val - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts + ` ${w},${h} 0,${h}`} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BarChart({ data, color = '#3B82F6' }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.val));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
      {data.slice(-20).map((d, i) => (
        <div key={i} style={{
          flex: 1, borderRadius: '3px 3px 0 0',
          height: `${(d.val / max) * 100}%`,
          background: `linear-gradient(180deg, ${color}, ${color}88)`,
          opacity: .7 + (i / data.length) * .3,
          transition: 'height .5s ease',
          minWidth: '4px',
        }} />
      ))}
    </div>
  );
}

const KPI_CONFIGS = [
  { key: 'conversations', label: 'Conversas hoje', icon: '💬', color: '#3B82F6', suffix: '', prefix: '' },
  { key: 'leads', label: 'Leads capturados', icon: '👥', color: '#22C55E', suffix: '', prefix: '' },
  { key: 'conversion', label: 'Taxa de conversão', icon: '🎯', color: '#8B5CF6', suffix: '%', prefix: '' },
  { key: 'response_time', label: 'Tempo de resposta', icon: '⚡', color: '#F59E0B', suffix: 's', prefix: '' },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState([]);
  const [leads, setLeads] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [kpis, setKpis] = useState({ conversations: 0, leads: 0, conversion: 0, response_time: 0 });
  const [animatedKpis, setAnimatedKpis] = useState({ conversations: 0, leads: 0, conversion: 0, response_time: 0 });
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    loadData();
  }, [period]);
async function loadData() {
  setLoading(true);

  try {
    const mockMetrics = generateMockMetrics();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 14;

    setMetrics(mockMetrics.slice(-days));

    const newKpis = {
      conversations: 1247,
      leads: 89,
      conversion: 34.2,
      response_time: 0.4
    };

    setKpis(newKpis);
    animateKpis(newKpis);

  } catch (e) {
    console.error(e);
  } finally {
    setLoading(false);
  }
}
 

  function animateKpis(target) {
    const duration = 1400;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimatedKpis({
        conversations: Math.floor(target.conversations * ease),
        leads: Math.floor(target.leads * ease),
        conversion: parseFloat((target.conversion * ease).toFixed(1)),
        response_time: parseFloat((target.response_time * ease).toFixed(1)),
      });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const MOCK_LEADS = [
    { id: '1', name: 'Maria Silva', phone: '(11) 9 9821-3344', status: 'new', source: 'WhatsApp', created_date: new Date(Date.now() - 120000).toISOString() },
    { id: '2', name: 'João Santos', phone: '(21) 9 8765-4321', status: 'contacted', source: 'Instagram', created_date: new Date(Date.now() - 360000).toISOString() },
    { id: '3', name: 'Ana Lima', phone: '(31) 9 7654-3210', status: 'negotiation', source: 'WhatsApp', created_date: new Date(Date.now() - 900000).toISOString() },
    { id: '4', name: 'Carlos Alves', phone: '(41) 9 6543-2109', status: 'closed', source: 'WhatsApp', created_date: new Date(Date.now() - 1800000).toISOString() },
    { id: '5', name: 'Fernanda Rocha', phone: '(51) 9 5432-1098', status: 'contacted', source: 'Instagram', created_date: new Date(Date.now() - 3600000).toISOString() },
  ];

  const MOCK_CONVS = [
    { id: '1', lead_name: 'Maria Silva', lead_phone: '(11) 9 9821-3344', status: 'bot', last_message: 'Olá! Quero saber sobre os preços...', last_message_at: new Date(Date.now() - 60000).toISOString(), unread_count: 2 },
    { id: '2', lead_name: 'João Santos', lead_phone: '(21) 9 8765-4321', status: 'open', last_message: 'Qual o prazo de entrega?', last_message_at: new Date(Date.now() - 300000).toISOString(), unread_count: 1 },
    { id: '3', lead_name: 'Loja Boutique', lead_phone: '(31) 9 7654-0001', status: 'waiting', last_message: 'Preciso de orçamento para 50 peças', last_message_at: new Date(Date.now() - 720000).toISOString(), unread_count: 0 },
    { id: '4', lead_name: 'Studio Hair', lead_phone: '(85) 9 4444-3333', status: 'bot', last_message: 'Quero agendar uma visita', last_message_at: new Date(Date.now() - 1500000).toISOString(), unread_count: 3 },
  ];

  const displayLeads = leads.length > 0 ? leads : MOCK_LEADS;
  const displayConvs = conversations.length > 0 ? conversations : MOCK_CONVS;

  const statusColors = { new: '#3B82F6', contacted: '#F59E0B', negotiation: '#8B5CF6', closed: '#22C55E', lost: '#EF4444' };
  const statusLabels = { new: 'Novo', contacted: 'Contato', negotiation: 'Negociando', closed: 'Fechado', lost: 'Perdido' };
  const convStatusColors = { bot: '#22C55E', open: '#3B82F6', waiting: '#F59E0B', closed: '#64748B' };
  const convStatusLabels = { bot: 'Bot', open: 'Aberto', waiting: 'Aguardando', closed: 'Fechado' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.2rem' }}>Dashboard</h2>
          <p style={{ fontSize: '.85rem', color: '#64748B' }}>Visão geral do seu atendimento em tempo real</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {['7d', '14d', '30d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '.45rem .9rem', borderRadius: '8px', fontSize: '.8rem', fontWeight: 600,
              background: period === p ? 'rgba(59,130,246,.15)' : 'rgba(255,255,255,.04)',
              border: `1px solid ${period === p ? 'rgba(59,130,246,.35)' : 'rgba(255,255,255,.08)'}`,
              color: period === p ? '#60A5FA' : '#64748B', cursor: 'pointer', transition: 'all .2s'
            }}>Últimos {p}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        {loading ? KPI_CONFIGS.map((_, i) => <SkeletonCard key={i} rows={2} />) :
          [
            { label: 'Conversas hoje', value: animatedKpis.conversations, icon: '💬', color: '#3B82F6', trend: '+34%', spark: generateSparkData() },
            { label: 'Leads capturados', value: animatedKpis.leads, icon: '👥', color: '#22C55E', trend: '+28%', spark: generateSparkData() },
            { label: 'Taxa de conversão', value: `${animatedKpis.conversion}%`, icon: '🎯', color: '#8B5CF6', trend: '+12%', spark: generateSparkData() },
            { label: 'Tempo de resposta', value: `${animatedKpis.response_time}s`, icon: '⚡', color: '#F59E0B', trend: '-18%', spark: generateSparkData() },
          ].map((kpi, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
              borderRadius: '16px', padding: '1.25rem', transition: 'all .3s',
              cursor: 'default',
            }}
              onMouseOver={e => { e.currentTarget.style.border = `1px solid ${kpi.color}44`; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,.4)`; }}
              onMouseOut={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,.07)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: `${kpi.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
                }}>{kpi.icon}</div>
                <span style={{
                  fontSize: '.72rem', fontWeight: 700, padding: '.2rem .55rem', borderRadius: '100px',
                  background: 'rgba(34,197,94,.12)', color: '#22C55E'
                }}>{kpi.trend}</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, marginBottom: '.25rem', background: `linear-gradient(135deg,${kpi.color},${kpi.color}99)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {typeof kpi.value === 'number' ? kpi.value.toLocaleString('pt-BR') : kpi.value}
              </div>
              <div style={{ fontSize: '.78rem', color: '#64748B' }}>{kpi.label}</div>
              <div style={{ marginTop: '.75rem' }}><SparkLine data={kpi.spark} color={kpi.color} height={32} /></div>
            </div>
          ))
        }
      </div>

      {/* Chart + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.25rem' }}>
        {/* Bar Chart */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontWeight: 800, marginBottom: '.2rem' }}>Conversas × Leads</div>
              <div style={{ fontSize: '.75rem', color: '#64748B' }}>Crescimento nos últimos {period}</div>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', fontSize: '.75rem' }}>
              <span style={{ color: '#3B82F6' }}>● Conversas</span>
              <span style={{ color: '#22C55E' }}>● Leads</span>
            </div>
          </div>
          {loading ? <Skeleton height="80px" /> : (
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
                {metrics.map((m, i) => {
                  const maxConv = Math.max(...metrics.map(x => x.conversations_count));
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{ width: '100%', borderRadius: '3px 3px 0 0', height: `${(m.conversations_count / maxConv) * 100}px`, background: 'linear-gradient(180deg,#3B82F6,#1D4ED8)', opacity: .8, transition: 'height .5s ease', minWidth: '6px' }} />
                      <div style={{ width: '100%', borderRadius: '3px 3px 0 0', height: `${(m.leads_count / maxConv) * 100}px`, background: 'linear-gradient(180deg,#22C55E,#16A34A)', opacity: .7, transition: 'height .5s ease', minWidth: '6px' }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.5rem', fontSize: '.65rem', color: '#475569' }}>
                {metrics.filter((_, i) => i % Math.floor(metrics.length / 5) === 0).map((m, i) => (
                  <span key={i}>{m.date.slice(5)}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontWeight: 800, marginBottom: '.25rem' }}>Performance IA</div>
          {[
            { label: 'Msgs respondidas (bot)', val: 94, color: '#3B82F6' },
            { label: 'Satisfação clientes', val: 98, color: '#22C55E' },
            { label: 'Taxa de captura leads', val: 67, color: '#8B5CF6' },
            { label: 'Automações ativas', val: 83, color: '#F59E0B' },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: '.35rem' }}>
                <span style={{ color: '#94A3B8' }}>{item.label}</span>
                <span style={{ fontWeight: 700 }}>{item.val}%</span>
              </div>
              <div style={{ height: '5px', background: 'rgba(255,255,255,.07)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${item.val}%`, height: '100%', background: `linear-gradient(90deg,${item.color},${item.color}88)`, borderRadius: '3px', transition: 'width 1s ease' }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 'auto', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', borderRadius: '10px', padding: '.75rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', animation: 'pulse-dot 2s infinite' }} />
            <span style={{ fontSize: '.78rem', color: '#22C55E', fontWeight: 600 }}>Bot ativo — respondendo em tempo real</span>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Recent Leads */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ fontWeight: 800 }}>Leads recentes</div>
            <Link to={createPageUrl('Leads')} style={{ fontSize: '.78rem', color: '#3B82F6', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
          </div>
          <div>
            {loading ? <div style={{ padding: '1rem' }}><Skeleton height="300px" /></div> :
              displayLeads.slice(0, 5).map((lead, i) => (
                <div key={lead.id} style={{
                  display: 'flex', alignItems: 'center', gap: '.85rem', padding: '.85rem 1.5rem',
                  borderBottom: i < 4 ? '1px solid rgba(255,255,255,.04)' : 'none',
                  transition: 'background .15s',
                }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    background: getAvatarColor(lead.name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.72rem', fontWeight: 700
                  }}>{getInitials(lead.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</div>
                    <div style={{ fontSize: '.72rem', color: '#64748B' }}>{lead.phone}</div>
                  </div>
                  <span style={{
                    padding: '.22rem .6rem', borderRadius: '100px', fontSize: '.68rem', fontWeight: 700,
                    background: `${statusColors[lead.status] || '#64748B'}18`,
                    color: statusColors[lead.status] || '#64748B',
                    border: `1px solid ${statusColors[lead.status] || '#64748B'}30`,
                  }}>{statusLabels[lead.status] || lead.status}</span>
                  <span style={{ fontSize: '.7rem', color: '#475569', flexShrink: 0 }}>{formatRelative(lead.created_date)}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Recent Conversations */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ fontWeight: 800 }}>Conversas ativas</div>
            <Link to={createPageUrl('Chat')} style={{ fontSize: '.78rem', color: '#3B82F6', textDecoration: 'none', fontWeight: 600 }}>Abrir chat →</Link>
          </div>
          <div>
            {loading ? <div style={{ padding: '1rem' }}><Skeleton height="300px" /></div> :
              displayConvs.slice(0, 4).map((conv, i) => (
                <div key={conv.id} style={{
                  display: 'flex', alignItems: 'center', gap: '.85rem', padding: '.85rem 1.5rem',
                  borderBottom: i < 3 ? '1px solid rgba(255,255,255,.04)' : 'none',
                  transition: 'background .15s', cursor: 'pointer'
                }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                      background: getAvatarColor(conv.lead_name),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '.72rem', fontWeight: 700
                    }}>{getInitials(conv.lead_name)}</div>
                    <div style={{
                      position: 'absolute', bottom: 0, right: -1,
                      width: '12px', height: '12px', borderRadius: '50%',
                      background: convStatusColors[conv.status] || '#64748B',
                      border: '2px solid #0A0F1E'
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.15rem' }}>
                      <span style={{ fontSize: '.85rem', fontWeight: 700 }}>{conv.lead_name}</span>
                      <span style={{ fontSize: '.68rem', color: '#475569' }}>{formatRelative(conv.last_message_at)}</span>
                    </div>
                    <div style={{ fontSize: '.75rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.last_message}</div>
                  </div>
                  {conv.unread_count > 0 && (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 800, flexShrink: 0 }}>{conv.unread_count}</div>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse-dot{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}50%{box-shadow:0 0 0 6px rgba(34,197,94,0)}}`}</style>
    </div>
  );
}
