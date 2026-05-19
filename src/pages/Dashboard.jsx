import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  MessageCircle, Users, Bot, TrendingUp, TrendingDown,
  ArrowRight, Activity, Zap, Phone, CheckCircle, AlertCircle,
} from 'lucide-react';

/* ── utils ── */
function fmtPhone(jid) {
  if (!jid) return '—';
  const n = jid.replace(/@.+/, '');
  if (n.length >= 12) return `+${n.slice(0,2)} (${n.slice(2,4)}) ${n.slice(4,9)}-${n.slice(9)}`;
  return n;
}
function timeAgo(iso) {
  if (!iso) return '—';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `${Math.floor(s/60)}min`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
}

/* ── Skeleton ── */
function Sk({ w = 'w-full', h = 'h-4' }) {
  return <div className={`animate-pulse bg-white/5 rounded-lg ${w} ${h}`} />;
}

/* ── SparkLine ── */
function SparkLine({ data = [], color = '#3B82F6', height = 36 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 120, h = height;
  const pts = data.map((v, i) => `${(i/(data.length-1))*w},${h - (v/max)*h}`).join(' ');
  const fill = pts + ` ${w},${h} 0,${h}`;
  return (
    <svg width={w} height={h} style={{ overflow:'visible' }}>
      <defs>
        <linearGradient id={`g${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={fill} fill={`url(#g${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── KPI Card ── */
function KpiCard({ icon: Icon, label, value, sub, color, spark, trend, loading, delay = 0 }) {
  const up = trend >= 0;
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:.4 }}
      className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-white/10 hover:-translate-y-1 transition-all duration-300 cursor-default">
      {loading ? (
        <div className="flex flex-col gap-3"><Sk w="w-12" h="h-12" /><Sk w="w-20" h="h-8" /><Sk w="w-28" h="h-4" /></div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background:`${color}18` }}>
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <span className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${up?'text-emerald-400 bg-emerald-500/10':'text-red-400 bg-red-500/10'}`}>
              {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {up?'+':''}{trend}%
            </span>
          </div>
          <div className="text-3xl font-black tracking-tight mb-1"
            style={{ background:`linear-gradient(135deg,${color},${color}99)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            {value}
          </div>
          <p className="text-sm text-slate-400">{label}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
          <div className="mt-4 pt-4 border-t border-white/5">
            <SparkLine data={spark} color={color} />
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ── Mini gráfico de barras semanal ── */
function WeeklyChart({ data, loading }) {
  const max = Math.max(...data.map(d => d.msgs), 1);
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-sm text-white">📈 Mensagens — 7 dias</h3>
          <p className="text-xs text-slate-500 mt-0.5">Recebidas vs respondidas pela IA</p>
        </div>
        <Activity className="w-4 h-4 text-slate-500" />
      </div>
      {loading ? (
        <div className="flex gap-2 items-end h-20">{Array(7).fill(0).map((_,i)=><Sk key={i} w="flex-1" h="h-full" />)}</div>
      ) : (
        <>
          <div className="flex gap-2 items-end h-20">
            {data.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col gap-1 items-center group">
                <div className="w-full flex flex-col gap-0.5 items-center">
                  <div title={`${d.msgs} recebidas`} style={{ height: Math.max(4, (d.msgs/max)*64), background:'rgba(59,130,246,.35)', borderRadius:'3px 3px 0 0' }} className="w-full transition-all" />
                  <div title={`${d.replied} respondidas`} style={{ height: Math.max(2, (d.replied/max)*64*0.7), background:'rgba(34,197,94,.6)', borderRadius:'0 0 3px 3px' }} className="w-full -mt-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            {data.map((d,i) => (
              <div key={i} className="flex-1 text-center text-[10px] text-slate-500">{d.label}</div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-white/5">
            {[{color:'rgba(59,130,246,.5)',label:'Recebidas'},{color:'rgba(34,197,94,.7)',label:'Respondidas IA'}].map(l=>(
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-400">
                <div style={{ width:10, height:10, borderRadius:2, background:l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Status das integrações ── */
function IntegrationStatus({ items }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
      <h3 className="font-bold text-sm text-white mb-4">🔌 Status das Integrações</h3>
      <div className="flex flex-col gap-2.5">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-base">{item.icon}</span>
              <span className="text-sm text-slate-300">{item.label}</span>
            </div>
            <span className={`flex items-center gap-1.5 text-xs font-semibold ${item.ok ? 'text-emerald-400' : 'text-slate-500'}`}>
              {item.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
              {item.ok ? item.statusLabel || 'Ativo' : 'Configurar'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Últimas mensagens ── */
function RecentMessages({ messages, loading }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h3 className="font-bold text-sm text-white">💬 Últimas mensagens</h3>
        <Link to={createPageUrl('Logs')} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
          Ver todos <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {loading ? (
        <div className="p-4 flex flex-col gap-3">{Array(4).fill(0).map((_,i)=>(
          <div key={i} className="flex gap-3"><Sk w="w-9" h="h-9" /><div className="flex-1 flex flex-col gap-1.5"><Sk w="w-24" h="h-3" /><Sk w="w-40" h="h-3" /></div></div>
        ))}</div>
      ) : messages.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-sm">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Nenhuma mensagem ainda
        </div>
      ) : (
        <div>
          {messages.map((msg, i) => (
            <div key={msg.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] last:border-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {fmtPhone(msg.from_number).slice(-4,-2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-300">{fmtPhone(msg.from_number)}</span>
                  <span className="text-[10px] text-slate-500 shrink-0">{timeAgo(msg.created_at)}</span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">{msg.message_in}</p>
                {msg.ai_reply && (
                  <p className="text-xs text-blue-400/70 truncate mt-0.5">🤖 {msg.ai_reply}</p>
                )}
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${msg.status==='replied'?'bg-emerald-500/10 text-emerald-400':msg.status==='error'?'bg-red-500/10 text-red-400':'bg-slate-500/10 text-slate-400'}`}>
                {msg.status==='replied'?'✓IA':msg.status==='error'?'Erro':'—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   DASHBOARD PRINCIPAL
═══════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [loading, setLoading]     = useState(true);
  const [userName, setUserName]   = useState('');
  const [period, setPeriod]       = useState('7d');

  // Dados reais
  const [todayMsgs, setTodayMsgs]       = useState(0);
  const [todayReplied, setTodayReplied] = useState(0);
  const [todayLeads, setTodayLeads]     = useState(0);
  const [totalTokens, setTotalTokens]   = useState(0);
  const [aiRate, setAiRate]             = useState(0);
  const [weeklyData, setWeeklyData]     = useState([]);
  const [recentMsgs, setRecentMsgs]     = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [connectedWA, setConnectedWA]   = useState(0);
  const [sparkMsgs, setSparkMsgs]       = useState([]);
  const [sparkLeads, setSparkLeads]     = useState([]);
  const [sparkAI, setSparkAI]           = useState([]);

  // trends vs ontem
  const [trendMsgs, setTrendMsgs]   = useState(0);
  const [trendLeads, setTrendLeads] = useState(0);
  const [trendAI, setTrendAI]       = useState(0);

  useEffect(() => { loadAll(); }, [period]);

  async function loadAll() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'usuário';
      setUserName(firstName);

      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate()-1);
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 14;
      const periodStart = new Date(); periodStart.setDate(periodStart.getDate() - days);

      // ── Mensagens de hoje ──
      const { data: msgsToday } = await supabase.from('message_logs')
        .select('status, created_at')
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString());
      const todayMsgsCount   = msgsToday?.length || 0;
      const todayRepliedCount = msgsToday?.filter(m => m.status==='replied').length || 0;
      setTodayMsgs(todayMsgsCount);
      setTodayReplied(todayRepliedCount);
      setAiRate(todayMsgsCount > 0 ? Math.round((todayRepliedCount/todayMsgsCount)*100) : 0);

      // ── Mensagens de ontem para trend ──
      const { data: msgsYest } = await supabase.from('message_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', todayStart.toISOString());
      const yestCount = msgsYest?.length || 0;
      setTrendMsgs(yestCount > 0 ? Math.round(((todayMsgsCount - yestCount)/yestCount)*100) : todayMsgsCount > 0 ? 100 : 0);

      // ── Leads hoje ──
      const { data: leadsToday } = await supabase.from('leads')
        .select('id').eq('user_id', user.id)
        .gte('created_date', todayStart.toISOString())
        .catch(() => ({ data: [] }));
      const leadsCount = leadsToday?.length || 0;
      setTodayLeads(leadsCount);

      // ── Leads ontem (trend) ──
      const { data: leadsYest } = await supabase.from('leads')
        .select('id').eq('user_id', user.id)
        .gte('created_date', yesterdayStart.toISOString())
        .lt('created_date', todayStart.toISOString())
        .catch(() => ({ data: [] }));
      const leadsYestCount = leadsYest?.length || 0;
      setTrendLeads(leadsYestCount > 0 ? Math.round(((leadsCount - leadsYestCount)/leadsYestCount)*100) : leadsCount > 0 ? 100 : 0);

      // ── Tokens usados hoje ──
      const { data: tokensToday } = await supabase.from('ai_usage_logs')
        .select('tokens_used').eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString());
      const tokensCount = tokensToday?.reduce((s,t) => s+(t.tokens_used||0), 0) || 0;
      setTotalTokens(tokensCount);

      // ── WhatsApp conectados ──
      const { data: waInsts } = await supabase.from('whatsapp_instances')
        .select('status').eq('user_id', user.id);
      const waConn = waInsts?.filter(i => i.status==='connected').length || 0;
      setConnectedWA(waConn);

      // ── Config de IA ──
      const { data: cfg } = await supabase.from('user_configs')
        .select('openrouter_key, ai_enabled').eq('user_id', user.id).single();

      setIntegrations([
        { icon:'📱', label:'WhatsApp', ok: waConn > 0, statusLabel: waConn > 0 ? `${waConn} conectado(s)` : 'Configurar' },
        { icon:'🤖', label:'OpenRouter (IA)', ok: !!cfg?.openrouter_key, statusLabel: cfg?.openrouter_key ? (cfg.ai_enabled ? 'Ativo' : 'Pausado') : 'Configurar' },
        { icon:'💳', label:'PagBank', ok: !!process.env?.PAGBANK_TOKEN, statusLabel: 'Configurado' },
      ]);

      // ── Gráfico semanal (7 dias) ──
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6-i));
        return d;
      });
      const { data: msgsPeriod } = await supabase.from('message_logs')
        .select('created_at, status').eq('user_id', user.id)
        .gte('created_at', weekDays[0].toISOString());

      const weekly = weekDays.map(d => {
        const dayStr = d.toISOString().slice(0,10);
        const dayMsgs = msgsPeriod?.filter(m => m.created_at.slice(0,10) === dayStr) || [];
        return {
          label: d.toLocaleDateString('pt-BR', { weekday:'short' }).slice(0,3),
          msgs: dayMsgs.length,
          replied: dayMsgs.filter(m => m.status==='replied').length,
        };
      });
      setWeeklyData(weekly);
      setSparkMsgs(weekly.map(d => d.msgs));
      setSparkAI(weekly.map(d => d.replied));

      // leads sparks
      const { data: leadsWeek } = await supabase.from('leads')
        .select('created_date').eq('user_id', user.id)
        .gte('created_date', weekDays[0].toISOString())
        .catch(() => ({ data: [] }));
      setSparkLeads(weekDays.map(d => {
        const ds = d.toISOString().slice(0,10);
        return leadsWeek?.filter(l => (l.created_date||'').slice(0,10) === ds).length || 0;
      }));

      // ── Trend IA (taxa ontem vs hoje) ──
      const { data: msgsYestAll } = await supabase.from('message_logs')
        .select('status').eq('user_id', user.id)
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', todayStart.toISOString());
      const yestTotal = msgsYestAll?.length || 0;
      const yestReplied = msgsYestAll?.filter(m=>m.status==='replied').length || 0;
      const yestRate = yestTotal > 0 ? Math.round((yestReplied/yestTotal)*100) : 0;
      const todayRate = todayMsgsCount > 0 ? Math.round((todayRepliedCount/todayMsgsCount)*100) : 0;
      setTrendAI(yestRate > 0 ? todayRate - yestRate : todayRate > 0 ? 10 : 0);

      // ── Últimas mensagens ──
      const { data: recent } = await supabase.from('message_logs')
        .select('*').eq('user_id', user.id)
        .order('created_at', { ascending:false }).limit(6);
      setRecentMsgs(recent || []);

    } catch(err) {
      console.error('[Dashboard]', err);
    } finally {
      setLoading(false);
    }
  }

  const kpis = [
    { icon:MessageCircle, label:'Mensagens hoje', value:todayMsgs, sub:`${todayReplied} respondidas pela IA`, color:'#3B82F6', spark:sparkMsgs, trend:trendMsgs },
    { icon:Users,         label:'Leads hoje',    value:todayLeads, sub:'Capturados via WhatsApp', color:'#8B5CF6', spark:sparkLeads, trend:trendLeads },
    { icon:Bot,           label:'Taxa IA hoje',  value:`${aiRate}%`, sub:`${totalTokens.toLocaleString()} tokens usados`, color:'#22C55E', spark:sparkAI, trend:trendAI },
    { icon:Phone,         label:'WhatsApp',      value:connectedWA, sub:'Instâncias conectadas', color:'#F59E0B', spark:sparkMsgs.map(v=>v>0?1:0), trend:connectedWA > 0 ? 5 : -100 },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'2rem 1.5rem', fontFamily:'Inter,sans-serif', color:'#F8FAFC' }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <motion.h1 initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="text-2xl font-black tracking-tight">
            {greeting}, {userName || '...'} 👋
          </motion.h1>
          <p className="text-slate-400 text-sm mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })}
          </p>
        </div>
        <div className="flex gap-2">
          {['7d','14d','30d'].map(p => (
            <button key={p} onClick={()=>setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period===p?'bg-blue-500/20 text-blue-400 border border-blue-500/30':'text-slate-500 hover:text-slate-300 border border-white/5'}`}>
              {p === '7d' ? '7 dias' : p === '14d' ? '14 dias' : '30 dias'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k, i) => <KpiCard key={k.label} {...k} loading={loading} delay={i*0.08} />)}
      </div>

      {/* Linha 2: gráfico semanal + integrações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <WeeklyChart data={weeklyData} loading={loading} />
        </div>
        <IntegrationStatus items={loading ? [] : integrations} />
      </div>

      {/* Linha 3: últimas mensagens + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentMessages messages={recentMsgs} loading={loading} />
        </div>

        {/* Quick actions */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <h3 className="font-bold text-sm text-white mb-4">⚡ Ações rápidas</h3>
          <div className="flex flex-col gap-2.5">
            {[
              { icon:'📱', label:'Conectar WhatsApp', path:'WhatsApp', color:'#22C55E' },
              { icon:'🤖', label:'Configurar IA', path:'IA', color:'#3B82F6' },
              { icon:'📋', label:'Ver logs', path:'Logs', color:'#8B5CF6' },
              { icon:'👥', label:'Gerenciar leads', path:'Leads', color:'#F59E0B' },
              { icon:'💳', label:'Meu plano', path:'Planos', color:'#EF4444' },
            ].map(a => (
              <Link key={a.path} to={createPageUrl(a.path)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background:`${a.color}15` }}>
                  {a.icon}
                </div>
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors flex-1">{a.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
