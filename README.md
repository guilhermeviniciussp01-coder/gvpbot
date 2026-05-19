<div align="center">
  <h1>🤖 GVP BOT</h1>
  <p><strong>SaaS de automação WhatsApp com IA</strong></p>
  <p>React + Evolution API + OpenRouter + Supabase + PagBank + Vercel</p>

  <img src="https://img.shields.io/badge/version-3.0.0-blue" />
  <img src="https://img.shields.io/badge/deploy-Vercel-black" />
  <img src="https://img.shields.io/badge/db-Supabase-green" />
  <img src="https://img.shields.io/badge/IA-OpenRouter-orange" />
</div>

---

## 🚀 Demo

**https://gvpbot.vercel.app**

---

## 📋 Sumário

- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Como configurar](#como-configurar)
  - [1. Supabase (banco de dados)](#1-supabase)
  - [2. Evolution API (WhatsApp)](#2-evolution-api-whatsapp)
  - [3. OpenRouter (IA)](#3-openrouter-ia)
  - [4. PagBank (pagamentos)](#4-pagbank-pagamentos)
  - [5. Vercel (deploy)](#5-vercel-deploy)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Webhook do WhatsApp](#-webhook-do-whatsapp)
- [Segurança](#-segurança)

---

## Funcionalidades

| Feature | Status |
|---|---|
| Login / Cadastro com Supabase Auth | ✅ |
| Dashboard com métricas reais | ✅ |
| QR Code real via Evolution API | ✅ |
| Resposta automática com IA (OpenRouter) | ✅ |
| Webhook WhatsApp verificado por token | ✅ |
| API Keys criptografadas no banco | ✅ |
| Row Level Security — dados isolados por usuário | ✅ |
| Rate limiting nas rotas de API | ✅ |
| Logs de mensagens com filtros e export CSV | ✅ |
| Gráficos de uso de tokens e mensagens | ✅ |
| Toggle de IA por instância WhatsApp | ✅ |
| CRM de Leads | ✅ |
| Automações | ✅ |
| Planos + pagamento via PagBank | ✅ |
| Deploy automático no GitHub → Vercel | ✅ |

---

## Arquitetura

```
gvpbot/
├── src/
│   ├── pages/
│   │   ├── Dashboard.jsx    # Métricas reais do Supabase
│   │   ├── WhatsApp.jsx     # QR Code + webhook URL + token
│   │   ├── IA.jsx           # Config OpenRouter + gráficos + toggle por instância
│   │   ├── Logs.jsx         # Histórico de mensagens + filtros + CSV
│   │   ├── Chat.jsx
│   │   ├── Leads.jsx
│   │   ├── CRM.jsx
│   │   ├── Analytics.jsx
│   │   ├── Planos.jsx
│   │   └── Configuracoes.jsx
│   └── api/
│       └── supabaseClient.js  # Auth + CRUD + criptografia de keys
├── api/
│   ├── whatsapp-webhook.js  # Webhook Evolution API + rate limiting + IA automática
│   ├── ai-proxy.js          # Proxy seguro para OpenRouter (JWT obrigatório)
│   └── pagbank-webhook.js   # Webhook de pagamento PagBank
└── supabase/
    └── migration.sql        # Todas as tabelas + RLS + índices
```

---

## Como configurar

### 1. Supabase

1. Crie um projeto em **https://supabase.com**
2. Vá em **SQL Editor** e execute o arquivo `supabase/migration.sql` deste repositório
3. Copie as credenciais em **Project Settings → API**:
   - `URL` → `VITE_SUPABASE_URL`
   - `anon public` → `VITE_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` *(nunca exponha essa no frontend!)*

> A migration cria as tabelas `whatsapp_instances`, `user_configs`, `message_logs`, `ai_usage_logs` com Row Level Security ativado.

---

### 2. Evolution API (WhatsApp)

A Evolution API é um servidor open source que conecta WhatsApp via Baileys.

#### Opção A — Self-hosted (recomendado)

```bash
# Com Docker
docker run -d \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua_api_key_aqui \
  -e DATABASE_ENABLED=true \
  --name evolution-api \
  atendai/evolution-api:latest
```

#### Opção B — Deploy no Railway / Render

- Acesse **https://railway.app** e faça deploy da imagem `atendai/evolution-api`
- Defina `AUTHENTICATION_API_KEY` nas variáveis de ambiente

#### Configurando o webhook

Após criar uma instância no GVP BOT, vá em **WhatsApp → sua instância → Webhook & Token** e copie:

- **URL**: `https://gvpbot.vercel.app/api/whatsapp-webhook?instance=NOME_DA_INSTANCIA`
- **Token**: gerado automaticamente (use como header `x-webhook-token`)

Na interface da Evolution API (ou via API REST):

```bash
curl -X POST https://SUA_EVOLUTION/webhook/set/NOME_DA_INSTANCIA \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://gvpbot.vercel.app/api/whatsapp-webhook?instance=NOME_DA_INSTANCIA",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": ["MESSAGES_UPSERT"],
    "headers": {
      "x-webhook-token": "SEU_WEBHOOK_TOKEN"
    }
  }'
```

---

### 3. OpenRouter (IA)

1. Crie conta em **https://openrouter.ai**
2. Gere uma API Key em **https://openrouter.ai/keys**
3. No GVP BOT, vá em **IA → Configurações** e cole sua API Key
4. Escolha um modelo gratuito (Mistral 7B, Llama 3 8B, etc.)
5. Personalize o **Prompt do sistema** para o seu negócio
6. Ative a IA globalmente e por instância WhatsApp

> **Modelos gratuitos disponíveis:**
> - `mistralai/mistral-7b-instruct:free`
> - `meta-llama/llama-3-8b-instruct:free`
> - `microsoft/phi-3-mini-128k-instruct:free`
> - `google/gemma-3-1b-it:free`

---

### 4. PagBank (pagamentos)

1. Crie conta em **https://pagseguro.uol.com.br**
2. Acesse **Minha Conta → Preferências → Integrações → Token**
3. Gere seu token de produção
4. Configure a variável `PAGBANK_TOKEN` no Vercel
5. Configure o webhook de notificações no painel do PagBank:
   - URL: `https://gvpbot.vercel.app/api/pagbank-webhook`

---

### 5. Vercel (deploy)

O deploy é automático via GitHub. A cada push na branch `main`, o Vercel faz um novo deploy.

**Setup inicial:**
1. Acesse **https://vercel.com** e conecte sua conta GitHub
2. Importe o repositório `gvpbot`
3. Configure as variáveis de ambiente (seção abaixo)
4. Clique em **Deploy**

---

## 🔐 Variáveis de ambiente

Configure todas no **Vercel → seu projeto → Settings → Environment Variables**:

### Frontend (VITE_*)
| Variável | Descrição | Exemplo |
|---|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chave pública do Supabase | `eyJhbGciOiJIUzI1NiIs...` |
| `VITE_ENCRYPTION_SECRET` | Segredo para criptografar API Keys | `minha-senha-super-secreta-2024` |
| `VITE_APP_URL` | URL do app em produção | `https://gvpbot.vercel.app` |

### Backend (serverless functions)
| Variável | Descrição | Exemplo |
|---|---|---|
| `SUPABASE_URL` | Mesma URL do Supabase | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave **service_role** (secreta!) | `eyJhbGciOiJIUzI1NiIs...` |
| `ENCRYPTION_SECRET` | Mesmo valor de `VITE_ENCRYPTION_SECRET` | `minha-senha-super-secreta-2024` |
| `PAGBANK_TOKEN` | Token da API PagBank | `sua-token-pagbank` |
| `WEBHOOK_SECRET` | Fallback de segurança para webhooks | `webhook-secret-123` |

> ⚠️ **NUNCA** commite o arquivo `.env` no repositório. Use sempre o painel do Vercel.

---

## 🔗 Webhook do WhatsApp

O endpoint `/api/whatsapp-webhook` recebe mensagens da Evolution API e:

1. **Verifica o token** (`x-webhook-token`) para garantir autenticidade
2. **Rate limiting** — máx 30 req/min por IP
3. **Busca a configuração** de IA do usuário dono da instância
4. **Chama o OpenRouter** para gerar uma resposta automática
5. **Envia a resposta** via Evolution API
6. **Salva o log** na tabela `message_logs` do Supabase

### Fluxo completo:

```
WhatsApp → Evolution API → /api/whatsapp-webhook → OpenRouter → Evolution API → WhatsApp
                                                        ↓
                                               Supabase (message_logs)
```

---

## 🛡️ Segurança

| Medida | Implementação |
|---|---|
| Row Level Security | Ativo em todas as tabelas — usuário só vê seus próprios dados |
| API Keys criptografadas | XOR + Base64 antes de salvar no banco |
| Webhook token | UUID único por instância, verificado antes de processar |
| JWT obrigatório | `/api/ai-proxy` exige token Supabase válido |
| Rate limiting | 30 req/min por IP no webhook; 20 req/min por usuário no proxy IA |
| Service Role | Usada apenas no servidor (nunca no frontend) |
| Segredos no Vercel | Nunca no código ou `.env` commitado |

---

## 📊 Banco de dados

### Tabelas

| Tabela | Descrição |
|---|---|
| `whatsapp_instances` | Instâncias WhatsApp de cada usuário |
| `user_configs` | Configurações de IA (API Key criptografada, modelo, prompt) |
| `message_logs` | Histórico de mensagens recebidas e respondidas |
| `ai_usage_logs` | Uso de tokens por usuário/dia |
| `leads` | Leads capturados |
| `subscriptions` | Assinaturas de planos |

---

## 🧑‍💻 Desenvolvimento local

```bash
# Clonar
git clone https://github.com/guilhermeviniciussp01-coder/gvpbot.git
cd gvpbot

# Instalar dependências
npm install

# Criar .env.local (baseado em .env.example)
cp .env.example .env.local
# Preencher as variáveis...

# Rodar em modo desenvolvimento
npm run dev
```

---

## 📞 Suporte

- Issues: https://github.com/guilhermeviniciussp01-coder/gvpbot/issues

---

<div align="center">
  <p>Feito com ❤️ por <strong>Guilherme Vinícius</strong></p>
</div>
