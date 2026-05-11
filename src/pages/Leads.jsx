import { useState, useEffect } from 'react';
import { Lead } from '@/api/entities';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { getInitials, getAvatarColor, formatDate, formatRelative, STATUS_LABELS, NICHES } from '@/lib/utils';

const MOCK_LEADS = [
  { id: '1', name: 'Marcela Costa', phone: '(11) 9 9821-3344', email: 'marcela@boutique.com', status: 'closed', tags: ['VIP', 'Loja'], notes: 'Cliente fiel', source: 'WhatsApp', value: 1200, created_date: '2026-04-10T10:00:00Z' },
  { id: '2', name: 'Rafael Santos', phone: '(21) 9 8765-4321', email: 'rafael@delivery.com', status: 'negotiation', tags: ['Delivery'], notes: '', source: 'Instagram', value: 850, created_date: '2026-04-12T14:30:00Z' },
  { id: '3', name: 'Ana Paula Lima', phone: '(31) 9 7654-3210', email: 'ana@clinica.com', status: 'contacted', tags: ['Saúde'], notes: 'Interessa em plano Pro', source: 'WhatsApp', value: 500, created_date: '2026-04-15T09:00:00Z' },
  { id: '4', name: 'João Ferreira', phone: '(41) 9 6543-2109', email: 'joao@imoveis.com', status: 'new', tags: ['Imóveis', 'Trial'], notes: '', source: 'Indicação', value: 0, created_date: '2026-04-20T11:00:00Z' },
  { id: '5', name: 'Luana Martins', phone: '(51) 9 5432-1098', email: 'luana@studio.com', status: 'closed', tags: ['Beleza'], notes: 'Renovação anual', source: 'WhatsApp', value: 970, created_date: '2026-03-28T08:00:00Z' },
  { id: '6', name: 'Carlos Eduardo', phone: '(11) 9 4321-0987', email: 'carlos@tech.com', status: 'negotiation', tags: ['Tech', 'Enterprise'], notes: 'Quer API access', source: 'Site', value: 2400, created_date: '2026-04-05T13:00:00Z' },
  { id: '7', name: 'Fernanda Lima', phone: '(19) 9 3210-9876', email: 'fernanda@boutique.com', status: 'contacted', tags: ['Moda'], notes: '', source: 'Instagram', value: 300, created_date: '2026-04-18T16:00:00Z' },
  { id: '8', name: 'Bruno Alves', phone: '(71) 9 2109-8765', email: 'bruno@bar.com', status: 'new', tags: ['Delivery', 'Trial'], notes: '', source: 'WhatsApp', value: 0, created_date: '2026-04-22T10:00:00Z' },
  { id: '9', name: 'Patricia Sousa', phone: '(85) 9 1098-7654', email: 'patricia@spa.com', status: 'closed', tags: ['Estética'], notes: '', source: 'WhatsApp', value: 1970, created_date: '2026-03-15T09:30:00Z' },
  { id: '10', name: 'Diego Ribeiro', phone: '(62) 9 0987-6543', email: 'diego@const.com', status: 'lost', tags: ['Construção'], notes: 'Cancelou por preço', source: 'Site', value: 0, created_date: '2026-02-28T10:00:00Z' },
];

export default function Leads() {
  const toast = useToast();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const [form, setForm] = useState({ name: '', phone: '', email: '', status: 'new', tags: '', notes: '', source: '', value: '' });

  useEffect(() => { loadLeads(); }, []);

  async function loadLeads() {
    setLoading(true);
    try {
      const data = await Lead.list({ sort: '-created_date' });
      setLeads(data.length > 0 ? data : MOCK_LEADS);
    } catch {
      setLeads(MOCK_LEADS);
    } finally {
      setLoading(false);
    }
  }

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchQ = !q || l.name?.toLowerCase().includes(q) || l.phone?.includes(q) || l.email?.toLowerCase().includes(q);
    const matchS = !filterStatus || l.status === filterStatus;
    return matchQ && matchS;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pages = Math.ceil(filtered.length / PAGE_SIZE);

  function openNew() {
    setEditingLead(null);
    setForm({ name: '', phone: '', email: '', status: 'new', tags: '', notes: '', source: '', value: '' });
    setModalOpen(true);
  }

  function openEdit(lead) {
    setEditingLead(lead);
    setForm({ ...lead, tags: (lead.tags || []).join(', '), value: lead.value || '' });
    setModalOpen(true);
  }

  async function saveLead() {
    if (!form.name || !form.phone) { toast({ message: 'Nome e telefone são obrigatórios', type: 'error' }); return; }
    setSaving(true);
    try {
      const data = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [], value: parseFloat(form.value) || 0 };
      if (editingLead) {
        const updated = { ...editingLead, ...data };
        setLeads(prev => prev.map(l => l.id === editingLead.id ? updated : l));
        try { await Lead.update(editingLead.id, data); } catch {}
        toast({ message: '✅ Lead atualizado!', type: 'success' });
      } else {
        const newLead = { ...data, id: Date.now().toString(), created_date: new Date().toISOString() };
        setLeads(prev => [newLead, ...prev]);
        try { await Lead.create(data); } catch {}
        toast({ message: '✅ Lead adicionado!', type: 'success' });
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function openDelete(id) { setDeleteId(id); setDeleteModal(true); }

  async function confirmDelete() {
    setSaving(true);
    try {
      setLeads(prev => prev.filter(l => l.id !== deleteId));
      try { await Lead.delete(deleteId); } catch {}
      toast({ message: '🗑️ Lead removido', type: 'info' });
      setDeleteModal(false);
      setSelected(prev => { const s = new Set(prev); s.delete(deleteId); return s; });
    } finally {
      setSaving(false);
    }
  }

  const STATUS_OPTS = [
    { value: 'new', label: '🔵 Novo' },
    { value: 'contacted', label: '🟡 Contactado' },
    { value: 'negotiation', label: '🟣 Negociação' },
    { value: 'closed', label: '🟢 Fechado' },
    { value: 'lost', label: '🔴 Perdido' },
  ];

  const stats = {
    total: leads.length,
    active: leads.filter(l => l.status === 'new' || l.status === 'contacted' || l.status === 'negotiation').length,
    closed: leads.filter(l => l.status === 'closed').length,
    value: leads.filter(l => l.status === 'closed').reduce((a, l) => a + (l.value || 0), 0),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        {[
          { label: 'Total de leads', val: stats.total, color: '#3B82F6', icon: '👥' },
          { label: 'Ativos', val: stats.active, color: '#F59E0B', icon: '🔥' },
          { label: 'Fechados', val: stats.closed, color: '#22C55E', icon: '✅' },
          { label: 'Receita potencial', val: `R$${stats.value.toLocaleString('pt-BR')}`, color: '#8B5CF6', icon: '💰' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, background: `linear-gradient(135deg,${s.color},${s.color}99)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.val}</div>
              <div style={{ fontSize: '.75rem', color: '#64748B', marginTop: '.15rem' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '1.1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '.75rem', borderBottom: '1px solid rgba(255,255,255,.06)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '.5rem', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '10px', padding: '.5rem .85rem' }}>
            <span style={{ color: '#64748B' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, telefone ou email..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: '.85rem', fontFamily: 'Inter,sans-serif' }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>✕</button>}
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '.5rem .85rem', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '10px', color: filterStatus ? '#F8FAFC' : '#64748B', fontSize: '.83rem', fontFamily: 'Inter,sans-serif', outline: 'none', cursor: 'pointer' }}>
            <option value="">Todos os status</option>
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value} style={{ background: '#0A0F1E' }}>{o.label}</option>)}
          </select>
          {selected.size > 0 && (
            <Button variant="danger" size="sm" onClick={() => { if(confirm(`Deletar ${selected.size} leads?`)) { setLeads(prev => prev.filter(l => !selected.has(l.id))); setSelected(new Set()); toast({ message: `🗑️ ${selected.size} leads removidos`, type: 'info' }); } }}>
              🗑️ Deletar {selected.size}
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={openNew} icon="➕">Novo lead</Button>
        </div>

        {/* Table */}
        {loading ? <div style={{ padding: '1rem' }}><SkeletonTable rows={6} cols={6} /></div> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,.02)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                    <th style={{ padding: '.75rem 1rem .75rem 1.5rem', textAlign: 'left', width: '40px' }}>
                      <input type="checkbox" checked={selected.size === paginated.length && paginated.length > 0} onChange={e => { if (e.target.checked) setSelected(new Set(paginated.map(l => l.id))); else setSelected(new Set()); }} style={{ accentColor: '#3B82F6' }} />
                    </th>
                    {['Cliente', 'Telefone', 'Status', 'Tags', 'Origem', 'Cadastro', 'Ações'].map(h => (
                      <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🔍</div>
                      <div>Nenhum lead encontrado</div>
                    </td></tr>
                  ) : paginated.map((lead, i) => {
                    const st = STATUS_LABELS[lead.status] || { label: lead.status, color: '#64748B', bg: 'rgba(100,116,139,.1)' };
                    return (
                      <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)', transition: 'background .15s', background: selected.has(lead.id) ? 'rgba(59,130,246,.06)' : 'transparent' }}
                        onMouseOver={e => { if (!selected.has(lead.id)) e.currentTarget.style.background = 'rgba(255,255,255,.02)'; }}
                        onMouseOut={e => { if (!selected.has(lead.id)) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '.8rem 1rem .8rem 1.5rem' }}>
                          <input type="checkbox" checked={selected.has(lead.id)} onChange={e => { const s = new Set(selected); e.target.checked ? s.add(lead.id) : s.delete(lead.id); setSelected(s); }} style={{ accentColor: '#3B82F6' }} />
                        </td>
                        <td style={{ padding: '.8rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: getAvatarColor(lead.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.68rem', fontWeight: 700, flexShrink: 0 }}>{getInitials(lead.name)}</div>
                            <div>
                              <div style={{ fontWeight: 700 }}>{lead.name}</div>
                              <div style={{ fontSize: '.72rem', color: '#64748B' }}>{lead.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '.8rem 1rem', color: '#94A3B8' }}>{lead.phone}</td>
                        <td style={{ padding: '.8rem 1rem' }}>
                          <span style={{ padding: '.22rem .65rem', borderRadius: '100px', fontSize: '.7rem', fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.color}30`, display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                            {st.label}
                          </span>
                        </td>
                        <td style={{ padding: '.8rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                            {(lead.tags || []).slice(0, 2).map(t => (
                              <span key={t} style={{ padding: '.15rem .5rem', borderRadius: '6px', fontSize: '.65rem', fontWeight: 600, background: 'rgba(59,130,246,.1)', color: '#93C5FD', border: '1px solid rgba(59,130,246,.2)' }}>{t}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '.8rem 1rem', color: '#64748B', fontSize: '.8rem' }}>{lead.source || '—'}</td>
                        <td style={{ padding: '.8rem 1rem', color: '#64748B', fontSize: '.78rem', whiteSpace: 'nowrap' }}>{formatDate(lead.created_date)}</td>
                        <td style={{ padding: '.8rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '.25rem', opacity: 0, transition: 'opacity .15s' }} className="row-actions">
                            <button onClick={() => openEdit(lead)} style={actionBtnStyle} title="Editar">✏️</button>
                            <button onClick={() => openDelete(lead.id)} style={{ ...actionBtnStyle, color: '#EF4444' }} title="Deletar">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ padding: '.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,.06)', flexWrap: 'wrap', gap: '.75rem' }}>
              <span style={{ fontSize: '.78rem', color: '#64748B' }}>
                Mostrando {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} de {filtered.length} leads
              </span>
              <div style={{ display: 'flex', gap: '.35rem' }}>
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} style={{ ...pageBtnStyle, opacity: page === 1 ? .4 : 1 }}>‹</button>
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} style={{ ...pageBtnStyle, background: p === page ? 'rgba(59,130,246,.15)' : 'rgba(255,255,255,.04)', color: p === page ? '#60A5FA' : '#94A3B8', border: `1px solid ${p === page ? 'rgba(59,130,246,.3)' : 'rgba(255,255,255,.08)'}` }}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages} style={{ ...pageBtnStyle, opacity: page === pages ? .4 : 1 }}>›</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingLead ? 'Editar Lead' : 'Novo Lead'}
        subtitle={editingLead ? `Editando ${editingLead.name}` : 'Adicionar novo lead ao sistema'}
        icon="👤"
        size="md"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} style={ghostBtnStyle}>Cancelar</button>
            <Button onClick={saveLead} loading={saving}>💾 Salvar</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
          <Input label="Nome *" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Nome completo" icon="👤" required />
          <Input label="Telefone *" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="(11) 9 9999-9999" icon="📱" required />
          <Input label="E-mail" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="email@exemplo.com" icon="✉️" type="email" />
          <Select label="Status" value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))} options={STATUS_OPTS} />
          <Input label="Origem" value={form.source} onChange={e => setForm(p => ({...p, source: e.target.value}))} placeholder="WhatsApp, Instagram..." icon="📡" />
          <Input label="Valor (R$)" value={form.value} onChange={e => setForm(p => ({...p, value: e.target.value}))} placeholder="0,00" icon="💰" type="number" />
          <Input label="Tags" value={form.tags} onChange={e => setForm(p => ({...p, tags: e.target.value}))} placeholder="VIP, Loja, Delivery..." icon="🏷️" style={{ gridColumn: '1/-1' }} />
          <Textarea label="Observações" value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="Notas sobre este lead..." rows={3} style={{ gridColumn: '1/-1' }} />
        </div>
      </Modal>

      <ConfirmModal
        open={deleteModal} onClose={() => setDeleteModal(false)} onConfirm={confirmDelete}
        title="Deletar lead?" description="Esta ação não pode ser desfeita."
        confirmText="Sim, deletar" loading={saving}
      />

      <style>{`.row-actions { opacity: 0 !important; } tr:hover .row-actions { opacity: 1 !important; }`}</style>
    </div>
  );
}

const actionBtnStyle = { width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.78rem' };
const pageBtnStyle = { padding: '.4rem .75rem', borderRadius: '8px', fontSize: '.8rem', fontWeight: 600, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#94A3B8', cursor: 'pointer', transition: 'all .15s' };
const ghostBtnStyle = { padding: '.6rem 1.1rem', borderRadius: '8px', fontSize: '.85rem', fontWeight: 500, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#94A3B8', cursor: 'pointer' };
