import { useState, useEffect, useRef } from 'react';
import { supabase, getUserConfig, saveUserConfig, callAIProxy } from '@/api/supabaseClient';
import { useToast, addNotification } from '@/components/ui/Toast';

const FREE_MODELS = [
  { value: 'mistralai/mistral-7b-instruct:free',        label: '⚡ Mistral 7B (Gratuito)', free: true },
  { value: 'meta-llama/llama-3-8b-instruct:free',       label: '🦙 Llama 3 8B (Gratuito)', free: true },
  { value: 'microsoft/phi-3-mini-128k-instruct:free',   label: '🔬 Phi-3 Mini (Gratuito)', free: true },
  { value: 'google/gemma-3-1b-it:free',                  label: '💎 Gemma 3 (Gratuito)',  free: true },
];
const PAID_MODELS = [
  { value: 'openai/gpt-4o',                       label: '🏆 GPT-4o (Pago)',            free: false },
  { value: 'openai/gpt-4o-mini',                  label: '⚡ GPT-4o Mini (Pago)',       free: false },
  { value: 'anthropic/claude-3.5-sonnet',         label: '🎭 Claude 3.5 Sonnet (Pago)', free: false },
  { value: 'meta-llama/llama-3.1-70b-instruct',   label: '🦙 Llama 3.1 70B (Pago)',     free: false },
];
const ALL_MODELS = [...FREE_MODELS, ...PAID_MODELS];

const DEFAULT_PROMPT = `Você é um atendente profissional brasileiro especializado em vendas e suporte via WhatsApp. Seja cordial, objetivo e ajude o cliente a encontrar a melhor solução. Use emojis com moderação. Nunca mencione que é uma IA. Responda sempre em português do Brasil.`;

/* ── Mini bar chart ── */
function MiniBar({ value, max, color = '#3B82F6' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .4s' }} />
    </div>
  );
}

export default function IA() {
  const toast = useToast();
  const [tab, setTab]           = useState('config');
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState(false);
  const [showKey, setShowKey]   = useState(false);
  const [config, setConfig]     = useState({
    openrouter_key: '',
    ai_model: 'mistralai/mistral-7b-instruct:free',
    system_prompt: DEFAULT_PROMPT,
    ai_enabled: true,
    temperature: 0.7,
  });
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! 😊 Sou o bot do GVP BOT. Como posso te ajudar hoje?' }
  ]);
  const [input, setInput]       = useState('');

  // Stats
  const [usageLogs, setUsageLogs]       = useState([]);
  const [messageLogs, setMessageLogs]   = useState([]);
  const [instances, setInstances]       = useState([]);
  const [instLoading, setInstLoading]   = useState(false);

  const chatRef = useRef(null);

  useEffect(() => { loadConfig(); loadStats(); loadInstances(); }, []);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  async function loadConfig() {
    try {
      const cfg = await getUserConfig();
      if (cfg) {
        setConfig(p => ({
          ...p,
          openrouter_key: cfg.openrouter_key_display || cfg.openrouter_key || '',
          ai_model: cfg.ai_model || p.ai_model,
          system_prompt: cfg.system_prompt || p.system_prompt,
          ai_enabled: cfg.ai_enabled !== undefined ? cfg.ai_enabled : true,
          temperature: cfg.temperature || 0.7,
        }));
      }
    } catch (err) { console.error(err); }
  }

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // últimos 7 dias de uso de tokens
      const since = new Date(); since.setDate(since.getDate() - 6);
      const { data: ul } = await supabase.from('ai_usage_logs')
        .select('created_at, tokens_used, model')
        .eq('user_id', user.id)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true });
      setUsageLogs(ul || []);

      // logs de mensagens dos últimos 7 dias
      const { data: ml } = await supabase.from('message_logs')
        .select('created_at, status')
        .eq('user_id', user.id)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true });
      setMessageLogs(ml || []);
    } catch (err) { console.error(err); }
  }

  async function loadInstances() {
    setInstLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('whatsapp_instances').select('id, name, status, ai_enabled').eq('user_id', user.id);
      setInstances(data || []);
    } catch (err) { console.error(err); }
    finally { setInstLoading(false); }
  }

  async function toggleInstanceAI(instId, current) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('whatsapp_instances').update({ ai_enabled: !current }).eq('id', instId).eq('user_id', user.id);
      setInstances(p => p.map(i => i.id === instId ? { ...i, ai_enabled: !current } : i));
      toast({ message: !current ? '🤖 IA ativada para esta instância!' : '⏸ IA desativada', type: 'success' });
    } catch (err) { toast({ message: `❌ ${err.message}`, type: 'error' }); }
  }

  async function saveConfig() {
    setSaving(true);
    try {
      await saveUserConfig({
        openrouter_key: config.openrouter_key,
        ai_model: config.ai_model,
        system_prompt: config.system_prompt,
        ai_enabled: config.ai_enabled,
        temperature: config.temperature,
      });
      toast({ message: '✅ Configurações de IA salvas!', type: 'success' });
      addNotification({ icon: '🤖', title: 'IA configurada', body: `Modelo: ${config.ai_model.split('/').pop()}`, type: 'success' });
    } catch (err) {
      toast({ message: `❌ Erro: ${err.message}`, type: 'error' });
    } finally { setSaving(false); }
  }

  async function sendMessage() {
    if (!input.trim()) return;
    if (!config.openrouter_key) { toast({ message: '⚠️ Configure sua API Key do OpenRouter primeiro', type: 'warning' }); return; }
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setTesting(true);
    try {
      const data = await callAIProxy({
        messages: [
          { role: 'system', content: config.system_prompt },
          ...messages.filter(m => m.role !== 'system').slice(-6),
          userMsg,
        ],
        model: config.ai_model,
        temperature: config.temperature,
        max_tokens: 500,
      });
      const reply = data.choices?.[0]?.message?.content || 'Sem resposta';
      setMessages(p => [...p, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(p => [...p, { role: 'assistant', content: `❌ Erro: ${err.message}` }]);
    } finally { setTesting(false); }
  }

  // ── Preparar dados do gráfico (7 dias) ──
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const tokensByDay = days.map(day => ({
    day: day.slice(5),
    tokens: usageLogs.filter(l => l.created_at.slice(0, 10) === day).reduce((s, l) => s + (l.tokens_used || 0), 0),
  }));
  const msgByDay = days.map(day => ({
    day: day.slice(5),
    replied: messageLogs.filter(l => l.created_at.slice(0, 10) === day && l.status === 'replied').length,
    received: messageLogs.filter(l => l.created_at.slice(0, 10) === day).length,
  }));
  const maxTokens = Math.max(...tokensByDay.map(d => d.tokens), 1);
  const maxMsgs   = Math.max(...msgByDay.map(d => d.received), 1);
  const totalTokens7d = tokensByDay.reduce((s, d) => s + d.tokens, 0);
  const totalMsgs7d   = msgByDay.reduce((s, d) => s + d.received, 0);
  const totalReplied7d = msgByDay.reduce((s, d) => s + d.replied, 0);

  const upd = (k, v) => setConfig(p => ({ ...p, [k]: v }));
  const cardBg = 'rgba(255,255,255,.03)';
  const border = 'rgba(255,255,255,.08)';
  const inp = { width: '100%', padding: '.65rem .9rem', borderRadius: '8px', background: 'rgba(255,255,255,.05)', border: `1px solid ${border}`, color: '#F8FAFC', fontSize: '.85rem', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'Inter,sans-serif', color: '#F8FAFC' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '.25rem' }}>🤖 Inteligência Artificial</h1>
        <p style={{ color: '#64748B', fontSize: '.88rem' }}>Configure o OpenRouter, veja o uso e teste respostas automáticas</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.75rem', borderBottom: `1px solid ${border}`, paddingBottom: '.75rem' }}>
        {[
          { id: 'config',     label: '⚙️ Configurações' },
          { id: 'stats',      label: '📊 Uso & Gráficos' },
          { id: 'instances',  label: '📱 IA por Instância' },
          { id: 'playground', label: '🧪 Playground' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '.5rem 1.1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: tab === t.id ? 700 : 500, fontSize: '.85rem', background: tab === t.id ? 'rgba(59,130,246,.15)' : 'transparent', color: tab === t.id ? '#60A5FA' : '#64748B' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONFIG ── */}
      {tab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '1rem' }}>🔑 API Key OpenRouter</div>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inp, paddingRight: '2.5rem' }} type={showKey ? 'text' : 'password'} value={config.openrouter_key} onChange={e => upd('openrouter_key', e.target.value)} placeholder="sk-or-v1-..." />
              <button onClick={() => setShowKey(p => !p)} style={{ position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>{showKey ? '🙈' : '👁️'}</button>
            </div>
            <div style={{ marginTop: '.6rem', fontSize: '.78rem', color: '#64748B', display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <span>Não tem conta? <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: '#60A5FA' }}>openrouter.ai/keys →</a></span>
              <span style={{ color: '#4ADE80' }}>✓ Modelos gratuitos disponíveis</span>
            </div>
          </div>

          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '1rem' }}>🧠 Modelo de IA</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: '.75rem' }}>
              {ALL_MODELS.map(model => (
                <div key={model.value} onClick={() => upd('ai_model', model.value)} style={{ padding: '.85rem 1rem', borderRadius: '10px', cursor: 'pointer', border: `1px solid ${config.ai_model === model.value ? (model.free ? 'rgba(34,197,94,.4)' : 'rgba(59,130,246,.4)') : border}`, background: config.ai_model === model.value ? (model.free ? 'rgba(34,197,94,.08)' : 'rgba(59,130,246,.08)') : 'rgba(255,255,255,.02)', transition: 'all .15s' }}>
                  <div style={{ fontWeight: 600, fontSize: '.82rem', marginBottom: '.2rem' }}>{model.label}</div>
                  <div style={{ fontSize: '.7rem', color: model.free ? '#4ADE80' : '#94A3B8' }}>{model.free ? '✓ Gratuito' : '💳 Pago'}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '1rem' }}>📝 Prompt do sistema</div>
            <textarea style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} rows={5} value={config.system_prompt} onChange={e => upd('system_prompt', e.target.value)} />
          </div>

          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '1rem' }}>🎛️ Temperatura: <span style={{ color: '#60A5FA' }}>{config.temperature}</span></div>
            <input type="range" min="0" max="1" step="0.1" value={config.temperature} onChange={e => upd('temperature', parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#3B82F6' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: '#475569', marginTop: '.4rem' }}>
              <span>0 — Preciso</span><span>0.5 — Balanceado</span><span>1 — Criativo</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', padding: '1.25rem 1.5rem' }}>
            <div>
              <div style={{ fontWeight: 700 }}>🤖 IA ativa globalmente</div>
              <div style={{ fontSize: '.78rem', color: '#64748B', marginTop: '.2rem' }}>Responder mensagens automaticamente no WhatsApp</div>
            </div>
            <div onClick={() => upd('ai_enabled', !config.ai_enabled)} style={{ width: 44, height: 24, borderRadius: 12, background: config.ai_enabled ? '#3B82F6' : 'rgba(255,255,255,.1)', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: config.ai_enabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }} />
            </div>
          </div>

          <button onClick={saveConfig} disabled={saving} style={{ padding: '.8rem', borderRadius: '10px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', border: 'none', color: 'white', fontWeight: 800, fontSize: '.9rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1 }}>
            {saving ? '⏳ Salvando...' : '💾 Salvar Configurações'}
          </button>
        </div>
      )}

      {/* ── TAB STATS ── */}
      {tab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Cards de resumo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
            {[
              { label: 'Tokens usados (7d)', value: totalTokens7d.toLocaleString('pt-BR'), icon: '⚡', color: '#F59E0B' },
              { label: 'Mensagens recebidas (7d)', value: totalMsgs7d, icon: '💬', color: '#60A5FA' },
              { label: 'Respondidas pela IA (7d)', value: totalReplied7d, icon: '🤖', color: '#4ADE80' },
            ].map(s => (
              <div key={s.label} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '.35rem' }}>{s.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '.72rem', color: '#64748B', marginTop: '.15rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Gráfico de tokens por dia */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '1.25rem' }}>⚡ Tokens por dia (últimos 7 dias)</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.5rem', height: 100 }}>
              {tokensByDay.map(d => {
                const h = maxTokens > 0 ? Math.max(4, (d.tokens / maxTokens) * 90) : 4;
                return (
                  <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.35rem' }}>
                    <span style={{ fontSize: '.65rem', color: '#475569' }}>{d.tokens > 0 ? d.tokens.toLocaleString() : ''}</span>
                    <div style={{ width: '100%', height: h, background: d.tokens > 0 ? 'linear-gradient(180deg,#F59E0B,#D97706)' : 'rgba(255,255,255,.06)', borderRadius: '4px 4px 2px 2px', transition: 'height .4s' }} title={`${d.tokens} tokens`} />
                    <span style={{ fontSize: '.65rem', color: '#475569' }}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfico de mensagens respondidas */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '1.25rem' }}>📨 Mensagens recebidas vs respondidas (7 dias)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              {msgByDay.map(d => (
                <div key={d.day} style={{ display: 'grid', gridTemplateColumns: '55px 1fr 1fr 40px', gap: '.75rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '.72rem', color: '#64748B' }}>{d.day}</span>
                  <div>
                    <MiniBar value={d.received} max={maxMsgs} color="#3B82F6" />
                    <span style={{ fontSize: '.65rem', color: '#475569' }}>{d.received} recebidas</span>
                  </div>
                  <div>
                    <MiniBar value={d.replied} max={maxMsgs} color="#22C55E" />
                    <span style={{ fontSize: '.65rem', color: '#475569' }}>{d.replied} respondidas</span>
                  </div>
                  <span style={{ fontSize: '.7rem', color: d.received > 0 ? '#4ADE80' : '#475569', textAlign: 'right' }}>
                    {d.received > 0 ? Math.round((d.replied / d.received) * 100) + '%' : '—'}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem', paddingTop: '.75rem', borderTop: `1px solid ${border}` }}>
              {[{ color: '#3B82F6', label: 'Recebidas' }, { color: '#22C55E', label: 'Respondidas pela IA' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.75rem', color: '#94A3B8' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB INSTÂNCIAS ── */}
      {tab === 'instances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
          <div style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: '10px', padding: '.85rem 1rem', fontSize: '.82rem', color: '#93C5FD' }}>
            💡 Aqui você controla a IA individualmente por instância WhatsApp. O toggle global na aba Configurações também precisa estar ativo.
          </div>
          {instLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Carregando instâncias...</div>
          ) : instances.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📱</div>
              Nenhuma instância WhatsApp conectada ainda.<br />
              <span style={{ fontSize: '.8rem' }}>Vá em WhatsApp → Nova Instância</span>
            </div>
          ) : (
            instances.map(inst => (
              <div key={inst.id} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '10px', background: inst.status === 'connected' ? 'rgba(34,197,94,.12)' : 'rgba(100,116,139,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📱</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{inst.name}</div>
                    <div style={{ fontSize: '.72rem', color: inst.status === 'connected' ? '#4ADE80' : '#64748B', marginTop: '.1rem' }}>
                      {inst.status === 'connected' ? '● Conectado' : '○ Desconectado'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <span style={{ fontSize: '.78rem', color: inst.ai_enabled ? '#60A5FA' : '#475569' }}>
                    {inst.ai_enabled ? '🤖 IA ativa' : '⏸ IA pausada'}
                  </span>
                  <div onClick={() => toggleInstanceAI(inst.id, inst.ai_enabled)} style={{ width: 44, height: 24, borderRadius: 12, background: inst.ai_enabled ? '#3B82F6' : 'rgba(255,255,255,.1)', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: inst.ai_enabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB PLAYGROUND ── */}
      {tab === 'playground' && (
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', overflow: 'hidden' }}>
          <div ref={chatRef} style={{ height: 360, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '75%', padding: '.65rem 1rem', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'rgba(255,255,255,.06)', fontSize: '.85rem', lineHeight: 1.55, color: '#F8FAFC' }}>
                  {m.content}
                </div>
              </div>
            ))}
            {testing && (
              <div style={{ display: 'flex', gap: '.4rem', padding: '.65rem 1rem', background: 'rgba(255,255,255,.06)', borderRadius: '12px 12px 12px 2px', width: 60 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#64748B', animation: `bounce ${.6+i*.15}s infinite` }} />)}
              </div>
            )}
          </div>
          <div style={{ borderTop: `1px solid ${border}`, padding: '1rem', display: 'flex', gap: '.75rem' }}>
            <input
              style={{ flex: 1, padding: '.65rem .9rem', borderRadius: '8px', background: 'rgba(255,255,255,.05)', border: `1px solid ${border}`, color: '#F8FAFC', fontSize: '.85rem', outline: 'none' }}
              placeholder="Digite uma mensagem de teste..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            />
            <button onClick={sendMessage} disabled={testing || !input.trim()} style={{ padding: '.65rem 1.2rem', borderRadius: '8px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', border: 'none', color: 'white', fontWeight: 700, cursor: testing ? 'not-allowed' : 'pointer', opacity: testing ? .7 : 1, fontSize: '.85rem' }}>
              {testing ? '⏳' : '→ Enviar'}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} } @keyframes spin { to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
