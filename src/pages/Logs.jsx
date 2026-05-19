import { useState, useEffect, useCallback } from 'react';
import { supabase, getUser } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/Toast';

/* ── helpers ── */
function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function fmtPhone(jid) {
  if (!jid) return '—';
  const num = jid.replace('@s.whatsapp.net', '').replace('@g.us', '');
  if (num.length >= 12) return `+${num.slice(0,2)} (${num.slice(2,4)}) ${num.slice(4,9)}-${num.slice(9)}`;
  return num;
}

const STATUS_CFG = {
  replied:  { label: 'Respondido', color: '#22C55E', bg: 'rgba(34,197,94,.1)' },
  received: { label: 'Recebido',   color: '#F59E0B', bg: 'rgba(245,158,11,.1)' },
  error:    { label: 'Erro',       color: '#EF4444', bg: 'rgba(239,68,68,.1)' },
};

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.received;
  return (
    <span style={{ padding: '.2rem .6rem', borderRadius: '100px', background: c.bg, color: c.color, fontSize: '.7rem', fontWeight: 700, border: `1px solid ${c.color}25` }}>
      {c.label}
    </span>
  );
}

/* ── export CSV ── */
function exportCSV(logs) {
  const header = ['Data', 'De', 'Mensagem', 'Resposta IA', 'Status', 'Instância'];
  const rows = logs.map(l => [
    fmt(l.created_at),
    fmtPhone(l.from_number),
    `"${(l.message_in || '').replace(/"/g, '""')}"`,
    `"${(l.ai_reply || '').replace(/"/g, '""')}"`,
    l.status,
    l.instance_id || '',
  ]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `logs-gvpbot-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

/* ── main ── */
export default function Logs() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const [filters, setFilters] = useState({
    status: '',
    instance_id: '',
    date_from: '',
    date_to: '',
    search: '',
  });

  const bg = '#070C18';
  const card = 'rgba(255,255,255,.03)';
  const border = 'rgba(255,255,255,.08)';
  const inp = { padding: '.5rem .85rem', borderRadius: '8px', background: 'rgba(255,255,255,.05)', border: `1px solid ${border}`, color: '#F8FAFC', fontSize: '.82rem', outline: 'none' };

  useEffect(() => { loadInstances(); loadLogs(); }, []);
  useEffect(() => { loadLogs(); }, [filters, page]);

  async function loadInstances() {
    const user = await getUser();
    if (!user) return;
    const { data } = await supabase.from('whatsapp_instances').select('id, name').eq('user_id', user.id);
    setInstances(data || []);
  }

  async function loadLogs() {
    setLoading(true);
    try {
      const user = await getUser();
      if (!user) return;

      let q = supabase.from('message_logs').select('*, whatsapp_instances(name)', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filters.status) q = q.eq('status', filters.status);
      if (filters.instance_id) q = q.eq('instance_id', filters.instance_id);
      if (filters.date_from) q = q.gte('created_at', filters.date_from + 'T00:00:00');
      if (filters.date_to) q = q.lte('created_at', filters.date_to + 'T23:59:59');
      if (filters.search) q = q.ilike('message_in', `%${filters.search}%`);

      const { data, error } = await q;
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      toast({ message: `❌ ${err.message}`, type: 'error' });
    } finally { setLoading(false); }
  }

  async function loadAllForExport() {
    const user = await getUser();
    if (!user) return [];
    let q = supabase.from('message_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5000);
    if (filters.status) q = q.eq('status', filters.status);
    if (filters.instance_id) q = q.eq('instance_id', filters.instance_id);
    if (filters.date_from) q = q.gte('created_at', filters.date_from + 'T00:00:00');
    if (filters.date_to) q = q.lte('created_at', filters.date_to + 'T23:59:59');
    const { data } = await q;
    return data || [];
  }

  const upd = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(0); };

  const stats = {
    total: logs.length,
    replied: logs.filter(l => l.status === 'replied').length,
    errors: logs.filter(l => l.status === 'error').length,
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'Inter,sans-serif', color: '#F8FAFC' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '.25rem' }}>📋 Logs de Mensagens</h1>
          <p style={{ color: '#64748B', fontSize: '.88rem' }}>Histórico completo de mensagens recebidas e respondidas</p>
        </div>
        <button
          onClick={async () => { const all = await loadAllForExport(); exportCSV(all); toast({ message: `✅ ${all.length} registros exportados!`, type: 'success' }); }}
          style={{ padding: '.6rem 1.2rem', borderRadius: '8px', background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.25)', color: '#4ADE80', cursor: 'pointer', fontWeight: 700, fontSize: '.82rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}
        >
          📥 Exportar CSV
        </button>
      </div>

      {/* Stats rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Nesta página', value: stats.total, color: '#60A5FA', icon: '💬' },
          { label: 'Respondidas IA', value: stats.replied, color: '#4ADE80', icon: '🤖' },
          { label: 'Com erro', value: stats.errors, color: '#F87171', icon: '⚠️' },
        ].map(s => (
          <div key={s.label} style={{ background: card, border: `1px solid ${border}`, borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
            <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '.72rem', color: '#64748B' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={{ ...inp, flex: '1 1 180px' }} placeholder="🔍 Buscar mensagem..." value={filters.search} onChange={e => upd('search', e.target.value)} />

        <select style={{ ...inp }} value={filters.status} onChange={e => upd('status', e.target.value)}>
          <option value="">Todos os status</option>
          <option value="replied">Respondido</option>
          <option value="received">Recebido</option>
          <option value="error">Erro</option>
        </select>

        <select style={{ ...inp, flex: '1 1 160px' }} value={filters.instance_id} onChange={e => upd('instance_id', e.target.value)}>
          <option value="">Todas as instâncias</option>
          {instances.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>

        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <input style={{ ...inp, width: '130px' }} type="date" value={filters.date_from} onChange={e => upd('date_from', e.target.value)} />
          <span style={{ color: '#475569', fontSize: '.8rem' }}>até</span>
          <input style={{ ...inp, width: '130px' }} type="date" value={filters.date_to} onChange={e => upd('date_to', e.target.value)} />
        </div>

        <button onClick={() => { setFilters({ status: '', instance_id: '', date_from: '', date_to: '', search: '' }); setPage(0); }}
          style={{ padding: '.5rem .9rem', borderRadius: '8px', background: 'transparent', border: `1px solid ${border}`, color: '#64748B', cursor: 'pointer', fontSize: '.8rem' }}>
          Limpar
        </button>
      </div>

      {/* Tabela */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '14px', overflow: 'hidden' }}>
        {/* Header da tabela */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 130px 110px 80px', padding: '.75rem 1.25rem', borderBottom: `1px solid ${border}`, fontSize: '.72rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          <span>Mensagem</span><span>De</span><span>Data</span><span>Instância</span><span>Status</span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
            Carregando logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📭</div>
            <div>Nenhuma mensagem encontrada</div>
            <div style={{ fontSize: '.78rem', marginTop: '.35rem' }}>Os logs aparecerão aqui quando o webhook receber mensagens</div>
          </div>
        ) : (
          logs.map((log, idx) => (
            <div key={log.id}>
              <div
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                style={{ display: 'grid', gridTemplateColumns: '1fr 120px 130px 110px 80px', padding: '.85rem 1.25rem', borderBottom: idx < logs.length - 1 ? `1px solid ${border}` : 'none', cursor: 'pointer', transition: 'background .15s', background: expanded === log.id ? 'rgba(59,130,246,.05)' : 'transparent' }}
                onMouseEnter={e => { if (expanded !== log.id) e.currentTarget.style.background = 'rgba(255,255,255,.02)'; }}
                onMouseLeave={e => { if (expanded !== log.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '.83rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#F8FAFC' }}>
                    {log.message_in || <em style={{ color: '#475569' }}>—</em>}
                  </div>
                  {log.ai_reply && <div style={{ fontSize: '.72rem', color: '#60A5FA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '.2rem' }}>🤖 {log.ai_reply}</div>}
                </div>
                <div style={{ fontSize: '.8rem', color: '#94A3B8', alignSelf: 'center' }}>{fmtPhone(log.from_number)}</div>
                <div style={{ fontSize: '.75rem', color: '#64748B', alignSelf: 'center' }}>{fmt(log.created_at)}</div>
                <div style={{ fontSize: '.75rem', color: '#94A3B8', alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.whatsapp_instances?.name || '—'}</div>
                <div style={{ alignSelf: 'center' }}><StatusBadge status={log.status} /></div>
              </div>

              {/* Expanded detail */}
              {expanded === log.id && (
                <div style={{ padding: '1rem 1.5rem 1.25rem', background: 'rgba(59,130,246,.04)', borderBottom: `1px solid ${border}` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '.72rem', color: '#64748B', marginBottom: '.35rem', fontWeight: 700, textTransform: 'uppercase' }}>📩 Mensagem recebida</div>
                      <div style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${border}`, borderRadius: '8px', padding: '.75rem', fontSize: '.83rem', lineHeight: 1.55, wordBreak: 'break-word' }}>{log.message_in || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '.72rem', color: '#64748B', marginBottom: '.35rem', fontWeight: 700, textTransform: 'uppercase' }}>🤖 Resposta da IA</div>
                      <div style={{ background: log.ai_reply ? 'rgba(59,130,246,.06)' : 'rgba(255,255,255,.02)', border: `1px solid ${log.ai_reply ? 'rgba(59,130,246,.2)' : border}`, borderRadius: '8px', padding: '.75rem', fontSize: '.83rem', lineHeight: 1.55, color: log.ai_reply ? '#93C5FD' : '#475569', wordBreak: 'break-word' }}>{log.ai_reply || 'IA não respondeu'}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '.75rem', fontSize: '.72rem', color: '#475569', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <span>ID: <code style={{ color: '#64748B' }}>{log.id}</code></span>
                    <span>De: <code style={{ color: '#64748B' }}>{log.from_number}</code></span>
                    <span>Criado: <code style={{ color: '#64748B' }}>{new Date(log.created_at).toISOString()}</code></span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Paginação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <span style={{ fontSize: '.78rem', color: '#475569' }}>
          Página {page + 1} · mostrando {logs.length} registros
        </span>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ padding: '.45rem .9rem', borderRadius: '8px', border: `1px solid ${border}`, background: 'transparent', color: page === 0 ? '#334155' : '#94A3B8', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '.82rem' }}>
            ← Anterior
          </button>
          <button onClick={() => setPage(p => p + 1)} disabled={logs.length < PAGE_SIZE}
            style={{ padding: '.45rem .9rem', borderRadius: '8px', border: `1px solid ${border}`, background: 'transparent', color: logs.length < PAGE_SIZE ? '#334155' : '#94A3B8', cursor: logs.length < PAGE_SIZE ? 'not-allowed' : 'pointer', fontSize: '.82rem' }}>
            Próxima →
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
