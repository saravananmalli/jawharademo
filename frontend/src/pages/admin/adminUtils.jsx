/* ── Status colour definitions ──────────────────────────────────── */
const STATUS_DEF = {
  pending:    { bg: 'bg-orange-50 dark:bg-orange-900/20',  text: 'text-orange-700 dark:text-orange-400' },
  processing: { bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-700 dark:text-blue-400' },
  shipped:    { bg: 'bg-sky-50 dark:bg-sky-900/20',       text: 'text-sky-700 dark:text-sky-400' },
  delivered:  { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400' },
  cancelled:  { bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400' },
  paid:       { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400' },
  failed:     { bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400' },
  unpaid:     { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400' },
  active:     { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400' },
  blocked:    { bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400' },
  admin:      { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-400' },
  customer:   { bg: 'bg-gray-100 dark:bg-gray-800',       text: 'text-gray-600 dark:text-gray-400' },
  approved:   { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400' },
  rejected:   { bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400' },
  inStock:    { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400' },
  outOfStock: { bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400' },
  'Best Seller': { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400' },
  new:        { bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-700 dark:text-blue-400' },
  sale:       { bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400' },
};

const FALLBACK = { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' };

/**
 * Status chip — Tailwind version, no MUI dependency.
 */
export function StatusChip({ status, label }) {
  const def = STATUS_DEF[status] || FALLBACK;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${def.bg} ${def.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${def.text.replace('text-', 'bg-').split(' ')[0]}`} />
      {label ?? status}
    </span>
  );
}

/**
 * KPI icon background — kept for any legacy references.
 */
export function getKpiColors(variant) {
  const map = {
    gold:   { bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-600 dark:text-amber-400' },
    maroon: { bg: 'bg-rose-100 dark:bg-rose-900/30',     text: 'text-rose-600 dark:text-rose-400' },
    green:  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
    blue:   { bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-600 dark:text-blue-400' },
  };
  return map[variant] || map.gold;
}
