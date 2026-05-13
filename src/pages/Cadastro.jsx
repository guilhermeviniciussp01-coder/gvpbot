import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { NICHES } from '@/lib/utils';

const STEPS = [
  { num: 1, label: 'Sua conta', icon: '👤' },
  { num: 2, label: 'Seu negócio', icon: '🏢' },
  { num: 3, label: 'Plano', icon: '🚀' },
];

const PLANS = [
  { id: 'trial', name: 'Trial Grátis', icon: '⏱', price: 'R$0', period: '7 dias', color: '#64748B', features: ['Acesso completo ao Pro', '7 dias sem cobrança', 'Sem cartão de crédito'] },
  { id: 'pro', name: 'Pro', icon: '🚀', price: 'R$197', period: '/mês', color: '#3B82F6', popular: true, features: ['Conversas ilimitadas', 'IA GPT-4o', 'WhatsApp + Instagram', 'CRM completo'] },
  { id: 'premium', name: 'Premium', icon: '💎', price: 'R$397', period: '/mês', color: '#8B5CF6', features: ['Tudo do Pro', 'White-label', 'API completa', 'Gerente de conta'] },
];

export default function Cadastro() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm: '',
    company: '', niche: '', phone: '',
    plan: 'trial',
  });

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function nextStep() {
    if (step === 1) {
      if (!form.full_name || !form.email || !form.password) { toast({ message: 'Preencha todos os campos', type: 'error' }); return; }
      if (form.password.length < 8) { toast({ message: 'Senha mínimo 8 caracteres', type: 'error' }); return; }
      if (form.password !== form.confirm) { toast({ message: 'Senhas não coincidem', type: 'error' }); return; }
    }
    if (step === 2) {
      if (!form.company || !form.niche) { toast({ message: 'Preencha empresa e segmento', type: 'error' }); return; }
    }
    if (step < 3) { setStep(p => p + 1); return; }

    // Step 3 — submit
    setLoading(true);
    try {
      // 1. Create the account
      const regResponse = await base44.auth.register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        company_name: form.company,
        phone: form.phone,
      });

      // 2. If register returned a token, set it directly — no need to login again
      const token = regResponse?.access_token || regResponse?.data?.access_token;
      if (token) {
        base44.auth.setToken(token);
        toast({ message: '🎉 Conta criada! Bem-vindo ao GVP BOT!', type: 'success' });
        navigate('/Dashboard');
        return;
      }

      // 3. No token returned — do a regular login with the credentials
      await base44.auth.loginViaEmailPassword(form.email, form.password);
      toast({ message: '🎉 Conta criada! Bem-vindo ao GVP BOT!', type: 'success' });
      navigate('/Dashboard');

    } catch (err) {
      // Friendly error messages
      const msg = err?.response?.data?.message || err?.message || '';
      if (msg.toLowerCase().includes('already')) {
        toast({ message: 'Este e-mail já está cadastrado. Tente fazer login.', type: 'error' });
      } else if (msg.toLowerCase().includes('password')) {
        toast({ message: 'Senha inválida. Use no mínimo 8 caracteres.', type: 'error' });
      } else {
        toast({ message: msg || 'Erro ao criar conta. Tente novamente.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  }

  const progress = ((step - 1) / 2) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif', color: '#F8FAFC', padding: '2rem 1rem', position: 'relative', overflow: 'hidden' }}>
      {/* Orbs */}
      {[{ t:'-200px',l:'-150px',c:'rgba(59,130,246,.12)' },{ b:'-100px',r:'-100px',c:'rgba(139,92,246,.1)' }].map((o,i) => (
        <div key={i} style={{ position:'absolute', width:'500px', height:'500px', borderRadius:'50%', background:o.c, filter:'blur(100px)', top:o.t, left:o.l, bottom:o.b, right:o.r, pointerEvents:'none' }} />
      ))}

      <div style={{ width: '100%', maxWidth: '520px', position: 'relative', zIndex: 2 }}>
        {/* Logo */}
        <Link to={createPageUrl('LandingPage')} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', textDecoration: 'none', color: 'inherit', fontWeight: 900, fontSize: '1.1rem', marginBottom: '2rem', justifyContent: 'center' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤖</div>
          GVP<span style={{ color: '#3B82F6' }}>BOT</span>
        </Link>

        {/* Progress */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            {STEPS.map(s => (
              <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem', flex: 1 }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: step > s.num ? '1rem' : '.88rem', fontWeight: 700, background: step >= s.num ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'rgba(255,255,255,.06)', border: `2px solid ${step >= s.num ? 'rgba(59,130,246,.5)' : 'rgba(255,255,255,.1)'}`, transition: 'all .3s', boxShadow: step >= s.num ? '0 0 16px rgba(59,130,246,.3)' : 'none' }}>
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

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '20px', padding: '2rem' }}>
          {/* Step 1 */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ marginBottom: '.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.3rem' }}>Crie sua conta</h2>
                <p style={{ color: '#64748B', fontSize: '.88rem' }}>Teste grátis por 7 dias, sem cartão</p>
              </div>
              <Input label="Nome completo *" value={form.full_name} onChange={e => upd('full_name', e.target.value)} placeholder="Seu nome" icon="👤" />
              <Input label="E-mail *" type="email" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="seu@email.com" icon="✉️" />
              <Input label="Senha *" type="password" value={form.password} onChange={e => upd('password', e.target.value)} placeholder="Mínimo 8 caracteres" icon="🔒" helper="Mínimo 8 caracteres" />
              <Input label="Confirmar senha *" type="password" value={form.confirm} onChange={e => upd('confirm', e.target.value)} placeholder="Repita a senha" icon="🔒" error={form.confirm && form.password !== form.confirm ? 'Senhas não coincidem' : ''} />
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ marginBottom: '.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.3rem' }}>Sobre seu negócio</h2>
                <p style={{ color: '#64748B', fontSize: '.88rem' }}>Vamos personalizar sua experiência</p>
              </div>
              <Input label="Nome da empresa *" value={form.company} onChange={e => upd('company', e.target.value)} placeholder="Ex: Loja Boutique" icon="🏢" />
              <Select label="Segmento *" value={form.niche} onChange={e => upd('niche', e.target.value)} options={NICHES} placeholder="Escolha seu segmento" />
              <Input label="WhatsApp" value={form.phone} onChange={e => upd('phone', e.target.value)} placeholder="(11) 9 9999-9999" icon="📱" />
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ marginBottom: '.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-.5px', marginBottom: '.3rem' }}>Escolha seu plano</h2>
                <p style={{ color: '#64748B', fontSize: '.88rem' }}>Você pode mudar a qualquer momento</p>
              </div>
              {PLANS.map(plan => (
                <div key={plan.id} onClick={() => upd('plan', plan.id)} style={{ background: form.plan === plan.id ? `linear-gradient(135deg,${plan.color}18,${plan.color}08)` : 'rgba(255,255,255,.03)', border: `1.5px solid ${form.plan === plan.id ? `${plan.color}50` : 'rgba(255,255,255,.08)'}`, borderRadius: '14px', padding: '1rem', cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: '.85rem', position: 'relative' }}>
                  {plan.popular && <div style={{ position: 'absolute', top: '-8px', right: '10px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', borderRadius: '100px', padding: '.15rem .6rem', fontSize: '.62rem', fontWeight: 800, color: 'white' }}>🔥 Popular</div>}
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${plan.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{plan.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '.92rem' }}>{plan.name}</span>
                      <span style={{ fontWeight: 900, fontSize: '1rem', background: `linear-gradient(135deg,${plan.color},${plan.color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{plan.price}<span style={{ fontSize: '.7rem', color: '#64748B' }}>{plan.period}</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                      {plan.features.slice(0,3).map(f => <span key={f} style={{ fontSize: '.68rem', color: '#64748B' }}>✓ {f}</span>)}
                    </div>
                  </div>
                  {form.plan === plan.id && <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: `linear-gradient(135deg,${plan.color},${plan.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', color: 'white', flexShrink: 0 }}>✓</div>}
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem' }}>
            {step > 1 && (
              <button onClick={() => setStep(p => p - 1)} style={{ flex: 1, padding: '.75rem', borderRadius: '10px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#94A3B8', fontWeight: 600, fontSize: '.9rem', cursor: 'pointer' }}>← Voltar</button>
            )}
            <Button onClick={nextStep} loading={loading} style={{ flex: 2, justifyContent: 'center', padding: '.78rem', fontSize: '.95rem' }}>
              {step === 3 ? '🚀 Criar conta grátis →' : 'Continuar →'}
            </Button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '.83rem', color: '#475569' }}>
          Já tem conta?{' '}
          <Link to={createPageUrl('Login')} style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 700 }}>Fazer login →</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: '.75rem', fontSize: '.75rem', color: '#334155' }}>
          ✅ Grátis por 7 dias · ✅ Sem cartão · ✅ Cancele quando quiser
        </div>
      </div>
    </div>
  );
}
