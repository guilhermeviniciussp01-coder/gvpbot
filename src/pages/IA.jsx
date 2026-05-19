import { useState, useEffect, useRef } from 'react';
import { supabase, getUserConfig, saveUserConfig } from '@/api/supabaseClient';
import { useToast, addNotification } from '@/components/ui/Toast';

const FREE_MODELS = [
  { value: 'mistralai/mistral-7b-instruct:free', label: '⚡ Mistral 7B (Gratuito)', free: true },
  { value: 'meta-llama/llama-3-8b-instruct:free', label: '🦙 Llama 3 8B (Gratuito)', free: true },
  { value: 'microsoft/phi-3-mini-128k-instruct:free', label: '🔬 Phi-3 Mini (Gratuito)', free: true },
  { value: 'google/gemma-3-1b-it:free', label: '💎 Gemma 3 (Gratuito)', free: true },
];

const PAID_MODELS = [
  { value: 'openai/gpt-4o', label: '🏆 GPT-4o (Pago)', free: false },
  { value: 'openai/gpt-4o-mini', label: '⚡ GPT-4o Mini (Pago)', free: false },
  { value: 'anthropic/claude-3.5-sonnet', label: '🎭 Claude 3.5 Sonnet (Pago)', free: false },
  { value: 'meta-llama/llama-3.1-70b-instruct', label: '🦙 Llama 3.1 70B (Pago)', free: false },
];

const ALL_MODELS = [...FREE_MODELS, ...PAID_MODELS];

const DEFAULT_PROMPT = `Você é um atendente profissional brasileiro especializado em vendas e suporte via WhatsApp. Seja cordial, objetivo e ajude o cliente a encontrar a melhor solução. Use emojis com moderação. Nunca mencione que é uma IA. Responda sempre em português do Brasil.`;

const SUGGESTIONS = [
  'Olá, quero saber mais sobre os planos',
  'Qual o prazo de entrega?',
  'Vocês aceitam PIX?',
  'Preciso de suporte',
  'Como cancelo minha assinatura?',
];

export default function IA() {
  const toast = useToast();
  const [tab, setTab]             = useState('config');
  const [saving, setSaving]       = useState(false);
  const [testing, setTesting]     = useState(false);
  const [config, setConfig]       = useState({
    openrouter_key: '',
    ai_model: 'mistralai/mistral-7b-instruct:free',
    system_prompt: DEFAULT_PROMPT,
    ai_enabled: true,
    temperature: 0.7,
  });
  const [messages, setMessages]   = useState([
    { role: 'assistant', content: 'Olá! 😊 Sou o bot do GVP BOT. Como posso te ajudar hoje?' }
  ]);
  const [input, setInput]         = useState('');
  const [showKey, setShowKey]     = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  async function loadConfig() {
    try {
      const cfg = await getUserConfig();
      if (cfg?.openrouter_key || cfg?.ai_model || cfg?.system_prompt) {
        setConfig(p => ({
          ...p,
          openrouter_key: cfg.openrouter_key || '',
          ai_model: cfg.ai_model || p.ai_model,
          system_prompt: cfg.system_prompt || p.system_prompt,
          ai_enabled: cfg.ai_enabled !== undefined ? cfg.ai_enabled : true,
          temperature: cfg.temperature || 0.7,
        }));
      }
    } catch (err) {
      console.error('Erro ao carregar config:', err);
    }
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
    } finally {
      setSaving(false);
    }
  }

  // ── Chamar OpenRouter de verdade ──
  async function sendMessage() {
    if (!input.trim()) return;
    if (!config.openrouter_key) {
      toast({ message: '⚠️ Configure sua API Key do OpenRouter primeiro', type: 'warning' });
      return;
    }

    const userMsg = { role: 'user', content: input.trim() };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setTesting(true);

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openrouter_key}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'GVP BOT',
        },
        body: JSON.stringify({
          model: config.ai_model,
          messages: [
            { role: 'system', content: config.system_prompt },
            ...messages.filter(m => m.role !== 'system').slice(-6), // últimas 6 msgs para contexto
            userMsg,
          ],
          temperature: config.temperature,
          max_tokens: 500,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'Erro da API');
      const reply = data.choices?.[0]?.message?.content || 'Sem resposta';
      setMessages(p => [...p, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(p => [...p, { role: 'assistant', content: `❌ Erro: ${err.message}` }]);
      addNotification({ icon: '⚠️', title: 'Erro na IA', body: err.message, type: 'error' });
    } finally {
      setTesting(false);
    }
  }

  const upd = (k, v) => setConfig(p => ({ ...p, [k]: v }));
  const inp = { width: '100%', padding: '.65rem .9rem', borderRadius: '8px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#F8FAFC', fontSize: '.85rem', outline: 'none', boxSizing: 'border-box' };
  const cardBg = 'rgba(255,255,255,.03)';
  const border = 'rgba(255,255,255,.08)';
  const selectedModel = ALL_MODELS.find(m => m.value === config.ai_model);

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'Inter,sans-serif', color: '#F8FAFC' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '.25rem' }}>🤖 Inteligência Artificial</h1>
        <p style={{ color: '#64748B', fontSize: '.88rem' }}>Configure o OpenRouter e teste suas respostas automáticas</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.75rem', borderBottom: `1px solid ${border}`, paddingBottom: '.75rem' }}>
        {[
          { id: 'config', label: '⚙️ Configurações' },
          { id: 'playground', label: '🧪 Playground' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '.5rem 1.1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: tab === t.id ? 700 : 500, fontSize: '.85rem', background: tab === t.id ? 'rgba(59,130,246,.15)' : 'transparent', color: tab === t.id ? '#60A5FA' : '#64748B' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Configurações */}
      {tab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* API Key */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>🔑 API Key OpenRouter</div>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inp, paddingRight: '2.5rem' }}
                type={showKey ? 'text' : 'password'}
                value={config.openrouter_key}
                onChange={e => upd('openrouter_key', e.target.value)}
                placeholder="sk-or-v1-..."
              />
              <button onClick={() => setShowKey(p => !p)} style={{ position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '.9rem' }}>
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
            <div style={{ marginTop: '.75rem', display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.78rem', color: '#64748B' }}>
              <span>Não tem conta?</span>
              <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: '#60A5FA', textDecoration: 'none' }}>openrouter.ai/keys →</a>
              <span style={{ marginLeft: '.5rem' }}>Modelos gratuitos disponíveis ✓</span>
            </div>
          </div>

          {/* Modelo */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '1rem' }}>🧠 Modelo de IA</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '.75rem' }}>
              {[...FREE_MODELS, ...PAID_MODELS].map(model => (
                <div
                  key={model.value}
                  onClick={() => upd('ai_model', model.value)}
                  style={{
                    padding: '.85rem 1rem', borderRadius: '10px', cursor: 'pointer',
                    border: `1px solid ${config.ai_model === model.value ? (model.free ? 'rgba(34,197,94,.4)' : 'rgba(59,130,246,.4)') : border}`,
                    background: config.ai_model === model.value ? (model.free ? 'rgba(34,197,94,.08)' : 'rgba(59,130,246,.08)') : 'rgba(255,255,255,.02)',
                    transition: 'all .15s',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '.82rem', marginBottom: '.2rem' }}>{model.label}</div>
                  <div style={{ fontSize: '.7rem', color: model.free ? '#4ADE80' : '#94A3B8' }}>{model.free ? '✓ Gratuito' : '💳 Pago'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Prompt do sistema */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '1rem' }}>📝 Prompt do sistema</div>
            <textarea
              value={config.system_prompt}
              onChange={e => upd('system_prompt', e.target.value)}
              rows={5}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
              placeholder="Instrução base para o bot..."
            />
            <div style={{ marginTop: '.5rem', fontSize: '.75rem', color: '#475569' }}>{config.system_prompt.length} caracteres</div>
          </div>

          {/* Temperatura */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', padding: '1.5rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '.75rem' }}>🌡️ Temperatura: {config.temperature}</div>
            <input type="range" min="0" max="1" step="0.1" value={config.temperature} onChange={e => upd('temperature', parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#3B82F6' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: '#475569', marginTop: '.3rem' }}>
              <span>0 — Preciso</span><span>1 — Criativo</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={saveConfig} disabled={saving} style={{ padding: '.7rem 1.75rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '.88rem', opacity: saving ? .7 : 1 }}>
              {saving ? '⏳ Salvando...' : '💾 Salvar configurações'}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Playground */}
      {tab === 'playground' && (
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', overflow: 'hidden' }}>
          {/* Info do modelo */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '.82rem', color: '#94A3B8' }}>
              Modelo: <strong style={{ color: selectedModel?.free ? '#4ADE80' : '#60A5FA' }}>{selectedModel?.label || config.ai_model}</strong>
            </div>
            <button onClick={() => setMessages([{ role: 'assistant', content: 'Olá! 😊 Sou o bot do GVP BOT. Como posso te ajudar hoje?' }])} style={{ fontSize: '.75rem', background: 'transparent', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#64748B', cursor: 'pointer', padding: '.25rem .6rem' }}>
              🗑️ Limpar
            </button>
          </div>

          {/* Chat */}
          <div ref={chatRef} style={{ height: '380px', overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '.5rem', alignItems: 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.55rem', flexShrink: 0 }}>🤖</div>
                )}
                <div style={{
                  maxWidth: '75%', padding: '.65rem .9rem', borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'rgba(255,255,255,.06)',
                  color: '#F8FAFC', fontSize: '.85rem', lineHeight: 1.55, whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {testing && (
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.55rem', flexShrink: 0 }}>🤖</div>
                <div style={{ padding: '.65rem .9rem', borderRadius: '14px 14px 14px 2px', background: 'rgba(255,255,255,.06)', display: 'flex', gap: '.3rem', alignItems: 'center' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748B', animation: `pulseDot 1.2s ${i * 0.2}s infinite` }} />)}
                </div>
              </div>
            )}
          </div>

          {/* Sugestões */}
          <div style={{ padding: '.75rem 1.25rem', borderTop: `1px solid ${border}`, display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => setInput(s)} style={{ fontSize: '.72rem', background: 'rgba(255,255,255,.04)', border: `1px solid ${border}`, borderRadius: '100px', color: '#94A3B8', cursor: 'pointer', padding: '.25rem .7rem', transition: 'all .15s' }}>
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '.75rem 1.25rem', borderTop: `1px solid ${border}`, display: 'flex', gap: '.75rem' }}>
            <input
              style={{ ...{ padding: '.65rem .9rem', borderRadius: '8px', background: 'rgba(255,255,255,.05)', border: `1px solid ${border}`, color: '#F8FAFC', fontSize: '.85rem', outline: 'none' }, flex: 1 }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Digite uma mensagem para testar..."
              disabled={testing}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || testing}
              style={{ padding: '.65rem 1.1rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '.9rem', opacity: !input.trim() || testing ? .5 : 1 }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes pulseDot { 0%,100%{opacity:.2;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}

