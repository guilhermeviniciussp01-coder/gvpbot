// Stub — substituído pelo Supabase
import { supabase } from '@/api/supabaseClient';

export const auth = {
  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('not logged in');
    return {
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
      email: user.email || '',
      phone: user.user_metadata?.phone || '',
      company_name: user.user_metadata?.company_name || '',
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
