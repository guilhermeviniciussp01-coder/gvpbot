import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/* ─── Counter Hook ─── */
function useCounter(target, duration = 1800, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(target * ease));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start]);
  return val;
}

/* ─── Intersection hook ─── */
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); }}, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

/* ─── Stat Card ─── */
function StatCard({ icon, target, suffix, label, color, start }) {
  const val = useCounter(target, 1800, start);
  return (
    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '20px', padding: '2rem 1.5rem', transition: 'all .3s', cursor: 'default' }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,.4)'; }}
      onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>{icon}</div>
      <div style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1, background: `linear-gradient(135deg,${color},${color}99)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '.3rem' }}>
        {val.toLocaleString('pt-BR')}{suffix}
      </div>
      <div style={{ fontSize: '.85rem', color: '#64748B', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

const COMPANIES = ['Boutique Estilo','Sabor do Rio','Clínica Bela','ImobJF','TecnoWeb','Studio Hair','Delivery Fresh','Academia Força','Agência MX','SPA Renascer','Smart Cursos','Varejo Total'];
const COMPANY_ICONS = ['👗','🍕','💆','🏠','💻','✂️','🛵','💪','📣','🌿','📚','🛍️'];
const TESTIMONIALS = [
  { name:'Marcela Costa', role:'Boutique Estilo Carioca, RJ', text:'"Em 30 dias passei de 12 para 89 vendas/mês. O bot captura leads enquanto durmo."', color:'#EC4899', init:'MC', stars:5 },
  { name:'Rafael Santos', role:'Sabor do Rio Delivery, RJ', text:'"Economizei R$11k/mês em equipe. Hoje pago R$97 e atendo 10x mais clientes."', color:'#3B82F6', init:'RS', stars:5 },
  { name:'Dra. Ana Paula Lima', role:'Clínica Bela Estética, MG', text:'"A IA parece tão humana que meus clientes ficam impressionados. Agenda sempre cheia."', color:'#8B5CF6', init:'AP', stars:5 },
  { name:'João Ferreira', role:'ImobJF Imóveis, PR', text:'"Configurei em 20 minutos, no mesmo dia capturei 7 leads e fechei 3 contratos."', color:'#F59E0B', init:'JF', stars:5 },
  { name:'Luana Martins', role:'Studio Luana Hair, SP', text:'"Antes perdia 70% dos clientes fora do horário. Agora acordo com 6 agendamentos novos."', color:'#22C55E', init:'LM', stars:5 },
  { name:'Carlos Eduardo', role:'TecnoWeb Academy, SP', text:'"Tentei outros 3 bots antes. O GVP BOT é diferente — a IA realmente entende contexto."', color:'#14B8A6', init:'CE', stars:5 },
];

export default function LandingPage() {
  const [statsRef, statsInView] = useInView();
  const [notif, setNotif] = useState(null);
  const [notifIdx, setNotifIdx] = useState(0);
  const [annual, setAnnual] = useState(false);
  const [ctaSecs, setCtaSecs] = useState(23*3600 + 47*60 + 12);
  const [mobileMenu, setMobileMenu] = useState(false);

  const NOTIFS = [
    { icon: '🎯', title: 'Novo lead capturado!', sub: 'Carlos M. · São Paulo, SP · agora' },
    { icon: '💰', title: 'Venda realizada!', sub: 'R$ 847 · Estética Bela · 30s atrás' },
    { icon: '👤', title: 'Novo cliente cadastrado', sub: 'Ana P. · RJ · 1min atrás' },
    { icon: '⭐', title: 'Avaliação 5 estrelas', sub: 'Maria S. adorou o atendimento' },
    { icon: '🚀', title: '147 msgs respondidas', sub: 'Bot GVP · sem intervenção humana' },
    { icon: '💬', title: 'Meta atingida!', sub: '100 conversas hoje · Studio Hair' },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setNotif(NOTIFS[notifIdx % NOTIFS.length]);
      const hide = setTimeout(() => setNotif(null), 4000);
      setNotifIdx(p => p + 1);
      return () => clearTimeout(hide);
    }, 3000);
    const interval = setInterval(() => {
      setNotif(NOTIFS[notifIdx % NOTIFS.length]);
      const hide = setTimeout(() => setNotif(null), 4000);
      setNotifIdx(p => p + 1);
    }, 7000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCtaSecs(p => p > 0 ? p - 1 : 86400), 1000);
    return () => clearInterval(t);
  }, []);

  const fmtTimer = () => {
    const h = String(Math.floor(ctaSecs/3600)).padStart(2,'0');
    const m = String(Math.floor((ctaSecs%3600)/60)).padStart(2,'0');
    const s = String(ctaSecs%60).padStart(2,'0');
    return `${h}:${m}:${s}`;
  };

  const GT = (c = 'blue') => ({
    background: c === 'blue' ? 'linear-gradient(135deg,#60A5FA,#A78BFA)' : c === 'green' ? 'linear-gradient(135deg,#34D399,#22C55E)' : 'linear-gradient(135deg,#FCD34D,#F97316,#EF4444)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
  });

  return (
    <div style={{ fontFamily: 'Inter,sans-serif', background: '#030712', color: '#F8FAFC', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 max(5vw,1.5rem)', background: 'rgba(3,7,18,.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', fontWeight: 900, fontSize: '1.1rem' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(59,130,246,.4)' }}>🤖</div>
          GVP<span style={{ color: '#3B82F6' }}>BOT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }} className="nav-links-lp">
          {['Funcionalidades','Depoimentos','Preços','FAQ'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: '.88rem', color: '#94A3B8', textDecoration: 'none', fontWeight: 500, transition: 'color .2s' }}
              onMouseOver={e => e.target.style.color = '#F8FAFC'} onMouseOut={e => e.target.style.color = '#94A3B8'}>{l}</a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '.65rem' }}>
          <Link to={createPageUrl('Login')}><button style={{ padding: '.5rem 1rem', borderRadius: '9px', background: 'transparent', border: '1px solid rgba(255,255,255,.1)', color: '#94A3B8', fontWeight: 600, fontSize: '.85rem', cursor: 'pointer' }}>Entrar</button></Link>
          <Link to={createPageUrl('Cadastro')}><button style={{ padding: '.5rem 1.1rem', borderRadius: '9px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', border: 'none', color: 'white', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(59,130,246,.3)' }}>Começar grátis →</button></Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px max(5vw,1.5rem) 80px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        {/* Orbs */}
        {[{ w:600,h:600,top:'-200px',left:'-150px',c:'rgba(59,130,246,.15)',d:0 },{ w:500,h:500,top:'-100px',right:'-100px',c:'rgba(139,92,246,.12)',d:3 },{ w:400,h:400,bottom:'-100px',left:'30%',c:'rgba(59,130,246,.08)',d:6 }].map((o,i) => (
          <div key={i} style={{ position:'absolute', width:o.w, height:o.h, borderRadius:'50%', background:o.c, filter:'blur(100px)', opacity:.6, top:o.top, left:o.left, right:o.right, bottom:o.bottom, animation:`orbFloat 8s ease-in-out infinite alternate`, animationDelay:`${o.d}s`, pointerEvents:'none' }} />
        ))}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(59,130,246,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.04) 1px,transparent 1px)', backgroundSize:'50px 50px', maskImage:'radial-gradient(ellipse at center,black 30%,transparent 80%)', pointerEvents:'none' }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '920px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.3)', borderRadius: '100px', padding: '.4rem 1.1rem', marginBottom: '2rem', fontSize: '.78rem', fontWeight: 700, color: '#93C5FD' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'pulseDot 2s infinite' }} />
            Mais de 5.000 empresas automatizadas — Junte-se a elas
          </div>

          <h1 style={{ fontSize: 'clamp(2.4rem,7vw,5rem)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1.05, marginBottom: '1.5rem' }}>
            Automatize seu <span style={GT()}>WhatsApp</span><br />com Inteligência<br /><span style={GT()}>Artificial</span>
          </h1>

          <p style={{ fontSize: 'clamp(.95rem,2vw,1.2rem)', color: '#94A3B8', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Capte leads, responda clientes automaticamente e aumente suas vendas <strong style={{ color: '#F8FAFC' }}>24h por dia</strong>. Automatize seu atendimento em minutos.
          </p>

          <div style={{ display: 'flex', gap: '.85rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <Link to={createPageUrl('Cadastro')}>
              <button style={{ padding: '.95rem 2.2rem', borderRadius: '14px', fontSize: '1rem', fontWeight: 800, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 8px 40px rgba(59,130,246,.4)', display: 'flex', alignItems: 'center', gap: '.6rem', transition: 'all .25s' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 50px rgba(59,130,246,.55)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(59,130,246,.4)'; }}
              >Começar Agora — é grátis →</button>
            </Link>
            <button style={{ padding: '.95rem 2rem', borderRadius: '14px', fontSize: '1rem', fontWeight: 700, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: '#F8FAFC', cursor: 'pointer' }}
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >▶ Ver Demonstração</button>
          </div>

          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex' }}>
              {['#3B82F6','#22C55E','#8B5CF6','#F59E0B','#EC4899'].map((c,i) => (
                <div key={i} style={{ width: '34px', height: '34px', borderRadius: '50%', background: `linear-gradient(135deg,${c},${c}88)`, border: '2px solid #030712', marginLeft: i > 0 ? '-10px' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 700 }}>{'MRAJE'[i]}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '.15rem' }}>{[1,2,3,4,5].map(i => <span key={i} style={{ color: '#FCD34D', fontSize: '.9rem' }}>★</span>)}</div>
            <span style={{ fontSize: '.85rem', color: '#94A3B8' }}><strong style={{ color: '#F8FAFC' }}>4.9/5</strong> · mais de 2.400 avaliações</span>
          </div>

          {/* Mock Dashboard */}
          <div id="demo" style={{ marginTop: '5rem' }}>
            <div style={{ background: 'rgba(10,20,40,.95)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,.8), 0 0 60px rgba(59,130,246,.1)', maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.85rem 1.25rem', background: 'rgba(255,255,255,.03)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                {['#FF5F56','#FFBD2E','#27C93F'].map(c => <div key={c} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c }} />)}
                <div style={{ flex: 1, margin: '0 1rem', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '7px', padding: '.28rem 1rem', fontSize: '.72rem', color: '#64748B', textAlign: 'center' }}>app.gvpbot.com.br/dashboard</div>
                <span style={{ fontSize: '.7rem', color: '#64748B' }}>🔒</span>
              </div>
              <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                {[
                  { label: 'Conversas hoje', val: '1.247', color: '#3B82F6', trend: '↑ 34%' },
                  { label: 'Leads capturados', val: '89', color: '#22C55E', trend: '↑ 28%' },
                  { label: 'Taxa de resposta', val: '99.9%', color: '#F59E0B', trend: '↑ 12%' },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '1rem' }}>
                    <div style={{ fontSize: '.7rem', color: '#64748B', marginBottom: '.3rem' }}>{s.label}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-1px', background: `linear-gradient(135deg,${s.color},${s.color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.val}</div>
                    <div style={{ fontSize: '.7rem', color: '#22C55E', marginTop: '.2rem', fontWeight: 600 }}>{s.trend}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '0 1.25rem 1.25rem', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.85rem', fontSize: '.78rem', fontWeight: 700 }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22C55E', animation: 'pulseDot 2s infinite', display: 'inline-block' }} /> Bot ativo
                  </div>
                  {[{ s:'bot',t:'Olá! Como posso ajudar? 😊' },{ s:'user',t:'Quero saber sobre os preços' },{ s:'bot',t:'Claro! Temos planos a partir de R$97/mês 💎' }].map((m,i) => (
                    <div key={i} style={{ display: 'flex', gap: '.4rem', marginBottom: '.5rem', flexDirection: m.s === 'user' ? 'row-reverse' : 'row' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: m.s === 'bot' ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'linear-gradient(135deg,#22C55E,#16A34A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.5rem', flexShrink: 0 }}>{m.s === 'bot' ? '🤖' : 'U'}</div>
                      <div style={{ padding: '.4rem .65rem', borderRadius: '8px', fontSize: '.72rem', lineHeight: 1.5, background: m.s === 'bot' ? 'rgba(59,130,246,.15)' : 'rgba(34,197,94,.12)', border: `1px solid ${m.s === 'bot' ? 'rgba(59,130,246,.2)' : 'rgba(34,197,94,.2)'}`, maxWidth: '80%' }}>{m.t}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  {[{ n:'Maria Silva',t:'(11) 9 9821-3344',c:'rgba(34,197,94,.08)',b:'rgba(34,197,94,.2)',l:'NOVO LEAD 🎯' },{ n:'João Santos',t:'(21) 9 8765-4321',c:'rgba(59,130,246,.08)',b:'rgba(59,130,246,.2)',l:'LEAD 🎯' },{ n:'Ana Lima',t:'(31) 9 7654-0001',c:'rgba(139,92,246,.08)',b:'rgba(139,92,246,.2)',l:'LEAD 🎯' }].map((l,i) => (
                    <div key={i} style={{ background: l.c, border: `1px solid ${l.b}`, borderRadius: '10px', padding: '.75rem' }}>
                      <div style={{ fontSize: '.62rem', color: '#64748B', marginBottom: '.2rem' }}>{l.l}</div>
                      <div style={{ fontSize: '.82rem', fontWeight: 700 }}>{l.n}</div>
                      <div style={{ fontSize: '.68rem', color: '#64748B' }}>{l.t}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGOS ── */}
      <div style={{ padding: '2.5rem max(5vw,1.5rem)', borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.01)', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', fontSize: '.78rem', fontWeight: 600, color: '#475569', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '1.75rem' }}>EMPRESAS QUE CONFIAM NO GVP BOT</div>
        <div style={{ display: 'flex', gap: '3rem', animation: 'logoScroll 25s linear infinite', width: 'max-content' }}>
          {[...COMPANIES, ...COMPANIES].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.55rem', opacity: .4, whiteSpace: 'nowrap', fontSize: '.88rem', fontWeight: 700, color: '#94A3B8' }}>
              <span style={{ background: 'rgba(255,255,255,.06)', borderRadius: '8px', width: '30px', height: '30px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem' }}>{COMPANY_ICONS[i % COMPANY_ICONS.length]}</span>
              {c}
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section ref={statsRef} style={{ padding: '7rem max(5vw,1.5rem)', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.25)', borderRadius: '100px', padding: '.35rem .9rem', fontSize: '.75rem', fontWeight: 700, color: '#93C5FD', marginBottom: '1.5rem' }}>📊 Números que impressionam</div>
        <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '3.5rem' }}>Resultados reais de <span style={GT()}>clientes reais</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.25rem', maxWidth: '900px', margin: '0 auto' }}>
          <StatCard icon="💬" target={5200} suffix="+" label="Empresas atendidas" color="#3B82F6" start={statsInView} />
          <StatCard icon="🤖" target={48} suffix="M+" label="Mensagens automáticas" color="#22C55E" start={statsInView} />
          <StatCard icon="💰" target={340} suffix="M+" label="Em vendas geradas" color="#F59E0B" start={statsInView} />
          <StatCard icon="⚡" target={99} suffix=".9%" label="Uptime garantido" color="#8B5CF6" start={statsInView} />
        </div>
      </section>

      {/* ── URGENCY ── */}
      <div style={{ margin: '0 max(5vw,1.5rem)', background: 'linear-gradient(135deg,rgba(239,68,68,.1),rgba(249,115,22,.06))', border: '1px solid rgba(239,68,68,.25)', borderRadius: '20px', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '2rem', animation: 'shake .5s ease-in-out infinite alternate' }}>🚨</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FCA5A5', marginBottom: '.25rem' }}>Não perca clientes por demora no atendimento</div>
          <div style={{ fontSize: '.85rem', color: '#94A3B8' }}>87% dos clientes abandonam após esperar mais de 1 hora. <strong style={{ color: '#F8FAFC' }}>Seu concorrente já automatizou</strong> — e está roubando seus clientes agora mesmo.</div>
        </div>
        <Link to={createPageUrl('Cadastro')}><button style={{ padding: '.75rem 1.5rem', borderRadius: '12px', background: 'linear-gradient(135deg,#EF4444,#DC2626)', border: 'none', color: 'white', fontWeight: 800, fontSize: '.9rem', cursor: 'pointer', boxShadow: '0 4px 20px rgba(239,68,68,.4)', whiteSpace: 'nowrap' }}>Resolver isso agora →</button></Link>
      </div>

      {/* ── FEATURES ── */}
      <section id="funcionalidades" style={{ padding: '7rem max(5vw,1.5rem)' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.25)', borderRadius: '100px', padding: '.35rem .9rem', fontSize: '.75rem', fontWeight: 700, color: '#93C5FD', marginBottom: '1.25rem' }}>⚡ Funcionalidades</div>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '.85rem' }}>Tudo para <span style={GT()}>escalar seu atendimento</span></h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem', maxWidth: '1100px', margin: '0 auto' }}>
          {[
            { icon:'🤖', title:'IA que parece humana', desc:'GPT-4o integrado que entende contexto e se adapta ao tom da sua empresa. Seus clientes não vão perceber.', color:'#3B82F6', badge:'GPT-4o' },
            { icon:'🟢', title:'WhatsApp + Instagram', desc:'Um bot que atende em todos os canais simultaneamente. DMs, comentários, stories — tudo automatizado.', color:'#22C55E' },
            { icon:'🔀', title:'Construtor visual de fluxos', desc:'Arraste e solte para criar fluxos complexos. Condições, menus, captura — sem código.', color:'#F59E0B' },
            { icon:'👤', title:'Captura automática de leads', desc:'Colete nome, telefone, email durante a conversa. Vai direto para o CRM — zero trabalho manual.', color:'#8B5CF6' },
            { icon:'📊', title:'Analytics em tempo real', desc:'Dashboard com conversas, conversões, horários de pico, leads — tudo em um lugar.', color:'#EC4899' },
            { icon:'👨‍💼', title:'CRM integrado', desc:'Pipeline Kanban para gerir oportunidades. Arraste leads entre etapas do funil com um clique.', color:'#14B8A6' },
          ].map((f, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '20px', padding: '1.75rem', transition: 'all .3s' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = `${f.color}40`; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,.4)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '1.25rem' }}>{f.icon}</div>
              <div style={{ fontWeight: 800, marginBottom: '.5rem', fontSize: '1rem' }}>{f.title}</div>
              <div style={{ fontSize: '.85rem', color: '#64748B', lineHeight: 1.7 }}>{f.desc}</div>
              {f.badge && <div style={{ marginTop: '.75rem', display: 'inline-block', padding: '.2rem .65rem', borderRadius: '100px', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(34,197,94,.12)', color: '#4ADE80', border: '1px solid rgba(34,197,94,.2)' }}>{f.badge}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="depoimentos" style={{ padding: '7rem max(5vw,1.5rem)', background: 'linear-gradient(180deg,transparent,rgba(59,130,246,.02),transparent)' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'inline-flex', gap: '.15rem', marginBottom: '1rem' }}>{[1,2,3,4,5].map(i => <span key={i} style={{ color: '#FCD34D', fontSize: '1.1rem' }}>★</span>)}</div>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '.85rem' }}>O que nossos clientes <span style={GT()}>dizem</span></h2>
          <p style={{ color: '#64748B', fontSize: '.95rem' }}>Mais de 5.200 empresas transformaram seu atendimento</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem', maxWidth: '1100px', margin: '0 auto' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background: i === 0 ? 'linear-gradient(135deg,rgba(59,130,246,.08),rgba(139,92,246,.04))' : 'rgba(255,255,255,.03)', border: `1px solid ${i === 0 ? 'rgba(59,130,246,.3)' : 'rgba(255,255,255,.07)'}`, borderRadius: '20px', padding: '1.75rem', position: 'relative', transition: 'all .3s' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,.4)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ position: 'absolute', top: '1rem', right: '1.25rem', fontSize: '3.5rem', color: 'rgba(59,130,246,.12)', fontFamily: 'Georgia', lineHeight: 1 }}>"</div>
              <div style={{ display: 'flex', gap: '.15rem', marginBottom: '1rem' }}>{[1,2,3,4,5].map(i => <span key={i} style={{ color: '#FCD34D', fontSize: '.88rem' }}>★</span>)}</div>
              <p style={{ fontSize: '.88rem', color: '#94A3B8', lineHeight: 1.75, marginBottom: '1.25rem', fontStyle: 'italic' }}>{t.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: `linear-gradient(135deg,${t.color},${t.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.82rem', fontWeight: 700 }}>{t.init}</div>
                <div>
                  <div style={{ fontSize: '.88rem', fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: '.72rem', color: '#64748B' }}>{t.role}</div>
                  <div style={{ fontSize: '.65rem', color: '#22C55E', fontWeight: 600, marginTop: '.15rem' }}>✓ Cliente verificado</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="preços" style={{ padding: '7rem max(5vw,1.5rem)' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '.85rem' }}>Comece grátis, <span style={GT()}>cresça sem limites</span></h2>
          <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>Sem taxas de instalação. Sem contrato. Cancele quando quiser.</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '100px', padding: '.3rem .4rem', gap: '.3rem' }}>
            {[{ v: false, l: 'Mensal' }, { v: true, l: 'Anual', badge: '-20%' }].map(t => (
              <button key={t.l} onClick={() => setAnnual(t.v)} style={{ padding: '.4rem 1rem', borderRadius: '100px', fontSize: '.82rem', fontWeight: 700, background: annual === t.v ? 'rgba(59,130,246,.2)' : 'transparent', color: annual === t.v ? '#60A5FA' : '#64748B', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.4rem', transition: 'all .2s' }}>
                {t.l} {t.badge && annual && <span style={{ background: 'rgba(34,197,94,.15)', color: '#22C55E', fontSize: '.65rem', padding: '.1rem .4rem', borderRadius: '100px', fontWeight: 800 }}>{t.badge}</span>}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem', maxWidth: '860px', margin: '0 auto' }}>
          {[
            { name:'Starter', icon:'🌱', price: annual ? 77 : 97, features:['1 WhatsApp','500 conversas/mês','Bot com menus','Captura de leads','Dashboard básico'], color:'#64748B', popular:false },
            { name:'Pro', icon:'🚀', price: annual ? 157 : 197, features:['3 WhatsApp','Conversas ilimitadas','IA GPT-4o','Instagram','CRM completo','Analytics avançado','Suporte prioritário'], color:'#3B82F6', popular:true },
            { name:'Premium', icon:'💎', price: annual ? 317 : 397, features:['Ilimitado','IA customizada','Todos os canais','White-label','API completa','Gerente de conta'], color:'#8B5CF6', popular:false },
          ].map(plan => (
            <div key={plan.name} style={{ background: plan.popular ? 'linear-gradient(135deg,rgba(59,130,246,.1),rgba(139,92,246,.06))' : 'rgba(255,255,255,.03)', border: `1px solid ${plan.popular ? 'rgba(59,130,246,.4)' : 'rgba(255,255,255,.08)'}`, borderRadius: '20px', padding: '2rem', transform: plan.popular ? 'scale(1.04)' : 'none', boxShadow: plan.popular ? '0 0 50px rgba(59,130,246,.12)' : 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {plan.popular && <div style={{ textAlign: 'center', fontSize: '.72rem', fontWeight: 800, letterSpacing: '.5px', textTransform: 'uppercase', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>🔥 Mais popular</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><span style={{ fontSize: '1.3rem' }}>{plan.icon}</span><span style={{ fontWeight: 800 }}>{plan.name}</span></div>
              <div><span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-2px', background: `linear-gradient(135deg,${plan.color},${plan.color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>R${plan.price}</span><span style={{ fontSize: '.85rem', color: '#64748B' }}>/mês</span></div>
              <div style={{ flex: 1 }}>{plan.features.map(f => <div key={f} style={{ display: 'flex', gap: '.5rem', fontSize: '.83rem', color: '#CBD5E1', marginBottom: '.4rem' }}><span style={{ color: '#22C55E' }}>✓</span>{f}</div>)}</div>
              <Link to={createPageUrl('Cadastro')}>
                <button style={{ width: '100%', padding: '.85rem', borderRadius: '12px', fontWeight: 800, fontSize: '.9rem', cursor: 'pointer', background: plan.popular ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'transparent', border: plan.popular ? 'none' : '1px solid rgba(255,255,255,.12)', color: plan.popular ? 'white' : '#94A3B8', boxShadow: plan.popular ? '0 4px 20px rgba(59,130,246,.35)' : 'none', transition: 'all .2s' }}>
                  Assinar {plan.name} →
                </button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '8rem max(5vw,1.5rem)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '800px', height: '400px', background: 'radial-gradient(ellipse,rgba(59,130,246,.1) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.75rem', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', borderRadius: '100px', padding: '.5rem 1.25rem', fontSize: '.82rem', fontWeight: 600, color: '#FCD34D', marginBottom: '2rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block', animation: 'pulseDot 1s infinite' }} />
          Oferta especial expira em: <strong>{fmtTimer()}</strong>
        </div>
        <h2 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '1rem' }}>
          Pronto para <span style={GT()}>automatizar em minutos?</span>
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '1.05rem', marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          Junte-se a mais de 5.200 empresas que pararam de perder clientes e começaram a escalar com IA.
        </p>
        <Link to={createPageUrl('Cadastro')}>
          <button style={{ padding: '1.1rem 2.75rem', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 8px 50px rgba(59,130,246,.45)', display: 'inline-flex', alignItems: 'center', gap: '.75rem', transition: 'all .25s' }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 60px rgba(59,130,246,.6)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 50px rgba(59,130,246,.45)'; }}
          >🚀 Começar gratuitamente agora →</button>
        </Link>
        <div style={{ marginTop: '1.5rem', fontSize: '.8rem', color: '#475569' }}>✅ 7 dias grátis · ✅ Sem cartão · ✅ Cancele quando quiser</div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '4rem max(5vw,1.5rem) 2.5rem', borderTop: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', fontWeight: 900, fontSize: '1.1rem', marginBottom: '.75rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤖</div>
              GVP<span style={{ color: '#3B82F6' }}>BOT</span>
            </div>
            <p style={{ fontSize: '.85rem', color: '#64748B', lineHeight: 1.7, maxWidth: '280px' }}>A plataforma de automação de atendimento que está ajudando mais de 5.200 empresas a escalar com IA.</p>
          </div>
          {[
            { title:'Produto', links:['Funcionalidades','Integrações','API','Changelog'] },
            { title:'Empresa', links:['Sobre nós','Blog','Carreiras','Imprensa'] },
            { title:'Suporte', links:['Central de ajuda','Documentação','Status','Contato'] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: '.82rem', fontWeight: 700, color: '#94A3B8', marginBottom: '1rem' }}>{col.title}</div>
              {col.links.map(l => <a key={l} href="#" style={{ display: 'block', fontSize: '.82rem', color: '#64748B', marginBottom: '.55rem', textDecoration: 'none', transition: 'color .2s' }} onMouseOver={e => e.target.style.color = '#F8FAFC'} onMouseOut={e => e.target.style.color = '#64748B'}>{l}</a>)}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,.07)', flexWrap: 'wrap', gap: '1rem', fontSize: '.78rem', color: '#475569' }}>
          <span>© 2026 GVP BOT. Todos os direitos reservados.</span>
          <div style={{ display: 'flex', gap: '.6rem' }}>
            {['🔒 SSL','🛡️ LGPD','🇧🇷 BR'].map(b => <span key={b} style={{ padding: '.22rem .6rem', borderRadius: '7px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', fontSize: '.68rem', fontWeight: 700, color: '#64748B' }}>{b}</span>)}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="#" style={{ color: '#64748B', textDecoration: 'none' }}>Privacidade</a>
            <a href="#" style={{ color: '#64748B', textDecoration: 'none' }}>Termos</a>
          </div>
        </div>
      </footer>

      {/* Floating notif */}
      {notif && (
        <div style={{ position: 'fixed', left: '1.5rem', bottom: '1.5rem', zIndex: 50, background: 'rgba(10,20,40,.97)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '16px', padding: '.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '.85rem', boxShadow: '0 20px 60px rgba(0,0,0,.6)', backdropFilter: 'blur(20px)', maxWidth: '320px', animation: 'modalIn .4s cubic-bezier(.4,0,.2,1)' }}>
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{notif.icon}</span>
          <div>
            <div style={{ fontSize: '.82rem', fontWeight: 700, marginBottom: '.1rem' }}>{notif.title}</div>
            <div style={{ fontSize: '.72rem', color: '#64748B' }}>{notif.sub}</div>
          </div>
          <button onClick={() => setNotif(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', flexShrink: 0 }}>✕</button>
        </div>
      )}

      <style>{`
        @keyframes orbFloat { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(30px,20px) scale(1.05)} }
        @keyframes pulseDot { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)} 50%{box-shadow:0 0 0 6px rgba(34,197,94,0)} }
        @keyframes logoScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes shake { 0%{transform:rotate(-5deg)} 100%{transform:rotate(5deg)} }
        @keyframes modalIn { from{opacity:0;transform:scale(.95) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .nav-links-lp { display: flex; }
        @media(max-width:768px) { .nav-links-lp { display: none !important; } }
        @media(max-width:900px) {
          div[style*="repeat(3,1fr)"] { grid-template-columns: 1fr 1fr !important; }
          div[style*="repeat(4,1fr)"] { grid-template-columns: 1fr 1fr !important; }
          div[style*="2fr 1fr 1fr 1fr"] { grid-template-columns: 1fr 1fr !important; }
        }
        @media(max-width:560px) {
          div[style*="repeat(3,1fr)"] { grid-template-columns: 1fr !important; }
          div[style*="1.3fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
