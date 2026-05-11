import { useState, useEffect } from 'react';
import { generateMockMetrics, formatNumber, formatCurrency } from '@/lib/utils';

function LineChart({ data, keys, colors, height = 200 }) {
  if (!data?.length) return null;
  const W = 600, H = height;
  const pad = { t: 20, r: 20, b: 30, l: 50 };
  const chartW = W - pad.l - pad.r;
  const chartH = H - pad.t - pad.b;

  const allVals = keys.flatMap(k => data.map(d => d[k] || 0));
  const max = Math.max(...allVals, 1);
  const min = 0;

  const getPath = (key) => {
    const pts = data.map((d, i) => {
      const x = pad.l + (i / (data.length - 1)) * chartW;
      const y = pad.t + chartH - ((d[key] - min) / (max - min)) * chartH;
      return `${x},${y}`;
    });
    return `M${pts.join(' L')}`;
  };

  const getArea = (key, color) => {
    const pts = data.map((d, i) => {
      const x = pad.l + (i / (data.length - 1)) * chartW;
      const y = pad.t + chartH - ((d[key] - min) / (max - min)) * chartH;
      return `${x},${y}`;
    });
    const first = `${pad.l},${pad.t + chartH}`;
    const last = `${pad.l + chartW},${pad.t + chartH}`;
    return `M${first} L${pts.join(' L')} L${last} Z`;
  };

  const yTicks = Array.from({ length: 5 }, (_, i) => Math.floor(min + (max - min) * (i / 4)));
  const xTicks = data.filter((_, i) => i % Math.floor(data.length / 6) === 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }}>
      <defs>
        {keys.map((k, i) => (
          <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[i]} stopOpacity=".2" />
            <stop offset="100%" stopColor={colors[i]} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {/* Grid */}
      {yTicks.map(v => {
        const y = pad.t + chartH - ((v - min) / (max - min)) * chartH;
        return (
          <g key={v}>
            <line x1={pad.l} y1={y} x2={pad.l + chartW} y2={y} stroke="rgba(255,255,255,.05)" strokeWidth="1" />
            <text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#475569">{v > 999 ? `${Math.floor(v/1000)}k` : v}</text>
          </g>
        );
      })}
      {xTicks.map((d, i) => {
        const idx = data.indexOf(d);
        const x = pad.l + (idx / (data.length - 1)) * chartW;
        return <text key={i} x={x} y={H - 6} textAnchor="middle" fontSize="10" fill="#475569">{d.date?.slice(5)}</text>;
      })}
      {/* Areas */}
      {keys.map((k, i) => (
        <path key={`area-${k}`} d={getArea(k, colors[i])} fill={`url(#grad-${k})`} />
      ))}
      {/* Lines */}
      {keys.map((k, i) => (
        <path key={`line-${k}`} d={getPath(k)} fill="none" stroke={colors[i]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

export default function Analytics() {
  const [metrics, setMetrics] = useState([]);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    const days = period === '7d' ? 7 : period === '14d' ? 14 : 30;
    setMetrics(generateMockMetrics().slice(-days));
  }, [period]);

  const totals = metrics.reduce((acc, m) => ({
    conversations: acc.conversations + m.conversations_count,
    leads: acc.leads + m.leads_count,
    messages: acc.messages + m.messages_sent,
    revenue: acc.revenue + m.revenue,
  }), { conversations: 0, leads: 0, messages: 0, revenue: 0 });

  const lastVsFirst = metrics.length > 1 ? {
    conversations: ((metrics[metrics.length-1].conversations_count - metrics[0].conversations_count) / Math.max(metrics[0].conversations_count, 1) * 100).toFixed(0),
    leads: ((metrics[metrics.length-1].leads_count - metrics[0].leads_count) / Math.max(metrics[0].leads_count, 1) * 100).toFixed(0),
  } : { conversations: 0, leads: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.2rem' }}>Analytics</h2>
          <p style={{ fontSize: '.85rem', color: '#64748B' }}>Métricas detalhadas de performance</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {['7d', '14d', '30d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding: '.45rem .9rem', borderRadius: '8px', fontSize: '.8rem', fontWeight: 600, background: period === p ? 'rgba(59,130,246,.15)' : 'rgba(255,255,255,.04)', border: `1px solid ${period === p ? 'rgba(59,130,246,.35)' : 'rgba(255,255,255,.08)'}`, color: period === p ? '#60A5FA' : '#64748B', cursor: 'pointer', transition: 'all .2s' }}>
              {p === '7d' ? '7 dias' : p === '14d' ? '14 dias' : '30 dias'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        {[
          { label: 'Total conversas', val: formatNumber(totals.conversations), trend: `+${lastVsFirst.conversations}%`, color: '#3B82F6', icon: '💬' },
          { label: 'Leads gerados', val: formatNumber(totals.leads), trend: `+${lastVsFirst.leads}%`, color: '#22C55E', icon: '👥' },
          { label: 'Msgs enviadas', val: formatNumber(totals.messages), trend: '+18%', color: '#8B5CF6', icon: '📨' },
          { label: 'Receita gerada', val: formatCurrency(totals.revenue), trend: '+34%', color: '#F59E0B', icon: '💰' },
        ].map((k, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.6rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${k.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{k.icon}</div>
              <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '.2rem .55rem', borderRadius: '100px', background: 'rgba(34,197,94,.12)', color: '#22C55E' }}>{k.trend}</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, background: `linear-gradient(135deg,${k.color},${k.color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '.2rem' }}>{k.val}</div>
            <div style={{ fontSize: '.75rem', color: '#64748B' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontWeight: 800 }}>Conversas e Leads</div>
            <div style={{ fontSize: '.75rem', color: '#64748B', marginTop: '.15rem' }}>Evolução diária no período</div>
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '.78rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem', color: '#94A3B8' }}><span style={{ width: '16px', height: '3px', background: '#3B82F6', borderRadius: '2px', display: 'inline-block' }} />Conversas</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem', color: '#94A3B8' }}><span style={{ width: '16px', height: '3px', background: '#22C55E', borderRadius: '2px', display: 'inline-block' }} />Leads</span>
          </div>
        </div>
        <LineChart data={metrics} keys={['conversations_count', 'leads_count']} colors={['#3B82F6', '#22C55E']} height={220} />
      </div>

      {/* Secondary Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ fontWeight: 800, marginBottom: '.4rem' }}>Taxa de Conversão</div>
          <div style={{ fontSize: '.75rem', color: '#64748B', marginBottom: '1rem' }}>Percentual diário</div>
          <LineChart data={metrics} keys={['conversion_rate']} colors={['#8B5CF6']} height={160} />
        </div>
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ fontWeight: 800, marginBottom: '.4rem' }}>Receita Gerada</div>
          <div style={{ fontSize: '.75rem', color: '#64748B', marginBottom: '1rem' }}>Acúmulo em R$</div>
          <LineChart data={metrics} keys={['revenue']} colors={['#F59E0B']} height={160} />
        </div>
      </div>

      {/* Performance table */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,.06)', fontWeight: 800 }}>Resumo por período</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,.02)' }}>
                {['Data', 'Conversas', 'Leads', 'Conversão', 'Tempo Resp.', 'Mensagens'].map(h => (
                  <th key={h} style={{ padding: '.65rem 1.25rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...metrics].reverse().slice(0, 10).map((m, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,.04)', transition: 'background .15s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '.65rem 1.25rem', fontWeight: 600 }}>{m.date}</td>
                  <td style={{ padding: '.65rem 1.25rem' }}>{m.conversations_count}</td>
                  <td style={{ padding: '.65rem 1.25rem', color: '#22C55E', fontWeight: 600 }}>{m.leads_count}</td>
                  <td style={{ padding: '.65rem 1.25rem' }}>{m.conversion_rate}%</td>
                  <td style={{ padding: '.65rem 1.25rem' }}>{m.avg_response_time}s</td>
                  <td style={{ padding: '.65rem 1.25rem' }}>{m.messages_sent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
