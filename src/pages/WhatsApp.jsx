import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, getUser, getWhatsappInstances, saveWhatsappInstance, deleteWhatsappInstance } from '@/api/supabaseClient';
import { useToast, addNotification } from '@/components/ui/Toast';

/* ── Status Badge ── */
function StatusBadge({ status }) {
  const cfg = {
    connected:    { label: 'Conectado',    color: '#22C55E', bg: 'rgba(34,197,94,.12)',   pulse: true  },
    connecting:   { label: 'Aguardando QR',color: '#F59E0B', bg: 'rgba(245,158,11,.12)', pulse: true  },
    disconnected: { label: 'Desconectado', color: '#64748B', bg: 'rgba(100,116,139,.12)', pulse: false },
    error:        { label: 'Erro',         color: '#EF4444', bg: 'rgba(239,68,68,.12)',   pulse: false },
  };
  const c = cfg[status] || cfg.disconnected;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'.35rem', padding:'.25rem .7rem', borderRadius:'100px', background:c.bg, color:c.color, fontSize:'.72rem', fontWeight:700, border:`1px solid ${c.color}30` }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:c.color, display:'inline-block', animation:c.pulse?'pulseDot 1.5s infinite':'none' }} />
      {c.label}
    </span>
  );
}

/* ── QR Code display ── */
function QRDisplay({ qrCode, loading }) {
  if (loading) return (
    <div style={{ width:220, height:220, background:'rgba(255,255,255,.04)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'.75rem', border:'1px solid rgba(255,255,255,.08)' }}>
      <div style={{ width:36, height:36, border:'3px solid #3B82F6', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <span style={{ fontSize:'.75rem', color:'#64748B' }}>Gerando QR Code...</span>
    </div>
  );
  if (qrCode) return <img src={`data:image/png;base64,${qrCode}`} alt="QR Code WhatsApp" style={{ width:220, height:220, borderRadius:12, background:'white', padding:8 }} />;
  return (
    <div style={{ width:220, height:220, background:'rgba(255,255,255,.04)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'.75rem', border:'1px dashed rgba(255,255,255,.12)' }}>
      <span style={{ fontSize:'2rem' }}>📱</span>
      <span style={{ fontSize:'.75rem', color:'#64748B', textAlign:'center', padding:'0 1rem' }}>Configure a Evolution API e clique em Conectar</span>
    </div>
  );
}

/* ── Botão copiar ── */
function CopyButton({ text, label = 'Copiar' }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <button onClick={copy} style={{ padding:'.3rem .7rem', borderRadius:'6px', border:'1px solid rgba(255,255,255,.1)', background: copied?'rgba(34,197,94,.12)':'rgba(255,255,255,.04)', color: copied?'#4ADE80':'#94A3B8', cursor:'pointer', fontSize:'.72rem', fontWeight:600, transition:'all .2s', whiteSpace:'nowrap' }}>
      {copied ? '✓ Copiado!' : `📋 ${label}`}
    </button>
  );
}

/* ── Modal de configuração ── */
function ConfigModal({ open, onClose, instance, onSave }) {
  const [form, setForm] = useState({ name:'', evolution_url:'', evolution_key:'', instance_name:'' });
  useEffect(() => {
    if (instance) setForm({ name:instance.name||'', evolution_url:instance.evolution_url||'', evolution_key:instance.evolution_key_display||instance.evolution_key||'', instance_name:instance.instance_name||'' });
    else setForm({ name:'', evolution_url:'', evolution_key:'', instance_name:'' });
  }, [instance, open]);
  if (!open) return null;
  const inp = { width:'100%', padding:'.65rem .9rem', borderRadius:'8px', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color:'#F8FAFC', fontSize:'.85rem', outline:'none', boxSizing:'border-box' };
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'#0F1629', border:'1px solid rgba(255,255,255,.1)', borderRadius:'16px', padding:'1.75rem', width:'100%', maxWidth:'480px' }}>
        <div style={{ fontWeight:800, fontSize:'1.05rem', marginBottom:'1.25rem' }}>⚙️ {instance?'Editar instância':'Nova instância WhatsApp'}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'.85rem' }}>
          <div><label style={{ fontSize:'.78rem', color:'#94A3B8', display:'block', marginBottom:'.35rem' }}>Nome da instância *</label><input style={inp} value={form.name} onChange={e=>upd('name',e.target.value)} placeholder="Ex: Loja Principal" /></div>
          <div><label style={{ fontSize:'.78rem', color:'#94A3B8', display:'block', marginBottom:'.35rem' }}>URL da Evolution API *</label><input style={inp} value={form.evolution_url} onChange={e=>upd('evolution_url',e.target.value)} placeholder="https://sua-evolution-api.com" /></div>
          <div><label style={{ fontSize:'.78rem', color:'#94A3B8', display:'block', marginBottom:'.35rem' }}>API Key *</label><input style={inp} type="password" value={form.evolution_key} onChange={e=>upd('evolution_key',e.target.value)} placeholder="Sua API Key da Evolution" /></div>
          <div><label style={{ fontSize:'.78rem', color:'#94A3B8', display:'block', marginBottom:'.35rem' }}>Nome da instância na Evolution *</label><input style={inp} value={form.instance_name} onChange={e=>upd('instance_name',e.target.value)} placeholder="Ex: gvpbot-principal" /></div>
          <div style={{ background:'rgba(59,130,246,.08)', border:'1px solid rgba(59,130,246,.2)', borderRadius:'8px', padding:'.75rem', fontSize:'.78rem', color:'#93C5FD' }}>
            💡 A Evolution API precisa estar rodando. A instância será criada automaticamente se não existir.
          </div>
        </div>
        <div style={{ display:'flex', gap:'.75rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'.6rem 1.2rem', borderRadius:'8px', border:'1px solid rgba(255,255,255,.1)', background:'transparent', color:'#94A3B8', cursor:'pointer', fontSize:'.85rem' }}>Cancelar</button>
          <button onClick={()=>onSave(form)} style={{ padding:'.6rem 1.4rem', borderRadius:'8px', border:'none', background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', color:'white', cursor:'pointer', fontWeight:700, fontSize:'.85rem' }}>💾 Salvar</button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal de teste ── */
function SendTestModal({ open, onClose, instance }) {
  const toast = useToast();
  const [phone, setPhone]     = useState('');
  const [msg, setMsg]         = useState('Olá! Esta é uma mensagem de teste do GVP BOT 🤖');
  const [sending, setSending] = useState(false);
  if (!open) return null;
  const inp = { width:'100%', padding:'.65rem .9rem', borderRadius:'8px', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color:'#F8FAFC', fontSize:'.85rem', outline:'none', boxSizing:'border-box', fontFamily:'Inter,sans-serif' };
  async function sendTest() {
    const number = phone.replace(/\D/g,'');
    if (!number) { toast({ message:'⚠️ Digite um número válido', type:'warning' }); return; }
    if (!instance?.evolution_url || !instance?.evolution_key) { toast({ message:'⚠️ Configure a Evolution API primeiro', type:'warning' }); return; }
    setSending(true);
    try {
      const apiKey = instance.evolution_key_display || instance.evolution_key;
      const res = await fetch(`${instance.evolution_url}/message/sendText/${instance.instance_name}`, {
        method:'POST', headers:{'Content-Type':'application/json','apikey':apiKey},
        body: JSON.stringify({ number:`${number}@s.whatsapp.net`, textMessage:{ text:msg } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message||'Erro ao enviar');
      toast({ message:`✅ Mensagem enviada para ${phone}!`, type:'success' });
      onClose();
    } catch(err) { toast({ message:`❌ ${err.message}`, type:'error' }); }
    finally { setSending(false); }
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'#0F1629', border:'1px solid rgba(255,255,255,.1)', borderRadius:'16px', padding:'1.75rem', width:'100%', maxWidth:'440px' }}>
        <div style={{ fontWeight:800, fontSize:'1rem', marginBottom:'1.25rem' }}>💬 Enviar mensagem de teste</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'.85rem' }}>
          <div><label style={{ fontSize:'.78rem', color:'#94A3B8', display:'block', marginBottom:'.3rem' }}>Número (com DDD)</label><input style={inp} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="11999999999" type="tel" /></div>
          <div><label style={{ fontSize:'.78rem', color:'#94A3B8', display:'block', marginBottom:'.3rem' }}>Mensagem</label><textarea style={{ ...inp, resize:'vertical', lineHeight:1.55 }} rows={3} value={msg} onChange={e=>setMsg(e.target.value)} /></div>
        </div>
        <div style={{ display:'flex', gap:'.75rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'.6rem 1.2rem', borderRadius:'8px', border:'1px solid rgba(255,255,255,.1)', background:'transparent', color:'#94A3B8', cursor:'pointer', fontSize:'.85rem' }}>Cancelar</button>
          <button onClick={sendTest} disabled={sending} style={{ padding:'.6rem 1.4rem', borderRadius:'8px', border:'none', background:'linear-gradient(135deg,#22C55E,#16A34A)', color:'white', cursor:sending?'not-allowed':'pointer', fontWeight:700, fontSize:'.85rem', opacity:sending?.7:1 }}>{sending?'⏳ Enviando...':'📤 Enviar'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Painel do Webhook ── */
function WebhookPanel({ instance, onRegenerateToken }) {
  const toast = useToast();
  const appUrl = window.location.origin;
  const webhookUrl = `${appUrl}/api/whatsapp-webhook?instance=${instance.instance_name}`;
  const token = instance.webhook_token || '—';

  return (
    <div style={{ background:'rgba(59,130,246,.04)', border:'1px solid rgba(59,130,246,.15)', borderRadius:'12px', padding:'1.25rem', marginTop:'.85rem' }}>
      <div style={{ fontWeight:700, fontSize:'.88rem', marginBottom:'1rem', color:'#93C5FD' }}>🔗 Configuração do Webhook</div>
      
      <div style={{ marginBottom:'.85rem' }}>
        <div style={{ fontSize:'.72rem', color:'#64748B', marginBottom:'.35rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' }}>URL do Webhook</div>
        <div style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
          <code style={{ flex:1, padding:'.5rem .75rem', borderRadius:'7px', background:'rgba(0,0,0,.3)', border:'1px solid rgba(255,255,255,.08)', fontSize:'.75rem', color:'#93C5FD', wordBreak:'break-all', lineHeight:1.5 }}>
            {webhookUrl}
          </code>
          <CopyButton text={webhookUrl} label="URL" />
        </div>
        <div style={{ fontSize:'.72rem', color:'#475569', marginTop:'.4rem' }}>
          Cole esta URL nas configurações de webhook da sua Evolution API
        </div>
      </div>

      <div>
        <div style={{ fontSize:'.72rem', color:'#64748B', marginBottom:'.35rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em' }}>Token de Segurança</div>
        <div style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
          <code style={{ flex:1, padding:'.5rem .75rem', borderRadius:'7px', background:'rgba(0,0,0,.3)', border:'1px solid rgba(255,255,255,.08)', fontSize:'.75rem', color:'#A78BFA', wordBreak:'break-all', lineHeight:1.5 }}>
            {token}
          </code>
          <CopyButton text={token} label="Token" />
          <button onClick={() => onRegenerateToken(instance.id)} style={{ padding:'.3rem .7rem', borderRadius:'6px', border:'1px solid rgba(239,68,68,.25)', background:'rgba(239,68,68,.08)', color:'#F87171', cursor:'pointer', fontSize:'.72rem', fontWeight:600, whiteSpace:'nowrap' }}>
            🔄 Novo
          </button>
        </div>
        <div style={{ fontSize:'.72rem', color:'#475569', marginTop:'.4rem' }}>
          Adicione como header <code style={{ color:'#64748B' }}>x-webhook-token</code> na Evolution API
        </div>
      </div>

      <div style={{ marginTop:'1rem', padding:'.75rem', background:'rgba(255,255,255,.03)', borderRadius:'8px', fontSize:'.75rem', color:'#64748B', lineHeight:1.6 }}>
        <strong style={{ color:'#94A3B8' }}>Como configurar na Evolution API:</strong><br />
        1. Acesse o painel da sua Evolution API<br />
        2. Em Webhooks, cole a URL acima<br />
        3. Ative o evento <code style={{ color:'#64748B' }}>messages.upsert</code><br />
        4. Adicione o header <code style={{ color:'#64748B' }}>x-webhook-token: {token.slice(0,12)}...</code>
      </div>
    </div>
  );
}


/* ── Componente principal ── */
export default function WhatsApp() {
  const toast = useToast();
  const [instances, setInstances] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [qrCode, setQrCode]       = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [statusMap, setStatusMap] = useState({});
  const [configOpen, setConfigOpen]   = useState(false);
  const [editInst, setEditInst]       = useState(null);
  const [testOpen, setTestOpen]       = useState(false);
  const [webhookOpen, setWebhookOpen] = useState(null); // id da instância com webhook aberto
  const [saving, setSaving]           = useState(false);
  const pollRef = useRef(null);

  useEffect(() => { loadInstances(); return () => clearInterval(pollRef.current); }, []);

  async function loadInstances() {
    setLoading(true);
    try {
      const data = await getWhatsappInstances();
      setInstances(data);
      if (!selected && data.length > 0) setSelected(data[0]);
    } catch(err) { toast({ message:`❌ ${err.message}`, type:'error' }); }
    finally { setLoading(false); }
  }

  async function checkStatus(inst) {
    if (!inst?.evolution_url || !inst?.evolution_key) return;
    try {
      const apiKey = inst.evolution_key_display || inst.evolution_key;
      const res = await fetch(`${inst.evolution_url}/instance/connectionState/${inst.instance_name}`, {
        headers:{ 'apikey': apiKey }
      });
      if (!res.ok) { setStatusMap(p=>({...p,[inst.id]:'error'})); return; }
      const data = await res.json();
      const state = data?.instance?.state || data?.state || 'close';
      const status = state === 'open' ? 'connected' : state === 'connecting' ? 'connecting' : 'disconnected';
      setStatusMap(p=>({...p,[inst.id]:status}));
      // Atualizar no banco
      const user = await getUser();
      if (user) await supabase.from('whatsapp_instances').update({ status }).eq('id',inst.id).eq('user_id',user.id);
    } catch { setStatusMap(p=>({...p,[inst.id]:'error'})); }
  }

  async function connectInstance(inst) {
    if (!inst.evolution_url || !inst.evolution_key) { toast({ message:'⚠️ Configure a Evolution API primeiro', type:'warning' }); return; }
    setQrLoading(true); setQrCode(null);
    setStatusMap(p=>({...p,[inst.id]:'connecting'}));
    try {
      const apiKey = inst.evolution_key_display || inst.evolution_key;
      // Criar instância se não existir
      await fetch(`${inst.evolution_url}/instance/create`, {
        method:'POST', headers:{'Content-Type':'application/json','apikey':apiKey},
        body: JSON.stringify({ instanceName:inst.instance_name, qrcode:true, integration:'WHATSAPP-BAILEYS' }),
      });
      // Buscar QR
      const qrRes = await fetch(`${inst.evolution_url}/instance/connect/${inst.instance_name}`, {
        headers:{ 'apikey':apiKey }
      });
      const qrData = await qrRes.json();
      const base64 = qrData?.base64 || qrData?.qrcode?.base64 || qrData?.code;
      if (base64) {
        const clean = base64.replace(/^data:image\/[a-z]+;base64,/,'');
        setQrCode(clean);
        toast({ message:'📱 QR Code gerado! Escaneie com o WhatsApp', type:'success' });
        // Poll de status a cada 3s
        clearInterval(pollRef.current);
        pollRef.current = setInterval(() => checkStatus(inst), 3000);
      } else { throw new Error('QR Code não retornado pela API'); }
    } catch(err) {
      toast({ message:`❌ ${err.message}`, type:'error' });
      setStatusMap(p=>({...p,[inst.id]:'error'}));
    } finally { setQrLoading(false); }
  }

  async function disconnectInstance(inst) {
    try {
      const apiKey = inst.evolution_key_display || inst.evolution_key;
      await fetch(`${inst.evolution_url}/instance/logout/${inst.instance_name}`, {
        method:'DELETE', headers:{ 'apikey':apiKey }
      });
      setStatusMap(p=>({...p,[inst.id]:'disconnected'}));
      setQrCode(null);
      clearInterval(pollRef.current);
      toast({ message:'✅ Desconectado com sucesso', type:'success' });
    } catch(err) { toast({ message:`❌ ${err.message}`, type:'error' }); }
  }

  async function handleSave(form) {
    setSaving(true);
    try {
      const saved = await saveWhatsappInstance({ ...(editInst||{}), ...form });
      toast({ message: editInst ? '✅ Instância atualizada!' : '✅ Instância criada!', type:'success' });
      addNotification({ icon:'📱', title:'WhatsApp', body:`Instância "${form.name}" salva`, type:'success' });
      setConfigOpen(false); setEditInst(null);
      await loadInstances();
      if (saved) setSelected(saved);
    } catch(err) { toast({ message:`❌ ${err.message}`, type:'error' }); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Remover esta instância?')) return;
    try {
      await deleteWhatsappInstance(id);
      toast({ message:'✅ Instância removida', type:'success' });
      if (selected?.id === id) setSelected(null);
      await loadInstances();
    } catch(err) { toast({ message:`❌ ${err.message}`, type:'error' }); }
  }

  async function regenerateToken(instId) {
    try {
      const user = await getUser();
      const newToken = crypto.randomUUID();
      await supabase.from('whatsapp_instances').update({ webhook_token:newToken }).eq('id',instId).eq('user_id',user.id);
      toast({ message:'🔄 Novo token gerado!', type:'success' });
      await loadInstances();
    } catch(err) { toast({ message:`❌ ${err.message}`, type:'error' }); }
  }

  const border = 'rgba(255,255,255,.08)';
  const card   = 'rgba(255,255,255,.03)';
  const sel    = selected ? (statusMap[selected.id] || selected.status || 'disconnected') : 'disconnected';

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'2rem 1.5rem', fontFamily:'Inter,sans-serif', color:'#F8FAFC' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.75rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:900, marginBottom:'.25rem' }}>📱 WhatsApp</h1>
          <p style={{ color:'#64748B', fontSize:'.88rem' }}>Conecte e gerencie instâncias via Evolution API</p>
        </div>
        <button onClick={()=>{ setEditInst(null); setConfigOpen(true); }} style={{ padding:'.65rem 1.35rem', borderRadius:'10px', background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', border:'none', color:'white', fontWeight:700, cursor:'pointer', fontSize:'.85rem', display:'flex', alignItems:'center', gap:'.45rem' }}>
          + Nova Instância
        </button>
      </div>

      {loading ? (
        <div style={{ padding:'4rem', textAlign:'center', color:'#64748B' }}>
          <div style={{ width:36, height:36, border:'3px solid #3B82F6', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 1rem' }} />
          Carregando instâncias...
        </div>
      ) : instances.length === 0 ? (
        <div style={{ padding:'4rem 2rem', textAlign:'center', background:card, border:`1px solid ${border}`, borderRadius:'16px' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📱</div>
          <div style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:'.5rem' }}>Nenhuma instância ainda</div>
          <div style={{ color:'#64748B', fontSize:'.88rem', marginBottom:'1.5rem' }}>Conecte seu WhatsApp para começar a automatizar mensagens com IA</div>
          <button onClick={()=>{ setEditInst(null); setConfigOpen(true); }} style={{ padding:'.75rem 1.75rem', borderRadius:'10px', background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', border:'none', color:'white', fontWeight:700, cursor:'pointer', fontSize:'.9rem' }}>
            + Adicionar primeira instância
          </button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'1.5rem', alignItems:'start' }}>

          {/* Lista lateral */}
          <div style={{ display:'flex', flexDirection:'column', gap:'.65rem' }}>
            {instances.map(inst => {
              const st = statusMap[inst.id] || inst.status || 'disconnected';
              const isActive = selected?.id === inst.id;
              return (
                <div key={inst.id} onClick={()=>{ setSelected(inst); clearInterval(pollRef.current); setQrCode(null); }} style={{ background: isActive?'rgba(59,130,246,.1)':card, border:`1px solid ${isActive?'rgba(59,130,246,.3)':border}`, borderRadius:'12px', padding:'1rem', cursor:'pointer', transition:'all .15s' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'.45rem' }}>
                    <span style={{ fontWeight:700, fontSize:'.88rem' }}>{inst.name}</span>
                    <StatusBadge status={st} />
                  </div>
                  <div style={{ fontSize:'.72rem', color:'#475569' }}>{inst.instance_name}</div>
                  {inst.phone_number && <div style={{ fontSize:'.72rem', color:'#4ADE80', marginTop:'.2rem' }}>📞 {inst.phone_number}</div>}
                </div>
              );
            })}
          </div>

          {/* Painel direito */}
          {selected && (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {/* Header do painel */}
              <div style={{ background:card, border:`1px solid ${border}`, borderRadius:'14px', padding:'1.25rem 1.5rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.85rem', flexWrap:'wrap', gap:'.75rem' }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:'1.05rem' }}>{selected.name}</div>
                    <div style={{ fontSize:'.75rem', color:'#475569', marginTop:'.15rem' }}>Instância: <code style={{ color:'#64748B' }}>{selected.instance_name}</code></div>
                  </div>
                  <StatusBadge status={sel} />
                </div>
                <div style={{ display:'flex', gap:'.65rem', flexWrap:'wrap' }}>
                  {sel !== 'connected' ? (
                    <button onClick={()=>connectInstance(selected)} disabled={qrLoading} style={{ padding:'.55rem 1.15rem', borderRadius:'8px', background:'linear-gradient(135deg,#22C55E,#16A34A)', border:'none', color:'white', fontWeight:700, cursor:qrLoading?'not-allowed':'pointer', fontSize:'.82rem', opacity:qrLoading?.7:1 }}>
                      {qrLoading?'⏳ Gerando...':'🔗 Conectar'}
                    </button>
                  ) : (
                    <button onClick={()=>disconnectInstance(selected)} style={{ padding:'.55rem 1.15rem', borderRadius:'8px', background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.25)', color:'#F87171', fontWeight:700, cursor:'pointer', fontSize:'.82rem' }}>
                      ⏏ Desconectar
                    </button>
                  )}
                  <button onClick={()=>checkStatus(selected)} style={{ padding:'.55rem 1rem', borderRadius:'8px', background:'rgba(255,255,255,.05)', border:`1px solid ${border}`, color:'#94A3B8', cursor:'pointer', fontSize:'.82rem' }}>
                    🔄 Status
                  </button>
                  <button onClick={()=>setTestOpen(true)} disabled={sel!=='connected'} style={{ padding:'.55rem 1rem', borderRadius:'8px', background:'rgba(59,130,246,.1)', border:'1px solid rgba(59,130,246,.2)', color:'#60A5FA', fontWeight:600, cursor:sel!=='connected'?'not-allowed':'pointer', fontSize:'.82rem', opacity:sel!=='connected'?.5:1 }}>
                    💬 Teste
                  </button>
                  <button onClick={()=>{ setEditInst(selected); setConfigOpen(true); }} style={{ padding:'.55rem 1rem', borderRadius:'8px', background:'rgba(255,255,255,.05)', border:`1px solid ${border}`, color:'#94A3B8', cursor:'pointer', fontSize:'.82rem' }}>
                    ✏️ Editar
                  </button>
                  <button onClick={()=>handleDelete(selected.id)} style={{ padding:'.55rem 1rem', borderRadius:'8px', background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.15)', color:'#F87171', cursor:'pointer', fontSize:'.82rem' }}>
                    🗑️
                  </button>
                </div>
              </div>

              {/* QR Code */}
              {(qrCode || qrLoading) && (
                <div style={{ background:card, border:`1px solid ${border}`, borderRadius:'14px', padding:'1.5rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem' }}>
                  <div style={{ fontWeight:700 }}>📱 Escaneie o QR Code</div>
                  <QRDisplay qrCode={qrCode} loading={qrLoading} />
                  <div style={{ fontSize:'.78rem', color:'#64748B', textAlign:'center' }}>
                    1. Abra o WhatsApp no celular<br />2. Toque em ⋮ → Aparelhos conectados<br />3. Escaneie este QR Code
                  </div>
                </div>
              )}

              {/* Painel do Webhook */}
              <div style={{ background:card, border:`1px solid ${border}`, borderRadius:'14px', padding:'1.25rem 1.5rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontWeight:700 }}>🔗 Webhook & Token</div>
                  <button onClick={()=>setWebhookOpen(webhookOpen===selected.id?null:selected.id)} style={{ padding:'.3rem .75rem', borderRadius:'6px', border:`1px solid ${border}`, background:'transparent', color:'#94A3B8', cursor:'pointer', fontSize:'.78rem' }}>
                    {webhookOpen===selected.id?'▲ Fechar':'▼ Ver'}
                  </button>
                </div>
                {webhookOpen === selected.id && (
                  <WebhookPanel instance={selected} onRegenerateToken={regenerateToken} />
                )}
              </div>

              {/* Info da instância */}
              <div style={{ background:card, border:`1px solid ${border}`, borderRadius:'14px', padding:'1.25rem 1.5rem' }}>
                <div style={{ fontWeight:700, marginBottom:'1rem' }}>ℹ️ Informações</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
                  {[
                    { label:'URL da Evolution', value: selected.evolution_url || '—' },
                    { label:'Nome na Evolution', value: selected.instance_name },
                    { label:'Status atual', value: sel.charAt(0).toUpperCase()+sel.slice(1) },
                    { label:'Criado em', value: selected.created_at ? new Date(selected.created_at).toLocaleDateString('pt-BR') : '—' },
                  ].map(info => (
                    <div key={info.label} style={{ background:'rgba(255,255,255,.03)', border:`1px solid ${border}`, borderRadius:'8px', padding:'.75rem' }}>
                      <div style={{ fontSize:'.7rem', color:'#475569', marginBottom:'.25rem', textTransform:'uppercase', letterSpacing:'.04em' }}>{info.label}</div>
                      <div style={{ fontSize:'.82rem', color:'#F8FAFC', wordBreak:'break-all' }}>{info.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfigModal open={configOpen} onClose={()=>{ setConfigOpen(false); setEditInst(null); }} instance={editInst} onSave={handleSave} />
      <SendTestModal open={testOpen} onClose={()=>setTestOpen(false)} instance={selected} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
      `}</style>
    </div>
  );
}
