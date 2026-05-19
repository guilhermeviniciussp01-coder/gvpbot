-- ============================================================
-- GVP BOT — Migration completa v2
-- Execute no Supabase → SQL Editor
-- ============================================================

-- 1. whatsapp_instances
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          TEXT NOT NULL,
  evolution_url TEXT NOT NULL,
  evolution_key TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  webhook_token TEXT,
  status        TEXT DEFAULT 'disconnected',
  phone_number  TEXT,
  ai_enabled    BOOLEAN DEFAULT TRUE,        -- IA ativa por instância
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. user_configs
CREATE TABLE IF NOT EXISTS public.user_configs (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  openrouter_key TEXT,
  ai_model       TEXT DEFAULT 'mistralai/mistral-7b-instruct:free',
  system_prompt  TEXT DEFAULT 'Você é um atendente profissional brasileiro. Responda em português, seja cordial e objetivo.',
  ai_enabled     BOOLEAN DEFAULT TRUE,
  temperature    FLOAT DEFAULT 0.7,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 3. message_logs
CREATE TABLE IF NOT EXISTS public.message_logs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  instance_id  UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  from_number  TEXT NOT NULL,
  message_in   TEXT,
  ai_reply     TEXT,
  status       TEXT DEFAULT 'received',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ai_usage_logs
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  model       TEXT,
  tokens_used INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Adicionar ai_enabled se a tabela já existir (safe migration)
-- ============================================================
ALTER TABLE public.whatsapp_instances
  ADD COLUMN IF NOT EXISTS ai_enabled    BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS webhook_token TEXT,
  ADD COLUMN IF NOT EXISTS phone_number  TEXT;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.whatsapp_instances  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_configs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_own_whatsapp"      ON public.whatsapp_instances;
DROP POLICY IF EXISTS "user_own_configs"       ON public.user_configs;
DROP POLICY IF EXISTS "user_own_message_logs"  ON public.message_logs;
DROP POLICY IF EXISTS "user_own_ai_logs"       ON public.ai_usage_logs;

CREATE POLICY "user_own_whatsapp"     ON public.whatsapp_instances FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_configs"      ON public.user_configs        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_message_logs" ON public.message_logs        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_ai_logs"      ON public.ai_usage_logs       FOR ALL USING (auth.uid() = user_id);

-- Service role bypass (para o webhook usar sem JWT)
CREATE POLICY "service_insert_message_logs" ON public.message_logs
  FOR INSERT WITH CHECK (true);
CREATE POLICY "service_insert_ai_logs" ON public.ai_usage_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user    ON public.whatsapp_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_name    ON public.whatsapp_instances(instance_name);
CREATE INDEX IF NOT EXISTS idx_message_logs_user          ON public.message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_instance      ON public.message_logs(instance_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_created       ON public.message_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user         ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created      ON public.ai_usage_logs(created_at DESC);
