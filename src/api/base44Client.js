import { createClient } from "@base44/sdk";

export const base44 = createClient({
  appId: import.meta.env.VITE_PUBLIC_APP_ID || "69fbe82a51109cbe9b3d7f90",
});

export const auth = base44.auth;
