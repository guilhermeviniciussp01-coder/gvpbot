import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidos.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken:    true,
    persistSession:      true,
    detectSessionInUrl:  true,
    storageKey:          'gvpbot_session',
  },
});

// ── Helpers de auth ─────────────────────────────────────────────────────────

/**
 * Cadastro: cria conta com email/senha + metadados extras
 */
export async function signUp({ email, password, full_name, company_name, phone }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, company_name, phone },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Login com email/senha
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Logout
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Sessão atual (síncrona)
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Usuário atual
 */
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
