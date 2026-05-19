# GVP BOT — Setup Guide

## 1. Variáveis de Ambiente (Vercel)

```
VITE_SUPABASE_URL=https://ypeqnvmaenlnlxmotbrr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_MP_ACCESS_TOKEN=APP_USR-...   ← Mercado Pago Access Token (produção)
VITE_APP_URL=https://gvpbot.vercel.app
```

## 2. Banco de Dados Supabase

Execute o SQL abaixo no **SQL Editor** do Supabase (https://supabase.com/dashboard → seu projeto → SQL Editor):

```sql
-- TABELA: user_configs
CREATE TABLE IF NOT EXISTS public.user_configs (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  openrouter_key  text,
  ai_model        text DEFAULT 'mistralai/mistral-7b-instruct:free',
  system_prompt   text,
  ai_enabled      boolean DEFAULT true,
  temperature     numeric DEFAULT 0.7,
  timezone        text DEFAULT 'America/Sao_Paulo',
  theme           text DEFAULT 'dark',
  notifications   jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
ALTER TABLE public.user_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_configs_own" ON public.user_configs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TABELA: subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id       text NOT NULL,
  payment_id    text,
  amount        numeric,
  status        text DEFAULT 'pending',
  expires_at    timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_own" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TABELA: whatsapp_instances
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name            text NOT NULL,
  evolution_url   text,
  evolution_key   text,
  instance_name   text,
  status          text DEFAULT 'disconnected',
  phone_number    text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whatsapp_instances_own" ON public.whatsapp_instances
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TABELA: messages
CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  instance_id     uuid REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  from_number     text,
  to_number       text,
  body            text,
  direction       text DEFAULT 'in',
  status          text DEFAULT 'received',
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_own" ON public.messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TRIGGERS updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_configs_updated_at BEFORE UPDATE ON public.user_configs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER whatsapp_instances_updated_at BEFORE UPDATE ON public.whatsapp_instances FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

## 3. Mercado Pago

1. Crie uma conta em mercadopago.com.br
2. Vá em Seu negócio → Credenciais
3. Copie o **Access Token de produção**
4. Adicione como `VITE_MP_ACCESS_TOKEN` no Vercel

## 4. OpenRouter (IA)

1. Crie conta em openrouter.ai
2. Vá em Keys e crie uma API Key
3. Configure na página IA do painel (salva no Supabase por usuário)
4. Modelos gratuitos disponíveis: Mistral 7B, Llama 3, Phi-3, Gemma 3

## 5. Evolution API (WhatsApp)

1. Instale ou use um servidor Evolution API
2. Configure URL e API Key na página WhatsApp do painel
3. Clique em Conectar para gerar o QR Code
