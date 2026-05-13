/* ─── Avatar colors ─── */
export const AVATAR_COLORS = [
  'linear-gradient(135deg,#3B82F6,#1D4ED8)',
  'linear-gradient(135deg,#8B5CF6,#6D28D9)',
  'linear-gradient(135deg,#22C55E,#16A34A)',
  'linear-gradient(135deg,#F59E0B,#D97706)',
  'linear-gradient(135deg,#EC4899,#BE185D)',
  'linear-gradient(135deg,#14B8A6,#0D9488)',
  'linear-gradient(135deg,#F97316,#EA580C)',
  'linear-gradient(135deg,#6366F1,#4338CA)',
];

export function getAvatarColor(str) {
  if (!str) return AVATAR_COLORS[0];
  const idx = str.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

/* ─── Date helpers ─── */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export function formatRelative(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return formatDate(dateStr);
}

/* ─── Number helpers ─── */
export function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

export function formatNumber(val) {
  return new Intl.NumberFormat('pt-BR').format(val || 0);
}

export function formatPercent(val, decimals = 1) {
  return `${(val || 0).toFixed(decimals)}%`;
}

/* ─── Status configs ─── */
export const STATUS_LABELS = {
  new:         { label: 'Novo',        color: '#3B82F6', bg: 'rgba(59,130,246,.12)' },
  contacted:   { label: 'Contactado',  color: '#F59E0B', bg: 'rgba(245,158,11,.12)' },
  negotiation: { label: 'Negociação',  color: '#8B5CF6', bg: 'rgba(139,92,246,.12)' },
  closed:      { label: 'Fechado',     color: '#22C55E', bg: 'rgba(34,197,94,.12)'  },
  lost:        { label: 'Perdido',     color: '#EF4444', bg: 'rgba(239,68,68,.12)'  },
};

export const PLAN_LABELS = {
  trial:   { label: 'Trial',   color: '#F59E0B', icon: '⏱'  },
  starter: { label: 'Starter', color: '#64748B', icon: '🌱'  },
  pro:     { label: 'Pro',     color: '#3B82F6', icon: '🚀'  },
  premium: { label: 'Premium', color: '#8B5CF6', icon: '💎'  },
};

export const NICHES = [
  'Varejo / Loja', 'Restaurante / Delivery', 'Saúde / Estética',
  'Imóveis', 'Educação', 'Serviços', 'Tecnologia',
  'Jurídico', 'Consultoria', 'E-commerce', 'Outro',
];

/* ─── Mock data generators ─── */
export function generateMockMetrics() {
  const now = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const base = 80 + Math.sin(i * 0.5) * 30;
    const weekend = [0, 6].includes(d.getDay()) ? 0.6 : 1;
    return {
      date: d.toISOString().split('T')[0],
      conversations_count: Math.floor((base + Math.random() * 40) * weekend),
      leads_count:         Math.floor((base * 0.4 + Math.random() * 20) * weekend),
      conversion_rate:     parseFloat((28 + Math.random() * 15).toFixed(1)),
      avg_response_time:   parseFloat((0.3 + Math.random() * 0.8).toFixed(2)),
      messages_sent:       Math.floor((base * 3 + Math.random() * 100) * weekend),
      revenue:             Math.floor((base * 50 + Math.random() * 2000) * weekend),
    };
  });
}

export function generateSparkData(count = 20) {
  return Array.from({ length: count }, (_, i) => ({
    val: 30 + Math.sin(i * 0.7) * 20 + Math.random() * 30,
  }));
}

/* ─── Trial helpers ─── */
export function getTrialDaysLeft(trialEnd) {
  if (!trialEnd) return 7;
  const diff = new Date(trialEnd) - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function isTrialExpired(trialEnd) {
  if (!trialEnd) return false;
  return new Date(trialEnd) < new Date();
}

/* ─── String helpers ─── */
export function truncate(str, len = 40) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}
