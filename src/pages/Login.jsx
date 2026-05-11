import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { auth } from '@/api/base44Client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) { toast({ message: 'Preencha todos os campos', type: 'error' }); return; }
    setLoading(true);
    try {
      await auth.login({ email, password });
      navigate(createPageUrl('Dashboard'));
    } catch (err) {
      toast({ message: err.message || 'Credenciais inválidas', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', fontFamily: 'Inter,sans-serif', color: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
      {/* Orbs */}
      {[{ t:'-200px',l:'-100px',c:'rgba(59,130,246,.15)' },{ b:'-150px',r:'-100px',c:'rgba(139,92,246,.12)' }].map((o,i) => (
        <div key={i} style={{ position:'absolute', width:'500px', height:'500px', borderRadius:'50%', background:o.c, filter:'blur(100px)', top:o.t, left:o.l, bottom:o.b, right:o.r, pointerEvents:'none' }} />
      ))}

      {/* Left panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Logo */}
          <Link to={createPageUrl('LandingPage')} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', textDecoration: 'none', color: 'inherit', fontWeight: 900, fontSize: '1.15rem', marginBottom: '2.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59,130,246,.4)' }}>🤖</div>
            GVP<span style={{ color: '#3B82F6' }}>BOT</span>
          </Link>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.5rem' }}>Bem-vindo de volta</h1>
          <p style={{ color: '#64748B', fontSize: '.92rem', marginBottom: '2rem' }}>Entre para acessar seu painel</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" icon="✉️" required />
            <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" icon="🔒" required />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <a href="#" style={{ fontSize: '.8rem', color: '#3B82F6', textDecoration: 'none', fontWeight: 500 }}>Esqueci a senha</a>
            </div>

            <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center', padding: '.8rem', fontSize: '.95rem', marginTop: '.25rem' }}>
              Entrar no painel →
            </Button>
          </form>

          {/* Demo */}
          <div style={{ marginTop: '1.25rem', background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.2)', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#93C5FD', marginBottom: '.5rem' }}>🎮 Modo demonstração</div>
            <div style={{ fontSize: '.75rem', color: '#64748B', marginBottom: '.75rem' }}>Use as credenciais abaixo para explorar o sistema:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '.8rem', color: '#CBD5E1', background: 'rgba(255,255,255,.04)', padding: '.4rem .6rem', borderRadius: '6px' }}>demo@gvpbot.com.br</div>
              <div style={{ fontFamily: 'monospace', fontSize: '.8rem', color: '#CBD5E1', background: 'rgba(255,255,255,.04)', padding: '.4rem .6rem', borderRadius: '6px' }}>demo1234</div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '.85rem', color: '#64748B' }}>
            Não tem conta?{' '}
            <Link to={createPageUrl('Cadastro')} style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 700 }}>Cadastre-se grátis →</Link>
          </div>
        </div>
      </div>

      {/* Right panel — visible on large screens */}
      <div style={{ width: '45%', background: 'linear-gradient(135deg,rgba(59,130,246,.08),rgba(139,92,246,.06))', borderLeft: '1px solid rgba(255,255,255,.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', position: 'relative' }} className="login-right">
        <div style={{ maxWidth: '380px', width: '100%' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '1rem' }}>Atenda 24h sem precisar estar online</div>
          <div style={{ fontSize: '.88rem', color: '#94A3B8', lineHeight: 1.7, marginBottom: '2.5rem' }}>Enquanto você dorme, o bot está capturando leads, respondendo clientes e fechando vendas.</div>

          {/* Mini metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '2rem' }}>
            {[{ v:'1.247', l:'Conversas hoje', c:'#3B82F6' },{ v:'89', l:'Leads gerados', c:'#22C55E' },{ v:'99.9%', l:'Uptime', c:'#8B5CF6' },{ v:'0.3s', l:'Resp. IA', c:'#F59E0B' }].map((m, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', padding: '.85rem' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-1px', background: `linear-gradient(135deg,${m.c},${m.c}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{m.v}</div>
                <div style={{ fontSize: '.72rem', color: '#64748B', marginTop: '.1rem' }}>{m.l}</div>
              </div>
            ))}
          </div>

          {/* Mini testimonial */}
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '14px', padding: '1.1rem' }}>
            <div style={{ display: 'flex', gap: '.15rem', marginBottom: '.6rem' }}>{[1,2,3,4,5].map(i => <span key={i} style={{ color: '#FCD34D', fontSize: '.8rem' }}>★</span>)}</div>
            <div style={{ fontSize: '.82rem', color: '#94A3B8', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '.75rem' }}>"Em 30 dias passei de 12 para 89 vendas/mês usando o GVP BOT."</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,#EC4899,#BE185D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 700 }}>MC</div>
              <div>
                <div style={{ fontSize: '.78rem', fontWeight: 700 }}>Marcela Costa</div>
                <div style={{ fontSize: '.65rem', color: '#64748B' }}>Boutique Estilo, RJ</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:900px){.login-right{display:none!important}}`}</style>
    </div>
  );
}
