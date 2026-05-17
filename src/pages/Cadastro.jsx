import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '@/api/supabaseClient';
const STEPS = [
  { num: 1, label: 'Sua conta', icon: '👤' },
  { num: 2, label: 'Seu negócio', icon: '🏢' },
  { num: 3, label: 'Plano', icon: '🚀' },
];

const PLANS = [
  { id: 'trial', name: 'Trial Grátis', icon: '⏱', price: 'R$0', period: '7 dias', color: '#64748B', features: ['Acesso completo ao Pro', '7 dias sem cobrança', 'Sem cartão de crédito'] },
  { id: 'pro', name: 'Pro', icon: '🚀', price: 'R$197', period: '/mês', color: '#3B82F6', popular: true, features: ['Conversas ilimitadas', 'IA GPT-4o', 'WhatsApp + Instagram'] },
  { id: 'premium', name: 'Premium', icon: '💎', price: 'R$397', period: '/mês', color: '#8B5CF6', features: ['Tudo do Pro', 'White-label', 'API completa'] },
];

const NICHES = [
  { value: 'loja', label: 'Loja / Varejo' },
  { value: 'restaurante', label: 'Restaurante / Delivery' },
  { value: 'saude', label: 'Saúde / Estética' },
  { value: 'imoveis', label: 'Imóveis' },
  { value: 'educacao', label: 'Educação / Cursos' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'outro', label: 'Outro' },
];

const inp = { width: '100%', padding: '.72rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#F8FAFC', fontSize: '.9rem', fontFamily: 'Inter,sans-serif', outline: 'none' };

export default function Cadastro() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm: '',
    company: '', niche: '', phone: '', plan: 'trial',
  });

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  function showToast(message, type = 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function nextStep() {
    if (step === 1) {
      if (!form.full_name || !form.email || !form.password) { showToast('Preencha todos os campos'); return; }
      if (form.password.length < 6) { showToast('Senha mínimo 6 caracteres'); return; }
      if (form.password !== form.confirm) { showToast('Senhas não coincidem'); return; }
    }
    if (step === 2) {
      if (!form.company || !form.niche) { showToast('Preencha empresa e segmento'); return; }
    }
    if (step < 3) { setStep(p => p + 1); return; }

    setLoading(true);
    try {
      await signUp({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        company_name: form.company,
        phone: form.phone,
      });
      showToast('🎉 Conta criada! Bem-vindo ao GVP BOT!', 'success');
     setTimeout(() => navigate('/Login'), 1000);
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('already registered') || msg.includes('already exists')) {
        showToast('E-mail já cadastrado. Faça login.');
      } else if (msg.includes('invalid')) {
        showToast('E-mail ou senha inválidos.');
      } else {
        showToast(msg || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  const progress = ((step - 1) / 2) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif', color: '#F8FAFC', padding: '2rem 1rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position:'absolute', width:'500px', height:'500px', borderRadius:'50%', background:'rgba(59,130,246,.12)', filter:'blur(100px)', top:'-200px', left:'-150px', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:'500px', height:'500px', borderRadius:'50%', background:'rgba(139,92,246,.1)', filter:'blur(100px)', bottom:'-100px', right:'-100px', pointerEvents:'none' }} />

      <div style={{ width: '100%', maxWidth: '520px', position: 'relative', zIndex: 2 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '.6rem', textDecoration: 'none', color: 'inherit', fontWeight: 900, fontSize: '1.1rem', marginBottom: '2rem', justifyContent: 'center' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤖</div>
          GVP<span style={{ color: '#3B82F6' }}>BOT</span>
        </Link>

        {/* Progress */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            {STEPS.map(s => (
              <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem', flex: 1 }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.88rem', fontWeight: 700, background: step >= s.num ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'rgba(255,255,255,.06)', border: `2px solid ${step >= s.num ? 'rgba(59,130,246,.5)' : 'rgba(255,255,255,.1)'}`, transition: 'all .3s' }}>
                  {step > s.num ? '✓' : s.icon}
                </div>
                <span style={{ fontSize: '.72rem', fontWeight: 600, color: step >= s.num ? '#93C5FD' : '#475569' }}>{s.label}</span>
              </div>
            ))}
          </div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,.07)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#3B82F6,#8B5CF6)', borderRadius: '2px', transition: 'width .5s ease' }} />
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '20px', padding: '2rem' }}>

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><h2 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '.3rem' }}>Crie sua conta</h2><p style={{ color: '#64748B', fontSize: '.88rem' }}>Teste grátis por 7 dias, sem cartão</p></div>
              <div><label style={{ fontSize: '.8rem', color: '#94A3B8', display: 'block', marginBottom: '.4rem' }}>Nome completo *</label><input style={inp} value={form.full_name} onChange={e => upd('full_name', e.target.value)} placeholder="Seu nome" /></div>
              <div><label style={{ fontSize: '.8rem', color: '#94A3B8', display: 'block', marginBottom: '.4rem' }}>E-mail *</label><input style={inp} type="email" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="seu@email.com" /></div>
              <div><label style={{ fontSize: '.8rem', color: '#94A3B8', display: 'block', marginBottom: '.4rem' }}>Senha *</label><input style={inp} type="password" value={form.password} onChange={e => upd('password', e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
              <div><label style={{ fontSize: '.8rem', color: '#94A3B8', display: 'block', marginBottom: '.4rem' }}>Confirmar senha *</label><input style={inp} type="password" value={form.confirm} onChange={e => upd('confirm', e.target.value)} placeholder="Repita a senha" /></div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><h2 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '.3rem' }}>Sobre seu negócio</h2><p style={{ color: '#64748B', fontSize: '.88rem' }}>Vamos personalizar sua experiência</p></div>
              <div><label style={{ fontSize: '.8rem', color: '#94A3B8', display: 'block', marginBottom: '.4rem' }}>Nome da empresa *</label><input style={inp} value={form.company} onChange={e => upd('company', e.target.value)} placeholder="Ex: Loja Boutique" /></div>
              <div>
                <label style={{ fontSize: '.8rem', color: '#94A3B8', display: 'block', marginBottom: '.4rem' }}>Segmento *</label>
                <select style={inp} value={form.niche} onChange={e => upd('niche', e.target.value)}>
                  <option value="">Escolha seu segmento</option>
                  {NICHES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize: '.8rem', color: '#94A3B8', display: 'block', marginBottom: '.4rem' }}>WhatsApp</label><input style={inp} value={form.phone} onChange={e => upd('phone', e.target.value)} placeholder="(11) 9 9999-9999" /></div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><h2 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '.3rem' }}>Escolha seu plano</h2><p style={{ color: '#64748B', fontSize: '.88rem' }}>Você pode mudar a qualquer momento</p></div>
              {PLANS.map(plan => (
                <div key={plan.id} onClick={() => upd('plan', plan.id)} style={{ background: form.plan === plan.id ? `linear-gradient(135deg,${plan.color}18,${plan.color}08)` : 'rgba(255,255,255,.03)', border: `1.5px solid ${form.plan === plan.id ? `${plan.color}50` : 'rgba(255,255,255,.08)'}`, borderRadius: '14px', padding: '1rem', cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: '.85rem', position: 'relative' }}>
                  {plan.popular && <div style={{ position: 'absolute', top: '-8px', right: '10px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', borderRadius: '100px', padding: '.15rem .6rem', fontSize: '.62rem', fontWeight: 800, color: 'white' }}>🔥 Popular</div>}
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${plan.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>{plan.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '.92rem' }}>{plan.name}</span>
                      <span style={{ fontWeight: 900, color: plan.color }}>{plan.price}<span style={{ fontSize: '.7rem', color: '#64748B' }}>{plan.period}</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                      {plan.features.map(f => <span key={f} style={{ fontSize: '.68rem', color: '#64748B' }}>✓ {f}</span>)}
                    </div>
                  </div>
                  {form.plan === plan.id && <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: plan.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', color: 'white' }}>✓</div>}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem' }}>
            {step > 1 && <button onClick={() => setStep(p => p - 1)} style={{ flex: 1, padding: '.75rem', borderRadius: '10px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#94A3B8', fontWeight: 600, cursor: 'pointer' }}>← Voltar</button>}
            <button onClick={nextStep} disabled={loading} style={{ flex: 2, padding: '.78rem', borderRadius: '10px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', border: 'none', color: 'white', fontWeight: 700, fontSize: '.95rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1 }}>
              {loading ? '⏳ Criando conta...' : step === 3 ? '🚀 Criar conta grátis →' : 'Continuar →'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '.83rem', color: '#475569' }}>
          Já tem conta? <Link to="/Login" style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 700 }}>Fazer login →</Link>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: toast.type === 'success' ? '#22C55E' : '#EF4444', color: 'white', padding: '.8rem 1.5rem', borderRadius: '10px', fontWeight: 600, fontSize: '.9rem', zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,.3)' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
