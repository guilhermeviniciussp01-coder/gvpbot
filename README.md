# 🤖 GVP BOT

> SaaS de automação para WhatsApp e Instagram com Inteligência Artificial

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Base44](https://img.shields.io/badge/Base44-SDK-3B82F6?style=flat-square)](https://base44.com)

---

## ✨ Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| 📊 **Dashboard** | KPIs em tempo real, gráficos sparkline, conversas e leads recentes |
| 🟢 **WhatsApp** | Conecte instâncias via Evolution API, QR code, log de eventos |
| 💬 **Chat** | Inbox unificado WhatsApp + Instagram com respostas manuais |
| 🤖 **IA** | OpenRouter GPT-4o/Claude, playground interativo, delay humanizado |
| 🔀 **Automações** | Visual flow builder estilo ManyChat, canvas drag-and-drop |
| 👥 **Leads** | Captura automática, tags, histórico de conversas |
| 🎯 **CRM** | Kanban com drag-and-drop, pipeline de vendas |
| 📈 **Analytics** | Gráficos SVG interativos, exportação CSV, filtro por período |
| 💳 **Planos** | Checkout com Cartão/PIX/Boleto, integração Mercado Pago |
| ⚙️ **Configurações** | Perfil, segurança, API keys, notificações, preferências |
| 🛡️ **Admin** | Painel oculto com gestão de usuários, pagamentos e sistema |

---

## 🚀 Stack

- **Frontend:** React 18 + Vite
- **Backend/DB:** Base44 SDK (entities, auth, storage)
- **WhatsApp:** Evolution API
- **IA:** OpenRouter (GPT-4o, Claude, Gemini, Llama)
- **Pagamentos:** Mercado Pago (PIX, Cartão, Boleto)
- **Design:** Dark mode, glassmorphism, neon blue/purple

---

## 🛠️ Instalação

```bash
# Clone o repositório
git clone https://github.com/guilhermeviniciussp01-coder/gvpbot.git
cd gvpbot

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas chaves

# Inicie o servidor de desenvolvimento
npm run dev
```

---

## 🔑 Variáveis de Ambiente

```env
VITE_PUBLIC_APP_ID=seu_app_id_base44

# Configuradas dentro do painel (Configurações > API Keys):
# - OpenRouter API Key
# - Evolution API URL + Key
# - Mercado Pago Access Token
# - Webhook Secret
```

---

## 📁 Estrutura

```
src/
├── api/
│   ├── base44Client.js     # SDK client
│   └── entities.js         # Todas as entidades do banco
├── components/
│   ├── layout/
│   │   └── Layout.jsx      # Sidebar + Topbar
│   └── ui/
│       ├── AccessGate.jsx  # Trial/PayDue banners
│       ├── Button.jsx
│       ├── Input.jsx       # Input, Select, Textarea, Switch
│       ├── Modal.jsx       # Modal + ConfirmModal
│       ├── Skeleton.jsx
│       └── Toast.jsx
├── lib/
│   └── utils.js            # Helpers (format, mock data, etc.)
├── pages/
│   ├── Admin.jsx
│   ├── Analytics.jsx
│   ├── Automacoes.jsx      # Visual flow builder
│   ├── Cadastro.jsx        # Signup 3 steps
│   ├── Chat.jsx
│   ├── CRM.jsx             # Kanban
│   ├── Configuracoes.jsx   # 6-tab settings
│   ├── Dashboard.jsx
│   ├── IA.jsx              # OpenRouter + Playground
│   ├── LandingPage.jsx
│   ├── Leads.jsx
│   ├── Login.jsx
│   ├── Planos.jsx          # Checkout MP
│   └── WhatsApp.jsx        # Evolution API
├── App.jsx
├── main.jsx                # SEO + global CSS
└── utils.js
```

---

## 🏗️ Entidades (Banco de Dados)

| Entidade | Campos principais |
|----------|-------------------|
| `Lead` | name, phone, email, status, tags, value |
| `Conversation` | lead_id, channel, status, last_message |
| `Message` | conversation_id, sender, content, type |
| `WhatsappInstance` | evolution_api_url, status, qr_code |
| `AiSettings` | openrouter_api_key, model, system_prompt |
| `Automation` | trigger_type, nodes, edges, status |
| `Plan` | name, price_monthly, price_annual, features |
| `Subscription` | user_id, plan_id, status, trial_end |
| `Payment` | amount, method, status, mercadopago_id |

---

## 📸 Design

- **Background:** `#070C18`
- **Primary:** `#3B82F6` (blue)
- **Secondary:** `#8B5CF6` (purple)
- **Success:** `#22C55E` (green)
- **Font:** Inter
- **Style:** Dark mode, glassmorphism, neon accents

---

## 📄 Licença

MIT © 2026 GVP BOT
