-- ============================================================
-- GVP BOT — Migration: Funcionalidades reais
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela whatsapp_instances (atualizar com campos novos)
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          TEXT NOT NULL,
  evolution_url TEXT NOT NULL,
  evolution_key TEXT NOT NULL,           -- criptografado (enc:...)
  instance_name TEXT NOT NULL,
  webhook_token TEXT,                    -- token único para verificar autenticidade
  status        TEXT DEFAULT 'disconnected',
  phone_number  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela user_configs (atualizar)
CREATE TABLE IF NOT EXISTS public.user_configs (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  openrouter_key TEXT,                   -- criptografado (enc:...)
  ai_model       TEXT DEFAULT 'mistralai/mistral-7b-instruct:free',
  system_prompt  TEXT DEFAULT 'Você é um atendente profissional brasileiro. Responda em português, seja cordial e objetivo.',
  ai_enabled     BOOLEAN DEFAULT TRUE,
  temperature    FLOAT DEFAULT 0.7,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Logs de mensagens recebidas/respondidas
CREATE TABLE IF NOT EXISTS public.message_logs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  instance_id  UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  from_number  TEXT NOT NULL,
  message_in   TEXT,
  ai_reply     TEXT,
  status       TEXT DEFAULT 'received',  -- received | replied | error
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Logs de uso da IA
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  model       TEXT,
  tokens_used INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY — dados isolados por usuário
-- ============================================================

ALTER TABLE public.whatsapp_instances  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_configs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs       ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário só vê os próprios dados
DROP POLICY IF EXISTS "user_own_whatsapp" ON public.whatsapp_instances;
CREATE POLICY "user_own_whatsapp" ON public.whatsapp_instances
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_own_configs" ON public.user_configs;
CREATE POLICY "user_own_configs" ON public.user_configs
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_own_message_logs" ON public.message_logs;
CREATE POLICY "user_own_message_logs" ON public.message_logs
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_own_ai_logs" ON public.ai_usage_logs;
CREATE POLICY "user_own_ai_logs" ON public.ai_usage_logs
  FOR ALL USING (auth.uid() = user_id);

-- Webhook pode inserir logs sem JWT (via service role)
-- (o webhook usa SUPABASE_SERVICE_ROLE_KEY, não anon key)

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user    ON public.whatsapp_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_name    ON public.whatsapp_instances(instance_name);
CREATE INDEX IF NOT EXISTS idx_message_logs_user          ON public.message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_created       ON public.message_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user         ON public.ai_usage_logs(user_id);

-- ============================================================
-- DONE ✓
-- ============================================================
