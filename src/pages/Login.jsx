import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn } from '@/supabaseClient';

const inp = { width: '100%', padding: '.72rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#F8FAFC', fontSize: '.9rem', fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box' };

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState(null);
  const navigate = useNavigate();

  function showToast(message, type = 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) { showToast('Preencha todos os campos'); return; }
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      navigate('/Dashboard');
    } catch (err) {
      showToast('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', fontFamily: 'Inter,sans-serif', color: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position:'absolute', width:'500px', height:'500px', borderRadius:'50%', background:'rgba(59,130,246,.15)', filter:'blur(100px)', top:'-200px', left:'-100px', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:'500px', height:'500px', borderRadius:'50%', background:'rgba(139,92,246,.12)', filter:'blur(100px)', bottom:'-150px', right:'-100px', pointerEvents:'none' }} />

      {/* LEFT */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '.6rem', textDecoration: 'none', color: 'inherit', fontWeight: 900, fontSize: '1.15rem', marginBottom: '2.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59,130,246,.4)', fontSize: '1.1rem' }}>🤖</div>
            GVP<span style={{ color: '#3B82F6' }}>BOT</span>
          </Link>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.5rem' }}>Bem-vindo de volta</h1>
          <p style={{ color: '#64748B', fontSize: '.92rem', marginBottom: '2rem' }}>Entre para acessar seu painel</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '.8rem', color: '#94A3B8', display: 'block', marginBottom: '.4rem' }}>E-mail</label>
              <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
            </div>
            <div>
              <label style={{ fontSize: '.8rem', color: '#94A3B8', display: 'block', marginBottom: '.4rem' }}>Senha</label>
              <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link to="/recuperar" style={{ fontSize: '.8rem', color: '#3B82F6', textDecoration: 'none' }}>Esqueci a senha</Link>
            </div>
            <button type="submit" disabled={loading} style={{ padding: '.8rem', borderRadius: '10px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', border: 'none', color: 'white', fontWeight: 700, fontSize: '.95rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, fontFamily: 'Inter,sans-serif' }}>
              {loading ? '⏳ Entrando...' : 'Entrar no painel →'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '.85rem', color: '#64748B' }}>
            Não tem conta?{' '}
            <Link to="/Cadastro" style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 700 }}>Cadastre-se grátis →</Link>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="login-right" style={{ width: '45%', background: 'linear-gradient(135deg,rgba(59,130,246,.08),rgba(139,92,246,.06))', borderLeft: '1px solid rgba(255,255,255,.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: '380px', width: '100%' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '1rem' }}>Atenda 24h sem precisar estar online</div>
          <div style={{ fontSize: '.88rem', color: '#94A3B8', lineHeight: 1.7, marginBottom: '2.5rem' }}>Enquanto você dorme, o bot está capturando leads, respondendo clientes e fechando vendas.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '2rem' }}>
            {[
              { v: '1.247', l: 'Conversas hoje', c: '#3B82F6' },
              { v: '89',    l: 'Leads gerados',  c: '#22C55E' },
              { v: '99,9%', l: 'Uptime',         c: '#8B5CF6' },
              { v: '0,3s',  l: 'Resposta IA',    c: '#F59E0B' },
            ].map((m, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', padding: '.85rem' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: m.c }}>{m.v}</div>
                <div style={{ fontSize: '.72rem', color: '#64748B', marginTop: '.1rem' }}>{m.l}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '14px', padding: '1.1rem' }}>
            <div style={{ marginBottom: '.6rem' }}>{'★★★★★'.split('').map((s,i) => <span key={i} style={{ color: '#FCD34D', fontSize: '.8rem' }}>{s}</span>)}</div>
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

      {toast && (
        <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: toast.type === 'success' ? '#22C55E' : '#EF4444', color: 'white', padding: '.8rem 1.5rem', borderRadius: '10px', fontWeight: 600, fontSize: '.9rem', zIndex: 9999 }}>
          {toast.message}
        </div>
      )}

      <style>{`@media(max-width:900px){.login-right{display:none!important}}`}</style>
    </div>
  );
}
