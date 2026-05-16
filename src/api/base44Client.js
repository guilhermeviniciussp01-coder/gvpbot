// Stub — substituído pelo Supabase
export const auth = {
  me: () => Promise.reject(new Error('use supabase')),
  logout: () => Promise.resolve(),
};
export const base44 = { auth };
export default { auth };
