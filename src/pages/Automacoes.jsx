import { useState, useEffect, useRef, useCallback } from 'react';
import { Automation } from '@/api/entities';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

/* ── Node types ── */
const NODE_TYPES = {
  trigger:   { label: 'Gatilho',       icon: '⚡', color: '#F59E0B', bg: 'rgba(245,158,11,.12)' },
  message:   { label: 'Mensagem',      icon: '💬', color: '#3B82F6', bg: 'rgba(59,130,246,.12)' },
  condition: { label: 'Condição',      icon: '🔀', color: '#8B5CF6', bg: 'rgba(139,92,246,.12)' },
  delay:     { label: 'Aguardar',      icon: '⏱',  color: '#64748B', bg: 'rgba(100,116,139,.12)' },
  action:    { label: 'Ação',          icon: '🎯', color: '#22C55E', bg: 'rgba(34,197,94,.12)' },
  capture:   { label: 'Capturar Lead', icon: '👤', color: '#EC4899', bg: 'rgba(236,72,153,.12)' },
  end:       { label: 'Fim',           icon: '🏁', color: '#EF4444', bg: 'rgba(239,68,68,.12)' },
};

const TRIGGER_TYPES = [
  { value: 'first_message', label: '👋 Primeira mensagem' },
  { value: 'keyword', label: '🔤 Palavra-chave' },
  { value: 'button_click', label: '🔘 Clique no botão' },
  { value: 'opt_in', label: '✅ Opt-in' },
  { value: 'schedule', label: '⏰ Agendado' },
  { value: 'webhook', label: '🔗 Webhook' },
];

/* ── Default flows ── */
const DEFAULT_NODES = {
  welcome: [
    { id: 'n1', type: 'trigger', x: 80, y: 120, data: { label: 'Primeira mensagem', desc: 'Qualquer novo contato' } },
    { id: 'n2', type: 'message', x: 350, y: 80, data: { label: 'Boas-vindas', content: 'Olá, {{nome}}! 👋 Bem-vindo!\nSou a Luna, assistente virtual.\n\nComo posso te ajudar hoje?' } },
    { id: 'n3', type: 'condition', x: 620, y: 80, data: { label: 'Horário comercial?', condition: 'hora >= 8 E hora <= 18' } },
    { id: 'n4', type: 'message', x: 860, y: 20, data: { label: 'Resposta humana', content: 'Vou te transferir para um atendente! ⏳' } },
    { id: 'n5', type: 'message', x: 860, y: 160, data: { label: 'Resp. fora horário', content: 'Estamos fora do horário. Retornaremos em breve! 🌙' } },
    { id: 'n6', type: 'capture', x: 1100, y: 80, data: { label: 'Capturar lead', fields: 'nome, telefone, email' } },
    { id: 'n7', type: 'end', x: 1340, y: 80, data: { label: 'Fim do fluxo' } },
  ],
  menu: [
    { id: 'n1', type: 'trigger', x: 80, y: 160, data: { label: 'Palavra-chave', desc: 'menu, oi, olá' } },
    { id: 'n2', type: 'message', x: 340, y: 160, data: { label: 'Menu principal', content: 'Olá! 😊 Escolha uma opção:\n\n1️⃣ Ver preços\n2️⃣ Falar com suporte\n3️⃣ Fazer pedido\n4️⃣ Horários' } },
    { id: 'n3', type: 'condition', x: 600, y: 160, data: { label: 'Qual opção?', condition: 'resposta contém 1,2,3,4' } },
    { id: 'n4', type: 'message', x: 840, y: 60, data: { label: 'Enviar preços', content: 'Nossos planos a partir de R$97/mês 💎' } },
    { id: 'n5', type: 'action', x: 840, y: 180, data: { label: 'Acionar suporte', action: 'transferir_humano' } },
    { id: 'n6', type: 'capture', x: 840, y: 300, data: { label: 'Iniciar pedido', fields: 'produto, qtd, endereco' } },
    { id: 'n7', type: 'end', x: 1080, y: 160, data: { label: 'Fim' } },
  ],
};

const DEFAULT_EDGES = {
  welcome: [
    { id: 'e1', from: 'n1', to: 'n2' },
    { id: 'e2', from: 'n2', to: 'n3' },
    { id: 'e3', from: 'n3', to: 'n4', label: 'Sim' },
    { id: 'e4', from: 'n3', to: 'n5', label: 'Não' },
    { id: 'e5', from: 'n4', to: 'n6' },
    { id: 'e6', from: 'n5', to: 'n6' },
    { id: 'e7', from: 'n6', to: 'n7' },
  ],
  menu: [
    { id: 'e1', from: 'n1', to: 'n2' },
    { id: 'e2', from: 'n2', to: 'n3' },
    { id: 'e3', from: 'n3', to: 'n4', label: '1' },
    { id: 'e4', from: 'n3', to: 'n5', label: '2' },
    { id: 'e5', from: 'n3', to: 'n6', label: '3' },
    { id: 'e6', from: 'n4', to: 'n7' },
    { id: 'e7', from: 'n5', to: 'n7' },
    { id: 'e8', from: 'n6', to: 'n7' },
  ],
};

/* ── Node Component ── */
function FlowNode({ node, selected, onSelect, onDrag, onConnect }) {
  const t = NODE_TYPES[node.type] || NODE_TYPES.message;
  const [dragging, setDragging] = useState(false);
  const startPos = useRef(null);

  function onMouseDown(e) {
    if (e.target.closest('.connect-handle')) return;
    e.stopPropagation();
    setDragging(true);
    startPos.current = { mx: e.clientX, my: e.clientY, ox: node.x, oy: node.y };
    onSelect(node.id);
    const onMove = (ev) => { onDrag(node.id, startPos.current.ox + ev.clientX - startPos.current.mx, startPos.current.oy + ev.clientY - startPos.current.my); };
    const onUp = () => { setDragging(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  return (
    <g transform={`translate(${node.x},${node.y})`} style={{ cursor: dragging ? 'grabbing' : 'grab' }} onMouseDown={onMouseDown}>
      {/* Shadow */}
      <rect x="-2" y="4" width="174" height="74" rx="12" fill="rgba(0,0,0,.4)" />
      {/* Card */}
      <rect x="0" y="0" width="172" height="72" rx="12"
        fill={selected ? t.bg.replace('.12', '.2') : t.bg}
        stroke={selected ? t.color : `${t.color}50`}
        strokeWidth={selected ? 2 : 1}
      />
      {/* Icon */}
      <foreignObject x="8" y="8" width="28" height="28">
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${t.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem' }}>{t.icon}</div>
      </foreignObject>
      {/* Type label */}
      <text x="42" y="22" fontSize="9" fill={t.color} fontWeight="700" fontFamily="Inter,sans-serif" textTransform="uppercase" letterSpacing="0.5">{t.label.toUpperCase()}</text>
      {/* Node label */}
      <text x="42" y="36" fontSize="11" fill="#F8FAFC" fontWeight="600" fontFamily="Inter,sans-serif">{(node.data?.label || '').slice(0, 18)}</text>
      {/* Desc */}
      {node.data?.desc && <text x="42" y="51" fontSize="9.5" fill="#64748B" fontFamily="Inter,sans-serif">{node.data.desc.slice(0, 24)}</text>}
      {node.data?.content && <text x="42" y="51" fontSize="9" fill="#94A3B8" fontFamily="Inter,sans-serif">{node.data.content.slice(0, 26)}...</text>}

      {/* Input handle */}
      <circle cx="0" cy="36" r="6" fill="#0A0F1E" stroke={t.color} strokeWidth="1.5" className="connect-handle" style={{ cursor: 'crosshair' }} onClick={e => { e.stopPropagation(); onConnect?.(node.id, 'in'); }} />
      {/* Output handle */}
      <circle cx="172" cy="36" r="6" fill={t.color} stroke={t.color} strokeWidth="1.5" className="connect-handle" style={{ cursor: 'crosshair' }} onClick={e => { e.stopPropagation(); onConnect?.(node.id, 'out'); }} />
    </g>
  );
}

/* ── Edge Component ── */
function FlowEdge({ edge, nodes, label }) {
  const from = nodes.find(n => n.id === edge.from);
  const to = nodes.find(n => n.id === edge.to);
  if (!from || !to) return null;
  const x1 = from.x + 172, y1 = from.y + 36;
  const x2 = to.x, y2 = to.y + 36;
  const cx1 = x1 + 60, cy1 = y1;
  const cx2 = x2 - 60, cy2 = y2;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return (
    <g>
      <path d={`M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`}
        stroke="rgba(255,255,255,.15)" strokeWidth="2" fill="none" strokeDasharray="6 3"
      />
      {/* Arrow */}
      <polygon points={`${x2},${y2} ${x2 - 8},${y2 - 4} ${x2 - 8},${y2 + 4}`} fill="rgba(255,255,255,.25)" />
      {label && (
        <foreignObject x={mx - 20} y={my - 10} width="40" height="20">
          <div style={{ background: 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.3)', borderRadius: '4px', fontSize: '9px', color: '#60A5FA', fontWeight: 700, textAlign: 'center', padding: '1px 3px' }}>{label}</div>
        </foreignObject>
      )}
    </g>
  );
}

/* ── Main Page ── */
export default function Automacoes() {
  const toast = useToast();
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list | builder
  const [editingFlow, setEditingFlow] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [zoom, setZoom] = useState(1);
  const [connecting, setConnecting] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [newForm, setNewForm] = useState({ name: '', description: '', trigger_type: 'first_message', trigger_value: '' });
  const svgRef = useRef(null);

  const MOCK_AUTO = [
    { id: 'a1', name: 'Boas-vindas', description: 'Msg automática para novos contatos', trigger_type: 'first_message', status: 'active', executions_count: 1247, last_executed: new Date(Date.now() - 3600000).toISOString(), tags: ['onboarding'] },
    { id: 'a2', name: 'Menu Principal', description: 'Menu interativo com opções', trigger_type: 'keyword', trigger_value: 'menu,oi,olá', status: 'active', executions_count: 893, last_executed: new Date(Date.now() - 7200000).toISOString(), tags: ['menu'] },
    { id: 'a3', name: 'Captura de Lead', description: 'Coleta dados automaticamente', trigger_type: 'keyword', trigger_value: 'preço,valor,quanto', status: 'active', executions_count: 412, last_executed: new Date(Date.now() - 14400000).toISOString(), tags: ['leads'] },
    { id: 'a4', name: 'Follow-up 24h', description: 'Lembra o cliente após 24h', trigger_type: 'schedule', status: 'inactive', executions_count: 78, tags: ['follow-up'] },
  ];

  useEffect(() => { loadAutomations(); }, []);

  async function loadAutomations() {
    setLoading(true);
    try {
      const data = await Automation.list({ sort: '-created_date' });
      setAutomations(data.length > 0 ? data : MOCK_AUTO);
    } catch { setAutomations(MOCK_AUTO); }
    finally { setLoading(false); }
  }

  function openBuilder(auto) {
    setEditingFlow(auto);
    const key = auto.name.toLowerCase().includes('boas') ? 'welcome' : 'menu';
    const saved = auto.nodes?.length > 0 ? auto.nodes : DEFAULT_NODES[key] || DEFAULT_NODES.welcome;
    const savedEdges = auto.edges?.length > 0 ? auto.edges : DEFAULT_EDGES[key] || DEFAULT_EDGES.welcome;
    setNodes(saved);
    setEdges(savedEdges);
    setSelectedNode(null);
    setPan({ x: 40, y: 40 });
    setZoom(1);
    setView('builder');
  }

  function addNode(type) {
    const n = { id: `n${Date.now()}`, type, x: 200 + Math.random() * 200, y: 100 + Math.random() * 200, data: { label: NODE_TYPES[type]?.label || 'Nó', content: '', desc: '' } };
    setNodes(p => [...p, n]);
    setSelectedNode(n.id);
  }

  function dragNode(id, x, y) {
    setNodes(p => p.map(n => n.id === id ? { ...n, x: Math.max(0, x), y: Math.max(0, y) } : n));
  }

  function handleConnect(nodeId, dir) {
    if (!connecting) { setConnecting({ id: nodeId, dir }); toast({ message: '🔗 Clique no nó de destino para conectar', type: 'info', duration: 3000 }); }
    else if (connecting.id !== nodeId) {
      const from = connecting.dir === 'out' ? connecting.id : nodeId;
      const to = connecting.dir === 'out' ? nodeId : connecting.id;
      if (!edges.find(e => e.from === from && e.to === to)) setEdges(p => [...p, { id: `e${Date.now()}`, from, to }]);
      setConnecting(null);
    } else setConnecting(null);
  }

  async function saveFlow() {
    const data = { nodes, edges };
    setAutomations(p => p.map(a => a.id === editingFlow.id ? { ...a, ...data } : a));
    try { await Automation.update(editingFlow.id, data); } catch {}
    toast({ message: '✅ Fluxo salvo!', type: 'success' });
  }

  async function createAutomation() {
    if (!newForm.name) { toast({ message: 'Nome é obrigatório', type: 'error' }); return; }
    const data = { ...newForm, status: 'draft', executions_count: 0, nodes: [], edges: [] };
    const newA = { ...data, id: Date.now().toString(), created_date: new Date().toISOString() };
    setAutomations(p => [newA, ...p]);
    try { await Automation.create(data); } catch {}
    setCreateModal(false);
    setNewForm({ name: '', description: '', trigger_type: 'first_message', trigger_value: '' });
    toast({ message: '✅ Automação criada!', type: 'success' });
    openBuilder(newA);
  }

  function toggleStatus(id) {
    setAutomations(p => p.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' } : a));
    toast({ message: 'Status atualizado', type: 'success' });
  }

  async function deleteAutomation() {
    setAutomations(p => p.filter(a => a.id !== deleteId));
    try { await Automation.delete(deleteId); } catch {}
    setDeleteModal(false);
    toast({ message: '🗑️ Automação removida', type: 'info' });
  }

  const TRIGGER_LABELS = { first_message: '👋 1ª mensagem', keyword: '🔤 Palavra-chave', schedule: '⏰ Agendado', webhook: '🔗 Webhook', button_click: '🔘 Botão', opt_in: '✅ Opt-in' };
  const STATUS_CFG = { active: { label: 'Ativo', color: '#22C55E', bg: 'rgba(34,197,94,.12)' }, inactive: { label: 'Inativo', color: '#64748B', bg: 'rgba(100,116,139,.12)' }, draft: { label: 'Rascunho', color: '#F59E0B', bg: 'rgba(245,158,11,.12)' } };

  const selNode = nodes.find(n => n.id === selectedNode);

  /* ── BUILDER VIEW ── */
  if (view === 'builder') return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', gap: 0 }}>
      {/* Builder toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.85rem 1.25rem', background: 'rgba(10,15,30,.98)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', marginBottom: '.85rem', flexWrap: 'wrap' }}>
        <button onClick={() => setView('list')} style={toolBtn}>← Voltar</button>
        <div style={{ flex: 1, fontWeight: 800, fontSize: '.95rem' }}>{editingFlow?.name}</div>
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
          {Object.entries(NODE_TYPES).map(([type, cfg]) => (
            <button key={type} onClick={() => addNode(type)} style={{ padding: '.4rem .75rem', borderRadius: '7px', background: cfg.bg, border: `1px solid ${cfg.color}40`, color: cfg.color, fontSize: '.72rem', fontWeight: 700, cursor: 'pointer' }}>{cfg.icon} {cfg.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '.4rem' }}>
          <button onClick={() => setZoom(p => Math.max(.3, p - .1))} style={toolBtn}>−</button>
          <span style={{ fontSize: '.75rem', color: '#64748B', width: '45px', textAlign: 'center', lineHeight: '30px' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(p => Math.min(2, p + .1))} style={toolBtn}>+</button>
          <Button size="sm" onClick={saveFlow} icon="💾">Salvar</Button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '.85rem', minHeight: 0 }}>
        {/* Canvas */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,.015)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', overflow: 'hidden', position: 'relative', cursor: 'grab' }}>
          {/* Grid bg */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.08) 1px,transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
          <svg ref={svgRef} width="100%" height="100%" style={{ overflow: 'visible' }}>
            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              {/* Edges */}
              {edges.map(e => <FlowEdge key={e.id} edge={e} nodes={nodes} label={e.label} />)}
              {/* Nodes */}
              {nodes.map(n => (
                <FlowNode key={n.id} node={n} selected={selectedNode === n.id}
                  onSelect={setSelectedNode} onDrag={dragNode} onConnect={handleConnect}
                />
              ))}
            </g>
          </svg>
          {nodes.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: '#475569', pointerEvents: 'none' }}>
              <div style={{ fontSize: '3rem' }}>🔀</div>
              <div style={{ fontWeight: 700 }}>Canvas vazio</div>
              <div style={{ fontSize: '.85rem' }}>Adicione blocos pela barra acima</div>
            </div>
          )}
        </div>

        {/* Node inspector */}
        <div style={{ width: '240px', flexShrink: 0, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '1rem', overflowY: 'auto' }}>
          {selNode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{NODE_TYPES[selNode.type]?.icon}</span>
                <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{NODE_TYPES[selNode.type]?.label}</div>
              </div>
              <div>
                <label style={labelS}>Título</label>
                <input value={selNode.data?.label || ''} onChange={e => setNodes(p => p.map(n => n.id === selNode.id ? { ...n, data: { ...n.data, label: e.target.value } } : n))} style={inpS} />
              </div>
              {(selNode.type === 'message' || selNode.type === 'action') && (
                <div>
                  <label style={labelS}>Conteúdo</label>
                  <textarea value={selNode.data?.content || ''} onChange={e => setNodes(p => p.map(n => n.id === selNode.id ? { ...n, data: { ...n.data, content: e.target.value } } : n))} rows={5} style={{ ...inpS, resize: 'vertical' }} placeholder="Digite a mensagem..." />
                </div>
              )}
              {selNode.type === 'condition' && (
                <div>
                  <label style={labelS}>Condição</label>
                  <input value={selNode.data?.condition || ''} onChange={e => setNodes(p => p.map(n => n.id === selNode.id ? { ...n, data: { ...n.data, condition: e.target.value } } : n))} style={inpS} placeholder="Ex: resposta contém 'sim'" />
                </div>
              )}
              {selNode.type === 'trigger' && (
                <div>
                  <label style={labelS}>Descrição</label>
                  <input value={selNode.data?.desc || ''} onChange={e => setNodes(p => p.map(n => n.id === selNode.id ? { ...n, data: { ...n.data, desc: e.target.value } } : n))} style={inpS} placeholder="Ex: palavras: oi, olá" />
                </div>
              )}
              <button onClick={() => { setNodes(p => p.filter(n => n.id !== selNode.id)); setEdges(p => p.filter(e => e.from !== selNode.id && e.to !== selNode.id)); setSelectedNode(null); }} style={{ padding: '.5rem', borderRadius: '8px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', color: '#EF4444', fontSize: '.78rem', cursor: 'pointer' }}>🗑️ Remover nó</button>
            </div>
          ) : (
            <div style={{ color: '#475569', fontSize: '.82rem', textAlign: 'center', paddingTop: '2rem', lineHeight: 1.7 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>👆</div>
              Clique em um nó para editar suas propriedades
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ── LIST VIEW ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.2rem' }}>
            Automações <span style={{ background: 'linear-gradient(135deg,#F59E0B,#EF4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>& Fluxos</span>
          </h2>
          <p style={{ fontSize: '.85rem', color: '#64748B' }}>Crie fluxos visuais inspirados no ManyChat</p>
        </div>
        <Button onClick={() => setCreateModal(true)} icon="➕">Novo fluxo</Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        {[
          { label: 'Fluxos ativos', val: automations.filter(a => a.status === 'active').length, icon: '🟢', color: '#22C55E' },
          { label: 'Total execuções', val: automations.reduce((a, x) => a + (x.executions_count || 0), 0).toLocaleString('pt-BR'), icon: '⚡', color: '#3B82F6' },
          { label: 'Leads capturados', val: '412', icon: '👥', color: '#8B5CF6' },
          { label: 'Taxa conversão', val: '34.2%', icon: '🎯', color: '#F59E0B' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, background: `linear-gradient(135deg,${s.color},${s.color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.val}</div>
              <div style={{ fontSize: '.75rem', color: '#64748B', marginTop: '.1rem' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {automations.map(auto => {
          const st = STATUS_CFG[auto.status] || STATUS_CFG.inactive;
          return (
            <div key={auto.id} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', overflow: 'hidden', transition: 'all .2s' }}
              onMouseOver={e => e.currentTarget.style.border = '1px solid rgba(59,130,246,.2)'}
              onMouseOut={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,.07)'}
            >
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '.92rem', marginBottom: '.25rem' }}>{auto.name}</div>
                    <div style={{ fontSize: '.78rem', color: '#64748B' }}>{auto.description}</div>
                  </div>
                  <span style={{ padding: '.22rem .65rem', borderRadius: '100px', fontSize: '.68rem', fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.color}30`, flexShrink: 0 }}>{st.label}</span>
                </div>
                <div style={{ display: 'flex', gap: '.75rem', fontSize: '.78rem', color: '#64748B' }}>
                  <span>{TRIGGER_LABELS[auto.trigger_type] || auto.trigger_type}</span>
                  {auto.trigger_value && <span style={{ color: '#475569' }}>· {auto.trigger_value.slice(0, 20)}</span>}
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '.75rem', color: '#64748B' }}>
                  <span>⚡ {(auto.executions_count || 0).toLocaleString('pt-BR')} execuções</span>
                  {auto.last_executed && <span>· {new Date(auto.last_executed).toLocaleDateString('pt-BR')}</span>}
                </div>
                {auto.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: '.3rem' }}>
                    {auto.tags.map(t => <span key={t} style={{ padding: '.15rem .5rem', borderRadius: '6px', fontSize: '.65rem', fontWeight: 600, background: 'rgba(59,130,246,.1)', color: '#93C5FD', border: '1px solid rgba(59,130,246,.2)' }}>{t}</span>)}
                  </div>
                )}
              </div>
              <div style={{ padding: '.75rem 1.25rem', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', gap: '.5rem', justifyContent: 'space-between', background: 'rgba(255,255,255,.02)' }}>
                <button onClick={() => openBuilder(auto)} style={{ flex: 1, padding: '.5rem', borderRadius: '8px', background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.2)', color: '#60A5FA', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer' }}>🔀 Editar fluxo</button>
                <button onClick={() => toggleStatus(auto.id)} style={{ padding: '.5rem .85rem', borderRadius: '8px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#94A3B8', fontSize: '.78rem', cursor: 'pointer' }}>{auto.status === 'active' ? '⏸ Pausar' : '▶ Ativar'}</button>
                <button onClick={() => { setDeleteId(auto.id); setDeleteModal(true); }} style={{ width: '32px', borderRadius: '8px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', color: '#EF4444', fontSize: '.78rem', cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Novo fluxo de automação" icon="🔀" size="md"
        footer={<><button onClick={() => setCreateModal(false)} style={ghostBtn}>Cancelar</button><Button onClick={createAutomation} icon="🚀">Criar fluxo</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
          <Input label="Nome *" value={newForm.name} onChange={e => setNewForm(p => ({...p, name: e.target.value}))} placeholder="Ex: Boas-vindas, Menu, Follow-up..." icon="✏️" />
          <Input label="Descrição" value={newForm.description} onChange={e => setNewForm(p => ({...p, description: e.target.value}))} placeholder="Opcional" icon="📝" />
          <Select label="Tipo de gatilho *" value={newForm.trigger_type} onChange={e => setNewForm(p => ({...p, trigger_type: e.target.value}))} options={TRIGGER_TYPES} />
          {newForm.trigger_type === 'keyword' && <Input label="Palavras-chave" value={newForm.trigger_value} onChange={e => setNewForm(p => ({...p, trigger_value: e.target.value}))} placeholder="oi, olá, menu (separadas por vírgula)" icon="🔤" />}
        </div>
      </Modal>

      <ConfirmModal open={deleteModal} onClose={() => setDeleteModal(false)} onConfirm={deleteAutomation} title="Deletar automação?" description="O fluxo e todas as configurações serão removidos permanentemente." confirmText="Sim, deletar" />
    </div>
  );
}

const ghostBtn = { padding: '.6rem 1.1rem', borderRadius: '8px', fontSize: '.85rem', fontWeight: 500, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#94A3B8', cursor: 'pointer' };
const toolBtn = { padding: '.4rem .8rem', borderRadius: '7px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: '#94A3B8', cursor: 'pointer', fontSize: '.78rem', fontFamily: 'Inter,sans-serif' };
const labelS = { fontSize: '.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: '.3rem' };
const inpS = { width: '100%', padding: '.55rem .75rem', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', borderRadius: '8px', color: '#F8FAFC', fontSize: '.82rem', fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box' };
