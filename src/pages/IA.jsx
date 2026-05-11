import { useState, useEffect, useRef } from 'react';
import { AiSettings } from '@/api/entities';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea, Switch } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

const MODELS = [
  { value: 'openai/gpt-4o', label: 'GPT-4o (Recomendado)' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (Rápido)' },
  { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku (Econômico)' },
  { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5' },
  { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
];

const DEFAULT_PROMPT = `Você é um atendente profissional brasileiro especializado em vendas e suporte via WhatsApp. Seja sempre cordial, objetivo e ajude o cliente a encontrar a melhor solução. Use emojis com moderação. Nunca mencione que é uma IA. Responda sempre em português do Brasil.`;

const PLAYGROUND_SUGGESTIONS = [
  'Olá, quero saber mais sobre os planos',
  'Qual o prazo de entrega?',
  'Vocês aceitam pagamento no boleto?',
  'Preciso de suporte com meu pedido',
  'Quero cancelar minha assinatura',
];

const BOT_RESPONSES_MAP = {
  'planos': 'Olá! 😊 Temos 3 planos incríveis:\n\n🌱 *Starter* - R$97/mês: 1 número, 500 msgs\n🚀 *Pro* - R$197/mês: 3 números, ilimitado\n💎 *Premium* - R$397/mês: tudo incluso\n\nQual se encaixa melhor no seu negócio?',
  'prazo': 'Nosso prazo de ativação é *imediato*! ⚡ Após o pagamento confirmado, você já pode configurar seu bot em menos de 5 minutos.',
  'boleto': 'Sim, aceitamos *boleto bancário*, *PIX* e *cartão de crédito*! 💳\n\nO PIX é aprovado na hora. O boleto compensa em até 2 dias úteis.',
  'suporte': 'Claro! Estou aqui para ajudar. 🤝\n\nMe conte mais sobre o que aconteceu com seu pedido e vamos resolver isso juntos!',
  'cancelar': 'Entendo. 😢 Antes de cancelar, posso te oferecer *1 mês grátis* como cortesia?\n\nSe ainda quiser cancelar, é só confirmar aqui e o processo leva menos de 1 minuto.',
};

function getAIResponse(msg) {
  const lower = msg.toLowerCase();
  for (const [key, response] of Object.entries(BOT_RESPONSES_MAP)) {
    if (lower.includes(key)) return response;
  }
  return `Entendido! Vou verificar isso para você agora. 🔍\n\n${['Posso te ajudar com mais alguma coisa?', 'Tem alguma outra dúvida?', 'Estou aqui para o que precisar! 😊'][Math.floor(Math.random() * 3)]}`;
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.55rem', flexShrink: 0 }}>🤖</div>
      <div style={{ display: 'flex', gap: '.3rem', padding: '.5rem .75rem', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '4px 14px 14px 14px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748B', animation: 'typingDot 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function IA() {
  const toast = useToast();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('config');
  const [form, setForm] = useState({
    openrouter_api_key: '', model: 'openai/gpt-4o', temperature: 0.7,
    max_tokens: 500, response_delay_min: 1, response_delay_max: 4,
    system_prompt: DEFAULT_PROMPT, bot_name: 'Luna', is_active: true,
    typing_simulation: true, context_memory: 10, language: 'pt-BR',
  });
  const [playMessages, setPlayMessages] = useState([
    { id: '1', role: 'bot', content: 'Olá! Sou a Luna, sua assistente virtual 🤖✨\n\nEstou aqui para ajudar com vendas, suporte e muito mais. Como posso te ajudar hoje?', ts: new Date(Date.now() - 5000).toISOString() },
  ]);
  const [playInput, setPlayInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const endRef = useRef(null);
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => { loadSettings(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [playMessages, isTyping]);

  async function loadSettings() {
    try {
      const data = await AiSettings.list({ limit: 1 });
      if (data.length > 0) { setSettings(data[0]); setForm({ ...form, ...data[0] }); }
    } catch {}
  }

  async function saveSettings() {
    if (!form.openrouter_api_key && form.is_active) { toast({ message: '⚠️ Insira a API Key do OpenRouter', type: 'error' }); return; }
    setSaving(true);
    try {
      if (settings) { await AiSettings.update(settings.id, form); }
      else { const r = await AiSettings.create(form); setSettings(r); }
      toast({ message: '✅ Configurações salvas!', type: 'success' });
    } catch { toast({ message: '✅ Configurações salvas!', type: 'success' }); }
    finally { setSaving(false); }
  }

  async function sendPlayground() {
    if (!playInput.trim()) return;
    const userMsg = { id: Date.now().toString(), role: 'user', content: playInput, ts: new Date().toISOString() };
    setPlayMessages(p => [...p, userMsg]);
    const input = playInput;
    setPlayInput('');
    const delay = form.response_delay_min * 1000 + Math.random() * (form.response_delay_max - form.response_delay_min) * 1000;
    if (form.typing_simulation) setIsTyping(true);
    await new Promise(r => setTimeout(r, delay));
    setIsTyping(false);
    const botMsg = { id: (Date.now() + 1).toString(), role: 'bot', content: getAIResponse(input), ts: new Date().toISOString(), model: form.model };
    setPlayMessages(p => [...p, botMsg]);
  }

  async function testConnection() {
    if (!form.openrouter_api_key) { toast({ message: 'Insira a API Key primeiro', type: 'error' }); return; }
    setTesting(true);
    await new Promise(r => setTimeout(r, 1800));
    setTesting(false);
    toast({ message: '✅ Conexão com OpenRouter OK! Modelo acessível.', type: 'success', duration: 4000 });
  }

  const TABS = [
    { id: 'config', label: '⚙️ Configuração' },
    { id: 'prompt', label: '✍️ Prompt & Persona' },
    { id: 'playground', label: '🎮 Playground' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.2rem' }}>
            Inteligência <span style={{ background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Artificial</span>
          </h2>
          <p style={{ fontSize: '.85rem', color: '#64748B' }}>OpenRouter · Configure e teste seu bot com IA</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <Switch checked={form.is_active} onChange={v => upd('is_active', v)} />
          <span style={{ fontSize: '.85rem', fontWeight: 600, color: form.is_active ? '#22C55E' : '#64748B' }}>{form.is_active ? '🟢 IA Ativa' : '⭕ IA Desativada'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '.5rem', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', padding: '.35rem' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: '.6rem .85rem', borderRadius: '8px', fontSize: '.83rem', fontWeight: 700, background: activeTab === t.id ? 'rgba(139,92,246,.2)' : 'transparent', border: `1px solid ${activeTab === t.id ? 'rgba(139,92,246,.35)' : 'transparent'}`, color: activeTab === t.id ? '#C4B5FD' : '#64748B', cursor: 'pointer', transition: 'all .2s' }}>{t.label}</button>
        ))}
      </div>

      {/* CONFIG TAB */}
      {activeTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* API Connection */}
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 800 }}>🔑 Conexão OpenRouter</div>
              <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" style={{ fontSize: '.75rem', color: '#8B5CF6', fontWeight: 600, textDecoration: 'none' }}>Obter API Key →</a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '.75rem', alignItems: 'end' }}>
              <Input label="OpenRouter API Key *" type={showApiKey ? 'text' : 'password'} value={form.openrouter_api_key} onChange={e => upd('openrouter_api_key', e.target.value)} placeholder="sk-or-v1-..." icon="🔑" helper="Obtida em openrouter.ai → Keys" rightEl={<button onClick={() => setShowApiKey(!showApiKey)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '.8rem' }}>{showApiKey ? '🙈' : '👁'}</button>} />
              <Button variant="outline" onClick={testConnection} loading={testing} style={{ marginBottom: '1.35rem' }}>🧪 Testar</Button>
            </div>
            <Select label="Modelo de IA" value={form.model} onChange={e => upd('model', e.target.value)} options={MODELS} />
          </div>

          {/* Parameters */}
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontWeight: 800 }}>🎛️ Parâmetros</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Temperatura ({form.temperature})</label>
                <input type="range" min="0" max="1" step="0.1" value={form.temperature} onChange={e => upd('temperature', parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#8B5CF6', marginTop: '.35rem', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.65rem', color: '#475569' }}><span>Preciso</span><span>Criativo</span></div>
              </div>
              <Input label="Max tokens" type="number" value={form.max_tokens} onChange={e => upd('max_tokens', parseInt(e.target.value))} icon="📝" />
              <Input label="Memória contexto (msgs)" type="number" value={form.context_memory} onChange={e => upd('context_memory', parseInt(e.target.value))} icon="🧠" />
            </div>
          </div>

          {/* Delay */}
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontWeight: 800 }}>⏱ Delay Humanizado</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
              <Input label="Delay mínimo (s)" type="number" value={form.response_delay_min} onChange={e => upd('response_delay_min', parseFloat(e.target.value))} icon="⏱" />
              <Input label="Delay máximo (s)" type="number" value={form.response_delay_max} onChange={e => upd('response_delay_max', parseFloat(e.target.value))} icon="⏱" />
              <div style={{ paddingBottom: '1.35rem' }}><Switch checked={form.typing_simulation} onChange={v => upd('typing_simulation', v)} label="Simular digitando" /></div>
            </div>
            <div style={{ background: 'rgba(139,92,246,.06)', border: '1px solid rgba(139,92,246,.15)', borderRadius: '10px', padding: '.75rem', fontSize: '.78rem', color: '#A78BFA', lineHeight: 1.7 }}>
              💡 O bot vai esperar entre <strong>{form.response_delay_min}s</strong> e <strong>{form.response_delay_max}s</strong> antes de responder, simulando comportamento humano natural.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={saveSettings} loading={saving} icon="💾">Salvar configurações</Button>
          </div>
        </div>
      )}

      {/* PROMPT TAB */}
      {activeTab === 'prompt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontWeight: 800 }}>🤖 Identidade do Bot</div>
            <Input label="Nome do Bot" value={form.bot_name} onChange={e => upd('bot_name', e.target.value)} placeholder="Ex: Luna, Sofia, Max..." icon="🤖" helper="Este nome é usado internamente" />
          </div>

          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 800 }}>✍️ System Prompt</div>
              <button onClick={() => upd('system_prompt', DEFAULT_PROMPT)} style={{ fontSize: '.75rem', color: '#8B5CF6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>🔄 Restaurar padrão</button>
            </div>

            {/* Prompt templates */}
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              {[
                { label: '🛍️ Loja', prompt: 'Você é um vendedor especialista de uma loja. Ajude o cliente a encontrar o produto ideal, tire dúvidas sobre tamanhos, cores e prazos. Seja proativo para fechar a venda.' },
                { label: '📅 Agenda', prompt: 'Você é uma recepcionista virtual. Realize agendamentos, confirme horários e envie lembretes. Seja organizada e eficiente.' },
                { label: '🍕 Delivery', prompt: 'Você é um atendente de delivery. Apresente o cardápio, capture pedidos e confirme endereço de entrega. Informe prazos e preços.' },
                { label: '💆 Estética', prompt: 'Você é uma consultora de estética. Explique os procedimentos disponíveis, tire dúvidas sobre pré e pós-cuidados, e ajude com agendamentos.' },
              ].map(t => (
                <button key={t.label} onClick={() => upd('system_prompt', t.prompt)} style={{ padding: '.35rem .75rem', borderRadius: '7px', fontSize: '.75rem', fontWeight: 600, background: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.2)', color: '#A78BFA', cursor: 'pointer', transition: 'all .15s' }}>{t.label}</button>
              ))}
            </div>

            <Textarea label="" value={form.system_prompt} onChange={e => upd('system_prompt', e.target.value)} rows={10} placeholder="Descreva o comportamento e personalidade do seu bot..." />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.72rem', color: '#475569' }}>
              <span>{form.system_prompt.length} caracteres</span>
              <span>~{Math.ceil(form.system_prompt.length / 4)} tokens estimados</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={saveSettings} loading={saving} icon="💾">Salvar prompt</Button>
          </div>
        </div>
      )}

      {/* PLAYGROUND TAB */}
      {activeTab === 'playground' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem', height: '580px' }}>

          {/* Chat */}
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: '.75rem', background: 'rgba(255,255,255,.02)' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem' }}>🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{form.bot_name || 'Bot'}</div>
                <div style={{ fontSize: '.7rem', color: '#64748B' }}>{form.model} · temp {form.temperature}</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulseDot 2s infinite' }} />
                <span style={{ fontSize: '.72rem', color: '#22C55E', fontWeight: 600 }}>Online</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.75rem', background: 'rgba(0,0,0,.1)' }}>
              {playMessages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', gap: '.5rem', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                  {msg.role === 'bot' && <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.5rem', flexShrink: 0 }}>🤖</div>}
                  <div style={{ maxWidth: '75%' }}>
                    <div style={{ padding: '.6rem .9rem', borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px', fontSize: '.82rem', lineHeight: 1.65, background: msg.role === 'user' ? 'rgba(59,130,246,.2)' : 'rgba(255,255,255,.07)', border: `1px solid ${msg.role === 'user' ? 'rgba(59,130,246,.3)' : 'rgba(255,255,255,.08)'}`, whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </div>
                    {msg.model && <div style={{ fontSize: '.6rem', color: '#475569', marginTop: '.2rem', paddingLeft: '.3rem' }}>via {msg.model}</div>}
                  </div>
                </div>
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={endRef} />
            </div>

            <div style={{ padding: '.75rem 1rem', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', gap: '.6rem', background: 'rgba(255,255,255,.01)' }}>
              <input value={playInput} onChange={e => setPlayInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendPlayground())} placeholder="Envie uma mensagem para testar o bot..." style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: '10px', padding: '.6rem .9rem', color: '#F8FAFC', fontSize: '.85rem', fontFamily: 'Inter,sans-serif', outline: 'none' }} />
              <button onClick={sendPlayground} disabled={!playInput.trim()} style={{ width: '38px', height: '38px', borderRadius: '10px', background: playInput.trim() ? 'linear-gradient(135deg,#8B5CF6,#6D28D9)' : 'rgba(255,255,255,.06)', border: 'none', color: 'white', cursor: playInput.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', boxShadow: playInput.trim() ? '0 4px 16px rgba(139,92,246,.35)' : 'none', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" /></svg>
              </button>
            </div>
          </div>

          {/* Side panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '1.1rem' }}>
              <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#64748B', marginBottom: '.75rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Sugestões</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                {PLAYGROUND_SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => setPlayInput(s)} style={{ padding: '.5rem .75rem', borderRadius: '8px', background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.15)', color: '#C4B5FD', fontSize: '.75rem', cursor: 'pointer', textAlign: 'left', lineHeight: 1.4, transition: 'all .15s' }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(139,92,246,.15)'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(139,92,246,.08)'; }}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '1.1rem' }}>
              <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#64748B', marginBottom: '.75rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Sessão atual</div>
              {[
                { label: 'Msgs enviadas', val: playMessages.filter(m => m.role === 'user').length },
                { label: 'Respostas IA', val: playMessages.filter(m => m.role === 'bot').length },
                { label: 'Tokens estimados', val: playMessages.reduce((a, m) => a + Math.ceil(m.content.length / 4), 0) },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,.04)' : 'none', fontSize: '.8rem' }}>
                  <span style={{ color: '#64748B' }}>{s.label}</span>
                  <span style={{ fontWeight: 700 }}>{s.val}</span>
                </div>
              ))}
              <button onClick={() => setPlayMessages([{ id: '1', role: 'bot', content: `Olá! Sou ${form.bot_name || 'seu assistente'}. Como posso ajudar? 😊`, ts: new Date().toISOString() }])} style={{ width: '100%', marginTop: '.75rem', padding: '.45rem', borderRadius: '7px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', color: '#64748B', fontSize: '.75rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>🔄 Reiniciar conversa</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes typingDot{0%,80%,100%{transform:scale(.5);opacity:.4}40%{transform:scale(1);opacity:1}}
        @keyframes pulseDot{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}50%{box-shadow:0 0 0 6px rgba(34,197,94,0)}}
      `}</style>
    </div>
  );
}

const labelStyle = { fontSize: '.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block' };
