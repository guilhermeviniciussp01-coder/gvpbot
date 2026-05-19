import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { generateMockMetrics, generateSparkData, formatRelative, getInitials, getAvatarColor } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Users,
  Target,
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Bot,
  Activity,
  MoreHorizontal,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

/* Skeleton Components */
function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <Skeleton className="w-24 h-8 mb-2" />
      <Skeleton className="w-32 h-4" />
      <div className="mt-4">
        <Skeleton className="w-full h-10" />
      </div>
    </div>
  );
}

/* SparkLine Chart */
function SparkLine({ data, color = '#3B82F6', height = 40 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.val));
  const min = Math.min(...data.map(d => d.val));
  const range = max - min || 1;
  const w = 120, h = height;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d.val - min) / range) * h}`).join(' ');
  
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polyline
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        points={pts + ` ${w},${h} 0,${h}`}
        fill={`url(#sg-${color.replace('#','')})`}
      />
      <motion.polyline
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* KPI Card */
function KpiCard({ kpi, index, loading }) {
  const [hovered, setHovered] = useState(false);
  const TrendIcon = kpi.trend?.startsWith('+') ? TrendingUp : TrendingDown;
  const trendColor = kpi.trend?.startsWith('+') ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10';

  if (loading) return <CardSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative bg-white/[0.02] border border-white/5 rounded-2xl p-6
        transition-all duration-300 cursor-default overflow-hidden group
        ${hovered ? 'border-white/10 shadow-2xl shadow-black/20 -translate-y-1' : ''}
      `}
    >
      {/* Glow effect */}
      <div 
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        style={{ 
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${kpi.color}08, transparent 40%)` 
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `${kpi.color}15` }}
          >
            <kpi.Icon className="w-6 h-6" style={{ color: kpi.color }} />
          </div>
          <span className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {kpi.trend}
          </span>
        </div>

        <motion.div 
          className="text-3xl font-black tracking-tight mb-1"
          style={{ 
            background: `linear-gradient(135deg, ${kpi.color}, ${kpi.color}99)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {typeof kpi.value === 'number' ? kpi.value.toLocaleString('pt-BR') : kpi.value}
        </motion.div>

        <p className="text-sm text-slate-400">{kpi.label}</p>

        <div className="mt-4 pt-4 border-t border-white/5">
          <SparkLine data={kpi.spark} color={kpi.color} height={32} />
        </div>
      </div>
    </motion.div>
  );
}

/* Performance Bar */
function PerformanceBar({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-slate-400">{item.label}</span>
        <span className="text-sm font-bold text-white">{item.val}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${item.val}%` }}
          transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ 
            background: `linear-gradient(90deg, ${item.color}, ${item.color}88)` 
          }}
        />
      </div>
    </motion.div>
  );
}

/* Lead Row */
function LeadRow({ lead, index, statusColors, statusLabels }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
    >
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ background: getAvatarColor(lead.name) }}
      >
        {getInitials(lead.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
          {lead.name}
        </p>
        <p className="text-xs text-slate-500">{lead.phone}</p>
      </div>
      <span 
        className="px-2.5 py-1 text-[10px] font-bold rounded-full border"
        style={{
          backgroundColor: `${statusColors[lead.status]}15`,
          color: statusColors[lead.status],
          borderColor: `${statusColors[lead.status]}30`,
        }}
      >
        {statusLabels[lead.status] || lead.status}
      </span>
      <span className="text-xs text-slate-500">{formatRelative(lead.created_date)}</span>
    </motion.div>
  );
}

/* Conversation Row */
function ConversationRow({ conv, index, convStatusColors, convStatusLabels }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
    >
      <div className="relative">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: getAvatarColor(conv.lead_name) }}
        >
          {getInitials(conv.lead_name)}
        </div>
        <span 
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0d0d12]"
          style={{ backgroundColor: convStatusColors[conv.status] }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
            {conv.lead_name}
          </p>
          <span className="text-[10px] text-slate-500 shrink-0">
            {formatRelative(conv.last_message_at)}
          </span>
        </div>
        <p className="text-xs text-slate-400 truncate">{conv.last_message}</p>
      </div>
      {conv.unread_count > 0 && (
        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded-full min-w-[18px] text-center">
          {conv.unread_count}
        </span>
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [metrics, setMetrics] = useState([]);
  const [kpis, setKpis] = useState({ conversations: 0, leads: 0, conversion: 0, response_time: 0 });
  const [animatedKpis, setAnimatedKpis] = useState({ conversations: 0, leads: 0, conversion: 0, response_time: 0 });
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    async function getUserProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata?.full_name) {
        const firstName = user.user_metadata.full_name.split(' ')[0];
        setUserName(firstName);
      }
    }
    getUserProfile();
  }, []);

  useEffect(() => {
    loadData();
  }, [period]);

  async function loadData() {
    setLoading(true);
    try {
      const mockMetrics = generateMockMetrics();
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 14;
      setMetrics(mockMetrics.slice(-days));

      const newKpis = {
        conversations: 1247,
        leads: 89,
        conversion: 34.2,
        response_time: 0.4
      };

      setKpis(newKpis);
      animateKpis(newKpis);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function animateKpis(target) {
    const duration = 1400;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimatedKpis({
        conversations: Math.floor(target.conversations * ease),
        leads: Math.floor(target.leads * ease),
        conversion: parseFloat((target.conversion * ease).toFixed(1)),
        response_time: parseFloat((target.response_time * ease).toFixed(1)),
      });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const MOCK_LEADS = [
    { id: '1', name: 'Maria Silva', phone: '(11) 9 9821-3344', status: 'new', source: 'WhatsApp', created_date: new Date(Date.now() - 120000).toISOString() },
    { id: '2', name: 'Joao Santos', phone: '(21) 9 8765-4321', status: 'contacted', source: 'Instagram', created_date: new Date(Date.now() - 360000).toISOString() },
    { id: '3', name: 'Ana Lima', phone: '(31) 9 7654-3210', status: 'negotiation', source: 'WhatsApp', created_date: new Date(Date.now() - 900000).toISOString() },
    { id: '4', name: 'Carlos Alves', phone: '(41) 9 6543-2109', status: 'closed', source: 'WhatsApp', created_date: new Date(Date.now() - 1800000).toISOString() },
    { id: '5', name: 'Fernanda Rocha', phone: '(51) 9 5432-1098', status: 'contacted', source: 'Instagram', created_date: new Date(Date.now() - 3600000).toISOString() },
  ];

  const MOCK_CONVS = [
    { id: '1', lead_name: 'Maria Silva', lead_phone: '(11) 9 9821-3344', status: 'bot', last_message: 'Ola! Quero saber sobre os precos...', last_message_at: new Date(Date.now() - 60000).toISOString(), unread_count: 2 },
    { id: '2', lead_name: 'Joao Santos', lead_phone: '(21) 9 8765-4321', status: 'open', last_message: 'Qual o prazo de entrega?', last_message_at: new Date(Date.now() - 300000).toISOString(), unread_count: 1 },
    { id: '3', lead_name: 'Loja Boutique', lead_phone: '(31) 9 7654-0001', status: 'waiting', last_message: 'Preciso de orcamento para 50 pecas', last_message_at: new Date(Date.now() - 720000).toISOString(), unread_count: 0 },
    { id: '4', lead_name: 'Studio Hair', lead_phone: '(85) 9 4444-3333', status: 'bot', last_message: 'Quero agendar uma visita', last_message_at: new Date(Date.now() - 1500000).toISOString(), unread_count: 3 },
  ];

  const statusColors = { new: '#3B82F6', contacted: '#F59E0B', negotiation: '#8B5CF6', closed: '#22C55E', lost: '#EF4444' };
  const statusLabels = { new: 'Novo', contacted: 'Contato', negotiation: 'Negociando', closed: 'Fechado', lost: 'Perdido' };
  const convStatusColors = { bot: '#22C55E', open: '#3B82F6', waiting: '#F59E0B', closed: '#64748B' };
  const convStatusLabels = { bot: 'Bot', open: 'Aberto', waiting: 'Aguardando', closed: 'Fechado' };

  const kpiData = [
    { label: 'Conversas hoje', value: animatedKpis.conversations, Icon: MessageCircle, color: '#3B82F6', trend: '+34%', spark: generateSparkData() },
    { label: 'Leads capturados', value: animatedKpis.leads, Icon: Users, color: '#22C55E', trend: '+28%', spark: generateSparkData() },
    { label: 'Taxa de conversao', value: `${animatedKpis.conversion}%`, Icon: Target, color: '#8B5CF6', trend: '+12%', spark: generateSparkData() },
    { label: 'Tempo de resposta', value: `${animatedKpis.response_time}s`, Icon: Zap, color: '#F59E0B', trend: '-18%', spark: generateSparkData() },
  ];

  const performanceData = [
    { label: 'Msgs respondidas (bot)', val: 94, color: '#3B82F6' },
    { label: 'Satisfacao clientes', val: 98, color: '#22C55E' },
    { label: 'Taxa de captura leads', val: 67, color: '#8B5CF6' },
    { label: 'Automacoes ativas', val: 83, color: '#F59E0B' },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white mb-1">
            {userName ? `Ola, ${userName}` : 'Dashboard'}
            <span className="ml-2 inline-block animate-wave">👋</span>
          </h2>
          <p className="text-sm text-slate-400">Visao geral do seu atendimento em tempo real</p>
        </div>
        
        <div className="flex gap-2">
          {['7d', '14d', '30d'].map(p => (
            <button 
              key={p} 
              onClick={() => setPeriod(p)}
              className={`
                px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                ${period === p 
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' 
                  : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {p === '7d' ? '7 dias' : p === '14d' ? '14 dias' : '30 dias'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, i) => (
          <KpiCard key={i} kpi={kpi} index={i} loading={loading} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar Chart - Larger */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-3 bg-white/[0.02] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white mb-1">Conversas × Leads</h3>
              <p className="text-xs text-slate-500">Crescimento nos ultimos {period}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-500" />
                Conversas
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                Leads
              </span>
            </div>
          </div>

          {loading ? (
            <Skeleton className="w-full h-[160px]" />
          ) : (
            <div className="relative">
              <div className="flex items-end gap-1 h-[160px]">
                {metrics.map((m, i) => {
                  const maxConv = Math.max(...metrics.map(x => x.conversations_count));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(m.conversations_count / maxConv) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.02 }}
                        className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400 min-h-[2px]"
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(m.leads_count / maxConv) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.02 + 0.1 }}
                        className="w-full rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 min-h-[2px]"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-3 text-[10px] text-slate-500">
                {metrics.filter((_, i) => i % Math.floor(metrics.length / 5) === 0).map((m, i) => (
                  <span key={i}>{m.date.slice(5)}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Performance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-white">Performance IA</h3>
            <Activity className="w-5 h-5 text-slate-500" />
          </div>

          <div className="flex flex-col gap-4 flex-1">
            {performanceData.map((item, i) => (
              <PerformanceBar key={i} item={item} index={i} />
            ))}
          </div>

          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-emerald-400">Bot ativo — respondendo em tempo real</span>
          </div>
        </motion.div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Leads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h3 className="font-bold text-white">Leads recentes</h3>
            <Link 
              to={createPageUrl('Leads')} 
              className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Ver todos
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-4"><Skeleton className="w-full h-[280px]" /></div>
            ) : (
              MOCK_LEADS.map((lead, i) => (
                <LeadRow key={lead.id} lead={lead} index={i} statusColors={statusColors} statusLabels={statusLabels} />
              ))
            )}
          </div>
        </motion.div>

        {/* Active Conversations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h3 className="font-bold text-white">Conversas ativas</h3>
            <Link 
              to={createPageUrl('Chat')} 
              className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Abrir chat
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-4"><Skeleton className="w-full h-[240px]" /></div>
            ) : (
              MOCK_CONVS.map((conv, i) => (
                <ConversationRow key={conv.id} conv={conv} index={i} convStatusColors={convStatusColors} convStatusLabels={convStatusLabels} />
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-20deg); }
        }
        .animate-wave {
          animation: wave 1.5s ease-in-out infinite;
          transform-origin: 70% 70%;
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-pulse {
          background: linear-gradient(90deg, rgba(255,255,255,.02) 25%, rgba(255,255,255,.05) 50%, rgba(255,255,255,.02) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
