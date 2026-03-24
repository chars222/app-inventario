export const PRODUCT_COLORS: Record<string, string> = {
  Blue:  'text-blue-600 bg-blue-50',
  Navy:  'text-indigo-800 bg-indigo-50',
  Red:   'text-red-600 bg-red-50',
  Black: 'text-slate-800 bg-slate-100',
  White: 'text-slate-600 bg-white border border-slate-200',
  Green: 'text-emerald-600 bg-emerald-50',
};

export const fmt = (n: number) =>
  new Intl.NumberFormat('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

export const getPeriodDates = (period: string) => {
  const now = new Date();
  if (period === 'today') {
    const s = new Date(now); s.setHours(0, 0, 0, 0);
    return { from: s.toISOString(), to: now.toISOString() };
  }
  if (period === 'week') {
    const s = new Date(now); s.setDate(s.getDate() - 7);
    return { from: s.toISOString(), to: now.toISOString() };
  }
  if (period === 'month') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: s.toISOString(), to: now.toISOString() };
  }
  return {};
};

export const PERIODS = [
  { key: 'today', label: 'Hoy' },
  { key: 'week',  label: '7 días' },
  { key: 'month', label: 'Este mes' },
];