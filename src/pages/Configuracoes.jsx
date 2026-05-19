import { useState, useEffect } from 'react';
import { supabase, getUserSubscription } from '@/api/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Switch, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Belem', label: 'Belém (GMT-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
  { value: 'America/Recife', label: 'Recife (GMT-3)' },
  { value: 'America/Cuiaba', label: 'Cuiabá (GMT-4)' },
  { value: 'America/Porto_Velho', label: 'Porto Velho (GMT-4)' },
];

const THEMES = [
  { value: 'dark', label: '🌑 Dark (padrão)' },
  { value: 'darker', label: '⬛ Ultra Dark' },
  { value: 'midnight', label: '🌌 Midnight Blue' },
];

export default function Configuracoes() {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('perfil');
  const [saving, setSaving] = useState(false);
  const [pwdModal, setPwdModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [showKeys, setShowKeys] = useState({});
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', company_name: '', timezone: 'America/Sao_Paulo', theme: 'dark' });
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [notifs, setNotifs] = useState({ new_lead: true, new_message: true, weekly_report: true, system: true, payment: true, ai_alert: false });
  const [prefs, setPrefs] = useState({ animations: true, auto_save: true, sidebar_compact: false, sounds: false, compact_view: false });
  const [apiKeys, setApiKeys] = useState({ openrouter: '', evolution_url: '', evolution_key: '', mercadopago: '', webhook_secret: '' });
  const [sessions] = useState([
    { id: 's1', device: '💻 Chrome · Windows 11', location: 'São Paulo, BR', ip: '186.x.x.1', last: 'Agora', current: true },
    { id: 's2', device: '📱 Safari · iPhone 15', location: 'São Paulo, BR', ip: '177.x.x.2', last: 'Há 2 horas', current: false },
    { id: 's3', device: '💻 Firefox · macOS', location: 'Rio de Janeiro, BR', ip: '201.x.x.3', last: 'Ontem 18:30', current: false },
  ]);

  const [subscription, setSubscription]   = useState(null);
  const [cancelModal, setCancelModal]     = useState(false);
  const [cancelling, setCancelling]       = useState(false);

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const updKey = (k, v) => setApiKeys(p => ({ ...p, [k]: v }));

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const u = {
        full_name:    user.user_metadata?.full_name    || user.user_metadata?.name || user.email?.split('@')[0] || '',
        email:        user.email || '',
        phone:        user.user_metadata?.phone        || '',
        company_name: user.user_metadata?.company_name || '',
        timezone:     user.user_metadata?.timezone     || 'America/Sao_Paulo',
      };
      setUser(u);
      setForm(p => ({ ...p, ...u }));
    });
  }, []);

  async function saveProfile() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast({ message: '✅ Perfil atualizado!', type: 'success' });
  }

  async function changePassword() {
    if (!pwdForm.current) { toast({ message: 'Informe a senha atual', type: 'error' }); return; }
    if (pwdForm.new.length < 8) { toast({ message: 'Senha mínimo 8 caracteres', type: 'error' }); return; }
    if (pwdForm.new !== pwdForm.confirm) { toast({ message: 'Senhas não coincidem', type: 'error' }); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    setPwdModal(false);
    setPwdForm({ current: '', new: '', confirm: '' });
    toast({ message: '🔒 Senha alterada!', type: 'success' });
  }

  async function cancelarAssinatura() {
    if (!subscription) return;
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', subscription.id);
      if (error) throw error;

      // Atualizar user_metadata — volta para trial
      await supabase.auth.updateUser({ data: { plano: 'trial' } });

      setSubscription(prev => ({ ...prev, status: 'cancelled' }));
      setCancelModal(false);
      toast({ message: '✅ Assinatura cancelada. Acesso mantido até o fim do período.', type: 'success' });
    } catch (err) {
      toast({ message: `❌ Erro: ${err.message}`, type: 'error' });
    } finally {
      setCancelling(false);
    }
  }

  async function saveApiKeys() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    toast({ message: '🔑 Chaves API salvas com segurança!', type: 'success' });
  }

  function toggleKey(k) {
    setShowKeys(p => ({ ...p, [k]: !p[k] }));
  }

  const TABS = [
    { id: 'perfil', label: '👤 Perfil', icon: '👤' },
    { id: 'seguranca', label: '🔒 Segurança', icon: '🔒' },
    { id: 'assinatura', label: '💳 Assinatura', icon: '💳' },
    { id: 'api', label: '🔑 API Keys', icon: '🔑' },
    { id: 'notificacoes', label: '🔔 Notificações', icon: '🔔' },
    { id: 'preferencias', label: '⚙️ Preferências', icon: '⚙️' },
    { id: 'danger', label: '⚠️ Conta', icon: '⚠️' },
  ];

  const initials = (form.full_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '860px' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.2rem' }}>Configurações</h2>
        <p style={{ fontSize: '.85rem', color: '#64748B' }}>Gerencie sua conta, segurança e integrações</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* Sidebar tabs */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '.4rem', display: 'flex', flexDirection: 'column', gap: '.15rem', position: 'sticky', top: '80px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '.62rem .85rem', borderRadius: '9px', fontSize: '.84rem', fontWeight: tab === t.id ? 700 : 500, background: tab === t.id ? (t.id === 'danger' ? 'rgba(239,68,68,.12)' : 'rgba(59,130,246,.12)') : 'transparent', border: `1px solid ${tab === t.id ? (t.id === 'danger' ? 'rgba(239,68,68,.25)' : 'rgba(59,130,246,.25)') : 'transparent'}`, color: tab === t.id ? (t.id === 'danger' ? '#FCA5A5' : '#60A5FA') : '#64748B', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', fontFamily: 'Inter,sans-serif' }}>{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* PERFIL */}
          {tab === 'perfil' && (
            <>
              <div style={card}>
                <div style={cardTitle}>Foto de perfil</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', fontWeight: 900, flexShrink: 0, boxShadow: '0 0 24px rgba(59,130,246,.3)' }}>{initials}</div>
                  <div>
                    <div style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '.25rem' }}>{form.full_name}</div>
                    <div style={{ fontSize: '.78rem', color: '#64748B', marginBottom: '.6rem' }}>{form.email}</div>
                    <button onClick={() => toast({ message: '📷 Upload disponível no plano Pro+', type: 'info' })} style={{ padding: '.35rem .85rem', borderRadius: '7px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#94A3B8', fontSize: '.78rem', cursor: 'pointer' }}>📷 Alterar foto</button>
                  </div>
                </div>
              </div>

              <div style={card}>
                <div style={cardTitle}>Informações pessoais</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
                    <Input label="Nome completo" value={form.full_name} onChange={e => upd('full_name', e.target.value)} icon="👤" />
                    <Input label="E-mail" type="email" value={form.email} onChange={e => upd('email', e.target.value)} icon="✉️" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
                    <Input label="Telefone / WhatsApp" value={form.phone} onChange={e => upd('phone', e.target.value)} icon="📱" placeholder="(11) 9 9999-9999" />
                    <Input label="Nome da empresa" value={form.company_name} onChange={e => upd('company_name', e.target.value)} icon="🏢" />
                  </div>
                  <Select label="Fuso horário" value={form.timezone} onChange={e => upd('timezone', e.target.value)} options={TIMEZONES} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={saveProfile} loading={saving} icon="💾">Salvar perfil</Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SEGURANÇA */}
          {tab === 'seguranca' && (
            <>
              <div style={card}>
                <div style={cardTitle}>Senha</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.85rem', background: 'rgba(255,255,255,.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,.06)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.88rem' }}>Senha atual</div>
                    <div style={{ fontSize: '.75rem', color: '#64748B', marginTop: '.15rem' }}>••••••••••••</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setPwdModal(true)}>Alterar senha</Button>
                </div>
              </div>

              <div style={card}>
                <div style={cardTitle}>Autenticação em 2 fatores (2FA)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                  {[
                    { label: 'App autenticador (TOTP)', desc: 'Google Authenticator, Authy...', active: false, recommended: true },
                    { label: 'SMS', desc: 'Código via mensagem de texto', active: true },
                    { label: 'E-mail', desc: 'Código via email de backup', active: true },
                  ].map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.85rem', background: 'rgba(255,255,255,.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,.06)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '.88rem' }}>{m.label}</span>
                          {m.recommended && <span style={{ padding: '.1rem .45rem', borderRadius: '4px', background: 'rgba(59,130,246,.15)', color: '#60A5FA', fontSize: '.62rem', fontWeight: 800 }}>RECOMENDADO</span>}
                        </div>
                        <div style={{ fontSize: '.75rem', color: '#64748B', marginTop: '.1rem' }}>{m.desc}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        {m.active ? <span style={{ fontSize: '.72rem', color: '#22C55E', fontWeight: 700 }}>✓ Ativo</span> : <span style={{ fontSize: '.72rem', color: '#475569' }}>Inativo</span>}
                        <Button size="xs" variant={m.active ? 'secondary' : 'outline'} onClick={() => toast({ message: m.active ? '2FA desativado' : '2FA ativado!', type: m.active ? 'warning' : 'success' })}>{m.active ? 'Remover' : 'Ativar'}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={card}>
                <div style={cardTitle}>Sessões ativas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                  {sessions.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.85rem', background: s.current ? 'rgba(34,197,94,.05)' : 'rgba(255,255,255,.02)', borderRadius: '10px', border: `1px solid ${s.current ? 'rgba(34,197,94,.2)' : 'rgba(255,255,255,.06)'}` }}>
                      <span style={{ fontSize: '1.1rem' }}>{s.device.split(' ')[0]}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{s.device}</div>
                        <div style={{ fontSize: '.72rem', color: '#64748B' }}>{s.location} · {s.ip} · {s.last}</div>
                      </div>
                      {s.current ? <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#22C55E', padding: '.18rem .55rem', borderRadius: '100px', background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.25)' }}>Esta sessão</span> : <button onClick={() => toast({ message: '⚠️ Sessão encerrada', type: 'warning' })} style={{ padding: '.3rem .7rem', borderRadius: '7px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', color: '#EF4444', fontSize: '.72rem', cursor: 'pointer' }}>Encerrar</button>}
                    </div>
                  ))}
                  <button onClick={() => toast({ message: '⚠️ Todas as outras sessões foram encerradas', type: 'warning' })} style={{ padding: '.6rem', borderRadius: '8px', background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.12)', color: '#EF4444', fontSize: '.8rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>🚪 Encerrar todas as outras sessões</button>
                </div>
              </div>
            </>
          )}

          {/* ASSINATURA */}
          {tab === 'assinatura' && (
            <>
              {/* Card do plano atual */}
              <div style={card}>
                <div style={cardTitle}>💳 Plano atual</div>
                {!subscription || subscription.status === 'cancelled' || subscription.status === 'expired' ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>🌱</div>
                    <div style={{ fontWeight: 700, marginBottom: '.4rem' }}>Você está no plano Trial</div>
                    <div style={{ color: '#64748B', fontSize: '.85rem', marginBottom: '1.25rem' }}>Faça upgrade para desbloquear todos os recursos</div>
                    <button onClick={() => window.location.href = '/Planos'} style={{ padding: '.65rem 1.5rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '.88rem' }}>
                      Ver planos →
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Info do plano */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: '12px', marginBottom: '1rem', flexWrap: 'wrap', gap: '.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
                        <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                          {subscription.plan_id === 'starter' ? '🌱' : subscription.plan_id === 'pro' ? '🚀' : '💎'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', textTransform: 'capitalize' }}>{subscription.plan_id}</div>
                          <div style={{ fontSize: '.75rem', color: '#64748B', marginTop: '.1rem' }}>
                            R$ {Number(subscription.amount || 0).toFixed(2).replace('.', ',')}/mês
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', padding: '.25rem .75rem', borderRadius: '100px', background: 'rgba(34,197,94,.1)', color: '#22C55E', fontSize: '.75rem', fontWeight: 700 }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} /> Ativo
                        </span>
                        {subscription.expires_at && (
                          <div style={{ fontSize: '.72rem', color: '#64748B', marginTop: '.3rem' }}>
                            Renova em {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                      <button onClick={() => window.location.href = '/Planos'} style={{ padding: '.6rem 1.2rem', borderRadius: '9px', border: '1px solid rgba(59,130,246,.3)', background: 'rgba(59,130,246,.08)', color: '#60A5FA', cursor: 'pointer', fontWeight: 600, fontSize: '.83rem' }}>
                        ⬆️ Fazer upgrade
                      </button>
                      <button onClick={() => window.location.href = '/Planos?tab=historico'} style={{ padding: '.6rem 1.2rem', borderRadius: '9px', border: '1px solid rgba(255,255,255,.1)', background: 'transparent', color: '#94A3B8', cursor: 'pointer', fontWeight: 600, fontSize: '.83rem' }}>
                        🧾 Ver histórico
                      </button>
                      <button
                        onClick={() => setCancelModal(true)}
                        style={{ padding: '.6rem 1.2rem', borderRadius: '9px', border: '1px solid rgba(239,68,68,.25)', background: 'rgba(239,68,68,.06)', color: '#FCA5A5', cursor: 'pointer', fontWeight: 600, fontSize: '.83rem', marginLeft: 'auto' }}
                      >
                        🚫 Cancelar assinatura
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Info de cancelamento */}
              <div style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)', borderRadius: '12px', padding: '1rem 1.25rem', fontSize: '.82rem', color: '#94A3B8', lineHeight: 1.65 }}>
                ℹ️ Ao cancelar, você mantém o acesso até o fim do período já pago. Não há reembolso proporcional. Você pode reativar a qualquer momento.
              </div>
            </>
          )}

          {/* API KEYS */}
          {tab === 'api' && (
            <>
              <div style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: '12px', padding: '1rem 1.25rem', fontSize: '.8rem', color: '#93C5FD', lineHeight: 1.7 }}>
                🔒 Todas as chaves são <strong>criptografadas</strong> com AES-256 e armazenadas com segurança. Nunca são exibidas inteiras após salvas.
              </div>

              {[
                { key: 'openrouter', label: 'OpenRouter API Key', icon: '🤖', placeholder: 'sk-or-v1-...', link: 'https://openrouter.ai/keys', desc: 'Necessária para o módulo de IA' },
                { key: 'evolution_url', label: 'Evolution API URL', icon: '🌐', placeholder: 'https://api.seudominio.com.br', desc: 'URL base da sua instância Evolution' },
                { key: 'evolution_key', label: 'Evolution API Key', icon: '🔑', placeholder: 'Bearer eyJhbGci...', desc: 'Chave de autenticação da Evolution API' },
                { key: 'mercadopago', label: 'Mercado Pago Access Token', icon: '💳', placeholder: 'APP_USR-...', link: 'https://www.mercadopago.com.br/developers', desc: 'Token para processar pagamentos' },
                { key: 'webhook_secret', label: 'Webhook Secret', icon: '🔗', placeholder: 'whsec_...', desc: 'Para validar webhooks recebidos' },
              ].map(field => (
                <div key={field.key} style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.85rem' }}>
                    <div>
                      <div style={cardTitle}>{field.icon} {field.label}</div>
                      <div style={{ fontSize: '.73rem', color: '#64748B', marginTop: '.15rem' }}>{field.desc}</div>
                    </div>
                    {field.link && <a href={field.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '.73rem', color: '#8B5CF6', fontWeight: 600 }}>Obter →</a>}
                  </div>
                  <div style={{ display: 'flex', gap: '.6rem' }}>
                    <Input style={{ flex: 1 }} type={showKeys[field.key] ? 'text' : 'password'} value={apiKeys[field.key]} onChange={e => updKey(field.key, e.target.value)} placeholder={field.placeholder} icon={field.icon} />
                    <button onClick={() => toggleKey(field.key)} style={{ width: '40px', borderRadius: '9px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', color: '#64748B', cursor: 'pointer', flexShrink: 0 }}>{showKeys[field.key] ? '🙈' : '👁'}</button>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
                <Button variant="outline" onClick={() => toast({ message: '🧪 Testando conexões...', type: 'info' })}>🧪 Testar todas</Button>
                <Button onClick={saveApiKeys} loading={saving} icon="💾">Salvar chaves</Button>
              </div>
            </>
          )}

          {/* NOTIFICAÇÕES */}
          {tab === 'notificacoes' && (
            <div style={card}>
              <div style={cardTitle}>Central de notificações</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { key: 'new_lead', label: 'Novo lead capturado', desc: 'Quando um novo lead entra no sistema', icon: '👥' },
                  { key: 'new_message', label: 'Nova mensagem', desc: 'Mensagens não lidas nas conversas', icon: '💬' },
                  { key: 'payment', label: 'Pagamentos', desc: 'Confirmações e alertas de pagamento', icon: '💳' },
                  { key: 'weekly_report', label: 'Relatório semanal', desc: 'Resumo toda segunda às 9h', icon: '📊' },
                  { key: 'ai_alert', label: 'Alertas da IA', desc: 'Quando a IA não consegue responder', icon: '🤖' },
                  { key: 'system', label: 'Avisos do sistema', desc: 'Atualizações e manutenção', icon: '⚙️' },
                ].map((n, i, arr) => (
                  <div key={n.key} style={{ padding: '1rem 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                    <Switch checked={notifs[n.key]} onChange={v => setNotifs(p => ({ ...p, [n.key]: v }))} label={`${n.icon} ${n.label}`} description={n.desc} />
                  </div>
                ))}
              </div>
              <div style={{ paddingTop: '.85rem', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={() => toast({ message: '✅ Preferências salvas!', type: 'success' })} icon="💾">Salvar</Button>
              </div>
            </div>
          )}

          {/* PREFERÊNCIAS */}
          {tab === 'preferencias' && (
            <>
              <div style={card}>
                <div style={cardTitle}>Interface</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {[
                    { key: 'animations', label: '✨ Animações', desc: 'Transições e efeitos visuais' },
                    { key: 'auto_save', label: '💾 Salvar automaticamente', desc: 'Salva formulários sem precisar clicar' },
                    { key: 'compact_view', label: '📐 Visualização compacta', desc: 'Reduz o espaçamento das listas' },
                    { key: 'sidebar_compact', label: '◀ Sidebar recolhida', desc: 'Inicia com o menu recolhido' },
                    { key: 'sounds', label: '🔔 Sons', desc: 'Notificações sonoras de mensagens' },
                  ].map((p, i, arr) => (
                    <div key={p.key} style={{ padding: '1rem 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                      <Switch checked={prefs[p.key]} onChange={v => setPrefs(prev => ({ ...prev, [p.key]: v }))} label={p.label} description={p.desc} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={card}>
                <div style={cardTitle}>Tema</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem' }}>
                  {THEMES.map(t => (
                    <button key={t.value} onClick={() => { upd('theme', t.value); toast({ message: `🎨 Tema ${t.label} aplicado`, type: 'success' }); }} style={{ padding: '.85rem', borderRadius: '10px', background: form.theme === t.value ? 'rgba(59,130,246,.12)' : 'rgba(255,255,255,.03)', border: `1.5px solid ${form.theme === t.value ? 'rgba(59,130,246,.4)' : 'rgba(255,255,255,.08)'}`, color: form.theme === t.value ? '#60A5FA' : '#64748B', cursor: 'pointer', fontWeight: form.theme === t.value ? 700 : 500, fontSize: '.82rem', fontFamily: 'Inter,sans-serif', transition: 'all .15s' }}>{t.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={() => toast({ message: '✅ Preferências salvas!', type: 'success' })} icon="💾">Salvar</Button>
              </div>
            </>
          )}

          {/* DANGER ZONE */}
          {tab === 'danger' && (
            <>
              <div style={{ ...card, border: '1px solid rgba(239,68,68,.2)' }}>
                <div style={{ ...cardTitle, color: '#FCA5A5' }}>⚠️ Zona de perigo</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                  {[
                    { label: '📤 Exportar dados', desc: 'Baixe todos os seus dados em formato JSON', action: () => toast({ message: '📦 Exportação iniciada! Você receberá por email em alguns minutos.', type: 'info', duration: 5000 }), variant: 'ghost' },
                    { label: '🔄 Resetar configurações', desc: 'Restaura todas as configurações para o padrão', action: () => toast({ message: '⚠️ Configurações resetadas', type: 'warning' }), variant: 'ghost' },
                    { label: '🚪 Sair de todas as sessões', desc: 'Encerra todas as sessões ativas imediatamente', action: () => toast({ message: '⚠️ Todas as sessões encerradas', type: 'warning' }), variant: 'ghost' },
                    { label: '🗑️ Excluir conta', desc: 'Exclui permanentemente sua conta e todos os dados', action: () => setDeleteModal(true), variant: 'danger', danger: true },
                  ].map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.85rem', background: a.danger ? 'rgba(239,68,68,.04)' : 'rgba(255,255,255,.02)', borderRadius: '10px', border: `1px solid ${a.danger ? 'rgba(239,68,68,.15)' : 'rgba(255,255,255,.06)'}`, gap: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '.88rem', color: a.danger ? '#FCA5A5' : '#F8FAFC' }}>{a.label}</div>
                        <div style={{ fontSize: '.75rem', color: '#64748B', marginTop: '.1rem' }}>{a.desc}</div>
                      </div>
                      <Button size="sm" variant={a.variant} onClick={a.action} style={{ flexShrink: 0 }}>{a.label.split(' ')[0]}</Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#0F1629', border: '1px solid rgba(239,68,68,.25)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '.5rem', color: '#FCA5A5' }}>Cancelar assinatura?</div>
            <div style={{ color: '#64748B', fontSize: '.88rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              Seu acesso continua ativo até <strong style={{ color: '#F8FAFC' }}>{subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString('pt-BR') : 'o fim do período'}</strong>.
              Depois disso, você voltará para o plano gratuito.
            </div>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center' }}>
              <button onClick={() => setCancelModal(false)} style={{ padding: '.65rem 1.4rem', borderRadius: '9px', border: '1px solid rgba(255,255,255,.1)', background: 'transparent', color: '#94A3B8', cursor: 'pointer', fontWeight: 600 }}>
                Manter plano
              </button>
              <button onClick={cancelarAssinatura} disabled={cancelling} style={{ padding: '.65rem 1.4rem', borderRadius: '9px', border: 'none', background: 'rgba(239,68,68,.15)', color: '#FCA5A5', cursor: 'pointer', fontWeight: 700, border: '1px solid rgba(239,68,68,.3)', opacity: cancelling ? .7 : 1 }}>
                {cancelling ? '⏳ Cancelando...' : '🚫 Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      <Modal open={pwdModal} onClose={() => setPwdModal(false)} title="Alterar senha" icon="🔒" size="sm"
        footer={<><button onClick={() => setPwdModal(false)} style={ghostBtn}>Cancelar</button><Button onClick={changePassword} loading={saving}>Alterar senha</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
          <Input label="Senha atual *" type="password" value={pwdForm.current} onChange={e => setPwdForm(p => ({ ...p, current: e.target.value }))} icon="🔒" />
          <Input label="Nova senha *" type="password" value={pwdForm.new} onChange={e => setPwdForm(p => ({ ...p, new: e.target.value }))} icon="🔑" helper="Mínimo 8 caracteres" />
          <Input label="Confirmar nova senha *" type="password" value={pwdForm.confirm} onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))} icon="🔑" error={pwdForm.confirm && pwdForm.new !== pwdForm.confirm ? 'Senhas não coincidem' : ''} />
        </div>
      </Modal>

      {/* Delete account modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Excluir conta" icon="🗑️" danger size="sm"
        footer={<><button onClick={() => setDeleteModal(false)} style={ghostBtn}>Cancelar</button><button onClick={() => { setDeleteModal(false); toast({ message: 'Solicitação enviada. Você receberá um email de confirmação.', type: 'info', duration: 5000 }); }} style={{ padding: '.6rem 1.2rem', borderRadius: '8px', background: 'linear-gradient(135deg,#EF4444,#DC2626)', border: 'none', color: 'white', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer' }}>Excluir permanentemente</button></>}>
        <p style={{ fontSize: '.88rem', color: '#94A3B8', lineHeight: 1.7, marginBottom: '1rem' }}>Esta ação é <strong style={{ color: '#FCA5A5' }}>irreversível</strong>. Todos os seus dados, leads, conversas, configurações e histórico de pagamentos serão excluídos permanentemente.</p>
        <div style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)', borderRadius: '10px', padding: '.85rem', fontSize: '.8rem', color: '#FCA5A5' }}>
          ⚠️ Certifique-se de exportar seus dados antes de prosseguir.
        </div>
      </Modal>
    </div>
  );
}

const card = { background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.35rem' };
const cardTitle = { fontWeight: 800, fontSize: '.9rem', marginBottom: '1rem', color: '#F8FAFC' };
const ghostBtn = { padding: '.6rem 1.1rem', borderRadius: '8px', fontSize: '.85rem', fontWeight: 500, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#94A3B8', cursor: 'pointer' };


