import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signIn, resetPassword, supabase } from '@/api/supabaseClient';

const inp = { width: '100%', padding: '.72rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#F8FAFC', fontSize: '.9rem', fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box' };

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState(null);
  const [mode, setMode]         = useState('login'); // 'login' | 'forgot'
  const [resetSent, setResetSent] = useState(false);

  function showToast(message, type = 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) { showToast('Preencha todos os campos'); return; }
    setLoading(true);
    try {
      await supabase.auth.signOut();
      await signIn(email.trim().toLowerCase(), password);
      window.location.href = '/Dashboard';
    } catch {
      showToast('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    if (!email) { showToast('Digite seu e-mail'); return; }
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setResetSent(true);
    } catch (err) {
      showToast(err.message || 'Erro ao enviar e-mail');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', fontFamily: 'Inter,sans-serif', color: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position:'absolute', width:'500px', height:'500px', borderRadius:'50%', background:'rgba(59,130,246,.15)', filter:'blur(100px)', top:'-200px', left:'-100px', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:'500px', height:'500px', borderRadius:'50%', background:'rgba(139,92,246,.12)', filter:'blur(100px)', bottom:'-150px', right:'-100px', pointerEvents:'none' }} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '.6rem', textDecoration: 'none', color: 'inherit', fontWeight: 900, fontSize: '1.15rem', marginBottom: '2.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59,130,246,.4)', fontSize: '1.1rem' }}>🤖</div>
            GVP<span style={{ color: '#3B82F6' }}>BOT</span>
          </Link>

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.5rem' }}>Bem-vindo de volta</h1>
              <p style={{ color: '#64748B', fontSize: '.92rem', marginBottom: '2rem' }}>Entre para acessar seu painel</p>
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '.8rem', color: '#94A3B8', display: 'block', marginBottom: '.4rem' }}>E-mail</label>
                  <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" />
                </div>
                <div>
                  <label style={{ fontSize: '.8rem', color: '#94A3B8', display: 'block', marginBottom: '.4rem' }}>Senha</label>
                  <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" autoComplete="current-password" />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button type="button" onClick={() => setMode('forgot')} style={{ background: 'none', border: 'none', color: '#60A5FA', fontSize: '.82rem', cursor: 'pointer', padding: 0 }}>
                    Esqueci minha senha
                  </button>
                </div>
                <button type="submit" disabled={loading} style={{ padding: '.85rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: 'white', fontWeight: 700, fontSize: '.95rem', cursor: 'pointer', opacity: loading ? .7 : 1, marginTop: '.25rem' }}>
                  {loading ? '⏳ Entrando...' : 'Entrar →'}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#64748B', fontSize: '.88rem' }}>
                Não tem conta?{' '}
                <Link to="/Cadastro" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 600 }}>Criar conta grátis</Link>
              </p>
            </>
          )}

          {/* ── RECUPERAR SENHA ── */}
          {mode === 'forgot' && !resetSent && (
            <>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '.5rem' }}>Recuperar senha</h1>
              <p style={{ color: '#64748B', fontSize: '.92rem', marginBottom: '2rem' }}>Enviaremos um link para redefinir sua senha</p>
              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '.8rem', color: '#94A3B8', display: 'block', marginBottom: '.4rem' }}>E-mail cadastrado</label>
                  <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" />
                </div>
                <button type="submit" disabled={loading} style={{ padding: '.85rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: 'white', fontWeight: 700, fontSize: '.95rem', cursor: 'pointer', opacity: loading ? .7 : 1 }}>
                  {loading ? '⏳ Enviando...' : '📧 Enviar link de recuperação'}
                </button>
              </form>
              <button type="button" onClick={() => setMode('login')} style={{ display: 'block', margin: '1.25rem auto 0', background: 'none', border: 'none', color: '#64748B', fontSize: '.85rem', cursor: 'pointer' }}>
                ← Voltar para login
              </button>
            </>
          )}

          {/* ── CONFIRMAÇÃO ── */}
          {mode === 'forgot' && resetSent && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '.75rem' }}>E-mail enviado!</h1>
              <p style={{ color: '#64748B', fontSize: '.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Verifique sua caixa de entrada em <strong style={{ color: '#F8FAFC' }}>{email}</strong> e clique no link para redefinir sua senha.
              </p>
              <button onClick={() => { setMode('login'); setResetSent(false); }} style={{ padding: '.75rem 1.5rem', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,.07)', color: '#F8FAFC', cursor: 'pointer', fontWeight: 600 }}>
                ← Voltar para login
              </button>
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', padding: '.85rem 1.25rem', borderRadius: '10px', background: toast.type === 'success' ? '#065F46' : '#7F1D1D', border: `1px solid ${toast.type === 'success' ? '#10B981' : '#EF4444'}`, color: 'white', fontSize: '.88rem', fontWeight: 600, zIndex: 1000, maxWidth: '320px' }}>
              {toast.message}
            </div>
          )}
        </div>
      </div>

      {/* Right panel — decorativo */}
      <div style={{ flex: 1, display: 'none', background: 'rgba(255,255,255,.01)', borderLeft: '1px solid rgba(255,255,255,.06)', alignItems: 'center', justifyContent: 'center', padding: '3rem', '@media(min-width:900px)': { display: 'flex' } }} />
    </div>
  );
}
