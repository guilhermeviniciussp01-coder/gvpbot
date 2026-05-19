import { useState, useEffect, useRef } from 'react';
import { supabase, getUser, getWhatsappInstances, saveWhatsappInstance, deleteWhatsappInstance } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/Toast';

/* ── Status Badge ── */
function StatusBadge({ status }) {
  const cfg = {
    connected:    { label: 'Conectado',    color: '#22C55E', bg: 'rgba(34,197,94,.12)', pulse: false },
    connecting:   { label: 'Aguardando QR', color: '#F59E0B', bg: 'rgba(245,158,11,.12)', pulse: true },
    disconnected: { label: 'Desconectado', color: '#64748B', bg: 'rgba(100,116,139,.12)', pulse: false },
    error:        { label: 'Erro',         color: '#EF4444', bg: 'rgba(239,68,68,.12)',   pulse: false },
  };
  const c = cfg[status] || cfg.disconnected;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.25rem .7rem', borderRadius: '100px', background: c.bg, color: c.color, fontSize: '.72rem', fontWeight: 700, border: `1px solid ${c.color}30` }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.color, display: 'inline-block', animation: c.pulse ? 'pulseDot 1.5s infinite' : 'none' }} />
      {c.label}
    </span>
  );
}

/* ── QR Code real via Evolution API ── */
function QRDisplay({ qrCode, loading }) {
  if (loading) return (
    <div style={{ width: 220, height: 220, background: 'rgba(255,255,255,.04)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '.75rem', border: '1px solid rgba(255,255,255,.08)' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '.75rem', color: '#64748B' }}>Gerando QR Code...</span>
    </div>
  );
  if (qrCode) return (
    <img src={`data:image/png;base64,${qrCode}`} alt="QR Code WhatsApp" style={{ width: 220, height: 220, borderRadius: 12, background: 'white', padding: 8 }} />
  );
  return (
    <div style={{ width: 220, height: 220, background: 'rgba(255,255,255,.04)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '.75rem', border: '1px dashed rgba(255,255,255,.12)' }}>
      <span style={{ fontSize: '2rem' }}>📱</span>
      <span style={{ fontSize: '.75rem', color: '#64748B', textAlign: 'center', padding: '0 1rem' }}>Configure a Evolution API e clique em Conectar</span>
    </div>
  );
}

/* ── Modal de configuração ── */
function ConfigModal({ open, onClose, instance, onSave }) {
  const [form, setForm] = useState({ name: '', evolution_url: '', evolution_key: '', instance_name: '' });
  useEffect(() => {
    if (instance) setForm({ name: instance.name || '', evolution_url: instance.evolution_url || '', evolution_key: instance.evolution_key || '', instance_name: instance.instance_name || '' });
    else setForm({ name: '', evolution_url: '', evolution_key: '', instance_name: '' });
  }, [instance, open]);

  if (!open) return null;
  const inp = { width: '100%', padding: '.65rem .9rem', borderRadius: '8px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#F8FAFC', fontSize: '.85rem', outline: 'none', boxSizing: 'border-box' };
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#0F1629', border: '1px solid rgba(255,255,255,.1)', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '480px' }}>
        <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '1.25rem' }}>⚙️ {instance ? 'Editar instância' : 'Nova instância WhatsApp'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
          <div>
            <label style={{ fontSize: '.78rem', color: '#94A3B8', display: 'block', marginBottom: '.35rem' }}>Nome da instância *</label>
            <input style={inp} value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Ex: Loja Principal" />
          </div>
          <div>
            <label style={{ fontSize: '.78rem', color: '#94A3B8', display: 'block', marginBottom: '.35rem' }}>URL da Evolution API *</label>
            <input style={inp} value={form.evolution_url} onChange={e => upd('evolution_url', e.target.value)} placeholder="https://sua-evolution-api.com" />
          </div>
          <div>
            <label style={{ fontSize: '.78rem', color: '#94A3B8', display: 'block', marginBottom: '.35rem' }}>API Key *</label>
            <input style={inp} type="password" value={form.evolution_key} onChange={e => upd('evolution_key', e.target.value)} placeholder="Sua API Key da Evolution" />
          </div>
          <div>
            <label style={{ fontSize: '.78rem', color: '#94A3B8', display: 'block', marginBottom: '.35rem' }}>Nome da instância na Evolution *</label>
            <input style={inp} value={form.instance_name} onChange={e => upd('instance_name', e.target.value)} placeholder="Ex: gvpbot-principal" />
          </div>
          <div style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.2)', borderRadius: '8px', padding: '.75rem', fontSize: '.78rem', color: '#93C5FD' }}>
            💡 A Evolution API precisa estar rodando e acessível. A instância será criada automaticamente se não existir.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '.6rem 1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,.1)', background: 'transparent', color: '#94A3B8', cursor: 'pointer', fontSize: '.85rem' }}>Cancelar</button>
          <button onClick={() => onSave(form)} style={{ padding: '.6rem 1.4rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '.85rem' }}>💾 Salvar</button>
        </div>
      </div>
    </div>
  );
}

export default function WhatsApp() {
  const toast = useToast();
  const [instances, setInstances]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [configModal, setConfigModal] = useState(false);
  const [editInstance, setEditInstance] = useState(null);
  const [connecting, setConnecting]   = useState({});
  const [qrCodes, setQrCodes]         = useState({});
  const [statuses, setStatuses]       = useState({});
  const pollRefs = useRef({});

  useEffect(() => {
    loadInstances();
    return () => Object.values(pollRefs.current).forEach(clearInterval);
  }, []);

  async function loadInstances() {
    setLoading(true);
    try {
      const data = await getWhatsappInstances();
      setInstances(data);
      // Checar status de cada instância
      data.forEach(inst => checkStatus(inst));
    } catch (err) {
      toast({ message: `❌ Erro ao carregar instâncias: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // ── Checar status na Evolution API ──
  async function checkStatus(inst) {
    if (!inst.evolution_url || !inst.evolution_key || !inst.instance_name) return;
    try {
      const res = await fetch(`${inst.evolution_url}/instance/connectionState/${inst.instance_name}`, {
        headers: { 'apikey': inst.evolution_key },
      });
      if (!res.ok) throw new Error('Erro na API');
      const data = await res.json();
      const state = data?.instance?.state || data?.state;
      const status = state === 'open' ? 'connected' : state === 'connecting' ? 'connecting' : 'disconnected';
      setStatuses(p => ({ ...p, [inst.id]: status }));
    } catch {
      setStatuses(p => ({ ...p, [inst.id]: 'error' }));
    }
  }

  // ── Conectar e gerar QR Code ──
  async function connectInstance(inst) {
    if (!inst.evolution_url || !inst.evolution_key || !inst.instance_name) {
      toast({ message: '⚠️ Configure a Evolution API primeiro', type: 'warning' });
      return;
    }
    setConnecting(p => ({ ...p, [inst.id]: true }));
    setQrCodes(p => ({ ...p, [inst.id]: null }));
    try {
      // 1. Criar ou conectar instância
      const createRes = await fetch(`${inst.evolution_url}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': inst.evolution_key },
        body: JSON.stringify({
          instanceName: inst.instance_name,
          token: inst.evolution_key,
          qrcode: true,
        }),
      });

      // 2. Buscar QR Code
      const qrRes = await fetch(`${inst.evolution_url}/instance/connect/${inst.instance_name}`, {
        headers: { 'apikey': inst.evolution_key },
      });
      const qrData = await qrRes.json();

      if (qrData?.base64) {
        const base64 = qrData.base64.replace('data:image/png;base64,', '');
        setQrCodes(p => ({ ...p, [inst.id]: base64 }));
        setStatuses(p => ({ ...p, [inst.id]: 'connecting' }));

        // Polling para verificar quando conectar
        clearInterval(pollRefs.current[inst.id]);
        pollRefs.current[inst.id] = setInterval(async () => {
          await checkStatus(inst);
          const currentStatus = statuses[inst.id];
          if (currentStatus === 'connected') {
            clearInterval(pollRefs.current[inst.id]);
            setQrCodes(p => ({ ...p, [inst.id]: null }));
            toast({ message: `✅ ${inst.name} conectado com sucesso!`, type: 'success' });
          }
        }, 3000);

        // Para o polling após 2 minutos
        setTimeout(() => {
          clearInterval(pollRefs.current[inst.id]);
          setConnecting(p => ({ ...p, [inst.id]: false }));
        }, 120000);
      } else {
        toast({ message: '⚠️ QR Code não retornado. Verifique a Evolution API.', type: 'warning' });
      }
    } catch (err) {
      toast({ message: `❌ Erro ao conectar: ${err.message}`, type: 'error' });
      setStatuses(p => ({ ...p, [inst.id]: 'error' }));
    } finally {
      setConnecting(p => ({ ...p, [inst.id]: false }));
    }
  }

  async function handleSave(form) {
    if (!form.name || !form.evolution_url || !form.evolution_key || !form.instance_name) {
      toast({ message: '⚠️ Preencha todos os campos', type: 'warning' });
      return;
    }
    try {
      await saveWhatsappInstance(editInstance ? { ...editInstance, ...form } : form);
      toast({ message: '✅ Instância salva!', type: 'success' });
      setConfigModal(false);
      setEditInstance(null);
      loadInstances();
    } catch (err) {
      toast({ message: `❌ Erro: ${err.message}`, type: 'error' });
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remover esta instância?')) return;
    try {
      await deleteWhatsappInstance(id);
      toast({ message: '🗑️ Instância removida', type: 'success' });
      loadInstances();
    } catch (err) {
      toast({ message: `❌ Erro: ${err.message}`, type: 'error' });
    }
  }

  const cardBg = 'rgba(255,255,255,.03)';
  const border = 'rgba(255,255,255,.08)';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'Inter,sans-serif', color: '#F8FAFC' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '.25rem' }}>🟢 WhatsApp</h1>
          <p style={{ color: '#64748B', fontSize: '.88rem' }}>Conecte seus números via Evolution API</p>
        </div>
        <button
          onClick={() => { setEditInstance(null); setConfigModal(true); }}
          style={{ padding: '.65rem 1.25rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#22C55E,#16A34A)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '.88rem' }}
        >
          + Nova instância
        </button>
      </div>

      {/* Lista de instâncias */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Carregando...</div>
      ) : instances.length === 0 ? (
        <div style={{ background: cardBg, border: `1px dashed ${border}`, borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📱</div>
          <div style={{ fontWeight: 700, marginBottom: '.5rem' }}>Nenhuma instância configurada</div>
          <div style={{ color: '#64748B', fontSize: '.88rem', marginBottom: '1.5rem' }}>Adicione sua Evolution API para conectar o WhatsApp</div>
          <button onClick={() => setConfigModal(true)} style={{ padding: '.65rem 1.5rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#22C55E,#16A34A)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>+ Adicionar instância</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {instances.map(inst => {
            const status = statuses[inst.id] || 'disconnected';
            const qr = qrCodes[inst.id];
            const isConnecting = connecting[inst.id];
            return (
              <div key={inst.id} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: qr ? '1.5rem' : 0, flexWrap: 'wrap', gap: '.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(34,197,94,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>📱</div>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '.2rem' }}>{inst.name}</div>
                      <StatusBadge status={status} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '.6rem' }}>
                    {status !== 'connected' && (
                      <button
                        onClick={() => connectInstance(inst)}
                        disabled={isConnecting}
                        style={{ padding: '.5rem 1rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#22C55E,#16A34A)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '.82rem', opacity: isConnecting ? .7 : 1 }}
                      >
                        {isConnecting ? '⏳ Conectando...' : '🔗 Conectar'}
                      </button>
                    )}
                    {status === 'connected' && (
                      <button
                        onClick={() => checkStatus(inst)}
                        style={{ padding: '.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(34,197,94,.3)', background: 'transparent', color: '#22C55E', cursor: 'pointer', fontWeight: 600, fontSize: '.82rem' }}
                      >
                        🔄 Verificar
                      </button>
                    )}
                    <button onClick={() => { setEditInstance(inst); setConfigModal(true); }} style={{ padding: '.5rem .9rem', borderRadius: '8px', border: `1px solid ${border}`, background: 'transparent', color: '#94A3B8', cursor: 'pointer', fontSize: '.82rem' }}>⚙️</button>
                    <button onClick={() => handleDelete(inst.id)} style={{ padding: '.5rem .9rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,.2)', background: 'transparent', color: '#EF4444', cursor: 'pointer', fontSize: '.82rem' }}>🗑️</button>
                  </div>
                </div>

                {/* QR Code */}
                {(qr || isConnecting) && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: 'rgba(255,255,255,.02)', borderRadius: '12px', border: `1px solid ${border}` }}>
                    <QRDisplay qrCode={qr} loading={isConnecting && !qr} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, marginBottom: '.3rem' }}>Escaneie com o WhatsApp</div>
                      <div style={{ fontSize: '.8rem', color: '#64748B' }}>Abra o WhatsApp → Menu → Dispositivos conectados → Conectar dispositivo</div>
                    </div>
                  </div>
                )}

                {/* Info da instância */}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '.75rem', color: '#475569', background: 'rgba(255,255,255,.04)', padding: '.2rem .6rem', borderRadius: '6px' }}>
                    🌐 {inst.evolution_url ? new URL(inst.evolution_url).hostname : 'Não configurado'}
                  </span>
                  <span style={{ fontSize: '.75rem', color: '#475569', background: 'rgba(255,255,255,.04)', padding: '.2rem .6rem', borderRadius: '6px' }}>
                    📌 {inst.instance_name || 'Sem nome de instância'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfigModal
        open={configModal}
        onClose={() => { setConfigModal(false); setEditInstance(null); }}
        instance={editInstance}
        onSave={handleSave}
      />
    </div>
  );
}
