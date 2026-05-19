import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── CRIPTOGRAFIA SIMPLES (XOR) — API Keys nunca ficam em plain text ──────────
const ENCRYPTION_SECRET = import.meta.env.VITE_ENCRYPTION_SECRET || 'gvpbot-secret-2024';

export function encryptKey(plainText) {
  if (!plainText) return '';
  if (plainText.startsWith('enc:')) return plainText; // já criptografado
  let result = '';
  for (let i = 0; i < plainText.length; i++) {
    result += String.fromCharCode(
      plainText.charCodeAt(i) ^ ENCRYPTION_SECRET.charCodeAt(i % ENCRYPTION_SECRET.length)
    );
  }
  return 'enc:' + btoa(result);
}

export function decryptKey(encrypted) {
  if (!encrypted) return '';
  if (!encrypted.startsWith('enc:')) return encrypted; // legado plain text
  const buf = atob(encrypted.slice(4));
  let result = '';
  for (let i = 0; i < buf.length; i++) {
    result += String.fromCharCode(
      buf.charCodeAt(i) ^ ENCRYPTION_SECRET.charCodeAt(i % ENCRYPTION_SECRET.length)
    );
  }
  return result;
}

// ── AUTH ──────────────────────────────────────────────────────────────────────

export async function signUp({ email, password, full_name, company_name, phone }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, company_name, phone } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// ── USER CONFIG (tabela user_configs) ────────────────────────────────────────

export async function getUserConfig() {
  const user = await getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('user_configs')
    .select('*')
    .eq('user_id', user.id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  // Descriptografar keys ao retornar para o frontend
  if (data?.openrouter_key) {
    data.openrouter_key_display = decryptKey(data.openrouter_key);
  }
  return data || {};
}

export async function saveUserConfig(config) {
  const user = await getUser();
  if (!user) throw new Error('Não autenticado');

  // Criptografar API key antes de salvar
  const toSave = { ...config };
  if (toSave.openrouter_key && !toSave.openrouter_key.startsWith('enc:')) {
    toSave.openrouter_key = encryptKey(toSave.openrouter_key);
  }

  const { data: existing } = await supabase
    .from('user_configs')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('user_configs')
      .update({ ...toSave, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('user_configs')
      .insert({ user_id: user.id, ...toSave });
    if (error) throw error;
  }
}

// ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────────

export async function getUserSubscription() {
  const user = await getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') return null;
  return data;
}

export async function createSubscription(planId, paymentId, amount) {
  const user = await getUser();
  if (!user) throw new Error('Não autenticado');
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      plan_id: planId,
      payment_id: paymentId,
      amount,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── WHATSAPP INSTANCES ────────────────────────────────────────────────────────

export async function getWhatsappInstances() {
  const user = await getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  // Descriptografar keys para exibição
  return (data || []).map(inst => ({
    ...inst,
    evolution_key_display: decryptKey(inst.evolution_key),
  }));
}

export async function saveWhatsappInstance(instance) {
  const user = await getUser();
  if (!user) throw new Error('Não autenticado');

  // Criptografar a API key
  const toSave = { ...instance };
  if (toSave.evolution_key && !toSave.evolution_key.startsWith('enc:')) {
    toSave.evolution_key = encryptKey(toSave.evolution_key);
  }
  // Gerar webhook_token único se for nova instância
  if (!toSave.id && !toSave.webhook_token) {
    toSave.webhook_token = crypto.randomUUID();
  }

  if (toSave.id) {
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({ ...toSave, updated_at: new Date().toISOString() })
      .eq('id', toSave.id)
      .eq('user_id', user.id);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .insert({ ...toSave, user_id: user.id, created_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteWhatsappInstance(id) {
  const user = await getUser();
  if (!user) throw new Error('Não autenticado');
  const { error } = await supabase
    .from('whatsapp_instances')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw error;
}

// ── MESSAGE LOGS ──────────────────────────────────────────────────────────────

export async function getMessageLogs(instanceId, limit = 50) {
  const user = await getUser();
  if (!user) return [];
  const query = supabase
    .from('message_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (instanceId) query.eq('instance_id', instanceId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ── AI PROXY — chama /api/ai-proxy com JWT ────────────────────────────────────

export async function callAIProxy({ messages, model, temperature, max_tokens }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Não autenticado');

  const res = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ messages, model, temperature, max_tokens }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro no proxy de IA');
  return data;
}
