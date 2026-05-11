import { useState, useEffect, useRef } from 'react';
import { WhatsappInstance } from '@/api/entities';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

/* ─── QR Code SVG mock ─── */
function QRCode({ size = 200 }) {
  const cells = [];
  for (let r = 0; r < 25; r++) for (let c = 0; c < 25; c++) {
    const edge = (r < 7 && c < 7) || (r < 7 && c > 17) || (r > 17 && c < 7);
    const filled = edge ? true : Math.sin(r * 3.7 + c * 2.1 + r * c * 0.3) > 0.1;
    if (filled) cells.push({ r, c });
  }
  const s = size / 25;
  return (
    <svg width={size} height={size} style={{ borderRadius: 12, background: 'white', padding: 8 }}>
      {cells.map((cell, i) => (
        <rect key={i} x={cell.c * s} y={cell.r * s} width={s - .5} height={s - .5} fill="#000" />
      ))}
    </svg>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ status }) {
  const cfg = {
    connected: { label: 'Conectado', color: '#22C55E', bg: 'rgba(34,197,94,.12)', dot: true },
    connecting: { label: 'Conectando...', color: '#F59E0B', bg: 'rgba(245,158,11,.12)', dot: true, pulse: true },
    disconnected: { label: 'Desconectado', color: '#64748B', bg: 'rgba(100,116,139,.12)', dot: false },
    error: { label: 'Erro', color: '#EF4444', bg: 'rgba(239,68,68,.12)', dot: true },
  };
  const c = cfg[status] || cfg.disconnected;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.25rem .7rem', borderRadius: '100px', background: c.bg, color: c.color, fontSize: '.72rem', fontWeight: 700, border: `1px solid ${c.color}30` }}>
      {c.dot && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.color, display: 'inline-block', animation: c.pulse ? 'pulseDot 1.5s infinite' : 'none' }} />}
      {c.label}
    </span>
  );
}

/* ─── Config Modal ─── */
function ConfigModal({ open, onClose, instance, onSave }) {
  const [form, setForm] = useState({ name: '', evolution_api_url: '', evolution_api_key: '', evolution_instance_name: '' });
  useEffect(() => { if (instance) setForm({ name: instance.name || '', evolution_api_url: instance.evolution_api_url || '', evolution_api_key: instance.evolution_api_key || '', evolution_instance_name: instance.evolution_instance_name || '' }); }, [instance]);
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <Modal open={open} onClose={onClose} title={instance ? 'Editar instância' : 'Nova instância'} icon="⚙️" size="md"
      footer={<><button onClick={onClose} style={ghostBtn}>Cancelar</button><Button onClick={() => onSave(form)}>💾 Salvar</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
        <Input label="Nome da instância *" value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Ex: Loja Principal" icon="📱" />
        <Input label="Evolution API URL *" value={form.evolution_api_url} onChange={e => upd('evolution_api_url', e.target.value)} placeholder="https://api.seudominio.com.br" icon="🌐" />
        <Input label="API Key *" value={form.evolution_api_key} onChange={e => upd('evolution_api_key', e.target.value)} placeholder="eyJhbGci..." icon="🔑" type="password" />
        <Input label="Nome da instância no Evolution" value={form.evolution_instance_name} onChange={e => upd('evolution_instance_name', e.target.value)} placeholder="loja-principal" icon="🏷️" helper="Apenas letras minúsculas, números e hífens" />
        <div style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: '10px', padding: '.85rem', fontSize: '.78rem', color: '#93C5FD', lineHeight: 1.7 }}>
          💡 <strong>Como obter:</strong> Acesse seu painel Evolution API → Configurações → API Key. Cole a URL base sem a barra final.
        </div>
      </div>
    </Modal>
  );
}

/* ─── QR Modal ─── */
function QRModal({ open, onClose, instance, onConnected }) {
  const [phase, setPhase] = useState('qr'); // qr | scanning | connected
  const [secs, setSecs] = useState(45);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!open) { setPhase('qr'); setSecs(45); return; }
    timerRef.current = setInterval(() => setSecs(p => { if (p <= 1) { clearInterval(timerRef.current); return 0; } return p - 1; }), 1000);
    // Simulate scan after 6s
    setTimeout(() => { setPhase('scanning'); setTimeout(() => { setPhase('connected'); clearInterval(timerRef.current); onConnected?.(); }, 2500); }, 6000);
    return () => clearInterval(timerRef.current);
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Conectar WhatsApp" subtitle={instance?.name} icon="📱" size="sm">
      <div style={{ textAlign: 'center', padding: '.5rem 0' }}>
        {phase === 'qr' && (
          <>
            <p style={{ fontSize: '.85rem', color: '#64748B', marginBottom: '1.25rem', lineHeight: 1.7 }}>Abra o WhatsApp no celular → Aparelhos conectados → Conectar aparelho → Escaneie o QR Code</p>
            <div style={{ display: 'inline-block', position: 'relative' }}>
              <QRCode size={200} />
              {secs === 0 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,15,30,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, flexDirection: 'column', gap: '.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>⏱️</span>
                <span style={{ fontSize: '.82rem', color: '#F8FAFC', fontWeight: 700 }}>QR expirado</span>
              </div>}
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
              <div style={{ height: '4px', flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(secs / 45) * 100}%`, background: secs > 15 ? '#22C55E' : '#EF4444', transition: 'width 1s linear, background .3s' }} />
              </div>
              <span style={{ fontSize: '.75rem', color: secs > 15 ? '#22C55E' : '#EF4444', fontWeight: 700, minWidth: '30px' }}>{secs}s</span>
            </div>
            {secs === 0 && <button onClick={() => setSecs(45)} style={{ marginTop: '1rem', padding: '.5rem 1.25rem', borderRadius: '8px', background: 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.3)', color: '#60A5FA', fontWeight: 700, fontSize: '.83rem', cursor: 'pointer' }}>🔄 Gerar novo QR</button>}
          </>
        )}
        {phase === 'scanning' && (
          <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(245,158,11,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', animation: 'spin 1.5s linear infinite' }}>📷</div>
            <div style={{ fontWeight: 700, color: '#F59E0B' }}>Escaneando...</div>
            <div style={{ fontSize: '.82rem', color: '#64748B' }}>Aguarde a confirmação do WhatsApp</div>
          </div>
        )}
        {phase === 'connected' && (
          <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(34,197,94,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', animation: 'popIn .4s ease' }}>✅</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#22C55E' }}>WhatsApp Conectado!</div>
            <div style={{ fontSize: '.82rem', color: '#64748B' }}>Sua instância está ativa e pronta para uso</div>
            <button onClick={onClose} style={{ padding: '.6rem 1.5rem', borderRadius: '10px', background: 'linear-gradient(135deg,#22C55E,#16A34A)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Continuar →</button>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ─── Main Page ─── */
export default function WhatsApp() {
  const toast = useToast();
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configModal, setConfigModal] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editingInst, setEditingInst] = useState(null);
  const [activeInst, setActiveInst] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedTab, setSelectedTab] = useState(null);

  const MOCK = [
    { id: 'w1', name: 'Loja Principal', evolution_instance_name: 'loja-principal', status: 'connected', phone_number: '+55 11 9 9821-3344', profile_name: 'Boutique Estilo', messages_today: 147, messages_total: 4230, last_connected: new Date(Date.now() - 3600000).toISOString(), evolution_api_url: 'https://api.gvpbot.com', evolution_api_key: '••••••••••' },
    { id: 'w2', name: 'Suporte', evolution_instance_name: 'suporte-01', status: 'disconnected', messages_today: 0, messages_total: 890, evolution_api_url: '', evolution_api_key: '' },
  ];

  useEffect(() => { loadInstances(); }, []);

  async function loadInstances() {
    setLoading(true);
    try {
      const data = await WhatsappInstance.list();
      const combined = data.length > 0 ? data : MOCK;
      setInstances(combined);
      setSelectedTab(combined[0]);
    } catch { setInstances(MOCK); setSelectedTab(MOCK[0]); }
    finally { setLoading(false); }
  }

  async function saveInstance(form) {
    if (!form.name) { toast({ message: 'Nome é obrigatório', type: 'error' }); return; }
    const data = { ...form, status: 'disconnected', messages_today: 0, messages_total: 0 };
    if (editingInst) {
      const updated = instances.map(i => i.id === editingInst.id ? { ...i, ...form } : i);
      setInstances(updated);
      try { await WhatsappInstance.update(editingInst.id, form); } catch {}
      toast({ message: '✅ Instância atualizada!', type: 'success' });
    } else {
      const newI = { ...data, id: Date.now().toString(), created_date: new Date().toISOString() };
      setInstances(p => [...p, newI]);
      setSelectedTab(newI);
      try { await WhatsappInstance.create(data); } catch {}
      toast({ message: '✅ Instância criada!', type: 'success' });
    }
    setConfigModal(false);
    setEditingInst(null);
  }

  async function deleteInstance() {
    setInstances(p => { const n = p.filter(i => i.id !== deleteId); if (selectedTab?.id === deleteId) setSelectedTab(n[0] || null); return n; });
    try { await WhatsappInstance.delete(deleteId); } catch {}
    toast({ message: '🗑️ Instância removida', type: 'info' });
    setDeleteModal(false);
  }

  function handleConnected() {
    setInstances(p => p.map(i => i.id === activeInst?.id ? { ...i, status: 'connected', last_connected: new Date().toISOString() } : i));
    if (selectedTab?.id === activeInst?.id) setSelectedTab(p => ({ ...p, status: 'connected' }));
    toast({ message: '🟢 WhatsApp conectado com sucesso!', type: 'success' });
  }

  function simulateWebhook(inst) {
    toast({ message: `📨 Webhook ativo: ${inst.evolution_api_url || 'https://api.gvpbot.com'}/webhook`, type: 'info', duration: 4000 });
  }

  const inst = selectedTab;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.2rem' }}>WhatsApp <span style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Instâncias</span></h2>
          <p style={{ fontSize: '.85rem', color: '#64748B' }}>Evolution API — conecte e gerencie seus números</p>
        </div>
        <Button onClick={() => { setEditingInst(null); setConfigModal(true); }} icon="➕">Nova instância</Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        {[
          { label: 'Instâncias', val: instances.length, icon: '📱', color: '#3B82F6' },
          { label: 'Conectadas', val: instances.filter(i => i.status === 'connected').length, icon: '🟢', color: '#22C55E' },
          { label: 'Msgs hoje', val: instances.reduce((a, i) => a + (i.messages_today || 0), 0), icon: '💬', color: '#8B5CF6' },
          { label: 'Msgs total', val: instances.reduce((a, i) => a + (i.messages_total || 0), 0).toLocaleString('pt-BR'), icon: '📊', color: '#F59E0B' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, background: `linear-gradient(135deg,${s.color},${s.color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.val}</div>
              <div style={{ fontSize: '.75rem', color: '#64748B', marginTop: '.1rem' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.25rem', minHeight: '500px' }}>

        {/* Instance list */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: '.8rem', fontWeight: 700, color: '#64748B', letterSpacing: '.5px', textTransform: 'uppercase' }}>Instâncias ({instances.length})</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {instances.map(i => (
              <div key={i.id} onClick={() => setSelectedTab(i)} style={{ padding: '.9rem 1rem', borderBottom: '1px solid rgba(255,255,255,.04)', cursor: 'pointer', background: selectedTab?.id === i.id ? 'rgba(59,130,246,.1)' : 'transparent', borderLeft: `3px solid ${selectedTab?.id === i.id ? '#3B82F6' : 'transparent'}`, transition: 'all .15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: i.status === 'connected' ? 'rgba(34,197,94,.15)' : 'rgba(100,116,139,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: `1px solid ${i.status === 'connected' ? 'rgba(34,197,94,.3)' : 'rgba(255,255,255,.08)'}` }}>📱</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.name}</div>
                    <StatusBadge status={i.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '.75rem' }}>
            <button onClick={() => { setEditingInst(null); setConfigModal(true); }} style={{ width: '100%', padding: '.6rem', borderRadius: '8px', background: 'rgba(59,130,246,.1)', border: '1px dashed rgba(59,130,246,.3)', color: '#60A5FA', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem' }}>
              ➕ Nova instância
            </button>
          </div>
        </div>

        {/* Instance detail */}
        {inst ? (
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Instance header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,.02)' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: inst.status === 'connected' ? 'linear-gradient(135deg,#22C55E,#16A34A)' : 'rgba(100,116,139,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>📱</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '.3rem' }}>{inst.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
                  <StatusBadge status={inst.status} />
                  {inst.phone_number && <span style={{ fontSize: '.78rem', color: '#64748B' }}>📞 {inst.phone_number}</span>}
                  {inst.profile_name && <span style={{ fontSize: '.78rem', color: '#64748B' }}>👤 {inst.profile_name}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                {inst.status !== 'connected' && (
                  <Button size="sm" variant="success" onClick={() => { setActiveInst(inst); setQrModal(true); }} icon="🔗">Conectar</Button>
                )}
                {inst.status === 'connected' && (
                  <Button size="sm" variant="danger" onClick={() => { setInstances(p => p.map(i => i.id === inst.id ? { ...i, status: 'disconnected' } : i)); setSelectedTab(p => ({ ...p, status: 'disconnected' })); toast({ message: '⚠️ Instância desconectada', type: 'warning' }); }}>Desconectar</Button>
                )}
                <button onClick={() => { setEditingInst(inst); setConfigModal(true); }} style={actionBtn}>⚙️</button>
                <button onClick={() => { setDeleteId(inst.id); setDeleteModal(true); }} style={{ ...actionBtn, color: '#EF4444' }}>🗑️</button>
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'rgba(255,255,255,.06)' }}>
              {[
                { label: 'Mensagens hoje', val: inst.messages_today || 0, icon: '💬', color: '#3B82F6' },
                { label: 'Mensagens total', val: (inst.messages_total || 0).toLocaleString('pt-BR'), icon: '📊', color: '#22C55E' },
                { label: 'Última conexão', val: inst.last_connected ? new Date(inst.last_connected).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—', icon: '⏱', color: '#8B5CF6' },
              ].map((m, i) => (
                <div key={i} style={{ padding: '1rem 1.25rem', background: 'rgba(10,15,30,.5)', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>{m.icon}</span>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-1px', background: `linear-gradient(135deg,${m.color},${m.color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{m.val}</div>
                    <div style={{ fontSize: '.72rem', color: '#64748B' }}>{m.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Connection info */}
              <div>
                <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.85rem' }}>Configuração Evolution API</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
                  {[
                    { label: 'API URL', val: inst.evolution_api_url || 'Não configurado', icon: '🌐' },
                    { label: 'Instância', val: inst.evolution_instance_name || 'Não configurado', icon: '🏷️' },
                    { label: 'API Key', val: inst.evolution_api_key ? '••••••••••••' : 'Não configurado', icon: '🔑' },
                    { label: 'Webhook', val: inst.webhook_url || `https://api.gvpbot.com/webhook/${inst.evolution_instance_name || 'inst'}`, icon: '🔗' },
                  ].map((f, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '10px', padding: '.75rem' }}>
                      <div style={{ fontSize: '.7rem', color: '#64748B', marginBottom: '.2rem' }}>{f.icon} {f.label}</div>
                      <div style={{ fontSize: '.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.85rem' }}>Ações rápidas</div>
                <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap' }}>
                  {[
                    { label: '🔄 Reconectar', action: () => { setActiveInst(inst); setQrModal(true); } },
                    { label: '📡 Testar Webhook', action: () => simulateWebhook(inst) },
                    { label: '🔃 Atualizar status', action: () => toast({ message: '✅ Status atualizado', type: 'success' }) },
                    { label: '📋 Copiar webhook', action: () => { navigator.clipboard?.writeText(`https://api.gvpbot.com/webhook/${inst.evolution_instance_name || 'inst'}`); toast({ message: '📋 Copiado!', type: 'success' }); } },
                  ].map((a, i) => (
                    <button key={i} onClick={a.action} style={{ padding: '.5rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#94A3B8', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#3B82F650'; e.currentTarget.style.color = '#F8FAFC'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = '#94A3B8'; }}
                    >{a.label}</button>
                  ))}
                </div>
              </div>

              {/* Webhook events log */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.85rem' }}>Log de eventos recentes</div>
                <div style={{ background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.06)', borderRadius: '10px', padding: '.75rem', fontFamily: 'monospace', fontSize: '.72rem', lineHeight: 1.8, color: '#94A3B8', maxHeight: '160px', overflowY: 'auto' }}>
                  {inst.status === 'connected' ? <>
                    <div><span style={{ color: '#22C55E' }}>[22:31:05]</span> MESSAGE_RECEIVED from +55 11 9 9999-0001</div>
                    <div><span style={{ color: '#3B82F6' }}>[22:31:06]</span> AI_PROCESSING delay 1.2s</div>
                    <div><span style={{ color: '#22C55E' }}>[22:31:07]</span> MESSAGE_SENT to +55 11 9 9999-0001</div>
                    <div><span style={{ color: '#F59E0B' }}>[22:30:50]</span> MESSAGE_RECEIVED from +55 11 9 8765-0002</div>
                    <div><span style={{ color: '#22C55E' }}>[22:30:52]</span> LEAD_CAPTURED — João M.</div>
                    <div><span style={{ color: '#22C55E' }}>[22:29:30]</span> MESSAGE_SENT to +55 11 9 8765-0002</div>
                    <div><span style={{ color: '#64748B' }}>[22:28:00]</span> INSTANCE_CONNECTED</div>
                  </> : <div style={{ color: '#475569' }}>Instância desconectada. Conecte para ver eventos.</div>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: '#64748B' }}>
            <div style={{ fontSize: '3rem' }}>📱</div>
            <div style={{ fontWeight: 700 }}>Selecione uma instância</div>
            <div style={{ fontSize: '.85rem' }}>ou crie uma nova</div>
          </div>
        )}
      </div>

      <ConfigModal open={configModal} onClose={() => { setConfigModal(false); setEditingInst(null); }} instance={editingInst} onSave={saveInstance} />
      <QRModal open={qrModal} onClose={() => setQrModal(false)} instance={activeInst} onConnected={handleConnected} />
      <ConfirmModal open={deleteModal} onClose={() => setDeleteModal(false)} onConfirm={deleteInstance} title="Remover instância?" description="Isso desconectará o WhatsApp e apagará toda a configuração. Esta ação não pode ser desfeita." confirmText="Sim, remover" />

      <style>{`
        @keyframes pulseDot{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}50%{box-shadow:0 0 0 6px rgba(34,197,94,0)}}
        @keyframes popIn{0%{transform:scale(0)}80%{transform:scale(1.1)}100%{transform:scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}

const ghostBtn = { padding: '.6rem 1.1rem', borderRadius: '8px', fontSize: '.85rem', fontWeight: 500, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#94A3B8', cursor: 'pointer' };
const actionBtn = { width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem' };
