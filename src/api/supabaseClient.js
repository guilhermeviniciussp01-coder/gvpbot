import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'gvpbot-auth', // chave única — evita conflito com outros apps Supabase
  },
});

export async function signUp({ email, password, full_name, company_name, phone }) {
  // Garante logout antes de criar nova conta
  await supabase.auth.signOut();
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

export async function signIn(email, password) {
  // Garante logout antes de novo login — força sessão limpa
  await supabase.auth.signOut();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getUser() {
  // Sempre vai ao servidor — nunca usa cache
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
