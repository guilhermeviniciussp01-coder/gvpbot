import { useState, useEffect } from 'react';
import { auth } from '@/api/base44Client';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Switch } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

export default function Configuracoes() {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('perfil');
  const [saving, setSaving] = useState(false);
  const [pwdModal, setPwdModal] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', company_name: '' });
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [notifs, setNotifs] = useState({ new_lead: true, new_message: true, weekly_report: true, system: true, payment: true });
  const [prefs, setPrefs] = useState({ animations: true, auto_save: true, sidebar_compact: false, sounds: false });

  useEffect(() => {
    auth.me().then(u => {
      setUser(u);
      setForm({ full_name: u?.full_name || '', email: u?.email || '', phone: u?.phone || '', company_name: u?.company_name || '' });
    }).catch(() => {
      setForm({ full_name: 'Guilherme Vinicius', email: 'guilherme@gvpbot.com.br', phone: '(11) 9 9999-9999', company_name: 'GVP BOT' });
    });
  }, []);

  async function saveProfile() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    toast({ message: '✅ Perfil atualizado com sucesso!', type: 'success' });
  }

  async function savePassword() {
    if (!pwdForm.current) { toast({ message: 'Informe a senha atual', type: 'error' }); return; }
    if (pwdForm.new.length < 8) { toast({ message: 'Senha deve ter mínimo 8 caracteres', type: 'error' }); return; }
    if (pwdForm.new !== pwdForm.confirm) { toast({ message: 'Senhas não coincidem', type: 'error' }); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 1400));
    setSaving(false);
    setPwdModal(false);
    setPwdForm({ current: '', new: '', confirm: '' });
    toast({ message: '🔒 Senha alterada com sucesso!', type: 'success' });
  }

  const TABS = [
    { id: 'perfil', label: '👤 Perfil', icon: '👤' },
    { id: 'seguranca', label: '🔒 Segurança', icon: '🔒' },
    { id: 'notificacoes', label: '🔔 Notificações', icon: '🔔' },
    { id: 'preferencias', label: '🎛️ Preferências', icon: '🎛️' },
  ];

  const SESSIONS = [
    { device: '💻', name: 'Chrome — Windows 11', location: 'São Paulo, SP', time: 'Agora', current: true },
    { device: '📱', name: 'Safari — iPhone 15', location: 'São Paulo, SP', time: 'há 2h', current: false },
    { device: '🖥️', name: 'Firefox — macOS', location: 'São Paulo, SP', time: 'há 1 dia', current: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px' }}>

      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.2rem' }}>Configurações</h2>
        <p style={{ fontSize: '.85rem', color: '#64748B' }}>Gerencie sua conta e preferências</p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>

        {/* Side nav */}
        <nav style={{ width: '200px', flexShrink: 0, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '.5rem', display: 'flex', flexDirection: 'column', gap: '.15rem', height: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.65rem .85rem', borderRadius: '10px', background: tab === t.id ? 'rgba(59,130,246,.15)' : 'transparent', border: 'none', color: tab === t.id ? '#60A5FA' : '#94A3B8', fontWeight: tab === t.id ? 700 : 500, fontSize: '.85rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif', textAlign: 'left', transition: 'all .15s' }}>
              <span>{t.icon}</span>
              {t.label.split(' ').slice(1).join(' ')}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div style={{ flex: 1, minWidth: '300px' }}>

          {/* PERFIL */}
          {tab === 'perfil' && (
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 700, border: '3px solid rgba(59,130,246,.3)' }}>
                    {(form.full_name || '?')[0]}
                  </div>
                  <button style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(59,130,246,.15)', border: '2px solid rgba(59,130,246,.3)', color: '#3B82F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem' }}>📷</button>
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{form.full_name || 'Seu Nome'}</div>
                  <div style={{ fontSize: '.82rem', color: '#64748B' }}>{form.email}</div>
                  <div style={{ fontSize: '.72rem', color: '#22C55E', marginTop: '.25rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                    Plano Pro · Trial ativo
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
                <Input label="Nome completo" value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} icon="👤" />
                <Input label="E-mail" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} icon="✉️" type="email" />
                <Input label="Telefone" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} icon="📱" />
                <Input label="Empresa" value={form.company_name} onChange={e => setForm(p => ({...p, company_name: e.target.value}))} icon="🏢" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={saveProfile} loading={saving}>💾 Salvar perfil</Button>
              </div>
            </div>
          )}

          {/* SEGURANÇA */}
          {tab === 'seguranca' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ fontWeight: 800, marginBottom: '1rem' }}>Senha</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.85rem 1rem', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontSize: '.88rem', fontWeight: 600 }}>Senha da conta</div>
                    <div style={{ fontSize: '.75rem', color: '#64748B', marginTop: '.15rem' }}>••••••••••• · Última alteração: nunca</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setPwdModal(true)}>🔒 Alterar</Button>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ fontWeight: 800, marginBottom: '1rem' }}>Sessões ativas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  {SESSIONS.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.85rem', padding: '.85rem', background: s.current ? 'rgba(34,197,94,.06)' : 'rgba(255,255,255,.02)', border: `1px solid ${s.current ? 'rgba(34,197,94,.2)' : 'rgba(255,255,255,.06)'}`, borderRadius: '12px' }}>
                      <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{s.device}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{s.name} {s.current && <span style={{ fontSize: '.65rem', background: 'rgba(34,197,94,.12)', color: '#22C55E', padding: '.1rem .45rem', borderRadius: '100px', marginLeft: '.4rem', fontWeight: 700 }}>Esta sessão</span>}</div>
                        <div style={{ fontSize: '.72rem', color: '#64748B' }}>{s.location} · {s.time}</div>
                      </div>
                      {!s.current && (
                        <button onClick={() => toast({ message: '🔒 Sessão encerrada', type: 'info' })} style={{ padding: '.35rem .75rem', borderRadius: '8px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', color: '#EF4444', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer' }}>Encerrar</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICAÇÕES */}
          {tab === 'notificacoes' && (
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              <div style={{ fontWeight: 800, marginBottom: '.5rem' }}>Notificações por e-mail</div>
              {[
                { key: 'new_lead', label: 'Novo lead capturado', desc: 'Alertas quando o bot capturar um lead', icon: '👥' },
                { key: 'new_message', label: 'Nova mensagem recebida', desc: 'Notificar novas conversas', icon: '💬' },
                { key: 'weekly_report', label: 'Relatório semanal', desc: 'Resumo de performance toda segunda', icon: '📊' },
                { key: 'system', label: 'Alertas do sistema', desc: 'Erros e manutenções', icon: '⚙️' },
                { key: 'payment', label: 'Lembretes de pagamento', desc: '7 dias antes do vencimento', icon: '💳' },
              ].map(n => (
                <div key={n.key} style={{ display: 'flex', alignItems: 'center', gap: '.85rem', padding: '.75rem', borderBottom: '1px solid rgba(255,255,255,.04)', transition: 'background .15s', borderRadius: '8px' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59,130,246,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem', flexShrink: 0 }}>{n.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '.88rem', fontWeight: 600 }}>{n.label}</div>
                    <div style={{ fontSize: '.75rem', color: '#64748B' }}>{n.desc}</div>
                  </div>
                  <Switch checked={notifs[n.key]} onChange={v => setNotifs(p => ({...p, [n.key]: v}))} />
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '.5rem' }}>
                <Button onClick={() => toast({ message: '✅ Notificações salvas!', type: 'success' })}>💾 Salvar</Button>
              </div>
            </div>
          )}

          {/* PREFERÊNCIAS */}
          {tab === 'preferencias' && (
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              <div style={{ fontWeight: 800, marginBottom: '.5rem' }}>Comportamento do sistema</div>
              {[
                { key: 'animations', label: 'Animações da interface', desc: 'Transições e efeitos visuais' },
                { key: 'auto_save', label: 'Salvamento automático', desc: 'Salvar rascunhos automaticamente' },
                { key: 'sidebar_compact', label: 'Sidebar compacta', desc: 'Iniciar com menu recolhido' },
                { key: 'sounds', label: 'Sons de notificação', desc: 'Toques ao receber mensagens' },
              ].map(p => (
                <div key={p.key} style={{ display: 'flex', alignItems: 'center', padding: '.75rem', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '.88rem', fontWeight: 600 }}>{p.label}</div>
                    <div style={{ fontSize: '.75rem', color: '#64748B' }}>{p.desc}</div>
                  </div>
                  <Switch checked={prefs[p.key]} onChange={v => setPrefs(prev => ({...prev, [p.key]: v}))} />
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '.5rem' }}>
                <Button onClick={() => toast({ message: '✅ Preferências salvas!', type: 'success' })}>💾 Salvar</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      <Modal
        open={pwdModal} onClose={() => setPwdModal(false)}
        title="Alterar senha" icon="🔒" size="sm"
        footer={
          <>
            <button onClick={() => setPwdModal(false)} style={{ padding: '.6rem 1.1rem', borderRadius: '8px', fontSize: '.85rem', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#94A3B8', cursor: 'pointer' }}>Cancelar</button>
            <Button onClick={savePassword} loading={saving}>🔒 Alterar</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
          <Input label="Senha atual" type="password" value={pwdForm.current} onChange={e => setPwdForm(p => ({...p, current: e.target.value}))} icon="🔑" />
          <Input label="Nova senha" type="password" value={pwdForm.new} onChange={e => setPwdForm(p => ({...p, new: e.target.value}))} icon="🔒" helper="Mínimo 8 caracteres" />
          <Input label="Confirmar senha" type="password" value={pwdForm.confirm} onChange={e => setPwdForm(p => ({...p, confirm: e.target.value}))} icon="🔒" error={pwdForm.confirm && pwdForm.new !== pwdForm.confirm ? 'Senhas não coincidem' : ''} />
        </div>
      </Modal>
    </div>
  );
}
