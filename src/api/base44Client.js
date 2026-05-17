// Stub — substituído pelo Supabase
import { supabase } from '@/supabaseClient';

export const auth = {
  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('not logged in');
    return {
      full_name: user.user_metadata?.full_name || user.email,
      email: user.email,
      plan: user.user_metadata?.plano || 'trial',
      plan_status: 'active',
      is_admin: false,
    };
  },
  logout: async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  },
};

export const base44 = { auth };
export default { auth };
