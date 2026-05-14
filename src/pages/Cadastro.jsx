import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { signUp, signIn } from '@/api/supabaseClient';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { NICHES } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────
function cleanEmail(raw) {
  return (raw || '')
    .trim()
    .replace(/\u200B/g, '')
    .replace(/\u00A0/g, ' ')
    .toLowerCase();
}
function isValidEmail(raw) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail(raw));
}

// ── Constantes ───────────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: 'Sua conta',   icon: '👤' },
  { num: 2, label: 'Seu negócio', icon: '🏢' },
  { num: 3, label: 'Plano',       icon: '🚀' },
];

const PLANS = [
  {
    id: 'trial', name: 'Trial Grátis', icon: '⏱', price: 'R$0', period: '7 dias',
    color: '#64748B',
    features: ['Acesso completo ao Pro', '7 dias sem cobrança', 'Sem cartão de crédito'],
  },
  {
    id: 'pro', name: 'Pro', icon: '🚀', price: 'R$197', period: '/mês',
    color: '#3B82F6', popular: true,
    features: ['Conversas ilimitadas', 'IA GPT-4o', 'WhatsApp + Instagram', 'CRM completo'],
  },
  {
    id: 'premium', name: 'Premium', icon: '💎', price: 'R$397', period: '/mês',
    color: '#8B5CF6',
    features: ['Tudo do Pro', 'White-label', 'API completa', 'Gerente de conta'],
  },
];

// ── Componente ────────────────────────────────────────────────────────────────
export default function Cadastro() {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();
  const toast                 = useToast();

  // useRef garante que o submit sempre lê os valores mais recentes
  const formRef = useRef({
    full_name: '', email: '', password: '', confirm: '',
    company: '', niche: '', phone: '', plan: 'trial',
  });
  const [form, setForm] = useState(formRef.current);

  function upd(k, v) {
    formRef.current = { ...formRef.current, [k]: v };
    setForm({ ...formRef.current });
  }

  // ── Validações por step ────────────────────────────────────────────────────
  function validateStep1() {
    const d = formRef.current;
    if (!d.full_name.trim())       { toast({ message: 'Informe seu nome completo.', type: 'error' }); return false; }
    if (!isValidEmail(d.email))    { toast({ message: 'Formato de e-mail inválido. Ex: nome@email.com', type: 'error' }); return false; }
    if (d.password.length < 8)     { toast({ message: 'Senha deve ter no mínimo 8 caracteres.', type: 'error' }); return false; }
    if (d.password !== d.confirm)  { toast({ message: 'As senhas não coincidem.', type: 'error' }); return false; }
    return true;
  }
  function validateStep2() {
    const d = formRef.current;
    if (!d.company.trim()) { toast({ message: 'Informe o nome da sua empresa.', type: 'error' }); return false; }
    if (!d.niche)          { toast({ message: 'Selecione o segmento do negócio.', type: 'error' }); return false; }
    return true;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function nextStep() {
    if (step === 1) { if (!validateStep1()) return; setStep(2); return; }
    if (step === 2) { if (!validateStep2()) return; setStep(3); return; }

    // Step 3 — lê direto do ref para evitar closure stale
    const d        = formRef.current;
    const email    = cleanEmail(d.email);
    const password = d.password;

    console.log('[Cadastro] email enviado:', email);
    setLoading(true);

    try {
      // ── 1. Cria conta no Supabase ──────────────────────────────────────────
      const { user, session } = await signUp({
        email,
        password,
        full_name:    d.full_name.trim(),
        company_name: d.company.trim(),
        phone:        d.phone.trim(),
      });

      console.log('[Cadastro] signUp user:', user);
      console.log('[Cadastro] signUp session:', session);

      // ── 2. Se confirmação de e-mail está desativada, session já vem pronta ─
      if (session) {
        toast({ message: '🎉 Conta criada! Bem-vindo ao GVP BOT!', type: 'success' });
        navigate('/Dashboard');
        return;
      }

      // ── 3. Confirmação ativada — tenta login direto mesmo assim ────────────
      //    (Supabase com "Confirm email: OFF" retorna session acima)
      //    (Supabase com "Confirm email: ON"  retorna session null → avisa user)
      if (user && !session) {
        // Tenta login imediato
        try {
          await signIn(email, password);
          toast({ message: '🎉 Conta criada! Bem-vindo ao GVP BOT!', type: 'success' });
          navigate('/Dashboard');
        } catch {
          // Confirmação de e-mail obrigatória
          toast({
            message: '✉️ Conta criada! Verifique seu e-mail para confirmar o cadastro.',
            type: 'success',
          });
          navigate(createPageUrl('Login'));
        }
        return;
      }

      toast({ message: 'Erro inesperado. Tente novamente.', type: 'error' });

    } catch (err) {
      console.error('[Cadastro] erro completo:', err);

      const raw = (err?.message || '').trim();
      const msg = raw.toLowerCase();

      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
        toast({ message: 'Este e-mail já está cadastrado. Faça login.', type: 'error' });
      } else if (msg.includes('password') && msg.includes('short')) {
        toast({ message: 'Senha muito curta. Use no mínimo 8 caracteres.', type: 'error' });
      } else if (msg.includes('invalid email')) {
        toast({ message: 'E-mail inválido para o servidor. Verifique e tente.', type: 'error' });
      } else {
        toast({ message: raw || 'Erro ao criar conta. Tente novamente.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const progress = ((step - 1) / 2) * 100;
  const emailInlineError = form.email.length > 5 && !isValidEmail(form.email)
    ? 'Formato inválido. Ex: nome@email.com' : '';

  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif', color: '#F8FAFC', padding: '2rem 1rem', position: 'relative', overflow: 'hidden' }}>
      {[{ top: '-200px', left: '-150px', c: 'rgba(59,130,246,.12)' }, { bottom: '-100px', right: '-100px', c: 'rgba(139,92,246,.1)' }].map((o, i) => (
        <div key={i} style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: o.c, filter: 'blur(100px)', top: o.top, left: o.left, bottom: o.bottom, right: o.right, pointerEvents: 'none' }} />
      ))}

      <div style={{ width: '100%', maxWidth: '520px', position: 'relative', zIndex: 2 }}>
        {/* Logo */}
        <Link to={createPageUrl('LandingPage')} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', textDecoration: 'none', color: 'inherit', fontWeight: 900, fontSize: '1.1rem', marginBottom: '2rem', justifyContent: 'center' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🤖</div>
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
              <Input label="Nome completo *" type="text" value={form.full_name} onChange={e => upd('full_name', e.target.value)} placeholder="Seu nome" icon="👤" />
              <Input label="E-mail *" type="text" inputMode="email" autoComplete="email" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="seu@email.com" icon="✉️" error={emailInlineError} />
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
                      <span style={{ fontWeight: 900, fontSize: '1rem', color: plan.color }}>{plan.price}<span style={{ fontSize: '.7rem', color: '#64748B' }}> {plan.period}</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                      {plan.features.slice(0, 3).map(f => <span key={f} style={{ fontSize: '.68rem', color: '#94A3B8', background: 'rgba(255,255,255,.05)', padding: '.15rem .45rem', borderRadius: '6px' }}>✓ {f}</span>)}
                    </div>
                  </div>
                  {form.plan === plan.id && <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: plan.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', color: 'white', flexShrink: 0 }}>✓</div>}
                </div>
              ))}

              {/* Resumo — lê do ref para garantir o mesmo valor enviado */}
              <div style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.15)', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ fontSize: '.78rem', color: '#64748B', marginBottom: '.5rem', fontWeight: 600 }}>📋 Resumo</div>
                {[
                  { l: 'Nome',    v: formRef.current.full_name },
                  { l: 'E-mail',  v: cleanEmail(formRef.current.email) },
                  { l: 'Empresa', v: formRef.current.company },
                  { l: 'Plano',   v: formRef.current.plan },
                ].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: '.25rem' }}>
                    <span style={{ color: '#64748B' }}>{r.l}</span>
                    <span style={{ color: '#CBD5E1', fontWeight: 600 }}>{r.v || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões */}
          <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem' }}>
            {step > 1 && (
              <button type="button" onClick={() => setStep(p => p - 1)} style={{ flex: 1, padding: '.8rem', borderRadius: '10px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: '#94A3B8', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '.88rem' }}>
                ← Voltar
              </button>
            )}
            <Button onClick={nextStep} loading={loading} style={{ flex: 1, justifyContent: 'center', padding: '.8rem', fontSize: '.92rem' }}>
              {step < 3 ? 'Continuar →' : loading ? 'Criando conta...' : 'Criar conta grátis 🚀'}
            </Button>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '.85rem', color: '#64748B' }}>
          Já tem conta?{' '}
          <Link to={createPageUrl('Login')} style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 700 }}>Fazer login →</Link>
        </div>
      </div>
    </div>
  );
}
