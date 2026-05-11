import { useState, useEffect, useRef } from 'react';
import { Lead } from '@/api/entities';
import { getInitials, getAvatarColor, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

const STAGES = [
  { id: 'Novo Lead', label: 'Novo Lead', color: '#3B82F6', bg: 'rgba(59,130,246,.1)', icon: '🎯' },
  { id: 'Em Contato', label: 'Em Contato', color: '#F59E0B', bg: 'rgba(245,158,11,.1)', icon: '💬' },
  { id: 'Negociação', label: 'Negociação', color: '#8B5CF6', bg: 'rgba(139,92,246,.1)', icon: '🤝' },
  { id: 'Fechado', label: 'Fechado', color: '#22C55E', bg: 'rgba(34,197,94,.1)', icon: '✅' },
  { id: 'Perdido', label: 'Perdido', color: '#EF4444', bg: 'rgba(239,68,68,.1)', icon: '❌' },
];

const MOCK_LEADS = [
  { id: '1', name: 'Marcela Costa', phone: '(11) 9 9821-3344', crm_stage: 'Novo Lead', value: 1200, tags: ['VIP'] },
  { id: '2', name: 'Rafael Santos', phone: '(21) 9 8765-4321', crm_stage: 'Em Contato', value: 850, tags: ['Delivery'] },
  { id: '3', name: 'Ana Paula Lima', phone: '(31) 9 7654-3210', crm_stage: 'Negociação', value: 2400, tags: ['Pro'] },
  { id: '4', name: 'João Ferreira', phone: '(41) 9 6543-2109', crm_stage: 'Novo Lead', value: 0, tags: [] },
  { id: '5', name: 'Luana Martins', phone: '(51) 9 5432-1098', crm_stage: 'Fechado', value: 970, tags: ['Renovação'] },
  { id: '6', name: 'Carlos Eduardo', phone: '(11) 9 4321-0987', crm_stage: 'Negociação', value: 4800, tags: ['Enterprise'] },
  { id: '7', name: 'Fernanda Lima', phone: '(19) 9 3210-9876', crm_stage: 'Em Contato', value: 300, tags: [] },
  { id: '8', name: 'Bruno Alves', phone: '(71) 9 2109-8765', crm_stage: 'Novo Lead', value: 0, tags: ['Trial'] },
  { id: '9', name: 'Patricia Sousa', phone: '(85) 9 1098-7654', crm_stage: 'Fechado', value: 1970, tags: ['Anual'] },
  { id: '10', name: 'Diego Ribeiro', phone: '(62) 9 0987-6543', crm_stage: 'Perdido', value: 0, tags: [] },
  { id: '11', name: 'Juliana Castro', phone: '(13) 9 9876-5432', crm_stage: 'Novo Lead', value: 500, tags: ['Loja'] },
  { id: '12', name: 'Thiago Mendes', phone: '(47) 9 8765-1234', crm_stage: 'Em Contato', value: 1200, tags: ['Agência'] },
];

export default function CRM() {
  const toast = useToast();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    setLoading(true);
    try {
      const data = await Lead.list({ sort: 'crm_order' });
      setLeads(data.length > 0 ? data : MOCK_LEADS);
    } catch {
      setLeads(MOCK_LEADS);
    } finally {
      setLoading(false);
    }
  }

  function getStageLeads(stageId) {
    return leads.filter(l => l.crm_stage === stageId);
  }

  function getStageValue(stageId) {
    return leads.filter(l => l.crm_stage === stageId).reduce((a, l) => a + (l.value || 0), 0);
  }

  function handleDragStart(e, lead) {
    setDragging(lead);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, stageId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(stageId);
  }

  function handleDrop(e, stageId) {
    e.preventDefault();
    if (!dragging || dragging.crm_stage === stageId) { setDragging(null); setDragOver(null); return; }
    const updated = leads.map(l => l.id === dragging.id ? { ...l, crm_stage: stageId } : l);
    setLeads(updated);
    toast({ message: `🎯 ${dragging.name} → ${stageId}`, type: 'success' });
    try { Lead.update(dragging.id, { crm_stage: stageId }); } catch {}
    setDragging(null);
    setDragOver(null);
  }

  const totalPipeline = leads.filter(l => l.crm_stage !== 'Perdido').reduce((a, l) => a + (l.value || 0), 0);
  const closedValue = getStageValue('Fechado');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 130px)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.2rem' }}>Pipeline CRM</h2>
          <p style={{ fontSize: '.85rem', color: '#64748B' }}>Arraste os cards para mover entre as etapas do funil</p>
        </div>
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Pipeline total', val: formatCurrency(totalPipeline), color: '#3B82F6' },
            { label: 'Receita fechada', val: formatCurrency(closedValue), color: '#22C55E' },
            { label: 'Leads ativos', val: leads.filter(l => l.crm_stage !== 'Fechado' && l.crm_stage !== 'Perdido').length, color: '#8B5CF6' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', padding: '.6rem 1rem', textAlign: 'center', minWidth: '120px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, background: `linear-gradient(135deg,${s.color},${s.color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.val}</div>
              <div style={{ fontSize: '.7rem', color: '#64748B', marginTop: '.1rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ flex: 1, display: 'flex', gap: '1rem', overflowX: 'auto', overflowY: 'hidden', paddingBottom: '.5rem' }}>
        {STAGES.map(stage => {
          const stageLeads = getStageLeads(stage.id);
          const isDragTarget = dragOver === stage.id;
          return (
            <div
              key={stage.id}
              onDragOver={e => handleDragOver(e, stage.id)}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, stage.id)}
              style={{
                minWidth: '240px', width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column',
                background: isDragTarget ? `${stage.bg}` : 'rgba(255,255,255,.02)',
                border: `1px solid ${isDragTarget ? stage.color + '50' : 'rgba(255,255,255,.07)'}`,
                borderRadius: '14px', overflow: 'hidden', transition: 'all .2s',
                boxShadow: isDragTarget ? `0 0 20px ${stage.color}20` : 'none',
              }}
            >
              {/* Stage Header */}
              <div style={{ padding: '.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.4rem' }}>
                  <span>{stage.icon}</span>
                  <span style={{ fontWeight: 800, fontSize: '.88rem' }}>{stage.label}</span>
                  <span style={{ marginLeft: 'auto', background: `${stage.color}20`, color: stage.color, borderRadius: '100px', padding: '.12rem .55rem', fontSize: '.68rem', fontWeight: 800, border: `1px solid ${stage.color}30` }}>{stageLeads.length}</span>
                </div>
                {getStageValue(stage.id) > 0 && (
                  <div style={{ fontSize: '.72rem', color: '#64748B' }}>
                    <span style={{ color: stage.color, fontWeight: 600 }}>{formatCurrency(getStageValue(stage.id))}</span> em pipeline
                  </div>
                )}
                <div style={{ height: '3px', background: 'rgba(255,255,255,.05)', borderRadius: '2px', marginTop: '.5rem', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((stageLeads.length / Math.max(leads.length, 1)) * 100 * 2, 100)}%`, background: `linear-gradient(90deg,${stage.color},${stage.color}88)`, borderRadius: '2px', transition: 'width .5s ease' }} />
                </div>
              </div>

              {/* Cards */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '.5rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    {[1, 2].map(i => <div key={i} style={{ height: '80px', borderRadius: '10px', background: 'rgba(255,255,255,.04)', animation: 'shimmer 1.5s ease-in-out infinite' }} />)}
                  </div>
                ) : stageLeads.map(lead => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={e => handleDragStart(e, lead)}
                    onDragEnd={() => { setDragging(null); setDragOver(null); }}
                    style={{
                      background: dragging?.id === lead.id ? 'rgba(59,130,246,.1)' : 'rgba(255,255,255,.04)',
                      border: `1px solid ${dragging?.id === lead.id ? 'rgba(59,130,246,.3)' : 'rgba(255,255,255,.08)'}`,
                      borderRadius: '10px', padding: '.85rem', cursor: 'grab', transition: 'all .2s',
                      opacity: dragging?.id === lead.id ? .5 : 1,
                      userSelect: 'none',
                    }}
                    onMouseOver={e => { if (dragging?.id !== lead.id) { e.currentTarget.style.borderColor = `${stage.color}40`; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.4)'; } }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', marginBottom: '.6rem' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: getAvatarColor(lead.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', fontWeight: 700, flexShrink: 0 }}>{getInitials(lead.name)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</div>
                        <div style={{ fontSize: '.68rem', color: '#64748B' }}>{lead.phone}</div>
                      </div>
                    </div>
                    {(lead.value > 0) && (
                      <div style={{ fontSize: '.75rem', fontWeight: 700, color: stage.color, marginBottom: '.4rem' }}>{formatCurrency(lead.value)}</div>
                    )}
                    {(lead.tags || []).length > 0 && (
                      <div style={{ display: 'flex', gap: '.25rem', flexWrap: 'wrap' }}>
                        {lead.tags.slice(0, 2).map(t => (
                          <span key={t} style={{ padding: '.1rem .45rem', borderRadius: '5px', fontSize: '.62rem', fontWeight: 600, background: 'rgba(255,255,255,.06)', color: '#94A3B8' }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Drop zone hint */}
                {isDragTarget && (
                  <div style={{ border: `2px dashed ${stage.color}60`, borderRadius: '10px', padding: '1rem', textAlign: 'center', fontSize: '.78rem', color: stage.color, opacity: .8 }}>
                    Soltar aqui
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}`}</style>
    </div>
  );
}
