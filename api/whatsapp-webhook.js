// api/whatsapp-webhook.js
// Webhook Evolution API — com verificação, rate limiting e resposta automática via IA
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Rate limiting simples em memória (por IP) ─────────────────────────────────
const rateLimitMap = new Map();
function checkRateLimit(ip, maxReq = 30, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return true;
  }
  if (entry.count >= maxReq) return false;
  entry.count++;
  rateLimitMap.set(ip, entry);
  return true;
}

// ── Descriptografar API key do banco ─────────────────────────────────────────
function decryptKey(encrypted) {
  if (!encrypted) return null;
  if (!encrypted.startsWith('enc:')) return encrypted; // não criptografado (legado)
  const secret = process.env.ENCRYPTION_SECRET || 'gvpbot-secret-2024';
  const encoded = encrypted.slice(4);
  // XOR simples — para produção usar AES via crypto module
  const buf = Buffer.from(encoded, 'base64').toString('utf8');
  let result = '';
  for (let i = 0; i < buf.length; i++) {
    result += String.fromCharCode(buf.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
  }
  return result;
}

// ── Chamar OpenRouter para resposta automática ────────────────────────────────
async function getAIReply(userMessage, config) {
  const apiKey = decryptKey(config.openrouter_key);
  if (!apiKey || !config.ai_enabled) return null;

  const model = config.ai_model || 'mistralai/mistral-7b-instruct:free';
  const systemPrompt = config.system_prompt || 'Você é um atendente profissional brasileiro. Responda em português, seja cordial e objetivo.';

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.VITE_APP_URL || 'https://gvpbot.vercel.app',
        'X-Title': 'GVP BOT',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: config.temperature || 0.7,
        max_tokens: 400,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error('[AI Error]', err.message);
    return null;
  }
}

// ── Enviar mensagem via Evolution API ────────────────────────────────────────
async function sendWhatsAppReply(instance, to, text) {
  const apiKey = decryptKey(instance.evolution_key);
  const url = `${instance.evolution_url}/message/sendText/${instance.instance_name}`;
  const number = to.includes('@') ? to : `${to}@s.whatsapp.net`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
    },
    body: JSON.stringify({ number, textMessage: { text } }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Evolution API error: ${err}`);
  }
  return res.json();
}

// ── Salvar log no Supabase ────────────────────────────────────────────────────
async function saveMessageLog(userId, instanceId, from, message, aiReply, status) {
  await supabase.from('message_logs').insert({
    user_id: userId,
    instance_id: instanceId,
    from_number: from,
    message_in: message,
    ai_reply: aiReply,
    status,
    created_at: new Date().toISOString(),
  });
}

// ── Handler principal ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

  // Rate limiting
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Apenas POST aceito
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Verificar token de autenticidade ──────────────────────────────────────
  const webhookToken = req.headers['x-webhook-token'] || req.query.token;
  const instanceName = req.query.instance || req.body?.instance;

  if (!instanceName) {
    return res.status(400).json({ error: 'Instance name required' });
  }

  // Buscar instância no banco (sem filtrar por user ainda — precisamos achar pelo instance_name)
  const { data: instance, error: instErr } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('instance_name', instanceName)
    .single();

  if (instErr || !instance) {
    console.error('[Webhook] Instance not found:', instanceName);
    return res.status(404).json({ error: 'Instance not found' });
  }

  // Verificar token do webhook
  const expectedToken = instance.webhook_token || process.env.WEBHOOK_SECRET;
  if (expectedToken && webhookToken !== expectedToken) {
    console.warn('[Webhook] Invalid token for instance:', instanceName);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body;
  const event = body?.event;

  // Apenas processar mensagens recebidas
  if (event !== 'messages.upsert') {
    return res.status(200).json({ ok: true, event, processed: false });
  }

  const msgData = body?.data?.messages?.[0];
  if (!msgData || msgData.key?.fromMe) {
    // Ignorar mensagens enviadas pelo próprio bot
    return res.status(200).json({ ok: true, processed: false });
  }

  const from = msgData.key?.remoteJid || '';
  const messageText = msgData.message?.conversation
    || msgData.message?.extendedTextMessage?.text
    || '';

  if (!messageText || !from) {
    return res.status(200).json({ ok: true, processed: false });
  }

  console.log(`[Webhook] Nova mensagem de ${from}: "${messageText.substring(0, 50)}..."`);

  // Buscar configuração de IA do usuário dono da instância
  const { data: userConfig } = await supabase
    .from('user_configs')
    .select('*')
    .eq('user_id', instance.user_id)
    .single();

  let aiReply = null;
  let status = 'received';

  if (userConfig?.ai_enabled && userConfig?.openrouter_key) {
    try {
      aiReply = await getAIReply(messageText, userConfig);
      if (aiReply) {
        await sendWhatsAppReply(instance, from, aiReply);
        status = 'replied';
        console.log(`[Webhook] Respondido para ${from}: "${aiReply.substring(0, 50)}..."`);
      }
    } catch (err) {
      console.error('[Webhook] Erro ao responder:', err.message);
      status = 'error';
    }
  }

  // Salvar log
  await saveMessageLog(instance.user_id, instance.id, from, messageText, aiReply, status);

  return res.status(200).json({ ok: true, processed: true, replied: !!aiReply });
}
