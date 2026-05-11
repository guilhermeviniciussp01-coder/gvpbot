import { useState, useEffect } from 'react';
import { generateMockMetrics, formatNumber, formatCurrency } from '@/lib/utils';

/* ─── SVG Line Chart ─── */
function LineChart({ data, keys, colors, labels, height = 220 }) {
  const [hover, setHover] = useState(null);
  if (!data?.length) return null;
  const W = 700, H = height, pad = { t: 20, r: 20, b: 36, l: 55 };
  const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b;
  const allVals = keys.flatMap(k => data.map(d => d[k] || 0));
  const max = Math.max(...allVals, 1), min = 0;
  const x = (i) => pad.l + (i / (data.length - 1)) * cW;
  const y = (v) => pad.t + cH - ((v - min) / (max - min)) * cH;
  const path = (k) => data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d[k] || 0)}`).join(' ');
  const area = (k) => `M${pad.l},${pad.t + cH} ${data.map((d, i) => `L${x(i)},${y(d[k] || 0)}`).join(' ')} L${pad.l + cW},${pad.t + cH}Z`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(min + (max - min) * f));
  const step = Math.max(1, Math.floor(data.length / 7));

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }}>
        <defs>
          {keys.map((k, i) => (
            <linearGradient key={k} id={`lg-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors[i]} stopOpacity=".2" />
              <stop offset="100%" stopColor={colors[i]} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {/* Grid */}
        {yTicks.map((v, i) => {
          const yp = y(v);
          return (
            <g key={i}>
              <line x1={pad.l} y1={yp} x2={pad.l + cW} y2={yp} stroke="rgba(255,255,255,.06)" strokeWidth="1" />
              <text x={pad.l - 6} y={yp + 4} fontSize="10" fill="#475569" textAnchor="end" fontFamily="Inter,sans-serif">{v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}</text>
            </g>
          );
        })}
        {/* X labels */}
        {data.filter((_, i) => i % step === 0).map((d, i, arr) => {
          const idx = data.indexOf(d);
          return <text key={i} x={x(idx)} y={H - 4} fontSize="9.5" fill="#475569" textAnchor="middle" fontFamily="Inter,sans-serif">{d.date?.slice(5)}</text>;
        })}
        {/* Areas + Lines */}
        {keys.map((k, i) => (
          <g key={k}>
            <path d={area(k)} fill={`url(#lg-${k})`} />
            <path d={path(k)} fill="none" stroke={colors[i]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
        {/* Hover dots */}
        {hover !== null && keys.map((k, i) => (
          <circle key={k} cx={x(hover)} cy={y(data[hover]?.[k] || 0)} r="5" fill={colors[i]} stroke="#0A0F1E" strokeWidth="2" />
        ))}
        {/* Hover capture */}
        <rect x={pad.l} y={pad.t} width={cW} height={cH} fill="transparent"
          onMouseMove={e => {
            const rect = e.currentTarget.closest('svg').getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width * W - pad.l;
            const idx = Math.round((relX / cW) * (data.length - 1));
            setHover(Math.max(0, Math.min(data.length - 1, idx)));
          }}
          onMouseLeave={() => setHover(null)}
        />
        {/* Hover line */}
        {hover !== null && <line x1={x(hover)} y1={pad.t} x2={x(hover)} y2={pad.t + cH} stroke="rgba(255,255,255,.15)" strokeWidth="1" strokeDasharray="4 2" />}
      </svg>
      {/* Tooltip */}
      {hover !== null && (
        <div style={{ position: 'absolute', top: '10px', left: `${Math.min(75, 15 + (hover / data.length) * 60)}%`, background: 'rgba(8,14,28,.95)', border: '1px solid rgba(255,255,255,.12)', borderRadius: '10px', padding: '.6rem .9rem', fontSize: '.78rem', pointerEvents: 'none', zIndex: 10, minWidth: '140px' }}>
          <div style={{ fontWeight: 700, color: '#94A3B8', marginBottom: '.4rem' }}>{data[hover]?.date}</div>
          {keys.map((k, i) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '.75rem' }}>
              <span style={{ color: colors[i] }}>● {labels[i]}</span>
              <span style={{ fontWeight: 700, color: '#F8FAFC' }}>{formatNumber(data[hover]?.[k] || 0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Bar Chart ─── */
function BarChart({ data, key: K, color, height = 120 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d[K] || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height }}>
      {data.map((d, i) => (
        <div key={i} title={`${d.date}: ${d[K]}`} style={{ flex: 1, borderRadius: '3px 3px 0 0', height: `${((d[K] || 0) / max) * 100}%`, background: `linear-gradient(180deg,${color},${color}88)`, opacity: .6 + (i / data.length) * .4, transition: 'all .3s', minWidth: '4px', cursor: 'default' }} />
      ))}
    </div>
  );
}

/* ─── Donut ─── */
function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  let angle = -90;
  const R = 45, cx = 60, cy = 60;
  const arcs = segments.map(s => {
    const sweep = (s.value / total) * 360;
    const start = angle;
    angle += sweep;
    const r = start * Math.PI / 180, r2 = (start + sweep) * Math.PI / 180;
    const x1 = cx + R * Math.cos(r), y1 = cy + R * Math.sin(r);
    const x2 = cx + R * Math.cos(r2), y2 = cy + R * Math.sin(r2);
    const large = sweep > 180 ? 1 : 0;
    return { ...s, d: `M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} Z` };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color} opacity=".9" />)}
      <circle cx={cx} cy={cy} r={R * 0.55} fill="#0A0F1E" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="12" fontWeight="800" fill="#F8FAFC" fontFamily="Inter,sans-serif">{total.toLocaleString()}</text>
    </svg>
  );
}

/* ─── KPI Pill ─── */
function KPIPill({ icon, label, value, trend, color, sub }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.25rem 1.35rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 80% 20%, ${color}08, transparent 60%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '.75rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem' }}>{icon}</div>
        {trend && <span style={{ fontSize: '.7rem', fontWeight: 700, padding: '.18rem .55rem', borderRadius: '100px', background: trend.startsWith('+') ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)', color: trend.startsWith('+') ? '#22C55E' : '#EF4444', border: `1px solid ${trend.startsWith('+') ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.2)'}` }}>{trend}</span>}
      </div>
      <div style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1, background: `linear-gradient(135deg,${color},${color}99)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '.25rem' }}>{value}</div>
      <div style={{ fontSize: '.78rem', color: '#64748B', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: '.7rem', color: '#475569', marginTop: '.15rem' }}>{sub}</div>}
    </div>
  );
}

const PERIODS = [
  { id: '7d', label: '7 dias' },
  { id: '14d', label: '14 dias' },
  { id: '30d', label: '30 dias' },
];

export default function Analytics() {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMetrics, setActiveMetrics] = useState(['conversations_count', 'leads_count']);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const all = generateMockMetrics();
      const days = period === '7d' ? 7 : period === '14d' ? 14 : 30;
      setData(all.slice(-days));
      setLoading(false);
    }, 400);
  }, [period]);

  const sum = (key) => data.reduce((a, d) => a + (d[key] || 0), 0);
  const avg = (key) => data.length ? (sum(key) / data.length) : 0;
  const last = data[data.length - 1] || {};
  const prev = data[Math.max(0, data.length - 8)] || {};

  const pct = (curr, old) => {
    if (!old) return '+0%';
    const d = ((curr - old) / old * 100).toFixed(1);
    return `${d >= 0 ? '+' : ''}${d}%`;
  };

  const METRICS_CFG = [
    { key: 'conversations_count', label: 'Conversas', color: '#3B82F6' },
    { key: 'leads_count', label: 'Leads', color: '#22C55E' },
    { key: 'messages_sent', label: 'Mensagens', color: '#8B5CF6' },
    { key: 'revenue', label: 'Receita (R$)', color: '#F59E0B' },
  ];

  function exportCSV() {
    const header = 'Data,Conversas,Leads,Conversão(%),Tempo Resposta(s),Mensagens,Receita(R$)';
    const rows = data.map(d => `${d.date},${d.conversations_count},${d.leads_count},${d.conversion_rate},${d.avg_response_time},${d.messages_sent},${d.revenue}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gvpbot-analytics-${period}.csv`;
    a.click();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.2rem' }}>
            Analytics <span style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>& Métricas</span>
          </h2>
          <p style={{ fontSize: '.85rem', color: '#64748B' }}>Dados em tempo real do seu atendimento</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '.3rem', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '10px', padding: '.25rem' }}>
            {PERIODS.map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)} style={{ padding: '.4rem .85rem', borderRadius: '7px', fontSize: '.8rem', fontWeight: 700, background: period === p.id ? 'rgba(59,130,246,.15)' : 'transparent', border: `1px solid ${period === p.id ? 'rgba(59,130,246,.3)' : 'transparent'}`, color: period === p.id ? '#60A5FA' : '#64748B', cursor: 'pointer', transition: 'all .15s' }}>{p.label}</button>
            ))}
          </div>
          <button onClick={exportCSV} style={{ padding: '.5rem 1rem', borderRadius: '9px', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)', color: '#22C55E', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            ⬇️ Exportar CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        {loading ? [1,2,3,4].map(i => (
          <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.25rem', height: '110px', animation: 'shimmer 1.5s linear infinite', backgroundImage: 'linear-gradient(90deg,rgba(255,255,255,.03) 0%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.03) 100%)', backgroundSize: '400px 100%' }} />
        )) : <>
          <KPIPill icon="💬" label="Total de conversas" value={formatNumber(sum('conversations_count'))} trend={pct(last.conversations_count, prev.conversations_count)} color="#3B82F6" sub={`Média ${Math.round(avg('conversations_count'))}/dia`} />
          <KPIPill icon="👥" label="Leads capturados" value={formatNumber(sum('leads_count'))} trend={pct(last.leads_count, prev.leads_count)} color="#22C55E" sub={`Média ${Math.round(avg('leads_count'))}/dia`} />
          <KPIPill icon="🎯" label="Taxa de conversão" value={`${avg('conversion_rate').toFixed(1)}%`} trend={pct(last.conversion_rate, prev.conversion_rate)} color="#8B5CF6" sub="Média do período" />
          <KPIPill icon="⚡" label="Tempo de resposta" value={`${avg('avg_response_time').toFixed(1)}s`} trend={pct(prev.avg_response_time, last.avg_response_time)} color="#F59E0B" sub="Média do período" />
        </>}
      </div>

      {/* Main chart */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '.75rem' }}>
          <div style={{ fontWeight: 800 }}>📈 Evolução no período</div>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            {METRICS_CFG.map(m => (
              <button key={m.key} onClick={() => setActiveMetrics(p => p.includes(m.key) ? p.filter(k => k !== m.key) : [...p, m.key])} style={{ padding: '.3rem .75rem', borderRadius: '100px', fontSize: '.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '.35rem', background: activeMetrics.includes(m.key) ? `${m.color}18` : 'rgba(255,255,255,.03)', border: `1px solid ${activeMetrics.includes(m.key) ? `${m.color}40` : 'rgba(255,255,255,.08)'}`, color: activeMetrics.includes(m.key) ? m.color : '#475569', cursor: 'pointer', transition: 'all .15s' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeMetrics.includes(m.key) ? m.color : '#475569', display: 'inline-block' }} />
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '.85rem' }}>Carregando dados...</div>
        ) : (
          <LineChart
            data={data}
            keys={activeMetrics}
            colors={activeMetrics.map(k => METRICS_CFG.find(m => m.key === k)?.color || '#3B82F6')}
            labels={activeMetrics.map(k => METRICS_CFG.find(m => m.key === k)?.label || k)}
            height={220}
          />
        )}
      </div>

      {/* Row 2: Bar + Donut + Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '1.25rem' }}>

        {/* Messages bar */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 800 }}>📨 Mensagens enviadas por dia</div>
            <div style={{ fontSize: '.75rem', color: '#64748B' }}>Total: {formatNumber(sum('messages_sent'))}</div>
          </div>
          {loading ? <div style={{ height: '120px', background: 'rgba(255,255,255,.02)', borderRadius: '8px' }} /> : <BarChart data={data} key="messages_sent" color="#8B5CF6" height={120} />}
        </div>

        {/* Donut */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ fontWeight: 800, marginBottom: '1rem' }}>📊 Canais</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <DonutChart segments={[
              { label: 'WhatsApp', value: 74, color: '#22C55E' },
              { label: 'Instagram', value: 22, color: '#EC4899' },
              { label: 'Outros', value: 4, color: '#475569' },
            ]} size={110} />
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
              {[{ label: 'WhatsApp', value: 74, color: '#22C55E' }, { label: 'Instagram', value: 22, color: '#EC4899' }, { label: 'Outros', value: 4, color: '#475569' }].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.78rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: '#94A3B8' }}>{s.label}</span>
                  <span style={{ fontWeight: 700 }}>{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* History table */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800 }}>📋 Histórico diário</div>
          <div style={{ fontSize: '.78rem', color: '#64748B' }}>{data.length} dias</div>
        </div>
        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'rgba(8,14,28,.98)', zIndex: 2 }}>
              <tr>
                {['Data', 'Conversas', 'Leads', 'Conversão', 'Resp. média', 'Mensagens', 'Receita'].map(h => (
                  <th key={h} style={{ padding: '.65rem 1rem', textAlign: 'left', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', color: '#475569', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,.06)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d, i) => (
                <tr key={d.date} style={{ borderBottom: '1px solid rgba(255,255,255,.04)', transition: 'background .12s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '.65rem 1rem', fontWeight: 600, color: '#94A3B8' }}>{d.date}</td>
                  <td style={{ padding: '.65rem 1rem', color: '#60A5FA', fontWeight: 600 }}>{formatNumber(d.conversations_count)}</td>
                  <td style={{ padding: '.65rem 1rem', color: '#22C55E', fontWeight: 600 }}>{formatNumber(d.leads_count)}</td>
                  <td style={{ padding: '.65rem 1rem' }}><span style={{ background: 'rgba(139,92,246,.12)', color: '#A78BFA', padding: '.15rem .5rem', borderRadius: '6px', fontWeight: 700, fontSize: '.75rem' }}>{d.conversion_rate}%</span></td>
                  <td style={{ padding: '.65rem 1rem', color: '#F59E0B' }}>{d.avg_response_time}s</td>
                  <td style={{ padding: '.65rem 1rem', color: '#94A3B8' }}>{formatNumber(d.messages_sent)}</td>
                  <td style={{ padding: '.65rem 1rem', color: '#22C55E', fontWeight: 700 }}>{formatCurrency(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Totals footer */}
        <div style={{ padding: '.85rem 1.5rem', borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', gap: '2rem', background: 'rgba(255,255,255,.02)', fontSize: '.8rem', flexWrap: 'wrap' }}>
          <span style={{ color: '#64748B' }}>Totais do período:</span>
          <span style={{ color: '#60A5FA' }}><strong>{formatNumber(sum('conversations_count'))}</strong> conversas</span>
          <span style={{ color: '#22C55E' }}><strong>{formatNumber(sum('leads_count'))}</strong> leads</span>
          <span style={{ color: '#A78BFA' }}><strong>{formatNumber(sum('messages_sent'))}</strong> msgs</span>
          <span style={{ color: '#22C55E' }}><strong>{formatCurrency(sum('revenue'))}</strong> receita</span>
        </div>
      </div>

    </div>
  );
}
