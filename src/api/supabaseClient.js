import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  return data || {};
}

export async function saveUserConfig(config) {
  const user = await getUser();
  if (!user) throw new Error('Não autenticado');
  const { data: existing } = await supabase
    .from('user_configs')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('user_configs')
      .update({ ...config, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('user_configs')
      .insert({ user_id: user.id, ...config });
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
  return data || [];
}

export async function saveWhatsappInstance(instance) {
  const user = await getUser();
  if (!user) throw new Error('Não autenticado');
  if (instance.id) {
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({ ...instance, updated_at: new Date().toISOString() })
      .eq('id', instance.id)
      .eq('user_id', user.id);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .insert({ ...instance, user_id: user.id, created_at: new Date().toISOString() })
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
