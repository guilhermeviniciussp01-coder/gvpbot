import { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from '@/api/entities';
import { getInitials, getAvatarColor, formatRelative } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

const MOCK_CONVERSATIONS = [
  { id: 'c1', lead_name: 'Marcela Costa', lead_phone: '(11) 9 9821-3344', channel: 'whatsapp', status: 'bot', last_message: 'Quero saber sobre os preços...', last_message_at: new Date(Date.now() - 60000).toISOString(), unread_count: 2 },
  { id: 'c2', lead_name: 'Rafael Santos', lead_phone: '(21) 9 8765-4321', channel: 'whatsapp', status: 'open', last_message: 'Qual o prazo de entrega?', last_message_at: new Date(Date.now() - 300000).toISOString(), unread_count: 1 },
  { id: 'c3', lead_name: 'Ana Paula Lima', lead_phone: '(31) 9 7654-3210', channel: 'instagram', status: 'waiting', last_message: 'Preciso de orçamento para 50 peças', last_message_at: new Date(Date.now() - 720000).toISOString(), unread_count: 0 },
  { id: 'c4', lead_name: 'Studio Hair', lead_phone: '(85) 9 4444-3333', channel: 'whatsapp', status: 'bot', last_message: 'Quero agendar uma visita', last_message_at: new Date(Date.now() - 1500000).toISOString(), unread_count: 3 },
  { id: 'c5', lead_name: 'João Ferreira', lead_phone: '(41) 9 6543-2109', channel: 'whatsapp', status: 'closed', last_message: 'Obrigado pelo atendimento!', last_message_at: new Date(Date.now() - 3600000).toISOString(), unread_count: 0 },
  { id: 'c6', lead_name: 'Carlos Eduardo', lead_phone: '(11) 9 4321-0987', channel: 'instagram', status: 'open', last_message: 'Vi vocês no Instagram...', last_message_at: new Date(Date.now() - 7200000).toISOString(), unread_count: 0 },
];

const MOCK_MESSAGES = {
  c1: [
    { id: 'm1', sender: 'bot', content: 'Olá, Marcela! 👋 Sou a Luna, assistente virtual. Como posso te ajudar hoje?', timestamp: new Date(Date.now() - 180000).toISOString() },
    { id: 'm2', sender: 'user', content: 'Oi! Quero saber sobre os preços dos planos', timestamp: new Date(Date.now() - 150000).toISOString() },
    { id: 'm3', sender: 'bot', content: 'Claro! Temos 3 planos:\n\n🌱 Starter: R$97/mês\n🚀 Pro: R$197/mês (mais popular)\n💎 Premium: R$397/mês\n\nQual seria ideal para seu negócio?', timestamp: new Date(Date.now() - 120000).toISOString() },
    { id: 'm4', sender: 'user', content: 'Quero saber mais sobre o Pro', timestamp: new Date(Date.now() - 90000).toISOString() },
    { id: 'm5', sender: 'bot', content: 'Ótima escolha! O plano Pro inclui:\n\n✅ Conversas ilimitadas\n✅ IA GPT-4o avançada\n✅ WhatsApp + Instagram\n✅ Analytics completo\n✅ Suporte prioritário\n\nQuer começar o trial gratuito de 7 dias?', timestamp: new Date(Date.now() - 60000).toISOString() },
  ],
  c2: [
    { id: 'm1', sender: 'bot', content: 'Olá, Rafael! Como posso ajudar?', timestamp: new Date(Date.now() - 600000).toISOString() },
    { id: 'm2', sender: 'user', content: 'Qual o prazo de entrega?', timestamp: new Date(Date.now() - 300000).toISOString() },
  ],
};

const STATUS_CONFIG = {
  bot: { label: 'Bot', color: '#22C55E', bg: 'rgba(34,197,94,.15)' },
  open: { label: 'Aberto', color: '#3B82F6', bg: 'rgba(59,130,246,.15)' },
  waiting: { label: 'Aguardando', color: '#F59E0B', bg: 'rgba(245,158,11,.15)' },
  closed: { label: 'Fechado', color: '#64748B', bg: 'rgba(100,116,139,.15)' },
};

const BOT_RESPONSES = [
  'Entendido! Posso te ajudar com isso. 😊 Qual seria a sua dúvida específica?',
  'Ótima pergunta! Nossa equipe está aqui para ajudar. Me conta mais sobre o que você precisa?',
  'Claro! Temos exatamente o que você está buscando. Quer que eu detalhe melhor?',
  'Perfeito! Vou verificar isso para você agora mesmo. Um momento... ⚡',
  'Com certeza! Nossos clientes adoram essa funcionalidade. Posso mostrar como funciona?',
];

export default function Chat() {
  const toast = useToast();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [active, setActive] = useState(null);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, active, typing]);

  async function loadConversations() {
    try {
      const data = await Conversation.list({ sort: '-last_message_at' });
      setConversations(data.length > 0 ? data : MOCK_CONVERSATIONS);
      if (data.length === 0) setMessages(MOCK_MESSAGES);
      if (MOCK_CONVERSATIONS.length > 0) setActive(MOCK_CONVERSATIONS[0]);
    } catch {
      setConversations(MOCK_CONVERSATIONS);
      setMessages(MOCK_MESSAGES);
      setActive(MOCK_CONVERSATIONS[0]);
    }
  }

  function selectConv(conv) {
    setActive(conv);
    // Mark as read
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
  }

  async function sendMessage() {
    if (!input.trim() || !active) return;
    const msg = { id: Date.now().toString(), sender: 'agent', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => ({ ...prev, [active.id]: [...(prev[active.id] || []), msg] }));
    setInput('');

    // Bot response simulation
    setTyping(true);
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
    setTyping(false);
    const botMsg = { id: (Date.now() + 1).toString(), sender: 'bot', content: BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)], timestamp: new Date().toISOString() };
    setMessages(prev => ({ ...prev, [active.id]: [...(prev[active.id] || []), botMsg] }));
    setConversations(prev => prev.map(c => c.id === active.id ? { ...c, last_message: input, last_message_at: new Date().toISOString() } : c));
  }

  const filteredConvs = conversations.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.lead_name?.toLowerCase().includes(q) || c.lead_phone?.includes(q);
    const matchS = !filterStatus || c.status === filterStatus;
    return matchQ && matchS;
  });

  const activeMessages = active ? (messages[active.id] || []) : [];
  const totalUnread = conversations.reduce((a, c) => a + (c.unread_count || 0), 0);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,.06)' }}>
        {/* Search */}
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '10px', padding: '.55rem .85rem', marginBottom: '.6rem' }}>
            <span style={{ color: '#64748B', fontSize: '.85rem' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conversas..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: '.82rem', fontFamily: 'Inter,sans-serif' }} />
          </div>
          <div style={{ display: 'flex', gap: '.35rem' }}>
            {[
              { val: '', label: 'Todas' },
              { val: 'bot', label: '🤖 Bot' },
              { val: 'open', label: '📬 Abertas' },
              { val: 'waiting', label: '⏳ Aguardando' },
            ].map(f => (
              <button key={f.val} onClick={() => setFilterStatus(f.val)} style={{ padding: '.3rem .6rem', borderRadius: '7px', fontSize: '.72rem', fontWeight: 600, background: filterStatus === f.val ? 'rgba(59,130,246,.15)' : 'rgba(255,255,255,.04)', border: `1px solid ${filterStatus === f.val ? 'rgba(59,130,246,.3)' : 'rgba(255,255,255,.07)'}`, color: filterStatus === f.val ? '#60A5FA' : '#64748B', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s' }}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredConvs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '.85rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>💬</div>
              Nenhuma conversa encontrada
            </div>
          ) : filteredConvs.map(conv => {
            const isActive = active?.id === conv.id;
            const st = STATUS_CONFIG[conv.status] || STATUS_CONFIG.open;
            return (
              <div
                key={conv.id}
                onClick={() => selectConv(conv)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.85rem 1rem',
                  borderBottom: '1px solid rgba(255,255,255,.04)', cursor: 'pointer',
                  background: isActive ? 'rgba(59,130,246,.1)' : 'transparent',
                  borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent',
                  transition: 'all .15s',
                }}
                onMouseOver={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,.03)'; }}
                onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: getAvatarColor(conv.lead_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, flexShrink: 0 }}>{getInitials(conv.lead_name)}</div>
                  <div style={{ position: 'absolute', bottom: 0, right: -1, width: '12px', height: '12px', borderRadius: '50%', background: st.color, border: '2px solid #0A0F1E' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.2rem' }}>
                    <span style={{ fontSize: '.85rem', fontWeight: 700 }}>{conv.lead_name}</span>
                    <span style={{ fontSize: '.65rem', color: '#475569' }}>{formatRelative(conv.last_message_at)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.75rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{conv.last_message}</span>
                    {conv.unread_count > 0 && (
                      <span style={{ background: '#3B82F6', color: 'white', borderRadius: '100px', padding: '.1rem .45rem', fontSize: '.65rem', fontWeight: 800, flexShrink: 0, marginLeft: '.5rem' }}>{conv.unread_count}</span>
                    )}
                  </div>
                  <div style={{ marginTop: '.3rem' }}>
                    <span style={{ fontSize: '.62rem', padding: '.1rem .45rem', borderRadius: '5px', background: st.bg, color: st.color, fontWeight: 700 }}>{conv.channel === 'instagram' ? '📸 Instagram' : '🟢 WhatsApp'} · {st.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      {active ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header */}
          <div style={{ padding: '.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: '.85rem', background: 'rgba(255,255,255,.02)', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: getAvatarColor(active.lead_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', fontWeight: 700 }}>{getInitials(active.lead_name)}</div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '11px', height: '11px', borderRadius: '50%', background: STATUS_CONFIG[active.status]?.color || '#64748B', border: '2px solid #0A0F1E' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '.92rem' }}>{active.lead_name}</div>
              <div style={{ fontSize: '.72rem', color: '#64748B' }}>{active.lead_phone} · {active.channel === 'instagram' ? '📸 Instagram' : '🟢 WhatsApp'}</div>
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              {['📎', '🔍', '⋮'].map(icon => (
                <button key={icon} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: '#94A3B8', cursor: 'pointer', fontSize: '.85rem' }}>{icon}</button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.75rem', background: 'rgba(0,0,0,.1)' }}>
            {activeMessages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '.85rem', flexDirection: 'column', gap: '.5rem' }}>
                <div style={{ fontSize: '2rem' }}>💬</div>
                Nenhuma mensagem ainda
              </div>
            ) : activeMessages.map((msg) => {
              const isBot = msg.sender === 'bot';
              const isUser = msg.sender === 'user';
              const isAgent = msg.sender === 'agent';
              return (
                <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '.6rem', flexDirection: isUser ? 'row-reverse' : 'row' }}>
                  {(isBot || isAgent) && (
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: isBot ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'linear-gradient(135deg,#22C55E,#16A34A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 700, flexShrink: 0 }}>
                      {isBot ? '🤖' : 'AG'}
                    </div>
                  )}
                  {isUser && (
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: getAvatarColor(active.lead_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', fontWeight: 700, flexShrink: 0 }}>
                      {getInitials(active.lead_name)}
                    </div>
                  )}
                  <div style={{ maxWidth: '70%' }}>
                    <div style={{
                      padding: '.65rem .95rem', borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                      background: isUser ? 'rgba(59,130,246,.2)' : isAgent ? 'rgba(34,197,94,.12)' : 'rgba(255,255,255,.07)',
                      border: `1px solid ${isUser ? 'rgba(59,130,246,.3)' : isAgent ? 'rgba(34,197,94,.2)' : 'rgba(255,255,255,.08)'}`,
                      fontSize: '.83rem', lineHeight: 1.6, color: '#E2E8F0', whiteSpace: 'pre-wrap',
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: '.62rem', color: '#475569', marginTop: '.25rem', textAlign: isUser ? 'right' : 'left' }}>
                      {formatRelative(msg.timestamp)} {isAgent && '· Você'} {isBot && '· Bot'}
                    </div>
                  </div>
                </div>
              );
            })}

            {typing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', flexShrink: 0 }}>🤖</div>
                <div style={{ display: 'flex', gap: '.3rem', padding: '.5rem .85rem', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '4px 14px 14px 14px' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748B', animation: `typingDot 1.2s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '.85rem 1.25rem', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0, background: 'rgba(255,255,255,.01)' }}>
            <button style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: '#64748B', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}>📎</button>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Digite uma mensagem..."
              style={{ flex: 1, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: '12px', padding: '.65rem 1rem', color: '#F8FAFC', fontSize: '.88rem', fontFamily: 'Inter,sans-serif', outline: 'none' }}
            />
            <button
              onClick={sendMessage}
              style={{ width: '38px', height: '38px', borderRadius: '10px', background: input.trim() ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'rgba(255,255,255,.06)', border: 'none', color: 'white', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .2s', boxShadow: input.trim() ? '0 4px 16px rgba(59,130,246,.35)' : 'none' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: '#64748B' }}>
          <div style={{ fontSize: '3rem' }}>💬</div>
          <div style={{ fontWeight: 700 }}>Selecione uma conversa</div>
          <div style={{ fontSize: '.85rem' }}>Escolha uma conversa na lista para começar</div>
        </div>
      )}

      <style>{`@keyframes typingDot{0%,80%,100%{transform:scale(.5);opacity:.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
