// api/ai-proxy.js
// Proxy seguro para OpenRouter — a API Key fica só no servidor
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Rate limiting por user_id
const rateLimitMap = new Map();
function checkRateLimit(userId, maxReq = 20, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimitMap.get(userId) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    rateLimitMap.set(userId, { count: 1, start: now });
    return true;
  }
  if (entry.count >= maxReq) return false;
  entry.count++;
  rateLimitMap.set(userId, entry);
  return true;
}

function decryptKey(encrypted) {
  if (!encrypted) return null;
  if (!encrypted.startsWith('enc:')) return encrypted;
  const secret = process.env.ENCRYPTION_SECRET || 'gvpbot-secret-2024';
  const buf = Buffer.from(encrypted.slice(4), 'base64').toString('utf8');
  let result = '';
  for (let i = 0; i < buf.length; i++) {
    result += String.fromCharCode(buf.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
  }
  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verificar autenticação Supabase via JWT
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Rate limiting por usuário
  if (!checkRateLimit(user.id)) {
    return res.status(429).json({ error: 'Too many requests. Aguarde 1 minuto.' });
  }

  const { messages, model, temperature, max_tokens } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  // Buscar API key do usuário no banco
  const { data: config } = await supabase
    .from('user_configs')
    .select('openrouter_key, ai_model, system_prompt, ai_enabled')
    .eq('user_id', user.id)
    .single();

  if (!config?.openrouter_key) {
    return res.status(400).json({ error: 'Configure sua API Key do OpenRouter primeiro' });
  }

  const apiKey = decryptKey(config.openrouter_key);
  const finalModel = model || config.ai_model || 'mistralai/mistral-7b-instruct:free';

  try {
    const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.VITE_APP_URL || 'https://gvpbot.vercel.app',
        'X-Title': 'GVP BOT',
      },
      body: JSON.stringify({
        model: finalModel,
        messages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 500,
      }),
    });

    const data = await orRes.json();

    // Salvar log de uso
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      model: finalModel,
      tokens_used: data.usage?.total_tokens || 0,
      created_at: new Date().toISOString(),
    });

    return res.status(orRes.status).json(data);
  } catch (err) {
    console.error('[AI Proxy Error]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
