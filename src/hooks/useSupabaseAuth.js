import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

/**
 * Hook que expõe { user, session, loading } e reage a mudanças de auth.
 */
export function useSupabaseAuth() {
  const [session, setSession] = useState(null);
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carrega sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuta mudanças (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading };
}
