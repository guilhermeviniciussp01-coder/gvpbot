// api/pagbank-webhook.js
// Vercel Serverless Function — processa notificações do PagBank
// Rota: POST /api/pagbank-webhook
//
// Variáveis de ambiente necessárias (Vercel → Settings → Environment Variables):
//   SUPABASE_URL          — URL do projeto Supabase
//   SUPABASE_SERVICE_KEY  — service_role key (nunca a anon key — precisa bypassar RLS)
//   PAGBANK_TOKEN         — Token PagBank (para consultar o pagamento na API)

import { createClient } from '@supabase/supabase-js';

// ── Supabase com service_role (bypassa RLS — seguro apenas no servidor) ──────
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_KEY não configurados');
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ── Consultar o pagamento no PagBank para validar e pegar metadados ──────────
async function fetchPagBankOrder(orderId) {
  const token = process.env.PAGBANK_TOKEN;
  const res = await fetch(`https://api.pagseguro.com/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PagBank API erro ${res.status}: ${err}`);
  }
  return res.json();
}

// ── Lógica principal ─────────────────────────────────────────────────────────
async function processWebhook(body) {
  const supabase = getSupabase();

  // PagBank envia: { "id": "ORDE_...", "charges": [...], ... }
  // Também pode vir como notificação de charge: { "id": "CHGE_...", "order": {...} }
  const eventId   = body.id || body.order?.id;
  const eventType = body.type; // ex: "PAYMENT_AUTHORIZED", "PAYMENT_PAID"

  if (!eventId) {
    return { status: 400, message: 'Payload inválido: sem ID' };
  }

  console.log(`[PagBank Webhook] evento: ${eventType} | id: ${eventId}`);

  // Determinar o order_id para consultar
  let orderId = eventId;
  // Se for notificação de charge, pegar o order_id interno
  if (body.order?.id) orderId = body.order.id;
  // Se for charge direta, o id começa com CHGE_
  if (eventId.startsWith('CHGE_') && body.order) orderId = body.order.reference_id || body.order.id;

  // Consultar o pedido completo no PagBank para pegar metadados e status real
  const order = await fetchPagBankOrder(orderId.startsWith('ORDE_') ? orderId : eventId);

  // Verificar se o pagamento foi realmente aprovado
  const charges    = order.charges || [];
  const paidCharge = charges.find(c =>
    c.status === 'PAID' || c.status === 'AUTHORIZED'
  );

  if (!paidCharge) {
    console.log(`[PagBank Webhook] Pagamento não aprovado. Status dos charges:`, charges.map(c => c.status));
    return { status: 200, message: 'Notificação recebida — pagamento ainda não aprovado' };
  }

  // Extrair metadados: plan_id e user_id
  const metadata  = order.metadata || {};
  const planId    = metadata.plan_id;
  const isAnnual  = metadata.annual === 'true';

  // Extrair referência: pode vir no reference_id do order no formato "gvpbot-{planId}-{timestamp}"
  const referenceId = order.reference_id || '';
  const planFromRef = planId || referenceId.split('-')[1]; // fallback

  if (!planFromRef) {
    console.error('[PagBank Webhook] Não foi possível determinar o plan_id');
    return { status: 200, message: 'plan_id não encontrado no pedido' };
  }

  // ── 1. Buscar a subscription pendente pelo payment_id (checkout id) ──────
  const { data: subscriptions, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('payment_id', order.id)
    .eq('status', 'pending')
    .limit(1);

  if (fetchError) throw fetchError;

  const sub = subscriptions?.[0];

  if (!sub) {
    console.log(`[PagBank Webhook] Nenhuma subscription pendente encontrada para order: ${order.id}`);
    // Pode ter chegado antes do registro — retornar 200 para PagBank não retentar
    return { status: 200, message: 'Subscription não encontrada (pode já ter sido processada)' };
  }

  // ── 2. Calcular expiração (30 dias mensal / 365 dias anual) ──────────────
  const now       = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + (isAnnual ? 365 : 30));

  // ── 3. Atualizar subscription para "active" ───────────────────────────────
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status:     'active',
      plan_id:    planFromRef,
      expires_at: expiresAt.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', sub.id);

  if (subError) throw subError;
  console.log(`[PagBank Webhook] Subscription ${sub.id} → active | expira: ${expiresAt.toISOString()}`);

  // ── 4. Atualizar user_metadata no Supabase Auth com o plano ──────────────
  const { error: userError } = await supabase.auth.admin.updateUserById(sub.user_id, {
    user_metadata: { plano: planFromRef },
  });

  if (userError) {
    // Não é fatal — loga mas continua
    console.error(`[PagBank Webhook] Aviso: erro ao atualizar user_metadata: ${userError.message}`);
  } else {
    console.log(`[PagBank Webhook] user_metadata.plano = "${planFromRef}" para user ${sub.user_id}`);
  }

  // ── 5. Cancelar outras subscriptions antigas do mesmo usuário ─────────────
  const { error: cancelError } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', updated_at: now.toISOString() })
    .eq('user_id', sub.user_id)
    .eq('status', 'active')
    .neq('id', sub.id); // não cancelar a que acabou de ativar

  if (cancelError) console.error(`[PagBank Webhook] Aviso ao cancelar subscriptions antigas:`, cancelError.message);

  return {
    status: 200,
    message: `✅ Subscription ativada | Plano: ${planFromRef} | Expira: ${expiresAt.toLocaleDateString('pt-BR')}`,
  };
}

// ── Handler Vercel ───────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Aceita apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Health check: GET /api/pagbank-webhook
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'PagBank webhook ativo' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log('[PagBank Webhook] Payload recebido:', JSON.stringify(body).slice(0, 300));

    const result = await processWebhook(body);
    return res.status(result.status).json({ message: result.message });

  } catch (err) {
    console.error('[PagBank Webhook] Erro:', err.message);
    // Retorna 200 para o PagBank não retentar — o erro foi interno
    return res.status(200).json({ error: err.message, note: 'Erro interno — verifique os logs' });
  }
}
